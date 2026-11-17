// kit component group 'motion': spr, easeIn, pop, DRAW, stroked. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const COOL = '#EEF0F4';
const spr = (t, k = 15, z = 0.62) => t <= 0 ? 0 : 1 - Math.exp(-z * k * t) * (Math.cos(k * Math.sqrt(1 - z * z) * t) + z / Math.sqrt(1 - z * z) * Math.sin(k * Math.sqrt(1 - z * z) * t));
const easeIn = t => { t = clamp(t); return t * t * t; };
const pop = (lt, t0) => lt < t0 ? 0 : 1 + 0.04 * Math.exp(-(lt - t0) * 10) * Math.cos((lt - t0) * 18) - 0.04 * Math.exp(-(lt - t0) * 30); // 1.04 → 1.0
const DRAW = 12 * FR;                                        // stroke draw-on 12 frames

// ---------- words ----------
function stroked(ctx, drawPath, len, p, { lw = 8, col = C.ink } = {}) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([len * clamp(p), len + 10]); ctx.beginPath(); drawPath(); ctx.stroke(); ctx.restore(); }
Object.assign(K, { spr, easeIn, pop, DRAW, stroked });
};
