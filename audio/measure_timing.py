import sys, numpy as np, soundfile as sf, librosa
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
a, sr = sf.read(sys.argv[1]); a = a.astype(np.float32)
if a.ndim > 1: a = a.mean(1)
a16 = librosa.resample(a, orig_sr=sr, target_sr=16000)
segs, _ = m.transcribe(a16, language="en", word_timestamps=True)
W = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
sent, comma = [], []
for (t, s, e), (t2, s2, e2) in zip(W, W[1:]):
    g = s2 - e
    if t[-1:] in ".?!": sent.append(g)
    elif t[-1:] in ",;:": comma.append(g)
speak = sum(e - s for _, s, e in W)
print(dict(articulation_wpm=round(len(W) / speak * 60), overall_wpm=round(len(W) / (W[-1][2] - W[0][1]) * 60),
           sentence_gap=np.percentile(sent, [25, 50, 75]).round(2).tolist(),
           comma_gap=np.percentile(comma, [25, 50, 75]).round(2).tolist() if comma else None,
           last_words=" ".join(t for t, _, _ in W[-5:]), tail=round(len(a) / sr - W[-1][2], 2)))
