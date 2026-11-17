// Spec or Wreck render kit — data-driven Short renderer (PRODUCTION_SPEC §8). No per-video code.
//   node render/kit/render.js <work_dir> <cues_kit.json> [--stills cues|t1,t2] [--check] [--fps 30]
// work_dir: words.json (meta/align_words.py), voice_seconds.txt, assets/*, wm_light.png, wm_dark.png
// Writes: frames.mp4, sfx.json, timeline.json, events.json, counters.json; --check writes check.json (no video).
// Schema: render/kit/README.md
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const L = require('../lib');
const { C, W, H, clamp, lerp, easeOut, easeInOut, prog, rr, font } = L;
const makeKit = require('./core');
const { resolvePlan } = require('./plan');

const [work, cuesPath] = process.argv.slice(2, 4);
const args = process.argv.slice(4);
const FPS = args.includes('--fps') ? Number(args[args.indexOf('--fps') + 1]) : 30, FR = 1 / FPS;
const stillsArg = args.includes('--stills') ? args[args.indexOf('--stills') + 1] : null;
const CHECK = args.includes('--check');
L.registerFonts(path.join(__dirname, '..', 'fonts'));
const cues = JSON.parse(fs.readFileSync(cuesPath));
const words = JSON.parse(fs.readFileSync(path.join(work, 'words.json')));
// plan: cues.plan (path relative to the cues file) or <work>/plan.json; events → absolute seconds (written to cues.json)
const planPath = cues.plan ? path.resolve(path.dirname(cuesPath), cues.plan) : path.join(work, 'plan.json');
const PLAN = fs.existsSync(planPath) ? JSON.parse(fs.readFileSync(planPath)) : [];
const CUE = resolvePlan(words, PLAN);
const DURATION = Number(fs.readFileSync(path.join(work, 'voice_seconds.txt'), 'utf8'));
const BG = Object.assign({ paper: C.paper, cool: '#EEF0F4', lav: '#ECE8FB', blush: '#FBE7E2', sand: '#EFE3CC' }, cues.palette || {});
const COLS = { ink: C.ink, ember: C.ember, mari: C.mari, wreck: C.wreck, stone: C.stone, paper: C.paper };
const col = c => COLS[c] || c || C.ink;

// ---------- words / time refs ----------
const nw = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
function wIdx(token, from) { for (let i = from; i < words.length; i++) if (nw(words[i].w).startsWith(nw(token))) return i; throw new Error(`word "${token}" not found after index ${from}`); }
// at: number (s into scene) | "word" | ["word", nth, offset] | {w, n, d, end}
function tref(sc, at, dflt = 0) {
  if (at === undefined || at === null) return dflt;
  if (typeof at === 'number') return at;
  let w = at, n = 0, d = 0, end = false;
  if (Array.isArray(at)) [w, n = 0, d = 0] = at; else if (typeof at === 'object') ({ w, n = 0, d = 0, end = false } = at);
  if (typeof w === 'string' && w[0] === '@') { if (!(w.slice(1) in CUE)) throw new Error('unknown cue ' + w); return CUE[w.slice(1)] - sc.start + d; }
  let i = sc.w0; for (let k = 0; k <= n; k++) i = wIdx(w, k === 0 ? i : i + 1);
  return (end ? words[i].end : words[i].start) - sc.start + d;
}

// ---------- assets ----------
const IMG = {}; let MAP = null;
async function loadAssets() {
  const d = path.join(work, 'assets');
  for (const f of fs.readdirSync(d)) { if (/\.(png|jpg)$/.test(f)) IMG[f.replace(/\.\w+$/, '')] = await L.loadImage(path.join(d, f)); if (f.endsWith('.json') && f.startsWith('map')) MAP = JSON.parse(fs.readFileSync(path.join(d, f))); }
  IMG.wm_light = await L.loadImage(path.join(work, 'wm_light.png')); IMG.wm_dark = await L.loadImage(path.join(work, 'wm_dark.png'));
}
let K = null;

