// kit component group 'measure': dialScale, clockRing, bars, calendar, slider. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr, pop, DRAW, stroked, label, sun, scale } = K;
function dialScale(ctx, cx, top, w, lt, t0, value, { kg = 1000 } = {}) { // platform + dial; needle settles just under the 1 kg mark
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW) || 1;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stroked(ctx, () => { ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx + w / 2, top); }, w, p, { lw: 12, col: C.ink });
  stroked(ctx, () => { ctx.moveTo(cx, top); ctx.lineTo(cx, top + 32); }, 32, p, { lw: 10, col: C.ink });
  const r = 74, dy = top + 32 + r + 6;
  ctx.translate(cx, dy); ctx.scale(f, f);
  stroked(ctx, () => ctx.arc(0, 0, r, Math.PI * 0.75, Math.PI * 2.25 - 1e-4), r * Math.PI * 1.5, p, { lw: 10, col: C.ink });
  if (lt > t0 + DRAW) {
    for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5, big = i === 10; ctx.strokeStyle = big ? C.ember : C.ink; ctx.lineWidth = big ? 7 : 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); ctx.lineTo(Math.cos(a) * (r - (big ? 30 : 20)), Math.sin(a) * (r - (big ? 30 : 20))); ctx.stroke(); }
    font(ctx, 26, 'bold'); ctx.fillStyle = C.ember; ctx.textAlign = 'center'; ctx.fillText('1 kg', Math.cos(Math.PI * 2.25) * (r + 34), Math.sin(Math.PI * 2.25) * (r + 34) + 6); ctx.textAlign = 'left';
    const target = value / kg, sw = spr(lt - t0 - DRAW, 9, 0.35), frac = clamp(target * Math.min(1.25, sw), 0, 1.2);
    const a = Math.PI * 0.75 + frac * Math.PI * 1.5; ctx.strokeStyle = C.wreck; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (r - 24), Math.sin(a) * (r - 24)); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
  }
  ctx.restore();
  return dy + r;
}
function clockRing(ctx, cx, cy, r, lt, t0, hours, { col = C.mari } = {}) { // ring sweeps to N hours (of 30)
  const p = easeOut(prog(lt, t0, t0 + 0.5)), sweep = (hours / 30) * Math.PI * 2 * p;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = '#D9D3CC'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0.001, sweep)); ctx.stroke();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function bars(ctx, cx, base, lt, items, Hmax = 520) { // to scale: heights proportional to value (real data)
  const vmax = Math.max(...items.map(b => b.value)), n = items.length, gap = 80, bw = 160, x0 = cx - (n * bw + (n - 1) * gap) / 2;
  items.forEach((b, i) => { const p = easeOut(prog(lt, b.t0, b.t0 + 0.45)), h = Hmax * b.value / vmax * p, x = x0 + i * (bw + gap);
    ctx.save(); rr(ctx, x, base - h, bw, Math.max(1, h), 22); ctx.fillStyle = b.col || C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke();
    if (p > 0.95) { label(ctx, b.label, x + bw / 2, base - h - 24, 64, C.ink); if (b.sub) { font(ctx, 40, 'label'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(b.sub, x + bw / 2, base + 52); ctx.textAlign = 'left'; } } ctx.restore(); });
}
function calendar(ctx, cx, cy, lt, t0, mon, yr) { const p = easeInOut(prog(lt, t0, t0 + 0.4)); const draw = (m, y, sy) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.max(0.001, sy)); ctx.shadowColor = 'rgba(21,19,18,0.16)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, -140, -120, 280, 240, 30); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.save(); rr(ctx, -140, -120, 280, 240, 30); ctx.clip(); ctx.fillStyle = C.wreck; ctx.fillRect(-140, -120, 280, 64); ctx.restore(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; rr(ctx, -140, -120, 280, 240, 30); ctx.stroke(); font(ctx, 96, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m, 0, 36); font(ctx, 36, 'bold'); ctx.fillStyle = '#fff'; ctx.fillText(y, 0, -88); ctx.restore(); ctx.textAlign = 'left'; };
  if (p < 0.5) draw('NOV', '2026', 1 - p * 2); else draw(mon, yr, (p - 0.5) * 2); }

