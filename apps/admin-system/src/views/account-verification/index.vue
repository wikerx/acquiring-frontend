<template>
    <main class="verification-page">
        <div class="verification-toolbar"><LanguageSwitch /></div>

        <section class="verification-brand" aria-labelledby="verification-brand-title">
            <div class="verification-brand__eyebrow">VEXRA ADMIN</div>
            <div class="verification-brand__identity" translate="no">
                <img :src="adminBrand.logos.icon" alt="" aria-hidden="true" />
                <div>
                    <div id="verification-brand-title"><strong>Vexra</strong><i></i><span>Admin</span></div>
                    <small>{{ adminBrand.subtitleEn }}</small>
                </div>
            </div>
            <h1>{{ t('accountVerification.heroTitle') }}</h1>
            <p>{{ t('accountVerification.heroSubtitle') }}</p>
            <div class="verification-brand__assurance">
                <span><el-icon><Message /></el-icon>{{ t('accountVerification.assuranceEmail') }}</span>
                <span><el-icon><Lock /></el-icon>{{ t('accountVerification.assuranceToken') }}</span>
            </div>
        </section>

        <section class="verification-panel">
            <div class="verification-card">
                <header class="verification-card__header">
                    <button class="icon-back" type="button" :title="t('accountVerification.backToLogin')" @click="router.push('/login')">
                        <el-icon><ArrowLeft /></el-icon>
                    </button>
                    <img :src="adminBrand.logos.icon" :alt="adminBrand.name" />
                    <div>
                        <h2>{{ stageTitle }}</h2>
                        <p>{{ stageSubtitle }}</p>
                    </div>
                </header>

                <div v-if="stage !== 'success' && stage !== 'invalid'" class="verification-progress" aria-hidden="true">
                    <span class="active"></span><span :class="{ active: stage === 'password' }"></span>
                </div>

                <el-form v-if="stage === 'code'" ref="codeFormRef" :model="codeForm" :rules="codeRules" class="verification-form" @submit.prevent="submitCode">
                    <div class="stage-icon"><el-icon><Message /></el-icon></div>
                    <el-form-item prop="emailCode">
                        <VerificationCodeInput
                            v-model="codeForm.emailCode"
                            mode="alphanumeric"
                            :label="t('accountVerification.codePlaceholder')"
                            autofocus
                        />
                    </el-form-item>
                    <p class="form-hint">{{ t('accountVerification.codeHint') }}</p>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">
                        {{ t('accountVerification.verify') }}
                    </el-button>
                </el-form>

                <el-form v-else-if="stage === 'password'" ref="passwordFormRef" :model="passwordForm" :rules="passwordRules" class="verification-form" @submit.prevent="submitPassword">
                    <el-form-item prop="newPassword">
                        <el-input v-model="passwordForm.newPassword" type="password" show-password autocomplete="new-password" :prefix-icon="Lock" :placeholder="t('accountVerification.newPassword')" />
                    </el-form-item>
                    <el-form-item prop="confirmPassword">
                        <el-input v-model="passwordForm.confirmPassword" type="password" show-password autocomplete="new-password" :prefix-icon="Lock" :placeholder="t('accountVerification.confirmPassword')" />
                    </el-form-item>
                    <div class="password-requirements">
                        <span :class="{ met: passwordChecks.length }">{{ t('accountVerification.passwordLength') }}</span>
                        <span :class="{ met: passwordChecks.upperLower }">{{ t('accountVerification.passwordCase') }}</span>
                        <span :class="{ met: passwordChecks.numberSpecial }">{{ t('accountVerification.passwordNumberSpecial') }}</span>
                    </div>
                    <p class="form-hint form-hint--warning">{{ t('accountVerification.tokenHint') }}</p>
                    <el-button class="primary-action" type="primary" native-type="submit" :loading="loading">
                        {{ t('accountVerification.activate') }}
                    </el-button>
                </el-form>

                <div v-else-if="stage === 'invalid'" class="terminal-state terminal-state--warning">
                    <el-icon><Warning /></el-icon>
                    <h3>{{ t('accountVerification.invalidTitle') }}</h3>
                    <p>{{ t('accountVerification.invalidMessage') }}</p>
                    <el-button type="primary" @click="router.replace('/login')">{{ t('accountVerification.backToLogin') }}</el-button>
                </div>

                <div v-else class="terminal-state terminal-state--success">
                    <el-icon><CircleCheck /></el-icon>
                    <h3>{{ t('accountVerification.successTitle') }}</h3>
                    <p>{{ t(successMessageKey) }}</p>
                    <el-button type="primary" @click="router.replace('/login')">{{ t('accountVerification.signIn') }}</el-button>
                </div>

                <footer>{{ t('login.copyright') }}</footer>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { ArrowLeft, CircleCheck, Lock, Message, Warning } from '@element-plus/icons-vue';
