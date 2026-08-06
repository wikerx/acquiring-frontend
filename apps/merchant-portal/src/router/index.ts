import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { VEXRA_BRAND } from '@acquiring/shared';
import { currentUser } from '@/api/authApi';
import { i18n } from '@/i18n';
import MerchantLayout from '@/layouts/MerchantLayout.vue';
import Forbidden from '@/pages/Forbidden.vue';
import Login from '@/pages/Login.vue';
import OpenApiKeys from '@/pages/merchant-info/openapi-keys/index.vue';
import SystemAccount from '@/pages/system/account/index.vue';
import SystemDept from '@/pages/system/dept/index.vue';
import SystemPost from '@/pages/system/post/index.vue';
import SystemRole from '@/pages/system/role/index.vue';
import SystemRoleAuth from '@/pages/system/role-auth/index.vue';
import TransactionOrder from '@/pages/transaction/order/index.vue';
import TransactionRefund from '@/pages/transaction/refund/index.vue';
import { useAuthStore } from '@/stores/authStore';
import { firstAvailableMenuPath, flattenRouteMenus, isMerchantHomePath, normalizeMenuPath, resolveMerchantMenuI18nKey, resolveMenuComponent } from '@/utils/menu';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        titleKey?: string;
        permission?: string;
    }
}

const staticChildren: RouteRecordRaw[] = [
    { path: 'home', component: () => import('@/pages/home/index.vue'), meta: { titleKey: 'route.home' } },
    { path: 'profile', component: () => import('@/pages/profile/index.vue'), meta: { titleKey: 'route.profile' } },
    { path: 'transaction/order', component: TransactionOrder, meta: { titleKey: 'route.transactionOrder', permission: 'merchant:transaction:order:list' } },
    { path: 'transaction/refund', component: TransactionRefund, meta: { titleKey: 'route.transactionRefund', permission: 'merchant:transaction:refund:list' } },
    { path: 'merchant-info/openapi-keys', component: OpenApiKeys, meta: { titleKey: 'route.openapiKeys', permission: 'merchant:openapi:key:view' } },
    { path: 'system/account', component: SystemAccount, meta: { titleKey: 'route.systemAccount', permission: 'merchant:system:account:list' } },
    { path: 'system/dept', component: SystemDept, meta: { titleKey: 'route.systemDept', permission: 'merchant:system:dept:list' } },
    { path: 'system/post', component: SystemPost, meta: { titleKey: 'route.systemPost', permission: 'merchant:system:post:list' } },
    { path: 'system/role', component: SystemRole, meta: { titleKey: 'route.systemRole', permission: 'merchant:system:role:list' } },
    { path: 'system/role-auth', component: SystemRoleAuth, meta: { titleKey: 'route.systemRoleAuth', permission: 'merchant:system:role:grantMenu' } },
    { path: ':pathMatch(.*)*', name: 'MerchantRuntimeFallback', component: Forbidden, meta: { title: '403', runtimeFallback: true } },
];

export const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/login', component: Login },
        { path: '/403', component: Forbidden, meta: { title: '403' } },
        {
            path: '/',
            name: 'MerchantRoot',
            component: MerchantLayout,
            children: staticChildren,
        },
    ],
});

let dynamicRouteSignature = '';
const dynamicRouteRemovers: Array<() => void> = [];

async function refreshCurrentUserIfNeeded() {
    const auth = useAuthStore();
    if (!auth.session || auth.hydrated) {
        return;
    }
    try {
        const response = await currentUser();
        auth.setCurrentUserResponse(response);
        syncDynamicRoutes(response.menus || []);
    } catch (error) {
        if (isUnauthorizedError(error)) {
            auth.clearSession();
            return;
        }
        auth.markHydrated();
        syncDynamicRoutes(auth.session?.menus || []);
    }
}

function isUnauthorizedError(error: unknown) {
    return Boolean((error as { response?: { status?: number } })?.response?.status === 401);
}

router.beforeEach(async (to) => {
    const auth = useAuthStore();
    const unmatchedBeforeSync = to.matched.length === 0;
    const runtimeFallbackBeforeSync = Boolean(to.meta.runtimeFallback);
    const defaultTitle = VEXRA_BRAND.systems.merchant.title;
    const titleKey = to.meta.titleKey as string | undefined;
    const localizedTitle = titleKey ? i18n.global.t(titleKey) : VEXRA_BRAND.systems.merchant.subtitleEn;
    document.title =
        to.path === '/login'
            ? defaultTitle
            : `${localizedTitle} - ${VEXRA_BRAND.systems.merchant.name}`;
    if (to.path !== '/login') {
        await refreshCurrentUserIfNeeded();
        syncDynamicRoutes(auth.session?.menus || []);
        const resolvedAfterSync = router.resolve(to.fullPath);
        if ((unmatchedBeforeSync || runtimeFallbackBeforeSync) && resolvedAfterSync.name !== 'MerchantRuntimeFallback') {
            return { path: to.fullPath, query: to.query, hash: to.hash, replace: true };
        }
    }
    if (to.path !== '/login' && !auth.session) {
        return '/login';
    }
    if (to.path === '/' && auth.session) {
        return firstAvailableMenuPath(auth.session.menus || []);
    }
    if (to.path === '/login' && auth.session) {
        return firstAvailableMenuPath(auth.session.menus || []);
    }
    if (to.meta.permission && !auth.hasPermission(to.meta.permission as string)) {
        return '/403';
    }
    return true;
});

export function syncDynamicRoutes(menus: import('@acquiring/shared').AuthMenu[]) {
    const signature = JSON.stringify(flattenRouteMenus(menus).map((menu) => [
        normalizeMenuPath(menu.routePath),
        menu.componentPath,
        menu.permissionCode,
        menu.menuType,
    ]));
    if (signature === dynamicRouteSignature) {
        return;
    }
    resetDynamicRoutes();
    flattenRouteMenus(menus).forEach((menu) => {
        const runtimePath = normalizeMenuPath(menu.routePath);
        if (!runtimePath || isMerchantHomePath(runtimePath)) {
            return;
        }
        if (router.resolve(runtimePath).name !== 'MerchantRuntimeFallback') {
            return;
        }
        dynamicRouteRemovers.push(
            router.addRoute('MerchantRoot', {
                path: runtimePath.replace(/^\//, ''),
                name: menu.menuCode,
                component: resolveMenuComponent(menu),
                props: menu.componentPath ? undefined : { pageKey: menu.menuCode },
                meta: {
                    titleKey: resolveMerchantMenuI18nKey(menu),
                    title: menu.menuName,
                    permission: menu.permissionCode,
                },
            }),
        );
    });
    dynamicRouteSignature = signature;
}

export function resetDynamicRoutes() {
    dynamicRouteRemovers.splice(0).forEach((removeRoute) => removeRoute());
    dynamicRouteSignature = '';
}
