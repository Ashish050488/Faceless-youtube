// SoW Nº002 — OPPO Watch 5. PRODUCTION_SPEC §12–15: flat solid backgrounds, centred & big, hard cuts on beats,
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

// ======================= SCENES =======================
const S = [];
function scene(o) { S.push(o); }
const LAV = '#ECE8FB', BLUSH = '#FBE7E2';            // soft flat backgrounds instead of black
const COLS = ['#F2A65A', '#EFEDEA', '#B9AEE8', '#A8D8A2', '#2A2826'];             // orange, white, purple, green, black
const COLBG = ['#F6D2B0', '#EEEBE7', '#D9D3F4', '#D3EBCF', '#DCD8D4'];
const hook = (ctx, lt, d, title = true) => { // frame-1 composition: ≤ 3-word huge title, product ≥ 60 % width, one accent (sun)
  product(ctx, IMG.cut_3q, 540, title ? 1060 : 1095, 650, { lt: lt + 9, t0: 0, seed: 0.3 });
  if (title) { font(ctx, 186, 'head'); const ww = ctx.measureText('WATCH').width; sun(ctx, 540 + ww / 2 + 104, 512, 26, lt + 9, 0, 1); } else sun(ctx, 540, 618, 30, lt + 9, 0, 1);
  if (title) { font(ctx, 186, 'head'); ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = C.ink; ctx.fillText('NEW OPPO', 540, 270); ctx.fillStyle = C.ember; ctx.fillText('WATCH', 540, 440); ctx.textAlign = 'left'; }
};
const nits = (ctx, lt, t0) => { counter(ctx, 3000, 0, lt, t0, 540, 470, 230, C.ember, { unit: 'NITS', dark: false }); };
scene({ line: 0, bg: 'lav', real: true, img: 'cut_3q', draw: (ctx, lt, d) => {
  const b = T('three');
  hook(ctx, lt, d, lt < b - 0.06); if (lt >= b - 0.06) nits(ctx, lt, b - 0.04); if (lt > b) { const g = easeOut(prog(lt, b, b + 0.35)) * (1 - prog(lt, b + 0.6, b + 1.4)); ctx.save(); ctx.globalAlpha = 0.55 * g; ctx.filter = 'blur(40px)'; ctx.fillStyle = C.mari; ctx.beginPath(); ctx.arc(540, 618, 130, 0, 7); ctx.fill(); ctx.restore(); }
}, sfx: () => [[T('three') - 0.04, 'rise', 0.5], [T('three') + 0.29, 'tick', 0.8], [T('nits'), 'shimmer', 0.4]], counters: () => [{ name: '3,000 nits', t: T('three') + 0.29, hold: CUR.dur }] });
scene({ line: 1, xfade: true, bg: 'lav', real: true, img: 'cut_colours', draw: (ctx, lt, d) => {
  const r = product(ctx, IMG.cut_colours, 540, 1100, 720, { lt, t0: 0, dark: true, seed: 0.7 });
  priceTag(ctx, 540, 700, lt, T('hundred') - 0.2, '$135', { dark: true });
  headline(ctx, 'ABOUT $135', lt, true, { t0: T('about') - 0.1, acc: ['$135'] });
}, sfx: () => [[T('hundred') - 0.2, 'thud', 0.6], [T('hundred'), 'swing', 0.5]], counters: () => [] });
scene({ line: 2, bg: 'paper', real: true, img: 'cut_3q', draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 540, 1040, 680, { lt, t0: 0, seed: 1.2, push: lt / d });
  headline(ctx, 'WATCH 5', lt, false, { t0: T('watch') - 0.1, acc: ['5'] });
}, sfx: () => [[0, 'whoosh', 0.4], [T('watch') - 0.1, 'shimmer', 0.4]] });
scene({ line: 3, xfade: true, bg: 'paper', real: true, img: 'cut_fatmax', draw: (ctx, lt, d) => { // zoom into the display + diagonal measure + callout ring
  const z = easeInOut(prog(lt, T('one') - 0.3, T('one') + 0.3));
  const r = product(ctx, IMG.cut_fatmax, 540, 1040, lerp(520, 600, z), { lt, t0: 0, seed: 0.9, push: lt / d });
  const p = prog(lt, T('one'), T('one') + DRAW), ax = r.x0 + r.w * 0.17, ay = r.y0 + r.h * 0.78, bx = r.x0 + r.w * 0.83, by = r.y0 + r.h * 0.22;
  stroked(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }, 900, p, { lw: 12, col: C.ink }); stroked(ctx, () => { ctx.moveTo(ax, ay); ctx.lineTo(bx, by); }, 900, p, { lw: 6, col: C.mari });
  for (const [x, y] of [[ax, ay], [bx, by]]) { const f = pop(lt, T('one') + DRAW); if (f) { ctx.beginPath(); ctx.arc(x, y, 18 * f, 0, 7); ctx.fillStyle = C.mari; ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.stroke(); } }
  const rp = prog(lt, T('amoled') - 0.1, T('amoled') + DRAW); stroked(ctx, () => ctx.arc(540, 1040, 300, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * 300, rp, { lw: 8, col: C.ember });
  if (lt > T('one') - 0.1) { if (lt < T('amoled') - 0.1) counter(ctx, 1.85, 0, lt, T('one'), 540, 470, 230, C.ember, { comma: false, unit: '"', dark: false, dec: 2 }); else headline(ctx, 'AMOLED', lt, false, { t0: T('amoled') - 0.1, y: 300 }); }
}, counters: () => [{ name: '1.85"', t: T('one') + 0.33, hold: T('amoled') - 0.1 }], sfx: () => [[T('one') - 0.3, 'whoosh', 0.3], [T('one'), 'pop', 0.5], [T('one') + 0.33, 'tick', 0.8], [T('amoled') - 0.1, 'swish', 0.4]] });
scene({ line: 3, from: 'nine', bg: 'paper', real: true, img: 'cut_side', xfade: true, draw: (ctx, lt, d) => {
  const r = product(ctx, IMG.cut_side, 540, 1040, 720, { lt, t0: 0, seed: 2 });
  calipers(ctx, 330, 750, r.y0 + r.h * 0.42, lt, 0.05, false);
  counter(ctx, 9.2, 0, lt, T('nine'), 540, 470, 230, C.ember, { comma: false, unit: 'mm', dark: false, dec: 1 });
}, counters: () => [{ name: '9.2 mm', t: T('nine') + 0.33, hold: CUR.dur }], sfx: () => [[0.05, 'click', 0.6], [0.05 + DRAW + 0.35, 'clamp', 0.8], [T('nine') + 0.33, 'tick', 0.8]] });
scene({ line: 4, xfade: true, bg: 'paper', real: true, img: 'cut_side2', draw: (ctx, lt, d) => {
  const tL = T('twenty'), tilt = scale(ctx, 540, 1020, lt, 0.05, tL + 0.33, false);
  ctx.save(); ctx.translate(540 - 264 * Math.cos(tilt), 1020 - 32 - 264 * Math.sin(tilt) + 48); product(ctx, IMG.cut_side2, 0, 0, 340, { lt, t0: 0.1, seed: 3, shadow: false }); ctx.restore();
  counter(ctx, 25, 0, lt, tL, 540, 470, 240, C.ember, { unit: 'g', dark: false });
}, counters: () => [{ name: '25 g', t: T('twenty') + 0.33, hold: CUR.dur }], sfx: () => [[0.05, 'pop', 0.4], [T('twenty') + 0.33, 'tick', 0.8], [T('twenty') + 0.4, 'clunk', 0.6]] });
scene({ line: 5, bg: 'paper', real: true, img: 'cut_3q', xfade: true, draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 540, 1030, 560, { lt, t0: 0, seed: 1.5 });
  waterDrop(ctx, 470, 900, lt, T('ip') - 0.4, false);
  if (lt > T('swimming') - 0.3) waves(ctx, 540, 1390, lt, T('swimming') - 0.2, false);
  if (lt < T('swimming') - 0.2) headline(ctx, 'IP69', lt, false, { t0: T('ip') - 0.1, acc: ['IP69'] }); else headline(ctx, 'SWIM', lt, false, { t0: T('swimming') - 0.2 });
  if (lt > T('atm') - 0.15 && lt < T('swimming') - 0.2) { const e = spr(lt - T('atm') + 0.15, 16); ctx.save(); ctx.globalAlpha = clamp(e * 1.4); font(ctx, 96, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText('5 ATM', 540, 610 + (1 - e) * 20); ctx.restore(); ctx.textAlign = 'left'; }
}, sfx: () => [[T('ip') - 0.05, 'drip', 0.7], [T('ip') + 0.1, 'splash', 0.5], [T('atm') - 0.15, 'pop', 0.4], [T('swimming') - 0.2, 'swish', 0.4]] });
scene({ line: 6, bg: 'paper', real: true, img: 'cut_fatmax', draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_fatmax, 540, 1010, 560, { lt, t0: 0, seed: 0.4, push: lt / d });
  pulseFlame(ctx, 540, 640, lt, T('fatmax') - 0.4, T('fatmax') + 0.1, false);
  if (lt > T('fatmax') + 0.3) headline(ctx, 'FATMAX', lt, false, { t0: T('fatmax') + 0.3, y: 290 });
}, sfx: () => [[T('fatmax') - 0.4, 'beep', 0.4], [T('fatmax') + 0.1, 'whoosh', 0.4], [T('fatmax') + 0.45, 'pop', 0.5]] });
scene({ line: 7, bg: 'paper', real: true, img: 'cut_3q', xfade: true, draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 540, 1110, 520, { lt, t0: 0, seed: 2.2, push: lt / d });
  zoneBar(ctx, 540, 676, lt, T('zone') - 0.2, false);
  if (lt < T('estimates') - 0.1) headline(ctx, 'FAT ZONE', lt, false, { t0: T('heart') - 0.1, acc: ['FAT'] }); else headline(ctx, 'GRAMS BURNED', lt, false, { t0: T('estimates') - 0.1, acc: ['GRAMS'] });
  if (lt > T('grams') - 0.1) { const e = spr(lt - T('grams') + 0.1, 16), f = pop(lt, T('grams')); ctx.save(); ctx.translate(540, 1460); ctx.scale(f || 1, f || 1); ctx.globalAlpha = clamp(e * 1.5); pill2(ctx, -150, -60, 300, 120, C.ink); font(ctx, 80, 'head'); ctx.fillStyle = C.mari; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('g ↓', 0, 4); ctx.restore(); ctx.textAlign = 'left'; }
}, sfx: () => [[T('zone') - 0.2, 'pop', 0.3], [T('zone') + 0.4, 'blip', 0.5], [T('most') , 'pulse', 0.5], [T('grams') - 0.1, 'pop', 0.4]] });
function colourK(lt, d) { const s = S.find(x => x.bg === 'colour'); const save = CUR; CUR = s; const t0 = T('five') + 0.5; CUR = save; if (lt < t0) return -1; return Math.min(4, Math.floor((lt - t0) / Math.max(0.3, (d - t0 - 0.2) / 5))); }
function pill2(ctx, x, y, w, h, fill) { ctx.save(); ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.restore(); }
scene({ line: 8, bg: 'colour', real: true, img: 'cut_colours', draw: (ctx, lt, d) => {
  const t0 = T('five') - 0.1, ts = [0, 1, 2, 3, 4].map(i => t0 + i * 0.12);
  product(ctx, IMG.cut_colours, 540, 1080, 720, { lt, t0: 0, seed: 0.2 });
  const k = colourK(lt, d); colourDots(ctx, 540, 520, lt, ts, k, COLS);
}, bgAt: (lt) => { const s = S.find(x => x.bg === 'colour'); const k = colourK(lt, s.dur); return k < 0 ? C.paper : COLBG[k]; },
  sfx: () => { const t0 = T('five') - 0.1; return [0, 1, 2, 3, 4].map(i => [t0 + i * 0.12, 'pop', 0.4]); } });
