<template>
  <div class="app-container risk-page">
    <el-table v-loading="loading" :data="rows" size="small">
      <el-table-column :label="$t('risk.record.moduleType')" width="150" align="center">
        <template #default="{ row }">
          <el-tooltip :content="String(row.module_type || '-')" placement="top">
            <el-tag size="small" :type="moduleTagType(row.module_type)">{{ moduleName(row.module_type) }}</el-tag>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column :label="$t('risk.record.functionName')" min-width="180" align="center" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tooltip :content="String(row.function_code || '-')" placement="top">
            <span>{{ functionName(row) }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column :label="$t('risk.dashboard.operationType')" width="120" align="center">
        <template #default="{ row }"><el-tag size="small" :type="operationTagType(row.operation_type)">{{ operationName(row.operation_type) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="businessLabel" :label="$t('risk.dashboard.businessObject')" min-width="150" align="center" show-overflow-tooltip />
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
import { riskFunctionName, riskFunctions } from '@/views/risk/shared';

const { t } = useI18n();
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

/**
 * 风控配置变更页展示名单和规则的审计日志，模块、功能和操作类型在页面层做国际化映射。
 */
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

function moduleTagType(value?: string) {
  if (value === 'AML') return 'danger';
  if (value === 'BLACK') return 'warning';
  if (value === 'WHITE') return 'success';
  if (value === 'RULE') return 'primary';
  return 'info';
}

function moduleName(value: unknown) {
  const code = String(value || '');
  return code ? t(`risk.module.${code}`) : '-';
}

function functionName(row: Record<string, unknown>) {
  const moduleType = String(row.module_type || '');
  const functionCode = String(row.function_code || '');
  const matched = riskFunctions.find((item) => item.moduleType === moduleType && item.functionCode === functionCode);
  return matched ? riskFunctionName(t, matched) : functionCode || '-';
}

function operationName(value: unknown) {
  const code = String(value || '');
  return code ? t(`risk.operation.${code}`) : '-';
}

function operationTagType(value?: string) {
  if (value === 'DELETE' || value === 'RELEASE') return 'danger';
  if (value === 'UPDATE' || value === 'STATUS') return 'warning';
  if (value === 'CREATE' || value === 'IMPORT') return 'success';
  return 'info';
}
</script>
