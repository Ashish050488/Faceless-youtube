// SoW Nº001 — Retro Song Bird (remake, script v3.1). Real product images + peak-detail motion system.
//   node render/sow001_v2.js <work_dir> [--stills cues|t1,t2] [--fps 30]
// work_dir needs: words.json (meta/align_words.py), assets/*.png|jpg, wm_light.png, wm_dark.png
// Writes: frames.mp4 (video only), sfx.json, timeline.json, events.json (catch/verdict times for the music bed)
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

const words = JSON.parse(fs.readFileSync(path.join(work, 'words.json')));
const VOICE_LEN = 96.0;                       // narrate.py output incl. 2.5 s tail (checked at mux)
const DURATION = VOICE_LEN;
const FR = 1 / FPS;

// ---------- motion primitives (brand.md Micro-detail standard) ----------
// critically-damped-ish spring, damping ratio from "damping 14–18, mass 0.8" ≈ ζ 0.62–0.75
const spr = (t, k = 14, z = 0.68) => t <= 0 ? 0 : 1 - Math.exp(-z * k * t) * (Math.cos(k * Math.sqrt(1 - z * z) * t) + z / Math.sqrt(1 - z * z) * Math.sin(k * Math.sqrt(1 - z * z) * t));
const easeIn = t => { t = clamp(t); return t * t * t; };
const EXIT = 0.21;                            // exits 180–240 ms
const STAG = 0.075;                           // stagger 60–90 ms
// enter/alive/exit envelope for one element: returns {a: alpha 0..1, y: offset px, s: scale}
function life(lt, t0, t1 = 1e9, { dy = 24, k = 14 } = {}) {
  const p = spr(lt - t0, k);
  const x = easeIn(prog(lt, t1 - EXIT, t1));
  return { a: clamp(p * 1.25) * (1 - x), y: (1 - p) * dy - x * 14, s: 1, p, x };
}
// word lookup (global time of first word matching after index i)
const nw = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function wAt(token, from = 0) { for (let i = from; i < words.length; i++) if (nw(words[i].w).startsWith(nw(token))) return i; throw new Error('word ' + token); }
function lineStart(li) { return words.find(w => w.line === li).start; }
function lineEnd(li) { const ws = words.filter(w => w.line === li); return ws[ws.length - 1].end; }

// ---------- scene table (anchored to script lines; times from word timestamps) ----------
// img: depth-layer source; real: real product image visible in this scene (for QA %)
const S = [];
function scene(line, bg, img, real, draw, opts = {}) { S.push({ line, bg, img, real, draw, ...opts }); }

// ---------- assets ----------
const IMG = {}, BLUR = {}, SHADOW = createCanvas(400, 80);
{ const x = SHADOW.getContext('2d'); x.filter = 'blur(14px)'; x.fillStyle = 'rgba(21,19,18,0.55)'; x.beginPath(); x.ellipse(200, 40, 160, 16, 0, 0, 7); x.fill(); }
let GRAIN = [];
async function loadAssets() {
  const d = path.join(work, 'assets');
  for (const f of fs.readdirSync(d)) if (/\.(png|jpg)$/.test(f)) IMG[f.replace(/\.\w+$/, '')] = await L.loadImage(path.join(d, f));
  IMG.wm_light = await L.loadImage(path.join(work, 'wm_light.png'));
  IMG.wm_dark = await L.loadImage(path.join(work, 'wm_dark.png'));
  for (const [k, im] of Object.entries(IMG)) { // pre-blurred depth copies
    if (k.startsWith('wm')) continue;
    const w = 240, h = Math.round(w * im.height / im.width), c = createCanvas(w + 80, h + 80), x = c.getContext('2d');
    x.filter = 'blur(10px)'; x.drawImage(im, 40, 40, w, h); BLUR[k] = c;
  }
  for (let g = 0; g < 4; g++) { // film grain tiles (2–3 %)
    const c = createCanvas(540, 960), x = c.getContext('2d'), id = x.createImageData(540, 960), d = id.data;
    let s = 1234 + g * 777; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < d.length; i += 4) { const v = rnd() > 0.5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.floor(rnd() * 16); }
    x.putImageData(id, 0, 0); GRAIN.push(c);
  }
}

// ---------- drawing helpers ----------
function pill(ctx, x, y, w, h, fill, { press = 1, shadow = true, hl = true } = {}) {
  ctx.save();
  const cx = x + w / 2, cy = y + h / 2; ctx.translate(cx, cy); ctx.scale(press, press); ctx.translate(-cx, -cy);
  if (shadow) { ctx.shadowColor = 'rgba(21,19,18,0.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; }
  rr(ctx, x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); ctx.shadowColor = 'transparent';
  if (hl) { ctx.save(); rr(ctx, x + 1, y + 1, w - 2, h - 2, h / 2 - 1); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1; rr(ctx, x + 1.5, y + 1.5, w - 3, h - 3, h / 2 - 1.5); ctx.stroke(); ctx.restore(); }
  ctx.restore();
}
const pressIn = (lt, t0) => lt < t0 ? 0.94 : 1 - 0.06 * Math.exp(-(lt - t0) * 14) * Math.cos((lt - t0) * 20);

// Product cut-out / photo: tilt drift ±7°, contact shadow that follows the tilt, one light sweep, 1→1.02 push
const sweepCache = createCanvas(1200, 1200);
function product(ctx, im, cx, cy, w, { lt = 0, seed = 0, sweepAt = 0.15, push = 0, shadow = true, cut = true, radius = 32, alpha = 1, crop = null } = {}) {
  const sx = crop ? crop[0] : 0, sy = crop ? crop[1] : 0, sw = crop ? crop[2] : im.width, sh = crop ? crop[3] : im.height;
  const h = w * sh / sw;
  const th = (7 * Math.PI / 180) * Math.sin(lt * 0.55 + seed);               // drifting tilt
  const s = (1 + 0.02 * clamp(push)) * (1 + 0.004 * Math.sin(lt * 1.3 + seed)); // push-in + breathe
  const fy = Math.sin(lt * 1.1 + seed * 2) * 2;                                  // 2 px float
  ctx.save(); ctx.globalAlpha = alpha;
  if (shadow) { // contact shadow scales/offsets with tilt
    const sw2 = w * 0.86 * (1 - Math.abs(th) * 0.9);
    ctx.globalAlpha = alpha * 0.9;
    ctx.drawImage(SHADOW, cx - sw2 / 2 + th * 60, cy + h / 2 * s - 18 + fy * 0.3, sw2, 46);
    ctx.globalAlpha = alpha;
  }
  ctx.translate(cx, cy + fy); ctx.scale(s * Math.cos(th), s); ctx.transform(1, Math.sin(th) * 0.22, 0, 1, 0, 0);
  if (!cut) { ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, radius); ctx.clip(); }
  ctx.drawImage(im, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  const sp = prog(lt, sweepAt, sweepAt + 0.9);
  if (sp > 0 && sp < 1) { // light sweep clipped to the product's own alpha
    const ow = Math.min(1200, Math.ceil(w)), oh = Math.min(1200, Math.ceil(h)), x = sweepCache.getContext('2d');
    x.clearRect(0, 0, ow, oh); x.globalCompositeOperation = 'source-over'; x.drawImage(im, sx, sy, sw, sh, 0, 0, ow, oh);
    x.globalCompositeOperation = 'source-in'; const gx = lerp(-ow * 0.4, ow * 1.4, easeInOut(sp));
    const g = x.createLinearGradient(gx - 140, 0, gx + 140, oh * 0.3); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,240,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, ow, oh); x.globalCompositeOperation = 'source-over';
    ctx.drawImage(sweepCache, 0, 0, ow, oh, -w / 2, -h / 2, w, h);
  }
  if (!cut) ctx.restore();
  ctx.restore();
  return h * s;
}

