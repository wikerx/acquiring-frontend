<template>
    <main class="login-page">
        <div class="login-page__orb login-page__orb--violet"></div>
        <div class="login-page__orb login-page__orb--cyan"></div>
        <div class="login-page__toolbar">
            <div class="login-lang-switch">
                <LanguageSwitch />
            </div>
        </div>
        <div class="login-page__grid">
            <section class="login-hero">
                <div class="login-hero__eyebrow">{{ $t('login.brandEyebrow') }}</div>
                <img
                    class="login-hero__logo"
                    :src="adminBrand.logos.horizontal"
                    :alt="adminBrand.name"
                />
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
                                <el-button
                                    class="verify-code-button"
                                    :loading="sendingCode"
                                    size="default"
                                    @click="handleSendVerifyCode"
                                >
                                    {{ $t('login.getVerifyCode') }}
                                </el-button>
                            </div>
                        </el-form-item>
                        <el-form-item>
                            <div class="login-form__meta">
                                <el-checkbox v-model="form.rememberMe">{{ $t('login.rememberMe') }}</el-checkbox>
                                <span v-if="maskedReceiver" class="login-form__receiver">
                                    {{ $t('login.sentTo') }} {{ maskedReceiver }}
                                </span>
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
                    <div class="login-footer">
                        {{ $t('login.copyright') }}
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { UserFilled, Lock, Key } from '@element-plus/icons-vue';
import { VEXRA_BRAND, getSystemBrand } from '@acquiring/shared';
import { useUserStore } from '@/store/modules/user';
import { useI18n } from 'vue-i18n';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';

const { t, locale } = useI18n();
const adminBrand = getSystemBrand('admin');
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
const loading = ref(false);
const sendingCode = ref(false);
const maskedReceiver = ref('');
const form = reactive({
    loginAccount: 'admin',
    password: 'Admin@123456',
    verifyCodeId: '',
    verifyCode: '',
    rememberMe: true,
});

const rules: FormRules = {
    loginAccount: [{ required: true, message: () => t('login.accountRequired'), trigger: 'blur' }],
    password: [{ required: true, message: () => t('login.passwordRequired'), trigger: 'blur' }],
    verifyCode: [{ required: true, message: () => t('login.verifyCodeRequired'), trigger: 'blur' }],
};

async function handleSendVerifyCode() {
    if (!form.loginAccount) {
        ElMessage.warning(t('login.accountRequired'));
        return;
    }
    sendingCode.value = true;
    try {
        const result = await user.sendLoginVerifyCode(form.loginAccount);
        form.verifyCodeId = result.verifyCodeId;
        maskedReceiver.value = result.maskedReceiver;
        if (result.devCode) {
            form.verifyCode = result.devCode;
        }
        ElMessage.success(t('login.verifyCodeSent'));
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
        await user.login(form);
        ElMessage.success(t('login.loginSuccess'));
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
        await router.push(redirect);
    } finally {
        loading.value = false;
    }
}
</script>
