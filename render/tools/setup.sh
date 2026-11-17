#!/usr/bin/env bash
# Reinstall everything the video pipeline needs that is NOT in git (fonts, node module, Python venv, model weights).
# Idempotent: skips what is already there.  Usage: bash render/tools/setup.sh [venv_dir] [models_dir]
set -euo pipefail
R=$(cd "$(dirname "$0")/../.." && pwd); V=${1:-$R/../sow-venv}; M=${2:-$R/../sow-models}
# fonts (Fontsource, OFL) → render/fonts/*.ttf (gitignored)
mkdir -p "$R/render/fonts"
for f in inter-tight-latin-700-normal inter-tight-latin-800-normal inter-tight-latin-900-normal; do
  [ -f "$R/render/fonts/$f.ttf" ] || { curl -sfL -o "/tmp/$f.woff2" "https://cdn.jsdelivr.net/npm/@fontsource/inter-tight@5.0.20/files/$f.woff2"
    python3 -c "from fontTools.ttLib import TTFont; t=TTFont('/tmp/$f.woff2'); t.flavor=None; t.save('$R/render/fonts/$f.ttf')"; }; done
for f in inter-latin-600-normal inter-latin-700-normal; do
  [ -f "$R/render/fonts/$f.ttf" ] || { curl -sfL -o "/tmp/$f.woff2" "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.20/files/$f.woff2"
    python3 -c "from fontTools.ttLib import TTFont; t=TTFont('/tmp/$f.woff2'); t.flavor=None; t.save('$R/render/fonts/$f.ttf')"; }; done
# node canvas
[ -d "$R/render/node_modules/@napi-rs/canvas" ] || (cd "$R/render" && npm install --silent)
# python venv (CPU torch first so nothing pulls a CUDA build). Do NOT install spandrel/torchvision: they break Kokoro.
if [ ! -x "$V/bin/python" ]; then
  python3 -m venv "$V"
  "$V/bin/pip" install -q torch --index-url https://download.pytorch.org/whl/cpu
  "$V/bin/pip" install -q kokoro misaki faster-whisper "rembg[cpu]" librosa pyloudnorm scipy num2words pymupdf soundfile fonttools brotli pillow
fi
# Real-ESRGAN x4plus weights (only for upscaling small press images)
mkdir -p "$M"; [ -f "$M/RealESRGAN_x4plus.pth" ] || curl -sfL -o "$M/RealESRGAN_x4plus.pth" \
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
echo "ok: fonts $(ls "$R/render/fonts" | wc -l), venv $V, models $M  →  export PY=$V/bin/python"
