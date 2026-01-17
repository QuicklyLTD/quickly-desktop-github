import { test as base } from '@playwright/test';

export const resetAppState = async (page: any) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__e2e_seeded') === '1') {
      return;
    }
    localStorage.clear();
    sessionStorage.clear();
    sessionStorage.setItem('__e2e_seeded', '1');
    if (typeof indexedDB !== 'undefined' && indexedDB.databases) {
      indexedDB.databases().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name) {
            indexedDB.deleteDatabase(db.name);
          }
        });
      });
    }
  });
};

// Seed data for localStorage
export const seedLocalStorage = async (page: any) => {
  await resetAppState(page);
  const seedData = {
    users: [
      {
        id: 1,
        name: 'Admin User',
        pin: '1234',
        role: 'admin',
        username: 'admin',
        password: 'admin123',
        permissions: {
          components: { store: true, cashbox: true, endoftheday: true, reports: true, settings: true },
          cancelCheck: true,
          cancelProduct: true,
          discount: true,
          payment: true,
          end: true
        }
      },
      {
        id: 2,
        name: 'Waiter User',
        pin: '5678',
        role: 'waiter',
        username: 'waiter',
        password: 'waiter123',
        permissions: {
          components: { store: true, cashbox: false, endoftheday: false, reports: false, settings: false },
          cancelCheck: false,
          cancelProduct: true,
          discount: false,
          payment: true,
          end: false
        }
      },
      {
        id: 3,
        name: 'Cashier User',
        pin: '9012',
        role: 'cashier',
        username: 'cashier',
        password: 'cashier123',
        permissions: {
          components: { store: true, cashbox: true, endoftheday: false, reports: false, settings: false },
          cancelCheck: false,
          cancelProduct: false,
          discount: true,
          payment: true,
          end: false
        }
      },
      {
        id: 4,
        name: 'Limited Waiter',
        pin: '1111',
        role: 'limited_waiter',
        username: 'limited',
        password: 'limited123',
        permissions: {
          components: { store: true, cashbox: false, endoftheday: false, reports: false, settings: false },
          cancelCheck: false,
          cancelProduct: false,
          discount: false,
          payment: false,
          end: false
        }
      }
    ],
    products: [
      {
        id: 1,
        name: 'Çay',
        category: 'İçecekler',
        subcategory: 'Sıcak İçecekler',
        price: 15.00,
        cost: 5.00,
        stock: 100,
        barcode: 'TEA001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      },
      {
        id: 2,
        name: 'Kahve',
        category: 'İçecekler',
        subcategory: 'Sıcak İçecekler',
        price: 25.00,
        cost: 10.00,
        stock: 50,
        barcode: 'COFFEE001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      },
      {
        id: 3,
        name: 'Su',
        category: 'İçecekler',
        subcategory: 'Soğuk İçecekler',
        price: 10.00,
        cost: 3.00,
        stock: 200,
        barcode: 'WATER001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      },
      {
        id: 4,
        name: 'Pizza',
        category: 'Yemekler',
        subcategory: 'Ana Yemekler',
        price: 85.00,
        cost: 40.00,
        stock: 20,
        barcode: 'PIZZA001',
        hasRecipe: true,
        recipeId: 1,
        isActive: true,
        tax_value: 18
      },
      {
        id: 5,
        name: 'Hamburger',
        category: 'Yemekler',
        subcategory: 'Ana Yemekler',
        price: 65.00,
        cost: 30.00,
        stock: 15,
        barcode: 'BURGER001',
        hasRecipe: true,
        recipeId: 2,
        isActive: true,
        tax_value: 18
      },
      {
        id: 6,
        name: 'Kola',
        category: 'İçecekler',
        subcategory: 'Soğuk İçecekler',
        price: 20.00,
        cost: 8.00,
        stock: 100,
        barcode: 'COLA001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      },
      {
        id: 7,
        name: 'Salata',
        category: 'Yemekler',
        subcategory: 'Mezeler',
        price: 35.00,
        cost: 15.00,
        stock: 30,
        barcode: 'SALAD001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      },
      {
        id: 8,
        name: 'Baklava',
        category: 'Yemekler',
        subcategory: 'Tatlılar',
        price: 45.00,
        cost: 20.00,
        stock: 25,
        barcode: 'DESSERT001',
        hasRecipe: false,
        isActive: true,
        tax_value: 18
      }
    ],
    floors: [
      { _id: 'floor1', name: 'Kat 1', order: 1 },
      { _id: 'floor2', name: 'Kat 2', order: 2 },
      { _id: 'floor3', name: 'Bahçe', order: 3 }
    ],
    tables: [
      {
        _id: 'table1',
        name: 'Masa 1',
        floor_id: 'floor1',
        capacity: 4,
        status: 1,
        qrCode: 'TABLE001',
        isActive: true,
        check: null
      },
      {
        _id: 'table2',
        name: 'Masa 2',
        floor_id: 'floor1',
        capacity: 2,
        status: 1,
        qrCode: 'TABLE002',
        isActive: true,
        check: null
      },
      {
        _id: 'table3',
        name: 'Masa 3',
        floor_id: 'floor1',
        capacity: 6,
        status: 1,
        qrCode: 'TABLE003',
        isActive: true,
        check: null
      },
      {
        _id: 'table4',
        name: 'Masa 4',
        floor_id: 'floor2',
        capacity: 4,
        status: 2,
        qrCode: 'TABLE004',
        isActive: true,
        check: 'check1'
      },
      {
        _id: 'table5',
        name: 'Masa 5',
        floor_id: 'floor2',
        capacity: 4,
        status: 3,
        qrCode: 'TABLE005',
        isActive: true,
        check: 'check2'
      },
      {
        _id: 'table6',
        name: 'Masa 6',
        floor_id: 'floor2',
        capacity: 8,
        status: 1,
        qrCode: 'TABLE006',
        isActive: true,
        check: null
      },
      {
        _id: 'table7',
        name: 'Masa 7',
        floor_id: 'floor3',
        capacity: 6,
        status: 2,
        qrCode: 'TABLE007',
        isActive: true,
        check: 'check3'
      },
      {
        _id: 'table8',
        name: 'Masa 8',
        floor_id: 'floor3',
        capacity: 4,
        status: 1,
        qrCode: 'TABLE008',
        isActive: true,
        check: null
      }
    ],
    categories: [
      {
        id: 1,
        name: 'İçecekler',
        subcategories: [
          { id: 1, name: 'Sıcak İçecekler' },
          { id: 2, name: 'Soğuk İçecekler' },
          { id: 3, name: 'Alkollü İçecekler' }
        ]
      },
      {
        id: 2,
        name: 'Yemekler',
        subcategories: [
          { id: 4, name: 'Ana Yemekler' },
          { id: 5, name: 'Mezeler' },
          { id: 6, name: 'Tatlılar' }
        ]
      }
    ],
    settings: {
      storeName: 'Test Restaurant',
      currency: 'TL',
      taxRate: 18,
      serviceCharge: 10,
      dayStarted: true,
      dayStartAmount: 1000,
      printers: [
        {
          id: 1,
          name: 'Receipt Printer',
          type: 'thermal',
          isActive: true
        }
      ]
    },
    openChecks: [
      {
        _id: 'check1',
        table_id: 'table4',
        total_price: 50.00,
        discount: 0,
        discountPercent: 0,
        owner: 'e2e-user-admin',
        note: '',
        status: 2,
        type: 1,
        check_no: 1001,
        timestamp: Date.now() - 1800000,
        products: [
          {
            id: '1',
            cat_id: '1',
            name: 'Çay',
            price: 15.00,
            note: 'Az şekerli',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 1800000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '2',
            cat_id: '1',
            name: 'Kahve',
            price: 25.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 1800000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '3',
            cat_id: '1',
            name: 'Su',
            price: 10.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 1800000,
            tax_value: 18,
            barcode: 0
          }
        ],
        payment_flow: []
      },
      {
        _id: 'check2',
        table_id: 'table5',
        total_price: 195.00,
        discount: 0,
        discountPercent: 0,
        owner: 'e2e-user-waiter',
        note: '',
        status: 2,
        type: 1,
        check_no: 1002,
        timestamp: Date.now() - 3600000,
        products: [
          {
            id: '4',
            cat_id: '2',
            name: 'Pizza',
            price: 85.00,
            note: '',
            status: 2,
            owner: 'e2e-user-waiter',
            timestamp: Date.now() - 3600000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '5',
            cat_id: '2',
            name: 'Hamburger',
            price: 65.00,
            note: 'Ekstra sos',
            status: 2,
            owner: 'e2e-user-waiter',
            timestamp: Date.now() - 3600000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '7',
            cat_id: '2',
            name: 'Salata',
            price: 35.00,
            note: '',
            status: 2,
            owner: 'e2e-user-waiter',
            timestamp: Date.now() - 3600000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '3',
            cat_id: '1',
            name: 'Su',
            price: 10.00,
            note: '',
            status: 2,
            owner: 'e2e-user-waiter',
            timestamp: Date.now() - 3600000,
            tax_value: 18,
            barcode: 0
          }
        ],
        payment_flow: []
      },
      {
        _id: 'check3',
        table_id: 'table7',
        total_price: 150.00,
        discount: 20.00,
        discountPercent: 0,
        owner: 'e2e-user-admin',
        note: 'VIP Müşteri',
        status: 2,
        type: 1,
        check_no: 1003,
        timestamp: Date.now() - 7200000,
        products: [
          {
            id: '4',
            cat_id: '2',
            name: 'Pizza',
            price: 85.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 7200000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '5',
            cat_id: '2',
            name: 'Hamburger',
            price: 65.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 7200000,
            tax_value: 18,
            barcode: 0
          }
        ],
        payment_flow: [
          {
            owner: 'e2e-user-admin',
            method: 'Nakit',
            amount: 50.00,
            discount: 0,
            timestamp: Date.now() - 7000000,
            payed_products: [
              {
                id: '4',
                cat_id: '2',
                name: 'Pizza',
                price: 85.00,
                note: '',
                status: 2,
                owner: 'e2e-user-admin',
                timestamp: Date.now() - 7200000,
                tax_value: 18,
                barcode: 0
              }
            ]
          }
        ]
      }
    ],
    paymentMethods: [
      { _id: '1', name: 'Nakit', type: 1, isActive: true, order: 1 },
      { _id: '2', name: 'Kredi Kartı', type: 2, isActive: true, order: 2 },
      { _id: '3', name: 'Kupon', type: 3, isActive: true, order: 3 },
      { _id: '4', name: 'İkram', type: 4, isActive: true, order: 4 },
      { _id: '5', name: 'Online', type: 5, isActive: true, order: 5 }
    ],
    fastChecks: [
      {
        _id: 'fastcheck1',
        table_id: 'FAST-1',
        total_price: 75.00,
        discount: 0,
        discountPercent: 0,
        owner: 'e2e-user-admin',
        note: 'Hızlı Satış',
        status: 2,
        type: 2,
        check_no: 2001,
        timestamp: Date.now() - 900000,
        products: [
          {
            id: '1',
            cat_id: '1',
            name: 'Çay',
            price: 15.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 900000,
            tax_value: 18,
            barcode: 0
          },
          {
            id: '4',
            cat_id: '2',
            name: 'Pizza',
            price: 85.00,
            note: '',
            status: 2,
            owner: 'e2e-user-admin',
            timestamp: Date.now() - 900000,
            tax_value: 18,
            barcode: 0
          }
        ],
        payment_flow: []
      }
    ]
  };

  // Set localStorage with seed data
  await page.addInitScript((data) => {
    localStorage.setItem('E2E_TEST', '1');
    localStorage.setItem('E2E_TARGET', 'store');
    localStorage.setItem('appData', JSON.stringify(data));
  }, seedData);
};

type Role = 'admin' | 'waiter' | 'cashier' | 'limited_waiter';

const ROLE_STATE: Record<Role, { name: string; userType: string; userAuth: string; userId: string; permissions: any }> = {
  admin: {
    name: 'Admin User',
    userType: 'Admin',
    userAuth: 'e2e-group-admin',
    userId: 'e2e-user-admin',
    permissions: {
      components: { store: true, cashbox: true, endoftheday: true, reports: true, settings: true },
      cancelCheck: true,
      cancelProduct: true,
      discount: true,
      payment: true,
      end: true
    }
  },
  waiter: {
    name: 'Waiter User',
    userType: 'Garson',
    userAuth: 'e2e-group-waiter',
    userId: 'e2e-user-waiter',
    permissions: {
      components: { store: true, cashbox: false, endoftheday: false, reports: false, settings: false },
      cancelCheck: false,
      cancelProduct: true,
      discount: false,
      payment: true,
      end: false
    }
  },
  cashier: {
    name: 'Cashier User',
    userType: 'Kasiyer',
    userAuth: 'e2e-group-cashier',
    userId: 'e2e-user-cashier',
    permissions: {
      components: { store: true, cashbox: true, endoftheday: false, reports: false, settings: false },
      cancelCheck: false,
      cancelProduct: false,
      discount: true,
      payment: true,
      end: false
    }
  },
  limited_waiter: {
    name: 'Limited Waiter',
    userType: 'Garson',
    userAuth: 'e2e-group-limited-waiter',
    userId: 'e2e-user-limited-waiter',
    permissions: {
      components: { store: true, cashbox: false, endoftheday: false, reports: false, settings: false },
      cancelCheck: false,
      cancelProduct: false,
      discount: false,
      payment: false,
      end: false
    }
  }
};

export const loginAs = async (page: any, role: Role = 'admin', target: 'home' | 'store' = 'store') => {
  const state = ROLE_STATE[role];
  const dayInfo = { day: new Date().getDay(), started: true, time: Date.now() };
  await page.addInitScript((payload) => {
    localStorage.setItem('AppType', 'Primary');
    localStorage.setItem('DayStatus', JSON.stringify(payload.dayInfo));
    localStorage.setItem('userName', payload.name);
    localStorage.setItem('userType', payload.userType);
    localStorage.setItem('userAuth', payload.userAuth);
    localStorage.setItem('userID', payload.userId);
    localStorage.setItem('userPermissions', JSON.stringify(payload.permissions));
    localStorage.setItem('E2E_TARGET', payload.target);
  }, { ...state, dayInfo, target });
  await page.goto(target === 'home' ? '/#/home' : '/#/store', { waitUntil: 'domcontentloaded' });
  const targetSelector = target === 'home' ? '[data-testid="page-home"]' : '[data-testid="page-store"]';
  await page.locator(targetSelector).waitFor({ state: 'visible' });
};

// Test fixture with seed
export const test = base.extend({
  page: async ({ page }, use) => {
    await use(page);
    // Cleanup is handled by Playwright
  }
});
