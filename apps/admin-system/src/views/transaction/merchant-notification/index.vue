<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.notificationSearch.title')"
            :description="t('transaction.notificationSearch.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="96px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.notifyStatus')"><el-input v-model.trim="query.notifyStatus" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            :title="t('transaction.summary.logResultTitle')"
            :description="t('transaction.summary.notificationResultDescription')"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

        <el-row class="mb8 transaction-table-toolbar">
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:merchant-notification:export'">
                    {{ t('common.export') }}
                </el-button>
            </el-col>
        </el-row>

        <StandardTable table-key="transaction-merchant-notification" v-loading="loading" :data="rows" row-key="notifyId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.notifyId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.notifyId" :label="t('transaction.fields.notifyId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="220" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantId')" min-width="140" align="center">
                <template #default="{ row }">
                    <CopyableText :value="row.merchantId" :label="t('transaction.fields.merchantId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.notifyType')" width="150" align="center">
                <template #default="{ row }">{{ notifyTypeText(row.notifyType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.eventType')" width="140" align="center">
                <template #default="{ row }">{{ eventTypeText(row.eventType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.notifyStatus')" width="130" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.notifyStatus)">{{ notifyStatusText(row.notifyStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="lastAttemptNo" :label="t('transaction.fields.lastAttemptNo')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.nextRetryTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.nextRetryTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column v-if="showOperationColumn" :label="t('common.operation')" width="190" fixed="right" align="center">
                <template #default="{ row }">
                    <TableRowActions :actions="notificationRowActions(row)" :more-label="t('common.more')" @select="handleNotificationRowAction($event, row)" />
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.merchantNotification.detailTitle')" size="lg">
            <div v-loading="detailLoading">
                <TransactionRecordList :rows="detailRow ? [detailRow] : []" :display-time-zone="query.queryTimeZone" />
                <el-divider content-position="left">{{ t('transaction.merchantNotification.deliveryAttempts') }}</el-divider>
                <div v-loading="deliveryLogsLoading">
                    <TransactionRecordList :rows="deliveryLogs" variant="callback" :display-time-zone="query.queryTimeZone" />
                    <div class="pagination-container" v-show="deliveryLogTotal > 0">
                        <el-pagination
                            v-model:current-page="deliveryLogPage"
                            v-model:page-size="deliveryLogPageSize"
                            :total="deliveryLogTotal"
                            :page-sizes="[10, 20, 50, 100]"
                            layout="total, sizes, prev, pager, next, jumper"
                            background
                            @size-change="handleDeliveryLogSizeChange"
                            @current-change="loadDeliveryLogs"
                        />
                    </div>
                </div>
            </div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, RefreshRight, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { TableRowActions, type TableRowAction, userFacingErrorMessage } from '@acquiring/shared';
import { useUserStore } from '@/store/modules/user';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import { getMerchantNotificationDeliveryLogs, getMerchantNotificationDetail, retryMerchantNotification, searchMerchantNotifications, submitMerchantNotificationExportTask, type MerchantNotificationQuery, type TransactionRecord } from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionRecordList from '../components/TransactionRecordList.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, defaultTransactionTodayRange, ensureTransactionTimezoneOptions, resolveTransactionQueryRange, splitDateRange } from '../shared';

/**
 * 商户通知记录主页面：按交易分片时间查询投递任务和尝试明细，并仅对仍可重试的失败任务开放人工重试。
 */
const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const canNotificationDetail = userStore.hasPermission('transaction:merchant-notification:detail');
const canNotificationRetry = userStore.hasPermission('transaction:merchant-notification:retry');
const showOperationColumn = canNotificationDetail || canNotificationRetry;
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const retryingTransactionId = ref('');
const rows = ref<TransactionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const quickPreset = ref('today');
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailRow = ref<TransactionRecord | null>(null);
const deliveryLogs = ref<TransactionRecord[]>([]);
const deliveryLogsLoading = ref(false);
const deliveryLogPage = ref(1);
const deliveryLogPageSize = ref(10);
const deliveryLogTotal = ref(0);
const detailNotifyId = ref('');
const detailTransactionDateTime = ref('');
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive({ merchantId: '', transactionId: '', notifyStatus: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE });

function notificationRowActions(row: TransactionRecord): TableRowAction[] {
    const retryable = canRetryCallback(row);
    const transactionId = recordText(row, 'transactionId');
    return [
        { key: 'detail', label: t('common.detail'), icon: View, visible: canNotificationDetail },
        {
            key: 'retry', label: t('transaction.actions.retryCallback'), icon: RefreshRight, type: 'warning',
            visible: canNotificationRetry,
            disabled: !retryable,
            disabledReason: retryable ? t('transaction.actions.retryCallbackTip') : t('transaction.actions.retryNotificationDisabled'),
            loading: retryingTransactionId.value === transactionId,
        },
    ];
}

function handleNotificationRowAction(action: string, row: TransactionRecord) {
    if (action === 'detail') void openDetail(row);
    else if (action === 'retry') void handleRetryCallback(row);
}

onMounted(async () => {
    const linkedTransactionId = routeText('transactionId');
    if (linkedTransactionId) query.transactionId = linkedTransactionId;
    applyLinkedDateRange(routeText('sourceOccurredAt'));
    await loadTimezones();
    await loadData();
});

function routeText(name: string) {
    const value = route.query[name];
    return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function applyLinkedDateRange(value: string) {
    const date = value.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    quickPreset.value = '';
    dateRange.value = [`${date}T00:00:00`, `${date}T23:59:59`];
}

async function loadTimezones() {
    const options = await loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []);
    timezoneOptions.value = ensureTransactionTimezoneOptions(options);
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchMerchantNotifications(buildQuery(page.value, pageSize.value));
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        const task = await submitMerchantNotificationExportTask({
            requestId: createExportRequestId('merchant-notification'),
            query: buildQuery(),
        });
        await ElMessageBox.confirm(
            t('operations.exportTask.submitted', { taskNo: task.taskNo }),
            t('operations.exportTask.submittedTitle'),
            {
                confirmButtonText: t('operations.exportTask.openDownloadCenter'),
                cancelButtonText: t('common.close'),
                type: 'success',
            },
        ).then(() => router.push('/operations/export-tasks')).catch(() => undefined);
    } catch (error: unknown) {
        ElMessage.error(userFacingErrorMessage(error, t('common.exportFailed')));
    } finally {
        exporting.value = false;
    }
}

