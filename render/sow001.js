// SoW Nº001 — Retro Song Bird. Frame renderer: node render/sow001.js <work_dir> [--stills t1,t2,...] [--fps 30]
// Reads work_dir/voice/words.json + scripts/<slug>/cues.json, writes work_dir/frames.mp4 (video only) + sfx.json.
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const L = require('./lib');
const { C, W, H, SAFE, clamp, lerp, easeOut, easeInOut, spring, prog, rr, font, fitPx } = L;

const SLUG = 'sow001-retro-song-bird';
const ROOT = path.resolve(__dirname, '..');
const work = process.argv[2];
const args = process.argv.slice(3);
const FPS = Number((args[args.indexOf('--fps') + 1]) || 30);
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;

L.registerFonts(path.join(__dirname, 'fonts'));
const words = JSON.parse(fs.readFileSync(path.join(work, 'voice/words.json')));
const cues = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts', SLUG, 'cues.json'))).scenes;
const VOICE_DELAY = 0.35; // short silent beat so the first frame reads before the voice starts
for (const w of words) { w.start += VOICE_DELAY; w.end += VOICE_DELAY; }
const DURATION = words[words.length - 1].end + 0.9;
{ // align Kokoro tokens 1:1 with script words (same count) so captions show the script's own text + punctuation
  const md = fs.readFileSync(path.join(ROOT, 'scripts', SLUG, 'script.md'), 'utf8').split('\n');
  const sw = md.filter(l => l.trim() && !l.startsWith('[') && !l.startsWith('#') && !/^(Voice|Retention)/.test(l)).join(' ').split(/\s+/).filter(x => /\w/.test(x));
  if (sw.length === words.length) words.forEach((w, i) => { w.disp = sw[i].replace(/\.\.\.$/, '…'); w.brk = /[.,?!…]$/.test(sw[i]); });
  else { console.warn('caption align fallback', sw.length, words.length); words.forEach(w => { w.disp = w.w; w.brk = false; }); }
}

// ---- resolve cue anchors to word times (search forward, case/punctuation-insensitive) ----
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
let wi = 0;
for (const c of cues) {
  const toks = c.anchor.split(/\s+/).map(norm).filter(Boolean);
  let found = -1;
  for (let i = wi; i < words.length && found < 0; i++) {
    let ok = true;
    for (let j = 0; j < toks.length; j++) {
      const w = words[i + j] && norm(words[i + j].w);
      if (!w || !(w === toks[j] || w.startsWith(toks[j]) || toks[j].startsWith(w))) { ok = false; break; }
    }
    if (ok) found = i;
  }
  if (found < 0) throw new Error('anchor not found: ' + c.anchor);
  c.wi = found; c.at = words[found].start; wi = found + 1;
}
// scene start = slightly before the anchor word so the visual lands with the word
cues.forEach((c, i) => { c.start = i === 0 ? 0 : Math.max(cues[i - 1].start + 0.6, c.at - 0.12); });
cues.forEach((c, i) => { c.end = i < cues.length - 1 ? cues[i + 1].start : DURATION; c.dur = c.end - c.start; c.i = i; });

// ---- assets ----
let IMG = {};
async function loadAssets() {
  const d = path.join(work, 'assets');
  for (const f of fs.readdirSync(d)) if (/\.(png|jpg)$/.test(f)) IMG[f.replace(/\.\w+$/, '')] = await L.loadImage(path.join(d, f));
}

// ---- SFX event log (mixed later in python) ----
const SFX = [];
function sfxAt(t, kind, gain = 1) { SFX.push({ t: +t.toFixed(3), kind, gain }); }

// local time (s) of the first word starting with `w` at/after the scene's anchor word
let CUR = null;
function wt(w) {
  const c = CUR; const n = w.toLowerCase();
  for (let i = c.wi; i < words.length; i++) if (words[i].w.toLowerCase().replace(/[^a-z0-9]/g, '').startsWith(n)) return words[i].start - c.start;
  return 1e9;
}

// ======================= drawing primitives =======================
function bgFill(ctx, col) { ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); }

function dotGrid(ctx, col, t) { // subtle moving dot field: background never static
  ctx.fillStyle = col;
  const off = (t * 14) % 60;
  for (let y = -60 + off; y < H; y += 60) for (let x = 30; x < W; x += 60) { ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); }
}

// Product photo on a rounded card, 2.5D: horizontal squash + skew for tilt, shadow, light sweep, slow push-in
function productCard(ctx, img, cx, cy, w, { tilt = 0, sweep = -1, push = 0, alpha = 1, crop = null, dark = false } = {}) {
  const sx = crop ? crop[0] : 0, sy = crop ? crop[1] : 0, sw = crop ? crop[2] : img.width, sh = crop ? crop[3] : img.height;
  const s = 1 + 0.06 * push;
  const h = w * sh / sw;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);
  ctx.scale(s * (1 - Math.abs(tilt) * 0.12), s);
  ctx.transform(1, tilt * 0.10, 0, 1, 0, 0);
  ctx.shadowColor = dark ? 'rgba(0,0,0,0.65)' : 'rgba(14,14,16,0.28)';
  ctx.shadowBlur = 60; ctx.shadowOffsetY = 30;
  rr(ctx, -w / 2, -h / 2, w, h, 36); ctx.fillStyle = '#EBEBEB'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); rr(ctx, -w / 2, -h / 2, w, h, 36); ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  if (sweep >= 0 && sweep <= 1) {
    const x = lerp(-w, w, sweep);
    const g = ctx.createLinearGradient(x - 160, 0, x + 160, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  }
  ctx.restore();
  ctx.restore();
  return h * s;
}

