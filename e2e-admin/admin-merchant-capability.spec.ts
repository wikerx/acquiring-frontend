import { expect, test, type Page, type Route } from '@playwright/test';

const activated = {
    id: '1',
    merchantId: 'QA001',
    merchantName: 'Activated fixture',
    merchantStatus: 1,
    onboardingStatus: 'ACTIVE',
    reviewStatus: 'PASSED',
    activationStatus: 'ACTIVE',
    countryCode: 'USA',
};
const waiting = {
    ...activated,
    id: '2',
    merchantId: 'QA002',
    merchantName: 'Pending fixture',
    onboardingStatus: 'APPROVED',
    activationStatus: 'PENDING',
};
const zero = {
    evaluationStatus: 'EVALUATED',
    activeBindingCount: 0,
    unavailableBindingCount: 0,
    capabilities: [],
};

test('distinguishes legacy payload, partial unavailability and verified zero', async ({ page }) => {
    let reads = 0;
    await mockMerchants(page, async (route) => {
        reads += 1;
        if (reads === 1) return reply(route, activated);
        if (reads === 2) return reply(route, {
            ...activated,
            currentPaymentCapabilities: {
                acquiring: { evaluationStatus: 'UNAVAILABLE' },
                payout: zero,
            },
        });
        return route.abort('timedout');
    });
    await page.goto('/merchant/info');
    await details(page, activated.merchantId).click();
    const dialog = page.getByRole('dialog');
    const acquiring = capabilityGroup(dialog, '收单能力');
    const payout = capabilityGroup(dialog, '代付能力');
    await expect(acquiring.getByText('未评估', { exact: true })).toBeVisible();
    await expect(acquiring.locator('.activation-capabilities__metrics b')).toHaveText(['—', '—']);
    await expect(payout.getByText('未评估', { exact: true })).toBeVisible();
    await expect(dialog.getByText('没有有效绑定', { exact: true })).toHaveCount(0);

    await acquiring.getByRole('button', { name: '重查能力' }).click();
    await expect(acquiring.getByText('暂不可用', { exact: true })).toBeVisible();
    await expect(acquiring.locator('.activation-capabilities__metrics b')).toHaveText(['—', '—']);
    await expect(payout.getByText('没有有效绑定', { exact: true })).toBeVisible();
    await expect(payout.locator('.activation-capabilities__metrics b')).toHaveText(['0', '0']);

    await acquiring.getByRole('button', { name: '重查能力' }).click();
    await expect(payout.getByText('暂不可用', { exact: true })).toBeVisible();
    await expect(payout.locator('.activation-capabilities__metrics b')).toHaveText(['—', '—']);
});

test('a delayed detail response cannot replace the later-selected merchant', async ({ page }) => {
    let releaseFirst!: () => void;
    let markStarted!: () => void;
    const firstStarted = new Promise<void>(resolve => { markStarted = resolve; });
    const firstRelease = new Promise<void>(resolve => { releaseFirst = resolve; });
    await mockMerchants(page, async (route, id) => {
        if (id === activated.id) {
            markStarted();
            await firstRelease;
            return reply(route, activated);
        }
        return reply(route, {
            ...waiting,
            currentPaymentCapabilities: { acquiring: zero, payout: zero },
        });
    });
    await page.goto('/merchant/info');
    await details(page, activated.merchantId).click();
    await firstStarted;
    try {
        await details(page, waiting.merchantId).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText(waiting.merchantName, { exact: true })).toBeVisible();
        await expect(capabilityGroup(dialog, '收单能力').getByText('没有有效绑定', { exact: true })).toBeVisible();
    } finally {
        releaseFirst();
    }
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('dialog').getByText(waiting.merchantName, { exact: true })).toBeVisible();
    await expect(page.getByRole('dialog').getByText(activated.merchantName, { exact: true })).toHaveCount(0);
});

function details(page: Page, merchantId: string) {
    return page.getByRole('row', { name: new RegExp(merchantId) }).getByRole('button', { name: '详情', exact: true });
}

function capabilityGroup(dialog: ReturnType<Page['getByRole']>, heading: string) {
    return dialog.locator('.activation-capabilities__group').filter({ hasText: heading });
}

async function mockMerchants(page: Page, read: (route: Route, id: string) => Promise<void>) {
    await page.addInitScript(() => localStorage.setItem('acquiring_admin_locale', 'zh-CN'));
    await page.route('**/admin/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/admin/auth/me') {
            return reply(route, {
                account: { accountId: 1, userId: 1, appCode: 'ADMIN', loginAccount: 'qa', realName: 'QA', status: 1 },
                roles: [],
                permissions: ['merchant:info:list', 'merchant:info:detail'],
                menus: [{
                    id: 1, parentId: 0, menuCode: 'qa_merchant_info', menuName: '商户信息管理',
                    menuType: 'MENU', routePath: '/merchant/info', componentPath: 'merchant/info',
                    permissionCode: 'merchant:info:list', visible: 1, keepAlive: 0, externalLink: 0,
                    sortNo: 1, children: [],
                }],
            });
        }
        if (path === '/admin/merchants/search') {
            return reply(route, { records: [activated, waiting], total: 2, pageNo: 1, pageSize: 10 });
        }
        if (path === '/admin/merchants/form-options') {
            return reply(route, { mccOptions: [], countries: [], currencies: [] });
        }
        const id = /^\/admin\/merchants\/(\d+)$/.exec(path)?.[1];
        if (id) return read(route, id);
        return reply(route, path.endsWith('/search') ? { records: [], total: 0 } : []);
    });
}

function reply(route: Route, data: unknown) {
    return route.fulfill({ json: { code: 'T200', data } });
}
