import { expect, test, type Page, type Route } from '@playwright/test';

const notificationRecord = {
    notifyId: 'NTF202611040001',
    transactionId: 'TXN202611040001',
    operationId: 'OP202611040001',
    merchantOrderNo: 'ORDER-20261104-001',
    notifyType: 'PAYMENT_RESULT',
    eventType: 'TRANSACTION_CREATED',
    notifyStatus: 'SUCCESS',
    lastAttemptNo: 1,
    maxRetryCount: 5,
    successTime: '2026-11-04T16:20:03.000',
    transactionDateTime: '2026-11-04T16:20:00.123',
    createTime: '2026-11-04T16:20:01.000',
    updateTime: '2026-11-04T16:20:03.000',
};

const notificationDetail = {
    notification: {
        ...notificationRecord,
        targetUrlMasked: 'https://merchant.example/callback/***',
        payloadJsonMasked: JSON.stringify({
            transactionId: notificationRecord.transactionId,
            cardNumber: '411111******1111',
        }),
        signType: 'RSA_SHA256',
    },
    deliveryLogs: [
        {
            notifyLogId: 'NTFL202611040001',
            notifyId: notificationRecord.notifyId,
            deliveryMode: 'AUTO',
            attemptNo: 1,
            httpStatus: 200,
            requestHeaderJsonMasked: JSON.stringify({ 'X-Signature': '***' }),
            requestBodyJsonMasked: JSON.stringify({ transactionId: notificationRecord.transactionId }),
            responseBodyJsonMasked: JSON.stringify({ message: 'succeed' }),
            success: true,
            notifyTime: '2026-11-04T16:20:02.000',
            responseTime: '2026-11-04T16:20:03.000',
            durationMillis: 1000,
            httpMethod: 'POST',
        },
    ],
};

test.describe('Merchant transaction notification records', () => {
    test('uses the transaction-page filter layout and opens a readable task detail', async ({ page }) => {
        let searchPayload: Record<string, unknown> | undefined;
        await mockMerchantApis(page, {
            detail: true,
            retry: true,
            transactionDetail: true,
            captureSearch: (payload) => { searchPayload = payload; },
        });

        await page.goto('/transaction/notification');

        await expect(page.getByRole('columnheader', { name: '系统订单号' })).toBeVisible();
        await expect(page.getByText('交易结果生成', { exact: true })).toBeVisible();
        await expect(page.getByText('TRANSACTION_CREATED', { exact: true })).toHaveCount(0);
        expect(searchPayload).not.toHaveProperty('merchantId');
        expect(searchPayload?.queryTimeZone).toBe('Asia/Shanghai');
        expect(searchPayload?.beginTime).toBeTruthy();
        expect(searchPayload?.endTime).toBeTruthy();

        const merchantInput = page.getByRole('textbox', { name: '商户订单号', exact: true });
        const systemOrderInput = page.getByRole('textbox', { name: '系统订单号', exact: true });
        const merchantBox = await merchantInput.boundingBox();
        const systemOrderBox = await systemOrderInput.boundingBox();
        expect(merchantBox).not.toBeNull();
        expect(systemOrderBox).not.toBeNull();
        const viewport = page.viewportSize();
        expect(viewport).not.toBeNull();
        if (viewport!.width > 760) {
            expect(merchantBox!.width).toBeLessThan(360);
            expect(systemOrderBox!.width).toBeLessThan(360);
            expect(Math.abs(merchantBox!.width - systemOrderBox!.width)).toBeLessThan(2);
        } else {
            expect(merchantBox!.width).toBeGreaterThan(viewport!.width * 0.6);
        }

        await expect(page.getByRole('button', { name: '复制通知任务号' })).toBeVisible();
        await page.getByRole('button', { name: notificationRecord.notifyId, exact: true }).click();

        const drawer = page.getByRole('dialog', { name: '交易通知详情' });
        await expect(drawer).toBeVisible();
        await expect(drawer).toHaveCSS('transform', 'none');
        const drawerBox = await drawer.boundingBox();
        expect(drawerBox).not.toBeNull();
        expect(drawerBox!.x).toBeGreaterThanOrEqual(0);
        expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
        if (viewport!.width > 1200) {
            expect(drawerBox!.width).toBeGreaterThan(1000);
        } else {
            expect(drawerBox!.width).toBeGreaterThan(viewport!.width * 0.9);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth))
            .toBeLessThanOrEqual(viewport!.width);
        await expect(drawer.getByText('https://merchant.example/callback/***')).toBeVisible();
        await expect(drawer.getByText('RSA_SHA256')).toBeVisible();
        await expect(drawer.getByText('第 1 次投递')).toBeVisible();
        await expect(drawer.getByText('411111******1111')).toBeVisible();
        await expect(drawer.getByRole('button', { name: '重发' })).toBeEnabled();
        await expect(page.getByText('raw-secret-value')).toHaveCount(0);
    });

    test('resends successful tasks and opens the system order detail route', async ({ page }) => {
        let retryPayload: Record<string, unknown> | undefined;
        let retryRequestCount = 0;
        await mockMerchantApis(page, {
            detail: true,
            retry: true,
            transactionDetail: true,
            retryDelayMs: 200,
            captureRetry: (payload) => {
                retryPayload = payload;
                retryRequestCount += 1;
            },
        });

        await page.goto('/transaction/notification');

        await page.getByRole('button', { name: '重发', exact: true }).first().click();
        await expect(page.getByRole('dialog', { name: '确认重发交易通知' })).toBeVisible();
        await page.getByRole('button', { name: '确认', exact: true }).dblclick({ delay: 10 });
        await expect(page.getByRole('dialog', { name: '确认重发交易通知' })).toBeHidden();
        await expect(page.getByText('重发任务已受理，请稍后刷新查看投递结果')).toBeVisible();
        expect(retryRequestCount).toBe(1);
        expect(retryPayload?.notifyId).toBe(notificationRecord.notifyId);
        expect(retryPayload?.transactionDateTime).toBe('2026-11-04 16:20:00.123');
        expect(retryPayload?.requestId).toBeTruthy();
        expect(retryPayload).not.toHaveProperty('merchantId');

        await page.getByRole('button', { name: notificationRecord.transactionId, exact: true }).click();
        await expect(page).toHaveURL(/\/transaction\/order\?.*transactionId=TXN202611040001/);
        await expect(page.getByRole('dialog', { name: '交易详情' })).toBeVisible();
    });

    test('hides protected actions and keeps merchant terminology in English', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('acquiring_merchant_locale', 'en-US'));
        await mockMerchantApis(page, {
            detail: false,
            retry: false,
            transactionDetail: false,
        });

        await page.goto('/transaction/notification');

        await expect(page.getByRole('columnheader', { name: 'System Order No.' })).toBeVisible();
        await expect(page.getByText('Transaction Result Created', { exact: true })).toBeVisible();
        await expect(page.getByText('TRANSACTION_CREATED', { exact: true })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Details' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Resend' })).toHaveCount(0);
    });
});

