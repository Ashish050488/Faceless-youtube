// kit component group 'ui': flat 2-D interface pieces (our own drawings, never a brand's real icon), drawn around (0,0);
// render.js places them with x, y, s. speechBubble (rounded bubble + tail; `text` inside, or `wavy` lines = natural
// speech; pops in), appTile (generic rounded app icon with a simple house glyph and a `label` under it).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, prog, rr, font } = L;
module.exports = (K) => {
const { pop, stroked } = K;

function speechBubble(ctx, lt, t0, { text = '', wavy = false, w = 520, h = 200, tail = 'left', fill = C.paper } = {}) {
  const f = pop(lt, t0); if (!f) return;
  ctx.save(); ctx.scale(f, f);
  ctx.beginPath(); rr(ctx, -w / 2, -h / 2, w, h, 48);
  const tx = tail === 'right' ? w / 2 - 110 : -w / 2 + 70;
  ctx.moveTo(tx, h / 2 - 2); ctx.lineTo(tx + (tail === 'right' ? 70 : -10), h / 2 + 70); ctx.lineTo(tx + 60, h / 2 - 2);
  ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.beginPath(); rr(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 44); ctx.fillStyle = fill; ctx.fill(); // hide the tail seam
  if (wavy) { // three lines of "speech" drawing on, the last shorter
    for (let i = 0; i < 3; i++) { const y = -h / 2 + 52 + i * 48, x0 = -w / 2 + 50, x1 = w / 2 - (i === 2 ? 180 : 50), p = easeOut(prog(lt, t0 + 0.15 + i * 0.12, t0 + 0.45 + i * 0.12));
      stroked(ctx, () => { ctx.moveTo(x0, y); for (let x = x0; x <= x1; x += 8) ctx.lineTo(x, y + 7 * Math.sin((x - x0) / 22 + i)); }, (x1 - x0) * 1.15, p, { lw: 10, col: i === 0 ? C.ember : C.stone }); }
  } else if (text) {
    let px = 84; font(ctx, px, 'head'); while (ctx.measureText(text).width > w - 70 && px > 30) { px -= 4; font(ctx, px, 'head'); }
    ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 4);
  }
  ctx.restore();
}
function appTile(ctx, lt, t0, { label = '', col = '#4C8DF6' } = {}) {
  const f = pop(lt, t0); if (!f) return;
  ctx.save(); ctx.scale(f, f);
  ctx.save(); ctx.shadowColor = 'rgba(21,19,18,0.2)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  rr(ctx, -120, -120, 240, 240, 58); ctx.fillStyle = C.paper; ctx.fill(); ctx.restore();
  rr(ctx, -120, -120, 240, 240, 58); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.stroke();
  // simple house glyph (generic, not a brand icon)
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(0, -62); ctx.lineTo(70, 0); ctx.lineTo(70, 66); ctx.lineTo(-70, 66); ctx.closePath();
  ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.strokeStyle = C.ink; ctx.stroke();
  rr(ctx, -20, 18, 40, 48, 8); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  if (label) { font(ctx, 52, 'head'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(label, 0, 200); }
  ctx.restore();
}
Object.assign(K, { speechBubble, appTile });
};
