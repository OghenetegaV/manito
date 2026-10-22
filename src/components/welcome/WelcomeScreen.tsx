import { useState } from "react";
import { motion } from "framer-motion";
import { Doodle } from "@/components/decor/Doodles";
import { useCurtain } from "@/components/layout/Curtain";
import { PARTICIPANTS } from "@/config/gameConfig";
import { useGameDispatch } from "@/game/GameProvider";
import { useTimeline } from "@/hooks/useTimeline";
import { isRemoteMode } from "@/lib/remoteMode";
import { capitalise, numberWord } from "@/lib/words";
import { Reveal } from "@/motion/Reveal";
import { EASE_IN_OUT } from "@/motion/variants";
import { audio } from "@/services/audio";
import { CastIntro } from "./CastIntro";
import { EnterGameButton } from "./EnterGameButton";
import "./welcome.css";

/** Milestones (ms) after the cast has arrived: headline, roll call, three lines, closer, CTA. */
const MILESTONES = [2100, 2700, 3300, 4500, 5100];

export function WelcomeScreen() {
  const dispatch = useGameDispatch();
  const curtain = useCurtain();
  const [skipped, setSkipped] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const step = useTimeline(MILESTONES, skipped);

  const count = capitalise(numberWord(PARTICIPANTS.length));
  const names = PARTICIPANTS.map((p) => p.name.charAt(0) + p.name.slice(1).toLowerCase()).join(". ") + ".";

  const enter = () => {
    if (leaving) return;
    setLeaving(true);
    audio.play("welcome_enter");
    // Content starts to recede immediately; the curtain arrives 250ms later and covers the swap.
    curtain.run(() => dispatch({ type: "ENTER" }), { delay: 250 });
  };

  return (
    <motion.section
      className="scene welcome"
      aria-labelledby="welcome-title"
      onClick={() => step < MILESTONES.length && setSkipped(true)}
      animate={leaving ? { opacity: 0, scale: 0.94, transition: { duration: 0.7, ease: EASE_IN_OUT } } : { opacity: 1, scale: 1 }}
    >
      <p className="welcome__eyebrow">
        <span className="eyebrow eyebrow--accent">A private game for {numberWord(PARTICIPANTS.length)}</span>
        <span className="hand welcome__note">girls only</span>
      </p>

      <CastIntro skip={skipped} leaving={leaving} />

      <div className="welcome__message">
        <Reveal show={step >= 1} variant="blurIn">
          <div className="welcome__title">
            <h1 id="welcome-title" className="display display-lg">
              WELCOME, GIRLS.
            </h1>
            <Doodle name="sparkle" size={34} className="welcome__spark" />
            <span className="stamp welcome__stamp" aria-hidden="true">
              Top secret
            </span>
          </div>
        </Reveal>

        <Reveal show={step >= 2}>
          <p className="lede italic">{names}</p>
        </Reveal>

        <div className="welcome__lines">
          {[`${count} girls.`, `${count} Manitos.`, `${count} secret missions.`].map((line, i) => (
            <Reveal key={line} show={step >= 3} delay={i * 0.35}>
              <p>{line}</p>
            </Reveal>
          ))}
        </div>

        <Reveal show={step >= 4}>
          <p className="welcome__closer hand">The game has officially begun.</p>
        </Reveal>
      </div>

      <Reveal show={step >= 5}>
        <EnterGameButton onEnter={enter} disabled={leaving} />
      </Reveal>

      {isRemoteMode && (
        <Reveal show={step >= 5}>
          <a href="?demo=1" className="welcome__demo-link" onClick={(e) => e.stopPropagation()}>
            Try a 1-player demo first
          </a>
        </Reveal>
      )}
    </motion.section>
  );
}
