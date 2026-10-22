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
 * With both off the game is: draw → secret missions → upload evidence.
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
  task: "Secret missions",
  countdown: "Your missions",
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
  { label: "Missions", phases: ["task", "countdown"] },
  { label: "Evidence", phases: ["proof"] },
  { label: "Deadline", phases: ["deadline"], feature: "schedule" },
  { label: "Midnight", phases: ["midnight"], feature: "schedule" },
  { label: "Consequence", phases: ["failed", "punishment"], feature: "consequences" },
  { label: "Wrap", phases: ["complete"], feature: "schedule" },
];

/** One dare, assigned 1:1 — exactly one per participant. Video evidence. */
export const DARES: Task[] = [
  {
    id: "dare",
    kind: "dare",
    emoji: "💃🏽",
    title: "The Unexpected Dance Break",
    blocks: [
      {
        kind: "p",
        text: "At an appropriate moment during the outing, randomly break into a 20-second dance in a public area. Dance with full confidence, as though your favourite song has just come on, even if there is no music.",
      },
      { kind: "p", text: "Your mission is to act as though this is completely normal." },
    ],
    proofRequired: "video",
    proof: "A video of the performance.",
  },
  {
    id: "dare",
    kind: "dare",
    emoji: "👠",
    title: "The Main Character Catwalk",
    blocks: [
      {
        kind: "p",
        text: "Strut confidently through an appropriate public space as though you are walking the runway at Fashion Week. Give the imaginary photographers your best poses and finish with a dramatic final walk.",
      },
    ],
    proofRequired: "video",
    proof: "A video of your catwalk.",
    warning: "Do not obstruct people or disrupt the venue.",
  },
  {
    id: "dare",
    kind: "dare",
    emoji: "🎥",
    title: "The Influencer Nobody Asked For",
    blocks: [
      {
        kind: "p",
        text: "Become a lifestyle influencer for at least 60 seconds. Film yourself narrating your experience at the outing, enthusiastically describing the venue, your activities and the general atmosphere.",
      },
      { kind: "p", text: "You must sound as though thousands of people are eagerly waiting for your update." },
    ],
    proofRequired: "video",
    proof: "A video of your vlog.",
    warning: "Do not record strangers without their permission.",
  },
  {
    id: "dare",
    kind: "dare",
    emoji: "🍽️",
    title: "The Unnecessary Food Critic",
    blocks: [
      {
        kind: "p",
        text: "Give a dramatic, professional food review of the dishes at your table. Discuss the presentation, aroma, texture and overall experience as though you are judging a restaurant for a prestigious food award.",
      },
      { kind: "p", text: "Deliver your review with a straight face." },
    ],
    proofRequired: "video",
    proof: "A video of your review.",
    warning: "Keep your feedback about the food honest and your interactions with the restaurant staff polite.",
  },
  {
    id: "dare",
    kind: "dare",
    emoji: "🥹",
    title: "The Emotional Friendship Speech",
    blocks: [
      { kind: "p", text: "At a suitable moment during an event, spontaneously deliver an emotional speech about friendship." },
      {
        kind: "p",
        text: "Thank your friends for their love, loyalty and support as though you are receiving a lifetime achievement award. You may even get a little dramatic.",
      },
      { kind: "p", text: "Your mission is to make the speech sound completely spontaneous." },
    ],
    proofRequired: "video",
    proof: "A video of your speech.",
  },
];

/**
 * The same brief for everyone — the `{{manito}}` token is filled in with the real name once
 * the player's own Manito is known (see game/missionTemplate.ts). One of the two picture
 * challenges every participant gets.
 */
export const MANITO_PHOTO_BRIEF: Task = {
  id: "manito-photo",
  kind: "manito-photo",
  emoji: "📸",
  title: "The Manito Shot",
  blocks: [
    {
      kind: "p",
      text: "One of your two picture challenges is about her: {{manito}}.",
    },
    {
      kind: "p",
      text: "Capture a photo of {{manito}} at some point during the outing — candid, natural, like you weren't even trying. A genuine moment, not a posed one.",
    },
  ],
  proofRequired: "photo",
  proof: "A photo of {{manito}}, taken without her realising it's for your mission.",
  warning: "She should have no idea it's happening. This one's just for you.",
};

