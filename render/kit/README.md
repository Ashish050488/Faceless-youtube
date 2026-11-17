# render/kit — one renderer for every Short (PRODUCTION_SPEC §8)

Each new video = `scripts/<slug>/cues.kit.json` + assets. Do not write per-video renderer code.
If a scene needs a new object, add it once to `core.js` plus one line in the `DRAWERS` table in `render.js`.

## Work dir
```
<work>/words.json          meta/align_words.py output (w, start, end, line)
<work>/voice_seconds.txt   final voice length (s)
<work>/assets/*.png        whole-product cut-outs (no crops); map_robinson.json for map scenes
<work>/wm_light.png wm_dark.png
```

## Commands
Normally run through `render/kit/build.sh voice|check|stills|video <slug> <work>` (see render/README.md). Raw:
```
node render/kit/plan.js <work>/words.json plan.json cues.json          # cues script: event → second (render.js does this too)
node render/kit/render.js <work> cues.kit.json --check                 # OverlapCheck/contrast → check.json (+ timeline/sfx/events/counters/cues)
python render/kit/check.py <work> scripts/<slug>/factsheet.md [video]  # PASS/FAIL summary
node render/kit/render.js <work> cues.kit.json --stills cues           # 3 stills per scene → ONE contact sheet
node render/kit/render.js <work> cues.kit.json                         # frames.mp4 (1080×1920, 30 fps, silent)
node render/kit/thumb.js <work> cues.kit.json thumbnail.jpg
```
**OverlapCheck.** Every visible layer is drawn alone at ¼ scale, and the opaque cells of each pair are compared,
watermark included.
- Not counted: soft shadows and glows (alpha ≤ 128).
- Exempt: a layer attached to its product with `of` / `under`, and any layer marked `"overlap": true`. Use that only
  for deliberate stacking, e.g. a number inside its clock ring.
- No safe-zone rules (owner 2026-11-17): full-frame layout, also for Instagram.

**check.py fails on:**
- any overlap, or any element closer than 54 px to the left/right edge (side margin; labels and headlines shrink to
  fit automatically);
- contrast below 3 (text ≥ 60 px) or below 4.5 (smaller text);
- an on-screen number missing from factsheet.md (a rounded decimal display passes: "27 h" for 27.08);
- a counter hold under 1.2 s, or a headline on screen over 4 s;
- hard cuts outside 8–12.5 per 75 s;
- with a video: loudness outside −15 ± 1.5 LUFS, true peak above −1 dBTP, size ≥ 20 MB.

It warns (does not fail) on mean frame change outside 2.5–6 or a calm hold over 2.5 s.

**Components** live in `components/` (one file per group, 1–8 KB each): motion, product, text, objects, health,
measure, map, screen. core.js loads them in that order.

## cues.kit.json
```json
{ "slug": "...", "plan": "plan.json",            // events tied to words (path relative to this file)
  "screen": [[u,v]x4],                           // optional: screen quad of the hero cut-out (fractions)
  "thumb": {"img","bg","big","word","tag","w"},
  "palette": {"name": "#hex"},                   // optional extra backgrounds
  "scenes": [ { "line": 3, "from": "under", "xfade": true, "bg": "cool", "real": true,
                "shake": 0.32, "sfx": [{"at": t, "kind": "whoosh", "gain": 0.4}], "layers": [ ... ] },
              { "endcard": true, "bg": "paper", "layers": [{"type": "wordmark", "y": 900, "snapAt": 0.7}] } ] }
```
- A scene starts at the first word of script line `line`, or at word `from` inside that line. It ends where the
  next scene starts. Scene 0 starts at 0. The end card starts 0.3 s after the last word. The last 0.35 s loops
  back to frame 1.
- `bg`: paper · cool · lav · blush · sand, or a hex value. Never black.
- **Time refs** (`at`, `until`, `show`, `hide`, `flipAt`, `snapAt`, pins, …) are measured from the scene start
  and can be written as:
  - `"@cue"` or `["@cue", 0, offset]`: an event from plan.json (preferred, because the same event drives its SFX);
  - a number of seconds;
  - `"word"`: the next match from the scene's first word;
  - `["word", nth, offset]`: e.g. `["twenty", 0, -0.2]`.
- **Common layer keys:** `show` / `hide` set the window the layer is visible in. `sfx: false` mutes the layer's
  default SFX. `overlap: true` exempts the layer from OverlapCheck. `id` names a product so other layers can attach to it with `of` / `under`.

| type | keys |
|---|---|
| product | img, x, y (centre), w, seed, push, shadow, ltOffset, alpha, fade{at,to}, dim{at,to}, move{at,dur,x,y,w}, id |
| headline | text, at, until, y=300, col, acc[], strike (StrikeThrough at time) |
| number | value, from=0, at, until, unit, prefix, comma, dec, x, y, px, col (RollingNumber ≤ 0.35 s) |
| label | text, x, y, px, col=ember, at, align |
| priceTag | x, y, text, at |
| callout | of+u,v (or x,y), r, at, col (CalloutRing) |
| calipers / calipersV | xL, xR, y, label / of, u, label (thickness clamp) |
| scale / dialScale | x, y, at, levelAt / under or top, w, value, kg |
| battery | x, y, scale, segs, max, at, drainTo, drainAt |
| sun | x, y, r, at, grow or growAt{at,from,to} |
| map | x, y, w, at, pins[] (MapPin, real Natural Earth data) |
| bars | base, h, items[{value, label, sub, col, at}] (heights to scale) |
| stamp | text="THE CATCH", y, at, col=wreck, px (CatchStamp + flash) |
| wordmark | y, px, snapAt (EndCardLogo; the k snaps upright for SPEC) |
| clock, hourglass, toggle, ecg, waterDrop, waves, pulseFlame, zoneBar, calendar, slider, pill | see `DRAWERS` in render.js |
| loupe, motionLines, screenDim, playIcon | of (a product id); the screen layers use `screen` |

- **Watermark:** added automatically on every scene except the end card. Right edge x 880, bottom y 1330,
  64 px tall, 90 % opacity; dark or light version picked from the background.
- **SFX:** generated automatically: one default per component, cuts, crossfade moves, the loop cut, and every
  plan event's `sfx`. Add more per scene with `sfx`.
- **Worked example:** `examples/sow004.cues.json` plus `examples/sow004.plan.json` is sow004 re-laid out so that
  nothing touches. It passes `check.py`.
