import type { ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { useTimeScale } from "@/hooks/useTimeline";
import { blurIn, fadeUp } from "./variants";

const VARIANTS = { fadeUp, blurIn } as const;

type RevealProps = {
  show: boolean;
  variant?: keyof typeof VARIANTS | Variants;
  /** Seconds, for staggering siblings. */
  delay?: number;
  className?: string;
  children: ReactNode;
};

/**
 * Holds its space while hidden (so layouts never jump) and takes its contents out of the
 * tab order and accessibility tree until it appears.
 */
export function Reveal({ show, variant = "fadeUp", delay = 0, className, children }: RevealProps) {
  const scale = useTimeScale();
  const variants = typeof variant === "string" ? VARIANTS[variant] : variant;
  return (
    <motion.div
      className={className}
      variants={variants}
      custom={delay * scale}
      initial="hidden"
      animate={show ? "show" : "hidden"}
      inert={!show}
      aria-hidden={!show}
    >
      {children}
    </motion.div>
  );
}
