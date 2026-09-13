<!-- Admin 交易结算汇总：列表按真实交易去重，财务组件在抽屉中按需分页读取。 -->
<template>
    <div class="app-container settlement-list-page">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('transaction.settlement.batchNo')"><el-input v-model.trim="query.settlementBatchNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')"><MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.sourceTransactionId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.resultItemType')"><el-select v-model="query.resultItemType" clearable filterable :placeholder="t('common.pleaseSelect')"><el-option v-for="item in itemTypes" :key="item" :label="itemTypeText(item)" :value="item" /></el-select></el-form-item>
            <el-form-item :label="t('transaction.clearing.direction')"><el-select v-model="query.direction" clearable :placeholder="t('common.pleaseSelect')"><el-option :label="enumText('directionValue', 'CREDIT')" value="CREDIT" /><el-option :label="enumText('directionValue', 'DEBIT')" value="DEBIT" /></el-select></el-form-item>
            <el-form-item :label="t('transaction.settlement.targetCurrency')"><CurrencySelect v-model="query.targetCurrency" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.transactionTimeRange')"><el-date-picker v-model="transactionTimeRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss" clearable :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
            <el-form-item :label="t('transaction.settlement.businessDate')"><el-date-picker v-model="dateRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false" :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" /></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button></el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8"><el-col :span="1.5"><el-button v-hasPermi="'settlement:result-item:export'" type="warning" plain :icon="Download" :loading="exporting" @click="handleExport">{{ t('common.export') }}</el-button></el-col><el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col></el-row>

        <StandardTable v-loading="loading" table-key="admin-settlement-transactions" :data="rows" row-key="candidateId" size="small">
            <el-table-column prop="settlementBatchNo" :label="t('transaction.settlement.batchNo')" min-width="205" fixed="left" align="center"><template #default="{ row }"><el-button link type="primary" @click="openBatch(row.settlementBatchNo)">{{ row.settlementBatchNo }}</el-button></template></el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="140" align="center"><template #default="{ row }"><el-button link type="primary" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</el-button></template></el-table-column>
            <el-table-column prop="merchantOrderNo" :label="t('transaction.settlement.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
            <el-table-column prop="sourceTransactionId" :label="t('transaction.fields.transactionId')" min-width="205" align="center" show-overflow-tooltip><template #default="{ row }"><el-button link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button></template></el-table-column>
            <el-table-column :label="t('transaction.settlement.paymentTypeMethod')" min-width="190" align="center"><template #default="{ row }"><PaymentMethodDisplay :payment-types="dimensionItems('paymentTypeValue', row.paymentType)" :payment-methods="dimensionItems('paymentMethodValue', row.paymentMethod)" /></template></el-table-column>
            <el-table-column :label="t('transaction.fields.transactionType')" min-width="128" align="center"><template #default="{ row }">{{ enumText('transactionTypeValue', row.transactionType) }}</template></el-table-column>
            <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="160" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
            <el-table-column :label="t('transaction.settlement.netAmount')" min-width="170" align="right"><template #default="{ row }"><strong>{{ moneyTextByExponent(row.netTargetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</strong></template></el-table-column>
            <el-table-column :label="t('transaction.clearing.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.netDirection" :label="enumText('directionValue', row.netDirection)" /></template></el-table-column>
            <el-table-column prop="componentCount" :label="t('transaction.settlement.componentCount')" width="108" align="center" />
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="174" align="center"><template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="108" fixed="right" align="center"><template #default="{ row }"><el-button link type="primary" :icon="View" @click="openComponents(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
        </StandardTable>
        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadData" @size-change="handleSearch" /></div>

        <el-drawer v-model="componentVisible" :title="t('transaction.settlement.financialComponents')" size="min(1180px, 96vw)" destroy-on-close>
            <template v-if="selectedTransaction">
                <div class="component-identity"><div><span>{{ t('transaction.fields.transactionId') }}</span><strong>{{ selectedTransaction.sourceTransactionId }}</strong></div><div><span>{{ t('transaction.settlement.merchantOrderNo') }}</span><strong>{{ selectedTransaction.merchantOrderNo || '-' }}</strong></div><div><span>{{ t('transaction.settlement.netAmount') }}</span><strong>{{ moneyTextByExponent(selectedTransaction.netTargetAmount, selectedTransaction.targetCurrency, selectedTransaction.targetCurrencyExponent) }}</strong></div></div>
                <el-table v-loading="componentLoading" :data="componentRows" border size="small">
                    <el-table-column prop="settlementResultItemNo" :label="t('transaction.settlement.resultItemNo')" min-width="220" fixed="left" align="center" show-overflow-tooltip />
                    <el-table-column :label="t('transaction.settlement.resultItemType')" min-width="150" align="center"><template #default="{ row }">{{ itemTypeText(row.resultItemType) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.resultRole')" min-width="150" align="center"><template #default="{ row }">{{ roleText(row.resultRole) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.feeCategory')" min-width="135" align="center"><template #default="{ row }">{{ enumText('feeCategoryValue', row.feeCategory) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.clearing.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('directionValue', row.direction)" /></template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.sourceAmount')" min-width="150" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.sourceAmount, row.sourceCurrency, row.sourceCurrencyExponent) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.directRate')" min-width="150" align="right"><template #default="{ row }">{{ decimalText(row.directRate) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.targetAmount')" min-width="150" align="right"><template #default="{ row }">{{ moneyTextByExponent(row.targetAmount, row.targetCurrency, row.targetCurrencyExponent) }}</template></el-table-column>
                    <el-table-column :label="t('transaction.settlement.appliedLimit')" min-width="126" align="center"><template #default="{ row }">{{ enumText('appliedLimitValue', row.appliedLimit) }}</template></el-table-column>
                </el-table>
                <el-empty v-if="!componentLoading && !componentRows.length" :description="t('transaction.settlement.componentEmpty')" :image-size="72" />
                <div v-show="componentTotal > 0" class="pagination-container"><el-pagination v-model:current-page="componentPage" v-model:page-size="componentPageSize" :total="componentTotal" :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next" background @current-change="loadComponents" @size-change="resetComponentPage" /></div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Download, RefreshLeft, Search, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { DirectionTag, PaymentMethodDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { exportSettlementResultItems, searchSettlementResultItemComponents, searchSettlementResultItems, type SettlementResultItem, type SettlementResultItemQuery, type SettlementTransactionSummary } from '@/api/settlement';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import { businessDateFromBusinessNo, decimalText, defaultDateRange, moneyTextByExponent } from '@/views/settlement/shared';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const itemTypes = ['PRINCIPAL', 'FEE_COMPONENT', 'FEE_GROUP_FINAL', 'RESERVE_HOLD', 'RESERVE_RETURN', 'RESERVE_RELEASE', 'ADJUSTMENT', 'REVERSAL'];
