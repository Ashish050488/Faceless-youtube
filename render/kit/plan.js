// Cues script: plan.json (named events tied to spoken words) + words.json → cues.json (event → second).
//   node render/kit/plan.js <words.json> <plan.json> <cues.json>
// plan.json: [{"cue": "price", "word": "dollars", "nth": 0, "offset": 0.0, "line": 12, "sfx": "tick", "gain": 0.6}]
//   word = first word starting with that token, searched from the start of script line `line` (or of the script);
//   nth = skip that many earlier matches; offset in seconds (negative = before the word); "end": true = word end.
// In cues.kit.json any time ref can be "@price" (+ optional offset: ["@price", 0, -0.1]); render.js adds each event's
// sfx to sfx.json, so sound and picture use the same second.
const fs = require('fs');
const nw = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function resolvePlan(words, plan) {
  const out = {};
  for (const e of plan) {
    let i = e.line !== undefined ? words.findIndex(w => w.line === e.line) : 0;
    if (i < 0) throw new Error(`plan "${e.cue}": no line ${e.line}`);
    for (let k = 0; k <= (e.nth || 0); k++) { if (k) i++; while (i < words.length && !nw(words[i].w).startsWith(nw(e.word))) i++; }
    if (i >= words.length) throw new Error(`plan "${e.cue}": word "${e.word}" (nth ${e.nth || 0}) not found`);
    out[e.cue] = +((e.end ? words[i].end : words[i].start) + (e.offset || 0)).toFixed(3);
  }
  return out;
}
module.exports = { resolvePlan };
if (require.main === module) {
  const [w, p, o] = process.argv.slice(2);
  const cues = resolvePlan(JSON.parse(fs.readFileSync(w)), JSON.parse(fs.readFileSync(p)));
  fs.writeFileSync(o, JSON.stringify(cues, null, 1)); console.log(Object.keys(cues).length, 'cues →', o);
}
