import { AnimatePresence, motion } from "framer-motion";
import { GAME_MASTER_EXPRESSIONS, GAME_MASTER_MESSAGES } from "@/config/gameConfig";
import type { Expression, GameMasterState } from "@/game/types";
import { EASE_IN_OUT, EASE_OUT } from "@/motion/variants";
import { GameMasterCard } from "./GameMasterCard";
import { GameMasterExpression } from "./GameMasterExpression";
import "./gamemaster.css";

export type GameMasterProps = {
  state: GameMasterState;
  /** Defaults to the expression configured for `state`. */
  expression?: Expression;
  /** Defaults to the line configured for `state`. `""` = present but silent. */
  message?: string;
  position?: "left" | "right" | "center";
  size?: "small" | "medium" | "large";
  visible?: boolean;
  /** `idle` adds a slow breathing motion; `none` keeps her still. */
  animation?: "idle" | "none";
};

export function GameMaster({
  state,
  expression = GAME_MASTER_EXPRESSIONS[state],
  message = GAME_MASTER_MESSAGES[state],
  position = "right",
  size = "medium",
  visible = true,
  animation = "idle",
}: GameMasterProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className={`gm gm--${position} gm--${size}`}
          data-state={state}
          data-expression={expression}
          aria-label="The Game Master"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE_OUT } }}
          exit={{ opacity: 0, y: 16, transition: { duration: 0.4, ease: EASE_IN_OUT } }}
        >
          <GameMasterCard message={message} />
          <div className={`gm__portrait ${animation === "idle" ? "gm__portrait--idle" : ""}`}>
            <GameMasterExpression expression={expression} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
