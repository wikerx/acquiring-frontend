<template>
  <div class="page system-page merchant-redesigned-page merchant-export-task-page">
    <section class="merchant-list-card merchant-search-card merchant-export-task-filter">
      <el-form v-show="showSearch" :model="query" inline size="small" class="search-form export-task-search-form">
        <div class="export-task-search-form__fields">
          <el-form-item :label="t('exportTask.taskType')">
            <el-select v-model="query.taskType" clearable :placeholder="t('common.pleaseSelect')">
              <el-option v-for="item in taskTypeOptions" :key="item" :label="taskTypeText(item)" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('common.status')">
            <el-select v-model="query.status" clearable :placeholder="t('common.pleaseSelect')">
              <el-option v-for="item in statusOptions" :key="item" :label="statusText(item)" :value="item" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('exportTask.createTime')" class="export-task-time-item">
            <TransactionTimeRangeFilter
              v-model="createdRange"
              v-model:time-zone="createdTimeZone"
              v-model:preset="createdPreset"
              :timezone-options="createdTimezoneOptions"
              time-zone-disabled
              default-preset="today"
            />
          </el-form-item>
          <el-form-item class="merchant-search-actions export-task-search-actions">
            <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
            <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
          </el-form-item>
        </div>
      </el-form>
    </section>

    <section class="merchant-list-card merchant-table-card merchant-export-task-table-card">
      <div class="merchant-table-head">
        <div class="merchant-table-head__actions" />
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" />
      </div>

      <StandardTable
        table-key="merchant-export-task-center-v1"
        v-loading="loading"
        :data="rows"
        row-key="taskNo"
        size="small"
      >
        <el-table-column :label="t('exportTask.taskNo')" min-width="212" fixed="left" align="center">
          <template #default="{ row }">
            <div class="export-task-identity">
              <button v-if="canDetail" type="button" class="export-task-identity__link" @click="openDetail(row)">
                {{ row.taskNo }}
              </button>
              <code v-else>{{ row.taskNo }}</code>
              <el-tooltip :content="t('exportTask.copyTaskNo')" placement="top">
                <el-button text circle size="small" :icon="CopyDocument" :aria-label="t('exportTask.copyTaskNo')" @click.stop="copyTaskNo(row.taskNo)" />
              </el-tooltip>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="taskName" :label="t('exportTask.taskName')" min-width="168" align="center" show-overflow-tooltip />
        <el-table-column :label="t('exportTask.taskType')" min-width="150" align="center">
          <template #default="{ row }">{{ taskTypeText(row.taskType) }}</template>
        </el-table-column>
        <el-table-column :label="t('common.status')" width="112" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="light" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('exportTask.progress')" min-width="172" align="center">
          <template #default="{ row }">
            <el-progress :percentage="normalizedProgress(row)" :status="progressStatus(row.status)" :stroke-width="7" />
          </template>
        </el-table-column>
        <el-table-column :label="t('exportTask.rowCount')" min-width="132" align="center">
          <template #default="{ row }">{{ rowCountText(row) }}</template>
        </el-table-column>
        <el-table-column :label="t('exportTask.fileSize')" min-width="112" align="center">
          <template #default="{ row }">{{ formatFileSize(row.fileSizeBytes) }}</template>
        </el-table-column>
        <el-table-column :label="t('exportTask.createTime')" min-width="180" align="center">
          <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
        </el-table-column>
        <el-table-column :label="t('exportTask.finishedAt')" min-width="180" align="center">
          <template #default="{ row }"><BaseDateTime :value="row.finishedAt" /></template>
        </el-table-column>
        <el-table-column :label="t('exportTask.expiresAt')" min-width="180" align="center">
          <template #default="{ row }"><BaseDateTime :value="row.expiresAt" /></template>
        </el-table-column>
        <el-table-column :label="t('exportTask.failureReason')" min-width="220" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ failureText(row) }}</template>
        </el-table-column>
        <el-table-column v-if="hasRowActions" :label="t('common.operation')" width="184" fixed="right" align="center">
          <template #default="{ row }">
            <TableRowActions :actions="rowActions(row)" :more-label="t('common.more')" @select="handleRowAction($event, row)" />
          </template>
        </el-table-column>
      </StandardTable>

      <div v-show="total > 0" class="pagination-container">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="handleSizeChange"
          @current-change="loadData"
        />
      </div>
    </section>

    <CommonDetailDrawer v-model:visible="detailVisible" :title="t('exportTask.detailTitle')" size="lg" :loading="detailLoading">
      <template v-if="detail">
        <section class="export-task-detail-section">
          <h3>{{ t('exportTask.taskFacts') }}</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('exportTask.taskNo')">
              <div class="export-task-identity export-task-identity--detail">
                <code>{{ detail.taskNo }}</code>
                <el-button text circle size="small" :icon="CopyDocument" :aria-label="t('exportTask.copyTaskNo')" @click="copyTaskNo(detail.taskNo)" />
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="t('common.status')">
              <el-tag :type="statusTagType(detail.status)" effect="light" size="small">{{ statusText(detail.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.taskName')">{{ detail.taskName }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.taskType')">{{ taskTypeText(detail.taskType) }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.progress')">{{ normalizedProgress(detail) }}%</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.rowCount')">{{ rowCountText(detail) }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.retryCount')">{{ t('exportTask.retryCountValue', { current: detail.retryCount, max: detail.maxRetryCount }) }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.version')">{{ detail.version }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="export-task-detail-section">
          <h3>{{ t('exportTask.fileFacts') }}</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('exportTask.fileName')" :span="2">{{ detail.fileName || '-' }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.fileSize')">{{ formatFileSize(detail.fileSizeBytes) }}</el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.fileSha256')"><code class="export-task-hash">{{ detail.fileSha256 || '-' }}</code></el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.createTime')"><BaseDateTime :value="detail.createTime" /></el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.startedAt')"><BaseDateTime :value="detail.startedAt" /></el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.finishedAt')"><BaseDateTime :value="detail.finishedAt" /></el-descriptions-item>
            <el-descriptions-item :label="t('exportTask.expiresAt')"><BaseDateTime :value="detail.expiresAt" /></el-descriptions-item>
          </el-descriptions>
        </section>

        <el-alert
          v-if="detail.failureCode || detail.failureReason"
          class="export-task-failure"
          :title="t('exportTask.failureTitle')"
          :description="failureText(detail)"
          type="error"
          :closable="false"
          show-icon
        />
      </template>
      <template #footer>
        <div class="dialog-footer">
          <el-button v-if="detail && canDownload && detail.status === 'SUCCESS'" type="primary" :icon="Download" :loading="downloadingTaskNo === detail.taskNo" @click="handleDownload(detail)">
            {{ t('exportTask.download') }}
          </el-button>
          <el-button v-if="detail && canRetry && detail.status === 'FAILED'" type="warning" :icon="RefreshRight" :loading="retryingTaskNo === detail.taskNo" @click="handleRetry(detail)">
            {{ t('exportTask.retry') }}
          </el-button>
          <el-button @click="detailVisible = false">{{ t('common.close') }}</el-button>
        </div>
      </template>
    </CommonDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import { MerchantMessageBox } from '@/utils/feedback';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { CopyDocument, Download, RefreshLeft, RefreshRight, Search, View } from '@element-plus/icons-vue';
import { TableRowActions, type TableRowAction } from '@acquiring/shared';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
  downloadMerchantExportTask,
  getMerchantExportTask,
  retryMerchantExportTask,
  searchMerchantExportTasks,
  type MerchantExportTaskQuery,
  type MerchantExportTaskStatus,
  type MerchantExportTaskSummary,
  type MerchantExportTaskType,
} from '@/api/exportTaskApi';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { hasPermission } from '@/utils/permission';
import TransactionTimeRangeFilter from '@/pages/transaction/components/TransactionTimeRangeFilter.vue';
import {
  DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
  defaultTransactionTodayRange,
  ensureTransactionTimezoneOptions,
  resolveTransactionQueryRange,
} from '@/pages/transaction/shared';

