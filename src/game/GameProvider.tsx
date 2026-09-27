import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { gameReducer, type Action } from "./machine";
import { loadState, saveState } from "./persistence";
import { selectPrivate, selectPublic, selectRevealed } from "./selectors";
import type { GameState } from "./types";

/**
 * The raw state is deliberately kept out of the public hooks: components get one of
 * the three gated views below, never the whole record.
 */
const StateContext = createContext<GameState | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);

  useEffect(() => saveState(state), [state]);

  return (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
}

function useRawState(): GameState {
  const s = useContext(StateContext);
  if (!s) throw new Error("Game hooks must be used inside <GameProvider>.");
  return s;
}

export function useGameDispatch(): Dispatch<Action> {
  const d = useContext(DispatchContext);
  if (!d) throw new Error("Game hooks must be used inside <GameProvider>.");
  return d;
}

export function usePublicGame() {
  const s = useRawState();
  return useMemo(() => selectPublic(s), [s]);
}

export function usePrivateGame() {
  const s = useRawState();
  return useMemo(() => selectPrivate(s), [s]);
}

export function useRevealedGame() {
  const s = useRawState();
  return useMemo(() => selectRevealed(s), [s]);
}
