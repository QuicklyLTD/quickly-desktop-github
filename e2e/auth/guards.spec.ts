import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Authentication - Route Guards', () => {
  test('TC-GUARD-001: Store route should be reachable in E2E mode', async ({ page }) => {
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
    await page.goto('/#/store');
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });
});