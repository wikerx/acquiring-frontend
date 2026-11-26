<template>
    <div v-if="user.hasPermission(permissions.list)" class="app-container">
        <header class="dispute-alert-heading">
            <img :src="shieldBrand.icon" :alt="shieldBrand.name" width="32" height="32" />
            <h1>{{ t('route.admin_channel_dispute_alert_v1') }}</h1>
        </header>
        <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="mb8">
            <el-button text type="primary" @click="applySearch">{{ t('alertConfig.retry') }}</el-button>
        </el-alert>
        <el-form v-show="showSearch" class="search-form" :inline="true" size="small" @submit.prevent="applySearch">
            <el-form-item :label="t('alertConfig.channelOrMid')">
                <el-input v-model="query.keyword" :placeholder="t('alertConfig.midSearch')" clearable />
            </el-form-item>
            <el-form-item :label="t('alertConfig.product')">
                <el-select v-model="query.product" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="option in filterProductOptions" :key="option.product"
                        :label="productLabel(option.product)" :value="option.product" :disabled="Boolean(option.disabledReason)">
                        <span class="mid-product-option">
                            <AlertProductDisplay :product="option.product" />
                            <span v-if="option.disabledReason" class="mid-product-reason">{{ t('alertConfig.' + option.disabledReason) }}</span>
                        </span>
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item :label="t('common.status')">
                <el-select v-model="query.status" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="status in statuses" :key="status" :label="statusLabel(status)" :value="status" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" size="small" :icon="Search" native-type="submit">{{ t('common.search') }}</el-button>
                <el-button size="small" :icon="Refresh" @click="resetSearch">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row class="mb8" :gutter="10">
            <el-col v-if="user.hasPermission(permissions.add)" :span="1.5">
                <el-button type="primary" plain size="small" :icon="Plus" @click="openForm()">{{ t('alertConfig.addConfiguration') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="applySearch" />
            </el-col>
        </el-row>

        <StandardTable v-loading="listLoading" table-key="channel-dispute-alert" :data="rows" row-key="id" size="small" :empty-text="t('alertConfig.noRecords')">
            <el-table-column prop="midId" :label="t('alertConfig.channelOrMid')" min-width="205" align="center" fixed="left">
                <template #default="{ row }"><span class="mid-label">{{ midLabel(row.mid) }}</span></template>
            </el-table-column>
            <el-table-column prop="product" :label="t('alertConfig.product')" min-width="132" align="center">
                <template #default="{ row }"><AlertProductDisplay :product="row.source.product" compact /></template>
            </el-table-column>
            <el-table-column prop="accountId" :label="t('alertConfig.sourceAccount')" min-width="215" align="center" show-overflow-tooltip>
                <template #default="{ row }">
                    <div>{{ accountLabel(row.source) }}</div>
                    <div v-if="!row.sourceAvailable" class="source-unavailable">{{ t('alertConfig.sourceUnavailable') }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="externalMerchantId" :label="t('alertConfig.externalMerchantId')" min-width="150" align="center" show-overflow-tooltip>
                <template #default="{ row }">{{ row.externalMerchantId || '—' }}</template>
            </el-table-column>
            <el-table-column prop="mappings" :label="t('alertConfig.mappings')" min-width="150" align="center">
                <template #default="{ row }">
                    {{ t('alertConfig.mappingCounts', { identities: row.identifierCount, descriptors: row.descriptorCount }) }}
                </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('common.status')" width="98" align="center">
                <template #default="{ row }">
                    <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
                    <div v-if="row.status === 'ENABLED' && !row.effective" class="source-unavailable">{{ t('alertConfig.bindingInactive') }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="operations" :label="t('common.operation')" width="184" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" :icon="View" @click="openForm(row, true)">{{ t('common.detail') }}</el-button>
                    <el-button v-if="user.hasPermission(permissions.edit)" link type="primary" size="small" :icon="Edit" @click="openForm(row)">{{ t('common.edit') }}</el-button>
                    <el-button v-if="user.hasPermission(permissions.status)" link type="primary" size="small" :disabled="statusChanging || (row.status !== 'ENABLED' && !row.sourceAvailable)" @click="toggleStatus(row)">
                        {{ t(row.status === 'ENABLED' ? 'common.disable' : 'common.enable') }}
                    </el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-if="total" class="pagination-container">
            <el-pagination v-model:current-page="pageNo" :page-size="20" :total="total"
                layout="total, prev, pager, next" background @current-change="loadBindings" />
        </div>

        <el-drawer v-model="formVisible" :title="drawerTitle" size="min(880px, 96vw)" append-to-body destroy-on-close class="app-form-drawer">
            <el-form class="mid-configuration-form" label-position="top" :model="form" :disabled="viewOnly || saving" @submit.prevent="submitForm">
                <div v-if="formError" ref="formFeedback" class="configuration-feedback" tabindex="-1">
                    <el-alert :title="formError" type="error" :closable="false" show-icon />
                </div>
                <section class="configuration-block" aria-labelledby="alert-configuration-scope">
                    <header class="mapping-heading"><h3 id="alert-configuration-scope">{{ t('alertConfig.configurationScope') }}</h3></header>
                    <el-descriptions v-if="editing" :column="1" border size="small">
                        <el-descriptions-item :label="t('alertConfig.channelFilter')">{{ selectedMid?.channelCode || '—' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('channel.mid.channelMid')">{{ selectedMid?.channelMid || '—' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('alertConfig.product')">
                            <AlertProductDisplay v-if="form.product" :product="form.product" compact />
                        </el-descriptions-item>
                    </el-descriptions>
                    <div v-else class="form-grid">
                        <el-form-item :label="t('alertConfig.channelFilter')">
                            <el-select v-model="formChannel" filterable clearable :value-on-clear="''" :loading="midsLoading"
                                :placeholder="t('alertConfig.allChannels')" @change="changeChannel">
                                <el-option v-for="channel in channelOptions" :key="channel" :label="channel" :value="channel" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.channelMid')" required>
                            <el-select v-model="formMidId" filterable remote :remote-method="loadMids" :loading="midsLoading"
                                :placeholder="t('common.pleaseSelect')" @change="changeMid">
                                <el-option v-for="item in midOptions" :key="item.id" :label="midLabel(item)" :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('alertConfig.product')" required>
                            <el-select v-model="formProduct" :disabled="sourceState !== 'ready'" :loading="sourceState === 'loading'"
                                :placeholder="t(selectedMid ? 'common.pleaseSelect' : 'alertConfig.selectMidFirst')" @change="changeProduct">
                                <el-option v-for="option in bindingProductOptions" :key="option.product"
                                    :label="productLabel(option.product)" :value="option.product" :disabled="Boolean(option.disabledReason)">
                                    <span class="mid-product-option">
                                        <AlertProductDisplay :product="option.product" />
                                        <span v-if="option.disabledReason" class="mid-product-reason">{{ t('alertConfig.' + option.disabledReason) }}</span>
                                    </span>
                                </el-option>
                            </el-select>
                        </el-form-item>
                    </div>
                </section>
                <el-alert v-if="!editing && sourceState === 'ready' && !availableProducts.length"
                    :title="t('alertConfig.noEligibleMidSource')" type="info" :closable="false" class="mb8" />
                <template v-if="hasSelectedProduct">
                    <el-alert v-if="sharedMids.length" type="warning" :closable="false"
                        :title="t('alertConfig.sharedMapping', { mids: sharedMids.map(midLabel).join(', ') })" />
                    <section class="configuration-block" aria-labelledby="alert-configuration-source">
                        <header class="mapping-heading"><h3 id="alert-configuration-source">{{ t('alertConfig.sourceAndEnrollment') }}</h3></header>
                        <div class="form-grid">
                            <el-form-item :label="t('alertConfig.sourceAccount')" required>
                                <span v-if="currentBinding">{{ accountLabel(currentBinding.source) }}</span>
                                <el-select v-else v-model="formSourceId" filterable :placeholder="t('common.pleaseSelect')">
                                    <el-option v-for="source in sourceOptions" :key="source.accountProductId"
                                        :value="source.accountProductId" :label="accountLabel(source)" />
                                </el-select>
                                <span v-if="currentBinding && !currentBinding.sourceAvailable" class="source-unavailable">{{ t('alertConfig.linkedSourceUnavailable') }}</span>
                            </el-form-item>
                            <el-form-item :label="t('alertConfig.externalMerchantId')">
                                <el-input v-model.trim="form.externalMerchantId" maxlength="80" :disabled="editing" />
                            </el-form-item>
                            <el-form-item :label="t(form.product === 'ETHOCA' ? 'alertConfig.ethocaMerchantId' : 'alertConfig.verifiMerchantId')">
                                <el-input v-model.trim="form.upstreamMerchantId" maxlength="80" />
                            </el-form-item>
                            <el-form-item :label="t('alertConfig.enrollmentStatus')" required>
                                <el-select v-model="form.enrollment">
                                    <el-option v-for="state in enrollments" :key="state" :label="t('alertConfig.enrollmentLabel.' + state)" :value="state" />
                                </el-select>
                            </el-form-item>
                            <el-form-item :label="t('alertConfig.enrollmentEvidence')" :required="form.enrollment === 'CONFIRMED'">
                                <el-input v-model.trim="form.enrollmentEvidence" maxlength="180" :placeholder="t('alertConfig.enrollmentPlaceholder')" />
                            </el-form-item>
                            <el-form-item :label="t('common.status')">
                                <el-tag :type="statusType(form.status)" size="small">{{ statusLabel(form.status) }}</el-tag>
                            </el-form-item>
                        </div>
                    </section>

                    <section class="configuration-block" aria-labelledby="acquirer-identities">
                        <div class="mapping-heading">
                            <h3 id="acquirer-identities">{{ t('alertConfig.acquirerIdentities') }}</h3>
                            <el-button v-if="!viewOnly" plain size="small" :icon="Plus" @click="addIdentifier">{{ t('alertConfig.addIdentifier') }}</el-button>
                        </div>
                        <p v-if="!form.identifiers.length" class="mapping-empty">{{ t('alertConfig.noIdentifiers') }}</p>
                        <div v-for="(row, index) in form.identifiers" :key="row.rowKey" class="mapping-row">
                            <div class="form-grid">
                                <el-form-item :label="t('alertConfig.identityType')">
                                    <el-select v-model="row.type">
                                        <el-option value="ACQUIRER_MID" :label="t('alertConfig.acquirerMid')" />
                                        <el-option v-if="form.product === 'RDR'" value="BIN_CAID" :label="t('alertConfig.binCaid')" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item :label="t('alertConfig.acquirer')" required><el-input v-model.trim="row.acquirer" maxlength="100" /></el-form-item>
                                <template v-if="row.type === 'BIN_CAID'">
                                    <el-form-item :label="t('alertConfig.bin')" required><el-input v-model.trim="row.acquirerBin" inputmode="numeric" maxlength="8" /></el-form-item>
                                    <el-form-item label="CAID" required><el-input v-model.trim="row.caid" maxlength="80" /></el-form-item>
                                </template>
                                <el-form-item v-else :label="t('alertConfig.acquirerMid')" required><el-input v-model.trim="row.acquirerMid" maxlength="128" /></el-form-item>
                            </div>
                            <div class="mapping-actions">
                                <el-checkbox v-model="row.enabled">{{ t('alertConfig.status.ENABLED') }}</el-checkbox>
                                <el-button v-if="!viewOnly" type="danger" link size="small" @click="form.identifiers.splice(index, 1)">{{ t('alertConfig.removeRow') }}</el-button>
                            </div>
                        </div>
                    </section>

                    <section class="configuration-block" aria-labelledby="billing-descriptors">
                        <div class="mapping-heading">
                            <h3 id="billing-descriptors">{{ t('alertConfig.billingDescriptors') }}</h3>
                            <el-button v-if="!viewOnly" plain size="small" :icon="Plus" @click="addDescriptor">{{ t('alertConfig.addDescriptor') }}</el-button>
                        </div>
                        <p v-if="!form.descriptors.length" class="mapping-empty">{{ t('alertConfig.noDescriptors') }}</p>
                        <div v-for="(row, index) in form.descriptors" :key="row.rowKey" class="mapping-row">
                            <el-form-item :label="t('alertConfig.billingDescriptor')" required><el-input v-model.trim="row.value" maxlength="128" /></el-form-item>
                            <div class="mapping-actions">
                                <el-checkbox v-model="row.enabled">{{ t('alertConfig.status.ENABLED') }}</el-checkbox>
                                <el-button v-if="!viewOnly" type="danger" link size="small" @click="form.descriptors.splice(index, 1)">{{ t('alertConfig.removeRow') }}</el-button>
                            </div>
                        </div>
                    </section>
                </template>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <template v-if="!viewOnly">
                        <el-button type="primary" :loading="saving" @click="submitForm">{{ t('common.save') }}</el-button>
                        <el-button :disabled="saving" @click="formVisible = false">{{ t('common.cancel') }}</el-button>
                    </template>
                    <el-button v-else @click="formVisible = false">{{ t('common.close') }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
    <el-empty v-else :description="t('alertConfig.noViewPermission')" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { userFacingErrorMessage, VEXRA_PRODUCT_BRANDS } from '@acquiring/shared';
import {
    enrollments, getAlertBinding, listAlertBindings, listAlertMidChannels, listAlertMids, listAlertSources,
    midProducts, products, saveAlertBinding, statuses, updateAlertBindingStatus,
    type AlertMid, type AlertProduct, type AlertStatus, type BindingDetail, type BindingInput, type BindingSummary,
    type DescriptorInput, type IdentityInput, type MidProduct, type SourceOption,
} from '@/api/channel/disputeAlert';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import AlertProductDisplay from './AlertProductDisplay.vue';
import { disputeAlertPermissions as permissions } from './menu';

const { t } = useI18n();
const shieldBrand = VEXRA_PRODUCT_BRANDS.shield;
const user = useUserStore();
const showSearch = ref(true);
const emptyQuery = () => ({ keyword: '', product: '' as MidProduct | '', status: '' as AlertStatus | '' });
const query = ref(emptyQuery());
const appliedQuery = ref(emptyQuery());
const rows = ref<BindingSummary[]>([]);
const total = ref(0);
const pageNo = ref(1);
const listLoading = ref(false);
const loadError = ref('');
const formVisible = ref(false);
const viewOnly = ref(false);
const saving = ref(false);
const statusChanging = ref(false);
const formError = ref('');
const formFeedback = ref<HTMLElement>();
const formChannel = ref('');
const channelOptions = ref<string[]>([]);
const midOptions = ref<AlertMid[]>([]);
const selectedMid = ref<AlertMid>();
const midsLoading = ref(false);
const sourceState = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
const sources = ref<SourceOption[]>([]);
const currentBinding = ref<BindingSummary>();
const sharedMids = ref<AlertMid[]>([]);
let rowKey = 0;
let editorRequest = 0;
let listRequest = 0;
let midsRequest = 0;
let sourceRequest = 0;

type Form = Omit<BindingInput, 'identifiers' | 'descriptors'> & {
    product: MidProduct | '';
    status: AlertStatus;
    identifiers: (IdentityInput & { rowKey: number })[];
    descriptors: (DescriptorInput & { rowKey: number })[];
};
const newForm = (): Form => ({
    midConfigId: 0, accountProductId: 0, product: '', status: 'DRAFT',
    externalMerchantId: '', upstreamMerchantId: '', enrollment: 'PENDING', enrollmentEvidence: '',
    identifiers: [], descriptors: [],
});
const form = ref(newForm());
const editing = computed(() => Boolean(currentBinding.value));
const drawerTitle = computed(() => t(viewOnly.value ? 'common.detail' : editing.value ? 'alertConfig.editConfiguration' : 'alertConfig.addConfiguration'));
const formMidId = computed({
    get: () => form.value.midConfigId || undefined,
    set: (id?: number) => { form.value.midConfigId = id ?? 0; },
});
const formProduct = computed({
    get: () => form.value.product || undefined,
    set: (product?: MidProduct) => { form.value.product = product ?? ''; },
});
const formSourceId = computed({
    get: () => form.value.accountProductId || undefined,
    set: (id?: number) => { form.value.accountProductId = id ?? 0; },
});
const availableProducts = computed(() => midProducts.filter((product) => sources.value.some((source) => source.product === product)));
const filterProductOptions = products.map((product) => ({
    product,
    disabledReason: midProducts.some((midProduct) => midProduct === product) ? '' : 'midProductOutsideScope',
}));
const bindingProductOptions = computed(() => filterProductOptions.map((option) => {
    if (option.disabledReason || availableProducts.value.some((product) => product === option.product)) return option;
    return { ...option, disabledReason: 'midProductWithoutSource' };
}));
const sourceOptions = computed(() => sources.value.filter((source) => source.product === form.value.product));
const hasSelectedProduct = computed(() => Boolean(selectedMid.value && form.value.product));

watch([() => user.account?.accountId, () => user.hasPermission(permissions.list)], () => {
    editorRequest++;
    midsRequest++;
    sourceRequest++;
    formVisible.value = false;
    rows.value = [];
    total.value = 0;
    pageNo.value = 1;
    if (user.hasPermission(permissions.list)) void loadBindings();
}, { immediate: true });

function applySearch() {
    appliedQuery.value = { ...query.value };
    pageNo.value = 1;
    void loadBindings();
}

function resetSearch() {
    query.value = emptyQuery();
    applySearch();
}

async function loadBindings() {
    const request = ++listRequest;
    const actor = user.account?.accountId;
    const filter = appliedQuery.value;
    listLoading.value = true;
    loadError.value = '';
    try {
        const result = await listAlertBindings({ pageNo: pageNo.value, pageSize: 20, keyword: filter.keyword.trim() || undefined,
            product: filter.product || undefined, status: filter.status || undefined });
        if (request !== listRequest || actor !== user.account?.accountId) return;
        rows.value = result.records;
        total.value = result.total;
    } catch (error) {
        if (request === listRequest && actor === user.account?.accountId) {
            loadError.value = userFacingErrorMessage(error, t('common.loadFailed'));
        }
    } finally {
        if (request === listRequest) listLoading.value = false;
    }
}

function midLabel(item: AlertMid) {
    return item.channelCode + ' / ' + item.channelMid;
}

function accountLabel(source: SourceOption) {
    return [source.platformName, source.merchantNumber].join(' / ');
}

function productLabel(product: AlertProduct) {
    return t('alertConfig.productLabel.' + product);
}

function statusLabel(status: AlertStatus) {
    return t('alertConfig.status.' + status);
}

function statusType(status: AlertStatus) {
    return status === 'ENABLED' ? 'success' : status === 'DRAFT' ? 'warning' : 'info';
}

function useDetail(detail: BindingDetail) {
    const { binding, identifiers, descriptors, overlappingMids } = detail;
    currentBinding.value = binding;
    selectedMid.value = binding.mid;
    sharedMids.value = overlappingMids;
    form.value = {
        midConfigId: binding.mid.id, accountProductId: binding.source.accountProductId, product: binding.source.product,
        externalMerchantId: binding.externalMerchantId, upstreamMerchantId: binding.upstreamMerchantId ?? '',
        enrollmentEvidence: binding.enrollmentEvidence ?? '', enrollment: binding.enrollment,
        status: binding.status, version: binding.version,
        identifiers: identifiers.map((item) => ({ ...item, rowKey: ++rowKey })),
        descriptors: descriptors.map((item) => ({ ...item, rowKey: ++rowKey })),
    };
}

async function openForm(item?: BindingSummary, detail = false) {
    const permission = detail ? permissions.list : item ? permissions.edit : permissions.add;
    if (!user.hasPermission(permission) || saving.value) return;
    const request = ++editorRequest;
    viewOnly.value = detail;
    formError.value = '';
    currentBinding.value = undefined;
    selectedMid.value = undefined;
    formChannel.value = '';
    form.value = newForm();
    sharedMids.value = [];
    sources.value = [];
    midOptions.value = [];
    channelOptions.value = [];
    midsRequest++;
    sourceRequest++;
    sourceState.value = 'idle';
    if (item) {
        try {
            const binding = await getAlertBinding(item.id);
            if (request !== editorRequest) return;
            useDetail(binding);
            formVisible.value = true;
        } catch (error) {
            if (request === editorRequest) ElMessage.error(userFacingErrorMessage(error, t('common.loadFailed')));
        }
        return;
    }
    formVisible.value = true;
    try {
        const [channels] = await Promise.all([listAlertMidChannels(), loadMids()]);
        if (request === editorRequest && formVisible.value) channelOptions.value = channels;
    } catch (error) {
        if (request === editorRequest && formVisible.value) formError.value = userFacingErrorMessage(error, t('common.loadFailed'));
    }
}

async function loadMids(keyword = '') {
    const request = ++midsRequest;
    midsLoading.value = true;
    try {
        const rows = await listAlertMids(formChannel.value || undefined, keyword.trim() || undefined);
        if (request !== midsRequest || !formVisible.value) return;
        const selected = selectedMid.value;
        midOptions.value = selected && !rows.some(({ id }) => id === selected.id) ? [selected, ...rows] : rows;
    } catch (error) {
        if (request === midsRequest && formVisible.value) formError.value = userFacingErrorMessage(error, t('common.loadFailed'));
    } finally {
        if (request === midsRequest) midsLoading.value = false;
    }
}

function changeChannel() {
    if (formChannel.value && formChannel.value !== selectedMid.value?.channelCode) {
        form.value.midConfigId = 0;
        void changeMid();
    }
    midOptions.value = [];
    void loadMids();
}

async function changeMid() {
    const request = ++sourceRequest;
    const mid = midOptions.value.find(({ id }) => id === form.value.midConfigId);
    selectedMid.value = mid;
    form.value.product = '';
    sources.value = [];
    changeProduct();
    sourceState.value = mid ? 'loading' : 'idle';
    if (!mid) return;
    try {
        const options = await Promise.all(midProducts.map((product) => listAlertSources(mid.id, product)));
        if (request !== sourceRequest || !formVisible.value) return;
        sources.value = options.flat();
        form.value.product = availableProducts.value[0] ?? '';
        sourceState.value = 'ready';
    } catch (error) {
        if (request !== sourceRequest || !formVisible.value) return;
        sourceState.value = 'error';
        formError.value = userFacingErrorMessage(error, t('common.loadFailed'));
    }
}

function changeProduct() {
    form.value.accountProductId = 0;
    form.value.externalMerchantId = '';
    form.value.upstreamMerchantId = '';
    form.value.enrollment = 'PENDING';
    form.value.enrollmentEvidence = '';
    form.value.identifiers = [];
    form.value.descriptors = [];
    formError.value = '';
}

function addIdentifier() {
    form.value.identifiers.push({
        rowKey: ++rowKey, type: form.value.product === 'RDR' ? 'BIN_CAID' : 'ACQUIRER_MID',
        acquirer: '', acquirerMid: '', acquirerBin: '', caid: '', enabled: true,
    });
}

function addDescriptor() {
    form.value.descriptors.push({ rowKey: ++rowKey, value: '', enabled: true });
}

async function showFormError(message: string) {
    formError.value = message;
    await nextTick();
    formFeedback.value?.focus();
}

function buildInput(): BindingInput {
    const { midConfigId, accountProductId, externalMerchantId, upstreamMerchantId, enrollment, enrollmentEvidence,
        identifiers, descriptors, version } = form.value;
    return {
        midConfigId, accountProductId, externalMerchantId, upstreamMerchantId, enrollment, enrollmentEvidence, version,
        identifiers: identifiers.map(({ type, acquirer, acquirerMid, acquirerBin, caid, enabled }) => ({
            type, acquirer, enabled,
            acquirerMid: type === 'ACQUIRER_MID' ? acquirerMid : undefined,
            acquirerBin: type === 'BIN_CAID' ? acquirerBin : undefined,
            caid: type === 'BIN_CAID' ? caid : undefined,
        })),
        descriptors: descriptors.map(({ value, enabled }) => ({ value, enabled })),
    };
}

function localValidation(input: BindingInput) {
    if (!input.midConfigId || !input.accountProductId) return 'missingMidOrAccount';
    if (input.enrollment === 'CONFIRMED' && !input.enrollmentEvidence.trim()) return 'enrollmentEvidenceRequired';
    if (input.identifiers.some((item) => !item.acquirer || (item.type === 'BIN_CAID'
        ? !/^(?:[0-9]{6}|[0-9]{8})$/.test(item.acquirerBin || '') || !item.caid : !item.acquirerMid))) return 'invalidIdentity';
    if (input.descriptors.some((item) => !item.value.trim())) return 'invalidDescriptor';
    return '';
}

async function submitForm() {
    const permission = editing.value ? permissions.edit : permissions.add;
    if (viewOnly.value || saving.value || !user.hasPermission(permission)) return;
    const input = buildInput();
    const problem = localValidation(input);
    if (problem) {
        await showFormError(t('alertConfig.' + problem));
        return;
    }
    const actor = user.account?.accountId;
    saving.value = true;
    formError.value = '';
    try {
        await saveAlertBinding(currentBinding.value?.id, input);
        if (actor !== user.account?.accountId) return;
        formVisible.value = false;
        ElMessage.success(t('common.saveSuccess'));
        await loadBindings();
    } catch (error) {
        if (actor === user.account?.accountId && formVisible.value) {
            await showFormError(userFacingErrorMessage(error, t('common.saveFailed')));
        }
    } finally {
        saving.value = false;
    }
}

async function toggleStatus(item: BindingSummary) {
    if (statusChanging.value || !user.hasPermission(permissions.status)) return;
    const actor = user.account?.accountId;
    const enable = item.status !== 'ENABLED';
    const title = t(enable ? 'common.enable' : 'common.disable');
    statusChanging.value = true;
    try {
        const detail = enable ? await getAlertBinding(item.id) : undefined;
        const row = detail?.binding ?? item;
        if (actor !== user.account?.accountId || !user.hasPermission(permissions.status)) return;
        const overlap = detail?.overlappingMids ?? [];
        const prompt = overlap.length ? t('alertConfig.sharedMapping', { mids: overlap.map(midLabel).join(', ') })
            : t('common.statusToggleConfirm', { action: title, name: midLabel(row.mid) });
        const accepted = await ElMessageBox.confirm(prompt, t('common.confirm'), {
            confirmButtonText: title, cancelButtonText: t('common.cancel'), type: 'warning',
        }).then(() => true, () => false);
        if (!accepted || actor !== user.account?.accountId || !user.hasPermission(permissions.status)) return;
        await updateAlertBindingStatus(row.id, row.version, enable ? 'ENABLED' : 'DISABLED');
        if (actor !== user.account?.accountId) return;
        ElMessage.success(t('common.saveSuccess'));
        await loadBindings();
    } catch (error) {
        if (actor === user.account?.accountId) ElMessage.error(userFacingErrorMessage(error, t('common.saveFailed')));
    } finally {
        statusChanging.value = false;
    }
}
</script>

<style scoped>
.dispute-alert-heading {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-block-end: 16px;
}
.dispute-alert-heading img {
    flex: 0 0 auto;
    object-fit: contain;
}
.dispute-alert-heading h1 {
    margin: 0;
    font-size: 18px;
    font-weight: 650;
    line-height: 1.35;
}
.mid-label {
    overflow-wrap: anywhere;
}
.mid-product-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}
.mid-product-reason {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
.mid-configuration-form {
    display: grid;
    gap: 14px;
}
.configuration-block {
    min-width: 0;
    padding: 14px 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    background: var(--el-bg-color);
}
.configuration-block :deep(.form-grid > .el-form-item:last-child),
.mapping-row > :deep(.el-form-item) {
    margin-bottom: 0;
}
.configuration-block :deep(.el-form-item__content > .el-select) {
    width: 100%;
}
.configuration-feedback {
    scroll-margin-top: 8px;
}
.mapping-heading,
.mapping-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}
.mapping-heading {
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}
.mapping-heading h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}
.mapping-row {
    padding: 10px 12px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-border-radius-base);
    background: var(--el-fill-color-blank);
}
.mapping-row + .mapping-row {
    margin-top: 8px;
}
.mapping-row .mapping-actions {
    margin-top: 8px;
}
.mapping-empty {
    margin: 0;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 13px;
}
.source-unavailable {
    color: var(--el-color-warning-dark-2);
    font-size: 12px;
}
</style>
