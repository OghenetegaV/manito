import { useEffect, useMemo, useReducer, type ReactNode } from "react";
import { gameReducer } from "./machine";
import { loadState, saveState } from "./persistence";
import { selectPrivate, selectPublic, selectRevealed } from "./selectors";
import { GameApiContext, type GameApi } from "./gameContext";

/**
 * Local/demo mode: everything lives in this one browser (see persistence.ts), and the other
 * players are simulated (useSimulatedArrivals). This is what runs with no Supabase env vars
 * configured — see RemoteGameProvider.tsx for the real multiplayer path.
 */
export function LocalGameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);

  useEffect(() => saveState(state), [state]);

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
