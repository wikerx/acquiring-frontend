<template>
  <div class="app-container risk-page">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column type="index" label="#" width="64" align="center" />
      <el-table-column prop="merchant_id" :label="$t('risk.common.merchantId')" width="140" align="center" />
      <el-table-column prop="merchant_name" :label="$t('risk.common.merchantName')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="risk_count" :label="$t('risk.ranking.riskEventCount')" width="120" align="center" />
      <el-table-column prop="high_risk_count" :label="$t('risk.ranking.highRiskCount')" width="120" align="center" />
      <el-table-column prop="reject_count" :label="$t('risk.ranking.rejectCount')" width="110" align="center" />
      <el-table-column :label="$t('risk.ranking.latestHitTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.latest_evaluation_time" /></template></el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { getRiskMerchantRanking } from '@/api/risk';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);

/**
 * 高风险商户排行页按后端聚合结果展示商户风险热度，不在前端重新计算风险指标。
 */
onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    rows.value = await getRiskMerchantRanking();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}
</script>
