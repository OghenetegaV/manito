import { describe, expect, it } from "vitest";
import { generateAssignments, mulberry32, validateAssignments } from "./assignments";
import type { Participant } from "./types";

const make = (n: number): Participant[] =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}` }));

describe("generateAssignments", () => {
  it("never assigns anyone to herself and uses each person once as giver and receiver", () => {
    for (const n of [2, 3, 4, 5, 6, 9]) {
      const people = make(n);
      for (let seed = 1; seed <= 500; seed++) {
        const result = generateAssignments(people, mulberry32(seed * 7919 + n));
        expect(validateAssignments(people, result)).toBe(true);
        expect(result.some((a) => a.giverId === a.receiverId)).toBe(false);
        expect(new Set(result.map((a) => a.receiverId)).size).toBe(n);
      }
    }
  });

  it("is deterministic for a given seed", () => {
    const people = make(5);
    expect(generateAssignments(people, mulberry32(42))).toEqual(
      generateAssignments(people, mulberry32(42)),
    );
  });

  it("produces different pairings across seeds", () => {
    const people = make(5);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      seen.add(JSON.stringify(generateAssignments(people, mulberry32(seed))));
    }
    expect(seen.size).toBeGreaterThan(10);
  });

  it("still terminates with a valid pairing when the rng is degenerate", () => {
    const people = make(5);
    const result = generateAssignments(people, () => 0);
    expect(validateAssignments(people, result)).toBe(true);
  });

  it("rejects impossible input", () => {
    expect(() => generateAssignments(make(1))).toThrow();
    expect(() => generateAssignments([{ id: "a", name: "A" }, { id: "a", name: "B" }])).toThrow();
  });
});

describe("validateAssignments", () => {
  it("flags self-assignment and duplicates", () => {
    const people = make(3);
    expect(
      validateAssignments(people, [
        { giverId: "p0", receiverId: "p0" },
        { giverId: "p1", receiverId: "p2" },
        { giverId: "p2", receiverId: "p1" },
      ]),
    ).toBe(false);
    expect(
      validateAssignments(people, [
        { giverId: "p0", receiverId: "p1" },
        { giverId: "p1", receiverId: "p2" },
        { giverId: "p2", receiverId: "p1" },
      ]),
    ).toBe(false);
  });
});