// Generic grey cartridge (our own drawing: no logos, no label art)
function cartridge(ctx, x, y, w, { body = '#9A9AA0', label = '#C9C9CE', rot = 0, alpha = 1 } = {}) {
  const h = w * 1.12;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = body;
  ctx.beginPath();
  const n = w * 0.16; // notched bottom-right corner
  ctx.moveTo(-w / 2 + 10, -h / 2); ctx.lineTo(w / 2 - 10, -h / 2); ctx.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + 10);
  ctx.lineTo(w / 2, h / 2 - n); ctx.lineTo(w / 2 - n, h / 2); ctx.lineTo(-w / 2 + 10, h / 2); ctx.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - 10);
  ctx.lineTo(-w / 2, -h / 2 + 10); ctx.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + 10, -h / 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.12)'; // grip ridges
  for (let i = 0; i < 4; i++) ctx.fillRect(-w / 2 + w * 0.12, -h / 2 + h * 0.05 + i * h * 0.025, w * 0.76, h * 0.009);
  rr(ctx, -w * 0.36, -h * 0.28, w * 0.72, h * 0.5, 10); ctx.fillStyle = label; ctx.fill(); // blank label
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(-w * 0.3, h * 0.36, w * 0.6, h * 0.06); // contacts edge
  ctx.restore();
  return h;
}

function headline(ctx, text, lt, { dark, y = 330, maxPx = 118, minPx = 80, accentWords = [], exitT = 1e9 } = {}) {
  if (!text) return;
  const maxW = SAFE.x1 - SAFE.x0;
  const lines = wrap(ctx, text, maxW, maxPx, minPx);
  font(ctx, lines.px, 'head');
  const lh = lines.px * 0.98;
  let k = 0;
  lines.rows.forEach((row, ri) => {
    let x = SAFE.x0;
    row.forEach(wd => {
      const p = spring(lt - 0.05 * k, 11, 0.6);
      const out = easeInOut(prog(lt, exitT, exitT + 0.25));
      ctx.save();
      ctx.globalAlpha = clamp(p * 1.4) * (1 - out);
      ctx.translate(0, (1 - p) * 70 - out * 40);
      const isAccent = accentWords.some(a => wd.toUpperCase().includes(a));
      ctx.fillStyle = isAccent ? (dark ? C.lime : C.ink) : (dark ? C.paper : C.ink);
      if (isAccent && !dark) { // accent on paper = ink pill with lime text (never lime on paper)
        const ww = ctx.measureText(wd).width;
        rr(ctx, x - 12, y + ri * lh - lines.px * 0.08, ww + 24, lines.px * 0.98, 18); ctx.fillStyle = C.ink; ctx.fill();
        ctx.fillStyle = C.lime;
      }
      ctx.textBaseline = 'top';
      ctx.fillText(wd, x, y + ri * lh);
      ctx.restore();
      x += ctx.measureText(wd + ' ').width;
      k++;
    });
  });
  return y + lines.rows.length * lh;
}
function wrap(ctx, text, maxW, maxPx, minPx) {
  const ws = text.split(' ');
  for (let px = maxPx; px >= minPx; px -= 4) {
    font(ctx, px, 'head');
    const rows = []; let cur = [];
    for (const w of ws) {
      const t = [...cur, w].join(' ');
      if (ctx.measureText(t).width > maxW && cur.length) { rows.push(cur); cur = [w]; } else cur.push(w);
    }
    rows.push(cur);
    if (rows.length <= 2 && rows.every(r => ctx.measureText(r.join(' ')).width <= maxW)) return { px, rows };
  }
  font(ctx, minPx, 'head');
  return { px: minPx, rows: [ws] };
}

function episodeTag(ctx, dark, t) {
  font(ctx, 40, 'label'); ctx.fillStyle = C.grey; ctx.textBaseline = 'top';
  ctx.fillText('SoW Nº001', SAFE.x0, 272);
}

function counterText(v, fmt) { return fmt(Math.round(v)); }

function bigNumber(ctx, text, x, y, px, col, align = 'left') {
  font(ctx, px, 'head'); ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.textAlign = align;
  ctx.fillText(text, x, y); ctx.textAlign = 'left';
}

function waveform(ctx, x, y, w, h, t, col, amp = 1, freq = 1) {
  ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const v = Math.sin(u * 20 * freq + t * 9) * 0.6 + Math.sin(u * 47 * freq - t * 13) * 0.4;
    const yy = y + v * h / 2 * amp * Math.sin(u * Math.PI);
    i ? ctx.lineTo(x + u * w, yy) : ctx.moveTo(x + u * w, yy);
  }
  ctx.stroke();
}

// Square-pulse "chip" waveform (4 channels look)
function pulseWave(ctx, x, y, w, h, t, col, period = 60) {
  ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.beginPath();
  const off = (t * 120) % period;
  let up = true; ctx.moveTo(x, y);
  for (let xx = -off; xx < w; xx += period / 2) {
    const a = Math.max(0, xx), b = Math.min(w, xx + period / 2);
    if (b <= 0) { up = !up; continue; }
    const yy = up ? y - h / 2 : y + h / 2;
    ctx.lineTo(x + a, yy); ctx.lineTo(x + b, yy); up = !up;
  }
  ctx.stroke();
}

function chip(ctx, cx, cy, s, lit, t, dark) {
  ctx.save(); ctx.translate(cx, cy);
  ctx.fillStyle = dark ? C.paper : C.ink;
  for (let i = 0; i < 4; i++) { // 4 pins each side
    const yy = -s * 0.3 + i * s * 0.2;
    ctx.fillRect(-s * 0.62, yy - 8, s * 0.14, 16); ctx.fillRect(s * 0.48, yy - 8, s * 0.14, 16);
  }
  rr(ctx, -s / 2, -s / 2, s, s, 28); ctx.fill();
  font(ctx, s * 0.16, 'head'); ctx.fillStyle = dark ? C.ink : C.paper; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('SOUND', 0, -s * 0.08); ctx.fillText('CHIP', 0, s * 0.1);
  ctx.textAlign = 'left';
  for (let i = 0; i < 4; i++) { // lit channel dots
    const on = lit > i;
    ctx.beginPath(); ctx.arc(-s * 0.27 + i * s * 0.18, s * 0.33, 11, 0, 7);
    ctx.fillStyle = on ? (dark ? C.lime : C.paper) : C.grey; ctx.fill();
  }
  ctx.restore();
}

