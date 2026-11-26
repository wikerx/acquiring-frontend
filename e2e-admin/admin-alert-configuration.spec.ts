import { basename, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { mockDisputeAlertApi } from './dispute-alert-api-fixture';
import { expect, test, type Locator, type Page } from '@playwright/test';
import {
    alertConfigurationCatalog,
    alertConfigurationMenus,
    alertPlatformPermissions,
    disputeAlertPermissions,
} from '../apps/admin-system/src/views/channel/dispute-alert/menu';

const allPermissions = [
    ...Object.values(alertPlatformPermissions),
    ...Object.values(disputeAlertPermissions),
];
const roleListPermission = 'system:role:list';
const deductionListPermission = 'fund:deduction:list';

async function setUpAdmin(page: Page, permissions: readonly string[] = allPermissions) {
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', (route) => route.fulfill({
        json: { code: 'T200', message: 'SUCCESS', data: null },
    }));
    await page.route((url) => url.pathname === '/admin/risk/dispute-alert/platforms/card-brand-options', (route) => route.fulfill({
        json: {
            code: 'T200', message: 'SUCCESS', data: [
                { value: 'VISA', label: 'Visa', extraJson: '{"logoKey":"visa"}' },
                { value: 'MASTERCARD', label: 'Mastercard', extraJson: '{"logoKey":"mastercard"}' },
                { value: 'AMEX', label: 'American Express', extraJson: '{"logoKey":"americanExpress"}' },
                { value: 'JCB', label: 'JCB', extraJson: '{"logoKey":"jcb"}' },
                { value: 'INTERAC', label: 'Interac' },
                { value: 'UNKNOWN', label: 'Unknown' },
            ],
        },
    }));
    await mockDisputeAlertApi(page);
    await page.route('**/admin/auth/me', (route) => route.fulfill({
        json: {
            code: 'T200',
            message: 'SUCCESS',
            data: {
                account: {
                    accountId: 1, userId: 1, appCode: 'ADMIN',
                    loginAccount: 'reviewer', realName: 'Reviewer', status: 1,
                },
                roles: [],
                permissions,
                menus: [
                    {
                        id: 280, parentId: 0, menuCode: 'risk_center', menuName: '收单风控',
                        menuType: 'CATALOG', routePath: '/risk', children: [{
                            ...alertConfigurationCatalog, id: 283, parentId: 280, menuType: 'CATALOG', menuName: '拒付预警管理', children: [
                                { ...alertConfigurationMenus.platform, id: 281, parentId: 283, menuType: 'MENU', menuName: '预警平台管理', children: [] },
                                { ...alertConfigurationMenus.mid, id: 282, parentId: 283, menuType: 'MENU', menuName: '拒付预警配置', children: [] },
                            ],
                        }],
                    },
                    ...(permissions.includes(roleListPermission) ? [{
                        id: 20, parentId: 0, menuCode: 'admin_system_role_v3', menuName: '角色管理', menuType: 'MENU',
                        routePath: '/system/role', componentPath: 'system/role', permissionCode: roleListPermission, children: [],
                    }] : []),
                    ...(permissions.includes(deductionListPermission) ? [{
                        id: 30, parentId: 0, menuCode: 'admin_fund_deduction_v1', menuName: '账户扣减', menuType: 'MENU',
                        routePath: '/fund/deduction', componentPath: 'fund/deduction', permissionCode: deductionListPermission, children: [],
                    }] : []),
                ],
            },
        },
    }));
}

async function capture(page: Page, name: string) {
    const directory = process.env.ALERT_PREVIEW_EVIDENCE_DIR;
    if (!directory) return;
    await expect(page.locator('.el-drawer-fade-enter-active')).toHaveCount(0);
    await page.screenshot({ path: resolve(directory, name + '.png'), animations: 'disabled' });
}

function selectField(editor: Locator, label: string) {
    const fieldLabel = editor.page().locator('.el-form-item__label').filter({ hasText: new RegExp(`^${label}$`) });
    return editor.locator('.el-form-item').filter({ has: fieldLabel }).locator('.el-select__wrapper');
}

async function expectStandardRowActions(actions: Locator, count: number) {
    await expect(actions).toHaveCount(count);
    await expect.poll(() => actions.evaluateAll((buttons) => {
        const boxes = buttons.map((button) => button.getBoundingClientRect());
        return boxes.slice(1).every((box, index) => Math.abs(box.y - boxes[index].y) < 1
            && Math.round(box.x - boxes[index].right) === 12);
    })).toBe(true);
}

test('Verxa Shield sends keys only to the dedicated credentials endpoint and never stores them in the browser', async ({ page }) => {
    const clientErrors: string[] = [];
    page.on('pageerror', (error) => clientErrors.push(error.message));
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const riskMenu = page.getByRole('menuitem', { name: '收单风控', exact: true });
    const alertCatalog = riskMenu.getByRole('menuitem', { name: '拒付预警管理', exact: true });
    await expect(alertCatalog.getByRole('menuitem', { name: '拒付预警配置', exact: true })).toBeVisible();
    const platformRow = page.getByRole('row').filter({ hasText: 'Verxa Shield' });
    await expect(platformRow.getByRole('cell', { name: 'Verxa Shield', exact: true })).toHaveCSS('text-align', 'center');
    await expect(platformRow.locator('.tag-list')).toHaveCSS('justify-content', 'center');
    await capture(page, 'alert-platform');
    await page.getByRole('tab', { name: '接入账号' }).click();
    const accountRow = page.getByRole('row').filter({ hasText: 'Verxa Shield' }).filter({ hasText: 'Ethoca' });
    await expect(accountRow).toHaveCount(1);
    await expect(accountRow.getByRole('group', { name: 'Ethoca · 可用', exact: true })).toBeVisible();
    await expect(accountRow.getByRole('group', { name: 'RDR · 可用', exact: true })).toBeVisible();
    await expect(accountRow.getByRole('cell', { name: 'DEMO-MER-01', exact: true })).toHaveCSS('text-align', 'center');
    await capture(page, 'alert-accounts');
    await accountRow.getByRole('button', { name: '维护' }).click();

    const editor = page.getByRole('dialog', { name: '维护接入账号' });
    await expect(editor.getByRole('textbox')).toHaveCount(3);
    await expect(editor.getByRole('textbox', { name: '商户号' })).toHaveValue('DEMO-MER-01');
    await expect(editor.getByRole('textbox', { name: '公钥' })).toHaveValue('');
    await expect(editor.getByRole('textbox', { name: '私钥' })).toHaveValue('');
    await capture(page, 'verxa-shield-account');

    const samplePublic = 'FAKE-PUBLIC-EXAMPLE';
    const samplePrivate = 'FAKE-PRIVATE-EXAMPLE';
    const requestsWithFixture = new Set<string>();
    page.on('request', (request) => {
        const payload = request.postData() || '';
        if (payload.includes(samplePublic) || payload.includes(samplePrivate)) requestsWithFixture.add(request.url());
    });
    await expect(editor.getByRole('textbox', { name: '商户号' })).toBeDisabled();
    await editor.getByRole('textbox', { name: '公钥' }).fill(samplePublic);
    await editor.getByRole('textbox', { name: '私钥' }).fill(samplePrivate);
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor).toBeHidden();
    await accountRow.getByRole('button', { name: '维护' }).click();
    await expect(editor.getByRole('textbox', { name: '公钥' })).toHaveValue('');
    await expect(editor.getByRole('textbox', { name: '私钥' })).toHaveValue('');
    const persistedBrowserData = await page.evaluate(() =>
        JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage } }));
    expect(persistedBrowserData).not.toContain(samplePublic);
    expect(persistedBrowserData).not.toContain(samplePrivate);
    expect([...requestsWithFixture].map((url) => new URL(url).pathname)).toEqual(['/admin/risk/dispute-alert/accounts/1/credentials']);
    expect(clientErrors).toEqual([]);
});

