<template>
    <div class="transaction-finance-detail">
        <el-tabs v-model="activeSection" class="transaction-finance-detail__tabs">
            <el-tab-pane
                v-if="canViewClearing"
                :label="t('transaction.detail.finance.clearing')"
                name="clearing"
            >
                <div v-loading="clearingLoading" class="transaction-finance-detail__panel">
                    <div v-if="clearingError" class="transaction-finance-detail__error">
                        <el-alert :title="clearingError" type="error" :closable="false" show-icon />
                        <el-button :icon="Refresh" @click="loadClearing(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="clearingDetail">
                        <el-descriptions :column="2" border size="small" class="transaction-finance-detail__summary">
                            <el-descriptions-item :label="t('transaction.clearing.clearingStatus')">
                                <el-tag size="small" :type="financeStatusTagType(clearingDetail.summary.clearingStatus)">
                                    {{ clearingStatusText(clearingDetail.summary.clearingStatus) }}
                                </el-tag>
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.clearing.revision')">
                                v{{ clearingDetail.summary.clearingRevision || 0 }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.clearing.grossAmount')" class-name="transaction-finance-detail__money-cell">
                                <CurrencyAmountDisplay :amount="clearingDetail.summary.grossLabelAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" align="center" emphasized />
                            </el-descriptions-item>
                            <el-descriptions-item v-if="!clearingDetail.feeFacts" :label="t('transaction.clearing.platformFee')" class-name="transaction-finance-detail__money-cell">
                                <CurrencyAmountDisplay :amount="clearingDetail.summary.platformFeeAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" align="center" />
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.clearing.reserveAmount')" class-name="transaction-finance-detail__money-cell">
                                <CurrencyAmountDisplay :amount="clearingDetail.summary.reserveAmount" :currency="clearingDetail.summary.labelCurrency" :locale="String(locale)" align="center" />
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.clearing.settlementStatus')">
                                <TransactionStageStatusDisplay domain="settlement" :value="clearingDetail.summary.settlementStatus" :label="statusText(clearingDetail.summary.settlementStatus)" />
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.clearing.settlementEligibleDate')">
                                {{ clearingDetail.summary.settlementEligibleDate || '-' }}
                            </el-descriptions-item>
                            <el-descriptions-item :label="t('transaction.fields.transactionDateTime')">
                                <BaseDateTime
                                    :value="clearingDetail.summary.transactionDateTime"
                                    source-time-zone="Asia/Shanghai"
                                    :display-time-zone="displayTimeZone"
                                />
                            </el-descriptions-item>
                        </el-descriptions>

                        <TransactionFeeBreakdown
                            v-if="clearingDetail.feeFacts"
                            :facts="clearingDetail.feeFacts"
                            :transaction-id="transactionId"
                            :transaction-type="clearingDetail.summary.transactionType"
                            :clearing-status="clearingDetail.summary.clearingStatus"
                            :settlement-status="clearingDetail.summary.settlementStatus"
                            :back-available="Boolean(feeAction)"
                            :locale="String(locale)"
                            @source="feeAction = $event"
                            @back="feeAction = null"
                        />

                        <el-button v-if="clearingDetail.feeFacts" link type="primary" :aria-expanded="rawFeeLinesVisible" @click="rawFeeLinesVisible = !rawFeeLinesVisible">
                            {{ transactionFeeText(String(locale), rawFeeLinesVisible ? 'hideRaw' : 'showRaw') }}
                        </el-button>
                        <section v-show="!clearingDetail.feeFacts || rawFeeLinesVisible" class="transaction-finance-detail__section">
                            <div class="transaction-finance-detail__heading">
                                <strong>{{ t('transaction.clearing.transactionLedger') }}</strong>
                                <el-tag size="small" effect="plain">{{ clearingTransactionLoading ? '…' : clearingTransactionError ? '—' : clearingTransactionTotal }}</el-tag>
                            </div>
                            <div v-if="clearingTransactionError" class="transaction-finance-detail__error">
                                <el-alert :title="t('transaction.clearing.transactionDetailLoadFailed')" type="error" :closable="false" show-icon />
                                <el-button :icon="Refresh" @click="loadClearingTransactions">{{ t('common.refresh') }}</el-button>
                            </div>
                            <StandardTable
                                v-else
                                v-loading="clearingTransactionLoading"
                                table-key="transaction-finance-clearing-items"
                                :data="clearingTransactionRows"
                                row-key="clearingDetailNo"
                                size="small"
                                :empty-text="t('transaction.detail.empty')"
                            >
                                <el-table-column prop="lineNo" :label="t('transaction.clearing.lineNo')" width="72" align="center" />
                                <el-table-column :label="t('transaction.clearing.feeItem')" min-width="190" align="center">
                                    <template #default="{ row }">{{ row.itemName || row.itemCode || row.itemType || '-' }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="140" align="center">
                                    <template #default="{ row }">{{ enumText('clearing.feeCategoryValue', row.feeCategory) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center">
                                    <template #default="{ row }">
                                        <DirectionTag :direction="row.direction" :label="enumText('clearing.directionValue', row.direction)" />
                                    </template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.calculationBasis')" min-width="160" align="right">
                                    <template #default="{ row }"><CurrencyAmountDisplay :amount="row.basisAmount" :currency="row.basisCurrency" :locale="String(locale)" align="end" /></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.clearingAmount')" min-width="160" align="right">
                                    <template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.recordStatus')" width="130" align="center">
                                    <template #default="{ row }">{{ enumText('clearing.recordStatusValue', row.recordStatus) }}</template>
                                </el-table-column>
                            </StandardTable>
                            <el-pagination
                                v-if="clearingTransactionTotal > 0 && !clearingTransactionError"
                                v-model:current-page="clearingTransactionPage"
                                v-model:page-size="clearingTransactionPageSize"
                                class="transaction-finance-detail__pagination"
                                :total="clearingTransactionTotal"
                                :page-sizes="[10, 20, 50, 100]"
                                layout="total, sizes, prev, pager, next"
                                background
                                @current-change="loadClearingTransactions"
                                @size-change="resetClearingTransactionPage"
                            />
                        </section>

                        <section class="transaction-finance-detail__section">
                            <div class="transaction-finance-detail__heading">
                                <strong>{{ t('transaction.clearing.reserveLedger') }}</strong>
                                <el-tag size="small" type="warning" effect="plain">{{ clearingReserveLoading ? '…' : clearingReserveError ? '—' : clearingReserveTotal }}</el-tag>
                            </div>
                            <div v-if="clearingReserveError" class="transaction-finance-detail__error">
                                <el-alert :title="t('transaction.clearing.reserveDetailLoadFailed')" type="error" :closable="false" show-icon />
                                <el-button :icon="Refresh" @click="loadClearingReserves">{{ t('common.refresh') }}</el-button>
                            </div>
                            <StandardTable
                                v-else
                                v-loading="clearingReserveLoading"
                                table-key="transaction-finance-clearing-reserves"
                                :data="clearingReserveRows"
                                row-key="reserveClearingDetailNo"
                                size="small"
                                :empty-text="t('transaction.detail.empty')"
                            >
                                <el-table-column prop="lineNo" :label="t('transaction.clearing.lineNo')" width="72" align="center" />
                                <el-table-column :label="t('transaction.clearing.reserveAction')" min-width="170" align="center">
                                    <template #default="{ row }">{{ row.itemName || row.itemCode || row.reserveActionType || '-' }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center">
                                    <template #default="{ row }">
                                        <DirectionTag :direction="row.direction" :label="enumText('clearing.directionValue', row.direction)" />
                                    </template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.retainedAmount')" min-width="150" align="right">
                                    <template #default="{ row }"><CurrencyAmountDisplay :amount="row.retainedAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" /></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.returnedAmount')" min-width="150" align="right">
                                    <template #default="{ row }"><CurrencyAmountDisplay :amount="row.returnedAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" /></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.clearing.remainingAmount')" min-width="150" align="right">
                                    <template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.reserveCurrency" :exponent="row.reserveCurrencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                                </el-table-column>
                                <el-table-column prop="expectedReserveReleaseDate" :label="t('transaction.clearing.expectedReleaseDate')" width="150" align="center" />
                            </StandardTable>
                            <el-pagination
                                v-if="clearingReserveTotal > 0 && !clearingReserveError"
                                v-model:current-page="clearingReservePage"
                                v-model:page-size="clearingReservePageSize"
                                class="transaction-finance-detail__pagination"
                                :total="clearingReserveTotal"
                                :page-sizes="[10, 20, 50, 100]"
                                layout="total, sizes, prev, pager, next"
                                background
                                @current-change="loadClearingReserves"
                                @size-change="resetClearingReservePage"
                            />
                        </section>
                    </template>
                    <el-empty
                        v-else-if="clearingLoaded && !clearingLoading"
                        :description="t('transaction.detail.finance.clearingEmpty')"
                    />
                </div>
            </el-tab-pane>

            <el-tab-pane
                v-if="canViewReconciliation"
                :label="t('transaction.detail.finance.reconciliation')"
                name="reconciliation"
            >
                <div v-loading="reconciliationLoading" class="transaction-finance-detail__panel">
                    <div v-if="reconciliationError" class="transaction-finance-detail__error">
                        <el-alert :title="reconciliationError" type="error" :closable="false" show-icon />
                        <el-button :icon="Refresh" @click="loadReconciliation(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="reconciliationRows.length">
                        <StandardTable
                            table-key="transaction-finance-reconciliation"
                            :data="reconciliationRows"
                            row-key="transactionId"
                            size="small"
                            :empty-text="t('transaction.detail.finance.reconciliationEmpty')"
                        >
                            <el-table-column :label="t('transaction.fields.transactionId')" min-width="230" fixed="left" align="center">
                                <template #default="{ row }">
                                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" wrap />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.merchantId')" min-width="150" align="center">
                                <template #default="{ row }">
                                    <CopyableText :value="row.merchantId" :label="t('transaction.fields.merchantId')" wrap />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center">
                                <template #default="{ row }">
                                    <CopyableText :value="row.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.transactionType')" width="140" align="center">
                                <template #default="{ row }">
                                    <TransactionTypeDisplay :value="row.transactionType" :label="optionText(typeOptions, row.transactionType)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.reconciliationStatus')" width="150" align="center">
                                <template #default="{ row }">
                                    <TransactionStageStatusDisplay domain="reconciliation" :value="row.reconciliationStatus" :label="statusText(row.reconciliationStatus)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.settlementStatus')" width="140" align="center">
                                <template #default="{ row }">
                                    <TransactionStageStatusDisplay domain="settlement" :value="row.settlementStatus" :label="statusText(row.settlementStatus)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.accountingStatus')" width="140" align="center">
                                <template #default="{ row }">
                                    <el-tag size="small" :type="financeStatusTagType(row.accountingStatus)">
                                        {{ statusText(row.accountingStatus) }}
                                    </el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="180" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.fields.operationTime')" min-width="180" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime :value="row.operationTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                                </template>
                            </el-table-column>
                        </StandardTable>
                    </template>
                    <el-empty
                        v-else-if="reconciliationLoaded && !reconciliationLoading"
                        :description="t('transaction.detail.finance.reconciliationEmpty')"
                    />
                </div>
            </el-tab-pane>

            <el-tab-pane
                v-if="canViewSettlement"
                :label="t('transaction.detail.finance.settlement')"
                name="settlement"
            >
                <div v-loading="settlementLoading" class="transaction-finance-detail__panel">
                    <div v-if="settlementError" class="transaction-finance-detail__error">
                        <el-alert :title="settlementError" type="error" :closable="false" show-icon />
                        <el-button :icon="Refresh" @click="loadSettlement(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else>
                        <TransactionFeeBreakdown
                            v-if="clearingDetail?.feeFacts?.settlement.length"
                            :facts="{ ...clearingDetail.feeFacts, sourceAction: null }"
                            :transaction-id="transactionId"
                            :transaction-type="clearingDetail.summary.transactionType"
                            :settlement-status="clearingDetail.summary.settlementStatus"
                            :locale="String(locale)"
                        />
                        <StandardTable
                            table-key="transaction-finance-settlement-items"
                            :data="settlementItems"
                            row-key="settlementResultItemNo"
                            size="small"
                            :empty-text="t('transaction.detail.finance.settlementEmpty')"
                        >
                            <el-table-column prop="settlementResultItemNo" :label="t('transaction.settlement.resultItemNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="190" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="150" align="center">
                                <template #default="{ row }">{{ enumText('settlement.resultItemTypeValue', row.resultItemType) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="140" align="center">
                                <template #default="{ row }">{{ enumText('clearing.feeCategoryValue', row.feeCategory) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center">
                                <template #default="{ row }">
                                    <DirectionTag :direction="row.direction" :label="enumText('clearing.directionValue', row.direction)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="160" align="right">
                                <template #default="{ row }"><CurrencyAmountDisplay fee-precision :amount="row.sourceAmountExact ?? row.sourceAmount" :currency="row.sourceCurrency" :exponent="row.sourceCurrencyExponent" :locale="String(locale)" align="end" /></template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.directRate')" min-width="150" align="right">
                                <template #default="{ row }">{{ rateText(row.directRate, String(locale)) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="160" align="right">
                                <template #default="{ row }"><CurrencyAmountDisplay fee-precision :amount="row.targetAmountExact ?? row.targetAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                            </el-table-column>
                            <el-table-column prop="businessDate" :label="t('transaction.settlement.businessDate')" width="130" align="center" />
                        </StandardTable>
                        <el-pagination
                            v-if="settlementTotal > 0"
                            v-model:current-page="settlementPage"
                            v-model:page-size="settlementPageSize"
                            class="transaction-finance-detail__pagination"
                            :total="settlementTotal"
                            :page-sizes="[10, 20, 50, 100]"
                            layout="total, sizes, prev, pager, next"
                            background
                            @current-change="handleSettlementPageChange"
                            @size-change="resetSettlementPage"
                        />
                    </template>
                </div>
            </el-tab-pane>

            <el-tab-pane
                v-if="canViewReserve"
                :label="t('transaction.detail.finance.reserveSettlement')"
                name="reserve"
            >
                <div v-loading="reserveLoading" class="transaction-finance-detail__panel">
                    <div v-if="reserveError" class="transaction-finance-detail__error">
                        <el-alert :title="reserveError" type="error" :closable="false" show-icon />
                        <el-button :icon="Refresh" @click="loadReserve(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else>
                        <StandardTable
                            table-key="transaction-finance-reserve-items"
                            :data="reserveItems"
                            row-key="reserveActionNo"
                            size="small"
                            :empty-text="t('transaction.detail.finance.reserveEmpty')"
                        >
                            <el-table-column :label="t('transaction.settlement.originalPaymentTransactionNo')" min-width="220" fixed="left" align="center">
                                <template #default="{ row }">
                                    <CopyableText :value="row.sourceTransactionId" :label="t('transaction.settlement.originalPaymentTransactionNo')" wrap />
                                </template>
                            </el-table-column>
                            <el-table-column prop="reserveActionNo" :label="t('transaction.settlement.reserveActionNo')" min-width="220" align="center" show-overflow-tooltip />
                            <el-table-column prop="reserveNo" :label="t('transaction.settlement.reserveNo')" min-width="190" align="center" show-overflow-tooltip />
                            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="190" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('transaction.settlement.reserveActionType')" min-width="150" align="center">
                                <template #default="{ row }">{{ enumText('settlement.reserveActionTypeValue', row.actionType) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.clearing.direction')" width="100" align="center">
                                <template #default="{ row }">
                                    <DirectionTag :direction="row.direction" :label="enumText('clearing.directionValue', row.direction)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.postingAmount')" min-width="160" align="right">
                                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" /></template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.remainingAmount')" min-width="160" align="right">
                                <template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.settlement.reserveStatus')" min-width="140" align="center">
                                <template #default="{ row }">{{ enumText('settlement.reserveStatusValue', row.reserveStatus) }}</template>
                            </el-table-column>
                            <el-table-column prop="expectedReleaseDate" :label="t('transaction.settlement.expectedReleaseDate')" width="150" align="center" />
                            <el-table-column :label="t('transaction.settlement.actionTime')" min-width="180" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime :value="row.actionTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                                </template>
                            </el-table-column>
                        </StandardTable>
                        <el-pagination
                            v-if="reserveTotal > 0"
                            v-model:current-page="reservePage"
                            v-model:page-size="reservePageSize"
                            class="transaction-finance-detail__pagination"
                            :total="reserveTotal"
                            :page-sizes="[10, 20, 50, 100]"
                            layout="total, sizes, prev, pager, next"
                            background
                            @current-change="handleReservePageChange"
                            @size-change="resetReservePage"
                        />
                    </template>
                </div>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { TransactionFeeBreakdown, transactionFeeText, type FeeSourceAction, TransactionStageStatusDisplay, CurrencyAmountDisplay, DirectionTag, TransactionTypeDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import {
    getSettlementReconciliationRecordsByTransaction,
    searchSettlementReserveItemsByTransaction,
    searchSettlementResultItemsByTransaction,
    type SettlementReconciliationRecord,
    type SettlementReserveItem,
    type SettlementResultItem,
} from '@/api/settlement';
import {
    getClearingRecordDetail,
    searchClearingReserveDetails,
    searchClearingTransactionDetails,
    type ClearingRecordDetail,
    type ClearingReserveLine,
    type ClearingTransactionLine,
    type TransactionDetail,
    type TransactionOperation,
} from '@/api/transaction';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { rateText } from '@/views/settlement/shared';
import { optionText, statusOptionTagType, type TransactionDictOption } from '../shared';
import CopyableText from './CopyableText.vue';

type FinanceSection = 'clearing' | 'reconciliation' | 'settlement' | 'reserve';

const props = defineProps<{
    active: boolean;
    detail: TransactionDetail;
    focusTransactionId?: string;
    displayTimeZone: string;
    typeOptions: TransactionDictOption[];
}>();

const { t, te, locale } = useI18n();
const userStore = useUserStore();
const canViewClearing = computed(() => userStore.hasPermission('clearing:record:detail'));
const canViewReconciliation = computed(() => userStore.hasPermission('reconciliation:record:detail'));
const canViewSettlement = computed(() => userStore.hasPermission('settlement:result-item:transaction-detail'));
const canViewReserve = computed(() => userStore.hasPermission('settlement:reserve-item:transaction-detail'));
const activeSection = ref<FinanceSection>('reconciliation');

const focusedOperation = computed<TransactionOperation | undefined>(() => {
    if (!props.focusTransactionId) return undefined;
    return props.detail.operations?.find((item) => item.transactionId === props.focusTransactionId);
});

const feeAction = ref<FeeSourceAction | null>(null);
watch(() => [props.focusTransactionId, props.detail.order?.rootTransactionId], () => {
    feeAction.value = null;
});
const transactionId = computed(() => feeAction.value?.transactionId || focusedOperation.value?.transactionId
    || props.detail.order?.rootTransactionId
    || '');
const transactionDateTime = computed(() => feeAction.value?.transactionDateTime || focusedOperation.value?.transactionDateTime
    || props.detail.order?.transactionDateTime
    || '');
const identityKey = computed(() => `${transactionId.value}|${transactionDateTime.value}`);

const rawFeeLinesVisible = ref(false);
const clearingDetail = ref<ClearingRecordDetail | null>(null);
const clearingLoading = ref(false);
const clearingLoaded = ref(false);
const clearingError = ref('');
const clearingTransactionRows = ref<ClearingTransactionLine[]>([]);
const clearingTransactionLoading = ref(false);
const clearingTransactionError = ref(false);
const clearingTransactionPage = ref(1);
const clearingTransactionPageSize = ref(10);
const clearingTransactionTotal = ref(0);
const clearingReserveRows = ref<ClearingReserveLine[]>([]);
const clearingReserveLoading = ref(false);
const clearingReserveError = ref(false);
const clearingReservePage = ref(1);
const clearingReservePageSize = ref(10);
const clearingReserveTotal = ref(0);
let clearingStateVersion = 0;
let clearingTransactionRequestId = 0;
let clearingReserveRequestId = 0;

const reconciliationRows = ref<SettlementReconciliationRecord[]>([]);
const reconciliationLoading = ref(false);
const reconciliationLoaded = ref(false);
const reconciliationError = ref('');

const settlementItems = ref<SettlementResultItem[]>([]);
const settlementLoading = ref(false);
const settlementLoaded = ref(false);
const settlementError = ref('');
const settlementPage = ref(1);
const settlementPageSize = ref(20);
const settlementTotal = ref(0);

const reserveItems = ref<SettlementReserveItem[]>([]);
const reserveLoading = ref(false);
const reserveLoaded = ref(false);
const reserveError = ref('');
const reservePage = ref(1);
const reservePageSize = ref(20);
const reserveTotal = ref(0);

watch([identityKey, canViewClearing, canViewReconciliation, canViewSettlement, canViewReserve], () => {
    resetState();
    if (props.active) ensureActiveSectionLoaded();
}, { immediate: true });

watch(() => props.active, (active) => {
    if (active) ensureActiveSectionLoaded();
}, { immediate: true });

watch(activeSection, () => {
    if (props.active) ensureActiveSectionLoaded();
});

function resetState() {
    clearingStateVersion += 1;
    clearingTransactionRequestId += 1;
    clearingReserveRequestId += 1;
    activeSection.value = defaultSection();
    clearingDetail.value = null;
    rawFeeLinesVisible.value = false;
    clearingLoading.value = false;
    clearingLoaded.value = false;
    clearingError.value = '';
    clearingTransactionRows.value = [];
    clearingTransactionLoading.value = false;
    clearingTransactionError.value = false;
    clearingTransactionPage.value = 1;
    clearingTransactionTotal.value = 0;
    clearingReserveRows.value = [];
    clearingReserveLoading.value = false;
    clearingReserveError.value = false;
    clearingReservePage.value = 1;
    clearingReserveTotal.value = 0;
    reconciliationRows.value = [];
    reconciliationLoading.value = false;
    reconciliationLoaded.value = false;
    reconciliationError.value = '';
    settlementItems.value = [];
    settlementLoading.value = false;
    settlementLoaded.value = false;
    settlementError.value = '';
    settlementPage.value = 1;
    settlementTotal.value = 0;
    reserveItems.value = [];
    reserveLoading.value = false;
    reserveLoaded.value = false;
    reserveError.value = '';
    reservePage.value = 1;
    reserveTotal.value = 0;
}

function defaultSection(): FinanceSection {
    if (canViewClearing.value) return 'clearing';
    if (canViewReconciliation.value) return 'reconciliation';
    if (canViewSettlement.value) return 'settlement';
    return 'reserve';
}

function ensureActiveSectionLoaded() {
    if (!transactionId.value || !transactionDateTime.value) return;
    if (activeSection.value === 'clearing') loadClearing();
    if (activeSection.value === 'reconciliation') loadReconciliation();
    if (activeSection.value === 'settlement') {
        loadSettlement();
        if (canViewClearing.value) loadClearing();
    }
    if (activeSection.value === 'reserve') loadReserve();
}

async function loadReconciliation(force = false) {
    if (!canViewReconciliation.value
        || reconciliationLoading.value
        || (reconciliationLoaded.value && !force)) return;
    const requestIdentity = identityKey.value;
    reconciliationLoading.value = true;
    reconciliationError.value = '';
    try {
        const result = await getSettlementReconciliationRecordsByTransaction(
            transactionId.value,
            transactionDateTime.value,
        );
        if (requestIdentity !== identityKey.value) return;
        reconciliationRows.value = result || [];
        reconciliationLoaded.value = true;
    } catch (error: unknown) {
        if (requestIdentity !== identityKey.value) return;
        reconciliationRows.value = [];
        reconciliationLoaded.value = true;
        reconciliationError.value = errorMessage(
            error,
            t('transaction.detail.finance.reconciliationLoadFailed'),
        );
    } finally {
        if (requestIdentity === identityKey.value) reconciliationLoading.value = false;
    }
}

async function loadClearing(force = false) {
    if (!canViewClearing.value || clearingLoading.value || (clearingLoaded.value && !force)) return;
    const requestIdentity = identityKey.value;
    const requestVersion = clearingStateVersion;
    clearingTransactionRequestId += 1;
    clearingReserveRequestId += 1;
    clearingTransactionRows.value = [];
    clearingTransactionLoading.value = false;
    clearingTransactionError.value = false;
    clearingTransactionPage.value = 1;
    clearingTransactionTotal.value = 0;
    clearingReserveRows.value = [];
    clearingReserveLoading.value = false;
    clearingReserveError.value = false;
    clearingReservePage.value = 1;
    clearingReserveTotal.value = 0;
    clearingLoading.value = true;
    clearingError.value = '';
    try {
        const result = await getClearingRecordDetail(transactionId.value, transactionDateTime.value);
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value) return;
        clearingDetail.value = result;
        clearingLoaded.value = true;
        if (result?.summary) {
            void Promise.all([loadClearingTransactions(), loadClearingReserves()]);
        }
    } catch (error: unknown) {
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value) return;
        clearingDetail.value = null;
        clearingLoaded.value = true;
        clearingError.value = errorMessage(error, t('transaction.clearing.detailLoadFailed'));
    } finally {
        if (requestVersion === clearingStateVersion && requestIdentity === identityKey.value) clearingLoading.value = false;
    }
}

