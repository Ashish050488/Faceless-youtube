// SoW Nº004 — Lenovo ThinkBook 14x (sow002 engine). PRODUCTION_SPEC §12–15: flat solid backgrounds, centred & big, hard cuts on beats,
// motion on the spoken beat then calm, 1–3 words per scene, flat 2-D objects next to REAL product images, no captions.
//   node render/sow002.js <work_dir> [--stills cues|t1,t2,...] [--fps 30]
// work_dir: words.json (meta/align_words.py), assets/{cut_*.png,card_*.jpg}, wm_light.png, wm_dark.png
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const L = require('./lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;

const work = process.argv[2];
const args = process.argv.slice(3);
const FPS = args.includes('--fps') ? Number(args[args.indexOf('--fps') + 1]) : 30;
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
L.registerFonts(path.join(__dirname, 'fonts'));
const FR = 1 / FPS;
const words = JSON.parse(fs.readFileSync(path.join(work, 'words.json')));
const DURATION = Number(fs.readFileSync(path.join(work, 'voice_seconds.txt'), 'utf8'));

// ---------- motion ----------
const spr = (t, k = 15, z = 0.62) => t <= 0 ? 0 : 1 - Math.exp(-z * k * t) * (Math.cos(k * Math.sqrt(1 - z * z) * t) + z / Math.sqrt(1 - z * z) * Math.sin(k * Math.sqrt(1 - z * z) * t));
const easeIn = t => { t = clamp(t); return t * t * t; };
const pop = (lt, t0) => lt < t0 ? 0 : 1 + 0.04 * Math.exp(-(lt - t0) * 10) * Math.cos((lt - t0) * 18) - 0.04 * Math.exp(-(lt - t0) * 30); // 1.04 → 1.0
const DRAW = 12 * FR;                                        // stroke draw-on 12 frames

// ---------- words ----------
const nw = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function wIdx(token, from) { for (let i = from; i < words.length; i++) if (nw(words[i].w).startsWith(nw(token))) return i; throw new Error('word ' + token + ' after ' + from); }
let CUR = null;
const T = (token, nth = 0) => { let i = CUR.w0; for (let n = 0; n <= nth; n++) i = wIdx(token, n === 0 ? i : i + 1); return words[i].start - CUR.start; };
const TE = (token, nth = 0) => { let i = CUR.w0; for (let n = 0; n <= nth; n++) i = wIdx(token, n === 0 ? i : i + 1); return words[i].end - CUR.start; };

// ---------- assets ----------
const IMG = {};
const SHADOW = createCanvas(400, 90);
{ const x = SHADOW.getContext('2d'); x.filter = 'blur(16px)'; x.fillStyle = 'rgba(21,19,18,0.5)'; x.beginPath(); x.ellipse(200, 45, 160, 18, 0, 0, 7); x.fill(); }
async function loadAssets() {
  const d = path.join(work, 'assets');
  for (const f of fs.readdirSync(d)) if (/\.(png|jpg)$/.test(f)) IMG[f.replace(/\.\w+$/, '')] = await L.loadImage(path.join(d, f));
  IMG.wm_light = await L.loadImage(path.join(work, 'wm_light.png'));
  IMG.wm_dark = await L.loadImage(path.join(work, 'wm_dark.png'));
}

// ---------- real product: focus pull on entry, rim light, contact shadow, ±1.5° drift, 1→1.02 push ----------
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
function objShadow(ctx, cx, y, w) { ctx.save(); ctx.globalAlpha = 0.5; ctx.drawImage(SHADOW, cx - w / 2, y - 18, w, 36); ctx.restore(); }
function stroked(ctx, drawPath, len, p, { lw = 8, col = C.ink } = {}) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash([len * clamp(p), len + 10]); ctx.beginPath(); drawPath(); ctx.stroke(); ctx.restore(); }
function sun(ctx, cx, cy, r, lt, t0, grow, { dark = true } = {}) { dark = false; // rays length grows with `grow` 0..1 (shrinks at the catch)
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW);
  ctx.save(); ctx.translate(cx, cy); ctx.scale(f || 1, f || 1);
  const pulse = 1 + 0.04 * Math.sin(lt * 2.2);
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r0 = r * 1.35, r1 = r0 + r * (0.25 + 0.75 * grow) * pulse;
    const rp = clamp(p * 1.4 - i * 0.03); stroked(ctx, () => { ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }, r1 - r0, rp, { lw: 16, col: C.ink }); stroked(ctx, () => { ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); }, r1 - r0, rp, { lw: 8, col: C.mari }); }
  stroked(ctx, () => ctx.arc(0, 0, r, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * r, p, { lw: 9, col: dark ? C.paper : C.ink });
  if (lt >= t0 + DRAW) { ctx.beginPath(); ctx.arc(0, 0, r - 5, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); }
  ctx.restore();
}
function priceTag(ctx, ax, ay, lt, t0, text, { dark = true } = {}) { dark = false; // hangs from (ax, ay), swings and settles with damping
  const e = clamp((lt - t0) / 0.25); if (e <= 0) return;
  const sw = (lt - t0) < 0 ? 0 : 0.5 * Math.exp(-(lt - t0) * 1.6) * Math.sin((lt - t0) * 6.5) + 0.03 * Math.sin(lt * 1.3);
  const drop = (1 - easeOut(e)) * -160;
  ctx.save(); ctx.translate(ax, ay + drop); ctx.rotate(sw);
  ctx.strokeStyle = dark ? C.paper : C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 120); ctx.stroke();
  ctx.translate(0, 120); const w = 330, h = 190;
  ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(w / 2, 60); ctx.lineTo(w / 2, h); ctx.lineTo(-w / 2, h); ctx.lineTo(-w / 2, 60); ctx.closePath();
  ctx.fillStyle = C.mari; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 26, 12, 0, 7); ctx.fillStyle = dark ? C.ink : C.paper; ctx.fill(); ctx.stroke();
  font(ctx, 110, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 128); ctx.textAlign = 'left';
  ctx.restore();
}
function calipers(ctx, xL, xR, y, lt, t0, dark) { dark = false; // jaws slide in and clamp the edge
  const p = prog(lt, t0, t0 + DRAW), c = easeOut(prog(lt, t0 + DRAW, t0 + DRAW + 0.35));
  const col = dark ? C.paper : C.ink, gap = lerp(120, 0, c);
  stroked(ctx, () => { ctx.moveTo(xL - 120, y - 260); ctx.lineTo(xR + 120, y - 260); }, xR - xL + 240, p, { lw: 12, col });
  stroked(ctx, () => { ctx.moveTo(xL - 60 - gap, y - 260); ctx.lineTo(xL - 60 - gap, y - 40); ctx.lineTo(xL - gap, y); }, 300, p, { lw: 12, col });
  stroked(ctx, () => { ctx.moveTo(xR + 60 + gap, y - 260); ctx.lineTo(xR + 60 + gap, y - 40); ctx.lineTo(xR + gap, y); }, 300, p, { lw: 12, col });
  if (c >= 1) { ctx.save(); ctx.fillStyle = C.mari; ctx.globalAlpha = 0.9; rr(ctx, xL - 90, y - 300, xR - xL + 180, 22, 11); ctx.fill(); ctx.restore(); }
}
function scale(ctx, cx, cy, lt, t0, tLevel, dark) { dark = false; // balance tips, then levels on the word
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW) || 1;
  const tilt = lt < tLevel ? 0.22 : 0.22 * Math.exp(-(lt - tLevel) * 5) * Math.cos((lt - tLevel) * 9);
  const col = dark ? C.paper : C.ink;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(f * 0.8, f * 0.8);
  stroked(ctx, () => { ctx.moveTo(0, -40); ctx.lineTo(0, 210); ctx.moveTo(-110, 210); ctx.lineTo(110, 210); }, 470, p, { lw: 12, col });
  ctx.save(); ctx.rotate(tilt); stroked(ctx, () => { ctx.moveTo(-330, -40); ctx.lineTo(330, -40); }, 660, p, { lw: 12, col });
  for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 330, -40); ctx.rotate(-tilt);
    stroked(ctx, () => { ctx.moveTo(0, 0); ctx.lineTo(-90, 120); ctx.moveTo(0, 0); ctx.lineTo(90, 120); ctx.moveTo(-120, 120); ctx.quadraticCurveTo(0, 190, 120, 120); }, 520, p, { lw: 9, col });
    if (s === 1 && lt >= t0 + DRAW) { ctx.save(); ctx.translate(0, 112); const ff = pop(lt, t0 + DRAW); ctx.scale(ff, ff); ctx.beginPath(); ctx.arc(0, -24, 34, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); font(ctx, 30, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('25', 0, -22); ctx.textAlign = 'left'; ctx.restore(); }
    ctx.restore(); }
  ctx.restore(); ctx.restore();
  return tilt;
}
function waterDrop(ctx, cx, cy, lt, t0, dark) { dark = false; // drop falls, splashes, ripples fade out
  const fall = easeIn(prog(lt, t0, t0 + 0.35)), y = lerp(cy - 360, cy, fall);
  if (fall < 1) { ctx.save(); ctx.translate(cx, y); ctx.beginPath(); ctx.moveTo(0, -60); ctx.bezierCurveTo(40, -10, 44, 30, 0, 40); ctx.bezierCurveTo(-44, 30, -40, -10, 0, -60); ctx.fillStyle = '#7CC4E8'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke(); ctx.restore(); }
  for (let k = 0; k < 3; k++) { const rp = prog(lt, t0 + 0.35 + k * 0.18, t0 + 1.6 + k * 0.18); if (rp <= 0 || rp >= 1) continue;
    ctx.save(); ctx.globalAlpha = 1 - rp; ctx.strokeStyle = dark ? '#7CC4E8' : '#3A8FB7'; ctx.lineWidth = 8; ctx.beginPath(); ctx.ellipse(cx, cy + 30, 60 + rp * 340, 16 + rp * 70, 0, 0, 7); ctx.stroke(); ctx.restore(); }
}
function waves(ctx, cx, cy, lt, t0, dark) { dark = false; // swim waves icon
  const p = prog(lt, t0, t0 + DRAW);
  for (let r = 0; r < 2; r++) stroked(ctx, () => { for (let i = 0; i <= 40; i++) { const x = cx - 180 + i * 9, y = cy + r * 44 + Math.sin(i * 0.6 + lt * 3) * 12; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }, 420, p - r * 0.15, { lw: 9, col: '#3A8FB7' });
}
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
function stamp(ctx, text, cx, cy, p, col, px = 150) { if (p <= 0) return; const q = easeOut(p), s = lerp(1.3, 1, q), r = lerp(-4, 0, q) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3); font(ctx, px, 'head'); const w = ctx.measureText(text).width + px * 0.7, h = px * 1.2;
  ctx.lineWidth = 12; ctx.strokeStyle = col; rr(ctx, -w / 2, -h / 2, w, h, 22); ctx.stroke(); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, px * 0.06); ctx.restore(); ctx.textAlign = 'left'; }
