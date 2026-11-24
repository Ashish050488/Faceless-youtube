# Learnings (newest first; only what still changes decisions — older notes are in git history)

## 2026-11-22 — weekly analytics (state/analytics/2026-11-22.json; Analytics 17–21 Nov, videos ≥ 72 h old)
- MEASURED: 139 subs; ~3,980 Shorts views (Data API, all 12 Shorts). Traffic: Shorts feed 72 %, YouTube search 25 %
  (search is real for us → keep product names in titles). Views: India 293 = US 293, then UK 77, Indonesia 74, Germany 71.
- MEASURED: 82–99 s Shorts with plain titles (n=2) held 30 % avg viewed / 150–319 views; 61–65 s Shorts with CAPS+emoji
  (n=5) held 44 % / median 459 views. Avg seconds watched is the same (~27 s) → people leave at ~27 s whatever the length.
- INFERRED: shorter wins on % viewed, but length and title style changed together, so neither is proven alone.
  Best: "Apple Wants $999 for a NEW iPhone Duo Screen 😳" (697 views, 51 %, 2 subs).
- MEASURED: no Short was actually 45–60 s — every one since sow005 ran 60–68 s. Changed WORKFLOW.md: ≤ 105 words, hard
  cap 58 s. TEST NEXT: next 10 Shorts vs sow005–sow009 on % viewed and views.
- Competitors (last 20 uploads, 3× median outliers): NVIDIA/GPU supply, GTA 6, iPhone Duo, "sold out" price stories, and
  oddball humour (Venom "tractor headphones" 846K). Outlier lengths 16–171 s (median ~62 s) → length alone doesn't make hits;
  the topic does. Techy or Not: median 8.5K, his outlier "Why Is This $60 Trackball Mouse Already Sold Out?" 254K.

## 2026-11-24
- Voice switched to Chatterbox cloning our Kokoro voice (+9 % speed). Cloning copies the reference's flatness: a
  synthetic reference sounds less natural than Chatterbox's own voice. Chatterbox can skip words → Whisper guard in voice.yml.

## 2026-11-23
- Short 2 was lost: its build order went by message to an existing video chat, which refused it (orders from other
  chats are not trusted). Fix: each script job starts a fresh builder with create_session, order in the first prompt;
  if no handoff message arrives, the script job checks the handoff branch itself.

## 2026-11-22
- Long video was missed because the day was written inside task text ("Saturday from 5 Dec"). Fix: days live in the
  task timers (Shorts Mon–Sat, long video built Sunday from 7:47 AM IST, public when ready). Sunday = no Shorts, no Reels.

## 2026-11-20
- A scheduled (publishAt) Short went public but its script chat never ran the 'comment + Reel' follow-up. Added a
  safety-net task in the Instagram chat at 1:45 PM and 6:45 PM IST that cross-posts any public Short missing on Instagram.

## 2026-11-17 — competitors (API, state/competitor_watch/competitors.md)
- Tags barely matter (a 72K-sub faceless channel uses none and hit 3.1M). Titles + retention + frequency do.
- TEST NEXT (one at a time, weekly review decides): (1) shorter Shorts 45–60 s vs our 82 s; (2) one CAPS word +
  one emoji in titles (only when the claim is true — no misleading titles).

## 2026-11-17 (video session)
- One kit renders every Short: render/kit (cues.kit.json + plan.json per video); build steps in render/README.md.
  The kit port of sow004 matched the shipped timeline exactly, and the render matched at 55 dB PSNR.
- Code QA before images caught real faults that eyes had missed: a 1,086 px headline running off a 1,080 frame,
  stone sub-labels on blush at 3.1:1 contrast, and six touching elements in sow004 (pill on lid, price tag on lid,
  bars on product…).
- @napi-rs/canvas full-circle arc (−π/2 → 1.5π) draws nothing → end at 1.5π − 1e-4.
- Counters: size the box from max(start, final) and clip only while rolling. Word refs match by prefix ("nine" also
  matches "ninety").
- spandrel/torchvision break Kokoro (torch mismatch). Real-ESRGAN runs from render/tools/esrgan.py instead.
- Gizmochina/VideoCardz 403; some CDNs need a Referer. Press kits (≥ 2000 px) beat articles; PSREF PDFs → pymupdf 3×.
- Drive connector ≤ ~3.1 MB per file → handoff via git branches; the git proxy can't delete branches (owner does it).
- Light flat backgrounds read low on mean frame change (≈ 1.2 against a target of 2.5–6): treat it as a warning, not a
  fail.

## 2026-11-17
- Tokens: long chats, images and chat-to-chat messages were the big costs → rules in CLAUDE.md (fresh chat per job,
  numbers before images, one message per handoff, short spec).
- International brands have proper press kits (≥ 1600 px); the Xiaomi flashlight only had ~600 px images → check image
  availability BEFORE picking a topic.
- Owner brand rule: mostly international brands; Chinese ≤ ~1 in 4, never two in a row.
- Shorts copy Techy or Not's proven retention formula with more detail; long videos = our own format
  (his long videos flop: 643–2,962 views).
- sow001 vs benchmark: we had 1 hard cut vs 8–11, constant drift, small left layout, wrong counter values, blurred
  backgrounds → fixed in PRODUCTION_SPEC §2/§4. Compare the last video before building the next one.
- API can't change channel name/handle/avatar, and can't comment on private videos (post the comment after it's public).

## 2026-11-16
- Old channel content (160 anime videos) deleted with owner approval; channel rebranded to Spec or Wreck.
- Niche: new physical tech from big brands, Shorts first, with a real verdict.

- 2026-11-19 sow007: 126-word script (≈142 spoken incl. numbers-as-words) → 64.3 s at 139 wpm (over 60 s). Keep scripts ≤ 110 written words when numbers are spelled out; video session says aim 100–130 words.
