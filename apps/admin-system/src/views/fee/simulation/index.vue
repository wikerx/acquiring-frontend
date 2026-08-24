<template>
    <div class="app-container fee-simulation-page">
        <div class="simulation-notice-row">
            <el-alert :title="$t('feeAccount.simulationNotice')" type="info" :closable="false" show-icon />
            <el-button v-hasPermi="'fee:simulation:record:list'" :icon="Clock" size="small" @click="openRecords">{{ $t('feeAccount.simulationRecords') }}</el-button>
        </div>

        <section class="simulation-section simulation-section--input">
            <div class="simulation-section__title"><span>1</span><h2>{{ $t('feeAccount.simulationInputTitle') }}</h2></div>
            <el-form label-position="top" class="simulation-form">
                <div class="simulation-form__grid">
                    <el-form-item class="simulation-form__merchant" :label="$t('feeAccount.merchant')" required><MerchantRemoteSelect v-model="form.merchantId" @change="selectMerchantPlan" /></el-form-item>
                    <el-form-item :label="$t('feeAccount.transactionType')" required><FeeDictSelect v-model="form.transactionType" dict-type="transaction_type" @change="handleTransactionTypeChange" /></el-form-item>
                    <el-form-item :label="$t('feeAccount.paymentType')" required><FeeDictSelect v-model="form.paymentType" dict-type="acquiring_payment_method" @change="handlePaymentTypeChange" /></el-form-item>
                    <el-form-item :label="$t('feeAccount.paymentMethod')" required><FeeDictSelect v-model="form.paymentMethod" dict-type="card_brand" allow-all :disabled="form.paymentType !== 'BANK_CARD'" @change="invalidateResult" /></el-form-item>
                    <el-form-item class="simulation-form__amount" :label="$t('feeAccount.currencyAmount')" required>
                        <div class="currency-amount-control">
                            <CurrencySelect v-model="form.labelCurrency" width="116px" code-only :placeholder="$t('feeAccount.currency')" :aria-label="$t('feeAccount.currency')" @change="invalidateResult" />
                            <el-input v-model="form.labelAmount" inputmode="decimal" :placeholder="$t('feeAccount.amount')" :aria-label="$t('feeAccount.amount')" @input="invalidateResult" />
                        </div>
                    </el-form-item>
                </div>
                <el-form-item class="simulation-form__risk" :label="$t('feeAccount.simulationRiskServices')" :required="form.feeCategory === 'RISK_FEE'">
                    <el-checkbox-group v-model="form.riskServiceTypes" class="risk-service-selector" @change="invalidateResult">
                        <el-checkbox-button value="INTERNAL">{{ $t('feeAccount.riskType.internal') }}</el-checkbox-button>
                        <el-checkbox-button value="EXTERNAL">{{ $t('feeAccount.riskType.external') }}</el-checkbox-button>
                        <el-checkbox-button value="THREE_DS">{{ $t('feeAccount.riskType.threeDs') }}</el-checkbox-button>
                    </el-checkbox-group>
                </el-form-item>
                <div class="simulation-actions"><el-button :icon="Operation" type="primary" :loading="loading" @click="calculate">{{ $t('feeAccount.calculate') }}</el-button></div>
            </el-form>
        </section>

        <section class="simulation-section simulation-result-section">
            <div class="simulation-section__title"><span>2</span><h2>{{ $t('feeAccount.simulationResultTitle') }}</h2></div>
            <el-empty v-if="!result" :description="$t('feeAccount.simulationEmpty')" :image-size="84" />
            <template v-else>
                <div class="result-summary-band">
                    <div class="result-summary-band__metric result-summary-band__primary"><span>{{ $t('feeAccount.estimatedNetSettlement') }}</span><strong><BaseAmount :value="result.estimatedNetSettlementUsd" currency="USD" currency-display="code" :fraction-digits="2" /></strong></div>
                    <div class="result-summary-band__metric"><span>{{ $t('feeAccount.estimatedTotalFee') }}</span><strong><BaseAmount :value="result.finalFeeUsd" currency="USD" currency-display="code" :fraction-digits="2" /></strong></div>
                    <div class="result-summary-band__metric"><span>{{ $t('feeAccount.reserveAmount') }}</span><strong><BaseAmount :value="result.reserveAmountLabel" :currency="result.reserveAmountCurrency" currency-display="code" :fraction-digits="2" /></strong></div>
                    <div class="result-summary-band__context">
                        <div><span>{{ $t('feeAccount.simulationNo') }}</span><strong>{{ result.simulationNo }}</strong></div>
                        <div><span>{{ $t('feeAccount.settlementRate') }}</span><strong>{{ form.labelCurrency }} / USD = {{ result.labelToUsdRate }}</strong></div>
                    </div>
                    <el-button :icon="RefreshLeft" plain type="primary" @click="resetSimulation">{{ $t('feeAccount.recalculate') }}</el-button>
                </div>

                <div class="result-content-heading">{{ $t('feeAccount.feeBreakdown') }}</div>
                <div class="result-main-grid">
                    <section class="fee-detail-area">
                        <FeeSimulationDetailTable
                            :details="result.feeDetails"
                            show-summary
                            :total-fee-usd="result.finalFeeUsd"
                            :fee-total-formula="result.feeTotalFormulaSnapshot"
                            :net-settlement-formula="result.netSettlementFormulaSnapshot"
                        />
                    </section>
                    <aside class="fee-composition-area">
                        <h3>{{ $t('feeAccount.feeComposition') }}</h3>
                        <AnalyticsChart :option="feeCompositionOption" :empty="feeCompositionEmpty" :empty-text="$t('feeAccount.noFeeComposition')" :aria-label="$t('feeAccount.feeComposition')" height="310px" />
                    </aside>
                </div>

                <div class="result-context-grid">
                    <div><span>{{ $t('feeAccount.transactionType') }}</span><strong>{{ transactionTypeText(form.transactionType) }}</strong></div>
                    <div class="result-context-grid__payment"><span>{{ $t('feeAccount.paymentTypeMethod') }}</span><PaymentMethodDisplay :payment-types="paymentTypeItems(form.paymentType)" :payment-methods="paymentMethodItems(form.paymentMethod)" :all-card-brands-label="$t('feeAccount.allPaymentMethods')" align="start" /></div>
                    <div><span>{{ $t('feeAccount.rateSourceRecord') }}</span><strong>{{ result.settlementRateSource }}<template v-if="result.settlementRateId"> / #{{ result.settlementRateId }}</template></strong></div>
                    <div><span>{{ $t('feeAccount.rateEffectiveTime') }}</span><strong><BaseDateTime :value="result.rateEffectiveTime" /></strong></div>
                    <div><span>{{ $t('feeAccount.valuationTime') }}</span><strong><BaseDateTime :value="result.rateValuationTime" /></strong></div>
                    <div><span>{{ $t('feeAccount.feeVersion') }}</span><strong>#{{ result.planVersionId }}</strong></div>
                </div>
            </template>
        </section>

        <CommonDetailDrawer v-model:visible="recordsVisible" :title="$t('feeAccount.simulationRecords')" size="xl">
            <el-form v-show="showRecordSearch" :model="recordQuery" inline size="small" class="search-form" label-width="82px">
                <el-form-item :label="$t('feeAccount.simulationNo')"><el-input v-model="recordQuery.keyword" clearable @keyup.enter="searchRecords" /></el-form-item>
                <el-form-item :label="$t('feeAccount.merchant')"><MerchantRemoteSelect v-model="recordQuery.merchantId" @change="searchRecords" /></el-form-item>
                <el-form-item :label="$t('feeAccount.transactionType')"><FeeDictSelect v-model="recordQuery.transactionType" dict-type="transaction_type" /></el-form-item>
                <el-form-item><el-button :icon="Search" type="primary" @click="searchRecords">{{ $t('common.search') }}</el-button><el-button :icon="RefreshLeft" @click="resetRecordQuery">{{ $t('common.reset') }}</el-button></el-form-item>
            </el-form>
            <el-row :gutter="10" class="mb8">
                <el-col :span="1.5"><el-button v-hasPermi="'fee:simulation:record:export'" :icon="Download" type="warning" plain size="small" @click="exportSimulationRecords(recordQuery)">{{ $t('common.export') }}</el-button></el-col>
                <el-col class="right-toolbar"><RightToolbar @toggle-search="showRecordSearch = !showRecordSearch" @refresh="loadRecords" /></el-col>
            </el-row>
            <StandardTable v-loading="recordsLoading" table-key="admin-fee-simulation-records" :data="records" row-key="id" size="small">
                <el-table-column type="expand" width="48" fixed="left">
                    <template #default="{ row }">
                        <div class="record-detail-panel">
                            <el-alert v-if="row.detailSnapshotStatus === 'LEGACY_INCOMPLETE'" :title="$t('feeAccount.legacyDetailIncomplete')" type="warning" :closable="false" show-icon />
                            <template v-else>
                                <h4>{{ $t('feeAccount.recordDetails') }}</h4>
                                <FeeSimulationDetailTable
                                    :details="row.feeDetails"
                                    show-summary
                                    :total-fee-usd="row.finalFeeUsd"
                                    :fee-total-formula="row.formulaSnapshot"
                                    :net-settlement-formula="row.netSettlementFormulaSnapshot"
                                />
                            </template>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="simulationNo" :label="$t('feeAccount.simulationNo')" min-width="190" fixed="left" align="center" />
                <el-table-column prop="merchantId" :label="$t('feeAccount.merchantId')" min-width="150" align="center" />
                <el-table-column :label="$t('feeAccount.transactionType')" min-width="140" align="center"><template #default="{ row }">{{ transactionTypeText(row.transactionType) }}</template></el-table-column>
                <el-table-column :label="$t('feeAccount.paymentTypeMethod')" min-width="280" align="center">
                    <template #default="{ row }">
                        <PaymentMethodDisplay :payment-types="paymentTypeItems(row.paymentType)" :payment-methods="paymentMethodItems(row.paymentMethod)" :all-card-brands-label="$t('feeAccount.allPaymentMethods')" />
                    </template>
                </el-table-column>
                <el-table-column :label="$t('feeAccount.riskUsage')" min-width="310" align="center">
                    <template #default="{ row }">
                        <div class="risk-usage-list">
                            <el-tag v-for="service in riskServices" :key="service.value" :type="riskServiceUsed(row, service.value) ? 'success' : 'info'" effect="plain" size="small">
                                {{ service.label }} · {{ $t(riskServiceUsed(row, service.value) ? 'feeAccount.riskUsed' : 'feeAccount.riskNotUsed') }}
                            </el-tag>
                        </div>
                        <el-tag v-if="row.detailSnapshotStatus === 'LEGACY_INCOMPLETE'" type="warning" effect="plain" size="small" class="legacy-status-tag">{{ $t('feeAccount.detailSnapshotIncomplete') }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="$t('feeAccount.labelAmount')" min-width="150" align="right"><template #default="scope"><BaseAmount :value="scope.row.labelAmount" :currency="scope.row.labelCurrency" currency-display="code" :fraction-digits="2" /></template></el-table-column>
                <el-table-column :label="$t('feeAccount.feeTotal')" min-width="145" align="right"><template #default="scope"><BaseAmount :value="scope.row.finalFeeUsd" currency="USD" currency-display="code" :fraction-digits="2" /></template></el-table-column>
                <el-table-column :label="$t('feeAccount.reserveAmount')" min-width="145" align="right"><template #default="scope"><BaseAmount :value="scope.row.reserveAmountLabel" :currency="scope.row.reserveAmountCurrency" currency-display="code" :fraction-digits="2" /></template></el-table-column>
                <el-table-column :label="$t('feeAccount.estimatedNetSettlement')" min-width="165" align="right"><template #default="scope"><BaseAmount :value="scope.row.estimatedNetSettlementUsd" currency="USD" currency-display="code" :fraction-digits="2" /></template></el-table-column>
                <el-table-column prop="operatorName" :label="$t('feeAccount.operator')" width="120" align="center" />
                <el-table-column :label="$t('common.createTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.createTime" /></template></el-table-column>
            </StandardTable>
            <div v-show="recordTotal > 0" class="pagination-container"><el-pagination v-model:current-page="recordQuery.pageNo" v-model:page-size="recordQuery.pageSize" :total="recordTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadRecords" @size-change="searchRecords" /></div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Download, Operation, RefreshLeft, Search } from '@element-plus/icons-vue';
