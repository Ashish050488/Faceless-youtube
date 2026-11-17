"""Music bed for audio/mix.sh: chiptune + SFX + riser into THE CATCH + 0.5 s drop before the verdict.

    python -m audio.bed <slug> <timeline.json> <events.json> <sfx.json> <out_bed.wav> [--sfx-comp-db 11]

mix.sh lowers the bed by 11 dB and sidechains it under the voice, so SFX are pre-boosted by the same 11 dB
(--sfx-comp-db) to land as subtle, audible events (−24 to −18 LUFS short-term) rather than vanishing.
"""
import argparse
import json

import numpy as np
import soundfile as sf
from scipy.signal import lfilter

from audio.chiptune import render as chiptune
from audio.mix import synth as base_synth

SR = 48000


def lp(x, hz):
    a = np.exp(-2 * np.pi * hz / SR)
    return lfilter([1 - a], [1, -a], x)


def synth(kind, rng):
    t = lambda s: np.arange(int(s * SR)) / SR
    if kind == "shimmer":   # light sweep: soft high chime glide
        tt = t(0.7); return (np.sin(2 * np.pi * (2400 + 1600 * tt) * tt) * 0.4 + np.sin(2 * np.pi * 3600 * tt) * 0.2) * np.exp(-tt * 5) * np.sin(np.pi * np.minimum(tt / 0.08, 1) / 2) * 0.45
    if kind == "swish":     # underline draw
        n = int(0.28 * SR); x = rng.standard_normal(n) * np.sin(np.linspace(0, np.pi, n)) ** 2
        return lp(x - lp(x, 2500), 9000) * 0.35
    if kind == "blip":
        tt = t(0.07); return np.sign(np.sin(2 * np.pi * 1320 * tt)) * np.exp(-tt * 60) * 0.18
    if kind == "scratch":   # strike-through
        n = int(0.22 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 14)
        return lp(x - lp(x, 1200), 6000) * 0.5
    if kind == "shutter":
        tt = t(0.12); a = rng.uniform(-1, 1, len(tt)) * (np.exp(-tt * 120) + 0.6 * np.exp(-np.maximum(tt - 0.06, 0) * 120) * (tt > 0.06))
        return a * 0.5
    if kind == "rise":      # short counter riser
        tt = t(0.6); return np.sin(2 * np.pi * (300 + 900 * tt ** 2) * tt) * np.minimum(tt / 0.6, 1) * 0.25
    if kind == "flip":      # calendar page
        n = int(0.09 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 50); return lp(x, 4000) * 0.6
    if kind == "move":      # camera move
        n = int(0.42 * SR); x = rng.standard_normal(n) * np.sin(np.linspace(0, np.pi, n)) ** 3
        return lp(x, 1400) * 0.4
    if kind == "wipe":
        n = int(0.42 * SR); x = rng.standard_normal(n) * np.sin(np.linspace(0, np.pi, n)) ** 2
        return (lp(x, 2600) - lp(x, 300)) * 0.4
    if kind == "cut":       # hard cut: tiny transient so cuts feel intentional
        tt = t(0.06); return (rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 140)) * 0.35
    if kind == "swing":     # price tag swing
        tt = t(0.5); return np.sin(2 * np.pi * (500 - 200 * tt) * tt) * np.exp(-tt * 6) * np.sin(np.pi * tt / 0.5) * 0.25
    if kind in ("clamp", "clunk"):
        tt = t(0.14); return (np.sin(2 * np.pi * 180 * tt) * np.exp(-tt * 35) + rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 90) * 0.4) * 0.6
    if kind == "drip":
        tt = t(0.18); return np.sin(2 * np.pi * (600 + 1600 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 22) * 0.45
    if kind == "splash":
        n = int(0.5 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 7); return lp(x - lp(x, 800), 7000) * 0.35
    if kind == "beep":
        tt = t(0.12); return np.sin(2 * np.pi * 1046 * tt) * np.minimum(1, (0.12 - tt) * 40) * 0.2
    if kind == "pulse":
        tt = t(0.35); return (np.sin(2 * np.pi * 60 * tt) * np.exp(-tt * 18) + 0.6 * np.sin(2 * np.pi * 60 * tt) * np.exp(-np.maximum(tt - 0.18, 0) * 18) * (tt > 0.18)) * 0.7
    if kind == "down":      # number rolling down
        tt = t(0.4); return np.sin(2 * np.pi * (900 - 600 * tt / 0.4) * tt) * np.exp(-tt * 5) * 0.25
    if kind == "switch":
        tt = t(0.08); return (np.sin(2 * np.pi * 2200 * tt) * np.exp(-tt * 120) + rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 300) * 0.5) * 0.5
    if kind == "drain":
        tt = t(0.5); return np.sign(np.sin(2 * np.pi * (700 - 500 * tt / 0.5) * tt)) * np.exp(-tt * 4) * 0.12
    if kind == "pin":
        tt = t(0.3); return (np.sin(2 * np.pi * 880 * tt) * 0.5 + np.sin(2 * np.pi * 1320 * tt) * 0.3) * np.exp(-tt * 9) * 0.4
    return base_synth(kind, rng)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("timeline"); ap.add_argument("events"); ap.add_argument("sfx"); ap.add_argument("out")
    ap.add_argument("--sfx-comp-db", type=float, default=11.0)
    ap.add_argument("--sections", default=None, help="JSON list of {start,end,energy}; default = sow001 layout")
    a = ap.parse_args()
    tl = json.load(open(a.timeline)); ev = json.load(open(a.events))
    st = {s["line"]: s["start"] for s in tl}
    end = ev["end"]
    sections = json.load(open(a.sections)) if a.sections else [
        {"start": 0, "end": st[2], "energy": "intro"},
        {"start": st[2], "end": st[9], "energy": "main"},
        {"start": st[9], "end": st[12], "energy": "dark"},
        {"start": st[12], "end": st[16], "energy": "lift"},
        {"start": st[16], "end": st[20], "energy": "catch"},
        {"start": st[20], "end": end, "energy": "verdict"},
    ]
    chiptune(a.slug, sections, a.out)
    m, _ = sf.read(a.out)
    n = int(end * SR)
    m = np.pad(m, ((0, max(0, n - len(m))), (0, 0)))[:n]
    # music drops out for 0.5 s right before the verdict (fast 40 ms fades, no clicks)
    v0 = int((ev["verdict"] - 0.5) * SR); v1 = int(ev["verdict"] * SR); f = int(0.04 * SR)
    g = np.ones(n); g[v0:v1] = 0; g[v0 - f:v0] = np.linspace(1, 0, f); g[v1:v1 + f] = np.linspace(0, 1, f)
    m = m * g[:, None]
    # riser into THE CATCH (1.6 s noise + tone swell that stops on the stamp)
    rng = np.random.default_rng(3)
    L = int(1.6 * SR); tt = np.arange(L) / SR; env = (tt / 1.6) ** 2.2
    noise = rng.standard_normal(L); sweep = lp(noise, 600) + 0.5 * (noise - lp(noise, 3000))
    riser = (sweep * 0.25 + np.sin(2 * np.pi * (110 + 330 * (tt / 1.6) ** 2) * tt) * 0.2) * env
    c = int(ev["catch"] * SR); s0 = max(0, c - L)
    m[s0:c] += riser[L - (c - s0):, None] * 0.9
    # SFX layer (pre-compensated for mix.sh's bed gain)
    fx = np.zeros(n); comp = 10 ** (a.sfx_comp_db / 20)
    for e in json.load(open(a.sfx)):
        x = synth(e["kind"], rng) * e.get("gain", 1) * 0.16 * comp
        i = int(e["t"] * SR)
        if 0 <= i < n:
            fx[i:i + len(x)] += x[: n - i]
    out = m + fx[:, None]
    out = out / max(1.0, np.max(np.abs(out)) / 0.98)
    sf.write(a.out, out.astype(np.float32), SR)
    print(json.dumps({"bed_s": round(n / SR, 2), "sections": sections, "drop": [round(v0 / SR, 2), round(v1 / SR, 2)], "catch": ev["catch"]}))


if __name__ == "__main__":
    main()
