<!-- Admin settlement review page: paginated snapshots and resumable Maker-Checker decisions. -->
<template>
    <div class="app-container settlement-list-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.reviewOrderNo')">
                <el-input v-model.trim="query.reviewOrderNo" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.reviewType')">
                <el-select v-model="query.reviewType" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option v-for="item in reviewTypes" :key="item" :label="typeText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.reviewStatus" clearable :placeholder="t('common.pleaseSelect')">
                    <el-option v-for="item in reviewStatuses" :key="item" :label="statusText(item)" :value="item" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.settlement.businessDate')">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                    :clearable="false"
                    :range-separator="t('common.to')"
                    :start-placeholder="t('common.startTime')"
                    :end-placeholder="t('common.endTime')"
                />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button
                    v-hasPermi="'settlement:review-order:export'"
                    type="warning"
                    plain
                    :icon="Download"
                    :loading="exporting"
                    @click="handleExport"
                >
                    {{ t('common.export') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-settlement-review-orders" :data="rows" row-key="id" size="small">
            <el-table-column prop="reviewOrderNo" :label="t('transaction.settlement.reviewOrderNo')" min-width="205" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="140" align="center">
                <template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.reviewType')" min-width="150" align="center">
                <template #default="{ row }">{{ typeText(row.reviewType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.createMode')" min-width="148" align="center">
                <template #default="{ row }">{{ createModeText(row.createMode) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.status')" min-width="134" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain" :type="statusTagType(row.reviewStatus)">{{ statusText(row.reviewStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.netAmount')" min-width="164" align="right">
                <template #default="{ row }">{{ moneyTextByExponent(row.netAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template>
            </el-table-column>
            <el-table-column prop="candidateCount" :label="t('transaction.settlement.candidateCount')" width="104" align="center" />
            <el-table-column prop="submittedByAccountName" :label="t('transaction.settlement.submitter')" min-width="126" align="center" />
            <el-table-column prop="decidedByAccountName" :label="t('transaction.settlement.reviewer')" min-width="126" align="center" />
            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="205" align="center" show-overflow-tooltip>
                <template #default="{ row }"><el-button v-if="row.settlementBatchNo" link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button><span v-else>-</span></template>
            </el-table-column>
            <el-table-column prop="businessDate" :label="t('transaction.settlement.businessDate')" width="116" align="center" />
            <el-table-column :label="t('common.createTime')" min-width="174" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.createTime" :source-time-zone="row.businessTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="236" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="'settlement:review-order:detail'" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-tooltip
                        v-if="row.reviewStatus === 'PENDING_APPROVAL'"
                        :disabled="!isReviewMaker(row)"
                        :content="t('transaction.settlement.selfReviewDisabled')"
                    >
                        <span v-hasPermi="'settlement:review-order:approve'">
                            <el-button link type="success" :disabled="isReviewMaker(row)" @click="openDecision('approve', row)">
                                {{ t('transaction.settlement.approve') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-tooltip
                        v-if="row.reviewStatus === 'PENDING_APPROVAL'"
                        :disabled="!isReviewMaker(row)"
                        :content="t('transaction.settlement.selfReviewDisabled')"
                    >
                        <span v-hasPermi="'settlement:review-order:reject'">
                            <el-button link type="danger" :disabled="isReviewMaker(row)" @click="openDecision('reject', row)">
                                {{ t('transaction.settlement.reject') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                    <el-tooltip
                        v-if="row.reviewStatus === 'PENDING_APPROVAL'"
                        :disabled="canCancelReview(row)"
                        :content="t('transaction.settlement.cancelReviewDisabled')"
                    >
                        <span v-hasPermi="'settlement:review-order:cancel'">
                            <el-button link type="warning" :disabled="!canCancelReview(row)" @click="openDecision('cancel', row)">
                                {{ t('transaction.settlement.cancel') }}
                            </el-button>
                        </span>
                    </el-tooltip>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination
                v-model:current-page="query.pageNo"
                v-model:page-size="query.pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @current-change="loadData"
                @size-change="handleSearch"
            />
        </div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.reviewDetail')" size="88%" destroy-on-close>
            <div v-if="detail" v-loading="detailLoading">
                <el-descriptions :column="3" border size="small">
                    <el-descriptions-item :label="t('transaction.settlement.reviewOrderNo')">{{ detail.review.reviewOrderNo }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantId')"><el-button link type="primary" @click="openMerchant(detail.review.merchantId)">{{ detail.review.merchantId }}</el-button></el-descriptions-item>
                    <el-descriptions-item :label="t('common.status')">{{ statusText(detail.review.reviewStatus) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewType')">{{ typeText(detail.review.reviewType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.createMode')">{{ createModeText(detail.review.createMode) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.businessDate')">{{ detail.review.businessDate }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.businessTimeZone')">{{ detail.review.businessTimeZone }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.netAmount')">{{ moneyTextByExponent(detail.review.netAmount, detail.review.targetCurrency, detail.review.targetCurrencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.candidateCount')">{{ detail.review.candidateCount }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.projectableCandidateCount')">{{ detail.review.projectableCandidateCount }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.submitter')">{{ detail.review.submittedByAccountName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewer')">{{ detail.review.decidedByAccountName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.batchNo')"><el-button v-if="detail.review.settlementBatchNo" link type="primary" @click="openBatch(detail.review.settlementBatchNo)">{{ detail.review.settlementBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.submittedTime')"><BaseDateTime :value="detail.review.submittedTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.decisionTime')"><BaseDateTime :value="detail.review.decisionTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detail.review.updateTime" :source-time-zone="detail.review.businessTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.clearing.reason')" :span="3">{{ detail.review.submitReason || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reviewComment')" :span="3">{{ detail.review.reviewComment || '-' }}</el-descriptions-item>
                </el-descriptions>

                <h3 class="detail-section-title">{{ t('transaction.settlement.candidateList') }}</h3>
                <el-table v-loading="candidateLoading" :data="candidateRows" border size="small" row-key="reviewCandidateNo">
                    <el-table-column prop="candidateNo" :label="t('transaction.settlement.candidateNo')" min-width="200" />
                    <el-table-column :label="t('transaction.settlement.sourceType')" min-width="150" align="center">
                        <template #default="{ row }">{{ enumText('sourceTypeValue', row.sourceType) }}</template>
                    </el-table-column>
                    <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="200">
                        <template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template>
                    </el-table-column>
                    <el-table-column :label="t('common.status')" width="130" align="center">
                        <template #default="{ row }">{{ enumText('relationStatusValue', row.relationStatus) }}</template>
                    </el-table-column>
                </el-table>
                <div v-show="candidateTotal > 0" class="detail-pagination">
                    <el-pagination
                        v-model:current-page="candidateQuery.pageNo"
                        v-model:page-size="candidateQuery.pageSize"
                        :total="candidateTotal"
                        :page-sizes="[20, 50, 100]"
                        layout="total, sizes, prev, pager, next, jumper"
                        background
                        size="small"
                        @current-change="loadReviewCandidates"
                        @size-change="resetCandidatePage"
                    />
                </div>

                <h3 class="detail-section-title">{{ t('transaction.settlement.rateMatrix') }}</h3>
                <el-table :data="detail.rates" border size="small">
                    <el-table-column prop="sourceCurrency" :label="t('transaction.settlement.sourceCurrency')" width="120" align="center" />
                    <el-table-column prop="targetCurrency" :label="t('transaction.settlement.targetCurrency')" width="120" align="center" />
                    <el-table-column :label="t('transaction.settlement.directRate')" min-width="180" align="right"><template #default="{ row }">{{ decimalText(row.directRate) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.rateSource')" min-width="160" align="center"><template #default="{ row }">{{ enumText('rateSourceValue', row.rateSource) }}</template></el-table-column>
                    <el-table-column prop="quoteId" :label="t('transaction.settlement.quoteId')" min-width="180" />
                </el-table>

                <h3 class="detail-section-title">{{ t('transaction.settlement.resultSummary') }}</h3>
                <el-table :data="detail.summaries" border size="small">
                    <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="190" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template></el-table-column>
                    <el-table-column :label="t('transaction.fields.transactionType')" min-width="140" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="160"><template #default="{ row }">{{ enumText('resultItemTypeValue', row.resultItemType) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="140"><template #default="{ row }">{{ enumText('feeCategoryValue', row.feeCategory) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('directionValue', row.direction)" /></template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="160" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="160" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                </el-table>
            </div>
        </el-drawer>

        <el-dialog
            v-model="decisionVisible"
            :title="decisionTitle"
            width="min(560px, calc(100vw - 32px))"
            destroy-on-close
        >
            <el-form :model="decisionForm" label-width="96px">
                <el-form-item :label="t('transaction.settlement.reviewComment')" required>
                    <el-input v-model="decisionForm.comment" type="textarea" :rows="4" maxlength="400" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="deciding" @click="submitDecision">{{ t('common.confirm') }}</el-button>
                    <el-button @click="decisionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="decisionTaskVisible"
            :title="t('transaction.settlement.decisionTask')"
            width="min(680px, calc(100vw - 32px))"
            :close-on-click-modal="false"
        >
            <div v-if="decisionTask" v-loading="decisionTaskLoading" class="decision-task-panel">
                <div class="decision-task-heading">
                    <div>
                        <span>{{ decisionActionText(decisionTask.decisionAction) }}</span>
                        <strong>{{ decisionTask.reviewOrderNo }}</strong>
                    </div>
                    <el-tag :type="taskStatusTagType(decisionTask.taskStatus)" effect="plain">{{ taskStatusText(decisionTask.taskStatus) }}</el-tag>
                </div>
                <el-progress
                    :percentage="decisionTask.progressPercent"
                    :status="decisionTask.taskStatus === 'FAILED' ? 'exception' : decisionTask.taskStatus === 'COMPLETED' ? 'success' : undefined"
                    :stroke-width="12"
                />
                <div class="decision-task-facts">
                    <div><span>{{ t('transaction.settlement.processedSegments') }}</span><strong>{{ decisionTask.processedSegmentCount }} / {{ decisionTask.totalSegmentCount }}</strong></div>
                    <div><span>{{ t('transaction.settlement.resultBatchCount') }}</span><strong>{{ decisionTask.resultBatchCount }}</strong></div>
                    <div><span>{{ t('transaction.settlement.retryCount') }}</span><strong>{{ decisionTask.retryCount }}</strong></div>
                    <div><span>{{ t('transaction.settlement.manualTaskNo') }}</span><strong>{{ decisionTask.taskNo }}</strong></div>
                </div>
                <el-alert
                    v-if="decisionTask.taskStatus === 'FAILED'"
                    :title="t('transaction.settlement.decisionTaskFailed')"
                    :description="decisionTaskFailureText"
                    type="error"
                    show-icon
                    :closable="false"
                />
                <div v-if="decisionTask.firstSettlementBatchNo" class="decision-task-batch">
                    <span>{{ t('transaction.settlement.batchNo') }}</span>
                    <el-button link type="primary" @click="openBatch(decisionTask.firstSettlementBatchNo)">{{ decisionTask.firstSettlementBatchNo }}</el-button>
                </div>
            </div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button
                        v-if="canResumeDecisionTask"
                        type="warning"
                        :icon="Refresh"
                        @click="openDecisionTaskResume"
                    >
                        {{ t('transaction.settlement.resumeDecisionTask') }}
                    </el-button>
                    <el-button :icon="Refresh" :loading="decisionTaskLoading" @click="refreshDecisionTask">{{ t('transaction.settlement.refreshProgress') }}</el-button>
                    <el-button @click="decisionTaskVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog
            v-model="decisionTaskResumeVisible"
            :title="t('transaction.settlement.resumeDecisionTaskTitle')"
            width="min(560px, calc(100vw - 32px))"
            destroy-on-close
            @closed="decisionTaskVisible = true"
        >
            <el-form :model="decisionTaskResumeForm" label-width="96px">
                <el-form-item :label="t('transaction.settlement.resumeReason')" required>
                    <el-input
                        v-model="decisionTaskResumeForm.reason"
                        type="textarea"
                        :rows="4"
                        maxlength="400"
                        show-word-limit
                        :placeholder="t('transaction.settlement.resumeReasonPlaceholder')"
                    />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="decisionTaskResuming" @click="submitDecisionTaskResume">
                        {{ t('transaction.settlement.confirmResumeDecisionTask') }}
                    </el-button>
                    <el-button @click="decisionTaskResumeVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Download, Refresh, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { BusinessResultError, DirectionTag, PaymentMethodDisplay } from '@acquiring/shared';
import {
    decideSettlementReview,
    exportSettlementReviews,
    getSettlementReview,
    getSettlementReviewDecisionTask,
    resumeSettlementReviewDecisionTask,
    searchSettlementReviewCandidates,
    searchSettlementReviews,
    submitSettlementReviewDecisionTask,
    type SettlementReview,
    type SettlementReviewCandidate,
    type SettlementReviewDecisionTask,
    type SettlementReviewDetail,
    type SettlementReviewQuery,
} from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { fallbackTransactionTypeOptions, loadTransactionDictOptions } from '@/views/transaction/shared';
import {
    businessDateFromBusinessNo,
    decimalText,
    defaultDateRange,
    moneyTextByExponent,
    requestKey,
    statusTagType,
} from '@/views/settlement/shared';

type DecisionAction = 'approve' | 'reject' | 'cancel';

const { t, te, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const reviewTypes = ['REGULAR', 'RESERVE_RELEASE', 'ADJUSTMENT'];
const reviewStatuses = ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED'];
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const detailVisible = ref(false);
const detailLoading = ref(false);
const candidateLoading = ref(false);
const decisionVisible = ref(false);
const deciding = ref(false);
const decisionTaskVisible = ref(false);
const decisionTaskLoading = ref(false);
const decisionTaskResumeVisible = ref(false);
const decisionTaskResuming = ref(false);
const rows = ref<SettlementReview[]>([]);
const total = ref(0);
const detail = ref<SettlementReviewDetail | null>(null);
const candidateRows = ref<SettlementReviewCandidate[]>([]);
const candidateTotal = ref(0);
const selected = ref<SettlementReview | null>(null);
const decisionTask = ref<SettlementReviewDecisionTask | null>(null);
const dateRange = ref<[string, string]>(defaultDateRange());
const query = reactive<SettlementReviewQuery>({ beginBusinessDate: '', endBusinessDate: '', pageNo: 1, pageSize: 10 });
const candidateQuery = reactive({ pageNo: 1, pageSize: 20 });
const decisionAction = ref<DecisionAction>('approve');
const decisionForm = reactive({ comment: '' });
const decisionTaskResumeForm = reactive({ reason: '' });
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const transactionTypeOptions = ref<SelectOption[]>(fallbackTransactionTypeOptions(t));
const decisionTitle = computed(() => t(`transaction.settlement.decisionTitle.${decisionAction.value}`));
const decisionTaskFailureText = computed(() => {
    if (!decisionTask.value) return '';
    return [decisionTask.value.failureCode, decisionTask.value.failureMessage].filter(Boolean).join(' · ');
});
const canViewDetail = userStore.hasPermission('settlement:review-order:detail');
const canResumeDecisionTask = computed(() => decisionTask.value?.taskStatus === 'FAILED'
    && decisionTask.value.recoverable === true
    && userStore.hasPermission('settlement:review-order:recover'));
let decisionPollTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(async () => {
    const linkedReviewNo = routeText('reviewOrderNo');
    if (linkedReviewNo) {
        query.reviewOrderNo = linkedReviewNo;
        const linkedBusinessDate = businessDateFromBusinessNo(linkedReviewNo);
        if (linkedBusinessDate) dateRange.value = [linkedBusinessDate, linkedBusinessDate];
    }
    await loadDimensionDictionaries();
    await loadData();
    if (linkedReviewNo && canViewDetail) {
        const linkedRow = rows.value.find((row) => row.reviewOrderNo === linkedReviewNo);
        if (linkedRow) await openDetail(linkedRow);
    }
    const linkedDecisionTaskNo = routeText('decisionTaskNo');
    if (linkedDecisionTaskNo) {
        decisionTaskVisible.value = true;
        await loadDecisionTask(linkedDecisionTaskNo);
    }
});

onBeforeUnmount(stopDecisionPolling);

async function loadDimensionDictionaries() {
    const language = String(locale.value || 'zh-CN');
    const [paymentTypes, paymentMethods, transactionTypes] = await Promise.all([
        loadDictOptions('acquiring_payment_method', language).catch(() => []),
        loadDictOptions('card_brand', language).catch(() => []),
        loadTransactionDictOptions('transaction_type', language).catch(() => []),
    ]);
    paymentTypeOptions.value = paymentTypes;
    paymentMethodOptions.value = paymentMethods;
    if (transactionTypes.length) transactionTypeOptions.value = transactionTypes;
}

function requestQuery(): SettlementReviewQuery {
    return {
        ...query,
        reviewOrderNo: query.reviewOrderNo || undefined,
        merchantId: query.merchantId || undefined,
        reviewType: query.reviewType || undefined,
        reviewStatus: query.reviewStatus || undefined,
        beginBusinessDate: dateRange.value[0],
        endBusinessDate: dateRange.value[1],
    };
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchSettlementReviews(requestQuery());
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    query.pageNo = 1;
    void loadData();
}

function handleReset() {
    Object.assign(query, { reviewOrderNo: undefined, merchantId: undefined, reviewType: undefined, reviewStatus: undefined, pageNo: 1 });
    dateRange.value = defaultDateRange();
    void loadData();
}

async function handleExport() {
    exporting.value = true;
    try {
        await exportSettlementReviews(requestQuery());
    } catch (error) {
        ElMessage.error(errorText(error, 'common.exportFailed'));
    } finally {
        exporting.value = false;
    }
}

async function openDetail(row: SettlementReview) {
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = null;
    candidateRows.value = [];
    candidateTotal.value = 0;
    candidateQuery.pageNo = 1;
    try {
        detail.value = await getSettlementReview(row.reviewOrderNo);
        await loadReviewCandidates();
    } catch (error) {
        ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

async function loadReviewCandidates() {
    const reviewOrderNo = detail.value?.review.reviewOrderNo;
    if (!reviewOrderNo) return;
    candidateLoading.value = true;
    try {
        const result = await searchSettlementReviewCandidates(reviewOrderNo, { ...candidateQuery });
        candidateRows.value = result.records || [];
        candidateTotal.value = result.total || 0;
    } catch (error) {
        ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        candidateLoading.value = false;
    }
}

function resetCandidatePage() {
    candidateQuery.pageNo = 1;
    void loadReviewCandidates();
}

function openTransaction(row: SettlementReviewCandidate) {
    router.push({
        path: '/transaction/operation',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: detail.value?.review.businessTimeZone || 'Asia/Shanghai',
        },
    });
}

function openMerchant(merchantId: string) {
    router.push({ path: '/merchant/info', query: { merchantId } });
}

function openBatch(settlementBatchNo?: string) {
    if (settlementBatchNo) router.push({ path: '/settlement/batches', query: { settlementBatchNo } });
}

function openDecision(action: DecisionAction, row: SettlementReview) {
    if (action === 'cancel' && !canCancelReview(row)) {
        ElMessage.warning(t('transaction.settlement.cancelReviewDisabled'));
        return;
    }
    if (action !== 'cancel' && isReviewMaker(row)) {
        ElMessage.warning(t('transaction.settlement.selfReviewDisabled'));
        return;
    }
    decisionAction.value = action;
    selected.value = row;
    decisionForm.comment = '';
    decisionVisible.value = true;
}

function isReviewMaker(row: SettlementReview) {
    const currentAccountId = userStore.account?.accountId;
    return currentAccountId != null
        && row.submittedByAccountId != null
        && row.submittedByAccountId === currentAccountId;
}

function canCancelReview(row: SettlementReview) {
    return row.reviewStatus === 'PENDING_APPROVAL' && isReviewMaker(row);
}

async function submitDecision() {
    if (!selected.value || !decisionForm.comment.trim()) {
        ElMessage.warning(t('transaction.settlement.requiredFields'));
        return;
    }
    deciding.value = true;
    try {
        const payload = {
            requestKey: requestKey(`SET-REVIEW-${decisionAction.value.toUpperCase()}`),
            expectedVersion: selected.value.version,
            comment: decisionForm.comment.trim(),
        };
        if (selected.value.createMode === 'MANUAL_ASYNC') {
            const result = await submitSettlementReviewDecisionTask(
                selected.value.reviewOrderNo,
                decisionAction.value,
                payload,
            );
            applyDecisionTask(result);
            decisionTaskVisible.value = true;
            await syncDecisionTaskQuery(result.taskNo);
            ElMessage.success(t('transaction.settlement.decisionTaskSubmitted', { taskNo: result.taskNo }));
        } else {
            await decideSettlementReview(selected.value.reviewOrderNo, decisionAction.value, payload);
            ElMessage.success(t('common.success'));
            await loadData();
        }
        decisionVisible.value = false;
    } catch (error) {
        ElMessage.error(errorText(error, 'common.operationFailed'));
    } finally {
        deciding.value = false;
    }
}

async function refreshDecisionTask() {
    if (decisionTask.value) await loadDecisionTask(decisionTask.value.taskNo);
}

function openDecisionTaskResume() {
    if (!canResumeDecisionTask.value) return;
    decisionTaskResumeForm.reason = '';
    decisionTaskVisible.value = false;
    decisionTaskResumeVisible.value = true;
}

async function submitDecisionTaskResume() {
    const task = decisionTask.value;
    const reason = decisionTaskResumeForm.reason.trim();
    if (!task || !canResumeDecisionTask.value || !reason || reason.length > 400) {
        ElMessage.warning(t('transaction.settlement.resumeReasonRequired'));
        return;
    }
    decisionTaskResuming.value = true;
    try {
        const result = await resumeSettlementReviewDecisionTask(task.taskNo, {
            requestKey: requestKey('SET-REVIEW-RECOVER'),
            expectedVersion: task.version,
            reason,
        });
        applyDecisionTask(result);
        decisionTaskResumeVisible.value = false;
        ElMessage.success(t('transaction.settlement.decisionTaskResumed', { taskNo: result.taskNo }));
    } catch (error) {
        ElMessage.error(errorText(error, 'common.operationFailed'));
    } finally {
        decisionTaskResuming.value = false;
    }
}

async function loadDecisionTask(taskNo: string, silent = false) {
    if (!silent) decisionTaskLoading.value = true;
    try {
        const previousStatus = decisionTask.value?.taskStatus;
        const result = await getSettlementReviewDecisionTask(taskNo);
        applyDecisionTask(result);
        if (['COMPLETED', 'FAILED'].includes(result.taskStatus) && previousStatus !== result.taskStatus) {
            await loadData();
            if (detail.value?.review.reviewOrderNo === result.reviewOrderNo) {
                detail.value = await getSettlementReview(result.reviewOrderNo);
                await loadReviewCandidates();
            }
        }
    } catch (error) {
        stopDecisionPolling();
        if (!silent) ElMessage.error(errorText(error, 'common.loadFailed'));
    } finally {
        if (!silent) decisionTaskLoading.value = false;
    }
}

function applyDecisionTask(value: SettlementReviewDecisionTask) {
    decisionTask.value = value;
    scheduleDecisionPolling(value.taskStatus);
}

function scheduleDecisionPolling(status: string) {
    stopDecisionPolling();
    if (!['QUEUED', 'PROCESSING'].includes(status) || !decisionTask.value) return;
    decisionPollTimer = setTimeout(() => void loadDecisionTask(decisionTask.value!.taskNo, true), 2500);
}

function stopDecisionPolling() {
    if (decisionPollTimer) clearTimeout(decisionPollTimer);
    decisionPollTimer = undefined;
}

async function syncDecisionTaskQuery(taskNo: string) {
    await router.replace({ path: route.path, query: { ...route.query, decisionTaskNo: taskNo } });
}

function typeText(value?: string) {
    return enumText('reviewTypeValue', value);
}

function statusText(value?: string) {
    return enumText('reviewStatus', value);
}

function createModeText(value?: string) {
    return enumText('createModeValue', value);
}

function taskStatusText(value?: string) {
    return enumText('taskStatusValue', value);
}

function decisionActionText(value?: string) {
    const normalized = value?.toLowerCase();
    return normalized && te(`transaction.settlement.decisionTitle.${normalized}`)
        ? t(`transaction.settlement.decisionTitle.${normalized}`) : value || '-';
}

function taskStatusTagType(value?: string) {
    if (value === 'COMPLETED') return 'success';
    if (value === 'FAILED') return 'danger';
    if (value === 'QUEUED') return 'warning';
    return 'primary';
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const options = group === 'paymentTypeValue' ? paymentTypeOptions.value
        : group === 'paymentMethodValue' ? paymentMethodOptions.value
            : group === 'transactionTypeValue' ? transactionTypeOptions.value : [];
    const option = options.find((item) => item.value === value);
    if (option) return option.label;
    const key = `transaction.settlement.${group}.${value}`;
    return te(key) ? t(key) : value;
}

function dimensionItems(group: string, value?: string) {
    return value ? [{ value, label: enumText(group, value) }] : [];
}

function routeText(name: string) {
    const value = route.query[name];
    return typeof value === 'string' ? value.trim() : '';
}

function errorText(error: unknown, fallbackKey: string) {
    if (error instanceof BusinessResultError) {
        if (error.resultCode === 'SETTLEMENT_REVIEW_DECISION_SELF_REVIEW_FORBIDDEN') {
            return t('transaction.settlement.selfReviewDisabled');
        }
        if (error.resultCode === 'SETTLEMENT_REVIEW_DECISION_CANCEL_FORBIDDEN') {
            return t('transaction.settlement.cancelReviewDisabled');
        }
    }
    return error instanceof Error ? error.message : t(fallbackKey);
}
</script>

<style scoped>
.search-form :deep(.el-input), .search-form :deep(.el-select) { width: 220px; }
.detail-section-title { margin: 24px 0 10px; font-size: 14px; letter-spacing: 0; }
.detail-pagination { display: flex; justify-content: flex-end; padding-top: 12px; }
.decision-task-panel { min-height: 210px; }
.decision-task-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
.decision-task-heading span, .decision-task-heading strong { display: block; }
.decision-task-heading span { margin-bottom: 5px; font-size: 12px; color: var(--el-text-color-secondary); }
.decision-task-heading strong { font-size: 15px; color: var(--el-text-color-primary); }
.decision-task-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 18px 0; border: 1px solid var(--el-border-color-light); border-radius: 6px; overflow: hidden; }
.decision-task-facts > div { min-width: 0; padding: 12px 14px; border-right: 1px solid var(--el-border-color-light); border-bottom: 1px solid var(--el-border-color-light); }
.decision-task-facts > div:nth-child(2n) { border-right: 0; }
.decision-task-facts > div:nth-last-child(-n+2) { border-bottom: 0; }
.decision-task-facts span, .decision-task-facts strong { display: block; }
.decision-task-facts span { margin-bottom: 5px; font-size: 12px; color: var(--el-text-color-secondary); }
.decision-task-facts strong { overflow-wrap: anywhere; font-variant-numeric: tabular-nums; color: var(--el-text-color-primary); }
.decision-task-batch { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
.decision-task-batch > span { font-size: 13px; color: var(--el-text-color-secondary); }
@media (max-width: 680px) {
    .decision-task-facts { grid-template-columns: 1fr; }
    .decision-task-facts > div, .decision-task-facts > div:nth-child(2n) { border-right: 0; border-bottom: 1px solid var(--el-border-color-light); }
    .decision-task-facts > div:last-child { border-bottom: 0; }
}
</style>
