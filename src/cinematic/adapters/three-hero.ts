import * as THREE from 'three';
import type { Capabilities, FrameAdapter, FrameAdapterContext, QualityTier } from '../types';
import { dprForTier } from '../quality';
import { clampFrame } from './frame-adapter';

type RendererLike = THREE.WebGLRenderer & { init?: () => Promise<void> };

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => ((s = Math.imul(1664525, s) + 1013904223 >>> 0) / 4294967296);
}

export class ThreeHeroAdapter implements FrameAdapter {
  id = 'e5-three-hero';
  private fps = 30;
  private durationFrames = 180;
  private canvas: HTMLCanvasElement;
  private caps: Capabilities;
  private tier: QualityTier;
  private renderer?: RendererLike;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  private group = new THREE.Group();
  private frameHandle = 0;
  private resizeObserver?: ResizeObserver;
  private pointer = new THREE.Vector2();
  private visible = true;
  private destroyed = false;
  private contextLost = false;
  private onPointerMove = (event: PointerEvent) => {
    this.pointer.set((event.clientX / innerWidth - 0.5) * 2, (event.clientY / innerHeight - 0.5) * 2);
    this.requestRender();
  };
  private onVisibility = () => { this.visible = !document.hidden; if (this.visible) this.requestRender(); };
  private onContextLost = (event: Event) => { event.preventDefault(); this.contextLost = true; document.documentElement.classList.add('e5-canvas-fallback'); };
  private onContextRestored = () => { this.contextLost = false; document.documentElement.classList.remove('e5-canvas-fallback'); this.requestRender(); };

  constructor(canvas: HTMLCanvasElement, caps: Capabilities, tier: QualityTier) {
    this.canvas = canvas;
    this.caps = caps;
    this.tier = tier;
  }

  async init(ctx: FrameAdapterContext): Promise<void> {
    this.fps = ctx.fps;
    try {
      if (this.caps.webgpu && this.tier === 'high') {
        const mod = await import('../webgpu-enhancement');
        this.renderer = await mod.createWebGPURenderer(this.canvas) as unknown as RendererLike;
        document.documentElement.dataset.e5Renderer = 'webgpu';
      }
    } catch (error) {
      console.info('[E5 cinematic] WebGPU enhancement unavailable; retaining WebGL2.', error);
    }
    if (!this.renderer) {
      this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, alpha: true, antialias: this.tier !== 'low', powerPreference: 'high-performance' });
      this.renderer.setClearColor(0x000000, 0);
      document.documentElement.dataset.e5Renderer = 'webgl2';
    }
    this.camera.position.z = 8;
    this.scene.add(this.group);
    this.buildScene();
    this.resize(ctx.width, ctx.height);
    await this.renderer.compileAsync?.(this.scene, this.camera);
    this.canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    this.canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);
    window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
    this.resizeObserver = new ResizeObserver(() => this.resize(innerWidth, this.canvas.parentElement?.clientHeight || innerHeight));
    if (this.canvas.parentElement) this.resizeObserver.observe(this.canvas.parentElement);
    this.requestRender();
  }

  private buildScene(): void {
    const count = this.tier === 'high' ? 96 : this.tier === 'medium' ? 64 : 36;
    const random = seeded(0xe52026);
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 12;
      positions[i * 3 + 1] = (random() - 0.5) * 7;
      positions[i * 3 + 2] = (random() - 0.5) * 4;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xa8884a, size: this.tier === 'low' ? 0.025 : 0.038, transparent: true, opacity: 0.33, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    points.userData.e5Owned = true;
    this.group.add(points);

    const ringGeometry = new THREE.RingGeometry(2.65, 2.67, 128);
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x6d1f20, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.userData.e5Owned = true;
    ring.rotation.x = 0.18;
    this.group.add(ring);
  }

  getDurationFrames(): number { return this.durationFrames; }

  seekFrame(frame: number): void {
    const f = clampFrame(this, frame);
    const t = f / this.fps;
    const intro = Math.min(1, t / 2.4);
    this.group.rotation.z = Math.sin(t * 0.21) * 0.035 + this.pointer.x * 0.025;
    this.group.rotation.x = this.pointer.y * 0.018;
    this.group.scale.setScalar(0.94 + intro * 0.06);
    this.group.traverse((node) => {
      if (node instanceof THREE.Points) (node.material as THREE.PointsMaterial).opacity = 0.08 + intro * 0.25;
    });
    this.render();
  }

  playIntro(): void {
    const start = performance.now();
    const tick = (now: number) => {
      if (this.destroyed || !this.visible) return;
      const frame = Math.min(this.durationFrames, Math.floor(((now - start) / 1000) * this.fps));
      this.seekFrame(frame);
      if (frame < this.durationFrames) this.frameHandle = requestAnimationFrame(tick);
    };
    this.frameHandle = requestAnimationFrame(tick);
  }

  private requestRender(): void {
    if (this.frameHandle || this.destroyed) return;
    this.frameHandle = requestAnimationFrame(() => { this.frameHandle = 0; this.render(); });
  }

  private render(): void {
    if (!this.renderer || !this.visible || this.contextLost || this.destroyed) return;
    this.renderer.render(this.scene, this.camera);
  }

  resize(width: number, height: number): void {
    if (!this.renderer) return;
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(dprForTier(this.tier));
    this.renderer.setSize(w, h, false);
    this.requestRender();
  }

  setQuality(tier: QualityTier): void { this.tier = tier; this.resize(innerWidth, this.canvas.parentElement?.clientHeight || innerHeight); }

  destroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    this.scene.traverse((node) => {
      const mesh = node as THREE.Mesh;
      mesh.geometry?.dispose?.();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      for (const material of materials) material.dispose();
    });
    this.renderer?.dispose();
    this.canvas.remove();
  }
}