function stamp(ctx, text, cx, cy, p, col, { px = 64, rot = -0.12 } = {}) { // p 0..1 slam
  if (p <= 0) return;
  const s = lerp(1.35, 1, easeOut(p));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(p * 3);
  font(ctx, px, 'head');
  const w = ctx.measureText(text).width + 40, h = px * 1.15;
  ctx.lineWidth = 7; ctx.strokeStyle = col; rr(ctx, -w / 2, -h / 2, w, h, 14); ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4);
  ctx.restore(); ctx.textAlign = 'left';
}

// Brand switch: ink pill, knob (lime = spec, wreck = wreck); pos 0 = spec(left) .. 1 = wreck(right)
function brandSwitch(ctx, cx, cy, w, pos, knobCol) {
  const h = w * 0.46;
  ctx.save(); ctx.translate(cx, cy);
  rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fillStyle = C.ink; ctx.fill();
  const r = h * 0.38, x = lerp(-w / 2 + h / 2, w / 2 - h / 2, pos);
  ctx.beginPath(); ctx.arc(x, 0, r, 0, 7); ctx.fillStyle = knobCol; ctx.fill();
  ctx.restore();
}

// 128x112, 4-grey ordered-dither cartoon face, generated by us
let DITHER = null;
function ditherFace() {
  if (DITHER) return DITHER;
  const cw = 128, ch = 112, c = createCanvas(cw, ch), x = c.getContext('2d');
  const g = x.createRadialGradient(64, 50, 10, 64, 56, 90); g.addColorStop(0, '#d8d8d8'); g.addColorStop(1, '#303030');
  x.fillStyle = g; x.fillRect(0, 0, cw, ch);
  x.fillStyle = '#e8e8e8'; x.beginPath(); x.ellipse(64, 60, 34, 40, 0, 0, 7); x.fill();
  x.fillStyle = '#202020'; x.beginPath(); x.arc(51, 52, 5, 0, 7); x.arc(77, 52, 5, 0, 7); x.fill();
  x.strokeStyle = '#202020'; x.lineWidth = 4; x.beginPath(); x.arc(64, 66, 16, 0.15 * Math.PI, 0.85 * Math.PI); x.stroke();
  x.fillStyle = '#707070'; x.beginPath(); x.ellipse(64, 24, 36, 14, 0, 0, 7); x.fill();
  const id = x.getImageData(0, 0, cw, ch), d = id.data;
  const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const pal = [[15, 56, 15], [48, 98, 48], [139, 172, 15], [155, 188, 15]].map(() => 0); // placeholder
  const greys = [24, 92, 168, 236];
  for (let yy = 0; yy < ch; yy++) for (let xx = 0; xx < cw; xx++) {
    const i = (yy * cw + xx) * 4, v = d[i] / 255 * 3 + (bayer[(yy % 4) * 4 + xx % 4] / 16 - 0.5);
    const q = greys[clamp(Math.round(v), 0, 3)];
    d[i] = d[i + 1] = d[i + 2] = q;
  }
  x.putImageData(id, 0, 0);
  DITHER = c; return c;
}

function cameraSilhouette(ctx, cx, cy, s, col) {
  ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = col;
  rr(ctx, -s * 0.5, -s * 0.18, s, s * 0.9, 24); ctx.fill();               // body
  ctx.beginPath(); ctx.arc(0, -s * 0.32, s * 0.26, 0, 7); ctx.fill();       // round lens head
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(0, -s * 0.32, s * 0.12, 0, 7); ctx.fill();
  ctx.restore();
}

function icon(ctx, kind, cx, cy, s, col, t = 0) {
  ctx.save(); ctx.translate(cx, cy); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * 0.07; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'rec') { ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, 7); ctx.fill(); }
  if (kind === 'save') { rr(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, s * 0.08); ctx.stroke(); ctx.fillRect(-s * 0.22, -s * 0.4, s * 0.44, s * 0.24); ctx.strokeRect(-s * 0.24, s * 0.05, s * 0.48, s * 0.3); }
  if (kind === 'folder') { ctx.beginPath(); ctx.moveTo(-s * 0.45, -s * 0.3); ctx.lineTo(-s * 0.12, -s * 0.3); ctx.lineTo(-s * 0.02, -s * 0.2); ctx.lineTo(s * 0.45, -s * 0.2); ctx.lineTo(s * 0.45, s * 0.35); ctx.lineTo(-s * 0.45, s * 0.35); ctx.closePath(); ctx.stroke(); }
  if (kind === 'clock') {
    ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.38, s * 0.12, 0, 7); ctx.arc(s * 0.3, -s * 0.38, s * 0.12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.26); ctx.moveTo(0, 0); ctx.lineTo(s * 0.18 * Math.cos(t * 6), s * 0.18 * Math.sin(t * 6)); ctx.stroke();
  }
  if (kind === 'truck') {
    ctx.strokeRect(-s * 0.48, -s * 0.25, s * 0.55, s * 0.4);
    ctx.beginPath(); ctx.moveTo(s * 0.07, -s * 0.1); ctx.lineTo(s * 0.3, -s * 0.1); ctx.lineTo(s * 0.45, s * 0.05); ctx.lineTo(s * 0.45, s * 0.15); ctx.lineTo(s * 0.07, s * 0.15); ctx.stroke();
    ctx.beginPath(); ctx.arc(-s * 0.3, s * 0.22, s * 0.08, 0, 7); ctx.arc(s * 0.28, s * 0.22, s * 0.08, 0, 7); ctx.fill();
  }
  ctx.restore();
}

// ======================= captions =======================
// Phrases of 2–4 words, broken at pauses; current word lime on an ink pill (readable on both backgrounds)
const phrases = [];
{
  let cur = [];
  words.forEach((w, i) => {
    cur.push(w);
    const next = words[i + 1];
    const gap = next ? next.start - w.end : 1;
    if (cur.length >= 3 || w.brk || gap > 0.3 || !next) { phrases.push(cur); cur = []; }
  });
}
function captions(ctx, t, dark) {
  const ph = phrases.find(p => t >= p[0].start - 0.05 && t <= p[p.length - 1].end + 0.15);
  if (!ph) return;
  font(ctx, 52, 'bold');
  const txt = ph.map(w => w.disp).join(' ');
  const tw = ctx.measureText(txt).width;
  const x0 = SAFE.x0, y = 1124, hgt = 84;
  const pin = spring(t - ph[0].start + 0.05, 16, 0.7);
  ctx.save(); ctx.globalAlpha = clamp(pin * 2);
  rr(ctx, x0, y + (1 - pin) * 14, tw + 48, hgt, 22); ctx.fillStyle = dark ? '#24242A' : C.ink; ctx.fill();
  let x = x0 + 24;
  for (const w of ph) {
    const on = t >= w.start - 0.03 && t <= w.end + 0.1;
    ctx.fillStyle = on ? C.lime : C.paper; ctx.textBaseline = 'middle';
    ctx.fillText(w.disp, x, y + hgt / 2 + 2 + (1 - pin) * 14);
    x += ctx.measureText(w.disp + ' ').width;
  }
  ctx.restore();
}

