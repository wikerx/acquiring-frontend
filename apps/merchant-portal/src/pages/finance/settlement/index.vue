<!-- Merchant 结算账单主页面：每次查询和导出由后端重新绑定当前 merchantId，仅展示已入账或已冲正批次。 -->
<template>
    <div class="page system-page merchant-redesigned-page settlement-page">
        <section class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="t('settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.batchType')"><el-select v-model="query.batchType" clearable><el-option v-for="value in batchTypes" :key="value" :label="enumText('batchType', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('common.status')"><el-select v-model="query.batchStatus" clearable><el-option v-for="value in batchStatuses" :key="value" :label="enumText('batchStatus', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('settlement.businessDate')"><el-date-picker v-model="businessDateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item class="merchant-search-actions"><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
            </el-form>
        </section>

        <section class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions"><el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></div>
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadBatches" />
            </div>
            <StandardTable v-loading="loading" table-key="merchant-settlement-batch-list" :data="rows" row-key="settlementBatchNo" size="small">
                <el-table-column prop="settlementBatchNo" :label="t('settlement.batchNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                <el-table-column prop="businessDate" :label="t('settlement.businessDate')" width="122" align="center" />
                <el-table-column :label="t('settlement.batchType')" min-width="148" align="center"><template #default="{ row }"><el-tag effect="plain">{{ enumText('batchType', row.batchType) }}</el-tag></template></el-table-column>
                <el-table-column :label="t('common.status')" min-width="130" align="center"><template #default="{ row }"><el-tag :type="statusType(row.batchStatus)" effect="plain">{{ enumText('batchStatus', row.batchStatus) }}</el-tag></template></el-table-column>
                <el-table-column prop="transactionCount" :label="t('settlement.transactionCount')" width="100" align="center" />
                <el-table-column prop="candidateCount" :label="t('settlement.settlementItemCount')" width="112" align="center" />
                <el-table-column :label="t('settlement.netAmount')" min-width="160" align="right"><template #default="{ row }"><strong>{{ money(row.netAmount, row.targetCurrency, row.targetCurrencyExponent) }}</strong></template></el-table-column>
                <el-table-column :label="t('settlement.netDirection')" width="106" align="center"><template #default="{ row }"><DirectionTag :direction="row.netDirection" :label="enumText('direction', row.netDirection)" /></template></el-table-column>
                <el-table-column :label="t('settlement.postedTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.postedTime" :source-time-zone="row.businessTimeZone" /></template></el-table-column>
                <el-table-column :label="t('common.operation')" width="92" fixed="right" align="center"><template #default="{ row }"><el-button v-if="canDetail" link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
            </StandardTable>
            <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadBatches" @size-change="handleSearch" /></div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('settlement.batchDetail')" size="min(1180px, 96vw)" append-to-body destroy-on-close class="settlement-detail-drawer">
            <div v-loading="detailLoading" class="settlement-detail">
                <template v-if="detail">
                    <div class="settlement-detail__identity"><strong>{{ detail.batch.settlementBatchNo }}</strong><el-tag :type="statusType(detail.batch.batchStatus)" effect="plain">{{ enumText('batchStatus', detail.batch.batchStatus) }}</el-tag></div>
                    <el-tabs v-model="detailTab" @tab-change="handleDetailTabChange">
                        <el-tab-pane :label="t('settlement.overview')" name="overview">
                            <el-descriptions :column="3" border size="small">
                                <el-descriptions-item :label="t('settlement.businessDate')">{{ detail.batch.businessDate }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.businessTimeZone')">{{ detail.batch.businessTimeZone }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.batchType')">{{ enumText('batchType', detail.batch.batchType) }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.settlementCurrency')">{{ detail.batch.targetCurrency }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.transactionCount')">{{ detail.batch.transactionCount }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.settlementItemCount')">{{ detail.batch.candidateCount }}</el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.netAmount')"><strong>{{ money(detail.batch.netAmount, detail.batch.targetCurrency, detail.batch.targetCurrencyExponent) }}</strong></el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.createdTime')"><BaseDateTime :value="detail.batch.createTime" :source-time-zone="detail.batch.businessTimeZone" /></el-descriptions-item>
                                <el-descriptions-item :label="t('settlement.postedTime')"><BaseDateTime :value="detail.batch.postedTime" :source-time-zone="detail.batch.businessTimeZone" /></el-descriptions-item>
                            </el-descriptions>
                            <section class="settlement-detail__section"><h3>{{ t('settlement.rateMatrix') }}</h3><el-table :data="detail.rates" border size="small">
                                <el-table-column prop="sourceCurrency" :label="t('settlement.sourceCurrency')" width="110" align="center" /><el-table-column prop="targetCurrency" :label="t('settlement.settlementCurrency')" width="110" align="center" />
                                <el-table-column :label="t('settlement.directRate')" min-width="180" align="right"><template #default="{ row }">{{ rate(row.directRate) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.rateSource')" min-width="160" align="center" show-overflow-tooltip><template #default="{ row }">{{ enumText('rateSource', row.displaySource) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.effectiveTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                                <el-table-column :label="t('settlement.lockedTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.lockedTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                            </el-table></section>
                            <section class="settlement-detail__section"><h3>{{ t('settlement.summary') }}</h3><el-table :data="detail.summaries" border size="small">
                                <el-table-column :label="t('settlement.paymentMethod')" min-width="240" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentType', row.paymentType)" :payment-methods="dimensionItems('paymentMethod', row.paymentMethod)" show-payment-type-label /></template></el-table-column>
                                <el-table-column :label="t('settlement.transactionType')" min-width="140" align="center"><template #default="{ row }">{{ enumText('transactionType', row.transactionType) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.resultItemType')" min-width="160" align="center"><template #default="{ row }">{{ enumText('resultItemType', row.resultItemType) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.feeCategory')" min-width="150" align="center"><template #default="{ row }">{{ enumText('feeCategory', row.feeCategory) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.sourceAmount')" min-width="150" align="right"><template #default="{ row }">{{ money(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.targetAmount')" min-width="150" align="right"><template #default="{ row }">{{ money(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                                <el-table-column prop="transactionCount" :label="t('settlement.transactionCount')" width="100" align="center" />
                            </el-table></section>
                        </el-tab-pane>
                        <el-tab-pane v-if="canViewTransactions" :label="t('settlement.transactionItems')" name="transactions">
                            <div class="settlement-detail__toolbar"><el-input v-model.trim="transactionQuery.sourceTransactionId" clearable :placeholder="t('settlement.transactionId')" @keyup.enter="searchTransactions" /><el-button type="primary" :icon="Search" @click="searchTransactions">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="resetTransactions">{{ t('common.reset') }}</el-button><el-button v-if="canExportTransactions" type="warning" plain :icon="Download" :loading="transactionExporting" @click="exportTransactions">{{ t('common.export') }}</el-button></div>
                            <el-table v-loading="transactionLoading" :data="transactionRows" border size="small">
                                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" fixed="left" align="center"><template #default="{ row }"><el-button link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button></template></el-table-column>
                                <el-table-column :label="t('settlement.paymentMethod')" min-width="220" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentType', row.paymentType)" :payment-methods="dimensionItems('paymentMethod', row.paymentMethod)" show-payment-type-label /></template></el-table-column>
                                <el-table-column :label="t('settlement.transactionType')" min-width="130" align="center"><template #default="{ row }">{{ enumText('transactionType', row.transactionType) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.resultItemType')" min-width="150" align="center"><template #default="{ row }">{{ enumText('resultItemType', row.resultItemType) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.feeCategory')" min-width="145" align="center"><template #default="{ row }">{{ enumText('feeCategory', row.feeCategory) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.sourceAmount')" min-width="145" align="right"><template #default="{ row }">{{ money(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.directRate')" min-width="150" align="right"><template #default="{ row }">{{ rate(row.directRate) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.targetAmount')" min-width="145" align="right"><template #default="{ row }">{{ money(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.appliedLimit')" min-width="126" align="center"><template #default="{ row }">{{ enumText('appliedLimit', row.appliedLimit) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.transactionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                            </el-table>
                            <div v-show="transactionTotal > 0" class="pagination-container"><el-pagination v-model:current-page="transactionQuery.pageNo" v-model:page-size="transactionQuery.pageSize" :total="transactionTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadTransactions" @size-change="searchTransactions" /></div>
                        </el-tab-pane>
                        <el-tab-pane v-if="canViewReserves" :label="t('settlement.reserveItems')" name="reserves">
                            <div class="settlement-detail__toolbar">
                                <el-input v-model.trim="reserveQuery.reserveNo" clearable :placeholder="t('settlement.reserveNo')" @keyup.enter="searchReserves" />
                                <el-input v-model.trim="reserveQuery.sourceTransactionId" clearable :placeholder="t('settlement.transactionId')" @keyup.enter="searchReserves" />
                                <el-button type="primary" :icon="Search" @click="searchReserves">{{ t('common.search') }}</el-button>
                                <el-button :icon="RefreshLeft" @click="resetReserves">{{ t('common.reset') }}</el-button>
                                <el-button v-if="canExportReserves" type="warning" plain :icon="Download" :loading="reserveExporting" @click="exportReserves">{{ t('common.export') }}</el-button>
                            </div>
                            <el-table v-loading="reserveLoading" :data="reserveRows" border size="small">
                                <el-table-column prop="reserveActionNo" :label="t('settlement.reserveActionNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                                <el-table-column prop="reserveNo" :label="t('settlement.reserveNo')" min-width="190" align="center"><template #default="{ row }"><el-button link type="primary" @click="openReserve(row)">{{ row.reserveNo }}</el-button></template></el-table-column>
                                <el-table-column :label="t('settlement.actionTypeLabel')" min-width="140" align="center"><template #default="{ row }">{{ enumText('actionType', row.actionType) }}</template></el-table-column>
                                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" align="center"><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openReserveTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                                <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
                                <el-table-column :label="t('settlement.amount')" min-width="145" align="right"><template #default="{ row }">{{ money(row.amount, row.currency, row.currencyExponent) }}</template></el-table-column>
                                <el-table-column :label="t('settlement.remainingAmount')" min-width="150" align="right"><template #default="{ row }"><strong>{{ money(row.remainingAmount, row.currency, row.currencyExponent) }}</strong></template></el-table-column>
                                <el-table-column :label="t('settlement.reserveStatusLabel')" min-width="130" align="center"><template #default="{ row }">{{ enumText('reserveStatus', row.reserveStatus) }}</template></el-table-column>
                                <el-table-column prop="expectedReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                                <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" :source-time-zone="detail.batch.businessTimeZone" /></template></el-table-column>
                            </el-table>
                            <div v-show="reserveTotal > 0" class="pagination-container"><el-pagination v-model:current-page="reserveQuery.pageNo" v-model:page-size="reserveQuery.pageSize" :total="reserveTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadReserves" @size-change="searchReserves" /></div>
                        </el-tab-pane>
                    </el-tabs>
                </template>
                <el-empty v-else-if="!detailLoading" />
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { DirectionTag, formatDecimalAmount, PaymentMethodDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    exportMerchantSettlementBatches, exportMerchantSettlementReserves, exportMerchantSettlementTransactions,
    getMerchantSettlementBatch, searchMerchantSettlementBatches, searchMerchantSettlementReserves,
    searchMerchantSettlementTransactions,
    type MerchantSettlementBatch, type MerchantSettlementBatchDetail,
    type MerchantSettlementReserveItem, type MerchantSettlementReserveQuery,
    type MerchantSettlementBatchQuery, type MerchantSettlementTransactionItem,
    type MerchantSettlementTransactionQuery,
} from '@/api/settlementApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    type TransactionDictOption,
} from '@/pages/transaction/shared';
import { hasPermission } from '@/utils/permission';

