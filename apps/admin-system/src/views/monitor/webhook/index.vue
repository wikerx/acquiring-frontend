<template>
    <div class="app-container monitor-webhook-page">
        <MonitorPageHeader :title="t('monitor.workbench.webhook.title')" :description="t('monitor.workbench.webhook.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="104px">
            <el-form-item :label="t('monitor.workbench.fields.merchantId')"><el-input v-model.trim="query.merchantId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.transactionId')"><el-input v-model.trim="query.transactionId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.eventType')"><el-input v-model.trim="query.eventType" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.callbackStatus')">
                <el-select v-model="query.notifyStatus" clearable :placeholder="t('common.pleaseSelect')" style="width: 150px">
                    <el-option v-for="status in webhookStatuses" :key="status" :label="statusText(status)" :value="status" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.httpStatus')"><el-input-number v-model="query.httpStatus" :min="100" :max="599" controls-position="right" /></el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <MonitorMetricGrid :items="summaryCards" />

        <MonitorChartGrid page-definition-id="webhook" class="monitor-webhook-page__charts">
            <MonitorChartPanel definition-id="webhook.successRate" :dataset="successDataset" :state="successState" @retry="loadData" />
            <MonitorChartPanel definition-id="webhook.httpStatus" :dataset="httpStatusDataset" :state="httpStatusState" @retry="loadData" @item-click="filterHttpStatus" />
            <MonitorChartPanel definition-id="webhook.retryTrend" :dataset="retryDataset" :state="retryState" @retry="loadData" />
        </MonitorChartGrid>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-webhook-main" v-loading="loading" :data="response?.page.records || []" row-key="eventId" size="small">
            <el-table-column prop="eventId" :label="t('monitor.workbench.fields.eventId')" min-width="210" fixed="left" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="t('monitor.workbench.fields.merchantId')" min-width="140" align="center" show-overflow-tooltip />
            <el-table-column prop="transactionId" :label="t('monitor.workbench.fields.transactionId')" min-width="210" align="center" show-overflow-tooltip />
            <el-table-column prop="eventType" :label="t('monitor.workbench.fields.eventType')" min-width="150" align="center" show-overflow-tooltip />
            <el-table-column prop="httpStatus" :label="t('monitor.workbench.fields.httpStatus')" width="100" align="center"><template #default="{ row }">{{ row.httpStatus ?? '-' }}</template></el-table-column>
            <el-table-column prop="attemptCount" :label="t('monitor.workbench.fields.attemptCount')" width="100" align="center" />
            <el-table-column :label="t('monitor.workbench.fields.lastDuration')" width="120" align="center"><template #default="{ row }">{{ formatDuration(row.lastDurationMillis, String(locale)) }}</template></el-table-column>
            <el-table-column :label="t('common.status')" width="112" align="center"><template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.status)">{{ statusText(row.status) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.nextRetryTime')" min-width="172" align="center"><template #default="{ row }"><BaseDateTime :value="row.nextRetryTime" /></template></el-table-column>
            <el-table-column prop="lastError" :label="t('monitor.workbench.fields.lastError')" min-width="240" show-overflow-tooltip />
            <el-table-column :label="t('common.operation')" width="190" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button type="primary" link :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-tooltip :content="canRetry(row) ? t('monitor.workbench.webhook.retryTip') : t('monitor.workbench.webhook.retryDisabled')" placement="top">
                        <span>
                            <el-button
                                type="warning"
                                link
                                :icon="RefreshRight"
                                :disabled="!canRetry(row)"
                                :loading="retryingTransactionId === row.transactionId"
                                @click="retryWebhook(row)"
                                v-hasPermi="'transaction:merchant-notification:retry'"
                            >{{ t('monitor.workbench.actions.retry') }}</el-button>
                        </span>
                    </el-tooltip>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="(response?.page.total || 0) > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="response?.page.total || 0" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.webhook.detailTitle')" size="lg" :loading="detailLoading">
            <TransactionRecordList :rows="detail?.notification ? [detail.notification] : []" :display-time-zone="timeRange.timezone" />
            <el-divider content-position="left">{{ t('monitor.workbench.webhook.deliveryAttempts') }}</el-divider>
            <TransactionRecordList :rows="detail?.deliveryLogs || []" variant="callback" :display-time-zone="timeRange.timezone" />
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
/** Webhook 监控主页面：展示投递成功率、HTTP 状态、重试趋势和受控人工重试入口。 */
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Refresh, RefreshRight, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    MonitorChartGrid,
    MonitorChartPanel,
    MonitorTimeRangeSelector,
    type MonitorChartClickEvent,
    type MonitorTimeRangeValue,
} from '@/components/MonitorChart';
import { MonitorMetricGrid, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { searchMonitorWebhooks, type WebhookItem, type WebhookMonitorResponse } from '@/api/monitor/workbench';
import { getMerchantNotificationDetail, retryMerchantNotification, type MerchantNotificationDetail } from '@/api/transaction';
import TransactionRecordList from '../../transaction/components/TransactionRecordList.vue';
import {
    createMonitorTimeRange,
    createWebhookRetryDataset,
    createWebhookStatusDataset,
    createWebhookSuccessRateDataset,
    formatDuration,
    formatMetricValue,
    hasDatasetValues,
    hasPositiveMetric,
    monitorLoadState,
    monitorTagType,
    toMonitorTimeRangeQuery,
} from '@/api/monitor/workbenchAdapters';

const { locale, t } = useI18n();
const webhookStatuses = ['INIT', 'PROCESSING', 'SUCCESS', 'FAILED', 'CLOSED'];
const timeRange = ref(createMonitorTimeRange());
const showSearch = ref(true);
const loading = ref(false);
const errorMessage = ref('');
const response = ref<WebhookMonitorResponse>();
const page = ref(1);
const pageSize = ref(10);
const query = reactive<{ merchantId: string; transactionId: string; eventType: string; notifyStatus: string; httpStatus?: number }>({
    merchantId: '', transactionId: '', eventType: '', notifyStatus: '', httpStatus: undefined,
});
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<MerchantNotificationDetail>();
const retryingTransactionId = ref('');

const successDataset = computed(() => createWebhookSuccessRateDataset(response.value?.successRateTrend || [], t));
const httpStatusDataset = computed(() => createWebhookStatusDataset(response.value?.httpStatusDistribution || []));
const retryDataset = computed(() => createWebhookRetryDataset(response.value?.retryTrend || [], t));
const successState = computed(() => state(hasDatasetValues(successDataset.value)));
const httpStatusState = computed(() => state(httpStatusDataset.value.values.length > 0));
const retryState = computed(() => state(hasDatasetValues(retryDataset.value)));
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
        response.value = await searchMonitorWebhooks({
            ...toMonitorTimeRangeQuery(timeRange.value),
            pageNo: page.value,
            pageSize: pageSize.value,
            merchantId: query.merchantId || undefined,
            transactionId: query.transactionId || undefined,
            eventType: query.eventType || undefined,
            notifyStatus: query.notifyStatus || undefined,
            httpStatus: query.httpStatus,
        });
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { Object.assign(query, { merchantId: '', transactionId: '', eventType: '', notifyStatus: '', httpStatus: undefined }); handleSearch(); }
function handleRangeChange(value: MonitorTimeRangeValue) { timeRange.value = value; handleSearch(); }
function filterHttpStatus(event: MonitorChartClickEvent) {
    const httpStatus = Number(event.dimensionKey);
    if (!Number.isInteger(httpStatus) || httpStatus < 100 || httpStatus > 599) return;
    query.httpStatus = httpStatus;
    handleSearch();
}
function statusText(value?: string) { return t(`monitor.workbench.status.${String(value || 'unknown').toLowerCase()}`, value || '-'); }
function state(hasData: boolean) {
    return monitorLoadState({
        loading: loading.value,
        error: errorMessage.value,
        hasResponse: Boolean(response.value),
        hasData: hasPositiveMetric(response.value?.summaries, 'sent') && hasData,
    });
}

async function openDetail(row: WebhookItem) {
    if (!row.eventId || !row.transactionDateTime) {
        ElMessage.warning(t('monitor.workbench.webhook.detailUnavailable'));
        return;
    }
    detailVisible.value = true;
    detailLoading.value = true;
    detail.value = undefined;
    try {
        detail.value = await getMerchantNotificationDetail(row.eventId, row.transactionDateTime);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
        detailVisible.value = false;
    } finally {
        detailLoading.value = false;
    }
}

function canRetry(row: WebhookItem) {
    const status = String(row.status || '').toUpperCase();
    const retryableStatus = ['SUCCESS', 'CLOSED'].includes(status)
        || (status === 'FAILED' && !row.nextRetryTime);
    return retryableStatus && Boolean(row.transactionId && row.transactionDateTime);
}

async function retryWebhook(row: WebhookItem) {
    if (!row.transactionId || !row.transactionDateTime || !canRetry(row)) return;
    try {
        await ElMessageBox.confirm(
            t('monitor.workbench.webhook.retryConfirm', { transactionId: row.transactionId }),
            t('monitor.workbench.webhook.retryTitle'),
            { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' },
        );
    } catch {
        return;
    }
    retryingTransactionId.value = row.transactionId;
    try {
        const eventId = await retryMerchantNotification({ transactionId: row.transactionId, transactionDateTime: row.transactionDateTime });
        ElMessage.success(t('monitor.workbench.webhook.retryAccepted', { eventId }));
        await loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    } finally {
        retryingTransactionId.value = '';
    }
}
</script>

<style scoped>
.monitor-webhook-page__charts { margin-bottom: 16px; }
.search-form :deep(.el-input) { width: 190px; }
</style>
