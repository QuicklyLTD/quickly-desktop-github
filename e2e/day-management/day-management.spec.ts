import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Day Management', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    await seedLocalStorage(page);
    await loginAs(page);
  });

  test('TC-DAY-001: Day management page should render', async () => {
    await page.goto('/#/endoftheday');
    await expect(page.locator('[data-testid="page-endoftheday"]')).toBeVisible();
  });

  test('TC-DAY-002: Start day button should be visible', async () => {
    await page.goto('/#/endoftheday');
    await expect(page.locator('[data-testid="start-day"]')).toBeVisible();
  });

  test('TC-DAY-003: End day button should be visible', async () => {
    await page.goto('/#/endoftheday');
    await expect(page.locator('[data-testid="end-day"]')).toBeVisible();
  });

});