// Common test data for Playwright E2E tests

// User credentials
export const users = {
  admin: {
    pin: '1234',
    name: 'Admin User',
    role: 'admin'
  },
  waiter: {
    pin: '5678',
    name: 'Waiter User',
    role: 'waiter'
  },
  cashier: {
    pin: '9012',
    name: 'Cashier User',
    role: 'cashier'
  }
};

// Product data
export const products = {
  tea: {
    id: 1,
    name: 'Çay',
    price: 15.00,
    category: 'İçecekler',
    subcategory: 'Sıcak İçecekler'
  },
  coffee: {
    id: 2,
    name: 'Kahve',
    price: 25.00,
    category: 'İçecekler',
    subcategory: 'Sıcak İçecekler'
  },
  water: {
    id: 3,
    name: 'Su',
    price: 10.00,
    category: 'İçecekler',
    subcategory: 'Soğuk İçecekler'
  },
  pizza: {
    id: 4,
    name: 'Pizza',
    price: 85.00,
    category: 'Yemekler',
    subcategory: 'Ana Yemekler'
  }
};

// Table data
export const tables = {
  table1: {
    id: 1,
    name: 'Masa 1',
    floor: 1,
    capacity: 4,
    status: 'available'
  },
  table2: {
    id: 2,
    name: 'Masa 2',
    floor: 1,
    capacity: 2,
    status: 'available'
  },
  table3: {
    id: 3,
    name: 'Masa 3',
    floor: 2,
    capacity: 6,
    status: 'available'
  },
  table4: {
    id: 4,
    name: 'Masa 4',
    floor: 2,
    capacity: 4,
    status: 'occupied'
  }
};

// Payment methods
export const paymentMethods = {
  cash: {
    id: 1,
    name: 'Nakit',
    testId: 'method-cash'
  },
  creditCard: {
    id: 2,
    name: 'Kredi Kartı',
    testId: 'method-credit-card'
  },
  coupon: {
    id: 3,
    name: 'Kupon',
    testId: 'method-coupon'
  },
  complimentary: {
    id: 4,
    name: 'İkram',
    testId: 'method-complimentary'
  }
};

// Discount types
export const discountTypes = {
  percentage: {
    name: 'Yüzde İndirim',
    testId: 'payment-discount-percentage'
  },
  fixed: {
    name: 'Tutar İndirim',
    testId: 'payment-discount-fixed'
  }
};

// Navigation data
export const navigation = {
  homeMenu: {
    store: 'home-menu-store',
    endOfTheDay: 'home-menu-endoftheday'
  },
  storeTabs: {
    tables: 'tab-masalar',
    checks: 'tab-hesaplar',
    orders: 'tab-siparisler',
    payments: 'tab-odemeler'
  },
  sellingScreen: {
    payment: 'go-payment',
    sendOrder: 'send-order',
    noteProduct: 'note-product',
    cancelProduct: 'cancel-product',
    moveProduct: 'move-product'
  },
  paymentScreen: {
    backToSelling: 'back-to-selling',
    payAll: 'pay-all',
    openCalculator: 'open-calculator',
    openPaymentDiscount: 'open-payment-discount',
    applyDiscount: 'payment-apply-discount'
  }
};

// Error messages
export const errorMessages = {
  payment: {
    noMethod: 'Ödeme yöntemi seçiniz',
    insufficientFunds: 'Yetersiz bakiye',
    paymentFailed: 'Ödeme işlemi başarısız',
    invalidAmount: 'Geçersiz tutar'
  },
  table: {
    tableOccupied: 'Masa dolu',
    tableNotFound: 'Masa bulunamadı',
    invalidTable: 'Geçersiz masa seçimi'
  },
  product: {
    productNotFound: 'Ürün bulunamadı',
    outOfStock: 'Stokta yok',
    invalidQuantity: 'Geçersiz miktar'
  },
  general: {
    networkError: 'Ağ hatası',
    serverError: 'Sunucu hatası',
    unknownError: 'Bilinmeyen hata'
  }
};

// Success messages
export const successMessages = {
  payment: {
    success: 'Ödeme başarılı',
    partialPayment: 'Kısmi ödeme alındı',
    paymentComplete: 'Ödeme tamamlandı'
  },
  order: {
    sent: 'Sipariş gönderildi',
    printed: 'Fiş yazdırıldı'
  },
  general: {
    saved: 'Kaydedildi',
    deleted: 'Silindi',
    updated: 'Güncellendi'
  }
};

// Wait times
export const waitTimes = {
  short: 1000,
  medium: 3000,
  long: 5000,
  veryLong: 10000
};

// Test scenarios
export const scenarios = {
  selling: {
    addSingleProduct: 'Ürün ekleme ve toplam tutar kontrolü',
    addMultipleProducts: 'Çoklu ürün ekleme ve hesaplama',
    addProductWithNote: 'Not ekleme ile ürün ekleme',
    cancelProduct: 'Ürün iptal',
    increaseQuantity: 'Miktar artırma',
    sendOrder: 'Sipariş gönderme',
    changeTable: 'Masa değiştirme'
  },
  payment: {
    fullPayment: 'Tam ödeme',
    partialPayment: 'Kısmi ödeme',
    applyDiscount: 'İndirim uygulama',
    multiplePaymentMethods: 'Çoklu ödeme yöntemi',
    paymentCancellation: 'Ödeme iptali'
  },
  general: {
    login: 'Giriş yapma',
    logout: 'Çıkış yapma',
    navigation: 'Sayfa navigasyonu',
    errorHandling: 'Hata yönetimi'
  }
};

// Helper functions
export const testDataHelpers = {
  // Create test check data
  createTestCheck: (tableId: number, tableName: string, items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + (item.totalPrice || item.unitPrice * item.quantity), 0);
    const tax = subtotal * 0.18; // %18 tax
    const total = subtotal + tax;
    
    return {
      id: Date.now(),
      tableId,
      tableName,
      status: 'OPEN',
      items,
      subtotal,
      tax,
      total,
      payments: [],
      createdAt: new Date().toISOString()
    };
  },

  // Create test order data
  createTestOrder: (checkId: number, items: any[]) => {
    return {
      id: Date.now(),
      checkId,
      items,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
  },

  // Generate random number
  generateRandomNumber: (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Generate random decimal
  generateRandomDecimal: (min: number, max: number, decimals: number = 2) => {
    const str = (Math.random() * (max - min) + min).toFixed(decimals);
    return parseFloat(str);
  },

  // Format currency
  formatCurrency: (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  },

  // Wait for element with timeout
  waitForElement: async (page: any, selector: string, timeout: number = 5000) => {
    await page.waitForSelector(selector, { timeout });
  },

  // Verify element exists
  verifyElementExists: async (page: any, selector: string) => {
    const element = await page.$(selector);
    return element !== null;
  }
};
