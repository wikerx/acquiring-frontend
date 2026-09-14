<template>
    <div class="app-container monitor-trace-page">
        <MonitorPageHeader :title="t('monitor.workbench.trace.title')" :description="t('monitor.workbench.trace.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form :model="query" :inline="true" size="small" class="search-form" label-width="112px">
            <el-form-item :label="t('monitor.workbench.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.channelOrderNo')">
                <el-input v-model.trim="query.channelOrderNo" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.traceId')">
                <el-input v-model.trim="query.traceId" clearable :placeholder="t('common.pleaseInput')" @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" :loading="loading" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <MonitorCapabilityAlert :capability="response?.apmCapability" :title="t('monitor.workbench.trace.capabilityTitle')" />
        <MonitorMetricGrid v-if="response?.summary" :items="summaryCards" />

        <MonitorChartGrid page-definition-id="trace" class="monitor-trace-page__chart">
            <MonitorChartPanel definition-id="trace.waterfall" :dataset="waterfallDataset" :state="waterfallState" @retry="handleSearch" @item-click="selectWaterfallEvent" />
        </MonitorChartGrid>

        <section v-if="response?.summary" class="monitor-trace-page__summary">
            <div class="monitor-trace-page__section-header">
                <div>
                    <h2>{{ t('monitor.workbench.trace.basicInfo') }}</h2>
                    <p>{{ t('monitor.workbench.trace.basicInfoDescription') }}</p>
                </div>
            </div>
            <el-descriptions :column="3" border size="small">
                <el-descriptions-item :label="t('monitor.workbench.fields.transactionId')">{{ response.summary.transactionId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.rootTransactionId')">{{ response.summary.rootTransactionId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.operationId')">{{ response.summary.operationId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.merchantId')">{{ response.summary.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.merchantOrderNo')">{{ response.summary.merchantOrderNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.transactionType')">{{ response.summary.transactionType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')">
                    <el-tag size="small" :type="monitorTagType(response.summary.transactionStatus)">{{ statusText(response.summary.transactionStatus) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.amount')">{{ traceAmount }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.paymentMethod')">{{ response.summary.paymentMethod || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.channelCode')">{{ response.summary.channelCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.channelOrderNo')">{{ response.summary.channelOrderNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.totalDuration')">{{ formatDuration(response.summary.totalDurationMillis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.createTime')"><BaseDateTime :value="response.summary.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.completeTime')"><BaseDateTime :value="response.summary.completeTime" /></el-descriptions-item>
            </el-descriptions>
        </section>

        <section v-if="response" class="monitor-trace-page__timeline">
            <div class="monitor-trace-page__section-header">
                <div>
                    <h2>{{ t('monitor.workbench.trace.timeline') }}</h2>
                    <p>{{ t('monitor.workbench.trace.timelineDescription') }}</p>
                </div>
                <span>{{ t('monitor.workbench.trace.eventCount', { count: response.events.length }) }}</span>
            </div>
            <el-timeline v-if="response.events.length">
                <el-timeline-item
                    v-for="event in response.events"
                    :key="event.eventId"
                    :timestamp="event.startTime || '-'"
                    placement="top"
                    :type="monitorTagType(event.result)"
                >
                    <button type="button" class="monitor-trace-page__event" @click="openEvent(event)">
                        <span class="monitor-trace-page__event-heading">
                            <strong>{{ event.serviceName || '-' }}</strong>
                            <el-tag size="small" :type="monitorTagType(event.result)">{{ statusText(event.result) }}</el-tag>
                            <span>{{ formatDuration(event.durationMillis, String(locale)) }}</span>
                        </span>
                        <span class="monitor-trace-page__event-name">{{ event.eventName || event.eventType || '-' }}</span>
                        <span v-if="event.errorCode || event.errorMessage" class="monitor-trace-page__event-error">
                            {{ [event.errorCode, event.errorMessage].filter(Boolean).join(' · ') }}
                        </span>
                    </button>
                </el-timeline-item>
            </el-timeline>
            <el-empty v-else :description="t('monitor.workbench.trace.noEvents')" />
        </section>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.trace.eventDetail')" size="md">
            <el-descriptions v-if="activeEvent" :column="1" border size="small">
                <el-descriptions-item :label="t('monitor.workbench.fields.eventId')">{{ activeEvent.eventId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.traceId')">{{ activeEvent.traceId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.transactionId')">{{ activeEvent.transactionId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.service')">{{ activeEvent.serviceName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.eventType')">{{ activeEvent.eventType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.eventName')">{{ activeEvent.eventName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.result')"><el-tag size="small" :type="monitorTagType(activeEvent.result)">{{ statusText(activeEvent.result) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.startTime')"><BaseDateTime :value="activeEvent.startTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.endTime')"><BaseDateTime :value="activeEvent.endTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.duration')">{{ formatDuration(activeEvent.durationMillis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.errorCode')">{{ activeEvent.errorCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.errorMessage')">{{ activeEvent.errorMessage || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.businessRemark')">{{ activeEvent.businessRemark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
/** 交易链路主页面：按业务标识定位单笔交易并展示脱敏事件与阶段瀑布图。 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorTimeRangeSelector, type MonitorChartClickEvent, type MonitorTimeRangeValue } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { searchMonitorTrace, type TraceEvent, type TraceResponse } from '@/api/monitor/workbench';
import { createMonitorTimeRange, createTraceWaterfallDataset, formatDuration, monitorLoadState, monitorTagType, toMonitorTimeRangeQuery } from '@/api/monitor/workbenchAdapters';

const { locale, t } = useI18n();
const route = useRoute();
const timeRange = ref(createMonitorTimeRange());
const loading = ref(false);
const errorMessage = ref('');
const response = ref<TraceResponse>();
const query = reactive({ transactionId: '', merchantOrderNo: '', channelOrderNo: '', traceId: '' });
const detailVisible = ref(false);
const activeEvent = ref<TraceEvent>();

const waterfallDataset = computed(() => createTraceWaterfallDataset(response.value?.waterfall || []));
const waterfallState = computed(() => monitorLoadState({
    loading: loading.value,
    error: errorMessage.value,
    hasResponse: Boolean(response.value),
    hasData: waterfallDataset.value.stages.length > 0,
    emptyDescription: response.value
        ? t('monitor.workbench.trace.noEvents')
        : t('monitor.workbench.trace.searchHint'),
}));
const summaryCards = computed(() => {
    const summary = response.value?.summary;
    if (!summary) return [];
    return [
        { key: 'status', label: t('common.status'), value: statusText(summary.transactionStatus), status: summary.transactionStatus },
        { key: 'amount', label: t('monitor.workbench.fields.amount'), value: traceAmount.value },
        { key: 'duration', label: t('monitor.workbench.fields.totalDuration'), value: formatDuration(summary.totalDurationMillis, String(locale.value)) },
        { key: 'events', label: t('monitor.workbench.fields.events'), value: String(response.value?.events.length || 0) },
    ];
});
const traceAmount = computed(() => {
    const summary = response.value?.summary;
    if (!summary || summary.amount === null || summary.amount === undefined) return '-';
    return [summary.currency, summary.amount].filter(Boolean).join(' ');
});

onMounted(async () => {
    assignRouteQuery();
    if (hasIdentifier()) await handleSearch();
});

async function handleSearch() {
    if (!hasIdentifier()) {
        ElMessage.warning(t('monitor.workbench.trace.identifierRequired'));
        return;
    }
    loading.value = true;
    errorMessage.value = '';
    try {
        response.value = await searchMonitorTrace({
            ...toMonitorTimeRangeQuery(timeRange.value),
            transactionId: query.transactionId || undefined,
            merchantOrderNo: query.merchantOrderNo || undefined,
            channelOrderNo: query.channelOrderNo || undefined,
            traceId: query.traceId || undefined,
        });
    } catch (error) {
        response.value = undefined;
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function resetQuery() {
    Object.assign(query, { transactionId: '', merchantOrderNo: '', channelOrderNo: '', traceId: '' });
    response.value = undefined;
    errorMessage.value = '';
}

function handleRangeChange(value: MonitorTimeRangeValue) {
    timeRange.value = value;
    if (hasIdentifier()) handleSearch();
}

function hasIdentifier() {
    return Object.values(query).some((value) => value.trim().length > 0);
}

function assignRouteQuery() {
    for (const key of Object.keys(query) as Array<keyof typeof query>) {
        const value = route.query[key];
        query[key] = Array.isArray(value) ? String(value[0] || '') : String(value || '');
    }
}

function statusText(value?: string) {
    return t(`monitor.workbench.status.${String(value || 'unknown').toLowerCase()}`, value || '-');
}

function openEvent(event: TraceEvent) {
    activeEvent.value = event;
    detailVisible.value = true;
}

function selectWaterfallEvent(event: MonitorChartClickEvent) {
    const matched = response.value?.events.find((item) => item.eventId === event.dimensionKey);
    if (matched) openEvent(matched);
}
</script>

<style scoped>
.monitor-trace-page__chart,
.monitor-trace-page__summary { margin-bottom: 16px; }
.search-form :deep(.el-input) { width: 210px; }
.monitor-trace-page__summary,
.monitor-trace-page__timeline { padding: 16px 20px; border: 1px solid var(--el-border-color-lighter); border-radius: 8px; background: var(--el-bg-color); }
.monitor-trace-page__section-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; color: var(--el-text-color-secondary); font-size: 12px; }
.monitor-trace-page__section-header h2 { margin: 0; color: var(--el-text-color-primary); font-size: 15px; line-height: 22px; }
.monitor-trace-page__section-header p { margin: 2px 0 0; line-height: 18px; }
.monitor-trace-page__event { display: grid; width: 100%; padding: 12px 14px; border: 1px solid var(--el-border-color-lighter); border-radius: 6px; background: var(--el-bg-color); color: inherit; text-align: left; cursor: pointer; }
.monitor-trace-page__event:hover { border-color: var(--el-color-primary-light-5); background: var(--el-color-primary-light-9); }
.monitor-trace-page__event-heading { display: flex; align-items: center; gap: 10px; color: var(--el-text-color-secondary); font-size: 12px; }
.monitor-trace-page__event-heading strong { margin-right: auto; color: var(--el-text-color-primary); font-size: 14px; }
.monitor-trace-page__event-name { margin-top: 5px; color: var(--el-text-color-regular); font-size: 13px; }
.monitor-trace-page__event-error { margin-top: 5px; color: var(--el-color-danger); font-size: 12px; }
@media (max-width: 900px) {
    .search-form { display: flex; flex-direction: column; }
    .search-form :deep(.el-form-item) { display: flex; width: 100%; margin-right: 0; }
    .search-form :deep(.el-form-item__label) { flex: 0 0 96px; width: 96px !important; padding-right: 10px; }
    .search-form :deep(.el-form-item__content) { flex: 1; min-width: 0; }
    .search-form :deep(.el-input) { width: 100%; }
    .monitor-trace-page :deep(.el-descriptions__body .el-descriptions__table) { table-layout: auto; }
    .monitor-trace-page__event-heading { align-items: flex-start; flex-wrap: wrap; }
}
</style>
