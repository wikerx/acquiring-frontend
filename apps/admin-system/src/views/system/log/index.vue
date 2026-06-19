<template>
    <div class="app-container">
        <div class="page-header"><div><h1>{{ $t('system.log.title') }}</h1></div><el-tag type="success" size="small">{{ $t('system.config.apiConnected') }}</el-tag></div>
        <el-tabs v-model="activeTab" style="margin-bottom:4px">
            <el-tab-pane :label="$t('system.log.loginLog')" name="login" />
            <el-tab-pane :label="$t('system.log.operLog')" name="oper" />
        </el-tabs>
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="activeTab === 'login' ? $t('system.log.loginAccount') : $t('system.log.module')" prop="keyword"><el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleQuery" /></el-form-item>
            <el-form-item :label="$t('common.status')" prop="status"><el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
            <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleQuery">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
            <el-col :span="24"><span class="security-note">{{ $t('system.log.logReadOnly') }}</span></el-col>
        </el-row>
        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column v-for="col in columns" :key="col.prop" :prop="col.prop" :label="col.label" :min-width="col.minWidth || col.width || 140" :width="col.width" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('common.operation')" align="center" width="80" class-name="small-padding fixed-width" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="activeTab === 'login' ? 'system:login-log:list' : 'system:oper-log:list'">{{ $t('common.detail') }}</el-button></template></el-table-column>
        </el-table>
        <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>
        <el-dialog v-model="detailVisible" :title="`${activeTitle} ${$t('common.detail')}`" width="800px" append-to-body destroy-on-close>
            <el-descriptions :column="2" border size="small"><el-descriptions-item v-for="col in columns" :key="col.prop" :label="col.label">{{ activeRow?.[col.prop] ?? '-' }}</el-descriptions-item></el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchLoginLogs } from '@/api/audit/login-log';
import { searchOperLogs } from '@/api/audit/oper-log';
import type { CrudTableColumn } from '@/types/admin';
import { LoginStatus } from '@/enums/status';

const { t } = useI18n();
type LogTab = 'login' | 'oper';
const showSearch = ref(true); const activeTab = ref<LogTab>('login');
const query = reactive<Record<string, unknown>>({}); const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]); const selectedRows = ref<Array<Record<string, unknown>>>([]);
const total = ref(0); const page = ref(1); const pageSize = ref(10);
const detailVisible = ref(false); const activeRow = ref<Record<string, unknown> | null>(null);
const activeTitle = computed(() => activeTab.value === 'login' ? t('system.log.loginLog') : t('system.log.operLog'));

const loginColumns: CrudTableColumn[] = [
    { prop: 'loginAccount', label: t('system.log.loginAccount'), minWidth: 150 }, { prop: 'loginIp', label: t('system.log.loginIp'), minWidth: 140 },
    { prop: 'merchantId', label: t('system.log.merchantId'), minWidth: 150 }, { prop: 'status', label: t('common.status'), width: 100 },
    { prop: 'failReason', label: t('system.log.failReason'), minWidth: 180 }, { prop: 'loginAt', label: t('system.log.loginTime'), minWidth: 180 },
];
const operColumns: CrudTableColumn[] = [
    { prop: 'moduleName', label: t('system.log.module'), minWidth: 140 }, { prop: 'operatorName', label: t('system.log.operator'), minWidth: 140 },
    { prop: 'requestMethod', label: t('system.log.method'), width: 90 }, { prop: 'operUrl', label: t('system.log.requestUrl'), minWidth: 220 },
    { prop: 'operIp', label: t('system.log.operIp'), minWidth: 140 }, { prop: 'costTimeText', label: t('system.log.costTime'), width: 100 },
    { prop: 'status', label: t('common.status'), width: 100 }, { prop: 'operatedAt', label: t('system.log.operTime'), minWidth: 180 },
];
const columns = computed(() => activeTab.value === 'login' ? loginColumns : operColumns);

watch([activeTab, page, pageSize], () => { selectedRows.value = []; loadData(); });
onMounted(() => loadData());

async function loadData() { loading.value = true; try { const r = activeTab.value === 'login' ? await searchLoginLogs({ pageNo: page.value, pageSize: pageSize.value, loginAccount: kw(), loginStatus: ns() }) : await searchOperLogs({ pageNo: page.value, pageSize: pageSize.value, moduleName: kw(), status: ns() }); rows.value = r.records.map((i: unknown) => nr(i as Record<string, unknown>)); total.value = r.total; } catch (e) { rows.value = []; total.value = 0; ElMessage.error(e instanceof Error ? e.message : t('common.loadFailed')); } finally { loading.value = false; } }
function handleQuery() { page.value === 1 ? loadData() : (page.value = 1); }
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); handleQuery(); }
function openDetail(row: Record<string, unknown>) { activeRow.value = row; detailVisible.value = true; }
function kw() { return String(query.keyword || '').trim() || undefined; }
function ns() { return typeof query.status === 'number' ? query.status : undefined; }
function nr(row: Record<string, unknown>) { const s = row.loginStatus ?? row.status; return { ...row, status: s === 1 ? LoginStatus.Success : LoginStatus.Failed, costTimeText: typeof row.costTime === 'number' ? `${row.costTime} ms` : '-' }; }
</script>
