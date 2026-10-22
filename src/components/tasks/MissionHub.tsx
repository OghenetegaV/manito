import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FEATURES } from "@/config/gameConfig";
import { useGameDispatch, usePrivateGame, usePublicGame } from "@/game/GameProvider";
import type { MissionProgress } from "@/game/selectors";
import { Reveal } from "@/motion/Reveal";
import { Countdown } from "./Countdown";
import { TaskCard } from "./TaskCard";
import { TaskDetails } from "./TaskDetails";
import "./tasks.css";

/**
 * Home base once the seal is broken: a checklist of all three missions — the dare, the
 * Manito photo, the group photo — each with its own evidence button. (This is the `countdown`
 * phase; the clock only shows if the schedule feature is on.)
 */
export function MissionHub() {
  const secret = usePrivateGame();
  const { deadline } = usePublicGame();
  const dispatch = useGameDispatch();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selected, setSelected] = useState<MissionProgress | undefined>();

  if (!secret || secret.missions.length === 0) return null;
  const { missions, manito, allSubmitted } = secret;
  const doneCount = missions.filter((m) => !!m.proof).length;

  const openDetails = (m: MissionProgress) => {
    setSelected(m);
    setDetailsOpen(true);
  };

  return (
    <section className="scene hub" aria-labelledby="hub-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">{allSubmitted ? "Nicely done" : "Act natural"}</p>
        <h1 id="hub-title" className="display display-lg">
          {allSubmitted ? "All evidence is in." : "Your missions are live."}
        </h1>
        <p className="hub__progress numeral">
          {doneCount} of {missions.length} complete
        </p>
      </div>

      {FEATURES.schedule && deadline !== undefined && <Countdown deadline={deadline} />}

      <Reveal show>
        <ul className="hub__list">
          {missions.map((m) => (
            <li key={m.mission.id} className="hub__row">
              <TaskCard task={m.mission} status={m.status} variant="summary" manitoName={manito?.name} />
              <div className="actions hub__row-actions">
                <Button variant="quiet" onClick={() => openDetails(m)}>
                  Re-read
                </Button>
                <Button
                  variant={m.proof ? "ghost" : "primary"}
                  onClick={() => dispatch({ type: "OPEN_PROOF", missionId: m.mission.id })}
                >
                  {m.proof ? "View or replace" : "Upload evidence"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Reveal>

      {allSubmitted && <p className="hand hub__note">keep quiet until the final reveal</p>}

      {selected && (
        <TaskDetails
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          task={selected.mission}
          manitoName={manito?.name}
        />
      )}
    </section>
  );
}
