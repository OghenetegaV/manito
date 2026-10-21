import { lazy, Suspense, type ReactNode } from "react";
import { Loading } from "@/components/layout/Loading";
import { isRemoteMode } from "@/lib/remoteMode";
import { LocalGameProvider } from "./LocalGameProvider";

// Code-split: a local-mode build (no Supabase configured) should never even fetch, let alone
// execute, @supabase/supabase-js. This import is only ever triggered when isRemoteMode is true.
const RemoteGameProvider = lazy(() =>
  import("./RemoteGameProvider").then((m) => ({ default: m.RemoteGameProvider })),
);

export { usePublicGame, usePrivateGame, useRevealedGame, useGameDispatch } from "./gameContext";

/**
 * Picks the real multiplayer provider when a Supabase project is configured (see
 * src/lib/remoteMode.ts and supabase/README.md), otherwise falls back to local/demo mode.
 * Every component below this just calls usePublicGame/usePrivateGame/useRevealedGame/
 * useGameDispatch and never needs to know which one is actually running.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  if (!isRemoteMode) return <LocalGameProvider>{children}</LocalGameProvider>;
  return (
    <Suspense fallback={<Loading message="Connecting to the game…" />}>
      <RemoteGameProvider>{children}</RemoteGameProvider>
    </Suspense>
  );
}
