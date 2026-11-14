import { expect, test, type Page, type Route } from '@playwright/test';

const readyOverview = {
    overallStatus: 'READY',
    completedRequiredChecks: 2,
    requiredCheckCount: 2,
    openApiBaseUrl: 'https://openapi.example.test',
    sdkVersion: '1.0.0',
    cryptoMode: 'RSA_AES_GCM',
    merchantProfile: {
        status: 'READY',
        onboardingStatus: 'COMPLETED',
        reviewStatus: 'APPROVED',
        activationStatus: 'ACTIVE',
        lastUpdatedTime: '2026-11-04T09:00:00.000',
    },
    settlement: {
        status: 'READY',
        settlementCurrency: 'USD',
        businessTimeZone: 'Asia/Shanghai',
        dailyCutoffTime: '18:00:00',
        processingMode: 'AUTOMATIC',
        settlementFrequency: 'DAILY',
        lastUpdatedTime: '2026-11-04T09:10:00.000',
    },
    paymentCapability: {
        status: 'READY',
        activeBindingCount: 1,
        capabilities: [{
            paymentType: 'PAYMENT',
            paymentMethod: 'BANK_CARD',
            currency: 'USD',
        }],
        lastUpdatedTime: '2026-11-04T09:20:00.000',
    },
    fee: {
        status: 'READY',
        activeVersionNo: 1,
        lastUpdatedTime: '2026-11-04T09:30:00.000',
    },
    risk: {
        status: 'READY',
        riskLevel: 1,
        lastUpdatedTime: '2026-11-04T09:40:00.000',
    },
    technicalStatus: 'READY',
    credentials: {
        status: 'READY',
        jwtKeyStatus: 'ENABLED',
        platformPayloadKeyStatus: 'ENABLED',
        merchantResponseKeyStatus: 'ENABLED',
        merchantResponsePrivateKeyAvailable: true,
        lastUpdatedTime: '2026-11-04T10:00:00.000',
    },
    ipWhitelist: {
        status: 'READY',
        required: true,
        enabled: true,
        totalCount: 2,
        activeCount: 2,
        pendingCount: 0,
        rejectedCount: 0,
        disabledCount: 0,
        lastUpdatedTime: '2026-11-04T11:00:00.000',
    },
    sourceUrl: {
        status: 'NOT_REQUIRED',
        required: false,
        enabled: false,
        totalCount: 1,
        activeCount: 1,
        pendingCount: 0,
        rejectedCount: 0,
        disabledCount: 0,
        lastUpdatedTime: '2026-11-03T11:00:00.000',
    },
};

