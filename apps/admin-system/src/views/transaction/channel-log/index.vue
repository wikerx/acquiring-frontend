<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.logSearch.title')"
            :description="t('transaction.logSearch.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            inline-time
            label-width="96px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.channelCode')"><el-input v-model.trim="query.channelCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')"><el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <el-form-item :label="t('transaction.fields.interactionType')"><el-input v-model.trim="query.interactionType" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" /></el-form-item>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" v-model:preset="quickPreset" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar
            :title="t('transaction.summary.logResultTitle')"
            :description="t('transaction.summary.logResultDescription')"
            @toggle-search="showSearch = !showSearch"
            @refresh="loadData"
        />

        <StandardTable table-key="transaction-channel-log" v-loading="loading" :data="rows" row-key="interactionLogId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.logId')" min-width="210" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.interactionLogId" :label="t('transaction.fields.logId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="220" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.transactionType')" width="150" align="center">
                <template #default="{ row }">
                    <el-tag v-if="row.transactionType" size="small" effect="plain">{{ transactionTypeText(row.transactionType) }}</el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.interactionType')" width="140" align="center">
                <template #default="{ row }">{{ interactionTypeText(row.interactionType) }}</template>
            </el-table-column>
            <el-table-column prop="httpMethod" :label="t('transaction.fields.httpMethod')" width="100" align="center" />
            <el-table-column :label="t('transaction.fields.httpStatus')" width="100" align="center">
                <template #default="{ row }"><el-tag v-if="row.httpStatus" size="small" :type="httpStatusType(row.httpStatus)">{{ row.httpStatus }}</el-tag><span v-else>-</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.platformResultCode')" width="132" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="platformResultTooltip(row)" placement="top">
                        <el-tag v-if="row.platformResultCode" size="small" :type="businessResultType(row.platformResultCode)">
                            {{ platformResultText(row.platformResultCode) }}
                        </el-tag>
                        <span v-else>-</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelResponseCode')" width="132" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="channelResponseTooltip(row)" placement="top">
                        <span>{{ row.channelResponseCode || '-' }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="durationMillis" :label="t('transaction.fields.durationMillis')" width="120" align="center" />
            <el-table-column :label="t('transaction.fields.interactionTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.interactionTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="100" fixed="right" align="center">
                <template #default="{ row }"><el-button type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:channel-log:detail'">{{ t('common.detail') }}</el-button></template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.channelLog.detailTitle')" size="lg">
            <TransactionRecordList :rows="detailRow ? [detailRow] : []" :display-time-zone="query.queryTimeZone" />
        </CommonDetailDrawer>
    </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';
import { searchTransactionChannelLogs, type TransactionRecord } from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import TransactionRecordList from '../components/TransactionRecordList.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, defaultTransactionTodayRange, ensureTransactionTimezoneOptions, responseTooltip, splitDateRange } from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<TransactionRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const quickPreset = ref('today');
const detailVisible = ref(false);
const detailRow = ref<TransactionRecord | null>(null);
const timezoneOptions = ref<SelectOption[]>([]);
const query = reactive({ channelCode: '', transactionId: '', interactionType: '', queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE });

onMounted(async () => {
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
        const result = await searchTransactionChannelLogs({
            pageNo: page.value,
            pageSize: pageSize.value,
            channelCode: query.channelCode || undefined,
            transactionId: query.transactionId || undefined,
            interactionType: query.interactionType || undefined,
            queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
            ...splitDateRange(dateRange.value),
        });
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

function handleReset() {
    query.channelCode = '';
    query.transactionId = '';
    query.interactionType = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(row: TransactionRecord) {
    detailRow.value = row;
    detailVisible.value = true;
}

function transactionTypeText(value?: unknown) {
    const type = String(value || '');
    return type ? t(`transaction.type.${type}`, type) : '-';
}

function interactionTypeText(value?: unknown) {
    const type = String(value || '').toUpperCase();
    const labels: Record<string, string> = {
        REQUEST: '请求',
        RESPONSE: '响应',
        REQUEST_RESPONSE: '请求/响应',
        EXCEPTION: '异常',
    };
    return labels[type] || type || '-';
}

function httpStatusType(value?: number | string) {
    const status = Number(value);
    if (status >= 200 && status < 300) {
        return 'success';
    }
    if (status >= 400) {
        return 'danger';
    }
    return 'warning';
}

function businessResultType(value?: unknown) {
    const status = String(value || '').toUpperCase();
    if (['SUCCESS', 'APPROVED', 'ACCEPTED', 'VALID'].includes(status)) {
        return 'success';
    }
    if (['FAILED', 'ERROR', 'DECLINED', 'INVALID', 'REJECTED', 'TIMEOUT'].includes(status)) {
        return 'danger';
    }
    if (['PENDING', 'PROCESSING', 'RETRYING'].includes(status)) {
        return 'warning';
    }
    return 'info';
}

function platformResultText(value?: unknown) {
    const status = String(value || '');
    return status ? t(`transaction.status.${status}`, status) : '-';
}

function platformResultTooltip(row: TransactionRecord) {
    return responseTooltip(String(row.platformResultCode || ''), String(row.platformFailReason || row.channelResponseMessage || ''));
}

function channelResponseTooltip(row: TransactionRecord) {
    return responseTooltip(String(row.channelResponseCode || ''), String(row.channelResponseMessage || ''));
}
</script>

<style scoped>
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
