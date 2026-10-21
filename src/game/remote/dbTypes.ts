import type { Presence, Proof, Punishment, Task } from "@/game/types";

/** Shapes of the rows read back from Supabase — see supabase/schema.sql. */

export type GameRow = { id: string; phase: string; deadline: string | null };

export type PlayerRow = {
  participant_id: string;
  status: Presence;
  claimed_by: string | null;
};

export type ManitoRow = { giver_id: string; receiver_id: string };
export type TaskRow = { task: Task };
export type PunishmentRow = { participant_id: string; punishment: Punishment };
export type ProofRow = { proof: Proof };
