import { test, expect } from '@playwright/test';

// 固定响应仅验证入口分包与国家选择；不提交付款，不调用真实会话或外部渠道。
for (const width of [1440, 390]) {
  test(`checkout ${width}: 入口按需加载、国家错误重试和完整字典搜索`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    const scripts: string[] = [];
    let countries = 0;
    let paymentCalls = 0;
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => {
      if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
    });
    await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'zh-CN'));
    await page.route('**/checkout/api/**', async (route) => {
      paymentCalls++;
      return route.abort();
    });
    await page.route('**/checkout/config/countries', async (route) => {
      countries++;
      if (countries === 1) {
        return route.fulfill({ json: { code: 'UNAVAILABLE', data: null } });
      }
      return route.fulfill({ json: { code: 'SUCCESS', data: [
        { countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States', countryNameLocal: '美国', flagIconUrl: '', defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'zh-CN'], sortNo: 20 },
        { countryCode: 'HK', countryCodeAlpha3: 'HKG', countryName: 'Hong Kong', countryNameLocal: '香港', flagIconUrl: '', defaultLanguage: 'zh-CN', supportedLanguages: ['en-US', 'zh-CN'], sortNo: 10 },
      ] } });
    });
    await page.goto('http://127.0.0.1:5196/checkout/dev-token/qa-cover');
    await expect(page.getByText('国家/地区列表暂时不可用，请稍后重试。')).toBeVisible();
    expect(scripts.some((path) => path.endsWith('/src/App.vue'))).toBe(true);
    expect(scripts.some((path) => path.endsWith('/components/PaymentLinkEntry.vue'))).toBe(false);
    const country = page.getByRole('button', { name: '国家/地区', exact: true });
    await expect(country).toBeDisabled();
    await page.getByRole('button', { name: '重新加载', exact: true }).click();
    await expect(country).toBeEnabled();
    await country.click();
    await page.getByRole('textbox', { name: '搜索国家/地区或代码' }).fill('HKG');
    await page.getByRole('button', { name: 'Hong Kong', exact: true }).click();
    await expect(country).toContainText('Hong Kong');
    expect(countries).toBe(2);
    expect(paymentCalls).toBe(0);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: test.info().outputPath(`checkout-${width}.png`) });
  });
}
