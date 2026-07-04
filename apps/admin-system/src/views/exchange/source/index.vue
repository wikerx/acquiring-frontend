<template>
    <div class="app-container exchange-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('common.keyword')">
                <el-input v-model="query.keyword" :placeholder="$t('exchange.placeholders.sourceKeyword')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.sourceType')">
                <el-select v-model="query.sourceType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.sourceStatus" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('common.enable')" :value="1" />
                    <el-option :label="$t('common.disable')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'exchange:source:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'exchange:source:edit'">{{ $t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'exchange:source:remove'">{{ $t('common.delete') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'exchange:source:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="sourceCode" :label="$t('exchange.fields.sourceCode')" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="sourceName" :label="$t('exchange.fields.sourceName')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('exchange.fields.type')" width="100" align="center"><template #default="{ row }">{{ optionLabel(sourceTypeOptions, row.sourceType) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.defaultSource')" width="80" align="center"><template #default="{ row }">{{ yesNoText(translate, row.defaultSource) }}</template></el-table-column>
            <el-table-column prop="priority" :label="$t('exchange.fields.priority')" width="90" align="center" />
            <el-table-column prop="timeoutSeconds" :label="$t('exchange.fields.timeoutSecondsShort')" width="105" align="center" />
            <el-table-column :label="$t('exchange.fields.lastFetchTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.lastFetchTime" /></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.fetchStatus')" width="110" align="center"><template #default="{ row }"><el-tag v-if="row.lastFetchStatus" size="small" :type="statusType(row.lastFetchStatus)">{{ optionLabel(fetchStatusOptions, row.lastFetchStatus) }}</el-tag><span v-else>-</span></template></el-table-column>
            <el-table-column :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.sourceStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'exchange:source:status'" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.updateTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:source:detail'">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'exchange:source:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'exchange:source:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="$t('exchange.source.detailTitle')" v-model="detailVisible" width="680px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="$t('exchange.fields.sourceCode')">{{ detailRow.sourceCode }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.sourceName')">{{ detailRow.sourceName }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.sourceType')">{{ optionLabel(sourceTypeOptions, detailRow.sourceType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.requestUrl')">{{ detailRow.requestUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.defaultSource')">{{ yesNoText(translate, detailRow.defaultSource) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.priority')">{{ detailRow.priority }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.timeoutSeconds')">{{ secondsText(translate, detailRow.timeoutSeconds) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag size="small" :type="statusType(detailRow.sourceStatus)">{{ statusText(translate, detailRow.sourceStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.lastFetchTime')"><BaseDateTime :value="detailRow.lastFetchTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.fetchStatus')">{{ optionLabel(fetchStatusOptions, detailRow.lastFetchStatus) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="center-dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? $t('exchange.source.addTitle') : $t('exchange.source.editTitle')" v-model="formVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" size="small">
                <el-form-item :label="$t('exchange.fields.sourceCode')" prop="sourceCode"><el-input v-model.trim="form.sourceCode" :disabled="formMode === 'edit'" maxlength="64" placeholder="BOC" @input="form.sourceCode = form.sourceCode.toUpperCase()" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.sourceName')" prop="sourceName"><el-input v-model.trim="form.sourceName" maxlength="128" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.sourceType')" prop="sourceType"><el-select v-model="form.sourceType" style="width:100%"><el-option v-for="item in sourceTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="$t('exchange.fields.requestUrl')"><el-input v-model.trim="form.requestUrl" maxlength="512" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.defaultSource')"><el-switch v-model="form.defaultSource" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.priority')"><el-input-number v-model="form.priority" :min="1" :max="9999" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.timeoutSecondsShort')"><el-input-number v-model="form.timeoutSeconds" :min="1" :max="300" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('common.status')" prop="sourceStatus"><el-select v-model="form.sourceStatus" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
                <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Download, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { createExchangeSource, deleteExchangeSource, exportExchangeSources, getExchangeSource, searchExchangeSources, updateExchangeSource, updateExchangeSourceStatus, type ExchangeRateSource } from '@/api/exchange';
import { fetchStatusOptions as buildFetchStatusOptions, optionLabel, secondsText, sourceTypeOptions as buildSourceTypeOptions, statusText, statusType, yesNoText } from '../shared';

const { t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeRateSource[]>([]);
const selectedRows = ref<ExchangeRateSource[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ExchangeRateSource | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();

const query = reactive({
    keyword: '',
    sourceType: '',
    sourceStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    sourceCode: '',
    sourceName: '',
    sourceType: 'WEB',
    requestUrl: '',
    defaultSource: 0,
    priority: 100,
    timeoutSeconds: 10,
    sourceStatus: 1,
    remark: '',
});

const form = reactive(emptyForm());
const sourceTypeOptions = computed(() => buildSourceTypeOptions(translate));
const fetchStatusOptions = computed(() => buildFetchStatusOptions(translate));
const rules = computed<FormRules>(() => ({
    sourceCode: [{ required: true, message: t('exchange.validation.sourceCodeRequired'), trigger: 'blur' }],
    sourceName: [{ required: true, message: t('exchange.validation.sourceNameRequired'), trigger: 'blur' }],
    sourceType: [{ required: true, message: t('exchange.validation.sourceTypeRequired'), trigger: 'change' }],
    sourceStatus: [{ required: true, message: t('exchange.validation.statusRequired'), trigger: 'change' }],
}));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await searchExchangeSources({ pageNo: page.value, pageSize: pageSize.value, ...query });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.keyword = '';
    query.sourceType = '';
    query.sourceStatus = undefined;
    handleSearch();
}

async function openDetail(row: ExchangeRateSource) {
    detailRow.value = await getExchangeSource(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: ExchangeRateSource) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {});
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (formMode.value === 'create') {
        await createExchangeSource(form);
    } else {
        await updateExchangeSource(form.id, form);
    }
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ExchangeRateSource) {
    await updateExchangeSourceStatus(row.id, row.sourceStatus === 1 ? 0 : 1);
    ElMessage.success(t('common.success'));
    loadData();
}

async function handleDelete(target?: ExchangeRateSource | ExchangeRateSource[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('exchange.source.deleteConfirm', { name: targets.map((item) => item.sourceName).join('、') }), t('common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    await Promise.all(targets.map((item) => deleteExchangeSource(item.id)));
    ElMessage.success(t('common.deleteSuccess'));
    loadData();
}

async function handleExport() {
    await exportExchangeSources({ pageNo: page.value, pageSize: pageSize.value, ...query });
}
</script>

<style scoped>
.center-dialog-footer {
    display: flex;
    justify-content: center;
}
</style>
