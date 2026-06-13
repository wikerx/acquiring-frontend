<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.data.title') }}</h1>

            </div>
            <el-tag type="info" size="small">{{ $t('monitor.data.pending') }}</el-tag>
        </div>

        <el-alert
            type="info"
            show-icon
            :closable="false"
            :title="$t('monitor.data.pending')"
            :description="$t('monitor.data.pendingMsg')"
            style="margin-bottom:16px"
        />

        <el-row :gutter="16">
            <el-col :span="8" v-for="card in cards" :key="card.title" style="margin-bottom:16px">
                <el-card shadow="never">
                    <template #header><span style="font-weight:600">{{ card.title }}</span></template>
                    <div v-for="item in card.items" :key="item.label" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f7fa">
                        <span style="color:#909399">{{ item.label }}</span>
                        <span>{{ item.value }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const cards = ref([
    { title: t('monitor.data.pool'), items: [
        { label: t('monitor.data.active'), value: '...' }, { label: t('monitor.data.idle'), value: '...' },
        { label: t('monitor.data.waiting'), value: '...' }, { label: t('monitor.data.max'), value: '...' },
    ]},
    { title: t('monitor.data.sqlStats'), items: [
        { label: t('monitor.data.execCount'), value: '...' }, { label: t('monitor.data.execTime'), value: '...' },
        { label: t('monitor.data.slowestSql'), value: '...' }, { label: t('monitor.data.errorCount'), value: '...' },
    ]},
    { title: t('monitor.data.otherMetrics'), items: [
        { label: t('monitor.data.datasourceName'), value: '...' }, { label: t('monitor.data.dbType'), value: '...' },
        { label: t('monitor.data.dbUrl'), value: '...' },
    ]},
]);
</script>
