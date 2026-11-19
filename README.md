# Spec or Wreck — repo map

Faceless tech channel: YouTube Shorts (+ weekly long video) and Instagram. Start with **CLAUDE.md** (rules), then
the one file for your job. Code and text only: no videos, audio or images are committed (they go to handoff branches).

| Folder / file | What's in it | Who uses it |
|---|---|---|
| `CLAUDE.md` | Hard rules + token rules (auto-loaded) | every chat |
| `WORKFLOW.md` | Step-by-step pipeline, handoffs, voice on GitHub Actions | script + video chats |
| `PRODUCTION_SPEC.md` | How a video must look and sound (layout, text sizes, margins, objects, clips, export) | video chat |
| `SCRIPT_STYLE.md` | How scripts must sound: conversational, emotional, TTS-friendly (research-based) | script chats |
| `VERDICT.md` | The 100-point SPEC/WRECK score + sensitive-topic rules | script chats |
| `INSTAGRAM_POSTS.md` | Instagram brief (posts, Reels, growth loop) | Instagram chat |
| `scripts/<slug>/` | One folder per video: factsheet, script, shot-by-shot cues, metadata, plan/cues.kit | script → video |
| `render/` | Video building. `render/README.md` = how to build a video step by step | video chat |
| `render/kit/` | The renderer: `render.js` (DRAWERS table), `core.js`, `check.py` (overlap/margin/number checks), `build.sh` | video chat |
| `render/kit/components/` | **Reusable 2-D object library** — see `render/kit/OBJECTS.md` before drawing anything | video chat |
| `render/kit/examples/` | A full example video (plan + cues) to copy | video chat |
| `render/tools/` | `setup.sh` (installs everything), cut-outs, upscaling, maps | video chat |
| `render/brand/` | Watermark files | video chat |
| `render/instagram/` | Instagram slide template | Instagram chat |
| `audio/` | Voice (`narrate.py`, locked), music beds, mix (`mix.sh`), timing check; `voice-versions.txt` | video chat / Actions |
| `.github/workflows/voice.yml` | Makes the voice on GitHub Actions when a script is pushed → `handoff/<slug>-voice` | automatic |
| `meta/` | Word timing alignment, captions | video chat |
| `yt/` | YouTube API: login, upload/publish, stats | script chats |
| `config/` | Channel settings, pronunciations, upload defaults | all |
| `state/` | Live state: `videos.json`, `schedule.md`, `sessions.md` (which chat is which), learnings, analytics, brand, competitors, Instagram log | all |
| `.claude/settings.json` | Tool permissions so chats run without prompts | all |

Branches: `main` (code + text only) · `handoff/<slug>` (finished video) · `handoff/<slug>-voice` (voice from Actions).

## Common commands
| Task | Command |
|---|---|
| Check a script package | `python -m meta.check_package <slug>` |
| Voice (normally automatic on push) | GitHub Actions `voice` workflow → `handoff/<slug>-voice` |
| Build a video | `render/kit/build.sh check|stills|video <slug> <work>` (render/README.md) |
| Publish | `python -m yt.publish <slug> <dir> --publish-at <UTC>` (yt/README.md) |
| Install video tools | `bash render/tools/setup.sh` |
