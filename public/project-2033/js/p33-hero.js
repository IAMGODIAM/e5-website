/* ============================================================
   p33-hero.js — "The Compounding Vault" hero for Project 2033
   Gold-mote depth field (interest accruing) + slow vault dial
   (gold torus, counter-rotating ring, ledger tick marks).
   Decorative only: canvas is aria-hidden, injected by script.
   Fail-closed per subsystem — never breaks the page.
   Ladder: reduced-motion / no-WebGL / no-THREE  -> static poster
           saveData or hwConcurrency<=4          -> one static frame
   ============================================================ */
(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* 1–3: reduced motion / no WebGL / no THREE -> static poster hero */
if (reduced) return;
if (!('WebGLRenderingContext' in window)) return;

var hero = document.querySelector('.p33-hero');
if (!hero) return;

var saveData = false, weakCpu = false;
try {
  saveData = !!(navigator.connection && navigator.connection.saveData);
  weakCpu = (navigator.hardwareConcurrency || 8) <= 4;
} catch (e) {}

function boot() {
  if (typeof window.THREE === 'undefined') return; /* static poster */
  try { initScene(); } catch (e) { /* hero stays static; never break */ }
  /* mark live only once the canvas exists */
  if (hero.querySelector('canvas.p33-hero-canvas')) {
    docEl.classList.add('p33-live');
  }
}

/* defer init until idle so first paint is never blocked by Three */
try {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(function () { boot(); }, { timeout: 2500 });
  } else {
    setTimeout(boot, 400);
  }
} catch (e) { setTimeout(boot, 400); }

