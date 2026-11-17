// Spec or Wreck — Instagram sample renders (HTML + Playwright). Brand: state/brand.md palette v4, logo v5, watermark.
const { chromium } = require('playwright');
const path = require('path');
const DIR = __dirname;
const fs = require('fs');
const img = n => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(DIR, n + '.jpg')).toString('base64');
const C = { paper: '#FAF8F5', lav: '#ECE8FB', blush: '#FBE7E2', ink: '#151312', mari: '#FFB224', ember: '#C2410C', stone: '#8C847C', wreck: '#E5484D' };

const base = (w, h, bg, body) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@700;800;900&family=Inter:wght@600;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{width:${w}px;height:${h}px;background:${bg};font-family:'Inter Tight',Inter,sans-serif;color:${C.ink};position:relative;overflow:hidden}
.h{font-weight:800;letter-spacing:-0.035em;line-height:.9;text-transform:uppercase}
.sub{font-family:Inter;font-weight:700;font-size:40px;color:${C.stone};letter-spacing:-0.01em}
.card{border-radius:44px;overflow:hidden;box-shadow:0 18px 50px rgba(21,19,18,.14)}
.card img{width:100%;height:100%;object-fit:cover;display:block}
.wm{position:absolute;right:56px;bottom:44px;font-weight:900;font-size:56px;letter-spacing:-0.04em;opacity:.9;line-height:1}
.wm .w{display:inline-block;color:${C.wreck};transform:rotate(18deg) translateY(4px);transform-origin:0 100%}
.center{position:absolute;left:0;right:0;text-align:center}
svg{display:block}
</style></head><body>${body}
<div class="wm">s <span class="w">w</span></div></body></html>`;

const S = `stroke="${C.ink}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`;
const icons = {
  scale: `<svg width="300" height="260" viewBox="0 0 300 260"><path d="M150 40v170M70 210h160" ${S} fill="none"/><path d="M40 70h220" ${S}/>
    <path d="M40 70l-30 80h60z" ${S} fill="${C.mari}"/><path d="M260 70l-30 80h60z" ${S} fill="${C.mari}"/><circle cx="150" cy="40" r="16" ${S} fill="${C.paper}"/></svg>`,
  camera: `<svg width="320" height="240" viewBox="0 0 320 240"><rect x="14" y="50" width="292" height="176" rx="34" ${S} fill="${C.mari}"/>
    <path d="M100 50l22-34h76l22 34" ${S} fill="${C.mari}"/><circle cx="160" cy="138" r="56" ${S} fill="${C.paper}"/><circle cx="160" cy="138" r="22" fill="${C.ink}"/></svg>`,
  battery: `<svg width="340" height="180" viewBox="0 0 340 180"><rect x="10" y="14" width="290" height="152" rx="30" ${S} fill="${C.paper}"/>
    <rect x="306" y="62" width="24" height="56" rx="8" fill="${C.ink}"/><rect x="34" y="38" width="200" height="104" rx="14" fill="${C.mari}"/></svg>`,
  cal: `<svg width="280" height="280" viewBox="0 0 280 280"><rect x="14" y="40" width="252" height="226" rx="34" ${S} fill="${C.paper}"/>
    <path d="M14 104h252" ${S}/><path d="M18 74a30 30 0 0 1 30-30h184a30 30 0 0 1 30 30v26H18z" fill="${C.mari}"/><path d="M80 14v52M200 14v52" ${S}/>
    <text x="140" y="222" text-anchor="middle" font-family="Inter Tight" font-weight="900" font-size="104" fill="${C.ink}" letter-spacing="-4">10</text></svg>`,
  noscreen: `<svg width="380" height="210" viewBox="0 0 380 210"><circle cx="95" cy="110" r="72" ${S} fill="${C.paper}"/><circle cx="285" cy="110" r="72" ${S} fill="${C.paper}"/>
    <path d="M167 104q23-18 46 0" ${S} fill="none"/><rect x="52" y="84" width="86" height="52" rx="10" fill="${C.mari}" stroke="${C.ink}" stroke-width="6"/>
    <path d="M24 24L356 190" stroke="${C.wreck}" stroke-width="18" stroke-linecap="round"/></svg>`,
  tag: `<svg width="200" height="130" viewBox="0 0 200 130"><path d="M50 10h136a8 8 0 0 1 8 8v94a8 8 0 0 1-8 8H50L8 65z" ${S} fill="${C.mari}"/><circle cx="46" cy="65" r="11" fill="${C.ink}"/></svg>`,
};

// one fact slide: product card + object + 1–3 words, label next to object
const fact = (bg, pic, icon, big, small) => base(1080, 1350, bg, `
  <div class="card" style="position:absolute;left:90px;top:90px;width:900px;height:560px"><img src="${img(pic)}"></div>
  <div class="center" style="top:700px;display:flex;justify-content:center;align-items:center;gap:56px">
    ${icons[icon]}<div style="text-align:left"><div class="h" style="font-size:190px;color:${C.ember}">${big}</div>
    <div class="h" style="font-size:72px;margin-top:14px">${small}</div></div></div>`);

const logo = (px, col = C.ink) => `<span style="font-weight:900;font-size:${px}px;letter-spacing:-0.04em;color:${col}">spec <span style="color:${C.ember}">or</span> wrec<span style="display:inline-block;transform:rotate(18deg) translateY(${px * 0.03}px);transform-origin:0 100%">k</span></span>`;

