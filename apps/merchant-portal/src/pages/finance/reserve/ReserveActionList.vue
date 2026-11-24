<!-- Merchant 保证金结算主页面：仅展示当前商户原标签币种动作与剩余责任，查询和导出均由后端身份隔离。 -->
<template>
    <div class="page system-page merchant-redesigned-page reserve-page">
        <section v-if="canList || canExport" class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="t('settlement.reserveActionNo')"><el-input v-model.trim="query.reserveActionNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.reserveNo')"><el-input v-model.trim="query.reserveNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" :placeholder="t('transaction.order.merchantOrderNoPlaceholder')" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.transactionId')"><el-input v-model.trim="query.sourceTransactionId" :placeholder="t('transaction.order.transactionIdPlaceholder')" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.reserveStatusLabel')"><el-select v-model="query.reserveStatus" :placeholder="t('common.pleaseSelect')" clearable filterable><el-option v-for="value in reserveStatuses" :key="value" :label="enumText('reserveStatus', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('settlement.actionTypeLabel')"><el-select v-model="query.actionType" :placeholder="t('common.pleaseSelect')" clearable filterable><el-option v-for="value in actionTypes" :key="value" :label="enumText('actionType', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('settlement.currency')">
                    <el-select v-model="query.currency" :placeholder="t('common.pleaseSelect')" :loading="currenciesLoading" clearable filterable>
                        <template #label>
                            <CurrencyDisplay :currency="query.currency" :locale="String(locale)" size="xs" />
                        </template>
                        <el-option v-for="currency in currencies" :key="currency.alphabeticCode"
                            :value="currency.alphabeticCode" :label="currencyLabel(currency)">
                            <CurrencyDisplay :currency="currency.alphabeticCode" :locale="String(locale)" show-name size="xs" />
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('settlement.transactionTime')"><el-date-picker v-model="transactionTimeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item :label="t('settlement.expectedReleaseDate')"><el-date-picker v-model="expectedReleaseDateRange" type="daterange" value-format="YYYY-MM-DD" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item :label="t('settlement.businessDate')"><el-date-picker v-model="businessDateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item class="merchant-search-actions"><el-button v-if="canList" type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
            </el-form>
        </section>

        <section v-if="canList || canExport" class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions"><el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></div>
                <RightToolbar v-if="canList" @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>
            <StandardTable v-if="canList" v-loading="loading" table-key="merchant-settlement-reserve-list" :data="rows" row-key="reserveActionNo" size="small">
                <el-table-column prop="reserveActionNo" :label="t('settlement.reserveActionNo')" min-width="220" fixed="left" align="center"><template #default="{ row }"><el-button v-if="canDetail" class="identifier-link" link type="primary" :title="row.reserveActionNo" @click="openDetail(row.reserveActionNo)">{{ row.reserveActionNo }}</el-button><span v-else>{{ row.reserveActionNo }}</span></template></el-table-column>
                <el-table-column prop="reserveNo" :label="t('settlement.reserveNo')" min-width="190" align="center"><template #default="{ row }"><span class="identifier-text" :title="row.reserveNo">{{ row.reserveNo }}</span></template></el-table-column>
                <el-table-column prop="merchantOrderNo" :label="t('settlement.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
                <el-table-column :label="t('settlement.actionTypeLabel')" min-width="140" align="center"><template #default="{ row }"><el-tag effect="plain">{{ enumText('actionType', row.actionType) }}</el-tag></template></el-table-column>
                <el-table-column :label="t('settlement.amount')" min-width="170" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.amount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
                <el-table-column :label="t('settlement.remainingAmount')" min-width="180" align="right"><template #default="{ row }"><CurrencyAmountDisplay :amount="row.remainingAmount" :currency="row.currency" :exponent="row.currencyExponent" :locale="String(locale)" align="end" emphasized /></template></el-table-column>
                <el-table-column :label="t('settlement.reserveStatusLabel')" min-width="126" align="center"><template #default="{ row }"><el-tag :type="reserveStatusType(row.reserveStatus)" effect="plain">{{ enumText('reserveStatus', row.reserveStatus) }}</el-tag></template></el-table-column>
                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.sourceTransactionId && canViewTransaction" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                <el-table-column prop="settlementBatchNo" :label="t('settlement.batchNo')" min-width="210" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.settlementBatchNo && canViewBatch(row)" link type="primary" @click="openBatch(row)">{{ row.settlementBatchNo }}</el-button><span v-else>{{ row.settlementBatchNo || '-' }}</span></template></el-table-column>
                <el-table-column prop="businessDate" :label="t('settlement.businessDate')" width="118" align="center" />
                <el-table-column prop="expectedReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" /></template></el-table-column>
                <el-table-column v-if="canDetail" :label="t('common.operation')" width="92" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" :icon="View" @click="openDetail(row.reserveActionNo)">{{ t('common.detail') }}</el-button></template></el-table-column>
            </StandardTable>
            <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('settlement.reserveDetail')" size="min(760px, 96vw)" append-to-body destroy-on-close>
            <template v-if="detail">
                <div class="reserve-detail__identity"><strong>{{ detail.reserveActionNo }}</strong><el-tag :type="reserveStatusType(detail.reserveStatus)" effect="plain">{{ enumText('reserveStatus', detail.reserveStatus) }}</el-tag></div>
                <el-alert class="reserve-detail__status-help" type="info" :closable="false" show-icon :title="enumText('reserveStatusDescription', detail.reserveStatus)" />
                <section class="reserve-flow">
                    <div><span>{{ t('settlement.retainedAmount') }}</span><strong><CurrencyAmountDisplay :amount="detail.retainedAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" emphasized /></strong></div>
                    <div><span>{{ t('settlement.releasedAmount') }}</span><strong><CurrencyAmountDisplay :amount="detail.releasedAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" emphasized /></strong></div>
                    <div class="is-current"><span>{{ t('settlement.remainingAmount') }}</span><strong><CurrencyAmountDisplay :amount="detail.remainingAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" emphasized /></strong></div>
                </section>
                <section class="reserve-detail__section">
                    <h3>{{ t('settlement.reserveActionSection') }}</h3>
                    <el-descriptions :column="detailDescriptionColumns" border size="small" class="reserve-detail__descriptions">
                        <el-descriptions-item :label="t('settlement.actionTypeLabel')">{{ enumText('actionType', detail.actionType) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.amount')"><CurrencyAmountDisplay :amount="detail.amount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" emphasized /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.direction')"><DirectionTag :direction="detail.direction" :label="enumText('direction', detail.direction)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.actionTime')"><BaseDateTime :value="detail.actionTime" /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.businessDate')">{{ detail.businessDate }}</el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.expectedReleaseDate')">{{ detail.expectedReleaseDate || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </section>
                <section class="reserve-detail__section">
                    <h3>{{ t('settlement.reserveOtherMovements') }}</h3>
                    <el-descriptions :column="detailDescriptionColumns" border size="small" class="reserve-detail__descriptions">
                        <el-descriptions-item :label="t('settlement.returnedAmount')"><CurrencyAmountDisplay :amount="detail.returnedAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.reversedAmount')"><CurrencyAmountDisplay :amount="detail.reversedAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.debitAdjustmentAmount')"><CurrencyAmountDisplay :amount="detail.debitAdjustmentAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.creditAdjustmentAmount')"><CurrencyAmountDisplay :amount="detail.creditAdjustmentAmount" :currency="detail.currency" :exponent="detail.currencyExponent" :locale="String(locale)" /></el-descriptions-item>
                    </el-descriptions>
                </section>
                <section class="reserve-detail__section">
                    <h3>{{ t('settlement.reserveRelatedRecords') }}</h3>
                    <el-descriptions :column="detailDescriptionColumns" border size="small" class="reserve-detail__descriptions">
                        <el-descriptions-item :label="t('settlement.reserveNo')">{{ detail.reserveNo }}</el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.batchNo')"><el-button v-if="detail.settlementBatchNo && canViewBatch(detail)" link type="primary" @click="openBatch(detail)">{{ detail.settlementBatchNo }}</el-button><span v-else>{{ detail.settlementBatchNo || '-' }}</span></el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.merchantOrderNo')">{{ detail.merchantOrderNo || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('settlement.transactionId')"><el-button v-if="detail.sourceTransactionId && canViewTransaction" link type="primary" @click="openTransaction(detail)">{{ detail.sourceTransactionId }}</el-button><span v-else>-</span></el-descriptions-item>
                    </el-descriptions>
                </section>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { CurrencyAmountDisplay, CurrencyDisplay, DirectionTag, type CurrencyPresentation } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { submitSettlementReserveExport } from '@/api/exportTaskApi';
import {
    getMerchantSettlementReserveItem, searchMerchantSettlementReserves,
    type MerchantSettlementReserveItem, type MerchantSettlementReserveQuery,
} from '@/api/settlementApi';
import { systemApi } from '@/api/systemApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { hasPermission } from '@/utils/permission';
import { defaultSettlementDateRange } from '../settlement/dateRange';

const { locale, t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const actionTypes = ['HOLD','RETURN','RELEASE','ADJUSTMENT','REVERSAL_HOLD','REVERSAL_RETURN','REVERSAL_RELEASE','REVERSAL_ADJUSTMENT'];
const reserveStatuses = ['HELD','PARTIALLY_RETURNED','RELEASABLE','FROZEN','RETURNED','RELEASED','DEDUCTED','ADJUSTED','REVERSED'];
const canList = hasPermission('merchant:settlement:reserve-item:list');
const canDetail = hasPermission('merchant:settlement:reserve-item:detail');
const canViewTradeBatches = hasPermission('merchant:settlement:batch:list');
const canViewReserveBatches = hasPermission('merchant:settlement:reserve-batch:list');
const canViewTransaction = hasPermission('merchant:transaction:order:list');
const canExport = hasPermission('merchant:settlement:reserve-item:export');
const showSearch = ref(true), loading = ref(false), exporting = ref(false);
const currencies = ref<CurrencyPresentation[]>([]);
const currenciesLoading = ref(false);
const rows = ref<MerchantSettlementReserveItem[]>([]), total = ref(0);
const query = reactive<MerchantSettlementReserveQuery>({ pageNo: 1, pageSize: 10 });
const businessDateRange = ref<[string,string]>(defaultSettlementDateRange());
const transactionTimeRange = ref<[string, string] | null>(null);
const expectedReleaseDateRange = ref<[string, string] | null>(null);
const detailLoading = ref(false);
const detailVisible = ref(false), detail = ref<MerchantSettlementReserveItem | null>(null);
const detailDescriptionColumns = ref(2);

onMounted(async () => {
    syncDetailDescriptionColumns();
    if (canList || canExport) void loadCurrencies();
    window.addEventListener('resize', syncDetailDescriptionColumns);
    query.settlementBatchNo = routeText('settlementBatchNo');
    query.reserveNo = routeText('reserveNo');
    query.reserveActionNo = routeText('reserveActionNo');
    query.sourceTransactionId = routeText('sourceTransactionId');
    const linkedBusinessDate = businessDateFromBusinessNo(query.settlementBatchNo);
    if (linkedBusinessDate) businessDateRange.value = [linkedBusinessDate, linkedBusinessDate];
    if (canList) await loadData();
    if (query.reserveActionNo) {
        await openDetail(query.reserveActionNo);
    } else if (query.reserveNo) {
        const linkedRow = rows.value.find((row) => row.reserveNo === query.reserveNo);
        if (linkedRow) await openDetail(linkedRow.reserveActionNo);
    }
});
onBeforeUnmount(() => window.removeEventListener('resize', syncDetailDescriptionColumns));
async function loadCurrencies() {
    currenciesLoading.value = true;
    try {
        currencies.value = await systemApi.loadCurrencyPresentations();
    } catch (error) {
        showError(error);
    } finally {
        currenciesLoading.value = false;
    }
}
function currencyLabel(currency: CurrencyPresentation) {
    const label = String(locale.value).startsWith('zh') ? currency.chineseName : currency.englishName;
    return [currency.alphabeticCode, label].filter(Boolean).join(' ');
}
function requestQuery(): MerchantSettlementReserveQuery { return { ...query, currency: query.currency?.toUpperCase() || undefined, beginTransactionTime: transactionTimeRange.value?.[0] || undefined, endTransactionTime: transactionTimeRange.value?.[1] || undefined, beginExpectedReleaseDate: expectedReleaseDateRange.value?.[0] || undefined, endExpectedReleaseDate: expectedReleaseDateRange.value?.[1] || undefined, beginBusinessDate: businessDateRange.value[0], endBusinessDate: businessDateRange.value[1] }; }
async function loadData() { if (!canList) return; loading.value = true; try { const result = await searchMerchantSettlementReserves(requestQuery()); rows.value = result.records || []; total.value = result.total || 0; } catch (error) { showError(error); } finally { loading.value = false; } }
function handleSearch() { query.pageNo = 1; loadData(); }
function handleReset() { Object.assign(query, { settlementBatchNo: undefined, reserveNo: undefined, reserveActionNo: undefined, sourceTransactionId: undefined, merchantOrderNo: undefined, reserveStatus: undefined, actionType: undefined, currency: undefined, pageNo: 1 }); businessDateRange.value = defaultSettlementDateRange(); transactionTimeRange.value = null; expectedReleaseDateRange.value = null; loadData(); }
async function handleExport() {
    exporting.value = true;
    try {
        const task = await submitSettlementReserveExport(requestQuery());
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        exporting.value = false;
    }
}
async function openDetail(reserveActionNo: string) {
    if (!canDetail || detailLoading.value) return;
    detailLoading.value = true;
    try {
        detail.value = await getMerchantSettlementReserveItem(reserveActionNo);
        detailVisible.value = true;
    } catch (error) {
        showError(error);
    } finally {
        detailLoading.value = false;
    }
}
function openTransaction(row: MerchantSettlementReserveItem) {
    router.push({
        path: '/transaction/order',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: 'Asia/Shanghai',
        },
    });
}
function isReserveBatch(row: MerchantSettlementReserveItem) {
    return ['RELEASE', 'ADJUSTMENT', 'REVERSAL_RELEASE', 'REVERSAL_ADJUSTMENT'].includes(row.actionType);
}
function canViewBatch(row: MerchantSettlementReserveItem) {
    return isReserveBatch(row) ? canViewReserveBatches : canViewTradeBatches;
}
function openBatch(row: MerchantSettlementReserveItem) {
    if (!canViewBatch(row)) return;
    detailVisible.value = false;
    void router.push({
        path: isReserveBatch(row) ? '/finance/reserves' : '/finance/settlements',
        query: { settlementBatchNo: row.settlementBatchNo },
    });
}
function enumText(group: string, value?: string) { if (!value) return '-'; const key = `settlement.${group}Value.${value}`; return te(key) ? t(key) : value; }
function routeText(key: string) { const value = route.query[key]; return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
function reserveStatusType(value?: string) { if (value === 'RELEASED' || value === 'RETURNED') return 'success'; if (value === 'HELD' || value === 'PARTIALLY_RETURNED' || value === 'RELEASABLE') return 'warning'; if (value === 'FROZEN') return 'danger'; if (value === 'REVERSED') return 'info'; return 'primary'; }
function syncDetailDescriptionColumns() { detailDescriptionColumns.value = window.innerWidth <= 640 ? 1 : 2; }
function businessDateFromBusinessNo(value?: string) { const match = /^[A-Z]{2}(\d{4})(\d{2})(\d{2})-/.exec(value || ''); return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined; }
function showError(error: unknown) { ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || (error instanceof Error ? error.message : t('common.loadFailed'))); }
</script>

<style scoped>
.identifier-link { width: 100%; }
.reserve-detail__identity { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 46px; padding: 0 14px; border-left: 3px solid #287d8e; background: #f6f9fb; }
    .reserve-detail__identity strong { overflow-wrap: anywhere; }
    .reserve-detail__status-help { margin: 12px 0 16px; }
.reserve-detail__descriptions :deep(.el-descriptions__content) { overflow-wrap: anywhere; text-align: center; }
.reserve-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 18px 0; border: 1px solid #e1e8ef; }
.reserve-flow > div { min-width: 0; padding: 14px; border-right: 1px solid #e1e8ef; }
.reserve-flow > div:last-child { border-right: 0; }
.reserve-flow > div > span { display: block; color: #667085; font-size: 12px; }
.reserve-flow > div > strong { display: block; margin-top: 6px; overflow-wrap: anywhere; color: #344054; }
.reserve-detail__section { margin-top: 18px; }
.reserve-detail__section h3 { margin: 0 0 8px; color: var(--el-text-color-primary); font-size: 14px; }
.reserve-flow .is-current { background: #edf8f6; }
@media (max-width: 640px) { .reserve-flow { grid-template-columns: 1fr; } .reserve-flow > div { border-right: 0; border-bottom: 1px solid #e1e8ef; } }
</style>
