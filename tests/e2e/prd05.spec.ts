import { expect, test } from '@playwright/test';

test('Wonder World visual prototype is present and readable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#profile-name').fill('Visual Explorer');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await expect(page.locator('html')).toHaveAttribute(
    'data-wonder-world',
    'visual-prototype-ready',
  );
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#progress-output')).toBeVisible();
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => document.documentElement.dataset.interactionRange === 'in-range',
  );
  await page.keyboard.up('ArrowRight');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'in-range');
  expect(errors).toEqual([]);
});

test('Wonder World keeps mobile controls and portrait gate', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit');
  await page.goto('/');
  await page.locator('#profile-name').fill('Visual Touch');
  await page.locator('#create-profile').tap();
  await page.locator('#play-profile').tap();
  await expect(page.locator('html')).toHaveAttribute(
    'data-wonder-world',
    'visual-prototype-ready',
  );
  await expect(page.getByRole('button', { name: 'Move right' })).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
});
