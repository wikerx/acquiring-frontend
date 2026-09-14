<template>
    <div class="app-container monitor-alert-page">
        <MonitorPageHeader :title="t('monitor.workbench.alert.title')" :description="t('monitor.workbench.alert.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('monitor.workbench.fields.source')">
                <el-select v-model="query.sourceType" clearable :placeholder="t('common.pleaseSelect')" style="width: 150px">
                    <el-option label="CHANNEL" value="CHANNEL" />
                    <el-option label="SECURITY" value="SECURITY" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.level')">
                <el-select v-model="query.level" clearable :placeholder="t('common.pleaseSelect')" style="width: 150px">
                    <el-option label="WARNING" value="WARNING" />
                    <el-option label="ERROR" value="ERROR" />
                    <el-option label="CRITICAL" value="CRITICAL" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" clearable :placeholder="t('common.pleaseSelect')" style="width: 150px">
                    <el-option v-for="status in alertStatuses" :key="status" :label="statusText(status)" :value="status" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.ownerAccountId')"><el-input v-model.trim="query.ownerAccountId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.keyword')"><el-input v-model.trim="query.keyword" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <MonitorMetricGrid :items="summaryCards" />

        <MonitorChartGrid page-definition-id="alert" class="monitor-alert-page__charts">
            <MonitorChartPanel definition-id="alert.trend" :dataset="trendDataset" :state="trendState" @retry="loadData" />
            <MonitorChartPanel definition-id="alert.sourceTop" :dataset="sourceDataset" :state="sourceState" @retry="loadData" @item-click="filterSource" />
            <MonitorChartPanel definition-id="alert.contextMetric" :dataset="contextDataset" :state="contextState" />
        </MonitorChartGrid>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-alert-main" v-loading="loading" :data="response?.page.records || []" :row-key="alertRowKey" size="small">
            <el-table-column :label="t('monitor.workbench.fields.level')" width="110" fixed="left" align="center"><template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.level)">{{ statusText(row.level) }}</el-tag></template></el-table-column>
            <el-table-column prop="sourceType" :label="t('monitor.workbench.fields.source')" width="120" align="center" />
            <el-table-column prop="serviceName" :label="t('monitor.workbench.fields.serviceModule')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="title" :label="t('monitor.workbench.fields.title')" min-width="230" show-overflow-tooltip />
            <el-table-column prop="occurrenceCount" :label="t('monitor.workbench.fields.occurrences')" width="92" align="center" />
            <el-table-column :label="t('monitor.workbench.fields.firstOccurredAt')" min-width="172" align="center"><template #default="{ row }"><BaseDateTime :value="row.firstOccurredAt" /></template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.lastOccurredAt')" min-width="172" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastOccurredAt" /></template></el-table-column>
            <el-table-column :label="t('common.status')" width="112" align="center"><template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
            <el-table-column prop="ownerName" :label="t('monitor.workbench.fields.owner')" min-width="120" align="center"><template #default="{ row }">{{ row.ownerName || '-' }}</template></el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center"><template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button></template></el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="(response?.page.total || 0) > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="response?.page.total || 0" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.alert.detailTitle')" size="lg" :loading="detailLoading">
            <template v-if="detail?.alert">
                <div class="monitor-alert-page__actions" v-hasPermi="'system:monitor:alert:handle'">
                    <el-button type="primary" plain :icon="UserFilled" @click="openAction('takeover')">{{ t('monitor.workbench.actions.takeOver') }}</el-button>
                    <el-button v-if="canProcess" type="warning" plain :icon="Loading" @click="openAction('processing')">{{ t('monitor.workbench.actions.markProcessing') }}</el-button>
                    <el-button v-if="canClose" type="danger" plain :icon="CircleClose" @click="openAction('close')">{{ t('monitor.workbench.actions.closeAlert') }}</el-button>
                </div>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('monitor.workbench.fields.source')">{{ detail.alert.sourceType }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.sourceId')">{{ detail.alert.sourceId }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.level')"><el-tag size="small" :type="monitorTagType(detail.alert.level)">{{ statusText(detail.alert.level) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('common.status')"><el-tag size="small" :type="monitorTagType(detail.alert.status)">{{ statusText(detail.alert.status) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.serviceModule')">{{ detail.alert.serviceName || detail.alert.moduleName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.owner')">{{ detail.alert.ownerName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.title')" :span="2">{{ detail.alert.title || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.content')" :span="2">{{ detail.alert.content || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.firstOccurredAt')"><BaseDateTime :value="detail.alert.firstOccurredAt" /></el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.lastOccurredAt')"><BaseDateTime :value="detail.alert.lastOccurredAt" /></el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.occurrences')">{{ detail.alert.occurrenceCount }}</el-descriptions-item>
                    <el-descriptions-item :label="t('monitor.workbench.fields.version')">{{ detail.alert.version }}</el-descriptions-item>
                    <el-descriptions-item :label="t('common.remark')" :span="2">{{ detail.alert.handleRemark || '-' }}</el-descriptions-item>
                </el-descriptions>

                <el-divider content-position="left">{{ t('monitor.workbench.alert.sourceMetrics') }}</el-divider>
                <el-descriptions v-if="sourceMetricEntries.length" :column="2" border size="small">
                    <el-descriptions-item v-for="entry in sourceMetricEntries" :key="entry.key" :label="entry.key">{{ entry.value }}</el-descriptions-item>
                </el-descriptions>
                <el-empty v-else :description="t('common.noData')" />
                <MonitorCapabilityAlert :capability="detail.contextMetricCapability" :title="t('monitor.workbench.alert.contextCapabilityTitle')" />

                <el-divider content-position="left">{{ t('monitor.workbench.alert.history') }}</el-divider>
                <el-timeline v-if="detail.history.length">
                    <el-timeline-item v-for="item in detail.history" :key="item.id" :timestamp="item.operatedAt || '-'" placement="top">
                        <strong>{{ actionText(item.action) }}</strong>
                        <span class="monitor-alert-page__history-status">{{ statusText(item.fromStatus) }} → {{ statusText(item.toStatus) }}</span>
                        <p>{{ item.operatorName || item.operatorAccountId || '-' }} · {{ item.remark || t('monitor.workbench.alert.noRemark') }}</p>
                    </el-timeline-item>
                </el-timeline>
                <el-empty v-else :description="t('monitor.workbench.alert.noHistory')" />
            </template>
        </CommonDetailDrawer>

        <el-dialog v-model="actionVisible" :title="actionTitle" width="520px" append-to-body destroy-on-close>
            <el-form label-width="96px" size="small">
                <el-form-item :label="t('monitor.workbench.fields.sourceId')"><el-input :model-value="detail?.alert.sourceId || '-'" disabled /></el-form-item>
                <el-form-item :label="t('common.remark')"><el-input v-model="actionRemark" type="textarea" :rows="4" maxlength="512" show-word-limit :placeholder="t('monitor.workbench.alert.remarkPlaceholder')" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSaving" @click="submitAction">{{ t('common.confirm') }}</el-button>
                    <el-button @click="actionVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
