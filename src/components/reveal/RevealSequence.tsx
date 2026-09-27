import { useTimeline } from "@/hooks/useTimeline";
import type { RevealRow } from "@/game/selectors";
import { Reveal } from "@/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { RevealCard } from "./RevealCard";
import "./reveal.css";

const FIRST_AT = 1500;
const GAP = 1000;

/**
 * Unveils the real pairings one at a time, in the order they were drawn, then offers the way on.
 * `onDone` fires from the button, so the player controls when the night moves on.
 */
export function RevealSequence({
  rows,
  currentUserId,
  skip,
  onSkip,
  onDone,
}: {
  rows: RevealRow[];
  currentUserId?: string;
  skip: boolean;
  onSkip: () => void;
  onDone: () => void;
}) {
  const milestones = [...rows.map((_, i) => FIRST_AT + i * GAP), FIRST_AT + rows.length * GAP + 500];
  const step = useTimeline(milestones, skip);
  const finished = step >= milestones.length;

  return (
    <>
      <ol className="rlist" aria-label="Who had whom">
        {rows.map((row, i) => (
          <RevealCard key={row.giver.id} row={row} shown={step > i} isYou={row.giver.id === currentUserId} />
        ))}
      </ol>

      <div className="rseq__foot">
        {finished ? (
          <Reveal show>
            <Button size="lg" arrow onClick={onDone}>
              Continue
            </Button>
          </Reveal>
        ) : (
          <Button variant="quiet" onClick={onSkip}>
            Skip
          </Button>
        )}
      </div>
    </>
  );
}
