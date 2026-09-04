import * as THREE from 'three';

/* Shared studio environment: a procedural equirect gradient with two gold
   hotspots, PMREM-filtered. Gold needs an environment or it reads black. */
let ENV_CACHE = null;
function studioEnv(renderer) {
  if (ENV_CACHE) return ENV_CACHE;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#20232b');
  base.addColorStop(0.42, '#0b0c10');
  base.addColorStop(1, '#000000');
  g.fillStyle = base; g.fillRect(0, 0, 512, 256);
  const key = g.createRadialGradient(140, 64, 0, 140, 64, 150);
  key.addColorStop(0, 'rgba(255,222,166,1)');
  key.addColorStop(1, 'rgba(255,222,166,0)');
  g.fillStyle = key; g.fillRect(0, 0, 512, 256);
  const rim = g.createRadialGradient(392, 104, 0, 392, 104, 110);
  rim.addColorStop(0, 'rgba(196,148,70,.9)');
  rim.addColorStop(1, 'rgba(196,148,70,0)');
  g.fillStyle = rim; g.fillRect(0, 0, 512, 256);
  const tex = new THREE.Texture(c);
  tex.needsUpdate = true;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  ENV_CACHE = pm.fromEquirectangular(tex).texture;
  pm.dispose(); tex.dispose();
  return ENV_CACHE;
}

/* The mark is a SHIELD, per brand/e5-mark.svg — outer and inner outlines
   traced from that file's path data. SVG space is 64x72 with y down and
   the mark centred on (32,36); mapped here to y-up units of 1/32. */
const SVG_CX = 32, SVG_CY = 36, SVG_S = 32;
const vx = x => (x - SVG_CX) / SVG_S;
const vy = y => (SVG_CY - y) / SVG_S;

function shieldOuter(k) {
  const s = k || 1, p = new THREE.Path();
  const X = x => vx(x) * s, Y = y => vy(y) * s;
  p.moveTo(X(32), Y(3));
  p.lineTo(X(61), Y(11));
  p.lineTo(X(61), Y(36));
  p.bezierCurveTo(X(61), Y(53), X(47), Y(64), X(32), Y(69));
  p.bezierCurveTo(X(17), Y(64), X(3), Y(53), X(3), Y(36));
  p.lineTo(X(3), Y(11));
  p.closePath();
  return p;
}
function shieldInner(k) {
  const s = k || 1, p = new THREE.Path();
  const X = x => vx(x) * s, Y = y => vy(y) * s;
  p.moveTo(X(32), Y(9));
  p.lineTo(X(55), Y(15));
  p.lineTo(X(55), Y(36));
  p.bezierCurveTo(X(55), Y(49), X(44), Y(58), X(32), Y(62));
  p.bezierCurveTo(X(20), Y(58), X(9), Y(49), X(9), Y(36));
  p.lineTo(X(9), Y(15));
  p.closePath();
  return p;
}
/* A Shape built on the shield; `hollow` cuts the inner outline out to
   leave the frame the mark draws at 0.5 opacity. */
function shieldShape(k, hollow) {
  const s = new THREE.Shape(shieldOuter(k).getPoints(24));
  if (hollow) {
    const hole = new THREE.Path(shieldInner(k).getPoints(24).reverse());
    s.holes.push(hole);
  }
  return s;
}
/* Five stud positions along the shield shoulder — one per pillar. */
function studPoints(k) {
  const pts = shieldInner(k).getPoints(40);
  return [0.06, 0.27, 0.5, 0.73, 0.94].map(t => pts[Math.round(t * (pts.length - 1))]);
}

const GOLD = 0xd4a44c;
const GOLD_LIGHT = 0xf0ce8b;

function goldMat(extra) {
  return new THREE.MeshStandardMaterial(Object.assign({
    color: GOLD, metalness: 0.94, roughness: 0.26
  }, extra || {}));
}

/* The host may mount these inside a wrapper that carries the size, so
   stretch to fill and, if the chain is still collapsed, adopt the
   nearest sized ancestor's box. */
