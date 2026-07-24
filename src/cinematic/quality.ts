import type { Capabilities, QualityTier } from './types';

export function chooseInitialQuality(caps: Capabilities): QualityTier {
  if (caps.reducedMotion || caps.saveData || !caps.webgl2) return 'static';
  if ((caps.deviceMemory !== null && caps.deviceMemory <= 2) || caps.hardwareConcurrency <= 2) return 'low';
  if ((caps.deviceMemory !== null && caps.deviceMemory >= 8) && caps.hardwareConcurrency >= 8 && innerWidth >= 1000) return 'high';
  return 'medium';
}

export function dprForTier(tier: QualityTier): number {
  const mobile = matchMedia('(max-width: 760px)').matches;
  const cap = tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1;
  return Math.min(devicePixelRatio || 1, mobile ? Math.min(cap, 1.5) : cap);
}

const order: QualityTier[] = ['static', 'low', 'medium', 'high'];

export class AdaptiveQualityController extends EventTarget {
  private samples: number[] = [];
  private last = 0;
  tier: QualityTier;

  constructor(initial: QualityTier) {
    super();
    this.tier = initial;
  }

  record(timestamp: number): void {
    if (this.last) this.samples.push(timestamp - this.last);
    this.last = timestamp;
    if (this.samples.length < 90) return;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    this.samples.length = 0;
    if (p95 > 24) this.downgrade();
  }

  downgrade(): void {
    const index = order.indexOf(this.tier);
    if (index <= 0) return;
    this.tier = order[index - 1];
    this.dispatchEvent(new CustomEvent('change', { detail: { tier: this.tier } }));
  }
}
