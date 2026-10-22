import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useGameDispatch, usePrivateGame } from "@/game/GameProvider";
import { Reveal } from "@/motion/Reveal";
import { EASE_OUT } from "@/motion/variants";
import { audio } from "@/services/audio";
import "./assignment.css";

/**
 * The private moment. The name is not in the page until the player asks for it: before the
 * reveal the card holds a blurred placeholder, never the real value.
 */
export function ManitoReveal() {
  const secret = usePrivateGame();
  const dispatch = useGameDispatch();
  const [revealed, setRevealed] = useState(false);

  if (!secret?.manito) return null;

  const reveal = () => {
    audio.play("assignment_reveal");
    setRevealed(true);
  };

  return (
    <section className="scene manito" aria-labelledby="manito-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">Classified · for your eyes only</p>
        <h1 id="manito-title" className="eyebrow manito__title">
          Your Manito
        </h1>
      </div>

      <div className="manito__card" data-revealed={revealed}>
        <span className="stamp manito__stamp" aria-hidden="true">
          Top secret
        </span>
        <AnimatePresence mode="wait" initial={false}>
          {revealed ? (
            <motion.div
              key="name"
              className="manito__face"
              initial={{ opacity: 0, filter: "blur(18px)", y: 16, scale: 1.02 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0, scale: 1, transition: { duration: 1.1, ease: EASE_OUT } }}
            >
              <span className="manito__ring" aria-hidden="true" />
              <p
                className="display display-xl manito__name"
                data-long={secret.manito.name.length > 5}
                aria-live="polite"
              >
                {secret.manito.name}
              </p>
              <motion.span
                className="manito__gold"
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1, transition: { duration: 0.9, delay: 0.7, ease: EASE_OUT } }}
              />
            </motion.div>
          ) : (
            <motion.div key="sealed" className="manito__face manito__face--sealed" exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.3 } }}>
              <p className="display display-xl manito__name manito__name--blur" aria-hidden="true">
                ••••
              </p>
              <span className="sr-only">Hidden until you reveal it</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="manito__after">
        {!revealed ? (
          <Reveal show>
            <Button size="lg" arrow onClick={reveal}>
              Reveal my Manito
            </Button>
          </Reveal>
        ) : (
          <>
            <Reveal show delay={1.2}>
              <p className="lede italic">Your mission begins now.</p>
            </Reveal>
            <Reveal show delay={1.8}>
              <Button size="lg" arrow onClick={() => dispatch({ type: "OPEN_MISSION", now: Date.now() })}>
                Open my mission
              </Button>
            </Reveal>
          </>
        )}
      </div>

      <p className="manito__foot">keep this between us</p>
    </section>
  );
}
