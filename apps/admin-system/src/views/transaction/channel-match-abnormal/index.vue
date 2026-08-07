<template>
    <div class="app-container transaction-page abnormal-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.abnormal.searchTitle')"
            :description="t('transaction.abnormal.searchDescription')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            label-width="104px"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.abnormal.eventStatus')">
                <el-select v-model="query.eventStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in eventStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.abnormal.abnormalType')">
                    <el-select v-model="query.abnormalType" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in abnormalTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelCode')">
                    <el-input v-model.trim="query.channelCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelOrderNo')">
                    <el-input v-model.trim="query.channelOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.abnormal.assignedToId')">
                    <el-input v-model.trim="query.assignedToId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.abnormal.detectSource')">
                    <el-select v-model="query.detectSource" :placeholder="t('common.pleaseSelect')" clearable>
                        <el-option v-for="item in detectSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.abnormal.minimumOccurrenceCount')">
                    <el-input-number v-model="query.minimumOccurrenceCount" :min="1" :max="999999" controls-position="right" />
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter
                        v-model="dateRange"
                        v-model:time-zone="query.queryTimeZone"
                        v-model:preset="quickPreset"
                        :timezone-options="timezoneOptions"
                        default-preset="today"
                    />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <el-row class="mb8 transaction-table-toolbar">
            <el-col :span="24" class="abnormal-page__bulk-actions">
                <el-button type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport" v-hasPermi="'transaction:match-abnormal:export'">
                    {{ t('common.export') }}
                </el-button>
                <el-button type="primary" plain size="small" :icon="Refresh" :disabled="!selectedRows.length" :loading="batchLoading" @click="handleBatchRequery" v-hasPermi="'transaction:match-abnormal:batch-requery'">
                    {{ t('transaction.abnormal.batchRequery') }}
                </el-button>
                <span v-if="selectedRows.length" class="abnormal-page__selection-count">{{ t('transaction.abnormal.selectedCount', { count: selectedRows.length }) }}</span>
            </el-col>
        </el-row>

        <StandardTable
            table-key="transaction-channel-match-abnormal"
            v-loading="loading"
            :data="rows"
            row-key="abnormalEventId"
            size="small"
            class="transaction-page__table"
            @selection-change="selectedRows = $event"
        >
            <el-table-column type="selection" width="46" fixed="left" :selectable="isActive" />
            <el-table-column :label="t('transaction.abnormal.eventId')" min-width="190" fixed="left" align="center" show-overflow-tooltip>
                <template #default="{ row }"><CopyableText :value="row.abnormalEventId" :label="t('transaction.abnormal.eventId')" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="210" align="center" show-overflow-tooltip>
                <template #default="{ row }"><CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" /></template>
            </el-table-column>
            <el-table-column prop="merchantId" :label="t('transaction.fields.merchantId')" min-width="130" align="center" />
            <el-table-column prop="merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" min-width="180" align="center" show-overflow-tooltip />
            <el-table-column :label="t('transaction.abnormal.abnormalType')" min-width="184" align="center">
                <template #default="{ row }"><el-tag size="small" :type="abnormalTypeTagType(row.abnormalType)" effect="light">{{ optionText(abnormalTypeOptions, row.abnormalType) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.abnormalLevel')" width="104" align="center">
                <template #default="{ row }"><el-tag size="small" :type="levelTagType(row.abnormalLevel)">{{ optionText(abnormalLevelOptions, row.abnormalLevel) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.eventStatus')" width="116" align="center">
                <template #default="{ row }"><el-tag size="small" :type="eventTagType(row.eventStatus)" effect="plain">{{ optionText(eventStatusOptions, row.eventStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.platformStatus')" width="120" align="center">
                <template #default="{ row }"><el-tag size="small" :type="transactionStatusTagType(row.platformStatus)" effect="plain">{{ row.platformStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="112" align="center" />
            <el-table-column :label="t('transaction.abnormal.channelStatus')" width="126" align="center" show-overflow-tooltip>
                <template #default="{ row }"><el-tag size="small" :type="transactionStatusTagType(row.channelStatus)" effect="plain">{{ row.channelStatus || '-' }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.platformAmount')" width="150" align="center">
                <template #default="{ row }"><span class="abnormal-page__money">{{ moneyText(row.platformAmount, row.platformCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.channelAmount')" width="150" align="center">
                <template #default="{ row }"><span class="abnormal-page__money">{{ moneyText(row.channelAmount, row.channelCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.abnormal.amountDifference')" width="150" align="center">
                <template #default="{ row }"><span class="abnormal-page__money is-difference">{{ moneyText(row.amountDifference, row.platformCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column prop="occurrenceCount" :label="t('transaction.abnormal.occurrenceCount')" width="98" align="center" />
            <el-table-column prop="assignedToName" :label="t('transaction.abnormal.assignee')" width="128" align="center" />
            <el-table-column :label="t('transaction.abnormal.lastSeenTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.lastSeenTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="264" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button link type="primary" size="small" :icon="View" @click="openDetail(row)" v-hasPermi="'transaction:match-abnormal:detail'">{{ t('common.detail') }}</el-button>
                    <template v-if="isActive(row)">
                        <el-button link type="primary" size="small" @click="openAssign(row)" v-hasPermi="'transaction:match-abnormal:assign'">{{ row.assignedToId ? t('transaction.abnormal.transfer') : t('transaction.abnormal.claim') }}</el-button>
                        <el-button link type="warning" size="small" @click="handleRequery(row)" v-hasPermi="'transaction:match-abnormal:requery'">{{ t('transaction.abnormal.requery') }}</el-button>
                        <el-button link type="danger" size="small" @click="openResolve(row)" v-hasPermi="'transaction:match-abnormal:resolve'">{{ t('transaction.abnormal.resolve') }}</el-button>
                    </template>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('transaction.abnormal.detailTitle')" size="lg" :loading="detailLoading">
            <template v-if="detail?.abnormality">
                <h3 class="abnormal-page__section-title">{{ t('transaction.abnormal.caseInfo') }}</h3>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.abnormal.eventId')">{{ detail.abnormality.abnormalEventId }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.transactionId')">{{ detail.abnormality.transactionId }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.abnormalType')"><el-tag size="small" :type="abnormalTypeTagType(detail.abnormality.abnormalType)" effect="light">{{ optionText(abnormalTypeOptions, detail.abnormality.abnormalType) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.abnormalLevel')"><el-tag size="small" :type="levelTagType(detail.abnormality.abnormalLevel)">{{ optionText(abnormalLevelOptions, detail.abnormality.abnormalLevel) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.eventStatus')"><el-tag class="abnormal-page__status-tag" size="small" :type="eventTagType(detail.abnormality.eventStatus)" effect="light">{{ optionText(eventStatusOptions, detail.abnormality.eventStatus) }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.detectSource')">{{ optionText(detectSourceOptions, detail.abnormality.detectSource) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.occurrenceCount')">{{ detail.abnormality.occurrenceCount ?? 0 }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.sourceRecordType')">{{ detail.abnormality.sourceRecordType || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.description')" :span="2">{{ detail.abnormality.abnormalDescription || '-' }}</el-descriptions-item>
                </el-descriptions>
                <h3 class="abnormal-page__section-title">{{ t('transaction.abnormal.comparison') }}</h3>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.fields.merchantId')">{{ detail.abnormality.merchantId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.merchantOrderNo')">{{ detail.abnormality.merchantOrderNo || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.transactionType')">{{ detail.abnormality.transactionType || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.channelCode')">{{ detail.abnormality.channelCode || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.channelOrderNo')">{{ detail.abnormality.channelOrderNo || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.channelTransactionId')">{{ detail.abnormality.channelTransactionId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.platformStatus')"><el-tag size="small" :type="transactionStatusTagType(detail.abnormality.platformStatus)" effect="plain">{{ detail.abnormality.platformStatus || '-' }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.channelStatus')"><el-tag size="small" :type="transactionStatusTagType(detail.abnormality.channelStatus)" effect="plain">{{ detail.abnormality.channelStatus || '-' }}</el-tag></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.platformAmount')"><span class="abnormal-page__money">{{ moneyText(detail.abnormality.platformAmount, detail.abnormality.platformCurrency, detail.abnormality.currencyExponent) }}</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.channelAmount')"><span class="abnormal-page__money">{{ moneyText(detail.abnormality.channelAmount, detail.abnormality.channelCurrency, detail.abnormality.currencyExponent) }}</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.amountDifference')"><span class="abnormal-page__money is-difference">{{ moneyText(detail.abnormality.amountDifference, detail.abnormality.platformCurrency, detail.abnormality.currencyExponent) }}</span></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.channelMatchResult')">{{ detail.abnormality.channelMatchResult || '-' }}</el-descriptions-item>
                </el-descriptions>
                <h3 class="abnormal-page__section-title">{{ t('transaction.abnormal.handlingInfo') }}</h3>
                <el-descriptions :column="2" border size="small">
                    <el-descriptions-item :label="t('transaction.abnormal.assignee')">{{ detail.abnormality.assignedToName || detail.abnormality.assignedToId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.assignedTime')"><BaseDateTime :value="detail.abnormality.assignedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.resolutionType')">{{ optionText(resolutionTypeOptions, detail.abnormality.resolutionType) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.resolutionReferenceId')">{{ detail.abnormality.resolutionReferenceId || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.firstSeenTime')"><BaseDateTime :value="detail.abnormality.firstSeenTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.lastSeenTime')"><BaseDateTime :value="detail.abnormality.lastSeenTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.resolvedTime')"><BaseDateTime :value="detail.abnormality.resolvedTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.fields.transactionDateTime')"><BaseDateTime :value="detail.abnormality.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></el-descriptions-item>
                    <el-descriptions-item :label="t('transaction.abnormal.evidence')" :span="2"><pre class="abnormal-page__evidence">{{ detail.abnormality.rawReferenceJson || '-' }}</pre></el-descriptions-item>
                </el-descriptions>
            </template>
        </CommonDetailDrawer>

        <el-dialog v-model="assignVisible" :title="t('transaction.abnormal.assignTitle')" width="520px" destroy-on-close>
            <el-form label-position="top">
                <el-form-item :label="t('transaction.abnormal.assignMode')">
                    <el-radio-group v-model="assignMode" size="small">
                        <el-radio-button value="self">{{ t('transaction.abnormal.claimMyself') }}</el-radio-button>
                        <el-radio-button value="transfer">{{ t('transaction.abnormal.transfer') }}</el-radio-button>
                    </el-radio-group>
                </el-form-item>
                <template v-if="assignMode === 'transfer'">
                    <el-form-item :label="t('transaction.abnormal.assigneeAccountId')" required>
                        <el-input v-model.trim="assigneeAccountId" maxlength="128" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.abnormal.assigneeName')">
                        <el-input v-model.trim="assigneeName" maxlength="128" />
                    </el-form-item>
                </template>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionLoading" @click="submitAssign">{{ t('common.confirm') }}</el-button>
                    <el-button @click="assignVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="resolveVisible" :title="t('transaction.abnormal.resolveTitle')" width="560px" destroy-on-close>
            <el-form label-position="top">
                <el-form-item :label="t('transaction.abnormal.resolutionType')" required>
                    <el-select v-model="resolutionType" style="width: 100%">
                        <el-option v-for="item in resolutionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.abnormal.resolutionReason')" required>
                    <el-input v-model.trim="resolutionReason" type="textarea" :rows="4" maxlength="512" show-word-limit />
                </el-form-item>
                <el-form-item :label="t('transaction.abnormal.referenceId')">
                    <el-input v-model.trim="resolutionReferenceId" maxlength="64" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionLoading" @click="submitResolve">{{ t('common.confirm') }}</el-button>
                    <el-button @click="resolveVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { Download, Refresh, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    batchRequeryChannelMatchAbnormalities,
    claimChannelMatchAbnormality,
    exportChannelMatchAbnormalities,
    getChannelMatchAbnormalityDetail,
    requeryChannelMatchAbnormality,
    resolveChannelMatchAbnormality,
    searchChannelMatchAbnormalities,
    type ChannelMatchAbnormalDetail,
    type ChannelMatchAbnormalQuery,
    type ChannelMatchAbnormalRecord,
    type ChannelMatchAbnormalSummary,
} from '@/api/transaction';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    moneyText,
    splitDateRange,
    type TransactionDictOption,
} from '../shared';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const exporting = ref(false);
const batchLoading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const assignVisible = ref(false);
const resolveVisible = ref(false);
const actionLoading = ref(false);
const rows = ref<ChannelMatchAbnormalRecord[]>([]);
const selectedRows = ref<ChannelMatchAbnormalRecord[]>([]);
const selectedAction = ref<ChannelMatchAbnormalRecord | null>(null);
const detail = ref<ChannelMatchAbnormalDetail | null>(null);
const summary = ref<ChannelMatchAbnormalSummary>(emptySummary());
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const dateRange = ref<string[]>(defaultTransactionTodayRange());
const quickPreset = ref('today');
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const assignMode = ref<'self' | 'transfer'>('self');
const assigneeAccountId = ref('');
const assigneeName = ref('');
const resolutionType = ref('NO_CHANGE_REQUIRED');
const resolutionReason = ref('');
const resolutionReferenceId = ref('');
const query = reactive({
    transactionId: '', merchantId: '', merchantOrderNo: '', abnormalType: '',
    eventStatus: 'OPEN', channelCode: '', channelOrderNo: '', assignedToId: '',
    detectSource: '', minimumOccurrenceCount: undefined as number | undefined,
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});

const eventStatusOptions = options(['OPEN', 'PROCESSING', 'RESOLVED', 'IGNORED'], 'transaction.abnormal.statusOption');
const abnormalLevelOptions = options(['WARNING', 'HIGH', 'CRITICAL'], 'transaction.abnormal.levelOption');
const abnormalTypeOptions = options(['QUERY_IDENTITY_MISSING', 'QUERY_RESULT_UNKNOWN', 'STATUS_MISMATCH', 'CURRENCY_MISMATCH', 'AMOUNT_MISMATCH'], 'transaction.abnormal.typeOption');
const detectSourceOptions = options(['AUTO_QUERY', 'CALLBACK', 'STATUS_TRANSITION', 'MANUAL'], 'transaction.abnormal.detectSourceOption');
const resolutionTypeOptions = options(['NO_CHANGE_REQUIRED', 'IGNORED'], 'transaction.abnormal.resolutionOption');

const summaryItems = computed(() => [
    summaryItem('total', 'totalCount'),
    summaryItem('open', 'openCount', 'danger'),
    summaryItem('processing', 'processingCount', 'balance'),
    summaryItem('highRisk', 'highOrCriticalCount', 'danger'),
]);

onMounted(loadData);

function options(values: string[], key: string): TransactionDictOption[] {
    return values.map((value) => ({ value, label: t(`${key}.${value}`, value) }));
}

function optionText(items: TransactionDictOption[], value?: string) {
    return value ? items.find((item) => item.value === value)?.label || value : '-';
}

function summaryItem(key: string, field: keyof ChannelMatchAbnormalSummary, tone?: 'success' | 'danger' | 'balance') {
    return {
        key,
        label: t(`transaction.abnormal.summary.${key}`),
        value: Number(summary.value[field] || 0).toLocaleString(),
        description: t('transaction.abnormal.summary.currentFilter'),
        tone,
    };
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelMatchAbnormalities(buildQuery(page.value, pageSize.value));
        rows.value = result.page?.records || [];
        total.value = result.page?.total || 0;
        summary.value = result.summary || emptySummary();
        selectedRows.value = [];
    } finally {
        loading.value = false;
    }
}

