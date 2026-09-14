<template>
    <div class="app-container monitor-log-page">
        <MonitorPageHeader :title="t('monitor.workbench.log.title')" :description="t('monitor.workbench.log.description')">
            <MonitorTimeRangeSelector :model-value="timeRange" @update:model-value="handleRangeChange" />
        </MonitorPageHeader>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="104px">
            <el-form-item :label="t('monitor.workbench.fields.traceId')"><el-input v-model.trim="query.traceId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.transactionId')"><el-input v-model.trim="query.transactionId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.service')"><el-input v-model.trim="query.serviceName" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.level')">
                <el-select v-model="query.level" clearable :placeholder="t('common.pleaseSelect')" style="width: 140px">
                    <el-option label="INFO" value="INFO" />
                    <el-option label="WARN" value="WARN" />
                    <el-option label="ERROR" value="ERROR" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
                <el-button :icon="Refresh" @click="resetQuery">{{ t('common.reset') }}</el-button>
                <el-button link type="primary" :icon="advancedVisible ? ArrowUp : ArrowDown" @click="advancedVisible = !advancedVisible">
                    {{ advancedVisible ? t('monitor.workbench.actions.collapseFilters') : t('monitor.workbench.actions.expandFilters') }}
                </el-button>
            </el-form-item>
        </el-form>

        <el-form v-show="showSearch && advancedVisible" :model="query" :inline="true" size="small" class="search-form monitor-log-page__advanced" label-width="104px">
            <el-form-item :label="t('monitor.workbench.fields.merchantId')"><el-input v-model.trim="query.merchantId" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.channelOrderNo')"><el-input v-model.trim="query.channelOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('monitor.workbench.fields.keyword')"><el-input v-model.trim="query.keyword" clearable @keyup.enter="handleSearch" /></el-form-item>
        </el-form>

        <MonitorCapabilityAlert :capability="response?.contextCapability" :title="t('monitor.workbench.log.capabilityTitle')" />
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="monitor-log-page__error" />

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><span class="monitor-log-page__count">{{ t('monitor.workbench.log.resultCount', { count: response?.page.total || 0 }) }}</span></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-log-search-main" v-loading="loading" :data="response?.page.records || []" :row-key="logRowKey" size="small">
            <el-table-column :label="t('monitor.workbench.fields.timestamp')" min-width="172" fixed="left" align="center"><template #default="{ row }"><BaseDateTime :value="row.timestamp" /></template></el-table-column>
            <el-table-column :label="t('monitor.workbench.fields.level')" width="96" align="center"><template #default="{ row }"><el-tag size="small" :type="monitorTagType(row.level)">{{ row.level || '-' }}</el-tag></template></el-table-column>
            <el-table-column prop="serviceName" :label="t('monitor.workbench.fields.service')" min-width="150" show-overflow-tooltip />
            <el-table-column prop="eventType" :label="t('monitor.workbench.fields.eventType')" min-width="170" show-overflow-tooltip />
            <el-table-column prop="message" :label="t('monitor.workbench.fields.message')" min-width="320" show-overflow-tooltip />
            <el-table-column prop="traceId" :label="t('monitor.workbench.fields.traceId')" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column prop="transactionId" :label="t('monitor.workbench.fields.transactionId')" min-width="210" align="center" show-overflow-tooltip />
            <el-table-column prop="merchantId" :label="t('monitor.workbench.fields.merchantId')" min-width="130" align="center" show-overflow-tooltip />
            <el-table-column :label="t('common.operation')" width="160" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button type="primary" link :icon="View" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                    <el-button v-if="row.transactionId || row.traceId" type="primary" link :icon="Share" @click="openTrace(row)">{{ t('monitor.workbench.actions.viewTrace') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="(response?.page.total || 0) > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="response?.page.total || 0" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('monitor.workbench.log.detailTitle')" size="md">
            <el-descriptions v-if="detail" :column="1" border size="small">
                <el-descriptions-item :label="t('monitor.workbench.fields.id')">{{ detail.id || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.timestamp')"><BaseDateTime :value="detail.timestamp" /></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.level')"><el-tag size="small" :type="monitorTagType(detail.level)">{{ detail.level || '-' }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.service')">{{ detail.serviceName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.eventType')">{{ detail.eventType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.message')"><pre class="monitor-log-page__message">{{ detail.message || '-' }}</pre></el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.traceId')">{{ detail.traceId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.transactionId')">{{ detail.transactionId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.merchantId')">{{ detail.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('monitor.workbench.fields.referenceId')">{{ detail.referenceId || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
/** 结构化日志检索主页面：只展示已脱敏的业务事件摘要并支持跳转交易链路。 */
import { onMounted, reactive, ref } from 'vue';
import { ArrowDown, ArrowUp, Refresh, Search, Share, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorTimeRangeSelector, type MonitorTimeRangeValue } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { searchMonitorLogs, type LogSearchResponse, type StructuredLogItem } from '@/api/monitor/workbench';
import { createMonitorTimeRange, monitorTagType, toMonitorTimeRangeQuery } from '@/api/monitor/workbenchAdapters';

const { t } = useI18n();
const router = useRouter();
const timeRange = ref(createMonitorTimeRange());
const showSearch = ref(true);
const advancedVisible = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const response = ref<LogSearchResponse>();
const page = ref(1);
const pageSize = ref(20);
const query = reactive({ traceId: '', transactionId: '', merchantId: '', merchantOrderNo: '', channelOrderNo: '', serviceName: '', level: '', keyword: '' });
const detailVisible = ref(false);
const detail = ref<StructuredLogItem>();

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    errorMessage.value = '';
    try {
        response.value = await searchMonitorLogs({
            ...toMonitorTimeRangeQuery(timeRange.value),
            pageNo: page.value,
            pageSize: pageSize.value,
            traceId: query.traceId || undefined,
            transactionId: query.transactionId || undefined,
            merchantId: query.merchantId || undefined,
            merchantOrderNo: query.merchantOrderNo || undefined,
            channelOrderNo: query.channelOrderNo || undefined,
            serviceName: query.serviceName || undefined,
            level: query.level || undefined,
            keyword: query.keyword || undefined,
        });
    } catch (error) {
        response.value = undefined;
        errorMessage.value = error instanceof Error ? error.message : t('common.loadFailed');
    } finally {
        loading.value = false;
    }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { Object.keys(query).forEach((key) => { query[key as keyof typeof query] = ''; }); handleSearch(); }
function handleRangeChange(value: MonitorTimeRangeValue) { timeRange.value = value; handleSearch(); }
function openDetail(row: StructuredLogItem) { detail.value = row; detailVisible.value = true; }
function openTrace(row: StructuredLogItem) {
    router.push({ path: '/monitor/trace', query: { transactionId: row.transactionId || undefined, traceId: row.traceId || undefined } });
}

function logRowKey(row: StructuredLogItem) {
    return [row.serviceName, row.eventType, row.id, row.timestamp].map((value) => value || '-').join(':');
}
</script>

<style scoped>
.search-form :deep(.el-input) { width: 205px; }
.monitor-log-page__error { margin-bottom: 16px; }
.monitor-log-page__advanced { margin-top: -8px; }
.monitor-log-page__count { display: inline-flex; align-items: center; min-height: 28px; color: var(--el-text-color-secondary); font-size: 12px; }
.monitor-log-page__message { margin: 0; color: var(--el-text-color-regular); font: inherit; line-height: 20px; white-space: pre-wrap; word-break: break-word; }
</style>
