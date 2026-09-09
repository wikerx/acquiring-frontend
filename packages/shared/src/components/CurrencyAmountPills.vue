<template>
    <div
        class="currency-amount-pills"
        :class="[`currency-amount-pills--${tone}`, `currency-amount-pills--${variant}`]"
    >
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
    variant?: 'compact' | 'balance';
}>(), {
    items: () => [],
    fallbackCurrency: 'USD',
    fallbackAmount: '0',
    locale: 'zh-CN',
    tone: 'neutral',
    variant: 'compact',
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

.currency-amount-pills--balance {
    --balance-pill-accent: #475467;
    --balance-pill-border: #d7e0ea;
    --balance-pill-currency-bg: #f3f6f9;
    --balance-pill-surface: #ffffff;
    --balance-pill-shadow: rgb(15 23 42 / 7%);
    gap: 7px;
}

.currency-amount-pills--balance.currency-amount-pills--green {
    --balance-pill-accent: #0f7a5c;
    --balance-pill-border: #bfe5d7;
    --balance-pill-currency-bg: #e2f5ee;
    --balance-pill-surface: #fbfffd;
    --balance-pill-shadow: rgb(11 138 105 / 9%);
}

.currency-amount-pills--balance.currency-amount-pills--blue {
    --balance-pill-accent: #2563b8;
    --balance-pill-border: #c5d8f7;
    --balance-pill-currency-bg: #e5efff;
    --balance-pill-surface: #fbfdff;
    --balance-pill-shadow: rgb(37 99 201 / 9%);
}

.currency-amount-pills--balance.currency-amount-pills--amber {
    --balance-pill-accent: #9a6815;
    --balance-pill-border: #ead39e;
    --balance-pill-currency-bg: #fff0ce;
    --balance-pill-surface: #fffdf8;
    --balance-pill-shadow: rgb(175 116 25 / 10%);
}

.currency-amount-pills--balance .currency-amount-pill {
    min-height: 30px;
    border-color: var(--balance-pill-border);
    border-radius: 8px;
    background: var(--balance-pill-surface);
    box-shadow: 0 2px 7px var(--balance-pill-shadow);
    line-height: 28px;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.currency-amount-pills--balance .currency-amount-pill b {
    min-width: 42px;
    padding: 0 9px;
    border-color: var(--balance-pill-border);
    background: var(--balance-pill-currency-bg);
    color: var(--balance-pill-accent);
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.02em;
    text-align: center;
}

.currency-amount-pills--balance .currency-amount-pill strong {
    padding: 0 11px 0 10px;
    background: var(--balance-pill-surface);
    color: #17243a;
    font-size: 14px;
    font-weight: 750;
}

@media (hover: hover) {
    .currency-amount-pills--balance .currency-amount-pill:hover {
        border-color: var(--balance-pill-accent);
        box-shadow: 0 4px 10px var(--balance-pill-shadow);
        transform: translateY(-1px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .currency-amount-pills--balance .currency-amount-pill {
        transition: none;
    }
}

.currency-amount-pill.is-negative strong { color: #c2413b; }
</style>