// headline: per word y+24→0, blur 6→0, fade, stagger; ember accents on paper / marigold on ink
function headline(ctx, text, lt, dark, { t0 = 0.08, t1 = 1e9, acc = [], y = 290, px = 112 } = {}) {
  if (!text) return [];
  const maxW = 820, ws = text.split(' ');
  let rows, size = px;
  for (; size >= 76; size -= 4) {
    font(ctx, size, 'head'); rows = []; let cur = [];
    for (const w of ws) { const t = [...cur, w].join(' '); if (ctx.measureText(t).width > maxW && cur.length) { rows.push(cur); cur = [w]; } else cur.push(w); }
    rows.push(cur);
    // no orphans: avoid a single short word alone on the last row
    if (rows.length > 1 && rows[rows.length - 1].length === 1 && rows[rows.length - 2].length > 1) { const mv = rows[rows.length - 2].pop(); rows[rows.length - 1].unshift(mv); }
    if (rows.length <= 2 && rows.every(r => ctx.measureText(r.join(' ')).width <= maxW)) break;
  }
  font(ctx, size, 'head');
  const boxes = []; let k = 0; const lh = size * 1.0;
  rows.forEach((r, ri) => {
    let x = 60;
    r.forEach(wd => {
      const e = life(lt, t0 + k * STAG, t1);
      const blur = 6 * (1 - clamp(e.p));
      ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.2 + k) * 0.8);
      if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
      const isAcc = acc.some(a => wd.replace(/[^\w$~×≠→.]/g, '').toUpperCase() === a.toUpperCase());
      ctx.fillStyle = isAcc ? (dark ? C.mari : C.ember) : (dark ? C.paper : C.ink);
      ctx.textBaseline = 'top'; ctx.fillText(wd, x, y + ri * lh);
      ctx.restore();
      const ww = ctx.measureText(wd).width;
      boxes.push({ wd, x, y: y + ri * lh, w: ww, h: size });
      x += ctx.measureText(wd + ' ').width; k++;
    });
  });
  return boxes;
}
// underline that draws left→right under a headline word when it is spoken (±2 frames)
function underline(ctx, boxes, word, tSpoken, lt, dark, t1 = 1e9) {
  const b = boxes.find(b => b.wd.replace(/[^\w$~×≠→]/g, '').toUpperCase().startsWith(word.toUpperCase()));
  if (!b) return;
  const p = easeOut(prog(lt, tSpoken, tSpoken + 0.28)), x = easeIn(prog(lt, t1 - EXIT, t1));
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha = 1 - x; ctx.strokeStyle = dark ? C.mari : C.ember; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(b.x + 4, b.y + b.h * 0.98); ctx.lineTo(b.x + 4 + (b.w - 8) * p, b.y + b.h * 0.98); ctx.stroke(); ctx.restore();
}
// odometer: tabular digits roll, last digit lands with 1.06→1.0 settle
function odometer(ctx, target, p, x, y, px, col, { prefix = '', suffix = '', comma = true, align = 'left', settleT = -1 } = {}) {
  font(ctx, px, 'head');
  const cw = ctx.measureText('0').width * 1.02, v = target * easeOut(p);
  const digits = String(target).length;
  const parts = [];
  for (let k = digits - 1; k >= 0; k--) {
    const pos = v / Math.pow(10, k), d = Math.floor(pos) % 10;
    const lower = v % Math.pow(10, k), thr = Math.pow(10, k) - 1;
    const frac = k === 0 ? v % 1 : (lower > thr ? lower - thr : 0);
    const lead = k > 0 && Math.floor(pos) === 0 && frac === 0;
    parts.push({ d, frac, lead });
    if (comma && k === 3) parts.push({ sep: ',' });
  }
  const pre = ctx.measureText(prefix).width, suf = ctx.measureText(suffix).width;
  const vis = parts.filter(q => !q.lead);
  const width = pre + vis.reduce((a, q) => a + (q.sep ? ctx.measureText(',').width : cw), 0) + suf;
  let xx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  const sc = settleT >= 0 ? 1 + 0.06 * Math.exp(-settleT * 9) * Math.cos(settleT * 12) : 1;
  ctx.save(); ctx.translate(xx + width / 2, y - px * 0.35); ctx.scale(sc, sc); ctx.translate(-(xx + width / 2), -(y - px * 0.35));
  ctx.fillStyle = col; ctx.textBaseline = 'alphabetic';
  ctx.fillText(prefix, xx, y); xx += pre;
  ctx.save(); ctx.beginPath(); ctx.rect(xx - 4, y - px * 0.92, width + 8, px * 1.05); ctx.clip();
  for (const q of vis) {
    if (q.sep) { ctx.fillText(',', xx, y); xx += ctx.measureText(',').width; continue; }
    const o = q.frac * px * 0.95;
    ctx.fillText(String(q.d), xx + (cw - ctx.measureText(String(q.d)).width) / 2, y - o);
    if (q.frac > 0) ctx.fillText(String((q.d + 1) % 10), xx + (cw - ctx.measureText(String((q.d + 1) % 10)).width) / 2, y - o + px * 0.95);
    xx += cw;
  }
  ctx.restore();
  ctx.fillText(suffix, xx, y);
  ctx.restore();
}
function label(ctx, text, x, y, col, px = 44, a = 1) { font(ctx, px, 'label'); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x, y); ctx.restore(); }
function chipLabel(ctx, text, x, y, lt, t0, t1, dark, { px = 48, fill = null, col = null } = {}) {
  const e = life(lt, t0, t1, { dy: 18, k: 16 }); if (e.a <= 0) return;
  font(ctx, px, 'bold'); const tw = ctx.measureText(text).width, h = px * 1.6;
  ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.4 + x) * 1.2);
  pill(ctx, x, y, tw + px * 1.1, h, fill || C.ink, { press: pressIn(lt, t0) });
  ctx.fillStyle = col || C.mari; ctx.textBaseline = 'middle'; font(ctx, px, 'bold'); ctx.fillText(text, x + px * 0.55, y + h / 2 + 2);
  ctx.restore();
}
function waveform(ctx, x, y, w, h, t, col, amp = 1, f = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  for (let i = 0; i <= 80; i++) { const u = i / 80, v = Math.sin(u * 22 * f + t * 8) * 0.6 + Math.sin(u * 51 * f - t * 12) * 0.4; const yy = y + v * h / 2 * amp * Math.sin(u * Math.PI); i ? ctx.lineTo(x + u * w, yy) : ctx.moveTo(x + u * w, yy); }
  ctx.stroke();
}
function chip(ctx, cx, cy, s, lit, dark) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = dark ? C.paper : C.ink;
  for (let i = 0; i < 4; i++) { const yy = -s * 0.3 + i * s * 0.2; rr(ctx, -s * 0.64, yy - 8, s * 0.16, 16, 6); ctx.fill(); rr(ctx, s * 0.48, yy - 8, s * 0.16, 16, 6); ctx.fill(); }
  rr(ctx, -s / 2, -s / 2, s, s, 26); ctx.fill();
  font(ctx, s * 0.15, 'head'); ctx.fillStyle = dark ? C.ink : C.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SOUND', 0, -s * 0.09); ctx.fillText('CHIP', 0, s * 0.08); ctx.textAlign = 'left';
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-s * 0.27 + i * s * 0.18, s * 0.33, 10, 0, 7); ctx.fillStyle = lit > i ? C.mari : C.stone; ctx.fill(); }
  ctx.restore();
}
let DITHER = null;
function ditherFace() { // our own generated 4-grey preview (no real image of webcam output available)
  if (DITHER) return DITHER;
  const cw = 128, ch = 112, c = createCanvas(cw, ch), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 50, 10, 64, 56, 90); g.addColorStop(0, '#d8d8d8'); g.addColorStop(1, '#303030'); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
  x.fillStyle = '#e8e8e8'; x.beginPath(); x.ellipse(64, 60, 34, 40, 0, 0, 7); x.fill();
  x.fillStyle = '#202020'; x.beginPath(); x.arc(51, 52, 5, 0, 7); x.arc(77, 52, 5, 0, 7); x.fill();
  x.strokeStyle = '#202020'; x.lineWidth = 4; x.beginPath(); x.arc(64, 66, 16, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  x.fillStyle = '#707070'; x.beginPath(); x.ellipse(64, 24, 36, 14, 0, 0, 7); x.fill();
  const id = x.getImageData(0, 0, cw, ch), d = id.data, B = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], G = [[21, 19, 18], [92, 86, 80], [168, 160, 150], [240, 236, 230]];
  for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) { const i = (yy * cw + xx) * 4, v = d[i] / 255 * 3 + (B[(yy % 4) * 4 + xx % 4] / 16 - 0.5), q = G[clamp(Math.round(v), 0, 3)]; d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; }
  x.putImageData(id, 0, 0); DITHER = c; return c;
}
function stamp(ctx, text, cx, cy, p, col, { px = 64, rot0 = -4, rot1 = 0, fill = false } = {}) {
  if (p <= 0) return;
  const q = easeOut(p), s = lerp(1.3, 1, q), r = lerp(rot0, rot1, q) * Math.PI / 180;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(r); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3);
  font(ctx, px, 'head'); const w = ctx.measureText(text).width + px * 0.7, h = px * 1.2;
  if (fill) { rr(ctx, -w / 2, -h / 2, w, h, 14); ctx.fillStyle = col; ctx.fill(); ctx.fillStyle = C.ink; }
  else { ctx.lineWidth = 6; ctx.strokeStyle = col; rr(ctx, -w / 2, -h / 2, w, h, 14); ctx.stroke(); ctx.fillStyle = col; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, px * 0.06); ctx.restore(); ctx.textAlign = 'left';
}
// Logo v5 wordmark: "spec or wreck", "or" ember, final k tipped 18° (rot param 0..1 of the tip)
function wordmark(ctx, cx, cy, px, tip, dark, a = 1) {
  font(ctx, px, 'logo');
  const parts = [['spec ', dark ? C.paper : C.ink], ['or ', C.ember], ['wrec', dark ? C.paper : C.ink]];
  const kW = ctx.measureText('k').width, total = parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0) + kW;
  let x = cx - total / 2; ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'alphabetic';
  for (const [t, col] of parts) { ctx.fillStyle = col; ctx.fillText(t, x, cy); x += ctx.measureText(t).width; }
  ctx.save(); ctx.translate(x + kW, cy + 4 * tip); ctx.rotate(18 * tip * Math.PI / 180); ctx.fillStyle = dark ? C.paper : C.ink; ctx.fillText('k', -kW, 0); ctx.restore();
  ctx.restore();
}

