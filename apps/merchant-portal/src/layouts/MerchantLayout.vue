<template>
    <el-container class="app-shell">
        <el-aside width="224px" class="app-sidebar">
            <div class="brand">
                <span class="brand-mark">M</span>
                <div>
                    <strong>Merchant Portal</strong>
                    <small>{{ auth.session?.account.merchantId || 'Merchant' }}</small>
                </div>
            </div>
            <el-menu :default-active="$route.path" router>
                <el-menu-item v-for="item in menuItems" :key="item.path" :index="item.path">
                    {{ item.label }}
                </el-menu-item>
            </el-menu>
        </el-aside>
        <el-container>
            <el-header class="app-header">
                <div class="header-title">
                    <strong>{{ currentTitle }}</strong>
                    <span>{{ auth.session?.account.loginAccount }}</span>
                </div>
                <el-button type="primary" plain @click="handleLogout">退出</el-button>
            </el-header>
            <el-main>
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
    import { computed } from 'vue';
    import { useRouter } from 'vue-router';
    import type { AuthMenu } from '@acquiring/shared';
    import { logout } from '@/api/authApi';
    import { useAuthStore } from '@/stores/authStore';

    const router = useRouter();
    const auth = useAuthStore();
    const fallbackMenus = [
        { path: '/dashboard', label: '商户首页' },
        { path: '/transactions', label: '交易查询' },
        { path: '/settlements', label: '结算查询' },
        { path: '/account', label: '账户信息' },
    ];
    const menuItems = computed(() => {
        const backendMenus = flattenMenus(auth.session?.menus || [])
            .filter((menu) => menu.menuType === 'MENU' && menu.routePath)
            .map((menu) => ({ path: menu.routePath || '/dashboard', label: menu.menuName }));
        return backendMenus.length > 0 ? backendMenus : fallbackMenus;
    });
    const currentTitle = computed(
        () => menuItems.value.find((item) => item.path === router.currentRoute.value.path)?.label || '商户首页',
    );

    async function handleLogout() {
        await logout().catch(() => undefined);
        auth.clearSession();
        await router.push('/login');
    }

    function flattenMenus(menus: AuthMenu[]): AuthMenu[] {
        return menus.flatMap((menu) => [menu, ...flattenMenus(menu.children || [])]);
    }
</script>
