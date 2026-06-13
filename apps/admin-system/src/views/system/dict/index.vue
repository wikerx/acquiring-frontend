<template>
  <div class="app-container">
    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
      <el-form-item :label="$t('system.config.dictName')" prop="dictName"><el-input v-model="query.dictName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:dict:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!sel.length || sel.length !== 1" @click="handleUpdate(sel[0])" v-hasPermi="'system:dict:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel[0])" v-hasPermi="'system:dict:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:dict:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Refresh" size="small" @click="handleRefreshCache" v-hasPermi="'system:dict:refresh'">刷新缓存</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="dictType" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="dictType" :label="$t('system.config.dictType')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="dictName" :label="$t('system.config.dictName')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="bizDomain" :label="$t('system.config.bizDomain')" min-width="120" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.status')" width="80" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'system:dict:edit'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.createTime')" min-width="160" align="center"><template #default="{ row }">{{ row.createdAt || '-' }}</template></el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="260" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDataDrawer(row)" v-hasPermi="'system:dictData:list'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:dict:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" :disabled="row.systemBuiltin === 1" v-hasPermi="'system:dict:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
        <el-form-item :label="$t('system.config.dictName')" prop="dictName"><el-input v-model="form.dictName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('system.config.dictType')" prop="dictType"><el-input v-model="form.dictType" maxlength="100" :placeholder="$t('common.pleaseInput')" :disabled="formMode === 'edit'" /></el-form-item>
        <el-form-item :label="$t('system.config.bizDomain')" prop="bizDomain"><el-input v-model="form.bizDomain" maxlength="64" placeholder="system / merchant / payment" /></el-form-item>
        <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" :placeholder="$t('common.pleaseInput')" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <el-drawer v-model="dataDrawerOpen" :title="dataDrawerTitle" size="920px" append-to-body>
      <el-form :model="dataQuery" :inline="true" size="small" class="search-form" label-width="76px">
        <el-form-item :label="$t('system.config.dictLabel')"><el-input v-model="dataQuery.dictLabel" clearable :placeholder="$t('common.pleaseInput')" @keyup.enter="handleDataSearch" /></el-form-item>
        <el-form-item :label="$t('system.config.dictValue')"><el-input v-model="dataQuery.dictValue" clearable :placeholder="$t('common.pleaseInput')" @keyup.enter="handleDataSearch" /></el-form-item>
        <el-form-item :label="$t('common.status')"><el-select v-model="dataQuery.status" clearable :placeholder="$t('common.pleaseSelect')"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
        <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleDataSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetDataQuery">{{ $t('common.reset') }}</el-button></el-form-item>
      </el-form>
      <el-row :gutter="10" class="mb8">
        <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleDataAdd" v-hasPermi="'system:dictData:add'">{{ $t('common.add') }}</el-button></el-col>
        <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="dataSel.length !== 1" @click="handleDataUpdate(dataSel[0])" v-hasPermi="'system:dictData:edit'">{{ $t('common.edit') }}</el-button></el-col>
        <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!dataSel.length" @click="handleDataDelete(dataSel[0])" v-hasPermi="'system:dictData:remove'">{{ $t('common.delete') }}</el-button></el-col>
        <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleDataExport" v-hasPermi="'system:dictData:export'">{{ $t('common.export') }}</el-button></el-col>
      </el-row>
      <el-table v-loading="dataLoading" :data="dataRows" row-key="id" size="small" @selection-change="dataSel = $event">
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="dictLabel" :label="$t('system.config.dictLabel')" min-width="220" align="center" :show-overflow-tooltip="true" />
        <el-table-column prop="dictValue" :label="$t('system.config.dictValue')" min-width="180" align="center" :show-overflow-tooltip="true" />
        <el-table-column prop="locale" label="Locale" width="90" align="center" />
        <el-table-column prop="dictSort" :label="$t('common.sort')" width="80" align="center" />
        <el-table-column :label="$t('common.status')" width="80" align="center"><template #default="{ row }"><el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template></el-table-column>
        <el-table-column prop="remark" :label="$t('common.remark')" min-width="220" align="center" :show-overflow-tooltip="true" />
        <el-table-column :label="$t('common.operation')" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link :icon="View" @click="handleDataDetail(row)" v-hasPermi="'system:dictData:query'">{{ $t('common.detail') }}</el-button>
            <el-button size="small" type="primary" link :icon="Edit" @click="handleDataUpdate(row)" v-hasPermi="'system:dictData:edit'">{{ $t('common.edit') }}</el-button>
            <el-button size="small" type="primary" link :icon="Delete" @click="handleDataDelete(row)" v-hasPermi="'system:dictData:remove'">{{ $t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-show="dataTotal > 0"><el-pagination v-model:current-page="dataPage" v-model:page-size="dataPageSize" :total="dataTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadDictData" @current-change="loadDictData" /></div>
    </el-drawer>

    <el-dialog :title="dataDialogTitle" v-model="dataDialogOpen" width="620px" append-to-body destroy-on-close>
      <el-form ref="dataFormRef" :model="dataForm" :rules="dataRules" label-width="90px" style="padding:0 20px">
        <el-form-item :label="$t('system.config.dictLabel')" prop="dictLabel"><el-input v-model="dataForm.dictLabel" :disabled="dataFormMode === 'detail'" maxlength="100" /></el-form-item>
        <el-form-item :label="$t('system.config.dictValue')" prop="dictValue"><el-input v-model="dataForm.dictValue" :disabled="dataFormMode !== 'create'" maxlength="100" /></el-form-item>
        <el-form-item label="Locale" prop="locale"><el-input v-model="dataForm.locale" :disabled="dataFormMode !== 'create'" maxlength="16" /></el-form-item>
        <el-form-item :label="$t('common.sort')" prop="dictSort"><el-input-number v-model="dataForm.dictSort" :disabled="dataFormMode === 'detail'" :min="0" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="dataForm.status" :disabled="dataFormMode === 'detail'" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
        <el-form-item label="Extra JSON" prop="extraJson"><el-input v-model="dataForm.extraJson" :disabled="dataFormMode === 'detail'" type="textarea" :rows="3" /></el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark"><el-input v-model="dataForm.remark" :disabled="dataFormMode === 'detail'" type="textarea" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button v-if="dataFormMode !== 'detail'" type="primary" @click="submitData">{{ $t('common.confirm') }}</el-button><el-button @click="dataDialogOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchDictTypes, createDictType, updateDictType, deleteDictType, exportDictTypes, refreshDictCache, searchDictData, createDictData, updateDictData, deleteDictData, exportDictData, type SysDictType, type SysDictData } from '@/api/system/dict';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<SysDictType[]>([]); const sel = ref<SysDictType[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ dictName: '', status: undefined as number | undefined });

