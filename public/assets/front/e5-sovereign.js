import * as THREE from 'three';

/* Studio environment: warm key, gold rim, one sapphire hotspot low-left so
   the metal picks up the seal's cool accent. PMREM-filtered, built once. */
let ENV = null;
function studioEnv(renderer) {
  if (ENV) return ENV;
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, '#1a1d26');
  base.addColorStop(0.45, '#090a0f');
  base.addColorStop(1, '#000000');
  g.fillStyle = base; g.fillRect(0, 0, 512, 256);
  const spot = (x, y, r, col) => {
    const k = g.createRadialGradient(x, y, 0, x, y, r);
    k.addColorStop(0, col); k.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = k; g.fillRect(0, 0, 512, 256);
  };
  spot(150, 60, 150, 'rgba(255,226,170,1)');
  spot(400, 96, 110, 'rgba(201,162,74,.9)');
  spot(60, 190, 120, 'rgba(63,107,216,.55)');
  const tex = new THREE.Texture(c);
  tex.needsUpdate = true;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const pm = new THREE.PMREMGenerator(renderer);
  ENV = pm.fromEquirectangular(tex).texture;
  pm.dispose(); tex.dispose();
  return ENV;
}

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
  };
  settle();
  requestAnimationFrame(settle);
}

const GOLD = 0xc9a24a, GOLD_PALE = 0xe9d3a0, SAPPHIRE = 0x3f6bd8, SAPPHIRE_DEEP = 0x1d3f9e;

function motes(count, color, size, spread) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color, size, sizeAttenuation: true, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  return new THREE.Points(geo, mat);
}

/* ------------------------------------------------------------------ *
 * <e5-hero-3d> — THE SEAL ITSELF, cut to its own oval and given depth.
 * No invented bezel: the artwork carries its own ring and cabochons.
 * Cinematic: a slow dolly-in on load, a specular sweep that travels
 * across the face every few seconds, rotating god-rays behind, three
 * depth layers of motes for parallax. Cursor tilts; scroll recedes.
 * Attributes: src (seal image), offset (x, world units), motes ("0").
 * ------------------------------------------------------------------ */
function ovalMask(img, rx, ry) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.beginPath();
  g.ellipse(c.width / 2, c.height / 2, c.width * rx, c.height * ry, 0, 0, Math.PI * 2);
  g.fill();
  return c;
}
/* three.js alphaMap samples the GREEN channel: a white oval on black. */
function ovalAlpha(w, h, rx, ry) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#fff';
  g.beginPath(); g.ellipse(w / 2, h / 2, w * rx, h * ry, 0, 0, Math.PI * 2); g.fill();
  return c;
}
function raysTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const g = c.getContext('2d');
  g.translate(512, 512);
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const w = 0.012 + hash(i * 7) * 0.05;
    const len = 380 + hash(i * 3) * 130;
    const grad = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
    grad.addColorStop(0, 'rgba(233,211,160,' + (0.12 + hash(i) * 0.16) + ')');
    grad.addColorStop(1, 'rgba(233,211,160,0)');
    g.fillStyle = grad;
    g.beginPath();
    g.moveTo(0, 0);
    g.arc(0, 0, len, a - w, a + w);
    g.closePath();
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function sheenTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 512, 0);
  grad.addColorStop(0, 'rgba(255,240,205,0)');
  grad.addColorStop(0.42, 'rgba(255,240,205,.10)');
  grad.addColorStop(0.5, 'rgba(255,248,225,.55)');
  grad.addColorStop(0.58, 'rgba(255,240,205,.10)');
  grad.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 512, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

class HeroStage extends HTMLElement {
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
    renderer.toneMappingExposure = 1.08;
    const cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(cv);

    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    cam.position.set(0, 0, 11);

    const rig = new THREE.Group();
    const seal = new THREE.Group();
    rig.add(seal);
    scene.add(rig);

    const RX = 1.62, RY = 1.08;                 // 3:2, the artwork's own frame
    const src = this.getAttribute('src') || 'brand/e5-seal-landscape-src.webp';

