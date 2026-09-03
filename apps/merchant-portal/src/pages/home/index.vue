<template>
    <div class="page merchant-home-page">
        <section class="merchant-home-intro">
            <div class="merchant-home-intro__copy">
                <h1>{{ t('home.title', { name: displayName }) }}</h1>
                <p>
                    <span>{{ t('home.merchantId') }} {{ merchantId }}</span>
                    <i aria-hidden="true" />
                    <span>{{ loginAccount }}</span>
                </p>
            </div>
            <div class="merchant-home-intro__actions">
                <el-button v-for="entry in primaryEntries" :key="entry.path" plain @click="router.push(entry.path)">
                    <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                    <span>{{ entry.label }}</span>
                </el-button>
            </div>
        </section>

        <section v-if="canViewFundAccount" v-loading="fundAccountLoading" class="merchant-home-surface merchant-home-balance-overview">
            <header class="merchant-home-surface__head">
                <div class="merchant-home-surface__title">
                    <span class="merchant-home-surface__icon is-blue"><el-icon><Wallet /></el-icon></span>
                    <div>
                        <h2>{{ t('home.fundOverview') }}</h2>
                        <p>
                            {{ t('home.fundOverviewDesc') }}
                            <template v-if="fundAccount?.updateTime">
                                · {{ t('home.balanceUpdatedAt') }} <BaseDateTime :value="fundAccount.updateTime" />
                            </template>
                        </p>
                    </div>
                </div>
                <div class="merchant-home-surface__actions">
                    <el-button v-if="fundAccountEntry" link type="primary" @click="router.push(fundAccountEntry.path)">
                        {{ fundAccountEntry.label }} <el-icon><ArrowRight /></el-icon>
                    </el-button>
                    <el-button
                        text
                        circle
                        :icon="RefreshLeft"
                        :aria-label="t('home.refreshBalance')"
                        :title="t('home.refreshBalance')"
                        @click="loadFundAccount"
                    />
                </div>
            </header>
            <div v-if="!fundAccountError" class="merchant-home-balance-list">
                <article class="merchant-home-balance-item is-available">
                    <span class="merchant-home-balance-item__icon"><el-icon><Wallet /></el-icon></span>
                    <div class="merchant-home-balance-item__body">
                        <div class="merchant-home-balance-item__head">
                            <strong>{{ t('finance.availableBalance') }}</strong>
                            <small>{{ t('home.availableBalanceHint') }}</small>
                        </div>
                        <CurrencyAmountPills
                            :items="fundAccount ? [{ currency: fundAccount.settlementCurrency, amount: fundAccount.availableBalance }] : []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="green"
                        />
                    </div>
                </article>
                <article class="merchant-home-balance-item is-pending">
                    <span class="merchant-home-balance-item__icon"><el-icon><Clock /></el-icon></span>
                    <div class="merchant-home-balance-item__body">
                        <div class="merchant-home-balance-item__head">
                            <strong>{{ t('finance.pendingBalance') }}</strong>
                            <small>{{ t('home.pendingBalanceHint') }}</small>
                        </div>
                        <CurrencyAmountPills
                            :items="fundAccount?.pendingBalances || []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="blue"
                        />
                    </div>
                </article>
                <article class="merchant-home-balance-item is-reserve">
                    <span class="merchant-home-balance-item__icon"><el-icon><Lock /></el-icon></span>
                    <div class="merchant-home-balance-item__body">
                        <div class="merchant-home-balance-item__head">
                            <strong>{{ t('finance.reserveBalance') }}</strong>
                            <small>{{ t('home.reserveBalanceHint') }}</small>
                        </div>
                        <CurrencyAmountPills
                            :items="fundAccount ? [{ currency: fundAccount.settlementCurrency, amount: fundAccount.reserveBalance }] : []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="amber"
                        />
                    </div>
                </article>
            </div>
            <div v-else class="merchant-home-balance-error">
                <span>{{ t('home.fundOverviewUnavailable') }}</span>
                <el-button link type="primary" :icon="RefreshLeft" @click="loadFundAccount">{{ t('home.retry') }}</el-button>
            </div>
        </section>

        <template v-if="canViewAnalytics">
            <el-alert
                v-if="overviewError"
                :title="overviewError"
                type="error"
                :closable="false"
                show-icon
                class="merchant-home-alert"
            />

            <section v-loading="overviewLoading" class="merchant-home-surface merchant-home-overview" :aria-label="t('home.transactionOverview')">
                <header class="merchant-home-surface__head merchant-home-overview__head">
                    <div class="merchant-home-surface__title">
                        <span class="merchant-home-surface__icon is-teal"><el-icon><DataAnalysis /></el-icon></span>
                        <div>
                            <h2>{{ t('home.transactionOverview') }}</h2>
                            <p>{{ t('home.transactionOverviewDesc') }}</p>
                        </div>
                    </div>
                    <div class="merchant-home-overview__controls">
                        <span v-if="overview?.generatedAt" class="merchant-home-updated-at">
                            {{ t('transactionAnalytics.updatedAtLabel') }}
                            <BaseDateTime
                                :value="overview.generatedAt"
                                :source-time-zone="DEFAULT_TRANSACTION_QUERY_TIME_ZONE"
                                :display-time-zone="DEFAULT_TRANSACTION_QUERY_TIME_ZONE"
                            />
                        </span>
                        <el-radio-group v-model="selectedRangeDays" size="small" @change="handleRangeChange">
                            <el-radio-button v-for="option in rangeOptions" :key="option.days" :value="option.days">
                                {{ option.label }}
                            </el-radio-button>
                        </el-radio-group>
                    </div>
                </header>

                <div class="merchant-home-metric-band">
                    <article v-for="item in overviewMetrics" :key="item.key" class="merchant-home-metric" :class="`is-${item.tone}`">
                        <header class="merchant-home-metric__head">
                            <span class="merchant-home-metric__icon"><el-icon><component :is="item.icon" /></el-icon></span>
                            <span>{{ item.label }}</span>
                        </header>
                        <strong class="merchant-home-metric__value">{{ item.value }}</strong>
                        <div v-if="item.comparison" class="merchant-home-metric__comparison">
                            <span :class="`is-${item.comparison.sentiment}`">
                                {{ item.comparison.arrow }} {{ item.comparison.label }}
                            </span>
                            <small>{{ comparisonPeriodLabel }}</small>
                            <small>{{ item.comparison.previous }}</small>
                        </div>
                        <div v-else class="merchant-home-metric__comparison is-unavailable">
                            <span>{{ t('home.comparisonUnavailable') }}</span>
                            <small>{{ item.hint }}</small>
                        </div>
                    </article>
                </div>

                <section class="merchant-home-amount-section">
                    <header>
                        <div>
                            <h3>{{ t('transactionAnalytics.successAmount') }}</h3>
                            <p>{{ t('transactionAnalytics.amountHint') }}</p>
                        </div>
                    </header>
                    <div v-if="amountComparisonRows.length" class="merchant-home-amount-table">
                        <div class="merchant-home-amount-table__row is-head" aria-hidden="true">
                            <span>{{ t('transactionAnalytics.currency') }}</span>
                            <span>{{ t('home.currentPeriod') }}</span>
                            <span>{{ comparisonPeriodLabel }}</span>
                            <span>{{ t('home.previousPeriod') }}</span>
                            <span>{{ t('transactionAnalytics.successCount') }}</span>
                        </div>
                        <div v-for="item in amountComparisonRows" :key="`${item.currency}:${item.currencyExponent}`" class="merchant-home-amount-table__row">
                            <b>{{ item.currency || chartLabels.unknown }}</b>
                            <strong>{{ formatComparisonAmount(item, 'current') }}</strong>
                            <span class="merchant-home-amount-delta" :class="`is-${amountComparisonSentiment(item)}`">
                                {{ amountComparisonArrow(item) }} {{ amountComparisonLabel(item) }}
                            </span>
                            <span>{{ formatComparisonAmount(item, 'previous') }}</span>
                            <span>{{ formatCount(item.currentSuccessCount) }}{{ t('transactionAnalytics.countUnit') }}</span>
                        </div>
                    </div>
                    <div v-else-if="overview?.successAmounts.length" class="merchant-home-amount-table is-current-only">
                        <div class="merchant-home-amount-table__row is-head" aria-hidden="true">
                            <span>{{ t('transactionAnalytics.currency') }}</span>
                            <span>{{ t('home.currentPeriod') }}</span>
                            <span>{{ t('transactionAnalytics.successCount') }}</span>
                        </div>
                        <div v-for="item in overview.successAmounts" :key="`${item.currency}:${item.currencyExponent}`" class="merchant-home-amount-table__row">
                            <b>{{ item.currency || chartLabels.unknown }}</b>
                            <strong>{{ formatAnalyticsAmountValue(item, locale) }}</strong>
                            <span>{{ formatCount(item.successCount) }}{{ t('transactionAnalytics.countUnit') }}</span>
                        </div>
                    </div>
                    <div v-else class="merchant-home-amount-empty">{{ t('transactionAnalytics.noData') }}</div>
                </section>
            </section>
        </template>

        <section class="merchant-home-content" :class="{ 'is-without-analytics': !canViewAnalytics }">
            <article v-if="canViewAnalytics" class="merchant-home-panel merchant-home-trend-panel">
                <header class="merchant-home-panel__head">
                    <div>
                        <h2>{{ t('transactionAnalytics.trendTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.trendSubtitle') }}</p>
                    </div>
                    <el-button v-if="analyticsEntry" text type="primary" @click="router.push(analyticsEntry.path)">
                        {{ t('home.openAnalytics') }}
                        <el-icon><ArrowRight /></el-icon>
                    </el-button>
                </header>
                <AnalyticsChart
                    :option="trendOption"
                    :loading="overviewLoading"
                    :empty="!overview?.trend.length"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.trendTitle')"
                    height="258px"
                />
            </article>

            <article class="merchant-home-panel merchant-home-task-panel">
                <header class="merchant-home-panel__head">
                    <div>
                        <h2>{{ t('home.pendingItems') }}</h2>
                        <p>{{ t('home.pendingItemsDesc') }}</p>
                    </div>
                </header>

                <div v-if="taskItems.length" class="merchant-home-task-list">
                    <button
                        v-for="item in taskItems"
                        :key="item.key"
                        type="button"
                        class="merchant-home-task"
                        @click="router.push(item.path)"
                    >
                        <span class="merchant-home-task__icon" :class="`is-${item.tone}`">
                            <el-icon><component :is="item.icon" /></el-icon>
                        </span>
                        <span class="merchant-home-task__copy">
                            <strong>{{ item.label }}</strong>
                            <small>{{ item.hint }}</small>
                        </span>
                        <b>{{ item.value }}</b>
                        <el-icon class="merchant-home-task__arrow"><ArrowRight /></el-icon>
                    </button>
                </div>
                <div v-else class="merchant-home-task-empty">
                    <span>{{ t('home.noPendingItems') }}</span>
                </div>

                <p v-if="taskLoadPartialFailure" class="merchant-home-task-warning">{{ t('home.pendingItemsPartialFailure') }}</p>

                <div v-if="primaryEntries.length" class="merchant-home-shortcuts">
                    <button v-for="entry in primaryEntries" :key="entry.path" type="button" @click="router.push(entry.path)">
                        <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        <span>{{ entry.label }}</span>
                    </button>
                </div>
            </article>

            <article v-if="!canViewAnalytics" class="merchant-home-panel merchant-home-available-panel">
                <header class="merchant-home-panel__head">
                    <div>
                        <h2>{{ t('home.availableFeatures') }}</h2>
                        <p>{{ t('home.quickEntryDesc') }}</p>
                    </div>
                </header>
                <div class="merchant-home-entry-list">
                    <button v-for="entry in menuEntries" :key="entry.path" class="merchant-home-entry" type="button" @click="router.push(entry.path)">
                        <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        <span>{{ entry.label }}</span>
                        <el-icon><ArrowRight /></el-icon>
                    </button>
                </div>
            </article>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
    ArrowRight,
    CircleCheck,
    CircleClose,
    Clock,
    DataAnalysis,
    Link,
    Loading,
    Lock,
    RefreshLeft,
    TrendCharts,
    Wallet,
} from '@element-plus/icons-vue';
import {
    AnalyticsChart,
    CurrencyAmountPills,
    analyticsNumber,
    createAnalyticsTrendOption,
    createTransactionAnalyticsRange,
    formatAnalyticsAmountValue,
    getSystemBrand,
    type TransactionAnalyticsAmountComparisonMetric,
    type TransactionAnalyticsOverview,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { accessConfigApi } from '@/api/accessConfigApi';
import { financeApi, type FundAccount } from '@/api/financeApi';
import { transactionApi } from '@/api/transactionApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { useAuthStore } from '@/stores/authStore';
import { flattenRouteMenus, normalizeMenuPath, resolveMerchantMenuLabel, withMerchantHomeMenu } from '@/utils/menu';
import { resolveMenuIcon } from '@/utils/menuIcon';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE } from '../transaction/shared';

