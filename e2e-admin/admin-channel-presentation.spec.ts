import { expect, test, type Page } from '@playwright/test';

const version = 'a'.repeat(32);
const channel = { id: 10, channelCode: 'CHANNEL_LOGO_QA', channelCnName: '渠道展示验收', channelEnName: 'Channel Display QA', channelName: '渠道展示验收', supportAcquiring: 1, supportPayout: 0, logoVersion: version };
const otherChannel = { ...channel, id: 20, channelCode: 'OTHER_QA_CHANNEL', channelCnName: '第二个测试渠道', channelName: '第二个测试渠道' };
const longMid = `QA-LONG-${'A'.repeat(100)}`;
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Z4sAAAAASUVORK5CYII=', 'base64');
const targets = [
    ['channel/info', 'INFO', 'channel:info'], ['channel/capability', 'CAPABILITY', 'channel:capability'],
    ['channel/limit', 'LIMIT', 'channel:limit'], ['channel/mid', 'MID', 'channel:mid'],
    ['channel/merchant-mid-binding', 'MID_BINDING', 'channel:mid-binding'],
    ['channel/alert-rule', 'ALERT_RULE', 'channel:alert-rule'], ['channel/alert-event', 'ALERT_EVENT', 'channel:alert-event'],
    ['transaction/order', 'ORDER', 'transaction:order'], ['transaction/operation', 'OPERATION', 'transaction:operation'],
    ['transaction/channel-callback', 'CHANNEL_CALLBACK', 'transaction:channel-callback'],
] as const;
const pageErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => expect(pageErrors.get(page) || []).toEqual([]));

