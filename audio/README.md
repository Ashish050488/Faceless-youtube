# audio/ — voice + music (voice settings are LOCKED by the owner)
- `narrate.py` — the voice: `python audio/narrate.py <script.md> af_heart 0.795 out.wav 0.30 0.42` (applies config/pronunciations.json).
  Normally runs on GitHub Actions (.github/workflows/voice.yml) → branch `handoff/<slug>-voice`. Versions: `voice-versions.txt`.
- `measure_timing.py` — speaking rate, gaps, tail check.
- `mix.sh voice.wav bed.wav out.mp3` — final mix (−14 LUFS). `bed.py`/`music.py`/`chiptune.py` — procedural music beds.
