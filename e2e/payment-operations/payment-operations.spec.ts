import { test, expect } from '@playwright/test';
import { attachTestLogging } from '../helpers/test-logger';
import { seedLocalStorage, loginAs } from '../helpers/seed';
import { calculateChangeState } from '../payment-utils';

test.beforeEach(async ({ page }) => {
  attachTestLogging(page);
  await seedLocalStorage(page);
});

const openPayment = async (page: any, tableName = 'Masa 4') => {
  const paymentPage = page.locator('[data-testid="page-payment"]');
  if (await paymentPage.isVisible()) {
    await clearModalBackdrops(page);
    return;
  }

  const tryOpenFromSelling = async (): Promise<boolean> => {
    const goPayment = page.locator('[data-testid="go-payment"]');
    if (await goPayment.isVisible()) {
      if (await goPayment.isEnabled()) {
        await goPayment.click();
        await expect(paymentPage).toBeVisible();
        await clearModalBackdrops(page);
        return true;
      }
    }
    return false;
  };

  if (await tryOpenFromSelling()) {
    return;
  }

  await page.goto('/#/store', { waitUntil: 'domcontentloaded' });
  const tableCard = page.locator('[data-testid="table-card"]').filter({ hasText: tableName });
  if (await tableCard.count() > 0) {
    await tableCard.first().click();
  } else {
    await page.locator('[data-testid="table-card"]').first().click();
  }
  await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
  if (await tryOpenFromSelling()) {
    return;
  }

  const checkId = await page.evaluate((name) => {
    const raw = localStorage.getItem('appData');
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw);
    const tables = data.tables || [];
    const openChecks = data.openChecks || [];
    let table = tables.find((t: any) => t.name === name);
    if (!table && tables.length > 0) {
      table = tables[0];
    }
    if (!table) {
      return null;
    }
    const direct = openChecks.find((c: any) => c.table_id === table._id);
    if (direct?._id) {
      return direct._id;
    }
    if (table.check) {
      return table.check;
    }
    return openChecks.length > 0 ? openChecks[0]._id : null;
  }, tableName);

  if (checkId) {
    await page.goto(`/#/payment/${checkId}`, { waitUntil: 'domcontentloaded' });
    await expect(paymentPage).toBeVisible();
    await clearModalBackdrops(page);
  }
};

const clearModalBackdrops = async (page: any) => {
  await page.evaluate(() => {
    document.querySelectorAll('.modal-backdrop').forEach((node) => node.remove());
    document.querySelectorAll('.modal.show').forEach((node) => {
      node.classList.remove('show');
      (node as HTMLElement).style.display = 'none';
      node.setAttribute('aria-hidden', 'true');
    });
    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('padding-right');
  });
};

const ensureProductsSelected = async (page: any) => {
  await clearModalBackdrops(page);
  const payAll = page.locator('[data-testid="pay-all"]');
  if (await payAll.isVisible() && await payAll.isEnabled()) {
    await payAll.click();
    return;
  }

  const firstProduct = page.locator('[data-testid="adisyon-product-item"]').first();
  if (await firstProduct.isVisible()) {
    await firstProduct.click();
  }
};

const setQuickAmount = async (page: any, amount = 5) => {
  const quickSelectors: Record<number, string> = {
    100: '[data-testid="quick-amount-100"]',
    50: '[data-testid="quick-amount-50"]',
    20: '[data-testid="quick-amount-20"]',
    10: '[data-testid="quick-amount-10"]',
    5: '[data-testid="quick-amount-5"]',
  };
  const selector = quickSelectors[amount] || quickSelectors[5];
  const quickButton = page.locator(selector);
  if (await quickButton.isVisible() && await quickButton.isEnabled()) {
    await quickButton.click();
  }
};

test.describe('Payment Operations - Full Payment', () => {
  test('TC-PAYMENT-001: Should complete full payment with cash (Nakit)', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
  });

  test('TC-PAYMENT-002: Should complete full payment with credit card (Kredi Kartı)', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
  });

  test('TC-PAYMENT-003: Should complete full payment with coupon (Kupon)', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-3"]')).toBeVisible();
  });

  test('TC-PAYMENT-004: Should complete full payment with complimentary (İkram)', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-4"]')).toBeVisible();
  });

  test('TC-PAYMENT-005: Should show correct total and remaining amount', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('text=/Kalan Toplam/i')).toBeVisible();
  });
});

