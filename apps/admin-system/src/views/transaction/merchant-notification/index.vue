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
            label-width="96px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.notifyStatus')"><el-input v-model.trim="query.notifyStatus" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            :title="t('transaction.summary.logResultTitle')"
            :description="t('transaction.summary.notificationResultDescription')"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

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
            <el-table-column prop="notifyType" :label="t('transaction.fields.notifyType')" width="130" align="center" />
            <el-table-column prop="eventType" :label="t('transaction.fields.eventType')" width="140" align="center" />
            <el-table-column :label="t('transaction.fields.notifyStatus')" width="130" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.notifyStatus)">{{ row.notifyStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="lastAttemptNo" :label="t('transaction.fields.lastAttemptNo')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.nextRetryTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.nextRetryTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center">
                <template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:merchant-notification:detail'">{{ t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.merchantNotification.detailTitle')" size="lg">
            <TransactionRecordList :rows="detailRow ? [detailRow] : []" :display-time-zone="query.queryTimeZone" />
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import { searchMerchantNotifications, type TransactionRecord } from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionRecordList from '../components/TransactionRecordList.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, defaultTransactionTodayRange, ensureTransactionTimezoneOptions, splitDateRange } from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<TransactionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const detailVisible = ref(false);
const detailRow = ref<TransactionRecord | null>(null);
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
        const result = await searchMerchantNotifications({
            pageNo: page.value,
            pageSize: pageSize.value,
            merchantId: query.merchantId || undefined,
            transactionId: query.transactionId || undefined,
            notifyStatus: query.notifyStatus || undefined,
            queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
            ...splitDateRange(dateRange.value),
        });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
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
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(row: TransactionRecord) {
    detailRow.value = row;
    detailVisible.value = true;
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
