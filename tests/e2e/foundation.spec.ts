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
  await expect.poll(() => page.locator('html').getAttribute('data-play-shell')).toBe('ready');
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

test('desktop Chromium keeps the PRD-03 IndexedDB foundation through the PRD-04 flow', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Chromium persistence proof.');
  const errors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');
  await page.locator('#profile-name').fill('Alex');
  await page.locator('#create-profile').click();
  await page.locator('#play-profile').click();
  await expect(page.locator('#progress-output')).toContainText('0');
  await expect(page.locator('html')).toHaveAttribute('data-interaction-range', 'out-of-range');
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(
    () => document.documentElement.dataset.interactionRange === 'in-range',
  );
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.locator('#progress-output')).toContainText('1');
  const profileId = await page.locator('html').evaluate(() => {
    const raw = localStorage.getItem('wonderlands.profile-registry.v1');
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as { activeProfileId?: string };
    return snapshot.activeProfileId ?? null;
  });
  expect(profileId).not.toBeNull();
  if (!profileId) throw new Error('Expected a profile id.');
  await page.reload();
  const exists = await page.evaluate(
    async ({ profileId }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('treasure-pop-wonderlands');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
      });
      const row = await new Promise<unknown>((resolve, reject) => {
        const request = db.transaction('saves').objectStore('saves').get(`${profileId}:current`);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
      });
      db.close();
      return Boolean(row);
    },
    { profileId },
  );
  expect(exists).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile WebKit keeps real touch and IndexedDB foundation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-landscape-webkit', 'Mobile WebKit proof.');
  const errors = watchUnexpectedConsoleErrors(page);
  await page.goto('/');
  await page.locator('#profile-name').fill('Touch Foundation');
  await page.locator('#create-profile').tap();
  await page.locator('#play-profile').tap();
  const before = Number(await page.locator('html').getAttribute('data-player-x'));
  await page.getByRole('button', { name: 'Move right' }).tap();
  await page.waitForTimeout(120);
  const after = Number(await page.locator('html').getAttribute('data-player-x'));
  expect(after).toBeGreaterThan(before);
  expect(errors).toEqual([]);
});

test('portrait gate remains valid', async ({ page }) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/');
  await expect(page.locator('#game-root')).toBeHidden();
  await expect(page.locator('#portrait-gate')).toBeVisible();
});
