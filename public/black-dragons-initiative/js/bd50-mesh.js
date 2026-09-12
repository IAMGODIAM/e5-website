/* ============================================================
   bd50-mesh.js — Chapter IV community-ownership mesh
   Canvas 2D gold-on-black living diagram: four node clusters
   (PARCELS ACQUIRED -> COMMUNITY LAND TRUST -> THE LAND ->
   THE BUILDINGS) with animated links — pulses travelling
   along links, gold particles flowing parcels->trust->land->
   buildings, satellite nodes meshing around each plate, the
   whole mesh subtly breathing.
   Staged sequential reveal on scroll (~600ms apart). Labels
   are HTML overlays (never opacity-animated); the canvas
   draws mesh/links/particles/glow only.
   Fail-closed: no-JS or canvas failure => the static
   engraved SVG in the markup remains. Reduced motion =>
   one static fully-active frame. Pauses offscreen /
   hidden tab. DPR <= 1.5. Independent rAF loop (does not
   share state with bd50-farm.js).
   ============================================================ */
(function () {
'use strict';

var section = document.getElementById('ch-mechanism');
if (!section) return;
var figure = section.querySelector('.bd50-mech-figure');
var stage = figure ? figure.querySelector('.bd50-mesh-stage') : null;
if (!figure || !stage) return;

var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
var hasIO = 'IntersectionObserver' in window;

var canvas = stage.querySelector('.bd50-mesh-canvas');
var ctx = null;
try { ctx = canvas.getContext('2d'); } catch (e) { ctx = null; }
if (!ctx) return; /* static SVG stays as the fallback */

/* ---------------- palette ---------------- */
var GOLD = '#d9a83f', GOLD2 = '#f2d47e', RED = '#8c1d21', REDHOT = '#d2323a';

/* ---------------- layouts ---------------- */
/* plates are HTML; JS positions them here AND measures their
   rects to anchor canvas links, glow, and satellite meshes.
   Wide: percentage grid. Stacked (narrow): pixel-flow — node
   centers are computed from measured plate heights so nothing
   can ever overlap or clip, however narrow the stage gets. */
var NODES = {
  parcels:   { x: 0.150, y: 0.200 },
  trust:     { x: 0.710, y: 0.200 },
  land:      { x: 0.470, y: 0.575 },
  buildings: { x: 0.470, y: 0.855 }
};
var NOTES_W = {
  removed: { x: 0.585, y: 0.400 },
  baseof:  { x: 0.085, y: 0.575 },
  stays:   { x: 0.085, y: 0.855 }
};
var ORDER = ['parcels', 'trust', 'land', 'buildings'];
var NOTE_KEYS = ['removed', 'baseof', 'stays'];
var LINKS = [
  { from: 'parcels', to: 'trust' },
  { from: 'trust',   to: 'land' },
  { from: 'land',     to: 'buildings' }
];
var stacked = false;

/* ---------------- sizing ---------------- */
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
function pickLayout() {
  try {
    var w = stage.clientWidth || 800;
    stacked = w < 680;
    figure.classList.toggle('mesh-wide', !stacked);
    figure.classList.toggle('mesh-stacked', stacked);
    var i, k, el;
    if (!stacked) {
      stage.style.height = '';
      for (i = 0; i < ORDER.length; i++) {
        var n = NODES[ORDER[i]];
        el = stage.querySelector('[data-node="' + ORDER[i] + '"]');
        if (el) { el.style.setProperty('--x', (n.x * 100) + '%'); el.style.setProperty('--y', (n.y * 100) + '%'); }
      }
      for (k = 0; k < NOTE_KEYS.length; k++) {
        var nn = NOTES_W[NOTE_KEYS[k]];
        var ne = stage.querySelector('[data-note="' + NOTE_KEYS[k] + '"]');
        if (ne) { ne.style.setProperty('--x', (nn.x * 100) + '%'); ne.style.setProperty('--y', (nn.y * 100) + '%'); }
      }
    } else {
      /* pixel flow: stack from measured plate heights; overlap impossible */
      var GAP = 64, MARGIN = 22, NOTE_H = 20;
      var y = MARGIN, centers = {}, hs = {};
      for (i = 0; i < ORDER.length; i++) {
        el = stage.querySelector('[data-node="' + ORDER[i] + '"]');
        if (!el) continue;
        var h = el.offsetHeight || 90;
        hs[ORDER[i]] = h;
        centers[ORDER[i]] = y + h / 2;
        y += h + GAP;
      }
      var total = y - GAP + NOTE_H + MARGIN;
      stage.style.height = Math.round(total) + 'px';
      for (i = 0; i < ORDER.length; i++) {
        el = stage.querySelector('[data-node="' + ORDER[i] + '"]');
        if (el) { el.style.setProperty('--x', '50%'); el.style.setProperty('--y', Math.round(centers[ORDER[i]]) + 'px'); }
      }
      /* notes sit in the gaps between plates (x centered) */
      var gapMid = function (a, b) { return (centers[a] + hs[a] / 2 + centers[b] - hs[b] / 2) / 2; };
      var npos = {
        removed: gapMid('trust', 'land'),
        baseof:  gapMid('land', 'buildings'),
        stays:   y - GAP + NOTE_H / 2
      };
      for (k = 0; k < NOTE_KEYS.length; k++) {
        var ne2 = stage.querySelector('[data-note="' + NOTE_KEYS[k] + '"]');
        if (ne2) { ne2.style.setProperty('--x', '50%'); ne2.style.setProperty('--y', Math.round(npos[NOTE_KEYS[k]]) + 'px'); }
      }
    }
  } catch (e) {}
  measure();
}
/* plate rects in canvas px (measured so links/glow anchor exactly) */
var rects = {};
function measure() {
  rects = {};
  try {
    var sr = stage.getBoundingClientRect();
    for (var i = 0; i < ORDER.length; i++) {
      var el = stage.querySelector('[data-node="' + ORDER[i] + '"]');
      if (!el) continue;
      var r = el.getBoundingClientRect();
      rects[ORDER[i]] = {
        cx: (r.left + r.width / 2 - sr.left) * DPR,
        cy: (r.top + r.height / 2 - sr.top) * DPR,
        w: r.width * DPR, h: r.height * DPR
      };
    }
  } catch (e) {}
}

/* ---------------- helpers ---------------- */
function rnd(i) { var x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clipPoint(r, tx, ty) {
  /* point on rect edge toward target */
  var dx = tx - r.cx, dy = ty - r.cy;
  var sx = Math.abs(dx) > 1e-6 ? (r.w / 2 + 10 * DPR) / Math.abs(dx) : 1e9;
  var sy = Math.abs(dy) > 1e-6 ? (r.h / 2 + 10 * DPR) / Math.abs(dy) : 1e9;
  var s = Math.min(sx, sy);
  return { x: r.cx + dx * s, y: r.cy + dy * s };
}

/* ---------------- staged activation ---------------- */
var nodeLevel = { parcels: 0, trust: 0, land: 0, buildings: 0 };
var linkLevel = [0, 0, 0];
var nodeTarget = { parcels: 0, trust: 0, land: 0, buildings: 0 };
var linkTarget = [0, 0, 0];
function activateAll() {
  for (var i = 0; i < ORDER.length; i++) nodeTarget[ORDER[i]] = 1;
  for (var j = 0; j < 3; j++) linkTarget[j] = 1;
  if (reduced) {
    for (var i2 = 0; i2 < ORDER.length; i2++) nodeLevel[ORDER[i2]] = 1;
    for (var j2 = 0; j2 < 3; j2++) linkLevel[j2] = 1;
  }
}
function scheduleReveal() {
  if (reduced || !hasIO) { activateAll(); return; }
  for (var i = 0; i < ORDER.length; i++) {
    (function (idx) {
      setTimeout(function () {
        nodeTarget[ORDER[idx]] = 1;
        if (idx > 0) linkTarget[idx - 1] = 1;
      }, idx * 600);
    })(i);
  }
}

/* ---------------- scene pieces ---------------- */
var motes = [];
for (var m = 0; m < 34; m++) {
  motes.push({ x: rnd(m + 500), y: rnd(m + 599), s: 0.6 + rnd(m + 607) * 1.6,
               v: 0.006 + rnd(m + 613) * 0.016, ph: rnd(m + 629) * 6.28 });
}
var satellites = {};
for (var sni = 0; sni < ORDER.length; sni++) {
  var arr = [];
  for (var sn = 0; sn < 7; sn++) {
    arr.push({ a: (sn / 7) * 6.2832 + rnd(sni * 40 + sn) * 0.8,
               sp: (0.22 + rnd(sni * 40 + sn + 9) * 0.30) * (sn % 2 ? 1 : -1),
               wob: rnd(sni * 40 + sn + 17) * 6.28, r: 0.9 + rnd(sni * 40 + sn + 23) * 1.4 });
  }
  satellites[ORDER[sni]] = arr;
}
var particles = [];
for (var li = 0; li < 3; li++) {
  var ps = [];
  for (var pn = 0; pn < 12; pn++) {
    ps.push({ t: rnd(li * 60 + pn), sp: 0.16 + rnd(li * 60 + pn + 7) * 0.16,
              s: 1.4 + rnd(li * 60 + pn + 13) * 1.6 });
  }
  particles.push(ps);
}
var pulses = [];
for (var qi = 0; qi < 3; qi++) pulses.push([{ t: 0.15, sp: 0.34 }, { t: 0.62, sp: 0.27 }]);

function linkPath(l) {
  var a = rects[l.from], b = rects[l.to];
  if (!a || !b) return null;
  var p0 = clipPoint(a, b.cx, b.cy), p1 = clipPoint(b, a.cx, a.cy);
  var mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
  /* gentle curve: perpendicular offset */
  var dx = p1.x - p0.x, dy = p1.y - p0.y;
  var len = Math.sqrt(dx * dx + dy * dy) || 1;
  var off = Math.min(0.08 * len, 46 * DPR);
  var cpx = mx - dy / len * off, cpy = my + dx / len * off;
  return { p0: p0, p1: p1, c: { x: cpx, y: cpy }, len: len };
}
function qpoint(p, t) {
  var u = 1 - t;
  return { x: u * u * p.p0.x + 2 * u * t * p.c.x + t * t * p.p1.x,
           y: u * u * p.p0.y + 2 * u * t * p.c.y + t * t * p.p1.y };
}

function drawHatch(t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(217,168,63,.055)';
  ctx.lineWidth = Math.max(1, 1 * DPR);
  var sp = 30 * DPR, drift = Math.sin(t * 0.35) * 7 * DPR;
  ctx.beginPath();
  for (var x = -H; x < W + H; x += sp) {
    ctx.moveTo(x + drift, 0); ctx.lineTo(x + H + drift, H);
  }
  ctx.stroke();
  ctx.restore();
  /* red corner vignette */
  var vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42,
                                    W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(140,29,33,0)');
  vg.addColorStop(1, 'rgba(70,14,17,.42)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

function drawGlow(t) {
  var breath = 1 + Math.sin(t * 0.6) * 0.035;
  for (var i = 0; i < ORDER.length; i++) {
    var r = rects[ORDER[i]];
    var lv = nodeLevel[ORDER[i]];
    if (!r || lv <= 0.01) continue;
    var rad = Math.max(r.w, r.h) * 0.85 * breath;
    var g = ctx.createRadialGradient(r.cx, r.cy, rad * 0.1, r.cx, r.cy, rad);
    g.addColorStop(0, 'rgba(242,212,126,' + (0.20 * lv).toFixed(3) + ')');
    g.addColorStop(0.55, 'rgba(210,50,58,' + (0.10 * lv).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(210,50,58,0)');
    ctx.fillStyle = g;
    ctx.fillRect(r.cx - rad, r.cy - rad, rad * 2, rad * 2);
  }
}

function drawLinks(t) {
  for (var i = 0; i < LINKS.length; i++) {
    var p = linkPath(LINKS[i]);
    if (!p) continue;
    var lv = linkLevel[i];
    /* faint base */
    ctx.strokeStyle = 'rgba(217,168,63,.14)';
    ctx.lineWidth = Math.max(1, 1.1 * DPR);
    ctx.beginPath(); ctx.moveTo(p.p0.x, p.p0.y);
    ctx.quadraticCurveTo(p.c.x, p.c.y, p.p1.x, p.p1.y); ctx.stroke();
    if (lv > 0.01) {
      /* ignited core */
      ctx.save();
      ctx.strokeStyle = 'rgba(242,212,126,' + (0.55 * lv).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, 2 * DPR);
      ctx.shadowColor = 'rgba(242,180,80,.9)'; ctx.shadowBlur = 10 * DPR * lv;
      ctx.beginPath(); ctx.moveTo(p.p0.x, p.p0.y);
      ctx.quadraticCurveTo(p.c.x, p.c.y, p.p1.x, p.p1.y); ctx.stroke();
      ctx.restore();
      /* gold particles flowing parcels->trust->land->buildings */
      var ps = particles[i];
      for (var k = 0; k < ps.length; k++) {
        var pt = ps[k];
        pt.t += pt.sp * 0.016; if (pt.t > 1) pt.t -= 1;
        var q = qpoint(p, pt.t);
        var env = Math.sin(pt.t * Math.PI);
        ctx.fillStyle = 'rgba(242,212,126,' + (0.75 * env * lv).toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(q.x, q.y, pt.s * DPR * (0.5 + env * 0.7), 0, 6.2832); ctx.fill();
      }
      /* pulses */
      var pu = pulses[i];
      for (var j = 0; j < pu.length; j++) {
        pu[j].t += pu[j].sp * 0.016; if (pu[j].t > 1) pu[j].t -= 1;
        var qq = qpoint(p, pu[j].t);
        var ea = Math.sin(pu[j].t * Math.PI);
        ctx.save();
        ctx.fillStyle = 'rgba(255,233,176,' + (0.95 * ea * lv).toFixed(3) + ')';
        ctx.shadowColor = 'rgba(242,180,80,1)'; ctx.shadowBlur = 16 * DPR * lv;
        ctx.beginPath(); ctx.arc(qq.x, qq.y, 3.2 * DPR, 0, 6.2832); ctx.fill();
        ctx.restore();
      }
      /* arrowhead at target end */
      var tip = qpoint(p, 0.985), pre = qpoint(p, 0.93);
      var ang = Math.atan2(tip.y - pre.y, tip.x - pre.x);
      ctx.strokeStyle = 'rgba(242,212,126,' + (0.8 * lv).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, 1.8 * DPR);
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - Math.cos(ang - 0.42) * 12 * DPR, tip.y - Math.sin(ang - 0.42) * 12 * DPR);
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - Math.cos(ang + 0.42) * 12 * DPR, tip.y - Math.sin(ang + 0.42) * 12 * DPR);
      ctx.stroke();
    }
  }
}

function drawMesh(t) {
  var breath = 1 + Math.sin(t * 0.5) * 0.05;
  for (var i = 0; i < ORDER.length; i++) {
    var id = ORDER[i], r = rects[id], lv = nodeLevel[id];
    if (!r || lv <= 0.01) continue;
    var sats = satellites[id];
    var rad = (Math.max(r.w, r.h) / 2 + 30 * DPR) * breath;
    for (var k = 0; k < sats.length; k++) {
      var s = sats[k];
      s.a += s.sp * 0.016;
      var sx = r.cx + Math.cos(s.a) * rad * 1.15;
      var sy = r.cy + Math.sin(s.a) * rad * 0.72 + Math.sin(t * 0.8 + s.wob) * 4 * DPR;
      var tw = 0.45 + 0.55 * Math.abs(Math.sin(t * 1.1 + s.wob));
      /* faint mesh line to plate center */
      ctx.strokeStyle = 'rgba(217,168,63,' + (0.10 * lv * tw).toFixed(3) + ')';
      ctx.lineWidth = Math.max(1, 1 * DPR);
      ctx.beginPath(); ctx.moveTo(r.cx, r.cy); ctx.lineTo(sx, sy); ctx.stroke();
      /* satellite node */
      ctx.fillStyle = 'rgba(242,212,126,' + (0.35 + 0.55 * tw * lv).toFixed(3) + ')';
      ctx.save();
      ctx.shadowColor = 'rgba(242,180,80,.8)'; ctx.shadowBlur = 8 * DPR * tw * lv;
      ctx.beginPath(); ctx.arc(sx, sy, s.r * DPR, 0, 6.2832); ctx.fill();
      ctx.restore();
    }
    /* cross-links between neighboring satellites: the "mesh" */
    ctx.strokeStyle = 'rgba(210,50,58,' + (0.16 * lv).toFixed(3) + ')';
    ctx.lineWidth = Math.max(1, 1 * DPR);
    ctx.beginPath();
    for (var c = 0; c < sats.length; c++) {
      var s1 = sats[c], s2 = sats[(c + 2) % sats.length];
      var x1 = r.cx + Math.cos(s1.a) * rad * 1.15, y1 = r.cy + Math.sin(s1.a) * rad * 0.72;
      var x2 = r.cx + Math.cos(s2.a) * rad * 1.15, y2 = r.cy + Math.sin(s2.a) * rad * 0.72;
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }
}

function drawMotes(t) {
  ctx.save();
  for (var i = 0; i < motes.length; i++) {
    var mt = motes[i];
    var y = (mt.y - t * mt.v * 0.05) % 1; if (y < 0) y += 1;
    var x = (mt.x + Math.sin(t * 0.3 + mt.ph) * 0.015) % 1; if (x < 0) x += 1;
    var tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + mt.ph));
    ctx.fillStyle = 'rgba(242,212,126,' + (0.4 * tw).toFixed(3) + ')';
    ctx.beginPath(); ctx.arc(x * W, y * H, mt.s * DPR, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

function render(t) {
  ctx.clearRect(0, 0, W, H);
  for (var i = 0; i < ORDER.length; i++) {
    var id = ORDER[i];
    var tg = nodeTarget[id];
    nodeLevel[id] += (tg - nodeLevel[id]) * 0.06;
  }
  for (var j = 0; j < 3; j++) linkLevel[j] += (linkTarget[j] - linkLevel[j]) * 0.06;
  drawHatch(t);
  drawGlow(t);
  drawLinks(t);
  drawMesh(t);
  drawMotes(t);
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
  if (running) return;
  if (reduced) { render(8); return; }
  running = true; t0 = 0;
  rafId = requestAnimationFrame(frame);
}
function stop() { running = false; try { cancelAnimationFrame(rafId); } catch (e) {} }

/* mount the live mesh only now (SVG + canvas swap) */
figure.classList.add('mesh-live');
pickLayout(); sizeCanvas(); measure();

var resizeT = 0;
try {
  window.addEventListener('resize', function () {
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(function () { pickLayout(); sizeCanvas(); measure(); if (reduced) render(8); }, 150);
  });
  window.addEventListener('load', function () { pickLayout(); sizeCanvas(); measure(); if (reduced) render(8); });
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { pickLayout(); sizeCanvas(); measure(); if (reduced) render(8); }); } catch (e3) {}
} catch (e) {}

if (reduced || !hasIO) {
  /* fully active immediately; one static frame */
  activateAll(); sizeCanvas(); measure(); render(8);
} else {
  try {
    new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (inView && !document.hidden) { start(); } else { stop(); }
    }, { threshold: 0.05 }).observe(section);
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { scheduleReveal(); }
    }, { threshold: 0.15 }).observe(section);
  } catch (e) { activateAll(); start(); }
  try {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop(); else if (inView) start();
    });
  } catch (e2) {}
}

})();
