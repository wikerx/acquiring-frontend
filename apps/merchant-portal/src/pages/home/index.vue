<template>
    <div class="page merchant-home-page">
        <section class="merchant-home-hero" :class="{ 'has-balance-overview': canViewFundAccount }">
            <div>
                <p class="merchant-home-hero__eyebrow">{{ t('home.eyebrow') }}</p>
                <h1>{{ t('home.title', { name: displayName }) }}</h1>
                <p class="merchant-home-hero__description">{{ t('home.description') }}</p>
                <div class="merchant-home-hero__actions">
                    <el-button v-for="entry in primaryEntries" :key="entry.path" type="primary" plain @click="router.push(entry.path)">
                        <el-icon><component :is="resolveMenuIcon(entry.icon)" /></el-icon>
                        <span>{{ entry.label }}</span>
                    </el-button>
                </div>
            </div>
            <section v-if="canViewFundAccount" v-loading="fundAccountLoading" class="merchant-home-balance-overview">
                <header>
                    <div>
                        <span>{{ t('home.fundOverview') }}</span>
                        <small v-if="fundAccount?.updateTime">
                            {{ t('home.balanceUpdatedAt') }} <BaseDateTime :value="fundAccount.updateTime" />
                        </small>
                    </div>
                    <el-button
                        text
                        circle
                        :icon="RefreshLeft"
                        :aria-label="t('home.refreshBalance')"
                        :title="t('home.refreshBalance')"
                        @click="loadFundAccount"
                    />
                </header>
                <div v-if="!fundAccountError" class="merchant-home-balance-list">
                    <div>
                        <span>{{ t('finance.availableBalance') }}</span>
                        <CurrencyAmountPills
                            :items="fundAccount ? [{ currency: fundAccount.settlementCurrency, amount: fundAccount.availableBalance }] : []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="green"
                        />
                    </div>
                    <div>
                        <span>{{ t('finance.pendingBalance') }}</span>
                        <CurrencyAmountPills
                            :items="fundAccount?.pendingBalances || []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="blue"
                        />
                    </div>
                    <div>
                        <span>{{ t('finance.reserveBalance') }}</span>
                        <CurrencyAmountPills
                            :items="fundAccount ? [{ currency: fundAccount.settlementCurrency, amount: fundAccount.reserveBalance }] : []"
                            :fallback-currency="fundAccount?.settlementCurrency || 'USD'"
                            :locale="String(locale)"
                            tone="amber"
                        />
                    </div>
                </div>
                <div v-else class="merchant-home-balance-error">
                    <span>{{ t('home.fundOverviewUnavailable') }}</span>
                    <el-button link type="primary" :icon="RefreshLeft" @click="loadFundAccount">{{ t('home.retry') }}</el-button>
                </div>
                <el-button v-if="fundAccountEntry" class="merchant-home-balance-link" link type="primary" @click="router.push(fundAccountEntry.path)">
                    {{ fundAccountEntry.label }} <el-icon><ArrowRight /></el-icon>
                </el-button>
            </section>
            <div class="merchant-home-identity">
                <span>{{ t('home.currentMerchant') }}</span>
                <strong>{{ merchantId }}</strong>
                <small>{{ loginAccount }}</small>
                <div class="merchant-home-identity__mark">{{ merchantBrand.name }}</div>
            </div>
        </section>

        <template v-if="canViewAnalytics">
            <section class="merchant-home-section-head">
                <div>
                    <h2>{{ t('home.transactionOverview') }}</h2>
                    <p>{{ t('home.transactionOverviewDesc') }}</p>
                </div>
                <div class="merchant-home-section-head__controls">
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
            </section>

            <el-alert
                v-if="overviewError"
                :title="overviewError"
                type="error"
                :closable="false"
                show-icon
                class="merchant-home-alert"
            />

            <section v-loading="overviewLoading" class="merchant-home-metric-band" :aria-label="t('home.transactionOverview')">
                <article v-for="item in overviewMetrics" :key="item.key" class="merchant-home-metric" :class="`is-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </article>
                <article class="merchant-home-metric merchant-home-metric--amount is-cyan">
                    <span>{{ t('transactionAnalytics.successAmount') }}</span>
                    <div v-if="overview?.successAmounts.length" class="merchant-home-amount-list">
                        <span v-for="item in overview.successAmounts" :key="`${item.currency}:${item.currencyExponent}`">
                            <b>{{ item.currency || chartLabels.unknown }}</b>
                            <strong>{{ formatAnalyticsAmountValue(item, locale) }}</strong>
                            <small>{{ formatCount(item.successCount) }}{{ t('transactionAnalytics.countUnit') }}</small>
                        </span>
                    </div>
                    <strong v-else>-</strong>
                    <small>{{ t('transactionAnalytics.amountHint') }}</small>
                </article>
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
                    height="310px"
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
import { ArrowRight, CircleClose, Link, Loading, RefreshLeft } from '@element-plus/icons-vue';
import {
    AnalyticsChart,
    CurrencyAmountPills,
    analyticsNumber,
    createAnalyticsTrendOption,
    createTransactionAnalyticsRange,
    formatAnalyticsAmountValue,
    getSystemBrand,
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
    const total = analyticsNumber(data?.totalCount);
    const success = analyticsNumber(data?.successCount);
    const failed = analyticsNumber(data?.failedCount);
    const inFlight = analyticsNumber(data?.pendingCount) + analyticsNumber(data?.processingCount);
    const terminal = success + failed;
    return [
        { key: 'total', label: t('transactionAnalytics.totalCount'), value: formatMetricValue(data, total), hint: t('transactionAnalytics.totalHint'), tone: 'ink' },
        { key: 'success', label: t('transactionAnalytics.successCount'), value: formatMetricValue(data, success), hint: ratioHint(success, total), tone: 'teal' },
        { key: 'failed', label: t('transactionAnalytics.failedCount'), value: formatMetricValue(data, failed), hint: ratioHint(failed, total), tone: 'red' },
        { key: 'flight', label: t('transactionAnalytics.inFlightCount'), value: formatMetricValue(data, inFlight), hint: ratioHint(inFlight, total), tone: 'amber' },
        { key: 'rate', label: t('transactionAnalytics.successRate'), value: data ? `${analyticsNumber(data.successRate).toFixed(2)}%` : '-', hint: t('transactionAnalytics.terminalCountHint', { count: formatCount(terminal) }), tone: 'blue' },
    ];
});
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
