<template>
  <div class="app-container">
    <el-form ref="queryFormRef" :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
      <el-form-item :label="$t('common.keyword')" prop="keyword"><el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('base.country.continent')" prop="continentCode"><el-select v-model="query.continentCode" :placeholder="$t('common.pleaseSelect')" clearable><el-option v-for="c in continents" :key="c.code" :label="c.name" :value="c.code" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openDialog('add')" v-hasPermi="'base:country:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="!sel.length || sel.length !== 1" @click="openDialog('edit', sel[0])" v-hasPermi="'base:country:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!sel.length" @click="handleDelete(sel[0])" v-hasPermi="'base:country:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'base:country:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="sel = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="alpha2Code" :label="$t('base.country.alpha2')" width="90" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="alpha3Code" :label="$t('base.country.alpha3')" width="90" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="flagEmoji" :label="$t('base.country.flag')" width="60" align="center" />
      <el-table-column prop="chineseName" :label="$t('base.country.chineseName')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="englishName" :label="$t('base.country.englishName')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="continentName" :label="$t('base.country.continent')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="currencyAlpha3Code" :label="$t('base.country.defaultCurrency')" width="100" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.status')" width="80" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'base:country:changeStatus'" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="200" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="Edit" @click="openDialog('edit', row)" v-hasPermi="'base:country:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'base:country:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>

    <el-dialog :title="dialogTitle" v-model="dialogVisible" width="620px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="100px" style="padding:0 20px">
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item :label="$t('base.country.alpha2')"><el-input v-model="form.alpha2Code" maxlength="2" placeholder="CN" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.country.alpha3')"><el-input v-model="form.alpha3Code" maxlength="3" placeholder="CHN" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.country.numericCode')"><el-input v-model="form.numericCode" maxlength="3" placeholder="156" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('base.country.flagIcon')"><el-input v-model="form.flagEmoji" maxlength="8" placeholder="🇨🇳" /></el-form-item>
        <el-form-item :label="$t('base.country.chineseName')"><el-input v-model="form.chineseName" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.country.englishName')"><el-input v-model="form.englishName" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-form-item :label="$t('base.country.englishShortName')"><el-input v-model="form.shortEnglishName" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.country.continentCode')"><el-select v-model="form.continentCode" style="width:100%"><el-option v-for="c in continents" :key="c.code" :label="`${c.code} — ${c.name}`" :value="c.code" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.country.continentName')"><el-input v-model="form.continentName" :placeholder="$t('common.pleaseInput')" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.country.defaultCurrency')"><el-input v-model="form.currencyAlpha3Code" maxlength="3" placeholder="CNY" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.country.majorLanguage')"><el-input v-model="form.primaryLanguageCode" maxlength="8" placeholder="zh" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('common.status')"><el-select v-model="form.status" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button><el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Download } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchCountries, createCountry, updateCountry, changeCountryStatus, deleteCountry, exportCountries, type IsoCountry } from '@/api/base/country';

const { t } = useI18n();
const showSearch = ref(true); const loading = ref(false);
const rows = ref<IsoCountry[]>([]); const sel = ref<IsoCountry[]>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const query = reactive({ keyword: '', continentCode: '' });

const continents = [
  { code: 'AS', name: '亚洲' }, { code: 'EU', name: '欧洲' }, { code: 'AF', name: '非洲' },
  { code: 'NA', name: '北美洲' }, { code: 'SA', name: '南美洲' }, { code: 'OC', name: '大洋洲' }, { code: 'AN', name: '南极洲' },
];

const dialogVisible = ref(false); const mode = ref<'add' | 'edit'>('add'); const dialogTitle = ref('');
const formRef = ref();
const emptyForm = (): IsoCountry & Record<string, any> => ({ id: 0, alpha2Code: '', alpha3Code: '', numericCode: '', flagEmoji: '', chineseName: '', englishName: '', shortEnglishName: '', continentCode: '', continentName: '', currencyAlpha3Code: '', primaryLanguageCode: '', status: 1 });
const form = reactive(emptyForm());

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const r = await searchCountries({ pageNo: page.value, pageSize: pageSize.value, keyword: query.keyword || undefined, continentCode: query.continentCode || undefined });
    rows.value = r.records; total.value = r.total;
  } catch { ElMessage.error(t('common.loadFailed')); } finally { loading.value = false; }
}

function handleSearch() { page.value = 1; loadData(); }
function handleReset() { query.keyword = ''; query.continentCode = ''; handleSearch(); }

function openDialog(m: 'add' | 'edit', row?: IsoCountry) {
  mode.value = m; dialogTitle.value = m === 'add' ? t('base.country.addTitle') : t('base.country.editTitle');
  Object.assign(form, m === 'edit' && row ? { ...emptyForm(), ...row } : emptyForm());
  dialogVisible.value = true;
}

async function submitForm() {
  try {
    if (mode.value === 'add') await createCountry(form); else await updateCountry(form.id, form);
    ElMessage.success(t('common.saveSuccess')); dialogVisible.value = false; loadData();
  } catch (e: any) { ElMessage.error(e?.message || t('common.saveFailed')); }
}

async function toggleStatus(row: IsoCountry) {
  const newStatus = row.status === 1 ? 0 : 1;
  try { await changeCountryStatus(row.id, newStatus); ElMessage.success(t('common.success')); loadData(); } catch { ElMessage.error(t('common.saveFailed')); }
}

async function handleDelete(row: IsoCountry) {
  try { await ElMessageBox.confirm(t('base.country.deleteConfirm', { name: row.chineseName || row.englishName }), t('common.confirm'), { type: 'warning' }); } catch { return; }
  try { await deleteCountry(row.id); ElMessage.success(t('common.deleteSuccess')); loadData(); } catch { ElMessage.error(t('common.deleteSuccess')); }
}
async function handleExport() {
  try {
    await exportCountries();
    ElMessage.success(t('common.export'));
  } catch { ElMessage.error(t('common.loadFailed')); }
}
</script>
