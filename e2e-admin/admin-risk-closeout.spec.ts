import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const batchNo = 'RISK-BLACK-email-qa0123456789';
const pageErrors = new WeakMap<Page, string[]>();
test.afterEach(async ({ page }) => expect(pageErrors.get(page) || []).toEqual([]));
const modules = [
    { path: '/risk/blacklist/email', component: 'risk/list', prefix: 'risk:blacklist:email', module: 'BLACK', code: 'email' },
    { path: '/risk/rule/frequency', component: 'risk/rule', prefix: 'risk:rule:frequency', module: 'RULE', code: 'frequency' },
];

for (const target of modules) {
    test(`${target.module} shows full-batch rollback, downloads all errors, and retries successfully`, async ({ page }) => {
        await setup(page, target);
        let attempts = 0;
        await page.route(`**/admin/risk/${target.module}/${target.code}/import`, async (route) => {
            attempts++;
            await new Promise((resolve) => setTimeout(resolve, 100));
            const data = attempts === 1
                ? { batchNo, totalCount: 12, rolledBack: true, successCount: 0, failureCount: 7,
                    errors: Array.from({ length: 5 }, (_, i) => `line ${i + 2}: invalid value`) }
                : { batchNo, totalCount: 12, rolledBack: false, successCount: 12, failureCount: 0, errors: [] };
            await route.fulfill({ json: { code: attempts === 1 ? 'F400' : 'T200', message: 'QA', data } });
        });
        await page.route(`**/admin/risk/imports/${batchNo}/failures`, (route) => route.fulfill({
            contentType: 'text/csv;charset=UTF-8',
            headers: { 'Content-Disposition': 'attachment; filename="qa-errors.csv"' },
            body: 'rowNo,errorMessage\r\n' + Array.from({ length: 7 }, (_, i) => `${i + 2},invalid value`).join('\r\n'),
        }));
        await page.goto(target.path);
        await page.getByRole('button', { name: '导入', exact: true }).click();
        const dialog = page.locator('.base-import-dialog');
        await dialog.locator('input[type="file"]').setInputFiles({ name: 'qa-risk.csv', mimeType: 'text/csv', buffer: Buffer.from('qa,test\n1,2') });
        await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
        await expect(dialog.getByText('校验失败，整批未导入', { exact: true })).toBeVisible();
        await expect(dialog.getByText('共 12 行，发现 7 行校验错误，本批成功写入 0 行。')).toBeVisible();
        await expect(dialog.getByText(batchNo, { exact: false })).toBeVisible();
        await expect(dialog.locator('.base-import-dialog__errors li')).toHaveCount(5);
        await expect(dialog.getByText('还有 2 条失败原因，请下载明细查看。')).toBeVisible();
        const downloadPromise = page.waitForEvent('download');
        await dialog.getByRole('button', { name: '下载失败明细', exact: true }).first().click();
        const download = await downloadPromise;
        const csv = await readFile((await download.path())!, 'utf8');
        expect(csv.trim().split(/\r?\n/)).toHaveLength(8);
        await dialog.getByRole('button', { name: /重新/ }).click();
        await dialog.locator('input[type="file"]').setInputFiles({ name: 'qa-corrected.csv', mimeType: 'text/csv', buffer: Buffer.from('qa,test\n1,2') });
        await dialog.getByRole('button', { name: '确认导入', exact: true }).click();
        await expect(dialog.getByText('导入完成 · 全部成功', { exact: true })).toBeVisible();
        expect(attempts).toBe(2);
        await expect(page.getByText('操作正在处理中，请勿重复提交。', { exact: true })).toHaveCount(0);
    });

    test(`${target.module} removes manual review from new configuration`, async ({ page }) => {
        await setup(page, target);
        await page.goto(target.path);
        await page.getByRole('button', { name: '新增', exact: true }).click();
        const dialog = page.getByRole('dialog');
        const actionField = dialog.locator('.el-form-item').filter({ hasText: '决策动作' });
        await actionField.locator('.el-select').click();
        await expect(page.getByRole('option', { name: '拒绝', exact: true })).toBeVisible();
        await expect(page.getByRole('option', { name: '通过', exact: true })).toBeVisible();
        await expect(page.getByRole('option', { name: /人工复核|REVIEW/ })).toHaveCount(0);
    });
}

test('import permission hides the entry when absent', async ({ page }) => {
    await setup(page, modules[0], false);
    await page.goto(modules[0].path);
    await expect(page.getByRole('button', { name: '新增', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '导入', exact: true })).toHaveCount(0);
});

async function setup(page: Page, target: typeof modules[number], canImport = true) {
    const errors: string[] = [];
    pageErrors.set(page, errors);
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', (route) => route.fulfill({ json: { code: 'T200', data: null } }));
    await page.route('**/admin/auth/me', (route) => route.fulfill({ json: { code: 'T200', data: {
        account: { accountId: 1, userId: 1, appCode: 'ADMIN', loginAccount: 'qa', realName: 'QA', status: 1 },
        roles: [], permissions: ['risk:access', `${target.prefix}:list`, `${target.prefix}:add`, `${target.prefix}:template`, ...(canImport ? [`${target.prefix}:import`] : [])],
        menus: [{ id: 100, parentId: 0, menuCode: 'qa_risk', menuName: '风控验收', menuType: 'MENU',
            routePath: target.path, componentPath: target.component, permissionCode: `${target.prefix}:list`,
            visible: 1, keepAlive: 0, externalLink: 0, sortNo: 1, children: [] }],
    } } }));
    await page.route('**/admin/risk/options', (route) => route.fulfill({ json: { code: 'T200', data: {
        statusOptions: [{ label: '停用', value: '0' }], merchantScopeOptions: [{ label: '全局风控', value: 'GLOBAL' }],
        riskLevelOptions: [{ label: '高风险', value: 'HIGH' }],
        // 模拟旧服务响应，前端也必须隐藏 REVIEW，避免分批发布时重新露出。
        decisionActionOptions: [{ label: '通过', value: 'PASS' }, { label: '拒绝', value: 'REJECT' }, { label: '人工复核', value: 'REVIEW' }],
        cardBrandOptions: [], countryOptions: [], currencyOptions: [], limitTypeOptions: [], validityTypeOptions: [], sourceTypeOptions: [],
    } } }));
    await page.route('**/admin/risk/**/page', (route) => route.fulfill({ json: { code: 'T200', data: { records: [], total: 0, pageNo: 1, pageSize: 10 } } }));
    await page.route('**/admin/**/search', (route) => route.fulfill({ json: { code: 'T200', data: { records: [], total: 0, pageNo: 1, pageSize: 500 } } }));
    await page.route('**/admin/channel/info/options', (route) => route.fulfill({ json: { code: 'T200', data: [] } }));
    await page.route('**/admin/merchants/search', (route) => route.fulfill({ json: { code: 'T200', data: { records: [], total: 0 } } }));
}
