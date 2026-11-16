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
