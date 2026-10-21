import { MotionConfig } from "framer-motion";
import { NarrationProvider } from "@/components/gamemaster/narration";
import { Boot, useBoot } from "@/components/layout/Boot";
import { CurtainProvider } from "@/components/layout/Curtain";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { ToastProvider } from "@/components/ui/Toast";
import { GameProvider } from "@/game/GameProvider";

export default function App() {
  const ready = useBoot();

  return (
    <ErrorBoundary>
      {/* honours prefers-reduced-motion: transforms/layout animations are skipped, opacity is kept */}
      <MotionConfig reducedMotion="user">
        {ready && (
          // ToastProvider wraps GameProvider: the remote provider surfaces things like
          // "someone just took that seat" through the same toast the rest of the app uses.
          <ToastProvider>
            <GameProvider>
              <NarrationProvider>
                <CurtainProvider>
                  <AppShell />
                </CurtainProvider>
              </NarrationProvider>
            </GameProvider>
          </ToastProvider>
        )}
        <Boot visible={!ready} />
      </MotionConfig>
    </ErrorBoundary>
  );
}
