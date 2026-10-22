import type { Presence, Proof, Punishment, Task } from "@/game/types";

/** Shapes of the rows read back from Supabase — see supabase/schema.sql. */

export type GameRow = { id: string; phase: string; deadline: string | null };

export type PlayerRow = {
  participant_id: string;
  status: Presence;
  claimed_by: string | null;
};

export type ManitoRow = { giver_id: string; receiver_id: string };
/** One row per participant: their three missions — dare, Manito photo, group photo, in order. */
export type TaskRow = { missions: Task[] };
export type PunishmentRow = { participant_id: string; punishment: Punishment };
/** One row per (participant, mission) — up to three per participant. */
export type ProofRow = { mission_id: string; proof: Proof };