scene({ line: 9, bg: 'paper', real: true, img: 'cut_colours', draw: (ctx, lt, d) => { // ¥899 for four; purple steps forward ¥999
  const tp = T('purple') - 0.1, f = easeInOut(prog(lt, tp, tp + 0.4));
  product(ctx, IMG.cut_colours, 540, 1120, 720, { lt, t0: 0, seed: 0.9, dim: 0.35 * f });
  if (f > 0) product(ctx, IMG.cut_3q, 540, lerp(1160, 720, f), lerp(300, 470, f), { lt, t0: tp, shadow: true, seed: 1, alpha: f });
  if (lt < tp) counter(ctx, 899, 0, lt, T('eight') - 0.05, 540, 520, 250, C.ember, { prefix: '¥', comma: false, dark: false });
  else counter(ctx, 999, 899, lt, T('nine', 1) - 0.1, 540, 520, 250, C.ember, { prefix: '¥', comma: false, dark: false });
}, counters: () => [{ name: '¥899', t: T('eight') - 0.05 + 0.33, hold: T('purple') - 0.1 }, { name: '¥999', t: T('nine', 1) - 0.1 + 0.33, hold: CUR.dur }],
  sfx: () => [[T('eight') + 0.28, 'tick', 0.8], [T('purple') - 0.1, 'whoosh', 0.4], [T('nine', 1) + 0.23, 'tick', 0.8]] });
