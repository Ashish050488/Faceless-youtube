# Learnings (newest first; only what still changes decisions — older notes are in git history)

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
