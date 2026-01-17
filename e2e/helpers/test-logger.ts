import { Page } from '@playwright/test';

export const attachTestLogging = (page: Page) => {
  const allowExternal = !!process.env.E2E_ALLOW_NETWORK;
  if (!allowExternal) {
    page.route('**/*', (route) => {
      const url = route.request().url();
      const isLocal =
        url.startsWith('http://localhost:4200') ||
        url.startsWith('http://127.0.0.1:4200') ||
        url.startsWith('http://[::1]:4200') ||
        url.startsWith('ws://localhost:4200') ||
        url.startsWith('ws://127.0.0.1:4200') ||
        url.startsWith('ws://[::1]:4200') ||
        url.startsWith('data:') ||
        url.startsWith('blob:');
      if (isLocal) {
        route.continue();
      } else {
        route.abort();
      }
    });
  }

  page.on('console', (msg) => {
    const type = msg.type();
    if (type == 'error' || type == 'warning') {
      console.log(`[e2e][console:${type}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    console.log(`[e2e][pageerror] ${error.message}`);
  });

  page.on('requestfailed', (request) => {
    const reason = request.failure()?.errorText || '';
    console.log(`[e2e][requestfailed] ${request.url()} ${reason}`.trim());
  });
};