// ======================= SCENES =======================
// helpers to get local times inside a scene
let CUR = null;
const T = (token, nth = 0) => { let i = CUR.w0; for (let n = 0; n <= nth; n++) { i = wAt(token, n === 0 ? i : i + 1); } return words[i].start - CUR.start; };
const TE = (token, nth = 0) => { let i = CUR.w0; for (let n = 0; n <= nth; n++) { i = wAt(token, n === 0 ? i : i + 1); } return words[i].end - CUR.start; };

// 0 HOOK — real hero (cartridge in slot) on ink
scene(0, 'ink', 'cut_3q', true, (ctx, lt, d, X) => {
  const e = life(lt, -1, d + 9);
  product(ctx, IMG.cut_3q, 470, 860, 520, { lt: lt + 2, seed: 0.3, sweepAt: 0.25, push: lt / d });
  // marigold glow at the cartridge slot (on ink)
  const g = 0.5 + 0.5 * Math.sin(lt * 4.5); ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * g; ctx.filter = 'blur(26px)'; ctx.fillStyle = C.mari; ctx.beginPath(); ctx.ellipse(440, 800, 120, 26, -0.12, 0, 7); ctx.fill(); ctx.restore();
  const hb = headline(ctx, 'PLAYS GAME BOY CARTRIDGES', lt, true, { t0: 0.15, t1: d + 9 });
  underline(ctx, hb, 'CARTRIDGES', T('cartridges'), lt, true);
}, { head: 'PLAYS GAME BOY CARTRIDGES', sfx: () => [[0.15, 'whoosh', 0.35], [0.25, 'shimmer', 0.4], [T('cartridges'), 'swish', 0.4]] });
// 1 Not the games... just the music — camera moves in on the cartridge
scene(1, 'ink', 'cut_3q', true, (ctx, lt, d) => {
  const z = easeInOut(prog(lt, 0, 1.4));
  product(ctx, IMG.cut_3q, lerp(470, 560, z), lerp(860, 980, z), lerp(520, 820, z), { lt: lt + 6, seed: 0.3, sweepAt: -5, push: lt / d });
  const hb = headline(ctx, 'NOT THE GAMES', lt, true, { t0: 0.05, t1: T('just') });
  if (lt > T('just') - 0.1) { const hb2 = headline(ctx, 'JUST THE MUSIC', lt, true, { t0: T('just') - 0.05 }); underline(ctx, hb2, 'MUSIC', T('music'), lt, true); }
  const e = life(lt, T('music') - 0.05, 1e9, { dy: 30 });
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y); pill(ctx, 60, 1000, 640, 96, C.ink, { press: pressIn(lt, T('music')) }); waveform(ctx, 100, 1048, 560, 56, lt, C.mari); ctx.restore(); }
}, { sfx: () => [[0.0, 'whoosh', 0.3], [T('just'), 'pop', 0.3], [T('music'), 'blip', 0.5]] });
// 2 It's called the Retro Song Bird — front render, light sweep (paper)
scene(2, 'paper', 'cut_front_cart', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_front_cart, 470, 820, 600, { lt, seed: 1.1, sweepAt: T('retro') - 0.1, push: lt / d });
  const hb = headline(ctx, 'RETRO SONG BIRD', lt, false, { t0: T('retro') - 0.15 });
  underline(ctx, hb, 'BIRD', T('bird'), lt, false);
}, { sfx: () => [[T('retro') - 0.1, 'shimmer', 0.5], [T('bird'), 'swish', 0.35]] });
// 3 Push in a cartridge, like Pokémon Red — the REAL prototype photo, full-bleed with parallax
scene(3, 'paper', 'full_proto', true, (ctx, lt, d) => {
  const im = IMG.full_proto, s = 1.0 + 0.02 * lt / d, px = lerp(-20, 20, lt / d);
  // full-bleed card: photo layer moves slower than the frame (parallax vs headline)
  ctx.save(); rr(ctx, 60, 560, 820, 520, 36); ctx.clip();
  const w = 820 * 1.25 * s, h = w * im.height / im.width; ctx.drawImage(im, 470 - w / 2 + px, 820 - h / 2 + 60, w, h);
  const v = ctx.createLinearGradient(0, 560, 0, 1080); v.addColorStop(0.7, 'rgba(21,19,18,0)'); v.addColorStop(1, 'rgba(21,19,18,0.35)'); ctx.fillStyle = v; ctx.fillRect(60, 560, 820, 520);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.7; ctx.drawImage(SHADOW, 110, 1060, 720, 50); ctx.restore();
  const hb = headline(ctx, 'PUSH IN A CARTRIDGE', lt, false, { t0: 0.05 });
  underline(ctx, hb, 'CARTRIDGE', T('cartridge'), lt, false);
  chipLabel(ctx, 'it plays the soundtrack', 90, 960, lt, T('soundtrack') - 0.05, 1e9, false);
  { const e = life(lt, 0.6, 1e9, { dy: 14 }); if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y); font(ctx, 40, 'bold'); const tw = ctx.measureText('real prototype').width; pill(ctx, 856 - tw - 44, 584, tw + 44, 62, C.ink, { press: pressIn(lt, 0.6) }); ctx.fillStyle = C.paper; ctx.textBaseline = 'middle'; ctx.fillText('real prototype', 856 - tw - 22, 617); ctx.restore(); } }
}, { sfx: () => [[0.0, 'whoosh', 0.3], [T('cartridge'), 'click', 0.6], [T('soundtrack') - 0.05, 'pop', 0.45]] });
// 4 nineteen hundred games — odometer + product beside
scene(4, 'paper', 'cut_front_cart', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_front_cart, 690, 880, 360, { lt: lt + 3, seed: 2.0, sweepAt: -5, push: lt / d });
  const t0 = T('nineteen'), t1 = TE('hundred');
  const e = life(lt, t0 - 0.1, 1e9, { dy: 30 });
  ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y);
  pill(ctx, 60, 640, 470, 190, C.ink, { press: pressIn(lt, t0 - 0.1) });
  odometer(ctx, 1900, prog(lt, t0, t1 + 0.2), 295, 785, 150, C.mari, { align: 'center', settleT: lt - (t1 + 0.2) });
  if (lt > t1 + 0.2) { const pl = easeOut(prog(lt, t1 + 0.2, t1 + 0.45)); font(ctx, 110, 'head'); ctx.fillStyle = C.mari; ctx.globalAlpha = e.a * pl; ctx.fillText('+', 470, 785); }
  ctx.restore();
  label(ctx, 'Game Boy games', 64, 900, C.stone, 48, life(lt, t0 + 0.4).a);
  headline(ctx, 'GAMES SUPPORTED', lt, false, { t0: 0.05 });
}, { sfx: () => [[0, 'whoosh', 0.3], [T('nineteen') - 0.1, 'pop', 0.4], [TE('hundred') + 0.2, 'tick', 0.8]] });
// 5 isn't playing a recording — grille close-up + struck "REC" chip
scene(5, 'paper', 'cut_front', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_front, 470, 860, 760, { lt: lt + 1, seed: 2.6, sweepAt: 0.1, push: lt / d });
  const t0 = T('recording');
  const e = life(lt, t0 - 0.15, 1e9);
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y); pill(ctx, 300, 1000, 340, 96, C.ink, { press: pressIn(lt, t0 - 0.15) });
    ctx.fillStyle = C.wreck; ctx.beginPath(); ctx.arc(352, 1048, 16, 0, 7); ctx.fill(); font(ctx, 52, 'bold'); ctx.fillStyle = C.paper; ctx.textBaseline = 'middle'; ctx.fillText('REC', 384, 1050);
    const sp = easeOut(prog(lt, t0 + 0.25, t0 + 0.55)); ctx.strokeStyle = C.mari; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(318, 1088); ctx.lineTo(318 + 304 * sp, 1088 - 80 * sp); ctx.stroke(); ctx.restore(); }
  const hb = headline(ctx, 'NOT A RECORDING', lt, false, { t0: 0.05 });
  underline(ctx, hb, 'RECORDING', T('recording'), lt, false);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('recording') - 0.15, 'pop', 0.4], [T('recording') + 0.25, 'scratch', 0.5]] });
