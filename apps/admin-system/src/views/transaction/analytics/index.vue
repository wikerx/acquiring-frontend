<template>
    <div class="app-container transaction-page analytics-page">
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
                    <BaseDateTime :value="generatedAt" :source-time-zone="filters.queryTimeZone" :display-time-zone="filters.queryTimeZone" />
                </span>
            </div>
        </header>

        <TransactionSearchPanel
            visible
            :model="filters"
            :title="t('transactionAnalytics.searchTitle')"
            :description="t('transactionAnalytics.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            label-width="88px"
            inline-time
            @search="loadActiveTab"
            @reset="resetFilters"
        >
            <el-form-item :label="t('transactionAnalytics.merchantId')" class="analytics-merchant-filter">
                <MerchantRemoteSelect
                    v-model="filters.merchantIds"
                    multiple
                    :placeholder="t('transactionAnalytics.allMerchants')"
                />
            </el-form-item>
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
            <template #time>
                <el-form-item :label="t('transactionAnalytics.dateRange')" class="transaction-time-form-item analytics-time-filter">
                    <TransactionTimeRangeFilter
                        v-model="dateRange"
                        v-model:time-zone="filters.queryTimeZone"
                        v-model:preset="quickPreset"
                        :timezone-options="timezoneOptions"
                        :quick-options="quickTimeOptions"
                        default-preset="last7"
                    />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <el-tabs v-model="activeTab" class="analytics-tabs" @tab-change="handleTabChange">
            <el-tab-pane :label="t('transactionAnalytics.overview')" name="overview" />
            <el-tab-pane :label="t('transactionAnalytics.merchants')" name="merchants" />
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
            <section class="analytics-metric-band analytics-metric-band--merchant">
                <article class="analytics-metric is-teal">
                    <span>{{ t('transactionAnalytics.merchantCount') }}</span>
                    <strong>{{ formatCount(merchantPerformance?.merchantCount ?? 0) }}</strong>
                    <small>{{ t('transactionAnalytics.merchantSubtitle') }}</small>
                </article>
            </section>
            <section class="analytics-panel analytics-panel--merchant-chart">
                <header class="analytics-panel__header">
                    <div>
                        <h2>{{ t('transactionAnalytics.merchantTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.merchantSubtitle') }}</p>
                    </div>
                    <span>{{ t('transactionAnalytics.clickToFilter') }}</span>
                </header>
                <AnalyticsChart
                    :option="merchantOption"
                    :loading="loading"
                    :empty="!merchantPerformance?.merchants.length"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.merchantTitle')"
                    height="330px"
                    @chart-click="applyMerchant"
                />
            </section>
            <section class="analytics-panel analytics-panel--table">
                <StandardTable
                    table-key="transaction-analytics-merchants"
                    v-loading="loading"
                    :data="merchantPerformance?.merchants ?? []"
                    row-key="merchantId"
                    size="small"
                >
                    <el-table-column prop="merchantId" :label="t('transactionAnalytics.tableMerchantId')" min-width="180" fixed="left" />
                    <el-table-column prop="totalCount" :label="t('transactionAnalytics.tableTotal')" min-width="110" align="right">
                        <template #default="{ row }">{{ formatCount(row.totalCount) }}</template>
                    </el-table-column>
                    <el-table-column prop="successCount" :label="t('transactionAnalytics.tableSuccess')" min-width="110" align="right">
                        <template #default="{ row }"><span class="metric-success">{{ formatCount(row.successCount) }}</span></template>
                    </el-table-column>
                    <el-table-column prop="failedCount" :label="t('transactionAnalytics.tableFailed')" min-width="110" align="right">
                        <template #default="{ row }"><span class="metric-failed">{{ formatCount(row.failedCount) }}</span></template>
                    </el-table-column>
                    <el-table-column prop="inFlightCount" :label="t('transactionAnalytics.tableInFlight')" min-width="110" align="right">
                        <template #default="{ row }">{{ formatCount(row.inFlightCount) }}</template>
                    </el-table-column>
                    <el-table-column prop="successRate" :label="t('transactionAnalytics.tableRate')" min-width="135" align="right">
                        <template #default="{ row }"><strong>{{ formatRate(row.successRate) }}</strong></template>
                    </el-table-column>
                    <el-table-column :label="t('transactionAnalytics.tableAmount')" min-width="340">
                        <template #default="{ row }">
                            <div class="analytics-amount-list analytics-amount-list--compact">
                                <span v-for="item in row.successAmounts" :key="`${item.currency}:${item.currencyExponent}`" class="analytics-amount-capsule">
                                    <b>{{ item.currency }}</b>
                                    <strong>{{ formatAnalyticsAmountValue(item, locale) }}</strong>
                                    <span>{{ formatCount(item.successCount) }}{{ t('transactionAnalytics.countUnit') }}</span>
                                </span>
                                <span v-if="!row.successAmounts.length">-</span>
                            </div>
                        </template>
                    </el-table-column>
                </StandardTable>
                <el-empty v-if="!loading && !merchantPerformance?.merchants.length" :description="t('transactionAnalytics.noData')" />
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Clock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    AnalyticsChart,
    AnalyticsPaymentPerformance,
    PaymentLogoGroup,
    analyticsNumber,
    createAnalyticsDimensionOption,
    createAnalyticsDonutOption,
    createAnalyticsMerchantOption,
    createAnalyticsTrendOption,
    createTransactionAnalyticsRange,
    formatAnalyticsAmountValue,
    resolvePaymentLogoKeys,
    type AnalyticsChartClick,
    type PaymentLogoKey,
    type TransactionAnalyticsDimensionMetric,
    type TransactionAnalyticsMerchantPerformance,
    type TransactionAnalyticsOverview,
    type TransactionAnalyticsQuery,
} from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { getTransactionAnalyticsMerchants, getTransactionAnalyticsOverview } from '@/api/transaction';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    ensureTransactionTimezoneOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    type TransactionDictOption,
} from '../shared';

