<template>
    <div class="app-container">
        <el-form :model="query" :inline="true" size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('monitor.sharding.logicalTable')">
                <el-input v-model="query.keyword" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.enabled" :placeholder="$t('common.pleaseSelect')" clearable style="width: 160px">
                    <el-option :label="$t('monitor.sharding.enabled')" value="Y" />
                    <el-option :label="$t('monitor.sharding.disabled')" value="N" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col class="right-toolbar">
                <RightToolbar @refresh="loadData" />
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="pagedRows" row-key="ruleKey" size="small">
            <el-table-column prop="ruleKey" :label="$t('monitor.sharding.ruleKey')" min-width="130" />
            <el-table-column prop="logicalTable" :label="$t('monitor.sharding.logicalTable')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="templateTable" :label="$t('monitor.sharding.templateTable')" min-width="160" show-overflow-tooltip />
            <el-table-column prop="enabled" :label="$t('common.status')" width="100" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="row.enabled ? 'ENABLED' : 'DISABLED'" :text="row.enabled ? $t('monitor.sharding.enabled') : $t('monitor.sharding.disabled')" />
                </template>
            </el-table-column>
            <el-table-column prop="actualDataSource" :label="$t('monitor.sharding.actualDataSource')" min-width="140" />
            <el-table-column prop="shardingColumn" :label="$t('monitor.sharding.shardingColumn')" min-width="150" />
            <el-table-column prop="currentPhysicalTable" :label="$t('monitor.sharding.currentPhysicalTable')" min-width="190" show-overflow-tooltip />
            <el-table-column prop="nextPhysicalTable" :label="$t('monitor.sharding.nextPhysicalTable')" min-width="190" show-overflow-tooltip />
            <el-table-column prop="physicalTableCount" :label="$t('monitor.sharding.physicalTableCount')" width="120" align="center" />
            <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:sharding:rule:query'">{{ $t('common.detail') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="filteredRows.length > 0">
            <el-pagination
                v-model:current-page="page"
                v-model:page-size="pageSize"
                :total="filteredRows.length"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                background
            />
        </div>

        <DetailDescriptions v-model:visible="detailVisible" :title="$t('common.detail')" :data="detailData" :items="detailItems" :column="1" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { getShardingRule, listShardingRules, type ShardingRuleRow } from '@/api/monitor/sharding';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<ShardingRuleRow[]>([]);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const query = reactive({
    keyword: '',
    enabled: '',
});

const detailItems = computed(() => [
    { prop: 'ruleKey', label: t('monitor.sharding.ruleKey') },
    { prop: 'logicalTable', label: t('monitor.sharding.logicalTable') },
    { prop: 'templateTable', label: t('monitor.sharding.templateTable') },
    { prop: 'idColumn', label: t('monitor.sharding.idColumn') },
    { prop: 'shardingColumn', label: t('monitor.sharding.shardingColumn') },
    { prop: 'actualDataSource', label: t('monitor.sharding.actualDataSource') },
    { prop: 'tableNameFormat', label: t('monitor.sharding.tableNameFormat') },
    { prop: 'currentPhysicalTable', label: t('monitor.sharding.currentPhysicalTable') },
    { prop: 'nextPhysicalTable', label: t('monitor.sharding.nextPhysicalTable') },
    { prop: 'physicalTableCount', label: t('monitor.sharding.physicalTableCount') },
    { prop: 'description', label: t('common.remark') },
]);

const filteredRows = computed(() => {
    const keyword = query.keyword.trim().toLowerCase();
    return rows.value.filter((row) => {
        const matchesKeyword = !keyword || [row.ruleKey, row.logicalTable, row.templateTable, row.actualDataSource]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword));
        const matchesStatus = !query.enabled || (query.enabled === 'Y' ? row.enabled === true : row.enabled === false);
        return matchesKeyword && matchesStatus;
    });
});

const pagedRows = computed(() => {
    const start = (page.value - 1) * pageSize.value;
    return filteredRows.value.slice(start, start + pageSize.value);
});

onMounted(() => loadData());

async function loadData() {
    loading.value = true;
    try {
        rows.value = await listShardingRules();
    } catch (error) {
        console.error(error);
        rows.value = [];
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
}

function handleReset() {
    query.keyword = '';
    query.enabled = '';
    page.value = 1;
}

async function openDetail(row: ShardingRuleRow) {
    try {
        const detail = await getShardingRule(row.ruleKey || row.logicalTable || '');
        detailData.value = {
            ...detail,
            physicalTables: (detail.physicalTables || []).join(', '),
        };
        detailVisible.value = true;
    } catch (error) {
        console.error(error);
        ElMessage.error(t('common.loadFailed'));
    }
}
</script>
