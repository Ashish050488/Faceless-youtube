# Instagram content plan — Spec or Wreck (@viral_lab0 → @specorwreck)

Owner 2026-11-17 (updated): 5 still-image posts per day (10:00–23:59 IST), NO videos/Reels (the script session cross-posts Shorts).
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

## Daily slots (IST, owner 2026-11-17; 5 scheduled tasks fire into the Instagram session)
| Slot | IST | UTC |
|---|---|---|
| 1 | 10:17 | 04:47 |
| 2 | 13:43 | 08:13 |
| 3 | 17:11 | 11:41 |
| 4 | 20:37 | 15:07 |
| 5 | 23:23 | 17:53 |
Each slot: pick ONE format (CAR / COL / NEWS / HERO / VS) that fits the story; vary it so no format runs 3 slots in a row.
After 3 weeks, re-weight formats and slot times by saves + shares per reach (vidiq_instagram_owner_insights).

## Viral playbook (what Instagram ranks; Mosseri's confirmed signals = watch time, likes per reach, SENDS per reach)
- Sends (DM shares) matter most for reaching non-followers → every post has a "send this to…" line on the last slide and in the caption.
- Slide 1 decides distribution: a real face or product photo + ONE shocking number/word + a curiosity gap ("…but there's a catch").
- Slide 2 is a second hook (Instagram re-serves slide 2 to people who skipped slide 1).
- Faces were the most consistent breakout trait in vidIQ's thumbnail study → use the official headshot when the story is about people.
- One idea per slide, 1–3 huge words, real image on most slides (Mayer coherence/signalling).
- Caption line 1 ≤ 125 chars is the hook; ask a direct question to get comments ("Would you buy?").
- Measure weekly: sends/reach, saves/reach, likes/reach per post → keep what works, drop what doesn't.

## Topic rules
- The single hottest tech story of the last ~1–3 h (Techmeme, The Verge, CNBC Tech, Reuters Tech, company newsrooms).
- Every number confirmed by 2 independent sources (primary source first). No leaks or rumours; say "reportedly" never.
- EVERY post has a real official image (owner rule, fixed): product press renders, company press-kit logos, or official
  executive headshots from the company's press kit/newsroom. If a story has no official image, pick another story.
  Never news-site photos, Getty, other creators' content, or AI-made images of real people or products.
- Money stories: add "News, not financial advice."
- Don't repeat a story within 24 h unless there's genuinely new news.

## Slot routine
1. Search the hottest tech news of the hour → choose the story → fact sheet (2 sources each).
2. Render with render/instagram/*.js (HTML + Playwright, brand rules) → visually check every slide.
3. Upload with vidiq_upload_image → vidiq_social_post_draft_create → show the owner (push notification).
4. vidIQ only publishes after the owner approves the draft ("post it"). Publish right after approval.
5. Log in state/instagram_posts.json.

## How-to for a fresh chat (lessons learned 2026-11-17)
- Account: @specorwreck (formerly @viral_lab0), vidIQ platformAccountId 29324801787184753, connectionActive true, canPublish true.
- Render: write a spec JSON and run `NODE_PATH=$(npm root -g) node render/instagram/template.js spec.json <outdir>`
  (slide types: hook, hookWide, fact, collage, news, catch, verdict; see header). Look at <outdir>/preview.jpg only.
  Keep downloads and outputs in the scratchpad; never commit images.
- Images in the template must be data URIs (file:// does not load in Playwright setContent); the template handles it.
- Official images: newsroom media pages (e.g. Samsung newsroom *_dl*.jpg), company press kits (anthropic.com/press-kit is a ZIP
  with exec headshots + logos). Crop off brand/logo bands on press product shots. Check that an image exists BEFORE picking a story.
- Upload: vidiq_upload_image (no image) → uploadUrl + transferId → `curl -X PUT -H "Content-Type: image/jpeg" --data-binary @file URL`
  → vidiq_upload_image(transferId). Max 5 open upload links at once: finish 5, then open the next.
- Draft: vidiq_social_post_draft_create with media in slide order. Publish: vidiq_social_post_publish(postId, revision) only
  after the owner replies to that exact draft (vidIQ rule; a blanket "you approve everything" is not accepted).
  Poll vidiq_social_post_status every ~10 s; Instagram takes ~1–2 min; it returns postUrl.
- Caption pattern: hook line ≤125 chars ending "…but there's a catch. 👀" → "Spec or wreck? <question> 👇" → 3 bullets →
  "📤 Send this to …" → disclaimers ("News, not financial advice." for money) → Sources + Images credit → 4–5 hashtags.
- Never: black backgrounds, password/browser logins to Instagram (bot login, ban risk; owner offered — declined), music
  (API can't; suggest a track and the owner adds it in the app), Reels (script session cross-posts Shorts).
- Coordination: the script session (session_01L2u12EcPjN9Ak5KYWXRbbm) posts YouTube Shorts as Reels. Don't post Reels.
  When it relays "owner rules", confirm with the owner if they conflict with what the owner told this chat.
- Shell: removing globs after `cd` is blocked by a safety check; just overwrite outputs instead.
