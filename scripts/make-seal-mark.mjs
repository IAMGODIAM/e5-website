#!/usr/bin/env node
// Crops the central "E5" shield out of the master seal into a circular medallion
// for the masthead. Uses headless Chromium's canvas (no native image tooling needed).
//
//   node scripts/make-seal-mark.mjs            # writes public/assets/front/brand/e5-seal-mark-*.webp|png
//   PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=... node scripts/make-seal-mark.mjs
//
// Tunables (fractions of the portrait seal): CX, CY = centre; D = diameter (fraction of width).
// Resolve Playwright from the repo, or from an explicit path when node_modules is absent.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = resolve(ROOT, 'public/assets/seal/e5-seal-portrait.png');
const OUT = resolve(ROOT, 'public/assets/front/brand');
const CX = Number(process.env.SEAL_CX ?? 0.5);
const CY = Number(process.env.SEAL_CY ?? 0.572);
const D  = Number(process.env.SEAL_D  ?? 0.37);
const SIZES = [96, 192, 288];

const b64 = readFileSync(SRC).toString('base64');
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
const page = await browser.newPage();
await page.setContent(`<img id="s" src="data:image/png;base64,${b64}">`);
const out = await page.evaluate(async ({ CX, CY, D, SIZES }) => {
  const img = document.getElementById('s'); await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight;
  const d = W * D, sx = W * CX - d / 2, sy = H * CY - d / 2;
  const res = {};
  for (const size of SIZES) {
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2); x.closePath(); x.clip();
    x.drawImage(img, sx, sy, d, d, 0, 0, size, size);
    // soft vignette so the medallion edge reads as a coin, not a crop
    const g = x.createRadialGradient(size / 2, size / 2, size * 0.36, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(5,6,9,0)'); g.addColorStop(1, 'rgba(5,6,9,.55)');
    x.fillStyle = g; x.fillRect(0, 0, size, size);
    res[`webp-${size}`] = c.toDataURL('image/webp', 0.9);
    if (size === 192) res[`png-${size}`] = c.toDataURL('image/png');
  }
  return res;
}, { CX, CY, D, SIZES });
await browser.close();
mkdirSync(OUT, { recursive: true });
for (const [k, v] of Object.entries(out)) {
  const [fmt, size] = k.split('-');
  const file = resolve(OUT, `e5-seal-mark-${size}.${fmt}`);
  writeFileSync(file, Buffer.from(v.split(',')[1], 'base64'));
  console.log('wrote', file.replace(ROOT + '/', ''), readFileSync(file).length, 'bytes');
}
