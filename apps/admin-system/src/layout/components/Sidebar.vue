<template>
    <aside class="layout-sidebar" :class="[themeClass, { collapsed }]">
        <div v-if="showLogo !== false" class="brand">
            <img class="brand-mark brand-icon" :src="adminBrand.logos.icon" :alt="adminBrand.name" />
            <div v-if="!collapsed" class="brand-copy">
                <strong>{{ adminBrand.name }}</strong>
                <small>{{ adminBrand.subtitleEn }}</small>
            </div>
        </div>
        <div class="sidebar-menu-wrap">
            <el-menu
                :default-active="activePath"
                :collapse="collapsed"
                class="side-menu"
                @select="handleSelect"
            >
                <SidebarMenuNode
                    v-for="item in menus"
                    :key="itemKey(item)"
                    :item="item"
                />
            </el-menu>
        </div>
        <div v-if="!collapsed" class="sidebar-resize-handle" @mousedown="$emit('resizeStart', $event)" />
    </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getSystemBrand } from '@acquiring/shared';
import type { AdminMenuItem } from '@/types/admin';
import { isExternalWindowMenu, openExternalMenu } from '@/utils/external-menu';
import type { NavigationTheme } from '@/constants/app';
import SidebarMenuNode from './SidebarMenuNode.vue';

const props = defineProps<{
    menus: AdminMenuItem[];
    collapsed: boolean;
    sideTheme?: NavigationTheme;
    showLogo?: boolean;
}>();

defineEmits<{
    resizeStart: [event: MouseEvent];
}>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const adminBrand = getSystemBrand('admin');
const themeClass = computed(() => `theme-${props.sideTheme || 'light'}`);

const activePath = computed(() => route.path || '/dashboard');

function itemKey(item: AdminMenuItem) {
    return item.path || item.titleKey || item.title;
}

/**
 * 统一处理侧边栏菜单点击，兼容内部路由与新窗口外链。
 *
 * @param index 菜单索引
 */
function handleSelect(index: string) {
    const menu = findMenuByPath(props.menus, index);
    if (!menu) {
        return;
    }
    if (isExternalWindowMenu({ menuType: menu.menuType, externalLink: menu.externalLink })) {
        if (openExternalMenu(menu.routePath)) {
            return;
        }
        ElMessage.warning(t('externalMonitor.urlNotConfigured'));
        return;
    }
    if (index && index.startsWith('/')) {
        router.push(index);
    }
}

/**
 * 根据菜单路径递归查找菜单项。
 *
 * @param items 菜单列表
 * @param path 菜单路径
 * @returns 菜单项
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