const router = useRouter();
const auth = useAuthStore();
const { t, te, locale } = useI18n();
const merchantBrand = getSystemBrand('merchant');
const selectedRangeDays = ref(7);
const overview = ref<TransactionAnalyticsOverview>();
const overviewLoading = ref(false);
const overviewError = ref('');
const pendingRefundCount = ref<number | null>(null);
const pendingAccessCount = ref<number | null>(null);
const taskLoadPartialFailure = ref(false);
const fundAccount = ref<FundAccount | null>(null);
const fundAccountLoading = ref(false);
const fundAccountError = ref(false);
let overviewRequestSequence = 0;

const account = computed(() => auth.session?.account);
const displayName = computed(() => account.value?.realName || account.value?.loginAccount || merchantBrand.subtitleZh);
const merchantId = computed(() => account.value?.merchantId || '-');
const loginAccount = computed(() => account.value?.loginAccount || '-');
const menus = computed(() => withMerchantHomeMenu(auth.session?.menus || []));
const menuEntries = computed(() =>
    flattenRouteMenus(menus.value)
        .map((menu) => ({
            path: normalizeMenuPath(menu.routePath),
            label: resolveMerchantMenuLabel(menu, t, te),
            icon: menu.icon,
        }))
        .filter((menu) => menu.path && menu.path !== '/home'),
);
const menuEntryMap = computed(() => new Map(menuEntries.value.map((entry) => [entry.path, entry])));
const primaryEntries = computed(() => {
    const priorityPaths = ['/transaction/analytics', '/transaction/order', '/transaction/refund'];
    const prioritized = priorityPaths.map((path) => menuEntryMap.value.get(path)).filter(Boolean);
    const remaining = menuEntries.value.filter((entry) => !priorityPaths.includes(entry.path));
    return [...prioritized, ...remaining].slice(0, 3) as typeof menuEntries.value;
});
const analyticsEntry = computed(() => menuEntryMap.value.get('/transaction/analytics'));
const refundEntry = computed(() => menuEntryMap.value.get('/transaction/refund'));
const sourceUrlEntry = computed(() => menuEntryMap.value.get('/access-config/source-url'));
const ipWhitelistEntry = computed(() => menuEntryMap.value.get('/access-config/ip-whitelist'));
const fundAccountEntry = computed(() => menuEntryMap.value.get('/finance/account'));
const canViewAnalytics = computed(() => Boolean(analyticsEntry.value) && auth.hasPermission('merchant:transaction:analytics:view'));
const canViewRefunds = computed(() => Boolean(refundEntry.value) && auth.hasPermission('merchant:transaction:refund:list'));
const canViewSourceUrls = computed(() => Boolean(sourceUrlEntry.value) && auth.hasPermission('merchant:access-config:source-url:list'));
const canViewIpWhitelists = computed(() => Boolean(ipWhitelistEntry.value) && auth.hasPermission('merchant:access-config:ip-whitelist:list'));
const canViewFundAccount = computed(() => auth.hasPermission('merchant:fund:account:view'));
const rangeOptions = computed(() => [
    { days: 1, label: t('transaction.time.today') },
    { days: 7, label: t('transactionAnalytics.last7Days') },
    { days: 30, label: t('transactionAnalytics.last30Days') },
]);
const comparisonPeriodLabel = computed(() => {
    const comparisonDays = overview.value?.comparison?.periodDays ?? selectedRangeDays.value;
    if (comparisonDays === 1) return t('home.compareYesterday');
    if (comparisonDays === 30) return t('home.compareLastMonth');
    return t('home.compareLastWeek');
});
const chartLabels = computed(() => ({
    total: t('transactionAnalytics.totalSeries'),
    success: t('transactionAnalytics.successSeries'),
    failed: t('transactionAnalytics.failedSeries'),
    pending: t('transactionAnalytics.pendingSeries'),
    processing: t('transactionAnalytics.processingSeries'),
    terminal: t('transactionAnalytics.terminalSeries'),
    rate: t('transactionAnalytics.rateSeries'),
    unknown: t('transactionAnalytics.unknown'),
}));
const overviewMetrics = computed(() => {
    const data = overview.value;
    const comparison = data?.comparison;
    const total = analyticsNumber(data?.totalCount);
    const success = analyticsNumber(data?.successCount);
    const failed = analyticsNumber(data?.failedCount);
    const inFlight = analyticsNumber(data?.pendingCount) + analyticsNumber(data?.processingCount);
    const terminal = success + failed;
    return [
        {
            key: 'total', label: t('transactionAnalytics.totalCount'), value: formatMetricValue(data, total),
            hint: t('transactionAnalytics.totalHint'), tone: 'ink', icon: DataAnalysis,
            comparison: buildCountComparison(total, comparison?.previousTotalCount, 'higher'),
        },
        {
            key: 'success', label: t('transactionAnalytics.successCount'), value: formatMetricValue(data, success),
            hint: ratioHint(success, total), tone: 'teal', icon: CircleCheck,
            comparison: buildCountComparison(success, comparison?.previousSuccessCount, 'higher'),
        },
        {
            key: 'failed', label: t('transactionAnalytics.failedCount'), value: formatMetricValue(data, failed),
            hint: ratioHint(failed, total), tone: 'red', icon: CircleClose,
            comparison: buildCountComparison(failed, comparison?.previousFailedCount, 'lower'),
        },
        {
            key: 'flight', label: t('transactionAnalytics.inFlightCount'), value: formatMetricValue(data, inFlight),
            hint: ratioHint(inFlight, total), tone: 'amber', icon: Loading,
            comparison: buildCountComparison(
                inFlight,
                comparison ? analyticsNumber(comparison.previousPendingCount) + analyticsNumber(comparison.previousProcessingCount) : undefined,
                'lower',
            ),
        },
        {
            key: 'rate', label: t('transactionAnalytics.successRate'),
            value: data ? `${formatDecimal(analyticsNumber(data.successRate))}%` : '-',
            hint: t('transactionAnalytics.terminalCountHint', { count: formatCount(terminal) }), tone: 'blue', icon: TrendCharts,
            comparison: buildRateComparison(analyticsNumber(data?.successRate), comparison?.previousSuccessRate),
        },
    ];
});
const amountComparisonRows = computed(() => overview.value?.comparison?.successAmounts ?? []);
const trendOption = computed(() => createAnalyticsTrendOption(overview.value?.trend ?? [], chartLabels.value));
const accessEntry = computed(() => sourceUrlEntry.value || ipWhitelistEntry.value);
const taskItems = computed(() => {
    const items = [];
    if (canViewAnalytics.value && analyticsEntry.value) {
        items.push({
            key: 'failed',
            label: t('home.failedTransactions'),
            hint: t('home.failedTransactionsHint'),
            value: overview.value ? formatCount(overview.value.failedCount) : '-',
            path: analyticsEntry.value.path,
            icon: CircleClose,
            tone: 'red',
        });
        items.push({
            key: 'processing',
            label: t('home.processingTransactions'),
            hint: t('home.processingTransactionsHint'),
            value: overview.value ? formatCount(analyticsNumber(overview.value.pendingCount) + analyticsNumber(overview.value.processingCount)) : '-',
            path: analyticsEntry.value.path,
            icon: Loading,
            tone: 'blue',
        });
    }
    if (canViewRefunds.value && refundEntry.value) {
        items.push({
            key: 'refund',
            label: t('home.pendingRefunds'),
            hint: t('home.pendingRefundsHint'),
            value: pendingRefundCount.value === null ? '-' : formatCount(pendingRefundCount.value),
            path: refundEntry.value.path,
            icon: RefreshLeft,
            tone: 'amber',
        });
    }
    if ((canViewSourceUrls.value || canViewIpWhitelists.value) && accessEntry.value) {
        items.push({
            key: 'access',
            label: t('home.pendingAccessConfig'),
            hint: t('home.pendingAccessConfigHint'),
            value: pendingAccessCount.value === null ? '-' : formatCount(pendingAccessCount.value),
            path: accessEntry.value.path,
            icon: Link,
            tone: 'teal',
        });
    }
    return items;
});