test('the platform guide stays below the list and adapts to English and narrow screens', async ({ page }) => {
    const clientErrors: string[] = [];
    page.on('pageerror', (error) => clientErrors.push(error.message));
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 1360, height: 1240 });
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const guide = page.getByRole('region', { name: '拒付预警接入指南' });
    await expect(guide.getByRole('heading', { name: 'Ethoca Alerts', exact: true })).toBeVisible();
    await expect(guide.getByRole('heading', { name: /Verifi Rapid Dispute Resolution/ })).toBeVisible();
    await expect(guide.getByRole('heading', { name: 'Verifi CDRN', exact: true })).toBeVisible();
    await expect(guide.getByRole('heading', { name: 'Amex Inquiry', exact: true })).toBeVisible();
    await expect(guide.getByText(/当前渠道 MID 可绑定 Ethoca 和 RDR/)).toBeVisible();
    await expect(guide.getByRole('listitem')).toHaveCount(3);
    for (const logo of await guide.locator('img').all()) {
        await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    }
    const table = page.locator('[data-standard-table-key="channel-alert-platform"]');
    const tableBounds = await table.boundingBox();
    const guideBounds = await guide.boundingBox();
    expect(guideBounds!.y).toBeGreaterThan(tableBounds!.y + tableBounds!.height);
    expect(Math.abs(guideBounds!.width - tableBounds!.width)).toBeLessThanOrEqual(2);
    await capture(page, 'alert-platform-guide');

    const ethoca = guide.locator('details').filter({ hasText: 'Ethoca Alerts' });
    const flow = ethoca.getByRole('region', { name: '预警与反馈流转' });
    const outcome = ethoca.getByRole('button', { name: '提交 Outcome', exact: true });
    const receipt = ethoca.getByRole('button', { name: '返回逐笔回执', exact: true });
    const directory = process.env.ALERT_PREVIEW_EVIDENCE_DIR;
    await expect(flow).toBeHidden();
    await ethoca.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(outcome).toHaveAttribute('aria-pressed', 'true');
    await expect(outcome.locator('.flow-pulse')).toHaveCSS('animation-direction', 'reverse');
    await expect(flow.locator('.flow-pulse')).toHaveCount(1);
    await expect(ethoca.getByRole('heading', { name: '提交处理结果（Outcome）' })).toBeVisible();
    await expect(ethoca.getByText('商户侧 → Ethoca / 接入平台', { exact: true })).toBeVisible();
    await expect(ethoca.getByText(/实际退款状态/)).toBeVisible();
    await expect(ethoca.getByRole('link', { name: 'Mastercard Ethoca 结果反馈文档' })).toBeVisible();
    if (directory) await flow.screenshot({ path: resolve(directory, 'ethoca-outcome.png'), animations: 'disabled' });

    await receipt.press('Enter');
    await expect(receipt).toHaveAttribute('aria-pressed', 'true');
    const receiptPulse = receipt.locator('.flow-pulse');
    await expect(receiptPulse).toHaveCSS('animation-direction', 'normal');
    await expect(outcome.locator('.flow-pulse')).toHaveCount(0);
    await expect(outcome).toHaveAttribute('aria-pressed', 'false');
    await expect(ethoca.getByRole('heading', { name: '确认逐笔回执' })).toBeVisible();
    await expect(ethoca.getByText('Ethoca / 接入平台 → 商户侧', { exact: true })).toBeVisible();
    await expect(ethoca.getByText('失败 · 查看原因')).toBeVisible();
    if (directory) await flow.screenshot({ path: resolve(directory, 'ethoca-receipts.png'), animations: 'disabled' });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(receiptPulse).toBeHidden();
    await expect(receipt.locator('.flow-line')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });

    for (const [step, title] of [
        ['报告欺诈或争议', '发卡行提交预警信息'],
        ['核对与处置', '核对原交易并记录处置'],
        ['反馈发卡行', 'Ethoca 向发卡行反馈'],
        ['转送预警', '接收预警并登记'],
    ]) {
        await flow.getByRole('button', { name: step, exact: true }).click();
        await expect(flow.getByRole('heading', { name: title, exact: true })).toBeVisible();
    }
    await expect(flow.getByText('按协议确认送达')).toBeVisible();

    await guide.locator('summary').getByText(/Verifi Rapid Dispute Resolution/).click();
    const rdr = guide.getByRole('region', { name: 'RDR 规则判定与入账' });
    const matched = rdr.getByRole('button', { name: '命中 · 入账通知', exact: true });
    const unmatched = rdr.getByRole('button', { name: '未命中 · 退回', exact: true });
    await expect(matched).toHaveAttribute('aria-pressed', 'true');
    await expect(matched.locator('.flow-pulse')).toHaveCSS('animation-direction', 'normal');
    await expect(rdr.getByText(/TC15/)).toBeVisible();
    const decisionBranches = rdr.getByRole('listitem').filter({
        has: page.getByRole('button', { name: '命中 · 入账通知', exact: true }),
    });
    await expect(decisionBranches.getByRole('button', { name: '未命中 · 退回', exact: true })).toBeVisible();
    if (directory) await rdr.screenshot({ path: resolve(directory, 'rdr-flow.png'), animations: 'disabled' });
    await unmatched.press('Enter');
    await expect(unmatched.locator('.flow-pulse')).toHaveCSS('animation-direction', 'reverse');
    await expect(rdr.getByText('Visa / Verifi RDR → Visa 发卡行', { exact: true })).toBeVisible();
    await expect(rdr.getByText(/发卡行决定是否继续发起正式拒付/)).toBeVisible();
    await rdr.getByRole('button', { name: '运行预设规则' }).click();
    await expect(rdr.locator('.flow-pulse')).toHaveCount(0);
    await expect(rdr.getByText(/命中进入 3A/)).toBeVisible();

    await guide.locator('summary').getByText('Verifi CDRN', { exact: true }).click();
    const cdrn = guide.getByRole('region', { name: 'CDRN 案件流转与商户响应' });
    const respond = cdrn.getByRole('button', { name: '响应并反馈' });
    await expect(respond.locator('.flow-pulse')).toHaveCSS('animation-direction', 'reverse');
    await expect(cdrn.getByText('商户 / 运营 → Verifi CDRN', { exact: true })).toBeVisible();
    if (directory) await cdrn.screenshot({ path: resolve(directory, 'cdrn-flow.png'), animations: 'disabled' });
    await cdrn.getByRole('button', { name: '直接提交案件' }).click();
    await expect(cdrn.getByText(/开通 CDRN 无需先开通 RDR/)).toBeVisible();
    await cdrn.getByRole('button', { name: '核对并决定' }).click();
    await expect(cdrn.getByText('按支付渠道处理入账')).toBeVisible();

    await guide.locator('summary').getByText('Amex Inquiry', { exact: true }).click();
    const amex = guide.getByRole('region', { name: 'Amex Inquiry 查询与补证' });
    await expect(amex.getByRole('button', { name: '提交答复' }).locator('.flow-pulse')).toHaveCSS('animation-direction', 'reverse');
    await expect(amex.getByText('关联原案件编号')).toBeVisible();
    await amex.getByRole('button', { name: '发出 Inquiry' }).click();
    await expect(amex.getByText('以案件时限为准')).toBeVisible();
    if (directory) await amex.screenshot({ path: resolve(directory, 'amex-inquiry-flow.png'), animations: 'disabled' });
    const amexResult = amex.getByRole('button', { name: '更新案件结果' });
    await amexResult.click();
    await expect(amexResult.locator('.flow-pulse')).toHaveCSS('animation-direction', 'normal');
    await expect(amex.getByText(/未答复拒付/)).toBeVisible();

    await page.getByRole('tab', { name: '接入账号' }).click();
    await expect(guide).toHaveCount(0);
    await page.getByRole('tab', { name: '预警平台' }).click();
    await page.getByRole('button', { name: /简体中文/ }).click();
    await page.getByRole('menuitem', { name: /English/ }).click();
    const englishGuide = page.getByRole('region', { name: 'Dispute alert setup guide' });
    await expect(englishGuide.getByRole('heading', { name: 'Link the channel MID' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Source', exact: true })).toBeVisible();
    const englishRow = table.getByRole('row').filter({ hasText: 'Verxa Shield' });
    await expect(englishRow.getByRole('button', { name: 'Accounts', exact: true })).toBeVisible();
    await expectStandardRowActions(englishRow.getByRole('cell').last().getByRole('button'), 3);
    await capture(page, 'alert-platform-guide-en');

    await page.setViewportSize({ width: 390, height: 844 });
    const products = englishGuide.locator('article');
    await expect.poll(async () => {
        const first = await products.first().boundingBox();
        const last = await products.last().boundingBox();
        return Boolean(first && last && last.y >= first.y + first.height);
    }).toBe(true);
    await englishGuide.locator('summary').getByText('Ethoca Alerts', { exact: true }).click();
    const englishFlow = englishGuide.getByRole('region', { name: 'Alert and outcome flow' });
    await expect(englishFlow.getByRole('heading', { name: 'Submit the outcome' })).toBeVisible();
    await englishFlow.getByRole('button', { name: 'Return receipts' }).click();
    await expect(englishFlow.getByRole('heading', { name: 'Verify each submission result' })).toBeVisible();
    await expect(englishFlow.getByText('Failed · check reason')).toBeVisible();
    await englishGuide.locator('summary').getByText(/Verifi Rapid Dispute Resolution/).click();
    const englishRdr = englishGuide.getByRole('region', { name: 'RDR decisions and credits' });
    await englishRdr.getByRole('button', { name: 'No match · Decline' }).click();
    await expect(englishRdr.getByText(/957/)).toBeVisible();
    await englishGuide.locator('summary').getByText('Verifi CDRN', { exact: true }).click();
    await expect(englishGuide.getByRole('heading', { name: 'Submit the CDRN case response on time' })).toBeVisible();
    await englishGuide.locator('summary').getByText('Amex Inquiry', { exact: true }).click();
    await expect(englishGuide.getByRole('heading', { name: 'Submit the Inquiry response on time' })).toBeVisible();
    await expect.poll(() => englishGuide.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(clientErrors).toEqual([]);
    if (directory) {
        await page.setViewportSize({ width: 390, height: 1340 });
        await englishFlow.evaluate((element) => element.scrollIntoView({ block: 'center' }));
        await englishFlow.screenshot({ path: resolve(directory, 'ethoca-mobile.png'), animations: 'disabled' });
    }
});

test('deduction dialogs use the standard spacing between actions without submitting', async ({ page }) => {
    await setUpAdmin(page, [deductionListPermission, 'fund:deduction:add', 'fund:deduction:audit']);
    await page.route('**/admin/fund-accounts/deductions/search', (route) => route.fulfill({
        json: {
            code: 'T200', message: 'SUCCESS', data: {
                total: 1, records: [{
                    id: 1, deductionNo: 'DEMO-DEDUCTION', merchantId: 'DEMO-MERCHANT', merchantName: 'Demo merchant',
                    accountNo: 'DEMO-ACCOUNT', amount: '10.00', currency: 'USD', deductionCategory: 'ADJUSTMENT', deductionStatus: 'PENDING_AUDIT',
                }],
            },
        },
    }));
    const mutations: string[] = [];
    await page.route((url) => url.pathname.startsWith('/admin/fund-accounts/deductions') && !url.pathname.endsWith('/search'), async (route) => {
        if (route.request().method() !== 'GET') mutations.push(route.request().method());
        await route.abort();
    });
    await page.goto('/fund/deduction');
    await page.getByRole('button', { name: '扣减', exact: true }).click();
    const create = page.getByRole('dialog', { name: '新增账户扣减申请' });
    const checkFooter = async (dialog: Locator) => {
        const actions = dialog.locator('.dialog-footer').getByRole('button');
        await expect(actions).toHaveCount(2);
        await expect(actions.last()).toHaveText('取消');
        await expect.poll(async () => {
            const confirm = await actions.first().boundingBox();
            const cancel = await actions.last().boundingBox();
            return confirm && cancel ? Math.round(cancel.x - confirm.x - confirm.width) : null;
        }).toBe(12);
    };
    await checkFooter(create);
    await capture(page, 'deduction-dialog-footer');
    await create.getByRole('button', { name: '取消', exact: true }).click();
    await page.getByRole('row').filter({ hasText: 'DEMO-DEDUCTION' }).getByRole('button', { name: '审核', exact: true }).click();
    const audit = page.getByRole('dialog', { name: '审核账户扣减申请' });
    await checkFooter(audit);
    await audit.getByRole('button', { name: '取消', exact: true }).click();
    expect(mutations).toEqual([]);
});

test('MID settings filter channels, restrict available products and preserve eight-digit BIN as a string', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.mid.routePath);
    const rdrRow = page.getByRole('row').filter({ hasText: 'MID-DEMO-02' });
    await expect(rdrRow.getByRole('cell', { name: /SCOTT_CHANNEL_A \/ MID-DEMO-02/ })).toHaveCSS('text-align', 'center');
    await expect(rdrRow.locator('.alert-product--compact')).toHaveText('RDR');
    await capture(page, 'alert-mid-settings');
    await selectField(page.locator('.search-form'), '预警产品').click();
    await expect(page.getByRole('option', { name: 'Ethoca', exact: true })).toBeEnabled();
    await expect(page.getByRole('option', { name: 'RDR', exact: true })).toBeEnabled();
    for (const name of [/CDRN/, /Amex Inquiry/]) {
        const option = page.getByRole('option', { name });
        await expect(option).toBeDisabled();
        await expect(option).toContainText('暂未支持 MID 绑定');
    }
    await capture(page, 'alert-mid-product-filter');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '新增预警配置' }).click();
    const editor = page.getByRole('dialog', { name: '新增预警配置' });
    const channel = selectField(editor, '渠道');
    const mid = selectField(editor, '渠道MID');
    await expect(selectField(editor, '预警产品')).toContainText('请先选择渠道 MID');
    await channel.click();
    await page.getByRole('option', { name: 'DEMO_CHANNEL_B', exact: true }).click();
    await mid.click();
    await expect(page.getByRole('option', { name: /SCOTT_CHANNEL_A/ })).toHaveCount(0);
    await page.getByRole('option', { name: 'DEMO_CHANNEL_B / MID-DEMO-B01', exact: true }).click();
    await expect(selectField(editor, '预警产品')).toContainText('Ethoca');
    await channel.click();
    await page.getByRole('option', { name: 'SCOTT_CHANNEL_A', exact: true }).click();
    await expect(mid).not.toContainText('MID-DEMO-B01');
    await expect(editor.getByRole('heading', { name: '来源账号与开通' })).toHaveCount(0);
    await mid.click();
    await expect(page.getByRole('option', { name: /DEMO_CHANNEL_B/ })).toHaveCount(0);
    await page.getByRole('option', { name: 'SCOTT_CHANNEL_A / MID-DEMO-02' }).click();
    await selectField(editor, '预警产品').click();
    await expect(page.getByRole('option', { name: 'RDR', exact: true })).toBeVisible();
    const ethoca = page.getByRole('option', { name: /Ethoca/ });
    await expect(ethoca).toBeDisabled();
    await expect(ethoca).toContainText('当前 MID 无可用来源');
    await expect(page.getByRole('option', { name: /CDRN/ })).toContainText('暂未支持 MID 绑定');
    await capture(page, 'alert-mid-product-availability');
    await page.getByRole('option', { name: 'RDR', exact: true }).click();
    await selectField(editor, '来源账号').click();
    await page.getByRole('option', { name: /Verxa Shield/ }).click();
    await editor.getByRole('textbox', { name: '外部商户标识' }).fill('DEMO-MER-ADDED');
    await editor.getByRole('button', { name: '添加标识' }).click();
    await editor.getByRole('textbox', { name: /收单行$/ }).fill('DEMO-ACQUIRER');
    await editor.getByRole('textbox', { name: 'Visa 收单 BIN' }).fill('00000103');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.getByText(/须为 6 位或 8 位数字，并与 CAID 成对录入/)).toBeVisible();
    await editor.getByRole('textbox', { name: /CAID$/ }).fill('DEMO-CAID');
    await editor.getByRole('button', { name: '添加描述' }).click();
    await editor.getByRole('textbox', { name: '完整账单描述' }).fill('SCOTT*DEMO NEW');
    await selectField(editor, '上游开通状态').click();
    await page.getByRole('option', { name: '已确认', exact: true }).click();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.getByText('确认上游开通时，请填写开通依据。')).toBeVisible();
    await editor.getByRole('textbox', { name: '上游开通依据' }).fill('DEMO-UPSTREAM-01');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    const saved = page.getByRole('row').filter({ hasText: 'DEMO-MER-ADDED' });
    await expect(saved).toBeVisible();
    await saved.getByRole('button', { name: '详情' }).click();
    const detail = page.getByRole('dialog', { name: '详情' });
    await expect(detail.getByRole('textbox', { name: 'Visa 收单 BIN' })).toHaveValue('00000103');
    await expect(detail.getByText('草稿', { exact: true })).toBeVisible();
    const fieldPositions = await detail.locator('.form-grid').first().locator('.el-form-item').evaluateAll(items =>
        items.map(item => item.getBoundingClientRect().left));
    expect(new Set(fieldPositions).size).toBe(1);
    await capture(page, 'alert-mid-detail');

    await detail.getByRole('button', { name: '关闭', exact: true }).click();
    await saved.getByRole('button', { name: '修改', exact: true }).click();
    const edit = page.getByRole('dialog', { name: '编辑预警配置' });
    const scope = edit.getByRole('region', { name: '配置范围' });
    await expect(scope).toContainText('SCOTT_CHANNEL_A');
    await expect(scope).toContainText('MID-DEMO-02');
    await expect(edit.getByRole('heading', { name: '来源账号与开通' })).toBeVisible();
    await expect(edit.getByRole('heading', { name: '收单行标识' })).toBeAttached();
    await expect(edit.getByRole('heading', { name: '账单描述' })).toBeAttached();
    if (process.env.ALERT_PREVIEW_EVIDENCE_DIR) await expect(page.locator('.el-message')).toHaveCount(0);
    await capture(page, 'alert-mid-edit');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(async () => (await edit.boundingBox())?.width).toBeLessThanOrEqual(390);
    await expect(edit.getByRole('button', { name: '保存', exact: true })).toBeInViewport();
    await edit.getByRole('button', { name: '取消', exact: true }).click();
    await page.setViewportSize({ width: 1360, height: 900 });
    await saved.getByRole('button', { name: '启用', exact: true }).click();
    const confirm = page.getByRole('dialog', { name: '确定', exact: true });
    await confirm.getByRole('button', { name: '启用', exact: true }).click();
    await expect(saved.getByText('已启用', { exact: true })).toBeVisible();
});