import { getSystemBrand, resolveFriendlyRequestMessage } from '@acquiring/shared';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';
import VerificationCodeInput from '@/components/VerificationCodeInput/index.vue';
import { completeAccountActivationApi, verifyAccountEmailApi } from '@/api/auth';

type VerificationStage = 'code' | 'password' | 'success' | 'invalid';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const adminBrand = getSystemBrand('admin');
const requestId = typeof route.query.requestId === 'string' ? route.query.requestId.trim() : '';
const stage = ref<VerificationStage>(requestId ? 'code' : 'invalid');
const loading = ref(false);
const actionToken = ref('');
const successKind = ref<'activation' | 'email'>('email');
const codeFormRef = ref<FormInstance>();
const passwordFormRef = ref<FormInstance>();
const codeForm = reactive({ emailCode: '' });
const passwordForm = reactive({ newPassword: '', confirmPassword: '' });

const stageTitle = computed(() => t(`accountVerification.stage.${stage.value}.title`));
const stageSubtitle = computed(() => t(`accountVerification.stage.${stage.value}.subtitle`));
const successMessageKey = computed(() => successKind.value === 'activation'
    ? 'accountVerification.activationSuccessMessage'
    : 'accountVerification.emailSuccessMessage');
const passwordChecks = computed(() => ({
    length: passwordForm.newPassword.length >= 12 && passwordForm.newPassword.length <= 64,
    upperLower: /[a-z]/.test(passwordForm.newPassword) && /[A-Z]/.test(passwordForm.newPassword),
    numberSpecial: /\d/.test(passwordForm.newPassword) && /[^A-Za-z0-9\s]/.test(passwordForm.newPassword),
}));

const codeRules: FormRules = {
    emailCode: [
        { required: true, message: () => t('accountVerification.codeRequired'), trigger: 'blur' },
        { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9]{6}$/, message: () => t('accountVerification.codeInvalid'), trigger: 'blur' },
    ],
};
const passwordRules = computed<FormRules>(() => ({
    newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
    confirmPassword: [{ validator: validateConfirmation, trigger: 'blur' }],
}));

onBeforeUnmount(clearSecrets);

async function submitCode() {
    const valid = await codeFormRef.value?.validate().catch(() => false);
    if (!valid || !requestId) return;
    loading.value = true;
    try {
        const response = await verifyAccountEmailApi({ requestId, emailCode: codeForm.emailCode });
        codeForm.emailCode = '';
        if (response.nextStep === 'COMPLETED') {
            successKind.value = 'email';
            stage.value = 'success';
            return;
        }
        if (!response.actionToken) {
            stage.value = 'invalid';
            return;
        }
        actionToken.value = response.actionToken;
        stage.value = 'password';
    } catch (error) {
        showRequestError(error);
    } finally {
        loading.value = false;
    }
}

async function submitPassword() {
    const valid = await passwordFormRef.value?.validate().catch(() => false);
    if (!valid || !requestId || !actionToken.value) return;
    loading.value = true;
    try {
        await completeAccountActivationApi({ requestId, actionToken: actionToken.value, newPassword: passwordForm.newPassword });
        clearSecrets();
        successKind.value = 'activation';
        stage.value = 'success';
    } catch (error) {
        showRequestError(error);
    } finally {
        loading.value = false;
    }
}

function validateNewPassword(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) return callback(new Error(t('accountVerification.newPasswordRequired')));
    if (!passwordChecks.value.length || !passwordChecks.value.upperLower || !passwordChecks.value.numberSpecial) {
        return callback(new Error(t('accountVerification.passwordComplexity')));
    }
    callback();
}

function validateConfirmation(_rule: unknown, value: string, callback: (error?: Error) => void) {
    if (!value) return callback(new Error(t('accountVerification.confirmPasswordRequired')));
    if (value !== passwordForm.newPassword) return callback(new Error(t('accountVerification.passwordMismatch')));
    callback();
}

function clearSecrets() {
    actionToken.value = '';
    codeForm.emailCode = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
}

function showRequestError(error: unknown) {
    ElMessage.error(resolveFriendlyRequestMessage(error, String(locale.value || 'zh-CN')));
}
</script>