import { AnalyticsChart, formatDecimalAmount, PaymentMethodDisplay, roundDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import {
    exportSimulationRecords,
    getMerchantFee,
    searchSimulationRecords,
    simulateFee,
    type FeePlanDetail,
    type FeeSimulationDetail,
    type FeeSimulationInput,
    type FeeSimulationRecord,
    type FeeSimulationRecordQuery,
    type FeeSimulationResult,
} from '@/api/fee';
import BaseAmount from '@/components/BaseAmount/index.vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, optionLabel, type SelectOption } from '@/views/channel/shared';
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import FeeDictSelect from '@/views/fee/components/FeeDictSelect.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import FeeSimulationDetailTable from './FeeSimulationDetailTable.vue';

const { locale, t } = useI18n();
const loading = ref(false);
const selectedPlan = ref<FeePlanDetail | null>(null);
const result = ref<FeeSimulationResult | null>(null);
const recordsVisible = ref(false);
const recordsLoading = ref(false);
const showRecordSearch = ref(true);
const records = ref<FeeSimulationRecord[]>([]);
const recordTotal = ref(0);
const recordQuery = ref<FeeSimulationRecordQuery>({ pageNo: 1, pageSize: 10 });
const form = ref<FeeSimulationInput>(emptySimulation());
const transactionTypeOptions = ref<SelectOption[]>([]);
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);

