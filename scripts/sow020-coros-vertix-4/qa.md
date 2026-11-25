# sow020-coros-vertix-4 — QA (video session, 25 Nov 2026)
- video.mp4: 1080×1920, 30 fps, H.264 CRF 19, **48.4 s** (target 45–55, cap 58), 9 MB. Voice: chatterbox seed 11 x1.09 (match 0.896).
- check.py: **PASS**, 0 fail (194 frames): no overlaps, 54 px side margin, top margin 170, contrast, every on-screen number in factsheet.md, counter holds ≥ 1.2 s, headlines ≤ 4 s.
- Hard cuts 6 in 48.4 s (9.3 / 75 s). Real-image screen time 95 % (8 distinct official COROS images: 4 cut-outs + 4 cards, assets.md).
- Loudness −15.5 LUFS, TP −1.6 dBTP. Timing: {'articulation_wpm': 187, 'overall_wpm': 132, 'sentence_gap': [0.56, 0.64, 0.72], 'comma_gap': [0.31, 0.45, 0.6], 'last_words': '800 for a flashlight watch?', 'tail': np.float64(2.52)}
- Mean frame change 2.00 (WARN < 2.5, normal for flat light backgrounds), longest calm hold 2.40 s, centre-x 0.32–0.52 (side-by-side comparison scenes).
- Poster A (uploaded): front view + "WORTH IT?" + $799 + "?" stamp; frame 1 = cover.jpg. Phone test: cover words 30 px, thumbnail words 18 px (≥ 14). WARN: product 34 % of thumbnail width (round watch is tall, can't reach 55 % at 16:9 without cropping).
- Poster B (A/B later, not uploaded): "MAPS IN 2027?" + 30 days + arrow.
- New kit objects: watchOutline (Vertix 2S, no image of it used), lightBeam, mountainSunrise (render/kit/components/outdoor.js, OBJECTS.md).
- Not shown: unverified claims (flashlight levels, colours, lumens). No COROS/Garmin logos drawn by us.