    /* Face: the seal artwork, alpha-cut to its oval. Emissive-mapped so
       the illustration reads at full saturation while the metal still
       takes the studio light. */
    const faceMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, transparent: true, alphaTest: 0.5,
      metalness: 0.55, roughness: 0.34, envMapIntensity: 0.7,
      emissive: 0xffffff, emissiveIntensity: 0.0
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RY * 2, 1, 1), faceMat);
    face.position.z = 0.092;   // body is 0.12 deep + 2×0.02 bevel, centred → front at 0.08
    seal.add(face);

    /* Body: a thin elliptical slab behind the face gives the seal an edge —
       dark enamel with a gold rim — so the object has real thickness. */
    const disc = new THREE.Shape();
    disc.absellipse(0, 0, RX * 0.985, RY * 0.985, 0, Math.PI * 2, false, 0);
    const bodyGeo = new THREE.ExtrudeGeometry(disc, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 120 });
    bodyGeo.center();
    const body = new THREE.Mesh(bodyGeo, [
      new THREE.MeshStandardMaterial({ color: 0x0a0c12, metalness: 0.6, roughness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.97, roughness: 0.22 })
    ]);
    seal.add(body);

    /* Specular sweep: an additive gradient stripe that travels across the
       face, clipped by the same oval alpha. */
    const sheen = new THREE.Mesh(new THREE.PlaneGeometry(RX * 2, RY * 2), new THREE.MeshBasicMaterial({
      map: sheenTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0
    }));
    sheen.material.map.wrapS = THREE.ClampToEdgeWrapping;
    sheen.material.map.repeat.set(1.6, 1);
    sheen.position.z = 0.098;
    sheen.rotation.z = 0;
    seal.add(sheen);

    const loader = new THREE.ImageLoader();
    loader.load(src, img => {
      const masked = ovalMask(img, 0.495, 0.495);
      const tex = new THREE.CanvasTexture(masked);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      const alpha = new THREE.CanvasTexture(ovalAlpha(masked.width, masked.height, 0.495, 0.495));
      faceMat.map = tex; faceMat.emissiveMap = tex; faceMat.alphaMap = alpha;
      faceMat.emissiveIntensity = 0.7;
      faceMat.needsUpdate = true;
      sheen.material.alphaMap = alpha; sheen.material.needsUpdate = true;
      this.setAttribute('data-ready', '1');
    });

    /* God-rays and halos behind. */
    const rays = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({
      map: raysTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.0
    }));
    rays.position.z = -1.6;
    rig.add(rays);
    const rays2 = rays.clone(); rays2.material = rays.material.clone(); rays2.scale.setScalar(0.72); rays2.position.z = -1.2;
    rig.add(rays2);
    const haloG = new THREE.Mesh(new THREE.CircleGeometry(3.6, 64), new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    haloG.position.z = -1.9; rig.add(haloG);
    const haloS = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), new THREE.MeshBasicMaterial({ color: SAPPHIRE_DEEP, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    haloS.position.set(-1.4, -0.9, -2.6); rig.add(haloS);

    /* Motes in three depth layers for parallax. */
    const layers = [];
    if (this.getAttribute('motes') !== '0') {
      [[1400, GOLD, 0.022, -4.5, 0.6], [520, GOLD_PALE, 0.04, -2.2, 1.0], [160, SAPPHIRE, 0.05, 0.8, 1.6]].forEach(([n, col, sz, z, par]) => {
        const p = motes(n, col, sz, [16, 9, 3]);
        p.position.z = z;
        p.userData.par = par;
        scene.add(p); layers.push(p);
      });
    }

    /* Lights: warm key that travels, sapphire fill, gold rim. */
    const key = new THREE.DirectionalLight(GOLD_PALE, 2.4); key.position.set(3, 3, 4); scene.add(key);
    const fillS = new THREE.DirectionalLight(SAPPHIRE, 1.3); fillS.position.set(-4.5, -2, 2.6); scene.add(fillS);
    const rim = new THREE.DirectionalLight(GOLD, 2.8); rim.position.set(-2.6, 1.8, -3); scene.add(rim);
    const spot = new THREE.SpotLight(0xfff1cf, 0, 20, 0.5, 0.8, 1); spot.position.set(0, 2, 5); spot.target = seal; scene.add(spot);
    scene.add(new THREE.AmbientLight(0x141824, 1.4));

    /* Interaction. */
    let px = 0, py = 0, tx = 0, ty = 0, scrollP = 0;
    const host = this.closest('[data-stage]') || window;
    const onMove = e => {
      const r = this.getBoundingClientRect();
      tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2;
      ty = ((e.clientY - r.top) / Math.max(1, r.height) - 0.5) * 2;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    const onScroll = () => {
      const r = this.getBoundingClientRect();
      scrollP = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let baseOffset = parseFloat(this.getAttribute('offset') || '1.5');
    this._setOffset = v => { baseOffset = v; };
    let aspect = 1.6;
    const ro = new ResizeObserver(() => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false);
      aspect = w / h; cam.aspect = aspect; cam.updateProjectionMatrix();
    });
    ro.observe(this);
    let vis = true;
    const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '120px' });
    io.observe(this);

    const t0 = performance.now();
    const ease = x => 1 - Math.pow(1 - x, 3);
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (!vis || document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      const e = ease(Math.min(1, t / 3.2));                 // dolly-in
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      /* Same condition as the page's 1180px CSS breakpoint: below it the copy
         is bottom-anchored full-width, so the seal moves up and shrinks to
         clear it — more so in short landscape windows. */
      const narrow = (innerWidth || 1440) <= 1180 || aspect < 1.1;
      const stageH = this.clientHeight || 800;
      const mid = Math.max(0, Math.min(1, (aspect - 1.1) / 0.6));
      const off = narrow ? 0 : baseOffset * (0.7 + 0.3 * mid);
      const shortK = Math.min(1, stageH / 760);
      let sc = narrow ? 0.62 * shortK : 0.72 + 0.28 * mid;
      const up = narrow ? (aspect > 1.3 ? 1.55 : 1.05) : 0;
      cam.position.z = 11 - 3.4 * e + scrollP * 1.4;
      cam.position.y = up;
      cam.lookAt(off * 0.7, narrow ? up : -0.05, 0);
      /* Stacked layout: the copy is bottom-anchored, so centre the seal in
         the band above it and shrink it to fit that band — on a tall phone
         the seal would otherwise sit mid-screen, behind the headline. */
      let dy = 0.05;
      if (narrow) {
        const copy = this._copy || (this._copy = this.parentElement && this.parentElement.querySelector('[data-m~="herotext"]'));
        if (copy) {
          const sr = this.getBoundingClientRect(), cr = copy.getBoundingClientRect();
          const band = (cr.top - sr.top) / Math.max(1, sr.height);      // free height above the copy, as a fraction
          if (band > 0.22 && band < 0.98) {
            const H = cam.position.z * Math.tan(cam.fov * Math.PI / 360); // visible half-height at the seal's depth
            dy = (0.5 - band / 2) * 2 * H;
            sc = Math.min(sc, (band * 2 * H * 0.86) / (RY * 2), (H * aspect * 0.94) / RX);
          }
        }
      }
      rig.position.set(off, (narrow ? up + dy : -0.05) - scrollP * 1.1, 0);
      rig.scale.setScalar(sc);
      seal.rotation.y = Math.sin(t * 0.19) * 0.22 + px * 0.3 - 0.35 * (1 - e) + scrollP * 0.4;
      seal.rotation.x = -py * 0.18 + Math.sin(t * 0.31) * 0.03 + 0.12 * (1 - e);
      seal.rotation.z = Math.sin(t * 0.15) * 0.01;
      /* Specular sweep every ~7s. */
      const sw = ((t + 1.2) % 7) / 7;
      const on = sw < 0.28;
      sheen.material.opacity = on ? Math.sin((sw / 0.28) * Math.PI) * 0.9 * e : 0;
      sheen.material.map.offset.x = on ? 1.1 - (sw / 0.28) * 1.6 : 2;
      spot.intensity = on ? Math.sin((sw / 0.28) * Math.PI) * 26 : 0;
      spot.position.set(-4 + (sw / 0.28) * 8, 2.2, 4.5);
      /* Rays and halos. */
      rays.rotation.z = t * 0.035; rays2.rotation.z = -t * 0.022;
      rays.material.opacity = (0.22 + Math.sin(t * 0.6) * 0.05) * e;
      rays2.material.opacity = (0.16 + Math.sin(t * 0.8 + 1) * 0.05) * e;
      haloG.material.opacity = (0.075 + Math.sin(t * 0.7) * 0.02) * e;
      haloS.material.opacity = (0.06 + Math.sin(t * 0.5 + 1) * 0.015) * e;
      for (const p of layers) {
        p.rotation.y = t * 0.008 * p.userData.par + px * 0.03 * p.userData.par;
        p.position.x = px * 0.25 * p.userData.par;
        p.position.y = Math.sin(t * 0.12 + p.userData.par) * 0.12 - py * 0.15 * p.userData.par - scrollP * 0.6 * p.userData.par;
      }
      key.position.set(3 + Math.sin(t * 0.22) * 1.4, 3 + Math.cos(t * 0.17) * 0.6, 4);
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
  static get observedAttributes() { return ['offset']; }
  attributeChangedCallback(n, o, v) { if (n === 'offset' && this._setOffset) this._setOffset(parseFloat(v)); }
  disconnectedCallback() { if (this._teardown) this._teardown(); this._up = false; }
}
customElements.define('e5-hero-3d', HeroStage);

