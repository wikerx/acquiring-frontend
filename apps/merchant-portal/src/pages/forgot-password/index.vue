<template>
    <main class="recovery-page">
        <div class="recovery-toolbar"><LanguageSwitch /></div>

        <section class="recovery-hero" aria-labelledby="recovery-brand-title">
            <div class="recovery-hero__eyebrow">VEXRA MERCHANT SECURITY</div>
            <div class="recovery-hero__brand" translate="no">
                <img :src="merchantBrand.logos.icon" alt="" aria-hidden="true" />
                <div>
                    <div id="recovery-brand-title"><strong>Vexra</strong><i></i><span>Merchant</span></div>
                    <small>{{ merchantBrand.subtitleEn }}</small>
                </div>
            </div>
            <h1>{{ t('passwordRecovery.heroTitle') }}</h1>
            <p>{{ t('passwordRecovery.heroSubtitle') }}</p>
            <div class="recovery-hero__assurance">
                <span><el-icon><Lock /></el-icon>{{ t('passwordRecovery.assuranceToken') }}</span>
                <span><el-icon><CircleCheck /></el-icon>{{ t('passwordRecovery.assuranceSession') }}</span>
            </div>
        </section>

        <section class="recovery-panel">
            <div class="recovery-card">
                <header class="recovery-card__header">
                    <button
                        v-if="stage !== 'success'"
                        class="icon-back"
                        type="button"
                        :title="t('passwordRecovery.backToLogin')"
                        @click="router.push('/login')"
                    >
                        <el-icon><ArrowLeft /></el-icon>
                    </button>
                    <img :src="merchantBrand.logos.icon" :alt="merchantBrand.name" />
                    <div>
                        <h2>{{ stageTitle }}</h2>
                        <p>{{ stageSubtitle }}</p>
                    </div>
                </header>

                <div v-if="stage !== 'success' && stage !== 'support'" class="recovery-progress" aria-hidden="true">
                    <span v-for="index in 4" :key="index" :class="{ active: index <= progressStep }"></span>
                </div>

                <el-form
                    v-if="stage === 'account'"
                    ref="accountFormRef"
                    :model="accountForm"
                    :rules="accountRules"
                    class="recovery-form"
                    @submit.prevent="submitAccount"
                >
                    <el-form-item prop="merchantId">
                        <el-input v-model.trim="accountForm.merchantId" :placeholder="t('passwordRecovery.merchantIdPlaceholder')" autocomplete="organization" :prefix-icon="OfficeBuilding" />
                    </el-form-item>
                    <el-form-item prop="loginAccount">
                        <el-input v-model.trim="accountForm.loginAccount" :placeholder="t('passwordRecovery.accountPlaceholder')" autocomplete="username" :prefix-icon="UserFilled" />
                    </el-form-item>
                    <el-form-item prop="verifyCode">
                        <div class="captcha-row">
                            <el-input v-model.trim="accountForm.verifyCode" :placeholder="t('passwordRecovery.captchaPlaceholder')" autocomplete="off" :prefix-icon="Key" />
                            <button type="button" class="captcha-image" :disabled="captchaLoading" :title="t('login.refreshCaptcha')" @click="loadCaptcha(true)">
                                <img v-if="captchaImage" :src="captchaImage" :alt="t('login.captchaAlt')" />
                                <el-icon v-else :class="{ spinning: captchaLoading }"><RefreshRight /></el-icon>
                            </button>
                        </div>
                    </el-form-item>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">
                        {{ t('passwordRecovery.sendCode') }}
                    </el-button>
                </el-form>

                <el-form v-else-if="stage === 'email'" ref="emailFormRef" :model="emailForm" :rules="emailRules" class="recovery-form" @submit.prevent="submitEmailCode">
                    <div class="stage-icon"><el-icon><Message /></el-icon></div>
                    <el-form-item prop="emailCode">
                        <VerificationCodeInput v-model="emailForm.emailCode" mode="alphanumeric" :label="t('passwordRecovery.emailCodePlaceholder')" autofocus />
                    </el-form-item>
                    <p class="delivery-hint">{{ t('passwordRecovery.emailDeliveryHint') }}</p>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">{{ t('passwordRecovery.verifyContinue') }}</el-button>
                    <button class="text-action" type="button" :disabled="resendSeconds > 0" @click="restartRequest">
                        {{ resendSeconds > 0 ? t('passwordRecovery.resendCountdown', { seconds: resendSeconds }) : t('passwordRecovery.resend') }}
                    </button>
                </el-form>

                <el-form v-else-if="stage === 'mfa'" ref="mfaFormRef" :model="mfaForm" :rules="mfaRules" class="recovery-form" @submit.prevent="submitMfa">
                    <div class="stage-icon"><el-icon><Lock /></el-icon></div>
                    <el-form-item prop="totpCode">
                        <VerificationCodeInput v-model="mfaForm.totpCode" mode="numeric" :label="t('passwordRecovery.mfaPlaceholder')" described-by="mfa-code-hint" autofocus />
                    </el-form-item>
                    <p id="mfa-code-hint" class="verification-code-hint">{{ t('passwordRecovery.mfaCodeHint') }}</p>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">{{ t('passwordRecovery.verifyMfa') }}</el-button>
                </el-form>

                <el-form v-else-if="stage === 'password'" ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" class="recovery-form" @submit.prevent="submitPassword">
                    <el-form-item prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" :prefix-icon="Lock" :placeholder="t('passwordRecovery.newPasswordPlaceholder')" />
                    </el-form-item>
                    <el-form-item prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" :prefix-icon="Lock" :placeholder="t('passwordRecovery.confirmPasswordPlaceholder')" />
                    </el-form-item>
                    <div class="password-requirements">
                        <span :class="{ met: passwordChecks.length }">{{ t('passwordRecovery.passwordLength') }}</span>
                        <span :class="{ met: passwordChecks.upperLower }">{{ t('passwordRecovery.passwordCase') }}</span>
                        <span :class="{ met: passwordChecks.numberSpecial }">{{ t('passwordRecovery.passwordNumberSpecial') }}</span>
                        <span :class="{ met: passwordChecks.noWhitespace }">{{ t('passwordRecovery.passwordNoWhitespace') }}</span>
                    </div>
                    <p class="password-history-hint">{{ t('passwordRecovery.passwordHistory') }}</p>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">{{ t('passwordRecovery.resetPassword') }}</el-button>
                </el-form>

                <div v-else-if="stage === 'support'" class="terminal-state terminal-state--warning">
                    <el-icon><Warning /></el-icon>
                    <h3>{{ t('passwordRecovery.supportTitle') }}</h3>
                    <p>{{ t('passwordRecovery.supportMessage') }}</p>
                    <el-button type="primary" @click="router.push('/login')">{{ t('passwordRecovery.backToLogin') }}</el-button>
                </div>

                <div v-else class="terminal-state terminal-state--success">
                    <el-icon><CircleCheck /></el-icon>
                    <h3>{{ t('passwordRecovery.successTitle') }}</h3>
                    <p>{{ t('passwordRecovery.successMessage') }}</p>
                    <el-button type="primary" @click="router.replace('/login')">{{ t('passwordRecovery.signIn') }}</el-button>
                </div>

                <footer>{{ t('login.copyright') }}</footer>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { ArrowLeft, CircleCheck, Key, Lock, Message, OfficeBuilding, RefreshRight, UserFilled, Warning } from '@element-plus/icons-vue';