const POLL_INTERVAL_MILLIS = 10_000;
const taskTypeOptions: MerchantExportTaskType[] = [
  'MERCHANT_TRANSACTION_OPERATION',
  'MERCHANT_REFUND',
  'MERCHANT_SETTLEMENT_BATCH',
  'MERCHANT_SETTLEMENT_SUMMARY',
  'MERCHANT_SETTLEMENT_TRANSACTION',
  'MERCHANT_SETTLEMENT_RESERVE',
  'MERCHANT_FUND_LEDGER',
];
const statusOptions: MerchantExportTaskStatus[] = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED'];
const taskTypeI18nKeys: Record<string, string> = {
  MERCHANT_PAYMENT_LINK: 'exportTask.type.MERCHANT_PAYMENT_LINK',
  MERCHANT_TRANSACTION_OPERATION: 'exportTask.type.MERCHANT_TRANSACTION_OPERATION',
  MERCHANT_REFUND: 'exportTask.type.MERCHANT_REFUND',
  MERCHANT_SETTLEMENT_BATCH: 'exportTask.type.MERCHANT_SETTLEMENT_BATCH',
  MERCHANT_SETTLEMENT_SUMMARY: 'exportTask.type.MERCHANT_SETTLEMENT_SUMMARY',
  MERCHANT_SETTLEMENT_TRANSACTION: 'exportTask.type.MERCHANT_SETTLEMENT_TRANSACTION',
  MERCHANT_SETTLEMENT_RESERVE: 'exportTask.type.MERCHANT_SETTLEMENT_RESERVE',
  MERCHANT_FUND_LEDGER: 'exportTask.type.MERCHANT_FUND_LEDGER',
};
const statusI18nKeys: Record<string, string> = {
  PENDING: 'exportTask.status.PENDING',
  PROCESSING: 'exportTask.status.PROCESSING',
  SUCCESS: 'exportTask.status.SUCCESS',
  FAILED: 'exportTask.status.FAILED',
  EXPIRED: 'exportTask.status.EXPIRED',
};

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const detailLoading = ref(false);
const downloadingTaskNo = ref('');
const retryingTaskNo = ref('');
const rows = ref<MerchantExportTaskSummary[]>([]);
const detail = ref<MerchantExportTaskSummary | null>(null);
const detailVisible = ref(false);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const createdTimeZone = ref(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
const createdPreset = ref('today');
const createdRange = ref<string[]>(defaultTransactionTodayRange(createdTimeZone.value));
const createdTimezoneOptions = ensureTransactionTimezoneOptions([])
  .filter((item) => item.value === DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
const query = reactive<MerchantExportTaskQuery>({ taskType: '', status: '' });
const canDetail = computed(() => hasPermission('merchant:operations:export-task:detail'));
const canDownload = computed(() => hasPermission('merchant:operations:export-task:download'));
const canRetry = computed(() => hasPermission('merchant:operations:export-task:retry'));
const hasRowActions = computed(() => canDetail.value || canDownload.value || canRetry.value);
let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  void loadData();
  pollTimer = setInterval(() => {
    if (rows.value.some((item) => item.status === 'PENDING' || item.status === 'PROCESSING')) {
      void loadData(true);
    }
  }, POLL_INTERVAL_MILLIS);
});

onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function buildQuery(): MerchantExportTaskQuery {
  createdRange.value = resolveTransactionQueryRange(createdRange.value, createdPreset.value, createdTimeZone.value);
  return {
    taskType: query.taskType || undefined,
    status: query.status || undefined,
    createdStartTime: createdRange.value?.[0] || undefined,
    createdEndTime: createdRange.value?.[1] || undefined,
    pageNo: page.value,
    pageSize: pageSize.value,
  };
}

async function loadData(silent = false) {
  if (!silent) loading.value = true;
  try {
    const result = await searchMerchantExportTasks(buildQuery());
    rows.value = result.records || [];
    total.value = result.total || 0;
  } catch (error: unknown) {
    if (!silent) {
      rows.value = [];
      total.value = 0;
      ElMessage.error(resolveErrorMessage(error, t('exportTask.loadFailed')));
    }
  } finally {
    if (!silent) loading.value = false;
  }
}

function applyQuery() {
  page.value = 1;
  void loadData();
}

function resetQuery() {
  query.taskType = '';
  query.status = '';
  createdTimeZone.value = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
  createdPreset.value = 'today';
  createdRange.value = defaultTransactionTodayRange(createdTimeZone.value);
  applyQuery();
}

function handleSizeChange() {
  page.value = 1;
  void loadData();
}

