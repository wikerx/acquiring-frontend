import type { Component } from 'vue';
import type { AuthMenu } from '@acquiring/shared';
import PlaceholderPage from '@/pages/PlaceholderPage.vue';

const pageModules = import.meta.glob('../pages/**/index.vue');

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

export function resolveMenuComponent(menu: AuthMenu): Component {
    const candidates = createPageCandidates(menu.routePath || '', menu.componentPath);
    const pagePath = candidates.find((candidate) => pageModules[candidate]);
    if (pagePath) {
        return pageModules[pagePath] as Component;
    }
    return PlaceholderPage;
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