// 6 reads the cartridge and recreates the original sound chip — real cartridge close-up → arrow → chip
scene(6, 'ink', 'cut_3q', true, (ctx, lt, d) => {
  const cr = [0, 0, 848, 620]; // top of the 3q render: cartridge + slot
  product(ctx, IMG.cut_3q, 260, 820, 380, { lt: lt + 4, seed: 0.9, sweepAt: T('reads') - 0.1, push: lt / d, crop: cr });
  const a = easeOut(prog(lt, T('recreates') - 0.1, T('recreates') + 0.35));
  ctx.save(); ctx.strokeStyle = C.mari; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.shadowColor = C.mari; ctx.shadowBlur = 16 * a;
  ctx.beginPath(); ctx.moveTo(470, 830); ctx.lineTo(470 + 120 * a, 830); ctx.stroke();
  if (a > 0.6) { ctx.beginPath(); ctx.moveTo(570, 806); ctx.lineTo(592, 830); ctx.lineTo(570, 854); ctx.stroke(); } ctx.restore();
  const e = life(lt, T('sound') - 0.12, 1e9, { dy: 30 });
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.3) * 1.5); chip(ctx, 745, 830, 210 * lerp(0.9, 1, e.p), Math.floor(prog(lt, T('chip'), T('chip') + 0.8) * 4.99), true); ctx.restore(); }
  const hb = headline(ctx, 'RECREATES THE SOUND CHIP', lt, true, { t0: 0.05, acc: [] });
  underline(ctx, hb, 'CHIP', T('chip'), lt, true);
}, { sfx: () => [[0, 'click', 0.5], [T('reads') - 0.1, 'shimmer', 0.35], [T('recreates'), 'swish', 0.4], [T('sound') - 0.12, 'pop', 0.45], [T('chip') + 0.1, 'blip', 0.3], [T('chip') + 0.3, 'blip', 0.3], [T('chip') + 0.5, 'blip', 0.3], [T('chip') + 0.7, 'blip', 0.3]] });
// 7 On a computer, four sound channels → own track — real ports photo, USB-C callout, 4 lanes
scene(7, 'ink', 'cut_back', true, (ctx, lt, d) => {
  const im = IMG.cut_back, w = 560, cx = 330, cy = 780;
  product(ctx, im, cx, cy, w, { lt: lt + 2, seed: 3.1, sweepAt: 0.1, push: lt / d });
  // USB-C port in cut_back px ≈ (440, 280) of 976×746
  const sc = w / im.width, ux = cx - w / 2 + 440 * sc, uy = cy - (im.height * sc) / 2 + 285 * sc;
  const c = easeOut(prog(lt, T('computer') - 0.1, T('computer') + 0.3));
  if (c > 0) { ctx.save(); ctx.strokeStyle = C.mari; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(ux, uy, 26 * c, 0, 7); ctx.stroke(); ctx.restore(); chipLabel(ctx, 'USB-C', ux - 70, uy + 150, lt, T('computer') - 0.05, 1e9, true, { px: 44 }); }
  const cols = [C.mari, C.paper, '#C9C1B8', C.stone];
  for (let i = 0; i < 4; i++) {
    const p = easeOut(prog(lt, T('four') + i * STAG, T('four') + 0.6 + i * STAG)); if (p <= 0) continue;
    const y = 640 + i * 105; ctx.save(); ctx.globalAlpha = clamp(p * 1.5);
    ctx.strokeStyle = cols[i]; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(ux + 30, uy); ctx.bezierCurveTo(ux + 120, uy, 560, y + 34, 620, y + 34); ctx.stroke();
    pill(ctx, 620, y, 260, 68, C.inkSoft, { press: pressIn(lt, T('four') + i * STAG) });
    ctx.save(); rr(ctx, 620, y, 260 * p, 68, 34); ctx.clip();
    for (let k = 0; k < 6; k++) { const bx = 640 + k * 40 + ((i * 13 + k * 7) % 12) + Math.sin(lt * 2 + i + k) * 2, bw = 18 + ((i * 7 + k * 11) % 16); rr(ctx, bx, y + 18, bw, 32, 8); ctx.fillStyle = cols[i]; ctx.fill(); }
    ctx.restore(); ctx.restore();
  }
  const ph = prog(lt, T('track'), d); if (ph > 0) { ctx.fillStyle = C.paper; ctx.globalAlpha = 0.8; ctx.fillRect(630 + 240 * ph, 630, 3, 430); ctx.globalAlpha = 1; }
  const hb = headline(ctx, '4 CHANNELS → 4 TRACKS', lt, true, { t0: 0.05, acc: ['4'] });
  underline(ctx, hb, 'TRACKS', T('track'), lt, true);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('computer'), 'click', 0.5], [T('four'), 'pop', 0.35], [T('four') + STAG, 'pop', 0.3], [T('four') + 2 * STAG, 'pop', 0.3], [T('four') + 3 * STAG, 'pop', 0.3], [T('track'), 'swish', 0.35]] });
