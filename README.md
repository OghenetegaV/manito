# MANITO

A private random-pairing game for five: TIA, LOLA, ORE, OPE and DUMADE. A Game Master (an original cat-girl
mascot) narrates the game. Each girl is secretly assigned a Manito and a secret task from the Secret Task
Challenge brief, and hands in a photo or video as evidence once it's done.

React 19, TypeScript, Vite, Framer Motion. Runs two ways:

- **Local/demo mode** (default, no setup): one browser, one device, the other players simulated.
- **Real multiplayer** (optional): up to five phones share one live game over Supabase — see
  [supabase/README.md](supabase/README.md) to turn it on. The app detects which mode it's in automatically;
  nothing else changes.

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
| `src/game/assignments.ts` | `generateAssignments()` — a seedable derangement, tested independently (also reimplemented in SQL — see `begin_draw()` in `supabase/schema.sql`) |
| `src/game/mediaUtils.ts` | Turns an uploaded file into `ProofMedia` (downsized photo, or an in-memory video) |
| `src/game/selectors.ts` | `selectPublic` / `selectPrivate` / `selectRevealed`: the only way UI reads the game, in either mode |
| `src/game/gameContext.ts` | The hooks every component actually calls (`usePublicGame` etc.) — mode-agnostic |
| `src/game/GameProvider.tsx` | Picks local or remote; the only file that knows which mode is running |
| `src/game/LocalGameProvider.tsx` | Today's local/demo implementation: a reducer + `localStorage` |
| `src/game/RemoteGameProvider.tsx` | The Supabase-backed implementation — see below |
| `src/game/remote/queries.ts` | The write side of remote mode: one guarded Supabase call per action |
| `src/lib/remoteMode.ts` / `src/lib/supabaseClient.ts` | Mode detection (dependency-free) / the actual client (code-split, never bundled for local-mode users) |
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
until the player breaks the seal. In local mode this is enforced by what the UI chooses to render; in remote
mode it's additionally enforced by the database itself (Row Level Security — see below), so it holds even
against someone poking at their own network tab. Tests in `src/game/machine.test.ts` cover both.

## Real multiplayer (Supabase)

Turning this on (see [supabase/README.md](supabase/README.md) for the setup steps) is what makes "how does
each person join from their own phone" actually true: five phones, one shared lobby, live presence, and a
draw that happens exactly once, server-side, so two phones tapping "Find our Manitos" at the same instant
can never produce two different pairings.

The shape of it:

- `GameProvider` renders `LocalGameProvider` or `RemoteGameProvider` depending on whether
  `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are set — see `src/lib/remoteMode.ts`. Every component calls
  the exact same hooks (`usePublicGame`, `usePrivateGame`, `useRevealedGame`, `useGameDispatch`) either way,
  and never needs to know which mode is active.
- Each phone gets a private, stable identity via Supabase Anonymous Auth — no login screen, no password.
  Claiming a seat (tapping a name) links that identity to a participant row; refreshing the page keeps the
  same seat.
- Lobby presence, the draw's result, each player's own task, and each player's own evidence are all synced
  live (Postgres Realtime). What's actually shared vs. personal: joining/readying/the draw are a genuinely
  shared moment across all five phones; reading your task and submitting evidence afterward is personal
  screen-navigation on each phone and never blocks on where anyone else is.
- Row Level Security (`supabase/schema.sql`) is what actually keeps a task/manito/proof private to its owner
  — a player's own device can only ever `SELECT` its own rows for those tables, until the reveal phase makes
  them world-readable (matching the house rule that everyone shows their task and proof at the end).
- The draw itself runs as a Postgres function (`begin_draw`), inside one transaction, so it's atomic: the
  second of two simultaneous callers just sees the lobby is no longer `'ready'` and no-ops.

What it deliberately doesn't add: no file storage for evidence (photos are still downsized into the database
row as before; videos still don't sync between devices or survive a refresh, exactly like local mode), and
no real accounts — see `supabase/README.md`'s "What this does not add" section for the full, honest list.
