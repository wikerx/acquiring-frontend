<template>
    <span class="amount">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDecimalAmount, roundDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { currencyFractionDigits, formatAmount } from '@/utils/format';

const props = withDefaults(defineProps<{
    value: string | number | null | undefined;
    currency?: string;
    currencyDisplay?: 'symbol' | 'code';
    fractionDigits?: number;
}>(), {
    currency: 'USD',
    currencyDisplay: 'symbol',
});
const { locale } = useI18n();

const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') {
        return '-';
    }
    const currentLocale = String(locale.value || 'zh-CN');
    const digits = props.fractionDigits
        ?? currencyFractionDigits(props.currency, currentLocale);
    const amount = roundDecimalAmount(props.value, digits);
    if (props.currencyDisplay === 'code') {
        const formattedAmount = formatDecimalAmount(amount, currentLocale, digits, digits);
        return `${String(props.currency || 'USD').toUpperCase()} ${formattedAmount}`;
    }
    return formatAmount(amount, props.currency, currentLocale, digits);
});
</script>
