<template>
    <el-drawer :model-value="visible" :title="title" size="min(1280px, 96vw)" @close="$emit('update:visible', false)">
        <div v-if="plan" class="fee-detail">
            <el-descriptions :column="3" border>
                <el-descriptions-item :label="$t('feeAccount.planCode')">{{ plan.planCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.planStatus')"><el-tag :type="planStatusType(plan.status)">{{ statusText(plan.status) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.currentVersion')">{{ plan.currentVersionNo ? `v${plan.currentVersionNo}` : '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.merchantId')">{{ plan.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.merchantName')">{{ plan.merchantName || '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.settlementCurrency')">
                    <CurrencyDisplay :currency="plan.settlementCurrency" :locale="String(locale)" size="xs" variant="soft" />
                </el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.configurationOriginLabel')">{{ originText(plan.originType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')" :span="3">{{ plan.remark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <el-empty v-if="!plan.versions?.length" :description="$t('feeAccount.noVersions')" />
            <el-collapse v-else v-model="expandedVersions" class="fee-version-history">
                <el-collapse-item v-for="version in plan.versions" :key="version.id" :name="version.id">
                    <template #title>
                        <div class="fee-version-title">
                            <strong>v{{ version.versionNo }}</strong>
                            <el-tag :type="versionStatusType(version.versionStatus)" size="small">{{ statusText(version.versionStatus) }}</el-tag>
                            <span>{{ version.changeReason }}</span>
                            <BaseDateTime :value="version.submitTime" />
                        </div>
                    </template>
                    <div class="fee-version-body">
                        <el-descriptions :column="3" size="small" border>
                            <el-descriptions-item :label="$t(version.versionStatus === 'DRAFT' ? 'feeAccount.lastSavedBy' : 'feeAccount.submitter')">{{ version.submitByName }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.reviewerLabel')">{{ version.reviewByName || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t(version.versionStatus === 'DRAFT' ? 'feeAccount.lastSavedTime' : 'feeAccount.effectiveTime')"><BaseDateTime :value="version.versionStatus === 'DRAFT' ? version.submitTime : version.effectiveTime" /></el-descriptions-item>
                            <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.settlementCurrency')">
                                <CurrencyDisplay v-if="version.settlementCurrency" :currency="version.settlementCurrency" :locale="String(locale)" size="xs" variant="soft" />
                                <span v-else>-</span>
                            </el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.reviewCommentLabel')" :span="3">{{ version.reviewComment || '-' }}</el-descriptions-item>
                        </el-descriptions>
                        <el-tabs v-model="activeTabs[version.id]" class="fee-detail-tabs">
                            <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :label="tab.label" :name="tab.name">
                                <el-table
                                    :data="rulesFor(version, tab.name)"
                                    border
                                    size="small"
                                    class="fee-rules-table"
                                    row-key="id"
                                    :expand-row-keys="tierRuleIds(version, tab.name)"
                                    :row-class-name="feeRowClassName"
                                >
                                    <el-table-column v-if="hasTierRules(version, tab.name)" type="expand" width="48" fixed="left">
                                        <template #default="{ row }">
                                            <div v-if="row.tiers?.length" class="fee-tier-detail">
                                                <div class="fee-tier-detail__heading">
                                                    <strong>{{ feeModeText(row) }}</strong>
                                                    <span>{{ tierMetricText(row) }}</span>
                                                </div>
                                                <el-table :data="row.tiers" border size="small">
                                                    <el-table-column prop="lowerBound" :label="$t('feeAccount.lowerInclusive')" min-width="120" align="center" />
                                                    <el-table-column :label="$t('feeAccount.upperExclusive')" min-width="130" align="center">
                                                        <template #default="{ row: tier }">{{ tier.upperBound ?? $t('feeAccount.unlimited') }}</template>
                                                    </el-table-column>
                                                    <el-table-column :label="$t('feeAccount.percentageRate')" min-width="130" align="right">
                                                        <template #default="{ row: tier }"><PercentageRateDisplay :value="tier.percentageRate" :locale="String(locale)" align="end" /></template>
                                                    </el-table-column>
                                                    <el-table-column :label="$t('feeAccount.fixedUsd')" min-width="120" align="right">
                                                        <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.fixedAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
                                                    </el-table-column>
                                                    <el-table-column :label="$t('feeAccount.minimumUsd')" min-width="120" align="right">
                                                        <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.minimumAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
                                                    </el-table-column>
                                                    <el-table-column :label="$t('feeAccount.maximumUsd')" min-width="120" align="right">
                                                        <template #default="{ row: tier }"><CurrencyAmountDisplay :amount="tier.maximumAmountUsd" currency="USD" :locale="String(locale)" size="xs" align="end" /></template>
                                                    </el-table-column>
                                                </el-table>
                                            </div>
                                        </template>
                                    </el-table-column>
                                    <el-table-column prop="ruleName" :label="$t('feeAccount.ruleName')" min-width="150" align="center" />
                                    <el-table-column v-if="tab.name === 'RISK_FEE'" :label="$t('feeAccount.riskServiceType')" min-width="120" align="center">
                                        <template #default="scope"><el-tag effect="plain" size="small" type="success">{{ riskServiceText(scope.row.riskServiceType) }}</el-tag></template>
                                    </el-table-column>
                                    <el-table-column v-if="tab.name === 'RISK_FEE'" :label="$t('feeAccount.chargeTrigger')" min-width="150" align="center">
                                        <template #default="scope">{{ chargeTriggerText(scope.row.chargeTrigger) }}</template>
                                    </el-table-column>
                                    <el-table-column :label="$t('feeAccount.transactionType')" min-width="300" align="center">
                                        <template #default="scope">
                                            <ChannelTransactionScopeDisplay
                                                :items="transactionTypeItems(scope.row)"
                                                :label="$t('feeAccount.transactionType')"
                                            />
                                        </template>
                                    </el-table-column>
                                    <el-table-column :label="$t('feeAccount.paymentMethod')" min-width="260" align="center">
                                        <template #default="scope">
                                            <ChannelPaymentScopeDisplay
                                                :keys="paymentScopeKeys(scope.row)"
                                                :label="$t('feeAccount.paymentMethod')"
                                            />
                                        </template>
                                    </el-table-column>
                                    <el-table-column :label="$t('feeAccount.billingRule')" min-width="280" align="center"><template #default="scope">{{ billingRuleText(scope.row) }}</template></el-table-column>
                                    <el-table-column :label="$t('feeAccount.feeMode')" width="140" align="center">
                                        <template #default="scope">
                                            <el-tag :type="scope.row.feeMode === 'TIER' ? 'warning' : 'primary'" effect="plain" size="small">
                                                {{ feeModeText(scope.row) }}
                                            </el-tag>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-tab-pane>
                            <el-tab-pane :label="$t('feeAccount.reserveSettings')" name="RESERVE">
                                <el-descriptions :column="2" size="small" border>
                                    <el-descriptions-item :label="$t('feeAccount.reserveRate')"><PercentageRateDisplay :value="version.reserveRate" :locale="String(locale)" emphasized /></el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.reserveDelayDays')">{{ settlementCycle(version.reserveDelayUnit || 'D', version.reserveDelayDays) }}</el-descriptions-item>
                                </el-descriptions>
                            </el-tab-pane>
                            <el-tab-pane :label="$t('feeAccount.settlementSettings')" name="SETTLEMENT">
                                <el-descriptions :column="3" size="small" border>
                                    <el-descriptions-item :label="$t('feeAccount.initialPeriod')">{{ settlementCycle(version.initialDelayUnit, version.initialDelayDays) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.regularPeriod')">{{ settlementCycle(version.regularDelayUnit, version.regularDelayDays) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.settlementFrequency')">{{ frequencyText(version.settlementFrequency, version.frequencyDay) }}</el-descriptions-item>
                                </el-descriptions>
                                <div class="fee-fx-detail">
                                    <div class="fee-fx-detail__head">
                                        <strong>{{ $t('feeAccount.settlementFxFee') }}</strong>
                                        <span>{{ $t('feeAccount.settlementFxFeeHint') }}</span>
                                    </div>
                                    <el-empty v-if="!rulesFor(version, 'SETTLEMENT_FX_FEE').length" :description="$t('feeAccount.noFxRules')" :image-size="56" />
                                    <el-descriptions v-else :column="2" border size="small" class="fee-fx-summary">
                                        <el-descriptions-item :label="$t('feeAccount.feeMode')"><el-tag effect="plain" type="primary" size="small">{{ $t('feeAccount.standard') }}</el-tag></el-descriptions-item>
                                        <el-descriptions-item :label="$t('feeAccount.billingRule')">{{ feeFormula(firstRuleFor(version, 'SETTLEMENT_FX_FEE')!) }}</el-descriptions-item>
                                        <el-descriptions-item :label="$t('feeAccount.transactionType')" :span="2">
                                            <ChannelTransactionScopeDisplay
                                                :items="transactionTypeItems(firstRuleFor(version, 'SETTLEMENT_FX_FEE')!)"
                                                :label="$t('feeAccount.transactionType')"
                                            />
                                        </el-descriptions-item>
                                        <el-descriptions-item :label="$t('common.remark')" :span="2">{{ firstRuleFor(version, 'SETTLEMENT_FX_FEE')?.remark || '-' }}</el-descriptions-item>
                                    </el-descriptions>
                                </div>
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
    CurrencyAmountDisplay,
    CurrencyDisplay,
    PercentageRateDisplay,
    formatMoneyAmount,
    type PaymentLogoKey,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import type { FeePlanDetail, FeeRule, FeeVersion } from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import ChannelPaymentScopeDisplay from '@/views/channel/components/ChannelPaymentScopeDisplay.vue';
import ChannelTransactionScopeDisplay from '@/views/channel/components/ChannelTransactionScopeDisplay.vue';
import {
    cardLogoKeys,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    type SelectOption,
} from '@/views/channel/shared';
import { feeFormula, frequencyText, originText, planStatusType, settlementCycle, statusText, versionStatusType } from '@/views/fee/shared';

const props = withDefaults(defineProps<{
    visible: boolean;
    title: string;
    plan?: FeePlanDetail | null;
    showMerchant?: boolean;
}>(), { plan: null, showMerchant: false });

defineEmits<{ 'update:visible': [value: boolean] }>();
const { locale, t } = useI18n();
const expandedVersions = ref<number[]>([]);
const activeTabs = reactive<Record<number, string>>({});
const transactionTypeOptions = ref<SelectOption[]>([]);
const paymentTypeOptions = ref<SelectOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
let loadedDictLocale = '';
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('feeAccount.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('feeAccount.category.refund') },
    { name: 'RISK_FEE' as const, label: t('feeAccount.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('feeAccount.category.dispute') },
]);

watch(() => props.plan, (plan) => {
    expandedVersions.value = plan?.currentVersionId ? [plan.currentVersionId] : plan?.versions?.slice(0, 1).map((item) => item.id) || [];
    plan?.versions?.forEach((version) => { activeTabs[version.id] = 'TRANSACTION_FEE'; });
}, { immediate: true });

watch([() => props.visible, () => locale.value], ([visible]) => {
    if (visible) void loadDimensionOptions();
}, { immediate: true });

async function loadDimensionOptions() {
    const language = String(locale.value || 'zh-CN');
    if (loadedDictLocale === language) return;
    const results = await Promise.allSettled([
        loadDictOptions('transaction_type', language),
        loadDictOptions('acquiring_payment_method', language),
        loadDictOptions('card_brand', language),
    ]);
    transactionTypeOptions.value = settledOptions(results[0]);
    paymentTypeOptions.value = settledOptions(results[1]);
    paymentMethodOptions.value = settledOptions(results[2]);
    if (results.every((result) => result.status === 'fulfilled')) loadedDictLocale = language;
}

function settledOptions(result: PromiseSettledResult<SelectOption[]>) {
    return result.status === 'fulfilled' ? result.value : [];
}

function rulesFor(version: FeeVersion, category: FeeRule['feeCategory']) {
    return version.rules.filter((rule) => rule.feeCategory === category);
}

function firstRuleFor(version: FeeVersion, category: FeeRule['feeCategory']) {
    return rulesFor(version, category)[0];
}

function hasTierRules(version: FeeVersion, category: FeeRule['feeCategory']) {
    return rulesFor(version, category).some((rule) => rule.feeMode === 'TIER' && rule.tiers?.length);
}

function tierRuleIds(version: FeeVersion, category: FeeRule['feeCategory']) {
    return rulesFor(version, category)
        .filter((rule) => rule.feeMode === 'TIER' && rule.tiers?.length)
        .map((rule) => rule.id);
}

function feeRowClassName({ row }: { row: FeeRule }) {
    return row.feeMode === 'TIER' && row.tiers?.length ? 'fee-tier-row' : 'fee-standard-row';
}

function riskServiceText(type?: FeeRule['riskServiceType']) {
    if (type === 'INTERNAL') return t('feeAccount.riskType.internal');
    if (type === 'EXTERNAL') return t('feeAccount.riskType.external');
    if (type === 'THREE_DS') return t('feeAccount.riskType.threeDs');
    return '-';
}

function chargeTriggerText(trigger?: FeeRule['chargeTrigger']) {
    if (trigger === 'NO_CHARGE') return t('feeAccount.chargeTriggerType.noCharge');
    if (trigger === 'SUCCESS') return t('feeAccount.chargeTriggerType.success');
    if (trigger === 'SUCCESS_OR_FAILURE') return t('feeAccount.chargeTriggerType.successOrFailure');
    if (trigger === 'ON_CALL') return t('feeAccount.chargeTriggerType.onCall');
    return '-';
}

function transactionTypeItems(rule: FeeRule) {
    return dimensionItems(rule.transactionTypes, rule.transactionType, transactionTypeOptions.value)
        .map((item) => item.value === 'ALL'
            ? { ...item, label: t('feeAccount.allTransactionTypes') }
            : item);
}

function paymentTypeItems(rule: FeeRule) {
    return dimensionItems(rule.paymentTypes, rule.paymentType, paymentTypeOptions.value);
}

function paymentMethodItems(rule: FeeRule) {
    return dimensionItems(rule.paymentMethods, rule.paymentMethod, paymentMethodOptions.value, true);
}

function paymentScopeKeys(rule: FeeRule) {
    const keys: PaymentLogoKey[] = [];
    for (const paymentType of paymentTypeItems(rule)) {
        const typeOption = paymentTypeOptions.value.find((item) => item.value === paymentType.value);
        if (paymentType.value !== 'BANK_CARD') {
            keys.push(...paymentLogoKeys(paymentType.value, typeOption));
            continue;
        }
        const methods = paymentMethodItems(rule).filter((item) => item.value !== '-');
        if (!methods.length || methods.some((item) => item.value === 'ALL')) {
            keys.push(...paymentLogoKeys(paymentType.value, typeOption));
            continue;
        }
        for (const method of methods) {
            const methodOption = paymentMethodOptions.value.find((item) => item.value === method.value);
            keys.push(...cardLogoKeys(method.value, methodOption));
        }
    }
    return [...new Set(keys)];
}

function dimensionItems(batchValues: string[] | undefined, compatibleValue: string | undefined,
    options: SelectOption[], localizeAll = false) {
    const sourceValues = batchValues?.length ? batchValues : compatibleValue ? [compatibleValue] : [];
    const values = [...new Set(sourceValues.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))];
    if (!values.length) return [{ value: '-', label: '-' }];
    return values.map((value) => ({
        value,
        label: localizeAll && value === 'ALL' ? t('feeAccount.allPaymentMethods') : optionLabel(options, value),
    }));
}

function billingRuleText(rule: FeeRule) {
    if (rule.feeCategory !== 'RISK_FEE') return feeFormula(rule);
    if (rule.chargeTrigger === 'NO_CHARGE') return t('feeAccount.chargeTriggerType.noCharge');
    return t('feeAccount.riskFixedFormula', {
        amount: formatMoneyAmount(rule.fixedAmountUsd || 0, String(locale.value)),
    });
}

function feeModeText(rule: FeeRule) {
    return rule.feeMode === 'TIER'
        ? t('feeAccount.tierWithCount', { count: rule.tiers?.length || 0 })
        : t('feeAccount.standard');
}

function tierMetricText(rule: FeeRule) {
    return rule.tierMetric === 'COUNT'
        ? t('feeAccount.tierCountFormula')
        : t('feeAccount.tierAmountFormula');
}

</script>

<style scoped>
.fee-detail { display: grid; gap: 18px; }
.fee-version-history { border-top: 1px solid #e4e9f0; }
.fee-version-title { display: grid; grid-template-columns: 46px 78px minmax(160px, 1fr) 160px; align-items: center; gap: 10px; width: 100%; padding-right: 12px; }
.fee-version-title > span:not(.el-tag) { overflow: hidden; color: #606b7c; text-overflow: ellipsis; white-space: nowrap; }
.fee-version-body { display: grid; gap: 14px; padding: 4px 0 16px; }
.fee-detail-tabs :deep(.el-tabs__item) { min-width: 104px; padding: 0 14px; text-align: center; }
.fee-rules-table { width: 100%; }
.fee-tier-detail { display: grid; gap: 10px; padding: 14px 48px; background: #f7fafc; }
.fee-tier-detail__heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.fee-tier-detail__heading strong { color: #27344a; font-size: 13px; }
.fee-tier-detail__heading span { color: #697386; font-size: 12px; }
:deep(.fee-standard-row .el-table__expand-icon) { visibility: hidden; pointer-events: none; }
.fee-fx-detail { display: grid; gap: 12px; margin-top: 16px; padding-top: 14px; border-top: 1px solid #e6ebf2; }
.fee-fx-detail__head { display: grid; gap: 4px; }
.fee-fx-detail__head strong { color: #27344a; font-size: 13px; }
.fee-fx-detail__head span { color: #697386; font-size: 12px; }
.fee-fx-summary { width: 100%; }
@media (max-width: 720px) {
    .fee-version-title { grid-template-columns: 38px 72px minmax(0, 1fr); }
    .fee-version-title :deep(.base-date-time) { display: none; }
    :deep(.el-descriptions__body .el-descriptions__table) { min-width: 680px; }
    :deep(.el-descriptions) { overflow-x: auto; }
    .fee-tier-detail { padding: 10px; }
}
</style>