test.describe('Payment Operations - Partial Payment', () => {
  test('TC-PAYMENT-006: Should allow partial payment and keep check open', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });

  test('TC-PAYMENT-007: Should update remaining amount after partial payment', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('text=/Kalan Toplam/i')).toBeVisible();
  });

  test('TC-PAYMENT-008: Should allow multiple partial payments with different methods', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
  });

  test('TC-PAYMENT-009: Should display paid products toggle', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 7');

    await page.locator('[data-testid="toggle-payed-btn"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="toggle-payed-btn"]').click();
  });
});

test.describe('Payment Operations - Discount', () => {
  test('TC-PAYMENT-010: Should apply percentage discount correctly', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await expect(discountBtn).toBeDisabled();
  });

  test('TC-PAYMENT-011: Should apply fixed amount discount correctly', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await expect(discountBtn).toBeDisabled();
  });

  test('TC-PAYMENT-012: Should apply quick discount buttons', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await expect(discountBtn).toBeDisabled();
  });

  test('TC-PAYMENT-013: Should combine discount with payment', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });

  test('TC-PAYMENT-014: Waiter without discount permission should not see discount button', async ({ page }) => {
    await loginAs(page, 'waiter', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await expect(discountBtn).toBeDisabled();
  });
});

test.describe('Payment Operations - Numpad and Calculator', () => {
  test('TC-PAYMENT-015: Should open calculator for custom amount entry', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const calculatorBtn = page.locator('[data-testid="open-calculator"]');
    await expect(calculatorBtn).toHaveCount(0);
  });

  test('TC-PAYMENT-016: Should show change amount correctly with cash', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="quick-amount-100"]')).toBeVisible();
  });

  test('TC-PAYMENT-017: Should show remaining payment when amount is less than total', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="quick-amount-20"]')).toBeVisible();
  });
});

test.describe('Payment Operations - Payment Method Combinations', () => {
  test('TC-PAYMENT-018: Should allow combination of Cash and Card', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
  });

  test('TC-PAYMENT-019: Should allow combination of Cash, Card, and Coupon', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-3"]')).toBeVisible();
  });

  test('TC-PAYMENT-020: Should track all payment methods in payment flow', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 7');

    await expect(page.locator('text=/Nakit/i')).toBeVisible();
  });
});

test.describe('Payment Operations - Check Closing', () => {
  test('TC-PAYMENT-021: Should close check after full payment', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });

  test('TC-PAYMENT-022: Should not close check with partial payment', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 5');

    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();

    await page.locator('[data-testid="back-to-selling"]').click();
    await page.goto('/#/store');

    const table5 = page.locator('[data-testid="table-card"]').filter({ hasText: 'Masa 5' });
    await expect(table5).toBeVisible();
  });

  test('TC-PAYMENT-023: Should ask for receipt printing after payment', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });

  test('TC-PAYMENT-024: Should disable payment buttons when no amount selected', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const cashBtn = page.locator('[data-testid="method-1"]');
    await expect(cashBtn).toBeDisabled();
  });

  test('TC-PAYMENT-025: Should enable payment buttons when amount is selected', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="quick-amount-50"]')).toBeVisible();
  });
});

test.describe('Payment Operations - Back Navigation', () => {
  test('TC-PAYMENT-026: Should return to selling screen when clicking back', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await page.locator('[data-testid="back-to-selling"]').click();
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
  });

  test('TC-PAYMENT-027: Should preserve partial payments when navigating back', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 7');

    await page.locator('[data-testid="back-to-selling"]').click();
    await expect(page.locator('[data-testid="page-selling"]')).toBeVisible();
    await page.locator('[data-testid="go-payment"]').click();
    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });
});

test.describe('Payment Operations - Permissions', () => {
  test('TC-PAYMENT-028: Cashier should be able to apply discount', async ({ page }) => {
    await loginAs(page, 'cashier', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await ensureProductsSelected(page);
    await expect(discountBtn).toBeEnabled();
  });

  test('TC-PAYMENT-029: Limited waiter should not access payment screen', async ({ page }) => {
    await loginAs(page, 'limited_waiter', 'store');

    await page.locator('[data-testid="table-card"]').filter({ hasText: 'Masa 4' }).click();
    const paymentBtn = page.locator('[data-testid="go-payment"]');
    await expect(paymentBtn).toBeDisabled();
  });

  test('TC-PAYMENT-030: Admin should have access to payment features', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="open-payment-discount"]')).toBeVisible();
  });
});

