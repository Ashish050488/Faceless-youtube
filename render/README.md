# render/ — how a fresh chat builds a Spec or Wreck video (no memory needed)

Read CLAUDE.md → WORKFLOW.md → PRODUCTION_SPEC.md → this file → render/kit/README.md (cue schema). Nothing else.

## 0. Tools (once per container)
```
bash render/tools/setup.sh            # fonts → render/fonts, npm canvas, venv ../sow-venv, ESRGAN weights ../sow-models
export PY=$(realpath ../sow-venv)/bin/python
```
- Not in git (reinstalled by setup.sh): `render/fonts/*.ttf` (Inter Tight 700/800/900, Inter 600/700, from
  Fontsource) · `render/node_modules` · the Python venv (kokoro, faster-whisper small.en, rembg isnet, librosa,
  pyloudnorm, scipy, num2words, pymupdf, CPU torch) · RealESRGAN_x4plus.pth. HF models (Kokoro-82M, whisper small.en)
  download on first use to ~/.cache/huggingface; rembg weights to ~/.u2net.
- Never `pip install spandrel` or `torchvision`: they pull a torch that breaks Kokoro (fix: uninstall both).
- ffmpeg 6 and Chromium are in the container image.
- Watermarks are in git: `render/brand/watermark_on_{light,dark}.png` (same files as Drive brand_assets).
- Previous chats used a venv in the session scratchpad. If `$PY` is missing, run setup.sh; don't search for it.

## 1. Build order (one job per chat)
Work dir: `$W = <scratchpad>/<slug>`. Delete the previous video's work dir first (§8).
1. **Voice:** `render/kit/build.sh voice <slug> $W`.
   - Locked settings: Kokoro af_heart 0.795, gaps 0.30/0.42, pronunciations from config/.
   - Writes words.json, voice_seconds.txt and the watermarks.
2. **Assets:** put whole-product cut-outs in `$W/assets/` (see §2).
   - For a map, also run `render/tools/make_map.py`.
3. **Plan and composition:** write two files in scripts/<slug>/.
   - plan.json: named events tied to spoken words. Each event has cue, line, word, nth, offset and an optional sfx.
   - cues.kit.json: one scene per sentence. Layers come from the kit table, with times as `"@cue"` or word refs.
   - Copy the pattern of render/kit/examples/sow004.*.json. Never write renderer code per video. If an object is
     missing, add a small component file to render/kit/components/ and one line to DRAWERS in render.js.
4. **Code QA:** `render/kit/build.sh check <slug> $W` until PASS. It checks:
   - overlaps between text, products, 2-D objects and the watermark, and the 54 px side margin;
   - contrast;
   - every on-screen number against factsheet.md;
   - counter holds ≥ 1.2 s, headlines ≤ 4 s, and the number of cuts.
5. **Look once:** `render/kit/build.sh stills <slug> $W` makes ONE contact sheet, `$W/sheet.jpg`. Fix the cues and
   repeat steps 4–5. Only look at the scenes you changed.
6. **Video:** `render/kit/build.sh video <slug> $W`. It produces frames, room tone, the music bed and SFX, the mix,
   the native 1080×1920 export (CRF 19, §6), cover, thumbnail, captions, sha256 and check.txt.
   - Use `REUSE_FRAMES=1` to redo only the audio and export.
7. **Handoff:** write qa.md from check.txt plus measure_timing, then push the out/ files to `handoff/<slug>`
   (WORKFLOW.md). Send one message to the script session.

## 2. Images: sourcing tricks that worked
- **Search order:**
  1. The brand newsroom or press kit. Lenovo news.lenovo.com has `nb_*` press JPGs of 2000 px or more.
  2. The product page's own image CDN.
  3. Press articles that embed the brand's press images.
  4. PSREF / spec-sheet PDFs: render the pages with pymupdf at 3×, then cut out.
- **Blocked sites:** Gizmochina and VideoCardz return 403 to us. Some CDNs (e.g. cenyavto) need
  `-H "Referer: <article url>"`. Send a normal browser User-Agent; never send personal details.
- **Check image size before picking a topic.** Pick only products with at least 3 distinct whole, text-free shots of
  1200 px or more. The flashlight topic failed with about 600 px images.
- **Cut-outs:** `$PY render/tools/cutout.py in.jpg out.png --mode white|ai [--strip-lines]`.
  - It keeps only the largest component and trims to the product.
  - Studio shots on white: use `--mode white`. It is cleaner than the AI mode.
  - Press renders with callout lines: add `--strip-lines`.
  - Upscale sources under 1200 px first: `$PY render/tools/esrgan.py ../sow-models/RealESRGAN_x4plus.pth in out`.
- **What to show and what to skip:**
  - Never crop a cut-out or put a photo card that cuts the product; render.js refuses crops.
  - Never use images that contain text or infographics; use only product photos.
  - Never use other creators' images.
  - People only if they are public figures from official or press sources.
- **Maps:** `$PY render/tools/make_map.py ne110.geojson $W/assets/map_robinson.json --hl USA,EUROPE --pins USA,DEU`.
  The URL for the Natural Earth geojson is in the tool's docstring.

## 3. Lessons that only lived in chat (also in state/learnings.md)
- **Canvas full-circle bug:** `arc(-π/2 → 1.5π)` draws nothing in @napi-rs/canvas. End at `1.5π − 1e-4`.
- **Counters:**
  - Size the box from the larger of the start and final values, and clip only while rolling. Otherwise the digits
    clip and the unit jumps.
  - Start the roll early enough that the final value holds at least 1.2 s.
- **Word refs** match by prefix: "nine" also matches "ninety". Use nth, or a longer token.
- **Alignment:** faster-whisper splits "3,000" into "3" and ",000". align_words.py merges digit groups and expands
  numbers with num2words before aligning. Run it with no initial prompt.
- **Backgrounds:** light flat colours only (paper, cool, lav, blush, sand), never black. Show whole products, centred.
  1–3 words on screen, with each label next to its part.
- **Layout:** full frame, Techy-or-Not style. No safe-zone rules. The only placement rule is that nothing touches,
  and the watermark keeps its locked spot (x 880 right edge, y 1330 bottom, 64 px).
- **Light backgrounds read low on mean frame change** (sow004 scored 1.2 against a target of 2.5–6). check.py warns
  instead of failing; add motion on the beats if a scene feels static.
- **Drive connector:** each call accepts only about 3.1 MB per file, so handoffs go through git branches.
- **Branch deletion:** the git proxy blocks it (HTTP 403). The owner deletes handoff branches on GitHub.
