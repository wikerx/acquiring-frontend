import { expect, test, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { verifyDictionaryLoading } from '../e2e-support/dictionary-loading';

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
    channelMatchStatus: 'NOT_REQUIRED',
    reconciliationStatus: 'NOT_RECONCILED',
    settlementStatus: 'NOT_SETTLED',
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

    await expect(drawer.locator('.transaction-stage-status-display[data-domain="settlement"][data-status="NOT_SETTLED"]')).toBeVisible();

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

for (const actionPermissions of [
    [],
    ['transaction:merchant-notification:retry'],
    ['transaction:merchant-notification:retry', 'transaction:match-abnormal:requery',
        'transaction:operation:refund', 'transaction:operation:capture', 'transaction:operation:void'],
]) {
    test(`keeps row actions compact and permission-scoped with ${actionPermissions.length} additional permissions`, async ({ page }) => {
        await page.setViewportSize({ width: 1366, height: 900 });
        await mockAdminApis(page, () => {}, actionPermissions);
        await page.goto('/transaction/operation');
        await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
        const actions = page.locator('tbody .table-row-actions').first();
        await expect(actions.getByRole('button', { name: '详情', exact: true })).toBeVisible();
        await expect(actions.locator('.table-row-actions__direct')).toHaveCount(1);
        const cell = actions.locator('xpath=ancestor::td');
        expect((await cell.boundingBox())!.width).toBeLessThanOrEqual(139);

        if (actionPermissions.length === 0) {
            await expect(actions.getByRole('button', { name: '更多', exact: true })).toHaveCount(0);
            return;
        }
        await actions.getByRole('button', { name: '更多', exact: true }).click();
        const items = page.getByRole('menuitem');
        const menu = page.getByRole('menu').filter({ has: page.getByRole('menuitem', { name: '重发回调', exact: true }) });
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('menuitem')).toHaveCount(actionPermissions.length === 5 ? 3 : actionPermissions.length);
        await expect(items.filter({ hasText: /^重发回调$/ })).toBeEnabled();
        if (actionPermissions.length === 5) {
            await expect(menu.getByRole('menuitem', { name: '退款', exact: true })).toBeEnabled();
            await expect(menu.getByRole('menuitem', { name: '勾兑', exact: true })).toBeDisabled();
            await expect(menu.getByRole('menuitem', { name: '请款', exact: true })).toHaveCount(0);
            await expect(menu.getByRole('menuitem', { name: '撤销', exact: true })).toHaveCount(0);
        } else {
            await expect(menu.getByRole('menuitem', { name: '退款', exact: true })).toHaveCount(0);
        }
        await expect(menu).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
    });
}

test('keeps permitted actions in the menu when transaction detail permission is absent', async ({ page }) => {
    await mockAdminApis(page, () => {}, ['transaction:operation:refund'], false);
    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    const actions = page.locator('tbody .table-row-actions').first();
    await expect(actions.getByRole('button', { name: '详情', exact: true })).toHaveCount(0);
    await expect(actions.locator('.table-row-actions__direct')).toHaveCount(0);
    await actions.getByRole('button', { name: '更多', exact: true }).click();
    const menu = page.getByRole('menu').filter({ has: page.getByRole('menuitem', { name: '退款', exact: true }) });
    await expect(menu.getByRole('menuitem')).toHaveCount(1);
    await expect(menu.getByRole('menuitem', { name: '退款', exact: true })).toBeEnabled();
});

test('loads transaction filters when the list and detail drawer request the same dictionaries concurrently', async ({ page }) => {
    await mockAdminApis(page, () => {});
    const requests: string[] = [];
    const warnings: string[] = [];
    page.on('console', (message) => {
        if (message.type() === 'warning') warnings.push(message.text());
    });
    await page.route('**/admin/system/dicts/data/search', async (route) => {
        const { dictType } = route.request().postDataJSON() as { dictType: string };
        requests.push(dictType);
        // 延迟响应，稳定复现列表与已挂载详情组件同时加载相同字典。
        await new Promise((resolve) => setTimeout(resolve, 120));
        const records = dictType === 'transaction_type'
            ? [{ id: 1, dictType, dictLabel: '支付', dictValue: 'PAYMENT', status: 1 }]
            : dictType === 'transaction_status'
                ? [{ id: 2, dictType, dictLabel: '成功', dictValue: 'SUCCESS', status: 1 }]
                : [];
        await fulfill(route, { total: records.length, pageNo: 1, pageSize: 500, pages: 1, records });
    });
    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    for (const [label, option] of [['交易类型', '支付'], ['交易状态', '成功']]) {
        const select = page.locator('.el-select').filter({ has: page.getByRole('combobox', { name: label, exact: true }) });
        await select.locator('.el-select__wrapper').click();
        await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible();
        await page.getByRole('option', { name: option, exact: true }).click();
    }
    const query = page.waitForRequest((request) => request.url().includes('/admin/transactions/operations/search-with-summary')
        && request.postDataJSON().transactionType === 'PAYMENT' && request.postDataJSON().transactionStatus === 'SUCCESS');
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    await query;
    expect(requests.filter((type) => type === 'transaction_type')).toHaveLength(1);
    expect(requests.filter((type) => type === 'transaction_status')).toHaveLength(1);
    expect(warnings.filter((message) => message.includes('dictionary unavailable'))).toEqual([]);
});