function fillParent(el) {
  el.style.width = '100%';
  el.style.height = '100%';
  const settle = () => {
    if (el.clientHeight > 4) return;
    let p = el.parentElement, guard = 0;
    while (p && guard++ < 6) {
      if (p.clientHeight > 4) {
        el.style.position = 'absolute';
        el.style.inset = '0';
        if (getComputedStyle(p).position === 'static') p.style.position = 'relative';
        return;
      }
      p.style.width = p.style.width || '100%';
      p.style.height = '100%';
      p = p.parentElement;
    }
    const h = parseFloat(el.getAttribute('height') || '0');
    if (h) el.style.height = h + 'px';
  };
  settle();
  requestAnimationFrame(settle);
}

function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s);
}

/* ------------------------------------------------------------------ *
 * <e5-seal-3d> — the mark extruded, gold rim light, cursor tilt,
 * scroll-driven camera. Decorative: the page keeps its own DOM text.
 * ------------------------------------------------------------------ */
class SealStage extends HTMLElement {
  connectedCallback() {
    if (this._up) return;
    this._up = true;
    this.style.display = 'block';
    this.style.position = this.style.position || 'relative';
    fillParent(this);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    const cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(cv);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    cam.position.set(0, 0.1, 6.2);

    const group = new THREE.Group();
    scene.add(group);

    const frameGeo = new THREE.ExtrudeGeometry(shieldShape(1, true), {
      depth: 0.26, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 4, curveSegments: 2
    });
    frameGeo.center();
    const frame = new THREE.Mesh(frameGeo, goldMat({ roughness: 0.22 }));
    group.add(frame);

    const coreGeo = new THREE.ExtrudeGeometry(shieldShape(0.82, false), {
      depth: 0.4, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 5, curveSegments: 2
    });
    coreGeo.center();
    const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
      color: 0x2a2318, metalness: 0.7, roughness: 0.42
    }));
    group.add(core);

    const studGeo = new THREE.OctahedronGeometry(0.115, 0);
    const studMat = goldMat({ roughness: 0.18, emissive: 0x3a2a10, emissiveIntensity: 0.6 });
    studPoints(0.9).forEach(v => {
      const m = new THREE.Mesh(studGeo, studMat);
      m.position.set(v.x, v.y, 0.24);
      group.add(m);
    });

    /* Additive halo instead of a post-processing bloom pass: same read,
       one draw call, no extra module graph. */
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 48),
      new THREE.MeshBasicMaterial({
        color: GOLD, transparent: true, opacity: 0.13,
        blending: THREE.AdditiveBlending, depthWrite: false
      })
    );
    halo.position.z = -1.1;
    group.add(halo);

    const key = new THREE.DirectionalLight(GOLD_LIGHT, 3.1);
    key.position.set(2.6, 3.2, 3.4);
    scene.add(key);
    const rimL = new THREE.DirectionalLight(GOLD, 4.4);
    rimL.position.set(-3.2, -1.4, -2.6);
    scene.add(rimL);
    const fill = new THREE.DirectionalLight(0x6a7d96, 0.85);
    fill.position.set(-2.4, 1.8, 2.2);
    scene.add(fill);
    scene.add(new THREE.AmbientLight(0x1a1d24, 1.4));

    let px = 0, py = 0, tx = 0, ty = 0, scrollP = 0;
    const onMove = e => {
      const r = this.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const host = this.closest('[data-stage]') || window;
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    const onScroll = () => {
      const r = this.getBoundingClientRect();
      const h = innerHeight || 900;
      scrollP = Math.max(-1, Math.min(1, (h / 2 - (r.top + r.height / 2)) / h));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const ro = new ResizeObserver(() => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    });
    ro.observe(this);

    let vis = true;
    const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '120px' });
    io.observe(this);

    const t0 = performance.now();
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (!vis || document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      px += (tx - px) * 0.07;
      py += (ty - py) * 0.07;
      /* The shield stays legible: it sways about face-on rather than
         rotating through edge-on, and the phase is fixed, so every visitor
         sees the same mark. */
      group.rotation.y = Math.sin(t * 0.26) * 0.34 + px * 0.30;
      group.rotation.x = -py * 0.22 + Math.sin(t * 0.42) * 0.05;
      /* scroll-driven camera move */
      cam.position.z = 6.2 - scrollP * 0.9;
      cam.position.y = 0.1 + scrollP * 0.55;
      cam.lookAt(0, 0, 0);
      halo.material.opacity = 0.11 + Math.sin(t * 0.9) * 0.035;
      renderer.render(scene, cam);
    };
    tick();

    this._teardown = () => {
      cancelAnimationFrame(this._raf);
      ro.disconnect(); io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      removeEventListener('scroll', onScroll);
      renderer.dispose();
    };
  }
  disconnectedCallback() { if (this._teardown) this._teardown(); this._up = false; }
}
customElements.define('e5-seal-3d', SealStage);

