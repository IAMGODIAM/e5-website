/* ============================================================
   bd50-farm.js — FarmBlock Pilot living-farm simulation
   Canvas 2D dusk-farm scene: sun/day-cycle glow, greenhouse
   domes, perspective crop rows with growth waves, shimmering
   water channel, sensor lights, drifting motes.
   Interactions: zone pins + pill toggles highlight zones with
   pulsing gold rings and open narrative cards (words drawn only
   from the page's frozen copy — no invented data).
   Fail-closed: no-JS or canvas failure => .farm-static, the
   poster + narrative grid carry the section. Reduced motion =>
   one static frame. Pauses offscreen / hidden tab. DPR <= 1.5.
   ============================================================ */
(function () {
'use strict';

var section = document.getElementById('farmblock');
if (!section) return;

var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

var canvas = section.querySelector('.bd50-farm-canvas');
var ctx = null;
try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
if (!ctx) { section.classList.add('farm-static'); wireCardsFallback(); return; }

/* ---------------- palette ---------------- */
var INK = '#070506', RED = '#8c1d21', REDHOT = '#d2323a',
    GOLD = '#d9a83f', GOLD2 = '#f2d47e', IVORY = '#f2ede3';

/* ---------------- zones (anchors in normalized coords) ---------------- */
var ZONES = {
  fields:      { num: '01', title: 'THE FIELDS',
                 text: 'Neighborhood growing in Liberty City and Overtown.',
                 x: 0.30, y: 0.74, layer: 'rows' },
  greenhouses: { num: '02', title: 'THE GREENHOUSES',
                 text: 'Agricultural technology, applied to neighborhood growing.',
                 x: 0.50, y: 0.47, layer: 'domes' },
  water:       { num: '03', title: 'WATER',
                 text: 'Sensors, mesh networks, and community-governed data systems.',
                 x: 0.80, y: 0.80, layer: 'water' },
  climate:     { num: '04', title: 'CLIMATE',
                 text: 'A working test of how a block can feed itself and own the infrastructure that makes it possible.',
                 x: 0.72, y: 0.28, layer: 'sky' }
};
var LAYERS = ['sky', 'domes', 'rows', 'water'];
var alpha = { sky: 1, domes: 1, rows: 1, water: 1 };
var activeZone = null;

/* ---------------- canvas sizing ---------------- */
var W = 0, H = 0, DPR = 1;
function sizeCanvas() {
  try {
    DPR = Math.min(1.5, window.devicePixelRatio || 1);
    var r = canvas.getBoundingClientRect();
    W = Math.max(2, Math.round(r.width * DPR));
    H = Math.max(2, Math.round(r.height * DPR));
    canvas.width = W; canvas.height = H;
  } catch (e) {}
}

/* ---------------- scroll camera (canvas only, never text) ---------------- */
var camX = 0;
function updateCam() {
  try {
    var r = section.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var p = (vh / 2 - r.top) / (r.height || 1);
    p = Math.max(0, Math.min(1, p));
    camX = (p - 0.5) * 0.07;
  } catch (e) {}
}
var scrollTick = false;
window.addEventListener('scroll', function () {
  if (scrollTick || reduced) return;
  scrollTick = true;
  requestAnimationFrame(function () { updateCam(); scrollTick = false; });
}, { passive: true });

/* ---------------- helpers ---------------- */
function lerp(a, b, t) { return a + (b - a) * t; }
function band(y0, y1, c0, c1) {
  var g = ctx.createLinearGradient(0, y0 * H, 0, y1 * H);
  g.addColorStop(0, c0); g.addColorStop(1, c1);
  ctx.fillStyle = g; ctx.fillRect(0, y0 * H, W, (y1 - y0) * H + 1);
}
/* deterministic pseudo-random */
function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* ---------------- scene pieces ---------------- */
var motes = [];
for (var m = 0; m < 46; m++) {
  motes.push({ x: rnd(m), y: rnd(m + 99), s: 0.6 + rnd(m + 7) * 1.8,
               v: 0.008 + rnd(m + 13) * 0.02, ph: rnd(m + 29) * 6.28 });
}
var dashes = [];
for (var d = 0; d < 26; d++) {
  dashes.push({ x: rnd(d + 200), y: 0.66 + rnd(d + 250) * 0.3,
                len: 0.02 + rnd(d + 300) * 0.05, sp: 0.02 + rnd(d + 350) * 0.05,
                ph: rnd(d + 400) * 6.28 });
}

function drawSky(t) {
  band(0, 0.46, '#040304', '#1c0908');
  band(0.30, 0.46, 'rgba(110,26,20,0)', 'rgba(140,29,33,.55)');
  /* sun */
  var sx = (0.72 - camX * 0.4) * W, sy = 0.40 * H, sr = 0.085 * W;
  var breathe = 1 + Math.sin(t * 0.7) * 0.035;
  var glow = ctx.createRadialGradient(sx, sy, sr * 0.2, sx, sy, sr * 3.4 * breathe);
  glow.addColorStop(0, 'rgba(242,120,60,.55)');
  glow.addColorStop(0.45, 'rgba(210,50,58,.28)');
  glow.addColorStop(1, 'rgba(210,50,58,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sx - sr * 3.6, sy - sr * 3.6, sr * 7.2, sr * 7.2);
  var core = ctx.createRadialGradient(sx - sr * 0.25, sy - sr * 0.3, sr * 0.1, sx, sy, sr * breathe);
  core.addColorStop(0, '#f7b95c'); core.addColorStop(0.55, '#e8492f'); core.addColorStop(1, '#8c1d21');
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(sx, sy, sr * breathe, 0, 6.2832); ctx.fill();
  /* drifting cloud bands */
  ctx.fillStyle = 'rgba(4,3,4,.5)';
  for (var i = 0; i < 4; i++) {
    var cy = (0.10 + i * 0.085) * H;
    var off = Math.sin(t * 0.05 + i * 2.1) * 0.03 * W - camX * (0.5 + i * 0.2) * W;
    ctx.beginPath();
    ctx.ellipse(W * 0.5 + off, cy, W * (0.42 - i * 0.05), H * 0.028, 0, 0, 6.2832);
    ctx.fill();
  }
}

function drawDomes(t, a) {
  ctx.save(); ctx.globalAlpha = a;
  var domes = [
    { x: 0.20, w: 0.20, h: 0.115 }, { x: 0.50, w: 0.26, h: 0.15 }, { x: 0.80, w: 0.17, h: 0.10 }
  ];
  for (var i = 0; i < domes.length; i++) {
    var dm = domes[i];
    var cx = (dm.x - camX * 0.7) * W, base = 0.56 * H;
    var dw = dm.w * W, dh = dm.h * H;
    /* warm interior glow */
    var gl = ctx.createRadialGradient(cx, base - dh * 0.4, 4, cx, base - dh * 0.4, dw * 0.75);
    var flick = 0.85 + Math.sin(t * 1.3 + i * 2.4) * 0.06;
    gl.addColorStop(0, 'rgba(242,212,126,' + (0.34 * flick).toFixed(3) + ')');
    gl.addColorStop(1, 'rgba(242,212,126,0)');
    ctx.fillStyle = gl;
    ctx.beginPath(); ctx.ellipse(cx, base - dh * 0.35, dw * 0.62, dh * 0.95, 0, 0, 6.2832); ctx.fill();
    /* glass */
    var glass = ctx.createLinearGradient(0, base - dh, 0, base);
    glass.addColorStop(0, 'rgba(242,212,126,.20)');
    glass.addColorStop(1, 'rgba(140,29,33,.30)');
    ctx.fillStyle = glass;
    ctx.beginPath(); ctx.ellipse(cx, base, dw / 2, dh, 0, Math.PI, 0); ctx.fill();
    /* ribs */
    ctx.strokeStyle = 'rgba(5,3,4,.85)'; ctx.lineWidth = Math.max(1, 1.6 * DPR);
    for (var r2 = -2; r2 <= 2; r2++) {
      ctx.beginPath();
      ctx.ellipse(cx, base, dw / 2, dh, 0, Math.PI + r2 * 0.16, -r2 * 0.16);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(217,168,63,.5)'; ctx.lineWidth = Math.max(1, 1.1 * DPR);
    ctx.beginPath(); ctx.ellipse(cx, base, dw / 2, dh, 0, Math.PI, 0); ctx.stroke();
    /* ground shadow */
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    ctx.beginPath(); ctx.ellipse(cx, base + 2, dw * 0.55, dh * 0.14, 0, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

function drawRows(t, a) {
  ctx.save(); ctx.globalAlpha = a;
  var vpX = (0.5 - camX) * W, vpY = 0.52 * H;
  ctx.lineCap = 'round';
  for (var row = -4; row <= 4; row++) {
    var spread = row / 4;
    var x0 = vpX + spread * W * 0.06, x1 = vpX + spread * W * 0.62;
    /* soil furrow */
    ctx.strokeStyle = 'rgba(20,10,8,.9)';
    ctx.lineWidth = Math.max(2, 7 * DPR * (0.35 + Math.abs(spread) * 0.4));
    ctx.beginPath(); ctx.moveTo(x0, vpY); ctx.quadraticCurveTo(lerp(x0, x1, 0.5), H * 0.72, x1, H); ctx.stroke();
    /* gold guide line */
    ctx.strokeStyle = 'rgba(217,168,63,.30)';
    ctx.lineWidth = Math.max(1, 1.2 * DPR);
    ctx.beginPath(); ctx.moveTo(x0, vpY); ctx.quadraticCurveTo(lerp(x0, x1, 0.5), H * 0.72, x1, H); ctx.stroke();
    /* seedlings with growth wave */
    for (var s = 0; s <= 9; s++) {
      var f = s / 9;
      var px = lerp(lerp(x0, x1, f), x1, 0), py;
      /* point along the quadratic */
      var mx = lerp(x0, x1, 0.5), my = H * 0.72;
      var ix = lerp(lerp(x0, mx, f), lerp(mx, x1, f), f);
      var iy = lerp(lerp(vpY, my, f), lerp(my, H, f), f);
      px = ix;
      var wave = 0.5 + 0.5 * Math.sin(t * 1.1 - f * 5.2 + row * 0.9);
      var sz = (1.6 + f * 7.5) * DPR * (0.55 + wave * 0.7);
      var gA = 0.35 + wave * 0.55;
      ctx.strokeStyle = 'rgba(154,171,74,' + gA.toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, sz * 0.42);
      ctx.beginPath(); ctx.moveTo(px, iy);
      ctx.lineTo(px + Math.sin(t * 0.8 + s) * sz * 0.28, iy - sz);
      ctx.stroke();
      if (wave > 0.86) {
        ctx.fillStyle = 'rgba(242,212,126,' + (0.5 * wave).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(px, iy - sz, Math.max(1, sz * 0.22), 0, 6.2832); ctx.fill();
      }
    }
  }
  /* sensor poles */
  for (var p = 0; p < 7; p++) {
    var fx = 0.08 + p * 0.14;
    var bx = (fx - camX * 0.9) * W, top = (0.60 + (p % 3) * 0.02) * H, bot = (0.86 + (p % 2) * 0.04) * H;
    ctx.strokeStyle = 'rgba(10,8,6,.9)'; ctx.lineWidth = Math.max(1.5, 2.4 * DPR);
    ctx.beginPath(); ctx.moveTo(bx, top); ctx.lineTo(bx, bot); ctx.stroke();
    var blink = 0.5 + 0.5 * Math.sin(t * 2.2 + p * 1.7);
    ctx.fillStyle = 'rgba(242,180,80,' + (0.35 + blink * 0.6).toFixed(3) + ')';
    ctx.shadowColor = 'rgba(242,180,80,.9)'; ctx.shadowBlur = 12 * DPR * blink;
    ctx.beginPath(); ctx.arc(bx, top, Math.max(1.5, 2.6 * DPR), 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}

function drawWater(t, a) {
  ctx.save(); ctx.globalAlpha = a;
  /* channel: diagonal band lower-right */
  var x0 = 0.60 * W, y0 = H, x1 = 1.02 * W, y1 = 0.60 * H;
  var dx = x1 - x0, dy = y1 - y0;
  var len = Math.sqrt(dx * dx + dy * dy), nx = -dy / len, ny = dx / len;
  var hw = 0.045 * W;
  ctx.beginPath();
  ctx.moveTo(x0 + nx * hw, y0 + ny * hw); ctx.lineTo(x1 + nx * hw, y1 + ny * hw);
  ctx.lineTo(x1 - nx * hw, y1 - ny * hw); ctx.lineTo(x0 - nx * hw, y0 - ny * hw);
  ctx.closePath();
  var wg = ctx.createLinearGradient(x0, y0, x1, y1);
  wg.addColorStop(0, '#0a0605'); wg.addColorStop(0.55, '#160a08'); wg.addColorStop(1, '#2a0f0c');
  ctx.fillStyle = wg; ctx.fill();
  ctx.save(); ctx.clip();
  /* reflected sun streak */
  var sg = ctx.createLinearGradient(0, y1, 0, y0);
  sg.addColorStop(0, 'rgba(232,73,47,.5)'); sg.addColorStop(1, 'rgba(232,73,47,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x1 - hw * 1.4, y1, hw * 2.8, (y0 - y1));
  /* travelling shimmer dashes */
  ctx.strokeStyle = 'rgba(242,212,126,.55)'; ctx.lineCap = 'round';
  for (var i = 0; i < dashes.length; i++) {
    var dd = dashes[i];
    var f = ((dd.y - 0.60) / 0.40);
    var bx2 = lerp(x1, x0, f) + Math.sin(t * 1.4 + dd.ph) * 8 * DPR;
    var by2 = lerp(y1, y0, f);
    var wob = (dd.x + t * dd.sp * 0.14) % 1;
    var off = (wob - 0.5) * hw * 1.1;
    ctx.globalAlpha = a * (0.18 + 0.5 * Math.abs(Math.sin(t * 1.8 + dd.ph)));
    ctx.lineWidth = Math.max(1, 2 * DPR * (0.4 + f * 0.8));
    ctx.beginPath();
    ctx.moveTo(bx2 - dd.len * W * 0.5 + off, by2);
    ctx.lineTo(bx2 + dd.len * W * 0.5 + off, by2);
    ctx.stroke();
  }
  ctx.restore();
  /* banks */
  ctx.strokeStyle = 'rgba(217,168,63,.35)'; ctx.lineWidth = Math.max(1, 1.4 * DPR);
  ctx.beginPath();
  ctx.moveTo(x0 + nx * hw, y0 + ny * hw); ctx.lineTo(x1 + nx * hw, y1 + ny * hw);
  ctx.moveTo(x0 - nx * hw, y0 - ny * hw); ctx.lineTo(x1 - nx * hw, y1 - ny * hw);
  ctx.stroke();
  ctx.restore();
}

function drawMotes(t) {
  ctx.save();
  for (var i = 0; i < motes.length; i++) {
    var mt = motes[i];
    var y = (mt.y - t * mt.v * 0.06) % 1; if (y < 0) y += 1;
    var x = (mt.x + Math.sin(t * 0.35 + mt.ph) * 0.02 - camX * 0.3) % 1; if (x < 0) x += 1;
    var tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.9 + mt.ph));
    ctx.fillStyle = 'rgba(242,212,126,' + (0.5 * tw).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x * W, y * H, mt.s * DPR, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

function drawHighlight(t) {
  if (!activeZone || !ZONES[activeZone]) return;
  var z = ZONES[activeZone];
  var px = (z.x - camX) * W, py = z.y * H;
  for (var i = 0; i < 2; i++) {
    var ph = (t * 0.9 + i * 0.5) % 1;
    ctx.strokeStyle = 'rgba(242,212,126,' + (0.75 * (1 - ph)).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1.5, 2.5 * DPR);
    ctx.beginPath();
    ctx.arc(px, py, (0.035 + ph * 0.075) * W, 0, 6.2832);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(242,212,126,.95)';
  ctx.shadowColor = 'rgba(242,212,126,.9)'; ctx.shadowBlur = 16 * DPR;
  ctx.beginPath(); ctx.arc(px, py, Math.max(3, 4.5 * DPR), 0, 6.2832); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawVignette() {
  var g = ctx.createLinearGradient(0, H * 0.55, 0, H);
  g.addColorStop(0, 'rgba(4,3,4,0)'); g.addColorStop(1, 'rgba(4,3,4,.72)');
  ctx.fillStyle = g; ctx.fillRect(0, H * 0.55, W, H * 0.45);
  var g2 = ctx.createLinearGradient(0, 0, 0, H * 0.2);
  g2.addColorStop(0, 'rgba(4,3,4,.6)'); g2.addColorStop(1, 'rgba(4,3,4,0)');
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * 0.2);
}

function render(t) {
  ctx.clearRect(0, 0, W, H);
  /* ease layer alphas toward targets */
  for (var i = 0; i < LAYERS.length; i++) {
    var L = LAYERS[i];
    var target = (!activeZone || ZONES[activeZone].layer === L) ? 1 : 0.30;
    alpha[L] += (target - alpha[L]) * 0.08;
  }
  drawSky(t);
  drawDomes(t, alpha.domes);
  drawRows(t, alpha.rows);
  drawWater(t, alpha.water);
  drawMotes(t);
  drawHighlight(t);
  drawVignette();
}

/* ---------------- run loop (gated) ---------------- */
var running = false, rafId = 0, t0 = 0, inView = false;
function frame(now) {
  if (!running) return;
  if (!t0) t0 = now;
  render((now - t0) / 1000);
  rafId = requestAnimationFrame(frame);
}
function start() {
  if (running || reduced) { if (reduced) render(8); return; }
  running = true; t0 = 0;
  rafId = requestAnimationFrame(frame);
}
function stop() { running = false; try { cancelAnimationFrame(rafId); } catch (e) {} }
try {
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (inView && !document.hidden) start(); else stop();
    }, { threshold: 0.05 }).observe(section);
  } else { start(); }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else if (inView) start();
  });
} catch (e) { start(); }
try { window.addEventListener('resize', function () { sizeCanvas(); if (reduced) render(8); }); } catch (e) {}
sizeCanvas(); updateCam();
if (reduced) render(8);

/* ---------------- pins, toggles, cards ---------------- */
var card = section.querySelector('.bd50-farm-card');
var stage = section.querySelector('.bd50-farm-stage');
var cardNum = card ? card.querySelector('.num') : null;
var cardTitle = card ? card.querySelector('h3') : null;
var cardText = card ? card.querySelector('p') : null;

function openCard(zone) {
  var z = ZONES[zone];
  if (!z || !card) return;
  if (cardNum) cardNum.textContent = z.num;
  if (cardTitle) cardTitle.textContent = z.title;
  if (cardText) cardText.textContent = z.text;
  card.hidden = false;
  /* keep pins + pills above the open card so re-tap toggles closed */
  if (stage) stage.classList.add('farm-card-open');
}
function closeCard() {
  if (card) card.hidden = true;
  if (stage) stage.classList.remove('farm-card-open');
}

function setActive(zone, open) {
  activeZone = zone || null;
  var btns = section.querySelectorAll('[data-zone]');
  for (var i = 0; i < btns.length; i++) {
    var on = btns[i].getAttribute('data-zone') === activeZone;
    btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  if (open && activeZone) openCard(activeZone);
  else if (!activeZone) closeCard();
}

try {
  section.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-zone]') : null;
    if (b && section.contains(b)) {
      var z = b.getAttribute('data-zone');
      if (activeZone === z) { setActive(null); } else { setActive(z, true); }
      return;
    }
    if (e.target.closest && e.target.closest('.bd50-farm-card .x')) { setActive(null); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeZone) setActive(null);
  });
} catch (e) {}

/* reduced-motion / static: cards still work via pins+toggles */
function wireCardsFallback() {
  try {
    section.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-zone]') : null;
      if (b && section.contains(b)) {
        var z = b.getAttribute('data-zone');
        if (activeZone === z) { setActive(null); } else { setActive(z, true); }
        return;
      }
      if (e.target.closest && e.target.closest('.bd50-farm-card .x')) { setActive(null); }
    });
  } catch (e) {}
}

})();
