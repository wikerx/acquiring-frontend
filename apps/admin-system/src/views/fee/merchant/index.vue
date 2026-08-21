<template>
    <div class="app-container">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('feeAccount.merchant')"><MerchantRemoteSelect v-model="query.keyword" @change="search" /></el-form-item>
            <el-form-item :label="$t('feeAccount.configurationStatus')">
                <el-select v-model="query.status" clearable :placeholder="$t('feeAccount.allStatuses')">
                    <el-option :label="$t('feeAccount.status.UNCONFIGURED')" value="UNCONFIGURED" /><el-option :label="$t('feeAccount.status.ENABLED')" value="ENABLED" /><el-option :label="$t('feeAccount.status.DISABLED')" value="DISABLED" />
                </el-select>
            </el-form-item>
            <el-form-item><el-button :icon="Search" type="primary" size="small" @click="search">{{ $t('common.search') }}</el-button><el-button :icon="RefreshLeft" size="small" @click="reset">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button v-hasPermi="'fee:merchant:export'" :icon="Download" type="warning" plain size="small" @click="handleExport">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="load" /></el-col>
        </el-row>
        <StandardTable v-loading="loading" table-key="admin-merchant-fee-list" :data="rows" row-key="merchantId" size="small">
            <el-table-column prop="merchantId" :label="$t('feeAccount.merchantId')" min-width="160" fixed="left" align="center" />
            <el-table-column prop="merchantName" :label="$t('feeAccount.merchantName')" min-width="180" align="center" />
            <el-table-column :label="$t('feeAccount.configurationOrigin')" min-width="150" align="center"><template #default="scope">{{ originText(scope.row.originType) }}</template></el-table-column>
            <el-table-column :label="$t('feeAccount.currentVersion')" width="100" align="center"><template #default="scope">{{ scope.row.currentVersionNo ? `v${scope.row.currentVersionNo}` : '-' }}</template></el-table-column>
            <el-table-column :label="$t('common.status')" width="110" align="center"><template #default="scope"><el-tag :type="planStatusType(scope.row.status)">{{ statusText(scope.row.status) }}</el-tag></template></el-table-column>
            <el-table-column :label="$t('feeAccount.pendingReview')" width="100" align="center"><template #default="scope"><el-tag v-if="scope.row.pendingVersionStatus" type="warning">{{ $t('feeAccount.pendingReview') }}</el-tag><span v-else>-</span></template></el-table-column>
            <el-table-column :label="$t('common.updateTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.updateTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="220" fixed="right" align="center">
                <template #default="scope">
                    <el-button v-if="scope.row.id" v-hasPermi="'fee:merchant:detail'" link type="primary" @click="openDetail(scope.row)">{{ $t('common.detail') }}</el-button>
                    <el-tooltip
                        v-if="canShowReview(scope.row)"
                        :disabled="!isOwnSubmission(scope.row)"
                        :content="$t('feeAccount.ownSubmissionReviewBlocked')"
                        placement="top"
                    >
                        <span><el-button link type="success" :disabled="isOwnSubmission(scope.row)" @click="openInlineReview(scope.row)">{{ $t('feeAccount.review') }}</el-button></span>
                    </el-tooltip>
                    <el-button v-if="canConfigureMerchantFee" link type="primary" :disabled="Boolean(scope.row.pendingVersionStatus)" @click="openConfigure(scope.row)">{{ configureActionText(scope.row) }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>
        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="load" @size-change="search" /></div>

        <FeePlanDetailDrawer v-model:visible="detailVisible" :plan="detail" :title="$t('feeAccount.merchantFeeDetail', { name: detail?.merchantName || '' })" show-merchant />

        <el-dialog v-model="editorVisible" :title="$t('feeAccount.merchantFeeConfig', { name: editingMerchant?.merchantName || editingMerchant?.merchantId || '' })" width="min(1240px, 96vw)" class="fee-editor-dialog" append-to-body destroy-on-close>
            <el-form label-position="top">
                <section class="fee-dialog-basic">
                    <div class="fee-dialog-basic__title">{{ $t('feeAccount.basicInformation') }}</div>
                    <el-form-item :label="$t('feeAccount.configurationMode')" required>
                        <el-segmented v-model="configureMode" :options="configureModeOptions" @change="changeConfigureMode" />
                    </el-form-item>
                    <el-alert
                        v-if="rejectedBaseVersion"
                        class="fee-rejected-alert"
                        type="error"
                        show-icon
                        :closable="false"
                        :title="$t('feeAccount.rejectedRetryTitle', { version: rejectedBaseVersion.versionNo })"
                        :description="$t('feeAccount.rejectedRetryReason', { reason: rejectedBaseVersion.reviewComment || $t('feeAccount.rejectedRetryReasonMissing') })"
                    />
                    <el-row v-if="configureMode !== 'CURRENT'" :gutter="16">
                        <el-col :xs="24" :sm="12">
                            <el-form-item :label="$t('feeAccount.feeTemplate')" required>
                                <el-select v-model="selectedTemplateId" filterable :placeholder="$t('feeAccount.selectEnabledTemplate')" @change="selectTemplate">
                                    <el-option v-for="item in templates" :key="item.id || 0" :label="`${item.planName} / v${item.currentVersionNo}`" :value="item.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :xs="24" :sm="12"><el-form-item :label="$t('feeAccount.planRemark')"><el-input v-model="planRemark" maxlength="500" /></el-form-item></el-col>
                    </el-row>
                </section>
                <section v-if="configureMode === 'TEMPLATE'" class="fee-dialog-reason">
                    <div class="fee-dialog-basic__title">{{ $t('feeAccount.settlementSettings') }}</div>
                    <el-form-item :label="$t('feeAccount.settlementCurrency')" required>
                        <el-select v-model="editorModel.settlementCurrency" filterable>
                            <el-option v-for="currency in currencyOptions" :key="currency" :label="currency" :value="currency" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="isInitialConfiguration ? $t('feeAccount.changeReasonOptional') : $t('feeAccount.changeReason')" :required="!isInitialConfiguration">
                        <el-input v-model="copyReason" type="textarea" :rows="3" maxlength="500" show-word-limit :placeholder="isInitialConfiguration ? $t('feeAccount.initialChangeReasonPlaceholder') : $t('feeAccount.changeReasonPlaceholder')" />
                    </el-form-item>
                </section>
                <FeeVersionEditor v-else v-model="editorModel" :change-reason-required="!isInitialConfiguration" show-settlement-currency :currency-options="currencyOptions" />
            </el-form>
            <template #footer><div class="dialog-footer"><el-button type="primary" :loading="saving" @click="submit">{{ $t('common.confirm') }}</el-button><el-button @click="editorVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
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
import { ElMessage } from 'element-plus';
import { Download, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { getMerchantFormOptions } from '@/api/merchant/info';
import {
    approveFeeVersion,
    assignMerchantFeeTemplate,
    createMerchantCustomFeeVersion,
    exportMerchantFees,
    getFeeTemplate,
    getMerchantFee,
    rejectFeeVersion,
    searchFeeTemplates,
    searchMerchantFees,
    type FeePlanDetail,
    type FeePlanQuery,
    type FeePlanSummary,
    type FeeReview,
    type FeeVersionInput,
} from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import MerchantRemoteSelect from '@/views/transaction/components/MerchantRemoteSelect.vue';
import FeePlanDetailDrawer from '@/views/fee/components/FeePlanDetailDrawer.vue';
import FeeReviewDialog from '@/views/fee/components/FeeReviewDialog.vue';
import FeeVersionEditor from '@/views/fee/components/FeeVersionEditor.vue';
import { createEmptyVersion, feeRequestErrorMessage, normalizeFeeVersionForSubmit, originText, planStatusType, statusText, validateFeeVersion, versionToInput } from '@/views/fee/shared';
import { useUserStore } from '@/store/modules/user';

const loading = ref(false);
const { t } = useI18n();
const route = useRoute();
const userStore = useUserStore();
const canAssignTemplate = userStore.hasPermission('fee:merchant:template:assign');
const canCustomizeFee = userStore.hasPermission('fee:merchant:configure');
const canConfigureMerchantFee = canAssignTemplate || canCustomizeFee;
const saving = ref(false);
const reviewSaving = ref(false);
const showSearch = ref(true);
const rows = ref<FeePlanSummary[]>([]);
const total = ref(0);
const query = ref<FeePlanQuery>({ pageNo: 1, pageSize: 10 });
const detailVisible = ref(false);
const detail = ref<FeePlanDetail | null>(null);
const editorVisible = ref(false);
const reviewVisible = ref(false);
const reviewing = ref<FeeReview | null>(null);
const editingMerchant = ref<FeePlanSummary | null>(null);
const isInitialConfiguration = computed(() => !editingMerchant.value?.id);
const existingPlan = ref<FeePlanDetail | null>(null);
const configureMode = ref<'TEMPLATE' | 'CUSTOMIZED' | 'CURRENT'>('TEMPLATE');
const configureModeOptions = computed(() => [
    ...(canAssignTemplate ? [{ label: t('feeAccount.copyTemplate'), value: 'TEMPLATE' as const }] : []),
    ...(canCustomizeFee ? [
        { label: t('feeAccount.customizeTemplate'), value: 'CUSTOMIZED' as const },
        {
            label: rejectedBaseVersion.value
                ? t('feeAccount.rejectedConfiguration')
                : editingMerchant.value?.id ? t('feeAccount.currentConfiguration') : t('feeAccount.independentConfiguration'),
            value: 'CURRENT' as const,
        },
    ] : []),
]);
const templates = ref<FeePlanSummary[]>([]);
const selectedTemplateId = ref<number | null>(null);
const editorModel = ref<FeeVersionInput>(createEmptyVersion());
const copyReason = ref('');
const planRemark = ref('');
const currencyOptions = ref<string[]>([]);
const rejectedBaseVersion = computed(() => {
    const version = configurationBaseVersion(existingPlan.value);
    return version?.versionStatus === 'REJECTED' ? version : null;
});

onMounted(() => {
    const merchantId = typeof route.query.merchantId === 'string' ? route.query.merchantId.trim() : '';
    if (merchantId) query.value.keyword = merchantId;
    load();
    loadTemplates();
    loadCurrencyOptions();
});

async function load() {
    loading.value = true;
    try {
        const result = await searchMerchantFees(query.value);
        rows.value = result.records || [];
        total.value = result.total || 0;
    } finally { loading.value = false; }
}

async function loadTemplates() {
    const result = await searchFeeTemplates({ pageNo: 1, pageSize: 200, status: 'ENABLED' });
    templates.value = result.records || [];
}

async function loadCurrencyOptions() {
    const result = await getMerchantFormOptions();
    currencyOptions.value = (result.currencies || []).map((item) => item.value.toUpperCase());
}

function search() { query.value.pageNo = 1; load(); }
function reset() { query.value = { pageNo: 1, pageSize: query.value.pageSize || 10 }; load(); }
function handleExport() { exportMerchantFees(query.value); }

function configureActionText(row: FeePlanSummary) {
    if (row.pendingVersionStatus) return t('feeAccount.processingVersion');
    if (!row.id) return t('feeAccount.configure');
    if (!row.currentVersionId && row.status === 'DISABLED') return t('feeAccount.reconfigure');
    return t('feeAccount.newVersion');
}

async function openDetail(row: FeePlanSummary) {
    if (!row.merchantId) return;
    detail.value = await getMerchantFee(row.merchantId);
    detailVisible.value = true;
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

async function openInlineReview(row: FeePlanSummary) {
    if (!row.merchantId || !row.pendingVersionId) return;
    const plan = await getMerchantFee(row.merchantId);
    const version = plan?.versions.find((item) => item.id === row.pendingVersionId
        && item.versionStatus === 'PENDING_REVIEW');
    if (!plan || !version) {
        ElMessage.warning(t('feeAccount.reviewVersionChangedRefresh'));
        await load();
        return;
    }
    reviewing.value = {
        versionId: version.id,
        planId: plan.id!,
        planCode: plan.planCode || '',
        planName: plan.planName || '',
        planType: 'MERCHANT',
        merchantId: plan.merchantId,
        merchantName: plan.merchantName,
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

async function openConfigure(row: FeePlanSummary) {
    if (!row.merchantId) return;
    editingMerchant.value = row;
    existingPlan.value = row.id ? await getMerchantFee(row.merchantId) : null;
    configureMode.value = row.id && canCustomizeFee
        ? 'CURRENT'
        : canAssignTemplate ? 'TEMPLATE' : 'CUSTOMIZED';
    selectedTemplateId.value = null;
    copyReason.value = '';
    planRemark.value = row.remark || '';
    editorModel.value = row.id
        ? versionToInput(configurationBaseVersion(existingPlan.value))
        : createEmptyVersion();
    editorModel.value.settlementCurrency = existingPlan.value?.settlementCurrency || row.settlementCurrency || 'USD';
    editorVisible.value = true;
}

async function changeConfigureMode() {
    const settlementCurrency = existingPlan.value?.settlementCurrency
        || editingMerchant.value?.settlementCurrency || editorModel.value.settlementCurrency || 'USD';
    selectedTemplateId.value = null;
    copyReason.value = '';
    if (configureMode.value === 'CURRENT') editorModel.value = versionToInput(configurationBaseVersion(existingPlan.value));
    else editorModel.value = createEmptyVersion();
    editorModel.value.settlementCurrency = settlementCurrency;
}

function configurationBaseVersion(plan: FeePlanDetail | null) {
    if (!plan?.versions.length) return plan?.currentVersion || null;
    const latestVersion = plan.versions.reduce((latest, version) =>
        version.versionNo > latest.versionNo ? version : latest);
    return latestVersion.versionStatus === 'REJECTED'
        ? latestVersion
        : plan.currentVersion || latestVersion;
}

async function selectTemplate(id?: number) {
    if (!id || configureMode.value !== 'CUSTOMIZED') return;
    const settlementCurrency = editorModel.value.settlementCurrency;
    const template = await getFeeTemplate(id);
    editorModel.value = versionToInput(template.currentVersion);
    editorModel.value.settlementCurrency = settlementCurrency;
}

async function submit() {
    const merchantId = editingMerchant.value?.merchantId;
    if (!merchantId) return;
    if (!editorModel.value.settlementCurrency) return ElMessage.warning(t('feeAccount.settlementCurrencyRequired'));
    if (configureMode.value !== 'CURRENT' && !selectedTemplateId.value) return ElMessage.warning(t('feeAccount.selectTemplateRequired'));
    if (configureMode.value === 'TEMPLATE' && !isInitialConfiguration.value && !copyReason.value.trim()) return ElMessage.warning(t('feeAccount.changeReasonRequired'));
    if (configureMode.value !== 'TEMPLATE') {
        const validation = validateFeeVersion(editorModel.value, { changeReasonRequired: !isInitialConfiguration.value });
        if (validation) return ElMessage.warning(validation);
    }
    saving.value = true;
    try {
        if (configureMode.value === 'TEMPLATE') {
            await assignMerchantFeeTemplate(merchantId, {
                templateId: selectedTemplateId.value!,
                changeReason: copyReason.value.trim(),
                settlementCurrency: editorModel.value.settlementCurrency,
                remark: planRemark.value || undefined,
            });
        } else {
            const submitModel = normalizeFeeVersionForSubmit(editorModel.value);
            await createMerchantCustomFeeVersion(merchantId, {
                ...submitModel,
                templateId: configureMode.value === 'CUSTOMIZED' ? selectedTemplateId.value : null,
                remark: planRemark.value || undefined,
            });
        }
        ElMessage.success(t('feeAccount.submittedForReview'));
        editorVisible.value = false;
        await load();
    } catch (error) {
        ElMessage.error(feeRequestErrorMessage(error, t('common.saveFailed')));
    } finally { saving.value = false; }
}
</script>

<style scoped>
.search-form :deep(.el-select) { width: 240px; }
:deep(.el-segmented) { max-width: 100%; }
.fee-dialog-basic { margin-bottom: 18px; padding: 14px 16px 0; border: 1px solid #dbe3ef; border-radius: 6px; background: #f8fafc; }
.fee-dialog-basic__title { margin-bottom: 12px; color: #334155; font-size: 13px; font-weight: 600; }
.fee-rejected-alert { margin-bottom: 14px; }
.fee-dialog-reason { padding: 16px 16px 2px; border: 1px solid #dbe3ef; border-radius: 6px; background: #f8fafc; }
</style>
