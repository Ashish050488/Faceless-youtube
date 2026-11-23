// kit component group 'objects': sun, priceTag, calipers, scale, waterDrop, waves. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { easeIn, pop, DRAW, stroked } = K;
function sun(ctx, cx, cy, r, lt, t0, grow, { dark = true } = {}) { dark = false; // rays length grows with `grow` 0..1 (shrinks at the catch)
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(f || 1, f || 1);
  const pulse = 1 + 0.04 * Math.sin(lt * 2.2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = r * 1.35, r1 = r0 + r * (0.25 + 0.75 * grow) * pulse;
    const rp = clamp(p * 1.4 - i * 0.03); stroked(ctx, () => { ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }, r1 - r0, rp, { lw: 16, col: C.ink }); stroked(ctx, () => { ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }, r1 - r0, rp, { lw: 8, col: C.mari }); }
  stroked(ctx, () => ctx.arc(0, 0, r, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * r, p, { lw: 9, col: dark ? C.paper : C.ink });
  if (lt >= t0 + DRAW) { ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); }
  ctx.restore();
}
function priceTag(ctx, ax, ay, lt, t0, text, { dark = true } = {}) { dark = false; // hangs from (ax, ay), swings and settles with damping
  const e = clamp((lt - t0) / 0.25); if (e <= 0) return;
  const sw = (lt - t0) < 0 ? 0 : 0.5 * Math.exp(-(lt - t0) * 1.6) * Math.sin((lt - t0) * 6.5) + 0.03 * Math.sin(lt * 1.3);
  const drop = (1 - easeOut(e)) * -160;
  ctx.save(); ctx.translate(ax, ay + drop); ctx.rotate(sw);
  ctx.strokeStyle = dark ? C.paper : C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 120); ctx.stroke();
  ctx.translate(0, 120); const w = 330, h = 190;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(w / 2, 60); ctx.lineTo(w / 2, h); ctx.lineTo(-w / 2, h); ctx.lineTo(-w / 2, 60); ctx.closePath();
  ctx.fillStyle = C.mari; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 26, 12, 0, 7); ctx.fillStyle = dark ? C.ink : C.paper; ctx.fill(); ctx.stroke();
  font(ctx, 110, 'head'); const tw = ctx.measureText(text).width; if (tw > w - 50) font(ctx, Math.floor(110 * (w - 50) / tw), 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 128); ctx.textAlign = 'left';
  ctx.restore();
}
function calipers(ctx, xL, xR, y, lt, t0, dark) { dark = false; // jaws slide in and clamp the edge
  const p = prog(lt, t0, t0 + DRAW), c = easeOut(prog(lt, t0 + DRAW, t0 + DRAW + 0.35));
  const col = dark ? C.paper : C.ink, gap = lerp(120, 0, c);
  stroked(ctx, () => { ctx.moveTo(xL - 120, y - 260); ctx.lineTo(xR + 120, y - 260); }, xR - xL + 240, p, { lw: 12, col });
  stroked(ctx, () => { ctx.moveTo(xL - 60 - gap, y - 260); ctx.lineTo(xL - 60 - gap, y - 40); ctx.lineTo(xL - gap, y); }, 300, p, { lw: 12, col });
  stroked(ctx, () => { ctx.moveTo(xR + 60 + gap, y - 260); ctx.lineTo(xR + 60 + gap, y - 40); ctx.lineTo(xR + gap, y); }, 300, p, { lw: 12, col });
  if (c >= 1) { ctx.save(); ctx.fillStyle = C.mari; ctx.globalAlpha = 0.9; rr(ctx, xL - 90, y - 300, xR - xL + 180, 22, 11); ctx.fill(); ctx.restore(); }
}
function scale(ctx, cx, cy, lt, t0, tLevel, dark, { weight = '25' } = {}) { dark = false; // balance tips, then levels on the word
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW) || 1;
  const tilt = lt < tLevel ? 0.22 : 0.22 * Math.exp(-(lt - tLevel) * 5) * Math.cos((lt - tLevel) * 9);
  const col = dark ? C.paper : C.ink;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(f * 0.8, f * 0.8);
  stroked(ctx, () => { ctx.moveTo(0, -40); ctx.lineTo(0, 210); ctx.moveTo(-110, 210); ctx.lineTo(110, 210); }, 470, p, { lw: 12, col });
  ctx.save(); ctx.rotate(tilt); stroked(ctx, () => { ctx.moveTo(-330, -40); ctx.lineTo(330, -40); }, 660, p, { lw: 12, col });
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 330, -40); ctx.rotate(-tilt);
    stroked(ctx, () => { ctx.moveTo(0, 0); ctx.lineTo(-90, 120); ctx.moveTo(0, 0); ctx.lineTo(90, 120); ctx.moveTo(-120, 120); ctx.quadraticCurveTo(0, 190, 120, 120); }, 520, p, { lw: 9, col });
    if (s === 1 && lt >= t0 + DRAW) { ctx.save(); ctx.translate(0, 112); const ff = pop(lt, t0 + DRAW); ctx.scale(ff, ff); ctx.beginPath(); ctx.arc(0, -24, 34, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); font(ctx, 30, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(weight, 0, -22); ctx.textAlign = 'left'; ctx.restore(); }
    ctx.restore(); }
  ctx.restore(); ctx.restore();
  return tilt;
}
function waterDrop(ctx, cx, cy, lt, t0, dark) { dark = false; // drop falls, splashes, ripples fade out
  const fall = easeIn(prog(lt, t0, t0 + 0.35)), y = lerp(cy - 360, cy, fall);
  if (fall < 1) { ctx.save(); ctx.translate(cx, y); ctx.beginPath(); ctx.moveTo(0, -60); ctx.bezierCurveTo(40, -10, 44, 30, 0, 40); ctx.bezierCurveTo(-44, 30, -40, -10, 0, -60); ctx.fillStyle = '#7CC4E8'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); ctx.restore(); }
  for (let k = 0; k < 3; k++) { const rp = prog(lt, t0 + 0.35 + k * 0.18, t0 + 1.6 + k * 0.18); if (rp <= 0 || rp >= 1) continue;
    ctx.save(); ctx.globalAlpha = 1 - rp; ctx.strokeStyle = dark ? '#7CC4E8' : '#3A8FB7'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, cy + 30, 60 + rp * 340, 16 + rp * 70, 0, 0, 7); ctx.stroke(); ctx.restore(); }
}
function waves(ctx, cx, cy, lt, t0, dark) { dark = false; // swim waves icon
  const p = prog(lt, t0, t0 + DRAW);
  for (let r = 0; r < 2; r++) stroked(ctx, () => { for (let i = 0; i <= 40; i++) { const x = cx - 180 + i * 9, y = cy + r * 44 + Math.sin(i * 0.6 + lt * 3) * 12; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }, 420, p - r * 0.15, { lw: 9, col: '#3A8FB7' });
}
const box_ = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); };
const enter_ = (ctx, lt, t0) => { const f = K.pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
function reviewCard(ctx, lt, t0, tickAt) { // paper card with headline bar + text lines; green-free tick in a circle
  ctx.save(); if (!enter_(ctx, lt, t0)) { ctx.restore(); return; }
  box_(ctx, -130, -160, 260, 320, 22, C.paper);
  box_(ctx, -96, -124, 192, 30, 8, C.ink, 0);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = C.paperLine; ctx.fillRect(-96, -70 + i * 28, i === 4 ? 120 : 192, 12); }
  if (lt >= tickAt) { ctx.beginPath(); ctx.arc(70, 110, 54, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.ink; ctx.stroke();
    stroked(ctx, () => { ctx.moveTo(44, 110); ctx.lineTo(64, 132); ctx.lineTo(98, 88); }, 90, prog(lt, tickAt, tickAt + DRAW), { lw: 12, col: C.ink }); }
  ctx.restore();
}
function slash(ctx, lt, at, len) { if (lt < at) return; stroked(ctx, () => { ctx.moveTo(-len / 2, len * 0.18); ctx.lineTo(len / 2, -len * 0.18); }, len * 1.1, prog(lt, at, at + DRAW), { lw: 14, col: C.wreck }); }
Object.assign(K, { sun, priceTag, calipers, scale, waterDrop, waves , reviewCard, slash });
};
