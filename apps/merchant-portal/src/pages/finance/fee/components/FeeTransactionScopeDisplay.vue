<template>
    <el-popover
        v-if="normalizedItems.length"
        trigger="hover"
        placement="top"
        :width="420"
        :show-after="180"
        :hide-after="80"
        :enterable="true"
        popper-class="merchant-fee-transaction-scope-popper"
    >
        <div class="scope-panel">
            <div class="scope-panel__header">
                <span>{{ label }}</span>
                <span class="scope-panel__count">{{ normalizedItems.length }}</span>
            </div>
            <div class="scope-panel__grid">
                <div v-for="item in normalizedItems" :key="item.value" class="scope-panel__item">
                    <TransactionTypeDisplay :value="item.value" :label="item.label" align="start" />
                </div>
            </div>
        </div>
        <template #reference>
            <div class="scope-trigger" tabindex="0" :aria-label="accessibleText">
                <TransactionTypeDisplay
                    v-for="item in previewItems"
                    :key="item.value"
                    :value="item.value"
                    :label="item.label"
                />
                <span v-if="remaining" class="scope-more">+{{ remaining }}</span>
            </div>
        </template>
    </el-popover>
    <span v-else class="scope-empty">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { TransactionTypeDisplay } from '@acquiring/shared';

interface TransactionTypeItem {
    value: string;
    label: string;
}

const props = withDefaults(defineProps<{
    items?: TransactionTypeItem[];
    label: string;
    previewLimit?: number;
}>(), {
    items: () => [],
    previewLimit: 3,
});

const normalizedItems = computed(() => {
    const seen = new Set<string>();
    return props.items.filter((item) => {
        const value = item.value?.trim();
        if (!value || seen.has(value)) return false;
        seen.add(value);
        return true;
    });
});
const previewItems = computed(() => normalizedItems.value.slice(0, props.previewLimit));
const remaining = computed(() => Math.max(normalizedItems.value.length - previewItems.value.length, 0));
const accessibleText = computed(() => `${props.label}: ${normalizedItems.value
    .map((item) => item.label)
    .join(', ')}`);
</script>

<style scoped>
.scope-trigger {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 10px;
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

.scope-trigger :deep(.transaction-type-display) {
    min-width: 0;
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    max-height: 224px;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.scope-panel__item {
    display: flex;
    min-width: 0;
    min-height: 38px;
    align-items: center;
    padding: 7px 9px;
    border: 1px solid #e7edf4;
    border-radius: 5px;
    background: #f8fafc;
}

.scope-panel__item :deep(.transaction-type-display) {
    width: 100%;
    white-space: normal;
}

.scope-panel__item :deep(.transaction-type-display__text) {
    overflow: visible;
    text-overflow: clip;
    overflow-wrap: anywhere;
}

.scope-empty {
    color: #98a2b3;
}

:global(.merchant-fee-transaction-scope-popper) {
    max-width: calc(100vw - 32px) !important;
    padding: 0 !important;
    overflow: hidden;
    border-color: #dce5ef !important;
    border-radius: 6px !important;
    background: #fff !important;
    box-shadow: 0 10px 28px rgb(15 23 42 / 14%) !important;
}
</style>