function wordmark(ctx, cx, cy, px, tip, dark, a = 1) { dark = false; font(ctx, px, 'logo'); const parts = [['spec ', dark ? C.paper : C.ink], ['or ', C.ember], ['wrec', dark ? C.paper : C.ink]];
  const kW = ctx.measureText('k').width, total = parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0) + kW; let x = cx - total / 2; ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
  for (const [t, col] of parts) { ctx.fillStyle = col; ctx.fillText(t, x, cy); x += ctx.measureText(t).width; }
  ctx.save(); ctx.translate(x + kW, cy + 4 * tip); ctx.rotate(18 * tip * Math.PI / 180); ctx.fillStyle = dark ? C.paper : C.ink; ctx.fillText('k', -kW, 0); ctx.restore(); ctx.restore(); }

// ======================= SCENES (sow004) =======================
const LAV = '#ECE8FB', BLUSH = '#FBE7E2', COOL = '#EEF0F4';
const S = [];
function scene(o) { S.push(o); }
const MAP = JSON.parse(fs.readFileSync(path.join(work, 'assets', 'map_robinson.json')));
const BOTTOM = 1240;                                   // all content ends here (watermark box below)
// screen quad of cut_hero (fractions of the image) for on-screen graphics
const SCR = [[0.098, 0.012], [0.395, 0.012], [0.527, 0.43], [0.222, 0.39]];
function heroAt(ctx, cx, cy, w, lt, o = {}) { return product(ctx, IMG.cut_hero, cx, cy, w, { lt, t0: 0, seed: 0.4, ...o }); }
function screenPath(ctx, r) { ctx.beginPath(); SCR.forEach(([u, v], i) => { const x = r.x0 + u * r.w, y = r.y0 + v * r.h; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); }
function label(ctx, text, x, y, px, col, { align = 'center', a = 1, unit = null } = {}) { // big label next to its part
  ctx.save(); ctx.globalAlpha *= a; font(ctx, px, 'head'); ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align; ctx.fillText(text, x, y); ctx.restore(); ctx.textAlign = 'left';
}
function bigWord(ctx, text, lt, t0, col = C.ink, y = 300) { return headline(ctx, text, lt, false, { t0, y, col }); }
// ---- new 2-D objects ----
function dialScale(ctx, cx, top, w, lt, t0, value, { kg = 1000 } = {}) { // platform + dial; needle settles just under the 1 kg mark
  const p = prog(lt, t0, t0 + DRAW), f = pop(lt, t0 + DRAW) || 1;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  stroked(ctx, () => { ctx.moveTo(cx - w / 2, top); ctx.lineTo(cx + w / 2, top); }, w, p, { lw: 12, col: C.ink });
  stroked(ctx, () => { ctx.moveTo(cx, top); ctx.lineTo(cx, top + 32); }, 32, p, { lw: 10, col: C.ink });
  const r = 74, dy = top + 32 + r + 6;
  ctx.translate(cx, dy); ctx.scale(f, f);
  stroked(ctx, () => ctx.arc(0, 0, r, Math.PI * 0.75, Math.PI * 2.25 - 1e-4), r * Math.PI * 1.5, p, { lw: 10, col: C.ink });
  if (lt > t0 + DRAW) {
    for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + i / 10 * Math.PI * 1.5, big = i === 10; ctx.strokeStyle = big ? C.ember : C.ink; ctx.lineWidth = big ? 7 : 4; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 8), Math.sin(a) * (r - 8)); ctx.lineTo(Math.cos(a) * (r - (big ? 30 : 20)), Math.sin(a) * (r - (big ? 30 : 20))); ctx.stroke(); }
    font(ctx, 26, 'bold'); ctx.fillStyle = C.ember; ctx.textAlign = 'center'; ctx.fillText('1 kg', Math.cos(Math.PI * 2.25) * (r + 34), Math.sin(Math.PI * 2.25) * (r + 34) + 6); ctx.textAlign = 'left';
    const target = value / kg, sw = spr(lt - t0 - DRAW, 9, 0.35), frac = clamp(target * Math.min(1.25, sw), 0, 1.2);
    const a = Math.PI * 0.75 + frac * Math.PI * 1.5; ctx.strokeStyle = C.wreck; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * (r - 24), Math.sin(a) * (r - 24)); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill();
  }
  ctx.restore();
  return dy + r;
}
function clockRing(ctx, cx, cy, r, lt, t0, hours, { col = C.mari } = {}) { // ring sweeps to N hours (of 30)
  const p = easeOut(prog(lt, t0, t0 + 0.5)), sweep = (hours / 30) * Math.PI * 2 * p;
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = '#D9D3CC'; ctx.lineWidth = 22; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.max(0.001, sweep)); ctx.stroke();
  ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
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
  ['USA', 'DEU', 'IND'].forEach((k, i) => { const d = spr(lt - tPins[i], 14, 0.5); if (d <= 0) return; const [x, y] = P(MAP.pins[k]);
    ctx.save(); ctx.translate(x, y - (1 - clamp(d)) * 120); ctx.scale(0.62, 0.62); ctx.beginPath(); ctx.arc(0, -120, 54, Math.PI * 0.85, Math.PI * 2.15); ctx.lineTo(0, 0); ctx.closePath(); ctx.fillStyle = C.wreck; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.stroke(); ctx.beginPath(); ctx.arc(0, -120, 20, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore(); });
  ctx.restore();
  return { h };
}
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
function slider(ctx, cx, y, w, lt, t0, from, to) { const p = easeInOut(prog(lt, t0, t0 + 0.5)), v = lerp(from, to, p);
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#D9D3CC'; ctx.lineWidth = 20; ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx + w / 2, y); ctx.stroke();
  ctx.strokeStyle = C.mari; ctx.beginPath(); ctx.moveTo(cx - w / 2, y); ctx.lineTo(cx - w / 2 + w * v, y); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx - w / 2 + w * v, y, 30, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke();
  sun(ctx, cx - w / 2 - 70, y, 16, lt + 9, 0, 0.4); sun(ctx, cx + w / 2 + 74, y, 22, lt + 9, 0, 1); ctx.restore(); }