import { getSystemBrand, resolveFriendlyRequestMessage, type PasswordResetVerifyResponse } from '@acquiring/shared';
import LanguageSwitch from '@/components/LanguageSwitch.vue';
import VerificationCodeInput from '@/components/VerificationCodeInput/index.vue';
import {
    confirmPasswordReset,
    requestPasswordReset,
    sendLoginVerifyCode,
    verifyPasswordResetEmail,
    verifyPasswordResetMfa,
} from '@/api/authApi';

type RecoveryStage = 'account' | 'email' | 'mfa' | 'password' | 'support' | 'success';

const { t, locale } = useI18n();
const router = useRouter();
const route = useRoute();
const merchantBrand = getSystemBrand('merchant');
const stage = ref<RecoveryStage>('account');
const loading = ref(false);
const captchaLoading = ref(false);
const captchaImage = ref('');
const requestId = ref('');
const actionToken = ref('');
const resetToken = ref('');
const resendSeconds = ref(0);
let resendTimer: number | undefined;

const accountFormRef = ref<FormInstance>();
const emailFormRef = ref<FormInstance>();
const mfaFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const accountForm = reactive({ merchantId: '', loginAccount: '', verifyCodeId: '', verifyCode: '' });
const emailForm = reactive({ emailCode: '' });
const mfaForm = reactive({ totpCode: '' });
const passwordForm = reactive({ newPassword: '', confirmPassword: '' });

