import { expect, test, type Page } from '@playwright/test';

const version = 'a'.repeat(32);
const channel = { id: 10, channelCode: 'CHANNEL_LOGO_QA', channelCnName: '渠道展示验收', channelEnName: 'Channel Display QA', logoVersion: version };
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Z4sAAAAASUVORK5CYII=', 'base64');
const targets = [
    ['channel/info', 'INFO', 'channel:info'], ['channel/capability', 'CAPABILITY', 'channel:capability'],
    ['channel/limit', 'LIMIT', 'channel:limit'], ['channel/mid', 'MID', 'channel:mid'],
    ['channel/merchant-mid-binding', 'MID_BINDING', 'channel:mid-binding'],
    ['channel/alert-rule', 'ALERT_RULE', 'channel:alert-rule'], ['channel/alert-event', 'ALERT_EVENT', 'channel:alert-event'],
    ['transaction/order', 'ORDER', 'transaction:order'], ['transaction/operation', 'OPERATION', 'transaction:operation'],
] as const;
const pageErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => expect(pageErrors.get(page) || []).toEqual([]));

for (const [component, scope, permission] of targets) {
    test(`${scope} uses bounded private logos in list and detail without configuration permission`, async ({ page }) => {
        const calls = await setup(page, component, permission);
        await page.goto(`/${component}`);
        const logo = page.locator('main .channel-display img.is-ready').first();
        await expect(logo).toBeVisible();
        await expect(logo).toHaveCSS('object-fit', 'contain');
        await expect(logo.locator('..')).toHaveCSS('width', '72px');
        await expect(logo.locator('..')).toHaveCSS('height', '28px');
        expect(await logo.getAttribute('src')).toMatch(/^blob:/);
        await openDetail(page);
        const detailLogo = page.getByRole('dialog').locator('.channel-display.is-detail img.is-ready').first();
        await expect(detailLogo).toBeVisible();
        await expect(detailLogo.locator('..')).toHaveCSS('width', '96px');
        await expect(detailLogo.locator('..')).toHaveCSS('height', '36px');
        expect(calls.logos.length).toBeGreaterThan(0);
        expect(calls.logos.every(url => new URL(url).searchParams.get('scope') === scope)).toBe(true);
        expect(calls.metadata.every(q => q.ids.length + q.codes.length <= 100)).toBe(true);
    });
}

