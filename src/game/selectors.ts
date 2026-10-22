import { didSubmit, everyoneReady, failedIds } from "./machine";
import type {
  GamePhase,
  GameState,
  Outcome,
  Participant,
  Proof,
  Punishment,
  Task,
  TaskStatus,
} from "./types";

/**
 * The only sanctioned way for UI to read the game.
 *
 *  - selectPublic   → safe for shared components (participants, phase, clock)
 *  - selectPrivate  → the signed-in player's own secrets, and nothing else
 *  - selectRevealed → everyone's pairings, but only once the phase allows it
 *
 * A component can only leak what it is handed, so keep raw `GameState` out of the view layer.
 */

export const PHASE_ORDER: readonly GamePhase[] = [
  "welcome",
  "lobby",
  "ready",
  "assignment",
  "manito-reveal",
  "task",
  "countdown",
  "proof",
  "deadline",
  "midnight",
  "failed",
  "punishment",
  "complete",
];

export const phaseAtLeast = (phase: GamePhase, min: GamePhase) =>
  PHASE_ORDER.indexOf(phase) >= PHASE_ORDER.indexOf(min);

/* ---------------------------- public ------------------------------ */

export type PublicGame = {
  phase: GamePhase;
  participants: Participant[];
  presence: GameState["presence"];
  currentUserId?: string;
  deadline?: number;
  joinedCount: number;
  readyCount: number;
  everyoneReady: boolean;
  roundActive: boolean;
};

export function selectPublic(s: GameState): PublicGame {
  const total = s.participants.length;
  const readyCount = s.participants.filter((p) => s.presence[p.id] === "ready").length;
  const joinedCount = s.participants.filter((p) => s.presence[p.id] !== "waiting").length;
  return {
    phase: s.phase,
    participants: s.participants,
    presence: s.presence,
    currentUserId: s.currentUserId,
    deadline: s.deadline,
    joinedCount,
    readyCount,
    everyoneReady: total > 0 && everyoneReady(s),
    roundActive: phaseAtLeast(s.phase, "assignment") && s.phase !== "complete",
  };
}

/* ---------------------------- private ----------------------------- */

/** One mission plus whatever the current player has (or hasn't) submitted for it. */
export type MissionProgress = {
  mission: Task;
  proof?: Proof;
  status: TaskStatus;
};

export type PrivateGame = {
  me: Participant;
  manito?: Participant;
  /** The dare, then the Manito photo, then the group photo — in that fixed order. */
  missions: MissionProgress[];
  /** The mission the Evidence screen is currently open on, if any. */
  editing?: MissionProgress;
  /** True once every mission has a proof attached. */
  allSubmitted: boolean;
  /** Only set once the consequence has been announced. */
  punishment?: Punishment;
};

export function missionStatusFor(phase: GamePhase, hasProof: boolean): TaskStatus {
  switch (phase) {
    case "manito-reveal":
      return "locked";
    case "task":
    case "countdown":
    case "proof":
      return hasProof ? "submitted" : "active";
    case "deadline":
      return hasProof ? "submitted" : "expired";
    case "midnight":
    case "failed":
    case "punishment":
    case "complete":
      return hasProof ? "approved" : "failed";
    default:
      return "locked";
  }
}

export function selectPrivate(s: GameState): PrivateGame | null {
  const me = s.participants.find((p) => p.id === s.currentUserId);
  if (!me || !phaseAtLeast(s.phase, "manito-reveal")) return null;

  const receiverId = s.assignments.find((a) => a.giverId === me.id)?.receiverId;
  const myMissions = s.tasks[me.id] ?? [];
  const missions: MissionProgress[] = myMissions.map((mission) => {
    const proof = s.proofs[mission.id];
    return { mission, proof, status: missionStatusFor(s.phase, !!proof) };
  });

  const showPunishment = s.phase === "punishment" || s.phase === "complete";
  return {
    me,
    manito: s.participants.find((p) => p.id === receiverId),
    missions,
    editing: s.editingMissionId ? missions.find((m) => m.mission.id === s.editingMissionId) : undefined,
    allSubmitted: missions.length > 0 && missions.every((m) => !!m.proof),
    punishment: showPunishment && !didSubmit(s, me.id) ? s.punishments[me.id] : undefined,
  };
}

/* ---------------------------- revealed ---------------------------- */

export type RevealRow = {
  giver: Participant;
  receiver: Participant;
  outcome: Outcome;
};

export type RevealedGame = {
  rows: RevealRow[];
  failed: { participant: Participant; punishment?: Punishment }[];
};

export function selectRevealed(s: GameState): RevealedGame | null {
  if (!phaseAtLeast(s.phase, "midnight")) return null;
  const byId = new Map(s.participants.map((p) => [p.id, p]));

  const rows: RevealRow[] = s.assignments.flatMap((a) => {
    const giver = byId.get(a.giverId);
    const receiver = byId.get(a.receiverId);
    if (!giver || !receiver) return [];
    return [{ giver, receiver, outcome: (didSubmit(s, giver.id) ? "approved" : "failed") as Outcome }];
  });

  const showPunishments = phaseAtLeast(s.phase, "punishment");
  const failed = failedIds(s).flatMap((id) => {
    const participant = byId.get(id);
    return participant
      ? [{ participant, punishment: showPunishments ? s.punishments[id] : undefined }]
      : [];
  });

  return { rows, failed };
}
