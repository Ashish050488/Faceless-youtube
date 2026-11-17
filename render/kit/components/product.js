// kit component group 'product': SHADOW, product, objShadow. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr } = K;
const SHADOW = createCanvas(400, 90);
{ const x = SHADOW.getContext('2d'); x.filter = 'blur(16px)'; x.fillStyle = 'rgba(21,19,18,0.5)'; x.beginPath(); x.ellipse(200, 45, 160, 18, 0, 0, 7); x.fill(); }
const off = createCanvas(1400, 1400);
function product(ctx, im, cx, cy, w, { lt = 0, t0 = 0, crop = null, card = false, radius = 44, dark = false, dim = 0, push = 0, alpha = 1, shadow = true, seed = 0 } = {}) {
  dark = false;
  if (crop && !card) throw new Error('crop on a cut-out leaves a hard edge — use a card or the whole image');
  const sx = crop ? crop[0] * im.width : 0, sy = crop ? crop[1] * im.height : 0, sw = crop ? crop[2] * im.width : im.width, sh = crop ? crop[3] * im.height : im.height;
  const h = w * sh / sw;
  const e = spr(lt - t0, 13, 0.72);                       // entrance
  const focus = 10 * (1 - clamp((lt - t0) / 0.35));       // focus pull 10 px → 0 in 0.35 s
  const rot = (1.5 * Math.PI / 180) * Math.sin(lt * 0.45 + seed);
  const s = lerp(0.94, 1, e) * (1 + 0.02 * clamp(push));
  ctx.save(); ctx.globalAlpha = alpha;
  if (shadow && !card) { const sw2 = w * 0.78; ctx.globalAlpha *= 0.85; ctx.drawImage(SHADOW, cx - sw2 / 2, cy + h / 2 * s - 26, sw2, 52); ctx.globalAlpha = alpha; }
  ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s);
  if (card) { ctx.shadowColor = dark ? 'rgba(0,0,0,0.55)' : 'rgba(21,19,18,0.16)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18; rr(ctx, -w / 2, -h / 2, w, h, radius); ctx.fillStyle = '#ddd'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, radius); ctx.clip(); }
  if (focus > 0.3) ctx.filter = `blur(${focus.toFixed(1)}px)`;
  ctx.drawImage(im, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.filter = 'none';
  // rim light: thin warm highlight along the top-left edge, clipped to the product's own alpha
  if (!card) {
    const ow = Math.min(1400, Math.ceil(w)), oh = Math.min(1400, Math.ceil(h)), x = off.getContext('2d');
    x.clearRect(0, 0, ow, oh); x.globalCompositeOperation = 'source-over'; x.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
    x.globalCompositeOperation = 'source-in'; const g = x.createLinearGradient(0, 0, ow * 0.5, oh * 0.5);
    g.addColorStop(0, dark ? 'rgba(255,214,160,0.30)' : 'rgba(255,255,255,0.22)'); g.addColorStop(0.25, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, ow, oh);
    x.globalCompositeOperation = 'source-over'; ctx.drawImage(off, 0, 0, ow, oh, -w / 2, -h / 2, w, h);
  }
  if (dim > 0) { if (card) { ctx.fillStyle = `rgba(21,19,18,${dim})`; ctx.fillRect(-w / 2, -h / 2, w, h); }
    else { const ow = Math.min(1400, Math.ceil(w)), oh = Math.min(1400, Math.ceil(h)), x = off.getContext('2d'); x.clearRect(0, 0, ow, oh); x.globalCompositeOperation = 'source-over'; x.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh); x.globalCompositeOperation = 'source-in'; x.fillStyle = `rgba(21,19,18,${dim})`; x.fillRect(0, 0, ow, oh); x.globalCompositeOperation = 'source-over'; ctx.drawImage(off, 0, 0, ow, oh, -w / 2, -h / 2, w, h); } }
  if (card) ctx.restore();
  ctx.restore();
  return { x0: cx - w / 2, y0: cy - h / 2, w, h };
}

// ---------- big centred headline: per-word reveal 70 ms stagger, 1.02 overshoot ----------
function objShadow(ctx, cx, y, w) { ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(SHADOW, cx - w / 2, y - 18, w, 36); ctx.restore(); }
Object.assign(K, { SHADOW, product, objShadow });
};
