<template>
    <div class="app-container">
        <div class="page-header">
            <div>
                <h1>{{ $t('monitor.job.title') }}</h1>

            </div>
            <el-tag type="info" size="small">{{ $t('monitor.job.pending') }}</el-tag>
        </div>

        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="68px">
            <el-form-item :label="$t('monitor.job.jobName')" align="center" prop="jobName">
                <el-input v-model="query.jobName" :placeholder="$t('common.pleaseInput')" clearable />
            </el-form-item>
            <el-form-item :label="$t('monitor.job.jobStatus')" align="center" prop="status">
                <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('monitor.job.statusRunning')" align="center" :value="1" />
                    <el-option :label="$t('monitor.job.statusPaused')" align="center" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="loadData">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" disabled v-hasPermi="'monitor:job:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" disabled v-hasPermi="'monitor:job:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col class="right-toolbar"><RightToolbar :show-search="false" @refresh="loadData" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="jobId">
            <el-table-column prop="jobName" :label="$t('monitor.job.jobName')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="jobGroup" :label="$t('monitor.job.jobGroup')" min-width="140" align="center" />
            <el-table-column prop="cronExpression" :label="$t('monitor.job.cronExpression')" min-width="160" align="center" />
            <el-table-column prop="status" :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }">
                    <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">{{ row.status === 1 ? $t('monitor.job.run') : $t('monitor.job.pause') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="180" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="Edit" disabled v-hasPermi="'monitor:job:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" disabled v-hasPermi="'monitor:job:remove'">{{ $t('common.delete') }}</el-button>
                    <el-button size="small" type="primary" link disabled>{{ $t('monitor.job.execute') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <el-empty v-if="!loading && !rows.length" :description="$t('monitor.job.pendingMsg')" />
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue';
import RightToolbar from '@/components/RightToolbar/index.vue';

const showSearch = ref(true);
const query = reactive<Record<string, unknown>>({});
const loading = ref(false);
const rows = ref<Array<Record<string, unknown>>>([]);

onMounted(() => loadData());
async function loadData() { loading.value = true; try { rows.value = []; } finally { loading.value = false; } }
function resetQuery() { Object.keys(query).forEach(k => query[k] = ''); loadData(); }
</script>
