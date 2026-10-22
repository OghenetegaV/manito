import { describe, expect, it } from "vitest";
import { FEATURES, PARTICIPANTS, TASKS } from "@/config/gameConfig";
import { mulberry32 } from "./assignments";
import { createGameReducer, createInitialState, everyoneReady, failedIds, type Action } from "./machine";
import { selectPrivate, selectPublic, selectRevealed } from "./selectors";
import { createRound } from "./setup";
import type { GameState, Proof } from "./types";

const ALL_ON = { schedule: true, consequences: true };
const live = createGameReducer(FEATURES);
const full = createGameReducer(ALL_ON);

const evidence = (): Proof => ({
  media: { kind: "video", name: "dance.mp4", size: 1024, url: "blob:x" },
  submittedAt: 2,
});

const run = (reducer: typeof live, state: GameState, ...actions: Action[]) => actions.reduce(reducer, state);

/** Plays the game up to the moment the player has just been shown their task. */
function toTask(reducer: typeof live, seed = 1, me = "lola"): GameState {
  const s0 = createInitialState();
  const everyoneIn: Action[] = s0.participants.flatMap((p) => [
    { type: "JOIN", id: p.id, self: p.id === me } as Action,
    { type: "SET_READY", id: p.id } as Action,
  ]);
  const s1 = run(reducer, s0, { type: "ENTER" }, ...everyoneIn, { type: "GATHER" });
  return run(
    reducer,
    s1,
    createRound(s1.participants, mulberry32(seed)),
    { type: "ASSIGNMENT_DONE" },
    { type: "OPEN_MISSION", now: 1_000 },
  );
}

describe("the cast and the tasks", () => {
  it("has five girls, and Rey is not one of them", () => {
    expect(PARTICIPANTS.map((p) => p.name)).toEqual(["TIA", "LOLA", "ORE", "OPE", "DUMADE"]);
  });

  it("gives every girl a different task", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = toTask(live, seed);
      const ids = Object.values(s.tasks).map((t) => t.id);
      expect(new Set(ids).size).toBe(PARTICIPANTS.length);
    }
    expect(TASKS).toHaveLength(6);
  });
});

describe("the game as it runs now (no schedule, no consequences)", () => {
  it("goes draw → task → evidence with no clock", () => {
    const s = toTask(live);
    expect(s.phase).toBe("task");
    expect(s.deadline).toBeUndefined();

    const hub = run(live, s, { type: "ACCEPT_MISSION" });
    expect(hub.phase).toBe("countdown"); // the mission hub
    const proofPhase = run(live, hub, { type: "OPEN_PROOF" });
    const done = run(live, proofPhase, { type: "SUBMIT_PROOF", proof: evidence() }, { type: "CLOSE_PROOF" });
    expect(done.phase).toBe("countdown");
    expect(selectPrivate(done)!.taskStatus).toBe("submitted");
  });

  it("never times out, because there is no deadline", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" });
    expect(live(s, { type: "TIME_UP", now: Number.MAX_SAFE_INTEGER })).toBe(s);
  });

  it("requires actual evidence", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" }, { type: "OPEN_PROOF" });
    expect(live(s, { type: "SUBMIT_PROOF", proof: { submittedAt: 1 } as Proof })).toBe(s);
  });

  it("lets evidence be replaced", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" }, { type: "OPEN_PROOF" }, { type: "SUBMIT_PROOF", proof: evidence() });
    const again = live(s, { type: "SUBMIT_PROOF", proof: { ...evidence(), note: "second take" } });
    expect(again.proof?.note).toBe("second take");
  });
});

describe("phase machine", () => {
  it("ignores actions that are illegal in the current phase", () => {
    const fresh = createInitialState();
    expect(live(fresh, { type: "OPEN_MIDNIGHT" })).toBe(fresh);
    const lobby = run(live, fresh, { type: "ENTER" });
    expect(live(lobby, { type: "SUBMIT_PROOF", proof: evidence() })).toBe(lobby);
  });

  it("won't leave the lobby until everyone is ready", () => {
    const s = run(live, createInitialState(), { type: "ENTER" }, { type: "JOIN", id: "tia", self: true }, { type: "SET_READY", id: "tia" });
    expect(everyoneReady(s)).toBe(false);
    expect(live(s, { type: "GATHER" }).phase).toBe("lobby");
  });

  it("play again starts a fresh lobby with nothing carried over", () => {
    expect(live(toTask(live), { type: "RESTART" })).toEqual(createInitialState());
    const complete: GameState = { ...toTask(live), phase: "complete" };
    const again = live(complete, { type: "PLAY_AGAIN" });
    expect(again.phase).toBe("lobby");
    expect(again.assignments).toEqual([]);
    expect(again.currentUserId).toBeUndefined();
  });
});

