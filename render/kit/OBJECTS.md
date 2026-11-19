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
| `compute.js` (add) | chips and PC parts: chipDie, ramStick, fan, ssd, gpuCard |
| `ports.js` (add) | usbPort (A/C), audioJack, ethernetPort, hdmiPort |

## Index (one row per object — keep it updated)
| Name | File | Shows | Animate (`t`) | Use for |
|---|---|---|---|---|
| sun | objects.js | sun with rays | rays grow | brightness, nits |
| priceTag | objects.js | tag with string + hole | swings, value rolls | price |
| calipers | objects.js | calipers with scale | jaw slides | thickness, mm |
| scale | objects.js | balance scale | tips | weight, g/kg |
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
