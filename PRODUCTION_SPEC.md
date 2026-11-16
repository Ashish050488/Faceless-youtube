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
