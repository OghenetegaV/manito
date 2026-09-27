import type { GamePhase } from "@/game/types";

export type AudioEvent =
  | "welcome_enter"
  | "assignment_shuffle"
  | "assignment_reveal"
  | "task_reveal"
  | "countdown_warning"
  | "proof_submitted"
  | "midnight_reveal"
  | "punishment"
  | "game_complete";

/**
 * Optional sound layer. Nothing in the game depends on it: with no sources registered
 * (the default) or `enabled === false`, `play()` is a silent no-op. To add sound later,
 * register files once at startup, e.g.
 *
 *   audio.register({ midnight_reveal: "/audio/midnight.mp3" });
 *   audio.setEnabled(true);
 */
class AudioService {
  private enabled = false;
  private sources: Partial<Record<AudioEvent, string>> = {};
  private cache = new Map<string, HTMLAudioElement>();

  register(sources: Partial<Record<AudioEvent, string>>) {
    this.sources = { ...this.sources, ...sources };
  }

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  isEnabled() {
    return this.enabled;
  }

  play(event: AudioEvent) {
    if (!this.enabled) return;
    const src = this.sources[event];
    if (!src) return;
    try {
      let el = this.cache.get(src);
      if (!el) {
        el = new Audio(src);
        this.cache.set(src, el);
      }
      el.currentTime = 0;
      void el.play().catch(() => {
        // Autoplay policies can refuse; the game carries on silently.
      });
    } catch {
      // Audio is never allowed to break the game.
    }
  }
}

export const audio = new AudioService();

/** Phase changes that have a matching cue. */
export const PHASE_AUDIO: Partial<Record<GamePhase, AudioEvent>> = {
  lobby: "welcome_enter",
  assignment: "assignment_shuffle",
  "manito-reveal": "assignment_reveal",
  task: "task_reveal",
  midnight: "midnight_reveal",
  punishment: "punishment",
  complete: "game_complete",
};
