import type {
  Expression,
  GameMasterState,
  GamePhase,
  Participant,
  Punishment,
  Task,
} from "@/game/types";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

export const PARTICIPANTS: Participant[] = [
  { id: "tia", name: "TIA" },
  { id: "lola", name: "LOLA" },
  { id: "ore", name: "ORE" },
  { id: "ope", name: "OPE" },
  { id: "dumade", name: "DUMADE" },
];

/**
 * Parts of the game that are built but switched off for now.
 *  - schedule:      the mission deadline, countdown clock and the timed midnight reveal
 *  - consequences:  the "task failed" and punishment scenes that follow the reveal
 * With both off the game is: draw → secret task → upload evidence.
 */
export const FEATURES = {
  schedule: false,
  consequences: false,
} as const;

export type Features = { schedule: boolean; consequences: boolean };

export const GAME_MASTER_MESSAGES: Record<GameMasterState, string> = {
  welcome: "Welcome, girls.",
  ready: "Everyone's here. Let's make this interesting.",
  assignment: "Ready to find out who you're responsible for?",
  task: "Shh. Nobody can know. Not even a little.",
  countdown: "Tick tock. Your excuse is running out.",
  deadline: "Time's up. Where's the evidence?",
  proof: "Interesting. Let's see what you've got.",
  midnight: "Ladies… the secrets are coming out.",
  failed: "Oh. She actually failed.",
  punishment: "You knew there would be consequences.",
  complete: "That's a wrap. Until the next round.",
};

/** What she says at the mission screen when there is no clock running. */
export const MISSION_MESSAGES = {
  active: "Act natural. Don't get caught.",
  submitted: "Interesting. Let's see what you've got.",
} as const;

/** Which Game Master state narrates each phase. `null` = she stays out of sight. */
export const PHASE_GAME_MASTER: Record<GamePhase, GameMasterState | null> = {
  welcome: null,
  lobby: "welcome",
  ready: "ready",
  assignment: "assignment",
  "manito-reveal": "assignment",
  task: "task",
  countdown: "countdown",
  proof: "proof",
  deadline: "deadline",
  midnight: "midnight",
  failed: "failed",
  punishment: "punishment",
  complete: "complete",
};

export const GAME_MASTER_EXPRESSIONS: Record<GameMasterState, Expression> = {
  welcome: "smirking",
  ready: "smirking",
  assignment: "mischievous",
  task: "mischievous",
  countdown: "smirking",
  deadline: "curious",
  proof: "surprised",
  midnight: "amused",
  failed: "disappointed",
  punishment: "mischievous",
  complete: "proud",
};

export const PHASE_LABELS: Record<GamePhase, string> = {
  welcome: "Welcome",
  lobby: "Lobby",
  ready: "All present",
  assignment: "The draw",
  "manito-reveal": "Your Manito",
  task: "Secret task",
  countdown: "Your task",
  proof: "Evidence",
  deadline: "Time's up",
  midnight: "Midnight reveal",
  failed: "Consequences",
  punishment: "Consequences",
  complete: "Complete",
};

/** Steps shown in the progress rail. A step with a `feature` only appears when that feature is on. */
export const PROGRESS_STEPS: { label: string; phases: GamePhase[]; feature?: keyof Features }[] = [
  { label: "Lobby", phases: ["lobby", "ready"] },
  { label: "Draw", phases: ["assignment", "manito-reveal"] },
  { label: "Task", phases: ["task", "countdown"] },
  { label: "Evidence", phases: ["proof"] },
  { label: "Deadline", phases: ["deadline"], feature: "schedule" },
  { label: "Midnight", phases: ["midnight"], feature: "schedule" },
  { label: "Consequence", phases: ["failed", "punishment"], feature: "consequences" },
  { label: "Wrap", phases: ["complete"], feature: "schedule" },
];