// ---------- layer renderers (component name → draw) ----------
// each gets (ctx, layer, lt, sc, R) where R holds rects of earlier product layers by id
const SFX_DEFAULT = { number: [['land', 'tick', 0.8]], stamp: [['at', 'thud', 1.0]], priceTag: [['at', 'thud', 0.5], ['at+0.15', 'swing', 0.5]], callout: [['at', 'pop', 0.4]],
  battery: [['at', 'fill', 0.3]], calipers: [['at+0.4', 'clamp', 0.7]], calipersV: [['at+0.4', 'clamp', 0.7]], map: [['pins', 'pin', 0.5]], hourglass: [['flipAt', 'flip', 0.7]],
  wordmark: [['snapAt', 'click', 1.0]], loupe: [['at', 'whoosh', 0.3]], dialScale: [['at', 'tick', 0.5]], scale: [['levelAt', 'clunk', 0.6]], sun: [['at', 'shimmer', 0.35]],
  toggle: [['flipAt', 'switch', 0.7]], ecg: [['at', 'beep', 0.4]], waterDrop: [['at+0.35', 'drip', 0.7]], calendar: [['at', 'flip', 0.6]], bars: [['bars', 'blip', 0.45]], clock: [['at', 'tick', 0.5]],
  playIcon: [['at', 'pop', 0.4]], motionLines: [['at', 'swish', 0.5]], slider: [['at', 'down', 0.5]], headline: [], label: [], product: [] };