describe("the hidden schedule and consequences, switched on", () => {
  it("starts a clock and only ends the mission once it has really run out", () => {
    const s = run(full, toTask(full), { type: "ACCEPT_MISSION" });
    expect(s.deadline).toBeDefined();
    expect(full(s, { type: "TIME_UP", now: s.deadline! - 1 }).phase).toBe("countdown");
    expect(full(s, { type: "TIME_UP", now: s.deadline! }).phase).toBe("deadline");
  });

  it("sends a player with no evidence through failure and consequence", () => {
    const base = run(full, toTask(full), { type: "ACCEPT_MISSION" });
    const quiet: GameState = { ...base, simulatedSubmissions: {} };
    const atMidnight = run(full, quiet, { type: "TIME_UP", now: base.deadline! }, { type: "OPEN_MIDNIGHT" });
    expect(failedIds(atMidnight)).toContain("lola");
    const failed = run(full, atMidnight, { type: "AFTER_MIDNIGHT" });
    expect(failed.phase).toBe("failed");
    expect(run(full, failed, { type: "SHOW_PUNISHMENT" }, { type: "FINISH" }).phase).toBe("complete");
  });

  it("skips consequences when only the schedule is on", () => {
    const scheduleOnly = createGameReducer({ schedule: true, consequences: false });
    const base = run(scheduleOnly, toTask(scheduleOnly), { type: "ACCEPT_MISSION" });
    const quiet: GameState = { ...base, simulatedSubmissions: {} };
    const end = run(scheduleOnly, quiet, { type: "TIME_UP", now: base.deadline! }, { type: "OPEN_MIDNIGHT" }, { type: "AFTER_MIDNIGHT" });
    expect(end.phase).toBe("complete");
  });
});

describe("secret information stays secret", () => {
  it("never exposes pairings, tasks or consequences through the public view", () => {
    const view = selectPublic(toTask(live));
    expect(Object.keys(view).sort()).toEqual(
      ["currentUserId", "deadline", "everyoneReady", "joinedCount", "participants", "phase", "presence", "readyCount", "roundActive"].sort(),
    );
  });

  it("gives the private view only the signed-in player's own manito and task", () => {
    const s = toTask(live, 7, "lola");
    const mine = s.assignments.find((a) => a.giverId === "lola")!.receiverId;
    const view = selectPrivate(s)!;
    expect(view.me.id).toBe("lola");
    expect(view.manito?.id).toBe(mine);
    expect(view.manito?.id).not.toBe("lola");
    expect(view.task).toEqual(s.tasks.lola);
    expect(view.punishment).toBeUndefined();
  });

  it("shows no private data before the reveal phase", () => {
    const s = toTask(live);
    expect(selectPrivate({ ...s, phase: "assignment" })).toBeNull();
    expect(selectPrivate({ ...s, phase: "ready" })).toBeNull();
  });

  it("keeps everyone's pairings hidden until the reveal phase", () => {
    const s = toTask(live);
    for (const phase of ["assignment", "manito-reveal", "task", "countdown", "proof", "deadline"] as const) {
      expect(selectRevealed({ ...s, phase })).toBeNull();
    }
    const rows = selectRevealed({ ...s, phase: "midnight" })!.rows;
    expect(rows.map((r) => [r.giver.id, r.receiver.id])).toEqual(s.assignments.map((a) => [a.giverId, a.receiverId]));
  });

  it("only shows a consequence once announced, and only to whoever failed", () => {
    const s: GameState = { ...toTask(live), simulatedSubmissions: {}, proof: undefined };
    expect(selectRevealed({ ...s, phase: "failed" })!.failed.every((f) => f.punishment === undefined)).toBe(true);
    expect(selectRevealed({ ...s, phase: "punishment" })!.failed.every((f) => !!f.punishment)).toBe(true);

    const withProof: GameState = { ...s, phase: "punishment", proof: evidence() };
    expect(selectPrivate(withProof)!.punishment).toBeUndefined();
    expect(selectPrivate({ ...s, phase: "punishment" })!.punishment).toEqual(s.punishments.lola);
  });
});
