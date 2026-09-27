import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { preloadGameMasterAssets } from "@/components/gamemaster/gameMasterAssets";
import "./layout.css";

const MIN_MS = 700;
const MAX_MS = 3000;

/** Resolves once fonts and the Game Master's artwork are ready (or a short timeout passes). */
export function useBoot(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const minimum = new Promise((r) => window.setTimeout(r, MIN_MS));
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const assets = preloadGameMasterAssets();
    const cap = new Promise((r) => window.setTimeout(r, MAX_MS));

    void Promise.all([minimum, Promise.race([Promise.all([fonts, assets]), cap])]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  return ready;
}

export function Boot({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="boot"
          role="status"
          aria-live="polite"
          exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          <div className="boot__inner">
            <p className="boot__mark">MANITO</p>
            <span className="pulse-line" aria-hidden="true" />
            <p className="eyebrow">Preparing the game…</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