test.describe('Merchant integration overview', () => {
    test('shows authoritative checks and routes authorized users to existing settings', async ({ page }) => {
        await mockMerchantApis(page, { managePermissions: true, overview: readyOverview });

        await page.goto('/access-config/overview');

        await expect(page.getByRole('heading', { name: '接入配置可用' })).toBeVisible();
        await expect(page.getByText('2/2', { exact: true })).toBeVisible();
        await expect(page.getByText('https://openapi.example.test', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: '技术接入' })).toBeVisible();
        await expect(page.getByText('JWT 签名')).toBeVisible();
        await expect(page.getByText('IP 白名单', { exact: true }).last()).toBeVisible();
        await expect(page.getByText('店铺网址', { exact: true }).last()).toBeVisible();
        await expect(page.getByText('非必需', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'API 凭证' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'IP 白名单' })).toBeVisible();
        await expect(page.getByRole('button', { name: '店铺网址' })).toBeVisible();
        await expect(page.getByText('raw-secret-value')).toHaveCount(0);

        const viewport = page.viewportSize();
        expect(viewport).not.toBeNull();
        expect(await page.evaluate(() => document.documentElement.scrollWidth))
            .toBeLessThanOrEqual(viewport!.width);

        await page.getByRole('button', { name: 'IP 白名单' }).click();
        await expect(page).toHaveURL(/\/access-config\/ip-whitelist$/);
    });

    test('keeps management actions hidden without their dedicated permissions', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('acquiring_merchant_locale', 'en-US'));
        await mockMerchantApis(page, {
            managePermissions: false,
            overview: {
                ...readyOverview,
                overallStatus: 'PENDING_REVIEW',
                completedRequiredChecks: 1,
                ipWhitelist: {
                    ...readyOverview.ipWhitelist,
                    status: 'PENDING_REVIEW',
                    activeCount: 0,
                    pendingCount: 1,
                },
            },
        });

        await page.goto('/access-config/overview');

        await expect(page.getByRole('heading', { name: 'Payment activation is in progress' })).toBeVisible();
        await expect(page.getByText('1 pending', { exact: true })).toBeVisible();
        await expect(page.getByText('Optional', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'API Credentials' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'IP Allowlist' })).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Store Websites' })).toHaveCount(0);
        await expect(page.getByText('merchant:access-config:ip-whitelist:list')).toHaveCount(0);
    });

    test('recovers from an overview request failure without fabricating a ready state', async ({ page }) => {
        let attempts = 0;
        await mockMerchantApis(page, {
            managePermissions: true,
            overview: readyOverview,
            overviewHandler: async (route) => {
                attempts += 1;
                if (attempts === 1) {
                    await route.fulfill({
                        status: 500,
                        contentType: 'application/json',
                        body: JSON.stringify({ code: 'T500', message: 'FAILED' }),
                    });
                    return;
                }
                await fulfill(route, readyOverview);
            },
        });

        await page.goto('/access-config/overview');

        await expect(page.getByText('接入状态加载失败', { exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: '接入配置可用' })).toHaveCount(0);
        await page.getByRole('button', { name: '重新加载' }).click();
        await expect(page.getByRole('heading', { name: '接入配置可用' })).toBeVisible();
        expect(attempts).toBe(2);
    });
});

interface MockOptions {
    managePermissions: boolean;
    overview: typeof readyOverview;
    overviewHandler?: (route: Route) => Promise<void>;
}

async function mockMerchantApis(page: Page, options: MockOptions) {
    await page.route('**/merchant/auth/me', (route) => fulfill(route, session(options.managePermissions)));
    await page.route('**/merchant/access-config/overview', async (route) => {
        if (options.overviewHandler) {
            await options.overviewHandler(route);
            return;
        }
        await fulfill(route, options.overview);
    });
    await page.route('**/merchant/access-config/ip-whitelists', (route) => fulfill(route, []));
    await page.route('**/merchant/access-config/source-urls', (route) => fulfill(route, []));
}

function session(managePermissions: boolean) {
    const permissions = ['merchant:access-config:overview:view'];
    const children = [
        menu(81, 'merchant_access_overview_v1', '接入概览', '/access-config/overview',
            'access-config/overview', 'merchant:access-config:overview:view'),
    ];
    if (managePermissions) {
        permissions.push(
            'merchant:openapi:key:view',
            'merchant:access-config:ip-whitelist:list',
            'merchant:access-config:source-url:list',
        );
        children.push(
            menu(82, 'merchant_source_url_v1', '店铺网址', '/access-config/source-url',
                'access-config/source-url', 'merchant:access-config:source-url:list'),
            menu(83, 'merchant_ip_whitelist_v1', 'IP 白名单', '/access-config/ip-whitelist',
                'access-config/ip-whitelist', 'merchant:access-config:ip-whitelist:list'),
        );
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
        menus: [{
            id: 80,
            parentId: 0,
            menuCode: 'merchant_access_config_catalog_v1',
            menuName: '支付接入管理',
            menuType: 'CATALOG',
            routePath: '/access-config',
            icon: 'Connection',
            visible: 1,
            keepAlive: 1,
            externalLink: 0,
            sortNo: 80,
            children,
        }],
    };
}

function menu(id: number, menuCode: string, menuName: string, routePath: string,
              componentPath: string, permissionCode: string) {
    return {
        id,
        parentId: 80,
        menuCode,
        menuName,
        menuType: 'MENU',
        routePath,
        componentPath,
        permissionCode,
        icon: 'Connection',
        visible: 1,
        keepAlive: 1,
        externalLink: 0,
        sortNo: id,
        children: [],
    };
}

async function fulfill(route: Route, data: unknown) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'T200', message: 'SUCCESS', data }),
    });
}
