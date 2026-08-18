import type { Component } from 'vue';
import type { AuthMenu } from '@acquiring/shared';
import Forbidden from '@/pages/Forbidden.vue';

const pageModules = import.meta.glob('../pages/**/index.vue');
const MERCHANT_HOME_PATH = '/home';
type TranslateFn = (key: string) => string;
type TranslationExistsFn = (key: string) => boolean;
type MenuLabelSource = {
    menuCode?: string;
    routePath?: string;
    menuName?: string;
    code?: string;
    name?: string;
};

const MENU_ROUTE_TITLE_KEYS: Record<string, string> = {
    '/home': 'route.home',
    '/merchant-info': 'route.merchantInfo',
    '/merchant-info/openapi-keys': 'route.openapiKeys',
    '/access-config': 'route.accessConfig',
    '/access-config/source-url': 'route.sourceUrl',
    '/access-config/ip-whitelist': 'route.ipWhitelist',
    '/transaction': 'route.transactionManage',
    '/transaction/order': 'route.transactionOrder',
    '/transaction/refund': 'route.transactionRefund',
    '/transaction/analytics': 'route.transactionAnalytics',
    '/system': 'route.systemManage',
    '/system/dept': 'route.systemDept',
    '/system/post': 'route.systemPost',
    '/system/account': 'route.systemAccount',
    '/system/role': 'route.systemRole',
    '/system/role-auth': 'route.systemRoleAuth',
    '/security': 'route.securityCenter',
    '/security/intercept-events': 'route.securityInterceptEvents',
};

const MENU_CODE_TITLE_KEYS: Record<string, string> = {
    home: 'route.home',
    merchant_home: 'route.home',
    merchant_dashboard: 'route.home',
    merchant_info: 'route.merchantInfo',
    merchant_info_manage: 'route.merchantInfo',
    merchant_api_key: 'route.openapiKeys',
    merchant_api_keys: 'route.openapiKeys',
    merchant_openapi_key: 'route.openapiKeys',
    merchant_openapi_keys: 'route.openapiKeys',
    merchant_access_config_catalog_v1: 'route.accessConfig',
    merchant_source_url_v1: 'route.sourceUrl',
    merchant_ip_whitelist_v1: 'route.ipWhitelist',
    merchant_transaction_catalog_v1: 'route.transactionManage',
    merchant_transaction_order_v1: 'route.transactionOrder',
    merchant_transaction_refund_v1: 'route.transactionRefund',
    merchant_transaction_analytics_v1: 'route.transactionAnalytics',
    merchant_system: 'route.systemManage',
    merchant_system_catalog_v1: 'route.systemManage',
    system: 'route.systemManage',
    system_manage: 'route.systemManage',
    merchant_system_dept_v1: 'route.systemDept',
    merchant_system_post_v1: 'route.systemPost',
    merchant_system_account_v1: 'route.systemAccount',
    merchant_system_role_v1: 'route.systemRole',
    merchant_system_role_auth_v1: 'route.systemRoleAuth',
    merchant_ip_whitelist: 'route.merchantIpWhitelist',
    merchant_ip_whitelist_manage_v1: 'route.merchantIpWhitelist',
    security_center_v1: 'route.securityCenter',
    security_intercept_event_v1: 'route.securityInterceptEvents',
};

export function createMerchantHomeMenu(): AuthMenu {
    return {
        id: 0,
        parentId: 0,
        menuCode: 'merchant-home',
        menuName: 'Home',
        menuType: 'MENU',
        routePath: MERCHANT_HOME_PATH,
        componentPath: 'home',
        icon: 'House',
        visible: 1,
        keepAlive: 1,
        externalLink: 0,
        sortNo: -1,
        children: [],
    };
}

export function withMerchantHomeMenu(menus: AuthMenu[]) {
    const visibleMenus = menus || [];
    if (visibleMenus.some((menu) => normalizeMenuPath(menu.routePath) === MERCHANT_HOME_PATH || menu.menuCode === 'merchant-home')) {
        return visibleMenus;
    }
    return [createMerchantHomeMenu(), ...visibleMenus];
}

export function isMerchantHomePath(path?: string) {
    return normalizeMenuPath(path) === MERCHANT_HOME_PATH;
}

export function flattenRouteMenus(menus: AuthMenu[]) {
    const result: AuthMenu[] = [];
    const visit = (items: AuthMenu[]) => {
        items.forEach((item) => {
            if (item.visible === 0) {
                return;
            }
            if ((item.menuType === 'MENU' || item.menuType === 'LINK') && normalizeMenuPath(item.routePath)) {
                result.push(item);
            }
            visit(item.children || []);
        });
    };
    visit(menus);
    return result;
}

export function normalizeMenuPath(value?: string) {
    if (!value) {
        return '';
    }
    const normalized = value.trim();
    if (!normalized) {
        return '';
    }
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

export function resolveMerchantMenuI18nKey(menu: Pick<AuthMenu, 'menuCode' | 'routePath'> | { menuCode?: string; routePath?: string }) {
    const routeKey = MENU_ROUTE_TITLE_KEYS[normalizeMenuPath(menu.routePath)];
    if (routeKey) {
        return routeKey;
    }
    const code = normalizeMenuCode(menu.menuCode);
    return code ? MENU_CODE_TITLE_KEYS[code] : undefined;
}

export function resolveMerchantMenuLabel(
    menu: MenuLabelSource,
    t: TranslateFn,
    te?: TranslationExistsFn,
) {
    const titleKey = resolveMerchantMenuI18nKey({ menuCode: menu.menuCode || menu.code, routePath: menu.routePath });
    if (titleKey && (!te || te(titleKey))) {
        return t(titleKey);
    }
    return menu.menuName?.trim() || menu.name?.trim() || menu.menuCode || menu.code || normalizeMenuPath(menu.routePath) || '';
}

export function resolveMenuComponent(menu: AuthMenu): Component {
    const candidates = createPageCandidates(menu.routePath || '', menu.componentPath);
    const pagePath = candidates.find((candidate) => pageModules[candidate]);
    if (pagePath) {
        return pageModules[pagePath] as Component;
    }
    return Forbidden;
}

export function firstAvailableMenuPath(menus: AuthMenu[]) {
    return flattenRouteMenus(withMerchantHomeMenu(menus)).map((menu) => normalizeMenuPath(menu.routePath)).find(Boolean) || MERCHANT_HOME_PATH;
}

function createPageCandidates(routePath: string, componentPath?: string) {
    const normalizedRoute = normalizeComponentPath(routePath);
    const normalizedComponent = normalizeComponentPath(componentPath || routePath);
    const values = [
        normalizedComponent,
        normalizedComponent.replace(/\/index$/, ''),
        normalizedRoute,
        normalizedRoute.replace(/\/index$/, ''),
    ].filter(Boolean);

    return Array.from(new Set(values)).map((value) => `../pages/${value}/index.vue`);
}

function normalizeComponentPath(value?: string) {
    return (value || '').replace(/^\/+/, '').replace(/^pages\//, '').replace(/\.vue$/, '').replace(/\/index$/, '');
}

function normalizeMenuCode(value?: string) {
    return (value || '')
        .trim()
        .replace(/[\s-]+/g, '_')
        .toLowerCase();
}
