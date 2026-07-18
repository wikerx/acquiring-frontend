<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.orderSearch.title')"
            :description="t('transaction.orderSearch.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            label-width="96px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionStatus')">
                <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <el-row class="mb8 transaction-table-toolbar">
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:order:export'">
                    {{ t('common.export') }}
                </el-button>
            </el-col>
        </el-row>

        <StandardTable table-key="transaction-order" v-loading="loading" :data="rows" row-key="operationId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.rootTransactionId')" min-width="220" fixed="left" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.rootTransactionId" :label="t('transaction.fields.rootTransactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.latestTransactionId')" min-width="220" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.latestTransactionId" :label="t('transaction.fields.latestTransactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantId')" min-width="130" align="center">
                <template #default="{ row }">
                    <div v-if="row.merchantId" class="transaction-page__merchant-cell">
                        <button class="transaction-page__link" type="button" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</button>
                        <CopyableText :value="row.merchantId" :label="t('transaction.fields.merchantId')" icon-only />
                    </div>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionType')" width="140" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain">{{ tagText(typeOptions, row.transactionType) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.lifecycleStatus')" width="145" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="lifecycleTooltip(row)" placement="top">
                        <el-tag size="small" :type="lifecycleTagType(row)">{{ lifecycleText(row) }}</el-tag>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantResponseCode')" width="128" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="responseTooltip(row.merchantResponseCode, row.merchantResponseMessage)" placement="top">
                        <el-tag size="small" effect="plain">{{ row.merchantResponseCode || '-' }}</el-tag>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.currentAmount')" width="150" align="center">
                <template #default="{ row }">{{ moneyText(row.currentAmount ?? row.transactionAmount, row.currentCurrency || row.transactionCurrency, row.currencyExponent) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                <template #default="{ row }">{{ rateText(row.transactionRate) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.authorizedAmount')" width="150" align="center">
                <template #default="{ row }">{{ moneyText(row.authorizedAmount, row.transactionCurrency, row.currencyExponent) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.capturedAmount')" width="150" align="center">
                <template #default="{ row }">{{ moneyText(row.capturedAmount, row.transactionCurrency, row.currencyExponent) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.refundedAmount')" width="150" align="center">
                <template #default="{ row }">{{ moneyText(row.refundedAmount, row.transactionCurrency, row.currencyExponent) }}</template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.channelMatchStatus')" width="140" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.channelMatchStatus)">{{ tagText(channelMatchStatusOptions, row.channelMatchStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.settlementStatus')" width="130" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.settlementStatus)">{{ tagText(settlementStatusOptions, row.settlementStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.reconciliationStatus')" width="130" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.reconciliationStatus)">{{ tagText(reconciliationStatusOptions, row.reconciliationStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row.rootTransactionId)" v-hasPermi="'transaction:order:detail'">{{ t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <TransactionDetailDrawer
            v-model:visible="detailVisible"
            :title="t('transaction.detail.title')"
            :detail="detail"
            :focus-transaction-id="selectedDetailTransactionId"
            :display-time-zone="query.queryTimeZone"
            :loading="detailLoading"
        />
        <TransactionMerchantDrawer v-model:visible="merchantVisible" :merchant-id="selectedMerchantId" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { exportTransactionOrders, getTransactionOrderDetail, searchTransactionOrders, type TransactionDetail, type TransactionOrder, type TransactionPageQuery } from '@/api/transaction';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionDetailDrawer from '../components/TransactionDetailDrawer.vue';
