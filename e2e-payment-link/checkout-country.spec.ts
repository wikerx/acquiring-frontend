import { expect, test } from '@playwright/test';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
const checkoutPath = `/checkout/${'qa'.repeat(16)}/country-preview`;
const countries = [
  { countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States' },
  { countryCode: 'DE', countryCodeAlpha3: 'DEU', countryName: 'Germany' },
  { countryCode: 'CA', countryCodeAlpha3: 'CAN', countryName: 'Canada' },
];

for (const { link, prefill, width } of [
  { link: false, prefill: 'US', width: 1440 },
  { link: false, prefill: undefined, width: 390 },
  { link: true, prefill: undefined, width: 390 },
]) {
  test(`filters countries and restores the session scope for ${link ? 'PayByLink' : 'API'} with ${prefill || 'no prefill'}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
    await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: { code: 'SUCCESS', data: countries } }));
    let sessionQueries = 0;
    let starts = 0;
    const serverTime = new Date().toISOString();
    const expireTime = new Date(Date.now() + 3_600_000).toISOString();
    await page.route('**/checkout/api/v1/**', async (route) => {
      const { pathname } = new URL(route.request().url());
      const reply = (data: unknown) => route.fulfill({ json: { code: 'A0000', data } });
      if (pathname.endsWith('/payment-links/resolve')) {
        return reply({ merchantDisplayName: 'Country QA', amount: '7.00', currency: 'USD',
          status: 'ACTIVE', payable: true, locale: 'en-US', serverTime, expireTime });
      }
      if (pathname.endsWith('/payment-links/start')) {
        starts++;
        return reply({ checkoutUrl: checkoutPath });
      }
      if (pathname.endsWith('/card-bin/resolve')) {
        return reply({ cardBrand: 'VISA', recognized: true, supported: true });
      }
      expect(pathname).toMatch(/\/session\/query$/);
      sessionQueries++;
      return reply({
        checkoutSessionId: 'qa-country-session',
        pageState: 'PAYABLE',
        paymentLink: link,
        merchant: { displayName: 'Country QA' },
        order: { amount: '7.00', currency: 'USD', currencyExponent: 2 },
        billingInfo: prefill ? { country: prefill } : undefined,
        checkout: { serverTime, expireTime, retryAllowed: true },
        cardEncryption: {},
        paymentOptions: [
          { paymentMethod: 'BANK_CARD', brands: ['VISA', 'MASTERCARD'], serverSubmitAllowed: true, executionStatus: 'READY' },
          { paymentMethod: 'APPLE_PAY', executionStatus: 'REDIRECT_AVAILABLE' },
          { paymentMethod: 'GOOGLE_PAY', executionStatus: 'REDIRECT_AVAILABLE' },
        ],
        paymentCountryScopes: {
          'CARD_BRAND:VISA': { ALL: false, USA: true },
          'CARD_BRAND:MASTERCARD': { ALL: false, DEU: true },
          'METHOD:APPLE_PAY': { ALL: false, USA: true },
          'METHOD:GOOGLE_PAY': { ALL: false, DEU: true },
          'METHOD:PAYPAL': { ALL: true },
        },
      });
    });
    if (link) {
      await page.goto(`${origin}/l/L${'1'.repeat(22)}.${'b'.repeat(64)}`);
      await page.getByRole('button', { name: 'Continue to secure checkout' }).click();
    } else {
      await page.goto(origin + checkoutPath);
    }

    const country = page.getByRole('button', { name: 'Country/Region', exact: true });
    const methods = page.locator('.checkout-payment-section');
    const brands = methods.getByRole('group', { name: 'Accepted card brands' });
    const card = methods.getByRole('button', { name: 'Card', exact: true });
    const applePay = methods.getByRole('button', { name: 'Apple Pay', exact: true });
    const googlePay = methods.getByRole('button', { name: 'Google Pay', exact: true });
    const chooseCountry = async (label: string) => {
      await country.click();
      await page.locator('.checkout-country-select__option').filter({ hasText: label }).click();
      await expect(country).toContainText(label);
    };

    await expect(brands.getByRole('img', { name: 'Visa', exact: true })).toBeVisible();
    await expect(applePay).toBeVisible();
    if (prefill) {
      await expect(country).toContainText('United States');
      await expect(googlePay).toHaveCount(0);
      await expect(brands.getByRole('img', { name: 'Mastercard', exact: true })).toHaveCount(0);
    } else {
      await expect(country).toContainText('Select country/region');
      await expect(googlePay).toBeVisible();
      await expect(brands.getByRole('img', { name: 'Mastercard', exact: true })).toBeVisible();
      await chooseCountry('United States');
    }
    const cardNumber = page.locator('#checkout-card-number');
    await cardNumber.fill('411111');
    await cardNumber.blur();
    await chooseCountry('Germany');
    await expect(applePay).toHaveCount(0);
    await expect(googlePay).toBeVisible();
    await expect(brands.getByRole('img', { name: 'Visa', exact: true })).toHaveCount(0);
    await expect(brands.getByRole('img', { name: 'Mastercard', exact: true })).toBeVisible();
    await expect(cardNumber).toHaveAttribute('aria-invalid', 'true');
    await googlePay.click();
    await chooseCountry('Canada');
    await expect(methods.getByText('No available payment method for this order.')).toBeVisible();
    await chooseCountry('United States');
    await expect(applePay).toBeVisible();
    await expect(googlePay).toHaveCount(0);
    await card.click();
    await expect(brands.getByRole('img', { name: 'Visa', exact: true })).toBeVisible();
    await expect(cardNumber).toHaveAttribute('aria-invalid', 'false');
    await expect(methods.getByRole('button', { name: 'PayPal', exact: true })).toHaveCount(0);
    expect(sessionQueries).toBe(1);
    expect(starts).toBe(link ? 1 : 0);
  });
}
