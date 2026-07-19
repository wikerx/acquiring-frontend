<template>
  <div class="app-container security-intercept-page">
    <TransactionSearchPanel
      :visible="showSearch"
      :model="query"
      :title="$t('security.intercept.title')"
      :description="$t('security.intercept.description')"
      :expand-text="$t('transaction.search.expand')"
      :collapse-text="$t('transaction.search.collapse')"
      :search-text="$t('common.search')"
      :reset-text="$t('common.reset')"
      label-width="96px"
      @search="handleSearch"
      @reset="resetQuery"
    >
      <el-form-item :label="$t('security.intercept.merchantId')" prop="merchantId">
        <MerchantRemoteSelect v-model="query.merchantId" class="security-intercept-page__merchant-select" @change="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('security.intercept.eventType')" prop="eventType">
        <el-input v-model.trim="query.eventType" :placeholder="$t('security.intercept.eventTypePlaceholder')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('security.intercept.riskLevel')" prop="riskLevel">
        <el-select v-model="query.riskLevel" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('security.intercept.sourceLayer')" prop="sourceLayer">
        <el-select v-model="query.sourceLayer" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option label="OPENAPI" value="OPENAPI" />
          <el-option label="CHANNEL" value="CHANNEL" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('security.intercept.processStatus')" prop="processStatus">
        <el-select v-model="query.processStatus" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('security.intercept.unhandled')" :value="0" />
          <el-option :label="$t('security.intercept.processed')" :value="1" />
          <el-option :label="$t('security.intercept.ignored')" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('security.intercept.clientIp')" prop="clientIp">
        <el-input v-model.trim="query.clientIp" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('security.intercept.traceId')" prop="traceId">
        <el-input v-model.trim="query.traceId" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('security.intercept.requestPath')" prop="requestPath">
        <el-input v-model.trim="query.requestPath" :placeholder="$t('security.intercept.requestPathPlaceholder')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <template #time>
        <el-form-item :label="$t('security.intercept.eventTime')" class="transaction-time-form-item">
          <TransactionTimeRangeFilter v-model="timeRange" :time-zone="displayTimeZone" :timezone-options="timezoneOptions" default-preset="today" @update:time-zone="query.queryTimeZone = $event" />
        </el-form-item>
      </template>
    </TransactionSearchPanel>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="warning" plain :icon="Download" size="small" :loading="exporting" @click="handleExport" v-hasPermi="'security:intercept-event:export'">{{ $t('common.export') }}</el-button>
      </el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
      </el-col>
    </el-row>

    <StandardTable table-key="security-intercept-event-main" v-loading="loading" :data="rows" row-key="id" size="small" class="security-intercept-page__table">
      <el-table-column :label="$t('security.intercept.eventTime')" min-width="172" align="center" fixed>
        <template #default="{ row }"><BaseDateTime :value="row.eventTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
      </el-table-column>
      <el-table-column :label="$t('security.intercept.riskLevel')" width="112" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="riskTagType(row.riskLevel)" effect="plain">{{ riskLabel(row.riskLevel) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="sourceLayer" :label="$t('security.intercept.sourceLayer')" width="116" align="center" />
      <el-table-column :label="$t('security.intercept.eventType')" min-width="220" align="center" show-overflow-tooltip>
        <template #default="{ row }"><code class="security-intercept-page__code">{{ row.eventType || '-' }}</code></template>
      </el-table-column>
      <el-table-column prop="merchantId" :label="$t('security.intercept.merchantId')" min-width="132" align="center" show-overflow-tooltip />
      <el-table-column prop="clientIp" :label="$t('security.intercept.clientIp')" min-width="140" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('security.intercept.request')" min-width="280" align="left" show-overflow-tooltip>
        <template #default="{ row }">
          <span class="security-intercept-page__method">{{ row.requestMethod || '-' }}</span>
          <span>{{ row.requestPath || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="hitRuleCode" :label="$t('security.intercept.hitRuleCode')" min-width="170" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('security.intercept.reason')" min-width="260" align="left" show-overflow-tooltip>
        <template #default="{ row }">
          <span>{{ row.reasonCode || '-' }}</span>
          <span v-if="row.reasonMessage" class="security-intercept-page__reason"> {{ row.reasonMessage }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="traceId" :label="$t('security.intercept.traceId')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column :label="$t('security.intercept.processStatus')" width="112" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="processTagType(row.processStatus)" effect="plain">{{ processLabel(row.processStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" width="170" fixed="right" align="center">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'security:intercept-event:detail'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="EditPen" @click="openMark(row)" v-hasPermi="'security:intercept-event:mark'">{{ $t('security.intercept.mark') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('security.intercept.detailTitle')" size="lg" :loading="detailLoading">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item :label="$t('security.intercept.eventNo')" :span="2">{{ detail.eventNo || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.eventTime')"><BaseDateTime :value="detail.eventTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.riskLevel')">
          <el-tag size="small" :type="riskTagType(detail.riskLevel)" effect="plain">{{ riskLabel(detail.riskLevel) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.sourceLayer')">{{ detail.sourceLayer || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.eventType')">{{ detail.eventType || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.merchantId')">{{ detail.merchantId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.clientIp')">{{ detail.clientIp || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.request')" :span="2">{{ requestLine(detail) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.traceId')">{{ detail.traceId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.requestId')">{{ detail.requestId || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.hitRuleCode')">{{ detail.hitRuleCode || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.serviceName')">{{ detail.serviceName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.reasonCode')">{{ detail.reasonCode || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.reasonMessage')">{{ detail.reasonMessage || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.userAgent')" :span="2">{{ detail.userAgent || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.headerSummary')" :span="2">
          <pre class="security-intercept-page__pre">{{ formatSummary(detail.headerSummary) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.processStatus')">
          <el-tag size="small" :type="processTagType(detail.processStatus)" effect="plain">{{ processLabel(detail.processStatus) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.processedBy')">{{ detail.processedBy || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.processedTime')"><BaseDateTime :value="detail.processedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
        <el-descriptions-item :label="$t('security.intercept.processRemark')" :span="2">{{ detail.processRemark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </CommonDetailDrawer>

    <el-dialog v-model="markVisible" :title="$t('security.intercept.markTitle')" width="520px" append-to-body destroy-on-close>
      <el-form ref="markFormRef" :model="markForm" :rules="markRules" label-width="96px" size="small">
        <el-form-item :label="$t('security.intercept.eventNo')">
          <el-input :model-value="markTarget?.eventNo || '-'" disabled />
        </el-form-item>
        <el-form-item :label="$t('security.intercept.processStatus')" prop="processStatus">
          <el-radio-group v-model="markForm.processStatus">
            <el-radio-button :label="1">{{ $t('security.intercept.processed') }}</el-radio-button>
            <el-radio-button :label="2">{{ $t('security.intercept.ignored') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('security.intercept.processRemark')" prop="processRemark">
          <el-input v-model="markForm.processRemark" type="textarea" :rows="4" maxlength="512" show-word-limit :placeholder="$t('security.intercept.processRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="markSaving" @click="submitMark">{{ $t('common.confirm') }}</el-button>
          <el-button @click="markVisible = false">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Download, EditPen, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import {
  exportSecurityInterceptEvents,
  getSecurityInterceptEvent,
  markSecurityInterceptEvent,
  searchSecurityInterceptEvents,
  type SecurityInterceptEventQuery,
  type SecurityInterceptEventRow,
} from '@/api/security/intercept-event';
import MerchantRemoteSelect from '../../transaction/components/MerchantRemoteSelect.vue';
import TransactionSearchPanel from '../../transaction/components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../../transaction/components/TransactionTimeRangeFilter.vue';
import {
  DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
  defaultTransactionTodayRange,
  ensureTransactionTimezoneOptions,
  splitDateRange,
} from '../../transaction/shared';

const { t, locale } = useI18n();
const markFormRef = ref<FormInstance>();
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const rows = ref<SecurityInterceptEventRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const timeRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive<SecurityInterceptEventQuery>({
  merchantId: '',
  eventType: '',
  riskLevel: '',
  sourceLayer: '',
  processStatus: 0,
  clientIp: '',
  traceId: '',
  requestPath: '',
  queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const detailVisible = ref(false);
const detailLoading = ref(false);
const detail = ref<SecurityInterceptEventRow>();
const markVisible = ref(false);
const markSaving = ref(false);
const markTarget = ref<SecurityInterceptEventRow>();
const markForm = reactive({ processStatus: 1, processRemark: '' });

const riskLevelOptions = computed(() => [
  { value: 'LOW', label: t('security.intercept.riskLow') },
  { value: 'MEDIUM', label: t('security.intercept.riskMedium') },
  { value: 'HIGH', label: t('security.intercept.riskHigh') },
  { value: 'CRITICAL', label: t('security.intercept.riskCritical') },
]);

const displayTimeZone = computed(() => query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);

const markRules: FormRules = {
  processStatus: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
};

onMounted(async () => {
  await loadDictionaries();
  await loadData();
});

async function loadDictionaries() {
  try {
    const options = await loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []);
    timezoneOptions.value = ensureTransactionTimezoneOptions(options);
  } catch {
    timezoneOptions.value = ensureTransactionTimezoneOptions([]);
  }
}

async function loadData() {
  loading.value = true;
  try {
    const result = await searchSecurityInterceptEvents(buildQuery());
    rows.value = result.records || [];
    total.value = result.total || 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadData();
}

function resetQuery() {
  query.merchantId = '';
  query.eventType = '';
  query.riskLevel = '';
  query.sourceLayer = '';
  query.processStatus = 0;
  query.clientIp = '';
  query.traceId = '';
  query.requestPath = '';
  query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
  timeRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
  handleSearch();
}

async function handleExport() {
  exporting.value = true;
  try {
    await exportSecurityInterceptEvents(buildQuery(false));
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.exportFailed'));
  } finally {
    exporting.value = false;
  }
}

async function openDetail(row: SecurityInterceptEventRow) {
  detailVisible.value = true;
  detailLoading.value = true;
  detail.value = undefined;
  try {
    detail.value = await getSecurityInterceptEvent(row.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.loadFailed'));
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

function openMark(row: SecurityInterceptEventRow) {
  markTarget.value = row;
  markForm.processStatus = row.processStatus === 2 ? 2 : 1;
  markForm.processRemark = row.processRemark || '';
  markVisible.value = true;
  setTimeout(() => markFormRef.value?.clearValidate(), 0);
}

async function submitMark() {
  if (!markTarget.value) {
    return;
  }
  const valid = await markFormRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }
  markSaving.value = true;
  try {
    const updated = await markSecurityInterceptEvent(markTarget.value.id, {
      processStatus: markForm.processStatus,
      processRemark: markForm.processRemark || undefined,
    });
    ElMessage.success(t('common.success'));
    markVisible.value = false;
    replaceRow(updated);
    if (detail.value?.id === updated.id) {
      detail.value = updated;
    }
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('common.saveFailed'));
  } finally {
    markSaving.value = false;
  }
}

function buildQuery(withPage = true): SecurityInterceptEventQuery {
  const range = splitDateRange(timeRange.value);
  const result: SecurityInterceptEventQuery = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result[key as keyof SecurityInterceptEventQuery] = value as never;
    }
  });
  result.queryTimeZone = query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
  Object.assign(result, range);
  if (withPage) {
    result.pageNo = page.value;
    result.pageSize = pageSize.value;
  }
  return result;
}

function replaceRow(updated: SecurityInterceptEventRow) {
  const index = rows.value.findIndex((item) => item.id === updated.id);
  if (index >= 0) {
    rows.value.splice(index, 1, updated);
  }
}

function riskLabel(value?: string) {
  const key = String(value || '').toUpperCase();
  const matched = riskLevelOptions.value.find((item) => item.value === key);
  return matched?.label || value || '-';
}

function riskTagType(value?: string) {
  const key = String(value || '').toUpperCase();
  if (key === 'CRITICAL') {
    return 'danger';
  }
  if (key === 'HIGH') {
    return 'warning';
  }
  if (key === 'MEDIUM') {
    return 'primary';
  }
  return 'info';
}

function processLabel(value?: number) {
  if (value === 1) {
    return t('security.intercept.processed');
  }
  if (value === 2) {
    return t('security.intercept.ignored');
  }
  return t('security.intercept.unhandled');
}

function processTagType(value?: number) {
  if (value === 1) {
    return 'success';
  }
  if (value === 2) {
    return 'info';
  }
  return 'warning';
}

function requestLine(row?: SecurityInterceptEventRow) {
  if (!row) {
    return '-';
  }
  return `${row.requestMethod || '-'} ${row.requestPath || '-'}`;
}

function formatSummary(value?: string) {
  if (!value) {
    return '-';
  }
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}
</script>

<style scoped>
.security-intercept-page__search {
  padding-bottom: 2px;
}

.security-intercept-page__time {
  width: 330px;
}

.security-intercept-page__select {
  width: 150px;
}

.security-intercept-page__input {
  width: 180px;
}

.security-intercept-page__wide {
  width: 230px;
}

.security-intercept-page__path {
  width: 330px;
}

.security-intercept-page__table {
  border-radius: 6px;
  overflow: hidden;
}

.security-intercept-page__table :deep(.el-table__header-wrapper th) {
  height: 34px;
  background: #f7f9fc;
  color: #364152;
  font-size: 12px;
  font-weight: 700;
}

.security-intercept-page__table :deep(.el-table__cell) {
  padding: 6px 0;
}

.security-intercept-page__table :deep(.el-table__body tr:nth-child(even) td.el-table__cell) {
  background: #fbfcfe;
}

.security-intercept-page__table :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: #f3f7ff;
}

.security-intercept-page__table :deep(.el-tag) {
  min-width: 58px;
  justify-content: center;
  border-radius: 4px;
}

.security-intercept-page__method {
  display: inline-block;
  min-width: 44px;
  margin-right: 8px;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 700;
}

.security-intercept-page__code {
  color: #1f2937;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.security-intercept-page__reason {
  color: #64748b;
}

.security-intercept-page__pre {
  min-height: 72px;
  max-height: 240px;
  margin: 0;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  line-height: 1.55;
}
</style>
