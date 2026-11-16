"""Narration matched to the benchmark's measured timing.
- articulation (speaking) rate ~170-178 wpm  -> tune `speed`
- sentence gaps 0.58-0.72 s (measured end-of-word to start-of-word) -> engine silence trimmed, exact gap inserted
- commas left to the model (ours measured 0.44 s vs benchmark 0.28-0.54 s)
- 2.5 s tail after the last word (benchmark 2.1-3.0 s)
"""
import re, sys, numpy as np, soundfile as sf, librosa
from kokoro import KPipeline

src, voice, speed, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4]
SR = 24000
GAP_LO, GAP_HI = float(sys.argv[5]), float(sys.argv[6])
lines = [l.strip() for l in open(src).read().split("\n")
         if l.strip() and not l.startswith(("#", "[", "v3", "Facts", "Pauses", "~"))]
sentences = [s for l in lines for s in re.split(r"(?<=[.?!])\s+(?=[A-Z])", l)]
pipe = KPipeline(lang_code="a")
rng = np.random.default_rng(11)
PAD = int(SR * 0.04)          # keep 40 ms around speech so consonants/breaths aren't clipped
out_chunks = [np.zeros(int(SR * 0.15), dtype=np.float32)]   # tiny lead-in
for i, s in enumerate(sentences):
    a = np.concatenate([x for _, _, x in pipe(s, voice=voice, speed=speed)]).astype(np.float32)
    _, (b, e) = librosa.effects.trim(a, top_db=45, frame_length=512, hop_length=128)
    a = a[max(0, b - PAD): min(len(a), e + PAD * 2)]          # extra pad at the end for final consonants
    fade = int(SR * 0.012); a[-fade:] *= np.linspace(1, 0, fade)
    out_chunks.append(a)
    if i < len(sentences) - 1:
        out_chunks.append(np.zeros(int(SR * rng.uniform(GAP_LO, GAP_HI)), dtype=np.float32))
out_chunks.append(np.zeros(int(SR * 2.5), dtype=np.float32))  # tail / headroom after the last word
audio = np.concatenate(out_chunks)
audio = audio / (np.max(np.abs(audio)) + 1e-9) * 0.8
sf.write(out, audio, SR)
print(f"{out}: {len(audio)/SR:.1f}s, {len(sentences)} sentences")
