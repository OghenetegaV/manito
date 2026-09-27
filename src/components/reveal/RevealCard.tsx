import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import type { RevealRow } from "@/game/selectors";
import { EASE_OUT } from "@/motion/variants";
import "./reveal.css";

/** One pairing, unveiled: blur → focus, with a gold line that draws underneath. */
export function RevealCard({ row, shown, isYou }: { row: RevealRow; shown: boolean; isYou: boolean }) {
  const done = row.outcome === "approved";
  return (
    <motion.li
      className={`rcard ${isYou ? "rcard--you" : ""}`}
      initial={{ opacity: 0, filter: "blur(12px)", y: 12 }}
      animate={
        shown
          ? { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.9, ease: EASE_OUT } }
          : { opacity: 0, filter: "blur(12px)", y: 12 }
      }
      aria-hidden={!shown}
    >
      <span className="rcard__pair">
        <span className="rcard__name">{row.giver.name}</span>
        <span className="rcard__arrow" aria-label="had">
          →
        </span>
        <span className="rcard__name">{row.receiver.name}</span>
      </span>
      <span className="rcard__outcome">
        <Badge tone={done ? "sage" : "burgundy"}>{done ? "Delivered" : "Missed"}</Badge>
      </span>
      <motion.span
        className="rcard__line"
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: shown ? 1 : 0, transition: { duration: 1, delay: 0.3, ease: EASE_OUT } }}
      />
    </motion.li>
  );
}
