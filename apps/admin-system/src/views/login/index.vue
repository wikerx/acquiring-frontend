<template>
    <main class="login-page">
        <div class="login-page__toolbar">
            <div class="login-lang-switch">
                <LanguageSwitch />
            </div>
        </div>
        <div class="login-page__grid">
            <section class="login-hero">
                <div class="login-hero__eyebrow">{{ $t('login.brandEyebrow') }}</div>
                <div
                    class="login-hero__brand-lockup"
                    role="img"
                    :aria-label="adminBrand.name"
                    translate="no"
                >
                    <img
                        class="login-hero__brand-icon"
                        :src="adminBrand.logos.icon"
                        alt=""
                        aria-hidden="true"
                        :draggable="false"
                    />
                    <div class="login-hero__brand-copy">
                        <div class="login-hero__brand-name">
                            <span>{{ VEXRA_BRAND.brandName }}</span>
                            <i aria-hidden="true"></i>
                            <strong>{{ adminProductName }}</strong>
                        </div>
                        <small>{{ adminBrand.subtitleEn }}</small>
                    </div>
                </div>
                <div class="login-hero__title-group">
                    <h1>{{ $t('login.heroTitle') }}</h1>
                    <p>{{ heroDescription }}</p>
                </div>
                <div class="login-hero__chips">
                    <span v-for="tag in heroTags" :key="tag" class="login-hero__chip">{{ tag }}</span>
                </div>
                <div class="login-hero__metrics">
                    <div v-for="item in heroMetrics" :key="item.label" class="login-hero__metric">
                        <strong>{{ item.value }}</strong>
                        <span>{{ item.label }}</span>
                    </div>
                </div>
                <div class="login-hero__fullname">{{ brandFullName }}</div>
            </section>
            <section class="login-panel">
                <div class="login-panel__card">
                    <div class="login-brand">
                        <img class="brand-mark brand-icon" :src="adminBrand.logos.icon" :alt="adminBrand.name" />
                        <div>
                            <h2>{{ $t('login.panelTitle') }}</h2>
                            <small>{{ $t('login.panelSubtitle') }}</small>
                        </div>
                    </div>
                    <div class="login-brand-story">
                        {{ panelDescription }}
                    </div>

                    <el-form
                        v-if="loginStage === 'credentials'"
                        ref="formRef"
                        :model="form"
                        :rules="rules"
                        class="login-form"
                        size="default"
                        @submit.prevent="handleLogin"
                    >
                        <el-form-item prop="loginAccount">
                            <el-input
                                v-model.trim="form.loginAccount"
                                :placeholder="$t('login.account')"
                                autocomplete="username"
                                :prefix-icon="UserFilled"
                                size="default"
                            />
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input
                                v-model="form.password"
                                type="password"
                                show-password
                                :placeholder="$t('login.password')"
                                autocomplete="current-password"
                                :prefix-icon="Lock"
                                size="default"
                                @keyup.enter="handleLogin"
                            />
                        </el-form-item>
                        <el-form-item prop="verifyCode">
                            <div class="verify-code-row">
                                <el-input
                                    v-model.trim="form.verifyCode"
                                    :placeholder="$t('login.verifyCode')"
                                    :prefix-icon="Key"
                                    size="default"
                                    @keyup.enter="handleLogin"
                                />
                                <button
                                    class="verify-code-image"
                                    type="button"
                                    :disabled="sendingCode"
                                    :title="$t('login.refreshCaptcha')"
                                    @click="handleSendVerifyCode()"
                                >
                                    <img v-if="captchaImage" :src="captchaImage" :alt="$t('login.captchaAlt')" />
                                    <span v-else :class="{ 'is-error': captchaLoadStatus === 'error' }">
                                        {{ captchaLoadStatus === 'error' ? $t('login.reloadCaptcha') : $t('login.loadingCaptcha') }}
                                    </span>
                                </button>
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <div class="login-form__meta">
                                <el-checkbox v-model="form.rememberMe">{{ $t('login.rememberMe') }}</el-checkbox>
                                <button class="login-form__captcha-refresh" type="button" :disabled="sendingCode" @click="handleSendVerifyCode()">
                                    {{ $t('login.refreshCaptcha') }}
                                </button>
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <el-button
                                class="login-submit"
                                type="primary"
                                size="default"
                                native-type="submit"
                                :loading="loading"
                            >
                                {{ loading ? $t('login.logging') : $t('login.login') }}
                            </el-button>
                        </el-form-item>
                    </el-form>

                    <section v-else class="mfa-panel">
                        <button class="mfa-panel__back" type="button" @click="resetMfaStage">
                            <el-icon><ArrowLeft /></el-icon>
                            <span>{{ $t('login.mfaBack') }}</span>
                        </button>
                        <div class="mfa-panel__status">
                            <span>{{ mfaStageLabel }}</span>
                            <strong>{{ mfaAccountLabel }}</strong>
                        </div>

                        <div v-if="loginStage === 'bind'" class="mfa-bind">
                            <div class="mfa-bind__visual">
                                <div class="mfa-bind__qr">
                                    <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" :alt="$t('login.mfaQrAlt')" />
                                    <el-skeleton v-else animated :rows="3" />
                                </div>
                                <div class="mfa-bind__steps">
                                    <strong>{{ $t('login.mfaBindTitle') }}</strong>
                                    <p>{{ $t('login.mfaBindSubtitle') }}</p>
                                </div>
                            </div>
                            <div class="mfa-bind__manual">
                                <span>{{ $t('login.mfaManualKey') }}</span>
                                <code>{{ manualSecret }}</code>
                            </div>
                        </div>

                        <div v-else class="mfa-verify">
                            <div class="mfa-verify__seal">
                                <el-icon><Lock /></el-icon>
                            </div>
                            <h3>{{ loginStage === 'locked' ? $t('login.mfaLockedTitle') : $t('login.mfaVerifyTitle') }}</h3>
                            <p>
                                <template v-if="loginStage === 'locked'">
                                    {{ $t('login.mfaLockedSubtitle') }}
                                    <BaseDateTime v-if="mfaLockedUntil" :value="mfaLockedUntil" />
                                </template>
                                <template v-else>{{ $t('login.mfaVerifySubtitle') }}</template>
                            </p>
                        </div>

                        <el-form
                            v-if="loginStage !== 'locked'"
                            ref="mfaFormRef"
                            :model="mfaForm"
                            :rules="mfaRules"
                            class="login-form mfa-form"
                            size="default"
                            @submit.prevent="handleMfaSubmit"
                        >
                            <el-form-item prop="totpCode">
                                <el-input
                                    v-model="mfaForm.totpCode"
                                    class="mfa-code-input"
                                    inputmode="numeric"
                                    autocomplete="one-time-code"
                                    :placeholder="$t('login.mfaCodePlaceholder')"
                                    :prefix-icon="Key"
                                    @input="normalizeTotpCode"
                                    @keyup.enter="handleMfaSubmit"
                                />
                            </el-form-item>
                            <el-form-item>
                                <el-button
                                    class="login-submit"
                                    type="primary"
                                    size="default"
                                    native-type="submit"
                                    :loading="mfaLoading"
                                >
                                    {{ mfaLoading ? $t('login.mfaVerifying') : mfaSubmitText }}
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </section>

                    <div class="login-footer">
                        {{ $t('login.copyright') }}
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { ArrowLeft, UserFilled, Lock, Key } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import {
    VEXRA_BRAND,
    getSystemBrand,
    resolveFriendlyRequestMessage,
    type AuthLoginResponse,
    type AuthMfaBindInfoResponse,
} from '@acquiring/shared';
import { useUserStore } from '@/store/modules/user';
import { useI18n } from 'vue-i18n';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';