function formatCount(value: number | string | null | undefined) {
    return new Intl.NumberFormat(locale.value).format(analyticsNumber(value));
}

function formatMetricValue(data: TransactionAnalyticsOverview | undefined, value: number) {
    return data ? formatCount(value) : '-';
}

type ComparisonPreference = 'higher' | 'lower';
type ComparisonSentiment = 'positive' | 'negative' | 'neutral';

function buildCountComparison(current: number, previousValue: number | string | null | undefined, preference: ComparisonPreference) {
    if (previousValue === undefined || previousValue === null) return null;
    const previous = analyticsNumber(previousValue);
    const difference = current - previous;
    const direction = difference > 0 ? 'up' : difference < 0 ? 'down' : 'flat';
    const sentiment: ComparisonSentiment = direction === 'flat'
        ? 'neutral'
        : (direction === 'up') === (preference === 'higher') ? 'positive' : 'negative';
    const label = difference === 0
        ? t('home.comparisonFlat')
        : previous === 0 && current > 0
            ? t('home.comparisonNew')
            : `${formatDecimal(Math.abs(difference) * 100 / Math.abs(previous))}%`;
    return {
        arrow: direction === 'up' ? '↑' : direction === 'down' ? '↓' : '—',
        label,
        sentiment,
        previous: t('home.previousPeriodValue', { value: formatCount(previous) }),
    };
}

