import { test, expect, type Page } from '@playwright/test';

// 使用隔离会话与浏览器时钟验证展示及到期边界，不触发真实付款。
async function openCountdown(page: Page, seconds: number) {
  const serverTime = new Date('2026-11-19T04:00:00.000Z');
  await page.clock.install({ time: serverTime });
  await page.clock.pauseAt(new Date(serverTime.getTime() + 1000));
  await page.addInitScript(() => localStorage.setItem('acquiring_checkout_locale', 'zh-CN'));
  let queries = 0;
  let unexpectedCalls = 0;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/checkout/config/countries', (route) => route.fulfill({ json: {
    code: 'SUCCESS', data: [{ countryCode: 'US', countryCodeAlpha3: 'USA', countryName: 'United States', countryNameLocal: '美国', flagIconUrl: '', defaultLanguage: 'en-US', supportedLanguages: ['en-US', 'zh-CN'], sortNo: 20 }],
  } }));
  await page.route('**/checkout/api/**', (route) => {
    if (!route.request().url().endsWith('/session/query')) {
      unexpectedCalls++;
      return route.abort();
    }
    queries++;
    return route.fulfill({ json: { code: 'A0000', data: {
      checkoutSessionId: 'QA-COUNTDOWN-ONLY',
      pageState: queries === 1 ? 'PAYABLE' : 'EXPIRED',
      merchant: { displayName: 'QA Merchant' },
      order: { orderNo: 'QA-COUNTDOWN', subject: '倒计时展示验收', amount: '5.62', currency: 'USD', currencyExponent: 2 },
      paymentMethods: [{ paymentMethod: 'BANK_CARD', channelCode: 'QA', brands: ['VISA'] }],
      checkout: {
        serverTime: new Date(serverTime.getTime() + (queries === 1 ? 0 : seconds * 1000)).toISOString(),
        expireTime: new Date(serverTime.getTime() + seconds * 1000).toISOString(),
        retryAllowed: queries === 1,
      },
    } } });
  });
  await page.goto('http://127.0.0.1:5196/checkout/' + 'qa'.repeat(16) + '/qa-cover');
  await expect(page.getByRole('timer')).toBeVisible();
  return { errors, queries: () => queries, unexpectedCalls: () => unexpectedCalls };
}

for (const width of [1440, 390, 320]) {
  test(`countdown ${width}: 超长时间分天显示，中英文切换且无溢出`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const observed = await openCountdown(page, 713 * 3600 + 59 * 60 + 28);
    const timer = page.getByRole('timer');
    await expect(timer).toContainText('29天 17时 59分 28秒');
    await page.clock.fastForward(1000);
    await expect(timer).toContainText('29天 17时 59分 27秒');
    await timer.screenshot({ path: test.info().outputPath(`countdown-zh-${width}.png`) });
    await page.getByRole('combobox').selectOption('en-US');
    await expect(timer).toContainText('29d 17h 59m 27s');
    expect(await timer.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await timer.screenshot({ path: test.info().outputPath(`countdown-en-${width}.png`) });
    expect(observed.queries()).toBe(1);
    expect(observed.unexpectedCalls()).toBe(0);
    expect(observed.errors).toEqual([]);
  });
}

test('countdown boundaries: 天、时、分借位正确，到期仍停止付款并查询权威状态', async ({ page }) => {
  const observed = await openCountdown(page, 86400);
  const remaining = page.getByRole('timer').locator('strong');
  await expect(remaining).toHaveText('1天 00时 00分 00秒');
  await page.clock.fastForward(1000);
  await expect(remaining).toHaveText('23时 59分 59秒');
  await page.clock.fastForward((23 * 3600 - 1) * 1000);
  await expect(remaining).toHaveText('1时 00分 00秒');
  await page.clock.fastForward(1000);
  await expect(remaining).toHaveText('59分 59秒');
  await page.clock.fastForward(59 * 60 * 1000);
  await expect(remaining).toHaveText('59秒');
  await page.getByRole('combobox').selectOption('en-US');
  await expect(remaining).toHaveText('59s');
  await page.getByRole('combobox').selectOption('zh-CN');
  await page.clock.fastForward(58 * 1000);
  await expect(remaining).toHaveText('1秒');
  await page.clock.fastForward(1000);
  await expect(page.getByRole('heading', { name: '链接已过期', exact: true })).toBeVisible();
  await expect(page.locator('.checkout-submit')).toHaveCount(0);
  expect(observed.queries()).toBe(2);
  expect(observed.unexpectedCalls()).toBe(0);
  expect(observed.errors).toEqual([]);
});
