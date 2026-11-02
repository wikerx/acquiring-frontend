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
      <el-form-item :label="t('common.keyword')"
        ><el-input
          v-model.trim="query.keyword"
          clearable
          :placeholder="t('exchange.alertRule.keywordPlaceholder')"
          @keyup.enter="handleSearch"
      /></el-form-item>
      <el-form-item :label="t('exchange.fields.rateType')"
        ><el-select v-model="query.rateType" clearable :placeholder="t('common.pleaseSelect')"
          ><el-option
            v-for="item in rateTypeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value" /></el-select
      ></el-form-item>
      <el-form-item :label="t('common.status')"
        ><el-select v-model="query.ruleStatus" clearable :placeholder="t('common.pleaseSelect')"
          ><el-option :label="t('status.enabled')" :value="1" /><el-option
            :label="t('status.disabled')"
            :value="0" /></el-select
      ></el-form-item>
      <el-form-item :label="t('exchange.alertRule.ruleKind')"
        ><el-select
          v-model="query.systemMandatory"
          clearable
          :placeholder="t('common.pleaseSelect')"
          ><el-option :label="t('exchange.alertRule.systemRule')" :value="1" /><el-option
            :label="t('exchange.alertRule.customRule')"
            :value="0" /></el-select
      ></el-form-item>
      <el-form-item
        ><el-button type="primary" :icon="Search" @click="handleSearch">{{
          t('common.search')
        }}</el-button
        ><el-button :icon="Refresh" @click="resetQuery">{{
          t('common.reset')
        }}</el-button></el-form-item
      >
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"
        ><el-button
          type="primary"
          plain
          :icon="Plus"
          size="small"
          v-hasPermi="'exchange:alert-rule:add'"
          @click="openCreate"
          >{{ t('common.add') }}</el-button
        ></el-col
      >
      <el-col :span="1.5"
        ><el-button
          type="success"
          plain
          :icon="Upload"
          size="small"
          v-hasPermi="'exchange:alert-rule:import'"
          @click="fileInput?.click()"
          >{{ t('common.import') }}</el-button
        ></el-col
      >
      <el-col :span="1.5"
        ><el-button
          type="warning"
          plain
          :icon="Download"
          size="small"
          v-hasPermi="'exchange:alert-rule:export'"
          @click="handleExport"
          >{{ t('common.export') }}</el-button
        ></el-col
      >
      <el-col class="right-toolbar"
        ><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData"
      /></el-col>
    </el-row>
    <input ref="fileInput" type="file" accept=".xlsx,.xls" hidden @change="handleImport" />

    <StandardTable
      table-key="exchange-rate-alert-rule"
      v-loading="loading"
      :data="rows"
      row-key="id"
      size="small"
    >
      <el-table-column
        prop="ruleCode"
        :label="t('exchange.alertRule.ruleCode')"
        min-width="180"
        :show-overflow-tooltip="true"
      />
      <el-table-column
        prop="ruleName"
        :label="t('exchange.alertRule.ruleName')"
        min-width="180"
        :show-overflow-tooltip="true"
      />
      <el-table-column :label="t('exchange.fields.rateType')" min-width="120" align="center"
        ><template #default="{ row }">{{ rateTypeText(row.rateType) }}</template></el-table-column
      >
      <el-table-column :label="t('exchange.fields.currencyPair')" min-width="150" align="center"
        ><template #default="{ row }"
          ><span v-if="row.baseCurrency === 'ALL'" class="scope-all">{{
            t('exchange.placeholders.allCurrenciesShort')
          }}</span
          ><CurrencyPairDisplay
            v-else
            :base-currency="row.baseCurrency"
            :quote-currency="row.quoteCurrency"
            :locale="String(locale)" /></template
      ></el-table-column>
      <el-table-column :label="t('exchange.alertRule.thresholds')" min-width="145" align="center"
        ><template #default="{ row }"
          ><span class="numeric-value"
            >&gt; {{ row.triggerThreshold }}% / &lt; {{ row.recoveryThreshold }}%</span
          ></template
        ></el-table-column
      >
      <el-table-column :label="t('exchange.alertRule.window')" min-width="105" align="right"
        ><template #default="{ row }">{{
          windowText(row.windowMinutes)
        }}</template></el-table-column
      >
      <el-table-column :label="t('exchange.alertRule.alertLevel')" min-width="100" align="center"
        ><template #default="{ row }"
          ><el-tag :type="levelTagType(row.alertLevel)" size="small" effect="plain">{{
            levelText(row.alertLevel)
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column :label="t('exchange.alertRule.ruleKind')" min-width="105" align="center"
        ><template #default="{ row }"
          ><el-tag :type="row.systemMandatory ? 'danger' : 'info'" size="small" effect="plain">{{
            row.systemMandatory
              ? t('exchange.alertRule.systemRule')
              : t('exchange.alertRule.customRule')
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column :label="t('common.status')" min-width="90" align="center"
        ><template #default="{ row }"
          ><el-tag :type="row.ruleStatus ? 'success' : 'info'" size="small">{{
            row.ruleStatus ? t('status.enabled') : t('status.disabled')
          }}</el-tag></template
        ></el-table-column
      >
      <el-table-column :label="t('common.updateTime')" min-width="170" align="center"
        ><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template
      ></el-table-column>
      <el-table-column :label="t('common.operation')" min-width="270" align="center" fixed="right">
        <template #default="{ row }">
          <el-button
            type="primary"
            link
            :icon="View"
            v-hasPermi="'exchange:alert-rule:query'"
            @click="openDetail(row)"
            >{{ t('common.detail') }}</el-button
          >
          <el-button
            type="primary"
            link
            :icon="Edit"
            v-hasPermi="'exchange:alert-rule:edit'"
            @click="openEdit(row)"
            >{{ t('common.edit') }}</el-button
          >
          <el-button
            v-if="row.ruleStatus"
            type="warning"
            link
            :icon="VideoPause"
            :disabled="Boolean(row.systemMandatory)"
            v-hasPermi="'exchange:alert-rule:stop'"
            @click="changeStatus(row, false)"
            >{{ t('common.disable') }}</el-button
          >
          <el-button
            v-else
            type="success"
            link
            :icon="VideoPlay"
            v-hasPermi="'exchange:alert-rule:start'"
            @click="changeStatus(row, true)"
            >{{ t('common.enable') }}</el-button
          >
          <el-button
            type="danger"
            link
            :icon="Delete"
            :disabled="Boolean(row.systemMandatory)"
            v-hasPermi="'exchange:alert-rule:remove'"
            @click="removeRule(row)"
            >{{ t('common.delete') }}</el-button
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
      :title="t('exchange.alertRule.detailTitle')"
      size="lg"
      :loading="detailLoading"
    >
      <el-descriptions v-if="detail" :column="2" border size="small">
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
        <el-descriptions-item :label="t('exchange.alertRule.window')">{{
          windowText(detail.windowMinutes)
        }}</el-descriptions-item
        ><el-descriptions-item :label="t('exchange.alertRule.minimumSamples')">{{
          detail.minimumSampleCount
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('exchange.alertRule.recoveryCount')">{{
          detail.recoveryConsecutiveCount
        }}</el-descriptions-item
        ><el-descriptions-item :label="t('exchange.alertRule.alertLevel')">{{
          levelText(detail.alertLevel)
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('exchange.alertRule.ruleKind')">{{
          detail.systemMandatory
            ? t('exchange.alertRule.systemRule')
            : t('exchange.alertRule.customRule')
        }}</el-descriptions-item
        ><el-descriptions-item :label="t('common.status')">{{
          detail.ruleStatus ? t('status.enabled') : t('status.disabled')
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.remark')" :span="2">{{
          detail.remark || '-'
        }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.createTime')"
          ><BaseDateTime :value="detail.createTime" /></el-descriptions-item
        ><el-descriptions-item :label="t('common.updateTime')"
          ><BaseDateTime :value="detail.updateTime"
        /></el-descriptions-item>
      </el-descriptions>
    </CommonDetailDrawer>

    <el-dialog
      v-model="formVisible"
      :title="
        formMode === 'create' ? t('exchange.alertRule.addTitle') : t('exchange.alertRule.editTitle')
      "
      width="680px"
      destroy-on-close
    >
      <el-alert
        v-if="editingMandatory"
        :title="t('exchange.alertRule.mandatoryHint')"
        type="warning"
        :closable="false"
        show-icon
        class="form-alert"
      />
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="142px">
        <el-form-item :label="t('exchange.alertRule.ruleName')" prop="ruleName"
          ><el-input v-model.trim="form.ruleName" maxlength="128" show-word-limit
        /></el-form-item>
        <el-form-item :label="t('exchange.fields.rateType')" prop="rateType"
          ><el-select v-model="form.rateType" :disabled="editingMandatory" style="width: 100%"
            ><el-option
              v-for="item in rateTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value" /></el-select
        ></el-form-item>
        <el-row :gutter="12"
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.fields.baseCurrency')" prop="baseCurrency"
              ><CurrencySelect
                v-model="form.baseCurrency"
                allow-all
                width="100%"
                :disabled="editingMandatory" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.fields.quoteCurrency')" prop="quoteCurrency"
              ><CurrencySelect
                v-model="form.quoteCurrency"
                allow-all
                width="100%"
                :disabled="editingMandatory" /></el-form-item></el-col
        ></el-row>
        <el-row :gutter="12"
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.alertRule.windowMinutes')" prop="windowMinutes"
              ><el-input-number
                v-model="form.windowMinutes"
                :min="5"
                :max="129600"
                controls-position="right"
                style="width: 100%" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.alertRule.minimumSamples')" prop="minimumSampleCount"
              ><el-input-number
                v-model="form.minimumSampleCount"
                :min="2"
                :max="10000"
                controls-position="right"
                style="width: 100%" /></el-form-item></el-col
        ></el-row>
        <el-row :gutter="12"
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.alertRule.triggerThreshold')" prop="triggerThreshold"
              ><RateNumberInput
                v-model="form.triggerThreshold"
                append-text="%" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item
              :label="t('exchange.alertRule.recoveryThreshold')"
              prop="recoveryThreshold"
              ><RateNumberInput
                v-model="form.recoveryThreshold"
                append-text="%" /></el-form-item></el-col
        ></el-row>
        <el-row :gutter="12"
          ><el-col :span="12"
            ><el-form-item
              :label="t('exchange.alertRule.recoveryCount')"
              prop="recoveryConsecutiveCount"
              ><el-input-number
                v-model="form.recoveryConsecutiveCount"
                :min="1"
                :max="20"
                controls-position="right"
                style="width: 100%" /></el-form-item></el-col
          ><el-col :span="12"
            ><el-form-item :label="t('exchange.alertRule.alertLevel')" prop="alertLevel"
              ><el-select v-model="form.alertLevel" style="width: 100%"
                ><el-option
                  v-for="item in levelOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value" /></el-select></el-form-item></el-col
        ></el-row>
        <el-form-item :label="t('common.remark')"
          ><el-input
            v-model.trim="form.remark"
            type="textarea"
            :rows="3"
            maxlength="512"
            show-word-limit
        /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" :loading="submitting" @click="submitForm">{{
            t('common.save')
          }}</el-button>
          <el-button @click="formVisible = false">{{ t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="importResultVisible"
      :title="t('exchange.alertRule.importResult')"
      width="620px"
    >
      <el-alert
        :title="
          t('exchange.alertRule.importSummary', {
            total: importResult?.totalCount || 0,
            success: importResult?.successCount || 0,
            failure: importResult?.failureCount || 0,
          })
        "
        :type="importResult?.failureCount ? 'error' : 'success'"
        :closable="false"
        show-icon
      />
      <StandardTable
        v-if="importResult?.errors.length"
        table-key="exchange-alert-rule-import-errors"
        :data="importResult.errors"
        size="small"
        class="import-errors"
        ><el-table-column
          prop="rowNumber"
          :label="t('exchange.alertRule.rowNumber')"
          width="100"
          align="center" /><el-table-column
          prop="message"
          :label="t('exchange.alertRule.errorMessage')"
          min-width="360"
      /></StandardTable>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="importResultVisible = false">{{ t('common.close') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, reactive, ref } from 'vue';
  import type { FormInstance, FormRules } from 'element-plus';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import {
    Delete,
    Download,
    Edit,
    Plus,
    Refresh,
    Search,
    Upload,
    VideoPause,
    VideoPlay,
    View,
  } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import {
    createExchangeRateAlertRule,
    deleteExchangeRateAlertRule,
    exportExchangeRateAlertRules,
    getExchangeRateAlertRule,
    importExchangeRateAlertRules,
    searchExchangeRateAlertRules,
    updateExchangeRateAlertRule,
    updateExchangeRateAlertRuleStatus,
    type ExchangeRateAlertRule,
    type ExchangeRateAlertRuleImportResult,
    type ExchangeRateAlertRuleSaveRequest,
  } from '@/api/exchange';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import CurrencyPairDisplay from '../CurrencyPairDisplay.vue';
  import CurrencySelect from '../CurrencySelect.vue';
  import RateNumberInput from '../RateNumberInput.vue';

  const { locale, t } = useI18n();
  const showSearch = ref(true),
    loading = ref(false),
    detailVisible = ref(false),
    detailLoading = ref(false);
  const formVisible = ref(false),
    submitting = ref(false),
    importResultVisible = ref(false);
  const rows = ref<ExchangeRateAlertRule[]>([]),
    detail = ref<ExchangeRateAlertRule | null>(null);
  const total = ref(0),
    page = ref(1),
    pageSize = ref(10),
    editingId = ref<number>();
  const formMode = ref<'create' | 'edit'>('create');
  const editingMandatory = ref(false);
  const formRef = ref<FormInstance>(),
    fileInput = ref<HTMLInputElement>(),
    importResult = ref<ExchangeRateAlertRuleImportResult | null>(null);
  const query = reactive({
    keyword: '',
    rateType: '',
    ruleStatus: undefined as number | undefined,
    systemMandatory: undefined as number | undefined,
  });
  const form = reactive<ExchangeRateAlertRuleSaveRequest>({
    ruleName: '',
    rateType: 'TRANSACTION_RATE',
    baseCurrency: 'ALL',
    quoteCurrency: 'ALL',
    windowMinutes: 4320,
    triggerThreshold: '3',
    recoveryThreshold: '2',
    recoveryConsecutiveCount: 2,
    minimumSampleCount: 2,
    alertLevel: 'WARNING',
    remark: '',
  });
  const rateTypeOptions = computed(() =>
    ['TRANSACTION_RATE', 'SETTLEMENT_RATE'].map((value) => ({
      value,
      label: t(`exchange.enums.rateType.${value}`),
    })),
  );
  const levelOptions = computed(() =>
    ['WARNING', 'ERROR', 'CRITICAL'].map((value) => ({
      value,
      label: t(`exchange.alertRule.level.${value}`),
    })),
  );
  const formRules = computed<FormRules>(() => ({
    ruleName: [
      { required: true, message: t('exchange.alertRule.validation.ruleName'), trigger: 'blur' },
    ],
    rateType: [
      { required: true, message: t('exchange.alertRule.validation.rateType'), trigger: 'change' },
    ],
    baseCurrency: [
      { required: true, message: t('exchange.alertRule.validation.currency'), trigger: 'change' },
    ],
    quoteCurrency: [
      { required: true, message: t('exchange.alertRule.validation.currency'), trigger: 'change' },
    ],
    triggerThreshold: [
      { required: true, message: t('exchange.alertRule.validation.trigger'), trigger: 'blur' },
    ],
    recoveryThreshold: [
      { required: true, message: t('exchange.alertRule.validation.recovery'), trigger: 'blur' },
    ],
  }));

  onMounted(loadData);

  async function loadData() {
    loading.value = true;
    try {
      const result = await searchExchangeRateAlertRules({
        pageNo: page.value,
        pageSize: pageSize.value,
        ...query,
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
      keyword: '',
      rateType: '',
      ruleStatus: undefined,
      systemMandatory: undefined,
    });
    handleSearch();
  }
  function resetForm() {
    Object.assign(form, {
      ruleName: '',
      rateType: 'TRANSACTION_RATE',
      baseCurrency: 'ALL',
      quoteCurrency: 'ALL',
      windowMinutes: 4320,
      triggerThreshold: '3',
      recoveryThreshold: '2',
      recoveryConsecutiveCount: 2,
      minimumSampleCount: 2,
      alertLevel: 'WARNING',
      remark: '',
    });
  }
  function openCreate() {
    formMode.value = 'create';
    editingId.value = undefined;
    editingMandatory.value = false;
    resetForm();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  }
  async function openEdit(row: ExchangeRateAlertRule) {
    const current = await getExchangeRateAlertRule(row.id);
    formMode.value = 'edit';
    editingId.value = row.id;
    editingMandatory.value = Boolean(current.systemMandatory);
    Object.assign(form, {
      ruleName: current.ruleName,
      rateType: current.rateType,
      baseCurrency: current.baseCurrency,
      quoteCurrency: current.quoteCurrency,
      windowMinutes: current.windowMinutes,
      triggerThreshold: current.triggerThreshold,
      recoveryThreshold: current.recoveryThreshold,
      recoveryConsecutiveCount: current.recoveryConsecutiveCount,
      minimumSampleCount: current.minimumSampleCount,
      alertLevel: current.alertLevel,
      remark: current.remark || '',
    });
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
  }
  async function openDetail(row: ExchangeRateAlertRule) {
    detailVisible.value = true;
    detailLoading.value = true;
    try {
      detail.value = await getExchangeRateAlertRule(row.id);
    } finally {
      detailLoading.value = false;
    }
  }
  async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (form.baseCurrency === form.quoteCurrency && form.baseCurrency !== 'ALL') {
      ElMessage.warning(t('exchange.alertRule.validation.pairDifferent'));
      return;
    }
    if (Number(form.recoveryThreshold) >= Number(form.triggerThreshold)) {
      ElMessage.warning(t('exchange.alertRule.validation.recoveryLower'));
      return;
    }
    submitting.value = true;
    try {
      if (formMode.value === 'edit' && editingId.value)
        await updateExchangeRateAlertRule(editingId.value, { ...form });
      else await createExchangeRateAlertRule({ ...form });
      ElMessage.success(t('common.saveSuccess'));
      formVisible.value = false;
      await loadData();
    } finally {
      submitting.value = false;
    }
  }
  async function changeStatus(row: ExchangeRateAlertRule, enabled: boolean) {
    await ElMessageBox.confirm(
      t('common.statusToggleConfirm', {
        action: enabled ? t('common.enable') : t('common.disable'),
        name: row.ruleName,
      }),
      t('common.operationConfirm'),
      { type: 'warning' },
    );
    await updateExchangeRateAlertRuleStatus(row.id, enabled);
    ElMessage.success(t('common.success'));
    await loadData();
  }
  async function removeRule(row: ExchangeRateAlertRule) {
    await ElMessageBox.confirm(
      t('exchange.alertRule.deleteConfirm', { name: row.ruleName }),
      t('common.operationConfirm'),
      { type: 'warning' },
    );
    await deleteExchangeRateAlertRule(row.id);
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
  }
  async function handleExport() {
    await exportExchangeRateAlertRules({ pageNo: page.value, pageSize: pageSize.value, ...query });
  }
  async function handleImport(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    importResult.value = await importExchangeRateAlertRules(file);
    importResultVisible.value = true;
    if (!importResult.value.failureCount) await loadData();
  }
  function rateTypeText(value?: string) {
    return value ? t(`exchange.enums.rateType.${value}`, value) : '-';
  }
  function levelText(value: string) {
    return t(`exchange.alertRule.level.${value}`);
  }
  function levelTagType(value: string): 'warning' | 'danger' {
    return value === 'WARNING' ? 'warning' : 'danger';
  }
  function windowText(value: number) {
    if (value % 1440 === 0) return t('exchange.alertRule.days', { value: value / 1440 });
    if (value % 60 === 0) return t('exchange.alertRule.hours', { value: value / 60 });
    return t('exchange.alertRule.minutes', { value });
  }
</script>

<style scoped>
  .numeric-value,
  .scope-all {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
  .form-alert {
    margin-bottom: 18px;
  }
  .import-errors {
    margin-top: 16px;
  }
  @media (max-width: 720px) {
    :deep(.el-dialog) {
      width: calc(100% - 24px) !important;
    }
  }
</style>
