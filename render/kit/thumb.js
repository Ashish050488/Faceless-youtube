// Thumbnail 1280×720 from cues.thumb (no per-video script). Whole product right, big number + 1 word left, optional tag.
//   node render/kit/thumb.js <work_dir> <cues_kit.json> <out.jpg>
// cues.thumb: { "img": "cut_hero", "bg": "cool", "big": "27", "word": "HOURS", "tag": "990 g", "w": 760 }
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const L = require('../lib');
const { C, rr, font } = L;
L.registerFonts(path.join(__dirname, '..', 'fonts'));
const BG = { paper: C.paper, cool: '#EEF0F4', lav: '#ECE8FB', blush: '#FBE7E2', sand: '#EFE3CC' };
(async () => {
  const [work, cuesPath, out] = process.argv.slice(2);
  const th = JSON.parse(fs.readFileSync(cuesPath)).thumb;
  const im = await L.loadImage(path.join(work, 'assets', th.img + '.png'));
  const W = 1280, H = 720, cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = BG[th.bg] || th.bg || BG.cool; ctx.fillRect(0, 0, W, H);
  let w = th.w || 760, h = w * im.height / im.width; if (h > 640) { h = 640; w = h * im.width / im.height; } // whole product, never cropped
  const x = W - w - 40, y = (H - h) / 2 + 30;
  ctx.save(); ctx.filter = 'blur(20px)'; ctx.fillStyle = 'rgba(21,19,18,0.25)'; ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h - 8, w * 0.42, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.drawImage(im, x, y, w, h);
  ctx.textBaseline = 'alphabetic'; const maxW = x - 80;
  let px = 230; font(ctx, px, 'head'); while (ctx.measureText(th.big).width > maxW && px > 100) { px -= 6; font(ctx, px, 'head'); }
  ctx.fillStyle = C.ember; ctx.fillText(th.big, 60, 330);
  if (th.word) { px = 120; font(ctx, px, 'head'); while (ctx.measureText(th.word).width > maxW && px > 60) { px -= 4; font(ctx, px, 'head'); } ctx.fillStyle = C.ink; ctx.fillText(th.word, 64, 460); }
  if (th.tag) { font(ctx, 64, 'head'); const tw = ctx.measureText(th.tag).width + 90; ctx.save(); ctx.translate(70, 520); ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; rr(ctx, 0, 0, tw, 96, 48); ctx.fillStyle = C.mari; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 6; ctx.strokeStyle = C.ink; rr(ctx, 0, 0, tw, 96, 48); ctx.stroke();
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(th.tag, tw / 2, 52); ctx.restore(); }
  fs.writeFileSync(out, cv.toBuffer('image/jpeg', 92)); console.log('thumbnail', out);
})();
