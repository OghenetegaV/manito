import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FEATURES } from "@/config/gameConfig";
import { useGameDispatch, usePrivateGame, usePublicGame } from "@/game/GameProvider";
import { Reveal } from "@/motion/Reveal";
import { Countdown } from "./Countdown";
import { TaskCard } from "./TaskCard";
import { TaskDetails } from "./TaskDetails";
import "./tasks.css";

/**
 * Home base once the task is accepted: a reminder of the task and one way forward, handing in
 * evidence. (This is the `countdown` phase; the clock only shows if the schedule feature is on.)
 */
export function MissionHub() {
  const secret = usePrivateGame();
  const { deadline } = usePublicGame();
  const dispatch = useGameDispatch();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!secret?.task) return null;
  const { task, proof, taskStatus } = secret;

  return (
    <section className="scene hub" aria-labelledby="hub-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">{proof ? "Nicely done" : "Act natural"}</p>
        <h1 id="hub-title" className="display display-lg">
          {proof ? "Evidence is in." : "Your mission is live."}
        </h1>
      </div>

      {FEATURES.schedule && deadline !== undefined && <Countdown deadline={deadline} />}

      <TaskCard task={task} status={taskStatus} variant="summary" />

      <Reveal show>
        {proof ? (
          <div className="stack">
            <p className="hand hub__note">keep quiet until the final reveal</p>
            <div className="actions">
              <Button variant="quiet" onClick={() => setDetailsOpen(true)}>
                Re-read my task
              </Button>
              <Button variant="ghost" onClick={() => dispatch({ type: "OPEN_PROOF" })}>
                View or replace evidence
              </Button>
            </div>
            <Badge tone="sage">Evidence received</Badge>
          </div>
        ) : (
          <div className="actions">
            <Button variant="ghost" onClick={() => setDetailsOpen(true)}>
              Re-read my task
            </Button>
            <Button size="lg" arrow onClick={() => dispatch({ type: "OPEN_PROOF" })}>
              Upload evidence
            </Button>
          </div>
        )}
      </Reveal>

      <TaskDetails open={detailsOpen} onClose={() => setDetailsOpen(false)} task={task} />
    </section>
  );
}
