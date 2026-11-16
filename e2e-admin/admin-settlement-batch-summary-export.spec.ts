import { expect, test, type Page, type Route } from '@playwright/test';

const settlementBatch = {
    id: 1001,
    settlementBatchNo: 'STL202611150001',
    displayBatchNo: 'STL202611150001',
    businessDate: '2026-11-15',
    businessTimeZone: 'Asia/Shanghai',
    dailySequence: 1,
    merchantId: 'M200045',
    merchantName: 'Regression Merchant',
    settlementProfileId: 10,
    settlementAccountId: 20,
    targetCurrency: 'USD',
    targetCurrencyExponent: 2,
    batchType: 'REGULAR',
    batchStatus: 'POSTED',
    transactionCount: 12,
    candidateCount: 12,
    projectableCandidateCount: 12,
    netDirection: 'CREDIT',
    netAmount: '1250.00',
    retryCount: 0,
    version: 1,
    createTime: '2026-11-15T10:00:00',
    updateTime: '2026-11-15T10:01:00',
};

test.describe('Admin settlement batch summary export', () => {
    test('submits one asynchronous task when the export button is double-clicked', async ({ page }) => {
        let exportRequestCount = 0;
        let exportPayload: Record<string, unknown> | undefined;
        await mockAdminApis(page, async (route) => {
            exportRequestCount += 1;
            exportPayload = route.request().postDataJSON() as Record<string, unknown>;
            await new Promise((resolve) => setTimeout(resolve, 250));
            await fulfill(route, {
                taskNo: 'AET202611150001',
                taskType: 'ADMIN_SETTLEMENT_BATCH_SUMMARY',
                taskStatus: 'PENDING',
            });
        });

        await page.goto('/settlement/batches');

        await expect(page.getByText(settlementBatch.settlementBatchNo, { exact: true })).toBeVisible();
        await page.getByRole('button', { name: /汇总/ }).click();

        const drawer = page.locator('.el-drawer').filter({ hasText: settlementBatch.settlementBatchNo });
        await expect(drawer).toBeVisible();
        const exportButton = drawer.getByRole('button', { name: '导出', exact: true });
        await expect(exportButton).toBeEnabled();
        await exportButton.dblclick({ delay: 10 });

        await expect.poll(() => exportRequestCount).toBe(1);
        await expect(page.getByText(/AET202611150001/)).toBeVisible();
        expect(exportPayload?.settlementBatchNo).toBe(settlementBatch.settlementBatchNo);
        expect(exportPayload?.requestId).toMatch(/^settlement-batch-summary-export-/);
        expect(exportRequestCount).toBe(1);
    });
});

async function mockAdminApis(
    page: Page,
    exportHandler: (route: Route) => Promise<void>,
) {
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', (route) => fulfill(route, null));
    await page.route('**/admin/auth/me', (route) => fulfill(route, adminSession()));
    await page.route('**/admin/system/dicts/data/search', (route) => fulfill(route, {
        total: 0,
        pageNo: 1,
        pageSize: 500,
        pages: 0,
        records: [],
    }));
    await page.route('**/admin/base/currencies/presentations', (route) => fulfill(route, []));
    await page.route('**/admin/settlement/batches/search', (route) => fulfill(route, {
        total: 1,
        pageNo: 1,
        pageSize: 10,
        pages: 1,
        records: [settlementBatch],
    }));
    await page.route(
        `**/admin/settlement/batches/${settlementBatch.settlementBatchNo}/summaries**`,
        (route) => fulfill(route, {
            total: 0,
            pageNo: 1,
            pageSize: 10,
            pages: 0,
            records: [],
        }),
    );
    await page.route('**/admin/settlement/batch-summaries/export-task', exportHandler);
}

function adminSession() {
    return {
        account: {
            accountId: 1,
            userId: 1,
            appCode: 'ADMIN',
            loginAccount: 'scott',
            realName: 'Scott',
            status: 1,
        },
        roles: ['SUPER_ADMIN'],
        permissions: [
            'settlement:batch:list',
            'settlement:batch:summary:list',
            'settlement:batch:summary:export',
        ],
        menus: [],
    };
}

async function fulfill(route: Route, data: unknown) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'T200', message: 'SUCCESS', data }),
    });
}
