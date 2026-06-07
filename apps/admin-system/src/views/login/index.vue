<template>
    <main class="login-page">
        <section class="login-visual">
            <div class="login-copy">
                <span>Payment Acquiring Platform</span>
                <h1>Acquiring Admin</h1>
                <p>系统权限、商户资料、密钥资产和基础字典的统一管理后台。</p>
            </div>
        </section>
        <section class="login-form-area">
            <el-form
                ref="formRef"
                :model="form"
                :rules="rules"
                label-position="top"
                class="login-form"
                @submit.prevent="handleLogin"
            >
                <div class="login-title">
                    <span class="brand-mark">A</span>
                    <div>
                        <h2>管理后台登录</h2>
                        <p>Internal Operations Console</p>
                    </div>
                </div>
                <el-form-item label="账号" prop="loginAccount">
                    <el-input v-model.trim="form.loginAccount" size="large" autocomplete="username" />
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input
                        v-model="form.password"
                        size="large"
                        type="password"
                        show-password
                        autocomplete="current-password"
                    />
                </el-form-item>
                <el-form-item label="动态验证码" prop="verifyCode">
                    <div class="captcha-row">
                        <el-input v-model.trim="form.verifyCode" size="large" />
                        <el-button :loading="sendingCode" @click="handleSendVerifyCode">
                            获取验证码
                        </el-button>
                    </div>
                </el-form-item>
                <div class="login-options">
                    <el-checkbox v-model="form.rememberMe">记住我</el-checkbox>
                    <span v-if="maskedReceiver">已发送至 {{ maskedReceiver }}</span>
                </div>
                <el-button
                    class="login-submit"
                    type="primary"
                    size="large"
                    native-type="submit"
                    :loading="loading"
                    @click="handleLogin"
                >
                    登录
                </el-button>
            </el-form>
        </section>
    </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/store';

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
    loginAccount: [{ required: true, message: '请输入账号', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
    verifyCode: [{ required: true, message: '请输入动态验证码', trigger: 'blur' }],
};

async function handleSendVerifyCode() {
    if (!form.loginAccount) {
        ElMessage.warning('请先输入账号');
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
        ElMessage.success('验证码已发送');
    } finally {
        sendingCode.value = false;
    }
}

async function handleLogin() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (!form.verifyCodeId) {
        ElMessage.warning('请先获取验证码');
        return;
    }
    loading.value = true;
    try {
        await user.login(form);
        ElMessage.success('登录成功');
        const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard';
        await router.push(redirect);
    } finally {
        loading.value = false;
    }
}
</script>
