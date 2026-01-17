import type { Page } from '@playwright/test';

export interface SeedOptions {
  appType?: 'Primary' | 'Secondary';
  userName?: string;
  userId?: string;
  userType?: string;
  userAuth?: string;
  dayStarted?: boolean;
  dayTime?: number;
}

export async function seedLocalStorage(page: Page, options: SeedOptions = {}): Promise<void> {
  const now = options.dayTime ?? Date.now();
  const dayInfo = { day: new Date(now).getDay(), started: options.dayStarted ?? true, time: now };
  await page.addInitScript((payload) => {
    const { appType, userName, userId, userType, userAuth, dayInfo: payloadDayInfo } = payload;
    if (appType) {
      localStorage.setItem('AppType', appType);
    }
    if (userName) {
      localStorage.setItem('userName', userName);
    }
    if (userId) {
      localStorage.setItem('userID', userId);
    }
    if (userType) {
      localStorage.setItem('userType', userType);
    }
    if (userAuth) {
      localStorage.setItem('userAuth', userAuth);
    }
    localStorage.setItem('DayStatus', JSON.stringify(payloadDayInfo));
  }, {
    appType: options.appType ?? 'Primary',
    userName: options.userName ?? 'E2E User',
    userId: options.userId ?? 'e2e-user-1',
    userType: options.userType ?? 'Admin',
    userAuth: options.userAuth ?? 'e2e-group-1',
    dayInfo
  });
}
