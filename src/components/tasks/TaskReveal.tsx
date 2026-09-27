import { useState } from "react";
import { motion } from "framer-motion";
import { Doodle } from "@/components/decor/Doodles";
import { Button } from "@/components/ui/Button";
import { FEATURES } from "@/config/gameConfig";
import { useGameDispatch, usePrivateGame, usePublicGame } from "@/game/GameProvider";
import { Reveal } from "@/motion/Reveal";
import { EASE_OUT } from "@/motion/variants";
import { audio } from "@/services/audio";
import { Countdown } from "./Countdown";
import { TaskCard } from "./TaskCard";
import "./tasks.css";

/**
 * A sealed envelope. Until the seal is broken the page holds no task text at all,
 * so nothing secret is in the DOM to be read over a shoulder.
 */
export function TaskReveal() {
  const secret = usePrivateGame();
  const { deadline } = usePublicGame();
  const dispatch = useGameDispatch();
  const [open, setOpen] = useState(false);

  if (!secret?.task) return null;
  const { task } = secret;

  return (
    <section className="scene reveal-task" aria-labelledby="task-title">
      <div className="stack">
        <p className="eyebrow eyebrow--accent">Top secret · girls only</p>
        <h1 id="task-title" className="display display-lg">
          {open ? "Shh. Here it is." : "Your secret task"}
        </h1>
      </div>

      <div className="seal">
        {open ? (
          <motion.div
            className="seal__open"
            initial={{ opacity: 0, y: 24, rotate: -1.5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1, transition: { duration: 0.7, ease: EASE_OUT } }}
          >
            <TaskCard task={task} status="active" />
          </motion.div>
        ) : (
          <div className="seal__closed">
            <Doodle name="envelope" size={96} color="#fff7ee" className="seal__envelope" />
            <span className="stamp seal__stamp" aria-hidden="true">
              Top secret
            </span>
            <p className="lede italic">Sealed. Only you can open it.</p>
            <p className="hand seal__hint">make sure nobody's looking</p>
            <Doodle name="sparkle" size={26} className="seal__spark seal__spark--a" />
            <Doodle name="heart" size={22} color="#f4b6c2" className="seal__spark seal__spark--b" />
          </div>
        )}
      </div>

      {open ? (
        <>
          {FEATURES.schedule && deadline !== undefined && (
            <Reveal show delay={0.3}>
              <Countdown deadline={deadline} size="md" label="Deadline" />
            </Reveal>
          )}
          <Reveal show delay={0.5}>
            <Button size="lg" arrow onClick={() => dispatch({ type: "ACCEPT_MISSION" })}>
              Got it. Let's go
            </Button>
          </Reveal>
        </>
      ) : (
        <Reveal show>
          <Button
            size="lg"
            arrow
            onClick={() => {
              audio.play("task_reveal");
              setOpen(true);
            }}
          >
            Break the seal
          </Button>
        </Reveal>
      )}
    </section>
  );
}
