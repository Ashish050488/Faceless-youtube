// Shared drawing + motion helpers for Spec or Wreck renders (brand v3 "Switch", state/brand.md).
const { GlobalFonts, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const C = {
  paper: '#FAFAFA', ink: '#0E0E10', lime: '#C6FF00', grey: '#8A8A90', wreck: '#FF2E63',
  inkSoft: '#1C1C20', paperSoft: '#ECECEE', line: '#2A2A30',
};
const W = 1080, H = 1920;
// safe frame (brand.md): x 60–880, y 270–1220
const SAFE = { x0: 60, x1: 880, y0: 270, y1: 1220, titleY0: 270, titleY1: 560, heroY0: 560, heroY1: 1100, capY0: 1110, capY1: 1220 };

function registerFonts(dir) {
  for (const f of fs.readdirSync(dir)) if (f.endsWith('.ttf')) GlobalFonts.registerFromPath(path.join(dir, f));
}

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeInOut = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
// damped spring 0→1 (overshoots a little), t in seconds
const spring = (t, k = 9, z = 0.55) => t <= 0 ? 0 : 1 - Math.exp(-z * k * t) * Math.cos(k * Math.sqrt(1 - z * z) * t);
const prog = (t, a, b) => clamp((t - a) / (b - a));

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function font(ctx, px, kind = 'head') {
  if (kind === 'head') { ctx.font = `800 ${px}px "Inter Tight", "Inter"`; ctx.letterSpacing = `${(-0.03 * px).toFixed(1)}px`; }
  else if (kind === 'bold') { ctx.font = `700 ${px}px "Inter"`; ctx.letterSpacing = '0px'; }
  else { ctx.font = `600 ${px}px "Inter"`; ctx.letterSpacing = '0px'; }
}

// Fit a headline into maxW, between minPx and maxPx; returns px
function fitPx(ctx, text, maxW, maxPx, minPx, kind = 'head') {
  for (let px = maxPx; px >= minPx; px -= 2) { font(ctx, px, kind); if (ctx.measureText(text).width <= maxW) return px; }
  return minPx;
}

module.exports = { C, W, H, SAFE, registerFonts, clamp, lerp, easeOut, easeInOut, spring, prog, rr, font, fitPx, loadImage };
