import { expect, test, type Page } from '@playwright/test';

function watchUnexpectedConsoleErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
  });

  return errors;
}

async function expectLandscapeFoundation(page: Page): Promise<void> {
  const consoleErrors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');

  await expect(page.locator('#game-root canvas')).toBeVisible();
  await expect.poll(() => page.locator('html').getAttribute('data-wonderlands-boot')).toBe('ready');
  await expect.poll(() => page.locator('html').getAttribute('data-phaser-version')).toBe('4.2.1');

  const metrics = await page.evaluate(() => ({
    bodyOverflow: getComputedStyle(document.body).overflow,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));

  expect(metrics.bodyOverflow).toBe('hidden');
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);

  const box = await page.locator('#game-shell').boundingBox();
  expect(box).not.toBeNull();
  expect(box?.x ?? 0).toBeGreaterThanOrEqual(0);
  expect(box?.y ?? 0).toBeGreaterThanOrEqual(0);
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(metrics.innerWidth + 1);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(metrics.innerHeight + 1);

  await page.waitForTimeout(100);
  expect(consoleErrors).toEqual([]);
}

test('landscape foundation boots Phaser without document scrolling or browser errors', async ({
  page,
}) => {
  await expectLandscapeFoundation(page);
});

test('touch is enabled in the mobile WebKit landscape project', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit', 'Mobile WebKit-only assertion.');
  await page.goto('/');
  expect(await page.evaluate(() => navigator.maxTouchPoints > 0)).toBe(true);
});

test('portrait gate hides the game surface and remains inside the viewport', async ({ page }) => {
  const consoleErrors = watchUnexpectedConsoleErrors(page);
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');

  await expect.poll(() => page.locator('html').getAttribute('data-wonderlands-boot')).toBe('ready');
  await expect(page.locator('#game-root')).toBeHidden();
  await expect(page.locator('#portrait-gate')).toBeVisible();

  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);

  await page.waitForTimeout(100);
  expect(consoleErrors).toEqual([]);
});