test('credential maintenance and configurable routes respect the logged-in permissions', async ({ page }) => {
    await setUpAdmin(page, [alertPlatformPermissions.list, alertPlatformPermissions.account]);
    await page.goto(alertConfigurationMenus.platform.routePath);
    await expect(page.getByRole('button', { name: '新增平台' })).toHaveCount(0);
    await page.getByRole('tab', { name: '接入账号' }).click();
    await page.getByRole('row').filter({ hasText: 'Verxa Shield' }).filter({ hasText: 'Ethoca' })
        .getByRole('button', { name: '维护' }).click();
    const editor = page.getByRole('dialog', { name: '维护接入账号' });
    await expect(editor.getByText('当前账号没有维护凭据的权限。')).toBeVisible();
    await expect(editor.getByRole('textbox', { name: '私钥' })).toHaveCount(0);
    await page.goto(alertConfigurationMenus.mid.routePath);
    await expect(page).toHaveURL(/\/403$/);
});

test('Verxa Shield credential editor fits a narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 414, height: 896 });
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    await page.getByRole('tab', { name: '接入账号' }).click();
    await page.getByRole('row').filter({ hasText: 'Verxa Shield' }).filter({ hasText: 'Ethoca' })
        .getByRole('button', { name: '维护' }).click();
    const editor = page.getByRole('dialog', { name: '维护接入账号' });
    await expect(editor.getByRole('textbox', { name: '私钥' })).toBeVisible();
    const bounds = await editor.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds?.width).toBeLessThanOrEqual(414);
    await capture(page, 'verxa-shield-mobile');
});

