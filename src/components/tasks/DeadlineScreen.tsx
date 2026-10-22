import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useGameDispatch, usePrivateGame } from "@/game/GameProvider";
import { useTimeline } from "@/hooks/useTimeline";
import { Reveal } from "@/motion/Reveal";
import "./tasks.css";

const BEATS = [900, 2600];

/** The clock hit zero. Say so, note what's on file, then move on to midnight. */
export function DeadlineScreen() {
  const secret = usePrivateGame();
  const dispatch = useGameDispatch();
  const step = useTimeline(BEATS);
  const submitted = !!secret?.allSubmitted;

  return (
    <section className="scene deadline" aria-labelledby="deadline-title">
      <h1 id="deadline-title" className="display display-xl">
        TIME'S UP.
      </h1>

      <Reveal show={step >= 1}>
        <div className="stack">
          {submitted ? <Badge tone="sage">Evidence on file</Badge> : <Badge tone="burgundy">No evidence on file</Badge>}
          <p className="lede italic">{submitted ? "Your proof made it in time." : "Nothing arrived before the deadline."}</p>
        </div>
      </Reveal>

      <Reveal show={step >= 2}>
        <Button size="lg" arrow onClick={() => dispatch({ type: "OPEN_MIDNIGHT" })}>
          On to midnight
        </Button>
      </Reveal>
    </section>
  );
}