/** 告警中心主页面：统一展示聚合趋势、来源分布、处理状态和带版本保护的人工处置。 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CircleClose, Loading, Refresh, Search, UserFilled, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel, MonitorTimeRangeSelector, type MonitorChartClickEvent, type MonitorTimeRangeValue } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import {
    closeMonitorAlert,
    getMonitorAlertDetail,
    markMonitorAlertProcessing,
    searchMonitorAlerts,
    takeOverMonitorAlert,
    type AlertDetailResponse,
    type AlertItem,
    type AlertSearchResponse,
} from '@/api/monitor/workbench';
import {
    createAlertSourceDataset,
    createAlertTrendDataset,
    createEmptyAlertContextDataset,
    createMonitorTimeRange,
    formatMetricValue,
    hasDatasetValues,
    hasPositiveMetric,
    monitorLoadState,
    monitorTagType,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

type AlertAction = 'takeover' | 'processing' | 'close';

const { locale, t } = useI18n();
const route = useRoute();
const alertStatuses = ['OPEN', 'PROCESSING', 'RECOVERED', 'CLOSED'];
const timeRange = ref(createMonitorTimeRange());
const showSearch = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const response = ref<AlertSearchResponse>();
const page = ref(1);
const pageSize = ref(10);
const query = reactive({ sourceType: '', level: '', status: '', ownerAccountId: '', keyword: '' });
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<AlertDetailResponse>();
const actionVisible = ref(false);
const actionSaving = ref(false);
const currentAction = ref<AlertAction>('takeover');
const actionRemark = ref('');

const trendDataset = computed(() => createAlertTrendDataset(response.value?.trend || [], t));
const sourceDataset = computed(() => createAlertSourceDataset(response.value?.sourceTop || []));
const contextDataset = computed(() => createEmptyAlertContextDataset(t));
const trendState = computed(() => state(hasDatasetValues(trendDataset.value)));
const sourceState = computed(() => state(sourceDataset.value.values.length > 0));
const contextState = computed(() => monitorLoadState({
    loading: false,
    hasResponse: true,
    hasData: false,
    emptyDescription: t('monitor.workbench.alert.contextNotConfigured'),
}));
const summaryCards = computed(() => (response.value?.summaries || []).map((item) => ({
    key: item.key,
    label: t(`monitor.workbench.metric.${item.key}`, item.label || item.key),
    value: formatMetricValue(item, String(locale.value)),
    status: item.status,
    description: item.description,
})));
const canProcess = computed(() => ['OPEN', 'PROCESSING'].includes(String(detail.value?.alert.status || '').toUpperCase()));
const canClose = computed(() => String(detail.value?.alert.status || '').toUpperCase() !== 'CLOSED');
const actionTitle = computed(() => t(`monitor.workbench.alert.action.${currentAction.value}`));
const sourceMetricEntries = computed(() => Object.entries(detail.value?.sourceMetrics || {}).map(([key, value]) => ({
    key,
    value: value === null || value === undefined || value === '' ? '-' : String(value),
})));

onMounted(async () => {
    const sourceType = routeText('sourceType');
    const sourceId = routeText('sourceId');
    if (sourceType) query.sourceType = sourceType;
    await loadData();
    if (sourceType && sourceId) await openDetailById(sourceType, sourceId);
});

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        response.value = await searchMonitorAlerts({
            ...toMonitorTimeRangeQuery(timeRange.value),
            pageNo: page.value,
            pageSize: pageSize.value,
            sourceType: query.sourceType || undefined,
            level: query.level || undefined,
            status: query.status || undefined,
            ownerAccountId: query.ownerAccountId || undefined,
            keyword: query.keyword || undefined,
        });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { Object.assign(query, { sourceType: '', level: '', status: '', ownerAccountId: '', keyword: '' }); handleSearch(); }
function handleRangeChange(value: MonitorTimeRangeValue) { timeRange.value = value; handleSearch(); }
function statusText(value?: string) { return t(`monitor.workbench.status.${String(value || 'unknown').toLowerCase()}`, value || '-'); }
function actionText(value?: string) { return t(`monitor.workbench.alert.historyAction.${String(value || 'unknown').toLowerCase()}`, value || '-'); }
function state(hasData: boolean) {
    return monitorLoadState({
        loading: loading.value,
        error: errorMessage.value,
        hasResponse: Boolean(response.value),
        hasData: hasPositiveMetric(response.value?.summaries, 'openAlerts') || hasData,
    });
}

function filterSource(event: MonitorChartClickEvent) {
    if (event.dimensionKey) {
        query.sourceType = event.dimensionKey;
        handleSearch();
    }
}

async function openDetail(row: AlertItem) {
    await openDetailById(row.sourceType, row.sourceId);
}

async function openDetailById(sourceType: string, sourceId: string) {
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = undefined;
    try {
        detail.value = await getMonitorAlertDetail(sourceType, sourceId);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
        detailVisible.value = false;
    } finally {
        detailLoading.value = false;
    }
}

function openAction(action: AlertAction) {
    currentAction.value = action;
    actionRemark.value = detail.value?.alert.handleRemark || '';
    actionVisible.value = true;
}

async function submitAction() {
    const alert = detail.value?.alert;
    if (!alert) return;
    if (currentAction.value === 'close') {
        try {
            await ElMessageBox.confirm(
                t('monitor.workbench.alert.closeConfirm'),
                t('monitor.workbench.alert.action.close'),
                { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' },
            );
        } catch {
            return;
        }
    }
    actionSaving.value = true;
    try {
        const payload = { version: alert.version, remark: actionRemark.value.trim() || undefined };
        const updated = currentAction.value === 'takeover'
            ? await takeOverMonitorAlert(alert.sourceType, alert.sourceId, payload)
            : currentAction.value === 'processing'
                ? await markMonitorAlertProcessing(alert.sourceType, alert.sourceId, payload)
                : await closeMonitorAlert(alert.sourceType, alert.sourceId, payload);
        detail.value = updated;
        actionVisible.value = false;
        ElMessage.success(t('common.success'));
        await loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        actionSaving.value = false;
    }
}

function routeText(key: string) {
    const value = route.query[key];
    return Array.isArray(value) ? String(value[0] || '') : String(value || '');
}

function alertRowKey(row: AlertItem) {
    return `${row.sourceType}:${row.sourceId}`;
}
</script>

<style scoped>
.monitor-alert-page__charts { margin-bottom: 16px; }
.search-form :deep(.el-input) { width: 190px; }
.monitor-alert-page__actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.monitor-alert-page__history-status { margin-left: 10px; color: var(--el-text-color-secondary); font-size: 12px; }
.monitor-alert-page :deep(.el-timeline-item__content p) { margin: 4px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
</style>
