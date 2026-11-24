<template>
    <el-tabs v-model="activeTab" class="reserve-workspace">
        <el-tab-pane v-if="canViewBatches" :label="t('settlement.reserveBatches')" name="batches" lazy>
            <SettlementBatchList :key="linkedBatchNo" reserve-only />
        </el-tab-pane>
        <el-tab-pane v-if="canViewItems" :label="t('settlement.reserveItems')" name="details" lazy>
            <ReserveActionList :key="detailLinkKey" />
        </el-tab-pane>
    </el-tabs>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { hasPermission } from '@/utils/permission';
import SettlementBatchList from '../settlement/SettlementBatchList.vue';
import ReserveActionList from './ReserveActionList.vue';

const { t } = useI18n();
const route = useRoute();
const canViewBatches = hasPermission('merchant:settlement:reserve-batch:list')
    || hasPermission('merchant:settlement:reserve-batch:export');
const canListItems = hasPermission('merchant:settlement:reserve-item:list')
    || hasPermission('merchant:settlement:reserve-item:export');
const canReadItem = hasPermission('merchant:settlement:reserve-item:detail');
const canViewItems = computed(() => canListItems || (canReadItem && Boolean(route.query.reserveActionNo)));
const linkedDetail = computed(() => Boolean(route.query.reserveActionNo || route.query.reserveNo
    || route.query.sourceTransactionId || route.query.view === 'details'));
const linkedBatchNo = computed(() => !linkedDetail.value && typeof route.query.settlementBatchNo === 'string'
    ? route.query.settlementBatchNo : undefined);
const detailLinkKey = computed(() => linkedDetail.value ? route.fullPath : undefined);
const activeTab = ref<'batches' | 'details'>('batches');

watch(() => route.fullPath, () => {
    if (route.path !== '/finance/reserves') return;
    activeTab.value = canViewItems.value && (linkedDetail.value || !canViewBatches) ? 'details' : 'batches';
}, { immediate: true });
</script>

<style scoped>
.reserve-workspace > :deep(.el-tabs__content) { overflow: visible; }
</style>
