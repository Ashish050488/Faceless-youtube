// kit component group 'compute': flat 2-D PC parts (our own drawings), drawn around (0,0); render.js places them
// with x, y, s. chipDie (package + pins, die cells fill one by one; mode 'gpu' = dense green core field), ramStick
// (sticks drop in and stack), fan (blades spin up), miniPc (generic unbranded mini PC box).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop, DRAW, stroked } = K;
const GREEN = '#76B900'; // NVIDIA green: only inside chipDie
const box = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter = (ctx, lt, t0) => { const f = pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
function chipDie(ctx, lt, t0, fillAt, { n = 20, cols = 5, mode = 'cpu' } = {}) {
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
function ramStick(ctx, lt, t0, n = 4) { // sticks drop in one by one and stack (each: PCB, 8 chips, gold contacts, notch)
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
function miniPc(ctx, lt, t0) { // generic unbranded mini PC: flat box, top face, dot grille, power button
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  ctx.beginPath(); ctx.moveTo(-200, -70); ctx.lineTo(-150, -130); ctx.lineTo(250, -130); ctx.lineTo(200, -70); ctx.closePath(); ctx.fillStyle = '#D9D4CE'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(200, -70); ctx.lineTo(250, -130); ctx.lineTo(250, 30); ctx.lineTo(200, 90); ctx.closePath(); ctx.fillStyle = C.stone; ctx.fill(); ctx.stroke();
  box(ctx, -200, -70, 400, 160, 10, '#C9C3BC', 8);
  ctx.fillStyle = C.stone; for (let i = 0; i < 14; i++) for (let j = 0; j < 4; j++) ctx.fillRect(-176 + i * 22, -44 + j * 26, 10, 10);
  ctx.beginPath(); ctx.arc(160, 10, 16, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  ctx.restore();
}
Object.assign(K, { chipDie, ramStick, fan, miniPc });
};
