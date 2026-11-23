"""TEST ONLY (owner 2026-11-23): Chatterbox (Resemble AI, MIT licence) narration to compare with locked Kokoro.
Same script parsing + sentence gaps as narrate.py. Usage:
  narrate_chatterbox.py <script.md> <out.wav> [voice_prompt.wav|-] [exaggeration] [cfg_weight]
voice_prompt '-' = Chatterbox's built-in voice; a wav = copy that voice (we use our own Kokoro output).
"""
import re, sys, time, numpy as np, soundfile as sf, librosa, torch
from chatterbox.tts import ChatterboxTTS

src, out = sys.argv[1], sys.argv[2]
prompt = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "-" else None
exag = float(sys.argv[4]) if len(sys.argv) > 4 else 0.6
cfg = float(sys.argv[5]) if len(sys.argv) > 5 else 0.4
GAP_LO, GAP_HI = 0.30, 0.42
lines = [l.strip() for l in open(src).read().split("\n")
         if l.strip() and not l.startswith(("#", "[", "v3", "Facts", "Pauses", "~"))]
sentences = [s for l in lines for s in re.split(r"(?<=[.?!])\s+(?=[A-Z])", l)]
torch.manual_seed(11)
model = ChatterboxTTS.from_pretrained(device="cpu")
SR = model.sr
rng = np.random.default_rng(11)
PAD = int(SR * 0.04)
chunks, t0 = [np.zeros(int(SR * 0.15), dtype=np.float32)], time.time()
for i, s in enumerate(sentences):
    a = model.generate(s, audio_prompt_path=prompt, exaggeration=exag, cfg_weight=cfg).squeeze(0).numpy().astype(np.float32)
    _, (b, e) = librosa.effects.trim(a, top_db=45, frame_length=512, hop_length=128)
    a = a[max(0, b - PAD): min(len(a), e + PAD * 2)]
    fade = int(SR * 0.012); a[-fade:] *= np.linspace(1, 0, fade)
    chunks.append(a)
    if i < len(sentences) - 1:
        chunks.append(np.zeros(int(SR * rng.uniform(GAP_LO, GAP_HI)), dtype=np.float32))
chunks.append(np.zeros(int(SR * 2.5), dtype=np.float32))
audio = np.concatenate(chunks)
audio = audio / (np.max(np.abs(audio)) + 1e-9) * 0.8
sf.write(out, audio, SR)
print(f"{out}: {len(audio)/SR:.1f}s audio, {len(sentences)} sentences, {time.time()-t0:.0f}s to make")
