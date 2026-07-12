<template>
  <div class="app-container">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="68px">
      <el-form-item prop="ipAddress">
        <div class="ip-query-control">
          <el-select v-model="query.ipType" class="ip-type-select" aria-label="IP type" :teleported="false">
            <el-option label="IP v4" value="IPV4" />
            <el-option label="IP v6" value="IPV6" />
          </el-select>
          <el-input v-model.trim="query.ipAddress" :placeholder="$t('base.ipLibrary.ipPlaceholder')" clearable class="ip-address-input" @input="handleIpInput" @keyup.enter="handleSearch" />
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-alert class="ip-library-tip" type="info" :closable="false" show-icon :title="$t('base.ipLibrary.shardPageTip')" />

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain :icon="Aim" size="small" @click="openLookupDialog" v-hasPermi="'base:ip-library:list'">{{ $t('base.ipLibrary.lookup') }}</el-button>
      </el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
    </el-row>

    <StandardTable table-key="base-ip-library" v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="ipType" :label="$t('base.ipLibrary.ipType')" width="90" align="center">
        <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.ipType }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('base.ipLibrary.ipNumberStart')" min-width="190" align="center" :show-overflow-tooltip="true">
        <template #default="{ row }"><div class="ip-range-cell"><span>{{ row.ipNumberStart }}</span><small>{{ row.ipAddressStart }}</small></div></template>
      </el-table-column>
      <el-table-column :label="$t('base.ipLibrary.ipNumberEnd')" min-width="190" align="center" :show-overflow-tooltip="true">
        <template #default="{ row }"><div class="ip-range-cell"><span>{{ row.ipNumberEnd }}</span><small>{{ row.ipAddressEnd }}</small></div></template>
      </el-table-column>
      <el-table-column prop="countryAlpha2" :label="$t('base.ipLibrary.countryAlpha2')" width="120" align="center" />
      <el-table-column prop="countryAlpha3" :label="$t('base.ipLibrary.countryAlpha3')" width="130" align="center" />
      <el-table-column prop="countryNumeric" :label="$t('base.ipLibrary.countryNumeric')" width="120" align="center" />
      <el-table-column prop="countryName" :label="$t('base.ipLibrary.countryName')" min-width="160" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="stateProvince" :label="$t('base.ipLibrary.stateProvince')" min-width="140" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="city" :label="$t('base.ipLibrary.city')" min-width="130" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('base.ipLibrary.createTime')" min-width="170" align="center">
        <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
      </el-table-column>
      <el-table-column prop="createBy" :label="$t('base.ipLibrary.createBy')" width="120" align="center" :show-overflow-tooltip="true" />
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="$t('base.ipLibrary.lookup')" v-model="lookupOpen" width="980px" append-to-body>
      <el-form :model="lookupForm" inline size="small" class="lookup-form">
        <el-form-item :label="$t('base.ipLibrary.ipAddress')">
          <el-input v-model.trim="lookupForm.ipAddress" :placeholder="$t('base.ipLibrary.ipPlaceholder')" clearable class="lookup-input" @input="handleLookupIpInput" @keyup.enter="handleLookup" />
        </el-form-item>
        <el-form-item><el-button type="primary" :icon="Aim" @click="handleLookup">{{ $t('base.ipLibrary.lookup') }}</el-button></el-form-item>
      </el-form>
      <div v-if="lookupSearched" class="lookup-summary">
        <el-alert :type="lookupResult ? 'success' : 'warning'" :closable="false" show-icon>
          <template #title>{{ lookupResult ? $t('base.ipLibrary.lookupSuccess') : $t('base.ipLibrary.notFound') }}</template>
        </el-alert>
        <el-descriptions v-if="lookupResult" :title="$t('base.ipLibrary.bestMatch')" :column="1" border size="small" class="one-column-detail">
          <el-descriptions-item :label="$t('base.ipLibrary.ipType')">{{ lookupResult.ipType }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.ipLibrary.ipNumberStart')">{{ lookupResult.ipNumberStart }} / {{ lookupResult.ipAddressStart }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.ipLibrary.ipNumberEnd')">{{ lookupResult.ipNumberEnd }} / {{ lookupResult.ipAddressEnd }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.ipLibrary.countryName')">{{ lookupResult.countryName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.ipLibrary.stateProvince')">{{ lookupResult.stateProvince || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.ipLibrary.city')">{{ lookupResult.city || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="lookupResult" :data="[lookupResult]" size="small" class="lookup-table">
          <el-table-column prop="ipType" :label="$t('base.ipLibrary.ipType')" width="90" align="center" />
          <el-table-column prop="ipAddressStart" :label="$t('base.ipLibrary.ipAddressStart')" min-width="190" align="center" />
          <el-table-column prop="ipAddressEnd" :label="$t('base.ipLibrary.ipAddressEnd')" min-width="190" align="center" />
          <el-table-column prop="countryName" :label="$t('base.ipLibrary.countryName')" min-width="160" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="stateProvince" :label="$t('base.ipLibrary.stateProvince')" min-width="130" align="center" :show-overflow-tooltip="true" />
          <el-table-column prop="city" :label="$t('base.ipLibrary.city')" min-width="120" align="center" :show-overflow-tooltip="true" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Aim, Refresh, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { lookupIpLibrary, pageIpLibrary, type IpLibraryQuery, type IpLibraryRecord } from '@/api/base/ipLibrary';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<IpLibraryRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const lookupOpen = ref(false);
const lookupSearched = ref(false);
const lookupResult = ref<IpLibraryRecord | null>(null);
const query = reactive<IpLibraryQuery>({
  ipType: 'IPV4',
  ipAddress: '',
});
const lookupForm = reactive({
  ipAddress: '',
});

onMounted(() => loadData());

async function loadData() {
  loading.value = true;
  try {
    const result = await pageIpLibrary({
      pageNo: page.value,
      pageSize: pageSize.value,
      ipType: query.ipType || undefined,
      ipAddress: query.ipAddress || undefined,
    });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadData();
}

function handleReset() {
  Object.assign(query, {
    ipType: 'IPV4',
    ipAddress: '',
  });
  handleSearch();
}

function openLookupDialog() {
  lookupForm.ipAddress = query.ipAddress || '';
  lookupSearched.value = false;
  lookupResult.value = null;
  lookupOpen.value = true;
}

async function handleLookup() {
  const ipAddress = lookupForm.ipAddress?.trim();
  if (!ipAddress) {
    ElMessage.warning(t('base.ipLibrary.ipRequired'));
    return;
  }
  const nextType = detectIpType(ipAddress);
  if (nextType) {
    query.ipType = nextType;
  }
  loading.value = true;
  try {
    const record = await lookupIpLibrary(ipAddress);
    lookupSearched.value = true;
    lookupResult.value = record;
    if (!record) {
      ElMessage.warning(t('base.ipLibrary.notFound'));
    }
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleLookupIpInput(value: string) {
  const nextType = detectIpType(value);
  if (nextType) {
    query.ipType = nextType;
  }
}

function handleIpInput(value: string) {
  const nextType = detectIpType(value);
  if (nextType) {
    query.ipType = nextType;
  }
}

function detectIpType(value: string): 'IPV4' | 'IPV6' | undefined {
  const text = String(value || '').trim();
  if (!text) {
    return undefined;
  }
  if (text.includes(':')) {
    return 'IPV6';
  }
  if (/^\d{1,3}(\.\d{1,3}){0,3}$/.test(text)) {
    return 'IPV4';
  }
  return undefined;
}
</script>

<style scoped>
.ip-query-control {
  display: inline-flex;
  align-items: center;
  width: 306px;
  height: 28px;
}

.ip-library-tip {
  margin-bottom: 12px;
}

.ip-type-select {
  width: 86px;
  flex: 0 0 86px;
}

.ip-address-input {
  width: 220px;
  flex: 0 0 220px;
}

.ip-type-select :deep(.el-select__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.ip-address-input :deep(.el-input__wrapper) {
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.lookup-form {
  margin-bottom: 12px;
}

.lookup-input {
  width: 320px;
}

.lookup-summary {
  display: grid;
  gap: 14px;
}

.lookup-table {
  margin-top: 4px;
}

.one-column-detail :deep(.el-descriptions__label) {
  width: 150px;
}

.ip-range-cell {
  display: flex;
  min-height: 34px;
  flex-direction: column;
  justify-content: center;
  line-height: 1.35;
}

.ip-range-cell small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
