# PRODUCTION SPEC — every video, no exceptions (owner, 2026-11-16)

Read with: WORKFLOW.md · state/brand.md (palette v4 warm, logo v5 "falling letter", Micro-detail standard) ·
state/playbook_shorts.md · scripts/<slug>/ (script.md is locked text; cues.json; factsheet.md).

## 1. REAL PRODUCT IMAGES ARE THE VIDEO (non-negotiable)
We are a tech channel. Viewers must SEE the real product. Benchmark: in Techy or Not's top Shorts the real product
(official renders/press photos) is on screen in most frames (state/competitor_watch/). Our rule:
- **≥ 60 % of runtime shows a real image of the product** (hero, angles, close-ups, in use, ports, colours, packaging).
- **Minimum 6 distinct real images per Short**, 12 per long video. Never one image reused for the whole video.
- Our own graphics are for EXPLAINING (diagrams, counters, ladders, comparisons) — layered ON or NEXT TO real images,
  never instead of them. Drawn/generic stand-ins only for things that have no real image.

### Where to get them (in this order)
1. Official product page / brand newsroom / press kit (largest srcset or og:image; look for "press", "media", "download").
2. Creator/campaign page (Kickstarter/Indiegogo gallery images, campaign video thumbnails as stills).
3. Press articles covering the launch (they embed the brand's press images): take the full-size file, not the thumbnail.
4. Official social posts by the brand (image stills only).
5. Real UI evidence as screenshots: the product's store/campaign page showing price, tiers, dates (crop to the fact; no personal data).
NOT allowed: any video clip from YouTube/TikTok/Instagram or a brand's promo video (reused-content policy; whole-channel
penalty); Getty/Alamy/watermarked stock; other creators' thumbnails; AI-generated fake product photos.
Note: real product photos may show the things the product works with (e.g. Game Boy cartridges) — fine as editorial
news imagery. Do not use third-party logos/box art/music as standalone graphics.

### How to treat them
- Keep originals ≥ 1600 px on the long edge; upscale max 2× with Real-ESRGAN only if needed; never show visible pixelation.
- Cut-outs: background removal (rembg, isnet-general-use), 1 px edge feather, check for halos at 200 % zoom; keep a
  soft contact shadow under every cut-out.
- Use full-bleed photos too (not only cut-outs): slow push-in 1–2 %, slight parallax between photo layers.
- Close-ups: crop the high-res original on the detail being narrated (ports, buttons, slot) — "camera" moves there.
- Colour-match: unify white balance/contrast of all product images so they look like one shoot.
- Log every image in `assets.md`: file, source URL, what it shows, credit line, resolution. Credits go in the description.

## 2. DETAILING — "peak level", every small thing (constant for every video)
Apply the Micro-detail standard in state/brand.md to EVERY element, plus:
- **Two-pass build**: pass 1 = timing/layout to the voice; pass 2 = detail pass (micro-motion, shadows, highlights,
  SFX, easing polish). Never ship pass 1.
- **Every element has 3 states**: enter (spring, staggered), alive (float/breathe/light sweep while on screen), exit
  (eased 180–240 ms or carried by the camera). Nothing pops on/off.
- **Word sync**: on-screen key words, numbers and highlights land within ±2 frames of the spoken word (use word timestamps).
- **Depth**: 3 layers in most scenes (background texture/blur · real product · graphic/text), each moving at a slightly
  different speed (parallax).
- **Texture**: subtle film grain (2–3 %) over the whole frame; soft vignette on ink scenes; no flat dead backgrounds.
- **Type polish**: optical kerning, no orphans/widows, numbers in tabular figures, units smaller than numbers (e.g. 128 × 112 px).
- **Transitions**: camera moves on one canvas or the marigold thread; match-cuts on shape (round slot → round dial etc.).
- **Sound detail**: every visual event has a matched SFX; riser into THE CATCH; music drop 0.5 s before verdict;
  room tone under voice so silence never sounds digital.
- **Logo animation (end card, every video)**: "spec or wreck" wordmark; for SPEC the falling k snaps upright with a
  click; for WRECK the k falls further with a thud and settle. Then loop to frame 1.

