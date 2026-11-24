<template>
    <div class="page system-page merchant-redesigned-page">
        <section v-show="showSearch" class="merchant-list-card merchant-search-card">
            <el-form :model="filters" inline size="small" class="search-form" @submit.prevent>
                <el-form-item :label="t('settlement.batchNo')">
                    <el-input v-model.trim="filters.settlementBatchNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="search" />
                </el-form-item>
                <el-form-item :label="t('settlement.merchantOrderNo')">
                    <el-input v-model.trim="filters.merchantOrderNo" :placeholder="t('transaction.order.merchantOrderNoPlaceholder')" clearable @keyup.enter="search" />
                </el-form-item>
                <el-form-item :label="t('settlement.transactionId')">
                    <el-input v-model.trim="filters.sourceTransactionId" :placeholder="t('transaction.order.transactionIdPlaceholder')" clearable @keyup.enter="search" />
                </el-form-item>
                <el-form-item :label="t('settlement.transactionType')">
                    <el-select v-model="filters.transactionType" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <template #prefix>
                            <TransactionTypeDisplay v-if="filters.transactionType" :value="filters.transactionType" icon-only />
                        </template>
                        <el-option v-for="option in typeOptions" :key="option.value" :value="option.value" :label="option.label">
                            <TransactionTypeDisplay :value="option.value" :label="option.label" align="start" />
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('settlement.transactionTime')">
                    <el-date-picker v-model="transactionRange" type="datetimerange" value-format="YYYY-MM-DDTHH:mm:ss"
                        :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
                </el-form-item>
                <el-form-item :label="t('settlement.businessDate')">
                    <el-date-picker v-model="businessRange" type="daterange" value-format="YYYY-MM-DD" :clearable="false"
                        :range-separator="t('common.to')" :start-placeholder="t('common.startTime')" :end-placeholder="t('common.endTime')" />
                </el-form-item>
                <el-form-item class="merchant-search-actions">
                    <el-button v-if="canList" type="primary" :icon="Search" @click="search">{{ t('common.search') }}</el-button>
                    <el-button :icon="RefreshLeft" @click="reset">{{ t('common.reset') }}</el-button>
                </el-form-item>
            </el-form>
        </section>

        <section class="merchant-list-card merchant-table-card">
            <div class="merchant-table-head">
                <div class="merchant-table-head__actions">
                    <el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="exportRows">
                        {{ t('common.export') }}
                    </el-button>
                </div>
                <RightToolbar v-if="canList" @toggle-search="showSearch = !showSearch" @refresh="load" />
            </div>
            <StandardTable v-if="canList" v-loading="loading" table-key="merchant-transaction-settlement-item-list"
                :data="rows" :row-key="rowKey" size="small">
                <el-table-column prop="settlementBatchNo" :label="t('settlement.batchNo')" min-width="205" align="center" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-button v-if="canListBatches" link type="primary" @click="openBatch(row)">{{ row.settlementBatchNo }}</el-button>
                        <span v-else>{{ row.settlementBatchNo }}</span>
                    </template>
                </el-table-column>
                <el-table-column prop="merchantOrderNo" :label="t('settlement.merchantOrderNo')" min-width="190" align="center" show-overflow-tooltip />
                <el-table-column prop="sourceTransactionId" :label="t('settlement.transactionId')" min-width="205" align="center" show-overflow-tooltip>
                    <template #default="{ row }">
                        <el-button v-if="canReadTransaction" link type="primary" @click="openTransaction(row)">{{ row.sourceTransactionId }}</el-button>
                        <span v-else>{{ row.sourceTransactionId }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.paymentMethod')" min-width="145" align="center">
                    <template #default="{ row }">
                        <PaymentMethodDisplay :payment-types="dimension('paymentType', row.paymentType)"
                            :payment-methods="dimension('paymentMethod', row.paymentMethod)" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.transactionType')" min-width="150" align="center">
                    <template #default="{ row }">
                        <TransactionTypeDisplay :value="row.transactionType" :label="typeLabel(row.transactionType)" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.sourceAmount')" min-width="160" align="right">
                    <template #default="{ row }">
                        <CurrencyAmountDisplay :amount="row.sourceAmount" :currency="row.sourceCurrency"
                            :exponent="row.sourceCurrencyExponent" :locale="locale" align="end" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.netAmount')" min-width="160" align="right">
                    <template #default="{ row }">
                        <CurrencyAmountDisplay :amount="row.netTargetAmount" :currency="row.targetCurrency"
                            :exponent="row.targetCurrencyExponent" :locale="locale" align="end" emphasized />
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.netDirection')" min-width="100" align="center">
                    <template #default="{ row }"><DirectionTag :direction="row.netDirection" :label="enumText('direction', row.netDirection)" /></template>
                </el-table-column>
                <el-table-column :label="t('settlement.componentCount')" min-width="110" align="center">
                    <template #default="{ row }">
                        <el-button v-if="canReadComponents" link type="primary" @click="openComponents(row)">{{ row.componentCount }}</el-button>
                        <span v-else>{{ row.componentCount }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('settlement.transactionTime')" min-width="174" align="center">
                    <template #default="{ row }"><BaseDateTime :value="row.sourceTransactionDateTime" source-time-zone="Asia/Shanghai" /></template>
                </el-table-column>
            </StandardTable>
            <div v-if="canList && total > 0" class="pagination-container">
                <el-pagination v-model:current-page="pageNo" v-model:page-size="pageSize" :total="total"
                    :page-sizes="[10,20,50,100]" layout="total, sizes, prev, pager, next, jumper" background @change="load" />
            </div>
        </section>

        <SettlementTransactionComponents v-if="canReadComponents" v-model="componentsVisible" :transaction="selectedTransaction" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { Download, RefreshLeft, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { CurrencyAmountDisplay, DirectionTag, PaymentMethodDisplay, TransactionTypeDisplay } from '@acquiring/shared';
import {
    searchMerchantSettlementTransactions,
    type MerchantSettlementTransaction,
    type MerchantSettlementTransactionQuery,
} from '@/api/settlementApi';
import { submitSettlementTransactionExport } from '@/api/exportTaskApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    type TransactionDictOption,
} from '@/pages/transaction/shared';
import { hasPermission } from '@/utils/permission';
import SettlementTransactionComponents from './SettlementTransactionComponents.vue';
import { defaultSettlementDateRange } from './dateRange';

const { locale, t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const canList = hasPermission('merchant:settlement:transaction-item:list');
const canExport = hasPermission('merchant:settlement:transaction-item:export');
const canReadComponents = hasPermission('merchant:settlement:transaction-item:detail');
const canReadTransaction = hasPermission('merchant:transaction:order:detail');
const canListBatches = hasPermission('merchant:settlement:batch:list');
const dictionaryTypes = ref<TransactionDictOption[]>([]);
const typeOptions = computed(() => mergeTransactionDictOptions(dictionaryTypes.value, fallbackTransactionTypeOptions(t)));
const filters = reactive(initialFilters());
const businessRange = ref(defaultSettlementDateRange());
const transactionRange = ref<[string, string] | null>(null);
const pageNo = ref(1);
const pageSize = ref(10);
const total = ref(0);
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const rows = ref<MerchantSettlementTransaction[]>([]);
const selectedTransaction = ref<MerchantSettlementTransaction | null>(null);
const componentsVisible = ref(false);
let requestId = 0;
let activeQueryKey = '';

onMounted(load);
watch(locale, (language, _, onCleanup) => {
    dictionaryTypes.value = [];
    let current = true;
    onCleanup(() => { current = false; });
    void loadTransactionDictOptions('transaction_type', String(language))
        .then(options => { if (current) dictionaryTypes.value = options; })
        .catch(() => {});
}, { immediate: true });

function initialFilters() {
    return { settlementBatchNo: '', merchantOrderNo: '', sourceTransactionId: '', transactionType: '' };
}

function request(): MerchantSettlementTransactionQuery {
    return {
        settlementBatchNo: filters.settlementBatchNo || undefined,
        merchantOrderNo: filters.merchantOrderNo || undefined,
        sourceTransactionId: filters.sourceTransactionId || undefined,
        transactionType: filters.transactionType || undefined,
        beginBusinessDate: businessRange.value[0],
        endBusinessDate: businessRange.value[1],
        beginTransactionTime: transactionRange.value?.[0],
        endTransactionTime: transactionRange.value?.[1],
        pageNo: pageNo.value,
        pageSize: pageSize.value,
    };
}

async function load() {
    if (!canList) return;
    const query = request();
    const queryKey = JSON.stringify(query);
    if (loading.value && activeQueryKey === queryKey) return;
    activeQueryKey = queryKey;
    const id = ++requestId;
    loading.value = true;
    try {
        const result = await searchMerchantSettlementTransactions(query);
        if (id !== requestId) return;
        rows.value = result.records || [];
        total.value = result.total || 0;
    } catch (error) {
        if (id === requestId) showError(error);
    } finally {
        if (id === requestId) loading.value = false;
    }
}

function search() {
    pageNo.value = 1;
    void load();
}

function reset() {
    Object.assign(filters, initialFilters());
    businessRange.value = defaultSettlementDateRange();
    transactionRange.value = null;
    search();
}

async function exportRows() {
    if (!canExport || exporting.value) return;
    exporting.value = true;
    try {
        const task = await submitSettlementTransactionExport(request());
        ElMessage.success(t('exportTask.submitted', { taskNo: task.taskNo }));
    } catch (error) {
        showError(error);
    } finally {
        exporting.value = false;
    }
}

function rowKey(row: MerchantSettlementTransaction) {
    return row.candidateId ?? `${row.settlementBatchNo}:${row.sourceTransactionId}`;
}

function openComponents(row: MerchantSettlementTransaction) {
    if (!canReadComponents) return;
    selectedTransaction.value = row;
    componentsVisible.value = true;
}

function openBatch(row: MerchantSettlementTransaction) {
    return router.push({ path: '/finance/settlements', query: { settlementBatchNo: row.settlementBatchNo } });
}

function openTransaction(row: MerchantSettlementTransaction) {
    return router.push({
        path: '/transaction/order',
        query: {
            transactionId: row.sourceTransactionId,
            transactionDateTime: row.sourceTransactionDateTime,
            transactionTimeZone: 'Asia/Shanghai',
        },
    });
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
}

function typeLabel(value?: string) {
    return typeOptions.value.find(option => option.value === value)?.label ?? enumText('transactionType', value);
}

function dimension(group: string, value?: string) {
    return value ? [{ value, label: enumText(group, value) }] : [];
}

function showError(error: unknown) {
    ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || t('common.loadFailed'));
}

if (route.query.view === 'details' || route.query.sourceTransactionId) {
    if (typeof route.query.settlementBatchNo === 'string') filters.settlementBatchNo = route.query.settlementBatchNo;
    if (typeof route.query.sourceTransactionId === 'string') filters.sourceTransactionId = route.query.sourceTransactionId;
}
</script>
