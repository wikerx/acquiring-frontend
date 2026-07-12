<template>
    <nav class="top-nav" :class="themeClass">
        <el-menu
            ref="menuRef"
            :default-active="activePath"
            mode="horizontal"
            class="top-nav-menu"
            @select="handleSelect"
        >
            <TopNavMenuNode
                v-for="item in menus"
                :key="itemKey(item)"
                :item="item"
                :active-path="activePath"
                @navigate="handleMenuNavigate"
            />
        </el-menu>
    </nav>
</template>

<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { AdminMenuItem } from '@/types/admin';
import type { NavigationTheme } from '@/constants/app';
import { isExternalWindowMenu, openExternalMenu } from '@/utils/external-menu';
import TopNavMenuNode from './TopNavMenuNode.vue';

const { t } = useI18n();

const props = defineProps<{
    menus: AdminMenuItem[];
    navTheme?: NavigationTheme;
}>();

const route = useRoute();
const router = useRouter();
const menuRef = ref<{ close: (index: string) => void }>();
const themeClass = computed(() => `theme-${props.navTheme || 'light'}`);
const popperClass = computed(() => `admin-nav-popper top-nav-submenu-popper top-nav-submenu-popper--${props.navTheme || 'light'}`);
provide('topNavPopperClass', popperClass);

const activePath = computed(() => route.path || '/dashboard');

function handleSelect(index: string) {
    const menu = findMenuByPath(props.menus, index);
    if (!menu) {
        return;
    }
    navigateToMenu(menu, index);
}

function itemKey(item: AdminMenuItem) {
    return item.path || item.titleKey || item.title;
}

function handleMenuNavigate(menu: AdminMenuItem) {
    closeTopMenuGroups();
    navigateToMenu(menu, menu.path);
}

function navigateToMenu(menu: AdminMenuItem, path?: string) {
    if (isExternalWindowMenu({ menuType: menu.menuType, externalLink: menu.externalLink })) {
        if (openExternalMenu(menu.routePath)) {
            return;
        }
        ElMessage.warning(t('externalMonitor.urlNotConfigured'));
        return;
    }
    if (path && path.startsWith('/')) {
        router.push(path);
    }
}

function closeTopMenuGroups() {
    props.menus.forEach((item) => {
        if (item.children?.length) {
            menuRef.value?.close(groupIndex(item));
        }
    });
}

function groupIndex(item: AdminMenuItem) {
    return `__top_group__${item.path || item.titleKey || item.title}`;
}

/**
 * 根据路径查找当前菜单节点。
 *
 * @param items 菜单树
 * @param path 菜单路径
 * @returns 菜单节点
 */
function findMenuByPath(items: AdminMenuItem[], path: string): AdminMenuItem | undefined {
    for (const item of items) {
        if (item.path === path) {
            return item;
        }
        if (item.children?.length) {
            const matchedChild = findMenuByPath(item.children, path);
            if (matchedChild) {
                return matchedChild;
            }
        }
    }
    return undefined;
}

</script>

<style scoped>
.top-nav {
    background: var(--nav-bg);
    border-bottom: 1px solid var(--nav-border);
    box-shadow: var(--nav-shadow);
}

.top-nav-menu {
    --el-menu-bg-color: transparent;
    --el-menu-text-color: var(--nav-text);
    --el-menu-hover-bg-color: var(--nav-hover-bg);
    --el-menu-hover-text-color: var(--nav-hover-text);
    --el-menu-active-color: var(--nav-active-text);
    border-bottom: none !important;
    background: transparent;
    padding: 0 8px;
}

.top-nav-menu :deep(.el-menu-item),
.top-nav-menu :deep(.el-sub-menu__title) {
    height: 42px;
    line-height: 42px;
    font-size: 13px;
    color: var(--nav-text);
    border-bottom: 2px solid transparent;
    white-space: nowrap;
    background: transparent;
}

.top-nav-menu :deep(.el-menu-item:hover),
.top-nav-menu :deep(.el-sub-menu__title:hover) {
    color: var(--nav-hover-text);
    background: var(--nav-hover-bg);
}

.top-nav-menu :deep(.el-menu-item.is-active),
.top-nav-menu :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
    color: var(--nav-active-text);
    border-bottom-color: var(--nav-active-indicator);
    font-weight: 600;
    background: var(--nav-active-bg);
}

.top-nav-menu :deep(.el-icon) {
    color: inherit;
}
</style>
