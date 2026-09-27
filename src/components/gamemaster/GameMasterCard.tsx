import { GameMasterMessage } from "./GameMasterMessage";

/**
 * The speech card: a small label plus her line. On desktop it sits above the portrait
 * as a bubble; on phones it becomes the text half of the bottom dock.
 */
export function GameMasterCard({ message }: { message: string }) {
  return (
    <div className={`gm__card ${message ? "" : "gm__card--silent"}`}>
      <p className="eyebrow eyebrow--accent gm__label">The Game Master</p>
      <GameMasterMessage message={message} />
    </div>
  );
}
