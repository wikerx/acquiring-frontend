<!-- Admin 结算候选复用主组件：按 kind 隔离真实交易与保证金来源，查询始终由后端权限和商户数据范围裁决。 -->
<template>
    <div class="app-container settlement-list-page">
        <TransactionSearchPanel
            class="candidate-search-panel"
            :visible="showSearch"
            :model="query"
            :title="candidateSearchTitle"
            :description="candidateSearchDescription"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            label-width="92px"
            :inline-time="true"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.settlement.candidateNo')">
                <el-input v-model.trim="query.candidateNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.candidateStatus" clearable filterable :placeholder="t('common.pleaseSelect')">
                    <el-option v-for="status in candidateStatuses" :key="status" :label="statusText(status)" :value="status" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.fields.transactionId')">
                    <el-input v-model.trim="query.sourceTransactionId" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                    <el-input v-model.trim="query.merchantOrderNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.paymentType')">
                    <el-select v-model="query.paymentType" clearable filterable :placeholder="t('common.pleaseSelect')">
                        <el-option v-for="item in paymentTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.paymentMethod')">
                    <el-select v-model="query.paymentMethod" clearable filterable :placeholder="t('common.pleaseSelect')">
                        <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.transactionType')">
                    <el-select v-model="query.transactionType" clearable filterable :placeholder="t('common.pleaseSelect')">
                        <el-option v-for="item in transactionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.labelCurrency')"><CurrencySelect v-model="query.labelCurrency" width="100%" /></el-form-item>
                <el-form-item :label="t('transaction.settlement.targetCurrency')"><CurrencySelect v-model="query.targetCurrency" width="100%" /></el-form-item>
                <el-form-item :label="t('transaction.settlement.sourceRevision')">
                    <el-input-number v-model="query.sourceRevision" :min="1" :max="2147483647" controls-position="right" />
                </el-form-item>
                <template v-if="props.kind === 'reserve'">
                    <el-form-item :label="t('transaction.settlement.reserveNo')">
                        <el-input v-model.trim="query.reserveNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.reserveStatus')">
                        <el-select v-model="query.reserveStatus" clearable filterable :placeholder="t('common.pleaseSelect')">
                            <el-option v-for="status in reserveStatuses" :key="status" :label="reserveStatusText(status)" :value="status" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.due')">
                        <el-select v-model="query.due" clearable :placeholder="t('common.pleaseSelect')">
                            <el-option :label="t('common.yes')" :value="true" />
                            <el-option :label="t('common.no')" :value="false" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.frozen')">
                        <el-select v-model="query.frozen" clearable :placeholder="t('common.pleaseSelect')">
                            <el-option :label="t('common.yes')" :value="true" />
                            <el-option :label="t('common.no')" :value="false" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.remainingAmountMin')">
                        <el-input v-model.trim="query.minRemainingAmount" inputmode="decimal" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.remainingAmountMax')">
                        <el-input v-model.trim="query.maxRemainingAmount" inputmode="decimal" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.settlement.expectedReleaseDate')" class="candidate-range-filter">
                        <el-date-picker v-model="expectedReleaseRange" type="daterange" value-format="YYYY-MM-DD"
                            :range-separator="t('common.to')" :start-placeholder="t('common.startTime')"
                            :end-placeholder="t('common.endTime')" clearable />
                    </el-form-item>
                </template>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="candidate-range-filter">
                    <el-date-picker v-model="transactionRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
                        format="YYYY-MM-DD HH:mm:ss" :range-separator="t('common.to')"
                        :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" clearable />
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.settlement.eligibleDate')" class="transaction-time-form-item candidate-eligible-filter">
                    <el-date-picker v-model="eligibleRange" type="daterange" value-format="YYYY-MM-DD"
                        :range-separator="t('common.to')" :start-placeholder="t('common.startTime')"
                        :end-placeholder="t('common.endTime')" :clearable="false" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button v-hasPermi="createPermission" type="primary" plain :icon="Plus"
                    :disabled="selection.length === 0" @click="openSubmit">
                    {{ t('transaction.settlement.submitReview') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <StandardTable ref="tableRef" v-loading="loading" :table-key="tableKey" :data="rows" row-key="id" size="small"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="46" fixed="left" :selectable="candidateSelectable" />
            <el-table-column prop="candidateNo" :label="t('transaction.settlement.candidateNo')" min-width="210" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column :label="t('transaction.settlement.merchant')" min-width="200">
                <template #default="{ row }"><MerchantIdentityDisplay :merchant-id="row.merchantId" :merchant-name="row.merchantName" clickable @click="openMerchant(row.merchantId)" /></template>
            </el-table-column>
            <el-table-column prop="merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip>
                <template #default="{ row }">{{ row.merchantOrderNo || '-' }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="200" align="center">
                <template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionType')" min-width="118" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
            <el-table-column :label="t('transaction.settlement.sourceType')" min-width="156" align="center">
                <template #default="{ row }">{{ sourceTypeText(row.sourceType) }}</template>
            </el-table-column>
            <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="210" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column :label="t('transaction.fields.labelAmount')" min-width="150" align="right"><template #default="{ row }"><strong>{{ candidateAmount(row) }}</strong></template></el-table-column>
            <el-table-column v-if="props.kind === 'transaction'" :label="t('transaction.settlement.clearingComposition')" min-width="190">
                <template #default="{ row }"><div class="candidate-composition"><span>{{ t('transaction.settlement.grossLabelAmount') }} <b>{{ candidateMoney(row.grossLabelAmount, row) }}</b></span><span>{{ t('transaction.settlement.platformFeeAmount') }} <b>{{ candidateMoney(row.platformFeeAmount, row) }}</b></span><span>{{ t('transaction.settlement.reserveAmount') }} <b>{{ candidateMoney(row.reserveAmount, row) }}</b></span></div></template>
            </el-table-column>
            <el-table-column v-else :label="t('transaction.settlement.reserveActionAmount')" min-width="168" align="right"><template #default="{ row }"><div class="candidate-action"><span>{{ enumText('reserveActionTypeValue', row.reserveActionType) }}</span><strong>{{ candidateMoney(row.reserveActionAmount, row) }}</strong></div></template></el-table-column>
            <el-table-column v-if="props.kind === 'reserve'" prop="reserveNo" :label="t('transaction.settlement.reserveNo')" min-width="190" align="center" show-overflow-tooltip />
            <el-table-column v-if="props.kind === 'reserve'" :label="t('transaction.settlement.reserveStatus')" min-width="126" align="center"><template #default="{ row }">{{ reserveStatusText(row.reserveStatus) }}</template></el-table-column>
            <el-table-column v-if="props.kind === 'reserve'" :label="t('transaction.settlement.remainingAmount')" min-width="150" align="right"><template #default="{ row }"><strong>{{ candidateMoney(row.remainingAmount, row) }}</strong></template></el-table-column>
            <el-table-column v-if="props.kind === 'reserve'" prop="expectedReserveReleaseDate" :label="t('transaction.settlement.expectedReleaseDate')" width="140" align="center" />
            <el-table-column v-if="props.kind === 'transaction'" :label="t('transaction.settlement.candidateNetAmount')" min-width="164" align="right"><template #default="{ row }"><strong>{{ candidateMoney(row.netSettlementAmount, row) }}</strong><small v-if="!hasAmount(row.netSettlementAmount) && row.feeEvaluationStatus">{{ feeEvaluationText(row.feeEvaluationStatus) }}</small></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.targetCurrency')" width="116" align="center">
                <template #default="{ row }"><strong>{{ row.targetCurrency }}</strong></template>
            </el-table-column>
            <el-table-column :label="t('common.status')" min-width="134" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain" :type="statusTagType(row.candidateStatus)">{{ statusText(row.candidateStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="settlementEligibleDate" :label="t('transaction.settlement.eligibleDate')" width="128" align="center" />
            <el-table-column prop="reviewOrderNo" :label="t('transaction.settlement.reviewOrderNo')" min-width="200" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.reviewOrderNo" link type="primary" @click="openReview(row.reviewOrderNo)">{{ row.reviewOrderNo }}</el-button><span v-else>-</span></template></el-table-column>
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="176" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="92" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button v-hasPermi="detailPermission" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
                @current-change="loadData" @size-change="handleSearch" />
        </div>

        <el-drawer v-model="detailVisible" :title="t('transaction.settlement.candidateDetail')" size="min(720px, 96vw)" destroy-on-close>
            <el-descriptions v-if="detail" :column="2" border size="small">
                <el-descriptions-item :label="t('transaction.settlement.candidateNo')">{{ detail.candidateNo }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')">{{ statusText(detail.candidateStatus) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.merchant')" :span="2"><MerchantIdentityDisplay :merchant-id="detail.merchantId" :merchant-name="detail.merchantName" clickable @click="openMerchant(detail.merchantId)" /></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.fields.merchantOrderNo')">{{ detail.merchantOrderNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.paymentTypeMethod')"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', detail.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', detail.paymentMethod)" align="start" /></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.fields.transactionType')">{{ enumText('transactionTypeValue', detail.transactionType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.fields.labelAmount')"><strong>{{ candidateAmount(detail) }}</strong></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.sourceType')">{{ sourceTypeText(detail.sourceType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.sourceBusinessId')">{{ detail.sourceBusinessId }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.sourceRevision')">{{ detail.sourceRevision }}</el-descriptions-item>
                <template v-if="props.kind === 'transaction'">
                    <el-descriptions-item :label="t('transaction.settlement.grossLabelAmount')">{{ candidateMoney(detail.grossLabelAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.platformFeeAmount')">{{ candidateMoney(detail.platformFeeAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reserveAmount')">{{ candidateMoney(detail.reserveAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.candidateNetAmount')">{{ candidateMoney(detail.netSettlementAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.feeEvaluationStatus')">{{ feeEvaluationText(detail.feeEvaluationStatus) }}</el-descriptions-item>
                </template>
                <template v-else>
                    <el-descriptions-item :label="t('transaction.settlement.reserveActionType')">{{ enumText('reserveActionTypeValue', detail.reserveActionType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.direction')"><DirectionTag :direction="detail.reserveDirection" :label="enumText('directionValue', detail.reserveDirection)" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reserveActionAmount')">{{ candidateMoney(detail.reserveActionAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reserveNo')">{{ detail.reserveNo || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.reserveStatus')">{{ reserveStatusText(detail.reserveStatus) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.remainingAmount')">{{ candidateMoney(detail.remainingAmount, detail) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.settlement.expectedReleaseDate')">{{ detail.expectedReserveReleaseDate || '-' }}</el-descriptions-item>
                </template>
                <el-descriptions-item :label="t('transaction.fields.transactionId')">{{ detail.sourceTransactionId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.targetCurrency')">{{ detail.targetCurrency }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.profileId')">{{ detail.settlementProfileId }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.eligibleDate')">{{ detail.settlementEligibleDate }}</el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.reviewOrderNo')"><el-button v-if="detail.reviewOrderNo" link type="primary" @click="openReview(detail.reviewOrderNo)">{{ detail.reviewOrderNo }}</el-button><span v-else>-</span></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.settlement.batchNo')"><el-button v-if="detail.settlementBatchNo" link type="primary" @click="openBatch(detail.settlementBatchNo)">{{ detail.settlementBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                <el-descriptions-item :label="t('transaction.fields.transactionDateTime')"><BaseDateTime :value="detail.sourceTransactionDateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('common.updateTime')"><BaseDateTime :value="detail.updateTime" /></el-descriptions-item>
            </el-descriptions>
        </el-drawer>

        <el-dialog v-model="submitVisible" :title="t('transaction.settlement.submitReview')" width="620px" destroy-on-close>
            <el-alert :title="t('transaction.settlement.reviewGroupNotice')" type="warning" show-icon :closable="false" />
            <el-form :model="submitForm" label-width="112px" class="settlement-dialog-form">
                <el-form-item :label="t('transaction.settlement.selectedCandidates')">{{ selection.length }}</el-form-item>
                <el-form-item :label="t('transaction.settlement.businessDate')" required>
                    <el-date-picker v-model="submitForm.businessDate" type="date" value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item :label="t('transaction.settlement.cutoffRange')" required>
                    <el-date-picker v-model="submitForm.cutoffRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
                        format="YYYY-MM-DD HH:mm:ss" :range-separator="t('common.to')"
                        :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
                </el-form-item>
                <el-form-item :label="t('transaction.clearing.reason')" required>
                    <el-input v-model="submitForm.reason" type="textarea" :rows="4" maxlength="400" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="submitting" @click="submitReview">{{ t('common.confirm') }}</el-button>
                    <el-button @click="submitVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Plus, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { DirectionTag, MerchantIdentityDisplay, PaymentMethodDisplay } from '@acquiring/shared';
import {
    getSettlementCandidate, searchSettlementCandidates, submitSettlementReview,
    type SettlementCandidate, type SettlementCandidateQuery,
} from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import TransactionSearchPanel from '@/views/transaction/components/TransactionSearchPanel.vue';
import { fallbackTransactionTypeOptions, loadTransactionDictOptions } from '@/views/transaction/shared';
import { defaultDateRange, moneyTextByExponent, requestKey, statusTagType } from '@/views/settlement/shared';

const props = defineProps<{ kind: 'transaction' | 'reserve' }>();
const { t, te, locale } = useI18n();
const router = useRouter();
const showSearch = ref(true);
const loading = ref(false);
const submitting = ref(false);
const rows = ref<SettlementCandidate[]>([]);
const selection = ref<SettlementCandidate[]>([]);
const total = ref(0);
const eligibleRange = ref<[string, string]>(defaultDateRange());
const transactionRange = ref<string[]>([]);
const expectedReleaseRange = ref<string[]>([]);
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const transactionTypeOptions = ref<SelectOption[]>(fallbackTransactionTypeOptions(t));
const detailVisible = ref(false);
const detail = ref<SettlementCandidate | null>(null);
const submitVisible = ref(false);
const query = reactive<SettlementCandidateQuery>({ beginEligibleDate: '', endEligibleDate: '', pageNo: 1, pageSize: 10 });
const submitForm = reactive({ businessDate: defaultDateRange(0)[1], cutoffRange: [] as string[], reason: '' });
const candidateStatuses = ['READY', 'REPLAY_HOLD', 'REVIEW_LOCKED', 'SUPERSEDED', 'CLAIMED', 'POSTED', 'MANUAL_REVIEW', 'CANCELLED'];
const reserveStatuses = ['HELD', 'PARTIALLY_RETURNED', 'RELEASABLE', 'FROZEN', 'RETURNED', 'RELEASED', 'ADJUSTED', 'REVERSED'];
const tableKey = computed(() => `admin-settlement-${props.kind}-candidates`);
const createPermission = computed(() => `settlement:${props.kind}-review:create`);
const detailPermission = computed(() => `settlement:${props.kind}-candidate:detail`);
const candidateSearchTitle = computed(() => t(`transaction.settlement.${props.kind}CandidateSearchTitle`));
const candidateSearchDescription = computed(() => t(`transaction.settlement.${props.kind}CandidateSearchDescription`));

onMounted(async () => {
    await loadDictionaries();
    await loadData();
});

async function loadDictionaries() {
    try {
        const language = String(locale.value || 'zh-CN');
        const [paymentTypes, paymentMethods, transactionTypes] = await Promise.all([
            loadDictOptions('acquiring_payment_method', language).catch(() => []),
            loadDictOptions('card_brand', language).catch(() => []),
            loadTransactionDictOptions('transaction_type', language).catch(() => []),
        ]);
        paymentTypeOptions.value = paymentTypes;
        paymentMethodOptions.value = paymentMethods;
        if (transactionTypes.length) transactionTypeOptions.value = transactionTypes;
    } catch {
        transactionTypeOptions.value = fallbackTransactionTypeOptions(t);
    }
}

async function loadData() {
    selection.value = [];
    loading.value = true;
    try {
        const result = await searchSettlementCandidates(props.kind, requestQuery());
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function requestQuery(): SettlementCandidateQuery {
    return {
        ...query,
        candidateNo: query.candidateNo || undefined,
        merchantId: query.merchantId || undefined,
        sourceTransactionId: query.sourceTransactionId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        beginTransactionTime: transactionRange.value[0] || undefined,
        endTransactionTime: transactionRange.value[1] || undefined,
        paymentType: query.paymentType || undefined,
        paymentMethod: query.paymentMethod || undefined,
        transactionType: query.transactionType || undefined,
        labelCurrency: query.labelCurrency || undefined,
        targetCurrency: query.targetCurrency || undefined,
        sourceRevision: query.sourceRevision || undefined,
        reserveNo: props.kind === 'reserve' ? query.reserveNo || undefined : undefined,
        reserveStatus: props.kind === 'reserve' ? query.reserveStatus || undefined : undefined,
        beginExpectedReleaseDate: props.kind === 'reserve' ? expectedReleaseRange.value[0] || undefined : undefined,
        endExpectedReleaseDate: props.kind === 'reserve' ? expectedReleaseRange.value[1] || undefined : undefined,
        due: props.kind === 'reserve' ? query.due : undefined,
        frozen: props.kind === 'reserve' ? query.frozen : undefined,
        minRemainingAmount: props.kind === 'reserve' ? query.minRemainingAmount || undefined : undefined,
        maxRemainingAmount: props.kind === 'reserve' ? query.maxRemainingAmount || undefined : undefined,
        candidateStatus: query.candidateStatus || undefined,
        beginEligibleDate: eligibleRange.value[0], endEligibleDate: eligibleRange.value[1],
    };
}

function handleSearch() { query.pageNo = 1; loadData(); }
function handleReset() {
    Object.assign(query, {
        candidateNo: undefined, merchantId: undefined, sourceTransactionId: undefined,
        merchantOrderNo: undefined, paymentType: undefined, paymentMethod: undefined,
        transactionType: undefined, labelCurrency: undefined, targetCurrency: undefined,
        sourceRevision: undefined, reserveNo: undefined, reserveStatus: undefined,
        due: undefined, frozen: undefined, minRemainingAmount: undefined,
        maxRemainingAmount: undefined, candidateStatus: undefined, pageNo: 1,
    });
    eligibleRange.value = defaultDateRange();
    transactionRange.value = [];
    expectedReleaseRange.value = [];
    loadData();
}

async function openDetail(row: SettlementCandidate) {
    detailVisible.value = true;
    detail.value = null;
    try {
        detail.value = await getSettlementCandidate(props.kind, row.candidateNo);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

function openTransaction(row: SettlementCandidate) {
    router.push({
        path: '/transaction/operation',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: 'Asia/Shanghai',
        },
    });
}

function openMerchant(merchantId: string) { router.push({ path: '/merchant/info', query: { merchantId } }); }
function openReview(reviewOrderNo: string) { router.push({ path: '/settlement/review-orders', query: { reviewOrderNo } }); }
function openBatch(settlementBatchNo: string) { router.push({ path: '/settlement/batches', query: { settlementBatchNo } }); }

function openSubmit() {
    const first = selection.value[0];
    if (!first) return;
    const sameGroup = selection.value.every((row) => row.merchantId === first.merchantId
        && row.settlementProfileId === first.settlementProfileId && row.targetCurrency === first.targetCurrency);
    const sourceTypes = new Set(selection.value.map((row) => row.sourceType));
    if (!sameGroup || sourceTypes.size !== 1 || selection.value.some((row) => !candidateSelectable(row))) {
        ElMessage.warning(t('transaction.settlement.reviewGroupInvalid'));
        return;
    }
    submitForm.businessDate = defaultDateRange(0)[1];
    submitForm.cutoffRange = [`${eligibleRange.value[0]}T00:00:00`, `${eligibleRange.value[1]}T23:59:59`];
    submitForm.reason = '';
    submitVisible.value = true;
}

async function submitReview() {
    if (!submitForm.businessDate || submitForm.cutoffRange.length !== 2 || !submitForm.reason.trim()) {
        ElMessage.warning(t('transaction.settlement.requiredFields'));
        return;
    }
    const sourceType = selection.value[0]?.sourceType;
    const reviewType = props.kind === 'transaction' ? 'REGULAR' : sourceType;
    if (!reviewType) return;
    submitting.value = true;
    try {
        const result = await submitSettlementReview(props.kind, {
            requestKey: requestKey(`SET-${props.kind.toUpperCase()}-REVIEW`), reviewType,
            businessDate: submitForm.businessDate, cutoffBeginTime: submitForm.cutoffRange[0],
            cutoffEndTime: submitForm.cutoffRange[1],
            candidates: selection.value.map((row) => ({ candidateId: row.id, expectedVersion: row.version })),
            reason: submitForm.reason.trim(),
        });
        ElMessage.success(t('transaction.settlement.reviewSubmitted', { orderNo: result.reviewOrderNo }));
        submitVisible.value = false;
        await loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.operationFailed'));
    } finally {
        submitting.value = false;
    }
}

function statusText(value?: string) {
    return enumText('candidateStatus', value);
}

function sourceTypeText(value?: string) {
    return enumText('sourceTypeValue', value);
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

function candidateMoney(value: number | string | null | undefined, row: SettlementCandidate) {
    return moneyTextByExponent(value, row.labelCurrency, row.labelCurrencyExponent);
}

function candidateAmount(row: SettlementCandidate) {
    return candidateMoney(row.labelAmount, row);
}

function hasAmount(value?: number | string | null) {
    return value !== undefined && value !== null && value !== '';
}

function feeEvaluationText(value?: string) {
    return enumText('feeEvaluationStatusValue', value);
}

function reserveStatusText(value?: string) {
    return enumText('reserveStatusValue', value);
}

function candidateSelectable(row: SettlementCandidate) {
    if (row.candidateStatus !== 'READY' || row.reserveStatus === 'FROZEN') return false;
    const first = selection.value[0];
    if (!first) return true;
    return row.merchantId === first.merchantId
        && row.settlementProfileId === first.settlementProfileId
        && row.targetCurrency === first.targetCurrency
        && row.sourceType === first.sourceType;
}

function handleSelectionChange(value: SettlementCandidate[]) {
    selection.value = value;
}
</script>

<style scoped>
.candidate-search-panel :deep(.transaction-search__grid) {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    align-items: start;
    gap: 10px 16px;
}
.candidate-search-panel:not(.is-advanced-visible) :deep(.transaction-search > .transaction-search__grid) {
    grid-template-columns: repeat(3, minmax(220px, 1fr)) minmax(310px, 1.25fr) auto;
    align-items: center;
}
.candidate-search-panel :deep(.transaction-search .el-form-item) { width: 100%; min-width: 0; }
.candidate-search-panel :deep(.transaction-search .el-form-item__content) { min-width: 0; }
.candidate-search-panel :deep(.transaction-search .el-input),
.candidate-search-panel :deep(.transaction-search .el-select),
.candidate-search-panel :deep(.transaction-search .el-input-number),
.candidate-search-panel :deep(.transaction-search .el-date-editor) { width: 100%; max-width: 100%; }
.candidate-search-panel :deep(.transaction-search__advanced) { margin-top: 10px; padding-top: 10px; }
.candidate-search-panel :deep(.transaction-search__actions--inline) {
    align-self: center;
    justify-self: end;
    justify-content: flex-end;
    width: auto;
    min-width: max-content;
    flex: none;
}
.candidate-search-panel.is-advanced-visible :deep(.transaction-search__advanced .transaction-search__actions--inline) { width: 100%; }
.candidate-search-panel :deep(.candidate-range-filter) { grid-column: span 2; }
.candidate-search-panel :deep(.candidate-eligible-filter) { width: 100%; max-width: 100%; }
.candidate-search-panel :deep(.candidate-eligible-filter .el-form-item__content) { flex: 1 1 auto; width: auto; max-width: 320px; }
.candidate-search-panel :deep(.candidate-eligible-filter .el-date-editor) { width: 100%; }
.settlement-dialog-form { margin-top: 20px; }
.settlement-dialog-form :deep(.el-date-editor) { width: 100%; }
.candidate-action span, .candidate-composition span, small { color: var(--el-text-color-secondary); font-size: 12px; }
.candidate-composition { display: grid; gap: 2px; }
.candidate-composition span { display: flex; justify-content: space-between; gap: 8px; }
.candidate-composition b { color: var(--el-text-color-regular); font-weight: 600; font-variant-numeric: tabular-nums; }
.candidate-action { display: grid; gap: 2px; }
@media (max-width: 1360px) {
    .candidate-search-panel :deep(.transaction-search__grid),
    .candidate-search-panel:not(.is-advanced-visible) :deep(.transaction-search > .transaction-search__grid) {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .candidate-search-panel:not(.is-advanced-visible) :deep(.candidate-eligible-filter) { grid-column: span 2; }
    .candidate-search-panel :deep(.candidate-range-filter) { grid-column: span 1; }
}
@media (max-width: 980px) {
    .candidate-search-panel :deep(.transaction-search__grid),
    .candidate-search-panel:not(.is-advanced-visible) :deep(.transaction-search > .transaction-search__grid) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .candidate-search-panel :deep(.candidate-range-filter) { grid-column: span 2; }
}
@media (max-width: 640px) {
    .candidate-search-panel :deep(.transaction-search__grid),
    .candidate-search-panel:not(.is-advanced-visible) :deep(.transaction-search > .transaction-search__grid) {
        grid-template-columns: 1fr;
    }
    .candidate-search-panel :deep(.candidate-range-filter),
    .candidate-search-panel:not(.is-advanced-visible) :deep(.candidate-eligible-filter) { grid-column: span 1; }
    .candidate-search-panel :deep(.candidate-eligible-filter .el-form-item__content) { max-width: none; }
    .candidate-search-panel :deep(.transaction-search__actions--inline) { justify-self: stretch; justify-content: flex-end; width: 100%; }
}
</style>
