// Thumbnail 1280×720 for sow002: real watch centred on flat ink, "3,000 NITS" (≤ 3 words), one accent (sun).
//   node render/thumb_sow002.js <work_dir> <out.jpg>
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const { C, rr, font } = L;
L.registerFonts(path.join(__dirname, 'fonts'));
(async () => {
  const [work, out] = process.argv.slice(2);
  const im = await L.loadImage(path.join(work, 'assets', 'cut_3q.png'));
  const W = 1280, H = 720, cv = createCanvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = '#ECE8FB'; ctx.fillRect(0, 0, W, H);                               // flat soft lavender (no black)
  // whole real watch, centred on the right half's axis; soft contact shadow
  const h = 640, w = h * im.width / im.height, x = W - w - 110, y = (H - h) / 2 + 10;
  ctx.save(); ctx.filter = 'blur(18px)'; ctx.fillStyle = 'rgba(21,19,18,0.28)'; ctx.beginPath(); ctx.ellipse(x + w / 2, y + h - 10, w * 0.38, 18, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.drawImage(im, x, y, w, h);
  // headline block left: sun + 3,000 / NITS
  const tx = 80; font(ctx, 176, 'head'); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = C.ember; ctx.fillText('3,000', tx, 400);
  font(ctx, 120, 'head'); ctx.fillStyle = C.ink; ctx.fillText('NITS', tx + 6, 535);
  const sx = tx + 75, sy = 150; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; for (const [lw, col] of [[16, C.ink], [8, C.mari]]) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * 52, sy + Math.sin(a) * 52); ctx.lineTo(sx + Math.cos(a) * 80, sy + Math.sin(a) * 80); ctx.stroke(); } }
  ctx.beginPath(); ctx.arc(sx, sy, 38, 0, Math.PI * 2); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.ink; ctx.stroke();
  fs.writeFileSync(out, cv.toBuffer('image/jpeg', 92));
  console.log('thumbnail', out);
})();
