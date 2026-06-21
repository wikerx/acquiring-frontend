<template>
    <div class="app-container">
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

        <el-row :gutter="16" class="mb16" v-loading="loading">
            <el-col v-for="card in overviewCards" :key="card.key" :xs="24" :sm="12" :md="6" style="margin-bottom: 16px">
                <el-card shadow="never" class="metric-card">
                    <div class="metric-card__label">{{ card.label }}</div>
                    <div class="metric-card__value">{{ card.value }}</div>
                    <div class="metric-card__desc">{{ card.description }}</div>
                </el-card>
            </el-col>
        </el-row>

        <el-card shadow="never" class="mb16">
            <template #header>
                <div class="card-header">
                    <span>{{ $t('monitor.datasource.groupSection') }}</span>
                </div>
            </template>
            <el-table :data="groups" size="small" row-key="groupName">
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
            </el-table>
        </el-card>

        <el-card shadow="never" class="mb16">
            <template #header>
                <div class="card-header">
                    <span>{{ $t('monitor.datasource.datasourceSection') }}</span>
                </div>
            </template>
            <el-table :data="pagedDataSources" size="small" row-key="dataSourceKey" :row-class-name="dataSourceRowClassName">
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
                        <el-space wrap>
                            <el-tag v-for="table in row.relatedShardingTables || []" :key="table" size="small">{{ table }}</el-tag>
                            <span v-if="!(row.relatedShardingTables || []).length">-</span>
                        </el-space>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="90" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
                    </template>
                </el-table-column>
            </el-table>
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


        <el-drawer v-model="detailVisible" :title="$t('monitor.datasource.datasourceDetail')" size="680px" append-to-body>
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
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Download, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import {
    exportDatasourceSnapshot,
    getDatasourceSnapshot,
    type DataSourceMonitorDataSourceItem,
    type DataSourceMonitorGroupItem,
    type DataSourceMonitorResponse,
} from '@/api/monitor/datasource';

const { t } = useI18n();
const router = useRouter();
const loading = ref(false);
const snapshot = ref<DataSourceMonitorResponse>({});
const detailVisible = ref(false);
const activeDataSource = ref<DataSourceMonitorDataSourceItem | null>(null);
const page = ref(1);
const pageSize = ref(10);
const query = reactive({
    keyword: '',
    groupName: '',
    reachable: '',
});

onMounted(() => loadData());

const warnings = computed(() => snapshot.value.warnings || []);
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

async function loadData() {
    loading.value = true;
    try {
        snapshot.value = await getDatasourceSnapshot();
    } catch (error) {
        console.error(error);
        snapshot.value = {};
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function applyFilter() {
    page.value = 1;
}

function handleReset() {
    query.keyword = '';
    query.groupName = '';
    query.reachable = '';
    page.value = 1;
}

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

function openDetail(row: DataSourceMonitorDataSourceItem) {
    activeDataSource.value = row;
    detailVisible.value = true;
}

function goShardingManagement() {
    router.push('/monitor/sharding');
}

function dataSourceRowClassName({ row }: { row: DataSourceMonitorDataSourceItem }) {
    return row.running === false || row.reachable === false ? 'datasource-row--warning' : '';
}

function formatBoolean(value?: boolean) {
    return value ? t('common.yes') : t('common.no');
}

function shortClassName(value?: string) {
    if (!value) {
        return '-';
    }
    const tokens = value.split('.');
    return tokens[tokens.length - 1] || value;
}

function formatRole(role?: string) {
    const mapping: Record<string, string> = {
        PRIMARY: t('monitor.datasource.rolePrimary'),
        GROUP_MEMBER: t('monitor.datasource.roleGroupMember'),
        SINGLE: t('monitor.datasource.roleSingle'),
    };
    return mapping[String(role || '')] || String(role || '-');
}

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

.metric-card {
    min-height: 118px;
}

.metric-card__label {
    color: var(--el-text-color-secondary);
    font-size: 13px;
    margin-bottom: 8px;
}

.metric-card__value {
    color: var(--el-text-color-primary);
    font-size: 28px;
    font-weight: 600;
    line-height: 1.2;
}

.metric-card__desc {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    margin-top: 10px;
    word-break: break-all;
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
</style>
