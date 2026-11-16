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

## Palette v3 — "Switch" (FINAL, owner picked 2026-11-16) — supersedes v2 below
| Token | Hex | Use |
|---|---|---|
| paper | `#FAFAFA` | main background (light, easy on the eyes) |
| ink | `#0E0E10` | text, switch body, dark scenes |
| lime | `#C6FF00` | the ONE accent: switch knob, numbers, highlights, current caption word (on ink only — never lime text on paper) |
| grey | `#8A8A90` | secondary text |
| wreck | `#FF2E63` | WRECK verdict + THE CATCH only |
Logo: lowercase "spec [switch] wreck", Inter Tight 800, tracking −4.5%; icon = ink pill switch with lime knob on the left (spec side).
Why lime: human photopic sensitivity peaks near 555 nm (yellow-green), so lime reads brightest at equal intensity;
used small on ink it pops without glare. Light background chosen by owner as "catchy and doesn't hurt the eyes".

## (superseded) Palette v2 — "Signal" (chosen 2026-11-16 from research below; replaces navy/cyan)
| Token | Hex | Use |
|---|---|---|
| signal | `#FFD60A` | brand colour: logo pill, numbers, highlights, **first frame of every Short (full-bleed)** |
| ink | `#0B0B0C` | dark scenes + text on yellow |
| paper | `#FFFFFF` | light scenes, text on ink |
| graphite | `#1C1C1F` | cards/panels on ink |
| muted | `#8E8E93` | secondary text |
| wreck | `#FF3B30` | WRECK stamp, THE CATCH, downsides only |
| spec | `#00D26A` | SPEC stamp, "worth it if" only |
Contrast (WCAG): signal on ink 13.9:1, paper on ink 19.7:1, spec on ink 9.8:1, wreck on ink 5.5:1 (use wreck only ≥ 60 px).
Rule: per scene max 1 accent + ink/paper. Alternate ink and signal-yellow full-bleed scenes as pattern breaks.

### Why (evidence; *measured* = from a study, *inferred* = our reasoning)
- Red is linked to excitement, blue to competence in brand-personality research (Labrecque & Milne 2012,
  J. Academy of Marketing Science 40:711–727) → red reserved for the "wreck/catch" tension moments.
- Red captured and held attention in emotional images, not neutral ones (Kuniecki et al. 2015, Front. Hum. Neurosci.)
  → red only at emotional beats (THE CATCH, WRECK), so it keeps its punch.
- Thumbnail studies disagree: one industry analysis links warmer/more saturated frames to higher attention (Realeyes),
  another found no pixel difference between breakout and flop thumbnails (Eden, 2,960 thumbnails); faces were the most
  consistent breakout trait (vidIQ, 500 breakouts). → colour alone won't hook; it must create contrast. *inferred*
- The Shorts player and app are mostly dark; a dark-navy frame blends in, a full-bleed bright yellow frame is the most
  luminous, highest-contrast thing in a dark feed (isolation/von Restorff effect). *inferred*
- Differentiation: Techy or Not = cream + orange; MKBHD = red/black; LTT = orange. Black + signal yellow is unclaimed
  in tech Shorts and reads as "caution / verdict". *inferred*
- To verify on our own data: A/B the first frame (yellow vs ink) and thumbnails (Studio Test & Compare) after 10 videos.

## Type (free Google Fonts)
- Headlines: **Space Grotesk Bold**, caps, tight tracking (−2%), 96–150 px.
- Numbers: **Space Grotesk Bold** tabular, 160–260 px, signal yellow (or ink on yellow scenes).
- Labels/captions: **Inter SemiBold**, **min 44 px** (never tiny mono).
- Max 6 words on screen at once (captions excluded).

## 9:16 layout (1080×1920) — safe frame
- Never place anything important in: top 0–250, bottom 1230–1920, right 900–1080.
- **Title zone**: x 60–880, y 270–560 (headline, left-aligned).
- **Hero zone**: x 60–880, y 560–1100 (product cut-out / diagram / number).
- **Caption strip**: x 60–880, y 1110–1220 — 2–4 word live caption of the current phrase, Inter 52 px, current word in signal yellow.
- Episode tag top-left of title zone: `SoW Nº001` in muted, 40 px.

## Motion system (Remotion)
- **One continuous canvas**: a virtual camera pans/zooms between scenes (interpolate + spring); scenes are
  laid out on a big board, so transitions are camera moves, not cuts. Hard cut only for emphasis (≤ 6 per video).
- **The thread**: a 6 px signal-yellow line that travels between scenes and turns into the next element (bar, outline, arrow,
  price tag string). Our signature; replaces his wire trick and works for any product.
- **2.5D product**: cut-out PNG with perspective tilt (rotateY ±8°), soft shadow, a light sweep across it on reveal,
  background copy blurred for depth. Slow push-in (scale 1.00→1.06) while it's on screen.
- Something moves at least every 1.5 s; no element static > 2.5 s; never hold a layout > 4 s.
- Numbers always roll (counter) and land with a tick SFX. Prices use a ladder (cheap → expensive) when there are tiers.
- **THE CATCH moment** (around 40–60 % of the video): screen dims, wreck-red `THE CATCH` stamp slams in (scale 1.3→1.0,
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

## Channel art (FINAL v3: files delivered 2026-11-16 — specorwreck_profile_800.png, specorwreck_banner_2560x1440.png; older lines below are superseded)
- Avatar 800×800 (minimal): flat signal-yellow `#FFD60A` background, ink "S" + small ink pill with yellow "or" + ink "W", Space Grotesk Bold, centred in the circle.
- Banner 2560×1440 (minimal): flat ink `#0B0B0C`; centred in safe area: white "SPEC" + signal-yellow pill with ink "or" + white "WRECK"; small muted line "New tech. Straight verdicts." Nothing else.
