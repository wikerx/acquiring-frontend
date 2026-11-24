<template>
    <section class="analytics-panel channel-workbench">
        <header class="channel-workbench__header">
            <div>
                <h2>{{ t('channelAnalytics.title') }}</h2>
                <p>{{ t('channelAnalytics.scopeHint') }}</p>
            </div>
            <el-radio-group v-model="view" size="small" :aria-label="t('channelAnalytics.title')">
                <el-radio-button value="channels">{{ t('channelAnalytics.channelList') }}</el-radio-button>
                <el-radio-button value="matrix">{{ t('channelAnalytics.matrix') }}</el-radio-button>
            </el-radio-group>
        </header>

        <template v-if="view === 'channels'">
            <StandardTable
                v-loading="loading"
                table-key="transaction-analytics-channels"
                :data="channels"
                :expand-row-keys="expandedChannel ? [expandedChannel] : []"
                row-key="channelCode"
                size="small"
                @expand-change="expandChannel"
            >
                <el-table-column type="expand" width="48">
                    <template #default="{ row }">
                        <div v-if="expandedChannel === row.channelCode" v-loading="breakdownLoading" class="channel-workbench__expanded">
                            <el-alert v-if="breakdownError" :title="breakdownError" type="error" :closable="false">
                                <el-button link @click="loadBreakdown(row.channelCode)">{{ t('channelAnalytics.retry') }}</el-button>
                            </el-alert>
                            <el-table v-else :data="breakdown?.rows ?? []" size="small">
                                <el-table-column :label="t('transactionAnalytics.paymentMethod')" min-width="160">
                                    <template #default="{ row: item }">{{ paymentLabel(item) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('channelAnalytics.transactionTotals')" min-width="165" align="right">
                                    <template #default="{ row: item }">{{ outcomeCounts(item.selected.transactions) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transactionAnalytics.channelTransactionRate')" min-width="145" align="right">
                                    <template #default="{ row: item }">{{ outcomeRate(item.selected.transactions) }}</template>
                                </el-table-column>
                                <el-table-column :label="t('transactionAnalytics.channelRequestRate')" min-width="155" align="right">
                                    <template #default="{ row: item }">{{ outcomeRate(item.selected.requests) }} <small>· {{ terminalFraction(item.selected.requests) }}</small></template>
                                </el-table-column>
                                <el-table-column v-if="breakdown?.comparisonAvailable" :label="t('channelAnalytics.comparison')" min-width="220">
                                    <template #default="{ row: item }">
                                        <div>{{ t('channelAnalytics.comparisonTransactions', { rate: outcomeRate(item.comparison?.transactions), count: terminalFraction(item.comparison?.transactions) }) }}</div>
                                        <small>{{ t('channelAnalytics.comparisonRequests', { rate: outcomeRate(item.comparison?.requests), count: terminalFraction(item.comparison?.requests) }) }}</small>
                                    </template>
                                </el-table-column>
                                <el-table-column :label="t('common.actions')" width="115" align="center">
                                    <template #default="{ row: item }">
                                        <el-button link type="primary" @click="openDiagnosis(item)">{{ t('channelAnalytics.diagnose') }}</el-button>
                                    </template>
                                </el-table-column>
                            </el-table>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="channelCode" :label="t('transactionAnalytics.channelCode')" min-width="150" fixed="left" />
                <el-table-column v-for="column in countColumns" :key="column.prop" :prop="column.prop"
                    :label="t(column.label)" min-width="115" align="right">
                    <template #default="{ row }">{{ formatCount(row[column.prop]) }}</template>
                </el-table-column>
                <el-table-column prop="requestSuccessRate" :label="t('transactionAnalytics.channelRequestRate')" min-width="145" align="right">
                    <template #default="{ row }"><strong>{{ formatRate(row.requestSuccessRate, row.completedRequestCount) }}</strong></template>
                </el-table-column>
                <el-table-column prop="transactionSuccessRate" :label="t('transactionAnalytics.channelTransactionRate')" min-width="145" align="right">
                    <template #default="{ row }"><strong>{{ formatRate(row.transactionSuccessRate, row.transactionSuccessCount + row.transactionFailedCount) }}</strong></template>
                </el-table-column>
                <el-table-column prop="averageDurationMillis" :label="t('transactionAnalytics.channelAverageDuration')" min-width="135" align="right">
                    <template #default="{ row }">{{ formatMillis(row.averageDurationMillis) }}</template>
                </el-table-column>
                <el-table-column prop="maximumDurationMillis" :label="t('transactionAnalytics.channelMaximumDuration')" min-width="135" align="right">
                    <template #default="{ row }">{{ formatMillis(row.maximumDurationMillis) }}</template>
                </el-table-column>
            </StandardTable>
        </template>

        <div v-else v-loading="breakdownLoading" class="channel-workbench__matrix">
            <el-alert v-if="breakdownError" :title="breakdownError" type="error" :closable="false">
                <el-button link @click="loadBreakdown()">{{ t('channelAnalytics.retry') }}</el-button>
            </el-alert>
            <template v-else-if="matrix.rows.length">
                <el-radio-group v-model="matrixMetric" size="small" :aria-label="t('channelAnalytics.metricMode')">
                    <el-radio-button value="transactions">{{ t('transactionAnalytics.channelTransactionRate') }}</el-radio-button>
                    <el-radio-button value="requests">{{ t('transactionAnalytics.channelRequestRate') }}</el-radio-button>
                </el-radio-group>
                <p v-if="breakdown?.comparisonAvailable">{{ t('channelAnalytics.comparisonScope') }}</p>
                <div class="channel-workbench__scroll" tabindex="0" :aria-label="t('channelAnalytics.matrix')">
                    <table class="channel-matrix">
                        <thead>
                            <tr>
                                <th scope="col">{{ t('transactionAnalytics.channelCode') }}</th>
                                <th v-for="column in matrix.columns" :key="column.key" scope="col">{{ paymentLabel(column) }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in matrix.rows" :key="row.channel">
                                <th scope="row">{{ row.channel }}</th>
                                <td v-for="(cell, index) in row.cells" :key="matrix.columns[index].key">
                                    <button v-if="cell" type="button" class="channel-matrix__cell"
                                        :class="{ 'channel-matrix__cell--measured': cell.selected[matrixMetric].completedCount > 0 }"
                                        :aria-label="t('channelAnalytics.openCell', { channel: cell.channelCode, method: paymentLabel(cell) })"
                                        @click="openDiagnosis(cell)">
                                        <strong>{{ outcomeRate(cell.selected[matrixMetric]) }}</strong>
                                        <small>{{ terminalFraction(cell.selected[matrixMetric]) }}</small>
                                        <small v-if="cell.comparison">{{ t('channelAnalytics.peerCell', { rate: outcomeRate(cell.comparison[matrixMetric]), count: terminalFraction(cell.comparison[matrixMetric]) }) }}</small>
                                    </button>
                                    <span v-else class="channel-matrix__empty">—</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </template>
            <el-empty v-else-if="!breakdownLoading" :description="t('transactionAnalytics.noData')" />
        </div>
    </section>

    <el-drawer v-model="diagnosisVisible" :title="t('channelAnalytics.diagnosisTitle')" size="min(100%, 960px)" destroy-on-close
        @close="clearDiagnosis">
        <div v-if="selectedCell" class="channel-diagnosis" v-loading="diagnosisLoading">
            <div class="channel-diagnosis__scope">
                <strong>{{ selectedCell.channelCode }} · {{ paymentLabel(selectedCell) }}</strong>
                <span v-if="props.query?.merchantIds?.length">{{ props.query.merchantIds.join(', ') }}</span>
                <span>{{ props.query?.queryTimeZone }}</span>
            </div>
            <el-alert v-if="diagnosisFailed" :title="t('transactionAnalytics.loadFailed')" type="error" :closable="false">
                <el-button link @click="openDiagnosis(selectedCell)">{{ t('channelAnalytics.retry') }}</el-button>
            </el-alert>
            <template v-else>
                <section class="channel-diagnosis__panel">
                    <header class="channel-workbench__header">
                        <div>
                            <h3>{{ t('channelAnalytics.trend') }}</h3>
                            <p>{{ t('channelAnalytics.trendHint') }}</p>
                        </div>
                        <el-radio-group v-model="trendMetric" size="small" :aria-label="t('channelAnalytics.metricMode')">
                            <el-radio-button value="transactions">{{ t('transactionAnalytics.channelTransactionRate') }}</el-radio-button>
                            <el-radio-button value="requests">{{ t('transactionAnalytics.channelRequestRate') }}</el-radio-button>
                        </el-radio-group>
                    </header>
                    <AnalyticsChart :option="trendOption" :loading="diagnosisLoading" :empty="!hasTrend"
                        :empty-text="t('transactionAnalytics.noData')" :aria-label="t('channelAnalytics.trend')" height="300px" />
                </section>
                <div class="channel-diagnosis__grid">
                    <section class="channel-diagnosis__panel">
                        <h3>{{ t('channelAnalytics.failureReasons') }}</h3>
                        <el-table :data="diagnosis?.failureReasons ?? []" size="small">
                            <el-table-column :label="t('transactionAnalytics.failureCategory')" min-width="105">
                                <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
                            </el-table-column>
                            <el-table-column :label="t('channelAnalytics.reasonCode')" min-width="150">
                                <template #default="{ row }">
                                    <el-button v-if="canViewFailures" type="primary" link @click="showFailedTransactions(row.key)">{{ row.key }}</el-button>
                                    <span v-else>{{ row.key }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column :label="t('transactionAnalytics.failedCount')" min-width="75" align="right">
                                <template #default="{ row }">{{ formatCount(row.totalCount) }}</template>
                            </el-table-column>
                        </el-table>
                    </section>
                    <section class="channel-diagnosis__panel">
                        <h3>{{ t('channelAnalytics.failedResponseCodes') }}</h3>
                        <el-table :data="diagnosis?.responseCodes ?? []" size="small">
                            <el-table-column prop="key" :label="t('channelAnalytics.responseCode')" min-width="120" />
                            <el-table-column :label="t('transactionAnalytics.channelRequestFailed')" min-width="100" align="right">
                                <template #default="{ row }">{{ formatCount(row.totalCount) }}</template>
                            </el-table-column>
                        </el-table>
                    </section>
                </div>

                <section v-if="canViewFailures" class="channel-diagnosis__panel">
                    <header class="channel-workbench__header">
                        <h3>{{ t('channelAnalytics.failedTransactions') }}</h3>
                        <el-button v-if="!failuresVisible || reasonCode" size="small" @click="showFailedTransactions()">
                            {{ t('channelAnalytics.viewAllFailures') }}
                        </el-button>
                    </header>
                    <template v-if="failuresVisible">
                        <el-tag v-if="reasonCode" closable @close="showFailedTransactions()">{{ reasonCode }}</el-tag>
                        <el-alert v-if="failuresFailed" :title="t('transactionAnalytics.loadFailed')" type="error" :closable="false">
                            <el-button link @click="loadFailures">{{ t('channelAnalytics.retry') }}</el-button>
                        </el-alert>
                        <el-table v-else v-loading="failuresLoading" :data="failurePage?.records ?? []" size="small">
                            <el-table-column prop="transactionId" :label="t('channelAnalytics.transactionId')" min-width="190" />
                            <el-table-column prop="merchantId" :label="t('transactionAnalytics.merchantId')" min-width="100" />
                            <el-table-column prop="merchantOrderNo" :label="t('channelAnalytics.merchantOrderNo')" min-width="180" show-overflow-tooltip />
                            <el-table-column :label="t('channelAnalytics.transactionTime')" min-width="175">
                                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" :source-time-zone="storageZone" :display-time-zone="props.query?.queryTimeZone" /></template>
                            </el-table-column>
                            <el-table-column v-if="canOpenTransaction || canOpenTrace" :label="t('common.actions')" min-width="132">
                                <template #default="{ row }">
                                    <el-button v-if="canOpenTransaction" link type="primary" @click="openTransaction(row)">{{ t('common.detail') }}</el-button>
                                    <el-button v-if="canOpenTrace" link type="primary" @click="openTrace(row)">{{ t('channelAnalytics.trace') }}</el-button>
                                </template>
                            </el-table-column>
                        </el-table>
                        <el-pagination v-if="(failurePage?.total ?? 0) > pageSize" v-model:current-page="pageNo"
                            :page-size="pageSize" :total="failurePage?.total ?? 0" layout="total, prev, pager, next"
                            @current-change="loadFailures" />
                    </template>
                </section>
            </template>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { isAxiosError } from 'axios';
import { AnalyticsChart, analyticsNumber, useTransactionAnalyticsQuery, type PageResult, type TransactionAnalyticsChannelMetric } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE } from '@/views/transaction/shared';
import {
    getChannelBreakdown,
    getChannelDiagnosis,
    getChannelFailedTransactions,
    type ChannelAnalyticsQuery,
    type ChannelBreakdown,
    type ChannelDiagnosis,
    type ChannelDiagnosisQuery,
    type ChannelFailedTransaction,
    type ChannelOutcome,
    type ChannelPaymentMetric,
} from '@/api/transaction/channelAnalytics';

const props = defineProps<{ query?: ChannelAnalyticsQuery; channels: TransactionAnalyticsChannelMetric[]; loading: boolean }>();
const { t, te, locale } = useI18n();
const router = useRouter();
const userStore = useUserStore();
const storageZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
const view = ref<'channels' | 'matrix'>('channels');
const matrixMetric = ref<'transactions' | 'requests'>('transactions');
const trendMetric = ref<'transactions' | 'requests'>('transactions');
const expandedChannel = ref('');
const breakdown = shallowRef<ChannelBreakdown>();
const breakdownForbidden = ref(false);
const diagnosisVisible = ref(false);
const selectedCell = shallowRef<ChannelPaymentMetric>();
const diagnosis = shallowRef<ChannelDiagnosis>();
const failuresVisible = ref(false);
const reasonCode = ref<string>();
const failurePage = shallowRef<PageResult<ChannelFailedTransaction>>();
const pageNo = ref(1);
const pageSize = 10;
const { loading: breakdownLoading, failed: breakdownFailed, run: runBreakdown, invalidate: invalidateBreakdown } = useTransactionAnalyticsQuery();
const breakdownError = computed(() => {
    if (breakdownForbidden.value) return t('channelAnalytics.breakdownForbidden');
    return breakdownFailed.value ? t('transactionAnalytics.loadFailed') : '';
});
const { loading: diagnosisLoading, failed: diagnosisFailed, run: runDiagnosis, invalidate: invalidateDiagnosis } = useTransactionAnalyticsQuery();
const { loading: failuresLoading, failed: failuresFailed, run: runFailures, invalidate: invalidateFailures } = useTransactionAnalyticsQuery();
const canViewFailures = computed(() => userStore.hasPermission('transaction:operation:list'));
const canOpenTransaction = computed(() => canViewFailures.value && userStore.hasPermission('transaction:operation:detail'));
const canOpenTrace = computed(() => userStore.hasPermission('system:monitor:trace:query'));

const countColumns = [
    { prop: 'transactionCount', label: 'channelAnalytics.transactionCount' },
    { prop: 'transactionSuccessCount', label: 'channelAnalytics.transactionSuccessCount' },
    { prop: 'transactionFailedCount', label: 'channelAnalytics.transactionFailedCount' },
    { prop: 'totalRequestCount', label: 'transactionAnalytics.channelRequests' },
    { prop: 'successfulRequestCount', label: 'transactionAnalytics.channelRequestSuccess' },
    { prop: 'failedRequestCount', label: 'transactionAnalytics.channelRequestFailed' },
    { prop: 'timeoutRequestCount', label: 'transactionAnalytics.channelTimeout' },
    { prop: 'inFlightRequestCount', label: 'transactionAnalytics.tableInFlight' },
] as const;

const matrix = computed(() => {
    const columns = new Map<string, { key: string; paymentMethod: string; paymentBrand: string }>();
    const channels = new Map<string, Map<string, ChannelPaymentMetric>>();
    for (const cell of breakdown.value?.rows ?? []) {
        const key = JSON.stringify([cell.paymentMethod, cell.paymentBrand]);
        columns.set(key, { key, paymentMethod: cell.paymentMethod, paymentBrand: cell.paymentBrand });
        const row = channels.get(cell.channelCode) ?? new Map<string, ChannelPaymentMetric>();
        row.set(key, cell);
        channels.set(cell.channelCode, row);
    }
    const orderedColumns = [...columns.values()].sort((left, right) => paymentLabel(left).localeCompare(paymentLabel(right), locale.value));
    return {
        columns: orderedColumns,
        rows: [...channels].map(([channel, cells]) => ({ channel, cells: orderedColumns.map(({ key }) => cells.get(key)) })),
    };
});

const hasTrend = computed(() => diagnosis.value?.trend.some((day) =>
    day.selected[trendMetric.value].totalCount || day.comparison?.[trendMetric.value].totalCount));
const trendOption = computed(() => {
    const days = diagnosis.value?.trend ?? [];
    const metric = trendMetric.value;
    const rate = t(metric === 'transactions' ? 'transactionAnalytics.channelTransactionRate' : 'transactionAnalytics.channelRequestRate');
    const volume = t(metric === 'transactions' ? 'channelAnalytics.transactionCount' : 'transactionAnalytics.channelRequests');
    const shownRate = (value?: ChannelOutcome) => value?.successRate == null ? null : analyticsNumber(value.successRate);
    return {
        tooltip: { trigger: 'axis' },
        legend: { top: 4 },
        grid: { top: 60, bottom: 25, left: 50, right: 45, containLabel: true },
        xAxis: { type: 'category', data: days.map((day) => day.date), boundaryGap: true },
        yAxis: [
            { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
            { type: 'value', minInterval: 1, splitLine: { show: false } },
        ],
        series: [
            { type: 'bar', name: volume, yAxisIndex: 1, barMaxWidth: 26, data: days.map((day) => day.selected[metric].totalCount) },
            { type: 'line', name: rate, data: days.map((day) => shownRate(day.selected[metric])) },
            ...(selectedCell.value?.comparison ? [
                { type: 'line', name: t('channelAnalytics.comparisonRate'), lineStyle: { type: 'dashed' },
                    data: days.map((day) => shownRate(day.comparison?.[metric])) },
            ] : []),
        ],
    };
});

function paymentLabel(row: Pick<ChannelPaymentMetric, 'paymentMethod' | 'paymentBrand'>) {
    if (row.paymentMethod === 'UNKNOWN') return t('channelAnalytics.unknownPayment');
    const key = `transaction.paymentMethod.${row.paymentMethod}`;
    const method = te(key) ? t(key) : row.paymentMethod;
    return row.paymentBrand ? `${method} · ${row.paymentBrand}` : method;
}

function categoryLabel(category: string) {
    const key = `transactionAnalytics.failureCategoryValue.${category}`;
    return te(key) ? t(key) : category;
}

function formatCount(value?: number) {
    return new Intl.NumberFormat(locale.value).format(value ?? 0);
}

function formatRate(value: string | number | null | undefined, completed?: number) {
    if (value == null || completed === 0) return '—';
    return `${new Intl.NumberFormat(locale.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(analyticsNumber(value))}%`;
}

function formatMillis(value?: string | number) {
    return `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 2 }).format(analyticsNumber(value))} ms`;
}

function outcomeRate(outcome?: ChannelOutcome) {
    return formatRate(outcome?.successRate, outcome?.completedCount);
}

function terminalFraction(outcome?: ChannelOutcome) {
    return outcome ? `${formatCount(outcome.successCount)} / ${formatCount(outcome.completedCount)}` : '—';
}

function outcomeCounts(outcome: ChannelOutcome) {
    return `${formatCount(outcome.totalCount)} / ${formatCount(outcome.successCount)} / ${formatCount(outcome.failedCount)}`;
}

function loadBreakdown(channelCode?: string) {
    if (!props.query) return;
    const query = { ...props.query, channelCode: channelCode ?? props.query.channelCode };
    breakdown.value = undefined;
    breakdownForbidden.value = false;
    return runBreakdown(JSON.stringify(query), async () => {
        try {
            const result = await getChannelBreakdown(query);
            return () => { breakdown.value = result; };
        } catch (error) {
            if (isAxiosError(error) && error.response?.status === 403) {
                return () => { breakdownForbidden.value = true; };
            }
            throw error;
        }
    });
}

function expandChannel(row: TransactionAnalyticsChannelMetric, expanded: TransactionAnalyticsChannelMetric[]) {
    if (expanded.some((item) => item.channelCode === row.channelCode)) {
        expandedChannel.value = row.channelCode;
        void loadBreakdown(row.channelCode);
    } else if (expandedChannel.value === row.channelCode) {
        expandedChannel.value = '';
        invalidateBreakdown();
        breakdown.value = undefined;
    }
}

watch([() => props.query, view], () => {
    expandedChannel.value = '';
    breakdown.value = undefined;
    breakdownForbidden.value = false;
    invalidateBreakdown();
    diagnosisVisible.value = false;
    clearDiagnosis();
    if (view.value === 'matrix') void loadBreakdown();
});

function cellQuery(): ChannelDiagnosisQuery | undefined {
    const cell = selectedCell.value;
    if (!props.query || !cell) return undefined;
    return { ...props.query, channelCode: cell.channelCode, groupPaymentMethod: cell.paymentMethod, groupPaymentBrand: cell.paymentBrand };
}

function openDiagnosis(cell: ChannelPaymentMetric) {
    clearDiagnosis();
    selectedCell.value = cell;
    trendMetric.value = matrixMetric.value;
    diagnosisVisible.value = true;
    const query = cellQuery();
    if (!query) return;
    return runDiagnosis(JSON.stringify(query), async () => {
        const result = await getChannelDiagnosis(query);
        return () => { diagnosis.value = result; };
    });
}

function clearDiagnosis() {
    invalidateDiagnosis();
    invalidateFailures();
    diagnosis.value = undefined;
    selectedCell.value = undefined;
    failuresVisible.value = false;
    reasonCode.value = undefined;
    failurePage.value = undefined;
    pageNo.value = 1;
}

function showFailedTransactions(reason?: string) {
    reasonCode.value = reason;
    pageNo.value = 1;
    failuresVisible.value = true;
    void loadFailures();
}

function loadFailures() {
    const base = cellQuery();
    if (!base || !canViewFailures.value) return;
    const query = { ...base, pageNo: pageNo.value, pageSize, reasonCode: reasonCode.value };
    failurePage.value = undefined;
    return runFailures(JSON.stringify(query), async () => {
        const result = await getChannelFailedTransactions(query);
        return () => { failurePage.value = result; };
    });
}

function openTransaction(row: ChannelFailedTransaction) {
    void router.push({ path: '/transaction/operation', query: {
        transactionId: row.transactionId,
        transactionDateTime: row.transactionDateTime,
        transactionTimeZone: storageZone,
    } });
}

function openTrace(row: ChannelFailedTransaction) {
    void router.push({ path: '/monitor/trace', query: {
        transactionId: row.transactionId,
        transactionDateTime: row.transactionDateTime,
        transactionTimeZone: storageZone,
    } });
}
</script>

<style scoped>
.channel-workbench,
.channel-diagnosis__panel {
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
}

.channel-workbench__header,
.channel-diagnosis__scope {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-bottom: 12px;
}

.channel-workbench__header h2,
.channel-diagnosis__panel h3 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 600;
}

.channel-workbench__header p,
.channel-workbench__matrix p,
.channel-workbench__expanded small,
.channel-diagnosis__scope span {
    margin: 5px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.channel-workbench__expanded {
    min-height: 70px;
    padding: 12px 20px;
}

.channel-workbench__matrix {
    min-height: 88px;
}

.channel-workbench__scroll {
    overflow: auto;
    margin-top: 12px;
}

.channel-matrix {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
}

.channel-matrix th,
.channel-matrix td {
    padding: 6px;
    border-right: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    text-align: center;
}

.channel-matrix th {
    min-width: 122px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
}

.channel-matrix th:first-child {
    position: sticky;
    left: 0;
    z-index: 1;
}

.channel-matrix__cell {
    display: grid;
    gap: 3px;
    width: 100%;
    min-height: 62px;
    padding: 6px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-regular);
    cursor: pointer;
}

.channel-matrix__cell--measured {
    border-color: var(--el-color-primary-light-7);
    background: var(--el-color-primary-light-9);
}

.channel-matrix__cell:hover,
.channel-matrix__cell:focus-visible {
    border-color: var(--el-color-primary);
}

.channel-matrix__cell small,
.channel-matrix__empty {
    color: var(--el-text-color-secondary);
}

.channel-diagnosis {
    display: grid;
    gap: 14px;
}

.channel-diagnosis__scope {
    justify-content: flex-start;
    margin: 0;
}

.channel-diagnosis__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
    gap: 14px;
}

.channel-diagnosis__panel > h3,
.channel-diagnosis__panel > .el-tag {
    margin-bottom: 10px;
}

.channel-diagnosis__panel .el-pagination {
    justify-content: flex-end;
    margin-top: 12px;
}
</style>
