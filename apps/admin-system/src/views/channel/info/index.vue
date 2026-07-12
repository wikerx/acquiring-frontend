<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="82px">
            <el-form-item :label="t('channel.common.keyword')">
                <el-input v-model="query.keyword" :placeholder="t('channel.common.keywordPlaceholder')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.channelStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option :label="t('channel.common.enabled')" :value="1" />
                    <el-option :label="t('channel.common.disabled')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.acquiring')">
                <el-select v-model="query.supportAcquiring" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option :label="t('channel.common.supported')" :value="1" />
                    <el-option :label="t('channel.common.unsupported')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.payout')">
                <el-select v-model="query.supportPayout" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option :label="t('channel.common.supported')" :value="1" />
                    <el-option :label="t('channel.common.unsupported')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('channel.common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('channel.common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:info:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:info:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:info:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="channel-info" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="channelCode" :label="t('channel.info.channelCode')" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="channelCnName" :label="t('channel.info.channelCnName')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="channelEnName" :label="t('channel.info.channelEnName')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.info.acquiringMethods')" min-width="180" align="center">
                <template #default="{ row }">
                    <div class="logo-line">
                        <PaymentLogoGroup :keys="paymentKeys(row.acquiringPaymentMethods)" fallback="text" size="sm" />
                        <span v-if="!row.acquiringPaymentMethods?.length">-</span>
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.info.payoutMethods')" min-width="160" align="center">
                <template #default="{ row }">{{ paymentMethodText(row.payoutPaymentMethods) }}</template>
            </el-table-column>
            <el-table-column label="3DS" width="80" align="center">
                <template #default="{ row }">
                    <el-switch
                        :model-value="row.support3ds"
                        :active-value="1"
                        :inactive-value="0"
                        :disabled="row.supportAcquiring !== 1"
                        @change="toggle3ds(row)"
                        v-hasPermi="'channel:info:edit'"
                    />
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.channelStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:info:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.updateTime')" min-width="170" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:info:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:info:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:info:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.info.detailTitle')" v-model="detailVisible" width="680px" append-to-body destroy-on-close>
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.info.channelCode')">{{ detailRow.channelCode }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.channelCnName')">{{ detailRow.channelCnName }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.channelEnName')">{{ detailRow.channelEnName }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.channelStatus)">{{ statusText(detailRow.channelStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.supportAcquiring')">
                    <el-tag size="small" effect="plain" :type="statusType(detailRow.supportAcquiring)">{{ yesNoText(detailRow.supportAcquiring, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.supportPayout')">
                    <el-tag size="small" effect="plain" :type="statusType(detailRow.supportPayout)">{{ yesNoText(detailRow.supportPayout, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.support3ds')">
                    <el-tag size="small" effect="plain" :type="statusType(detailRow.support3ds)">{{ yesNoText(detailRow.support3ds, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.acquiringMethods')">
                    <div v-if="detailRow.acquiringPaymentMethods?.length" class="tag-list">
                        <el-tag v-for="method in detailRow.acquiringPaymentMethods" :key="method" size="small" effect="plain">{{ optionLabel(paymentOptions, method) }}</el-tag>
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.payoutMethods')">{{ paymentMethodText(detailRow.payoutPaymentMethods) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.defaultRequestUrl')">{{ detailRow.defaultRequestUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.defaultInteractionMode')">{{ detailRow.defaultInteractionMode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.sort')">{{ detailRow.sortOrder ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('channel.info.addTitle') : t('channel.info.editTitle')" v-model="formVisible" width="640px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
                <el-form-item :label="t('channel.info.channelCode')" prop="channelCode"><el-input v-model.trim="form.channelCode" :disabled="formMode === 'edit'" maxlength="64" placeholder="STRIPE" @input="form.channelCode = form.channelCode.toUpperCase()" /></el-form-item>
                <el-form-item :label="t('channel.info.channelCnName')" prop="channelCnName"><el-input v-model.trim="form.channelCnName" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.info.channelEnName')" prop="channelEnName"><el-input v-model.trim="form.channelEnName" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="channelStatus"><el-select v-model="form.channelStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.info.supportAcquiring')" prop="supportAcquiring"><el-switch v-model="form.supportAcquiring" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.info.supportPayout')" prop="supportPayout"><el-switch v-model="form.supportPayout" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item v-if="canConfigure3ds" :label="t('channel.info.support3ds')" prop="support3ds"><el-switch v-model="form.support3ds" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.info.defaultRequestUrl')" prop="defaultRequestUrl"><el-input v-model.trim="form.defaultRequestUrl" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.info.defaultInteractionMode')"><el-select v-model="form.defaultInteractionMode" clearable filterable style="width:100%"><el-option v-for="item in interactionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
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
import { createChannel, deleteChannel, getChannel, searchChannelCapabilities, searchChannels, updateChannel, updateChannelStatus, type ChannelCapability, type ChannelInfo } from '@/api/channel';
import { loadDictOptions, optionLabel, paymentLogoKeys, showChannelError, statusText, statusType, yesNoText, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelInfo[]>([]);
const selectedRows = ref<ChannelInfo[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelInfo | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const editingRowSnapshot = ref<ChannelInfo | null>(null);
const paymentOptions = ref<SelectOption[]>([]);
const interactionOptions = ref<SelectOption[]>([]);

const query = reactive({
    keyword: '',
    channelStatus: undefined as number | undefined,
    supportAcquiring: undefined as number | undefined,
    supportPayout: undefined as number | undefined,
    support3ds: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    channelCode: '',
    channelCnName: '',
    channelEnName: '',
    channelStatus: 1,
    supportAcquiring: 1,
    supportPayout: 0,
    support3ds: 1,
    defaultRequestUrl: '',
    defaultInteractionMode: '',
    sortOrder: 0,
    remark: '',
});
const form = reactive(emptyForm());
const canConfigure3ds = computed(() => form.supportAcquiring === 1);
const rules: FormRules = {
    channelCode: [{ required: true, message: t('channel.info.requiredChannelCode'), trigger: 'blur' }],
    channelCnName: [{ required: true, message: t('channel.info.requiredChannelCnName'), trigger: 'blur' }],
    channelEnName: [{ required: true, message: t('channel.info.requiredChannelEnName'), trigger: 'blur' }],
    channelStatus: [{ required: true, message: t('channel.info.requiredStatus'), trigger: 'change' }],
    supportAcquiring: [{ required: true, message: t('channel.info.requiredSupportAcquiring'), trigger: 'change' }],
    supportPayout: [{ required: true, message: t('channel.info.requiredSupportPayout'), trigger: 'change' }],
    support3ds: [{ required: true, message: t('channel.info.requiredSupport3ds'), trigger: 'change' }],
    defaultRequestUrl: [{
        validator: (_rule, value, callback) => {
            if (!value || /^https?:\/\/.+/i.test(String(value).trim())) {
                callback();
                return;
            }
            callback(new Error(t('channel.info.invalidDefaultRequestUrl')));
        },
        trigger: 'blur',
    }],
};

onMounted(async () => {
    await Promise.all([
        loadData(),
        loadOptions(),
    ]);
});

watch(locale, () => {
    loadOptions();
});

watch(() => form.supportAcquiring, () => {
    syncChannelSupportFields();
});

async function loadOptions() {
    const [acquiringPayments, payoutPayments, interactions] = await Promise.all([
        loadDictOptions('acquiring_payment_method', String(locale.value)),
        loadDictOptions('payout_payment_method', String(locale.value)),
        loadDictOptions('channel_interaction_mode', String(locale.value)),
    ]);
    paymentOptions.value = [...acquiringPayments, ...payoutPayments];
    interactionOptions.value = interactions;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannels({ pageNo: page.value, pageSize: pageSize.value, ...query });
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
    query.keyword = '';
    query.channelStatus = undefined;
    query.supportAcquiring = undefined;
    query.supportPayout = undefined;
    query.support3ds = undefined;
    handleSearch();
}

async function openDetail(row: ChannelInfo) {
    detailRow.value = await getChannel(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: ChannelInfo) {
    formMode.value = mode;
    editingRowSnapshot.value = row ? { ...row } : null;
    Object.assign(form, emptyForm(), row || {});
    syncChannelSupportFields();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submitForm() {
    syncChannelSupportFields();
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    try {
        if (formMode.value === 'create') {
            await createChannel(form);
        } else {
            const confirmed = await confirmChannelCapabilityImpact(editingRowSnapshot.value, form);
            if (!confirmed) {
                return;
            }
            await updateChannel(form.id, form);
        }
    } catch (error) {
        await showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

function syncChannelSupportFields() {
    if (!canConfigure3ds.value) {
        form.support3ds = 0;
    }
}

async function toggleStatus(row: ChannelInfo) {
    const nextValue = row.channelStatus === 1 ? 0 : 1;
    const action = nextValue === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: channelStatusTargetName(row) }), t('common.operationConfirm'), { type: nextValue === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    let confirmed = false;
    try {
        confirmed = await confirmChannelCapabilityImpact(row, { channelStatus: nextValue });
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    if (!confirmed) {
        return;
    }
    try {
        await updateChannelStatus(row.id, nextValue);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function toggle3ds(row: ChannelInfo) {
    if (row.supportAcquiring !== 1) {
        return;
    }
    const nextValue = row.support3ds === 1 ? 0 : 1;
    const action = nextValue === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: `${channelStatusTargetName(row)} ${t('channel.info.support3ds')}` }), t('common.operationConfirm'), { type: nextValue === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    let confirmed = false;
    try {
        confirmed = await confirmChannelCapabilityImpact(row, { support3ds: nextValue });
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    if (!confirmed) {
        return;
    }
    try {
        await updateChannel(row.id, {
            ...row,
            support3ds: nextValue,
        });
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function confirmChannelCapabilityImpact(current: ChannelInfo | null, next: Partial<ChannelInfo>) {
    if (!current?.id) {
        return true;
    }
    const disablingChannel = current.channelStatus === 1 && next.channelStatus === 0;
    const disabling3ds = current.support3ds === 1 && next.support3ds === 0;
    if (!disablingChannel && !disabling3ds) {
        return true;
    }

    const prompts: string[] = [];
    if (disablingChannel && await hasActiveCapabilities(current.id)) {
        prompts.push(t('channel.info.disableChannelWithActiveCapabilityConfirm'));
    }
    if (disabling3ds && await hasActive3dsCapabilities(current.id)) {
        prompts.push(t('channel.info.disable3dsWithActiveCapabilityConfirm'));
    }
    if (!prompts.length) {
        return true;
    }

    try {
        await ElMessageBox.confirm(prompts.join('\n'), t('common.operationConfirm'), { type: 'warning' });
        return true;
    } catch {
        return false;
    }
}

async function hasActiveCapabilities(channelId: number) {
    const result = await searchChannelCapabilities({
        pageNo: 1,
        pageSize: 1,
        channelId,
        capabilityStatus: 1,
    });
    return result.total > 0;
}

async function hasActive3dsCapabilities(channelId: number) {
    const pageSize = 500;
    let pageNo = 1;
    while (true) {
        const result = await searchChannelCapabilities({
            pageNo,
            pageSize,
            channelId,
            capabilityStatus: 1,
        });
        if (result.records.some((item: ChannelCapability) => item.support3ds === 1)) {
            return true;
        }
        if (result.records.length < pageSize || pageNo * pageSize >= result.total) {
            return false;
        }
        pageNo += 1;
    }
}

async function handleDelete(target?: ChannelInfo | ChannelInfo[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.info.deleteConfirm', { name: targets.map((item) => item.channelCnName).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannel(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function paymentKeys(values?: string[]): PaymentLogoKey[] {
    return (values || []).flatMap((value) => paymentLogoKeys(value, paymentOptions.value.find((item) => item.value === value)));
}

function paymentMethodText(values?: string[]) {
    if (!values?.length) {
        return '-';
    }
    return values.map((value) => optionLabel(paymentOptions.value, value)).join(', ');
}

function channelStatusTargetName(row: ChannelInfo) {
    return row.channelCnName || row.channelEnName || row.channelCode || String(row.id);
}
</script>

<style scoped>
.logo-line {
    display: flex;
    justify-content: center;
}


.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}
</style>
