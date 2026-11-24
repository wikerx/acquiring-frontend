import { expect, test } from '@playwright/test';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin)) {
  throw new Error('Wallet fixtures require a local Checkout origin');
}

for (const width of [1440, 390]) {
  for (const walletApproved of [false, true]) {
    test(`200046 ${width}: wallet authorization component and approval=${walletApproved}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'zh-CN'));
      await page.route('**/*', route => {
        const target = new URL(route.request().url());
        return target.origin === origin ? route.continue() : route.abort();
      });
      await page.route('**/checkout/config/countries', route => route.fulfill({
        json: { code: 'SUCCESS', data: [] },
      }));
      let calls = 0;
      await page.route('**/checkout/api/**', route => {
        if (!route.request().url().endsWith('/session/query')) {
          calls++;
          return route.abort();
        }
        const paymentOptions = [
          { paymentMethod: 'BANK_CARD', brands: ['VISA'], serverSubmitAllowed: true, executionStatus: 'READY' },
        ];
        if (walletApproved) {
          paymentOptions.push({
            paymentMethod: 'APPLE_PAY',
            brands: [],
            serverSubmitAllowed: false,
            executionStatus: 'REDIRECT_AVAILABLE',
          });
        }
        return route.fulfill({ json: { code: 'A0000', data: {
          checkoutSessionId: 'REQ001-SIM-WALLET-200046',
          pageState: 'PAYABLE',
          merchant: { displayName: '200046' },
          order: { orderNo: 'REQ001-SIM-WALLET', amount: '7.00', currency: 'USD', currencyExponent: 2 },
          paymentOptions,
          cardEncryption: {},
          checkout: {
            serverTime: new Date().toISOString(),
            expireTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            retryAllowed: true,
          },
        } } });
      });

      await page.goto(`${origin}/checkout/${'qa'.repeat(16)}/wallet-fixture`);
      await expect(page.getByRole('timer')).toBeVisible();
      const walletOption = page.getByRole('button', { name: 'Apple Pay', exact: true });
      const walletButton = page.getByRole('button', { name: '使用 Apple Pay 付款', exact: true });
      if (walletApproved) {
        await walletOption.click();
        await expect(walletButton).toBeEnabled();
        await expect(page.getByRole('button', { name: '继续', exact: true })).toHaveCount(0);
      } else {
        await expect(walletOption).toHaveCount(0);
        await expect(walletButton).toHaveCount(0);
      }
      expect(calls).toBe(0);
    });
  }
}
