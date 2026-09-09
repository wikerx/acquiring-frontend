<!-- Merchant 保证金结算主页面：仅展示当前商户原标签币种动作与剩余责任，查询和导出均由后端身份隔离。 -->
<template>
    <div class="page system-page merchant-redesigned-page reserve-page">
        <section class="merchant-list-card merchant-search-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="t('settlement.reserveNo')"><el-input v-model.trim="query.reserveNo" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.transactionId')"><el-input v-model.trim="query.sourceTransactionId" clearable @keyup.enter="handleSearch" /></el-form-item>
                <el-form-item :label="t('settlement.actionTypeLabel')"><el-select v-model="query.actionType" clearable><el-option v-for="value in actionTypes" :key="value" :label="enumText('actionType', value)" :value="value" /></el-select></el-form-item>
                <el-form-item :label="t('settlement.currency')"><el-input v-model.trim="query.currency" maxlength="3" clearable /></el-form-item>
                <el-form-item :label="t('settlement.businessDate')"><el-date-picker v-model="businessDateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
                <el-form-item class="merchant-search-actions"><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
            </el-form>
        </section>

        <section class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions"><el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></div>
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>
            <StandardTable v-loading="loading" table-key="merchant-settlement-reserve-list" :data="rows" row-key="reserveActionNo" size="small">
                <el-table-column prop="reserveActionNo" :label="t('settlement.reserveActionNo')" min-width="220" fixed="left" align="center"><template #default="{ row }"><el-button class="identifier-link" link type="primary" :title="row.reserveActionNo" @click="openDetail(row)">{{ row.reserveActionNo }}</el-button></template></el-table-column>
                <el-table-column prop="reserveNo" :label="t('settlement.reserveNo')" min-width="190" align="center"><template #default="{ row }"><span class="identifier-text" :title="row.reserveNo">{{ row.reserveNo }}</span></template></el-table-column>
                <el-table-column :label="t('settlement.actionTypeLabel')" min-width="140" align="center"><template #default="{ row }"><el-tag effect="plain">{{ enumText('actionType', row.actionType) }}</el-tag></template></el-table-column>
                <el-table-column :label="t('settlement.amount')" min-width="140" align="right"><template #default="{ row }">{{ money(row.amount, row.currency, row.currencyExponent) }}</template></el-table-column>
                <el-table-column :label="t('settlement.remainingAmount')" min-width="150" align="right"><template #default="{ row }"><strong>{{ money(row.remainingAmount, row.currency, row.currencyExponent) }}</strong></template></el-table-column>
                <el-table-column :label="t('settlement.reserveStatusLabel')" min-width="126" align="center"><template #default="{ row }"><el-tag :type="reserveStatusType(row.reserveStatus)" effect="plain">{{ enumText('reserveStatus', row.reserveStatus) }}</el-tag></template></el-table-column>
                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.sourceTransactionId" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button><span v-else>-</span></template></el-table-column>
                <el-table-column prop="settlementBatchNo" :label="t('settlement.batchNo')" min-width="210" align="center" show-overflow-tooltip><template #default="{ row }"><el-button v-if="row.settlementBatchNo" link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button><span v-else>-</span></template></el-table-column>
                <el-table-column prop="businessDate" :label="t('settlement.businessDate')" width="118" align="center" />
                <el-table-column prop="expectedReleaseDate" :label="t('settlement.expectedReleaseDate')" width="138" align="center" />
                <el-table-column :label="t('settlement.actionTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.actionTime" /></template></el-table-column>
                <el-table-column :label="t('common.operation')" width="92" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
            </StandardTable>
            <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('settlement.reserveDetail')" size="min(760px, 96vw)" append-to-body destroy-on-close>
            <template v-if="detail">
                <div class="reserve-detail__identity"><strong>{{ detail.reserveActionNo }}</strong><el-tag :type="reserveStatusType(detail.reserveStatus)" effect="plain">{{ enumText('reserveStatus', detail.reserveStatus) }}</el-tag></div>
                <section class="reserve-flow">
                    <div><span>{{ t('settlement.retainedAmount') }}</span><strong>{{ money(detail.retainedAmount, detail.currency, detail.currencyExponent) }}</strong></div>
                    <div><span>{{ t('settlement.releasedAmount') }}</span><strong>{{ money(detail.releasedAmount, detail.currency, detail.currencyExponent) }}</strong></div>
                    <div class="is-current"><span>{{ t('settlement.remainingAmount') }}</span><strong>{{ money(detail.remainingAmount, detail.currency, detail.currencyExponent) }}</strong></div>
                </section>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('settlement.reserveNo')">{{ detail.reserveNo }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.actionTypeLabel')">{{ enumText('actionType', detail.actionType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.batchNo')" :span="2"><el-button v-if="detail.settlementBatchNo" link type="primary" @click="openBatch(detail.settlementBatchNo)">{{ detail.settlementBatchNo }}</el-button><span v-else>-</span></el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.transactionId')" :span="2"><el-button v-if="detail.sourceTransactionId" link type="primary" @click="openTransaction(detail)">{{ detail.sourceTransactionId }}</el-button><span v-else>-</span></el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.direction')"><DirectionTag :direction="detail.direction" :label="enumText('direction', detail.direction)" /></el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.amount')">{{ money(detail.amount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.returnedAmount')">{{ money(detail.returnedAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.debitAdjustmentAmount')">{{ money(detail.debitAdjustmentAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.creditAdjustmentAmount')">{{ money(detail.creditAdjustmentAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.reversedAmount')">{{ money(detail.reversedAmount, detail.currency, detail.currencyExponent) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.businessDate')">{{ detail.businessDate }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.expectedReleaseDate')">{{ detail.expectedReleaseDate || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('settlement.actionTime')"><BaseDateTime :value="detail.actionTime" /></el-descriptions-item>
                </el-descriptions>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { DirectionTag, formatDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import {
    exportMerchantSettlementReserves, searchMerchantSettlementReserves,
    type MerchantSettlementReserveItem, type MerchantSettlementReserveQuery,
} from '@/api/settlementApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { hasPermission } from '@/utils/permission';

const { locale, t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const actionTypes = ['HOLD','RETURN','RELEASE','ADJUSTMENT','REVERSAL_HOLD','REVERSAL_RETURN','REVERSAL_RELEASE','REVERSAL_ADJUSTMENT'];
const canExport = hasPermission('merchant:settlement:reserve-item:export');
const showSearch = ref(true), loading = ref(false), exporting = ref(false);
const rows = ref<MerchantSettlementReserveItem[]>([]), total = ref(0);
const query = reactive<MerchantSettlementReserveQuery>({ pageNo: 1, pageSize: 10 });
const businessDateRange = ref<[string,string]>(defaultDateRange());
const detailVisible = ref(false), detail = ref<MerchantSettlementReserveItem | null>(null);

onMounted(async () => {
    query.settlementBatchNo = routeText('settlementBatchNo');
    query.reserveNo = routeText('reserveNo');
    query.sourceTransactionId = routeText('sourceTransactionId');
    const linkedBusinessDate = businessDateFromBusinessNo(query.settlementBatchNo);
    if (linkedBusinessDate) businessDateRange.value = [linkedBusinessDate, linkedBusinessDate];
    await loadData();
    if (query.reserveNo) {
        const linkedRow = rows.value.find((row) => row.reserveNo === query.reserveNo);
        if (linkedRow) openDetail(linkedRow);
    }
});
function requestQuery(): MerchantSettlementReserveQuery { return { ...query, currency: query.currency?.toUpperCase() || undefined, beginBusinessDate: businessDateRange.value[0], endBusinessDate: businessDateRange.value[1] }; }
async function loadData() { loading.value = true; try { const result = await searchMerchantSettlementReserves(requestQuery()); rows.value = result.records || []; total.value = result.total || 0; } catch (error) { showError(error); } finally { loading.value = false; } }
function handleSearch() { query.pageNo = 1; loadData(); }
function handleReset() { Object.assign(query, { settlementBatchNo: undefined, reserveNo: undefined, sourceTransactionId: undefined, actionType: undefined, currency: undefined, pageNo: 1 }); businessDateRange.value = defaultDateRange(); loadData(); }
async function handleExport() { exporting.value = true; try { await exportMerchantSettlementReserves(requestQuery()); } catch (error) { showError(error); } finally { exporting.value = false; } }
function openDetail(row: MerchantSettlementReserveItem) { detail.value = row; detailVisible.value = true; }
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
function openBatch(settlementBatchNo: string) { router.push({ path: '/finance/settlements', query: { settlementBatchNo } }); }
function enumText(group: string, value?: string) { if (!value) return '-'; const key = `settlement.${group}Value.${value}`; return te(key) ? t(key) : value; }
function money(value?: string | number | null, currency?: string, exponent?: number | null) { if (value === undefined || value === null || value === '') return '-'; const digits = typeof exponent === 'number' ? Math.min(Math.max(exponent, 0), 8) : 2; return `${currency || ''} ${formatDecimalAmount(value, String(locale.value), digits, digits)}`.trim(); }
function routeText(key: string) { const value = route.query[key]; return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
function reserveStatusType(value?: string) { if (value === 'RELEASED' || value === 'RETURNED') return 'success'; if (value === 'HELD' || value === 'PARTIALLY_RETURNED' || value === 'RELEASABLE') return 'warning'; if (value === 'FROZEN') return 'danger'; if (value === 'REVERSED') return 'info'; return 'primary'; }
function businessDateFromBusinessNo(value?: string) { const match = /^[A-Z]{2}(\d{4})(\d{2})(\d{2})-/.exec(value || ''); return match ? `${match[1]}-${match[2]}-${match[3]}` : undefined; }
function defaultDateRange(): [string,string] { const end = new Date(), begin = new Date(); begin.setDate(begin.getDate() - 30); const text = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; return [text(begin), text(end)]; }
function showError(error: unknown) { ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || (error instanceof Error ? error.message : t('common.loadFailed'))); }
</script>

<style scoped>
.search-form :deep(.el-input), .search-form :deep(.el-select) { width: 205px; }
.search-form :deep(.el-date-editor) { width: 292px; }
.identifier-link, .identifier-text { display: block; min-width: 0; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.identifier-link { width: 100%; }
.reserve-detail__identity { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 46px; padding: 0 14px; border-left: 3px solid #287d8e; background: #f6f9fb; }
.reserve-detail__identity strong { overflow-wrap: anywhere; }
.reserve-flow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin: 18px 0; border: 1px solid #e1e8ef; }
.reserve-flow div { min-width: 0; padding: 14px; border-right: 1px solid #e1e8ef; }
.reserve-flow div:last-child { border-right: 0; }
.reserve-flow span { display: block; color: #667085; font-size: 12px; }
.reserve-flow strong { display: block; margin-top: 6px; overflow-wrap: anywhere; color: #344054; }
.reserve-flow .is-current { background: #edf8f6; }
@media (max-width: 640px) { .reserve-flow { grid-template-columns: 1fr; } .reserve-flow div { border-right: 0; border-bottom: 1px solid #e1e8ef; } }
</style>
