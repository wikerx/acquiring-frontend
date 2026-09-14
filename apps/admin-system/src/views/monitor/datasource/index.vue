<template>
    <div class="app-container monitor-datasource-page">
        <MonitorPageHeader :title="t('monitor.datasource.title')" :description="t('monitor.datasource.description')">
            <el-button :icon="Refresh" size="small" :loading="loading" @click="loadData">{{ t('common.refresh') }}</el-button>
        </MonitorPageHeader>

        <el-form :inline="true" :model="query" size="small" class="search-form" label-width="90px">
            <el-form-item :label="$t('monitor.datasource.keyword')">
                <el-input
                    v-model="query.keyword"
                    :placeholder="$t('monitor.datasource.keywordPlaceholder')"
                    clearable
                    @keyup.enter="applyFilter"
                />
            </el-form-item>
            <el-form-item :label="$t('monitor.datasource.groupFilter')">
                <el-select v-model="query.groupName" :placeholder="$t('common.pleaseSelect')" clearable style="width: 180px">
                    <el-option
                        v-for="item in groupOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('monitor.datasource.reachability')">
                <el-select v-model="query.reachable" :placeholder="$t('common.pleaseSelect')" clearable style="width: 180px">
                    <el-option :label="$t('monitor.datasource.reachable')" :value="'Y'" />
                    <el-option :label="$t('monitor.datasource.unreachable')" :value="'N'" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="applyFilter">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'monitor:datasource:export'">{{ $t('common.export') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @refresh="loadData" />
            </el-col>
        </el-row>

        <el-alert
            v-for="warning in warnings"
            :key="warning"
            type="warning"
            show-icon
            :closable="false"
            :title="warning"
            style="margin-bottom: 12px"
        />

        <MonitorMetricGrid :items="overviewCards" />

        <MonitorCapabilityAlert :capability="poolCapability" :title="t('monitor.workbench.datasource.poolCapabilityTitle')" />
        <MonitorCapabilityAlert :capability="sqlCapability" :title="t('monitor.workbench.datasource.sqlCapabilityTitle')" />

        <section class="datasource-console-band" aria-labelledby="datasource-console-title">
            <div class="datasource-console-band__content">
                <div class="datasource-console-band__heading">
                    <span id="datasource-console-title">{{ t('monitor.datasource.druidConsoleTitle') }}</span>
                    <el-tag size="small" :type="consoleStatusType">{{ consoleStatusLabel }}</el-tag>
                </div>
                <p>{{ t('monitor.datasource.druidConsoleDescription') }}</p>
                <div class="datasource-console-band__meta">
                    <span>{{ t('monitor.datasource.localPoolTypes') }}</span>
                    <el-space wrap>
                        <el-tag
                            v-for="poolType in consoleAccess.localPoolTypes || []"
                            :key="poolType"
                            size="small"
                            type="info"
                            effect="plain"
                        >
                            {{ poolType }}
                        </el-tag>
                        <span v-if="!(consoleAccess.localPoolTypes || []).length">-</span>
                    </el-space>
                </div>
                <div class="datasource-console-band__reason">{{ consoleAccess.reason || t('monitor.datasource.druidConsoleNotConfiguredHint') }}</div>
            </div>
            <el-button
                type="primary"
                :icon="LinkIcon"
                :disabled="!consoleConfigured"
                @click="openDruidConsole"
            >
                {{ t('monitor.datasource.openDruidConsole') }}
            </el-button>
        </section>

        <MonitorChartGrid page-definition-id="datasource" class="monitor-datasource-page__charts">
            <MonitorChartPanel definition-id="datasource.pool" :dataset="poolDataset" :state="poolState" @retry="loadData" />
            <MonitorChartPanel definition-id="datasource.sqlLatency" :dataset="latencyDataset" :state="sqlState" @retry="loadData" />
            <MonitorChartPanel definition-id="datasource.slowSqlTop" :dataset="slowSqlDataset" :state="sqlState" @retry="loadData" />
        </MonitorChartGrid>

        <el-card shadow="never" class="mb16">
            <template #header>
                <div class="card-header">
                    <span>{{ $t('monitor.datasource.groupSection') }}</span>
                </div>
            </template>
            <StandardTable table-key="monitor-datasource-groups" :data="groups" size="small" row-key="groupName">
                <el-table-column prop="groupName" :label="$t('monitor.datasource.groupName')" min-width="140" />
                <el-table-column prop="memberCount" :label="$t('monitor.datasource.memberCount')" width="120" align="center" />
                <el-table-column prop="strategyClassName" :label="$t('monitor.datasource.strategyClassName')" min-width="260" show-overflow-tooltip />
                <el-table-column :label="$t('monitor.datasource.memberKeys')" min-width="220">
                    <template #default="{ row }">
                        <el-space wrap>
                            <el-tag v-for="member in row.memberKeys || []" :key="member" size="small" type="info">{{ member }}</el-tag>
                        </el-space>
                    </template>
                </el-table-column>
            </StandardTable>
        </el-card>

        <el-card shadow="never" class="mb16">
            <template #header>
                <div class="card-header">
                    <span>{{ $t('monitor.datasource.datasourceSection') }}</span>
                </div>
            </template>
            <StandardTable table-key="monitor-datasource-list" :data="pagedDataSources" size="small" row-key="dataSourceKey" :row-class-name="dataSourceRowClassName">
                <el-table-column prop="dataSourceKey" :label="$t('monitor.datasource.datasourceKey')" min-width="150" fixed="left" />
                <el-table-column prop="groupName" :label="$t('monitor.datasource.groupName')" width="120" align="center" />
                <el-table-column prop="role" :label="$t('monitor.datasource.role')" width="130" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" :type="roleTagType(row.role)">{{ formatRole(row.role) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="running" :label="$t('monitor.datasource.poolStatus')" width="120" align="center">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.running ? 'SUCCESS' : 'FAILED'" />
                    </template>
                </el-table-column>
                <el-table-column prop="reachable" :label="$t('monitor.datasource.reachability')" width="120" align="center">
                    <template #default="{ row }">
                        <BaseStatusTag :value="row.reachable ? 'SUCCESS' : 'FAILED'" />
                    </template>
                </el-table-column>
                <el-table-column prop="poolName" :label="$t('monitor.datasource.poolName')" min-width="180" show-overflow-tooltip />
                <el-table-column prop="databaseName" :label="$t('monitor.datasource.databaseName')" min-width="140" />
                <el-table-column prop="jdbcUrl" :label="$t('monitor.datasource.jdbcUrl')" min-width="280" show-overflow-tooltip />
                <el-table-column prop="activeConnections" :label="$t('monitor.datasource.activeConnections')" width="110" align="center" />
                <el-table-column prop="idleConnections" :label="$t('monitor.datasource.idleConnections')" width="110" align="center" />
                <el-table-column prop="totalConnections" :label="$t('monitor.datasource.totalConnections')" width="110" align="center" />
                <el-table-column prop="threadsAwaitingConnection" :label="$t('monitor.datasource.awaitingThreads')" width="120" align="center" />
                <el-table-column prop="maximumPoolSize" :label="$t('monitor.datasource.maximumPoolSize')" width="120" align="center" />
                <el-table-column prop="minimumIdle" :label="$t('monitor.datasource.minimumIdle')" width="110" align="center" />
                <el-table-column :label="$t('monitor.datasource.relatedShardingTables')" min-width="220">
                    <template #default="{ row }">
                        <el-tag v-if="(row.relatedShardingTables || []).length" size="small" type="info" effect="plain">
                            {{ t('monitor.datasource.relatedShardingTableCountSummary', { count: row.relatedShardingTables.length }) }}
                        </el-tag>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="90" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    </template>
                </el-table-column>
            </StandardTable>
            <div class="pagination-container" v-show="filteredDataSources.length > 0">
                <el-pagination
                    v-model:current-page="page"
                    v-model:page-size="pageSize"
                    :total="filteredDataSources.length"
                    :page-sizes="[10, 20, 50, 100]"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                />
            </div>
        </el-card>

        <el-card shadow="never">
            <template #header>
                <div class="card-header">
                    <span>{{ $t('monitor.datasource.shardingSection') }}</span>
                    <el-button type="primary" link size="small" @click="goShardingManagement">{{ $t('monitor.datasource.goShardingManagement') }}</el-button>
                </div>
            </template>
            <el-row :gutter="16" class="sharding-summary">
                <el-col v-for="item in shardingSummaryCards" :key="item.key" :xs="24" :sm="12" :md="6">
                    <div class="summary-item">
                        <div class="summary-item__label">{{ item.label }}</div>
                        <div class="summary-item__value">{{ item.value }}</div>
                    </div>
                </el-col>
            </el-row>
            <el-alert
                type="info"
                :closable="false"
                show-icon
                :title="$t('monitor.datasource.shardingOverviewHint')"
            />
        </el-card>


        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('monitor.datasource.datasourceDetail')" size="md">
            <el-descriptions :column="1" border size="small" v-if="activeDataSource">
                <el-descriptions-item :label="$t('monitor.datasource.datasourceKey')">{{ activeDataSource.dataSourceKey }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.groupName')">{{ activeDataSource.groupName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.role')">{{ formatRole(activeDataSource.role) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.dataSourceClassName')">{{ activeDataSource.dataSourceClassName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.poolName')">{{ activeDataSource.poolName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.jdbcUrl')">{{ activeDataSource.jdbcUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.poolStatus')">
                    <BaseStatusTag :value="activeDataSource.running ? 'SUCCESS' : 'FAILED'" />
                </el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.reachability')">
                    <BaseStatusTag :value="activeDataSource.reachable ? 'SUCCESS' : 'FAILED'" />
                </el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.reachabilityMessage')">{{ activeDataSource.reachabilityMessage || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.connectionTimeoutMs')">{{ activeDataSource.connectionTimeoutMs ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.idleTimeoutMs')">{{ activeDataSource.idleTimeoutMs ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.maxLifetimeMs')">{{ activeDataSource.maxLifetimeMs ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.datasource.relatedShardingTables')">
                    <el-space wrap>
                        <el-tag v-for="table in activeDataSource.relatedShardingTables || []" :key="table" size="small">{{ table }}</el-tag>
                        <span v-if="!(activeDataSource.relatedShardingTables || []).length">-</span>
                    </el-space>
                </el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Download, View, Link as LinkIcon } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import { MonitorChartGrid, MonitorChartPanel } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import {
    exportDatasourceSnapshot,
    getDatasourceMetrics,
    getDatasourceSnapshot,
    type DataSourceMonitorDataSourceItem,
    type DataSourceMonitorConsoleAccess,
    type DataSourceMonitorGroupItem,
    type DataSourceMonitorResponse,
} from '@/api/monitor/datasource';
import type { DataSourceMetricsResponse, ProviderCapability } from '@/api/monitor/workbench';
import {
    createDatasourceLatencyDataset,
    createDatasourcePoolDataset,
    createDatasourceSlowSqlDataset,
    hasDatasetValues,
    monitorLoadState,
} from '@/api/monitor/workbenchAdapters';
import { openExternalMenu } from '@/utils/external-menu';

