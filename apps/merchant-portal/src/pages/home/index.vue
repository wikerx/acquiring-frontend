<template>
    <div class="page merchant-home-page">
        <section class="merchant-home-hero">
            <div>
                <p class="merchant-home-hero__eyebrow">{{ t('home.eyebrow') }}</p>
                <h1>{{ t('home.title', { name: displayName }) }}</h1>
                <p class="merchant-home-hero__description">
                    {{ t('home.description') }}
                </p>
                <div class="merchant-home-hero__actions">
                    <el-button v-for="entry in primaryEntries" :key="entry.path" type="primary" plain @click="router.push(entry.path)">
                        <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        <span>{{ entry.label }}</span>
                    </el-button>
                </div>
            </div>
            <div class="merchant-home-identity">
                <span>{{ t('home.currentMerchant') }}</span>
                <strong>{{ merchantId }}</strong>
                <small>{{ loginAccount }}</small>
            </div>
        </section>

        <section class="merchant-home-grid">
            <article v-for="item in summaryCards" :key="item.label" class="merchant-home-summary-card">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.hint }}</small>
            </article>
        </section>

        <section class="merchant-home-content">
            <article class="merchant-home-panel">
                <div class="merchant-home-panel__head">
                    <div>
                        <h2>{{ t('home.quickEntry') }}</h2>
                        <p>{{ t('home.quickEntryDesc') }}</p>
                    </div>
                </div>
                <div class="merchant-home-entry-list">
                    <button v-for="entry in menuEntries" :key="entry.path" class="merchant-home-entry" type="button" @click="router.push(entry.path)">
                        <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        <span>{{ entry.label }}</span>
                    </button>
                </div>
            </article>

            <article class="merchant-home-panel">
                <div class="merchant-home-panel__head">
                    <div>
                        <h2>{{ t('home.securityProfile') }}</h2>
                        <p>{{ t('home.securityProfileDesc') }}</p>
                    </div>
                </div>
                <div class="merchant-home-profile">
                    <div>
                        <span>{{ t('home.roles') }}</span>
                        <strong>{{ roleText }}</strong>
                    </div>
                    <div>
                        <span>{{ t('home.permissions') }}</span>
                        <strong>{{ permissionCount }}</strong>
                    </div>
                    <div>
                        <span>{{ t('home.menuCount') }}</span>
                        <strong>{{ featureCount }}</strong>
                    </div>
                </div>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { getSystemBrand } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';
import { flattenRouteMenus, normalizeMenuPath, withMerchantHomeMenu } from '@/utils/menu';
import { resolveMenuIcon } from '@/utils/menuIcon';

const router = useRouter();
const auth = useAuthStore();
const { t } = useI18n();
const merchantBrand = getSystemBrand('merchant');

const account = computed(() => auth.session?.account);
const displayName = computed(() => account.value?.realName || account.value?.loginAccount || merchantBrand.subtitleZh);
const merchantId = computed(() => account.value?.merchantId || '-');
const loginAccount = computed(() => account.value?.loginAccount || '-');
const roles = computed(() => auth.session?.roles || []);
const permissions = computed(() => auth.session?.permissions || []);
const menus = computed(() => withMerchantHomeMenu(auth.session?.menus || []));
const menuEntries = computed(() =>
    flattenRouteMenus(menus.value)
        .map((menu) => ({
            path: normalizeMenuPath(menu.routePath),
            label: menu.menuName,
            icon: menu.icon,
        }))
        .filter((menu) => menu.path && menu.path !== '/home')
        .map((menu) => ({
            path: menu.path,
            label: menu.label,
            icon: menu.icon,
        })),
);
const primaryEntries = computed(() => menuEntries.value.slice(0, 3));
const featureCount = computed(() => String(menuEntries.value.length));
const permissionCount = computed(() => permissions.value.includes('*:*:*') ? t('home.allPermissions') : String(permissions.value.length));
const roleText = computed(() => roles.value.length ? roles.value.join(', ') : t('layout.noRole'));
const summaryCards = computed(() => [
    { label: t('home.merchantId'), value: merchantId.value, hint: t('home.merchantIdHint') },
    { label: t('home.loginAccount'), value: loginAccount.value, hint: t('home.loginAccountHint') },
    { label: t('home.availableFeatures'), value: featureCount.value, hint: t('home.availableFeaturesHint') },
    { label: t('home.permissionScope'), value: permissionCount.value, hint: t('home.permissionScopeHint') },
]);
</script>
