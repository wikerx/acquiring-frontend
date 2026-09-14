<template>
    <div class="app-container monitor-server-page">
        <MonitorPageHeader :title="t('monitor.server.title')" :description="t('monitor.server.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
            <el-button :icon="Refresh" size="small" :loading="loading" @click="loadData">{{ t('common.refresh') }}</el-button>
        </MonitorPageHeader>

        <el-tabs v-model="activeTab" class="monitor-server-page__tabs">
            <el-tab-pane :label="t('monitor.workbench.service.snapshotTab')" name="snapshot">
                <el-alert v-if="snapshotError" :title="snapshotError" type="warning" show-icon :closable="false" class="monitor-server-page__notice" />
                <el-row :gutter="16" v-loading="snapshotLoading">
                    <el-col v-for="card in cards" :key="card.title" :xs="24" :sm="12" :lg="8" class="monitor-server-page__card-col">
                        <el-card shadow="never" class="monitor-server-page__snapshot-card">
                            <template #header><strong>{{ card.title }}</strong></template>
                            <div v-for="item in card.items" :key="item.label" class="monitor-server-page__snapshot-item">
                                <span>{{ item.label }}</span>
                                <strong>{{ item.value }}</strong>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-tab-pane>

            <el-tab-pane :label="t('monitor.workbench.service.instancesTab')" name="instances">
                <MonitorCapabilityAlert :capability="inventory?.metricsCapability" :title="t('monitor.workbench.service.metricsCapabilityTitle')" />
                <MonitorMetricGrid :items="serviceCards" />
                <StandardTable table-key="monitor-service-instances" v-loading="inventoryLoading" :data="inventory?.instances || []" :row-key="serviceInstanceRowKey" size="small">
                    <el-table-column prop="serviceName" :label="t('monitor.workbench.fields.service')" min-width="170" fixed="left" />
                    <el-table-column prop="instanceId" :label="t('monitor.workbench.fields.instanceId')" min-width="230" show-overflow-tooltip />
                    <el-table-column prop="host" :label="t('monitor.workbench.fields.host')" min-width="150" align="center" />
                    <el-table-column prop="port" :label="t('monitor.workbench.fields.port')" width="90" align="center" />
                    <el-table-column :label="t('monitor.workbench.fields.protocol')" width="100" align="center"><template #default="{ row }">{{ row.secure ? 'HTTPS' : 'HTTP' }}</template></el-table-column>
                    <el-table-column :label="t('common.status')" width="112" align="center"><template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
                    <el-table-column :label="t('monitor.workbench.fields.metadata')" min-width="280" show-overflow-tooltip><template #default="{ row }">{{ metadataText(row.metadata) }}</template></el-table-column>
                </StandardTable>
                <el-empty v-if="!inventoryLoading && !(inventory?.instances || []).length" :description="inventoryError || t('common.noData')" />
            </el-tab-pane>

            <el-tab-pane :label="t('monitor.workbench.service.runtimeTab')" name="runtime">
                <MonitorMetricGrid :items="runtimeCards" />
                <MonitorChartGrid page-definition-id="service-detail" class="monitor-server-page__charts">
                    <MonitorChartPanel definition-id="service.hostUsage" :dataset="hostUsageDataset" :state="runtimeState" @retry="loadRuntime" />
                    <MonitorChartPanel definition-id="service.jvmHeap" :dataset="heapDataset" :state="runtimeState" @retry="loadRuntime" />
                    <MonitorChartPanel definition-id="service.gc" :dataset="gcDataset" :state="runtimeState" @retry="loadRuntime" />
                    <MonitorChartPanel definition-id="service.threadPool" :dataset="threadPoolDataset" :state="threadPoolState" />
                </MonitorChartGrid>
                <MonitorCapabilityAlert :capability="runtime?.threadPoolCapability" :title="t('monitor.workbench.service.threadPoolCapabilityTitle')" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorTimeRangeSelector, type MonitorTimeRangeValue } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { getServerInfo, type ServerInfo } from '@/api/monitor/server';
