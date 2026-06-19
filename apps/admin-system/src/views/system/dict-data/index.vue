<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ pageTitle }}</h1>
                <p>{{ $t('system.dictData.description') }}</p>
            </div>
            <el-button :icon="Back" @click="goBack">{{ $t('common.back') }}</el-button>
        </div>

        <el-card shadow="never" class="dict-summary-card">
            <el-descriptions :column="4" border size="small">
                <el-descriptions-item :label="$t('system.config.dictName')">{{ currentDict?.dictName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.config.dictType')">{{ currentDict?.dictType || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('system.config.bizDomain')">{{ currentDict?.bizDomain || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')">
                    <BaseStatusTag :value="currentDict?.status === 1 ? 'ENABLED' : 'DISABLED'" />
                </el-descriptions-item>
            </el-descriptions>
        </el-card>

        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="92px">
            <el-form-item :label="$t('system.dictData.dictLabel')" prop="dictLabel">
                <el-input v-model="query.dictLabel" :placeholder="$t('system.dictData.placeholders.dictLabel')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('system.dictData.dictValue')" prop="dictValue">
                <el-input v-model="query.dictValue" :placeholder="$t('system.dictData.placeholders.dictValue')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('system.dictData.locale')" prop="locale">
                <el-select v-model="query.locale" :placeholder="$t('system.dictData.placeholders.locale')" clearable>
                    <el-option v-for="item in localeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('common.enable')" :value="1" />
                    <el-option :label="$t('common.disable')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="handleDataAdd" v-hasPermi="'system:dictData:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="handleDataUpdate(selectedRows[0])" v-hasPermi="'system:dictData:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDataDelete(selectedRows[0])" v-hasPermi="'system:dictData:remove'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="warning" plain :icon="Download" size="small" @click="handleDataExport" v-hasPermi="'system:dictData:export'">{{ $t('common.export') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" />
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="dictLabel" :label="$t('system.dictData.dictLabel')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="dictValue" :label="$t('system.dictData.dictValue')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('system.dictData.locale')" min-width="150" align="center">
                <template #default="{ row }">{{ formatLocaleLabel(row.locale) }}</template>
            </el-table-column>
            <el-table-column prop="dictSort" :label="$t('common.sort')" width="90" align="center" />
            <el-table-column :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="row.status === 1 ? 'ENABLED' : 'DISABLED'" />
                </template>
            </el-table-column>
            <el-table-column prop="remark" :label="$t('common.remark')" min-width="220" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('common.createTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="240" align="center" fixed="right">
                <template #default="{ row }">
                    <div class="table-operation-group">
                        <el-button size="small" type="primary" link :icon="View" @click="handleDataDetail(row)" v-hasPermi="'system:dictData:query'">{{ $t('common.detail') }}</el-button>
                        <el-button size="small" type="primary" link :icon="Edit" @click="handleDataUpdate(row)" v-hasPermi="'system:dictData:edit'">{{ $t('common.edit') }}</el-button>
                        <el-button size="small" type="primary" link :icon="Delete" @click="handleDataDelete(row)" v-hasPermi="'system:dictData:remove'">{{ $t('common.delete') }}</el-button>
                    </div>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="loadData"
                @current-change="loadData"
            />
        </div>

        <DetailDescriptions
            v-model:visible="detailVisible"
            :title="$t('system.dictData.detailTitle')"
            :data="detailData"
            :items="detailItems"
            :column="1"
        >
            <template #cell-locale="{ data }">
                {{ formatLocaleLabel(String(data?.locale || '')) }}
            </template>
            <template #cell-status="{ data }">
                <BaseStatusTag :value="Number(data?.status) === 1 ? 'ENABLED' : 'DISABLED'" />
            </template>
            <template #cell-createdAt="{ data }">
                <BaseDateTime :value="String(data?.createdAt || '')" />
            </template>
        </DetailDescriptions>

        <el-dialog :title="dialogTitle" v-model="dialogOpen" width="620px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="110px" style="padding:0 20px">
                <el-form-item :label="$t('system.config.dictName')">
                    <el-input :model-value="currentDict?.dictName || ''" disabled />
                </el-form-item>
                <el-form-item :label="$t('system.config.dictType')">
                    <el-input :model-value="currentDict?.dictType || ''" disabled />
                </el-form-item>
                <el-form-item :label="$t('system.dictData.dictLabel')" prop="dictLabel">
                    <el-input v-model="form.dictLabel" :disabled="formMode === 'detail'" :placeholder="$t('system.dictData.placeholders.dictLabel')" maxlength="100" />
                </el-form-item>
                <el-form-item :label="$t('system.dictData.dictValue')" prop="dictValue">
                    <el-input v-model="form.dictValue" :disabled="formMode !== 'create'" :placeholder="$t('system.dictData.placeholders.dictValue')" maxlength="100" />
                </el-form-item>
                <el-form-item :label="$t('system.dictData.locale')" prop="locale">
                    <el-select v-model="form.locale" :disabled="formMode !== 'create'" :placeholder="$t('system.dictData.placeholders.locale')" style="width:100%">
                        <el-option v-for="item in localeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('common.sort')" prop="dictSort">
                    <el-input-number v-model="form.dictSort" :disabled="formMode === 'detail'" :min="0" style="width:100%" />
                </el-form-item>
                <el-form-item :label="$t('common.status')" prop="status">
                    <el-select v-model="form.status" :disabled="formMode === 'detail'" style="width:100%">
                        <el-option :label="$t('common.enable')" :value="1" />
                        <el-option :label="$t('common.disable')" :value="0" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('common.remark')" prop="remark">
                    <el-input v-model="form.remark" :disabled="formMode === 'detail'" type="textarea" maxlength="500" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button v-if="formMode !== 'detail'" type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="dialogOpen = false">{{ formMode === 'detail' ? $t('common.close') : $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Back, Delete, Download, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
    createDictData,
    deleteDictDataById,
    exportDictData,
    getDictDataDetailById,
    searchDictData,
    searchDictTypes,
    updateDictDataById,
    type SysDictData,
    type SysDictType,
} from '@/api/system/dict';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const showSearch = ref(true);
const loading = ref(false);
const rows = ref<SysDictData[]>([]);
const selectedRows = ref<SysDictData[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const currentDict = ref<SysDictType | null>(null);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const editingIdentity = ref<{ id?: number }>({});

const query = reactive({
    dictLabel: '',
    dictValue: '',
    locale: undefined as string | undefined,
    status: undefined as number | undefined,
});

const dialogOpen = ref(false);
const formMode = ref<'create' | 'edit' | 'detail'>('create');
const formRef = ref<FormInstance>();
const form = reactive({
    dictLabel: '',
    dictValue: '',
    locale: 'zh-CN',
    dictSort: 1,
    listClass: 'primary',
    extraJson: '',
    isDefault: 0,
    status: 1,
    remark: '',
});

const localeOptions = computed(() => [
    { label: t('system.dictData.localeOptions.zhCN'), value: 'zh-CN' },
    { label: t('system.dictData.localeOptions.enUS'), value: 'en-US' },
]);

const pageTitle = computed(() => {
    if (!currentDict.value) {
        return t('system.dictData.title');
    }
    return t('system.dictData.pageTitle', {
        dictName: currentDict.value.dictName,
        dictType: currentDict.value.dictType,
    });
});

const dialogTitle = computed(() => {
    if (formMode.value === 'create') {
        return t('system.dictData.addTitle');
    }
    if (formMode.value === 'edit') {
        return t('system.dictData.editTitle');
    }
    return t('system.dictData.detailTitle');
});

const detailItems = computed(() => [
    { prop: 'dictLabel', label: t('system.dictData.dictLabel') },
    { prop: 'dictValue', label: t('system.dictData.dictValue') },
    { prop: 'locale', label: t('system.dictData.locale') },
    { prop: 'dictSort', label: t('common.sort') },
    { prop: 'status', label: t('common.status') },
    { prop: 'remark', label: t('common.remark') },
    { prop: 'createdAt', label: t('common.createTime') },
]);

const rules: FormRules = {
    dictLabel: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    dictValue: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    locale: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
};

watch([page, pageSize], () => {
    loadData();
});

watch(
    () => route.query.dictType,
    async () => {
        await loadCurrentDict();
    },
);

onMounted(async () => {
    await loadCurrentDict();
});

async function loadCurrentDict() {
    const dictType = getRouteDictType();
    if (!dictType) {
        ElMessage.error(t('system.dictData.missingContext'));
        goBack();
        return;
    }
    try {
        const result = await searchDictTypes({ pageNo: 1, pageSize: 1, dictType });
        currentDict.value = result.records[0] || null;
        if (!currentDict.value) {
            ElMessage.error(t('system.dictData.dictNotFound'));
            goBack();
            return;
        }
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

async function loadData() {
    const dictType = currentDict.value?.dictType;
    if (!dictType) {
        return;
    }
    loading.value = true;
    try {
        const result = await searchDictData({
            pageNo: page.value,
            pageSize: pageSize.value,
            dictType,
            dictLabel: query.dictLabel || undefined,
            dictValue: query.dictValue || undefined,
            locale: query.locale || undefined,
            status: query.status,
        });
        rows.value = result.records as SysDictData[];
        total.value = result.total;
    } catch (error) {
        rows.value = [];
        total.value = 0;
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
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
    query.dictLabel = '';
    query.dictValue = '';
    query.locale = undefined;
    query.status = undefined;
    handleSearch();
}

function goBack() {
    router.push('/system/dict');
}

function formatLocaleLabel(locale?: string) {
    if (locale === 'zh-CN') {
        return t('system.dictData.localeOptions.zhCN');
    }
    if (locale === 'en-US') {
        return t('system.dictData.localeOptions.enUS');
    }
    return locale || '-';
}

function handleDataAdd() {
    formMode.value = 'create';
    resetForm();
    dialogOpen.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleDataUpdate(row: SysDictData) {
    formMode.value = 'edit';
    editingIdentity.value = { id: row.id };
    fillForm(row);
    dialogOpen.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function handleDataDetail(row: SysDictData) {
    if (!row.id) {
        detailData.value = { ...row } as Record<string, unknown>;
        detailVisible.value = true;
        return;
    }
    try {
        detailData.value = await getDictDataDetailById(row.id) as unknown as Record<string, unknown>;
        detailVisible.value = true;
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

async function submitForm() {
    if (!currentDict.value) {
        return;
    }
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const payload = {
        dictType: currentDict.value.dictType,
        dictLabel: form.dictLabel.trim(),
        dictValue: form.dictValue.trim(),
        locale: form.locale,
        dictSort: form.dictSort,
        listClass: form.listClass,
        extraJson: form.extraJson,
        isDefault: form.isDefault,
        status: form.status,
        remark: form.remark,
    };
    try {
        if (formMode.value === 'create') {
            await createDictData(payload);
        } else {
            if (!editingIdentity.value.id) {
                throw new Error(t('common.loadFailed'));
            }
            await updateDictDataById(editingIdentity.value.id, payload);
        }
        ElMessage.success(t('common.saveSuccess'));
        dialogOpen.value = false;
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function handleDataDelete(row?: SysDictData) {
    const target = row || selectedRows.value[0];
    if (!target) {
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('system.dictData.deleteConfirm', { name: target.dictLabel }),
            t('common.delete'),
            { type: 'warning' },
        );
    } catch {
        return;
    }
    try {
        if (!target.id) {
            throw new Error(t('common.loadFailed'));
        }
        await deleteDictDataById(target.id);
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function handleDataExport() {
    if (!currentDict.value) {
        return;
    }
    try {
        const result = await exportDictData({
            pageNo: page.value,
            pageSize: pageSize.value,
            dictType: currentDict.value.dictType,
            dictLabel: query.dictLabel || undefined,
            dictValue: query.dictValue || undefined,
            locale: query.locale || undefined,
            status: query.status,
        });
        ElMessage.success(`${t('common.export')} ${result.records.length}`);
    } catch (error) {
        ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    }
}

function resetForm() {
    editingIdentity.value = {};
    Object.assign(form, {
        dictLabel: '',
        dictValue: '',
        locale: 'zh-CN',
        dictSort: 1,
        listClass: 'primary',
        extraJson: '',
        isDefault: 0,
        status: 1,
        remark: '',
    });
}

function fillForm(row: SysDictData) {
    Object.assign(form, {
        dictLabel: row.dictLabel || '',
        dictValue: row.dictValue || '',
        locale: row.locale || 'zh-CN',
        dictSort: row.dictSort ?? 1,
        listClass: row.listClass || 'primary',
        extraJson: row.extraJson || '',
        isDefault: row.isDefault ?? 0,
        status: row.status ?? 1,
        remark: row.remark || '',
    });
}

function getRouteDictType() {
    return typeof route.query.dictType === 'string' ? route.query.dictType : '';
}
</script>

<style scoped>
.dict-summary-card {
    margin-bottom: 16px;
}

.table-operation-group {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: nowrap;
    white-space: nowrap;
}
</style>
