// kit component group 'text': label, headline, counter, bigWord, stamp, wordmark, pill2. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr } = K;
function label(ctx, text, x, y, px, col, { align = 'center', a = 1, unit = null } = {}) { // big label next to its part
  ctx.save(); ctx.globalAlpha *= a; font(ctx, px, 'head');
  const room = align === 'center' ? 2 * Math.min(x - 54, 1026 - x) : align === 'right' ? x - 54 : 1026 - x; // side margin 54 px: shrink to fit
  while (px > 24 && ctx.measureText(text).width > room) { px -= 2; font(ctx, px, 'head'); }
  ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.restore(); ctx.textAlign = 'left';
}
function headline(ctx, text, lt, dark, { t0 = 0.05, y = 300, acc = [], col = null, strike = -1, fit = true } = {}) { dark = false;
  if (!text) return null;
  const ws = text.split(' ');
  let px;
  if (ws.length === 1 || text.length <= 6) { // one word / number: ≥ 75 % width
    for (px = 340; px > 150; px -= 4) { font(ctx, px, 'head'); if (ctx.measureText(text).width <= 900) break; }
    font(ctx, px, 'head'); if (ctx.measureText(text).width < 810) { px = Math.min(380, px * 810 / ctx.measureText(text).width); }
  } else { for (px = 220; px >= 186; px -= 2) { font(ctx, px, 'head'); if (ctx.measureText(text).width <= 920) break; } }
  font(ctx, px, 'head');
  let rows = [ws];
  if (ctx.measureText(text).width > 920) { const mid = Math.ceil(ws.length / 2); rows = [ws.slice(0, mid), ws.slice(mid)]; }
  while (px > 120 && Math.max(...rows.map(r => ctx.measureText(r.join(' ')).width)) > 940) { px -= 4; font(ctx, px, 'head'); } // every row fits
  const lh = px * 0.92; let k = 0; const boxes = [];
  rows.forEach((r, ri) => {
    const rowW = ctx.measureText(r.join(' ')).width; let x = 540 - rowW / 2;
    r.forEach(wd => {
      const p = spr(lt - t0 - k * 0.07, 16, 0.55);      // overshoots ~1.02
      const blur = 6 * (1 - clamp(p));
      ctx.save(); ctx.globalAlpha = clamp(p * 1.4);
      const cxw = x + ctx.measureText(wd).width / 2, cyw = y + ri * lh + px * 0.4;
      ctx.translate(cxw, cyw + (1 - clamp(p)) * 24); const sc = 0.98 + 0.02 * p; ctx.scale(sc, sc); ctx.translate(-cxw, -cyw);
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      const isAcc = acc.some(a => wd.toUpperCase().includes(a.toUpperCase()));
      ctx.fillStyle = col || (isAcc ? (dark ? C.mari : C.ember) : (dark ? C.paper : C.ink));
      ctx.textBaseline = 'top'; ctx.fillText(wd, x, y + ri * lh); ctx.restore();
      boxes.push({ x, y: y + ri * lh, w: ctx.measureText(wd).width, h: px * 0.74 });
      x += ctx.measureText(wd + ' ').width; k++;
    });
  });
  if (strike >= 0) { // strike-through draws across the whole headline
    const b0 = boxes[0], b1 = boxes[boxes.length - 1], sp = easeOut(prog(lt, strike, strike + 0.3));
    if (sp > 0) { ctx.save(); ctx.strokeStyle = C.wreck; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); const yy = b0.y + b0.h * 0.55; ctx.moveTo(b0.x - 20, yy + 18); ctx.lineTo(lerp(b0.x - 20, b1.x + b1.w + 20, sp), yy - 18 * sp); ctx.stroke(); ctx.restore(); }
  }
  return { boxes, px, bottom: y + rows.length * lh };
}
// odometer number: per-digit roll ≤ 0.35 s, unit animates in after, glow pulse on landing; holds afterwards
function counter(ctx, value, from, lt, t0, x, y, px, col, { prefix = '', unit = '', comma = true, align = 'center', dark = true, dec = 0 } = {}) { dark = false;
  if (lt < t0 - 0.04 && from === 0) return { finalAt: t0 + 0.33 };
  const dur = 0.33, p = easeOut(prog(lt, t0, t0 + dur)), v = from + (value - from) * p;
  font(ctx, px, 'head'); const cw = ctx.measureText('0').width;
  const target = Math.round(value), digits = Math.max(String(target).length, String(Math.round(from)).length);
  const fmt = n => dec > 0 ? n.toFixed(dec) : (comma ? Math.round(n).toLocaleString('en-US') : String(Math.round(n)));
  const str = fmt(v), fin = fmt(value);
  const shown = prefix + (p >= 1 ? fin : str);
  font(ctx, px, 'head'); const twNow = ctx.measureText(shown).width;
  const twMax = Math.max(ctx.measureText(prefix + fin).width, ctx.measureText(prefix + fmt(from)).width, twNow);
  font(ctx, px * 0.42, 'head'); const uw = unit ? ctx.measureText(' ' + unit).width : 0;
  const total = twNow + uw; const x0 = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const land = lt - (t0 + dur), sc = land >= 0 ? 1 + 0.06 * Math.exp(-land * 9) * Math.cos(land * 11) : 1;
  ctx.save(); ctx.translate(x0 + total / 2, y - px * 0.35); ctx.scale(sc, sc); ctx.translate(-(x0 + total / 2), -(y - px * 0.35));
  font(ctx, px, 'head'); ctx.fillStyle = col; ctx.textBaseline = 'alphabetic';
  if (p < 1) { // rolling: clip so digits slide inside their slot; in-between values exist only during the ≤ 0.35 s roll
    const frac = dec === 0 ? (v % 1) : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10, y - px * 0.95, twMax + 20, px * 1.1); ctx.clip(); ctx.fillText(shown, x0, y - frac * px * 0.25); ctx.restore();
  } else { // landed: soft glow pulse, no clip (so the glow is round, not boxed)
    if (land < 0.6) { ctx.shadowColor = col; ctx.shadowBlur = 50 * (1 - land / 0.6); }
    ctx.fillText(shown, x0, y); ctx.shadowBlur = 0;
  }
  if (unit) { const ua = from !== 0 ? 1 : easeOut(prog(lt, t0 + dur, t0 + dur + 0.2)); ctx.globalAlpha *= ua; font(ctx, px * 0.42, 'head'); ctx.fillText(' ' + unit, x0 + twNow + (1 - ua) * 20, y); }
  ctx.restore();
  return { finalAt: t0 + dur };
}