const progressStepByStage: Record<RecoveryStage, number> = { account: 1, email: 2, mfa: 3, password: 4, support: 4, success: 4 };
const progressStep = computed(() => progressStepByStage[stage.value]);
const stageTitle = computed(() => t(`passwordRecovery.stage.${stage.value}.title`));
const stageSubtitle = computed(() => t(`passwordRecovery.stage.${stage.value}.subtitle`));
const passwordChecks = computed(() => ({
    length: passwordForm.newPassword.length >= 12 && passwordForm.newPassword.length <= 64,
    upperLower: /[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword),
    numberSpecial: /\d/.test(passwordForm.newPassword) && /[^A-Za-z0-9\s]/.test(passwordForm.newPassword),
    noWhitespace: !/\s/.test(passwordForm.newPassword),
}));

const accountRules: FormRules = {
    merchantId: [{ required: true, message: () => t('passwordRecovery.merchantIdRequired'), trigger: 'blur' }],
    loginAccount: [{ required: true, message: () => t('passwordRecovery.accountRequired'), trigger: 'blur' }],
    verifyCode: [{ required: true, message: () => t('passwordRecovery.captchaRequired'), trigger: 'blur' }],
};
const emailRules: FormRules = {
    emailCode: [
        { required: true, message: () => t('passwordRecovery.emailCodeRequired'), trigger: 'blur' },
        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]{6}$/, message: () => t('passwordRecovery.emailCodeInvalid'), trigger: 'blur' },
    ],
};
const mfaRules: FormRules = {
    totpCode: [
        { required: true, message: () => t('passwordRecovery.mfaRequired'), trigger: 'blur' },
        { pattern: /^\d{6}$/, message: () => t('passwordRecovery.mfaCodeFormat'), trigger: 'blur' },
    ],
};
const passwordRules = computed<FormRules>(() => ({
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmation, trigger: 'blur' }],
}));

onMounted(() => {
    const queryRequestId = typeof route.query.requestId === 'string' ? route.query.requestId.trim() : '';
    if (queryRequestId) {
        requestId.value = queryRequestId;
        stripRequestIdFromUrl();
        stage.value = 'email';
        startResendCountdown();
        return;
    }
    loadCaptcha(false);
});
onBeforeUnmount(clearResendTimer);

function stripRequestIdFromUrl() {
    const query = { ...route.query };
    delete query.requestId;
    void router.replace({ path: route.path, query });
}

async function loadCaptcha(showError: boolean) {
    if (captchaLoading.value) return;
    captchaLoading.value = true;
    captchaImage.value = '';
    accountForm.verifyCodeId = '';
    try {
        const response = await sendLoginVerifyCode({ merchantId: accountForm.merchantId, loginAccount: accountForm.loginAccount, scene: 'LOGIN' });
        accountForm.verifyCodeId = response.verifyCodeId;
        captchaImage.value = response.captchaImage || '';
        accountForm.verifyCode = '';
        if (!captchaImage.value && showError) ElMessage.error(t('login.captchaLoadFailed'));
    } catch (error) {
        if (showError) showRequestError(error);
    } finally {
        captchaLoading.value = false;
    }
}

async function submitAccount() {
    const valid = await accountFormRef.value?.validate().catch(() => false);
    if (!valid || !accountForm.verifyCodeId) return;
    loading.value = true;
    try {
        const response = await requestPasswordReset({
            merchantId: accountForm.merchantId,
            loginAccount: accountForm.loginAccount,
            verifyCodeId: accountForm.verifyCodeId,
            verifyCode: accountForm.verifyCode,
            locale: locale.value === 'en-US' ? 'en-US' : 'zh-CN',
        });
        requestId.value = response.requestId;
        emailForm.emailCode = '';
        stage.value = 'email';
        startResendCountdown();
        ElMessage.success(t('passwordRecovery.genericRequestMessage'));
    } catch (error) {
        showRequestError(error);
        await loadCaptcha(false);
    } finally {
        loading.value = false;
    }
}

async function submitEmailCode() {
    const valid = await emailFormRef.value?.validate().catch(() => false);
    if (!valid || !requestId.value) return;
    loading.value = true;
    try {
        routeVerificationResponse(await verifyPasswordResetEmail({ requestId: requestId.value, emailCode: emailForm.emailCode }));
    } catch (error) {
        showRequestError(error);
    } finally {
        loading.value = false;
    }
}

