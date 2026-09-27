import { Button } from "@/components/ui/Button";
import { useGameDispatch, usePublicGame, useRevealedGame } from "@/game/GameProvider";
import { useTimeline } from "@/hooks/useTimeline";
import { Reveal } from "@/motion/Reveal";
import { PunishmentCard } from "./PunishmentCard";
import "@/components/reveal/reveal.css";

export function PunishmentScreen() {
  const revealed = useRevealedGame();
  const { currentUserId } = usePublicGame();
  const dispatch = useGameDispatch();
  const step = useTimeline([1000, 2600]);

  if (!revealed) return null;

  return (
    <section className="scene punishment" aria-labelledby="punish-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">You knew</p>
        <h1 id="punish-title" className="display display-lg">
          THE CONSEQUENCE
        </h1>
      </div>

      <Reveal show={step >= 1} className="pcons-list">
        {revealed.failed.map(({ participant, punishment }) =>
          punishment ? (
            <PunishmentCard
              key={participant.id}
              name={participant.name}
              punishment={punishment}
              isYou={participant.id === currentUserId}
            />
          ) : null,
        )}
      </Reveal>

      <Reveal show={step >= 2}>
        <Button size="lg" arrow onClick={() => dispatch({ type: "FINISH" })}>
          Close the night
        </Button>
      </Reveal>
    </section>
  );
}
