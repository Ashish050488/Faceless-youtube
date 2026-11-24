// kit component group 'display': refresh rate + resolution explainers. Drawn around (0,0) at 1080 scale;
// render.js places them with x, y, s. frameStrip (film strip of frames scrolling at a speed set by `hz`, each cell
// stamped with `label`), pixelGrid (high-res grid vs low-res grid of the same area: 1 big pixel = 4 small, RGB
// subpixels, "¼" badge), monitorOutline (generic unbranded flat monitor on a stand, `label` under it).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, prog, rr, font } = L;
module.exports = (K) => {
const fadeIn = (lt, t0, d = 0.15) => clamp((lt - t0) / d);
const txt = (ctx, t, x, y, px, col, a = 1) => { ctx.save(); ctx.globalAlpha *= a; font(ctx, px, 'head'); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.fillText(t, x, y); ctx.restore(); }; // local (K.label's side-margin fit assumes page coords)
const SUB = ['#E5484D', '#30A46C', '#3E63DD'];

function frameStrip(ctx, lt, t0, { w = 900, hz = 1100, label = '', n = 4 } = {}) { // strip centred at (0,0), 250 px tall
  if (lt < t0) return; const e = K.spr(lt - t0, 14, 0.62), h = 250, cw = (w - 40) / n, speed = hz * 0.32; // px/s grows with hz
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.scale(lerp(0.9, 1, clamp(e)), lerp(0.9, 1, clamp(e)));
  ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.fillStyle = C.ink; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.clip();
  const off = ((lt - t0) * speed) % cw;
  for (let k = -1; k <= n + 1; k++) { const x = -w / 2 + 20 + k * cw - off; // sprocket holes, then the frame cell
    for (const yy of [-h / 2 + 14, h / 2 - 34]) for (let j = 0; j < 3; j++) { rr(ctx, x + 14 + j * (cw / 3), yy, cw / 3 - 26, 20, 5); ctx.fillStyle = C.paper; ctx.fill(); }
    rr(ctx, x + 8, -h / 2 + 50, cw - 16, h - 100, 10); ctx.fillStyle = k % 2 ? '#FFE2A8' : C.mari; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = C.ink; ctx.stroke();
    if (label) { font(ctx, 44, 'head'); const tw = ctx.measureText(label).width / 2 + 4, lx = x + cw / 2; if (lx - tw < -w / 2 || lx + tw > w / 2) continue; // only labels fully inside the strip (clip would hide the rest)
      ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + cw / 2, 2); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; }
  }
  ctx.restore();
  rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.restore();
}

function pixelGrid(ctx, lt, t0, { size = 340, gap = 120, quarterAt = null, labels = ['2560×1440', '1280×720'] } = {}) { // two grids, centres at x ±(size+gap)/2
  if (lt < t0) return;
  const grid = (cx, nn, t1, sub) => { const c = size / nn; ctx.save(); ctx.translate(cx - size / 2, -size / 2);
    rr(ctx, -14, -14, size + 28, size + 28, 18); ctx.fillStyle = C.ink; ctx.fill();
    for (let i = 0; i < nn; i++) for (let j = 0; j < nn; j++) { const a = easeOut(prog(lt, t1 + (i + j) * 0.05, t1 + (i + j) * 0.05 + 0.18)); if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a; const x = i * c + 3, y = j * c + 3, s = c - 6; // RGB subpixel stripes per pixel
      for (let q = 0; q < 3; q++) { rr(ctx, x + q * s / 3 + 2, y + 2, s / 3 - 4, s - 4, Math.min(8, s / 12)); ctx.fillStyle = SUB[q]; ctx.fill(); }
      ctx.restore(); }
    if (sub) { ctx.strokeStyle = 'rgba(250,248,245,0.75)'; ctx.lineWidth = 3; ctx.setLineDash([10, 8]); for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(k * size / 4, 0); ctx.lineTo(k * size / 4, size); ctx.moveTo(0, k * size / 4); ctx.lineTo(size, k * size / 4); ctx.stroke(); } ctx.setLineDash([]); }
    ctx.restore(); };
  const xl = -(size + gap) / 2, xr = (size + gap) / 2, q = quarterAt !== null && lt >= quarterAt;
  grid(xl, 4, t0, false); grid(xr, 2, t0 + 0.3, q);
  if (q) { const a = easeOut(prog(lt, quarterAt, quarterAt + 0.3)); ctx.save(); ctx.globalAlpha = a; // ring the one big pixel = 4 small
    ctx.lineWidth = 10; ctx.strokeStyle = C.mari; rr(ctx, xr - size / 2 - 6, -size / 2 - 6, size / 2 + 12, size / 2 + 12, 12); ctx.stroke(); ctx.restore(); }
  for (const [x, t] of [[xl, labels[0]], [xr, labels[1]]]) if (t) txt(ctx, t, x, size / 2 + 90, 50, C.ink, fadeIn(lt, t0 + 0.2, 0.25));
}

function monitorOutline(ctx, lt, t0, { w = 420, label = '' } = {}) { // screen centre at (0,0); stand + base below, label under base
  const f = K.pop(lt, t0); if (!f) return; const h = w * 0.58;
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.scale(f, f); ctx.lineJoin = 'round';
  ctx.lineWidth = 9; ctx.strokeStyle = C.ink;
  ctx.beginPath(); ctx.moveTo(-w * 0.07, h / 2 + 10); ctx.lineTo(-w * 0.05, h / 2 + 120); ctx.lineTo(w * 0.05, h / 2 + 120); ctx.lineTo(w * 0.07, h / 2 + 10); ctx.closePath(); ctx.fillStyle = '#D9D3CC'; ctx.fill(); ctx.stroke(); // neck
  rr(ctx, -w * 0.26, h / 2 + 112, w * 0.52, 26, 13); ctx.fill(); ctx.stroke(); // base
  rr(ctx, -w / 2, -h / 2, w, h, 18); ctx.fillStyle = '#2B2826'; ctx.fill(); ctx.stroke(); // bezel
  ctx.save(); rr(ctx, -w / 2 + 16, -h / 2 + 16, w - 32, h - 46, 8); ctx.clip(); ctx.fillStyle = '#4A4F5A'; ctx.fillRect(-w / 2, -h / 2, w, h);
  const sw = ((lt - t0) * 0.5) % 1.6 - 0.3; ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.moveTo(-w / 2 + sw * w, -h / 2); ctx.lineTo(-w / 2 + sw * w + 90, -h / 2); ctx.lineTo(-w / 2 + sw * w - 60, h / 2); ctx.lineTo(-w / 2 + sw * w - 150, h / 2); ctx.closePath(); ctx.fill(); // light sweep
  ctx.restore();
  ctx.beginPath(); ctx.arc(0, h / 2 - 15, 4, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); // power LED
  ctx.restore();
  if (label) txt(ctx, label, 0, h / 2 + 210, 52, C.ink, fadeIn(lt, t0 + 0.1, 0.25));
}

Object.assign(K, { frameStrip, pixelGrid, monitorOutline });
};
