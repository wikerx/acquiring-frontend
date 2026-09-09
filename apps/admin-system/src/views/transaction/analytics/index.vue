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
            v-if="availableTabs.length"
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

        <el-tabs v-if="availableTabs.length" v-model="activeTab" class="analytics-tabs" @tab-change="handleTabChange">
            <el-tab-pane v-for="tab in availableTabs" :key="tab.name" :label="t(tab.label)" :name="tab.name" />
        </el-tabs>

        <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon class="analytics-alert" />

        <el-empty
            v-if="!availableTabs.length"
            class="analytics-no-permission"
            :description="t('transactionAnalytics.noFunctionPermission')"
        />

        <template v-if="activeTabAuthorized && activeTab === 'overview'">
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
                        :pending-label="chartLabels.pending"
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

        <template v-else-if="activeTabAuthorized && activeTab === 'merchants'">
            <section class="analytics-metric-band analytics-metric-band--merchant">
                <article class="analytics-metric is-green">
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

        <template v-else-if="activeTabAuthorized && activeTab === 'failures'">
            <section class="analytics-metric-band analytics-metric-band--diagnostic">
                <article v-for="item in failureMetrics" :key="item.key" class="analytics-metric" :class="`is-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </article>
            </section>
            <section class="analytics-panel analytics-panel--trend">
                <header class="analytics-panel__header">
                    <div>
                        <h2>{{ t('transactionAnalytics.failureTrendTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.failureTrendSubtitle') }}</p>
                    </div>
                </header>
                <AnalyticsChart
                    :option="failureTrendOption"
                    :loading="loading"
                    :empty="!failureAnalysis?.failedCount"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.failureTrendTitle')"
                    height="310px"
                />
            </section>
            <div class="analytics-grid analytics-grid--diagnostic">
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.failureCategoryTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="failureCategoryOption"
                        :loading="loading"
                        :empty="!failureAnalysis?.categories.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.failureCategoryTitle')"
                        height="286px"
                    />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.failureChannelTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="failureChannelOption"
                        :loading="loading"
                        :empty="!failureAnalysis?.channels.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.failureChannelTitle')"
                        height="286px"
                    />
                </section>
            </div>
            <section class="analytics-panel analytics-panel--table">
                <StandardTable
                    table-key="transaction-analytics-failure-reasons"
                    v-loading="loading"
                    :data="failureAnalysis?.reasons ?? []"
                    row-key="key"
                    size="small"
                >
                    <el-table-column prop="key" :label="t('transactionAnalytics.failureCode')" min-width="190" fixed="left" />
                    <el-table-column prop="category" :label="t('transactionAnalytics.failureCategory')" min-width="140">
                        <template #default="{ row }">{{ failureCategoryLabel(row.category) }}</template>
                    </el-table-column>
                    <el-table-column prop="message" :label="t('transactionAnalytics.failureMessage')" min-width="320" show-overflow-tooltip />
                    <el-table-column prop="totalCount" :label="t('transactionAnalytics.tableFailed')" min-width="110" align="right">
                        <template #default="{ row }"><span class="metric-failed">{{ formatCount(row.totalCount) }}</span></template>
                    </el-table-column>
                    <el-table-column prop="percentage" :label="t('transactionAnalytics.failureShare')" min-width="120" align="right">
                        <template #default="{ row }">{{ formatRate(row.percentage) }}</template>
                    </el-table-column>
                </StandardTable>
                <el-empty v-if="!loading && !failureAnalysis?.reasons.length" :description="t('transactionAnalytics.noData')" />
            </section>
        </template>

        <template v-else-if="activeTabAuthorized && activeTab === 'channels'">
            <section class="analytics-metric-band analytics-metric-band--diagnostic">
                <article v-for="item in channelMetrics" :key="item.key" class="analytics-metric" :class="`is-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </article>
            </section>
            <section class="analytics-panel analytics-panel--trend">
                <header class="analytics-panel__header">
                    <div>
                        <h2>{{ t('transactionAnalytics.channelTrendTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.channelTrendSubtitle') }}</p>
                    </div>
                </header>
                <AnalyticsChart
                    :option="channelTrendOption"
                    :loading="loading"
                    :empty="!channelPerformance?.totalRequestCount"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.channelTrendTitle')"
                    height="320px"
                />
            </section>
            <div class="analytics-grid analytics-grid--diagnostic">
                <section class="analytics-panel">
                    <header class="analytics-panel__header">
                        <div>
                            <h2>{{ t('transactionAnalytics.channelRateTitle') }}</h2>
                            <p>{{ t('transactionAnalytics.channelRateSubtitle') }}</p>
                        </div>
                    </header>
                    <AnalyticsChart
                        :option="channelRateOption"
                        :loading="loading"
                        :empty="!channelPerformance?.channels.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.channelRateTitle')"
                        height="320px"
                    />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.channelResponseCodeTitle') }}</h2></header>
                    <AnalyticsChart
                        :option="channelResponseCodeOption"
                        :loading="loading"
                        :empty="!channelPerformance?.responseCodes.length"
                        :empty-text="t('transactionAnalytics.noData')"
                        :aria-label="t('transactionAnalytics.channelResponseCodeTitle')"
                        height="320px"
                    />
                </section>
            </div>
            <section class="analytics-panel analytics-panel--table">
                <StandardTable
                    table-key="transaction-analytics-channels"
                    v-loading="loading"
                    :data="channelPerformance?.channels ?? []"
                    row-key="channelCode"
                    size="small"
                >
                    <el-table-column prop="channelCode" :label="t('transactionAnalytics.channelCode')" min-width="150" fixed="left" />
                    <el-table-column prop="totalRequestCount" :label="t('transactionAnalytics.channelRequests')" min-width="115" align="right">
                        <template #default="{ row }">{{ formatCount(row.totalRequestCount) }}</template>
                    </el-table-column>
                    <el-table-column prop="successfulRequestCount" :label="t('transactionAnalytics.channelRequestSuccess')" min-width="120" align="right">
                        <template #default="{ row }"><span class="metric-success">{{ formatCount(row.successfulRequestCount) }}</span></template>
                    </el-table-column>
                    <el-table-column prop="failedRequestCount" :label="t('transactionAnalytics.channelRequestFailed')" min-width="115" align="right">
                        <template #default="{ row }"><span class="metric-failed">{{ formatCount(row.failedRequestCount) }}</span></template>
                    </el-table-column>
                    <el-table-column prop="timeoutRequestCount" :label="t('transactionAnalytics.channelTimeout')" min-width="105" align="right">
                        <template #default="{ row }">{{ formatCount(row.timeoutRequestCount) }}</template>
                    </el-table-column>
                    <el-table-column prop="inFlightRequestCount" :label="t('transactionAnalytics.tableInFlight')" min-width="105" align="right">
                        <template #default="{ row }">{{ formatCount(row.inFlightRequestCount) }}</template>
                    </el-table-column>
                    <el-table-column prop="requestSuccessRate" :label="t('transactionAnalytics.channelRequestRate')" min-width="130" align="right">
                        <template #default="{ row }"><strong>{{ formatRate(row.requestSuccessRate) }}</strong></template>
                    </el-table-column>
                    <el-table-column prop="transactionSuccessRate" :label="t('transactionAnalytics.channelTransactionRate')" min-width="140" align="right">
                        <template #default="{ row }"><strong>{{ formatRate(row.transactionSuccessRate) }}</strong></template>
                    </el-table-column>
                    <el-table-column prop="averageDurationMillis" :label="t('transactionAnalytics.channelAverageDuration')" min-width="130" align="right">
                        <template #default="{ row }">{{ formatMillis(row.averageDurationMillis) }}</template>
                    </el-table-column>
                    <el-table-column prop="maximumDurationMillis" :label="t('transactionAnalytics.channelMaximumDuration')" min-width="130" align="right">
                        <template #default="{ row }">{{ formatMillis(row.maximumDurationMillis) }}</template>
                    </el-table-column>
                </StandardTable>
                <el-empty v-if="!loading && !channelPerformance?.channels.length" :description="t('transactionAnalytics.noData')" />
            </section>
        </template>

        <template v-else-if="activeTabAuthorized && activeTab === 'threeDs'">
            <section class="analytics-metric-band analytics-metric-band--diagnostic">
                <article v-for="item in threeDsMetrics" :key="item.key" class="analytics-metric" :class="`is-${item.tone}`">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                    <small>{{ item.hint }}</small>
                </article>
            </section>
            <section class="analytics-panel analytics-panel--trend">
                <header class="analytics-panel__header">
                    <div>
                        <h2>{{ t('transactionAnalytics.threeDsTrendTitle') }}</h2>
                        <p>{{ t('transactionAnalytics.threeDsTrendSubtitle') }}</p>
                    </div>
                </header>
                <AnalyticsChart
                    :option="threeDsTrendOption"
                    :loading="loading"
                    :empty="!threeDsAnalysis?.authenticationTransactionCount"
                    :empty-text="t('transactionAnalytics.noData')"
                    :aria-label="t('transactionAnalytics.threeDsTrendTitle')"
                    height="320px"
                />
            </section>
            <div class="analytics-grid analytics-grid--four">
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.threeDsStatusTitle') }}</h2></header>
                    <AnalyticsChart :option="threeDsStatusOption" :loading="loading" :empty="!threeDsAnalysis?.statuses.length" :empty-text="t('transactionAnalytics.noData')" :aria-label="t('transactionAnalytics.threeDsStatusTitle')" height="286px" />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.threeDsVersionTitle') }}</h2></header>
                    <AnalyticsChart :option="threeDsVersionOption" :loading="loading" :empty="!threeDsAnalysis?.versions.length" :empty-text="t('transactionAnalytics.noData')" :aria-label="t('transactionAnalytics.threeDsVersionTitle')" height="286px" />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.threeDsLiabilityTitle') }}</h2></header>
                    <AnalyticsChart :option="threeDsLiabilityOption" :loading="loading" :empty="!threeDsAnalysis?.liabilityShifts.length" :empty-text="t('transactionAnalytics.noData')" :aria-label="t('transactionAnalytics.threeDsLiabilityTitle')" height="286px" />
                </section>
                <section class="analytics-panel">
                    <header class="analytics-panel__header"><h2>{{ t('transactionAnalytics.threeDsSourceTitle') }}</h2></header>
                    <AnalyticsChart :option="threeDsSourceOption" :loading="loading" :empty="!threeDsAnalysis?.sources.length" :empty-text="t('transactionAnalytics.noData')" :aria-label="t('transactionAnalytics.threeDsSourceTitle')" height="286px" />
                </section>
            </div>
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
    createAnalyticsChannelPerformanceOption,
    createAnalyticsChannelTrendOption,
    createAnalyticsCountOption,
    createAnalyticsDimensionOption,
    createAnalyticsDonutOption,
    createAnalyticsFailureTrendOption,
    createAnalyticsMerchantOption,
    createAnalyticsThreeDsTrendOption,
    createAnalyticsTrendOption,
    createTransactionAnalyticsRange,
    formatAnalyticsAmountValue,
    resolvePaymentLogoKeys,
    type AnalyticsChartClick,
    type PaymentLogoKey,
    type TransactionAnalyticsChannelPerformance,
    type TransactionAnalyticsDimensionMetric,
    type TransactionAnalyticsFailureAnalysis,
    type TransactionAnalyticsMerchantPerformance,
    type TransactionAnalyticsOverview,
    type TransactionAnalyticsQuery,
    type TransactionAnalyticsThreeDs,
} from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    getTransactionAnalyticsChannels,
    getTransactionAnalyticsFailures,
    getTransactionAnalyticsMerchants,
    getTransactionAnalyticsOverview,
    getTransactionAnalyticsThreeDs,
} from '@/api/transaction';
import { useUserStore } from '@/store/modules/user';
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

