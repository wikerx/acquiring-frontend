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
            <el-form-item :label="t('channel.common.paymentMethod')">
                <el-select v-model="query.paymentMethod" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in currentPaymentOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.cardBrand')">
                <el-select v-model="query.cardBrand" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.capabilityStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
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
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:capability:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:capability:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:capability:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="channel-capability" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true"><template #default="{ row }">{{ channelDisplayText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center">
                <template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.capability.paymentScope')" min-width="230" align="center">
                <template #default="{ row }">
                    <PaymentLogoGroup v-if="paymentScopeLogo(row).length" :keys="paymentScopeLogo(row)" fallback="text" size="sm" align="center" />
                    <span v-else>{{ optionLabel(paymentOptionsFor(row.businessType), row.paymentMethod) }}</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.transactionType')" min-width="260" align="center">
                <template #default="{ row }">
                    <div v-if="transactionTypeItems(row).length" class="tag-list">
                        <el-tag v-for="item in transactionTypeItems(row)" :key="item.value" size="small" effect="plain">{{ item.label }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.currency')" min-width="150" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ row.currencyCodes?.join(', ') || '-' }}</template>
            </el-table-column>
            <el-table-column label="3DS" width="90" align="center">
                <template #default="{ row }">
                    <el-switch :model-value="row.support3ds" :active-value="1" :inactive-value="0" @change="toggleSupportFlag(row, 'support3ds', $event)" v-hasPermi="'channel:capability:edit'" />
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.capability.incrementalAuthorization')" width="120" align="center">
                <template #default="{ row }">
                    <el-switch
                        :model-value="row.supportIncrementalAuthorization"
                        :active-value="1"
                        :inactive-value="0"
                        :disabled="!canRowConfigureIncrementalAuthorization(row)"
                        @change="toggleSupportFlag(row, 'supportIncrementalAuthorization', $event)"
                        v-hasPermi="'channel:capability:edit'"
                    />
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.capabilityStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:capability:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.updateTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:capability:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:capability:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:capability:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.capability.detailTitle')" v-model="detailVisible" width="700px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.common.channel')">{{ channelDisplayText(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.capability.paymentScope')">
                    <PaymentLogoGroup v-if="paymentScopeLogo(detailRow).length" :keys="paymentScopeLogo(detailRow)" fallback="text" size="sm" />
                    <span v-else>{{ optionLabel(paymentOptionsFor(detailRow.businessType), detailRow.paymentMethod) }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.transactionType')">
                    <div v-if="transactionTypeItems(detailRow).length" class="tag-list tag-list-left">
                        <el-tag v-for="item in transactionTypeItems(detailRow)" :key="item.value" size="small" effect="plain">{{ item.label }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.currencies')">{{ detailRow.currencyCodes?.join(', ') || '-' }}</el-descriptions-item>
                <el-descriptions-item label="3DS">
                    <el-tag size="small" effect="plain" :type="detailRow.support3ds === 1 ? 'success' : 'info'">{{ yesNoText(detailRow.support3ds, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.capability.supportIncrementalAuthorization')">
                    <el-tag size="small" effect="plain" :type="detailRow.supportIncrementalAuthorization === 1 ? 'success' : 'info'">{{ yesNoText(detailRow.supportIncrementalAuthorization, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.capabilityStatus)">{{ statusText(detailRow.capabilityStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.sort')">{{ detailRow.sortOrder ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('channel.capability.addTitle') : t('channel.capability.editTitle')" v-model="formVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
                <el-form-item :label="t('channel.common.channel')" prop="channelId">
                    <el-select v-model="form.channelId" :placeholder="t('channel.common.pleaseSelect')" filterable style="width:100%" :disabled="isEditMode" @change="handleChannelChange">
                        <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.businessType')" prop="businessType">
                    <el-select v-model="form.businessType" style="width:100%" :disabled="isEditMode || !form.channelId" @change="handleBusinessChange">
                        <el-option v-for="item in formBusinessOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.paymentMethod')" prop="paymentMethod">
                    <el-select v-model="form.paymentMethod" filterable style="width:100%" :disabled="isEditMode" @change="handlePaymentChange">
                        <el-option v-for="item in paymentOptionsFor(form.businessType)" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="form.businessType === 'ACQUIRING'" :label="t('channel.common.transactionType')" prop="transactionTypes">
                    <el-select v-model="form.transactionTypes" multiple filterable style="width:100%" @change="handleTransactionTypeChange">
                        <el-option v-for="item in transactionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.currencies')" prop="currencyCodes">
                    <el-select v-model="form.currencyCodes" multiple filterable :reserve-keyword="false" style="width:100%" :loading="currencyLoading" :placeholder="t('channel.capability.currencyPlaceholder')">
                        <el-option v-for="item in currencyOptions" :key="item.alpha3Code" :label="currencyOptionLabel(item)" :value="item.alpha3Code" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="isBankCardPayment" :label="t('channel.common.cardBrand')" prop="cardBrands">
                    <el-select v-model="form.cardBrands" multiple filterable style="width:100%">
                        <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="canConfigure3ds" :label="t('channel.info.support3ds')"><el-switch v-model="form.support3ds" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item v-if="canConfigureIncrementalAuthorization" :label="t('channel.capability.incrementalAuthorization')"><el-switch v-model="form.supportIncrementalAuthorization" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="capabilityStatus"><el-select v-model="form.capabilityStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.sort')"><el-input-number v-model="form.sortOrder" :min="0" style="width:100%" /></el-form-item>
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
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    createChannelCapability,
    deleteChannelCapability,
    getChannelCapability,
    searchChannelCapabilities,
    updateChannelCapability,
    updateChannelCapabilitySupport,
    updateChannelCapabilityStatus,
    type ChannelCapability,
    type ChannelOption,
} from '@/api/channel';
import {
    cardLogoKeys,
    channelDisplayText,
    channelOptionLabel,
    currencyOptionLabel,
    loadChannelOptions,
    loadCurrencyOptions,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    showChannelError,
    statusText,
    statusType,
    yesNoText,
    type SelectOption,
} from '../shared';
import type { IsoCurrency } from '@/api/base/currency';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const currencyLoading = ref(false);
const rows = ref<ChannelCapability[]>([]);
const selectedRows = ref<ChannelCapability[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelCapability | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const transactionOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const currencyOptions = ref<IsoCurrency[]>([]);
const INCREMENTAL_AUTH_TRANSACTION_TYPES = new Set(['AUTHORIZATION', 'PRE_AUTHORIZATION']);

const query = reactive({
    channelId: undefined as number | undefined,
    businessType: '',
    paymentMethod: '',
    transactionType: '',
    currencyCode: '',
    cardBrand: '',
    capabilityStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    channelId: undefined as number | undefined,
    businessType: 'ACQUIRING',
    paymentMethod: 'BANK_CARD',
    transactionType: 'PAYMENT',
    transactionTypes: ['PAYMENT'] as string[],
    currencyCodes: ['USD'] as string[],
    cardBrands: [] as string[],
    support3ds: 1,
    supportIncrementalAuthorization: 0,
    capabilityStatus: 1,
    sortOrder: 0,
    remark: '',
});
const form = reactive(emptyForm());
const rules: FormRules = {
    channelId: [{ required: true, message: t('channel.capability.requiredChannel'), trigger: 'change' }],
    businessType: [{ required: true, message: t('channel.capability.requiredBusinessType'), trigger: 'change' }],
    paymentMethod: [{ required: true, message: t('channel.capability.requiredPaymentMethod'), trigger: 'change' }],
    transactionTypes: [{ required: true, type: 'array', min: 1, message: t('channel.capability.requiredTransactionType'), trigger: 'change' }],
    currencyCodes: [{ required: true, type: 'array', min: 1, message: t('channel.capability.requiredCurrencies'), trigger: 'change' }],
    cardBrands: [{ required: true, type: 'array', min: 1, message: t('channel.capability.requiredCardBrands'), trigger: 'change' }],
    capabilityStatus: [{ required: true, message: t('channel.capability.requiredStatus'), trigger: 'change' }],
};

const currentPaymentOptions = computed(() => paymentOptionsFor(query.businessType || 'ACQUIRING'));
const isEditMode = computed(() => formMode.value === 'edit');
const selectedChannel = computed(() => channelOptions.value.find((item) => item.id === form.channelId));
const formBusinessOptions = computed(() => businessOptions.value.filter((item) => isBusinessSupportedByChannel(item.value, selectedChannel.value)));
const isBankCardPayment = computed(() => form.paymentMethod === 'BANK_CARD');
const canConfigure3ds = computed(() => form.businessType === 'ACQUIRING' && selectedChannel.value?.supportAcquiring === 1 && selectedChannel.value?.support3ds === 1);
const canConfigureIncrementalAuthorization = computed(() => {
    if (form.businessType !== 'ACQUIRING') {
        return false;
    }
    return form.transactionTypes.some((value) => INCREMENTAL_AUTH_TRANSACTION_TYPES.has(value));
});

onMounted(async () => {
    await Promise.all([loadOptions(), loadCurrencyList(), loadData()]);
});

watch(locale, () => {
    loadOptions();
});

async function loadOptions() {
    const [channels, business, acquiringPayments, payoutPayments, transactions, cardBrands] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_business_type', String(locale.value)),
        loadDictOptions('acquiring_payment_method', String(locale.value)),
        loadDictOptions('payout_payment_method', String(locale.value)),
        loadDictOptions('transaction_type', String(locale.value)),
        loadDictOptions('card_brand', String(locale.value)),
    ]);
    channelOptions.value = channels;
    businessOptions.value = business;
    acquiringPaymentOptions.value = acquiringPayments;
    payoutPaymentOptions.value = payoutPayments;
    transactionOptions.value = transactions;
    cardBrandOptions.value = cardBrands;
}

async function loadCurrencyList() {
    currencyLoading.value = true;
    try {
        currencyOptions.value = await loadCurrencyOptions();
    } finally {
        currencyLoading.value = false;
    }
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelCapabilities({ pageNo: page.value, pageSize: pageSize.value, ...query });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function paymentOptionsFor(businessType?: string) {
    return businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value;
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

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.channelId = undefined;
    query.businessType = '';
    query.paymentMethod = '';
    query.transactionType = '';
    query.currencyCode = '';
    query.cardBrand = '';
    query.capabilityStatus = undefined;
    handleSearch();
}

async function openDetail(row: ChannelCapability) {
    detailRow.value = await getChannelCapability(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: ChannelCapability) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {});
    syncBusinessTypeWithChannel();
    form.transactionTypes = normalizeTransactionTypes(form.businessType, form.transactionTypes, form.transactionType);
    form.transactionType = form.transactionTypes.join(',');
    syncConditionalFields();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleChannelChange() {
    syncBusinessTypeWithChannel();
    handleBusinessChange();
}

function handleBusinessChange() {
    if (!form.businessType) {
        form.paymentMethod = '';
        form.transactionType = '';
        form.transactionTypes = [];
        syncConditionalFields();
        return;
    }
    form.paymentMethod = form.businessType === 'PAYOUT' ? (payoutPaymentOptions.value[0]?.value || '') : 'BANK_CARD';
    form.transactionType = form.businessType === 'PAYOUT' ? 'NONE' : 'PAYMENT';
    form.transactionTypes = form.businessType === 'PAYOUT' ? [] : ['PAYMENT'];
    handlePaymentChange();
}

function handlePaymentChange() {
    syncConditionalFields();
}

function handleTransactionTypeChange() {
    syncConditionalFields();
}

function syncConditionalFields() {
    if (!isBankCardPayment.value) {
        form.cardBrands = [];
    }
    if (!canConfigure3ds.value) {
        form.support3ds = 0;
    }
    if (!canConfigureIncrementalAuthorization.value) {
        form.supportIncrementalAuthorization = 0;
    }
}

async function submitForm() {
    syncConditionalFields();
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const transactionTypes = form.businessType === 'PAYOUT' ? ['NONE'] : form.transactionTypes;
    const payload = {
        ...form,
        transactionTypes,
        transactionType: transactionTypes.join(','),
        support3ds: canConfigure3ds.value ? form.support3ds : 0,
        supportIncrementalAuthorization: transactionTypes.some((type) => INCREMENTAL_AUTH_TRANSACTION_TYPES.has(type)) ? form.supportIncrementalAuthorization : 0,
    };
    try {
        if (formMode.value === 'create') {
            await createChannelCapability(payload);
        } else {
            await updateChannelCapability(form.id, payload);
        }
    } catch (error) {
        await showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ChannelCapability) {
    const nextStatus = row.capabilityStatus === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: capabilityStatusTargetName(row) }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateChannelCapabilityStatus(row.id, nextStatus);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function toggleSupportFlag(row: ChannelCapability, field: 'support3ds' | 'supportIncrementalAuthorization', value: string | number | boolean) {
    const enabledValue = value === 1 || value === true ? 1 : 0;
    const previousValue = row[field];
    if (field === 'support3ds' && enabledValue === 1 && !canRowConfigure3ds(row)) {
        row[field] = previousValue;
        ElMessage.warning(t('channel.info.support3ds'));
        return;
    }
    const action = enabledValue === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: capabilitySupportTargetName(row, field) }), t('common.operationConfirm'), { type: enabledValue === 1 ? 'success' : 'warning' });
    } catch {
        row[field] = previousValue;
        return;
    }
    row[field] = enabledValue;
    try {
        const response = await updateChannelCapabilitySupport(row.id, {
            [field]: enabledValue,
        });
        Object.assign(row, response);
        ElMessage.success(t('channel.common.operationSuccess'));
        loadData();
    } catch (error) {
        row[field] = previousValue;
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
    }
}

function syncBusinessTypeWithChannel() {
    const options = formBusinessOptions.value;
    if (!options.some((item) => item.value === form.businessType)) {
        form.businessType = options[0]?.value || '';
    }
}

async function handleDelete(target?: ChannelCapability | ChannelCapability[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.capability.deleteConfirm', { name: targets.map((item) => item.channelName).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannelCapability(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function cardLogo(values?: string[]): PaymentLogoKey[] {
    return (values || []).flatMap((value) => cardLogoKeys(value, cardBrandOptions.value.find((item) => item.value === value)));
}

function paymentScopeLogo(row: Pick<ChannelCapability, 'businessType' | 'paymentMethod' | 'cardBrands'>): PaymentLogoKey[] {
    if (row.paymentMethod === 'BANK_CARD') {
        return cardLogo(row.cardBrands);
    }
    return paymentLogoKeys(row.paymentMethod, paymentOptionsFor(row.businessType).find((item) => item.value === row.paymentMethod));
}

function normalizeTransactionTypes(businessType?: string, transactionTypes?: string[], transactionType?: string) {
    if (businessType === 'PAYOUT') {
        return [];
    }
    const values = [...(transactionTypes || []), ...(transactionType || '').split(',')];
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function transactionTypeText(row: Pick<ChannelCapability, 'businessType' | 'transactionType' | 'transactionTypes'>) {
    const values = normalizeTransactionTypes(row.businessType, row.transactionTypes, row.transactionType);
    if (!values.length) {
        return '-';
    }
    return values.map((value) => optionLabel(transactionOptions.value, value)).join(', ');
}

function capabilityStatusTargetName(row: ChannelCapability) {
    return `${channelDisplayText(row)} ${optionLabel(paymentOptionsFor(row.businessType), row.paymentMethod)} ${transactionTypeText(row)}`.trim();
}

function capabilitySupportTargetName(row: ChannelCapability, field: 'support3ds' | 'supportIncrementalAuthorization') {
    const fieldName = field === 'support3ds' ? t('channel.info.support3ds') : t('channel.capability.incrementalAuthorization');
    return `${capabilityStatusTargetName(row)} ${fieldName}`.trim();
}

function transactionTypeItems(row: Pick<ChannelCapability, 'businessType' | 'transactionType' | 'transactionTypes'>) {
    return normalizeTransactionTypes(row.businessType, row.transactionTypes, row.transactionType).map((value) => ({
        value,
        label: optionLabel(transactionOptions.value, value),
    }));
}

function canRowConfigureIncrementalAuthorization(row: Pick<ChannelCapability, 'businessType' | 'transactionType' | 'transactionTypes'>) {
    return row.businessType === 'ACQUIRING'
        && normalizeTransactionTypes(row.businessType, row.transactionTypes, row.transactionType).some((value) => INCREMENTAL_AUTH_TRANSACTION_TYPES.has(value));
}

function canRowConfigure3ds(row: Pick<ChannelCapability, 'channelId' | 'businessType'>) {
    const channel = channelOptions.value.find((item) => item.id === row.channelId);
    return row.businessType === 'ACQUIRING' && channel?.supportAcquiring === 1 && channel.support3ds === 1;
}
</script>

<style scoped>
.tag-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}

.tag-list-left {
    justify-content: flex-start;
}

</style>
