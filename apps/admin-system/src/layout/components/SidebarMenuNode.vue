<template>
    <el-sub-menu v-if="item.children?.length" :index="groupIndex(item)" popper-class="admin-nav-popper admin-sidebar-popper">
        <template #title>
            <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
            <el-tooltip :content="displayTitle(item)" placement="right" :show-after="500">
                <span class="menu-title-text">{{ displayTitle(item) }}</span>
            </el-tooltip>
        </template>
        <SidebarMenuNode
            v-for="child in item.children"
            :key="itemKey(child)"
            :item="child"
        />
    </el-sub-menu>
    <el-menu-item v-else-if="item.path" :index="item.path">
        <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
        <el-tooltip :content="displayTitle(item)" placement="right" :show-after="500">
            <span class="menu-title-text">{{ displayTitle(item) }}</span>
        </el-tooltip>
    </el-menu-item>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { AdminMenuItem } from '@/types/admin';
import { resolveMenuIcon } from '@/utils/menu-icon';

defineOptions({
    name: 'SidebarMenuNode',
});

defineProps<{
    item: AdminMenuItem;
}>();

const { t, te } = useI18n();

function displayTitle(item: AdminMenuItem): string {
    const keys = resolveRouteTitleKeys(item);
    const matchedKey = keys.find((key) => te(key));
    if (matchedKey) {
        return t(matchedKey);
    }
    return item.title;
}

function resolveRouteTitleKeys(item: AdminMenuItem) {
    const keys = [];
    if (item.titleKey) {
        keys.push('route.' + item.titleKey);
    }
    if (item.path) {
        keys.push('route.' + toRouteTitleKey(item.path));
    }
    return Array.from(new Set(keys));
}

function toRouteTitleKey(path: string) {
    return path.replace(/^\/+/, '').replace(/-/g, '_').replace(/\//g, '_');
}

function groupIndex(item: AdminMenuItem) {
    return `__group__${item.path || item.titleKey || item.title}`;
}

function itemKey(item: AdminMenuItem) {
    return item.path || item.titleKey || item.title;
}
</script>
