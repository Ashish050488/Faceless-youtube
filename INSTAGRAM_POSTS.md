# Instagram image posts — brief for the Instagram session (owner 2026-11-17)

Account: Instagram **@specorwreck** (formerly @viral_lab0), vidIQ platformAccountId 29324801787184753, publishing enabled.
This session does still-image posts only (single image/news posts, carousels, photo collages). NO videos or Reels:
the script session cross-posts YouTube Shorts as Reels. Full plan, slot routine and how-to: **state/instagram_plan.md**.

## Volume and timing (owner 2026-11-17, confirmed twice in the Instagram chat — overrides the earlier 1–2/day)
- **5 image posts per day, 10:00–23:59 IST**: 10:17, 13:43, 17:11, 20:37, 23:23 IST (5 scheduled tasks).
- Each post is made FRESH at its slot: web-search the hottest tech story of that moment, never prepare in advance.
- Topics: ALL hot tech news (AI companies, CEO exits, IPOs, launches, regulation, big deals), not only gadgets.
- vidIQ publishes only after the owner replies to that exact draft: one notification per slot, any reply publishes.

## What to post (same brand as the YouTube channel — read state/brand.md, PRODUCTION_SPEC.md §12–§18)
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
- Images: EVERY post has a real official image (press render, press-kit logo or exec headshot; credit in caption). If a story
  has none, pick another story. No other creators' content, no Getty, no news-site photos, no AI-made images.

## Template + checking (token rule, owner 2026-11-17)
- The reusable template is render/instagram/template.js (fill a spec JSON; see its header). Don't write new layout code.
- Check ONE tiled preview of the finished carousel (all slides side by side, small) — no screenshot per slide.
- Read only CLAUDE.md, this file and state/instagram_plan.md.

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