// 8 So you can actually remix the songs — lanes shuffle (graphic beat)
scene(8, 'ink', 'cut_back', false, (ctx, lt, d) => {
  const cols = [C.mari, C.paper, '#C9C1B8', C.stone];
  for (let i = 0; i < 4; i++) {
    const e = life(lt, i * STAG, d + 9, { dy: 20 });
    const sh = easeInOut(prog(lt, T('remix') - 0.1, T('remix') + 0.6)) * (i % 2 ? 90 : -90) + Math.sin(lt * 1.6 + i) * 2;
    const y = 620 + i * 115; ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y);
    pill(ctx, 60, y, 820, 80, C.inkSoft, { shadow: false });
    ctx.save(); rr(ctx, 60, y, 820, 80, 40); ctx.clip();
    for (let k = 0; k < 9; k++) { const bx = 90 + k * 88 + sh + ((i * 17 + k * 31) % 22), bw = 34 + ((i * 7 + k * 13) % 30); rr(ctx, bx, y + 20, bw, 40, 10); ctx.fillStyle = cols[i]; ctx.fill(); }
    ctx.restore(); ctx.restore();
  }
  const ph = (lt * 180) % 800; ctx.fillStyle = C.paper; ctx.globalAlpha = 0.8; ctx.fillRect(80 + ph, 605, 3, 470); ctx.globalAlpha = 1;
  const hb = headline(ctx, 'REMIX THE SONGS', lt, true, { t0: 0.05 });
  underline(ctx, hb, 'REMIX', T('remix'), lt, true);
}, { sfx: () => [[T('remix') - 0.1, 'swish', 0.5]] });
// 9 PLOT TWIST — hard cut, dark reset
scene(9, 'ink', 'cut_side', false, (ctx, lt, d) => {
  const p = spr(lt - 0.03, 12, 0.5), z = p * (1 + 0.05 * lt / d);
  ctx.save(); ctx.translate(470 + Math.sin(lt * 2.1) * 8, 820); ctx.scale(z, z); ctx.rotate(-0.05 + Math.sin(lt * 1.6) * 0.02);
  font(ctx, 150, 'head'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = C.paper; ctx.fillText('PLOT', 0, -80); ctx.fillStyle = C.mari; ctx.fillText('TWIST', 0, 70);
  ctx.restore(); ctx.textAlign = 'left';
  label(ctx, "here's the strange part", 270, 1020, C.stone, 44, life(lt, T('strange')).a);
}, { hardIn: true, sfx: () => [[0, 'hit', 0.8], [T('strange'), 'pop', 0.3]] });
// 10 Plug in a Game Boy Camera → webcam — real product + our generated preview
scene(10, 'ink', 'cut_front_cart', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_front_cart, 300, 860, 420, { lt: lt + 1, seed: 1.7, sweepAt: 0.1, push: lt / d });
  const q = life(lt, T('webcam') - 0.1, 1e9, { dy: 30 });
  if (q.a > 0) { ctx.save(); ctx.globalAlpha = q.a; ctx.translate(0, q.y + Math.sin(lt * 1.2) * 1.5); ctx.imageSmoothingEnabled = false;
    pill(ctx, 560, 660, 320, 300, C.inkSoft, { press: pressIn(lt, T('webcam') - 0.1), hl: true }); rr(ctx, 560, 660, 320, 300, 34); ctx.save(); ctx.clip(); ctx.drawImage(ditherFace(), 576, 690, 288, 252); ctx.restore();
    ctx.fillStyle = C.wreck; ctx.beginPath(); ctx.arc(598, 692, 9 * (0.6 + 0.4 * Math.sin(lt * 8)), 0, 7); ctx.fill(); ctx.restore(); }
  chipLabel(ctx, 'Game Boy Camera', 64, 1000, lt, T('camera') - 0.1, 1e9, true, { px: 44 });
  const hb = headline(ctx, "IT'S A WEBCAM", lt, true, { t0: 0.05 });
  underline(ctx, hb, 'WEBCAM', T('webcam'), lt, true);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('camera') - 0.1, 'click', 0.5], [T('webcam') - 0.1, 'shutter', 0.6]] });
// 11 Four shades of grey, about five frames a second
scene(11, 'ink', 'cut_front_cart', false, (ctx, lt, d) => {
  const z = 1 + 0.06 * easeInOut(prog(lt, 0, d));
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(60, 600); ctx.scale(z, z); ctx.drawImage(ditherFace(), 0, 0, 128 * 3.1, 112 * 3.1); ctx.restore();
  [[21, 19, 18], [92, 86, 80], [168, 160, 150], [240, 236, 230]].forEach((c, i) => { const e = life(lt, T('four') + i * STAG, 1e9, { dy: 30 }); ctx.save(); ctx.globalAlpha = e.a; rr(ctx, 520 + i * 92, 640 + e.y + Math.sin(lt * 1.5 + i) * 1.5, 76, 76, 16); ctx.fillStyle = `rgb(${c})`; ctx.fill(); ctx.strokeStyle = C.inkLine; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); });
  chipLabel(ctx, '4 greys', 520, 760, lt, T('shades') - 0.05, 1e9, true, { px: 48 });
  chipLabel(ctx, '~5 fps', 520, 880, lt, T('five') - 0.05, 1e9, true, { px: 48 });
  const f = Math.floor(lt * 5) % 5; label(ctx, `frame ${f + 1}/5`, 64, 1010, C.stone, 44, life(lt, T('five')).a);
  headline(ctx, '4 GREYS · ~5 FPS', lt, true, { t0: 0.05, acc: ['4', '~5'] });
}, { sfx: () => [[T('four'), 'pop', 0.3], [T('four') + STAG, 'pop', 0.25], [T('four') + 2 * STAG, 'pop', 0.25], [T('four') + 3 * STAG, 'pop', 0.25], [T('five') - 0.05, 'pop', 0.4]] });
// 12 Apparently, people really want this — real side render, full-bleed card
scene(12, 'paper', 'cut_side2', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_side2, 470, 840, 560, { lt: lt + 1, seed: 1.9, sweepAt: 0.15, push: lt / d });
  const hb = headline(ctx, 'PEOPLE WANT THIS', lt, false, { t0: 0.05 });
  underline(ctx, hb, 'WANT', T('want'), lt, false);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('want'), 'swish', 0.4]] });
// 13 $59 sold out, $500 wooden sold out — price ladder next to the real product
scene(13, 'paper', 'cut_3q', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 740, 760, 250, { lt: lt + 5, seed: 2.2, sweepAt: -5, push: lt / d });
  const rows = [['$59', 'fifty', 'sold', 0], ['$500', 'five', 'did', 1]];
  rows.forEach(([price, wIn, wSold, nth], i) => {
    const tIn = T(wIn) - 0.1, tSt = nth === 0 ? T('sold') : T('wooden') - 0.05;
    const e = life(lt, tIn, 1e9, { dy: 30 }); if (e.a <= 0) return;
    const y = 940 - i * 170, wood = i === 1;
    ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.2 + i) * 1.2);
    pill(ctx, 60, y, 520, 130, wood ? '#B98552' : C.ink, { press: pressIn(lt, tIn) });
    if (wood) odometer(ctx, 500, prog(lt, tIn, tIn + 0.5), 110, y + 92, 80, C.ink, { prefix: '$', settleT: lt - tIn - 0.5 });
    else odometer(ctx, 59, prog(lt, tIn, tIn + 0.5), 110, y + 92, 80, C.mari, { prefix: '$', settleT: lt - tIn - 0.5 });
    ctx.restore();
    stamp(ctx, 'SOLD OUT', 478, y + 64, prog(lt, tSt, tSt + 0.18), wood ? C.ink : C.wreck, { px: 46, rot0: -14, rot1: -8 });
  });
  headline(ctx, 'SOLD OUT TWICE', lt, false, { t0: 0.05 }); label(ctx, '$500 = the wooden one', 64, 690, C.stone, 44, life(lt, T('wooden') + 0.1).a);
}, { sfx: () => [[T('fifty') - 0.1, 'pop', 0.4], [T('fifty') + 0.4, 'tick', 0.6], [T('sold'), 'stamp', 0.8], [T('five') - 0.1, 'pop', 0.4], [T('five') + 0.4, 'tick', 0.6], [T('wooden') - 0.05, 'stamp', 0.8]] });
// 14 Nearly tripled $15K goal in about a day
scene(14, 'ink', 'cut_3q', false, (ctx, lt, d) => {
  const t0 = T('tripled') - 0.1, p = easeOut(prog(lt, t0, T('goal') + 0.2));
  const e = life(lt, 0.05, 1e9);
  ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y);
  label(ctx, 'Kickstarter goal', 64, 650, C.stone, 44);
  pill(ctx, 60, 690, 820, 110, C.inkSoft, { shadow: false });
  const full = 820 * 0.36 + 820 * 0.6 * p; rr(ctx, 60, 690, Math.max(110, full), 110, 55); ctx.fillStyle = C.mari; ctx.fill();
  const gx = 60 + 820 * 0.36; ctx.fillStyle = C.paper; ctx.fillRect(gx - 2, 670, 4, 150);
  odometer(ctx, 15, prog(lt, T('fifteen') - 0.1, T('goal')), gx - 80, 880, 56, C.paper, { prefix: '$', suffix: 'K', settleT: lt - T('goal') });
  ctx.restore();
  const q = life(lt, T('goal') + 0.1, 1e9, { dy: 30 });
  if (q.a > 0) { ctx.save(); ctx.globalAlpha = q.a; ctx.translate(0, q.y); odometer(ctx, 3, prog(lt, T('goal') + 0.1, T('goal') + 0.5), 880, 1060, 180, C.mari, { prefix: '~', suffix: '×', align: 'right', settleT: lt - T('goal') - 0.5 }); ctx.restore(); }
  label(ctx, 'in about a day', 64, 1040, C.paper, 48, life(lt, T('day') - 0.1).a);
  const hb = headline(ctx, 'NEARLY TRIPLED', lt, true, { t0: 0.05 });
  underline(ctx, hb, 'TRIPLED', T('tripled'), lt, true);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('tripled') - 0.1, 'rise', 0.45], [T('goal'), 'tick', 0.6], [T('goal') + 0.5, 'tick', 0.8], [T('day') - 0.1, 'pop', 0.3]] });
