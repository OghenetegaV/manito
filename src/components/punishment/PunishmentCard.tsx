import { Badge } from "@/components/ui/Badge";
import type { Punishment } from "@/game/types";
import "@/components/reveal/reveal.css";

function describeWindow(ms: number) {
  const hours = Math.round(ms / 3_600_000);
  return hours >= 48 && hours % 24 === 0 ? `Within ${hours / 24} days` : `Within ${hours} hours`;
}

/** A consequence is data (`Punishment`), so it can be swapped or extended without touching this UI. */
export function PunishmentCard({ name, punishment, isYou }: { name: string; punishment: Punishment; isYou: boolean }) {
  return (
    <article className="pcons" aria-label={`Consequence for ${name}`}>
      <header className="pcons__head">
        <p className="eyebrow eyebrow--accent">For {name}</p>
        {isYou && <Badge tone="burgundy">You</Badge>}
      </header>
      <h2 className="display display-md">{punishment.title}</h2>
      <p className="pcons__desc">{punishment.description}</p>
      {punishment.durationMs && (
        <p className="pcons__when eyebrow">{describeWindow(punishment.durationMs)}</p>
      )}
    </article>
  );
}