function slider(ctx, cx, y, w, lt, t0, from, to) { const p = easeInOut(prog(lt, t0, t0 + 0.5)), v = lerp(from, to, p);
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#D9D3CC'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
  ctx.strokeStyle = C.mari; ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - w / 2 + w * v, y); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx - w / 2 + w * v, y, 30, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke();
  sun(ctx, cx - w / 2 - 70, y, 16, lt + 9, 0, 0.4); sun(ctx, cx + w / 2 + 74, y, 22, lt + 9, 0, 1); ctx.restore(); }
const box_ = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter_ = (ctx, lt, t0) => { const f = K.pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
function ruler(ctx, lt, t0, w, n) { // ruler body slides up; n cm ticks across w px, major every 5
  if (lt < t0) return; const e = easeOut(prog(lt, t0, t0 + 0.3));
  ctx.save(); ctx.globalAlpha = clamp(e * 2); ctx.translate(0, lerp(60, 0, e));
  box_(ctx, -w / 2 - 30, -45, w + 60, 90, 12, C.mari, 7);
  for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n, l = i % 5 ? 22 : 44; ctx.beginPath(); ctx.moveTo(x, -45); ctx.lineTo(x, -45 + l); ctx.lineWidth = i % 5 ? 4 : 6; ctx.strokeStyle = C.ink; ctx.stroke();
    if (i < n) { ctx.beginPath(); ctx.moveTo(x + w / n / 2, -45); ctx.lineTo(x + w / n / 2, -33); ctx.lineWidth = 3; ctx.stroke(); } }
  ctx.restore();
}
function gauge(ctx, lt, t0, frac, markFrac, col) { // semicircle dial r 200, 21 ticks, needle sweeps 0 → frac; optional mark line
  ctx.save(); if (!enter_(ctx, lt, t0)) { ctx.restore(); return; }
  const r = 200, a0 = Math.PI, A = a => a0 + Math.PI * a;
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI, 2 * Math.PI); ctx.lineTo(r, 24); ctx.lineTo(-r, 24); ctx.closePath(); ctx.fillStyle = C.paperSoft; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  const p = easeOut(prog(lt, t0 + 0.1, t0 + 0.45)) * frac;
  ctx.beginPath(); ctx.arc(0, 0, r - 34, Math.PI, A(Math.max(p, 0.001))); ctx.lineWidth = 26; ctx.strokeStyle = col || C.mari; ctx.lineCap = 'butt'; ctx.stroke();
  for (let i = 0; i <= 20; i++) { const a = A(i / 20), l = i % 5 ? 16 : 30; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10)); ctx.lineTo(Math.cos(a) * (r - 10 - l), Math.sin(a) * (r - 10 - l)); ctx.lineWidth = i % 5 ? 4 : 7; ctx.strokeStyle = C.ink; ctx.stroke(); }
  if (markFrac !== undefined) { const a = A(markFrac); ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r + 14), Math.sin(a) * (r + 14)); ctx.lineTo(Math.cos(a) * (r - 70), Math.sin(a) * (r - 70)); ctx.lineWidth = 8; ctx.strokeStyle = C.wreck; ctx.lineCap = 'round'; ctx.stroke(); }
  const na = A(p); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(na) * (r - 50), Math.sin(na) * (r - 50)); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.ink; ctx.fill();
  ctx.restore();
}
function thermometer(ctx, lt, t0, level) { // bulb + tube; liquid rises then settles at `level` (0..1)
  ctx.save(); if (!enter_(ctx, lt, t0)) { ctx.restore(); return; }
  const lv = lerp(0, 0.75, easeOut(prog(lt, t0, t0 + 0.35))) + (level - 0.75) * easeInOut(prog(lt, t0 + 0.35, t0 + 0.9));
  box_(ctx, -38, -200, 76, 300, 38, C.paper);
  ctx.beginPath(); ctx.arc(0, 130, 62, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#5B8DEF'; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  const top = lerp(90, -176, clamp(lv)); ctx.fillStyle = '#5B8DEF'; ctx.fillRect(-16, top, 32, 110 - top);
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(38, -160 + i * 44); ctx.lineTo(62, -160 + i * 44); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); }
  ctx.restore();
}
Object.assign(K, { dialScale, clockRing, bars, calendar, slider , ruler, gauge, thermometer });
};
