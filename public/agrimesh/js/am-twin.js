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
 * Cinematic pass (2026-09-12, aesthetics only — honesty rules unchanged):
 *   - Node buttons: soft CSS glow (box-shadow) + a subtle gold pulse on the
 *     gateway; animation gated off under prefers-reduced-motion. Kept crisp
 *     for daylight legibility.
 *   - Link bloom: every link drawn twice — wide low-alpha halo (additive)
 *     + narrow bright core. Particles get an additive halo + a normal-blend
 *     core so the mesh glows without losing sunlight legibility.
 *   - Dawn atmosphere (sky band ONLY — decorative, never moves data): gently
 *     pulsing sun glow, ~40 drifting gold motes (seeded, breath-like), a soft
 *     diagonal light-ray wash. Static/reduced-motion frames render the resting
 *     state (motes at rest, no drone).
 *   - Drone flyover accent: a small drone silhouette crosses the sky band
 *     every ~25 s with a faint light trail and blinking nav light. Atmosphere
 *     only. Never appears in static/reduced-motion frames.
 *   Perf budget unchanged: DPR <= 1.5, same FPS governor, same hard-pauses.
 * Farm-sim game reskin (2026-09-12, round 3 — aesthetics only, honesty rules
 *   unchanged): the twin renders as a Township/Town Star-style game board —
 *   cheerful sky, crop beds with growth stages (sprout/bushy/flowering/ready),
 *   barn/silo/greenhouse/windmill, butterflies, drifting cloud shadows.
 *   Nodes are game tokens over in-world sensor posts (farmhouse hub for the
 *   gateway); packets render partly as quadcopter drone units flying their
 *   REAL BFS routes. Moisture-layer crop tint uses the same frozen blobs
 *   (legend says so). All simulation logic, fail-closed fallbacks, watermark,
 *   and claim rules untouched.
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
  moisture:    'Soil moisture \u2014 darker = drier soil; crops look thirstier where dry. Contoured color field, simulated replay.',
  temperature: 'Soil temperature \u2014 darker = warmer soil. Contoured color field, simulated replay.',
  network:     'Mesh traffic \u2014 each moving dot is one data packet traveling the mesh links. Simulated replay.'
};
var LAYER_LABELS = { moisture: 'soil moisture', temperature: 'soil temperature', network: 'mesh traffic' };