test('alert rule shows enabled wallets for the selected channel with names and logos', async ({ page }) => {
    await setup(page, 'channel/alert-rule', 'channel:alert-rule', 'normal', ['channel:alert-rule:add']);
    await page.route('**/admin/channel/info/options', (route) =>
        route.fulfill({ json: { code: 'T200', data: [channel, otherChannel] } }));
    await page.route('**/admin/channel/alert-rules/options?*', (route) => {
        const id = new URL(route.request().url()).searchParams.get('channelId');
        const card = { businessType: 'ACQUIRING', paymentMethod: 'BANK_CARD', cardBrands: ['VISA'] };
        const wallets = ['APPLE_PAY', 'GOOGLE_PAY'].map((paymentMethod) => ({
            businessType: 'ACQUIRING', paymentMethod, cardBrands: [],
        }));
        return route.fulfill({ json: { code: 'T200', data: {
            paymentMethods: id === '20' ? [card, ...wallets] : [card], cardBrands: ['VISA'],
            userEmails: [], emailTemplates: [],
        } } });
    });
    await page.goto('/channel/alert-rule');
    await page.getByRole('button', { name: '新增', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const payments = dialog.getByRole('combobox', { name: /支付方式$/ });
    await payments.press('ArrowDown');
    const visa = page.getByRole('option', { name: /Visa/ });
    await expect(visa).toHaveText('Visa');
    await expect(page.getByRole('option', { name: /Apple Pay/ })).toHaveCount(0);
    await payments.press('Escape');
    await dialog.getByRole('combobox', { name: /渠道$/ }).press('ArrowDown');
    await page.getByRole('option', { name: /OTHER_QA_CHANNEL/ }).click();
    await payments.press('ArrowDown');
    for (const label of ['Apple Pay', 'Google Pay']) {
        const option = page.getByRole('option', { name: new RegExp(label) });
        await expect(option).toHaveText(label);
        await expect(option.getByRole('img', { name: label, exact: true })).toBeVisible();
    }
});

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

test('MID detail shows effective scope by method', async ({ page }) => {
    await setup(page, 'channel/mid', 'channel:mid');
    await page.goto('/channel/mid');
    await openDetail(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('按方式继承渠道能力', { exact: true })).toBeVisible();
    const apple = dialog.getByRole('row').filter({ has: page.getByRole('img', { name: 'Apple Pay', exact: true }) });
    const google = dialog.getByRole('row').filter({ has: page.getByRole('img', { name: 'Google Pay', exact: true }) });
    const visa = dialog.getByRole('row').filter({ has: page.getByRole('img', { name: 'Visa', exact: true }) });
    await expect(visa.getByText('美国', { exact: true })).toBeVisible();
    await expect(visa.getByText('DEU', { exact: true })).toHaveCount(0);
    await expect(visa.getByRole('cell', { name: /交易类型.*(PAYMENT|支付)/ })).toBeVisible();
    await expect(apple.getByRole('cell', { name: /USD$/ })).toHaveCount(2);
    await expect(apple.getByText('EUR', { exact: true })).toHaveCount(0);
    await expect(google.getByRole('cell', { name: /EUR$/ })).toHaveCount(2);
    await expect(google.getByText('USD', { exact: true })).toHaveCount(0);
    await expect.poll(() => dialog.evaluate((element) =>
        Math.abs(element.getBoundingClientRect().right - window.innerWidth))).toBeLessThan(2);
});

test('MID list shows the statement descriptor and reloads its MID selector for the chosen channel', async ({ page }) => {
    await setup(page, 'channel/mid', 'channel:mid');
    await page.goto('/channel/mid');
    const search = page.locator('.search-form');
    const channelSelect = search.getByRole('combobox', { name: '渠道', exact: true });
    const midSelect = search.getByRole('combobox', { name: '渠道MID', exact: true });
    await expect(page.getByRole('columnheader', { name: '账单描述' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'QA Statement Descriptor', exact: true })).toBeVisible();

    const scoped = page.waitForRequest((request) => request.url().endsWith('/admin/channel/mids/search')
        && request.postDataJSON().channelId === 10);
    await channelSelect.press('ArrowDown');
    await page.getByRole('option', { name: /CHANNEL_LOGO_QA/ }).click();
    expect((await scoped).postDataJSON().channelId).toBe(10);
    await midSelect.press('ArrowDown');
    const firstMid = page.getByRole('option', { name: /QA-MID-A/ });
    await expect(firstMid.locator('img')).toHaveClass(/is-ready/);
    await expect(firstMid).toHaveText('QA-MID-A');
    await firstMid.click();
    await expect(search.locator('.mid-query-option img')).toHaveClass(/is-ready/);

    await channelSelect.press('ArrowDown');
    const otherScope = page.waitForResponse((response) => response.url().endsWith('/admin/channel/mids/search')
        && response.request().postDataJSON().channelId === 20);
    await page.getByRole('option', { name: /OTHER_QA_CHANNEL/ }).click();
    await otherScope;
    await midSelect.press('ArrowDown');
    await expect(page.getByRole('option', { name: /QA-MID-B/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /QA-MID-A/ })).toHaveCount(0);
    await page.getByRole('option', { name: /QA-MID-B/ }).click();

    const exact = page.waitForRequest((request) => request.url().endsWith('/admin/channel/mids/search')
        && request.postDataJSON().channelMid === 'QA-MID-B');
    await search.getByRole('button', { name: '搜索', exact: true }).click();
    expect((await exact).postDataJSON()).toMatchObject({ channelId: 20, channelMid: 'QA-MID-B' });

    await search.getByRole('button', { name: '重置', exact: true }).click();
    await midSelect.fill('QA-LONG');
    const midForOtherChannel = page.getByRole('option', { name: `${longMid} · ${otherChannel.channelCode} (${otherChannel.channelName})`, exact: true });
    const longCode = midForOtherChannel.locator('.mid-query-option__code');
    await expect(longCode).toBeVisible();
    expect(await longCode.evaluate((element) => ({
        clipped: element.scrollWidth > element.clientWidth,
        overflow: getComputedStyle(element).textOverflow,
    }))).toEqual({ clipped: true, overflow: 'ellipsis' });
    await midForOtherChannel.click();
    await expect(search.locator('.mid-query-option')).toHaveAttribute('title', longMid);
    const fromGlobal = page.waitForRequest((request) => request.url().endsWith('/admin/channel/mids/search')
        && request.postDataJSON().channelMid === longMid);
    await search.getByRole('button', { name: '搜索', exact: true }).click();
    expect((await fromGlobal).postDataJSON()).toMatchObject({ channelId: 20, channelMid: longMid });
});

test('new acquiring MID preselects configured methods and allows deselection', async ({ page }) => {
    await setup(page, 'channel/mid', 'channel:mid', 'normal', ['channel:mid:add']);
    await page.goto('/channel/mid');
    await page.getByRole('button', { name: '新增', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: /渠道$/ }).press('ArrowDown');
    await page.getByRole('option', { name: new RegExp(channel.channelCode) }).click();
    await expect(dialog.getByRole('combobox', { name: /MCC$/ })).toBeVisible();
    await dialog.getByRole('combobox', { name: /支付方式$/ }).press('ArrowDown');
    const apple = page.getByRole('option', { name: /Apple Pay/ });
    const google = page.getByRole('option', { name: /Google Pay/ });
    const visa = page.getByRole('option', { name: /Visa/ });
    await expect(visa).toHaveAttribute('aria-selected', 'true');
    await expect(apple).toHaveAttribute('aria-selected', 'true');
    await expect(google).toHaveAttribute('aria-selected', 'true');
    await google.click();
    await expect(google).toHaveAttribute('aria-selected', 'false');
    await expect(dialog.getByText('按方式继承渠道能力', { exact: true })).toBeVisible();
    await expect(dialog.getByText('允许交易国家', { exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await dialog.getByRole('button', { name: '确定', exact: true }).click();
    await expect(dialog.getByText('请选择 4 位 MCC', { exact: true })).toBeVisible();
    await dialog.getByRole('textbox', { name: /渠道MID$/ }).fill('MID-QA-BRAND');
    await dialog.getByRole('combobox', { name: /MCC$/ }).press('ArrowDown');
    await page.getByRole('option', { name: /5311/ }).click();
    const saved = page.waitForRequest(request => request.url().endsWith('/admin/channel/mids')
        && request.method() === 'POST');
    await dialog.getByRole('button', { name: '确定', exact: true }).click();
    expect((await saved).postDataJSON()).toMatchObject({
        mcc: '5311', paymentMethodScope: 'BANK_CARD,APPLE_PAY', cardBrandScope: 'VISA',
    });
});

test('acquiring capability detail shows the configured country scope', async ({ page }) => {
    await setup(page, 'channel/capability', 'channel:capability');
    await page.goto('/channel/capability');
    await openDetail(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('允许交易国家', { exact: true })).toBeVisible();
    await expect(dialog.getByText('不限国家', { exact: true })).toBeVisible();
});

test('Visa filter and edit target only the Visa capability', async ({ page }) => {
    await setup(page, 'channel/capability', 'channel:capability', 'normal', ['channel:capability:edit']);
    await page.goto('/channel/capability');
    const search = page.locator('.search-form');
    await search.getByRole('combobox', { name: '支付方式', exact: true }).press('ArrowDown');
    await page.getByRole('option', { name: /Visa/ }).click();
    const filtered = page.waitForRequest(request => request.url().endsWith('/admin/channel/capabilities/search')
        && request.postDataJSON().cardBrand === 'VISA');
    await search.getByRole('button', { name: '搜索', exact: true }).click();
    expect((await filtered).postDataJSON()).toMatchObject({ paymentMethod: 'BANK_CARD', cardBrand: 'VISA' });
    const visaRow = page.getByRole('row').filter({ has: page.getByRole('img', { name: 'Visa', exact: true }) });
    await expect(visaRow.getByText('Visa', { exact: true })).toHaveCount(0);
    await visaRow.getByRole('button', { name: '修改', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: '修改支付能力' });
    await expect(dialog.getByRole('combobox', { name: /支付方式$/ })).toBeDisabled();
    await dialog.getByRole('combobox', { name: '允许交易国家', exact: true }).press('ArrowDown');
    await page.getByRole('option', { name: /USA/ }).click();
    await page.keyboard.press('Escape');
    const saved = page.waitForRequest(request => request.url().endsWith('/admin/channel/capabilities/10')
        && request.method() === 'PUT');
    await dialog.getByRole('button', { name: '确定', exact: true }).click();
    expect((await saved).postDataJSON()).toMatchObject({
        paymentMethods: ['BANK_CARD'], cardBrands: ['VISA'], allowedCountryScope: 'USA',
        defaultTransactionCurrency: 'USD',
    });
});

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

test('filters channel callbacks by stable codes and shows the verified payload and gateway response', async ({ page }) => {
    await setup(page, 'transaction/channel-callback', 'transaction:channel-callback', 'missing');
    await page.goto('/transaction/channel-callback');
    await expect(page.locator('main .channel-display__fallback')).toHaveText(channel.channelCnName);
    await page.getByRole('combobox', { name: '渠道', exact: true }).press('ArrowDown');
    await page.getByRole('option', { name: `${channel.channelCode} / ${channel.channelCnName}` }).click();
    await page.getByRole('combobox', { name: '回调状态', exact: true }).press('ArrowDown');
    await page.getByRole('option', { name: '未更新交易' }).click();
    const request = page.waitForRequest((candidate) => candidate.url().endsWith('/admin/transactions/channel-callbacks/search'));
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    expect((await request).postDataJSON()).toMatchObject({ channelCode: channel.channelCode, callbackStatus: 'IGNORED' });
    const event = page.getByRole('row').filter({ hasText: 'CCB-CHANNEL-QA' });
    await expect(event).toHaveCount(1);
    await expect(event.getByRole('cell', { name: '2', exact: true })).toBeVisible();
    await expect(event).toContainText('2026-11-17 10:00:10');
    await openDetail(page);
    const detail = page.getByRole('dialog', { name: '渠道回调详情' });
    await expect(detail).toHaveCSS('width', '1180px');
    await expect(detail.locator('.el-tag--info').filter({ hasText: '保留已有终态' })).toBeVisible();
    const deliveryRows = detail.locator('.callback-detail__deliveries .el-table__body tbody tr');
    await expect(deliveryRows).toHaveCount(2);
    await expect(deliveryRows.nth(0)).toContainText('首次受理');
    await expect(deliveryRows.nth(0)).toContainText('84 毫秒');
    await expect(deliveryRows.nth(1)).toContainText('重复投递');
    await expect(deliveryRows.nth(1)).toContainText('37 毫秒');
    for (const row of await deliveryRows.all()) {
        await expect(row.getByText('已通过', { exact: true })).toBeVisible();
        await expect(row.getByText('200', { exact: true })).toBeVisible();
        await expect(row.getByText('SUCCESS', { exact: true })).toBeVisible();
    }
    await expect(detail.getByText('渠道回调业务摘要（已验签）', { exact: true })).toBeVisible();
    await expect(detail.getByText('网关应答正文', { exact: true })).toBeVisible();
    await expect(detail.locator('pre').filter({ hasText: /^SUCCESS$/ })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(detail.getByText('网关应答正文', { exact: true })).toBeVisible();
    await expect.poll(async () => (await detail.boundingBox())?.width ?? Infinity).toBeLessThanOrEqual(390);
    await page.setViewportSize({ width: 1280, height: 720 });
    await deliveryRows.nth(1).locator('.el-table__expand-icon').click();
    const evidence = detail.locator('.callback-detail__evidence');
    await expect(evidence.getByText('渠道原始请求（已脱敏）', { exact: true })).toBeVisible();
    await expect(evidence.locator('pre').filter({ hasText: 'scott-sent-event' })).toBeVisible();
    await expect(evidence.locator('pre').filter({ hasText: /^SUCCESS$/ })).toBeVisible();
    const deliveryPanels = evidence.locator('.transaction-payload-blocks__section');
    const summaryPanels = detail.locator('.record-card .transaction-payload-blocks__section');
    await expect(deliveryPanels).toHaveCount(2);
    await expect(deliveryPanels.nth(0).locator('pre')).toHaveCSS('background-color', 'rgb(11, 17, 32)');
    await expect(summaryPanels.nth(0).locator('pre')).toHaveCSS('background-color', 'rgb(11, 17, 32)');
    await expect(evidence.getByRole('button', { name: '点击复制', exact: true })).toHaveCount(2);
    await page.setViewportSize({ width: 390, height: 844 });
    const firstPanel = await deliveryPanels.nth(0).boundingBox();
    const secondPanel = await deliveryPanels.nth(1).boundingBox();
    expect(firstPanel).not.toBeNull();
    expect(secondPanel).not.toBeNull();
    expect(secondPanel!.y).toBeGreaterThan(firstPanel!.y);
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

async function setup(page: Page, component: string, permission: string, mode: 'normal' | 'missing' | 'denied' | 'broken' = 'normal', extraPermissions: string[] = []) {
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
        callbackId: 'CCB-CHANNEL-QA', callbackLogId: 'CCL-CHANNEL-QA', callbackStatus: 'IGNORED',
        processResult: 'TERMINAL_IGNORED', signatureValid: true, deliveryCount: 2,
        callbackReceivedTime: '2026-11-17T10:00:00', latestDeliveryTime: '2026-11-17T10:00:10',
        ruleName: 'QA route', ruleCode: 'QA_ROUTE', transactionTypes: ['PAYMENT'], currencyCodes: ['USD'], cardBrands: ['VISA'],
        ruleType: 'FIXED', ruleStatus: component === 'channel/route' ? 'DRAFT' : 1, scopeType: 'GLOBAL', rulePriority: 1, version: 1,
        status: 1, businessType: 'ACQUIRING', paymentMethod: 'BANK_CARD', paymentBrand: 'VISA',
        supported: true, supportAcquiring: 1, supportPayout: 0, support3ds: 0, supportIncrementalAuthorization: 0,
        channelStatus: 1, capabilityStatus: 1, midStatus: 1, bindingStatus: 1,
        allowedCountryScope: 'ALL', defaultTransactionCurrency: 'USD',
        ...(component === 'channel/mid' ? { channelMid: 'QA-MID-A', statementDescriptor: 'QA Statement Descriptor', paymentCapabilities: [
            { paymentMethod: 'BANK_CARD', cardBrands: ['VISA'], transactionTypes: ['PAYMENT', 'AUTHORIZATION', 'CAPTURE', 'REFUND'], currencyCodes: ['USD', 'EUR', 'HKD'],
                defaultTransactionCurrency: 'USD', allowedCountryScope: 'USA,DEU', legacyAllowedCountryScope: 'USA,GBR', enabled: true },
            { paymentMethod: 'APPLE_PAY', cardBrands: [], transactionTypes: ['PAYMENT'], currencyCodes: ['USD'],
                defaultTransactionCurrency: 'USD', allowedCountryScope: 'ALL', enabled: true },
            { paymentMethod: 'GOOGLE_PAY', cardBrands: [], transactionTypes: ['PAYMENT'], currencyCodes: ['EUR'],
                defaultTransactionCurrency: 'EUR', allowedCountryScope: 'ALL', enabled: true },
        ] } : {}),
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
            roles: [], permissions: [`${permission}:list`, `${permission}:detail`, ...extraPermissions],
            menus: [{ id: 1, parentId: 0, menuCode: 'qa_channel', menuName: '渠道展示验收', menuType: 'MENU',
                routePath: `/${component}`, componentPath: component, permissionCode: `${permission}:list`,
                visible: 1, keepAlive: 0, externalLink: 0, sortNo: 1, children: [] }],
        });
        if (path === '/admin/channel/presentation/search') {
            calls.metadata.push(route.request().postDataJSON());
            if (mode === 'denied') return route.fulfill({ json: { code: 'F403', message: 'Forbidden', data: null } });
            return reply(mode === 'missing' ? [] : component === 'channel/mid' ? [channel, otherChannel] : [channel]);
        }
        if (/\/admin\/channel\/presentation\/\d+\/logo$/.test(path)) {
            calls.logos.push(url.toString());
            return route.fulfill({ contentType: 'image/png', body: mode === 'broken' ? Buffer.from('invalid image') : png });
        }
        if (path === '/admin/channel/info/options') return reply(component === 'channel/mid'
            ? [channel, otherChannel] : [channel]);
        if (path === '/admin/channel/mids/search' && component === 'channel/mid') {
            const request = route.request().postDataJSON();
            if (request.keyword === 'QA-LONG' && !request.channelId) {
                return reply({ ...paged, records: [
                    { ...row, channelMid: longMid },
                    { ...row, id: 20, channelId: 20, channelCode: otherChannel.channelCode, channelName: otherChannel.channelName, channelMid: longMid },
                ], total: 2 });
            }
            return reply(request.channelId === 20
                ? { ...paged, records: [{ ...row, id: 20, channelId: 20, channelCode: otherChannel.channelCode, channelName: otherChannel.channelName, channelMid: 'QA-MID-B' }] }
                : paged);
        }
        if (path === '/admin/channel/capabilities/country-options') return reply([{ chineseName: '美国', englishName: 'United States', alpha3Code: 'USA' }]);
        if (path === '/admin/channel/mids/mcc-options') return reply([{ code: '5311', nameCn: '百货商店', nameEn: 'Department Stores' }]);
        if (path === '/admin/channel/mids' && route.request().method() === 'POST') return reply({ ...row, ...route.request().postDataJSON() });
        if (path === '/admin/base/countries/list') return reply({ ...paged, records: [
            { chineseName: '美国', englishName: 'United States', alpha2Code: 'US', alpha3Code: 'USA', flagEmoji: '🇺🇸' },
        ] });
        if (path === '/admin/base/currencies/list') return reply({ ...paged, records: [{ alpha3Code: 'USD', chineseName: '美元', englishName: 'USD' }] });
        if (path === '/admin/system/dicts/data/search') {
            const options = {
                channel_business_type: [['ACQUIRING', '收单']],
                acquiring_payment_method: [['BANK_CARD', '银行卡'], ['APPLE_PAY', 'Apple Pay'], ['GOOGLE_PAY', 'Google Pay']],
                card_brand: [['VISA', 'Visa'], ['MASTERCARD', 'Mastercard']],
                transaction_type: [['PAYMENT', '支付'], ['AUTHORIZATION', '授权'], ['CAPTURE', '请款'], ['REFUND', '退款']],
            } as Record<string, string[][]>;
            const records = (options[route.request().postDataJSON().dictType] || [])
                .map(([dictValue, dictLabel]) => ({ dictValue, dictLabel, status: 1 }));
            return reply({ ...paged, records, total: records.length });
        }
        if (component === 'channel/capability' && path === '/admin/channel/capabilities/search') {
            const visa = { ...row, supportAcquiring: 1 };
            const records = route.request().postDataJSON().cardBrand === 'VISA'
                ? [visa] : [visa, { ...visa, id: 11, cardBrands: ['MASTERCARD'] }];
            return reply({ ...paged, records, total: records.length });
        }
        if (component === 'channel/mid' && path === '/admin/channel/capabilities/search') {
            return reply({ ...paged, records: row.paymentCapabilities, total: row.paymentCapabilities?.length });
        }
        if (path === '/admin/transactions/channel-callbacks/channel-options') return reply([row]);
        if (path === `/admin/transactions/channel-callbacks/${row.callbackId}`) return reply({
            callback: row,
            deliveries: {
                total: 2, pages: 1, pageNo: 1, pageSize: 20,
                records: [
                    { deliveryId: '1', receivedTime: row.callbackReceivedTime, signatureValid: true, acceptResult: 'ACCEPTED',
                        httpStatus: 200, responseBody: 'SUCCESS', durationMillis: 84 },
                    { deliveryId: '2', receivedTime: row.latestDeliveryTime, signatureValid: true, acceptResult: 'DUPLICATE',
                        httpStatus: 200, responseBody: 'SUCCESS', durationMillis: 37,
                        requestBodyMasked: '{"eventId":"scott-sent-event","status":"SUCCESS"}' },
                ],
            },
            log: {
                callbackLogId: row.callbackLogId,
                platformResponseCode: '200', platformResponseBody: 'SUCCESS',
                requestBodyJsonMasked: JSON.stringify({ length: 123, sha256: 'a'.repeat(64), verifiedFields: { channelTradeStatus: 'SUCCESS' } }),
            },
        });
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
