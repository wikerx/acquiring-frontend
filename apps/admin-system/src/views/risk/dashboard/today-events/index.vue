<template>
  <div class="app-container risk-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
      <el-form-item :label="$t('risk.common.merchantId')"><el-input v-model.trim="query.merchantId" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.trade.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.trade.paymentOrderNo')"><el-input v-model.trim="query.paymentOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.common.riskLevel')">
        <el-select v-model="query.riskLevel" clearable>
          <el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('risk.record.decisionResult')">
        <el-select v-model="query.decisionResult" clearable>
          <el-option v-for="item in decisionActionOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('risk.record.decisionTime')">
        <el-date-picker
          v-model="evaluationDateRange"
          type="daterange"
          value-format="YYYY-MM-DD"
          :start-placeholder="$t('common.startTime')"
          :end-placeholder="$t('common.endTime')"
          :range-separator="$t('common.to')"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" @click="handleReset">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8"><el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col></el-row>
    <StandardTable table-key="risk-today-events" v-loading="loading" :data="rows" row-key="id" size="small">
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
    </StandardTable>
    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { pageRiskTodayEvents, type EvaluationQuery } from '@/api/risk';
import { riskOptionLabel } from '@/views/risk/shared';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const query = reactive<EvaluationQuery>({});
const evaluationDateRange = ref<[string, string]>(todayDateRange());
const riskLevelOptions = computed(() => ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((value) => ({ value, label: riskLevelText(value) })));
const decisionActionOptions = computed(() => ['PASS', 'REJECT', 'REVIEW'].map((value) => ({ value, label: decisionActionText(value) })));

/**
 * 今日风险事件页展示当天风控评估结果，页面只做只读查询和状态文案映射。
 */
onMounted(loadData);

async function loadData() {
  loading.value = true;
  try {
    const [evaluationStartTime, evaluationEndTimeExclusive] = evaluationTimeRange();
    const result = await pageRiskTodayEvents({
      ...query,
      evaluationStartTime,
      evaluationEndTimeExclusive,
      pageNo: page.value,
      pageSize: pageSize.value,
    });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadData();
}

function handleReset() {
  Object.assign(query, { merchantId: undefined, merchantOrderNo: undefined, paymentOrderNo: undefined, riskLevel: undefined, decisionResult: undefined });
  evaluationDateRange.value = todayDateRange();
  handleSearch();
}

function evaluationTimeRange(): [string | undefined, string | undefined] {
  const [startDate, endDate] = evaluationDateRange.value || [];
  if (!startDate || !endDate) return [undefined, undefined];
  return [`${startDate}T00:00:00`, `${nextDate(endDate)}T00:00:00`];
}

function todayDateRange(): [string, string] {
  const today = localDate(new Date());
  return [today, today];
}

function nextDate(dateText: string) {
  const [year, month, day] = dateText.split('-').map(Number);
  return localDate(new Date(year, month - 1, day + 1));
}

function localDate(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
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
