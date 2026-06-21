<template>
    <header class="layout-navbar">
        <div class="navbar-left">
            <el-button
                v-if="showCollapse !== false"
                class="navbar-icon-button"
                text
                :icon="collapsed ? Expand : Fold"
                @click="$emit('toggle')"
            />
            <Breadcrumb />
        </div>
        <div class="navbar-right">
            <LanguageSwitch />
            <el-tooltip :content="$t('settings.title')" effect="dark" placement="bottom">
                <el-button class="navbar-icon-button" text circle :icon="Setting" @click="settingsPanelRef?.open()" />
            </el-tooltip>
            <el-tooltip :content="isFullscreen ? $t('layout.exitFullscreen') : $t('layout.fullscreen')" effect="dark">
                <el-button class="navbar-icon-button" text circle :icon="FullScreen" @click="toggleFullscreen" />
            </el-tooltip>
            <el-popover
                v-model:visible="menuVisible"
                trigger="click"
                placement="bottom-end"
                :width="288"
                :show-arrow="false"
                popper-class="user-menu-popper"
            >
                <template #reference>
                    <button class="user-trigger" type="button" :aria-label="$t('layout.userMenu')">
                        <span class="user-trigger__avatar">{{ avatarText }}</span>
                        <span class="user-trigger__name">{{ displayName }}</span>
                        <el-icon class="user-trigger__arrow" :class="{ 'is-open': menuVisible }">
                            <ArrowDown />
                        </el-icon>
                    </button>
                </template>
                <div class="user-menu">
                    <div class="user-menu__summary">
                        <span class="user-menu__avatar">{{ avatarText }}</span>
                        <div class="user-menu__identity">
                            <div class="user-menu__title">{{ displayName }}</div>
                            <div v-if="loginAccount" class="user-menu__account">{{ loginAccount }}</div>
                            <div class="user-menu__roles">
                                <span
                                    v-for="role in visibleRoleLabels"
                                    :key="role"
                                    class="user-menu__role-tag"
                                >
                                    {{ role }}
                                </span>
                                <span v-if="hiddenRoleCount > 0" class="user-menu__role-tag user-menu__role-tag--muted">
                                    +{{ hiddenRoleCount }}
                                </span>
                                <span v-if="!visibleRoleLabels.length" class="user-menu__role-empty">
                                    {{ $t('layout.noRole') }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div v-if="canViewLoginLog" class="user-menu__section">
                        <button class="user-menu__action" type="button" @click="handleOpenLoginLog">
                            <el-icon><Document /></el-icon>
                            <span>{{ $t('layout.loginLog') }}</span>
                        </button>
                    </div>
                    <div class="user-menu__section user-menu__section--danger">
                        <button class="user-menu__action user-menu__action--danger" type="button" @click="handleLogout">
                            <el-icon><SwitchButton /></el-icon>
                            <span>{{ $t('layout.logout') }}</span>
                        </button>
                    </div>
                </div>
            </el-popover>
        </div>
        <SettingsPanel ref="settingsPanelRef" />
    </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ArrowDown, Document, Expand, Fold, FullScreen, Setting, SwitchButton } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import Breadcrumb from './Breadcrumb.vue';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';
import SettingsPanel from '@/components/SettingsPanel/index.vue';

const settingsPanelRef = ref<InstanceType<typeof SettingsPanel>>();
const menuVisible = ref(false);
const isFullscreen = ref(false);
const { t, locale } = useI18n();

const props = defineProps<{
    collapsed: boolean;
    userName: string;
    loginAccount?: string;
    roles: string[];
    canViewLoginLog?: boolean;
    showCollapse?: boolean;
}>();

const emit = defineEmits<{
    toggle: [];
    logout: [];
    openLoginLog: [];
}>();

const displayName = computed(() => props.userName?.trim() || 'Admin');
const avatarText = computed(() => buildAvatarText(displayName.value));
const roleLabels = computed(() =>
    Array.from(
        new Set(
            props.roles
                .map((role) => formatRoleLabel(role))
                .filter((role): role is string => Boolean(role)),
        ),
    ),
);
const visibleRoleLabels = computed(() => roleLabels.value.slice(0, 2));
const hiddenRoleCount = computed(() => Math.max(roleLabels.value.length - visibleRoleLabels.value.length, 0));

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function handleLogout() {
    menuVisible.value = false;
    emit('logout');
}

function handleOpenLoginLog() {
    menuVisible.value = false;
    emit('openLoginLog');
}

function syncFullscreenState() {
    isFullscreen.value = Boolean(document.fullscreenElement);
}

function buildAvatarText(value: string) {
    const source = value.trim();
    if (!source) {
        return 'A';
    }
    const first = source.charAt(0);
    return /^[A-Za-z]/.test(first) ? first.toUpperCase() : first;
}

function normalizeRoleCode(roleCode: string) {
    return roleCode
        .trim()
        .replace(/[\s-]+/g, '_')
        .replace(/^RO+LE_/, 'ROLE_')
        .toUpperCase();
}

function formatRoleLabel(roleCode: string) {
    const normalized = normalizeRoleCode(roleCode);
    if (!normalized) {
        return '';
    }

    const isChinese = locale.value !== 'en-US';
    const presetLabels = isChinese
        ? {
              ADMIN_OPERATOR: '管理员',
              SUPER_ADMIN: '超级管理员',
              ROLE_TEST: '测试角色',
          }
        : {
              ADMIN_OPERATOR: 'Administrator',
              SUPER_ADMIN: 'Super Admin',
              ROLE_TEST: 'Test Role',
          };

    if (presetLabels[normalized as keyof typeof presetLabels]) {
        return presetLabels[normalized as keyof typeof presetLabels];
    }

    const stripped = normalized.replace(/^ROLE_/, '');
    const words = stripped.split('_').filter(Boolean);
    if (!words.length) {
        return t('layout.noRole');
    }

    if (isChinese) {
        const zhWordMap: Record<string, string> = {
            ADMIN: '管理',
            OPERATOR: '员',
            AUDIT: '审计',
            FINANCE: '财务',
            MANAGER: '经理',
            MERCHANT: '商户',
            PAYMENT: '支付',
            REVIEW: '审核',
            RISK: '风控',
            SUPPORT: '支持',
            SYSTEM: '系统',
            TEST: '测试',
            VIEW: '查看',
        };
        const translated = words.map((word) => zhWordMap[word] || '');
        if (translated.every(Boolean)) {
            const joined = translated.join('');
            return /员$|经理$/.test(joined) ? joined : `${joined}${t('layout.roleSuffix')}`;
        }
    }

    return words
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

onMounted(() => {
    syncFullscreenState();
    document.addEventListener('fullscreenchange', syncFullscreenState);
});

onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState);
});
</script>