## 3. QA before handing over (write results in qa.md)
- Contact sheet at 2 fps + every cue still. Count: real-image screen time %, distinct real images, max static time.
- Scrub at 0.25×: no pop-ins, no overlaps, no jitter, no halos, no pixelation.
- Every on-screen number/word matches script.md and factsheet.md.
- Safe zones clear (Shorts: top 250, bottom 690, right 180 px). Loudness −14 LUFS, TP ≤ −1 dBTP, voice natural.
- If any check fails, fix and re-render before uploading to Drive.

## 4. VOICE — must sound like a person, not a reader (owner 2026-11-16: "should sound natural, like 'hmm, yeah'")
Two causes of robotic narration, both fixed every time:
**A. Script written for the ear** (script session's job): short sentences, contractions, one natural reaction per beat
("okay", "wait", "yeah", "honestly?"), questions answered out loud, numbers said the way people say them
("a hundred and twenty-eight", "fifteen-thousand-dollar"), punctuation as pause marks ("," short, "..." beat, "—" turn,
new line = breath). Never read lists or spec strings.
**B. Expressive free voice** (video session's job), commercial-use licence only:
- Engine: the one chosen in config/channel.json → voice (owner picks by ear from comparison samples).
- Render sentence by sentence, not the whole script at once; listen to each; re-roll any flat or wrong-stress line.
- Vary delivery per beat: hook = playful, catch = lower and slower, verdict = confident. Small speed changes (±5 %).
- Add 120–250 ms breaths/gaps between lines (real pauses), room tone under everything, light de-ess, gentle
  compression (2:1), no heavy limiting on the voice. Voice −16 LUFS before the mix.
- Forbidden: non-commercial-licence models (e.g. XTTS/Coqui CPML, F5-TTS weights, Fish Speech weights).

## 5. DETAIL SCORE — gate before upload (script session grades every render with the watch-video skill, 2 fps + every cue)
Each line scores 0/1/2. **Ship only at ≥ 26/30 and no 0 anywhere.** Otherwise it goes back to the video chat with the
failing timestamps listed.
1. Real product on screen ≥ 60 % of runtime · 2. ≥ 6 distinct real images · 3. Image quality (no pixelation, no halos)
4. Every element animates in (no pop-on) · 5. Every element animates out (no pop-off) · 6. Idle micro-motion (nothing static > 2.5 s)
7. Word sync ±2 frames for key words/numbers · 8. Number roll-ups land with settle · 9. 3-layer depth/parallax in most scenes
10. Shadows/light sweep on product cut-outs · 11. Typography polish (kerning, ≤ 6 words, units styled)
12. Transitions are camera moves/thread (≤ 6 hard cuts) · 13. Colour: palette v4 only, accent ≤ 15 % of frame
14. Sound: SFX on every visual event, riser into THE CATCH, pre-verdict drop · 15. Voice natural (no flat/robotic line), safe zones clear, loudness on spec

## 6. PACE + MIX — measured from the benchmark (Techy or Not Bose/Logitech Shorts, 2026-11-16)
- Narration pace **135–140 wpm** (benchmark Shorts: 135 and 138 wpm; long videos 151–154). Not faster.
- Script length for a Short: **~160–210 words** (benchmark 160–176). Average sentence ~11 words.
- Render sentence by sentence; 0.22–0.30 s gap between sentences, +0.12–0.18 s at line ends.
- **Music sits 15–17 dB below the voice** (benchmark measured 14.8 and 16.9 dB; our old 8–10 dB duck buried the voice).
  Implementation that measured 16.1 dB: voice loudnorm −16 LUFS; bed volume −11 dB; sidechaincompress ratio 3,
  attack 120 ms, release 400 ms; master loudnorm −14 LUFS, TP −1 dBTP (benchmark master: −15.1 LUFS, peak −1.2 dBFS).
- Verify every render: speech-vs-pause-music gap 14–18 dB (script: 50 ms RMS frames, 75th pct vs 15th pct).

## 7. LOCKED VOICE + TIMING (owner approved direction 2026-11-16; copied from Techy or Not by measurement)
Measured on the benchmark with word timestamps (faster-whisper): speaking (articulation) rate 170–178 wpm,
overall 135–138 wpm, sentence gap 0.66–0.70 s, comma gap 0.28–0.54 s, tail after last word 2.1–3.0 s.
- Voice: Kokoro **af_heart**, speed **0.795**. Render with `audio/narrate.py <script.md> af_heart 0.795 out.wav 0.30 0.42`
  (renders per sentence, trims the engine's own silence at −45 dB keeping 40/80 ms pads, inserts 0.30–0.42 s which
  measures as ~0.69 s word-to-word, 2.5 s tail).
- Mix with `audio/mix.sh voice.wav bed.wav out` (keeps full length incl. tail; music −11 dB + sidechain → 16–16.5 dB gap; −14 LUFS; TP −1).
- Verify with `audio/measure_timing.py file` — must land: articulation 168–180, sentence gap 0.60–0.75, tail ≥ 2.0 s,
  last words present. Old bug fixed: amix/sidechain stopped early and cut the ending; never mix without apad+atrim.

## 8. LOCKED items (owner-approved — never change without the owner)
- Voice + timing + mix (§7). · Watermark (state/brand.md → Watermark). · Logo v5. · Palette v4.

## 9. NO ON-SCREEN CAPTIONS (owner 2026-11-16)
- Do not burn subtitles/captions into the video. On-screen text = only the designed key words/numbers (≤ 6 words).
- Still deliver captions.srt (script-aligned) — the script session uploads it to YouTube as closed captions
  (viewer-toggled; helps accessibility and search). It is never rendered into the picture.

## 10. RENDER-CHECK LOOP — every image, every scene (owner: "check by zooming in and zooming out")
The video session must LOOK at its own output, scene by scene, before moving on. For each scene:
1. Render 3 stills: first frame, middle frame, last frame (plus every frame where a new element lands).
2. Inspect each still at three zoom levels and fix anything that fails:
   - **Zoom in (200 % crop of the product and text):** sharp edges, no pixelation/compression blocks, no cut-out
     halos or fringes, no jagged text, shadows soft and correctly placed, no stray pixels, no clipping at frame edges.
   - **100 % (full 1080×1920):** composition balanced, nothing touching safe-zone lines, alignment on the grid,
     spacing consistent, only one accent colour, watermark present and clear.
   - **Zoom out (phone size 360×640 and 180×320 thumbnail):** the key word/number readable in under 1 second,
     the product recognisable, nothing important too small, contrast strong enough.
3. Check motion on a 4-frame strip around each animation: easing visible (not linear), no jump/pop, no jitter.
4. Log in qa.md per scene: "scene N — in/100/out/motion: pass | fixed: <what>". Never mark pass without looking.
5. After the full render: contact sheet at 2 fps + re-check the 5 weakest scenes again at all zoom levels.
Fix-and-re-render until every scene passes. Speed is never a reason to skip this.

## 11. DETAIL UPGRADES — apply everywhere (owner wants "super detailed")
- Product images: subtle rim light / edge highlight matching the scene light direction; reflection or contact shadow
  on the "floor"; micro-rotation drift (±1–2°) while on screen; focus pull (background blur 0 → 6 px) when the product enters.
- Close-ups: when narration names a part (slot, port, button, camera), do a smooth zoom-in to that exact area of the
  real photo with a thin marigold callout ring that draws on; hold ≥ 1.2 s; zoom back out.
- Numbers: digits roll individually, the unit animates in after, a soft glow pulse on landing.
- Text: per-word reveal with 70 ms stagger, tiny overshoot (1.02 → 1.0); exits blur + slide 16 px.
- Backgrounds: never flat — slow-moving soft gradient or grain, 1–2 % parallax against the product.
- Transitions: camera move or shape match; add a 3–4 frame motion blur on fast moves.
- Every scene has at least 3 animated details happening (e.g. product drift + light sweep + label reveal).
- Sound: each detail that moves has a matching soft SFX; nothing moves silently on a beat.

## 12. MATCH TECHY OR NOT'S LOOK — measured 2026-11-16 (OVERRIDES any older rule above that conflicts)
Measured on its top Shorts (Bose 1.29M, Logitech 1.66M), 1 fps frames:
- **Centred composition.** Content centre sits at 0.49–0.52 of the frame width with little drift (sd 0.04–0.08).
  → Our rule: one vertical centre axis. Product centred. Headline centred, or a left-aligned block whose whole
  box is centred. Content centre-x must measure 0.47–0.53 on every frame (the video session measures it in QA).
- **NO sideways camera moves / no "infinite canvas" pans** (they made our last Short feel shifted left/right).
  Allowed motion: scale in place (push-in/zoom on the centre or on the named detail), vertical slides, morphs,
  object continuity (one object becomes the next, like his earbud wire), crossfades, 1-frame flips on the beat.
- **FLAT SOLID BACKGROUNDS. No grain, no texture, no gradient, no vignette** (owner: textured backgrounds look bad).
  Bose: one flat light colour for ~93 % of frames. Logitech: flat black ~45 % / flat light grey ~40 %, chosen to fit
  the product. → Ours: paper #FAF8F5 as the main flat background; ink #151312 flat for dark products/drama beats;
  you may switch the flat background colour to suit the product's colour. Background colour changes happen as a
  clean hard flip on a beat or a vertical wipe — never a fade through grey.
- **Real images dominate**: large centred cut-outs on the flat background (Bose style) and full-bleed official renders
  (Logitech style); lifestyle/press photos as rounded cards, centred. Product occupies 40–70 % of frame width.
- **Text**: big bold headline (1–3 words) in the upper part; small secondary line under it; no captions; no tiny labels.
- **Content vertical span** on the benchmark: ~9 %–75 % of height. Keep text inside our safe frame (y 270–1230);
  the product image itself may extend down to ~75 % of height (y 1440) as he does, but never text there.
- **His animation vocabulary to copy and do better**: object continuity (wire → next scene), strike-through lists,
  odometer price, swinging price tag, UI-card mock (modes toggling), timeline/thermometer, side-by-side comparison
  cards, logo end card. We add: zoom-to-detail with callout ring, per-word reveals, SFX on every event.
- **Overrides**: §2 "Texture: film grain…vignette" → REMOVED. §11 "Backgrounds: never flat…gradient or grain" →
  REPLACED by flat solid backgrounds. brand.md "camera pans on one canvas" → REPLACED by in-place motion above.

## 13. EXPORT SIZE (owner 2026-11-16: last render was 93 MB — far too big)
- Shorts: **720×1280**, 30 fps, H.264 High, CRF 23–26 with maxrate 2.0 Mbps / bufsize 4 Mbps, AAC 128 kbps,
  +faststart. Target **≤ 20 MB for ~90 s** (graphics-heavy max ~20 MB). Check size before upload.
- Long videos later: 1920×1080, CRF 23, maxrate 6 Mbps.

## 14. FIX LIST FROM THE sow001 vs TECHY OR NOT COMPARISON (2026-11-17, measured — see state/competitor_watch/sow001_vs_techy.md)
These are hard requirements for every Short from sow002 on:
1. Motion on beats, then calm: frame may settle 0.8–2 s between beats; no constant drift. Hard cuts between scenes: 8–12 per 75 s.
2. No horizontal slides/swipes; never two layouts visible half-and-half.
3. Centred and BIG: headline cap height ≥ 7 % of frame height (≥ 90 px at 720×1280), single-word headlines ≥ 75 % width;
   product ≥ 60 % of frame width in hero shots. Content centre-x 0.47–0.53.
4. New headline every spoken sentence (2–4 s). No headline on screen > 4 s.
5. Counters: roll ≤ 0.35 s; final value visible ≥ 1.2 s. Never show a wrong intermediate value for longer than the roll.
6. Flat solid backgrounds only (no blurred product copy, no grain).
7. No captions, no labels under 44 px (720 w: 30 px).
8. Different real image or new crop/angle every scene; never the same framing twice in a row.
9. Frame 1: product ≥ 60 % width + ≤ 3-word huge title + one accent mark.
10. QA must report: hard cuts, mean frame change (target 2.5–6), longest calm hold, headline max hold, counter final-hold.

## 15. SHOW, DON'T WRITE (owner 2026-11-17: "use 2-D objects instead of too many words, no captions")
- On-screen text: max 1–3 words per scene (a number + unit counts as one). Most scenes carry ONE number or ONE word.
- Every idea is shown with a clean 2-D object/icon drawn in our palette (flat, thick rounded strokes, no gradients), animated:
  brightness → sun with rays that grow · battery → battery cell filling/draining · thinness → calipers/ruler ·
  weight → balance/scale · water rating → water drop + ripple rings · heart-rate/fitness → pulse line · price → tag/coin ·
  launch/region → map pin on a simple globe · time/date → calendar flip · "no X" → icon + strike-through ·
  sold out → stamp · comparison → two objects on a see-saw/bars.
- Objects sit next to/around the REAL product image (which stays ≥ 60 % of runtime); they never replace it.
- Style: flat 2-D, ink #151312 outlines 6–8 px at 1080 w (4–5 px at 720 w), fills from palette v4, round caps/joins,
  springy entrance, one SFX per object action.
