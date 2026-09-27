import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Reduced-motion users get the same information, just faster. */
export function useTimeScale(): number {
  return useReducedMotion() ? 0.25 : 1;
}

/**
 * Drives choreographed sequences. Returns how many of the given milestones (ms from mount)
 * have passed, so a scene can reveal its parts in order: `const step = useTimeline([500, 1800, 2300])`.
 * Pass `skip` to jump straight to the end (e.g. when the player taps to skip).
 */
export function useTimeline(milestones: readonly number[], skip = false): number {
  const scale = useTimeScale();
  const [step, setStep] = useState(0);
  const key = milestones.join(",");

  useEffect(() => {
    const timers = milestones.map((t, i) =>
      window.setTimeout(() => setStep((s) => Math.max(s, i + 1)), t * scale),
    );
    return () => timers.forEach(window.clearTimeout);
    // milestones identity is captured by `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, scale]);

  return skip ? milestones.length : step;
}
