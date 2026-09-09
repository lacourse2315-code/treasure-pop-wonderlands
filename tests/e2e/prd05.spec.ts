import { expect, test } from '@playwright/test';

test('desktop Chromium plays Wonder World entirely with mouse click', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Click Explorer');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await expect(page.locator('html')).toHaveAttribute('data-click-tap-first', 'ready');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#progress-output')).toContainText('0');
  const before = Number(await page.locator('html').getAttribute('data-player-x'));
  await page.locator('canvas').click({ position: { x: 430, y: 360 } });
  await expect(page.locator('html')).toHaveAttribute('data-last-input-mode', 'click-tap');
  await expect(page.locator('#progress-output')).toContainText('1');
  const after = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(after).toBeGreaterThan(before);
  await page.locator('#pause-button').click();
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.locator('#resume-button').click();
  await page.reload();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('1');
  expect(errors).toEqual([]);
});

test('mobile WebKit plays Wonder World entirely by touch and has no joystick', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Tap Explorer');
  await page.locator('#create-profile').tap();
  await page.locator('#play-profile').tap();
  await expect(page.locator('html')).toHaveAttribute('data-click-tap-first', 'ready');
  await expect(page.locator('.touch-dpad')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();
  await page.locator('canvas').tap({ position: { x: 430, y: 195 } });
  await expect(page.locator('html')).toHaveAttribute('data-last-input-mode', 'click-tap');
  await expect(page.locator('#progress-output')).toContainText('1');
  await page.locator('#pause-button').tap();
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.locator('#resume-button').tap();
  await page.reload();
  await page.locator('#play-profile').tap();
  await expect(page.locator('#progress-output')).toContainText('1');
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollHeight <= innerHeight &&
        document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('E remains a secondary compatibility interaction', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');
  await page.locator('#profile-name').fill('Keyboard Compatibility');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => document.documentElement.dataset.interactionRange === 'in-range');
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('KeyE');
  await expect(page.locator('#progress-output')).toContainText('1');
});
