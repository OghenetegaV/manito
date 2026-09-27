import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGameDispatch, usePublicGame, useRevealedGame } from "@/game/GameProvider";
import { useTimeline } from "@/hooks/useTimeline";
import { Reveal } from "@/motion/Reveal";
import "@/components/reveal/reveal.css";

/** Playful, not punishing: the fact of the miss, a shrug, and the way forward. */
export function FailedTask() {
  const revealed = useRevealedGame();
  const { currentUserId } = usePublicGame();
  const dispatch = useGameDispatch();
  const step = useTimeline([900, 2200]);

  if (!revealed) return null;
  const { failed } = revealed;
  const youFailed = failed.some((f) => f.participant.id === currentUserId);

  return (
    <section className="scene failed" aria-labelledby="failed-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">The evidence never arrived</p>
        <h1 id="failed-title" className="display display-xl">
          TASK FAILED
        </h1>
      </div>

      <Reveal show={step >= 1}>
        <ul className="failed__names" aria-label="Missed the deadline">
          {failed.map(({ participant }) => (
            <li key={participant.id} className="failed__name">
              {participant.name}
              {participant.id === currentUserId && <Badge tone="burgundy">You</Badge>}
            </li>
          ))}
        </ul>
      </Reveal>

      <Reveal show={step >= 1}>
        <p className="lede italic">{youFailed ? "It happens to the best of us." : "The deadline came and went."}</p>
      </Reveal>

      <Reveal show={step >= 2}>
        <Button size="lg" arrow onClick={() => dispatch({ type: "SHOW_PUNISHMENT" })}>
          See the consequence
        </Button>
      </Reveal>
    </section>
  );
}
