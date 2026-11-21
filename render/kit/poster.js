// Poster template (PRODUCTION_SPEC §9): frame 1, cover.jpg (1080×1920) and thumbnail.jpg (1280×720) are ONE poster.
//   node render/kit/poster.js <work_dir> <cues_kit.json> <out_dir>
//     → cover.jpg, thumbnail.jpg (variant A, uploaded), cover_b.jpg, thumbnail_b.jpg (variant B, logged), <work>/poster.json
// cues.thumb: { "img": "cut_hero", "thumbImg": "cut_wide" (optional, wider asset for 16:9), "bg": "blush", "tilt": -4,
//               "a": { "words": "SOLD OUT?", "num": "$1,349", "emotion": "x" },     // A = number-led
//               "b": { "words": "TOO LATE?", "num": "$1,049", "emotion": "arrow" } } // B = object/twist-led
//   emotion: x (crossMark) · q (questionStamp) · arrow (arrowPointer at the product) · tag (priceTag with the number)
//   old keys still work: { img, bg, big → num, word → words, tag → emotion "tag" }.
// render.js draws the same cover composition as layer {"type": "poster"} in scene 0, so frame 1 = cover.
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const L = require('../lib');
const { C, clamp, lerp, rr, font } = L;
const BG = { paper: C.paper, cool: '#EEF0F4', lav: '#ECE8FB', blush: '#FBE7E2', sand: '#EFE3CC', mari: C.mari, sky: '#CFE8FF', mint: '#D7F5E3' };
const SIZE = { cover: [1080, 1920], thumb: [1280, 720] };

function variant(th, v) { // normalise old + new schema
  const base = th.a || { words: th.word || '', num: th.big || '', emotion: th.tag ? 'tag' : (th.emotion || 'q') };
  return v === 'b' && th.b ? { ...base, ...th.b } : base;
}
function capOf(ctx) { const m = ctx.measureText('H'); return m.actualBoundingBoxAscent; }
// greedy word wrap at font px; returns lines or null if a single word is wider than maxW
function wrap(ctx, words, maxW) {
  const out = []; let cur = '';
  for (const w of words.split(/\s+/).filter(Boolean)) { const t = cur ? cur + ' ' + w : w;
    if (ctx.measureText(t).width <= maxW) cur = t; else { if (!cur) return null; out.push(cur); cur = w; if (ctx.measureText(w).width > maxW) return null; } }
  if (cur) out.push(cur); return out;
}
function fitWords(ctx, text, maxW, pxStart, pxMin, maxLines = 3) {
  for (let px = pxStart; px >= 40; px -= 4) { font(ctx, px, 'logo'); const lines = wrap(ctx, text, maxW); if (lines && lines.length <= maxLines) return { px, lines, cap: capOf(ctx), short: px < pxMin }; }
  font(ctx, 40, 'logo'); return { px: 40, lines: [text], cap: capOf(ctx), short: true };
}
function strokeText(ctx, t, x, y, fill, halo) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(10, ctx.measureText('H').actualBoundingBoxAscent * 0.12); ctx.strokeStyle = halo; ctx.strokeText(t, x, y); ctx.fillStyle = fill; ctx.fillText(t, x, y); }

