import { useEffect, useRef } from "react";
import { PHASE_AUDIO, audio } from "@/services/audio";
import { useGameDispatch, usePublicGame } from "@/game/GameProvider";
import type { GamePhase } from "@/game/types";

/** Phases in which the mission clock is running. */
const CLOCK_PHASES: readonly GamePhase[] = ["task", "countdown", "proof"];

/**
 * Ends the mission the moment the deadline passes, wherever the player happens to be.
 * Re-checks when the tab regains focus, since browsers throttle timers in background tabs.
 */
export function useDeadlineWatcher() {
  const { phase, deadline } = usePublicGame();
  const dispatch = useGameDispatch();

  useEffect(() => {
    if (deadline === undefined || !CLOCK_PHASES.includes(phase)) return;

    const check = () => dispatch({ type: "TIME_UP", now: Date.now() });
    const timer = window.setTimeout(check, Math.max(0, deadline - Date.now()) + 50);
    const onVisible = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, deadline, dispatch]);
}

/** Fires the matching sound cue when the phase changes. Silent unless audio is configured. */
export function useAudioCues() {
  const { phase } = usePublicGame();
  const previous = useRef(phase);

  useEffect(() => {
    if (previous.current === phase) return;
    previous.current = phase;
    const cue = PHASE_AUDIO[phase];
    if (cue) audio.play(cue);
  }, [phase]);
}
