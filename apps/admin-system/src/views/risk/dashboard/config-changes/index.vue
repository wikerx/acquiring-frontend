<template>
  <div class="app-container risk-page">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column prop="module_type" :label="$t('risk.record.moduleType')" width="120" align="center" />
      <el-table-column prop="function_code" :label="$t('risk.common.functionCode')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="operation_type" :label="$t('risk.dashboard.operationType')" width="120" align="center" />
      <el-table-column prop="business_id" label="业务ID" width="110" align="center" />
      <el-table-column prop="operator" :label="$t('risk.common.operator')" width="120" align="center" />
      <el-table-column prop="remark" :label="$t('common.remark')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('common.createTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.operation_time" /></template></el-table-column>
    </el-table>
    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import { pageRiskChanges } from '@/api/risk';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const result = await pageRiskChanges({ pageNo: page.value, pageSize: pageSize.value });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}
</script>
