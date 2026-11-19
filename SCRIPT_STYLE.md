# How our scripts should sound — natural, conversational, emotional (owner 2026-11-19)

Read before writing script.md. The voice engine (Kokoro) reads exactly what we write, so naturalness starts in the words.

## Why (research)
- **Talk TO the viewer.** Mayer's *personalization principle*: conversational style ("you", "your", "let's", "I") beats
  formal style — 10 of 10 / 11 of 11 tests in his reviews, median effect d ≈ 1.1–1.3 (Mayer, *Multimedia Learning*);
  independent meta-analysis (Ginns et al. 2013) finds a smaller but positive (medium) effect. Don't overdo it.
- **High-arousal emotion spreads.** Content that triggers awe (positive) or anger/anxiety (negative) was shared more;
  low-arousal content (sadness, flat facts) less (Berger & Milkman 2012, ~7,000 NYT articles + experiments).
  → Every Short needs one "wow" beat (awe/surprise) and one "wait, what?" beat (mild outrage/doubt = THE CATCH).
- **Punctuation drives TTS prosody.** Synthesizers pause at commas/periods and fall back to flat, "statistically most
  likely" intonation when cues are missing (Pouw, Alishahi & Zuidema, CoNLL 2025; Hirschberg on TTS prosody: sentences
  ending in "." all get the same declarative contour → monotony). → Use short phrases, commas, question marks, and vary
  sentence endings (".", "?", "!").

## Rules (every script)
1. **You-language:** ≥ 3 "you/your" per Short. Ask the viewer at least twice ("Would you…?", "Guess what…?").
2. **Contractions always:** it's, that's, here's, you'd, doesn't, won't. Never "it is / does not" unless for stress.
3. **Short lines:** 5–12 words per sentence; one idea per sentence; a comma every 4–8 words in longer ones.
4. **Vary the music of sentences:** mix statements, questions and one exclamation. Never 3 sentences in a row that end with ".".
5. **One reaction word per section** (from the bank below) — at the START of a sentence, followed by a comma or "?".
6. **Emotion arc (Shorts):** hook = surprise/awe → reveal = curiosity → numbers = "wow" → THE CATCH = doubt/mild outrage
   → verdict = confident → loop = direct question.
7. **Sensory, concrete words** over abstract ones: "fits in your palm", "lighter than two coins", "quieter than a fridge"
   (only when the comparison is factually true and sourced).
8. **Numbers like a person says them,** and round where the exact figure isn't the point ("almost forty-five hundred").
   Give a number a reference: "forty-seven grams — about two AA batteries" (true comparisons only).
9. **No hype words that overclaim** (YouTube "misleading" policy + our honesty rule): no "insane", "game-changer",
   "you won't believe", "destroyed", "killer". Emotion comes from the real fact, not from adjectives.
10. **Read it out loud test:** if a sentence needs a breath in the middle, split it.

## Reaction / emotion word bank (pick 3–5 per Short, never the same opener twice in a row)
- Surprise / awe: Wait. · Okay, so… · Honestly? · Here's the wild part. · Get this. · No joke. · That's tiny. · That's a lot.
- Doubt / catch: Hmm. · But… · Here's the catch. (brand line — keep) · Sounds great, right? · Not so fast.
- Agreement / landing: Yeah. · Fair. · Makes sense. · So basically… · Bottom line?
- Viewer pull: Picture this. · You'd think… · Guess what? · Would you…? · Be honest.

## Example (sow008, before → after)
Before: "Razer wants ninety dollars more, to save you two grams. Meet the Carbon Fiber Viper V4 Pro and DeathAdder V4 Pro.
Real woven carbon shells, two forty-nine ninety-nine each."
After: "Razer wants ninety dollars more… to save you two grams. Wait, two grams? Meet the new Carbon Fiber Viper and
DeathAdder. Real woven carbon. And yeah, they're two fifty each."

`python -m meta.check_package <slug>` warns when a script misses the you-language, contraction, sentence-length or
question rules.
