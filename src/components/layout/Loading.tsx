/** Themed loading state: quiet, on-brand, and still says what is happening. */
export function Loading({ message = "Preparing the game…" }: { message?: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <div className="stack">
        <span className="pulse-line" aria-hidden="true" />
        <p className="eyebrow">{message}</p>
      </div>
    </div>
  );
}
