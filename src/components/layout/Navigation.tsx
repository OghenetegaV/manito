import { AnimatePresence, motion } from "framer-motion";
import { Doodle } from "@/components/decor/Doodles";
import { PHASE_LABELS } from "@/config/gameConfig";
import { usePublicGame } from "@/game/GameProvider";

type NavigationProps = {
  onOpenRules: () => void;
  onOpenGame: () => void;
};

/** Deliberately spare: a wordmark, a status sticker, two quiet links. */
export function Navigation({ onOpenRules, onOpenGame }: NavigationProps) {
  const game = usePublicGame();
  const visible = game.phase !== "welcome";

  const status =
    game.phase === "lobby" ? `${game.readyCount}/${game.participants.length} ready` : PHASE_LABELS[game.phase];

  return (
    <AnimatePresence>
      {visible && (
        <motion.header
          className="nav"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.3 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <span className="nav__brand">
            MANITO
            <Doodle name="star" size={16} className="nav__star" />
          </span>
          <nav className="nav__links" aria-label="Game">
            <span className="nav__status" aria-live="polite">
              {status}
            </span>
            <button type="button" className="nav__link" onClick={onOpenRules}>
              Rules
            </button>
            <button type="button" className="nav__link" onClick={onOpenGame}>
              Game
            </button>
          </nav>
        </motion.header>
      )}
    </AnimatePresence>
  );
}
