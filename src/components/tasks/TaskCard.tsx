import type { Task, TaskStatus as Status } from "@/game/types";
import { TaskBody } from "./TaskBody";
import { TaskStatus } from "./TaskStatus";
import "./tasks.css";

export type TaskCardProps = {
  task: Task;
  status: Status;
  /** `summary` shows just the name and how to prove it; `full` shows the whole write-up. */
  variant?: "full" | "summary";
};

/** Secret task card. Always fed by the player's own task via `usePrivateGame`. */
export function TaskCard({ task, status, variant = "full" }: TaskCardProps) {
  return (
    <article className={`tcard tcard--${status}`} aria-label={`Secret task: ${task.title}`}>
      <span className="tcard__tape" aria-hidden="true" />
      <header className="tcard__head">
        <p className="eyebrow eyebrow--accent">Your secret task</p>
        <TaskStatus status={status} />
      </header>

      <div className="tcard__title">
        <span className="tcard__emoji" aria-hidden="true">
          {task.emoji}
        </span>
        <h2 className="display display-md">{task.title}</h2>
      </div>

      {variant === "full" ? (
        <TaskBody task={task} />
      ) : (
        <div className="tnote tnote--proof">
          <span className="tnote__label hand">Proof</span>
          <p>{task.proof}</p>
        </div>
      )}
    </article>
  );
}
