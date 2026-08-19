<template>
    <div class="app-container">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="76px">
            <el-form-item :label="$t('feeAccount.keyword')"><el-input v-model="query.keyword" clearable :placeholder="$t('feeAccount.templateKeywordPlaceholder')" @keyup.enter="search" /></el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.status" clearable :placeholder="$t('feeAccount.allStatuses')">
                    <el-option :label="$t('feeAccount.status.ENABLED')" value="ENABLED" /><el-option :label="$t('feeAccount.status.DISABLED')" value="DISABLED" /><el-option :label="$t('feeAccount.status.ARCHIVED')" value="ARCHIVED" />
                </el-select>
            </el-form-item>
            <el-form-item><el-button :icon="Search" type="primary" size="small" @click="search">{{ $t('common.search') }}</el-button><el-button :icon="RefreshLeft" size="small" @click="reset">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button v-hasPermi="'fee:template:add'" :icon="Plus" type="primary" plain size="small" @click="openCreate">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button v-hasPermi="'fee:template:export'" :icon="Download" type="warning" plain size="small" @click="handleExport">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="load" /></el-col>
        </el-row>

        <StandardTable v-loading="loading" table-key="admin-fee-template-list" :data="rows" row-key="id" size="small">
            <el-table-column prop="planCode" :label="$t('feeAccount.templateCode')" min-width="190" fixed="left" align="center" />
            <el-table-column prop="planName" :label="$t('feeAccount.templateName')" min-width="180" align="center" />
            <el-table-column :label="$t('feeAccount.currentVersion')" width="100" align="center"><template #default="scope">{{ scope.row.currentVersionNo ? `v${scope.row.currentVersionNo}` : '-' }}</template></el-table-column>
            <el-table-column :label="$t('common.status')" width="110" align="center"><template #default="scope"><el-tag :type="planStatusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column :label="$t('feeAccount.pendingReview')" width="100" align="center"><template #default="scope"><el-tag v-if="scope.row.pendingVersionStatus" type="warning">{{ $t('feeAccount.pendingReview') }}</el-tag><span v-else>-</span></template></el-table-column>
            <el-table-column prop="remark" :label="$t('common.remark')" min-width="180" show-overflow-tooltip align="center" />
            <el-table-column :label="$t('common.updateTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.updateTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="300" fixed="right" align="center">
                <template #default="scope">
                    <el-button v-hasPermi="'fee:template:detail'" link type="primary" @click="openDetail(scope.row)">{{ $t('common.detail') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED'" v-hasPermi="'fee:template:edit'" link type="primary" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="openVersion(scope.row)">{{ $t('feeAccount.newVersion') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED' && scope.row.currentVersionId" v-hasPermi="'fee:template:status'" link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="toggleStatus(scope.row)">{{ scope.row.status === 'ENABLED' ? $t('common.disable') : $t('common.enable') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED'" v-hasPermi="'fee:template:archive'" link type="danger" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="archive(scope.row)">{{ $t('feeAccount.archive') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>
        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="load" @size-change="search" /></div>

        <FeePlanDetailDrawer v-model:visible="detailVisible" :plan="detail" :title="detail?.planName || $t('feeAccount.templateDetail')" />

        <el-dialog v-model="editorVisible" :title="editorMode === 'CREATE' ? $t('feeAccount.addTemplateTitle') : $t('feeAccount.submitNewVersionTitle', { name: editingPlan?.planName || '' })" width="min(1080px, 96vw)" destroy-on-close>
            <el-form label-position="top">
                <el-row v-if="editorMode === 'CREATE'" :gutter="16">
                    <el-col :xs="24" :sm="12"><el-form-item :label="$t('feeAccount.templateName')" required><el-input v-model="templateName" maxlength="128" /></el-form-item></el-col>
                    <el-col :xs="24" :sm="12"><el-form-item :label="$t('common.remark')"><el-input v-model="templateRemark" maxlength="500" /></el-form-item></el-col>
                </el-row>
                <FeeVersionEditor v-model="editorModel" />
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="saving" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="editorVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Plus, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    archiveFeeTemplate,
    createFeeTemplate,
    createFeeTemplateVersion,
    exportFeeTemplates,
    getFeeTemplate,
    searchFeeTemplates,
    updateFeeTemplateStatus,
    type FeePlanDetail,
    type FeePlanQuery,
    type FeePlanSummary,
    type FeeVersionInput,
} from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import FeePlanDetailDrawer from '@/views/fee/components/FeePlanDetailDrawer.vue';
import FeeVersionEditor from '@/views/fee/components/FeeVersionEditor.vue';
import { createEmptyVersion, planStatusType, statusText, validateFeeVersion, versionToInput } from '@/views/fee/shared';

const loading = ref(false);
const { t } = useI18n();
const saving = ref(false);
const showSearch = ref(true);
const rows = ref<FeePlanSummary[]>([]);
const total = ref(0);
const query = ref<FeePlanQuery>({ pageNo: 1, pageSize: 10 });
const detailVisible = ref(false);
const detail = ref<FeePlanDetail | null>(null);
const editorVisible = ref(false);
const editorMode = ref<'CREATE' | 'VERSION'>('CREATE');
const editingPlan = ref<FeePlanSummary | null>(null);
const editorModel = ref<FeeVersionInput>(createEmptyVersion());
const templateName = ref('');
const templateRemark = ref('');

onMounted(load);

async function load() {
    loading.value = true;
    try {
        const result = await searchFeeTemplates(query.value);
        rows.value = result.records || [];
        total.value = result.total || 0;
    } finally { loading.value = false; }
}

function search() { query.value.pageNo = 1; load(); }
function reset() { query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 }; load(); }

function handleExport() { exportFeeTemplates(query.value); }

function openCreate() {
    editorMode.value = 'CREATE';
    editingPlan.value = null;
    templateName.value = '';
    templateRemark.value = '';
    editorModel.value = createEmptyVersion();
    editorVisible.value = true;
}

async function openVersion(row: FeePlanSummary) {
    if (!row.id) return;
    const plan = await getFeeTemplate(row.id);
    editorMode.value = 'VERSION';
    editingPlan.value = row;
    editorModel.value = versionToInput(plan.currentVersion);
    editorVisible.value = true;
}

async function openDetail(row: FeePlanSummary) {
    if (!row.id) return;
    detail.value = await getFeeTemplate(row.id);
    detailVisible.value = true;
}

async function submit() {
    if (editorMode.value === 'CREATE' && !templateName.value.trim()) return ElMessage.warning(t('feeAccount.templateNameRequired'));
    const validation = validateFeeVersion(editorModel.value);
    if (validation) return ElMessage.warning(validation);
    saving.value = true;
    try {
        if (editorMode.value === 'CREATE') {
            await createFeeTemplate({ ...editorModel.value, planName: templateName.value.trim(), remark: templateRemark.value.trim() || undefined });
        } else if (editingPlan.value?.id) {
            await createFeeTemplateVersion(editingPlan.value.id, editorModel.value);
        }
        ElMessage.success(t('feeAccount.submittedForReview'));
        editorVisible.value = false;
        await load();
    } finally { saving.value = false; }
}

async function archive(row: FeePlanSummary) {
    if (!row.id) return;
    await ElMessageBox.confirm(t('feeAccount.archiveConfirm', { name: row.planName }), t('feeAccount.archiveTitle'), { type: 'warning' });
    await archiveFeeTemplate(row.id);
    ElMessage.success(t('feeAccount.archivedSuccess'));
    await load();
}

async function toggleStatus(row: FeePlanSummary) {
    if (!row.id) return;
    const enabled = row.status !== 'ENABLED';
    const message = enabled
        ? t('feeAccount.enableTemplateConfirm', { name: row.planName })
        : t('feeAccount.disableTemplateConfirm', { name: row.planName });
    await ElMessageBox.confirm(message, t(enabled ? 'feeAccount.enableTemplateTitle' : 'feeAccount.disableTemplateTitle'), { type: 'warning' });
    await updateFeeTemplateStatus(row.id, enabled);
    ElMessage.success(t(enabled ? 'feeAccount.enabledTemplateSuccess' : 'feeAccount.disabledTemplateSuccess'));
    await load();
}
</script>

<style scoped>
.search-form :deep(.el-select) { width: 180px; }
</style>