// 15 Right now $79 — real product with a price tag
scene(15, 'ink', 'cut_front_cart', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_front_cart, 330, 860, 440, { lt: lt + 2, seed: 0.5, sweepAt: 0.05, push: lt / d });
  const t0 = T('seventy') - 0.1, e = life(lt, t0, 1e9, { dy: 30 });
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.3) * 1.5);
    ctx.strokeStyle = C.mari; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(470, 700); ctx.quadraticCurveTo(540, 650, 600, 690); ctx.stroke();
    pill(ctx, 560, 660, 320, 170, C.ink, { press: pressIn(lt, t0) }); ctx.strokeStyle = C.mari; ctx.lineWidth = 3; rr(ctx, 562, 662, 316, 166, 83); ctx.stroke();
    odometer(ctx, 79, prog(lt, t0, TE('seventy') + 0.1), 720, 790, 120, C.mari, { prefix: '$', align: 'center', settleT: lt - TE('seventy') - 0.1 }); ctx.restore(); }
  const hb = headline(ctx, 'RIGHT NOW', lt, true, { t0: 0.05 });
  underline(ctx, hb, 'NOW', T('now'), lt, true);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('seventy') - 0.1, 'pop', 0.4], [TE('seventy') + 0.1, 'tick', 0.9]] });
// 16 THE CATCH — hard cut: dim 85 %, stamp 1.3→1 / −4°→0, 1-frame warm flash, 3 px shake 6 frames, thud
scene(16, 'ink', 'cut_3q', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 470, 900, 480, { lt: lt + 8, seed: 0.3, sweepAt: -5, push: 0.5 });
  const dim = 0.85 * clamp(lt / (2 * FR)); ctx.fillStyle = `rgba(21,19,18,${dim})`; ctx.fillRect(0, 0, W, H);
  const ts = 0.12; stamp(ctx, 'THE CATCH', 470, 700, prog(lt, ts, ts + 0.2), C.wreck, { px: 140, rot0: -4, rot1: 0 });
  if (lt >= ts + 0.2 && lt < ts + 0.2 + FR) { ctx.fillStyle = 'rgba(255,214,150,0.55)'; ctx.fillRect(0, 0, W, H); }
}, { hardIn: true, shakeAt: 0.32, sfx: () => [[0.32, 'thud', 1.0]] });
// 17 Kickstarter, deliveries not expected until April 2027 — calendar flip
scene(17, 'ink', 'cut_3q', false, (ctx, lt, d) => {
  chipLabel(ctx, "it's a Kickstarter", 64, 620, lt, T('kickstarter') - 0.1, 1e9, true, { px: 48 });
  const p = easeInOut(prog(lt, T('april') - 0.35, T('april') + 0.05));
  const cal = (mon, yr, sy) => { ctx.save(); ctx.translate(470, 900 + Math.sin(lt * 1.2) * 1.5); ctx.scale(1, Math.max(0.001, sy));
    pill(ctx, -250, -180, 500, 360, C.paper, { shadow: true, hl: false }); ctx.save(); rr(ctx, -250, -180, 500, 360, 40); ctx.clip(); ctx.fillStyle = C.wreck; ctx.fillRect(-250, -180, 500, 100); ctx.restore();
    font(ctx, 150, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mon, 0, 60);
    font(ctx, 60, 'bold'); ctx.fillStyle = C.paper; ctx.fillText(yr, 0, -130); ctx.restore(); ctx.textAlign = 'left'; };
  const e = life(lt, T('deliveries') - 0.1, 1e9); ctx.save(); ctx.globalAlpha = e.a;
  if (p < 0.5) cal('NOV', '2026', 1 - p * 2); else cal('APR', '2027', (p - 0.5) * 2); ctx.restore();
  const hb = headline(ctx, 'SHIPS APRIL 2027', lt, true, { t0: T('expected') - 0.2, acc: ['2027'] });
  underline(ctx, hb, '2027', T('twenty'), lt, true);
}, { sfx: () => [[T('kickstarter') - 0.1, 'pop', 0.4], [T('deliveries') - 0.1, 'whoosh', 0.3], [T('april') - 0.35, 'flip', 0.6], [T('april') - 0.15, 'flip', 0.5], [T('twenty'), 'swish', 0.35]] });
// 18 Prototype differs from the final design — REAL prototype photo vs final render
scene(18, 'paper', 'full_proto', true, (ctx, lt, d) => {
  const a = life(lt, 0.05, 1e9, { dy: 30 }), b = life(lt, T('final') - 0.1, 1e9, { dy: 30 });
  ctx.save(); ctx.globalAlpha = a.a; ctx.translate(0, a.y);
  ctx.save(); rr(ctx, 60, 620, 390, 400, 32); ctx.clip(); const im = IMG.full_proto, s = 1.02 + 0.02 * lt / d; const w = 520 * s, h = w * im.height / im.width; ctx.drawImage(im, 255 - w / 2, 820 - h / 2 + 30, w, h); ctx.restore();
  ctx.restore(); label(ctx, 'prototype', 100, 1070, C.stone, 44, a.a);
  if (b.a > 0) { ctx.save(); ctx.globalAlpha = b.a; ctx.translate(0, b.y); product(ctx, IMG.cut_front_cart, 690, 820, 330, { lt, seed: 1.2, sweepAt: T('final'), push: lt / d }); ctx.restore(); label(ctx, 'final design', 590, 1070, C.stone, 44, b.a); }
  const n = life(lt, T('differs') - 0.05, 1e9); font(ctx, 110, 'head'); ctx.fillStyle = C.ember; ctx.globalAlpha = n.a; ctx.textAlign = 'center'; ctx.fillText('≠', 470, 860 + n.y); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  const hb = headline(ctx, 'PROTOTYPE ≠ FINAL', lt, false, { t0: 0.05, acc: ['≠'] });
  underline(ctx, hb, 'PROTOTYPE', T('prototype'), lt, false);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('prototype'), 'swish', 0.35], [T('differs') - 0.05, 'pop', 0.45], [T('final') - 0.1, 'shimmer', 0.4]] });
