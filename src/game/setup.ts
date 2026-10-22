import { GAME_CONFIG } from "@/config/gameConfig";
import { generateAssignments, shuffle, type Rng } from "./assignments";
import type { Action } from "./machine";
import type { Participant, Task } from "./types";

/**
 * Builds everything a round needs in one pass: pairings, each giver's three missions (one dare,
 * the shared Manito-photo brief, one group-photo challenge), a consequence per giver (only ever
 * shown to whoever fails), and — for the preview, where the other players aren't real clients —
 * who "submits" in time.
 */
export function createRound(
  participants: readonly Participant[],
  rng: Rng = Math.random,
): Extract<Action, { type: "BEGIN_ASSIGNMENT" }> {
  const assignments = generateAssignments(participants, rng);
  const { dares, manitoPhotoBrief, groupPhotoChallenges, punishments, simulatedSubmitRate } = GAME_CONFIG;

  const shuffledDares = shuffle(dares, rng);
  const shuffledGroupPhotos = shuffle(groupPhotoChallenges, rng);
  const shuffledPunishments = shuffle(punishments, rng);

  return {
    type: "BEGIN_ASSIGNMENT",
    assignments,
    tasks: Object.fromEntries(
      participants.map((p, i): [string, Task[]] => [
        p.id,
        [shuffledDares[i % shuffledDares.length], manitoPhotoBrief, shuffledGroupPhotos[i % shuffledGroupPhotos.length]],
      ]),
    ),
    punishments: Object.fromEntries(
      participants.map((p, i) => [p.id, shuffledPunishments[i % shuffledPunishments.length]]),
    ),
    simulatedSubmissions: Object.fromEntries(
      participants.map((p) => [p.id, rng() < simulatedSubmitRate]),
    ),
  };
}
