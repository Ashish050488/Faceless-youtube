# 2-D object library — reuse before you draw (owner 2026-11-19)

Every object is drawn once, saved here, and reused by every future video. Before adding an object, search this file.

## Naming convention
- Object (drawer) names: lowerCamelCase noun, singular, what it IS not what it means: `ramStick`, `chipDie`, `fan`,
  `usbPort`, `ruler` (not `memoryIcon`, `fastThing`).
- One file per category in `components/` (below). New category only when none fits: `components/<category>.js`.
- Register every object in `DRAWERS` in `render.js` with the same name, and add ONE row to the table below
  (name · file · what it shows · animate params · use for). Commit the code (no preview images in git).
- Params: `x, y, size` (centre + height in px at 1080×1920), `color`/`fill` from palette tokens, `t` progress 0–1
  for the animated meaning (fill level, needle angle, slide position).

## Categories → files
| File | Category |
|---|---|
| `objects.js` | everyday measures: sun (brightness), priceTag, calipers, scale, waterDrop, waves |
| `measure.js` | dials and charts: dialScale, clockRing, bars, calendar, slider |
| `health.js` | battery, toggle, ecg (pulse), globe, hourglass, pulseFlame, zoneBar, colourDots |
| `repair.js` | internals/repair: connector, speaker, cable, usbc, lockScrews |
| `screen.js` | displays: screenPath, motionLines, screenDim, playIcon, loupe |
| `map.js` | worldMap (Natural Earth) |
| `product.js` | product cut-out + shadows |
| `text.js` | label, headline, counter, bigWord, stamp, wordmark, pill |
| `motion.js` | easing/spring helpers (not objects) |
| `compute.js` | chips and PC parts: chipDie, ramStick, fan, ssd, miniPc, consoleTower coreGrid, gpuCard |
| `ui.js` | interface pieces: speechBubble, appTile |
| `emotion.js` | poster/scene emotion objects: crossMark, questionStamp, arrowPointer |
| `media.js` | discs, game cases, downloads: disc, gameCase, dvdStack, downloadBar |
| `ports.js` (add) | usbPort (A/C), audioJack, ethernetPort, hdmiPort |

