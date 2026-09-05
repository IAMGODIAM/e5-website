#!/usr/bin/env node
// The property must be built out: every route in the sitemap exists, carries the
// generated chrome, has no design-tool placeholders, and keeps the editorial line.
//   node scripts/verify-sovereign.mjs      (exit 1 on any failure)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as applyChrome } from './apply-chrome.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fails = [], warns = [];
const fail = (f, msg) => fails.push(`${f}: ${msg}`);

const sitemap = readFileSync(resolve(ROOT, 'public/sitemap.xml'), 'utf8');
const routes = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(m => m[1]);
if (!routes.length) fail('sitemap.xml', 'no <loc> entries');

// Wording the editorial policy forbids outright; anything else with "campaign" is only reported.
const FORBID = [/restitution\s*246\s+campaign/i, /r246\s+campaign/i, /reparations\s+campaign/i];
const visibleText = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

for (const route of routes) {
  const rel = route === '/' ? 'public/index.html' : `public${route.replace(/\/$/, '')}/index.html`;
  const file = resolve(ROOT, rel);
  if (!existsSync(file)) { fail(rel, 'route in sitemap but file missing'); continue; }
  const html = readFileSync(file, 'utf8');
  for (const k of ['head', 'foot']) {
    if ((html.match(new RegExp(`<!-- e5:chrome-${k}( front)? -->`, 'g')) || []).length !== 1) fail(rel, `expected exactly one e5:chrome-${k} marker`);
    if ((html.match(new RegExp(`<!-- /e5:chrome-${k} -->`, 'g')) || []).length !== 1) fail(rel, `expected exactly one closing e5:chrome-${k} marker`);
  }
  if (!html.includes('class="e5-seal-mark"')) fail(rel, 'masthead seal missing');
  if ((html.match(/<details class="e5-mnav">/g) || []).length !== 1) fail(rel, 'expected one mobile nav');
  if (/<image-slot/i.test(html)) fail(rel, 'design-tool <image-slot> placeholder present');
  if (/image-slot\.js/.test(html)) fail(rel, 'references image-slot.js scaffold');
  if (/placeholder="[^"]*(drop|image|photo|bound and boxed)/i.test(html)) fail(rel, 'placeholder attribute left in markup');
  if (!/<main[\s>]/.test(html)) fail(rel, 'no <main> landmark');
  const text = visibleText(html);
  for (const re of FORBID) { const m = text.match(re); if (m) fail(rel, `forbidden wording "${m[0]}"`); }
  for (const m of text.matchAll(/.{0,50}campaign.{0,40}/gi)) warns.push(`${rel}: …${m[0].trim()}…`);
}

// Standing order (wiki: docs/doctrine/no-azure.md): Netlify and Azure are not in the stack.
// Hosting is Cloudflare, with GitHub Pages as the static fallback. Fail if either creeps back in.
for (const dead of ['netlify.toml', 'netlify', '.netlify', 'staticwebapp.config.json', 'azure-pipelines.yml']) {
  if (existsSync(resolve(ROOT, dead))) fail(dead, 'dead platform config present (no Netlify, no Azure)');
}
if (existsSync(resolve(ROOT, '.github/workflows'))) {
  for (const wf of readdirSync(resolve(ROOT, '.github/workflows'))) {
    const y = readFileSync(resolve(ROOT, '.github/workflows', wf), 'utf8');
    if (/netlify|azure\/static-web-apps|Azure\/webapps/i.test(y)) fail(`.github/workflows/${wf}`, 'workflow references a dead platform (Netlify/Azure)');
  }
}

const stale = applyChrome({ write: false }).filter(r => r.changed);
for (const r of stale) fail(r.file, 'chrome is stale — run `npm run chrome`');

for (const f of fails) console.error('FAIL', f);
if (warns.length) { console.log(`${warns.length} "campaign" mention(s) to eyeball (not failures):`); for (const w of warns) console.log('  ', w); }
console.log(`${routes.length} routes checked; ${fails.length} failure(s)`);
process.exit(fails.length ? 1 : 0);