// ======================= scenes =======================
// Each scene draws hero content; headline handled by `drawScene`. lt = local time, d = duration.
const IS_INK = c => c.bg === 'ink';
const HEAD = { // per-scene headline override + accent words (numbers)
  0: { text: 'PLAYS GAME BOY CARTRIDGES' }, 8: { text: '' }, 3: { text: 'GAMES WORK', }, 6: { text: '3.5 MM · USB-C' },
  7: { text: '4 CHANNELS → 4 TRACKS', acc: ['4'] }, 10: { text: '128 × 112 PIXELS', acc: ['128', '112'] },
  13: { text: '$59 SOLD OUT', acc: ['$59'] }, 14: { text: '$89 SOLD OUT', acc: ['$89'] }, 15: { text: '$500 WOODEN · SOLD OUT', acc: ['$500'] },
  16: { text: '$15K GOAL → ~3× IN A DAY', acc: ['~3×'] }, 17: { text: 'RIGHT NOW', }, 18: { text: '' },
  19: { text: 'SHIPS APRIL 2027', acc: ['2027'] }, 22: { text: 'SPEC or WRECK?' }, 23: { text: 'THE VERDICT' }, 24: { text: 'THE VERDICT', still: true }, 25: { text: '' },
};

function heroOpening(ctx, lt, dark, { slide = 0, push = 0 } = {}) {
  // product card + a generic cartridge above it; slide 0..1 moves cartridge into "slot"
  const cy = 860;
  productCard(ctx, IMG.p_3q, 470, cy + 40, 760, { tilt: Math.sin(lt * 0.8) * 0.5, push, dark, crop: [170, 110, 640, 480] });
  // lime slot glow on top edge of card
  const glow = 0.5 + 0.5 * Math.sin(lt * 5);
  ctx.save(); ctx.shadowColor = C.lime; ctx.shadowBlur = 40 * glow;
  rr(ctx, 330, cy - 225, 280, 22, 11); ctx.fillStyle = C.lime; ctx.fill(); ctx.restore();
  const yc = lerp(600, 690, easeInOut(slide));
  ctx.save(); rr(ctx, 0, 0, W, cy - 214, 0); ctx.clip();
  cartridge(ctx, 470, yc, 230, { rot: lerp(-0.05, 0, slide) });
  ctx.restore();
}

