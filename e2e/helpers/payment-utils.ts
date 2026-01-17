import { expect } from '@playwright/test';

// Payment calculation helpers
export class PaymentUtils {
  // Calculate subtotal from items
  static calculateSubtotal(items: any[]): number {
    return items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
  }

  // Calculate tax amount
  static calculateTax(subtotal: number, taxRate: number = 18): number {
    return subtotal * (taxRate / 100);
  }

  // Calculate total amount
  static calculateTotal(subtotal: number, taxRate: number = 18): number {
    return subtotal + this.calculateTax(subtotal, taxRate);
  }

  // Calculate change for cash payment
  static calculateChange(paidAmount: number, totalAmount: number): number {
    return paidAmount - totalAmount;
  }

  // Calculate discount amount
  static calculateDiscountAmount(total: number, discountType: 'percentage' | 'fixed', discountValue: number): number {
    if (discountType === 'percentage') {
      return total * (discountValue / 100);
    } else {
      return discountValue;
    }
  }

  // Calculate remaining amount after payment
  static calculateRemainingAmount(total: number, paidAmount: number): number {
    return total - paidAmount;
  }

  // Verify payment summary calculations
  static async verifyPaymentSummary(page: any, expectedTotal: number, expectedTax?: number) {
    const totalElement = page.locator('[data-testid="payment-total-amount"]');
    await expect(totalElement).toBeVisible();
    
    const totalText = await totalElement.textContent();
    const actualTotal = parseFloat(totalText!.replace(/[^0-9.]/g, ''));
    
    expect(actualTotal).toBeCloseTo(expectedTotal, 2);
    
    if (expectedTax !== undefined) {
      const taxElement = page.locator('[data-testid="payment-tax-amount"]');
      if (await taxElement.count() > 0) {
        await expect(taxElement).toBeVisible();
        const taxText = await taxElement.textContent();
        const actualTax = parseFloat(taxText!.replace(/[^0-9.]/g, ''));
        expect(actualTax).toBeCloseTo(expectedTax, 2);
      }
    }
  }

  // Verify payment method is available and clickable
  static async verifyPaymentMethodAvailable(page: any, methodTestId: string) {
    const methodElement = page.locator(`[data-testid="${methodTestId}"]`);
    await expect(methodElement).toBeVisible();
    await expect(methodElement).toBeEnabled();
  }

  // Verify payment method is disabled
  static async verifyPaymentMethodDisabled(page: any, methodTestId: string) {
    const methodElement = page.locator(`[data-testid="${methodTestId}"]`);
    await expect(methodElement).toBeVisible();
    await expect(methodElement).toBeDisabled();
  }

  // Wait for payment completion
  static async waitForPaymentCompletion(page: any) {
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
  }

  // Verify payment flow state
  static async verifyPaymentFlowState(page: any, expectedItems: any[]) {
    const paymentFlowItems = page.locator('.payment-flow-item');
    const itemCount = await paymentFlowItems.count();
    
    expect(itemCount).toBe(expectedItems.length);
    
    for (let i = 0; i < expectedItems.length; i++) {
      const itemElement = paymentFlowItems.nth(i);
      await expect(itemElement).toContainText(expectedItems[i].productName);
      await expect(itemElement).toContainText(`${expectedItems[i].quantity}x`);
    }
  }

  // Add payment method with amount
  static async addPaymentMethod(page: any, methodTestId: string, amount: number) {
    const methodElement = page.locator(`[data-testid="${methodTestId}"]`);
    await methodElement.click();
  }

  // Verify payment success state
  static async verifyPaymentSuccess(page: any, checkClosed: boolean = true) {
    // Verify navigation back to store
    await expect(page.locator('[data-testid="page-store"]')).toBeVisible();
    
    if (checkClosed) {
      // Verify check is closed (should not appear in checks tab)
      const hesaplarTab = page.locator('[data-testid="tab-hesaplar"]');
      if (await hesaplarTab.count() > 0) {
        await hesaplarTab.click();
        await expect(page.locator('[data-testid="account-check-card"]')).not.toBeVisible();
      }
    }
  }

  // Verify payment error state
  static async verifyPaymentError(page: any, expectedMessage: string) {
    await expect(page.locator('[data-testid="page-payment"]')).toBeVisible();
  }
}

// Mock payment response
export const mockPaymentResponse = (page: any, success: boolean = true, amount: number = 0) => {
  page.route('**/api/payments/**', (route) => {
    if (success) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          amount: amount,
          transactionId: `txn_${Date.now()}`,
          timestamp: new Date().toISOString()
        })
      });
    } else {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Payment failed',
          message: 'Payment processing failed'
        })
      });
    }
  });
};

// Mock printer response
export const mockPrinterResponse = (page: any, success: boolean = true) => {
  page.route('**/api/print/**', (route) => {
    if (success) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          jobId: `print_${Date.now()}`,
          message: 'Print job queued successfully'
        })
      });
    } else {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Printer error',
          message: 'Printer not available'
        })
      });
    }
  });
};