// 19 Crowdfunded gadgets can arrive late... or not at all — box on a road that fades
scene(19, 'ink', 'cut_3q', false, (ctx, lt, d) => {
  const x = lerp(140, 760, easeInOut(prog(lt, 0.3, T('not') + 0.6))), fade = 1 - easeIn(prog(lt, T('not') - 0.1, T('not') + 0.9));
  ctx.save(); ctx.strokeStyle = C.inkLine; ctx.lineWidth = 6; ctx.setLineDash([30, 24]); ctx.lineDashOffset = lt * 90; ctx.beginPath(); ctx.moveTo(60, 980); ctx.lineTo(880, 980); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, 900 + Math.abs(Math.sin(lt * 9)) * -4); // little delivery box, bouncing
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 10; rr(ctx, -95, -70, 190, 140, 10); ctx.fillStyle = '#B98552'; ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#A2713F'; ctx.fillRect(-95, -70, 190, 26); ctx.fillStyle = 'rgba(250,248,245,0.55)'; ctx.fillRect(-14, -70, 28, 140); ctx.fillStyle = C.paper; rr(ctx, 30, 10, 50, 34, 4); ctx.fill(); ctx.restore();
  stamp(ctx, 'LATE…', 300, 720, prog(lt, T('late') - 0.05, T('late') + 0.15), C.paper, { px: 70, rot0: -10, rot1: -6 });
  stamp(ctx, 'OR NEVER', 640, 760, prog(lt, T('not') - 0.05, T('not') + 0.15), C.wreck, { px: 70, rot0: 8, rot1: 4 });
  const hb = headline(ctx, 'CROWDFUNDED = RISK', lt, true, { t0: 0.05 });
  underline(ctx, hb, 'RISK', T('crowdfunded'), lt, true);
}, { sfx: () => [[0.3, 'whoosh', 0.3], [T('late') - 0.05, 'stamp', 0.6], [T('not') - 0.05, 'stamp', 0.7]] });
// 20 Verdict — wordmark k snaps upright at "spec"; WORTH IT IF row; real product
scene(20, 'paper', 'cut_3q', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 740, 760, 240, { lt: lt + 1, seed: 0.8, sweepAt: 0.1, push: lt / d });
  const tSpec = T('spec'), up = 1 - spr(lt - tSpec, 18, 0.45);
  wordmark(ctx, 330, 720, 96, tSpec > lt ? 1 : clamp(up, -0.15, 1), false, life(lt, 0.05).a);
  const e = life(lt, T('box') - 0.15, 1e9, { dy: 30 });
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.2) * 1.2); pill(ctx, 60, 800, 820, 150, C.ink, { press: pressIn(lt, T('box') - 0.15) });
    font(ctx, 44, 'bold'); ctx.fillStyle = C.mari; ctx.textBaseline = 'alphabetic'; ctx.fillText('WORTH IT IF', 110, 858); font(ctx, 60, 'head'); ctx.fillStyle = C.paper; ctx.fillText('you kept your carts', 110, 924); ctx.restore(); }
  stamp(ctx, 'SPEC', 760, 1030, prog(lt, tSpec, tSpec + 0.2), C.ember, { px: 72, rot0: -10, rot1: -5 });
  headline(ctx, 'THE VERDICT', lt, false, { t0: 0.05 });
}, { sfx: () => [[T('box') - 0.15, 'pop', 0.45], [T('spec'), 'click', 1.0], [T('spec') + 0.05, 'stamp', 0.5]] });
// 21 If you need it before spring, skip it — SKIP IT IF row
scene(21, 'paper', 'cut_3q', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 740, 760, 240, { lt: lt + 7, seed: 0.8, sweepAt: -5, push: 1 });
  wordmark(ctx, 330, 720, 96, 0, false);
  ctx.save(); ctx.translate(0, Math.sin(lt * 1.2) * 1.2); pill(ctx, 60, 800, 820, 150, C.ink, { shadow: true });
  font(ctx, 44, 'bold'); ctx.fillStyle = C.mari; ctx.textBaseline = 'alphabetic'; ctx.fillText('WORTH IT IF', 110, 858); font(ctx, 60, 'head'); ctx.fillStyle = C.paper; ctx.fillText('you kept your carts', 110, 924); ctx.restore();
  const e = life(lt, T('need') - 0.1, 1e9, { dy: 30 });
  if (e.a > 0) { ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y + Math.sin(lt * 1.3) * 1.2); pill(ctx, 60, 970, 820, 100, C.ink, { press: pressIn(lt, T('need') - 0.1) });
    font(ctx, 44, 'bold'); ctx.fillStyle = C.wreck; ctx.textBaseline = 'middle'; ctx.fillText('SKIP IT IF', 110, 1022); font(ctx, 56, 'head'); ctx.fillStyle = C.paper; ctx.fillText('you need it now', 380, 1022); ctx.restore(); }
  headline(ctx, 'THE VERDICT', lt, false, { t0: -9 });
}, { sfx: () => [[T('need') - 0.1, 'pop', 0.45], [T('skip'), 'swish', 0.35]] });
// 22 LOOP line — back to the opening composition (real hero)
scene(22, 'ink', 'cut_3q', true, (ctx, lt, d) => {
  product(ctx, IMG.cut_3q, 470, 860, 520, { lt: lt + 2, seed: 0.3, sweepAt: 0.3, push: 1 - lt / d });
  const g = 0.5 + 0.5 * Math.sin(lt * 4.5); ctx.save(); ctx.globalAlpha = 0.25 + 0.2 * g; ctx.filter = 'blur(26px)'; ctx.fillStyle = C.mari; ctx.beginPath(); ctx.ellipse(440, 800, 120, 26, -0.12, 0, 7); ctx.fill(); ctx.restore();
  const hb = headline(ctx, 'SOMEONE ACTUALLY BUILT IT', lt, true, { t0: 0.1, t1: d - 0.02 });
  underline(ctx, hb, 'BUILT', T('built'), lt, true, d - 0.02);
}, { sfx: () => [[0, 'whoosh', 0.3], [T('built'), 'swish', 0.35]] });
// 23 END CARD (tail): wordmark, k snaps upright (SPEC) with click; then hands back to frame 1
scene(-1, 'paper', null, false, (ctx, lt, d) => {
  const e = life(lt, 0.05, d - 0.45, { dy: 30 });
  const tSnap = 0.85, up = lt < tSnap ? 1 : clamp(1 - spr(lt - tSnap, 18, 0.45), -0.15, 1);
  ctx.save(); ctx.translate(0, e.y); wordmark(ctx, 470, 860, 128, up, false, e.a);
  label(ctx, 'New tech. Straight verdicts.', 200, 960, C.stone, 44, life(lt, 0.3, d - 0.45).a);
  ctx.restore();
}, { endcard: true, sfx: () => [[0.05, 'whoosh', 0.3], [0.85, 'click', 1.0]] });

// ---------- timeline ----------
S.forEach((s, i) => {
  if (s.line >= 0) { s.w0 = words.findIndex(w => w.line === s.line); s.start = i === 0 ? 0 : words[s.w0].start - 0.18; }
  else { s.w0 = words.length - 1; s.start = words[words.length - 1].end + 0.25; }
});
S.forEach((s, i) => { s.end = i < S.length - 1 ? S[i + 1].start : DURATION; s.dur = s.end - s.start; s.i = i; });
const TR = 0.42;                                 // camera move / thread wipe length
const LOOP_BACK = 0.5;                           // last 0.5 s: end card hands over to the frame-1 composition
const EV = []; S.forEach(s => { CUR = s; for (const [t, k, g] of (s.sfx ? s.sfx() : [])) EV.push({ t: +(s.start + t).toFixed(3), kind: k, gain: g }); });
// transitions get their own SFX (whoosh on moves, click on bg wipes)
S.forEach((s, i) => { if (i && !s.hardIn) EV.push({ t: +s.start.toFixed(3), kind: S[i - 1].bg !== s.bg ? 'wipe' : 'move', gain: 0.35 }); });
EV.push({ t: +(DURATION - LOOP_BACK).toFixed(3), kind: 'wipe', gain: 0.3 });

