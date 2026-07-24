import { test, expect } from '@playwright/test';

declare global {
  interface Window { __e5Vitals?: { lcp: number; cls: number; inp: number } }
}

test('local synthetic web-vital proxies remain inside release budgets', async ({ page }) => {
  await page.addInitScript(() => {
    window.__e5Vitals = { lcp: 0, cls: 0, inp: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__e5Vitals!.lcp = Math.max(window.__e5Vitals!.lcp, entry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
          if (!entry.hadRecentInput) window.__e5Vitals!.cls += entry.value || 0;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__e5Vitals!.inp = Math.max(window.__e5Vitals!.inp, entry.duration || 0);
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {}
  });
  await page.goto('/?v=alpha');
  await page.evaluate(() => window.E5Cinematic?.ready);
  await page.locator('#vc-palette-toggle').click();
  await page.waitForTimeout(150);
  const vitals = await page.evaluate(() => window.__e5Vitals!);
  expect(vitals.lcp).toBeLessThanOrEqual(2500);
  expect(vitals.cls).toBeLessThanOrEqual(0.1);
  expect(vitals.inp).toBeLessThanOrEqual(200);
  const bootstrap = await page.evaluate(() => performance.getEntriesByType('resource').find((entry) => entry.name.endsWith('/assets/cinematic/e5-cinematic.js'))?.transferSize || 0);
  expect(bootstrap).toBeLessThanOrEqual(16 * 1024);
});
