// kit component group 'outdoor': watches, lights, mountains. Drawn around (0,0) at 1080 scale; render.js places them
// with x, y, s. watchOutline (generic round unbranded watch: bezel ring with ticks, 4 buttons, strap stubs, `screen`
// text inside, `label` under it), lightBeam (warm cone of light from a small LED at (0,0), pointing at `angle`,
// brightness `level` 1–3 with soft falloff; translucent so it never counts as an overlap), mountainSunrise (flat
// 3-peak ridge with snow caps; sun rises behind it from `riseAt`, peaks go dark → dawn).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K) => {
const fadeIn = (lt, t0, d = 0.15) => clamp((lt - t0) / d);
const txt = (ctx, t, x, y, px, col, a = 1) => { ctx.save(); ctx.globalAlpha *= a; font(ctx, px, 'head'); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(t, x, y); ctx.restore(); };
const mix = (a, b, t) => { const p = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)); const A = p(a), B = p(b); return 'rgb(' + A.map((v, i) => Math.round(lerp(v, B[i], t))).join(',') + ')'; };

function watchOutline(ctx, lt, t0, { size = 420, label = '', screen = '' } = {}) { // case diameter `size`, centre (0,0)
  const f = K.pop(lt, t0); if (!f) return; const r = size / 2;
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.scale(f, f); ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink;
  for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-r * 0.52, sy * r * 0.8); ctx.lineTo(-r * 0.46, sy * r * 1.42); ctx.lineTo(r * 0.46, sy * r * 1.42); ctx.lineTo(r * 0.52, sy * r * 0.8); ctx.closePath(); ctx.fillStyle = '#D9D3CC'; ctx.fill(); ctx.stroke(); // strap stubs
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(-r * 0.4, sy * r * (0.95 + k * 0.12)); ctx.lineTo(r * 0.4, sy * r * (0.95 + k * 0.12)); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(21,19,18,0.35)'; ctx.stroke(); } ctx.lineWidth = 8; ctx.strokeStyle = C.ink; }
  for (const [sx, sy] of [[-1, -0.42], [-1, 0.42], [1, -0.42], [1, 0.42]]) { rr(ctx, sx > 0 ? r - 10 : -r - 26, sy * r - 22, 36, 44, 10); ctx.fillStyle = '#B9B2AA'; ctx.fill(); ctx.stroke(); } // 4 buttons
  ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 28; ctx.shadowOffsetY = 10;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#CFC8C0'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.stroke(); // case
  ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#8C847C'; ctx.fill(); ctx.lineWidth = 5; ctx.stroke(); // bezel
  for (let k = 0; k < 60; k++) { const a = k / 60 * 2 * Math.PI, l = k % 5 ? 0.05 : 0.1; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * 0.84, -Math.cos(a) * r * 0.84); ctx.lineTo(Math.sin(a) * r * (0.84 - l), -Math.cos(a) * r * (0.84 - l)); ctx.lineWidth = k % 5 ? 2 : 5; ctx.strokeStyle = C.paper; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#2B2826'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); // screen
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, 2 * Math.PI - 1e-4); ctx.clip(); const sw = ((lt - t0) * 0.5) % 1.8 - 0.4; ctx.fillStyle = 'rgba(255,255,255,0.13)';
  ctx.beginPath(); ctx.moveTo(-r + sw * 2 * r, -r); ctx.lineTo(-r + sw * 2 * r + 60, -r); ctx.lineTo(-r + sw * 2 * r - 40, r); ctx.lineTo(-r + sw * 2 * r - 100, r); ctx.closePath(); ctx.fill(); ctx.restore(); // light sweep
  if (screen) txt(ctx, screen, 0, r * 0.12, Math.round(r * 0.34), C.paper, fadeIn(lt, t0 + 0.15, 0.25));
  ctx.restore();
  if (label) txt(ctx, label, 0, r * 1.42 * f + 80, 52, C.ink, fadeIn(lt, t0 + 0.1, 0.25));
}

