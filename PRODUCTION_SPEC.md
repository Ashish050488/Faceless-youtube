# PRODUCTION SPEC — current rules only (rewritten 2026-11-17; older versions are in git history)

Read with: state/brand.md (palette, logo, watermark) · scripts/<slug>/ (script.md locked text, cues.json, factsheet.md).
Benchmark for Shorts = Techy or Not (measured: state/competitor_watch/). Long videos = our own format (later).

## 1. Real product images (non-negotiable)
- Real product on screen ≥ 60 % of runtime; ≥ 6 distinct real images per Short (12 per long video).
- Sources in order: official product page / newsroom / press kit → press articles embedding the brand's press images
  (full-size file) → brand's own social posts (stills) → store page screenshots for price/date facts.
- Official product CLIPS (owner 2026-11-18): short muted loops from the brand's OWN product/landing page (e.g. the
  video loops on apple.com product pages; take the file from the page code). Limits, because clips carry more
  copyright/reused-content risk than stills: each clip ≤ 3 s, all clips together ≤ 20 % of runtime, always muted,
  always with our own graphic/number on top (never a bare clip), credited in the description, logged in assets.md.
  Real images still ≥ 60 % of runtime counting stills + clips.
- NOT allowed: clips from YouTube/TikTok/Instagram/X or any other creator; full brand ads/keynote footage; Getty/stock
  with watermarks; other creators' thumbnails; AI-generated product photos.
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
- Text: 1–3 words per scene (number + unit = one), headline SMALLER (owner 2026-11-18): cap height 4–5 % of frame
  height (77–96 px at 1080×1920), numbers may go to 6 %; never wider than 80 % of the frame.
  new headline every spoken sentence, none on screen > 4 s, no label < 30 px at 720 w. NO captions burned in
  (captions.srt is still delivered for YouTube closed captions).
- Frame 1: product ≥ 60 % width + ≤ 3-word huge title + one accent mark.
- Layout = Techy or Not's default full-frame composition (owner 2026-11-17: NO platform safe-zone rules; the video also
  goes to Instagram). Rule instead: NOTHING OVERLAPS — text, product, objects and watermark never touch each other.
  Side margin: every element stays ≥ 54 px from the left and right edges at 1080 w (5 %), so text never runs off the
  frame (sow004 had a 1,086 px headline on a 1,080 frame). Shrink the text to fit; never let it touch an edge.
  Top margin (owner 2026-11-18): nothing above y 170 at 1080×1920 (≈ 9 %), so phone notches / Dynamic Island /
  punch-hole cameras never touch text or product. check.py fails anything inside it.

## 3. Show, don't write (Mayer: coherence, signaling, redundancy, contiguity, segmenting)
- One idea per scene; the ONE key thing gets the callout ring/underline/colour.
- MORE objects, MORE numbers, MORE detail (owner 2026-11-18): every scene has at least one 2-D object; every number in
  the script is shown as a number + object (aim ≥ 5 numbers per Short); objects are detailed, not icons — e.g. a
  battery with cells, terminal and % ticks; calipers with a scale and a jaw that slides; a price tag with string and
  a hole; a screen with bezel and pixels; a chip with pins. Each object animates its meaning (fills, slides, counts).
- Ideas as flat 2-D objects (ink outlines 4–5 px at 720 w, palette fills, round caps, springy entrance, one SFX each):
  brightness → sun · battery → cell filling · thinness → calipers · weight → scale · water → drop + ripples ·
  fitness → pulse line · price → tag/coin · region → map pin · date → calendar flip · "no X" → strike-through ·
  sold out → stamp · comparison → bars/see-saw · speed → speedometer needle · storage → stacked drives/bars ·
  camera → lens with aperture blades · charging → plug + bolt filling · temperature → thermometer · sound → wave bars ·
  repairability → screwdriver + screw count · size → ruler against a known object (credit card, coin, phone).
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

## 5. Audio — LOCKED (owner 2026-11-24: "I like it, lock it in")
- Voice = Chatterbox (Resemble AI, MIT, free) cloning `audio/voices/our_voice_ref.wav` (10 s of our old Kokoro voice, so
  the channel sounds the same, only more natural): `audio/narrate_chatterbox.py <script.md> raw.wav
  audio/voices/our_voice_ref.wav 0.6 0.4 11`, then `ffmpeg -af atempo=1.09` (owner: 49 s → 45 s felt right).
  Runs only on GitHub Actions (voice.yml). Guard: Whisper match < 0.80 → retry seed 23 → fallback Kokoro
  (`audio/narrate.py <script.md> af_heart 0.795 out.wav 0.30 0.42`); `voice_engine.txt` in the handoff says which.
- Mix: `audio/mix.sh voice.wav bed.wav out.mp3` (bed −11 dB + sidechain, −14 LUFS, TP −1, keeps full tail).
- Verify: `audio/measure_timing.py file` → articulation ~185–205 wpm (Chatterbox ×1.09; Kokoro fallback 168–180), sentence gap 0.55–0.75 s, tail ≥ 2 s, last words present.
- Script for the ear: short sentences, contractions, one natural reaction per beat, numbers as spoken. **100–130 words per Short (45–60 s)** — owner 2026-11-17, competitor data: fastest-growing faceless channel ≈ 43 s.
- Pronunciation: Chatterbox ignores config/pronunciations.json (that is Kokoro-only). If a brand name is hard to say, write it
  the way it sounds in script.md (e.g. "Ny-kon" only if the plain spelling gets misread) and keep the real spelling in metadata.

