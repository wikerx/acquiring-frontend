<template>
    <section class="transaction-fee" :class="{ 'transaction-fee--compact': compact }"
        :aria-label="label('title')" data-testid="transaction-fee-breakdown">
        <header class="transaction-fee__header">
            <div class="transaction-fee__heading">
                <h3>{{ label('title') }}</h3>
                <span v-if="transactionType" class="transaction-fee__type">{{ label(transactionType) }}</span>
                <span v-if="status" class="transaction-fee__status">{{ status }}</span>
            </div>
            <div class="transaction-fee__actions">
                <button v-if="backAvailable" type="button" @click="$emit('back')">{{ label('back') }}</button>
                <button v-if="facts.sourceAction" type="button" @click="$emit('source', facts.sourceAction)">{{ label('original') }}</button>
                <template v-if="facts.complete && groups.length">
                    <select v-model="precision" :aria-label="label('digits')">
                        <option value="auto">{{ label('originalDigits') }}</option>
                        <option value="2">{{ label('twoDigits') }}</option>
                        <option value="4">{{ label('fourDigits') }}</option>
                    </select>
                    <button v-if="transactionId" type="button" @click="downloadFeeStatement(facts, transactionId, locale)">
                        {{ label('export') }}
                    </button>
                </template>
            </div>
        </header>
        <p v-if="!facts.complete" class="transaction-fee__notice">{{ label('incomplete') }}</p>
        <p v-else-if="!groups.length" class="transaction-fee__notice">{{ emptyText }}</p>
        <template v-else>
            <div v-if="totals.length" class="transaction-fee__total">
                <span>{{ label(allPosted ? 'postedCharge' : 'charge') }}</span>
                <div>
                    <strong v-for="item in totals" :key="item.currency" :title="item.amount">{{ money(item) }}</strong>
                </div>
            </div>
            <details v-for="group in groups" :key="group.key" class="transaction-fee__group">
                <summary>
                    <span>
                        <strong>{{ groupName(group) }}</strong>
                        <span class="transaction-fee__link">{{ label('parts') }}</span>
                    </span>
                    <span class="transaction-fee__group-right">
                        <span v-if="!group.final.length && group.needsRate" class="transaction-fee__pending">
                            {{ label(group.clearing.some(line => line.limitEvaluationStatus === 'PENDING_SETTLEMENT_RATE') ? 'pendingLimit' : 'pending') }}
                        </span>
                        <strong v-for="item in group.amounts" :key="item.currency" :title="item.amount">{{ money(item) }}</strong>
                        <span class="transaction-fee__arrow" aria-hidden="true"></span>
                    </span>
                </summary>
                <div class="transaction-fee__parts">
                    <p v-if="group.clearing.length">{{ label('clearingStage') }}</p>
                    <ul v-if="group.clearing.length">
                        <li v-for="line in group.clearing" :key="line.detailNo">
                            <span>
                                {{ componentName(line) }}
                                <small v-if="line.percentageRate && line.basisCurrency && line.basisAmount">
                                    {{ line.basisCurrency }} {{ formatFeeAmount(line.basisAmount, locale, line.currencyExponent) }}
                                    × {{ formatFeeAmount(line.percentageRate, locale, 0) }}%
                                </small>
                            </span>
                            <strong :title="line.amount">{{ sign(line.direction) }} {{ money(line) }}</strong>
                        </li>
                    </ul>
                    <p v-if="group.settlement.length">{{ label('settlementStage') }}</p>
                    <ul v-if="group.settlement.length">
                        <li v-for="(line, index) in group.settlement" :key="`${line.batchNo}-${index}`">
                            <span v-if="line.resultRole === 'TRACE'">
                                {{ line.sourceCurrency }} {{ formatFeeAmount(line.sourceAmount, locale) }}
                                × {{ formatFeeAmount(line.rate, locale, 0) }}
                                <small>{{ label('unrounded') }} {{ line.currency }} {{ formatFeeAmount(line.unroundedAmount, locale, 0) }}</small>
                            </span>
                            <span v-else>
                                {{ label('final') }}
                                <small v-if="formatFeeAmount(line.unroundedAmount, locale, 0) !== formatFeeAmount(line.amount, locale, 0)" :title="line.unroundedAmount">
                                    {{ label('unrounded') }} {{ line.currency }} {{ formatFeeAmount(line.unroundedAmount, locale, 0) }}
                                </small>
                                <small v-if="line.appliedLimit && line.appliedLimit !== 'NONE'">{{ label(line.appliedLimit) }}</small>
                                <small v-if="line.batchStatus === 'REVERSED'">{{ label('reversed') }}</small>
                            </span>
                            <strong :title="line.amount">{{ sign(line.direction) }} {{ money(line) }}</strong>
                        </li>
                    </ul>
                </div>
            </details>
        </template>
    </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatFeeAmount, groupTransactionFeeFacts, sumFeeAmounts } from '../transactionFeeFacts';
import type { ClearingFeeLine, FeeCurrencyAmount, FeeSourceAction, TransactionFeeFacts, TransactionFeeGroup } from '../transactionFeeFacts';
import { clearingFeeStateText, transactionFeeText } from '../transactionFeeMessages';
import { downloadFeeStatement } from '../feeStatementWorkbook';

const props = withDefaults(defineProps<{
    facts: TransactionFeeFacts;
    transactionId?: string;
    transactionType?: string;
    clearingStatus?: string;
    settlementStatus?: string;
    backAvailable?: boolean;
    compact?: boolean;
    locale?: string;
}>(), { locale: 'zh-CN' });

defineEmits<{ source: [action: FeeSourceAction]; back: [] }>();