async function openDetail(row: MerchantExportTaskSummary) {
  if (!canDetail.value) return;
  detailVisible.value = true;
  detail.value = row;
  detailLoading.value = true;
  try {
    detail.value = await getMerchantExportTask(row.taskNo);
  } catch (error: unknown) {
    ElMessage.error(resolveErrorMessage(error, t('exportTask.detailFailed')));
  } finally {
    detailLoading.value = false;
  }
}

function rowActions(row: MerchantExportTaskSummary): TableRowAction[] {
  const actions: TableRowAction[] = [];
  if (canDetail.value) actions.push({ key: 'detail', label: t('common.detail'), icon: View });
  if (canDownload.value && row.status === 'SUCCESS') {
    actions.push({ key: 'download', label: t('exportTask.download'), icon: Download, type: 'success', loading: downloadingTaskNo.value === row.taskNo });
  }
  if (canRetry.value && row.status === 'FAILED') {
    actions.push({ key: 'retry', label: t('exportTask.retry'), icon: RefreshRight, type: 'warning', loading: retryingTaskNo.value === row.taskNo });
  }
  return actions;
}

function handleRowAction(action: string, row: MerchantExportTaskSummary) {
  if (action === 'detail') void openDetail(row);
  if (action === 'download') void handleDownload(row);
  if (action === 'retry') void handleRetry(row);
}

async function handleDownload(row: MerchantExportTaskSummary) {
  if (!canDownload.value || row.status !== 'SUCCESS' || downloadingTaskNo.value) return;
  downloadingTaskNo.value = row.taskNo;
  try {
    await downloadMerchantExportTask(row.taskNo, row.fileName);
    ElMessage.success(t('exportTask.downloadStarted'));
  } catch (error: unknown) {
    ElMessage.error(resolveErrorMessage(error, t('exportTask.downloadFailed')));
  } finally {
    downloadingTaskNo.value = '';
  }
}

async function handleRetry(row: MerchantExportTaskSummary) {
  if (!canRetry.value || row.status !== 'FAILED' || retryingTaskNo.value) return;
  try {
    await MerchantMessageBox.confirm(
      t('exportTask.retryConfirm', { taskNo: row.taskNo }),
      t('exportTask.retryTitle'),
      { type: 'warning', confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel') },
    );
  } catch {
    return;
  }
  retryingTaskNo.value = row.taskNo;
  try {
    const updated = await retryMerchantExportTask(row.taskNo, row.version);
    ElMessage.success(t('exportTask.retryAccepted'));
    if (detail.value?.taskNo === row.taskNo) detail.value = updated;
    await loadData();
  } catch (error: unknown) {
    ElMessage.error(resolveErrorMessage(error, t('exportTask.retryFailed')));
  } finally {
    retryingTaskNo.value = '';
  }
}

async function copyTaskNo(taskNo: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(taskNo);
    } else {
      copyTextWithTextarea(taskNo);
    }
    ElMessage.success(t('common.copySuccess'));
  } catch {
    ElMessage.error(t('common.copyFailed'));
  }
}

function copyTextWithTextarea(value: string) {
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  if (!copied) throw new Error('copy command was rejected');
}

function taskTypeText(value?: MerchantExportTaskType | null) {
  if (!value) return '-';
  const key = taskTypeI18nKeys[value];
  return key ? t(key) : value;
}

