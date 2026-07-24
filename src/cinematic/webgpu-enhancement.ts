import { WebGPURenderer } from 'three/webgpu';

export async function createWebGPURenderer(canvas: HTMLCanvasElement): Promise<WebGPURenderer> {
  const renderer = new WebGPURenderer({ canvas, alpha: true, antialias: true });
  await renderer.init();
  renderer.setClearColor(0x000000, 0);
  return renderer;
}
