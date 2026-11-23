// kit component group 'tracker': keychains, item trackers, slides, coin cells. Drawn around (0,0) at 1080 scale;
// render.js places them with x, y, s. keyRing (split ring + chain + key, swings), trackerPing (map pin + radar rings),
// filmSlide (35 mm slide mount, optional projector beam), coinCell (twist cover opens, cell swaps), trackerDisc
// (generic round tracker, no logo), photoStack (n mini photos stack one by one).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, font, rr } = L;
module.exports = (K) => {
const fadeIn = (lt, t0, d = 0.15) => clamp((lt - t0) / d);
const METAL = '#C9CDD2', METAL_D = '#8E949B';

function keyRing(ctx, lt, t0) { // ring top at (0,-150); key hangs below and swings
  if (lt < t0) return; const e = K.spr(lt - t0, 14, 0.6), sw = 0.35 * Math.exp(-(lt - t0) * 1.8) * Math.sin((lt - t0) * 6) + 0.05 * Math.sin(lt * 1.4);
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.translate(0, lerp(-80, 0, e) - 80);
  for (const [w, c] of [[30, C.ink], [18, METAL]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(0, 0, 80, 0, 2 * Math.PI - 1e-4); ctx.stroke(); }
  ctx.lineWidth = 4; ctx.strokeStyle = METAL_D; ctx.beginPath(); ctx.arc(0, 0, 80, -0.5, 0.4); ctx.stroke(); // split-ring gap line
  ctx.translate(0, 80); ctx.rotate(sw);
  for (let i = 0; i < 2; i++) { ctx.save(); ctx.translate(0, 26 + i * 44); for (const [w, c] of [[16, C.ink], [7, METAL]]) { ctx.lineWidth = w; ctx.strokeStyle = c; ctx.beginPath(); ctx.ellipse(0, 0, 14, 26, 0, 0, 2 * Math.PI - 1e-4); ctx.stroke(); } ctx.restore(); }
  ctx.translate(0, 110); ctx.lineJoin = 'round'; ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.fillStyle = C.mari; // key: bow + blade + teeth
  ctx.beginPath(); ctx.arc(0, 50, 50, 0, 2 * Math.PI - 1e-4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 38, 14, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-16, 98); ctx.lineTo(-16, 250); ctx.lineTo(0, 270); ctx.lineTo(16, 250); ctx.lineTo(16, 230); ctx.lineTo(40, 230); ctx.lineTo(40, 205); ctx.lineTo(16, 205); ctx.lineTo(16, 185); ctx.lineTo(34, 185); ctx.lineTo(34, 160); ctx.lineTo(16, 160); ctx.lineTo(16, 98); ctx.closePath();
  ctx.fillStyle = C.mari; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function trackerPing(ctx, lt, t0) { // pin tip at (0,0); rings pulse round the tip
  if (lt < t0) return; const e = K.spr(lt - t0, 15, 0.55);
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0);
  for (let k = 0; k < 3; k++) { const ph = ((lt - t0) * 0.8 + k / 3) % 1; ctx.save(); ctx.globalAlpha *= (1 - ph) * 0.9; ctx.lineWidth = 10; ctx.strokeStyle = C.ember;
    ctx.beginPath(); ctx.ellipse(0, 0, 40 + ph * 200, (40 + ph * 200) * 0.36, 0, 0, 2 * Math.PI - 1e-4); ctx.stroke(); ctx.restore(); }
  ctx.translate(0, lerp(-200, 0, e)); ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = C.ink;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-30, -60, -110, -120, -110, -200); ctx.arc(0, -200, 110, Math.PI, 0); ctx.bezierCurveTo(110, -120, 30, -60, 0, 0); ctx.closePath();
  ctx.fillStyle = C.mari; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -205, 46, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.stroke();
  ctx.restore();
}

function filmSlide(ctx, lt, t0, { beamAt = null } = {}) { // 300×300 mount centred at (0,0); projector sits left at x −360
  if (lt < t0) return; const e = K.spr(lt - t0, 14, 0.6);
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0);
  if (beamAt !== null && lt >= beamAt) { const b = easeOut(prog(lt, beamAt, beamAt + 0.3));
    ctx.save(); ctx.globalAlpha *= 0.55 * b; ctx.fillStyle = '#FFE7A8'; ctx.beginPath(); ctx.moveTo(-290, -18); ctx.lineTo(lerp(-290, 0, b), -170); ctx.lineTo(lerp(-290, 0, b), 170); ctx.lineTo(-290, 18); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(-380, 0); ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round';
    rr(ctx, -90, -70, 150, 140, 22); ctx.fillStyle = C.stone; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(60, -34, 34, 68); ctx.fillStyle = C.inkLine; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-15, -100, 30, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paperSoft; ctx.fill(); ctx.stroke(); // reel
    ctx.restore(); }
  ctx.translate(0, lerp(60, 0, e)); ctx.rotate(lerp(0.2, 0, e) + 0.02 * Math.sin(lt * 1.2));
  ctx.shadowColor = 'rgba(21,19,18,0.2)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
  rr(ctx, -150, -150, 300, 300, 26); ctx.fillStyle = '#F3EEE4'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke();
  rr(ctx, -100, -72, 200, 144, 14); ctx.fillStyle = '#E9A23B'; ctx.fill(); ctx.stroke();
  ctx.save(); rr(ctx, -100, -72, 200, 144, 14); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.35)'; const sx = ((lt - t0) * 160) % 420 - 210;
  ctx.beginPath(); ctx.moveTo(sx, -80); ctx.lineTo(sx + 50, -80); ctx.lineTo(sx - 10, 80); ctx.lineTo(sx - 60, 80); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = C.stone; for (const [x, y, w] of [[-100, -118, 120], [-100, 100, 160], [-100, 122, 90]]) { rr(ctx, x, y, w, 10, 5); ctx.fill(); }
  ctx.restore();
}

