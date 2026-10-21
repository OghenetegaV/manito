import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Only ever imported from the remote-mode path (RemoteGameProvider.tsx, game/remote/queries.ts)
 * so @supabase/supabase-js is never bundled for a local-mode build. Check isRemoteMode from
 * lib/remoteMode.ts first, anywhere outside that path.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null;

let authReady: Promise<string> | null = null;

/**
 * Resolves once this device has a stable anonymous identity, and returns its user id. Reuses an
 * existing session (so refreshing the page keeps whichever seat this device already claimed)
 * rather than signing in again, which would otherwise mint a brand new, disconnected identity.
 */
export function ensureAnonymousSession(): Promise<string> {
  if (!supabase) return Promise.reject(new Error("Supabase is not configured."));
  authReady ??= (async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) return data.session.user.id;
    const { data: signed, error } = await supabase.auth.signInAnonymously();
    if (error || !signed.user) throw error ?? new Error("Anonymous sign-in failed.");
    return signed.user.id;
  })();
  return authReady;
}
