<!-- 保证金结算工作台：候选明细保留调整单独审核，全量手动结算仅处理到期 RELEASE。 -->
<template>
    <div class="app-container reserve-settlement-workspace">
        <el-tabs v-if="availableViews.length" v-model="activeView" class="settlement-view-tabs" @tab-change="handleTabChange">
            <el-tab-pane v-if="canViewBatches" name="batches" lazy>
                <template #label>
                    <span class="settlement-tab-label">
                        <el-icon><Document /></el-icon>
                        {{ t('transaction.settlement.reserveSettlementTab') }}
                    </span>
                </template>
                <SettlementBatchPage domain="reserve" embedded />
            </el-tab-pane>
            <el-tab-pane v-if="canViewPending" name="pending" lazy>
                <template #label>
                    <span class="settlement-tab-label">
                        <el-icon><Lock /></el-icon>
                        {{ t('transaction.settlement.pendingReservesTab') }}
                    </span>
                </template>
                <SettlementCandidatePage kind="reserve" pending-only embedded />
            </el-tab-pane>
            <el-tab-pane v-if="canViewManual" name="manual" lazy>
                <template #label>
                    <span class="settlement-tab-label">
                        <el-icon><DataAnalysis /></el-icon>
                        {{ t('transaction.settlement.manualSettlementTab') }}
                    </span>
                </template>
                <ManualTransactionSettlementPage kind="reserve" embedded />
            </el-tab-pane>
        </el-tabs>
        <el-empty
            v-else
            class="settlement-workspace__empty"
            :description="t('transaction.settlement.noWorkspacePermission')"
        />
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DataAnalysis, Document, Lock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from '@/store/modules/user';
import ManualTransactionSettlementPage from '@/views/settlement/components/ManualTransactionSettlementPage.vue';
import SettlementCandidatePage from '@/views/settlement/components/SettlementCandidatePage.vue';
import SettlementBatchPage from '@/views/transaction/settlement/index.vue';

type SettlementView = 'batches' | 'pending' | 'manual';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const canViewBatches = userStore.hasPermission('settlement:reserve-batch:list');
const canViewPending = userStore.hasPermission('settlement:reserve-candidate:list');
const canViewManual = userStore.hasPermission('settlement:reserve-review:create');
const availableViews = computed<SettlementView[]>(() => [
    canViewBatches ? 'batches' : undefined,
    canViewPending ? 'pending' : undefined,
    canViewManual ? 'manual' : undefined,
].filter((view): view is SettlementView => Boolean(view)));
const activeView = ref<SettlementView>(initialView());

function initialView(): SettlementView {
    if (typeof route.query.settlementBatchNo === 'string' && route.query.settlementBatchNo.trim() && canViewBatches) {
        return 'batches';
    }
    if (typeof route.query.taskNo === 'string' && route.query.taskNo.trim() && canViewManual) {
        return 'manual';
    }
    const requested = route.query.view;
    if ((requested === 'batches' || requested === 'pending' || requested === 'manual')
        && availableViews.value.includes(requested)) {
        return requested;
    }
    return availableViews.value[0] || 'batches';
}

async function handleTabChange(value: string | number) {
    const view = String(value) as SettlementView;
    if (!availableViews.value.includes(view)) return;
    if (route.query.view === view) return;
    await router.replace({ path: route.path, query: { ...route.query, view } });
}
</script>

<style scoped>
.reserve-settlement-workspace {
    width: 100%;
    min-width: 0;
}

.settlement-view-tabs :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 4px;
    border-bottom: 1px solid #dfe5ec;
    background: #fff;
}

.settlement-view-tabs :deep(.el-tabs__nav-wrap::after) {
    display: none;
}

.settlement-view-tabs :deep(.el-tabs__item) {
    height: 42px;
    padding: 0 20px;
    color: #667085;
    font-size: 13px;
    font-weight: 600;
}

.settlement-view-tabs :deep(.el-tabs__item:hover),
.settlement-view-tabs :deep(.el-tabs__item.is-active) {
    color: #2563eb;
}

.settlement-view-tabs :deep(.el-tabs__active-bar) {
    height: 2px;
    background: #2563eb;
}

.settlement-view-tabs :deep(.el-tabs__content) {
    overflow: visible;
}

.settlement-workspace__empty {
    min-height: 360px;
    border: 1px solid var(--el-border-color-lighter);
    background: #fff;
}

.settlement-tab-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
}

.settlement-tab-label .el-icon {
    font-size: 15px;
}

@media (max-width: 640px) {
    .settlement-view-tabs :deep(.el-tabs__nav) {
        width: 100%;
    }

    .settlement-view-tabs :deep(.el-tabs__item) {
        flex: 1 1 33.333%;
        justify-content: center;
        padding: 0 10px;
    }
}
</style>
