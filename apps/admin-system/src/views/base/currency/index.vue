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
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel)" v-hasPermi="'base:currency:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'base:currency:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <StandardTable table-key="base-currency" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column :label="$t('base.currency.logo')" width="88" align="center">
        <template #default="{ row }">
          <CurrencyDisplay
            :currency="row.alpha3Code"
            :icon-key="row.iconKey"
            :chinese-name="row.chineseName"
            :english-name="row.englishName"
            :currency-symbol="row.currencySymbol"
            icon-only
            size="sm"
          />
        </template>
      </el-table-column>
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
    </StandardTable>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogTitle" v-model="open" width="560px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" style="padding:0 20px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.currency.alphabeticCode')" prop="alpha3Code"><el-input v-model="form.alpha3Code" maxlength="3" placeholder="USD" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.currency.numericCode')"><el-input v-model="form.numericCode" maxlength="3" placeholder="840" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('base.currency.chineseName')" prop="chineseName"><el-input v-model="form.chineseName" maxlength="100" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.currency.englishName')" prop="englishName"><el-input v-model="form.englishName" maxlength="128" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.currency.logo')" prop="iconKey">
          <div class="currency-logo-editor">
            <div class="currency-logo-editor__preview">
              <CurrencyDisplay
                :currency="form.alpha3Code"
                :icon-key="form.iconKey"
                :chinese-name="form.chineseName"
                :english-name="form.englishName"
                :currency-symbol="form.currencySymbol"
                show-name
                size="lg"
                variant="soft"
              />
              <span>{{ $t('base.currency.logoPreview') }}</span>
            </div>
            <el-radio-group v-model="iconMode" size="small" @change="handleIconModeChange">
              <el-radio-button value="auto">{{ $t('base.currency.logoAuto') }}</el-radio-button>
              <el-radio-button value="flag">{{ $t('base.currency.logoFlag') }}</el-radio-button>
              <el-radio-button value="currency">{{ $t('base.currency.logoCurrency') }}</el-radio-button>
            </el-radio-group>
            <el-input
              v-if="iconMode === 'flag'"
              v-model="flagRegionCode"
              maxlength="2"
              :placeholder="$t('base.currency.logoRegionPlaceholder')"
              @input="syncFlagIconKey"
            />
            <small>{{ logoHint }}</small>
          </div>
        </el-form-item>
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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { CurrencyDisplay, suggestedCurrencyIconKey } from '@acquiring/shared';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchCurrencies, createCurrency, updateCurrency, changeCurrencyStatus, deleteCurrency, exportCurrencies, loadCurrencyPresentations, type IsoCurrency } from '@/api/base/currency';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<IsoCurrency[]>([]); const sel = ref<IsoCurrency[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ keyword: '', status: undefined as number | undefined });

const open = ref(false); const formMode = ref<'create' | 'edit'>('create');
const iconMode = ref<'auto' | 'flag' | 'currency'>('auto');
const flagRegionCode = ref('');
const formRef = ref<FormInstance>();
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const emptyForm = (): IsoCurrency & Record<string, any> => ({ id: 0, alpha3Code: '', numericCode: '', currencySymbol: '', iconKey: '', chineseName: '', englishName: '', fractionDigits: 2, minorUnitMultiplier: 100, minimumAmount: 0.01, status: 1 });
const form = reactive(emptyForm());
const rules: FormRules = {
  alpha3Code: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  chineseName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
  iconKey: [{ validator: (_rule, value, callback) => {
    if (!value || /^flag:[A-Z]{2}$/.test(value) || /^currency:[A-Z0-9]{3,12}$/.test(value)) callback();
    else callback(new Error(t('base.currency.logoInvalid')));
  }, trigger: 'change' }],
};
const logoHint = computed(() => iconMode.value === 'flag'
  ? t('base.currency.logoFlagHint')
  : iconMode.value === 'currency'
    ? t('base.currency.logoCurrencyHint')
    : t('base.currency.logoAutoHint'));

onMounted(() => {
  void loadCurrencyPresentations().catch(() => undefined);
  loadData();
});

