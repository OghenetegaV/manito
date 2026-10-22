import { describe, expect, it } from "vitest";
import { DARES, FEATURES, GROUP_PHOTO_CHALLENGES, MANITO_PHOTO_BRIEF, PARTICIPANTS } from "@/config/gameConfig";
import { mulberry32 } from "./assignments";
import { createGameReducer, createInitialState, everyoneReady, failedIds, type Action } from "./machine";
import { fillTemplate } from "./missionTemplate";
import { selectPrivate, selectPublic, selectRevealed } from "./selectors";
import { createRound } from "./setup";
import type { GameState, MissionSlot, Proof } from "./types";

const ALL_ON = { schedule: true, consequences: true };
const live = createGameReducer(FEATURES);
const full = createGameReducer(ALL_ON);

const evidence = (kind: "video" | "image" = "video"): Proof => ({
  media: { kind, name: kind === "video" ? "dance.mp4" : "photo.jpg", size: 1024, url: "blob:x" },
  submittedAt: 2,
});

const run = (reducer: typeof live, state: GameState, ...actions: Action[]) => actions.reduce(reducer, state);

const submitAll = (reducer: typeof live, state: GameState): GameState =>
  (["dare", "manito-photo", "group-photo"] as MissionSlot[]).reduce(
    (s, missionId) =>
      run(
        reducer,
        s,
        { type: "OPEN_PROOF", missionId },
        { type: "SUBMIT_PROOF", missionId, proof: evidence(missionId === "dare" ? "video" : "image") },
        { type: "CLOSE_PROOF" },
      ),
    state,
  );

/** Plays the game up to the moment the player has just been shown their missions. */
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

describe("the cast and the missions", () => {
  it("has five girls, and Rey is not one of them", () => {
    expect(PARTICIPANTS.map((p) => p.name)).toEqual(["TIA", "LOLA", "ORE", "OPE", "DUMADE"]);
  });

  it("has one dare per girl and more group-photo challenges than girls", () => {
    expect(DARES).toHaveLength(PARTICIPANTS.length);
    expect(GROUP_PHOTO_CHALLENGES.length).toBeGreaterThan(PARTICIPANTS.length);
  });

  it("gives every girl three missions: a dare, the Manito photo, a group photo", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const s = toTask(live, seed);
      for (const p of PARTICIPANTS) {
        const missions = s.tasks[p.id];
        expect(missions.map((m) => m.id)).toEqual(["dare", "manito-photo", "group-photo"]);
      }

      // the dare and the group photo are dealt 1:1, never repeated within a round
      const dareTitles = PARTICIPANTS.map((p) => s.tasks[p.id][0].title);
      const groupPhotoTitles = PARTICIPANTS.map((p) => s.tasks[p.id][2].title);
      expect(new Set(dareTitles).size).toBe(PARTICIPANTS.length);
      expect(new Set(groupPhotoTitles).size).toBe(PARTICIPANTS.length);

      // the Manito photo is the exact same brief for everyone
      for (const p of PARTICIPANTS) expect(s.tasks[p.id][1].title).toBe(MANITO_PHOTO_BRIEF.title);
    }
  });
});

describe("the Manito-photo brief", () => {
  it("fills in the real name wherever the token appears", () => {
    expect(fillTemplate("A photo of {{manito}}, and only {{manito}}.", "Tia")).toBe("A photo of Tia, and only Tia.");
  });

  it("leaves text with no token untouched", () => {
    expect(fillTemplate("No token here.", "Tia")).toBe("No token here.");
  });
});

describe("the game as it runs now (no schedule, no consequences)", () => {
  it("goes draw → missions → evidence with no clock", () => {
    const s = toTask(live);
    expect(s.phase).toBe("task");
    expect(s.deadline).toBeUndefined();

    const hub = run(live, s, { type: "ACCEPT_MISSION" });
    expect(hub.phase).toBe("countdown"); // the mission hub
    const done = submitAll(live, hub);
    expect(done.phase).toBe("countdown");
    expect(selectPrivate(done)!.allSubmitted).toBe(true);
    expect(selectPrivate(done)!.missions.every((m) => m.status === "submitted")).toBe(true);
  });

  it("isn't done until all three missions have evidence", () => {
    const hub = run(live, toTask(live), { type: "ACCEPT_MISSION" });
    const oneDone = run(
      live,
      hub,
      { type: "OPEN_PROOF", missionId: "dare" },
      { type: "SUBMIT_PROOF", missionId: "dare", proof: evidence() },
      { type: "CLOSE_PROOF" },
    );
    const view = selectPrivate(oneDone)!;
    expect(view.allSubmitted).toBe(false);
    expect(view.missions.find((m) => m.mission.id === "dare")!.status).toBe("submitted");
    expect(view.missions.find((m) => m.mission.id === "manito-photo")!.status).toBe("active");
  });

  it("never times out, because there is no deadline", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" });
    expect(live(s, { type: "TIME_UP", now: Number.MAX_SAFE_INTEGER })).toBe(s);
  });

  it("requires actual evidence", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" }, { type: "OPEN_PROOF", missionId: "dare" });
    expect(live(s, { type: "SUBMIT_PROOF", missionId: "dare", proof: { submittedAt: 1 } as Proof })).toBe(s);
  });

  it("rejects a photo for the dare (wrong evidence kind) at the UI layer, but the reducer itself just stores what it's given", () => {
    // the reducer trusts its caller — ProofSubmission.tsx is what enforces video-for-dare before
    // ever dispatching. Here we just confirm the dare's own catalog entry really does ask for video.
    expect(DARES.every((d) => d.proofRequired === "video")).toBe(true);
  });

  it("lets evidence be replaced", () => {
    const s = run(
      live,
      toTask(live),
      { type: "ACCEPT_MISSION" },
      { type: "OPEN_PROOF", missionId: "dare" },
      { type: "SUBMIT_PROOF", missionId: "dare", proof: evidence() },
    );
    const again = live(s, { type: "SUBMIT_PROOF", missionId: "dare", proof: { ...evidence(), note: "second take" } });
    expect(again.proofs.dare?.note).toBe("second take");
  });

  it("keeps each mission's proof in its own slot", () => {
    const s = run(
      live,
      toTask(live),
      { type: "ACCEPT_MISSION" },
      { type: "OPEN_PROOF", missionId: "dare" },
      { type: "SUBMIT_PROOF", missionId: "dare", proof: evidence("video") },
      { type: "OPEN_PROOF", missionId: "manito-photo" },
      { type: "SUBMIT_PROOF", missionId: "manito-photo", proof: evidence("image") },
    );
    expect(s.proofs.dare?.media.kind).toBe("video");
    expect(s.proofs["manito-photo"]?.media.kind).toBe("image");
    expect(s.proofs["group-photo"]).toBeUndefined();
  });
});