const DRAWERS = {
  product(ctx, l, lt, sc, R) {
    const im = IMG[l.img]; if (!im) throw new Error('missing asset ' + l.img);
    const t = l.move ? easeInOut(prog(lt, tref(sc, l.move.at), tref(sc, l.move.at) + (l.move.dur || 0.4))) : 0;
    const x = l.move ? lerp(l.x, l.move.x ?? l.x, t) : l.x, y = l.move ? lerp(l.y, l.move.y ?? l.y, t) : l.y, w = l.move ? lerp(l.w, l.move.w ?? l.w, t) : l.w;
    const dim = l.dim ? (l.dim.to ?? 0.5) * easeInOut(prog(lt, tref(sc, l.dim.at), tref(sc, l.dim.at) + 0.4)) : 0;
    const alpha = l.fade ? 1 - (1 - (l.fade.to ?? 0.4)) * clamp((lt - tref(sc, l.fade.at, 0)) / (2 * FR)) : (l.alpha ?? 1);
    const r = K.product(ctx, im, x, y, w, { lt: lt + (l.ltOffset || 0), t0: 0, seed: l.seed ?? 0.5, push: l.push ? lt / sc.dur : 0, dim, alpha, shadow: l.shadow !== false });
    if (l.id) R[l.id] = r; return r;
  },
  headline(ctx, l, lt, sc) {
    if (l.until !== undefined && lt >= tref(sc, l.until)) return;
    K.headline(ctx, l.text, lt, false, { t0: tref(sc, l.at, 0.05), y: l.y ?? 300, col: l.col ? col(l.col) : null, acc: l.acc || [], strike: l.strike !== undefined ? tref(sc, l.strike) : -1 });
  },
  label(ctx, l, lt, sc) { const t0 = tref(sc, l.at, 0); if (lt < t0) return; K.label(ctx, l.text, l.x, l.y, l.px || 72, col(l.col || 'ember'), { a: easeOut(prog(lt, t0, t0 + 0.25)), align: l.align || 'center' }); },
  number(ctx, l, lt, sc) {
    if (l.until !== undefined && lt >= tref(sc, l.until)) return;
    K.counter(ctx, l.value, l.from || 0, lt, tref(sc, l.at, 0), l.x ?? 540, l.y ?? 470, l.px || 230, col(l.col || 'ember'), { prefix: l.prefix || '', unit: l.unit || '', comma: l.comma !== false, dec: l.dec || 0, dark: false });
  },
  priceTag(ctx, l, lt, sc) { K.priceTag(ctx, l.x, l.y, lt, tref(sc, l.at), l.text, { dark: false }); },
  callout(ctx, l, lt, sc, R) { const t0 = tref(sc, l.at); const [x, y] = anchorXY(l, R); K.stroked(ctx, () => ctx.arc(x, y, l.r || 70, -Math.PI / 2, Math.PI * 1.5 - 1e-4), 2 * Math.PI * (l.r || 70), prog(lt, t0, t0 + K.DRAW), { lw: 9, col: col(l.col || 'ember') }); },
  battery(ctx, l, lt, sc) { ctx.save(); ctx.translate(l.x, l.y); ctx.scale(l.scale || 1, l.scale || 1); K.battery(ctx, 0, 0, lt, l.segs ?? l.max ?? 7, l.at !== undefined ? tref(sc, l.at) : -9, false, { max: l.max || 7, drainTo: l.drainTo ?? -1, tDrain: l.drainAt !== undefined ? tref(sc, l.drainAt) : 1e9 }); ctx.restore(); },
  calipers(ctx, l, lt, sc) { K.calipers(ctx, l.xL, l.xR, l.y, lt, tref(sc, l.at, 0.05), false); if (l.label && lt > tref(sc, l.at, 0.05) + 0.5) K.label(ctx, l.label, (l.xL + l.xR) / 2, l.y - 300, 64, C.ember); },
  calipersV(ctx, l, lt, sc, R) { // vertical clamp on a product's thickness: { of: productId, u: 0..1 along width, label }
    const r = R[l.of], t0 = tref(sc, l.at, 0.05), xr = r.x0 + r.w * (l.u ?? 0.86), top = r.y0, bot = r.y0 + r.h;
    const p = prog(lt, t0, t0 + K.DRAW), c = easeOut(prog(lt, t0 + K.DRAW, t0 + K.DRAW + 0.35)), gap = lerp(90, 0, c);
    K.stroked(ctx, () => { ctx.moveTo(xr + 120, top - 160); ctx.lineTo(xr + 120, bot + 160); }, 400, p, { lw: 12, col: C.ink });
    K.stroked(ctx, () => { ctx.moveTo(xr + 120, top - 130 - gap); ctx.lineTo(xr - 40, top - 130 - gap); ctx.lineTo(xr - 40, top - gap); }, 300, p, { lw: 12, col: C.ink });
    K.stroked(ctx, () => { ctx.moveTo(xr + 120, bot + 130 + gap); ctx.lineTo(xr - 40, bot + 130 + gap); ctx.lineTo(xr - 40, bot + gap); }, 300, p, { lw: 12, col: C.ink });
    if (c >= 1 && l.label) K.label(ctx, l.label, xr - 190, top - 190, 70, C.ember);
  },
  scale(ctx, l, lt, sc) { K.scale(ctx, l.x, l.y, lt, tref(sc, l.at, 0.05), tref(sc, l.levelAt, 0.4), false); },
  dialScale(ctx, l, lt, sc, R) { const top = l.under ? R[l.under].y0 + R[l.under].h + (l.gap ?? 8) : l.top; K.dialScale(ctx, l.x ?? 540, top, l.w || 720, lt, tref(sc, l.at, 0), l.value, { kg: l.kg || 1000 }); },
  sun(ctx, l, lt, sc) { const t0 = tref(sc, l.at, 0.05); let g = l.grow ?? 1; if (l.growAt) { const ta = tref(sc, l.growAt.at); g = lt < ta ? (l.growAt.from ?? 0.3) : lerp(l.growAt.from ?? 0.3, l.growAt.to ?? 1, easeOut(prog(lt, ta, ta + 0.35))); } K.sun(ctx, l.x, l.y, l.r || 44, lt, t0, g); },
  map(ctx, l, lt, sc) { if (!MAP) throw new Error('map layer needs assets/map*.json (kit/make_map.py)'); K.worldMap(ctx, l.x ?? 540, l.y ?? 770, l.w || 900, lt, tref(sc, l.at, 0), (l.pins || []).map(p => tref(sc, p))); },
  bars(ctx, l, lt, sc) { K.bars(ctx, l.x ?? 540, l.base, lt, l.items.map(b => ({ ...b, col: col(b.col || 'mari'), t0: tref(sc, b.at, 0.1) })), l.h || 520); },
  stamp(ctx, l, lt, sc) { const t0 = tref(sc, l.at, 0.1); K.stamp(ctx, l.text, l.x ?? 540, l.y ?? 600, prog(lt, t0, t0 + 0.22), col(l.col || 'wreck'), l.px || 112); if (l.flash !== false && lt >= t0 + 0.22 && lt < t0 + 0.22 + FR) { ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(0, 0, W, H); } },
  clock(ctx, l, lt, sc) { K.clockRing(ctx, l.x, l.y, l.r || 86, lt, tref(sc, l.at, 0), l.hours); },
  hourglass(ctx, l, lt, sc) { K.hourglass(ctx, l.x, l.y, lt, tref(sc, l.at, 0.05), tref(sc, l.flipAt), false); },
  toggle(ctx, l, lt, sc) { K.toggle(ctx, l.x, l.y, lt, tref(sc, l.flipAt), false); },
  ecg(ctx, l, lt, sc) { K.ecg(ctx, l.x, l.y, lt, tref(sc, l.at, 0.05), false); },
  waterDrop(ctx, l, lt, sc) { K.waterDrop(ctx, l.x, l.y, lt, tref(sc, l.at), false); },
  waves(ctx, l, lt, sc) { if (lt > tref(sc, l.at) - 0.1) K.waves(ctx, l.x, l.y, lt, tref(sc, l.at), false); },
  pulseFlame(ctx, l, lt, sc) { K.pulseFlame(ctx, l.x, l.y, lt, tref(sc, l.at), tref(sc, l.flameAt), false); },
  zoneBar(ctx, l, lt, sc) { K.zoneBar(ctx, l.x, l.y, lt, tref(sc, l.at), false); },
  calendar(ctx, l, lt, sc) { K.calendar(ctx, l.x, l.y, lt, tref(sc, l.at), l.month, l.year); },
  slider(ctx, l, lt, sc) { K.slider(ctx, l.x ?? 540, l.y, l.w || 560, lt, tref(sc, l.at), l.from ?? 0.9, l.to ?? 0.2); },
  wordmark(ctx, l, lt, sc) { const ts = l.snapAt !== undefined ? tref(sc, l.snapAt) : 1e9; const up = lt < ts ? 1 : clamp(1 - K.spr(lt - ts, 18, 0.45), -0.15, 1); K.wordmark(ctx, l.x ?? 540, l.y ?? 640, l.px || 108, up, false, 1); },
  loupe(ctx, l, lt, sc, R) { const r = R[l.of], im = IMG[l.img]; K.loupe(ctx, im, l.u * im.width, l.v * im.height, (l.zoom || 0.12) * im.width, l.x ?? 540, l.y ?? 720, l.r || 210, lt, tref(sc, l.at)); },
  motionLines(ctx, l, lt, sc, R) { if (l.screen) K.setScreen(l.screen); K.motionLines(ctx, R[l.of], lt, tref(sc, l.at)); },
  screenDim(ctx, l, lt, sc, R) { if (l.screen) K.setScreen(l.screen); const t0 = tref(sc, l.at); K.screenDim(ctx, R[l.of], (l.to ?? 0.5) * easeInOut(prog(lt, t0, t0 + 0.5))); },
  playIcon(ctx, l, lt, sc, R) { if (l.screen) K.setScreen(l.screen); K.playIcon(ctx, R[l.of], lt, tref(sc, l.at)); },
  pill(ctx, l, lt, sc) { const t0 = tref(sc, l.at, 0); if (lt < t0) return; const e = K.spr(lt - t0, 16); ctx.save(); ctx.globalAlpha = clamp(e * 1.4); K.pill2(ctx, l.x - l.w / 2, l.y - l.h / 2, l.w, l.h, col(l.fill || 'ink')); K.label(ctx, l.text, l.x, l.y + (l.px || 64) * 0.35, l.px || 64, col(l.col || 'mari')); ctx.restore(); },
};
function anchorXY(l, R) { if (l.of) { const r = R[l.of]; return [r.x0 + r.w * l.u, r.y0 + r.h * l.v]; } return [l.x, l.y]; }