import { getMonitorRuntime, getMonitorServices, type RuntimeResponse, type ServiceInventoryResponse } from '@/api/monitor/workbench';
import {
    createEmptyThreadPoolDataset,
    createMonitorTimeRange,
    createRuntimeGcDataset,
    createRuntimeHeapDataset,
    createRuntimeHostUsageDataset,
    formatBytes,
    formatCount,
    formatPercent,
    formatUptime,
    monitorLoadState,
    monitorTagType,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

/**
 * 服务监控主页面：在统一页签中组合当前主机快照、注册中心实例和 Admin JVM 历史采样。
 * 不可用的 Prometheus 或线程池指标通过能力状态展示，不由页面补造数据。
 */
const { locale, t } = useI18n();
const activeTab = ref('snapshot');
const timeRange = ref(createMonitorTimeRange('1h'));
const snapshotLoading = ref(false);
const inventoryLoading = ref(false);
const runtimeLoading = ref(false);
const snapshotError = ref('');
const inventoryError = ref('');
const runtimeError = ref('');
const inventory = ref<ServiceInventoryResponse>();
const runtime = ref<RuntimeResponse>();

interface Card { title: string; items: Array<{ label: string; value: string }> }

const cards = ref<Card[]>(emptyCards());
const loading = computed(() => snapshotLoading.value || inventoryLoading.value || runtimeLoading.value);
const serviceCards = computed(() => [
    { key: 'services', label: t('monitor.workbench.metric.serviceCount'), value: formatCount(inventory.value?.serviceCount, String(locale.value)) },
    { key: 'instances', label: t('monitor.workbench.metric.instanceCount'), value: formatCount(inventory.value?.instanceCount, String(locale.value)) },
    { key: 'healthy', label: t('monitor.workbench.metric.healthyInstances'), value: formatCount(inventory.value?.healthyInstanceCount, String(locale.value)), status: 'HEALTHY' },
    { key: 'unhealthy', label: t('monitor.workbench.metric.unhealthyInstances'), value: formatCount(inventory.value?.unhealthyInstanceCount, String(locale.value)), status: Number(inventory.value?.unhealthyInstanceCount || 0) > 0 ? 'ERROR' : 'HEALTHY' },
]);
const runtimeCards = computed(() => {
    const current = runtime.value?.current;
    if (!current) return [];
    return [
        { key: 'cpu', label: t('monitor.workbench.metric.systemCpu'), value: formatPercent(current.systemCpuPercent) },
        { key: 'memory', label: t('monitor.workbench.metric.physicalMemory'), value: `${formatBytes(current.physicalMemoryUsedBytes)} / ${formatBytes(current.physicalMemoryTotalBytes)}` },
        { key: 'heap', label: t('monitor.workbench.metric.heapUsed'), value: `${formatBytes(current.heapUsedBytes)} / ${formatBytes(current.heapMaxBytes)}` },
        { key: 'threads', label: t('monitor.workbench.metric.threadCount'), value: formatCount(current.threadCount, String(locale.value)) },
        { key: 'disk', label: t('monitor.workbench.metric.diskUsed'), value: `${formatBytes(current.diskUsedBytes)} / ${formatBytes(current.diskTotalBytes)}` },
        { key: 'uptime', label: t('monitor.workbench.metric.uptime'), value: formatUptime(current.uptimeMillis, t) },
    ];
});
const hostUsageDataset = computed(() => createRuntimeHostUsageDataset(runtime.value?.samples || [], t));
const heapDataset = computed(() => createRuntimeHeapDataset(runtime.value?.samples || [], t));
const gcDataset = computed(() => createRuntimeGcDataset(runtime.value?.samples || [], t));
const threadPoolDataset = computed(() => createEmptyThreadPoolDataset(t));
const runtimeState = computed(() => monitorLoadState({
    loading: runtimeLoading.value,
    error: runtimeError.value,
    hasResponse: Boolean(runtime.value),
    hasData: Boolean(runtime.value?.samples.length),
    lastUpdatedAt: runtime.value?.generatedAt,
}));
const threadPoolState = computed(() => monitorLoadState({
    loading: runtimeLoading.value,
    error: runtimeError.value,
    hasResponse: Boolean(runtime.value),
    hasData: false,
    emptyDescription: runtime.value?.threadPoolCapability?.reason || t('monitor.workbench.capability.notConfigured'),
}));

onMounted(() => loadData());

async function loadData() {
    await Promise.all([loadSnapshot(), loadInventory(), loadRuntime()]);
}

async function loadSnapshot() {
    snapshotLoading.value = true;
    snapshotError.value = '';
    try {
        cards.value = buildCards(await getServerInfo());
    } catch (error) {
        snapshotError.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        snapshotLoading.value = false;
    }
}

async function loadInventory() {
    inventoryLoading.value = true;
    inventoryError.value = '';
    try {
        inventory.value = await getMonitorServices();
    } catch (error) {
        inventoryError.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        inventoryLoading.value = false;
    }
}

async function loadRuntime() {
    runtimeLoading.value = true;
    runtimeError.value = '';
    try {
        runtime.value = await getMonitorRuntime(toMonitorTimeRangeQuery(timeRange.value));
    } catch (error) {
        runtimeError.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        runtimeLoading.value = false;
    }
}

function handleRangeChange(value: MonitorTimeRangeValue) {
    timeRange.value = value;
    loadRuntime();
}

function emptyCards(): Card[] {
    return [
        { title: t('monitor.server.cpu'), items: [] },
        { title: t('monitor.server.memory'), items: [] },
        { title: t('monitor.server.serverInfo'), items: [] },
        { title: t('monitor.server.jvm'), items: [] },
        { title: t('monitor.server.disk'), items: [] },
        { title: t('monitor.server.runtime'), items: [] },
    ];
}

function buildCards(info: ServerInfo): Card[] {
    const cpu = info.cpu || {};
    const jvm = info.jvm || {};
    const sys = info.system || {};
    const run = info.runtime || {};
    const disk = info.disk || {};
    return [
        { title: t('monitor.server.cpu'), items: [
            { label: t('monitor.server.cores'), value: value(cpu.availableProcessors) },
            { label: t('monitor.server.systemLoad'), value: value(cpu.systemLoadAverage) },
            { label: t('monitor.server.arch'), value: value(cpu.arch) },
            { label: t('monitor.server.name'), value: value(cpu.name) },
        ] },
        { title: t('monitor.server.memory'), items: [
            { label: t('monitor.server.maxMemory'), value: value(jvm.max) },
            { label: t('monitor.server.allocated'), value: value(jvm.total) },
            { label: t('monitor.server.free'), value: value(jvm.free) },
            { label: t('monitor.server.used'), value: value(jvm.used) },
        ] },
        { title: t('monitor.server.serverInfo'), items: [
            { label: t('monitor.server.osName'), value: value(sys.osName) },
            { label: t('monitor.server.osArch'), value: value(sys.osArch) },
            { label: t('monitor.server.userName'), value: value(sys.userName) },
        ] },
        { title: t('monitor.server.jvm'), items: [
            { label: t('monitor.server.javaVersion'), value: value(jvm.javaVersion) },
            { label: t('monitor.server.jvmMaxMem'), value: value(jvm.max) },
            { label: t('monitor.server.jvmFree'), value: value(jvm.free) },
            { label: t('monitor.server.jvmUsed'), value: value(jvm.used) },
        ] },
        { title: t('monitor.server.disk'), items: [
            { label: t('monitor.server.diskPath'), value: value(disk.path) },
            { label: t('monitor.server.diskTotal'), value: value(disk.total) },
            { label: t('monitor.server.diskFree'), value: value(disk.free) },
            { label: t('monitor.server.diskUsed'), value: value(disk.used) },
            { label: t('monitor.server.diskUsage'), value: value(disk.usagePercent) },
        ] },
        { title: t('monitor.server.runtime'), items: [
            { label: t('monitor.server.uptime'), value: value(run.uptime) },
            { label: t('monitor.server.javaVersion'), value: value(jvm.javaVersion) },
        ] },
    ];
}

function value(input: unknown) { return input === null || input === undefined || input === '' ? '-' : String(input); }
function statusText(input?: string) { return t(`monitor.workbench.status.${String(input || 'unknown').toLowerCase()}`, input || '-'); }
function metadataText(metadata?: Record<string, string>) {
    const entries = Object.entries(metadata || {});
    return entries.length ? entries.map(([key, item]) => `${key}=${item}`).join(' · ') : '-';
}
function serviceInstanceRowKey(row: ServiceInventoryResponse['instances'][number]) {
    return row.instanceId || `${row.serviceName}:${row.host || '-'}:${row.port ?? '-'}`;
}
</script>

<style scoped>
.monitor-server-page__tabs { min-height: 420px; }
.monitor-server-page__notice,
.monitor-server-page__charts { margin-bottom: 16px; }
.monitor-server-page__card-col { margin-bottom: 16px; }
.monitor-server-page__snapshot-card { min-height: 220px; border-radius: 8px; }
.monitor-server-page__snapshot-card strong { font-weight: 650; }
.monitor-server-page__snapshot-item { display: flex; justify-content: space-between; gap: 16px; padding: 7px 0; border-bottom: 1px solid var(--el-border-color-extra-light); font-size: 13px; }
.monitor-server-page__snapshot-item span { color: var(--el-text-color-secondary); }
.monitor-server-page__snapshot-item strong { overflow: hidden; color: var(--el-text-color-primary); font-weight: 500; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
</style>
