"""Code QA before any image (PRODUCTION_SPEC §8). Prints a short PASS/FAIL summary; exit 1 on FAIL.

    python render/kit/check.py <work_dir> <factsheet.md> [final.mp4]

Reads <work_dir>/check.json (from `render.js ... --check`) and counters.json / timeline.json.
1. issues found by render.js: OverlapCheck (text, products, 2-D objects and the watermark never touch), side margin
   (every element ≥ 54 px from the left/right edge at 1080 w; labels and headlines auto-shrink to fit), contrast < 3 for ≥ 60 px text, < 4.5 below. No safe-zone rules (owner 2026-11-17, full-frame layout)
2. every on-screen number string-matches factsheet.md (digits compared with separators removed; "1100 NITS" ok
   for "1,100 nits"; a rounded display of a decimal factsheet value also passes: "27 h" for 27.08); years and "1 kg" scale marks need to be in the factsheet too, or they FAIL
3. counters hold ≥ 1.2 s; headlines ≤ 4 s; hard cuts 8–12 per 75 s; real-image screen time % (info)
4. (with final.mp4) loudness −15 ± 1.5 LUFS integrated, true peak ≤ −1 dBTP, size < 20 MB, mean frame change 2.5–6,
   longest calm hold ≤ 2.5 s (these two warn only), content centre-x range (info). Paste the printed lines into qa.md.
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
    for h in ck.get("headlines", []):
        if h["hold"] > 4.0:
            fails.append(f"headline '{h['text']}' on screen {h['hold']} s > 4")
    tl = json.load(open(os.path.join(work, "timeline.json")))
    hard = sum(1 for s in tl[1:] if not s.get("xfade"))
    dur = tl[-1]["end"]
    per75 = hard * 75 / dur
    (fails if not 8 <= per75 <= 12.5 else notes).append(f"hard cuts {hard} in {dur:.1f} s = {per75:.1f}/75 s")
    real = sum(s["end"] - s["start"] for s in tl if s.get("real")) / dur
    notes.append(f"real-image screen time {real:.0%}")
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
        fw, fh = 90, 160  # motion numbers on a tiny grey copy
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={fw}:{fh},format=gray", "-f", "rawvideo", "-"],
                             capture_output=True).stdout
        import numpy as np
        fr = np.frombuffer(raw, np.uint8).reshape(-1, fh, fw).astype(np.int16)
        step = max(1, round(len(fr) / dur / 10)); fr = fr[::step]  # 10 fps, as the benchmark was measured
        d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
        fps = len(fr) / dur
        calm, run = 0, 0
        for v in d:
            run = run + 1 if v < 0.3 else 0
            calm = max(calm, run)
        cx = []
        for f in fr[::int(fps)]:
            m = np.abs(f - np.median(f)) > 25
            if m.sum() > 50:
                cx.append(np.nonzero(m)[1].mean() / fw)
        mfc = float(d.mean())
        notes.append(f"mean frame change {mfc:.2f}, longest calm hold {calm / fps:.2f} s, centre-x {min(cx):.2f}–{max(cx):.2f}")
        # warnings, not fails: light flat backgrounds read low on this metric (sow004 shipped at 1.21 / 4.0 s)
        if not 2.5 <= mfc <= 6: notes.append(f"WARN mean frame change {mfc:.2f} outside 2.5–6: add motion on beats if a scene feels static")
        if calm / fps > 2.5: notes.append(f"WARN longest calm hold {calm / fps:.2f} s > 2.5")
    print(("FAIL" if fails else "PASS") + f" — {len(fails)} fail, {ck['frames']} frames sampled")
    for f in fails + notes:
        print(" -", f)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
