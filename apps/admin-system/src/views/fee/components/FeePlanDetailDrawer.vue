<template>
    <el-drawer :model-value="visible" :title="title" size="min(920px, 96vw)" @close="$emit('update:visible', false)">
        <div v-if="plan" class="fee-detail">
            <el-descriptions :column="3" border>
                <el-descriptions-item :label="$t('feeAccount.planCode')">{{ plan.planCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.planStatus')"><el-tag :type="planStatusType(plan.status)">{{ statusText(plan.status) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.currentVersion')">{{ plan.currentVersionNo ? `v${plan.currentVersionNo}` : '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.merchantId')">{{ plan.merchantId || '-' }}</el-descriptions-item>
                <el-descriptions-item v-if="showMerchant" :label="$t('feeAccount.merchantName')">{{ plan.merchantName || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('feeAccount.configurationOriginLabel')">{{ originText(plan.originType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')" :span="3">{{ plan.remark || '-' }}</el-descriptions-item>
            </el-descriptions>

            <el-empty v-if="!plan.versions?.length" :description="$t('feeAccount.noVersions')" />
            <el-collapse v-else v-model="expandedVersions" class="fee-version-history">
                <el-collapse-item v-for="version in plan.versions" :key="version.id" :name="version.id">
                    <template #title>
                        <div class="fee-version-title">
                            <strong>v{{ version.versionNo }}</strong>
                            <el-tag :type="versionStatusType(version.versionStatus)" size="small">{{ statusText(version.versionStatus) }}</el-tag>
                            <span>{{ version.changeReason }}</span>
                            <BaseDateTime :value="version.submitTime" />
                        </div>
                    </template>
                    <div class="fee-version-body">
                        <el-descriptions :column="3" size="small" border>
                            <el-descriptions-item :label="$t('feeAccount.submitter')">{{ version.submitByName }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.reviewerLabel')">{{ version.reviewByName || '-' }}</el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.effectiveTime')"><BaseDateTime :value="version.effectiveTime" /></el-descriptions-item>
                            <el-descriptions-item :label="$t('feeAccount.reviewCommentLabel')" :span="3">{{ version.reviewComment || '-' }}</el-descriptions-item>
                        </el-descriptions>
                        <el-tabs v-model="activeTabs[version.id]" class="fee-detail-tabs">
                            <el-tab-pane v-for="tab in feeTabs" :key="tab.name" :label="tab.label" :name="tab.name">
                                <el-table :data="rulesFor(version, tab.name)" border size="small" class="fee-rules-table">
                                    <el-table-column prop="ruleName" :label="$t('feeAccount.ruleName')" min-width="150" align="center" />
                                    <el-table-column prop="transactionType" :label="$t('feeAccount.transactionType')" min-width="130" align="center" />
                                    <el-table-column prop="paymentType" :label="$t('feeAccount.paymentType')" min-width="130" align="center" />
                                    <el-table-column prop="paymentMethod" :label="$t('feeAccount.paymentMethod')" min-width="120" align="center" />
                                    <el-table-column :label="$t('feeAccount.billingRule')" min-width="280" align="center"><template #default="scope">{{ feeFormula(scope.row) }}</template></el-table-column>
                                    <el-table-column :label="$t('feeAccount.tierCount')" width="72" align="center"><template #default="scope">{{ scope.row.tiers?.length || 0 }}</template></el-table-column>
                                </el-table>
                            </el-tab-pane>
                            <el-tab-pane :label="$t('feeAccount.reserveSettings')" name="RESERVE">
                                <el-descriptions :column="2" size="small" border>
                                    <el-descriptions-item :label="$t('feeAccount.reserveRate')">{{ version.reserveRate }}%</el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.reserveDelayDays')">D+{{ version.reserveDelayDays }}</el-descriptions-item>
                                </el-descriptions>
                            </el-tab-pane>
                            <el-tab-pane :label="$t('feeAccount.settlementSettings')" name="SETTLEMENT">
                                <el-descriptions :column="3" size="small" border>
                                    <el-descriptions-item :label="$t('feeAccount.initialPeriod')">{{ settlementCycle(version.initialDelayUnit, version.initialDelayDays) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.regularPeriod')">{{ settlementCycle(version.regularDelayUnit, version.regularDelayDays) }}</el-descriptions-item>
                                    <el-descriptions-item :label="$t('feeAccount.settlementFrequency')">{{ frequencyText(version.settlementFrequency, version.frequencyDay) }}</el-descriptions-item>
                                </el-descriptions>
                            </el-tab-pane>
                        </el-tabs>
                    </div>
                </el-collapse-item>
            </el-collapse>
        </div>
    </el-drawer>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FeePlanDetail, FeeRule, FeeVersion } from '@/api/fee';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { feeFormula, frequencyText, originText, planStatusType, settlementCycle, statusText, versionStatusType } from '@/views/fee/shared';

const props = withDefaults(defineProps<{
    visible: boolean;
    title: string;
    plan?: FeePlanDetail | null;
    showMerchant?: boolean;
}>(), { plan: null, showMerchant: false });

defineEmits<{ 'update:visible': [value: boolean] }>();
const { t } = useI18n();
const expandedVersions = ref<number[]>([]);
const activeTabs = reactive<Record<number, string>>({});
const feeTabs = computed(() => [
    { name: 'TRANSACTION_FEE' as const, label: t('feeAccount.category.transaction') },
    { name: 'REFUND_FEE' as const, label: t('feeAccount.category.refund') },
    { name: 'RISK_FEE' as const, label: t('feeAccount.category.risk') },
    { name: 'DISPUTE_FEE' as const, label: t('feeAccount.category.dispute') },
]);

watch(() => props.plan, (plan) => {
    expandedVersions.value = plan?.currentVersionId ? [plan.currentVersionId] : plan?.versions?.slice(0, 1).map((item) => item.id) || [];
    plan?.versions?.forEach((version) => { activeTabs[version.id] = 'TRANSACTION_FEE'; });
}, { immediate: true });

function rulesFor(version: FeeVersion, category: FeeRule['feeCategory']) {
    return version.rules.filter((rule) => rule.feeCategory === category);
}
</script>

<style scoped>
.fee-detail { display: grid; gap: 18px; }
.fee-version-history { border-top: 1px solid #e4e9f0; }
.fee-version-title { display: grid; grid-template-columns: 46px 78px minmax(160px, 1fr) 160px; align-items: center; gap: 10px; width: 100%; padding-right: 12px; }
.fee-version-title > span:not(.el-tag) { overflow: hidden; color: #606b7c; text-overflow: ellipsis; white-space: nowrap; }
.fee-version-body { display: grid; gap: 14px; padding: 4px 0 16px; }
.fee-detail-tabs :deep(.el-tabs__item) { min-width: 104px; padding: 0 14px; text-align: center; }
.fee-rules-table { width: 100%; }
@media (max-width: 720px) {
    .fee-version-title { grid-template-columns: 38px 72px minmax(0, 1fr); }
    .fee-version-title :deep(.base-date-time) { display: none; }
    :deep(.el-descriptions__body .el-descriptions__table) { min-width: 680px; }
    :deep(.el-descriptions) { overflow-x: auto; }
}
</style>
