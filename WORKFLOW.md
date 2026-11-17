# Workflow (owner-defined 2026-11-16) — follow exactly

Goal of every decision: get the channel monetised (YPP) and keep it monetised. Re-read YouTube's own
monetisation guidance regularly (state/policy_notes.md) and follow it; nothing random, everything fact-checked.

1. **Script session** (this one)
   - Find the hottest physical-tech news from the last 1–12 h (RSS feeds of major tech sites, then web search).
   - Verify every fact with 2 independent sources (primary source when reachable). No unconfirmed leaks.
   - Pull real keywords via the YouTube API: tags of the top recent videos on the topic → title/tags/description.
   - Write factsheet.md, script.md, cues.json, metadata.json → commit to repo (scripts/<slug>/).
   - cues.json is a SHOT-BY-SHOT visual spec (owner 2026-11-17: "put in the script what to use"): for every spoken
     beat: exact anchor words, background colour, which real image (asset # + crop/scale/position), which 2-D object
     (shape, motion, data source), on-screen text (1–3 words), SFX, transition. The video session builds it, not invents it.
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
   QA with the watch-video skill before upload.
4. **Cleanup after a successful upload**
   - Delete the video file(s) from Drive (02_ready_to_upload/<slug>/). Keep the script folder in Drive.
   - Delete local copies of both the script and the video from this container (cache/scratchpad).
   - Keep only text state in the repo (videos.json, learnings.md).

## Video handoff (2026-11-17): Drive caps the video session's uploads at 3 MB and the script session can't pull
big files from Drive, so finished videos travel by git:
- Video session: export per PRODUCTION_SPEC §13 (720×1280, ≤ 20 MB), then force-push an ORPHAN branch
  `handoff/<slug>` containing only: video.mp4, thumbnail.jpg (1280×720), cover.jpg (1080×1920 frame), captions.srt,
  qa.md, sha256.txt. No code on that branch. Code still goes to main only.
- Script session: `git fetch origin handoff/<slug>`, verify sha256, QA with watch-video, upload to YouTube, then
  delete the remote branch (`git push origin --delete handoff/<slug>`) and local copies. Script stays in Drive.
- qa.md / small text can still go to Drive › 02_ready_to_upload › <slug>/ as before.

## Instagram (owner 2026-11-17)
- The Instagram session (session_01L2u12DRCGMHdb1CMdfRUan) owns ALL Instagram posting (image posts, carousels, collages,
  Reels) and plans its own daily mix (state/instagram_plan.md; brief in INSTAGRAM_POSTS.md).
- Script session: right after every successful YouTube publish, send the Instagram session one message with the
  YouTube link, title and a suggested caption (hook, "Spec or wreck? 👇", key facts, sources, image credit, 3–5
  hashtags) so it cross-posts the Short as a Reel. The script session never posts to Instagram itself.
