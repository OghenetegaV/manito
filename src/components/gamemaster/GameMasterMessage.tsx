import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/motion/variants";

/** Her line. Swaps with a blur → focus, and is announced politely to screen readers. */
export function GameMasterMessage({ message }: { message: string }) {
  return (
    <div className="gm__message" role="status" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait" initial={false}>
        {message && (
          <motion.p
            key={message}
            initial={{ opacity: 0, filter: "blur(6px)", y: 6 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.6, ease: EASE_OUT } }}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
