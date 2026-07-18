<template>
    <section class="transaction-result-bar" :class="{ 'is-compact': !items.length }">
        <div v-if="items.length" class="transaction-result-bar__summary">
            <article
                v-for="item in items"
                :key="item.key"
                class="transaction-summary-card"
                :class="[item.tone ? `is-${item.tone}` : '', item.key ? `is-${item.key}` : '']"
            >
                <div class="transaction-summary-card__head">
                    <div class="transaction-summary-card__title">
                        <span>{{ item.label }}</span>
                        <small v-if="item.description" :title="item.description">{{ item.description }}</small>
                    </div>
                </div>
                <div class="transaction-summary-card__content">
                    <strong v-if="item.value !== undefined && item.value !== ''">{{ item.value }}</strong>
                    <span v-if="item.badge" class="transaction-summary-card__badge" :class="item.badge.tone ? `is-${item.badge.tone}` : ''">
                        {{ item.badge.text }}
                    </span>
                    <div v-if="item.details?.length" class="transaction-summary-card__details" :class="{ 'is-pair': item.details.length > 1 }">
                        <div
                            v-for="detail in item.details"
                            :key="detail.key"
                            class="transaction-summary-card__detail"
                            :class="{ 'has-logo': detail.logoKeys?.length || detail.logoPlaceholder, 'is-plain': !detail.logoKeys?.length && !detail.logoPlaceholder && !detail.label }"
                            :title="detail.description || String(detail.value)"
                        >
                            <div v-if="detail.logoKeys?.length || detail.logoPlaceholder || detail.label" class="transaction-summary-card__detail-head">
                                <PaymentLogoGroup
                                    v-if="detail.logoKeys?.length"
                                    :keys="detail.logoKeys"
                                    size="sm"
                                    align="start"
                                    fallback="text"
                                    class="transaction-summary-card__logos"
                                />
                                <span v-else-if="detail.logoPlaceholder" class="transaction-summary-card__logo-placeholder"></span>
                                <span v-else-if="detail.label" class="transaction-summary-card__detail-label">{{ detail.label }}</span>
                            </div>
                            <div v-if="detail.amountMeta" class="transaction-summary-card__detail-body is-amount">
                                <span v-if="detail.amountMeta.countText" class="transaction-summary-card__count">{{ detail.amountMeta.countText }}</span>
                                <span class="transaction-summary-card__money">
                                    <span v-if="detail.amountMeta.currency" class="transaction-summary-card__currency">{{ detail.amountMeta.currency }}</span>
                                    <b>{{ detail.amountMeta.amountText }}</b>
                                </span>
                            </div>
                            <div v-else class="transaction-summary-card__detail-body">
                                <b>{{ detail.value }}</b>
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
        <div v-else class="transaction-result-bar__title">
            <span>{{ title }}</span>
            <small>{{ description }}</small>
        </div>
        <div class="transaction-result-bar__actions">
            <RightToolbar class="transaction-result-bar__toolbar" @toggle-search="$emit('toggleSearch')" @refresh="$emit('refresh')" />
        </div>
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
    logoPlaceholder?: boolean;
    amountMeta?: {
        countText?: string;
        currency?: string;
        amountText: string;
    };
}

