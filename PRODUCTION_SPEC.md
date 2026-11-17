# PRODUCTION SPEC — current rules only (rewritten 2026-11-17; older versions are in git history)

Read with: state/brand.md (palette, logo, watermark) · scripts/<slug>/ (script.md locked text, cues.json, factsheet.md).
Benchmark for Shorts = Techy or Not (measured: state/competitor_watch/). Long videos = our own format (later).

## 1. Real product images (non-negotiable)
- Real product on screen ≥ 60 % of runtime; ≥ 6 distinct real images per Short (12 per long video).
- Sources in order: official product page / newsroom / press kit → press articles embedding the brand's press images
  (full-size file) → brand's own social posts (stills) → store page screenshots for price/date facts.
- NOT allowed: any video clip from YouTube/TikTok/Instagram or brand promo videos; Getty/stock with watermarks;
  other creators' thumbnails; AI-generated product photos.
- Originals ≥ 1600 px long edge; no visible pixelation. Cut-outs: rembg isnet-general-use, 1 px feather, no halos,
  soft contact shadow. Colour-match all images. Log each in assets.md (file, URL, credit, resolution).
- Our 2-D objects explain; they sit next to the real image, never replace it.

## 2. Look (Techy or Not formula, done with more detail)
- Centred: one vertical axis; content centre-x 0.47–0.53 every frame. Product ≥ 60 % width in hero shots (40–70 % otherwise).
- Flat solid backgrounds only: paper #FAF8F5 main, lavender #ECE8FB, blush #FBE7E2, or the product's own colour.
  NO black backgrounds, no grain, texture, gradient, vignette or blurred product copies. Colour changes = hard flip on a beat.
- Motion: scale in place, vertical slides, morphs, object continuity, crossfades. NO sideways pans / infinite canvas;
  never two layouts half-and-half.
- Rhythm: 8–12 hard cuts per 75 s; motion on beats, then calm holds 0.8–2 s; nothing static > 2.5 s.
- Text: 1–3 words per scene (number + unit = one), headline cap height ≥ 7 % of frame height (≥ 90 px at 720×1280),
  new headline every spoken sentence, none on screen > 4 s, no label < 30 px at 720 w. NO captions burned in
  (captions.srt is still delivered for YouTube closed captions).
- Frame 1: product ≥ 60 % width + ≤ 3-word huge title + one accent mark.
- Content area ends at y 1240 (1080 scale); watermark below it (brand.md). Safe frame y 270–1240.

## 3. Show, don't write (Mayer: coherence, signaling, redundancy, contiguity, segmenting)
- One idea per scene; the ONE key thing gets the callout ring/underline/colour.
- Ideas as flat 2-D objects (ink outlines 4–5 px at 720 w, palette fills, round caps, springy entrance, one SFX each):
  brightness → sun · battery → cell filling · thinness → calipers · weight → scale · water → drop + ripples ·
  fitness → pulse line · price → tag/coin · region → map pin · date → calendar flip · "no X" → strike-through ·
  sold out → stamp · comparison → bars/see-saw.
- Label sits next to the part it describes; visuals land on the spoken word ±2 frames; reveal parts in sequence.
- Maps = Natural Earth 1:110m (1:50m close-ups), country filled marigold, others stone 25 %, pin at real centroid.
  Charts to scale. Every drawn fact matches factsheet.md.

## 4. Detail (peak level, every video)
- Two passes: timing/layout first, then detail pass. Never ship pass 1.
- Every element: enter (spring, 60–90 ms stagger), alive (1–2 px float / 0.5 % breathe / light sweep), exit (180–240 ms ease).
- Product: rim light, contact shadow, ±1–2° drift, light sweep on reveal. Close-ups: zoom to the named part + marigold
  ring that draws on, hold ≥ 1.2 s.
- Counters: digits roll ≤ 0.35 s, unit after, final value visible ≥ 1.2 s, never a wrong value outside the roll.
- THE CATCH (40–60 % in): wreck-red stamp slam, thud, riser before it. Verdict: logo v5 k upright (SPEC) / falls (WRECK).
- SFX on every visual event; music drop 0.5 s before the verdict.

## 5. Audio — LOCKED (owner 2026-11-17: "sounds perfect, lock the audio")
- Kokoro af_heart 0.795: `audio/narrate.py <script.md> af_heart 0.795 out.wav 0.30 0.42` (applies config/pronunciations.json).
- Mix: `audio/mix.sh voice.wav bed.wav out.mp3` (bed −11 dB + sidechain, −14 LUFS, TP −1, keeps full tail).
- Verify: `audio/measure_timing.py file` → articulation 168–180 wpm, sentence gap 0.60–0.75 s, tail ≥ 2 s, last words present.
- Script for the ear: short sentences, contractions, one natural reaction per beat, numbers as spoken. 160–210 words per Short.
- Only change: add new words to config/pronunciations.json (print phonemes for every brand/term first).

## 6. Export
- Shorts 720×1280, 30 fps, H.264 High, CRF 23–26, maxrate 2 Mbps / bufsize 4 Mbps, AAC 128 k, +faststart, ≤ 20 MB.
- Long videos later: 1920×1080, CRF 23, maxrate 6 Mbps.

## 7. QA — cheap but complete (token rules, CLAUDE.md)
Video session, before handoff (write qa.md):
- Numbers from a script, not by eye: hard cuts, mean frame change (2.5–6), longest calm hold, headline max hold,
  counter final hold, centre-x range, real-image screen time %, file size, loudness, measure_timing output.
- Look at images only as: ONE contact sheet (1 frame / 3 s, 180 px wide tiles) + ONE zoom sheet per scene group
  (200 % crop + 100 % + phone-size tiled into one image). Fix → re-render → re-check only the changed scenes.
Script session, before upload: read qa.md numbers + one contact sheet + check every on-screen fact vs factsheet.md.
Re-watch frame by frame against the benchmark only when the numbers fail or the owner asks.
