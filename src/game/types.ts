export type Participant = {
  id: string;
  name: string;
};

/** giver is responsible for (gifts / completes missions for) receiver — the giver's "Manito". */
export type Assignment = {
  giverId: string;
  receiverId: string;
};

export type GamePhase =
  | "welcome"
  | "lobby"
  | "ready"
  | "assignment"
  | "manito-reveal"
  | "task"
  | "countdown"
  | "proof"
  | "deadline"
  | "midnight"
  | "failed"
  | "punishment"
  | "complete";

export type Presence = "waiting" | "joined" | "ready";

/** A piece of a mission's write-up, rendered in order. */
export type TaskBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "quote"; text: string }
  /** A stage direction between lines, e.g. "dramatic pause". */
  | { kind: "aside"; text: string };

export type ProofKind = "video" | "photo";

/** The three mission slots every player gets, fixed by the house rules: one dare and two
 * picture challenges. Used as the stable id for each mission and as the key for its proof. */
export type MissionSlot = "dare" | "manito-photo" | "group-photo";

export const MISSION_SLOTS: readonly MissionSlot[] = ["dare", "manito-photo", "group-photo"];

/**
 * One assignment — a dare (video) or one of the two picture challenges (photo). Text may
 * contain a `{{manito}}` token, filled in at render time (see fillTemplate in config/missions.ts)
 * once the player's own Manito is known, so the same stored brief can read as a personal one.
 */
export type Task = {
  id: MissionSlot;
  kind: MissionSlot;
  emoji: string;
  /** Short name for the card; the write-up itself is `blocks`. */
  title: string;
  blocks: TaskBlock[];
  bonus?: string;
  proofRequired: ProofKind;
  proof: string;
  warning?: string;
};

export type ProofMedia = {
  kind: "image" | "video";
  name: string;
  size: number;
  /** Photos: a downsized data URL (survives a refresh). Videos: an in-memory blob URL (does not). */
  url?: string;
};

export type Proof = {
  note?: string;
  media: ProofMedia;
  submittedAt: number;
};

export type Punishment = {
  id: string;
  title: string;
  description: string;
  /** Time allowed to carry it out once the consequence is announced. */
  durationMs?: number;
};

export type TaskStatus = "locked" | "active" | "submitted" | "approved" | "failed" | "expired";
export type Outcome = "approved" | "failed";

export type GameMasterState =
  | "welcome"
  | "ready"
  | "assignment"
  | "task"
  | "countdown"
  | "deadline"
  | "proof"
  | "midnight"
  | "failed"
  | "punishment"
  | "complete";

export type Expression =
  | "smirking"
  | "curious"
  | "surprised"
  | "amused"
  | "disappointed"
  | "proud"
  | "mischievous";

/**
 * Everything the client holds. In this frontend-only build the full record lives in
 * memory, but it is only ever read through the selectors in `selectors.ts`, which
 * gate private data by phase and by `currentUserId`. When a backend arrives, the
 * private fields (assignments, tasks, punishments, simulatedSubmissions) are what
 * moves server-side.
 */
export type GameState = {
  phase: GamePhase;
  participants: Participant[];
  presence: Record<string, Presence>;
  currentUserId?: string;
  assignments: Assignment[];
  /** Each participant's three missions: dare, Manito photo, group photo — in that order. */
  tasks: Record<string, Task[]>;
  punishments: Record<string, Punishment>;
  /** Preview only: stands in for the other girls' submissions. */
  simulatedSubmissions: Record<string, boolean>;
  /** Epoch ms. */
  deadline?: number;
  /** The current player's own proofs, keyed by MissionSlot. Never anyone else's. */
  proofs: Record<string, Proof>;
  /** Which of the current player's missions the Evidence screen is open on. */
  editingMissionId?: MissionSlot;
};
