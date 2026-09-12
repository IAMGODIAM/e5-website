/* ============================================================================
 * AgriMesh "living field" twin — canvas-2D digital twin panel
 * War-room spec: AGRIMESH_WAR_ROOM_VERDICT.md §2 (the centerpiece interaction)
 *
 * Honesty rules baked in (non-negotiable):
 *  - Soil moisture / temperature render as CONTOURED COLOR FIELDS. Never as
 *    flowing particles — red-team killed that metaphor as physically false.
 *  - Mesh traffic renders as particle advection along links (packets genuinely
 *    travel). Link health brightens filaments.
 *  - "SIMULATED DATA — illustrative replay" is drawn on EVERY canvas frame.
 *  - The twin replays a frozen, version-stamped dataset (replay-v1.json).
 *    "Replayed" is literally true: topology is frozen; only visual jitter
 *    (particle spawn order/phase) is non-deterministic.
 *  - No-JS / canvas-failure / static-first devices keep the designed poster —
 *    never a void. All state changes are mirrored to the aria-live region and
 *    the plain-language legend (fail-closed).
 *
 * DOM contract (page shell):
 *   section#am-twin
 *     .am-twin-stage
 *       .am-twin-viewport           (position:relative; the canvas sizing basis)
 *         .am-twin-poster          (hidden by this script ONLY on successful start)
 *         canvas.am-twin-canvas    (hidden by shell; unhidden here on start)
 *         .am-nodes                (empty; node <button>s generated here, % of viewport)
 *       .am-twin-pills > button[data-layer="moisture"|"temperature"|"network"]
 *       .am-twin-legend            (text updated per layer)
 *       .am-twin-steps             (static HTML frames — left alone)
 *       .am-twin-live              (aria-live="polite" narration target)
 *
 * NOTE (2026-09-12 postmortem): Element.querySelector() matches DESCENDANTS
 * ONLY — never the element itself. The stage MUST be a child of section#am-twin
 * (the shell once carried the class on the section itself, which made
 * root.querySelector('.am-twin-stage') return null and silently killed the twin).
 *
 * Performance contract:
 *   - Adaptive particle budget with FPS governor: if avg frame time > 40ms
 *     over ~60 frames, halve particles (floor ~200) and drop DPR to 1.0.
 *   - DPR <= 1.5. Canvas hard-paused offscreen (IntersectionObserver),
 *     during active scroll (resume ~150ms after scroll end), and when
 *     document.hidden.
 *   - Static-first: hardwareConcurrency <= 4 or navigator.connection.saveData
 *     → draw one static frame, stop. Poster stays the visual anchor.
 *   - prefers-reduced-motion → one static fully-legible frame, no loop, no
 *     auto-beat. Nodes remain operable buttons; stepped HTML carries the story.
 * ========================================================================== */
