import { useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { PARTICIPANTS } from "@/config/gameConfig";
import { numberWord } from "@/lib/words";
import { useNarrate } from "@/components/gamemaster/narration";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";
import { createRound } from "@/game/setup";
import { useTimeline } from "@/hooks/useTimeline";
import { Reveal } from "@/motion/Reveal";
import { ParticipantGrid } from "./ParticipantGrid";
import "./game.css";

/**
 * Signature moment. The Game Master (already on stage) says her two lines with a pause between:
 *   500ms  "Well… everyone's here."
 *   2300ms "Let's see who gets who."
 *   3200ms CTA appears
 */
const BEATS = [500, 2300, 3200];

export function ReadyScene() {
  const game = usePublicGame();
  const dispatch = useGameDispatch();
  const step = useTimeline(BEATS);

  useNarrate(step >= 2 ? "Let's see who gets who." : step >= 1 ? "Well… everyone's here." : "");

  const everyone = useMemo(
    () => Object.fromEntries(PARTICIPANTS.map((p) => [p.id, "ready" as const])),
    [],
  );

  return (
    <section className="scene ready" aria-labelledby="ready-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">All {numberWord(PARTICIPANTS.length)} present</p>
        <h1 id="ready-title" className="sr-only">
          Everyone is here
        </h1>
      </div>

      <ParticipantGrid
        participants={game.participants}
        presence={everyone}
        currentUserId={game.currentUserId}
        label="Everyone, ready"
      />

      <Reveal show={step >= 3}>
        <Button size="lg" arrow onClick={() => dispatch(createRound(game.participants))}>
          Find our Manitos
        </Button>
      </Reveal>
    </section>
  );
}
