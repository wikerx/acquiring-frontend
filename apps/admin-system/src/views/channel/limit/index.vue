<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.businessType')">
                <el-select v-model="query.businessType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in businessOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.limit.limitType')">
                <el-select v-model="query.limitType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.ruleStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option :label="t('channel.common.enabled')" :value="1" />
                    <el-option :label="t('channel.common.disabled')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('channel.common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('channel.common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:limit:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:limit:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="warning" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openDimensionForm(selectedRows[0])" v-hasPermi="'channel:limit:dimensionEdit'">{{ t('channel.limit.dimensionEdit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:limit:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true"><template #default="{ row }">{{ channelDisplayText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center"><template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template></el-table-column>
            <el-table-column :label="t('channel.capability.paymentScope')" min-width="230" align="center">
                <template #default="{ row }">
                    <PaymentLogoGroup v-if="paymentScopeLogo(row).length" :keys="paymentScopeLogo(row)" fallback="text" size="sm" align="center" />
                    <span v-else>{{ optionLabel(paymentOptions, row.paymentMethod) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.limit.limitType')" min-width="130" align="center"><template #default="{ row }">{{ optionLabel(limitTypeOptions, row.limitType) }}</template></el-table-column>
            <el-table-column :label="t('channel.limit.limitAmount')" min-width="130" align="center">
                <template #default="{ row }">{{ row.limitAmount }} {{ row.limitCurrency }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.ruleStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:limit:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.operator')" min-width="130" align="center" :show-overflow-tooltip="true"><template #default="{ row }">{{ row.updateBy || row.createBy || '-' }}</template></el-table-column>
            <el-table-column :label="t('channel.common.operationTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime || row.createTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="280" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:limit:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:limit:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openDimensionForm(row)" v-hasPermi="'channel:limit:dimensionEdit'">{{ t('channel.limit.dimensionEdit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:limit:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.limit.detailTitle')" v-model="detailVisible" width="700px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.common.channel')">{{ channelDisplayText(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.capability.paymentScope')">
                    <PaymentLogoGroup v-if="paymentScopeLogo(detailRow).length" :keys="paymentScopeLogo(detailRow)" fallback="text" size="sm" />
                    <span v-else>{{ optionLabel(paymentOptions, detailRow.paymentMethod) }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.limitType')">{{ limitSummary(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.ruleStatus)">{{ statusText(detailRow.ruleStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="dialogTitle" v-model="formVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
                <el-form-item :label="t('channel.common.channel')" prop="channelId"><el-select v-model="form.channelId" filterable style="width:100%" :disabled="isDimensionMode" @change="handleChannelChange"><el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.businessType')" prop="businessType"><el-select v-model="form.businessType" style="width:100%" :disabled="isDimensionMode || !form.channelId" @change="handleBusinessTypeChange"><el-option v-for="item in formBusinessOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-if="isCreateMode" :label="t('channel.common.paymentMethod')" prop="paymentMethods"><el-select v-model="form.paymentMethods" multiple filterable style="width:100%" @change="handlePaymentMethodChange"><el-option :label="t('channel.common.all')" value="ALL" /><el-option v-for="item in formPaymentOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-else :label="t('channel.common.paymentMethod')"><el-select v-model="form.paymentMethod" clearable filterable style="width:100%" :disabled="isDimensionMode" @change="handlePaymentMethodChange"><el-option v-for="item in formPaymentOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-if="isCreateMode && includesBankCardPayment" :label="t('channel.common.cardBrand')" prop="cardBrands"><el-select v-model="form.cardBrands" multiple filterable style="width:100%" @change="handleCardBrandChange"><el-option :label="t('channel.common.all')" value="ALL" /><el-option v-for="item in formCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-else-if="!isCreateMode && isBankCardPayment" :label="t('channel.common.cardBrand')"><el-select v-model="form.cardBrand" clearable filterable style="width:100%" :disabled="isDimensionMode"><el-option v-for="item in formCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-if="isBatchAmountMode" :label="t('channel.limit.limitType')" prop="limitTypes"><el-select v-model="form.limitTypes" multiple filterable style="width:100%" :disabled="isDimensionMode" @change="syncLimitAmountMap"><el-option v-for="item in formLimitTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <template v-if="isBatchAmountMode">
                    <el-alert v-if="isCreateMode && form.channelId && form.businessType && !formLimitTypeOptions.length" class="limit-empty-alert" type="info" :closable="false" :title="t('channel.limit.noAvailableLimitType')" />
                    <div v-if="form.limitTypes.length" class="limit-amount-panel">
                        <div v-for="limitType in form.limitTypes" :key="limitType" class="limit-amount-row">
                            <span class="limit-type-label">{{ optionLabel(limitTypeOptions, limitType) }}</span>
                            <el-input-number v-model="form.limitAmounts[limitType]" :min="0.01" :precision="2" :placeholder="t('channel.limit.limitAmount')" />
                            <el-tag size="small" effect="plain">USD</el-tag>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <el-form-item :label="t('channel.limit.limitType')" prop="limitType"><el-select v-model="form.limitType" filterable style="width:100%"><el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="t('channel.limit.limitAmount')" prop="limitAmount">
                        <div class="amount-with-currency"><el-input-number v-model="form.limitAmount" :min="0.01" :precision="2" /><el-tag size="small" effect="plain">USD</el-tag></div>
                    </el-form-item>
                </template>
                <el-form-item :label="t('channel.common.status')" prop="ruleStatus"><el-select v-model="form.ruleStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('channel.common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { createChannelLimits, deleteChannelLimit, getChannelLimit, saveChannelLimitDimension, searchChannelCapabilities, searchChannelLimits, updateChannelLimit, updateChannelLimitStatus, type ChannelCapability, type ChannelLimitRule, type ChannelOption } from '@/api/channel';
import { cardLogoKeys, channelDisplayText, channelOptionLabel, loadChannelOptions, loadDictOptions, optionLabel, paymentLogoKeys, showChannelError, statusText, statusType, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelLimitRule[]>([]);
const selectedRows = ref<ChannelLimitRule[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelLimitRule | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit' | 'dimension'>('create');
const formRef = ref<FormInstance>();
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const paymentOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const limitTypeOptions = ref<SelectOption[]>([]);
const enabledCapabilityMethods = ref<string[]>([]);
const enabledCapabilities = ref<ChannelCapability[]>([]);
const existingLimits = ref<ChannelLimitRule[]>([]);

const query = reactive({
    channelId: undefined as number | undefined,
    businessType: '',
    paymentMethod: '',
    cardBrand: '',
    limitType: '',
    ruleStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    channelId: undefined as number | undefined,
    businessType: 'ACQUIRING',
    paymentMethod: 'ALL',
    paymentMethods: ['ALL'] as string[],
    cardBrand: 'ALL',
    cardBrands: ['ALL'] as string[],
    limitType: '',
    limitTypes: [] as string[],
    limitAmount: 0.01,
    limitAmounts: {} as Record<string, number | undefined>,
    ruleStatus: 1,
    remark: '',
});
const form = reactive(emptyForm());
const DEFAULT_LIMIT_AMOUNTS: Record<string, number | undefined> = {
    SINGLE_MIN: 1,
    SINGLE_MAX: 100,
};
const rules: FormRules = {
    channelId: [{ required: true, message: t('channel.limit.requiredChannel'), trigger: 'change' }],
    businessType: [{ required: true, message: t('channel.limit.requiredBusinessType'), trigger: 'change' }],
    paymentMethods: [{ required: true, type: 'array', min: 1, message: t('channel.limit.requiredPaymentMethod'), trigger: 'change' }],
    cardBrands: [{ required: true, type: 'array', min: 1, message: t('channel.limit.requiredCardBrand'), trigger: 'change' }],
    limitTypes: [{ required: true, type: 'array', min: 1, message: t('channel.limit.requiredLimitType'), trigger: 'change' }],
    limitType: [{ required: true, message: t('channel.limit.requiredLimitType'), trigger: 'change' }],
    limitAmount: [{ required: true, message: t('channel.limit.requiredLimitAmount'), trigger: 'blur' }],
    ruleStatus: [{ required: true, message: t('channel.limit.requiredStatus'), trigger: 'change' }],
};
const isCreateMode = computed(() => formMode.value === 'create');
const isDimensionMode = computed(() => formMode.value === 'dimension');
const isBatchAmountMode = computed(() => isCreateMode.value || isDimensionMode.value);
const selectedChannel = computed(() => channelOptions.value.find((item) => item.id === form.channelId));
const dialogTitle = computed(() => {
    if (formMode.value === 'create') {
        return t('channel.limit.addTitle');
    }
    return formMode.value === 'dimension' ? t('channel.limit.dimensionEdit') : t('channel.limit.editTitle');
});
const isBankCardPayment = computed(() => form.paymentMethod === 'BANK_CARD');
const includesBankCardPayment = computed(() => selectedCreatePaymentMethods().includes('BANK_CARD'));
const formBusinessOptions = computed(() => businessOptions.value.filter((item) => isBusinessSupportedByChannel(item.value, selectedChannel.value)));
const paymentOptionsByBusiness = computed(() => {
    if (form.businessType === 'PAYOUT') {
        return payoutPaymentOptions.value;
    }
    if (form.businessType === 'ACQUIRING') {
        return acquiringPaymentOptions.value;
    }
    return paymentOptions.value;
});
const formPaymentOptions = computed(() => {
    const options = form.channelId && form.businessType
        ? paymentOptionsByBusiness.value.filter((item) => enabledCapabilityMethods.value.includes(item.value))
        : paymentOptionsByBusiness.value;
    return dedupeOptions(options);
});
const formCardBrandOptions = computed(() => {
    const brands = enabledCapabilities.value
        .filter((item) => item.paymentMethod === 'BANK_CARD')
        .flatMap((item) => item.cardBrands || []);
    if (!brands.length) {
        return cardBrandOptions.value;
    }
    const enabledBrands = new Set(brands);
    return cardBrandOptions.value.filter((item) => enabledBrands.has(item.value));
});
const formLimitTypeOptions = computed(() => {
    if (!isCreateMode.value) {
        return limitTypeOptions.value;
    }
    const scopes = buildCreateLimitScopes();
    if (!scopes.length) {
        return [];
    }
    return limitTypeOptions.value.filter((item) => scopes.every((scope) => !hasExistingLimit(scope, item.value)));
});

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => {
    loadOptions();
});

async function loadOptions() {
    const [channels, business, acquiringPayments, payoutPayments, cardBrands, limitTypes] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_business_type', String(locale.value)),
        loadDictOptions('acquiring_payment_method', String(locale.value)),
        loadDictOptions('payout_payment_method', String(locale.value)),
        loadDictOptions('card_brand', String(locale.value)),
        loadDictOptions('channel_limit_type', String(locale.value)),
    ]);
    channelOptions.value = channels;
    businessOptions.value = business;
    acquiringPaymentOptions.value = acquiringPayments;
    payoutPaymentOptions.value = payoutPayments;
    paymentOptions.value = [...acquiringPayments, ...payoutPayments];
    cardBrandOptions.value = cardBrands;
    limitTypeOptions.value = limitTypes;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelLimits({ pageNo: page.value, pageSize: pageSize.value, ...query });
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
    query.channelId = undefined;
    query.businessType = '';
    query.paymentMethod = '';
    query.cardBrand = '';
    query.limitType = '';
    query.ruleStatus = undefined;
    handleSearch();
}

async function openDetail(row: ChannelLimitRule) {
    detailRow.value = await getChannelLimit(row.id);
    detailVisible.value = true;
}

async function openForm(mode: 'create' | 'edit', row?: ChannelLimitRule) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {});
    form.paymentMethods = row?.paymentMethod ? [row.paymentMethod] : ['ALL'];
    form.cardBrands = row?.cardBrand ? [row.cardBrand] : ['ALL'];
    form.limitTypes = row?.limitType ? [row.limitType] : [];
    form.limitAmounts = row?.limitType ? { [row.limitType]: Number(row.limitAmount || 0) } : {};
    if (isCreateMode.value) {
        syncBusinessTypeWithChannel();
    }
    await refreshCapabilityMethods();
    await refreshExistingLimits();
    syncConditionalFields();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function openDimensionForm(row: ChannelLimitRule) {
    formMode.value = 'dimension';
    Object.assign(form, emptyForm(), row);
    form.paymentMethods = row.paymentMethod ? [row.paymentMethod] : [];
    form.cardBrands = row.cardBrand ? [row.cardBrand] : [];
    await refreshCapabilityMethods();
    syncConditionalFields();
    const result = await searchChannelLimits({
        pageNo: 1,
        pageSize: 200,
        channelId: row.channelId,
        businessType: row.businessType,
        paymentMethod: row.paymentMethod,
        cardBrand: row.cardBrand,
    });
    form.limitTypes = limitTypeOptions.value.map((item) => item.value);
    const amounts: Record<string, number | undefined> = {};
    for (const limitType of form.limitTypes) {
        const matched = result.records.find((item) => item.limitType === limitType);
        amounts[limitType] = matched?.limitAmount ?? defaultLimitAmount(limitType);
    }
    form.limitAmounts = amounts;
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function handleChannelChange() {
    syncBusinessTypeWithChannel();
    await handleScopeChange();
}

async function handleBusinessTypeChange() {
    form.paymentMethods = ['ALL'];
    form.cardBrands = ['ALL'];
    await handleScopeChange();
}

async function handleScopeChange() {
    await refreshCapabilityMethods();
    await refreshExistingLimits();
    if (isCreateMode.value) {
        form.paymentMethods = normalizeScopeSelection(form.paymentMethods, formPaymentOptions.value.map((item) => item.value));
    } else if (!formPaymentOptions.value.some((item) => item.value === form.paymentMethod)) {
        form.paymentMethod = formPaymentOptions.value[0]?.value || '';
    }
    syncConditionalFields();
}

function handlePaymentMethodChange() {
    if (isCreateMode.value) {
        form.paymentMethods = normalizeScopeSelection(form.paymentMethods, formPaymentOptions.value.map((item) => item.value));
    }
    syncConditionalFields();
}

function handleCardBrandChange() {
    if (isCreateMode.value) {
        form.cardBrands = normalizeScopeSelection(form.cardBrands, formCardBrandOptions.value.map((item) => item.value));
    }
    syncConditionalFields();
}

function syncConditionalFields() {
    if (isCreateMode.value) {
        if (!form.paymentMethods.length) {
            form.paymentMethods = ['ALL'];
        }
        if (form.paymentMethods.includes('ALL') || !includesBankCardPayment.value) {
            form.cardBrands = ['ALL'];
        } else {
            form.cardBrands = normalizeScopeSelection(form.cardBrands, formCardBrandOptions.value.map((item) => item.value));
        }
        form.limitTypes = form.limitTypes.filter((item) => formLimitTypeOptions.value.some((option) => option.value === item));
        syncLimitAmountMap();
        return;
    }
    if (!isBankCardPayment.value) {
        form.cardBrand = 'ALL';
    }
    if (isBankCardPayment.value && form.cardBrand === 'ALL') {
        form.cardBrand = formCardBrandOptions.value[0]?.value || '';
    }
}

async function submitForm() {
    syncConditionalFields();
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (formMode.value === 'create') {
        const payloads = buildCreateLimitPayloads();
        if (!validateLimitPayloads(payloads)) {
            return;
        }
        try {
            await createChannelLimits(payloads);
        } catch (error) {
            showSaveError(error);
            return;
        }
    } else if (formMode.value === 'dimension') {
        const payloads = buildDimensionLimitPayloads();
        if (!validateLimitPayloads(payloads)) {
            return;
        }
        try {
            await saveChannelLimitDimension(payloads);
        } catch (error) {
            showSaveError(error);
            return;
        }
    } else {
        try {
            await updateChannelLimit(form.id, { ...form });
        } catch (error) {
            showSaveError(error);
            return;
        }
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function refreshCapabilityMethods() {
    if (!form.channelId || !form.businessType) {
        enabledCapabilityMethods.value = [];
        enabledCapabilities.value = [];
        return;
    }
    const result = await searchChannelCapabilities({
        pageNo: 1,
        pageSize: 200,
        channelId: form.channelId,
        businessType: form.businessType,
        capabilityStatus: 1,
    });
    enabledCapabilities.value = result.records;
    enabledCapabilityMethods.value = Array.from(new Set(result.records.map((item) => item.paymentMethod).filter(Boolean)));
}

async function refreshExistingLimits() {
    if (!form.channelId || !form.businessType || !isCreateMode.value) {
        existingLimits.value = [];
        return;
    }
    const result = await searchChannelLimits({
        pageNo: 1,
        pageSize: 500,
        channelId: form.channelId,
        businessType: form.businessType,
    });
    existingLimits.value = result.records;
}

function isBusinessSupportedByChannel(businessType: string, channel?: ChannelOption) {
    if (!channel) {
        return true;
    }
    if (businessType === 'ACQUIRING') {
        return channel.supportAcquiring === 1;
    }
    if (businessType === 'PAYOUT') {
        return channel.supportPayout === 1;
    }
    return false;
}

function syncBusinessTypeWithChannel() {
    const options = formBusinessOptions.value;
    if (!options.some((item) => item.value === form.businessType)) {
        form.businessType = options[0]?.value || '';
    }
}

function dedupeOptions(options: SelectOption[]) {
    const seen = new Set<string>();
    return options.filter((item) => {
        if (seen.has(item.value)) {
            return false;
        }
        seen.add(item.value);
        return true;
    });
}

function selectedPaymentMethods() {
    return isCreateMode.value ? form.paymentMethods : [form.paymentMethod];
}

function normalizeScopeSelection(values: string[], allowedValues: string[]) {
    const normalized = Array.from(new Set((values || []).filter(Boolean)));
    if (!normalized.length) {
        return ['ALL'];
    }
    const scopedValues = normalized.filter((value) => value !== 'ALL' && allowedValues.includes(value));
    return scopedValues.length ? scopedValues : ['ALL'];
}

function syncLimitAmountMap() {
    const next: Record<string, number | undefined> = {};
    for (const limitType of form.limitTypes) {
        next[limitType] = form.limitAmounts[limitType] ?? defaultLimitAmount(limitType);
    }
    form.limitAmounts = next;
}

function buildCreateLimitPayloads() {
    const payloads: Partial<ChannelLimitRule>[] = [];
    for (const scope of buildCreateLimitScopes()) {
        for (const limitType of form.limitTypes) {
            if (!hasLimitAmount(limitType)) {
                continue;
            }
            payloads.push({
                channelId: form.channelId,
                businessType: form.businessType,
                paymentMethod: scope.paymentMethod,
                cardBrand: scope.cardBrand,
                limitType,
                limitAmount: form.limitAmounts[limitType],
                ruleStatus: form.ruleStatus,
                remark: form.remark,
            });
        }
    }
    return payloads;
}

function buildDimensionLimitPayloads() {
    return form.limitTypes
        .filter((limitType) => hasLimitAmount(limitType))
        .map((limitType) => ({
            channelId: form.channelId,
            businessType: form.businessType,
            paymentMethod: form.paymentMethod,
            cardBrand: form.cardBrand,
            limitType,
            limitAmount: form.limitAmounts[limitType],
            ruleStatus: form.ruleStatus,
            remark: form.remark,
        }));
}

function hasLimitAmount(limitType: string) {
    const amount = form.limitAmounts[limitType];
    return amount !== undefined && amount !== null && String(amount) !== '';
}

function validateLimitPayloads(payloads: Partial<ChannelLimitRule>[]) {
    if (!payloads.length) {
        ElMessage.warning(t('channel.limit.requiredLimitAmount'));
        return false;
    }
    const missing = payloads.find((item) => item.limitAmount === undefined || item.limitAmount === null || Number(item.limitAmount) < 0.01);
    if (missing) {
        const limitTypeLabel = optionLabel(limitTypeOptions.value, missing.limitType || '');
        ElMessage.warning(limitTypeLabel ? `${limitTypeLabel}：${t('channel.limit.requiredLimitAmount')}` : t('channel.limit.requiredLimitAmount'));
        return false;
    }
    if (!validateLimitAmountRelations(payloads)) {
        return false;
    }
    return true;
}

function validateLimitAmountRelations(payloads: Partial<ChannelLimitRule>[]) {
    const amountMap = new Map<string, Map<string, number>>();
    for (const item of payloads) {
        if (!item.limitType || item.limitAmount === undefined || item.limitAmount === null) {
            continue;
        }
        const scopeKey = [
            item.channelId,
            item.businessType || '',
            item.paymentMethod || 'ALL',
            item.cardBrand || 'ALL',
        ].join('|');
        const scopedAmounts = amountMap.get(scopeKey) || new Map<string, number>();
        scopedAmounts.set(item.limitType, Number(item.limitAmount));
        amountMap.set(scopeKey, scopedAmounts);
    }
    for (const scopedAmounts of amountMap.values()) {
        const daily = scopedAmounts.get('DAILY');
        const weekly = scopedAmounts.get('WEEKLY');
        const monthly = scopedAmounts.get('MONTHLY');
        if (daily !== undefined && weekly !== undefined && weekly > daily * 7) {
            ElMessage.warning(t('channel.limit.weeklyLimitTooLarge'));
            return false;
        }
        if (weekly !== undefined && monthly !== undefined && monthly > weekly * 4) {
            ElMessage.warning(t('channel.limit.monthlyLimitTooLarge'));
            return false;
        }
    }
    return true;
}

function defaultLimitAmount(limitType: string) {
    return DEFAULT_LIMIT_AMOUNTS[limitType];
}

function showSaveError(error: unknown) {
    return showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
}

function selectedCreatePaymentMethods() {
    if (!form.paymentMethods.includes('ALL')) {
        return form.paymentMethods;
    }
    return Array.from(new Set(enabledCapabilities.value.map((item) => item.paymentMethod).filter(Boolean)));
}

function selectedCreateCardBrands() {
    if (!form.cardBrands.includes('ALL')) {
        return form.cardBrands;
    }
    return Array.from(new Set(enabledCapabilities.value
        .filter((item) => item.paymentMethod === 'BANK_CARD')
        .flatMap((item) => item.cardBrands || [])));
}

function buildCreateLimitScopes() {
    const scopes: Array<{ paymentMethod: string; cardBrand: string }> = [];
    for (const paymentMethod of selectedCreatePaymentMethods()) {
        const cardBrands = paymentMethod === 'BANK_CARD' ? selectedCreateCardBrands() : ['ALL'];
        for (const cardBrand of cardBrands) {
            scopes.push({ paymentMethod, cardBrand });
        }
    }
    return scopes;
}

function hasExistingLimit(scope: { paymentMethod: string; cardBrand: string }, limitType: string) {
    return existingLimits.value.some((item) => item.paymentMethod === scope.paymentMethod
        && (item.cardBrand || 'ALL') === scope.cardBrand
        && item.limitType === limitType);
}

function cardLogo(value?: string): PaymentLogoKey[] {
    return value && value !== 'ALL' ? cardLogoKeys(value, cardBrandOptions.value.find((item) => item.value === value)) : [];
}

function paymentScopeLogo(row: Pick<ChannelLimitRule, 'businessType' | 'paymentMethod' | 'cardBrand'>): PaymentLogoKey[] {
    if (row.paymentMethod === 'BANK_CARD') {
        return cardLogo(row.cardBrand);
    }
    return paymentLogoKeys(row.paymentMethod, paymentOptionsFor(row.businessType).find((item) => item.value === row.paymentMethod));
}

function paymentOptionsFor(businessType?: string) {
    return businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value;
}

function limitSummary(row: ChannelLimitRule) {
    return `${optionLabel(limitTypeOptions.value, row.limitType)}：${row.limitAmount} ${row.limitCurrency}`;
}

async function toggleStatus(row: ChannelLimitRule) {
    try {
        await updateChannelLimitStatus(row.id, row.ruleStatus === 1 ? 0 : 1);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(target?: ChannelLimitRule | ChannelLimitRule[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.limit.deleteConfirm', { name: targets.map((item) => limitSummary(item)).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannelLimit(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}
</script>

<style scoped>

.limit-amount-panel {
    margin: 0 0 18px 118px;
    display: grid;
    gap: 10px;
}

.limit-empty-alert {
    margin: 0 0 18px 118px;
    width: calc(100% - 118px);
}

.limit-amount-row {
    display: grid;
    grid-template-columns: minmax(120px, 1fr) minmax(180px, 240px) auto;
    gap: 10px;
    align-items: center;
}

.limit-type-label {
    color: var(--el-text-color-regular);
}

.amount-with-currency {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
}

.amount-with-currency :deep(.el-input-number) {
    width: 240px;
}
</style>