const SCENES = [
  // 0 HOOK: cartridge slides into slot
  (ctx, lt, d) => { const s = easeInOut(prog(lt, 0.5, 1.6)); heroOpening(ctx, lt, true, { slide: s, push: lt / d }); if (Math.abs(lt - 1.6) < 1 / FPS / 2 + 1e-6) {} },
  // 1 JUST THE MUSIC: label → waveform
  (ctx, lt, d) => {
    heroOpening(ctx, lt + 3, true, { slide: 1, push: 1 });
    const p = easeOut(prog(lt, 0, 0.6));
    ctx.save(); ctx.globalAlpha = p; rr(ctx, 60, 1000, 820, 100, 30); ctx.fillStyle = C.inkSoft; ctx.fill();
    waveform(ctx, 100, 1050, 740, 70 * p, lt, C.lime, 1); ctx.restore();
  },
  // 2 RETRO SONG BIRD: push + light sweep (paper)
  (ctx, lt, d) => {
    const b = wt('push'), p = easeInOut(prog(lt, b - 0.2, b + 0.3));
    ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate(-300 * p, 0);
    productCard(ctx, IMG.p_front, 470, 830, 800, { crop: [140, 120, 400, 260], sweep: prog(lt, 0.2, 1.4), push: lt / d, tilt: Math.sin(lt) * 0.4 });
    ctx.restore();
    if (p > 0) {
      ctx.save(); ctx.globalAlpha = p; ctx.translate(300 * (1 - p), 0);
      const s = easeInOut(prog(lt, b + 0.3, b + 1.1));
      productCard(ctx, IMG.p_3q, 470, 900, 640, { crop: [170, 110, 640, 480], push: prog(lt, b, d) });
      ctx.save(); rr(ctx, 0, 0, W, 660, 0); ctx.clip(); cartridge(ctx, 470, lerp(560, 650, s), 190); ctx.restore();
      const q = easeOut(prog(lt, wt('soundtrack') - 0.1, wt('soundtrack') + 0.4));
      if (q > 0) { rr(ctx, 60, 1010, 820, 90, 28); ctx.fillStyle = C.ink; ctx.fill(); waveform(ctx, 100, 1055, 740, 60 * q, lt, C.lime); }
      ctx.restore();
    }
  },
  // 3 1,900+ counter, blank cartridges filling a wall
  (ctx, lt, d) => {
    const n = Math.floor(easeOut(prog(lt, 0.1, 1.6)) * 18);
    for (let i = 0; i < 18; i++) {
      const col = i % 6, row = Math.floor(i / 6);
      const a = i < n ? 1 : 0.12;
      cartridge(ctx, 130 + col * 128, 860 + row * 128, 96, { alpha: a, body: '#B4B4BA', label: '#DADADE' });
    }
    const v = 1900 * easeOut(prog(lt, 0.1, 1.6));
    const pin = spring(lt, 10, 0.6);
    ctx.save(); ctx.translate(0, (1 - pin) * 60);
    rr(ctx, 60, 600, 820, 180, 36); ctx.fillStyle = C.ink; ctx.fill();
    bigNumber(ctx, Math.round(v).toLocaleString('en-US') + (v >= 1899.5 ? '+' : ''), 470, 755, 170, C.lime, 'center');
    ctx.restore();
  },
  // 4 NOT A RECORDING: rec icon crossed → chip
  (ctx, lt, d) => {
    const p = prog(lt, 0.3, 0.8), q = easeOut(prog(lt, 1.0, 1.6));
    ctx.save(); ctx.globalAlpha = 1 - q; icon(ctx, 'rec', 470, 820, 300 * (1 + 0.04 * Math.sin(lt * 4)), C.ink);
    ctx.strokeStyle = C.wreck === '' ? C.ink : C.ink; ctx.lineWidth = 22; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(300, 650); ctx.lineTo(lerp(300, 640, p), lerp(650, 990, p)); ctx.stroke(); ctx.restore();
    const r = easeInOut(prog(lt, wt('reads') - 0.2, wt('reads') + 0.4));
    if (q > 0) { ctx.save(); ctx.globalAlpha = q; chip(ctx, lerp(470, 640, r), 830, 320 * lerp(0.8, 1, q) * lerp(1, 0.75, r), Math.floor(prog(lt, wt('music'), wt('effects')) * 4.99), lt, false); ctx.restore(); }
    if (r > 0) { ctx.save(); ctx.globalAlpha = r; cartridge(ctx, lerp(100, 220, r), 830, 180);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(340, 830); ctx.lineTo(lerp(340, 470, r), 830); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(lerp(340, 470, r) - 20, 810); ctx.lineTo(lerp(340, 470, r), 830); ctx.lineTo(lerp(340, 470, r) - 20, 850); ctx.stroke(); ctx.restore(); }
  },
  // 5 MUSIC + SOUND EFFECTS: two waveforms stack
  (ctx, lt, d) => {
    const a = spring(lt, 10, 0.6), b = spring(lt - 0.5, 10, 0.6);
    ctx.save(); ctx.translate(0, (1 - a) * 80); rr(ctx, 60, 620, 820, 200, 32); ctx.fillStyle = C.ink; ctx.fill();
    pulseWave(ctx, 110, 720, 720, 90, lt, C.lime, 80); ctx.restore();
    ctx.save(); ctx.translate(0, (1 - b) * 80); ctx.globalAlpha = clamp(b * 2); rr(ctx, 60, 850, 820, 200, 32); ctx.fillStyle = C.ink; ctx.fill();
    waveform(ctx, 110, 950, 720, 120, lt * 1.6, C.paper, 1, 2.2); ctx.restore();
    font(ctx, 44, 'label'); ctx.fillStyle = C.grey; ctx.fillText('MUSIC', 90, 590); ctx.globalAlpha = clamp(b * 2); ctx.fillText('SFX', 90, 1070); ctx.globalAlpha = 1;
  },
  // 6 ports callouts on back photo
  (ctx, lt, d) => {
    const crop = [130, 90, 420, 320];
    productCard(ctx, IMG.p_back, 470, 850, 640, { crop, push: lt / d, tilt: Math.sin(lt * 0.9) * 0.3 });
    // jack ~ (261,290) USB-C ~ (316,273) in source px -> card coords
    const sc = 640 / crop[2];
    const P = ([x, y]) => [470 - 320 + (x - crop[0]) * sc, 850 - crop[3] * sc / 2 + (y - crop[1]) * sc];
    [[[261, 290], '3.5 mm', 0.3, 1100], [[316, 273], 'USB-C', 0.9, 1100]].forEach(([pt, label, t0, ly], i) => {
      const p = easeOut(prog(lt, t0, t0 + 0.5)); if (!p) return;
      const [x, y] = P(pt); const lx = i ? 640 : 230;
      ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 26 * p, 0, 7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 26); ctx.lineTo(lerp(x, lx, p), lerp(y + 26, ly - 50, p)); ctx.stroke();
      font(ctx, 48, 'bold'); const tw = ctx.measureText(label).width;
      ctx.globalAlpha = p; rr(ctx, lx - tw / 2 - 22, ly - 50, tw + 44, 74, 37); ctx.fillStyle = C.ink; ctx.fill();
      ctx.fillStyle = C.lime; ctx.textBaseline = 'middle'; ctx.fillText(label, lx - tw / 2, ly - 12); ctx.globalAlpha = 1;
    });
  },
  // 7 4 channels -> 4 lanes on our own timeline (ink)
  (ctx, lt, d) => {
    chip(ctx, 190, 820, 200, 4, lt, true);
    const cols = [C.lime, C.paper, '#B8B8BE', '#6E6E76'];
    for (let i = 0; i < 4; i++) {
      const p = easeOut(prog(lt, 0.3 + i * 0.25, 1.1 + i * 0.25));
      const y = 640 + i * 120;
      ctx.strokeStyle = cols[i]; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(300, 820); ctx.bezierCurveTo(360, 820, 360, y + 40, 400, y + 40); ctx.globalAlpha = p; ctx.stroke(); ctx.globalAlpha = 1;
      rr(ctx, 410, y, 470, 80, 16); ctx.fillStyle = '#1E1E23'; ctx.fill();
      ctx.save(); rr(ctx, 410, y, 470 * p, 80, 16); ctx.clip();
      const rm = easeInOut(prog(lt, wt('remix') - 0.1, wt('remix') + 0.5)) * ((i % 2 ? 1 : -1) * 40);
      for (let k = 0; k < 9; k++) { const bx = 420 + rm + k * 52 + ((i * 17 + k * 31) % 20); const bw = 24 + ((i * 7 + k * 13) % 26); rr(ctx, bx, y + 18, bw, 44, 8); ctx.fillStyle = cols[i]; ctx.fill(); }
      ctx.restore();
    }
    const ph = (lt * 160) % 470; ctx.fillStyle = C.paper; ctx.fillRect(410 + ph, 625, 4, 490);
  },
  // 8 PLOT TWIST dark reset
  (ctx, lt, d) => {
    const p = spring(lt - 0.05, 12, 0.5);
    const zz = p * (1 + 0.08 * lt / d); ctx.save(); ctx.translate(470 + Math.sin(lt * 2.2) * 14, 830); ctx.scale(zz, zz); ctx.rotate(-0.06 + Math.sin(lt * 1.7) * 0.03);
    font(ctx, 150, 'head'); ctx.fillStyle = C.lime; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('PLOT', 0, -80); ctx.fillText('TWIST', 0, 70); ctx.restore(); ctx.textAlign = 'left';
  },
  // 9 IT'S A WEBCAM: camera silhouette clicks onto product, dithered preview
  (ctx, lt, d) => {
    productCard(ctx, IMG.p_3q, 330, 900, 460, { crop: [170, 110, 640, 480], dark: true, push: lt / d });
    const p = spring(lt - 0.1, 12, 0.55);
    cameraSilhouette(ctx, 330, lerp(560, 690, p), 150, '#B4B4BA');
    const q = easeOut(prog(lt, 0.6, 1.2));
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q; ctx.imageSmoothingEnabled = false;
      rr(ctx, 570, 640, 310, 280, 18); ctx.fillStyle = '#26262C'; ctx.fill();
      ctx.drawImage(ditherFace(), 585, 655, 280, 245);
      ctx.fillStyle = C.wreck; ctx.beginPath(); ctx.arc(600, 670, 9 * (0.6 + 0.4 * Math.sin(lt * 8)), 0, 7); ctx.fill();
      ctx.restore();
    }
  },
  // 10 stat chips 128×112 · 4 greys · ~5 fps
  (ctx, lt, d) => {
    ctx.save(); ctx.imageSmoothingEnabled = false; const z = 1 + 0.15 * easeInOut(prog(lt, wt('five') - 0.3, wt('five') + 0.6)); ctx.drawImage(ditherFace(), 60, 610, 128 * 3.2 * z, 112 * 3.2 * z); ctx.restore();
    const items = [['4 GREYS', wt('four')], ['~5 FPS', wt('five')]];
    // 4 grey swatches
    [24, 92, 168, 236].forEach((g, i) => { const p = spring(lt - wt('four') - i * 0.08, 14, 0.6); ctx.fillStyle = `rgb(${g},${g},${g})`; rr(ctx, 500 + i * 95, 600 + (1 - p) * 50, 80, 80, 14); ctx.globalAlpha = clamp(p); ctx.fill(); ctx.globalAlpha = 1; });
    items.forEach(([txt, t0], i) => {
      const p = spring(lt - t0, 14, 0.6); if (p <= 0) return;
      font(ctx, 64, 'head'); const tw = ctx.measureText(txt).width;
      ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(500, 740 + i * 130 + (1 - p) * 40);
      rr(ctx, 0, 0, tw + 50, 100, 50); ctx.fillStyle = '#24242A'; ctx.fill(); ctx.fillStyle = C.lime; ctx.textBaseline = 'middle'; ctx.fillText(txt, 25, 52); ctx.restore();
    });
    // 5 fps flicker frame counter
    const f = Math.floor(lt * 5) % 5; ctx.fillStyle = C.grey; font(ctx, 44, 'label'); ctx.fillText('frame ' + (f + 1) + '/5', 60, 1060);
  },
  // 11 BACKS UP SAVES: save → folder
  (ctx, lt, d) => {
    const p = easeInOut(prog(lt, 0.4, 1.4));
    icon(ctx, 'folder', 640, 830, 300, C.ink);
    ctx.save(); ctx.globalAlpha = 1 - prog(lt, 1.3, 1.6); icon(ctx, 'save', lerp(250, 640, p), 830 - Math.sin(p * Math.PI) * 160, lerp(240, 120, p), C.ink); ctx.restore();
    cartridge(ctx, 200, 860, 150, { alpha: 1 - p * 0.6 });
  },
  // 12 CARTRIDGE ALARM: clock wobbles, chiptune "bell" notes float up
  (ctx, lt, d) => {
    const wob = Math.sin(lt * 30) * 0.06 * (0.5 + 0.5 * Math.sin(lt * 3));
    ctx.save(); ctx.translate(470, 840); ctx.rotate(wob); icon(ctx, 'clock', 0, 0, 380, C.ink, lt); ctx.restore();
    for (let k = 0; k < 5; k++) { const ph = (lt * 0.8 + k * 0.2) % 1; ctx.globalAlpha = 1 - ph; ctx.fillStyle = C.ink;
      ctx.fillRect(700 + Math.sin(k * 2 + lt) * 40, 900 - ph * 330, 26, 26); ctx.fillRect(722 + Math.sin(k * 2 + lt) * 40, 870 - ph * 330, 6, 34); }
    ctx.globalAlpha = 1; cartridge(ctx, 200, 1000, 110, {});
  },
  // 13-15 PRICE LADDER (cards step upward, stamp SOLD OUT)
  ...[0, 1, 2].map(step => (ctx, lt, d) => ladder(ctx, step, lt)),
  // 15 goal bar overshoots to ~2.7x
  (ctx, lt, d) => {
    const p = easeOut(prog(lt, 0.15, 1.8)), v = 2.65 * p;
    font(ctx, 44, 'label'); ctx.fillStyle = C.grey; ctx.fillText('KICKSTARTER GOAL', 60, 640);
    rr(ctx, 60, 690, 820, 120, 24); ctx.fillStyle = '#24242A'; ctx.fill();
    const goalX = 60 + 820 / 2.8;
    rr(ctx, 60, 690, Math.max(40, 820 * v / 2.8), 120, 24); ctx.fillStyle = C.lime; ctx.fill();
    ctx.fillStyle = C.paper; ctx.fillRect(goalX - 3, 670, 6, 160); font(ctx, 44, 'bold'); ctx.fillText('$15K', goalX - 50, 860);
    bigNumber(ctx, p >= 0.98 ? '~3×' : (Math.max(1, v)).toFixed(1) + '×', 880, 1060, 170, C.lime, 'right');
    font(ctx, 44, 'label'); ctx.fillStyle = C.grey; ctx.fillText('in about a day', 60, 1000);
  },
  // 16 NOW $79
  (ctx, lt, d) => {
    const v = 79 * easeOut(prog(lt, 0.0, 0.9)), pin = spring(lt, 10, 0.55);
    ctx.save(); ctx.translate(470, 860); ctx.scale(lerp(0.85, 1, pin), lerp(0.85, 1, pin));
    bigNumber(ctx, '$' + Math.round(v), 0, 90, 300, C.lime, 'center'); ctx.restore();
    font(ctx, 48, 'bold'); ctx.fillStyle = C.paper; ctx.fillText('current pledge', 330, 1030);
  },
  // 17 THE CATCH: dim, wreck stamp slams, 1-frame flash
  (ctx, lt, d) => {
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, W, H);
    const p = prog(lt, 0.08, 0.32);
    stamp(ctx, 'THE CATCH', 470, 760, p, C.wreck, { px: 150, rot: -0.08 });
    if (lt >= 0.32 && lt < 0.32 + 1 / FPS) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, 0, W, H); }
    const q = easeOut(prog(lt, 0.9, 1.4));
    ctx.globalAlpha = q; font(ctx, 72, 'head'); ctx.fillStyle = C.paper; ctx.fillText("IT'S A KICKSTARTER", 60, 960 + (1 - q) * 30); ctx.globalAlpha = 1;
  },
  // 18 calendar flip NOV 2026 → APR 2027
  (ctx, lt, d) => {
    const p = easeInOut(prog(lt, 0.4, 1.4));
    const cal = (label, yr, a, sy) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(470, 840); ctx.scale(1, sy);
      rr(ctx, -260, -220, 520, 440, 36); ctx.fillStyle = C.paper; ctx.fill(); ctx.fillStyle = C.wreck; rr(ctx, -260, -220, 520, 110, 36); ctx.fill(); ctx.fillRect(-260, -150, 520, 40);
      font(ctx, 150, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 40);
      font(ctx, 60, 'bold'); ctx.fillStyle = C.paper; ctx.fillText(yr, 0, -165); ctx.restore(); ctx.textAlign = 'left'; };
    if (p < 0.5) cal('NOV', '2026', 1, 1 - p * 2); else cal('APR', '2027', 1, (p - 0.5) * 2);
  },
  // 19 PROTOTYPE ≠ FINAL: render vs dashed outline
  (ctx, lt, d) => {
    const cf = easeInOut(prog(lt, wt('crowdfunded') - 0.2, wt('crowdfunded') + 0.5));
    ctx.save(); ctx.translate(0, -40 * cf);
    productCard(ctx, IMG.p_front, 260, 830, 380, { crop: [140, 120, 400, 260], dark: true, push: lt / d });
    const p = easeOut(prog(lt, 0.3, 1.0));
    ctx.save(); ctx.globalAlpha = p; ctx.setLineDash([22, 16]); ctx.lineDashOffset = -lt * 40; ctx.strokeStyle = C.grey; ctx.lineWidth = 6;
    rr(ctx, 520, 720, 340 + 8 * Math.sin(lt * 3), 220, 30); ctx.stroke(); ctx.setLineDash([]);
    font(ctx, 120, 'head'); ctx.fillStyle = C.paper; ctx.textAlign = 'center'; ctx.fillText('?', 700, 870); ctx.textAlign = 'left';
    font(ctx, 44, 'label'); ctx.fillStyle = C.grey; ctx.fillText('prototype', 160, 1040); ctx.fillText('final', 655, 1040); ctx.restore(); ctx.restore();
  },
  // 20 LATE… OR NEVER: truck fades
  (ctx, lt, d) => {
    const x = lerp(160, 760, easeInOut(prog(lt, 0.2, 2.6)));
    ctx.save(); ctx.globalAlpha = 1 - prog(lt, 1.4, 2.6); icon(ctx, 'truck', x, 840, 300, C.paper); ctx.restore();
    ctx.strokeStyle = '#2E2E35'; ctx.lineWidth = 6; ctx.setLineDash([30, 24]); ctx.lineDashOffset = lt * 80; ctx.beginPath(); ctx.moveTo(60, 960); ctx.lineTo(880, 960); ctx.stroke(); ctx.setLineDash([]);
  },
  // 21 SPEC or WRECK? switch slides to SPEC
  (ctx, lt, d) => {
    const p = easeInOut(prog(lt, 0.7, 1.2));
    const wob = lt < 0.7 ? Math.sin(lt * 14) * 0.08 : 0;
    brandSwitch(ctx, 470, 820, 520, lerp(0.92, 0, p) + wob, p > 0.5 ? C.lime : C.paper);
    font(ctx, 64, 'head'); ctx.fillStyle = C.ink; ctx.fillText('spec', 210, 1000); ctx.fillStyle = C.grey; ctx.fillText('wreck', 590, 1000);
  },
  // 22 verdict row 1
  (ctx, lt, d) => verdict(ctx, lt, 1),
  // 23 verdict row 2
  (ctx, lt, d) => verdict(ctx, lt + 10, 2),
  // 24 LOOP back to opening (cartridge lifts back up so last frame == first frame)
  (ctx, lt, d) => { const s = 1 - easeInOut(prog(lt, 0.2, d - 0.3)); heroOpening(ctx, lt, true, { slide: s, push: 0 }); },
];

