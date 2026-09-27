import { Doodle, type DoodleName } from "@/components/decor/Doodles";

/** "dim" is the slightly deeper wash used while the draw is happening. */
export type Mood = "warm" | "dim";

type Scatter = { name: DoodleName; x: number; y: number; size: number; rot: number; color: string };

/**
 * A handful of stickers around the edges, placed by hand so the page feels like a decorated
 * booklet page without ever crowding the content. The first six are kept on phones.
 */
const SCATTER: Scatter[] = [
  { name: "star", x: 6, y: 16, size: 30, rot: -12, color: "#f6d77a" },
  { name: "heart", x: 93, y: 12, size: 28, rot: 14, color: "#f4b6c2" },
  { name: "paw", x: 4, y: 74, size: 30, rot: -18, color: "#c9b8e8" },
  { name: "sparkle", x: 95, y: 52, size: 26, rot: 8, color: "#f6d77a" },
  { name: "cherry", x: 92, y: 88, size: 34, rot: 10, color: "#f4b6c2" },
  { name: "bow", x: 12, y: 92, size: 32, rot: -8, color: "#f4b6c2" },
  { name: "envelope", x: 3, y: 42, size: 30, rot: -6, color: "#fff7ee" },
  { name: "cat", x: 85, y: 30, size: 26, rot: 6, color: "#24171b" },
  { name: "sparkle", x: 20, y: 8, size: 20, rot: 0, color: "#c9b8e8" },
  { name: "star", x: 78, y: 70, size: 22, rot: 16, color: "#c9b8e8" },
];

/**
 * Paper base + soft powder-pink and lilac washes + scattered stickers. Nothing here animates,
 * so it costs nothing to run.
 */
export function AmbientBackground({ mood }: { mood: Mood }) {
  return (
    <div className="ambient" data-mood={mood} aria-hidden="true">
      <div className="ambient__wash" />
      <div className="ambient__dots" />
      {SCATTER.map((d, i) => (
        <Doodle
          key={i}
          name={d.name}
          size={d.size}
          color={d.color}
          className={`ambient__doodle ${i >= 6 ? "ambient__doodle--wide" : ""}`}
          style={{ left: `${d.x}%`, top: `${d.y}%`, transform: `rotate(${d.rot}deg)` }}
        />
      ))}
    </div>
  );
}