/* ------------------------------------------------------------------ *
 * <e5-map-3d> — Liberty City's NW numbered grid as extruded blocks.
 * Geometry is generated from the real street grid: avenues on 660ft
 * centers (NW 7th–27th), streets on 330ft centers (NW 62nd–79th).
 * Pin labels stay in the DOM: any [data-pin] child with data-ave /
 * data-st / data-type gets a 3D pin and is positioned by projection.
 * ------------------------------------------------------------------ */
const AVE_LO = 7, AVE_HI = 27, ST_LO = 62, ST_HI = 79;
const AVE_U = 6.6, ST_U = 3.3;              // 100 ft per world unit
const wx = ave => (17 - ave) * AVE_U;
const wz = st => (70.5 - st) * ST_U;

const PIN_COLORS = {
  school: 0xd4a44c, landmark: 0xf0ce8b, context: 0x9fc2f0, pulse: 0xe6c079
};

class MapStage extends HTMLElement {
  connectedCallback() {
    if (this._up) return;
    this._up = true;
    this.style.display = 'block';
    this.style.position = this.style.position || 'relative';
    fillParent(this);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.insertBefore(cv, this.firstChild);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    scene.fog = new THREE.Fog(0x07080a, 120, 260);
    const cam = new THREE.PerspectiveCamera(30, 1, 1, 400);

    /* Ground with the street grid drawn as a texture. */
    const gc = document.createElement('canvas');
    gc.width = 2048; gc.height = 1024;
    const gg = gc.getContext('2d');
    gg.fillStyle = '#080a0d'; gg.fillRect(0, 0, 2048, 1024);
    const GW = (AVE_HI - AVE_LO) * AVE_U, GD = (ST_HI - ST_LO) * ST_U;
    gg.strokeStyle = 'rgba(212,164,76,.22)'; gg.lineWidth = 3;
    for (let a = AVE_LO; a <= AVE_HI; a++) {
      const x = ((wx(a) + GW / 2) / GW) * 2048;
      gg.beginPath(); gg.moveTo(x, 0); gg.lineTo(x, 1024); gg.stroke();
    }
    for (let s = ST_LO; s <= ST_HI; s++) {
      const y = ((wz(s) + GD / 2) / GD) * 1024;
      gg.beginPath(); gg.moveTo(0, y); gg.lineTo(2048, y); gg.stroke();
    }
    gg.strokeStyle = 'rgba(212,164,76,.55)'; gg.lineWidth = 7;
    [7, 17, 27].forEach(a => {                       // major arterials
      const x = ((wx(a) + GW / 2) / GW) * 2048;
      gg.beginPath(); gg.moveTo(x, 0); gg.lineTo(x, 1024); gg.stroke();
    });
    [62, 71, 79].forEach(s => {
      const y = ((wz(s) + GD / 2) / GD) * 1024;
      gg.beginPath(); gg.moveTo(0, y); gg.lineTo(2048, y); gg.stroke();
    });
    const gtex = new THREE.CanvasTexture(gc);
    gtex.colorSpace = THREE.SRGBColorSpace;
    gtex.wrapS = gtex.wrapT = THREE.RepeatWrapping;
    const REP_X = 2.4, REP_Z = 4.0;
    gtex.repeat.set(REP_X, REP_Z);
    gtex.offset.set((1 - REP_X) / 2, (1 - REP_Z) / 2);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry((GW + 14) * REP_X, (GD + 14) * REP_Z),
      new THREE.MeshStandardMaterial({ map: gtex, roughness: 0.86, metalness: 0.05 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    /* Blocks: one instance per grid block, deterministic low-rise heights. */
    const nA = AVE_HI - AVE_LO, nS = ST_HI - ST_LO;
    const count = nA * nS;
    const blocks = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.18 }),
      count
    );
    const m4 = new THREE.Matrix4(), col = new THREE.Color();
    let i = 0;
    for (let a = AVE_LO; a < AVE_HI; a++) {
      for (let s = ST_LO; s < ST_HI; s++) {
        const seed = a * 131 + s * 17;
        const r = hash(seed);
        const inSquare = a >= 12 && a < 15 && s >= 62 && s < 67;   // Liberty Square
        const arterial = a === 7 || a === 17 || a === 27 || s === 62 || s === 71;
        let h = 0.5 + r * 1.1;
        if (arterial) h += 0.5 + hash(seed + 9) * 0.9;
        if (inSquare) h = 0.8 + hash(seed + 3) * 0.35;
        const bw = AVE_U - 1.5, bd = ST_U - 1.0;
        m4.makeScale(bw * (0.86 + hash(seed + 5) * 0.14), h, bd * (0.84 + hash(seed + 7) * 0.16));
        m4.setPosition(wx(a + 0.5), h / 2, wz(s + 0.5));
        blocks.setMatrixAt(i, m4);
        if (inSquare) col.setHex(0x3a2f1e);
        else if (arterial) col.setHex(0x252a31);
        else col.setHex(0x191d23).offsetHSL(0, 0, hash(seed + 11) * 0.05);
        blocks.setColorAt(i, col);
        i++;
      }
    }
    blocks.instanceMatrix.needsUpdate = true;
    if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;
    scene.add(blocks);

