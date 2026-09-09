<template>
    <span class="amount">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDecimalAmount, roundDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { formatAmount } from '@/utils/format';

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
    const amount = props.fractionDigits === undefined
        ? props.value
        : roundDecimalAmount(props.value, props.fractionDigits);
    if (props.currencyDisplay === 'code') {
        const formattedAmount = props.fractionDigits === undefined
            ? formatDecimalAmount(amount, String(locale.value || 'zh-CN'))
            : formatDecimalAmount(
                amount,
                String(locale.value || 'zh-CN'),
                props.fractionDigits,
                props.fractionDigits,
            );
        return `${String(props.currency || 'USD').toUpperCase()} ${formattedAmount}`;
    }
    return formatAmount(amount, props.currency);
});
</script>