// ---------- timeline ----------
const S = cues.scenes.map((s, i) => ({ ...s, i }));
S.forEach((s, i) => {
  if (s.endcard) { s.w0 = words.length - 1; s.start = words[words.length - 1].end + 0.3; return; }
  const li = words.findIndex(w => w.line === s.line); if (li < 0) throw new Error('no words for line ' + s.line);
  s.w0 = s.from ? wIdx(s.from, li) : li; s.start = i === 0 ? 0 : words[s.w0].start - (s.from ? 0.12 : 0.15);
});
S.forEach((s, i) => { s.end = i < S.length - 1 ? S[i + 1].start : DURATION; s.dur = s.end - s.start; });
const LOOP_BACK = 0.35;
// SFX: defaults per component + explicit scene sfx
function sfxTimes(s, l, key) {
  if (key === 'land') return [tref(s, l.at, 0) + 0.33];
  if (key === 'pins') return (l.pins || []).map(p => tref(s, p));
  if (key === 'bars') return l.items.map(b => tref(s, b.at, 0.1));
  const m = key.match(/^(\w+)(?:\+([\d.]+))?$/); const base = l[m[1]] !== undefined ? tref(s, l[m[1]]) : 0; return [base + Number(m[2] || 0)];
}
const EV = [];
S.forEach((s, i) => {
  for (const l of s.layers || []) for (const [key, kind, g] of (l.sfx === false ? [] : SFX_DEFAULT[l.type] || [])) for (const t of sfxTimes(s, l, key)) if (t >= 0 && t < s.dur) EV.push({ t: +(s.start + t).toFixed(3), kind, gain: g });
  for (const e of s.sfx || []) EV.push({ t: +(s.start + tref(s, e.at)).toFixed(3), kind: e.kind, gain: e.gain ?? 0.4 });
  if (s.shake) EV.push({ t: +(s.start + tref(s, s.shake)).toFixed(3), kind: 'thud', gain: 1.0 });
  if (i) EV.push({ t: +s.start.toFixed(3), kind: s.xfade ? 'move' : 'cut', gain: 0.3 });
});
EV.push({ t: +(DURATION - LOOP_BACK).toFixed(3), kind: 'cut', gain: 0.3 });
for (const e of PLAN) if (e.sfx) EV.push({ t: CUE[e.cue], kind: e.sfx, gain: e.gain ?? 0.5 });
const COUNTERS = [];
S.forEach(s => (s.layers || []).filter(l => l.type === 'number').forEach(l => { const land = tref(s, l.at, 0) + 0.33, end = l.until !== undefined ? tref(s, l.until) : s.dur; COUNTERS.push({ name: `${l.prefix || ''}${l.value}${l.unit ? ' ' + l.unit : ''}`, land: +(s.start + land).toFixed(2), hold: +(Math.min(end, s.dur) - land).toFixed(2) }); }));