const selectedVersion = computed(() => selectedPlan.value?.currentVersion || null);
const REFUND_FEE_TRANSACTION_TYPES = new Set(['REFUND', 'CANCEL', 'VOID', 'AUTH_CANCEL']);
const DISPUTE_FEE_TRANSACTION_TYPES = new Set(['CHARGEBACK', 'DISPUTE']);
const FEE_COLORS: Record<string, string> = {
    TRANSACTION_FEE: '#2563eb',
    REFUND_FEE: '#f59e0b',
    DISPUTE_FEE: '#dc6b5f',
    INTERNAL: '#0f9d89',
    EXTERNAL: '#7c3aed',
    THREE_DS: '#64748b',
    SETTLEMENT_PROCESSING_FEE: '#16a085',
    SETTLEMENT_FX_FEE: '#16a085',
};
const riskServices = computed(() => [
    { value: 'INTERNAL' as const, label: t('feeAccount.riskType.internal') },
    { value: 'EXTERNAL' as const, label: t('feeAccount.riskType.external') },
    { value: 'THREE_DS' as const, label: t('feeAccount.riskType.threeDs') },
]);

const feeCompositionRows = computed(() => (result.value?.feeDetails || [])
    .filter((item) => item.includedInFeeTotal && item.calculationStatus === 'CALCULATED' && Number(item.finalFeeUsd) > 0)
    .map((item) => ({
        name: feeTypeText(item),
        value: Number(item.finalFeeUsd),
        itemStyle: { color: FEE_COLORS[item.riskServiceType] || FEE_COLORS[item.feeCategory] || '#94a3b8' },
    })));
