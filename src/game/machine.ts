import { GAME_CONFIG, type Features } from "@/config/gameConfig";
import type {
  Assignment,
  GamePhase,
  GameState,
  Proof,
  Punishment,
  Task,
} from "./types";

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

export type Action =
  | { type: "ENTER" }
  | { type: "JOIN"; id: string; self?: boolean }
  | { type: "LEAVE" }
  | { type: "SET_READY"; id: string }
  | { type: "GATHER" }
  | {
      type: "BEGIN_ASSIGNMENT";
      assignments: Assignment[];
      tasks: Record<string, Task>;
      punishments: Record<string, Punishment>;
      simulatedSubmissions: Record<string, boolean>;
    }
  | { type: "ASSIGNMENT_DONE" }
  | { type: "OPEN_MISSION"; now: number }
  | { type: "ACCEPT_MISSION" }
  | { type: "OPEN_PROOF" }
  | { type: "CLOSE_PROOF" }
  | { type: "SUBMIT_PROOF"; proof: Proof }
  | { type: "TIME_UP"; now: number }
  | { type: "OPEN_MIDNIGHT" }
  | { type: "AFTER_MIDNIGHT" }
  | { type: "SHOW_PUNISHMENT" }
  | { type: "FINISH" }
  | { type: "PLAY_AGAIN" }
  | { type: "RESTART" }
  /** Preview tooling only. */
  | { type: "PREVIEW_SET_DEADLINE"; deadline: number };

type ActionType = Action["type"];

/* ------------------------------------------------------------------ */
/* Transition table — the single source of truth for phase changes    */
/* ------------------------------------------------------------------ */

type Target = GamePhase | ((state: GameState) => GamePhase | null);

function makeTransitions(features: Features): Record<GamePhase, Partial<Record<ActionType, Target>>> {
  return {
    welcome: { ENTER: "lobby" },
    lobby: { GATHER: (s) => (everyoneReady(s) ? "ready" : null) },
    ready: { BEGIN_ASSIGNMENT: "assignment" },
    assignment: { ASSIGNMENT_DONE: "manito-reveal" },
    "manito-reveal": { OPEN_MISSION: "task" },
    // `countdown` doubles as the mission hub when the schedule is off: same screen, no clock.
    task: { ACCEPT_MISSION: "countdown", TIME_UP: "deadline" },
    countdown: { OPEN_PROOF: "proof", TIME_UP: "deadline" },
    proof: { CLOSE_PROOF: "countdown", TIME_UP: "deadline" },
    deadline: { OPEN_MIDNIGHT: "midnight" },
    midnight: {
      AFTER_MIDNIGHT: (s) => (features.consequences && failedIds(s).length > 0 ? "failed" : "complete"),
    },
    failed: { SHOW_PUNISHMENT: "punishment" },
    punishment: { FINISH: "complete" },
    complete: { PLAY_AGAIN: "lobby" },
  };
}

/** Actions that mutate data but never change the phase. Keyed by the phases where they're legal. */
const IN_PLACE: Partial<Record<ActionType, GamePhase[]>> = {
  JOIN: ["lobby"],
  LEAVE: ["lobby"],
  SET_READY: ["lobby"],
  SUBMIT_PROOF: ["proof"],
  PREVIEW_SET_DEADLINE: ["task", "countdown", "proof"],
};

/* ------------------------------------------------------------------ */
/* Derived helpers (kept here so the machine has no UI dependencies)  */
/* ------------------------------------------------------------------ */

export function everyoneReady(s: Pick<GameState, "presence" | "participants">): boolean {
  return s.participants.every((p) => s.presence[p.id] === "ready");
}

/** Whether a participant's mission counted. Only meaningful from the deadline onward. */
export function didSubmit(s: GameState, participantId: string): boolean {
  return participantId === s.currentUserId ? !!s.proof : !!s.simulatedSubmissions[participantId];
}

export function failedIds(s: GameState): string[] {
  return s.participants.filter((p) => !didSubmit(s, p.id)).map((p) => p.id);
}

/* ------------------------------------------------------------------ */
/* Initial state                                                       */
/* ------------------------------------------------------------------ */

export function createInitialState(): GameState {
  const participants = GAME_CONFIG.participants.map((p) => ({ ...p }));
  return {
    phase: "welcome",
    participants,
    presence: Object.fromEntries(participants.map((p) => [p.id, "waiting" as const])),
    currentUserId: undefined,
    assignments: [],
    tasks: {},
    punishments: {},
    simulatedSubmissions: {},
    deadline: undefined,
    proof: undefined,
  };
}

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

/** Builds a reducer for a given feature set. The app uses `gameReducer`; tests can enable everything. */
export function createGameReducer(features: Features) {
  const transitions = makeTransitions(features);

  return function reducer(state: GameState, action: Action): GameState {
    if (action.type === "RESTART") return createInitialState();

    const next = applyData(state, action, features);
    if (next === null) return state;

    const target = transitions[state.phase][action.type];
    if (target === undefined) {
      const legal = IN_PLACE[action.type];
      return legal?.includes(state.phase) ? next : state;
    }
    const phase = typeof target === "function" ? target(next) : target;
    return phase ? { ...next, phase } : state;
  };
}

export const gameReducer = createGameReducer(GAME_CONFIG.features);

/** Applies an action's data change; returns null when the action is invalid for this state. */
function applyData(state: GameState, action: Action, features: Features): GameState | null {
  switch (action.type) {
    case "JOIN": {
      if (state.presence[action.id] !== "waiting") return null;
      if (action.self && state.currentUserId) return null;
      return {
        ...state,
        currentUserId: action.self ? action.id : state.currentUserId,
        presence: { ...state.presence, [action.id]: "joined" },
      };
    }
    case "LEAVE": {
      const me = state.currentUserId;
      if (!me || state.presence[me] === "ready") return null;
      return { ...state, currentUserId: undefined, presence: { ...state.presence, [me]: "waiting" } };
    }
    case "SET_READY":
      if (state.presence[action.id] !== "joined") return null;
      return { ...state, presence: { ...state.presence, [action.id]: "ready" } };
    case "BEGIN_ASSIGNMENT":
      return {
        ...state,
        assignments: action.assignments,
        tasks: action.tasks,
        punishments: action.punishments,
        simulatedSubmissions: action.simulatedSubmissions,
        proof: undefined,
        deadline: undefined,
      };
    case "OPEN_MISSION":
      return { ...state, deadline: features.schedule ? action.now + GAME_CONFIG.taskDurationMs : undefined };
    case "SUBMIT_PROOF":
      if (!action.proof.media) return null;
      return { ...state, proof: action.proof };
    case "TIME_UP":
      // Only counts if the clock has actually run out.
      return state.deadline !== undefined && action.now >= state.deadline ? state : null;
    case "PREVIEW_SET_DEADLINE":
      return { ...state, deadline: action.deadline };
    case "PLAY_AGAIN":
      return createInitialState();
    default:
      return state;
  }
}