async function submitMfa() {
    const valid = await mfaFormRef.value?.validate().catch(() => false);
    if (!valid || !requestId.value || !actionToken.value) return;
    loading.value = true;
    try {
        routeVerificationResponse(await verifyPasswordResetMfa({ requestId: requestId.value, actionToken: actionToken.value, totpCode: mfaForm.totpCode }));
    } catch (error) {
        showRequestError(error);
    } finally {
        loading.value = false;
    }
}

async function submitPassword() {
    const valid = await passwordFormRef.value?.validate().catch(() => false);
    if (!valid || !requestId.value || !resetToken.value) return;
    loading.value = true;
    try {
        await confirmPasswordReset({ requestId: requestId.value, resetToken: resetToken.value, newPassword: passwordForm.newPassword });
        clearSecrets();
        stage.value = 'success';
    } catch (error) {
        showRequestError(error);
    } finally {
        loading.value = false;
    }
}

function routeVerificationResponse(response: PasswordResetVerifyResponse) {
    emailForm.emailCode = '';
    if (response.nextStep === 'MERCHANT_SUPPORT' || response.nextStep === 'ADMIN_SUPPORT') {
        clearSecrets();
        stage.value = 'support';
        return;
    }
    if (!response.actionToken) {
        ElMessage.error(t('passwordRecovery.tokenMissing'));
        return;
    }
    if (response.nextStep === 'MFA') {
        actionToken.value = response.actionToken;
        stage.value = 'mfa';
        return;
    }
    resetToken.value = response.actionToken;
    actionToken.value = '';
    stage.value = 'password';
}

function restartRequest() {
    if (resendSeconds.value > 0) return;
    clearSecrets();
    emailForm.emailCode = '';
    stage.value = 'account';
    loadCaptcha(false);
}

function startResendCountdown() {
    clearResendTimer();
    resendSeconds.value = 60;
    resendTimer = window.setInterval(() => {
        resendSeconds.value = Math.max(0, resendSeconds.value - 1);
        if (resendSeconds.value === 0) clearResendTimer();
    }, 1000);
}

function clearResendTimer() {
    if (resendTimer !== undefined) {
        window.clearInterval(resendTimer);
        resendTimer = undefined;
    }
}

function clearSecrets() {
    actionToken.value = '';
    resetToken.value = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    mfaForm.totpCode = '';
}

function validateNewPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) return callback(new Error(t('passwordRecovery.newPasswordRequired')));
    const checks = passwordChecks.value;
    if (!checks.length || !checks.upperLower || !checks.numberSpecial || !checks.noWhitespace) {
        return callback(new Error(t('passwordRecovery.passwordComplexity')));
    }
    callback();
}

function validateConfirmation(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) return callback(new Error(t('passwordRecovery.confirmPasswordRequired')));
    if (value !== passwordForm.newPassword) return callback(new Error(t('passwordRecovery.passwordMismatch')));
    callback();
}

function showRequestError(error: unknown) {
    ElMessage.error(resolveFriendlyRequestMessage(error, String(locale.value || 'zh-CN')));
}
</script>

