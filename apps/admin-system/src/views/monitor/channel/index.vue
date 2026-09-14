<template>
    <div class="app-container monitor-workbench-page">
        <MonitorPageHeader :title="t('monitor.workbench.channel.title')" :description="t('monitor.workbench.channel.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('monitor.workbench.fields.channelCode')"><el-input v-model.trim="query.channelCode" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.requestScene')"><el-input v-model.trim="query.requestScene" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.currency')"><el-input v-model.trim="query.currency" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.paymentMethod')"><el-input v-model.trim="query.paymentMethod" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.errorCode')"><el-input v-model.trim="query.errorCode" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" clearable :placeholder="t('common.pleaseSelect')" style="width: 150px">
                    <el-option :label="t('monitor.workbench.status.success')" value="SUCCESS" />
                    <el-option :label="t('monitor.workbench.status.failed')" value="FAILED" />
                    <el-option :label="t('monitor.workbench.status.processing')" value="PROCESSING" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <MonitorMetricGrid :items="summaryCards" />

        <MonitorChartGrid page-definition-id="channel" class="monitor-workbench-page__charts">
            <MonitorChartPanel definition-id="channel.successRate" :dataset="successDataset" :state="successState" @retry="loadData" />
            <MonitorChartPanel definition-id="channel.latency" :dataset="latencyDataset" :state="latencyState" @retry="loadData" />
            <MonitorChartPanel definition-id="channel.errorTop" :dataset="errorDataset" :state="errorState" @retry="loadData" @item-click="filterErrorCode" />
            <MonitorChartPanel definition-id="channel.paymentMethodRate" :dataset="paymentMethodDataset" :state="paymentMethodState" @retry="loadData" @item-click="filterPaymentMethod" />
        </MonitorChartGrid>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-channel-health-main" v-loading="loading" :data="response?.page.records || []" row-key="channelCode" size="small">
            <el-table-column prop="channelCode" :label="t('monitor.workbench.fields.channelCode')" min-width="140" fixed="left" />
            <el-table-column :label="t('common.status')" width="110" align="center">
                <template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.status)">{{ statusText(row.status) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="requestCount" :label="t('monitor.workbench.fields.requests')" width="110" align="center" />
            <el-table-column :label="t('monitor.workbench.fields.successRate')" width="112" align="center"><template #default="{ row }">{{ formatPercent(row.successRate) }}</template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.average')" width="110" align="center"><template #default="{ row }">{{ formatDuration(row.averageMillis, String(locale)) }}</template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.p95')" width="110" align="center"><template #default="{ row }">{{ formatDuration(row.p95Millis, String(locale)) }}</template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.p99')" width="110" align="center"><template #default="{ row }">{{ formatDuration(row.p99Millis, String(locale)) }}</template></el-table-column>
            <el-table-column prop="timeoutCount" :label="t('monitor.workbench.fields.timeoutCount')" width="105" align="center" />
            <el-table-column prop="continuousFailureCount" :label="t('monitor.workbench.fields.continuousFailures')" width="118" align="center" />
            <el-table-column prop="latestError" :label="t('monitor.workbench.fields.latestError')" min-width="220" show-overflow-tooltip />
            <el-table-column :label="t('monitor.workbench.fields.latestFailureTime')" min-width="172" align="center"><template #default="{ row }"><BaseDateTime :value="row.latestFailureTime" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="100" align="center" fixed="right"><template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="(response?.page.total || 0) > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="response?.page.total || 0" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.channel.detailTitle')" size="md">
            <el-descriptions v-if="detail" :column="2" border size="small">
                <el-descriptions-item :label="t('monitor.workbench.fields.channelCode')">{{ detail.channelCode }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.status')"><el-tag size="small" :type="monitorTagType(detail.status)">{{ statusText(detail.status) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.requests')">{{ formatCount(detail.requestCount, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.successRate')">{{ formatPercent(detail.successRate) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.average')">{{ formatDuration(detail.averageMillis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.p95')">{{ formatDuration(detail.p95Millis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.p99')">{{ formatDuration(detail.p99Millis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.timeoutCount')">{{ detail.timeoutCount }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.continuousFailures')">{{ detail.continuousFailureCount }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.latestFailureTime')"><BaseDateTime :value="detail.latestFailureTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.latestError')" :span="2">{{ detail.latestError || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
/** 渠道健康监控主页面：展示成功率、延迟、错误原因和支付方式聚合。 */
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorTimeRangeSelector, type MonitorChartClickEvent } from '@/components/MonitorChart';
import { MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { searchMonitorChannels, type ChannelAggregateItem, type ChannelMonitorResponse } from '@/api/monitor/workbench';
import {
    createChannelErrorDataset,
    createChannelLatencyDataset,
    createChannelPaymentMethodDataset,
    createChannelSuccessRateDataset,
    createMonitorTimeRange,
    formatCount,
    formatDuration,
    formatMetricValue,
    formatPercent,
    hasDatasetValues,
    hasPositiveMetric,
    monitorLoadState,
    monitorTagType,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

const { locale, t } = useI18n();
const timeRange = ref(createMonitorTimeRange());
const showSearch = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const response = ref<ChannelMonitorResponse>();
const page = ref(1);
const pageSize = ref(10);
const query = reactive({
    channelCode: '',
    requestScene: '',
    currency: '',
    paymentMethod: '',
    errorCode: '',
    status: '',
});
const detailVisible = ref(false);
const detail = ref<ChannelAggregateItem>();

const successDataset = computed(() => createChannelSuccessRateDataset(response.value?.successRateTrend || [], t));
const latencyDataset = computed(() => createChannelLatencyDataset(response.value?.latencyTrend || [], t));
const errorDataset = computed(() => createChannelErrorDataset(response.value?.errorTop || []));
const paymentMethodDataset = computed(() => createChannelPaymentMethodDataset(response.value?.paymentMethodRate || [], t));
const successState = computed(() => state(hasDatasetValues(successDataset.value)));
const latencyState = computed(() => state(hasDatasetValues(latencyDataset.value)));
const errorState = computed(() => state(errorDataset.value.values.length > 0));
const paymentMethodState = computed(() => state(paymentMethodDataset.value.categories.length > 0));
const summaryCards = computed(() => (response.value?.summaries || []).map((item) => ({
    key: item.key,
    label: t(`monitor.workbench.metric.${item.key}`, item.label || item.key),
    value: formatMetricValue(item, String(locale.value)),
    status: item.status,
    description: item.description,
})));

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        response.value = await searchMonitorChannels({
            ...toMonitorTimeRangeQuery(timeRange.value),
            pageNo: page.value,
            pageSize: pageSize.value,
            channelCode: query.channelCode || undefined,
            requestScene: query.requestScene || undefined,
            currency: query.currency || undefined,
            paymentMethod: query.paymentMethod || undefined,
            errorCode: query.errorCode || undefined,
            status: query.status || undefined,
        });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() {
    Object.assign(query, {
        channelCode: '',
        requestScene: '',
        currency: '',
        paymentMethod: '',
        errorCode: '',
        status: '',
    });
    handleSearch();
}
function handleRangeChange(value: typeof timeRange.value) { timeRange.value = value; handleSearch(); }
function filterErrorCode(event: MonitorChartClickEvent) {
    if (!event.dimensionKey) return;
    query.errorCode = event.dimensionKey;
    handleSearch();
}
function filterPaymentMethod(event: MonitorChartClickEvent) {
    if (!event.dimensionKey) return;
    query.paymentMethod = event.dimensionKey;
    handleSearch();
}
function openDetail(row: ChannelAggregateItem) { detail.value = row; detailVisible.value = true; }
function statusText(value?: string) { return t(`monitor.workbench.status.${String(value || 'unknown').toLowerCase()}`, value || '-'); }
function state(hasData: boolean) {
    return monitorLoadState({
        loading: loading.value,
        error: errorMessage.value,
        hasResponse: Boolean(response.value),
        hasData: hasPositiveMetric(response.value?.summaries, 'channels') && hasData,
    });
}
</script>

<style scoped>
.monitor-workbench-page__charts { margin-bottom: 16px; }
.search-form :deep(.el-input) { width: 190px; }
</style>
