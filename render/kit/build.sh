#!/usr/bin/env bash
# One video, end to end (render/README.md). Inputs: scripts/<slug>/{script.md, factsheet.md, cues.kit.json, plan.json}
# and <work>/assets/*.png (whole cut-outs) [+ map_robinson.json]. Outputs land in <work>/out/ for the handoff branch.
#   render/kit/build.sh voice <slug> <work>   # narration + word timings (then write plan.json / cues.kit.json)
#   render/kit/build.sh check <slug> <work>   # code QA only (fast; run until PASS before any image)
#   render/kit/build.sh stills <slug> <work>  # per-cue stills → ONE contact sheet <work>/sheet.jpg
#   render/kit/build.sh video <slug> <work>   # frames + bed + mix + export + cover + thumbnail + captions + sha256 + QA
set -euo pipefail
STEP=$1; SLUG=$2; W=$(realpath -m "$3"); R=$(cd "$(dirname "$0")/../.." && pwd); SD=$R/scripts/$SLUG; CUES=$SD/cues.kit.json
# SOW_ENC overrides the encoder flags, e.g. "-crf 19 -maxrate 3M -bufsize 6M" when detailed art busts the 20 MB cap (sow018).
PY=${PY:-python3}; ENC=${SOW_ENC:-"-crf 19 -maxrate 8M -bufsize 16M"}; SHAFILES="video.mp4 thumbnail.jpg cover.jpg captions.srt"
# SOW_FMT=long: 1920×1080 long video (PRODUCTION_SPEC §6: CRF 23, maxrate 6 Mbps), thumbnail only (no cover / Reel)
[ "${SOW_FMT:-}" = long ] && { ENC="-crf 23 -maxrate 6M -bufsize 12M"; SHAFILES="video.mp4 thumbnail.jpg captions.srt"; }
mkdir -p "$W/assets" "$W/out"; cd "$R"
case $STEP in
voice)
  $PY audio/narrate.py "$SD/script.md" af_heart 0.795 "$W/voice.wav" 0.30 0.42 2>&1 | grep -vi warn | tail -1
  $PY -m meta.align_words "$SD/script.md" "$W/voice.wav" "$W/words.json" 2>&1 | grep -vi warn | tail -1
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$W/voice.wav" > "$W/voice_seconds.txt"
  cp render/brand/watermark_on_light.png "$W/wm_light.png"; cp render/brand/watermark_on_dark.png "$W/wm_dark.png"
  $PY audio/measure_timing.py "$W/voice.wav" 2>&1 | grep -vi warn | tail -2 ;;
check)
  node render/kit/poster.js "$W" "$CUES" "$W/out" >/dev/null
  node render/kit/render.js "$W" "$CUES" --check
  $PY render/kit/check.py "$W" "$SD/factsheet.md" ;;
stills)
  rm -rf "$W/stills"; node render/kit/render.js "$W" "$CUES" --stills cues
  ffmpeg -nostdin -v error -y -pattern_type glob -i "$W/stills/*.png" -vf "scale=180:-1,tile=9x$(( ($(ls "$W/stills" | wc -l) + 8) / 9 ))" "$W/sheet.jpg"; echo "$W/sheet.jpg" ;;
video)
  node render/kit/poster.js "$W" "$CUES" "$W/out" >/dev/null && node render/kit/render.js "$W" "$CUES" --check >/dev/null && $PY render/kit/check.py "$W" "$SD/factsheet.md" >/dev/null || { echo "check FAILED — run: build.sh check"; exit 1; }
  [ -f "$W/frames.mp4" ] && [ "${REUSE_FRAMES:-0}" = 1 ] || node render/kit/render.js "$W" "$CUES"
  $PY - "$W" <<'PYEOF'
import json, sys, numpy as np, soundfile as sf
from scipy.signal import lfilter
W = sys.argv[1]; tl = json.load(open(f"{W}/timeline.json")); ev = json.load(open(f"{W}/events.json")); end = ev["end"]
st = [s["start"] for s in tl]; cat = max(0.0, ev["catch"] - 0.6); ver = ev["verdict"]; main = st[2] if len(st) > 2 else 3.0
lift = (main + cat) / 2
json.dump([{"start": 0, "end": main, "energy": "intro"}, {"start": main, "end": lift, "energy": "main"},
           {"start": lift, "end": cat, "energy": "lift"}, {"start": cat, "end": ver, "energy": "catch"},
           {"start": ver, "end": end, "energy": "verdict"}], open(f"{W}/sections.json", "w"))
v, sr = sf.read(f"{W}/voice.wav"); n = np.random.default_rng(5).standard_normal(len(v))  # room tone: pink noise −62 dBFS
pink = lfilter([0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400], n)
pink /= np.sqrt(np.mean(pink ** 2)); sf.write(f"{W}/voice_rt.wav", (v + pink * 10 ** (-62 / 20)).astype(np.float32), sr)
PYEOF
  $PY -m audio.bed "$SLUG" "$W/timeline.json" "$W/events.json" "$W/sfx.json" "$W/bed.wav" --sections "$W/sections.json" >/dev/null
  bash audio/mix.sh "$W/voice_rt.wav" "$W/bed.wav" "$W/mix.mp3"
  ffmpeg -nostdin -y -loglevel error -i "$W/frames.mp4" -i "$W/mix.mp3" -map 0:v -map 1:a -af volume=-0.5dB \
    -c:v libx264 -profile:v high -preset slow -tune animation $ENC -pix_fmt yuv420p -r 30 -c:a aac -b:a 160k -movflags +faststart "$W/out/video.mp4"
  node render/kit/poster.js "$W" "$CUES" "$W/out" >/dev/null   # cover.jpg + thumbnail.jpg (A, upload) and *_b.jpg (B, logged) — §9
  $PY -m meta.captions "$SD/script.md" "$W/words.json" "$W/out/captions.srt" --offset 0 >/dev/null
  $PY render/kit/check.py "$W" "$SD/factsheet.md" "$W/out/video.mp4" | tee "$W/out/check.txt" || true
  (cd "$W/out" && sha256sum $SHAFILES $(ls thumbnail_b.jpg 2>/dev/null) $([ "${SOW_FMT:-}" = long ] || ls cover_b.jpg 2>/dev/null) > sha256.txt) ;;
*) echo "unknown step $STEP"; exit 1 ;;
esac
