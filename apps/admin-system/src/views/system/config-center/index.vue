<template>
    <div class="app-container">
        <div class="page-header"><div><h1>{{ $t('system.config.title') }}</h1></div><el-tag type="success" size="small">{{ $t('system.config.apiConnected') }}</el-tag></div>
        <el-tabs v-model="activeTab" style="margin-bottom:4px">
            <el-tab-pane :label="$t('system.config.dict')" name="dict" />
            <el-tab-pane :label="$t('system.config.config')" name="config" />
        </el-tabs>
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="activeTab === 'dict' ? $t('system.config.dictName') : $t('system.config.configName')" prop="keyword"><el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Plus" size="small" v-hasPermi="'system:config:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Edit" size="small" v-hasPermi="'system:config:edit'">{{ $t('common.edit') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
            <el-col :span="24"><span class="security-note">{{ $t('system.config.writeNote') }}</span></el-col>
        </el-row>
        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :min-width="col.minWidth || col.width || 140" :width="col.width" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('common.operation')" align="center" width="100" class-name="small-padding fixed-width" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)">{{ $t('common.detail') }}</el-button></template></el-table-column>
        </el-table>
        <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>
        <el-dialog v-model="detailVisible" :title="`${activeTitle} ${$t('common.detail')}`" width="700px" append-to-body destroy-on-close>
            <el-descriptions :column="2" border size="small"><el-descriptions-item v-for="col in columns" :key="col.prop" :label="col.label">{{ activeRow?.[col.prop] ?? '-' }}</el-descriptions-item></el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, Plus, Edit, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchConfigs } from '@/api/system/config';
import { searchDictTypes } from '@/api/system/dict';
import type { CrudTableColumn } from '@/types/admin';
import { CommonStatus } from '@/enums/status';

const { t } = useI18n();
type ConfigCenterTab = 'dict' | 'config';
const showSearch = ref(true); const activeTab = ref<ConfigCenterTab>('dict');
const query = reactive<Record<string, unknown>>({}); const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]); const selectedRows = ref<Array<Record<string, unknown>>>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const detailVisible = ref(false); const activeRow = ref<Record<string, unknown> | null>(null);
const activeTitle = computed(() => activeTab.value === 'dict' ? t('system.config.dictType') : t('system.config.configKey'));

const dictColumns: CrudTableColumn[] = [
    { prop: 'dictType', label: t('system.config.dictType'), minWidth: 180 }, { prop: 'dictName', label: t('system.config.dictName'), minWidth: 180 },
    { prop: 'bizDomain', label: t('system.config.bizDomain'), minWidth: 140 }, { prop: 'status', label: t('common.status'), width: 100 },
    { prop: 'updatedAt', label: t('common.updateTime'), minWidth: 180 },
];
const configColumns: CrudTableColumn[] = [
    { prop: 'configKey', label: t('system.config.configKey'), minWidth: 220 }, { prop: 'configName', label: t('system.config.configName'), minWidth: 180 },
    { prop: 'configGroup', label: t('system.config.configGroup'), minWidth: 140 }, { prop: 'valueTypeText', label: t('system.config.valueType'), width: 110 },
    { prop: 'status', label: t('common.status'), width: 100 }, { prop: 'updatedAt', label: t('common.updateTime'), minWidth: 180 },
];
const columns = computed(() => activeTab.value === 'dict' ? dictColumns : configColumns);

watch([activeTab, page, pageSize], () => { selectedRows.value = []; loadData(); });
onMounted(() => loadData());

async function loadData() { loading.value = true; try { const r = activeTab.value === 'dict' ? await searchDictTypes({ pageNo: page.value, pageSize: pageSize.value, dictName: kw(), status: ns() }) : await searchConfigs({ pageNo: page.value, pageSize: pageSize.value, configName: kw(), status: ns() }); rows.value = r.records.map((i: unknown) => nr(i as Record<string, unknown>)); total.value = r.total; } catch (e) { rows.value = []; total.value = 0; ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); } finally { loading.value = false; } }
function handleQuery() { page.value === 1 ? loadData() : (page.value = 1); }
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); handleQuery(); }
function openDetail(row: Record<string, unknown>) { activeRow.value = row; detailVisible.value = true; }
function kw() { return String(query.keyword || '').trim() || undefined; }
function ns() { return typeof query.status === 'number' ? query.status : undefined; }
function nr(row: Record<string, unknown>) { return { ...row, status: row.status === 1 ? CommonStatus.Enabled : CommonStatus.Disabled, valueTypeText: vt(row.valueType) }; }
function vt(v: unknown) { return ({ 1: 'String', 2: 'Number', 3: 'Boolean', 4: 'JSON' } as Record<number, string>)[Number(v)] || '-'; }
</script>
