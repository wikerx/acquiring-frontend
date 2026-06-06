<template>
    <template v-for="item in normalizedMenus" :key="item.menuCode">
        <el-sub-menu v-if="item.children.length" :index="item.menuCode">
            <template #title>
                <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
                <span>{{ item.menuName }}</span>
            </template>
            <SidebarMenu :menus="item.children" />
        </el-sub-menu>
        <el-menu-item v-else-if="item.routePath" :index="item.routePath">
            <el-icon><component :is="resolveIcon(item.icon)" /></el-icon>
            <span>{{ item.menuName }}</span>
        </el-menu-item>
    </template>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import type { Component } from 'vue';
    import type { AuthMenu } from '@acquiring/shared';
    import {
        Coin,
        Connection,
        DataAnalysis,
        Document,
        Files,
        Grid,
        Histogram,
        House,
        Key,
        List,
        Lock,
        Location,
        Management,
        Menu as MenuIcon,
        Money,
        OfficeBuilding,
        Operation,
        Postcard,
        Setting,
        Shop,
        Tickets,
        User,
        Wallet,
        Warning,
    } from '@element-plus/icons-vue';

    defineOptions({ name: 'SidebarMenu' });

    const props = defineProps<{
        menus: AuthMenu[];
    }>();

    const iconMap: Record<string, Component> = {
        account: User,
        base: Files,
        channel: Connection,
        config: Setting,
        country: Location,
        currency: Coin,
        dashboard: DataAnalysis,
        dept: OfficeBuilding,
        dict: Tickets,
        key: Key,
        lock: Lock,
        log: Document,
        merchant: Shop,
        menu: MenuIcon,
        order: List,
        payment: Money,
        payout: Wallet,
        post: Postcard,
        refund: Operation,
        risk: Warning,
        role: Lock,
        setting: Setting,
        settlement: Histogram,
        shop: Shop,
        system: Management,
        transaction: Grid,
        user: User,
    };

    const normalizedMenus = computed(() =>
        props.menus
            .filter((menu) => menu.visible !== 0)
            .map((menu) => ({
                ...menu,
                children: (menu.children || [])
                    .filter((child) => child.visible !== 0)
                    .sort(sortMenu),
            }))
            .filter((menu) => menu.routePath || menu.children.length > 0)
            .sort(sortMenu),
    );

    function sortMenu(left: AuthMenu, right: AuthMenu) {
        return (left.sortNo || 0) - (right.sortNo || 0);
    }

    function resolveIcon(icon?: string): Component {
        if (!icon) {
            return House;
        }
        return iconMap[icon] || iconMap[icon.toLowerCase()] || House;
    }
</script>
