import { createRouter, createWebHistory } from 'vue-router';
import type { Component } from 'vue';
import type { RouteRecordRaw } from 'vue-router';
import type { AuthMenu } from '@acquiring/shared';
import Layout from '@/layout/index.vue';
import { useUserStore } from '@/store';

declare module 'vue-router' {
    interface RouteMeta {
        title?: string;
        icon?: string;
        permission?: string;
        configuredComponent?: string;
        expectedView?: string;
    }
}

const viewModules = import.meta.glob('../views/**/index.vue');
const missingView = () => import('@/views/_fallback/MissingView.vue');

const legacyRedirects: Record<string, string> = {
    '/system/department': '/system/org',
    '/system/departments': '/system/org',
    '/system/post': '/system/org',
    '/system/posts': '/system/org',
    '/system/dict': '/system/config-center',
    '/system/dicts': '/system/config-center',
    '/system/config': '/system/config-center',
    '/system/configs': '/system/config-center',
    '/system/login-log': '/system/log',
    '/system/login-logs': '/system/log',
    '/system/oper-log': '/system/log',
    '/system/oper-logs': '/system/log',
    '/system/users': '/system/user',
    '/system/roles': '/system/role',
    '/system/menus': '/system/menu',
    '/audit/login-log': '/system/log',
    '/audit/oper-log': '/system/log',
    '/audit/login-session': '/security/session',
    '/merchant/account': '/merchant/info',
    '/merchant/user': '/merchant/info',
    '/merchant/role': '/merchant/info',
    '/merchant/key': '/merchant/info',
    '/merchant/jwt-key': '/merchant/info',
    '/merchant/response-key': '/merchant/info',
    '/merchant/platform-payload-key': '/merchant/info',
    '/merchants/list': '/merchant/info',
    '/merchants/users': '/merchant/info',
    '/merchants/audit': '/merchant/info',
    '/merchants/api-keys': '/merchant/info',
    '/base/countries': '/base/country',
    '/base/currencies': '/base/currency',
    '/permission/resource': '/permission/app',
    '/permission/role-auth': '/permission/app',
    '/permission/role-grant': '/permission/app',
    '/security/jwt-key': '/security/api-security',
    '/security/api-access': '/security/api-security',
    '/security/audit': '/security/api-security',
    '/security/operation-audit': '/security/api-security',
    '/security/login-session': '/security/session',
};

const redirectRoutes: RouteRecordRaw[] = Object.entries(legacyRedirects).map(([path, redirect]) => ({
    path,
    redirect,
}));

export const routes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/login/index.vue'),
        meta: { title: '登录' },
    },
    {
        path: '/403',
        name: 'Forbidden',
        component: () => import('@/views/error/Forbidden.vue'),
        meta: { title: '403' },
    },
    ...redirectRoutes,
    {
        path: '/',
        name: 'AdminRoot',
        component: Layout,
        redirect: '/dashboard',
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('@/views/dashboard/index.vue'),
                meta: { title: '工作台', icon: 'House', permission: 'dashboard:view' },
            },
        ],
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'RouteMissingShell',
        component: Layout,
        children: [
            {
                path: '',
                name: 'RouteMissing',
                component: missingView,
                meta: { title: '页面未实现' },
            },
        ],
    },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

let dynamicRouteSignature = '';
const dynamicRouteRemovers: Array<() => void> = [];

router.beforeEach(async (to) => {
    const user = useUserStore();
    if (to.path !== '/login') {
        try {
            await user.hydrateSession();
        } catch {
            user.reset();
            return { path: '/login', query: { redirect: to.fullPath } };
        }
        syncDynamicRoutes(user.menus);
    }
    if (to.path !== '/login' && !user.token) {
        return { path: '/login', query: { redirect: to.fullPath } };
    }
    if (to.path === '/login' && user.token) {
        return '/dashboard';
    }
    if (isMissingRoute(to.name) && hasResolvedRoute(to.fullPath)) {
        return { path: to.fullPath, replace: true };
    }
    if (to.meta.permission && !user.hasPermission(to.meta.permission)) {
        return '/403';
    }
    return true;
});

export function syncDynamicRoutes(menus: AuthMenu[]) {
    const signature = JSON.stringify(flattenRouteMenus(menus).map((menu) => [
        menu.routePath,
        menu.componentPath,
        menu.permissionCode,
    ]));
    if (signature === dynamicRouteSignature) {
        return;
    }
    resetDynamicRoutes();
    flattenRouteMenus(menus).forEach((menu) => {
        if (!menu.routePath || menu.routePath === '/dashboard') {
            return;
        }
        dynamicRouteRemovers.push(
            router.addRoute('AdminRoot', {
                path: menu.routePath.replace(/^\//, ''),
                name: menu.menuCode,
                component: resolveViewComponent(menu.routePath, menu.componentPath),
                meta: {
                    title: menu.menuName,
                    icon: menu.icon,
                    permission: menu.permissionCode,
                    configuredComponent: menu.componentPath,
                    expectedView: toExpectedViewPath(menu.routePath, menu.componentPath),
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

function flattenRouteMenus(menus: AuthMenu[]) {
    const result: AuthMenu[] = [];
    const visit = (items: AuthMenu[]) => {
        items.forEach((item) => {
            if (item.visible === 0) {
                return;
            }
            if (item.menuType === 'MENU' && item.routePath) {
                result.push(item);
            }
            visit(item.children || []);
        });
    };
    visit(menus);
    return result;
}

function resolveViewComponent(routePath: string, componentConfig?: string): Component {
    const candidates = createViewCandidates(routePath, componentConfig);
    const viewPath = candidates.find((candidate) => viewModules[candidate]);
    if (viewPath) {
        return viewModules[viewPath] as Component;
    }

    console.warn('[admin-system] Missing view for route', {
        routePath,
        componentConfig,
        expectedView: toExpectedViewPath(routePath, componentConfig),
    });
    return missingView;
}

function createViewCandidates(routePath: string, componentConfig?: string) {
    const normalizedRoute = normalizeComponentPath(routePath);
    const normalizedComponent = normalizeComponentPath(componentConfig || routePath);
    const values = [
        normalizedComponent,
        normalizedComponent.replace(/\/index$/, ''),
        normalizedRoute,
        normalizedRoute.replace(/\/index$/, ''),
    ].filter(Boolean);

    return Array.from(new Set(values)).map((value) => `../views/${value}/index.vue`);
}

function normalizeComponentPath(value: string) {
    return value.replace(/^\/+/, '').replace(/^views\//, '').replace(/\.vue$/, '').replace(/\/index$/, '');
}

function toExpectedViewPath(routePath: string, componentConfig?: string) {
    const normalized = normalizeComponentPath(componentConfig || routePath);
    return `src/views/${normalized}/index.vue`;
}

function isMissingRoute(routeName: unknown) {
    return routeName === 'RouteMissing' || routeName === 'RouteMissingShell';
}

function hasResolvedRoute(fullPath: string) {
    return !isMissingRoute(router.resolve(fullPath).name);
}