const { locale, t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const batchTypes = ['REGULAR', 'RESERVE_RELEASE', 'REVERSAL', 'ADJUSTMENT'];
const batchStatuses = ['POSTED', 'REVERSED'];
const canDetail = hasPermission('merchant:settlement:batch:detail');
const canExport = hasPermission('merchant:settlement:batch:export');
const canViewTransactions = hasPermission('merchant:settlement:transaction-item:list');
const canExportTransactions = hasPermission('merchant:settlement:transaction-item:export');
const canViewReserves = hasPermission('merchant:settlement:reserve-item:list');
const canExportReserves = hasPermission('merchant:settlement:reserve-item:export');
const showSearch = ref(true), loading = ref(false), exporting = ref(false);
const rows = ref<MerchantSettlementBatch[]>([]), total = ref(0);
const query = reactive<MerchantSettlementBatchQuery>({ pageNo: 1, pageSize: 10 });
const businessDateRange = ref<[string,string]>(defaultDateRange());
const detailVisible = ref(false), detailLoading = ref(false), detailTab = ref('overview');
const detail = ref<MerchantSettlementBatchDetail | null>(null);
const transactionLoading = ref(false), transactionExporting = ref(false), transactionTotal = ref(0);
const transactionRows = ref<MerchantSettlementTransactionItem[]>([]);
const transactionQuery = reactive<MerchantSettlementTransactionQuery>({ pageNo: 1, pageSize: 10 });
const reserveLoading = ref(false), reserveExporting = ref(false), reserveTotal = ref(0);
const reserveRows = ref<MerchantSettlementReserveItem[]>([]);
const reserveQuery = reactive<MerchantSettlementReserveQuery>({ pageNo: 1, pageSize: 10 });
const paymentTypeOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));