import TransactionMerchantDrawer from '../components/TransactionMerchantDrawer.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    fallbackTransactionStatusOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    moneyText,
    openTransactionDetail,
    rateText,
    responseTooltip,
    splitDateRange,
    statusOptionTagType,
    statusTagType,
    tagText,
    type TransactionDictOption,
} from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const merchantVisible = ref(false);
const rows = ref<TransactionOrder[]>([]);
const detail = ref<TransactionDetail | null>(null);
const selectedDetailTransactionId = ref('');
const selectedMerchantId = ref('');
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const query = reactive({
    merchantId: '',
    merchantOrderNo: '',
    transactionId: '',
    transactionStatus: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const typeOptions = ref<TransactionDictOption[]>([]);
const statusOptions = ref<TransactionDictOption[]>([]);
const channelMatchStatusOptions = ref<TransactionDictOption[]>([]);
const reconciliationStatusOptions = ref<TransactionDictOption[]>([]);
const settlementStatusOptions = ref<TransactionDictOption[]>([]);
const timezoneOptions = ref<SelectOption[]>([]);

const summaryItems = computed(() => [
    {
        key: 'total',
        label: t('transaction.summary.total'),
        value: total.value.toLocaleString(),
        description: t('transaction.summary.loaded', { count: rows.value.length }),
    },
    {
        key: 'success',
        label: t('transaction.summary.success'),
        value: statusCount('SUCCESS'),
        description: t('transaction.summary.currentPage'),
        tone: 'success' as const,
    },
    {
        key: 'failed',
        label: t('transaction.summary.failed'),
        value: statusCount('FAILED'),
        description: t('transaction.summary.currentPage'),
        tone: 'danger' as const,
    },
    {
        key: 'captured',
        label: t('transaction.summary.captured'),
        value: lifecycleCount('CAPTURED'),
        description: t('transaction.summary.lifecycleCurrentPage'),
        tone: 'balance' as const,
    },
]);

onMounted(async () => {
    await loadDictionaries();
    await loadData();
});

async function loadDictionaries() {
    typeOptions.value = fallbackTransactionTypeOptions(t);
    statusOptions.value = fallbackTransactionStatusOptions(t);
    channelMatchStatusOptions.value = fallbackStatusOptions('channelMatch');
    reconciliationStatusOptions.value = fallbackStatusOptions('reconciliation');
    settlementStatusOptions.value = fallbackStatusOptions('settlement');
    try {
        const [types, statuses, channelMatches, reconciliations, settlements, timezones] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('reconciliation_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        typeOptions.value = types.length ? types : typeOptions.value;
        statusOptions.value = statuses.length ? statuses : statusOptions.value;
        channelMatchStatusOptions.value = channelMatches.length ? channelMatches : channelMatchStatusOptions.value;
        reconciliationStatusOptions.value = reconciliations.length ? reconciliations : reconciliationStatusOptions.value;
        settlementStatusOptions.value = settlements.length ? settlements : settlementStatusOptions.value;
        timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction dictionaries, fallback options are used.', error);
        timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    }
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchTransactionOrders(buildQuery(page.value, pageSize.value));
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        await exportTransactionOrders(buildQuery());
    } finally {
        exporting.value = false;
    }
}

function buildQuery(pageNo?: number, currentPageSize?: number): TransactionPageQuery {
    const range = splitDateRange(dateRange.value);
    return {
        pageNo,
        pageSize: currentPageSize,
        merchantId: query.merchantId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        transactionId: query.transactionId || undefined,
        transactionStatus: query.transactionStatus || undefined,
        queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
        ...range,
    };
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.merchantId = '';
    query.merchantOrderNo = '';
    query.transactionId = '';
    query.transactionStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(transactionId: string) {
    selectedDetailTransactionId.value = transactionId;
    openTransactionDetail(transactionId, detailLoading, detailVisible, detail, getTransactionOrderDetail, t('common.loadFailed'));
}

function openMerchant(merchantId: string) {
    selectedMerchantId.value = merchantId;
    merchantVisible.value = true;
}

function statusCount(status: string) {
    return rows.value.filter((row) => row.transactionStatus === status).length;
}

function lifecycleCount(status: string) {
    return rows.value.filter((row) => row.lifecycleStatus === status).length;
}

function fallbackStatusOptions(scope: 'channelMatch' | 'reconciliation' | 'settlement'): TransactionDictOption[] {
    const values = scope === 'channelMatch'
        ? ['NOT_REQUIRED', 'PENDING', 'MATCHED', 'MISMATCHED', 'FAILED']
        : scope === 'reconciliation'
            ? ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED']
            : ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED'];
    return values.map((value) => ({ label: t(`transaction.statusOption.${value}`, value), value }));
}

function lifecycleText(row: TransactionOrder) {
    const value = row.lifecycleStatus || row.transactionStatus || '';
    if (!value) {
        return '-';
    }
    return t(`transaction.lifecycleStatus.${value}`, tagText(statusOptions.value, value));
}

function lifecycleTooltip(row: TransactionOrder) {
    return `${tagText(typeOptions.value, row.transactionType)} / ${lifecycleText(row)}`;
}

function lifecycleTagType(row: TransactionOrder) {
    const value = row.lifecycleStatus || row.transactionStatus;
    if (['VOIDED', 'FULLY_REFUNDED'].includes(value)) {
        return 'warning';
    }
    if (['PARTIALLY_REFUNDED', 'PARTIALLY_CAPTURED', 'CAPTURED'].includes(value)) {
        return 'primary';
    }
    return statusTagType(row.transactionStatus, statusOptions.value);
}
</script>

<style scoped>
.transaction-page__link {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--el-color-primary);
    font-weight: 500;
    cursor: pointer;
}

.transaction-page__merchant-cell {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 4px;
}

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

.transaction-page__table :deep(.cell) {
    line-height: 20px;
}

.transaction-page__table :deep(.el-tag) {
    min-width: 54px;
    justify-content: center;
    border-radius: 4px;
}
</style>
