import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scene } from "@/motion/variants";

/** Swaps scenes one at a time: the outgoing scene leaves before the next one arrives. */
export function PageTransition({ phaseKey, children }: { phaseKey: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        className="page"
        variants={scene}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
