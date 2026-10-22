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

/** A piece of a task's write-up, rendered in order. */
export type TaskBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "quote"; text: string }
  /** A stage direction between lines, e.g. "dramatic pause". */
  | { kind: "aside"; text: string };

export type Task = {
  id: string;
  emoji: string;
  /** Short name for the card; the write-up itself is `blocks`. */
  title: string;
  blocks: TaskBlock[];
  bonus?: string;
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
  tasks: Record<string, Task>;
  punishments: Record<string, Punishment>;
  /** Preview only: stands in for the other girls' submissions. */
  simulatedSubmissions: Record<string, boolean>;
  /** Epoch ms. */
  deadline?: number;
  proof?: Proof;
};
