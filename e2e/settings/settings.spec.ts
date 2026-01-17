import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Settings', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
  });

  test('TC-SETTINGS-001: Settings page should render', async () => {
    await page.goto('/#/settings');
    await expect(page.locator('[data-testid="page-settings"]')).toBeVisible();
  });

  test('TC-SETTINGS-002: Settings navigation cards should be visible', async () => {
    await page.goto('/#/settings');
    await expect(page.locator('[data-testid="settings-nav-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-nav-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-nav-tables"]')).toBeVisible();
    await page.locator('[data-testid="settings-nav-products"]').click({ force: true });
  });

  test('TC-SETTINGS-003: Settings nav printers and app should be visible', async () => {
    await page.goto('/#/settings');
    await expect(page.locator('[data-testid="settings-nav-printers"]')).toBeVisible();
    await expect(page.locator('[data-testid="settings-nav-app"]')).toBeVisible();
  });
});