function bars(ctx, cx, base, lt, t0, t1) { // to scale: 27.08 h vs 16.42 h (PSREF)
  const H = 520, v = [[27.08, '27 h', 'video', C.mari, t0], [16.42, '16.4 h', 'work test', C.wreck, t1]];
  v.forEach(([val, txt, sub, col, ts], i) => { const p = easeOut(prog(lt, ts, ts + 0.45)), h = H * val / 27.08 * p, x = cx - 200 + i * 240;
    ctx.save(); rr(ctx, x, base - h, 160, Math.max(1, h), 22); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.stroke();
    if (p > 0.95) { label(ctx, txt, x + 80, base - h - 24, 64, C.ink); font(ctx, 40, 'label'); ctx.fillStyle = C.stone; ctx.textAlign = 'center'; ctx.fillText(sub, x + 80, base + 52); ctx.textAlign = 'left'; } ctx.restore(); });
}
function calendar(ctx, cx, cy, lt, t0, mon, yr) { const p = easeInOut(prog(lt, t0, t0 + 0.4)); const draw = (m, y, sy) => { ctx.save(); ctx.translate(cx, cy); ctx.scale(1, Math.max(0.001, sy)); ctx.shadowColor = 'rgba(21,19,18,0.16)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, -140, -120, 280, 240, 30); ctx.fillStyle = '#fff'; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.save(); rr(ctx, -140, -120, 280, 240, 30); ctx.clip(); ctx.fillStyle = C.wreck; ctx.fillRect(-140, -120, 280, 64); ctx.restore(); ctx.strokeStyle = C.ink; ctx.lineWidth = 7; rr(ctx, -140, -120, 280, 240, 30); ctx.stroke(); font(ctx, 96, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m, 0, 36); font(ctx, 36, 'bold'); ctx.fillStyle = '#fff'; ctx.fillText(y, 0, -88); ctx.restore(); ctx.textAlign = 'left'; };
  if (p < 0.5) draw('NOV', '2026', 1 - p * 2); else draw(mon, yr, (p - 0.5) * 2); }

// ---- the 19 shots (cues.json) ----
const hookComp = (ctx, lt, title = true) => { // frame 1: laptop ≥ 60 % width + "990 g" readable at once + one accent (the dial)
  const r = heroAt(ctx, 540, 780, 760, lt + 9, { shadow: false });
  const bottom = dialScale(ctx, 540, r.y0 + r.h + 8, 720, lt + 9, 0, 990);
  if (title) { font(ctx, 200, 'head'); ctx.fillStyle = C.ember; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('990 g', 540, 440); ctx.textAlign = 'left'; }
};
scene({ line: 0, bg: 'cool', real: true, img: 'cut_hero', draw: (ctx, lt) => { hookComp(ctx, lt); },
  sfx: () => [[T('kilo') - 0.1, 'tick', 0.6]], counters: () => [] });
scene({ line: 1, xfade: true, bg: 'cool', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  heroAt(ctx, 540, 1015, 640, lt, { push: lt / 3 });
  ctx.save(); ctx.translate(380, 690); ctx.scale(0.75, 0.75); battery(ctx, 0, 0, lt, 7, T('twenty') - 0.2, false, { max: 7 }); ctx.restore();
  clockRing(ctx, 790, 690, 80, lt, T('twenty') - 0.1, 27);
  counter(ctx, 27, 0, lt, T('twenty') - 0.05, 540, 470, 230, C.ember, { comma: false, unit: 'HOURS', dark: false });
}, counters: () => [{ name: '27 hours', t: T('twenty') + 0.28, hold: CUR.dur }], sfx: () => { const a = T('twenty') - 0.2; return [...[0, 1, 2, 3, 4, 5, 6].map(i => [a + i * 0.11, 'blip', 0.3]), [T('twenty') + 0.28, 'tick', 0.8]]; } });
scene({ line: 2, bg: 'paper', real: true, img: 'cut_lid', draw: (ctx, lt, d) => {
  if (lt < T('going') - 0.1) { product(ctx, IMG.cut_lid, 540, 860, 640, { lt, t0: 0, seed: 1.1, push: lt / d }); bigWord(ctx, 'THINKBOOK 14X', lt, T('thinkbook') - 0.1); return; }
  const e = easeInOut(prog(lt, T('going') - 0.1, T('going') + 0.3));
  product(ctx, IMG.cut_lid, 540, lerp(860, 1102, e), lerp(640, 270, e), { lt, t0: 0, seed: 1.1 });
  worldMap(ctx, 540, 770, 900, lt, T('going') - 0.05, [T('global') - 0.05, T('global') + 0.07, T('global') + 0.19]);
  bigWord(ctx, 'GLOBAL', lt, T('global') - 0.1, C.ember, 290);
}, sfx: () => [[0, 'whoosh', 0.4], [T('global') - 0.05, 'pin', 0.5], [T('global') + 0.07, 'pin', 0.45], [T('global') + 0.19, 'pin', 0.45]] });
scene({ line: 3, bg: 'cool', real: true, img: 'cut_side_r', draw: (ctx, lt) => {
  const im = IMG.cut_side_r, w = 820, h = w * im.height / im.width;
  product(ctx, im, 540, 760, w, { lt, t0: 0, seed: 2.2, shadow: false });
  dialScale(ctx, 540, 760 + h / 2 + 6, 760, lt, 0.05, 990);
  counter(ctx, 990, 0, lt, T('nine') - 0.05, 540, 470, 230, C.ember, { comma: false, unit: 'g', dark: false });
}, counters: () => [{ name: '990 g (side)', t: T('nine') + 0.28, hold: CUR.dur }], sfx: () => [[0.05, 'pop', 0.3], [T('nine') + 0.28, 'tick', 0.8]] });
scene({ line: 3, from: 'under', xfade: true, bg: 'cool', real: true, img: 'cut_side_l', draw: (ctx, lt) => {
  const im = IMG.cut_side_l, w = 860, h = w * im.height / im.width, cy = 900;
  const r = product(ctx, im, 540, cy, w, { lt, t0: 0, seed: 0.8 });
  // calipers clamp the THICKNESS (vertical): jaws above and below the right end of the body
  const xr = r.x0 + r.w * 0.86, top = r.y0, bot = r.y0 + r.h, p = prog(lt, 0.05, 0.05 + DRAW), c = easeOut(prog(lt, 0.05 + DRAW, 0.05 + DRAW + 0.35)), gap = lerp(90, 0, c);
  stroked(ctx, () => { ctx.moveTo(xr + 120, top - 160); ctx.lineTo(xr + 120, bot + 160); }, 400, p, { lw: 12, col: C.ink });
  stroked(ctx, () => { ctx.moveTo(xr + 120, top - 130 - gap); ctx.lineTo(xr - 40, top - 130 - gap); ctx.lineTo(xr - 40, top - gap); }, 300, p, { lw: 12, col: C.ink });
  stroked(ctx, () => { ctx.moveTo(xr + 120, bot + 130 + gap); ctx.lineTo(xr - 40, bot + 130 + gap); ctx.lineTo(xr - 40, bot + gap); }, 300, p, { lw: 12, col: C.ink });
  if (c >= 1) { label(ctx, '15.6 mm', xr - 190, top - 190, 70, C.ember, { align: 'center' }); }
  bigWord(ctx, '< 16 mm', lt, T('sixteen') - 0.1, C.ink, 300);
}, sfx: () => [[0.05 + DRAW, 'click', 0.6], [0.05 + DRAW + 0.35, 'clamp', 0.7]] });
scene({ line: 4, bg: 'lav', real: true, img: 'cut_hero', draw: (ctx, lt, d) => {
  const r = heroAt(ctx, 540, 900, 760, lt, { push: lt / d });
  motionLines(ctx, r, lt, T('hundred') - 0.1);
  if (lt > T('hertz') - 0.2) { const e = spr(lt - T('hertz') + 0.2, 16); ctx.save(); ctx.globalAlpha = clamp(e * 1.4); const x = r.x0 + r.w * 0.47, y = r.y0 - 10; pill2(ctx, x - 20, y - 70, 300, 104, C.ink); label(ctx, '120 Hz', x + 130, y + 2, 64, C.mari); ctx.restore(); }
  bigWord(ctx, 'OLED', lt, T('oled') - 0.1, C.ink, 300);
}, sfx: () => [[T('hundred') - 0.1, 'swish', 0.5], [T('hertz') - 0.2, 'pop', 0.4]] });
scene({ line: 5, xfade: true, bg: 'lav', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  heroAt(ctx, 540, 1010, 640, lt, {});
  const t0 = T('eleven') - 0.15; sun(ctx, 540, 680, 44, lt, 0.05, lt < t0 ? 0.3 : 0.3 + 0.7 * easeOut(prog(lt, t0, t0 + 0.35)));
  if (lt < t0 - 0.04) headline(ctx, 'HDR', lt, false, { t0: T('hdr') - 0.12, y: 300 }); else counter(ctx, 1100, 0, lt, t0, 540, 470, 230, C.ember, { unit: 'NITS', dark: false });
}, counters: () => [{ name: '1,100 nits', t: T('eleven') - 0.15 + 0.33, hold: CUR.dur }], sfx: () => [[T('hdr') - 0.12, 'pop', 0.3], [T('eleven') - 0.15, 'rise', 0.5], [T('eleven') + 0.18, 'tick', 0.8]] });
scene({ line: 6, bg: 'paper', real: true, img: 'cut_side_l', draw: (ctx, lt) => {
  const im = IMG.cut_side_l, w = 820, r = product(ctx, im, 540, 1080, w, { lt, t0: 0, seed: 1.7 });
  // USB-C ports sit at ~10–19 % of the profile width, ~50 % height
  const px = 0.145 * im.width, py = 0.5 * im.height, sx = r.x0 + 0.145 * r.w, sy = r.y0 + 0.5 * r.h;
  const t0 = T('usb') - 0.1, cr = prog(lt, t0, t0 + DRAW);
  stroked(ctx, () => ctx.arc(sx, sy, 70, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * 70, cr, { lw: 9, col: C.ember });
  if (lt > t0 + DRAW) { const e = easeOut(prog(lt, t0 + DRAW, t0 + DRAW + 0.3)); ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(sx + 50 * 0.7, sy - 50 * 0.7); ctx.lineTo(lerp(sx + 35, 540 - 210, e), lerp(sy - 35, 720 + 200, e)); ctx.stroke(); ctx.restore(); }
  loupe(ctx, im, px, py, im.width * 0.12, 540, 720, 210, lt, t0 + DRAW + 0.15);
  if (lt > T('twenty') - 0.15) { for (let i = 0; i < 6; i++) { const ph = ((lt - T('twenty')) * 1.8 + i / 6) % 1; ctx.beginPath(); ctx.arc(lerp(760, 900, ph), 720 - 60 + i * 24, 9, 0, Math.PI * 2); ctx.fillStyle = C.mari; ctx.globalAlpha = 1 - ph; ctx.fill(); ctx.globalAlpha = 1; } label(ctx, '20 Gbps', 540, 1000, 92, C.ember, { a: easeOut(prog(lt, T('twenty') - 0.15, T('twenty') + 0.15)) }); }
}, sfx: () => [[T('usb') - 0.1, 'pop', 0.4], [T('usb') + 0.35, 'whoosh', 0.3], [T('twenty') - 0.15, 'zip', 0.6]] });
scene({ line: 7, bg: 'paper', real: true, img: 'cut_lid', draw: (ctx, lt) => {
  product(ctx, IMG.cut_lid, 360, 980, 400, { lt, t0: 0, seed: 2.6 });
  battery(ctx, 540, 640, lt, 7, T('sixty') - 0.2, false, { max: 7 });
  if (lt > T('sixty') - 0.1) label(ctx, '65 Wh', 760, 1010, 110, C.ember, { a: easeOut(prog(lt, T('sixty') + 0.1, T('sixty') + 0.4)) });
}, sfx: () => { const a = T('sixty') - 0.2; return [...[0, 1, 2, 3, 4, 5, 6].map(i => [a + i * 0.11, 'blip', 0.3]), [T('watt'), 'click', 0.5]]; } });
scene({ line: 7, from: 'lenovo', xfade: true, bg: 'paper', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  const r = heroAt(ctx, 460, 980, 700, lt, {});
  playIcon(ctx, r, lt, T('video') - 0.1);
  clockRing(ctx, 820, 680, 92, lt, T('twenty') - 0.1, 27);
  counter(ctx, 27, 0, lt, T('twenty') - 0.05, 820, 708, 92, C.ink, { comma: false, unit: 'h', dark: false });
  bigWord(ctx, 'VIDEO', lt, T('video') - 0.1, C.ember, 300);
}, counters: () => [{ name: '27 h video', t: T('twenty') + 0.28, hold: CUR.dur }], sfx: () => [[T('twenty') + 0.28, 'tick', 0.7], [T('video') - 0.1, 'pop', 0.4]] });
scene({ line: 8, bg: 'blush', real: true, img: 'cut_lid', draw: (ctx, lt) => {
  product(ctx, IMG.cut_lid, 540, 960, 520, { lt: lt + 5, t0: 0, alpha: 1 - 0.55 * clamp(lt / (2 * FR)) });
  stamp(ctx, 'THE CATCH', 540, 600, prog(lt, 0.1, 0.32), C.wreck, 112);
  if (lt >= 0.32 && lt < 0.32 + FR) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, W, H); }
}, shakeAt: 0.32, sfx: () => [[0.32, 'thud', 1.0]] });
scene({ line: 9, bg: 'blush', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  const r = heroAt(ctx, 540, 1000, 720, lt, {});
  const t0 = T('low') - 0.2; screenDim(ctx, r, 0.55 * easeInOut(prog(lt, t0, t0 + 0.5)));
  slider(ctx, 540, 660, 560, lt, t0, 0.9, 0.18);
  bigWord(ctx, 'LOW BRIGHTNESS', lt, T('low') - 0.1, C.ink, 300);
}, sfx: () => [[T('low') - 0.2, 'down', 0.5]] });
scene({ line: 10, bg: 'blush', real: true, img: 'cut_side_r', draw: (ctx, lt) => {
  product(ctx, IMG.cut_side_r, 540, 1170, 600, { lt, t0: 0, seed: 0.3 });
  bars(ctx, 540, 1100, lt, 0.1, T('sixteen') - 0.1);
}, counters: () => [], sfx: () => [[0.1, 'blip', 0.4], [T('sixteen') - 0.1, 'down', 0.6]] });
scene({ line: 11, xfade: true, bg: 'blush', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  const r = heroAt(ctx, 540, 1010, 640, lt, {});
  const tn = T('normally'), tDown = T('five') - 0.45, dimP = easeInOut(prog(lt, tDown, tDown + 0.35));
  screenDim(ctx, r, 0.45 * dimP); sun(ctx, 540, 650, 44, lt, 0.05, lt < tDown ? 1 : 1 - 0.75 * dimP);
  if (lt < tn) headline(ctx, 'HDR ONLY', lt, false, { t0: T('hdr') - 0.15, y: 300, col: C.ink });
  else counter(ctx, 500, 1100, lt, tDown, 540, 470, 230, C.ember, { unit: 'NITS', dark: false });
}, counters: () => [{ name: '500 nits', t: T('five') - 0.12, hold: CUR.dur }], sfx: () => [[T('hdr') - 0.15, 'pop', 0.3], [T('five') - 0.45, 'down', 0.6], [T('five') - 0.12, 'tick', 0.7]] });
scene({ line: 12, bg: 'paper', real: true, img: 'cut_lid', draw: (ctx, lt) => {
  product(ctx, IMG.cut_lid, 380, 980, 460, { lt, t0: 0, seed: 1.9 });
  priceTag(ctx, 300, 780, lt, T('nine') - 0.15, '$999', { dark: false });
  calendar(ctx, 790, 760, lt, T('january') - 0.4, 'JAN', '2027');
  if (lt > T('january') - 0.1) bigWord(ctx, 'US · JAN', lt, T('january') - 0.1, C.ink, 300); else bigWord(ctx, '$999', lt, T('nine') - 0.1, C.ember, 300);
}, sfx: () => [[T('nine') - 0.15, 'thud', 0.5], [T('nine'), 'swing', 0.5], [T('january') - 0.4, 'flip', 0.6], [T('january') - 0.2, 'flip', 0.5]] });
scene({ line: 13, bg: 'paper', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  heroAt(ctx, 540, 960, 720, lt, {});
  const ts = T('spec'), up = lt < ts ? 1 : clamp(1 - spr(lt - ts, 18, 0.45), -0.15, 1);
  wordmark(ctx, 540, 640, 108, up, false, 1);
  if (lt < T('lasts') - 0.1) headline(ctx, 'LIGHT', lt, false, { t0: T('light') - 0.1, y: 300 });
  else if (lt < ts) headline(ctx, 'ALL DAY', lt, false, { t0: T('lasts') - 0.1, y: 300 });
  else headline(ctx, 'SPEC', lt, false, { t0: ts - 0.02, col: C.ember, y: 300 });
}, sfx: () => [[T('light') - 0.1, 'pop', 0.3], [T('spec'), 'click', 1.0], [T('spec') + 0.04, 'stamp', 0.4]] });
scene({ line: 14, xfade: true, bg: 'paper', real: true, img: 'cut_side_l', draw: (ctx, lt) => {
  product(ctx, IMG.cut_side_l, 400, 1150, 560, { lt, t0: 0, seed: 2.9, alpha: lt > T('wait') - 0.15 ? 0.55 : 1 });
  hourglass(ctx, 820, 900, lt, 0.05, T('wait') - 0.15, false);
  if (lt < T('wait') - 0.15) headline(ctx, 'NEED IT NOW?', lt, false, { t0: T('need') - 0.15, y: 300 });
  else headline(ctx, 'WAIT', lt, false, { t0: T('wait') - 0.12, col: C.wreck, y: 300 });
}, sfx: () => [[0.05, 'pop', 0.3], [T('wait') - 0.15, 'flip', 0.7], [T('wait'), 'thud', 0.4]] });
scene({ line: 15, bg: 'cool', real: true, img: 'cut_hero', draw: (ctx, lt) => {
  if (lt < T('lasts') - 0.1) { hookComp(ctx, lt, false); headline(ctx, '< 1 KG', lt, false, { t0: T('under') - 0.1, y: 300, col: C.ember }); }
  else { hookComp(ctx, lt, false); headline(ctx, 'BIG DEAL', lt, false, { t0: T('big') - 0.1, y: 300 }); }
}, sfx: () => [[T('under') - 0.1, 'pop', 0.3], [T('big') - 0.1, 'shimmer', 0.4]] });
scene({ line: -1, bg: 'paper', real: false, img: null, endcard: true, draw: (ctx, lt, d) => {
  const tSnap = 0.7, up = lt < tSnap ? 1 : clamp(1 - spr(lt - tSnap, 18, 0.45), -0.15, 1);
  const e = spr(lt, 13, 0.7); ctx.save(); ctx.translate(540, 860); ctx.scale(lerp(0.94, 1, e), lerp(0.94, 1, e)); ctx.translate(-540, -860); wordmark(ctx, 540, 900, 108, up, false, 1); ctx.restore();
}, sfx: () => [[0.7, 'click', 1.0]] });
function pill2(ctx, x, y, w, h, fill) { ctx.save(); ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }

