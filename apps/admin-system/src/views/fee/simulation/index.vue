<template>
    <div class="app-container fee-simulation-page">
        <div class="simulation-notice-row">
            <el-alert :title="$t('feeAccount.simulationNotice')" type="info" :closable="false" show-icon />
            <el-button v-hasPermi="'fee:simulation:record:list'" :icon="Clock" size="small" @click="openRecords">{{ $t('feeAccount.simulationRecords') }}</el-button>
        </div>

        <section class="simulation-section">
            <div class="simulation-section__title"><span>1</span><h2>{{ $t('feeAccount.simulationInputTitle') }}</h2></div>
            <el-form label-position="top" class="simulation-form">
                <el-row :gutter="18">
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.merchant')" required><MerchantRemoteSelect v-model="form.merchantId" @change="selectMerchantPlan" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.feeCategory')" required><el-select v-model="form.feeCategory" @change="handleFeeCategoryChange"><el-option :label="$t('feeAccount.category.transaction')" value="TRANSACTION_FEE" /><el-option :label="$t('feeAccount.category.refund')" value="REFUND_FEE" /><el-option :label="$t('feeAccount.category.risk')" value="RISK_FEE" /><el-option :label="$t('feeAccount.category.dispute')" value="DISPUTE_FEE" /></el-select></el-form-item></el-col>
                    <el-col v-if="form.feeCategory === 'RISK_FEE'" :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.riskServiceType')" required><el-select v-model="form.riskServiceType"><el-option :label="$t('feeAccount.riskType.internal')" value="INTERNAL" /><el-option :label="$t('feeAccount.riskType.external')" value="EXTERNAL" /><el-option :label="$t('feeAccount.riskType.threeDs')" value="THREE_DS" /></el-select></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.transactionType')" required><FeeDictSelect v-model="form.transactionType" dict-type="transaction_type" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.paymentType')" required><FeeDictSelect v-model="form.paymentType" dict-type="acquiring_payment_method" @change="handlePaymentTypeChange" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.paymentMethod')" required><FeeDictSelect v-model="form.paymentMethod" dict-type="card_brand" allow-all :disabled="form.paymentType !== 'BANK_CARD'" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.labelCurrency')" required><CurrencySelect v-model="form.labelCurrency" width="100%" code-only /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.labelAmount')" required><el-input v-model="form.labelAmount" inputmode="decimal" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.monthlyCountBefore')"><el-input-number v-model="form.monthlyCountBefore" :min="0" controls-position="right" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12" :lg="6"><el-form-item :label="$t('feeAccount.monthlyAmountBefore')"><el-input v-model="form.monthlyAmountUsdBefore" inputmode="decimal"><template #append>USD</template></el-input></el-form-item></el-col>
                </el-row>
                <div class="simulation-actions"><el-button :icon="Operation" type="primary" :loading="loading" @click="calculate">{{ $t('feeAccount.calculate') }}</el-button></div>
            </el-form>
        </section>

        <section class="simulation-section simulation-result-section">
            <div class="simulation-section__title"><span>2</span><h2>{{ $t('feeAccount.simulationResultTitle') }}</h2></div>
            <el-empty v-if="!result" :description="$t('feeAccount.simulationEmpty')" :image-size="84" />
            <template v-else>
                <div class="result-summary-band">
                    <div class="result-summary-band__primary"><span>{{ $t('feeAccount.estimatedNetSettlement') }}</span><strong><BaseAmount :value="result.estimatedNetSettlementUsd" currency="USD" currency-display="code" /></strong></div>
                    <div><span>{{ $t('feeAccount.finalFee') }}</span><strong><BaseAmount :value="result.finalFeeUsd" currency="USD" currency-display="code" /></strong></div>
                    <div><span>{{ $t('feeAccount.reserveAmount') }}</span><strong><BaseAmount :value="result.reserveAmountUsd" currency="USD" currency-display="code" /></strong></div>
                    <div><span>{{ $t('feeAccount.rawFee') }}</span><strong><BaseAmount :value="result.rawFeeUsd" currency="USD" currency-display="code" /></strong></div>
                    <div><span>{{ $t('feeAccount.feeLimit') }}</span><strong>{{ limitText(result.appliedLimit) }}</strong></div>
                    <el-button :icon="RefreshLeft" plain type="primary" @click="resetSimulation">{{ $t('feeAccount.recalculate') }}</el-button>
                </div>

                <el-tabs model-value="fee">
                    <el-tab-pane :label="$t('feeAccount.feeBreakdown')" name="fee">
                        <StandardTable table-key="admin-fee-simulation-result" :data="resultRows" row-key="simulationNo" size="small">
                            <el-table-column prop="ruleName" :label="$t('feeAccount.ruleName')" min-width="160" align="center" />
                            <el-table-column :label="$t('feeAccount.matchDimension')" min-width="260" align="center"><template #default>{{ form.transactionType }} / {{ form.paymentType }} / {{ form.paymentMethod }}<template v-if="form.feeCategory === 'RISK_FEE'"> / {{ riskServiceText(form.riskServiceType) }}</template></template></el-table-column>
                            <el-table-column prop="feeMode" :label="$t('feeAccount.feeMode')" min-width="120" align="center" />
                            <el-table-column prop="formula" :label="$t('feeAccount.formulaSnapshot')" min-width="320" align="center" show-overflow-tooltip />
                            <el-table-column :label="$t('feeAccount.finalFee')" min-width="150" align="right"><template #default><BaseAmount :value="result.finalFeeUsd" currency="USD" currency-display="code" /></template></el-table-column>
                        </StandardTable>
                    </el-tab-pane>
                </el-tabs>

                <div class="result-audit-grid">
                    <section>
                        <h3>{{ $t('feeAccount.matchResult') }}</h3>
                        <el-descriptions :column="2" border size="small">
                            <el-descriptions-item :label="$t('feeAccount.simulationNo')">{{ result.simulationNo }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.matchedRuleTier')">#{{ result.matchedRuleId }}<span v-if="result.matchedTierId"> / #{{ result.matchedTierId }}</span></el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.formulaSnapshot')" :span="2">{{ result.formulaSnapshot }}</el-descriptions-item>
                        </el-descriptions>
                    </section>
                    <section>
                        <h3>{{ $t('feeAccount.exchangeRateSnapshot') }}</h3>
                        <el-descriptions :column="2" border size="small">
                            <el-descriptions-item :label="$t('feeAccount.settlementRate')">{{ form.labelCurrency }} / USD = {{ result.labelToUsdRate }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.rateSourceRecord')">{{ result.settlementRateSource }}<span v-if="result.settlementRateId"> / #{{ result.settlementRateId }}</span></el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.rateEffectiveTime')"><BaseDateTime :value="result.rateEffectiveTime" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.valuationTime')"><BaseDateTime :value="result.rateValuationTime" /></el-descriptions-item>
                        </el-descriptions>
                    </section>
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
                <el-table-column prop="simulationNo" :label="$t('feeAccount.simulationNo')" min-width="190" fixed="left" align="center" />
                <el-table-column prop="merchantId" :label="$t('feeAccount.merchantId')" min-width="150" align="center" />
                <el-table-column prop="feeCategory" :label="$t('feeAccount.feeCategory')" min-width="140" align="center" />
                <el-table-column prop="transactionType" :label="$t('feeAccount.transactionType')" min-width="130" align="center" />
                <el-table-column prop="paymentType" :label="$t('feeAccount.paymentType')" min-width="130" align="center" />
                <el-table-column prop="paymentMethod" :label="$t('feeAccount.paymentMethod')" min-width="120" align="center" />
                <el-table-column :label="$t('feeAccount.riskServiceType')" min-width="120" align="center"><template #default="scope">{{ riskServiceText(scope.row.riskServiceType) }}</template></el-table-column>
                <el-table-column :label="$t('feeAccount.labelAmount')" min-width="150" align="right"><template #default="scope"><BaseAmount :value="scope.row.labelAmount" :currency="scope.row.labelCurrency" currency-display="code" /></template></el-table-column>
                <el-table-column :label="$t('feeAccount.finalFee')" min-width="145" align="right"><template #default="scope"><BaseAmount :value="scope.row.finalFeeUsd" currency="USD" currency-display="code" /></template></el-table-column>
                <el-table-column :label="$t('feeAccount.reserveAmount')" min-width="145" align="right"><template #default="scope"><BaseAmount :value="scope.row.reserveAmountUsd" currency="USD" currency-display="code" /></template></el-table-column>
                <el-table-column prop="operatorName" :label="$t('feeAccount.operator')" width="120" align="center" />
                <el-table-column :label="$t('common.createTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.createTime" /></template></el-table-column>
            </StandardTable>
            <div v-show="recordTotal > 0" class="pagination-container"><el-pagination v-model:current-page="recordQuery.pageNo" v-model:page-size="recordQuery.pageSize" :total="recordTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="loadRecords" @size-change="searchRecords" /></div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, Download, Operation, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    exportSimulationRecords,
    getMerchantFee,
    searchSimulationRecords,
    simulateFee,
    type FeePlanDetail,
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
import CurrencySelect from '@/views/exchange/CurrencySelect.vue';
import FeeDictSelect from '@/views/fee/components/FeeDictSelect.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';