/** The other picture challenge, assigned 1:1 from this catalog — about the group and the outing. */
export const GROUP_PHOTO_CHALLENGES: Task[] = [
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "😭",
    title: "The Picture Before Everything Went Wrong",
    blocks: [
      {
        kind: "p",
        text: "Take a picture of the group early in the outing, preferably when everyone is still looking fresh, composed and excited. The idea is to preserve the before picture.",
      },
      {
        kind: "p",
        text: "If possible, take another group picture towards the end of the outing to document how everyone looks after hours of activities.",
      },
      { kind: "aside", text: "the goal: a before-and-after memory of the same day" },
    ],
    proofRequired: "photo",
    proof: "A group photo early on — and ideally a second one later, for the before-and-after.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "😂",
    title: "The Person Who Made Us Laugh",
    blocks: [
      { kind: "p", text: "Capture a moment when one person in the group makes everyone laugh." },
      {
        kind: "p",
        text: "Don't ask everyone to look at the camera. Photograph the reactions, the person telling the story and the people struggling to keep a straight face.",
      },
      { kind: "aside", text: "the goal: preserve the joke, the reactions and the person responsible" },
    ],
    proofRequired: "photo",
    proof: "A candid photo of the laugh in progress — reactions, not posed smiles.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "👜",
    title: "The Unofficial Group Mother",
    blocks: [
      {
        kind: "p",
        text: "Take a picture of the person who spends the outing checking on everyone, organising the group, reminding people about their belongings or making sure nobody is left behind.",
      },
      { kind: "p", text: "Capture her actually doing it rather than asking her to pose." },
      { kind: "aside", text: "the goal: document the little roles everyone naturally takes on" },
    ],
    proofRequired: "photo",
    proof: "A candid photo of her mid-mothering — caught in the act, not posed.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "🍽️",
    title: "The Table Tells a Story",
    blocks: [
      { kind: "p", text: "Take a picture of the table during the outing." },
      {
        kind: "p",
        text: "Capture the food, drinks, scattered bags, half-finished meals, receipts or whatever else tells the story of what happened there. It doesn't have to be aesthetically perfect.",
      },
      { kind: "aside", text: "the goal: preserve the little details that might otherwise be forgotten" },
    ],
    proofRequired: "photo",
    proof: "A photo of the table, exactly as it actually looked.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "📱",
    title: "The Group Chat in Real Life",
    blocks: [
      {
        kind: "p",
        text: "Capture a moment when at least three people are engaged in different conversations, laughing, showing one another something on their phones or reacting to a story.",
      },
      { kind: "p", text: "The picture should feel like your group chat has come to life." },
      { kind: "aside", text: "the goal: a photograph of your actual friendship dynamic" },
    ],
    proofRequired: "photo",
    proof: "A photo of at least three people mid-conversation, unposed.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "😭",
    title: "The Unflattering but Unforgettable Picture",
    blocks: [
      {
        kind: "p",
        text: "Take a funny picture of yourself or a willing friend at an unexpected moment — someone caught mid-sentence, making a ridiculous face, dancing dramatically or reacting to something shocking.",
      },
      { kind: "p", text: "The picture should be funny without deliberately humiliating anyone." },
      {
        kind: "aside",
        text: "the goal: one picture nobody would choose as their profile photo but everyone loves anyway",
      },
    ],
    proofRequired: "photo",
    proof: "One deeply unserious, completely unposed photo.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "❤️",
    title: "The Five of Us",
    blocks: [
      { kind: "p", text: "Get all five members of the group into one picture." },
      {
        kind: "p",
        text: "It can be a selfie, a picture taken by a stranger who agrees to help, or a photograph using a phone timer. The important thing is that nobody is missing.",
      },
      { kind: "aside", text: "the goal: proof all five of you were there for this memory" },
    ],
    proofRequired: "photo",
    proof: "One photo with all five of you in it — nobody missing.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "🥹",
    title: "The Moment Nobody Noticed",
    blocks: [
      { kind: "p", text: "Capture a quiet, ordinary moment between two or more people in the group." },
      {
        kind: "p",
        text: "It could be someone resting their head on another person's shoulder, sharing food, fixing someone's hair or having a conversation while everyone else is occupied.",
      },
      { kind: "aside", text: "the goal: preserve the softer side of the friendship, not just the loud moments" },
    ],
    proofRequired: "photo",
    proof: "A quiet, candid photo — nobody posing for it.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "🌙",
    title: "The Last Picture Before We Leave",
    blocks: [
      { kind: "p", text: "Before the outing ends, capture one final picture of the group." },
      { kind: "p", text: "Everyone can be tired, happy, sleepy or completely unserious. Don't worry about making it perfect." },
      { kind: "aside", text: "the goal: a closing photograph that marks the end of this hangout" },
    ],
    proofRequired: "photo",
    proof: "One final group photo, taken right before everyone leaves.",
  },
  {
    id: "group-photo",
    kind: "group-photo",
    emoji: "🤣",
    title: "The Picture That Needs an Explanation",
    blocks: [
      {
        kind: "p",
        text: "Take a picture of something that happens during the outing that would make absolutely no sense to someone who wasn't there — an unusual pose, an unexpected situation, a ridiculous object or a moment that becomes an inside joke.",
      },
      { kind: "p", text: "Give the picture a short caption explaining what happened." },
      { kind: "aside", text: "the goal: a memory that belongs specifically to the five of you" },
    ],
    proofRequired: "photo",
    proof: "A photo plus a short caption explaining what on earth happened.",
  },
];