// ---------- timeline ----------
S.forEach((s, i) => {
  if (s.line >= 0) { const li = words.findIndex(w => w.line === s.line); s.w0 = s.from ? wIdx(s.from, li) : li; s.start = i === 0 ? 0 : words[s.w0].start - (s.from ? 0.12 : 0.15); }
  else { s.w0 = words.length - 1; s.start = words[words.length - 1].end + 0.3; }
});
S.forEach((s, i) => { s.end = i < S.length - 1 ? S[i + 1].start : DURATION; s.dur = s.end - s.start; s.i = i; });
const LOOP_BACK = 0.35;                                  // last 0.35 s: hard cut back to the frame-1 composition
const EV = []; S.forEach(s => { CUR = s; for (const [t, k, g] of (s.sfx ? s.sfx() : [])) EV.push({ t: +(s.start + t).toFixed(3), kind: k, gain: g }); });
S.forEach((s, i) => { if (i) EV.push({ t: +s.start.toFixed(3), kind: s.xfade ? 'move' : 'cut', gain: 0.3 }); });
EV.push({ t: +(DURATION - LOOP_BACK).toFixed(3), kind: 'cut', gain: 0.3 });
const COUNTERS = []; S.forEach(s => { CUR = s; for (const c of (s.counters ? s.counters() : [])) COUNTERS.push({ name: c.name, land: +(s.start + c.t).toFixed(2), hold: +((s.start + Math.min(c.hold, s.dur)) - (s.start + c.t)).toFixed(2) }); });

