---
name: "E5 Design Registers & Style Systems"
slug: e5-design-registers
description: "35+ complete web design-system registers (style directions, layout systems, page playbooks) metabolized from Meng To's MIT skill library into E5 doctrine — plus the awwwards-quality art-direction spine. Use to give any E5 web surface a distinct, disciplined visual register beyond the house defaults."
when_to_use: "When art-directing or building any web page, landing page, dashboard, portfolio, product page, or experimental surface for E5 or its products — choosing a register, structuring layout, or raising a draft to award-bar quality. House brand surfaces still default to E5 Sovereign Institutional Dark; reach here when the brief calls for a different or product-specific register."
tags: ["web-design", "registers", "art-direction", "layout", "e5-canon"]
auth_type: none
credentials: []
scripts: ["fetch_design_skill.py"]
source: e5-skill-export-v1
exported_at: 2026-08-12T08:58:40.384Z
signature: unsigned  # sign with the E5 Lattice root before enabling outside Dev mode (PDR-SEC-7)
---
# E5 Design Registers & Style Systems

Consolidated from Meng To's open-sourced skill library (github.com/MengTo/skills, MIT) — metabolized into E5 doctrine, not copied. The full per-register playbooks live on the **sovereign E5 mirror**; this skill is the index, the doctrine layer, and the selection guide.

## Mirror mechanics
- Hot mirror: `https://pub-1dfdb97841574c448cb7657c069dbdc6.r2.dev/design-skills/<family>/<skill>/SKILL.md` — **must send a browser User-Agent** (default python/curl UA gets 403).
- Use the bundled `fetch_design_skill.py`: `list [filter]` · `get web-design/<name>` · `files <family/name>` · `file <path>`.
- Master index: `design-skills/web-design/WEB-DESIGN-SKILLS.md`. Cold archive: treasurebox `design-skills/mengto-skills-20260803.tar.gz`. License MIT — adapt freely; credit "interaction study in the lineage of contemporary editorial publishing / Meng To's open skill library (MIT)" in colophons when a register is used substantially.

## E5 doctrine layer (governs everything below)
1. **House surfaces stay house**: E5 brand-of-record surfaces default to Sovereign Institutional Dark (#111118, Cormorant Garamond + Inter, gold #c9a84c) or the wing register. These registers serve PRODUCT surfaces (Journey of I, Terminal, games), client work, and briefs that name a different vibe.
2. **Claims gates are absolute** (stronger than the source's own honest-asset rules, which align): no fake testimonials, no logo-wall theater, no invented partnerships, no "award-winning" claims, no fabricated data. Photos for real people only with rights.
3. **Standing QC gate before presenting**: functional + pixel-perfect, eye-verified at ~1920 AND ~390, multiple interaction states, reduced-motion path, no canvas-sizing failures (full-viewport canvas needs CSS width:100%;height:100%).
4. **One register per page.** Do not blend aesthetic systems. Name the register in the build note.

## The quality spine (distilled from build-awwwards-quality-sites — fetch it for the full 7-step doctrine)
1. Set art direction BEFORE code: visual thesis, hero focal asset, type hierarchy, color system, section sequence, motion narrative, scroll engine choice, WebGL decision, asset provenance.
2. Honest asset system: generate or license real imagery; no model-drawn SVG illustration; photos for avatars; Iconify Solar icons; omit proof walls with no honest proof.
3. Hero = the strongest authored moment; readable before animation completes; static first frame without JS.
4. One smooth-scroll engine max (Lenis usually), wired to ScrollTrigger, destroyed on cleanup, bypassed under prefers-reduced-motion.
5. Three.js only with purpose — one responsibility per canvas, DPR cap, offscreen pause, full dispose, poster fallback.
6. Complete semantic page, not a hero demo. Reject gradient blobs, ornamental bento, glass-everywhere, motion without narrative.
7. Validate: build clean, both widths, keyboard, no-JS state, reduced motion, placeholder sweep, then report register + asset sources + limitations.

## Register catalog (fetch `web-design/<name>` for the full playbook)
**Dark / technical**: dark-glass-clean-layout (frosted premium workspace) · glass-dark-ui (readable glassmorphism) · glass-dark-mode-clock (clock/calendar glass) · dark-blue-contrasting-clean (cobalt gradient blocks) · mesh-gradient-dark-blue-clean (futuristic mesh-gradient) · tech-green-dark-mode-modern (matte black + emerald signals) · framed-tech-dark-border-gradient (border-gradient shells) · funky-purple-container-tech (fuchsia container tech) · dither-laser-dark-mode (ordered-dither + laser) · blue-laser-clean-glass-layout (thin blue laser atmosphere) · bright-green-tech-system-webgl (hard-framed dark + green).
**Light / editorial**: clean-minimal-beige-light-mode (warm neutral shells) · light-mode-paper-technical (paper + dark framing) · orange-clean-paper-saas (paper SaaS + orange signals) · blue-cloudy-clean-modern (luminous sky atmosphere) · editorial-tech (magazine × product-tech) · book-serif-index (archival book-reader; **natural fit for E5 Press / publication-of-record surfaces**) · editorial-portfolio-chapters (chaptered portfolio) · editorial-service-booking (appointment services).
**Agency / structural**: agency-grid-layout-minimal (disciplined editorial grid + oversized type) · documentary-brutalist-agency (culture/production studios) · nested-container-clean-agency · nested-container-frames · framed-grid-layout (thin boundaries + L-corner brackets) · split-layout-technical (dual panels + mono metadata) · image-first-grid-layout (full-bleed photography grid) · technical-wireframe-info-layout (exploded 3D wireframe annotation).
**Skeuomorphic**: skeuomorphic-ui · high-contrast-skeuomorphic-clean.
**Page playbooks**: landing-page (high-converting single offer) · pricing-page (plan design/converting structure) · product-proof-saas (real workflow as hero proof — pairs with E5's real-data doctrine) · operational-enterprise-ai (enterprise AI/ops pages).
**Craft details (layer onto any register)**: container-lines (guide rails + corner squares) · corner-diagonals (chamfered edges) · number-details (01/02/03 markers) · company-logos + solar-duotone-bold (Iconify usage) · beautiful-shadows (layered neutral elevation).

## Selection heuristics
- Spiritual/editorial product (Journey of I family) → book-serif-index, editorial-tech, or the product's own established canon.
- Estate/intelligence consoles (Terminal, KHEMENU web) → dark-glass-clean-layout or split-layout-technical, skinned with E5 gold.
- Data/report pages → light-mode-paper-technical or split-layout-technical (Bloomberg/FT register per house doctrine).
- Games/launch moments → dither-laser-dark-mode, webgl-forward registers, or documentary-brutalist for campaign energy.
- When the brief names palette/material/era cues, those cues beat any catalog default.

## Verification (folded from iterate-until-verified / audit-verify-explain-grade-5)
Before presenting: build an acceptance matrix — each gate = observable pass/fail with evidence (screenshot, command output, readback). Convert "premium/awwwards/perfect" into gates: register coherence, hero strength, both-width proof, reduced-motion, no-JS state, claims sweep. Evidence or it did not happen.