async function loadClearingTransactions() {
    if (!canViewClearing.value || !clearingDetail.value?.summary) return;
    const requestIdentity = identityKey.value;
    const requestVersion = clearingStateVersion;
    const requestId = ++clearingTransactionRequestId;
    clearingTransactionLoading.value = true;
    clearingTransactionError.value = false;
    try {
        const result = await searchClearingTransactionDetails(
            transactionId.value,
            transactionDateTime.value,
            clearingTransactionPage.value,
            clearingTransactionPageSize.value,
        );
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value
            || requestId !== clearingTransactionRequestId) return;
        clearingTransactionRows.value = result.records || [];
        clearingTransactionTotal.value = result.total || 0;
    } catch {
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value
            || requestId !== clearingTransactionRequestId) return;
        clearingTransactionRows.value = [];
        clearingTransactionTotal.value = 0;
        clearingTransactionError.value = true;
    } finally {
        if (requestVersion === clearingStateVersion && requestIdentity === identityKey.value
            && requestId === clearingTransactionRequestId) clearingTransactionLoading.value = false;
    }
}

async function loadClearingReserves() {
    if (!canViewClearing.value || !clearingDetail.value?.summary) return;
    const requestIdentity = identityKey.value;
    const requestVersion = clearingStateVersion;
    const requestId = ++clearingReserveRequestId;
    clearingReserveLoading.value = true;
    clearingReserveError.value = false;
    try {
        const result = await searchClearingReserveDetails(
            transactionId.value,
            transactionDateTime.value,
            clearingReservePage.value,
            clearingReservePageSize.value,
        );
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value
            || requestId !== clearingReserveRequestId) return;
        clearingReserveRows.value = result.records || [];
        clearingReserveTotal.value = result.total || 0;
    } catch {
        if (requestVersion !== clearingStateVersion || requestIdentity !== identityKey.value
            || requestId !== clearingReserveRequestId) return;
        clearingReserveRows.value = [];
        clearingReserveTotal.value = 0;
        clearingReserveError.value = true;
    } finally {
        if (requestVersion === clearingStateVersion && requestIdentity === identityKey.value
            && requestId === clearingReserveRequestId) clearingReserveLoading.value = false;
    }
}

