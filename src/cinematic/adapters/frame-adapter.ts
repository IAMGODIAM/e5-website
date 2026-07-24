import type { FrameAdapter } from '../types';

export function clampFrame(adapter: FrameAdapter, frame: number): number {
  const max = Math.max(0, adapter.getDurationFrames());
  return Math.min(max, Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0)));
}

export async function seekAdapters(adapters: FrameAdapter[], frame: number): Promise<void> {
  for (const adapter of adapters) await adapter.seekFrame(clampFrame(adapter, frame));
}

export async function destroyAdapters(adapters: FrameAdapter[]): Promise<void> {
  for (const adapter of [...adapters].reverse()) await adapter.destroy?.();
}
