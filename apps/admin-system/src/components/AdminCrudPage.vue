<template>
    <PageContainer :title="module.title" :category="module.category" :description="module.summary">
        <template #extra>
            <el-tag type="info" effect="plain">{{ module.tableName }}</el-tag>
        </template>

        <BaseSearch :model="query" :fields="module.searchFields" @search="handleSearch" @reset="handleReset" />

        <div class="toolbar">
            <div class="toolbar-left">
                <el-button type="primary" @click="openDialog('新增')">新增</el-button>
                <el-button :disabled="!selectedRows.length" @click="openDialog('编辑')">编辑</el-button>
                <el-button :disabled="!selectedRows.length" @click="openDialog('查看')">查看</el-button>
                <el-button type="danger" plain :disabled="!selectedRows.length" @click="handleDelete">
                    删除
                </el-button>
            </div>
            <span v-if="module.sensitive" class="security-note">
                密钥内容仅保留指纹摘要，详情明文展示需后续权限和审计确认。
            </span>
        </div>

        <BaseTable
            v-model:page="page"
            v-model:page-size="pageSize"
            :loading="loading"
            :rows="pagedRows"
            :columns="module.columns"
            :total="filteredRows.length"
            @selection-change="selectedRows = $event"
            @view="openDialog('查看', $event)"
            @edit="openDialog('编辑', $event)"
            @delete="handleDelete"
        />

        <BaseDialog v-model="dialogVisible" :title="dialogTitle" :width="module.dialogWidth || '700px'">
            <el-alert
                v-if="module.sensitive"
                type="warning"
                show-icon
                :closable="false"
                title="敏感信息默认脱敏"
                description="后续接入后端权限、二次确认和审计后，再提供密钥内容查看流程。"
            />
            <el-descriptions :column="2" border class="dialog-descriptions">
                <el-descriptions-item
                    v-for="column in module.columns"
                    :key="column.prop"
                    :label="column.label"
                >
                    {{ activeRow?.[column.prop] ?? '待接入表单字段' }}
                </el-descriptions-item>
            </el-descriptions>
        </BaseDialog>
    </PageContainer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import BaseDialog from '@/components/BaseDialog/index.vue';
import BaseSearch from '@/components/BaseSearch/index.vue';
import BaseTable from '@/components/BaseTable/index.vue';
import PageContainer from '@/components/PageContainer/index.vue';
import { getCrudModule } from '@/constants/adminModules';

const props = defineProps<{
    moduleKey: string;
}>();

const module = computed(() => getCrudModule(props.moduleKey));
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const page = ref(1);
const pageSize = ref(10);
const selectedRows = ref<Array<Record<string, unknown>>>([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const activeRow = ref<Record<string, unknown> | null>(null);

const filteredRows = computed(() => {
    const keyword = String(query.keyword || query.merchantNo || query.account || '').trim().toLowerCase();
    const status = query.status;
    return module.value.seedRows.filter((row) => {
        const matchKeyword = !keyword || JSON.stringify(row).toLowerCase().includes(keyword);
        const matchStatus = !status || row.status === status;
        return matchKeyword && matchStatus;
    }) as Array<Record<string, unknown>>;
});

const pagedRows = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredRows.value.slice(start, start + pageSize.value);
});

watch(
    () => props.moduleKey,
    () => {
        handleReset();
    },
);

function handleSearch() {
    loading.value = true;
    window.setTimeout(() => {
        page.value = 1;
        loading.value = false;
    }, 220);
}

function handleReset() {
    Object.keys(query).forEach((key) => {
        query[key] = '';
    });
    page.value = 1;
    selectedRows.value = [];
}

function openDialog(action: string, row?: Record<string, unknown>) {
    activeRow.value = row || selectedRows.value[0] || null;
    dialogTitle.value = `${module.value.title} - ${action}`;
    dialogVisible.value = true;
}

async function handleDelete(row?: Record<string, unknown>) {
    const target = row || selectedRows.value[0];
    if (!target) {
        return;
    }
    await ElMessageBox.confirm('当前页面尚未接入删除接口，后续需接入权限校验和真实接口。', '操作确认', {
        type: 'warning',
    }).catch(() => undefined);
    ElMessage.info('删除接口待接入');
}
</script>
