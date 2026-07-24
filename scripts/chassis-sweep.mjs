import fs from 'node:fs/promises';
import path from 'node:path';

const base = (process.env.E5_QA_BASE_URL || 'https://e5enclave.com').replace(/\/$/, '');
const xml = await fs.readFile('public/sitemap.xml', 'utf8');
const routes = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
const results = [];

for (const route of routes) {
  const started = performance.now();
  try {
    const response = await fetch(`${base}${route}`, { redirect: 'follow' });
    const html = await response.text();
    results.push({
      route,
      status: response.status,
      ms: Math.round(performance.now() - started),
      main: /<main[\s>]/i.test(html),
      navigation: /<(?:nav[\s>]|[^>]+class="[^"]*(?:vc-nav|header__nav))/i.test(html),
      footer: /<(?:footer[\s>]|[^>]+class="[^"]*(?:vc-foot|footer))/i.test(html),
      cinematic: route === '/' ? html.includes('/assets/cinematic/e5-cinematic.js') : undefined,
    });
  } catch (error) {
    results.push({ route, status: 0, ms: Math.round(performance.now() - started), error: String(error) });
  }
}

const failed = results.filter((r) => r.status < 200 || r.status >= 400 || !r.main || !r.footer);
const report = { base, capturedAt: new Date().toISOString(), total: results.length, failed: failed.length, results };
const out = path.resolve('artifacts/qa/chassis-sweep.json');
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ base, total: results.length, failed: failed.length, report: out }, null, 2));
if (failed.length) process.exitCode = 1;
