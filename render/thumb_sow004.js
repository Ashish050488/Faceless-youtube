// Thumbnail 1280×720 for sow004: whole laptop (3/4, centred-right) on flat cool grey, "27 HOURS" left, small "990 g" tag.
//   node render/thumb_sow004.js <work_dir> <out.jpg>
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { C, rr, font } = L;
L.registerFonts(path.join(__dirname, 'fonts'));
(async () => {
  const [work, out] = process.argv.slice(2);
  const im = await L.loadImage(path.join(work, 'assets', 'cut_hero.png'));
  const W = 1280, H = 720, cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#EEF0F4'; ctx.fillRect(0, 0, W, H);
  const w = 760, h = w * im.height / im.width, x = W - w - 40, y = (H - h) / 2 + 30;
  ctx.save(); ctx.filter = 'blur(20px)'; ctx.fillStyle = 'rgba(21,19,18,0.25)'; ctx.beginPath(); ctx.ellipse(x + w * 0.5, y + h - 8, w * 0.42, 20, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.drawImage(im, x, y, w, h);
  font(ctx, 230, 'head'); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = C.ember; ctx.fillText('27', 60, 330);
  font(ctx, 120, 'head'); ctx.fillStyle = C.ink; ctx.fillText('HOURS', 64, 460);
  // small 990 g tag
  ctx.save(); ctx.translate(70, 520); ctx.shadowColor = 'rgba(21,19,18,0.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; rr(ctx, 0, 0, 250, 96, 48); ctx.fillStyle = C.mari; ctx.fill(); ctx.shadowColor = 'transparent'; ctx.lineWidth = 6; ctx.strokeStyle = C.ink; rr(ctx, 0, 0, 250, 96, 48); ctx.stroke();
  font(ctx, 64, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('990 g', 125, 52); ctx.restore();
  fs.writeFileSync(out, cv.toBuffer('image/jpeg', 92)); console.log('thumbnail', out);
})();
