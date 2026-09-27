import { useState } from "react";
import { useGameDispatch, usePublicGame, useRevealedGame } from "@/game/GameProvider";
import { RevealSequence } from "./RevealSequence";
import "./reveal.css";

/** Midnight: the room goes dark, and the real pairings come out one by one. */
export function MidnightReveal() {
  const revealed = useRevealedGame();
  const { currentUserId } = usePublicGame();
  const dispatch = useGameDispatch();
  const [skip, setSkip] = useState(false);

  if (!revealed) return null;

  return (
    <section className="scene midnight" aria-labelledby="midnight-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">The secrets are coming out</p>
        <h1 id="midnight-title" className="display display-lg">
          MIDNIGHT REVEAL
        </h1>
      </div>

      <RevealSequence
        rows={revealed.rows}
        currentUserId={currentUserId}
        skip={skip}
        onSkip={() => setSkip(true)}
        onDone={() => dispatch({ type: "AFTER_MIDNIGHT" })}
      />
    </section>
  );
}