// ---------- compositor ----------
const isDarkHex = h => { const c = h.replace('#', ''); const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16); return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 90; };
function drawScene(ctx, s, t) {
  const lt = t - s.start; ctx.fillStyle = BG[s.bg] || s.bg || C.paper; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (s.shake !== undefined) { const ts = tref(s, s.shake); if (lt >= ts && lt < ts + 6 * FR) { const k = Math.round((lt - ts) / FR); ctx.translate([3, -3, 2, -2, 1, -1][k] || 0, [-2, 3, -3, 2, -1, 1][k] || 0); } }
  const R = {}; for (const l of s.layers || []) { if (l.show !== undefined && lt < tref(s, l.show)) continue; if (l.hide !== undefined && lt >= tref(s, l.hide)) continue; DRAWERS[l.type](ctx, l, lt, s, R); }
  ctx.restore();
}
function watermark(ctx, s) { if (s.endcard) return; const im = isDarkHex(BG[s.bg] || C.paper) ? IMG.wm_dark : IMG.wm_light, h = 64, w = h * im.width / im.height; ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(im, 880 - w, 1330 - h, w, h); ctx.restore(); }
function sceneAt(t) { const i = S.findIndex(s => t >= s.start && t < s.end); return S[i < 0 ? S.length - 1 : i]; }
function frame(ctx, t) {
  if (t >= DURATION - LOOP_BACK) { drawScene(ctx, S[0], 0); watermark(ctx, S[0]); return S[0]; }
  const s = sceneAt(t), prev = S[s.i - 1], lt = t - s.start;
  if (prev && s.xfade && lt < 0.2) { drawScene(ctx, prev, t); ctx.save(); ctx.globalAlpha = easeInOut(lt / 0.2); drawScene(ctx, s, t); ctx.restore(); } else drawScene(ctx, s, t);
  watermark(ctx, s); return s;
}