scene({ line: 10, xfade: true, bg: 'paper', real: true, img: 'cut_3q', draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 540, 1215, 360, { lt, t0: 0, seed: 2.4 });
  const tUp = T('ten') - 0.04; const max = lt < tUp ? 7 : 10;
  battery(ctx, 540, 760, lt, max, lt < tUp ? T('about') - 0.05 : -9, false, { max });
  if (lt < tUp) counter(ctx, 7, 0, lt, T('about') - 0.05, 540, 520, 230, C.ember, { comma: false, unit: 'DAYS', dark: false });
  else counter(ctx, 10, 7, lt, T('ten'), 540, 520, 230, C.ember, { comma: false, unit: 'DAYS', dark: false });
}, counters: () => [{ name: '7 days', t: T('about') - 0.05 + 0.33, hold: T('ten') - 0.04 }, { name: '10 days', t: T('ten') + 0.33, hold: CUR.dur }],
  sfx: () => { const a = T('about') - 0.05; return [...[0, 1, 2, 3, 4, 5, 6].map(i => [a + i * 0.11, 'blip', 0.3]), [a + 0.33, 'tick', 0.7], [T('ten') + 0.33, 'tick', 0.7], [T('ten') - 0.04, 'blip', 0.4]]; } });
scene({ line: 11, bg: 'blush', real: true, img: 'cut_colours', hard: true, draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_colours, 540, 1180, 720, { lt: lt + 5, t0: 0, alpha: 1 - 0.6 * clamp(lt / (2 * FR)) });
  stamp(ctx, 'THE CATCH', 540, 600, prog(lt, 0.1, 0.32), C.wreck, 112);
  if (lt >= 0.32 && lt < 0.32 + FR) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, W, H); }
  const tf = T('few'); for (let i = 0; i < 3; i++) { const e = spr(lt - tf - i * 0.08, 16); if (e > 0) { ctx.beginPath(); ctx.arc(420 + i * 120, 820, 26 * clamp(e, 0, 1.1), 0, 7); ctx.fillStyle = C.wreck; ctx.fill(); } }
}, shakeAt: 0.32, sfx: () => [[0.32, 'thud', 1.0], [T('few'), 'pop', 0.4], [T('few') + 0.08, 'pop', 0.35], [T('few') + 0.16, 'pop', 0.35]] });
scene({ line: 12, bg: 'blush', real: true, img: 'cut_fatmax', draw: (ctx, lt, d) => {
  const tn = T('normally'), tDown = T('six') - 0.38, dimP = easeInOut(prog(lt, tDown, tDown + 0.35));
  product(ctx, IMG.cut_fatmax, 540, 1180, 470, { lt, t0: 0, dim: 0.45 * dimP, seed: 1.4 });
  const grow = lt < tDown ? 1 : 1 - 0.8 * dimP; sun(ctx, 540, 800, 50, lt, 0.05, grow);
  if (lt < T('outdoor') - 0.15) headline(ctx, '3,000?', lt, false, { t0: 0.1, col: C.ember });
  else if (lt < tn) headline(ctx, 'OUTDOORS ONLY', lt, true, { t0: T('outdoor') - 0.15, acc: ['OUTDOORS'], y: 300 });
  else counter(ctx, 600, 3000, lt, tDown, 540, 520, 230, C.ember, { unit: 'NITS', dark: false });
}, counters: () => [{ name: '600 nits', t: T('six') - 0.38 + 0.33, hold: CUR.dur }], sfx: () => [[0.05, 'pop', 0.3], [T('outdoor') - 0.15, 'whoosh', 0.3], [T('six') - 0.38, 'down', 0.6], [T('six') - 0.05, 'tick', 0.7]] });
scene({ line: 13, xfade: true, bg: 'blush', real: true, img: 'cut_3q', xfade: true, draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 540, 1255, 320, { lt, t0: 0, dark: true, seed: 1.1 });
  const tf = T('always') - 0.05; toggle(ctx, 540, 630, lt, tf, true);
  battery(ctx, 540, 850, lt, 7, -9, true, { max: 7, drainTo: 3, tDrain: T('three') - 0.3 });
  if (lt < T('three') - 0.35) headline(ctx, 'ALWAYS-ON', lt, false, { t0: T('always') - 0.1, y: 300 });
  if (lt > T('three') - 0.35) counter(ctx, 3, 7, lt, T('three') - 0.3, 540, 470, 220, C.wreck, { comma: false, unit: 'DAYS', dark: true });
}, counters: () => [{ name: '3 days', t: T('three') - 0.3 + 0.33, hold: CUR.dur }], sfx: () => [[T('always') - 0.05, 'switch', 0.7], [T('three') - 0.3, 'drain', 0.5], [T('three') + 0.03, 'tick', 0.7]] });
scene({ line: 14, bg: 'blush', real: true, img: 'cut_side', draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_side, 540, 1250, 720, { lt, t0: 0, dark: true, seed: 0.5 });
  ecg(ctx, 540, 800, lt, 0.05, true);
  headline(ctx, 'ECG', lt, false, { t0: T('ecg') - 0.15, y: 320, strike: T('ecg') + 0.25, col: C.ink });
}, sfx: () => [[0.05, 'beep', 0.4], [T('ecg') + 0.25, 'scratch', 0.8]] });
scene({ line: 15, xfade: true, bg: 'blush', real: true, img: 'cut_side2', draw: (ctx, lt, d) => {
  globe(ctx, 540, 700, 300, lt, 0.05, T('china') - 0.1, true);
  product(ctx, IMG.cut_side2, 540, 1250, 640, { lt, t0: 0, dark: true, seed: 1.8 });
}, sfx: () => [[0.05, 'whoosh', 0.3], [T('china') - 0.1, 'pin', 0.7]] });
scene({ line: 16, bg: 'paper', real: true, img: 'cut_colours', draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_colours, 540, 1180, 720, { lt, t0: 0, seed: 0.6 });
  const ts = T('spec'), up = lt < ts ? 1 : clamp(1 - spr(lt - ts, 18, 0.45), -0.15, 1);
  wordmark(ctx, 540, 820, 112, up, false, clamp(spr(lt - 0.1, 14) * 1.4));
  if (lt < T('buy') - 0.1) headline(ctx, 'THIN · TOUGH', lt, false, { t0: T('thin') - 0.1 }); else if (lt < ts) headline(ctx, 'IN CHINA', lt, false, { t0: T('buy') - 0.1 });
  else headline(ctx, 'SPEC', lt, false, { t0: ts - 0.02, col: C.ember });
}, sfx: () => [[T('thin') - 0.1, 'pop', 0.3], [T('spec'), 'click', 1.0], [T('spec') + 0.04, 'stamp', 0.4]] });
scene({ line: 17, bg: 'paper', real: true, img: 'cut_side2', xfade: true, draw: (ctx, lt, d) => {
  product(ctx, IMG.cut_side2, 330, 1180, 420, { lt, t0: 0, seed: 2.9 });
  hourglass(ctx, 780, 1150, lt, 0.05, T('wait') - 0.15, false);
  if (lt < T('wait') - 0.15) headline(ctx, 'NEED ECG?', lt, false, { t0: T('ecg') - 0.15, acc: ['ECG?'] });
  else headline(ctx, 'WAIT', lt, false, { t0: T('wait') - 0.12, col: C.wreck });
}, sfx: () => [[0.05, 'pop', 0.3], [T('ecg') - 0.15, 'pop', 0.3], [T('wait') - 0.15, 'flip', 0.7], [T('wait'), 'thud', 0.4]] });
scene({ line: 18, bg: 'lav', real: true, img: 'cut_3q', draw: (ctx, lt, d) => {
  if (lt < T('hundred') - 0.15) { hook(ctx, lt, d, false); nits(ctx, lt, T('three') - 0.04); return; }
  product(ctx, IMG.cut_3q, 540, 1095, 650, { lt: lt + 9, t0: 0, seed: 0.3 });
  if (lt < T('pretty') - 0.15) priceTag(ctx, 540, 700, lt, T('hundred') - 0.15, '$135', { dark: true }), headline(ctx, 'ONLY $135', lt, true, { t0: T('hundred') - 0.15, acc: ['$135'] });
  else headline(ctx, 'PRETTY WILD', lt, true, { t0: T('pretty') - 0.15, acc: ['WILD'] });
}, sfx: () => [[0, 'rise', 0.3], [T('wild'), 'shimmer', 0.4]] });
scene({ line: -1, bg: 'paper', real: false, img: null, endcard: true, draw: (ctx, lt, d) => {
  const tSnap = 0.7, up = lt < tSnap ? 1 : clamp(1 - spr(lt - tSnap, 18, 0.45), -0.15, 1);
  const e = spr(lt, 13, 0.7); ctx.save(); ctx.translate(540, 860); ctx.scale(lerp(0.94, 1, e), lerp(0.94, 1, e)); ctx.translate(-540, -860); wordmark(ctx, 540, 900, 108, up, false, 1); ctx.restore();
}, sfx: () => [[0.7, 'click', 1.0]] });

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
function bgColour(s, lt) { if (s.bg === 'colour') return s.bgAt(lt); return s.bg === 'lav' ? LAV : s.bg === 'blush' ? BLUSH : C.paper; }
function isDark(s, lt) { const c = bgColour(s, lt); return c === C.ink || c === '#2A2826'; }
function drawScene(ctx, s, t) {
  CUR = s; const lt = t - s.start;
  ctx.fillStyle = bgColour(s, lt); ctx.fillRect(0, 0, W, H);   // flat solid background only (§12)
  ctx.save();
  if (s.shakeAt !== undefined && lt >= s.shakeAt && lt < s.shakeAt + 6 * FR) { const k = Math.round((lt - s.shakeAt) / FR); ctx.translate([3, -3, 2, -2, 1, -1][k] || 0, [-2, 3, -3, 2, -1, 1][k] || 0); }
  s.draw(ctx, lt, s.dur); ctx.restore();
}
function watermark(ctx, s, t) { if (s.endcard) return; const dark = isDark(s, t - s.start); const im = dark ? IMG.wm_dark : IMG.wm_light, h = 64, w = h * im.width / im.height; ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(im, 880 - w, 1220 - h, w, h); ctx.restore(); }
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
  const ver = S.find(s => s.line === 16); CUR = ver;
  fs.writeFileSync(path.join(work, 'events.json'), JSON.stringify({ catch: S.find(s => s.line === 11).start + 0.32, verdict: ver.start, spec: ver.start + T('spec'), end: DURATION }, null, 1));
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
