import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const viewports = [
  { name: '16x9', width: 1440, height: 810 },
  { name: '9x16', width: 430, height: 764 },
  { name: '1x1', width: 900, height: 900 },
];

test('semantic shell and cinematic runtime coexist', async ({ page }) => {
  await page.goto('/?v=alpha');
  await expect(page.locator('main#main')).toBeVisible();
  await expect(page.locator('.vc-wordmark')).toContainText('Enclave');
  await expect(page.locator('.vc-nav')).toBeVisible();
  await expect(page.locator('.vc-foot')).toBeAttached();
  await page.waitForFunction(() => Boolean(window.E5Cinematic));
  await page.evaluate(() => window.E5Cinematic?.ready);
  const state = await page.evaluate(() => window.E5Cinematic?.getState());
  expect(state?.compositionId).toBe('e5-home-genesis');
  expect(Array.isArray(state?.adapters)).toBeTruthy();
  await expect(page.locator('.e5-motion-toggle')).toBeVisible();
});

test('authored reduced-motion path keeps semantic content and removes canvas', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/?v=alpha');
  await page.waitForFunction(() => Boolean(window.E5Cinematic));
  await page.evaluate(() => window.E5Cinematic?.ready);
  await expect(page.locator('.vc-wordmark')).toBeVisible();
  await expect(page.locator('.e5-cinematic-canvas')).toHaveCount(0);
  await expect(page.locator('html')).toHaveClass(/e5-reduced-motion/);
  await context.close();
});

test('capture path exercises WebGL and context-loss fallback', async ({ page }) => {
  await page.goto('/?v=alpha&capture=1');
  await page.evaluate(() => window.E5Cinematic?.ready);
  const canvas = page.locator('.e5-cinematic-canvas');
  await expect(canvas).toHaveCount(1);
  await canvas.dispatchEvent('webglcontextlost');
  await expect(page.locator('html')).toHaveClass(/e5-canvas-fallback/);
  await expect(page.locator('.vc-wordmark')).toBeVisible();
});

test('homepage has no serious or critical axe violations', async ({ page }) => {
  await page.goto('/?v=alpha');
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
});

for (const viewport of viewports) {
  test(`capture ${viewport.name} top and footer`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/?v=alpha&capture=1');
    await page.evaluate(() => window.E5Cinematic?.ready);
    await page.evaluate(() => window.E5Cinematic?.seekFrame(90));
    const dir = path.join('artifacts', 'qa', viewport.name);
    await fs.mkdir(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, 'top.png'), fullPage: false });
    await page.locator('.vc-foot').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(dir, 'footer.png'), fullPage: false });
  });
}
