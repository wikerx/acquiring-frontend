<template>
    <div class="analytics-payment-performance">
        <button
            v-for="row in visibleRows"
            :key="`${row.paymentMethod || ''}:${row.paymentBrand || row.key}`"
            type="button"
            class="analytics-payment-performance__row"
            :class="{ 'is-without-rate': !showRate }"
            @click="emit('select', row)"
        >
            <span class="analytics-payment-performance__identity">
                <PaymentLogoGroup
                    v-if="paymentLogoKeys(row).length"
                    :keys="paymentLogoKeys(row)"
                    size="sm"
                    fallback="text"
                    class="analytics-payment-performance__logos"
                />
                <span class="analytics-payment-performance__name">
                    <strong>{{ row.key || unknownLabel }}</strong>
                    <small v-if="row.paymentBrand && row.paymentMethod">{{ row.paymentMethod }}</small>
                </span>
            </span>
            <span class="analytics-payment-performance__visual">
                <span class="analytics-payment-performance__track">
                    <span class="analytics-payment-performance__volume" :style="barStyle(row)">
                        <span class="is-success" />
                        <span class="is-failed" />
                        <span class="is-pending" />
                        <span class="is-processing" />
                    </span>
                </span>
                <span class="analytics-payment-performance__legend" aria-hidden="true">
                    <span v-if="row.successCount"><i class="is-success" />{{ successLabel }} {{ formatCount(row.successCount) }}</span>
                    <span v-if="row.failedCount"><i class="is-failed" />{{ failedLabel }} {{ formatCount(row.failedCount) }}</span>
                    <span v-if="row.pendingCount"><i class="is-pending" />{{ pendingLabel }} {{ formatCount(row.pendingCount) }}</span>
                    <span v-if="processingCount(row)"><i class="is-processing" />{{ processingLabel }} {{ formatCount(processingCount(row)) }}</span>
                </span>
            </span>
            <span class="analytics-payment-performance__metric">
                <strong>{{ formatCount(row.totalCount) }}</strong>
                <small>{{ totalLabel }}</small>
            </span>
            <span v-if="showRate" class="analytics-payment-performance__metric is-rate">
                <strong>{{ formatRate(row.successRate) }}</strong>
                <small>{{ rateLabel }}</small>
            </span>
        </button>
        <div v-if="!visibleRows.length" class="analytics-payment-performance__empty">{{ emptyText }}</div>
    </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from 'vue';
import { resolvePaymentLogoKeys } from '../paymentBrand';
import { analyticsNumber, type TransactionAnalyticsDimensionMetric } from '../transactionAnalytics';
import PaymentLogoGroup from './PaymentLogoGroup.vue';

const props = withDefaults(defineProps<{
    rows: TransactionAnalyticsDimensionMetric[];
    totalLabel: string;
    successLabel: string;
    failedLabel: string;
    pendingLabel: string;
    processingLabel: string;
    rateLabel: string;
    unknownLabel: string;
    emptyText: string;
    locale?: string;
    limit?: number;
    showRate?: boolean;
}>(), {
    locale: undefined,
    limit: 8,
    showRate: true,
});

const emit = defineEmits<{
    select: [row: TransactionAnalyticsDimensionMetric];
}>();

/** 支付工具表现组件保留真实品牌标识，并用同一比例尺比较成功、失败和处理中笔数。 */
const visibleRows = computed(() => [...props.rows]
    .sort((left, right) => analyticsNumber(right.totalCount) - analyticsNumber(left.totalCount))
    .slice(0, props.limit));

const maximumCount = computed(() => Math.max(1, ...visibleRows.value.map((row) => analyticsNumber(row.totalCount))));

function paymentLogoKeys(row: TransactionAnalyticsDimensionMetric) {
    return resolvePaymentLogoKeys(row.paymentMethod, row.paymentBrand || row.key);
}

function processingCount(row: TransactionAnalyticsDimensionMetric) {
    if (row.processingCount !== undefined) return analyticsNumber(row.processingCount);
    return Math.max(0, analyticsNumber(row.totalCount)
        - analyticsNumber(row.successCount)
        - analyticsNumber(row.failedCount)
        - analyticsNumber(row.pendingCount));
}

function barStyle(row: TransactionAnalyticsDimensionMetric): CSSProperties {
    const pending = analyticsNumber(row.pendingCount);
    const processing = processingCount(row);
    const rowTotal = analyticsNumber(row.totalCount);
    const total = Math.max(1, rowTotal);
    return {
        '--analytics-total-share': `${Math.max(6, rowTotal / maximumCount.value * 100)}%`,
        '--analytics-success-share': `${analyticsNumber(row.successCount) / total * 100}%`,
        '--analytics-failed-share': `${analyticsNumber(row.failedCount) / total * 100}%`,
        '--analytics-pending-share': `${pending / total * 100}%`,
        '--analytics-processing-share': `${processing / total * 100}%`,
    } as CSSProperties;
}

