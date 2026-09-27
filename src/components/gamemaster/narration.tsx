import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Expression } from "@/game/types";

/**
 * Scenes sometimes need the Game Master to say something other than her default line for
 * the phase (e.g. the staged "Well… everyone's here." beats). They publish that here so the
 * shell — not the scene — remains the only thing that renders her.
 */
export type Narration = {
  /** `""` keeps her visible but silent. */
  message?: string;
  expression?: Expression;
};

type Ctx = { narration: Narration | null; set: (n: Narration | null) => void };
const NarrationContext = createContext<Ctx | null>(null);

export function NarrationProvider({ children }: { children: ReactNode }) {
  const [narration, set] = useState<Narration | null>(null);
  const value = useMemo(() => ({ narration, set }), [narration]);
  return <NarrationContext.Provider value={value}>{children}</NarrationContext.Provider>;
}

export function useNarrationValue(): Narration | null {
  return useContext(NarrationContext)?.narration ?? null;
}

/** Overrides the Game Master's line while the calling scene is mounted. Pass `null` for no override. */
export function useNarrate(message: string | undefined | null, expression?: Expression) {
  const ctx = useContext(NarrationContext);
  const set = ctx?.set;
  useEffect(() => {
    if (!set) return;
    if (message === null || message === undefined) {
      set(null);
      return;
    }
    set({ message, expression });
    return () => set(null);
  }, [set, message, expression]);
}
