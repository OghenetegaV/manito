import type { Assignment, Participant } from "./types";

export type Rng = () => number;

/** Small seedable PRNG so the pairing logic can be tested deterministically. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Pairs every participant with exactly one other participant.
 *
 * The result is a derangement: each person is a giver once, a receiver once,
 * and never her own receiver. Rejection sampling keeps the draw uniform across
 * all valid derangements (~37% of shuffles qualify for n=5, so this converges fast);
 * a Sattolo cycle guarantees termination if sampling somehow keeps failing.
 */
export function generateAssignments(
  participants: readonly Participant[],
  rng: Rng = Math.random,
): Assignment[] {
  const ids = participants.map((p) => p.id);
  if (new Set(ids).size !== ids.length) throw new Error("Participant ids must be unique.");
  if (ids.length < 2) throw new Error("At least two participants are needed to pair anyone.");

  let receivers: string[] | null = null;
  for (let attempt = 0; attempt < 200 && !receivers; attempt++) {
    const candidate = shuffle(ids, rng);
    if (candidate.every((r, i) => r !== ids[i])) receivers = candidate;
  }
  const chosen = receivers ?? sattolo(ids, rng);

  return ids.map((giverId, i) => ({ giverId, receiverId: chosen[i] }));
}

/** Single-cycle permutation: no fixed points by construction. */
function sattolo(items: readonly string[], rng: Rng): string[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function validateAssignments(
  participants: readonly Participant[],
  assignments: readonly Assignment[],
): boolean {
  const ids = new Set(participants.map((p) => p.id));
  if (assignments.length !== ids.size) return false;
  const givers = new Set<string>();
  const receivers = new Set<string>();
  for (const a of assignments) {
    if (!ids.has(a.giverId) || !ids.has(a.receiverId)) return false;
    if (a.giverId === a.receiverId) return false;
    givers.add(a.giverId);
    receivers.add(a.receiverId);
  }
  return givers.size === ids.size && receivers.size === ids.size;
}
