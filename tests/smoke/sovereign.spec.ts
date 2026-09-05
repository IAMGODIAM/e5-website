import { test, expect, type Page } from '@playwright/test';

// Simulate the owner's worst case: third-party hosts (unpkg three.js, gtag, Google Fonts) unreachable.
const offline = (page: Page) => page.route('**/*', route => {
  const host = new URL(route.request().url()).host;
  return /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) ? route.continue() : route.abort();
});

for (const vp of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
  test.describe(`${vp.width}×${vp.height}`, () => {
    test.use({ viewport: vp });

    test('Section IV is visible with the external network down', async ({ page }) => {
      await offline(page);
      await page.goto('/');
      await page.locator('#congress').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);
      const opacities = await page.locator('#congress [data-reveal]').evaluateAll(els => els.map(e => getComputedStyle(e).opacity));
      expect(opacities.every(o => o === '1')).toBe(true);
      await expect(page.locator('#congress h2')).toBeVisible();
      await expect(page.locator('.e5-dcpkg')).toBeVisible();
    });

    test('anchor navigation does not hide the section label under the sticky bar', async ({ page }) => {
      await offline(page);
      await page.goto('/#congress');
      await page.waitForTimeout(600);
      const labelTop = await page.locator('#congress').evaluate(el => el.getBoundingClientRect().top);
      const barBottom = await page.locator('.e5-bar').evaluate(el => el.getBoundingClientRect().bottom);
      expect(labelTop).toBeGreaterThanOrEqual(barBottom - 1);
    });

    test('photography renders as real images', async ({ page }) => {
      await offline(page);
      await page.goto('/');
      await page.locator('#pillars').scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      const widths = await page.locator('#pillars img[data-parallax]').evaluateAll(imgs => imgs.map(i => (i as HTMLImageElement).naturalWidth));
      expect(widths.length).toBe(5);
      expect(widths.every(w => w > 0)).toBe(true);
    });

    test('masthead: seal, sticky bar, mobile menu on a subpage', async ({ page }) => {
      await offline(page);
      await page.goto('/brownsville/');
      const seal = page.locator('.e5-bar .e5-seal-mark');
      await expect(seal).toBeInViewport();
      expect(await seal.evaluate(i => (i as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      const menu = page.locator('.e5-mnav summary');
      if (vp.width <= 900) {
        await expect(menu).toBeVisible();
        const box = await menu.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width);
        await menu.click();
        await expect(page.locator('.e5-mnav-panel a', { hasText: 'Pillars' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('.e5-mnav-panel a', { hasText: 'Pillars' })).toBeHidden();
      } else {
        await expect(menu).toBeHidden();
        await expect(page.locator('.e5-nav > a', { hasText: 'Before Congress' })).toBeVisible();
      }
      await page.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' as ScrollBehavior }));
      await page.waitForTimeout(300);
      await expect(seal).toBeInViewport();
      expect(await page.locator('.e5-bar').evaluate(el => Math.round(el.getBoundingClientRect().top))).toBe(0);
    });

    test('gilded CTA row on a neighbourhood page fits the viewport', async ({ page }) => {
      await offline(page);
      await page.goto('/brownsville/');
      const links = page.locator('.nb-cta a');
      await expect(links).toHaveCount(3);
      for (const box of await links.evaluateAll(as => as.map(a => a.getBoundingClientRect().toJSON()))) {
        expect(box.right).toBeLessThanOrEqual(vp.width + 1);
      }
    });
  });
}