const { t, locale } = useI18n();
const adminBrand = getSystemBrand('admin');
const adminProductName = computed(() => {
    const productPrefix = `${VEXRA_BRAND.brandName} `;
    return adminBrand.name.startsWith(productPrefix)
        ? adminBrand.name.slice(productPrefix.length)
        : adminBrand.name;
});
const brandFullName = computed(() =>
    locale.value === 'en-US' ? VEXRA_BRAND.brandFullNameEn : VEXRA_BRAND.brandFullNameZh,
);
const heroDescription = computed(() =>
    locale.value === 'en-US' ? adminBrand.descriptionEn : adminBrand.descriptionZh,
);
const panelDescription = computed(() =>
    locale.value === 'en-US' ? t('login.panelDescriptionEn') : t('login.panelDescriptionZh'),
);
const heroTags = computed(() => [
    t('login.tagSecurity'),
    t('login.tagControl'),
    t('login.tagVisibility'),
]);
const heroMetrics = computed(() => [
    { value: '256-bit', label: t('login.metricEncryption') },
    { value: '24/7', label: t('login.metricAvailability') },
    { value: 'Global', label: t('login.metricCoverage') },
]);

const router = useRouter();
const route = useRoute();
const user = useUserStore();
const formRef = ref<FormInstance>();
const mfaFormRef = ref<FormInstance>();
const loading = ref(false);
const sendingCode = ref(false);
const mfaLoading = ref(false);
const captchaImage = ref('');
const captchaLoadStatus = ref<'loading' | 'ready' | 'error'>('loading');
const loginStage = ref<'credentials' | 'bind' | 'verify' | 'locked'>('credentials');
const loginTicket = ref('');
const loginTicketExpireAt = ref('');
const mfaLockedUntil = ref('');
const mfaBindInfo = ref<AuthMfaBindInfoResponse | null>(null);
const qrCodeDataUrl = ref('');
const devLoginAssistEnabled = import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEV_LOGIN_ASSIST !== 'false';
const devLoginAccount = devLoginAssistEnabled
    ? String(import.meta.env.VITE_ADMIN_DEV_LOGIN_ACCOUNT || 'admin')
    : '';