// ---------- frame compositor ----------
function background(ctx, s, t, lt) {
  const dark = s.bg === 'ink';
  ctx.fillStyle = dark ? C.ink : C.paper; ctx.fillRect(0, 0, W, H);
  // depth layer 1: blurred copy of this scene's product, drifting slower than the product (parallax)
  if (s.img && BLUR[s.img]) { const b = BLUR[s.img], sc = 4.2; ctx.save(); ctx.globalAlpha = dark ? 0.13 : 0.09; ctx.drawImage(b, 540 - b.width * sc / 2 + Math.sin(t * 0.21) * 30, 900 - b.height * sc / 2 + Math.cos(t * 0.17) * 24, b.width * sc, b.height * sc); ctx.restore(); }
  if (dark) { const v = ctx.createRadialGradient(540, 860, 300, 540, 900, 1250); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
}
function drawScene(ctx, s, t) {
  CUR = s; const lt = t - s.start;
  background(ctx, s, t, lt);
  ctx.save();
  if (s.shakeAt !== undefined && lt >= s.shakeAt && lt < s.shakeAt + 6 * FR) { const k = Math.round((lt - s.shakeAt) / FR); ctx.translate([3, -3, 2, -2, 1, -1][k] || 0, [-2, 3, -3, 2, -1, 1][k] || 0); }
  // exit before a hard cut: content eases out over the last 210 ms (nothing pops off)
  const next = S[s.i + 1];
  if (next && next.hardIn) { const x = easeIn(prog(lt, s.dur - EXIT, s.dur)); ctx.globalAlpha = 1 - x; ctx.translate(0, -14 * x); }
  s.draw(ctx, lt, s.dur);
  ctx.restore();
}
// captions: x 60–780, 2–4 words, marigold pill slides from word to word
const phrases = []; { let cur = []; words.forEach((w, i) => { cur.push(i); const nx = words[i + 1]; if (cur.length >= 3 || w.brk || !nx || nx.start - w.end > 0.35) { phrases.push(cur); cur = []; } }); }
function captions(ctx, t) {
  const ph = phrases.find(p => t >= words[p[0]].start - 0.08 && t <= words[p[p.length - 1]].end + 0.18); if (!ph) return;
  const t0 = words[ph[0]].start - 0.08, t1 = words[ph[ph.length - 1]].end + 0.18;
  const e = life(t - t0, 0, t1 - t0, { dy: 12, k: 18 });
  const ws = ph.map(i => words[i].w.replace(/\.\.\.$/, '…'));
  let fpx = 50; for (; fpx > 38; fpx -= 2) { font(ctx, fpx, 'bold'); const tw = ws.reduce((a, w) => a + ctx.measureText(w).width, 0) + ctx.measureText(' ').width * (ws.length - 1); if (tw + 56 <= 720) break; }
  font(ctx, fpx, 'bold'); const sp = ctx.measureText(' ').width; const wd = ws.map(w => ctx.measureText(w).width);
  const total = wd.reduce((a, b) => a + b, 0) + sp * (ws.length - 1) + 56;
  const x0 = 60, y = 1118, h = 84;
  ctx.save(); ctx.globalAlpha = e.a; ctx.translate(0, e.y);
  pill(ctx, x0, y, total, h, C.ink, { shadow: true });
  // sliding highlight: interpolate between word slots with a spring
  const xs = []; let xx = x0 + 28; wd.forEach(w => { xs.push(xx); xx += w + sp; });
  let cur = 0; ph.forEach((wi, k) => { if (t >= words[wi].start - 0.04) cur = k; });
  const prevK = Math.max(0, cur - 1), since = t - (words[ph[cur]].start - 0.04);
  const m = cur === 0 ? 1 : spr(since, 22, 0.75);
  const hx = lerp(xs[prevK], xs[cur], m) - 12, hw = lerp(wd[prevK], wd[cur], m) + 24;
  const active = t <= words[ph[ph.length - 1]].end + 0.05;
  ctx.textBaseline = 'middle';
  ws.forEach((w, k) => { ctx.fillStyle = C.paper; ctx.fillText(w, xs[k], y + h / 2 + 2); });
  if (active) { // marigold pill, and ink text only where the pill actually is (no half-hidden letters)
    rr(ctx, hx, y + 12, hw, h - 24, (h - 24) / 2); ctx.fillStyle = C.mari; ctx.fill();
    ctx.save(); rr(ctx, hx, y + 12, hw, h - 24, (h - 24) / 2); ctx.clip(); ctx.fillStyle = C.ink; ws.forEach((w, k) => ctx.fillText(w, xs[k], y + h / 2 + 2)); ctx.restore();
  }
  ctx.restore();
}
// watermark: bottom-right of safe frame (right x 880, bottom y 1220, 64 px, 90 %), 150 ms light/dark crossfade
function watermark(ctx, t, endA) {
  const i = S.findIndex(s => t >= s.start && t < s.end); const s = S[Math.max(0, i)];
  let darkW = s.bg === 'ink' ? 1 : 0;
  const prev = S[s.i - 1]; if (prev && prev.bg !== s.bg && t - s.start < 0.15) { const f = (t - s.start) / 0.15; darkW = s.bg === 'ink' ? f : 1 - f; }
  const h = 64; const draw = (im, a) => { const w = h * im.width / im.height; ctx.globalAlpha = a; ctx.drawImage(im, 880 - w, 1220 - h, w, h); };
  ctx.save(); draw(IMG.wm_dark, 0.9 * darkW * endA); draw(IMG.wm_light, 0.9 * (1 - darkW) * endA); ctx.restore();
}
function grain(ctx, f) { ctx.save(); ctx.globalAlpha = 1; ctx.drawImage(GRAIN[f % GRAIN.length], 0, 0, W, H); ctx.restore(); }

function frame(ctx, t, f) {
  const i0 = S.findIndex(s => t >= s.start && t < s.end); const ci = i0 < 0 ? S.length - 1 : i0;
  const s = S[ci], prev = S[ci - 1], lt = t - s.start;
  if (t >= DURATION - LOOP_BACK) { // hand back to frame 1: thread wipe from end card to the hook composition
    const p = easeInOut(prog(t, DURATION - LOOP_BACK, DURATION - FR));
    drawScene(ctx, S[S.length - 1], t);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * p, H); ctx.clip(); drawScene(ctx, S[0], 0); ctx.restore();
    thread(ctx, W * p, p); watermark(ctx, 0, p); grain(ctx, f); return;
  }
  if (!prev || lt >= TR || s.hardIn) drawScene(ctx, s, t);
  else if (prev.bg !== s.bg) { // thread wipe: new background revealed behind a moving marigold thread
    const p = easeInOut(lt / TR); drawScene(ctx, prev, t);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W * p, H); ctx.clip(); drawScene(ctx, s, t); ctx.restore(); thread(ctx, W * p, p);
  } else { // camera move on one canvas (alternate horizontal / vertical), thread draws across
    const p = easeInOut(lt / TR), vert = ci % 2 === 0;
    ctx.save(); ctx.translate(vert ? 0 : -W * p, vert ? -H * 0.4 * p : 0); drawScene(ctx, prev, t); ctx.restore();
    ctx.save(); ctx.translate(vert ? 0 : W * (1 - p), vert ? H * 0.4 * (1 - p) : 0); drawScene(ctx, s, t); ctx.restore();
    if (!vert) thread(ctx, W * p, p, 1100);
  }
  const endA = s.endcard ? 1 - easeOut(prog(lt, 0, 0.2)) : (prev && prev.endcard ? 1 : 1);
  if (!s.endcard) captions(ctx, t);
  watermark(ctx, t, s.endcard ? endA : 1);
  grain(ctx, f);
}
function thread(ctx, x, p, y = null) { // 5 px marigold line with leading glow
  if (p <= 0 || p >= 1) return;
  ctx.save(); ctx.strokeStyle = C.mari; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); if (y === null) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } else { ctx.moveTo(60, y); ctx.lineTo(Math.min(880, x), y); } ctx.stroke();
  ctx.shadowColor = C.mari; ctx.shadowBlur = 30; ctx.fillStyle = C.mari; ctx.beginPath(); ctx.arc(y === null ? x : Math.min(880, x), y === null ? 960 : y, 9, 0, 7); ctx.fill(); ctx.restore();
}

async function main() {
  await loadAssets();
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  const tl = S.map(s => ({ i: s.i, line: s.line, start: +s.start.toFixed(2), end: +s.end.toFixed(2), bg: s.bg, real: s.real, img: s.img, hard: !!s.hardIn }));
  fs.writeFileSync(path.join(work, 'timeline.json'), JSON.stringify(tl, null, 1));
  const verdict = S.find(s => s.line === 20); CUR = verdict;
  fs.writeFileSync(path.join(work, 'events.json'), JSON.stringify({ catch: S.find(s => s.line === 16).start + 0.32, verdict: verdict.start, spec: verdict.start + T('spec'), end: DURATION }, null, 1));
  if (stillsArg) {
    const ts = stillsArg === 'cues' ? S.flatMap(s => [s.start + Math.min(1.0, s.dur * 0.45), s.end - 0.12]) : stillsArg.split(',').map(Number);
    fs.mkdirSync(path.join(work, 'stills'), { recursive: true });
    for (const t of ts) { frame(ctx, t, Math.round(t * FPS)); fs.writeFileSync(path.join(work, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`), cv.toBuffer('image/png')); }
    console.log('stills', ts.length); return;
  }
  fs.writeFileSync(path.join(work, 'sfx.json'), JSON.stringify(EV.sort((a, b) => a.t - b.t)));
  const N = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(work, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) { frame(ctx, f / FPS, f); if (!ff.stdin.write(cv.data())) await new Promise(r => ff.stdin.once('drain', r)); if (f % 600 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(JSON.stringify({ frames: N, duration: DURATION, seconds: (Date.now() - t0) / 1000 }));
}
main().catch(e => { console.error(e); process.exit(1); });