const { t } = useI18n();
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

const selectedVersion = computed(() => selectedPlan.value?.currentVersion || null);
const matchedRule = computed(() => selectedVersion.value?.rules.find((item) => item.id === result.value?.matchedRuleId));
const resultRows = computed(() => result.value ? [{ simulationNo: result.value.simulationNo, ruleName: matchedRule.value?.ruleName || `#${result.value.matchedRuleId}`, feeMode: matchedRule.value?.feeMode || '-', formula: result.value.formulaSnapshot }] : []);

function emptySimulation(): FeeSimulationInput {
    return { merchantId: '', feeCategory: 'TRANSACTION_FEE', transactionType: 'PAYMENT', paymentType: 'BANK_CARD', paymentMethod: 'ALL', riskServiceType: 'INTERNAL', labelAmount: '100', labelCurrency: 'USD', monthlyCountBefore: 0, monthlyAmountUsdBefore: '0' };
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
}

function handleFeeCategoryChange() {
    result.value = null;
    if (form.value.feeCategory !== 'RISK_FEE') form.value.riskServiceType = 'NONE';
    else if (!form.value.riskServiceType || form.value.riskServiceType === 'NONE') form.value.riskServiceType = 'INTERNAL';
}

function riskServiceText(value?: FeeSimulationInput['riskServiceType']) {
    if (value === 'INTERNAL') return t('feeAccount.riskType.internal');
    if (value === 'EXTERNAL') return t('feeAccount.riskType.external');
    if (value === 'THREE_DS') return t('feeAccount.riskType.threeDs');
    return '-';
}

