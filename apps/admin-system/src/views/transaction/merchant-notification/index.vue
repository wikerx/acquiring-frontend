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
            <el-table-column :label="t('common.operation')" width="210" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:merchant-notification:detail'">{{ t('common.detail') }}</el-button>
                    <el-tooltip :content="canRetryCallback(row) ? t('transaction.actions.retryCallbackTip') : t('transaction.actions.retryNotificationDisabled')" placement="top">
                        <span>
                            <el-button
                                type="warning"
                                link
                                :icon="RefreshRight"
                                :disabled="!canRetryCallback(row)"
                                :loading="retryingTransactionId === recordText(row, 'transactionId')"
                                @click="handleRetryCallback(row)"
                                v-hasPermi="'transaction:merchant-notification:retry'"
                            >
                                {{ t('transaction.actions.retryCallback') }}
                            </el-button>
                        </span>
                    </el-tooltip>
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
                <TransactionRecordList :rows="deliveryLogs" variant="callback" :display-time-zone="query.queryTimeZone" />
            </div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, RefreshRight, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import { exportMerchantNotifications, getMerchantNotificationDetail, retryMerchantNotification, searchMerchantNotifications, type MerchantNotificationQuery, type TransactionRecord } from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionRecordList from '../components/TransactionRecordList.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, defaultTransactionTodayRange, ensureTransactionTimezoneOptions, resolveTransactionQueryRange, splitDateRange } from '../shared';

const { t, locale } = useI18n();
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
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive({ merchantId: '', transactionId: '', notifyStatus: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE });

onMounted(async () => {
    await loadTimezones();
    await loadData();
});

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
        await exportMerchantNotifications(buildQuery());
    } finally {
        exporting.value = false;
    }
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
    detailVisible.value = true;
    const notifyId = recordText(row, 'notifyId');
    const transactionDateTime = recordText(row, 'transactionDateTime');
    if (!notifyId || !transactionDateTime) {
        return;
    }
    detailLoading.value = true;
    try {
        const detail = await getMerchantNotificationDetail(notifyId, transactionDateTime);
        detailRow.value = detail.notification || row;
        deliveryLogs.value = detail.deliveryLogs || [];
    } finally {
        detailLoading.value = false;
    }
}

function recordText(row: TransactionRecord, field: string) {
    const value = row[field];
    return typeof value === 'string' ? value : '';
}

function canRetryCallback(row: TransactionRecord) {
    const status = recordText(row, 'notifyStatus').toUpperCase();
    const retryableStatus = ['SUCCESS', 'FAILED', 'CLOSED'].includes(status)
        || (status === 'INIT' && Boolean(recordText(row, 'nextRetryTime')));
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
