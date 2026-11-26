// kit component group 'map': worldMap, countryShape. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP, COUNTRIES } = env, FR = 1 / FPS;
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
function countryShape(ctx, lt, t0, { iso, h = 520, fill = C.mari, label = '', price = '', priceAt = null, side = 1 }) { // real Natural Earth outline (assets/countries.json, tools/make_countries.py), centred at 0,0, h tall; price flag drops onto it at priceAt (side 1 = pennant right, −1 = left)
  const c = COUNTRIES && COUNTRIES[iso]; if (!c) throw new Error('countryShape needs assets/countries.json with ' + iso + ' (tools/make_countries.py)');
  const e = spr(lt - t0, 13, 0.6); if (e <= 0) return; const w = c.w * h, s = lerp(0.6, 1, clamp(e)) * (1 + 0.004 * Math.sin(lt * 2.4));
  ctx.save(); ctx.globalAlpha *= clamp(e * 1.6); ctx.scale(s, s); ctx.translate(-w / 2, -h / 2);
  ctx.beginPath(); for (const r of c.polys) r.forEach(([x, y], i) => i ? ctx.lineTo(x * h, y * h) : ctx.moveTo(x * h, y * h)); ctx.closePath();
  ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14; ctx.fillStyle = fill; ctx.fill('evenodd'); ctx.shadowColor = 'transparent';
  ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  const sw = (lt * 0.5) % 2.4; if (sw < 1) { ctx.save(); ctx.clip('evenodd'); const gx = lerp(-0.4 * w, 1.4 * w, sw); const g = ctx.createLinearGradient(gx - 120, 0, gx + 120, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); ctx.restore(); }
  ctx.restore();
  if (label) { font(ctx, 56, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(label, 0, h / 2 + 80); ctx.textAlign = 'left'; }
  if (price && priceAt !== null) { const d = spr(lt - priceAt, 14, 0.5); if (d > 0) { // flag pole planted in the middle, pennant with the price
    ctx.save(); ctx.translate(0, -(1 - clamp(d)) * 160); ctx.globalAlpha *= clamp(d * 1.5);
    const top = -h * 0.42, wav = 4 * Math.sin(lt * 5);
    ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, top); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
    font(ctx, 84, 'head'); const tw = ctx.measureText(price).width + 64, fh = 120;
    ctx.shadowColor = 'rgba(21,19,18,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
    ctx.beginPath(); ctx.moveTo(0, top); ctx.lineTo(side * tw, top + wav); ctx.lineTo(side * (tw - 26), top + fh / 2 + wav); ctx.lineTo(side * tw, top + fh + wav); ctx.lineTo(0, top + fh); ctx.closePath();
    ctx.fillStyle = C.paper; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 7; ctx.stroke();
    ctx.fillStyle = C.ember; ctx.textBaseline = 'middle'; ctx.fillText(price, side > 0 ? 22 : -tw + 48, top + fh / 2 + wav / 2 + 4); ctx.textBaseline = 'alphabetic';
    ctx.restore(); } }
}
Object.assign(K, { worldMap, countryShape });
};