async function handleExport() {
    exporting.value = true;
    try {
        await exportChannelMatchAbnormalities(buildQuery());
    } finally {
        exporting.value = false;
    }
}

function buildQuery(pageNo?: number, currentPageSize?: number): ChannelMatchAbnormalQuery {
    return {
        pageNo,
        pageSize: currentPageSize,
        transactionId: query.transactionId || undefined,
        merchantId: query.merchantId || undefined,
        merchantOrderNo: query.merchantOrderNo || undefined,
        abnormalType: query.abnormalType || undefined,
        eventStatus: query.eventStatus || undefined,
        channelCode: query.channelCode || undefined,
        channelOrderNo: query.channelOrderNo || undefined,
        assignedToId: query.assignedToId || undefined,
        detectSource: query.detectSource || undefined,
        minimumOccurrenceCount: query.minimumOccurrenceCount,
        queryTimeZone: query.queryTimeZone,
        ...splitDateRange(dateRange.value),
    };
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    Object.assign(query, {
        transactionId: '', merchantId: '', merchantOrderNo: '', abnormalType: '',
        eventStatus: 'OPEN', channelCode: '', channelOrderNo: '', assignedToId: '',
        detectSource: '', minimumOccurrenceCount: undefined, queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    });
    dateRange.value = defaultTransactionTodayRange(query.queryTimeZone);
    quickPreset.value = 'today';
    handleSearch();
}