/**
 * 数据源监控主页面：展示 Admin 当前 JVM 的动态数据源、Hikari 指标和分表摘要，
 * 并按后端配置提供目标 JVM 的 Druid 控制台入口。
 */
const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const snapshot = ref<DataSourceMonitorResponse>({});
const detailVisible = ref(false);
const activeDataSource = ref<DataSourceMonitorDataSourceItem | null>(null);
const page = ref(1);
const pageSize = ref(10);
const metrics = ref<DataSourceMetricsResponse | null>(null);
const metricsError = ref('');
const query = reactive({
    keyword: '',
    groupName: '',
    reachable: '',
});
const unavailableCapability = (provider: string): ProviderCapability => ({
    provider,
    status: 'UNAVAILABLE',
    reason: metricsError.value || t('monitor.workbench.datasource.metricsUnavailable'),
});
const poolCapability = computed<ProviderCapability>(() => metrics.value?.poolMetricsCapability || unavailableCapability('HIKARI_POOL_METRICS'));
const sqlCapability = computed<ProviderCapability>(() => metrics.value?.sqlMetricsCapability || unavailableCapability('MYSQL_PERFORMANCE_SCHEMA'));
const poolDataset = computed(() => createDatasourcePoolDataset(metrics.value?.poolTrend || [], t));
const latencyDataset = computed(() => createDatasourceLatencyDataset(metrics.value?.latencyTrend || [], t));
const slowSqlDataset = computed(() => createDatasourceSlowSqlDataset(metrics.value?.slowSqlTop || []));
const poolState = computed(() => monitorLoadState({
    loading: loading.value,
    error: metricsError.value,
    hasResponse: metrics.value !== null,
    hasData: hasDatasetValues(poolDataset.value),
    lastUpdatedAt: metrics.value?.generatedAt,
    emptyDescription: poolCapability.value.reason,
}));
const sqlState = computed(() => monitorLoadState({
    loading: loading.value,
    error: metricsError.value,
    hasResponse: metrics.value !== null,
    hasData: hasDatasetValues(latencyDataset.value) || slowSqlDataset.value.values.length > 0,
    lastUpdatedAt: metrics.value?.generatedAt,
    emptyDescription: sqlCapability.value.reason,
}));

