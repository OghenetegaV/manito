import { useId } from "react";
import { motion } from "framer-motion";
import type { Expression } from "@/game/types";
import { useGameMasterAssets } from "./gameMasterAssets";

/**
 * The Game Master: an original cat-girl mascot. Sleek dark ears, big almond eyes with a
 * feline slit pupil, a tiny nose and whiskers, a long tail, and a Y2K outfit (baby tee,
 * headphones, charm necklace, mini bag, sunglasses). She is drawn in a 260 x 320 box and
 * cropped by CSS: a tall sticker card on desktop, a face-and-ears avatar on phones.
 *
 * If a real photograph is supplied (see public/gamemaster/README.md) the photo replaces the
 * illustration and only crop / position / light change per expression.
 */

const C = {
  choc: "#24171b",
  plum: "#4a183d",
  skin: "#a9694a",
  skinShade: "#8f5539",
  blush: "#f4b6c2",
  powder: "#f9dde3",
  cream: "#fff7ee",
  butter: "#f6d77a",
  lilac: "#c9b8e8",
  nose: "#d9788c",
} as const;

/* ------------------------------------------------------------------ */
/* Expressions                                                         */
/* ------------------------------------------------------------------ */

type Face = {
  /** eyelid opening: 0 closed → 1 open (a little over 1 = wide) */
  open: number;
  /** brow lift in px, left / right (one raised brow is her signature) */
  browL: number;
  browR: number;
  pupilX: number;
  pupilY: number;
  /** corners of the little "w" mouth, and how far the smile dips */
  mouth: { lx: number; ly: number; rx: number; ry: number; dip: number; gape: number };
  shades: boolean;
};

const FACES: Record<Expression, Face> = {
  smirking: { open: 0.62, browL: 0, browR: 9, pupilX: -3, pupilY: 0, mouth: { lx: 112, ly: 190, rx: 150, ry: 184, dip: 5, gape: 0 }, shades: false },
  curious: { open: 0.92, browL: 3, browR: 11, pupilX: 5, pupilY: -1, mouth: { lx: 113, ly: 190, rx: 147, ry: 189, dip: 3, gape: 0 }, shades: false },
  surprised: { open: 1.15, browL: 12, browR: 12, pupilX: 0, pupilY: 0, mouth: { lx: 118, ly: 190, rx: 142, ry: 190, dip: 2, gape: 1 }, shades: false },
  amused: { open: 0.36, browL: 5, browR: 7, pupilX: 0, pupilY: 2, mouth: { lx: 108, ly: 187, rx: 152, ry: 187, dip: 9, gape: 0.4 }, shades: false },
  disappointed: { open: 0.5, browL: -3, browR: 0, pupilX: 2, pupilY: 3, mouth: { lx: 114, ly: 194, rx: 146, ry: 194, dip: -5, gape: 0 }, shades: false },
  proud: { open: 0.5, browL: 3, browR: 3, pupilX: 0, pupilY: 2, mouth: { lx: 112, ly: 189, rx: 148, ry: 187, dip: 6, gape: 0 }, shades: true },
  mischievous: { open: 0.55, browL: -3, browR: 12, pupilX: -5, pupilY: 1, mouth: { lx: 110, ly: 191, rx: 152, ry: 182, dip: 6, gape: 0 }, shades: false },
};

const CY = 152;
const HALF = 19;
const EYES = [
  { cx: 102, side: -1 as const },
  { cx: 158, side: 1 as const },
];

/** Almond eyes. Outer corner sits higher than the inner one for the cat-eye tilt. */
function eyeGeometry(cx: number, side: -1 | 1, open: number) {
  const ox = cx + side * HALF;
  const oy = CY - 4;
  const ix = cx - side * HALF;
  const iy = CY + 2;
  const up = 2 * 15 * open;
  const low = 2 * 8 * Math.min(open, 1);
  const upper = `M${ix} ${iy}Q${cx} ${CY - 2 - up} ${ox} ${oy}`;
  return {
    outline: `${upper}Q${cx} ${CY + 2 + low} ${ix} ${iy}Z`,
    upper,
    wing: `M${ox - side * 5} ${oy + 1}L${ox + side * 14} ${oy - 11}L${ox + side * 1} ${oy + 4}Z`,
  };
}

