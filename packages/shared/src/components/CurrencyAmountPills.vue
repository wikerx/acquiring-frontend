<template>
    <div class="currency-amount-pills" :class="`currency-amount-pills--${tone}`">
        <span
            v-for="(item, index) in displayItems"
            :key="`${item.currency}:${index}`"
            class="currency-amount-pill"
            :class="{ 'is-negative': isNegative(item.amount) }"
            :title="displayText(item)"
        >
            <b>{{ item.currency }}</b>
            <strong>{{ formattedAmount(item.amount) }}</strong>
        </span>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDecimalAmount } from '../amount';

export interface CurrencyAmountPillItem {
    currency?: string | null;
    amount?: string | number | null;
}

const props = withDefaults(defineProps<{
    items?: CurrencyAmountPillItem[];
    fallbackCurrency?: string;
    fallbackAmount?: string | number;
    locale?: string;
    tone?: 'green' | 'blue' | 'amber' | 'neutral';
}>(), {
    items: () => [],
    fallbackCurrency: 'USD',
    fallbackAmount: '0',
    locale: 'zh-CN',
    tone: 'neutral',
});

const displayItems = computed(() => {
    const normalized = props.items
        .filter((item) => item.amount !== undefined && item.amount !== null && item.amount !== '')
        .map((item) => ({
            currency: normalizeCurrency(item.currency),
            amount: item.amount as string | number,
        }));
    return normalized.length ? normalized : [{
        currency: normalizeCurrency(props.fallbackCurrency),
        amount: props.fallbackAmount,
    }];
});

function normalizeCurrency(currency?: string | null) {
    return String(currency || props.fallbackCurrency || 'USD').trim().toUpperCase() || 'USD';
}

function formattedAmount(amount: string | number) {
    return formatDecimalAmount(amount, props.locale);
}

function displayText(item: { currency: string; amount: string | number }) {
    return `${item.currency} ${formattedAmount(item.amount)}`;
}

function isNegative(amount: string | number) {
    return /^-/.test(String(amount).trim()) && !/^-0(?:\.0*)?$/.test(String(amount).trim());
}
</script>

<style scoped>
.currency-amount-pills {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 5px;
    min-width: 0;
    max-width: 100%;
}

.currency-amount-pill {
    --pill-border: #d7e0ea;
    --pill-currency-bg: #f3f6f9;
    --pill-currency-color: #475467;
    display: inline-flex;
    align-items: stretch;
    overflow: hidden;
    max-width: 100%;
    min-height: 29px;
    border: 1px solid var(--pill-border);
    border-radius: 5px;
    background: #fff;
    color: #17243a;
    font-variant-numeric: tabular-nums;
    line-height: 27px;
    white-space: nowrap;
}

.currency-amount-pill b {
    padding: 0 8px;
    border-right: 1px solid var(--pill-border);
    background: var(--pill-currency-bg);
    color: var(--pill-currency-color);
    font-size: 12px;
    font-weight: 700;
}

.currency-amount-pill strong {
    overflow: hidden;
    padding: 0 9px;
    font-size: 14px;
    font-weight: 650;
    text-overflow: ellipsis;
}

.currency-amount-pills--green .currency-amount-pill {
    --pill-border: #c9e6d9;
    --pill-currency-bg: #edf8f3;
    --pill-currency-color: #137a5d;
}

.currency-amount-pills--blue .currency-amount-pill {
    --pill-border: #cadcf8;
    --pill-currency-bg: #edf4ff;
    --pill-currency-color: #2563b8;
}

.currency-amount-pills--amber .currency-amount-pill {
    --pill-border: #ecd9aa;
    --pill-currency-bg: #fff7e4;
    --pill-currency-color: #9a6815;
}

.currency-amount-pill.is-negative strong { color: #c2413b; }
</style>
