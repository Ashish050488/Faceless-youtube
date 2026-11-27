// kit component group 'health': sleepMoon, pulseFlame, zoneBar, colourDots, battery, toggle, ecg, globe, hourglass. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr, pop, DRAW, stroked, scale } = K;
function pulseFlame(ctx, cx, cy, lt, t0, tFlame, dark) { dark = false; // ECG-style pulse line, then morphs into a flame
  const p = prog(lt, t0, t0 + 0.45), m = easeInOut(prog(lt, tFlame, tFlame + 0.35));
  const col = dark ? C.paper : C.ink;
  if (m < 1) { ctx.save(); ctx.globalAlpha = 1 - m; stroked(ctx, () => { const pts = [[-360, 0], [-140, 0], [-100, -40], [-60, 0], [-20, 0], [10, -160], [50, 120], [90, 0], [360, 0]]; pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)); }, 1300, p, { lw: 10, col }); ctx.restore(); }
  if (m > 0) { const f = (pop(lt, tFlame + 0.35) || 1) * (1 + 0.03 * Math.sin(lt * 7)); ctx.save(); ctx.translate(cx, cy + 40); ctx.scale(m * f, m * f);
    ctx.beginPath(); ctx.moveTo(0, -200); ctx.bezierCurveTo(120, -80, 140, 40, 0, 110); ctx.bezierCurveTo(-140, 40, -110, -60, -40, -120); ctx.bezierCurveTo(-30, -60, 0, -40, 0, -200); ctx.fillStyle = C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.bezierCurveTo(50, 10, 50, 60, 0, 90); ctx.bezierCurveTo(-50, 60, -40, 10, 0, -40); ctx.fillStyle = C.ember; ctx.fill(); ctx.restore(); }
}
function zoneBar(ctx, cx, y, lt, t0, dark) { dark = false; // heart-rate zones; the fat-burn band lights up
  const cols = ['#C9C1B8', '#F2C46B', C.mari, '#F08A4B', C.wreck];
  for (let i = 0; i < 5; i++) { const e = spr(lt - t0 - i * 0.07, 16); ctx.save(); ctx.globalAlpha = clamp(e * 1.5); const x = cx - 350 + i * 142, hl = i === 2 && lt > t0 + 0.6;
    const lift = hl ? -16 * easeOut(prog(lt, t0 + 0.6, t0 + 0.9)) : 0;
    rr(ctx, x, y + (1 - e) * 30 + lift, 132, hl ? 110 : 80, 22); ctx.fillStyle = cols[i]; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = hl ? 8 : 5; ctx.stroke(); ctx.restore(); }
}
function colourDots(ctx, cx, y, lt, ts, cur, cols) { cols.forEach((c, i) => { const e = spr(lt - ts[i], 16), f = pop(lt, ts[i]) || 0, on = i === cur; ctx.save(); ctx.translate(cx - 320 + i * 160, y); ctx.scale(e * (on ? 1.25 : 1) * (f || 1), e * (on ? 1.25 : 1) * (f || 1)); ctx.beginPath(); ctx.arc(0, 0, 50, 0, 7); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = on ? 10 : 7; ctx.stroke(); ctx.restore(); }); }
function battery(ctx, cx, cy, lt, segs, tFill, dark, { max = 7, drainTo = -1, tDrain = 1e9 } = {}) { dark = false; // cell + day dots; segments fill one by one
  const col = dark ? C.paper : C.ink, w = 620, h = 190;
  ctx.save(); ctx.lineJoin = 'round'; rr(ctx, cx - w / 2, cy - h / 2, w, h, 36); ctx.lineWidth = 12; ctx.strokeStyle = col; ctx.stroke(); rr(ctx, cx + w / 2 + 8, cy - 44, 30, 88, 12); ctx.fillStyle = col; ctx.fill();
  let n = 0; for (let i = 0; i < max; i++) if (lt >= tFill + i * 0.11) n = i + 1; n = Math.min(n, segs);
  if (drainTo >= 0 && lt > tDrain) { const d = Math.floor((lt - tDrain) / 0.1); n = Math.max(drainTo, segs - d); }
  const sw = (w - 48 - (max - 1) * 10) / max;
  for (let i = 0; i < n; i++) { const f = pop(lt, tFill + i * 0.11) || 1; ctx.save(); const x = cx - w / 2 + 24 + i * (sw + 10); ctx.translate(x + sw / 2, cy); ctx.scale(f, f); rr(ctx, -sw / 2, -h / 2 + 24, sw, h - 48, 14); ctx.fillStyle = n <= 3 && drainTo >= 0 ? C.wreck : C.mari; ctx.fill(); ctx.restore(); }
  for (let i = 0; i < max; i++) { ctx.beginPath(); ctx.arc(cx - w / 2 + 24 + i * (sw + 10) + sw / 2, cy + h / 2 + 50, 13, 0, 7); ctx.fillStyle = i < n ? col : (dark ? '#3A3633' : '#D9D3CC'); ctx.fill(); }
  ctx.restore();
}
function toggle(ctx, cx, cy, lt, tFlip, dark) { dark = false; const p = spr(lt - tFlip, 18, 0.5); ctx.save(); rr(ctx, cx - 110, cy - 56, 220, 112, 56); ctx.fillStyle = lt > tFlip ? C.mari : (dark ? '#3A3633' : '#D9D3CC'); ctx.fill(); ctx.strokeStyle = dark ? C.paper : C.ink; ctx.lineWidth = 8; ctx.stroke(); ctx.beginPath(); ctx.arc(lerp(cx - 54, cx + 54, clamp(p, 0, 1.08)), cy, 40, 0, 7); ctx.fillStyle = dark ? C.paper : '#fff'; ctx.fill(); ctx.stroke(); ctx.restore(); }
function ecg(ctx, cx, cy, lt, t0, dark) { dark = false; stroked(ctx, () => { const pts = [[-400, 0], [-200, 0], [-160, -50], [-120, 0], [-60, 0], [-30, -200], [10, 160], [50, 0], [120, 0], [160, -60], [200, 0], [400, 0]]; pts.forEach(([x, y], i) => i ? ctx.lineTo(cx + x, cy + y) : ctx.moveTo(cx + x, cy + y)); }, 1600, prog(lt, t0, t0 + 0.4), { lw: 11, col: dark ? C.paper : C.ink }); }
function globe(ctx, cx, cy, r, lt, t0, tPin, dark) { dark = false; const p = prog(lt, t0, t0 + DRAW), col = dark ? C.paper : C.ink; const rot = lt * 0.15;
  for (const k of [-0.55, 0, 0.55]) stroked(ctx, () => ctx.ellipse(cx, cy, r * Math.abs(Math.cos(k + rot)) + 1, r, 0, 0, 7), 2 * Math.PI * r, p, { lw: 5, col: dark ? '#5A5450' : '#C9C1B8' });
  for (const k of [-0.5, 0, 0.5]) stroked(ctx, () => { const yy = cy + k * r, ww = Math.sqrt(1 - k * k) * r; ctx.moveTo(cx - ww, yy); ctx.lineTo(cx + ww, yy); }, 2 * r, p, { lw: 5, col: dark ? '#5A5450' : '#C9C1B8' });
  stroked(ctx, () => ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * r, p, { lw: 10, col });   // outline last so the grid never covers it
  // China region blob (east-centre of the visible face) lights up, then the pin drops
  if (lt > tPin - 0.1) { const a = easeOut(prog(lt, tPin - 0.1, tPin + 0.2)); ctx.save(); ctx.globalAlpha = a; ctx.beginPath(); ctx.ellipse(cx + r * 0.32, cy - r * 0.18, r * 0.3, r * 0.2, -0.2, 0, 7); ctx.fillStyle = C.wreck; ctx.fill(); ctx.restore(); }
  const d = spr(lt - tPin, 14, 0.5); if (d > 0) { ctx.save(); ctx.translate(cx + r * 0.32, cy - r * 0.18 - (1 - clamp(d)) * 220); ctx.beginPath(); ctx.arc(0, -120, 54, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.stroke(); ctx.beginPath(); ctx.arc(0, -120, 20, 0, 7); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); }
}
function hourglass(ctx, cx, cy, lt, t0, tFlip, dark) { dark = false; const p = prog(lt, t0, t0 + DRAW), fl = easeInOut(prog(lt, tFlip, tFlip + 0.4)), col = dark ? C.paper : C.ink;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(fl * Math.PI);
  stroked(ctx, () => { ctx.moveTo(-130, -190); ctx.lineTo(130, -190); ctx.moveTo(-130, 190); ctx.lineTo(130, 190); ctx.moveTo(-100, -190); ctx.quadraticCurveTo(-100, -40, 0, 0); ctx.quadraticCurveTo(100, 40, 100, 190); ctx.moveTo(100, -190); ctx.quadraticCurveTo(100, -40, 0, 0); ctx.quadraticCurveTo(-100, 40, -100, 190); }, 1400, p, { lw: 11, col });
  if (lt > t0 + DRAW) { const sand = clamp((lt - tFlip) / 2.5); ctx.fillStyle = C.mari; ctx.beginPath(); ctx.moveTo(-70, 150 - 0); ctx.lineTo(70, 150); ctx.lineTo(0, 150 - 70 * (1 - sand)); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-60 * sand, -150 + 60 * (1 - sand)); ctx.lineTo(60 * sand, -150 + 60 * (1 - sand)); ctx.lineTo(0, -60); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// sleepMoon: crescent moon + floating Zz over a night baseline; `n` reading dots rise one by one from `dotsAt`
// (0.14 s apart) on stems of different heights, optional `labels` under the dots ('' = unlabelled). Centre (0,0), ~760 wide.
function sleepMoon(ctx, lt, t0, { n = 5, dotsAt = 1e9, labels = [], gap = 170 } = {}) {
  const e = spr(lt - t0, 14); if (e <= 0) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // moon (marigold crescent = big disc minus offset disc), gentle rock
  ctx.save(); ctx.translate(0, -190); ctx.scale(e, e); ctx.rotate(0.06 * Math.sin(lt * 1.4));
  ctx.beginPath(); ctx.arc(0, 0, 120, 0, Math.PI * 2 - 1e-4); ctx.arc(52, -38, 102, Math.PI * 2 - 1e-4, 0, true); ctx.closePath();
  ctx.fillStyle = C.mari; ctx.fill('evenodd'); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.stroke();
  ctx.beginPath(); ctx.arc(-58, 30, 12, 0, 7); ctx.arc(-30, 74, 8, 0, 7); ctx.fillStyle = '#E09A1A'; ctx.fill(); ctx.restore();
  // Zz drifting up-right, looping every 1.6 s
  for (let k = 0; k < 2; k++) { const ph = ((lt - t0) * 0.62 + k * 0.5) % 1, a = clamp(e) * Math.sin(ph * Math.PI);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(150 + ph * 70 + k * 40, -250 - ph * 90 - k * 30); const z = k ? 30 : 44;
    ctx.beginPath(); ctx.moveTo(-z / 2, -z / 2); ctx.lineTo(z / 2, -z / 2); ctx.lineTo(-z / 2, z / 2); ctx.lineTo(z / 2, z / 2); ctx.strokeStyle = C.ink; ctx.lineWidth = k ? 7 : 9; ctx.stroke(); ctx.restore(); }
  // night baseline (dashed) + stars
  const w = gap * (n - 1) + 160; ctx.save(); ctx.globalAlpha = clamp(e); ctx.setLineDash([18, 16]); ctx.beginPath(); ctx.moveTo(-w / 2, 150); ctx.lineTo(w / 2, 150); ctx.strokeStyle = '#C9C1B8'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  for (const [sx, sy] of [[-300, -260], [-210, -140], [290, -120]]) { const tw = 0.6 + 0.4 * Math.sin(lt * 3 + sx); ctx.save(); ctx.globalAlpha = clamp(e) * tw; ctx.translate(sx, sy); ctx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 6 : 16, a = i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); }
  // reading dots rise on stems
  const hs = [90, 60, 110, 75, 95];
  for (let i = 0; i < n; i++) { const ti = dotsAt + i * 0.14, d = spr(lt - ti, 16); if (d <= 0) continue; const x = -gap * (n - 1) / 2 + i * gap, h = hs[i % 5] * clamp(d, 0, 1.1);
    ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x, 150 - h); ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.stroke();
    ctx.save(); ctx.translate(x, 150 - h); const f = pop(lt, ti) || 1; ctx.scale(f, f); ctx.beginPath(); ctx.arc(0, 0, 30, 0, 7); ctx.fillStyle = i % 2 ? C.ember : C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); ctx.restore();
    if (labels[i]) { ctx.save(); ctx.globalAlpha = clamp(d * 1.5); font(ctx, 48, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(labels[i], x, 230); ctx.restore(); } }
  ctx.restore();
}
Object.assign(K, { sleepMoon, pulseFlame, zoneBar, colourDots, battery, toggle, ecg, globe, hourglass });
};
