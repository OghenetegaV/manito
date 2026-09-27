import type { Participant, Presence } from "@/game/types";

const STATUS_LABEL: Record<Presence, string> = {
  waiting: "Waiting",
  joined: "Joined",
  ready: "Ready",
};

type ParticipantCardProps = {
  participant: Participant;
  index: number;
  presence: Presence;
  isYou?: boolean;
  /** When provided the card is a button (used to take a seat). */
  onSelect?: () => void;
};

/**
 * Typographic identity for a player. Deliberately shows presence only:
 * nothing about assignments ever reaches this component.
 */
export function ParticipantCard({ participant, index, presence, isYou, onSelect }: ParticipantCardProps) {
  const body = (
    <>
      <span className="pcard__index numeral">{String(index + 1).padStart(2, "0")}</span>
      <span className="pcard__name">{participant.name}</span>
      <span className="pcard__status">
        <i className="pcard__dot" aria-hidden="true" />
        {STATUS_LABEL[presence]}
        {isYou && <b className="pcard__you">You</b>}
      </span>
    </>
  );

  const className = `pcard pcard--${presence} ${isYou ? "pcard--you" : ""}`;

  return onSelect ? (
    <button type="button" className={className} onClick={onSelect} aria-label={`Take your seat as ${participant.name}`}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
