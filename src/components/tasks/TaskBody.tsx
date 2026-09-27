import type { Task, TaskBlock } from "@/game/types";
import "./tasks.css";

function Block({ block }: { block: TaskBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="tbody__p">{block.text}</p>;
    case "quote":
      return <blockquote className="tbody__quote">{block.text}</blockquote>;
    case "aside":
      return <p className="tbody__aside hand">( {block.text} )</p>;
    case "list":
      return (
        <div className="tbody__list">
          {block.title && <p className="eyebrow eyebrow--accent">{block.title}</p>}
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      );
  }
}

/** The full write-up of a task: what to do, the bonus, how to prove it, and the one thing not to do. */
export function TaskBody({ task }: { task: Task }) {
  return (
    <div className="tbody">
      {task.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}

      {task.bonus && (
        <div className="tnote tnote--bonus">
          <span className="tnote__label hand">Bonus</span>
          <p>{task.bonus}</p>
        </div>
      )}

      <div className="tnote tnote--proof">
        <span className="tnote__label hand">Proof</span>
        <p>{task.proof}</p>
      </div>

      {task.warning && (
        <div className="tnote tnote--warn">
          <span className="tnote__label hand">Don't get caught</span>
          <p>{task.warning}</p>
        </div>
      )}
    </div>
  );
}
