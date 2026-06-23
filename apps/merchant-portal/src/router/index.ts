import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { VEXRA_BRAND } from '@acquiring/shared';
import { currentUser } from '@/api/authApi';
import { i18n } from '@/i18n';
import MerchantLayout from '@/layouts/MerchantLayout.vue';
import Dashboard from '@/pages/Dashboard.vue';
import Forbidden from '@/pages/Forbidden.vue';
import Login from '@/pages/Login.vue';
import PlaceholderPage from '@/pages/PlaceholderPage.vue';
import { useAuthStore } from '@/stores/authStore';
import { flattenRouteMenus, normalizeMenuPath, resolveMenuComponent } from '@/utils/menu';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        titleKey?: string;
        permission?: string;
    }
}

const staticChildren: RouteRecordRaw[] = [
    { path: 'dashboard', component: Dashboard, meta: { titleKey: 'layout.dashboard' } },
    { path: 'transactions', component: PlaceholderPage, props: { pageKey: 'transactions' }, meta: { titleKey: 'layout.transactions' } },
    { path: 'settlements', component: PlaceholderPage, props: { pageKey: 'settlements' }, meta: { titleKey: 'layout.settlements' } },
    { path: 'account', component: PlaceholderPage, props: { pageKey: 'account' }, meta: { titleKey: 'layout.account' } },
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
            redirect: '/dashboard',
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
    } catch {
        auth.clearSession();
    }
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
    if (to.path === '/login' && auth.session) {
        return '/dashboard';
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
        if (!runtimePath || runtimePath === '/dashboard') {
            return;
        }
        dynamicRouteRemovers.push(
            router.addRoute('MerchantRoot', {
                path: runtimePath.replace(/^\//, ''),
                name: menu.menuCode,
                component: resolveMenuComponent(menu),
                props: menu.componentPath ? undefined : { pageKey: menu.menuCode },
                meta: {
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
