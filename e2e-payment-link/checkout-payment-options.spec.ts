import { expect, test, type Page } from '@playwright/test';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
const cardBrands = ['VISA', 'MASTERCARD', 'AMEX', 'JCB', 'MAESTRO', 'DISCOVER', 'DINERS_CLUB', 'UNIONPAY'];
const walletMethods = ['APPLE_PAY', 'BTC_ON_CHAIN', 'CASH_APP_PAY', 'GOOGLE_PAY', 'PAYPAL', 'PYUSD'];

async function openCheckout(page: Page, availableWallets = ['APPLE_PAY', 'GOOGLE_PAY'], cardAvailable = true, cardNeedsRetry = false, includeUnavailable = true) {
  const unexpectedRequests: string[] = [];
  const errors: string[] = [];
  await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.origin === origin ? route.continue() : route.abort();
  });
  await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: {
    code: 'SUCCESS',
    data: [{ countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States',
      countryNameLocal: '美国', flagIconUrl: '', defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'zh-CN'], sortNo: 20 }],
  } }));
  let sessionQueries = 0;
  await page.route('**/checkout/api/**', (route) => {
    if (!route.request().url().endsWith('/session/query')) {
      unexpectedRequests.push(new URL(route.request().url()).pathname);
      return route.abort();
    }
    sessionQueries += 1;
    return route.fulfill({ json: { code: 'A0000', data: {
      checkoutSessionId: 'synthetic-payment-options',
      pageState: 'PAYABLE',
      merchant: {
        displayName: 'Demo Store', supportedPaymentMethods: ['BANK_CARD', ...walletMethods], supportedCardBrands: cardBrands,
      },
      order: { orderNo: 'QA-OPTIONS', subject: 'Checkout preview', amount: '28.80', currency: 'CAD', currencyExponent: 2 },
      paymentOptions: [
        ...walletMethods.filter((method) => includeUnavailable || availableWallets.includes(method)).map((paymentMethod) => ({
          paymentMethod, brands: [], serverSubmitAllowed: false,
          executionStatus: availableWallets.includes(paymentMethod) ? 'REDIRECT_AVAILABLE' : 'COMPONENT_UNAVAILABLE',
        })),
        ...(cardAvailable ? [{ paymentMethod: 'BANK_CARD', brands: cardBrands, serverSubmitAllowed: true, executionStatus: 'READY' }] : []),
      ],
      cardEncryption: cardNeedsRetry && sessionQueries === 1 ? undefined : {},
      checkout: {
        serverTime: new Date().toISOString(),
        expireTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        retryAllowed: true,
      },
    } } });
  });
  await page.goto(`${origin}/checkout/${'qa'.repeat(16)}/options-preview`);
  await expect(page.getByRole('heading', { name: 'Payment method', exact: true })).toBeVisible();
  return { unexpectedRequests, errors };
}

for (const width of [1440, 390, 320]) {
  test(`payment method layout stays usable at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 960 });
    const observed = await openCheckout(page);
    const section = page.getByRole('article', { name: 'Payment method', exact: true });
    const card = section.getByRole('button', { name: 'Card', exact: true });
    const cardholder = section.getByLabel('Cardholder Name');
    const brands = section.getByRole('group', { name: 'Accepted card brands' });
    const submit = page.getByRole('button', { name: 'Pay CAD 28.8', exact: true });

    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('.checkout-payment-item')).toHaveCount(4);
    await expect(section.getByLabel('Card Number')).toBeVisible();
    await expect(brands.getByRole('img')).toHaveCount(cardBrands.length);
    await expect(section.getByRole('button', { name: 'More payment methods', exact: true })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Bitcoin (BTC) Unavailable' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    const wallet = section.getByRole('button', { name: 'Apple Pay', exact: true });
    const cardName = await card.locator('strong').boundingBox();
    const walletName = await wallet.locator('strong').boundingBox();
    const walletLogo = await wallet.locator('img').boundingBox();
    expect(cardName && walletName && walletLogo).toBeTruthy();
    expect(Math.abs(cardName!.x - walletName!.x)).toBeLessThan(1);
    expect(walletLogo!.x + walletLogo!.width).toBeLessThan(walletName!.x);
    await section.screenshot({ path: testInfo.outputPath('card-expanded.png') });

    await cardholder.fill('Casey Example');
    await wallet.click();
    await expect(wallet).toHaveAttribute('aria-pressed', 'true');
    await expect(brands).toBeHidden();
    await expect(card.locator('.checkout-payment-option__summary img')).toHaveCount(3);
    await expect(card.locator('.checkout-payment-option__summary small')).toHaveText('+5');
    await expect(submit).toHaveCount(0);
    await expect(section.getByRole('button', { name: 'Pay with Apple Pay', exact: true })).toBeEnabled();
    await section.screenshot({ path: testInfo.outputPath('wallet-selected.png') });
    await card.click();
    await expect(cardholder).toHaveValue('Casey Example');
    await expect(brands).toBeVisible();
    await expect(submit).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(observed.errors).toEqual([]);
    expect(observed.unexpectedRequests).toEqual([]);
  });
}

test('one card option keeps the payment section simple', async ({ page }) => {
  await openCheckout(page, [], true, false, false);
  await expect(page.getByRole('button', { name: 'Card', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'More payment methods', exact: true })).toBeHidden();
});

test('more payment methods only previews offered methods and keeps the selected row when collapsed', async ({ page }) => {
  // 模板响应提供足够多的可用方式，只验证折叠行为，不提交任何付款。
  await openCheckout(page, walletMethods.filter((method) => method !== 'BTC_ON_CHAIN'), true, false, false);
  const section = page.getByRole('article', { name: 'Payment method', exact: true });
  const more = section.getByRole('button', { name: 'More payment methods', exact: true });
  const payPal = section.getByRole('button', { name: 'PayPal', exact: true });
  const lastRow = section.locator('.checkout-payment-list > :last-child');
  await expect(more.locator('img')).toHaveCount(2);
  await expect(more).toHaveAttribute('aria-expanded', 'false');
  await expect(payPal).toHaveCount(0);
  await more.focus();
  await more.press('Enter');
  const fewer = section.getByRole('button', { name: 'Show fewer payment methods', exact: true });
  await expect(payPal).toBeFocused();
  await expect(lastRow).toHaveAccessibleName('Show fewer payment methods');
  await expect(section.locator('.checkout-payment-item')).toHaveCount(6);
  await expect(section.getByRole('button', { name: /Bitcoin/ })).toHaveCount(0);
  await payPal.click();
  await fewer.click();
  await expect(more).toBeFocused();
  await expect(payPal).toHaveAttribute('aria-pressed', 'true');
  await expect(section.locator('.checkout-payment-item')).toHaveCount(4);
});

test('no payable methods shows an explanation and keeps Pay disabled', async ({ page }) => {
  await openCheckout(page, [], false, false, false);
  await expect(page.getByText('No available payment method for this order.')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Pay CAD/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toHaveCount(0);
});

test('card setup failure keeps the card and restores Pay only after retry succeeds', async ({ page }) => {
  await openCheckout(page, [], true, true);
  await expect(page.getByRole('button', { name: 'Card', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const pay = page.getByRole('button', { name: 'Pay CAD 28.8', exact: true });
  await expect(pay).toBeDisabled();
  await page.getByRole('button', { name: 'Retry secure card form' }).click();
  await expect(page.getByLabel('Card Number')).toBeVisible();
  await expect(pay).toBeEnabled();
});
