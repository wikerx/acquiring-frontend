<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.access.envMode')">
                <el-select v-model="query.envMode" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in envOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.access.interactionMode')">
                <el-select v-model="query.interactionMode" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in interactionOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.configStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
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
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:access:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:access:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows[0])" v-hasPermi="'channel:access:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="channelName" :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.access.envMode')" width="100" align="center"><template #default="{ row }">{{ optionLabel(envOptions, row.envMode) }}</template></el-table-column>
            <el-table-column prop="baseUrl" :label="t('channel.access.baseUrl')" min-width="240" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.access.interactionMode')" min-width="140" align="center"><template #default="{ row }">{{ optionLabel(interactionOptions, row.interactionMode) }}</template></el-table-column>
            <el-table-column prop="channelMerchantNo" :label="t('channel.access.channelMerchantNo')" min-width="150" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="apiKeyMasked" :label="t('channel.access.apiKey')" min-width="140" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.configStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:access:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.updateTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:access:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:access:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:access:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </el-table>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <el-dialog :title="t('channel.access.detailTitle')" v-model="detailVisible" width="720px" append-to-body destroy-on-close>
            <el-alert class="mb12" type="warning" :closable="false" :title="t('channel.access.sensitiveAlert')" />
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.common.channel')">{{ detailRow.channelName }} ({{ detailRow.channelCode }})</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.envMode')">{{ optionLabel(envOptions, detailRow.envMode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.baseUrl')">{{ detailRow.baseUrl }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.callbackUrl')">{{ detailRow.callbackUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.interactionMode')">{{ optionLabel(interactionOptions, detailRow.interactionMode) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.channelMerchantNo')">{{ detailRow.channelMerchantNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.apiKey')">{{ detailRow.apiKeyMasked || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.apiSecret')">{{ detailRow.apiSecretMasked || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.clientCertPath')">{{ detailRow.clientCertPath || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.clientCertPassword')">{{ detailRow.clientCertPasswordMasked || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.serverCertPath')">{{ detailRow.serverCertPath || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.access.extraConfig')">{{ detailRow.extraConfigJson || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.configStatus)">{{ statusText(detailRow.configStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
            <template #footer><div class="center-dialog-footer"><el-button @click="detailVisible = false">{{ t('channel.common.close') }}</el-button></div></template>
        </el-dialog>

        <el-dialog :title="formMode === 'create' ? t('channel.access.addTitle') : t('channel.access.editTitle')" v-model="formVisible" width="720px" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="128px" size="small">
                <el-form-item :label="t('channel.common.channel')" prop="channelId"><el-select v-model="form.channelId" filterable style="width:100%"><el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" /></el-select></el-form-item>
                <el-form-item :label="t('channel.access.envMode')" prop="envMode"><el-select v-model="form.envMode" style="width:100%"><el-option v-for="item in envOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="t('channel.access.baseUrl')" prop="baseUrl"><el-input v-model.trim="form.baseUrl" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.access.callbackUrl')"><el-input v-model.trim="form.callbackUrl" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.access.interactionMode')" prop="interactionMode"><el-select v-model="form.interactionMode" filterable style="width:100%"><el-option v-for="item in interactionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-form-item :label="t('channel.access.channelMerchantNo')"><el-input v-model.trim="form.channelMerchantNo" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.access.apiKey')" prop="apiKey"><el-input v-model.trim="form.apiKey" :placeholder="formMode === 'edit' ? t('channel.access.keepSecretPlaceholder') : ''" maxlength="256" /></el-form-item>
                <el-form-item :label="t('channel.access.apiSecret')" prop="apiSecret"><el-input v-model.trim="form.apiSecret" :placeholder="formMode === 'edit' ? t('channel.access.keepSecretPlaceholder') : ''" maxlength="512" show-password /></el-form-item>
                <el-form-item :label="t('channel.access.clientCertPath')"><el-input v-model.trim="form.clientCertPath" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.access.clientCertPassword')"><el-input v-model.trim="form.clientCertPassword" :placeholder="formMode === 'edit' ? t('channel.access.keepSecretPlaceholder') : ''" maxlength="256" show-password /></el-form-item>
                <el-form-item :label="t('channel.access.serverCertPath')"><el-input v-model.trim="form.serverCertPath" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.access.extraConfigJson')"><el-input v-model="form.extraConfigJson" type="textarea" :rows="3" maxlength="2000" /></el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="configStatus"><el-select v-model="form.configStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
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
import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import { createChannelAccessConfig, deleteChannelAccessConfig, getChannelAccessConfig, searchChannelAccessConfigs, updateChannelAccessConfig, updateChannelAccessConfigStatus, type ChannelAccessConfig, type ChannelOption } from '@/api/channel';
import { channelOptionLabel, loadChannelOptions, loadDictOptions, optionLabel, statusText, statusType, type SelectOption } from '../shared';

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelAccessConfig[]>([]);
const selectedRows = ref<ChannelAccessConfig[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelAccessConfig | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const channelOptions = ref<ChannelOption[]>([]);
const envOptions = ref<SelectOption[]>([]);
const interactionOptions = ref<SelectOption[]>([]);

const query = reactive({
    channelId: undefined as number | undefined,
    envMode: '',
    interactionMode: '',
    configStatus: undefined as number | undefined,
});

const emptyForm = () => ({
    id: 0,
    channelId: undefined as number | undefined,
    envMode: 'TEST',
    baseUrl: '',
    callbackUrl: '',
    interactionMode: '',
    channelMerchantNo: '',
    apiKey: '',
    apiSecret: '',
    clientCertPath: '',
    clientCertPassword: '',
    serverCertPath: '',
    extraConfigJson: '',
    configStatus: 1,
    remark: '',
});
const form = reactive(emptyForm());
const rules: FormRules = {
    channelId: [{ required: true, message: t('channel.access.requiredChannel'), trigger: 'change' }],
    envMode: [{ required: true, message: t('channel.access.requiredEnvMode'), trigger: 'change' }],
    baseUrl: [{ required: true, message: t('channel.access.requiredBaseUrl'), trigger: 'blur' }],
    interactionMode: [{ required: true, message: t('channel.access.requiredInteractionMode'), trigger: 'change' }],
    configStatus: [{ required: true, message: t('channel.access.requiredStatus'), trigger: 'change' }],
};

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => {
    loadOptions();
});

async function loadOptions() {
    const [channels, envs, interactions] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_env_mode', String(locale.value)),
        loadDictOptions('channel_interaction_mode', String(locale.value)),
    ]);
    channelOptions.value = channels;
    envOptions.value = envs;
    interactionOptions.value = interactions;
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelAccessConfigs({ pageNo: page.value, pageSize: pageSize.value, ...query });
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
    query.envMode = '';
    query.interactionMode = '';
    query.configStatus = undefined;
    handleSearch();
}

async function openDetail(row: ChannelAccessConfig) {
    detailRow.value = await getChannelAccessConfig(row.id);
    detailVisible.value = true;
}

function openForm(mode: 'create' | 'edit', row?: ChannelAccessConfig) {
    formMode.value = mode;
    Object.assign(form, emptyForm(), row || {}, {
        apiKey: '',
        apiSecret: '',
        clientCertPassword: '',
    });
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (formMode.value === 'create') {
        await createChannelAccessConfig(form);
    } else {
        await updateChannelAccessConfig(form.id, form);
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

async function toggleStatus(row: ChannelAccessConfig) {
    await updateChannelAccessConfigStatus(row.id, row.configStatus === 1 ? 0 : 1);
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(row?: ChannelAccessConfig) {
    if (!row) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.access.deleteConfirm', { name: row.channelName }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    await deleteChannelAccessConfig(row.id);
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}
</script>

<style scoped>
.mb12 {
    margin-bottom: 12px;
}

.center-dialog-footer {
    display: flex;
    justify-content: center;
}
</style>
