<template>
  <div class="app-container">
    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
      <el-form-item :label="$t('system.config.configName')" prop="configName"><el-input v-model="query.configName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('system.config.configGroup')" prop="configGroup"><el-input v-model="query.configGroup" :placeholder="$t('common.pleaseInput')" clearable /></el-form-item>
      <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:config:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!sel.length || sel.length !== 1" @click="handleUpdate(sel[0])" v-hasPermi="'system:config:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel[0])" v-hasPermi="'system:config:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:config:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Refresh" size="small" @click="handleRefreshCache" v-hasPermi="'system:config:refresh'">刷新缓存</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="configKey" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="configKey" :label="$t('system.config.configKey')" min-width="200" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="configName" :label="$t('system.config.configName')" min-width="180" :show-overflow-tooltip="true" />
      <el-table-column prop="configGroup" :label="$t('system.config.configGroup')" min-width="130" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('system.config.valueType')" width="100" align="center"><template #default="{ row }">{{ vt(row.valueType) }}</template></el-table-column>
      <el-table-column :label="$t('common.status')" width="80" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'system:config:edit'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.createTime')" min-width="160" align="center"><template #default="{ row }">{{ row.createdAt || '-' }}</template></el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'system:config:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'system:config:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
        <el-form-item :label="$t('system.config.configName')" prop="configName"><el-input v-model="form.configName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('system.config.configKey')" prop="configKey"><el-input v-model="form.configKey" maxlength="150" :placeholder="$t('common.pleaseInput')" :disabled="formMode === 'edit'" /></el-form-item>
        <el-form-item :label="$t('system.config.configValue')" prop="configValue"><el-input v-model="form.configValue" type="textarea" :rows="3" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('system.config.valueType')" prop="valueType"><el-select v-model="form.valueType" style="width:100%"><el-option label="String" :value="1" /><el-option label="Number" :value="2" /><el-option label="Boolean" :value="3" /><el-option label="JSON" :value="4" /></el-select></el-form-item>
        <el-form-item :label="$t('system.config.configGroup')" prop="configGroup"><el-input v-model="form.configGroup" maxlength="64" placeholder="system / merchant / payment" /></el-form-item>
        <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" :placeholder="$t('common.pleaseInput')" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchConfigs, saveConfig, updateConfig, deleteConfig, exportConfigs, refreshConfigCache, type SysConfig } from '@/api/system/config';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<SysConfig[]>([]); const sel = ref<SysConfig[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ configName: '', configGroup: '', status: undefined as number | undefined });

const open = ref(false); const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const form = reactive({ configName: '', configKey: '', configValue: '', valueType: 1, configGroup: '', status: 1, remark: '' });
const rules: FormRules = {
  configName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  configKey: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
};

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const r = await searchConfigs({ pageNo: page.value, pageSize: pageSize.value, configName: query.configName || undefined, configGroup: query.configGroup || undefined, status: query.status });
    rows.value = r.records as unknown as SysConfig[]; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.configName = ''; query.configGroup = ''; query.status = undefined; handleSearch(); }

function handleAdd() {
  formMode.value = 'create'; Object.assign(form, { configName: '', configKey: '', configValue: '', valueType: 1, configGroup: '', status: 1, remark: '' });
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
function handleUpdate(row: SysConfig) {
  formMode.value = 'edit'; Object.assign(form, { configName: row.configName || '', configKey: row.configKey || '', configValue: row.configValue || '', valueType: row.valueType ?? 1, configGroup: row.configGroup || '', status: row.status ?? 1, remark: row.remark || '' });
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
async function submit() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return;
  try {
    const payload = { configName: form.configName.trim(), configKey: form.configKey.trim(), configValue: form.configValue, valueType: form.valueType, configGroup: form.configGroup?.trim(), status: form.status, remark: form.remark?.trim() } as any;
    if (formMode.value === 'create') await saveConfig(payload); else await updateConfig(form.configKey.trim(), payload);
    ElMessage.success(t('common.saveSuccess')); open.value = false; loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function toggleStatus(row: SysConfig) {
  const ns = row.status === 1 ? 0 : 1;
  try { await updateConfig(row.configKey, { ...row, status: ns } as any); ElMessage.success(t('common.success')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); }
}
async function handleDelete(row: SysConfig) {
  try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.configName }), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await deleteConfig(row.configKey); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleExport() {
  try {
    await exportConfigs({ pageNo: page.value, pageSize: pageSize.value, configName: query.configName || undefined, configGroup: query.configGroup || undefined, status: query.status });
    ElMessage.success(t('common.export'));
  } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); }
}
async function handleRefreshCache() { try { await refreshConfigCache(); ElMessage.success(t('common.success')); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); } }

function vt(v: unknown) { return ({ 1: 'String', 2: 'Number', 3: 'Boolean', 4: 'JSON' } as Record<number, string>)[Number(v)] || '-'; }
</script>
