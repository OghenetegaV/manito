/**
 * Whether this build is configured to talk to a shared Supabase backend (see
 * supabase/README.md). Deliberately has no dependency on @supabase/supabase-js — importing this
 * must never pull the client library into a bundle that doesn't need it. GameProvider.tsx uses
 * this to decide whether to even fetch the remote-mode code at all.
 */
export const isRemoteMode = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

/** The single shared room this app talks to. Matches the seed row in supabase/schema.sql. */
export const GAME_ID = "default";