function statusText(value?: MerchantExportTaskStatus | null) {
  if (!value) return '-';
  const key = statusI18nKeys[value];
  return key ? t(key) : value;
}

function statusTagType(value: MerchantExportTaskStatus) {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED') return 'danger';
  if (value === 'PENDING' || value === 'PROCESSING') return 'warning';
  return 'info';
}

function progressStatus(value: MerchantExportTaskStatus): 'success' | 'exception' | undefined {
  if (value === 'SUCCESS') return 'success';
  if (value === 'FAILED' || value === 'EXPIRED') return 'exception';
  return undefined;
}

function normalizedProgress(row: MerchantExportTaskSummary) {
  const value = Number(row.progressPercent || 0);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
}

function rowCountText(row: MerchantExportTaskSummary) {
  return `${row.processedRows || 0} / ${row.totalRows || 0}`;
}

function formatFileSize(value?: number | null) {
  if (!value || value <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let amount = value;
  let index = 0;
  while (amount >= 1024 && index < units.length - 1) {
    amount /= 1024;
    index += 1;
  }
  return `${amount.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
}

function failureText(row: MerchantExportTaskSummary) {
  return row.failureReason || row.failureCode || '-';
}

function resolveErrorMessage(error: unknown, fallback: string) {
  if (!error || typeof error !== 'object') return fallback;
  const value = error as { friendlyMessage?: string; message?: string };
  return value.friendlyMessage || value.message || fallback;
}
</script>

<style scoped>
.merchant-export-task-page {
  display: grid;
  gap: 10px;
}

.merchant-export-task-filter {
  container-type: inline-size;
}

.export-task-search-form__fields {
  display: grid;
  grid-template-columns: max-content max-content minmax(0, 760px) minmax(max-content, 1fr);
  align-items: center;
  gap: 8px 12px;
  width: 100%;
}

.export-task-search-form :deep(.el-form-item) {
  margin: 0;
}

.export-task-search-form :deep(.el-select) {
  width: 154px;
}

.export-task-time-item {
  min-width: 0;
}

.export-task-time-item :deep(.el-form-item__content) {
  width: 100%;
  min-width: 0;
}

.export-task-time-item :deep(.transaction-time-range-filter) {
  max-width: 760px;
}

.export-task-search-actions {
  justify-self: end;
  margin-left: 0;
}

.merchant-export-task-table-card {
  overflow: hidden;
}

.export-task-identity {
  display: inline-flex;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.export-task-identity code,
.export-task-identity__link {
  overflow: hidden;
  color: #355164;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.export-task-identity__link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-color-primary);
  cursor: pointer;
}

.export-task-identity__link:hover {
  text-decoration: underline;
}

.export-task-identity--detail {
  justify-content: flex-start;
}

.export-task-detail-section + .export-task-detail-section {
  margin-top: 18px;
}

.export-task-detail-section h3 {
  margin: 0 0 10px;
  color: #19374b;
  font-size: 14px;
  font-weight: 700;
}

.export-task-hash {
  display: inline-block;
  max-width: 100%;
  overflow-wrap: anywhere;
  color: #496273;
  font-size: 11px;
}

.export-task-failure {
  margin-top: 18px;
}

@container (max-width: 1400px) {
  .export-task-search-form__fields {
    grid-template-columns: max-content max-content minmax(0, 1fr) max-content;
  }

  .export-task-time-item {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .export-task-search-actions {
    grid-column: 4;
    grid-row: 1;
  }
}

@media (max-width: 640px) {
  .export-task-search-form__fields {
    grid-template-columns: minmax(0, 1fr);
  }

  .export-task-time-item,
  .export-task-search-actions {
    grid-column: auto;
    grid-row: auto;
  }

  .export-task-search-form :deep(.el-select),
  .export-task-search-form :deep(.el-form-item),
  .export-task-time-item {
    width: 100%;
  }

  .export-task-search-actions {
    width: 100%;
  }
}
</style>