/* ------------------------------------------------------------------ *
 * <e5-columns-3d> — five gold columns, one per pillar, on a dark
 * plinth. Decorative band behind the pillars section.
 * ------------------------------------------------------------------ */
class ColumnsStage extends HTMLElement {
  connectedCallback() {
    if (this._up) return;
    this._up = true;
    this.style.display = 'block';
    this.style.position = this.style.position || 'relative';
    fillParent(this);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const cv = renderer.domElement;
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    this.appendChild(cv);
    const scene = new THREE.Scene();
    scene.environment = studioEnv(renderer);
    scene.fog = new THREE.Fog(0x050609, 9, 22);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 60);
    cam.position.set(0, 1.1, 11);

    const gold = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.95, roughness: 0.28 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x0c1020, metalness: 0.6, roughness: 0.5 });
    const group = new THREE.Group();
    const shaft = new THREE.CylinderGeometry(0.17, 0.2, 3.2, 24);
    const cap = new THREE.BoxGeometry(0.62, 0.12, 0.62);
    const base = new THREE.BoxGeometry(0.66, 0.16, 0.66);
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 1.55;
      const s = new THREE.Mesh(shaft, gold); s.position.set(x, 1.6, 0); group.add(s);
      const c = new THREE.Mesh(cap, gold); c.position.set(x, 3.26, 0); group.add(c);
      const b = new THREE.Mesh(base, gold); b.position.set(x, 0.08, 0); group.add(b);
    }
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.3, 2.4), dark);
    plinth.position.y = -0.15;
    group.add(plinth);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ color: 0x07090f, metalness: 0.7, roughness: 0.35 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -0.3;
    scene.add(floor);
    scene.add(group);
    scene.add(motes(500, GOLD, 0.03, [16, 8, 8]));

    const key = new THREE.DirectionalLight(GOLD_PALE, 2.4); key.position.set(3, 6, 5); scene.add(key);
    const fill = new THREE.DirectionalLight(SAPPHIRE, 1.1); fill.position.set(-5, 2, 3); scene.add(fill);
    scene.add(new THREE.AmbientLight(0x10141f, 1.8));

    let tx = 0, px = 0;
    const onMove = e => { const r = this.getBoundingClientRect(); tx = ((e.clientX - r.left) / Math.max(1, r.width) - 0.5) * 2; };
    const onLeave = () => { tx = 0; };
    this.addEventListener('pointermove', onMove);
    this.addEventListener('pointerleave', onLeave);
    const ro = new ResizeObserver(() => {
      const w = this.clientWidth || 1, h = this.clientHeight || 1;
      renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
    });
    ro.observe(this);
    let vis = true;
    const io = new IntersectionObserver(es => { vis = es[0].isIntersecting; }, { rootMargin: '160px' });
    io.observe(this);
    const t0 = performance.now();
    const tick = () => {
      this._raf = requestAnimationFrame(tick);
      if (!vis || document.hidden) return;
      const t = (performance.now() - t0) / 1000;
      px += (tx - px) * 0.05;
      const ang = Math.sin(t * 0.12) * 0.22 + px * 0.28;
      cam.position.set(Math.sin(ang) * 11, 1.3, Math.cos(ang) * 11);
      cam.lookAt(0, 1.5, 0);
      renderer.render(scene, cam);
    };
    tick();
    this._teardown = () => {
      cancelAnimationFrame(this._raf); ro.disconnect(); io.disconnect();
      this.removeEventListener('pointermove', onMove); this.removeEventListener('pointerleave', onLeave);
      renderer.dispose();
    };
  }
  disconnectedCallback() { if (this._teardown) this._teardown(); this._up = false; }
}
customElements.define('e5-columns-3d', ColumnsStage);