<style scoped>
.recovery-page { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(420px, .85fr); position: relative; background: #f5f9fc; color: #102a43; }
.recovery-toolbar { position: absolute; z-index: 3; top: 28px; right: 38px; }
.recovery-hero, .recovery-panel { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
.recovery-hero { padding: 72px clamp(48px, 8vw, 148px); background: #eaf5f7; }
.recovery-hero__eyebrow { width: fit-content; padding: 6px 12px; border: 1px solid #b9ddd9; border-radius: 6px; background: #fff; color: #0f766e; font-size: 12px; font-weight: 700; }
.recovery-hero__brand { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
.recovery-hero__brand img { width: 64px; height: 64px; }
.recovery-hero__brand > div > div { display: flex; align-items: center; gap: 14px; font-size: 38px; }
.recovery-hero__brand strong { font-size: 40px; }
.recovery-hero__brand span { color: #0f766e; font-weight: 700; }
.recovery-hero__brand i { width: 1px; height: 38px; background: #a8c4cc; }
.recovery-hero__brand small { color: #557084; font-weight: 600; }
.recovery-hero h1 { max-width: 620px; margin: 38px 0 14px; font-size: 44px; line-height: 1.18; letter-spacing: 0; }
.recovery-hero > p { max-width: 620px; margin: 0; color: #536b7e; font-size: 16px; line-height: 1.8; }
.recovery-hero__assurance { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 28px; }
.recovery-hero__assurance span { display: inline-flex; align-items: center; gap: 7px; color: #334e68; font-size: 14px; }
.recovery-hero__assurance .el-icon { color: #0f766e; }
.recovery-panel { align-items: center; padding: 90px 48px 48px; background: #f8fafc; }
.recovery-card { width: min(100%, 480px); padding: 30px; border: 1px solid #dce7eb; border-radius: 8px; background: #fff; box-shadow: 0 22px 60px rgb(16 42 67 / 10%); }
.recovery-card__header { display: grid; grid-template-columns: 38px 44px 1fr; align-items: center; gap: 12px; }
.recovery-card__header img { width: 42px; height: 42px; }
.recovery-card__header h2 { margin: 0; font-size: 23px; letter-spacing: 0; }
.recovery-card__header p { margin: 4px 0 0; color: #627d98; font-size: 13px; line-height: 1.5; }
.icon-back { width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border: 1px solid #d3e0e6; border-radius: 6px; background: #fff; color: #486581; cursor: pointer; }
.icon-back:hover { color: #0f766e; border-color: #67b6ae; }
.recovery-progress { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin: 24px 0 28px; }
.recovery-progress span { height: 4px; border-radius: 2px; background: #dce7eb; }
.recovery-progress span.active { background: linear-gradient(90deg, #0f766e, #2563a6); }
.recovery-form { min-height: 244px; }
.recovery-form :deep(.el-input__wrapper) { min-height: 44px; border-radius: 6px; }
.captcha-row { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) 126px; gap: 10px; }
.captcha-image { height: 44px; padding: 0; border: 1px solid #d3e0e6; border-radius: 6px; overflow: hidden; background: #f8fafc; color: #0f766e; cursor: pointer; }
.captcha-image img { display: block; width: 100%; height: 100%; object-fit: cover; }
.captcha-image .el-icon { font-size: 20px; }
.primary-action { width: 100%; height: 44px; margin-top: 4px; border-radius: 6px; font-weight: 700; }
.text-action { display: block; margin: 16px auto 0; border: 0; background: transparent; color: #0f766e; cursor: pointer; }
.text-action:disabled { color: #9fb3c8; cursor: default; }
.stage-icon { width: 52px; height: 52px; display: grid; place-items: center; margin: 4px auto 20px; border-radius: 50%; background: #e8f6f4; color: #0f766e; font-size: 24px; }
.verification-code-hint { margin: -10px 0 0; color: #627d98; font-size: 12px; line-height: 1.5; }
.delivery-hint { margin: 7px 0 16px; color: #627d98; font-size: 12px; line-height: 1.5; }
.password-requirements { display: grid; gap: 6px; margin: -2px 0 18px; color: #829ab1; font-size: 12px; }
.password-requirements span::before { content: '○'; margin-right: 7px; }
.password-requirements span.met { color: #047857; }
.password-requirements span.met::before { content: '✓'; }
.password-history-hint { margin: -4px 0 14px; color: #627d98; font-size: 12px; line-height: 1.6; }
.terminal-state { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.terminal-state > .el-icon { font-size: 54px; }
.terminal-state h3 { margin: 18px 0 8px; font-size: 22px; }
.terminal-state p { max-width: 360px; margin: 0 0 24px; color: #627d98; line-height: 1.7; }
.terminal-state--success > .el-icon { color: #059669; }
.terminal-state--warning > .el-icon { color: #b45309; }
.recovery-card footer { margin-top: 26px; text-align: center; color: #829ab1; font-size: 12px; }
.spinning { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 960px) {
    .recovery-page { grid-template-columns: 1fr; }
    .recovery-hero { display: none; }
    .recovery-panel { min-height: 100vh; padding: 88px 20px 28px; }
    .recovery-toolbar { top: 20px; right: 20px; }
}
@media (max-width: 520px) {
    .recovery-card { padding: 24px 20px; box-shadow: none; }
    .recovery-card__header { grid-template-columns: 34px 38px 1fr; gap: 9px; }
    .recovery-card__header h2 { font-size: 19px; }
    .captcha-row { grid-template-columns: minmax(0, 1fr) 108px; }
}
</style>