type AnalyticsTab = 'overview' | 'merchants' | 'failures' | 'channels' | 'threeDs';

const ANALYTICS_TABS: Array<{ name: AnalyticsTab; label: string; permission: string }> = [
    { name: 'overview', label: 'transactionAnalytics.overview', permission: 'transaction:analytics:overview' },
    { name: 'merchants', label: 'transactionAnalytics.merchants', permission: 'transaction:analytics:merchants' },
    { name: 'failures', label: 'transactionAnalytics.failures', permission: 'transaction:analytics:failures' },
    { name: 'channels', label: 'transactionAnalytics.channels', permission: 'transaction:analytics:channels' },
    { name: 'threeDs', label: 'transactionAnalytics.threeDs', permission: 'transaction:analytics:three-ds' },
];

interface PaymentToolOption {
    value: string;
    label: string;
    paymentMethod: string;
    paymentBrand?: string;
    logoKeys: PaymentLogoKey[];
}

/** 管理端交易分析主页面统一查询规范、统计口径和图表交互，不在前端执行跨币种金额合计。 */
const { t, te, locale } = useI18n();
const userStore = useUserStore();
const supportedTransactionTypes = new Set(['PAYMENT', 'AUTHORIZATION', 'PRE_AUTHORIZATION']);
const currencyOptions = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'HKD', 'SGD', 'AUD'];
const activeTab = ref<AnalyticsTab>(
    ANALYTICS_TABS.find((tab) => userStore.hasPermission(tab.permission))?.name ?? 'overview',
);
const quickPreset = ref('last7');
const dateRange = ref<string[]>(createTransactionAnalyticsRange(7, DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const loading = ref(false);
const errorMessage = ref('');
const overview = ref<TransactionAnalyticsOverview>();
const merchantPerformance = ref<TransactionAnalyticsMerchantPerformance>();
const failureAnalysis = ref<TransactionAnalyticsFailureAnalysis>();
const channelPerformance = ref<TransactionAnalyticsChannelPerformance>();
const threeDsAnalysis = ref<TransactionAnalyticsThreeDs>();
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

const availableTabs = computed(() => ANALYTICS_TABS.filter((tab) => userStore.hasPermission(tab.permission)));
const activeTabAuthorized = computed(() => availableTabs.value.some((tab) => tab.name === activeTab.value));

const quickTimeOptions = computed(() => [
    { value: 'last7', label: t('transactionAnalytics.last7Days'), days: 7 },
    { value: 'last14', label: t('transactionAnalytics.last14Days'), days: 14 },
    { value: 'last30', label: t('transactionAnalytics.last30Days'), days: 30 },
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
const generatedAt = computed(() => ({
    overview: overview.value?.generatedAt,
    merchants: merchantPerformance.value?.generatedAt,
    failures: failureAnalysis.value?.generatedAt,
    channels: channelPerformance.value?.generatedAt,
    threeDs: threeDsAnalysis.value?.generatedAt,
})[activeTab.value]);

const overviewMetrics = computed(() => {
    const data = overview.value;
    const total = analyticsNumber(data?.totalCount);
    const success = analyticsNumber(data?.successCount);
    const failed = analyticsNumber(data?.failedCount);
    const pending = analyticsNumber(data?.pendingCount);
    const processing = analyticsNumber(data?.processingCount);
    const terminal = success + failed;
    return [
        { key: 'total', label: t('transactionAnalytics.totalCount'), value: formatCount(total), hint: t('transactionAnalytics.totalHint'), tone: 'ink' },
        { key: 'success', label: t('transactionAnalytics.successCount'), value: formatCount(success), hint: ratioHint(success, total), tone: 'green' },
        { key: 'failed', label: t('transactionAnalytics.failedCount'), value: formatCount(failed), hint: ratioHint(failed, total), tone: 'red' },
        { key: 'pending', label: t('transactionAnalytics.pendingCount'), value: formatCount(pending), hint: ratioHint(pending, total), tone: 'amber' },
        { key: 'processing', label: t('transactionAnalytics.processingCount'), value: formatCount(processing), hint: ratioHint(processing, total), tone: 'blue' },
        { key: 'rate', label: t('transactionAnalytics.successRate'), value: formatRate(data?.successRate ?? 0), hint: t('transactionAnalytics.terminalCountHint', { count: formatCount(terminal) }), tone: 'ink' },
    ];
});

const translatedStatusRows = computed(() => (overview.value?.statusDistribution ?? []).map((item) => ({
    ...item,
    status: item.key,
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

const failureMetrics = computed(() => [
    { key: 'terminal', label: t('transactionAnalytics.failureTerminalCount'), value: formatCount(failureAnalysis.value?.terminalCount), hint: t('transactionAnalytics.failureTerminalHint'), tone: 'ink' },
    { key: 'failed', label: t('transactionAnalytics.failedCount'), value: formatCount(failureAnalysis.value?.failedCount), hint: t('transactionAnalytics.failureCountHint'), tone: 'red' },
    { key: 'rate', label: t('transactionAnalytics.failureRate'), value: formatRate(failureAnalysis.value?.failureRate ?? 0), hint: t('transactionAnalytics.failureRateHint'), tone: 'red' },
    { key: 'merchants', label: t('transactionAnalytics.affectedMerchants'), value: formatCount(failureAnalysis.value?.affectedMerchantCount), hint: t('transactionAnalytics.affectedMerchantsHint'), tone: 'amber' },
]);
const translatedFailureCategories = computed(() => (failureAnalysis.value?.categories ?? []).map((item) => ({
    ...item,
    key: failureCategoryLabel(item.key),
    status: item.key === 'RISK' || item.key === 'CHANNEL' ? 'FAILED' : undefined,
    successCount: 0,
    failedCount: item.totalCount,
    successRate: 0,
})));
const failureTrendOption = computed(() => createAnalyticsFailureTrendOption(
    failureAnalysis.value?.trend ?? [],
    t('transactionAnalytics.failedSeries'),
));
const failureCategoryOption = computed(() => createAnalyticsDonutOption(
    translatedFailureCategories.value,
    chartLabels.value.unknown,
    t('transactionAnalytics.failedSeries'),
));
const failureChannelOption = computed(() => createAnalyticsCountOption(
    failureAnalysis.value?.channels ?? [],
    t('transactionAnalytics.failedSeries'),
    chartLabels.value.unknown,
));

const channelMetrics = computed(() => [
    { key: 'total', label: t('transactionAnalytics.channelRequests'), value: formatCount(channelPerformance.value?.totalRequestCount), hint: t('transactionAnalytics.channelRequestsHint'), tone: 'ink' },
    { key: 'completed', label: t('transactionAnalytics.channelCompleted'), value: formatCount(channelPerformance.value?.completedRequestCount), hint: t('transactionAnalytics.channelCompletedHint'), tone: 'blue' },
    { key: 'success', label: t('transactionAnalytics.channelRequestSuccess'), value: formatCount(channelPerformance.value?.successfulRequestCount), hint: t('transactionAnalytics.channelRequestSuccessHint'), tone: 'green' },
    { key: 'failed', label: t('transactionAnalytics.channelRequestFailed'), value: formatCount(channelPerformance.value?.failedRequestCount), hint: t('transactionAnalytics.channelRequestFailedHint'), tone: 'red' },
    { key: 'timeout', label: t('transactionAnalytics.channelTimeout'), value: formatCount(channelPerformance.value?.timeoutRequestCount), hint: t('transactionAnalytics.channelTimeoutHint'), tone: 'amber' },
    { key: 'inFlight', label: t('transactionAnalytics.tableInFlight'), value: formatCount(channelPerformance.value?.inFlightRequestCount), hint: t('transactionAnalytics.channelInFlightHint'), tone: 'blue' },
    { key: 'rate', label: t('transactionAnalytics.channelRequestRate'), value: formatRate(channelPerformance.value?.requestSuccessRate ?? 0), hint: t('transactionAnalytics.channelRequestRateHint'), tone: 'green' },
    { key: 'duration', label: t('transactionAnalytics.channelAverageDuration'), value: formatMillis(channelPerformance.value?.averageDurationMillis), hint: t('transactionAnalytics.channelMaximumDurationHint', { value: formatMillis(channelPerformance.value?.maximumDurationMillis) }), tone: 'ink' },
]);
const channelTrendOption = computed(() => createAnalyticsChannelTrendOption(
    channelPerformance.value?.trend ?? [],
    {
        success: t('transactionAnalytics.successSeries'),
        failed: t('transactionAnalytics.failedSeries'),
        timeout: t('transactionAnalytics.channelTimeout'),
        inFlight: t('transactionAnalytics.processingSeries'),
        rate: t('transactionAnalytics.channelRequestRate'),
    },
));
const channelRateOption = computed(() => createAnalyticsChannelPerformanceOption(
    channelPerformance.value?.channels ?? [],
    {
        requestRate: t('transactionAnalytics.channelRequestRate'),
        transactionRate: t('transactionAnalytics.channelTransactionRate'),
    },
));
const channelResponseCodeOption = computed(() => createAnalyticsCountOption(
    channelPerformance.value?.responseCodes ?? [],
    t('transactionAnalytics.channelResponseCount'),
    chartLabels.value.unknown,
));

const threeDsMetrics = computed(() => [
    { key: 'eligible', label: t('transactionAnalytics.threeDsEligible'), value: formatCount(threeDsAnalysis.value?.eligibleCardTransactionCount), hint: t('transactionAnalytics.threeDsEligibleHint'), tone: 'ink' },
    { key: 'covered', label: t('transactionAnalytics.threeDsTransactions'), value: formatCount(threeDsAnalysis.value?.authenticationTransactionCount), hint: t('transactionAnalytics.threeDsTransactionsHint'), tone: 'blue' },
    { key: 'coverage', label: t('transactionAnalytics.threeDsCoverageRate'), value: formatRate(threeDsAnalysis.value?.coverageRate ?? 0), hint: t('transactionAnalytics.threeDsCoverageHint'), tone: 'blue' },
    { key: 'success', label: t('transactionAnalytics.threeDsAuthenticated'), value: formatCount(threeDsAnalysis.value?.authenticatedCount), hint: t('transactionAnalytics.threeDsAuthenticatedHint'), tone: 'green' },
    { key: 'failed', label: t('transactionAnalytics.threeDsFailed'), value: formatCount(threeDsAnalysis.value?.failedCount), hint: t('transactionAnalytics.threeDsFailedHint'), tone: 'red' },
    { key: 'authRate', label: t('transactionAnalytics.threeDsAuthRate'), value: formatRate(threeDsAnalysis.value?.authenticationSuccessRate ?? 0), hint: t('transactionAnalytics.threeDsAuthRateHint'), tone: 'green' },
    { key: 'paymentRate', label: t('transactionAnalytics.threeDsPaymentRate'), value: formatRate(threeDsAnalysis.value?.paymentSuccessRate ?? 0), hint: t('transactionAnalytics.threeDsPaymentRateHint'), tone: 'ink' },
    { key: 'challengeRate', label: t('transactionAnalytics.threeDsChallengeRate'), value: formatRate(threeDsAnalysis.value?.challengeRate ?? 0), hint: t('transactionAnalytics.threeDsChallengeRateHint'), tone: 'amber' },
]);
const threeDsTrendOption = computed(() => createAnalyticsThreeDsTrendOption(
    threeDsAnalysis.value?.trend ?? [],
    {
        authenticated: t('transactionAnalytics.threeDsAuthenticated'),
        failed: t('transactionAnalytics.threeDsFailed'),
        processing: t('transactionAnalytics.processingSeries'),
        rate: t('transactionAnalytics.threeDsAuthRate'),
    },
));
const threeDsStatusOption = computed(() => createAnalyticsDonutOption(
    toDimensionMetrics(threeDsAnalysis.value?.statuses),
    chartLabels.value.unknown,
    t('transactionAnalytics.threeDsTransactions'),
));
const threeDsVersionOption = computed(() => createAnalyticsCountOption(
    threeDsAnalysis.value?.versions ?? [],
    t('transactionAnalytics.threeDsTransactions'),
    chartLabels.value.unknown,
));
const threeDsLiabilityOption = computed(() => createAnalyticsDonutOption(
    toDimensionMetrics(threeDsAnalysis.value?.liabilityShifts),
    chartLabels.value.unknown,
    t('transactionAnalytics.threeDsTransactions'),
));
const threeDsSourceOption = computed(() => createAnalyticsCountOption(
    threeDsAnalysis.value?.sources ?? [],
    t('transactionAnalytics.threeDsTransactions'),
    chartLabels.value.unknown,
));

function formatCount(value: number | string | null | undefined) {
    return new Intl.NumberFormat(locale.value).format(analyticsNumber(value));
}

function formatRate(value: number | string) {
    return `${analyticsNumber(value).toFixed(2)}%`;
}

function formatMillis(value: number | string | null | undefined) {
    return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(analyticsNumber(value))} ms`;
}

function failureCategoryLabel(category: string) {
    const key = `transactionAnalytics.failureCategoryValue.${category || 'OTHER'}`;
    return te(key) ? t(key) : category || chartLabels.value.unknown;
}

function toDimensionMetrics(rows: Array<{ key: string; totalCount: number }> | undefined): TransactionAnalyticsDimensionMetric[] {
    return (rows ?? []).map((row) => ({
        ...row,
        status: row.key === 'AUTHENTICATED' || row.key === 'SHIFTED'
            ? 'SUCCESS'
            : row.key === 'FAILED' || row.key === 'NOT_SHIFTED'
                ? 'FAILED'
                : row.key === 'PROCESSING' ? 'PROCESSING' : undefined,
        successCount: 0,
        failedCount: 0,
        successRate: 0,
    }));
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
    if (!availableTabs.value.some((tab) => tab.name === activeTab.value)) return;
    const query = buildQuery();
    if (!query) return;
    const currentRequest = ++requestSequence;
    loading.value = true;
    errorMessage.value = '';
    try {
        switch (activeTab.value) {
            case 'overview':
                overview.value = await getTransactionAnalyticsOverview(query);
                break;
            case 'merchants':
                merchantPerformance.value = await getTransactionAnalyticsMerchants(query);
                break;
            case 'failures':
                failureAnalysis.value = await getTransactionAnalyticsFailures(query);
                break;
            case 'channels':
                channelPerformance.value = await getTransactionAnalyticsChannels(query);
                break;
            case 'threeDs':
                threeDsAnalysis.value = await getTransactionAnalyticsThreeDs(query);
                break;
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
    const nextTab = availableTabs.value.find((tab) => tab.name === String(name));
    if (!nextTab) return;
    activeTab.value = nextTab.name;
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
    const firstAuthorizedTab = availableTabs.value[0];
    if (!firstAuthorizedTab) return;
    activeTab.value = firstAuthorizedTab.name;
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
    grid-template-columns: repeat(6, minmax(108px, 0.68fr)) minmax(270px, 1.6fr);
    margin-bottom: 10px;
    overflow: hidden;
    border: 1px solid var(--analytics-line);
    border-radius: 6px;
    background: #fff;
}

.analytics-metric-band--merchant { grid-template-columns: minmax(240px, 360px); }
.analytics-metric-band--diagnostic { grid-template-columns: repeat(4, minmax(150px, 1fr)); }

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
.analytics-metric.is-green::before { background: #16a34a; }
.analytics-metric.is-red::before { background: #dc2626; }
.analytics-metric.is-amber::before { background: #d97706; }
.analytics-metric.is-blue::before { background: #2563eb; }
.analytics-metric > span:first-child { color: var(--analytics-muted); font-size: 11px; }
.analytics-metric > strong { margin-top: 5px; font-size: 22px; line-height: 1.15; letter-spacing: 0; }
.analytics-metric > small { min-height: 15px; margin-top: 4px; color: #98a2b3; font-size: 10px; }
.analytics-metric--amount { border-right: 0; background: #f8fbff; }

.analytics-amount-list { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 7px; }
.analytics-amount-list--compact { margin-top: 0; }

.analytics-amount-capsule {
    --analytics-amount-border: #c5d8f7;
    --analytics-amount-accent: #2563b8;
    --analytics-amount-currency-bg: #e5efff;
    --analytics-amount-surface: #fbfdff;
    --analytics-amount-count-bg: #f4f7fb;
    display: inline-grid;
    grid-template-columns: auto auto auto;
    align-items: center;
    overflow: hidden;
    min-height: 30px;
    border: 1px solid var(--analytics-amount-border);
    border-radius: 8px;
    color: #17243a;
    background: var(--analytics-amount-surface);
    box-shadow: 0 2px 7px rgb(37 99 201 / 9%);
    font-variant-numeric: tabular-nums;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
    white-space: nowrap;
}

.analytics-amount-capsule > * {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    padding: 0 9px;
    font-size: 11px;
    line-height: 28px;
}
.analytics-amount-capsule > * + * { border-left: 1px solid var(--analytics-amount-border); }
.analytics-amount-capsule b {
    min-width: 42px;
    justify-content: center;
    background: var(--analytics-amount-currency-bg);
    color: var(--analytics-amount-accent);
    font-weight: 750;
    letter-spacing: 0.02em;
}
.analytics-amount-capsule strong {
    padding-right: 10px;
    padding-left: 10px;
    background: var(--analytics-amount-surface);
    color: #17243a;
    font-size: 13px;
    font-weight: 750;
}
.analytics-amount-capsule > span {
    background: var(--analytics-amount-count-bg);
    color: #667085;
    font-weight: 600;
}

@media (hover: hover) {
    .analytics-amount-capsule:hover {
        border-color: var(--analytics-amount-accent);
        box-shadow: 0 4px 10px rgb(37 99 201 / 12%);
        transform: translateY(-1px);
    }
}

@media (prefers-reduced-motion: reduce) {
    .analytics-amount-capsule { transition: none; }
}

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
.analytics-grid--diagnostic { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.analytics-grid--four { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.metric-success { color: var(--analytics-teal); }
.metric-failed { color: var(--analytics-red); }
.analytics-panel--table :deep(.el-table) { border: 0; }
.analytics-panel--table :deep(.el-empty) { border-top: 1px solid var(--analytics-line); }
.analytics-no-permission { min-height: 360px; border: 1px solid var(--analytics-line); border-radius: 6px; background: #fff; }

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
    .analytics-grid--diagnostic,
    .analytics-grid--four { grid-template-columns: 1fr; }
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
