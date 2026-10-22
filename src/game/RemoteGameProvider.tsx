import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { GAME_CONFIG } from "@/config/gameConfig";
import { GAME_ID } from "@/lib/remoteMode";
import { ensureAnonymousSession, supabase } from "@/lib/supabaseClient";
import { GameApiContext, type GameApi } from "./gameContext";
import type { Action } from "./machine";
import type { ManitoRow, PlayerRow, ProofRow, PunishmentRow, TaskRow } from "./remote/dbTypes";
import * as remote from "./remote/queries";
import { phaseAtLeast, PHASE_ORDER, selectPrivate, selectPublic, selectRevealed } from "./selectors";
import type { Assignment, GamePhase, GameState, MissionSlot, Presence, Proof, Punishment, Task } from "./types";

const LOCAL_PHASE_KEY = "manito:v3:local-phase";
const MISSIONS_PER_PLAYER = 3;

function readLocalPhase(): GamePhase {
  try {
    const saved = window.localStorage.getItem(LOCAL_PHASE_KEY);
    return saved && (PHASE_ORDER as readonly string[]).includes(saved) ? (saved as GamePhase) : "welcome";
  } catch {
    return "welcome";
  }
}

/**
 * Real multiplayer mode: up to five phones share one live game over Supabase. Four things are
 * genuinely shared (lobby presence, the draw, and — if FEATURES.schedule/consequences are ever
 * switched on — the deadline and the midnight reveal); everything after the draw (reading your
 * missions, opening the evidence form) is personal screen-navigation and stays purely local to
 * each phone, so nobody is forced to move in lockstep with anyone else.
 *
 * It rebuilds a GameState-shaped object from the live Supabase data each render and hands it to
 * the exact same selectPublic/selectPrivate/selectRevealed used by local mode — so a given
 * client only ever holds the slice of data it already has (its own missions/manito/proofs, plus
 * everyone's once the reveal phase is reached), never anyone else's secrets.
 *
 * See supabase/README.md for what each table/column means, and schema.sql for the privacy rules.
 */
