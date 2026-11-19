// kit component group 'ports': flat 2-D sockets on a panel, drawn around (0,0) (x, y, s). usbPort (USB-A), audioJack
// (3.5 mm); optional red cross draws on at crossAt ("no X").
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop, DRAW, stroked } = K;
const GREEN = '#76B900'; // NVIDIA green: only inside chipDie
const box = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter = (ctx, lt, t0) => { const f = pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
function cross(ctx, lt, at, h) { if (lt < at) return; const p = prog(lt, at, at + DRAW);
  stroked(ctx, () => { ctx.moveTo(-h, -h); ctx.lineTo(h, h); }, h * 2.9, p, { lw: 16, col: C.wreck });
  stroked(ctx, () => { ctx.moveTo(h, -h); ctx.lineTo(-h, h); }, h * 2.9, prog(lt, at + 0.08, at + 0.08 + DRAW), { lw: 16, col: C.wreck }); }
function portPanel(ctx, lt, t0, kind, crossAt) { // panel with a USB-A socket or a 3.5 mm jack; red cross on crossAt
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  box(ctx, -150, -110, 300, 220, 30, C.paperSoft);
  if (kind === 'jack') { ctx.beginPath(); ctx.arc(0, 0, 62, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.stone; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 28, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.ink; ctx.fill(); }
  else { box(ctx, -95, -46, 190, 92, 8, C.ink, 6); box(ctx, -78, -30, 156, 30, 4, C.paper, 4);
    ctx.fillStyle = C.mari; for (let i = 0; i < 4; i++) ctx.fillRect(-62 + i * 36, -26, 18, 18); }
  cross(ctx, lt, crossAt, 92);
  ctx.restore();
}
const usbPort = (ctx, lt, t0, crossAt) => portPanel(ctx, lt, t0, 'usba', crossAt);
const audioJack = (ctx, lt, t0, crossAt) => portPanel(ctx, lt, t0, 'jack', crossAt);
Object.assign(K, { usbPort, audioJack });
};
