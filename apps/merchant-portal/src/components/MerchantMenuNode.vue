<template>
    <el-sub-menu
        v-if="item.children.length"
        :index="groupIndex(item)"
        :class="{ 'is-active': isRouteActive(item) }"
        :popper-class="popperClass"
    >
        <template #title>
            <el-icon><component :is="resolveMenuIcon(item.icon)" /></el-icon>
            <span>{{ item.label }}</span>
        </template>
        <MerchantMenuNode
            v-for="child in item.children"
            :key="child.path"
            :item="child"
            :active-path="activePath"
            :popper-class="popperClass"
        />
    </el-sub-menu>
    <el-menu-item v-else :index="item.path">
        <el-icon><component :is="resolveMenuIcon(item.icon)" /></el-icon>
        <span>{{ item.label }}</span>
    </el-menu-item>
</template>

<script setup lang="ts">
import { resolveMenuIcon } from '@/utils/menuIcon';

defineOptions({
    name: 'MerchantMenuNode',
});

export interface MerchantMenuNodeItem {
    path: string;
    label: string;
    icon?: string;
    children: MerchantMenuNodeItem[];
}

const props = withDefaults(defineProps<{
    item: MerchantMenuNodeItem;
    activePath: string;
    popperClass?: string;
}>(), {
    popperClass: 'merchant-nav-popper',
});

function groupIndex(item: MerchantMenuNodeItem) {
    return `__merchant_group__${item.path || item.label}`;
}

function isRouteActive(item: MerchantMenuNodeItem): boolean {
    if (item.path === props.activePath) {
        return true;
    }
    return item.children.some(isRouteActive);
}
</script>