function createExportRequestId(prefix: string) {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return `${prefix}-export-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-export-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildQuery(pageNo?: number, currentPageSize?: number): MerchantNotificationQuery {
    return {
        pageNo,
        pageSize: currentPageSize,
        merchantId: query.merchantId || undefined,
        transactionId: query.transactionId || undefined,
        notifyStatus: query.notifyStatus || undefined,
        queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
        ...splitDateRange(currentDateRange()),
    };
}

function currentDateRange() {
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return dateRange.value;
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.merchantId = '';
    query.transactionId = '';
    query.notifyStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

async function openDetail(row: TransactionRecord) {
    detailRow.value = row;
    deliveryLogs.value = [];
    deliveryLogTotal.value = 0;
    deliveryLogPage.value = 1;
    detailVisible.value = true;
    const notifyId = recordText(row, 'notifyId');
    const transactionDateTime = recordText(row, 'transactionDateTime');
    detailNotifyId.value = notifyId;
    detailTransactionDateTime.value = transactionDateTime;
    if (!notifyId || !transactionDateTime) {
        return;
    }
    detailLoading.value = true;
    try {
        const [detail] = await Promise.all([
            getMerchantNotificationDetail(notifyId, transactionDateTime),
            loadDeliveryLogs(),
        ]);
        detailRow.value = detail.notification || row;
    } finally {
        detailLoading.value = false;
    }
}

async function loadDeliveryLogs() {
    if (!detailNotifyId.value || !detailTransactionDateTime.value) return;
    deliveryLogsLoading.value = true;
    try {
        const result = await getMerchantNotificationDeliveryLogs(
            detailNotifyId.value,
            detailTransactionDateTime.value,
            deliveryLogPage.value,
            deliveryLogPageSize.value,
        );
        deliveryLogs.value = result.records || [];
        deliveryLogTotal.value = result.total || 0;
    } catch (error) {
        deliveryLogs.value = [];
        deliveryLogTotal.value = 0;
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        deliveryLogsLoading.value = false;
    }
}

function handleDeliveryLogSizeChange() {
    deliveryLogPage.value = 1;
    void loadDeliveryLogs();
}

function recordText(row: TransactionRecord, field: string) {
    const value = row[field];
    return typeof value === 'string' ? value : '';
}

function canRetryCallback(row: TransactionRecord) {
    const status = recordText(row, 'notifyStatus').toUpperCase();
    const retryableStatus = ['SUCCESS', 'CLOSED'].includes(status)
        || (status === 'FAILED' && !recordText(row, 'nextRetryTime'));
    return retryableStatus
        && Boolean(recordText(row, 'transactionId') && recordText(row, 'transactionDateTime'));
}

async function handleRetryCallback(row: TransactionRecord) {
    const transactionId = recordText(row, 'transactionId');
    const transactionDateTime = recordText(row, 'transactionDateTime');
    if (!transactionId || !transactionDateTime) {
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('transaction.actions.retryCallbackConfirm', { transactionId }),
            t('transaction.actions.retryCallbackTitle'),
            {
                confirmButtonText: t('common.confirm'),
                cancelButtonText: t('common.cancel'),
                type: 'warning',
            },
        );
    } catch {
        return;
    }
    retryingTransactionId.value = transactionId;
    try {
        const eventId = await retryMerchantNotification({ transactionId, transactionDateTime });
        ElMessage.success(t('transaction.actions.retryCallbackAccepted', { eventId }));
        await loadData();
    } finally {
        retryingTransactionId.value = '';
    }
}

function statusType(value?: unknown) {
    const status = String(value || '').toUpperCase();
    if (['SUCCESS', 'SENT', 'DELIVERED'].includes(status)) {
        return 'success';
    }
    if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(status)) {
        return 'danger';
    }
    if (['PENDING', 'PROCESSING', 'RETRYING'].includes(status)) {
        return 'warning';
    }
    return 'info';
}

function notifyTypeText(value?: unknown) {
    const type = String(value || '').toUpperCase();
    const labels: Record<string, string> = {
        TRANSACTION_STATUS: '交易状态通知',
        TRANSACTION_RESULT: '交易结果通知',
        PAYMENT_RESULT: '支付结果通知',
        AUTHORIZATION_RESULT: '授权结果通知',
        PRE_AUTHORIZATION_RESULT: t('transaction.merchantNotifyType.PRE_AUTHORIZATION_RESULT'),
        PRE_AUTH_COMPLETION_RESULT: t('transaction.merchantNotifyType.PRE_AUTH_COMPLETION_RESULT'),
        INCREMENTAL_AUTHORIZATION_RESULT: t('transaction.merchantNotifyType.INCREMENTAL_AUTHORIZATION_RESULT'),
        CAPTURE_RESULT: '请款结果通知',
        REFUND_RESULT: '退款结果通知',
        VOID_RESULT: '撤销结果通知',
    };
    return labels[type] || type || '-';
}

function eventTypeText(value?: unknown) {
    const eventType = String(value || '').toUpperCase();
    return eventType ? t(`transaction.type.${eventType}`, eventType) : '-';
}

function notifyStatusText(value?: unknown) {
    const status = String(value || '').toUpperCase();
    const labels: Record<string, string> = {
        INIT: '待发送',
        PENDING: '待发送',
        PROCESSING: '发送中',
        RETRYING: '重试中',
        SUCCESS: '成功',
        SENT: '已发送',
        DELIVERED: '已送达',
        FAILED: '失败',
        CLOSED: '已关闭',
        EXPIRED: '已过期',
        CANCELLED: '已取消',
    };
    return labels[status] || status || '-';
}
</script>

<style scoped>
.transaction-page__table {
    border-radius: 6px;
    overflow: hidden;
}

.transaction-page__table :deep(.el-table__header-wrapper th) {
    height: 34px;
    background: #f7f9fc;
    color: #364152;
    font-size: 12px;
    font-weight: 700;
}

.transaction-page__table :deep(.el-table__cell) {
    padding: 6px 0;
}

.transaction-page__table :deep(.el-table__body tr:nth-child(even) td.el-table__cell) {
    background: #fbfcfe;
}

.transaction-page__table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: #f3f7ff;
}

.transaction-page__table :deep(.el-tag) {
    min-width: 54px;
    justify-content: center;
    border-radius: 4px;
}
</style>
