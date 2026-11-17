// kit component group 'screen': screenPath, setScreen, motionLines, screenDim, playIcon, loupe. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr, pop, COOL, product, scale } = K;
let SCR = env.SCR || [[0.1, 0.02], [0.4, 0.02], [0.53, 0.43], [0.22, 0.39]];   // screen quad (fractions of a product image)
function screenPath(ctx, r) { ctx.beginPath(); SCR.forEach(([u, v], i) => { const x = r.x0 + u * r.w, y = r.y0 + v * r.h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
const setScreen = q => { SCR = q; };
function motionLines(ctx, r, lt, t0) { // smooth 120 Hz streaks sweeping across the real screen
  if (lt < t0) return; ctx.save(); screenPath(ctx, r); ctx.clip();
  for (let i = 0; i < 7; i++) { const ph = ((lt - t0) * 1.6 + i * 0.17) % 1, x = r.x0 + r.w * (-0.1 + ph * 0.7), y = r.y0 + r.h * (0.07 + i * 0.05);
    const g = ctx.createLinearGradient(x - 180, 0, x + 40, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.85)'); ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 180, y); ctx.lineTo(x + 40, y); ctx.stroke(); }
  ctx.restore();
}
function screenDim(ctx, r, d) { if (d <= 0) return; ctx.save(); screenPath(ctx, r); ctx.fillStyle = `rgba(21,19,18,${d})`; ctx.fill(); ctx.restore(); }
function playIcon(ctx, r, lt, t0) { const f = pop(lt, t0); if (!f) return; const cx = r.x0 + r.w * 0.31, cy = r.y0 + r.h * 0.2; ctx.save(); ctx.translate(cx, cy); ctx.scale(f, f); ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(30, 0); ctx.lineTo(-18, 28); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); }
function loupe(ctx, im, srcCx, srcCy, srcR, cx, cy, R, lt, t0) { // magnifier showing the real ports enlarged
  const e = spr(lt - t0, 13, 0.6); if (e <= 0) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(e, e);
  ctx.shadowColor = 'rgba(21,19,18,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 6, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = COOL; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.drawImage(im, srcCx - srcR, srcCy - srcR, srcR * 2, srcR * 2, -R, -R, 2 * R, 2 * R); ctx.restore();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}
Object.assign(K, { screenPath, setScreen, motionLines, screenDim, playIcon, loupe });
};
