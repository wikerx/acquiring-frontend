import { expect, test, type Page, type Route } from '@playwright/test';

const transactionId = '202611141800181810898';
const transactionDateTime = '2026-11-14T18:00:18.181';
const operation = {
    operationId: 'OP202611141800181810898',
    transactionId,
    rootTransactionDateTime: transactionDateTime,
    transactionDateTime,
    merchantId: '200045',
    merchantOrderNo: 'SDKQRY177261114180018162',
    merchantOrderId: 'SDKQRY177261114180018162',
    transactionType: 'PAYMENT',
    transactionStatus: 'SUCCESS',
    labelCurrency: 'EUR',
    labelAmount: '132.19',
    labelCurrencyExponent: 2,
    transactionCurrency: 'EUR',
    transactionAmount: '132.19',
    currencyExponent: 2,
};

test('shows clearing lines from their paginated APIs when the summary has no embedded lines', async ({ page }) => {
    const detailRequests: string[] = [];
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
    page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockAdminApis(page, (url) => detailRequests.push(url));

    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: '详情', exact: true }).first().click();

    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await expect(drawer).toBeVisible();
    await drawer.getByRole('tab', { name: '财务处理' }).click();
    await drawer.getByRole('tab', { name: '清分', exact: true }).click();

    const ledgers = drawer.locator('.transaction-finance-detail__section');
    await expect(ledgers.nth(0).locator('.el-tag')).toHaveText('6');
    await expect(ledgers.nth(0).locator('tbody tr')).toHaveCount(6);
    await expect(ledgers.nth(1).locator('.el-tag')).toHaveText('1');
    await expect(ledgers.nth(1).locator('tbody tr')).toHaveCount(1);
    expect(detailRequests.some((url) => url.includes(`/${transactionId}/transaction-details`))).toBe(true);
    expect(detailRequests.some((url) => url.includes(`/${transactionId}/reserve-details`))).toBe(true);
    expect(detailRequests.every((url) => new URL(url).searchParams.get('transactionDateTime') === transactionDateTime)).toBe(true);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    if (process.env.CLEARING_QA_SCREENSHOT_PATH) {
        await page.screenshot({ path: process.env.CLEARING_QA_SCREENSHOT_PATH, fullPage: false });
        await ledgers.nth(1).scrollIntoViewIfNeeded();
        await page.screenshot({
            path: process.env.CLEARING_QA_SCREENSHOT_PATH.replace(/\.png$/, '-reserve.png'),
            fullPage: false,
        });
    }
});

test('retries a failed transaction ledger and paginates without losing reserve lines', async ({ page }) => {
    await mockAdminApis(page, () => {});
    let transactionDetailRequests = 0;
    await page.route(`**/admin/clearing/records/${transactionId}/transaction-details**`, async (route) => {
        transactionDetailRequests += 1;
        if (transactionDetailRequests === 1) {
            await route.fulfill({
                status: 503,
                contentType: 'application/json',
                body: JSON.stringify({ code: 'T500', message: 'Service unavailable' }),
            });
            return;
        }
        const pageNo = Number(new URL(route.request().url()).searchParams.get('pageNo'));
        const firstLine = pageNo === 1 ? 1 : 11;
        const lastLine = pageNo === 1 ? 10 : 11;
        await fulfill(route, {
            total: 11,
            pageNo,
            pageSize: 10,
            pages: 2,
            records: Array.from({ length: lastLine - firstLine + 1 }, (_, index) => {
                const lineNo = firstLine + index;
                return {
                    clearingDetailNo: `F${lineNo}`,
                    lineNo,
                    itemName: `费用项目 ${lineNo}`,
                    direction: 'DEBIT',
                    amount: '1.00',
                    currency: 'EUR',
                    recordStatus: 'ACTIVE',
                };
            }),
        });
    });

    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await drawer.getByRole('tab', { name: '财务处理' }).click();
    await drawer.getByRole('tab', { name: '清分', exact: true }).click();

    const ledgers = drawer.locator('.transaction-finance-detail__section');
    await expect(ledgers.nth(0).getByText('交易费用清分明细加载失败，请重试')).toBeVisible();
    await expect(ledgers.nth(1).locator('.el-tag')).toHaveText('1');
    await ledgers.nth(0).getByRole('button', { name: '刷新' }).click();
    await expect(ledgers.nth(0).locator('.el-tag')).toHaveText('11');
    await expect(ledgers.nth(0).locator('tbody tr')).toHaveCount(10);
    await ledgers.nth(0).locator('.el-pager li.number').filter({ hasText: '2' }).click();
    await expect(ledgers.nth(0).locator('tbody tr')).toHaveCount(1);
    await expect(ledgers.nth(0).getByText('费用项目 11')).toBeVisible();
    await expect(ledgers.nth(1).locator('.el-tag')).toHaveText('1');
    expect(transactionDetailRequests).toBe(3);
});