function ladder(ctx, step, lt) {
  const tiers = [['$59', 'Early Bird'], ['$89', 'Launch Bird'], ['$500', 'Wooden']];
  for (let i = 0; i <= step; i++) {
    const isNew = i === step;
    const p = isNew ? spring(lt, 11, 0.6) : 1;
    const y = 1010 - i * 150 - (isNew ? (1 - p) * -80 : 0);
    ctx.save(); ctx.globalAlpha = isNew ? clamp(p * 2) : 0.9;
    const wood = i === 2;
    rr(ctx, 60 + i * 60, y - 120, 520, 120, 24); ctx.fillStyle = wood ? '#B7854E' : C.ink; ctx.fill();
    font(ctx, 72, 'head'); ctx.fillStyle = wood ? C.ink : C.lime; ctx.textBaseline = 'middle'; ctx.fillText(tiers[i][0], 100 + i * 60, y - 58);
    ctx.restore();
    const sp = isNew ? prog(lt, 0.45, 0.65) : 1;
    stamp(ctx, 'SOLD OUT', 60 + i * 60 + 360, y - 60, sp, wood ? C.ink : C.paper, { px: 44, rot: -0.12 });
  }
}

function verdict(ctx, lt, rows) {
  brandSwitch(ctx, 210, 680, 300, 0, C.lime);
  font(ctx, 80, 'head'); ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.fillText('SPEC', 400, 686);
  const row = (i, label, text, col, t0) => {
    const p = spring(lt - t0, 11, 0.6); if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate((1 - p) * 120, 0);
    const y = 790 + i * 170;
    rr(ctx, 60, y, 820, 150, 28); ctx.fillStyle = C.ink; ctx.fill(); ctx.textBaseline = 'alphabetic';
    font(ctx, 44, 'bold'); ctx.fillStyle = col; ctx.fillText(label, 100, y + 56);
    font(ctx, 60, 'head'); ctx.fillStyle = C.paper; ctx.fillText(text, 100, y + 120);
    ctx.restore();
  };
  row(0, 'WORTH IT IF', 'you kept your carts', C.lime, 0.05);
  if (rows > 1) row(1, 'SKIP IT IF', 'you need it now', C.wreck, 10.05);
}

