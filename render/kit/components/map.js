// kit component group 'map': worldMap. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr, scale } = K;
function worldMap(ctx, cx, cy, w, lt, t0, tPins) { // Natural Earth 1:110m, Robinson; marigold = US, Europe, India
  const [x0, y0, x1, y1] = MAP.bbox, sc = w / (x1 - x0), h = (y1 - y0) * sc;
  const e = easeOut(prog(lt, t0, t0 + 0.4));
  ctx.save(); ctx.globalAlpha = e;
  const P = ([x, y]) => [cx - w / 2 + (x - x0) * sc, cy + h / 2 - (y - y0) * sc];
  for (const hl of [false, true]) for (const poly of MAP.polys) { if (poly.hl !== hl) continue;
    const a = hl ? easeOut(prog(lt, tPins[0] - 0.15, tPins[0] + 0.25)) : 1;
    ctx.beginPath(); poly.p.forEach((q, i) => { const [x, y] = P(q); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath();
    ctx.fillStyle = hl ? (a > 0 ? `rgba(255,178,36,${0.25 + 0.75 * a})` : 'rgba(140,132,124,0.25)') : 'rgba(140,132,124,0.25)'; ctx.fill();
    ctx.strokeStyle = 'rgba(21,19,18,0.25)'; ctx.lineWidth = 1; ctx.stroke(); }
  Object.keys(MAP.pins).forEach((k, i) => { const d = spr(lt - tPins[i], 14, 0.5); if (d <= 0) return; const [x, y] = P(MAP.pins[k]);
    ctx.save(); ctx.translate(x, y - (1 - clamp(d)) * 120); ctx.scale(0.62, 0.62); ctx.beginPath(); ctx.arc(0, -120, 54, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = C.wreck; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.stroke(); ctx.beginPath(); ctx.arc(0, -120, 20, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); });
  ctx.restore();
  return { h };
}
Object.assign(K, { worldMap });
};