onMounted(async () => {
    const linkedBatchNo = typeof route.query.settlementBatchNo === 'string'
        ? route.query.settlementBatchNo.trim() : '';
    if (linkedBatchNo) {
        query.settlementBatchNo = linkedBatchNo;
        const linkedBusinessDate = businessDateFromBusinessNo(linkedBatchNo);
        if (linkedBusinessDate) businessDateRange.value = [linkedBusinessDate, linkedBusinessDate];
    }
    await loadDimensionDictionaries();
    await loadBatches();
    if (linkedBatchNo && canDetail) {
        const linkedRow = rows.value.find((row) => row.settlementBatchNo === linkedBatchNo);
        if (linkedRow) await openDetail(linkedRow);
    }
});

watch(locale, () => void loadDimensionDictionaries());

function batchRequest(): MerchantSettlementBatchQuery { return { ...query, beginBusinessDate: businessDateRange.value[0], endBusinessDate: businessDateRange.value[1] }; }
async function loadBatches() { loading.value = true; try { const result = await searchMerchantSettlementBatches(batchRequest()); rows.value = result.records || []; total.value = result.total || 0; } catch (error) { showError(error); } finally { loading.value = false; } }
function handleSearch() { query.pageNo = 1; loadBatches(); }
function handleReset() { Object.assign(query, { settlementBatchNo: undefined, batchType: undefined, batchStatus: undefined, pageNo: 1 }); businessDateRange.value = defaultDateRange(); loadBatches(); }
async function handleExport() { exporting.value = true; try { await exportMerchantSettlementBatches(batchRequest()); } catch (error) { showError(error); } finally { exporting.value = false; } }
async function openDetail(row: MerchantSettlementBatch) { detailVisible.value = true; detailLoading.value = true; detailTab.value = 'overview'; detail.value = null; transactionRows.value = []; transactionTotal.value = 0; reserveRows.value = []; reserveTotal.value = 0; try { detail.value = await getMerchantSettlementBatch(row.settlementBatchNo); Object.assign(transactionQuery, { settlementBatchNo: row.settlementBatchNo, sourceTransactionId: undefined, pageNo: 1 }); Object.assign(reserveQuery, { settlementBatchNo: row.settlementBatchNo, reserveNo: undefined, sourceTransactionId: undefined, pageNo: 1 }); } catch (error) { showError(error); } finally { detailLoading.value = false; } }
function handleDetailTabChange(name: string | number) { if (name === 'transactions' && !transactionRows.value.length) loadTransactions(); if (name === 'reserves' && !reserveRows.value.length) loadReserves(); }
async function loadTransactions() { if (!transactionQuery.settlementBatchNo) return; transactionLoading.value = true; try { const result = await searchMerchantSettlementTransactions({ ...transactionQuery }); transactionRows.value = result.records || []; transactionTotal.value = result.total || 0; } catch (error) { showError(error); } finally { transactionLoading.value = false; } }
function searchTransactions() { transactionQuery.pageNo = 1; loadTransactions(); }
function resetTransactions() { Object.assign(transactionQuery, { sourceTransactionId: undefined, pageNo: 1 }); loadTransactions(); }
async function exportTransactions() { transactionExporting.value = true; try { await exportMerchantSettlementTransactions({ ...transactionQuery }); } catch (error) { showError(error); } finally { transactionExporting.value = false; } }
async function loadReserves() { if (!reserveQuery.settlementBatchNo) return; reserveLoading.value = true; try { const result = await searchMerchantSettlementReserves({ ...reserveQuery }); reserveRows.value = result.records || []; reserveTotal.value = result.total || 0; } catch (error) { showError(error); } finally { reserveLoading.value = false; } }
function searchReserves() { reserveQuery.pageNo = 1; loadReserves(); }
function resetReserves() { Object.assign(reserveQuery, { reserveNo: undefined, sourceTransactionId: undefined, pageNo: 1 }); loadReserves(); }
async function exportReserves() { reserveExporting.value = true; try { await exportMerchantSettlementReserves({ ...reserveQuery }); } catch (error) { showError(error); } finally { reserveExporting.value = false; } }
function openTransaction(row: MerchantSettlementTransactionItem) {
    router.push({
        path: '/transaction/order',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: detail.value?.batch.businessTimeZone || 'Asia/Shanghai',
        },
    });
}
function openReserveTransaction(row: MerchantSettlementReserveItem) {
    router.push({ path: '/transaction/order', query: { transactionId: row.sourceTransactionId, transactionDateTime: row.sourceTransactionDateTime, transactionTimeZone: detail.value?.batch.businessTimeZone || 'Asia/Shanghai' } });
}
function openReserve(row: MerchantSettlementReserveItem) { router.push({ path: '/finance/reserves', query: { settlementBatchNo: row.settlementBatchNo, reserveNo: row.reserveNo } }); }
async function loadDimensionDictionaries() {
    const language = String(locale.value || 'zh-CN');
    const [paymentTypes, paymentMethods, transactionTypes] = await Promise.all([
        loadTransactionDictOptions('acquiring_payment_method', language).catch(() => []),
        loadTransactionDictOptions('card_brand', language).catch(() => []),
        loadTransactionDictOptions('transaction_type', language).catch(() => []),
    ]);
    paymentTypeOptions.value = paymentTypes.length ? paymentTypes : fallbackPaymentMethodOptions(t);
    paymentMethodOptions.value = paymentMethods.length ? paymentMethods : fallbackCardBrandOptions();
    transactionTypeOptions.value = transactionTypes.length ? transactionTypes : fallbackTransactionTypeOptions(t);
}
function enumText(group: string, value?: string) {
    if (!value) return '-';
    const options = group === 'paymentType' ? paymentTypeOptions.value
        : group === 'paymentMethod' ? paymentMethodOptions.value
            : group === 'transactionType' ? transactionTypeOptions.value : [];
    const option = options.find((item) => item.value === value);
    if (option) return option.label;
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
}
function dimensionItems(group: string, value?: string) { return value ? [{ value, label: enumText(group, value) }] : []; }
function money(value?: string | number | null, currency?: string, exponent?: number | null) { if (value === undefined || value === null || value === '') return '-'; const digits = typeof exponent === 'number' ? Math.min(Math.max(exponent, 0), 8) : 2; return `${currency || ''} ${formatDecimalAmount(value, String(locale.value), digits, 8)}`.trim(); }
function rate(value?: string | number | null) { return value === undefined || value === null || value === '' ? '-' : formatDecimalAmount(value, String(locale.value), 8, 16); }
function statusType(value?: string) { if (value === 'POSTED') return 'success'; if (['FAILED_RETRYABLE','MANUAL_REVIEW'].includes(value || '')) return 'danger'; if (['CANCELLED','REVERSED'].includes(value || '')) return 'info'; return 'warning'; }
function businessDateFromBusinessNo(value?: string) { const match = /^[A-Z]{2}(\d{4})(\d{2})(\d{2})-/.exec(value || ''); return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined; }
function defaultDateRange(): [string,string] { const end = new Date(), begin = new Date(); begin.setDate(begin.getDate() - 30); const text = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; return [text(begin), text(end)]; }
function showError(error: unknown) { ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || (error instanceof Error ? error.message : t('common.loadFailed'))); }
</script>

<style scoped>
.search-form :deep(.el-input), .search-form :deep(.el-select) { width: 210px; }
.search-form :deep(.el-date-editor) { width: 292px; }
.settlement-detail__identity { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 44px; padding: 0 14px; border-left: 3px solid #287d8e; background: #f6f9fb; }
.settlement-detail__identity strong { overflow-wrap: anywhere; color: #1d2939; }
.settlement-detail__section { margin-top: 22px; }
.settlement-detail__section h3 { margin: 0 0 10px; color: #344054; font-size: 14px; }
.settlement-detail__toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.settlement-detail__toolbar :deep(.el-input) { width: min(340px, 50vw); }
.settlement-detail :deep(.payment-method-display) { flex-wrap: nowrap; }
@media (max-width: 720px) { .settlement-detail__toolbar { align-items: stretch; flex-direction: column; } .settlement-detail__toolbar :deep(.el-input) { width: 100%; } }
</style>