// draw one poster; returns metrics. lt: time for gentle motion (0 for stills). Draws its own background unless bg === false.
function draw(ctx, fmt, th, v, IMG, K, { lt = 9, bg = true } = {}) {
  const [W, H] = SIZE[fmt], p = variant(th, v), im = IMG[fmt === 'thumb' && th.thumbImg ? th.thumbImg : th.img]; if (!im) throw new Error('poster: missing asset ' + (fmt === 'thumb' && th.thumbImg ? th.thumbImg : th.img));
  ctx.save();
  const bgc = BG[th.bg] || th.bg || C.paper, darkBg = bgc === C.mari, halo = bgc;
  if (bg) { ctx.fillStyle = bgc; ctx.fillRect(0, 0, W, H); }
  const M = { fmt, variant: v, W, H, words: p.words, num: p.num, emotion: p.emotion };
  const tilt = (th.tilt ?? -4) * Math.PI / 180 + 0.004 * Math.sin(lt * 1.1);
  // ---- product (whole, never cropped): cover ≥ 60 % height, thumb ≥ 55 % width (as far as the aspect allows)
  let pw, ph, cx, cy;
  if (fmt === 'cover') { const maxW = W - 2 * 54 - 90, maxH = H * 0.64; /* − room for the tilt */ ph = maxH; pw = ph * im.width / im.height; if (pw > maxW) { pw = maxW; ph = pw * im.height / im.width; } cx = W / 2; cy = H - 70 - ph / 2; }
  else { const maxW = W * 0.56, maxH = H - 60; pw = maxW; ph = pw * im.height / im.width; if (ph > maxH) { ph = maxH; pw = ph * im.width / im.height; } cx = W - 40 - pw / 2; cy = H / 2 + 10; }
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt); ctx.shadowColor = 'rgba(21,19,18,0.38)'; ctx.shadowBlur = fmt === 'cover' ? 70 : 40; ctx.shadowOffsetY = fmt === 'cover' ? 36 : 20;
  ctx.drawImage(im, -pw / 2, -ph / 2, pw, ph); ctx.restore();
  Object.assign(M, { productW: +(pw / W).toFixed(3), productH: +(ph / H).toFixed(3) });
  // ---- words (huge, ink; halo in the background colour so they read over the product)
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = fmt === 'cover' ? 'center' : 'left';
  const ink = darkBg ? C.ink : C.ink;
  let y;
  if (fmt === 'cover') {
    const f = fitWords(ctx, p.words.toUpperCase(), W - 2 * 54, 340, 318); font(ctx, f.px, 'logo'); const lh = f.cap * 1.18; y = 186 + f.cap;
    for (const line of f.lines) { strokeText(ctx, line, W / 2, y, ink, halo); y += lh; }
    M.wordsCap = Math.round(f.cap); y += 10 - lh + f.cap * 0.25;
  } else {
    const colW = W - pw - 40 - 54 - 10, f = fitWords(ctx, p.words.toUpperCase(), Math.max(colW, 720), 190, 152, 2); font(ctx, f.px, 'logo'); const lh = f.cap * 1.2; y = 52 + f.cap;
    for (const line of f.lines) { strokeText(ctx, line, 54, y, ink, halo); y += lh; }
    M.wordsCap = Math.round(f.cap); y += f.cap * 0.1 - lh + f.cap * 0.35;
  }
  // ---- number: accent block (ember, white text) — the biggest thing after the product
  if (p.num && p.emotion !== 'tag') {
    let px = fmt === 'cover' ? 200 : 170; font(ctx, px, 'logo'); while (ctx.measureText(p.num).width + 0.64 * px > (fmt === 'cover' ? W - 2 * 54 - 20 : W * 0.62) && px > 80) { px -= 4; font(ctx, px, 'logo'); } const tw = ctx.measureText(p.num).width, cap = capOf(ctx), padX = px * 0.32, bh = cap * 1.55;
    const bx = fmt === 'cover' ? W / 2 - tw / 2 - padX : 54, by = y + 6;
    ctx.save(); ctx.translate(bx + (tw + 2 * padX) / 2, by + bh / 2); ctx.rotate(fmt === 'cover' ? -0.035 : -0.03); ctx.shadowColor = 'rgba(21,19,18,0.3)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    rr(ctx, -(tw + 2 * padX) / 2, -bh / 2, tw + 2 * padX, bh, 26); ctx.fillStyle = C.ember; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(p.num, 0, cap / 2); ctx.restore();
    M.numCap = Math.round(cap);
  }
  // ---- ONE emotion object
  const ex = Math.min(W - 54 - (fmt === 'cover' ? 150 : 95), cx + pw * (fmt === 'cover' ? 0.36 : 0.30)), ey = cy + ph * (fmt === 'cover' ? 0.18 : 0.02), es = fmt === 'cover' ? 1.0 : 0.62;
  ctx.save(); ctx.translate(ex, ey); ctx.scale(es, es);
  if (p.emotion === 'x') K.crossMark(ctx, lt, 0);
  else if (p.emotion === 'arrow') K.arrowPointer(ctx, lt, 0, Math.PI * 1.22) // from the lower right, pointing back at the product;
  else if (p.emotion === 'tag') { ctx.scale(1.25, 1.25); K.priceTag(ctx, 0, -160, lt, -9, p.num || '?'); font(ctx, 110, 'head'); M.numCap = Math.round(capOf(ctx) * es * 1.25); }
  else K.questionStamp(ctx, lt, 0);
  ctx.restore();
  // our tiny mark
  if (bg && IMG.wm_light) { const h = fmt === 'cover' ? 54 : 40, w = h * IMG.wm_light.width / IMG.wm_light.height; ctx.globalAlpha = 0.9; ctx.drawImage(IMG.wm_light, W - 54 - w, fmt === 'cover' ? 120 - h : 24, w, h); ctx.globalAlpha = 1; }
  ctx.restore(); return M;
}
module.exports = { draw, variant, SIZE };

if (require.main === module) (async () => {
  const [work, cuesPath, outDir] = process.argv.slice(2);
  L.registerFonts(path.join(__dirname, '..', 'fonts'));
  const th = JSON.parse(fs.readFileSync(cuesPath)).thumb; if (!th) throw new Error('cues.kit.json has no "thumb"');
  const IMG = {}; for (const n of [th.img, th.thumbImg].filter(Boolean)) IMG[n] = await L.loadImage(path.join(work, 'assets', n + '.png'));
  try { IMG.wm_light = await L.loadImage(path.join(work, 'wm_light.png')); } catch (e) {}
  const K = require('./core')({ FPS: 30, IMG, MAP: null });
  const metrics = [];
  for (const v of th.b ? ['a', 'b'] : ['a']) for (const fmt of ['cover', 'thumb']) {
    const [W, H] = SIZE[fmt], cv = createCanvas(W, H), ctx = cv.getContext('2d');
    metrics.push(draw(ctx, fmt, th, v, IMG, K, { lt: 9 }));
    const name = (fmt === 'cover' ? 'cover' : 'thumbnail') + (v === 'b' ? '_b' : '') + '.jpg';
    fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(path.join(outDir, name), cv.toBuffer('image/jpeg', 92));
  }
  fs.writeFileSync(path.join(work, 'poster.json'), JSON.stringify(metrics, null, 1));
  console.log('poster', metrics.map(m => `${m.variant}/${m.fmt}: words cap ${m.wordsCap}px, num cap ${m.numCap ?? '-'}px, product ${Math.round(100 * (m.fmt === 'cover' ? m.productH : m.productW))}%`).join(' · '));
})().catch(e => { console.error(e.message || e); process.exit(1); });
