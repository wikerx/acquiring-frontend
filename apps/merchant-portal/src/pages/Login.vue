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

                    <el-form class="merchant-login-form" :model="form" label-position="top" @submit.prevent="handleLogin">
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
                                <el-button
                                    class="merchant-login-verify-code__button"
                                    :loading="sendingCode"
                                    :disabled="loading || loadingCredential"
                                    @click="handleSendVerifyCode"
                                >
                                    {{ t('login.getVerifyCode') }}
                                </el-button>
                            </div>
                        </el-form-item>
                        <el-button type="primary" class="merchant-login-submit" :loading="loading || loadingCredential" @click="handleLogin">
                            {{ t('login.submit') }}
                        </el-button>
                    </el-form>

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
import { resolveFriendlyRequestMessage } from '@acquiring/shared';
import { getSystemBrand } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { defaultLoginCredential, login, sendLoginVerifyCode } from '@/api/authApi';
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
const credentialLoaded = ref(false);
const verifyCodeReceiver = ref('');
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
const loginHint = computed(() => {
    if (verifyCodeReceiver.value) {
        return `${t('login.verifyCodeSentTo')} ${verifyCodeReceiver.value}`;
    }
    return credentialLoaded.value ? t('login.defaultCredentialLoaded') : t('login.footerDescription');
});

onMounted(loadDefaultCredential);

watch(
    () => [form.merchantId, form.loginAccount],
    () => {
        form.verifyCodeId = '';
        form.verifyCode = '';
        verifyCodeReceiver.value = '';
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
        credentialLoaded.value = Boolean(credential.merchantId && credential.loginAccount && credential.password);
    } catch {
        credentialLoaded.value = false;
    } finally {
        loadingCredential.value = false;
    }
}

async function handleSendVerifyCode() {
    if (!form.merchantId || !form.loginAccount) {
        ElMessage.warning(t('login.accountRequired'));
        return;
    }
    sendingCode.value = true;
    try {
        const result = await sendLoginVerifyCode({
            loginAccount: form.loginAccount,
            merchantId: form.merchantId,
            scene: 'LOGIN',
        });
        form.verifyCodeId = result.verifyCodeId;
        form.verifyCode = result.devCode || '';
        verifyCodeReceiver.value = result.maskedReceiver;
        ElMessage.success(t('login.verifyCodeSent'));
    } catch (error) {
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        ElMessage.error(resolveFriendlyRequestMessage(error, locale));
    } finally {
        sendingCode.value = false;
    }
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
        auth.setLoginResponse(response);
        await router.push(firstAvailableMenuPath(response.menus || []));
    } catch (error) {
        const locale = document.documentElement.lang || navigator.language || 'zh-CN';
        ElMessage.error(resolveFriendlyRequestMessage(error, locale));
    } finally {
        loading.value = false;
    }
}
</script>
