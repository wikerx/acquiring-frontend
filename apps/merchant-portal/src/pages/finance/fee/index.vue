<template>
    <div class="page system-page merchant-redesigned-page merchant-fee-page">
        <el-empty v-if="!loading && !fee" :description="$t('finance.noActiveFee')" />
        <template v-else>
            <section v-loading="loading" class="fee-version-band">
                <div class="fee-version-primary">
                    <span>{{ $t('finance.configurationName') }}</span>
                    <strong>{{ fee?.displayName || '-' }}</strong>
                </div>
                <div>
                    <span>{{ $t('finance.activeVersionLabel') }}</span>
                    <strong>{{ fee ? `v${fee.versionNo}` : '-' }}</strong>
                </div>
                <div>
                    <span>{{ $t('finance.effectiveTime') }}</span>
                    <strong class="fee-date"><BaseDateTime :value="fee?.effectiveTime" /></strong>
                </div>
            </section>

            <section class="merchant-list-card merchant-table-card">
                <div class="merchant-table-head">
                    <div class="merchant-table-head__actions">
                        <el-tag v-if="fee" type="success" effect="plain">{{ $t('finance.activeVersion', { version: fee.versionNo }) }}</el-tag>
                    </div>
                    <RightToolbar :show-search="false" @refresh="load" />
                </div>

                <el-tabs v-model="activeTab" class="fee-tabs">
                    <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :label="tab.label" :name="tab.name">
                        <StandardTable
                            v-loading="loading"
                            :table-key="`merchant-current-fee-${tab.name}`"
                            :data="rulesFor(tab.name)"
                            row-key="id"
                            size="small"
                            :expand-row-keys="tierRuleIds(tab.name)"
                            :row-class-name="feeRowClassName"
                        >
                            <el-table-column v-if="hasTierRules(tab.name)" type="expand" width="48" fixed="left">
                                <template #default="{ row }">
                                    <div v-if="row.tiers?.length" class="tier-detail">
                                        <div class="tier-detail__heading">
                                            <strong>{{ feeModeText(row) }}</strong>
                                            <span>{{ tierMetricText(row) }}</span>
                                        </div>
                                        <el-table :data="row.tiers" border size="small">
                                            <el-table-column prop="lowerBound" :label="$t('finance.lowerInclusive')" min-width="110" align="center" />
                                            <el-table-column prop="upperBound" :label="$t('finance.upperExclusive')" min-width="120" align="center">
                                                <template #default="{ row: tier }">{{ tier.upperBound ?? $t('finance.unlimited') }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.rate')" min-width="110" align="right">
                                                <template #default="{ row: tier }">{{ tier.percentageRate }}%</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.fixedFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.fixedAmountUsd) }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.minimumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.minimumAmountUsd) }}</template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.maximumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }">{{ usd(tier.maximumAmountUsd) }}</template>
                                            </el-table-column>
                                        </el-table>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column prop="ruleName" :label="$t('finance.feeName')" min-width="180" fixed="left" align="center" />
                            <el-table-column v-if="tab.name === 'RISK_FEE'" :label="$t('finance.riskServiceType')" min-width="120" align="center">
                                <template #default="{ row }"><el-tag effect="plain" size="small" type="success">{{ riskServiceText(row.riskServiceType) }}</el-tag></template>
                            </el-table-column>
                            <el-table-column v-if="tab.name === 'RISK_FEE'" :label="$t('finance.chargeTrigger')" min-width="150" align="center">
                                <template #default="{ row }">{{ chargeTriggerText(row.chargeTrigger) }}</template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.transactionType')" min-width="170" align="center">
                                <template #default="{ row }">
                                    <div class="fee-dimension-tags">
                                        <el-tag v-for="item in transactionTypeItems(row)" :key="item.value" effect="plain" size="small">{{ item.label }}</el-tag>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.paymentMethod')" min-width="310" align="center">
                                <template #default="{ row }">
                                    <PaymentMethodDisplay
                                        :payment-types="paymentTypeItems(row)"
                                        :payment-methods="paymentMethodItems(row)"
                                        :all-card-brands-label="allCardBrandsLabel(row)"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.billingRule')" min-width="300" align="center">
                                <template #default="{ row }"><span class="billing-rule-text">{{ billingRuleText(row) }}</span></template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.feeMode')" width="140" align="center">
                                <template #default="{ row }">
                                    <el-tag :type="row.feeMode === 'TIER' ? 'warning' : 'primary'" effect="plain" size="small">{{ feeModeText(row) }}</el-tag>
                                </template>
                            </el-table-column>
                        </StandardTable>
                    </el-tab-pane>

                    <el-tab-pane :label="$t('finance.reserveSettings')" name="RESERVE">
                        <section class="configuration-panel">
                            <el-alert :title="$t('finance.reserveRuleHint')" type="info" :closable="false" show-icon />
                            <el-descriptions :column="2" border size="small">
                                <el-descriptions-item :label="$t('finance.reserveRate')">{{ fee?.reserveRate ?? 0 }}%</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.reserveDelayDays')">D+{{ fee?.reserveDelayDays || '-' }}</el-descriptions-item>
                            </el-descriptions>
                        </section>
                    </el-tab-pane>

                    <el-tab-pane :label="$t('finance.settlementSettings')" name="SETTLEMENT">
                        <section class="configuration-panel">
                            <el-descriptions :column="3" border size="small">
                                <el-descriptions-item :label="$t('finance.initialCycle')">{{ cycle(fee?.initialDelayUnit, fee?.initialDelayDays) }}</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.regularCycle')">{{ cycle(fee?.regularDelayUnit, fee?.regularDelayDays) }}</el-descriptions-item>
                                <el-descriptions-item :label="$t('finance.settlementFrequency')">{{ frequency(fee?.settlementFrequency, fee?.frequencyDay) }}</el-descriptions-item>
                            </el-descriptions>
                            <div v-if="settlementFxRule" class="settlement-fx-summary">
                                <div class="settlement-fx-summary__head">
                                    <div><strong>{{ $t('finance.settlementFxFee') }}</strong><span>{{ $t('finance.settlementFxFeeHint') }}</span></div>
                                    <el-tag effect="plain" type="primary">{{ $t('finance.standardRate') }}</el-tag>
                                </div>
                                <el-descriptions :column="4" border size="small">
                                    <el-descriptions-item :label="$t('finance.percentageRate')">{{ settlementFxRule.percentageRate }}%</el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.fixedFee')">{{ usd(settlementFxRule.fixedAmountUsd) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.minimumFee')">{{ usd(settlementFxRule.minimumAmountUsd) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.maximumFee')">{{ usd(settlementFxRule.maximumAmountUsd) }}</el-descriptions-item>
                                </el-descriptions>
                            </div>
                        </section>
                    </el-tab-pane>
                </el-tabs>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { PaymentMethodDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { financeApi, type CurrentFee, type FeeRule } from '@/api/financeApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadTransactionDictOptions, type TransactionDictOption } from '@/pages/transaction/shared';

type FeeCategory = FeeRule['feeCategory'];

const { locale, t } = useI18n();
const loading = ref(false);
const fee = ref<CurrentFee | null>(null);
const transactionTypeOptions = ref<TransactionDictOption[]>([]);
const paymentTypeOptions = ref<TransactionDictOption[]>([]);
const paymentMethodOptions = ref<TransactionDictOption[]>([]);
let loadedDictLocale = '';
const activeTab = ref<FeeCategory | 'RESERVE' | 'SETTLEMENT'>('TRANSACTION_FEE');
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('finance.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('finance.category.refund') },
    { name: 'RISK_FEE' as const, label: t('finance.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('finance.category.dispute') },
]);
const settlementFxRule = computed(() => fee.value?.rules.find((item) => item.feeCategory === 'SETTLEMENT_FX_FEE'));

onMounted(load);
watch(locale, () => void loadDimensionOptions(), { immediate: true });

/** Load the merchant's active copied fee configuration without exposing template-library metadata. */
async function load() {
    loading.value = true;
    try {
        fee.value = await financeApi.currentFee();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function rulesFor(category: FeeCategory) {
    return fee.value?.rules.filter((item) => item.feeCategory === category) || [];
}

function hasTierRules(category: FeeCategory) {
    return rulesFor(category).some((rule) => rule.feeMode === 'TIER' && rule.tiers?.length);
}

function tierRuleIds(category: FeeCategory) {
    return rulesFor(category)
        .filter((rule) => rule.feeMode === 'TIER' && rule.tiers?.length)
        .map((rule) => rule.id);
}

async function loadDimensionOptions() {
    const language = String(locale.value || 'zh-CN');
    if (loadedDictLocale === language) return;
    const results = await Promise.allSettled([
        loadTransactionDictOptions('transaction_type', language),
        loadTransactionDictOptions('acquiring_payment_method', language),
        loadTransactionDictOptions('card_brand', language),
    ]);
    transactionTypeOptions.value = settledOptions(results[0]);
    paymentTypeOptions.value = settledOptions(results[1]);
    paymentMethodOptions.value = settledOptions(results[2]);
    if (results.every((result) => result.status === 'fulfilled')) loadedDictLocale = language;
}

function settledOptions(result: PromiseSettledResult<TransactionDictOption[]>) {
    return result.status === 'fulfilled' ? result.value : [];
}

function transactionTypeItems(rule: FeeRule) {
    return dimensionItems(rule.transactionTypes, rule.transactionType, transactionTypeOptions.value, 'transaction');
}

function paymentTypeItems(rule: FeeRule) {
    return dimensionItems(rule.paymentTypes, rule.paymentType, paymentTypeOptions.value, 'paymentType');
}

function paymentMethodItems(rule: FeeRule) {
    return dimensionItems(rule.paymentMethods, rule.paymentMethod, paymentMethodOptions.value, 'paymentMethod');
}

function allCardBrandsLabel(rule: FeeRule) {
    const bankCardLabel = paymentTypeItems(rule).find((item) => item.value === 'BANK_CARD')?.label
        || t('finance.paymentMethod');
    return t('transactionAnalytics.allCardBrands', { method: bankCardLabel });
}

function dimensionItems(batchValues: string[] | undefined, compatibleValue: string | undefined,
    options: TransactionDictOption[], dimension: 'transaction' | 'paymentType' | 'paymentMethod') {
    const sourceValues = batchValues?.length ? batchValues : compatibleValue ? [compatibleValue] : [];
    const values = [...new Set(sourceValues.flatMap((value) => value.split(','))
        .map((value) => value.trim()).filter(Boolean))];
    if (!values.length) return [{ value: '-', label: '-' }];
    return values.map((value) => ({ value, label: dimensionLabel(value, options, dimension) }));
}

function dimensionLabel(value: string, options: TransactionDictOption[], dimension: 'transaction' | 'paymentType' | 'paymentMethod') {
    if (value === 'ALL') return t('finance.allDimension');
    const option = options.find((item) => item.value === value);
    if (option?.label) return option.label;
    if (dimension === 'transaction') return t(`transaction.type.${value}`, value);
    if (dimension === 'paymentType') return t(`transaction.paymentMethod.${value}`, value);
    return value.replaceAll('_', ' ');
}

function feeRowClassName({ row }: { row: FeeRule }) {
    return row.feeMode === 'TIER' && row.tiers?.length ? 'fee-tier-row' : 'fee-standard-row';
}

function feeModeText(rule: FeeRule) {
    return rule.feeMode === 'TIER'
        ? t('finance.tierWithCount', { count: rule.tiers?.length || 0 })
        : t('finance.standardRate');
}

function tierMetricText(rule: FeeRule) {
    return rule.tierMetric === 'COUNT' ? t('finance.tierCountFormula') : t('finance.tierAmountFormula');
}

function billingRuleText(rule: FeeRule) {
    if (rule.feeCategory === 'RISK_FEE' && rule.chargeTrigger === 'NO_CHARGE') return t('finance.noCharge');
    if (rule.feeMode === 'TIER') return tierMetricText(rule);
    const formulas: string[] = [];
    if (hasAmount(rule.percentageRate)) formulas.push(t('finance.labelAmountFormula', { rate: rule.percentageRate }));
    if (hasAmount(rule.fixedAmountUsd)) formulas.push(t('finance.fixedAmountFormula', { amount: rule.fixedAmountUsd }));
    if (hasAmount(rule.minimumAmountUsd)) formulas.push(t('finance.minimumFormula', { amount: rule.minimumAmountUsd }));
    if (hasAmount(rule.maximumAmountUsd)) formulas.push(t('finance.maximumFormula', { amount: rule.maximumAmountUsd }));
    return formulas.length ? formulas.join(t('finance.formulaSeparator')) : t('finance.noCharge');
}

function hasAmount(value?: string | number | null) {
    return value !== null && value !== undefined && value !== '' && Number(value) !== 0;
}

function riskServiceText(value?: FeeRule['riskServiceType']) {
    if (value === 'INTERNAL') return t('finance.riskType.internal');
    if (value === 'EXTERNAL') return t('finance.riskType.external');
    if (value === 'THREE_DS') return t('finance.riskType.threeDs');
    return '-';
}

function chargeTriggerText(value?: FeeRule['chargeTrigger']) {
    if (value === 'NO_CHARGE') return t('finance.chargeTriggerType.noCharge');
    if (value === 'SUCCESS') return t('finance.chargeTriggerType.success');
    if (value === 'SUCCESS_OR_FAILURE') return t('finance.chargeTriggerType.successOrFailure');
    if (value === 'ON_CALL') return t('finance.chargeTriggerType.onCall');
    return '-';
}

function cycle(unit?: string, days?: number) {
    return unit && days ? `${unit}+${days}` : '-';
}

function frequency(value?: string, day?: number | null) {
    if (value === 'DAILY') return t('finance.daily');
    if (value === 'WEEKLY') return t('finance.weekly', { day: day || '-' });
    if (value === 'BIWEEKLY') return t('finance.biweekly', { day: day || '-' });
    if (value === 'MONTHLY') return t('finance.monthly', { day: day || '-' });
    return value || '-';
}

function usd(value?: string | number | null) {
    return value === null || value === undefined || value === '' ? '-' : `USD ${value}`;
}
</script>

<style scoped>
.merchant-fee-page { --fee-ink: #17243a; --fee-muted: #697586; }
.fee-version-band { display: grid; grid-template-columns: 1.5fr repeat(2, minmax(0, 1fr)); overflow: hidden; border: 1px solid #dbe4ec; border-radius: 6px; background: #fff; }
.fee-version-band > div { min-height: 90px; padding: 16px; border-right: 1px solid #e8edf2; }
.fee-version-band > div:last-child { border-right: 0; }
.fee-version-band span { color: var(--fee-muted); font-size: 12px; }
.fee-version-band strong { display: block; margin-top: 8px; color: var(--fee-ink); font-size: 17px; }
.fee-version-primary { border-top: 3px solid var(--merchant-action-primary); }
.fee-version-primary strong { font-size: 19px; }
.fee-version-band .fee-date { font-size: 13px; }
.fee-tabs { padding: 0 16px 16px; }
.fee-tabs :deep(.el-tabs__item) { min-width: 108px; text-align: center; }
.tier-detail { display: grid; gap: 10px; padding: 14px 48px; background: #f7fafc; }
.tier-detail__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.tier-detail__heading strong { color: var(--fee-ink); font-size: 13px; }
.tier-detail__heading span { color: var(--fee-muted); font-size: 12px; }
.fee-dimension-tags { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; min-height: 24px; }
.fee-dimension-tags :deep(.el-tag) { max-width: 100%; }
.fee-dimension-tags :deep(.el-tag__content) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.billing-rule-text { color: #344054; line-height: 1.55; }
:deep(.fee-standard-row .el-table__expand-icon) { visibility: hidden; pointer-events: none; }
.configuration-panel { display: grid; gap: 16px; min-height: 180px; padding: 8px 0; align-content: start; }
.settlement-fx-summary { display: grid; gap: 12px; padding-top: 4px; }
.settlement-fx-summary__head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.settlement-fx-summary__head > div { display: grid; gap: 4px; }
.settlement-fx-summary__head strong { color: var(--fee-ink); font-size: 14px; }
.settlement-fx-summary__head span { color: var(--fee-muted); font-size: 12px; }
@media (max-width: 760px) {
    .fee-version-band { grid-template-columns: 1fr; }
    .fee-version-band > div { border-right: 0; border-bottom: 1px solid #e8edf2; }
    .fee-version-band > div:last-child { border-bottom: 0; }
    .fee-tabs { padding: 0 10px 12px; }
    .fee-tabs :deep(.el-tabs__item) { min-width: 0; padding: 0 12px; }
    .tier-detail { padding: 10px; }
}
</style>
