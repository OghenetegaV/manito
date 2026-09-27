/** Static film grain (an inline SVG turbulence tile). No animation, so no per-frame cost. */
export function NoiseOverlay() {
  return <div className="noise" aria-hidden="true" />;
}
