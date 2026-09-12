/* ============================================================================
 * AgriMesh innovation-chapter mesh visuals — ambient glowing mesh overlays.
 *
 * One small module finds canvas[data-mesh] inside figure.am-chapter-art and
 * animates a glowing node-link mesh as an AMBIENT layer behind the chapter's
 * teaching SVG. The SVG (and its aria-label) carries the chapter's meaning;
 * this canvas is aria-hidden, carries no copy, no labels, no narration, and
 * makes no claims — visual language only.
 *
 * Configs via data-mesh:
 *   heal     self-healing field mesh: nodes pulse, one drops periodically,
 *            links reroute with a glow surge, node returns.
 *   sensors  hyper-local sensor arrays: dense grid of sensor dots with a slow
 *            scanning sweep.
 *   edge     on-device intelligence: central bright node with orbiting rings.
 *   commons  community-governed data: ring topology, gentle synchronized pulse.
 *
 * Fail-closed: the canvas is display:none until the first frame draws
 * successfully. No-JS / canvas-failure / exception → canvas stays hidden and
 * the existing teaching SVG carries the chapter unchanged.
 * Perf: DPR <= 1.5, tiny node counts, rAF hard-paused offscreen via
 * IntersectionObserver and when document.hidden. prefers-reduced-motion draws
 * one static frame and never loops.
 * ========================================================================== */
