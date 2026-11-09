<template>
    <span
        v-if="hasValue"
        class="exchange-rate-display"
        :class="[`exchange-rate-display--${align}`, { 'is-emphasized': emphasized }]"
        :title="formattedValue"
    >{{ formattedValue }}</span>
    <span v-else class="exchange-rate-display__empty">{{ emptyText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatExchangeRate } from '../amount';

const props = withDefaults(defineProps<{
    value?: string | number | null;
    locale?: string;
    align?: 'start' | 'center' | 'end';
    emphasized?: boolean;
    emptyText?: string;
}>(), {
    value: null,
    locale: 'zh-CN',
    align: 'start',
    emphasized: false,
    emptyText: '-',
});

const hasValue = computed(() => (
    props.value !== undefined && props.value !== null && String(props.value).trim() !== ''
));
const formattedValue = computed(() => formatExchangeRate(
    props.value,
    props.locale,
    props.emptyText,
));
</script>

<style scoped>
.exchange-rate-display {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
    color: #344054;
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    line-height: 1.35;
    white-space: nowrap;
}

.exchange-rate-display--start { justify-content: flex-start; }
.exchange-rate-display--center { justify-content: center; }
.exchange-rate-display--end { justify-content: flex-end; }
.exchange-rate-display.is-emphasized { color: #17243a; font-weight: 700; }
.exchange-rate-display__empty { color: #98a2b3; }
</style>
