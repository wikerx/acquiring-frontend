import { expect, test } from '@playwright/test';

const origin = process.env.REQ001_CHECKOUT_DEV_ORIGIN ?? 'http://127.0.0.1:5196';
const states = [
  ['PAYABLE', 'Ready to pay'],
  ['SUCCEEDED', 'Succeeded'],
  ['FAILED_FINAL', 'Failed'],
  ['PROCESSING', 'Processing'],
  ['CANCELLED', 'Cancelled'],
  ['EXPIRED', 'Expired'],
] as const;

for (const [pageState, status] of states) {
  test(`checkout header preserves ${pageState} status and language on desktop and narrow screens`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'en-US'));
    await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: { code: 'SUCCESS', data: [] } }));
    await page.route('**/checkout/api/**', (route) => route.fulfill({ json: { code: 'A0000', data: {
      checkoutSessionId: 'checkout-header-preview',
      pageState,
      merchant: { displayName: 'Demo Store' },
      order: { orderNo: 'QA-HEADER', amount: '11.24', currency: 'USD' },
      checkout: { pollingIntervalSeconds: 60 },
    } } }));
    await page.goto(`${origin}/checkout/${'qa'.repeat(16)}/header-preview`);

    const header = page.locator('.checkout-topbar');
    const logo = header.getByRole('img', { name: 'Vexra Checkout', exact: true });
    const statusLabel = header.getByText(status, { exact: true });
    const language = header.getByRole('combobox', { name: 'Language' });
    const subtitle = header.getByText('Hosted Checkout', { exact: true });
    await expect(statusLabel).toBeVisible();
    await expect(subtitle).toBeVisible();
    await expect(header.getByText('Secure Checkout', { exact: true })).toHaveCount(0);
    await expect(logo).toBeVisible();
    const desktopLogo = await logo.boundingBox();
    expect(desktopLogo?.width).toBeGreaterThan(250);

    await page.setViewportSize({ width: 320, height: 750 });
    await expect(subtitle).toBeHidden();
    await expect(statusLabel).toBeVisible();
    await expect(language).toBeVisible();
    const [logoBox, statusBox, languageBox] = await Promise.all([
      logo.boundingBox(), statusLabel.boundingBox(), language.boundingBox(),
    ]);
    expect(logoBox!.x + logoBox!.width).toBeLessThan(statusBox!.x);
    expect(statusBox!.x + statusBox!.width).toBeLessThan(languageBox!.x);
    expect(Math.abs(logoBox!.y + logoBox!.height / 2 - languageBox!.y - languageBox!.height / 2)).toBeLessThan(1);
    await language.selectOption('zh-CN');
    await expect(header.getByRole('combobox', { name: '语言' })).toHaveValue('zh-CN');
  });
}

test('PayByLink entry uses the shared header with Vexra Link branding', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.route('**/checkout/api/v1/payment-links/resolve', (route) => route.fulfill({ json: { code: 'A0000', data: {
    linkName: 'Demo order', merchantDisplayName: 'Demo Store', currency: 'USD', amount: '11.24',
    status: 'ACTIVE', payable: true, locale: 'en-US',
    serverTime: new Date().toISOString(), expireTime: new Date(Date.now() + 3600000).toISOString(),
  } } }));
  await page.goto(`${origin}/l/L${'1'.repeat(22)}.${'b'.repeat(64)}`);

  const header = page.locator('.checkout-topbar');
  const brand = header.getByRole('img', { name: 'Vexra Link', exact: true });
  const subtitle = header.getByText('Hosted Payment Link', { exact: true });
  await expect(page.getByRole('heading', { name: 'Review your payment' })).toBeVisible();
  await expect(header.getByText('Ready to pay', { exact: true })).toBeVisible();
  await expect(subtitle).toBeVisible();
  await expect(header.getByText('Secure Checkout', { exact: true })).toHaveCount(0);
  expect((await brand.boundingBox())?.width).toBeGreaterThan(250);

  await page.setViewportSize({ width: 320, height: 750 });
  await expect(subtitle).toBeHidden();
  await header.getByRole('combobox', { name: 'Language' }).selectOption('zh-CN');
  await expect(header.getByRole('combobox', { name: '语言' })).toHaveValue('zh-CN');
  const [logo, status, language] = await Promise.all([
    brand.boundingBox(),
    header.getByText('可支付', { exact: true }).boundingBox(),
    header.getByRole('combobox', { name: '语言' }).boundingBox(),
  ]);
  expect(logo!.x + logo!.width).toBeLessThan(status!.x);
  expect(status!.x + status!.width).toBeLessThan(language!.x);
  expect(Math.abs(logo!.y + logo!.height / 2 - language!.y - language!.height / 2)).toBeLessThan(1);
});
