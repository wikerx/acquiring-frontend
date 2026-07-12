<template>
  <div class="app-container">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
      <el-form-item :label="$t('risk.common.merchantId')">
        <el-select
          v-model="query.merchantId"
          filterable
          remote
          clearable
          reserve-keyword
          remote-show-suffix
          :remote-method="searchMerchantOptions"
          :loading="merchantLoading"
          :placeholder="t('risk.common.placeholderMerchant')"
          :no-data-text="t('risk.common.noMerchantData')"
          :loading-text="t('risk.common.loadingMerchant')"
          class="query-merchant-select"
          @visible-change="handleMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('risk.trade.merchantOrderNo')"><el-input v-model.trim="query.merchantOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.trade.paymentOrderNo')"><el-input v-model.trim="query.paymentOrderNo" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.record.decisionResult')"><el-select v-model="query.decisionResult" clearable><el-option v-for="item in decisionActionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8"><el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col></el-row>
    <StandardTable table-key="risk-record" v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="risk_record_no" :label="$t('risk.record.riskRecordNo')" min-width="170" align="center" show-overflow-tooltip />
      <el-table-column prop="merchant_id" :label="$t('risk.common.merchantId')" width="130" align="center" />
      <el-table-column prop="merchant_order_no" :label="$t('risk.trade.merchantOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="payment_order_no" :label="$t('risk.trade.paymentOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="transaction_amount" :label="$t('risk.record.amount')" width="120" align="center" />
      <el-table-column prop="transaction_currency" :label="$t('risk.common.currency')" width="90" align="center" />
      <el-table-column prop="risk_level" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(String(row.risk_level || ''))">{{ riskLevelText(row.risk_level) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="hit_count" :label="$t('risk.record.hitCount')" width="90" align="center" />
      <el-table-column prop="decision_result" :label="$t('risk.record.decisionResult')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(String(row.decision_result || ''))">{{ decisionActionText(row.decision_result) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decision_reason" :label="$t('risk.record.decisionReason')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('risk.record.decisionTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.evaluation_time" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openHits(row)" v-hasPermi="'risk:record:evaluation:detail'">{{ $t('common.detail') }}</el-button></template></el-table-column>
    </StandardTable>
    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>
    <el-dialog :title="$t('risk.record.hitDetail')" v-model="hitOpen" width="920px" append-to-body>
      <el-table :data="hits" size="small">
        <el-table-column prop="module_type" :label="$t('risk.record.moduleType')" width="100" align="center" />
        <el-table-column prop="function_name" :label="$t('risk.record.functionName')" min-width="160" align="center" />
        <el-table-column prop="hit_element" :label="$t('risk.record.hitElement')" width="120" align="center" />
        <el-table-column prop="hit_value_masked" :label="$t('risk.record.hitValue')" min-width="160" align="center" show-overflow-tooltip />
        <el-table-column prop="decision_result" :label="$t('risk.record.decisionResult')" width="110" align="center">
          <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(String(row.decision_result || ''))">{{ decisionActionText(row.decision_result) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="decision_reason" :label="$t('risk.record.decisionReason')" min-width="180" align="center" show-overflow-tooltip />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { getEvaluationHits, pageEvaluations, type EvaluationQuery } from '@/api/risk';
import { riskOptionLabel } from '@/views/risk/shared';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const hits = ref<Record<string, unknown>[]>([]);
const hitOpen = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const query = reactive<EvaluationQuery>({});
const decisionActionOptions = computed(() => ['PASS', 'REJECT', 'REVIEW'].map((value) => ({ value, label: decisionActionText(value) })));

/**
 * 风控记录页用于查询交易风控评估和命中明细，页面不修改任何风控配置。
 */
onMounted(loadData);
async function loadData() { loading.value = true; try { const r = await pageEvaluations({ ...query, pageNo: page.value, pageSize: pageSize.value }); rows.value = r.records; total.value = r.total; } catch (e: any) { ElMessage.error(e?.message || t('common.loadFailed')); } finally { loading.value = false; } }
function handleSearch() { page.value = 1; loadData(); }
function handleReset() { Object.assign(query, { merchantId: undefined, merchantOrderNo: undefined, paymentOrderNo: undefined, decisionResult: undefined }); handleSearch(); }
async function openHits(row: Record<string, unknown>) { const recordNo = String(row.risk_record_no || ''); hits.value = await getEvaluationHits(recordNo); hitOpen.value = true; }
async function searchMerchantOptions(keyword: string) {
  const text = keyword.trim();
  await loadMerchantOptions(text);
}
async function loadMerchantOptions(keyword = '') {
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: keyword || undefined });
    merchantOptions.value = result.records || [];
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    merchantLoading.value = false;
  }
}
function handleMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}
function merchantOptionLabel(item: MerchantInfo) {
  return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId;
}
function riskLevelText(value: unknown) { return riskOptionLabel(t, 'riskLevel', String(value || '')); }
function decisionActionText(value: unknown) { return riskOptionLabel(t, 'decisionAction', String(value || '')); }
function riskLevelTagType(value?: string) { if (value === 'CRITICAL') return 'danger'; if (value === 'HIGH') return 'warning'; if (value === 'MEDIUM') return 'primary'; return 'success'; }
function decisionActionTagType(value?: string) { if (value === 'REJECT') return 'danger'; if (value === 'REVIEW') return 'warning'; return 'success'; }
</script>
