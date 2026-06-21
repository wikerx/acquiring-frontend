<template>
    <div class="app-container">
        <el-form :model="query" :inline="true" size="small" v-show="showSearch" class="search-form" label-width="82px">
            <el-form-item :label="$t('monitor.job.jobCode')" prop="jobCode">
                <el-input v-model="query.jobCode" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.job.jobName')" prop="jobName">
                <el-input v-model="query.jobName" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('monitor.job.jobGroup')" prop="jobGroup">
                <el-input v-model="query.jobGroup" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="$t('common.status')" prop="status">
                <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('monitor.job.statusEnabled')" value="ENABLED" />
                    <el-option :label="$t('monitor.job.statusDisabled')" value="DISABLED" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'monitor:job:add'">{{ $t('common.add') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="handleEdit(selectedRows[0])" v-hasPermi="'monitor:job:edit'">{{ $t('common.edit') }}</el-button>
            </el-col>
            <el-col :span="1.5">
                <el-button type="danger" plain :icon="Delete" size="small" :disabled="selectedRows.length !== 1" @click="handleDelete(selectedRows[0])" v-hasPermi="'monitor:job:remove'">{{ $t('common.delete') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="jobCode" :label="$t('monitor.job.jobCode')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="jobName" :label="$t('monitor.job.jobName')" min-width="170" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="jobGroup" :label="$t('monitor.job.jobGroup')" min-width="120" align="center" />
            <el-table-column prop="handlerCode" :label="$t('monitor.job.handlerCode')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="cronExpression" :label="$t('monitor.job.cronExpression')" min-width="150" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ row.cronExpression || '-' }}</template>
            </el-table-column>
            <el-table-column prop="executeMode" :label="$t('monitor.job.executeMode')" width="100" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="row.executeMode === 'ASYNC' ? 'active' : 'enabled'" :text="formatExecuteMode(row.executeMode)" />
                </template>
            </el-table-column>
            <el-table-column prop="status" :label="$t('common.status')" width="100" align="center">
                <template #default="{ row }">
                    <BaseStatusTag :value="row.status === 'ENABLED' ? 'ENABLED' : 'DISABLED'" :text="formatJobStatus(row.status)" />
                </template>
            </el-table-column>
            <el-table-column :label="$t('monitor.job.nextTriggerTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.nextTriggerTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('monitor.job.lastTriggerTime')" min-width="168" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.lastTriggerTime" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" align="center" width="340" class-name="small-padding fixed-width" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'monitor:job:query'">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Document" @click="openJobLogs(row)" v-hasPermi="'monitor:jobLog:query'">{{ $t('monitor.job.viewLogs') }}</el-button>
                    <el-button size="small" type="primary" link :icon="VideoPlay" @click="handleTrigger(row)" v-hasPermi="'monitor:job:run'">{{ $t('monitor.job.execute') }}</el-button>
                    <el-button
                        size="small"
                        type="primary"
                        link
                        :icon="SwitchButton"
                        @click="handleToggleStatus(row)"
                        v-hasPermi="row.status === 'ENABLED' ? 'monitor:job:stop' : 'monitor:job:start'"
                    >
                        {{ row.status === 'ENABLED' ? $t('monitor.job.disableJob') : $t('monitor.job.enableJob') }}
                    </el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="handleEdit(row)" v-hasPermi="'monitor:job:edit'">{{ $t('common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'monitor:job:remove'">{{ $t('common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
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

        <el-dialog :title="dialogTitle" v-model="dialogVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="128px" style="padding: 0 20px">
                <el-form-item :label="$t('monitor.job.jobCode')" prop="jobCode">
                    <el-input v-model="form.jobCode" maxlength="100" :placeholder="$t('common.pleaseInput')" :disabled="formMode === 'edit'" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.jobName')" prop="jobName">
                    <el-input v-model="form.jobName" maxlength="100" :placeholder="$t('common.pleaseInput')" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.jobGroup')" prop="jobGroup">
                    <el-input v-model="form.jobGroup" maxlength="50" :placeholder="$t('common.pleaseInput')" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.handlerCode')" prop="handlerCode">
                    <el-select v-model="form.handlerCode" filterable style="width: 100%" :placeholder="$t('common.pleaseSelect')" @change="handleHandlerChange">
                        <el-option
                            v-for="handler in handlerOptions"
                            :key="handler.handlerCode"
                            :label="`${handler.handlerName} (${handler.handlerCode})`"
                            :value="handler.handlerCode"
                        />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.schedulerMode')" prop="schedulerMode">
                    <el-select v-model="form.schedulerMode" style="width: 100%">
                        <el-option :label="$t('monitor.job.schedulerModeStandalone')" value="STANDALONE" />
                        <el-option :label="$t('monitor.job.schedulerModeDistributed')" value="DISTRIBUTED" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.triggerMode')" prop="triggerMode">
                    <el-select v-model="form.triggerMode" style="width: 100%">
                        <el-option :label="$t('monitor.job.triggerModeCron')" value="CRON" />
                        <el-option :label="$t('monitor.job.triggerModeManual')" value="MANUAL" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.cronExpression')" prop="cronExpression">
                    <el-input v-model="form.cronExpression" maxlength="100" :placeholder="$t('monitor.job.cronPlaceholder')" :disabled="form.triggerMode === 'MANUAL'">
                        <template #append>
                            <el-button :disabled="form.triggerMode === 'MANUAL'" @click="openCronGenerator">{{ $t('monitor.job.generateCron') }}</el-button>
                        </template>
                    </el-input>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.misfireStrategy')" prop="misfireStrategy">
                    <el-select v-model="form.misfireStrategy" style="width: 100%">
                        <el-option :label="$t('monitor.job.misfireIgnore')" value="IGNORE" />
                        <el-option :label="$t('monitor.job.misfireFireOnce')" value="FIRE_ONCE" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.timeoutSeconds')" prop="timeoutSeconds">
                    <el-input-number v-model="form.timeoutSeconds" :min="1" :max="86400" style="width: 100%" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.retryCount')" prop="retryCount">
                    <el-input-number v-model="form.retryCount" :min="0" :max="10" style="width: 100%" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.retryIntervalSeconds')" prop="retryIntervalSeconds">
                    <el-input-number v-model="form.retryIntervalSeconds" :min="1" :max="86400" style="width: 100%" />
                </el-form-item>
                <el-form-item :label="$t('monitor.job.allowConcurrent')" prop="allowConcurrent">
                    <el-radio-group v-model="form.allowConcurrent">
                        <el-radio :value="0">{{ $t('common.no') }}</el-radio>
                        <el-radio :value="1">{{ $t('common.yes') }}</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item :label="$t('common.status')" prop="status">
                    <el-select v-model="form.status" style="width: 100%">
                        <el-option :label="$t('monitor.job.statusEnabled')" value="ENABLED" />
                        <el-option :label="$t('monitor.job.statusDisabled')" value="DISABLED" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="$t('monitor.job.params')" prop="params">
                    <el-input v-model="form.params" type="textarea" :rows="5" :placeholder="$t('monitor.job.paramsPlaceholder')" />
                </el-form-item>
                <el-form-item :label="$t('common.remark')" prop="description">
                    <el-input v-model="form.description" type="textarea" :rows="3" :placeholder="$t('common.pleaseInput')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="dialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="$t('monitor.job.triggerDialogTitle')" v-model="triggerDialogVisible" width="560px" append-to-body destroy-on-close>
            <el-form :model="triggerForm" label-width="112px">
                <el-form-item :label="$t('monitor.job.params')">
                    <el-input v-model="triggerForm.paramsJson" type="textarea" :rows="6" :placeholder="$t('monitor.job.triggerParamsPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitTrigger">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="triggerDialogVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <DetailDescriptions
            v-model:visible="detailVisible"
            :title="$t('common.detail')"
            :data="detailData"
            :items="detailItems"
            :column="1"
        >
            <template #cell-status="{ data }">
                <BaseStatusTag :value="String(data?.status || '') === 'ENABLED' ? 'ENABLED' : 'DISABLED'" :text="formatJobStatus(String(data?.status || ''))" />
            </template>
            <template #cell-executeMode="{ data }">
                {{ formatExecuteMode(String(data?.executeMode || '')) }}
            </template>
            <template #cell-schedulerMode="{ data }">
                {{ formatSchedulerMode(String(data?.schedulerMode || '')) }}
            </template>
            <template #cell-nextTriggerTime="{ data }">
                <BaseDateTime :value="String(data?.nextTriggerTime || '')" />
            </template>
            <template #cell-lastTriggerTime="{ data }">
                <BaseDateTime :value="String(data?.lastTriggerTime || '')" />
            </template>
        </DetailDescriptions>

        <CronExpressionGenerator
            v-model="cronGeneratorVisible"
            :expression="form.cronExpression"
            @confirm="handleCronGenerated"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, View, VideoPlay, SwitchButton, Document } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import BaseStatusTag from '@/components/BaseStatusTag/index.vue';
import CronExpressionGenerator from '@/components/CronExpressionGenerator/index.vue';
import DetailDescriptions from '@/components/DetailDescriptions.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
    changeJobStatus,
    createJob,
    deleteJob,
    getJobHandlers,
    searchJobs,
    triggerJob,
    updateJob,
    type JobHandlerOption,
    type JobTaskRow,
    type JobTaskSaveRequest,
} from '@/api/monitor/job';

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const showSearch = ref(true);
const rows = ref<JobTaskRow[]>([]);
const selectedRows = ref<JobTaskRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const query = reactive({
    jobCode: '',
    jobName: '',
    jobGroup: '',
    status: '',
});

const formRef = ref<FormInstance>();
const dialogVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const dialogTitle = computed(() => formMode.value === 'create' ? t('common.add') : t('common.edit'));
const handlerOptions = ref<JobHandlerOption[]>([]);
const form = reactive<JobTaskSaveRequest & { id?: number }>({
    id: undefined,
    jobCode: '',
    jobName: '',
    jobGroup: 'system',
    handlerCode: '',
    cronExpression: '',
    schedulerMode: 'STANDALONE',
    triggerMode: 'CRON',
    misfireStrategy: 'IGNORE',
    timeoutSeconds: 300,
    retryCount: 0,
    retryIntervalSeconds: 60,
    allowConcurrent: 0,
    params: '',
    status: 'ENABLED',
    description: '',
});

const triggerDialogVisible = ref(false);
const triggerTarget = ref<JobTaskRow | null>(null);
const triggerForm = reactive({
    paramsJson: '',
});
const cronGeneratorVisible = ref(false);

const detailVisible = ref(false);
const detailData = ref<Record<string, unknown> | null>(null);
const detailItems = computed(() => [
    { prop: 'jobCode', label: t('monitor.job.jobCode') },
    { prop: 'jobName', label: t('monitor.job.jobName') },
    { prop: 'jobGroup', label: t('monitor.job.jobGroup') },
    { prop: 'handlerCode', label: t('monitor.job.handlerCode') },
    { prop: 'cronExpression', label: t('monitor.job.cronExpression') },
    { prop: 'schedulerMode', label: t('monitor.job.schedulerMode') },
    { prop: 'executeMode', label: t('monitor.job.executeMode') },
    { prop: 'status', label: t('common.status') },
    { prop: 'nextTriggerTime', label: t('monitor.job.nextTriggerTime') },
    { prop: 'lastTriggerTime', label: t('monitor.job.lastTriggerTime') },
    { prop: 'params', label: t('monitor.job.params') },
    { prop: 'description', label: t('common.remark') },
]);

const rules = computed<FormRules>(() => ({
    jobCode: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    jobName: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    jobGroup: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    handlerCode: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    schedulerMode: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    triggerMode: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    misfireStrategy: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    cronExpression: [{
        validator: (_rule, value, callback) => {
            if (form.triggerMode === 'CRON' && !String(value || '').trim()) {
                callback(new Error(t('monitor.job.cronRequired')));
                return;
            }
            callback();
        },
        trigger: 'blur',
    }],
}));

onMounted(async () => {
    await loadHandlers();
    await loadData();
});

async function loadHandlers() {
    try {
        handlerOptions.value = await getJobHandlers();
    } catch (error) {
        console.error(error);
        handlerOptions.value = [];
    }
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchJobs({
            pageNo: page.value,
            pageSize: pageSize.value,
            jobCode: query.jobCode.trim() || undefined,
            jobName: query.jobName.trim() || undefined,
            jobGroup: query.jobGroup.trim() || undefined,
            status: query.status || undefined,
        });
        rows.value = result.records;
        total.value = result.total;
    } catch (error) {
        console.error(error);
        rows.value = [];
        total.value = 0;
        ElMessage.error(t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.jobCode = '';
    query.jobName = '';
    query.jobGroup = '';
    query.status = '';
    handleSearch();
}

function handleSelectionChange(selection: JobTaskRow[]) {
    selectedRows.value = selection;
}

function resetForm() {
    Object.assign(form, {
        id: undefined,
        jobCode: '',
        jobName: '',
        jobGroup: 'system',
        handlerCode: '',
        cronExpression: '',
        schedulerMode: 'STANDALONE',
        triggerMode: 'CRON',
        misfireStrategy: 'IGNORE',
        timeoutSeconds: 300,
        retryCount: 0,
        retryIntervalSeconds: 60,
        allowConcurrent: 0,
        params: '',
        status: 'ENABLED',
        description: '',
    });
}

function handleAdd() {
    formMode.value = 'create';
    resetForm();
    dialogVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleEdit(row?: JobTaskRow) {
    if (!row) {
        return;
    }
    formMode.value = 'edit';
    Object.assign(form, {
        id: row.id,
        jobCode: row.jobCode,
        jobName: row.jobName,
        jobGroup: row.jobGroup,
        handlerCode: row.handlerCode,
        cronExpression: row.cronExpression || '',
        schedulerMode: row.schedulerMode as 'STANDALONE' | 'DISTRIBUTED',
        triggerMode: row.triggerMode as 'CRON' | 'MANUAL',
        misfireStrategy: row.misfireStrategy as 'IGNORE' | 'FIRE_ONCE',
        timeoutSeconds: row.timeoutSeconds,
        retryCount: row.retryCount,
        retryIntervalSeconds: row.retryIntervalSeconds,
        allowConcurrent: row.allowConcurrent,
        params: row.params || '',
        status: row.status as 'ENABLED' | 'DISABLED',
        description: row.description || '',
    });
    dialogVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleHandlerChange(handlerCode: string) {
    const selected = handlerOptions.value.find((item) => item.handlerCode === handlerCode);
    if (!selected) {
        return;
    }
    form.jobGroup = selected.jobGroup || form.jobGroup;
    if (selected.allowConcurrent === false) {
        form.allowConcurrent = 0;
    }
}

function openCronGenerator() {
    if (form.triggerMode === 'MANUAL') {
        return;
    }
    cronGeneratorVisible.value = true;
}

function handleCronGenerated(expression: string) {
    form.cronExpression = expression;
    nextTick(() => formRef.value?.validateField('cronExpression'));
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const payload: JobTaskSaveRequest = {
        jobCode: form.jobCode.trim(),
        jobName: form.jobName.trim(),
        jobGroup: form.jobGroup.trim(),
        handlerCode: form.handlerCode,
        cronExpression: form.triggerMode === 'CRON' ? String(form.cronExpression || '').trim() : '',
        schedulerMode: form.schedulerMode,
        triggerMode: form.triggerMode,
        misfireStrategy: form.misfireStrategy,
        timeoutSeconds: form.timeoutSeconds,
        retryCount: form.retryCount,
        retryIntervalSeconds: form.retryIntervalSeconds,
        allowConcurrent: form.allowConcurrent,
        params: String(form.params || '').trim(),
        status: form.status,
        description: String(form.description || '').trim(),
    };
    try {
        if (formMode.value === 'create') {
            await createJob(payload);
            ElMessage.success(t('common.addSuccess'));
        } else if (form.id) {
            await updateJob(form.id, payload);
            ElMessage.success(t('common.editSuccess'));
        }
        dialogVisible.value = false;
        loadData();
    } catch (error: unknown) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function handleToggleStatus(row: JobTaskRow) {
    const targetStatus = row.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    try {
        await ElMessageBox.confirm(
            t('monitor.job.statusToggleConfirm', { action: formatJobStatus(targetStatus), name: row.jobName }),
            t('common.operationConfirm'),
            { type: 'warning' },
        );
    } catch {
        return;
    }
    try {
        await changeJobStatus(row.id, targetStatus);
        ElMessage.success(t('common.success'));
        loadData();
    } catch (error: unknown) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

function handleTrigger(row: JobTaskRow) {
    triggerTarget.value = row;
    triggerForm.paramsJson = row.params || '';
    triggerDialogVisible.value = true;
}

/**
 * 跳转到任务日志页，并自动带上当前任务编码作为筛选条件。
 */
function openJobLogs(row: JobTaskRow) {
    router.push({
        path: '/monitor/job-log',
        query: {
            jobCode: row.jobCode,
        },
    });
}

async function submitTrigger() {
    if (!triggerTarget.value) {
        return;
    }
    try {
        const runId = await triggerJob(triggerTarget.value.id, {
            paramsJson: String(triggerForm.paramsJson || '').trim(),
        });
        ElMessage.success(t('monitor.job.triggerSuccess', { runId }));
        triggerDialogVisible.value = false;
        loadData();
    } catch (error: unknown) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

async function handleDelete(row?: JobTaskRow) {
    if (!row) {
        return;
    }
    try {
        await ElMessageBox.confirm(
            t('monitor.job.deleteConfirm', { name: row.jobName }),
            t('common.delete'),
            { type: 'warning' },
        );
    } catch {
        return;
    }
    try {
        await deleteJob(row.id);
        ElMessage.success(t('common.deleteSuccess'));
        loadData();
    } catch (error: unknown) {
        console.error(error);
        ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
    }
}

function openDetail(row: JobTaskRow) {
    detailData.value = row as unknown as Record<string, unknown>;
    detailVisible.value = true;
}

function formatJobStatus(status: string) {
    return status === 'ENABLED' ? t('monitor.job.statusEnabled') : t('monitor.job.statusDisabled');
}

function formatExecuteMode(mode: string) {
    return mode === 'ASYNC' ? t('monitor.job.executeModeAsync') : t('monitor.job.executeModeSync');
}

function formatSchedulerMode(mode: string) {
    return mode === 'DISTRIBUTED' ? t('monitor.job.schedulerModeDistributed') : t('monitor.job.schedulerModeStandalone');
}
</script>
