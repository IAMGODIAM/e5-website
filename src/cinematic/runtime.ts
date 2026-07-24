import './motion-tokens.css';
import { detectCapabilities, applyCapabilityClasses } from './capabilities';
import { AdaptiveQualityController, chooseInitialQuality } from './quality';
import type { FrameAdapter } from './types';
import { seekAdapters, destroyAdapters } from './adapters/frame-adapter';

declare global {
  interface Window {
    E5Cinematic?: {
      ready: Promise<void>;
      seekFrame(frame: number): Promise<void>;
      seek(timeSeconds: number): Promise<void>;
      destroy(): Promise<void>;
      setReducedMotion(reduced: boolean): Promise<void>;
      getState(): Record<string, unknown>;
    };
    __hfThreeTime?: number;
  }
}

const FPS = 30;
const COMPOSITION_ID = 'e5-home-genesis';
const adapters: FrameAdapter[] = [];
let qualityController: AdaptiveQualityController | undefined;

function getMotionOverride(): boolean | null {
  try {
    const value = localStorage.getItem('e5-motion');
    return value === 'reduced' ? true : value === 'full' ? false : null;
  } catch { return null; }
}

function installMotionToggle(reduced: boolean): void {
  const nav = document.querySelector('.vc-nav');
  if (!nav) return;
  let button = nav.querySelector<HTMLButtonElement>('.e5-motion-toggle');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'e5-motion-toggle';
    nav.append(button);
  }
  button.textContent = reduced ? 'Motion: reduced' : 'Motion: full';
  button.setAttribute('aria-pressed', String(reduced));
  button.setAttribute('aria-label', reduced ? 'Enable full cinematic motion' : 'Reduce cinematic motion');
  button.addEventListener('click', () => {
    const next = !document.documentElement.classList.contains('e5-reduced-motion');
    try { localStorage.setItem('e5-motion', next ? 'reduced' : 'full'); } catch {}
    location.reload();
  }, { once: true });
}

function afterFirstPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback;
      if (idle) idle(() => resolve(), { timeout: 900 });
      else setTimeout(resolve, 32);
    });
  });
}

async function initialize(): Promise<void> {
  const captureDocument = document.documentElement.hasAttribute('data-hyperframes');
  if (!captureDocument && location.pathname !== '/' && location.pathname !== '/index.html') return;
  const masthead = document.querySelector<HTMLElement>('.vc-masthead');
  if (!masthead) return;
  const capture = new URLSearchParams(location.search).has('capture') || captureDocument;

  const caps = detectCapabilities(capture);
  const override = getMotionOverride();
  if (override !== null) caps.reducedMotion = override;
  applyCapabilityClasses(caps);
  installMotionToggle(caps.reducedMotion);

  const tier = chooseInitialQuality(caps);
  document.documentElement.classList.add(`e5-quality-${tier}`);
  qualityController = new AdaptiveQualityController(tier);

  if (!capture) await afterFirstPaint();

  const { DOMGSAPAdapter } = await import('./adapters/dom-gsap');
  const dom = new DOMGSAPAdapter();
  adapters.push(dom);
  await dom.init?.({ compositionId: COMPOSITION_ID, fps: FPS, width: innerWidth, height: masthead.clientHeight, rootElement: masthead, quality: tier });

  let three: import('./adapters/three-hero').ThreeHeroAdapter | undefined;
  if (tier !== 'static' && caps.webgl2) {
    const canvas = document.createElement('canvas');
    canvas.className = 'e5-cinematic-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    masthead.prepend(canvas);
    const { ThreeHeroAdapter } = await import('./adapters/three-hero');
    three = new ThreeHeroAdapter(canvas, caps, tier);
    adapters.push(three);
    await three.init({ compositionId: COMPOSITION_ID, fps: FPS, width: innerWidth, height: masthead.clientHeight, rootElement: masthead, quality: tier });
    qualityController.addEventListener('change', (event) => {
      const next = (event as CustomEvent).detail.tier;
      three?.setQuality(next);
      for (const name of [...document.documentElement.classList]) if (name.startsWith('e5-quality-')) document.documentElement.classList.remove(name);
      document.documentElement.classList.add(`e5-quality-${next}`);
    });
  }

  if (capture) {
    await seekAdapters(adapters, 0);
  } else if (!caps.reducedMotion) {
    dom.playLive();
    three?.playIntro();
  } else {
    await seekAdapters(adapters, Math.min(...adapters.map((adapter) => adapter.getDurationFrames())));
  }
  document.documentElement.classList.add('e5-cinematic-ready');
}

const ready = initialize();

window.E5Cinematic = {
  ready,
  async seekFrame(frame: number) { await ready; await seekAdapters(adapters, frame); },
  async seek(timeSeconds: number) { await ready; await seekAdapters(adapters, Math.floor(timeSeconds * FPS)); },
  async destroy() { await destroyAdapters(adapters); adapters.length = 0; },
  async setReducedMotion(reduced: boolean) {
    try { localStorage.setItem('e5-motion', reduced ? 'reduced' : 'full'); } catch {}
    location.reload();
  },
  getState() { return { compositionId: COMPOSITION_ID, fps: FPS, adapters: adapters.map((a) => a.id), quality: qualityController?.tier, reducedMotion: document.documentElement.classList.contains('e5-reduced-motion') }; },
};

window.addEventListener('hf-seek', ((event: CustomEvent<{ frame?: number; time?: number }>) => {
  const detail = event.detail || {};
  const frame = detail.frame ?? Math.floor((detail.time ?? window.__hfThreeTime ?? 0) * FPS);
  void window.E5Cinematic?.seekFrame(frame);
}) as EventListener);

window.addEventListener('pagehide', () => { void window.E5Cinematic?.destroy(); }, { once: true });