watch(() => form.alpha3Code, () => {
  form.alpha3Code = form.alpha3Code.toUpperCase();
  if (iconMode.value === 'currency') form.iconKey = form.alpha3Code ? `currency:${form.alpha3Code}` : '';
});

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
  iconMode.value = 'auto'; flagRegionCode.value = '';
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
function handleUpdate(row: IsoCurrency) {
  formMode.value = 'edit'; Object.assign(form, { ...emptyForm(), ...row });
  initializeIconEditor(row.iconKey);
  open.value = true; nextTick(() => formRef.value?.clearValidate());
}
async function submit() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return;
  try {
    if (formMode.value === 'create') await createCurrency(form); else await updateCurrency(form.id, form);
    ElMessage.success(t('common.saveSuccess')); open.value = false;
    await loadCurrencyPresentations().catch(() => undefined); loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function toggleStatus(row: IsoCurrency) {
  const newStatus = row.status === 1 ? 0 : 1;
  const action = newStatus === 1 ? t('common.enable') : t('common.disable');
  const name = row.chineseName || row.englishName || row.alpha3Code || row.id;
  try { await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name }), t('common.operationConfirm'), { type: newStatus === 1 ? 'success' : 'warning' }); } catch { return; }
  try { await changeCurrencyStatus(row.id, newStatus); ElMessage.success(t('common.success')); await loadCurrencyPresentations().catch(() => undefined); loadData(); } catch { ElMessage.error(t('common.saveFailed')); }
}
async function handleDelete(target: IsoCurrency | IsoCurrency[]) {
  const targets = Array.isArray(target) ? target : [target];
  try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: targets.map((item) => item.chineseName || item.englishName).join('、') }), t('common.delete'), { type: 'warning' }); } catch { return; }
  try { await Promise.all(targets.map((item) => deleteCurrency(item.id))); ElMessage.success(t('common.deleteSuccess')); await loadCurrencyPresentations().catch(() => undefined); loadData(); } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function handleExport() {
  try {
    await exportCurrencies();
    ElMessage.success(t('common.export'));
  } catch { ElMessage.error(t('common.loadFailed')); }
}

function initializeIconEditor(iconKey?: string) {
  const flagMatch = /^flag:([A-Z]{2})$/i.exec(iconKey || '');
  if (flagMatch) {
    iconMode.value = 'flag'; flagRegionCode.value = flagMatch[1].toUpperCase(); form.iconKey = `flag:${flagRegionCode.value}`; return;
  }
  if (/^currency:/i.test(iconKey || '')) {
    iconMode.value = 'currency'; flagRegionCode.value = ''; form.iconKey = `currency:${form.alpha3Code.toUpperCase()}`; return;
  }
  iconMode.value = 'auto'; flagRegionCode.value = ''; form.iconKey = '';
}

function handleIconModeChange(value: string | number | boolean | undefined) {
  iconMode.value = value === 'flag' ? 'flag' : value === 'currency' ? 'currency' : 'auto';
  if (iconMode.value === 'flag') {
    const suggested = suggestedCurrencyIconKey(form.alpha3Code);
    flagRegionCode.value = /^flag:([A-Z]{2})$/.exec(suggested)?.[1] || '';
    syncFlagIconKey();
  } else {
    flagRegionCode.value = '';
    form.iconKey = iconMode.value === 'currency' && form.alpha3Code ? `currency:${form.alpha3Code}` : '';
  }
  void nextTick(() => formRef.value?.validateField('iconKey'));
}

function syncFlagIconKey() {
  flagRegionCode.value = flagRegionCode.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase();
  form.iconKey = flagRegionCode.value.length === 2 ? `flag:${flagRegionCode.value}` : '';
}
</script>

<style scoped>
.currency-logo-editor { display: grid; width: 100%; gap: 10px; }
.currency-logo-editor__preview { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 58px; padding: 8px 12px; border: 1px solid #d7e5f5; border-radius: 6px; background: #f7fbff; }
.currency-logo-editor__preview > span { color: #7a8ca3; font-size: 12px; }
.currency-logo-editor small { color: #7a8ca3; font-size: 12px; line-height: 1.45; }
.currency-logo-editor :deep(.el-radio-group) { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.currency-logo-editor :deep(.el-radio-button__inner) { width: 100%; }
.dialog-footer { display: flex; justify-content: center; gap: 10px; }
</style>