function lightBeam(ctx, lt, t0, { len = 700, angle = 0, spread = 0.36, level = 3, steps = null, flickerAt = null, ticks = false } = {}) { // LED at (0,0), cone along `angle` (rad, 0 = right)
  if (lt < t0) return; let lv = level; if (steps) { lv = 0; steps.forEach((s, i) => { if (lt >= s) lv = i + 1; }); }
  const on = easeOut(prog(lt, t0, t0 + 0.18)) * (flickerAt !== null && lt >= flickerAt && lt < flickerAt + 0.14 ? 0 : 1);
  const k = lv / 3, l = len * lerp(0.55, 1, k) * lerp(0.6, 1, on), a = on * lerp(0.35, 1, k), sp = spread * lerp(0.75, 1, k);
  ctx.save(); ctx.rotate(angle);
  if (a > 0) for (const [w, al] of [[1, 0.2], [0.62, 0.24], [0.3, 0.26]]) { // nested cones = soft falloff; alpha stays < 0.5 (glow, not a solid)
    const g = ctx.createLinearGradient(0, 0, l, 0); g.addColorStop(0, 'rgba(255,178,36,' + (al * a).toFixed(3) + ')'); g.addColorStop(0.7, 'rgba(255,178,36,' + (al * a * 0.5).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,178,36,0)');
    ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(l, -Math.tan(sp * w) * l); ctx.quadraticCurveTo(l * 1.06, 0, l, Math.tan(sp * w) * l); ctx.lineTo(0, 10); ctx.closePath(); ctx.fillStyle = g; ctx.fill(); }
  rr(ctx, -26, -22, 30, 44, 8); ctx.fillStyle = C.ink; ctx.fill(); // LED housing
  ctx.beginPath(); ctx.arc(4, 0, 13, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = on > 0 ? '#FFF4D6' : '#8C847C'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
  if (ticks) for (let i = 1; i <= 3; i++) { const x = len * 0.28 * i, h = Math.tan(spread) * x + 46; ctx.save(); ctx.translate(x, h); ctx.rotate(-angle);
    rr(ctx, -30, -30, 60, 60, 14); ctx.fillStyle = lv >= i ? C.mari : '#D9D3CC'; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke();
    font(ctx, 40, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(String(i), 0, 14); ctx.restore(); }
  ctx.restore();
}

function mountainSunrise(ctx, lt, t0, { w = 900, riseAt = null, dur = 1.4 } = {}) { // ridge base centred at (0,0) bottom edge; peaks up to ~0.42 w
  const f = K.pop(lt, t0); if (!f) return; const t = riseAt === null ? 0 : easeInOut(prog(lt, riseAt, riseAt + dur)), h = w * 0.42;
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.scale(f, f); ctx.lineJoin = 'round';
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h * 1.4, w, h * 1.4); ctx.clip(); // sun behind the ridge
  const sy = lerp(-h * 0.1, -h * 0.95, t), sr = w * 0.11;
  if (t > 0) for (let k = 0; k < 12; k++) { const a = k / 12 * 2 * Math.PI + lt * 0.2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * sr * 1.3, sy + Math.sin(a) * sr * 1.3); ctx.lineTo(Math.cos(a) * sr * (1.3 + 0.45 * t), sy + Math.sin(a) * sr * (1.3 + 0.45 * t)); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.strokeStyle = C.mari; ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, sy, sr, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
  const P = [[-0.5, 0], [-0.3, -0.62], [-0.16, -0.38], [0.04, -1], [0.22, -0.5], [0.33, -0.72], [0.5, 0]]; // 3 peaks
  const rock = mix('#4A4F5A', '#8C847C', t);
  ctx.beginPath(); P.forEach(([x, y], i) => i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)); ctx.closePath(); ctx.fillStyle = rock; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  for (const [i, s] of [[1, 0.16], [3, 0.2], [5, 0.14]]) { const [x, y] = P[i], [xl, yl] = P[i - 1], [xr, yr] = P[i + 1]; // snow caps
    const a = [lerp(x, xl, s) * w, lerp(y, yl, s) * h], b = [lerp(x, xr, s) * w, lerp(y, yr, s) * h];
    ctx.beginPath(); ctx.moveTo(x * w, y * h); ctx.lineTo(b[0], b[1]); ctx.lineTo((x * w + b[0]) / 2, b[1] - 6); ctx.lineTo(x * w, (y * h + b[1]) / 2 + 8); ctx.lineTo((x * w + a[0]) / 2, a[1] - 4); ctx.lineTo(a[0], a[1]); ctx.closePath();
    ctx.fillStyle = mix('#B9B2AA', '#FFFFFF', t); ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = C.ink; ctx.stroke(); }
  ctx.restore();
}

Object.assign(K, { watchOutline, lightBeam, mountainSunrise });
};
