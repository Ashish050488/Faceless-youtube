# QA sow012-google-assistant-nest-gemini (video session, 2026-11-21 00:36Z)
```
PASS — 0 fail, 267 frames sampled
 - hard cuts 9 in 66.6 s = 10.1/75 s
 - real-image screen time 91%
 - loudness -15.4 LUFS, TP -1.6 dBTP, 18.4 MB
 - mean frame change 1.36, longest calm hold 2.80 s, centre-x 0.41–0.50
 - WARN mean frame change 1.36 outside 2.5–6: add motion on beats if a scene feels static
 - WARN longest calm hold 2.80 s > 2.5
 - WARN poster A cover: product 45% < 60% (tall/wide asset — set thumb.thumbImg)
 - WARN poster B cover: product 45% < 60% (tall/wide asset — set thumb.thumbImg)
 - poster A/cover words 42 px @phone, A/thumb words 18 px @phone, B/cover words 37 px @phone, B/thumb words 18 px @phone

measure_timing:
{'articulation_wpm': 165, 'overall_wpm': 119, 'sentence_gap': [0.61, 0.7, 0.79], 'comma_gap': [0.36, 0.61, 0.68], 'last_words': 'old assistant if you could?', 'tail': np.float64(2.77)}
```
- 1080×1920 native, 30 fps, CRF 19; 15 scenes + end card; 6 official Google images, 91 % real-image time; on-screen numbers all in factsheet.
- §9 poster: frame 1 = cover.jpg = poster A. A (upload): "BYE BYE?" + AUG 2027 + red ✕ (Nest Mini; thumbnail uses the Nest Hub).
  B (log only, later A/B): "NO WAY BACK?" + $10/MO + arrow → thumbnail_b.jpg / cover_b.jpg. Phone test PASS (all text ≥ 14 px).
  WARN: product 45 % of cover height (round Nest Mini, whole, not cropped).
- New library objects: speechBubble, appTile (ui.js), indexed in OBJECTS.md.
- WARN mean frame change 1.36 (light flat backgrounds); longest calm hold 2.8 s.
- Voice from handoff/…-voice: 66.6 s (target 50–58 s), 165 wpm — audio locked, not changed. File 18.4 MB (< 20).
- Description credit: "Product images: Google (store.google.com)".