    /* Eye candy — traffic along the arterials, a survey sweep across the
       grid, a breathing glow over Liberty Square, pulse rings under pins. */
    const ARTS_A = [7, 12, 17, 22, 27], ARTS_S = [62, 71, 79];
    const NCAR = 260;
    const carPos = new Float32Array(NCAR * 3);
    const cars = [];
    for (let k = 0; k < NCAR; k++) {
      const onAve = k % 2 === 0;
      const lane = onAve ? ARTS_A[k % ARTS_A.length] : ARTS_S[k % ARTS_S.length];
      cars.push({ onAve, lane, t: hash(k * 3.1), speed: (0.018 + hash(k * 5.3) * 0.03) * (hash(k * 7.7) > 0.5 ? 1 : -1), side: hash(k * 9.1) > 0.5 ? 0.45 : -0.45 });
    }
    const carGeo = new THREE.BufferGeometry();
    carGeo.setAttribute('position', new THREE.BufferAttribute(carPos, 3));
    const carPts = new THREE.Points(carGeo, new THREE.PointsMaterial({
      color: 0xf0ce8b, size: 0.55, sizeAttenuation: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    scene.add(carPts);
    const sweep = new THREE.Mesh(new THREE.PlaneGeometry(GW + 20, 1.6), new THREE.MeshBasicMaterial({
      color: 0xd4a44c, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide
    }));
    sweep.rotation.x = -Math.PI / 2; sweep.position.y = 0.06;
    scene.add(sweep);
    const sqGlow = new THREE.Mesh(new THREE.PlaneGeometry(AVE_U * 3.4, ST_U * 5.6), new THREE.MeshBasicMaterial({
      color: 0xd4a44c, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    sqGlow.rotation.x = -Math.PI / 2; sqGlow.position.set(wx(13.5), 0.05, wz(64.5));
    scene.add(sqGlow);
    const ringGeo = new THREE.RingGeometry(0.9, 1.05, 40);
    const rings = [];

    /* Pins from DOM children. */
    const labels = Array.from(this.querySelectorAll('[data-pin]'));
    /* Regions the projected labels must not land in (headings, legends). */
    const exclusions = [];
    const measureExclusions = () => {
      exclusions.length = 0;
      /* Climb to the first ancestor that actually holds the reserved
         blocks — the mount wrapper usually contains only this element. */
      let host = this.parentElement;
      while (host && !host.querySelector('[data-map-exclude]')) host = host.parentElement;
      if (!host) return;
      const base = this.getBoundingClientRect();
      host.querySelectorAll('[data-map-exclude]').forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width) return;
        exclusions.push({
          x0: r.left - base.left - 14, y0: r.top - base.top - 12,
          x1: r.right - base.left + 14, y1: r.bottom - base.top + 12
        });
      });
    };
    const pins = [];
    const shaftGeo = new THREE.CylinderGeometry(0.16, 0.16, 1, 8);
    const headGeo = new THREE.OctahedronGeometry(1, 0);
    labels.forEach((el, k) => {
      const ave = parseFloat(el.getAttribute('data-ave'));
      const st = parseFloat(el.getAttribute('data-st'));
      const type = el.getAttribute('data-type') || 'landmark';
      const hex = PIN_COLORS[type] || PIN_COLORS.landmark;
      const hgt = 2.6 + (k % 3) * 1.0;
      const g = new THREE.Group();
      g.position.set(wx(ave), 0, wz(st));
      const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({
        color: hex, metalness: 0.85, roughness: 0.3, transparent: true, opacity: 0.7
      }));
      shaft.scale.y = hgt;
      shaft.position.y = hgt / 2;
      g.add(shaft);
      const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({
        color: hex, metalness: 0.9, roughness: 0.18, emissive: hex, emissiveIntensity: 0.5
      }));
      head.scale.setScalar(0.78);
      head.position.y = hgt;
      g.add(head);
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.7, 24),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
      );
      glow.position.y = hgt;
      g.add(glow);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08;
      g.add(ring); rings.push({ m: ring, phase: k * 0.9 });
      scene.add(g);
      el.style.position = 'absolute';
      el.style.willChange = 'transform';
      const pin = { el, head, glow, ring, hex, world: new THREE.Vector3(wx(ave), hgt + 1.4, wz(st)), phase: k * 1.1, hot: 0 };
      pins.push(pin);
      /* Facts on hover: a label that carries a [data-fact] child opens it
         while hovered (or after a tap), the camera holds still, and the pin
         brightens. The label must be hit-testable for that. */
      if (el.querySelector('[data-fact]')) {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.setAttribute('tabindex', '0');
        el.setAttribute('role', 'button');
        el.setAttribute('aria-expanded', 'false');
        const open = () => { hover = pin; el.classList.add('is-open'); el.setAttribute('aria-expanded', 'true'); };
        const close = () => { if (hover === pin) hover = null; el.classList.remove('is-open'); el.setAttribute('aria-expanded', 'false'); };
        el.addEventListener('pointerenter', open);
        el.addEventListener('pointerleave', close);
        el.addEventListener('focus', open);
        el.addEventListener('blur', close);
        el.addEventListener('click', e => { e.stopPropagation(); if (el.classList.contains('is-open') && hover !== pin) close(); else open(); });
      }
    });
    let hover = null, hold = 0;
    this.addEventListener('click', () => { hover = null; labels.forEach(l => { l.classList.remove('is-open'); l.setAttribute('aria-expanded', 'false'); }); });

    const key = new THREE.DirectionalLight(GOLD_LIGHT, 2.2);
    key.position.set(40, 70, 50);
    scene.add(key);
    const back = new THREE.DirectionalLight(GOLD, 1.5);
    back.position.set(-60, 24, -50);
    scene.add(back);
    scene.add(new THREE.AmbientLight(0x2a3038, 1.5));
    scene.add(new THREE.HemisphereLight(0x8aa0bd, 0x0a0b0e, 0.55));

    let px = 0, py = 0, tx = 0, ty = 0;
    const onMove = e => {
      const r = this.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    this.addEventListener('pointermove', onMove);
    this.addEventListener('pointerleave', onLeave);

    /* Camera is FITTED, not tuned: at a declared pitch, take the greater
       of the distance that fits the grid's width and the one that fits its
       projected depth plus the tallest pole. A shallower pitch cannot make
       a 2.4:1 city fill a 1.4:1 frame, so the pitch is steep and the band's
       own aspect is set from the city's. */
    const PITCH = 54 * Math.PI / 180;
    const MAX_POLE = 2.6 + 2 * 1.0 + 2.4;
    let camDist = 100, camHoriz = 60, camUp = 80;
    const computeFrame = () => {
      const wpx = this.clientWidth || 1, hpx = this.clientHeight || 1;
      const tanV = Math.tan((cam.fov * Math.PI / 180) / 2);
      const tanH = tanV * (wpx / hpx);
      const halfW = (GW + 12) * 0.5;
      const halfD = (GD * Math.sin(PITCH) + MAX_POLE * Math.cos(PITCH)) * 0.5;
      camDist = Math.max(halfW / tanH, halfD / tanV) * 1.04;
      camHoriz = camDist * Math.cos(PITCH);
      camUp = camDist * Math.sin(PITCH);
      cam.far = Math.max(400, camDist * 3);
      cam.updateProjectionMatrix();
      scene.fog.near = camDist * 0.62;
      scene.fog.far = camDist * 2.1;
    };

    const fit = () => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      computeFrame();
      measureExclusions();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(this);
    fit();
    addEventListener('resize', fit);
    setTimeout(measureExclusions, 400);

    let vis = true;
    const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '160px' });
    io.observe(this);

    const t0 = performance.now();
    const proj = new THREE.Vector3();
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (!vis || document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      /* While a fact is open the camera settles so the label stays put. */
      hold += ((hover ? 1 : 0) - hold) * 0.06;
      const ang = -Math.PI / 2 + (Math.sin(t * 0.045) * 0.12 + px * 0.14) * (1 - hold * 0.85);
      cam.position.set(Math.cos(ang) * camHoriz * 0.30, camUp - py * camUp * 0.07 * (1 - hold * 0.85), Math.sin(ang) * camHoriz);
      cam.lookAt(0, MAX_POLE * 0.45, 0);
      const w = this.clientWidth || 1, h = this.clientHeight || 1;

      for (let k = 0; k < NCAR; k++) {
        const c = cars[k];
        c.t = (c.t + c.speed * 0.016 + 1) % 1;
        if (c.onAve) { carPos[k * 3] = wx(c.lane) + c.side; carPos[k * 3 + 2] = wz(ST_LO) + (wz(ST_HI) - wz(ST_LO)) * c.t; }
        else { carPos[k * 3] = wx(AVE_LO) + (wx(AVE_HI) - wx(AVE_LO)) * c.t; carPos[k * 3 + 2] = wz(c.lane) + c.side; }
        carPos[k * 3 + 1] = 0.25;
      }
      carGeo.attributes.position.needsUpdate = true;
      const sp = (t * 0.07) % 1;
      sweep.position.z = wz(ST_LO) + (wz(ST_HI) - wz(ST_LO)) * sp;
      sweep.material.opacity = 0.16 * Math.sin(sp * Math.PI);
      sqGlow.material.opacity = 0.06 + Math.sin(t * 1.1) * 0.035;
      for (const r of rings) {
        const ph = ((t * 0.5 + r.phase) % 1);
        r.m.scale.setScalar(0.6 + ph * 2.2);
        r.m.material.opacity = (1 - ph) * 0.55;
      }
      for (const p of pins) {
        p.hot += ((hover === p ? 1 : 0) - p.hot) * 0.1;
        p.head.rotation.y = t * 0.6 + p.phase;
        p.head.position.y = p.world.y - 1.4 + Math.sin(t * 1.3 + p.phase) * 0.22;
        p.head.scale.setScalar(0.78 + p.hot * 0.45);
        p.head.material.emissiveIntensity = 0.5 + p.hot * 1.4;
        p.glow.material.opacity = 0.16 + p.hot * 0.3;
        p.glow.scale.setScalar(1 + p.hot * 0.6);
        p.glow.position.y = p.head.position.y;
        p.glow.lookAt(cam.position);
        proj.copy(p.world).project(cam);
        p.sx = (proj.x * 0.5 + 0.5) * w;
        p.sy = (-proj.y * 0.5 + 0.5) * h;
        p.depth = proj.z;
      }

      /* Screen-space label placement: nearest pin picks first, and a
         contested label steps up (then down) in its own height until it
         clears both the reserved copy and every label already placed.
         Only a label with nowhere to go is dropped. */
      const order = pins.slice().sort((a, b) => (a === hover ? -1 : b === hover ? 1 : a.depth - b.depth));
      const placed = [];
      const clear = box => {
        for (const z of exclusions) {
          if (box.x0 < z.x1 && box.x1 > z.x0 && box.y0 < z.y1 && box.y1 > z.y0) return false;
        }
        for (const z of placed) {
          if (box.x0 < z.x1 + 8 && box.x1 > z.x0 - 8 && box.y0 < z.y1 + 6 && box.y1 > z.y0 - 6) return false;
        }
        return true;
      };
      for (const p of order) {
        const lw = p.el.offsetWidth || 180, lh = p.el.offsetHeight || 46;
        const step = lh + 9;
        /* Pins at the frame edge slide inward rather than disappearing. */
        const cx = Math.min(Math.max(p.sx, lw / 2 + 10), w - lw / 2 - 10);
        let put = null;
        if (p.depth < 1 && p.sx > -60 && p.sx < w + 60) {
          /* Two degrees of freedom: a contested label steps up or down by
             its own height, and sideways by just over half its width.
             Nearest pin picks first; only a label with nowhere to go drops. */
          const dys = [0, -step, -step * 2, step, -step * 3, step * 2];
          const dxs = [0, -lw * 0.58, lw * 0.58, -lw * 1.12, lw * 1.12];
          search: for (const dy of dys) {
            for (const dx of dxs) {
              const x = Math.min(Math.max(cx + dx, lw / 2 + 10), w - lw / 2 - 10);
              const box = { x0: x - lw / 2, y0: p.sy - lh + dy, x1: x + lw / 2, y1: p.sy + dy };
              if (box.y0 < -6 || box.y1 > h + 6) continue;
              if (clear(box)) { put = { x, y: p.sy + dy }; placed.push(box); break search; }
            }
          }
        }
        p.el.style.opacity = put ? '1' : '0';
        const tx2 = put ? put.x : cx, ty2 = put ? put.y : p.sy;
        p.el.style.transform = 'translate3d(' + tx2.toFixed(1) + 'px,' + ty2.toFixed(1) + 'px,0) translate(-50%,-100%)';
      }
      renderer.render(scene, cam);
    };
    tick();

    this._teardown = () => {
      cancelAnimationFrame(this._raf);
      ro.disconnect(); io.disconnect();
      removeEventListener('resize', fit);
      this.removeEventListener('pointermove', onMove);
      this.removeEventListener('pointerleave', onLeave);
      renderer.dispose();
    };
  }
  disconnectedCallback() { if (this._teardown) this._teardown(); this._up = false; }
}
customElements.define('e5-map-3d', MapStage);


