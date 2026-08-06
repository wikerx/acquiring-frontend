<template>
    <div class="app-container transaction-page refund-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.refund.searchTitle')"
            :description="t('transaction.refund.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            label-width="104px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.refund.refundTransactionId')">
                <el-input v-model.trim="query.refundTransactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.sourceTransactionId')">
                <el-input v-model.trim="query.sourceTransactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionStatus')">
                <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in transactionStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.refund.approvalStatus')">
                <el-select v-model="query.approvalStatus" :placeholder="t('common.pleaseSelect')" clearable :disabled="viewMode === 'pending'">
                    <el-option v-for="item in approvalStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.fields.transactionType')">
                    <el-select v-model="query.transactionType" :placeholder="t('common.pleaseSelect')" clearable>
                        <el-option v-for="item in refundTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.refund.refundScope')">
                    <el-select v-model="query.refundScope" :placeholder="t('common.pleaseSelect')" clearable>
                        <el-option v-for="item in refundScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.refund.requestSource')">
                    <el-select v-model="query.requestSource" :placeholder="t('common.pleaseSelect')" clearable>
                        <el-option v-for="item in requestSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelCode')">
                    <el-input v-model.trim="query.channelCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter
                        v-model="dateRange"
                        v-model:time-zone="query.queryTimeZone"
                        v-model:preset="quickPreset"
                        :timezone-options="timezoneOptions"
                        :default-preset="viewMode === 'pending' ? '' : 'today'"
                    />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <el-row class="mb8 transaction-table-toolbar" justify="space-between">
            <el-col :span="18">
                <el-radio-group v-model="viewMode" size="small" @change="handleModeChange">
                    <el-radio-button value="all">{{ t('transaction.refund.allRefunds') }}</el-radio-button>
                    <el-radio-button value="pending">{{ t('transaction.refund.pendingQueue') }}</el-radio-button>
                </el-radio-group>
            </el-col>
            <el-col :span="6" class="refund-page__toolbar-actions">
                <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:refund:export'">
                    {{ t('common.export') }}
                </el-button>
            </el-col>
        </el-row>

        <StandardTable table-key="transaction-refund-management" v-loading="loading" :data="rows" row-key="refundTransactionId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.refund.refundTransactionId')" min-width="220" fixed="left" align="center" show-overflow-tooltip>
                <template #default="{ row }"><CopyableText :value="row.refundTransactionId" :label="t('transaction.refund.refundTransactionId')" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.sourceTransactionId')" min-width="210" align="center" show-overflow-tooltip>
                <template #default="{ row }"><CopyableText :value="row.sourceTransactionId" :label="t('transaction.fields.sourceTransactionId')" /></template>
            </el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="130" align="center" />
            <el-table-column prop="merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="t('transaction.fields.transactionType')" width="112" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain">{{ optionText(refundTypeOptions, row.transactionType) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.refund.refundScope')" width="112" align="center">
                <template #default="{ row }">{{ optionText(refundScopeOptions, row.refundScope) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionAmount')" width="150" align="right">
                <template #default="{ row }">{{ moneyText(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionStatus')" width="118" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusTagType(row.transactionStatus)">{{ optionText(transactionStatusOptions, row.transactionStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.refund.approvalStatus')" width="126" align="center">
                <template #default="{ row }"><el-tag size="small" :type="approvalTagType(row.approvalStatus)" effect="plain">{{ optionText(approvalStatusOptions, row.approvalStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.refund.requestSource')" width="126" align="center">
                <template #default="{ row }">{{ optionText(requestSourceOptions, row.requestSource) }}</template>
            </el-table-column>
            <el-table-column prop="applicantName" :label="t('transaction.refund.applicant')" min-width="130" align="center" />
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="112" align="center" />
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.refund.completeTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.completeTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="208" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:refund:detail'">{{ t('common.detail') }}</el-button>
                    <template v-if="row.approvalStatus === 'PENDING' && row.approvalId">
                        <el-button link type="success" size="small" @click="openDecision(row, 'approve')" v-hasPermi="'transaction:refund:approve'">{{ t('transaction.refund.approve') }}</el-button>
                        <el-button link type="danger" size="small" @click="openDecision(row, 'reject')" v-hasPermi="'transaction:refund:reject'">{{ t('transaction.refund.reject') }}</el-button>
                    </template>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.refund.detailTitle')" size="lg" :loading="detailLoading">
            <template v-if="detail?.refund">
                <h3 class="refund-page__section-title">{{ t('transaction.refund.baseInfo') }}</h3>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.refund.refundTransactionId')">{{ detail.refund.refundTransactionId }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.sourceTransactionId')">{{ detail.refund.sourceTransactionId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantId')">{{ detail.refund.merchantId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantOrderNo')">{{ detail.refund.merchantOrderNo || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.transactionAmount')">{{ moneyText(detail.refund.transactionAmount, detail.refund.transactionCurrency, detail.refund.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.transactionStatus')">{{ optionText(transactionStatusOptions, detail.refund.transactionStatus) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.requestReason')" :span="2">{{ detail.refund.requestReason || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.failReason')" :span="2">{{ failureText(detail.refund) }}</el-descriptions-item>
                </el-descriptions>
                <h3 class="refund-page__section-title">{{ t('transaction.refund.approvalInfo') }}</h3>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.refund.approvalId')">{{ detail.refund.approvalId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.approvalStatus')">{{ optionText(approvalStatusOptions, detail.refund.approvalStatus) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.approvalOperator')">{{ detail.refund.approvalOperatorName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.approvalTime')"><BaseDateTime :value="detail.refund.approvalTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.refund.approvalReason')" :span="2">{{ detail.refund.approvalReason || '-' }}</el-descriptions-item>
                </el-descriptions>
            </template>
        </CommonDetailDrawer>

        <el-dialog v-model="decisionVisible" :title="decisionAction === 'approve' ? t('transaction.refund.approveTitle') : t('transaction.refund.rejectTitle')" width="520px" destroy-on-close>
            <el-form label-position="top">
                <el-form-item :label="t('transaction.refund.approvalReason')" :required="decisionAction === 'reject'">
                    <el-input v-model.trim="decisionReason" type="textarea" :rows="4" maxlength="512" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="decisionLoading" @click="submitDecision">{{ t('common.confirm') }}</el-button>
                    <el-button @click="decisionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    approveRefund,
    exportRefundManagement,
    getRefundManagementDetail,
    rejectRefund,
    searchRefundManagement,
    type RefundManagementDetail,
    type RefundManagementQuery,
    type RefundManagementRecord,
    type RefundManagementSummary,
} from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
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
const decisionLoading = ref(false);
const decisionVisible = ref(false);
const decisionAction = ref<'approve' | 'reject'>('approve');
const decisionReason = ref('');
const selectedDecision = ref<RefundManagementRecord | null>(null);
const rows = ref<RefundManagementRecord[]>([]);
const detail = ref<RefundManagementDetail | null>(null);
const summary = ref<RefundManagementSummary>(emptySummary());
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const viewMode = ref<'all' | 'pending'>('all');
const dateRange = ref<string[]>(defaultTransactionTodayRange());
const quickPreset = ref('today');
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const query = reactive({
    merchantId: '',
    refundTransactionId: '',
    sourceTransactionId: '',
    merchantOrderNo: '',
    transactionType: '',
    refundScope: '',
    approvalStatus: '',
    transactionStatus: '',
    requestSource: '',
    channelCode: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});

const transactionStatusOptions = options(['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'], 'transaction.status');
const approvalStatusOptions = options(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'NOT_REQUIRED', 'NOT_APPLICABLE'], 'transaction.refund.approvalStatusOption');
const refundTypeOptions = options(['REFUND', 'VOID'], 'transaction.type');
const refundScopeOptions = options(['FULL', 'PARTIAL', 'VOID'], 'transaction.refund.scopeOption');
const requestSourceOptions = options(['OPENAPI', 'ADMIN_PORTAL', 'MERCHANT_PORTAL', 'SYSTEM', 'LEGACY_UNKNOWN'], 'transaction.refund.sourceOption');

const summaryItems = computed(() => [
    summaryItem('total', 'totalCount'),
    summaryItem('pendingApproval', 'pendingApprovalCount', 'balance'),
    summaryItem('processing', 'processingCount'),
    summaryItem('success', 'successCount', 'success'),
]);

onMounted(loadData);

function options(values: string[], key: string): TransactionDictOption[] {
    return values.map((value) => ({ value, label: t(`${key}.${value}`, value) }));
}

function optionText(items: TransactionDictOption[], value?: string) {
    return value ? items.find((item) => item.value === value)?.label || value : '-';
}

function summaryItem(key: string, field: keyof RefundManagementSummary, tone?: 'success' | 'danger' | 'balance') {
    return {
        key,
        label: t(`transaction.refund.summary.${key}`),
        value: Number(summary.value[field] || 0).toLocaleString(),
        description: t('transaction.refund.summary.currentFilter'),
        tone,
    };
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchRefundManagement(buildQuery(page.value, pageSize.value));
        rows.value = result.page?.records || [];
        total.value = result.page?.total || 0;
        summary.value = result.summary || emptySummary();
    } finally {
        loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        await exportRefundManagement(buildQuery());
    } finally {
        exporting.value = false;
    }
}

