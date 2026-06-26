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
                    <el-popover
                        v-model:visible="menuVisible"
                        trigger="click"
                        placement="bottom-end"
                        :width="288"
                        :show-arrow="false"
                        popper-class="merchant-user-menu-popper"
                    >
                        <template #reference>
                            <button class="merchant-user-trigger" type="button" :aria-label="t('layout.userMenu')">
                                <span class="merchant-user-trigger__avatar">{{ avatarText }}</span>
                                <span class="merchant-user-trigger__name">{{ displayName }}</span>
                                <el-icon class="merchant-user-trigger__arrow" :class="{ 'is-open': menuVisible }">
                                    <ArrowDown />
                                </el-icon>
                            </button>
                        </template>
                        <div class="merchant-user-menu">
                            <div class="merchant-user-menu__summary">
                                <span class="merchant-user-menu__avatar">{{ avatarText }}</span>
                                <div class="merchant-user-menu__identity">
                                    <div class="merchant-user-menu__title">{{ displayName }}</div>
                                    <div v-if="loginAccount" class="merchant-user-menu__account">{{ loginAccount }}</div>
                                    <div class="merchant-user-menu__roles">
                                        <span
                                            v-for="role in visibleRoleLabels"
                                            :key="role"
                                            class="merchant-user-menu__role-tag"
                                        >
                                            {{ role }}
                                        </span>
                                        <span v-if="hiddenRoleCount > 0" class="merchant-user-menu__role-tag merchant-user-menu__role-tag--muted">
                                            +{{ hiddenRoleCount }}
                                        </span>
                                        <span v-if="!visibleRoleLabels.length" class="merchant-user-menu__role-empty">
                                            {{ t('layout.noRole') }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div class="merchant-user-menu__section merchant-user-menu__section--danger">
                                <button class="merchant-user-menu__action merchant-user-menu__action--danger" type="button" @click="handleLogout">
                                    <el-icon><SwitchButton /></el-icon>
                                    <span>{{ t('common.logout') }}</span>
                                </button>
                            </div>
                        </div>
                    </el-popover>
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
import { ArrowDown, Close, SwitchButton } from '@element-plus/icons-vue';
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
const menuVisible = ref(false);
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
const loginAccount = computed(() => auth.session?.account.loginAccount || '');
const displayName = computed(() =>
    auth.session?.account.realName?.trim()
        || auth.session?.account.loginAccount?.trim()
        || merchantBrand.subtitleEn,
);
const avatarText = computed(() => buildAvatarText(displayName.value));
const roleLabels = computed(() =>
    Array.from(new Set((auth.session?.roles || []).map((role) => formatRoleLabel(role)).filter(Boolean))),
);
const visibleRoleLabels = computed(() => roleLabels.value.slice(0, 2));
const hiddenRoleCount = computed(() => Math.max(roleLabels.value.length - visibleRoleLabels.value.length, 0));

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
    menuVisible.value = false;
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

function buildAvatarText(value: string) {
    const source = value.trim();
    if (!source) {
        return 'M';
    }
    const first = source.charAt(0);
    return /^[A-Za-z]/.test(first) ? first.toUpperCase() : first;
}

function formatRoleLabel(roleCode: string) {
    const normalized = roleCode
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/^RO+LE_/, 'ROLE_')
        .toUpperCase();
    if (!normalized) {
        return '';
    }
    const presetLabels = {
        MERCHANT_ADMIN: t('layout.merchantAdmin'),
        ROLE_MERCHANT_ADMIN: t('layout.merchantAdmin'),
        MERCHANT_OPERATOR: t('layout.merchantOperator'),
        ROLE_MERCHANT_OPERATOR: t('layout.merchantOperator'),
    };
    if (presetLabels[normalized as keyof typeof presetLabels]) {
        return presetLabels[normalized as keyof typeof presetLabels];
    }
    return normalized.replace(/^ROLE_/, '').split('_').filter(Boolean)
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}
</script>

<style scoped>
.merchant-user-trigger {
    display: flex;
    align-items: center;
    gap: 9px;
    height: 40px;
    padding: 0 12px 0 6px;
    color: #101828;
    background: #eafaf4;
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.merchant-user-trigger:hover,
.merchant-user-trigger:focus-visible {
    color: #047857;
    background: #ddf7ec;
    box-shadow: 0 8px 18px rgb(16 185 129 / 14%);
    outline: none;
}

.merchant-user-trigger__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #fff;
    background: linear-gradient(135deg, #10b981, #047857);
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
    box-shadow: 0 8px 16px rgb(16 185 129 / 24%);
}

.merchant-user-trigger__name {
    max-width: 138px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 700;
}

.merchant-user-trigger__arrow {
    font-size: 12px;
    color: #10b981;
    transition: transform 0.2s ease, color 0.2s ease;
}

.merchant-user-trigger__arrow.is-open {
    transform: rotate(180deg);
}

:global(.merchant-user-menu-popper.el-popper) {
    padding: 0 !important;
    overflow: hidden;
    border: 1px solid rgb(15 23 42 / 8%) !important;
    border-radius: 18px !important;
    box-shadow: 0 20px 44px rgb(15 23 42 / 16%) !important;
}

.merchant-user-menu {
    background: #fff;
}

.merchant-user-menu__summary {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 18px;
}

.merchant-user-menu__avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    color: #fff;
    background: linear-gradient(135deg, #10b981, #047857);
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: 0 10px 18px rgb(16 185 129 / 24%);
}

.merchant-user-menu__identity {
    min-width: 0;
    flex: 1;
}

.merchant-user-menu__title {
    font-size: 15px;
    font-weight: 700;
    line-height: 1.4;
    color: #101828;
}

.merchant-user-menu__account {
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.5;
    color: #667085;
}

.merchant-user-menu__roles {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}

.merchant-user-menu__role-tag {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    color: #047857;
    background: rgb(16 185 129 / 12%);
}

.merchant-user-menu__role-tag--muted {
    color: #475467;
    background: #f2f4f7;
}

.merchant-user-menu__role-empty {
    font-size: 12px;
    color: #98a2b3;
}

.merchant-user-menu__section {
    padding: 8px;
    border-top: 1px solid #f2f4f7;
}

.merchant-user-menu__section--danger {
    background: linear-gradient(180deg, rgb(248 250 252 / 60%), rgb(255 255 255 / 96%));
}

.merchant-user-menu__action {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: 40px;
    padding: 0 10px;
    color: #344054;
    background: transparent;
    border: 0;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: background-color 0.2s ease, color 0.2s ease;
}

.merchant-user-menu__action:hover,
.merchant-user-menu__action:focus-visible {
    color: #d92d20;
    background: rgb(217 45 32 / 8%);
    outline: none;
}

@media (max-width: 768px) {
    .merchant-user-trigger {
        padding-right: 8px;
    }

    .merchant-user-trigger__name {
        display: none;
    }
}
</style>
