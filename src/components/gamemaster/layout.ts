import {
  FEATURES,
  GAME_MASTER_EXPRESSIONS,
  GAME_MASTER_MESSAGES,
  MISSION_MESSAGES,
  PHASE_GAME_MASTER,
} from "@/config/gameConfig";
import type { GamePhase } from "@/game/types";
import type { GameMasterProps } from "./GameMaster";
import type { Narration } from "./narration";

/**
 * How big she is in each scene. Task-heavy scenes shrink her so she never competes with
 * the content; the signature moments give her room.
 */
const PHASE_SIZE: Partial<Record<GamePhase, NonNullable<GameMasterProps["size"]>>> = {
  ready: "large",
  task: "small",
  countdown: "small",
  proof: "small",
  deadline: "small",
};

/** With no clock running, the mission screen gets a line of its own. */
function missionMessage(phase: GamePhase, hasEvidence: boolean): string | undefined {
  if (phase !== "countdown" || FEATURES.schedule) return undefined;
  return hasEvidence ? MISSION_MESSAGES.submitted : MISSION_MESSAGES.active;
}

export function resolveGameMaster(
  phase: GamePhase,
  opts: { narration: Narration | null; everyoneReady: boolean; hasEvidence: boolean },
): (GameMasterProps & { visible: boolean }) | null {
  let state = PHASE_GAME_MASTER[phase];
  if (!state) return null;

  // The lobby line changes once the last girl is ready, just before the scene moves on.
  if (phase === "lobby" && opts.everyoneReady) state = "ready";

  const { narration } = opts;
  return {
    state,
    visible: true,
    expression: narration?.expression ?? GAME_MASTER_EXPRESSIONS[state],
    message: narration?.message ?? missionMessage(phase, opts.hasEvidence) ?? GAME_MASTER_MESSAGES[state],
    size: PHASE_SIZE[phase] ?? "medium",
    position: "right",
  };
}
