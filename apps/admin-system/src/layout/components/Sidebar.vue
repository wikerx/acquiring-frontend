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
            router
            class="side-menu"
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
                        :index="child.path"
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
import { useRoute } from 'vue-router';
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

defineProps<{
    menus: AdminMenuItem[];
    collapsed: boolean;
    sideTheme?: 'dark' | 'light';
    showLogo?: boolean;
}>();

const route = useRoute();

const activePath = computed(() => {
    return route.path || '/dashboard';
});

function itemKey(item: AdminMenuItem) {
    return item.path || item.title || Math.random().toString(36);
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
