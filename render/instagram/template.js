// Spec or Wreck — reusable Instagram slide template (HTML + Playwright). Fill a JSON spec; don't write new layout code.
// Usage: NODE_PATH=$(npm root -g) node render/instagram/template.js <spec.json> <outdir>
// Output: <outdir>/slide_1.jpg … (1080×1350) + <outdir>/preview.jpg (one tiled sheet: check THIS, not each slide).
//
// spec.json:
// { "slides": [
//   {"type":"hook",    "image":"/abs/photo.jpg", "pos":"50% 25%", "big":"$1.4T", "word":"GOES PUBLIC", "logo":"/abs/logo.png", "bg":"paper"},
//   {"type":"fact",    "image":"/abs/photo.jpg", "icon":"tag", "big":"$70–78", "word":"per share", "bg":"lav"},
//   {"type":"collage", "images":["/a.jpg","/b.jpg","/c.jpg","/d.jpg"], "big":"30 STYLES", "sub":"Warby Parker × Gentle Monster", "bg":"lav"},
//   {"type":"news",    "image":"/abs/photo.jpg", "badge":"SAMSUNG · NEWS", "big":"SHIPS", "word":"DEC 10", "bg":"blush"},
//   {"type":"catch",   "icon":"question", "big":"PRICE NOT SET", "sub":"Final price can miss the range", "logo":"/abs/logo.png"},
//   {"type":"verdict", "word":"Would you buy?", "sub":"Send this to a friend who would 📤"}
// ]}
// bg: paper | lav | blush (never black). icon: tag scale camera battery cal noscreen shares question chart.
// cal takes "calText":"19". Every post needs at least one official image (press render, press-kit logo/headshot).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const C = { paper: '#FAF8F5', lav: '#ECE8FB', blush: '#FBE7E2', ink: '#151312', mari: '#FFB224', ember: '#C2410C', stone: '#8C847C', wreck: '#E5484D' };
const uri = f => `data:image/${/\.png$/i.test(f) ? 'png' : 'jpeg'};base64,` + fs.readFileSync(f).toString('base64'); // file:// is blocked in setContent
const S = `stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`;