async function openDetail(row: ChannelMatchAbnormalRecord) {
    detail.value = { abnormality: row };
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await getChannelMatchAbnormalityDetail(row.abnormalEventId, row.transactionDateTime);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.abnormal.detailLoadFailed'));
    } finally {
        detailLoading.value = false;
    }
}

function openAssign(row: ChannelMatchAbnormalRecord) {
    selectedAction.value = row;
    assignMode.value = row.assignedToId ? 'transfer' : 'self';
    assigneeAccountId.value = '';
    assigneeName.value = '';
    assignVisible.value = true;
}

async function submitAssign() {
    const row = selectedAction.value;
    if (!row) return;
    if (assignMode.value === 'transfer' && !assigneeAccountId.value) {
        ElMessage.warning(t('transaction.abnormal.assigneeRequired'));
        return;
    }
    actionLoading.value = true;
    try {
        await claimChannelMatchAbnormality(row.abnormalEventId, {
            transactionDateTime: row.transactionDateTime,
            expectedVersion: row.version,
            assigneeAccountId: assignMode.value === 'transfer' ? assigneeAccountId.value : undefined,
            assigneeName: assignMode.value === 'transfer' ? assigneeName.value || undefined : undefined,
        });
        ElMessage.success(t('common.success'));
        assignVisible.value = false;
        await loadData();
    } finally {
        actionLoading.value = false;
    }
}

