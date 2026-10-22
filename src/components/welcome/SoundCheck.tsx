import { motion } from "framer-motion";
import { Doodle } from "@/components/decor/Doodles";
import { Button } from "@/components/ui/Button";
import { audio } from "@/services/audio";
import "./welcome.css";

/**
 * The very first beat of the game: a real tap, required before any browser will let us make
 * sound. Doubles as the volume reminder the game wants everyone to see before anything else.
 */
export function SoundCheck({ onContinue }: { onContinue: () => void }) {
  const continueWithSound = () => {
    audio.setMuted(false);
    audio.unlock();
    audio.play("welcome_enter");
    onContinue();
  };

  const continueMuted = () => {
    audio.setMuted(true);
    onContinue();
  };

  return (
    <motion.section
      className="scene soundcheck"
      aria-labelledby="soundcheck-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.35 } }}
    >
      <div className="stack">
        <p className="eyebrow eyebrow--accent">Before you start</p>
        <div className="soundcheck__title">
          <h1 id="soundcheck-title" className="display display-lg">
            Turn your volume up.
          </h1>
          <Doodle name="sparkle" size={30} className="soundcheck__spark" />
        </div>
        <p className="lede">This game has music and sound effects.</p>
      </div>

      <div className="actions">
        <Button variant="quiet" onClick={continueMuted}>
          Skip sound
        </Button>
        <Button size="lg" arrow onClick={continueWithSound}>
          Turn on sound
        </Button>
      </div>
    </motion.section>
  );
}