/** The house rules, shown in the Rules sheet. */
export const RULES = {
  title: "The Manito Game",
  tagline: "Five girls. Secret missions. Unforgettable memories.",
  steps: [
    {
      title: "Your Mission Is Secret",
      body: "Your assigned dare and picture challenges are exclusively yours. Nobody else in the group should know what you have been assigned. Keep your missions private until the official reveal.",
    },
    {
      title: "Complete Your Dare",
      body: "You must complete your assigned dare during one of our hangouts or events. Be creative, commit to the assignment and, most importantly, have fun with it!",
    },
    {
      title: "Get Your Dare on Video",
      body: "Every dare must be recorded as proof of completion. You may discreetly ask one person in the group to help you record it, but you must not reveal the purpose of the recording or disclose your mission.",
    },
    {
      title: "Complete Your Two Picture Challenges",
      body: "You will receive two picture challenges: one involving your Manito and another involving the group, a friend or a memorable moment from the outing. Capture both without revealing your assignments.",
    },
    {
      title: "Keep It Natural",
      body: "Do not make it obvious that you are completing a mission. Your dare and pictures should look like spontaneous moments from the hangout. The less suspicious you appear, the better!",
    },
    {
      title: "No Exposing Anyone",
      body: "Do not reveal your dare, picture challenges or Manito before the official reveal. Avoid giving suspicious hints or trying to make other people guess your assignment.",
    },
    {
      title: "No Evidence, No Completion",
      body: "Your dare must have video evidence, while both picture challenges must have photographic evidence. Submit your evidence as instructed before the reveal.",
    },
    {
      title: "Be Bold, but Be Sensible",
      body: "The objective is to create funny and memorable moments, not to put anyone in danger or make anyone genuinely uncomfortable. No dangerous stunts, harassment, unwanted touching, property damage or disrespect towards strangers, staff or members of the public. You may request an alternative if a mission makes you genuinely uncomfortable.",
    },
    {
      title: "Respect Everyone's Privacy",
      body: "All videos and pictures collected during the game are intended to preserve memories of our hangouts and celebrate the experiences we share — for our private group entertainment and memories. Nobody should post or share another person's embarrassing moments publicly without their permission.",
    },
    {
      title: "The Reveal Is the Best Part!",
      body: "All missions and their evidence will be revealed at the agreed time. We will watch the videos, view the pictures, guess who assigned each dare and finally reveal our Manitos.",
    },
  ],
  golden: {
    title: "Have Fun!",
    body: "This is about friendship, laughter and creating memories together. Do not take the game too seriously, but do make an effort to complete your assignments.",
  },
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
  },
];

export const GAME_CONFIG = {
  participants: PARTICIPANTS,
  features: FEATURES,
  gameMasterMessages: GAME_MASTER_MESSAGES,
  /** Only used when `FEATURES.schedule` is on: how long girls have once their missions are revealed. */
  taskDurationMs: 24 * HOUR,
  /** Chance that a simulated player (preview only) hands in all their evidence. */
  simulatedSubmitRate: 0.7,
  /** Countdown intensity thresholds (remaining time). Only used with `FEATURES.schedule`. */
  urgency: { tenseBelowMs: 2 * HOUR, criticalBelowMs: 15 * MINUTE },
  dares: DARES,
  manitoPhotoBrief: MANITO_PHOTO_BRIEF,
  groupPhotoChallenges: GROUP_PHOTO_CHALLENGES,
  punishments: PUNISHMENTS,
  storageKey: "manito:v3",
  gameMasterManifest: "/gamemaster/manifest.json",
} as const;
