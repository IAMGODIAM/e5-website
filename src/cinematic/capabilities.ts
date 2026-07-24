import type { Capabilities } from './types';

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
  gpu?: unknown;
};

export function detectCapabilities(allowSoftwareRenderer = false): Capabilities {
  const nav = navigator as NavigatorWithHints;
  const canvas = document.createElement('canvas');
  let webgl2 = false;
  try {
    webgl2 = Boolean(canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: !allowSoftwareRenderer }));
  } catch {
    webgl2 = false;
  }
  return {
    webgpu: Boolean(nav.gpu),
    webgl2,
    offscreenCanvas: 'OffscreenCanvas' in window && 'transferControlToOffscreen' in HTMLCanvasElement.prototype,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    saveData: Boolean(nav.connection?.saveData),
    hardwareConcurrency: nav.hardwareConcurrency || 2,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
  };
}

export function applyCapabilityClasses(capabilities: Capabilities): void {
  const root = document.documentElement;
  root.classList.toggle('e5-cap-webgpu', capabilities.webgpu);
  root.classList.toggle('e5-cap-webgl2', capabilities.webgl2);
  root.classList.toggle('e5-cap-offscreen', capabilities.offscreenCanvas);
  root.classList.toggle('e5-reduced-motion', capabilities.reducedMotion);
}
