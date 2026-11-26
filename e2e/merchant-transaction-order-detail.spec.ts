import { expect, test, type Page, type Route } from '@playwright/test';
import { transactionFeeFixtures } from '../e2e-support/transaction-fee-fixture';
import { verifyDictionaryLoading } from '../e2e-support/dictionary-loading';

const rootTransactionDateTime = '2026-11-07T13:36:24.158';
const refundTransactionDateTime = '2026-11-07T13:38:10.321';

const paymentOperation = {
  operationId: 'OP20261107133624158',
  transactionId: 'SDKRFD261107133624158',
  merchantOrderNo: '202611071336262034592',
  transactionType: 'PAYMENT',
  transactionStatus: 'SUCCESS',
  settlementStatus: 'NOT_SETTLED',
  labelAmount: '100.00',
  labelCurrency: 'EUR',
  currencyExponent: 2,
  transactionDateTime: rootTransactionDateTime,
  rootTransactionDateTime,
  operationTime: rootTransactionDateTime,
  paymentMethod: 'BANK_CARD',
  paymentBrand: 'VISA',
  merchantResponseCode: 'S000',
  merchantResponseMessage: 'Transaction completed successfully.',
};

const refundOperation = {
  ...paymentOperation,
  transactionId: '202611071336262034592',
  sourceTransactionId: paymentOperation.transactionId,
  transactionType: 'REFUND',
  labelAmount: '20.00',
  transactionDateTime: refundTransactionDateTime,
  operationTime: refundTransactionDateTime,
};

test.describe('Merchant transaction operation detail', () => {
  test('shares dictionary queries without caching completed results or failed requests', async ({ page }) => {
    await mockMerchantApis(page, () => {});
    await page.goto('/transaction/order');
    await expect(page.getByRole('button', { name: '详情', exact: true }).first()).toBeVisible();
    await verifyDictionaryLoading(page, 'merchant');
  });

  test('keeps refund as the focused operation when payment and refund share one operation id', async ({
    page,
  }) => {
    let detailRequestUrl = '';
    await mockMerchantApis(page, (url) => {
      detailRequestUrl = url;
    });

    await page.goto('/transaction/order');

    const refundRow = page.getByRole('row', { name: /EUR 20(?:\.00)? 退款 成功/ });
    await expect(refundRow).toBeVisible();
    await refundRow.getByRole('button', { name: '详情', exact: true }).click();

    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await expect(drawer).toBeVisible();

    await expect.poll(() => detailRequestUrl).not.toBe('');
    const requestUrl = new URL(detailRequestUrl);
    expect(requestUrl.pathname).toBe(
      `/merchant/transactions/orders/${refundOperation.transactionId}`,
    );
    expect(requestUrl.searchParams.get('transactionDateTime')).toBe(refundTransactionDateTime);
    expect(requestUrl.searchParams.get('rootTransactionDateTime')).toBe(rootTransactionDateTime);

    await expect(
      drawer.getByRole('definition').filter({ hasText: refundOperation.transactionId }).first(),
    ).toBeVisible();
    await expect(drawer.getByText('退款', { exact: true }).first()).toBeVisible();
    await expect(drawer.getByText('成功', { exact: true }).first()).toBeVisible();
    await expect(drawer.getByText(/^20(?:\.00)?$/, { exact: true }).first()).toBeVisible();
    await expect(drawer.getByText(paymentOperation.transactionId, { exact: true })).toBeVisible();
    await expect(drawer.locator('.transaction-stage-status-display[data-domain="settlement"][data-status="NOT_SETTLED"]').first()).toHaveText('未结算');
  });
});


test('merchant sees final fees for the selected action and can open the original pre-authorization', async ({ page }) => {
  const { original, completion } = transactionFeeFixtures();
  const originalId = String(original.summary.transactionId);
  const completionId = String(completion.summary.transactionId);
  const originalTime = String(original.summary.transactionDateTime);
  const completionTime = String(completion.summary.transactionDateTime);
  const source = { ...paymentOperation, transactionId: originalId, transactionDateTime: originalTime,
    rootTransactionDateTime: originalTime, transactionType: 'PRE_AUTHORIZATION', labelCurrency: 'CAD' };
  const operation = { ...source, transactionId: completionId, transactionDateTime: completionTime,
    sourceTransactionId: originalId, transactionType: 'PRE_AUTH_COMPLETION' };
  await mockMerchantApis(page, () => {});
  await page.route('**/merchant/auth/me', route => {
    const session = merchantSession();
    session.permissions.push('merchant:clearing:record:detail');
    return fulfill(route, session);
  });
  await page.route('**/merchant/transactions/orders/operations/page', route =>
    fulfill(route, { total: 1, pageNo: 1, pageSize: 10, pages: 1, records: [operation] }));
  await page.route('**/merchant/transactions/orders/operations/search', route =>
    fulfill(route, { page: { total: 1, records: [operation] } }));
  await page.route(`**/merchant/transactions/orders/${completionId}**`, route =>
    fulfill(route, { order: { ...source, rootTransactionId: originalId }, operations: [source, operation] }));
  for (const record of [original, completion]) {
    const id = String(record.summary.transactionId);
    await page.route(`**/merchant/settlements/clearing-records/transactions/${id}?*`, route => fulfill(route, record));
    await page.route(`**/merchant/settlements/clearing-records/transactions/${id}/*`, route =>
      fulfill(route, { total: 0, records: [] }));
  }
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.goto('/transaction/order');
  await page.getByRole('button', { name: '详情', exact: true }).first().click();
  const fees = page.getByTestId('transaction-fee-breakdown');
  await expect(fees.locator('.transaction-fee__total')).toContainText('USD 3.61');
  await fees.locator('summary').filter({ hasText: '结算货币兑换费' }).click();
  if (process.env.FEE_QA_DIR) {
    await fees.screenshot({ path: `${process.env.FEE_QA_DIR}/clearing-fee-merchant-completion.png` });
  }
  await fees.getByRole('button', { name: '查看原交易动作' }).click();
  await expect(fees.locator('.transaction-fee__total')).toContainText('USD 5.08');
  await expect(fees.getByText('内风控手续费', { exact: true })).toBeVisible();
  await fees.getByRole('button', { name: '返回当前交易动作' }).click();
  await expect(fees.locator('.transaction-fee__total')).toContainText('USD 3.61');
});