function buildQuery(pageNo?: number, currentPageSize?: number): RefundManagementQuery {
    const range = currentRange();
    return {
        pageNo,
        pageSize: currentPageSize,
        merchantId: query.merchantId || undefined,
        refundTransactionId: query.refundTransactionId || undefined,
        sourceTransactionId: query.sourceTransactionId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        transactionType: query.transactionType || undefined,
        refundScope: query.refundScope || undefined,
        approvalStatus: viewMode.value === 'pending' ? 'PENDING' : query.approvalStatus || undefined,
        transactionStatus: query.transactionStatus || undefined,
        requestSource: query.requestSource || undefined,
        channelCode: query.channelCode || undefined,
        queryTimeZone: query.queryTimeZone,
        ...splitDateRange(range),
    };
}

function currentRange() {
    if (viewMode.value === 'pending') return [];
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return dateRange.value;
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    Object.assign(query, {
        merchantId: '', refundTransactionId: '', sourceTransactionId: '', merchantOrderNo: '',
        transactionType: '', refundScope: '', approvalStatus: '', transactionStatus: '',
        requestSource: '', channelCode: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    });
    quickPreset.value = viewMode.value === 'pending' ? '' : 'today';
    dateRange.value = viewMode.value === 'pending' ? [] : defaultTransactionTodayRange();
    handleSearch();
}