async function calculate() {
    if (!form.value.merchantId) return ElMessage.warning(t('feeAccount.selectMerchant'));
    if (!selectedVersion.value) return ElMessage.warning(t('feeAccount.merchantFeeNotConfigured'));
    if (!form.value.transactionType || !form.value.paymentType || !form.value.paymentMethod) return ElMessage.warning(t('feeAccount.completeMatchDimensions'));
    if (form.value.feeCategory === 'RISK_FEE' && (!form.value.riskServiceType || form.value.riskServiceType === 'NONE')) return ElMessage.warning(t('feeAccount.riskServiceType'));
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
function limitText(value: string) {
    if (value === 'MINIMUM') return t('feeAccount.minimumApplied');
    if (value === 'MAXIMUM') return t('feeAccount.maximumApplied');
    return t('feeAccount.noLimitApplied');
}

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
.fee-simulation-page { display: grid; gap: 16px; }
.simulation-notice-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 12px; }
.simulation-section { padding: 18px 20px 20px; border: 1px solid #e1e7ef; border-radius: 6px; background: #fff; }
.simulation-section__title { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.simulation-section__title > span { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border-radius: 50%; background: var(--el-color-primary); color: #fff; font-size: 14px; font-weight: 700; box-shadow: 0 2px 6px rgb(64 158 255 / 26%); }
.simulation-section__title h2 { margin: 0; color: #303846; font-size: 16px; }
.simulation-form :deep(.el-select), .simulation-form :deep(.el-input-number), .simulation-form :deep(.el-segmented) { width: 100%; }
.simulation-actions { display: flex; justify-content: center; padding-top: 4px; }
.result-summary-band { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)) auto; align-items: stretch; overflow: hidden; margin-bottom: 14px; border: 1px solid #e1e6ec; border-radius: 6px; background: #f7f8fa; }
.result-summary-band > div { min-height: 92px; padding: 17px 20px; border-right: 1px solid #e1e6ec; }
.result-summary-band span { color: #707b8c; font-size: 12px; }
.result-summary-band strong { display: block; margin-top: 8px; color: #303846; font-size: 18px; }
.result-summary-band__primary { border-top: 3px solid var(--el-color-primary); background: #fff; }
.result-summary-band__primary strong { color: var(--el-color-primary); font-size: 24px; }
.result-summary-band > .el-button { align-self: center; margin: 0 18px; }
.result-audit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 18px; }
.result-audit-grid h3 { margin: 0 0 10px; color: #303846; font-size: 14px; }
.search-form :deep(.el-select) { width: 210px; }
@media (max-width: 1000px) { .result-summary-band { grid-template-columns: repeat(2, minmax(0, 1fr)); } .result-summary-band > .el-button { margin: 14px; } .result-audit-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .simulation-notice-row, .result-summary-band { grid-template-columns: 1fr; } .simulation-section { padding: 14px 12px; } .result-summary-band > div { border-right: 0; border-bottom: 1px solid #e1e6ec; } }
</style>
