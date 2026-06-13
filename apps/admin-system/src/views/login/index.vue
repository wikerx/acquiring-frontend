<template>
    <main class="login-page">
        <div class="login-lang-switch">
            <LanguageSwitch />
        </div>
        <div class="login-form-container">
            <div class="login-brand">
                <span class="brand-mark">A</span>
                <div>
                    <h1>{{ $t('login.title') }}</h1>
                    <small>{{ $t('login.subtitle') }}</small>
                </div>
            </div>
            <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
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
                            :loading="sendingCode"
                            size="default"
                            @click="handleSendVerifyCode"
                        >
                            {{ $t('login.getVerifyCode') }}
                        </el-button>
                    </div>
                </el-form-item>
                <el-form-item>
                    <div style="display:flex;justify-content:space-between;width:100%">
                        <el-checkbox v-model="form.rememberMe">{{ $t('login.rememberMe') }}</el-checkbox>
                        <span v-if="maskedReceiver" style="color:#909399;font-size:12px">
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
        </div>
        <div class="login-footer">
            {{ $t('login.copyright') }}
        </div>
    </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { UserFilled, Lock, Key } from '@element-plus/icons-vue';
import { useUserStore } from '@/store';
import { useI18n } from 'vue-i18n';
import LanguageSwitch from '@/components/LanguageSwitch/index.vue';

const { t } = useI18n();
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
