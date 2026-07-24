export type QualityTier = 'static' | 'low' | 'medium' | 'high';

export interface Capabilities {
  webgpu: boolean;
  webgl2: boolean;
  offscreenCanvas: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  hardwareConcurrency: number;
  deviceMemory: number | null;
}

export interface FrameAdapterContext {
  compositionId: string;
  fps: number;
  width: number;
  height: number;
  rootElement?: HTMLElement;
  quality: QualityTier;
}

export interface FrameAdapter {
  id: string;
  init?(context: FrameAdapterContext): Promise<void> | void;
  getDurationFrames(): number;
  seekFrame(frame: number): Promise<void> | void;
  resize?(width: number, height: number): void;
  setQuality?(quality: QualityTier): void;
  destroy?(): Promise<void> | void;
}

export interface CompositionManifest {
  id: string;
  version: string;
  route: string;
  fps: number;
  durationFrames: number;
  adapters: Array<{ id: string; kind: string; capability: string; fallback: string }>;
  aspectRatios: string[];
}
