<template>
    <div class="app-container exchange-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="$t('exchange.fields.rateType')">
                <el-select v-model="query.rateType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.sourceCode')"><ExchangeSourceSelect v-model="query.sourceCode" allow-all @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.baseCurrency')"><CurrencySelect v-model="query.baseCurrency" allow-all @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.quoteCurrency')"><CurrencySelect v-model="query.quoteCurrency" allow-all @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.ruleStatus" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option :label="$t('common.enable')" :value="1" />
                    <el-option :label="$t('common.disable')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'exchange:rule:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'exchange:rule:edit'">{{ $t('common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'exchange:rule:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="exchange-rule" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column :label="$t('exchange.fields.rateType')" min-width="120" align="center"><template #default="{ row }">{{ optionLabel(rateTypeOptions, row.rateType) }}</template></el-table-column>
            <el-table-column prop="sourceCode" :label="$t('exchange.fields.source')" width="90" align="center" />
            <el-table-column :label="$t('exchange.fields.currencyPair')" width="150" align="center"><template #default="{ row }">{{ formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.rateField')" min-width="130" align="center"><template #default="{ row }">{{ optionLabel(rateFieldOptions, row.rateField) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.adjust')" min-width="160" align="center">
                <template #default="{ row }">{{ optionLabel(adjustDirectionOptions, row.adjustDirection) }} {{ row.adjustValue }} {{ optionLabel(adjustMethodOptions, row.adjustMethod) }}</template>
            </el-table-column>
            <el-table-column prop="decimalScale" :label="$t('exchange.fields.decimalScale')" width="90" align="center" />
            <el-table-column prop="priority" :label="$t('exchange.fields.priority')" width="90" align="center" />
            <el-table-column :label="$t('exchange.fields.effectiveStartTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveStartTime" /></template></el-table-column>
            <el-table-column :label="$t('common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.ruleStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'exchange:rule:status'" /></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="170" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:rule:detail'">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'exchange:rule:edit'">{{ $t('common.edit') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('exchange.rule.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="$t('exchange.fields.rateType')">{{ optionLabel(rateTypeOptions, detailRow.rateType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.sourceCode')">{{ detailRow.sourceCode }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.currencyPair')">{{ formatCurrencyPair(translate, detailRow.baseCurrency, detailRow.quoteCurrency) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.rateField')">{{ optionLabel(rateFieldOptions, detailRow.rateField) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.adjustDirection')">{{ optionLabel(adjustDirectionOptions, detailRow.adjustDirection) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.adjustMethod')">{{ optionLabel(adjustMethodOptions, detailRow.adjustMethod) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.adjustValue')">{{ detailRow.adjustValue }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.decimalScale')">{{ detailRow.decimalScale }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.roundingMode')">{{ optionLabel(roundingModeOptions, detailRow.roundingMode) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.priority')">{{ detailRow.priority }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.effectiveStartTime')"><BaseDateTime :value="detailRow.effectiveStartTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.effectiveEndTime')"><BaseDateTime :value="detailRow.effectiveEndTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag size="small" :type="statusType(detailRow.ruleStatus)">{{ statusText(translate, detailRow.ruleStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="formMode === 'create' ? $t('exchange.rule.addTitle') : $t('exchange.rule.editTitle')" v-model="formVisible" width="760px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" size="small">
                <el-row :gutter="16">
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.rateType')" prop="rateType"><el-select v-model="form.rateType" style="width:100%" @change="handleRateTypeChange"><el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.sourceCode')" prop="sourceCode"><ExchangeSourceSelect v-model="form.sourceCode" width="100%" allow-all /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.baseCurrency')" prop="baseCurrency"><CurrencySelect v-model="form.baseCurrency" width="100%" allow-all /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.quoteCurrency')" prop="quoteCurrency"><CurrencySelect v-model="form.quoteCurrency" width="100%" allow-all /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.rateField')" prop="rateField"><el-select v-model="form.rateField" style="width:100%"><el-option v-for="item in rateFieldOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.adjustDirection')" prop="adjustDirection"><el-select v-model="form.adjustDirection" style="width:100%"><el-option v-for="item in formAdjustDirectionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.adjustMethod')" prop="adjustMethod"><el-select v-model="form.adjustMethod" style="width:100%"><el-option v-for="item in adjustMethodOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.adjustValue')" prop="adjustValue"><RateNumberInput v-model="form.adjustValue" :placeholder="$t('exchange.placeholders.adjustValue')" :append-text="adjustValueUnit" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.decimalScale')" prop="decimalScale"><el-input-number v-model="form.decimalScale" :min="8" :max="12" style="width:100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.roundingMode')" prop="roundingMode"><el-select v-model="form.roundingMode" style="width:100%"><el-option v-for="item in roundingModeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.priority')"><el-input-number v-model="form.priority" :min="1" :max="9999" style="width:100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('common.status')" prop="ruleStatus"><el-select v-model="form.ruleStatus" style="width:100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('exchange.fields.effectiveStartTime')"><el-date-picker v-model="form.effectiveStartTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.effectiveEndTime')"><el-date-picker v-model="form.effectiveEndTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import type { FormItemRule } from 'element-plus';
import { Download, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { createExchangeRule, exportExchangeRules, getExchangeRule, searchExchangeRules, updateExchangeRule, updateExchangeRuleStatus, type ExchangeRateRule } from '@/api/exchange';
import CurrencySelect from '../CurrencySelect.vue';
import ExchangeSourceSelect from '../ExchangeSourceSelect.vue';
import RateNumberInput from '../RateNumberInput.vue';
import {
    adjustDirectionOptions as buildAdjustDirectionOptions,
    adjustMethodOptions as buildAdjustMethodOptions,
    formatCurrencyPair,
    optionLabel,
    rateFieldOptions as buildRateFieldOptions,
    rateTypeOptions as buildRateTypeOptions,
    roundingModeOptions as buildRoundingModeOptions,
    statusText,
    statusType,
} from '../shared';

const { t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeRateRule[]>([]);
const selectedRows = ref<ExchangeRateRule[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ExchangeRateRule | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();

const query = reactive({
    rateType: '',
    sourceCode: '',
    baseCurrency: '',
    quoteCurrency: '',
    ruleStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    rateType: 'SETTLEMENT_RATE',
    sourceCode: 'BOC',
    baseCurrency: '',
    quoteCurrency: 'CNY',
    rateField: 'SPOT_BUY_RATE',
    adjustDirection: 'NONE',
    adjustMethod: 'BP',
    adjustValue: '0',
    decimalScale: 8,
    roundingMode: 'ROUND_HALF_UP',
    priority: 100,
    effectiveStartTime: '',
    effectiveEndTime: '',
    ruleStatus: 1,
    remark: '',
});

const form = reactive(emptyForm());
const rateTypeOptions = computed(() => buildRateTypeOptions(translate));
const rateFieldOptions = computed(() => buildRateFieldOptions(translate));
const adjustDirectionOptions = computed(() => buildAdjustDirectionOptions(translate));
const adjustMethodOptions = computed(() => buildAdjustMethodOptions(translate));
const roundingModeOptions = computed(() => buildRoundingModeOptions(translate));
const formAdjustDirectionOptions = computed(() => filterAdjustDirectionOptions(form.rateType, adjustDirectionOptions.value));
const adjustValueUnit = computed(() => (form.adjustMethod === 'PERCENT' ? '%' : 'BP'));
const rules = computed<FormRules>(() => ({
    rateType: [{ required: true, message: t('exchange.validation.rateTypeRequired'), trigger: 'change' }],
    sourceCode: [{ required: true, message: t('exchange.validation.sourceRequired'), trigger: 'change' }],
    baseCurrency: [{ required: true, message: t('exchange.validation.baseCurrencyRequired'), trigger: 'change' }],
    quoteCurrency: [{ required: true, message: t('exchange.validation.quoteCurrencyRequired'), trigger: 'change' }],
    rateField: [{ required: true, message: t('exchange.validation.rateFieldRequired'), trigger: 'change' }],
    adjustDirection: [
        { required: true, message: t('exchange.validation.adjustDirectionRequired'), trigger: 'change' },
        { validator: validateAdjustDirection, trigger: 'change' },
    ],
    adjustMethod: [{ required: true, message: t('exchange.validation.adjustMethodRequired'), trigger: 'change' }],
    adjustValue: [
        { required: true, message: t('exchange.validation.adjustValueRequired'), trigger: 'blur' },
        { pattern: /^\d+(\.\d+)?$/, message: t('exchange.validation.rateNumberInvalid'), trigger: 'blur' },
    ],
    decimalScale: [{ required: true, message: t('exchange.validation.decimalScaleRequired'), trigger: 'change' }],
    roundingMode: [{ required: true, message: t('exchange.validation.roundingModeRequired'), trigger: 'change' }],
    ruleStatus: [{ required: true, message: t('exchange.validation.statusRequired'), trigger: 'change' }],
}));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await searchExchangeRules({ pageNo: page.value, pageSize: pageSize.value, ...query });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.rateType = '';
    query.sourceCode = '';
    query.baseCurrency = '';
    query.quoteCurrency = '';
    query.ruleStatus = undefined;
    handleSearch();
}

async function openDetail(row: ExchangeRateRule) {
    detailRow.value = await getExchangeRule(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: ExchangeRateRule) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {});
    normalizeAdjustDirectionForRateType();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleRateTypeChange() {
    normalizeAdjustDirectionForRateType();
    formRef.value?.validateField('adjustDirection').catch(() => undefined);
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (formMode.value === 'create') {
        await createExchangeRule(toRulePayload());
    } else {
        await updateExchangeRule(form.id, toRulePayload());
    }
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ExchangeRateRule) {
    const nextStatus = row.ruleStatus === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    const name = `${optionLabel(rateTypeOptions.value, row.rateType)} ${formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency)}`.trim();
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    await updateExchangeRuleStatus(row.id, nextStatus);
    ElMessage.success(t('common.success'));
    loadData();
}

async function handleExport() {
    await exportExchangeRules({ pageNo: page.value, pageSize: pageSize.value, ...query });
}

function toRulePayload() {
    return Object.fromEntries(Object.entries(form).filter(([key, value]) => key === 'id' || value !== ''));
}

function filterAdjustDirectionOptions(rateType: string, options: { label: string; value: string }[]) {
    if (rateType === 'TRANSACTION_RATE') {
        return options.filter((item) => ['UP', 'NONE'].includes(item.value));
    }
    if (rateType === 'SETTLEMENT_RATE') {
        return options.filter((item) => ['DOWN', 'NONE'].includes(item.value));
    }
    return options;
}

function normalizeAdjustDirectionForRateType() {
    const availableValues = formAdjustDirectionOptions.value.map((item) => item.value);
    if (!availableValues.includes(form.adjustDirection)) {
        form.adjustDirection = 'NONE';
    }
}

function validateAdjustDirection(_rule: FormItemRule, value: string, callback: (error?: Error) => void) {
    const availableValues = formAdjustDirectionOptions.value.map((item) => item.value);
    if (!availableValues.includes(value)) {
        callback(new Error(t('exchange.validation.adjustDirectionRateTypeInvalid')));
        return;
    }
    callback();
}
</script>
