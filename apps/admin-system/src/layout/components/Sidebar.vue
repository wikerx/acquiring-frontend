<template>
    <aside class="layout-sidebar" :class="{ collapsed, dark: sideTheme === 'dark' }">
        <div v-if="showLogo !== false" class="brand">
            <span class="brand-mark">A</span>
            <div v-if="!collapsed">
                <strong>Acquiring Admin</strong>
                <small>Global Payment Console</small>
            </div>
        </div>
        <el-menu
            :default-active="activePath"
            :collapse="collapsed"
            class="side-menu"
            @select="handleSelect"
        >
            <template v-for="item in menus" :key="itemKey(item)">
                <el-sub-menu v-if="item.children?.length" :index="'__group__' + (item.path || item.title)">
                    <template #title>
                        <el-icon v-if="item.icon"><component :is="resolveIcon(item.icon)" /></el-icon>
                        <span>{{ $te('route.' + item.titleKey) ? $t('route.' + item.titleKey) : item.title }}</span>
                    </template>
                    <el-menu-item
                        v-for="child in item.children"
                        :key="child.path || child.title"
                        :index="child.path || child.title || child.titleKey || child.icon"
                    >
                        <el-icon v-if="child.icon"><component :is="resolveIcon(child.icon)" /></el-icon>
                        <span>{{ $te('route.' + child.titleKey) ? $t('route.' + child.titleKey) : child.title }}</span>
                    </el-menu-item>
                </el-sub-menu>
                <el-menu-item v-else-if="item.path" :index="item.path">
                    <el-icon v-if="item.icon"><component :is="resolveIcon(item.icon)" /></el-icon>
                    <span>{{ $te('route.' + item.titleKey) ? $t('route.' + item.titleKey) : item.title }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </aside>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    Avatar,
    Coin,
    Connection,
    DataLine,
    Document,
    DocumentChecked,
    Grid,
    House,
    Key,
    Location,
    Lock,
    Menu,
    Message,
    Monitor,
    OfficeBuilding,
    Setting,
    Shop,
    Tickets,
    Unlock,
    User,
    UserFilled,
} from '@element-plus/icons-vue';
import type { AdminMenuItem } from '@/types/admin';
import { isExternalWindowMenu, openExternalMenu } from '@/utils/external-menu';

const props = defineProps<{
    menus: AdminMenuItem[];
    collapsed: boolean;
    sideTheme?: 'dark' | 'light';
    showLogo?: boolean;
}>();

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const activePath = computed(() => {
    return route.path || '/dashboard';
});

function itemKey(item: AdminMenuItem) {
    return item.path || item.title || Math.random().toString(36);
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

const icons: Record<string, Component> = {
    Avatar,
    Coin,
    Connection,
    DataLine,
    Document,
    DocumentChecked,
    Grid,
    House,
    Key,
    Location,
    Lock,
    Menu,
    Message,
    Monitor,
    OfficeBuilding,
    Setting,
    Shop,
    Tickets,
    Unlock,
    User,
    UserFilled,
};

function resolveIcon(name?: string) {
    if (!name) {
        return House;
    }
    return icons[name] || House;
}
</script>