(function () {
'use strict';

var MAX_DPR = 1.5;

var GOLD = { r: 214, g: 158, b: 52 };
var LEAF = { r: 76, g: 138, b: 74 };
var INK  = { r: 46, g: 110, b: 58 };

function rgba(c, a) {
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
}

/* ---------------- low-level glow primitives ---------------- */
function glowDotAbs(st, px, py, r, color, alpha) {
  var ctx = st.ctx;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba(color, alpha * 0.35);
  ctx.beginPath(); ctx.arc(px, py, r * 3.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
}

function glowDot(st, x, y, r, color, alpha) {
  glowDotAbs(st, x * st.W, y * st.H, r, color, alpha);
}

function glowLink(st, ax, ay, bx, by, color, alpha, wCore) {
  var ctx = st.ctx;
  var x1 = ax * st.W, y1 = ay * st.H, x2 = bx * st.W, y2 = by * st.H;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(color, alpha * 0.35);
  ctx.lineWidth = wCore + 6;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = wCore;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

/* ---------------- per-config builders ---------------- */
function buildHeal(st) {
  var n = 7, i, a;
  for (i = 0; i < n; i++) {
    a = -Math.PI / 2 + i * Math.PI * 2 / n;
    st.nodes.push({ x: 0.5 + 0.34 * Math.cos(a), y: 0.5 + 0.40 * Math.sin(a), phase: i * 0.9 });
  }
  for (i = 0; i < n; i++) st.links.push([i, (i + 1) % n]); // ring
  st.links.push([0, 3], [1, 5], [2, 6]);                    // chords
  st.dropIdx = 3;
  st.period = 9;
  // detour around the dropped node using existing links: 2-6-5-4
  st.detour = [[2, 6], [5, 6], [4, 5]];
}

function buildSensors(st) {
  var cols = 9, rows = 5, i, j;
  for (j = 0; j < rows; j++) {
    for (i = 0; i < cols; i++) {
      st.nodes.push({
        x: 0.08 + 0.84 * i / (cols - 1),
        y: 0.14 + 0.72 * j / (rows - 1),
        phase: (i + j) * 0.5
      });
    }
  }
  st.sweepSpeed = 0.09; // figure-width fractions per second
}

function buildEdge(st) {
  st.nodes.push({ x: 0.5, y: 0.5, phase: 0 });
  st.rings = [0.15, 0.24, 0.33]; // fractions of min(W,H)
  st.packets = [];
  var r, k;
  for (r = 0; r < 3; r++) {
    for (k = 0; k < 8; k++) {
      st.packets.push({ ring: r, a: k * Math.PI * 2 / 8, speed: (0.25 + r * 0.12) * (r % 2 ? -1 : 1) });
    }
  }
}

function buildCommons(st) {
  var n = 8, i, a;
  for (i = 0; i < n; i++) {
    a = -Math.PI / 2 + i * Math.PI * 2 / n;
    st.nodes.push({ x: 0.5 + 0.32 * Math.cos(a), y: 0.5 + 0.38 * Math.sin(a), phase: 0 });
  }
  for (i = 0; i < n; i++) st.links.push([i, (i + 1) % n]); // ring
  st.links.push([0, 4], [2, 6]);                             // chords
}

/* ---------------- per-config painters ---------------- */
function isDetour(st, a, b) {
  var d = st.detour || [];
  for (var i = 0; i < d.length; i++) {
    if ((d[i][0] === a && d[i][1] === b) || (d[i][0] === b && d[i][1] === a)) return true;
  }
  return false;
}

function drawHeal(st, t, animate) {
  var cyc = animate ? (t % st.period) : 0.5;
  var dropping = cyc >= 2 && cyc <= 5.5;
  var surging = cyc >= 2.6 && cyc <= 5.5;
  var i, l, a, b;
  for (i = 0; i < st.links.length; i++) {
    l = st.links[i]; a = st.nodes[l[0]]; b = st.nodes[l[1]];
    var down = dropping && (l[0] === st.dropIdx || l[1] === st.dropIdx);
    var surge = surging && !down && isDetour(st, l[0], l[1]);
    var col = surge ? GOLD : INK;
    var alpha = down ? 0.10 : (surge ? 0.95 : 0.5 + 0.15 * Math.sin(t * 1.6 + l[0]));
    glowLink(st, a.x, a.y, b.x, b.y, col, alpha, surge ? 2.2 : 1.4);
  }
  for (i = 0; i < st.nodes.length; i++) {
    var n = st.nodes[i];
    if (dropping && i === st.dropIdx) {
      var ctx = st.ctx;
      ctx.save();
      ctx.strokeStyle = 'rgba(163,51,51,0.7)';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(n.x * st.W, n.y * st.H, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      glowDot(st, n.x, n.y, 3, INK, 0.18);
    } else {
      var p = animate ? 0.55 + 0.30 * (0.5 + 0.5 * Math.sin(t * 2 + n.phase)) : 0.7;
      glowDot(st, n.x, n.y, 3.2, INK, p);
    }
  }
}

function drawSensors(st, t, animate) {
  var sweepX = animate ? ((t * st.sweepSpeed) % 1.4) - 0.2 : 0.45;
  var i, n, d, glow, idle, alpha;
  for (i = 0; i < st.nodes.length; i++) {
    n = st.nodes[i];
    d = n.x - sweepX;
    glow = Math.exp(-d * d / 0.006);
    idle = animate ? 0.06 * Math.sin(t * 1.2 + n.phase) : 0;
    alpha = 0.22 + 0.68 * glow + idle;
    glowDot(st, n.x, n.y, 2.2, glow > 0.35 ? GOLD : INK, Math.max(0.12, Math.min(1, alpha)));
  }
  // faint sweep light band
  var ctx = st.ctx;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  var lg = ctx.createLinearGradient((sweepX - 0.12) * st.W, 0, (sweepX + 0.12) * st.W, 0);
  lg.addColorStop(0, 'rgba(255,220,150,0)');
  lg.addColorStop(0.5, 'rgba(255,220,150,0.10)');
  lg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, st.W, st.H);
  ctx.restore();
}

function drawEdge(st, t, animate) {
  var ctx = st.ctx;
  var cx = 0.5 * st.W, cy = 0.5 * st.H;
  var m = Math.min(st.W, st.H);
  var r, i;
  ctx.save();
  ctx.strokeStyle = rgba(GOLD, 0.4);
  ctx.lineWidth = 1;
  for (r = 0; r < st.rings.length; r++) {
    ctx.setLineDash([6, 8]);
    ctx.lineDashOffset = animate ? -t * 10 * (r + 1) * (r % 2 ? -1 : 1) : 0;
    ctx.beginPath();
    ctx.arc(cx, cy, st.rings[r] * m, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  for (i = 0; i < st.packets.length; i++) {
    var p = st.packets[i];
    var ang = p.a + (animate ? t * p.speed : 0);
    var rad = st.rings[p.ring] * m;
    glowDotAbs(st, cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad, 2.2,
      p.ring === 1 ? GOLD : INK, 0.85);
  }
  // central bright node: gold halo + green core
  glowDotAbs(st, cx, cy, 9, GOLD, 0.9);
  glowDotAbs(st, cx, cy, 4.5, INK, 1);
}

function drawCommons(st, t, animate) {
  var s = animate ? 0.5 + 0.5 * Math.sin(t * 1.4) : 0.6;
  var i, l, a, b;
  for (i = 0; i < st.links.length; i++) {
    l = st.links[i]; a = st.nodes[l[0]]; b = st.nodes[l[1]];
    glowLink(st, a.x, a.y, b.x, b.y, INK, 0.35 + 0.35 * s, 1.4);
  }
  for (i = 0; i < st.nodes.length; i++) {
    var n = st.nodes[i];
    glowDot(st, n.x, n.y, 3 + 1.5 * s, GOLD, 0.5 + 0.4 * s);
  }
}

var BUILD = { heal: buildHeal, sensors: buildSensors, edge: buildEdge, commons: buildCommons };
var DRAW = { heal: drawHeal, sensors: drawSensors, edge: drawEdge, commons: drawCommons };

/* ---------------- engine ---------------- */
function makeState(canvas, kind) {
  return {
    canvas: canvas, kind: kind, ctx: null,
    W: 0, H: 0, dpr: 1,
    nodes: [], links: [], packets: [], rings: [], detour: [],
    dropIdx: 0, period: 9, sweepSpeed: 0.09,
    rafId: 0, inView: false, staticMode: false
  };
}

function washBg(st) {
  var ctx = st.ctx, W = st.W, H = st.H;
  ctx.clearRect(0, 0, W, H);
  var g = ctx.createRadialGradient(W * 0.5, H * 0.5, 4, W * 0.5, H * 0.5, Math.max(W, H) * 0.6);
  g.addColorStop(0, 'rgba(255,220,150,0.16)');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function frame(st, tSec, animate) {
  var ctx = st.ctx;
  if (!ctx || st.W <= 0) return false;
  ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
  washBg(st);
  DRAW[st.kind](st, tSec, animate);
  return true;
}

function shouldRun(st) {
  return !!(st.inView && !document.hidden);
}

function updateRunning(st) {
  if (st.staticMode) return;
  if (shouldRun(st)) {
    if (!st.rafId) {
      st.rafId = requestAnimationFrame(function (now) { tick(st, now); });
    }
  } else if (st.rafId) {
    cancelAnimationFrame(st.rafId);
    st.rafId = 0;
  }
}

function tick(st, now) {
  st.rafId = 0;
  if (!shouldRun(st)) return;
  if (frame(st, now / 1000, true)) {
    st.rafId = requestAnimationFrame(function (n) { tick(st, n); });
  }
}

function size(st) {
  var cv = st.canvas;
  var W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) {
    var host = cv.parentElement;
    W = host ? host.clientWidth : 400;
    H = Math.round(W * 0.62);
  }
  st.W = W; st.H = H;
  cv.width = Math.round(W * st.dpr);
  cv.height = Math.round(H * st.dpr);
}

function initCanvas(cv) {
  var kind = cv.getAttribute('data-mesh');
  if (!BUILD[kind]) return;
  var st = makeState(cv, kind);
  try {
    BUILD[kind](st);
    var ctx = cv.getContext('2d');
    if (!ctx) return; // fail-closed: canvas stays hidden, SVG carries the chapter
    st.ctx = ctx;
    st.dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
    var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    st.staticMode = !!(mq && mq.matches);
    cv.style.display = 'block'; // now measurable
    size(st);
    if (!frame(st, 0, false)) { cv.style.display = 'none'; return; } // first frame is the go/no-go gate

    if (st.staticMode) return; // one static frame; no loop

    var IO = window.IntersectionObserver;
    if (IO) {
      var io = new IO(function (entries) {
        for (var k = 0; k < entries.length; k++) {
          if (entries[k].target === cv) {
            st.inView = !!entries[k].isIntersecting;
            updateRunning(st);
          }
        }
      }, { threshold: 0.15 });
      io.observe(cv);
    } else {
      st.inView = true;
      updateRunning(st);
    }
    document.addEventListener('visibilitychange', function () { updateRunning(st); });
    window.addEventListener('resize', function () {
      size(st);
      if (!shouldRun(st)) frame(st, 0, true);
    });
  } catch (e) {
    cv.style.display = 'none'; // any failure: SVG carries the chapter
  }
}

function boot() {
  var canvases = document.querySelectorAll('canvas[data-mesh]');
  for (var i = 0; i < canvases.length; i++) initCanvas(canvases[i]);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof module === 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BUILD: BUILD, DRAW: DRAW };
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
