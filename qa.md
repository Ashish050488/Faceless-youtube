# QA sow010-valve-steam-machine-out-of-stock (video session, 2026-11-20 00:50Z)
```
PASS — 0 fail, 242 frames sampled
 - hard cuts 9 in 60.4 s = 11.2/75 s
 - real-image screen time 96%
 - loudness -15.2 LUFS, TP -1.6 dBTP, 4.5 MB
 - mean frame change 1.25, longest calm hold 2.60 s, centre-x 0.43–0.51
 - WARN mean frame change 1.25 outside 2.5–6: add motion on beats if a scene feels static
 - WARN longest calm hold 2.60 s > 2.5

measure_timing:
{'articulation_wpm': 173, 'overall_wpm': 131, 'sentence_gap': [0.61, 0.68, 0.78], 'comma_gap': [0.6, 0.67, 0.75], 'last_words': 'over $1 ,000 for one?', 'tail': np.float64(2.71)}
```
- 1080×1920 native, 30 fps, CRF 19; 14 scenes + end card; 4 Valve cut-outs + 2 official clips (9 s = 15 %); 96 % real-image time; 13 on-screen numbers all in factsheet.
- Overlap / margins / contrast / factsheet / holds: PASS. One contact sheet viewed; fixed small hero cube (re-cropped clip), a "six"→"sixteen" cue mismatch, thumbnail overlap.
- WARN mean frame change 1.25 (light flat backgrounds); longest calm hold 2.6 s.
- Voice from handoff/…-voice: 60.4 s, 173 wpm (in spec).
- Description must credit: "Product images and clips: Valve (store.steampowered.com)".
