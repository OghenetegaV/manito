import { useState } from "react";
import { NightRecap } from "@/components/reveal/NightRecap";
import { Button } from "@/components/ui/Button";
import { useNarrate } from "@/components/gamemaster/narration";
import { useGameDispatch } from "@/game/GameProvider";
import { useTimeline } from "@/hooks/useTimeline";
import { Reveal } from "@/motion/Reveal";
import "@/components/reveal/reveal.css";

/** The last page of the story: calm, dark, a little bit smug. */
export function GameComplete() {
  const dispatch = useGameDispatch();
  const [recapOpen, setRecapOpen] = useState(false);
  const step = useTimeline([1000, 1900]);

  // Stage carries "That's a wrap."; the Game Master gets the closing half.
  useNarrate(step >= 2 ? "Until the next round." : "");

  return (
    <section className="scene complete" aria-labelledby="complete-title">
      <p className="eyebrow eyebrow--accent">The night is over</p>
      <h1 id="complete-title" className="display display-xl">
        GAME COMPLETE
      </h1>

      <Reveal show={step >= 1} variant="blurIn">
        <p className="lede italic">That's a wrap.</p>
      </Reveal>

      <Reveal show={step >= 2}>
        <div className="actions">
          <Button variant="ghost" onClick={() => setRecapOpen(true)}>
            View the night
          </Button>
          <Button size="lg" arrow onClick={() => dispatch({ type: "PLAY_AGAIN" })}>
            Play again
          </Button>
        </div>
      </Reveal>

      <NightRecap open={recapOpen} onClose={() => setRecapOpen(false)} />
    </section>
  );
}
