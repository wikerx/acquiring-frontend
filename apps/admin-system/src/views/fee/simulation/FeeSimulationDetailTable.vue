<template>
    <div class="simulation-detail-table">
        <el-table :data="details" border size="small" row-key="lineNo">
            <el-table-column :label="$t('feeAccount.feeType')" min-width="118" align="center">
                <template #default="{ row }">{{ feeTypeText(row) }}</template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.calculationStatus')" min-width="108" align="center">
                <template #default="{ row }">
                    <el-tag :type="statusTagType(row.calculationStatus)" effect="plain" size="small">
                        {{ calculationStatusText(row.calculationStatus) }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="ruleName" :label="$t('feeAccount.ruleName')" min-width="136" align="center" show-overflow-tooltip>
                <template #default="{ row }">{{ row.ruleName || '-' }}</template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.feeMode')" min-width="108" align="center">
                <template #default="{ row }">{{ feeModeText(row.feeMode) }}</template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.chargeTrigger')" min-width="138" align="center">
                <template #default="{ row }">{{ chargeTriggerText(row) }}</template>
            </el-table-column>
            <el-table-column prop="formulaSnapshot" :label="$t('feeAccount.formulaSnapshot')" min-width="240" show-overflow-tooltip>
                <template #default="{ row }">{{ row.formulaSnapshot || '-' }}</template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.feeLimit')" min-width="118" align="center">
                <template #default="{ row }">{{ limitText(row.appliedLimit) }}</template>
            </el-table-column>
            <el-table-column :label="$t('feeAccount.feeAmount')" min-width="128" align="right">
                <template #default="{ row }">
                    <BaseAmount v-if="row.finalFeeUsd !== null && row.finalFeeUsd !== undefined" :value="row.finalFeeUsd" currency="USD" currency-display="code" :fraction-digits="2" />
                    <span v-else>-</span>
                </template>
            </el-table-column>
        </el-table>
        <div v-if="showSummary" class="simulation-detail-table__summary">
            <div class="simulation-detail-table__total">
                <span>{{ $t('feeAccount.feeTotal') }}</span>
                <strong><BaseAmount :value="totalFeeUsd" currency="USD" currency-display="code" :fraction-digits="2" /></strong>
            </div>
            <div v-if="feeTotalFormula || netSettlementFormula" class="simulation-detail-table__formulas">
                <div v-if="feeTotalFormula"><span>{{ $t('feeAccount.feeTotalFormula') }}</span><code>{{ feeTotalFormula }}</code></div>
                <div v-if="netSettlementFormula"><span>{{ $t('feeAccount.netSettlementFormula') }}</span><code>{{ netSettlementFormula }}</code></div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import type { DecimalValue, FeeSimulationDetail } from '@/api/fee';
import BaseAmount from '@/components/BaseAmount/index.vue';

withDefaults(defineProps<{
    details: FeeSimulationDetail[];
    showSummary?: boolean;
    totalFeeUsd?: DecimalValue;
    feeTotalFormula?: string | null;
    netSettlementFormula?: string | null;
}>(), {
    details: () => [],
    showSummary: false,
    totalFeeUsd: 0,
    feeTotalFormula: '',
    netSettlementFormula: '',
});

const { t } = useI18n();

function feeTypeText(detail: FeeSimulationDetail) {
    if (detail.itemType === 'RESERVE' || detail.feeCategory === 'RESERVE') return t('feeAccount.itemTypeValue.RESERVE');
    if (detail.feeCategory === 'RISK_FEE') return riskServiceText(detail.riskServiceType);
    if (detail.feeCategory === 'REFUND_FEE') return t('feeAccount.category.refund');
    if (detail.feeCategory === 'DISPUTE_FEE') return t('feeAccount.category.dispute');
    if (detail.feeCategory === 'SETTLEMENT_FX_FEE' || detail.feeCategory === 'SETTLEMENT_PROCESSING_FEE') {
        return t('feeAccount.settlementFxFee');
    }
    return t('feeAccount.category.transaction');
}

function riskServiceText(value?: FeeSimulationDetail['riskServiceType']) {
    if (value === 'INTERNAL') return t('feeAccount.riskType.internal');
    if (value === 'EXTERNAL') return t('feeAccount.riskType.external');
    if (value === 'THREE_DS') return t('feeAccount.riskType.threeDs');
    return '-';
}

function calculationStatusText(value?: FeeSimulationDetail['calculationStatus'] | null) {
    if (value !== 'CALCULATED' && value !== 'NOT_APPLICABLE' && value !== 'NOT_CONFIGURED') {
        return t('feeAccount.calculationStatusUnknown');
    }
    return t(`feeAccount.calculationStatusValue.${value}`);
}

function statusTagType(value?: FeeSimulationDetail['calculationStatus'] | null) {
    if (value === 'CALCULATED') return 'success';
    if (value === 'NOT_CONFIGURED') return 'warning';
    return 'info';
}

function feeModeText(value?: FeeSimulationDetail['feeMode']) {
    if (value === 'TIER') return t('feeAccount.tier');
    if (value === 'STANDARD') return t('feeAccount.standard');
    return '-';
}

function chargeTriggerText(detail: FeeSimulationDetail) {
    if (detail.calculationStatus !== 'CALCULATED') return '-';
    if (detail.chargeTrigger === 'NO_CHARGE') return t('feeAccount.chargeTriggerType.noCharge');
    if (detail.chargeTrigger === 'SUCCESS') return t('feeAccount.chargeTriggerType.success');
    if (detail.chargeTrigger === 'SUCCESS_OR_FAILURE') return t('feeAccount.chargeTriggerType.successOrFailure');
    if (detail.chargeTrigger === 'ON_CALL') return t('feeAccount.chargeTriggerType.onCall');
    return '-';
}

function limitText(value?: string) {
    if (value === 'MINIMUM') return t('feeAccount.minimumApplied');
    if (value === 'MAXIMUM') return t('feeAccount.maximumApplied');
    return '-';
}
</script>

<style scoped>
.simulation-detail-table { min-width: 0; }
.simulation-detail-table__summary { border: 1px solid #dfe5ec; border-top: 0; background: #f7f9fc; }
.simulation-detail-table__total { display: flex; align-items: center; justify-content: flex-end; gap: 22px; min-height: 42px; padding: 8px 16px; color: #303846; }
.simulation-detail-table__total span { font-size: 13px; font-weight: 600; }
.simulation-detail-table__total strong { min-width: 132px; color: var(--el-color-primary); font-size: 16px; font-variant-numeric: tabular-nums; text-align: right; }
.simulation-detail-table__formulas { display: grid; gap: 5px; padding: 10px 16px; border-top: 1px solid #dfe5ec; background: #fff; }
.simulation-detail-table__formulas > div { display: grid; grid-template-columns: 116px minmax(0, 1fr); align-items: baseline; gap: 10px; }
.simulation-detail-table__formulas span { color: #697386; font-size: 11px; }
.simulation-detail-table__formulas code { overflow-wrap: anywhere; color: #303846; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; line-height: 1.6; }
@media (max-width: 640px) {
    .simulation-detail-table__formulas > div { grid-template-columns: 1fr; gap: 2px; }
}
</style>
