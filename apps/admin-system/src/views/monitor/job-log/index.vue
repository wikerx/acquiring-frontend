<template>
    <div class="app-container">
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="92px">
            <el-form-item :label="$t('monitor.jobLog.jobCode')" prop="jobCode">
                <el-input v-model="query.jobCode" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.jobLog.runStatus')" prop="runStatus">
                <el-select v-model="query.runStatus" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in runStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('monitor.jobLog.triggerType')" prop="triggerType">
                <el-select v-model="query.triggerType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('monitor.jobLog.triggerSchedule')" value="SCHEDULE" />
                    <el-option :label="$t('monitor.jobLog.triggerManual')" value="MANUAL" />
                    <el-option :label="$t('monitor.jobLog.triggerRetry')" value="RETRY" />
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
            <el-table-column prop="runId" :label="$t('monitor.jobLog.runId')" min-width="190" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="jobCode" :label="$t('monitor.jobLog.jobCode')" min-width="140" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="jobName" :label="$t('monitor.jobLog.jobName')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="triggerType" :label="$t('monitor.jobLog.triggerType')" width="100" align="center">
                <template #default="{ row }">{{ formatTriggerType(row.triggerType) }}</template>
            </el-table-column>
            <el-table-column prop="runStatus" :label="$t('monitor.jobLog.runStatus')" width="110" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="statusTagValue(row.runStatus)" :text="formatRunStatus(row.runStatus)" />
                </template>
            </el-table-column>
            <el-table-column prop="executorNode" :label="$t('monitor.jobLog.executorNode')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('monitor.jobLog.startTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.startTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('monitor.jobLog.endTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.endTime" /></template>
            </el-table-column>
            <el-table-column prop="durationMs" :label="$t('monitor.jobLog.durationMs')" width="110" align="center">
                <template #default="{ row }">{{ row.durationMs ?? '-' }}</template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:jobLog:query'">{{ $t('common.detail') }}</el-button>
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

        <DetailDescriptions
            v-model:visible="detailVisible"
            :title="$t('common.detail')"
            :data="detailData"
            :items="detailItems"
            :column="1"
        >
            <template #cell-runStatus="{ data }">
                <BaseStatusTag :value="statusTagValue(String(data?.runStatus || ''))" :text="formatRunStatus(String(data?.runStatus || ''))" />
            </template>
            <template #cell-triggerType="{ data }">
                {{ formatTriggerType(String(data?.triggerType || '')) }}
            </template>
            <template #cell-startTime="{ data }">
                <BaseDateTime :value="String(data?.startTime || '')" />
            </template>
            <template #cell-endTime="{ data }">
                <BaseDateTime :value="String(data?.endTime || '')" />
            </template>
        </DetailDescriptions>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchJobRunLogs, type JobRunLogRow } from '@/api/monitor/jobLog';

const { t } = useI18n();
const route = useRoute();
const loading = ref(false);
const showSearch = ref(true);
const rows = ref<JobRunLogRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive({
    jobCode: '',
    runStatus: '',
    triggerType: '',
});
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const detailItems = computed(() => [
    { prop: 'runId', label: t('monitor.jobLog.runId') },
    { prop: 'jobCode', label: t('monitor.jobLog.jobCode') },
    { prop: 'jobName', label: t('monitor.jobLog.jobName') },
    { prop: 'triggerType', label: t('monitor.jobLog.triggerType') },
    { prop: 'runStatus', label: t('monitor.jobLog.runStatus') },
    { prop: 'executorNode', label: t('monitor.jobLog.executorNode') },
    { prop: 'durationMs', label: t('monitor.jobLog.durationMs') },
    { prop: 'resultMessage', label: t('monitor.jobLog.resultMessage') },
    { prop: 'errorMessage', label: t('monitor.jobLog.errorMessage') },
    { prop: 'paramsSnapshot', label: t('monitor.jobLog.paramsSnapshot') },
    { prop: 'startTime', label: t('monitor.jobLog.startTime') },
    { prop: 'endTime', label: t('monitor.jobLog.endTime') },
]);
const runStatusOptions = computed(() => [
    { label: t('monitor.jobLog.runWaiting'), value: 'WAITING' },
    { label: t('monitor.jobLog.runRunning'), value: 'RUNNING' },
    { label: t('monitor.jobLog.runSuccess'), value: 'SUCCESS' },
    { label: t('monitor.jobLog.runFailed'), value: 'FAILED' },
    { label: t('monitor.jobLog.runTimeout'), value: 'TIMEOUT' },
    { label: t('monitor.jobLog.runCancelled'), value: 'CANCELLED' },
]);

onMounted(() => {
    applyRouteQuery();
    loadData();
});

watch(
    () => route.query.jobCode,
    () => {
        applyRouteQuery();
        handleSearch();
    },
);

async function loadData() {
    loading.value = true;
    try {
        const result = await searchJobRunLogs({
            pageNo: page.value,
            pageSize: pageSize.value,
            jobCode: query.jobCode.trim() || undefined,
            runStatus: query.runStatus || undefined,
            triggerType: query.triggerType || undefined,
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
    query.jobCode = '';
    query.runStatus = '';
    query.triggerType = '';
    handleSearch();
}

/**
 * 将路由中的任务编码同步到查询条件，支持从任务调度页直接钻取日志。
 */
function applyRouteQuery() {
    query.jobCode = String(route.query.jobCode || '').trim();
}

function openDetail(row: JobRunLogRow) {
    detailData.value = row as unknown as Record<string, unknown>;
    detailVisible.value = true;
}

function formatTriggerType(triggerType: string) {
    if (triggerType === 'MANUAL') {
        return t('monitor.jobLog.triggerManual');
    }
    if (triggerType === 'RETRY') {
        return t('monitor.jobLog.triggerRetry');
    }
    return t('monitor.jobLog.triggerSchedule');
}

function formatRunStatus(runStatus: string) {
    switch (runStatus) {
        case 'WAITING':
            return t('monitor.jobLog.runWaiting');
        case 'RUNNING':
            return t('monitor.jobLog.runRunning');
        case 'SUCCESS':
            return t('monitor.jobLog.runSuccess');
        case 'FAILED':
            return t('monitor.jobLog.runFailed');
        case 'TIMEOUT':
            return t('monitor.jobLog.runTimeout');
        case 'CANCELLED':
            return t('monitor.jobLog.runCancelled');
        default:
            return runStatus || '-';
    }
}

function statusTagValue(runStatus: string) {
    switch (runStatus) {
        case 'SUCCESS':
            return 'SUCCESS';
        case 'FAILED':
        case 'TIMEOUT':
            return 'FAILED';
        case 'RUNNING':
            return 'active';
        case 'WAITING':
            return 'inactive';
        default:
            return 'disabled';
    }
}
</script>
