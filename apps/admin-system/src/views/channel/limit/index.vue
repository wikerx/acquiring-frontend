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
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows[0])" v-hasPermi="'channel:limit:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="channelName" :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center"><template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template></el-table-column>
            <el-table-column :label="t('channel.common.paymentMethod')" min-width="140" align="center"><template #default="{ row }">{{ optionLabel(paymentOptions, row.paymentMethod) }}</template></el-table-column>
            <el-table-column :label="t('channel.common.cardBrand')" min-width="130" align="center"><template #default="{ row }">{{ optionLabel(cardBrandOptions, row.cardBrand) }}</template></el-table-column>
            <el-table-column :label="t('channel.limit.limitType')" min-width="130" align="center"><template #default="{ row }">{{ optionLabel(limitTypeOptions, row.limitType) }}</template></el-table-column>
            <el-table-column :label="t('channel.limit.limitAmount')" min-width="130" align="center">
                <template #default="{ row }">{{ row.limitAmount }} {{ row.limitCurrency }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.limit.effectiveRange')" min-width="230" align="center">
                <template #default="{ row }">
                    <BaseDateTime :value="row.effectiveStartTime" /> - <BaseDateTime :value="row.effectiveEndTime" />
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.ruleStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:limit:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:limit:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:limit:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:limit:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.limit.detailTitle')" v-model="detailVisible" width="700px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.common.channel')">{{ detailRow.channelName }} ({{ detailRow.channelCode }})</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.paymentMethod')">{{ optionLabel(paymentOptions, detailRow.paymentMethod) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.cardBrand')">{{ optionLabel(cardBrandOptions, detailRow.cardBrand) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.limitType')">{{ optionLabel(limitTypeOptions, detailRow.limitType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.limitCurrency')">{{ detailRow.limitCurrency }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.limitAmount')">{{ detailRow.limitAmount }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.effectiveStart')"><BaseDateTime :value="detailRow.effectiveStartTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.limit.effectiveEnd')"><BaseDateTime :value="detailRow.effectiveEndTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.ruleStatus)">{{ statusText(detailRow.ruleStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="center-dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('channel.limit.addTitle') : t('channel.limit.editTitle')" v-model="formVisible" width="680px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
                <el-form-item :label="t('channel.common.channel')" prop="channelId"><el-select v-model="form.channelId" filterable style="width:100%" @change="handleScopeChange"><el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.businessType')" prop="businessType"><el-select v-model="form.businessType" style="width:100%" @change="handleScopeChange"><el-option v-for="item in businessOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.paymentMethod')"><el-select v-model="form.paymentMethod" clearable filterable style="width:100%" @change="handlePaymentMethodChange"><el-option :label="t('channel.common.all')" value="ALL" /><el-option v-for="item in formPaymentOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item v-if="isBankCardPayment" :label="t('channel.common.cardBrand')"><el-select v-model="form.cardBrand" clearable filterable style="width:100%"><el-option :label="t('channel.common.all')" value="ALL" /><el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="t('channel.limit.limitType')" prop="limitType"><el-select v-model="form.limitType" filterable style="width:100%"><el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="t('channel.limit.limitAmount')" prop="limitAmount"><el-input-number v-model="form.limitAmount" :min="0" :precision="2" style="width:100%" /></el-form-item>
                <el-form-item :label="t('channel.limit.effectiveRange')">
                    <el-date-picker v-model="effectiveRange" type="datetimerange" :range-separator="t('channel.limit.rangeSeparator')" :start-placeholder="t('channel.limit.startPlaceholder')" :end-placeholder="t('channel.limit.endPlaceholder')" value-format="YYYY-MM-DDTHH:mm:ss" style="width:100%" @change="syncRange" />
                </el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="ruleStatus"><el-select v-model="form.ruleStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
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
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { createChannelLimit, deleteChannelLimit, getChannelLimit, searchChannelCapabilities, searchChannelLimits, updateChannelLimit, updateChannelLimitStatus, type ChannelLimitRule, type ChannelOption } from '@/api/channel';
import { channelOptionLabel, loadChannelOptions, loadDictOptions, optionLabel, statusText, statusType, type SelectOption } from '../shared';

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
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const effectiveRange = ref<[string, string] | []>([]);
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const paymentOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const limitTypeOptions = ref<SelectOption[]>([]);
const enabledCapabilityMethods = ref<string[]>([]);

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
    cardBrand: 'ALL',
    limitType: '',
    limitAmount: 0,
    effectiveStartTime: '',
    effectiveEndTime: '',
    ruleStatus: 1,
    remark: '',
});
const form = reactive(emptyForm());
const rules: FormRules = {
    channelId: [{ required: true, message: t('channel.limit.requiredChannel'), trigger: 'change' }],
    businessType: [{ required: true, message: t('channel.limit.requiredBusinessType'), trigger: 'change' }],
    limitType: [{ required: true, message: t('channel.limit.requiredLimitType'), trigger: 'change' }],
    limitAmount: [{ required: true, message: t('channel.limit.requiredLimitAmount'), trigger: 'blur' }],
    ruleStatus: [{ required: true, message: t('channel.limit.requiredStatus'), trigger: 'change' }],
};
const isBankCardPayment = computed(() => form.paymentMethod === 'BANK_CARD');
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
    await refreshCapabilityMethods();
    syncConditionalFields();
    effectiveRange.value = form.effectiveStartTime && form.effectiveEndTime ? [form.effectiveStartTime, form.effectiveEndTime] : [];
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function handleScopeChange() {
    await refreshCapabilityMethods();
    if (form.paymentMethod !== 'ALL' && !formPaymentOptions.value.some((item) => item.value === form.paymentMethod)) {
        form.paymentMethod = 'ALL';
    }
    syncConditionalFields();
}

function handlePaymentMethodChange() {
    syncConditionalFields();
}

function syncConditionalFields() {
    if (!isBankCardPayment.value) {
        form.cardBrand = 'ALL';
    }
}

function syncRange(value: [string, string] | null) {
    form.effectiveStartTime = value?.[0] || '';
    form.effectiveEndTime = value?.[1] || '';
}

async function submitForm() {
    syncConditionalFields();
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const payload = { ...form, transactionType: 'ALL' };
    if (formMode.value === 'create') {
        await createChannelLimit(payload);
    } else {
        await updateChannelLimit(form.id, payload);
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function refreshCapabilityMethods() {
    if (!form.channelId || !form.businessType) {
        enabledCapabilityMethods.value = [];
        return;
    }
    const result = await searchChannelCapabilities({
        pageNo: 1,
        pageSize: 200,
        channelId: form.channelId,
        businessType: form.businessType,
        capabilityStatus: 1,
    });
    enabledCapabilityMethods.value = Array.from(new Set(result.records.map((item) => item.paymentMethod).filter(Boolean)));
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

async function toggleStatus(row: ChannelLimitRule) {
    await updateChannelLimitStatus(row.id, row.ruleStatus === 1 ? 0 : 1);
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(row?: ChannelLimitRule) {
    if (!row) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.limit.deleteConfirm', { name: row.channelName }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    await deleteChannelLimit(row.id);
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}
</script>

<style scoped>
.center-dialog-footer {
    display: flex;
    justify-content: center;
}
</style>