function initScene() {
  var T = window.THREE;

  var canvas = document.createElement('canvas');
  canvas.className = 'p33-hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  } catch (e) { canvas.remove(); return; /* no WebGL: static hero */ }
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(52, 1, 0.1, 160);
  camera.position.set(0, 0, 34);
  camera.lookAt(6, 0, -8);

  /* soft radial sprite, procedural — no external asset */
  function makeSprite() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  var sprite = makeSprite();

  var GOLD = new T.Color(0xd9a84e), PALE = new T.Color(0xe9d3a0), DEEP = new T.Color(0x8a6d2b);

  function makeField(count, size, opacity, spread) {
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var vel = new Float32Array(count * 2); /* rise speed, sway phase */
    var palette = [GOLD, GOLD, PALE, DEEP];
    for (var i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() * 2 - 1) * spread.x;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * spread.y;
      pos[i * 3 + 2] = -40 + Math.random() * 46; /* z -40..6 */
      var c = palette[(Math.random() * palette.length) | 0];
      var dim = 0.45 + Math.random() * 0.55;
      col[i * 3] = c.r * dim; col[i * 3 + 1] = c.g * dim; col[i * 3 + 2] = c.b * dim;
      vel[i * 2] = 0.25 + Math.random() * 0.9;      /* slow rise */
      vel[i * 2 + 1] = Math.random() * Math.PI * 2;
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    var mat = new T.PointsMaterial({
      size: size, map: sprite, vertexColors: true, transparent: true,
      opacity: 0, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true
    });
    var pts = new T.Points(geo, mat);
    pts.frustumCulled = false;
    return { pts: pts, mat: mat, vel: vel, count: count, max: count, spread: spread, baseOpacity: opacity };
  }

  var mobile = false;
  try { mobile = window.matchMedia('(max-width: 640px)').matches; } catch (e) {}
  var budget = mobile ? 180 : 500;
  var motes = makeField(budget, 0.5, 0.7, { x: 44, y: 26 });
  var glow  = makeField(mobile ? 60 : 140, 1.4, 0.28, { x: 40, y: 24 });
  scene.add(motes.pts); scene.add(glow.pts);

  /* the vault dial — right-of-copy, tilted, slow ceremonial turn */
  var world = new T.Group();
  var goldMat = new T.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0 });
  var dial = new T.Mesh(new T.TorusGeometry(9.2, 0.06, 12, 160), goldMat);
  var faintMat = new T.MeshBasicMaterial({ color: 0x8a6d2b, transparent: true, opacity: 0 });
  var ring2 = new T.Mesh(new T.TorusGeometry(11.6, 0.035, 12, 160), faintMat);
  dial.rotation.x = Math.PI / 2.35; dial.rotation.y = 0.3;
  ring2.rotation.x = Math.PI / 1.85; ring2.rotation.y = -0.45;
  world.add(dial); world.add(ring2);

  /* ledger tick marks on the main dial — ~60 short line segments */
  var tickGeo = new T.BufferGeometry();
  var tickPos = new Float32Array(60 * 2 * 3);
  var R = 9.2;
  for (var ti = 0; ti < 60; ti++) {
    var a = (ti / 60) * Math.PI * 2;
    var ca = Math.cos(a), sa = Math.sin(a);
    var r0 = R - (ti % 5 === 0 ? 0.9 : 0.45), r1 = R + 0.02;
    tickPos[ti * 6]     = ca * r0; tickPos[ti * 6 + 1] = sa * r0; tickPos[ti * 6 + 2] = 0;
    tickPos[ti * 6 + 3] = ca * r1; tickPos[ti * 6 + 4] = sa * r1; tickPos[ti * 6 + 5] = 0;
  }
  tickGeo.setAttribute('position', new T.BufferAttribute(tickPos, 3));
  var tickMat = new T.LineBasicMaterial({ color: 0xc9a24a, transparent: true, opacity: 0 });
  var ticks = new T.LineSegments(tickGeo, tickMat);
  ticks.rotation.x = Math.PI / 2.35; ticks.rotation.y = 0.3;
  world.add(ticks);

  var dialX = mobile ? 0 : 13;
  var dialY = mobile ? -3.5 : 0; /* mobile: sink the dial behind the horizon glass, clear of the deck copy */
  var dialDim = mobile ? 0.55 : 1; /* mobile: dial sits behind the copy — keep it faint */
  world.position.set(dialX, dialY, -10);
  scene.add(world);

  function size() {
    var w = hero.clientWidth || 1, h = hero.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  size();
  var resizeT = null;
  window.addEventListener('resize', function () {
    if (resizeT) clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      try {
        mobile = window.matchMedia('(max-width: 640px)').matches;
        world.position.x = mobile ? 0 : 13;
        world.position.y = mobile ? -3.5 : 0;
        dialDim = mobile ? 0.55 : 1;
      } catch (e) {}
      size();
    }, 180);
  });

  /* pointer drift (desktop fine pointers, hero in view only) */
  var px = 0, py = 0, tx = 0, ty = 0, finePointer = false;
  try {
    finePointer = window.matchMedia('(pointer: fine)').matches;
    if (finePointer) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; }, { passive: true });
    }
  } catch (e) {}

  /* FPS governor: halve the mote budget if frames run hot (floor 120) */
  var frameTimes = [], governorArmed = false, degraded = false;
  function govern(dtMs) {
    if (degraded) return;
    frameTimes.push(dtMs);
    if (frameTimes.length < 60) return;
    var sum = 0;
    for (var i = 0; i < frameTimes.length; i++) sum += frameTimes[i];
    var avg = sum / frameTimes.length;
    frameTimes.length = 0;
    if (avg > 40) {
      var fields = [motes, glow];
      for (var f = 0; f < fields.length; f++) {
        var F = fields[f];
        var next = Math.max(120, Math.floor(F.count / 2));
        if (next < F.count) {
          F.count = next;
          F.pts.geometry.setDrawRange(0, next);
        }
      }
      /* drop the costly extras first: ticks and the second ring */
      ticks.visible = false;
      ring2.visible = false;
      if (motes.count <= 120) degraded = true;
    }
  }

  var heroVisible = true, rafId = null, last = 0, ignite = 0, fade = 1;
  var heroH = hero.clientHeight || 900;

  function draw(now) {
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var t = now / 1000;

    if (ignite < 1) ignite = Math.min(1, ignite + dt / 2.4);
    var ie = ignite * ignite;

    var fields = [motes, glow];
    for (var f = 0; f < fields.length; f++) {
      var F = fields[f], p = F.pts.geometry.attributes.position.array;
      for (var i = 0; i < F.count; i++) {
        var ix = i * 3;
        p[ix + 1] += F.vel[i * 2] * dt;
        p[ix] += Math.sin(t * 0.7 + F.vel[i * 2 + 1]) * dt * 0.32;
        if (p[ix + 1] > F.spread.y + 2) {
          p[ix + 1] = -F.spread.y - 2;
          p[ix] = (Math.random() * 2 - 1) * F.spread.x;
        }
      }
      F.pts.geometry.attributes.position.needsUpdate = true;
      F.mat.opacity = F.baseOpacity * ie * fade;
    }

    /* vault dial: slow ceremonial turn */
    world.rotation.z += dt * 0.045;
    dial.rotation.z += dt * 0.02;
    ring2.rotation.z -= dt * 0.014;
    goldMat.opacity = 0.8 * ie * fade * dialDim;
    faintMat.opacity = 0.34 * ie * fade * dialDim;
    tickMat.opacity = 0.55 * ie * fade * dialDim;

    /* camera drift toward the pointer, lerped */
    px += (tx - px) * Math.min(1, dt * 2.2);
    py += (ty - py) * Math.min(1, dt * 2.2);
    camera.position.x = px * 1.6;
    camera.position.y = -py * 1.0;
    camera.lookAt(dialX * 0.4, 0, -8);

    /* fade the stage as the hero scrolls away */
    var y = window.scrollY || window.pageYOffset || 0;
    var target = Math.max(0, Math.min(1, 1 - y / (heroH * 0.92)));
    fade += (target - fade) * Math.min(1, dt * 5);

    renderer.render(scene, camera);
  }

  /* static single frame for saveData / weak CPUs */
  if (saveData || weakCpu) {
    try {
      ignite = 1;
      draw(performance.now() + 2400);
      canvas.classList.add('in');
    } catch (e) { canvas.remove(); docEl.classList.remove('p33-live'); }
    return;
  }

  function loop(now) {
    rafId = null;
    if (document.hidden || !heroVisible) return; /* parked; re-armed by observers */
    rafId = requestAnimationFrame(loop);
    var t0 = performance.now();
    draw(now);
    govern(performance.now() - t0);
  }
  function kick() {
    if (rafId !== null || document.hidden || !heroVisible) return;
    last = performance.now();
    rafId = requestAnimationFrame(loop);
  }

  try {
    var vio = new IntersectionObserver(function (es) {
      for (var k = 0; k < es.length; k++) {
        heroVisible = es[k].isIntersecting;
        if (heroVisible) kick();
      }
    }, { threshold: 0 });
    vio.observe(hero);
  } catch (e) { heroVisible = true; }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && heroVisible) kick();
  });

  /* fade the canvas in once the dial starts turning */
  setTimeout(function () { canvas.classList.add('in'); }, 60);
  kick();
}
})();
