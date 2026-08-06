<template>
    <div class="page system-page merchant-redesigned-page merchant-refund-page">
        <section class="merchant-list-card merchant-search-card merchant-refund-filter">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form merchant-refund-search">
                <div class="merchant-refund-search__fields">
                    <el-form-item :label="t('transaction.refund.refundTransactionId')">
                        <el-input v-model.trim="query.refundTransactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.sourceTransactionId')">
                        <el-input v-model.trim="query.sourceTransactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.merchantOrderNo')">
                        <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.transactionStatus')">
                        <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                            <el-option v-for="item in transactionStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.approvalStatus')">
                        <el-select v-model="query.approvalStatus" :placeholder="t('common.pleaseSelect')" clearable>
                            <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.refundScope')">
                        <el-select v-model="query.refundScope" :placeholder="t('common.pleaseSelect')" clearable>
                            <el-option v-for="item in refundScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.refund.timeRange')" class="merchant-refund-time-item">
                        <TransactionTimeRangeFilter
                            v-model="dateRange"
                            v-model:time-zone="query.queryTimeZone"
                            v-model:preset="quickPreset"
                            :timezone-options="timezoneOptions"
                            default-preset="today"
                        />
                    </el-form-item>
                    <el-form-item class="merchant-search-actions merchant-refund-search__actions">
                        <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                        <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
                    </el-form-item>
                </div>
            </el-form>
        </section>

        <section class="merchant-refund-summary" aria-live="polite">
            <div v-for="item in summaryItems" :key="item.key" :class="['merchant-refund-summary__item', `is-${item.tone}`]">
                <span>{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
            </div>
        </section>

        <section class="merchant-list-card merchant-table-card merchant-refund-table-card">
            <div class="merchant-table-head merchant-refund-table-head">
                <div class="merchant-table-head__actions">
                    <el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">
                        {{ t('common.export') }}
                    </el-button>
                </div>
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>
            <StandardTable table-key="merchant-transaction-refund" v-loading="loading" :data="rows" row-key="refundTransactionId" size="small">
                <el-table-column prop="refundTransactionId" :label="t('transaction.refund.refundTransactionId')" min-width="210" fixed="left" show-overflow-tooltip />
                <el-table-column prop="sourceTransactionId" :label="t('transaction.refund.sourceTransactionId')" min-width="210" show-overflow-tooltip />
                <el-table-column prop="merchantOrderNo" :label="t('transaction.refund.merchantOrderNo')" min-width="184" show-overflow-tooltip />
                <el-table-column :label="t('transaction.refund.transactionType')" width="110" align="center">
                    <template #default="{ row }"><el-tag size="small" effect="plain">{{ optionText(refundTypeOptions, row.transactionType) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.refundScope')" width="112" align="center">
                    <template #default="{ row }">{{ optionText(refundScopeOptions, row.refundScope) }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.transactionAmount')" min-width="142" align="right">
                    <template #default="{ row }"><span class="merchant-refund-money">{{ moneyText(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</span></template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.transactionStatus')" width="120" align="center">
                    <template #default="{ row }"><el-tag size="small" :type="statusTagType(row.transactionStatus, transactionStatusOptions)">{{ optionText(transactionStatusOptions, row.transactionStatus) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.approvalStatus')" width="126" align="center">
                    <template #default="{ row }"><el-tag size="small" :type="approvalTagType(row.approvalStatus)" effect="plain">{{ optionText(approvalStatusOptions, row.approvalStatus) }}</el-tag></template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.paymentMethod')" min-width="132" align="center">
                    <template #default="{ row }">{{ [row.paymentMethod, row.paymentBrand].filter(Boolean).join(' / ') || '-' }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.processingResult')" min-width="190" align="center" show-overflow-tooltip>
                    <template #default="{ row }">{{ visibleMessage(row) }}</template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.transactionTime')" min-width="178" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
                </el-table-column>
                <el-table-column :label="t('transaction.refund.completeTime')" min-width="178" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.completeTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
                </el-table-column>
                <el-table-column :label="t('common.operation')" width="92" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button v-if="canDetail" link type="primary" size="small" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    </template>
                </el-table-column>
            </StandardTable>

            <div class="pagination-container" v-show="total > 0">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
            </div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('transaction.refund.detailTitle')" size="min(720px, 92vw)" destroy-on-close append-to-body>
            <div v-loading="detailLoading" class="merchant-refund-detail">
                <template v-if="detail?.refund">
                    <h3>{{ t('transaction.refund.baseInfo') }}</h3>
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('transaction.refund.refundTransactionId')">{{ detail.refund.refundTransactionId }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.sourceTransactionId')">{{ detail.refund.sourceTransactionId || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.merchantOrderNo')">{{ detail.refund.merchantOrderNo || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.transactionAmount')">{{ moneyText(detail.refund.transactionAmount, detail.refund.transactionCurrency, detail.refund.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.transactionStatus')">{{ optionText(transactionStatusOptions, detail.refund.transactionStatus) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.approvalStatus')">{{ optionText(approvalStatusOptions, detail.refund.approvalStatus) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.requestReason')" :span="2">{{ detail.refund.requestReason || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.refund.processingResult')" :span="2">{{ visibleMessage(detail.refund) }}</el-descriptions-item>
                    </el-descriptions>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    transactionApi,
    type MerchantRefundDetail,
    type MerchantRefundQuery,
    type MerchantRefundRecord,
    type MerchantRefundSummary,
} from '@/api/transactionApi';
import { hasPermission } from '@/utils/permission';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    moneyText,
    resolveTransactionQueryRange,
    splitDateRange,
    statusTagType,
    type TransactionDictOption,
} from '../shared';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const rows = ref<MerchantRefundRecord[]>([]);
const detail = ref<MerchantRefundDetail | null>(null);
const summary = ref<MerchantRefundSummary>(emptySummary());
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dateRange = ref<string[]>(defaultTransactionTodayRange());
const quickPreset = ref('today');
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const query = reactive({
    refundTransactionId: '', sourceTransactionId: '', merchantOrderNo: '',
    transactionStatus: '', approvalStatus: '', refundScope: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const canDetail = computed(() => hasPermission('merchant:transaction:refund:detail'));
const canExport = computed(() => hasPermission('merchant:transaction:refund:export'));
const transactionStatusOptions = options(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'], 'transaction.status');
const approvalStatusOptions = options(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_REQUIRED', 'NOT_APPLICABLE'], 'transaction.refund.approvalStatusOption');
const refundTypeOptions = options(['REFUND', 'VOID'], 'transaction.type');
const refundScopeOptions = options(['FULL', 'PARTIAL', 'VOID'], 'transaction.refund.scopeOption');
const summaryItems = computed(() => [
    { key: 'total', label: t('transaction.refund.summary.total'), value: summary.value.totalCount, tone: 'neutral' },
    { key: 'pending', label: t('transaction.refund.summary.pendingApproval'), value: summary.value.pendingApprovalCount, tone: 'warning' },
    { key: 'processing', label: t('transaction.refund.summary.processing'), value: summary.value.processingCount, tone: 'primary' },
    { key: 'success', label: t('transaction.refund.summary.success'), value: summary.value.successCount, tone: 'success' },
]);

onMounted(loadData);

function options(values: string[], key: string): TransactionDictOption[] {
    return values.map((value) => ({ value, label: t(`${key}.${value}`, value) }));
}

function optionText(items: TransactionDictOption[], value?: string) {
    return value ? items.find((item) => item.value === value)?.label || value : '-';
}

async function loadData() {
    loading.value = true;
    try {
        const result = await transactionApi.searchRefunds(buildQuery(page.value, pageSize.value));
        rows.value = result.page?.records || [];
        total.value = result.page?.total || 0;
        summary.value = result.summary || emptySummary();
    } catch (error: any) {
        rows.value = [];
        total.value = 0;
        summary.value = emptySummary();
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.refund.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function buildQuery(pageNo?: number, currentPageSize?: number): MerchantRefundQuery {
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return {
        pageNo,
        pageSize: currentPageSize,
        refundTransactionId: query.refundTransactionId || undefined,
        sourceTransactionId: query.sourceTransactionId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        transactionStatus: query.transactionStatus || undefined,
        approvalStatus: query.approvalStatus || undefined,
        refundScope: query.refundScope || undefined,
        queryTimeZone: query.queryTimeZone,
        ...splitDateRange(dateRange.value),
    };
}

function applyQuery() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    Object.assign(query, {
        refundTransactionId: '', sourceTransactionId: '', merchantOrderNo: '',
        transactionStatus: '', approvalStatus: '', refundScope: '',
        queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    });
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange();
    applyQuery();
}

async function handleExport() {
    exporting.value = true;
    try {
        await transactionApi.exportRefunds(buildQuery());
    } finally {
        exporting.value = false;
    }
}

async function openDetail(row: MerchantRefundRecord) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await transactionApi.refundDetail(row.refundTransactionId, row.transactionDateTime);
    } finally {
        detailLoading.value = false;
    }
}

function visibleMessage(row: MerchantRefundRecord) {
    if (row.approvalStatus === 'PENDING') return t('transaction.refund.message.pendingApproval');
    if (row.approvalStatus === 'REJECTED' || row.approvalStatus === 'EXPIRED') return t('transaction.refund.message.notApproved');
    if (row.transactionStatus === 'PENDING' || row.transactionStatus === 'PROCESSING') return t('transaction.refund.message.processing');
    if (row.transactionStatus === 'SUCCESS') return t('transaction.refund.message.success');
    return t('transaction.refund.message.failed');
}

function approvalTagType(status?: string) {
    if (status === 'APPROVED' || status === 'NOT_REQUIRED' || status === 'NOT_APPLICABLE') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'info';
}

function emptySummary(): MerchantRefundSummary {
    return { totalCount: 0, pendingApprovalCount: 0, processingCount: 0, successCount: 0, failedOrRejectedCount: 0, currencyAmounts: [] };
}
</script>

<style scoped>
.merchant-refund-page {
    display: grid;
    gap: 10px;
}

.merchant-refund-search__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px 12px;
}

.merchant-refund-search :deep(.el-form-item) {
    margin: 0;
}

.merchant-refund-search :deep(.el-input),
.merchant-refund-search :deep(.el-select) {
    width: 200px;
}

.merchant-refund-time-item {
    flex: 1 1 650px;
}

.merchant-refund-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border: 1px solid #dce7ef;
    border-radius: 6px;
    background: #ffffff;
    overflow: hidden;
}

.merchant-refund-summary__item {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 52px;
    border-right: 1px solid #e8eff4;
    padding: 8px 14px;
}

.merchant-refund-summary__item:last-child {
    border-right: 0;
}

.merchant-refund-summary__item span {
    color: #607181;
    font-size: 12px;
    font-weight: 700;
}

.merchant-refund-summary__item strong {
    color: #19374b;
    font-size: 20px;
    font-variant-numeric: tabular-nums;
}

.merchant-refund-summary__item.is-success {
    border-top: 3px solid #2d8b72;
}

.merchant-refund-summary__item.is-warning {
    border-top: 3px solid #d18a2e;
}

.merchant-refund-summary__item.is-primary {
    border-top: 3px solid #3478a5;
}

.merchant-refund-table-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.merchant-refund-money {
    color: #19374b;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.merchant-refund-detail h3 {
    margin: 0 0 10px;
    color: #19374b;
    font-size: 14px;
}

@media (max-width: 900px) {
    .merchant-refund-summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .merchant-refund-summary__item:nth-child(2) {
        border-right: 0;
    }
}

@media (max-width: 640px) {
    .merchant-refund-summary {
        grid-template-columns: 1fr;
    }

    .merchant-refund-summary__item,
    .merchant-refund-summary__item:nth-child(2) {
        border-right: 0;
        border-bottom: 1px solid #e8eff4;
    }

    .merchant-refund-summary__item:last-child {
        border-bottom: 0;
    }

    .merchant-refund-search__fields :deep(.el-form-item),
    .merchant-refund-search__fields :deep(.el-input),
    .merchant-refund-search__fields :deep(.el-select) {
        width: 100%;
    }
}
</style>
