import { defineStore } from 'pinia';
import type { AuthMenu } from '@acquiring/shared';
import type { AdminMenuItem } from '@/types/admin';
import { normalizeMenuPath, resolveRuntimeMenuPath } from '@/utils/external-menu';

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
    const runtimePath = resolveRuntimeMenuPath(menu);
    const routePath = normalizeMenuPath(menu.routePath);
    // 保留可展示菜单节点，包括目录、内部菜单和外链菜单。
    if (!runtimePath && !children.length) {
        return null;
    }
    return {
        title: menu.menuName,
        titleKey: menu.menuCode,
        path: runtimePath,
        icon: menu.icon || 'House',
        permission: menu.permissionCode,
        menuType: menu.menuType,
        externalLink: menu.externalLink,
        routePath,
        componentPath: menu.componentPath,
        runtimePath,
        children,
    };
}
