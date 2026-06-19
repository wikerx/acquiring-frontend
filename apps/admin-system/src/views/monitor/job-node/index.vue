<template>
    <div class="app-container">
        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar">
                <div class="toolbar-actions">
                    <el-tooltip :content="$t('common.refresh')" effect="dark" placement="bottom">
                        <el-button :icon="Refresh" size="small" circle @click="loadData" v-hasPermi="'monitor:jobNode:refresh'" />
                    </el-tooltip>
                </div>
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column prop="nodeId" :label="$t('monitor.jobNode.nodeId')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="appName" :label="$t('monitor.jobNode.appName')" min-width="130" align="center" />
            <el-table-column prop="host" :label="$t('monitor.jobNode.host')" min-width="130" align="center" />
            <el-table-column prop="port" :label="$t('monitor.jobNode.port')" width="90" align="center" />
            <el-table-column prop="status" :label="$t('common.status')" width="100" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="row.status === 'ONLINE' ? 'ENABLED' : 'DISABLED'" :text="formatNodeStatus(row.status)" />
                </template>
            </el-table-column>
            <el-table-column prop="currentRunningCount" :label="$t('monitor.jobNode.currentRunningCount')" width="120" align="center" />
            <el-table-column prop="maxConcurrentCount" :label="$t('monitor.jobNode.maxConcurrentCount')" width="120" align="center" />
            <el-table-column :label="$t('monitor.jobNode.lastHeartbeatTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.lastHeartbeatTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:jobNode:query'">{{ $t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && !rows.length" :description="$t('common.noData')" />

        <DetailDescriptions
            v-model:visible="detailVisible"
            :title="$t('common.detail')"
            :data="detailData"
            :items="detailItems"
            :column="1"
        >
            <template #cell-status="{ data }">
                <BaseStatusTag :value="String(data?.status || '') === 'ONLINE' ? 'ENABLED' : 'DISABLED'" :text="formatNodeStatus(String(data?.status || ''))" />
            </template>
            <template #cell-lastHeartbeatTime="{ data }">
                <BaseDateTime :value="String(data?.lastHeartbeatTime || '')" />
            </template>
        </DetailDescriptions>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import { getJobNodes, type JobNodeRow } from '@/api/monitor/jobNode';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<JobNodeRow[]>([]);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
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
        console.error(error);
        rows.value = [];
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function openDetail(row: JobNodeRow) {
    detailData.value = row as unknown as Record<string, unknown>;
    detailVisible.value = true;
}

function formatNodeStatus(status: string) {
    return status === 'ONLINE' ? t('monitor.jobNode.statusOnline') : t('monitor.jobNode.statusOffline');
}
</script>
