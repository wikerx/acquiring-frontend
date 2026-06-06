<template>
    <main class="login-page">
        <el-card class="login-panel">
            <h1>Merchant Console</h1>
            <el-form :model="form" label-position="top" @submit.prevent="handleLogin">
                <el-form-item label="商户号">
                    <el-input v-model="form.merchantId" />
                </el-form-item>
                <el-form-item label="账号">
                    <el-input v-model="form.loginAccount" autocomplete="username" />
                </el-form-item>
                <el-form-item label="密码">
                    <el-input
                        v-model="form.password"
                        type="password"
                        autocomplete="current-password"
                        show-password
                    />
                </el-form-item>
                <el-button
                    type="primary"
                    class="full-button"
                    :loading="loading"
                    @click="handleLogin"
                    >登录</el-button
                >
            </el-form>
        </el-card>
    </main>
</template>

<script setup lang="ts">
    import { reactive, ref } from 'vue';
    import { useRouter } from 'vue-router';
    import { ElMessage } from 'element-plus';
    import { unwrapResult } from '@acquiring/shared';
    import { login } from '@/api/authApi';
    import { useAuthStore } from '@/stores/authStore';

    const router = useRouter();
    const auth = useAuthStore();
    const loading = ref(false);
    const form = reactive({
        merchantId: '',
        loginAccount: '',
        password: '',
    });

    async function handleLogin() {
        loading.value = true;
        try {
            const response = unwrapResult((await login(form)).data);
            auth.setLoginResponse(response);
            await router.push('/dashboard');
        } catch (error) {
            ElMessage.error(error instanceof Error ? error.message : '登录失败');
        } finally {
            loading.value = false;
        }
    }
</script>
