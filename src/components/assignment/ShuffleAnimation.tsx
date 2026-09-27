import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { shuffle } from "@/game/assignments";
import type { Participant } from "@/game/types";
import { useTimeScale } from "@/hooks/useTimeline";

/**
 * Gaps (ms) between reorders: eases in, quickens, then slows to a stop, so the shuffle reads as
 * a physical draw rather than a slot machine.
 */
const TICKS = [260, 210, 165, 130, 105, 90, 90, 90, 90, 100, 120, 150, 190, 245, 310, 390, 480, 580];

export function ShuffleAnimation({
  participants,
  running,
  onSettled,
  children,
}: {
  participants: Participant[];
  running: boolean;
  onSettled: () => void;
  children: (p: Participant, index: number) => React.ReactNode;
}) {
  const scale = useTimeScale();
  const [order, setOrder] = useState(participants);

  useEffect(() => {
    if (!running) return;
    let elapsed = 0;
    const timers: number[] = [];
    TICKS.forEach((gap, i) => {
      elapsed += gap * scale;
      const last = i === TICKS.length - 1;
      timers.push(
        window.setTimeout(() => {
          // the final tick restores the canonical order, so the resolve step reads top to bottom
          setOrder((prev) => (last ? participants : shuffle(prev)));
          if (last) onSettled();
        }, elapsed),
      );
    });
    return () => timers.forEach(window.clearTimeout);
    // runs once per `running` flip
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <ul className="shuffle" aria-hidden="true">
      {order.map((p) => (
        <motion.li key={p.id} layout transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.8 }}>
          {children(p, participants.findIndex((x) => x.id === p.id))}
        </motion.li>
      ))}
    </ul>
  );
}
