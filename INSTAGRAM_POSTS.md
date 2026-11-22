# Instagram — brief for the Instagram session (owner 2026-11-17)

## Scope (owner: "it should only focus on Instagram")
- This session thinks ONLY about Instagram @specorwreck: posts, Reels when the script session sends a link, growth.
- Ignore YouTube schedules, scripts and video production. Don't read WORKFLOW.md/PRODUCTION_SPEC.md/schedule.md.
  Only read CLAUDE.md, this file, state/instagram_plan.md, state/brand.md.

## Growth loop — think like a marketer (owner: "adapt, see what works, keep improving")
- Goal: followers and reach for @specorwreck (which also promotes the YouTube channel).
- Measure: once a day (first slot), pull insights for the last posts (reach, saves, shares, likes, comments,
  follows; Reels: plays) with free tools only (vidIQ Instagram insights/comment tools when 0-credit, else the
  public counts). Log them in state/instagram_posts.json.
- Learn: every Sunday, rank posts by saves+shares per reach; write what won/lost (format, topic, hook, slide count,
  time) in state/instagram_plan.md → "Learnings", measured vs guessed. Change ONE thing per week with a written
  hypothesis, keep what wins, drop what loses.
- Market itself: strong first-slide hooks, save-worthy carousels (comparisons, "the catch", price ladders),
  shareable one-liners, a question in every caption to drive comments, reply to comments within the next slot
  (when a free tool allows), relevant hashtags only (3–5), cross-promote the YouTube Short in captions/stories text
  ("Full breakdown on YouTube @specorwreck"). Watch which big tech accounts' formats are trending (study only, never copy).
- Honesty rules stay: no fake facts, no fake urgency, no engagement bait that breaks Instagram rules, no buying
  followers/likes, no spam comments on other accounts.


Account: Instagram **@specorwreck** (formerly @viral_lab0), vidIQ platformAccountId 29324801787184753, publishing enabled.
This session does still-image posts only (single image/news posts, carousels, photo collages). NO videos or Reels:
the script session cross-posts YouTube Shorts as Reels. Full plan, slot routine and how-to: **state/instagram_plan.md**.

## Volume and timing (owner 2026-11-17, confirmed twice in the Instagram chat — overrides the earlier 1–2/day)
- From 18 Nov 2026 (owner): **Short days** (Mon–Sat) = **2 image posts**
  (10:17, 13:43 IST) + **2 Reels** (the day's 2 YouTube Shorts, when the script session sends the links).
  **Long-video days** (every Sunday from 29 Nov 2026; long video built from 7:47 AM IST, public when ready) = **3 image posts** (10:17, 13:43, 16:43 IST), no Reel.
- TOPIC VARIETY (owner 2026-11-20, hard rule): every slot, list 8–10 candidate stories from many sources (Techmeme, The Verge, Engadget, TechCrunch, GSMArena, Gadgets 360, 91mobiles, Beebom, Electrek, Space.com, Tom's Hardware, Google Trends…); rotate categories (phones, laptops, AI, chips, gaming, EVs, space, social apps, India tech, security, wearables, weird gadgets, deals) — never the same category twice in a row; never the same company/story within 3 days (Reels included); prefer less-covered stories with a surprising price/conflict angle. Details: state/instagram_plan.md → TOPIC VARIETY.
- Format mix (owner 2026-11-18): first image slot of the day = 1 carousel (hottest story); other image slots = single-image posts. Details: state/instagram_plan.md → FORMAT MIX.
- SUNDAY HARD RULE (owner 2026-11-22): on Sundays post NO Reels at all (no cross-posts, no safety-net Reels), only the 3 image posts. Never cross-post a long video as a Reel; only YouTube videos ≤3 min are Shorts.
- Each post is made FRESH at its slot: web-search the hottest tech story of that moment, never prepare in advance.
- Topics: ALL hot tech news (AI companies, CEO exits, IPOs, launches, regulation, big deals), not only gadgets.
- FULLY AUTONOMOUS (owner 2026-11-20, hard rule): publish every post yourself right after it passes your own checks (2 sources, official image, preview checked). Never wait for an OK and never ask; send the owner ONE notification AFTER it is live with the link. Reels: post as soon as the script session sends the link.

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
