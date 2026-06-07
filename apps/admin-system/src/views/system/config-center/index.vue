<template>
    <PageContainer title="字典参数" category="系统管理" description="整合字典类型和系统参数配置，读取 service-admin 真实接口。">
        <template #extra>
            <el-tag type="success" effect="plain">接口已接入</el-tag>
        </template>

        <el-tabs v-model="activeTab" class="admin-tabs">
            <el-tab-pane label="字典管理" name="dict" />
            <el-tab-pane label="参数设置" name="config" />
        </el-tabs>

        <BaseSearch :model="query" :fields="searchFields" @search="handleSearch" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="loadData">刷新</el-button>
                <el-button disabled>新增</el-button>
                <el-button disabled>编辑</el-button>
                <el-button disabled type="danger" plain>删除</el-button>
            </div>
            <span class="security-note">写操作入口保留，待表单校验和审计确认后开放。</span>
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

        <BaseDialog v-model="detailVisible" :title="`${activeTitle}详情`" width="760px">
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
import { searchConfigs } from '@/api/system/config';
import { searchDictTypes } from '@/api/system/dict';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import type { CrudSearchField, CrudTableColumn } from '@/types/admin';
import { CommonStatus } from '@/enums/status';

type ConfigCenterTab = 'dict' | 'config';

const statusOptions = [
    { label: '启用', value: 1 },
    { label: '停用', value: 0 },
];

const activeTab = ref<ConfigCenterTab>('dict');
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]);
const selectedRows = ref<Array<Record<string, unknown>>>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const activeRow = ref<Record<string, unknown> | null>(null);

const activeTitle = computed(() => (activeTab.value === 'dict' ? '字典类型' : '系统参数'));

const searchFields = computed<CrudSearchField[]>(() => [
    {
        prop: 'keyword',
        label: activeTab.value === 'dict' ? '字典名称' : '参数名称',
        placeholder: activeTab.value === 'dict' ? '请输入字典名称' : '请输入参数名称',
    },
    { prop: 'status', label: '状态', type: 'select', options: statusOptions },
]);

const dictColumns: CrudTableColumn[] = [
    { prop: 'dictType', label: '字典类型', minWidth: 180 },
    { prop: 'dictName', label: '字典名称', minWidth: 180 },
    { prop: 'bizDomain', label: '业务域', minWidth: 140 },
    { prop: 'status', label: '状态', type: 'status', width: 100 },
    { prop: 'updatedAt', label: '更新时间', type: 'datetime', minWidth: 180 },
];

const configColumns: CrudTableColumn[] = [
    { prop: 'configKey', label: '参数键名', minWidth: 220 },
    { prop: 'configName', label: '参数名称', minWidth: 180 },
    { prop: 'configGroup', label: '配置分组', minWidth: 140 },
    { prop: 'valueTypeText', label: '值类型', width: 110 },
    { prop: 'status', label: '状态', type: 'status', width: 100 },
    { prop: 'updatedAt', label: '更新时间', type: 'datetime', minWidth: 180 },
];

const columns = computed(() => (activeTab.value === 'dict' ? dictColumns : configColumns));

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
        const result = activeTab.value === 'dict'
            ? await searchDictTypes({
                pageNo: page.value,
                pageSize: pageSize.value,
                dictName: keyword(),
                status: numericStatus(),
            })
            : await searchConfigs({
                pageNo: page.value,
                pageSize: pageSize.value,
                configName: keyword(),
                status: numericStatus(),
            });
        rows.value = result.records.map((item) => normalizeRow(item as unknown as Record<string, unknown>));
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : '列表加载失败');
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
    return {
        ...row,
        status: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled,
        valueTypeText: valueTypeText(row.valueType),
    };
}

function valueTypeText(value: unknown) {
    return ({
        1: '字符串',
        2: '数字',
        3: '布尔',
        4: 'JSON',
    } as Record<number, string>)[Number(value)] || '-';
}
</script>
