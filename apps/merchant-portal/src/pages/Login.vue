<template>
    <main class="merchant-login-page">
        <div class="merchant-login-page__orb merchant-login-page__orb--accent"></div>
        <div class="merchant-login-page__orb merchant-login-page__orb--blue"></div>
        <div class="merchant-login-page__toolbar">
            <div class="merchant-login-hero__lang-switch">
                <LanguageSwitch />
            </div>
        </div>
        <div class="merchant-login-page__grid">
            <section class="merchant-login-hero">
                <div class="merchant-login-hero__eyebrow">{{ t('login.eyebrow') }}</div>
                <img
                    class="merchant-login-hero__logo"
                    :src="merchantBrand.logos.horizontal"
                    :alt="merchantBrand.name"
                />
                <div class="merchant-login-hero__title-group">
                    <h1>{{ t('login.title') }}</h1>
                    <p>{{ t('login.description') }}</p>
                </div>
                <div class="merchant-login-hero__chips">
                    <span v-for="tag in heroTags" :key="tag" class="merchant-login-hero__chip">{{ tag }}</span>
                </div>
                <div class="merchant-login-hero__metrics">
                    <div v-for="item in heroMetrics" :key="item.label" class="merchant-login-hero__metric">
                        <strong>{{ item.value }}</strong>
                        <span>{{ item.label }}</span>
                    </div>
                </div>
            </section>

            <section class="merchant-login-panel">
                <div class="merchant-login-panel__card">
                    <div class="merchant-login-brand">
                        <img class="merchant-login-brand__icon" :src="merchantBrand.logos.icon" :alt="merchantBrand.name" />
                        <div>
                            <h2>{{ t('login.welcome') }}</h2>
                            <small>{{ merchantBrand.subtitleEn }}</small>
                        </div>
                    </div>

                    <p class="merchant-login-panel__description">
                        {{ t('login.panelDescription') }}
                    </p>

                    <el-form
                        v-if="loginStage === 'credentials'"
                        class="merchant-login-form"
                        :model="form"
                        label-position="top"
                        @submit.prevent="handleLogin"
                    >
                        <el-form-item :label="t('login.merchantId')">
                            <el-input v-model="form.merchantId" :placeholder="t('login.merchantIdPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('login.account')">
                            <el-input v-model="form.loginAccount" autocomplete="username" :placeholder="t('login.accountPlaceholder')" />
                        </el-form-item>
                        <el-form-item :label="t('login.password')">
                            <el-input
                                v-model="form.password"
                                type="password"
                                autocomplete="current-password"
                                show-password
                                :placeholder="t('login.passwordPlaceholder')"
                                @keyup.enter="handleLogin"
                            />
                        </el-form-item>
                        <el-form-item :label="t('login.verifyCode')">
                            <div class="merchant-login-verify-code">
                                <el-input
                                    v-model.trim="form.verifyCode"
                                    :placeholder="t('login.verifyCodePlaceholder')"
                                    @keyup.enter="handleLogin"
                                />
                                <button
                                    class="merchant-login-verify-code__image"
                                    type="button"
                                    :disabled="sendingCode || loading || loadingCredential"
                                    :title="t('login.refreshCaptcha')"
                                    @click="handleSendVerifyCode()"
                                >
                                    <img v-if="captchaImage" :src="captchaImage" :alt="t('login.captchaAlt')" />
                                    <span v-else :class="{ 'is-error': captchaLoadStatus === 'error' }">
                                        {{ captchaFallbackText }}
                                    </span>
                                </button>
                            </div>
                        </el-form-item>
                        <el-button type="primary" class="merchant-login-submit" :loading="loading || loadingCredential" @click="handleLogin">
                            {{ t('login.submit') }}
                        </el-button>
                    </el-form>

                    <section v-else class="merchant-mfa-panel">
                        <button class="merchant-mfa-panel__back" type="button" @click="resetMfaStage">
                            <el-icon><ArrowLeft /></el-icon>
                            <span>{{ t('login.mfaBack') }}</span>
                        </button>

                        <div class="merchant-mfa-panel__status">
                            <span>{{ mfaStageLabel }}</span>
                            <strong>{{ mfaAccountLabel }}</strong>
                        </div>

                        <div v-if="loginStage === 'bind'" class="merchant-mfa-bind">
                            <div class="merchant-mfa-bind__visual">
                                <div class="merchant-mfa-bind__qr">
                                    <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" :alt="t('login.mfaQrAlt')" />
                                    <span v-else>{{ t('login.mfaQrLoading') }}</span>
                                </div>
                                <div class="merchant-mfa-bind__steps">
                                    <strong>{{ t('login.mfaBindTitle') }}</strong>
                                    <p>{{ t('login.mfaBindSubtitle') }}</p>
                                </div>
                            </div>
                            <div class="merchant-mfa-bind__manual">
                                <span>{{ t('login.mfaManualKey') }}</span>
                                <code>{{ manualSecret }}</code>
                            </div>
                        </div>

                        <div v-else class="merchant-mfa-verify">
                            <div class="merchant-mfa-verify__seal">
                                <el-icon><Lock /></el-icon>
                            </div>
                            <h3>{{ loginStage === 'locked' ? t('login.mfaLockedTitle') : t('login.mfaVerifyTitle') }}</h3>
                            <p>
                                <template v-if="loginStage === 'locked'">
                                    {{ t('login.mfaLockedSubtitle') }}
                                    <BaseDateTime v-if="mfaLockedUntil" :value="mfaLockedUntil" />
                                </template>
                                <template v-else>{{ t('login.mfaVerifySubtitle') }}</template>
                            </p>
                        </div>

                        <el-form
                            v-if="loginStage !== 'locked'"
                            class="merchant-login-form merchant-mfa-form"
                            :model="mfaForm"
                            label-position="top"
                            @submit.prevent="handleMfaSubmit"
                        >
                            <el-form-item :label="t('login.mfaCode')">
                                <el-input
                                    v-model="mfaForm.totpCode"
                                    class="merchant-mfa-code-input"
                                    inputmode="numeric"
                                    autocomplete="one-time-code"
                                    :placeholder="t('login.mfaCodePlaceholder')"
                                    :prefix-icon="Key"
                                    @input="normalizeTotpCode"
                                    @keyup.enter="handleMfaSubmit"
                                />
                            </el-form-item>
                            <el-button type="primary" class="merchant-login-submit" :loading="mfaLoading" @click="handleMfaSubmit">
                                {{ mfaLoading ? t('login.mfaVerifying') : mfaSubmitText }}
                            </el-button>
                        </el-form>
                    </section>

                    <div class="merchant-login-footer">
                        <span>{{ t('login.footerTitle') }}</span>
                        <small>{{ loginHint }}</small>
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Key, Lock } from '@element-plus/icons-vue';
import QRCode from 'qrcode';
import {
    getSystemBrand,
    resolveFriendlyRequestMessage,
    type AuthLoginResponse,
    type AuthMfaBindInfoResponse,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { defaultLoginCredential, login, sendLoginVerifyCode } from '@/api/authApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import { useAuthStore } from '@/stores/authStore';
import { firstAvailableMenuPath } from '@/utils/menu';

const router = useRouter();
const auth = useAuthStore();
const merchantBrand = getSystemBrand('merchant');
const { t } = useI18n();
const loading = ref(false);
const loadingCredential = ref(false);
const sendingCode = ref(false);
const mfaLoading = ref(false);
const captchaImage = ref('');
const captchaLoadStatus = ref<'loading' | 'ready' | 'error' | 'rateLimited'>('loading');
const captchaRetryTimer = ref<number | undefined>();
const loginStage = ref<'credentials' | 'bind' | 'verify' | 'locked'>('credentials');
const loginTicket = ref('');
const loginTicketExpireAt = ref('');
const mfaLockedUntil = ref('');
const mfaBindInfo = ref<AuthMfaBindInfoResponse | null>(null);
const qrCodeDataUrl = ref('');
const heroTags = computed(() => [t('login.tagTransaction'), t('login.tagSettlement'), t('login.tagOperation')]);
const heroMetrics = computed(() => [
    { value: '24/7', label: t('login.metricAccess') },
    { value: 'Multi', label: t('login.metricCurrency') },
    { value: 'Live', label: t('login.metricVisibility') },
]);
const form = reactive({
    merchantId: '',
    loginAccount: '',
    password: '',
    verifyCodeId: '',
    verifyCode: '',
});
const mfaForm = reactive({
    totpCode: '',
});
const loginHint = computed(() => {
    if (loginStage.value === 'bind') {
        return t('login.mfaBindFooter');
    }
    if (loginStage.value === 'verify') {
        return t('login.mfaVerifyFooter');
    }
    if (loginStage.value === 'locked') {
        return t('login.mfaLockedFooter');
    }
    if (captchaLoadStatus.value === 'rateLimited') {
        return t('login.captchaRateLimited');
    }
    if (captchaLoadStatus.value === 'error') {
        return t('login.captchaLoadFailed');
    }
    if (captchaImage.value) {
        return t('login.captchaLoaded');
    }
    return t('login.footerDescription');
});
const captchaFallbackText = computed(() => {
    if (captchaLoadStatus.value === 'rateLimited') {
        return t('login.captchaWait');
    }
    if (captchaLoadStatus.value === 'error') {
        return t('login.reloadCaptcha');
    }
    return t('login.loadingCaptcha');
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

onMounted(async () => {
    await loadDefaultCredential();
    await loadInitialCaptcha();
});

watch(
    () => [form.merchantId, form.loginAccount],
    () => {
        form.verifyCode = '';
        if (loginStage.value === 'credentials') {
            resetMfaStateOnly();
        }
    },
);

async function loadDefaultCredential() {
    loadingCredential.value = true;
    try {
        const credential = await defaultLoginCredential();
        if (credential.merchantId) {
            form.merchantId = credential.merchantId;
        }
        if (credential.loginAccount) {
            form.loginAccount = credential.loginAccount;
        }
        if (credential.password) {
            form.password = credential.password;
        }
    } catch {
        // 生产环境不会依赖默认凭据，失败时保持空表单即可。
    } finally {
        loadingCredential.value = false;
    }
}

async function loadInitialCaptcha() {
    await handleSendVerifyCode({ showError: false });
    if (captchaImage.value) {
        return;
    }
    window.setTimeout(() => {
        handleSendVerifyCode({ showError: false });
    }, 600);
}

async function handleSendVerifyCode(options: { showError?: boolean } = {}) {
    if (sendingCode.value) {
        return;
    }
    sendingCode.value = true;
    captchaLoadStatus.value = 'loading';
    captchaImage.value = '';
    form.verifyCodeId = '';
    try {
        if (captchaRetryTimer.value) {
            window.clearTimeout(captchaRetryTimer.value);
            captchaRetryTimer.value = undefined;
        }
        const result = await sendLoginVerifyCode({
            loginAccount: form.loginAccount,
            merchantId: form.merchantId,
            scene: 'LOGIN',
        });
        form.verifyCodeId = result.verifyCodeId;
        captchaImage.value = result.captchaImage || '';
        form.verifyCode = '';
        captchaLoadStatus.value = captchaImage.value ? 'ready' : 'error';
        if (!captchaImage.value && options.showError !== false) {
            ElMessage.error(t('login.captchaLoadFailed'));
        }
    } catch (error) {
        if (isRateLimitedError(error)) {
            captchaLoadStatus.value = 'rateLimited';
            scheduleCaptchaRetry();
        } else {
            captchaLoadStatus.value = 'error';
        }
        if (options.showError !== false) {
            const locale = document.documentElement.lang || navigator.language || 'zh-CN';
            ElMessage.error(resolveFriendlyRequestMessage(error, locale));
        }
    } finally {
        sendingCode.value = false;
    }
}

function scheduleCaptchaRetry() {
    if (captchaRetryTimer.value) {
        window.clearTimeout(captchaRetryTimer.value);
    }
    captchaRetryTimer.value = window.setTimeout(() => {
        captchaRetryTimer.value = undefined;
        handleSendVerifyCode({ showError: false });
    }, 3000);
}

function isRateLimitedError(error: unknown) {
    if (!error || typeof error !== 'object') {
        return false;
    }
    const errorObject = error as {
        code?: string;
        message?: string;
        response?: { data?: { code?: string; message?: string } };
    };
    const responseData = errorObject.response?.data;
    return responseData?.code === 'F429'
        || responseData?.message === 'verify code send too frequently'
        || errorObject.code === 'F429'
        || errorObject.message === 'verify code send too frequently';
}

async function handleLogin() {
    if (!form.merchantId || !form.loginAccount || !form.password) {
        ElMessage.warning(t('login.loginFieldsRequired'));
        return;
    }
    if (!form.verifyCodeId) {
        ElMessage.warning(t('login.getVerifyCodeFirst'));
        return;
    }
    if (!form.verifyCode) {
        ElMessage.warning(t('login.verifyCodeRequired'));
        return;
    }
    loading.value = true;
    try {
        const response = await login({
            merchantId: form.merchantId,
            loginAccount: form.loginAccount,
            password: form.password,
            verifyCodeId: form.verifyCodeId,
            verifyCode: form.verifyCode,
        });
        await handleLoginResponse(response);
    } catch (error) {
        await handleSendVerifyCode({ showError: false });
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        ElMessage.error(resolveFriendlyRequestMessage(error, locale));
    } finally {
        loading.value = false;
    }
}

async function handleLoginResponse(response: AuthLoginResponse) {
    if (response.mfaRequired || response.loginStatus === 'MFA_REQUIRED') {
        loginTicket.value = response.loginTicket || '';
        loginTicketExpireAt.value = response.loginTicketExpireAt || '';
        mfaLockedUntil.value = response.mfaLockedUntil || '';
        if (response.mfaChallengeType === 'LOCKED') {
            loginStage.value = 'locked';
            return;
        }
        if (!loginTicket.value) {
            ElMessage.error(t('login.mfaTicketMissing'));
            return;
        }
        if (response.mfaChallengeType === 'BIND_REQUIRED' || response.mfaChallengeType === 'RESET_BIND_REQUIRED') {
            await loadMfaBindInfo();
            loginStage.value = 'bind';
            return;
        }
        loginStage.value = 'verify';
        mfaForm.totpCode = '';
        return;
    }
    auth.setLoginResponse(response);
    await router.push(firstAvailableMenuPath(response.menus || []));
}

async function loadMfaBindInfo() {
    mfaLoading.value = true;
    try {
        mfaBindInfo.value = await auth.getMfaBindInfo(loginTicket.value);
        loginTicketExpireAt.value = mfaBindInfo.value.loginTicketExpireAt || loginTicketExpireAt.value;
        qrCodeDataUrl.value = await QRCode.toDataURL(mfaBindInfo.value.otpauthUri, {
            width: 220,
            margin: 1,
            color: {
                dark: '#0f172a',
                light: '#ffffff',
            },
        });
        mfaForm.totpCode = '';
    } catch (error) {
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        ElMessage.error(resolveFriendlyRequestMessage(error, locale));
        resetMfaStage();
    } finally {
        mfaLoading.value = false;
    }
}

async function handleMfaSubmit() {
    if (!loginTicket.value) {
        ElMessage.error(t('login.mfaTicketMissing'));
        return;
    }
    if (!/^\d{6}$/.test(mfaForm.totpCode)) {
        ElMessage.warning(t('login.mfaCodeFormat'));
        return;
    }
    mfaLoading.value = true;
    try {
        const response = loginStage.value === 'bind'
            ? await auth.confirmMfaBind(loginTicket.value, mfaForm.totpCode)
            : await auth.verifyMfa(loginTicket.value, mfaForm.totpCode);
        await router.push(firstAvailableMenuPath(response.menus || auth.session?.menus || []));
    } catch (error) {
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        ElMessage.error(resolveFriendlyRequestMessage(error, locale));
    } finally {
        mfaLoading.value = false;
    }
}

function normalizeTotpCode(value: string | number) {
    mfaForm.totpCode = String(value || '').replace(/\D/g, '').slice(0, 6);
}

function resetMfaStage() {
    resetMfaStateOnly();
    handleSendVerifyCode({ showError: false });
}

function resetMfaStateOnly() {
    loginStage.value = 'credentials';
    loginTicket.value = '';
    loginTicketExpireAt.value = '';
    mfaLockedUntil.value = '';
    mfaBindInfo.value = null;
    qrCodeDataUrl.value = '';
    mfaForm.totpCode = '';
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