const devLoginPassword = devLoginAssistEnabled
    ? String(import.meta.env.VITE_ADMIN_DEV_LOGIN_PASSWORD || 'Admin@123456')
    : '';

const form = reactive({
    loginAccount: devLoginAccount,
    password: devLoginPassword,
    verifyCodeId: '',
    verifyCode: '',
    rememberMe: true,
});

const mfaForm = reactive({
    totpCode: '',
});

const rules: FormRules = {
    loginAccount: [{ required: true, message: () => t('login.accountRequired'), trigger: 'blur' }],
    password: [{ required: true, message: () => t('login.passwordRequired'), trigger: 'blur' }],
    verifyCode: [{ required: true, message: () => t('login.verifyCodeRequired'), trigger: 'blur' }],
};

const mfaRules: FormRules = {
    totpCode: [
        { required: true, message: () => t('login.mfaCodeRequired'), trigger: 'blur' },
        { pattern: /^\d{6}$/, message: () => t('login.mfaCodeFormat'), trigger: 'blur' },
    ],
};

onMounted(() => {
    handleSendVerifyCode({ showError: false });
});

const mfaStageLabel = computed(() => {
    if (loginStage.value === 'bind') {
        return t('login.mfaBindStage');
    }
    if (loginStage.value === 'locked') {
        return t('login.mfaLockedStage');
    }
    return t('login.mfaVerifyStage');
});

const mfaAccountLabel = computed(() =>
    mfaBindInfo.value?.maskedLoginAccount || mfaBindInfo.value?.accountLabel || form.loginAccount || '-',
);
const manualSecret = computed(() => extractManualSecret(mfaBindInfo.value?.otpauthUri));
const mfaSubmitText = computed(() => loginStage.value === 'bind' ? t('login.mfaBindConfirm') : t('login.mfaVerifySubmit'));

