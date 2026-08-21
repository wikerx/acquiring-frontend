<template>
    <el-dialog
        :model-value="visible"
        :title="dialogTitle"
        width="min(720px, 94vw)"
        class="fee-review-dialog"
        append-to-body
        destroy-on-close
        @close="close"
    >
        <div v-if="target" class="fee-review">
            <div class="fee-review__overview">
                <div class="fee-review__identity">
                    <div class="fee-review__identity-line">
                        <el-tag type="warning" effect="light">{{ $t('feeAccount.status.PENDING_REVIEW') }}</el-tag>
                        <strong>{{ target.planName || '-' }}</strong>
                    </div>
                    <span>{{ $t('feeAccount.reviewSeparationNotice') }}</span>
                </div>
                <div class="fee-review__version">v{{ target.versionNo }}</div>
            </div>

            <section class="fee-review__section">
                <div class="fee-review__section-title">{{ $t('feeAccount.reviewTargetInformation') }}</div>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="$t('feeAccount.planCode')">{{ target.planCode || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.planType')">{{ planTypeText }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.merchant')">{{ merchantText }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.version')">v{{ target.versionNo }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.submitter')">{{ target.submitByName || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="$t('feeAccount.submitTime')"><BaseDateTime :value="target.submitTime" /></el-descriptions-item>
                </el-descriptions>
            </section>

            <section class="fee-review__section">
                <div class="fee-review__section-title">{{ $t('feeAccount.changeReason') }}</div>
                <div class="fee-review__reason">{{ target.changeReason || '-' }}</div>
            </section>

            <section class="fee-review__section fee-review__decision">
                <div class="fee-review__section-title">{{ $t('feeAccount.reviewDecision') }}</div>
                <el-form label-position="top">
                    <el-form-item :label="commentLabel" :required="action === 'REJECT'">
                        <el-input
                            v-model="reviewComment"
                            type="textarea"
                            :rows="4"
                            maxlength="500"
                            show-word-limit
                            :placeholder="$t('feeAccount.reviewCommentPlaceholder')"
                        />
                    </el-form-item>
                </el-form>
            </section>
        </div>

        <template #footer>
            <div class="dialog-footer">
                <el-button
                    v-if="canApprove && action !== 'REJECT'"
                    :icon="CircleCheck"
                    type="success"
                    :loading="loading"
                    @click="submit('APPROVE')"
                >
                    {{ $t('feeAccount.approveAndActivate') }}
                </el-button>
                <el-button
                    v-if="canReject && action !== 'APPROVE'"
                    :icon="CircleClose"
                    type="danger"
                    :loading="loading"
                    @click="submit('REJECT')"
                >
                    {{ $t('feeAccount.reject') }}
                </el-button>
                <el-button @click="close">{{ $t('common.cancel') }}</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { CircleCheck, CircleClose } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { FeeReview } from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';

const props = withDefaults(defineProps<{
    visible: boolean;
    target?: FeeReview | null;
    action?: 'APPROVE' | 'REJECT' | null;
    loading?: boolean;
    canApprove?: boolean;
    canReject?: boolean;
}>(), {
    target: null,
    action: null,
    loading: false,
    canApprove: true,
    canReject: true,
});

const emit = defineEmits<{
    'update:visible': [value: boolean];
    submit: [action: 'APPROVE' | 'REJECT', comment: string];
}>();
const { t } = useI18n();
const reviewComment = ref('');

const dialogTitle = computed(() => {
    if (props.action === 'APPROVE') return t('feeAccount.approveVersionTitle');
    if (props.action === 'REJECT') return t('feeAccount.rejectVersionTitle');
    return t('feeAccount.reviewFeeVersionTitle');
});
const planTypeText = computed(() => props.target?.planType === 'TEMPLATE'
    ? t('feeAccount.template')
    : t('feeAccount.merchant'));
const merchantText = computed(() => props.target?.merchantName
    || props.target?.merchantId
    || '-');
const commentLabel = computed(() => props.action === 'REJECT'
    ? t('feeAccount.rejectionReason')
    : t('feeAccount.reviewComment'));

watch(() => [props.visible, props.target?.versionId, props.action], ([visible]) => {
    if (visible) reviewComment.value = '';
});

function close() {
    emit('update:visible', false);
}

function submit(action: 'APPROVE' | 'REJECT') {
    const comment = reviewComment.value.trim();
    if (action === 'REJECT' && !comment) {
        ElMessage.warning(t('feeAccount.rejectionReasonRequired'));
        return;
    }
    emit('submit', action, comment);
}
</script>

<style scoped>
.fee-review { display: grid; gap: 22px; }
.fee-review__overview { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 20px; padding: 16px 18px; border-left: 4px solid #e6a23c; background: #fff9ed; }
.fee-review__identity { display: grid; gap: 7px; min-width: 0; }
.fee-review__identity-line { display: flex; align-items: center; gap: 10px; min-width: 0; }
.fee-review__identity-line strong { overflow: hidden; color: #283548; font-size: 16px; text-overflow: ellipsis; white-space: nowrap; }
.fee-review__identity > span { color: #6b7280; font-size: 12px; line-height: 1.6; }
.fee-review__version { color: #b26a00; font-size: 22px; font-weight: 700; }
.fee-review__section { display: grid; gap: 11px; }
.fee-review__section-title { display: flex; align-items: center; gap: 8px; color: #344054; font-size: 13px; font-weight: 600; }
.fee-review__section-title::before { width: 3px; height: 14px; border-radius: 2px; background: #2f6fed; content: ''; }
.fee-review__reason { min-height: 44px; padding: 12px 14px; border: 1px solid #e4e9f1; background: #f8fafc; color: #475467; line-height: 1.7; white-space: pre-wrap; word-break: break-word; }
.fee-review__decision :deep(.el-form-item) { margin-bottom: 0; }
.fee-review__decision :deep(.el-textarea__inner) { min-height: 112px !important; }

@media (max-width: 640px) {
    .fee-review__overview { grid-template-columns: 1fr; }
    .fee-review__version { font-size: 18px; }
    .fee-review__identity-line { align-items: flex-start; flex-direction: column; }
}
</style>
