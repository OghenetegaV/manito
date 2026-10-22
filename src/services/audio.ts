import type { GamePhase } from "@/game/types";

export type SfxName =
  | "click"
  | "seat_claim"
  | "ready_ding"
  | "welcome_enter"
  | "assignment_shuffle"
  | "assignment_reveal"
  | "task_reveal"
  | "proof_submitted"
  | "midnight_reveal"
  | "punishment"
  | "game_complete";

const MUTE_KEY = "manito:audio-muted";

/* ------------------------------------------------------------------ */
/* Low-level synthesis helpers                                         */
/* ------------------------------------------------------------------ */

type Wave = OscillatorType;

/** One short tone: quick attack, exponential decay — a music-box pluck rather than a buzz. */
function playNote(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  startTime: number,
  duration: number,
  wave: Wave = "triangle",
  peakGain = 0.5,
) {
  const osc = ctx.createOscillator();
  osc.type = wave;
  osc.frequency.value = freq;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

/** A soft, slow-swelling tone — gentle fade in and out, no percussive attack. Used for the theme. */
function playPad(ctx: AudioContext, dest: AudioNode, freq: number, startTime: number, duration: number, peakGain = 0.18) {
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;

  const attack = Math.min(0.6, duration * 0.4);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

/** A short burst of filtered noise — paper, static, a soft "shh". */
function playNoiseBurst(ctx: AudioContext, dest: AudioNode, startTime: number, duration: number, filterFreq: number, peakGain = 0.35) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  source.start(startTime);
  source.stop(startTime + duration + 0.02);
}

/* ------------------------------------------------------------------ */
/* The theme — a music box: twinkly, sparse, with real pauses          */
/* ------------------------------------------------------------------ */

const C5 = 523.25,
  D5 = 587.33,
  E5 = 659.25,
  G5 = 783.99,
  A5 = 880.0,
  C6 = 1046.5;

/** [note (0 = rest), duration, time until the next note starts]. Sparse on purpose — real gaps
 * between phrases, like a wind-up box running down, not a continuous hum. */
const THEME: [number[], number, number][] = [
  [[C5], 0.3, 0.55],
  [[E5], 0.3, 0.55],
  [[G5], 0.3, 0.55],
  [[0], 0, 0.35],
  [[D5], 0.3, 0.55],
  [[G5], 0.3, 0.55],
  [[C6], 0.4, 0.7],
  [[0], 0, 0.55],
  [[A5], 0.3, 0.55],
  [[G5], 0.3, 0.55],
  [[E5], 0.3, 0.55],
  [[0], 0, 0.35],
  [[D5], 0.3, 0.55],
  [[C5], 0.4, 0.85],
  [[0], 0, 0.75],
];

/* ------------------------------------------------------------------ */
/* Interactive sound effects                                           */
/* ------------------------------------------------------------------ */

const PATCHES: Record<SfxName, (ctx: AudioContext, dest: AudioNode) => void> = {
  click: (ctx, dest) => playNote(ctx, dest, 720, ctx.currentTime, 0.05, "sine", 0.22),

  seat_claim: (ctx, dest) => {
    const t = ctx.currentTime;
    playNote(ctx, dest, 523.25, t, 0.1, "triangle", 0.3);
    playNote(ctx, dest, 659.25, t + 0.07, 0.14, "triangle", 0.32);
  },

  ready_ding: (ctx, dest) => {
    const t = ctx.currentTime;
    playNote(ctx, dest, 880, t, 0.22, "sine", 0.3);
    playNote(ctx, dest, 1318.5, t + 0.02, 0.3, "sine", 0.14);
  },

  welcome_enter: (ctx, dest) => {
    const t = ctx.currentTime;
    [C5, E5, G5, C5 * 2].forEach((f, i) => playNote(ctx, dest, f, t + i * 0.07, 0.22, "triangle", 0.26));
  },

  // Matches ShuffleAnimation's ~3.8s run (see TICKS in ShuffleAnimation.tsx): a low filtered
  // drone that rises in pitch and brightness, a ticking pulse that quickens then settles along
  // with the cards reordering on screen, and a soft bright swell right as sealing is about to begin.
  assignment_shuffle: (ctx, dest) => {
    const t = ctx.currentTime;
    const total = 3.8;

    const drone = ctx.createOscillator();
    drone.type = "sawtooth";
    drone.frequency.setValueAtTime(65, t);
    drone.frequency.exponentialRampToValueAtTime(130, t + total);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = 3;
    filter.frequency.setValueAtTime(200, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + total);

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, t);
    droneGain.gain.linearRampToValueAtTime(0.1, t + 0.5);
    droneGain.gain.setValueAtTime(0.1, t + total - 0.35);
    droneGain.gain.linearRampToValueAtTime(0, t + total);

    drone.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(dest);
    drone.start(t);
    drone.stop(t + total + 0.05);

    const tickGaps = [0.26, 0.22, 0.18, 0.14, 0.11, 0.1, 0.1, 0.11, 0.14, 0.18, 0.23, 0.29];
    let when = t + 0.08;
    for (const gap of tickGaps) {
      playNote(ctx, dest, 1050, when, 0.03, "square", 0.045);
      when += gap;
    }

    playPad(ctx, dest, E5, t + total - 0.55, 0.75, 0.16);
  },

  assignment_reveal: (ctx, dest) => {
    const t = ctx.currentTime;
    [C5, D5, E5, G5, A5, G5 * 2 * 0 + 1046.5].forEach((f, i) => playNote(ctx, dest, f, t + i * 0.08, 0.3, "triangle", 0.28));
  },

  task_reveal: (ctx, dest) => {
    const t = ctx.currentTime;
    playNoiseBurst(ctx, dest, t, 0.18, 2200, 0.2);
    playNote(ctx, dest, 659.25, t + 0.12, 0.16, "triangle", 0.22);
  },

  proof_submitted: (ctx, dest) => {
    const t = ctx.currentTime;
    playNote(ctx, dest, 659.25, t, 0.12, "sine", 0.28);
    playNote(ctx, dest, 880, t + 0.1, 0.22, "sine", 0.3);
  },

  midnight_reveal: (ctx, dest) => {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 1.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 1.65);
  },

  punishment: (ctx, dest) => {
    const t = ctx.currentTime;
    playNote(ctx, dest, 392, t, 0.22, "sawtooth", 0.18);
    playNote(ctx, dest, 293.66, t + 0.2, 0.32, "sawtooth", 0.18);
  },

  game_complete: (ctx, dest) => {
    const t = ctx.currentTime;
    [C5, E5, G5, C5 * 2].forEach((f, i) => playNote(ctx, dest, f, t + i * 0.1, 0.35, "triangle", 0.3));
  },
};