async function handleSendVerifyCode(options: { showError?: boolean } = {}) {
    if (sendingCode.value) {
        return;
    }
    sendingCode.value = true;
    captchaLoadStatus.value = 'loading';
    captchaImage.value = '';
    form.verifyCodeId = '';
    try {
        const result = await user.sendLoginVerifyCode(form.loginAccount);
        form.verifyCodeId = result.verifyCodeId;
        captchaImage.value = result.captchaImage || '';
        form.verifyCode = '';
        captchaLoadStatus.value = captchaImage.value ? 'ready' : 'error';
        if (!captchaImage.value && options.showError !== false) {
            ElMessage.error(t('login.captchaLoadFailed'));
        }
    } catch (error) {
        captchaLoadStatus.value = 'error';
        if (options.showError !== false) {
            const localeValue = String(locale.value || document.documentElement.lang || navigator.language || 'zh-CN');
            ElMessage.error(resolveFriendlyRequestMessage(error, localeValue));
        }
    } finally {
        sendingCode.value = false;
    }
}

async function handleLogin() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (!form.verifyCodeId) {
        ElMessage.warning(t('login.getVerifyCodeFirst'));
        return;
    }
    loading.value = true;
    try {
        const result = await user.login(form);
        await handleLoginResponse(result);
    } catch (error) {
        await handleSendVerifyCode({ showError: false });
        const localeValue = String(locale.value || document.documentElement.lang || navigator.language || 'zh-CN');
        ElMessage.error(resolveFriendlyRequestMessage(error, localeValue));
    } finally {
        loading.value = false;
    }
}

async function handleLoginResponse(result: AuthLoginResponse) {
    if (result.mfaRequired || result.loginStatus === 'MFA_REQUIRED') {
        loginTicket.value = result.loginTicket || '';
        loginTicketExpireAt.value = result.loginTicketExpireAt || '';
        mfaLockedUntil.value = result.mfaLockedUntil || '';
        if (result.mfaChallengeType === 'LOCKED') {
            loginStage.value = 'locked';
            return;
        }
        if (!loginTicket.value) {
            ElMessage.error(t('login.mfaTicketMissing'));
            return;
        }
        if (result.mfaChallengeType === 'BIND_REQUIRED' || result.mfaChallengeType === 'RESET_BIND_REQUIRED') {
            await loadMfaBindInfo();
            loginStage.value = 'bind';
            return;
        }
        loginStage.value = 'verify';
        mfaForm.totpCode = '';
        return;
    }
    await finishLogin();
}

async function loadMfaBindInfo() {
    mfaLoading.value = true;
    try {
        mfaBindInfo.value = await user.getMfaBindInfo(loginTicket.value);
        loginTicketExpireAt.value = mfaBindInfo.value.loginTicketExpireAt || loginTicketExpireAt.value;
        qrCodeDataUrl.value = await QRCode.toDataURL(mfaBindInfo.value.otpauthUri, {
            width: 220,
            margin: 1,
            color: {
                dark: '#111827',
                light: '#ffffff',
            },
        });
        mfaForm.totpCode = '';
    } finally {
        mfaLoading.value = false;
    }
}

async function handleMfaSubmit() {
    const valid = await mfaFormRef.value?.validate().catch(() => false);
    if (!valid || !loginTicket.value) {
        return;
    }
    mfaLoading.value = true;
    try {
        if (loginStage.value === 'bind') {
            await user.confirmMfaBind(loginTicket.value, mfaForm.totpCode);
        } else {
            await user.verifyMfa(loginTicket.value, mfaForm.totpCode);
        }
        await finishLogin();
    } finally {
        mfaLoading.value = false;
    }
}

async function finishLogin() {
    ElMessage.success(t('login.loginSuccess'));
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
    await router.push(redirect);
}

function normalizeTotpCode(value: string | number) {
    mfaForm.totpCode = String(value || '').replace(/\D/g, '').slice(0, 6);
}

function resetMfaStage() {
    loginStage.value = 'credentials';
    loginTicket.value = '';
    loginTicketExpireAt.value = '';
    mfaLockedUntil.value = '';
    mfaBindInfo.value = null;
    qrCodeDataUrl.value = '';
    mfaForm.totpCode = '';
    handleSendVerifyCode({ showError: false });
}

function extractManualSecret(otpauthUri?: string) {
    if (!otpauthUri) {
        return '-';
    }
    try {
        return new URL(otpauthUri).searchParams.get('secret') || '-';
    } catch {
        return '-';
    }
}
</script>
