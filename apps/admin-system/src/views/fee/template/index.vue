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
            <el-table-column :label="$t('feeAccount.processingVersion')" width="140" align="center">
                <template #default="scope">
                    <el-tag v-if="scope.row.pendingVersionStatus" :type="versionStatusType(scope.row.pendingVersionStatus)">
                        v{{ scope.row.pendingVersionNo }} {{ statusText(scope.row.pendingVersionStatus) }}
                    </el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="remark" :label="$t('common.remark')" min-width="180" show-overflow-tooltip align="center" />
            <el-table-column :label="$t('common.updateTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.updateTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="360" fixed="right" align="center">
                <template #default="scope">
                    <el-button v-hasPermi="'fee:template:detail'" link type="primary" @click="openDetail(scope.row)">{{ $t('common.detail') }}</el-button>
                    <el-button v-if="scope.row.pendingVersionStatus === 'DRAFT'" v-hasPermi="'fee:template:edit'" link type="primary" @click="openDraft(scope.row)">{{ $t('feeAccount.editDraft') }}</el-button>
                    <el-button v-if="scope.row.pendingVersionStatus === 'DRAFT'" v-hasPermi="'fee:template:submit'" link type="success" @click="submitExistingDraft(scope.row)">{{ $t('feeAccount.submitReview') }}</el-button>
                    <el-tooltip
                        v-if="canShowReview(scope.row)"
                        :disabled="!isOwnSubmission(scope.row)"
                        :content="$t('feeAccount.ownSubmissionReviewBlocked')"
                        placement="top"
                    >
                        <span><el-button link type="success" :disabled="isOwnSubmission(scope.row)" @click="openInlineReview(scope.row)">{{ $t('feeAccount.review') }}</el-button></span>
                    </el-tooltip>
                    <el-button v-if="canWithdraw(scope.row)" v-hasPermi="'fee:template:withdraw'" link type="warning" @click="withdrawReview(scope.row)">{{ $t('feeAccount.withdrawReview') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED' && !scope.row.pendingVersionStatus" v-hasPermi="'fee:template:edit'" link type="primary" @click="openVersion(scope.row)">{{ $t('feeAccount.newVersion') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED' && scope.row.currentVersionId" v-hasPermi="'fee:template:status'" link :type="scope.row.status === 'ENABLED' ? 'warning' : 'success'" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="toggleStatus(scope.row)">{{ scope.row.status === 'ENABLED' ? $t('common.disable') : $t('common.enable') }}</el-button>
                    <el-button v-if="scope.row.status !== 'ARCHIVED'" v-hasPermi="'fee:template:archive'" link type="danger" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="archive(scope.row)">{{ $t('feeAccount.archive') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>
        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="load" @size-change="search" /></div>

        <FeePlanDetailDrawer v-model:visible="detailVisible" :plan="detail" :title="detail?.planName || $t('feeAccount.templateDetail')" />

        <el-dialog v-model="editorVisible" :title="editorTitle" width="min(1240px, 96vw)" class="fee-editor-dialog" append-to-body destroy-on-close>
            <el-form label-position="top">
                <section v-if="editorMode === 'CREATE'" class="fee-dialog-basic">
                    <div class="fee-dialog-basic__title">{{ $t('feeAccount.basicInformation') }}</div>
                    <el-row :gutter="16">
                        <el-col :xs="24" :sm="12"><el-form-item :label="$t('feeAccount.templateName')" required><el-input v-model="templateName" maxlength="128" /></el-form-item></el-col>
                        <el-col :xs="24" :sm="12"><el-form-item :label="$t('common.remark')"><el-input v-model="templateRemark" maxlength="500" /></el-form-item></el-col>
                    </el-row>
                </section>
                <FeeVersionEditor v-model="editorModel" :change-reason-required="changeReasonRequired" />
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="saving" @click="saveDraft(false)">{{ $t('feeAccount.saveDraft') }}</el-button>
                    <el-button v-hasPermi="'fee:template:submit'" type="success" :loading="saving" @click="saveDraft(true)">{{ $t('feeAccount.saveAndSubmit') }}</el-button>
                    <el-button @click="editorVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <FeeReviewDialog
            v-model:visible="reviewVisible"
            :target="reviewing"
            :loading="reviewSaving"
            :can-approve="userStore.hasPermission('fee:review:approve')"
            :can-reject="userStore.hasPermission('fee:review:reject')"
            @submit="submitInlineReview"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Download, Plus, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    archiveFeeTemplate,
    approveFeeVersion,
    createFeeTemplate,
    createFeeTemplateVersion,
    exportFeeTemplates,
    getFeeTemplate,
    rejectFeeVersion,
    searchFeeTemplates,
    submitFeeTemplateVersion,
    updateFeeTemplateStatus,
    updateFeeTemplateDraft,
    withdrawFeeTemplateVersion,
    type FeePlanDetail,
    type FeePlanQuery,
    type FeePlanSummary,
    type FeeReview,
    type FeeVersionInput,
} from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import FeePlanDetailDrawer from '@/views/fee/components/FeePlanDetailDrawer.vue';
import FeeReviewDialog from '@/views/fee/components/FeeReviewDialog.vue';
import FeeVersionEditor from '@/views/fee/components/FeeVersionEditor.vue';
import { createEmptyVersion, feeRequestErrorMessage, normalizeFeeVersionForSubmit, planStatusType, statusText, validateFeeVersion, versionStatusType, versionToInput } from '@/views/fee/shared';

const loading = ref(false);
const { t } = useI18n();
const userStore = useUserStore();
const saving = ref(false);
const showSearch = ref(true);
const rows = ref<FeePlanSummary[]>([]);
const total = ref(0);
const query = ref<FeePlanQuery>({ pageNo: 1, pageSize: 10 });
const detailVisible = ref(false);
const detail = ref<FeePlanDetail | null>(null);
const editorVisible = ref(false);
const editorMode = ref<'CREATE' | 'NEW_VERSION' | 'EDIT_DRAFT'>('CREATE');
const editingPlan = ref<FeePlanSummary | null>(null);
const editingVersionId = ref<number | null>(null);
const editingVersionNo = ref<number | null>(null);
const editorModel = ref<FeeVersionInput>(createEmptyVersion());
const templateName = ref('');
const templateRemark = ref('');
const reviewVisible = ref(false);
const reviewSaving = ref(false);
const reviewing = ref<FeeReview | null>(null);

const editorTitle = computed(() => {
    if (editorMode.value === 'CREATE') return t('feeAccount.addTemplateTitle');
    if (editorMode.value === 'EDIT_DRAFT') {
        return t('feeAccount.editTemplateDraftTitle', {
            name: editingPlan.value?.planName || '',
            version: editingVersionNo.value || '',
        });
    }
    return t('feeAccount.createVersionDraftTitle', { name: editingPlan.value?.planName || '' });
});
const changeReasonRequired = computed(() => (editingVersionNo.value || 1) > 1);

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
    editingVersionId.value = null;
    editingVersionNo.value = 1;
    templateName.value = '';
    templateRemark.value = '';
    editorModel.value = createEmptyVersion();
    editorVisible.value = true;
}

async function openVersion(row: FeePlanSummary) {
    if (!row.id) return;
    const plan = await getFeeTemplate(row.id);
    const baseVersion = plan.currentVersion
        || plan.versions.find((version) => version.versionStatus === 'REJECTED')
        || plan.versions[0];
    editorMode.value = 'NEW_VERSION';
    editingPlan.value = plan;
    editingVersionId.value = null;
    editingVersionNo.value = Math.max(0, ...plan.versions.map((version) => version.versionNo || 0)) + 1;
    editorModel.value = baseVersion
        ? { ...versionToInput(baseVersion), changeReason: '' }
        : createEmptyVersion();
    editorVisible.value = true;
}

async function openDraft(row: FeePlanSummary) {
    if (!row.id || !row.pendingVersionId) return;
    const plan = await getFeeTemplate(row.id);
    const draft = plan.versions.find((version) => version.id === row.pendingVersionId && version.versionStatus === 'DRAFT');
    if (!draft) {
        ElMessage.warning(t('feeAccount.draftChangedRefresh'));
        await load();
        return;
    }
    editorMode.value = 'EDIT_DRAFT';
    editingPlan.value = plan;
    editingVersionId.value = draft.id;
    editingVersionNo.value = draft.versionNo;
    editorModel.value = versionToInput(draft);
    editorVisible.value = true;
}

async function openDetail(row: FeePlanSummary) {
    if (!row.id) return;
    detail.value = await getFeeTemplate(row.id);
    detailVisible.value = true;
}

async function saveDraft(submitAfterSave: boolean) {
    if (editorMode.value === 'CREATE' && !templateName.value.trim()) return ElMessage.warning(t('feeAccount.templateNameRequired'));
    const validation = validateFeeVersion(editorModel.value, { changeReasonRequired: changeReasonRequired.value });
    if (validation) return ElMessage.warning(validation);
    saving.value = true;
    try {
        const submitModel = normalizeFeeVersionForSubmit(editorModel.value);
        let saved: FeePlanDetail;
        if (editorMode.value === 'CREATE') {
            saved = await createFeeTemplate({ ...submitModel, planName: templateName.value.trim(), remark: templateRemark.value.trim() || undefined });
        } else if (editorMode.value === 'EDIT_DRAFT' && editingPlan.value?.id && editingVersionId.value) {
            saved = await updateFeeTemplateDraft(editingPlan.value.id, editingVersionId.value, submitModel);
        } else if (editingPlan.value?.id) {
            saved = await createFeeTemplateVersion(editingPlan.value.id, submitModel);
        } else {
            return;
        }
        const draft = saved.versions.find((version) => version.versionStatus === 'DRAFT');
        if (!draft) {
            ElMessage.error(t('feeAccount.draftSaveResultInvalid'));
            editorVisible.value = false;
            await load();
            return;
        }
        editorMode.value = 'EDIT_DRAFT';
        editingPlan.value = saved;
        editingVersionId.value = draft.id;
        editingVersionNo.value = draft.versionNo;
        if (submitAfterSave) {
            await submitFeeTemplateVersion(draft.id);
            ElMessage.success(t('feeAccount.submittedForReview'));
        } else {
            ElMessage.success(t('feeAccount.draftSaved'));
        }
        editorVisible.value = false;
        await load();
    } catch (error) {
        ElMessage.error(feeRequestErrorMessage(error, t('common.saveFailed')));
    } finally { saving.value = false; }
}

async function submitExistingDraft(row: FeePlanSummary) {
    if (!row.pendingVersionId) return;
    await ElMessageBox.confirm(
        t('feeAccount.submitReviewConfirm', { name: row.planName, version: row.pendingVersionNo }),
        t('feeAccount.submitReviewTitle'),
        { type: 'warning' },
    );
    await submitFeeTemplateVersion(row.pendingVersionId);
    ElMessage.success(t('feeAccount.submittedForReview'));
    await load();
}

function canWithdraw(row: FeePlanSummary) {
    return row.pendingVersionStatus === 'PENDING_REVIEW'
        && row.pendingSubmitById != null
        && row.pendingSubmitById === userStore.userInfo?.userId;
}

function canShowReview(row: FeePlanSummary) {
    const hasReviewPermission = userStore.hasPermission('fee:review:approve')
        || userStore.hasPermission('fee:review:reject');
    return row.pendingVersionStatus === 'PENDING_REVIEW'
        && row.pendingVersionId != null
        && hasReviewPermission;
}

function isOwnSubmission(row: FeePlanSummary) {
    return row.pendingSubmitById != null
        && row.pendingSubmitById === userStore.userInfo?.userId;
}

async function withdrawReview(row: FeePlanSummary) {
    if (!row.pendingVersionId) return;
    await ElMessageBox.confirm(
        t('feeAccount.withdrawReviewConfirm', { name: row.planName, version: row.pendingVersionNo }),
        t('feeAccount.withdrawReviewTitle'),
        { type: 'warning' },
    );
    await withdrawFeeTemplateVersion(row.pendingVersionId);
    ElMessage.success(t('feeAccount.reviewWithdrawn'));
    await load();
}

async function openInlineReview(row: FeePlanSummary) {
    if (!row.id || !row.pendingVersionId) return;
    const plan = await getFeeTemplate(row.id);
    const version = plan.versions.find((item) => item.id === row.pendingVersionId
        && item.versionStatus === 'PENDING_REVIEW');
    if (!version) {
        ElMessage.warning(t('feeAccount.reviewVersionChangedRefresh'));
        await load();
        return;
    }
    reviewing.value = {
        versionId: version.id,
        planId: plan.id!,
        planCode: plan.planCode || '',
        planName: plan.planName || '',
        planType: 'TEMPLATE',
        versionNo: version.versionNo,
        changeType: version.changeType,
        changeReason: version.changeReason,
        submitByName: version.submitByName,
        submitTime: version.submitTime,
    };
    reviewVisible.value = true;
}

async function submitInlineReview(action: 'APPROVE' | 'REJECT', reviewComment: string) {
    const versionId = reviewing.value?.versionId;
    if (!versionId) return;
    reviewSaving.value = true;
    try {
        if (action === 'APPROVE') {
            await approveFeeVersion(versionId, reviewComment || undefined);
            ElMessage.success(t('feeAccount.versionActivated'));
        } else {
            await rejectFeeVersion(versionId, reviewComment);
            ElMessage.success(t('feeAccount.versionRejected'));
        }
        reviewVisible.value = false;
        await load();
    } finally { reviewSaving.value = false; }
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
.fee-dialog-basic { margin-bottom: 18px; padding: 14px 16px 0; border: 1px solid #dbe3ef; border-radius: 6px; background: #f8fafc; }
.fee-dialog-basic__title { margin-bottom: 12px; color: #334155; font-size: 13px; font-weight: 600; }
</style>
