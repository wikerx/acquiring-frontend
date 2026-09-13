<template>
    <section class="transaction-finance-detail">
        <h3 class="transaction-finance-detail__title">{{ t('transaction.order.financeTitle') }}</h3>
        <el-tabs v-model="activeTab" class="transaction-finance-detail__tabs settlement-navigation-tabs">
            <el-tab-pane v-if="canViewClearing" name="clearing">
                <template #label><span class="settlement-tab-label"><el-icon><DataAnalysis /></el-icon>{{ t('transaction.order.clearingDetails') }}</span></template>
                <div v-loading="clearingLoading" class="transaction-finance-detail__panel">
                    <div v-if="clearingError" class="transaction-finance-detail__error">
                        <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.financeLoadFailed')" />
                        <el-button :icon="Refresh" @click="loadClearing(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="clearingDetail?.summary">
                        <div class="transaction-finance-detail__summary">
                            <div>
                                <span>{{ t('transaction.order.clearingStatus') }}</span>
                                <el-tag size="small" :type="processingStatusType(clearingDetail.summary.clearingStatus)" effect="plain">
                                    {{ clearingStatusText(clearingDetail.summary.clearingStatus) }}
                                </el-tag>
                            </div>
                            <div>
                                <span>{{ t('transaction.order.transactionType') }}</span>
                                <strong>{{ enumText('transactionType', clearingDetail.summary.transactionType) }}</strong>
                            </div>
                            <div>
                                <span>{{ t('transaction.order.settlementStatus') }}</span>
                                <strong>{{ statusText(clearingDetail.summary.settlementStatus) }}</strong>
                            </div>
                            <div class="is-money">
                                <span>{{ t('transaction.order.transactionLabelAmount') }}</span>
                                <strong>{{ money(clearingDetail.summary.labelAmount, clearingDetail.summary.labelCurrency) }}</strong>
                            </div>
                            <div class="is-money">
                                <span>{{ t('transaction.order.grossAmount') }}</span>
                                <strong>{{ money(clearingDetail.summary.grossLabelAmount, clearingDetail.summary.labelCurrency) }}</strong>
                            </div>
                            <div class="is-money">
                                <span>{{ t('transaction.order.platformFee') }}</span>
                                <strong>{{ money(clearingDetail.summary.platformFeeAmount, clearingDetail.summary.labelCurrency) }}</strong>
                            </div>
                            <div class="is-money">
                                <span>{{ t('transaction.order.reserveAmount') }}</span>
                                <strong>{{ money(clearingDetail.summary.reserveAmount, clearingDetail.summary.labelCurrency) }}</strong>
                            </div>
                            <div>
                                <span>{{ t('transaction.order.settlementEligibleDate') }}</span>
                                <strong>{{ clearingDetail.summary.settlementEligibleDate || '-' }}</strong>
                            </div>
                            <div>
                                <span>{{ t('settlement.transactionTime') }}</span>
                                <BaseDateTime :value="clearingDetail.summary.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                            </div>
                        </div>

                        <section class="transaction-finance-detail__section">
                            <div class="transaction-finance-detail__heading">
                                <strong>{{ t('transaction.order.transactionClearingItems') }}</strong>
                                <el-tag size="small" effect="plain">{{ clearingDetail.transactionDetails?.length || 0 }}</el-tag>
                            </div>
                            <el-table :data="clearingDetail.transactionDetails || []" row-key="clearingDetailNo" border size="small" class="transaction-finance-detail__table">
                                <el-table-column prop="lineNo" :label="t('transaction.order.lineNo')" width="72" align="center" />
                                <el-table-column :label="t('transaction.order.clearingItem')" min-width="176" align="center">
                                    <template #default="{ row }">{{ clearingItemText(row.itemName, row.itemCode, row.itemType) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.feeCategory')" min-width="136" align="center">
                                    <template #default="{ row }">{{ enumText('feeCategory', row.feeCategory) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="92" align="center">
                                    <template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.order.calculationBasis')" min-width="142" align="right">
                                    <template #default="{ row }">{{ money(row.basisAmount, row.basisCurrency) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.order.clearingAmount')" min-width="142" align="right">
                                    <template #default="{ row }"><strong>{{ money(row.amount, row.currency, row.currencyExponent) }}</strong></template>
                                </el-table-column>
                                <el-table-column :label="t('transaction.order.recordStatus')" width="112" align="center">
                                    <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                                </el-table-column>
                            </el-table>
                        </section>

                        <section class="transaction-finance-detail__section">
                            <div class="transaction-finance-detail__heading">
                                <strong>{{ t('transaction.order.reserveClearingItems') }}</strong>
                                <el-tag size="small" type="warning" effect="plain">{{ clearingDetail.reserveDetails?.length || 0 }}</el-tag>
                            </div>
                            <el-table :data="clearingDetail.reserveDetails || []" row-key="reserveClearingDetailNo" border size="small" class="transaction-finance-detail__table">
                                <el-table-column prop="lineNo" :label="t('transaction.order.lineNo')" width="72" align="center" />
                                <el-table-column :label="t('settlement.actionTypeLabel')" min-width="136" align="center">
                                    <template #default="{ row }">{{ enumText('actionType', row.reserveActionType) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.retainedAmount')" min-width="138" align="right">
                                    <template #default="{ row }">{{ money(row.retainedAmount, row.reserveCurrency, row.reserveCurrencyExponent) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.returnedAmount')" min-width="138" align="right">
                                    <template #default="{ row }">{{ money(row.returnedAmount, row.reserveCurrency, row.reserveCurrencyExponent) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.releasedAmount')" min-width="138" align="right">
                                    <template #default="{ row }">{{ money(row.releasedAmount, row.reserveCurrency, row.reserveCurrencyExponent) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('settlement.remainingAmount')" min-width="148" align="right">
                                    <template #default="{ row }"><strong>{{ money(row.remainingAmount, row.reserveCurrency, row.reserveCurrencyExponent) }}</strong></template>
                                </el-table-column>
                                <el-table-column prop="expectedReserveReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                                <el-table-column :label="t('transaction.order.recordStatus')" width="112" align="center">
                                    <template #default="{ row }">{{ recordStatusText(row.recordStatus) }}</template>
                                </el-table-column>
                            </el-table>
                        </section>
                    </template>
                    <el-empty v-else-if="clearingLoaded && !clearingLoading" :description="t('transaction.order.clearingEmpty')" />
                </div>
            </el-tab-pane>

            <el-tab-pane
                v-if="canViewReconciliation"
                name="reconciliation"
            >
                <template #label><span class="settlement-tab-label"><el-icon><Collection /></el-icon>{{ t('transaction.order.reconciliationDetails') }}</span></template>
                <div v-loading="reconciliationLoading" class="transaction-finance-detail__panel">
                    <div v-if="reconciliationError" class="transaction-finance-detail__error">
                        <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.financeLoadFailed')" />
                        <el-button :icon="Refresh" @click="loadReconciliation(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="reconciliationRows.length">
                        <el-table
                            :data="reconciliationRows"
                            row-key="transactionId"
                            border
                            size="small"
                            class="transaction-finance-detail__table"
                        >
                            <el-table-column prop="transactionId" :label="t('settlement.transactionId')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                            <el-table-column prop="merchantOrderNo" :label="t('transaction.order.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('transaction.order.transactionType')" min-width="126" align="center">
                                <template #default="{ row }">{{ enumText('transactionType', row.transactionType) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.order.reconciliationStatus')" min-width="126" align="center">
                                <template #default="{ row }">
                                    <el-tag size="small" :type="processingStatusType(row.reconciliationStatus)" effect="plain">{{ statusText(row.reconciliationStatus) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.order.settlementStatus')" min-width="126" align="center">
                                <template #default="{ row }">
                                    <el-tag size="small" :type="processingStatusType(row.settlementStatus)" effect="plain">{{ statusText(row.settlementStatus) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.order.accountingStatus')" min-width="126" align="center">
                                <template #default="{ row }">
                                    <el-tag size="small" :type="processingStatusType(row.accountingStatus)" effect="plain">{{ statusText(row.accountingStatus) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.transactionTime')" min-width="174" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.order.operationTime')" min-width="174" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime :value="row.operationTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                                </template>
                            </el-table-column>
                        </el-table>
                    </template>
                    <el-empty
                        v-else-if="reconciliationLoaded && !reconciliationLoading"
                        :description="t('transaction.order.reconciliationEmpty')"
                    />
                </div>
            </el-tab-pane>

            <el-tab-pane v-if="canViewSettlement" name="settlement">
                <template #label><span class="settlement-tab-label"><el-icon><Memo /></el-icon>{{ t('settlement.transactionItems') }}</span></template>
                <div v-loading="settlementLoading" class="transaction-finance-detail__panel">
                    <div v-if="settlementError" class="transaction-finance-detail__error">
                        <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.financeLoadFailed')" />
                        <el-button :icon="Refresh" @click="loadSettlement(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="settlementRows.length">
                        <el-table
                            :data="settlementRows"
                            row-key="settlementResultItemNo"
                            border
                            size="small"
                            class="transaction-finance-detail__table"
                        >
                            <el-table-column :label="t('transaction.order.settlementItem')" min-width="156" align="center">
                                <template #default="{ row }">
                                    <strong class="transaction-finance-detail__item">{{ settlementItemText(row) }}</strong>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.direction')" width="92" align="center">
                                <template #default="{ row }">
                                    <DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" />
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.sourceAmount')" min-width="138" align="right">
                                <template #default="{ row }">{{ money(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('transaction.order.settlementRate')" min-width="132" align="right">
                                <template #default="{ row }">{{ rate(row.directRate) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.targetAmount')" min-width="148" align="right">
                                <template #default="{ row }"><strong>{{ money(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</strong></template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.batchNo')" min-width="205" align="center">
                                <template #default="{ row }">
                                    <el-button link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column prop="businessDate" :label="t('settlement.businessDate')" width="118" align="center" />
                        </el-table>
                        <div v-show="settlementTotal > 0" class="transaction-finance-detail__pagination">
                            <el-pagination
                                v-model:current-page="settlementPage"
                                v-model:page-size="settlementPageSize"
                                :total="settlementTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, prev, pager, next"
                                background
                                @current-change="handleSettlementPageChange"
                                @size-change="resetSettlementPage"
                            />
                        </div>
                    </template>
                    <el-empty
                        v-else-if="settlementLoaded && !settlementLoading"
                        :description="t('transaction.order.settlementEmpty')"
                    />
                </div>
            </el-tab-pane>

            <el-tab-pane v-if="canViewReserve" name="reserve">
                <template #label><span class="settlement-tab-label"><el-icon><Lock /></el-icon>{{ t('settlement.reserveItems') }}</span></template>
                <div v-loading="reserveLoading" class="transaction-finance-detail__panel">
                    <div v-if="reserveError" class="transaction-finance-detail__error">
                        <el-alert type="error" :closable="false" show-icon :title="t('transaction.order.financeLoadFailed')" />
                        <el-button :icon="Refresh" @click="loadReserve(true)">{{ t('common.refresh') }}</el-button>
                    </div>
                    <template v-else-if="reserveRows.length">
                        <el-table
                            :data="reserveRows"
                            row-key="reserveActionNo"
                            border
                            size="small"
                            class="transaction-finance-detail__table"
                        >
                            <el-table-column :label="t('settlement.actionTypeLabel')" min-width="126" align="center">
                                <template #default="{ row }">
                                    <el-tag effect="plain">{{ enumText('actionType', row.actionType) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column prop="reserveActionNo" :label="t('settlement.reserveActionNo')" min-width="210" align="center" show-overflow-tooltip />
                            <el-table-column :label="t('settlement.amount')" min-width="138" align="right">
                                <template #default="{ row }">{{ money(row.amount, row.currency, row.currencyExponent) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.remainingAmount')" min-width="148" align="right">
                                <template #default="{ row }"><strong>{{ money(row.remainingAmount, row.currency, row.currencyExponent) }}</strong></template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.reserveStatusLabel')" min-width="126" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="reserveStatusType(row.reserveStatus)" effect="plain">{{ enumText('reserveStatus', row.reserveStatus) }}</el-tag>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.reserveNo')" min-width="190" align="center">
                                <template #default="{ row }">
                                    <el-button link type="primary" @click="openReserve(row)">{{ row.reserveNo }}</el-button>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('settlement.batchNo')" min-width="205" align="center">
                                <template #default="{ row }">
                                    <el-button v-if="row.settlementBatchNo" link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button>
                                    <span v-else>-</span>
                                </template>
                            </el-table-column>
                            <el-table-column prop="expectedReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                            <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center">
                                <template #default="{ row }">
                                    <BaseDateTime
                                        :value="row.actionTime"
                                        source-time-zone="Asia/Shanghai"
                                        :display-time-zone="displayTimeZone"
                                    />
                                </template>
                            </el-table-column>
                        </el-table>
                        <div v-show="reserveTotal > 0" class="transaction-finance-detail__pagination">
                            <el-pagination
                                v-model:current-page="reservePage"
                                v-model:page-size="reservePageSize"
                                :total="reserveTotal"
                                :page-sizes="[10, 20, 50]"
                                layout="total, sizes, prev, pager, next"
                                background
                                @current-change="handleReservePageChange"
                                @size-change="resetReservePage"
                            />
                        </div>
                    </template>
                    <el-empty
                        v-else-if="reserveLoaded && !reserveLoading"
                        :description="t('transaction.order.reserveEmpty')"
                    />
                </div>
            </el-tab-pane>
        </el-tabs>
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Collection, DataAnalysis, Lock, Memo, Refresh } from '@element-plus/icons-vue';
import { DirectionTag, formatDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
    getMerchantClearingDetailByTransaction,
    getMerchantSettlementReconciliationRecordsByTransaction,
    searchMerchantSettlementReservesByTransaction,
    searchMerchantSettlementTransactionsByTransaction,
    type MerchantClearingDetail,
    type MerchantSettlementReconciliationRecord,
    type MerchantSettlementReserveItem,
    type MerchantSettlementTransactionItem,
} from '@/api/settlementApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';

const props = defineProps<{
    transactionId: string;
    transactionDateTime: string;
    displayTimeZone?: string;
    canViewClearing: boolean;
    canViewReconciliation: boolean;
    canViewSettlement: boolean;
    canViewReserve: boolean;
}>();

const { locale, t, te } = useI18n();
const router = useRouter();
const activeTab = ref<'clearing' | 'reconciliation' | 'settlement' | 'reserve'>('clearing');
const clearingLoading = ref(false);
const clearingLoaded = ref(false);
const clearingError = ref(false);
const clearingDetail = ref<MerchantClearingDetail | null>(null);
const reconciliationLoading = ref(false);
const reconciliationLoaded = ref(false);
const reconciliationError = ref(false);
const reconciliationRows = ref<MerchantSettlementReconciliationRecord[]>([]);
const settlementLoading = ref(false);
const settlementLoaded = ref(false);
const settlementError = ref(false);
const settlementRows = ref<MerchantSettlementTransactionItem[]>([]);
const settlementTotal = ref(0);
const settlementPage = ref(1);
const settlementPageSize = ref(10);
const reserveLoading = ref(false);
const reserveLoaded = ref(false);
const reserveError = ref(false);
const reserveRows = ref<MerchantSettlementReserveItem[]>([]);
const reserveTotal = ref(0);
const reservePage = ref(1);
const reservePageSize = ref(10);
const identityKey = computed(() => `${props.transactionId}|${props.transactionDateTime}`);
let stateVersion = 0;

watch(
    [
        identityKey,
        () => props.canViewClearing,
        () => props.canViewReconciliation,
        () => props.canViewSettlement,
        () => props.canViewReserve,
    ],
    () => {
        resetState();
        ensureActiveTabLoaded();
    },
    { immediate: true },
);

watch(activeTab, ensureActiveTabLoaded);

function resetState() {
    stateVersion += 1;
    activeTab.value = props.canViewClearing
        ? 'clearing'
        : props.canViewReconciliation
        ? 'reconciliation'
        : props.canViewSettlement ? 'settlement' : 'reserve';
    clearingLoading.value = false;
    clearingLoaded.value = false;
    clearingError.value = false;
    clearingDetail.value = null;
    reconciliationLoading.value = false;
    reconciliationLoaded.value = false;
    reconciliationError.value = false;
    reconciliationRows.value = [];
    settlementLoading.value = false;
    settlementLoaded.value = false;
    settlementError.value = false;
    settlementRows.value = [];
    settlementTotal.value = 0;
    settlementPage.value = 1;
    reserveLoading.value = false;
    reserveLoaded.value = false;
    reserveError.value = false;
    reserveRows.value = [];
    reserveTotal.value = 0;
    reservePage.value = 1;
}

function ensureActiveTabLoaded() {
    if (!props.transactionId || !props.transactionDateTime) return;
    if (activeTab.value === 'clearing') void loadClearing();
    if (activeTab.value === 'reconciliation') void loadReconciliation();
    if (activeTab.value === 'settlement') void loadSettlement();
    if (activeTab.value === 'reserve') void loadReserve();
}

async function loadClearing(force = false) {
    if (!props.canViewClearing || clearingLoading.value || (clearingLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    clearingLoading.value = true;
    clearingError.value = false;
    try {
        const result = await getMerchantClearingDetailByTransaction(
            props.transactionId,
            props.transactionDateTime,
        );
        if (requestVersion !== stateVersion) return;
        clearingDetail.value = result;
        clearingLoaded.value = true;
    } catch {
        if (requestVersion !== stateVersion) return;
        clearingDetail.value = null;
        clearingLoaded.value = true;
        clearingError.value = true;
    } finally {
        if (requestVersion === stateVersion) clearingLoading.value = false;
    }
}

async function loadReconciliation(force = false) {
    if (!props.canViewReconciliation
        || reconciliationLoading.value
        || (reconciliationLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    reconciliationLoading.value = true;
    reconciliationError.value = false;
    try {
        const result = await getMerchantSettlementReconciliationRecordsByTransaction(
            props.transactionId,
            props.transactionDateTime,
        );
        if (requestVersion !== stateVersion) return;
        reconciliationRows.value = result || [];
        reconciliationLoaded.value = true;
    } catch {
        if (requestVersion !== stateVersion) return;
        reconciliationRows.value = [];
        reconciliationLoaded.value = true;
        reconciliationError.value = true;
    } finally {
        if (requestVersion === stateVersion) reconciliationLoading.value = false;
    }
}

async function loadSettlement(force = false) {
    if (!props.canViewSettlement || settlementLoading.value || (settlementLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    settlementLoading.value = true;
    settlementError.value = false;
    try {
        const result = await searchMerchantSettlementTransactionsByTransaction(
            props.transactionId, props.transactionDateTime, settlementPage.value, settlementPageSize.value,
        );
        if (requestVersion !== stateVersion) return;
        settlementRows.value = result.records || [];
        settlementTotal.value = result.total || 0;
        settlementLoaded.value = true;
    } catch {
        if (requestVersion !== stateVersion) return;
        settlementRows.value = [];
        settlementTotal.value = 0;
        settlementLoaded.value = true;
        settlementError.value = true;
    } finally {
        if (requestVersion === stateVersion) settlementLoading.value = false;
    }
}

async function loadReserve(force = false) {
    if (!props.canViewReserve || reserveLoading.value || (reserveLoaded.value && !force)) return;
    const requestVersion = stateVersion;
    reserveLoading.value = true;
    reserveError.value = false;
    try {
        const result = await searchMerchantSettlementReservesByTransaction(
            props.transactionId, props.transactionDateTime, reservePage.value, reservePageSize.value,
        );
        if (requestVersion !== stateVersion) return;
        reserveRows.value = result.records || [];
        reserveTotal.value = result.total || 0;
        reserveLoaded.value = true;
    } catch {
        if (requestVersion !== stateVersion) return;
        reserveRows.value = [];
        reserveTotal.value = 0;
        reserveLoaded.value = true;
        reserveError.value = true;
    } finally {
        if (requestVersion === stateVersion) reserveLoading.value = false;
    }
}

function resetSettlementPage() {
    settlementPage.value = 1;
    void loadSettlement(true);
}

function handleSettlementPageChange() {
    void loadSettlement(true);
}

function resetReservePage() {
    reservePage.value = 1;
    void loadReserve(true);
}

function handleReservePageChange() {
    void loadReserve(true);
}

function settlementItemText(row: MerchantSettlementTransactionItem) {
    if (row.feeCategory && row.feeCategory !== 'NONE') return enumText('feeCategory', row.feeCategory);
    return enumText('resultItemType', row.resultItemType);
}

function clearingItemText(itemName?: string, itemCode?: string, itemType?: string) {
    return itemName || itemCode || itemType || '-';
}

function clearingStatusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.order.clearingStatusValue.${value}`;
    return te(key) ? t(key) : value;
}

function recordStatusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.order.recordStatusValue.${value}`;
    return te(key) ? t(key) : value;
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
}

function statusText(value?: string) {
    if (!value) return '-';
    const key = `transaction.genericStatus.${value}`;
    return te(key) ? t(key) : value;
}

function processingStatusType(value?: string) {
    if (['SUCCESS', 'MATCHED', 'RECONCILED', 'SETTLED', 'ACCOUNTED', 'CLEARED', 'NOT_REQUIRED'].includes(value || '')) {
        return 'success';
    }
    if (['FAILED', 'MISMATCHED', 'MANUAL_REVIEW'].includes(value || '')) return 'danger';
    if (['PENDING', 'NOT_CLEARED', 'WAITING_SOURCE', 'NOT_RECONCILED', 'NOT_SETTLED', 'NOT_ACCOUNTED', 'SETTLING'].includes(value || '')) {
        return 'warning';
    }
    if (value === 'PROCESSING') return 'primary';
    return 'info';
}

function money(value?: string | number | null, currency?: string, exponent?: number | null) {
    if (value === undefined || value === null || value === '') return '-';
    const digits = typeof exponent === 'number' ? Math.min(Math.max(exponent, 0), 8) : 2;
    return `${currency || ''} ${formatDecimalAmount(value, String(locale.value), digits, digits)}`.trim();
}

function rate(value?: string | number | null) {
    return value === undefined || value === null || value === ''
        ? '-'
        : formatDecimalAmount(value, String(locale.value), 8, 16);
}

function reserveStatusType(value?: string) {
    if (value === 'RELEASED' || value === 'RETURNED') return 'success';
    if (value === 'HELD' || value === 'PARTIALLY_RETURNED' || value === 'RELEASABLE') return 'warning';
    if (value === 'FROZEN') return 'danger';
    if (value === 'REVERSED') return 'info';
    return 'primary';
}

function openBatch(settlementBatchNo: string) {
    void router.push({ path: '/finance/settlements', query: { settlementBatchNo } });
}

function openReserve(row: MerchantSettlementReserveItem) {
    void router.push({
        path: '/finance/reserves',
        query: { settlementBatchNo: row.settlementBatchNo, reserveNo: row.reserveNo },
    });
}
</script>

<style scoped>
.transaction-finance-detail { min-width: 0; }
.transaction-finance-detail__title { margin: 0 0 8px; color: #344054; font-size: 14px; }
.transaction-finance-detail__tabs { min-width: 0; }
.transaction-finance-detail__panel { min-height: 210px; }
.transaction-finance-detail__summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 18px; border-top: 1px solid #dce4ec; border-left: 1px solid #dce4ec; background: #f6f9fb; }
.transaction-finance-detail__summary > div { min-width: 0; min-height: 72px; padding: 12px; border-right: 1px solid #dce4ec; border-bottom: 1px solid #dce4ec; text-align: center; }
.transaction-finance-detail__summary > div.is-money { text-align: right; }
.transaction-finance-detail__summary span, .transaction-finance-detail__summary strong { display: block; }
.transaction-finance-detail__summary span { margin-bottom: 6px; color: #667085; font-size: 12px; }
.transaction-finance-detail__summary strong { overflow-wrap: anywhere; color: #344054; font-size: 13px; }
.transaction-finance-detail__section { margin-top: 18px; }
.transaction-finance-detail__heading { display: flex; align-items: center; justify-content: space-between; min-height: 32px; margin-bottom: 8px; color: #344054; font-size: 13px; }
.transaction-finance-detail__table { width: 100%; }
.transaction-finance-detail__item { color: #344054; font-weight: 600; }
.transaction-finance-detail__error { display: flex; align-items: center; gap: 12px; }
.transaction-finance-detail__error :deep(.el-alert) { flex: 1; }
.transaction-finance-detail__pagination { display: flex; justify-content: flex-end; padding-top: 12px; overflow-x: auto; }
@media (max-width: 720px) {
    .transaction-finance-detail__summary { grid-template-columns: 1fr; }
    .transaction-finance-detail__error { align-items: stretch; flex-direction: column; }
    .transaction-finance-detail__pagination { justify-content: flex-start; }
}
</style>
