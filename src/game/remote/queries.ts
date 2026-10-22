import { GAME_CONFIG } from "@/config/gameConfig";
import { GAME_ID } from "@/lib/remoteMode";
import { supabase } from "@/lib/supabaseClient";
import type { GamePhase, MissionSlot, Proof } from "@/game/types";

/**
 * The write side of remote mode. Reads live inline in RemoteGameProvider's effects (they're
 * tightly coupled to its specific state shape); this file is just the mutations, each one a
 * thin wrapper around a guarded Supabase call. See supabase/schema.sql for the table/RLS/RPC
 * definitions these assume.
 */

function client() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

const nowIso = () => new Date().toISOString();

/** Claims an unclaimed seat. No-ops (0 rows affected) if someone else got there first. */
export async function claimSeat(participantId: string, uid: string): Promise<void> {
  const { error } = await client()
    .from("players")
    .update({ status: "joined", claimed_by: uid, updated_at: nowIso() })
    .eq("game_id", GAME_ID)
    .eq("participant_id", participantId)
    .is("claimed_by", null);
  if (error) throw error;
}

export async function releaseSeat(participantId: string, uid: string): Promise<void> {
  const { error } = await client()
    .from("players")
    .update({ status: "waiting", claimed_by: null, updated_at: nowIso() })
    .eq("game_id", GAME_ID)
    .eq("participant_id", participantId)
    .eq("claimed_by", uid);
  if (error) throw error;
}

export async function setReady(participantId: string, uid: string): Promise<void> {
  const { error } = await client()
    .from("players")
    .update({ status: "ready", updated_at: nowIso() })
    .eq("game_id", GAME_ID)
    .eq("participant_id", participantId)
    .eq("claimed_by", uid);
  if (error) throw error;
}

/** A guarded compare-and-swap: only takes effect if the game is still in `from`. */
export async function advancePhase(from: GamePhase, to: GamePhase): Promise<void> {
  const { error } = await client()
    .from("games")
    .update({ phase: to, updated_at: nowIso() })
    .eq("id", GAME_ID)
    .eq("phase", from);
  if (error) throw error;
}

/** Only matters once the deadline has actually passed — same guard the reducer enforces locally. */
export async function timeUp(nowMs: number): Promise<void> {
  const { error } = await client()
    .from("games")
    .update({ phase: "deadline", updated_at: nowIso() })
    .eq("id", GAME_ID)
    .eq("phase", "assignment")
    .not("deadline", "is", null)
    .lte("deadline", new Date(nowMs).toISOString());
  if (error) throw error;
}

/** Preview tooling only (see GamePanel.tsx) — the deadline is shared, so this moves it for everyone. */
export async function setDeadline(deadlineMs: number | undefined): Promise<void> {
  const { error } = await client()
    .from("games")
    .update({ deadline: deadlineMs ? new Date(deadlineMs).toISOString() : null, updated_at: nowIso() })
    .eq("id", GAME_ID);
  if (error) throw error;
}

/**
 * Generates the pairing and deals missions/consequences, atomically, on the server — see
 * begin_draw() in supabase/schema.sql. The app's own catalogs are passed in so the SQL
 * function never has to duplicate that content. Each participant gets one dare, the shared
 * Manito-photo brief, and one group-photo challenge.
 */
export async function beginDraw(): Promise<void> {
  const deadlineMs = GAME_CONFIG.features.schedule ? Date.now() + GAME_CONFIG.taskDurationMs : null;
  const { error } = await client().rpc("begin_draw", {
    p_game_id: GAME_ID,
    p_dares: GAME_CONFIG.dares,
    p_manito_photo: GAME_CONFIG.manitoPhotoBrief,
    p_group_photos: GAME_CONFIG.groupPhotoChallenges,
    p_punishments: GAME_CONFIG.punishments,
    p_deadline_ms: deadlineMs,
  });
  if (error) throw error;
}

/** Wipes the private tables and hands every seat back — see restart_game() in schema.sql. */
export async function restartGame(): Promise<void> {
  const { error } = await client().rpc("restart_game", { p_game_id: GAME_ID });
  if (error) throw error;
}

/** Ownership is enforced by RLS (see "proofs insert/update own" in schema.sql), via the caller's own session. */
export async function submitProof(participantId: string, missionId: MissionSlot, proof: Proof): Promise<void> {
  const { error } = await client()
    .from("proofs")
    .upsert(
      {
        game_id: GAME_ID,
        participant_id: participantId,
        mission_id: missionId,
        proof,
        submitted_at: new Date(proof.submittedAt).toISOString(),
      },
      { onConflict: "game_id,participant_id,mission_id" },
    );
  if (error) throw error;
}
