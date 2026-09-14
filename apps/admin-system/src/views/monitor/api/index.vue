<template>
    <div class="app-container monitor-workbench-page">
        <MonitorPageHeader :title="t('monitor.workbench.api.title')" :description="t('monitor.workbench.api.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('monitor.workbench.fields.service')">
                <el-input v-model.trim="query.serviceName" :placeholder="t('monitor.workbench.api.servicePlaceholder')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.apiOperation')">
                <el-input v-model.trim="query.apiOperation" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.apiPath')">
                <el-input v-model.trim="query.apiPath" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.merchantId')">
                <el-input v-model.trim="query.merchantId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.responseCode')">
                <el-input v-model.trim="query.responseCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.result')">
                <el-select v-model="query.result" :placeholder="t('common.pleaseSelect')" clearable style="width: 150px">
                    <el-option :label="t('monitor.workbench.status.success')" value="SUCCESS" />
                    <el-option :label="t('monitor.workbench.status.failed')" value="FAILED" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <MonitorCapabilityAlert :capability="response?.httpMetricCapability" :title="t('monitor.workbench.api.capabilityTitle')" />
        <MonitorMetricGrid :items="summaryCards" />

        <MonitorChartGrid page-definition-id="api" class="monitor-workbench-page__charts">
            <MonitorChartPanel definition-id="api.requestTrend" :dataset="requestDataset" :state="requestState" @retry="loadData" />
            <MonitorChartPanel definition-id="api.latency" :dataset="latencyDataset" :state="latencyState" @retry="loadData" />
            <MonitorChartPanel definition-id="api.failureRate" :dataset="failureRateDataset" :state="requestState" @retry="loadData" />
            <MonitorChartPanel definition-id="api.httpErrorTop" :dataset="responseCodeDataset" :state="responseCodeState" @retry="loadData" @item-click="filterResponseCode" />
            <MonitorChartPanel definition-id="api.merchantTop" :dataset="merchantDataset" :state="merchantState" @retry="loadData" @item-click="filterMerchant" />
        </MonitorChartGrid>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-api-main" v-loading="loading" :data="response?.page.records || []" row-key="apiKey" size="small">
            <el-table-column prop="apiOperation" :label="t('monitor.workbench.fields.apiOperation')" min-width="150" fixed="left" show-overflow-tooltip />
            <el-table-column prop="apiPath" :label="t('monitor.workbench.fields.apiPath')" min-width="260" show-overflow-tooltip />
            <el-table-column prop="requestCount" :label="t('monitor.workbench.fields.requests')" width="110" align="center" />
            <el-table-column :label="t('monitor.workbench.fields.successRate')" width="112" align="center">
                <template #default="{ row }">{{ formatPercent(row.successRate) }}</template>
            </el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.average')" width="110" align="center">
                <template #default="{ row }">{{ formatDuration(row.averageMillis, String(locale)) }}</template>
            </el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.p95')" width="110" align="center">
                <template #default="{ row }">{{ formatDuration(row.p95Millis, String(locale)) }}</template>
            </el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.p99')" width="110" align="center">
                <template #default="{ row }">{{ formatDuration(row.p99Millis, String(locale)) }}</template>
            </el-table-column>
            <el-table-column prop="failedCount" :label="t('monitor.workbench.fields.failed')" width="100" align="center" />
            <el-table-column prop="latestResponseCode" :label="t('monitor.workbench.fields.latestResponseCode')" min-width="150" align="center">
                <template #default="{ row }"><code>{{ row.latestResponseCode || '-' }}</code></template>
            </el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.latestFailureTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.latestFailureTime" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="(response?.page.total || 0) > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="response?.page.total || 0" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.api.detailTitle')" size="md">
            <el-descriptions v-if="detail" :column="2" border size="small">
                <el-descriptions-item :label="t('monitor.workbench.fields.apiOperation')">{{ detail.apiOperation || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.apiPath')">{{ detail.apiPath || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.requests')">{{ formatCount(detail.requestCount, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.failed')">{{ formatCount(detail.failedCount, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.successRate')">{{ formatPercent(detail.successRate) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.average')">{{ formatDuration(detail.averageMillis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.p95')">{{ formatDuration(detail.p95Millis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.p99')">{{ formatDuration(detail.p99Millis, String(locale)) }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.latestResponseCode')">{{ detail.latestResponseCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.latestFailureTime')"><BaseDateTime :value="detail.latestFailureTime" /></el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
/** API 监控主页面：按受控时间范围展示请求量、失败率、延迟和 TopN 聚合。 */
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorTimeRangeSelector } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { searchMonitorApis, type ApiAggregateItem, type ApiMonitorResponse } from '@/api/monitor/workbench';
import {
    createApiFailureRateDataset,
    createApiLatencyDataset,
    createApiMerchantDataset,
    createApiRequestDataset,
    createApiResponseCodeDataset,
    createMonitorTimeRange,
    formatCount,
    formatDuration,
    formatMetricValue,
    formatPercent,
    hasDatasetValues,
    hasPositiveMetric,
    monitorLoadState,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

const { locale, t } = useI18n();
const timeRange = ref(createMonitorTimeRange());
const showSearch = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const response = ref<ApiMonitorResponse>();
const page = ref(1);
const pageSize = ref(10);
const query = reactive({ serviceName: '', apiOperation: '', apiPath: '', merchantId: '', responseCode: '', result: '' });
const detailVisible = ref(false);
const detail = ref<ApiAggregateItem>();

const requestDataset = computed(() => createApiRequestDataset(response.value?.requestTrend || [], t));
const failureRateDataset = computed(() => createApiFailureRateDataset(response.value?.requestTrend || [], t));
const latencyDataset = computed(() => createApiLatencyDataset(response.value?.latencyTrend || [], t));
const responseCodeDataset = computed(() => createApiResponseCodeDataset(response.value?.responseCodeTop || []));
const merchantDataset = computed(() => createApiMerchantDataset(response.value?.merchantTop || []));
const requestState = computed(() => state(hasDatasetValues(requestDataset.value)));
const latencyState = computed(() => state(hasDatasetValues(latencyDataset.value)));
const responseCodeState = computed(() => state(responseCodeDataset.value.values.length > 0));
const merchantState = computed(() => state(merchantDataset.value.values.length > 0));
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
        response.value = await searchMonitorApis({
            ...toMonitorTimeRangeQuery(timeRange.value),
            pageNo: page.value,
            pageSize: pageSize.value,
            serviceName: query.serviceName || undefined,
            apiOperation: query.apiOperation || undefined,
            apiPath: query.apiPath || undefined,
            merchantId: query.merchantId || undefined,
            responseCode: query.responseCode || undefined,
            result: query.result || undefined,
        });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { Object.assign(query, { serviceName: '', apiOperation: '', apiPath: '', merchantId: '', responseCode: '', result: '' }); handleSearch(); }
function handleRangeChange(value: typeof timeRange.value) { timeRange.value = value; handleSearch(); }
function openDetail(row: ApiAggregateItem) { detail.value = row; detailVisible.value = true; }
function filterResponseCode(event: { dimensionKey?: string }) { if (event.dimensionKey) { query.responseCode = event.dimensionKey; handleSearch(); } }
function filterMerchant(event: { dimensionKey?: string }) { if (event.dimensionKey) { query.merchantId = event.dimensionKey; handleSearch(); } }
function state(hasData: boolean) {
    return monitorLoadState({
        loading: loading.value,
        error: errorMessage.value,
        hasResponse: Boolean(response.value),
        hasData: hasPositiveMetric(response.value?.summaries, 'requests') && hasData,
    });
}
</script>

<style scoped>
.monitor-workbench-page__charts { margin-bottom: 16px; }
.search-form :deep(.el-input) { width: 190px; }
</style>
