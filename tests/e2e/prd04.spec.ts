import { expect, test } from '@playwright/test';

test('desktop Chromium proves profile, movement, interaction, pause, reload, and profile separation', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#create-profile')).toBeVisible();
  await page.locator('#profile-name').fill('Explorer One');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('0');
  const before = Number(await page.locator('html').getAttribute('data-player-x'));
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => document.documentElement.dataset.interactionRange === 'in-range',
  );
  await page.keyboard.up('ArrowRight');
  const after = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(after).toBeGreaterThan(before);
  await page.keyboard.press('Space');
  await expect(page.locator('#progress-output')).toContainText('1');
  await page.keyboard.press('Escape');
  await expect(page.locator('#pause-panel')).toBeVisible();
  await page.locator('#resume-button').click();
  await expect(page.locator('#pause-panel')).toBeHidden();
  await page.reload();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('1');
  await page.keyboard.press('Escape');
  await page.locator('#profiles-button').click();
  await page.locator('#profile-name').fill('Explorer Two');
  await page.locator('#create-profile').click();
  await page.locator('.profile-choice', { hasText: 'Explorer Two' }).click();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('0');
  expect(errors).toEqual([]);
});

test('desktop Chromium proves real world bounds and obstacle collision', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Collision');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(1500);
  await page.keyboard.up('ArrowLeft');
  const leftBoundX = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(leftBoundX).toBeGreaterThanOrEqual(24);
  expect(leftBoundX).toBeLessThanOrEqual(25);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(3000);
  await page.keyboard.up('ArrowRight');
  const collisionX = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(collisionX).toBeGreaterThan(650);
  expect(collisionX).toBeLessThan(676);
  expect(errors).toEqual([]);
});

test('Firefox launches the real Play Shell without runtime errors', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-firefox');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Firefox');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await expect(page.locator('html')).toHaveAttribute('data-play-shell', 'ready');
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});

test('mobile WebKit uses real touch controls for movement, interaction, pause, and persistence', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Touch');
  await page.locator('#create-profile').tap();
  await page.locator('#play-profile').tap();
  const before = Number(await page.locator('html').getAttribute('data-player-x'));
  const right = page.getByRole('button', { name: 'Move right' });
  for (let index = 0; index < 10; index += 1) {
    if ((await page.locator('html').getAttribute('data-interaction-range')) === 'in-range') break;
    await right.tap();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  const after = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(after).toBeGreaterThan(before);
  await page.locator('#touch-interact').tap();
  await expect(page.locator('#progress-output')).toContainText('1');
  await page.locator('#touch-pause').tap();
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
