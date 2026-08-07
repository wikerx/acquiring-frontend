<template>
    <div class="page system-page merchant-redesigned-page transaction-analytics-page">
        <header class="analytics-page__header">
            <div>
                <h1>{{ t('transactionAnalytics.title') }}</h1>
                <p>{{ t('transactionAnalytics.subtitle') }}</p>
            </div>
            <div class="analytics-page__meta">
                <span class="analytics-page__scope">{{ t('transactionAnalytics.scopeNote') }}</span>
                <span v-if="generatedAt" class="analytics-page__updated">
                    <el-icon><Clock /></el-icon>
                    {{ t('transactionAnalytics.updatedAtLabel') }}
                    <BaseDateTime
                        :value="generatedAt"
                        :source-time-zone="filters.queryTimeZone"
                        :display-time-zone="filters.queryTimeZone"
                    />
                </span>
            </div>
        </header>

        <section class="merchant-list-card merchant-search-card analytics-filter-card">
            <el-form :model="filters" inline size="small" class="search-form analytics-search-form" @submit.prevent="loadActiveTab">
                <div class="analytics-search-form__fields">
                    <el-form-item :label="t('transactionAnalytics.paymentMethod')" class="analytics-payment-filter">
                        <el-select v-model="filters.paymentTool" clearable filterable :placeholder="t('transactionAnalytics.all')">
                            <template #prefix>
                                <PaymentLogoGroup
                                    v-if="selectedPaymentTool?.logoKeys.length"
                                    :keys="selectedPaymentTool.logoKeys"
                                    size="sm"
                                    fallback="text"
                                    class="analytics-payment-filter__prefix"
                                />
                            </template>
                            <el-option v-for="item in paymentToolOptions" :key="item.value" :label="item.label" :value="item.value">
                                <div class="analytics-payment-option">
                                    <PaymentLogoGroup :keys="item.logoKeys" size="sm" fallback="text" />
                                    <span>{{ item.label }}</span>
                                    <small>{{ item.paymentBrand || item.paymentMethod }}</small>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transactionAnalytics.transactionType')">
                        <el-select v-model="filters.transactionType" clearable filterable :placeholder="t('transactionAnalytics.all')">
                            <el-option v-for="item in transactionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transactionAnalytics.currency')">
                        <el-select
                            v-model="filters.currency"
                            clearable
                            filterable
                            allow-create
                            default-first-option
                            :placeholder="t('transactionAnalytics.all')"
                        >
                            <el-option v-for="item in currencyOptions" :key="item" :label="item" :value="item" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transactionAnalytics.dateRange')" class="analytics-time-filter">
                        <TransactionTimeRangeFilter
                            v-model="dateRange"
                            v-model:time-zone="filters.queryTimeZone"
                            v-model:preset="quickPreset"
                            :timezone-options="timezoneOptions"
                            :quick-options="quickTimeOptions"
                            default-preset="last7"
                        />
                    </el-form-item>
                    <el-form-item class="merchant-search-actions analytics-search-actions">
                        <el-button type="primary" :icon="Search" :loading="loading" native-type="submit">{{ t('common.search') }}</el-button>
                        <el-button :icon="RefreshLeft" @click="resetFilters">{{ t('common.reset') }}</el-button>
                    </el-form-item>
                </div>
            </el-form>
        </section>

        <el-tabs v-model="activeTab" class="analytics-tabs" @tab-change="handleTabChange">
            <el-tab-pane :label="t('transactionAnalytics.overview')" name="overview" />
            <el-tab-pane :label="t('transactionAnalytics.failures')" name="failures" />
        </el-tabs>

        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon class="analytics-alert" />

        <template v-if="activeTab === 'overview'">
            <section class="analytics-metric-band" aria-label="Transaction key metrics">
                <article v-for="item in overviewMetrics" :key="item.key" class="analytics-metric" :class="`is-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </article>
                <article class="analytics-metric analytics-metric--amount">
                    <span>{{ t('transactionAnalytics.successAmount') }}</span>
                    <div v-if="overview?.successAmounts.length" class="analytics-amount-list">
                        <span v-for="item in overview.successAmounts" :key="`${item.currency}:${item.currencyExponent}`" class="analytics-amount-capsule">
                            <b>{{ item.currency || chartLabels.unknown }}</b>
                            <strong>{{ formatAnalyticsAmountValue(item, locale) }}</strong>
                            <span>{{ formatCount(item.successCount) }}{{ t('transactionAnalytics.countUnit') }}</span>
                        </span>
                    </div>
                    <strong v-else>-</strong>
                    <small>{{ t('transactionAnalytics.amountHint') }}</small>
                </article>
            </section>

            <section class="analytics-panel analytics-panel--trend">
                <header class="analytics-panel__header">
                    <div>
                        <h2>{{ t('transactionAnalytics.trendTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.trendSubtitle') }}</p>
                    </div>
                    <span>{{ t('transactionAnalytics.trendUnit') }}</span>
                </header>
                <AnalyticsChart
                    :option="trendOption"
                    :loading="loading"
                    :empty="!overview?.trend.length"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.trendTitle')"
                    height="330px"
                />
            </section>

            <div class="analytics-grid analytics-grid--overview">
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.statusTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="statusOption"
                        :loading="loading"
                        :empty="!overview?.statusDistribution.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.statusTitle')"
                        height="286px"
                    />
                </section>
                <section v-loading="loading" class="analytics-panel analytics-panel--payment">
                    <header class="analytics-panel__header">
                        <h2>{{ t('transactionAnalytics.paymentTitle') }}</h2>
                        <span>{{ t('transactionAnalytics.clickToFilter') }}</span>
                    </header>
                    <AnalyticsPaymentPerformance
                        :rows="overview?.paymentMethods ?? []"
                        :total-label="t('transactionAnalytics.totalSeries')"
                        :success-label="chartLabels.success"
                        :failed-label="chartLabels.failed"
                        :processing-label="chartLabels.processing"
                        :rate-label="chartLabels.rate"
                        :unknown-label="chartLabels.unknown"
                        :empty-text="t('transactionAnalytics.noData')"
                        :locale="locale"
                        @select="applyPaymentDimension"
                    />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.countryTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="countryOption"
                        :loading="loading"
                        :empty="!overview?.issuerCountries.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.countryTitle')"
                        height="286px"
                    />
                </section>
            </div>
        </template>

        <template v-else>
            <section class="analytics-metric-band analytics-metric-band--failure">
                <article class="analytics-metric is-red">
                    <span>{{ t('transactionAnalytics.failedCount') }}</span>
                    <strong>{{ formatCount(failureAnalysis?.failedCount ?? 0) }}</strong>
                    <small>{{ t('transactionAnalytics.failureHint') }}</small>
                </article>
            </section>

            <section class="analytics-panel analytics-panel--trend">
                <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.failureTrendTitle') }}</h2></header>
                <AnalyticsChart
                    :option="failureTrendOption"
                    :loading="loading"
                    :empty="!failureAnalysis?.trend.length"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.failureTrendTitle')"
                    height="300px"
                />
            </section>

            <div class="analytics-grid analytics-grid--failure">
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.failureReasonTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="failureReasonOption"
                        :loading="loading"
                        :empty="!failureAnalysis?.reasons.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.failureReasonTitle')"
                        height="300px"
                    />
                </section>
                <section v-loading="loading" class="analytics-panel analytics-panel--payment">
                    <header class="analytics-panel__header">
                        <h2>{{ t('transactionAnalytics.failureMethodTitle') }}</h2>
                        <span>{{ t('transactionAnalytics.clickToFilter') }}</span>
                    </header>
                    <AnalyticsPaymentPerformance
                        :rows="failureAnalysis?.paymentMethods ?? []"
                        :total-label="chartLabels.failed"
                        :success-label="chartLabels.success"
                        :failed-label="chartLabels.failed"
                        :processing-label="chartLabels.processing"
                        :rate-label="chartLabels.rate"
                        :unknown-label="chartLabels.unknown"
                        :empty-text="t('transactionAnalytics.noData')"
                        :locale="locale"
                        :show-rate="false"
                        @select="applyPaymentDimension"
                    />
                </section>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    AnalyticsChart,
    AnalyticsPaymentPerformance,
    PaymentLogoGroup,
    analyticsNumber,
    createAnalyticsDimensionOption,
    createAnalyticsDonutOption,
    createAnalyticsFailureTrendOption,
    createAnalyticsTrendOption,
    createTransactionAnalyticsRange,
    formatAnalyticsAmountValue,
    resolvePaymentLogoKeys,
    type PaymentLogoKey,
    type TransactionAnalyticsDimensionMetric,
    type TransactionAnalyticsFailure,
    type TransactionAnalyticsOverview,
    type TransactionAnalyticsQuery,
} from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { transactionApi } from '@/api/transactionApi';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    ensureTransactionTimezoneOptions,
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    type TransactionDictOption,
} from '../shared';

