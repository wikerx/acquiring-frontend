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
                <div class="merchant-home-identity__mark">{{ merchantBrand.name }}</div>
            </div>
        </section>

        <section class="merchant-home-grid">
            <article v-for="item in summaryCards" :key="item.label" class="merchant-home-summary-card">
                <div class="merchant-home-summary-card__icon" :class="`merchant-home-summary-card__icon--${item.tone}`">
                    <el-icon><component :is="item.icon" /></el-icon>
                </div>
                <div>
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </div>
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
                        <span class="merchant-home-entry__icon">
                            <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        </span>
                        <span>
                            <strong>{{ entry.label }}</strong>
                            <small>{{ entry.description }}</small>
                        </span>
                        <el-icon class="merchant-home-entry__arrow"><ArrowRight /></el-icon>
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
                    <div class="merchant-home-profile__item">
                        <span>{{ t('home.roles') }}</span>
                        <strong>{{ roleText }}</strong>
                    </div>
                    <div class="merchant-home-profile__item">
                        <span>{{ t('home.permissions') }}</span>
                        <strong>{{ permissionCount }}</strong>
                    </div>
                    <div class="merchant-home-profile__item">
                        <span>{{ t('home.menuCount') }}</span>
                        <strong>{{ featureCount }}</strong>
                    </div>
                    <el-button v-if="roleEntry" class="merchant-home-profile__button" text type="primary" @click="router.push(roleEntry.path)">
                        {{ t('home.viewPermissionDetail') }}
                        <el-icon><ArrowRight /></el-icon>
                    </el-button>
                </div>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowRight, Grid, Key, Shop, User } from '@element-plus/icons-vue';
import { getSystemBrand } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/authStore';
import { flattenRouteMenus, normalizeMenuPath, resolveMerchantMenuLabel, withMerchantHomeMenu } from '@/utils/menu';
import { resolveMenuIcon } from '@/utils/menuIcon';

const router = useRouter();
const auth = useAuthStore();
const { t, te } = useI18n();
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
            label: resolveMerchantMenuLabel(menu, t, te),
            description: menuEntryDescription(normalizeMenuPath(menu.routePath)),
            icon: menu.icon,
        }))
        .filter((menu) => menu.path && menu.path !== '/home')
        .map((menu) => ({
            path: menu.path,
            label: menu.label,
            description: menu.description,
            icon: menu.icon,
        })),
);
const primaryEntries = computed(() => menuEntries.value.slice(0, 3));
const roleEntry = computed(() => menuEntries.value.find((entry) => entry.path === '/system/role' || entry.path === '/system/role-auth'));
const featureCount = computed(() => String(menuEntries.value.length));
const permissionCount = computed(() => permissions.value.includes('*:*:*') ? t('home.allPermissions') : String(permissions.value.length));
const roleText = computed(() => roles.value.length ? roles.value.join(', ') : t('layout.noRole'));
const summaryCards = computed(() => [
    { label: t('home.merchantId'), value: merchantId.value, hint: t('home.merchantIdHint'), icon: Shop, tone: 'blue' },
    { label: t('home.loginAccount'), value: loginAccount.value, hint: t('home.loginAccountHint'), icon: User, tone: 'green' },
    { label: t('home.availableFeatures'), value: featureCount.value, hint: t('home.availableFeaturesHint'), icon: Grid, tone: 'indigo' },
    { label: t('home.permissionScope'), value: permissionCount.value, hint: t('home.permissionScopeHint'), icon: Key, tone: 'violet' },
]);

function menuEntryDescription(path: string) {
    const descriptions: Record<string, string> = {
        '/merchant-info': t('home.entryMerchantInfoDesc'),
        '/merchant-info/openapi-keys': t('home.entryOpenapiKeysDesc'),
        '/system/dept': t('home.entryDeptDesc'),
        '/system/post': t('home.entryPostDesc'),
        '/system/account': t('home.entryAccountDesc'),
        '/system/role': t('home.entryRoleDesc'),
        '/system/role-auth': t('home.entryRoleAuthDesc'),
    };
    return descriptions[path] || t('home.entryDefaultDesc');
}
</script>
