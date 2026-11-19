# Workflow (owner-defined 2026-11-16) — follow exactly

Goal of every decision: get the channel monetised (YPP) and keep it monetised. Re-read YouTube's own
monetisation guidance regularly (state/policy_notes.md) and follow it; nothing random, everything fact-checked.

1. **Script session** (this one)
   - Find the hottest physical-tech news from the last 1–12 h (RSS feeds of major tech sites, then web search).
   - BRAND RULE (owner 2026-11-17): INTERNATIONAL brands sold worldwide (Apple, Samsung, Google, Sony, HP, Dell,
     Lenovo, Microsoft, Logitech, Bose, Amazon, Meta, Nothing, Garmin, DJI, GoPro, Razer, Anker, Sonos, Nintendo,
     Xbox, Canon, Fujifilm…). Must be available (or officially coming) in the US/EU/India.
     MIX (owner clarification): mostly international brands; Chinese brands (Xiaomi, Huawei, Oppo…) are fine
     sometimes — at most ~1 in 4 videos, never two in a row, and prefer ones launching globally.
   - Check real official images exist (press kit/store, ≥ 1600 px, whole product) before choosing the topic.
   - Verify every fact with 2 independent sources (primary source when reachable). No unconfirmed leaks.
   - VERDICT: score the product with VERDICT.md (6 criteria, 100 points, ≥ 55 = SPEC); put the table in factsheet.md;
     the script gives the reason and the end card shows the score. Sensitive topics: follow VERDICT.md (skip / no verdict).
   - Pull real keywords via the YouTube API: tags of the top recent videos on the topic → title/tags/description.
     Metadata pattern (measured on Techy or Not's top Shorts via the API, 2026-11-17):
     - Tags: ~15–21 tags, ~300 chars. Order: brand → model → full product name → name variants/misspellings →
       category phrases people search ("wired earbuds", "keyboard PC") → "<brand> 2026"/"new <product>" → 3–4 generic
       (tech news, new tech, gadgets) → "Spec or Wreck" last. No channel-wide keyword list needed (benchmark has none).
     - Description: hook line → 1–2 short paragraphs (what it is, the twist, price) → "Sources:" with names + links →
       credits → 6–8 hashtags at the end (#Brand #Model #Category #Tech #SpecOrWreck), first 3 = most searchable.
     - Title: brand + "Just Made/Made" + surprising number or twist (his top 12 all follow this). Add ONE CAPS word
       and ONE emoji when it fits (competitor hits: "NVIDIA Built a Supercomputer With NO Wires?! 🤯"). The claim must be
       true and shown in the video — never misleading. ≤ 60 characters.
     - Length: Shorts 45–60 s (100–130 words). Topic priority when news allows: NVIDIA/GPUs, Apple, AI hardware/robots,
       "world's biggest/smallest/first", price shocks — all from big brands. Competitor data: state/competitor_watch/competitors.md.
   - Write factsheet.md, script.md, cues.json, metadata.json → `python -m meta.check_package <slug>` must PASS →
     commit to repo (scripts/<slug>/). Package contract: scripts/README.md.
   - cues.json is a SHOT-BY-SHOT visual spec (owner 2026-11-17: "put in the script what to use"): for every spoken
     beat: exact anchor words, background colour, which real image (asset # + crop/scale/position), which 2-D object
     (shape, motion, data source), on-screen text (1–3 words), SFX, transition. The video session builds it, not invents it.
     Per PRODUCTION_SPEC §1/§3 (owner 2026-11-18): a detailed 2-D object in every shot, every number shown (≥ 5 per Short),
     and official product-page clips (≤ 3 s each, ≤ 20 % total, muted) listed with their exact page/file URL when the
     brand's page has them.
   - Check pronunciation of every brand/term (print phonemes); extend config/pronunciations.json.
   - Upload the package to Drive: Faceless Channel/01_scripts/<slug>/ (scripts stay in Drive permanently).
   - Write shotlist.md: (A) real images/clips the script session found itself (direct URLs from page code),
     (B) a "PLEASE GET" list for the owner — anything blocked for automation (Kickstarter, logins, bot checks),
     with exact file names. Owner drops those into Drive › 01_scripts › <slug> › assets/.
   - Message the video chat with the slug (it starts with A and adds B when it arrives).
2. **Video session**
   - Sources real visuals itself (official press/campaign images, product pages; own motion graphics).
     No clips from YouTube/social/brand promo videos (reused-content policy, channel-wide penalty).
   - Natural voice, music, render per state/brand.md. Uploads video.mp4 (+ thumbnail, captions.srt, qa.md)
     to Drive: 02_ready_to_upload/<slug>/, then messages the script session.
3. **Script session** uploads to YouTube with the metadata (title, description, tags, category, language,
   captions, playlist, pinned question, not-made-for-kids, synthetic-media flag when needed).
   No video QA (owner 2026-11-17): verify sha256 and upload. Only re-check if the owner reports a problem.
4. **Cleanup after a successful upload**
   - Delete the video file(s) from Drive (02_ready_to_upload/<slug>/). Keep the script folder in Drive.
   - Delete local copies of both the script and the video from this container (cache/scratchpad).
   - Keep only text state in the repo (videos.json, learnings.md).

## Video handoff (2026-11-17): Drive caps the video session's uploads at 3 MB and the script session can't pull
big files from Drive, so finished videos travel by git:
- Video session: export per PRODUCTION_SPEC §6 (1080×1920, ≤ 20 MB), then force-push an ORPHAN branch
  `handoff/<slug>` containing only: video.mp4, thumbnail.jpg (1280×720), cover.jpg (1080×1920 frame), captions.srt,
  qa.md, sha256.txt. No code on that branch. Code still goes to main only.
- Script session: `git fetch origin handoff/<slug>`, verify sha256, upload to YouTube, then
  delete the remote branch (`git push origin --delete handoff/<slug>`) and local copies. Script stays in Drive.
- qa.md / small text can still go to Drive › 02_ready_to_upload › <slug>/ as before.

## Voice on GitHub Actions (owner 2026-11-18)
- Every push of scripts/<slug>/script.md to main runs .github/workflows/voice.yml (free on public repos, Python 3.11,
  cached models) → branch handoff/<slug>-voice. The video session fetches it instead of running Kokoro itself.
- After the video is published, delete handoff/<slug>-voice too (owner deletes branches on GitHub).

## Instagram (owner 2026-11-17)
- Reels: the daily script run is a fresh chat without vidIQ, so after the YouTube video is public it sends the
  Instagram session ONE message (link + caption); the Instagram session posts the Reel (vidiq_instagram_publish_reel,
  AI label on, no approval step needed).
- Instagram session (session_01L2u12DRCGMHdb1CMdfRUan): still-image posts only, 1–2 a day (INSTAGRAM_POSTS.md).

## Cleanup of the repo (token rule)
- After a video is published and its first stats check is done, delete scripts/<slug>/ and its keyword JSON from the
  repo (the script stays in Drive › 01_scripts; the record stays in state/videos.json).
