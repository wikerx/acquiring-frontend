<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.cache.title') }}</h1>
            </div>
            <el-button :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button>
        </div>

        <el-alert
            v-if="errorMessage"
            :title="errorMessage"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 16px"
        />

        <el-row :gutter="16" v-loading="loading">
            <el-col :span="8" style="margin-bottom:16px">
                <el-card shadow="never">
                    <template #header><span style="font-weight:600">{{ $t('monitor.cache.basicInfo') }}</span></template>
                    <div v-for="item in infoItems" :key="item.label" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f7fa">
                        <span style="color:#909399">{{ item.label }}</span>
                        <span>{{ item.value }}</span>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8" style="margin-bottom:16px">
                <el-card shadow="never">
                    <template #header><span style="font-weight:600">{{ $t('monitor.cache.cmdStats') }}</span></template>
                    <div v-for="item in cmdItems" :key="item.label" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f7fa">
                        <span style="color:#909399">{{ item.label }}</span>
                        <span>{{ item.value }}</span>
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8" style="margin-bottom:16px">
                <el-card shadow="never">
                    <template #header><span style="font-weight:600">{{ $t('monitor.cache.memInfo') }}</span></template>
                    <div v-for="item in memItems" :key="item.label" style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;border-bottom:1px solid #f5f7fa">
                        <span style="color:#909399">{{ item.label }}</span>
                        <span>{{ item.value }}</span>
                    </div>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Refresh } from '@element-plus/icons-vue';
import { getCacheInfo } from '@/api/monitor/cache';

const { t } = useI18n();

interface InfoItem {
    label: string;
    value: string;
}

const loading = ref(false);
const errorMessage = ref('');
const infoItems = ref<InfoItem[]>([]);
const cmdItems = ref<InfoItem[]>([]);
const memItems = ref<InfoItem[]>([]);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const data = await getCacheInfo();
        if (!data.connected) {
            errorMessage.value = data.message || t('monitor.cache.redisUnavailable');
        }
        const info = data.info || {};
        infoItems.value = [
            { label: t('monitor.cache.redisVersion'), value: formatValue(info.redis_version) },
            { label: t('monitor.cache.redisMode'), value: formatValue(info.redis_mode) },
            { label: t('monitor.cache.port'), value: formatValue(info.tcp_port) },
            { label: t('monitor.cache.clients'), value: formatValue(info.connected_clients) },
            { label: t('monitor.cache.uptimeDays'), value: formatValue(info.uptime_in_days) },
            { label: t('monitor.cache.role'), value: formatValue(info.role) },
        ];
        cmdItems.value = [
            { label: t('monitor.cache.cmdProcessed'), value: formatValue(info.total_commands_processed) },
            { label: t('monitor.cache.keyHits'), value: formatValue(info.keyspace_hits) },
            { label: t('monitor.cache.keyMisses'), value: formatValue(info.keyspace_misses) },
            { label: t('monitor.cache.keyExpired'), value: formatValue(info.expired_keys) },
        ];
        memItems.value = [
            { label: t('monitor.cache.memUsed'), value: formatValue(info.used_memory_human) },
            { label: t('monitor.cache.memRss'), value: formatValue(info.used_memory_rss_human) },
            { label: t('monitor.cache.memFragRatio'), value: formatValue(info.mem_fragmentation_ratio) },
            { label: t('monitor.cache.memPeak'), value: formatValue(info.used_memory_peak_human) },
        ];
    } finally {
        loading.value = false;
    }
}

function formatValue(value?: string) {
    return value && value.length > 0 ? value : '-';
}
</script>