function resetClearingTransactionPage() {
    clearingTransactionPage.value = 1;
    void loadClearingTransactions();
}

function resetClearingReservePage() {
    clearingReservePage.value = 1;
    void loadClearingReserves();
}

async function loadSettlement(force = false) {
    if (!canViewSettlement.value || settlementLoading.value || (settlementLoaded.value && !force)) return;
    const requestIdentity = identityKey.value;
    settlementLoading.value = true;
    settlementError.value = '';
    try {
        const result = await searchSettlementResultItemsByTransaction(
            transactionId.value,
            transactionDateTime.value,
            settlementPage.value,
            settlementPageSize.value,
        );
        if (requestIdentity !== identityKey.value) return;
        settlementItems.value = result.records || [];
        settlementTotal.value = result.total || 0;
        settlementLoaded.value = true;
    } catch (error: unknown) {
        if (requestIdentity !== identityKey.value) return;
        settlementItems.value = [];
        settlementTotal.value = 0;
        settlementLoaded.value = true;
        settlementError.value = errorMessage(error, t('transaction.detail.finance.settlementLoadFailed'));
    } finally {
        if (requestIdentity === identityKey.value) settlementLoading.value = false;
    }
}

async function loadReserve(force = false) {
    if (!canViewReserve.value || reserveLoading.value || (reserveLoaded.value && !force)) return;
    const requestIdentity = identityKey.value;
    reserveLoading.value = true;
    reserveError.value = '';
    try {
        const result = await searchSettlementReserveItemsByTransaction(
            transactionId.value,
            transactionDateTime.value,
            reservePage.value,
            reservePageSize.value,
        );
        if (requestIdentity !== identityKey.value) return;
        reserveItems.value = result.records || [];
        reserveTotal.value = result.total || 0;
        reserveLoaded.value = true;
    } catch (error: unknown) {
        if (requestIdentity !== identityKey.value) return;
        reserveItems.value = [];
        reserveTotal.value = 0;
        reserveLoaded.value = true;
        reserveError.value = errorMessage(error, t('transaction.detail.finance.reserveLoadFailed'));
    } finally {
        if (requestIdentity === identityKey.value) reserveLoading.value = false;
    }
}

