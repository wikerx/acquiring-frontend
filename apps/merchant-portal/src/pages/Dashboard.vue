<template>
    <section class="page">
        <h1>商户首页</h1>
        <div class="metric-grid">
            <el-card>
                <span>商户号</span>
                <strong>{{ auth.session?.account.merchantId }}</strong>
            </el-card>
            <el-card>
                <span>账号</span>
                <strong>{{ auth.session?.account.loginAccount }}</strong>
            </el-card>
            <el-card>
                <span>权限数量</span>
                <strong>{{ auth.session?.permissions.length || 0 }}</strong>
            </el-card>
        </div>
    </section>
</template>

<script setup lang="ts">
    import { useAuthStore } from '@/stores/authStore';

    const auth = useAuthStore();
</script>
