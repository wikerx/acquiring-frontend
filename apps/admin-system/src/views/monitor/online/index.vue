<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.online.title') }}</h1>
                
            </div>
        </div>

        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('monitor.online.loginAddress')" align="center" prop="loginIp">
                <el-input v-model="query.loginIp" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="loadData" />
            </el-form-item>
            <el-form-item :label="$t('monitor.online.userName')" align="center" prop="userName">
                <el-input v-model="query.userName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="loadData" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="loadData">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleForceLogout(null)" v-hasPermi="'system:online:forceLogout'">{{ $t('monitor.online.forceLogout') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="sessionId" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="userName" :label="$t('monitor.online.userName')" min-width="120" align="center" />
            <el-table-column prop="deptName" :label="$t('monitor.online.deptName')" min-width="140" align="center" />
            <el-table-column prop="loginIp" :label="$t('monitor.online.host')" min-width="140" align="center" />
            <el-table-column prop="loginLocation" :label="$t('monitor.online.loginLocation')" min-width="140" align="center" />
            <el-table-column prop="browser" :label="$t('monitor.online.browser')" min-width="120" align="center" />
            <el-table-column prop="os" :label="$t('monitor.online.os')" min-width="140" align="center" />
            <el-table-column :label="$t('monitor.online.loginTime')" min-width="160" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.loginTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="100" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleForceLogout(row)" v-hasPermi="'system:online:forceLogout'">{{ $t('monitor.online.forceLogout') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination
                v-model:current-page="page" v-model:page-size="pageSize" :total="total"
                :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background
                @size-change="loadData" @current-change="loadData"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Delete } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getOnlineUsers, forceLogout, type OnlineUser } from '@/api/monitor/online';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<OnlineUser[]>([]);
const selectedRows = ref<OnlineUser[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        const result = await getOnlineUsers({
            pageNo: page.value,
            pageSize: pageSize.value,
            loginIp: String(query.loginIp || '').trim() || undefined,
            userName: String(query.userName || '').trim() || undefined,
        });
        rows.value = result.records;
        total.value = result.total;
    } catch {
        rows.value = [];
        total.value = 0;
    } finally {
        loading.value = false;
    }
}
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); loadData(); }
function handleSelectionChange(s: OnlineUser[]) { selectedRows.value = s; }
async function handleForceLogout(row: OnlineUser | null) {
    const target = row || selectedRows.value[0];
    if (!target || !target.sessionId) { ElMessage.warning(t('monitor.online.pleaseSelectUser')); return; }
    try {
        await ElMessageBox.confirm(t('monitor.online.forceLogoutConfirm', { name: target.userName || target.sessionId }), t('monitor.online.forceLogoutTitle'), { type: 'warning' });
        await forceLogout(target.sessionId);
        ElMessage.success(t('monitor.online.forceLogoutSuccess'));
        loadData();
    } catch { /* cancelled */ }
}
</script>
