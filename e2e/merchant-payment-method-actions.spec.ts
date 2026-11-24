import { expect, test, type Page, type Route } from '@playwright/test';

const pagePath = '/merchant-info/payment-methods';
const permission = 'merchant:payment-method';
const rows = [
    { itemKey: 'CARD_BRAND:VISA', name: 'Visa', requestable: true },
    { itemKey: 'METHOD:PAYPAL', name: 'PayPal', requestable: true },
    { itemKey: 'METHOD:GOOGLE_PAY', name: 'Google Pay', requestable: true },
    {
        itemKey: 'CARD_BRAND:MASTERCARD', name: 'Mastercard', requestable: false,
        applicationItemId: '42', applicationVersion: '2', applicationStatus: 'APPROVED', authorizationStatus: 'ACTIVE',
    },
    {
        itemKey: 'CARD_BRAND:JCB', name: 'JCB', requestable: false,
        applicationItemId: '43', applicationVersion: '2', applicationStatus: 'RETURNED',
    },
];

test('keeps row actions useful and filters applications by the selected method', async ({ page }) => {
    const calls = await mockPaymentMethods(page, ['view', 'application:view', 'apply', 'resubmit', 'withdraw']);
    await page.goto(pagePath);

    await methodRow(page, 'Visa').getByRole('button', { name: '申请开通' }).click();
    const apply = page.getByRole('dialog', { name: '申请开通' });
    await expect(apply.getByRole('img', { name: 'Visa', exact: true })).toBeVisible();
    await expect(apply.getByText('CARD_BRAND:VISA', { exact: true })).toHaveCount(0);
    await apply.getByRole('button', { name: '取消' }).click();
    await expect(apply).not.toBeVisible();

    const returned = methodRow(page, 'JCB');
    await expect(returned.getByRole('button', { name: '补充后提交' })).toBeVisible();
    await expect(returned.getByRole('button', { name: '撤回' })).toBeVisible();
    await methodRow(page, 'Mastercard').getByRole('button', { name: '查看申请' }).click();
    await expect(page.getByRole('tab', { name: '申请记录' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('支付方式 · Mastercard', { exact: true })).toBeVisible();
    await expect.poll(() => calls.applicationKeys).toEqual(['CARD_BRAND:MASTERCARD']);
    expect(calls.submissions).toEqual([]);
});

test('shows readable batch selections and submits their original keys', async ({ page }) => {
    const calls = await mockPaymentMethods(page, ['view', 'apply']);
    await page.goto(pagePath);
    await page.getByRole('columnheader', { name: '选择本页可申请项' }).locator('label').click();
    await page.getByRole('tabpanel', { name: '支付方式' }).getByRole('button', { name: '申请开通' }).first().click();
    const apply = page.getByRole('dialog', { name: '申请开通' });
    for (const name of ['Visa', 'PayPal', 'Google Pay']) {
        await expect(apply.getByRole('img', { name, exact: true })).toBeVisible();
    }
    await expect(apply.getByText(/CARD_BRAND:|METHOD:/)).toHaveCount(0);
    const fits = await apply.locator('.command-method').evaluateAll(items => items.every(item =>
        item.getBoundingClientRect().right <= innerWidth && item.getBoundingClientRect().left >= 0));
    expect(fits).toBe(true);
    await apply.getByRole('button', { name: '确认' }).click();
    await expect.poll(() => calls.submissions).toEqual([['CARD_BRAND:VISA', 'METHOD:PAYPAL', 'METHOD:GOOGLE_PAY']]);
});

test('shows a neutral placeholder when a role has no row operation', async ({ page }) => {
    await mockPaymentMethods(page, ['view']);
    await page.goto(pagePath);
    for (const row of rows) {
        await expect(methodRow(page, row.name).locator('[aria-label="当前无可执行操作"]')).toBeVisible();
    }
    await expect(page.getByRole('button', { name: '申请开通' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: '申请记录' })).toHaveCount(0);
});

function methodRow(page: Page, name: string) {
    return page.getByRole('row', { name: new RegExp(`^${name} `) });
}

async function mockPaymentMethods(page: Page, permissions: string[]) {
    const calls = { applicationKeys: [] as string[], submissions: [] as string[][] };
    await page.route('**/merchant/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/merchant/auth/me') {
            return reply(route, {
                account: { accountId: 1, userId: 1, merchantUserId: 1, merchantId: 'QA001', appCode: 'MERCHANT',
                    loginAccount: 'qa', realName: 'QA', status: 1 },
                roles: [],
                permissions: permissions.map(action => `${permission}:${action}`),
                menus: [{
                    id: 1, parentId: 0, menuCode: 'merchant_payment_methods_v1', menuName: '支付方式管理',
                    menuType: 'MENU', routePath: pagePath, componentPath: 'merchant-info/payment-methods',
                    permissionCode: `${permission}:view`, visible: 1, keepAlive: 0, children: [],
                }],
            });
        }
        if (path === '/merchant/payment-methods/search') {
            return reply(route, { records: rows, total: rows.length, pageNo: 1, pageSize: 20 });
        }
        if (path === '/merchant/payment-method-applications/search') {
            calls.applicationKeys.push(route.request().postDataJSON().itemKey);
            return reply(route, { records: [], total: 0, pageNo: 1, pageSize: 20 });
        }
        if (path === '/merchant/payment-method-applications' && route.request().method() === 'POST') {
            calls.submissions.push(route.request().postDataJSON().items);
            return reply(route, { applicationNo: 'QA-1', itemCount: 3 });
        }
        return reply(route, []);
    });
    return calls;
}

function reply(route: Route, data: unknown) {
    return route.fulfill({ json: { code: 'T200', data } });
}