onMounted(() => loadData());

const warnings = computed(() => snapshot.value.warnings || []);
const consoleAccess = computed<DataSourceMonitorConsoleAccess>(() => snapshot.value.consoleAccess || {});
const consoleConfigured = computed(() => consoleAccess.value.status === 'CONFIGURED' && Boolean(consoleAccess.value.url));
const consoleStatusType = computed<'success' | 'danger' | 'info'>(() => {
    if (consoleAccess.value.status === 'CONFIGURED') {
        return 'success';
    }
    if (consoleAccess.value.status === 'MISCONFIGURED') {
        return 'danger';
    }
    return 'info';
});
const consoleStatusLabel = computed(() => {
    const labels: Record<string, string> = {
        CONFIGURED: t('monitor.datasource.consoleStatusConfigured'),
        NOT_CONFIGURED: t('monitor.datasource.consoleStatusNotConfigured'),
        MISCONFIGURED: t('monitor.datasource.consoleStatusMisconfigured'),
    };
    return labels[consoleAccess.value.status || ''] || t('monitor.datasource.consoleStatusNotConfigured');
});
const groups = computed<DataSourceMonitorGroupItem[]>(() => snapshot.value.groups || []);
const groupOptions = computed(() => groups.value.map((item) => ({ label: item.groupName, value: item.groupName })));
const shardingSummaryCards = computed(() => {
    const sharding = snapshot.value.sharding || {};
    const overview = snapshot.value.overview || {};
    return [
        { key: 'strategy', label: t('monitor.datasource.strategyClassName'), value: sharding.strategy || '-' },
        { key: 'timezone', label: t('monitor.datasource.databaseTimezone'), value: sharding.databaseTimezone || '-' },
        { key: 'column', label: t('monitor.datasource.shardingColumn'), value: sharding.shardingColumn || '-' },
        { key: 'count', label: t('monitor.datasource.shardingTableCount'), value: String(overview.shardingTableCount ?? 0) },
        { key: 'ddl', label: t('monitor.datasource.ddlDataSource'), value: sharding.ddlDataSource || '-' },
        { key: 'create', label: t('monitor.datasource.allowCreateFromTemplateTable'), value: formatBoolean(sharding.allowCreateFromTemplateTable) },
        { key: 'alter', label: t('monitor.datasource.allowAlterExistingTable'), value: formatBoolean(sharding.allowAlterExistingTable) },
        { key: 'autoIncrement', label: t('monitor.datasource.setAutoIncrementStartValue'), value: formatBoolean(sharding.setAutoIncrementStartValue) },
    ];
});
const overviewCards = computed(() => {
    const overview = snapshot.value.overview || {};
    return [
        {
            key: 'profile',
            label: t('monitor.datasource.activeProfile'),
            value: overview.activeProfile || '-',
            description: `${t('monitor.datasource.primaryDataSource')}: ${overview.primaryDataSource || '-'}`,
        },
        {
            key: 'datasource',
            label: t('monitor.datasource.registeredDataSourceCount'),
            value: String(overview.registeredDataSourceCount ?? 0),
            description: `${t('monitor.datasource.healthyDataSourceCount')}: ${overview.healthyDataSourceCount ?? 0}`,
        },
        {
            key: 'group',
            label: t('monitor.datasource.registeredGroupCount'),
            value: String(overview.registeredGroupCount ?? 0),
            description: `${t('monitor.datasource.strictMode')}: ${formatBoolean(overview.strictMode)}`,
        },
        {
            key: 'sharding',
            label: t('monitor.datasource.shardingTableCount'),
            value: String(overview.shardingTableCount ?? 0),
            description: shortClassName(overview.routingStrategyClassName),
        },
    ];
});

