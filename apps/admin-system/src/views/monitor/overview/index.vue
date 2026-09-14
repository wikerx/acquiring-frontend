<template>
    <div class="app-container monitor-workbench-page">
        <MonitorPageHeader :title="t('monitor.workbench.overview.title')" :description="t('monitor.workbench.overview.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
            <el-button :icon="Refresh" size="small" :loading="loading" @click="loadData">{{ t('common.refresh') }}</el-button>
        </MonitorPageHeader>

        <el-alert
            v-if="providerGapText"
            :title="t('monitor.workbench.capability.partialTitle')"
            :description="providerGapText"
            type="info"
            show-icon
            :closable="false"
            class="monitor-workbench-page__notice"
        />

        <MonitorMetricGrid :items="summaryCards" />

        <MonitorChartGrid page-definition-id="overview" class="monitor-workbench-page__charts">
            <MonitorChartPanel definition-id="overview.apiRequests" :dataset="requestDataset" :state="requestState" @retry="loadData" />
            <MonitorChartPanel definition-id="overview.apiLatency" :dataset="latencyDataset" :state="latencyState" @retry="loadData" />
            <MonitorChartPanel definition-id="overview.alertTrend" :dataset="alertDataset" :state="alertState" @retry="loadData" />
            <el-card shadow="never" class="monitor-workbench-page__status-card">
                <template #header>
                    <div>
                        <strong>{{ t('monitor.workbench.overview.dependencies') }}</strong>
                        <p>{{ t('monitor.workbench.overview.dependenciesDescription') }}</p>
                    </div>
                </template>
                <MonitorStatusGrid :items="dependencyItems" />
            </el-card>
        </MonitorChartGrid>

        <section class="monitor-workbench-page__section">
            <div class="monitor-workbench-page__section-header">
                <div>
                    <h2>{{ t('monitor.workbench.overview.latestAlerts') }}</h2>
                    <p>{{ t('monitor.workbench.overview.latestAlertsDescription') }}</p>
                </div>
                <el-button type="primary" link @click="router.push('/monitor/alert')">{{ t('monitor.workbench.overview.viewAllAlerts') }}</el-button>
            </div>
            <StandardTable table-key="monitor-overview-latest-alerts" :data="overview?.latestAlerts || []" :row-key="alertRowKey" size="small">
                <el-table-column :label="t('monitor.workbench.fields.lastOccurredAt')" min-width="172" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.lastOccurredAt" /></template>
                </el-table-column>
                <el-table-column :label="t('monitor.workbench.fields.level')" width="110" align="center">
                    <template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.level)">{{ statusText(row.level) }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="sourceType" :label="t('monitor.workbench.fields.source')" width="130" align="center" />
                <el-table-column prop="serviceName" :label="t('monitor.workbench.fields.serviceModule')" min-width="150" show-overflow-tooltip />
                <el-table-column prop="title" :label="t('monitor.workbench.fields.title')" min-width="240" show-overflow-tooltip />
                <el-table-column :label="t('common.status')" width="110" align="center">
                    <template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.status)">{{ statusText(row.status) }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="occurrenceCount" :label="t('monitor.workbench.fields.occurrences')" width="100" align="center" />
                <el-table-column prop="ownerName" :label="t('monitor.workbench.fields.owner')" min-width="120" align="center">
                    <template #default="{ row }">{{ row.ownerName || '-' }}</template>
                </el-table-column>
                <el-table-column :label="t('common.operation')" width="100" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button type="primary" link :icon="View" @click="openAlert(row)">{{ t('common.detail') }}</el-button>
                    </template>
                </el-table-column>
            </StandardTable>
            <el-empty v-if="!loading && !(overview?.latestAlerts || []).length" :description="t('common.noData')" />
        </section>
    </div>
</template>

