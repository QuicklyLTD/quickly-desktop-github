import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Home - Navigation', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'home');
  });

  test('TC-HOME-001: Home page should render', async () => {
    await expect(page.locator('[data-testid="page-home"]')).toBeVisible();
  });

  test('TC-HOME-002: Exit button should be visible', async () => {
    await expect(page.locator('[data-testid="home-exit"]')).toBeVisible();
  });

  test('TC-HOME-003: Navbar store menu should navigate to store', async () => {
    await page.locator('[data-testid="store-menu-item"]').click({ force: true });
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });

  test('TC-HOME-004: Navbar reports menu should navigate to reports', async () => {
    await page.locator('[data-testid="reports-menu-item"]').click({ force: true });
    await expect(page.locator('[data-testid="page-reports"]')).toBeVisible();
  });

  test('TC-HOME-005: Navbar cashbox menu should navigate to cashbox', async () => {
    await page.locator('[data-testid="cashbox-menu-item"]').click({ force: true });
    await expect(page.locator('[data-testid="page-cashbox"]')).toBeVisible();
  });

  test('TC-HOME-006: Navbar settings menu should navigate to settings', async () => {
    await page.locator('[data-testid="settings-menu-item"]').click({ force: true });
    await expect(page.locator('[data-testid="page-settings"]')).toBeVisible();
  });

  test('TC-HOME-007: Navbar end of day menu should navigate to end of day', async () => {
    await page.locator('[data-testid="day-management-menu-item"]').click({ force: true });
    await expect(page.locator('[data-testid="page-endoftheday"]')).toBeVisible();
  });
});