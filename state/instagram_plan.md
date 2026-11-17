# Instagram content plan — Spec or Wreck (@viral_lab0 → @specorwreck)

Owner 2026-11-17 (updated): 3 still-image posts per day, NO videos/Reels (the script session cross-posts Shorts).
Topics = ALL hot tech news, not only gadgets: AI company updates, IPOs, CEO exits, launches, regulation, big deals.
At each posting slot, search the hottest tech story of that hour, verify it, build the post, then publish.
Music: the API can't attach Instagram music to image posts. Flag posts that would suit a track; the owner adds it in the app.
Brand and fact rules: INSTAGRAM_POSTS.md, state/brand.md, PRODUCTION_SPEC.md §12–18.

## What the data says (2026 benchmarks, not tech-specific)
- Carousels get the highest engagement per reach: 6.9 % median vs 4.4 % single image vs 3.3 % Reels (Buffer, 52M+ posts).
  Reels get the most reach, about 2.25× single images (same study). → Carousels are our main format; Reels (from YouTube) bring reach.
- Per-follower engagement is close between carousels and Reels, about 0.50 % vs 0.48 % in Q3 2026 (Socialinsider).
  → Don't over-invest in any single format. Mix them and measure on our own account.
- Inferred from top tech-news pages: one hero product photo + 1–3 huge words reads in the feed, and "the catch" /
  verdict framing drives comments. To verify on our own insights after 3 weeks.

## Formats
| Code | Format | Size | Use |
|---|---|---|---|
| CAR | Carousel, 5–7 slides: hook → 3–4 facts (2-D object + 1–3 words) → THE CATCH → verdict | 1080×1350 | Main launch of the day |
| COL | Photo collage: 4–6 official images in a grid + 1–2 word headline ("30 STYLES", "5 COLOURS") | 1080×1350 | Colour/style lineups, "every model" |
| NEWS | Single news post: badge + 2-word headline + one hero photo | 1080×1350 | Fast news: launch date, price drop, sold out |
| HERO | Single hero photo: product full size on its own flat colour, one number | 1080×1350 | Striking design, one big spec |
| VS | Two-product comparison carousel (3–5 slides) | 1080×1350 | New launch vs last year's model or main rival |

## Daily slots (UTC, scheduled task fires into the Instagram session)
| Slot | UTC | US ET | India IST |
|---|---|---|---|
| 1 | 12:13 | 07:13 | 17:43 |
| 2 | 18:13 | 13:13 | 23:43 |
| 3 | 23:13 | 18:13 | 04:43 (+1) |
Each slot: pick ONE format (CAR / COL / NEWS / HERO / VS) that fits the story; vary it so no format runs 3 slots in a row.
After 3 weeks, re-weight formats and slot times by saves + shares per reach (vidiq_instagram_owner_insights).

## Topic rules
- The single hottest tech story of the last ~1–3 h (Techmeme, The Verge, CNBC Tech, Reuters Tech, company newsrooms).
- Every number confirmed by 2 independent sources (primary source first). No leaks or rumours; say "reportedly" never.
- Images: official press images/logos only when the company publishes them for press; otherwise our own 2-D objects only.
  No other creators' content, no news-site photos, no AI-made photos of real people or products.
- Money stories: add "News, not financial advice."
- Don't repeat a story within 24 h unless there's genuinely new news.

## Slot routine
1. Search the hottest tech news of the hour → choose the story → fact sheet (2 sources each).
2. Render with render/instagram/*.js (HTML + Playwright, brand rules) → visually check every slide.
3. Upload with vidiq_upload_image → vidiq_social_post_draft_create → show the owner (push notification).
4. vidIQ only publishes after the owner approves the draft ("post it"). Publish right after approval.
5. Log in state/instagram_posts.json.
