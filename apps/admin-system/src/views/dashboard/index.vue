<template>
    <PageContainer
        title="首页"
        category="Dashboard"
        description="支付收单管理后台的运营概览和快捷入口。"
    >
        <div class="dashboard-metrics">
            <el-card v-for="item in metrics" :key="item.label" shadow="never">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.hint }}</small>
            </el-card>
        </div>

        <div class="dashboard-grid">
            <el-card shadow="never">
                <template #header>快捷入口</template>
                <div class="quick-grid">
                    <el-button
                        v-for="item in quickLinks"
                        :key="item.path"
                        plain
                        @click="$router.push(item.path)"
                    >
                        {{ item.title }}
                    </el-button>
                </div>
            </el-card>
            <el-card shadow="never">
                <template #header>近期趋势</template>
                <div class="trend-placeholder">
                    <div v-for="height in [42, 64, 56, 88, 72, 96, 84]" :key="height" :style="{ height: `${height}%` }" />
                </div>
            </el-card>
        </div>
    </PageContainer>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer/index.vue';

const metrics = [
    { label: '商户总数', value: '128', hint: 'base_merchant_info' },
    { label: '系统账号数', value: '24', hint: 'sys_account' },
    { label: '今日登录次数', value: '86', hint: 'sys_login_log' },
    { label: '今日操作次数', value: '312', hint: 'sys_oper_log' },
];

const quickLinks = [
    { title: '商户信息', path: '/merchant/info' },
    { title: '用户管理', path: '/system/user' },
    { title: '角色管理', path: '/system/role' },
    { title: '国家/地区', path: '/base/country' },
    { title: '日志管理', path: '/system/log' },
    { title: '密钥与 API 安全', path: '/security/api-security' },
];
</script>