function formatCount(value: number | string | null | undefined) {
    return new Intl.NumberFormat(props.locale).format(analyticsNumber(value));
}

function formatRate(value: number | string) {
    return `${analyticsNumber(value).toFixed(2)}%`;
}
</script>

<style scoped>
.analytics-payment-performance {
    display: grid;
    align-content: start;
    min-height: 250px;
}

.analytics-payment-performance__row {
    display: grid;
    grid-template-columns: minmax(142px, 0.9fr) minmax(180px, 1.8fr) 64px 72px;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 7px 2px;
    border: 0;
    border-bottom: 1px solid #eef1f5;
    color: #1f2937;
    font: inherit;
    text-align: left;
    background: transparent;
    cursor: pointer;
}

.analytics-payment-performance__row.is-without-rate {
    grid-template-columns: minmax(142px, 0.9fr) minmax(180px, 1.8fr) 72px;
}

.analytics-payment-performance__row:hover,
.analytics-payment-performance__row:focus-visible {
    background: #f8fafc;
    outline: none;
}

.analytics-payment-performance__row:focus-visible {
    box-shadow: 0 0 0 2px #93b4f8 inset;
}

.analytics-payment-performance__identity,
.analytics-payment-performance__visual,
.analytics-payment-performance__name,
.analytics-payment-performance__metric {
    min-width: 0;
}

.analytics-payment-performance__identity {
    display: flex;
    align-items: center;
    gap: 8px;
}

.analytics-payment-performance__logos {
    flex: 0 0 auto;
    max-width: 54px;
    overflow: hidden;
}

.analytics-payment-performance__logos :deep(.payment-logo-group) {
    flex-wrap: nowrap;
    gap: 4px;
}

.analytics-payment-performance__name,
.analytics-payment-performance__metric {
    display: flex;
    flex-direction: column;
}

.analytics-payment-performance__name strong {
    overflow: hidden;
    font-size: 12px;
    font-weight: 650;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.analytics-payment-performance__name small,
.analytics-payment-performance__metric small {
    margin-top: 2px;
    overflow: hidden;
    color: #98a2b3;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.analytics-payment-performance__visual {
    display: grid;
    gap: 5px;
}

.analytics-payment-performance__track {
    display: block;
    height: 8px;
    overflow: hidden;
    border-radius: 3px;
    background: #eef2f6;
}

.analytics-payment-performance__volume {
    display: flex;
    width: var(--analytics-total-share);
    height: 100%;
    overflow: hidden;
    border-radius: 3px;
}

.analytics-payment-performance__volume > .is-success { width: var(--analytics-success-share); background: #16a34a; }
.analytics-payment-performance__volume > .is-failed { width: var(--analytics-failed-share); background: #dc2626; }
.analytics-payment-performance__volume > .is-pending { width: var(--analytics-pending-share); background: #d97706; }
.analytics-payment-performance__volume > .is-processing { width: var(--analytics-processing-share); background: #2563eb; }

.analytics-payment-performance__legend {
    display: flex;
    gap: 10px;
    color: #667085;
    font-size: 10px;
}

.analytics-payment-performance__legend span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.analytics-payment-performance__legend i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
}

.analytics-payment-performance__legend i.is-success { background: #16a34a; }
.analytics-payment-performance__legend i.is-failed { background: #dc2626; }
.analytics-payment-performance__legend i.is-pending { background: #d97706; }
.analytics-payment-performance__legend i.is-processing { background: #2563eb; }

.analytics-payment-performance__metric {
    align-items: flex-end;
    text-align: right;
}

.analytics-payment-performance__metric strong {
    font-size: 13px;
    font-weight: 700;
}

.analytics-payment-performance__metric.is-rate strong { color: #2563eb; }

.analytics-payment-performance__empty {
    display: grid;
    min-height: 250px;
    place-items: center;
    color: #98a2b3;
    font-size: 12px;
}

@media (max-width: 700px) {
    .analytics-payment-performance__row {
        grid-template-columns: minmax(120px, 1fr) 70px;
    }

    .analytics-payment-performance__visual {
        grid-column: 1 / -1;
        grid-row: 2;
    }

    .analytics-payment-performance__metric.is-rate {
        grid-column: 2;
        grid-row: 1;
    }

    .analytics-payment-performance__metric:not(.is-rate) { display: none; }

    .analytics-payment-performance__row.is-without-rate {
        grid-template-columns: minmax(120px, 1fr);
    }
}
</style>
