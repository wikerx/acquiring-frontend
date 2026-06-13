<template>
    <div class="app-container">
        <!-- 搜索表单 -->
        <el-form
            :model="query"
            :inline="true"
            size="small"
            v-show="showSearch"
            class="search-form"
            label-width="68px"
        >
            <el-form-item
                v-for="field in module.searchFields"
                :key="field.prop"
                :label="$t(field.label)"
                :prop="field.prop"
            >
                <el-input
                    v-if="!field.type || field.type === 'text'"
                    v-model="query[field.prop]"
                    :placeholder="field.placeholder || $t('common.pleaseInput')"
                    clearable
                    @keyup.enter="handleSearch"
                />
                <el-select
                    v-else-if="field.type === 'select'"
                    v-model="query[field.prop]"
                    :placeholder="field.placeholder || $t('common.pleaseSelect')"
                    clearable
                >
                    <el-option
                        v-for="option in field.options"
                        :key="String(option.value)"
                        :label="$t(option.label)"
                        :value="option.value"
                    />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <!-- 工具栏 -->
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="openDialog($t('common.add'))" v-hasPermi="permPrefix + ':add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="!selectedRows.length || selectedRows.length !== 1" @click="openDialog($t('common.edit'))" v-hasPermi="permPrefix + ':edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete()" v-hasPermi="permPrefix + ':delete'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table
            v-loading="loading"
            :data="pagedRows"
            row-key="code"
            @selection-change="selectedRows = $event"
        >
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column
                v-for="column in module.columns"
                :key="column.prop"
                :prop="column.prop"
                :label="$t(column.label)"
                :min-width="column.minWidth || column.width || 140"
                :width="column.width"
                align="center"
                :show-overflow-tooltip="true"
            />
            <el-table-column :label="$t('common.operation')" align="center" width="190" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDialog($t('common.view'), row)">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openDialog($t('common.edit'), row)" v-hasPermi="permPrefix + ':edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="permPrefix + ':delete'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="filteredRows.length > 0">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="filteredRows.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
            />
        </div>

        <el-dialog :title="dialogTitle" v-model="dialogVisible" :width="module.dialogWidth || '600px'" append-to-body destroy-on-close>
            <el-alert
                v-if="module.sensitive"
                type="warning"
                show-icon
                :closable="false"
                :title="$t('common.sensitiveTitle')"
                :description="$t('common.sensitiveDesc')"
                style="margin-bottom:12px"
            />
            <el-descriptions :column="2" border>
                <el-descriptions-item
                    v-for="column in module.columns"
                    :key="column.prop"
                    :label="$t(column.label)"
                >
                    {{ activeRow?.[column.prop] ?? '-' }}
                </el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <div class="dialog-footer">
                    <el-button @click="dialogVisible = false">{{ $t('common.close') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Search, Refresh, Plus, Edit, Delete, View } from '@element-plus/icons-vue';
import { getCrudModule } from '@/constants/adminModules';
import RightToolbar from '@/components/RightToolbar/index.vue';
const { t } = useI18n();

const props = defineProps<{
    moduleKey: string;
}>();

const module = computed(() => getCrudModule(props.moduleKey));
const permPrefix = computed(() => {
    const permission = module.value.permission || '';
    const lastColon = permission.lastIndexOf(':');
    return lastColon > 0 ? permission.substring(0, lastColon) : permission;
});
const showSearch = ref(true);
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
    try {
        await ElMessageBox.confirm(t('common.deleteApiPending'), t('common.operationConfirm'), {
            type: 'warning',
        });
    } catch { /* cancelled */ }
    ElMessage.info(t('common.deleteApiPendingInfo'));
}
</script>
