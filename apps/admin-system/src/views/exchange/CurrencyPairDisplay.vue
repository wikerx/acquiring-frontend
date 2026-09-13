<template>
    <span v-if="hasPair" class="currency-pair-display" :class="`currency-pair-display--${size}`">
        <CurrencyDisplay
            v-if="!isAll(baseCurrency)"
            :currency="baseCurrency"
            :locale="locale"
            :size="size"
            :variant="variant"
        />
        <span v-else class="currency-pair-display__all">ALL</span>
        <el-icon class="currency-pair-display__arrow" aria-hidden="true"><Right /></el-icon>
        <CurrencyDisplay
            v-if="!isAll(quoteCurrency)"
            :currency="quoteCurrency"
            :locale="locale"
            :size="size"
            :variant="variant"
        />
        <span v-else class="currency-pair-display__all">ALL</span>
    </span>
    <span v-else class="currency-pair-display__empty">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Right } from '@element-plus/icons-vue';
import { CurrencyDisplay } from '@acquiring/shared';

const props = withDefaults(defineProps<{
    baseCurrency?: string | null;
    quoteCurrency?: string | null;
    locale?: string;
    size?: 'xs' | 'sm';
    variant?: 'plain' | 'soft';
}>(), {
    baseCurrency: '',
    quoteCurrency: '',
    locale: 'zh-CN',
    size: 'xs',
    variant: 'plain',
});

const hasPair = computed(() => Boolean(normalizeCode(props.baseCurrency) || normalizeCode(props.quoteCurrency)));

function isAll(value?: string | null) {
    return normalizeCode(value) === 'ALL';
}

function normalizeCode(value?: string | null) {
    return String(value || '').trim().toUpperCase();
}
</script>

<style scoped>
.currency-pair-display {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    white-space: nowrap;
}

.currency-pair-display__arrow {
    flex: 0 0 auto;
    color: var(--el-color-primary);
    font-size: 13px;
}

.currency-pair-display__all {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 22px;
    padding: 0 7px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 10px;
    font-weight: 700;
}

.currency-pair-display--sm { gap: 9px; }
.currency-pair-display--sm .currency-pair-display__arrow { font-size: 15px; }
.currency-pair-display--sm .currency-pair-display__all { height: 28px; padding: 0 9px; font-size: 12px; }
.currency-pair-display__empty { color: var(--el-text-color-placeholder); }
</style>
