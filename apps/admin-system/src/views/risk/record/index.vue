<template>
  <div class="app-container">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="86px">
      <el-form-item :label="$t('risk.record.riskRecordNo')"><el-input v-model.trim="query.riskRecordNo" clearable @keyup.enter="handleSearch" /></el-form-item>
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
      <el-form-item :label="$t('risk.record.decisionTime')" class="risk-record-time-filter">
        <el-date-picker
          v-model="evaluationTimeRange"
          type="datetimerange"
          value-format="YYYY-MM-DDTHH:mm:ss"
          format="YYYY-MM-DD HH:mm:ss"
          unlink-panels
          :range-separator="$t('common.to')"
          :start-placeholder="$t('common.startTime')"
          :end-placeholder="$t('common.endTime')"
        />
      </el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>
    <el-row :gutter="10" class="mb8"><el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col></el-row>
    <StandardTable table-key="risk-record" v-loading="loading" :data="rows" row-key="id" size="small">
      <el-table-column prop="risk_record_no" :label="$t('risk.record.riskRecordNo')" min-width="170" align="center" show-overflow-tooltip />
      <el-table-column prop="merchant_id" :label="$t('risk.common.merchantId')" width="130" align="center" />
      <el-table-column prop="merchant_order_no" :label="$t('risk.trade.merchantOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column prop="payment_order_no" :label="$t('risk.trade.paymentOrderNo')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('risk.record.amount')" min-width="170" align="center">
        <template #default="{ row }">
          <CurrencyAmountDisplay
            :amount="row.transaction_amount"
            :currency="row.transaction_currency"
            :locale="String(locale)"
            align="center"
            emphasized
          />
        </template>
      </el-table-column>
      <el-table-column prop="risk_level" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(String(row.risk_level || ''))">{{ riskLevelText(row.risk_level) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="hit_count" :label="$t('risk.record.hitCount')" width="90" align="center" />
      <el-table-column prop="decision_result" :label="$t('risk.record.decisionResult')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(String(row.decision_result || ''))">{{ decisionActionText(row.decision_result) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decision_reason" :label="$t('risk.record.decisionReason')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('risk.record.decisionTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.evaluation_time" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" width="100" align="center" fixed="right"><template #default="{ row }"><el-button size="small" type="primary" link :icon="View" @click="openDetails(row)" v-hasPermi="'risk:record:evaluation:detail'">{{ $t('common.detail') }}</el-button></template></el-table-column>
    </StandardTable>
    <div class="pagination-container" v-show="total > 0"><el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" /></div>
    <CommonDetailDrawer v-model:visible="detailOpen" :title="$t('risk.record.executionDetail')" size="full" :loading="detailLoading">
      <div v-if="selectedEvaluation" class="risk-record-summary">
        <div class="risk-record-summary__grid">
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.record.riskRecordNo') }}</span>
            <span class="risk-summary-field__value risk-summary-field__value--mono">{{ selectedEvaluation.risk_record_no || '-' }}</span>
          </div>
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.trade.paymentOrderNo') }}</span>
            <span class="risk-summary-field__value risk-summary-field__value--mono">{{ selectedEvaluation.payment_order_no || '-' }}</span>
          </div>
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.record.amount') }}</span>
            <CurrencyAmountDisplay
              :amount="String(selectedEvaluation.transaction_amount ?? '')"
              :currency="String(selectedEvaluation.transaction_currency ?? '')"
              :locale="String(locale)"
              align="start"
              emphasized
            />
          </div>
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.record.hitCount') }}</span>
            <span class="risk-summary-field__value">{{ selectedEvaluation.hit_count ?? 0 }}</span>
          </div>
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.record.finalDecision') }}</span>
            <el-tag size="small" :type="decisionActionTagType(String(selectedEvaluation.decision_result || ''))">
              {{ decisionActionText(selectedEvaluation.decision_result) }}
            </el-tag>
          </div>
          <div class="risk-summary-field">
            <span class="risk-summary-field__label">{{ $t('risk.record.decisionTime') }}</span>
            <span class="risk-summary-field__value"><BaseDateTime :value="String(selectedEvaluation.evaluation_time || '')" /></span>
          </div>
          <div class="risk-summary-field risk-summary-field--wide">
            <span class="risk-summary-field__label">{{ $t('risk.record.finalReason') }}</span>
            <span class="risk-summary-field__value risk-summary-field__value--wrap">{{ selectedEvaluation.decision_reason || '-' }}</span>
          </div>
        </div>
      </div>
      <el-table :data="details" row-key="id" size="small" class="risk-detail-table">
        <el-table-column type="expand" width="48">
          <template #default="{ row }">
            <div class="risk-detail-expand">
              <div class="risk-detail-expand__grid">
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.detailId') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.id) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.riskRecordNo') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.risk_record_no) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.moduleType') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.module_type) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.stageCode') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.stage_code) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.functionCode') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.function_code) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.ruleId') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.rule_id) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.common.riskLevel') }}</span>
                  <span class="risk-detail-field__value">
                    <el-tag v-if="row.risk_level" size="small" :type="riskLevelTagType(row.risk_level)">{{ riskLevelText(row.risk_level) }}</el-tag>
                    <span v-else>-</span>
                  </span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.decisionEffect') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.decision_effect) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.reasonCode') }}</span>
                  <span class="risk-detail-field__value risk-detail-field__value--mono">{{ displayValue(row.reason_code) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.hitElement') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.hit_element) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.hitValue') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.hit_value_masked) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.timeWindowSeconds') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.time_window_seconds) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.thresholdCount') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.threshold_count) }}</span>
                </div>
                <div class="risk-detail-field">
                  <span class="risk-detail-field__label">{{ $t('risk.record.currentCount') }}</span>
                  <span class="risk-detail-field__value">{{ displayValue(row.current_count) }}</span>
                </div>
                <div class="risk-detail-field risk-detail-field--wide">
                  <span class="risk-detail-field__label">{{ $t('risk.record.elementsSnapshot') }}</span>
                  <pre class="risk-detail-json">{{ formatElementsJson(row.elements_json) }}</pre>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stage_order" :label="$t('risk.record.stageOrder')" width="72" align="center" class-name="risk-detail-order-column" label-class-name="risk-detail-order-column" />
        <el-table-column :label="$t('risk.record.executionNode')" min-width="300" align="left">
          <template #default="{ row }">
            <div class="risk-execution-node">
              <span class="risk-execution-node__stage">{{ row.stage_name || row.stage_code || '-' }}</span>
              <span class="risk-execution-node__function">{{ row.function_name || row.function_code || '-' }}</span>
              <span v-if="row.module_type || row.function_code" class="risk-execution-node__meta">
                {{ [row.module_type, row.function_code].filter(Boolean).join(' · ') }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="match_result" :label="$t('risk.record.matchResult')" width="104" align="center">
          <template #default="{ row }"><el-tag size="small" :type="matchResultTagType(String(row.match_result || ''), String(row.decision_result || ''))">{{ matchResultText(row.match_result) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="decision_result" :label="$t('risk.record.currentDecision')" width="110" align="center">
          <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(String(row.decision_result || ''))">{{ decisionActionText(row.decision_result) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="decision_reason" :label="$t('risk.record.decisionReason')" min-width="280" align="left" class-name="risk-detail-reason-column" label-class-name="risk-detail-reason-column">
          <template #default="{ row }"><span class="risk-detail-reason">{{ row.decision_reason || '-' }}</span></template>
        </el-table-column>
        <el-table-column :label="$t('risk.record.triggerTime')" width="170" align="center" class-name="risk-detail-time-column" label-class-name="risk-detail-time-column"><template #default="{ row }"><BaseDateTime :value="row.decision_time" /></template></el-table-column>
      </el-table>
      <div v-show="detailTotal > 0" class="pagination-container risk-detail-pagination">
        <el-pagination
          v-model:current-page="detailPage"
          v-model:page-size="detailPageSize"
          :total="detailTotal"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleDetailSizeChange"
          @current-change="loadDetails"
        />
      </div>
    </CommonDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Refresh, Search, View } from '@element-plus/icons-vue';
