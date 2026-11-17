# sow001 (our discarded Short) vs Techy or Not — frame-by-frame comparison (2026-11-17)
Inputs: our review copy (720×1280, 96 s; 1 fps contact sheets + 10 fps measurements + 5 fps strips at the price scenes);
Techy or Not Bose (1.29M views) and Logitech (1.66M) Shorts at 1 fps + 10 fps. Measured = numbers below; the rest is
what is visible on the frames (timestamps given).

## Measured
| Metric | Ours | Bose (TechyorNot) | Logitech (TechyorNot) |
|---|---|---|---|
| Hard cuts (scene > 0.25) | **1** | 8 | 11 |
| Mean frame change (10 fps, 0–255 grey) | **4.64** (restless) | 2.78 | 5.67 |
| Big visual changes per 10 s | 7.9 | 4.2 | 10.1 |
| Longest near-still moment | **0.4 s** (never rests) | 4.4 s | 2.4 s |
| Content centre-x (0.5 = centred) | visibly left-heavy (see 3) | 0.49 | 0.52 |
| Background | blurred product copy + grain | flat cream ~93 % of frames | flat black ~45 % / flat grey ~40 % |

## What's wrong with ours (with timestamps) → fix
1. **Constant restless motion, almost no real cuts.** Everything drifts all the time; there is never a calm frame.
   He moves on the beat, then lets the frame breathe (Bose holds up to 4.4 s). → Motion happens ON spoken beats;
   between beats the frame settles (0.8–2 s calm is fine). Use clean hard cuts between scenes: target 8–12 per 75 s.
2. **Side-swipe transitions leave half-frames** (7 s, 26–27 s, 37 s, 85–86 s show two layouts sliding past each other).
   → No horizontal slides. Hard cut, or in-place morph/scale.
3. **Left-heavy, small layout.** Headline is small (~3 % of frame height) and pinned top-left; product sits small
   in the left/centre; the right third is empty on most frames (e.g. 0–6 s, 8–18 s, 46–54 s). His headline fills ~70–85 %
   of the width ("NEW BOSE EARBUDS", "WIRED.") and the product fills 60–90 % of the width. → Centre everything;
   headline cap height ≥ 7 % of frame height (≥ 130 px at 1080 w, 90 px at 720 w), product ≥ 60 % of frame width in hero shots.
4. **Same headline held far too long:** "SOLD OUT TWICE" 6 s (49–54 s), "THE VERDICT" 9 s (79–87 s), "4 CHANNELS → 4 TRACKS"
   5 s (27–31 s), "CROWDFUNDED = RISK" 4 s. He changes the main text roughly every sentence (2–4 s). → New headline per sentence.
5. **Number counters show wrong values on screen:** "$377", "$494" before "$500" (51–53 s); "$25", "$57", "$73" before
   "$79", and $79 is visible for only ~0.2 s before the cut (60–62 s). → Rolls ≤ 0.35 s; the final value holds ≥ 1.2 s.
6. **Muddy backgrounds:** a blurred copy of the product + grain behind every scene (all frames). → Flat solid colour (§12).
7. **Burned-in captions and tiny labels** ("Kickstarter goal", "it's a Kickstarter", caption pills on every frame). → None.
8. **Too few distinct real images:** the same prototype photo and one product illustration repeat across most scenes.
   He shows a different official image/angle almost every scene (front, side, close-up, lifestyle, colourways). →
   New real image (or new crop/angle of one) every scene; never the same framing twice in a row.
9. **Weak first frame:** small headline on dark, small product (0 s). His first frame: product huge + 3-word title huge +
   one highlight mark. → Frame 1 = product ≥ 60 % width, ≤ 3-word huge title, one accent mark.
10. **End card held 3 s on a near-empty frame (93–95 s)** — fine for the loop, but keep the product on it so frame 1/last match.

## Keep (worked)
- Locked voice/timing/mix (measured on the file: 171 wpm articulation, 0.69 s gaps, 2.9 s tail, 17.2 dB music gap).
- THE CATCH stamp beat (62–64 s) and calendar flip (66–70 s) read clearly. Strike-through/“≠” device reads well.
- Price ladder idea and verdict structure — just bigger, centred, faster to land.
