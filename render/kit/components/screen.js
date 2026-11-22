// kit component group 'screen': screenPath, setScreen, motionLines, screenDim, playIcon, loupe. Loaded by core.js; shared helpers come from K.
const { createCanvas } = require('@napi-rs/canvas');
const L = require('../../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
module.exports = (K, env) => {
const { FPS, IMG, MAP } = env, FR = 1 / FPS;
const { spr, pop, COOL, product, scale } = K;
let SCR = env.SCR || [[0.1, 0.02], [0.4, 0.02], [0.53, 0.43], [0.22, 0.39]];   // screen quad (fractions of a product image)
function screenPath(ctx, r) { ctx.beginPath(); SCR.forEach(([u, v], i) => { const x = r.x0 + u * r.w, y = r.y0 + v * r.h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
const setScreen = q => { SCR = q; };
function motionLines(ctx, r, lt, t0) { // smooth 120 Hz streaks sweeping across the real screen
  if (lt < t0) return; ctx.save(); screenPath(ctx, r); ctx.clip();
  for (let i = 0; i < 7; i++) { const ph = ((lt - t0) * 1.6 + i * 0.17) % 1, x = r.x0 + r.w * (-0.1 + ph * 0.7), y = r.y0 + r.h * (0.07 + i * 0.05);
    const g = ctx.createLinearGradient(x - 180, 0, x + 40, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.85)'); ctx.strokeStyle = g; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 180, y); ctx.lineTo(x + 40, y); ctx.stroke(); }
  ctx.restore();
}
function screenDim(ctx, r, d) { if (d <= 0) return; ctx.save(); screenPath(ctx, r); ctx.fillStyle = `rgba(21,19,18,${d})`; ctx.fill(); ctx.restore(); }
function playIcon(ctx, r, lt, t0) { const f = pop(lt, t0); if (!f) return; const cx = r.x0 + r.w * 0.31, cy = r.y0 + r.h * 0.2; ctx.save(); ctx.translate(cx, cy); ctx.scale(f, f); ctx.beginPath(); ctx.arc(0, 0, 58, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.fill(); ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(30, 0); ctx.lineTo(-18, 28); ctx.closePath(); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore(); }
function loupe(ctx, im, srcCx, srcCy, srcR, cx, cy, R, lt, t0) { // magnifier showing the real ports enlarged
  const e = spr(lt - t0, 13, 0.6); if (e <= 0) return; ctx.save(); ctx.translate(cx, cy); ctx.scale(e, e);
  ctx.shadowColor = 'rgba(21,19,18,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R - 6, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = COOL; ctx.fillRect(-R, -R, 2 * R, 2 * R); ctx.drawImage(im, srcCx - srcR, srcCy - srcR, srcR * 2, srcR * 2, -R, -R, 2 * R, 2 * R); ctx.restore();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
}

// ---- display cross-sections (sow015). Drawn around (0,0), width w; layers enter bottom-up from t0 (0.22 s stagger).
const layerIn = (lt, t0) => clamp(spr(lt - t0, 14, 0.6));
function stackLabel(ctx, text, x, y, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= clamp(a); font(ctx, 46, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y); ctx.restore(); }
function glassLayer(ctx, w, y, h) { rr(ctx, -w / 2, y, w, h, 12); ctx.fillStyle = 'rgba(190,215,240,0.55)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.save(); ctx.globalAlpha = 0.7; ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-w / 2 + 30, y + h * 0.35); ctx.lineTo(-w / 2 + 160, y + h * 0.35); ctx.stroke(); ctx.restore(); }
// miniLedStack: glass → LCD (RGB filter cells) → backlight of tiny LEDs grouped in zones; light rays rise when lit
function miniLedStack(ctx, lt, t0, { w = 900, labels = true, litAt = null } = {}) {
  const lit = litAt === null ? t0 + 0.8 : litAt, L3 = [{ y: 150, h: 56 }, { y: 40, h: 70 }, { y: -60, h: 50 }]; // backlight, LCD, glass (y = top)
  // backlight board + LEDs in zones
  let a = layerIn(lt, t0); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 60);
    rr(ctx, -w / 2, L3[0].y, w, L3[0].h, 12); ctx.fillStyle = '#3A3633'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke();
    const zones = 6, zw = w / zones, on = clamp((lt - lit) / 0.3);
    for (let z = 0; z < zones; z++) { if (z) { ctx.strokeStyle = '#8C847C'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-w / 2 + z * zw, L3[0].y + 6); ctx.lineTo(-w / 2 + z * zw, L3[0].y + L3[0].h - 6); ctx.stroke(); }
      for (let k = 0; k < 5; k++) { const x = -w / 2 + z * zw + zw * (k + 0.5) / 5, y = L3[0].y + L3[0].h / 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, 7); ctx.fillStyle = on > 0 ? `rgba(255,${Math.round(lerp(120, 236, on))},${Math.round(lerp(60, 170, on))},1)` : '#6b645e'; ctx.fill();
        if (on > 0) { ctx.save(); ctx.globalAlpha = 0.28 * on; const g = ctx.createLinearGradient(0, y, 0, L3[1].y + L3[1].h); g.addColorStop(0, '#FFE7A8'); g.addColorStop(1, 'rgba(255,231,168,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 22, L3[1].y + L3[1].h); ctx.lineTo(x + 22, L3[1].y + L3[1].h); ctx.lineTo(x + 6, y); ctx.fill(); ctx.restore(); } } }
    ctx.restore(); if (labels) stackLabel(ctx, 'MINI-LED', w / 2 + 34, L3[0].y + L3[0].h / 2, a); }
  // LCD: pixel cells with RGB sub-filters (they only filter light)
  a = layerIn(lt, t0 + 0.22); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 60);
    rr(ctx, -w / 2, L3[1].y, w, L3[1].h, 12); ctx.fillStyle = '#E9E4DE'; ctx.fill(); const n = 24, cw = w / n, glow = clamp((lt - lit) / 0.3);
    for (let i = 0; i < n; i++) { const col = ['#E5484D', '#3DBE6B', '#3B82F6'][i % 3]; ctx.globalAlpha = a * (0.35 + 0.5 * glow); ctx.fillStyle = col; ctx.fillRect(-w / 2 + i * cw + 4, L3[1].y + 10, cw - 8, L3[1].h - 20); }
    ctx.globalAlpha = a; rr(ctx, -w / 2, L3[1].y, w, L3[1].h, 12); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore(); if (labels) stackLabel(ctx, 'LCD', w / 2 + 34, L3[1].y + L3[1].h / 2, a); }
  a = layerIn(lt, t0 + 0.44); if (a > 0) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(0, (1 - a) * 60); glassLayer(ctx, w, L3[2].y, L3[2].h); ctx.restore(); if (labels) stackLabel(ctx, 'GLASS', w / 2 + 34, L3[2].y + L3[2].h / 2, a); }
}
// oledStack: glass → (touch) → 1 or 2 self-lit OLED pixel layers (each pixel glows on its own). layer2At drops the second
// layer in; crackAt cracks the glass and peels the layers apart (iFixit teardown)
function oledStack(ctx, lt, t0, { w = 900, layers = 1, layer2At = null, touch = false, crackAt = null, labels = true, offAt = null } = {}) {
  const two = layers >= 2 || (layer2At !== null && lt >= layer2At), d2 = layer2At !== null ? clamp(spr(lt - layer2At, 13, 0.55)) : 1;
  const cr = crackAt !== null ? easeOut(prog(lt, crackAt, crackAt + 0.5)) : 0, peel = k => cr * k * 34;
  let y = 160; const rows = [];
  rows.push({ name: two ? 'OLED 1' : 'OLED', kind: 'oled', y, at: t0 }); y -= 92;
  if (two) { rows.push({ name: 'OLED 2', kind: 'oled', y: y - (1 - d2) * 220, at: t0, alpha: d2 }); y -= 92; }
  if (touch) { rows.push({ name: 'TOUCH', kind: 'touch', y, at: t0 + 0.22 }); y -= 70; }
  rows.push({ name: 'GLASS', kind: 'glass', y: y + 20, at: t0 + 0.44 });
  rows.forEach((r, k) => { const a = layerIn(lt, r.at) * (r.alpha ?? 1); if (a <= 0) return; const yy = r.y + (1 - layerIn(lt, r.at)) * 60 - peel(k);
    ctx.save(); ctx.globalAlpha *= a;
    if (r.kind === 'glass') glassLayer(ctx, w, yy, 50);
    else if (r.kind === 'touch') { rr(ctx, -w / 2, yy, w, 40, 10); ctx.fillStyle = '#F4EFE8'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.strokeStyle = '#8C847C'; ctx.lineWidth = 3; for (let i = 1; i < 16; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + i * w / 16, yy + 8); ctx.lineTo(-w / 2 + i * w / 16, yy + 32); ctx.stroke(); } }
    else { rr(ctx, -w / 2, yy, w, 70, 12); ctx.fillStyle = '#26221F'; ctx.fill(); const n = 24, cw = w / n, off = offAt !== null && lt >= offAt;
      for (let i = 0; i < n; i++) { const cx = -w / 2 + cw * (i + 0.5), cy = yy + 35, col = ['#FF5A5F', '#4ADE80', '#60A5FA'][i % 3], isOff = off && (i < 9 || i > 14);
        if (!isOff) { ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(cx, cy, cw * 0.28, 0, 7); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }
        else { ctx.beginPath(); ctx.arc(cx, cy, cw * 0.28, 0, 7); ctx.fillStyle = '#100E0D'; ctx.fill(); } }
      rr(ctx, -w / 2, yy, w, 70, 12); ctx.lineWidth = 6; ctx.strokeStyle = C.ink; ctx.stroke(); }
    if (cr > 0 && r.kind !== 'touch') { ctx.save(); ctx.strokeStyle = r.kind === 'glass' ? C.ink : '#fff'; ctx.lineWidth = 4; const L = cr * w * 0.45; ctx.beginPath();
      for (const [sx, dir] of [[-0.1, 1], [0.15, -1], [0.3, 1]]) { ctx.moveTo(sx * w, yy + 6); let px = sx * w, py = yy + 6; for (let s = 1; s <= 6; s++) { px += dir * L / 6 * (s % 2 ? 1 : 0.6); py = yy + 6 + ((s * 37) % (r.kind === 'glass' ? 40 : 60)); ctx.lineTo(px, py); } } ctx.stroke(); ctx.restore(); }
    ctx.restore(); if (labels) stackLabel(ctx, r.name, w / 2 + 34, yy + (r.kind === 'oled' ? 35 : r.kind === 'touch' ? 20 : 25), a); });
}
// starScreen: a screen (bezel) with a black night sky and one white star. bloomAt: the mini-LED zone behind the star
// lights → soft grey halo (blooming). offAt: pixel grid shows every pixel around the star at 0 (OLED: true black)
function starScreen(ctx, lt, t0, { w = 820, bloomAt = null, offAt = null, zones = false } = {}) {
  const f = pop(lt, t0); if (!f) return; const h = w * 0.62; ctx.save(); ctx.scale(f, f);
  ctx.shadowColor = 'rgba(21,19,18,0.25)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(ctx, -w / 2 - 26, -h / 2 - 26, w + 52, h + 52, 34); ctx.fillStyle = '#2B2826'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 10); ctx.clip(); ctx.fillStyle = '#050505'; ctx.fillRect(-w / 2, -h / 2, w, h);
  const sx = w * 0.08, sy = -h * 0.06;
  if (zones) { ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + i * w / 8, -h / 2); ctx.lineTo(-w / 2 + i * w / 8, h / 2); ctx.stroke(); } for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2 + j * h / 5); ctx.lineTo(w / 2, -h / 2 + j * h / 5); ctx.stroke(); } }
  if (bloomAt !== null && lt >= bloomAt) { const b = easeOut(prog(lt, bloomAt, bloomAt + 0.6)); // whole zone glows grey + halo
    ctx.fillStyle = `rgba(120,120,128,${0.35 * b})`; const zx = Math.floor((sx + w / 2) / (w / 8)), zy = Math.floor((sy + h / 2) / (h / 5)); ctx.fillRect(-w / 2 + zx * w / 8, -h / 2 + zy * h / 5, w / 8, h / 5);
    const g = ctx.createRadialGradient(sx, sy, 10, sx, sy, 150 * b + 10); g.addColorStop(0, 'rgba(230,230,240,0.55)'); g.addColorStop(1, 'rgba(230,230,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, 160, 0, 7); ctx.fill(); }
  if (offAt !== null && lt >= offAt) { const o = easeOut(prog(lt, offAt, offAt + 0.4)); ctx.globalAlpha = o; const cs = 26; // pixel grid, all off but the star
    for (let gx = -6; gx <= 6; gx++) for (let gy = -4; gy <= 4; gy++) { if (!gx && !gy) continue; ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(sx + gx * cs - cs / 2 + 3, sy + gy * cs - cs / 2 + 3, cs - 6, cs - 6); } ctx.globalAlpha = 1; }
  ctx.save(); ctx.translate(sx, sy); ctx.rotate(lt * 0.3); ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 9 : 24, an = i * Math.PI / 5 - Math.PI / 2; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.restore(); rr(ctx, -w / 2 - 26, -h / 2 - 26, w + 52, h + 52, 34); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke(); ctx.restore();
}

Object.assign(K, { screenPath, setScreen, motionLines, screenDim, playIcon, loupe, miniLedStack, oledStack, starScreen });
};
