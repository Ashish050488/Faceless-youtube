# Instagram image posts — brief for the Instagram session (owner 2026-11-17)

Account: Instagram **@viral_lab0** (owner is renaming it to "Spec or Wreck" / @specorwreck), connected in vidIQ with
publishing enabled. Find its platformAccountId with `vidiq_social_account_list`. This session does IMAGE posts and
carousels only. Reels/videos are handled by the YouTube pipeline (script + video sessions) and cross-posted separately.

## Volume and timing
- 1–5 image posts per day at random times (vary 09:00–23:00 in the audience's main time zones, at least 2 h apart).
- Each day: prepare the NEXT day's posts as vidIQ drafts with a publishAt each, show the owner one summary
  (images + captions + times), and publish only after the owner approves ("post them"). vidIQ requires the owner's
  approval for every post; one approval can cover the whole day's batch.

## What to post (same brand as the YouTube channel — read state/brand.md, PRODUCTION_SPEC.md §12–§18)
- Topics: the newest physical tech from BIG brands (last 24 h), plus carousel versions of our published Shorts.
- Format: carousel 1080×1350 (4:5), 4–7 slides.
  1. Hook slide: the REAL product image (official press/store image, whole product, centred) + 1–3 huge words or one number.
  2–5. One fact per slide, shown with our flat 2-D objects (sun = brightness, battery, calipers, scale, water drop,
     price tag, map with real Natural Earth shapes) + 1–3 words. Label next to the part it describes.
  6. THE CATCH slide (wreck colour stamp).
  7. Verdict slide: logo v5 wordmark "spec or wreck" (k upright = SPEC, falling = WRECK) + "Full breakdown on YouTube".
- Look: flat warm backgrounds (paper #FAF8F5, lavender #ECE8FB, blush #FBE7E2, or the product's own colour); no black
  backgrounds, no texture/grain; ink #151312 text; ember #C2410C accent text; marigold #FFB224 object fills;
  wreck #E5484D only for the catch. Inter Tight 800 headlines. Watermark: the "s w" mark, bottom-right, small.
- Facts: every number confirmed by 2 independent sources (primary source when reachable); no leaks/rumours; sources
  listed at the end of the caption. Never invent prices/specs.
- Images: official press/store images only (credit in caption). No other creators' content, no Getty, no AI-made fake
  product photos.

## Caption
- Line 1: hook (≤ 125 chars, shows before "more"). Line 2: "Spec or wreck? 👇". Then 1–2 short fact lines, sources, image
  credit, and 3–5 relevant hashtags (#tech #gadgets #<brand> #specorwreck ...).

## Music
- The Instagram API (and vidIQ) cannot attach Instagram's music library to image posts. Post without music; if the
  owner wants a trending track on a specific post, tell them which post and they add it in the app after it goes live.

## Free tools only
- vidIQ connect/draft/publish for Instagram: 0 credits. Render slides with HTML + Playwright (pre-installed) or PIL.
  Upload each slide with `vidiq_upload_image` (local file → uploadUrl + PUT, then transferId).

## Log
- Record every post in state/instagram_posts.json (date, topic, slides, caption, sources, publishAt, permalink).
- Commit code/state to main only. Never commit images; never touch layer3studios.