(function (global) {
'use strict';

/* ------------------------------------------------------------------ */
/* Frozen inline fallback — injected at build time from replay-v1.json */
/* so the twin works from file:// or when fetch is blocked.            */
/* ------------------------------------------------------------------ */
var FALLBACK_REPLAY = /*__REPLAY_V1_JSON__*/ {"beat":{"drop_delay_ms":2500,"drop_node":3,"heal_after_ms":7000,"note":"scripted once-only drop -> reroute -> heal cycle; only plays with motion allowed and the twin in view"},"blobs":{"moisture":[{"note":"dry ridge","r":0.3,"v":0.85,"x":0.3,"y":0.62},{"note":"warm corner","r":0.26,"v":0.62,"x":0.72,"y":0.48},{"note":"low swale","r":0.2,"v":0.42,"x":0.55,"y":0.84}],"temperature":[{"note":"sun-facing slope","r":0.3,"v":0.9,"x":0.68,"y":0.62},{"note":"mid field","r":0.24,"v":0.55,"x":0.3,"y":0.42},{"note":"near gateway","r":0.2,"v":0.62,"x":0.52,"y":0.86}]},"description":"Frozen simulated replay dataset for the AgriMesh living-field twin. Every value is illustrative and invented for the visualization — no measured telemetry. Topology is frozen; 'replayed' is literally true.","generated":"2026-09-12","honesty":{"moisture_units":"relative dryness index 0-1 (higher = drier soil)","temperature_units":"relative warmth index 0-1 (higher = warmer soil)","traffic":"each particle is one simulated data packet traveling a mesh link","watermark":"SIMULATED DATA — illustrative replay"},"link_health":{"1-10":1,"1-2":0.95,"1-5":0.9,"2-3":0.85,"2-6":0.9,"3-10":0.9,"3-4":0.8,"3-8":0.75,"4-5":0.85,"4-9":0.8,"5-7":0.9,"6-8":0.95,"7-9":0.85,"8-9":0.8,"9-10":0.9},"links":[[1,2],[1,5],[1,10],[2,3],[2,6],[3,4],[3,8],[3,10],[4,5],[4,9],[5,7],[6,8],[7,9],[8,9],[9,10]],"nodes":[{"gateway":true,"id":1,"label":"Gateway","x":0.5,"y":0.9},{"gateway":false,"id":2,"label":"Sensor node 2","x":0.22,"y":0.72},{"gateway":false,"id":3,"label":"Sensor node 3","x":0.38,"y":0.56},{"gateway":false,"id":4,"label":"Sensor node 4","x":0.63,"y":0.58},{"gateway":false,"id":5,"label":"Sensor node 5","x":0.79,"y":0.73},{"gateway":false,"id":6,"label":"Sensor node 6","x":0.14,"y":0.46},{"gateway":false,"id":7,"label":"Sensor node 7","x":0.86,"y":0.44},{"gateway":false,"id":8,"label":"Sensor node 8","x":0.3,"y":0.33},{"gateway":false,"id":9,"label":"Sensor node 9","x":0.7,"y":0.31},{"gateway":false,"id":10,"label":"Sensor node 10","x":0.52,"y":0.73}],"replay_id":"replay-v1","version":1};

var WATERMARK = 'SIMULATED DATA \u2014 illustrative replay';

var PARTICLE_START = 420;   // initial particle budget (network layer, full health)
var PARTICLE_FLOOR = 200;   // governor never goes below this
var FRAME_WINDOW  = 60;     // frames over which the governor averages
var FRAME_BUDGET_MS = 40;   // avg frame time above this triggers degradation
var MAX_DPR = 1.5;

var LEGENDS = {
  moisture:    'Soil moisture \u2014 darker = drier soil. Contoured color field, simulated replay.',
  temperature: 'Soil temperature \u2014 darker = warmer soil. Contoured color field, simulated replay.',
  network:     'Mesh traffic \u2014 each moving dot is one data packet traveling the mesh links. Simulated replay.'
};
var LAYER_LABELS = { moisture: 'soil moisture', temperature: 'soil temperature', network: 'mesh traffic' };

var NODE_CSS =
  '.am-node-btn{position:absolute;width:38px;height:38px;margin:0;padding:0;' +
  'border-radius:9999px;border:2px solid #2f7a3d;background:rgba(255,255,255,.94);' +
  'color:#1d4a26;font:600 13px/1 system-ui,-apple-system,sans-serif;cursor:pointer;' +
  'box-shadow:0 1px 4px rgba(60,40,10,.28);transform:translate(-50%,-50%);' +
  'pointer-events:auto;transition:background .2s,border-color .2s,color .2s;}' +
  '.am-node-btn:hover{border-color:#b08d3e;}' +
  '.am-node-btn:focus-visible{outline:3px solid #b08d3e;outline-offset:2px;}' +
  '.am-node-btn.is-gateway{border-color:#b08d3e;background:#fff8e6;color:#6b4d12;}' +
  '.am-node-btn.is-offline{background:#e9e2d2;border-color:#a33333;border-style:dashed;color:#7a2a2a;}';

/* ================================================================== */
function createTwin(env) {
  var doc = env.document;
  var win = env.window;
  var raf = env.requestAnimationFrame;
  var caf  = env.cancelAnimationFrame;
  var setTimeoutFn = env.setTimeout || function (fn, ms) { return setTimeout(fn, ms); };
  var clearTimeoutFn = env.clearTimeout || function (id) { clearTimeout(id); };
  var fetchFn = env.fetch;

  var state = {
    replay: null,
    layer: 'moisture',
    offline: {},          // nodeId -> true
    beatPlayed: false,
    started: false,
    staticFirst: false,
    reducedMotion: false,
    inView: false,
    scrolling: false,
    rafId: 0,
    lastT: null,
    dpr: 1,
    particleBudget: PARTICLE_START,
    particles: [],
    nodes: [],            // replay node objects
    nodeById: {},
    links: [],            // {a, b, health}
    adjacency: {},        // id -> [neighbor ids]
    nodePx: {},           // id -> {x, y} css pixels
    bgCanvas: null,
    fieldCanvas: null,
    frameTimes: [],
    W: 0, H: 0,
    scrollTimer: 0,
    beatTimers: []
  };

  var root, stage, viewport, poster, canvas, ctx, pillsBox, legend, nodesBox, live;

  /* ---------------- element helpers ---------------- */
  function el(sel, base) { return (base || root).querySelector(sel); }

  function narrate(msg) {
    if (live) live.textContent = msg;
  }

  function isOnline(id) { return !state.offline[id]; }
  function gatewayId() {
    for (var i = 0; i < state.nodes.length; i++) {
      if (state.nodes[i].gateway) return state.nodes[i].id;
    }
    return state.nodes.length ? state.nodes[0].id : 0;
  }
  function linkKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }

  /* ---------------- graph ---------------- */
  function buildGraph() {
    var i, l;
    state.adjacency = {};
    state.links = [];
    for (i = 0; i < state.nodes.length; i++) state.adjacency[state.nodes[i].id] = [];
    var pairs = state.replay.links || [];
    for (i = 0; i < pairs.length; i++) {
      var a = pairs[i][0], b = pairs[i][1];
      if (!state.nodeById[a] || !state.nodeById[b]) continue;
      var health = 0.85;
      var lh = state.replay.link_health || {};
      if (lh[linkKey(a, b)] != null) health = lh[linkKey(a, b)];
      state.links.push({ a: a, b: b, health: health });
      state.adjacency[a].push(b);
      state.adjacency[b].push(a);
    }
  }

  // BFS shortest path over ONLINE nodes; returns array of ids or [].
  function bfsPath(fromId, toId) {
    if (!isOnline(fromId) || !isOnline(toId)) return [];
    var prev = {}, seen = {}, queue = [fromId];
    seen[fromId] = true;
    while (queue.length) {
      var cur = queue.shift();
      if (cur === toId) break;
      var nbrs = state.adjacency[cur] || [];
      for (var i = 0; i < nbrs.length; i++) {
        var n = nbrs[i];
        if (!seen[n] && isOnline(n)) { seen[n] = true; prev[n] = cur; queue.push(n); }
      }
    }
    if (!seen[toId]) return [];
    var path = [toId], c = toId;
    while (c !== fromId) { c = prev[c]; path.unshift(c); }
    return path;
  }

  function onlineNodes() {
    return state.nodes.filter(function (n) { return isOnline(n.id); });
  }

  /* ---------------- particles (mesh traffic) ---------------- */
  function spawnParticle(p) {
    var gw = gatewayId();
    var cands = onlineNodes().filter(function (n) { return n.id !== gw; });
    if (!cands.length) { p.active = false; p.route = []; return; }
    var src = cands[(Math.random() * cands.length) | 0];
    p.route = bfsPath(src.id, gw);
    p.seg = 0;
    p.s = Math.random();
    p.speed = 0.22 + Math.random() * 0.30; // segment fraction per second: slow, breath-like
    p.phase = Math.random() * 6.283;
    p.active = p.route.length > 1;
  }

  function syncParticles() {
    while (state.particles.length < state.particleBudget) {
      var p = { route: [], seg: 0, s: 0, speed: 0.3, phase: 0, active: false };
      spawnParticle(p);
      state.particles.push(p);
    }
    state.particles.length = state.particleBudget;
  }

  // Recompute every particle's route against the current (possibly changed)
  // topology. Called on node drop AND heal.
  function rerouteParticles() {
    var gw = gatewayId();
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      var broken = !p.active;
      if (!broken) {
        for (var j = 0; j < p.route.length; j++) {
          if (!isOnline(p.route[j])) { broken = true; break; }
        }
      }
      if (broken) {
        // Re-anchor from the online node nearest the particle's current spot.
        var pos = particlePos(p);
        var best = null, bestD = Infinity;
        var on = onlineNodes();
        for (var k = 0; k < on.length; k++) {
          var np = state.nodePx[on[k].id];
          if (!np) continue;
          var d = (np.x - pos.x) * (np.x - pos.x) + (np.y - pos.y) * (np.y - pos.y);
          if (d < bestD) { bestD = d; best = on[k]; }
        }
        if (best && best.id !== gw) {
          p.route = bfsPath(best.id, gw);
          p.seg = 0; p.s = 0;
          p.active = p.route.length > 1;
        } else {
          p.active = false; // e.g. gateway itself is down: packets hold
        }
      }
    }
  }

  function particlePos(p) {
    var a = state.nodePx[p.route[p.seg]];
    var b = state.nodePx[p.route[p.seg + 1]];
    if (!a || !b) return { x: 0, y: 0 };
    var x = a.x + (b.x - a.x) * p.s;
    var y = a.y + (b.y - a.y) * p.s;
    // gentle perpendicular wobble — visual jitter only, path unchanged
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var wob = Math.sin(p.phase + p.s * 6.283) * 2.5;
    return { x: x + (-dy / len) * wob, y: y + (dx / len) * wob };
  }

  function updateParticles(dt) {
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      if (!p.active) continue;
      p.s += dt * p.speed;
      if (p.s >= 1) {
        p.s = 0; p.seg++;
        if (p.seg >= p.route.length - 1) spawnParticle(p); // packet delivered; new one
      }
    }
  }

  /* ---------------- static background: dawn field ---------------- */
  function renderBackground(w, h) {
    var c = doc.createElement('canvas');
    c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
    var x = c.getContext('2d');
    if (!x) return null;
    var skyH = h * 0.16;

    // dawn sky band: warm gradient
    var g = x.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, '#ffdf9e');
    g.addColorStop(0.55, '#fbeccb');
    g.addColorStop(1, '#fdf8ea');
    x.fillStyle = g;
    x.fillRect(0, 0, w, skyH);

    // low sun glow
    var sg = x.createRadialGradient(w * 0.72, skyH * 0.6, 4, w * 0.72, skyH * 0.6, w * 0.30);
    sg.addColorStop(0, 'rgba(255,190,105,0.65)');
    sg.addColorStop(1, 'rgba(255,190,105,0)');
    x.fillStyle = sg;
    x.fillRect(0, 0, w, skyH);

    // field base: warm paper/ivory ground
    g = x.createLinearGradient(0, skyH, 0, h);
    g.addColorStop(0, '#f7f0dc');
    g.addColorStop(1, '#e7d5ae');
    x.fillStyle = g;
    x.fillRect(0, skyH, w, h - skyH);

    // horizon line
    x.strokeStyle = 'rgba(122,94,52,0.4)'; x.lineWidth = Math.max(1, state.dpr);
    x.beginPath(); x.moveTo(0, skyH); x.lineTo(w, skyH); x.stroke();

    // perspective crop rows
    var rows = 9, i;
    for (i = 0; i < rows; i++) {
      var t = i / (rows - 1);
      var y = skyH + (h - skyH) * Math.pow(t, 1.6);
      x.strokeStyle = 'rgba(122,94,52,0.15)';
      x.lineWidth = (1 + t * 1.6) * state.dpr;
      x.beginPath();
      x.moveTo(0, y);
      x.quadraticCurveTo(w / 2, y + 6 * (1 - t), w, y);
      x.stroke();
    }
    // faint converging furrows toward a vanishing point (subtle depth cue)
    x.strokeStyle = 'rgba(122,94,52,0.07)';
    x.lineWidth = state.dpr;
    var vpx = w * 0.5, vpy = skyH;
    for (i = -6; i <= 6; i++) {
      x.beginPath();
      x.moveTo(vpx, vpy);
      x.lineTo(w * 0.5 + i * w * 0.16, h);
      x.stroke();
    }
    return c;
  }

  // Contoured color field for a layer. Static per layer/resize: soil doesn't move.
  function buildFieldLayer(layer, w, h) {
    var scale = 0.5; // half-res offscreen is plenty for soft blobs
    var c = doc.createElement('canvas');
    c.width = Math.max(2, Math.round(w * scale));
    c.height = Math.max(2, Math.round(h * scale));
    var x = c.getContext('2d');
    if (!x) return null;
    var blobs = (state.replay.blobs && state.replay.blobs[layer === 'network' ? 'moisture' : layer]) || [];
    // moisture = umber ink; temperature = terracotta ink. Darker = drier / warmer.
    var ink = layer === 'temperature' ? '150,74,40' : '110,72,38';
    var BANDS = 5, b, k;
    for (b = 0; b < blobs.length; b++) {
      var blob = blobs[b];
      var cx = blob.x * c.width, cy = blob.y * c.height;
      var R = blob.r * Math.min(c.width, c.height);
      // stepped concentric fills -> soft contour banding
      for (k = BANDS; k >= 1; k--) {
        var r = R * k / BANDS;
        var a = 0.04 + 0.36 * blob.v * Math.pow(k / BANDS, 1.5);
        x.fillStyle = 'rgba(' + ink + ',' + a.toFixed(3) + ')';
        x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill();
      }
      // iso rings for legibility
      x.strokeStyle = 'rgba(' + ink + ',0.28)';
      x.lineWidth = 1;
      for (k = 1; k <= BANDS; k++) {
        x.beginPath(); x.arc(cx, cy, R * k / BANDS, 0, Math.PI * 2); x.stroke();
      }
    }
    // keep the data field off the sky band (soft mask at the horizon)
    var skyPx = (h * 0.16) * scale;
    x.globalCompositeOperation = 'destination-in';
    var m = x.createLinearGradient(0, skyPx - 8 * scale, 0, skyPx + 22 * scale);
    m.addColorStop(0, 'rgba(0,0,0,0)');
    m.addColorStop(1, 'rgba(0,0,0,1)');
    x.fillStyle = m;
    x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'source-over';
    return c;
  }

  function buildStaticCanvases() {
    var w = Math.round(state.W * state.dpr), h = Math.round(state.H * state.dpr);
    state.bgCanvas = renderBackground(w, h);
    state.fieldCanvas = buildFieldLayer(state.layer, w, h);
  }

  /* ---------------- frame render ---------------- */
  function drawLinks() {
    var gain = state.layer === 'network' ? 1 : 0.45; // traffic emphasis per layer
    for (var i = 0; i < state.links.length; i++) {
      var l = state.links[i];
      var a = state.nodePx[l.a], b = state.nodePx[l.b];
      if (!a || !b) continue;
      var on = isOnline(l.a) && isOnline(l.b);
      if (on) {
        ctx.strokeStyle = 'rgba(84,138,72,' + (0.22 + 0.58 * l.health * gain).toFixed(3) + ')';
        ctx.lineWidth = (1 + 2 * l.health * gain);
      } else {
        ctx.strokeStyle = 'rgba(130,118,96,0.22)';
        ctx.lineWidth = 1;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  function drawParticles(tSec) {
    var alpha = state.layer === 'network' ? 0.95 : 0.30;
    ctx.fillStyle = 'rgba(46,110,58,' + alpha.toFixed(2) + ')';
    for (var i = 0; i < state.particles.length; i++) {
      var p = state.particles[i];
      if (!p.active || p.route.length < 2) continue;
      var pos = particlePos(p);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawWatermark() {
    ctx.save();
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(74,58,32,0.62)';
    ctx.fillText(WATERMARK, state.W - 10, state.H - 8);
    ctx.restore();
  }

  function renderFrame() {
    if (!ctx || state.W <= 0) return;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (state.bgCanvas) ctx.drawImage(state.bgCanvas, 0, 0, state.W, state.H);
    if (state.fieldCanvas) {
      ctx.globalAlpha = state.layer === 'network' ? 0.35 : 1;
      ctx.drawImage(state.fieldCanvas, 0, 0, state.W, state.H);
      ctx.globalAlpha = 1;
    }
    drawLinks();
    drawParticles();
    drawWatermark(); // every frame, permanent
  }

  /* ---------------- sizing ---------------- */
  function resize() {
    if (!viewport || !canvas) return;
    // The canvas fills .am-twin-viewport (CSS: absolute inset 0), so the
    // viewport — not the whole card — is the sizing basis. Node % positions
    // in .am-nodes (also inset 0 of the viewport) then align with canvas px.
    var rect = viewport.getBoundingClientRect ? viewport.getBoundingClientRect() : { width: 800, height: 600 };
    var W = Math.max(1, Math.round(rect.width || 800));
    var H = Math.max(1, Math.round(rect.height || 600));
    if (W === state.W && H === state.H && canvas.width) return;
    state.W = W; state.H = H;
    canvas.width = Math.round(W * state.dpr);
    canvas.height = Math.round(H * state.dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    var i;
    for (i = 0; i < state.nodes.length; i++) {
      var n = state.nodes[i];
      state.nodePx[n.id] = { x: n.x * W, y: n.y * H };
    }
    buildStaticCanvases();
  }

  /* ---------------- loop + governor ---------------- */
  function degrade() {
    if (state.particleBudget > PARTICLE_FLOOR) {
      state.particleBudget = Math.max(PARTICLE_FLOOR, Math.floor(state.particleBudget / 2));
      syncParticles();
    }
    if (state.dpr > 1) {
      state.dpr = 1;
      resize();
    }
  }

  function tick(now) {
    state.rafId = 0;
    if (!shouldRun()) return;
    var dtMs = state.lastT == null ? 0 : now - state.lastT;
    state.lastT = now;
    if (dtMs > 0) {
      state.frameTimes.push(dtMs);
      if (state.frameTimes.length >= FRAME_WINDOW) {
        var sum = 0, i;
        for (i = 0; i < state.frameTimes.length; i++) sum += state.frameTimes[i];
        if (sum / state.frameTimes.length > FRAME_BUDGET_MS) degrade();
        state.frameTimes.length = 0;
      }
    }
    updateParticles(Math.min(0.1, dtMs / 1000));
    renderFrame();
    state.rafId = raf(tick);
  }

  function shouldRun() {
    return !!(state.started && !state.staticFirst && !state.reducedMotion &&
      state.inView && !state.scrolling && !isDocHidden());
  }

  function isDocHidden() {
    return !!(doc.hidden || (win.document && win.document.hidden));
  }

  function updateRunning() {
    if (shouldRun()) {
      if (!state.rafId) { state.lastT = null; state.rafId = raf(tick); }
    } else if (state.rafId) {
      caf(state.rafId); state.rafId = 0;
    }
  }

  /* ---------------- layers ---------------- */
  function setLayer(name, silent) {
    if (!LEGENDS[name]) return;
    state.layer = name;
    var btns = pillsBox ? pillsBox.querySelectorAll('button[data-layer]') : [];
    for (var i = 0; i < btns.length; i++) {
      var on = btns[i].getAttribute('data-layer') === name;
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (legend) legend.textContent = LEGENDS[name];
    if (state.fieldCanvas || state.W > 0) {
      state.fieldCanvas = buildFieldLayer(name, Math.round(state.W * state.dpr), Math.round(state.H * state.dpr));
      if (!shouldRun()) renderFrame(); // keep the static frame fresh when the loop is off
    }
    if (!silent) narrate('Showing ' + LAYER_LABELS[name] + '. ' + LEGENDS[name]);
  }

  /* ---------------- nodes ---------------- */
  function nodeButtonLabel(n) {
    return isOnline(n.id)
      ? n.label + ' \u2014 knock offline'
      : n.label + ' (offline) \u2014 bring back online';
  }

  function buildNodeButtons() {
    // Overlay positioning lives in CSS (.am-nodes: absolute inset 0 of the
    // viewport, pointer-events none; buttons re-enable pointer events).
    var i;
    for (i = 0; i < state.nodes.length; i++) {
      (function (n) {
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'am-node-btn' + (n.gateway ? ' is-gateway' : '');
        btn.setAttribute('data-node', String(n.id));
        btn.textContent = String(n.id);
        btn.style.left = (n.x * 100).toFixed(2) + '%';
        btn.style.top = (n.y * 100).toFixed(2) + '%';
        btn.setAttribute('aria-label', nodeButtonLabel(n));
        btn.addEventListener('click', function () { toggleNode(n.id, false); });
        btn.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); toggleNode(n.id, false); }
        });
        nodesBox.appendChild(btn);
        n._btn = btn;
      })(state.nodes[i]);
    }
  }

  function refreshNodeButton(n) {
    if (!n._btn) return;
    if (isOnline(n.id)) n._btn.classList.remove('is-offline');
    else n._btn.classList.add('is-offline');
    n._btn.setAttribute('aria-label', nodeButtonLabel(n));
  }

  function rerouteNarration(droppedId) {
    var gw = gatewayId();
    if (droppedId === gw) {
      return 'Gateway offline. Mesh isolated \u2014 packets holding until it returns.';
    }
    // Name the surviving neighbors that absorb the rerouted flows.
    var nbrs = (state.adjacency[droppedId] || []).filter(function (n) {
      return isOnline(n) && n !== gw;
    }).sort(function (p, q) { return p - q; });
    var via = nbrs.slice(0, 2).map(function (id) { return 'node ' + id; }).join(' and ');
    return via
      ? 'Node ' + droppedId + ' offline. Traffic rerouting through ' + via + '.'
      : 'Node ' + droppedId + ' offline. Traffic rerouting around it.';
  }

  function dropNode(id, scripted) {
    var n = state.nodeById[id];
    if (!n || !isOnline(id)) return;
    state.offline[id] = true;
    refreshNodeButton(n);
    rerouteParticles();
    var msg = rerouteNarration(id);
    narrate((scripted ? msg.replace('offline.', 'offline (simulated).') : msg));
    renderFrame();
  }

  function healNode(id, scripted) {
    var n = state.nodeById[id];
    if (!n || isOnline(id)) return;
    delete state.offline[id];
    refreshNodeButton(n);
    rerouteParticles();
    narrate('Node ' + id + ' back online' + (scripted ? ' (simulated)' : '') + '. Mesh healed.');
    renderFrame();
  }

  function toggleNode(id, scripted) {
    if (isOnline(id)) dropNode(id, !!scripted);
    else healNode(id, !!scripted);
  }

  /* ---------------- scripted beat ---------------- */
  function scheduleBeat() {
    if (state.beatPlayed || state.reducedMotion || state.staticFirst) return;
    state.beatPlayed = true;
    var beat = state.replay.beat || {};
    var node = beat.drop_node || 3;
    var dropMs = beat.drop_delay_ms != null ? beat.drop_delay_ms : 2500;
    var healMs = beat.heal_after_ms != null ? beat.heal_after_ms : 7000;
    state.beatTimers.push(setTimeoutFn(function () { dropNode(node, true); }, dropMs));
    state.beatTimers.push(setTimeoutFn(function () { healNode(node, true); }, dropMs + healMs));
  }

  /* ---------------- replay loading ---------------- */
  function loadReplay() {
    if (!fetchFn) return Promise.resolve(FALLBACK_REPLAY);
    try {
      return fetchFn('js/replay-v1.json', { cache: 'force-cache' }).then(function (res) {
        if (!res || !res.ok) throw new Error('replay fetch failed');
        return res.json();
      }).then(function (data) {
        if (data && data.replay_id === 'replay-v1' && Array.isArray(data.nodes) && data.nodes.length >= 2) return data;
        throw new Error('replay invalid');
      }).catch(function () { return FALLBACK_REPLAY; });
    } catch (e) {
      return Promise.resolve(FALLBACK_REPLAY);
    }
  }

  /* ---------------- boot ---------------- */
  function start() {
    if (state.started) return Promise.resolve(state);
    root = doc.querySelector('section#am-twin');
    if (!root) return Promise.resolve(state); // nothing to attach to; fail closed

    return loadReplay().then(function (replay) {
      state.replay = replay;
      stage = root.querySelector('.am-twin-stage');
      viewport = root.querySelector('.am-twin-viewport');
      poster = root.querySelector('.am-twin-poster');
      canvas = root.querySelector('canvas.am-twin-canvas');
      pillsBox = root.querySelector('.am-twin-pills');
      legend = root.querySelector('.am-twin-legend');
      nodesBox = root.querySelector('.am-nodes');
      live = root.querySelector('.am-twin-live');

      if (!stage || !viewport || !canvas || !nodesBox) return state; // shell incomplete: poster stays

      var nav = win.navigator || {};
      var conn = nav.connection || {};
      state.staticFirst = (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4) || !!conn.saveData;
      var mq = win.matchMedia ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
      state.reducedMotion = !!(mq && mq.matches);

      state.nodes = replay.nodes || [];
      state.nodeById = {};
      var i;
      for (i = 0; i < state.nodes.length; i++) state.nodeById[state.nodes[i].id] = state.nodes[i];
      buildGraph();

      canvas.setAttribute('role', 'img');
      if (!canvas.getAttribute('aria-label')) {
        canvas.setAttribute('aria-label',
          'Simulated living-field twin: contoured soil map with mesh traffic. All data simulated.');
      }

      // essential node-button styling, namespaced; shell CSS may add more
      var styleEl = doc.createElement('style');
      styleEl.setAttribute('data-am-twin', 'node-buttons');
      if (styleEl.styleSheet) styleEl.styleSheet.cssText = NODE_CSS;
      else styleEl.appendChild(doc.createTextNode(NODE_CSS));
      (doc.head || doc.getElementsByTagName('head')[0] || root).appendChild(styleEl);

      // layer pills
      var btns = pillsBox ? pillsBox.querySelectorAll('button[data-layer]') : [];
      for (i = 0; i < btns.length; i++) {
        (function (btn) {
          btn.setAttribute('aria-pressed', btn.getAttribute('data-layer') === state.layer ? 'true' : 'false');
          btn.addEventListener('click', function () { setLayer(btn.getAttribute('data-layer'), false); });
        })(btns[i]);
      }
      setLayer(state.layer, true);

      // 2D context is the go/no-go gate: poster hides ONLY if this succeeds.
      ctx = canvas.getContext('2d');
      if (!ctx) return state; // canvas failure: poster stays, canvas stays hidden

      state.dpr = Math.min(MAX_DPR, win.devicePixelRatio || 1);
      resize();
      syncParticles();
      renderFrame(); // one frame always: static modes stop here

      if (state.staticFirst) {
        // constrained device: poster remains the visual anchor, no node
        // buttons (nothing to operate behind the poster); steps carry the story.
        return state;
      }

      buildNodeButtons();

      // Successful start: reveal the canvas, retire the poster.
      if (poster) poster.style.display = 'none';
      canvas.removeAttribute('hidden');
      canvas.style.display = 'block';

      narrate('Living field twin loaded. Simulated replay.');
      state.started = true;

      if (state.reducedMotion) return state; // static frame only; no loop, no auto-beat

      // observers + listeners
      var IO = env.IntersectionObserver || win.IntersectionObserver;
      if (IO) {
        var io = new IO(function (entries) {
          for (var k = 0; k < entries.length; k++) {
            if (entries[k].target === stage || entries[k].target === root) {
              state.inView = !!entries[k].isIntersecting;
              updateRunning();
              if (state.inView) scheduleBeat(); // once
            }
          }
        }, { threshold: 0.25 });
        io.observe(stage);
        state._io = io;
      } else {
        state.inView = true;
        updateRunning();
        scheduleBeat();
      }

      win.addEventListener('scroll', function () {
        state.scrolling = true;
        updateRunning();
        if (state.scrollTimer) clearTimeoutFn(state.scrollTimer);
        state.scrollTimer = setTimeoutFn(function () {
          state.scrolling = false;
          updateRunning();
        }, 150);
      }, { passive: true });

      doc.addEventListener('visibilitychange', function () { updateRunning(); });

      if (win.addEventListener) {
        win.addEventListener('resize', function () { resize(); renderFrame(); });
      }

      updateRunning();
      return state;
    }).catch(function () {
      return state; // any boot failure: poster stays
    });
  }

  /* public/test API */
  return {
    start: start,
    setLayer: setLayer,
    toggleNode: toggleNode,
    dropNode: dropNode,
    healNode: healNode,
    getState: function () {
      return {
        layer: state.layer,
        offline: Object.keys(state.offline).map(Number),
        particleBudget: state.particleBudget,
        particleCount: state.particles.length,
        dpr: state.dpr,
        staticFirst: state.staticFirst,
        reducedMotion: state.reducedMotion,
        started: state.started,
        beatPlayed: state.beatPlayed,
        routes: state.particles.filter(function (p) { return p.active; }).map(function (p) { return p.route.slice(); }),
        replayId: state.replay && state.replay.replay_id
      };
    }
  };
}

/* ---------------- auto-boot (browser only) ---------------- */
if (typeof document !== 'undefined' && typeof window !== 'undefined' && typeof module === 'undefined') {
  var boot = function () {
    try {
      createTwin({
        document: document,
        window: window,
        fetch: window.fetch ? window.fetch.bind(window) : null,
        requestAnimationFrame: window.requestAnimationFrame.bind(window),
        cancelAnimationFrame: window.cancelAnimationFrame.bind(window),
        IntersectionObserver: window.IntersectionObserver || null
      }).start();
    } catch (e) { /* poster stays */ }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

/* ---------------- node/test export ---------------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTwin: createTwin, FALLBACK_REPLAY: FALLBACK_REPLAY, WATERMARK: WATERMARK };
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
