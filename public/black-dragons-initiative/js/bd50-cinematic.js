/* ============================================================
   bd50-cinematic.js — cinematic hero for Black Dragons v50
   - bespoke gold line-work icon set (pillars + principles)
   - staged hero entrance (fail-closed: staged states are CSS classes
     added here at runtime; no JS => hero fully visible, static)
   - lazy Three.js hero: ember/gold particle depth field + rotating
     gold ring accents around the seal. Pauses offscreen/hidden tab,
     honors prefers-reduced-motion, caps DPR.
   Zero visible copy changes. Icons are decorative (aria-hidden).
   ============================================================ */
(function () {
'use strict';

var docEl = document.documentElement;
var reduced = false;
try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

/* ---------------- 1. bespoke icon set ---------------- */
var S = function (inner) {
  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" ' +
    'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true" focusable="false">' + inner + '</svg>';
};

/* Four guiding principles */
var PIN = [
  /* I · Political independence — flame held in a broken circle */
  S('<path d="M38 15A15.5 15.5 0 1 0 38 33"/>' +
    '<path d="M24 36.5c-4.8-3.5-7.2-7.2-7.2-11.4a7.2 7.2 0 0 1 14.4 0c0 4.2-2.4 7.9-7.2 11.4Z"/>' +
    '<path d="M24 31.6c-2.1-1.6-3.1-3.3-3.1-5.3a3.1 3.1 0 0 1 6.2 0c0 2-1 3.7-3.1 5.3Z"/>'),
  /* II · Economic self-sufficiency — seedling in a hexagon scale */
  S('<path d="M24 5l16.5 9.5v19L24 43 7.5 33.5v-19Z"/>' +
    '<path d="M24 34.5V23"/>' +
    '<path d="M24 27.5c-5 0-8.5-3.4-8.5-8.4 5 0 8.5 3.4 8.5 8.4Z"/>' +
    '<path d="M24 24.5c5 0 8.5-3.4 8.5-8.4-5 0-8.5 3.4-8.5 8.4Z"/>'),
  /* III · Cultural renaissance — open book under rising rays */
  S('<path d="M24 17c-3-2.4-7-3-12-2.4V35c5-.6 9 0 12 2.4 3-2.4 7-3 12-2.4V14.6c-5-.6-9 0-12 2.4Z"/>' +
    '<path d="M24 17v20.4"/>' +
    '<path d="M24 5v4.5"/><path d="M15 7.6l2.2 3.8"/><path d="M33 7.6l-2.2 3.8"/>'),
  /* IV · Radical solidarity — three interlocking rings */
  S('<circle cx="18" cy="19.5" r="7.5"/><circle cx="30" cy="19.5" r="7.5"/><circle cx="24" cy="30" r="7.5"/>' +
    '<path d="M12 41.5a4 4 0 0 1 8 0 4 4 0 0 1 8 0 4 4 0 0 1 8 0"/>')
];

/* Five pillars */
var PLR = [
  /* 01 · Institutional Autonomy — column with pediment */
  S('<path d="M10 14.5L24 6.5l14 8"/>' +
    '<path d="M12.5 18.5h23"/><path d="M12.5 37.5h23"/>' +
    '<path d="M17.5 18.5v19"/><path d="M24 18.5v19"/><path d="M30.5 18.5v19"/>' +
    '<path d="M9.5 41.5h29"/>'),
  /* 02 · Economic Justice — scales with a gold heart-coin */
  S('<path d="M24 7v31"/>' +
    '<path d="M13 12.5h22"/>' +
    '<path d="M13 12.5l-5 10"/><path d="M13 12.5l5 10"/>' +
    '<path d="M5.5 25A7.5 7.5 0 0 0 20.5 25"/>' +
    '<path d="M35 12.5l-5 10"/><path d="M35 12.5l5 10"/>' +
    '<path d="M27.5 25A7.5 7.5 0 0 0 42.5 25"/>' +
    '<path d="M24 27.5l2.6 3.2-2.6 3.2-2.6-3.2Z"/>' +
    '<path d="M17.5 41.5h13"/>'),
  /* 03 · Land and Resources — field parcel under the sun */
  S('<circle cx="24" cy="11" r="4.2"/>' +
    '<path d="M7 40.5L18.5 19h11L41 40.5"/>' +
    '<path d="M4.5 40.5h39"/>' +
    '<path d="M24 40.5V27"/><path d="M17.5 40.5l2.8-9.5"/><path d="M30.5 40.5l-2.8-9.5"/>'),
  /* 04 · Community-Controlled Governance — council ring, one fire */
  S('<circle cx="24" cy="24" r="4.6"/><circle cx="24" cy="24" r="1.4"/>' +
    '<circle cx="24" cy="10.5" r="1.9"/><circle cx="33.5" cy="14.5" r="1.9"/>' +
    '<circle cx="37.5" cy="24" r="1.9"/><circle cx="33.5" cy="33.5" r="1.9"/>' +
    '<circle cx="24" cy="37.5" r="1.9"/><circle cx="14.5" cy="33.5" r="1.9"/>' +
    '<circle cx="10.5" cy="24" r="1.9"/><circle cx="14.5" cy="14.5" r="1.9"/>'),
  /* 05 · Pan-African Unity — globe under a linking arc */
  S('<circle cx="24" cy="27" r="11.5"/><ellipse cx="24" cy="27" rx="5.2" ry="11.5"/>' +
    '<path d="M12.5 27h23"/><path d="M14.5 21.5h19"/><path d="M14.5 32.5h19"/>' +
    '<path d="M11 9.5a15 15 0 0 1 26 0"/>' +
    '<circle cx="11" cy="9.5" r="1.9"/><circle cx="37" cy="9.5" r="1.9"/>')
];

function span(cls, svg) {
  var el = document.createElement('span');
  el.className = cls;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = svg;
  return el;
}

try {
  var principles = document.querySelectorAll('.bd50-principle');
  for (var i = 0; i < principles.length && i < PIN.length; i++) {
    principles[i].insertBefore(span('bd50-ico', PIN[i]), principles[i].firstChild);
  }
  var pillars = document.querySelectorAll('.bd50-pillar');
  for (var j = 0; j < pillars.length && j < PLR.length; j++) {
    var kicker = pillars[j].querySelector('.bd50-kicker-sm');
    var icon = span('bd50-ico', PLR[j]);
    if (kicker && kicker.parentNode) {
      kicker.parentNode.insertBefore(icon, kicker.nextSibling);
    } else {
      pillars[j].insertBefore(icon, pillars[j].firstChild);
    }
  }
  if (principles.length || pillars.length) docEl.classList.add('bd50-icons');
} catch (e) { /* icons are decorative; never break the page */ }

/* ---------------- 2. entrance release ----------------
   The inline stager (right after </header>) already added
   html.bd50-cine synchronously before first paint. Release the
   choreography on the next frames; layered backstops (inline
   3.2s timer + window-load failsafe below) guarantee .bd50-cine-go
   even if this file fails partway. */
function release() {
  try { docEl.classList.add('bd50-cine-go'); } catch (e) {}
}
try {
  if (!reduced) {
    requestAnimationFrame(function () {
      requestAnimationFrame(release);
    });
  } else { release(); }
  window.addEventListener('load', function () {
    setTimeout(release, 1500);
  });
} catch (e) {}

/* ---------------- 3. cinematic 3-D hero ---------------- */
if (reduced) return; /* static hero for reduced motion */
if (!('WebGLRenderingContext' in window)) return;

var hero = document.querySelector('.bd50-hero');
var canvas = document.querySelector('.bd50-hero3d');
if (!hero || !canvas) return;

var started = false;
function lazyInit() {
  if (started) return; started = true;
  try { initScene(); } catch (e) { /* hero stays static; never break */ }
}

try {
  if ('IntersectionObserver' in window) {
    var lio = new IntersectionObserver(function (es) {
      for (var k = 0; k < es.length; k++) {
        if (es[k].isIntersecting) { lazyInit(); lio.disconnect(); break; }
      }
    }, { rootMargin: '500px 0px 500px 0px' });
    lio.observe(hero);
  } else { lazyInit(); }
} catch (e) { lazyInit(); }

function initScene() {
  if (!window.THREE) return;
  var T = window.THREE;

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) { return; /* no WebGL: static hero */ }
  renderer.setClearColor(0x000000, 0);
  var DPR = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(DPR);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(55, 1, 0.1, 120);
  camera.position.set(0, 0, 26);
  camera.lookAt(0, 0, -6);

  /* soft round sprite, generated procedurally — no external asset */
  function makeSprite() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d');
    var g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,.5)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new T.CanvasTexture(c);
  }
  var sprite = makeSprite();

  var GOLD = new T.Color(0xd9a84e), EMBER = new T.Color(0xc23b2a), BONE = new T.Color(0xf2ede3);

  function makeField(count, size, opacity, spread) {
    var pos = new Float32Array(count * 3);
    var col = new Float32Array(count * 3);
    var vel = new Float32Array(count * 2); /* rise speed, sway phase */
    var palette = [GOLD, GOLD, EMBER, EMBER, BONE];
    for (var i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() * 2 - 1) * spread.x;
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * spread.y;
      pos[i * 3 + 2] = -30 + Math.random() * 36; /* true depth: z -30..6 */
      var c = palette[(Math.random() * palette.length) | 0];
      var dim = 0.45 + Math.random() * 0.55;
      col[i * 3] = c.r * dim; col[i * 3 + 1] = c.g * dim; col[i * 3 + 2] = c.b * dim;
      vel[i * 2] = 0.35 + Math.random() * 1.1;
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
    return { pts: pts, mat: mat, vel: vel, count: count, spread: spread };
  }

  var embers = makeField(520, 0.55, 0.85, { x: 34, y: 20 });
  var motes  = makeField(130, 1.5, 0.35, { x: 30, y: 18 });
  scene.add(embers.pts); scene.add(motes.pts);

  /* rotating gold accents — thin torus rings + a wireframe icosahedron,
     staged right-of-center to encircle the seal on desktop */
  var world = new T.Group();
  var ring1 = new T.Mesh(
    new T.TorusGeometry(7.6, 0.085, 16, 140),
    new T.MeshBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0 })
  );
  var ring2 = new T.Mesh(
    new T.TorusGeometry(9.4, 0.05, 16, 140),
    new T.MeshBasicMaterial({ color: 0x9e3226, transparent: true, opacity: 0 })
  );
  ring1.rotation.x = Math.PI / 2.35; ring1.rotation.y = 0.35;
  ring2.rotation.x = Math.PI / 1.9;  ring2.rotation.y = -0.5;
  var gem = new T.Mesh(
    new T.IcosahedronGeometry(1.7, 0),
    new T.MeshBasicMaterial({ color: 0xd9ba6c, wireframe: true, transparent: true, opacity: 0 })
  );
  gem.position.set(-13, -4, -12);
  world.add(ring1); world.add(ring2); world.add(gem);
  world.position.set(9.5, 0.5, -7);
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
    resizeT = setTimeout(size, 180);
  });

  /* pointer parallax (desktop, fine pointers) */
  var px = 0, py = 0, tx = 0, ty = 0;
  try {
    if (window.matchMedia('(pointer: fine)').matches) {
      hero.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      }, { passive: true });
      hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; }, { passive: true });
    }
  } catch (e) {}

  /* visibility: pause when tab hidden or hero offscreen */
  var heroVisible = true, rafId = null, last = 0, ignite = 0;
  var heroH = hero.clientHeight || 800, fade = 1;

  function loop(now) {
    rafId = null;
    if (document.hidden || !heroVisible) return; /* parked; re-armed by observers */
    rafId = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    var t = now / 1000;

    /* ignition ramp: ember field "lights" with the entrance */
    if (ignite < 1) ignite = Math.min(1, ignite + dt / 2.2);
    var ie = ignite * ignite;

    /* drift fields upward with lateral sway, wrap in the volume */
    var fields = [embers, motes];
    for (var f = 0; f < fields.length; f++) {
      var F = fields[f], p = F.pts.geometry.attributes.position.array;
      for (var i = 0; i < F.count; i++) {
        var ix = i * 3;
        p[ix + 1] += F.vel[i * 2] * dt;
        p[ix] += Math.sin(t * 0.7 + F.vel[i * 2 + 1]) * dt * 0.35;
        if (p[ix + 1] > F.spread.y + 2) {
          p[ix + 1] = -F.spread.y - 2;
          p[ix] = (Math.random() * 2 - 1) * F.spread.x;
        }
      }
      F.pts.geometry.attributes.position.needsUpdate = true;
      F.mat.opacity = (f === 0 ? 0.85 : 0.35) * ie * fade;
    }

    /* gold accents: slow ceremonial rotation */
    world.rotation.z += dt * 0.05;
    ring1.rotation.z += dt * 0.10;
    ring2.rotation.z -= dt * 0.07;
    gem.rotation.x += dt * 0.25; gem.rotation.y += dt * 0.18;
    gem.position.y = -4 + Math.sin(t * 0.5) * 0.8;
    ring1.material.opacity = 0.75 * ie * fade;
    ring2.material.opacity = 0.32 * ie * fade;
    gem.material.opacity = 0.30 * ie * fade;

    /* pointer parallax, lerped */
    px += (tx - px) * Math.min(1, dt * 2.2);
    py += (ty - py) * Math.min(1, dt * 2.2);
    camera.position.x = px * 2.4;
    camera.position.y = -py * 1.5;
    camera.lookAt(0, 0, -6);

    /* fade the stage as the hero scrolls away */
    var y = window.scrollY || window.pageYOffset || 0;
    var target = Math.max(0, Math.min(1, 1 - y / (heroH * 0.92)));
    fade += (target - fade) * Math.min(1, dt * 5);
    canvas.style.opacity = fade < 0.02 ? '0' : String(fade.toFixed(3));

    renderer.render(scene, camera);
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

  var scrollT = false;
  window.addEventListener('scroll', function () {
    if (!scrollT) { scrollT = true; requestAnimationFrame(function(){ scrollT = false; }); }
  }, { passive: true });

  kick();
}
})();
