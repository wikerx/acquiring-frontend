<template>
    <div class="app-container">
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="96px">
            <el-form-item :label="$t('monitor.sharding.batchNo')">
                <el-input v-model="query.batchNo" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.triggerType')">
                <el-select v-model="query.triggerType" :placeholder="$t('common.pleaseSelect')" clearable style="width: 150px">
                    <el-option label="MANUAL" value="MANUAL" />
                    <el-option label="SCHEDULE" value="SCHEDULE" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.dryRun')">
                <el-select v-model="query.dryRun" :placeholder="$t('common.pleaseSelect')" clearable style="width: 130px">
                    <el-option :label="$t('common.yes')" :value="1" />
                    <el-option :label="$t('common.no')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('monitor.sharding.runStatus')">
                <el-select v-model="query.runStatus" :placeholder="$t('common.pleaseSelect')" clearable style="width: 170px">
                    <el-option v-for="item in ['SUCCESS', 'PARTIAL_FAILED', 'FAILED']" :key="item" :label="item" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column prop="batchNo" :label="$t('monitor.sharding.batchNo')" min-width="220" show-overflow-tooltip />
            <el-table-column prop="triggerType" :label="$t('monitor.sharding.triggerType')" width="120" align="center" />
            <el-table-column prop="dryRun" :label="$t('monitor.sharding.dryRun')" width="100" align="center">
                <template #default="{ row }">{{ row.dryRun === 1 ? $t('common.yes') : $t('common.no') }}</template>
            </el-table-column>
            <el-table-column prop="targetQuarters" :label="$t('monitor.sharding.targetQuarters')" min-width="150" show-overflow-tooltip />
            <el-table-column prop="plannedCount" :label="$t('monitor.sharding.plannedCount')" width="100" align="center" />
            <el-table-column prop="createdCount" :label="$t('monitor.sharding.createdCount')" width="100" align="center" />
            <el-table-column prop="skippedCount" :label="$t('monitor.sharding.skippedCount')" width="100" align="center" />
            <el-table-column prop="failedCount" :label="$t('monitor.sharding.failedCount')" width="100" align="center" />
            <el-table-column prop="schemaMismatchCount" :label="$t('monitor.sharding.schemaMismatchCount')" width="130" align="center" />
            <el-table-column prop="runStatus" :label="$t('monitor.sharding.runStatus')" width="140" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="row.runStatus === 'SUCCESS' ? 'success' : 'danger'">{{ row.runStatus || '-' }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('monitor.sharding.startTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.startTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:sharding:task:query'">{{ $t('common.detail') }}</el-button>
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
            <template #cell-resultSummary="{ data }">
                <pre class="result-summary">{{ formatResultSummary(data?.resultSummary) }}</pre>
            </template>
            <template #cell-startTime="{ data }"><BaseDateTime :value="String(data?.startTime || '')" /></template>
            <template #cell-endTime="{ data }"><BaseDateTime :value="String(data?.endTime || '')" /></template>
        </DetailDescriptions>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getShardingCreateLog, searchShardingCreateLogs, type ShardingTableCreateLogRow } from '@/api/monitor/sharding';

const { t } = useI18n();
const loading = ref(false);
const showSearch = ref(true);
const rows = ref<ShardingTableCreateLogRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const query = reactive({
    batchNo: '',
    triggerType: '',
    dryRun: undefined as number | undefined,
    runStatus: '',
});
const detailItems = computed(() => [
    { prop: 'batchNo', label: t('monitor.sharding.batchNo') },
    { prop: 'triggerType', label: t('monitor.sharding.triggerType') },
    { prop: 'dryRun', label: t('monitor.sharding.dryRun') },
    { prop: 'targetQuarters', label: t('monitor.sharding.targetQuarters') },
    { prop: 'plannedCount', label: t('monitor.sharding.plannedCount') },
    { prop: 'createdCount', label: t('monitor.sharding.createdCount') },
    { prop: 'skippedCount', label: t('monitor.sharding.skippedCount') },
    { prop: 'failedCount', label: t('monitor.sharding.failedCount') },
    { prop: 'schemaMismatchCount', label: t('monitor.sharding.schemaMismatchCount') },
    { prop: 'runStatus', label: t('monitor.sharding.runStatus') },
    { prop: 'resultSummary', label: t('monitor.sharding.resultSummary') },
    { prop: 'errorMessage', label: t('monitor.sharding.errorMessage') },
    { prop: 'operatorName', label: t('monitor.sharding.operatorName') },
    { prop: 'startTime', label: t('monitor.sharding.startTime') },
    { prop: 'endTime', label: t('monitor.sharding.endTime') },
    { prop: 'durationMs', label: t('monitor.sharding.durationMs') },
]);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        const result = await searchShardingCreateLogs({
            pageNo: page.value,
            pageSize: pageSize.value,
            batchNo: query.batchNo.trim() || undefined,
            triggerType: query.triggerType || undefined,
            dryRun: query.dryRun,
            runStatus: query.runStatus || undefined,
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
    query.batchNo = '';
    query.triggerType = '';
    query.dryRun = undefined;
    query.runStatus = '';
    handleSearch();
}

async function openDetail(row: ShardingTableCreateLogRow) {
    try {
        const detail = await getShardingCreateLog(row.id);
        detailData.value = {
            ...detail,
            dryRun: detail.dryRun === 1 ? t('common.yes') : t('common.no'),
        } as unknown as Record<string, unknown>;
        detailVisible.value = true;
    } catch (error) {
        console.error(error);
        ElMessage.error(t('common.loadFailed'));
    }
}

function formatResultSummary(value: unknown) {
    if (!value) {
        return '-';
    }
    if (typeof value !== 'string') {
        return JSON.stringify(value, null, 2);
    }
    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return value;
    }
}
</script>

<style scoped>
.result-summary {
    max-height: 320px;
    max-width: 100%;
    margin: 0;
    padding: 10px 12px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: anywhere;
    border: 1px solid #ebeef5;
    border-radius: 6px;
    background: #f8fafc;
    color: #303133;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.6;
}
</style>