test('English alert grants and account fields use localized labels while menu-only grants keep older assignments', async ({ page }) => {
    await setUpAdmin(page, [...allPermissions, roleListPermission, 'system:role:assign-menu', 'system:role:assign-permission']);
    const respond = (data: unknown) => ({ json: { code: 'T200', message: 'SUCCESS', data } });
    await page.route('**/admin/system/roles/search', (route) => route.fulfill(respond({
        total: 1, records: [{ roleId: 9, roleCode: 'QA_REVIEW', roleName: 'QA Review', status: 1, roleType: 'CUSTOM' }],
    })));
    await page.route('**/admin/system/roles/grant-tree', (route) => route.fulfill(respond({
        menus: [{
            ...alertConfigurationMenus.platform, menuId: 281, menuName: '预警平台管理', menuType: 'MENU', children: [{
                menuId: 283, parentId: 281, menuName: '凭据维护', menuType: 'BUTTON', permissionCode: alertPlatformPermissions.credential,
            }],
        }],
        permissions: [], checkedMenuIds: [90], checkedPermissionIds: [91],
    })));
    await page.route('**/admin/system/roles/menus/grant', (route) => route.fulfill(respond(null)));

    await page.goto(alertConfigurationMenus.platform.routePath);
    await page.getByRole('button', { name: /简体中文/ }).click();
    await page.getByRole('menuitem', { name: /English/ }).click();
    const riskMenu = page.getByRole('menuitem', { name: 'Acquiring Risk', exact: true });
    const alertCatalog = riskMenu.getByRole('menuitem', { name: 'Dispute Alert Management', exact: true });
    await expect(alertCatalog.getByRole('menuitem', { name: 'Dispute Alert Configuration', exact: true })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Supported card brands' })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Verxa Shield' })).toContainText('Alert aggregator');
    await page.getByRole('button', { name: 'Add platform', exact: true }).click();
    const platformEditor = page.getByRole('dialog', { name: 'Add platform' });
    await platformEditor.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(platformEditor.locator('.el-form-item').filter({ has: page.getByRole('textbox', { name: 'Platform name' }) })
        .locator('.el-form-item__error')).toHaveText('Enter the platform name.');
    await platformEditor.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.getByRole('tab', { name: 'Connection accounts' }).click();
    await page.getByRole('row').filter({ hasText: 'Verxa Shield' }).filter({ hasText: 'Ethoca' })
        .getByRole('button', { name: 'Maintain', exact: true }).click();
    const editor = page.getByRole('dialog', { name: 'Maintain connection account' });
    await expect(editor.getByRole('textbox', { name: 'Merchant number' })).toBeVisible();
    await expect(editor.getByRole('textbox', { name: 'Public key' })).toBeVisible();
    await expect(editor.getByRole('textbox', { name: 'Private key' })).toBeVisible();
    await expect(editor.getByRole('button', { name: 'Disable RDR' })).toBeVisible();
    await capture(page, 'verxa-shield-account-en');
    await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(editor).toBeHidden();

    await page.getByRole('menuitem', { name: 'Role Management' }).click();
    await page.getByRole('row').filter({ hasText: 'QA Review' }).getByRole('button', { name: 'Authorize' }).click();
    const authorization = page.getByRole('dialog', { name: 'Role Authorization' });
    const menu = authorization.getByRole('treeitem', { name: /Menu Alert Platform Management/ });
    const credential = authorization.getByRole('treeitem', { name: /Button Manage credentials/ });
    await menu.locator(':scope > .el-tree-node__content .el-checkbox__inner').click();
    await credential.locator(':scope > .el-tree-node__content .el-checkbox__inner').click();
    const saving = page.waitForRequest('**/admin/system/roles/menus/grant');
    await authorization.getByRole('button', { name: 'Confirm', exact: true }).click();
    const saved = (await saving).postDataJSON();
    expect(saved).toEqual({ roleId: 9, menuIds: expect.arrayContaining([90, 281, 283]) });
    expect(saved.menuIds).toHaveLength(3);
    await expect(authorization).toBeHidden();
});

test('platform type and card brand scope are maintained per product', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const platform = page.getByRole('row').filter({ hasText: 'Verxa Shield' });
    await expect(platform.getByRole('cell', { name: '聚合服务商', exact: true })).toBeVisible();
    await expect(platform.getByText('Ethoca 待确认', { exact: true })).toBeVisible();
    const chargeflow = page.getByRole('row').filter({ hasText: 'Chargeflow' });
    await expect(chargeflow.getByText('Ethoca 待确认', { exact: true })).toBeVisible();
    await expect(chargeflow.getByText('CDRN 待确认', { exact: true })).toBeVisible();
    await expect(chargeflow.getByText('RDR 待确认', { exact: true })).toHaveCount(0);
    await platform.getByRole('button', { name: '修改', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '编辑平台' });
    const brandSelect = (product: string) => editor.locator('.el-form-item')
        .filter({ hasText: product + ' 支持卡品牌' }).locator('.el-select__wrapper');
    await capture(page, 'alert-platform-product-brands');
    await brandSelect('RDR').click();
    await expect(page.getByRole('option', { name: 'Visa', exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: 'Mastercard', exact: true })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await brandSelect('Ethoca').click();
    await page.getByRole('option', { name: 'Mastercard', exact: true }).click();
    await page.keyboard.press('Escape');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(platform.getByLabel(/支持卡品牌: Mastercard, Visa/)).toBeVisible();
    await expect(platform.getByText('Ethoca 待确认', { exact: true })).toHaveCount(0);
});

