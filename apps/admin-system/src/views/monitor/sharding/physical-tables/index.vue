<template>
    <div class="app-container">
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="96px">
            <el-form-item :label="$t('monitor.sharding.logicalTable')">
                <el-input v-model="query.logicalTable" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.physicalTable')">
                <el-input v-model="query.physicalTable" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.year')">
                <el-input-number v-model="query.year" :min="2000" :max="2100" controls-position="right" style="width: 130px" />
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.quarter')">
                <el-select v-model="query.quarter" :placeholder="$t('common.pleaseSelect')" clearable style="width: 130px">
                    <el-option v-for="item in [1, 2, 3, 4]" :key="item" :label="`Q${item}`" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.tableStatus')">
                <el-select v-model="query.tableStatus" :placeholder="$t('common.pleaseSelect')" clearable style="width: 150px">
                    <el-option v-for="item in tableStatusOptions" :key="item" :label="item" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Refresh" size="small" @click="handleRefreshPhysicalTables" v-hasPermi="'monitor:sharding:physical:refresh'">
                    {{ $t('monitor.sharding.refreshPhysicalTables') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="CircleCheck" size="small" @click="handleCheckSchema" v-hasPermi="'monitor:sharding:physical:check'">
                    {{ $t('monitor.sharding.checkSchema') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="info" plain :icon="Search" size="small" @click="handleDryRun" v-hasPermi="'monitor:sharding:task:dryRun'">
                    {{ $t('monitor.sharding.dryRun') }}
                </el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="CircleCheck" size="small" @click="handleExecute" v-hasPermi="'monitor:sharding:task:execute'">
                    {{ $t('monitor.sharding.executeCreate') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column prop="logicalTable" :label="$t('monitor.sharding.logicalTable')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="physicalTable" :label="$t('monitor.sharding.physicalTable')" min-width="190" show-overflow-tooltip />
            <el-table-column prop="templateTable" :label="$t('monitor.sharding.templateTable')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="year" :label="$t('monitor.sharding.year')" width="90" align="center" />
            <el-table-column prop="quarter" :label="$t('monitor.sharding.quarter')" width="90" align="center">
                <template #default="{ row }">Q{{ row.quarter }}</template>
            </el-table-column>
            <el-table-column prop="dataSource" :label="$t('monitor.sharding.actualDataSource')" width="130" align="center" />
            <el-table-column prop="tableStatus" :label="$t('monitor.sharding.tableStatus')" width="120" align="center">
                <template #default="{ row }"><el-tag size="small">{{ row.tableStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="schemaCheckStatus" :label="$t('monitor.sharding.schemaCheckStatus')" width="140" align="center">
                <template #default="{ row }"><el-tag size="small" :type="row.schemaCheckStatus === 'MATCHED' ? 'success' : 'warning'">{{ row.schemaCheckStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="autoIncrementCurrent" :label="$t('monitor.sharding.autoIncrementCurrent')" min-width="170" align="center" />
            <el-table-column :label="$t('monitor.sharding.lastCheckTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.lastCheckTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:sharding:physical:query'">{{ $t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="loadData"
                @current-change="loadData"
            />
        </div>

        <DetailDescriptions v-model:visible="detailVisible" :title="$t('common.detail')" :data="detailData" :items="detailItems" :column="1">
            <template #cell-lastCheckTime="{ data }"><BaseDateTime :value="String(data?.lastCheckTime || '')" /></template>
            <template #cell-createdTime="{ data }"><BaseDateTime :value="String(data?.createdTime || '')" /></template>
        </DetailDescriptions>

        <el-dialog v-model="resultVisible" :title="$t('monitor.sharding.createResult')" width="860px" append-to-body>
            <el-alert v-for="warning in createResult?.warnings || []" :key="warning" type="warning" show-icon :closable="false" :title="warning" style="margin-bottom: 10px" />
            <el-descriptions :column="3" border size="small" class="mb16">
                <el-descriptions-item :label="$t('monitor.sharding.dryRun')">{{ createResult?.dryRun ? $t('common.yes') : $t('common.no') }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.currentQuarter')">{{ createResult?.currentQuarter || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('monitor.sharding.targetQuarters')">{{ (createResult?.targetQuarters || []).join(', ') || '-' }}</el-descriptions-item>
            </el-descriptions>
            <el-table :data="createResult?.tableResults || []" size="small">
                <el-table-column prop="logicalTable" :label="$t('monitor.sharding.logicalTable')" min-width="150" />
                <el-table-column prop="physicalTable" :label="$t('monitor.sharding.physicalTable')" min-width="190" show-overflow-tooltip />
                <el-table-column prop="targetQuarter" :label="$t('monitor.sharding.targetQuarter')" width="120" />
                <el-table-column prop="status" :label="$t('common.status')" width="120" />
                <el-table-column prop="schemaCheckStatus" :label="$t('monitor.sharding.schemaCheckStatus')" width="140" />
                <el-table-column prop="message" :label="$t('monitor.sharding.message')" min-width="220" show-overflow-tooltip />
            </el-table>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { CircleCheck, Refresh, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
    checkShardingPhysicalTableSchema,
    dryRunShardingTableCreate,
    executeShardingTableCreate,
    getShardingPhysicalTable,
    refreshShardingPhysicalTables,
    searchShardingPhysicalTables,
    type ShardingPhysicalTableRow,
    type ShardingTablePreCreateResult,
} from '@/api/monitor/sharding';

const { t } = useI18n();
const loading = ref(false);
const showSearch = ref(true);
const rows = ref<ShardingPhysicalTableRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const resultVisible = ref(false);
const createResult = ref<ShardingTablePreCreateResult | null>(null);
const query = reactive({
    logicalTable: '',
    physicalTable: '',
    year: undefined as number | undefined,
    quarter: undefined as number | undefined,
    tableStatus: '',
    schemaCheckStatus: '',
});
const tableStatusOptions = ['EXISTS', 'CREATED', 'MISSING', 'FAILED'];
const detailItems = computed(() => [
    { prop: 'logicalTable', label: t('monitor.sharding.logicalTable') },
    { prop: 'templateTable', label: t('monitor.sharding.templateTable') },
    { prop: 'physicalTable', label: t('monitor.sharding.physicalTable') },
    { prop: 'shardingColumn', label: t('monitor.sharding.shardingColumn') },
    { prop: 'strategy', label: t('monitor.sharding.strategy') },
    { prop: 'year', label: t('monitor.sharding.year') },
    { prop: 'quarter', label: t('monitor.sharding.quarter') },
    { prop: 'quarterSuffix', label: t('monitor.sharding.quarterSuffix') },
    { prop: 'dataSource', label: t('monitor.sharding.actualDataSource') },
    { prop: 'tableStatus', label: t('monitor.sharding.tableStatus') },
    { prop: 'schemaCheckStatus', label: t('monitor.sharding.schemaCheckStatus') },
    { prop: 'autoIncrementStart', label: t('monitor.sharding.autoIncrementStart') },
    { prop: 'autoIncrementCurrent', label: t('monitor.sharding.autoIncrementCurrent') },
    { prop: 'autoIncrementMax', label: t('monitor.sharding.autoIncrementMax') },
    { prop: 'lastCheckTime', label: t('monitor.sharding.lastCheckTime') },
    { prop: 'createdTime', label: t('monitor.sharding.createdTime') },
    { prop: 'errorMessage', label: t('monitor.sharding.errorMessage') },
]);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        const result = await searchShardingPhysicalTables({
            pageNo: page.value,
            pageSize: pageSize.value,
            logicalTable: query.logicalTable.trim() || undefined,
            physicalTable: query.physicalTable.trim() || undefined,
            year: query.year,
            quarter: query.quarter,
            tableStatus: query.tableStatus || undefined,
            schemaCheckStatus: query.schemaCheckStatus || undefined,
        });
        rows.value = result.records;
        total.value = result.total;
    } catch (error) {
        console.error(error);
        rows.value = [];
        total.value = 0;
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.logicalTable = '';
    query.physicalTable = '';
    query.year = undefined;
    query.quarter = undefined;
    query.tableStatus = '';
    query.schemaCheckStatus = '';
    handleSearch();
}

async function openDetail(row: ShardingPhysicalTableRow) {
    try {
        detailData.value = await getShardingPhysicalTable(row.id) as unknown as Record<string, unknown>;
        detailVisible.value = true;
    } catch (error) {
        console.error(error);
        ElMessage.error(t('common.loadFailed'));
    }
}

async function handleDryRun() {
    await submitCreate(true);
}

async function handleRefreshPhysicalTables() {
    await submitInspect(refreshShardingPhysicalTables, t('monitor.sharding.refreshSuccess'));
}

async function handleCheckSchema() {
    await submitInspect(checkShardingPhysicalTableSchema, t('monitor.sharding.checkSuccess'));
}

async function handleExecute() {
    try {
        await ElMessageBox.confirm(t('monitor.sharding.executeConfirm'), t('common.operationConfirm'), { type: 'warning' });
    } catch {
        return;
    }
    await submitCreate(false);
}

async function submitCreate(dryRun: boolean) {
    try {
        const payload = {
            includeCurrentQuarter: true,
            includeNextQuarter: true,
            compareSchemaIfExists: true,
            logicalTables: query.logicalTable.trim() ? [query.logicalTable.trim()] : [],
        };
        createResult.value = dryRun ? await dryRunShardingTableCreate(payload) : await executeShardingTableCreate(payload);
        resultVisible.value = true;
        if (!dryRun) {
            loadData();
        }
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
}

async function submitInspect(
    submitter: (payload: { includeCurrentQuarter: boolean; includeNextQuarter: boolean; compareSchemaIfExists: boolean; logicalTables: string[] }) => Promise<ShardingTablePreCreateResult>,
    successMessage: string,
) {
    try {
        const payload = {
            includeCurrentQuarter: true,
            includeNextQuarter: true,
            compareSchemaIfExists: true,
            logicalTables: query.logicalTable.trim() ? [query.logicalTable.trim()] : [],
        };
        createResult.value = await submitter(payload);
        resultVisible.value = true;
        ElMessage.success(successMessage);
        loadData();
    } catch (error) {
        if (error instanceof Error) {
            ElMessage.error(error.message);
        }
    }
}
</script>

<style scoped>
.mb16 {
    margin-bottom: 16px;
}
</style>
