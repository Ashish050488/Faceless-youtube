"""Procedural chiptune bed (original, seeded per slug) with energy sections.

    python -m audio.chiptune <slug> <sections.json> out.wav

sections.json: [{"start": 0.0, "end": 5.0, "energy": "intro"|"main"|"dark"|"lift"|"catch"|"verdict"}, ...]

Voices: 2 pulse waves (lead 25 % duty, harmony 12.5 %), triangle bass, noise drums,
like a 4-channel handheld sound chip. The melody is generated from a seeded random walk
over the chord tones, so every video gets its own tune (never game music).
"""
import hashlib
import json
import sys
import wave

import numpy as np
from scipy.signal import lfilter

SR = 48000
SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10], "dorian": [0, 2, 3, 5, 7, 9, 10]}
PROGS = {"major": [[0, 4, 5, 3], [0, 5, 3, 4], [3, 4, 0, 0]], "minor": [[0, 5, 2, 6], [0, 3, 4, 4]],
         "dorian": [[0, 3, 0, 3], [0, 6, 3, 4]]}


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pulse(f, n, duty):
    ph = (np.arange(n) * f / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)


def tri(f, n):
    ph = (np.arange(n) * f / SR) % 1.0
    return 4 * np.abs(ph - 0.5) - 1  # NES-style stepped triangle is overkill; smooth is fine


def env_adsr(n, a=0.004, d=0.06, s=0.55, r=0.03):
    e = np.full(n, s)
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n); e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na); e[na:na + nd] = np.linspace(1, s, nd)
    nr = min(nr, n); e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def noise_hit(n, decay, seed, lp):
    x = np.random.default_rng(seed).uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * decay)
    a = np.exp(-2 * np.pi * lp / SR)
    return lfilter([1 - a], [1, -a], x)


ENERGY = {  # lead, harmony, bass, hat, kick, snare, arp
    "intro":   (0.0, 0.0, 0.7, 0.4, 0.0, 0.0, 1.0),
    "main":    (1.0, 0.5, 1.0, 1.0, 1.0, 1.0, 0.0),
    "dark":    (0.0, 0.0, 1.0, 0.6, 1.0, 0.0, 1.0),
    "lift":    (1.0, 0.7, 1.0, 1.0, 1.0, 1.0, 0.6),
    "catch":   (0.0, 0.0, 0.8, 0.0, 0.6, 0.0, 0.0),
    "verdict": (1.0, 0.8, 1.0, 1.0, 1.0, 1.0, 0.0),
}


