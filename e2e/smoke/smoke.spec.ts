import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
  await seedLocalStorage(page);
});

test.describe('Smoke', () => {
  test('SMOKE-001: App loads and store view is reachable', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });

  test('SMOKE-002: Selling screen opens from a table', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await page.locator('[data-testid="table-card"]').filter({ hasText: 'Masa 5' }).first().click();
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
  });

  test('SMOKE-003: Payment screen opens from selling screen', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await page.locator('[data-testid="table-card"]').filter({ hasText: 'Masa 5' }).first().click();
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
    await page.locator('[data-testid="go-payment"]').click();
    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });
});