export const TASKS: Task[] = [
  {
    id: "dance",
    emoji: "💃🏽",
    title: "The Main Character Dance",
    blocks: [
      {
        kind: "p",
        text: "At some point during the trip, suddenly start dancing in public as if your favourite song has just started playing.",
      },
      {
        kind: "list",
        title: "You must",
        items: [
          "Dance for at least 30 seconds.",
          "Act completely serious and confident.",
          "Get at least one of the girls to join you without directly asking her to dance.",
          "Do NOT explain why you're dancing.",
        ],
      },
    ],
    proof: "Get a video of the moment.",
    warning: "If anyone correctly guesses your task before you complete it, you FAIL.",
  },
  {
    id: "single",
    emoji: "👀",
    title: "The Innocent Question",
    blocks: [
      { kind: "p", text: "Approach an appropriate adult stranger and confidently ask:" },
      { kind: "quote", text: "“Excuse me, sorry to bother you, but are you single?”" },
      {
        kind: "p",
        text: "Whatever their answer, respond calmly and naturally, then walk away like you asked the most normal question in the world.",
      },
    ],
    bonus: "Do it without laughing or breaking character.",
    proof:
      "Your friends should capture the moment from a respectful distance. Don't record the stranger's face without permission.",
    warning: "If they're uncomfortable or uninterested, leave them alone immediately.",
  },
  {
    id: "influencer",
    emoji: "🎥",
    title: "Lifestyle Influencer",
    blocks: [
      { kind: "p", text: "For 5 minutes, become a full-blown lifestyle influencer in public." },
      {
        kind: "list",
        title: "You must",
        items: [
          "Give a dramatic introduction to your “followers”.",
          "Review at least 3 random things around you.",
          "Say “Guys, you NEED to…” at least once.",
          "Pretend you're being sponsored.",
          "Act like you're genuinely filming content for millions of followers.",
        ],
      },
    ],
    bonus: "Convince at least one stranger that you're actually an influencer.",
    proof: "Get a video of your performance.",
    warning: "Do NOT reveal that you're doing a secret task.",
  },
  {
    id: "entrance",
    emoji: "👠",
    title: "The Celebrity Entrance",
    blocks: [
      { kind: "p", text: "At a suitable public location, make a 60-second celebrity entrance." },
      { kind: "p", text: "Walk like you're arriving at the biggest event of your life." },
      {
        kind: "list",
        title: "You must",
        items: [
          "Walk dramatically and confidently.",
          "Wave at imaginary fans.",
          "Fix your hair/clothes like paparazzi are watching.",
          "Give at least one mysterious smile.",
          "Stay completely in character.",
        ],
      },
    ],
    bonus:
      "Get the girls to act as your paparazzi and shout things like “Over here!”, “One more picture!” and “Who are you wearing?”",
    proof: "Someone must record your entire entrance.",
    warning: "No laughing. You are FAMOUS.",
  },
  {
    id: "phone-call",
    emoji: "📞",
    title: "The Dramatic Phone Call",
    blocks: [
      {
        kind: "p",
        text: "Make a fake phone call in front of everyone that sounds extremely serious and dramatic. Keep the conversation going for at least 60 seconds.",
      },
      {
        kind: "p",
        text: "Make everyone think something serious is happening. Then reveal that you're actually talking about something completely ordinary.",
      },
      { kind: "p", text: "Example:" },
      { kind: "quote", text: "“Listen, I've made my decision. There's nothing you can say to change my mind…”" },
      { kind: "aside", text: "dramatic pause" },
      { kind: "quote", text: "“…I'm getting the vanilla ice cream.”" },
    ],
    bonus: "End with “We'll discuss this properly when I see you.” Then calmly put your phone away.",
    proof: "Your friends must capture the performance without exposing you.",
  },
  {
    id: "toast",
    emoji: "🥂",
    title: "The Toast",
    blocks: [
      { kind: "p", text: "During dinner or drinks, suddenly stand up and announce:" },
      { kind: "quote", text: "“Ladies, I'd like to make a toast.”" },
      { kind: "p", text: "Give a 60-second, unnecessarily emotional speech about your friendship." },
      {
        kind: "list",
        title: "You must include",
        items: [
          "One dramatic pause.",
          "One ridiculously specific memory.",
          "A heartfelt compliment.",
          "A completely unexpected ending.",
        ],
      },
      { kind: "p", text: "Example ending:" },
      { kind: "quote", text: "“To all the late nights, questionable decisions and unnecessary arguments…”" },
      { kind: "aside", text: "pause" },
      { kind: "quote", text: "“…and most importantly, to finally agreeing on where to eat. To us!” 🥂" },
    ],
    bonus: "Get someone outside the group to raise their glass with you.",
    proof: "Record the speech without making it obvious you're completing a task.",
  },
];

/** The house rules, shown in the Rules sheet. */
export const RULES = {
  title: "Secret Task Challenge",
  intro: "Each person will secretly receive a task to complete during the trip. Nobody should know what task you have.",
  steps: [
    "Keep your task completely secret.",
    "Complete it naturally during the trip without telling anyone you're doing a challenge.",
    "Your task must be done in public where appropriate.",
    "Take a photo/video as proof without ruining the moment.",
    "If someone correctly guesses your task before you complete it, you lose the task.",
    "Once completed, keep quiet until the Final Reveal.",
    "At the end of the trip, everyone reveals their task and shows their proof.",
  ],
  bonus: "The person who completes their task most convincingly gets an extra point.",
  golden: "Have fun, don't force strangers to participate, and respect anyone who isn't interested.",
} as const;

/** Only used when `FEATURES.consequences` is on. */
export const PUNISHMENTS: Punishment[] = [
  {
    id: "voice-note",
    title: "The Confession",
    description:
      "Send the group a 30-second voice note explaining, in full drama, exactly why you failed.",
    durationMs: 24 * HOUR,
  },
  {
    id: "next-round",
    title: "The Next Round",
    description: "You're covering the next round of snacks or drinks for all of you.",
  },
  {
    id: "compliment-tax",
    title: "The Compliment Tax",
    description:
      "Give every girl one specific compliment out loud the next time you're all together. No repeats.",
  },
  {
    id: "dress-code",
    title: "Dress Code",
    description:
      "At the next hang-out, you wear whatever theme the group decides. Sensible objections denied.",
  },
  {
    id: "newsreader",
    title: "The Newsreader",
    description:
      "Announce the next thing the group discusses as if reading breaking news. Full anchor voice.",
    durationMs: 48 * HOUR,
  },
];

export const GAME_CONFIG = {
  participants: PARTICIPANTS,
  features: FEATURES,
  gameMasterMessages: GAME_MASTER_MESSAGES,
  /** Only used when `FEATURES.schedule` is on: how long girls have once their task is revealed. */
  taskDurationMs: 24 * HOUR,
  /** Chance that a simulated player (preview only) hands in evidence. */
  simulatedSubmitRate: 0.7,
  /** Countdown intensity thresholds (remaining time). Only used with `FEATURES.schedule`. */
  urgency: { tenseBelowMs: 2 * HOUR, criticalBelowMs: 15 * MINUTE },
  tasks: TASKS,
  punishments: PUNISHMENTS,
  storageKey: "manito:v2",
  gameMasterManifest: "/gamemaster/manifest.json",
} as const;