type AnalyticsTab = 'overview' | 'failures';

interface PaymentToolOption {
    value: string;
    label: string;
    paymentMethod: string;
    paymentBrand?: string;
    logoKeys: PaymentLogoKey[];
}

/** 商户端交易分析只展示认证商户数据，并保持金额按币种和精度分别呈现。 */
const { t, te, locale } = useI18n();
const supportedTransactionTypes = new Set(['PAYMENT', 'AUTHORIZATION', 'PRE_AUTHORIZATION']);
const currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'HKD', 'SGD', 'AUD'];
const activeTab = ref<AnalyticsTab>('overview');
const quickPreset = ref('last7');
const dateRange = ref<string[]>(createTransactionAnalyticsRange(7, DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const loading = ref(false);
const errorMessage = ref('');
const overview = ref<TransactionAnalyticsOverview>();
const failureAnalysis = ref<TransactionAnalyticsFailure>();
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t)
    .filter((item) => supportedTransactionTypes.has(item.value)));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
const paymentBrandOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const filters = reactive({
    paymentTool: '',
    transactionType: '',
    currency: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
let requestSequence = 0;

const quickTimeOptions = computed(() => [
    { value: 'last7', label: t('transactionAnalytics.last7Days'), days: 7 },
    { value: 'last14', label: t('transactionAnalytics.last14Days'), days: 14 },
    { value: 'last30', label: t('transactionAnalytics.last30Days'), days: 30 },
]);

const chartLabels = computed(() => ({
    total: t('transactionAnalytics.totalSeries'),
    success: t('transactionAnalytics.successSeries'),
    failed: t('transactionAnalytics.failedSeries'),
    processing: t('transactionAnalytics.processingSeries'),
    terminal: t('transactionAnalytics.terminalSeries'),
    rate: t('transactionAnalytics.rateSeries'),
    unknown: t('transactionAnalytics.unknown'),
}));

const paymentToolOptions = computed<PaymentToolOption[]>(() => {
    const options = paymentMethodOptions.value.flatMap((method) => {
        if (method.value !== 'BANK_CARD') {
            return [{
                value: paymentToolValue(method.value),
                label: method.label,
                paymentMethod: method.value,
                logoKeys: resolvePaymentLogoKeys(method.value),
            }];
        }
        const allCards: PaymentToolOption = {
            value: paymentToolValue(method.value),
            label: t('transactionAnalytics.allCardBrands', { method: method.label }),
            paymentMethod: method.value,
            logoKeys: resolvePaymentLogoKeys(method.value),
        };
        return [allCards, ...paymentBrandOptions.value.map((brand) => ({
            value: paymentToolValue(method.value, brand.value),
            label: brand.label,
            paymentMethod: method.value,
            paymentBrand: brand.value,
            logoKeys: resolvePaymentLogoKeys(method.value, brand.value),
        }))];
    });
    const knownValues = new Set(options.map((item) => item.value));
    [...(overview.value?.paymentMethods ?? []), ...(failureAnalysis.value?.paymentMethods ?? [])].forEach((row) => {
        const paymentMethod = row.paymentMethod || (!row.paymentBrand ? row.key : '');
        if (!paymentMethod) return;
        const value = paymentToolValue(paymentMethod, row.paymentBrand);
        if (knownValues.has(value)) return;
        knownValues.add(value);
        options.push({
            value,
            label: row.key || paymentMethod,
            paymentMethod,
            paymentBrand: row.paymentBrand,
            logoKeys: resolvePaymentLogoKeys(paymentMethod, row.paymentBrand || row.key),
        });
    });
    return options;
});

const selectedPaymentTool = computed(() => paymentToolOptions.value.find((item) => item.value === filters.paymentTool));
const generatedAt = computed(() => activeTab.value === 'overview' ? overview.value?.generatedAt : failureAnalysis.value?.generatedAt);

const overviewMetrics = computed(() => {
    const data = overview.value;
    const total = analyticsNumber(data?.totalCount);
    const success = analyticsNumber(data?.successCount);
    const failed = analyticsNumber(data?.failedCount);
    const terminal = success + failed;
    const inFlight = analyticsNumber(data?.pendingCount) + analyticsNumber(data?.processingCount);
    return [
        { key: 'total', label: t('transactionAnalytics.totalCount'), value: formatCount(total), hint: t('transactionAnalytics.totalHint'), tone: 'ink' },
        { key: 'success', label: t('transactionAnalytics.successCount'), value: formatCount(success), hint: ratioHint(success, total), tone: 'teal' },
        { key: 'failed', label: t('transactionAnalytics.failedCount'), value: formatCount(failed), hint: ratioHint(failed, total), tone: 'red' },
        { key: 'flight', label: t('transactionAnalytics.inFlightCount'), value: formatCount(inFlight), hint: ratioHint(inFlight, total), tone: 'amber' },
        { key: 'rate', label: t('transactionAnalytics.successRate'), value: formatRate(data?.successRate ?? 0), hint: t('transactionAnalytics.terminalCountHint', { count: formatCount(terminal) }), tone: 'blue' },
    ];
});

const translatedStatusRows = computed(() => (overview.value?.statusDistribution ?? []).map((item) => ({
    ...item,
    key: te(`transaction.status.${item.key}`) ? t(`transaction.status.${item.key}`) : item.key,
})));
const translatedFailureReasons = computed(() => (failureAnalysis.value?.reasons ?? []).map((item) => ({
    ...item,
    key: item.key === 'OTHER' ? t('transactionAnalytics.otherFailure') : (item.key || t('transactionAnalytics.otherFailure')),
})));
const trendOption = computed(() => createAnalyticsTrendOption(overview.value?.trend ?? [], chartLabels.value));
const statusOption = computed(() => createAnalyticsDonutOption(
    translatedStatusRows.value,
    chartLabels.value.unknown,
    t('transactionAnalytics.totalSeries'),
));
const countryOption = computed(() => createAnalyticsDimensionOption(overview.value?.issuerCountries ?? [], chartLabels.value));
const failureTrendOption = computed(() => createAnalyticsFailureTrendOption(failureAnalysis.value?.trend ?? [], chartLabels.value.failed));
const failureReasonOption = computed(() => createAnalyticsDonutOption(
    translatedFailureReasons.value,
    t('transactionAnalytics.otherFailure'),
    chartLabels.value.failed,
));

function formatCount(value: number | string | null | undefined) {
    return new Intl.NumberFormat(locale.value).format(analyticsNumber(value));
}

function formatRate(value: number | string) {
    return `${analyticsNumber(value).toFixed(2)}%`;
}

function ratioHint(value: number | string | null | undefined, total: number | string | null | undefined) {
    const safeValue = analyticsNumber(value);
    const safeTotal = analyticsNumber(total);
    const rate = safeTotal ? (safeValue * 100 / safeTotal).toFixed(2) : '0.00';
    return t('transactionAnalytics.totalShare', { rate });
}

function paymentToolValue(paymentMethod: string, paymentBrand?: string) {
    return `${paymentMethod}|${paymentBrand || ''}`;
}

function buildQuery(): TransactionAnalyticsQuery | undefined {
    const [beginTime, endTime] = dateRange.value ?? [];
    const duration = new Date(endTime).getTime() - new Date(beginTime).getTime();
    if (!beginTime || !endTime || !Number.isFinite(duration) || duration <= 0 || duration > 31 * 24 * 60 * 60 * 1000) {
        ElMessage.warning(t('transactionAnalytics.rangeInvalid'));
        return undefined;
    }
    const paymentTool = selectedPaymentTool.value;
    return {
        beginTime,
        endTime,
        transactionType: filters.transactionType || undefined,
        currency: filters.currency?.toUpperCase() || undefined,
        paymentMethod: paymentTool?.paymentMethod,
        paymentBrand: paymentTool?.paymentBrand,
        queryTimeZone: filters.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    };
}

async function loadActiveTab() {
    const query = buildQuery();
    if (!query) return;
    const currentRequest = ++requestSequence;
    loading.value = true;
    errorMessage.value = '';
    try {
        if (activeTab.value === 'overview') overview.value = await transactionApi.analyticsOverview(query);
        else failureAnalysis.value = await transactionApi.analyticsFailures(query);
    } catch {
        if (currentRequest === requestSequence) errorMessage.value = t('transactionAnalytics.loadFailed');
    } finally {
        if (currentRequest === requestSequence) loading.value = false;
    }
}

function resetFilters() {
    Object.assign(filters, {
        paymentTool: '',
        transactionType: '',
        currency: '',
        queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    });
    quickPreset.value = 'last7';
    dateRange.value = createTransactionAnalyticsRange(7, DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    loadActiveTab();
}

function handleTabChange(name: string | number) {
    activeTab.value = String(name) as AnalyticsTab;
    loadActiveTab();
}

function applyPaymentDimension(row: TransactionAnalyticsDimensionMetric) {
    const paymentMethod = row.paymentMethod || (!row.paymentBrand ? row.key : '');
    if (!paymentMethod) return;
    filters.paymentTool = paymentToolValue(paymentMethod, row.paymentBrand);
    loadActiveTab();
}

async function loadFilterOptions() {
    const [types, methods, brands, timezones] = await Promise.all([
        loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')).catch(() => []),
        loadTransactionDictOptions('acquiring_payment_method', String(locale.value || 'zh-CN')).catch(() => []),
        loadTransactionDictOptions('card_brand', String(locale.value || 'zh-CN')).catch(() => []),
        loadTransactionDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
    ]);
    const supportedTypes = types.filter((item) => supportedTransactionTypes.has(item.value));
    if (supportedTypes.length) transactionTypeOptions.value = supportedTypes;
    if (methods.length) paymentMethodOptions.value = methods;
    if (brands.length) paymentBrandOptions.value = brands;
    timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
}

onMounted(async () => {
    await loadFilterOptions();
    loadActiveTab();
});
</script>

<style scoped>
.transaction-analytics-page {
    --analytics-ink: #1f2937;
    --analytics-muted: #667085;
    --analytics-line: #dfe7f2;
    --analytics-teal: #2563eb;
    --analytics-red: #df5964;
    --analytics-amber: #83a7e8;
    --analytics-blue: #2563eb;
    min-width: 0;
    color: var(--analytics-ink);
}

.analytics-page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 0 2px;
}

.analytics-page__header h1 { margin: 0; font-size: 20px; line-height: 1.4; letter-spacing: 0; }
.analytics-page__header p { margin: 3px 0 0; color: var(--analytics-muted); font-size: 12px; }
.analytics-page__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; color: var(--analytics-muted); font-size: 11px; }
.analytics-page__scope { padding: 3px 7px; border: 1px solid #c9daf8; border-radius: 4px; color: #175cd3; background: #f3f7ff; }
.analytics-page__updated { display: inline-flex; align-items: center; gap: 4px; }
.analytics-page__updated :deep(.base-date-time) { color: inherit; }

.analytics-filter-card { padding: 12px 16px; }
.analytics-search-form { display: grid; width: 100%; }
.analytics-search-form__fields { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 16px; width: 100%; }
.analytics-search-form__fields :deep(.el-form-item) {
    display: grid;
    grid-template-columns: 82px minmax(0, 1fr);
    flex: 0 1 290px;
    align-items: center;
    gap: 8px;
    min-width: 0;
    margin: 0;
}
.analytics-search-form__fields :deep(.el-form-item.analytics-time-filter) { flex: 1 1 720px; max-width: 100%; }
.analytics-search-form :deep(.el-form-item__label) { justify-content: flex-end; width: 82px; padding-right: 0; color: #566173; }
.analytics-search-form :deep(.el-form-item__content) { width: 100%; min-width: 0; margin-left: 0 !important; }
.analytics-search-form :deep(.el-input),
.analytics-search-form :deep(.el-select) { width: 100%; }
.analytics-time-filter :deep(.transaction-time-range-filter) { max-width: none; }
.analytics-payment-filter__prefix { max-width: 54px; overflow: hidden; }
.analytics-payment-filter__prefix :deep(.payment-logo-group) { flex-wrap: nowrap; gap: 3px; }

.analytics-payment-option {
    display: grid;
    grid-template-columns: 72px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 100%;
}
.analytics-payment-option :deep(.payment-logo-group) { flex-wrap: nowrap; gap: 4px; overflow: hidden; }
.analytics-payment-option span { overflow: hidden; font-size: 12px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
.analytics-payment-option small { color: #98a2b3; font-size: 10px; }
.analytics-search-form__fields :deep(.el-form-item.analytics-search-actions) { display: block; flex: 1 1 160px; min-width: 160px; }
.analytics-search-actions :deep(.el-form-item__content) { display: flex; flex-wrap: nowrap; justify-content: flex-end; gap: 8px; }

.analytics-tabs :deep(.el-tabs__header) { margin-bottom: 10px; }
.analytics-tabs :deep(.el-tabs__item) { height: 34px; font-size: 13px; }
.analytics-alert { margin-bottom: 10px; }

.analytics-metric-band {
    display: grid;
    grid-template-columns: repeat(5, minmax(118px, 0.72fr)) minmax(290px, 1.7fr);
    margin-bottom: 10px;
    overflow: hidden;
    border: 1px solid var(--analytics-line);
    border-radius: 6px;
    background: #fff;
}
.analytics-metric-band--failure { grid-template-columns: minmax(260px, 420px); }
.analytics-metric {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 88px;
    flex-direction: column;
    justify-content: center;
    padding: 12px 14px 11px 18px;
    border-right: 1px solid #eef1f5;
}
.analytics-metric::before { position: absolute; top: 17px; bottom: 17px; left: 8px; width: 3px; border-radius: 2px; background: #83a7e8; content: ''; }
.analytics-metric.is-teal::before { background: #4f7fd7; }
.analytics-metric.is-red::before { background: #7296d3; }
.analytics-metric.is-amber::before { background: #9ab3dd; }
.analytics-metric.is-blue::before { background: var(--analytics-blue); }
.analytics-metric > span:first-child { color: var(--analytics-muted); font-size: 11px; }
.analytics-metric > strong { margin-top: 5px; font-size: 22px; line-height: 1.15; letter-spacing: 0; }
.analytics-metric > small { min-height: 15px; margin-top: 4px; color: #98a2b3; font-size: 10px; }
.analytics-metric--amount { border-right: 0; background: #f8fbff; }

.analytics-amount-list { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 7px; }
.analytics-amount-capsule {
    display: inline-grid;
    grid-template-columns: auto auto auto;
    align-items: center;
    overflow: hidden;
    border: 1px solid #d9e2ec;
    border-radius: 999px;
    color: #344054;
    background: #fff;
    white-space: nowrap;
}
.analytics-amount-capsule > * { padding: 4px 8px; font-size: 11px; line-height: 1; }
.analytics-amount-capsule > * + * { border-left: 1px solid #d9e2ec; }
.analytics-amount-capsule b { color: #175cd3; background: #eff6ff; }
.analytics-amount-capsule strong { font-size: 12px; }
.analytics-amount-capsule > span { color: #667085; background: #f8fafc; }

.analytics-panel {
    min-width: 0;
    padding: 13px 14px 10px;
    border: 1px solid var(--analytics-line);
    border-radius: 6px;
    background: #fff;
}
.analytics-panel--trend { margin-bottom: 10px; }
.analytics-panel__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-height: 31px; margin-bottom: 4px; padding-bottom: 8px; border-bottom: 1px solid #eef3fa; }
.analytics-panel__header h2 { margin: 0; font-size: 14px; line-height: 1.35; letter-spacing: 0; }
.analytics-panel__header p { margin: 2px 0 0; color: var(--analytics-muted); font-size: 11px; }
.analytics-panel__header > span { color: #98a2b3; font-size: 10px; }
.analytics-grid { display: grid; gap: 10px; margin-bottom: 10px; }
.analytics-grid--overview { grid-template-columns: minmax(260px, 0.8fr) minmax(430px, 1.35fr) minmax(320px, 1fr); }
.analytics-grid--failure { grid-template-columns: minmax(320px, 0.8fr) minmax(480px, 1.2fr); }

@media (max-width: 1500px) {
    .analytics-metric-band { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .analytics-metric { border-bottom: 1px solid #eef1f5; }
    .analytics-metric--amount { grid-column: span 2; }
    .analytics-grid--overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .analytics-grid--overview > :last-child { grid-column: 1 / -1; }
}

@media (max-width: 980px) {
    .analytics-page__header { flex-direction: column; gap: 8px; }
    .analytics-page__meta { align-items: flex-start; }
    .analytics-search-form__fields :deep(.el-form-item.analytics-time-filter),
    .analytics-search-form__fields :deep(.el-form-item.analytics-search-actions) { flex-basis: 100%; }
    .analytics-grid--overview,
    .analytics-grid--failure { grid-template-columns: 1fr; }
    .analytics-grid--overview > :last-child { grid-column: auto; }
}

@media (max-width: 760px) {
    .analytics-filter-card { padding: 12px; }
    .analytics-search-form__fields :deep(.el-form-item) { grid-template-columns: 1fr; flex-basis: 100%; gap: 6px; width: 100%; }
    .analytics-search-form :deep(.el-form-item__label) { justify-content: flex-start; width: 100%; min-height: auto; padding: 0; line-height: 18px; }
    .analytics-search-form__fields :deep(.el-form-item.analytics-search-actions) { min-width: 0; }
    .analytics-search-actions :deep(.el-form-item__content) { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .analytics-search-actions :deep(.el-button) { width: 100%; }
    .analytics-metric-band { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .analytics-metric { min-height: 80px; padding: 10px 10px 9px 16px; }
    .analytics-metric > strong { font-size: 20px; }
    .analytics-metric--amount { grid-column: 1 / -1; }
    .analytics-panel { padding: 11px 8px 8px; }
}
</style>
