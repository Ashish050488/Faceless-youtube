"""captions.srt from Kokoro word timings, using the script's own words (1:1 aligned) and punctuation.

    python -m meta.captions <script.md> <words.json> <out.srt> [--offset 0.35]

Cues: up to 7 words or one sentence, max 42 chars per line.
"""
import argparse
import json
import re
from pathlib import Path


def ts(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script"); ap.add_argument("words"); ap.add_argument("out")
    ap.add_argument("--offset", type=float, default=0.35)
    a = ap.parse_args()
    lines = Path(a.script).read_text().splitlines()
    body = " ".join(l for l in lines if l.strip() and not l.startswith(("[", "#", "Voice", "Retention")))
    sw = [x for x in body.split() if re.search(r"\w", x)]
    words = json.loads(Path(a.words).read_text())
    if len(sw) != len(words):
        raise SystemExit(f"alignment mismatch: script {len(sw)} vs tts {len(words)}")
    cues, cur = [], []
    for i, (s, w) in enumerate(zip(sw, words)):
        cur.append((s, w))
        text = " ".join(x for x, _ in cur)
        if re.search(r"[.?!]$", s) or len(cur) >= 7 or len(text) > 38 or i == len(sw) - 1:
            cues.append(cur); cur = []
    out = []
    for k, c in enumerate(cues, 1):
        st, en = c[0][1]["start"] + a.offset, c[-1][1]["end"] + a.offset + 0.1
        if k < len(cues):
            en = min(en, cues[k][0][1]["start"] + a.offset - 0.02)
        out.append(f"{k}\n{ts(st)} --> {ts(en)}\n{' '.join(x for x, _ in c)}\n")
    Path(a.out).write_text("\n".join(out))
    print(len(cues), "cues")


if __name__ == "__main__":
    main()
