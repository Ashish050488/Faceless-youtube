# Spec or Wreck — rules for every session (auto-loaded; keep this file short)

## Hard rules (owner brief)
- Separate from Layer3Studios: never read, change or mention its repos, Drive folders or channel.
- Never print or commit keys (env vars YT_*; secrets/ is gitignored). Commit to main only; no new branches
  (exception: video handoff branches `handoff/<slug>`, see WORKFLOW.md).
- No made-up facts, quotes, prices or stats; 2 sources for everything; when unsure, leave it out.
- No other creators' footage, scripts, thumbnails, music or catchphrases. No misleading titles/tags/thumbnails.
- Free tools only.

## Token rules (owner 2026-11-17: "save tokens")
1. One job per chat. When a video/post batch is done, the chat ends; next job = fresh chat (`/clear`). State lives in
   the repo, not in chat history.
2. Read only what the job needs: CLAUDE.md → WORKFLOW.md → PRODUCTION_SPEC.md (video) or INSTAGRAM_POSTS.md (IG) →
   the one scripts/<slug>/ folder. Don't re-read files already read in this chat. Use `grep`/`sed -n` for one section.
3. Numbers before images. Measure with scripts (ffprobe, frame-diff, measure_timing) and print short summaries.
   Look at images only as ONE tiled contact sheet (small tiles), never frame-by-frame or one image per still.
4. Quiet tools: pipe long output through `tail`/`grep`; ffmpeg with `-v error`; git with `-q`.
5. One message per handoff between chats (what, where, what to do). No chatter, no confirmations back and forth.
6. Web: search only for the day's topic and its 2 sources; fetch the page section needed, not whole sites.
7. Re-render only the scenes that failed QA, not the whole video.
8. Model: keep Opus for everything, including building videos (owner 2026-11-17: Sonnet videos were worse).
9. Script session: write script + metadata (fact-checked, trending tags) and upload. Never review the video unless the
   owner reports a problem — the video session owns quality.
10. Reuse objects: check render/kit/OBJECTS.md before drawing any 2-D object; every new object goes into the library
    (naming + index rules there) so no chat draws it twice. Repo map: README.md.
11. Delete what's no longer used (old scripts, raw data, superseded rules) — git history keeps it.

## Where things are
WORKFLOW.md (steps, schedule link) · PRODUCTION_SPEC.md (video rules) · state/brand.md (palette, logo, watermark) ·
INSTAGRAM_POSTS.md (IG images) · VERDICT.md (spec/wreck score) · state/schedule.md · state/videos.json · state/learnings.md · config/ (voice, pronunciations).