const open = ref(false); const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const form = reactive({ dictName: '', dictType: '', bizDomain: '', status: 1, remark: '' });
const rules: FormRules = {
  dictName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  dictType: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
};
const dataDrawerOpen = ref(false); const currentDict = ref<SysDictType>();
const dataDrawerTitle = computed(() => currentDict.value ? `${currentDict.value.dictName} / ${currentDict.value.dictType}` : '');
const dataLoading = ref(false); const dataRows = ref<SysDictData[]>([]); const dataSel = ref<SysDictData[]>([]);
const dataTotal = ref(0); const dataPage = ref(1); const dataPageSize = ref(10);
const dataQuery = reactive({ dictLabel: '', dictValue: '', status: undefined as number | undefined });
const dataDialogOpen = ref(false); const dataFormMode = ref<'create' | 'edit' | 'detail'>('create');
const dataFormRef = ref<FormInstance>();
const dataDialogTitle = computed(() => dataFormMode.value === 'create' ? t('common.add') : dataFormMode.value === 'edit' ? t('common.edit') : t('common.detail'));
const dataForm = reactive({ dictLabel: '', dictValue: '', locale: 'zh-CN', dictSort: 1, listClass: 'primary', extraJson: '', isDefault: 0, status: 1, remark: '' });
const dataRules: FormRules = {
  dictLabel: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  dictValue: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
};

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const r = await searchDictTypes({ pageNo: page.value, pageSize: pageSize.value, dictName: query.dictName || undefined, status: query.status });
    rows.value = r.records as unknown as SysDictType[]; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.dictName = ''; query.status = undefined; handleSearch(); }