## 6. Export
- Shorts 1080×1920 (owner 2026-11-17: 720p looked blurry next to the benchmark), frames rendered natively at 1080×1920
  (never upscaled), 30 fps, H.264 High, `-preset slow -tune animation -crf 19`, maxrate 8 Mbps / bufsize 16 Mbps,
  AAC 160 k, +faststart, ≤ 20 MB (flat graphics compress well: expect ~5–12 MB for 80 s).
- Why: YouTube re-encodes every upload; what viewers see depends on the uploaded RESOLUTION (a 720p upload is shown
  at 720p max), not on the file size. Clean flat graphics stay small even at 1080p.
- Long videos later: 1920×1080, CRF 23, maxrate 6 Mbps.

## 7. QA — cheap but complete (token rules, CLAUDE.md)
Video session, before handoff (write qa.md):
- Numbers from a script, not by eye: overlap check (bounding boxes of text/product/objects/watermark never intersect), hard cuts, mean frame change (2.5–6), longest calm hold, headline max hold,
  counter final hold, centre-x range, real-image screen time %, file size, loudness, measure_timing output.
- Look at images only as: ONE contact sheet (1 frame / 3 s, 180 px wide tiles) + ONE zoom sheet per scene group
  (200 % crop + 100 % + phone-size tiled into one image). Fix → re-render → re-check only the changed scenes.
Script session: NO video QA (owner 2026-11-17: "no need to verify until I feel a problem"). It only checks sha256,
then uploads. The video session owns quality. Re-check a video only when the owner reports a problem.

## 8. Reuse — one kit, small per-video files (learned 2026-11-17 from a working pipeline)
Pattern (write our own code; don't copy anyone's):
- render/kit/: small components, 1–8 KB each (Headline, RollingNumber, PriceTag, ProductCutout, CalloutRing, Battery,
  Calipers, Scale, Sun, MapPin (Natural Earth), Bars, StrikeThrough, CatchStamp, EndCardLogo, Watermark, Stage/Show
  (enter/exit timing), anim helpers, dyncolor (product image → background/accent)).
- Per video only: plan.json = named events, each tied to a spoken word (`{"cue":"price","word":"dollars","nth":1,
  "offset":0.0,"sfx":"tick"}`) + a short composition file that places kit components per event.
- cues script: faster-whisper word timestamps → cues.json (event → second). The SAME plan/cues drive the SFX mix,
  so every sound lands on the frame its picture does. No hand timing.
- QA script renders one still per cue (small) + overlap check in code. No frame-by-frame viewing.
- Built 2026-11-17: render/kit/README.md. cues.kit.json = plan + composition in one file (layers tied to words,
  same refs drive SFX); `--check` + check.py = overlap/contrast/factsheet/loudness in code; `--stills cues` = per-cue stills.
- Delete the previous video's asset folder when a new job starts.

## 9. Thumbnail + cover — must be catchy (owner 2026-11-20)
Where they show: in the Shorts feed the video itself plays, so **frame 1 is the real thumbnail**. The custom
thumbnail/cover shows on the channel page, search, subscriptions, suggested, and as the Instagram Reel grid cover.
So make three things look like one poster: frame 1, `cover.jpg` (1080×1920) and `thumbnail.jpg` (1280×720).
- **One hero:** the real product (official image) huge — ≥ 60 % of the frame height on the cover, ≥ 55 % width on
  the 16:9 thumbnail — slightly tilted or cropped close so it feels dramatic, with a strong drop shadow.
- **1–3 words, HUGE:** cap height ≥ 12 % of the cover height (≥ 18 % on the 16:9 thumbnail), Inter Tight 900,
  ink on light or white on the accent block. The words COMPLEMENT the title, never repeat it
  (title "Razer Wants $90 MORE to Save 2 Grams 😳" → thumbnail "$90 FOR 2g?").
- **One number or price in the accent colour** (ember/marigold), the biggest thing after the product.
- **One emotion object** that tells the story at a glance: a red ✕ / strike-through, a "?" stamp, an arrow pointing
  at the catch, a price tag, a WRECK/SPEC stamp. Never more than one.
- **Curiosity gap:** show the twist, not the answer (show "$90 for 2g?", don't show the verdict).
- **Contrast:** flat bright warm background that contrasts with the product colour (dark product → paper/blush;
  light product → marigold/ember block). Text contrast ≥ 4.5:1. No clutter, no small text, no logos except our tiny mark.
- **Phone test (in code):** downscale the cover to 180×320 and the thumbnail to 168×94 → the words must still be
  readable (text height ≥ 14 px at that size) and the product recognisable. check.py fails it otherwise.
- **Honest:** everything on it is in the video and true (no fake reactions, no edited product, no price not said).
- Make 2 versions (A: price/number-led, B: object/twist-led), upload A; log B in qa.md for later A/B (Studio
  "Test & compare" when it's available for the format).
- Script chat writes the thumbnail words + emotion object in cues.json → "thumbnail"; the video chat builds it.