def render(slug, sections, out):
    h = int(hashlib.sha256(slug.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % 2**32)
    mode = "major"
    root = int(rng.integers(57, 63))  # A3..D4
    prog = PROGS[mode][int(rng.integers(len(PROGS[mode])))]
    bpm = int(rng.choice([118, 122, 126]))
    sc = SCALES[mode]
    step = 60 / bpm / 4  # 16th
    total = max(s["end"] for s in sections)
    n = int(total * SR) + SR
    ch = {k: np.zeros(n) for k in ("lead", "harm", "bass", "drum", "arp")}

    # one 2-bar motif (32 sixteenths) re-used with variation -> catchy, still original
    motif = []
    deg = 0
    for i in range(32):
        if i % 4 == 0 or rng.random() < 0.45:
            deg = int(np.clip(deg + rng.choice([-2, -1, 1, 2, 0, 3]), -2, 9))
            ln = int(rng.choice([1, 2, 2, 3]))
            motif.append((i, deg, ln))

    def energy_at(t):
        for s in sections:
            if s["start"] <= t < s["end"]:
                return ENERGY[s["energy"]], s["energy"]
        return ENERGY["main"], "main"

    nsteps = int(total / step) + 1
    for k in range(nsteps):
        t0 = k * step
        (lead, harm, bass, hat, kick, snare, arp), name = energy_at(t0)
        bar = k // 16
        chord_deg = prog[bar % 4]
        if name in ("dark", "catch"):
            chord_deg = [5, 5, 3, 4][bar % 4]  # minor-ish turn without changing key
        i0 = int(t0 * SR)
        L = int(step * SR)
        s16 = k % 16
        # bass: 8ths, root/fifth
        if bass and s16 % 2 == 0:
            m = root - 24 + sc[chord_deg % 7] + (7 if s16 in (6, 14) else 0)
            seg = tri(hz(m), 2 * L) * env_adsr(2 * L, d=0.08, s=0.7) * 0.32 * bass
            ch["bass"][i0:i0 + 2 * L] += seg[: max(0, min(2 * L, n - i0))]
        # drums
        if kick and s16 in (0, 8) or (kick and name in ("lift", "verdict") and s16 == 10):
            x = np.arange(int(0.12 * SR)) / SR
            seg = np.sin(2 * np.pi * (150 * np.exp(-x * 30) + 45) * x) * np.exp(-x * 28) * 0.55 * kick
            ch["drum"][i0:i0 + len(seg)] += seg[: n - i0]
        if snare and s16 in (4, 12):
            seg = noise_hit(int(0.14 * SR), 30, k, 5000) * 0.30 * snare
            ch["drum"][i0:i0 + len(seg)] += seg[: n - i0]
        if hat and s16 % 2 == 0:
            seg = noise_hit(int(0.03 * SR), 160, k + 7, 9000) * 0.09 * hat * (1.0 if s16 % 4 == 2 else 0.6)
            ch["drum"][i0:i0 + len(seg)] += seg[: n - i0]
        # arpeggio (12.5 % pulse) over chord tones
        if arp:
            o = [0, 2, 4, 7][s16 % 4]
            m = root + sc[(chord_deg + o) % 7] + 12 * ((chord_deg + o) // 7)
            seg = pulse(hz(m), L, 0.125) * env_adsr(L, d=0.04, s=0.3) * 0.07 * arp
            ch["arp"][i0:i0 + L] += seg[: max(0, min(L, n - i0))]
        # lead motif (+ harmony a third below)
        if lead:
            var = 2 if (bar // 2) % 2 else 0
            for (pos, d, ln) in motif:
                if pos == k % 32:
                    dd = chord_deg + d + (var if pos >= 16 else 0)
                    m = root + 12 + sc[dd % 7] + 12 * (dd // 7)
                    LL = ln * L
                    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * np.arange(LL) / SR)
                    ph = np.cumsum(hz(m) * vib / SR) % 1.0
                    seg = np.where(ph < 0.25, 1.0, -1.0) * env_adsr(LL) * 0.10 * lead
                    ch["lead"][i0:i0 + LL] += seg[: max(0, min(LL, n - i0))]
                    if harm:
                        dh = dd - 2
                        mh = root + 12 + sc[dh % 7] + 12 * (dh // 7)
                        seg = pulse(hz(mh), LL, 0.125) * env_adsr(LL) * 0.05 * harm
                        ch["harm"][i0:i0 + LL] += seg[: max(0, min(LL, n - i0))]

    mix = ch["lead"] + ch["harm"] + ch["bass"] + ch["drum"] + ch["arp"]
    a = np.exp(-2 * np.pi * 7000 / SR)  # tame square-wave fizz
    mix = lfilter([1 - a], [1, -a], mix)[: int(total * SR)]
    f = int(0.4 * SR)
    mix[:f] *= np.linspace(0, 1, f)
    mix[-f:] *= np.linspace(1, 0, f)
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.6
    d = int(0.009 * SR)
    st = np.stack([mix, np.concatenate([np.zeros(d), mix[:-d]])], 1)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype("<i2").tobytes())
    return {"slug": slug, "root": root, "mode": mode, "prog": prog, "bpm": bpm}


if __name__ == "__main__":
    print(json.dumps(render(sys.argv[1], json.load(open(sys.argv[2])), sys.argv[3])))
