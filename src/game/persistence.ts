import { GAME_CONFIG } from "@/config/gameConfig";
import { createInitialState } from "./machine";
import { PHASE_ORDER } from "./selectors";
import type { GameState } from "./types";

/** Restores a saved game, falling back to a fresh one if anything about it looks off. */
export function loadState(): GameState {
  const fresh = createInitialState();
  try {
    const raw = window.localStorage.getItem(GAME_CONFIG.storageKey);
    if (!raw) return fresh;
    const saved = JSON.parse(raw) as Partial<GameState>;

    const sameCast =
      Array.isArray(saved.participants) &&
      saved.participants.length === fresh.participants.length &&
      fresh.participants.every((p, i) => saved.participants![i]?.id === p.id);

    if (!saved.phase || !PHASE_ORDER.includes(saved.phase) || !sameCast) return fresh;
    return { ...fresh, ...saved, participants: fresh.participants } as GameState;
  } catch {
    return fresh;
  }
}

export function saveState(state: GameState): void {
  try {
    // A video's blob URL dies with the page, so don't store a dead link (its name and size are kept).
    const proofs = Object.fromEntries(
      Object.entries(state.proofs).map(([id, proof]) =>
        proof.media.kind === "video" ? [id, { ...proof, media: { ...proof.media, url: undefined } }] : [id, proof],
      ),
    );
    window.localStorage.setItem(GAME_CONFIG.storageKey, JSON.stringify({ ...state, proofs }));
  } catch {
    // Storage full or unavailable (private mode): the game still works, it just won't survive a refresh.
  }
}