export function RemoteGameProvider({ children }: { children: ReactNode }) {
  const toast = useToast();

  const [authUid, setAuthUid] = useState<string | undefined>();
  const [globalPhase, setGlobalPhase] = useState<GamePhase>("lobby");
  const [globalDeadlineMs, setGlobalDeadlineMs] = useState<number | undefined>();
  const [playerRows, setPlayerRows] = useState<PlayerRow[]>([]);
  const [localPhase, setLocalPhaseState] = useState<GamePhase>(readLocalPhase);
  const [editingMissionId, setEditingMissionId] = useState<MissionSlot | undefined>();

  const [myManito, setMyManito] = useState<string | undefined>();
  const [myMissions, setMyMissions] = useState<Task[] | undefined>();
  const [myProofs, setMyProofs] = useState<Record<string, Proof>>({});

  const [allAssignments, setAllAssignments] = useState<Assignment[] | undefined>();
  const [allSubmitted, setAllSubmitted] = useState<Record<string, boolean> | undefined>();
  const [allPunishments, setAllPunishments] = useState<Record<string, Punishment> | undefined>();

  const setLocalPhase = useCallback((next: GamePhase) => {
    setLocalPhaseState(next);
    try {
      window.localStorage.setItem(LOCAL_PHASE_KEY, next);
    } catch {
      // private browsing / storage full: navigation still works, it just won't survive a refresh
    }
  }, []);

  /* ---- who am I, right now, in this game? ---- */
  const { presence, myId } = useMemo(() => {
    const presenceMap: Record<string, Presence> = Object.fromEntries(
      GAME_CONFIG.participants.map((p) => [p.id, "waiting" as Presence]),
    );
    let id: string | undefined;
    for (const row of playerRows) {
      presenceMap[row.participant_id] = row.status;
      if (authUid && row.claimed_by === authUid) id = row.participant_id;
    }
    return { presence: presenceMap, myId: id };
  }, [playerRows, authUid]);

  /* ---- my own mission navigation: "the draw already happened" overrides to my own progress,
     a shared dramatic moment (deadline/midnight/...) overrides everything, same as before. ---- */
  const effectivePhase: GamePhase =
    localPhase === "welcome"
      ? "welcome"
      : phaseAtLeast(globalPhase, "deadline")
        ? globalPhase
        : phaseAtLeast(localPhase, "manito-reveal")
          ? localPhase
          : globalPhase;

  /* ---- 1. a stable identity for this device ---- */
  useEffect(() => {
    let alive = true;
    ensureAnonymousSession()
      .then((uid) => alive && setAuthUid(uid))
      .catch((err) => console.error("MANITO: anonymous sign-in failed", err));
    return () => {
      alive = false;
    };
  }, []);

  /* ---- 2. the shared game row + the seating chart, live ---- */
  useEffect(() => {
    if (!supabase) return;
    let alive = true;

    const client = supabase;

    void client
      .from("games")
      .select("phase, deadline")
      .eq("id", GAME_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (!alive || !data) return;
        setGlobalPhase(data.phase as GamePhase);
        setGlobalDeadlineMs(data.deadline ? new Date(data.deadline).getTime() : undefined);
      });

    const refetchPlayers = () =>
      void client
        .from("players")
        .select("participant_id, status, claimed_by")
        .eq("game_id", GAME_ID)
        .then(({ data }) => alive && data && setPlayerRows(data as PlayerRow[]));
    refetchPlayers();

    const channel = client
      .channel(`manito-game-${GAME_ID}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${GAME_ID}` },
        (payload) => {
          const row = payload.new as { phase?: string; deadline?: string | null } | undefined;
          if (!row?.phase) return;
          setGlobalPhase(row.phase as GamePhase);
          setGlobalDeadlineMs(row.deadline ? new Date(row.deadline).getTime() : undefined);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `game_id=eq.${GAME_ID}` }, refetchPlayers)
      .subscribe();

    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, []);

  /* ---- 3. my own manito / missions / proofs, live — nobody else's ---- */
  useEffect(() => {
    if (!supabase || !myId) return;
    let alive = true;
    const client = supabase;

    void Promise.all([
      client.from("manitos").select("receiver_id").eq("game_id", GAME_ID).eq("giver_id", myId).maybeSingle(),
      client.from("tasks").select("missions").eq("game_id", GAME_ID).eq("participant_id", myId).maybeSingle(),
      client.from("proofs").select("mission_id, proof").eq("game_id", GAME_ID).eq("participant_id", myId),
    ]).then(([m, t, p]) => {
      if (!alive) return;
      if (m.data) setMyManito((m.data as ManitoRow).receiver_id);
      if (t.data) setMyMissions((t.data as TaskRow).missions);
      if (p.data) setMyProofs(Object.fromEntries((p.data as ProofRow[]).map((row) => [row.mission_id, row.proof])));
    });

    const channel = client
      .channel(`manito-mine-${myId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "manitos", filter: `giver_id=eq.${myId}` },
        (payload) => {
          const row = payload.new as ManitoRow | undefined;
          if (row) setMyManito(row.receiver_id);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `participant_id=eq.${myId}` }, (payload) => {
        const row = payload.new as TaskRow | undefined;
        if (row) setMyMissions(row.missions);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "proofs", filter: `participant_id=eq.${myId}` }, (payload) => {
        const row = payload.new as ProofRow | undefined;
        if (row) setMyProofs((prev) => ({ ...prev, [row.mission_id]: row.proof }));
      })
      .subscribe();

    return () => {
      alive = false;
      void client.removeChannel(channel);
    };
  }, [myId]);

  /* ---- 4. once we're in a reveal phase, everyone's pairing/submission/consequence (RLS now
     permits it — see schema.sql). Refetched on every phase change while revealed, since what's
     visible genuinely changes as the phase advances (punishments only unlock at 'punishment'). ---- */
  useEffect(() => {
    if (!supabase || !phaseAtLeast(effectivePhase, "midnight")) return;
    let alive = true;
    const client = supabase;

    void Promise.all([
      client.from("manitos").select("giver_id, receiver_id").eq("game_id", GAME_ID),
      client.from("proofs").select("participant_id, mission_id").eq("game_id", GAME_ID),
      client.from("punishments").select("participant_id, punishment").eq("game_id", GAME_ID),
    ]).then(([m, p, pu]) => {
      if (!alive) return;
      setAllAssignments(((m.data ?? []) as ManitoRow[]).map((r) => ({ giverId: r.giver_id, receiverId: r.receiver_id })));

      // "submitted" means all three mission slots have a proof row, not just one.
      const counts = new Map<string, number>();
      for (const row of (p.data ?? []) as { participant_id: string; mission_id: string }[]) {
        counts.set(row.participant_id, (counts.get(row.participant_id) ?? 0) + 1);
      }
      setAllSubmitted(
        Object.fromEntries(
          GAME_CONFIG.participants.map((pt) => [pt.id, (counts.get(pt.id) ?? 0) >= MISSIONS_PER_PLAYER]),
        ),
      );

      setAllPunishments(
        Object.fromEntries(((pu.data ?? []) as PunishmentRow[]).map((r) => [r.participant_id, r.punishment])),
      );
    });

    return () => {
      alive = false;
    };
  }, [effectivePhase]);

  /* ---- a round just restarted: forget the previous round's private data and go back to the
     lobby locally too (but never interrupt someone who's still mid-welcome-intro). ---- */
  const prevGlobalPhase = useRef<GamePhase>("lobby");
  useEffect(() => {
    const was = prevGlobalPhase.current;
    if (globalPhase === "lobby" && phaseAtLeast(was, "assignment")) {
      setLocalPhaseState((current) => {
        if (current === "welcome") return current;
        try {
          window.localStorage.setItem(LOCAL_PHASE_KEY, "lobby");
        } catch {
          // ignore
        }
        return "lobby";
      });
      setEditingMissionId(undefined);
      setMyManito(undefined);
      setMyMissions(undefined);
      setMyProofs({});
      setAllAssignments(undefined);
      setAllSubmitted(undefined);
      setAllPunishments(undefined);
    }
    prevGlobalPhase.current = globalPhase;
  }, [globalPhase]);

  /* ---- the one way anything writes back ---- */
  const dispatch = useCallback(
    (action: Action) => {
      switch (action.type) {
        case "ENTER":
          setLocalPhase("lobby");
          return;

        case "JOIN":
          if (!action.self || !authUid) return;
          void remote.claimSeat(action.id, authUid).catch((err) => {
            console.error("MANITO: couldn't claim that seat", err);
            toast.push("Someone just took that seat — try another");
          });
          return;

        case "LEAVE":
          if (!myId || !authUid) return;
          void remote.releaseSeat(myId, authUid).catch((err) => console.error("MANITO: couldn't leave the seat", err));
          return;

        case "SET_READY":
          if (!authUid) return;
          void remote.setReady(action.id, authUid).catch((err) => console.error("MANITO: couldn't set ready", err));
          return;

        case "GATHER":
          void remote.advancePhase("lobby", "ready").catch((err) => console.error("MANITO: couldn't gather", err));
          return;

        case "BEGIN_ASSIGNMENT":
          // the payload was computed client-side for local mode's benefit; remote mode discards
          // it and draws server-side instead, so two phones can never produce two different draws.
          void remote.beginDraw().catch((err) => {
            console.error("MANITO: couldn't begin the draw", err);
            toast.push("Couldn't start the draw — try again");
          });
          return;

        case "ASSIGNMENT_DONE":
          setLocalPhase("manito-reveal");
          return;
        case "OPEN_MISSION":
          setLocalPhase("task");
          return;
        case "ACCEPT_MISSION":
          setLocalPhase("countdown");
          return;
        case "OPEN_PROOF":
          setEditingMissionId(action.missionId);
          setLocalPhase("proof");
          return;
        case "CLOSE_PROOF":
          setLocalPhase("countdown");
          return;

        case "SUBMIT_PROOF":
          if (!myId) return;
          setMyProofs((prev) => ({ ...prev, [action.missionId]: action.proof })); // optimistic: avoids a flash back to the empty form while the write is in flight
          void remote
            .submitProof(myId, action.missionId, action.proof)
            .catch((err) => console.error("MANITO: couldn't submit evidence", err));
          return;

        case "TIME_UP":
          void remote.timeUp(action.now).catch(() => {});
          return;

        case "PREVIEW_SET_DEADLINE":
          void remote.setDeadline(action.deadline).catch((err) => console.error("MANITO: couldn't set the preview deadline", err));
          return;

        case "OPEN_MIDNIGHT":
          void remote.advancePhase("deadline", "midnight").catch((err) => console.error("MANITO: couldn't open midnight", err));
          return;

        case "AFTER_MIDNIGHT": {
          const submitted = allSubmitted ?? {};
          const anyoneFailed = GAME_CONFIG.participants.some((p) => !submitted[p.id]);
          const target = GAME_CONFIG.features.consequences && anyoneFailed ? "failed" : "complete";
          void remote.advancePhase("midnight", target).catch((err) => console.error("MANITO: couldn't resolve midnight", err));
          return;
        }

        case "SHOW_PUNISHMENT":
          void remote.advancePhase("failed", "punishment").catch((err) => console.error("MANITO: couldn't show the punishment", err));
          return;
        case "FINISH":
          void remote.advancePhase("punishment", "complete").catch((err) => console.error("MANITO: couldn't finish", err));
          return;

        case "PLAY_AGAIN":
        case "RESTART":
          void remote.restartGame().catch((err) => console.error("MANITO: couldn't restart", err));
          return;

        default:
          return;
      }
    },
    [authUid, myId, allSubmitted, setLocalPhase, toast],
  );

  const synthState: GameState = useMemo(
    () => ({
      phase: effectivePhase,
      participants: GAME_CONFIG.participants,
      presence,
      currentUserId: myId,
      assignments: allAssignments ?? (myId && myManito ? [{ giverId: myId, receiverId: myManito }] : []),
      tasks: myId && myMissions ? { [myId]: myMissions } : {},
      punishments: allPunishments ?? {},
      simulatedSubmissions: allSubmitted ?? {},
      deadline: globalDeadlineMs,
      proofs: myProofs,
      editingMissionId,
    }),
    [
      effectivePhase,
      presence,
      myId,
      allAssignments,
      myManito,
      myMissions,
      allPunishments,
      allSubmitted,
      globalDeadlineMs,
      myProofs,
      editingMissionId,
    ],
  );

  const api: GameApi = useMemo(
    () => ({
      public: selectPublic(synthState),
      private: selectPrivate(synthState),
      revealed: selectRevealed(synthState),
      dispatch,
    }),
    [synthState, dispatch],
  );

  return <GameApiContext.Provider value={api}>{children}</GameApiContext.Provider>;
}
