"""Word timestamps for a narration: Whisper word timings aligned onto the script's own words.

    python -m meta.align_words <script.md> <voice.wav> <out_words.json>

The script text is the source of truth (captions/on-screen text use it); Whisper only provides timing.
Alignment: difflib over normalised tokens; script words with no Whisper match are interpolated
between their matched neighbours. Each output item: {"w", "start", "end", "sent", "brk"}.
"""
import difflib
import json
import re
import sys

import librosa
import numpy as np
from faster_whisper import WhisperModel

NUM = {"1,900": "nineteen hundred", "1900": "nineteen hundred", "59": "fifty-nine", "$59": "fifty-nine dollar",
       "500": "five-hundred", "$500": "five-hundred-dollar", "15,000": "fifteen-thousand", "$15,000": "fifteen-thousand-dollar",
       "79": "seventy-nine", "$79": "seventy-nine dollars", "2027": "twenty twenty-seven", "5": "five", "4": "four"}


def norm(s):
    return re.sub(r"[^a-z0-9]", "", s.lower())


def script_words(path):
    lines = [l.strip() for l in open(path).read().split("\n")
             if l.strip() and not l.startswith(("#", "[", "v3", "Facts", "Pauses", "~"))]
    out = []
    for si, l in enumerate(lines):
        for w in l.split():
            out.append({"w": w, "line": si})
    return out


def main():
    src, wav, outp = sys.argv[1:4]
    sw = script_words(src)
    a, sr = librosa.load(wav, sr=16000)
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    segs, _ = m.transcribe(a, language="en", word_timestamps=True, beam_size=5,
                           initial_prompt=" ".join(x["w"] for x in sw[:60]))
    ww = []
    for s in segs:
        for w in s.words:
            t = w.word.strip()
            # expand digits into the script's spelled tokens so they can align
            exp = NUM.get(t.rstrip(".,?!"), None)
            parts = re.split(r"[\s-]+", exp) if exp else [t]
            dur = (w.end - w.start) / len(parts)
            for k, p in enumerate(parts):
                ww.append({"t": p, "start": w.start + k * dur, "end": w.start + (k + 1) * dur})
    # script tokens split on hyphens too, then merged back per script word
    sub = []
    for i, x in enumerate(sw):
        for p in [p for p in re.split(r"-", x["w"]) if norm(p)]:
            sub.append((i, norm(p)))
    sm = difflib.SequenceMatcher(a=[t for _, t in sub], b=[norm(x["t"]) for x in ww], autojunk=False)
    times = [None] * len(sub)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            times[blk.a + k] = (ww[blk.b + k]["start"], ww[blk.b + k]["end"])
    # interpolate gaps
    idx = [k for k, t in enumerate(times) if t]
    for k in range(len(times)):
        if times[k] is None:
            lo = max([j for j in idx if j < k], default=None)
            hi = min([j for j in idx if j > k], default=None)
            t0 = times[lo][1] if lo is not None else 0.0
            t1 = times[hi][0] if hi is not None else t0 + 0.3
            n = (hi if hi is not None else k + 1) - (lo if lo is not None else -1)
            f = (k - (lo if lo is not None else -1)) / n
            st = t0 + (t1 - t0) * f
            times[k] = (st, st + max(0.08, (t1 - t0) / n))
    res = []
    for i, x in enumerate(sw):
        ts = [times[k] for k, (j, _) in enumerate(sub) if j == i]
        if not ts:
            continue
        res.append({"w": x["w"], "start": round(min(t[0] for t in ts), 3), "end": round(max(t[1] for t in ts), 3),
                    "line": x["line"], "brk": bool(re.search(r"[.,?!…]$|\.\.\.$", x["w"]))})
    matched = sum(1 for t in times if t) - sum(1 for k in range(len(times)) if k not in idx)
    json.dump(res, open(outp, "w"), indent=0)
    print(json.dumps({"script_words": len(sw), "aligned": len(res), "whisper_tokens": len(ww),
                      "direct_match_ratio": round(len(idx) / len(sub), 3), "last": res[-1]}))


if __name__ == "__main__":
    main()
