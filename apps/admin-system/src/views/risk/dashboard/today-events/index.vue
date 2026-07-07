<template>
  <div class="app-container risk-page">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="risk_record_no" :label="$t('risk.record.riskRecordNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="merchant_id" :label="$t('risk.common.merchantId')" width="120" align="center" />
      <el-table-column prop="merchant_order_no" :label="$t('risk.trade.merchantOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="payment_order_no" :label="$t('risk.trade.paymentOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="risk_level" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(String(row.risk_level || ''))">{{ riskLevelText(row.risk_level) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decision_result" :label="$t('risk.record.decisionResult')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(String(row.decision_result || ''))">{{ decisionActionText(row.decision_result) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="hit_count" :label="$t('risk.record.hitCount')" width="90" align="center" />
      <el-table-column :label="$t('risk.record.decisionTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.evaluation_time" /></template></el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { getRiskTodayEvents } from '@/api/risk';
import { riskOptionLabel } from '@/views/risk/shared';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    rows.value = await getRiskTodayEvents();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function riskLevelText(value: unknown) {
  return riskOptionLabel(t, 'riskLevel', String(value || ''));
}

function decisionActionText(value: unknown) {
  return riskOptionLabel(t, 'decisionAction', String(value || ''));
}

function riskLevelTagType(value?: string) {
  if (value === 'CRITICAL') return 'danger';
  if (value === 'HIGH') return 'warning';
  if (value === 'MEDIUM') return 'primary';
  return 'success';
}

function decisionActionTagType(value?: string) {
  if (value === 'REJECT') return 'danger';
  if (value === 'REVIEW') return 'warning';
  return 'success';
}
</script>
