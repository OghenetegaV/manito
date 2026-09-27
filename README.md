# MANITO

A private random-pairing game for four: TIA, LOLA, ORE and OPE. A Game Master (an original cat-girl mascot)
narrates the game. Each girl is secretly assigned a Manito and a secret task from the Secret Task Challenge
brief, and hands in a photo or video as evidence once it's done.

Frontend only: React 19, TypeScript, Vite, Framer Motion. No backend yet.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pairing logic, phase machine, secrecy of the selectors
npm run build      # typecheck + production build
```

## What's live vs. what's built but hidden

`src/config/gameConfig.ts` has a `FEATURES` flag:

```ts
export const FEATURES = {
  schedule: false,      // the mission deadline, countdown clock, timed midnight reveal
  consequences: false,  // the "task failed" and punishment scenes after the reveal
};
```

With both off (the current setting), the game is: **draw → secret task → upload evidence**. The scenes for
the deadline, the midnight reveal and the punishment are fully built and tested (`src/game/machine.test.ts`
covers both settings) — flip the flags back to `true` to bring the countdown and consequences back.

## The Game Master

She's an original cat-girl mascot, drawn as SVG in [GameMasterExpression.tsx](src/components/gamemaster/GameMasterExpression.tsx):
sleek dark ears, big almond eyes with a feline slit pupil, one eyebrow perpetually raised, a long tail,
sunglasses she pushes down when she's feeling smug, headphones, a charm necklace and a mini bag. Her
expression and one detail (the sunglasses) change per game phase.

To swap her for a real photograph instead, put it in `public/gamemaster/` with a `manifest.json` — see
[public/gamemaster/README.md](public/gamemaster/README.md). Expression variants are optional; without them
the same photo is re-framed per expression (crop, position, light) and the face is never warped.

## Visual identity

Palette (`src/styles/tokens.css`): blush pink, powder pink, deep plum, dark chocolate, cream, butter yellow,
soft lilac. Fraunces (soft) for display type, Nunito for UI, Caveat Brush for handwritten accents ("keep this
between us", "make sure nobody's looking"). Stickers (`src/components/decor/Doodles.tsx`) — stars, hearts,
paws, bows, cherries, envelopes — are scattered across the background and used as small in-context details
(washi tape on the task card, a wax-seal envelope, rubber-stamp "TOP SECRET" labels).

## How it is organised

| Path | What lives there |
| --- | --- |
| `src/config/gameConfig.ts` | Participants, `FEATURES`, Game Master lines, the six tasks, rules copy, consequences |
| `src/game/machine.ts` | The phase state machine; `createGameReducer(features)` builds a reducer for a given feature set |
| `src/game/assignments.ts` | `generateAssignments()` — a seedable derangement, tested independently |
| `src/game/mediaUtils.ts` | Turns an uploaded file into `ProofMedia` (downsized photo, or an in-memory video) |
| `src/game/selectors.ts` | `selectPublic` / `selectPrivate` / `selectRevealed`: the only way UI reads the game |
| `src/phaseViews.tsx` | One scene per phase; the shell looks the phase up rather than branching on it |
| `src/components/*` | layout, welcome, game, gamemaster, decor, assignment, tasks, proof, reveal, punishment, ui |
| `src/services/audio.ts` | Optional sound layer, silent unless sources are registered |

Phases: `welcome → lobby → ready → assignment → manito-reveal → task → countdown ⇄ proof → deadline →
midnight → (failed → punishment) → complete`. With `FEATURES` off, `countdown` is a plain "mission hub" (no
clock), and `deadline` / `midnight` / `failed` / `punishment` are never entered — `AFTER_MIDNIGHT` always
lands on `complete`.

## Secrecy model

Components never get raw game state. They read one of three gated views:

- **public**: participants, presence, phase, deadline
- **private**: the signed-in player's own Manito, task, evidence and (only if they failed, only once
  announced) consequence
- **revealed**: everyone's pairings, `null` until the midnight phase

During the draw the UI only shows "sealed" slots, never who drew whom, and the task text is not in the DOM
until the player breaks the seal. Tests in `src/game/machine.test.ts` cover this.

## Before this is a real multiplayer game

Everything private currently lives in the browser (`localStorage`), and that is the honest limit of a
frontend-only build: anyone with dev tools on the device can read the draw. Videos in particular are only
held as an in-memory blob URL and do not survive a refresh — a backend is what actually stores them. To make
it real:

1. Move `assignments`, `tasks`, `punishments` and submissions server-side; serve `selectPrivate` /
   `selectRevealed` shapes per authenticated player.
2. Replace `useSimulatedArrivals` (the other players "join" on their own in preview) with real presence.
3. Replace `simulatedSubmissions` with real submissions.
4. Store evidence (photo/video) in object storage rather than as a data URL or blob URL.
