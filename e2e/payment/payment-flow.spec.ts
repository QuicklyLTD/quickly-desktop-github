import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Payment Flow', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
  });

  test('TC-PAYMENT-001: Payment screen is reachable from selling flow', async () => {
    await page.locator('[data-testid="table-card"]').filter({ hasText: 'Masa 5' }).first().click();
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
    await page.locator('[data-testid="go-payment"]').click();
    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });
});
