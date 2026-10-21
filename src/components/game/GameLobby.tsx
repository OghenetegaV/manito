import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";
import { useSimulatedArrivals } from "@/hooks/useSimulatedArrivals";
import { useTimeScale } from "@/hooks/useTimeline";
import { isRemoteMode } from "@/lib/remoteMode";
import { numberWord } from "@/lib/words";
import { Reveal } from "@/motion/Reveal";
import { GameStatus } from "./GameStatus";
import { ParticipantGrid } from "./ParticipantGrid";
import "./game.css";

/** How long everyone-is-ready lingers before the Game Master takes over. */
const GATHER_DELAY_MS = 2000;

export function GameLobby() {
  const game = usePublicGame();
  const dispatch = useGameDispatch();
  const scale = useTimeScale();
  const me = game.currentUserId;
  const myPresence = me ? game.presence[me] : undefined;

  // Real players join from their own phones in remote mode; only fake the other three locally.
  useSimulatedArrivals(!isRemoteMode);

  useEffect(() => {
    if (!game.everyoneReady) return;
    const timer = window.setTimeout(() => dispatch({ type: "GATHER" }), GATHER_DELAY_MS * scale);
    return () => window.clearTimeout(timer);
  }, [game.everyoneReady, dispatch, scale]);

  return (
    <section className="scene lobby" aria-labelledby="lobby-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">The lobby</p>
        <h1 id="lobby-title" className="display display-lg">
          Everyone's getting ready.
        </h1>
      </div>

      <ParticipantGrid
        participants={game.participants}
        presence={game.presence}
        currentUserId={me}
        onSelect={(id) => dispatch({ type: "JOIN", id, self: true })}
      />

      <GameStatus />

      <div className="lobby__actions" aria-live="polite">
        {!me && <p className="lede">Tap your name to take your seat.</p>}

        {me && myPresence === "joined" && (
          <Reveal show>
            <div className="actions">
              <Button variant="quiet" onClick={() => dispatch({ type: "LEAVE" })}>
                Not me
              </Button>
              <Button size="lg" arrow onClick={() => dispatch({ type: "SET_READY", id: me })}>
                I'm ready
              </Button>
            </div>
          </Reveal>
        )}

        {me && myPresence === "ready" && !game.everyoneReady && (
          <p className="lede">You're ready. Waiting for the others…</p>
        )}

        {game.everyoneReady && <p className="lede">Everyone's here.</p>}
      </div>

      {!me && (
        <p className="lobby__note">
          {isRemoteMode
            ? `Once you take a seat, the other ${numberWord(game.participants.length - 1)} join from their own phones.`
            : `Preview mode · once you take a seat, the other ${numberWord(game.participants.length - 1)} join on their own.`}
        </p>
      )}
    </section>
  );
}