function handleAdd() {
  formMode.value = 'create'; Object.assign(form, { dictName: '', dictType: '', bizDomain: '', status: 1, remark: '' });
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
function handleUpdate(row: SysDictType) {
  formMode.value = 'edit'; Object.assign(form, { dictName: row.dictName || '', dictType: row.dictType || '', bizDomain: row.bizDomain || '', status: row.status ?? 1, remark: row.remark || '' });
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
async function submit() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return;
  try {
    const payload = { dictName: form.dictName.trim(), dictType: form.dictType.trim(), bizDomain: form.bizDomain?.trim(), status: form.status, remark: form.remark?.trim() } as any;
    if (formMode.value === 'create') await createDictType(payload); else await updateDictType(form.dictType.trim(), payload);
    ElMessage.success(t('common.saveSuccess')); open.value = false; loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function toggleStatus(row: SysDictType) {
  const ns = row.status === 1 ? 0 : 1;
  try { await updateDictType(row.dictType || '', { dictName: row.dictName || '', dictType: row.dictType || '', status: ns } as any); ElMessage.success(t('common.success')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); }
}
async function handleDelete(row: SysDictType) {
  try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.dictName }), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await deleteDictType(row.dictType); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleExport() { try { const r = await exportDictTypes({ pageNo: page.value, pageSize: pageSize.value, dictName: query.dictName || undefined, status: query.status }); ElMessage.success(`${t('common.export')} ${r.records.length}`); } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); } }
async function handleRefreshCache() { try { await refreshDictCache(); ElMessage.success(t('common.success')); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); } }

async function openDataDrawer(row: SysDictType) {
  currentDict.value = row; dataDrawerOpen.value = true; dataPage.value = 1; dataQuery.dictLabel = ''; dataQuery.dictValue = ''; dataQuery.status = undefined; await loadDictData();
}
async function loadDictData() {
  if (!currentDict.value) return;
  dataLoading.value = true;
  try {
    const r = await searchDictData({ pageNo: dataPage.value, pageSize: dataPageSize.value, dictType: currentDict.value.dictType, dictLabel: dataQuery.dictLabel || undefined, dictValue: dataQuery.dictValue || undefined, status: dataQuery.status });
    dataRows.value = r.records as unknown as SysDictData[]; dataTotal.value = r.total;
  } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); } finally { dataLoading.value = false; }
}
function handleDataSearch() { dataPage.value = 1; loadDictData(); }
function resetDataQuery() { dataQuery.dictLabel = ''; dataQuery.dictValue = ''; dataQuery.status = undefined; handleDataSearch(); }
function resetDataForm(row?: SysDictData) {
  Object.assign(dataForm, { dictLabel: row?.dictLabel || '', dictValue: row?.dictValue || '', locale: row?.locale || 'zh-CN', dictSort: row?.dictSort ?? 1, listClass: row?.listClass || 'primary', extraJson: row?.extraJson || '', isDefault: row?.isDefault ?? 0, status: row?.status ?? 1, remark: row?.remark || '' });
}
function handleDataAdd() { dataFormMode.value = 'create'; resetDataForm(); dataDialogOpen.value = true; nextTick(() => dataFormRef.value?.clearValidate()); }
function handleDataUpdate(row: SysDictData) { dataFormMode.value = 'edit'; resetDataForm(row); dataDialogOpen.value = true; nextTick(() => dataFormRef.value?.clearValidate()); }
function handleDataDetail(row: SysDictData) { dataFormMode.value = 'detail'; resetDataForm(row); dataDialogOpen.value = true; }
async function submitData() {
  if (!currentDict.value) return;
  const v = await dataFormRef.value?.validate().catch(() => false); if (!v) return;
  const payload = { dictType: currentDict.value.dictType, dictLabel: dataForm.dictLabel.trim(), dictValue: dataForm.dictValue.trim(), locale: dataForm.locale || 'zh-CN', dictSort: dataForm.dictSort, listClass: dataForm.listClass, extraJson: dataForm.extraJson, isDefault: dataForm.isDefault, status: dataForm.status, remark: dataForm.remark } as any;
  try {
    if (dataFormMode.value === 'create') await createDictData(payload); else await updateDictData(currentDict.value.dictType, dataForm.dictValue, payload);
    ElMessage.success(t('common.saveSuccess')); dataDialogOpen.value = false; loadDictData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleDataDelete(row: SysDictData) {
  try { await ElMessageBox.confirm(t('common.confirmDelete'), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await deleteDictData(row.dictType, row.dictValue, row.locale); ElMessage.success(t('common.deleteSuccess')); loadDictData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleDataExport() {
  if (!currentDict.value) return;
  try { const r = await exportDictData({ pageNo: dataPage.value, pageSize: dataPageSize.value, dictType: currentDict.value.dictType, dictLabel: dataQuery.dictLabel || undefined, dictValue: dataQuery.dictValue || undefined, status: dataQuery.status }); ElMessage.success(`${t('common.export')} ${r.records.length}`); } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); }
}
</script>