const feeCompositionEmpty = computed(() => feeCompositionRows.value.length === 0);
const feeCompositionOption = computed(() => ({
    tooltip: {
        trigger: 'item',
        renderMode: 'html',
        appendTo: 'body',
        confine: false,
        extraCssText: 'z-index: 3000; max-width: 240px; padding: 9px 12px; border-radius: 4px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);',
        formatter: (params: { name?: string; value?: string | number; percent?: number }) => {
            const amount = formatTwoDecimal(params.value ?? 0);
            const percent = formatTwoDecimal(params.percent ?? 0);
            return `${params.name || '-'}<br/><b>USD ${amount}</b> (${percent}%)`;
        },
        position: (
            point: number[],
            _params: unknown,
            _dom: HTMLElement,
            _rect: unknown,
            size: { contentSize: number[]; viewSize: number[] },
        ) => {
            const [contentWidth, contentHeight] = size.contentSize;
            const [viewWidth, viewHeight] = size.viewSize;
            const top = Math.max(8, Math.min(point[1] - contentHeight / 2, viewHeight - contentHeight - 8));
            if (window.innerWidth > 1100) {
                return [-contentWidth - 24, top];
            }
            return [Math.max(8, (viewWidth - contentWidth) / 2), top];
        },
    },
    title: {
        text: result.value ? `USD ${formatTwoDecimal(result.value.finalFeeUsd)}` : '-',
        subtext: t('feeAccount.estimatedTotalFee'),
        left: '38%',
        top: '38%',
        textAlign: 'center',
        textStyle: { color: '#243044', fontSize: 18, fontWeight: 700 },
        subtextStyle: { color: '#697386', fontSize: 11, lineHeight: 18 },
    },
    legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        textStyle: { color: '#5d6878', fontSize: 12 },
    },
    series: [{
        name: t('feeAccount.feeComposition'),
        type: 'pie',
        radius: ['44%', '64%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 3 },
        label: { show: false },
        emphasis: { label: { show: false } },
        data: feeCompositionRows.value,
    }],
}));

