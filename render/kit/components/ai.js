// kit component group 'ai': AI-hardware explainers (our own flat drawings), drawn around (0,0); render.js places
// them with x, y, s. ventGrid (square grid of rounded holes on a dark plate; rows light up bottom→top with a glow and
// a counter label rolls with them — vents, speaker grilles, perforated cases), paramCloud (cluster of nodes + links
// that grows outward with t — AI model size, neural nets, parameters).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop } = K;
function ventGrid(ctx, lt, t0, litAt, { cols = 10, rows = 10, size = 520, label = '', dur = 1.0 } = {}) {
  const f = pop(lt, t0); if (!f) return;
  ctx.save(); ctx.scale(f, f);
  const S = size, pad = 34, g = (S - 2 * pad) / cols, gr = (S - 2 * pad) / rows;
  ctx.beginPath(); rr(ctx, -S / 2, -S / 2, S, S, 34); ctx.fillStyle = C.inkSoft; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); rr(ctx, -S / 2 + 12, -S / 2 + 12, S - 24, S - 24, 26); ctx.lineWidth = 3; ctx.strokeStyle = C.stone; ctx.stroke(); // bevel
  const lit = lt >= litAt ? clamp((lt - litAt) / dur) : 0; // fraction of rows lit (bottom → top)
  for (let j = 0; j < rows; j++) { const rowOn = clamp(lit * rows - (rows - 1 - j)); // 0..1 for this row
    for (let i = 0; i < cols; i++) { const x = -S / 2 + pad + i * g + 5, y = -S / 2 + pad + j * gr + 5, w = g - 10, h = gr - 10;
      if (rowOn > 0) { ctx.save(); ctx.shadowColor = 'rgba(255,178,36,0.6)'; ctx.shadowBlur = 18 * rowOn; ctx.beginPath(); rr(ctx, x, y, w, h, 8); ctx.fillStyle = `rgba(255,${Math.round(lerp(120, 214, rowOn))},${Math.round(lerp(40, 120, rowOn))},${0.25 + 0.75 * rowOn})`; ctx.fill(); ctx.restore(); }
      else { ctx.beginPath(); rr(ctx, x, y, w, h, 8); ctx.fillStyle = '#0B0A09'; ctx.fill(); }
      ctx.beginPath(); rr(ctx, x, y, w, h, 8); ctx.lineWidth = 2.5; ctx.strokeStyle = C.inkLine; ctx.stroke(); } }
  // light sweep across the plate once lit
  if (lit > 0) { const sx = lerp(-S, S, (lt - litAt) % 2.4 / 2.4); ctx.save(); ctx.beginPath(); rr(ctx, -S / 2, -S / 2, S, S, 34); ctx.clip();
    const gd = ctx.createLinearGradient(sx - 80, 0, sx + 80, 0); gd.addColorStop(0, 'rgba(255,255,255,0)'); gd.addColorStop(0.5, 'rgba(255,255,255,0.10)'); gd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gd; ctx.fillRect(-S / 2, -S / 2, S, S); ctx.restore(); }
  if (label) { font(ctx, 60, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, 0, S / 2 + 86); }
  ctx.restore();
}
// deterministic pseudo-random
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function paramCloud(ctx, lt, t0, { n = 60, r = 300, label = '', dur = 1.2 } = {}) {
  if (lt < t0) return; const t = clamp((lt - t0) / dur);
  const pts = []; for (let i = 0; i < n; i++) { const a = i * 2.39996 + rnd(i) * 0.6, d = Math.sqrt((i + 0.5) / n) * r * (0.85 + 0.15 * rnd(i + 99));
    pts.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.78, d: d / r, k: i }); }
  ctx.save();
  const vis = p => clamp((t * 1.25 - p.d) / 0.25); // grows outward from the centre
  ctx.lineCap = 'round';
  for (let i = 1; i < n; i++) { const p = pts[i]; // each node links to its 2 nearest inner nodes
    const near = pts.slice(0, i).map(q => [Math.hypot(p.x - q.x, p.y - q.y), q]).sort((a, b) => a[0] - b[0]).slice(0, 2);
    for (const [, q] of near) { const v = Math.min(vis(p), vis(q)); if (v <= 0) continue;
      ctx.globalAlpha = 0.9 * v; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(lerp(q.x, p.x, v), lerp(q.y, p.y, v)); ctx.lineWidth = 5; ctx.strokeStyle = C.stone; ctx.stroke(); } }
  for (const p of pts) { const v = vis(p); if (v <= 0) continue; const e = easeOut(v), br = 1 + 0.06 * Math.sin(lt * 3 + p.k);
    ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(p.x, p.y, (p.k % 5 ? 9 : 15) * e * br, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = p.k % 5 ? C.mari : C.ember; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke(); }
  if (label) { ctx.globalAlpha = clamp(t * 3); font(ctx, 64, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, 0, r * 0.78 + 100); }
  ctx.restore();
}
Object.assign(K, { ventGrid, paramCloud });
};
