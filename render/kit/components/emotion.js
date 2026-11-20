// kit component group 'emotion': one big "emotion object" that tells the story at a glance (PRODUCTION_SPEC §9 posters;
// also usable in scenes). Drawn around (0,0) at ~300 px; render.js / poster.js place them with x, y, s.
// crossMark (thick red ✕ with ink outline, slams in), questionStamp (round "?" stamp, slams + tilts),
// arrowPointer (fat curved arrow; `angle` = direction it points, radians).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, prog, font } = L;
module.exports = (K) => {
const slam = (lt, t0) => lt < t0 ? 0 : lerp(1.35, 1, easeOut(prog(lt, t0, t0 + 0.18)));

function crossMark(ctx, lt, t0) {
  const s = slam(lt, t0); if (!s) return;
  ctx.save(); ctx.scale(s, s); ctx.lineCap = 'round';
  for (const [w, col] of [[86, C.ink], [62, C.wreck]]) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(-120, -120); ctx.lineTo(120, 120); ctx.moveTo(120, -120); ctx.lineTo(-120, 120); ctx.stroke(); }
  ctx.restore();
}
function questionStamp(ctx, lt, t0) {
  const s = slam(lt, t0); if (!s) return;
  ctx.save(); ctx.scale(s, s); ctx.rotate(-0.16);
  ctx.beginPath(); ctx.arc(0, 0, 150, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.mari; ctx.fill(); ctx.lineWidth = 16; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, 122, 0, 2 * Math.PI - 1e-4); ctx.lineWidth = 6; ctx.stroke();
  font(ctx, 230, 'logo'); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('?', 4, 14);
  ctx.restore();
}
function arrowPointer(ctx, lt, t0, angle = 0) {
  if (lt < t0) return; const p = easeOut(prog(lt, t0, t0 + 0.25));
  ctx.save(); ctx.rotate(angle); ctx.translate(lerp(-60, 0, p), 0); ctx.globalAlpha = clamp(p * 2);
  ctx.beginPath(); ctx.moveTo(-150, 40); ctx.quadraticCurveTo(-40, -70, 60, -10);
  ctx.lineCap = 'round'; for (const [w, col] of [[64, C.ink], [42, C.wreck]]) { ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(30, -90); ctx.lineTo(50, 60); ctx.closePath(); ctx.fillStyle = C.wreck; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.restore();
}
Object.assign(K, { crossMark, questionStamp, arrowPointer });
};
