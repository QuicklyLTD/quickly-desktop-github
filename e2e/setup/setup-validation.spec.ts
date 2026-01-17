import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Setup - Validation', () => {
  test('TC-SETUP-003: Setup screen should be reachable', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/#/setup');
    await expect(page.locator('[data-testid="page-setup"]')).toBeVisible();
  });
});