import { useEffect, useState } from "react";
import { GAME_CONFIG } from "@/config/gameConfig";
import type { Expression } from "@/game/types";

/**
 * Optional artwork. Drop a photo (plus, optionally, expression variants) into
 * `public/gamemaster/` and describe it in `manifest.json`:
 *
 *   {
 *     "default": "gamemaster.webp",
 *     "expressions": { "smirking": "gm-smirk.webp", "surprised": "gm-surprised.webp" },
 *     "focal": "50% 28%"
 *   }
 *
 * With no manifest the illustrated emblem is used instead.
 */
export type GameMasterAssets = {
  status: "loading" | "none" | "photo";
  default?: string;
  expressions: Partial<Record<Expression, string>>;
  /** SVG preserveAspectRatio-ish focal point, e.g. "50% 28%". */
  focal: string;
};

const NONE: GameMasterAssets = { status: "none", expressions: {}, focal: "50% 30%" };
const BASE = "/gamemaster/";

let pending: Promise<GameMasterAssets> | null = null;

function preload(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function load(): Promise<GameMasterAssets> {
  try {
    const res = await fetch(GAME_CONFIG.gameMasterManifest, { cache: "no-cache" });
    if (!res.ok || !(res.headers.get("content-type") ?? "").includes("json")) return NONE;
    const manifest = (await res.json()) as {
      default?: string;
      expressions?: Partial<Record<Expression, string>>;
      focal?: string;
    };
    if (!manifest.default) return NONE;

    const files = new Map<string, string>();
    const resolveFile = (name: string) => BASE + name.replace(/^\/+/, "");
    const defaultSrc = resolveFile(manifest.default);
    if (!(await preload(defaultSrc))) return NONE;
    files.set(manifest.default, defaultSrc);

    const expressions: GameMasterAssets["expressions"] = {};
    await Promise.all(
      Object.entries(manifest.expressions ?? {}).map(async ([key, name]) => {
        if (!name) return;
        const src = resolveFile(name);
        if (await preload(src)) expressions[key as Expression] = src;
      }),
    );

    return { status: "photo", default: defaultSrc, expressions, focal: manifest.focal ?? NONE.focal };
  } catch {
    return NONE;
  }
}

/** Safe to call early (the boot screen does) — the manifest is only ever fetched once. */
export function preloadGameMasterAssets(): Promise<GameMasterAssets> {
  pending ??= load();
  return pending;
}

export function useGameMasterAssets(): GameMasterAssets {
  const [assets, setAssets] = useState<GameMasterAssets>({ ...NONE, status: "loading" });

  useEffect(() => {
    let alive = true;
    void preloadGameMasterAssets().then((a) => alive && setAssets(a));
    return () => {
      alive = false;
    };
  }, []);

  return assets;
}