const filteredDataSources = computed<DataSourceMonitorDataSourceItem[]>(() => {
    const keyword = query.keyword.trim().toLowerCase();
    return (snapshot.value.dataSources || []).filter((item) => {
        const matchesKeyword = !keyword
            || [
                item.dataSourceKey,
                item.groupName,
                item.poolName,
                item.jdbcUrl,
                item.databaseName,
                ...(item.relatedShardingTables || []),
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(keyword));
        const matchesGroup = !query.groupName || item.groupName === query.groupName;
        const matchesReachable = !query.reachable
            || (query.reachable === 'Y' ? item.reachable === true : item.reachable === false);
        return matchesKeyword && matchesGroup && matchesReachable;
    });
});


const pagedDataSources = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredDataSources.value.slice(start, start + pageSize.value);
});

/** 同时刷新数据源快照和分钟级指标；任一请求失败时保留另一部分可用数据。 */
async function loadData() {
    loading.value = true;
    metricsError.value = '';
    const [snapshotResult, metricsResult] = await Promise.allSettled([
        getDatasourceSnapshot(),
        getDatasourceMetrics(),
    ]);
    if (snapshotResult.status === 'fulfilled') {
        snapshot.value = snapshotResult.value;
    } else {
        snapshot.value = {};
        ElMessage.error(snapshotResult.reason instanceof Error ? snapshotResult.reason.message : t('common.loadFailed'));
    }
    if (metricsResult.status === 'fulfilled') {
        metrics.value = metricsResult.value;
    } else {
        metricsError.value = metricsResult.reason instanceof Error
            ? metricsResult.reason.message
            : t('monitor.workbench.datasource.metricsUnavailable');
    }
    loading.value = false;
}

