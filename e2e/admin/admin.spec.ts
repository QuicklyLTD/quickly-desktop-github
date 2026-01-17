import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Admin', () => {
  test('TC-ADMIN-001: Admin page should render', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    await page.goto('/#/admin');
    await expect(page.locator('[data-testid="page-admin"]')).toBeVisible();
  });
});