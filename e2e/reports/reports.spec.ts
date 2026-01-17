import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Reports', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
  });

  test('TC-REPORTS-001: Reports page should render', async () => {
    await page.goto('/#/reports');
    await expect(page.locator('[data-testid="page-reports"]')).toBeVisible();
  });

  test('TC-REPORTS-002: Reports navigation cards should be visible', async () => {
    await page.goto('/#/reports');
    await expect(page.locator('[data-testid="reports-nav-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-nav-checks"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-nav-products"]')).toBeVisible();
    await page.locator('[data-testid="reports-nav-products"]').click({ force: true });
  });

  test('TC-REPORTS-003: Reports nav cashbox and users should be visible', async () => {
    await page.goto('/#/reports');
    await expect(page.locator('[data-testid="reports-nav-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-nav-cashbox"]')).toBeVisible();
  });
});