/* ------------------------------------------------------------------ */
/* The engine                                                          */
/* ------------------------------------------------------------------ */

function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Everything is synthesised with the Web Audio API — no sound files to source or ship. Nothing
 * in the game depends on it: with audio unsupported, blocked, or muted, every call here is a
 * silent no-op and the game plays on exactly the same.
 *
 * Browsers refuse to make sound before a real user gesture, so call `unlock()` from a click/tap
 * handler (see SoundCheck.tsx) before anything will actually be heard.
 */
class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private themeGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private themeStarted = false;
  private nextNoteTime = 0;
  private noteIndex = 0;
  private _muted = loadMuted();
  private listeners = new Set<() => void>();

  get muted(): boolean {
    return this._muted;
  }

  get isUnlocked(): boolean {
    return this.ctx !== null;
  }

  /** Notified whenever `muted` changes, from any source. */
  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Call from inside a real click/tap handler. Safe to call more than once. */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") void this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();

      this.master = this.ctx.createGain();
      this.master.gain.value = this._muted ? 0 : 1;
      this.master.connect(this.ctx.destination);

      this.themeGain = this.ctx.createGain();
      this.themeGain.gain.value = 0.13;
      this.themeGain.connect(this.master);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.master);

      if (!this._muted) this.startTheme();
    } catch {
      // Web Audio unsupported or blocked by the browser — the game carries on silently.
    }
  }

  setMuted(muted: boolean) {
    this._muted = muted;
    try {
      window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
    } catch {
      // private browsing / storage full: the preference just won't persist
    }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.ctx.currentTime, 0.05);
      if (!muted) this.startTheme();
    }
    this.listeners.forEach((fn) => fn());
  }

  toggleMuted() {
    this.setMuted(!this._muted);
  }

  /** Fires a short interactive sound effect. No-ops until `unlock()` has run, or while muted. */
  play(name: SfxName) {
    if (!this.ctx || !this.sfxGain || this._muted) return;
    try {
      PATCHES[name]?.(this.ctx, this.sfxGain);
    } catch {
      // a sound effect must never be able to break the game
    }
  }

  private startTheme() {
    if (!this.ctx || !this.themeGain || this.themeStarted) return;
    this.themeStarted = true;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduleTheme();
  }

  /** A small look-ahead scheduler: queues whatever notes fall in the next 1.5s, then checks
   * back — far steadier than one setTimeout per note, which drifts under tab throttling. */
  private scheduleTheme = () => {
    if (!this.ctx || !this.themeGain) return;
    while (this.nextNoteTime < this.ctx.currentTime + 1.5) {
      const [freqs, duration, gap] = THEME[this.noteIndex % THEME.length];
      for (const f of freqs) {
        if (f > 0) playNote(this.ctx, this.themeGain, f, this.nextNoteTime, duration, "triangle", 0.32);
      }
      this.nextNoteTime += gap;
      this.noteIndex++;
    }
    window.setTimeout(this.scheduleTheme, 400);
  };
}

export const audio = new AudioEngine();

/** Phase changes that have a matching cue. */
export const PHASE_AUDIO: Partial<Record<GamePhase, SfxName>> = {
  lobby: "welcome_enter",
  assignment: "assignment_shuffle",
  "manito-reveal": "assignment_reveal",
  task: "task_reveal",
  midnight: "midnight_reveal",
  punishment: "punishment",
  complete: "game_complete",
};