// ======================= compositor =======================
const HARD_CUTS = new Set([8, 18]); // emphasis only (≤ 6)
function drawScene(ctx, c, t) {
  CUR = c;
  const lt = t - c.start, dark = IS_INK(c);
  bgFill(ctx, dark ? C.ink : C.paper);
  dotGrid(ctx, dark ? '#1A1A1E' : '#EEEEF0', t);
  SCENES[c.i](ctx, lt, c.dur);
  const hd = HEAD[c.i] || {};
  const text = hd.text !== undefined ? hd.text : c.screen;
  const acc = hd.acc || (text.match(/[$~]?[\d,.]+[+×K]?/g) || []);
  if (text) headline(ctx, text, hd.still ? 9 : lt, { dark, accentWords: acc, y: 335 });
  episodeTag(ctx, dark, t);
}

function frame(ctx, t) {
  const i = cues.findIndex(c => t >= c.start && t < c.end);
  const ci = i < 0 ? cues.length - 1 : i;
  const c = cues[ci], prev = cues[ci - 1];
  const TR = 0.38, lt = t - c.start;
  if (!prev || lt >= TR || HARD_CUTS.has(ci)) { drawScene(ctx, c, t); }
  else if (IS_INK(prev) !== IS_INK(c)) {
    // switch wipe: a pill of the new background grows from the knob position
    drawScene(ctx, prev, t);
    const p = easeInOut(lt / TR);
    ctx.save();
    const r = lerp(40, 1500, p); const cx = lerp(150, 540, p), cy = 960;
    rr(ctx, cx - r, cy - r * 0.55, 2 * r, 2 * r * 0.55, r * 0.55); ctx.clip();
    drawScene(ctx, c, t); ctx.restore();
    if (p < 0.6) { ctx.beginPath(); ctx.arc(cx + r - 30, cy, 26, 0, 7); ctx.fillStyle = C.lime; ctx.fill(); }
  } else {
    // camera pan across the board: alternate horizontal / vertical
    const p = easeInOut(lt / TR), vert = ci % 2 === 0;
    ctx.save(); ctx.translate(vert ? 0 : -W * p, vert ? -H * 0.5 * p : 0); ctx.globalAlpha = 1 - p * 0.5; drawScene(ctx, prev, t); ctx.restore();
    ctx.save(); ctx.translate(vert ? 0 : W * (1 - p), vert ? H * 0.5 * (1 - p) : 0); drawScene(ctx, c, t); ctx.restore();
  }
  captions(ctx, t, IS_INK(c));
}

