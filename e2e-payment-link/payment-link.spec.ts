import { test, expect, type Browser } from '@playwright/test';
import assert from 'node:assert/strict';
const good = (data: unknown) => ({ code: 'T200', message: 'SUCCESS', data });
const now = '2026-11-17T12:00:00';
const row = {
  linkId: 'L2026111810000000000001',
  merchantId: 'M_QA',
  merchantOrderNo: 'QA-ORDER-1',
  linkName: '支付链接页面测试',
  merchantDisplayName: 'QA Merchant',
  currency: 'USD',
  amount: '99.00',
  currencyExponent: 2,
  locale: 'AUTO',
  cardBrands: ['VISA'],
  status: 'ACTIVE',
  paymentStatus: 'PENDING',
  attemptCount: 0,
  version: 0,
  createTime: now,
  expireTime: '2026-11-18T12:00:00',
  createdAppCode: 'MERCHANT',
  createdBy: '42',
};
const paged = (records: unknown[]) => ({
  records,
  total: records.length,
  pageNo: 1,
  pageSize: 10,
  pages: 1,
});
async function workspace(
  browser: Browser,
  scope: 'admin' | 'merchant',
  width: number,
  readOnly = false,
) {
  const page = await browser.newPage({ viewport: { width, height: width > 2000 ? 1800 : 1000 } });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  let creates = 0,
    sends = 0,
    exported = 0;
  const calls: string[] = [];
  let latestSearch: Record<string, unknown> = {};
  const prefix =
    scope === 'admin' ? 'transaction:payment-link:' : 'merchant:transaction:payment-link:';
  await page.addInitScript(
    (scope) =>
      localStorage.setItem(
        scope === 'admin' ? 'acquiring_admin_locale' : 'acquiring_merchant_locale',
        'zh-CN',
      ),
    scope,
  );
  await page.route(`**/${scope}/**`, async (route) => {
    const path = new URL(route.request().url()).pathname;
    const input = route.request().postDataJSON();
    const reply = (data: unknown) => route.fulfill({ json: good(data) });
    calls.push(path);
    if (path === `/${scope}/auth/me`)
      return reply({
        account: {
          accountId: 42,
          userId: 42,
          appCode: scope.toUpperCase(),
          merchantId: scope === 'merchant' ? 'M_QA' : undefined,
          loginAccount: 'qa',
          realName: 'QA',
          status: 1,
        },
        roles: [],
        permissions: (readOnly
          ? ['list', 'detail']
          : ['list', 'detail', 'add', 'share', 'send', 'delivery', 'disable', 'export']
        ).map((p) => prefix + p),
        menus: [
          {
            id: 61,
            parentId: 0,
            menuCode: `${scope}_payment_link_v1`,
            menuName: '支付链接',
            menuType: 'MENU',
            routePath: '/transaction/payment-link',
            componentPath: 'transaction/payment-link',
            permissionCode: prefix + 'list',
            visible: 1,
            keepAlive: 0,
            externalLink: 0,
            sortNo: 1,
            children: [],
          },
        ],
      });
    if (path.endsWith('/merchants/search'))
      return reply([{ merchantId: 'M_QA', merchantName: 'QA Merchant' }]);
    if (path.endsWith('/payment-links/filter-options'))
      return reply({
        currencies: ['USD', 'JPY'],
        channels:
          scope === 'admin'
            ? [{ channelCode: 'QA_CHANNEL', channelName: 'QA Channel' }]
            : undefined,
      });
    if (path.endsWith('/payment-links/summary'))
      return reply({
        total: 1,
        active: 1,
        completed: 0,
        processing: 0,
        failedAttempts: 0,
        successfulAmounts: {},
      });
    if (path.endsWith('/payment-links/search')) {
      latestSearch = input;
      return reply(paged([row]));
    }
    if (path.endsWith('/payment-links/options'))
      return reply({
        merchantId: 'M_QA',
        merchantDisplayName: 'QA Merchant',
        currencies: ['USD', 'JPY'],
        cardBrands: ['VISA', 'MASTERCARD'],
        cardBrandsByCurrency: { USD: ['VISA', 'MASTERCARD'], JPY: ['VISA'] },
        locales: ['AUTO', 'zh-CN', 'en-US'],
        minExpireMinutes: 15,
        maxExpireMinutes: 43200,
      });
    if (path.endsWith('/payment-links') && route.request().method() === 'POST') {
      creates++;
      assert.equal(input.amount, '99.00');
      if (scope === 'merchant' && width === 1440) {
        assert.equal(input.linkName, '');
        assert.equal(input.expireMinutes, undefined);
        assert.match(input.expireTime, /T12:34:56$/);
      } else
        assert.equal(input.expireMinutes, width === 2560 ? 43200 : scope === 'admin' ? 4320 : 1440);
      assert.ok(input.requestId);
      await new Promise((r) => setTimeout(r, 300));
      return reply({ ...row, linkName: input.linkName });
    }
    if (path.endsWith('/share'))
      return reply({ url: 'http://127.0.0.1:5196/l/' + row.linkId + '.' + 'b'.repeat(64) });
    if (path.endsWith('/send-email')) {
      sends++;
      assert.equal(input.email, 'qa@example.invalid');
      await new Promise((r) => setTimeout(r, 250));
      return reply({
        requestId: input.requestId,
        recipientMasked: 'q***@example.invalid',
        sendStatus: 0,
        createdAppCode: scope.toUpperCase(),
        createdBy: '42',
        createTime: now,
      });
    }
    if (path.endsWith('/export')) {
      exported++;
      assert.equal(input.timezone, 'Asia/Shanghai');
      return reply({ taskNo: 'QA-EXPORT-1', status: 'PENDING' });
    }
    if (path.endsWith('/collections/search'))
      return reply(
        paged([
          {
            collectionId: 'QA-COLLECTION-1',
            merchantOrderNo: 'QA-ORDER-1',
            paymentStatus: 'PENDING',
            submissionDeadline: row.expireTime,
            createTime: now,
          },
        ]),
      );
    if (path.endsWith('/transactions/search'))
      return reply(
        paged([
          {
            checkoutAttemptId: 'qa-attempt',
            attemptNo: 1,
            currency: 'USD',
            amount: '99.00',
            currencyExponent: 2,
            status: 'FAILED',
            paymentMethod: 'BANK_CARD',
            cardBrand: 'VISA',
            createTime: now,
          },
        ]),
      );
    if (path.endsWith('/deliveries/search'))
      return reply(
        paged([
          {
            requestId: 'qa-mail',
            recipientMasked: 'q***@example.invalid',
            sendStatus: 4,
            createdBy: '42',
            locale: 'en-US',
            createTime: now,
          },
        ]),
      );
    if (path.endsWith('/events/search'))
      return reply(
        paged([
          {
            eventId: 'qa-event',
            eventType: 'CREATED',
            actorAppCode: 'ADMIN',
            actorId: '42',
            createTime: now,
          },
        ]),
      );
    if (path.endsWith('/' + row.linkId)) return reply(row);
    return reply(null);
  });
  await page.goto(`http://127.0.0.1:${scope === 'admin' ? 5194 : 5195}/transaction/payment-link`);
  await page.locator('.pl-workspace').waitFor();
  await page.getByRole('button', { name: '详情', exact: true }).first().waitFor();
  assert.equal(
    await page
      .locator('.payment-link-status')
      .first()
      .textContent()
      .then((s) => s.includes('有效')),
    true,
  );
  await page.locator('.transaction-time-range-filter').waitFor();
  await expect.poll(() => String(latestSearch.createTimeFrom)).toMatch(/T00:00:00$/);
  assert.ok(latestSearch.createTimeTo);
  await expect(
    page
      .locator('.transaction-time-range-filter')
      .getByRole('radio', { name: '今天', exact: true }),
  ).toBeChecked();
  const summaryBox = await page.locator('.pl-summary').boundingBox();
  assert.ok(summaryBox && summaryBox.height < (width < 650 ? 320 : 180));
  const tableBox = await page.locator('.pl-list').boundingBox();
  assert.ok(tableBox && tableBox.y - (summaryBox.y + summaryBox.height) <= 28);
  await page.screenshot({ path: test.info().outputPath('workspace.png'), fullPage: true });
  await page.getByRole('button', { name: '编辑列', exact: true }).waitFor();
  await page.getByRole('button', { name: '编辑列', exact: true }).click();
  await page
    .locator('.table-column-settings-popper')
    .getByRole('button', { name: '重置', exact: true })
    .waitFor();
  await page.getByText('商户订单号', { exact: true }).first().click();
  await page.locator('.table-column-settings-popper').waitFor({ state: 'hidden' });
  if (readOnly) {
    for (const name of ['创建支付链接', '导出', '停用链接', '复制 / 分享', '发送邮件']) {
      assert.equal(await page.getByRole('button', { name, exact: true }).count(), 0);
    }
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: '详情', exact: true });
    await drawer.waitFor();
    assert.equal(await drawer.getByRole('tab', { name: '邮件投递', exact: true }).count(), 0);
    for (const name of ['停用链接', '复制 / 分享', '发送邮件']) {
      assert.equal(await drawer.getByRole('button', { name, exact: true }).count(), 0);
    }
    assert.equal(
      calls.some((path) =>
        /\/share$|\/send-email$|\/disable$|\/deliveries\/search$|\/export$/.test(path),
      ),
      false,
    );
    assert.equal(creates + sends + exported, 0);
    assert.deepEqual(errors, []);
    await page.close();
    return;
  }
  assert.equal(await page.getByText('关键词', { exact: true }).count(), 0);
  await page.getByRole('textbox', { name: '商户订单号', exact: true }).fill('QA-ORDER-1');
  await page.getByRole('textbox', { name: '链接编号', exact: true }).fill(row.linkId);
  await page.getByRole('button', { name: '查询', exact: true }).click();
  await expect.poll(() => latestSearch.merchantOrderNo).toBe('QA-ORDER-1');
  assert.equal(latestSearch.linkId, row.linkId);
  assert.equal(latestSearch.keyword, undefined);
  await page
    .locator('.pl-workspace .search-form .el-form-item')
    .filter({ hasText: '币种' })
    .locator('.el-select')
    .click();
  await page.getByRole('option', { name: /USD/ }).click();
  assert.ok((await page.locator('.pl-workspace .search-form .currency-display').count()) > 0);
  if (scope === 'admin') {
    await page
      .locator('.pl-workspace .search-form .el-form-item')
      .filter({ hasText: '交易渠道编码' })
      .locator('.el-select')
      .click();
    await page.getByRole('option', { name: 'QA_CHANNEL / QA Channel', exact: true }).click();
  }
  await page.getByRole('button', { name: '查询', exact: true }).click();
  await expect.poll(() => latestSearch.currency).toBe('USD');
  if (scope === 'admin') assert.equal(latestSearch.channelCode, 'QA_CHANNEL');
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await page.locator('.transaction-time-range-filter__timezone').click();
  await page
    .getByRole('option', {
      name: scope === 'admin' ? '协调世界时（UTC+00:00）' : 'UTC',
      exact: true,
    })
    .click();
  await page.locator('.transaction-time-range-filter').getByText('今天', { exact: true }).click();
  await page.getByRole('button', { name: '查询', exact: true }).click();
  await expect.poll(() => String(latestSearch.createTimeFrom)).toMatch(/T08:00:00$/);
  await page.getByRole('button', { name: '重置', exact: true }).click();
  await expect.poll(() => String(latestSearch.createTimeFrom)).toMatch(/T00:00:00$/);
  assert.ok(latestSearch.createTimeTo);
  await page.getByRole('button', { name: '创建支付链接', exact: false }).first().click();
  const dialog = page.getByRole('dialog', { name: '创建支付链接' });
  await dialog.waitFor();
  if (scope === 'admin') {
    await dialog.locator('.el-select').first().click();
    await page.getByRole('option', { name: 'M_QA · QA Merchant' }).last().click();
  }
  await dialog.locator('.payment-method-display[aria-label="银行卡 · VISA"]').waitFor();
  assert.equal(await dialog.locator('.payment-method-display__empty').count(), 0);
  if (!(scope === 'merchant' && width === 1440))
    await dialog.getByLabel('链接名称', { exact: true }).fill('新建验收链接');
  if (scope === 'merchant' && width === 1440) {
    await dialog.getByText('自选到期时间', { exact: true }).click();
    const tomorrow = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
    await dialog.getByPlaceholder('自选到期时间', { exact: true }).fill(tomorrow + ' 12:34:56');
    await dialog.getByLabel('金额', { exact: true }).click();
    const expiryBox = await dialog.locator('.pl-expiry-controls .el-date-editor').boundingBox();
    assert.ok(expiryBox && expiryBox.width >= 210);
  } else if (width === 2560 || scope === 'admin') {
    await dialog.locator('.pl-expiry-controls .el-select').click();
    await page
      .getByRole('option', { name: width === 2560 ? '30 天' : '72 小时', exact: true })
      .click();
  }
  await dialog.getByLabel('金额', { exact: true }).fill('99.00');
  await dialog.screenshot({ path: test.info().outputPath('create.png') });
  await dialog.getByRole('button', { name: '创建支付链接', exact: true }).click();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog', { name: '详情', exact: true }).waitFor();
  await expect(page.getByRole('dialog', { name: '详情', exact: true })).not.toContainText(
    'paymentLink.',
  );
  assert.equal(creates, 1);
  await page.getByRole('tab', { name: '收款订单', exact: true }).click();
  await page.getByText('QA-COLLECTION-1', { exact: true }).waitFor();
  await page.getByRole('tab', { name: '支付尝试', exact: true }).click();
  await page.getByText('支付失败', { exact: true }).first().waitFor();
  await page.getByRole('tab', { name: '邮件投递', exact: true }).click();
  await page.getByText('等待重试', { exact: true }).waitFor();
  const drawer = page.getByRole('dialog', { name: '详情', exact: true });
  await drawer.getByRole('button', { name: '复制 / 分享', exact: true }).click();
  const share = page.getByRole('dialog', { name: '复制 / 分享', exact: true });
  await share.locator('img[alt="支付链接二维码"]').waitFor();
  assert.ok((await share.getByRole('textbox').inputValue()).includes('/l/'));
  await share.getByRole('button', { name: '关闭', exact: true }).click();
  await share.waitFor({ state: 'hidden' });
  await drawer.getByRole('button', { name: '发送邮件', exact: true }).click();
  const email = page.getByRole('dialog', { name: '发送邮件', exact: true });
  await email.getByLabel('客户邮箱', { exact: true }).fill('qa@example.invalid');
  await email.getByRole('button', { name: '发送邮件', exact: true }).click();
  await page.keyboard.press('Enter');
  await email.waitFor({ state: 'hidden' });
  assert.equal(sends, 1);
  await page.keyboard.press('Escape');
  await drawer.waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: '导出', exact: true }).click();
  await page.getByText('导出任务已创建，请前往下载中心领取。', { exact: true }).waitFor();
  assert.equal(exported, 1);
  await page.locator(scope === 'admin' ? '.lang-trigger' : '.merchant-lang-trigger').click();
  await page.getByRole('menuitem', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Create payment link', exact: true }).waitFor();
  await page.locator('html').evaluate((el) => el.classList.add('dark'));
  await page.screenshot({ path: test.info().outputPath('english-dark.png'), fullPage: true });
  await page.getByRole('button', { name: 'Create payment link', exact: true }).click();
  const englishDialog = page.getByRole('dialog', { name: 'Create payment link', exact: true });
  await englishDialog.waitFor();
  assert.ok(
    await englishDialog
      .locator('.el-form-item__label')
      .evaluateAll((labels) => labels.every((label) => label.scrollWidth <= label.clientWidth + 1)),
  );
  await englishDialog.screenshot({ path: test.info().outputPath('english-create.png') });
  await englishDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  assert.deepEqual(errors, []);
  await page.close();
}
async function payer(
  browser: Browser,
  width: number,
  state: string,
  processing = false,
  failed = false,
  tokenId = row.linkId,
) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  let starts = 0;
  await page.route('**/checkout/api/v1/payment-links/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/resolve')) {
      return route.fulfill({
        json: {
          code: 'A0000',
          data: {
            ...row,
            status: state,
            payable: state === 'ACTIVE' && !processing,
            processing,
            lastFailedTime: failed ? now : undefined,
            serverTime: now,
            locale: 'zh-CN',
          },
        },
      });
    }
    starts++;
    await new Promise((r) => setTimeout(r, 300));
    return route.fulfill({
      json: {
        code: 'A0000',
        data: { checkoutUrl: 'http://evil.example.invalid/checkout/token/cover' },
      },
    });
  });
  await page.goto('http://127.0.0.1:5196/l/' + tokenId + '.' + 'b'.repeat(64));
  await page.getByRole('heading', { name: 'QA Merchant', exact: true }).waitFor();
  if (failed) await page.getByText('最后一次支付失败', { exact: true }).waitFor();
  if (state === 'ACTIVE' && !processing) {
    assert.equal(starts, 0);
    await page.getByRole('button', { name: '进入安全收银台', exact: true }).dblclick();
    await page.getByText('无法打开收银台，请重新确认链接状态后重试。', { exact: true }).waitFor();
    assert.equal(starts, 1);
    assert.ok(page.url().startsWith('http://127.0.0.1:5196/l/'));
  } else {
    assert.equal(
      await page.getByRole('button', { name: '进入安全收银台', exact: true }).count(),
      0,
    );
    assert.equal(starts, 0);
  }
  assert.equal(await page.evaluate(() => Boolean(localStorage.getItem('opaqueToken'))), false);
  assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'), 'no-referrer');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
  assert.deepEqual(errors, []);
  await page.close();
}
async function automaticPayerState(browser: Browser, kind: 'expiry' | 'processing') {
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
  await page.clock.install();
  let reads = 0,
    starts = 0;
  await page.route('**/checkout/api/v1/payment-links/**', async (route) => {
    if (route.request().url().endsWith('/start')) {
      starts++;
      return route.fulfill({ json: { code: 'A0000', data: null } });
    }
    reads++;
    return route.fulfill({
      json: {
        code: 'A0000',
        data: {
          ...row,
          locale: 'zh-CN',
          serverTime: now,
          expireTime: kind === 'expiry' ? '2026-11-17T12:00:01' : row.expireTime,
          status: reads > 1 ? (kind === 'expiry' ? 'EXPIRED' : 'COMPLETED') : 'ACTIVE',
          payable: reads === 1 && kind === 'expiry',
          processing: reads === 1 && kind === 'processing',
        },
      },
    });
  });
  await page.goto('http://127.0.0.1:5196/l/' + row.linkId + '.' + 'b'.repeat(64));
  await page.getByRole('heading', { name: 'QA Merchant', exact: true }).waitFor();
  if (kind === 'processing') {
    await page.getByRole('combobox').selectOption('en-US');
    await page.clock.fastForward(5100);
    await page
      .getByText('This order has been paid. No further payment is needed.', { exact: true })
      .waitFor();
  } else {
    await page.clock.fastForward(1400);
    await page.getByText('此支付链接已过期，请联系商户。', { exact: true }).waitFor();
  }
  assert.equal(reads, 2);
  assert.equal(starts, 0);
  assert.equal(
    await page.getByRole('button', { name: /进入安全收银台|Continue to secure checkout/ }).count(),
    0,
  );
  await page.close();
}

