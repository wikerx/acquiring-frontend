<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('dashboard.title') }}</h1>
                
            </div>
        </div>
        <div class="dashboard-metrics">
            <el-card v-for="item in metrics" :key="item.label" shadow="never">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.hint }}</small>
            </el-card>
        </div>
        <div class="dashboard-grid">
            <el-card shadow="never">
                <template #header>{{ $t('dashboard.quickLinks') }}</template>
                <div class="quick-grid">
                    <el-button v-for="item in quickLinks" :key="item.path" plain size="small" @click="$router.push(item.path)">
                        {{ item.title }}
                    </el-button>
                </div>
            </el-card>
            <el-card shadow="never">
                <template #header>{{ $t('dashboard.trend') }}</template>
                <div class="trend-placeholder">
                    <div v-for="height in [42, 64, 56, 88, 72, 96, 84]" :key="height" :style="{ height: `${height}%` }" />
                </div>
            </el-card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const metrics = [
    { label: t('dashboard.merchantCount'), value: '128', hint: 'base_merchant_info' },
    { label: t('dashboard.accountCount'), value: '24', hint: 'sys_account' },
    { label: t('dashboard.loginCount'), value: '86', hint: 'sys_login_log' },
    { label: t('dashboard.operCount'), value: '312', hint: 'sys_oper_log' },
];

const quickLinks = [
    { title: t('dashboard.merchantInfo'), path: '/merchant/info' },
    { title: t('dashboard.userManagement'), path: '/system/user' },
    { title: t('dashboard.roleManagement'), path: '/system/role' },
    { title: t('dashboard.country'), path: '/base/country' },
    { title: t('dashboard.logManagement'), path: '/system/log' },
    { title: t('dashboard.apiSecurity'), path: '/security/api-security' },
];
</script>
