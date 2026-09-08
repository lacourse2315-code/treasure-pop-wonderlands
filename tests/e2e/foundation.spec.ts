import { expect, test, type Page } from '@playwright/test';

function watchUnexpectedConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}
async function expectLandscapeFoundation(page: Page): Promise<void> {
  const errors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');
  await expect(page.locator('#game-root canvas')).toBeVisible();
  await expect.poll(() => page.locator('html').getAttribute('data-wonderlands-boot')).toBe('ready');
  await expect.poll(() => page.locator('html').getAttribute('data-phaser-version')).toBe('4.2.1');
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth,
    innerHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);
  await page.waitForTimeout(100);
  expect(errors).toEqual([]);
}

test('foundation remains healthy', async ({ page }) => {
  await expectLandscapeFoundation(page);
});

test('profile save survives reload in real IndexedDB and keyboard emits command', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Chromium PRD-03 persistence proof.');
  const errors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');
  await page.locator('#profile-name').fill('Alex');
  await page.locator('#create-profile').click();
  await page.locator('#progress-value').fill('42');
  await page.locator('#save-progress').click();
  await expect(page.locator('#dev-harness')).toHaveAttribute('data-save-status', 'saved');
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#dev-harness')).toHaveAttribute('data-last-command', 'move-left');
  const profileId = await page.locator('.profile-choice').first().getAttribute('data-profile-id');
  await page.reload();
  await page.locator('#profile-name').fill('Alex Reload');
  await page.locator('#create-profile').click();
  await page.evaluate(
    async ({ profileId }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('treasure-pop-wonderlands');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const row = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get(`${profileId}:current`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      (window as unknown as { __prd03Persisted?: unknown }).__prd03Persisted = row;
    },
    { profileId },
  );
  expect(
    await page.evaluate(() =>
      Boolean((window as unknown as { __prd03Persisted?: unknown }).__prd03Persisted),
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile WebKit persists IndexedDB and touch emits same semantic command', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit', 'Mobile WebKit PRD-03 proof.');
  const errors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');
  await page.locator('#profile-name').fill('Touch');
  await page.locator('#create-profile').click();
  await page.locator('#progress-value').fill('7');
  await page.locator('#save-progress').click();
  const id = await page.locator('.profile-choice').first().getAttribute('data-profile-id');
  await page.locator('[data-player-command="primary-action"]').tap();
  await expect(page.locator('#dev-harness')).toHaveAttribute('data-last-command', 'primary-action');
  await page.reload();
  const exists = await page.evaluate(
    async ({ id }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('treasure-pop-wonderlands');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      const row = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get(`${id}:current`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return Boolean(row);
    },
    { id },
  );
  expect(exists).toBe(true);
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    innerWidth,
    innerHeight,
  }));
  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
  expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.innerHeight);
  expect(errors).toEqual([]);
});

test('portrait gate remains valid', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await expect(page.locator('#game-root')).toBeHidden();
  await expect(page.locator('#portrait-gate')).toBeVisible();
});
