// verify-claims.mjs — truth-and-presentation gate for public/ (Phase ½ stabilization, 2026-09-09).
// Runs inside `npm run verify`. Fails the build on: stale or unsupported institutional claims,
// placeholder tokens, fused Roman-numeral labels, doubled spaces in headings, mojibake, broken
// obfuscated-email literals, metadata length faults, and more than one <h1>.
//
// Measurement rule (e5-ship-page): every failure prints the exact value it measured. A checker
// that reports something surprising about deliberate content is more likely wrong than the content,
// so nothing here rewrites anything — it only refuses to ship.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const PUBLIC = join(ROOT, 'public');
const failures = [];
const fail = (file, msg) => failures.push(`${file}: ${msg}`);

// Routes that are NOT public pages (scaffolding, mirrors, internal): checked for encoding only.
const NON_PUBLIC = /^\/(dc|hub\.html|privacy\.html|atelier|books|compositions|pages|signon|strategy|404\.html)/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith('.html')) out.push(p);
  }
  return out;
}

// Stale or unsupported claims. Each entry: [regex, reason]. Lifted when the underlying fact changes.
const FORBIDDEN_CLAIMS = [
  [/active\s+federal\s+contractor/i,        'SAM registration lapsed 4 Aug 2026 (O1) — remove until renewed'],
  [/Active\s+through\s+Aug(?:ust)?\s+4,?\s+2026/i, 'SAM expiry date has passed (O1)'],
  [/SBIR\s*\/\s*STTR\s+Eligible/i,          'a 501(c)(3) is not an SBIR/STTR awardee; attribute to AgriMesh Corporation or remove (O10)'],
  [/\bDIBBS\b/,                              'DLA DIBBS account suspended 2 Sep 2026 (O2)'],
  [/Slack\s+for\s+Nonprofits/i,             'no enrollment exists (09 §3)'],
  [/Microsoft\s+for\s+Nonprofits/i,         'grant expired; no current award (09 §3)'],
  [/\bPostHog\b/,                            'not deployed — the site runs Google Analytics 4 and the Google Ads tag'],
  [/world(?:'|’)s\s+first/i,                 'unverifiable superlative — "among the first" or cite the method (11 §3)'],
  [/\[email(?:&#160;|&nbsp;|\s)protected\]/i,'Cloudflare email-obfuscation placeholder baked into source — write the address'],
  [/2026\s*<\/div><div[^>]*>\s*Founding\s+year/i, 'founding year is 2024 (D8)'],
  [/registrant\s+in\s+good\s+standing/i,      'SAM registration lapsed 4 Aug 2026 (O1) — "renewal in progress" until a .gov confirmation exists'],
  [/Federal\s+registrant\.\s*Active\s+status/i,'SAM registration lapsed 4 Aug 2026 (O1)'],
  [/Active\s+through\s+August\s+2026/i,        'SAM expiry date has passed (O1)'],
  [/nonprofit\s*\+\s*federal\s+contractor/i,   'SAM registration lapsed 4 Aug 2026 (O1)'],
  [/Full\s+financials/i,                        'no financials are published — institutional disclosure sits at the federal floor (D5)'],
  [/Open\s+bylaws/i,                            'bylaws are not published (D5)'],
  [/bylaws[^<.]{0,60}published/i,               'bylaws are not published (D5)'],
  [/audited\s+financials/i,                     'no audited financials exist or are published (D5)'],
  [/No\s+admin\s+overhead/i,                   'unsupportable fundraising representation (D18) — use "directed to the programs named"'],
  [/directors\s+of\s+record/i,                 'no board roster is published (D6)'],
  [/BDI\s+Sovereign\s+Dataset/i,               'BDI = Black Distress Index; write "the Black Distress Index dataset" (D13)'],
  [/window\.__E5_VARIANT\s*=|src="\/variant\.js"/, 'the A/B variant layer was retired 9 Sep 2026 (D9); the Google tag lives in the chrome partial'],
];

// Placeholder tokens that must never ship on a public page.
const PLACEHOLDERS = [/Standing By/, /Coming Soon/i, /\bTBD\b/, /\bLorem\b/, /Next Case/, /\bPlaceholder\b/i, /<redacted>/i, /\bredacted\b/i];

const textOf = html => html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ');

for (const file of walk(PUBLIC)) {
  const rel = '/' + relative(PUBLIC, file).split('\\').join('/');
  const raw = readFileSync(file);
  const html = raw.toString('utf8');

  // Encoding: valid UTF-8, no replacement characters (checked on every file, public or not)
  if (html.includes('\uFFFD')) fail(rel, 'contains U+FFFD replacement character — re-encode the source as UTF-8');

  if (NON_PUBLIC.test(rel)) continue;
  const body = textOf(html);

  for (const [re, why] of FORBIDDEN_CLAIMS) {
    const m = body.match(re) || html.match(re);
    if (m) fail(rel, `forbidden claim "${m[0]}" — ${why}`);
  }
  const visible = body.replace(/<[^>]+>/g, ' ');
  // D13: "BDI" means the Black Distress Index and nothing else. The Black Dragons Initiative is never abbreviated.
  if (/Black\s+Dragons\s+Initiative\s*\(BDI\)/i.test(visible)) fail(rel, 'Black Dragons Initiative is never abbreviated (D13)');
  if (/\bBDI\b/.test(visible) && !/Black\s+Distress\s+Index/i.test(visible)) fail(rel, '"BDI" used without "Black Distress Index" on the page — expand it, or it reads as Black Dragons (D13)');
  for (const re of PLACEHOLDERS) {
    const m = visible.match(re);
    if (m) fail(rel, `placeholder text "${m[0]}"`);
  }

  // Fused labels: a Roman numeral immediately followed by a letter with no separator, in visible text
  // e.g. "IVBefore Congress". Only inspect eyebrow/heading-like runs to avoid false hits in prose.
  for (const m of body.matchAll(/>\s*((?:I|II|III|IV|V|VI|VII|VIII|IX|X))<\/(?:span|b|i|em|strong)>([A-Z][a-z])/g)) {
    fail(rel, `Roman numeral fused to label: "${m[1]}${m[2]}…" — add a space after </span>`);
  }

  // Doubled spaces inside headings
  for (const m of html.matchAll(/<h[1-6][^>]*>([^<]*?)<\/h[1-6]>/g)) {
    if (/\S {2,}\S/.test(m[1])) fail(rel, `doubled space in heading: "${m[1].trim().slice(0, 60)}"`);
  }

  // Exactly one <h1>
  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1s !== 1) fail(rel, `expected exactly one <h1>, found ${h1s}`);

  // Title ≤ 70; description 50–165 measured with a delimiter-honoring regex (never [^"'])
  const t = html.match(/<title>([^<]*)<\/title>/i);
  if (!t) fail(rel, 'no <title>');
  else if (t[1].trim().length > 70) fail(rel, `title is ${t[1].trim().length} chars (>70): "${t[1].trim()}"`);
  const d = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || html.match(/<meta\s+name="description"\s+content='([^']*)'/i);
  if (!d) fail(rel, 'no meta description');
  else {
    const len = d[1].trim().length;
    if (len < 50 || len > 165) fail(rel, `meta description is ${len} chars (want 50–165): "${d[1].trim().slice(0, 80)}…"`);
  }
}

// _redirects: every source with a trailing slash also needs its unslashed twin (Pages strips it before matching)
const redirects = readFileSync(join(PUBLIC, '_redirects'), 'utf8').split(/\r?\n/)
  .map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => l.split(/\s+/)[0]);
const set = new Set(redirects);
for (const src of redirects) {
  if (src.length > 1 && src.endsWith('/') && !src.includes('*') && !set.has(src.slice(0, -1)))
    fail('_redirects', `"${src}" has no unslashed twin "${src.slice(0, -1)}" — Pages will not match it`);
}

if (failures.length) {
  console.error(`verify-claims: ${failures.length} failure(s)`);
  for (const f of failures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log('verify-claims: 0 failures');