function formatTwoDecimal(value: string | number) {
    return formatDecimalAmount(
        roundDecimalAmount(value, 2),
        String(locale.value || 'zh-CN'),
        2,
        2,
    );
}

watch(() => locale.value, loadDimensionOptions, { immediate: true });

function emptySimulation(): FeeSimulationInput {
    return { merchantId: '', feeCategory: 'TRANSACTION_FEE', transactionType: 'PAYMENT', paymentType: 'BANK_CARD', paymentMethod: 'ALL', riskServiceType: 'NONE', riskServiceTypes: [], labelAmount: '100', labelCurrency: 'USD', monthlyCountBefore: 0, monthlyAmountUsdBefore: '0' };
}
function applySelectedPlan(plan: FeePlanDetail | null) {
    selectedPlan.value = plan;
    result.value = null;
}

async function selectMerchantPlan(value: string | string[]) {
    const merchantId = Array.isArray(value) ? value[0] : value;
    if (!merchantId) return applySelectedPlan(null);
    form.value.merchantId = merchantId;
    applySelectedPlan(await getMerchantFee(merchantId));
    if (!selectedPlan.value?.currentVersionId) ElMessage.warning(t('feeAccount.merchantFeeNotConfigured'));
}

function handlePaymentTypeChange(value: string | string[]) {
    if (!Array.isArray(value) && value !== 'BANK_CARD') form.value.paymentMethod = 'ALL';
    invalidateResult();
}

function handleTransactionTypeChange(value: string | string[]) {
    if (Array.isArray(value)) return;
    result.value = null;
    syncFeeCategoryFromTransactionType(value);
}

function syncFeeCategoryFromTransactionType(value?: string) {
    form.value.feeCategory = feeCategoryForTransactionType(value);
    form.value.riskServiceType = form.value.riskServiceTypes[0] || 'NONE';
}

function feeCategoryForTransactionType(value?: string): FeeSimulationInput['feeCategory'] {
    const transactionType = (value || '').trim().toUpperCase();
    if (REFUND_FEE_TRANSACTION_TYPES.has(transactionType)) return 'REFUND_FEE';
    if (DISPUTE_FEE_TRANSACTION_TYPES.has(transactionType)) return 'DISPUTE_FEE';
    if (transactionType.startsWith('RISK')) return 'RISK_FEE';
    return 'TRANSACTION_FEE';
}