/** 应用本地筛选并回到第一页。 */
function applyFilter() {
    page.value = 1;
}

/** 清空数据源列表筛选条件。 */
function handleReset() {
    query.keyword = '';
    query.groupName = '';
    query.reachable = '';
    page.value = 1;
}

/** 导出当前运行时数据源和分表配置快照，不导出业务表数据。 */
async function handleExport() {
    try {
        await exportDatasourceSnapshot();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        } else {
            ElMessage.error(t('common.saveFailed'));
        }
    }
}

/** 打开单个物理数据源详情。 */
function openDetail(row: DataSourceMonitorDataSourceItem) {
    activeDataSource.value = row;
    detailVisible.value = true;
}

/** 进入独立分表治理页面。 */
function goShardingManagement() {
    router.push('/monitor/sharding');
}

/** 在新窗口打开后端已校验的 Druid 控制台地址。 */
function openDruidConsole() {
    if (openExternalMenu(consoleAccess.value.url)) {
        return;
    }
    ElMessage.warning(t('monitor.datasource.druidConsoleNotConfiguredHint'));
}

/** 标记连接池停机或探测失败的数据源行。 */
function dataSourceRowClassName({ row }: { row: DataSourceMonitorDataSourceItem }) {
    return row.running === false || row.reachable === false ? 'datasource-row--warning' : '';
}

