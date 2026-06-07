<template>
    <PageContainer title="日志管理" category="系统管理" description="整合登录日志和操作日志查询，读取 service-admin 真实接口。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <el-tabs v-model="activeTab" class="admin-tabs">
            <el-tab-pane label="登录日志" name="login" />
            <el-tab-pane label="操作日志" name="oper" />
        </el-tabs>

        <BaseSearch :model="query" :fields="searchFields" @search="handleSearch" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="loadData">刷新</el-button>
                <el-button disabled>查看详情</el-button>
                <el-button disabled>导出</el-button>
            </div>
            <span class="security-note">日志只提供查询视图，导出待审计策略确认后开放。</span>
        </div>

        <BaseTable
            v-model:page="page"
            v-model:page-size="pageSize"
            :loading="loading"
            :rows="rows"
            :columns="columns"
            :total="total"
            @selection-change="selectedRows = $event"
            @view="openDetail"
            @edit="openDetail"
            @delete="openDetail"
        />

        <BaseDialog v-model="detailVisible" :title="`${activeTitle}详情`" width="820px">
            <el-descriptions :column="2" border class="dialog-descriptions">
                <el-descriptions-item v-for="column in columns" :key="column.prop" :label="column.label">
                    {{ activeRow?.[column.prop] ?? '-' }}
                </el-descriptions-item>
            </el-descriptions>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { searchLoginLogs } from '@/api/audit/login-log';
import { searchOperLogs } from '@/api/audit/oper-log';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import type { CrudSearchField, CrudTableColumn } from '@/types/admin';
import { LoginStatus } from '@/enums/status';

type LogTab = 'login' | 'oper';

const statusOptions = [
    { label: '成功', value: 1 },
    { label: '失败', value: 0 },
];

const activeTab = ref<LogTab>('login');
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]);
const selectedRows = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const activeRow = ref<Record<string, unknown> | null>(null);

const activeTitle = computed(() => (activeTab.value === 'login' ? '登录日志' : '操作日志'));

const searchFields = computed<CrudSearchField[]>(() => [
    {
        prop: 'keyword',
        label: activeTab.value === 'login' ? '登录账号' : '模块名称',
        placeholder: activeTab.value === 'login' ? '请输入登录账号' : '请输入模块名称',
    },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
]);

const loginColumns: CrudTableColumn[] = [
    { prop: 'loginAccount', label: '登录账号', minWidth: 150 },
    { prop: 'loginIp', label: '登录 IP', minWidth: 140 },
    { prop: 'merchantId', label: '商户号', minWidth: 150 },
    { prop: 'status', label: '状态', type: 'status', width: 100 },
    { prop: 'failReason', label: '失败原因', minWidth: 180 },
    { prop: 'loginAt', label: '登录时间', type: 'datetime', minWidth: 180 },
];

const operColumns: CrudTableColumn[] = [
    { prop: 'moduleName', label: '模块', minWidth: 140 },
    { prop: 'operatorName', label: '操作人', minWidth: 140 },
    { prop: 'requestMethod', label: '方法', width: 90 },
    { prop: 'operUrl', label: '请求 URL', minWidth: 220 },
    { prop: 'operIp', label: '操作 IP', minWidth: 140 },
    { prop: 'costTimeText', label: '耗时', width: 100 },
    { prop: 'status', label: '状态', type: 'status', width: 100 },
    { prop: 'operatedAt', label: '操作时间', type: 'datetime', minWidth: 180 },
];

const columns = computed(() => (activeTab.value === 'login' ? loginColumns : operColumns));

watch([activeTab, page, pageSize], () => {
    selectedRows.value = [];
    loadData();
});

onMounted(() => {
    loadData();
});

async function loadData() {
    loading.value = true;
    try {
        const result = activeTab.value === 'login'
            ? await searchLoginLogs({
                pageNo: page.value,
                pageSize: pageSize.value,
                loginAccount: keyword(),
                loginStatus: numericStatus(),
            })
            : await searchOperLogs({
                pageNo: page.value,
                pageSize: pageSize.value,
                moduleName: keyword(),
                status: numericStatus(),
            });
        rows.value = result.records.map((item) => normalizeRow(item as unknown as Record<string, unknown>));
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '日志加载失败');
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    if (page.value === 1) {
        loadData();
        return;
    }
    page.value = 1;
}

function handleReset() {
    Object.keys(query).forEach((key) => {
        query[key] = '';
    });
    handleSearch();
}

function openDetail(row: Record<string, unknown>) {
    activeRow.value = row;
    detailVisible.value = true;
}

function keyword() {
    return String(query.keyword || '').trim() || undefined;
}

function numericStatus() {
    return typeof query.status === 'number' ? query.status : undefined;
}

function normalizeRow(row: Record<string, unknown>) {
    const status = row.loginStatus ?? row.status;
    return {
        ...row,
        status: status === 1 ? LoginStatus.Success : LoginStatus.Failed,
        costTimeText: typeof row.costTime === 'number' ? `${row.costTime} ms` : '-',
    };
}
</script>
