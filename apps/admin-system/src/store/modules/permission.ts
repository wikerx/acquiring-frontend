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
    if (!menu.routePath && !children.length) {
        return null;
    }
    return {
        title: menu.menuName,
        path: menu.routePath,
        icon: menu.icon || 'House',
        permission: menu.permissionCode,
        children,
    };
}
