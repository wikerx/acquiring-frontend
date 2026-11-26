<template>
    <el-popover
        v-if="items.length"
        trigger="hover"
        placement="top"
        :width="400"
        :show-after="180"
        :hide-after="80"
        :enterable="true"
        popper-class="channel-payment-scope-popper"
    >
        <div class="scope-panel">
            <div class="scope-panel__header">
                <span>{{ label }}</span>
                <span class="scope-panel__count">{{ items.length }}</span>
            </div>
            <div class="scope-panel__grid">
                <div v-for="item in items" :key="item.value" class="scope-panel__item">
                    <PaymentLogoGroup v-if="item.logoKeys.length" :keys="item.logoKeys" fallback="text" size="sm" :wrap="false" />
                    <span>{{ item.label }}</span>
                </div>
            </div>
        </div>
        <template #reference>
            <div class="scope-trigger" :class="{ 'scope-trigger--entries': entries }" tabindex="0" :aria-label="accessibleText">
                <template v-if="entries">
                    <template v-for="item in previewItems" :key="item.value">
                        <PaymentLogoGroup v-if="item.logoKeys.length" :keys="item.logoKeys" fallback="text" size="sm" :wrap="false" />
                        <span v-else class="scope-label" :title="item.label">{{ item.label }}</span>
                    </template>
                </template>
                <PaymentLogoGroup v-else :keys="previewItems.flatMap((item) => item.logoKeys)" fallback="text" size="sm" align="center" :wrap="false" />
                <span v-if="remaining" class="scope-more">+{{ remaining }}</span>
            </div>
        </template>
    </el-popover>
    <span v-else>{{ emptyText }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getPaymentLogos, PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';

const props = withDefaults(defineProps<{
    keys?: PaymentLogoKey[];
    entries?: { value: string; label: string; logoKeys: PaymentLogoKey[] }[];
    label: string;
    previewLimit?: number;
    emptyText?: string;
}>(), {
    keys: () => [],
    previewLimit: 2,
    emptyText: '-',
});

const items = computed(() => props.entries ?? getPaymentLogos(props.keys).map((item) => ({
    value: item.key, label: item.label, logoKeys: [item.key],
})));
const previewItems = computed(() => items.value.slice(0, props.previewLimit));
const remaining = computed(() => items.value.length - previewItems.value.length);
const accessibleText = computed(() => `${props.label}: ${items.value.map((item) => item.label).join(', ')}`);
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

.scope-trigger :deep(.payment-logo-group) {
    flex: 0 1 auto;
    min-width: 0;
    gap: 5px;
}

.scope-trigger :deep(.payment-logo-mark) {
    pointer-events: none;
}

.scope-trigger--entries {
    gap: 3px;
    padding: 2px;
}
.scope-trigger--entries :deep(.payment-logo-mark--sm) {
    --payment-logo-height: 19px;
}

.scope-label {
    flex: 0 1 auto;
    min-width: 0;
    max-width: 88px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    gap: 9px;
    padding: 7px 9px;
    border: 1px solid #e7edf4;
    border-radius: 5px;
    background: #f8fafc;
}

.scope-panel__item :deep(.payment-logo-mark) {
    flex: 0 0 auto;
}

.scope-panel__item > span:last-child {
    min-width: 0;
    color: #334155;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    overflow-wrap: anywhere;
}

:global(.channel-payment-scope-popper) {
    max-width: calc(100vw - 32px) !important;
    padding: 0 !important;
    overflow: hidden;
    border-color: #dce5ef !important;
    border-radius: 6px !important;
    background: #ffffff !important;
    box-shadow: 0 10px 28px rgb(15 23 42 / 14%) !important;
}
</style>