function coinCell(ctx, lt, t0, { swapAt = null, label = '' } = {}) { // cover twists open at t0+0.25, lifts; old cell out, new in at swapAt
  if (lt < t0) return; const ts = swapAt ?? t0 + 1.0, tw = easeInOut(prog(lt, t0 + 0.25, t0 + 0.65)), lift = easeOut(prog(lt, t0 + 0.65, t0 + 0.95));
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0);
  const cell = (x, y, a) => { ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
    for (const [r, c] of [[130, METAL_D], [118, METAL]]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = c; ctx.fill(); }
    ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 130, 0, 2 * Math.PI - 1e-4); ctx.stroke();
    font(ctx, 90, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('+', 0, -40);
    if (label) { font(ctx, 52, 'head'); ctx.fillText(label, 0, 40); } ctx.textAlign = 'left'; ctx.restore(); };
  const out = easeInOut(prog(lt, ts - 0.45, ts - 0.1)), inn = easeOut(prog(lt, ts, ts + 0.3));
  ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.beginPath(); ctx.arc(0, 0, 150, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paperLine; ctx.fill(); ctx.stroke(); // socket
  if (lt < ts) cell(lerp(0, 260, out), 0, 1 - out * 0.7); else cell(0, lerp(-300, 0, inn), clamp((lt - ts) / 0.1));
  if (lift < 1) { ctx.save(); ctx.translate(lerp(0, -40, lift), lerp(0, -330, lift)); ctx.rotate(-tw * Math.PI / 2); ctx.globalAlpha *= 1 - lift; // twist cover with slot + arrows
    ctx.beginPath(); ctx.arc(0, 0, 150, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); ctx.stroke();
    rr(ctx, -80, -16, 160, 32, 16); ctx.fillStyle = C.ink; ctx.fill();
    ctx.lineWidth = 7; for (const a of [0.6, 0.6 + Math.PI]) { ctx.beginPath(); ctx.arc(0, 0, 110, a, a + 0.9); ctx.stroke(); } ctx.restore(); }
  ctx.restore();
}

function trackerDisc(ctx, lt, t0) { // generic round tracker (no logo), r 140
  if (lt < t0) return; const e = K.spr(lt - t0, 15, 0.6);
  ctx.save(); ctx.globalAlpha = fadeIn(lt, t0); ctx.translate(0, 2 * Math.sin(lt * 2)); ctx.scale(e, e);
  ctx.shadowColor = 'rgba(21,19,18,0.22)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.beginPath(); ctx.arc(0, 0, 140, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = METAL; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 112, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-35, -40, 40, 18, -0.6, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = 'rgba(21,19,18,0.06)'; ctx.fill();
  ctx.restore();
}

function photoStack(ctx, lt, t0, { n = 12 } = {}) { // n mini photos (120×100) land one by one into a fanned pile
  const cols = ['#E9A23B', '#7FB8E6', '#E5484D', '#6CC08B', '#B79BE8', '#F2C94C'];
  for (let i = 0; i < n; i++) { const ti = t0 + i * 0.07; if (lt < ti) break; const e = easeOut(prog(lt, ti, ti + 0.2));
    const a = (i - (n - 1) / 2) * 0.07, x = (i - (n - 1) / 2) * 24;
    ctx.save(); ctx.translate(x, lerp(-120, 0, e)); ctx.rotate(a); ctx.globalAlpha = clamp(e * 2);
    rr(ctx, -70, -60, 140, 120, 10); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    rr(ctx, -56, -46, 112, 76, 6); ctx.fillStyle = cols[i % cols.length]; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-56, 30); ctx.lineTo(-20, -6); ctx.lineTo(10, 18); ctx.lineTo(30, 2); ctx.lineTo(56, 30); ctx.closePath(); ctx.fillStyle = 'rgba(21,19,18,0.25)'; ctx.fill();
    ctx.restore(); }
}

Object.assign(K, { keyRing, trackerPing, filmSlide, coinCell, trackerDisc, photoStack });
};