// ---------- compositor ----------
function bgColour(s, lt) { return s.bg === 'lav' ? LAV : s.bg === 'blush' ? BLUSH : s.bg === 'cool' ? COOL : C.paper; }
function isDark(s, lt) { const c = bgColour(s, lt); return c === C.ink || c === '#2A2826'; }
function drawScene(ctx, s, t) {
  CUR = s; const lt = t - s.start;
  ctx.fillStyle = bgColour(s, lt); ctx.fillRect(0, 0, W, H);   // flat solid background only (§12)
  ctx.save();
  if (s.shakeAt !== undefined && lt >= s.shakeAt && lt < s.shakeAt + 6 * FR) { const k = Math.round((lt - s.shakeAt) / FR); ctx.translate([3, -3, 2, -2, 1, -1][k] || 0, [-2, 3, -3, 2, -1, 1][k] || 0); }
  s.draw(ctx, lt, s.dur); ctx.restore();
}
function watermark(ctx, s, t) { if (s.endcard) return; const dark = isDark(s, t - s.start); const im = dark ? IMG.wm_dark : IMG.wm_light, h = 64, w = h * im.width / im.height; ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(im, 880 - w, 1330 - h, w, h); ctx.restore(); }
function frame(ctx, t) {
  if (t >= DURATION - LOOP_BACK) { drawScene(ctx, S[0], 0); watermark(ctx, S[0], 0); return; }   // loop: last frames = frame 1
  const i0 = S.findIndex(s => t >= s.start && t < s.end); const s = S[i0 < 0 ? S.length - 1 : i0], prev = S[s.i - 1], lt = t - s.start;
  if (prev && s.xfade && lt < 0.2) { // in-place crossfade (no slide)
    drawScene(ctx, prev, t); ctx.save(); ctx.globalAlpha = easeInOut(lt / 0.2); drawScene(ctx, s, t); ctx.restore();
  } else drawScene(ctx, s, t);
  watermark(ctx, s, t);
}

