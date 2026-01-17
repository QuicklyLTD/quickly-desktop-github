import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
});

test.describe('Setup - Initial Setup Flow', () => {
  test('TC-SETUP-001: Setup page should render', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/#/setup');
    await expect(page.locator('[data-testid="page-setup"]')).toBeVisible();
  });

  test('TC-SETUP-002: Primary/Secondary options should be visible', async ({ page }) => {
    await seedLocalStorage(page);
    await page.goto('/#/setup');
    await expect(page.locator('[data-testid="setup-primary"]')).toBeVisible();
    await expect(page.locator('[data-testid="setup-secondary"]')).toBeVisible();
  });
});