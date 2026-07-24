# E5 Cinematic Web System

## Canon

DOM-first · GSAP-directed · WebGL-focal · WebGPU-progressive · HyperFrames-rendered · accessibility-complete.

The semantic document is authoritative. Canvas is a decorative focal layer and cannot contain the only copy, links, controls, forms, or navigation.

## Runtime planes

1. Native CSS/WAAPI/View Transitions for ordinary UI motion.
2. GSAP adapters for labeled, reversible, seekable cinematic sequences.
3. Three.js WebGL2 baseline, with WebGPU loaded only on capable high-tier clients and failure-safe fallback.
4. HyperFrames in a separate Node 22 container for deterministic video capture.

## Frame contract

Adapters implement the HyperFrames v0 semantics: finite duration, arbitrary seek order, idempotent `seekFrame(frame)`, clamping, no wall-clock dependency during capture, seeded randomness, and explicit teardown.

## Quality tiers

- static: semantic original, no canvas
- low: DPR 1, 36 points, no postprocessing
- medium: DPR <=1.5, 64 points
- high: DPR <=2, 96 points, WebGPU attempted and WebGL2 retained on failure

Quality may only downgrade during a session. Reduced motion and Save-Data select static.

## Safety gates

- Static hero paints before dynamic chunks load.
- WebGL context loss returns to the semantic original.
- Rendering stops when hidden and after the finite intro.
- All geometry, materials, renderer resources, observers, timelines, and listeners are destroyed on pagehide.
- Golden baselines are never overwritten without a recorded approval.
