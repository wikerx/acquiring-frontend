<template>
  <div class="app-container exchange-page">
    <el-form
      v-show="showSearch"
      :model="query"
      :inline="true"
      size="small"
      class="search-form"
      label-width="92px"
    >
      <el-form-item :label="t('exchange.alertEvent.eventNo')"
        ><el-input v-model.trim="query.eventNo" clearable @keyup.enter="handleSearch"
      /></el-form-item>
      <el-form-item :label="t('exchange.fields.rateType')"
        ><el-select v-model="query.rateType" clearable :placeholder="t('common.pleaseSelect')"
          ><el-option
            v-for="item in rateTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item :label="t('exchange.fields.baseCurrency')"
        ><CurrencySelect v-model="query.baseCurrency" @change="handleSearch"
      /></el-form-item>
      <el-form-item :label="t('exchange.fields.quoteCurrency')"
        ><CurrencySelect v-model="query.quoteCurrency" @change="handleSearch"
      /></el-form-item>
      <el-form-item :label="t('common.status')"
        ><el-select v-model="query.eventStatus" clearable :placeholder="t('common.pleaseSelect')"
          ><el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item :label="t('exchange.alertEvent.triggerTime')"
        ><el-date-picker
          v-model="triggerRange"
          type="datetimerange"
          :clearable="false"
          value-format="YYYY-MM-DDTHH:mm:ss"
          format="YYYY-MM-DD HH:mm:ss"
          :range-separator="t('common.to')"
          :start-placeholder="t('exchange.placeholders.start')"
          :end-placeholder="t('exchange.placeholders.end')"
      /></el-form-item>
      <el-form-item
        ><el-button type="primary" :icon="Search" @click="handleSearch">{{
          t('common.search')
        }}</el-button
        ><el-button :icon="Refresh" @click="resetQuery">{{
          t('common.reset')
        }}</el-button></el-form-item
      >
    </el-form>

    <el-row :gutter="10" class="mb8"
      ><el-col :span="1.5"
        ><el-button
          type="warning"
          plain
          :icon="Download"
          size="small"
          v-hasPermi="'exchange:alert-event:export'"
          @click="handleExport"
          >{{ t('common.export') }}</el-button
        ></el-col
      ><el-col class="right-toolbar"
        ><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col
    ></el-row>

    <StandardTable
      table-key="exchange-rate-alert-event"
      v-loading="loading"
      :data="rows"
      row-key="id"
      size="small"
    >
      <el-table-column
        prop="eventNo"
        :label="t('exchange.alertEvent.eventNo')"
        min-width="190"
        :show-overflow-tooltip="true"
      />
      <el-table-column :label="t('exchange.fields.rateType')" min-width="120" align="center"
        ><template #default="{ row }">{{ rateTypeText(row.rateType) }}</template></el-table-column
      >
      <el-table-column :label="t('exchange.fields.currencyPair')" min-width="150" align="center"
        ><template #default="{ row }"
          ><CurrencyPairDisplay
            :base-currency="row.baseCurrency"
            :quote-currency="row.quoteCurrency"
            :locale="String(locale)" /></template
      ></el-table-column>
      <el-table-column
        :label="t('exchange.alertEvent.currentVolatility')"
        min-width="125"
        align="right"
        ><template #default="{ row }"
          ><strong class="numeric-value is-alert">{{ row.volatilityRate }}%</strong></template
        ></el-table-column
      >
      <el-table-column
        :label="t('exchange.alertEvent.maximumVolatility')"
        min-width="130"
        align="right"
        ><template #default="{ row }"
          ><span class="numeric-value">{{ row.maximumVolatilityRate }}%</span></template
        ></el-table-column
      >
      <el-table-column :label="t('exchange.alertRule.alertLevel')" min-width="100" align="center"
        ><template #default="{ row }"
          ><el-tag
            :type="row.alertLevel === 'WARNING' ? 'warning' : 'danger'"
            size="small"
            effect="plain"
            >{{ t(`exchange.alertRule.level.${row.alertLevel}`) }}</el-tag
          ></template
        ></el-table-column
      >
      <el-table-column :label="t('common.status')" min-width="120" align="center"
        ><template #default="{ row }"
          ><el-tag :type="statusTagType(row.eventStatus)" size="small">{{
            statusText(row.eventStatus)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column :label="t('exchange.alertEvent.triggerTime')" min-width="170" align="center"
        ><template #default="{ row }"><BaseDateTime :value="row.firstTriggerTime" /></template
      ></el-table-column>
      <el-table-column
        :label="t('exchange.alertEvent.lastDetectedTime')"
        min-width="170"
        align="center"
        ><template #default="{ row }"><BaseDateTime :value="row.lastDetectedTime" /></template
      ></el-table-column>
      <el-table-column :label="t('common.operation')" min-width="230" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="View"
            v-hasPermi="'exchange:alert-event:query'"
            @click="openDetail(row)"
            >{{ t('common.detail') }}</el-button
          >
          <el-button
            v-if="row.eventStatus === 'OPEN'"
            type="warning"
            link
            :icon="Check"
            v-hasPermi="'exchange:alert-event:ack'"
            @click="openAction('acknowledge', row)"
            >{{ t('exchange.alertEvent.acknowledge') }}</el-button
          >
          <el-button
            v-if="row.eventStatus === 'RESOLVED'"
            type="success"
            link
            :icon="CircleClose"
            v-hasPermi="'exchange:alert-event:close'"
            @click="openAction('close', row)"
            >{{ t('common.close') }}</el-button
          >
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
        @size-change="loadData"
        @current-change="loadData"
      />
    </div>

    <CommonDetailDrawer
      v-model:visible="detailVisible"
      :title="t('exchange.alertEvent.detailTitle')"
      size="lg"
      :loading="detailLoading"
    >
      <template v-if="detail">
        <section class="detail-section">
          <h3>{{ t('exchange.alertEvent.eventFacts') }}</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('exchange.alertEvent.eventNo')">{{
              detail.eventNo
            }}</el-descriptions-item
            ><el-descriptions-item :label="t('common.status')"
              ><el-tag :type="statusTagType(detail.eventStatus)" size="small">{{
                statusText(detail.eventStatus)
              }}</el-tag></el-descriptions-item
            >
            <el-descriptions-item :label="t('exchange.alertRule.ruleCode')">{{
              detail.ruleCode
            }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertRule.ruleName')">{{
              detail.ruleName
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('exchange.fields.rateType')">{{
              rateTypeText(detail.rateType)
            }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.fields.currencyPair')"
              >{{ detail.baseCurrency }}/{{ detail.quoteCurrency }}</el-descriptions-item
            >
            <el-descriptions-item :label="t('exchange.alertRule.triggerThreshold')"
              >{{ detail.triggerThreshold }}%</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertRule.recoveryThreshold')"
              >{{ detail.recoveryThreshold }}%</el-descriptions-item
            >
          </el-descriptions>
        </section>
        <section class="detail-section">
          <h3>{{ t('exchange.alertEvent.windowEvidence') }}</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('exchange.alertEvent.windowStart')"
              ><BaseDateTime :value="detail.windowStartTime" /></el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.windowEnd')"
              ><BaseDateTime :value="detail.windowEndTime"
            /></el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.minimumEvidence')"
              ><span class="numeric-value">{{ detail.minimumRate }}</span> ·
              {{ detail.minimumRateSource }} · #{{
                detail.minimumBusinessRateId || '-'
              }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.maximumEvidence')"
              ><span class="numeric-value">{{ detail.maximumRate }}</span> ·
              {{ detail.maximumRateSource }} · #{{
                detail.maximumBusinessRateId || '-'
              }}</el-descriptions-item
            >
            <el-descriptions-item :label="t('exchange.alertEvent.latestEvidence')"
              ><span class="numeric-value">{{ detail.latestRate }}</span> ·
              {{ detail.latestRateSource }} · #{{
                detail.latestBusinessRateId || '-'
              }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertRule.minimumSamples')">{{
              detail.sampleCount
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.currentVolatility')"
              >{{ detail.volatilityRate }}%</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.maximumVolatility')"
              >{{ detail.maximumVolatilityRate }}%</el-descriptions-item
            >
          </el-descriptions>
        </section>
        <section class="detail-section">
          <h3>{{ t('exchange.alertEvent.lifecycle') }}</h3>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item :label="t('exchange.alertEvent.triggerTime')"
              ><BaseDateTime :value="detail.firstTriggerTime" /></el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.lastDetectedTime')"
              ><BaseDateTime :value="detail.lastDetectedTime"
            /></el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.acknowledgedBy')">{{
              detail.acknowledgedBy || '-'
            }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.acknowledgedTime')"
              ><BaseDateTime :value="detail.acknowledgedTime"
            /></el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.acknowledgeRemark')" :span="2">{{
              detail.acknowledgeRemark || '-'
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.resolvedTime')"
              ><BaseDateTime :value="detail.resolvedTime" /></el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.recoveryStreak')">{{
              detail.recoveryStreak
            }}</el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.closedBy')">{{
              detail.closedBy || '-'
            }}</el-descriptions-item
            ><el-descriptions-item :label="t('exchange.alertEvent.closedTime')"
              ><BaseDateTime :value="detail.closedTime"
            /></el-descriptions-item>
            <el-descriptions-item :label="t('exchange.alertEvent.closeRemark')" :span="2">{{
              detail.closeRemark || '-'
            }}</el-descriptions-item>
          </el-descriptions>
        </section>
      </template>
    </CommonDetailDrawer>

    <el-dialog
      v-model="actionVisible"
      :title="
        actionMode === 'acknowledge'
          ? t('exchange.alertEvent.acknowledgeTitle')
          : t('exchange.alertEvent.closeTitle')
      "
      width="520px"
    >
      <el-alert
        v-if="actionMode === 'close'"
        :title="t('exchange.alertEvent.closeHint')"
        type="info"
        :closable="false"
        show-icon
        class="action-alert"
      />
      <el-form ref="actionFormRef" :model="actionForm" :rules="actionRules" label-width="96px"
        ><el-form-item :label="t('common.remark')" prop="remark"
          ><el-input
            v-model.trim="actionForm.remark"
            type="textarea"
            :rows="4"
            maxlength="512"
            show-word-limit /></el-form-item
      ></el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="submitAction">{{
            t('common.confirm')
          }}</el-button>
          <el-button @click="actionVisible = false">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref } from 'vue';
  import type { FormInstance, FormRules } from 'element-plus';
  import { ElMessage } from 'element-plus';
  import { Check, CircleClose, Download, Refresh, Search, View } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import {
    acknowledgeExchangeRateAlertEvent,
    closeExchangeRateAlertEvent,
    exportExchangeRateAlertEvents,
    getExchangeRateAlertEvent,
    searchExchangeRateAlertEvents,
    type ExchangeRateAlertEvent,
  } from '@/api/exchange';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import CurrencyPairDisplay from '../CurrencyPairDisplay.vue';
  import CurrencySelect from '../CurrencySelect.vue';

  type ActionMode = 'acknowledge' | 'close';
  const { locale, t } = useI18n();
  const showSearch = ref(true),
    loading = ref(false),
    detailVisible = ref(false),
    detailLoading = ref(false),
    actionVisible = ref(false),
    submitting = ref(false);
  const rows = ref<ExchangeRateAlertEvent[]>([]),
    detail = ref<ExchangeRateAlertEvent | null>(null),
    actionTarget = ref<ExchangeRateAlertEvent | null>(null);
  const total = ref(0),
    page = ref(1),
    pageSize = ref(10);
  const actionMode = ref<ActionMode>('acknowledge'),
    actionFormRef = ref<FormInstance>();
  const triggerRange = ref<[string, string]>(rangeForHours(72));
  const query = reactive({
    eventNo: '',
    rateType: '',
    baseCurrency: '',
    quoteCurrency: '',
    eventStatus: '',
  });
  const actionForm = reactive({ remark: '' });
  const rateTypeOptions = computed(() =>
    ['TRANSACTION_RATE', 'SETTLEMENT_RATE'].map((value) => ({
      value,
      label: t(`exchange.enums.rateType.${value}`),
    })),
  );
  const statusOptions = computed(() =>
    ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'].map((value) => ({
      value,
      label: t(`exchange.alertEvent.status.${value}`),
    })),
  );
  const actionRules = computed<FormRules>(() => ({
    remark: [{ required: true, message: t('exchange.alertEvent.remarkRequired'), trigger: 'blur' }],
  }));

  onMounted(loadData);
  async function loadData() {
    loading.value = true;
    try {
      const result = await searchExchangeRateAlertEvents({
        pageNo: page.value,
        pageSize: pageSize.value,
        ...query,
        triggerStartTime: triggerRange.value[0],
        triggerEndTime: triggerRange.value[1],
      });
      rows.value = result.records;
      total.value = result.total;
    } finally {
      loading.value = false;
    }
  }
  function handleSearch() {
    page.value = 1;
    void loadData();
  }
  function resetQuery() {
    Object.assign(query, {
      eventNo: '',
      rateType: '',
      baseCurrency: '',
      quoteCurrency: '',
      eventStatus: '',
    });
    triggerRange.value = rangeForHours(72);
    handleSearch();
  }
  async function openDetail(row: ExchangeRateAlertEvent) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      detail.value = await getExchangeRateAlertEvent(row.id);
    } finally {
      detailLoading.value = false;
    }
  }
  function openAction(mode: ActionMode, row: ExchangeRateAlertEvent) {
    actionMode.value = mode;
    actionTarget.value = row;
    actionForm.remark = '';
    actionVisible.value = true;
    nextTick(() => actionFormRef.value?.clearValidate());
  }
  async function submitAction() {
    const valid = await actionFormRef.value?.validate().catch(() => false);
    if (!valid || !actionTarget.value) return;
    submitting.value = true;
    try {
      if (actionMode.value === 'acknowledge')
        await acknowledgeExchangeRateAlertEvent(
          actionTarget.value.id,
          actionTarget.value.version,
          actionForm.remark,
        );
      else
        await closeExchangeRateAlertEvent(
          actionTarget.value.id,
          actionTarget.value.version,
          actionForm.remark,
        );
      ElMessage.success(t('common.success'));
      actionVisible.value = false;
      await loadData();
      if (detailVisible.value && detail.value?.id === actionTarget.value.id)
        detail.value = await getExchangeRateAlertEvent(actionTarget.value.id);
    } finally {
      submitting.value = false;
    }
  }
  async function handleExport() {
    await exportExchangeRateAlertEvents({
      pageNo: page.value,
      pageSize: pageSize.value,
      ...query,
      triggerStartTime: triggerRange.value[0],
      triggerEndTime: triggerRange.value[1],
    });
  }
  function rateTypeText(value?: string) {
    return value ? t(`exchange.enums.rateType.${value}`, value) : '-';
  }
  function statusText(value?: string) {
    return value ? t(`exchange.alertEvent.status.${value}`, value) : '-';
  }
  function statusTagType(value: string): 'danger' | 'warning' | 'success' | 'info' {
    if (value === 'OPEN') return 'danger';
    if (value === 'ACKNOWLEDGED') return 'warning';
    if (value === 'RESOLVED') return 'success';
    return 'info';
  }
  function rangeForHours(hours: number): [string, string] {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 3600000);
    return [formatDate(start), formatDate(end)];
  }
  function formatDate(value: Date) {
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }
</script>

<style scoped>
  .numeric-value {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
  .numeric-value.is-alert {
    color: var(--el-color-danger);
  }
  .detail-section {
    margin-bottom: 22px;
  }
  .detail-section h3 {
    margin: 0 0 10px;
    padding-left: 10px;
    border-left: 3px solid var(--el-color-primary);
    font-size: 14px;
    letter-spacing: 0;
  }
  .action-alert {
    margin-bottom: 16px;
  }
  @media (max-width: 640px) {
    :deep(.el-dialog) {
      width: calc(100% - 24px) !important;
    }
  }
</style>
