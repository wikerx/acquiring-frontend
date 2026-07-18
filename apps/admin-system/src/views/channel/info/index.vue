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
            <el-table-column :label="t('channel.info.connectTimeoutSeconds')" width="120" align="center">
                <template #default="{ row }">{{ secondsText(row.connectTimeoutSeconds) }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.info.readTimeoutSeconds')" width="120" align="center">
                <template #default="{ row }">{{ secondsText(row.readTimeoutSeconds) }}</template>
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

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('channel.info.detailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small" class="channel-detail-descriptions">
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
                    <div v-if="detailRow.acquiringPaymentMethods?.length" class="detail-logo-line">
                        <PaymentLogoGroup :keys="paymentKeys(detailRow.acquiringPaymentMethods)" fallback="text" size="sm" />
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.payoutMethods')">{{ paymentMethodText(detailRow.payoutPaymentMethods) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.defaultRequestUrl')">{{ detailRow.defaultRequestUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.connectTimeoutSeconds')">{{ secondsText(detailRow.connectTimeoutSeconds) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.readTimeoutSeconds')">{{ secondsText(detailRow.readTimeoutSeconds) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.info.metadataSchemas')">
                    <div v-if="detailRow.metadataSchemas?.length" class="metadata-schema-detail">
                        <div v-for="item in detailRow.metadataSchemas" :key="item.fieldKey" class="metadata-schema-detail__item">
                            <div>
                                <strong>{{ item.fieldKey }}</strong>
                                <span>{{ item.fieldLabel }}</span>
                            </div>
                            <div class="metadata-schema-detail__tags">
                                <el-tag size="small" effect="plain">{{ metadataFieldTypeText(item.fieldType) }}</el-tag>
                                <el-tag size="small" :type="item.requiredFlag === 1 ? 'danger' : 'info'" effect="plain">{{ item.requiredFlag === 1 ? t('channel.info.required') : t('channel.info.optional') }}</el-tag>
                                <el-tag size="small" :type="item.sensitiveFlag === 1 ? 'warning' : 'info'" effect="plain">{{ item.sensitiveFlag === 1 ? t('channel.info.sensitive') : t('channel.info.nonSensitive') }}</el-tag>
                                <el-tag size="small" :type="statusType(item.fieldStatus)" effect="plain">{{ statusText(item.fieldStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag>
                            </div>
                        </div>
                    </div>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.sort')">{{ detailRow.sortOrder ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <component
            :is="formOverlayComponent"
            v-model="formVisible"
            :title="formMode === 'create' ? t('channel.info.addTitle') : t('channel.info.editTitle')"
            v-bind="formOverlayProps"
            class="channel-form-overlay"
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small" class="channel-form">
                <el-form-item :label="t('channel.info.channelCode')" prop="channelCode"><el-input v-model.trim="form.channelCode" :disabled="formMode === 'edit'" maxlength="64" placeholder="STRIPE" @input="form.channelCode = form.channelCode.toUpperCase()" /></el-form-item>
                <el-form-item :label="t('channel.info.channelCnName')" prop="channelCnName"><el-input v-model.trim="form.channelCnName" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.info.channelEnName')" prop="channelEnName"><el-input v-model.trim="form.channelEnName" maxlength="128" /></el-form-item>
                <el-form-item :label="t('channel.common.status')" prop="channelStatus"><el-select v-model="form.channelStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.info.supportAcquiring')" prop="supportAcquiring"><el-switch v-model="form.supportAcquiring" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.info.supportPayout')" prop="supportPayout"><el-switch v-model="form.supportPayout" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item v-if="canConfigure3ds" :label="t('channel.info.support3ds')" prop="support3ds"><el-switch v-model="form.support3ds" :active-value="1" :inactive-value="0" /></el-form-item>
                <el-form-item :label="t('channel.info.defaultRequestUrl')" prop="defaultRequestUrl"><el-input v-model.trim="form.defaultRequestUrl" maxlength="512" /></el-form-item>
                <el-form-item :label="t('channel.info.connectTimeoutSeconds')" prop="connectTimeoutSeconds">
                    <el-input-number v-model="form.connectTimeoutSeconds" :min="1" :max="300" :precision="0" controls-position="right" style="width:180px" />
                </el-form-item>
                <el-form-item :label="t('channel.info.readTimeoutSeconds')" prop="readTimeoutSeconds">
                    <el-input-number v-model="form.readTimeoutSeconds" :min="1" :max="600" :precision="0" controls-position="right" style="width:180px" />
                </el-form-item>
                <div class="metadata-schema-panel">
                    <div class="metadata-schema-panel__header">
                        <div>
                            <div class="metadata-schema-panel__title">{{ t('channel.info.metadataSchemas') }}</div>
                            <div class="metadata-schema-panel__desc">{{ t('channel.info.metadataSchemasDesc') }}</div>
                        </div>
                        <el-button size="small" type="primary" plain :icon="Plus" @click="addMetadataSchema">{{ t('channel.info.addMetadataField') }}</el-button>
                    </div>
                    <div class="metadata-type-guide">
                        <div class="metadata-type-guide__title">{{ t('channel.info.metadataTypeGuideTitle') }}</div>
                        <div class="metadata-type-guide__items">
                            <div v-for="item in metadataTypeHelpItems" :key="item.value" class="metadata-type-guide__item">
                                <strong>{{ item.label }}</strong>
                                <span>{{ item.description }}</span>
                            </div>
                        </div>
                    </div>
                    <div v-if="form.metadataSchemas.length" class="metadata-schema-editor">
                        <div v-for="(item, index) in form.metadataSchemas" :key="item.localKey" class="metadata-schema-row">
                            <div class="metadata-schema-row__content">
                                <div class="metadata-schema-row__main">
                                    <el-form-item :label="t('channel.info.metadataKey')" required><el-input v-model.trim="item.fieldKey" maxlength="64" placeholder="merchantId" /></el-form-item>
                                    <el-form-item :label="t('channel.info.metadataLabel')" required><el-input v-model.trim="item.fieldLabel" maxlength="128" :placeholder="t('channel.info.metadataLabelPlaceholder')" /></el-form-item>
                                    <el-form-item :label="t('channel.info.metadataType')" required><el-select v-model="item.fieldType" style="width:100%"><el-option v-for="option in metadataFieldTypeOptions" :key="option.value" :label="option.label" :value="option.value" /></el-select></el-form-item>
                                    <el-form-item :label="t('channel.common.sort')" class="metadata-schema-row__sort"><el-input-number v-model="item.sortOrder" :min="0" :precision="0" controls-position="right" style="width:100%" /></el-form-item>
                                </div>
                                <div class="metadata-schema-row__toggles">
                                    <el-form-item :label="t('channel.info.required')"><el-switch v-model="item.requiredFlag" :active-value="1" :inactive-value="0" /></el-form-item>
                                    <el-form-item :label="t('channel.info.sensitive')"><el-switch v-model="item.sensitiveFlag" :active-value="1" :inactive-value="0" @change="handleMetadataSensitiveChange(item)" /></el-form-item>
                                    <el-form-item :label="t('channel.common.status')"><el-switch v-model="item.fieldStatus" :active-value="1" :inactive-value="0" /></el-form-item>
                                    <el-form-item :label="t('channel.info.placeholder')"><el-input v-model.trim="item.placeholder" maxlength="255" /></el-form-item>
                                </div>
                                <div class="metadata-schema-row__extras">
                                    <el-form-item :label="t('channel.info.defaultValue')"><el-input v-model.trim="item.defaultValue" :disabled="item.sensitiveFlag === 1" maxlength="512" /></el-form-item>
                                    <el-form-item :label="t('channel.info.validationRegex')"><el-input v-model.trim="item.validationRegex" maxlength="512" placeholder="^[A-Za-z0-9_]+$" /></el-form-item>
                                </div>
                            </div>
                            <div class="metadata-schema-row__actions">
                                <el-tooltip :content="t('channel.info.addMetadataField')" placement="top">
                                    <el-button size="small" :icon="Plus" @click="insertMetadataSchema(index)" />
                                </el-tooltip>
                                <el-tooltip :content="t('channel.common.delete')" placement="top">
                                    <el-button size="small" :icon="Delete" @click="removeMetadataSchema(index)" />
                                </el-tooltip>
                            </div>
                        </div>
                    </div>
                    <el-empty v-else :description="t('channel.info.noMetadataSchemas')" :image-size="72" />
                </div>
                <el-form-item :label="t('channel.common.sort')" class="channel-form__sort"><el-input-number v-model="form.sortOrder" :min="0" :precision="0" controls-position="right" /></el-form-item>
                <el-form-item :label="t('channel.common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('channel.common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button>
                </div>
            </template>
        </component>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElDialog, ElDrawer, ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { createChannel, deleteChannel, getChannel, searchChannelCapabilities, searchChannels, updateChannel, updateChannelStatus, type ChannelCapability, type ChannelInfo, type ChannelMetadataSchema } from '@/api/channel';
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
type EditableMetadataSchema = ChannelMetadataSchema & { localKey: string };

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
    connectTimeoutSeconds: 10,
    readTimeoutSeconds: 30,
    metadataSchemas: [] as EditableMetadataSchema[],
    sortOrder: 0,
    remark: '',
});
const form = reactive(emptyForm());
const canConfigure3ds = computed(() => form.supportAcquiring === 1);
const formOverlayComponent = computed(() => (formMode.value === 'edit' ? ElDrawer : ElDialog));
const formOverlayProps = computed(() => (
    formMode.value === 'edit'
        ? {
            appendToBody: true,
            closeOnClickModal: true,
            closeOnPressEscape: true,
            destroyOnClose: true,
            direction: 'rtl',
            size: 'min(1320px, 92vw)',
        }
        : {
            appendToBody: true,
            closeOnClickModal: true,
            closeOnPressEscape: true,
            destroyOnClose: true,
            width: 'min(1320px, calc(100vw - 40px))',
        }
));
const metadataFieldTypeOptions = computed(() => [
    { label: t('channel.info.metadataTypeOption.TEXT'), value: 'TEXT' },
    { label: t('channel.info.metadataTypeOption.PASSWORD'), value: 'PASSWORD' },
    { label: t('channel.info.metadataTypeOption.URL'), value: 'URL' },
    { label: t('channel.info.metadataTypeOption.NUMBER'), value: 'NUMBER' },
    { label: t('channel.info.metadataTypeOption.JSON'), value: 'JSON' },
    { label: t('channel.info.metadataTypeOption.TEXTAREA'), value: 'TEXTAREA' },
    { label: t('channel.info.metadataTypeOption.PRIVATE_KEY'), value: 'PRIVATE_KEY' },
    { label: t('channel.info.metadataTypeOption.PUBLIC_KEY'), value: 'PUBLIC_KEY' },
    { label: t('channel.info.metadataTypeOption.CERTIFICATE'), value: 'CERTIFICATE' },
    { label: t('channel.info.metadataTypeOption.SELECT'), value: 'SELECT' },
]);
const metadataTypeHelpItems = computed(() => metadataFieldTypeOptions.value.map((item) => ({
    ...item,
    description: t(`channel.info.metadataTypeHelp.${item.value}`),
})));
const rules: FormRules = {
    channelCode: [{ required: true, message: t('channel.info.requiredChannelCode'), trigger: 'blur' }],
    channelCnName: [{ required: true, message: t('channel.info.requiredChannelCnName'), trigger: 'blur' }],
    channelEnName: [{ required: true, message: t('channel.info.requiredChannelEnName'), trigger: 'blur' }],
    channelStatus: [{ required: true, message: t('channel.info.requiredStatus'), trigger: 'change' }],
    supportAcquiring: [{ required: true, message: t('channel.info.requiredSupportAcquiring'), trigger: 'change' }],
    supportPayout: [{ required: true, message: t('channel.info.requiredSupportPayout'), trigger: 'change' }],
    support3ds: [{ required: true, message: t('channel.info.requiredSupport3ds'), trigger: 'change' }],
    connectTimeoutSeconds: [{ required: true, type: 'number', min: 1, message: t('channel.info.requiredConnectTimeoutSeconds'), trigger: 'change' }],
    readTimeoutSeconds: [{ required: true, type: 'number', min: 1, message: t('channel.info.requiredReadTimeoutSeconds'), trigger: 'change' }],
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
    const [acquiringPayments, payoutPayments] = await Promise.all([
        loadDictOptions('acquiring_payment_method', String(locale.value)),
        loadDictOptions('payout_payment_method', String(locale.value)),
    ]);
    paymentOptions.value = [...acquiringPayments, ...payoutPayments];
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
    form.metadataSchemas = editableMetadataSchemas(row?.metadataSchemas);
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
    const metadataError = validateMetadataSchemas();
    if (metadataError) {
        ElMessage.error(metadataError);
        return;
    }
    const payload = buildChannelPayload();
    try {
        if (formMode.value === 'create') {
            await createChannel(payload);
        } else {
            const confirmed = await confirmChannelCapabilityImpact(editingRowSnapshot.value, payload);
            if (!confirmed) {
                return;
            }
            await updateChannel(form.id, payload);
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

function editableMetadataSchemas(items?: ChannelMetadataSchema[]) {
    return (items || []).map((item, index) => ({
        ...item,
        fieldKey: item.fieldKey || '',
        fieldLabel: item.fieldLabel || '',
        fieldType: item.fieldType || 'TEXT',
        requiredFlag: item.requiredFlag ?? 1,
        sensitiveFlag: item.sensitiveFlag ?? 0,
        sortOrder: item.sortOrder ?? index + 1,
        fieldStatus: item.fieldStatus ?? 1,
        localKey: `${item.id || 'new'}-${item.fieldKey || index}-${Date.now()}`,
    }));
}

function addMetadataSchema() {
    insertMetadataSchema(form.metadataSchemas.length - 1);
}

function insertMetadataSchema(index: number) {
    form.metadataSchemas.splice(index + 1, 0, {
        localKey: `new-${Date.now()}-${Math.random()}`,
        fieldKey: '',
        fieldLabel: '',
        fieldType: 'TEXT',
        requiredFlag: 1,
        sensitiveFlag: 0,
        sortOrder: form.metadataSchemas.length + 1,
        fieldStatus: 1,
    });
}

function removeMetadataSchema(index: number) {
    form.metadataSchemas.splice(index, 1);
}

function handleMetadataSensitiveChange(item: EditableMetadataSchema) {
    if (item.sensitiveFlag === 1) {
        item.defaultValue = '';
    }
}

function validateMetadataSchemas() {
    const seen = new Set<string>();
    for (const item of form.metadataSchemas) {
        const fieldKey = String(item.fieldKey || '').trim();
        if (!/^[A-Za-z][A-Za-z0-9_]{1,63}$/.test(fieldKey)) {
            return t('channel.info.invalidMetadataKey');
        }
        if (seen.has(fieldKey)) {
            return t('channel.info.duplicateMetadataKey', { key: fieldKey });
        }
        seen.add(fieldKey);
        if (!String(item.fieldLabel || '').trim()) {
            return t('channel.info.requiredMetadataLabel', { key: fieldKey });
        }
        if (!metadataFieldTypeOptions.value.some((option) => option.value === item.fieldType)) {
            return t('channel.info.invalidMetadataType', { key: fieldKey });
        }
        if (item.sensitiveFlag === 1 && String(item.defaultValue || '').trim()) {
            return t('channel.info.sensitiveDefaultNotAllowed', { key: fieldKey });
        }
        if (String(item.validationRegex || '').trim()) {
            try {
                new RegExp(String(item.validationRegex));
            } catch {
                return t('channel.info.invalidValidationRegex', { key: fieldKey });
            }
        }
    }
    return '';
}

function buildChannelPayload(): Partial<ChannelInfo> {
    return {
        id: form.id,
        channelCode: form.channelCode,
        channelCnName: form.channelCnName,
        channelEnName: form.channelEnName,
        channelStatus: form.channelStatus,
        supportAcquiring: form.supportAcquiring,
        supportPayout: form.supportPayout,
        support3ds: form.support3ds,
        defaultRequestUrl: String(form.defaultRequestUrl || '').trim() || undefined,
        connectTimeoutSeconds: form.connectTimeoutSeconds,
        readTimeoutSeconds: form.readTimeoutSeconds,
        sortOrder: form.sortOrder,
        remark: String(form.remark || '').trim() || undefined,
        metadataSchemas: form.metadataSchemas.map((item, index) => ({
            id: item.id,
            fieldKey: String(item.fieldKey || '').trim(),
            fieldLabel: String(item.fieldLabel || '').trim(),
            fieldType: item.fieldType,
            requiredFlag: item.requiredFlag,
            sensitiveFlag: item.sensitiveFlag,
            validationRegex: String(item.validationRegex || '').trim() || undefined,
            placeholder: String(item.placeholder || '').trim() || undefined,
            defaultValue: item.sensitiveFlag === 1 ? undefined : String(item.defaultValue || '').trim() || undefined,
            sortOrder: item.sortOrder ?? index + 1,
            fieldStatus: item.fieldStatus,
        })),
    };
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

function metadataFieldTypeText(value?: string) {
    return metadataFieldTypeOptions.value.find((item) => item.value === value)?.label || value || '-';
}

function channelStatusTargetName(row: ChannelInfo) {
    return row.channelCnName || row.channelEnName || row.channelCode || String(row.id);
}

function secondsText(value?: number) {
    return value ? `${value}s` : '-';
}
</script>

<style scoped>
.channel-form {
    max-width: 1240px;
    margin: 0 auto;
}

.channel-form :deep(.el-form-item__content) {
    min-width: 0;
}

.channel-form__sort :deep(.el-input-number) {
    width: 180px;
}

.logo-line {
    display: flex;
    justify-content: center;
}

.detail-logo-line {
    display: flex;
    align-items: center;
    min-height: 24px;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
}

.channel-detail-descriptions {
    max-width: 960px;
}

.metadata-schema-detail {
    display: grid;
    gap: 8px;
}

.metadata-schema-detail__item {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    background: var(--el-fill-color-lighter);
}

.metadata-schema-detail__item strong {
    margin-right: 8px;
    color: var(--el-text-color-primary);
}

.metadata-schema-detail__item span {
    color: var(--el-text-color-secondary);
}

.metadata-schema-detail__tags {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 6px;
}

.metadata-schema-panel {
    margin: 8px 0 18px;
    padding: 18px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
}

.metadata-schema-panel__header {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 14px;
}

.metadata-schema-panel__title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
}

.metadata-schema-panel__desc {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.metadata-type-guide {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
    padding: 12px;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);
}

.metadata-type-guide__title {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
}

.metadata-type-guide__items {
    display: grid;
    grid-template-columns: repeat(5, minmax(160px, 1fr));
    gap: 8px 10px;
}

.metadata-type-guide__item {
    display: grid;
    gap: 2px;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 6px;
    background: var(--el-fill-color-blank);
}

.metadata-type-guide__item strong {
    color: var(--el-color-primary);
    font-size: 12px;
    line-height: 18px;
}

.metadata-type-guide__item span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.metadata-schema-editor {
    display: grid;
    gap: 16px;
}

.metadata-schema-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 64px;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
}

.metadata-schema-row :deep(.el-form-item) {
    margin-bottom: 12px;
}

.metadata-schema-row :deep(.el-form-item__label) {
    width: 64px !important;
    flex: 0 0 64px;
    padding-right: 10px;
    color: var(--el-text-color-regular);
}

.metadata-schema-row :deep(.el-form-item__content) {
    min-width: 0;
}

.metadata-schema-row__content {
    display: grid;
    gap: 2px;
    min-width: 0;
}

.metadata-schema-row__main,
.metadata-schema-row__toggles,
.metadata-schema-row__extras {
    display: grid;
    gap: 14px;
    align-items: start;
}

.metadata-schema-row__main {
    grid-template-columns: minmax(220px, .95fr) minmax(260px, 1.1fr) minmax(170px, .7fr) 184px;
}

.metadata-schema-row__toggles {
    grid-template-columns: 120px 120px 120px minmax(360px, 1fr);
}

.metadata-schema-row__extras {
    grid-template-columns: minmax(300px, 1fr) minmax(320px, 1fr);
}

.metadata-schema-row__sort :deep(.el-form-item__label) {
    width: 44px !important;
    flex-basis: 44px;
}

.metadata-schema-row__sort :deep(.el-form-item__content) {
    flex: 0 0 128px;
}

.metadata-schema-row__sort :deep(.el-input-number) {
    width: 128px;
}

.metadata-schema-row__actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding-left: 10px;
    border-left: 1px solid var(--el-border-color-lighter);
}

.metadata-schema-row__actions :deep(.el-button) {
    width: 36px;
    height: 32px;
    margin-left: 0;
}

.channel-form-overlay :deep(.el-dialog__body) {
    max-height: calc(100vh - 210px);
    overflow: auto;
    padding-right: 24px;
    padding-left: 24px;
}

.channel-form-overlay :deep(.el-drawer__body) {
    overflow: auto;
    padding: 20px 28px 12px;
}

.channel-form-overlay :deep(.el-drawer__footer) {
    padding: 12px 28px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 1180px) {
    .metadata-type-guide__items {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
    }

    .metadata-schema-row__main {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
    }

    .metadata-schema-row__toggles,
    .metadata-schema-row__extras {
        grid-template-columns: repeat(2, minmax(220px, 1fr));
    }

    .metadata-schema-row__actions {
        flex-direction: row;
        justify-content: flex-start;
        padding-top: 0;
        padding-left: 0;
        border-left: 0;
    }
}

@media (max-width: 760px) {
    .metadata-schema-panel__header {
        flex-direction: column;
    }

    .metadata-schema-row__main,
    .metadata-schema-row__toggles,
    .metadata-schema-row__extras,
    .metadata-type-guide__items {
        grid-template-columns: 1fr;
    }

    .metadata-schema-row {
        grid-template-columns: 1fr;
    }

    .metadata-schema-row__actions {
        justify-content: flex-start;
        padding-top: 0;
    }
}
</style>
