<template>
    <div class="app-container">
        <el-form v-show="showSearch" :model="query" inline size="small" class="search-form" label-width="82px">
            <el-form-item :label="$t('feeAccount.versionStatus')">
                <el-select v-model="query.versionStatus" clearable :placeholder="$t('feeAccount.pendingReview')">
                    <el-option :label="$t('feeAccount.status.PENDING_REVIEW')" value="PENDING_REVIEW" /><el-option :label="$t('feeAccount.status.REJECTED')" value="REJECTED" /><el-option :label="$t('feeAccount.status.ACTIVE')" value="ACTIVE" />
                </el-select>
            </el-form-item>
            <el-form-item><el-button :icon="Search" type="primary" size="small" @click="search">{{ $t('common.search') }}</el-button><el-button :icon="RefreshLeft" size="small" @click="reset">{{ $t('common.reset') }}</el-button></el-form-item>
        </el-form>
        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button v-hasPermi="'fee:review:export'" :icon="Download" type="warning" plain size="small" @click="handleExport">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="load" /></el-col>
        </el-row>
        <StandardTable v-loading="loading" table-key="admin-fee-review-list" :data="rows" row-key="versionId" size="small">
            <el-table-column prop="planCode" :label="$t('feeAccount.planCode')" min-width="180" fixed="left" align="center" />
            <el-table-column prop="planName" :label="$t('feeAccount.planName')" min-width="170" align="center" />
            <el-table-column :label="$t('feeAccount.planType')" width="100" align="center"><template #default="scope">{{ scope.row.planType === 'TEMPLATE' ? $t('feeAccount.template') : $t('feeAccount.merchant') }}</template></el-table-column>
            <el-table-column prop="merchantName" :label="$t('feeAccount.merchant')" min-width="160" align="center"><template #default="scope">{{ scope.row.merchantName || scope.row.merchantId || '-' }}</template></el-table-column>
            <el-table-column :label="$t('feeAccount.version')" width="80" align="center"><template #default="scope">v{{ scope.row.versionNo }}</template></el-table-column>
            <el-table-column prop="changeReason" :label="$t('feeAccount.changeReason')" min-width="220" show-overflow-tooltip align="center" />
            <el-table-column prop="submitByName" :label="$t('feeAccount.submitter')" width="130" align="center" />
            <el-table-column :label="$t('feeAccount.submitTime')" min-width="170" align="center"><template #default="scope"><BaseDateTime :value="scope.row.submitTime" /></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="220" fixed="right" align="center">
                <template #default="scope">
                    <el-button link type="primary" @click="openDetail(scope.row)">{{ $t('feeAccount.viewConfiguration') }}</el-button>
                    <template v-if="(query.versionStatus || 'PENDING_REVIEW') === 'PENDING_REVIEW'">
                        <el-button v-hasPermi="'fee:review:approve'" link type="success" @click="openReview(scope.row, 'APPROVE')">{{ $t('feeAccount.approve') }}</el-button>
                        <el-button v-hasPermi="'fee:review:reject'" link type="danger" @click="openReview(scope.row, 'REJECT')">{{ $t('feeAccount.reject') }}</el-button>
                    </template>
                </template>
            </el-table-column>
        </StandardTable>
        <div v-show="total > 0" class="pagination-container"><el-pagination v-model:current-page="query.pageNo" v-model:page-size="query.pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @current-change="load" @size-change="search" /></div>

        <FeePlanDetailDrawer v-model:visible="detailVisible" :plan="detail" :title="$t('feeAccount.versionHistory', { name: detail?.planName || '' })" :show-merchant="detail?.planType === 'MERCHANT'" />

        <el-dialog v-model="reviewVisible" :title="reviewAction === 'APPROVE' ? $t('feeAccount.approveVersionTitle') : $t('feeAccount.rejectVersionTitle')" width="520px">
            <el-descriptions v-if="reviewing" :column="2" border size="small">
                <el-descriptions-item :label="$t('feeAccount.plan')">{{ reviewing.planName }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.version')">v{{ reviewing.versionNo }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitter')">{{ reviewing.submitByName }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.submitTime')"><BaseDateTime :value="reviewing.submitTime" /></el-descriptions-item>
            </el-descriptions>
            <el-form label-position="top" class="review-comment-form">
                <el-form-item :label="reviewAction === 'REJECT' ? $t('feeAccount.rejectionReason') : $t('feeAccount.reviewComment')" :required="reviewAction === 'REJECT'">
                    <el-input v-model="reviewComment" type="textarea" :rows="4" maxlength="500" show-word-limit />
                </el-form-item>
            </el-form>
            <template #footer><div class="dialog-footer"><el-button :type="reviewAction === 'APPROVE' ? 'success' : 'danger'" :loading="saving" @click="submitReview">{{ $t('common.confirm') }}</el-button><el-button @click="reviewVisible = false">{{ $t('common.cancel') }}</el-button></div></template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Download, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { approveFeeVersion, exportFeeReviews, getFeeTemplate, getMerchantFee, rejectFeeVersion, searchFeeReviews, type FeePlanDetail, type FeePlanQuery, type FeeReview } from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import FeePlanDetailDrawer from '@/views/fee/components/FeePlanDetailDrawer.vue';

const loading = ref(false);
const { t } = useI18n();
const saving = ref(false);
const showSearch = ref(true);
const rows = ref<FeeReview[]>([]);
const total = ref(0);
const query = ref<FeePlanQuery>({ pageNo: 1, pageSize: 10, versionStatus: 'PENDING_REVIEW' });
const detailVisible = ref(false);
const detail = ref<FeePlanDetail | null>(null);
const reviewVisible = ref(false);
const reviewing = ref<FeeReview | null>(null);
const reviewAction = ref<'APPROVE' | 'REJECT'>('APPROVE');
const reviewComment = ref('');

onMounted(load);

async function load() {
    loading.value = true;
    try {
        const result = await searchFeeReviews(query.value);
        rows.value = result.records || [];
        total.value = result.total || 0;
    } finally { loading.value = false; }
}
function search() { query.value.pageNo = 1; load(); }
function reset() { query.value = { pageNo: 1, pageSize: query.value.pageSize || 10, versionStatus: 'PENDING_REVIEW' }; load(); }
function handleExport() { exportFeeReviews(query.value); }

async function openDetail(row: FeeReview) {
    detail.value = row.planType === 'TEMPLATE'
        ? await getFeeTemplate(row.planId)
        : await getMerchantFee(row.merchantId || '');
    detailVisible.value = true;
}

function openReview(row: FeeReview, action: 'APPROVE' | 'REJECT') {
    reviewing.value = row;
    reviewAction.value = action;
    reviewComment.value = '';
    reviewVisible.value = true;
}

async function submitReview() {
    if (!reviewing.value) return;
    if (reviewAction.value === 'REJECT' && !reviewComment.value.trim()) return ElMessage.warning(t('feeAccount.rejectionReasonRequired'));
    saving.value = true;
    try {
        if (reviewAction.value === 'APPROVE') await approveFeeVersion(reviewing.value.versionId, reviewComment.value.trim() || undefined);
        else await rejectFeeVersion(reviewing.value.versionId, reviewComment.value.trim());
        ElMessage.success(t(reviewAction.value === 'APPROVE' ? 'feeAccount.versionActivated' : 'feeAccount.versionRejected'));
        reviewVisible.value = false;
        await load();
    } finally { saving.value = false; }
}
</script>

<style scoped>
.search-form :deep(.el-select) { width: 180px; }
.review-comment-form { margin-top: 18px; }
</style>
