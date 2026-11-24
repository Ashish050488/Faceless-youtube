# audio/ — voice + music (voice settings are LOCKED by the owner)
- `narrate_chatterbox.py` — THE voice (locked 2026-11-24), run by .github/workflows/voice.yml: Chatterbox cloning `voices/our_voice_ref.wav`, 0.6 0.4 seed 11, then atempo 1.09.
- `narrate.py` — Kokoro fallback only: `python audio/narrate.py <script.md> af_heart 0.795 out.wav 0.30 0.42`.
  Normally runs on GitHub Actions (.github/workflows/voice.yml) → branch `handoff/<slug>-voice`. Versions: `voice-versions.txt`.
- `measure_timing.py` — speaking rate, gaps, tail check.
- `mix.sh voice.wav bed.wav out.mp3` — final mix (−14 LUFS). `bed.py`/`music.py`/`chiptune.py` — procedural music beds.
