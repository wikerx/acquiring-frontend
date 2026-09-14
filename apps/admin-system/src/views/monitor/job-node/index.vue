<template>
    <div class="app-container monitor-job-node-page">
        <MonitorPageHeader :title="t('monitor.jobNode.title')" :description="t('monitor.jobNode.description')" />

        <MonitorCapabilityAlert :capability="resourceCapability" :title="t('monitor.workbench.jobNode.resourceCapabilityTitle')" />
        <MonitorChartGrid page-definition-id="job-node-detail" class="monitor-job-node-page__chart">
            <MonitorChartPanel definition-id="jobNode.resourceDetail" :dataset="resourceDataset" :state="resourceState" />
        </MonitorChartGrid>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar"><RightToolbar :show-search="false" @refresh="loadData" v-hasPermi="'monitor:jobNode:refresh'" /></el-col>
        </el-row>

        <StandardTable table-key="monitor-job-node" v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column prop="nodeId" :label="t('monitor.jobNode.nodeId')" min-width="220" align="center" show-overflow-tooltip />
            <el-table-column prop="appName" :label="t('monitor.jobNode.appName')" min-width="130" align="center" />
            <el-table-column prop="host" :label="t('monitor.jobNode.host')" min-width="130" align="center" />
            <el-table-column prop="port" :label="t('monitor.jobNode.port')" width="90" align="center" />
            <el-table-column prop="status" :label="t('common.status')" width="100" align="center"><template #default="{ row }"><BaseStatusTag :value="row.status === 'ONLINE' ? 'ENABLED' : 'DISABLED'" :text="formatNodeStatus(row.status)" /></template></el-table-column>
            <el-table-column prop="currentRunningCount" :label="t('monitor.jobNode.currentRunningCount')" width="120" align="center" />
            <el-table-column prop="maxConcurrentCount" :label="t('monitor.jobNode.maxConcurrentCount')" width="120" align="center" />
            <el-table-column :label="t('monitor.jobNode.lastHeartbeatTime')" min-width="168" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastHeartbeatTime" /></template></el-table-column>
            <el-table-column :label="t('common.operation')" width="100" align="center" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:jobNode:query'">{{ t('common.detail') }}</el-button></template></el-table-column>
        </StandardTable>

        <el-empty v-if="!loading && !rows.length" :description="t('common.noData')" />

        <DetailDescriptions v-model:visible="detailVisible" :title="t('common.detail')" :data="detailData" :items="detailItems" :column="1" size="md">
            <template #cell-status="{ data }"><BaseStatusTag :value="String(data?.status || '') === 'ONLINE' ? 'ENABLED' : 'DISABLED'" :text="formatNodeStatus(String(data?.status || ''))" /></template>
            <template #cell-lastHeartbeatTime="{ data }"><BaseDateTime :value="String(data?.lastHeartbeatTime || '')" /></template>
        </DetailDescriptions>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { MonitorChartGrid, MonitorChartPanel } from '@/components/MonitorChart';
import { MonitorCapabilityAlert, MonitorPageHeader } from '@/components/MonitorWorkbench';
import { getJobNodes, type JobNodeRow } from '@/api/monitor/jobNode';
import type { ProviderCapability } from '@/api/monitor/workbench';
import { createEmptyJobNodeDataset, monitorLoadState } from '@/api/monitor/workbenchAdapters';

/**
 * 调度节点监控主页面：展示当前节点注册与并发快照，并明确声明历史资源指标尚未接入。
 */
const { t } = useI18n();
const loading = ref(false);
const rows = ref<JobNodeRow[]>([]);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const resourceCapability = computed<ProviderCapability>(() => ({ provider: 'JOB_NODE_HISTORY_METRICS', status: 'NOT_CONFIGURED', reason: t('monitor.workbench.jobNode.resourceNotConfigured') }));
const resourceDataset = computed(() => createEmptyJobNodeDataset(t));
const resourceState = computed(() => monitorLoadState({ loading: false, hasResponse: true, hasData: false, emptyDescription: resourceCapability.value.reason }));
const detailItems = computed(() => [
    { prop: 'nodeId', label: t('monitor.jobNode.nodeId') },
    { prop: 'appName', label: t('monitor.jobNode.appName') },
    { prop: 'host', label: t('monitor.jobNode.host') },
    { prop: 'port', label: t('monitor.jobNode.port') },
    { prop: 'instanceId', label: t('monitor.jobNode.instanceId') },
    { prop: 'status', label: t('common.status') },
    { prop: 'currentRunningCount', label: t('monitor.jobNode.currentRunningCount') },
    { prop: 'maxConcurrentCount', label: t('monitor.jobNode.maxConcurrentCount') },
    { prop: 'lastHeartbeatTime', label: t('monitor.jobNode.lastHeartbeatTime') },
]);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        rows.value = await getJobNodes();
    } catch (error) {
        rows.value = [];
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function openDetail(row: JobNodeRow) { detailData.value = row as unknown as Record<string, unknown>; detailVisible.value = true; }
function formatNodeStatus(status: string) { return status === 'ONLINE' ? t('monitor.jobNode.statusOnline') : t('monitor.jobNode.statusOffline'); }
</script>

<style scoped>
.monitor-job-node-page__chart { margin-bottom: 16px; }
</style>
