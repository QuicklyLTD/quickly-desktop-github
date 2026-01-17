import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Authentication - Login & Logout', () => {
  test('TC-AUTH-001: LoginAs sets user session', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    const userName = await page.evaluate(() => localStorage.getItem('userName'));
    expect(userName).toBe('Admin User');
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });

  test('TC-AUTH-002: Session persists across refresh', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    await page.reload();
    const userName = await page.evaluate(() => localStorage.getItem('userName'));
    expect(userName).toBe('Admin User');
  });
});