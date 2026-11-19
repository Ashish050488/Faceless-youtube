// kit component group 'media': discs, game cases and downloads (our own flat 2-D drawings), drawn around (0,0);
// render.js places them with x, y, s. gameCase (case with a cover image; opens at openAt to an EMPTY disc hub + a
// blank code slip), disc (optical disc), dvdStack (n discs drop and stack, side view), downloadBar (track fills to `to`).
const L = require('../../lib');
const { C, clamp, lerp, easeOut, easeInOut, prog, rr } = L;
module.exports = (K, env) => {
const { pop, DRAW, stroked } = K;
const { IMG } = env;
const box = (ctx, x, y, w, h, r, fill, lw = 9) => { ctx.beginPath(); rr(ctx, x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); } };
const enter = (ctx, lt, t0) => { const f = pop(lt, t0); ctx.scale(f || 0.001, f || 0.001); return f > 0; };
const ring = (ctx, r, fill, lw = 7) => { ctx.beginPath(); ctx.arc(0, 0, r, 0, 2 * Math.PI - 1e-4); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = C.ink; ctx.stroke(); } };

function disc(ctx, lt, t0, r = 130) { // silver disc, faint sheen arc, clear hub
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  ring(ctx, r, '#DCD8E4', 8);
  ctx.save(); ctx.rotate(lt * 0.8); ctx.beginPath(); ctx.arc(0, 0, r * 0.72, -0.6, 0.5); ctx.lineWidth = r * 0.34; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 2.5, 3.4); ctx.strokeStyle = 'rgba(170,150,230,0.35)'; ctx.stroke(); ctx.restore();
  ring(ctx, r * 0.3, C.paperSoft, 6); ring(ctx, r * 0.12, C.paper, 5);
  ctx.restore();
}
function gameCase(ctx, lt, t0, openAt, cover) { // 300×380 case; cover image inset; at openAt it opens: left = blank code slip, right = empty hub
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  const W = 300, H = 380, o = easeInOut(prog(lt, openAt, openAt + 0.45));
  if (o < 0.5) { // closed, front squashes toward the spine as it starts to open
    const sx = 1 - o * 2 * 0.9; ctx.save(); ctx.translate(-W / 2, 0); ctx.scale(sx, 1);
    box(ctx, 0, -H / 2, W, H, 16, '#1E3A8A', 9);
    if (cover) { ctx.save(); ctx.beginPath(); rr(ctx, 16, -H / 2 + 34, W - 30, H - 50, 6); ctx.clip(); const cw = W - 30, ch = H - 50, k = Math.max(cw / cover.width, ch / cover.height); ctx.drawImage(cover, 16 + (cw - cover.width * k) / 2, -H / 2 + 34 + (ch - cover.height * k) / 2, cover.width * k, cover.height * k); ctx.restore(); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(4, -H / 2 + 6, 8, H - 12);
    ctx.restore();
  } else { // open: two inner halves side by side
    const a = clamp((o - 0.5) * 2), sh = lerp(-W / 2, 0, a);
    ctx.save(); ctx.translate(sh, 0);
    box(ctx, -W, -H / 2, W, H, 16, '#1E3A8A', 9); box(ctx, -W + 16, -H / 2 + 16, W - 26, H - 32, 10, C.paperSoft, 5);
    box(ctx, 0, -H / 2, W, H, 16, '#1E3A8A', 9); box(ctx, 10, -H / 2 + 16, W - 26, H - 32, 10, C.paperSoft, 5);
    // code slip (blank lines only, never a real code)
    ctx.save(); ctx.translate(-W / 2, -20); ctx.rotate(-0.06); box(ctx, -90, -120, 180, 240, 10, C.paper, 6);
    box(ctx, -66, -90, 132, 26, 6, C.ink, 0); for (let i = 0; i < 4; i++) { ctx.fillStyle = C.paperLine; ctx.fillRect(-66, -40 + i * 36, i === 3 ? 80 : 132, 14); }
    ctx.restore();
    // empty disc hub
    ctx.save(); ctx.translate(W / 2 - 3, 0); ctx.setLineDash([16, 14]); ring(ctx, 120, null, 6); ctx.setLineDash([]);
    for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(Math.cos(an) * 24, Math.sin(an) * 24); ctx.lineTo(Math.cos(an) * 42, Math.sin(an) * 42); ctx.lineWidth = 8; ctx.strokeStyle = C.stone; ctx.lineCap = 'round'; ctx.stroke(); }
    ring(ctx, 20, C.stone, 5); ctx.restore();
    ctx.restore();
  }
  ctx.restore();
}
function dvdStack(ctx, lt, t0, n = 45) { // side view: n thin discs (7 px each) drop in quickly and stack upward from y 0
  if (lt < t0) return; const shown = Math.floor(n * easeOut(prog(lt, t0, t0 + 0.9)));
  for (let i = 0; i < shown; i++) { const y = -i * 7, drop = i === shown - 1 && shown < n ? -20 : 0;
    ctx.beginPath(); ctx.ellipse(0, y + drop, 130, 16, 0, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = i % 2 ? '#DCD8E4' : '#CFC9DA'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.ink; ctx.stroke(); }
  if (shown) { const y = -(shown - 1) * 7; ctx.beginPath(); ctx.ellipse(0, y, 36, 5, 0, 0, 2 * Math.PI - 1e-4); ctx.fillStyle = C.paper; ctx.fill(); ctx.lineWidth = 3; ctx.stroke(); }
}
function downloadBar(ctx, lt, t0, fillAt, to = 1, w = 760) { // arrow badge + rounded track; fill grows to `to` (0..1) from fillAt; 10 % ticks
  ctx.save(); if (!enter(ctx, lt, t0)) { ctx.restore(); return; }
  const x0 = -w / 2 + 110, tw = w - 110, h = 64, f = to * easeInOut(prog(lt, fillAt, fillAt + 0.8));
  const b = Math.abs(Math.sin(lt * 6)) * 8;
  ctx.save(); ctx.translate(-w / 2 + 44, -b); ring(ctx, 44, C.mari, 7);
  ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, 16); ctx.moveTo(-16, 2); ctx.lineTo(0, 18); ctx.lineTo(16, 2); ctx.lineWidth = 9; ctx.strokeStyle = C.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
  box(ctx, x0, -h / 2, tw, h, h / 2, C.paperSoft, 8);
  if (f > 0.01) { ctx.save(); ctx.beginPath(); rr(ctx, x0 + 8, -h / 2 + 8, Math.max(h - 16, (tw - 16) * f), h - 16, (h - 16) / 2); ctx.fillStyle = C.mari; ctx.fill(); ctx.restore(); }
  for (let i = 0; i <= 10; i++) { const x = x0 + 8 + (tw - 16) * i / 10; ctx.beginPath(); ctx.moveTo(x, h / 2 + 10); ctx.lineTo(x, h / 2 + (i % 5 ? 22 : 34)); ctx.lineWidth = i % 5 ? 4 : 6; ctx.strokeStyle = C.ink; ctx.stroke(); }
  ctx.restore();
}
Object.assign(K, { disc, gameCase, dvdStack, downloadBar });
};