async function mockAdminApis(page: Page, captureDetailRequest: (url: string) => void) {
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', (route) => fulfill(route, null));
    await page.route('**/admin/auth/me', (route) => fulfill(route, {
        account: {
            accountId: 1,
            userId: 1,
            appCode: 'ADMIN',
            loginAccount: 'scott',
            realName: 'Scott',
            status: 1,
        },
        roles: ['SUPER_ADMIN'],
        permissions: ['transaction:operation:list', 'transaction:operation:detail', 'clearing:record:detail'],
        menus: [{
            id: 30,
            parentId: 0,
            menuCode: 'admin_transaction_catalog_v1',
            menuName: '交易管理',
            menuType: 'CATALOG',
            routePath: '/transaction',
            permissionCode: 'transaction:operation:list',
            icon: 'Tickets',
            visible: 1,
            keepAlive: 1,
            externalLink: 0,
            sortNo: 30,
            children: [{
                id: 31,
                parentId: 30,
                menuCode: 'admin_transaction_operation_v1',
                menuName: '交易查询',
                menuType: 'MENU',
                routePath: '/transaction/operation',
                componentPath: 'transaction/operation',
                permissionCode: 'transaction:operation:list',
                icon: 'Search',
                visible: 1,
                keepAlive: 1,
                externalLink: 0,
                sortNo: 31,
                children: [],
            }],
        }],
    }));
    await page.route('**/admin/system/dicts/data/search', (route) => fulfill(route, {
        total: 0, pageNo: 1, pageSize: 500, pages: 0, records: [],
    }));
    await page.route('**/admin/base/currencies/presentations', (route) => fulfill(route, []));
    await page.route('**/admin/merchants/search', (route) => fulfill(route, {
        total: 0, pageNo: 1, pageSize: 50, pages: 0, records: [],
    }));
    await page.route('**/admin/transactions/operations/search-with-summary', (route) => fulfill(route, {
        page: { total: 1, pageNo: 1, pageSize: 10, pages: 1, records: [operation] },
        summary: {
            totalCount: 1,
            successCount: 1,
            failedCount: 0,
            amountSummaries: [{ currency: 'EUR', currencyExponent: 2, amount: '132.19' }],
            successAmountSummaries: [{ currency: 'EUR', currencyExponent: 2, amount: '132.19' }],
            failedAmountSummaries: [],
            paymentMethodSummaries: [],
        },
    }));
    await page.route(`**/admin/transactions/operations/${transactionId}**`, (route) => fulfill(route, {
        order: {
            ...operation,
            rootTransactionId: transactionId,
            latestTransactionId: transactionId,
        },
        operations: [operation],
        statusHistory: [],
        flowEvents: [],
        riskEvents: [],
        amountChanges: [],
        channelRequests: [],
        channelInteractionLogs: [],
        channelCallbacks: [],
        channelCallbackLogs: [],
        merchantNotifications: [],
        merchantNotificationLogs: [],
    }));
    await page.route(`**/admin/clearing/records/${transactionId}**`, (route) => fulfill(route, {
        summary: {
            transactionId,
            transactionDateTime,
            clearingStatus: 'CLEARED',
            clearingRevision: 1,
            labelCurrency: 'EUR',
            grossLabelAmount: '132.19',
            reserveAmount: '13.22',
            settlementStatus: 'UNSETTLED',
            version: 1,
        },
        transactionDetails: [],
        reserveDetails: [],
    }));
    await page.route(`**/admin/clearing/records/${transactionId}/transaction-details**`, (route) => {
        captureDetailRequest(route.request().url());
        return fulfill(route, {
            total: 6,
            pageNo: 1,
            pageSize: 10,
            pages: 1,
            records: [
                { clearingDetailNo: 'P1', lineNo: 1, itemName: '交易本金', direction: 'CREDIT', amount: '132.19', currency: 'EUR', recordStatus: 'ACTIVE' },
                { clearingDetailNo: 'F1', lineNo: 2, itemName: '交易手续费', direction: 'DEBIT', amount: '3.04', currency: 'EUR', recordStatus: 'ACTIVE' },
                { clearingDetailNo: 'F2', lineNo: 3, itemName: '交易手续费', direction: 'DEBIT', amount: '1.3', currency: 'USD', recordStatus: 'ACTIVE' },
                { clearingDetailNo: 'F3', lineNo: 4, itemName: '风控手续费', direction: 'DEBIT', amount: '0.08', currency: 'USD', recordStatus: 'ACTIVE' },
                { clearingDetailNo: 'F4', lineNo: 5, itemName: '结算换汇费', direction: 'DEBIT', amount: '1.32', currency: 'EUR', recordStatus: 'ACTIVE' },
                { clearingDetailNo: 'F5', lineNo: 6, itemName: '结算换汇费', direction: 'DEBIT', amount: '0.2', currency: 'USD', recordStatus: 'ACTIVE' },
            ],
        });
    });
    await page.route(`**/admin/clearing/records/${transactionId}/reserve-details**`, (route) => {
        captureDetailRequest(route.request().url());
        return fulfill(route, {
            total: 1,
            pageNo: 1,
            pageSize: 10,
            pages: 1,
            records: [{ reserveClearingDetailNo: 'R1', lineNo: 1, itemName: '保证金扣留', direction: 'DEBIT', retainedAmount: '13.22', reserveCurrency: 'EUR', remainingAmount: '13.22' }],
        });
    });
}

async function fulfill(route: Route, data: unknown) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'T200', message: 'SUCCESS', data }),
    });
}