// ---------- checks (code before images, §8) ----------
const TEXTS = []; let RECORD = false, CUR_T = 0, CUR_S = null;
const hex2rgb = h => { const c = String(h).replace('#', ''); return c.length >= 6 ? [0, 2, 4].map(i => parseInt(c.slice(i, i + 2), 16)) : null; };
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
function instrument(ctx) {
  const orig = ctx.fillText.bind(ctx);
  ctx.fillText = (text, x, y, mw) => {
    if (RECORD && String(text).trim() && ctx.globalAlpha > 0.6) {
      const m = ctx.measureText(text), tr = ctx.getTransform(), px = parseFloat(ctx.font.match(/(\d+(?:\.\d+)?)px/)?.[1] || 40);
      let x0 = x - (ctx.textAlign === 'center' ? m.width / 2 : ctx.textAlign === 'right' ? m.width : 0), y0 = ctx.textBaseline === 'top' ? y : ctx.textBaseline === 'middle' ? y - px * 0.4 : y - px * 0.75;
      const P = (a, b) => [tr.a * a + tr.c * b + tr.e, tr.b * a + tr.d * b + tr.f];
      const [ax, ay] = P(x0, y0), [bx, by] = P(x0 + m.width, y0 + px * 0.78);
      const box = [Math.min(ax, bx), Math.min(ay, by), Math.max(ax, bx), Math.max(ay, by)];
      // background behind the text = median of 5 points inside the box, sampled before the glyphs are drawn
      let bg = null; try { const pts = [[0.1, 0.2], [0.9, 0.2], [0.5, 0.5], [0.1, 0.85], [0.9, 0.85]].map(([u, v]) => { const d = ctx.getImageData(clamp(Math.round(lerp(box[0], box[2], u)), 0, W - 1), clamp(Math.round(lerp(box[1], box[3], v)), 0, H - 1), 1, 1).data; return [d[0], d[1], d[2]]; }); pts.sort((a, b) => lum(a) - lum(b)); bg = pts[2]; } catch (e) {}
      const fg = hex2rgb(ctx.fillStyle);
      TEXTS.push({ t: +CUR_T.toFixed(2), scene: CUR_S, text: String(text), box: box.map(v => Math.round(v)), px: Math.round(px * Math.abs(tr.d || 1)), contrast: fg && bg ? +contrast(fg, bg).toFixed(2) : null });
    }
    return orig(text, x, y, mw);
  };
}

// ---------- OverlapCheck: text, products, 2-D objects and the watermark never touch ----------
// Each visible layer is drawn alone at 1/4 scale; opaque cells (alpha > 128, so soft shadows/glows don't count) are
// compared pairwise and against the watermark. Exempt: a layer and the product it is attached to (of / under), and any
// layer marked "overlap": true (deliberate, e.g. a number inside its clock ring, the CATCH stamp over a dimmed product).
const QS = 4, QW = W / QS, QH = H / QS;
const qcv = createCanvas(QW, QH), qctx = qcv.getContext('2d'), dummy = createCanvas(4, 4).getContext('2d');
function maskOf(drawFn) { qctx.setTransform(1, 0, 0, 1, 0, 0); qctx.clearRect(0, 0, QW, QH); qctx.setTransform(1 / QS, 0, 0, 1 / QS, 0, 0); drawFn(qctx); qctx.setTransform(1, 0, 0, 1, 0, 0);
  const d = qctx.getImageData(0, 0, QW, QH).data, m = new Uint8Array(QW * QH); let n = 0; for (let i = 0; i < m.length; i++) if (d[i * 4 + 3] > 128) { m[i] = 1; n++; } return n ? m : null; }