<style scoped>
.verification-page { min-height: 100vh; display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(420px, .88fr); position: relative; background: #f5f9fc; color: #0f172a; }
.verification-toolbar { position: absolute; z-index: 3; top: 28px; right: 38px; }
.verification-brand, .verification-panel { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; }
.verification-brand { padding: 72px clamp(48px, 8vw, 148px); background: #eef6fb; }
.verification-brand__eyebrow { width: fit-content; padding: 6px 12px; border: 1px solid #dbeafe; border-radius: 6px; background: #fff; color: #1d4ed8; font-size: 12px; font-weight: 700; }
.verification-brand__identity { display: flex; align-items: center; gap: 16px; margin-top: 24px; }
.verification-brand__identity img { width: 64px; height: 64px; }
.verification-brand__identity > div > div { display: flex; align-items: center; gap: 14px; font-size: 38px; }
.verification-brand__identity strong { font-size: 40px; }
.verification-brand__identity span { color: #2563eb; font-weight: 700; }
.verification-brand__identity i { width: 1px; height: 38px; background: #cbd5e1; }
.verification-brand__identity small { color: #64748b; font-weight: 600; }
.verification-brand h1 { max-width: 620px; margin: 38px 0 14px; font-size: 44px; line-height: 1.18; letter-spacing: 0; }
.verification-brand > p { max-width: 620px; margin: 0; color: #53657d; font-size: 16px; line-height: 1.8; }
.verification-brand__assurance { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 28px; color: #334155; font-size: 14px; }
.verification-brand__assurance span { display: inline-flex; align-items: center; gap: 7px; }
.verification-brand__assurance .el-icon { color: #2563eb; }
.verification-panel { align-items: center; padding: 90px 48px 48px; background: #f8fafc; }
.verification-card { width: min(100%, 480px); padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; box-shadow: 0 22px 60px rgb(15 23 42 / 10%); }
.verification-card__header { display: grid; grid-template-columns: 38px 44px 1fr; align-items: center; gap: 12px; }
.verification-card__header img { width: 42px; height: 42px; }
.verification-card__header h2 { margin: 0; font-size: 23px; letter-spacing: 0; }
.verification-card__header p { margin: 4px 0 0; color: #64748b; font-size: 13px; line-height: 1.5; }
.icon-back { width: 36px; height: 36px; display: grid; place-items: center; padding: 0; border: 1px solid #dbe3ee; border-radius: 6px; background: #fff; color: #475569; cursor: pointer; }
.icon-back:hover { color: #2563eb; border-color: #93c5fd; }
.verification-progress { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin: 24px 0 28px; }
.verification-progress span { height: 4px; border-radius: 2px; background: #e2e8f0; }
.verification-progress span.active { background: #2563eb; }
.verification-form { min-height: 250px; }
.verification-form :deep(.el-input__wrapper) { min-height: 44px; border-radius: 6px; }
.stage-icon { width: 52px; height: 52px; display: grid; place-items: center; margin: 4px auto 20px; border-radius: 50%; background: #eff6ff; color: #2563eb; font-size: 24px; }
.primary-action { width: 100%; height: 44px; margin-top: 8px; border-radius: 6px; font-weight: 700; }
.form-hint { margin: 8px 0 18px; color: #64748b; font-size: 12px; line-height: 1.6; }
.form-hint--warning { color: #9a3412; }
.password-requirements { display: grid; gap: 6px; margin: -2px 0 14px; color: #94a3b8; font-size: 12px; }
.password-requirements span::before { content: '○'; margin-right: 7px; }
.password-requirements span.met { color: #047857; }
.password-requirements span.met::before { content: '✓'; }
.terminal-state { min-height: 280px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.terminal-state > .el-icon { font-size: 54px; }
.terminal-state h3 { margin: 18px 0 8px; font-size: 22px; }
.terminal-state p { max-width: 360px; margin: 0 0 24px; color: #64748b; line-height: 1.7; }
.terminal-state--success > .el-icon { color: #059669; }
.terminal-state--warning > .el-icon { color: #d97706; }
.verification-card footer { margin-top: 26px; text-align: center; color: #94a3b8; font-size: 12px; }
@media (max-width: 960px) { .verification-page { grid-template-columns: 1fr; } .verification-brand { display: none; } .verification-panel { min-height: 100vh; padding: 88px 20px 28px; } .verification-toolbar { top: 20px; right: 20px; } }
@media (max-width: 520px) { .verification-card { padding: 24px 20px; box-shadow: none; } .verification-card__header { grid-template-columns: 34px 38px 1fr; gap: 9px; } .verification-card__header h2 { font-size: 19px; } }
</style>
