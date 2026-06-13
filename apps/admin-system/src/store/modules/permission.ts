import { defineStore } from 'pinia';
import type { AuthMenu } from '@acquiring/shared';
import type { AdminMenuItem } from '@/types/admin';

export const usePermissionStore = defineStore('permission', {
    state: () => ({
        menus: [] as AdminMenuItem[],
    }),
    actions: {
        setMenus(menus: AdminMenuItem[]) {
            this.menus = menus;
        },
        setBackendMenus(menus: AuthMenu[]) {
            this.menus = menus.map(toAdminMenuItem).filter(Boolean) as AdminMenuItem[];
        },
        clearMenus() {
            this.menus = [];
        },
    },
});

function toAdminMenuItem(menu: AuthMenu): AdminMenuItem | null {
    if (menu.visible === 0) {
        return null;
    }
    const children = (menu.children || []).map(toAdminMenuItem).filter(Boolean) as AdminMenuItem[];
    // Only keep items that are routes (MENU type) or have visible children
    if (!menu.routePath && !children.length) {
        return null;
    }
    return {
        title: menu.menuName,
        titleKey: menu.menuCode,
        path: normalizePath(menu.routePath),
        icon: menu.icon || 'House',
        permission: menu.permissionCode,
        children,
    };
}

/** Ensure path has leading slash and no trailing slash */
function normalizePath(path?: string): string | undefined {
    if (!path) {
        return undefined;
    }
    let normalized = path.trim();
    if (!normalized.startsWith('/')) {
        normalized = '/' + normalized;
    }
    return normalized.replace(/\/+$/, '') || '/';
}