async function main() {
  await loadAssets();
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  fs.writeFileSync(path.join(work, 'timeline.json'), JSON.stringify(S.map(s => ({ i: s.i, line: s.line, start: +s.start.toFixed(2), end: +s.end.toFixed(2), bg: s.bg, real: s.real, img: s.img, xfade: !!s.xfade })), null, 1));
  fs.writeFileSync(path.join(work, 'counters.json'), JSON.stringify(COUNTERS, null, 1));
  const ver = S.find(s => s.line === 13); CUR = ver;
  fs.writeFileSync(path.join(work, 'events.json'), JSON.stringify({ catch: S.find(s => s.line === 8).start + 0.32, verdict: ver.start, spec: ver.start + T('spec'), end: DURATION }, null, 1));
  if (stillsArg) {
    const ts = stillsArg === 'cues' ? S.flatMap(s => [s.start + 0.02, s.start + s.dur * 0.5, s.end - 0.05]) : stillsArg.split(',').map(Number);
    fs.mkdirSync(path.join(work, 'stills'), { recursive: true });
    for (const t of ts) { frame(ctx, t); fs.writeFileSync(path.join(work, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`), cv.toBuffer('image/png')); }
    console.log('stills', ts.length); return;
  }
  fs.writeFileSync(path.join(work, 'sfx.json'), JSON.stringify(EV.sort((a, b) => a.t - b.t)));
  const N = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path.join(work, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) { frame(ctx, f / FPS); if (!ff.stdin.write(cv.data())) await new Promise(r => ff.stdin.once('drain', r)); if (f % 600 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(JSON.stringify({ frames: N, duration: DURATION, seconds: (Date.now() - t0) / 1000 }));
}
main().catch(e => { console.error(e); process.exit(1); });