interface MockOptions {
    detail: boolean;
    retry: boolean;
    transactionDetail: boolean;
    captureSearch?: (payload: Record<string, unknown>) => void;
    captureRetry?: (payload: Record<string, unknown>) => void;
    retryDelayMs?: number;
}

async function mockMerchantApis(page: Page, options: MockOptions) {
    await page.route('**/merchant/auth/me', (route) => fulfill(route, session(options)));
    await page.route('**/merchant/system/dicts/data/search', (route) => fulfill(route, {
        total: 0,
        pageNo: 1,
        pageSize: 1000,
        pages: 0,
        records: [],
    }));
    await page.route('**/merchant/transactions/notifications/search', async (route) => {
        options.captureSearch?.(route.request().postDataJSON() as Record<string, unknown>);
        await fulfill(route, {
            total: 1,
            pageNo: 1,
            pageSize: 20,
            pages: 1,
            records: [notificationRecord],
        });
    });
    await page.route('**/merchant/transactions/notifications/retry', async (route) => {
        options.captureRetry?.(route.request().postDataJSON() as Record<string, unknown>);
        if (options.retryDelayMs) {
            await new Promise((resolve) => setTimeout(resolve, options.retryDelayMs));
        }
        await fulfill(route, 'MNR-M-5bf29488-9f8c-3e32-9e7a-37c318d1930f');
    });
    await page.route(
        `**/merchant/transactions/notifications/${notificationRecord.notifyId}**`,
        (route) => {
            if (new URL(route.request().url()).pathname.endsWith('/delivery-logs')) {
                return fulfill(route, {
                    total: notificationDetail.deliveryLogs.length,
                    pageNo: 1,
                    pageSize: 10,
                    pages: 1,
                    records: notificationDetail.deliveryLogs,
                });
            }
            return fulfill(route, notificationDetail);
        },
    );
    await page.route('**/merchant/transactions/orders/operations/search', (route) => fulfill(route, {
        page: {
            total: 1,
            pageNo: 1,
            pageSize: 20,
            pages: 1,
            records: [{
                ...notificationRecord,
                rootTransactionDateTime: notificationRecord.transactionDateTime,
                transactionType: 'PAYMENT',
                transactionStatus: 'SUCCESS',
                transactionAmount: '10.00',
                transactionCurrency: 'USD',
                labelAmount: '10.00',
                labelCurrency: 'USD',
            }],
        },
        summary: {
            totalCount: 1,
            successCount: 1,
            failedCount: 0,
            processingCount: 0,
            amountSummaries: [],
            paymentMethodSummaries: [],
        },
    }));
    await page.route(
        `**/merchant/transactions/orders/${notificationRecord.transactionId}**`,
        (route) => fulfill(route, {
            order: {
                ...notificationRecord,
                rootTransactionDateTime: notificationRecord.transactionDateTime,
                transactionType: 'PAYMENT',
                transactionStatus: 'SUCCESS',
                transactionAmount: '10.00',
                transactionCurrency: 'USD',
                labelAmount: '10.00',
                labelCurrency: 'USD',
            },
            flowEvents: [],
        }),
    );
}

function session(options: MockOptions) {
    const permissions = ['merchant:transaction:notification:list'];
    if (options.detail) permissions.push('merchant:transaction:notification:detail');
    if (options.retry) permissions.push('merchant:transaction:notification:retry');
    if (options.transactionDetail) {
        permissions.push('merchant:transaction:order:list');
        permissions.push('merchant:transaction:order:detail');
    }
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
        },
        roles: ['MERCHANT_ADMIN'],
        permissions,
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
                        id: 33,
                        parentId: 30,
                        menuCode: 'merchant_transaction_notification_v1',
                        menuName: '交易通知记录',
                        menuType: 'MENU',
                        routePath: '/transaction/notification',
                        componentPath: 'transaction/notification',
                        permissionCode: 'merchant:transaction:notification:list',
                        icon: 'Bell',
                        visible: 1,
                        keepAlive: 1,
                        externalLink: 0,
                        sortNo: 33,
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