function feeTypeText(detail: FeeSimulationDetail) {
    if (detail.feeCategory === 'RISK_FEE') {
        return riskServices.value.find((item) => item.value === detail.riskServiceType)?.label || '-';
    }
    if (detail.feeCategory === 'REFUND_FEE') return t('feeAccount.category.refund');
    if (detail.feeCategory === 'DISPUTE_FEE') return t('feeAccount.category.dispute');
    if (detail.feeCategory === 'SETTLEMENT_FX_FEE' || detail.feeCategory === 'SETTLEMENT_PROCESSING_FEE') {
        return t('feeAccount.settlementFxFee');
    }
    return t('feeAccount.category.transaction');
}

async function loadDimensionOptions() {
    const language = String(locale.value || 'zh-CN');
    const results = await Promise.allSettled([
        loadDictOptions('transaction_type', language),
        loadDictOptions('acquiring_payment_method', language),
        loadDictOptions('card_brand', language),
    ]);
    transactionTypeOptions.value = settledOptions(results[0]);
    paymentTypeOptions.value = settledOptions(results[1]);
    paymentMethodOptions.value = settledOptions(results[2]);
}

function settledOptions(result: PromiseSettledResult<SelectOption[]>) {
    return result.status === 'fulfilled' ? result.value : [];
}

function transactionTypeText(value?: string) {
    return optionLabel(transactionTypeOptions.value, value);
}

function paymentTypeItems(value?: string) {
    return value ? [{ value, label: optionLabel(paymentTypeOptions.value, value) }] : [];
}

function paymentMethodItems(value?: string) {
    if (!value) return [];
    return [{
        value,
        label: value === 'ALL' ? t('feeAccount.allPaymentMethods') : optionLabel(paymentMethodOptions.value, value),
    }];
}

function riskServiceUsed(record: FeeSimulationRecord, value: FeeSimulationInput['riskServiceTypes'][number]) {
    return (record.riskServiceTypes || []).includes(value);
}

function invalidateResult() { result.value = null; }

async function calculate() {
    if (!form.value.merchantId) return ElMessage.warning(t('feeAccount.selectMerchant'));
    if (!selectedVersion.value) return ElMessage.warning(t('feeAccount.merchantFeeNotConfigured'));
    if (!form.value.transactionType || !form.value.paymentType || !form.value.paymentMethod) return ElMessage.warning(t('feeAccount.completeMatchDimensions'));
    syncFeeCategoryFromTransactionType(form.value.transactionType);
    if (form.value.feeCategory === 'RISK_FEE' && !form.value.riskServiceTypes.length) return ElMessage.warning(t('feeAccount.simulationRiskRequired'));
    if (!/^[A-Za-z]{3}$/.test(form.value.labelCurrency)) return ElMessage.warning(t('feeAccount.invalidCurrency'));
    loading.value = true;
    try {
        result.value = await simulateFee({ ...form.value, labelCurrency: form.value.labelCurrency.toUpperCase() });
    } catch (error) {
        result.value = null;
        ElMessage.error(error instanceof Error ? error.message : t('common.operationFailed'));
    }
    finally { loading.value = false; }
}

function resetSimulation() { result.value = null; }

async function openRecords() { recordsVisible.value = true; await loadRecords(); }
async function loadRecords() {
    recordsLoading.value = true;
    try {
        const page = await searchSimulationRecords(recordQuery.value);
        records.value = page.records || [];
        recordTotal.value = page.total || 0;
    } finally { recordsLoading.value = false; }
}
function searchRecords() { recordQuery.value.pageNo = 1; loadRecords(); }
function resetRecordQuery() { recordQuery.value = { pageNo: 1, pageSize: recordQuery.value.pageSize || 10 }; loadRecords(); }
</script>

