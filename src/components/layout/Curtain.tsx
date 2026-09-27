import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useTimeScale } from "@/hooks/useTimeline";
import { EASE_IN_OUT } from "@/motion/variants";

/**
 * The cinematic wipe between welcome and lobby: a burgundy/plum layer expands from the lower
 * centre, the scene changes underneath it, then it fades away.
 *
 *   run(cb, { delay })  →  cover (700ms) → cb() → reveal (500ms)
 */
type Stage = "idle" | "covering" | "revealing";

type CurtainApi = {
  run: (onCovered: () => void, opts?: { delay?: number }) => void;
  transitioning: boolean;
};

const CurtainContext = createContext<CurtainApi | null>(null);

const ORIGIN = "50% 62%";
const HIDDEN = `circle(0% at ${ORIGIN})`;
const COVER = `circle(150% at ${ORIGIN})`;

export function CurtainProvider({ children }: { children: ReactNode }) {
  const [stage, setStage] = useState<Stage>("idle");
  const [delay, setDelay] = useState(0);
  const callback = useRef<(() => void) | null>(null);
  const scale = useTimeScale();

  const stageRef = useRef<Stage>("idle");
  stageRef.current = stage;

  const run = useCallback((onCovered: () => void, opts?: { delay?: number }) => {
    if (stageRef.current !== "idle") return;
    callback.current = onCovered;
    setDelay((opts?.delay ?? 0) / 1000);
    setStage("covering");
  }, []);

  const api = useMemo(() => ({ run, transitioning: stage !== "idle" }), [run, stage]);

  const target =
    stage === "covering"
      ? { clipPath: COVER, opacity: 1, transition: { duration: 0.7 * scale, delay: delay * scale, ease: EASE_IN_OUT } }
      : stage === "revealing"
        ? { clipPath: COVER, opacity: 0, transition: { duration: 0.5 * scale, ease: EASE_IN_OUT } }
        : { clipPath: HIDDEN, opacity: 1, transition: { duration: 0 } };

  return (
    <CurtainContext.Provider value={api}>
      {children}
      <motion.div
        className="curtain"
        aria-hidden="true"
        initial={false}
        animate={target}
        style={{ pointerEvents: stage === "idle" ? "none" : "auto" }}
        onAnimationComplete={() => {
          if (stage === "covering") {
            callback.current?.();
            callback.current = null;
            setStage("revealing");
          } else if (stage === "revealing") {
            setStage("idle");
          }
        }}
      />
    </CurtainContext.Provider>
  );
}

export function useCurtain(): CurtainApi {
  const ctx = useContext(CurtainContext);
  if (!ctx) throw new Error("useCurtain must be used inside <CurtainProvider>.");
  return ctx;
}
