<template>
    <el-sub-menu
        v-if="item.children?.length"
        :index="groupIndex(item)"
        :class="{ 'is-active': isRouteActive(item) }"
        :popper-class="topNavPopperClass"
    >
        <template #title>
            <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
            <span>{{ displayTitle(item) }}</span>
        </template>
        <TopNavDropdownPanel :item="item" @navigate="handleNavigate" />
    </el-sub-menu>
    <el-menu-item v-else-if="item.path" :index="item.path">
        <el-icon v-if="item.icon"><component :is="resolveMenuIcon(item.icon)" /></el-icon>
        <span>{{ displayTitle(item) }}</span>
    </el-menu-item>
</template>

<script setup lang="ts">
import { inject, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AdminMenuItem } from '@/types/admin';
import { resolveMenuIcon } from '@/utils/menu-icon';
import TopNavDropdownPanel from './TopNavDropdownPanel.vue';

defineOptions({
    name: 'TopNavMenuNode',
});

const props = defineProps<{
    item: AdminMenuItem;
    activePath: string;
}>();

const emit = defineEmits<{
    navigate: [item: AdminMenuItem];
}>();

const { t, te } = useI18n();
const topNavPopperClass = inject<ComputedRef<string>>('topNavPopperClass');

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
    return `__top_group__${item.path || item.titleKey || item.title}`;
}

function handleNavigate(item: AdminMenuItem) {
    emit('navigate', item);
}

function isRouteActive(item: AdminMenuItem): boolean {
    if (item.path && item.path === props.activePath) {
        return true;
    }
    return Boolean(item.children?.some(isRouteActive));
}
</script>
