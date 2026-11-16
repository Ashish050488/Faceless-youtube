"""Procedural music beds + synth SFX (brief §4: no commercial music, new bed per video).

    python -m audio.music bed <video_slug> <seconds> out.wav
    python -m audio.music sfx whoosh|pop|tick out.wav

Each bed is seeded from the slug; the registry stops re-use of a seed/key/progression combo.
"""
import hashlib
import json
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
REGISTRY = Path("state/music_registry.json")

SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10], "dorian": [0, 2, 3, 5, 7, 9, 10]}
PROGS = [[0, 5, 3, 4], [0, 3, 4, 4], [5, 3, 0, 4], [0, 4, 5, 3], [0, 2, 5, 4], [3, 4, 0, 0], [0, 5, 2, 3]]


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype("<i2").tobytes())


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pad_voice(f, n, rng):
    t = np.arange(n) / SR
    det = [0.997, 1.0, 1.003]
    s = sum(np.sin(2 * np.pi * f * d * t + rng.uniform(0, 6.28)) for d in det)
    s += 0.3 * np.sin(2 * np.pi * f * 2 * t)
    a = int(0.25 * n)
    env = np.ones(n)
    env[:a] = np.linspace(0, 1, a)
    env[-a:] = np.linspace(1, 0, a)
    return s * env / 3


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # vectorised one-pole via lfilter-free recursion in chunks would need scipy; keep simple
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc
        y[i] = acc
    return y


def choose(slug):
    reg = json.loads(REGISTRY.read_text()) if REGISTRY.exists() else {"beds": []}
    used = {(b["root"], b["scale"], b["prog"], b["bpm"]) for b in reg["beds"]}
    h = int(hashlib.sha256(slug.encode()).hexdigest(), 16)
    for k in range(1000):
        rng = np.random.default_rng(h + k)
        cfg = {"root": int(rng.integers(45, 57)), "scale": str(rng.choice(list(SCALES))),
               "prog": int(rng.integers(len(PROGS))), "bpm": int(rng.choice([70, 76, 82, 88, 94, 100])),
               "seed": int((h + k) % 2**32)}
        if (cfg["root"], cfg["scale"], cfg["prog"], cfg["bpm"]) not in used:
            return cfg, reg
    raise RuntimeError("bed space exhausted")


def bed(slug, seconds, out):
    cfg, reg = choose(slug)
    rng = np.random.default_rng(cfg["seed"])
    sc, prog = SCALES[cfg["scale"]], PROGS[cfg["prog"]]
    beat = 60 / cfg["bpm"]
    bar = int(4 * beat * SR)
    n = int(seconds * SR)
    mix = np.zeros(n + bar)
    pos, i = 0, 0
    while pos < n:
        deg = prog[i % len(prog)]
        chord = [cfg["root"] + sc[(deg + o) % 7] + 12 * ((deg + o) // 7) for o in (0, 2, 4)]
        seg = sum(pad_voice(midi_hz(m), bar * 2, rng) for m in chord) * 0.25  # overlap bars for smooth pad
        seg += 0.35 * pad_voice(midi_hz(chord[0] - 12), bar * 2, rng)
        end = min(pos + bar * 2, len(mix))
        mix[pos:end] += seg[: end - pos]
        # soft pluck arpeggio on 8ths
        for s in range(8):
            if rng.random() < 0.55:
                m = chord[rng.integers(3)] + 12
                ln = int(beat / 2 * SR)
                t = np.arange(ln) / SR
                pl = np.sin(2 * np.pi * midi_hz(m) * t) * np.exp(-t * 9) * 0.18
                st = pos + s * ln
                e = min(st + ln, len(mix))
                mix[st:e] += pl[: e - st]
        pos += bar
        i += 1
    mix = mix[:n]
    mix = lowpass(mix, 4500)
    fade = int(2 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.5
    # stereo widen with tiny delay
    d = int(0.012 * SR)
    st = np.stack([mix, np.concatenate([np.zeros(d), mix[:-d]])], 1)
    write_wav(out, st)
    reg["beds"].append({"slug": slug, **{k: cfg[k] for k in ("root", "scale", "prog", "bpm", "seed")}})
    REGISTRY.write_text(json.dumps(reg, indent=1))
    return cfg


def sfx(kind, out):
    if kind == "whoosh":
        n = int(0.6 * SR)
        noise = np.random.default_rng(1).standard_normal(n)
        env = np.sin(np.linspace(0, np.pi, n)) ** 2
        x = lowpass(noise * env, 1800) * 0.6
    elif kind == "pop":
        n = int(0.12 * SR)
        t = np.arange(n) / SR
        x = np.sin(2 * np.pi * (900 - 5000 * t) * t) * np.exp(-t * 40) * 0.7
    elif kind == "tick":
        n = int(0.05 * SR)
        t = np.arange(n) / SR
        x = np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 120) * 0.5
    else:
        raise ValueError(kind)
    write_wav(out, x)


if __name__ == "__main__":
    if sys.argv[1] == "bed":
        print(bed(sys.argv[2], float(sys.argv[3]), sys.argv[4]))
    elif sys.argv[1] == "sfx":
        sfx(sys.argv[2], sys.argv[3])
