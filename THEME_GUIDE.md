# E5 Enclave — Theme & Design System Guide
*Canonical reference · Last updated May 2026*

## The One-Word Color Change

To change the entire site's color scheme, edit **one line** in `src/_layouts/base.njk`:

```html
<html lang="en" data-palette="editorial">
```

Change `"editorial"` to any palette name:

| Palette name | Look | When to use |
|---|---|---|
| `editorial` | Cream bone background, oxblood/red accent | **Default — canonical E5 brand** |
| `original` | Parchment background, forest green accent | Archive / heritage mode |
| `midnight` | Near-black background, gold accent | Dark mode / high contrast |

That one word change repaints **every page, every section, every component** on the entire site simultaneously. No other files need to change.

---

## How It Works — The Token System

Every color on the site is defined as a CSS custom property (variable) in `src/assets/css/editorial.css`.

The system uses **19 semantic tokens** — not literal color names, but functional roles:

```css
--vc-bone          /* page background */
--vc-bone-2        /* card / panel background */
--vc-bone-3        /* deep panel background */
--vc-ink           /* primary text */
--vc-ink-2         /* secondary text */
--vc-ink-3         /* tertiary / body text */
--vc-oxblood       /* accent color (oxblood, forest green, or gold by palette) */
--vc-oxblood-2     /* accent deep / hover state */
--vc-gold          /* gold highlight */
--vc-gold-2        /* gold light */
--vc-muted         /* metadata / captions / eyebrows */
--vc-muted-2       /* very muted */
--vc-rule          /* border light */
--vc-rule-2        /* border medium */
--vc-rule-3        /* border strong */
--vc-bone-rgb      /* RGB of --vc-bone (for rgba() usage) */
--vc-ink-rgb       /* RGB of --vc-ink (for rgba() usage) */
--vc-display       /* display/headline font stack */
--vc-text          /* body/UI font stack */
```

**Every element on every page uses these tokens — never hardcoded hex values.**
This is why one palette change repaints everything.

---

## Adding a New Palette

In `src/assets/css/editorial.css`, add a new block:

```css
html[data-palette="yourname"] {
  --vc-bone: #yourcolor;
  --vc-bone-2: #yourcolor;
  --vc-bone-3: #yourcolor;
  --vc-ink: #yourcolor;
  --vc-ink-2: #yourcolor;
  --vc-ink-3: #yourcolor;
  --vc-oxblood: #yourcolor;
  --vc-oxblood-2: #yourcolor;
  --vc-gold: #yourcolor;
  --vc-gold-2: #yourcolor;
  --vc-muted: #yourcolor;
  --vc-muted-2: #yourcolor;
  --vc-rule: rgba(r,g,b,0.14);
  --vc-rule-2: rgba(r,g,b,0.32);
  --vc-rule-3: rgba(r,g,b,0.62);
  --vc-bone-rgb: r,g,b;
  --vc-ink-rgb: r,g,b;
}
```

Then:
1. Add the swatch button to `.vc-palette-switcher` in `src/_layouts/base.njk`
2. Set `data-palette="yourname"` in `base.njk` to make it the default
3. Done.

---

## Adding a New Page

Every page follows this pattern:

```
---
layout: program        ← choose: base / page / program / pillar / record / dispatch / monumental
permalink: /your-path/
title: "Page Title | E5 Enclave"
description: "SEO description"
eyebrow: "Eyebrow label"
deck: "Subtitle / deck copy"
---

<header class="vc-page-head reveal">
  <div class="vc-page-eyebrow">{{ eyebrow }}</div>
  <h1 class="vc-page-h">{{ title }}</h1>
  <p class="vc-page-deck">{{ deck | safe }}</p>
</header>

<article class="vc-prose reveal">
  Your content here.
</article>
```

No custom CSS needed. The token system handles everything.

---

## Layout Reference

| Layout | Use for | Has |
|---|---|---|
| `base` | Bare shell — full custom content | Nav + footer only |
| `page` | Standard interior page | Header + prose wrap |
| `program` | Program pages | Header + prose + coalition CTA |
| `pillar` | Pillar doctrine pages | Header + prose |
| `record` | Founding documents | Dispatch chrome + rail nav |
| `dispatch` | Long-form reader | Full dispatch layout |
| `monumental` | High-ceremony pages (doctrine) | Foundation slab + content |
| `legal` | Privacy, terms | Tight prose layout |

---

## The Docs/ Folder — Why Pages Sometimes Appear Stale

The live site is served from `docs/` in the GitHub repo.
Netlify is configured to build from `src/` using `npm run build` and output to `docs/`.

**When Netlify auto-builds:** Every push to `main` triggers a build automatically (if GitHub integration is active).

**When it doesn't:** If the Netlify → GitHub connection is inactive, `docs/` can become stale. The fix is to either:
1. Re-enable the Netlify GitHub App on the repository
2. Or push the built `docs/` file directly (what Sue does when pages are stale)

**Permanent solution:** Netlify should be the only thing that writes to `docs/`. Never commit manually-built files to `docs/`. Keep `docs/` in `.gitignore` on all local environments and let Netlify own it exclusively.

---

## Typography

Two typefaces. Both loaded from Google Fonts. Both defined as CSS tokens.

- **Display / Headline:** `var(--vc-display)` → Cormorant Garamond (serif, editorial weight)
- **Body / UI:** `var(--vc-text)` → Inter (sans-serif, clean)

To change the site-wide typeface: edit the `:root` block in `editorial.css` and update the Google Fonts link in `src/_includes/_head.njk`.

---

*E5 Enclave Incorporated · EIN 99-3822441 · Liberty City, Miami, Florida*
