<!-- 原始汇率记录页：统一提供报价时间筛选、记录展示、手工录入和作废操作。 -->
<template>
    <div class="app-container exchange-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="$t('exchange.fields.sourceCode')"><ExchangeSourceSelect v-model="query.sourceCode" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.baseCurrency')"><CurrencySelect v-model="query.baseCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('exchange.fields.quoteCurrency')"><CurrencySelect v-model="query.quoteCurrency" @change="handleSearch" /></el-form-item>
            <el-form-item :label="$t('common.status')">
                <el-select v-model="query.rateStatus" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in rawRateStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.createMethod')">
                <el-select v-model="query.createMethod" :placeholder="$t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in createMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.publishTime')">
                <el-date-picker v-model="publishRange" class="time-range-picker" type="datetimerange" :range-separator="$t('common.to')" :start-placeholder="$t('exchange.placeholders.start')" :end-placeholder="$t('exchange.placeholders.end')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.fetchTime')">
                <el-date-picker v-model="fetchRange" class="time-range-picker" type="datetimerange" :range-separator="$t('common.to')" :start-placeholder="$t('exchange.placeholders.start')" :end-placeholder="$t('exchange.placeholders.end')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
            <el-form-item :label="$t('exchange.fields.effectiveTime')">
                <el-date-picker v-model="effectiveRange" class="time-range-picker" type="datetimerange" :range-separator="$t('common.to')" :start-placeholder="$t('exchange.placeholders.start')" :end-placeholder="$t('exchange.placeholders.end')" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm" v-hasPermi="'exchange:raw-rate:add'">{{ $t('exchange.rawRate.manualAdd') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="CircleClose" size="small" :disabled="selectedRows.length !== 1 || selectedRows[0]?.rateStatus === 'VOIDED'" @click="openVoid(selectedRows[0])" v-hasPermi="'exchange:raw-rate:void'">{{ $t('exchange.actions.void') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'exchange:raw-rate:export'">{{ $t('common.export') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="exchange-raw-rate" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="sourceCode" :label="$t('exchange.fields.source')" width="90" align="center" />
            <el-table-column :label="$t('exchange.fields.currencyPair')" width="150" align="center"><template #default="{ row }">{{ formatCurrencyPair(translate, row.baseCurrency, row.quoteCurrency) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.spotBuyRate')" min-width="130" align="right"><template #default="{ row }">{{ formatRate(row.spotBuyRate) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.spotSellRate')" min-width="130" align="right"><template #default="{ row }">{{ formatRate(row.spotSellRate) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.cashBuyRate')" min-width="130" align="right"><template #default="{ row }">{{ formatRate(row.cashBuyRate) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.cashSellRate')" min-width="130" align="right"><template #default="{ row }">{{ formatRate(row.cashSellRate) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.middleRate')" min-width="130" align="right"><template #default="{ row }">{{ formatRate(row.middleRate) }}</template></el-table-column>
            <el-table-column :label="$t('exchange.fields.publishTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.publishTime" /></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.fetchTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.fetchTime" /></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.effectiveTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" /></template></el-table-column>
            <el-table-column :label="$t('exchange.fields.createMethod')" width="105" align="center"><template #default="{ row }">{{ optionLabel(createMethodOptions, row.createMethod) }}</template></el-table-column>
            <el-table-column :label="$t('common.status')" width="95" align="center"><template #default="{ row }"><el-tag size="small" :type="statusType(row.rateStatus)">{{ optionLabel(rawRateStatusOptions, row.rateStatus) }}</el-tag></template></el-table-column>
            <el-table-column :label="$t('common.operation')" width="170" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'exchange:raw-rate:detail'">{{ $t('common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="CircleClose" :disabled="row.rateStatus === 'VOIDED'" @click="openVoid(row)" v-hasPermi="'exchange:raw-rate:void'">{{ $t('exchange.actions.void') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="$t('exchange.rawRate.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="$t('exchange.fields.source')">{{ detailRow.sourceCode }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.currencyPair')">{{ formatCurrencyPair(translate, detailRow.baseCurrency, detailRow.quoteCurrency) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.spotBuyRate')">{{ formatRate(detailRow.spotBuyRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.spotSellRate')">{{ formatRate(detailRow.spotSellRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.cashBuyRate')">{{ formatRate(detailRow.cashBuyRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.cashSellRate')">{{ formatRate(detailRow.cashSellRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.middleRate')">{{ formatRate(detailRow.middleRate) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.createMethod')">{{ optionLabel(createMethodOptions, detailRow.createMethod) }}</el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.publishTime')"><BaseDateTime :value="detailRow.publishTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.fetchTime')"><BaseDateTime :value="detailRow.fetchTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.effectiveTime')"><BaseDateTime :value="detailRow.effectiveTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.batchNo')">{{ detailRow.batchNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')"><el-tag size="small" :type="statusType(detailRow.rateStatus)">{{ optionLabel(rawRateStatusOptions, detailRow.rateStatus) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="$t('exchange.fields.voidReason')">{{ detailRow.voidReason || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="$t('exchange.rawRate.manualAddTitle')" v-model="formVisible" width="720px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" size="small">
                <el-row :gutter="16">
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.sourceCode')" prop="sourceCode"><ExchangeSourceSelect v-model="form.sourceCode" width="100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.baseCurrency')" prop="baseCurrency"><CurrencySelect v-model="form.baseCurrency" width="100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.quoteCurrency')" prop="quoteCurrency"><CurrencySelect v-model="form.quoteCurrency" width="100%" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.spotBuyRate')" prop="spotBuyRate"><RateNumberInput v-model="form.spotBuyRate" placeholder="7.250000000000" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.spotSellRate')" prop="spotSellRate"><RateNumberInput v-model="form.spotSellRate" placeholder="7.260000000000" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.cashBuyRate')" prop="cashBuyRate"><RateNumberInput v-model="form.cashBuyRate" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.cashSellRate')" prop="cashSellRate"><RateNumberInput v-model="form.cashSellRate" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('exchange.fields.middleRate')" prop="middleRate"><RateNumberInput v-model="form.middleRate" /></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('exchange.fields.publishTime')" prop="publishTime"><el-date-picker v-model="form.publishTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.effectiveTime')"><el-date-picker v-model="form.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                <el-form-item :label="$t('exchange.fields.batchNo')"><el-input v-model.trim="form.batchNo" maxlength="64" /></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog :title="$t('exchange.rawRate.voidTitle')" v-model="voidVisible" width="520px" append-to-body destroy-on-close>
            <el-form ref="voidFormRef" :model="voidForm" :rules="voidRules" label-width="82px" size="small">
                <el-form-item :label="$t('exchange.fields.reason')" prop="voidReason"><el-input v-model="voidForm.voidReason" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitVoid">{{ $t('common.confirm') }}</el-button>
                    <el-button @click="voidVisible = false">{{ $t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { CircleClose, Download, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { createExchangeRawRate, exportExchangeRawRates, getExchangeRawRate, searchExchangeRawRates, voidExchangeRawRate, type ExchangeRawRate } from '@/api/exchange';
import CurrencySelect from '../CurrencySelect.vue';
import ExchangeSourceSelect from '../ExchangeSourceSelect.vue';
import RateNumberInput from '../RateNumberInput.vue';
import { createMethodOptions as buildCreateMethodOptions, formatCurrencyPair, formatRate, optionLabel, rawRateStatusOptions as buildRawRateStatusOptions, statusType, todayDateTimeRange } from '../shared';

const { t } = useI18n();
const translate = (key: string, params?: Record<string, unknown>) => t(key, params || {});
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ExchangeRawRate[]>([]);
const selectedRows = ref<ExchangeRawRate[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const publishRange = ref<[string, string] | null>(null);
const fetchRange = ref<[string, string] | null>(todayDateTimeRange());
const effectiveRange = ref<[string, string] | null>(null);
const detailVisible = ref(false);
const detailRow = ref<ExchangeRawRate | null>(null);
const formVisible = ref(false);
const formRef = ref<FormInstance>();
const voidVisible = ref(false);
const voidFormRef = ref<FormInstance>();
const voidTarget = ref<ExchangeRawRate | null>(null);

const query = reactive({
    sourceCode: '',
    baseCurrency: '',
    quoteCurrency: '',
    rateStatus: '',
    createMethod: '',
});

const emptyForm = () => ({
    sourceCode: 'BOC',
    baseCurrency: '',
    quoteCurrency: 'CNY',
    cashBuyRate: '',
    cashSellRate: '',
    spotBuyRate: '',
    spotSellRate: '',
    middleRate: '',
    publishTime: '',
    effectiveTime: '',
    batchNo: '',
    remark: '',
});

const form = reactive(emptyForm());
const voidForm = reactive({ voidReason: '' });
const createMethodOptions = computed(() => buildCreateMethodOptions(translate));
const rawRateStatusOptions = computed(() => buildRawRateStatusOptions(translate));
const optionalRateRule = {
    pattern: /^\d+(\.\d+)?$/,
    message: t('exchange.validation.rateNumberInvalid'),
    trigger: 'blur',
};
const rules = computed<FormRules>(() => ({
    sourceCode: [{ required: true, message: t('exchange.validation.sourceRequired'), trigger: 'change' }],
    baseCurrency: [{ required: true, message: t('exchange.validation.baseCurrencyRequired'), trigger: 'change' }],
    quoteCurrency: [{ required: true, message: t('exchange.validation.quoteCurrencyRequired'), trigger: 'change' }],
    publishTime: [{ required: true, message: t('exchange.validation.publishTimeRequired'), trigger: 'change' }],
    spotBuyRate: [optionalRateRule],
    spotSellRate: [optionalRateRule],
    cashBuyRate: [optionalRateRule],
    cashSellRate: [optionalRateRule],
    middleRate: [optionalRateRule],
}));
const voidRules = computed<FormRules>(() => ({
    voidReason: [{ required: true, message: t('exchange.validation.voidReasonRequired'), trigger: 'blur' }],
}));

onMounted(loadData);

async function loadData() {
    loading.value = true;
    try {
        const result = await searchExchangeRawRates(buildQueryParams());
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
    query.sourceCode = '';
    query.baseCurrency = '';
    query.quoteCurrency = '';
    query.rateStatus = '';
    query.createMethod = '';
    publishRange.value = null;
    fetchRange.value = todayDateTimeRange();
    effectiveRange.value = null;
    handleSearch();
}

async function openDetail(row: ExchangeRawRate) {
    detailRow.value = await getExchangeRawRate(row.id);
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
    await createExchangeRawRate(toRawRatePayload());
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

function openVoid(row?: ExchangeRawRate) {
    if (!row) {
        return;
    }
    voidTarget.value = row;
    voidForm.voidReason = '';
    voidVisible.value = true;
    nextTick(() => voidFormRef.value?.clearValidate());
}

async function submitVoid() {
    const valid = await voidFormRef.value?.validate().catch(() => false);
    if (!valid || !voidTarget.value) {
        return;
    }
    await voidExchangeRawRate(voidTarget.value.id, voidForm.voidReason);
    ElMessage.success(t('common.success'));
    voidVisible.value = false;
    loadData();
}

async function handleExport() {
    await exportExchangeRawRates(buildQueryParams());
}

function buildQueryParams() {
    const [publishStartTime, publishEndTime] = publishRange.value || [];
    const [fetchStartTime, fetchEndTime] = fetchRange.value || [];
    const [effectiveStartTime, effectiveEndTime] = effectiveRange.value || [];
    return {
        pageNo: page.value,
        pageSize: pageSize.value,
        ...query,
        publishStartTime,
        publishEndTime,
        fetchStartTime,
        fetchEndTime,
        effectiveStartTime,
        effectiveEndTime,
    };
}

function toRawRatePayload() {
    return Object.fromEntries(Object.entries(form).filter(([, value]) => value !== ''));
}
</script>

<style scoped>
:deep(.time-range-picker.el-date-editor) {
    width: 400px;
    max-width: calc(100vw - 160px);
}

@media (max-width: 768px) {
    :deep(.time-range-picker.el-date-editor) {
        width: calc(100vw - 48px);
        max-width: 100%;
    }
}
</style>
