<template>
    <div class="app-container export-task-page">
        <el-form
            v-show="showSearch"
            :model="query"
            :inline="true"
            size="small"
            class="search-form export-task-page__search"
            label-width="92px"
        >
            <el-form-item :label="t('operations.exportTask.taskType')">
                <el-select v-model="query.taskType" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option
                        v-for="item in taskTypeOptions"
                        :key="item"
                        :label="taskTypeText(item)"
                        :value="item"
                    />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option
                        v-for="item in statusOptions"
                        :key="item"
                        :label="statusText(item)"
                        :value="item"
                    />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('operations.exportTask.createTime')" class="export-task-page__time-item">
                <el-date-picker
                    v-model="createdRange"
                    type="datetimerange"
                    :clearable="false"
                    value-format="YYYY-MM-DDTHH:mm:ss"
                    format="YYYY-MM-DD HH:mm:ss"
                    :range-separator="t('common.to')"
                    :start-placeholder="t('common.startTime')"
                    :end-placeholder="t('common.endTime')"
                />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <StandardTable
            table-key="admin-export-task-center"
            v-loading="loading"
            :data="rows"
            row-key="taskNo"
            size="small"
        >
            <el-table-column :label="t('operations.exportTask.taskNo')" min-width="204" fixed="left" align="center">
                <template #default="{ row }">
                    <CopyableText :value="row.taskNo" :label="t('operations.exportTask.taskNo')" />
                </template>
            </el-table-column>
            <el-table-column prop="taskName" :label="t('operations.exportTask.taskName')" min-width="188" show-overflow-tooltip />
            <el-table-column :label="t('operations.exportTask.taskType')" min-width="166" align="center">
                <template #default="{ row }">{{ taskTypeText(row.taskType) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.status')" width="112" align="center">
                <template #default="{ row }">
                    <el-tag :type="statusTagType(row.status)" effect="plain" size="small">
                        {{ statusText(row.status) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.progress')" min-width="176" align="center">
                <template #default="{ row }">
                    <el-progress
                        :percentage="normalizedProgress(row)"
                        :status="progressStatus(row.status)"
                        :stroke-width="7"
                    />
                </template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.rowCount')" min-width="138" align="right">
                <template #default="{ row }">{{ rowCountText(row) }}</template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.fileSize')" min-width="110" align="right">
                <template #default="{ row }">{{ formatFileSize(row.fileSizeBytes) }}</template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.createTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.finishedAt')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.finishedAt" /></template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.expiresAt')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.expiresAt" /></template>
            </el-table-column>
            <el-table-column :label="t('operations.exportTask.failureReason')" min-width="220" show-overflow-tooltip>
                <template #default="{ row }">{{ failureText(row) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="220" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button
                        v-if="canDetail"
                        type="primary"
                        link
                        :icon="View"
                        @click="openDetail(row)"
                    >{{ t('common.detail') }}</el-button>
                    <el-button
                        v-if="canDownload && row.status === 'SUCCESS'"
                        type="success"
                        link
                        :icon="Download"
                        :loading="downloadingTaskNo === row.taskNo"
                        @click="handleDownload(row)"
                    >{{ t('common.download') }}</el-button>
                    <el-button
                        v-if="canRetry && row.status === 'FAILED'"
                        type="warning"
                        link
                        :icon="RefreshRight"
                        :loading="retryingTaskNo === row.taskNo"
                        @click="handleRetry(row)"
                    >{{ t('operations.exportTask.retry') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
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

        <CommonDetailDrawer
            v-model:visible="detailVisible"
            :title="t('operations.exportTask.detailTitle')"
            size="lg"
            :loading="detailLoading"
        >
            <template v-if="detail">
                <section class="export-task-page__detail-section">
                    <h3>{{ t('operations.exportTask.taskFacts') }}</h3>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('operations.exportTask.taskNo')">
                            <CopyableText :value="detail.taskNo" :label="t('operations.exportTask.taskNo')" />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('common.status')">
                            <el-tag :type="statusTagType(detail.status)" effect="plain" size="small">
                                {{ statusText(detail.status) }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.taskName')">{{ detail.taskName }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.taskType')">{{ taskTypeText(detail.taskType) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.progress')">
                            {{ normalizedProgress(detail) }}%
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.rowCount')">{{ rowCountText(detail) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.retryCount')">
                            {{ t('operations.exportTask.retryCountValue', { current: detail.retryCount, max: detail.maxRetryCount }) }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.version')">{{ detail.version }}</el-descriptions-item>
                    </el-descriptions>
                </section>

                <section class="export-task-page__detail-section">
                    <h3>{{ t('operations.exportTask.fileFacts') }}</h3>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('operations.exportTask.fileName')" :span="2">
                            {{ detail.fileName || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.fileSize')">{{ formatFileSize(detail.fileSizeBytes) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.fileSha256')">
                            <CopyableText :value="detail.fileSha256" :label="t('operations.exportTask.fileSha256')" />
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.createTime')"><BaseDateTime :value="detail.createTime" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.startedAt')"><BaseDateTime :value="detail.startedAt" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.finishedAt')"><BaseDateTime :value="detail.finishedAt" /></el-descriptions-item>
                        <el-descriptions-item :label="t('operations.exportTask.expiresAt')"><BaseDateTime :value="detail.expiresAt" /></el-descriptions-item>
                    </el-descriptions>
                </section>

                <el-alert
                    v-if="detail.failureCode || detail.failureReason"
                    class="export-task-page__failure"
                    :title="t('operations.exportTask.failureTitle')"
                    :description="failureText(detail)"
                    type="error"
                    :closable="false"
                    show-icon
                />
            </template>
            <template #footer>
                <div class="dialog-footer export-task-page__drawer-footer">
                    <el-button
                        v-if="detail && canDownload && detail.status === 'SUCCESS'"
                        type="primary"
                        :icon="Download"
                        :loading="downloadingTaskNo === detail.taskNo"
                        @click="handleDownload(detail)"
                    >{{ t('common.download') }}</el-button>
                    <el-button
                        v-if="detail && canRetry && detail.status === 'FAILED'"
                        type="warning"
                        :icon="RefreshRight"
                        :loading="retryingTaskNo === detail.taskNo"
                        @click="handleRetry(detail)"
                    >{{ t('operations.exportTask.retry') }}</el-button>
                    <el-button @click="detailVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Download, Refresh, RefreshRight, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
    downloadExportTask,
    getExportTaskDetail,
    retryExportTask,
    searchExportTasks,
    type ExportTaskQuery,
    type ExportTaskStatus,
    type ExportTaskSummary,
    type ExportTaskType,
} from '@/api/operations/exportTask';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import CopyableText from '@/views/transaction/components/CopyableText.vue';
import { defaultTodayFullDayRange } from '@/views/transaction/shared';

const POLL_INTERVAL_MILLIS = 10_000;
const taskTypeOptions: ExportTaskType[] = [
    'ADMIN_OPERATIONAL_WORK_ITEM',
    'ADMIN_TRANSACTION_ORDER',
    'ADMIN_PAYMENT_LINK',
    'ADMIN_TRANSACTION_OPERATION',
    'ADMIN_MERCHANT_NOTIFICATION',
    'ADMIN_REFUND',
    'ADMIN_SETTLEMENT_TRANSACTION',
    'ADMIN_SETTLEMENT_RESERVE',
    'ADMIN_CARD_BIN',
    'ADMIN_COUNTRY',
    'ADMIN_CURRENCY',
    'ADMIN_REGION_CURRENCY',
    'ADMIN_MCC_CODE',
    'ADMIN_DEPARTMENT',
    'ADMIN_POST',
    'ADMIN_DICT_TYPE',
    'ADMIN_DICT_DATA',
    'ADMIN_HOLIDAY_CALENDAR',
    'ADMIN_JOB_RUN_LOG',
    'ADMIN_CHANNEL_MATCH_ABNORMAL',
    'ADMIN_SETTLEMENT_REVIEW',
    'ADMIN_SETTLEMENT_POSTING',
    'ADMIN_SECURITY_INTERCEPT_EVENT',
    'ADMIN_FUND_ACCOUNT',
    'ADMIN_FUND_LEDGER',
    'ADMIN_FUND_RECHARGE',
    'ADMIN_FUND_DEDUCTION',
    'ADMIN_EXCHANGE_RAW_RATE',
    'ADMIN_EXCHANGE_BUSINESS_RATE',
    'ADMIN_EXCHANGE_USAGE_SNAPSHOT',
    'ADMIN_EXCHANGE_SOURCE',
    'ADMIN_EXCHANGE_RULE',
    'ADMIN_EXCHANGE_VOLATILITY',
    'ADMIN_EXCHANGE_ALERT_RULE',
    'ADMIN_EXCHANGE_ALERT_EVENT',
    'ADMIN_FEE_TEMPLATE',
    'ADMIN_MERCHANT_FEE',
    'ADMIN_FEE_REVIEW',
    'ADMIN_FEE_SIMULATION',
    'ADMIN_SYSTEM_USER',
    'ADMIN_SYSTEM_CONFIG',
    'ADMIN_MERCHANT_IP_WHITELIST',
    'ADMIN_RISK_CONFIG',
    'ADMIN_TRADE_BLACK_RECORD',
    'ADMIN_DATASOURCE_SNAPSHOT',
];
const statusOptions: ExportTaskStatus[] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED'];

const { t, te } = useI18n();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const detailLoading = ref(false);
const downloadingTaskNo = ref('');
const retryingTaskNo = ref('');
const rows = ref<ExportTaskSummary[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const createdRange = ref<string[]>(defaultTodayFullDayRange());
const detailVisible = ref(false);
const detail = ref<ExportTaskSummary | null>(null);
const query = reactive<ExportTaskQuery>({ taskType: '', status: '' });
const canDetail = computed(() => userStore.hasPermission('operations:export-task:detail'));
const canDownload = computed(() => userStore.hasPermission('operations:export-task:download'));
const canRetry = computed(() => userStore.hasPermission('operations:export-task:retry'));
let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
    void loadData();
    pollTimer = setInterval(() => {
        if (rows.value.some((item) => item.status === 'PENDING' || item.status === 'PROCESSING')) {
            void loadData(true);
        }
    }, POLL_INTERVAL_MILLIS);
});

onBeforeUnmount(() => {
    if (pollTimer) clearInterval(pollTimer);
});

function buildQuery(): ExportTaskQuery {
    return {
        taskType: query.taskType || undefined,
        status: query.status || undefined,
        createdStartTime: createdRange.value?.[0] || undefined,
        createdEndTime: createdRange.value?.[1] ? `${createdRange.value[1]}.999` : undefined,
        pageNo: page.value,
        pageSize: pageSize.value,
    };
}

async function loadData(silent = false) {
    if (!silent) loading.value = true;
    try {
        const result = await searchExportTasks(buildQuery());
        rows.value = result.records;
        total.value = result.total;
        if (detailVisible.value && detail.value) {
            const current = rows.value.find((item) => item.taskNo === detail.value?.taskNo);
            if (current) detail.value = current;
        }
    } finally {
        if (!silent) loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    void loadData();
}

function handleReset() {
    query.taskType = '';
    query.status = '';
    createdRange.value = defaultTodayFullDayRange();
    handleSearch();
}

async function openDetail(row: ExportTaskSummary) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await getExportTaskDetail(row.taskNo);
    } finally {
        detailLoading.value = false;
    }
}

async function handleDownload(row: ExportTaskSummary) {
    downloadingTaskNo.value = row.taskNo;
    try {
        await downloadExportTask(row.taskNo, row.fileName);
        ElMessage.success(t('operations.exportTask.downloadStarted'));
    } finally {
        downloadingTaskNo.value = '';
    }
}

async function handleRetry(row: ExportTaskSummary) {
    await ElMessageBox.confirm(
        t('operations.exportTask.retryConfirm', { taskNo: row.taskNo }),
        t('operations.exportTask.retry'),
        { type: 'warning' },
    );
    retryingTaskNo.value = row.taskNo;
    try {
        const updated = await retryExportTask(row.taskNo, row.version);
        detail.value = detail.value?.taskNo === updated.taskNo ? updated : detail.value;
        ElMessage.success(t('operations.exportTask.retrySuccess'));
        await loadData();
    } finally {
        retryingTaskNo.value = '';
    }
}

function taskTypeText(type?: ExportTaskType | null) {
    if (!type) return '-';
    const key = `operations.exportTask.type.${type}`;
    return te(key) ? t(key) : type;
}

function statusText(status: ExportTaskStatus) {
    return t(`operations.exportTask.status.${status}`);
}

function statusTagType(status: ExportTaskStatus) {
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'danger';
    if (status === 'PROCESSING') return 'primary';
    if (status === 'PENDING') return 'warning';
    return 'info';
}

function progressStatus(status: ExportTaskStatus): '' | 'success' | 'exception' | 'warning' {
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'exception';
    if (status === 'EXPIRED') return 'warning';
    return '';
}

function normalizedProgress(row: ExportTaskSummary) {
    return Math.max(0, Math.min(100, Number(row.progressPercent || 0)));
}

function rowCountText(row: ExportTaskSummary) {
    return `${row.processedRows || 0} / ${row.totalRows || 0}`;
}

function failureText(row: ExportTaskSummary) {
    if (!row.failureCode && !row.failureReason) return '-';
    return [row.failureCode, row.failureReason].filter(Boolean).join(' · ');
}

function formatFileSize(size?: number | null) {
    if (!size) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
}
</script>

<style scoped>
.export-task-page__search :deep(.el-input),
.export-task-page__search :deep(.el-select) {
    width: 200px;
}

.export-task-page__search :deep(.export-task-page__time-item .el-date-editor) {
    width: 380px;
}

.export-task-page__detail-section + .export-task-page__detail-section {
    margin-top: 18px;
}

.export-task-page__detail-section h3 {
    margin: 0 0 10px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

.export-task-page__failure {
    margin-top: 18px;
}

.export-task-page__drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

@media (max-width: 768px) {
    .export-task-page__search :deep(.el-form-item),
    .export-task-page__search :deep(.el-form-item__content),
    .export-task-page__search :deep(.el-input),
    .export-task-page__search :deep(.el-select),
    .export-task-page__search :deep(.export-task-page__time-item .el-date-editor) {
        width: 100%;
    }
}
</style>
