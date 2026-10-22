import { fillTemplate } from "@/game/missionTemplate";
import type { Task, TaskBlock } from "@/game/types";
import "./tasks.css";

function Block({ block, manitoName }: { block: TaskBlock; manitoName?: string }) {
  const fill = (text: string) => (manitoName ? fillTemplate(text, manitoName) : text);
  switch (block.kind) {
    case "p":
      return <p className="tbody__p">{fill(block.text)}</p>;
    case "quote":
      return <blockquote className="tbody__quote">{fill(block.text)}</blockquote>;
    case "aside":
      return <p className="tbody__aside hand">( {fill(block.text)} )</p>;
    case "list":
      return (
        <div className="tbody__list">
          {block.title && <p className="eyebrow eyebrow--accent">{block.title}</p>}
          <ul>
            {block.items.map((item) => (
              <li key={item}>{fill(item)}</li>
            ))}
          </ul>
        </div>
      );
  }
}

/**
 * The full write-up of a mission: what to do, the bonus, how to prove it, and the one thing not
 * to do. `manitoName`, when given, fills the `{{manito}}` token the shared Manito-photo brief
 * uses in place of a name.
 */
export function TaskBody({ task, manitoName }: { task: Task; manitoName?: string }) {
  const fill = (text: string) => (manitoName ? fillTemplate(text, manitoName) : text);
  return (
    <div className="tbody">
      {task.blocks.map((block, i) => (
        <Block key={i} block={block} manitoName={manitoName} />
      ))}

      {task.bonus && (
        <div className="tnote tnote--bonus">
          <span className="tnote__label hand">Bonus</span>
          <p>{fill(task.bonus)}</p>
        </div>
      )}

      <div className="tnote tnote--proof">
        <span className="tnote__label hand">Proof</span>
        <p>{fill(task.proof)}</p>
      </div>

      {task.warning && (
        <div className="tnote tnote--warn">
          <span className="tnote__label hand">Keep in mind</span>
          <p>{fill(task.warning)}</p>
        </div>
      )}
    </div>
  );
}
