<template>
    <section class="transaction-result-bar" :class="{ 'is-compact': !items.length }">
        <div v-if="items.length" class="transaction-result-bar__summary">
            <article v-for="item in items" :key="item.key" class="transaction-summary-card" :class="item.tone ? `is-${item.tone}` : ''">
                <div class="transaction-summary-card__main">
                    <span>{{ item.label }}</span>
                    <strong v-if="item.value !== undefined && item.value !== ''">{{ item.value }}</strong>
                    <small :title="item.description">{{ item.description }}</small>
                </div>
                <div v-if="item.details?.length" class="transaction-summary-card__details" :class="{ 'is-pair': item.details.length > 1 }">
                    <div
                        v-for="detail in item.details"
                        :key="detail.key"
                        class="transaction-summary-card__detail"
                        :class="{ 'has-logo': detail.logoKeys?.length, 'is-plain': !detail.logoKeys?.length && !detail.label }"
                    >
                        <div v-if="detail.logoKeys?.length || detail.label" class="transaction-summary-card__detail-head">
                            <PaymentLogoGroup
                                v-if="detail.logoKeys?.length"
                                :keys="detail.logoKeys"
                                size="sm"
                                align="start"
                                fallback="text"
                                class="transaction-summary-card__logos"
                            />
                            <span v-else-if="detail.label" class="transaction-summary-card__detail-label">{{ detail.label }}</span>
                        </div>
                        <div class="transaction-summary-card__detail-body">
                            <b>{{ detail.value }}</b>
                            <em v-if="detail.description" :title="detail.description">{{ detail.description }}</em>
                        </div>
                    </div>
                </div>
            </article>
        </div>
        <div v-else class="transaction-result-bar__title">
            <span>{{ title }}</span>
            <small>{{ description }}</small>
        </div>
        <RightToolbar class="transaction-result-bar__toolbar" @toggle-search="$emit('toggleSearch')" @refresh="$emit('refresh')" />
    </section>
</template>

<script setup lang="ts">
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import RightToolbar from '@/components/RightToolbar/index.vue';

interface TransactionSummaryDetail {
    key: string;
    label?: string;
    value: string | number;
    description: string;
    logoKeys?: PaymentLogoKey[];
}

withDefaults(defineProps<{
    items?: Array<{
        key: string;
        label: string;
        value?: string | number;
        description: string;
        tone?: 'success' | 'danger' | 'balance';
        details?: TransactionSummaryDetail[];
    }>;
    title?: string;
    description?: string;
}>(), {
    items: () => [],
    title: '',
    description: '',
});

defineEmits<{
    toggleSearch: [];
    refresh: [];
}>();
</script>

<style scoped>
.transaction-result-bar {
    display: flex;
    align-items: stretch;
    gap: 10px;
    margin-bottom: 10px;
}

.transaction-result-bar.is-compact {
    align-items: center;
    min-height: 46px;
    border: 1px solid #e5eaf3;
    border-radius: 6px;
    padding: 8px 10px 8px 12px;
    background: var(--el-bg-color);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.transaction-result-bar__summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(260px, 1.22fr);
    gap: 10px;
    min-width: 0;
    flex: 1;
}

.transaction-result-bar__title {
    display: grid;
    min-width: 0;
    flex: 1;
    gap: 2px;
}

.transaction-result-bar__title span {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
}

.transaction-result-bar__title small {
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-result-bar__toolbar {
    align-self: center;
    border: 1px solid #e5eaf3;
    border-radius: 6px;
    padding: 9px 10px;
    background: var(--el-bg-color);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.transaction-result-bar.is-compact .transaction-result-bar__toolbar {
    border: 0;
    padding: 0;
    box-shadow: none;
}

.transaction-result-bar__toolbar :deep(.standard-right-toolbar) {
    gap: 6px;
}

.transaction-result-bar__toolbar :deep(.el-button.is-circle) {
    width: 28px;
    height: 28px;
}

.transaction-result-bar__toolbar :deep(.el-button:not(.is-circle)) {
    height: 28px;
}

.transaction-summary-card {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 4px;
    min-width: 0;
    min-height: 88px;
    border: 1px solid #e5eaf3;
    border-radius: 6px;
    padding: 7px 12px;
    background: var(--el-bg-color);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
}

.transaction-summary-card__main {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: baseline;
    column-gap: 8px;
    min-width: 0;
}

.transaction-summary-card__main span,
.transaction-summary-card__main small {
    display: block;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__main small {
    grid-column: 1 / -1;
}

.transaction-summary-card__main strong {
    display: block;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-size: 19px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__details {
    display: grid;
    grid-template-columns: 1fr;
    align-content: start;
    gap: 2px 8px;
    min-width: 0;
}

.transaction-summary-card__details.is-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.transaction-summary-card__detail {
    display: grid;
    align-items: center;
    gap: 1px;
    min-width: 0;
    min-height: 18px;
    border-radius: 4px;
    padding: 0;
    color: var(--el-text-color-regular);
    font-size: 12px;
    line-height: 15px;
}

.transaction-summary-card__detail.is-plain {
    min-height: 17px;
}

.transaction-summary-card__detail.has-logo {
    align-content: center;
    gap: 2px;
}

.transaction-summary-card__detail-head {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 16px;
}

.transaction-summary-card__detail-body {
    display: grid;
    min-width: 0;
    gap: 0;
}

.transaction-summary-card__logos {
    min-width: 0;
}

.transaction-summary-card__logos :deep(.payment-logo-group) {
    gap: 4px;
}

.transaction-summary-card__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 16px;
    max-width: 42px;
}

.transaction-summary-card__detail-label {
    overflow: hidden;
    min-width: 0;
    color: var(--el-text-color-regular);
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__detail b {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-weight: 600;
    line-height: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__detail.has-logo b {
    font-size: 11px;
}

.transaction-summary-card__detail em {
    overflow: hidden;
    min-width: 0;
    color: var(--el-text-color-secondary);
    font-style: normal;
    font-variant-numeric: tabular-nums;
    line-height: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card.is-success {
    border-color: rgba(103, 194, 58, 0.26);
}

.transaction-summary-card.is-success strong {
    color: var(--el-color-success);
}

.transaction-summary-card.is-danger {
    border-color: rgba(245, 108, 108, 0.26);
}

.transaction-summary-card.is-danger strong {
    color: var(--el-color-danger);
}

.transaction-summary-card.is-balance {
    border-color: rgba(64, 158, 255, 0.26);
}

.transaction-summary-card.is-balance strong {
    color: var(--app-primary);
    font-size: 17px;
}

@media (max-width: 980px) {
    .transaction-result-bar {
        flex-direction: column;
    }

    .transaction-result-bar__summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-summary-card {
        grid-template-rows: auto minmax(0, 1fr);
    }

    .transaction-result-bar__toolbar {
        display: flex;
        justify-content: flex-end;
        align-self: stretch;
    }

    .transaction-result-bar.is-compact .transaction-result-bar__toolbar {
        align-self: flex-end;
    }
}

@media (max-width: 640px) {
    .transaction-result-bar__summary {
        grid-template-columns: 1fr;
    }

    .transaction-summary-card,
    .transaction-summary-card.is-balance {
        grid-template-rows: auto minmax(0, 1fr);
    }
}
</style>
