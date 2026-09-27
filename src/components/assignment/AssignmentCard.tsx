import type { Participant } from "@/game/types";

export type CardState = "shuffling" | "sealed";

/**
 * One player's slot in the draw. It only ever says "still drawing" or "sealed";
 * who drew whom is never on screen until it is that player's private reveal.
 */
export function AssignmentCard({ participant, index, state }: { participant: Participant; index: number; state: CardState }) {
  return (
    <div className={`acard acard--${state}`}>
      <span className="acard__index numeral">{String(index + 1).padStart(2, "0")}</span>
      <span className="acard__name">{participant.name}</span>
      <span className="acard__state">
        {state === "sealed" ? (
          <>
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden="true">
              <rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1" />
              <path d="M3.5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.1" />
            </svg>
            Sealed
          </>
        ) : (
          <>
            <i className="acard__pulse" />
            Drawing
          </>
        )}
      </span>
    </div>
  );
}
