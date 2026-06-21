<template>
    <nav class="top-nav">
        <el-menu
            :default-active="activePath"
            mode="horizontal"
            class="top-nav-menu"
            @select="handleSelect"
        >
            <template v-for="item in menus" :key="item.path || item.title">
                <!-- Category with children → dropdown -->
                <el-sub-menu v-if="item.children?.length" :index="item.path || '__cat__' + item.title">
                    <template #title>
                        <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
                        <span>{{ displayTitle(item) }}</span>
                    </template>
                    <el-menu-item
                        v-for="child in item.children"
                        :key="child.path || child.title"
                        :index="child.path || child.title || child.titleKey || child.icon"
                    >
                        <el-icon v-if="child.icon"><component :is="resolveMenuIcon(child.icon)" /></el-icon>
                        <span>{{ displayTitle(child) }}</span>
                    </el-menu-item>
                </el-sub-menu>
                <!-- Leaf menu → direct link -->
                <el-menu-item v-else :index="item.path">
                    <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
                    <span>{{ displayTitle(item) }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ElMessage } from 'element-plus';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import type { AdminMenuItem } from '@/types/admin';
import { isExternalWindowMenu, openExternalMenu } from '@/utils/external-menu';
import { resolveMenuIcon } from '@/utils/menu-icon';

const { t, te } = useI18n();

const props = defineProps<{
    menus: AdminMenuItem[];
}>();

const route = useRoute();
const router = useRouter();

const activePath = computed(() => route.path || '/dashboard');

function displayTitle(item: AdminMenuItem): string {
    if (item.titleKey) {
        const key = 'route.' + item.titleKey;
        return te(key) ? t(key) : item.title;
    }
    return item.title;
}

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
    background: #fff;
    border-bottom: 1px solid #e8eaf0;
}

.top-nav-menu {
    border-bottom: none !important;
    background: transparent;
    padding: 0 8px;
}

.top-nav-menu .el-menu-item,
.top-nav-menu .el-sub-menu__title {
    height: 42px;
    line-height: 42px;
    font-size: 13px;
    color: #606266;
    border-bottom: 2px solid transparent;
}

.top-nav-menu .el-menu-item:hover,
.top-nav-menu .el-sub-menu__title:hover {
    color: var(--app-primary);
    background: #f5f7fa;
}

.top-nav-menu .el-menu-item.is-active,
.top-nav-menu .el-sub-menu.is-active > .el-sub-menu__title {
    color: var(--app-primary);
    border-bottom-color: var(--app-primary);
    font-weight: 600;
    background: transparent;
}

/* Submenu dropdown items */
.top-nav-menu .el-menu--horizontal .el-menu .el-menu-item {
    height: 36px;
    line-height: 36px;
    border-bottom: none;
}

.top-nav-menu .el-menu--horizontal .el-menu .el-menu-item:hover {
    color: var(--app-primary);
    background: #f5f7fa;
}
</style>
