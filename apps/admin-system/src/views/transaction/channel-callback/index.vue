<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.callbackSearch.title')"
            :description="t('transaction.callbackSearch.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="106px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.channelCode')">
                <el-select v-model="query.channelCode" :placeholder="t('common.pleaseSelect')" filterable clearable class="callback-filter-select">
                    <el-option v-for="option in channelOptions" :key="option.channelCode" :label="channelOptionText(option)" :value="option.channelCode" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.channelOrderNo')"><el-input v-model.trim="query.channelOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.callbackStatus')">
                <el-select v-model="query.callbackStatus" :placeholder="t('common.pleaseSelect')" clearable class="callback-filter-select">
                    <el-option v-for="status in Object.keys(callbackStatusTones)" :key="status" :label="callbackStatusText(status)" :value="status" />
                </el-select>
            </el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            :title="t('transaction.summary.logResultTitle')"
            :description="t('transaction.summary.callbackResultDescription')"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

        <StandardTable table-key="transaction-channel-callback" v-loading="loading" :data="rows" row-key="callbackId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.callbackId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.callbackId" :label="t('transaction.fields.callbackId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="220" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" min-width="132" align="center">
                <template #default="{ row }">
                    <ChannelIdentity :channel-code="row.channelCode" :fallback="channelName(row.channelCode)" scope="CHANNEL_CALLBACK" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelOrderNo')" min-width="200" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelTransactionId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelTransactionId" :label="t('transaction.fields.channelTransactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.callbackStatus')" width="130" align="center">
                <template #header>
                    <el-tooltip :content="t('transaction.channelCallback.stateHelp')" placement="top">
                        <span>{{ t('transaction.fields.callbackStatus') }}</span>
                    </el-tooltip>
                </template>
                <template #default="{ row }">
                    <el-tag v-if="row.callbackStatus" size="small" :type="callbackStatusTones[row.callbackStatus] || 'info'">
                        {{ callbackStatusText(row.callbackStatus) }}
                    </el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.processResult')" width="160" align="center">
                <template #header>
                    <el-tooltip :content="t('transaction.channelCallback.resultHelp')" placement="top">
                        <span>{{ t('transaction.fields.processResult') }}</span>
                    </el-tooltip>
                </template>
                <template #default="{ row }">
                    <el-tag v-if="row.processResult" size="small" :type="processResultTones[row.processResult] || 'info'">
                        {{ processResultText(row.processResult) }}
                    </el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column prop="callbackReceivedTime" :label="t('transaction.fields.callbackReceivedTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.callbackReceivedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column prop="deliveryCount" :label="t('transaction.channelCallback.deliveryCount')" min-width="112" align="center">
                <template #default="{ row }">{{ row.deliveryCount ?? '-' }}</template>
            </el-table-column>
            <el-table-column prop="latestDeliveryTime" :label="t('transaction.channelCallback.latestDeliveryTime')" min-width="178" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.latestDeliveryTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center">
                <template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:channel-callback:detail'">{{ t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.channelCallback.detailTitle')" size="xl" class="callback-detail-drawer" :loading="detailLoading">
            <div v-if="detailRow" class="callback-detail">
                <dl class="callback-detail__facts">
                    <div>
                        <dt>{{ t('transaction.fields.callbackStatus') }}</dt>
                        <dd>
                            <el-tag v-if="detailRow.callbackStatus" round :type="callbackStatusTones[detailRow.callbackStatus] || 'info'">
                                {{ callbackStatusText(detailRow.callbackStatus) }}
                            </el-tag>
                            <span v-else>-</span>
                        </dd>
                    </div>
                    <div>
                        <dt>{{ t('transaction.fields.processResult') }}</dt>
                        <dd>
                            <el-tag v-if="detailRow.processResult" round :type="processResultTones[detailRow.processResult] || 'info'">
                                {{ processResultText(detailRow.processResult) }}
                            </el-tag>
                            <span v-else>-</span>
                        </dd>
                    </div>
                    <div v-if="typeof detailRow.signatureValid === 'boolean'">
                        <dt>{{ t('transaction.channelCallback.signature') }}</dt>
                        <dd>
                            <el-tag round :type="detailRow.signatureValid ? 'success' : 'danger'">
                                {{ t(detailRow.signatureValid ? 'transaction.channelCallback.signaturePassed' : 'transaction.channelCallback.signatureFailed') }}
                            </el-tag>
                        </dd>
                    </div>
                </dl>
                <div v-if="detailLoadFailed" class="callback-detail__retry" role="alert">
                    <span>{{ t('common.loadFailed') }}</span>
                    <el-button type="primary" link @click="loadDetail(detailRow)">{{ t('common.refresh') }}</el-button>
                </div>
                <el-alert v-if="detailLog?.platformResponseCode === 'ACCEPTED'" :title="t('transaction.channelCallback.historicalAudit')" type="info" :closable="false" show-icon />
                <section v-if="!detailLoadFailed && !detailLoading" class="callback-detail__deliveries">
                    <h3>{{ t('transaction.channelCallback.deliveryHistory') }}</h3>
                    <el-table
                        v-if="detailDeliveries"
                        :data="detailDeliveries.records"
                        :empty-text="t('transaction.channelCallback.noDeliveryAudit')"
                        row-key="deliveryId"
                        border
                    >
                        <el-table-column type="expand" :label="t('common.detail')">
                            <template #default="{ row }">
                                <div class="callback-detail__evidence">
                                    <TransactionPayloadBlocks
                                        :blocks="[
                                            {
                                                title: t('transaction.channelCallback.originalMasked'),
                                                value: row.requestBodyMasked,
                                                emptyText: t('transaction.channelCallback.requestUnavailable'),
                                            },
                                            {
                                                title: t('transaction.channelCallback.gatewayResponse'),
                                                value: row.responseBody,
                                                emptyText: t('transaction.channelCallback.responseUnavailable'),
                                            },
                                        ]"
                                    />
                                    <div v-if="row.requestBodySha256" class="callback-detail__digest">
                                        <span>SHA-256</span>
                                        <CopyableText :value="row.requestBodySha256" label="SHA-256" wrap />
                                    </div>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.callbackReceivedTime')" min-width="165">
                            <template #default="{ row }">
                                <BaseDateTime :value="row.receivedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.channelCallback.signature')" min-width="118" align="center">
                            <template #default="{ row }">
                                <el-tag size="small" :type="row.signatureValid ? 'success' : 'danger'">
                                    {{ t(row.signatureValid ? 'transaction.channelCallback.signaturePassed' : 'transaction.channelCallback.signatureFailed') }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.channelCallback.deliveryResult')" min-width="120" align="center">
                            <template #default="{ row }">
                                <el-tag size="small" :type="row.acceptResult === 'ACCEPTED' ? 'primary' : 'info'">
                                    {{ t(row.acceptResult === 'ACCEPTED' ? 'transaction.channelCallback.deliveryAccepted' : 'transaction.channelCallback.deliveryDuplicate') }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.channelCallback.deliveryResponse')" min-width="150">
                            <template #default="{ row }">
                                <template v-if="row.httpStatus">
                                    <el-tag size="small" :type="row.httpStatus >= 400 ? 'danger' : row.httpStatus >= 300 ? 'warning' : 'success'">
                                        {{ row.httpStatus }}
                                    </el-tag>
                                    <code v-if="row.responseBody" class="callback-detail__ack">{{ row.responseBody }}</code>
                                </template>
                                <span v-else>{{ t('transaction.channelCallback.responseUnavailable') }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.channelCallback.deliveryDuration')" min-width="96" align="right">
                            <template #default="{ row }">
                                {{ row.durationMillis == null ? '-' : t('transaction.channelCallback.milliseconds', { value: row.durationMillis }) }}
                            </template>
                        </el-table-column>
                    </el-table>
                    <el-alert v-else :title="t('transaction.channelCallback.noDeliveryAudit')" type="info" :closable="false" />
                    <el-pagination
                        v-if="detailDeliveries && detailDeliveries.pages > 1"
                        :current-page="detailDeliveries.pageNo"
                        :page-size="detailDeliveries.pageSize"
                        :total="detailDeliveries.total"
                        layout="total, prev, pager, next"
                        background
                        @current-change="changeDeliveryPage"
                    />
                </section>
                <TransactionRecordList v-if="!detailLoadFailed && !detailLoading && detailRecord" :rows="[detailRecord]" variant="callback" :display-time-zone="query.queryTimeZone">
                    <template #channel="{ code }">
                        <ChannelIdentity :channel-code="code" :fallback="channelName(code)" scope="CHANNEL_CALLBACK" size="detail" />
                    </template>
                </TransactionRecordList>
            </div>
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import {
    getTransactionChannelCallbackDetail,
    listTransactionCallbackChannels,
    searchTransactionChannelCallbacks,
    type ChannelCallbackChannelOption,
    type ChannelCallbackDetail,
    type ChannelCallbackRecord,
    type TransactionRecord,
} from '@/api/transaction';
import ChannelIdentity from '@/views/channel/components/ChannelIdentity.vue';
import CopyableText from '../components/CopyableText.vue';
import TransactionRecordList from '../components/TransactionRecordList.vue';
import TransactionPayloadBlocks from '../components/TransactionPayloadBlocks.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, defaultTransactionTodayRange, ensureTransactionTimezoneOptions, resolveTransactionQueryRange, splitDateRange } from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelCallbackRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const quickPreset = ref('today');
const detailVisible = ref(false);
const detailRow = ref<ChannelCallbackRecord | null>(null);
const detailLog = ref<TransactionRecord | null>(null);
const detailDeliveries = ref<ChannelCallbackDetail['deliveries']>();
const deliveryPage = ref(1);
const detailLoading = ref(false);
const detailLoadFailed = ref(false);
const channelOptions = ref<ChannelCallbackChannelOption[]>([]);
let detailRequest = 0;

type StatusTone = 'info' | 'warning' | 'success' | 'danger';
const callbackStatusTones: Record<string, StatusTone> = {
    RECEIVED: 'warning',
    PROCESSED: 'success',
    IGNORED: 'info',
    FAILED: 'danger',
};
const processResultTones: Record<string, StatusTone> = {
    PENDING_STATE_MAPPING: 'warning',
    STATUS_CHANGED: 'success',
    TERMINAL_IGNORED: 'info',
    CHANNEL_MATCH_QUEUED: 'warning',
    SECURITY_REJECTED: 'danger',
    DUPLICATE: 'info',
};
const detailRecord = computed(() => detailRow.value ? {
    ...detailRow.value,
    ...detailLog.value,
    callbackStatus: undefined,
    processResult: undefined,
    callbackProcessedTime: detailRow.value.processedTime,
} : null);
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive({ channelCode: '', transactionId: '', channelOrderNo: '', callbackStatus: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE });

onMounted(async () => {
    void listTransactionCallbackChannels().then((options) => { channelOptions.value = options; }).catch(() => {});
    await loadTimezones();
    await loadData();
});

async function loadTimezones() {
    const options = await loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []);
    timezoneOptions.value = ensureTransactionTimezoneOptions(options);
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchTransactionChannelCallbacks({
            pageNo: page.value,
            pageSize: pageSize.value,
            channelCode: query.channelCode || undefined,
            transactionId: query.transactionId || undefined,
            channelOrderNo: query.channelOrderNo || undefined,
            callbackStatus: query.callbackStatus || undefined,
            queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
            ...splitDateRange(currentDateRange()),
        });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function currentDateRange() {
    dateRange.value = resolveTransactionQueryRange(dateRange.value, quickPreset.value, query.queryTimeZone);
    return dateRange.value;
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.channelCode = '';
    query.transactionId = '';
    query.channelOrderNo = '';
    query.callbackStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(row: ChannelCallbackRecord) {
    detailRow.value = row;
    detailLog.value = null;
    detailDeliveries.value = undefined;
    deliveryPage.value = 1;
    detailVisible.value = true;
    void loadDetail(row);
}

function changeDeliveryPage(pageNo: number) {
    if (!detailRow.value) return;
    deliveryPage.value = pageNo;
    void loadDetail(detailRow.value);
}

async function loadDetail(row: ChannelCallbackRecord) {
    const request = ++detailRequest;
    detailLoading.value = true;
    detailLoadFailed.value = false;
    try {
        const response = await getTransactionChannelCallbackDetail(row.callbackId, row.transactionDateTime, deliveryPage.value);
        if (request !== detailRequest) return;
        detailRow.value = response.callback;
        detailLog.value = response.log ?? null;
        detailDeliveries.value = response.deliveries;
    } catch {
        if (request === detailRequest) detailLoadFailed.value = true;
    } finally {
        if (request === detailRequest) detailLoading.value = false;
    }
}

function callbackStatusText(status?: string) {
    return status && Object.hasOwn(callbackStatusTones, status)
        ? t(`transaction.channelCallback.statuses.${status}`)
        : status || '-';
}

function processResultText(result?: string) {
    return result && Object.hasOwn(processResultTones, result)
        ? t(`transaction.channelCallback.results.${result}`)
        : result || '-';
}

function channelOptionText(option: ChannelCallbackChannelOption) {
    return option.channelName && option.channelName !== option.channelCode
        ? `${option.channelCode} / ${option.channelName}`
        : option.channelCode;
}

function channelName(code: string) {
    return channelOptions.value.find((option) => option.channelCode === code)?.channelName || code || '-';
}
</script>

<style scoped>
.callback-detail__deliveries {
    display: grid;
    min-width: 0;
    gap: 12px;
}
.callback-detail__deliveries h3 {
    margin: 0;
    font-size: var(--el-font-size-base);
    color: var(--el-text-color-primary);
}
.callback-detail__deliveries .el-pagination {
    justify-self: end;
}
.callback-detail__evidence {
    display: grid;
    gap: 8px;
    padding: 12px;
}
.callback-detail__digest {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    color: var(--el-text-color-secondary);
}
.callback-detail__ack {
    margin-inline-start: 8px;
    overflow-wrap: anywhere;
}
:global(.common-detail-drawer.callback-detail-drawer.el-drawer) {
    max-width: 100vw;
}
.callback-filter-select {
    width: 100%;
    min-width: 140px;
}
.callback-detail {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
}
.callback-detail__facts {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 28px;
    margin: 0;
    padding: 12px 16px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
}
.callback-detail__facts dt {
    color: var(--el-text-color-secondary);
}
.callback-detail__facts dd {
    margin: 6px 0 0;
}
.callback-detail__retry {
    display: flex;
    align-items: center;
    gap: 12px;
}
.transaction-page__table {
    border-radius: 6px;
    overflow: hidden;
}

.transaction-page__table :deep(.el-table__header-wrapper th) {
    height: 34px;
    background: #f7f9fc;
    color: #364152;
    font-size: 12px;
    font-weight: 700;
}

.transaction-page__table :deep(.el-table__cell) {
    padding: 6px 0;
}

.transaction-page__table :deep(.el-table__body tr:nth-child(even) td.el-table__cell) {
    background: #fbfcfe;
}

.transaction-page__table :deep(.el-table__body tr:hover > td.el-table__cell) {
    background: #f3f7ff;
}

.transaction-page__table :deep(.el-tag) {
    min-width: 54px;
    justify-content: center;
    border-radius: 4px;
}
</style>
