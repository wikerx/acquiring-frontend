<!-- 保证金结算工作台：候选明细保留调整单独审核，全量手动结算仅处理到期 RELEASE。 -->
<template>
    <div class="app-container reserve-settlement-workspace">
        <el-tabs v-model="activeView" class="settlement-view-tabs" @tab-change="handleTabChange">
            <el-tab-pane name="pending" lazy>
                <template #label>
                    <span class="settlement-tab-label">
                        <el-icon><Lock /></el-icon>
                        {{ t('transaction.settlement.pendingReservesTab') }}
                    </span>
                </template>
                <SettlementCandidatePage kind="reserve" pending-only embedded />
            </el-tab-pane>
            <el-tab-pane name="manual" lazy>
                <template #label>
                    <span class="settlement-tab-label">
                        <el-icon><DataAnalysis /></el-icon>
                        {{ t('transaction.settlement.manualSettlementTab') }}
                    </span>
                </template>
                <ManualTransactionSettlementPage kind="reserve" embedded />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DataAnalysis, Lock } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import ManualTransactionSettlementPage from '@/views/settlement/components/ManualTransactionSettlementPage.vue';
import SettlementCandidatePage from '@/views/settlement/components/SettlementCandidatePage.vue';

type SettlementView = 'pending' | 'manual';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const activeView = ref<SettlementView>(initialView());

function initialView(): SettlementView {
    if (route.query.view === 'pending' || route.query.view === 'manual') return route.query.view;
    return typeof route.query.taskNo === 'string' && route.query.taskNo.trim() ? 'manual' : 'pending';
}

async function handleTabChange(value: string | number) {
    const view: SettlementView = value === 'manual' ? 'manual' : 'pending';
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

.settlement-tab-label {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    white-space: nowrap;
}

.settlement-tab-label .el-icon {
    font-size: 15px;
}
</style>
