import type { CSSProperties } from "react";

export type DoodleName = "star" | "heart" | "sparkle" | "paw" | "bow" | "cherry" | "envelope" | "cat";

type DoodleProps = {
  name: DoodleName;
  size?: number;
  /** Fill colour; defaults to butter yellow. */
  color?: string;
  className?: string;
  style?: CSSProperties;
};

const STROKE = "#24171b";
const SW = 1.5;

/** Sticker-style icons: flat fill, chocolate outline. Purely decorative, so hidden from assistive tech. */
export function Doodle({ name, size = 28, color = "#f6d77a", className, style }: DoodleProps) {
  const common = { fill: color, stroke: STROKE, strokeWidth: SW, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {name === "star" && <path {...common} d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.7l-5.8 3.3 1.4-6.4L2.7 9.2l6.5-.7z" />}
      {name === "heart" && (
        <path
          {...common}
          d="M12 20.5C5 15.5 2.5 11.7 2.5 8.4 2.5 5.6 4.6 3.6 7.1 3.6c1.9 0 3.8 1.1 4.9 2.9 1.1-1.8 3-2.9 4.9-2.9 2.5 0 4.6 2 4.6 4.8 0 3.3-2.5 7.1-9.5 12.1z"
        />
      )}
      {name === "sparkle" && (
        <path {...common} d="M12 1.5c.9 5.2 3.3 8.5 9.5 10.5-6.2 2-8.6 5.3-9.5 10.5-.9-5.2-3.3-8.5-9.5-10.5C8.7 10 11.1 6.7 12 1.5z" />
      )}
      {name === "paw" && (
        <g {...common}>
          <ellipse cx="12" cy="16" rx="5.2" ry="4.4" />
          <ellipse cx="5.4" cy="11" rx="2.1" ry="2.8" transform="rotate(-18 5.4 11)" />
          <ellipse cx="9.4" cy="6.6" rx="2.1" ry="2.9" transform="rotate(-6 9.4 6.6)" />
          <ellipse cx="14.6" cy="6.6" rx="2.1" ry="2.9" transform="rotate(6 14.6 6.6)" />
          <ellipse cx="18.6" cy="11" rx="2.1" ry="2.8" transform="rotate(18 18.6 11)" />
        </g>
      )}
      {name === "bow" && (
        <g {...common}>
          <path d="M12 12C7.5 5.5 2.2 6.5 2.6 12c.4 5.5 5.6 6 9.4 0z" />
          <path d="M12 12c4.5-6.5 9.8-5.5 9.4 0-.4 5.5-5.6 6-9.4 0z" />
          <circle cx="12" cy="12" r="2.4" />
        </g>
      )}
      {name === "cherry" && (
        <g {...common}>
          <path d="M7.6 13.4C9 7.5 12 4.6 15.6 3.2M16.6 14.4c-1.4-5-1.2-8.2-1-11.2" fill="none" />
          <path d="M15.6 3.2c2.4-1 4.6-.4 5.6 1.2-2 1.6-4.4 1.4-5.6-1.2z" fill="#c9b8e8" />
          <circle cx="7.6" cy="17.4" r="4.2" />
          <circle cx="16.6" cy="18.2" r="4.2" />
        </g>
      )}
      {name === "envelope" && (
        <g {...common}>
          <rect x="2.5" y="5.5" width="19" height="14" rx="2.4" fill="#fff7ee" />
          <path d="M3 7.5l9 6.4 9-6.4" fill="none" />
          <path d="M12 16.6c-2.4-1.6-3-2.8-3-3.8a1.6 1.6 0 013-.5 1.6 1.6 0 013 .5c0 1-.6 2.2-3 3.8z" fill="#f4b6c2" strokeWidth="1.1" />
        </g>
      )}
      {name === "cat" && (
        <path
          {...common}
          fill="#24171b"
          d="M4 21V6.5l4.6 3.4c1-.4 2.2-.6 3.4-.6s2.4.2 3.4.6L20 6.5V21c0 .6-.4 1-1 1H5c-.6 0-1-.4-1-1z"
        />
      )}
    </svg>
  );
}
