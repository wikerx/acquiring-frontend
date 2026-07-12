<template>
    <li class="top-nav-mega" :class="{ 'top-nav-mega--flat': !hasNestedChildren }" role="none" @click.stop>
        <div class="top-nav-mega__groups" role="menu">
            <button
                v-for="child in visibleChildren"
                :key="itemKey(child)"
                type="button"
                class="top-nav-mega__group"
                :class="{ 'is-active': hasNestedChildren && itemKey(child) === itemKey(activeGroup) }"
                @mouseenter="activeKey = itemKey(child)"
                @focus="activeKey = itemKey(child)"
                @click="handleGroupClick(child)"
            >
                <span class="top-nav-mega__group-main">
                    <el-icon v-if="child.icon"><component :is="resolveMenuIcon(child.icon)" /></el-icon>
                    <span class="top-nav-mega__text">{{ displayTitle(child) }}</span>
                </span>
                <el-icon v-if="hasNestedChildren && child.children?.length" class="top-nav-mega__arrow"><ArrowRight /></el-icon>
            </button>
        </div>
        <div v-if="hasNestedChildren && activeGroup" class="top-nav-mega__items" role="menu">
            <div class="top-nav-mega__header">
                <span>{{ displayTitle(activeGroup) }}</span>
            </div>
            <template v-if="activeGroupChildren.length">
                <button
                    v-for="child in activeGroupChildren"
                    :key="itemKey(child)"
                    type="button"
                    class="top-nav-mega__item"
                    @click="handleLeafClick(child)"
                >
                    <span class="top-nav-mega__item-icon">
                        <el-icon v-if="child.icon"><component :is="resolveMenuIcon(child.icon)" /></el-icon>
                    </span>
                    <span class="top-nav-mega__text">{{ displayTitle(child) }}</span>
                </button>
            </template>
            <button v-else type="button" class="top-nav-mega__item is-direct" @click="handleLeafClick(activeGroup)">
                <span class="top-nav-mega__item-icon">
                    <el-icon v-if="activeGroup.icon"><component :is="resolveMenuIcon(activeGroup.icon)" /></el-icon>
                </span>
                <span class="top-nav-mega__text">{{ displayTitle(activeGroup) }}</span>
            </button>
        </div>
    </li>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ArrowRight } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { AdminMenuItem } from '@/types/admin';
import { resolveMenuIcon } from '@/utils/menu-icon';

defineOptions({
    name: 'TopNavDropdownPanel',
});

const props = defineProps<{
    item: AdminMenuItem;
}>();

const emit = defineEmits<{
    navigate: [item: AdminMenuItem];
}>();

const { t, te } = useI18n();
const activeKey = ref('');

const visibleChildren = computed(() => props.item.children?.filter((child) => child.path || child.children?.length) || []);
const hasNestedChildren = computed(() => visibleChildren.value.some((child) => navigableChildren(child.children).length > 0));
const activeGroup = computed(() => visibleChildren.value.find((child) => itemKey(child) === activeKey.value) || visibleChildren.value[0]);
const activeGroupChildren = computed(() => navigableChildren(activeGroup.value?.children));

watch(
    visibleChildren,
    (children) => {
        activeKey.value = children[0] ? itemKey(children[0]) : '';
    },
    { immediate: true },
);

function handleGroupClick(item: AdminMenuItem) {
    if (!hasNestedChildren.value || !navigableChildren(item.children).length) {
        emit('navigate', item);
    }
}

function handleLeafClick(item: AdminMenuItem) {
    emit('navigate', item);
}

function displayTitle(item?: AdminMenuItem): string {
    if (!item) {
        return '';
    }
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

function itemKey(item?: AdminMenuItem) {
    return item?.path || item?.titleKey || item?.title || '';
}

function navigableChildren(items?: AdminMenuItem[]) {
    return items?.filter((child) => child.path || child.children?.length) || [];
}
</script>
