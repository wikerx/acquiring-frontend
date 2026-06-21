<template>
    <el-container class="app-shell">
        <el-aside width="224px" class="app-sidebar">
            <div class="brand">
                <img class="brand-mark" :src="merchantBrand.logos.icon" :alt="merchantBrand.name" />
                <div>
                    <strong>{{ merchantBrand.name }}</strong>
                    <small>{{ auth.session?.account.merchantId || merchantBrand.subtitleEn }}</small>
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
                <div class="merchant-header-actions">
                    <LanguageSwitch />
                    <el-button type="primary" plain @click="handleLogout">{{ t('common.logout') }}</el-button>
                </div>
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
import { getSystemBrand, type AuthMenu } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { logout } from '@/api/authApi';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const merchantBrand = getSystemBrand('merchant');
const fallbackMenus = computed(() => [
    { path: '/dashboard', label: t('layout.dashboard') },
    { path: '/transactions', label: t('layout.transactions') },
    { path: '/settlements', label: t('layout.settlements') },
    { path: '/account', label: t('layout.account') },
]);
const menuItems = computed(() => {
    const backendMenus = flattenMenus(auth.session?.menus || [])
        .filter((menu) => menu.menuType === 'MENU' && menu.routePath)
        .map((menu) => ({ path: menu.routePath || '/dashboard', label: menu.menuName }));
    return backendMenus.length > 0 ? backendMenus : fallbackMenus.value;
});
const currentTitle = computed(
    () => menuItems.value.find((item) => item.path === router.currentRoute.value.path)?.label || t('layout.dashboard'),
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
