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

Deploy target: Cloudflare Workers Builds (git-connected to this repo, `wrangler.jsonc`), output directory `dist/`, domain `e5enclave.com`. Pushes to `main` deploy production; pushes to any other branch upload a version and post a preview URL on the pull request. Netlify and Azure are not in the stack and the build refuses them (`npm run verify`).

## Chrome (masthead + footer)

The masthead and footer on every page are generated from one source:

- `scripts/chrome/head.html` — masthead: seal medallion, gilded wordmark, primary nav, mobile menu, the gold-leaf button finish (`.e5-gilt`) and the blueprint grid (`.e5-plan`). Its `<style>` block ships inline to every page.
- `scripts/chrome/foot.html` — footer (the homepage variant adds `photo-credits.html`).
- `scripts/chrome/nav.mjs` — the five primary links and the two variants (`route` for subpages, `front` for the homepage).

Pages carry `<!-- e5:chrome-head [front] -->…<!-- /e5:chrome-head -->` and `<!-- e5:chrome-foot [front] -->…<!-- /e5:chrome-foot -->` markers. Edit the partials, then:

```bash
npm run chrome          # rewrite every marked page (line endings preserved)
npm run chrome:check    # exit 1 if any page is stale — `npm run build` runs this via `npm run verify`
```

The masthead seal is cropped from `public/assets/seal/e5-seal-portrait.png` by `npm run seal:mark` (headless Chromium canvas).

## Verification

```bash
npm run verify          # sitemap routes exist, chrome present and current, no placeholders, editorial wording
npm run qa:smoke        # Playwright: Section IV visible with third-party hosts blocked, sticky masthead, mobile menu, images, CTA fit
```

The homepage reveal animation is opt-in: content is visible by default and the script only hides elements once it is ready to observe them, with a load + 1.5 s failsafe.

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
