import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@/config/gameConfig";

export type Urgency = "calm" | "tense" | "critical";

export type Countdown = {
  totalSeconds: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
  urgency: Urgency;
};

const pad = (n: number) => String(n).padStart(2, "0");
export const formatUnit = pad;

function compute(deadline: number | undefined): Countdown {
  const remainingMs = deadline === undefined ? 0 : Math.max(0, deadline - Date.now());
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const { tenseBelowMs, criticalBelowMs } = GAME_CONFIG.urgency;
  return {
    totalSeconds,
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    expired: deadline !== undefined && remainingMs <= 0,
    urgency: remainingMs <= criticalBelowMs ? "critical" : remainingMs <= tenseBelowMs ? "tense" : "calm",
  };
}

/** Real-time countdown; only re-renders when the displayed second changes. */
export function useCountdown(deadline: number | undefined): Countdown {
  const [value, setValue] = useState(() => compute(deadline));

  useEffect(() => {
    setValue(compute(deadline));
    if (deadline === undefined) return;
    const id = window.setInterval(() => {
      setValue((prev) => {
        const next = compute(deadline);
        return next.totalSeconds === prev.totalSeconds ? prev : next;
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [deadline]);

  return value;
}
