import { fillTemplate } from "@/game/missionTemplate";
import type { Task, TaskStatus as Status } from "@/game/types";
import { TaskBody } from "./TaskBody";
import { TaskStatus } from "./TaskStatus";
import "./tasks.css";

export type TaskCardProps = {
  task: Task;
  status: Status;
  /** `summary` shows just the name and how to prove it; `full` shows the whole write-up. */
  variant?: "full" | "summary";
  /** Fills the `{{manito}}` token the shared Manito-photo brief uses in place of a name. */
  manitoName?: string;
};

/** One mission card — a dare or a picture challenge. Always fed by the player's own missions
 * via `usePrivateGame`. */
export function TaskCard({ task, status, variant = "full", manitoName }: TaskCardProps) {
  const fill = (text: string) => (manitoName ? fillTemplate(text, manitoName) : text);
  return (
    <article className={`tcard tcard--${status}`} aria-label={`${kindLabel(task.kind)}: ${task.title}`}>
      <span className="tcard__tape" aria-hidden="true" />
      <header className="tcard__head">
        <p className="eyebrow eyebrow--accent">{kindLabel(task.kind)}</p>
        <TaskStatus status={status} />
      </header>

      <div className="tcard__title">
        <span className="tcard__emoji" aria-hidden="true">
          {task.emoji}
        </span>
        <h2 className="display display-md">{task.title}</h2>
      </div>

      {variant === "full" ? (
        <TaskBody task={task} manitoName={manitoName} />
      ) : (
        <div className="tnote tnote--proof">
          <span className="tnote__label hand">Proof</span>
          <p>{fill(task.proof)}</p>
        </div>
      )}
    </article>
  );
}

function kindLabel(kind: Task["kind"]): string {
  switch (kind) {
    case "dare":
      return "Your dare";
    case "manito-photo":
      return "Picture challenge · Manito";
    case "group-photo":
      return "Picture challenge · group";
  }
}
