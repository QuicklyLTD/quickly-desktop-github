import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Edge Cases', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page);
  });

  test('TC-EDGE-001: App loads store view with seeded session', async () => {
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  });

  test('TC-EDGE-002: End-of-day page is reachable', async () => {
    await page.goto('/#/endoftheday');
    await expect(page.locator('[data-testid="page-endoftheday"]')).toBeVisible();
  });

  test('TC-EDGE-003: Cashbox page is reachable', async () => {
    await page.goto('/#/cashbox');
    await expect(page.locator('[data-testid="page-cashbox"]')).toBeVisible();
  });
});