<script setup lang="ts">
/** 系统监控总览主页面：汇总服务、API、告警和关键依赖健康状态。 */
import { computed, onMounted, ref } from 'vue';
import { Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorStatusGrid, MonitorTimeRangeSelector } from '@/components/MonitorChart';
import { MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { getMonitorCapabilities, getMonitorOverview, type AlertItem, type OverviewResponse, type ProviderCapability } from '@/api/monitor/workbench';
import {
    createMonitorTimeRange,
    createOverviewAlertTrendDataset,
    createOverviewApiLatencyDataset,
    createOverviewApiRequestDataset,
    formatMetricValue,
    hasDatasetValues,
    monitorLoadState,
    monitorTagType,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

const { locale, t } = useI18n();
const router = useRouter();
const timeRange = ref(createMonitorTimeRange());
const loading = ref(false);
const errorMessage = ref('');
const overview = ref<OverviewResponse>();
const capabilities = ref<ProviderCapability[]>([]);

const requestDataset = computed(() => createOverviewApiRequestDataset(overview.value?.apiTrend || [], t));
const latencyDataset = computed(() => createOverviewApiLatencyDataset(overview.value?.apiLatencyTrend || [], t));
const alertDataset = computed(() => createOverviewAlertTrendDataset(overview.value?.alertTrend || [], t));
const requestState = computed(() => chartState(hasDatasetValues(requestDataset.value)));
const latencyState = computed(() => chartState(hasDatasetValues(latencyDataset.value)));
const alertState = computed(() => chartState(hasDatasetValues(alertDataset.value)));

const summaryCards = computed(() => (overview.value?.summaries || []).map((item) => ({
    key: item.key,
    label: t(`monitor.workbench.metric.${item.key}`, item.label || item.key),
    value: formatMetricValue(item, String(locale.value)),
    status: item.status,
    description: item.description,
})));

const dependencyItems = computed(() => (overview.value?.dependencies || []).map((item) => ({
    key: item.key,
    label: item.label,
    status: dependencyStatus(item.status),
    value: item.value,
    description: item.description,
})));

const providerGapText = computed(() => capabilities.value
    .filter((item) => item.status !== 'AVAILABLE')
    .map((item) => `${item.provider}: ${item.reason || t('monitor.workbench.capability.notConfigured')}`)
    .join(' · '));

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        const [overviewResult, capabilityResult] = await Promise.all([
            getMonitorOverview(toMonitorTimeRangeQuery(timeRange.value)),
            getMonitorCapabilities(),
        ]);
        overview.value = overviewResult;
        capabilities.value = capabilityResult;
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleRangeChange(value: typeof timeRange.value) {
    timeRange.value = value;
    loadData();
}

function chartState(hasData: boolean) {
    return monitorLoadState({
        loading: loading.value,
        error: errorMessage.value,
        hasResponse: Boolean(overview.value),
        hasData,
        lastUpdatedAt: overview.value?.generatedAt,
    });
}

function dependencyStatus(status?: string): 'healthy' | 'warning' | 'error' | 'unknown' {
    const value = String(status || '').toUpperCase();
    if (value === 'HEALTHY') return 'healthy';
    if (value === 'WARNING') return 'warning';
    if (value === 'ERROR' || value === 'CRITICAL') return 'error';
    return 'unknown';
}

function statusText(value?: string) {
    const normalized = String(value || 'UNKNOWN').toLowerCase();
    return t(`monitor.workbench.status.${normalized}`, value || '-');
}

function openAlert(row: AlertItem) {
    router.push({ path: '/monitor/alert', query: { sourceType: row.sourceType, sourceId: row.sourceId } });
}

function alertRowKey(row: AlertItem) {
    return `${row.sourceType}:${row.sourceId}`;
}
</script>

<style scoped>
.monitor-workbench-page__notice,
.monitor-workbench-page__charts { margin-bottom: 16px; }
.monitor-workbench-page__status-card { height: 300px; border-radius: 8px; }
.monitor-workbench-page__status-card :deep(.el-card__header) { padding: 16px 20px 10px; border-bottom: 0; }
.monitor-workbench-page__status-card :deep(.el-card__body) { height: 230px; padding: 0 20px 14px; overflow: auto; }
.monitor-workbench-page__status-card strong { color: var(--el-text-color-primary); font-size: 15px; }
.monitor-workbench-page__status-card p { margin: 2px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
.monitor-workbench-page__section { padding: 16px 20px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-bg-color); }
.monitor-workbench-page__section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.monitor-workbench-page__section-header h2 { margin: 0; font-size: 15px; line-height: 22px; }
.monitor-workbench-page__section-header p { margin: 2px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
</style>
