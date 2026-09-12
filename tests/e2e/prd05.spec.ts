import { expect, test } from '@playwright/test';

test('desktop Chromium click out of range auto-moves and resolves interaction without second input', async ({
  page,
}, testInfo) => {
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
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'out-of-range');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#progress-output')).toContainText('0');
  const before = Number(await page.locator('html').getAttribute('data-player-x'));

  await page.locator('canvas').click({ position: { x: 430, y: 360 } });

  await expect(page.locator('html')).toHaveAttribute('data-last-input-mode', 'click-tap');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  await expect(page.locator('html')).toHaveAttribute('data-auto-move', 'idle');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-state', 'triggered');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-resolutions', '1');
  await expect(page.locator('#interaction-output')).toHaveText('Discovery recorded!');
  await expect(page.locator('#progress-output')).toContainText('1');
  const after = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(after).toBeGreaterThan(before);

  await page.locator('#pause-button').click();
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.locator('#resume-button').click();
  await expect(page.locator('#pause-panel')).toBeHidden();
  await page.reload();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('1');
  expect(errors).toEqual([]);
});

test('desktop Chromium click already in range resolves immediately without auto move', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/');
  await page.locator('#profile-name').fill('Immediate Explorer');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();

  await page.locator('canvas').click({ position: { x: 430, y: 360 } });
  await expect(page.locator('html')).toHaveAttribute('data-interaction-resolutions', '1');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  const xBeforeImmediateClick = await page.locator('html').getAttribute('data-player-x');
  const yBeforeImmediateClick = await page.locator('html').getAttribute('data-player-y');

  await page.locator('canvas').click({ position: { x: 430, y: 360 } });

  await expect(page.locator('html')).toHaveAttribute('data-interaction-resolutions', '2');
  await expect(page.locator('html')).toHaveAttribute('data-auto-move', 'idle');
  await expect(page.locator('#interaction-output')).toHaveText(
    'Discovery already recorded — interaction confirmed.',
  );
  await expect(page.locator('html')).toHaveAttribute('data-player-x', xBeforeImmediateClick ?? '');
  await expect(page.locator('html')).toHaveAttribute('data-player-y', yBeforeImmediateClick ?? '');
  await expect(page.locator('#progress-output')).toContainText('1');
});

test('mobile WebKit tap out of range auto-moves and resolves interaction without joystick', async ({
  page,
}, testInfo) => {
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
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'out-of-range');
  await expect(page.locator('.touch-dpad')).toHaveCount(0);
  await expect(page.locator('canvas')).toBeVisible();

  await page.locator('canvas').tap({ position: { x: 430, y: 195 } });

  await expect(page.locator('html')).toHaveAttribute('data-last-input-mode', 'click-tap');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  await expect(page.locator('html')).toHaveAttribute('data-auto-move', 'idle');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-state', 'triggered');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-resolutions', '1');
  await expect(page.locator('#interaction-output')).toHaveText('Discovery recorded!');
  await expect(page.locator('#progress-output')).toContainText('1');
  await page.locator('#pause-button').tap();
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.locator('#resume-button').tap();
  await expect(page.locator('#pause-panel')).toBeHidden();
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
  await expect(page.locator('#progress-output')).toContainText('0');
  for (let index = 0; index < 12; index += 1) {
    if ((await page.locator('html').getAttribute('data-interaction-range')) === 'in-range') break;
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(100);
    await page.keyboard.up('ArrowRight');
  }
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  await page.keyboard.press('KeyE');
  await expect(page.locator('#progress-output')).toContainText('1');
});
