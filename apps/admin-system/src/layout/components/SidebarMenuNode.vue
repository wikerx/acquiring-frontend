<template>
    <el-sub-menu v-if="item.children?.length" :index="groupIndex(item)">
        <template #title>
            <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
            <span>{{ displayTitle(item) }}</span>
        </template>
        <SidebarMenuNode
            v-for="child in item.children"
            :key="itemKey(child)"
            :item="child"
        />
    </el-sub-menu>
    <el-menu-item v-else-if="item.path" :index="item.path">
        <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
        <span>{{ displayTitle(item) }}</span>
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
    if (item.titleKey) {
        const key = 'route.' + item.titleKey;
        return te(key) ? t(key) : item.title;
    }
    return item.title;
}

function groupIndex(item: AdminMenuItem) {
    return `__group__${item.path || item.titleKey || item.title}`;
}

function itemKey(item: AdminMenuItem) {
    return item.path || item.titleKey || item.title;
}
</script>
