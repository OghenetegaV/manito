import { Suspense, useEffect, useRef, useState } from "react";
import { usePrivateGame, usePublicGame } from "@/game/GameProvider";
import { useAudioCues, useDeadlineWatcher } from "@/hooks/useGameEffects";
import { GameMaster, type GameMasterProps } from "@/components/gamemaster/GameMaster";
import { useNarrationValue } from "@/components/gamemaster/narration";
import { resolveGameMaster } from "@/components/gamemaster/layout";
import { GamePanel } from "@/components/game/GamePanel";
import { Rules } from "@/components/game/Rules";
import { SoundCheck } from "@/components/welcome/SoundCheck";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
import { PHASE_VIEWS } from "@/phaseViews";
import { AmbientBackground, type Mood } from "./AmbientBackground";
import { useCurtain } from "./Curtain";
import { Loading } from "./Loading";
import { Navigation } from "./Navigation";
import { NoiseOverlay } from "./NoiseOverlay";
import { PageTransition } from "./PageTransition";
import "./layout.css";

/**
 * <AppShell>
 *   <AmbientBackground /> <NoiseOverlay /> <Navigation />
 *   <PageContent />  <GameMaster />
 *   (toasts and the curtain are provided by the providers wrapping the shell)
 * </AppShell>
 */
export function AppShell() {
  const game = usePublicGame();
  const secret = usePrivateGame();
  const narration = useNarrationValue();
  const { transitioning } = useCurtain();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [gameOpen, setGameOpen] = useState(false);
  const [soundChecked, setSoundChecked] = useState(false);

  useDeadlineWatcher();
  useAudioCues();

  const gm = resolveGameMaster(game.phase, {
    narration,
    everyoneReady: game.everyoneReady,
    hasEvidence: !!secret?.allSubmitted,
  });

  // Keep her last props around so she can leave gracefully instead of vanishing.
  const lastGm = useRef<GameMasterProps | null>(null);
  useEffect(() => {
    if (gm) lastGm.current = gm;
  });
  const gmProps: GameMasterProps | null = gm ?? lastGm.current;

  const mood: Mood = transitioning || game.phase === "assignment" ? "dim" : "warm";
  const View = PHASE_VIEWS[game.phase];
  const showSoundCheck = game.phase === "welcome" && !soundChecked;

  return (
    <div className="shell" data-phase={game.phase} data-gm={gm?.size ?? "none"}>
      <a className="skip-link" href="#main">
        Skip to the game
      </a>
      <AmbientBackground mood={mood} />
      <NoiseOverlay />
      <Navigation onOpenRules={() => setRulesOpen(true)} onOpenGame={() => setGameOpen(true)} />

      <main id="main" className="stage">
        <PageTransition phaseKey={showSoundCheck ? "soundcheck" : game.phase}>
          <Suspense fallback={<Loading message="The Game Master is getting things ready." />}>
            {showSoundCheck ? <SoundCheck onContinue={() => setSoundChecked(true)} /> : <View />}
          </Suspense>
        </PageTransition>
      </main>

      {gmProps && <GameMaster {...gmProps} visible={!!gm} />}

      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="The Rules" eyebrow="Read carefully">
        <Rules />
      </Modal>
      <Drawer open={gameOpen} onClose={() => setGameOpen(false)} title="The Game" eyebrow="Status">
        <GamePanel onClose={() => setGameOpen(false)} />
      </Drawer>
    </div>
  );
}
