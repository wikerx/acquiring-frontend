<template>
    <el-popover
        v-if="normalizedCurrencies.length"
        trigger="hover"
        placement="top"
        :width="420"
        :show-after="180"
        :hide-after="80"
        :enterable="true"
        popper-class="channel-currency-scope-popper"
    >
        <div class="scope-panel">
            <div class="scope-panel__header">
                <span>{{ label }}</span>
                <span class="scope-panel__count">{{ normalizedCurrencies.length }}</span>
            </div>
            <div class="scope-panel__grid">
                <span
                    v-for="currency in normalizedCurrencies"
                    :key="currency"
                    class="scope-panel__item"
                    :class="{ 'is-default': currency === normalizedDefaultCurrency }"
                >
                    <CurrencyDisplay :currency="currency" :locale="locale" size="xs" variant="soft" />
                    <span v-if="currency === normalizedDefaultCurrency" class="default-badge">
                        <el-icon><Check /></el-icon>
                        {{ defaultLabel }}
                    </span>
                </span>
            </div>
        </div>
        <template #reference>
            <div class="scope-trigger" tabindex="0" :aria-label="accessibleText">
                <el-tag v-if="summaryLabel" size="small" effect="plain">{{ summaryLabel }}</el-tag>
                <template v-else>
                    <span
                        v-for="currency in previewCurrencies"
                        :key="currency"
                        class="scope-preview__item"
                        :class="{ 'is-default': currency === normalizedDefaultCurrency }"
                    >
                        <CurrencyDisplay :currency="currency" :locale="locale" size="xs" variant="soft" />
                        <span v-if="currency === normalizedDefaultCurrency" class="default-badge">
                            <el-icon><Check /></el-icon>
                            {{ defaultLabel }}
                        </span>
                    </span>
                    <span v-if="remaining" class="scope-more">+{{ remaining }}</span>
                </template>
            </div>
        </template>
    </el-popover>
    <span v-else>-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Check } from '@element-plus/icons-vue';
import { CurrencyDisplay } from '@acquiring/shared';

const props = withDefaults(defineProps<{
    currencies?: string[];
    defaultCurrency?: string;
    defaultLabel?: string;
    label: string;
    locale?: string;
    previewLimit?: number;
    summaryLabel?: string;
}>(), {
    currencies: () => [],
    defaultCurrency: '',
    defaultLabel: '',
    locale: 'zh-CN',
    previewLimit: 3,
    summaryLabel: '',
});

function normalizeCurrency(value?: string) {
    return String(value || '').trim().toUpperCase();
}

const normalizedCurrencies = computed(() => Array.from(new Set(props.currencies.map(normalizeCurrency).filter(Boolean))));
const normalizedDefaultCurrency = computed(() => normalizeCurrency(props.defaultCurrency));
const previewCurrencies = computed(() => normalizedCurrencies.value.slice(0, props.previewLimit));
const remaining = computed(() => Math.max(normalizedCurrencies.value.length - previewCurrencies.value.length, 0));
const accessibleText = computed(() => `${props.label}: ${normalizedCurrencies.value.join(', ')}`);
</script>

<style scoped>
.scope-trigger {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 3px;
    border-radius: 4px;
    cursor: help;
    outline: none;
    transition: background-color 0.16s ease, box-shadow 0.16s ease;
}

.scope-trigger:hover,
.scope-trigger:focus-visible {
    background: var(--el-color-primary-light-9);
    box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}

.scope-more {
    display: inline-flex;
    min-width: 28px;
    height: 22px;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: 1px solid #dbe4ee;
    border-radius: 5px;
    background: #f5f8fb;
    color: #475569;
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 1;
}

.scope-panel {
    padding: 13px 14px 14px;
}

.scope-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #e9eef5;
    color: #1f2937;
    font-size: 13px;
    font-weight: 700;
    line-height: 20px;
}

.scope-panel__count {
    display: inline-flex;
    min-width: 26px;
    height: 22px;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border-radius: 5px;
    background: #eef4ff;
    color: #2563eb;
    font-size: 11px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.scope-panel__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    max-height: 224px;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.scope-panel__item,
.scope-preview__item {
    display: inline-flex;
    min-width: 0;
    align-items: center;
    gap: 4px;
    border: 1px solid transparent;
    border-radius: 5px;
}

.scope-panel__item {
    min-height: 38px;
    justify-content: center;
    padding: 6px;
    border-color: #e7edf4;
    background: #f8fafc;
}

.scope-panel__item.is-default,
.scope-preview__item.is-default {
    border-color: #a7dfc2;
    background: #f0faf5;
}

.scope-preview__item {
    padding: 2px 6px 2px 2px;
}

.scope-panel__item.is-default :deep(.currency-display--soft),
.scope-preview__item.is-default :deep(.currency-display--soft) {
    border-color: transparent;
    background: transparent;
}

.default-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: #167252;
    font-size: 10px;
    font-weight: 700;
    line-height: 18px;
    white-space: nowrap;
}

.default-badge .el-icon {
    font-size: 12px;
}

:global(.channel-currency-scope-popper) {
    max-width: calc(100vw - 32px) !important;
    padding: 0 !important;
    overflow: hidden;
    border-color: #dce5ef !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    box-shadow: 0 10px 28px rgb(15 23 42 / 14%) !important;
}
</style>