function handleModeChange() {
    quickPreset.value = viewMode.value === 'pending' ? '' : 'today';
    dateRange.value = viewMode.value === 'pending' ? [] : defaultTransactionTodayRange(query.queryTimeZone);
    handleSearch();
}

async function openDetail(row: RefundManagementRecord) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await getRefundManagementDetail(row.refundTransactionId, row.transactionDateTime);
    } finally {
        detailLoading.value = false;
    }
}

function openDecision(row: RefundManagementRecord, action: 'approve' | 'reject') {
    selectedDecision.value = row;
    decisionAction.value = action;
    decisionReason.value = '';
    decisionVisible.value = true;
}

async function submitDecision() {
    const row = selectedDecision.value;
    if (!row?.approvalId || row.approvalVersion === undefined) return;
    if (decisionAction.value === 'reject' && !decisionReason.value) {
        ElMessage.warning(t('transaction.refund.rejectReasonRequired'));
        return;
    }
    decisionLoading.value = true;
    try {
        const payload = {
            decisionRequestId: createDecisionRequestId(),
            expectedVersion: row.approvalVersion,
            approvalReason: decisionReason.value || undefined,
        };
        if (decisionAction.value === 'approve') await approveRefund(row.approvalId, payload);
        else await rejectRefund(row.approvalId, payload);
        ElMessage.success(t('common.success'));
        decisionVisible.value = false;
        await loadData();
    } finally {
        decisionLoading.value = false;
    }
}

function createDecisionRequestId() {
    return globalThis.crypto?.randomUUID?.() || `DEC-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function approvalTagType(status?: string) {
    if (status === 'APPROVED' || status === 'NOT_REQUIRED' || status === 'NOT_APPLICABLE') return 'success';
    if (status === 'PENDING') return 'warning';
    if (status === 'REJECTED' || status === 'EXPIRED') return 'danger';
    return 'info';
}

function failureText(row: RefundManagementRecord) {
    return [row.failReasonCode, row.failReasonMessage].filter(Boolean).join(' / ') || '-';
}

function emptySummary(): RefundManagementSummary {
    return { totalCount: 0, pendingApprovalCount: 0, processingCount: 0, successCount: 0, failedOrRejectedCount: 0, currencyAmounts: [] };
}
</script>

<style scoped>
.refund-page__toolbar-actions {
    display: flex;
    justify-content: flex-end;
}

.refund-page__section-title {
    margin: 18px 0 8px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
}

.refund-page__section-title:first-child {
    margin-top: 0;
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

@media (max-width: 760px) {
    .transaction-table-toolbar {
        gap: 8px;
    }
}
</style>
