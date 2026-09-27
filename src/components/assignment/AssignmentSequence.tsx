import { useEffect, useState } from "react";
import { useNarrate } from "@/components/gamemaster/narration";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";
import { useTimeScale } from "@/hooks/useTimeline";
import { audio } from "@/services/audio";
import { AssignmentCard } from "./AssignmentCard";
import { ShuffleAnimation } from "./ShuffleAnimation";
import "./assignment.css";

const SEAL_GAP_MS = 720;
const HOLD_AFTER_MS = 1300;

type Stage = "shuffling" | "sealing" | "done";

/**
 * shuffle (accelerate → slow) → seal the five slots one at a time → hand over to the private reveal.
 * The pairings already exist by now; this sequence only stages them.
 */
export function AssignmentSequence() {
  const { participants } = usePublicGame();
  const dispatch = useGameDispatch();
  const scale = useTimeScale();
  const [stage, setStage] = useState<Stage>("shuffling");
  const [sealed, setSealed] = useState(0);

  // The Game Master watches in silence, then speaks once everything is sealed.
  useNarrate(stage === "done" ? null : "");

  useEffect(() => {
    if (stage !== "sealing") return;
    const timers = participants.map((_, i) =>
      window.setTimeout(
        () => {
          setSealed(i + 1);
          audio.play("assignment_reveal");
          if (i === participants.length - 1) setStage("done");
        },
        (i + 1) * SEAL_GAP_MS * scale,
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [stage, participants, scale]);

  useEffect(() => {
    if (stage !== "done") return;
    const timer = window.setTimeout(() => dispatch({ type: "ASSIGNMENT_DONE" }), HOLD_AFTER_MS * scale);
    return () => window.clearTimeout(timer);
  }, [stage, dispatch, scale]);

  const headline = stage === "shuffling" ? "Shuffling the names." : stage === "sealing" ? "Sealing the envelopes." : "It's done.";

  return (
    <section className="scene draw" aria-labelledby="draw-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">The draw</p>
        <h1 id="draw-title" className="display display-lg" aria-live="polite">
          {headline}
        </h1>
      </div>

      <ShuffleAnimation participants={participants} running onSettled={() => setStage("sealing")}>
        {(p, i) => <AssignmentCard participant={p} index={i} state={i < sealed ? "sealed" : "shuffling"} />}
      </ShuffleAnimation>

      <p className="eyebrow">Nobody sees anything yet</p>
    </section>
  );
}