import { CurrencyAmountDisplay } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { pageEvaluationDetails, pageEvaluations, type EvaluationDetail, type EvaluationQuery } from '@/api/risk';
import { riskOptionLabel } from '@/views/risk/shared';

const { locale, t } = useI18n();
const route = useRoute();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<Record<string, unknown>[]>([]);
const details = ref<EvaluationDetail[]>([]);
const detailOpen = ref(false);
const detailLoading = ref(false);
const selectedEvaluation = ref<Record<string, unknown> | null>(null);
const detailTotal = ref(0);
const detailPage = ref(1);
const detailPageSize = ref(20);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const query = reactive<EvaluationQuery>({});
const evaluationTimeRange = ref<string[]>(defaultEvaluationTimeRange());
const decisionActionOptions = computed(() => ['PASS', 'REJECT', 'REVIEW'].map((value) => ({ value, label: decisionActionText(value) })));
let detailRequestSequence = 0;

/**
 * 风控记录页用于查询交易风控评估和命中明细，页面不修改任何风控配置。
 */
onMounted(() => {
  const riskRecordNo = Array.isArray(route.query.riskRecordNo)
    ? route.query.riskRecordNo[0]
    : route.query.riskRecordNo;
  query.riskRecordNo = typeof riskRecordNo === 'string' ? riskRecordNo : undefined;
  loadData();
});
async function loadData() {
  loading.value = true;
  try {
    const result = await pageEvaluations({
      ...query,
      evaluationStartTime: evaluationTimeRange.value[0],
      evaluationEndTimeExclusive: evaluationTimeRange.value[1],
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
function handleSearch() { page.value = 1; loadData(); }
function handleReset() {
  Object.assign(query, { riskRecordNo: undefined, merchantId: undefined, merchantOrderNo: undefined, paymentOrderNo: undefined, decisionResult: undefined });
  evaluationTimeRange.value = defaultEvaluationTimeRange();
  handleSearch();
}

/**
 * 返回平台开发环境当天的完整左闭右开时间范围，页面展示到秒，后端按结束时间排除边界。
 */
function defaultEvaluationTimeRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return [formatLocalDateTime(start), formatLocalDateTime(end)];
}

/**
 * 将本地时间格式化为 Spring MVC LocalDateTime 接受的 ISO 秒级文本。
 */
function formatLocalDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    + `T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
}
async function openDetails(row: Record<string, unknown>) {
  selectedEvaluation.value = row;
  details.value = [];
  detailTotal.value = 0;
  detailPage.value = 1;
  detailOpen.value = true;
  await loadDetails();
}
async function loadDetails() {
  const recordNo = String(selectedEvaluation.value?.risk_record_no || '');
  if (!recordNo) {
    details.value = [];
    detailTotal.value = 0;
    return;
  }
  const requestSequence = ++detailRequestSequence;
  detailLoading.value = true;
  try {
    const result = await pageEvaluationDetails(recordNo, {
      pageNo: detailPage.value,
      pageSize: detailPageSize.value,
    });
    if (requestSequence !== detailRequestSequence) return;
    details.value = result.records || [];
    detailTotal.value = result.total || 0;
  } catch (error: any) {
    if (requestSequence !== detailRequestSequence) return;
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    if (requestSequence === detailRequestSequence) detailLoading.value = false;
  }
}
function handleDetailSizeChange() { detailPage.value = 1; loadDetails(); }
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
function matchResultText(value: unknown) {
  const code = String(value || '');
  return code ? t(`risk.record.matchResultOption.${code}`, code) : '-';
}
function riskLevelTagType(value?: string) { if (value === 'CRITICAL') return 'danger'; if (value === 'HIGH') return 'warning'; if (value === 'MEDIUM') return 'primary'; return 'success'; }
function decisionActionTagType(value?: string) { if (value === 'REJECT') return 'danger'; if (value === 'REVIEW') return 'warning'; return 'success'; }
function matchResultTagType(matchResult?: string, decisionResult?: string) {
  if (matchResult === 'HIT' && decisionResult === 'REJECT') return 'danger';
  if (matchResult === 'HIT' && decisionResult === 'REVIEW') return 'warning';
  if (matchResult === 'PASS') return 'success';
  if (matchResult === 'SKIPPED') return 'warning';
  return 'info';
}
function displayValue(value: unknown) {
  return value === null || value === undefined || value === '' ? '-' : String(value);
}
function formatElementsJson(value?: string) {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
</script>

<style scoped>
.risk-record-summary {
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  background: var(--el-fill-color-extra-light);
}

.risk-record-summary__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px 24px;
}

.risk-summary-field,
.risk-detail-field {
  min-width: 0;
}

.risk-summary-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-summary-field :deep(.el-tag) {
  align-self: flex-start;
}

.risk-summary-field--wide,
.risk-detail-field--wide {
  grid-column: 1 / -1;
}

.risk-summary-field__label,
.risk-detail-field__label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.risk-summary-field__value,
.risk-detail-field__value {
  color: var(--el-text-color-primary);
  font-size: 14px;
  line-height: 22px;
}

.risk-summary-field__value--mono,
.risk-detail-field__value--mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  overflow-wrap: anywhere;
}

.risk-summary-field__value--wrap {
  white-space: normal;
  overflow-wrap: anywhere;
}

.risk-detail-table {
  width: 100%;
}

.risk-execution-node {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.risk-execution-node__stage {
  color: var(--el-text-color-primary);
  font-weight: 600;
  line-height: 20px;
}

.risk-execution-node__function {
  color: var(--el-text-color-regular);
  line-height: 20px;
}

.risk-execution-node__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  overflow-wrap: anywhere;
}

.risk-detail-reason {
  display: block;
  padding: 4px 0;
  line-height: 20px;
  white-space: normal;
  overflow-wrap: anywhere;
}

.risk-detail-expand {
  padding: 4px 24px 18px 72px;
}

.risk-detail-expand__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-top: 1px solid var(--el-border-color-lighter);
  border-left: 1px solid var(--el-border-color-lighter);
}

.risk-detail-field {
  display: grid;
  grid-template-columns: minmax(112px, 0.42fr) minmax(0, 1fr);
  align-items: start;
  min-height: 46px;
  border-right: 1px solid var(--el-border-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.risk-detail-field__label,
.risk-detail-field__value {
  min-height: 45px;
  padding: 11px 12px;
}

.risk-detail-field__label {
  background: var(--el-fill-color-light);
}

.risk-detail-json {
  min-height: 45px;
  margin: 0;
  padding: 11px 12px;
  color: var(--el-text-color-primary);
  font: 12px/20px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.risk-detail-pagination {
  margin-top: 16px;
}

@media (max-width: 1100px) {
  .risk-record-summary__grid,
  .risk-detail-expand__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :deep(.risk-detail-time-column) {
    display: none;
  }
}

@media (max-width: 900px) {
  :deep(.risk-detail-reason-column),
  :deep(.risk-detail-order-column) {
    display: none;
  }

  .risk-detail-expand {
    padding-left: 48px;
  }
}

@media (max-width: 768px) {
  .risk-record-summary__grid,
  .risk-detail-expand__grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .risk-detail-expand {
    padding: 4px 8px 16px;
  }

  .risk-detail-field {
    grid-template-columns: minmax(104px, 0.42fr) minmax(0, 1fr);
  }

  .risk-detail-pagination :deep(.el-pagination__sizes),
  .risk-detail-pagination :deep(.el-pagination__jump) {
    display: none;
  }
}
</style>
