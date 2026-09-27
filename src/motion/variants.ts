import type { Transition, Variants } from "framer-motion";

/** One easing vocabulary for the whole product. */
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  quick: 0.25,
  base: 0.6,
  slow: 0.9,
  curtain: 0.7,
} as const;

export const enter: Transition = { duration: DURATION.base, ease: EASE_OUT };

/** Entrance: soft fade + upward drift. Exit: fade + slight scale down. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number = 0) => ({ opacity: 1, y: 0, transition: { ...enter, delay } }),
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.quick, ease: EASE_IN_OUT } },
};

/** Reveal: blur → focus. Keep to small elements; large blurred layers are costly. */
export const blurIn: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)" },
  show: (delay: number = 0) => ({
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: DURATION.slow, ease: EASE_OUT, delay },
  }),
  exit: { opacity: 0, transition: { duration: DURATION.quick } },
};

export const staggerChildren = (gap = 0.12, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

/** Full-screen scene swap between phases. */
export const scene: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT, delay: 0.05 } },
  exit: { opacity: 0, scale: 0.985, transition: { duration: 0.3, ease: EASE_IN_OUT } },
};
