<template>
    <div class="page system-page merchant-redesigned-page merchant-fee-page">
        <el-empty v-if="!loading && !fee" :description="$t('finance.noActiveFee')" />
        <template v-else>
            <el-alert :title="$t('paymentMethod.fee.hint')" type="info" :closable="false" show-icon />
            <el-alert v-if="fee?.authorizationAssessmentStatus !== 'EVALUATED'" :title="$t(fee?.authorizationAssessmentStatus === 'HISTORY_PENDING' ? 'paymentMethod.fee.historyHint' : 'paymentMethod.overview.unassessed')" :type="fee?.authorizationAssessmentStatus === 'HISTORY_PENDING' ? 'warning' : 'info'" :closable="false" show-icon />
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
                        <section v-if="tab.name === 'DISPUTE_FEE' && disputeEventRules.length" class="dispute-events">
                            <h3>{{ $t('finance.disputeEvent.title') }}</h3>
                            <ul class="dispute-events__grid">
                                <li v-for="{ rule, category, brand } in disputeEventRules" :key="rule.id" class="dispute-event">
                                    <div class="dispute-event__brand">
                                        <img :src="brand.logo" alt="" width="56" height="28" />
                                    </div>
                                    <div class="dispute-event__details">
                                        <h4>{{ $t(`finance.disputeEvent.${category}.name`) }}</h4>
                                        <p>{{ $t(`finance.disputeEvent.${category}.basis`) }}</p>
                                    </div>
                                    <strong class="dispute-event__price">{{ billingRuleText(rule) }}</strong>
                                </li>
                            </ul>
                        </section>
                        <h3 v-if="tab.name === 'DISPUTE_FEE' && disputeEventRules.length && rulesFor(tab.name).length" class="chargeback-heading">
                            {{ $t('finance.disputeEvent.chargebackTitle') }}
                        </h3>
                        <StandardTable
                            v-if="tab.name !== 'DISPUTE_FEE' || !disputeEventRules.length || rulesFor(tab.name).length"
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
                                                <template #default="{ row: tier }"><PercentageRateDisplay :value="tier.percentageRate" :locale="String(locale)" align="end" /></template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.fixedFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.fixedAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.minimumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.minimumAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
                                            </el-table-column>
                                            <el-table-column :label="$t('finance.maximumFee')" min-width="120" align="right">
                                                <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.maximumAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
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
                            <el-table-column :label="tab.name === 'DISPUTE_FEE' ? $t('finance.disputeEvent.basis') : $t('finance.transactionType')" min-width="300" align="center">
                                <template #default="{ row }">
                                    <FeeTransactionScopeDisplay
                                        :items="transactionTypeItems(row)"
                                        :label="$t('finance.transactionType')"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('finance.paymentMethod')" min-width="240" align="center">
                                <template #default="{ row }">
                                    <FeePaymentScopeDisplay
                                        :keys="paymentScopeKeys(row)"
                                        :label="$t('finance.paymentMethod')"
                                    />
                                </template>
                            </el-table-column>
                            <el-table-column :label="$t('paymentMethod.fee.coverage')" min-width="285" align="center">
                                <template #default="{ row }">
                                    <FeeAuthorizationCoverage :assessment-status="fee?.authorizationAssessmentStatus" :coverage="row.paymentMethodCoverage" />
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
                                <el-descriptions-item :label="$t('finance.reserveRate')"><PercentageRateDisplay :value="fee?.reserveRate ?? 0" :locale="String(locale)" emphasized /></el-descriptions-item>
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
                                    <el-descriptions-item :label="$t('finance.transactionType')" :span="4">
                                        <FeeTransactionScopeDisplay
                                            :items="transactionTypeItems(settlementFxRule)"
                                            :label="$t('finance.transactionType')"
                                        />
                                    </el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.percentageRate')"><PercentageRateDisplay :value="settlementFxRule.percentageRate" :locale="String(locale)" emphasized /></el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.fixedFee')"><CurrencyAmountDisplay :amount="settlementFxRule.fixedAmountUsd" currency="USD" :locale="String(locale)" /></el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.minimumFee')"><CurrencyAmountDisplay :amount="settlementFxRule.minimumAmountUsd" currency="USD" :locale="String(locale)" /></el-descriptions-item>
                                    <el-descriptions-item :label="$t('finance.maximumFee')"><CurrencyAmountDisplay :amount="settlementFxRule.maximumAmountUsd" currency="USD" :locale="String(locale)" /></el-descriptions-item>
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
import {
    CurrencyAmountDisplay,
    DEFAULT_CARD_BRAND_LOGOS,
    PercentageRateDisplay,
    disputeEventFeeBrand,
    formatFeeAmount,
    formatPercentageValue,
    isDisputeEventFee,
    resolvePaymentLogoKeys,
    type PaymentLogoKey,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { financeApi, type CurrentFee, type FeeRule } from '@/api/financeApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import FeePaymentScopeDisplay from '@/pages/finance/fee/components/FeePaymentScopeDisplay.vue';
import FeeAuthorizationCoverage from '@/pages/finance/fee/components/FeeAuthorizationCoverage.vue';
import FeeTransactionScopeDisplay from '@/pages/finance/fee/components/FeeTransactionScopeDisplay.vue';
import {
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    mergeTransactionDictOptions,
    type TransactionDictOption,
} from '@/pages/transaction/shared';

type FeeCategory = FeeRule['feeCategory'];

const { locale, t } = useI18n();
const loading = ref(false);
const fee = ref<CurrentFee | null>(null);
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));
const paymentTypeOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
let loadedDictLocale = '';
const activeTab = ref<FeeCategory | 'RESERVE' | 'SETTLEMENT'>('TRANSACTION_FEE');
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('finance.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('finance.category.refund') },
    { name: 'RISK_FEE' as const, label: t('finance.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('finance.category.dispute') },
]);
const settlementFxRule = computed(() => fee.value?.rules.find((item) => item.feeCategory === 'SETTLEMENT_FX_FEE'));
const disputeEventRules = computed(() => (fee.value?.rules ?? []).flatMap((rule) => {
    const category = rule.feeCategory;
    return isDisputeEventFee(category) ? [{ rule, category, brand: disputeEventFeeBrand[category] }] : [];
}));

onMounted(load);
watch(locale, () => void loadDimensionOptions(), { immediate: true });

/** Load the merchant's active copied fee configuration without exposing template-library metadata. */
async function load() {
    loading.value = true;
    try {
        fee.value = await financeApi.currentFee();
    } catch (error) {
        if (fee.value) fee.value = { ...fee.value, authorizationAssessmentStatus: 'UNAVAILABLE' };
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
    const fallbackTransactionTypes = fallbackTransactionTypeOptions(t);
    const fallbackPaymentTypes = fallbackPaymentMethodOptions(t);
    const fallbackPaymentMethods = fallbackCardBrandOptions();
    paymentTypeOptions.value = fallbackPaymentTypes;
    paymentMethodOptions.value = fallbackPaymentMethods;
    const results = await Promise.allSettled([
        loadTransactionDictOptions('transaction_type', language),
        loadTransactionDictOptions('acquiring_payment_method', language),
        loadTransactionDictOptions('card_brand', language),
    ]);
    transactionTypeOptions.value = mergeTransactionDictOptions(
        settledOptions(results[0]),
        fallbackTransactionTypes,
    );
    paymentTypeOptions.value = mergeTransactionDictOptions(
        settledOptions(results[1]),
        fallbackPaymentTypes,
    );
    paymentMethodOptions.value = mergeTransactionDictOptions(
        settledOptions(results[2]),
        fallbackPaymentMethods,
    );
    if (results.every((result) => result.status === 'fulfilled')) loadedDictLocale = language;
}

function settledOptions(result: PromiseSettledResult<TransactionDictOption[]>) {
    return result.status === 'fulfilled' ? result.value : [];
}

function transactionTypeItems(rule: FeeRule) {
    return dimensionItems(rule.transactionTypes, rule.transactionType, transactionTypeOptions.value, 'transactionType');
}

function paymentTypeItems(rule: FeeRule) {
    return dimensionItems(rule.paymentTypes, rule.paymentType, paymentTypeOptions.value, 'paymentType');
}

function paymentMethodItems(rule: FeeRule) {
    return dimensionItems(rule.paymentMethods, rule.paymentMethod, paymentMethodOptions.value, 'paymentMethod');
}

function paymentScopeKeys(rule: FeeRule) {
    const keys: PaymentLogoKey[] = [];
    const methods = paymentMethodItems(rule).filter((item) => item.value !== '-');
    for (const paymentType of paymentTypeItems(rule)) {
        if (paymentType.value !== 'BANK_CARD') {
            keys.push(...resolvePaymentLogoKeys(paymentType.value));
            continue;
        }
        if (!methods.length || methods.some((item) => item.value === 'ALL')) {
            keys.push(...DEFAULT_CARD_BRAND_LOGOS);
            continue;
        }
        for (const method of methods) {
            keys.push(...resolvePaymentLogoKeys('', method.value));
        }
    }
    return [...new Set(keys)];
}

function dimensionItems(batchValues: string[] | undefined, compatibleValue: string | undefined,
    options: TransactionDictOption[], dimension: 'transactionType' | 'paymentType' | 'paymentMethod') {
    const sourceValues = batchValues?.length ? batchValues : compatibleValue ? [compatibleValue] : [];
    const values = [...new Set(sourceValues.flatMap((value) => value.split(','))
        .map((value) => value.trim()).filter(Boolean))];
    if (!values.length) return [{ value: '-', label: '-' }];
    return values.map((value) => ({ value, label: dimensionLabel(value, options, dimension) }));
}

function dimensionLabel(value: string, options: TransactionDictOption[],
    dimension: 'transactionType' | 'paymentType' | 'paymentMethod') {
    if (value === 'ALL') return dimension === 'transactionType'
        ? t('finance.allTransactionTypes')
        : t('finance.allDimension');
    const option = options.find((item) => item.value === value);
    if (option?.label) return option.label;
    if (dimension === 'transactionType') return t(`transaction.type.${value}`, value);
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
    if (isDisputeEventFee(rule.feeCategory)) {
        return t(`finance.disputeEvent.${rule.feeCategory}.amount`, {
            amount: formatFeeAmount(rule.fixedAmountUsdExact ?? rule.fixedAmountUsd, String(locale.value)),
        });
    }
    if (rule.feeCategory === 'RISK_FEE' && rule.chargeTrigger === 'NO_CHARGE') return t('finance.noCharge');
    if (rule.feeMode === 'TIER') return tierMetricText(rule);
    const formulas: string[] = [];
    const displayLocale = String(locale.value || 'zh-CN');
    if (hasAmount(rule.percentageRate)) {
        formulas.push(t('finance.labelAmountFormula', {
            rate: formatPercentageValue(rule.percentageRate, displayLocale, '-', 8),
        }));
    }
    if (hasAmount(rule.fixedAmountUsd)) {
        formulas.push(t('finance.fixedAmountFormula', {
            amount: formatFeeAmount(rule.fixedAmountUsd, displayLocale),
        }));
    }
    if (hasAmount(rule.minimumAmountUsd)) {
        formulas.push(t('finance.minimumFormula', {
            amount: formatFeeAmount(rule.minimumAmountUsd, displayLocale),
        }));
    }
    if (hasAmount(rule.maximumAmountUsd)) {
        formulas.push(t('finance.maximumFormula', {
            amount: formatFeeAmount(rule.maximumAmountUsd, displayLocale),
        }));
    }
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
.dispute-events h3,
.chargeback-heading { margin: 4px 0 12px; color: var(--fee-ink); font-size: 15px; font-weight: 650; }
.dispute-events__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 360px), 1fr));
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}
.dispute-event {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    padding: 14px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
}
.dispute-event__brand {
    display: grid;
    flex: none;
    place-items: center;
    width: 68px;
    height: 42px;
    border: 1px solid var(--el-border-color-extra-light);
    border-radius: 6px;
    background: var(--el-color-white);
}
.dispute-event__brand img { object-fit: contain; }
.dispute-event__details { flex: 1 1 155px; min-width: 0; }
.dispute-event h4 { margin: 0; color: var(--fee-ink); font-size: 14px; font-weight: 650; }
.dispute-event p { margin: 4px 0 0; color: var(--fee-muted); font-size: 12px; }
.dispute-event__price {
    margin-inline-start: auto;
    color: var(--fee-ink);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}
.chargeback-heading { margin-top: 20px; }
.tier-detail { display: grid; gap: 10px; padding: 14px 48px; background: #f7fafc; }
.tier-detail__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.tier-detail__heading strong { color: var(--fee-ink); font-size: 13px; }
.tier-detail__heading span { color: var(--fee-muted); font-size: 12px; }
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