type AnalyticsTab = 'overview' | 'merchants';

interface PaymentToolOption {
    value: string;
    label: string;
    paymentMethod: string;
    paymentBrand?: string;
    logoKeys: PaymentLogoKey[];
}

/** 管理端交易分析主页面统一查询规范、统计口径和图表交互，不在前端执行跨币种金额合计。 */
const { t, te, locale } = useI18n();
const supportedTransactionTypes = new Set(['PAYMENT', 'AUTHORIZATION', 'PRE_AUTHORIZATION']);
const currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'HKD', 'SGD', 'AUD'];
const activeTab = ref<AnalyticsTab>('overview');
const quickPreset = ref('last7');
const dateRange = ref<string[]>(createTransactionAnalyticsRange(7, DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const loading = ref(false);
const errorMessage = ref('');
const overview = ref<TransactionAnalyticsOverview>();
const merchantPerformance = ref<TransactionAnalyticsMerchantPerformance>();
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t)
    .filter((item) => supportedTransactionTypes.has(item.value)));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackPaymentMethods());
const paymentBrandOptions = ref<TransactionDictOption[]>(fallbackPaymentBrands());
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const filters = reactive({
    merchantIds: [] as string[],
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

const paymentToolOptions = computed<PaymentToolOption[]>(() => paymentMethodOptions.value.flatMap((method) => {
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
}));

const selectedPaymentTool = computed(() => paymentToolOptions.value.find((item) => item.value === filters.paymentTool));
const generatedAt = computed(() => activeTab.value === 'overview'
    ? overview.value?.generatedAt
    : merchantPerformance.value?.generatedAt);

const overviewMetrics = computed(() => {
    const data = overview.value;
    const total = analyticsNumber(data?.totalCount);
    const success = analyticsNumber(data?.successCount);
    const failed = analyticsNumber(data?.failedCount);
    const inFlight = analyticsNumber(data?.pendingCount) + analyticsNumber(data?.processingCount);
    const terminal = success + failed;
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
const trendOption = computed(() => createAnalyticsTrendOption(overview.value?.trend ?? [], chartLabels.value));
const statusOption = computed(() => createAnalyticsDonutOption(
    translatedStatusRows.value,
    chartLabels.value.unknown,
    t('transactionAnalytics.totalSeries'),
));
const countryOption = computed(() => createAnalyticsDimensionOption(overview.value?.issuerCountries ?? [], chartLabels.value));
const merchantOption = computed(() => createAnalyticsMerchantOption(merchantPerformance.value?.merchants ?? [], chartLabels.value));

function formatCount(value: number | string | null | undefined) {
    return new Intl.NumberFormat(locale.value).format(analyticsNumber(value));
}

function formatRate(value: number | string) {
    return `${analyticsNumber(value).toFixed(2)}%`;
}

function ratioHint(value: number | string | null | undefined, total: number | string | null | undefined) {
    const safeValue = analyticsNumber(value);
    const safeTotal = analyticsNumber(total);
    return safeTotal
        ? t('transactionAnalytics.totalShare', { rate: (safeValue * 100 / safeTotal).toFixed(2) })
        : t('transactionAnalytics.totalShare', { rate: '0.00' });
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
        merchantIds: filters.merchantIds.length ? filters.merchantIds : undefined,
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
        if (activeTab.value === 'overview') {
            overview.value = await getTransactionAnalyticsOverview(query);
        } else {
            merchantPerformance.value = await getTransactionAnalyticsMerchants(query);
        }
    } catch {
        if (currentRequest === requestSequence) errorMessage.value = t('transactionAnalytics.loadFailed');
    } finally {
        if (currentRequest === requestSequence) loading.value = false;
    }
}

function resetFilters() {
    Object.assign(filters, {
        merchantIds: [],
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
    const value = paymentToolValue(row.paymentMethod || row.key, row.paymentBrand);
    if (paymentToolOptions.value.some((item) => item.value === value)) {
        filters.paymentTool = value;
        loadActiveTab();
    }
}

function applyMerchant(payload: AnalyticsChartClick) {
    if (!payload.name) return;
    filters.merchantIds = [payload.name];
    loadActiveTab();
}

async function loadFilterOptions() {
    try {
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
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction analytics dictionaries, fallback options are used.', error);
    }
}

function fallbackPaymentMethods(): TransactionDictOption[] {
    return ['BANK_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'ALIPAY_PLUS'].map((value) => ({
        value,
        label: te(`transaction.paymentMethod.${value}`) ? t(`transaction.paymentMethod.${value}`) : value,
    }));
}

function fallbackPaymentBrands(): TransactionDictOption[] {
    return [
        { value: 'VISA', label: 'Visa' },
        { value: 'MASTERCARD', label: 'Mastercard' },
        { value: 'AMEX', label: 'American Express' },
        { value: 'JCB', label: 'JCB' },
        { value: 'UNIONPAY', label: 'UnionPay' },
        { value: 'DISCOVER', label: 'Discover' },
        { value: 'DINERS_CLUB', label: 'Diners Club' },
        { value: 'MAESTRO', label: 'Maestro' },
    ];
}

onMounted(async () => {
    await loadFilterOptions();
    loadActiveTab();
});
</script>

<style scoped>
.analytics-page {
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
    margin-bottom: 10px;
}

.analytics-page__header h1 { margin: 0; font-size: 20px; line-height: 1.4; letter-spacing: 0; }
.analytics-page__header p { margin: 3px 0 0; color: var(--analytics-muted); font-size: 12px; }
.analytics-page__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; color: var(--analytics-muted); font-size: 11px; }
.analytics-page__scope { padding: 3px 7px; border: 1px solid #c9daf8; border-radius: 4px; color: #175cd3; background: #f3f7ff; }
.analytics-page__updated { display: inline-flex; align-items: center; gap: 4px; }
.analytics-page__updated :deep(.base-date-time) { color: inherit; }

.analytics-page :deep(.transaction-search-panel) { margin-bottom: 6px; }
.analytics-page :deep(.transaction-search__grid) { align-items: center; }
.analytics-page :deep(.analytics-merchant-filter .el-select) { width: 280px; }
.analytics-page :deep(.analytics-payment-filter .el-select) { width: 250px; }
.analytics-page :deep(.analytics-time-filter) { flex: 1 1 760px; max-width: 930px; }
.analytics-page :deep(.analytics-time-filter .el-form-item__content) { min-width: 0; }
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

.analytics-metric-band--merchant { grid-template-columns: minmax(240px, 360px); }

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
.analytics-amount-list--compact { margin-top: 0; }

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

.analytics-panel--trend,
.analytics-panel--merchant-chart,
.analytics-panel--table { margin-bottom: 10px; }
.analytics-panel--table { padding: 0; overflow: hidden; }
.analytics-panel__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; min-height: 31px; margin-bottom: 4px; padding-bottom: 8px; border-bottom: 1px solid #eef3fa; }
.analytics-panel__header h2 { margin: 0; font-size: 14px; line-height: 1.35; letter-spacing: 0; }
.analytics-panel__header p { margin: 2px 0 0; color: var(--analytics-muted); font-size: 11px; }
.analytics-panel__header > span { color: #98a2b3; font-size: 10px; }

.analytics-grid { display: grid; gap: 10px; margin-bottom: 10px; }
.analytics-grid--overview { grid-template-columns: minmax(260px, 0.8fr) minmax(430px, 1.35fr) minmax(320px, 1fr); }
.metric-success { color: var(--analytics-teal); }
.metric-failed { color: var(--analytics-red); }
.analytics-panel--table :deep(.el-table) { border: 0; }
.analytics-panel--table :deep(.el-empty) { border-top: 1px solid var(--analytics-line); }

@media (max-width: 1500px) {
    .analytics-metric-band { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .analytics-metric { border-bottom: 1px solid #eef1f5; }
    .analytics-metric--amount { grid-column: span 2; }
    .analytics-grid--overview { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .analytics-grid--overview > :last-child { grid-column: 1 / -1; }
}

@media (max-width: 900px) {
    .analytics-page__header { flex-direction: column; gap: 8px; }
    .analytics-page__meta { align-items: flex-start; }
    .analytics-grid--overview { grid-template-columns: 1fr; }
    .analytics-grid--overview > :last-child { grid-column: auto; }
}

@media (max-width: 600px) {
    .analytics-metric-band { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .analytics-metric { min-height: 80px; padding: 10px 10px 9px 16px; }
    .analytics-metric > strong { font-size: 20px; }
    .analytics-metric--amount { grid-column: 1 / -1; }
    .analytics-panel { padding: 11px 8px 8px; }
    .analytics-panel--table { padding: 0; }
    .analytics-page :deep(.analytics-merchant-filter),
    .analytics-page :deep(.analytics-payment-filter),
    .analytics-page :deep(.analytics-time-filter) { width: 100%; max-width: none; flex-basis: 100%; }
    .analytics-page :deep(.analytics-merchant-filter .el-select),
    .analytics-page :deep(.analytics-payment-filter .el-select) { width: 100%; }
    .analytics-page :deep(.transaction-search .el-form-item) { display: block; }
    .analytics-page :deep(.transaction-search .el-form-item__label) {
        width: 100% !important;
        height: 22px;
        justify-content: flex-start;
        padding: 0 0 4px;
        line-height: 18px;
    }
    .analytics-page :deep(.transaction-search .el-form-item__content) {
        width: 100%;
        margin-left: 0 !important;
    }
    .analytics-page :deep(.analytics-time-filter .el-date-editor.transaction-time-range-filter__picker) {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 2px;
        min-height: 62px;
        padding: 4px 8px;
    }
    .analytics-page :deep(.analytics-time-filter .el-range__icon) { display: none; }
    .analytics-page :deep(.analytics-time-filter .el-range-input) {
        width: 100%;
        line-height: 20px;
        text-align: left;
    }
    .analytics-page :deep(.analytics-time-filter .el-range-separator) {
        width: 100%;
        height: 10px;
        font-size: 10px;
        line-height: 10px;
    }
    .analytics-page :deep(.analytics-time-filter .el-range__close-icon) {
        position: absolute;
        right: 8px;
    }
}
</style>
