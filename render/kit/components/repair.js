// kit component group 'repair': flat 2-D teardown diagrams (our own drawings, never teardown photos).
// connector (plug pulls out and tears), speaker (cracks in two), cable (screen → hinge → base, or a too-short lead),
// usbc (port module slides out and back), lockScrews (two screws + padlock). Loaded by core.js.
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop, DRAW, stroked } = K;
const box = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter = (ctx, x, y, lt, t0) => { const f = pop(lt, t0); ctx.translate(x, y); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
const jag = (ctx, x0, y0, x1, y1, n, a) => { ctx.moveTo(x0, y0); for (let i = 1; i <= n; i++) { const t = i / n; ctx.lineTo(lerp(x0, x1, t) + (i % 2 ? a : -a), lerp(y0, y1, t)); } };

function connector(ctx, x, y, lt, t0, ripAt) { // socket on a board; the plug + wire yank up and the housing tears
  ctx.save(); if (!enter(ctx, x, y, lt, t0)) { ctx.restore(); return; }
  const r = easeOut(prog(lt, ripAt, ripAt + 0.25)), sh = lt > ripAt && lt < ripAt + 0.3 ? Math.sin(lt * 90) * 6 : 0;
  box(ctx, -260, 60, 520, 120, 18, C.paperSoft);                   // board
  box(ctx, -110, 0, 220, 80, 10, C.mari);                          // socket
  ctx.save(); ctx.translate(sh, -r * 170); ctx.rotate(-0.25 * r);
  box(ctx, -80, -70, 160, 90, 10, C.stone);                        // plug
  ctx.beginPath(); ctx.moveTo(0, -70); ctx.bezierCurveTo(0, -180, 120, -200, 160, -300); ctx.lineWidth = 14; ctx.strokeStyle = C.ink; ctx.stroke();
  if (r > 0.6) { ctx.beginPath(); jag(ctx, -80, 20, 80, 20, 8, 12); ctx.lineWidth = 7; ctx.strokeStyle = C.wreck; ctx.stroke(); }
  ctx.restore();
  if (r > 0.6) { ctx.beginPath(); jag(ctx, -110, 4, 110, 4, 10, 10); ctx.lineWidth = 7; ctx.strokeStyle = C.wreck; ctx.stroke(); }
  ctx.restore();
}
function speaker(ctx, x, y, lt, t0, snapAt) { // speaker box; at snapAt a crack runs down and the halves tilt apart
  ctx.save(); if (!enter(ctx, x, y, lt, t0)) { ctx.restore(); return; }
  const s = easeOut(prog(lt, snapAt, snapAt + 0.3)), w = 420, h = 300;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(side * s * 40, s * 20); ctx.rotate(side * s * 0.14);
    ctx.beginPath(); ctx.rect(side < 0 ? -w / 2 - 10 : 0, -h / 2 - 10, w / 2 + 10, h + 20); ctx.clip();
    box(ctx, -w / 2, -h / 2, w, h, 36, C.paperSoft);
    ctx.beginPath(); ctx.arc(0, 0, 105, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
    ctx.restore();
  }
  if (lt >= snapAt) { ctx.beginPath(); jag(ctx, 0, -h / 2 - 10, 0, h / 2 + 10, 9, 14 * (1 - s) + 4); ctx.lineWidth = 8; ctx.strokeStyle = C.wreck; ctx.stroke(); }
  ctx.restore();
}
function cable(ctx, x, y, lt, t0, mode) { // 'hinge': screen → pivot → base, dashed line draws through; 'short': board ↔ woofer, taut lead strains
  ctx.save(); if (!enter(ctx, x, y, lt, t0)) { ctx.restore(); return; }
  if (mode === 'short') {
    box(ctx, -230, -260, 460, 150, 18, C.paperSoft);              // board
    ctx.beginPath(); ctx.arc(0, 180, 120, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 180, 45, 0, 7); ctx.fillStyle = C.ink; ctx.fill();
    const strain = 0.5 + 0.5 * Math.sin(lt * 9), gap = 26 + strain * 10;
    ctx.beginPath(); ctx.moveTo(60, 60); ctx.lineTo(60, -110 + gap + 30); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();
    box(ctx, 30, -110 + gap, 60, 34, 6, C.stone, 6);              // plug, just short of its socket
    box(ctx, 26, -150, 68, 40, 6, C.ember, 6);                    // socket on the board
    ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(120, -110); ctx.lineTo(120, -110 + gap); ctx.lineWidth = 5; ctx.strokeStyle = C.wreck; ctx.stroke(); ctx.setLineDash([]);
  } else {
    box(ctx, -200, -330, 400, 300, 30, C.paperSoft);              // screen
    ctx.beginPath(); ctx.arc(0, 40, 38, 0, 7); ctx.fillStyle = C.stone; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke(); // pivot
    box(ctx, -170, 110, 340, 200, 90, C.paperSoft);               // base
    const p = prog(lt, t0 + 0.2, t0 + 0.2 + 0.8);
    ctx.setLineDash([22, 14]); stroked(ctx, () => { ctx.moveTo(0, -120); ctx.lineTo(0, 210); }, 330, p, { lw: 12, col: C.ember }); ctx.setLineDash([]);
  }
  ctx.restore();
}
function usbc(ctx, x, y, lt, t0, slideAt) { // base outline; the port module slides out, holds, slides back; green tick
  ctx.save(); if (!enter(ctx, x, y, lt, t0)) { ctx.restore(); return; }
  box(ctx, -260, -150, 520, 300, 140, C.paperSoft);
  const o = easeInOut(prog(lt, slideAt, slideAt + 0.35)) - easeInOut(prog(lt, slideAt + 1.4, slideAt + 1.75));
  ctx.save(); ctx.translate(o * 300, 0);
  box(ctx, 120, -50, 170, 100, 14, C.mari);
  ctx.beginPath(); rr(ctx, 165, -16, 80, 32, 16); ctx.fillStyle = C.ink; ctx.fill();
  ctx.restore();
  if (lt > slideAt + 0.35) { const c = prog(lt, slideAt + 0.35, slideAt + 0.65); stroked(ctx, () => { ctx.moveTo(-90, 0); ctx.lineTo(-40, 50); ctx.lineTo(50, -50); }, 200, c, { lw: 18, col: '#2F9E5B' }); }
  ctx.restore();
}
function lockScrews(ctx, x, y, lt, t0) { // two screw heads + a padlock badge
  ctx.save(); if (!enter(ctx, x, y, lt, t0)) { ctx.restore(); return; }
  for (const dx of [-70, 70]) { ctx.beginPath(); ctx.arc(dx, 0, 34, 0, 7); ctx.fillStyle = C.stone; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.save(); ctx.translate(dx, 0); for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.lineWidth = 6; ctx.stroke(); } ctx.restore(); }
  box(ctx, -40, 60, 80, 64, 10, C.ember, 7);
  ctx.beginPath(); ctx.arc(0, 60, 26, Math.PI, 2 * Math.PI - 1e-4); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.restore();
}
Object.assign(K, { connector, speaker, cable, usbc, lockScrews });
};
