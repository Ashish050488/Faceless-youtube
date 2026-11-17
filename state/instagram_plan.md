# Instagram content plan — Spec or Wreck (@viral_lab0 → @specorwreck)

Owner 2026-11-17. This session posts still-image content only (carousels, collages, single photo/news posts).
YouTube Shorts are cross-posted as Reels by the script session. A slideshow Reel format is on hold until the owner decides.
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

## Weekly rotation (times in UTC, randomised ±45 min, at least 2 h apart; posts land 13:00–03:00 UTC = morning–night US/EU/IN)
| Day | Posts | Mix |
|---|---|---|
| Mon | 2 | CAR + NEWS |
| Tue | 3 | NEWS + HERO + CAR |
| Wed | 2 | COL + CAR |
| Thu | 4 (multi-post day) | NEWS + CAR + HERO + NEWS |
| Fri | 3 | VS + CAR + COL |
| Sat | 1 | CAR (weekend "best launch of the week") |
| Sun | 2 | HERO + COL |
Total ≈ 17/week. After 3 weeks, re-weight by saves + shares per reach from Instagram insights (vidiq_instagram_owner_insights).

## Topic rules
- Physical tech from big brands, announced or launched in the last 24 h (phones, wearables, audio, laptops, glasses, cameras, consoles).
- Every number confirmed by 2 independent sources (primary/newsroom first). No leaks or rumours.
- Official press images only (newsroom media libraries, brand stores). Credit in caption.
- Never repeat the same product within 3 days, unless there's real news (price, ship date).

## Daily routine
1. Pick tomorrow's topics from the last 24 h of newsroom + trade press news.
2. Build fact sheet (2 sources each) → render with HTML + Playwright → check every slide against the brand rules.
3. Upload to vidIQ, create drafts with publishAt, show the owner one summary, publish on "post them".
4. Log in state/instagram_posts.json. Flag any post that would suit a trending track (owner adds it in the app).
