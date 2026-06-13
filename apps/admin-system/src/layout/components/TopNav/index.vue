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
                        <el-icon v-if="item.icon"><component :is="resolveIcon(item.icon)" /></el-icon>
                        <span>{{ displayTitle(item) }}</span>
                    </template>
                    <el-menu-item
                        v-for="child in item.children"
                        :key="child.path || child.title"
                        :index="child.path"
                    >
                        <el-icon v-if="child.icon"><component :is="resolveIcon(child.icon)" /></el-icon>
                        <span>{{ displayTitle(child) }}</span>
                    </el-menu-item>
                </el-sub-menu>
                <!-- Leaf menu → direct link -->
                <el-menu-item v-else :index="item.path">
                    <el-icon v-if="item.icon"><component :is="resolveIcon(item.icon)" /></el-icon>
                    <span>{{ displayTitle(item) }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </nav>
</template>

<script setup lang="ts">
import { computed, type Component } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
    House, Setting, Shop, DataLine, Key, Lock,
    Monitor, Location, Coin, Connection, DocumentChecked, Menu,
    Avatar, Grid, OfficeBuilding, Tickets, User,
} from '@element-plus/icons-vue';
import type { AdminMenuItem } from '@/types/admin';

const { t, te } = useI18n();

defineProps<{
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
    if (index && index.startsWith('/')) {
        router.push(index);
    }
}

const icons: Record<string, Component> = {
    House, Setting, Shop, DataLine, Key, Lock,
    Monitor, Location, Coin, Connection, DocumentChecked, Menu,
    Avatar, Grid, OfficeBuilding, Tickets, User,
};

function resolveIcon(name?: string) {
    return name ? icons[name] || House : House;
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