// 固定响应验证组件交互；真实网关、数据库、渠道和邮件验收另行执行。
for (const [scope, width] of [
  ['admin', 1440],
  ['merchant', 1440],
  ['merchant', 390],
  ['admin', 2560],
  ['merchant', 2560],
] as const) {
  test(`${scope} ${width}: 创建、币种能力、幂等交互和详情`, async ({ browser }) => {
    await workspace(browser, scope, width);
  });
}
for (const scope of ['admin', 'merchant'] as const) {
  test(`${scope} 只读权限不展示写入入口或邮件投递`, async ({ browser }) => {
    await workspace(browser, scope, 1440, true);
  });
}
for (const state of ['ACTIVE', 'COMPLETED', 'DISABLED', 'EXPIRED']) {
  test(`付款入口 ${state}: 状态和提交边界`, async ({ browser }) => {
    await payer(browser, 390, state);
  });
}
test('付款处理中不能再次开始支付', async ({ browser }) => {
  await payer(browser, 1440, 'ACTIVE', true);
});
for (const kind of ['processing', 'expiry'] as const) {
  test(`付款入口自动收敛 ${kind}`, async ({ browser }) => {
    await automaticPayerState(browser, kind);
  });
}

test('过期失败链接保留最后失败记录且不能发起付款', async ({ browser }) =>
  payer(browser, 390, 'EXPIRED', false, true));

test('旧数字及 UUID 链接继续兼容只读查询', async ({ browser }) => {
  for (const id of ['2026111810000000000001', 'a'.repeat(32)])
    await payer(browser, 390, 'EXPIRED', false, false, id);
});