async function handleRequery(row: ChannelMatchAbnormalRecord) {
    actionLoading.value = true;
    try {
        await requeryChannelMatchAbnormality(row.abnormalEventId, { transactionDateTime: row.transactionDateTime, expectedVersion: row.version });
        ElMessage.success(t('transaction.abnormal.requeryAccepted'));
        await loadData();
    } finally {
        actionLoading.value = false;
    }
}

async function handleBatchRequery() {
    batchLoading.value = true;
    try {
        const result = await batchRequeryChannelMatchAbnormalities(selectedRows.value.map((row) => ({
            eventId: row.abnormalEventId,
            transactionDateTime: row.transactionDateTime,
            expectedVersion: row.version,
        })));
        ElMessage.success(t('transaction.abnormal.batchResult', { accepted: result.acceptedCount, failed: result.failedCount }));
        await loadData();
    } finally {
        batchLoading.value = false;
    }
}

function openResolve(row: ChannelMatchAbnormalRecord) {
    selectedAction.value = row;
    resolutionType.value = 'NO_CHANGE_REQUIRED';
    resolutionReason.value = '';
    resolutionReferenceId.value = '';
    resolveVisible.value = true;
}

async function submitResolve() {
    const row = selectedAction.value;
    if (!row || !resolutionReason.value) {
        ElMessage.warning(t('transaction.abnormal.resolutionReasonRequired'));
        return;
    }
    actionLoading.value = true;
    try {
        await resolveChannelMatchAbnormality(row.abnormalEventId, {
            transactionDateTime: row.transactionDateTime,
            expectedVersion: row.version,
            resolutionType: resolutionType.value,
            reason: resolutionReason.value,
            referenceId: resolutionReferenceId.value || undefined,
        });
        ElMessage.success(t('common.success'));
        resolveVisible.value = false;
        await loadData();
    } finally {
        actionLoading.value = false;
    }
}

