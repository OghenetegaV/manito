# Connecting MANITO to Supabase

Without this, the app runs in **local/demo mode**: one browser, one device, the other four
players simulated. With it, up to five real phones share one live game.

## 1. Create a project

[supabase.com](https://supabase.com) → New project. Free tier is more than enough for five
players. Takes a minute or two to provision.

## 2. Turn on anonymous sign-ins

Dashboard → **Authentication → Sign In / Providers → Anonymous Sign-Ins** → toggle on.

This is how each phone gets a private, stable identity without anyone typing a password —
there's no name/email/login screen. The first time the app opens on a phone it silently becomes
"an anonymous visitor"; that identity is what lets the database tell "my own task" apart from
everyone else's, and it persists across refreshes on that phone.

## 3. Run the schema

Dashboard → **SQL Editor → New query      ** → paste the entire contents of
[`schema.sql`](./schema.sql) → **Run**.

This creates the tables, the privacy rules (Row Level Security), the two functions the game
calls (`begin_draw`, `restart_game`), and seeds one shared game row. Safe to re-run.

## 4. Get your keys

Dashboard → **Project Settings → API**. You need:

- **Project URL**
- **anon public** key (not the service_role key — that one must never reach the browser)

## 5. Configure the app

```bash
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Restart `npm run dev` (Vite only reads `.env*` files at startup). The app detects these and
switches to multiplayer mode automatically — no code changes needed. With them unset, it falls
back to local/demo mode exactly as before.

## 6. Deploy it somewhere all five phones can reach

A Supabase backend doesn't help if the site only runs on `localhost`. Deploy the built app (e.g.
to Vercel or Netlify — point it at this repo, it's a static Vite build) and set the same two
`VITE_SUPABASE_*` environment variables there. Five phones then open the same deployed URL.

## How joining actually works, once this is set up

1. Each phone opens the URL and gets its own private "anonymous visitor" identity automatically
   (step 2) — no login screen.
2. Everyone watches their own welcome intro, then lands in one shared lobby.
3. Tapping a name **claims that seat** for that phone (a guarded database write: if two phones
   tap the same name within milliseconds, only the first one actually claims it — the second
   sees it flip to "joined" and has to pick someone else). That claim is what the phone
   remembers on refresh, so closing and reopening the game on the same phone keeps you as the
   same person.
4. "I'm ready" and presence changes are pushed to all five phones live.
5. Once everyone is ready and someone taps "Find our Manitos," the pairing is generated **once,
   on the server** (`begin_draw` in `schema.sql`), inside one database transaction — so there's
   no chance of two phones computing two different draws. Each phone then privately reveals only
   its own card.
6. From there, each person's task and evidence are theirs alone — Row Level Security enforces
   this at the database level, not just in the UI, so even someone poking at the network tab on
   their own phone can't read anyone else's task or evidence.

## What this does *not* add (yet)

- **No photo/video upload to storage.** Photos are still capped and downsized client-side into a
  compact data URL that fits directly in the database row, same as local mode. Videos remain
  device-local only — they don't sync to other phones or survive a refresh on the device that
  recorded them, exactly like today. Adding real file storage for video is a reasonable next
  step (Supabase Storage) but is deliberately out of scope here.
- **No real names/accounts.** "Identity" is just "whichever phone claimed TIA." Good enough for
  five friends in one room; not meant to survive someone deliberately impersonating another
  player.
