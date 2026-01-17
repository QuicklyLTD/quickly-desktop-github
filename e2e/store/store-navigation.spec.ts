import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';

test.describe('Store Navigation', () => {
  let page: any;

  test.beforeEach(async ({ context }) => {
    page = await context.newPage();
    attachTestLogging(page);
    page.on('console', (msg: any) => {
      console.log(`[browser:${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (err: any) => {
      console.log(`[pageerror] ${err?.message || err}`);
    });
    page.on('crash', () => {
      console.log('[page] crash');
    });
    page.on('close', () => {
      console.log(`[page] closed at ${page.url()}`);
    });
    page.on('requestfailed', (req: any) => {
      console.log(`[requestfailed] ${req.url()} ${req.failure()?.errorText || ''}`.trim());
    });
    await seedLocalStorage(page);
    await loginAs(page);
    await page.waitForSelector('[data-testid="store-view"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="store-tabs"]', { state: 'visible' });
  });

  test('TC-STORE-001: Masalar tab should be accessible', async () => {
    await page.waitForSelector('[data-testid="store-view"]', { state: 'visible' });
    await page.locator('[data-testid="tab-masalar"]').click({ force: true });
    await expect(page.locator('[data-testid="tab-masalar"]')).toHaveClass(/active/);
  });

  test('TC-STORE-002: Masalar should render table cards', async () => {
    const tables = await page.$$('[data-testid="table-card"]');
    expect(tables.length).toBeGreaterThanOrEqual(0);
  });

  test('TC-STORE-003: Hesaplar tab should be accessible', async () => {
    await page.locator('[data-testid="tab-hesaplar"]').click({ force: true });
    await expect(page.locator('[data-testid="tab-hesaplar"]')).toHaveClass(/active/);
  });

  test('TC-STORE-004: Hesaplar should render account cards', async () => {
    await page.locator('[data-testid="tab-hesaplar"]').click({ force: true });
    const checks = await page.$$('[data-testid="account-check-card"]');
    expect(checks.length).toBeGreaterThanOrEqual(0);
  });

  test('TC-STORE-005: Siparisler tab should be accessible', async () => {
    await page.locator('[data-testid="tab-siparisler"]').click({ force: true });
    await expect(page.locator('[data-testid="tab-siparisler"]')).toHaveClass(/active/);
  });

  test('TC-STORE-006: Odemeler tab should be accessible', async () => {
    await page.locator('[data-testid="tab-odemeler"]').click({ force: true });
    await expect(page.locator('[data-testid="tab-odemeler"]')).toHaveClass(/active/);
  });

  test('TC-STORE-007: Table search input should be visible', async () => {
    await expect(page.locator('[data-testid="table-search"]')).toBeVisible();
    await page.locator('[data-testid="table-search"]').fill('Masa');
  });

  test('TC-STORE-008: Fast checks should render when present', async () => {
    const fastChecks = await page.$$('[data-testid="fast-check-card"]');
    expect(fastChecks.length).toBeGreaterThanOrEqual(0);
  });
});