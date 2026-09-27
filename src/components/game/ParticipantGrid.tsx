import { motion } from "framer-motion";
import type { Participant, Presence } from "@/game/types";
import { staggerChildren, fadeUp } from "@/motion/variants";
import { ParticipantCard } from "./ParticipantCard";

type ParticipantGridProps = {
  participants: Participant[];
  presence: Record<string, Presence>;
  currentUserId?: string;
  /** Provide to let a player claim a seat by tapping their card. */
  onSelect?: (id: string) => void;
  label?: string;
};

export function ParticipantGrid({ participants, presence, currentUserId, onSelect, label = "Players" }: ParticipantGridProps) {
  return (
    <motion.ul
      className="pgrid"
      aria-label={label}
      variants={staggerChildren(0.09, 0.15)}
      initial="hidden"
      animate="show"
    >
      {participants.map((p, i) => {
        const state = presence[p.id] ?? "waiting";
        const canSelect = !!onSelect && !currentUserId && state === "waiting";
        return (
          <motion.li key={p.id} variants={fadeUp}>
            <ParticipantCard
              participant={p}
              index={i}
              presence={state}
              isYou={p.id === currentUserId}
              onSelect={canSelect ? () => onSelect(p.id) : undefined}
            />
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
