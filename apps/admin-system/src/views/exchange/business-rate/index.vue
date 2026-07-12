<template>
    <div class="app-container exchange-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="$t('exchange.fields.rateType')">
                <el-select v-model="query.rateType" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.sourceCode')"><ExchangeSourceSelect v-model="query.sourceCode" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.baseCurrency')"><CurrencySelect v-model="query.baseCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.quoteCurrency')"><CurrencySelect v-model="query.quoteCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.rateStatus" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in businessRateStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.generateMethod')">
                <el-select v-model="query.generateMethod" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in generateMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm" v-hasPermi="'exchange:business-rate:add'">{{ $t('common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Plus" size="small" @click="openBatch" v-hasPermi="'exchange:business-rate:batch'">{{ $t('exchange.businessRate.batchAdd') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'exchange:business-rate:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="exchange-business-rate" v-loading="loading" :data="rows" row-key="id" size="small">
            <el-table-column :label="$t('exchange.fields.rateType')" min-width="120" align="center"><template #default="{ row }">{{ optionLabel(rateTypeOptions, row.rateType) }}</template></el-table-column>
            <el-table-column prop="sourceCode" :label="$t('exchange.fields.source')" width="90" align="center" />
            <el-table-column :label="$t('exchange.fields.currencyPair')" width="150" align="center"><template #default="{ row }">{{ formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.originalRate')" width="120" align="right"><template #default="{ row }"><span class="rate-value">{{ formatRate(row.originalRate) }}</span></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.finalRate')" min-width="180" align="right"><template #default="{ row }"><strong class="final-rate-value">{{ formatRate(row.finalRate) }}</strong></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.effectiveTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" /></template></el-table-column>
            <el-table-column :label="$t('common.status')" width="95" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.rateStatus)">{{ optionLabel(businessRateStatusOptions, row.rateStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="$t('common.operation')" width="180" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:business-rate:detail'">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :disabled="row.rateStatus === 'EXPIRED'" @click="toggleStatus(row)" v-hasPermi="'exchange:business-rate:status'">{{ row.rateStatus === 'ENABLED' ? $t('common.disable') : $t('common.enable') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('exchange.businessRate.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="$t('exchange.fields.rateType')">{{ optionLabel(rateTypeOptions, detailRow.rateType) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.sourceCode')">{{ detailRow.sourceCode }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.currencyPair')">{{ formatCurrencyPair(translate, detailRow.baseCurrency, detailRow.quoteCurrency) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.generateMethod')">{{ optionLabel(generateMethodOptions, detailRow.generateMethod) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.originalRate')">{{ formatRate(detailRow.originalRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.finalRate')">{{ formatRate(detailRow.finalRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.rawRateId')">{{ detailRow.rawRateId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.ruleId')">{{ detailRow.ruleId || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.effectiveTime')"><BaseDateTime :value="detailRow.effectiveTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.expireTime')"><BaseDateTime :value="detailRow.expireTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag size="small" :type="statusType(detailRow.rateStatus)">{{ optionLabel(businessRateStatusOptions, detailRow.rateStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.adjustDescription')">{{ detailRow.adjustDescription || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="$t('exchange.businessRate.addTitle')" v-model="formVisible" width="760px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" size="small">
                <el-row :gutter="16">
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.rateType')" prop="rateType"><el-select v-model="form.rateType" style="width:100%"><el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.sourceCode')" prop="sourceCode"><ExchangeSourceSelect v-model="form.sourceCode" width="100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.baseCurrency')" prop="baseCurrency"><CurrencySelect v-model="form.baseCurrency" width="100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.quoteCurrency')" prop="quoteCurrency"><CurrencySelect v-model="form.quoteCurrency" width="100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.originalRate')" prop="originalRate"><RateNumberInput v-model="form.originalRate" placeholder="7.250000000000" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.finalRate')" prop="finalRate"><RateNumberInput v-model="form.finalRate" placeholder="7.260000000000" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.effectiveTime')" prop="effectiveTime"><el-date-picker v-model="form.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('common.status')" prop="rateStatus"><el-select v-model="form.rateStatus" style="width:100%"><el-option v-for="item in manualBusinessRateStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="$t('exchange.businessRate.batchAddTitle')" v-model="batchVisible" width="1080px" append-to-body destroy-on-close>
            <el-table :data="batchItems" row-key="rowKey" size="small" class="batch-rate-table">
                <el-table-column :label="$t('exchange.fields.rateType')" width="150">
                    <template #default="{ row }"><el-select v-model="row.rateType" style="width:100%"><el-option v-for="item in rateTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.sourceCode')" width="190">
                    <template #default="{ row }"><ExchangeSourceSelect v-model="row.sourceCode" width="100%" /></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.baseCurrency')" width="150">
                    <template #default="{ row }"><CurrencySelect v-model="row.baseCurrency" width="100%" /></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.quoteCurrency')" width="150">
                    <template #default="{ row }"><CurrencySelect v-model="row.quoteCurrency" width="100%" /></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.originalRate')" width="170">
                    <template #default="{ row }"><RateNumberInput v-model="row.originalRate" /></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.finalRate')" width="170">
                    <template #default="{ row }"><RateNumberInput v-model="row.finalRate" /></template>
                </el-table-column>
                <el-table-column :label="$t('exchange.fields.effectiveTime')" width="210">
                    <template #default="{ row }"><el-date-picker v-model="row.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></template>
                </el-table-column>
                <el-table-column :label="$t('common.status')" width="120">
                    <template #default="{ row }"><el-select v-model="row.rateStatus" style="width:100%"><el-option v-for="item in manualBusinessRateStatusOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></template>
                </el-table-column>
                <el-table-column :label="$t('common.operation')" width="90" fixed="right" align="center">
                    <template #default="{ $index }"><el-button type="primary" link :icon="Delete" @click="removeBatchRow($index)" /></template>
                </el-table-column>
            </el-table>
            <div class="batch-actions"><el-button :icon="Plus" size="small" @click="addBatchRow">{{ $t('exchange.businessRate.addRow') }}</el-button></div>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitBatch">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="batchVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Download, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { batchCreateExchangeBusinessRates, createExchangeBusinessRate, exportExchangeBusinessRates, getExchangeBusinessRate, searchExchangeBusinessRates, updateExchangeBusinessRateStatus, type BusinessRateSaveRequest, type ExchangeBusinessRate } from '@/api/exchange';
import CurrencySelect from '../CurrencySelect.vue';
import ExchangeSourceSelect from '../ExchangeSourceSelect.vue';
import RateNumberInput from '../RateNumberInput.vue';
import {
    businessRateStatusOptions as buildBusinessRateStatusOptions,
    formatCurrencyPair,
    formatRate,
    generateMethodOptions as buildGenerateMethodOptions,
    optionLabel,
    rateTypeOptions as buildRateTypeOptions,
    statusType,
} from '../shared';

const { t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeBusinessRate[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ExchangeBusinessRate | null>(null);
const formVisible = ref(false);
const formRef = ref<FormInstance>();
const batchVisible = ref(false);
const batchItems = ref<Array<BusinessRateSaveRequest & { rowKey: number }>>([]);
let batchRowSeq = 0;

const query = reactive({
    rateType: '',
    sourceCode: '',
    baseCurrency: '',
    quoteCurrency: '',
    rateStatus: '',
    generateMethod: '',
});

const emptyForm = () => ({
    rateType: 'SETTLEMENT_RATE',
    sourceCode: '',
    baseCurrency: '',
    quoteCurrency: 'CNY',
    originalRate: '',
    finalRate: '',
    effectiveTime: '',
    rateStatus: 'ENABLED',
    remark: '',
});

const form = reactive(emptyForm());
const rateTypeOptions = computed(() => buildRateTypeOptions(translate));
const businessRateStatusOptions = computed(() => buildBusinessRateStatusOptions(translate));
const manualBusinessRateStatusOptions = computed(() => businessRateStatusOptions.value.filter((item) => ['ENABLED', 'DISABLED'].includes(item.value)));
const generateMethodOptions = computed(() => buildGenerateMethodOptions(translate));
const rateRule = { pattern: /^\d+(\.\d+)?$/, message: t('exchange.validation.rateNumberInvalid'), trigger: 'blur' };
const rules = computed<FormRules>(() => ({
    rateType: [{ required: true, message: t('exchange.validation.rateTypeRequired'), trigger: 'change' }],
    sourceCode: [{ required: true, message: t('exchange.validation.sourceRequired'), trigger: 'change' }],
    baseCurrency: [{ required: true, message: t('exchange.validation.baseCurrencyRequired'), trigger: 'change' }],
    quoteCurrency: [{ required: true, message: t('exchange.validation.quoteCurrencyRequired'), trigger: 'change' }],
    originalRate: [{ required: true, message: t('exchange.validation.originalRateRequired'), trigger: 'blur' }, rateRule],
    finalRate: [{ required: true, message: t('exchange.validation.finalRateRequired'), trigger: 'blur' }, rateRule],
    effectiveTime: [{ required: true, message: t('exchange.validation.effectiveTimeRequired'), trigger: 'change' }],
    rateStatus: [{ required: true, message: t('exchange.validation.statusRequired'), trigger: 'change' }],
}));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await searchExchangeBusinessRates({ pageNo: page.value, pageSize: pageSize.value, ...query });
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
    query.rateStatus = '';
    query.generateMethod = '';
    handleSearch();
}

async function openDetail(row: ExchangeBusinessRate) {
    detailRow.value = await getExchangeBusinessRate(row.id);
    detailVisible.value = true;
}

function openForm() {
    Object.assign(form, emptyForm());
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    await createExchangeBusinessRate(toBusinessRatePayload(form));
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ExchangeBusinessRate) {
    const nextStatus = row.rateStatus === 'ENABLED' ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    const name = `${optionLabel(rateTypeOptions.value, row.rateType)} ${formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency)}`.trim();
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    await updateExchangeBusinessRateStatus(row.id, nextStatus);
    ElMessage.success(t('common.success'));
    loadData();
}

async function handleExport() {
    await exportExchangeBusinessRates({ pageNo: page.value, pageSize: pageSize.value, ...query });
}

function openBatch() {
    batchItems.value = [newBatchRow()];
    batchVisible.value = true;
}

function addBatchRow() {
    batchItems.value.push(newBatchRow());
}

function removeBatchRow(index: number) {
    if (batchItems.value.length === 1) {
        batchItems.value = [newBatchRow()];
        return;
    }
    batchItems.value.splice(index, 1);
}

async function submitBatch() {
    const items = batchItems.value.map(toBusinessRatePayload);
    if (items.some((item) => !item.rateType || !item.sourceCode || !item.baseCurrency || !item.quoteCurrency || !item.originalRate || !item.finalRate || !item.effectiveTime)) {
        ElMessage.warning(t('exchange.validation.batchRequired'));
        return;
    }
    await batchCreateExchangeBusinessRates(items);
    ElMessage.success(t('common.saveSuccess'));
    batchVisible.value = false;
    loadData();
}

function newBatchRow() {
    return { ...emptyForm(), rowKey: ++batchRowSeq };
}

function toBusinessRatePayload(source: BusinessRateSaveRequest) {
    return {
        rateType: source.rateType,
        sourceCode: source.sourceCode,
        baseCurrency: source.baseCurrency,
        quoteCurrency: source.quoteCurrency,
        originalRate: source.originalRate,
        finalRate: source.finalRate,
        effectiveTime: source.effectiveTime,
        rateStatus: source.rateStatus || 'ENABLED',
        remark: source.remark || '',
    };
}
</script>

<style scoped>

.batch-actions {
    margin-top: 12px;
}

.rate-value,
.final-rate-value {
    font-variant-numeric: tabular-nums;
}

.rate-value {
    color: var(--el-text-color-regular);
}

.final-rate-value {
    color: var(--el-color-primary);
    font-weight: 700;
}
</style>