const precision = ref('auto');
const groups = computed(() => groupTransactionFeeFacts(props.facts));
const allPosted = computed(() => groups.value.length > 0 && groups.value.every(group => group.final.length > 0));
const status = computed(() => {
    if (groups.value.some(group => group.final.length > 0)) {
        return label(props.settlementStatus === 'NOT_SETTLED' ? 'syncing' : 'settled');
    }
    return props.facts.settlement.some(line => line.batchStatus === 'REVERSED') ? label('reversed') : '';
});
const totals = computed(() => {
    if (allPosted.value) return sumFeeAmounts(groups.value.flatMap(group => group.final));
    if (props.facts.settlement.length || groups.value.some(group => group.needsRate)) return [];
    const amounts = sumFeeAmounts(props.facts.clearing);
    return amounts.length === 1 ? amounts : [];
});
const emptyText = computed(() => clearingFeeStateText(props.locale, props.clearingStatus));

function label(key: string) {
    return transactionFeeText(props.locale, key);
}
function money(item: FeeCurrencyAmount) {
    return `${item.currency} ${formatFeeAmount(item.amount, props.locale, item.currencyExponent,
        precision.value === 'auto' ? undefined : Number(precision.value))}`;
}
function sign(direction: string) {
    return direction === 'CREDIT' ? '−' : '+';
}
function groupName(group: TransactionFeeGroup) {
    if (group.reversal) return `${label('FEE_REVERSAL')} · ${label(group.category)}`;
    if (group.category === 'RISK_FEE' && group.riskServiceType && group.riskServiceType !== 'NONE') {
        return label(group.riskServiceType);
    }
    return label(group.category);
}
function componentName(line: ClearingFeeLine) {
    if (line.itemType === 'FEE_REVERSAL') return label('FEE_REVERSAL');
    if (line.componentType === 'LIMIT_ADJUSTMENT' && line.appliedLimit && line.appliedLimit !== 'NONE') {
        return label(line.appliedLimit);
    }
    return label(line.componentType);
}
</script>

<style scoped>
.transaction-fee { margin: 16px 0; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; overflow: hidden; background: var(--el-bg-color); color: var(--el-text-color-primary); }
.transaction-fee__header, .transaction-fee__total, .transaction-fee summary { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 13px 16px; }
.transaction-fee__heading, .transaction-fee__actions, .transaction-fee__group-right, .transaction-fee__total > div { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
.transaction-fee h3 { margin: 0; font-size: 15px; }
.transaction-fee__type, .transaction-fee__status, .transaction-fee__pending { display: inline-block; padding: 3px 8px; border-radius: 4px; background: var(--el-fill-color-light); font-size: 12px; }
.transaction-fee__status { color: var(--el-color-success-dark-2); background: var(--el-color-success-light-9); }
.transaction-fee__pending { color: var(--el-color-warning-dark-2); background: var(--el-color-warning-light-9); }
.transaction-fee__actions button, .transaction-fee__actions select { background: var(--el-bg-color); color: var(--el-color-primary); border: 1px solid var(--el-border-color); padding: 5px 8px; border-radius: 5px; font: inherit; font-size: 12px; }
.transaction-fee__actions button, .transaction-fee summary { cursor: pointer; }
.transaction-fee__total { background: var(--el-color-primary-light-9); color: var(--el-color-primary-dark-2); }
.transaction-fee__total strong { font-size: 20px; font-variant-numeric: tabular-nums; }
.transaction-fee__notice { padding: 12px 16px; margin: 0; color: var(--el-text-color-secondary); background: var(--el-fill-color-light); }
.transaction-fee__group { border-top: 1px solid var(--el-border-color-lighter); }
.transaction-fee summary { list-style: none; }
.transaction-fee summary::-webkit-details-marker { display: none; }
.transaction-fee__link { margin-inline-start: 8px; color: var(--el-color-primary); font-size: 12px; white-space: nowrap; }
.transaction-fee__arrow { width: 7px; height: 7px; margin-inline: 3px; border-right: 1px solid currentColor; border-bottom: 1px solid currentColor; transform: rotate(45deg); }
.transaction-fee__group[open] .transaction-fee__arrow { transform: rotate(225deg); }
.transaction-fee__parts { padding: 0 12px 12px; }
.transaction-fee__parts p { margin: 8px 0 4px; color: var(--el-text-color-secondary); font-size: 12px; }
.transaction-fee__parts ul { margin: 0; padding: 0 12px; list-style: none; background: var(--el-fill-color-light); border-radius: 5px; }
.transaction-fee__parts li { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px 12px; padding: 8px 0; font-variant-numeric: tabular-nums; }
.transaction-fee__parts li + li { border-top: 1px solid var(--el-border-color-lighter); }
.transaction-fee__parts small { display: block; color: var(--el-text-color-secondary); overflow-wrap: anywhere; }
.transaction-fee--compact {
    font-size: 13px;
    line-height: 1.45;
}
.transaction-fee--compact .transaction-fee__header,
.transaction-fee--compact .transaction-fee__total,
.transaction-fee--compact summary {
    padding: 9px 12px;
    gap: 6px 10px;
}
.transaction-fee--compact h3 { font-size: 14px; }
.transaction-fee--compact .transaction-fee__total strong { font-size: 16px; }
.transaction-fee--compact .transaction-fee__parts ul { padding-inline: 10px; }
.transaction-fee--compact .transaction-fee__parts li { padding-block: 6px; }
.transaction-fee--compact .transaction-fee__parts li > span {
    min-width: 0;
    overflow-wrap: anywhere;
}
.transaction-fee--compact .transaction-fee__parts li > strong {
    margin-inline-start: auto;
    white-space: nowrap;
    font-weight: 600;
}
.transaction-fee--compact .transaction-fee__parts small { font-size: 12px; }
</style>
