<template>
  <div class="app-container risk-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="76px">
      <el-form-item :label="$t('risk.common.ruleName')"><el-input v-model.trim="query.ruleName" clearable @keyup.enter="handleSearch" /></el-form-item>
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
          @visible-change="handleQueryMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="profile.showMatchValue || profile.showCountry" :label="profile.matchLabel">
        <el-input v-if="!profile.showCountry" v-model.trim="query.matchValue" :placeholder="profile.matchPlaceholder" clearable @keyup.enter="handleSearch" />
        <el-select v-else v-model="query.matchValue" filterable clearable :placeholder="$t('common.pleaseSelect')">
          <el-option v-for="item in options.countryOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="profile.showCurrency" :label="$t('risk.common.currency')"><el-select v-model="query.currency" filterable clearable><el-option v-for="item in options.currencyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item :label="$t('common.status')"><el-select v-model="query.status" clearable><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="`${current.permissionPrefix}:add`">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="selectedRows.length === 0" @click="handleBatchDelete" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('risk.common.batchDelete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Download" size="small" @click="handleTemplate" v-hasPermi="`${current.permissionPrefix}:template`">{{ $t('risk.common.template') }}</el-button></el-col>
      <el-col :span="1.5"><el-upload :show-file-list="false" accept=".csv" :auto-upload="false" :on-change="handleImport" v-hasPermi="`${current.permissionPrefix}:import`"><el-button type="info" plain :icon="Upload" size="small">{{ $t('common.import') }}</el-button></el-upload></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="`${current.permissionPrefix}:export`">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="ruleName" :label="$t('risk.common.ruleName')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column prop="merchantScope" :label="$t('risk.common.scope')" width="110" align="center">
        <template #default="{ row }">{{ scopeText(row.merchantScope) }}</template>
      </el-table-column>
      <el-table-column prop="merchantId" :label="$t('risk.common.merchantId')" width="130" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.showMatchMode" prop="matchMode" :label="$t('risk.rule.matchMode')" width="110" align="center" />
      <el-table-column v-if="profile.showMatchValue" prop="matchValue" :label="profile.matchLabel" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.showCardBrand" prop="cardBrand" :label="$t('risk.common.cardBrand')" width="124" align="center">
        <template #default="{ row }">
          <span class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(row.cardBrand)" :logo-key="cardBrandLogo(row.cardBrand)" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(row.cardBrand) || '-' }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="profile.showCountry" prop="matchValue" :label="profile.matchLabel" min-width="130" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.showLimitType" prop="limitType" :label="$t('risk.rule.limitType')" width="130" align="center" />
      <el-table-column v-if="profile.showAmount" prop="amountMin" :label="$t('risk.rule.amountMin')" width="120" align="center" />
      <el-table-column v-if="profile.showAmount" prop="amountMax" :label="$t('risk.rule.amountMax')" width="120" align="center" />
      <el-table-column v-if="profile.showCurrency" prop="currency" :label="$t('risk.common.currency')" width="100" align="center" />
      <el-table-column v-if="profile.showFrequency" prop="timeWindowSeconds" :label="$t('risk.rule.window')" width="110" align="center" />
      <el-table-column v-if="profile.showFrequency" prop="thresholdCount" :label="$t('risk.rule.threshold')" width="100" align="center" />
      <el-table-column prop="riskLevel" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(row.riskLevel)">{{ riskLevelText(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decisionAction" :label="$t('risk.common.decisionAction')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(row.decisionAction)">{{ decisionActionText(row.decisionAction) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="92" align="center"><template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" :disabled="isStatusUpdating(row.id)" @change="(status: number) => handleStatus(row, status)" v-hasPermi="`${current.permissionPrefix}:status`" /></template></el-table-column>
      <el-table-column :label="$t('common.updateTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" width="190" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="`${current.permissionPrefix}:detail`">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formTitle" v-model="formOpen" width="820px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="122px">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('risk.common.scope')" prop="merchantScope"><el-select v-model="form.merchantScope" style="width:100%" @change="handleFormScopeChange"><el-option v-for="item in merchantScopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item :label="$t('risk.common.merchantId')" prop="merchantId">
              <el-select
                v-model="form.merchantId"
                filterable
                remote
                clearable
                reserve-keyword
                remote-show-suffix
                :disabled="form.merchantScope === 'GLOBAL'"
                :remote-method="searchMerchantOptions"
                :loading="merchantLoading"
                :placeholder="t('risk.common.placeholderMerchant')"
                :no-data-text="t('risk.common.noMerchantData')"
                :loading-text="t('risk.common.loadingMerchant')"
                style="width:100%"
                @change="handleMerchantChange"
                @visible-change="handleMerchantVisibleChange"
              >
                <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item :label="$t('risk.common.ruleName')" prop="ruleName"><el-input v-model.trim="form.ruleName" maxlength="128" /></el-form-item>
        <el-row :gutter="16">
          <el-col v-if="profile.showMatchMode" :span="12"><el-form-item :label="$t('risk.rule.matchMode')"><el-select v-model="form.matchMode" clearable style="width:100%"><el-option label="EXACT" value="EXACT" /><el-option label="DOMAIN" value="DOMAIN" /><el-option label="CONTAINS" value="CONTAINS" /><el-option label="REGEX" value="REGEX" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showMatchValue" :span="profile.showCardBrand ? 16 : 12">
            <el-form-item :label="profile.matchLabel" prop="matchValue">
              <el-input v-model.trim="form.matchValue" :placeholder="profile.matchPlaceholder" @input="handleMatchValueInput" />
            </el-form-item>
          </el-col>
          <el-col v-if="profile.showCardBrand" :span="8">
            <el-form-item :label="$t('risk.common.cardBrand')">
              <span class="card-brand-preview is-rule" :class="{ 'is-pending': !form.cardBrand }">
                <PaymentLogoMark v-if="formCardBrandLogo" :logo-key="formCardBrandLogo" size="sm" compact fallback="text" />
                <span v-else>{{ formCardBrandText }}</span>
              </span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col v-if="profile.showLimitType" :span="8"><el-form-item :label="$t('risk.rule.limitType')"><el-select v-model="form.limitType" filterable clearable style="width:100%"><el-option v-for="item in options.limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showAmount" :span="8"><el-form-item :label="$t('risk.rule.amountMin')" prop="amountMin"><el-input-number v-model="form.amountMin" :min="0" :precision="6" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col v-if="profile.showAmount" :span="8"><el-form-item :label="$t('risk.rule.amountMax')" prop="amountMax"><el-input-number v-model="form.amountMax" :min="0" :precision="6" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col v-if="profile.showCurrency" :span="8"><el-form-item :label="$t('risk.common.currency')"><el-select v-model="form.currency" filterable clearable style="width:100%"><el-option v-for="item in options.currencyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showCountry" :span="8"><el-form-item :label="profile.matchLabel" prop="matchValue"><el-select v-model="form.matchValue" filterable clearable style="width:100%"><el-option v-for="item in options.countryOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showFrequency" :span="8"><el-form-item :label="$t('risk.rule.window')" prop="timeWindowSeconds"><el-input-number v-model="form.timeWindowSeconds" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col v-if="profile.showFrequency" :span="8"><el-form-item :label="$t('risk.rule.threshold')" prop="thresholdCount"><el-input-number v-model="form.thresholdCount" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item v-if="profile.showElements" :label="$t('risk.rule.elementsJson')" prop="elementsJson"><el-input v-model.trim="form.elementsJson" type="textarea" :rows="3" placeholder='{"elements":["cardFingerprint","ip"]}' /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('risk.common.riskLevel')"><el-select v-model="form.riskLevel" style="width:100%"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('risk.common.decisionAction')"><el-select v-model="form.decisionAction" style="width:100%"><el-option v-for="item in decisionActionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('common.status')"><el-select v-model="form.status" style="width:100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item>
        <el-form-item :label="$t('common.remark')"><el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button><el-button @click="formOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <el-dialog :title="$t('common.detail')" v-model="detailOpen" width="760px" append-to-body>
      <el-descriptions v-if="detailRow" :column="1" border size="small">
        <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
          <span v-if="item.cardBrand" class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(String(item.value || ''))" :logo-key="cardBrandLogo(String(item.value || ''))" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(String(item.value || '')) || '-' }}</span>
          </span>
          <el-tag v-else-if="item.riskLevel" size="small" :type="riskLevelTagType(String(item.value || ''))">{{ riskLevelText(item.value) }}</el-tag>
          <el-tag v-else-if="item.decisionAction" size="small" :type="decisionActionTagType(String(item.value || ''))">{{ decisionActionText(item.value) }}</el-tag>
          <span v-else>{{ item.value || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Download, Edit, Plus, Refresh, Search, Upload, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { UploadFile } from 'element-plus';
import { PaymentLogoMark } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { batchRemoveRiskRecords, createRiskRule, downloadRiskTemplate, exportRiskConfig, getRiskOptions, importRiskConfig, pageRiskRules, removeRiskRecord, updateRiskRule, updateRiskStatus, type RiskOptions, type RiskRecord, type RiskRuleQuery } from '@/api/risk';
import { cardBrandLabel, cardBrandLogoKeyByValue, detectCardBrand, emptyRiskOptions, localizeRiskOptions, resolveRiskFunction, resolveRiskRuleProfile, riskOptionLabel } from '@/views/risk/shared';

const route = useRoute();
const { t } = useI18n();
const current = computed(() => resolveRiskFunction(route.path, true));
const profile = computed(() => resolveRiskRuleProfile(current.value));
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<RiskRecord[]>([]);
const selectedRows = ref<RiskRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const options = ref<RiskOptions>(emptyRiskOptions());
const formOpen = ref(false);
const detailOpen = ref(false);
const detailRow = ref<RiskRecord | null>(null);
const formRef = ref<FormInstance>();
const formMode = ref<'add' | 'edit'>('add');
const editingId = ref<number>();
const statusUpdatingIds = ref<Set<number>>(new Set());
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const query = reactive<RiskRuleQuery>({});
const form = reactive<RiskRecord>({ status: 1, merchantScope: 'GLOBAL', riskLevel: 'MEDIUM', decisionAction: 'REVIEW', elementsJson: '{}' } as RiskRecord);
const merchantScopeOptions = computed(() => localizeRiskOptions(options.value.merchantScopeOptions, t, 'merchantScope'));
const statusOptions = computed(() => localizeRiskOptions(options.value.statusOptions, t, 'status'));
const riskLevelOptions = computed(() => localizeRiskOptions(options.value.riskLevelOptions, t, 'riskLevel'));
const decisionActionOptions = computed(() => localizeRiskOptions(options.value.decisionActionOptions, t, 'decisionAction'));
const rules = computed<FormRules>(() => ({
  merchantScope: [{ required: true, message: t('risk.validation.scopeRequired'), trigger: 'change' }],
  merchantId: [{ validator: validateMerchant, trigger: 'change' }],
  ruleName: [{ required: true, message: t('risk.validation.ruleNameRequired'), trigger: 'blur' }],
  matchValue: [{ required: profile.value.showMatchValue || profile.value.showCountry, message: t('risk.validation.matchValueRequired', { label: profile.value.matchLabel }), trigger: 'blur' }],
  amountMin: [{ validator: validateAmountRange, trigger: 'change' }],
  amountMax: [{ validator: validateAmountRange, trigger: 'change' }],
  timeWindowSeconds: [{ validator: validatePositiveFrequency, trigger: 'change' }],
  thresholdCount: [{ validator: validatePositiveFrequency, trigger: 'change' }],
  elementsJson: [{ validator: validateElementsJson, trigger: 'blur' }],
}));
const formTitle = computed(() => `${formMode.value === 'add' ? t('common.add') : t('common.edit')} - ${current.value.functionName}`);
const formCardBrandLogo = computed(() => cardBrandLogo(form.cardBrand));
const formCardBrandText = computed(() => form.cardBrand ? cardBrandDisplay(form.cardBrand) : t('risk.common.cardBrandAutoPending'));
const detailItems = computed(() => {
  const row = (detailRow.value || {}) as Partial<RiskRecord>;
  return [
    { label: t('risk.common.ruleName'), value: row.ruleName },
    { label: t('risk.rule.matchMode'), value: row.matchMode },
    { label: profile.value.matchLabel, value: row.matchValue },
    ...(profile.value.showCardBrand ? [{ label: t('risk.common.cardBrand'), value: row.cardBrand, cardBrand: true }] : []),
    ...(profile.value.showLimitType ? [{ label: t('risk.rule.limitType'), value: row.limitType }] : []),
    { label: t('risk.rule.amountMin'), value: row.amountMin },
    { label: t('risk.rule.amountMax'), value: row.amountMax },
    ...(profile.value.showCurrency ? [{ label: t('risk.common.currency'), value: row.currency }] : []),
    { label: t('risk.rule.elementsJson'), value: row.elementsJson },
    { label: t('risk.common.riskLevel'), value: row.riskLevel, riskLevel: true },
    { label: t('risk.common.decisionAction'), value: row.decisionAction, decisionAction: true },
  ];
});

onMounted(async () => { options.value = await getRiskOptions(); await loadData(); });
watch(() => route.path, () => handleReset());

async function loadData() {
  loading.value = true;
  try {
    const result = await pageRiskRules(current.value.functionCode, { ...query, pageNo: page.value, pageSize: pageSize.value });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}
function handleSearch() { page.value = 1; loadData(); }
function handleReset() { Object.assign(query, { merchantId: undefined, ruleName: undefined, matchValue: undefined, currency: undefined, status: undefined }); handleSearch(); }
function resetForm(row?: RiskRecord) {
  Object.keys(form).forEach((key) => delete (form as any)[key]);
  Object.assign(form, { status: 1, merchantScope: 'GLOBAL', riskLevel: 'MEDIUM', decisionAction: 'REVIEW', elementsJson: '{}', ...row });
  if (profile.value.showCardBrand) {
    form.cardBrand = detectCardBrand(form.matchValue, options.value.cardBrandOptions) || form.cardBrand;
  }
  syncCurrentMerchantOption();
}
function openForm(mode: 'add' | 'edit', row?: RiskRecord) { formMode.value = mode; editingId.value = row?.id; resetForm(row); formOpen.value = true; }
async function submitForm() {
  await formRef.value?.validate();
  try {
    const payload = buildRulePayload();
    editingId.value ? await updateRiskRule(current.value.functionCode, editingId.value, payload) : await createRiskRule(current.value.functionCode, payload);
    ElMessage.success(t('common.saveSuccess'));
    formOpen.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}
function openDetail(row: RiskRecord) { detailRow.value = row; detailOpen.value = true; }
async function handleDelete(row?: RiskRecord) { if (!row?.id) return; await ElMessageBox.confirm(t('risk.common.deleteConfirm', { name: row.ruleName || current.value.functionName }), t('common.operationConfirm'), { type: 'warning' }); await removeRiskRecord('RULE', current.value.functionCode, row.id); ElMessage.success(t('common.deleteSuccess')); await loadData(); }
async function handleBatchDelete() {
  const ids = selectedRows.value.map((item) => item.id).filter(Boolean);
  if (ids.length === 0) return;
  await ElMessageBox.confirm(t('risk.common.batchDeleteConfirm', { count: ids.length, name: current.value.functionName }), t('common.operationConfirm'), { type: 'warning' });
  await batchRemoveRiskRecords('RULE', current.value.functionCode, ids);
  ElMessage.success(t('common.deleteSuccess'));
  selectedRows.value = [];
  await loadData();
}
async function handleStatus(row: RiskRecord, status: number) {
  const action = status === 1 ? t('common.enable') : t('common.disable');
  const name = row.ruleName || current.value.functionName;
  try {
    await ElMessageBox.confirm(t('risk.common.statusToggleTargetConfirm', { action, name, targetType: t('risk.common.riskRule') }), t('common.operationConfirm'), { type: 'warning' });
  } catch {
    return;
  }
  setStatusUpdating(row.id, true);
  try {
    await updateRiskStatus('RULE', current.value.functionCode, row.id, status);
    row.status = status;
    ElMessage.success(t('risk.common.statusToggleSuccess', { action }));
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.statusToggleFailed', { action }));
  } finally {
    setStatusUpdating(row.id, false);
  }
}
function isStatusUpdating(id?: number) { return id ? statusUpdatingIds.value.has(id) : false; }
function setStatusUpdating(id: number | undefined, loading: boolean) {
  if (!id) return;
  const next = new Set(statusUpdatingIds.value);
  loading ? next.add(id) : next.delete(id);
  statusUpdatingIds.value = next;
}
async function handleExport() { await exportRiskConfig('RULE', current.value.functionCode); }
async function handleTemplate() { await downloadRiskTemplate('RULE', current.value.functionCode); }
async function handleImport(uploadFile: UploadFile) {
  if (!uploadFile.raw) return;
  try {
    const result = await importRiskConfig('RULE', current.value.functionCode, uploadFile.raw);
    ElMessage.success(t('risk.common.importSuccess', { count: result.successCount }));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.importFailed'));
  }
}

function buildRulePayload() {
  const payload = { ...form };
  if (payload.merchantScope === 'GLOBAL') {
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (profile.value.showCardBrand) {
    payload.cardBrand = detectCardBrand(payload.matchValue, options.value.cardBrandOptions);
  }
  return payload;
}

function handleFormScopeChange(value: string) {
  if (value === 'GLOBAL') {
    form.merchantId = undefined;
    form.merchantName = undefined;
  } else {
    loadMerchantOptions();
  }
  syncCurrentMerchantOption();
}

async function searchMerchantOptions(keyword: string) {
  const text = keyword.trim();
  await loadMerchantOptions(text);
}

async function loadMerchantOptions(keyword = '') {
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: keyword || undefined });
    merchantOptions.value = mergeMerchantOptions(result.records || []);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    merchantLoading.value = false;
  }
}

function handleMerchantVisibleChange(visible: boolean) {
  if (visible && form.merchantScope === 'MERCHANT' && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}

function handleQueryMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}

function handleMerchantChange(merchantId?: string) {
  const selected = merchantOptions.value.find((item) => item.merchantId === merchantId);
  form.merchantName = selected?.merchantName;
}

function syncCurrentMerchantOption() {
  if (!form.merchantId) {
    return;
  }
  const exists = merchantOptions.value.some((item) => item.merchantId === form.merchantId);
  if (!exists) {
    merchantOptions.value = [{ id: 0, merchantId: form.merchantId, merchantName: form.merchantName || '', merchantStatus: 1, merchantCategoryCode: '', countryCode: '', settlementCurrency: '', timezone: '', riskLevel: 1 }, ...merchantOptions.value];
  }
}

function mergeMerchantOptions(items: MerchantInfo[]) {
  const map = new Map<string, MerchantInfo>();
  merchantOptions.value.forEach((item) => map.set(item.merchantId, item));
  items.forEach((item) => map.set(item.merchantId, item));
  return Array.from(map.values()).slice(0, 30);
}

function merchantOptionLabel(item: MerchantInfo) {
  return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId;
}

function validateMerchant(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (form.merchantScope === 'MERCHANT' && !form.merchantId) {
    callback(new Error(t('risk.validation.merchantRequired')));
    return;
  }
  callback();
}

function validateAmountRange(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showAmount) {
    callback();
    return;
  }
  if (form.amountMin != null && form.amountMax != null && Number(form.amountMin) > Number(form.amountMax)) {
    callback(new Error(t('risk.validation.amountRangeInvalid')));
    return;
  }
  callback();
}

function validatePositiveFrequency(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showFrequency || value == null) {
    callback();
    return;
  }
  if (Number(value) <= 0) {
    callback(new Error(t('risk.validation.frequencyPositive')));
    return;
  }
  callback();
}

function validateElementsJson(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showElements || !value) {
    callback();
    return;
  }
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      callback(new Error(t('risk.validation.elementsJsonObject')));
      return;
    }
  } catch {
    callback(new Error(t('risk.validation.elementsJsonObject')));
    return;
  }
  callback();
}

