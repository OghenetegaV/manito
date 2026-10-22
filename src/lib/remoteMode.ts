/** Whether a Supabase project is configured for this build. */
const hasSupabaseConfig = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

function readDemoFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return new URLSearchParams(window.location.search).get("demo") === "1";
  } catch {
    return false;
  }
}

/**
 * Set by visiting the game with `?demo=1` — a one-player walkthrough of the whole flow (the
 * other seats fill themselves in, same as local preview below) that never touches the real
 * shared game. See DemoBanner.tsx for the exit path back to the live Platform.
 */
export const isDemoMode = readDemoFlag();

/**
 * Whether this session should talk to the shared Supabase backend (see supabase/README.md).
 * False either because no project is configured, or because `?demo=1` is forcing local/demo
 * mode even though one is. Deliberately has no dependency on @supabase/supabase-js — importing
 * this must never pull the client library into a bundle that doesn't need it. GameProvider.tsx
 * uses this to decide whether to even fetch the remote-mode code at all.
 */
export const isRemoteMode = hasSupabaseConfig && !isDemoMode;

/** The single shared room this app talks to. Matches the seed row in supabase/schema.sql. */
export const GAME_ID = "default";
