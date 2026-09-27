import { FEATURES, PROGRESS_STEPS } from "@/config/gameConfig";
import { usePublicGame } from "@/game/GameProvider";

const STEPS = PROGRESS_STEPS.filter((s) => !s.feature || FEATURES[s.feature]);

/** A quiet rail of the night's chapters. Reveals nothing beyond how far along the game is. */
export function GameProgress() {
  const { phase } = usePublicGame();
  const current = STEPS.findIndex((s) => s.phases.includes(phase));

  return (
    <ol className="gprogress" aria-label="Game progress">
      {STEPS.map((step, i) => {
        const state = current < 0 ? "todo" : i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={step.label} className={`gprogress__step gprogress__step--${state}`} aria-current={state === "current" ? "step" : undefined}>
            <span className="gprogress__dot" aria-hidden="true" />
            <span>{step.label}</span>
            <span className="sr-only">{state === "done" ? " (done)" : state === "current" ? " (current)" : ""}</span>
          </li>
        );
      })}
    </ol>
  );
}
