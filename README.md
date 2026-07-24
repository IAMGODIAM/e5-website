# e5-website

Official institutional website for **E5 Enclave Incorporated** (501(c)(3)) — [e5enclave.com](https://e5enclave.com).

## Canonical source

`public/` is the deployable semantic site. The homepage `public/index.html` is the canonical visual reference; interior routes retain the vc-chassis or their approved bespoke editorial design.

## Cinematic architecture

DOM-first · GSAP-directed · WebGL-focal · WebGPU-progressive · HyperFrames-rendered · accessibility-complete.

The semantic document is authoritative. Cinematic layers are progressive, finite, capability-gated, reduced-motion aware, and disposable. HyperFrames is isolated under `tools/hyperframes/` on Node 22 and is not part of the production dependency graph.

## Build and QA

Production CI remains compatible with Node 20.20.2:

```bash
npm ci
npm run build          # cinematic bundle + deterministic public/ → dist/ copy
npm run qa:adapters
npm run qa:cinematic
npm audit
```

HyperFrames render:

```bash
cd tools/hyperframes
nvm use 22.12.0
npm ci
npm run render
```

Deploy target: Cloudflare Pages from `main`; output directory `dist/`; domain `e5enclave.com`.

## Release gates

- Full canonical sitemap returns successful responses and semantic chassis markers.
- Homepage passes serious/critical axe checks.
- Reduced motion receives the authored static path with no GPU canvas.
- WebGL context loss preserves semantic content.
- Synthetic LCP/INP/CLS proxies stay inside documented budgets.
- Top and footer captures are reviewed at 16:9, 9:16, and 1:1.
- Golden baselines are never overwritten without an approval record.

## Editorial constraint

No “campaign” language for Restitution 246; it remains a **research framework**. Public legal and appellate claims require verified sourcing and editorial/legal review.
