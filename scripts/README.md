# scripts/ — one folder per video (the "package")

Folder name (slug): `sowNNN-brand-product`, NNN = next number in state/videos.json (e.g. `sow009-sony-wh1000xm7`).
Best example to copy: `sow008-razer-carbon-fiber-mice/`.

| File | Written by | Contents |
|---|---|---|
| `factsheet.md` | script chat | every fact + 2 sources (table), what was left out and why, `## VERDICT` score table (VERDICT.md) |
| `script.md` | script chat | the spoken words only (100–130 words for a Short), numbers written as spoken |
| `cues.json` | script chat | shot-by-shot: words, background, image/clip, 2-D object (from render/kit/OBJECTS.md), on-screen text, SFX |
| `metadata.json` | script chat | title (≤ 60), description, tags (~15–21, ≤ 500 chars), categoryId 28, languages, madeForKids false, containsSyntheticMedia, pinned_comment, playlist, format, hypothesis |
| `assets_sources.md` / `shotlist.md` | script chat | image/clip URLs (official, ≥ 1600 px) |
| `plan.json`, `cues.kit.json` | video chat | timing + layers for the render kit |

Before pushing: `python -m meta.check_package <slug>` must print PASS.
After the video is published and first stats are checked, the folder can be deleted (git history keeps it).