function resetSettlementPage() {
    settlementPage.value = 1;
    loadSettlement(true);
}

function handleSettlementPageChange() {
    loadSettlement(true);
}

function resetReservePage() {
    reservePage.value = 1;
    loadReserve(true);
}

function handleReservePageChange() {
    loadReserve(true);
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const key = `transaction.${group}.${value}`;
    return te(key) ? t(key) : value;
}

function statusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.statusOption.${value}`;
    return te(key) ? t(key) : value;
}

function clearingStatusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.clearing.status.${value}`;
    return te(key) ? t(key) : value;
}

function financeStatusTagType(value?: string) {
    return statusOptionTagType(value);
}

function errorMessage(error: unknown, fallback: string) {
    const record = error as { friendlyMessage?: string; message?: string } | null;
    const message = record?.friendlyMessage || record?.message;
    return message && message.toLowerCase() !== 'not found' ? message : fallback;
}
</script>

<style scoped>
.transaction-finance-detail__panel {
    min-height: 220px;
}

.transaction-finance-detail__summary :deep(.el-descriptions__content) {
    text-align: center;
}

.transaction-finance-detail__summary :deep(.transaction-finance-detail__money-cell) {
    font-variant-numeric: tabular-nums;
}

.transaction-finance-detail__section {
    margin-top: 18px;
}

.transaction-finance-detail__heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    margin-bottom: 8px;
    color: var(--el-text-color-primary);
    font-size: 14px;
}

.transaction-finance-detail__error {
    display: flex;
    align-items: center;
    gap: 12px;
}

.transaction-finance-detail__error :deep(.el-alert) {
    flex: 1;
}

.transaction-finance-detail__pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 14px;
}

@media (max-width: 900px) {
    .transaction-finance-detail__error {
        align-items: stretch;
        flex-direction: column;
    }

    .transaction-finance-detail__pagination {
        justify-content: flex-start;
        overflow-x: auto;
        padding-bottom: 4px;
    }
}
</style>
