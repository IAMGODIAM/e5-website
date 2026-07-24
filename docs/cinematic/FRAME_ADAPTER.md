# FrameAdapter contract

```ts
interface FrameAdapter {
  id: string;
  init?(ctx: { compositionId: string; fps: number; width: number; height: number; rootElement?: HTMLElement; quality: QualityTier }): Promise<void> | void;
  getDurationFrames(): number;
  seekFrame(frame: number): Promise<void> | void;
  resize?(width: number, height: number): void;
  setQuality?(quality: QualityTier): void;
  destroy?(): Promise<void> | void;
}
```

Rules:

1. Duration is finite and nonnegative.
2. Seeking supports forward, backward, and random order.
3. Repeated seeks to one frame are idempotent.
4. Capture time is `frame / fps`; wall clocks and unseeded randomness are forbidden.
5. `destroy()` removes timers, listeners, observers, GPU resources, and DOM created by the adapter.
6. The runtime listens for HyperFrames `hf-seek` events and forwards frames to every adapter.