function buildRateComparison(current: number, previousValue: number | string | null | undefined) {
    if (previousValue === undefined || previousValue === null) return null;
    const previous = analyticsNumber(previousValue);
    const difference = current - previous;
    return {
        arrow: difference > 0 ? '↑' : difference < 0 ? '↓' : '—',
        label: difference === 0
            ? t('home.comparisonFlat')
            : t('home.percentagePointChange', { value: formatDecimal(Math.abs(difference)) }),
        sentiment: difference > 0 ? 'positive' : difference < 0 ? 'negative' : 'neutral' as ComparisonSentiment,
        previous: t('home.previousPeriodValue', { value: `${formatDecimal(previous)}%` }),
    };
}

function formatDecimal(value: number) {
    return new Intl.NumberFormat(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatComparisonAmount(item: TransactionAnalyticsAmountComparisonMetric, period: 'current' | 'previous') {
    return formatAnalyticsAmountValue({
        currency: item.currency,
        currencyExponent: item.currencyExponent,
        amount: period === 'current' ? item.currentAmount : item.previousAmount,
        successCount: period === 'current' ? item.currentSuccessCount : item.previousSuccessCount,
    }, String(locale.value));
}

function amountComparisonArrow(item: TransactionAnalyticsAmountComparisonMetric) {
    if (item.changeDirection === 'INCREASE' || item.changeDirection === 'NEW') return '↑';
    if (item.changeDirection === 'DECREASE') return '↓';
    return '—';
}

function amountComparisonLabel(item: TransactionAnalyticsAmountComparisonMetric) {
    if (item.changeDirection === 'NEW') return t('home.comparisonNew');
    if (item.changeDirection === 'FLAT') return t('home.comparisonFlat');
    return `${formatDecimal(analyticsNumber(item.changeRate))}%`;
}

function amountComparisonSentiment(item: TransactionAnalyticsAmountComparisonMetric): ComparisonSentiment {
    if (item.changeDirection === 'INCREASE' || item.changeDirection === 'NEW') return 'positive';
    if (item.changeDirection === 'DECREASE') return 'negative';
    return 'neutral';
}

function ratioHint(value: number, total: number) {
    const rate = total ? (value * 100 / total).toFixed(2) : '0.00';
    return t('transactionAnalytics.totalShare', { rate });
}

function handleRangeChange() {
    loadOverview();
}

async function loadOverview() {
    if (!canViewAnalytics.value) return;
    const requestId = ++overviewRequestSequence;
    const [beginTime, endTime] = createTransactionAnalyticsRange(selectedRangeDays.value, DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    overviewLoading.value = true;
    overviewError.value = '';
    try {
        const result = await transactionApi.analyticsOverview({
            beginTime,
            endTime,
            queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
        });
        if (requestId === overviewRequestSequence) overview.value = result;
    } catch {
        if (requestId === overviewRequestSequence) {
            overview.value = undefined;
            overviewError.value = t('transactionAnalytics.loadFailed');
        }
    } finally {
        if (requestId === overviewRequestSequence) overviewLoading.value = false;
    }
}

async function loadPendingItems() {
    const loaders: Array<Promise<void>> = [];
    if (canViewRefunds.value) {
        loaders.push(transactionApi.searchRefunds({ pageNo: 1, pageSize: 1 })
            .then((result) => { pendingRefundCount.value = analyticsNumber(result.summary?.pendingApprovalCount); }));
    }
    if (canViewSourceUrls.value || canViewIpWhitelists.value) {
        loaders.push(loadPendingAccessCount());
    }
    const results = await Promise.allSettled(loaders);
    taskLoadPartialFailure.value = results.some((result) => result.status === 'rejected');
}

async function loadPendingAccessCount() {
    const loaders = [];
    if (canViewSourceUrls.value) loaders.push(accessConfigApi.listSourceUrls());
    if (canViewIpWhitelists.value) loaders.push(accessConfigApi.listIpWhitelists());
    const results = await Promise.all(loaders);
    pendingAccessCount.value = results.flat().filter((item) => item.approvalStatus === 0).length;
}

async function loadFundAccount() {
    if (!canViewFundAccount.value) return;
    fundAccountLoading.value = true;
    fundAccountError.value = false;
    try {
        fundAccount.value = await financeApi.fundAccount();
    } catch {
        fundAccount.value = null;
        fundAccountError.value = true;
    } finally {
        fundAccountLoading.value = false;
    }
}

onMounted(() => {
    loadOverview();
    loadPendingItems();
    loadFundAccount();
});
</script>
