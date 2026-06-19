<template>
  <div class="app-container">
    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
      <el-form-item :label="$t('common.keyword')" prop="keyword"><el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'base:currency:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!sel.length || sel.length !== 1" @click="handleUpdate(sel[0])" v-hasPermi="'base:currency:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel[0])" v-hasPermi="'base:currency:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'base:currency:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="alpha3Code" :label="$t('base.currency.alphabeticCode')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="numericCode" :label="$t('base.currency.numericCode')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="currencySymbol" :label="$t('base.currency.symbol')" width="70" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="chineseName" :label="$t('base.currency.chineseName')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="englishName" :label="$t('base.currency.englishName')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="fractionDigits" :label="$t('base.currency.minorUnit')" width="80" align="center" />
      <el-table-column prop="minimumAmount" :label="$t('base.currency.minAmount')" width="100" align="center" />
      <el-table-column :label="$t('common.status')" width="80" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'base:currency:changeStatus'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Edit" @click="handleUpdate(row)" v-hasPermi="'base:currency:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'base:currency:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.currency.alphabeticCode')" prop="alpha3Code"><el-input v-model="form.alpha3Code" maxlength="3" placeholder="USD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.currency.numericCode')"><el-input v-model="form.numericCode" maxlength="3" placeholder="840" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('base.currency.chineseName')" prop="chineseName"><el-input v-model="form.chineseName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.currency.englishName')" prop="englishName"><el-input v-model="form.englishName" maxlength="128" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.currency.symbol')"><el-input v-model="form.currencySymbol" maxlength="16" placeholder="$" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item :label="$t('base.currency.minorUnit')"><el-input-number v-model="form.fractionDigits" :min="-1" :max="8" controls-position="right" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.currency.minorUnitValue')"><el-input-number v-model="form.minorUnitMultiplier" :min="1" controls-position="right" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.currency.minAmount')"><el-input-number v-model="form.minimumAmount" :precision="6" :min="0" controls-position="right" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
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
import { searchCurrencies, createCurrency, updateCurrency, changeCurrencyStatus, deleteCurrency, exportCurrencies, type IsoCurrency } from '@/api/base/currency';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<IsoCurrency[]>([]); const sel = ref<IsoCurrency[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ keyword: '', status: undefined as number | undefined });

const open = ref(false); const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const emptyForm = (): IsoCurrency & Record<string, any> => ({ id: 0, alpha3Code: '', numericCode: '', currencySymbol: '', chineseName: '', englishName: '', fractionDigits: 2, minorUnitMultiplier: 100, minimumAmount: 0.01, status: 1 });
const form = reactive(emptyForm());
const rules: FormRules = {
  alpha3Code: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  chineseName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
};

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const r = await searchCurrencies({ pageNo: page.value, pageSize: pageSize.value, keyword: query.keyword || undefined, status: query.status });
    rows.value = r.records; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.keyword = ''; query.status = undefined; handleSearch(); }

function handleAdd() {
  formMode.value = 'create'; Object.assign(form, emptyForm());
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
function handleUpdate(row: IsoCurrency) {
  formMode.value = 'edit'; Object.assign(form, { ...emptyForm(), ...row });
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
async function submit() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return;
  try {
    if (formMode.value === 'create') await createCurrency(form); else await updateCurrency(form.id, form);
    ElMessage.success(t('common.saveSuccess')); open.value = false; loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function toggleStatus(row: IsoCurrency) {
  try { await changeCurrencyStatus(row.id, row.status === 1 ? 0 : 1); ElMessage.success(t('common.success')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); }
}
async function handleDelete(row: IsoCurrency) {
  try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.chineseName || row.englishName }), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await deleteCurrency(row.id); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleExport() {
  try {
    await exportCurrencies();
    ElMessage.success(t('common.export'));
  } catch { ElMessage.error(t('common.loadFailed')); }
}
</script>
