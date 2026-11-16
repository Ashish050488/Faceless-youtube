# Brand + design spec — "Spec or Wreck" (v2, 2026-11-16; renamed from "The Catch", which other channels use)

Name: **Spec or Wreck** · Handle: **@specorwreck** (handle free + no channel with this name, checked via API 2026-11-16) · Tagline: **"Great spec... or a wreck?"**
Promise: new tech in under 2 minutes — what it is, the clever part, **the catch**, the price, who should buy it.

## What we learned watching @TechyorNot frame by frame (Bose 1.29M, Logitech 1.66M)
*Measured from 1-fps frames + transcripts (state/competitor_watch/).*
- Bose look: cream `#F1EDE4` bg, heavy black extended caps, one red-orange accent, italic serif asides
  ("seriously?", "you remember"), tiny mono labels. Logitech look: switched to black + neon yellow-green to match the product.
- Very few hard cuts (8 Bose, 11 Logitech in ~75 s): most change comes from **continuous motion on one canvas**
  (the Bose wire runs through scenes and becomes the next object).
- Weak spots we beat: tiny mono labels unreadable on phones; text and logo placed in the bottom area YouTube covers;
  10-s static split-screen at the price (Logitech 0:59–1:09); 8-s static build (Bose 0:59–1:07); verdict is a throwaway
  line; no captions for muted viewers; ends on a logo, no loop.

## Palette (ours, fixed across every video)
| Token | Hex | Use |
|---|---|---|
| ink | `#0B1220` | background (deep navy) |
| panel | `#141C2E` | cards, product stage |
| line | `#26324A` | grid, dividers |
| text | `#F4F7FB` | headlines |
| muted | `#8A97B0` | secondary text |
| cyan (fact) | `#22D3EE` | numbers, specs, highlights |
| amber (catch) | `#FFB020` | ONLY for "THE CATCH" moment + downsides |
| green (verdict yes) | `#34D399` | "worth it if" |
| coral (verdict no) | `#FB7185` | "skip it if" |
Product colour may appear as a soft glow behind the product, never as text.

## Type (free Google Fonts)
- Headlines: **Space Grotesk Bold**, caps, tight tracking (−2%), 96–150 px.
- Numbers: **Space Grotesk Bold** tabular, 160–260 px, cyan.
- Labels/captions: **Inter SemiBold**, **min 44 px** (never tiny mono).
- Max 6 words on screen at once (captions excluded).

## 9:16 layout (1080×1920) — safe frame
- Never place anything important in: top 0–250, bottom 1230–1920, right 900–1080.
- **Title zone**: x 60–880, y 270–560 (headline, left-aligned).
- **Hero zone**: x 60–880, y 560–1100 (product cut-out / diagram / number).
- **Caption strip**: x 60–880, y 1110–1220 — 2–4 word live caption of the current phrase, Inter 52 px, current word in cyan.
- Episode tag top-left of title zone: `SoW Nº001` in muted, 40 px.

## Motion system (Remotion)
- **One continuous canvas**: a virtual camera pans/zooms between scenes (interpolate + spring); scenes are
  laid out on a big board, so transitions are camera moves, not cuts. Hard cut only for emphasis (≤ 6 per video).
- **The thread**: a 6 px cyan line that travels between scenes and turns into the next element (bar, outline, arrow,
  price tag string). Our signature; replaces his wire trick and works for any product.
- **2.5D product**: cut-out PNG with perspective tilt (rotateY ±8°), soft shadow, a light sweep across it on reveal,
  background copy blurred for depth. Slow push-in (scale 1.00→1.06) while it's on screen.
- Something moves at least every 1.5 s; no element static > 2.5 s; never hold a layout > 4 s.
- Numbers always roll (counter) and land with a tick SFX. Prices use a ladder (cheap → expensive) when there are tiers.
- **THE CATCH moment** (around 40–60 % of the video): screen dims, amber `THE CATCH` stamp slams in (scale 1.3→1.0,
  1-frame white flash, low thud), then the downside in big text. Every video has one.
- **Verdict card** (last 6–8 s): two rows — green `WORTH IT IF …` / coral `SKIP IT IF …`, 4–6 words each.
- **Loop**: last frame flows into the first frame's composition (same product position), so replays feel seamless.
- Visual devices to rotate (2–3 per video, never the same set twice in a row): price ladder, spectrum bar (between
  two known products), before/after morph, x-ray/exploded view, progress counter (1/5…5/5), side-by-side vs. rival,
  timeline, "plot twist" dark reset.

## Sound
- Voice: one natural voice for the whole channel, ~150–160 wpm, warm and conversational (contractions, short
  sentences, real pauses on commas/periods). It must not sound robotic: render, listen-check, re-render lines that sound flat.
- Music: our procedural bed, ducked 8–10 dB under voice; changes energy at THE CATCH and at the verdict.
- SFX: tick on numbers, whoosh on camera moves, thud on THE CATCH, soft pop on labels.
- Loudness: voice −16 LUFS, master −14 LUFS, true peak ≤ −1 dBTP.

## Channel art
- Avatar 800×800: navy circle, cyan "S" and amber "W" joined by the thread line (S = spec, W = wreck).
- Banner 2560×1440 (safe area 1546×423 centre): "SPEC OR WRECK" (SPEC in cyan, WRECK in amber) + "New tech. Straight verdicts." + thread line motif.
