# Instagram content plan — Spec or Wreck (@viral_lab0 → @specorwreck)

Owner 2026-11-17 (updated for 18 Nov on): 2 image posts + 2 Reels on Short days; 3 image posts on long-video days (INSTAGRAM_POSTS.md).
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
4. Publish immediately with vidiq_social_post_publish (owner 2026-11-20: fully autonomous, never wait for an OK); notify the owner afterwards with the link.
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
  right after drafting (owner 2026-11-20: fully autonomous; the owner gave standing approval for every post).
  Poll vidiq_social_post_status every ~10 s; Instagram takes ~1–2 min; it returns postUrl.
- Caption pattern: hook line ≤125 chars ending "…but there's a catch. 👀" → "Spec or wreck? <question> 👇" → 3 bullets →
  "📤 Send this to …" → disclaimers ("News, not financial advice." for money) → Sources + Images credit → 4–5 hashtags.
- Never: black backgrounds, password/browser logins to Instagram (bot login, ban risk; owner offered — declined), music
  (API can't; suggest a track and the owner adds it in the app), Reels (script session cross-posts Shorts).
- Coordination: the script session (session_01L2u12EcPjN9Ak5KYWXRbbm) posts YouTube Shorts as Reels. Don't post Reels.
  When it relays "owner rules", confirm with the owner if they conflict with what the owner told this chat.
- Shell: removing globs after `cd` is blocked by a safety check; just overwrite outputs instead.
- Photos of people: never in the wide 900×580 card (faces get cut). Use `"portrait": true` on fact slides (tall card,
  top-anchored); hook slides are already tall. Check in preview.jpg that every head is fully visible (owner 2026-11-17).

## STORY FORMAT + MARKET CHECK (owner 2026-11-17: "1–2 words per slide is shit, we need to trend") — OVERRIDES the 1–3 word rule
Reference that works: @indiainlast24hr (5M followers) post Dfqzov4Ddj8, Jensen Huang affair story, 156K likes.
- Market check FIRST, every slot (free): Google Trends RSS `https://trends.google.com/trending/rss?geo=IN` and `geo=US`
  → which tech names people are searching NOW (e.g. "madison huang", "tesla model y price") + the web news of the hour.
  Pick the story with search heat AND a human/drama angle (people, money, scandal, "what this means for you").
  vidIQ research tools cost credits (balance 0, resets monthly): don't use them.
- Slides (template.js types): 1 `cover` = the WHOLE story as one ALL-CAPS sentence (8–16 words) with the key phrase in
  **highlight**, a one-sentence context line, big official photo, date badge. 2–4 `text` = a heading + 3–4 full-sentence
  lines (timeline / who's who / numbers / what to watch), with official photos in a strip. 5 `meme` = one witty line over an
  official photo (never film stills or other creators' memes). 6 `verdict` = question + "send this to…".
- Caption: 2–3 short paragraphs that tell the news properly (who, what, why it matters), neutral wording; "reported" for
  claims; then sources and image credit.

## TOPIC VARIETY (owner 2026-11-20: "why are you stuck on few news only, make your list vast") — OVERRIDES "hottest story"
- Each slot: build a list of 8–10 candidate stories from MANY sources, then pick. Sources to scan (latest first):
  Techmeme, The Verge, Engadget, TechCrunch, Ars Technica, Android Authority, GSMArena, 9to5Mac, 9to5Google,
  Gadgets 360, 91mobiles, Digit, Beebom (India), Electrek / InsideEVs (EVs), Space.com (space), Tom's Hardware
  (chips/PC), Rest of World (global), Google Trends IN + US.
- Rotate categories; never the same category two image posts in a row: phones · laptops/PC · AI apps & models ·
  chips · gaming · EVs & cars · space · social apps & creators · India tech (Jio, UPI, launches, startups) ·
  security & outages · wearables & audio · weird/fun gadgets · deals & prices.
- Never the same company or story within 3 days (all formats, Reels included), unless it is a NEW big event and the
  owner asks. Check state/instagram_posts.json before picking.
- Prefer stories other accounts are NOT all posting (GTA 6 launch Reel got 128 plays: crowded topic). Best so far:
  a surprising price / tiny-benefit or conflict angle on a less-covered product (Razer 1,573 plays, HomeView 1,045).

## FORMAT MIX (owner 2026-11-18: "one carousel with the hottest news, the rest single posts") — OVERRIDES "carousel every slot"
- Each day: the FIRST image slot (10:17 IST) = ONE carousel on the day's hottest story. Every other image slot
  (13:43, and 16:43 on Saturdays) = a SINGLE-image post. Reels come from the script session (2/day).
- Why (research 2026-11-18): for accounts under 10K followers, median reach per follower is Reels 4.9 %, single
  images 3.5 %, carousels 2.6 % (Fanpage Karma); Reels reach ~3x more non-followers than carousels. Carousels win on
  engagement per reach (Buffer: 6.9 % vs 4.4 % single image, 52M posts), so keep one a day for saves/shares.
  Our own data agrees so far: Reels reached 11–102 people, carousels 1 each (18 Nov insights).
- SINGLE-image post = template `cover` slide alone (headline sentence 8–16 words with the key phrase highlighted +
  one-line context + big official photo + date badge). The caption does the explaining (2–3 short paragraphs,
  like Indian news pages such as Newsworthy: punchy headline on the image, full story in the caption).
  Best for: one shocking number, a quote, a price, a CEO move, a launch date.
- CAROUSEL rules (vendor studies disagree on count; most land at 6–10): 6–8 slides.
  1 cover = hook with a curiosity gap + face/product photo + "swipe →" cue · 2 = second hook (Instagram re-shows
  slide 2 to people who skipped) with the strongest fact · 3–5 = one idea per slide, real numbers, photos ·
  6 = the catch / what it means for you · 7 = meme (optional) · last = question + "send this to…".
  Save-worthy angles: comparisons, timelines, "what you need to know", price ladders, checklists.
- Improvements to test (one at a time, judge after ~10 posts each): stronger cover hooks (number + face),
  "swipe →" cue on slide 1, faces over logos, reply to every comment within the hour, pin the best Reel,
  caption line "Follow for a tech verdict every day". Later test: a Reel version of the daily carousel.

## TESTING LOOP (owner 2026-11-17: "keep testing what works and what doesn't")
- Every post's log entry records its test variables: format (story/old), cover angle (drama / numbers / product),
  topic type (people, money, launch, policy), slide count, meme slide yes/no, slot time, caption length.
- First slot of each day (10:17 IST): pull `vidiq_instagram_owner_insights` mode media (free) → write views, reach, likes,
  comments, shares, saved per post into state/instagram_posts.json → compare per variable (shares+saves per reach first).
  Keep what wins, change ONE variable at a time on the next posts, and write the finding in a "Findings" list below.
- Baseline 2026-11-17 (new account): Oppo Reel reach 5 / 8 views; Anthropic numbers-style carousel reach 1. Tiny sample;
  the account needs consistent posting before differences mean anything (judge after ~10 posts per variant).

### Findings
- 2026-11-27 (media insights): ALL image posts and carousels 24–26 Nov have ~3 views / reach 2 each (BF carousel 3, Huawei single 4), while Reels from the same days got 121–1,440 views (Motorola Signature 1,440, Samsung 744, Fossil 570). Image posts are effectively not distributed; Reels are the only format reaching non-followers.
- 2026-11-26: Samsung 1,100Hz@720p Reel 740 plays/20 likes (spec-catch hook wins again); Surface $6k box 130, Motorola Neo 117 (7% watched, weak hook). Followers 61.
- 2026-11-23 (insights): Google Nest end-date Reel 1,256 plays, 28 likes, 3 shares, 5 saves, skip 44 % (2nd best ever). NVIDIA Rubin 490, Casio 292, Honor 119, Valve 190. Inferred: "you're losing something you own" / price-vs-benefit hooks beat pure-spec hooks. Followers 61.
- 2026-11-20 (insights): Razer carbon-mouse Reel = new best: 1,573 plays, 37 likes, 2 shares, 4 saves, skip 30.5 %. Asus mini PC 718 plays / 3 saves; HomeView now 1,045. GTA 6 Reel only 128 (skip 61 %) despite huge search heat: crowded topic, every account posted it. Inferred: a price-vs-tiny-benefit hook ("$90 more to save 2 grams") wins; avoid topics everyone covers on launch day. Followers 56 → 60.
- 2026-11-19 (insights): HomeView teardown Reel = breakout: 876 plays, 26 likes, 1 share, 1 save, 34.6 % watched, skip rate 46.9 % (vs Lenovo 73 %, Oppo 98 %). Measured. Inferred: a drama/conflict hook ("fought back when iFixit tried to open it") in the first line + 60 s length beat spec-list hooks; skip rate falls as the hook gets more human. Use conflict/drama hooks on covers too.
- 2026-11-18 (insights): Reels reach far more than carousels on this new account: Lenovo Reel reach 102 / 118 views / 2 likes; Oppo Reel reach 11; all 4 carousels reach 1 (views 1–5), 0 shares/saves anywhere. Measured, tiny sample. Carousels get almost no distribution yet; keep the story format but test stronger cover hooks, and lean on Reels for reach.
- 2026-11-17: 1–3 words per slide = owner rejected (no information). Story format (sentence cover + info slides + meme) is the baseline now.
