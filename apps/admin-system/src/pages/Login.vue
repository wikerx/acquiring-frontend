<template>
    <main class="login-page">
        <section class="login-art">
            <div class="login-art-content">
                <span>Payment Acquiring</span>
                <h1>Acquiring Admin</h1>
                <p>商户、交易、风控和基础数据统一运营入口</p>
            </div>
        </section>
        <section class="login-panel-wrap">
            <el-card class="login-panel" shadow="never">
                <div class="login-heading">
                    <span class="brand-mark">A</span>
                    <div>
                        <h2>管理后台登录</h2>
                        <p>Internal Admin Console</p>
                    </div>
                </div>
                <el-form
                    ref="formRef"
                    :model="form"
                    :rules="rules"
                    label-position="top"
                    @submit.prevent="handleLogin"
                >
                    <el-form-item label="账号" prop="loginAccount">
                        <el-input
                            v-model.trim="form.loginAccount"
                            autocomplete="username"
                            size="large"
                            placeholder="请输入后台账号"
                        />
                    </el-form-item>
                    <el-form-item label="密码" prop="password">
                        <el-input
                            v-model="form.password"
                            type="password"
                            autocomplete="current-password"
                            show-password
                            size="large"
                            placeholder="请输入登录密码"
                        />
                    </el-form-item>
                    <el-button
                        type="primary"
                        class="full-button"
                        size="large"
                        :loading="loading"
                        @click="handleLogin"
                    >
                        登录
                    </el-button>
                </el-form>
                <div class="login-security">
                    <el-tag type="success" effect="light">JWT 登录态</el-tag>
                    <el-tag type="info" effect="light">RBAC 权限</el-tag>
                    <el-tag type="warning" effect="light">操作审计</el-tag>
                </div>
            </el-card>
        </section>
    </main>
</template>

<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import type { FormInstance, FormRules } from 'element-plus';
    import { ElMessage } from 'element-plus';
    import { unwrapResult } from '@acquiring/shared';
    import { login } from '@/api/authApi';
    import { useAuthStore } from '@/stores/authStore';

    const route = useRoute();
    const router = useRouter();
    const auth = useAuthStore();
    const loading = ref(false);
    const formRef = ref<FormInstance>();
    const form = reactive({
        loginAccount: '',
        password: '',
    });
    const rules: FormRules = {
        loginAccount: [{ required: true, message: '请输入后台账号', trigger: 'blur' }],
        password: [
            { required: true, message: '请输入登录密码', trigger: 'blur' },
            { min: 8, max: 64, message: '密码长度应为 8-64 位', trigger: 'blur' },
        ],
    };

    async function handleLogin() {
        const valid = await formRef.value?.validate().catch(() => false);
        if (!valid) {
            return;
        }
        loading.value = true;
        try {
            const response = unwrapResult((await login(form)).data);
            auth.setLoginResponse(response);
            const redirect =
                typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
                    ? route.query.redirect
                    : '/dashboard';
            await router.push(redirect);
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '登录失败');
        } finally {
            loading.value = false;
        }
    }
</script>