describe("phase machine", () => {
  it("ignores actions that are illegal in the current phase", () => {
    const fresh = createInitialState();
    expect(live(fresh, { type: "OPEN_MIDNIGHT" })).toBe(fresh);
    const lobby = run(live, fresh, { type: "ENTER" });
    expect(live(lobby, { type: "SUBMIT_PROOF", missionId: "dare", proof: evidence() })).toBe(lobby);
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

  it("sends a player with incomplete evidence through failure and consequence", () => {
    const base = run(full, toTask(full), { type: "ACCEPT_MISSION" });
    const quiet: GameState = { ...base, simulatedSubmissions: {} };
    const atMidnight = run(full, quiet, { type: "TIME_UP", now: base.deadline! }, { type: "OPEN_MIDNIGHT" });
    expect(failedIds(atMidnight)).toContain("lola");
    const failed = run(full, atMidnight, { type: "AFTER_MIDNIGHT" });
    expect(failed.phase).toBe("failed");
    expect(run(full, failed, { type: "SHOW_PUNISHMENT" }, { type: "FINISH" }).phase).toBe("complete");
  });

  it("only counts the current player as having submitted once all three missions are in", () => {
    const base = run(full, toTask(full), { type: "ACCEPT_MISSION" });
    const twoOfThree = run(
      full,
      base,
      { type: "OPEN_PROOF", missionId: "dare" },
      { type: "SUBMIT_PROOF", missionId: "dare", proof: evidence("video") },
      { type: "CLOSE_PROOF" },
      { type: "OPEN_PROOF", missionId: "manito-photo" },
      { type: "SUBMIT_PROOF", missionId: "manito-photo", proof: evidence("image") },
      { type: "CLOSE_PROOF" },
    );
    const atMidnight = run(full, twoOfThree, { type: "TIME_UP", now: base.deadline! }, { type: "OPEN_MIDNIGHT" });
    expect(failedIds(atMidnight)).toContain("lola");

    const allThree = submitAll(full, twoOfThree);
    const atMidnight2 = run(full, allThree, { type: "TIME_UP", now: base.deadline! }, { type: "OPEN_MIDNIGHT" });
    expect(failedIds(atMidnight2)).not.toContain("lola");
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
  it("never exposes pairings, missions or consequences through the public view", () => {
    const view = selectPublic(toTask(live));
    expect(Object.keys(view).sort()).toEqual(
      ["currentUserId", "deadline", "everyoneReady", "joinedCount", "participants", "phase", "presence", "readyCount", "roundActive"].sort(),
    );
  });

  it("gives the private view only the signed-in player's own manito and missions", () => {
    const s = toTask(live, 7, "lola");
    const mine = s.assignments.find((a) => a.giverId === "lola")!.receiverId;
    const view = selectPrivate(s)!;
    expect(view.me.id).toBe("lola");
    expect(view.manito?.id).toBe(mine);
    expect(view.manito?.id).not.toBe("lola");
    expect(view.missions.map((m) => m.mission)).toEqual(s.tasks.lola);
    expect(view.punishment).toBeUndefined();
  });

  it("tracks which mission the evidence screen is open on, privately", () => {
    const s = run(live, toTask(live), { type: "ACCEPT_MISSION" }, { type: "OPEN_PROOF", missionId: "group-photo" });
    expect(selectPrivate(s)!.editing?.mission.id).toBe("group-photo");
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
    const s: GameState = { ...toTask(live), simulatedSubmissions: {}, proofs: {} };
    expect(selectRevealed({ ...s, phase: "failed" })!.failed.every((f) => f.punishment === undefined)).toBe(true);
    expect(selectRevealed({ ...s, phase: "punishment" })!.failed.every((f) => !!f.punishment)).toBe(true);

    const allSubmitted = submitAll(live, run(live, s, { type: "ACCEPT_MISSION" }));
    const withProofs: GameState = { ...allSubmitted, phase: "punishment" };
    expect(selectPrivate(withProofs)!.punishment).toBeUndefined();
    expect(selectPrivate({ ...s, phase: "punishment" })!.punishment).toEqual(s.punishments.lola);
  });
});
