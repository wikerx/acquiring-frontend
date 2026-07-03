<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="`${item.channelName} (${item.channelCode})`" :value="item.id" />
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
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows[0])" v-hasPermi="'channel:capability:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="channelName" :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center">
                <template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.common.paymentMethod')" min-width="150" align="center">
                <template #default="{ row }">
                    <div class="logo-line">
                        <PaymentLogoGroup :keys="paymentLogo(row.paymentMethod)" fallback="text" size="sm" />
                        <span>{{ optionLabel(paymentOptionsFor(row.businessType), row.paymentMethod) }}</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.transactionType')" min-width="130" align="center">
                <template #default="{ row }">{{ optionLabel(transactionOptions, row.transactionType) }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.common.currency')" min-width="150" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ row.currencyCodes?.join(', ') || '-' }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.common.cardBrand')" min-width="210" align="center">
                <template #default="{ row }">
                    <PaymentLogoGroup v-if="row.cardBrands?.length" :keys="cardLogo(row.cardBrands)" fallback="text" size="sm" align="center" />
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.capability.incrementalAuthorization')" width="100" align="center">
                <template #default="{ row }">{{ yesNoText(row.supportIncrementalAuthorization, t('channel.common.yes'), t('channel.common.no')) }}</template>
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
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.capability.detailTitle')" v-model="detailVisible" width="700px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.common.channel')">{{ detailRow.channelName }} ({{ detailRow.channelCode }})</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.paymentMethod')">{{ optionLabel(paymentOptionsFor(detailRow.businessType), detailRow.paymentMethod) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.transactionType')">{{ optionLabel(transactionOptions, detailRow.transactionType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.currencies')">{{ detailRow.currencyCodes?.join(', ') || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.cardBrand')">{{ arrayText(detailRow.cardBrands, cardBrandOptions) }}</el-descriptions-item>
                <el-descriptions-item label="3DS">{{ yesNoText(detailRow.support3ds, t('channel.common.yes'), t('channel.common.no')) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.capability.supportIncrementalAuthorization')">{{ yesNoText(detailRow.supportIncrementalAuthorization, t('channel.common.yes'), t('channel.common.no')) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.capabilityStatus)">{{ statusText(detailRow.capabilityStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.sort')">{{ detailRow.sortOrder ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="center-dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('channel.capability.addTitle') : t('channel.capability.editTitle')" v-model="formVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
                <el-form-item :label="t('channel.common.channel')" prop="channelId">
                    <el-select v-model="form.channelId" :placeholder="t('channel.common.pleaseSelect')" filterable style="width:100%">
                        <el-option v-for="item in channelOptions" :key="item.id" :label="`${item.channelName} (${item.channelCode})`" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.businessType')" prop="businessType">
                    <el-select v-model="form.businessType" style="width:100%" @change="handleBusinessChange">
                        <el-option v-for="item in businessOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.paymentMethod')" prop="paymentMethod">
                    <el-select v-model="form.paymentMethod" filterable style="width:100%" @change="handlePaymentChange">
                        <el-option v-for="item in paymentOptionsFor(form.businessType)" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="form.businessType === 'ACQUIRING'" :label="t('channel.common.transactionType')" prop="transactionType">
                    <el-select v-model="form.transactionType" filterable style="width:100%">
                        <el-option v-for="item in transactionOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.currencies')" prop="currencyCodes">
                    <el-select v-model="form.currencyCodes" multiple filterable allow-create default-first-option style="width:100%" :placeholder="t('channel.capability.currencyPlaceholder')">
                        <el-option label="USD" value="USD" />
                        <el-option label="EUR" value="EUR" />
                        <el-option label="GBP" value="GBP" />
                        <el-option label="CNY" value="CNY" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="form.paymentMethod === 'BANK_CARD'" :label="t('channel.common.cardBrand')" prop="cardBrands">
                    <el-select v-model="form.cardBrands" multiple filterable style="width:100%">
                        <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.info.support3ds')"><el-switch v-model="form.support3ds" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.capability.incrementalAuthorization')"><el-switch v-model="form.supportIncrementalAuthorization" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="capabilityStatus"><el-select v-model="form.capabilityStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.sort')"><el-input-number v-model="form.sortOrder" :min="0" style="width:100%" /></el-form-item>
                <el-form-item :label="t('channel.common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button>
                <el-button type="primary" @click="submitForm">{{ t('channel.common.confirm') }}</el-button>
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
import {
    createChannelCapability,
    deleteChannelCapability,
    getChannelCapability,
    searchChannelCapabilities,
    updateChannelCapability,
    updateChannelCapabilityStatus,
    type ChannelCapability,
    type ChannelOption,
} from '@/api/channel';
import {
    arrayText,
    cardLogoKeys,
    loadChannelOptions,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    statusText,
    statusType,
    yesNoText,
    type SelectOption,
} from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
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
    transactionType: [{ required: true, message: t('channel.capability.requiredTransactionType'), trigger: 'change' }],
    currencyCodes: [{ required: true, type: 'array', min: 1, message: t('channel.capability.requiredCurrencies'), trigger: 'change' }],
    cardBrands: [{ required: true, type: 'array', min: 1, message: t('channel.capability.requiredCardBrands'), trigger: 'change' }],
    capabilityStatus: [{ required: true, message: t('channel.capability.requiredStatus'), trigger: 'change' }],
};

const currentPaymentOptions = computed(() => paymentOptionsFor(query.businessType || 'ACQUIRING'));

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
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
    if (form.paymentMethod !== 'BANK_CARD') {
        form.cardBrands = [];
    }
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function handleBusinessChange() {
    form.paymentMethod = form.businessType === 'PAYOUT' ? (payoutPaymentOptions.value[0]?.value || '') : 'BANK_CARD';
    form.transactionType = form.businessType === 'PAYOUT' ? 'NONE' : 'PAYMENT';
    handlePaymentChange();
}

function handlePaymentChange() {
    if (form.paymentMethod !== 'BANK_CARD') {
        form.cardBrands = [];
    }
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const payload = { ...form, transactionType: form.businessType === 'PAYOUT' ? 'NONE' : form.transactionType };
    if (formMode.value === 'create') {
        await createChannelCapability(payload);
    } else {
        await updateChannelCapability(form.id, payload);
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ChannelCapability) {
    await updateChannelCapabilityStatus(row.id, row.capabilityStatus === 1 ? 0 : 1);
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(row?: ChannelCapability) {
    if (!row) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.capability.deleteConfirm', { name: row.channelName }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    await deleteChannelCapability(row.id);
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function paymentLogo(value?: string): PaymentLogoKey[] {
    return paymentLogoKeys(value, [...acquiringPaymentOptions.value, ...payoutPaymentOptions.value].find((item) => item.value === value));
}

function cardLogo(values?: string[]): PaymentLogoKey[] {
    return (values || []).flatMap((value) => cardLogoKeys(value, cardBrandOptions.value.find((item) => item.value === value)));
}
</script>

<style scoped>
.logo-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.center-dialog-footer {
    display: flex;
    justify-content: center;
}
</style>
