"""Final audio mix: voice + chiptune bed (ducked) + SFX → master at −14 LUFS, true peak ≤ −1 dBTP.

    python -m audio.mix <work_dir> <slug> <music_sections.json> [--voice-delay 0.35]

Expects work_dir/voice/voice.wav and work_dir/sfx.json (from the renderer). Writes work_dir/mix.wav and
prints a loudness report (also saved to work_dir/loudness.json).
"""
import argparse
import json
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy.signal import lfilter, resample_poly

from audio.chiptune import render as chiptune

SR = 48000
VOICE_LUFS, MASTER_LUFS, TP_CEIL = -16.0, -14.0, -1.0
MUSIC_LUFS, DUCK_DB = -19.0, 9.0


def lufs(x):
    return pyln.Meter(SR).integrated_loudness(x)


def gain_to(x, target):
    return x * 10 ** ((target - lufs(x)) / 20)


def true_peak_db(x):
    up = resample_poly(x, 4, 1, axis=0)
    return 20 * np.log10(np.max(np.abs(up)) + 1e-12)


def limiter(x, ceiling_db, look=0.005, release=0.08):
    """Lookahead peak limiter on the 4x-oversampled peak estimate (stereo-linked)."""
    c = 10 ** (ceiling_db / 20)
    up = np.max(np.abs(resample_poly(x, 4, 1, axis=0)), axis=1)
    pk = up.reshape(-1, 4).max(1)[: len(x)]
    need = np.minimum(1.0, c / np.maximum(pk, 1e-12))
    n = int(look * SR)
    # hold the minimum gain over the lookahead window, then smooth release
    from scipy.ndimage import minimum_filter1d
    g = minimum_filter1d(need, size=2 * n + 1)
    a = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    acc = 1.0
    for i, v in enumerate(g):  # attack instant (already looked ahead), release smooth
        acc = v if v < acc else a * acc + (1 - a) * v
        out[i] = acc
    return x * out[:, None]


def synth(kind, rng):
    t = lambda s: np.arange(int(s * SR)) / SR
    if kind == "whoosh":
        x = rng.standard_normal(int(0.45 * SR)) * np.sin(np.linspace(0, np.pi, int(0.45 * SR))) ** 2
        f = np.linspace(800, 3000, len(x)); y = np.zeros_like(x); acc = 0
        for i in range(len(x)):  # sweeping one-pole lowpass
            a = np.exp(-2 * np.pi * f[i] / SR); acc = (1 - a) * x[i] + a * acc; y[i] = acc
        return y * 0.5
    if kind == "click":
        tt = t(0.05); return (np.sin(2 * np.pi * 1800 * tt) * np.exp(-tt * 160) + 0.5 * rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 400)) * 0.6
    if kind == "cart":
        tt = t(0.12); return (rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 90) * 0.5 + np.sin(2 * np.pi * 220 * tt) * np.exp(-tt * 50) * 0.5)
    if kind == "tick":
        tt = t(0.05); return np.sign(np.sin(2 * np.pi * 1760 * tt)) * np.exp(-tt * 90) * 0.35
    if kind == "pop":
        tt = t(0.1); return np.sin(2 * np.pi * (700 + 900 * np.exp(-tt * 40)) * tt) * np.exp(-tt * 45) * 0.5
    if kind in ("thud", "hit"):
        tt = t(0.5); return np.sin(2 * np.pi * (45 + 90 * np.exp(-tt * 25)) * tt) * np.exp(-tt * (7 if kind == "thud" else 10)) * 0.9
    if kind == "stamp":
        tt = t(0.18); return (rng.uniform(-1, 1, len(tt)) * np.exp(-tt * 45) * 0.5 + np.sin(2 * np.pi * 90 * tt) * np.exp(-tt * 30) * 0.7)
    raise ValueError(kind)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("work"); ap.add_argument("slug"); ap.add_argument("sections")
    ap.add_argument("--voice-delay", type=float, default=0.35)
    a = ap.parse_args()
    w = Path(a.work)
    v, vsr = sf.read(w / "voice/voice.wav")
    v = resample_poly(v, SR, vsr) if vsr != SR else v
    v = np.concatenate([np.zeros(int(a.voice_delay * SR)), v])
    v = gain_to(v, VOICE_LUFS)
    sections = json.loads(Path(a.sections).read_text())
    total = max(s["end"] for s in sections)
    n = int(total * SR)
    v = np.pad(v, (0, max(0, n - len(v))))[:n]

    chiptune(a.slug, sections, w / "music.wav")
    m, _ = sf.read(w / "music.wav")
    m = np.pad(m, ((0, max(0, n - len(m))), (0, 0)))[:n]
    m = gain_to(m, MUSIC_LUFS)

    # duck: smoothed voice envelope → −DUCK_DB while speaking (attack 40 ms, release 350 ms)
    env = np.abs(v)
    win = int(0.03 * SR)
    env = np.convolve(env, np.ones(win) / win, mode="same")
    active = (env > 10 ** (-45 / 20)).astype(float)
    att, rel = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.35 * SR))
    sm = np.empty_like(active); acc = 0.0
    for i, x in enumerate(active):
        c = att if x > acc else rel
        acc = c * acc + (1 - c) * x
        sm[i] = acc
    duck = 10 ** (-DUCK_DB * sm / 20)
    m = m * duck[:, None]

    fx = np.zeros(n)
    rng = np.random.default_rng(7)
    for e in json.loads((w / "sfx.json").read_text()):
        s = synth(e["kind"], rng) * e.get("gain", 1) * 0.5
        i = int(e["t"] * SR)
        if i < n:
            fx[i:i + len(s)] += s[: n - i]

    mix = m + (v + fx)[:, None]
    mix = gain_to(mix, MASTER_LUFS)
    for _ in range(4):  # limit, re-normalise, until both targets hold
        mix = limiter(mix, TP_CEIL - 0.3)
        mix = gain_to(mix, MASTER_LUFS)
        if true_peak_db(mix) <= TP_CEIL:
            break
    mix = limiter(mix, TP_CEIL - 0.3)
    sf.write(w / "mix.wav", mix.astype(np.float32), SR, subtype="PCM_24")
    rep = {"master_lufs": round(lufs(mix), 2), "true_peak_dbtp": round(true_peak_db(mix), 2),
           "voice_lufs": round(lufs(v), 2), "music_lufs_unducked": MUSIC_LUFS, "duck_db": DUCK_DB,
           "music_lufs_in_mix": round(lufs(m), 2)}
    (w / "loudness.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep))


if __name__ == "__main__":
    main()
