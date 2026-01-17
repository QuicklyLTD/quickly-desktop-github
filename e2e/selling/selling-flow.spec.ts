import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Selling Flow', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page, 'admin', 'store');
  });

  test('TC-SELLING-001: Selling page should render', async () => {
    await page.goto('/#/store');
    await page.waitForSelector('[data-testid="table-card"]', { state: 'visible' });
    await page.locator('[data-testid="table-card"]').first().click({ force: true });
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
  });

  test('TC-SELLING-002: Product search input should be visible', async () => {
    await page.goto('/#/store');
    await page.waitForSelector('[data-testid="table-card"]', { state: 'visible' });
    await page.locator('[data-testid="table-card"]').first().click({ force: true });
    await expect(page.locator('[data-testid="product-search"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-order"]')).toBeVisible();
    await expect(page.locator('[data-testid="go-payment"]')).toBeVisible();
  });

  test('TC-SELLING-003: Action buttons should be visible', async () => {
    await page.goto('/#/store');
    await page.waitForSelector('[data-testid="table-card"]', { state: 'visible' });
    await page.locator('[data-testid="table-card"]').first().click({ force: true });
    await expect(page.locator('[data-testid="check-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="table-move"]')).toBeVisible();
    await expect(page.locator('[data-testid="print-order"]')).toBeVisible();
  });

  test('TC-SELLING-004: Add product should create check item', async () => {
    await page.goto('/#/store');
    await page.waitForSelector('[data-testid="table-card"]', { state: 'visible' });
    await page.locator('[data-testid="table-card"]').first().click({ force: true });
    await page.waitForTimeout(500);
    const categoryCount = await page.locator('[data-testid="category-card"]').count();
    if (categoryCount > 0) {
      await page.locator('[data-testid="category-card"]').first().click({ force: true });
    }
    await page.waitForSelector('[data-testid="product-card"]', { state: 'visible' });
    await page.evaluate(() => {
      const el = document.querySelector('[data-testid="product-card"]') as HTMLElement | null;
      el?.click();
    });
    await expect(page.locator('[data-testid="check-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="check-product-item"]')).toHaveCount(1);
  });
});