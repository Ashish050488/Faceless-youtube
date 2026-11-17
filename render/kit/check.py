"""Code QA before any image (PRODUCTION_SPEC §8). Prints a short PASS/FAIL summary; exit 1 on FAIL.

    python render/kit/check.py <work_dir> <factsheet.md> [final.mp4]

Reads <work_dir>/check.json (from `render.js ... --check`) and counters.json / timeline.json.
1. layout + contrast issues found by render.js (text outside y 270–1240, off frame, content below y 1240 or in the
   watermark box, contrast < 3 for ≥ 60 px text, < 4.5 below)
2. every on-screen number string-matches factsheet.md (digits compared with separators removed; "1100 NITS" ok
   for "1,100 nits"; a rounded display of a decimal factsheet value also passes: "27 h" for 27.08); years and "1 kg" scale marks need to be in the factsheet too, or they FAIL
3. counters hold ≥ 1.2 s; hard cuts 8–12 per 75 s
4. (with final.mp4) loudness −15 ± 1.5 LUFS integrated, true peak ≤ −1 dBTP, size < 20 MB
"""
import json
import os
import re
import subprocess
import sys


def nums(s):
    return [n.replace(",", "") for n in re.findall(r"\d[\d,]*(?:\.\d+)?", s)]


def matches(n, fs_nums):  # exact, or a rounded display of a factsheet value ("27 h" for 27.08 h)
    if n in fs_nums:
        return True
    d = len(n.split(".")[1]) if "." in n else 0
    return any(round(float(f), d) == float(n) for f in fs_nums if "." in f)


def main():
    work, fact = sys.argv[1], sys.argv[2]
    video = sys.argv[3] if len(sys.argv) > 3 else None
    ck = json.load(open(os.path.join(work, "check.json")))
    fails, notes = [], []
    for i in ck["issues"]:
        fails.append(f"layout s{i['scene']} t{i['t']}: {i['issue']} {i.get('text', '')}".strip())
    for w in ck.get("warnings", []):
        notes.append(f"warn s{w['scene']}: {w['issue']} {w.get('text', '')}")
    fs_nums = set(nums(open(fact, encoding="utf8").read()))
    for t in ck["onscreen_numbers"]:
        miss = [n for n in nums(t) if not matches(n, fs_nums)]
        if miss:
            fails.append(f"number not in factsheet: '{t}' ({', '.join(miss)})")
    for c in json.load(open(os.path.join(work, "counters.json"))):
        if c["hold"] < 1.2:
            fails.append(f"counter '{c['name']}' holds {c['hold']} s < 1.2")
    tl = json.load(open(os.path.join(work, "timeline.json")))
    hard = sum(1 for s in tl[1:] if not s.get("xfade"))
    dur = tl[-1]["end"]
    per75 = hard * 75 / dur
    (fails if not 8 <= per75 <= 12.5 else notes).append(f"hard cuts {hard} in {dur:.1f} s = {per75:.1f}/75 s")
    if video:
        r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", video, "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        lufs = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
        tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
        mb = os.path.getsize(video) / 1e6
        notes.append(f"loudness {lufs} LUFS, TP {tp} dBTP, {mb:.1f} MB")
        if not -16.5 <= lufs <= -13.5: fails.append(f"loudness {lufs} LUFS outside -15±1.5")
        if tp > -1.0: fails.append(f"true peak {tp} > -1 dBTP")
        if mb >= 20: fails.append(f"size {mb:.1f} MB ≥ 20")
    print(("FAIL" if fails else "PASS") + f" — {len(fails)} fail, {ck['frames']} frames sampled")
    for f in fails + notes:
        print(" -", f)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