async function mockMerchantApis(page: Page, captureDetailUrl: (url: string) => void) {
  await page.route('**/merchant/auth/me', (route) => fulfill(route, merchantSession()));
  await page.route('**/merchant/system/dicts/data/search', (route) =>
    fulfill(route, {
      total: 0,
      pageNo: 1,
      pageSize: 1000,
      pages: 0,
      records: [],
    }),
  );
  await page.route('**/merchant/transactions/orders/operations/page', (route) =>
    fulfill(route, { total: 2, pageNo: 1, pageSize: 10, pages: 1, records: [refundOperation, paymentOperation] }));
  await page.route('**/merchant/transactions/orders/operations/summary', (route) =>
    fulfill(route, { totalCount: 2, successCount: 2, failedCount: 0, processingCount: 0,
      amountSummaries: [], successAmountSummaries: [], paymentMethodSummaries: [] }));
  await page.route('**/merchant/transactions/orders/operations/search', (route) =>
    fulfill(route, {
      page: {
        total: 2,
        pageNo: 1,
        pageSize: 10,
        pages: 1,
        records: [refundOperation, paymentOperation],
      },
      summary: {
        totalCount: 2,
        successCount: 2,
        failedCount: 0,
        processingCount: 0,
        amountSummaries: [{ currency: 'EUR', currencyExponent: 2, amount: '120.00' }],
        successAmountSummaries: [{ currency: 'EUR', currencyExponent: 2, amount: '120.00' }],
        paymentMethodSummaries: [],
      },
    }),
  );
  await page.route(`**/merchant/transactions/orders/${refundOperation.transactionId}**`, (route) => {
    captureDetailUrl(route.request().url());
    return fulfill(route, {
      order: {
        operationId: paymentOperation.operationId,
        rootTransactionId: paymentOperation.transactionId,
        latestTransactionId: refundOperation.transactionId,
        merchantOrderNo: paymentOperation.merchantOrderNo,
        transactionType: 'PAYMENT',
        transactionStatus: 'SUCCESS',
        labelAmount: '100.00',
        labelCurrency: 'EUR',
        currentAmount: '80.00',
        currentCurrency: 'EUR',
        currencyExponent: 2,
        transactionDateTime: rootTransactionDateTime,
        rootTransactionDateTime,
        paymentMethod: 'BANK_CARD',
        paymentBrand: 'VISA',
      },
      operations: [paymentOperation, refundOperation],
    });
  });
}

function merchantSession() {
  return {
    account: {
      accountId: 1,
      userId: 1,
      merchantUserId: 1,
      merchantId: 'M000001',
      appCode: 'MERCHANT',
      loginAccount: 'merchant-admin',
      realName: 'Merchant Admin',
      status: 1,
      timezone: 'Asia/Shanghai',
    },
    roles: ['MERCHANT_ADMIN'],
    permissions: ['merchant:transaction:order:list', 'merchant:transaction:order:detail'],
    menus: [
      {
        id: 30,
        parentId: 0,
        menuCode: 'merchant_transaction_catalog_v1',
        menuName: '交易管理',
        menuType: 'CATALOG',
        routePath: '/transaction',
        permissionCode: 'merchant:transaction',
        icon: 'Tickets',
        visible: 1,
        keepAlive: 1,
        externalLink: 0,
        sortNo: 30,
        children: [
          {
            id: 31,
            parentId: 30,
            menuCode: 'merchant_transaction_order_v1',
            menuName: '交易查询',
            menuType: 'MENU',
            routePath: '/transaction/order',
            componentPath: 'transaction/order',
            permissionCode: 'merchant:transaction:order:list',
            icon: 'Search',
            visible: 1,
            keepAlive: 1,
            externalLink: 0,
            sortNo: 31,
            children: [],
          },
        ],
      },
    ],
  };
}

async function fulfill(route: Route, data: unknown) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'T200', message: 'SUCCESS', data }),
  });
}
