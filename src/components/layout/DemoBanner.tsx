import { isDemoMode } from "@/lib/remoteMode";

/**
 * Permanent reminder that a `?demo=1` session is a throwaway sandbox, not the real game (see
 * LocalGameProvider.tsx — nothing here is saved or shared). "Exit demo" just drops the query
 * param and reloads, handing back to whichever mode the deployment normally runs in.
 */
export function DemoBanner() {
  if (!isDemoMode) return null;

  return (
    <div className="demo-banner" role="status">
      <span className="demo-banner__label">Demo · nothing here affects the real game</span>
      <button type="button" className="demo-banner__exit" onClick={() => (window.location.href = window.location.pathname)}>
        Exit demo
      </button>
    </div>
  );
}