function isActive(row: ChannelMatchAbnormalRecord) {
    return row.eventStatus === 'OPEN' || row.eventStatus === 'PROCESSING';
}

function levelTagType(level?: string) {
    if (level === 'CRITICAL') return 'danger';
    if (level === 'HIGH') return 'warning';
    return 'info';
}

function eventTagType(status?: string) {
    if (status === 'RESOLVED') return 'success';
    if (status === 'IGNORED') return 'info';
    if (status === 'PROCESSING') return 'primary';
    return 'warning';
}

function abnormalTypeTagType(type?: string) {
    if (type === 'STATUS_MISMATCH') return 'danger';
    if (type === 'CURRENCY_MISMATCH') return 'primary';
    if (type === 'AMOUNT_MISMATCH' || type === 'QUERY_RESULT_UNKNOWN') return 'warning';
    return 'info';
}

function transactionStatusTagType(status?: string) {
    const normalized = status?.toUpperCase() || '';
    if (['SUCCESS', 'AUTHORIZED', 'AUTHORISED', 'CAPTURED', 'SETTLED'].includes(normalized)) return 'success';
    if (['FAILED', 'DECLINED', 'ERROR', 'CANCELLED', 'VOIDED'].includes(normalized)) return 'danger';
    if (['PENDING', 'REVIEW_REQUIRED'].includes(normalized)) return 'warning';
    if (['PROCESSING', 'SUBMITTED'].includes(normalized)) return 'primary';
    return 'info';
}

function emptySummary(): ChannelMatchAbnormalSummary {
    return { totalCount: 0, openCount: 0, processingCount: 0, resolvedCount: 0, ignoredCount: 0, highOrCriticalCount: 0 };
}
</script>

<style scoped>
.abnormal-page__bulk-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.abnormal-page__money {
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
}

.abnormal-page__money.is-difference {
    color: var(--el-color-danger);
}

.abnormal-page__status-tag {
    min-width: 64px;
    justify-content: center;
}

.abnormal-page__selection-count {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.abnormal-page__section-title {
    margin: 18px 0 8px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
}

.abnormal-page__section-title:first-child {
    margin-top: 0;
}

.abnormal-page__evidence {
    max-height: 180px;
    margin: 0;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
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
</style>
