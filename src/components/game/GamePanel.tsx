import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FEATURES, PHASE_LABELS } from "@/config/gameConfig";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";
import { isRemoteMode } from "@/lib/remoteMode";
import { numberWord } from "@/lib/words";
import { GameProgress } from "./GameProgress";
import "./game.css";

/** Preview tooling is on in dev, or in any build opened with `?preview`. */
const PREVIEW_TOOLS = import.meta.env.DEV || new URLSearchParams(window.location.search).has("preview");

const CLOCK_PHASES = ["task", "countdown", "proof"];

/** Contents of the "Game" drawer. Public information only. */
export function GamePanel({ onClose }: { onClose: () => void }) {
  const game = usePublicGame();
  const dispatch = useGameDispatch();
  const [confirming, setConfirming] = useState(false);
  const clockRunning = CLOCK_PHASES.includes(game.phase);

  return (
    <div className="panel">
      <section className="panel__section" aria-label="Where we are">
        <p className="eyebrow">Now</p>
        <p className="display display-md">{PHASE_LABELS[game.phase]}</p>
        <GameProgress />
      </section>

      <section className="panel__section" aria-label="Players">
        <p className="eyebrow">The girls</p>
        <ul className="panel__people">
          {game.participants.map((p) => (
            <li key={p.id} className="panel__person">
              {p.name}
              {p.id === game.currentUserId && <span className="eyebrow eyebrow--accent">You</span>}
            </li>
          ))}
        </ul>
      </section>

      {FEATURES.schedule && PREVIEW_TOOLS && clockRunning && (
        <section className="panel__section" aria-label="Preview tools">
          <p className="eyebrow eyebrow--accent">Preview tools</p>
          <p className="panel__hint">For trying the ending without waiting a day. Not part of the real game.</p>
          <div className="actions" style={{ justifyContent: "flex-start" }}>
            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: "PREVIEW_SET_DEADLINE", deadline: Date.now() + 15_000 });
                onClose();
              }}
            >
              15 seconds left
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                dispatch({ type: "PREVIEW_SET_DEADLINE", deadline: Date.now() });
                onClose();
              }}
            >
              Skip to deadline
            </Button>
          </div>
        </section>
      )}

      {game.phase !== "welcome" && (
        <section className="panel__section" aria-label="Start over">
          <p className="eyebrow">Start over</p>
          {confirming ? (
            <>
              <p className="panel__hint">
                {isRemoteMode
                  ? `This wipes the draw and everyone's progress — for all ${numberWord(game.participants.length)} phones.`
                  : "This wipes the draw and everyone's progress on this device."}
              </p>
              <div className="actions" style={{ justifyContent: "flex-start" }}>
                <Button
                  onClick={() => {
                    dispatch({ type: "RESTART" });
                    onClose();
                  }}
                >
                  Yes, start over
                </Button>
                <Button variant="quiet" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="actions" style={{ justifyContent: "flex-start" }}>
              <Button variant="ghost" onClick={() => setConfirming(true)}>
                Restart the game
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
