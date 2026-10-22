import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { isDemoMode } from "@/lib/remoteMode";
import { createInitialState, gameReducer } from "./machine";
import { loadState, saveState } from "./persistence";
import { selectPrivate, selectPublic, selectRevealed } from "./selectors";
import { GameApiContext, type GameApi } from "./gameContext";

/**
 * Local/demo mode: everything lives in this one browser (see persistence.ts), and the other
 * players are simulated (useSimulatedArrivals). This is what runs with no Supabase env vars
 * configured, and also what `?demo=1` forces even when a real Supabase project is configured
 * (see src/lib/remoteMode.ts) — see RemoteGameProvider.tsx for the real multiplayer path.
 *
 * A `?demo=1` session never touches localStorage: every visit starts fresh, and nothing it does
 * can leak into a later real game in the same browser.
 */
export function LocalGameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, isDemoMode ? createInitialState : loadState);

  useEffect(() => {
    if (!isDemoMode) saveState(state);
  }, [state]);

  const api: GameApi = useMemo(
    () => ({
      public: selectPublic(state),
      private: selectPrivate(state),
      revealed: selectRevealed(state),
      dispatch,
    }),
    [state],
  );

  return <GameApiContext.Provider value={api}>{children}</GameApiContext.Provider>;
}
