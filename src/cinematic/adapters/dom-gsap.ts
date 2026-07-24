import gsap from 'gsap';
import type { FrameAdapter, FrameAdapterContext } from '../types';
import { clampFrame } from './frame-adapter';

export class DOMGSAPAdapter implements FrameAdapter {
  id = 'e5-dom-gsap';
  private fps = 30;
  private durationFrames = 120;
  private timeline = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  private context?: gsap.Context;

  init(ctx: FrameAdapterContext): void {
    this.fps = ctx.fps;
    const root = ctx.rootElement || document.body;
    this.context = gsap.context(() => {
      this.timeline
        .fromTo('.vc-masthead-rule', { autoAlpha: 0, scaleX: 0.72 }, { autoAlpha: 1, scaleX: 1, duration: 0.9 }, 0)
        .fromTo('.vc-masthead-eyebrow', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 0.16)
        .fromTo('.vc-wordmark .em5', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.28)
        .fromTo('.vc-wordmark .word', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.05 }, 0.36)
        .fromTo('.vc-tagline', { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.68)
        .fromTo('.vc-dates', { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 0.82)
        .fromTo('.vc-foundation-colophon', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.7 }, 1.06);
    }, root);
    this.timeline.pause(0);
  }

  playLive(): void { this.timeline.play(0); }
  getDurationFrames(): number { return this.durationFrames; }
  seekFrame(frame: number): void { this.timeline.totalTime(clampFrame(this, frame) / this.fps, false); }
  destroy(): void { this.timeline.kill(); this.context?.revert(); }
}
