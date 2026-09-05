#!/usr/bin/env node
// Renders the Sovereign chrome (masthead + footer) from scripts/chrome/ into every
// page under public/ that carries the chrome markers:
//
//   <!-- e5:chrome-head -->        …  <!-- /e5:chrome-head -->        (route variant)
//   <!-- e5:chrome-head front -->  …  <!-- /e5:chrome-head -->        (homepage variant)
//   <!-- e5:chrome-foot [front] -->…  <!-- /e5:chrome-foot -->
//
// Legacy pages that still carry the un-marked `<div class="sov-chrome sov-chrome-head">`
// block are migrated to markers on the first run. Each file's line endings are preserved.
//
//   node scripts/apply-chrome.mjs            # write
//   node scripts/apply-chrome.mjs --check    # exit 1 if any page is stale (used by `npm run build`)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV, GIVE_HREF, VARIANTS } from './chrome/nav.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = resolve(ROOT, 'public');
const CHROME = resolve(ROOT, 'scripts/chrome');
const read = f => readFileSync(resolve(CHROME, f), 'utf8').replace(/\r\n/g, '\n').replace(/\n$/, '');

const HEAD = read('head.html');
const FOOT = read('foot.html');
const PHOTO = read('photo-credits.html');

export function render(kind, variantName) {
  const v = VARIANTS[variantName];
  if (!v) throw new Error(`unknown chrome variant "${variantName}"`);
  if (kind === 'head') {
    const links = NAV.map(n => `        <a data-m="hide" href="${v.href(n)}" class="h1">${n.label}</a>`).join('\n');
    const mobile = NAV.map(n => `            <a href="${v.href(n)}">${n.label}</a>`).join('\n');
    return HEAD.replace('{{HOME_HREF}}', v.homeHref).replace('{{NAV_LINKS}}', links).replace('{{MOBILE_LINKS}}', mobile).replaceAll('{{GIVE_HREF}}', GIVE_HREF) + '\n';
  }
  return FOOT.replace('{{FOOT_MARGIN}}', v.footMargin).replace('{{PHOTO_CREDITS}}\n', v.photoCredits ? `  ${PHOTO}\n` : '') + '\n';
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== 'dist') yield* walk(p); }
    else if (name.endsWith('.html')) yield p;
  }
}

// Wrap the legacy un-marked blocks in markers. Blocks are top-level divs whose
// closing tag is the first `</div>` at column 0 after the opener.
function migrate(src) {
  const wrap = (cls, marker) => {
    const open = `<div class="sov-chrome ${cls}"`;
    const i = src.indexOf(open);
    if (i < 0 || src.includes(`<!-- e5:chrome-${marker}`)) return;
    const close = src.indexOf('\n</div>\n', i);
    if (close < 0) throw new Error(`unterminated ${cls} block`);
    const end = close + '\n</div>\n'.length;
    src = src.slice(0, i) + `<!-- e5:chrome-${marker} -->\n` + src.slice(i, end) + `<!-- /e5:chrome-${marker} -->\n` + src.slice(end);
  };
  wrap('sov-chrome-head', 'head');
  wrap('sov-chrome-foot', 'foot');
  return src;
}

export function processFile(file, { write }) {
  const raw = readFileSync(file, 'utf8');
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let src = raw.replace(/\r\n/g, '\n');
  if (!src.includes('e5:chrome-head') && !src.includes('sov-chrome sov-chrome-head')) return null; // not a chrome page
  src = migrate(src);
  for (const kind of ['head', 'foot']) {
    const re = new RegExp(`<!-- e5:chrome-${kind}( [\\w-]+)? -->\\n?[\\s\\S]*?<!-- /e5:chrome-${kind} -->`);
    const m = src.match(re);
    if (!m) throw new Error(`${relative(ROOT, file)}: missing e5:chrome-${kind} markers`);
    const variant = (m[1] || 'route').trim();
    src = src.replace(m[0], `<!-- e5:chrome-${kind}${m[1] || ''} -->\n${render(kind, variant)}<!-- /e5:chrome-${kind} -->`);
  }
  const next = src.replace(/\n/g, eol);
  const changed = next !== raw;
  if (changed && write) writeFileSync(file, next);
  return { file: relative(ROOT, file), changed, variant: /e5:chrome-head front/.test(src) ? 'front' : 'route' };
}

export function run({ write }) {
  const results = [];
  for (const f of walk(PUBLIC)) { const r = processFile(f, { write }); if (r) results.push(r); }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  const results = run({ write: !check });
  const stale = results.filter(r => r.changed);
  console.log(`${results.length} chrome pages (${results.filter(r => r.variant === 'front').length} front); ${stale.length} ${check ? 'stale' : 'rewritten'}`);
  for (const r of stale) console.log(`  ${check ? 'STALE' : 'wrote'} ${r.file}`);
  if (check && stale.length) { console.error('Run `npm run chrome` and commit the result.'); process.exit(1); }
}
