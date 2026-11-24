<template>
    <el-tabs v-if="canViewBatches || canViewItems" v-model="activeTab" class="transaction-settlement-workspace">
        <el-tab-pane v-if="canViewBatches" :label="t('settlement.transactionBatches')" name="batches" lazy>
            <SettlementBatchList :key="linkedBatchNo" />
        </el-tab-pane>
        <el-tab-pane v-if="canViewItems" :label="t('settlement.transactionItems')" name="details" lazy>
            <TransactionSettlementList :key="detailLinkKey" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { hasPermission } from '@/utils/permission';
import SettlementBatchList from './SettlementBatchList.vue';
import TransactionSettlementList from './TransactionSettlementList.vue';

const { t } = useI18n();
const route = useRoute();
const canViewBatches = hasPermission('merchant:settlement:batch:list')
    || hasPermission('merchant:settlement:batch:export');
const canViewItems = hasPermission('merchant:settlement:transaction-item:list')
    || hasPermission('merchant:settlement:transaction-item:export');
const linkedDetail = computed(() => route.query.view === 'details' || Boolean(route.query.sourceTransactionId));
const linkedBatchNo = computed(() => !linkedDetail.value && typeof route.query.settlementBatchNo === 'string'
    ? route.query.settlementBatchNo : undefined);
const detailLinkKey = computed(() => linkedDetail.value ? route.fullPath : undefined);
const activeTab = ref<'batches' | 'details'>('batches');

watch(() => route.fullPath, () => {
    if (route.path !== '/finance/settlements') return;
    activeTab.value = canViewItems && (linkedDetail.value || !canViewBatches) ? 'details' : 'batches';
}, { immediate: true });
</script>

<style scoped>
.transaction-settlement-workspace > :deep(.el-tabs__content) { overflow: visible; }
</style>
