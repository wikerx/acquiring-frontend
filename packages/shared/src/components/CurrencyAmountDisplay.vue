<template>
    <span
        v-if="hasAmount"
        class="currency-amount-display"
        :class="[
            `currency-amount-display--${size}`,
            `currency-amount-display--${align}`,
            `currency-amount-display--${resolvedTone}`,
            { 'is-emphasized': emphasized },
        ]"
        :title="titleText"
    >
        <CurrencyDisplay
            :currency="currency"
            :locale="locale"
            :size="currencySize"
            :variant="currencyVariant"
        />
        <span class="currency-amount-display__amount">{{ formattedAmount }}</span>
    </span>
    <span v-else class="currency-amount-display__empty">{{ emptyText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatMoneyAmount } from '../amount';
import { formatFeeAmount } from '../transactionFeeFacts';
import CurrencyDisplay from './CurrencyDisplay.vue';

const props = withDefaults(defineProps<{
    amount?: string | number | null;
    currency?: string | null;
    exponent?: number | null;
    locale?: string;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    align?: 'start' | 'center' | 'end';
    tone?: 'auto' | 'default' | 'success' | 'danger' | 'muted';
    emphasized?: boolean;
    currencyVariant?: 'plain' | 'soft';
    emptyText?: string;
    feePrecision?: boolean;
}>(), {
    amount: null,
    currency: '',
    exponent: null,
    locale: 'zh-CN',
    size: 'sm',
    align: 'start',
    tone: 'auto',
    emphasized: false,
    currencyVariant: 'plain',
    emptyText: '-',
});

const hasAmount = computed(() => (
    props.amount !== undefined && props.amount !== null && String(props.amount).trim() !== ''
));

const formattedAmount = computed(() => {
    if (!hasAmount.value) return props.emptyText;
    if (props.feePrecision) {
        return formatFeeAmount(props.amount, props.locale, props.exponent ?? undefined, undefined, props.emptyText);
    }
    return formatMoneyAmount(
        props.amount,
        props.locale,
        props.exponent,
        props.emptyText,
    );
});

const currencySize = computed<'xs' | 'sm' | 'md' | 'lg'>(() => (
    props.size === 'lg' ? 'md' : props.size
));

const isNegative = computed(() => /^-/.test(String(props.amount ?? '').trim())
    && !/^-0(?:\.0*)?$/.test(String(props.amount ?? '').trim()));
const resolvedTone = computed(() => (
    props.tone === 'auto' ? (isNegative.value ? 'danger' : 'default') : props.tone
));
const titleText = computed(() => `${String(props.currency || '').trim().toUpperCase()} ${props.feePrecision ? String(props.amount) : formattedAmount.value}`.trim());
</script>

<style scoped>
.currency-amount-display {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    max-width: 100%;
    color: #17243a;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    vertical-align: middle;
    white-space: nowrap;
}

.currency-amount-display--center { justify-content: center; }
.currency-amount-display--end { justify-content: flex-end; }
.currency-amount-display--start { justify-content: flex-start; }

.currency-amount-display__amount {
    flex: 0 0 auto;
    font-size: 13px;
    font-weight: 650;
    line-height: 1.2;
}

.currency-amount-display--xs { gap: 6px; }
.currency-amount-display--xs .currency-amount-display__amount { font-size: 12px; }
.currency-amount-display--md .currency-amount-display__amount { font-size: 15px; }
.currency-amount-display--lg { gap: 11px; }
.currency-amount-display--lg .currency-amount-display__amount { font-size: 20px; }
.currency-amount-display.is-emphasized .currency-amount-display__amount { font-weight: 800; }
.currency-amount-display--success .currency-amount-display__amount { color: #16785f; }
.currency-amount-display--danger .currency-amount-display__amount { color: #c2413b; }
.currency-amount-display--muted .currency-amount-display__amount { color: #667085; }
.currency-amount-display__empty { color: #98a2b3; }
</style>
