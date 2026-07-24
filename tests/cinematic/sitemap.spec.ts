import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

function routes(xml: string): string[] {
  return [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1] || '/');
}

test('canonical sitemap routes keep their semantic chassis', async ({ request }) => {
  const xml = await fs.readFile('public/sitemap.xml', 'utf8');
  const failures: Array<{ route: string; reason: string }> = [];
  for (const route of routes(xml)) {
    const response = await request.get(route);
    if (!response.ok()) { failures.push({ route, reason: `HTTP ${response.status()}` }); continue; }
    const body = await response.text();
    if (!/<main[\s>]/i.test(body)) failures.push({ route, reason: 'missing main landmark' });
    if (!/<(?:footer[\s>]|[^>]+class="[^"]*(?:vc-foot|footer))/i.test(body)) failures.push({ route, reason: 'missing footer/chassis marker' });
  }
  expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
});