function buildSfx() {
  cues.forEach((c, i) => {
    if (i === 0) return;
    const prev = cues[i - 1];
    if (HARD_CUTS.has(i)) return;
    sfxAt(c.start, IS_INK(prev) !== IS_INK(c) ? 'click' : 'whoosh', 0.5);
  });
  const at = (i, dt, k, g = 1) => sfxAt(cues[i].start + dt, k, g);
  at(0, 1.55, 'cart'); at(3, 1.6, 'tick'); at(6, 0.3, 'pop'); at(6, 0.9, 'pop');
  at(8, 0.0, 'hit'); at(9, 0.25, 'cart', 0.7); at(10, 0.9, 'pop'); at(10, 1.8, 'pop');
  at(13, 0.5, 'stamp'); at(14, 0.5, 'stamp'); at(15, 0.5, 'stamp');
  at(16, 1.8, 'tick'); at(17, 0.9, 'tick'); at(17, 0.95, 'thud', 0.6);
  at(18, 0.1, 'thud'); at(22, 0.95, 'click'); at(23, 0.05, 'pop'); at(24, 0.05, 'pop');
  [5, 7, 11, 12, 19, 20].forEach(i => at(i, 0.0, 'pop', 0.4));
}

async function main() {
  await loadAssets();
  const cv = createCanvas(W, H), ctx = cv.getContext('2d');
  fs.writeFileSync(path.join(work, 'timeline.json'), JSON.stringify(cues.map(c => ({ i: c.i, anchor: c.anchor, screen: c.screen, start: +c.start.toFixed(2), end: +c.end.toFixed(2), bg: c.bg })), null, 1));
  if (stillsArg) {
    const ts = stillsArg === 'cues' ? cues.map(c => Math.min(c.end - 0.05, c.start + Math.min(1.2, c.dur * 0.6))) : stillsArg.split(',').map(Number);
    fs.mkdirSync(path.join(work, 'stills'), { recursive: true });
    for (const t of ts) { frame(ctx, t); fs.writeFileSync(path.join(work, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`), cv.toBuffer('image/png')); }
    console.log('stills', ts.length); return;
  }
  buildSfx();
  fs.writeFileSync(path.join(work, 'sfx.json'), JSON.stringify(SFX, null, 0));
  const N = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(work, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) {
    frame(ctx, f / FPS);
    if (!ff.stdin.write(cv.data())) await new Promise(r => ff.stdin.once('drain', r));
    if (f % 300 === 0) console.log(`frame ${f}/${N} ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  console.log(JSON.stringify({ frames: N, duration: DURATION, seconds: (Date.now() - t0) / 1000 }));
}
main().catch(e => { console.error(e); process.exit(1); });
