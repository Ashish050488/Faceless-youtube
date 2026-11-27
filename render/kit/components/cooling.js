// kit component group 'cooling': extreme-cooling explainers (our own flat drawings), drawn around (0,0); render.js
// places them with x, y, s. ln2Pot = copper liquid-nitrogen pot clamped on a bare GPU/CPU die (side view): a dewar
// flask tips in and pours from `pourAt`, the pot fills, white vapour curls spill over the rim and roll down the sides,
// and a frost band creeps up the pot. Use for overclocking records, LN2 / extreme cooling, "it ran on ice".
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop } = K;
const COPPER = '#C8743A', COPPER_HI = '#E9A06A', COPPER_LO = '#9C5526', LN2 = '#BFE3FF', PCB = '#2F4A3A';
const box = (ctx, x, y, w, h, r, fill, lw = 8) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const rnd = i => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
// one vapour puff: soft white blob (alpha ≤ 0.45 so it never counts as an overlap)
function puff(ctx, x, y, r, a) { if (a <= 0 || r <= 0) return; ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = `rgba(255,255,255,${0.48 * a})`; ctx.fill(); }
function ln2Pot(ctx, lt, t0, { pourAt = null, label = '', frost = true } = {}) {
  const f = pop(lt, t0); if (!f) return;
  ctx.save(); ctx.scale(f, f);
  const pw = 230, top = -230, bot = 150; // pot body
  const fill = pourAt === null ? 1 : easeInOut(prog(lt, pourAt + 0.25, pourAt + 1.4)); // liquid level 0..1
  const cold = pourAt === null ? 1 : clamp((lt - pourAt) / 1.6);                     // frost + vapour strength
  // board + die
  box(ctx, -300, bot + 52, 600, 46, 8, PCB, 7);
  for (let i = 0; i < 14; i++) { ctx.fillStyle = '#C9A227'; ctx.fillRect(-270 + i * 40, bot + 92, 22, 10); } // edge contacts
  box(ctx, -95, bot + 30, 190, 24, 4, C.stone, 6);                                  // die / IHS
  // base plate + body (copper, with vertical highlight bands)
  box(ctx, -pw / 2 - 40, bot - 8, pw + 80, 40, 8, COPPER_LO, 7);
  ctx.save(); ctx.beginPath(); rr(ctx, -pw / 2, top, pw, bot - top, 14); ctx.fillStyle = COPPER; ctx.fill(); ctx.clip();
  ctx.fillStyle = COPPER_HI; ctx.fillRect(-pw / 2 + 28, top, 26, bot - top); ctx.fillRect(-pw / 2 + 64, top, 10, bot - top);
  ctx.fillStyle = COPPER_LO; ctx.fillRect(pw / 2 - 40, top, 40, bot - top);
  for (let i = 1; i < 5; i++) { ctx.fillStyle = 'rgba(21,19,18,0.18)'; ctx.fillRect(-pw / 2, top + i * (bot - top) / 5, pw, 5); } // machined rings
  if (frost && cold > 0) { // frost band creeps up from the base: jagged white edge
    const fh = (bot - top) * 0.42 * easeOut(cold); ctx.beginPath(); ctx.moveTo(-pw / 2, bot);
    for (let i = 0; i <= 12; i++) { const x = -pw / 2 + i * pw / 12; ctx.lineTo(x, bot - fh + (i % 2 ? 14 : -10) * (0.6 + 0.4 * rnd(i))); }
    ctx.lineTo(pw / 2, bot); ctx.closePath(); ctx.fillStyle = 'rgba(244,250,255,0.92)'; ctx.fill();
    for (let i = 0; i < 9; i++) { const x = -pw / 2 + 18 + rnd(i + 7) * (pw - 36), y = bot - rnd(i + 3) * fh * 0.9; // frost sparkles
      ctx.save(); ctx.translate(x, y); ctx.strokeStyle = '#9CCBEF'; ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); } ctx.restore(); } }
  ctx.restore();
  ctx.beginPath(); rr(ctx, -pw / 2, top, pw, bot - top, 14); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  // open top: dark mouth + liquid surface with bubbles
  ctx.beginPath(); ctx.ellipse(0, top, pw / 2, 30, 0, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.inkSoft; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  if (fill > 0) { ctx.beginPath(); ctx.ellipse(0, top + 4, (pw / 2 - 14) * fill, 20 * fill, 0, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = LN2; ctx.fill();
    for (let i = 0; i < 6; i++) { const ph = (lt * 2.2 + rnd(i)) % 1, bx = (rnd(i + 20) - 0.5) * (pw - 60) * fill; ctx.beginPath(); ctx.arc(bx, top + 4 - ph * 8, 4 + 5 * ph, 0, 2 * Math.PI - 1e-4); ctx.lineWidth = 3; ctx.strokeStyle = '#7FB8E6'; ctx.stroke(); } }
  // dewar flask tips in from the upper right and pours (stream = pale blue)
  if (pourAt !== null && lt >= pourAt - 0.3) { const a = easeOut(prog(lt, pourAt - 0.3, pourAt + 0.15)), out = easeInOut(prog(lt, pourAt + 1.5, pourAt + 1.9));
    if (out < 1) { ctx.save(); ctx.globalAlpha = 1 - out; ctx.translate(lerp(380, 215, a), lerp(-520, -470, a)); ctx.rotate(lerp(0, -2.05, a));
      box(ctx, -60, -150, 120, 230, 26, '#D9DEE4', 8); box(ctx, -36, -186, 72, 40, 8, C.stone, 7);       // flask + neck
      ctx.fillStyle = '#AEB7C1'; ctx.fillRect(-52, -60, 104, 16); ctx.fillRect(-52, 10, 104, 16);       // bands
      ctx.restore();
      if (a >= 1 && lt < pourAt + 1.5) { const sx = 82, sy = -400; ctx.save(); ctx.globalAlpha = 1 - out; ctx.beginPath(); ctx.moveTo(sx, sy);
        ctx.quadraticCurveTo(sx - 10, (sy + top) / 2, 20, top - 6); ctx.lineWidth = 16; ctx.strokeStyle = LN2; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#7FB8E6'; ctx.stroke(); ctx.restore(); } } }
  // vapour: puffs rise off the mouth, curl over the rim and roll down both sides (looping)
  if (cold > 0) for (let i = 0; i < 16; i++) { const ph = (lt * 0.55 + i / 16) % 1, side = i % 2 ? 1 : -1, j = rnd(i);
    let x, y; if (ph < 0.3) { const q = ph / 0.3; x = side * lerp(20 + 50 * j, pw / 2 + 10, q); y = top - 30 - 40 * Math.sin(q * Math.PI); }
    else { const q = (ph - 0.3) / 0.7; x = side * (pw / 2 + 18 + 40 * q + 12 * Math.sin(q * 6 + i)); y = lerp(top - 10, bot + 20, q); }
    puff(ctx, x, y, lerp(30, 60, ph) * (0.8 + 0.4 * j), cold * Math.sin(Math.PI * ph)); }
  if (label) { font(ctx, 60, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, 0, bot + 190); ctx.textAlign = 'left'; }
  ctx.restore();
}
Object.assign(K, { ln2Pot });
};
