import { Badge } from "@/components/ui/Badge";
import { Drawer } from "@/components/ui/Drawer";
import { useRevealedGame } from "@/game/GameProvider";
import "./reveal.css";

/** "View the night": the full record, available once the secrets are out. */
export function NightRecap({ open, onClose }: { open: boolean; onClose: () => void }) {
  const revealed = useRevealedGame();

  return (
    <Drawer open={open} onClose={onClose} title="The Night" eyebrow="Everything, now out in the open">
      {revealed && (
        <div className="recap">
          <section className="recap__section" aria-label="Who had whom">
            <p className="eyebrow eyebrow--accent">Who had whom</p>
            <ul className="recap__rows">
              {revealed.rows.map((r) => (
                <li key={r.giver.id}>
                  <span className="recap__pair">
                    {r.giver.name} <i aria-label="had">→</i> {r.receiver.name}
                  </span>
                  <Badge tone={r.outcome === "approved" ? "sage" : "burgundy"}>
                    {r.outcome === "approved" ? "Delivered" : "Missed"}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <section className="recap__section" aria-label="Consequences">
            <p className="eyebrow eyebrow--accent">Consequences</p>
            {revealed.failed.length === 0 ? (
              <p className="lede italic">Nobody missed a thing. Suspicious.</p>
            ) : (
              <ul className="recap__rows recap__rows--stack">
                {revealed.failed.map(({ participant, punishment }) => (
                  <li key={participant.id}>
                    <span className="recap__pair">{participant.name}</span>
                    {punishment && (
                      <span className="recap__punishment">
                        <b>{punishment.title}.</b> {punishment.description}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Drawer>
  );
}
