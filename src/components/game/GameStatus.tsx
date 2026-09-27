import { usePublicGame } from "@/game/GameProvider";

/** Public status only: how many of the five are in, and how many are ready. */
export function GameStatus() {
  const { participants, presence, readyCount, joinedCount } = usePublicGame();
  const total = participants.length;

  return (
    <div className="gstatus" role="group" aria-label="Lobby status">
      <div className="gstatus__bars" aria-hidden="true">
        {participants.map((p) => (
          <span key={p.id} className={`gstatus__bar gstatus__bar--${presence[p.id]}`} />
        ))}
      </div>
      <p className="eyebrow numeral">
        {readyCount === total
          ? "Everyone is ready"
          : `${readyCount} of ${total} ready${joinedCount > readyCount ? ` · ${joinedCount - readyCount} getting there` : ""}`}
      </p>
    </div>
  );
}