function browPath(cx: number, side: -1 | 1, lift: number) {
  const y = 127 - lift;
  const inner = cx - side * 21;
  const outer = cx + side * 23;
  return `M${inner} ${y + 3}Q${cx + side * 2} ${y - 9} ${outer} ${y - 1}`;
}

function mouthPath(m: Face["mouth"]) {
  return `M${m.lx} ${m.ly}Q${(m.lx + 130) / 2} ${m.ly + m.dip} 130 188Q${(m.rx + 130) / 2} ${m.ry + m.dip} ${m.rx} ${m.ry}`;
}

const TWEEN = { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const };

function Eye({ cx, side, face, uid }: { cx: number; side: -1 | 1; face: Face; uid: string }) {
  const open = Math.min(face.open, 1.15);
  const g = eyeGeometry(cx, side, open);
  const clip = `${uid}-eye${side}`;
  return (
    <g>
      <defs>
        <clipPath id={clip}>
          <motion.path initial={false} animate={{ d: g.outline }} transition={TWEEN} />
        </clipPath>
      </defs>
      <motion.path initial={false} animate={{ d: g.outline }} transition={TWEEN} fill="#fffdf8" />
      <g clipPath={`url(#${clip})`}>
        <motion.g initial={false} animate={{ x: face.pupilX, y: face.pupilY }} transition={TWEEN}>
          <circle cx={cx} cy={CY} r="11" fill={C.butter} />
          <circle cx={cx} cy={CY} r="11" fill="none" stroke="#d3a93c" strokeWidth="1.4" />
          <ellipse cx={cx} cy={CY} rx="3.4" ry="9" fill={C.choc} />
          <circle cx={cx + 4.2} cy={CY - 4.5} r="2.4" fill="#fff" />
        </motion.g>
      </g>
      {/* thick liner along the top lid, with a flick */}
      <motion.path initial={false} animate={{ d: g.upper }} transition={TWEEN} fill="none" stroke={C.choc} strokeWidth="3.6" strokeLinecap="round" />
      <path d={g.wing} fill={C.choc} />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Photo framing per expression (crop + light only, never warping)      */
/* ------------------------------------------------------------------ */

const FRAMING: Record<Expression, { scale: number; x: number; y: number; light: number }> = {
  smirking: { scale: 1.04, x: 0, y: 0, light: 1 },
  curious: { scale: 1.08, x: -3, y: 0, light: 1.02 },
  surprised: { scale: 1.12, x: 0, y: -2, light: 1.06 },
  amused: { scale: 1.05, x: 2, y: 0, light: 1.04 },
  disappointed: { scale: 1.02, x: 0, y: 3, light: 0.88 },
  proud: { scale: 1.06, x: 0, y: 4, light: 1.02 },
  mischievous: { scale: 1.09, x: -2, y: 0, light: 0.95 },
};

/* ------------------------------------------------------------------ */

export function GameMasterExpression({ expression }: { expression: Expression }) {
  const assets = useGameMasterAssets();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const face = FACES[expression];
  const photo = assets.status === "photo" ? (assets.expressions[expression] ?? assets.default) : undefined;
  const frame = FRAMING[expression];
  const [fx, fy] = assets.focal.split(" ").map((v) => parseFloat(v) / 100);
  const alignX = fx < 0.33 ? "xMin" : fx > 0.66 ? "xMax" : "xMid";
  const alignY = fy < 0.33 ? "YMin" : fy > 0.66 ? "YMax" : "YMid";

  return (
    <svg
      className="gmx"
      viewBox="0 0 260 320"
      role="img"
      aria-label={`The Game Master, looking ${expression}`}
      preserveAspectRatio="xMidYMin slice"
    >
      {/* sticker backdrop */}
      <rect width="260" height="320" fill={C.lilac} />
      <circle cx="130" cy="150" r="104" fill={C.powder} opacity="0.85" />

      {photo ? (
        <motion.g
          initial={false}
          animate={{ scale: frame.scale, x: frame.x, y: frame.y }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{ originX: 0.5, originY: 0.35, filter: `brightness(${frame.light})` }}
        >
          <image href={photo} x="0" y="0" width="260" height="320" preserveAspectRatio={`${alignX}${alignY} slice`} />
        </motion.g>
      ) : (
        <g>
          {/* tail, swishing behind her */}
          <g className="gmx__tail">
            <path d="M66 318C6 308 0 246 30 220c14-12 2-34-14-28" fill="none" stroke={C.choc} strokeWidth="16" strokeLinecap="round" />
            <circle cx="16" cy="192" r="6.5" fill={C.blush} stroke={C.choc} strokeWidth="1.5" />
          </g>

          {/* headphone band, sitting behind her neck */}
          <path d="M80 268C70 214 100 208 130 208s60 6 50 60" fill="none" stroke={C.choc} strokeWidth="13" strokeLinecap="round" />
          <path d="M80 268C70 214 100 208 130 208s60 6 50 60" fill="none" stroke={C.blush} strokeWidth="8" strokeLinecap="round" />

          {/* bob */}
          <path
            d="M52 150C46 62 96 30 130 30s84 32 78 120c2 46-10 74-26 86H78c-16-12-28-40-26-86z"
            fill={C.choc}
          />
          <path d="M70 96c10-30 34-44 60-44" fill="none" stroke={C.lilac} strokeWidth="3" strokeLinecap="round" opacity="0.35" />

          {/* ears: dark with a blush lining */}
          <path d="M62 84C56 20 58 8 76 8c28 12 40 26 48 42z" fill={C.choc} />
          <path d="M198 84c6-64 4-76-14-76-28 12-40 26-48 42z" fill={C.choc} />
          <path d="M73 72C70 36 70 24 78 22c18 8 28 18 34 30z" fill={C.blush} />
          <path d="M187 72c3-36 3-48-5-50-18 8-28 18-34 30z" fill={C.blush} />

          {/* neck */}
          <path d="M108 206h44l4 46c-8 20-44 20-52 0z" fill={C.skinShade} />

          {/* baby tee */}
          <path d="M20 320l12-52c24-18 48-22 70-22 8 24 48 24 56 0 22 0 46 4 70 22l12 52z" fill={C.lilac} stroke={C.choc} strokeWidth="2" strokeLinejoin="round" />
          <path d="M102 246c8 24 48 24 56 0" fill="none" stroke={C.choc} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M130 284l4.2 8.8 9.6 1.1-7.1 6.5 2 9.5-8.7-4.9-8.7 4.9 2-9.5-7.1-6.5 9.6-1.1z"
            fill={C.butter}
            stroke={C.choc}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />

          {/* headphone cups resting on her chest */}
          <rect x="60" y="248" width="30" height="40" rx="13" fill={C.blush} stroke={C.choc} strokeWidth="2.4" />
          <rect x="66" y="256" width="18" height="24" rx="8" fill={C.powder} stroke={C.choc} strokeWidth="1.6" />
          <rect x="170" y="248" width="30" height="40" rx="13" fill={C.blush} stroke={C.choc} strokeWidth="2.4" />
          <rect x="176" y="256" width="18" height="24" rx="8" fill={C.powder} stroke={C.choc} strokeWidth="1.6" />

          {/* charm necklace */}
          <path d="M114 224C118 250 142 250 146 224" fill="none" stroke={C.choc} strokeWidth="1.3" />
          <path
            d="M130 268c-6-4-8-7-8-9.4a4 4 0 017.4-1.8L130 258l.6-1.2a4 4 0 017.4 1.8c0 2.4-2 5.4-8 9.4z"
            fill={C.butter}
            stroke={C.choc}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />

          {/* mini handbag */}
          <path d="M204 262l12 32" fill="none" stroke={C.choc} strokeWidth="2.4" strokeLinecap="round" />
          <rect x="200" y="290" width="44" height="30" rx="9" fill={C.blush} stroke={C.choc} strokeWidth="2.2" />
          <path d="M200 302h44" stroke={C.choc} strokeWidth="1.6" />
          <circle cx="222" cy="302" r="3.6" fill={C.butter} stroke={C.choc} strokeWidth="1.4" />

          {/* face */}
          <path
            d="M72 138c0-42 26-60 58-60s58 18 58 60c0 42-24 74-58 76-34-2-58-34-58-76z"
            fill={C.skin}
          />
          <ellipse cx="90" cy="180" rx="11" ry="7" fill="#e8897f" opacity="0.5" />
          <ellipse cx="170" cy="180" rx="11" ry="7" fill="#e8897f" opacity="0.5" />

          {/* bangs */}
          <path d="M68 122C62 74 96 58 130 58s68 16 62 64c-14-24-38-30-62-30s-48 6-62 30z" fill={C.choc} />

          {/* eyes (they blink) */}
          <g className="gmx__eyes">
            {EYES.map((e) => (
              <Eye key={e.side} cx={e.cx} side={e.side} face={face} uid={uid} />
            ))}
          </g>

          {/* brows: one is always a little too high */}
          {EYES.map((e) => (
            <motion.path
              key={e.side}
              initial={false}
              animate={{ d: browPath(e.cx, e.side, e.side === -1 ? face.browL : face.browR) }}
              transition={TWEEN}
              fill="none"
              stroke={C.choc}
              strokeWidth="4"
              strokeLinecap="round"
            />
          ))}

          {/* nose, mouth, whiskers */}
          <path d="M124 175q6-4 12 0-2 6-6 7-4-1-6-7z" fill={C.nose} stroke={C.choc} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M130 182v6" stroke={C.choc} strokeWidth="1.4" strokeLinecap="round" />
          <motion.ellipse
            cx="130"
            initial={false}
            animate={{ cy: 194, rx: 3 + face.mouth.gape * 3, ry: face.mouth.gape * 5, opacity: face.mouth.gape > 0 ? 1 : 0 }}
            transition={TWEEN}
            fill={C.choc}
          />
          <motion.path initial={false} animate={{ d: mouthPath(face.mouth) }} transition={TWEEN} fill="none" stroke={C.choc} strokeWidth="2.2" strokeLinecap="round" />
          <g stroke={C.choc} strokeWidth="1.2" strokeLinecap="round" opacity="0.55">
            <path d="M84 178L52 170M84 184L50 186M86 190L54 202" />
            <path d="M176 178l32-8M176 184l34 2M174 190l32 12" />
          </g>

          {/* sunglasses: pushed up on her head, or down when she's feeling smug */}
          <motion.g initial={false} animate={{ y: face.shades ? 0 : -82, rotate: face.shades ? 0 : -3 }} transition={{ duration: 0.6, ease: [0.34, 1.4, 0.64, 1] }} style={{ originX: 0.5, originY: 0.5 }}>
            <path d="M124 150q6-5 12 0" fill="none" stroke={C.choc} strokeWidth="3" strokeLinecap="round" />
            <path d="M80 148L60 142M180 148l20-6" fill="none" stroke={C.choc} strokeWidth="3" strokeLinecap="round" />
            <rect x="80" y="136" width="46" height="30" rx="13" fill={C.plum} stroke={C.choc} strokeWidth="2.4" />
            <rect x="134" y="136" width="46" height="30" rx="13" fill={C.plum} stroke={C.choc} strokeWidth="2.4" />
            <path d="M90 145l14-4M144 145l14-4" stroke={C.lilac} strokeWidth="3" strokeLinecap="round" opacity="0.7" />
          </motion.g>

          {/* tiny stickers in the corners of her card */}
          <path d="M232 40l3 6.4 7 .8-5.2 4.8 1.5 6.9-6.3-3.6-6.3 3.6 1.5-6.9-5.2-4.8 7-.8z" fill={C.butter} stroke={C.choc} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M28 60c1 5.4 3.4 8 8.6 9.4-5.2 1.4-7.6 4-8.6 9.4-1-5.4-3.4-8-8.6-9.4C24.6 68 27 65.4 28 60z" fill={C.cream} stroke={C.choc} strokeWidth="1.3" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
