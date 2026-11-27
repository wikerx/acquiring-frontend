import { expect, test } from '@playwright/test';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
const checkoutPath = `/checkout/${'qa'.repeat(16)}/wallet-limit`;
const approvalUrl = 'http://127.0.0.1:58090/simulate/hosted-payins/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

for (const { paymentLink, exceeded, converted } of [
  { paymentLink: false, exceeded: false, converted: false },
  { paymentLink: false, exceeded: true, converted: false },
  { paymentLink: true, exceeded: false, converted: false },
  { paymentLink: true, exceeded: true, converted: true },
]) {
  test(`${paymentLink ? 'PayByLink' : 'API'} wallet amount ${exceeded ? 'above' : 'at'} the channel limit`, async ({ page }) => {
    await page.setViewportSize({ width: paymentLink ? 390 : 1440, height: 900 });
    await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
    await page.route(approvalUrl, route => route.fulfill({ body: 'Wallet simulator ready' }));
    await page.route('**/checkout/config/countries', route => route.fulfill({ json: { code: 'SUCCESS', data: [
      { countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States' },
      { countryCode: 'DE', countryCodeAlpha3: 'DEU', countryName: 'Germany' },
    ] } }));

    const amount = converted ? '8000.01' : exceeded ? '10000.01' : '10000.00';
    const currency = converted ? 'EUR' : 'USD';
    const serverTime = new Date().toISOString();
    const expireTime = new Date(Date.now() + 3_600_000).toISOString();
    const actions: string[] = [];
    const requests: string[] = [];
    let limitRejected = false;
    await page.route('**/checkout/api/v1/**', route => {
      const path = new URL(route.request().url()).pathname;
      const reply = (data: unknown) => route.fulfill({ json: { code: 'A0000', data } });
      if (path.endsWith('/payment-links/resolve')) {
        return reply({ merchantDisplayName: 'Wallet QA', amount, currency, status: 'ACTIVE',
          payable: true, serverTime, expireTime, locale: 'en-US' });
      }
      if (path.endsWith('/payment-links/start')) return reply({ checkoutUrl: checkoutPath });
      if (path.endsWith('/wallet/authorization')) {
        const submit = route.request().postDataJSON();
        actions.push(submit.action);
        if (submit.action === 'PREPARE') requests.push(submit.attemptRequestId);
        if (exceeded && !limitRejected) {
          limitRejected = true;
          return reply({ state: 'FAILED', reasonCode: 'T4001', transactionId: '261127000000000000012' });
        }
        return reply({ state: 'READY', redirectUrl: approvalUrl });
      }
      expect(path).toMatch(/\/session\/query$/);
      return reply({
        checkoutSessionId: 'wallet-limit-session', pageState: limitRejected ? 'FAILED_RETRYABLE' : 'PAYABLE', paymentLink,
        merchant: { displayName: 'Wallet QA' },
        order: { amount, currency, currencyExponent: 2 },
        billingInfo: { country: 'USA', email: 'payer@example.test', firstName: 'QA', lastName: 'Payer' },
        checkout: { serverTime, expireTime, retryAllowed: true },
        paymentOptions: ['APPLE_PAY', 'GOOGLE_PAY'].map(paymentMethod => ({
          paymentMethod, executionStatus: 'REDIRECT_AVAILABLE',

        })),
      });
    });

    if (paymentLink) {
      await page.goto(`${origin}/l/L${'1'.repeat(22)}.${'b'.repeat(64)}`);
      await page.getByRole('button', { name: 'Continue to secure checkout' }).click();
    } else {
      await page.goto(origin + checkoutPath);
    }

    const methods = page.locator('.checkout-payment-section');
    for (const name of ['Apple Pay', 'Google Pay']) {
      await expect(methods.getByRole('button', { name, exact: true })).toBeEnabled();
    }
    expect(actions).toEqual([]);
    const wallet = paymentLink ? 'Google Pay' : 'Apple Pay';
    await methods.getByRole('button', { name: wallet, exact: true }).click();
    expect(actions).toEqual([]);
    await methods.getByRole('button', { name: `Pay with ${wallet}`, exact: true }).click();
    if (exceeded) {
      const dialog = page.getByRole('dialog');
      await expect(dialog).toContainText('Please choose another payment method or contact the merchant.');
      await expect(dialog).not.toContainText('10,000');
      expect(actions).toEqual(['PREPARE']);
      await dialog.getByRole('button', { name: 'Back to checkout' }).click();

      const nextWallet = wallet === 'Apple Pay' ? 'Google Pay' : 'Apple Pay';
      await methods.getByRole('button', { name: nextWallet, exact: true }).click();
      await methods.getByRole('button', { name: `Pay with ${nextWallet}`, exact: true }).click();
      await expect.poll(() => requests.length).toBe(2);
      expect(requests[0]).toMatch(/^ATT/);
      expect(requests[1]).toMatch(/^ATT/);
      expect(requests[1]).not.toBe(requests[0]);
    }
    await expect(page.getByText('Wallet simulator ready')).toBeVisible();
    expect(actions).toEqual(exceeded ? ['PREPARE', 'PREPARE', 'OPEN'] : ['PREPARE', 'OPEN']);
  });
}