// ---------- flat 2-D objects: stroke draws on (12 frames) → fill pops 1.04→1.0 → idle life; soft shadow ----------
function bigWord(ctx, text, lt, t0, col = C.ink, y = 300) { return headline(ctx, text, lt, false, { t0, y, col }); }
// ---- new 2-D objects ----
function stamp(ctx, text, cx, cy, p, col, px = 150) { if (p <= 0) return; const q = easeOut(p), s = lerp(1.3, 1, q), r = lerp(-4, 0, q) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3); font(ctx, px, 'head'); const w = ctx.measureText(text).width + px * 0.7, h = px * 1.2;
  ctx.lineWidth = 12; ctx.strokeStyle = col; rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.stroke(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, px * 0.06); ctx.restore(); ctx.textAlign = 'left'; }
function wordmark(ctx, cx, cy, px, tip, dark, a = 1) { dark = false; font(ctx, px, 'logo'); const parts = [['spec ', dark ? C.paper : C.ink], ['or ', C.ember], ['wrec', dark ? C.paper : C.ink]];
  const kW = ctx.measureText('k').width, total = parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0) + kW; let x = cx - total / 2; ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
  for (const [t, col] of parts) { ctx.fillStyle = col; ctx.fillText(t, x, cy); x += ctx.measureText(t).width; }
  ctx.save(); ctx.translate(x + kW, cy + 4 * tip); ctx.rotate(18 * tip * Math.PI / 180); ctx.fillStyle = dark ? C.paper : C.ink; ctx.fillText('k', -kW, 0); ctx.restore(); ctx.restore(); }

function pill2(ctx, x, y, w, h, fill) { ctx.save(); ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
Object.assign(K, { label, headline, counter, bigWord, stamp, wordmark, pill2 });
};
