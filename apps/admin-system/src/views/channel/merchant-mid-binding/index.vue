<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.binding.merchantId')">
                <el-select
                    v-model="query.merchantId"
                    :placeholder="t('channel.binding.merchantIdPlaceholder')"
                    clearable
                    filterable
                    remote
                    :remote-method="searchMerchantOptions"
                    :loading="merchantLoading"
                    @visible-change="handleMerchantSelectVisible"
                >
                    <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.mid.channelMid')">
                <el-select v-model="query.midConfigId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in midOptions" :key="item.id" :label="midOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.bindingStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
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
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:mid-binding:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:mid-binding:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:mid-binding:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="merchant-channel-mid-binding" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="merchantId" :label="t('channel.binding.merchantId')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ channelDisplayText(row) }}</template>
            </el-table-column>
            <el-table-column prop="channelMid" :label="t('channel.mid.channelMid')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.bindingStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:mid-binding:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.binding.effectiveTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" /></template></el-table-column>
            <el-table-column :label="t('channel.binding.expireTime')" min-width="170" align="center">
                <template #default="{ row }">
                    <BaseDateTime v-if="row.expireTime" :value="row.expireTime" />
                    <el-tag v-else size="small" type="success" effect="plain">{{ t('channel.binding.neverExpire') }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.common.updateTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:mid-binding:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:mid-binding:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:mid-binding:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('channel.binding.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.binding.merchantId')">{{ detailRow.merchantId }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.channel')">{{ channelDisplayText(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.mid.channelMid')">{{ detailRow.channelMid }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.bindingStatus)">{{ statusText(detailRow.bindingStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.binding.effectiveTime')"><BaseDateTime :value="detailRow.effectiveTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.binding.expireTime')">
                    <BaseDateTime v-if="detailRow.expireTime" :value="detailRow.expireTime" />
                    <el-tag v-else size="small" type="success" effect="plain">{{ t('channel.binding.neverExpire') }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="formMode === 'create' ? t('channel.binding.addTitle') : t('channel.binding.editTitle')" v-model="formVisible" width="640px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="128px" size="small">
                <el-form-item :label="t('channel.binding.merchantId')" prop="merchantId">
                    <el-select
                        v-model="form.merchantId"
                        :placeholder="t('channel.binding.merchantIdPlaceholder')"
                        filterable
                        remote
                        :remote-method="searchMerchantOptions"
                        :loading="merchantLoading"
                        :disabled="formMode === 'edit'"
                        style="width:100%"
                        @visible-change="handleMerchantSelectVisible"
                    >
                        <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.mid.channelMid')" prop="midConfigId">
                    <el-select v-model="form.midConfigId" :placeholder="t('channel.common.pleaseSelect')" filterable style="width:100%" :disabled="formMode === 'edit'">
                        <el-option v-for="item in midOptions" :key="item.id" :label="midOptionLabel(item)" :value="item.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="bindingStatus"><el-select v-model="form.bindingStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
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
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import {
    createMerchantChannelMidBinding,
    deleteMerchantChannelMidBinding,
    getMerchantChannelMidBinding,
    searchChannelMids,
    searchMerchantChannelMidBindings,
    updateMerchantChannelMidBinding,
    updateMerchantChannelMidBindingStatus,
    type ChannelMidConfig,
    type ChannelOption,
    type MerchantChannelMidBinding,
} from '@/api/channel';
import {
    channelDisplayText,
    channelOptionLabel,
    loadChannelOptions,
    showChannelError,
    statusText,
    statusType,
} from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<MerchantChannelMidBinding[]>([]);
const selectedRows = ref<MerchantChannelMidBinding[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<MerchantChannelMidBinding | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const channelOptions = ref<ChannelOption[]>([]);
const midOptions = ref<ChannelMidConfig[]>([]);
const merchantOptions = ref<MerchantInfo[]>([]);
const merchantLoading = ref(false);

const query = reactive({
    merchantId: '',
    channelId: undefined as number | undefined,
    midConfigId: undefined as number | undefined,
    bindingStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    merchantId: '',
    midConfigId: undefined as number | undefined,
    bindingStatus: 1,
    remark: '',
});
const form = reactive(emptyForm());

const rules: FormRules = {
    merchantId: [{ required: true, message: t('channel.binding.requiredMerchantId'), trigger: 'change' }],
    midConfigId: [{ required: true, message: t('channel.binding.requiredMidConfig'), trigger: 'change' }],
    bindingStatus: [{ required: true, message: t('channel.info.requiredStatus'), trigger: 'change' }],
};

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => {
    loadOptions();
});

async function loadOptions() {
    const [channels, mids] = await Promise.all([
        loadChannelOptions(),
        searchChannelMids({ pageNo: 1, pageSize: 500, midStatus: 1 }),
    ]);
    channelOptions.value = channels;
    midOptions.value = mids.records;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchMerchantChannelMidBindings({ pageNo: page.value, pageSize: pageSize.value, ...query });
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
    query.merchantId = '';
    query.channelId = undefined;
    query.midConfigId = undefined;
    query.bindingStatus = undefined;
    handleSearch();
}

async function openDetail(row: MerchantChannelMidBinding) {
    detailRow.value = await getMerchantChannelMidBinding(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: MerchantChannelMidBinding) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {});
    syncCurrentMerchantOption();
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    const payload = {
        merchantId: form.merchantId,
        midConfigId: form.midConfigId,
        bindingStatus: form.bindingStatus,
        remark: blankToUndefined(form.remark),
    };
    try {
        if (formMode.value === 'create') {
            await createMerchantChannelMidBinding(payload);
        } else {
            await updateMerchantChannelMidBinding(form.id, payload);
        }
    } catch (error) {
        await showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: MerchantChannelMidBinding) {
    const nextStatus = row.bindingStatus === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: bindingTargetName(row) }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateMerchantChannelMidBindingStatus(row.id, nextStatus);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(target?: MerchantChannelMidBinding | MerchantChannelMidBinding[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.binding.deleteConfirm', { name: targets.map(bindingTargetName).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteMerchantChannelMidBinding(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function midOptionLabel(item: ChannelMidConfig) {
    return `${item.channelCode} / ${item.channelMid}`;
}

async function searchMerchantOptions(keyword = '') {
    merchantLoading.value = true;
    try {
        const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: keyword.trim() || undefined });
        merchantOptions.value = mergeMerchantOptions(result.records || []);
    } catch (error) {
        await showChannelError(error, t('common.loadFailed'), t('common.loadFailed'));
    } finally {
        merchantLoading.value = false;
    }
}

function handleMerchantSelectVisible(visible: boolean) {
    if (visible && !merchantOptions.value.length) {
        searchMerchantOptions();
    }
}

function syncCurrentMerchantOption() {
    if (!form.merchantId) {
        return;
    }
    merchantOptions.value = mergeMerchantOptions([{
        id: 0,
        merchantId: form.merchantId,
        merchantName: form.merchantId,
        merchantStatus: 1,
        merchantCategoryCode: '',
        countryCode: '',
        settlementCurrency: '',
        timezone: '',
        riskLevel: 0,
    }]);
}

function mergeMerchantOptions(items: MerchantInfo[]) {
    const map = new Map<string, MerchantInfo>();
    for (const item of merchantOptions.value) {
        map.set(item.merchantId, item);
    }
    for (const item of items) {
        map.set(item.merchantId, item);
    }
    return Array.from(map.values());
}

function merchantOptionLabel(item: MerchantInfo) {
    return `${item.merchantId}（${item.merchantName || '-'}）`;
}

function bindingTargetName(row: MerchantChannelMidBinding) {
    return `${row.merchantId} - ${row.channelMid}`.trim();
}

function blankToUndefined(value?: string) {
    const trimmed = String(value || '').trim();
    return trimmed || undefined;
}
</script>