const showSearch = ref(true), loading = ref(false), exporting = ref(false);
const rows = ref<SettlementTransactionSummary[]>([]), total = ref(0);
const dateRange = ref<[string, string]>(defaultDateRange());
const transactionTimeRange = ref<[string, string] | []>([]);
const query = reactive<SettlementResultItemQuery>({ beginBusinessDate: '', endBusinessDate: '', pageNo: 1, pageSize: 10 });
const componentVisible = ref(false), componentLoading = ref(false);
const componentRows = ref<SettlementResultItem[]>([]), componentTotal = ref(0);
const componentPage = ref(1), componentPageSize = ref(10);
const selectedTransaction = ref<SettlementTransactionSummary | null>(null);

onMounted(() => {
    query.settlementBatchNo = routeText('settlementBatchNo');
    query.sourceTransactionId = routeText('sourceTransactionId');
    query.merchantOrderNo = routeText('merchantOrderNo');
    const linkedBusinessDate = businessDateFromBusinessNo(query.settlementBatchNo);
    if (linkedBusinessDate) dateRange.value = [linkedBusinessDate, linkedBusinessDate];
    void loadData();
});

function requestQuery(): SettlementResultItemQuery { return { ...query, settlementBatchNo: query.settlementBatchNo || undefined, merchantId: query.merchantId || undefined, merchantOrderNo: query.merchantOrderNo || undefined, sourceTransactionId: query.sourceTransactionId || undefined, resultItemType: query.resultItemType || undefined, direction: query.direction || undefined, targetCurrency: query.targetCurrency || undefined, beginTransactionTime: transactionTimeRange.value[0] || undefined, endTransactionTime: transactionTimeRange.value[1] || undefined, beginBusinessDate: dateRange.value[0], endBusinessDate: dateRange.value[1] }; }
async function loadData() { loading.value = true; try { const result = await searchSettlementResultItems(requestQuery()); rows.value = result.records || []; total.value = result.total || 0; } catch (error) { showError(error, 'common.loadFailed'); } finally { loading.value = false; } }
function handleSearch() { query.pageNo = 1; void loadData(); }
function handleReset() { Object.assign(query, { settlementBatchNo: undefined, merchantId: undefined, merchantOrderNo: undefined, sourceTransactionId: undefined, resultItemType: undefined, direction: undefined, targetCurrency: undefined, pageNo: 1 }); dateRange.value = defaultDateRange(); transactionTimeRange.value = []; void loadData(); }
async function handleExport() { exporting.value = true; try { await exportSettlementResultItems(requestQuery()); } catch (error) { showError(error, 'common.exportFailed'); } finally { exporting.value = false; } }
async function openComponents(row: SettlementTransactionSummary) { selectedTransaction.value = row; componentVisible.value = true; componentPage.value = 1; componentRows.value = []; await loadComponents(); }
async function loadComponents() { const row = selectedTransaction.value; if (!row || componentLoading.value) return; componentLoading.value = true; try { const result = await searchSettlementResultItemComponents(row.settlementBatchNo, row.sourceTransactionId, componentPage.value, componentPageSize.value); componentRows.value = result.records || []; componentTotal.value = result.total || 0; } catch (error) { showError(error, 'transaction.settlement.componentLoadFailed'); } finally { componentLoading.value = false; } }
function resetComponentPage() { componentPage.value = 1; void loadComponents(); }
function openTransaction(row: SettlementTransactionSummary) { void router.push({ path: '/transaction/operation', query: { transactionId: row.sourceTransactionId, transactionDateTime: row.sourceTransactionDateTime, transactionTimeZone: 'Asia/Shanghai' } }); }
function openBatch(settlementBatchNo: string) { void router.push({ path: '/settlement/transaction-candidates', query: { view: 'batches', settlementBatchNo } }); }
function openMerchant(merchantId: string) { void router.push({ path: '/merchant/info', query: { merchantId } }); }
function routeText(key: string) { const value = route.query[key]; return typeof value === 'string' && value.trim() ? value.trim() : undefined; }
function enumText(group: string, value?: string) { if (!value) return '-'; const key = `transaction.settlement.${group}.${value}`; return te(key) ? t(key) : value; }
function itemTypeText(value?: string) { return enumText('resultItemTypeValue', value); }
function roleText(value?: string) { return enumText('resultRoleValue', value); }
function dimensionItems(group: string, value?: string) { return value ? [{ value, label: enumText(group, value) }] : []; }
function showError(error: unknown, key: string) { ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || (error instanceof Error ? error.message : t(key))); }
</script>

<style scoped>
.search-form :deep(.el-input), .search-form :deep(.el-select) { width: 220px; }
.search-form :deep(.el-date-editor) { width: 330px; }
.component-identity { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-bottom: 14px; border-top: 1px solid var(--el-border-color); border-left: 1px solid var(--el-border-color); }
.component-identity > div { min-width: 0; padding: 12px 14px; border-right: 1px solid var(--el-border-color); border-bottom: 1px solid var(--el-border-color); text-align: center; }
.component-identity span, .component-identity strong { display: block; }
.component-identity span { margin-bottom: 5px; color: var(--el-text-color-secondary); font-size: 12px; }
.component-identity strong { overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }
@media (max-width: 720px) { .component-identity { grid-template-columns: 1fr; } }
</style>