test('shares admin dictionary queries without caching completed results or failed requests', async ({ page }) => {
    await mockAdminApis(page, () => {});
    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    await verifyDictionaryLoading(page, 'admin');
});

test('renders all thirteen stage statuses with distinct assets, consistent dimensions and safe unknown values', async ({ page }) => {
    const matching = ['NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'MATCHED', 'MISMATCHED', 'FAILED', 'SETTLED', ''];
    const reconciliation = ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED', 'NOT_RECONCILED', 'RECONCILED', 'MISMATCHED', 'FAILED', ''];
    const settlement = ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED', 'NOT_SETTLED', 'SETTLING', 'UNRECOGNIZED', ''];
    const records = matching.map((status, index) => ({
        ...operation, transactionId: `${transactionId.slice(0, -2)}${String(index).padStart(2, '0')}`,
        channelMatchStatus: status, reconciliationStatus: reconciliation[index], settlementStatus: settlement[index],
    }));
    await mockAdminApis(page, () => {}, [], true, records);
    await page.goto('/transaction/operation');
    const assets = {
        matching: ['MATCH_NOT_REQUIRED', 'MATCH_UNMATCHED', 'MATCH_PENDING_REVIEW', 'MATCH_SUCCESS', 'MATCH_MISMATCH', 'MATCH_FAILED'],
        reconciliation: ['RECON_UNRECONCILED', 'RECON_RECONCILED', 'RECON_MISMATCH'],
        settlement: ['SETTLE_UNSETTLED', 'SETTLE_PROCESSING', 'SETTLE_SETTLED', 'SETTLE_FAILED'],
    };
    for (const [domain, expectedAssets] of Object.entries(assets)) {
        for (const [index, asset] of expectedAssets.entries()) {
            const row = page.locator('tbody tr').filter({ has: page.getByText(records[index].transactionId, { exact: true }) });
            const tag = row.locator(`.transaction-stage-status-display[data-domain="${domain}"]`);
            await expect(tag).toHaveCSS('height', '24px');
            await expect(tag).toHaveCSS('border-radius', '6px');
            await expect(tag).toHaveCSS('font-size', '12px');
            const expectedSvg = readFileSync(new URL(`../packages/shared/src/assets/transaction-icons/stages/${asset}.svg`, import.meta.url), 'utf8');
            const matchesAsset = await tag.locator('img').evaluate(async (image: HTMLImageElement, expected) => {
                const actual = image.src.startsWith('data:image/svg+xml,')
                    ? decodeURIComponent(image.src.slice(image.src.indexOf(',') + 1))
                    : await (await fetch(image.src)).text();
                const parser = new DOMParser();
                return parser.parseFromString(actual, 'image/svg+xml').documentElement.isEqualNode(
                    parser.parseFromString(expected, 'image/svg+xml').documentElement,
                );
            }, expectedSvg);
            expect(matchesAsset, `${domain} ${asset}`).toBe(true);
            await expect.poll(() => tag.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
        }
        const unknownRow = page.locator('tbody tr').filter({ has: page.getByText(records[6].transactionId, { exact: true }) });
        const unknown = unknownRow.locator(`.transaction-stage-status-display[data-domain="${domain}"]`);
        await expect(unknown).toHaveAttribute('data-semantic', 'neutral');
        await expect(unknown.locator('img')).toHaveCount(0);
        const emptyRow = page.locator('tbody tr').filter({ has: page.getByText(records[7].transactionId, { exact: true }) });
        await expect(emptyRow.locator(`.transaction-stage-status-display[data-domain="${domain}"]`)).toHaveText('-');
    }
    const mismatch = page.locator('tbody [data-domain="matching"][data-status="MISMATCHED"]');
    const failed = page.locator('tbody [data-domain="matching"][data-status="FAILED"]');
    await expect(mismatch).toHaveAttribute('data-semantic', 'mismatch');
    await expect(failed).toHaveAttribute('data-semantic', 'failed');
    await expect(mismatch).toHaveCSS('background-color', 'rgb(254, 242, 242)');
    await expect(failed).toHaveCSS('background-color', 'rgb(254, 242, 242)');
});

test('searches stage status options and submits original backend values, including clearing selected filters', async ({ page }) => {
    await mockAdminApis(page, () => {});
    await page.goto('/transaction/operation');
    await page.getByText('高级筛选', { exact: true }).click();
    const choices = [['勾兑状态', 'matching', '不一致'], ['对账状态', 'reconciliation', '不一致'], ['结算状态', 'settlement', '失败']];
    for (const [label, domain, text] of choices) {
        const select = page.locator('.transaction-stage-status-select').filter({ has: page.getByRole('combobox', { name: label, exact: true }) });
        await select.locator('.el-select__wrapper').click();
        await select.getByRole('combobox').fill(text);
        const id = await select.getByRole('combobox').getAttribute('aria-controls');
        const popup = page.locator(`[id="${id}"]`);
        await popup.getByRole('option', { name: text, exact: true }).click();
        await expect(select.locator(`[data-domain="${domain}"]`)).toHaveAttribute('data-semantic', domain === 'settlement' ? 'failed' : 'mismatch');
    }
    const query = page.waitForRequest((request) => request.url().includes('/admin/transactions/operations/search-with-summary')
        && request.postDataJSON().channelMatchStatus === 'MISMATCHED');
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    expect((await query).postDataJSON()).toMatchObject({ channelMatchStatus: 'MISMATCHED', reconciliationStatus: 'MISMATCHED', settlementStatus: 'FAILED' });
    for (const [label] of choices) {
        const select = page.locator('.transaction-stage-status-select').filter({ has: page.getByRole('combobox', { name: label, exact: true }) });
        await select.hover();
        await select.locator('.el-select__clear').click();
        await expect(select.locator('.transaction-stage-status-display')).toHaveCount(0);
    }
    const cleared = page.waitForRequest((request) => request.url().includes('/admin/transactions/operations/search-with-summary')
        && !request.postDataJSON().channelMatchStatus);
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    const values = (await cleared).postDataJSON();
    expect(values.channelMatchStatus).toBeUndefined();
    expect(values.reconciliationStatus).toBeUndefined();
    expect(values.settlementStatus).toBeUndefined();
});

test('only shows financial actions supported by each transaction type', async ({ page }) => {
    const cases = [
        { type: 'PAYMENT', labels: ['退款'] },
        { type: 'CAPTURE', labels: ['退款'] },
        { type: 'AUTHORIZATION', labels: ['请款', '撤销'] },
        { type: 'PRE_AUTHORIZATION', labels: ['预授权完成', '撤销'] },
        { type: 'PRE_AUTH_COMPLETION', labels: [] },
        { type: 'REFUND', labels: [] },
        { type: 'VOID', labels: [] },
        { type: 'PAYOUT', labels: [] },
        { type: 'UNKNOWN', labels: [] },
    ];
    const records = cases.map((item, index) => ({
        ...operation, transactionId: `${transactionId.slice(0, -2)}${String(index).padStart(2, '0')}`,
        transactionType: item.type,
    }));
    await mockAdminApis(page, () => {}, [
        'transaction:merchant-notification:retry', 'transaction:match-abnormal:requery',
        'transaction:operation:refund', 'transaction:operation:capture', 'transaction:operation:void',
    ], true, records);
    await page.goto('/transaction/operation');
    for (const [index, item] of cases.entries()) {
        const row = page.locator('tbody tr').filter({ has: page.getByText(records[index].transactionId, { exact: true }) });
        await row.getByRole('button', { name: '更多', exact: true }).click();
        const menu = page.getByRole('menu').filter({ has: page.getByRole('menuitem', { name: '重发回调', exact: true }) });
        await expect(menu).toBeVisible();
        for (const label of ['退款', '请款', '预授权完成', '撤销']) {
            await expect(menu.getByRole('menuitem', { name: label, exact: true })).toHaveCount(item.labels.includes(label) ? 1 : 0);
        }
        for (const label of item.labels) {
            await expect(menu.getByRole('menuitem', { name: label, exact: true })).toBeEnabled();
        }
        await expect(menu).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
    }
});

test('does not show an empty more menu when the permitted financial actions do not apply', async ({ page }) => {
    await mockAdminApis(page, () => {}, [
        'transaction:operation:refund', 'transaction:operation:capture', 'transaction:operation:void',
    ], true, [{ ...operation, transactionType: 'REFUND' }]);
    await page.goto('/transaction/operation');
    await expect(page.getByText(transactionId, { exact: true }).first()).toBeVisible();
    const actions = page.locator('tbody .table-row-actions').first();
    await expect(actions.getByRole('button', { name: '详情', exact: true })).toBeVisible();
    await expect(actions.getByRole('button', { name: '更多', exact: true })).toHaveCount(0);
    for (const label of ['退款', '请款', '撤销']) {
        await expect(actions.getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }
});

test('keeps supported financial actions disabled when status or available amounts prevent execution', async ({ page }) => {
    const cases = [
        { record: { ...operation, availableRefundAmount: '0' }, labels: ['退款'] },
        { record: { ...operation, transactionStatus: 'FAILED' }, labels: ['退款'] },
        { record: { ...operation, transactionType: 'AUTHORIZATION', availableCaptureAmount: '0', capturedAmount: '132.19' }, labels: ['请款', '撤销'] },
        { record: { ...operation, transactionType: 'PRE_AUTHORIZATION', transactionStatus: 'PENDING' }, labels: ['预授权完成', '撤销'] },
    ];
    const records = cases.map((item, index) => ({
        ...item.record, transactionId: `${transactionId.slice(0, -2)}${String(index).padStart(2, '0')}`,
    }));
    await mockAdminApis(page, () => {}, [
        'transaction:merchant-notification:retry', 'transaction:operation:refund',
        'transaction:operation:capture', 'transaction:operation:void',
    ], true, records);
    await page.goto('/transaction/operation');
    for (const [index, item] of cases.entries()) {
        const row = page.locator('tbody tr').filter({ has: page.getByText(records[index].transactionId, { exact: true }) });
        await row.getByRole('button', { name: '更多', exact: true }).click();
        const menu = page.getByRole('menu').filter({ has: page.getByRole('menuitem', { name: '重发回调', exact: true }) });
        for (const label of item.labels) {
            await expect(menu.getByRole('menuitem', { name: label, exact: true })).toBeDisabled();
        }
        await expect(menu).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
    }
});

test('keeps channel records open without periodically querying the list or transaction detail', async ({ page }) => {
    await page.clock.install();
    await mockAdminApis(page, () => {});
    const requestId = 'CR202611141800181810899';
    const operationPath = '/admin/transactions/operations/';
    const reads: string[] = [];
    page.on('request', (request) => {
        const path = new URL(request.url()).pathname;
        if (path === `${operationPath}search-with-summary` || path === `${operationPath}${transactionId}`) {
            reads.push(path);
        }
    });
    await page.route(`**/admin/transactions/operations/${transactionId}/detail-records?**`, (route) => fulfill(route, {
        total: 1, pageNo: 1, pageSize: 10, pages: 1,
        records: [{ recordType: 'CHANNEL_REQUEST', recordId: requestId, record: { requestId, transactionId } }],
    }));
    await page.goto('/transaction/operation');
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await drawer.getByRole('tab', { name: '渠道记录', exact: true }).click();
    const channelRecord = drawer.getByText(requestId, { exact: true }).first();
    await expect(channelRecord).toBeVisible();
    expect(reads).toEqual([`${operationPath}search-with-summary`, `${operationPath}${transactionId}`]);
    await page.clock.runFor(30000);
    expect(reads).toEqual([`${operationPath}search-with-summary`, `${operationPath}${transactionId}`]);
    await expect(channelRecord).toBeVisible();
});

test('distinguishes the callback event from its linked audit log', async ({ page }) => {
    await mockAdminApis(page, () => {});
    const callbackId = 'CCB202611141800181810899';
    const callbackLogId = 'CCL202611141800181810898';
    const attempt = { deliveryId: 'a'.repeat(32), receivedTime: '2026-11-14T18:03:12', signatureValid: true,
        acceptResult: 'DUPLICATE', httpStatus: 200, durationMillis: 35 };
    await page.route(`**/admin/transactions/operations/${transactionId}/detail-records/CHANNEL_CALLBACK_DELIVERY/${attempt.deliveryId}?**`, (route) => fulfill(route, {
        recordType: 'CHANNEL_CALLBACK_DELIVERY', recordId: attempt.deliveryId,
        record: { ...attempt, requestBodyMasked: '{"eventId":"scott-sent-event"}', responseBody: 'SUCCESS' },
    }));
    await page.route(`**/admin/transactions/operations/${transactionId}/detail-records?**`, (route) => fulfill(route, {
        total: 3, pageNo: 1, pageSize: 10, pages: 1,
        records: [
            { recordType: 'CHANNEL_CALLBACK_DELIVERY', recordId: attempt.deliveryId, payloadAvailable: true, record: attempt },
            { recordType: 'CHANNEL_CALLBACK', recordId: callbackId, payloadAvailable: false,
                record: { callbackId, callbackLogId, callbackStatus: 'IGNORED', transactionId } },
            { recordType: 'CHANNEL_CALLBACK_LOG', recordId: callbackLogId, payloadAvailable: true,
                record: { callbackLogId, transactionId } },
        ],
    }));
    await page.goto('/transaction/operation');
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await drawer.getByRole('tab', { name: '回调记录', exact: true }).click();
    const cards = drawer.getByRole('tabpanel', { name: '回调记录', exact: true }).locator('.record-card');
    await expect(cards).toHaveCount(3);
    await expect(drawer.getByText('IGNORED', { exact: true })).toHaveCount(0);
    const delivery = cards.nth(0);
    await expect(delivery.getByText('重复投递', { exact: true }).first()).toBeVisible();
    await delivery.getByRole('button', { name: '查看完整脱敏报文' }).click();
    await expect(delivery.getByText('渠道原始请求（已脱敏）', { exact: true })).toBeVisible();
    await expect(delivery.locator('pre').filter({ hasText: 'scott-sent-event' })).toBeVisible();
    await expect(delivery.locator('pre').filter({ hasText: /^SUCCESS$/ })).toBeVisible();
    await expect(cards.nth(1).locator('.record-card__identity')).toHaveText(`渠道回调业务${callbackId}`);
    await expect(cards.nth(1).locator('.record-list__empty-raw')).toHaveCount(0);
    await expect(cards.nth(2).locator('.record-card__identity')).toHaveText(`渠道回调日志${callbackLogId}`);
    await expect(cards.nth(2).getByRole('button', { name: '查看完整脱敏报文' })).toBeVisible();
});

test('shows unavailable review rejection as failed while preserving historical review and 3DS waiting', async ({ page }) => {
    await mockAdminApis(page, () => {});
    const flowEvents = [
        { flowEventId: 1, transactionId, eventType: 'RISK_CHECKED', eventStage: 'RISK', eventStatus: 'FAILED', riskDecision: 'REVIEW', eventContent: 'QA review rejected', eventTime: transactionDateTime },
        { flowEventId: 2, transactionId, eventType: 'RISK_CHECKED', eventStage: 'RISK', eventStatus: 'PENDING', riskDecision: 'REVIEW', eventContent: 'QA historical review', eventTime: transactionDateTime },
        { flowEventId: 3, transactionId, eventType: 'RISK_CHECKED', eventStage: 'RISK', eventStatus: 'PENDING', riskDecision: 'REQUIRE_3DS', eventContent: 'QA 3DS waiting', eventTime: transactionDateTime },
    ];
    await page.route(`**/admin/transactions/operations/${transactionId}/detail-records?**`, (route) => fulfill(route, {
        total: flowEvents.length, pageNo: 1, pageSize: 10, pages: 1,
        records: flowEvents.map((record) => ({ recordType: 'FLOW_EVENT', recordId: String(record.flowEventId), record })),
    }));
    await page.goto('/transaction/operation');
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    const drawer = page.getByRole('dialog', { name: '交易详情' });
    await drawer.getByRole('tab', { name: '流程时间轴', exact: true }).click();
    const events = drawer.locator('.transaction-flow__event');
    await expect(events.filter({ hasText: 'QA review rejected' })).toHaveClass(/is-danger/);
    await expect(events.filter({ hasText: 'QA historical review' })).toHaveClass(/is-warning/);
    await expect(events.filter({ hasText: 'QA 3DS waiting' })).toHaveClass(/is-warning/);
});

async function mockAdminApis(page: Page, captureDetailRequest: (url: string) => void,
    actionPermissions: string[] = [], includeDetailPermission = true, records = [operation]) {
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
        permissions: ['transaction:operation:list', 'clearing:record:detail',
            ...(includeDetailPermission ? ['transaction:operation:detail'] : []), ...actionPermissions],
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
        page: { total: records.length, pageNo: 1, pageSize: 10, pages: 1, records },
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
            settlementStatus: 'NOT_SETTLED',
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
