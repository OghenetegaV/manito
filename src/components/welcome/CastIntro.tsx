import { motion } from "framer-motion";
import { PARTICIPANTS } from "@/config/gameConfig";
import { useTimeline } from "@/hooks/useTimeline";
import { EASE_OUT } from "@/motion/variants";

const FIRST_AT = 400;
const STAGGER = 340;
export const CAST_DONE_AT = FIRST_AT + STAGGER * (PARTICIPANTS.length - 1) + 700;

const MILESTONES = PARTICIPANTS.map((_, i) => FIRST_AT + i * STAGGER);

/** Each girl gets her own colour of highlighter, and a slightly different tilt. */
const TAGS = [
  { bg: "var(--butter)", rot: -2.5 },
  { bg: "var(--blush)", rot: 2 },
  { bg: "var(--lilac)", rot: -1.5 },
  { bg: "var(--powder)", rot: 3 },
  { bg: "var(--butter)", rot: 1 },
];

/** The names arrive one at a time, like a cast being introduced. They stay on screen. */
export function CastIntro({ skip, leaving }: { skip: boolean; leaving: boolean }) {
  const shown = useTimeline(MILESTONES, skip);

  return (
    <ul className="cast" aria-label="The players">
      {PARTICIPANTS.map((p, i) => {
        const tag = TAGS[i % TAGS.length];
        return (
          <motion.li
            key={p.id}
            className="cast__name"
            initial={{ opacity: 0, y: 14, rotate: tag.rot - 4 }}
            animate={
              leaving
                ? { opacity: 0, y: -4, rotate: tag.rot, transition: { duration: 0.5, ease: EASE_OUT } }
                : i < shown
                  ? { opacity: 1, y: 0, rotate: tag.rot, transition: { type: "spring", stiffness: 240, damping: 15 } }
                  : { opacity: 0, y: 14, rotate: tag.rot - 4 }
            }
            style={{ ["--tag" as string]: tag.bg }}
          >
            <span className="cast__index hand" aria-hidden="true">
              no.{i + 1}
            </span>
            {p.name}
          </motion.li>
        );
      })}
    </ul>
  );
}
