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
            <el-menu :default-active="$route.path" router class="side-menu">
                <template v-for="item in menuItems" :key="item.path">
                    <el-sub-menu v-if="item.children.length" :index="item.path">
                        <template #title>
                            <el-icon><component :is="resolveMenuIcon(item.icon)" /></el-icon>
                            <span>{{ item.label }}</span>
                        </template>
                        <el-menu-item v-for="child in item.children" :key="child.path" :index="child.path">
                            <el-icon><component :is="resolveMenuIcon(child.icon)" /></el-icon>
                            {{ child.label }}
                        </el-menu-item>
                    </el-sub-menu>
                    <el-menu-item v-else :index="item.path">
                        <el-icon><component :is="resolveMenuIcon(item.icon)" /></el-icon>
                        {{ item.label }}
                    </el-menu-item>
                </template>
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
            <div class="merchant-breadcrumb-bar">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item>{{ merchantBrand.name }}</el-breadcrumb-item>
                    <el-breadcrumb-item v-for="item in breadcrumbItems" :key="item.path">
                        {{ item.label }}
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </div>
            <div class="merchant-tags-view">
                <button
                    v-for="tag in visitedTags"
                    :key="tag.path"
                    type="button"
                    class="merchant-tag"
                    :class="{ active: tag.path === $route.path }"
                    @click="router.push(tag.path)"
                >
                    <el-icon v-if="tag.icon"><component :is="resolveMenuIcon(tag.icon)" /></el-icon>
                    <span>{{ tag.label }}</span>
                    <el-icon v-if="tag.path !== '/dashboard'" class="merchant-tag__close" @click.stop="closeTag(tag.path)">
                        <Close />
                    </el-icon>
                </button>
            </div>
            <el-main class="merchant-main">
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Close } from '@element-plus/icons-vue';
import { getSystemBrand, type AuthMenu } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { logout } from '@/api/authApi';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { useAuthStore } from '@/stores/authStore';
import { normalizeMenuPath } from '@/utils/menu';
import { resolveMenuIcon } from '@/utils/menuIcon';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const { t } = useI18n();
const merchantBrand = getSystemBrand('merchant');
const fallbackMenus = computed<MenuItem[]>(() => [
    { path: '/dashboard', label: t('layout.dashboard'), icon: 'House', children: [] },
    { path: '/transactions', label: t('layout.transactions'), icon: 'Tickets', children: [] },
    { path: '/settlements', label: t('layout.settlements'), icon: 'Money', children: [] },
    { path: '/account', label: t('layout.account'), icon: 'User', children: [] },
]);
const menuItems = computed(() => {
    const backendMenus = buildMenuItems(auth.session?.menus || []);
    return backendMenus.length > 0 ? backendMenus : fallbackMenus.value;
});
const currentTitle = computed(
    () => findMenuLabel(menuItems.value, router.currentRoute.value.path) || t('layout.dashboard'),
);
const breadcrumbItems = computed(() => findMenuTrail(menuItems.value, route.path));
const visitedTags = ref<MenuTag[]>([]);

watch(
    () => [route.path, currentTitle.value, menuItems.value] as const,
    () => {
        if (route.path === '/login') {
            return;
        }
        const label = currentTitle.value;
        const icon = findMenuIcon(menuItems.value, route.path);
        const existing = visitedTags.value.find((tag) => tag.path === route.path);
        if (existing) {
            existing.label = label;
            existing.icon = icon;
        } else {
            visitedTags.value.push({ path: route.path, label, icon });
        }
    },
    { immediate: true },
);

async function handleLogout() {
    await logout().catch(() => undefined);
    auth.clearSession();
    visitedTags.value = [];
    await router.push('/login');
}

interface MenuItem {
    path: string;
    label: string;
    icon?: string;
    children: MenuItem[];
}

interface MenuTag {
    path: string;
    label: string;
    icon?: string;
}

function buildMenuItems(menus: AuthMenu[]): MenuItem[] {
    return menus
        .filter((menu) => menu.visible !== 0 && menu.menuType !== 'BUTTON')
        .map((menu) => ({
            path: normalizeMenuPath(menu.routePath) || `/${menu.menuCode}`,
            label: menu.menuName,
            icon: menu.icon,
            children: buildMenuItems(menu.children || []),
        }))
        .filter((menu) => menu.children.length > 0 || menu.path);
}

function findMenuLabel(menus: MenuItem[], path: string): string | undefined {
    for (const menu of menus) {
        if (menu.path === path) {
            return menu.label;
        }
        const childLabel = findMenuLabel(menu.children, path);
        if (childLabel) {
            return childLabel;
        }
    }
    return undefined;
}

function findMenuIcon(menus: MenuItem[], path: string): string | undefined {
    for (const menu of menus) {
        if (menu.path === path) {
            return menu.icon;
        }
        const childIcon = findMenuIcon(menu.children, path);
        if (childIcon) {
            return childIcon;
        }
    }
    return undefined;
}

function findMenuTrail(menus: MenuItem[], path: string, parents: MenuItem[] = []): MenuItem[] {
    for (const menu of menus) {
        const currentTrail = [...parents, menu];
        if (menu.path === path) {
            return currentTrail;
        }
        const childTrail = findMenuTrail(menu.children, path, currentTrail);
        if (childTrail.length) {
            return childTrail;
        }
    }
    return [];
}

async function closeTag(path: string) {
    visitedTags.value = visitedTags.value.filter((tag) => tag.path !== path);
    if (route.path === path) {
        const latest = visitedTags.value[visitedTags.value.length - 1];
        await router.push(latest?.path || '/dashboard');
    }
}
</script>
