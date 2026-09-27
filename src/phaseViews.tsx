import { lazy, type ComponentType } from "react";
import type { GamePhase } from "@/game/types";
import { GameLobby } from "@/components/game/GameLobby";
import { WelcomeScreen } from "@/components/welcome/WelcomeScreen";

/** Scenes after the lobby are code-split: nobody needs the midnight reveal on first paint. */
const later = <T extends ComponentType>(load: () => Promise<{ default: T }>) => lazy(load);

const ReadyScene = later(() => import("@/components/game/ReadyScene").then((m) => ({ default: m.ReadyScene })));
const AssignmentSequence = later(() =>
  import("@/components/assignment/AssignmentSequence").then((m) => ({ default: m.AssignmentSequence })),
);
const ManitoReveal = later(() => import("@/components/assignment/ManitoReveal").then((m) => ({ default: m.ManitoReveal })));
const TaskReveal = later(() => import("@/components/tasks/TaskReveal").then((m) => ({ default: m.TaskReveal })));
const MissionHub = later(() => import("@/components/tasks/MissionHub").then((m) => ({ default: m.MissionHub })));
const ProofSubmission = later(() => import("@/components/proof/ProofSubmission").then((m) => ({ default: m.ProofSubmission })));
const DeadlineScreen = later(() => import("@/components/tasks/DeadlineScreen").then((m) => ({ default: m.DeadlineScreen })));
const MidnightReveal = later(() => import("@/components/reveal/MidnightReveal").then((m) => ({ default: m.MidnightReveal })));
const FailedTask = later(() => import("@/components/punishment/FailedTask").then((m) => ({ default: m.FailedTask })));
const PunishmentScreen = later(() =>
  import("@/components/punishment/PunishmentScreen").then((m) => ({ default: m.PunishmentScreen })),
);
const GameComplete = later(() => import("@/components/game/GameComplete").then((m) => ({ default: m.GameComplete })));

/** One scene per phase. The shell looks the current phase up here instead of branching on it. */
export const PHASE_VIEWS: Record<GamePhase, ComponentType> = {
  welcome: WelcomeScreen,
  lobby: GameLobby,
  ready: ReadyScene,
  assignment: AssignmentSequence,
  "manito-reveal": ManitoReveal,
  task: TaskReveal,
  countdown: MissionHub,
  proof: ProofSubmission,
  deadline: DeadlineScreen,
  midnight: MidnightReveal,
  failed: FailedTask,
  punishment: PunishmentScreen,
  complete: GameComplete,
};
