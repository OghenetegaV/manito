import type { ReactNode } from "react";
import "./ui.css";

export type BadgeTone = "neutral" | "gold" | "burgundy" | "sage" | "muted";

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`badge badge--${tone}`}>
      <span className="badge__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
