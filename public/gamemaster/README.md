# Game Master artwork

The Game Master appears as an illustrated emblem until a real photograph is supplied.

To use a photograph:

1. Put an optimised image here (portrait crop, roughly 13:16 — the same as 260×320 — at least 800px wide, `.webp` or `.jpg`).
2. Add a `manifest.json` next to it:

```json
{
  "default": "gamemaster.webp",
  "expressions": {
    "smirking": "gm-smirk.webp",
    "surprised": "gm-surprised.webp"
  },
  "focal": "50% 28%"
}
```

- `default` is required. Any expression left out of `expressions` falls back to `default` and is
  differentiated with subtle crop, position and lighting only. The face is never warped.
- Expressions the app can request: smirking, curious, surprised, amused, disappointed, proud, mischievous.
- `focal` is where the face sits in the image (x% y%); the crop keeps it in frame.

Only use images you have the right to use, and keep the person recognisably themselves.
