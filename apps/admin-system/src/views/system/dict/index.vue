<template>
  <div class="app-container">
    <div class="page-header">
      <div>
        <h1>{{ $t('route.SystemDict') }}</h1>
        <p>{{ $t('system.config.description') }}</p>
      </div>
      <el-tag type="success" size="small">{{ $t('system.config.apiConnected') }}</el-tag>
    </div>

    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="82px">
      <el-form-item :label="$t('system.config.dictName')" prop="dictName"><el-input v-model="query.dictName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('system.config.dictType')" prop="dictType"><el-input v-model="query.dictType" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('system.config.bizDomain')" prop="bizDomain"><el-input v-model="query.bizDomain" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'system:dict:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!sel.length || sel.length !== 1" @click="handleUpdate(sel[0])" v-hasPermi="'system:dict:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel[0])" v-hasPermi="'system:dict:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'system:dict:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Refresh" size="small" @click="handleRefreshCache" v-hasPermi="'system:dict:refresh'">{{ $t('system.config.refreshCache') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="dictType" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="dictName" :label="$t('system.config.dictName')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="dictType" :label="$t('system.config.dictType')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="bizDomain" :label="$t('system.config.bizDomain')" min-width="120" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.status')" width="90" align="center">
        <template #default="{ row }"><BaseStatusTag :value="row.status === 1 ? 'ENABLED' : 'DISABLED'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.createTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.createdAt" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="300" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Tickets" @click="openDictItems(row)" v-hasPermi="'system:dictData:list'">{{ $t('system.dictData.dictItems') }}</el-button>
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button>
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
        <el-form-item :label="$t('system.config.bizDomain')" prop="bizDomain"><el-input v-model="form.bizDomain" maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
        <el-form-item :label="$t('common.remark')" prop="remark"><el-input v-model="form.remark" type="textarea" maxlength="500" :placeholder="$t('common.pleaseInput')" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <DetailDescriptions
      v-model:visible="detailVisible"
      :title="$t('common.detail')"
      :data="detailData"
      :items="detailItems"
      :column="1"
    >
      <template #cell-status="{ data }">
        <BaseStatusTag :value="Number(data?.status) === 1 ? 'ENABLED' : 'DISABLED'" />
      </template>
      <template #cell-createdAt="{ data }">
        <BaseDateTime :value="String(data?.createdAt || '')" />
      </template>
    </DetailDescriptions>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download, Tickets, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchDictTypes, createDictType, updateDictType, deleteDictType, exportDictTypes, refreshDictCache, type SysDictType } from '@/api/system/dict';

const { t } = useI18n();
const router = useRouter();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<SysDictType[]>([]); const sel = ref<SysDictType[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ dictName: '', dictType: '', bizDomain: '', status: undefined as number | undefined });

const open = ref(false); const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const form = reactive({ dictName: '', dictType: '', bizDomain: '', status: 1, remark: '' });
const rules: FormRules = {
  dictName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  dictType: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
};
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const detailItems = computed(() => [
  { prop: 'dictName', label: t('system.config.dictName') },
  { prop: 'dictType', label: t('system.config.dictType') },
  { prop: 'bizDomain', label: t('system.config.bizDomain') },
  { prop: 'status', label: t('common.status') },
  { prop: 'remark', label: t('common.remark') },
  { prop: 'createdAt', label: t('common.createTime') },
]);

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const r = await searchDictTypes({
      pageNo: page.value,
      pageSize: pageSize.value,
      dictName: query.dictName || undefined,
      dictType: query.dictType || undefined,
      bizDomain: query.bizDomain || undefined,
      status: query.status,
    });
    rows.value = r.records as unknown as SysDictType[]; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.dictName = ''; query.dictType = ''; query.bizDomain = ''; query.status = undefined; handleSearch(); }

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
async function handleDelete(row: SysDictType) {
  try { await ElMessageBox.confirm(t('system.dictData.dictTypeDeleteConfirm', { name: row.dictName }), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await deleteDictType(row.dictType); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleRefreshCache() { try { await refreshDictCache(); ElMessage.success(t('common.success')); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); } }
async function handleExport() {
  try {
    const r = await exportDictTypes({
      pageNo: page.value,
      pageSize: pageSize.value,
      dictName: query.dictName || undefined,
      dictType: query.dictType || undefined,
      bizDomain: query.bizDomain || undefined,
      status: query.status,
    });
    ElMessage.success(`${t('common.export')} ${r.records.length}`);
  } catch (e: any) {
    ElMessage.error(e?.message || t('common.loadFailed'));
  }
}

function openDictItems(row: SysDictType) {
  router.push({
    path: '/system/dict-data',
    query: {
      dictType: row.dictType,
    },
  });
}

function openDetail(row: SysDictType) {
  detailData.value = row as unknown as Record<string, unknown>;
  detailVisible.value = true;
}
</script>
