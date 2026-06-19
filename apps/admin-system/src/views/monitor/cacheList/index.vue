<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.cacheList.title') }}</h1>
            </div>
        </div>

        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="68px">
            <el-form-item :label="$t('monitor.cacheList.cacheKey')" prop="keyPattern">
                <el-input v-model="query.keyPattern" :placeholder="$t('monitor.cacheList.cacheKey')" clearable style="width:280px" @keyup.enter="loadData" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="loadData">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Refresh" size="small" @click="loadData">{{ $t('common.refresh') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button
                    v-hasPermi="'system:cache:clear'"
                    type="danger"
                    plain
                    :icon="Delete"
                    size="small"
                    :disabled="!selectedRows.length"
                    @click="handleBatchDelete"
                >
                    {{ $t('monitor.cacheList.batchDelete') }}
                </el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar :show-refresh="false" @toggle-search="showSearch = !showSearch" /></el-col>
        </el-row>

        <el-alert
            v-if="truncated"
            :title="$t('monitor.cacheList.truncatedMsg')"
            type="warning"
            show-icon
            :closable="false"
            style="margin-bottom: 12px"
        />

        <el-table v-loading="loading" :data="rows" row-key="key" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="key" :label="$t('monitor.cacheList.cacheKey')" align="center" min-width="280" :show-overflow-tooltip="true" />
            <el-table-column prop="type" :label="$t('monitor.cacheList.type')" width="100" align="center" />
            <el-table-column prop="ttl" :label="$t('monitor.cacheList.ttl')" width="140" align="center">
                <template #default="{ row }">{{ formatTtl(row.ttl) }}</template>
            </el-table-column>
            <el-table-column prop="size" :label="$t('monitor.cacheList.size')" width="100" align="center" />
            <el-table-column :label="$t('common.operation')" align="center" width="160" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'system:cache:query'">{{ $t('common.view') }}</el-button>
                    <el-button v-hasPermi="'system:cache:clear'" size="small" type="primary" link :icon="Delete" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div v-show="total > 0" class="pagination-container">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
                @size-change="loadData"
                @current-change="loadData"
            />
        </div>

        <el-dialog v-model="detailVisible" :title="$t('monitor.cacheList.detailTitle')" width="600px" append-to-body destroy-on-close>
            <el-form label-width="80px">
                <el-form-item :label="$t('monitor.cacheList.cacheKey')"><el-input :model-value="activeRow?.key || ''" readonly /></el-form-item>
                <el-form-item :label="$t('monitor.cacheList.type')"><el-input :model-value="activeRow?.type || ''" readonly /></el-form-item>
                <el-form-item :label="$t('monitor.cacheList.ttl')"><el-input :model-value="formatTtl(activeRow?.ttl)" readonly /></el-form-item>
                <el-form-item :label="$t('monitor.cacheList.value')"><el-input :model-value="detailValue" type="textarea" :rows="8" readonly /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer"><el-button @click="detailVisible = false">{{ $t('common.close') }}</el-button></div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Refresh, Search, View } from '@element-plus/icons-vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { deleteCacheKey, getCacheKeys, getCacheValue, type CacheKeyRow } from '@/api/monitor/cache';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const showSearch = ref(true);
const query = reactive<{ keyPattern?: string }>({});
const loading = ref(false);
const rows = ref<CacheKeyRow[]>([]);
const selectedRows = ref<CacheKeyRow[]>([]);
const total = ref(0);
const truncated = ref(false);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const activeRow = ref<CacheKeyRow | null>(null);

const detailValue = computed(() => {
    const value = activeRow.value?.value;
    if (value === undefined || value === null) {
        return '';
    }
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
});

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        const data = await getCacheKeys({
            keyPattern: query.keyPattern,
            pageNo: page.value,
            pageSize: pageSize.value,
        });
        rows.value = data.records || [];
        total.value = data.total || 0;
        truncated.value = Boolean(data.truncated);
    } finally {
        loading.value = false;
    }
}

function resetQuery() {
    query.keyPattern = '';
    page.value = 1;
    loadData();
}

function handleSelectionChange(selection: CacheKeyRow[]) {
    selectedRows.value = selection;
}

async function openDetail(row: CacheKeyRow) {
    activeRow.value = await getCacheValue(row.key);
    detailVisible.value = true;
}

async function handleDelete(row: CacheKeyRow) {
    try {
        await ElMessageBox.confirm(t('monitor.cacheList.deleteConfirm', { key: row.key }), t('monitor.cacheList.deleteTitle'), { type: 'warning' });
        await deleteCacheKey(row.key);
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch {
        // cancelled
    }
}

async function handleBatchDelete() {
    try {
        await ElMessageBox.confirm(t('monitor.cacheList.batchDeleteConfirm'), t('monitor.cacheList.batchDelete'), { type: 'warning' });
        await Promise.all(selectedRows.value.map((row) => deleteCacheKey(row.key)));
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch {
        // cancelled
    }
}

function formatTtl(ttl?: number) {
    if (ttl === undefined || ttl === null) {
        return '-';
    }
    if (ttl === -1) {
        return t('monitor.cacheList.permanent');
    }
    if (ttl === -2) {
        return t('monitor.cacheList.expired');
    }
    return `${ttl}s`;
}
</script>