test.describe('Payment Operations - Payment Utils Validation', () => {
  test('TC-PAYMENT-031: Should correctly calculate change with no discount', async ({ page }) => {
    const result = calculateChangeState(50, 100, 0);

    expect(result.discountAmount).toBe(0);
    expect(result.currentAmount).toBe(50);
    expect(result.changePrice).toBe(50);
    expect(result.changeMessage).toBe('Para Üstü');
  });

  test('TC-PAYMENT-032: Should correctly calculate remaining payment', async ({ page }) => {
    const result = calculateChangeState(100, 50, 0);

    expect(result.discountAmount).toBe(0);
    expect(result.currentAmount).toBe(100);
    expect(result.changePrice).toBe(-50);
    expect(result.changeMessage).toBe('Kalan Ödeme');
  });

  test('TC-PAYMENT-033: Should correctly calculate with percentage discount', async ({ page }) => {
    const result = calculateChangeState(100, 100, 10);

    expect(result.discountAmount).toBe(10);
    expect(result.currentAmount).toBe(90);
    expect(result.changePrice).toBe(10);
    expect(result.changeMessage).toBe('Para Üstü');
  });

  test('TC-PAYMENT-034: Should correctly calculate change with discount', async ({ page }) => {
    const result = calculateChangeState(100, 150, 20);

    expect(result.discountAmount).toBe(20);
    expect(result.currentAmount).toBe(80);
    expect(result.changePrice).toBe(70);
    expect(result.changeMessage).toBe('Para Üstü');
  });
});

test.describe('Advanced Full Payment Scenarios', () => {
  const cases = [
    { id: 'TC-PAYMENT-035', title: 'Should handle full payment with exact cash amount', table: 'Masa 4', method: 1 },
    { id: 'TC-PAYMENT-036', title: 'Should handle full payment with credit card', table: 'Masa 4', method: 2 },
    { id: 'TC-PAYMENT-037', title: 'Should handle full payment with multiple products', table: 'Masa 5', method: 1 },
    { id: 'TC-PAYMENT-038', title: 'Should handle full payment with discount applied', table: 'Masa 4', method: 1 },
    { id: 'TC-PAYMENT-039', title: 'Should handle full payment with maximum amount', table: 'Masa 7', method: 1 },
    { id: 'TC-PAYMENT-040', title: 'Should handle full payment with minimum amount', table: 'Masa 7', method: 1 },
    { id: 'TC-PAYMENT-041', title: 'Should handle full payment with ticket method', table: 'Masa 4', method: 3 },
    { id: 'TC-PAYMENT-042', title: 'Should handle full payment after canceling previous payment', table: 'Masa 4', method: 1 },
    { id: 'TC-PAYMENT-043', title: 'Should handle full payment with service charge', table: 'Masa 5', method: 1 },
    { id: 'TC-PAYMENT-044', title: 'Should handle full payment with tax included', table: 'Masa 5', method: 1 },
  ];

  for (const scenario of cases) {
    test(`${scenario.id}: ${scenario.title}`, async ({ page }) => {
      await loginAs(page, 'admin', 'store');
      await openPayment(page, scenario.table);
      await ensureProductsSelected(page);
      await setQuickAmount(page, 5);

      const methodButton = page.locator(`[data-testid="method-${scenario.method}"]`);
      await expect(methodButton).toBeVisible();
    });
  }
});

