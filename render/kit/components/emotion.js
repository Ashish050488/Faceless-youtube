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

// fingerTap: an index finger comes down and taps; ripple rings spread from the fingertip (touch screens). Tip at (0,0).
function fingerTap(ctx, lt, t0, { tapAt = null } = {}) {
  if (lt < t0) return; const ta = tapAt ?? t0 + 0.3, p = easeOut(prog(lt, t0, ta)), press = lt >= ta ? Math.max(0, 1 - (lt - ta) / 0.18) : 0;
  ctx.save(); ctx.globalAlpha = clamp((lt - t0) / 0.12);
  for (let k = 0; k < 3; k++) { const q = ((lt - ta) * 0.9 - k * 0.3); if (lt < ta || q < 0) continue; const ph = q % 1.2; if (ph > 1) continue;
    ctx.save(); ctx.globalAlpha *= 1 - ph; ctx.lineWidth = 10; ctx.strokeStyle = C.mari; ctx.beginPath(); ctx.ellipse(0, 0, 40 + ph * 150, (40 + ph * 150) * 0.42, 0, 0, 2 * Math.PI - 1e-4); ctx.stroke(); ctx.restore(); }
  ctx.translate(lerp(60, 0, p), lerp(-140, 0, p) + press * 10); ctx.rotate(-0.42);
  ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = C.ink;
  ctx.beginPath(); ctx.moveTo(-36, 6); ctx.lineTo(-36, 240); ctx.quadraticCurveTo(-36, 300, 40, 320); ctx.lineTo(150, 320); ctx.quadraticCurveTo(190, 320, 190, 260); ctx.lineTo(190, 170);
  ctx.quadraticCurveTo(190, 140, 160, 140); ctx.quadraticCurveTo(130, 140, 130, 165); ctx.quadraticCurveTo(130, 120, 95, 120); ctx.quadraticCurveTo(62, 120, 62, 150); ctx.quadraticCurveTo(62, 110, 30, 110);
  ctx.quadraticCurveTo(36, 110, 36, 130); ctx.lineTo(36, 6); ctx.arc(0, 6, 36, 0, Math.PI, true); ctx.closePath(); ctx.fillStyle = '#FFD9B8'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 18, 20, 26, 0, Math.PI, 2 * Math.PI); ctx.lineTo(20, 40); ctx.lineTo(-20, 40); ctx.closePath(); ctx.fillStyle = '#FFF1E4'; ctx.fill(); ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
}

Object.assign(K, { crossMark, questionStamp, arrowPointer, fingerTap });
};
