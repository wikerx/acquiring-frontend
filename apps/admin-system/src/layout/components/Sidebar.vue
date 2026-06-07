<template>
    <aside class="layout-sidebar" :class="{ collapsed }">
        <div class="brand">
            <span class="brand-mark">A</span>
            <div v-if="!collapsed">
                <strong>Acquiring Admin</strong>
                <small>Global Payment Console</small>
            </div>
        </div>
        <el-menu
            :default-active="$route.path"
            :collapse="collapsed"
            router
            class="side-menu"
        >
            <template v-for="item in menus" :key="item.title">
                <el-sub-menu v-if="item.children?.length" :index="item.title">
                    <template #title>
                        <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
                        <span>{{ item.title }}</span>
                    </template>
                    <el-menu-item
                        v-for="child in item.children"
                        :key="child.path"
                        :index="child.path"
                    >
                        <el-icon><component :is="resolveIcon(child.icon)" /></el-icon>
                        <span>{{ child.title }}</span>
                    </el-menu-item>
                </el-sub-menu>
                <el-menu-item v-else-if="item.path" :index="item.path">
                    <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
                    <span>{{ item.title }}</span>
                </el-menu-item>
            </template>
        </el-menu>
    </aside>
</template>

<script setup lang="ts">
import type { Component } from 'vue';
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
}>();

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

function resolveIcon(name: string) {
    return icons[name] || House;
}
</script>