test('keyboard focus reveals the localized name and supports image preview', async ({ page }) => {
    await setup(page, 'channel/info', 'channel:info');
    await page.goto('/channel/info');
    const frame = page.locator('main .channel-display__frame').first();
    await expect(frame.locator('img.is-ready')).toBeVisible();
    await frame.focus();
    await expect(page.getByRole('tooltip', { name: channel.channelCnName, exact: true })).toBeVisible();
    await frame.press('Enter');
    await expect(page.locator('.el-image-viewer__wrapper')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.el-image-viewer__wrapper')).toHaveCount(0);
});

test('locale change updates the channel tooltip without extra image reads', async ({ page }) => {
    const calls = await setup(page, 'channel/info', 'channel:info');
    await page.goto('/channel/info');
    const frame = page.locator('main .channel-display__frame').first();
    await expect(frame.locator('img.is-ready')).toBeVisible();
    await page.locator('.lang-trigger').click();
    await page.getByRole('menuitem', { name: /English/ }).click();
    await expect(frame).toHaveAttribute('aria-label', channel.channelEnName);
    await frame.focus();
    await expect(page.getByRole('tooltip', { name: channel.channelEnName, exact: true })).toBeVisible();
    expect(calls.logos).toHaveLength(1);
});

for (const mode of ['missing', 'denied', 'broken'] as const) {
    test(`${mode} channel images retain the original transaction text`, async ({ page }) => {
        await setup(page, 'transaction/operation', 'transaction:operation', mode);
        await page.goto('/transaction/operation');
        const fallback = page.locator('main .channel-display__fallback').first();
        await expect(fallback).toHaveText(channel.channelCode);
        await expect(page.locator('main .channel-display__frame')).toHaveCount(0);
        await openDetail(page);
        await expect(page.getByRole('dialog').locator('.channel-display__fallback').first()).toContainText(channel.channelCode);
    });
}

test('route candidate details reuse the same authorized channel identity', async ({ page }) => {
    await setup(page, 'channel/route', 'channel:route');
    await page.goto('/channel/route');
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
    await page.getByRole('tab', { name: /候选/ }).click();
    const logo = page.getByRole('dialog').locator('.channel-display img.is-ready').first();
    await expect(logo).toBeVisible();
    await expect(logo.locator('..')).toHaveCSS('width', '96px');
});

test('manual search during dictionary initialization is not submitted again on mount', async ({ page }) => {
    await setup(page, 'transaction/order', 'transaction:order');
    let releaseDictionaries!: () => void;
    let releaseSearch!: () => void;
    let searchStarted!: () => void;
    let dictionariesReturned!: () => void;
    const dictionariesReady = new Promise<void>(resolve => { releaseDictionaries = resolve; });
    const searchReady = new Promise<void>(resolve => { releaseSearch = resolve; });
    const started = new Promise<void>(resolve => { searchStarted = resolve; });
    const returned = new Promise<void>(resolve => { dictionariesReturned = resolve; });
    let searches = 0;
    let dictionaryResponses = 0;
    await page.route('**/admin/system/dicts/data/search', async route => {
        await dictionariesReady;
        const type = route.request().postDataJSON().dictType;
        const records = type === 'transaction_status'
            ? [{ dictLabel: '成功', dictValue: 'SUCCESS', status: 1, dictSort: 1 }] : [];
        await route.fulfill({ json: { code: 'T200', data: { records, total: records.length, pageNo: 1, pageSize: 500 } } });
        if (++dictionaryResponses === 6) dictionariesReturned();
    });
    await page.route('**/admin/transactions/orders/search-with-summary', async route => {
        searches++;
        searchStarted();
        await searchReady;
        await route.fulfill({ json: { code: 'T200', data: {
            page: { records: [], total: 0, pageNo: 1, pageSize: 10 },
            summary: { totalCount: 0, successCount: 0, failedCount: 0, processingCount: 0, capturedCount: 0,
                amountSummaries: [], successAmountSummaries: [], failedAmountSummaries: [], capturedAmountSummaries: [] },
        } } });
    });
    await page.goto('/transaction/order');
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    await started;
    releaseDictionaries();
    await returned;
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    releaseSearch();
    await expect(page.locator('main .el-loading-mask')).toHaveCount(0);
    expect(searches).toBe(1);
    await expect(page.getByText('操作正在处理中，请勿重复提交。', { exact: true })).toHaveCount(0);
});

async function setup(page: Page, component: string, permission: string, mode: 'normal' | 'missing' | 'denied' | 'broken' = 'normal') {
    const errors: string[] = [];
    pageErrors.set(page, errors);
    page.on('pageerror', error => errors.push(error.message));
    const calls = { metadata: [] as { ids: number[]; codes: string[] }[], logos: [] as string[] };
    const row = { ...channel, channelId: channel.id, channelName: channel.channelCnName,
        transactionId: 'QA202611170001', rootTransactionId: 'QA202611170001', latestTransactionId: 'QA202611170001',
        merchantId: '200045', merchantOrderId: 'QA-CHANNEL', merchantOrderNo: 'QA-CHANNEL',
        transactionType: 'PAYMENT', transactionStatus: 'SUCCESS', labelCurrency: 'USD', labelAmount: '12.34',
        transactionCurrency: 'USD', transactionAmount: '12.34', currencyExponent: 2, labelCurrencyExponent: 2,
        transactionDateTime: '2026-11-17T10:00:00', rootTransactionDateTime: '2026-11-17T10:00:00',
        ruleName: 'QA route', ruleCode: 'QA_ROUTE', transactionTypes: ['PAYMENT'], currencyCodes: ['USD'], cardBrands: ['VISA'],
        ruleType: 'FIXED', ruleStatus: component === 'channel/route' ? 'DRAFT' : 1, scopeType: 'GLOBAL', rulePriority: 1, version: 1,
        status: 1, businessType: 'ACQUIRING', paymentMethod: 'BANK_CARD', paymentBrand: 'VISA',
        supported: true, supportAcquiring: 1, supportPayout: 0, support3ds: 0, supportIncrementalAuthorization: 0,
        channelStatus: 1, capabilityStatus: 1, midStatus: 1, bindingStatus: 1,
        acquiringPaymentMethods: [], payoutPaymentMethods: [],
        candidates: [{ id: 1, channelId: channel.id, channelCode: channel.channelCode, channelName: channel.channelCnName, channelMidId: 1,
            paymentMethod: 'BANK_CARD', paymentBrand: 'VISA', enabled: true }],
    };
    const paged = { records: [row], total: 1, pageNo: 1, pageSize: 10, pages: 1 };
    const summary = { totalCount: 1, successCount: 1, failedCount: 0, processingCount: 0, capturedCount: 0,
        amountSummaries: [], successAmountSummaries: [], failedAmountSummaries: [], capturedAmountSummaries: [], paymentMethodSummaries: [] };
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', async route => {
        const url = new URL(route.request().url());
        const path = url.pathname;
        const reply = (data: unknown) => route.fulfill({ json: { code: 'T200', data } });
        if (path === '/admin/auth/me') return reply({
            account: { accountId: 1, userId: 1, appCode: 'ADMIN', loginAccount: 'qa', realName: 'QA', status: 1 },
            roles: [], permissions: [`${permission}:list`, `${permission}:detail`],
            menus: [{ id: 1, parentId: 0, menuCode: 'qa_channel', menuName: '渠道展示验收', menuType: 'MENU',
                routePath: `/${component}`, componentPath: component, permissionCode: `${permission}:list`,
                visible: 1, keepAlive: 0, externalLink: 0, sortNo: 1, children: [] }],
        });
        if (path === '/admin/channel/presentation/search') {
            calls.metadata.push(route.request().postDataJSON());
            if (mode === 'denied') return route.fulfill({ json: { code: 'F403', message: 'Forbidden', data: null } });
            return reply(mode === 'missing' ? [] : [channel]);
        }
        if (/\/admin\/channel\/presentation\/\d+\/logo$/.test(path)) {
            calls.logos.push(url.toString());
            return route.fulfill({ contentType: 'image/png', body: mode === 'broken' ? Buffer.from('invalid image') : png });
        }
        if (path === '/admin/channel/info/options') return reply([channel]);
        if (path === '/admin/channel/alert-rules/options') return reply({ paymentMethods: [], cardBrands: [], userEmails: [], emailTemplates: [] });
        if (path.includes('/system/dicts/') || path.includes('/merchants/search') || path.includes('/base/') || path.endsWith('/change-logs/search')) {
            return reply(path.endsWith('/search') || path.endsWith('/list') ? { ...paged, records: [], total: 0 } : []);
        }
        if (path.endsWith('/search-with-summary')) return reply({ page: paged, summary });
        if (path.endsWith('/search')) return reply(paged);
        if (/\/admin\/transactions\/(operations|orders)\/[^/]+$/.test(path)) {
            return reply({ order: row, operations: [row], statusHistory: [], flowEvents: [], riskEvents: [], amountChanges: [] });
        }
        if (/\/admin\/channel\/[^/]+\/\d+$/.test(path)) return reply(row);
        return reply(null);
    });
    return calls;
}

async function openDetail(page: Page) {
    if ((page.viewportSize()?.width || 0) < 640 && await page.locator('.transaction-operation-page').count()) {
        // 使用现有收起筛选入口，让窄屏详情操作在表格区域完成。
        await page.locator('.transaction-result-bar__toolbar .el-button.is-circle').first().click();
    }
    await page.getByRole('button', { name: '详情', exact: true }).first().click();
}
