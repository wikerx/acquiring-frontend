<template>
    <div class="app-container monitor-cache-page">
        <MonitorPageHeader :title="t('monitor.cache.title')" :description="t('monitor.cache.description')">
            <el-button :icon="Refresh" size="small" :loading="loading" @click="loadData">{{ t('common.refresh') }}</el-button>
        </MonitorPageHeader>

        <el-alert v-if="errorMessage" :title="errorMessage" type="warning" show-icon :closable="false" class="monitor-cache-page__notice" />

        <el-row :gutter="16" v-loading="loading">
            <el-col :xs="24" :md="8" class="monitor-cache-page__card-col">
                <el-card shadow="never"><template #header><strong>{{ t('monitor.cache.basicInfo') }}</strong></template><div v-for="item in infoItems" :key="item.label" class="monitor-cache-page__item"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></el-card>
            </el-col>
            <el-col :xs="24" :md="8" class="monitor-cache-page__card-col">
                <el-card shadow="never"><template #header><strong>{{ t('monitor.cache.cmdStats') }}</strong></template><div v-for="item in cmdItems" :key="item.label" class="monitor-cache-page__item"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></el-card>
            </el-col>
            <el-col :xs="24" :md="8" class="monitor-cache-page__card-col">
                <el-card shadow="never"><template #header><strong>{{ t('monitor.cache.memInfo') }}</strong></template><div v-for="item in memItems" :key="item.label" class="monitor-cache-page__item"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></el-card>
            </el-col>
        </el-row>

        <MonitorCapabilityAlert :capability="historyCapability" :title="t('monitor.workbench.cache.historyCapabilityTitle')" />
        <MonitorCapabilityAlert :capability="keyTypeCapability" :title="t('monitor.workbench.cache.keyTypeCapabilityTitle')" />
        <MonitorChartGrid page-definition-id="redis">
            <MonitorChartPanel definition-id="redis.memory" :dataset="memoryDataset" :state="historyState" @retry="loadData" />
            <MonitorChartPanel definition-id="redis.ops" :dataset="opsDataset" :state="historyState" @retry="loadData" />
            <MonitorChartPanel definition-id="redis.hitRate" :dataset="hitRateDataset" :state="historyState" @retry="loadData" />
            <MonitorChartPanel definition-id="redis.keyTypes" :dataset="keyTypeDataset" :state="keyTypeState" @retry="loadData" />
        </MonitorChartGrid>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { MonitorChartGrid, MonitorChartPanel } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { getCacheInfo, getCacheMetrics } from '@/api/monitor/cache';
import type { CacheMetricsResponse, ProviderCapability } from '@/api/monitor/workbench';
import {
    createRedisHitRateDataset,
    createRedisKeyTypeDataset,
    createRedisMemoryDataset,
    createRedisOpsDataset,
    hasDatasetValues,
    monitorLoadState,
} from '@/api/monitor/workbenchAdapters';

/**
 * Redis 缓存监控主页面：展示连接摘要、进程内历史指标和有界 Key 类型分布。
 * 指标缺失时保留后端能力原因，不把未采样或无请求误展示为零。
 */
const { t } = useI18n();
interface InfoItem { label: string; value: string }

const loading = ref(false);
const errorMessage = ref('');
const infoItems = ref<InfoItem[]>([]);
const cmdItems = ref<InfoItem[]>([]);
const memItems = ref<InfoItem[]>([]);
const metrics = ref<CacheMetricsResponse | null>(null);
const metricsError = ref('');
const unavailableCapability = (provider: string): ProviderCapability => ({
    provider,
    status: 'UNAVAILABLE',
    reason: metricsError.value || t('monitor.workbench.cache.metricsUnavailable'),
});
const historyCapability = computed<ProviderCapability>(() => metrics.value?.historyCapability || unavailableCapability('REDIS_HISTORY_METRICS'));
const keyTypeCapability = computed<ProviderCapability>(() => metrics.value?.keyTypeCapability || unavailableCapability('REDIS_KEY_TYPE_METRICS'));
const memoryDataset = computed(() => createRedisMemoryDataset(metrics.value?.memoryTrend || [], t));
const opsDataset = computed(() => createRedisOpsDataset(metrics.value?.opsTrend || [], t));
const hitRateDataset = computed(() => createRedisHitRateDataset(metrics.value?.hitRateTrend || [], t));
const keyTypeDataset = computed(() => createRedisKeyTypeDataset(metrics.value?.keyTypeDistribution || []));
const historyState = computed(() => monitorLoadState({
    loading: loading.value,
    error: metricsError.value,
    hasResponse: metrics.value !== null,
    hasData: hasDatasetValues(memoryDataset.value)
        || hasDatasetValues(opsDataset.value)
        || hasDatasetValues(hitRateDataset.value),
    lastUpdatedAt: metrics.value?.generatedAt,
    emptyDescription: historyCapability.value.reason,
}));
const keyTypeState = computed(() => monitorLoadState({
    loading: loading.value,
    error: metricsError.value,
    hasResponse: metrics.value !== null,
    hasData: keyTypeDataset.value.values.length > 0,
    lastUpdatedAt: metrics.value?.generatedAt,
    emptyDescription: keyTypeCapability.value.reason,
}));

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    metricsError.value = '';
    const [infoResult, metricsResult] = await Promise.allSettled([getCacheInfo(), getCacheMetrics()]);
    try {
        if (infoResult.status === 'rejected') throw infoResult.reason;
        const data = infoResult.value;
        if (!data.connected) errorMessage.value = data.message || t('monitor.cache.redisUnavailable');
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
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    }
    if (metricsResult.status === 'fulfilled') {
        metrics.value = metricsResult.value;
    } else {
        metricsError.value = metricsResult.reason instanceof Error
            ? metricsResult.reason.message
            : t('monitor.workbench.cache.metricsUnavailable');
    }
    loading.value = false;
}

function formatValue(value?: string) { return value && value.length > 0 ? value : '-'; }
</script>

<style scoped>
.monitor-cache-page__notice,
.monitor-cache-page__card-col { margin-bottom: 16px; }
.monitor-cache-page :deep(.el-card) { border-radius: 8px; }
.monitor-cache-page__item { display: flex; justify-content: space-between; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--el-border-color-extra-light); font-size: 13px; }
.monitor-cache-page__item span { color: var(--el-text-color-secondary); }
.monitor-cache-page__item strong { color: var(--el-text-color-primary); font-weight: 500; }
</style>
