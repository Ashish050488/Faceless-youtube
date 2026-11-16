"""Kokoro narration with word timestamps and natural pauses.

    python -m audio.voice <script.md> <out_dir> [--voice af_heart] [--speed 1.0] [--only N]

Reads the [SECTION] blocks of script.md (lines under a "[m:ss NAME]" header), renders each
sentence separately, joins them with pauses (sentence 0.22 s, "..." 0.42 s, section 0.35 s) and writes:
  out_dir/voice.wav        24 kHz mono narration
  out_dir/words.json       [{"w": "word", "start": s, "end": s, "section": "HOOK"}, ...]
  out_dir/sections.json    [{"name": "HOOK", "start": s, "end": s}, ...]
"""
import argparse
import json
import re
from pathlib import Path

import numpy as np
import soundfile as sf

SR = 24000
PAUSE_SENT, PAUSE_ELLIPSIS, PAUSE_SECTION = 0.22, 0.42, 0.35


def parse_script(text):
    sections, cur = [], None
    for line in text.splitlines():
        m = re.match(r"\[(\d+:\d+)\s+([^\]]+)\]", line.strip())
        if m:
            cur = {"name": m.group(2).split("→")[0].strip(), "text": ""}
            sections.append(cur)
        elif cur is not None and line.strip():
            cur["text"] += (" " if cur["text"] else "") + line.strip()
    return sections


def split_units(text):
    """Split into sentences, and split again after '...' so we can place a longer pause."""
    units = []
    for sent in re.split(r"(?<=[.?!])\s+", text):
        parts = re.split(r"(?<=\.\.\.)\s+", sent)
        for p in parts:
            if p.strip():
                units.append(p.strip())
    return units


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    a = ap.parse_args()
    from kokoro import KPipeline

    pipe = KPipeline(lang_code="a" if a.voice[0] == "a" else "b")
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    secs = parse_script(Path(a.script).read_text())
    audio, words, sec_out, t = [], [], [], 0.0
    for si, sec in enumerate(secs):
        s_start = t
        for unit in split_units(sec["text"]):
            for r in pipe(unit, voice=a.voice, speed=a.speed):
                wav = r.audio.numpy() if hasattr(r.audio, "numpy") else np.asarray(r.audio)
                # trim leading/trailing near-silence so our pauses are the only pauses
                nz = np.where(np.abs(wav) > 0.01)[0]
                lead = max(0, nz[0] - int(0.03 * SR)) if len(nz) else 0
                tail = min(len(wav), nz[-1] + int(0.06 * SR)) if len(nz) else len(wav)
                wav = wav[lead:tail]
                for tok in r.tokens or []:
                    if tok.start_ts is None or not re.search(r"\w", tok.text):
                        continue
                    words.append({"w": tok.text, "start": round(t + tok.start_ts - lead / SR, 3),
                                  "end": round(t + tok.end_ts - lead / SR, 3), "section": sec["name"]})
                audio.append(wav)
                t += len(wav) / SR
            gap = PAUSE_ELLIPSIS if unit.endswith("...") else PAUSE_SENT
            audio.append(np.zeros(int(gap * SR)))
            t += gap
        audio.append(np.zeros(int(PAUSE_SECTION * SR)))
        t += PAUSE_SECTION
        sec_out.append({"name": sec["name"], "start": round(s_start, 3), "end": round(t, 3)})
    x = np.concatenate(audio).astype(np.float32)
    sf.write(out / "voice.wav", x, SR)
    (out / "words.json").write_text(json.dumps(words, indent=0))
    (out / "sections.json").write_text(json.dumps(sec_out, indent=1))
    speech = sum(w["end"] - w["start"] for w in words)
    print(json.dumps({"voice": a.voice, "speed": a.speed, "seconds": round(t, 2), "words": len(words),
                      "wpm_overall": round(len(words) / t * 60, 1), "speech_s": round(speech, 1)}))


if __name__ == "__main__":
    main()