test('each product on a shared account can be disabled and restored independently of its MID reference', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const account = page.getByRole('row').filter({ hasText: 'DEMO-MER-01' });
    const accountEditor = page.getByRole('dialog', { name: '维护接入账号' });
    const midEditor = page.getByRole('dialog', { name: '新增预警配置' });
    const openAccount = async () => {
        await page.getByRole('tab', { name: '接入账号' }).click();
        await account.getByRole('button', { name: '维护', exact: true }).click();
    };
    const openNewMid = async (mid: string) => {
        await page.getByRole('button', { name: '新增预警配置' }).click();
        await selectField(midEditor, '渠道MID').click();
        await page.getByRole('option', { name: 'SCOTT_CHANNEL_A / ' + mid, exact: true }).click();
    };
    await openAccount();
    await accountEditor.getByRole('button', { name: '停用 RDR', exact: true }).click();
    await accountEditor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(account.getByRole('group', { name: 'Ethoca · 可用', exact: true })).toBeVisible();
    await expect(account.getByRole('group', { name: 'RDR · 已停用', exact: true })).toBeVisible();

    await page.getByRole('menuitem', { name: '拒付预警配置' }).click();
    const savedRdr = page.getByRole('row').filter({ hasText: 'MID-DEMO-02' });
    await expect(savedRdr).toContainText('DEMO-MER-01');
    await expect(savedRdr).toContainText('来源产品不可用');
    await openNewMid('MID-DEMO-02');
    await expect(midEditor.getByText(/此渠道 MID 暂无可用预警来源/)).toBeVisible();
    await selectField(midEditor, '预警产品').click();
    const unavailableRdr = page.getByRole('option', { name: /RDR/ });
    await expect(unavailableRdr).toBeDisabled();
    await expect(unavailableRdr).toContainText('当前 MID 无可用来源');
    await page.keyboard.press('Escape');
    await midEditor.getByRole('button', { name: '取消', exact: true }).click();
    await expect(midEditor).toBeHidden();

    await openNewMid('MID-DEMO-01');
    await selectField(midEditor, '来源账号').click();
    await expect(page.getByRole('option', { name: /Verxa Shield \/ DEMO-MER-01/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Nuvei/ })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await midEditor.getByRole('button', { name: '取消', exact: true }).click();
    await expect(midEditor).toBeHidden();

    await page.getByRole('menuitem', { name: '预警平台管理' }).click();
    await openAccount();
    await accountEditor.getByRole('button', { name: '启用 RDR', exact: true }).click();
    await accountEditor.getByRole('button', { name: '保存', exact: true }).click();
    await page.getByRole('menuitem', { name: '拒付预警配置' }).click();
    await expect(savedRdr.getByText('来源产品不可用')).toHaveCount(0);
    await openNewMid('MID-DEMO-02');
    await selectField(midEditor, '来源账号').click();
    await expect(page.getByRole('option', { name: /Verxa Shield \/ DEMO-MER-01/ })).toBeVisible();
    await expect(page.getByRole('option', { name: /Austreme/ })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await midEditor.getByRole('button', { name: '取消', exact: true }).click();
    await expect(midEditor).toBeHidden();

    await page.getByRole('menuitem', { name: '预警平台管理' }).click();
    await openAccount();
    await accountEditor.getByRole('button', { name: '停用 Ethoca', exact: true }).click();
    await accountEditor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(account.getByRole('group', { name: 'Ethoca · 已停用', exact: true })).toBeVisible();
    await expect(account.getByRole('group', { name: 'RDR · 可用', exact: true })).toBeVisible();
    await page.getByRole('menuitem', { name: '拒付预警配置' }).click();
    const savedEthoca = page.getByRole('row').filter({ hasText: 'MID-DEMO-01' });
    await expect(savedEthoca).toContainText('DEMO-MER-01');
    await expect(savedEthoca).toContainText('来源产品不可用');
    await expect(savedRdr.getByText('来源产品不可用')).toHaveCount(0);
    await openNewMid('MID-DEMO-01');
    await expect(midEditor.getByText(/此渠道 MID 暂无可用预警来源/)).toBeVisible();
    await midEditor.getByRole('button', { name: '取消', exact: true }).click();
    await expect(midEditor).toBeHidden();

    await page.getByRole('menuitem', { name: '预警平台管理' }).click();
    await openAccount();
    await accountEditor.getByRole('button', { name: '启用 Ethoca', exact: true }).click();
    await accountEditor.getByRole('button', { name: '保存', exact: true }).click();
    await page.getByRole('menuitem', { name: '拒付预警配置' }).click();
    await expect(savedEthoca.getByText('来源产品不可用')).toHaveCount(0);
    await openNewMid('MID-DEMO-01');
    await selectField(midEditor, '来源账号').click();
    await expect(page.getByRole('option', { name: /Verxa Shield \/ DEMO-MER-01/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await midEditor.getByRole('button', { name: '取消', exact: true }).click();
    await expect(midEditor).toBeHidden();

    for (const product of ['Ethoca', 'RDR']) {
        await openNewMid('MID-DEMO-03');
        await selectField(midEditor, '预警产品').click();
        await page.getByRole('option', { name: product, exact: true }).click();
        await selectField(midEditor, '来源账号').click();
        await page.getByRole('option', { name: /Verxa Shield \/ DEMO-MER-01/ }).click();
        await midEditor.getByRole('textbox', { name: '外部商户标识' }).fill('DEMO-SHARED-' + product);
        await midEditor.getByRole('button', { name: '保存', exact: true }).click();
        await expect(midEditor).toBeHidden();
        const saved = page.getByRole('row').filter({ hasText: 'DEMO-SHARED-' + product });
        await expect(saved).toContainText('MID-DEMO-03');
        await expect(saved).toContainText('DEMO-MER-01');
        await expect(saved.locator('.alert-product--compact')).toHaveText(product);
    }
});

test('Verxa Shield accounts register without an environment field and can retry credentials on the saved draft', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    let accountCreations = 0;
    const submittedEnvironment: boolean[] = [];
    page.on('request', (request) => {
        if (request.method() !== 'POST' || new URL(request.url()).pathname !== '/admin/risk/dispute-alert/accounts') return;
        const input = request.postDataJSON();
        submittedEnvironment.push('environment' in input);
        if (input.merchantNumber === 'DEMO-MER-NEW') accountCreations++;
    });
    await page.route('**/admin/risk/dispute-alert/accounts/*/credentials', (route) => route.fulfill({
        json: { code: 'T400', message: '预警凭据加密失败，请联系管理员检查 Admin 的敏感字段加密配置', data: null },
    }), { times: 1 });
    await page.getByRole('tab', { name: '接入账号' }).click();
    await expect(page.getByRole('columnheader', { name: '环境', exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: '新增接入账号', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '新增接入账号' });
    await expect(editor.getByText('环境', { exact: true })).toHaveCount(0);
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.locator('.el-form-item').filter({ hasText: '预警平台' }).locator('.el-form-item__error')).toHaveText('请选择已启用的预警平台。');
    await editor.locator('.el-select__wrapper').first().click();
    await page.getByRole('option', { name: 'Verxa Shield', exact: true }).click();
    await editor.getByRole('textbox', { name: '商户号' }).fill('DEMO-MER-01');
    await editor.locator('.el-form-item').filter({ hasText: '账号产品' }).locator('.el-select__wrapper').click();
    await page.getByRole('option', { name: 'Ethoca', exact: true }).click();
    await page.getByRole('option', { name: 'RDR', exact: true }).click();
    await page.keyboard.press('Escape');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.getByText('此平台已有相同的上游账号')).toBeVisible();
    await editor.getByRole('button', { name: '启用 Ethoca', exact: true }).click();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(editor.locator('.el-form-item').filter({ has: page.getByRole('textbox', { name: '公钥' }) })
        .locator('.el-form-item__error')).toHaveText('请输入公钥。');
    await expect(editor.locator('.el-form-item').filter({ has: page.getByRole('textbox', { name: '私钥' }) })
        .locator('.el-form-item__error')).toHaveText('请输入私钥。');

    await editor.getByRole('textbox', { name: '商户号' }).fill('DEMO-MER-NEW');
    await editor.getByRole('textbox', { name: '公钥' }).fill('FAKE-PUBLIC-EXAMPLE');
    await editor.getByRole('textbox', { name: '私钥' }).fill('FAKE-PRIVATE-EXAMPLE');
    await editor.getByRole('button', { name: '启用 RDR', exact: true }).click();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    const savedDraft = page.getByRole('dialog', { name: '维护接入账号' });
    await expect(savedDraft.getByText(/预警凭据加密失败/)).toBeVisible();
    await expect(savedDraft.getByText('环境', { exact: true })).toHaveCount(0);
    await savedDraft.getByRole('button', { name: '保存', exact: true }).click();
    const added = page.getByRole('row').filter({ hasText: 'DEMO-MER-NEW' });
    expect(accountCreations).toBe(1);
    expect(submittedEnvironment).toEqual([false, false]);
    await expect(added).toHaveCount(1);
    await expect(added.getByRole('group', { name: 'Ethoca · 可用', exact: true })).toBeVisible();
    await expect(added.getByRole('group', { name: 'RDR · 可用', exact: true })).toBeVisible();
});

test('product logos retain their labels and platform logo can be saved and removed through the private image endpoint', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const nuveiProducts = page.getByRole('row').filter({ hasText: 'Nuvei' }).locator('.alert-product');
    const verifiProducts = page.getByRole('row').filter({ hasText: 'Chargeflow' }).locator('.alert-product');
    await expect(nuveiProducts).toHaveText(['Ethoca', 'RDR', 'Amex Inquiry']);
    await expect(verifiProducts).toHaveText(['Ethoca', 'RDR', 'CDRN']);
    const rdrLogo = await verifiProducts.nth(1).locator('img').getAttribute('src');
    expect(rdrLogo).toBeTruthy();
    await expect(verifiProducts.nth(2).locator('img')).toHaveAttribute('src', rdrLogo!);
    for (const logo of await nuveiProducts.locator('img').all()) {
        await expect.poll(() => logo.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
    }

    const platformTable = page.locator('[data-standard-table-key="channel-alert-platform"]');
    const headers = platformTable.getByRole('columnheader');
    await expect(headers.nth(0)).toHaveText('Logo');
    await expect(headers.nth(1)).toHaveText('平台名称');
    const productHeader = platformTable.getByRole('columnheader', { name: '支持产品' });
    const sourceHeader = platformTable.getByRole('columnheader', { name: '资料来源' });
    const operationsHeader = platformTable.getByRole('columnheader', { name: '操作' });
    await expect.poll(async () => {
        const source = await sourceHeader.boundingBox();
        const operations = await operationsHeader.boundingBox();
        return Boolean(source && operations && source.x + source.width <= operations.x + 1);
    }).toBe(true);
    await expect.poll(async () => (await productHeader.boundingBox())?.width).toBeLessThanOrEqual(234);

    const chargebackhit = platformTable.getByRole('row').filter({ hasText: 'Chargebackhit' });
    for (const value of ['Chargebackhit', 'CHARGEBACKHIT']) {
        const cell = chargebackhit.getByRole('cell', { name: value, exact: true });
        await expect(cell).toBeVisible();
        await expect.poll(() => cell.locator('.platform-identifier').evaluate((element) =>
            element.scrollWidth <= element.clientWidth && element.clientHeight <= parseFloat(getComputedStyle(element).lineHeight),
        )).toBe(true);
    }

    const row = platformTable.getByRole('row').filter({ hasText: 'Verxa Shield' });
    await expect(row.getByRole('cell').nth(0)).toHaveText('—');
    await expect(row.getByRole('cell').nth(1)).toHaveText('Verxa Shield');
    await expectStandardRowActions(row.getByRole('cell').last().getByRole('button'), 3);
    await row.getByRole('button', { name: '修改', exact: true }).click();
    const editor = page.getByRole('dialog');
    const upload = editor.locator('input[type="file"]');
    const fixture = process.env.ALERT_PLATFORM_LOGO_FILE || resolve('apps/admin-system/src/views/channel/dispute-alert/assets/ethoca.png');
    await upload.setInputFiles({ name: basename(fixture), mimeType: 'image/png', buffer: await readFile(fixture) });
    await expect(editor.getByText(basename(fixture), { exact: true })).toBeVisible();
    await capture(page, 'platform-logo-editor');
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    const logo = row.getByRole('cell').nth(0).getByRole('img', { name: '平台 Logo' });
    await expect(logo).toBeVisible();
    const firstVersion = await logo.getAttribute('src');
    expect(firstVersion).toMatch(/^blob:/);
    const thumbnail = await logo.boundingBox();
    expect(thumbnail?.width).toBeLessThanOrEqual(48);
    await logo.click();
    const imageViewer = page.locator('.el-image-viewer__wrapper');
    const enlargedLogo = imageViewer.locator('.el-image-viewer__img');
    await expect(enlargedLogo).toHaveAttribute('src', firstVersion!);
    await expect.poll(async () => (await enlargedLogo.boundingBox())?.width).toBeGreaterThan(thumbnail!.width * 2);
    await capture(page, 'alert-platform-logo-preview');
    await imageViewer.locator('.el-image-viewer__close').click();
    await expect(imageViewer).toBeHidden();

    await page.locator('.search-form .el-select__wrapper').first().click();
    await expect(page.getByRole('option', { name: 'Verxa Shield', exact: true }).locator('img')).toBeVisible();
    await page.keyboard.press('Escape');

    const searchForm = page.locator('.search-form');
    const guide = page.getByRole('region', { name: '拒付预警接入指南' });
    const availableWidth = page.locator('.app-container .el-tabs__header');
    for (const width of [2200, 2560]) {
        await page.setViewportSize({ width, height: 1080 });
        await expect.poll(async () => {
            const available = await availableWidth.boundingBox();
            const sections = await Promise.all([searchForm, platformTable, guide].map((element) => element.boundingBox()));
            return Boolean(available && sections.every((section) => section
                && Math.abs(section.x - available.x) <= 2
                && Math.abs(section.width - available.width) <= 2));
        }).toBe(true);
        await expect.poll(async () => (await sourceHeader.boundingBox())?.width).toBeLessThanOrEqual(80);
        await expect.poll(async () => {
            const product = await productHeader.boundingBox();
            const table = await platformTable.boundingBox();
            return Boolean(product && table && product.width <= table.width * 0.3);
        }).toBe(true);
        await expect.poll(() => guide.locator('article').evaluateAll((cards) =>
            new Set(cards.map((card) => card.getBoundingClientRect().top)).size,
        )).toBe(1);
    }
    await expect(chargebackhit.getByRole('cell', { name: 'CHARGEBACKHIT', exact: true })).toBeVisible();
    if (process.env.ALERT_PREVIEW_EVIDENCE_DIR) await expect(page.locator('.el-message')).toHaveCount(0);
    await capture(page, 'alert-platform-wide');

    await row.getByRole('button', { name: '修改', exact: true }).click();
    const replacement = resolve('apps/admin-system/src/views/channel/dispute-alert/assets/verifi.png');
    await upload.setInputFiles({ name: basename(replacement), mimeType: 'image/png', buffer: await readFile(replacement) });
    await expect(editor.getByText('verifi.png', { exact: true })).toBeVisible();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(logo).not.toHaveAttribute('src', firstVersion!);
    await expect(logo).toBeVisible();
    await capture(page, 'alert-logos');

    await row.getByRole('button', { name: '修改', exact: true }).click();
    await editor.getByRole('button', { name: '移除', exact: true }).click();
    await editor.getByRole('button', { name: '保存', exact: true }).click();
    await expect(logo).toHaveCount(0);
    await expect(row.getByRole('cell', { name: 'Verxa Shield', exact: true })).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await row.getByRole('button', { name: '修改', exact: true }).click();
    const picker = editor.locator('button').filter({ hasText: /^选择图片$/ });
    await picker.scrollIntoViewIfNeeded();
    await expect(picker).toBeInViewport();
    const bounds = await editor.boundingBox();
    expect(bounds?.width).toBeLessThanOrEqual(390);
});

test('a platform can be added with dictionary card brands, and the searchable platform dropdown uses all rows', async ({ page }) => {
    const dictionaryRequest = page.waitForRequest((request) => request.url().includes('/platforms/card-brand-options?locale=zh-CN'));
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    await dictionaryRequest;
    const platformFilter = page.locator('.search-form .el-select').first();
    const filter = platformFilter.getByRole('combobox');
    const openPlatformFilter = () => platformFilter.locator('.el-select__wrapper').click();
    await openPlatformFilter();
    await expect(page.getByRole('option')).toHaveText(['Verxa Shield', 'Austreme', 'Nuvei', 'Chargeflow', 'Chargebackhit']);
    await page.keyboard.press('Escape');

    const nuvei = page.getByRole('row').filter({ hasText: 'Nuvei' });
    const originalBrands = nuvei.locator('.scope-trigger');
    await expect(originalBrands.locator('.payment-logo-mark')).toHaveCount(3);
    await expect(originalBrands.locator('.scope-more')).toHaveCount(0);

    await page.getByRole('button', { name: '新增平台', exact: true }).click();
    const editor = page.getByRole('dialog', { name: '新增平台' });
    const field = (label: string) => editor.locator('.el-form-item').filter({ has: page.locator('.el-form-item__label').filter({ hasText: new RegExp('^' + label + '$') }) });
    const save = editor.getByRole('button', { name: '保存', exact: true });
    await save.click();
    await expect(field('平台编码').locator('.el-form-item__error')).toContainText('2–32');
    await expect(field('平台名称').locator('.el-form-item__error')).toHaveText('请输入平台名称。');
    await expect(field('平台类型').locator('.el-form-item__error')).toHaveText('请选择平台类型。');
    await expect(field('支持产品').locator('.el-form-item__error')).toHaveText('请选择至少一种支持的产品。');

    await editor.getByRole('textbox', { name: '平台编码' }).fill('VERXA_SHIELD');
    await save.click();
    await expect(field('平台编码').locator('.el-form-item__error')).toHaveText('该平台编码已有配置，请编辑已有记录。');
    await capture(page, 'alert-platform-field-errors');
    await editor.getByRole('textbox', { name: '平台编码' }).fill('NEW_PLATFORM_REVIEW');
    await expect(field('平台编码').locator('.el-form-item__error')).toHaveCount(0);
    await editor.getByRole('textbox', { name: '平台名称' }).fill('Brand review platform');
    await field('平台类型').locator('.el-select__wrapper').click();
    await page.getByRole('option', { name: '聚合服务商', exact: true }).click();

    await field('支持产品').locator('.el-select__wrapper').click();
    const ethoca = page.getByRole('option', { name: 'Ethoca', exact: true });
    await expect(ethoca.locator('img')).toBeVisible();
    for (const product of ['Ethoca', 'RDR', 'CDRN', 'Amex Inquiry']) {
        await page.getByRole('option', { name: product, exact: true }).click();
    }
    await page.keyboard.press('Escape');
    await expect(field('RDR 支持卡品牌')).toContainText('Visa');
    await expect(field('Amex Inquiry 支持卡品牌')).toContainText('American Express');

    await field('Ethoca 支持卡品牌').locator('.el-select__wrapper').click();
    const mastercard = page.getByRole('option').filter({ hasText: 'Mastercard' });
    await expect(mastercard.locator('[data-logo-key="mastercard"]')).toBeVisible();
    await expect(page.getByRole('option', { name: 'Unknown', exact: true })).toHaveCount(0);
    await mastercard.click();
    await page.getByRole('option').filter({ hasText: 'Visa' }).click();
    await page.getByRole('option').filter({ hasText: 'JCB' }).click();
    const interac = page.getByRole('option', { name: 'Interac', exact: true });
    await expect(interac).toBeVisible();
    await interac.click();
    await page.keyboard.press('Escape');
    await capture(page, 'alert-product-card-brand-linkage');
    await save.click();

    const added = page.getByRole('row').filter({ hasText: 'Brand review platform' });
    await expect(added.locator('.alert-product--compact')).toHaveCount(4);
    const brands = added.locator('.scope-trigger');
    await expect(brands.locator('.payment-logo-mark')).toHaveCount(3);
    await expect(brands.locator('.scope-more')).toHaveText('+2');
    await brands.hover();
    const popover = page.locator('.channel-payment-scope-popper:visible');
    await expect(popover.getByText('Interac', { exact: true })).toBeVisible();
    await expect(popover.getByText('American Express', { exact: true })).toBeVisible();
    await page.mouse.move(250, 180);
    await expect(popover).toBeHidden();
    if (process.env.ALERT_PREVIEW_EVIDENCE_DIR) await expect(page.locator('.el-message')).toHaveCount(0);
    await capture(page, 'alert-platform-compact-list');

    await openPlatformFilter();
    await expect(page.getByRole('option')).toHaveCount(6);
    await filter.fill('new_platform_review');
    await expect(page.getByRole('option')).toHaveText(['Brand review platform']);
    await page.getByRole('option', { name: 'Brand review platform' }).click();
    await page.getByRole('button', { name: '搜索', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'Verxa Shield' })).toHaveCount(0);
    await expect(added).toBeVisible();
});

test('status switches share confirmation and unvalidated provider accounts open configuration', async ({ page }) => {
    await setUpAdmin(page);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const platform = page.getByRole('row').filter({ hasText: 'Verxa Shield' });
    const platformSwitch = platform.getByRole('switch', { name: 'Verxa Shield 的平台状态' });
    const confirmation = page.getByRole('dialog', { name: '操作确认' });
    await expect(platformSwitch).toBeChecked();

    await platform.locator('.el-switch').click();
    await expect(confirmation).toContainText('确认要停用「Verxa Shield」吗？');
    await expect(platformSwitch).toBeChecked();
    await capture(page, 'alert-platform-status-confirm');
    await confirmation.getByRole('button', { name: '取消', exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(platformSwitch).toBeChecked();

    await platform.getByRole('button', { name: '停用', exact: true }).click();
    await expect(confirmation).toContainText('确认要停用「Verxa Shield」吗？');
    await confirmation.getByRole('button', { name: '停用', exact: true }).click();
    await expect(platformSwitch).not.toBeChecked();
    await expect(platform.getByRole('button', { name: '启用', exact: true })).toBeVisible();

    await platform.getByRole('button', { name: '接入账号', exact: true }).click();
    const account = page.getByRole('row').filter({ hasText: 'DEMO-MER-01' });
    const accountSwitch = account.getByRole('switch', { name: 'DEMO-MER-01 的接入状态' });
    await expect(page.getByRole('columnheader', { name: '账号状态', exact: true })).toBeVisible();
    await expect(accountSwitch).toBeChecked();
    await expect(account.getByRole('group', { name: 'Ethoca · 不可用', exact: true })).toBeVisible();
    await expect(account.getByRole('group', { name: 'RDR · 不可用', exact: true })).toBeVisible();
    await expect(account.getByText('平台已停用', { exact: true })).toBeVisible();
    if (process.env.ALERT_PREVIEW_EVIDENCE_DIR) await expect(page.locator('.el-message')).toHaveCount(0);
    await capture(page, 'alert-account-product-unavailable');
    await account.locator('.el-switch').click();
    await expect(confirmation).toContainText('确认要停用「DEMO-MER-01」吗？');
    await expect(accountSwitch).toBeChecked();
    await confirmation.getByRole('button', { name: '停用', exact: true }).click();
    await expect(accountSwitch).not.toBeChecked();

    await account.getByRole('button', { name: '启用', exact: true }).click();
    await expect(page.getByText('请先启用该平台，并为账号配置至少一个产品。')).toBeVisible();
    await expect(confirmation).toBeHidden();
    await expect(accountSwitch).not.toBeChecked();

    await page.getByRole('tab', { name: '预警平台', exact: true }).click();
    await platform.locator('.el-switch').click();
    await confirmation.getByRole('button', { name: '启用', exact: true }).click();
    await expect(platformSwitch).toBeChecked();

    await page.getByRole('tab', { name: '接入账号', exact: true }).click();
    await account.getByRole('button', { name: '启用', exact: true }).click();
    await confirmation.getByRole('button', { name: '启用', exact: true }).click();
    await expect(accountSwitch).toBeChecked();
    await expect(account.getByRole('group', { name: 'Ethoca · 可用', exact: true })).toBeVisible();
    await expect(account.getByRole('group', { name: 'RDR · 可用', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '重置', exact: true }).click();
    const draftOnly = page.getByRole('row').filter({ hasText: 'DEMO-SFTP' });
    await expect(draftOnly.getByText('暂无已启用产品', { exact: true })).toBeVisible();
    await draftOnly.getByRole('button', { name: '启用', exact: true }).click();
    const provider = page.getByRole('dialog', { name: '维护接入账号' });
    await expect(provider.getByText('待上游确认', { exact: true })).toBeVisible();
    await expect(confirmation).toBeHidden();
    await provider.getByRole('button', { name: '校验并启用', exact: true }).click();
    await expect(draftOnly.getByRole('switch')).toBeChecked();
    await expect(draftOnly.getByRole('group', { name: 'RDR · 草稿', exact: true })).toBeVisible();
    await expect(draftOnly.getByText('暂无已启用产品', { exact: true })).toBeVisible();
});

test('view-only alert roles see statuses without switches or status actions', async ({ page }) => {
    await setUpAdmin(page, [alertPlatformPermissions.list]);
    await page.goto(alertConfigurationMenus.platform.routePath);
    const platform = page.getByRole('row').filter({ hasText: 'Verxa Shield' });
    await expect(platform.getByText('已启用', { exact: true })).toBeVisible();
    await expect(platform.getByRole('switch')).toHaveCount(0);
    await expect(platform.getByRole('button', { name: '停用', exact: true })).toHaveCount(0);

    await platform.getByRole('button', { name: '接入账号', exact: true }).click();
    const account = page.getByRole('row').filter({ hasText: 'DEMO-MER-01' });
    await expect(account.getByRole('cell', { name: '已启用', exact: true })).toBeVisible();
    await expect(account.getByRole('switch')).toHaveCount(0);
    await expect(account.getByRole('button', { name: '停用', exact: true })).toHaveCount(0);
});

test.describe('provider account form', () => {
    test.describe.configure({ mode: 'parallel' });

    async function openProvider(page: Page, provider: string, identifier: string) {
        await setUpAdmin(page);
        await page.goto(alertConfigurationMenus.platform.routePath);
        await page.getByRole('tab', { name: '接入账号' }).click();
        await page.getByRole('button', { name: '新增接入账号', exact: true }).click();
        const drawer = page.getByRole('dialog', { name: '新增接入账号' });
        await selectField(drawer, '预警平台').click();
        await page.getByRole('option', { name: provider, exact: true }).click();
        await expect(drawer.getByText('账号基本信息')).toBeVisible();
        await drawer.getByRole('textbox', { name: '账号标识' }).fill(identifier);
        await selectField(drawer, '账号产品').click();
        await page.getByRole('option', { name: 'Ethoca', exact: true }).click();
        await page.keyboard.press('Escape');
        return drawer;
    }

    async function choose(drawer: Locator, field: string, option: string) {
        await selectField(drawer, field).click();
        await drawer.page().getByRole('option', { name: option, exact: true }).click();
    }

    async function reopen(page: Page, identifier: string) {
        await page.getByRole('row').filter({ hasText: identifier }).getByRole('button', { name: '维护', exact: true }).click();
        const drawer = page.getByRole('dialog', { name: '维护接入账号' });
        await expect(drawer.getByRole('textbox', { name: '账号标识' })).toHaveValue(identifier);
        return drawer;
    }

    test('Austreme can save a basic draft and leaves its pending SFTP fields optional', async ({ page }) => {
        const drawer = await openProvider(page, 'Austreme', 'AUSTREME-PREVIEW');
        await expect(drawer.getByText('待上游确认')).toBeVisible();
        await drawer.getByRole('button', { name: '保存草稿', exact: true }).click();
        await expect(drawer).toBeHidden();
        const saved = await reopen(page, 'AUSTREME-PREVIEW');
        await choose(saved, '交付方式', 'SFTP 文件交付');
        await choose(saved, '认证方式', 'SSH 私钥');
        await expect(saved.getByRole('textbox', { name: 'SFTP 主机' })).toHaveValue('');
        await expect(saved.getByRole('textbox', { name: 'SSH 私钥' })).toHaveValue('');
        await expect(page.locator('.el-message')).toHaveCount(0);
        await capture(page, 'provider-account-austreme');
        await saved.getByRole('button', { name: '校验并启用', exact: true }).click();
        await expect(saved).toBeHidden();
        await expect(page.getByRole('row').filter({ hasText: 'AUSTREME-PREVIEW' }).getByRole('switch')).toBeChecked();
    });

    test('Nuvei requires DMN credentials on activation and Outcome adds two merchant IDs', async ({ page }) => {
        const issues: string[] = [];
        page.on('pageerror', (error) => issues.push(error.message));
        const drawer = await openProvider(page, 'Nuvei', 'NUVEI-PREVIEW');
        await drawer.getByRole('button', { name: '保存草稿', exact: true }).click();
        await expect(drawer).toBeHidden();
        const saved = await reopen(page, 'NUVEI-PREVIEW');
        await choose(saved, '对接用途', '接收事件通知（DMN）');
        await page.getByRole('option', { name: '提交外部 Ethoca Outcome', exact: true }).click();
        await page.keyboard.press('Escape');
        await expect(saved.getByRole('textbox', { name: 'Merchant Site ID' })).toBeVisible();
        await saved.getByRole('button', { name: '校验并启用', exact: true }).click();
        await expect(saved.getByText('启用前请补齐此项。')).toHaveCount(5);
        await saved.getByRole('textbox', { name: 'Merchant ID', exact: true }).fill('NUVEI-MERCHANT-DEMO');
        await saved.getByRole('textbox', { name: 'Merchant Site ID' }).fill('NUVEI-SITE-DEMO');
        await saved.getByRole('textbox', { name: 'DMN 接收地址' }).fill('https://example.invalid/alerts/nuvei');
        await choose(saved, 'DMN 订阅事件', '外部 Ethoca 预警');
        await page.keyboard.press('Escape');
        await expect(saved.locator('.el-form-item__error')).toHaveText(['启用前请补齐此项。']);
        await expect(page.locator('.el-message')).toHaveCount(0);
        await capture(page, 'provider-account-nuvei');
        await saved.getByLabel('Merchant Secret Key', { exact: true }).fill('SYNTHETIC-NUVEI-SECRET');
        await saved.getByRole('button', { name: '启用 Ethoca', exact: true }).click();
        await saved.getByRole('button', { name: '校验并启用', exact: true }).click();
        await expect(saved).toBeHidden();
        const activated = await reopen(page, 'NUVEI-PREVIEW');
        await expect(activated.getByLabel('Merchant Secret Key', { exact: true })).toHaveValue('');
        await expect(activated.getByText('已登记', { exact: true })).toBeVisible();
        await expect(activated.getByRole('textbox', { name: 'Merchant Site ID' })).toHaveValue('NUVEI-SITE-DEMO');
        await expect(activated.getByRole('button', { name: '停用 Ethoca', exact: true })).toBeVisible();
        expect(issues).toEqual([]);
    });

    test('Chargeflow shows credentials for the selected contract and clears hidden key inputs', async ({ page }) => {
        const drawer = await openProvider(page, 'Chargeflow', 'CHARGEFLOW-PREVIEW');
        await choose(drawer, 'API 版本', '2025-04-01');
        await choose(drawer, '对接用途', 'API 接入（请求签名）');
        await page.keyboard.press('Escape');
        await expect(drawer.getByLabel('API Secret Key', { exact: true })).toBeVisible();
        await drawer.getByLabel('API Access Key', { exact: true }).fill('SYNTHETIC-ACCESS');
        await choose(drawer, 'API 版本', 'v3');
        await choose(drawer, '对接用途', 'API 接入');
        await page.getByRole('option', { name: 'Webhook 通知', exact: true }).click();
        await page.keyboard.press('Escape');
        await expect(drawer.getByLabel('v3 Bearer Key', { exact: true })).toBeVisible();
        await expect(drawer.getByLabel('v3 Webhook 签名密钥', { exact: true })).toBeVisible();
        await expect(drawer.getByLabel('API Access Key', { exact: true })).toHaveCount(0);
        await expect(drawer.locator('.el-form-item__error')).toHaveCount(0);
        await capture(page, 'provider-account-chargeflow');
        await choose(drawer, 'API 版本', '2025-04-01');
        await choose(drawer, '对接用途', 'API 接入（请求签名）');
        await page.keyboard.press('Escape');
        await expect(drawer.getByLabel('API Access Key', { exact: true })).toHaveValue('');
    });

    test('Chargebackhit hides saved credentials on desktop and fits the maintenance drawer on mobile', async ({ page }) => {
        const writes: { path: string; credentialsPresent: boolean }[] = [];
        page.on('request', (request) => {
            const path = new URL(request.url()).pathname;
            if (path.includes('/risk/dispute-alert/') && request.method() !== 'GET') {
                writes.push({ path, credentialsPresent: Boolean(request.postDataJSON()?.credentials) });
            }
        });
        const drawer = await openProvider(page, 'Chargebackhit', 'CHARGEBACKHIT-PREVIEW');
        await choose(drawer, '对接用途', 'Webhook 通知');
        await page.keyboard.press('Escape');
        await drawer.getByRole('button', { name: '校验并启用', exact: true }).click();
        await expect(drawer.getByText('启用前请补齐此项。')).toHaveCount(3);
        await drawer.getByRole('textbox', { name: '通知接收地址' }).fill('https://example.invalid/alerts/cbh');
        await drawer.getByLabel('Public Key（凭据标识）', { exact: true }).fill('SYNTHETIC-CBH-PUBLIC');
        await drawer.getByLabel('Secret Key', { exact: true }).fill('SYNTHETIC-CBH-SECRET');
        await drawer.getByRole('button', { name: '校验并启用', exact: true }).click();
        await expect(drawer).toBeHidden();
        const saved = await reopen(page, 'CHARGEBACKHIT-PREVIEW');
        await expect(saved.getByText('已登记', { exact: true })).toHaveCount(2);
        await expect(saved.getByLabel('Public Key（凭据标识）', { exact: true })).toHaveValue('');
        await expect(saved.getByLabel('Secret Key', { exact: true })).toHaveValue('');
        await expect(page.locator('.el-message')).toHaveCount(0);
        await capture(page, 'provider-account-chargebackhit');
        await page.setViewportSize({ width: 414, height: 896 });
        await expect.poll(() => saved.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
        await capture(page, 'provider-account-mobile');
        await saved.getByRole('button', { name: '校验并保存', exact: true }).click();
        await expect(saved).toBeHidden();
        expect(writes).toEqual([
            { path: '/admin/risk/dispute-alert/accounts/provider', credentialsPresent: true },
            { path: expect.stringMatching(/^\/admin\/risk\/dispute-alert\/accounts\/\d+\/provider$/), credentialsPresent: false },
        ]);
        expect(await page.evaluate(() => JSON.stringify([localStorage, sessionStorage]))).not.toContain('SYNTHETIC-CBH');
    });
});
