<template>
    <div class="app-container transaction-page clearing-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.clearing.searchTitle')"
            :description="t('transaction.clearing.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="104px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.clearing.clearingStatus')">
                <el-select v-model="query.clearingStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in clearingStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter
                        v-model="dateRange"
                        v-model:time-zone="query.queryTimeZone"
                        v-model:preset="quickPreset"
                        :timezone-options="timezoneOptions"
                        default-preset="today"
                    />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <div v-hasPermi="'clearing:record:recalculate'" class="clearing-page__batch-bar">
            <el-button
                type="success"
                plain
                size="small"
                :icon="Refresh"
                :disabled="selectedRows.length < 2"
                @click="openBatchRecalculate"
            >
                {{ t('transaction.clearing.batchRecalculate') }}
            </el-button>
            <span class="clearing-page__selection-count">
                {{ t('transaction.clearing.selectedCount', { count: selectedRows.length }) }}
            </span>
            <span class="clearing-page__selection-hint">
                {{ t('transaction.clearing.batchSelectionHint', { max: MAX_RECALCULATION_BATCH_SIZE }) }}
            </span>
        </div>

        <StandardTable
            table-key="transaction-clearing-records"
            v-loading="loading"
            :data="rows"
            row-key="financeStateId"
            size="small"
            class="transaction-page__table"
            @selection-change="handleSelectionChange"
        >
            <el-table-column type="selection" width="46" fixed="left" :selectable="canSelectForBatch" />
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="210" fixed="left" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="130" align="center" />
            <el-table-column :label="t('transaction.fields.transactionType')" min-width="136" align="center">
                <template #default="{ row }">{{ transactionTypeText(row.transactionType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.clearingStatus')" width="128" align="center">
                <template #default="{ row }">
                    <el-tag size="small" :type="clearingStatusTagType(row.clearingStatus)" effect="plain">
                        {{ clearingStatusText(row.clearingStatus) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.revision')" width="88" align="center">
                <template #default="{ row }">v{{ row.clearingRevision || 0 }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.transactionLabelAmount')" min-width="148" align="right">
                <template #default="{ row }"><span class="clearing-page__money">{{ exactMoney(row.labelAmount, row.labelCurrency) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.grossAmount')" min-width="148" align="right">
                <template #default="{ row }"><span class="clearing-page__money">{{ exactMoney(row.grossLabelAmount, row.labelCurrency) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.platformFee')" min-width="148" align="right">
                <template #default="{ row }"><span class="clearing-page__money">{{ exactMoney(row.platformFeeAmount, row.labelCurrency) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.reserveAmount')" min-width="148" align="right">
                <template #default="{ row }"><span class="clearing-page__money">{{ exactMoney(row.reserveAmount, row.labelCurrency) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.settlementStatus')" min-width="132" align="center">
                <template #default="{ row }">{{ settlementStatusText(row.settlementStatus) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.clearing.retryCount')" width="92" align="center">
                <template #default="{ row }">{{ row.clearingRetryCount || 0 }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" /></template>
            </el-table-column>
            <el-table-column v-if="showOperationColumn" :label="t('common.operation')" width="292" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'clearing:record:detail'" link type="primary" @click="openDetail(row)">
                        {{ t('common.detail') }}
                    </el-button>
                    <el-tooltip :disabled="canRetry(row)" :content="t('transaction.clearing.retryDisabled')">
                        <span v-hasPermi="'clearing:record:retry'">
                            <el-button link type="warning" :disabled="!canRetry(row)" @click="openAction('retry', row)">
                                {{ t('transaction.clearing.retry') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-tooltip :disabled="canReview(row)" :content="t('transaction.clearing.reviewDisabled')">
                        <span v-hasPermi="'clearing:record:review'">
                            <el-button link type="danger" :disabled="!canReview(row)" @click="openAction('review', row)">
                                {{ t('transaction.clearing.review') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-tooltip :disabled="canRecalculate(row)" :content="t('transaction.clearing.recalculateDisabled')">
                        <span v-hasPermi="'clearing:record:recalculate'">
                            <el-button link type="success" :disabled="!canRecalculate(row)" @click="openAction('recalculate', row)">
                                {{ t('transaction.clearing.recalculate') }}
                            </el-button>
                        </span>
                    </el-tooltip>
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
                @size-change="handlePageSizeChange"
                @current-change="loadData"
            />
        </div>

        <el-drawer v-model="detailVisible" :title="t('transaction.clearing.detailTitle')" size="92%" destroy-on-close>
            <div v-loading="detailLoading" class="clearing-detail">
                <template v-if="detail?.summary">
                    <div class="clearing-detail__identity">
                        <div>
                            <span>{{ t('transaction.fields.transactionId') }}</span>
                            <CopyableText :value="detail.summary.transactionId" :label="t('transaction.fields.transactionId')" />
                        </div>
                        <el-tag :type="clearingStatusTagType(detail.summary.clearingStatus)" effect="plain">
                            {{ clearingStatusText(detail.summary.clearingStatus) }}
                        </el-tag>
                    </div>

                    <el-descriptions :column="4" border size="small" class="clearing-detail__summary">
                        <el-descriptions-item :label="t('transaction.fields.merchantId')">{{ detail.summary.merchantId || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionType')">{{ transactionTypeText(detail.summary.transactionType) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.financeStateId')">{{ detail.summary.financeStateId || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.revision')">v{{ detail.summary.clearingRevision || 0 }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.feePlan')">{{ feePlanText(detail.summary) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.transactionLabelAmount')">{{ exactMoney(detail.summary.labelAmount, detail.summary.labelCurrency) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.grossAmount')">{{ exactMoney(detail.summary.grossLabelAmount, detail.summary.labelCurrency) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.platformFee')">{{ exactMoney(detail.summary.platformFeeAmount, detail.summary.labelCurrency) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.reserveAmount')">{{ exactMoney(detail.summary.reserveAmount, detail.summary.labelCurrency) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.settlementStatus')">{{ settlementStatusText(detail.summary.settlementStatus) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.settlementEligibleDate')">{{ detail.summary.settlementEligibleDate || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.clearing.nextRetryTime')"><BaseDateTime :value="detail.summary.nextRetryTime" /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionDateTime')"><BaseDateTime :value="detail.summary.transactionDateTime" /></el-descriptions-item>
                    </el-descriptions>

                    <el-alert
                        v-if="detail.summary.lastFailureCode || detail.summary.lastFailureMessage"
                        type="warning"
                        :closable="false"
                        show-icon
                        class="clearing-detail__failure"
                        :title="detail.summary.lastFailureCode || t('transaction.clearing.lastFailure')"
                        :description="detail.summary.lastFailureMessage || '-'"
                    />

                    <section class="clearing-ledger clearing-ledger--transaction">
                        <div class="clearing-ledger__heading">
                            <div>
                                <span class="clearing-ledger__marker"></span>
                                <strong>{{ t('transaction.clearing.transactionLedger') }}</strong>
                            </div>
                            <el-tag size="small" type="primary" effect="plain">{{ detail.transactionDetails?.length || 0 }}</el-tag>
                        </div>
                        <el-table :data="detail.transactionDetails || []" border size="small" empty-text="-">
                            <el-table-column type="expand" width="42">
                                <template #default="{ row }">
                                    <div class="clearing-ledger__formula">
                                        <span>{{ t('transaction.clearing.formulaSnapshot') }}</span>
                                        <pre>{{ row.formulaSnapshot || '-' }}</pre>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="lineNo" :label="t('transaction.clearing.lineNo')" width="68" align="center" />
                            <el-table-column :label="t('transaction.clearing.feeItem')" min-width="180">
                                <template #default="{ row }">
                                    <div class="clearing-ledger__item"><strong>{{ clearingItemName(row) }}</strong><span>{{ row.itemCode || '-' }}</span></div>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="138" align="center">
                                <template #default="{ row }">{{ feeCategoryText(row) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="94" align="center">
                                <template #default="{ row }">{{ directionText(row.direction) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.calculationBasis')" min-width="154" align="right">
                                <template #default="{ row }">{{ exactMoney(row.basisAmount, row.basisCurrency) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.feeTerms')" min-width="230">
                                <template #default="{ row }">
                                    <div class="clearing-ledger__terms">
                                        <span v-if="hasValue(row.percentageRate)">{{ t('transaction.clearing.percentageRate') }} {{ percentageText(row.percentageRate) }}</span>
                                        <span v-if="hasValue(row.fixedAmountUsd)">{{ t('transaction.clearing.fixedAmountUsd') }} {{ exactMoney(row.fixedAmountUsd, 'USD') }}</span>
                                        <span v-if="hasValue(row.minimumAmountUsd)">{{ t('transaction.clearing.minimumAmountUsd') }} {{ exactMoney(row.minimumAmountUsd, 'USD') }}</span>
                                        <span v-if="hasValue(row.maximumAmountUsd)">{{ t('transaction.clearing.maximumAmountUsd') }} {{ exactMoney(row.maximumAmountUsd, 'USD') }}</span>
                                        <span v-if="row.appliedLimit">{{ t('transaction.clearing.appliedLimit') }} {{ appliedLimitText(row.appliedLimit) }}</span>
                                        <span v-if="!hasFeeTerms(row)">-</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.clearingAmount')" min-width="154" align="right">
                                <template #default="{ row }"><strong class="clearing-page__money">{{ exactMoney(row.amount, row.currency) }}</strong></template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.recordStatus')" width="126" align="center">
                                <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                            </el-table-column>
                        </el-table>
                    </section>

                    <section class="clearing-ledger clearing-ledger--reserve">
                        <div class="clearing-ledger__heading">
                            <div>
                                <span class="clearing-ledger__marker"></span>
                                <strong>{{ t('transaction.clearing.reserveLedger') }}</strong>
                            </div>
                            <el-tag size="small" type="warning" effect="plain">{{ detail.reserveDetails?.length || 0 }}</el-tag>
                        </div>
                        <el-table :data="detail.reserveDetails || []" border size="small" empty-text="-">
                            <el-table-column type="expand" width="42">
                                <template #default="{ row }">
                                    <div class="clearing-ledger__formula">
                                        <span>{{ t('transaction.clearing.formulaSnapshot') }}</span>
                                        <pre>{{ row.formulaSnapshot || '-' }}</pre>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="lineNo" :label="t('transaction.clearing.lineNo')" width="68" align="center" />
                            <el-table-column :label="t('transaction.clearing.reserveAction')" min-width="136" align="center">
                                <template #default="{ row }">{{ reserveItemName(row.reserveActionType, row.itemName) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="94" align="center">
                                <template #default="{ row }">{{ directionText(row.direction) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.calculationBasis')" min-width="154" align="right">
                                <template #default="{ row }">{{ exactMoney(row.basisAmount, row.reserveCurrency) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.reserveRate')" min-width="108" align="right">
                                <template #default="{ row }">{{ percentageText(row.reserveRate) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.retainedAmount')" min-width="142" align="right">
                                <template #default="{ row }">{{ exactMoney(row.retainedAmount, row.reserveCurrency) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.returnedAmount')" min-width="142" align="right">
                                <template #default="{ row }">{{ exactMoney(row.returnedAmount, row.reserveCurrency) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.remainingAmount')" min-width="142" align="right">
                                <template #default="{ row }"><strong class="clearing-page__money">{{ exactMoney(row.remainingAmount, row.reserveCurrency) }}</strong></template>
                            </el-table-column>
                            <el-table-column prop="expectedReserveReleaseDate" :label="t('transaction.clearing.expectedReleaseDate')" min-width="144" align="center" />
                            <el-table-column :label="t('transaction.clearing.recordStatus')" width="126" align="center">
                                <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                            </el-table-column>
                        </el-table>
                    </section>
                </template>
                <el-empty v-else-if="!detailLoading" :description="t('transaction.clearing.detailEmpty')" />
            </div>
        </el-drawer>

        <el-dialog v-model="actionVisible" :title="actionTitle" width="660px" destroy-on-close @closed="resetActionForm">
            <template v-if="actionTargets.length">
                <div class="clearing-action__context">
                    <span>{{ actionContextLabel }}</span>
                    <strong>{{ actionContextValue }}</strong>
                    <el-tag v-if="selectedRow && !isBatchAction" size="small" :type="clearingStatusTagType(selectedRow.clearingStatus)" effect="plain">
                        {{ clearingStatusText(selectedRow.clearingStatus) }}
                    </el-tag>
                    <el-tag v-else size="small" type="info" effect="plain">
                        {{ t('transaction.clearing.selectedCount', { count: actionTargets.length }) }}
                    </el-tag>
                </div>
                <el-alert :title="actionNotice" type="warning" :closable="false" show-icon class="clearing-action__notice" />
                <el-form label-position="top" size="small">
                    <div v-if="actionType === 'recalculate'" class="clearing-action__version-grid">
                        <el-form-item v-if="!isBatchAction" :label="t('transaction.clearing.currentRevision')">
                            <el-input :model-value="selectedRow?.clearingRevision" disabled />
                        </el-form-item>
                        <el-form-item v-if="!isBatchAction" :label="t('transaction.clearing.currentVersion')">
                            <el-input :model-value="selectedRow?.version" disabled />
                        </el-form-item>
                        <el-form-item :label="t('transaction.clearing.targetFeePlan')" required>
                            <div v-loading="recalculationOptionsLoading" class="clearing-action__readonly-field">
                                <strong :title="recalculationPlanName">{{ recalculationPlanName }}</strong>
                                <span v-if="recalculationPlanCode" :title="recalculationPlanCode">{{ recalculationPlanCode }}</span>
                            </div>
                        </el-form-item>
                        <el-form-item :label="t('transaction.clearing.targetFeeVersion')" required>
                            <el-select
                                v-model="actionForm.targetFeePlanVersionId"
                                :loading="recalculationOptionsLoading"
                                :disabled="recalculationOptionsLoading || !recalculationVersionOptions.length"
                                :placeholder="t('common.pleaseSelect')"
                                class="clearing-action__version-select"
                            >
                                <el-option
                                    v-for="option in recalculationVersionOptions"
                                    :key="option.versionId"
                                    :label="versionOptionText(option)"
                                    :value="option.versionId"
                                />
                            </el-select>
                        </el-form-item>
                        <el-alert
                            v-if="!recalculationOptionsLoading && !recalculationVersionOptions.length"
                            class="clearing-action__version-empty"
                            type="info"
                            :closable="false"
                            show-icon
                            :title="t('transaction.clearing.noImmutableVersions')"
                        />
                    </div>
                    <el-form-item :label="t('transaction.clearing.reason')" required>
                        <el-input
                            v-model="actionForm.reason"
                            type="textarea"
                            :rows="4"
                            maxlength="400"
                            show-word-limit
                            :placeholder="t('transaction.clearing.reasonPlaceholder')"
                        />
                    </el-form-item>
                </el-form>
            </template>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionLoading" :disabled="actionConfirmDisabled" @click="submitAction">
                        {{ t('common.confirm') }}
                    </el-button>
                    <el-button @click="actionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="batchResultVisible" :title="t('transaction.clearing.batchResultTitle')" width="820px" destroy-on-close>
            <template v-if="batchResult">
                <div class="clearing-batch-result__summary">
                    <div><span>{{ t('transaction.clearing.batchRequested') }}</span><strong>{{ batchResult.requestedCount }}</strong></div>
                    <div><span>{{ t('transaction.clearing.batchSuccess') }}</span><strong class="is-success">{{ batchResult.successCount }}</strong></div>
                    <div><span>{{ t('transaction.clearing.batchFailure') }}</span><strong class="is-failure">{{ batchResult.failureCount }}</strong></div>
                </div>
                <el-table :data="batchResult.results" border size="small" max-height="420">
                    <el-table-column :label="t('transaction.fields.transactionId')" min-width="210" show-overflow-tooltip>
                        <template #default="{ row }"><CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" /></template>
                    </el-table-column>
                    <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="168" align="center">
                        <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" /></template>
                    </el-table-column>
                    <el-table-column :label="t('transaction.clearing.result')" width="118" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.success ? 'success' : 'danger'" size="small" effect="plain">
                                {{ row.success ? t('transaction.clearing.batchSuccess') : t('transaction.clearing.batchFailure') }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('transaction.clearing.resultMessage')" min-width="220" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.message || row.result || '-' }}</template>
                    </el-table-column>
                </el-table>
            </template>
            <template #footer>
                <el-button type="primary" @click="batchResultVisible = false">{{ t('common.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue';
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    batchRecalculateClearingRecords,
    getClearingRecordDetail,
    getClearingRecalculationOptions,
    recalculateClearingRecord,
    retryClearingRecord,
    reviewClearingRecord,
    searchClearingRecords,
    type ClearingBatchRecalculateResponse,
    type ClearingRecordDetail,
    type ClearingRecordSummary,
    type ClearingRecalculationOptions,
    type ClearingRecalculationVersionOption,
    type ClearingTransactionLine,
} from '@/api/transaction';
import { useUserStore } from '@/store/modules/user';
import CopyableText from '@/views/transaction/components/CopyableText.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import TransactionResultBar from '@/views/transaction/components/TransactionResultBar.vue';
import TransactionSearchPanel from '@/views/transaction/components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '@/views/transaction/components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    resolveTransactionQueryRange,
    splitDateRange,
} from '@/views/transaction/shared';

type ActionType = 'retry' | 'review' | 'recalculate';

const MAX_RECALCULATION_BATCH_SIZE = 20;
const RETRYABLE_STATUSES = new Set(['PENDING', 'FAILED', 'WAITING_SOURCE', 'MANUAL_REVIEW']);
const TERMINAL_STATUSES = new Set(['CLEARED', 'NOT_REQUIRED']);
const { t } = useI18n();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ClearingRecordSummary[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const quickPreset = ref('today');
const dateRange = ref(defaultTransactionTodayRange());
const timezoneOptions = ensureTransactionTimezoneOptions([]);
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<ClearingRecordDetail | null>(null);
const actionVisible = ref(false);
const actionLoading = ref(false);
const actionType = ref<ActionType>('retry');
const selectedRow = ref<ClearingRecordSummary | null>(null);
const selectedRows = ref<ClearingRecordSummary[]>([]);
const actionTargets = ref<ClearingRecordSummary[]>([]);
const recalculationOptionsLoading = ref(false);
const recalculationOptions = ref<ClearingRecalculationOptions | null>(null);
const batchResultVisible = ref(false);
const batchResult = ref<ClearingBatchRecalculateResponse | null>(null);
let recalculationOptionsRequestId = 0;
const query = reactive({
    merchantId: '',
    transactionId: '',
    clearingStatus: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const actionForm = reactive<{
    reason: string;
    targetFeePlanId?: number;
    targetFeePlanVersionId?: number;
}>({
    reason: '',
    targetFeePlanId: undefined,
    targetFeePlanVersionId: undefined,
});

const clearingStatusOptions = computed(() => [
    'NOT_CLEARED', 'PENDING', 'PROCESSING', 'WAITING_SOURCE',
    'FAILED', 'MANUAL_REVIEW', 'CLEARED', 'NOT_REQUIRED',
].map((value) => ({ value, label: t(`transaction.clearing.status.${value}`) })));

const summaryItems = computed(() => {
    const cleared = rows.value.filter((row) => TERMINAL_STATUSES.has(row.clearingStatus)).length;
    const failed = rows.value.filter((row) => ['FAILED', 'WAITING_SOURCE'].includes(row.clearingStatus)).length;
    const manualReview = rows.value.filter((row) => row.clearingStatus === 'MANUAL_REVIEW').length;
    return [
        { key: 'loaded', label: t('transaction.clearing.summary.loaded'), value: total.value, description: t('transaction.clearing.summary.loadedDescription') },
        { key: 'cleared', label: t('transaction.clearing.summary.cleared'), value: cleared, description: t('transaction.clearing.summary.clearedDescription'), tone: 'success' as const },
        { key: 'failed', label: t('transaction.clearing.summary.failed'), value: failed, description: t('transaction.clearing.summary.failedDescription'), tone: 'danger' as const },
        { key: 'manual', label: t('transaction.clearing.summary.manualReview'), value: manualReview, description: t('transaction.clearing.summary.manualReviewDescription') },
    ];
});

const showOperationColumn = computed(() => [
    'clearing:record:detail',
    'clearing:record:retry',
    'clearing:record:review',
    'clearing:record:recalculate',
].some((permission) => userStore.hasPermission(permission)));

const isBatchAction = computed(() => actionTargets.value.length > 1);
const actionTitle = computed(() => t(`transaction.clearing.${isBatchAction.value ? 'batchRecalculate' : actionType.value}Title`));
const actionNotice = computed(() => t(`transaction.clearing.${isBatchAction.value ? 'batchRecalculate' : actionType.value}Notice`));
const actionContextLabel = computed(() => isBatchAction.value
    ? t('transaction.clearing.recalculationScope')
    : t('transaction.fields.transactionId'));
const actionContextValue = computed(() => isBatchAction.value
    ? batchScopeText(actionTargets.value)
    : selectedRow.value?.transactionId || '-');
const recalculationVersionOptions = computed(() => recalculationOptions.value?.versions || []);
const recalculationPlanName = computed(() => recalculationOptions.value?.planName
    || selectedRow.value?.feePlanId?.toString()
    || '-');
const recalculationPlanCode = computed(() => recalculationOptions.value?.planCode || '');
const actionConfirmDisabled = computed(() => actionType.value === 'recalculate'
    && (recalculationOptionsLoading.value
        || !actionForm.targetFeePlanId
        || !actionForm.targetFeePlanVersionId));

async function loadData() {
    const resolvedRange = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    if (!isValidQuarterRange(resolvedRange)) {
        ElMessage.warning(t('transaction.clearing.quarterRangeRequired'));
        return;
    }
    dateRange.value = resolvedRange;
    loading.value = true;
    try {
        const result = await searchClearingRecords({
            merchantId: query.merchantId || undefined,
            transactionId: query.transactionId || undefined,
            clearingStatus: query.clearingStatus || undefined,
            ...splitDateRange(resolvedRange) as { beginTime: string; endTime: string },
            pageNo: page.value,
            pageSize: pageSize.value,
        });
        rows.value = result.records || [];
        total.value = result.total || 0;
        selectedRows.value = [];
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
    query.clearingStatus = '';
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(query.queryTimeZone);
    page.value = 1;
    loadData();
}

async function openDetail(row: ClearingRecordSummary) {
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = null;
    try {
        detail.value = await getClearingRecordDetail(row.transactionId, row.transactionDateTime);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.clearing.detailLoadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

function openAction(type: ActionType, row: ClearingRecordSummary) {
    actionType.value = type;
    actionTargets.value = [{ ...row }];
    selectedRow.value = actionTargets.value[0];
    actionForm.reason = '';
    actionForm.targetFeePlanId = undefined;
    actionForm.targetFeePlanVersionId = undefined;
    recalculationOptions.value = null;
    actionVisible.value = true;
    if (type === 'recalculate') {
        void loadRecalculationOptions(actionTargets.value);
    }
}

function openBatchRecalculate() {
    const targets = selectedRows.value.map((row) => ({ ...row }));
    if (!isValidBatchScope(targets)) {
        ElMessage.warning(t('transaction.clearing.batchScopeRequired', { max: MAX_RECALCULATION_BATCH_SIZE }));
        return;
    }
    actionType.value = 'recalculate';
    actionTargets.value = targets;
    selectedRow.value = targets[0];
    actionForm.reason = '';
    actionForm.targetFeePlanId = undefined;
    actionForm.targetFeePlanVersionId = undefined;
    recalculationOptions.value = null;
    actionVisible.value = true;
    void loadRecalculationOptions(targets);
}

async function loadRecalculationOptions(targets: ClearingRecordSummary[]) {
    const anchor = targets[0];
    if (!anchor?.merchantId || !anchor.feePlanId) {
        ElMessage.error(t('transaction.clearing.optionsLoadFailed'));
        return;
    }
    const requestId = ++recalculationOptionsRequestId;
    recalculationOptionsLoading.value = true;
    try {
        const result = await getClearingRecalculationOptions(anchor.merchantId, anchor.feePlanId);
        if (requestId !== recalculationOptionsRequestId) return;
        recalculationOptions.value = result;
        actionForm.targetFeePlanId = result.feePlanId;
        const availableIds = new Set(result.versions.map((option) => option.versionId));
        const preferredVersionId = availableIds.has(anchor.feePlanVersionId || 0)
            ? anchor.feePlanVersionId
            : availableIds.has(result.currentVersionId || 0)
                ? result.currentVersionId
                : result.versions[0]?.versionId;
        actionForm.targetFeePlanVersionId = preferredVersionId;
    } catch (error: unknown) {
        if (requestId !== recalculationOptionsRequestId) return;
        recalculationOptions.value = null;
        actionForm.targetFeePlanId = undefined;
        actionForm.targetFeePlanVersionId = undefined;
        ElMessage.error(actionErrorMessage(error, 'optionsLoadFailed'));
    } finally {
        if (requestId === recalculationOptionsRequestId) {
            recalculationOptionsLoading.value = false;
        }
    }
}

async function submitAction() {
    const row = actionTargets.value[0];
    const reason = actionForm.reason.trim();
    if (!row || !reason) {
        ElMessage.warning(t('transaction.clearing.reasonRequired'));
        return;
    }
    if (actionType.value === 'recalculate'
        && (!actionForm.targetFeePlanId || !actionForm.targetFeePlanVersionId)) {
        ElMessage.warning(t('transaction.clearing.targetFeeVersionRequired'));
        return;
    }
    actionLoading.value = true;
    try {
        if (isBatchAction.value) {
            const result = await batchRecalculateClearingRecords({
                records: actionTargets.value.map((target) => ({
                    transactionId: target.transactionId,
                    transactionDateTime: target.transactionDateTime,
                    expectedVersion: target.version,
                    expectedClearingRevision: target.clearingRevision,
                })),
                targetFeePlanId: actionForm.targetFeePlanId!,
                targetFeePlanVersionId: actionForm.targetFeePlanVersionId!,
                reason,
            });
            batchResult.value = result;
            batchResultVisible.value = true;
            ElMessage.success(t('transaction.clearing.batchActionCompleted', {
                success: result.successCount,
                failure: result.failureCount,
            }));
            actionVisible.value = false;
            await loadData();
            return;
        }
        const base = {
            transactionDateTime: row.transactionDateTime,
            expectedVersion: row.version,
            reason,
        };
        const result = actionType.value === 'retry'
            ? await retryClearingRecord(row.transactionId, base)
            : actionType.value === 'review'
                ? await reviewClearingRecord(row.transactionId, base)
                : await recalculateClearingRecord(row.transactionId, {
                    ...base,
                    expectedClearingRevision: row.clearingRevision,
                    targetFeePlanId: actionForm.targetFeePlanId!,
                    targetFeePlanVersionId: actionForm.targetFeePlanVersionId!,
                });
        ElMessage.success(t('transaction.clearing.actionAccepted', { result: result.result }));
        actionVisible.value = false;
        await loadData();
    } catch (error: unknown) {
        ElMessage.error(actionErrorMessage(error, 'actionFailed'));
    } finally {
        actionLoading.value = false;
    }
}

function resetActionForm() {
    recalculationOptionsRequestId += 1;
    selectedRow.value = null;
    actionTargets.value = [];
    recalculationOptions.value = null;
    recalculationOptionsLoading.value = false;
    actionForm.reason = '';
    actionForm.targetFeePlanId = undefined;
    actionForm.targetFeePlanVersionId = undefined;
}

function canRetry(row: ClearingRecordSummary) {
    return RETRYABLE_STATUSES.has(row.clearingStatus);
}

function canReview(row: ClearingRecordSummary) {
    return !TERMINAL_STATUSES.has(row.clearingStatus) && row.clearingStatus !== 'MANUAL_REVIEW';
}

function canRecalculate(row: ClearingRecordSummary) {
    return TERMINAL_STATUSES.has(row.clearingStatus)
        && row.settlementStatus === 'NOT_SETTLED'
        && row.clearingRevision >= 1;
}

function handleSelectionChange(selection: ClearingRecordSummary[]) {
    selectedRows.value = selection.slice(0, MAX_RECALCULATION_BATCH_SIZE);
}

function canSelectForBatch(row: ClearingRecordSummary) {
    if (!canRecalculate(row) || !row.feePlanId) return false;
    const selected = selectedRows.value.some((item) => item.financeStateId === row.financeStateId);
    if (!selected && selectedRows.value.length >= MAX_RECALCULATION_BATCH_SIZE) return false;
    const anchor = selectedRows.value[0];
    return !anchor || selected
        || (anchor.merchantId === row.merchantId && anchor.feePlanId === row.feePlanId);
}

function isValidBatchScope(targets: ClearingRecordSummary[]) {
    if (targets.length < 2 || targets.length > MAX_RECALCULATION_BATCH_SIZE) return false;
    const anchor = targets[0];
    return Boolean(anchor?.feePlanId) && targets.every((row) => canRecalculate(row)
        && row.merchantId === anchor?.merchantId
        && row.feePlanId === anchor?.feePlanId);
}

function batchScopeText(targets: ClearingRecordSummary[]) {
    const anchor = targets[0];
    if (!anchor) return '-';
    return `${anchor.merchantId} / ${recalculationPlanName.value}`;
}

function clearingStatusText(value?: string) {
    return value ? t(`transaction.clearing.status.${value}`, value) : '-';
}

function clearingStatusTagType(value?: string) {
    if (TERMINAL_STATUSES.has(value || '')) return 'success';
    if (value === 'MANUAL_REVIEW' || value === 'WAITING_SOURCE') return 'warning';
    if (value === 'FAILED') return 'danger';
    if (value === 'PROCESSING') return 'primary';
    return 'info';
}

function transactionTypeText(value?: string) {
    return value ? t(`transaction.type.${value}`, value) : '-';
}

function settlementStatusText(value?: string) {
    return value ? t(`transaction.statusOption.${value}`, value) : '-';
}

function feeCategoryText(row: ClearingTransactionLine) {
    const value = row.feeCategory || (row.itemType === 'PRINCIPAL' ? 'PRINCIPAL' : '');
    return value ? t(`transaction.clearing.feeCategoryValue.${value}`, value) : '-';
}

function directionText(value?: string) {
    return value ? t(`transaction.clearing.directionValue.${value}`, value) : '-';
}

function appliedLimitText(value?: string) {
    return value ? t(`transaction.clearing.appliedLimitValue.${value}`, value) : '-';
}

function recordStatusText(value?: string) {
    return value ? t(`transaction.clearing.recordStatusValue.${value}`, value) : '-';
}

function clearingItemName(row: ClearingTransactionLine) {
    let code = row.itemType;
    if (row.itemType === 'PLATFORM_FEE') {
        code = row.feeCategory === 'RISK_FEE'
            ? `RISK_FEE_${row.riskServiceType || 'UNKNOWN'}`
            : row.feeCategory;
    }
    return code
        ? t(`transaction.clearing.itemName.${code}`, row.itemName || code)
        : row.itemName || row.itemCode || '-';
}

function reserveItemName(action?: string, fallback?: string) {
    return action ? t(`transaction.clearing.itemName.RESERVE_${action}`, fallback || action) : fallback || '-';
}

function exactMoney(amount?: number | string | null, currency?: string) {
    if (!hasValue(amount)) return '-';
    return `${currency || ''} ${decimalText(amount)}`.trim();
}

function decimalText(value?: number | string | null) {
    if (!hasValue(value)) return '-';
    const text = String(value);
    const match = /^([+-]?)(\d+)(\.\d+)?$/.exec(text);
    if (!match) return text;
    return `${match[1]}${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${match[3] || ''}`;
}

function percentageText(value?: number | string | null) {
    return hasValue(value) ? `${decimalText(value)}%` : '-';
}

function versionOptionText(option: ClearingRecalculationVersionOption) {
    return t('transaction.clearing.versionOption', {
        version: option.versionNo,
        status: t(`transaction.clearing.versionStatus.${option.versionStatus}`, option.versionStatus),
    });
}

function actionErrorMessage(error: unknown, fallbackKey: 'actionFailed' | 'optionsLoadFailed') {
    const value = error as { friendlyMessage?: string; message?: string } | null;
    return value?.friendlyMessage || value?.message || t(`transaction.clearing.${fallbackKey}`);
}

function hasValue(value: unknown): value is number | string {
    return value !== undefined && value !== null && value !== '';
}

function hasFeeTerms(row: ClearingTransactionLine) {
    return hasValue(row.percentageRate) || hasValue(row.fixedAmountUsd)
        || hasValue(row.minimumAmountUsd) || hasValue(row.maximumAmountUsd) || Boolean(row.appliedLimit);
}

function feePlanText(row: ClearingRecordSummary) {
    if (!row.feePlanId && !row.feePlanVersionId) return '-';
    return `${row.feePlanId || '-'} / ${row.feePlanVersionId || '-'} (v${row.feePlanVersionNo || '-'})`;
}

function handlePageSizeChange() {
    page.value = 1;
    loadData();
}

function isValidQuarterRange(range: string[]) {
    if (!range?.[0] || !range?.[1]) return false;
    const begin = new Date(range[0]);
    const endExclusive = new Date(range[1]);
    if (!Number.isFinite(begin.getTime()) || !Number.isFinite(endExclusive.getTime()) || begin >= endExclusive) return false;
    endExclusive.setMilliseconds(endExclusive.getMilliseconds() - 1);
    return quarterKey(begin) === quarterKey(endExclusive);
}

function quarterKey(value: Date) {
    return value.getFullYear() * 10 + Math.floor(value.getMonth() / 3) + 1;
}

onMounted(loadData);
</script>

<style scoped>
.clearing-page__money {
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
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

.clearing-page__batch-bar {
    display: flex;
    align-items: center;
    min-height: 38px;
    gap: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 6px 10px;
    background: var(--el-fill-color-blank);
}

.clearing-page__selection-count {
    color: var(--el-text-color-primary);
    font-size: 12px;
    font-weight: 600;
}

.clearing-page__selection-hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.clearing-detail {
    min-height: 280px;
}

.clearing-detail__identity {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
    border-left: 4px solid #3b82f6;
    padding: 10px 14px;
    background: #f7f9fc;
}

.clearing-detail__identity > div {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 10px;
}

.clearing-detail__identity span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.clearing-detail__summary :deep(.el-descriptions__label) {
    width: 138px;
}

.clearing-detail__failure {
    margin-top: 12px;
}

.clearing-ledger {
    margin-top: 20px;
}

.clearing-ledger__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 8px;
}

.clearing-ledger__heading > div {
    display: flex;
    align-items: center;
    gap: 9px;
}

.clearing-ledger__marker {
    width: 4px;
    height: 17px;
    border-radius: 2px;
    background: #2563eb;
}

.clearing-ledger--reserve .clearing-ledger__marker {
    background: #d97706;
}

.clearing-ledger__item,
.clearing-ledger__terms {
    display: grid;
    gap: 3px;
}

.clearing-ledger__item span,
.clearing-ledger__terms span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 17px;
}

.clearing-ledger__formula {
    padding: 10px 16px;
}

.clearing-ledger__formula > span {
    display: block;
    margin-bottom: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.clearing-ledger__formula pre {
    max-height: 180px;
    margin: 0;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
}

.clearing-action__context {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    border-left: 4px solid #d97706;
    padding: 10px 12px;
    background: #fff9ed;
}

.clearing-action__context > span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.clearing-action__context strong {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.clearing-action__notice {
    margin-bottom: 14px;
}

.clearing-action__version-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 14px;
}

.clearing-action__version-grid :deep(.el-input-number) {
    width: 100%;
}

.clearing-action__readonly-field {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    width: 100%;
    min-height: 48px;
    gap: 2px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    box-sizing: border-box;
    padding: 6px 10px;
    background: var(--el-fill-color-light);
}

.clearing-action__readonly-field strong {
    min-width: 0;
    overflow-wrap: anywhere;
    line-height: 18px;
}

.clearing-action__readonly-field span {
    display: block;
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 16px;
}

.clearing-action__version-select {
    width: 100%;
}

.clearing-action__version-empty {
    grid-column: 1 / -1;
    margin-bottom: 14px;
}

.clearing-batch-result__summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 14px;
    border: 1px solid var(--el-border-color-lighter);
}

.clearing-batch-result__summary > div {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
}

.clearing-batch-result__summary > div + div {
    border-left: 1px solid var(--el-border-color-lighter);
}

.clearing-batch-result__summary span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.clearing-batch-result__summary strong {
    font-size: 18px;
    font-variant-numeric: tabular-nums;
}

.clearing-batch-result__summary .is-success {
    color: var(--el-color-success);
}

.clearing-batch-result__summary .is-failure {
    color: var(--el-color-danger);
}

@media (max-width: 900px) {
    .clearing-detail__summary :deep(.el-descriptions__body .el-descriptions__table) {
        table-layout: auto;
    }
}

@media (max-width: 640px) {
    .clearing-action__version-grid {
        grid-template-columns: 1fr;
    }

    .clearing-detail__identity {
        align-items: flex-start;
        flex-direction: column;
    }

    .clearing-page__batch-bar {
        align-items: flex-start;
        flex-wrap: wrap;
    }

    .clearing-page__selection-hint {
        flex-basis: 100%;
    }

    .clearing-batch-result__summary {
        grid-template-columns: 1fr;
    }

    .clearing-batch-result__summary > div + div {
        border-top: 1px solid var(--el-border-color-lighter);
        border-left: 0;
    }
}
</style>