withDefaults(defineProps<{
    items?: Array<{
        key: string;
        label: string;
        value?: string | number;
        description: string;
        tone?: 'success' | 'danger' | 'balance';
        badge?: {
            text: string;
            tone?: 'success' | 'danger' | 'warning' | 'primary';
        };
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
    gap: 0;
    margin-bottom: 8px;
    border: 1px solid #dbe3ef;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.025);
}

.transaction-result-bar.is-compact {
    align-items: center;
    min-height: 40px;
    padding: 7px 10px 7px 12px;
}

.transaction-result-bar__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    min-height: 58px;
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

.transaction-result-bar__actions,
.transaction-result-bar__toolbar {
    display: flex;
    align-items: center;
}

.transaction-result-bar__actions {
    align-self: stretch;
    min-height: 40px;
    border-left: 1px solid #edf2f7;
    padding: 7px 8px;
    gap: 6px;
}

.transaction-result-bar__toolbar {
    border: 0;
    border-radius: 0;
    padding: 0;
    background: transparent;
    box-shadow: none;
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
    width: 26px;
    height: 26px;
    border-color: #dbe3ef;
    color: #64748b;
}

.transaction-result-bar__toolbar :deep(.el-button:not(.is-circle)) {
    height: 26px;
}

.transaction-summary-card {
    position: relative;
    display: grid;
    grid-template-columns: minmax(104px, 0.28fr) minmax(0, 1fr);
    align-items: center;
    gap: 0;
    min-width: 0;
    min-height: 34px;
    border: 0;
    border-right: 1px solid #edf2f7;
    border-bottom: 1px solid #edf2f7;
    border-radius: 0;
    padding: 0;
    background: #fff;
    box-shadow: none;
}

.transaction-summary-card:nth-child(2n) {
    border-right: 0;
}

.transaction-summary-card:nth-last-child(-n + 2) {
    border-bottom: 0;
}

.transaction-summary-card__head {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    align-self: stretch;
    gap: 0;
    min-width: 0;
    border-right: 1px solid #e8eef7;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.transaction-summary-card__title {
    display: grid;
    gap: 0;
    min-width: 0;
    width: 100%;
    padding: 5px 8px 5px 10px;
    border-left: 3px solid #93c5fd;
}

.transaction-summary-card__title span,
.transaction-summary-card__title small {
    display: block;
    overflow: hidden;
    color: #475569;
    font-size: 12px;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__title span {
    color: #334155;
    font-weight: 700;
}

.transaction-summary-card__content {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 5px 10px;
}

.transaction-summary-card__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 22px;
    border: 1px solid rgba(100, 116, 139, 0.2);
    border-radius: 3px;
    padding: 0 6px;
    background: rgba(255, 255, 255, 0.72);
    color: #475569;
    font-size: 11px;
    font-weight: 750;
    font-variant-numeric: tabular-nums;
    line-height: 20px;
    white-space: nowrap;
}

.transaction-summary-card__badge.is-success {
    border-color: rgba(22, 163, 74, 0.22);
    background: rgba(240, 253, 244, 0.82);
    color: #15803d;
}

.transaction-summary-card__badge.is-danger {
    border-color: rgba(239, 68, 68, 0.22);
    background: rgba(254, 242, 242, 0.82);
    color: #dc2626;
}

.transaction-summary-card__badge.is-warning {
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(255, 251, 235, 0.86);
    color: #b45309;
}

.transaction-summary-card__badge.is-primary {
    border-color: rgba(37, 99, 235, 0.24);
    background: rgba(239, 246, 255, 0.84);
    color: #2563eb;
}

.transaction-summary-card__content strong {
    display: block;
    overflow: hidden;
    border: 1px solid rgba(37, 99, 235, 0.22);
    border-radius: 3px;
    padding: 1px 6px;
    background: #eff6ff;
    color: #2563eb;
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__details {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
}

.transaction-summary-card__details.is-pair {
    display: flex;
}

.transaction-summary-card__detail {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
    min-height: 20px;
    border-radius: 3px;
    padding: 0;
    color: var(--el-text-color-regular);
    font-size: 11px;
    line-height: 14px;
}

.transaction-summary-card__detail.is-plain {
    min-height: 16px;
}

.transaction-summary-card__detail.has-logo {
    display: inline-flex;
    column-gap: 3px;
}

.transaction-summary-card__detail-head {
    display: flex;
    align-items: center;
    min-width: 0;
    min-height: 15px;
}

.transaction-summary-card__detail-body {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 0;
}

.transaction-summary-card__detail-body.is-amount {
    gap: 5px;
}

.transaction-summary-card__count {
    color: #1f2937;
    font-size: 11px;
    font-weight: 400;
    line-height: 18px;
    white-space: nowrap;
}

.transaction-summary-card__money {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    overflow: hidden;
    border: 1px solid #dbeafe;
    border-radius: 4px;
    background: #f8fbff;
    white-space: nowrap;
}

.transaction-summary-card__currency {
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    border-right: 1px solid #dbeafe;
    padding: 0 4px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 400;
    line-height: 16px;
}

.transaction-summary-card__money b {
    padding: 0 5px;
}

.transaction-summary-card__logos {
    min-width: 0;
    width: auto;
    max-width: 34px;
    flex: 0 0 auto;
}

.transaction-summary-card__logos :deep(.payment-logo-group) {
    gap: 2px;
}

.transaction-summary-card__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 14px;
    max-width: 34px;
}

.transaction-summary-card__logo-placeholder {
    display: inline-flex;
    width: 30px;
    height: 16px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    border-radius: 4px;
    background:
        linear-gradient(135deg, rgba(148, 163, 184, 0.18) 0%, rgba(255, 255, 255, 0.86) 55%, rgba(148, 163, 184, 0.14) 100%);
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
    color: #1f2937;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-summary-card__detail.has-logo b {
    font-size: 11px;
    line-height: 13px;
}

.transaction-summary-card__detail .transaction-summary-card__money b {
    font-weight: 400;
}

.transaction-summary-card.is-success .transaction-summary-card__title {
    border-left-color: #22c55e;
}

.transaction-summary-card.is-success .transaction-summary-card__head {
    background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
}

.transaction-summary-card.is-success .transaction-summary-card__content strong {
    border-color: rgba(22, 163, 74, 0.24);
    background: #f0fdf4;
    color: #16a34a;
}

.transaction-summary-card.is-danger .transaction-summary-card__title {
    border-left-color: #f97316;
}

.transaction-summary-card.is-danger .transaction-summary-card__head {
    background: linear-gradient(180deg, #fff7ed 0%, #fff1f2 100%);
}

.transaction-summary-card.is-danger .transaction-summary-card__content strong {
    border-color: rgba(249, 115, 22, 0.28);
    background: #fff7ed;
    color: #ef4444;
}

.transaction-summary-card.is-balance .transaction-summary-card__title {
    border-left-color: #0ea5e9;
}

.transaction-summary-card.is-balance .transaction-summary-card__head {
    background: linear-gradient(180deg, #f0f9ff 0%, #eff6ff 100%);
}

.transaction-summary-card.is-balance .transaction-summary-card__content strong {
    color: var(--app-primary);
}

.transaction-summary-card.is-total .transaction-summary-card__title {
    border-left-color: #2563eb;
}

.transaction-summary-card.is-total .transaction-summary-card__head {
    background: linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%);
}

@media (max-width: 980px) {
    .transaction-result-bar {
        flex-direction: column;
    }

    .transaction-result-bar__summary {
        align-items: stretch;
        grid-template-columns: 1fr;
    }

    .transaction-summary-card {
        border-right: 0;
        grid-template-columns: minmax(98px, 0.32fr) minmax(0, 1fr);
    }

    .transaction-summary-card:nth-last-child(-n + 2) {
        border-bottom: 1px solid #edf2f7;
    }

    .transaction-summary-card:last-child {
        border-bottom: 0;
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

    .transaction-summary-card {
        grid-template-columns: minmax(88px, 0.38fr) minmax(0, 1fr);
    }

    .transaction-summary-card__content {
        flex-wrap: wrap;
        row-gap: 4px;
    }
}
</style>