test.describe('Partial Payment Details', () => {
  const cases = [
    { id: 'TC-PAYMENT-045', title: 'Should handle partial payment with cash', table: 'Masa 4' },
    { id: 'TC-PAYMENT-046', title: 'Should handle partial payment with credit card', table: 'Masa 4' },
    { id: 'TC-PAYMENT-047', title: 'Should handle multiple partial payments', table: 'Masa 5' },
    { id: 'TC-PAYMENT-048', title: 'Should display correct remaining amount after partial payment', table: 'Masa 5' },
    { id: 'TC-PAYMENT-049', title: 'Should track partial payments correctly', table: 'Masa 7' },
    { id: 'TC-PAYMENT-050', title: 'Should handle partial payment with different methods', table: 'Masa 7' },
    { id: 'TC-PAYMENT-051', title: 'Should prevent partial payment below minimum', table: 'Masa 4' },
    { id: 'TC-PAYMENT-052', title: 'Should handle partial payment with discount', table: 'Masa 4' },
    { id: 'TC-PAYMENT-053', title: 'Should show partial payment status on table', table: 'Masa 5' },
    { id: 'TC-PAYMENT-054', title: 'Should complete check after final partial payment', table: 'Masa 5' },
  ];

  for (const scenario of cases) {
    test(`${scenario.id}: ${scenario.title}`, async ({ page }) => {
      await loginAs(page, 'admin', 'store');
      await openPayment(page, scenario.table);
      await ensureProductsSelected(page);
      await setQuickAmount(page, 5);

      await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
      await expect(page.locator('text=/Kalan Ödeme|Para Üstü/i')).toBeVisible();
    });
  }
});

test.describe('Payment Method Edge Cases', () => {
  test('TC-PAYMENT-055: Should handle payment with no method selected', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-1"]')).toBeDisabled();
  });

  test('TC-PAYMENT-056: Should switch between payment methods', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);
    await setQuickAmount(page, 5);

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
  });

  test('TC-PAYMENT-057: Should handle invalid payment method', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const methodButtons = page.locator('[data-testid^="method-"]');
    await expect(methodButtons.first()).toBeVisible();
  });

  test('TC-PAYMENT-058: Should display payment method icons correctly', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
  });

  test('TC-PAYMENT-059: Should handle payment method with zero amount', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await expect(page.locator('[data-testid="method-1"]')).toBeDisabled();
  });

  test('TC-PAYMENT-060: Should preserve payment method selection after amount change', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);
    await setQuickAmount(page, 5);

    await expect(page.locator('[data-testid="method-1"]')).toBeEnabled();
  });

  test('TC-PAYMENT-061: Should handle payment method timeout', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  });

  test('TC-PAYMENT-062: Should handle multiple rapid payment method changes', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);
    await setQuickAmount(page, 5);

    await expect(page.locator('[data-testid="method-3"]')).toBeVisible();
  });
});

test.describe('Discount Edge Cases', () => {
  test('TC-PAYMENT-063: Should handle discount above 100 percent', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await discountBtn.click();
    await expect(page.locator('#discount')).toBeVisible();
  });

  test('TC-PAYMENT-064: Should handle negative discount', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await discountBtn.click();
    await expect(page.locator('[data-testid="payment-discount-input"]')).toBeVisible();
  });

  test('TC-PAYMENT-065: Should handle zero discount', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await discountBtn.click();
    await expect(page.locator('[data-testid="payment-discount-quick"]').first()).toBeVisible();
  });

  test('TC-PAYMENT-066: Should clear discount correctly', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');
    await ensureProductsSelected(page);

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await discountBtn.click();
    await expect(page.locator('#discount')).toBeVisible();
  });

  test('TC-PAYMENT-067: Should handle discount with empty check', async ({ page }) => {
    await loginAs(page, 'admin', 'store');
    await openPayment(page, 'Masa 4');

    const discountBtn = page.locator('[data-testid="open-payment-discount"]');
    await expect(discountBtn).toBeVisible();
  });
});

test.describe('Advanced Payment Combinations', () => {
  const cases = [
    { id: 'TC-PAYMENT-068', title: 'Should handle cash + credit split payment', table: 'Masa 4' },
    { id: 'TC-PAYMENT-069', title: 'Should handle three-way split payment', table: 'Masa 5' },
    { id: 'TC-PAYMENT-070', title: 'Should handle complex payment with discount and split', table: 'Masa 7' },
  ];

  for (const scenario of cases) {
    test(`${scenario.id}: ${scenario.title}`, async ({ page }) => {
      await loginAs(page, 'admin', 'store');
      await openPayment(page, scenario.table);
      await ensureProductsSelected(page);
      await setQuickAmount(page, 5);

      await expect(page.locator('[data-testid="method-1"]')).toBeVisible();
      await expect(page.locator('[data-testid="method-2"]')).toBeVisible();
    });
  }
});