## Index (one row per object — keep it updated)
| Name | File | Shows | Animate (`t`) | Use for |
|---|---|---|---|---|
| sun | objects.js | sun with rays | rays grow | brightness, nits |
| priceTag | objects.js | tag with string + hole | swings, value rolls | price |
| calipers | objects.js | calipers with scale | jaw slides | thickness, mm |
| scale | objects.js | balance scale (`weight` = text on the weight, default "25"; "" for none; `s` = size) | tips, levels at `levelAt` | weight, g/kg, "X for Y" trade-offs |
| waterDrop | objects.js | drop + ripples | ripples | water rating |
| waves | objects.js | sound waves | bars move | audio |
| dialScale | measure.js | dial | needle | speed, %, scores |
| clockRing | measure.js | clock ring | sweeps | hours, battery life |
| bars | measure.js | bar chart to scale | bars rise | comparisons |
| calendar | measure.js | calendar page | flips | dates |
| slider | measure.js | slider | knob slides | ranges |
| battery | health.js | battery with cells + % ticks | fills | battery, Wh |
| toggle | health.js | switch | flips | on/off features |
| ecg | health.js | pulse line | draws | heart rate, health |
| globe | health.js | simple globe | spins | worldwide |
| hourglass | health.js | hourglass | sand falls | waiting, delays |
| connector / speaker / cable / usbc / lockScrews | repair.js | internals | enter/pop | teardowns, repair |
| screenPath / motionLines / screenDim / playIcon / loupe | screen.js | screen parts | — | displays, zoom |
| worldMap | map.js | real map, country filled, pin | pin drops | launch regions |
| counter / headline / bigWord / stamp / pill / label / wordmark | text.js | text elements | roll / reveal | numbers, words |
| chipDie | compute.js | CPU package with pins, die cells | cells fill one by one (`fillAt`); `mode: "gpu"` = dense core field | cores, chips, NPU |
| ramStick | compute.js | RAM sticks (PCB, chips, gold contacts) | `n` sticks drop in and stack | memory, GB |
| fan | compute.js | square fan, 7 blades | spins up | cooling, watts, noise |
| miniPc | compute.js | generic unbranded mini PC box | pops in | rival product without its image |
| usbPort / audioJack | ports.js | USB-A socket / 3.5 mm jack on a panel | red cross draws on at `crossAt` | missing ports |
| ruler | measure.js | ruler with cm ticks (`n`, major every 5) | slides up | size, cm |
| gauge | measure.js | semicircle dial, 21 ticks | needle sweeps to `value`/`max`; optional red `mark` | watts, scores, % |
| thermometer | measure.js | bulb + tube | liquid settles at `level` 0–1 | temperature, runs cool/hot |
| reviewCard | objects.js | review page with lines | tick draws on at `tickAt` | "reviews say", tests |
| slash | objects.js | red strike line | draws on | price cut, old value |
| consoleTower | compute.js | generic unbranded games console (tower + stand), `dark` variant | pops in, power light turns on | consoles, platforms |
| disc | media.js | optical disc with sheen + hub | pops in, sheen turns | discs, physical media |
| gameCase | media.js | game case with `cover` image (asset name) | opens at `openAt` → blank code slip + EMPTY hub | "no disc in the box", physical vs digital |
| dvdStack | media.js | side-view stack of `n` discs | discs drop and stack | storage size as DVDs (4.7 GB each) |
| downloadBar | media.js | arrow badge + progress track, 10 % ticks | fills to `to` (0–1) from `fillAt` | download size, install, progress |
| ssd | compute.js | M.2 2280 SSD (PCB, controller + flash chips, gold pins, notch) | slides in from the right | storage, TB/GB models |
| crossMark | emotion.js | thick red ✕ with ink outline | slams in at `at` | "no X", missing feature (poster emotion `x`) |
| questionStamp | emotion.js | round marigold "?" stamp | slams + tilt | open question, curiosity gap (poster emotion `q`) |
| arrowPointer | emotion.js | fat curved red arrow, `angle` = direction | slides in | point at the catch (poster emotion `arrow`) |
| poster | ../poster.js | §9 poster: huge product + 1–3 huge words + accent number + one emotion object | gentle tilt float | frame 1 (layer `poster`), cover.jpg, thumbnail.jpg (A/B) |
| speechBubble | ui.js | rounded bubble + tail (`tail` left/right), `text` inside or `wavy` lines | pops in; wavy lines draw on | talking, voice assistants, quotes-free "says" |
| appTile | ui.js | generic rounded app icon (house glyph, not a brand icon) + `label` | pops in | apps shutting down/moving, "the X app" |
| coreGrid | compute.js | dark die with a grid of tiny core cells (`cols`×`rows`, `w`×`h`) | cells sweep-fill left→right from `fillAt` | core counts, "50,000 cores", parallelism |
| gpuCard | compute.js | generic 2-slot graphics card: shroud, 2 spinning fans, bracket + ports, PCIe fingers, `label` under it | pops in, fans spin | consumer GPU comparisons (no brand imagery) |
| miniLedStack | screen.js | display cross-section: glass → LCD (RGB filter cells) → mini-LED backlight in zones, labels on the right | layers rise bottom-up from `at`; LEDs light + rays at `litAt` | mini-LED / LCD explainers, blooming |
| oledStack | screen.js | display cross-section: glass → (touch, `touch`) → 1–2 self-lit OLED pixel layers (`layers`) | `layer2At` drops a 2nd layer (tandem); `crackAt` cracks + peels the layers; `offAt` pixels off | OLED / tandem OLED, teardown damage |
| starScreen | screen.js | screen with bezel showing one white star on black (`zones` grid) | `bloomAt` zone glows + halo (blooming); `offAt` pixel grid all off | contrast, blooming vs true black |
| fingerTap | emotion.js | index finger tapping, marigold ripple rings (tip at x, y) | finger comes down, taps at `tapAt` | touch screens; poster emotion `tap` |
| chapterCard | text.js | "CHAPTER n" pill + big title on a paper band | rises at `at`, holds `hold` s (1.5), slides away | long-video chapter starts |
| scoreTable | measure.js | VERDICT.md table: rows label + bar + "score/max", optional TOTAL | each row slides in at its `at`, bar fills | verdict breakdown (long videos) |