var NODE_CSS =
  '.am-node-btn{position:absolute;width:36px;height:36px;margin:0;padding:0;' +
  'border-radius:9999px;border:3px solid #2f7a3d;background:#fffdf4;' +
  'color:#2c5a2e;font:700 14px/1 system-ui,-apple-system,sans-serif;cursor:pointer;' +
  'box-shadow:0 3px 0 rgba(60,40,10,.28),0 0 10px rgba(90,154,82,.55);transform:translate(-50%,-100%);' +
  'pointer-events:auto;transition:transform .15s,box-shadow .15s,border-color .2s;}' +
  '.am-node-btn::after{content:"";position:absolute;left:50%;bottom:-10px;transform:translateX(-50%);' +
  'width:0;height:0;border:6px solid transparent;border-top:8px solid #2f7a3d;}' +
  '.am-node-btn:hover{transform:translate(-50%,-100%) scale(1.12);' +
  'box-shadow:0 3px 0 rgba(60,40,10,.28),0 0 16px rgba(176,141,62,.7);}' +
  '.am-node-btn:focus-visible{outline:3px solid #b08d3e;outline-offset:2px;}' +
  '.am-node-btn.is-gateway{border-color:#b08d3e;background:#fff8e6;color:#6b4d12;width:42px;height:42px;font-size:16px;}' +
  '.am-node-btn.is-gateway::after{border-top-color:#b08d3e;}' +
  '.am-node-btn.is-offline{background:#e9e2d2;border-color:#a33333;border-style:dashed;color:#7a2a2a;' +
  'box-shadow:0 3px 0 rgba(60,20,10,.25);}' +
  '.am-node-btn.is-offline::after{border-top-color:#a33333;}' +
  '@media (prefers-reduced-motion:reduce){.am-node-btn:hover{transform:translate(-50%,-100%);}}';

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
    beatTimers: [],
    motes: [],            // dawn-atmosphere gold motes (sky band only)
    critters: [],         // butterflies (seeded; sky/field wanderers)
    clouds: [],           // drifting cloud shadows on the field (seeded)
    windmill: null        // {x, y, s} hub — set when the bg prerenders
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

  /* ---------------- game-board background (round 3) ---------------- */
  // Farm-sim game board: cheerful sky, puffy clouds, bright sun, lush crop
  // beds with growth stages, barn/silo/greenhouse/windmill, fence. Crop tint
  // is driven by the SAME frozen moisture blobs when the moisture layer is
  // active (the legend says so) — decorative; data stays in the contour
  // field + links + particles.
  function rr(x, px, py, pw, ph, rad) {
    x.beginPath();
    x.moveTo(px + rad, py);
    x.arcTo(px + pw, py, px + pw, py + ph, rad);
    x.arcTo(px + pw, py + ph, px, py + ph, rad);
    x.arcTo(px, py + ph, px, py, rad);
    x.arcTo(px, py, px + pw, py, rad);
    x.closePath();
  }

  // Dryness 0..1 at fractional coords, sampled from the frozen moisture blobs
  // (same data that paints the contour field).
  function moistureAt(fx, fy) {
    var blobs = (state.replay.blobs && state.replay.blobs.moisture) || [];
    var v = 0, i;
    for (i = 0; i < blobs.length; i++) {
      var b = blobs[i];
      var dx = fx - b.x, dy = fy - b.y;
      var d = Math.sqrt(dx * dx + dy * dy) / (b.r || 0.2);
      if (d < 1) {
        var f = Math.pow(1 - d, 1.5);
        if (b.v * f > v) v = b.v * f;
      }
    }
    return v;
  }

  // One game crop sprite. stage: 0 sprout, 1 bushy, 2 flowering, 3 ready.
  // dry (0..1): greens shift toward straw and leaves droop — honest, because
  // it is the simulated replay moisture, and the legend explains it.
  function drawCropSprite(x, gx, gy, s, stage, dry) {
    var g1 = dry > 0.66 ? '#c2a054' : (dry > 0.33 ? '#93b04a' : '#4da047');
    var g2 = dry > 0.66 ? '#9a7c3c' : (dry > 0.33 ? '#74903a' : '#37803a');
    var droop = dry > 0.66 ? 0.7 : 1;
    x.save();
    x.translate(gx, gy);
    if (dry > 0.66) x.rotate(0.12); // thirsty lean
    x.lineCap = 'round';
    var k, L;
    if (stage === 0) {
      x.strokeStyle = g1; x.lineWidth = Math.max(1.5, s * 0.14);
      x.beginPath(); x.moveTo(0, 0); x.lineTo(0, -s * 0.85 * droop); x.stroke();
      x.fillStyle = g1;
      x.beginPath(); x.ellipse(-s * 0.26, -s * 0.55 * droop, s * 0.30, s * 0.15, -0.5, 0, Math.PI * 2); x.fill();
      x.beginPath(); x.ellipse(s * 0.26, -s * 0.62 * droop, s * 0.30, s * 0.15, 0.5, 0, Math.PI * 2); x.fill();
    } else if (stage === 1) {
      x.fillStyle = g1;
      var leaves = [[0, -0.95, 0.60, 0.36, 0], [-0.52, -0.62, 0.52, 0.30, -0.6], [0.52, -0.62, 0.52, 0.30, 0.6], [-0.28, -0.34, 0.46, 0.30, -0.3], [0.28, -0.34, 0.46, 0.30, 0.3]];
      for (k = 0; k < leaves.length; k++) {
        L = leaves[k];
        x.beginPath();
        x.ellipse(L[0] * s, L[1] * s * droop, L[2] * s, L[3] * s, L[4], 0, Math.PI * 2);
        x.fill();
      }
      x.fillStyle = g2;
      x.beginPath(); x.ellipse(0, -s * 0.55 * droop, s * 0.30, s * 0.22, 0, 0, Math.PI * 2); x.fill();
    } else if (stage === 2) {
      x.fillStyle = g1;
      var lv = [[0, -0.9, 0.58, 0.34, 0], [-0.5, -0.6, 0.5, 0.3, -0.6], [0.5, -0.6, 0.5, 0.3, 0.6]];
      for (k = 0; k < lv.length; k++) {
        x.beginPath();
        x.ellipse(lv[k][0] * s, lv[k][1] * s * droop, lv[k][2] * s, lv[k][3] * s, lv[k][4], 0, Math.PI * 2);
        x.fill();
      }
      // blossoms: white petals, gold centers
      var bl = [[-0.3, -1.05], [0.25, -0.85], [0.02, -0.58]];
      for (k = 0; k < bl.length; k++) {
        var bx2 = bl[k][0] * s, by2 = bl[k][1] * s * droop, br = s * 0.22;
        x.fillStyle = '#ffffff';
        for (var p = 0; p < 5; p++) {
          var pa = (p / 5) * Math.PI * 2;
          x.beginPath(); x.arc(bx2 + Math.cos(pa) * br * 0.8, by2 + Math.sin(pa) * br * 0.8, br * 0.55, 0, Math.PI * 2); x.fill();
        }
        x.fillStyle = '#f2b73c';
        x.beginPath(); x.arc(bx2, by2, br * 0.5, 0, Math.PI * 2); x.fill();
      }
    } else {
      x.strokeStyle = '#cfa14a';
      x.lineWidth = Math.max(1.5, s * 0.1);
      for (var st = -1; st <= 1; st++) {
        x.beginPath();
        x.moveTo(st * s * 0.3, 0);
        x.quadraticCurveTo(st * s * 0.42, -s * 0.7 * droop, st * s * 0.3, -s * 1.15 * droop);
        x.stroke();
        x.fillStyle = '#e8c46a';
        x.beginPath();
        x.ellipse(st * s * 0.3, -s * 1.2 * droop, s * 0.16, s * 0.3, st * 0.2, 0, Math.PI * 2);
        x.fill();
      }
    }
    x.restore();
  }

  function drawBarn(x, bx, by, bw) {
    var bh = bw * 0.78;
    x.save();
    x.fillStyle = 'rgba(40,60,30,0.25)';
    x.beginPath(); x.ellipse(bx + bw * 0.55, by + 4, bw * 0.62, 8, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#c0392b';
    rr(x, bx, by - bh, bw, bh, 4); x.fill();
    x.fillStyle = '#8e2b20';
    x.beginPath();
    x.moveTo(bx - bw * 0.06, by - bh);
    x.lineTo(bx + bw * 0.5, by - bh - bw * 0.42);
    x.lineTo(bx + bw * 1.06, by - bh);
    x.closePath(); x.fill();
    x.fillStyle = '#a93226';
    x.beginPath();
    x.moveTo(bx + bw * 0.18, by - bh);
    x.lineTo(bx + bw * 0.5, by - bh - bw * 0.24);
    x.lineTo(bx + bw * 0.82, by - bh);
    x.closePath(); x.fill();
    var dw = bw * 0.34, dh = bh * 0.62, dx = bx + bw * 0.5 - dw / 2, dy = by - dh;
    x.fillStyle = '#f5efe2';
    x.fillRect(dx, dy, dw, dh);
    x.strokeStyle = '#c0392b'; x.lineWidth = Math.max(2, bw * 0.03);
    x.strokeRect(dx, dy, dw, dh);
    x.beginPath();
    x.moveTo(dx, dy); x.lineTo(dx + dw, dy + dh);
    x.moveTo(dx + dw, dy); x.lineTo(dx, dy + dh);
    x.stroke();
    x.fillStyle = '#f5efe2';
    x.beginPath(); x.arc(bx + bw * 0.5, by - bh - bw * 0.16, bw * 0.07, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#8e2b20'; x.lineWidth = 2; x.stroke();
    x.restore();
  }

  function drawSilo(x, sx, sy, sw) {
    var sh = sw * 2.6;
    x.save();
    x.fillStyle = '#cfd6da';
    rr(x, sx, sy - sh, sw, sh, sw * 0.28); x.fill();
    x.fillStyle = '#aab3b8';
    x.beginPath();
    x.ellipse(sx + sw / 2, sy - sh, sw / 2, sw * 0.32, 0, Math.PI, 0);
    x.fill();
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.fillRect(sx + sw * 0.22, sy - sh + 4, sw * 0.18, sh - 8);
    x.restore();
  }

  function drawGreenhouse(x, gx, gy, gw) {
    var gh = gw * 0.52;
    x.save();
    x.fillStyle = 'rgba(40,60,30,0.22)';
    x.beginPath(); x.ellipse(gx + gw * 0.5, gy + 3, gw * 0.56, 7, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(214,236,244,0.92)';
    x.beginPath();
    x.moveTo(gx, gy);
    x.lineTo(gx, gy - gh * 0.55);
    x.quadraticCurveTo(gx, gy - gh, gx + gw * 0.5, gy - gh);
    x.quadraticCurveTo(gx + gw, gy - gh, gx + gw, gy - gh * 0.55);
    x.lineTo(gx + gw, gy);
    x.closePath(); x.fill();
    x.strokeStyle = '#f5f2e8'; x.lineWidth = Math.max(2, gw * 0.03);
    x.stroke();
    x.strokeStyle = 'rgba(120,150,160,0.8)'; x.lineWidth = 1.5;
    for (var k = 1; k < 4; k++) {
      var rx = gx + (gw * k) / 4;
      x.beginPath(); x.moveTo(rx, gy); x.lineTo(rx, gy - gh * 0.86); x.stroke();
    }
    x.fillStyle = '#4da047';
    for (var p = 0; p < 6; p++) {
      var px = gx + gw * (0.12 + p * 0.15);
      x.beginPath(); x.ellipse(px, gy - 10, 5, 8, 0, 0, Math.PI * 2); x.fill();
    }
    x.restore();
  }

  function drawWindmillBase(x, wx, wy, s) {
    x.save();
    x.fillStyle = '#9a8a72';
    x.beginPath();
    x.moveTo(wx - s * 0.16, wy + s * 1.5);
    x.lineTo(wx - s * 0.07, wy);
    x.lineTo(wx + s * 0.07, wy);
    x.lineTo(wx + s * 0.16, wy + s * 1.5);
    x.closePath(); x.fill();
    x.strokeStyle = '#6f6151'; x.lineWidth = 2;
    x.beginPath();
    x.moveTo(wx - s * 0.115, wy + s * 0.75); x.lineTo(wx + s * 0.115, wy + s * 0.75);
    x.moveTo(wx - s * 0.135, wy + s * 1.1); x.lineTo(wx + s * 0.135, wy + s * 1.1);
    x.stroke();
    x.fillStyle = '#5d5348';
    x.beginPath(); x.arc(wx, wy, s * 0.09, 0, Math.PI * 2); x.fill();
    x.restore();
  }

  function renderBackground(w, h, layer) {
    var c = doc.createElement('canvas');
    c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
    var x = c.getContext('2d');
    if (!x) return null;
    var skyH = h * 0.22;
    var i, j;

    // cheerful game-dawn sky
    var g = x.createLinearGradient(0, 0, 0, skyH);
    g.addColorStop(0, '#a8d8f0');
    g.addColorStop(0.6, '#d8ecf7');
    g.addColorStop(1, '#fdeecd');
    x.fillStyle = g;
    x.fillRect(0, 0, w, skyH);

    // bright game sun with rays
    var sunX = w * 0.74, sunY = skyH * 0.5, sunR = Math.min(w, h) * 0.045;
    x.save();
    x.strokeStyle = 'rgba(255,196,90,0.75)';
    x.lineWidth = Math.max(2, sunR * 0.12);
    x.lineCap = 'round';
    for (i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2 + 0.2;
      x.beginPath();
      x.moveTo(sunX + Math.cos(a) * sunR * 1.45, sunY + Math.sin(a) * sunR * 1.45);
      x.lineTo(sunX + Math.cos(a) * sunR * 1.9, sunY + Math.sin(a) * sunR * 1.9);
      x.stroke();
    }
    var sg = x.createRadialGradient(sunX, sunY, sunR * 0.3, sunX, sunY, sunR * 2.6);
    sg.addColorStop(0, 'rgba(255,224,150,0.9)');
    sg.addColorStop(1, 'rgba(255,224,150,0)');
    x.fillStyle = sg;
    x.fillRect(sunX - sunR * 2.6, sunY - sunR * 2.6, sunR * 5.2, sunR * 5.2);
    x.fillStyle = '#ffd968';
    x.beginPath(); x.arc(sunX, sunY, sunR, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffdf8a';
    x.beginPath(); x.arc(sunX - sunR * 0.2, sunY - sunR * 0.2, sunR * 0.72, 0, Math.PI * 2); x.fill();
    x.restore();

    // puffy cartoon clouds (static)
    var cloud = function (cx, cy, s) {
      x.save();
      x.fillStyle = 'rgba(255,255,255,0.95)';
      var puff = [[0, 0, 1], [-1.1, 0.25, 0.72], [1.1, 0.25, 0.78], [-0.45, -0.42, 0.62], [0.5, -0.38, 0.66]];
      for (var k = 0; k < puff.length; k++) {
        x.beginPath();
        x.arc(cx + puff[k][0] * s, cy + puff[k][1] * s, puff[k][2] * s, 0, Math.PI * 2);
        x.fill();
      }
      x.fillStyle = 'rgba(190,214,228,0.5)';
      x.beginPath();
      x.ellipse(cx, cy + s * 0.62, s * 1.55, s * 0.34, 0, 0, Math.PI * 2);
      x.fill();
      x.restore();
    };
    cloud(w * 0.16, skyH * 0.34, w * 0.035);
    cloud(w * 0.44, skyH * 0.55, w * 0.026);
    cloud(w * 0.90, skyH * 0.66, w * 0.030);

    // lush field base
    g = x.createLinearGradient(0, skyH, 0, h);
    g.addColorStop(0, '#8fce6e');
    g.addColorStop(0.5, '#79c25f');
    g.addColorStop(1, '#5da84c');
    x.fillStyle = g;
    x.fillRect(0, skyH, w, h - skyH);

    // horizon glow strip
    x.fillStyle = 'rgba(255,244,214,0.5)';
    x.fillRect(0, skyH - 2, w, 4);

    // crop beds: 6 rounded game tiles in perspective, each with a seeded
    // growth stage (patchwork farm look)
    var rnd = seededRand(777);
    var bedStages = [];
    for (i = 0; i < 6; i++) bedStages.push(Math.floor(rnd() * 4));
    for (i = 0; i < 6; i++) {
      var t = i / 5;
      var by = skyH + (h - skyH) * (0.10 + t * 0.72);
      var bh = (h - skyH) * (0.085 + t * 0.035);
      var bx = w * (0.05 + t * 0.015), bw = w * (0.90 - t * 0.03);
      x.fillStyle = 'rgba(62,110,52,0.55)';
      rr(x, bx - 3, by - 3, bw + 6, bh + 8, 10);
      x.fill();
      x.fillStyle = '#6b4a2e';
      rr(x, bx, by, bw, bh, 9);
      x.fill();
      x.fillStyle = '#7d5a38';
      rr(x, bx, by, bw, bh * 0.38, 9);
      x.fill();
      for (var rI = 0; rI < 2; rI++) {
        var ry = by + bh * (0.30 + rI * 0.42);
        var n = Math.max(4, Math.round(bw / (34 - t * 14)));
        for (j = 0; j < n; j++) {
          var px = bx + (bw * (j + 0.5)) / n;
          var s = (10 + t * 16) * (0.9 + rnd() * 0.25);
          var dry = (layer === 'moisture') ? moistureAt(px / w, ry / h) : 0;
          drawCropSprite(x, px, ry, s, bedStages[i], dry);
        }
      }
    }

    // farm buildings + windmill (blades drawn per-frame)
    drawBarn(x, w * 0.045, h * 0.865, w * 0.115);
    drawSilo(x, w * 0.175, h * 0.865, w * 0.045);
    drawGreenhouse(x, w * 0.815, h * 0.865, w * 0.13);
    state.windmill = { x: w * 0.905, y: h * 0.335, s: Math.min(w, h) * 0.075 };
    drawWindmillBase(x, state.windmill.x, state.windmill.y, state.windmill.s);

    // wooden fence along the bottom
    var fy = h * 0.975;
    x.fillStyle = '#8a6a44';
    x.fillRect(0, fy - 6, w, 5);
    x.fillRect(0, fy + 8, w, 5);
    x.fillStyle = '#9c7a4f';
    for (i = 0; i * 46 < w + 46; i++) {
      x.fillRect(i * 46, fy - 14, 9, 30);
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

  /* ---------------- game props: critters, pads, posts, farmhouse --- */
  // Seeded butterflies + drifting cloud shadows. Decorative only.
  function initCritters() {
    var rnd = seededRand(4242);
    state.clouds = [];
    var i;
    for (i = 0; i < 2; i++) {
      state.clouds.push({ x: 0.25 + rnd() * 0.5, y: 0.25 + rnd() * 0.5, r: 0.16 + rnd() * 0.08, a: 0.10, speed: 0.05 + rnd() * 0.05, phase: rnd() * 6.283 });
    }
    state.critters = [];
    for (i = 0; i < 5; i++) {
      state.critters.push({
        x: 0.15 + rnd() * 0.7, y: 0.35 + rnd() * 0.45,
        s: 3 + rnd() * 2.5,
        phase: rnd() * 6.283,
        speed: 0.35 + rnd() * 0.4,
        hue: rnd() < 0.5 ? '255,170,60' : '150,190,255'
      });
    }
  }

  // Soft drifting shade on the field — drawn over the field layer, under links.
  function drawCloudShadows(tSec, animate) {
    var W = state.W, H = state.H, skyH = H * 0.22;
    for (var i = 0; i < state.clouds.length; i++) {
      var cl = state.clouds[i];
      var drift = animate ? Math.sin(tSec * cl.speed + cl.phase) * W * 0.06 : 0;
      var cx = cl.x * W + drift, cy = skyH + cl.y * (H - skyH);
      var R = cl.r * Math.min(W, H);
      var g = ctx.createRadialGradient(cx, cy, 4, cx, cy, R);
      g.addColorStop(0, 'rgba(40,70,90,' + cl.a.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(40,70,90,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(cx, cy, R, R * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCritters(tSec, animate) {
    var W = state.W, H = state.H, skyH = H * 0.22;
    for (var i = 0; i < state.critters.length; i++) {
      var b = state.critters[i];
      var wx = animate ? Math.sin(tSec * b.speed + b.phase) * W * 0.05 : 0;
      var wy = animate ? Math.cos(tSec * b.speed * 0.8 + b.phase) * H * 0.03 : 0;
      var bx = b.x * W + wx, by = skyH + b.y * (H - skyH) + wy - H * 0.06;
      var flap = animate ? Math.abs(Math.sin(tSec * 9 + b.phase)) : 0.35;
      ctx.save();
      ctx.translate(bx, by);
      ctx.fillStyle = 'rgba(' + b.hue + ',0.95)';
      ctx.save();
      ctx.rotate(-0.5 - flap * 0.5);
      ctx.beginPath(); ctx.ellipse(-b.s * 0.5, 0, b.s * 0.62, b.s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save();
      ctx.rotate(0.5 + flap * 0.5);
      ctx.beginPath(); ctx.ellipse(b.s * 0.5, 0, b.s * 0.62, b.s * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(60,50,40,0.9)';
      ctx.beginPath(); ctx.ellipse(0, 0, b.s * 0.16, b.s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function drawWindmillBlades(tSec, animate) {
    var wm = state.windmill;
    if (!wm) return;
    var ang = animate ? tSec * 0.9 : 0.4;
    ctx.save();
    ctx.translate(wm.x, wm.y);
    ctx.fillStyle = 'rgba(240,235,220,0.95)';
    ctx.strokeStyle = '#8a7a63';
    ctx.lineWidth = 1.5;
    for (var i = 0; i < 4; i++) {
      ctx.save();
      ctx.rotate(ang + (i * Math.PI) / 2);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(wm.s * 0.14, -wm.s * 0.75);
      ctx.lineTo(wm.s * 0.30, -wm.s * 0.72);
      ctx.lineTo(wm.s * 0.10, 0);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = '#5d5348';
    ctx.beginPath(); ctx.arc(0, 0, wm.s * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // In-world node objects, drawn under the HTML game-token buttons (which are
  // anchored bottom-center at each node point). Online = cheerful + blinking
  // LED; offline = grayed "storm damage" with a dashed red ring.
  function drawGameProps(tSec, animate) {
    for (var i = 0; i < state.nodes.length; i++) {
      var n = state.nodes[i];
      var p = state.nodePx[n.id];
      if (!p) continue;
      var on = isOnline(n.id);
      if (n.gateway) drawFarmhouse(p.x, p.y, on, tSec, animate);
      else drawSensorPost(p.x, p.y, on, tSec, animate, n.id);
    }
    drawWindmillBlades(tSec, animate);
    drawCritters(tSec, animate);
  }

  function drawPad(px, py, on) {
    ctx.save();
    if (on) {
      var g = ctx.createRadialGradient(px, py, 2, px, py, 20);
      g.addColorStop(0, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(px, py, 20, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(px, py, 15, 0, Math.PI * 2); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(163,51,51,0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath(); ctx.arc(px, py, 17, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawSensorPost(px, py, on, tSec, animate, id) {
    drawPad(px, py, on);
    ctx.save();
    ctx.strokeStyle = on ? '#7a6a55' : '#8a8078';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(px, py + 30); ctx.stroke();
    // tilted solar panel
    ctx.save();
    ctx.translate(px, py + 22);
    ctx.rotate(-0.35);
    ctx.fillStyle = on ? '#2e4a6b' : '#7a7f88';
    ctx.fillRect(-11, -7, 22, 14);
    ctx.strokeStyle = on ? '#1d2f47' : '#5c6167';
    ctx.lineWidth = 2;
    ctx.strokeRect(-11, -7, 22, 14);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-11, 0); ctx.lineTo(11, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, 7); ctx.stroke();
    ctx.restore();
    // status LED: blinking green online, dull red offline
    var blink = on ? (animate ? (0.55 + 0.45 * Math.sin(tSec * 4 + id)) : 0.8) : 0.25;
    ctx.fillStyle = on ? 'rgba(90,220,120,' + blink.toFixed(2) + ')' : 'rgba(150,60,60,0.7)';
    ctx.beginPath(); ctx.arc(px + 7, py + 12, 3.2, 0, Math.PI * 2); ctx.fill();
    if (on && animate) {
      ctx.fillStyle = 'rgba(90,220,120,0.25)';
      ctx.beginPath(); ctx.arc(px + 7, py + 12, 6.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawFarmhouse(px, py, on, tSec, animate) {
    drawPad(px, py, on);
    var w = 64, h = 40;
    var bx = px - w / 2, by = py + 6;
    ctx.save();
    ctx.fillStyle = 'rgba(40,60,30,0.28)';
    ctx.beginPath(); ctx.ellipse(px, by + h + 4, w * 0.62, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = on ? '#f7f0dd' : '#cfc8b8';
    rr(ctx, bx, by, w, h, 5); ctx.fill();
    ctx.strokeStyle = on ? '#b08d3e' : '#8a8578';
    ctx.lineWidth = 2.5;
    rr(ctx, bx, by, w, h, 5); ctx.stroke();
    // roof
    ctx.fillStyle = on ? '#c0392b' : '#8a6a62';
    ctx.beginPath();
    ctx.moveTo(bx - 6, by + 2);
    ctx.lineTo(px, by - 22);
    ctx.lineTo(bx + w + 6, by + 2);
    ctx.closePath(); ctx.fill();
    // dish on the roof — the mesh hub
    ctx.strokeStyle = on ? '#4a4a52' : '#777777';
    ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(px + 10, by - 14); ctx.lineTo(px + 18, by - 30); ctx.stroke();
    ctx.fillStyle = on ? '#e8e4d8' : '#a09a8c';
    ctx.beginPath(); ctx.arc(px + 20, by - 32, 7, Math.PI * 0.9, Math.PI * 1.9); ctx.fill();
    ctx.strokeStyle = on ? '#4a4a52' : '#777777'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px + 20, by - 32, 7, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke();
    // door + windows
    ctx.fillStyle = on ? '#7a5230' : '#6a625a';
    rr(ctx, px - 8, by + h - 22, 16, 22, 3); ctx.fill();
    ctx.fillStyle = on ? '#bfe3f2' : '#9aa2a8';
    ctx.fillRect(bx + 8, by + 10, 12, 10);
    ctx.fillRect(bx + w - 20, by + 10, 12, 10);
    // chimney smoke (cheerful, animated)
    if (on && animate) {
      for (var k = 0; k < 3; k++) {
        var u = ((tSec * 0.35 + k / 3) % 1);
        var sx = bx + w * 0.78 + Math.sin(u * 5) * 6;
        var sy2 = by - 8 - u * 34;
        ctx.fillStyle = 'rgba(235,235,235,' + (0.5 * (1 - u)).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(sx, sy2, 3 + u * 5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---------------- dawn atmosphere (cinematic pass) ---------------- */
  // Decorative sky-band-only layer: sun-glow pulse, drifting gold motes,
  // light-ray wash, drone flyover. Never touches the data field; never moves
  // data. Motes are seeded so static frames are deterministic.
  function seededRand(seed) {
    var s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }

  function initAtmosphere() {
    state.motes = [];
    var rnd = seededRand(20330);
    for (var i = 0; i < 40; i++) {
      state.motes.push({
        x: rnd(), y: rnd(),            // sky-band fractions
        r: 1 + rnd() * 1.8,
        phase: rnd() * 6.283,
        speed: 0.25 + rnd() * 0.5
      });
    }
  }

  function drawAtmosphere(tSec, animate) {
    var W = state.W, H = state.H;
    var skyH = H * 0.16;
    if (skyH <= 0) return;
    var pulse = animate ? 0.5 + 0.5 * Math.sin(tSec * 0.5) : 0.5;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, skyH + 2); ctx.clip();

    // gently pulsing sun glow
    var g = ctx.createRadialGradient(W * 0.72, skyH * 0.55, 4, W * 0.72, skyH * 0.55, W * 0.34);
    g.addColorStop(0, 'rgba(255,196,120,' + (0.10 + 0.06 * pulse).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(255,196,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, skyH + 2);

    // soft diagonal light-ray wash
    var rayA = (0.05 + 0.02 * pulse).toFixed(3);
    ctx.save();
    ctx.translate(W * 0.5, skyH * 0.5);
    ctx.rotate(0.42);
    var band = function (off, wdt, alpha) {
      var lg = ctx.createLinearGradient(-wdt / 2, 0, wdt / 2, 0);
      lg.addColorStop(0, 'rgba(255,244,214,0)');
      lg.addColorStop(0.5, 'rgba(255,244,214,' + alpha + ')');
      lg.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.fillStyle = lg;
      ctx.fillRect(off - wdt / 2, -skyH * 2, wdt, skyH * 4);
    };
    band(-W * 0.16, W * 0.09, rayA);
    band(W * 0.10, W * 0.15, (rayA * 0.7).toFixed(3));
    ctx.restore();

    // drifting gold motes — sky band only
    ctx.globalCompositeOperation = 'lighter';
    var i;
    for (i = 0; i < state.motes.length; i++) {
      var m = state.motes[i];
      var dy = animate ? Math.sin(tSec * m.speed + m.phase) * 7 : 0;
      var ma = animate ? 0.10 + 0.09 * (0.5 + 0.5 * Math.sin(tSec * m.speed * 1.3 + m.phase)) : 0.14;
      ctx.fillStyle = 'rgba(232,178,84,' + ma.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(m.x * W, m.y * skyH + dy, m.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  function buildStaticCanvases() {
    var w = Math.round(state.W * state.dpr), h = Math.round(state.H * state.dpr);
    state.bgCanvas = renderBackground(w, h, state.layer); // crop tint follows the layer
    state.fieldCanvas = buildFieldLayer(state.layer, w, h);
  }

  /* ---------------- frame render ---------------- */
  /* Links: bloom feel — a wide low-alpha halo pass (additive) under a
     narrow bright core pass (normal blend, kept legible in daylight). */
  function drawLinks() {
    var gain = state.layer === 'network' ? 1 : 0.45; // traffic emphasis per layer
    var i, l, a, b, on;
    // halo pass
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (i = 0; i < state.links.length; i++) {
      l = state.links[i];
      a = state.nodePx[l.a]; b = state.nodePx[l.b];
      if (!a || !b) continue;
      on = isOnline(l.a) && isOnline(l.b);
      if (on) {
        ctx.strokeStyle = 'rgba(150,205,120,' + (0.10 + 0.18 * l.health * gain).toFixed(3) + ')';
        ctx.lineWidth = 6 + 4 * l.health * gain;
      } else {
        ctx.strokeStyle = 'rgba(150,140,120,0.08)';
        ctx.lineWidth = 5;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
    // core pass
    ctx.save();
    ctx.lineCap = 'round';
    for (i = 0; i < state.links.length; i++) {
      l = state.links[i];
      a = state.nodePx[l.a]; b = state.nodePx[l.b];
      if (!a || !b) continue;
      on = isOnline(l.a) && isOnline(l.b);
      if (on) {
        ctx.strokeStyle = 'rgba(52,112,62,' + (0.35 + 0.55 * l.health * gain).toFixed(3) + ')';
        ctx.lineWidth = 1 + 1.6 * l.health * gain;
      } else {
        ctx.strokeStyle = 'rgba(130,118,96,0.30)';
        ctx.lineWidth = 1;
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Packets as game units: every ~60th active particle renders as a cute
     quadcopter drone flying its REAL BFS route (a delivery/monitoring run) —
     the packet flow reads as gameplay. Motion data unchanged; only the
     sprite differs. */
  var DRONE_EVERY = 60;

  function drawParticles(tSec, animate) {
    var alpha = state.layer === 'network' ? 1 : 0.32;
    var i, p, pos, di;
    // halo pass (dots only — drones skip it)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    di = 0;
    for (i = 0; i < state.particles.length; i++) {
      p = state.particles[i];
      if (!p.active || p.route.length < 2) continue;
      if (di++ % DRONE_EVERY === 0) continue;
      pos = particlePos(p);
      ctx.fillStyle = 'rgba(120,200,110,' + (0.20 * alpha).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // core pass: dots + drone units
    ctx.save();
    di = 0;
    for (i = 0; i < state.particles.length; i++) {
      p = state.particles[i];
      if (!p.active || p.route.length < 2) continue;
      pos = particlePos(p);
      if (di++ % DRONE_EVERY === 0) { drawPatrolDrone(pos.x, pos.y, tSec, animate, alpha); continue; }
      ctx.fillStyle = 'rgba(38,102,52,' + alpha.toFixed(2) + ')';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPatrolDrone(dx, dy, tSec, animate, alpha) {
    ctx.save();
    ctx.globalAlpha = Math.max(0.35, alpha);
    // soft shadow on the field — sells the 3D game feel
    ctx.fillStyle = 'rgba(40,60,30,0.22)';
    ctx.beginPath();
    ctx.ellipse(dx + 7, dy + 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(dx, dy);
    if (animate) ctx.translate(0, Math.sin(tSec * 3 + dx * 0.05) * 1.5);
    // rotor arms
    ctx.strokeStyle = '#4a5560';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-9, -6); ctx.lineTo(-13, -10);
    ctx.moveTo(9, -6); ctx.lineTo(13, -10);
    ctx.moveTo(-9, 6); ctx.lineTo(-13, 10);
    ctx.moveTo(9, 6); ctx.lineTo(13, 10);
    ctx.stroke();
    // spinning rotors
    var ra = animate ? tSec * 28 : 0.6;
    ctx.fillStyle = 'rgba(220,230,238,0.75)';
    var rotors = [[-13, -10], [13, -10], [-13, 10], [13, 10]];
    for (var k = 0; k < 4; k++) {
      ctx.save();
      ctx.translate(rotors[k][0], rotors[k][1]);
      ctx.rotate(ra + k * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // body
    ctx.fillStyle = '#ffffff';
    rr(ctx, -9, -6, 18, 12, 5); ctx.fill();
    ctx.strokeStyle = '#2e9e8f';
    ctx.lineWidth = 2;
    rr(ctx, -9, -6, 18, 12, 5); ctx.stroke();
    // camera eye
    ctx.fillStyle = '#2e9e8f';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bff0e8';
    ctx.beginPath(); ctx.arc(-1, -1, 1.2, 0, Math.PI * 2); ctx.fill();
    // parcel slung below — the "delivery"
    ctx.strokeStyle = '#8a6a44';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-4, 6); ctx.lineTo(-4, 12); ctx.moveTo(4, 6); ctx.lineTo(4, 12); ctx.stroke();
    ctx.fillStyle = '#d9a94e';
    ctx.fillRect(-6, 12, 12, 8);
    ctx.strokeStyle = '#a87f3a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-6, 12, 12, 8);
    ctx.restore();
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

  /* tSec: wall-clock seconds for atmosphere animation. animate=false
     renders the resting state (motes at rest, drone hidden) for static
     and reduced-motion frames. */
  function renderFrame(tSec, animate) {
    if (!ctx || state.W <= 0) return;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    if (state.bgCanvas) ctx.drawImage(state.bgCanvas, 0, 0, state.W, state.H);
    if (state.fieldCanvas) {
      ctx.globalAlpha = state.layer === 'network' ? 0.35 : 1;
      ctx.drawImage(state.fieldCanvas, 0, 0, state.W, state.H);
      ctx.globalAlpha = 1;
    }
    drawCloudShadows(tSec, animate); // drifting shade on the field
    drawLinks();
    drawParticles(tSec, animate);    // dots + patrol-drone game units
    drawGameProps(tSec, animate);    // pads, sensor posts, farmhouse, windmill, butterflies
    drawAtmosphere(tSec, animate); // sky-band only; decorative, moves no data
    drawWatermark(); // every frame, permanent
  }

  // One deterministic resting frame for static-first / reduced-motion paths.
  function staticRender() { renderFrame(0, false); }

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
    renderFrame(now / 1000, true);
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
    if (state.W > 0) {
      buildStaticCanvases(); // bg crop tint follows the moisture layer
      if (!shouldRun()) staticRender(); // keep the static frame fresh when the loop is off
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
    staticRender();
  }

  function healNode(id, scripted) {
    var n = state.nodeById[id];
    if (!n || isOnline(id)) return;
    delete state.offline[id];
    refreshNodeButton(n);
    rerouteParticles();
    narrate('Node ' + id + ' back online' + (scripted ? ' (simulated)' : '') + '. Mesh healed.');
    staticRender();
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
      initAtmosphere();
      initCritters();

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
      staticRender(); // one frame always: static modes stop here

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
        win.addEventListener('resize', function () { resize(); staticRender(); });
      }

      updateRunning();
      return state;
    }).catch(function (e) {
      if (typeof console !== 'undefined') console.error('AMTWIN-START-FAIL', e && e.stack || e);
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
    } catch (e) { if (typeof console !== 'undefined') console.error('AMTWIN-BOOT-FAIL', e && e.stack || e); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}

/* ---------------- node/test export ---------------- */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { createTwin: createTwin, FALLBACK_REPLAY: FALLBACK_REPLAY, WATERMARK: WATERMARK };
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
