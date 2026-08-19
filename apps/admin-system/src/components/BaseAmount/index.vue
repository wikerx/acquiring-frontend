<template>
    <span class="amount">{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatDecimalAmount } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { formatAmount } from '@/utils/format';

const props = withDefaults(defineProps<{
    value: string | number | null | undefined;
    currency?: string;
    currencyDisplay?: 'symbol' | 'code';
}>(), {
    currency: 'USD',
    currencyDisplay: 'symbol',
});
const { locale } = useI18n();

const displayValue = computed(() => {
    if (props.value === null || props.value === undefined || props.value === '') {
        return '-';
    }
    if (props.currencyDisplay === 'code') {
        const amount = formatDecimalAmount(props.value, String(locale.value || 'zh-CN'));
        return `${String(props.currency || 'USD').toUpperCase()} ${amount}`;
    }
    return formatAmount(props.value, props.currency);
});
</script>
