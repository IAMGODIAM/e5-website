# Vendor notes — Project 2033 cinematic second pass (2026-09-12)

All libraries vendored into `js/vendor/` (self-hosted; zero CDN in the hero
critical path, per the ratified cinematic hero rule §3.3). Pinned versions —
never updated in place; re-vendor deliberately.

## GSAP 3.13.0 — full choreography stack
Files: `gsap.min.js`, `ScrollTrigger.min.js`, `ScrollSmoother.min.js`,
`SplitText.min.js`, `DrawSVGPlugin.min.js`, `MorphSVGPlugin.min.js`
Source: npm registry tarball `gsap-3.13.0.tgz` (2026-09-12), `dist/*.min.js`
License verification (vendor time):
- In-package README.md: "GSAP is FREE! Thanks to Webflow, GSAP is now 100% FREE
  including ALL of the bonus plugins like SplitText, MorphSVG … even for
  commercial use!"
- package.json `license`: "Standard 'no charge' license:
  https://gsap.com/standard-license"
- Every minified file carries the intact header:
  "@license Copyright 2025, GreenSock. All rights reserved. Subject to the
  terms at https://gsap.com/standard-license."
- All bonus plugins (SplitText, DrawSVG, MorphSVG, ScrollSmoother) ship in the
  public npm package — no Club GreenSock membership required.
Commercial use: permitted under the Standard License (no charge).

## Lenis 1.3.4 — smooth scroll
File: `lenis.min.js`
Source: npm registry tarball `lenis-1.3.4.tgz`
License: MIT (package.json `license: "MIT"`; verified at vendor time).

## Three.js r149 (pre-existing)
File: `three.min.js` (UMD global build)
Vendored in the first pass from `public/black-dragons-initiative/js/vendor/`.
MIT license header intact. Kept as-is per the am-twin vendoring pattern.
NOTE: full UMD build (~608 KB, ~150 KB+ gz) — the ratified rule's ≤150 KB gz
tree-shaken target is not met by this pre-existing vendoring. Flagged for the
build notes; the hero degrades to a composed static poster when the vendor
fails to load.

## Paper Shaders 0.0.80 — film-grain noise (Apache-2.0)
Files: `paper-shaders/shader-utils.js` (GLSL chunks: simplexNoise,
proceduralHash, colorBandingFix), `LICENSE`, `NOTICE`, `package.json`
Source: npm registry tarball `@paper-design/shaders-0.0.80.tgz` (2026-09-12)
License verification (vendor time):
- package.json `license`: "SEE LICENSE IN
  https://github.com/paper-design/shaders/blob/main/LICENSE"
- Bundled `LICENSE`: Apache License, Version 2.0 (plain text, verified head).
- Bundled `NOTICE`: "Paper Shaders / Copyright 2026 Paper / Powered by Paper
  Shaders: https://shaders.paper.design" — preserved verbatim per Apache-2.0
  §4(d).
- Pin correction: the clearance named 0.0.76 as the "known-clean reference",
  but 0.0.76 (published 2026-04-15) still bundles PolyForm Shield 1.0.0 —
  it predates the ~July 2026 Shield removal. The first post-resolution stable
  tarballs are 0.0.78 (2026-07-27) and 0.0.80 (2026-08-09); pinned 0.0.80
  (latest stable, Apache-2.0 bundled).
Use: the hero composite pass uses Paper's `proceduralHash21`/`simplexNoise`
GLSL for the film-grain layer, attributed in-code; Apache-2.0 §4(a–d)
attribution satisfied by this file + vendored LICENSE/NOTICE.

## Fonts — self-hosted OFL (zero third-party font requests)
Files in `fonts/`: Cormorant Garamond variable (roman + italic, wght 300–700),
IBM Plex Sans variable (roman + italic, wght 300–700), IBM Plex Mono static
(400, 500) — latin subsets, woff2.
Source: Google Fonts woff2 binaries (css2 API, latin subset only), 2026-09-12.
All three families are SIL Open Font License 1.1 (OFL) — verified family-level
standing; files serve the page's own @font-face (no Google Fonts request at
runtime).
Hero-critical font weight: Cormorant Garamond variable roman 39,260 bytes +
italic 37,640 bytes — under the rule's 100 KB hero-critical font budget.
