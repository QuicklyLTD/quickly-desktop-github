import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Cashbox', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page);
    await page.waitForSelector('[data-testid="page-cashbox"], [data-testid="store-view"]', { state: 'visible' });
  });

  test('TC-CASHBOX-001: Cashbox page should render', async () => {
    await page.goto('/#/cashbox');
    await expect(page.locator('[data-testid="page-cashbox"]')).toBeVisible();
  });

  test('TC-CASHBOX-002: Cashbox add income/expense buttons visible', async () => {
    await page.goto('/#/cashbox');
    await expect(page.locator('[data-testid="cashbox-add-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="cashbox-add-expense"]')).toBeVisible();
  });

  test('TC-CASHBOX-003: Cashbox form should be present', async () => {
    await page.goto('/#/cashbox');
    await page.locator('[data-testid="cashbox-add-income"]').click({ force: true });
    await expect(page.locator('[data-testid="cashbox-form"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="cashbox-submit"]')).toHaveCount(1);
  });

  test('TC-CASHBOX-004: Cashbox expense modal should open', async () => {
    await page.goto('/#/cashbox');
    await page.locator('[data-testid="cashbox-add-expense"]').click({ force: true });
    await expect(page.locator('[data-testid="cashbox-form"]')).toHaveCount(1);
  });
});