<style scoped>
.fee-simulation-page {
    --simulation-border: #dfe5ec;
    --simulation-fill: #f5f7fa;
    --simulation-ink: #303846;
    --simulation-muted: #697386;
    display: grid;
    gap: 12px;
}
.simulation-notice-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.simulation-section { padding: 16px 18px 18px; border: 1px solid var(--simulation-border); border-radius: 5px; background: #fff; }
.simulation-section__title { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.simulation-section__title > span { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; background: var(--el-color-primary); color: #fff; font-size: 13px; font-weight: 700; box-shadow: 0 2px 5px rgb(37 99 235 / 22%); }
.simulation-section__title h2 { margin: 0; color: var(--simulation-ink); font-size: 15px; font-weight: 600; }
.simulation-form__grid { display: grid; grid-template-columns: minmax(220px, 1.25fr) repeat(3, minmax(150px, 1fr)) minmax(270px, 1.35fr); gap: 0 16px; }
.simulation-form__grid > .el-form-item { min-width: 0; margin-bottom: 14px; }
.simulation-form :deep(.el-select), .simulation-form :deep(.el-input-number), .simulation-form :deep(.el-segmented) { width: 100%; }
.currency-amount-control { display: grid; grid-template-columns: 116px minmax(0, 1fr); width: 100%; }
.currency-amount-control :deep(.exchange-currency-select .el-select__wrapper) { border-radius: 3px 0 0 3px; }
.currency-amount-control :deep(.el-input__wrapper) { margin-left: -1px; border-radius: 0 3px 3px 0; }
.currency-amount-control :deep(.el-select__wrapper.is-focused), .currency-amount-control :deep(.el-input__wrapper.is-focus) { position: relative; z-index: 1; }
.simulation-form__risk { display: flex; align-items: center; width: max-content; max-width: 100%; margin-bottom: 10px; padding: 6px 10px; border: 1px solid #e1e7ef; border-radius: 5px; background: #f7f9fc; }
.simulation-form__risk :deep(.el-form-item__label) { height: 32px; margin: 0 12px 0 0; padding: 0; color: var(--simulation-ink); font-weight: 600; line-height: 32px; white-space: nowrap; }
.simulation-form__risk :deep(.el-form-item__content) { display: block; flex: none; line-height: normal; }
.risk-service-selector { display: flex; width: auto; }
.risk-service-selector :deep(.el-checkbox-button) { min-width: 0; }
.risk-service-selector :deep(.el-checkbox-button__inner) { display: flex; align-items: center; justify-content: center; min-width: 96px; min-height: 32px; padding: 5px 14px; line-height: 20px; letter-spacing: 0; }
.simulation-actions { display: flex; justify-content: center; padding-top: 2px; }
.simulation-actions :deep(.el-button) { min-width: 118px; height: 34px; padding-inline: 20px; }
.result-summary-band { display: grid; grid-template-columns: repeat(3, minmax(150px, 1fr)) minmax(210px, 1.15fr) auto; align-items: stretch; overflow: hidden; margin-bottom: 14px; border: 1px solid var(--simulation-border); border-radius: 5px; background: var(--simulation-fill); }
.result-summary-band__metric { min-height: 88px; padding: 16px 18px; border-right: 1px solid var(--simulation-border); background: #fff; }
.result-summary-band span { color: var(--simulation-muted); font-size: 12px; }
.result-summary-band strong { display: block; margin-top: 7px; color: var(--simulation-ink); font-size: 18px; font-variant-numeric: tabular-nums; }
.result-summary-band__primary { border-top: 3px solid var(--el-color-primary); }
.result-summary-band__primary strong { color: var(--el-color-primary); font-size: 23px; }
.result-summary-band__context { display: grid; align-content: center; gap: 9px; padding: 14px 18px; }
.result-summary-band__context > div { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; gap: 14px; }
.result-summary-band__context strong { min-width: 0; margin-top: 0; overflow-wrap: anywhere; font-size: 12px; font-weight: 600; text-align: right; }
.result-summary-band > .el-button { align-self: center; margin: 0 16px; }
.result-content-heading { width: max-content; margin: 0 0 14px 48px; padding: 0 10px 9px; border-bottom: 2px solid var(--el-color-primary); color: var(--el-color-primary); font-size: 14px; font-weight: 600; }
.result-main-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
.fee-detail-area { min-width: 0; }
.fee-detail-total { display: flex; align-items: center; justify-content: flex-end; gap: 22px; min-height: 42px; padding: 8px 16px; border: 1px solid var(--simulation-border); border-top: 0; background: #f7f9fc; color: var(--simulation-ink); }
.fee-detail-total span { font-size: 13px; font-weight: 600; }
.fee-detail-total strong { min-width: 132px; color: var(--el-color-primary); font-size: 16px; font-variant-numeric: tabular-nums; text-align: right; }
.fee-composition-area { min-width: 0; padding-left: 18px; border-left: 1px solid var(--simulation-border); }
.fee-composition-area h3 { margin: 0 0 4px; color: var(--simulation-ink); font-size: 14px; font-weight: 600; }
.result-context-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: 18px; border-top: 1px solid var(--simulation-border); border-bottom: 1px solid var(--simulation-border); }
.result-context-grid > div { min-width: 0; padding: 11px 14px; border-right: 1px solid var(--simulation-border); }
.result-context-grid > div:nth-child(3n) { border-right: 0; }
.result-context-grid span { display: block; margin-bottom: 5px; color: var(--simulation-muted); font-size: 11px; }
.result-context-grid strong { display: block; overflow-wrap: anywhere; color: var(--simulation-ink); font-size: 12px; font-weight: 600; }
.result-context-grid__payment :deep(.payment-method-display) { min-height: 22px; }
.risk-usage-list { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 5px; }
.legacy-status-tag { margin-top: 6px; }
.record-detail-panel { padding: 12px 18px 18px; background: #f8fafc; }
.record-detail-panel h4 { margin: 0 0 10px; color: var(--simulation-ink); font-size: 13px; font-weight: 600; }
.search-form :deep(.el-select) { width: 210px; }
@media (max-width: 1280px) {
    .simulation-form__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .simulation-form__amount { grid-column: span 2; }
    .result-summary-band { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .result-summary-band > .el-button { margin: 14px; justify-self: start; }
    .result-context-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .result-context-grid > div:nth-child(3n) { border-right: 1px solid var(--simulation-border); }
    .result-context-grid > div:nth-child(2n) { border-right: 0; }
    .result-context-grid > div:nth-child(-n + 4) { border-bottom: 1px solid var(--simulation-border); }
}
@media (max-width: 1100px) {
    .result-main-grid { grid-template-columns: 1fr; }
    .fee-composition-area { padding: 16px 0 0; border-top: 1px solid var(--simulation-border); border-left: 0; }
}
@media (max-width: 640px) {
    .simulation-notice-row, .simulation-form__grid, .result-summary-band, .result-context-grid { grid-template-columns: 1fr; }
    .simulation-form__amount { grid-column: auto; }
    .simulation-section { padding: 14px 12px; }
    .simulation-form__risk { display: block; width: 100%; }
    .simulation-form__risk :deep(.el-form-item__label) { height: auto; margin: 0 0 6px; line-height: 20px; }
    .simulation-form__risk :deep(.el-form-item__content) { width: 100%; }
    .risk-service-selector { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); width: 100%; }
    .risk-service-selector :deep(.el-checkbox-button__inner) { min-width: 0; padding-inline: 8px; }
    .result-summary-band__metric { border-right: 0; border-bottom: 1px solid var(--simulation-border); }
    .result-summary-band__context { border-bottom: 1px solid var(--simulation-border); }
    .result-summary-band > .el-button { justify-self: stretch; }
    .result-content-heading { margin-left: 0; }
    .result-context-grid > div { border-right: 0; border-bottom: 1px solid var(--simulation-border); }
    .result-context-grid > div:last-child { border-bottom: 0; }
}
</style>
