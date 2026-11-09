import { expect, test, type Page, type Route } from '@playwright/test';

const rootTransactionDateTime = '2026-11-07T13:36:24.158';
const refundTransactionDateTime = '2026-11-07T13:38:10.321';

const paymentOperation = {
  operationId: 'OP20261107133624158',
  transactionId: 'SDKRFD261107133624158',
  merchantOrderNo: '202611071336262034592',
  transactionType: 'PAYMENT',
  transactionStatus: 'SUCCESS',
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
  test('keeps refund as the focused operation when payment and refund share one operation id', async ({
    page,
  }) => {
    let detailRequestUrl = '';
    await mockMerchantApis(page, (url) => {
      detailRequestUrl = url;
    });

    await page.goto('/transaction/order');

    const refundRow = page.getByRole('row', { name: /EUR 20\.00 退款 成功/ });
    await expect(refundRow).toBeVisible();
    await refundRow.getByRole('button', { name: '详情', exact: true }).click();

    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await expect(drawer).toBeVisible();

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
    await expect(drawer.getByText('20.00', { exact: true }).first()).toBeVisible();
    await expect(drawer.getByText(paymentOperation.transactionId, { exact: true })).toBeVisible();
  });
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
