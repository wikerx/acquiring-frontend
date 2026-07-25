<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.callbackSearch.title')"
            :description="t('transaction.callbackSearch.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="106px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.channelCode')"><el-input v-model.trim="query.channelCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.channelOrderNo')"><el-input v-model.trim="query.channelOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.callbackStatus')"><el-input v-model.trim="query.callbackStatus" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            :title="t('transaction.summary.logResultTitle')"
            :description="t('transaction.summary.callbackResultDescription')"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

        <StandardTable table-key="transaction-channel-callback" v-loading="loading" :data="rows" row-key="callbackId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.callbackId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.callbackId" :label="t('transaction.fields.callbackId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="220" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.channelOrderNo')" min-width="200" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelTransactionId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelTransactionId" :label="t('transaction.fields.channelTransactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.callbackStatus')" width="130" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.callbackStatus)">{{ row.callbackStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.processResult')" width="160" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.processResult)">{{ row.processResult || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.callbackReceivedTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.callbackReceivedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center">
                <template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:channel-callback:detail'">{{ t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.channelCallback.detailTitle')" size="lg">
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
import { searchTransactionChannelCallbacks, type TransactionRecord } from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
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
const quickPreset = ref('today');
const detailVisible = ref(false);
const detailRow = ref<TransactionRecord | null>(null);
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive({ channelCode: '', transactionId: '', channelOrderNo: '', callbackStatus: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE });

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
        const result = await searchTransactionChannelCallbacks({
            pageNo: page.value,
            pageSize: pageSize.value,
            channelCode: query.channelCode || undefined,
            transactionId: query.transactionId || undefined,
            channelOrderNo: query.channelOrderNo || undefined,
            callbackStatus: query.callbackStatus || undefined,
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
    query.channelCode = '';
    query.transactionId = '';
    query.channelOrderNo = '';
    query.callbackStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(row: TransactionRecord) {
    detailRow.value = row;
    detailVisible.value = true;
}

function statusType(value?: unknown) {
    const status = String(value || '').toUpperCase();
    if (['SUCCESS', 'PROCESSED', 'ACCEPTED', 'VALID'].includes(status)) {
        return 'success';
    }
    if (['FAILED', 'REJECTED', 'INVALID'].includes(status)) {
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