/* ------------------------------------------------------------------ *
 * <e5-grain> — animated film grain as a fragment shader, brightened
 * around the cursor. Replaces the CPU-painted noise tile.
 * ------------------------------------------------------------------ */
class Grain extends HTMLElement {
  connectedCallback() {
    if (this._up) return;
    this._up = true;
    this.style.display = 'block';
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(1);
    const cv = renderer.domElement;
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;display:block;pointer-events:none';
    this.appendChild(cv);
    const scene = new THREE.Scene();
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uni = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uAmount: { value: parseFloat(this.getAttribute('amount') || '0.16') }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uAmount;',
        'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'void main(){',
        '  vec2 g = floor(vUv * uRes * 0.75);',
        '  float n = h(g + floor(uTime * 22.0));',
        '  float n2 = h(g * 1.7 + 31.4 + floor(uTime * 14.0));',
        '  float v = mix(n, n2, 0.45);',
        '  float d = distance(vUv * vec2(uRes.x / uRes.y, 1.0), uMouse * vec2(uRes.x / uRes.y, 1.0));',
        '  float lift = smoothstep(0.42, 0.0, d);',
        '  float a = uAmount * (0.05 + v * 0.11) * (0.72 + lift * 0.30);',
        '  vec3 c = vec3(0.70, 0.65, 0.56) * (0.45 + v * 0.55) + vec3(0.30, 0.23, 0.10) * lift * 0.5;',
        '  gl_FragColor = vec4(c, a);',
        '}'
      ].join('\n')
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    const fit = () => {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      uni.uRes.value.set(w, h);
    };
    addEventListener('resize', fit);
    fit();
    const onMove = e => { uni.uMouse.value.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight); };
    addEventListener('pointermove', onMove, { passive: true });

    const t0 = performance.now();
    let last = 0;
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (document.hidden) return;
      const now = performance.now();
      if (now - last < 90) return;          // ~11fps: reads as film, not flicker
      last = now;
      uni.uTime.value = (now - t0) / 1000;
      renderer.render(scene, cam);
    };
    tick();

    this._teardown = () => {
      cancelAnimationFrame(this._raf);
      removeEventListener('resize', fit);
      removeEventListener('pointermove', onMove);
      renderer.dispose();
    };
  }
  disconnectedCallback() { if (this._teardown) this._teardown(); this._up = false; }
}
customElements.define('e5-grain', Grain);