const pages = {
  // ---- 1. CAROUSEL (7 slides) ----
  'carousel_1': base(1080, 1350, C.paper, `
    <div class="center h" style="top:110px;font-size:150px">AI GLASSES</div>
    <div class="center sub" style="top:290px">Samsung × Google</div>
    <div class="card" style="position:absolute;left:70px;top:380px;width:940px;height:620px"><img src="${img('dl10')}"></div>
    <div style="position:absolute;left:330px;top:1040px;display:flex;align-items:center;gap:26px">${icons.tag}
      <div class="h" style="font-size:150px;color:${C.ember}">$395</div></div>`),
  'carousel_2': fact(C.paper, 'dl4', 'scale', '41 g', 'light'),
  'carousel_3': fact(C.lav, 'dl3', 'camera', '12 MP', 'camera'),
  'carousel_4': fact(C.paper, 'dl6', 'battery', '9 HRS', 'battery'),
  'carousel_5': fact(C.blush, 'dl9', 'cal', 'DEC', 'ships'),
  'carousel_6': base(1080, 1350, C.blush, `
    <div class="center" style="top:150px"><span class="h" style="display:inline-block;font-size:110px;color:${C.paper};background:${C.wreck};padding:22px 40px 14px;border-radius:22px;transform:rotate(-4deg)">THE CATCH</span></div>
    <div class="center" style="top:470px;display:flex;justify-content:center">${icons.noscreen}</div>
    <div class="center h" style="top:780px;font-size:170px;color:${C.wreck}">NO SCREEN</div>
    <div class="center sub" style="top:960px">Audio + camera only</div>`),
  'carousel_7': base(1080, 1350, C.paper, `
    <div class="center" style="top:430px">${logo(150)}</div>
    <div class="center h" style="top:680px;font-size:84px">Spec or wreck?</div>
    <div class="center sub" style="top:800px">Tell us in the comments 👇</div>`).replace('<div class="wm">s <span class="w">w</span></div>', ''),

  // ---- 2. COLLAGE (single image) ----
  'collage': base(1080, 1350, C.lav, `
    <div class="center h" style="top:80px;font-size:160px">30 STYLES</div>
    <div class="center sub" style="top:250px">Warby Parker × Gentle Monster</div>
    <div style="position:absolute;left:60px;top:340px;width:960px;display:grid;grid-template-columns:1fr 1fr;gap:24px">
      ${['dl10', 'dl3', 'dl7', 'dl8', 'dl9', 'dl5'].map(n => `<div class="card" style="height:286px;border-radius:30px"><img src="${img(n)}"></div>`).join('')}
    </div>`),

  // ---- 3. SINGLE NEWS POST ----
  'news': base(1080, 1350, C.blush, `
    <div style="position:absolute;left:70px;top:90px"><span style="font-family:Inter;font-weight:700;font-size:34px;background:${C.ink};color:${C.paper};padding:12px 22px;border-radius:40px">SAMSUNG · NEWS</span></div>
    <div class="h" style="position:absolute;left:70px;top:190px;font-size:170px">SHIPS<br><span style="color:${C.ember}">DEC 10</span></div>
    <div class="card" style="position:absolute;left:70px;top:560px;width:940px;height:660px"><img src="${img('dl2')}" style="object-position:50% 35%"></div>`),
};

// ---- 4. SLIDESHOW REEL frames (1080×1920, content y 270–1240, watermark below) ----
const reel = (pic, top, big, col = C.ink, bg = C.paper, pos = '50% 50%') => base(1080, 1920, bg, `
  <div class="center h" style="top:270px;font-size:${big ? 170 : 120}px;color:${col}">${top}</div>
  <div class="card" style="position:absolute;left:90px;top:520px;width:900px;height:700px"><img src="${img(pic)}" style="object-position:${pos}"></div>`)
  .replace('right:56px;bottom:44px', 'right:200px;top:1266px');
Object.assign(pages, {
  reel_1: reel('dl1', 'AI GLASSES', true, C.ink, C.paper, '50% 30%'),
  reel_2: reel('dl10', '$395', true, C.ember),
  reel_3: reel('dl3', '12 MP', true, C.ember, C.lav),
  reel_4: reel('dl7', '9 HOURS', true, C.ember),
  reel_5: reel('dl9', 'NO SCREEN', true, C.wreck, C.blush),
  reel_6: base(1080, 1920, C.paper, `<div class="center" style="top:640px">${logo(150)}</div><div class="center h" style="top:880px;font-size:90px">Spec or wreck?</div>`)
    .replace('<div class="wm">s <span class="w">w</span></div>', ''),
});

(async () => {
  const b = await chromium.launch();
  for (const [name, html] of Object.entries(pages)) {
    const reelPage = name.startsWith('reel');
    const p = await b.newPage({ viewport: { width: 1080, height: reelPage ? 1920 : 1350 } });
    await p.setContent(html, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(DIR, 'out', name + (reelPage ? '.png' : '.jpg')), quality: reelPage ? undefined : 92, type: reelPage ? 'png' : 'jpeg' });
    await p.close();
  }
  await b.close();
  console.log('done', Object.keys(pages).length);
})();
