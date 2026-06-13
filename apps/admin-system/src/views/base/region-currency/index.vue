<template>
  <div class="app-container">
    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
      <el-form-item :label="$t('common.keyword')" prop="keyword"><el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('base.country.continent')" prop="continentCode"><el-select v-model="query.continentCode" :placeholder="$t('common.pleaseSelect')" clearable><el-option v-for="c in continents" :key="c.code" :label="`${c.code} — ${c.name}`" :value="c.code" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openAdd" v-hasPermi="'base:countryCurrency:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'base:countryCurrency:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="alpha2Code" :label="$t('base.country.alpha2')" width="90" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="countryName" :label="$t('base.regionCurrency.countryRegion')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="continentName" :label="$t('base.country.continent')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="currencyAlpha3Code" :label="$t('base.regionCurrency.currentCurrency')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="currencyName" :label="$t('base.regionCurrency.currencyName')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="currencySymbol" :label="$t('base.currency.symbol')" width="70" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.status')" width="80" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'base:countryCurrency:changeStatus'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="190" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Edit" @click="openEdit(row)" v-hasPermi="'base:countryCurrency:edit'">{{ $t('base.regionCurrency.switchCurrency') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'base:countryCurrency:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogMode === 'add' ? $t('base.regionCurrency.addTitle') : $t('base.regionCurrency.switchTitle', { name: editRow?.countryName || '' })" v-model="open" width="460px" append-to-body destroy-on-close>
      <el-form label-width="80px" style="padding:0 20px">
        <el-form-item v-if="dialogMode === 'add'" :label="$t('base.regionCurrency.countryRegion')" prop="countryId">
          <el-select v-model="selectedCountryId" filterable :placeholder="$t('common.pleaseSelect')" style="width:100%">
            <el-option v-for="country in countries" :key="country.id" :label="`${country.alpha2Code} — ${country.chineseName}`" :value="country.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-else :label="$t('base.regionCurrency.currentCurrency')"><el-input :model-value="editRow?.currencyAlpha3Code || '-'" disabled /></el-form-item>
        <el-form-item :label="$t('base.regionCurrency.newCurrency')" prop="currencyAlpha3Code"><el-select v-model="selectedCurrency" filterable :placeholder="$t('common.pleaseSelect')" style="width:100%"><el-option v-for="c in currencies" :key="c.alpha3Code" :label="`${c.alpha3Code} — ${c.chineseName}`" :value="c.alpha3Code" /></el-select></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="saveEdit">{{ $t('common.confirm') }}</el-button><el-button @click="open = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Edit, Delete, Download, Plus } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchRegionCurrencies, createRegionCurrency, updateRegionCurrency, deleteRegionCurrency, changeRegionCurrencyStatus, exportRegionCurrencies, type RegionCurrencyRow } from '@/api/base/regionCurrency';
import { searchCurrencies, type IsoCurrency } from '@/api/base/currency';
import { searchCountries, type IsoCountry } from '@/api/base/country';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<RegionCurrencyRow[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ keyword: '', continentCode: '' });
const currencies = ref<IsoCurrency[]>([]);
const countries = ref<IsoCountry[]>([]);

const continents = [
  { code: 'AS', name: '亚洲' }, { code: 'EU', name: '欧洲' }, { code: 'AF', name: '非洲' },
  { code: 'NA', name: '北美洲' }, { code: 'SA', name: '南美洲' }, { code: 'OC', name: '大洋洲' }, { code: 'AN', name: '南极洲' },
];

const open = ref(false); const editRow = ref<RegionCurrencyRow | null>(null); const selectedCurrency = ref('');
const dialogMode = ref<'add' | 'edit'>('edit'); const selectedCountryId = ref<number | null>(null);

onMounted(() => { loadData(); loadCurrencies(); loadCountries(); });

async function loadData() {
  loading.value = true;
  try {
    const r = await searchRegionCurrencies({ pageNo: page.value, pageSize: pageSize.value, keyword: query.keyword || undefined, continentCode: query.continentCode || undefined });
    rows.value = r.records; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

async function loadCurrencies() {
  try { const r = await searchCurrencies({ pageNo: 1, pageSize: 500 }); currencies.value = r.records; } catch { /* ignore */ }
}

async function loadCountries() {
  try { const r = await searchCountries({ pageNo: 1, pageSize: 1000 }); countries.value = r.records; } catch { /* ignore */ }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.keyword = ''; query.continentCode = ''; handleSearch(); }

function openAdd() {
  dialogMode.value = 'add'; editRow.value = null; selectedCountryId.value = null; selectedCurrency.value = ''; open.value = true;
}

function openEdit(row: RegionCurrencyRow) {
  dialogMode.value = 'edit'; editRow.value = row; selectedCountryId.value = null; selectedCurrency.value = row.currencyAlpha3Code || ''; open.value = true;
}

async function saveEdit() {
  if (!selectedCurrency.value) return;
  if (dialogMode.value === 'add' && !selectedCountryId.value) return;
  if (dialogMode.value === 'edit' && !editRow.value) return;
  try {
    if (dialogMode.value === 'add') {
      await createRegionCurrency(selectedCountryId.value as number, selectedCurrency.value);
    } else if (editRow.value) {
      await updateRegionCurrency(editRow.value.id, selectedCurrency.value);
    }
    ElMessage.success(t('common.saveSuccess')); open.value = false; loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}
async function toggleStatus(row: RegionCurrencyRow) { try { await changeRegionCurrencyStatus(row.id, row.status === 1 ? 0 : 1); ElMessage.success(t('common.success')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); } }
async function handleDelete(row: RegionCurrencyRow) { try { await ElMessageBox.confirm(t('system.role.deleteConfirm', { name: row.countryName }), t('common.delete'), { type: 'warning' }); } catch { return; } try { await deleteRegionCurrency(row.id); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); } }
async function handleExport() { try { const rows = await exportRegionCurrencies(); ElMessage.success(`${t('common.export')} ${rows.length}`); } catch { ElMessage.error(t('common.loadFailed')); } }
</script>
