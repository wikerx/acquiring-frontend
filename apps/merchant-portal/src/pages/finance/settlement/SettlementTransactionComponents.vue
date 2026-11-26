<template>
    <el-drawer v-model="componentVisible" :title="t('settlement.financialComponents')" size="min(1080px, 96vw)" append-to-body destroy-on-close>
        <div class="settlement-component__identity"><div><span>{{ t('settlement.transactionId') }}</span><strong>{{ transaction?.sourceTransactionId || '-' }}</strong></div><div><span>{{ t('settlement.merchantOrderNo') }}</span><strong>{{ transaction?.merchantOrderNo || '-' }}</strong></div></div>
        <TransactionFeeBreakdown
            compact
            v-if="feeStatement"
            :facts="feeStatement"
            :transaction-id="props.transaction?.sourceTransactionId"
            :transaction-type="props.transaction?.transactionType"
            :locale="String(locale)"
        />
        <el-table v-loading="componentLoading" :data="componentRows" border size="small">
            <el-table-column prop="settlementResultItemNo" :label="t('settlement.resultItemNo')" min-width="210" fixed="left" align="center" show-overflow-tooltip />
            <el-table-column :label="t('settlement.resultItemType')" min-width="150" align="center"><template #default="{ row }">{{ enumText('resultItemType', row.resultItemType) }}</template></el-table-column>
            <el-table-column :label="t('settlement.feeCategory')" min-width="140" align="center"><template #default="{ row }">{{ enumText('feeCategory', row.feeCategory) }}</template></el-table-column>
            <el-table-column :label="t('settlement.direction')" width="96" align="center"><template #default="{ row }"><DirectionTag :direction="row.direction" :label="enumText('direction', row.direction)" /></template></el-table-column>
            <el-table-column :label="t('settlement.sourceAmount')" min-width="175" align="right"><template #default="{ row }"><CurrencyAmountDisplay fee-precision :amount="row.sourceAmountExact ?? row.sourceAmount" :currency="row.sourceCurrency" :exponent="row.sourceCurrencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
            <el-table-column :label="t('settlement.directRate')" min-width="150" align="right"><template #default="{ row }">{{ rate(row.directRate) }}</template></el-table-column>
            <el-table-column :label="transactionFeeText(String(locale), 'unrounded')" min-width="190" align="right">
                <template #default="{ row }"><CurrencyAmountDisplay fee-precision :amount="row.unroundedTargetAmountExact ?? row.unroundedTargetAmount" :currency="row.targetCurrency" :locale="String(locale)" align="end" /></template>
            </el-table-column>
            <el-table-column :label="t('settlement.targetAmount')" min-width="175" align="right"><template #default="{ row }"><CurrencyAmountDisplay fee-precision :amount="row.targetAmountExact ?? row.targetAmount" :currency="row.targetCurrency" :exponent="row.targetCurrencyExponent" :locale="String(locale)" align="end" /></template></el-table-column>
            <el-table-column :label="t('settlement.appliedLimit')" min-width="126" align="center"><template #default="{ row }">{{ enumText('appliedLimit', row.appliedLimit) }}</template></el-table-column>
        </el-table>
        <el-empty v-if="!componentLoading && !componentRows.length" :description="t('settlement.componentEmpty')" />
        <div v-show="componentTotal > 0" class="pagination-container"><el-pagination v-model:current-page="componentPage" v-model:page-size="componentPageSize" :total="componentTotal" :page-sizes="[10,20,50]" layout="total, sizes, prev, pager, next" background @current-change="loadComponents" @size-change="resetComponentPage" /></div>
    </el-drawer>
</template>

<script setup lang="ts">
import { hasPermission } from '@/utils/permission';
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { TransactionFeeBreakdown, useTransactionFeeStatement, CurrencyAmountDisplay, DirectionTag, formatExchangeRate, transactionFeeText } from '@acquiring/shared';
import {
    getMerchantClearingDetailByTransaction,
    searchMerchantSettlementTransactionComponents,
    type MerchantSettlementTransaction,
    type MerchantSettlementTransactionItem,
} from '@/api/settlementApi';

const props = defineProps<{ transaction: MerchantSettlementTransaction | null }>();
const componentVisible = defineModel<boolean>({ required: true });
const { locale, t, te } = useI18n();
const componentLoading = ref(false);
const componentRows = ref<MerchantSettlementTransactionItem[]>([]);
const componentTotal = ref(0);
const componentPage = ref(1);
const componentPageSize = ref(10);
let requestId = 0;

watch([componentVisible, () => props.transaction], ([visible]) => {
    requestId += 1;
    componentLoading.value = false;
    componentRows.value = [];
    componentTotal.value = 0;
    componentPage.value = 1;
    if (visible) void loadComponents();
}, { immediate: true });

async function loadComponents() {
    if (!componentVisible.value || !props.transaction || componentLoading.value) return;
    const { settlementBatchNo, sourceTransactionId } = props.transaction;
    const id = ++requestId;
    componentLoading.value = true;
    try {
        const result = await searchMerchantSettlementTransactionComponents(
            settlementBatchNo, sourceTransactionId, componentPage.value, componentPageSize.value,
        );
        if (id !== requestId) return;
        componentRows.value = result.records || [];
        componentTotal.value = result.total || 0;
    } catch (error) {
        if (id === requestId) {
            ElMessage.error((error as { friendlyMessage?: string })?.friendlyMessage || t('settlement.componentLoadFailed'));
        }
    } finally {
        if (id === requestId) componentLoading.value = false;
    }
}

function resetComponentPage() {
    componentPage.value = 1;
    void loadComponents();
}

function enumText(group: string, value?: string) {
    if (!value) return '-';
    const key = `settlement.${group}Value.${value}`;
    return te(key) ? t(key) : value;
}

function rate(value?: string | number) {
    return formatExchangeRate(value, String(locale.value));
}
const feeStatement = useTransactionFeeStatement(() => {
    if (!componentVisible.value || !props.transaction || !(hasPermission('merchant:clearing:record:detail'))) return null;
    return {
        transactionId: props.transaction.sourceTransactionId,
        transactionDateTime: props.transaction.sourceTransactionDateTime,
        settlementBatchNo: props.transaction.settlementBatchNo,
    };
}, getMerchantClearingDetailByTransaction);
</script>

<style scoped>
.settlement-component__identity { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 14px; border: 1px solid var(--el-border-color-lighter); }
.settlement-component__identity > div { min-width: 0; padding: 12px 14px; text-align: center; }
.settlement-component__identity > div + div { border-left: 1px solid var(--el-border-color-lighter); }
.settlement-component__identity span, .settlement-component__identity strong { display: block; }
.settlement-component__identity span { margin-bottom: 5px; color: var(--el-text-color-secondary); font-size: 12px; }
.settlement-component__identity strong { overflow-wrap: anywhere; }
@media (max-width: 720px) {
    .settlement-component__identity { grid-template-columns: 1fr; }
    .settlement-component__identity > div + div { border-top: 1px solid var(--el-border-color-lighter); border-left: 0; }
}
</style>