function handleMatchValueInput(value: string) {
  if (!profile.value.showCardBrand) {
    return;
  }
  const normalized = value.replace(/[^\d,-]/g, '').slice(0, 23);
  if (normalized !== value) {
    form.matchValue = normalized;
  }
  form.cardBrand = detectCardBrand(normalized, options.value.cardBrandOptions);
}

function cardBrandLogo(value?: string) {
  return cardBrandLogoKeyByValue(options.value.cardBrandOptions, value);
}

function cardBrandDisplay(value?: string) {
  return cardBrandLabel(options.value.cardBrandOptions, value);
}

function optionLabel(optionList: Array<{ label: string; value: string | number }>, value?: string | number) {
  return optionList.find((item) => String(item.value) === String(value))?.label || value || '-';
}

function scopeText(value?: string) {
  return merchantScopeOptions.value.find((item) => item.value === value)?.label || riskOptionLabel(t, 'merchantScope', value);
}

function riskLevelText(value?: string | number) {
  return optionLabel(riskLevelOptions.value, value);
}

function decisionActionText(value?: string | number) {
  return optionLabel(decisionActionOptions.value, value);
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

<style scoped>
.card-brand-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  min-height: 24px;
}

.card-brand-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.card-brand-preview.is-pending {
  color: var(--el-text-color-placeholder);
}
</style>