let WM_MASK = null;
function overlaps(s, t) {
  const lt = t - s.start, layers = (s.layers || []).filter(l => !(l.show !== undefined && lt < tref(s, l.show)) && !(l.hide !== undefined && lt >= tref(s, l.hide)));
  const masks = layers.map((l, k) => { const R = {}; for (let j = 0; j < k; j++) if (layers[j].type === 'product') DRAWERS.product(dummy, layers[j], lt, s, R); return maskOf(c => DRAWERS[l.type](c, l, lt, s, R)); });
  if (!s.endcard) { if (!WM_MASK) WM_MASK = maskOf(c => watermark(c, s)); layers.push({ type: 'watermark' }); masks.push(WM_MASK); }
  const out = [], name = l => l.type + (l.text ? ` "${l.text}"` : l.id ? ` #${l.id}` : l.img ? ` ${l.img}` : '');
  for (let a = 0; a < layers.length; a++) for (let b = a + 1; b < layers.length; b++) {
    const A = layers[a], B = layers[b], ma = masks[a], mb = masks[b]; if (!ma || !mb || A.overlap || B.overlap) continue;
    if ((A.id && (B.of === A.id || B.under === A.id)) || (B.id && (A.of === B.id || A.under === B.id))) continue;
    let n = 0; for (let i = 0; i < ma.length; i++) if (ma[i] && mb[i]) n++;
    if (n > 2) out.push({ t: +t.toFixed(2), scene: s.i, issue: `overlap ${name(A)} × ${name(B)}`, px: n * QS * QS });
  }
  return out;
}
async function main() {
  await loadAssets(); K = makeKit({ FPS, IMG, MAP, words, SCR: cues.screen });
  const cv = createCanvas(W, H), ctx = cv.getContext('2d'); instrument(ctx);
  fs.writeFileSync(path.join(work, 'timeline.json'), JSON.stringify(S.map(s => ({ i: s.i, line: s.line, start: +s.start.toFixed(2), end: +s.end.toFixed(2), bg: s.bg, real: !!s.real, xfade: !!s.xfade, endcard: !!s.endcard })), null, 1));
  fs.writeFileSync(path.join(work, 'cues.json'), JSON.stringify(CUE, null, 1));
  fs.writeFileSync(path.join(work, 'counters.json'), JSON.stringify(COUNTERS, null, 1));
  const cat = S.find(s => (s.layers || []).some(l => l.type === 'stamp')), ver = S.find(s => (s.layers || []).some(l => l.type === 'wordmark' && l.snapAt !== undefined && !s.endcard));
  fs.writeFileSync(path.join(work, 'events.json'), JSON.stringify({ catch: cat ? cat.start + tref(cat, cat.layers.find(l => l.type === 'stamp').at, 0.1) + 0.22 : 0, verdict: ver ? ver.start : DURATION - 15, end: DURATION }, null, 1));
  fs.writeFileSync(path.join(work, 'sfx.json'), JSON.stringify(EV.sort((a, b) => a.t - b.t)));
  if (CHECK) { // sample 4 fps: OverlapCheck + text on frame + contrast + on-screen numbers
    RECORD = true; const issues = []; let n = 0;
    for (let t = 0; t < DURATION; t += 0.25) {
      CUR_T = t; const s = sceneAt(t); CUR_S = s.i; ctx.clearRect(0, 0, W, H); frame(ctx, t); n++;
      if (!(s.xfade && t - s.start < 0.2)) issues.push(...overlaps(s, t));
    }
    const seenN = {}; for (const tx of TEXTS) seenN[tx.scene + '|' + tx.text] = (seenN[tx.scene + '|' + tx.text] || 0) + 1; // transient = mid-roll counter / entrance overshoot
    const warnings = [];
    for (const tx of TEXTS) { const [x0, y0, x1, y1] = tx.box; if (seenN[tx.scene + '|' + tx.text] < 2) continue;
      if (x0 < 20 || x1 > W - 20) issues.push({ t: tx.t, scene: tx.scene, issue: 'text off frame', text: tx.text, box: tx.box });
      if (tx.contrast !== null && tx.contrast < (tx.px >= 60 ? 3 : 4.5)) issues.push({ t: tx.t, scene: tx.scene, issue: `low contrast ${tx.contrast}`, text: tx.text }); }
    const numbers = [...new Set([...TEXTS.filter(x => seenN[x.scene + '|' + x.text] >= 3).map(x => x.text.trim()), ...COUNTERS.map(c => c.name)].filter(x => /\d/.test(x)))];
    const dedup = []; const seen = new Set(); for (const i of issues) { const k = i.scene + i.issue + (i.text || ''); if (!seen.has(k)) { seen.add(k); dedup.push(i); } }
    fs.writeFileSync(path.join(work, 'check.json'), JSON.stringify({ frames: n, issues: dedup, warnings: warnings.filter((w, i, a) => a.findIndex(v => v.scene === w.scene && v.text === w.text) === i), onscreen_numbers: numbers, counters: COUNTERS }, null, 1));
    console.log(JSON.stringify({ frames: n, issues: dedup.length, numbers: numbers.length })); return;
  }
  if (stillsArg) {
    const ts = stillsArg === 'cues' ? S.flatMap(s => [s.start + 0.02, s.start + s.dur * 0.5, s.end - 0.05]) : stillsArg.split(',').map(Number);
    fs.mkdirSync(path.join(work, 'stills'), { recursive: true });
    for (const t of ts) { frame(ctx, t); fs.writeFileSync(path.join(work, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`), cv.toBuffer('image/png')); }
    console.log('stills', ts.length); return;
  }
  const N = Math.round(DURATION * FPS);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', path.join(work, 'frames.mp4')], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < N; f++) { frame(ctx, f / FPS); if (!ff.stdin.write(cv.data())) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  console.log(JSON.stringify({ frames: N, duration: DURATION, seconds: (Date.now() - t0) / 1000 }));
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
