import { createContext, useContext } from "react";
import type { Action } from "./machine";
import type { PrivateGame, PublicGame, RevealedGame } from "./selectors";

/**
 * What every consuming component actually gets, regardless of which provider is mounted
 * (local/demo or remote/Supabase — see GameProvider.tsx). Both providers compute this shape
 * however suits them; nothing downstream has to know or care which one is active.
 */
export type GameApi = {
  public: PublicGame;
  private: PrivateGame | null;
  revealed: RevealedGame | null;
  dispatch: (action: Action) => void;
};

export const GameApiContext = createContext<GameApi | null>(null);

function useGameApi(): GameApi {
  const api = useContext(GameApiContext);
  if (!api) throw new Error("Game hooks must be used inside <GameProvider>.");
  return api;
}

export function usePublicGame(): PublicGame {
  return useGameApi().public;
}

export function usePrivateGame(): PrivateGame | null {
  return useGameApi().private;
}

export function useRevealedGame(): RevealedGame | null {
  return useGameApi().revealed;
}

export function useGameDispatch(): (action: Action) => void {
  return useGameApi().dispatch;
}