const icon = (name, o = {}) => ({
  tag: `<svg width="240" height="156" viewBox="0 0 200 130"><path d="M50 10h136a8 8 0 0 1 8 8v94a8 8 0 0 1-8 8H50L8 65z" ${S} fill="${C.mari}"/><circle cx="46" cy="65" r="11" fill="${C.ink}"/></svg>`,
  scale: `<svg width="260" height="225" viewBox="0 0 300 260"><path d="M150 40v170M70 210h160M40 70h220" ${S} fill="none"/><path d="M40 70l-30 80h60zM260 70l-30 80h60z" ${S} fill="${C.mari}"/><circle cx="150" cy="40" r="16" ${S} fill="${C.paper}"/></svg>`,
  camera: `<svg width="260" height="195" viewBox="0 0 320 240"><rect x="14" y="50" width="292" height="176" rx="34" ${S} fill="${C.mari}"/><path d="M100 50l22-34h76l22 34" ${S} fill="${C.mari}"/><circle cx="160" cy="138" r="56" ${S} fill="${C.paper}"/><circle cx="160" cy="138" r="22" fill="${C.ink}"/></svg>`,
  battery: `<svg width="280" height="150" viewBox="0 0 340 180"><rect x="10" y="14" width="290" height="152" rx="30" ${S} fill="${C.paper}"/><rect x="306" y="62" width="24" height="56" rx="8" fill="${C.ink}"/><rect x="34" y="38" width="200" height="104" rx="14" fill="${C.mari}"/></svg>`,
  cal: `<svg width="240" height="240" viewBox="0 0 280 280"><rect x="14" y="40" width="252" height="226" rx="34" ${S} fill="${C.paper}"/><path d="M18 74a30 30 0 0 1 30-30h184a30 30 0 0 1 30 30v26H18z" fill="${C.mari}"/><path d="M14 104h252M80 14v52M200 14v52" ${S}/><text x="140" y="222" text-anchor="middle" font-family="Inter Tight" font-weight="900" font-size="104" fill="${C.ink}">${o.calText || ''}</text></svg>`,
  noscreen: `<svg width="340" height="188" viewBox="0 0 380 210"><circle cx="95" cy="110" r="72" ${S} fill="${C.paper}"/><circle cx="285" cy="110" r="72" ${S} fill="${C.paper}"/><path d="M167 104q23-18 46 0" ${S} fill="none"/><rect x="52" y="84" width="86" height="52" rx="10" fill="${C.mari}" stroke="${C.ink}" stroke-width="6"/><path d="M24 24L356 190" stroke="${C.wreck}" stroke-width="18" stroke-linecap="round"/></svg>`,
  shares: `<svg width="240" height="208" viewBox="0 0 300 260">${[0, 1, 2].map(i => `<rect x="${20 + i * 22}" y="${120 - i * 50}" width="220" height="130" rx="20" ${S} fill="${i == 2 ? C.mari : C.paper}"/>`).join('')}<circle cx="174" cy="85" r="26" ${S} fill="${C.paper}"/></svg>`,
  question: `<svg width="260" height="260" viewBox="0 0 300 300"><circle cx="150" cy="150" r="130" ${S} fill="${C.paper}"/><text x="150" y="205" text-anchor="middle" font-family="Inter Tight" font-weight="900" font-size="170" fill="${C.wreck}">?</text></svg>`,
  chart: `<svg width="260" height="200" viewBox="0 0 120 90"><path d="M8 80L40 50l22 16 48-56M84 10h26v26" stroke="${C.ember}" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
}[name] || '');

const page = (bg, body, wm = true) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800;900&family=Inter:wght@600;700&display=block" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;background:${C[bg] || C.paper};font-family:'Inter Tight',Inter,sans-serif;color:${C.ink};position:relative;overflow:hidden}
.h{font-weight:800;letter-spacing:-0.035em;line-height:.9;text-transform:uppercase}
.sub{font-family:Inter;font-weight:700;font-size:40px;color:${C.stone}}
.card{position:absolute;border-radius:44px;overflow:hidden;box-shadow:0 18px 50px rgba(21,19,18,.14)}.card img{width:100%;height:100%;object-fit:cover;display:block}
.c{position:absolute;left:0;right:0;text-align:center}.row{display:flex;justify-content:center;align-items:center;gap:50px}
.wm{position:absolute;right:56px;bottom:44px;font-weight:900;font-size:56px;letter-spacing:-0.04em;opacity:.9}
.wm span{display:inline-block;color:${C.wreck};transform:rotate(18deg) translateY(4px);transform-origin:0 100%}
</style></head><body>${body}${wm ? '<div class="wm">s <span>w</span></div>' : ''}</body></html>`;

const card = (src, x, y, w, h, pos = '50% 40%', r = 44) => `<div class="card" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${r}px"><img src="${uri(src)}" style="object-position:${pos}"></div>`;
const logoImg = (f, w, top) => f ? `<div class="c" style="top:${top}px"><img src="${uri(f)}" style="width:${w}px;max-height:110px;object-fit:contain"></div>` : '';
const brand = px => `<span style="font-weight:900;font-size:${px}px;letter-spacing:-0.04em">spec <span style="color:${C.ember}">or</span> wrec<span style="display:inline-block;transform:rotate(18deg);transform-origin:0 100%">k</span></span>`;

const T = {
  hook: s => page(s.bg, `${card(s.image, 300, 70, 480, 600, s.pos || '50% 25%')}
    <div class="c h" style="top:720px;font-size:${s.bigPx || 240}px;color:${C.ember}">${s.big}</div>
    <div class="c h" style="top:960px;font-size:110px">${s.word || ''}</div>${logoImg(s.logo, 420, 1110)}`),
  hookWide: s => page(s.bg, `<div class="c h" style="top:100px;font-size:150px">${s.word || ''}</div>
    ${card(s.image, 70, 300, 940, 680, s.pos)}<div class="c h" style="top:1030px;font-size:${s.bigPx || 200}px;color:${C.ember}">${s.big}</div>`),
  fact: s => page(s.bg, `${s.image ? card(s.image, 90, 90, 900, 580, s.pos) : ''}
    <div class="c row" style="top:${s.image ? 720 : 420}px">${icon(s.icon, s)}<div style="text-align:left">
    <div class="h" style="font-size:${s.bigPx || 190}px;color:${C.ember}">${s.big}</div><div class="h" style="font-size:76px;margin-top:12px">${s.word || ''}</div></div></div>${s.image ? '' : logoImg(s.logo, 480, 150)}`),
  collage: s => page(s.bg, `<div class="c h" style="top:80px;font-size:150px">${s.big}</div><div class="c sub" style="top:245px">${s.sub || ''}</div>
    <div style="position:absolute;left:60px;top:330px;width:960px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
    ${s.images.slice(0, 6).map(f => `<div style="height:${s.images.length > 4 ? 290 : 440}px;border-radius:30px;overflow:hidden;box-shadow:0 12px 30px rgba(21,19,18,.12)"><img src="${uri(f)}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}</div>`),
  news: s => page(s.bg, `<div style="position:absolute;left:70px;top:90px"><span style="font-family:Inter;font-weight:700;font-size:34px;background:${C.ink};color:${C.paper};padding:12px 22px;border-radius:40px">${s.badge || 'NEWS'}</span></div>
    <div class="h" style="position:absolute;left:70px;top:190px;font-size:170px">${s.big}<br><span style="color:${C.ember}">${s.word || ''}</span></div>${card(s.image, 70, 560, 940, 660, s.pos)}`),
  catch: s => page(s.bg || 'blush', `<div class="c" style="top:150px"><span class="h" style="display:inline-block;font-size:110px;color:${C.paper};background:${C.wreck};padding:22px 40px 14px;border-radius:22px;transform:rotate(-4deg)">THE CATCH</span></div>
    <div class="c row" style="top:420px">${icon(s.icon || 'question', s)}</div><div class="c h" style="top:760px;font-size:${s.bigPx || 150}px;color:${C.wreck}">${s.big}</div>
    <div class="c sub" style="top:920px">${s.sub || ''}</div>${logoImg(s.logo, 380, 1090)}`),
  verdict: s => page(s.bg, `<div class="c" style="top:380px">${brand(150)}</div><div class="c h" style="top:630px;font-size:96px">${s.word || 'Spec or wreck?'}</div>
    <div class="c sub" style="top:760px">${s.sub || 'Send this to a friend 📤'}</div>`, false),
};

(async () => {
  const [specPath, out] = process.argv.slice(2);
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const files = [];
  for (const [i, s] of spec.slides.entries()) {
    const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
    await p.setContent(T[s.type](s), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const f = path.join(out, `slide_${i + 1}.jpg`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
    files.push(f); await p.close();
  }
  // one tiled preview (token-saving: inspect this single image)
  const tiles = files.map(f => `<img src="${uri(f)}" style="width:270px;height:337px;margin:4px">`).join('');
  const p = await b.newPage({ viewport: { width: Math.min(files.length, 4) * 278, height: Math.ceil(files.length / 4) * 345 } });
  await p.setContent(`<body style="margin:0;background:#ddd;display:flex;flex-wrap:wrap">${tiles}</body>`);
  await p.screenshot({ path: path.join(out, 'preview.jpg'), type: 'jpeg', quality: 80 });
  await b.close();
  console.log(files.join('\n'));
})();