/** 使用统一国际化文案格式化布尔配置。 */
function formatBoolean(value?: boolean) {
    return value ? t('common.yes') : t('common.no');
}

/** 将路由策略完整类名压缩为页面摘要使用的短类名。 */
function shortClassName(value?: string) {
    if (!value) {
        return '-';
    }
    const tokens = value.split('.');
    return tokens[tokens.length - 1] || value;
}

/** 将后端数据源角色映射为本地化文案。 */
function formatRole(role?: string) {
    const mapping: Record<string, string> = {
        PRIMARY: t('monitor.datasource.rolePrimary'),
        GROUP_MEMBER: t('monitor.datasource.roleGroupMember'),
        SINGLE: t('monitor.datasource.roleSingle'),
    };
    return mapping[String(role || '')] || String(role || '-');
}

/** 根据数据源角色选择 Element Plus 语义状态。 */
function roleTagType(role?: string) {
    if (role === 'PRIMARY') {
        return 'success';
    }
    if (role === 'GROUP_MEMBER') {
        return 'warning';
    }
    return 'info';
}
</script>

<style scoped>
.mb16 {
    margin-bottom: 16px;
}

.monitor-datasource-page__charts { margin-bottom: 16px; }

.datasource-console-band {
    align-items: center;
    background: var(--el-fill-color-extra-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    display: flex;
    gap: 24px;
    justify-content: space-between;
    margin-bottom: 16px;
    padding: 16px 18px;
}

.datasource-console-band__content {
    min-width: 0;
}

.datasource-console-band__heading {
    align-items: center;
    color: var(--el-text-color-primary);
    display: flex;
    font-size: 15px;
    font-weight: 600;
    gap: 10px;
}

.datasource-console-band p {
    color: var(--el-text-color-regular);
    line-height: 20px;
    margin: 6px 0 10px;
}

.datasource-console-band__meta {
    align-items: center;
    color: var(--el-text-color-secondary);
    display: flex;
    font-size: 13px;
    gap: 10px;
}

.datasource-console-band__reason {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
    margin-top: 8px;
}

.card-header {
    align-items: center;
    display: flex;
    justify-content: space-between;
    gap: 16px;
}

.sharding-summary {
    margin-bottom: 14px;
}

.summary-item {
    background: var(--el-fill-color-lighter);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    margin-bottom: 12px;
    min-height: 74px;
    padding: 14px 16px;
}

.summary-item__label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-bottom: 8px;
}

.summary-item__value {
    color: var(--el-text-color-primary);
    font-size: 15px;
    font-weight: 600;
    word-break: break-all;
}

:deep(.datasource-row--warning) {
    --el-table-tr-bg-color: var(--el-color-warning-light-9);
}

@media (max-width: 768px) {
    .datasource-console-band {
        align-items: stretch;
        flex-direction: column;
        gap: 12px;
    }

    .datasource-console-band .el-button {
        width: 100%;
    }
}
</style>
