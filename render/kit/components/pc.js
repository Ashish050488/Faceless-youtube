// kit component group 'pc': flat 2-D computer parts (our own drawings). All drawn around (0,0); render.js places
// them with x, y, s. chip (package + pins, die cells fill one by one; mode 'gpu' = dense green core field),
// ram (sticks slide down and stack), fan (blades spin up), gauge (needle sweeps to value/max, optional mark),
// port (USB-A or 3.5 mm jack; red cross draws on), ruler (cm ticks, slides up), reviewCard (lines + tick),
// thermo (thermometer, liquid settles low), miniBox (generic unbranded mini PC), slash (red strike line).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop, DRAW, stroked } = K;
const GREEN = '#76B900'; // NVIDIA green: only inside the chip
const box = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter = (ctx, lt, t0) => { const f = pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };

function chip(ctx, lt, t0, fillAt, { n = 20, cols = 5, mode = 'cpu' } = {}) {
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  const S = 360;
  for (let i = 0; i < 9; i++) { const o = -S / 2 + 40 + i * (S - 80) / 8; // pins, four sides
    for (const [x, y, w, h] of [[o - 8, -S / 2 - 34, 16, 34], [o - 8, S / 2, 16, 34], [-S / 2 - 34, o - 8, 34, 16], [S / 2, o - 8, 34, 16]]) box(ctx, x, y, w, h, 4, C.mari, 5); }
  box(ctx, -S / 2, -S / 2, S, S, 28, C.inkSoft);
  box(ctx, -S / 2 + 36, -S / 2 + 36, S - 72, S - 72, 14, C.paperSoft, 6);
  const D = S - 112, x0 = -D / 2, y0 = -D / 2;
  if (mode === 'gpu') { // dense field: 24 × 24 cells sweep in from the centre
    const g = 24, c = D / g; for (let i = 0; i < g; i++) for (let j = 0; j < g; j++) {
      const d = Math.hypot(i - g / 2 + 0.5, j - g / 2 + 0.5) / (g * 0.71), on = lt > fillAt + d * 0.5;
      ctx.fillStyle = on ? GREEN : C.paperLine; ctx.fillRect(x0 + i * c + 1.5, y0 + j * c + 1.5, c - 3, c - 3); }
  } else { const rows = Math.ceil(n / cols), cw = D / cols, ch = D / rows;
    for (let k = 0; k < n; k++) { const i = k % cols, j = Math.floor(k / cols), on = lt > fillAt + k * 0.03, f = on ? easeOut(prog(lt, fillAt + k * 0.03, fillAt + k * 0.03 + 0.12)) : 0;
      box(ctx, x0 + i * cw + 6, y0 + j * ch + 6, cw - 12, ch - 12, 6, on ? C.mari : C.paper, 4);
      if (f > 0 && f < 1) { ctx.globalAlpha = 1 - f; box(ctx, x0 + i * cw, y0 + j * ch, cw, ch, 8, C.mari, 0); ctx.globalAlpha = 1; } } }
  ctx.restore();
}
function ram(ctx, lt, t0, n = 4) { // sticks drop in one by one and stack (each: PCB, 8 chips, gold contacts, notch)
  for (let k = 0; k < n; k++) { const tk = t0 + k * 0.12; if (lt < tk) continue;
    const e = easeOut(prog(lt, tk, tk + 0.22)), y = lerp(-200, 0, e) + k * 92 - (n - 1) * 46;
    ctx.save(); ctx.globalAlpha = clamp(e * 2); ctx.translate(0, y);
    box(ctx, -230, -36, 460, 72, 8, '#3F8F6B', 6);
    for (let c = 0; c < 8; c++) box(ctx, -206 + c * 52, -26, 40, 30, 3, C.inkSoft, 3);
    ctx.fillStyle = C.mari; for (let c = 0; c < 26; c++) if (c !== 11) ctx.fillRect(-214 + c * 16.6, 16, 10, 14);
    ctx.restore(); }
}
function fan(ctx, lt, t0) { // square frame, 7 blades; spins up after entering
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  box(ctx, -170, -170, 340, 340, 40, C.paperSoft);
  for (const [x, y] of [[-135, -135], [135, -135], [-135, 135], [135, 135]]) { ctx.beginPath(); ctx.arc(x, y, 12, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.stone; ctx.fill(); }
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
  const s = lt - t0, ang = s < 0.6 ? 6 * s * s : 3.6 * 0.6 + 12 * (s - 0.6);
  ctx.save(); ctx.rotate(ang);
  for (let b = 0; b < 7; b++) { ctx.save(); ctx.rotate(b * 2 * Math.PI / 7); ctx.beginPath(); ctx.moveTo(30, -10);
    ctx.bezierCurveTo(80, -60, 140, -40, 138, 10); ctx.bezierCurveTo(110, 20, 70, 20, 30, 18); ctx.closePath();
    ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore(); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, 0, 40, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.inkSoft; ctx.fill();
  ctx.restore();
}
function gauge(ctx, lt, t0, frac, markFrac, col) { // semicircle dial r 200, 21 ticks, needle sweeps 0 → frac; optional mark line
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
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
function cross(ctx, lt, at, h) { if (lt < at) return; const p = prog(lt, at, at + DRAW);
  stroked(ctx, () => { ctx.moveTo(-h, -h); ctx.lineTo(h, h); }, h * 2.9, p, { lw: 16, col: C.wreck });
  stroked(ctx, () => { ctx.moveTo(h, -h); ctx.lineTo(-h, h); }, h * 2.9, prog(lt, at + 0.08, at + 0.08 + DRAW), { lw: 16, col: C.wreck }); }
function port(ctx, lt, t0, kind, crossAt) { // panel with a USB-A socket or a 3.5 mm jack; red cross on crossAt
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  box(ctx, -150, -110, 300, 220, 30, C.paperSoft);
  if (kind === 'jack') { ctx.beginPath(); ctx.arc(0, 0, 62, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.stone; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.ink; ctx.fill(); }
  else { box(ctx, -95, -46, 190, 92, 8, C.ink, 6); box(ctx, -78, -30, 156, 30, 4, C.paper, 4);
    ctx.fillStyle = C.mari; for (let i = 0; i < 4; i++) ctx.fillRect(-62 + i * 36, -26, 18, 18); }
  cross(ctx, lt, crossAt, 92);
  ctx.restore();
}
function ruler(ctx, lt, t0, w, n) { // ruler body slides up; n cm ticks across w px, major every 5
  if (lt < t0) return; const e = easeOut(prog(lt, t0, t0 + 0.3));
  ctx.save(); ctx.globalAlpha = clamp(e * 2); ctx.translate(0, lerp(60, 0, e));
  box(ctx, -w / 2 - 30, -45, w + 60, 90, 12, C.mari, 7);
  for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n, l = i % 5 ? 22 : 44; ctx.beginPath(); ctx.moveTo(x, -45); ctx.lineTo(x, -45 + l); ctx.lineWidth = i % 5 ? 4 : 6; ctx.strokeStyle = C.ink; ctx.stroke();
    if (i < n) { ctx.beginPath(); ctx.moveTo(x + w / n / 2, -45); ctx.lineTo(x + w / n / 2, -33); ctx.lineWidth = 3; ctx.stroke(); } }
  ctx.restore();
}
function reviewCard(ctx, lt, t0, tickAt) { // paper card with headline bar + text lines; green-free tick in a circle
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  box(ctx, -130, -160, 260, 320, 22, C.paper);
  box(ctx, -96, -124, 192, 30, 8, C.ink, 0);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = C.paperLine; ctx.fillRect(-96, -70 + i * 28, i === 4 ? 120 : 192, 12); }
  if (lt >= tickAt) { ctx.beginPath(); ctx.arc(70, 110, 54, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
    stroked(ctx, () => { ctx.moveTo(44, 110); ctx.lineTo(64, 132); ctx.lineTo(98, 88); }, 90, prog(lt, tickAt, tickAt + DRAW), { lw: 12, col: C.ink }); }
  ctx.restore();
}
function thermo(ctx, lt, t0, level) { // bulb + tube; liquid rises then settles at `level` (0..1)
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  const lv = lerp(0, 0.75, easeOut(prog(lt, t0, t0 + 0.35))) + (level - 0.75) * easeInOut(prog(lt, t0 + 0.35, t0 + 0.9));
  box(ctx, -38, -200, 76, 300, 38, C.paper);
  ctx.beginPath(); ctx.arc(0, 130, 62, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#5B8DEF'; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  const top = lerp(90, -176, clamp(lv)); ctx.fillStyle = '#5B8DEF'; ctx.fillRect(-16, top, 32, 110 - top);
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(38, -160 + i * 44); ctx.lineTo(62, -160 + i * 44); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); }
  ctx.restore();
}
function miniBox(ctx, lt, t0) { // generic unbranded mini PC: flat box, top face, dot grille, power button
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  ctx.beginPath(); ctx.moveTo(-200, -70); ctx.lineTo(-150, -130); ctx.lineTo(250, -130); ctx.lineTo(200, -70); ctx.closePath(); ctx.fillStyle = '#D9D4CE'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(200, -70); ctx.lineTo(250, -130); ctx.lineTo(250, 30); ctx.lineTo(200, 90); ctx.closePath(); ctx.fillStyle = C.stone; ctx.fill(); ctx.stroke();
  box(ctx, -200, -70, 400, 160, 10, '#C9C3BC', 8);
  ctx.fillStyle = C.stone; for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) ctx.fillRect(-176 + i * 22, -44 + j * 26, 10, 10);
  ctx.beginPath(); ctx.arc(160, 10, 16, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
}
function slash(ctx, lt, at, len) { if (lt < at) return; stroked(ctx, () => { ctx.moveTo(-len / 2, len * 0.18); ctx.lineTo(len / 2, -len * 0.18); }, len * 1.1, prog(lt, at, at + DRAW), { lw: 14, col: C.wreck }); }
Object.assign(K, { chip, ram, fan, gauge, port, ruler, reviewCard, thermo, miniBox, slash });
};
