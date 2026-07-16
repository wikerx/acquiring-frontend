<template>
    <div class="app-container transaction-page">
        <TransactionSearchPanel
            :visible="showSearch"
            :model="query"
            :title="t('transaction.search.title')"
            :description="t('transaction.search.description')"
            :expand-text="t('transaction.search.expand')"
            :collapse-text="t('transaction.search.collapse')"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            @search="handleSearch"
            @reset="handleReset"
        >
            <el-form-item :label="t('transaction.fields.merchantId')">
                <MerchantRemoteSelect v-model="query.merchantId" @change="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.merchantOrderNo')">
                <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionId')">
                <el-input v-model.trim="query.transactionId" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.channelOrderNo')">
                <el-input v-model.trim="query.channelOrderNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionType')">
                <el-select v-model="query.transactionType" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in typeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.transactionStatus')">
                <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.channelCode')">
                <el-select v-model="query.channelCode" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.channelCode" :label="item.channelName ? `${item.channelCode} / ${item.channelName}` : item.channelCode" :value="item.channelCode" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('transaction.fields.paymentMethod')">
                <el-select v-model="query.paymentMethod" :placeholder="t('common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <template #advanced>
                <el-form-item :label="t('transaction.fields.cardBrand')">
                    <el-select v-model="query.paymentBrand" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.cardBin')">
                    <el-input v-model.trim="query.cardBin" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.merchantResponseCode')">
                    <el-input v-model.trim="query.merchantResponseCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelResponseCode')">
                    <el-input v-model.trim="query.channelResponseCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.authCode')">
                    <el-input v-model.trim="query.authCode" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.acquirerReferenceNo')">
                    <el-input v-model.trim="query.acquirerReferenceNo" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
                </el-form-item>
                <el-form-item :label="t('transaction.fields.channelMatchStatus')">
                    <el-select v-model="query.channelMatchStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in channelMatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.reconciliationStatus')">
                    <el-select v-model="query.reconciliationStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in reconciliationStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('transaction.fields.settlementStatus')">
                    <el-select v-model="query.settlementStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                        <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
            </template>
            <template #time>
                <el-form-item :label="t('transaction.fields.transactionDateTime')" class="transaction-time-form-item">
                    <TransactionTimeRangeFilter v-model="dateRange" v-model:time-zone="query.queryTimeZone" :timezone-options="timezoneOptions" default-preset="today" />
                </el-form-item>
            </template>
        </TransactionSearchPanel>

        <TransactionResultBar :items="summaryItems" @toggle-search="showSearch = !showSearch" @refresh="loadData" />

        <StandardTable table-key="transaction-operation" v-loading="loading" :data="rows" row-key="transactionId" size="small" class="transaction-page__table">
            <el-table-column :label="t('transaction.fields.transactionId')" min-width="214" fixed="left" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantId')" min-width="130" align="center">
                <template #default="{ row }">
                    <div v-if="row.merchantId" class="transaction-page__merchant-cell">
                        <button class="transaction-page__link" type="button" @click="openMerchant(row.merchantId)">{{ row.merchantId }}</button>
                        <CopyableText :value="row.merchantId" :label="t('transaction.fields.merchantId')" icon-only />
                    </div>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantOrderNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionType')" width="144" align="center">
                <template #default="{ row }"><el-tag size="small" effect="plain">{{ tagText(typeOptions, row.transactionType) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.labelAmount')" width="150" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ moneyText(row.labelAmount, row.labelCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionAmount')" width="150" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ moneyText(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                <template #default="{ row }"><span class="transaction-page__money-cell">{{ rateText(row.transactionRate) }}</span></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionStatus')" width="118" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusTagType(row.transactionStatus, statusOptions)">{{ tagText(statusOptions, row.transactionStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelMatchStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.channelMatchStatus)">{{ tagText(channelMatchStatusOptions, row.channelMatchStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.reconciliationStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.reconciliationStatus)">{{ tagText(reconciliationStatusOptions, row.reconciliationStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.settlementStatus')" width="128" align="center">
                <template #default="{ row }"><el-tag size="small" :type="statusOptionTagType(row.settlementStatus)">{{ tagText(settlementStatusOptions, row.settlementStatus) }}</el-tag></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantNotificationStatus')" width="138" align="center">
                <template #default="{ row }">
                    <el-tag v-if="row.merchantNotificationStatus" size="small" :type="statusOptionTagType(row.merchantNotificationStatus)">
                        {{ tagText(merchantNotificationStatusOptions, row.merchantNotificationStatus) }}
                    </el-tag>
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.merchantResponseCode')" width="128" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="responseTooltip(row.merchantResponseCode, row.merchantResponseMessage)" placement="top">
                        <el-tag size="small" effect="plain">{{ row.merchantResponseCode || '-' }}</el-tag>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column prop="channelCode" :label="t('transaction.fields.channelCode')" width="116" align="center" />
            <el-table-column :label="t('transaction.fields.paymentMethodCardBrand')" width="138" align="center">
                <template #default="{ row }">
                    <PaymentLogoGroup v-if="paymentLogos(row).length" :keys="paymentLogos(row)" size="sm" align="center" />
                    <span v-else>-</span>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.cardBin')" width="132" align="center">
                <template #default="{ row }">{{ cardDisplayText(row.cardNumberMasked, row.cardBin) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelOrderNo')" min-width="204" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.channelResponseCode')" width="128" align="center">
                <template #default="{ row }">
                    <el-tooltip :content="responseTooltip(row.channelResponseCode, row.channelResponseMessage)" placement="top">
                        <span>{{ row.channelResponseCode || '-' }}</span>
                    </el-tooltip>
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.accessType')" width="128" align="center">
                <template #default="{ row }">{{ accessTypeText(t, row.accessType) }}</template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.transactionDateTime')" min-width="172" align="center">
                <template #default="{ row }"><BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.authCode')" width="118" align="center">
                <template #default="{ row }">
                    <CopyableText :value="row.authCode" :label="t('transaction.fields.authCode')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('transaction.fields.acquirerReferenceNo')" min-width="190" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">
                    <CopyableText :value="row.acquirerReferenceNo" :label="t('transaction.fields.acquirerReferenceNo')" />
                </template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="210" fixed="right" align="center">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row.transactionId)" v-hasPermi="'transaction:operation:detail'">{{ t('common.detail') }}</el-button>
                    <el-tooltip :content="canRefund(row) ? t('transaction.actions.refundTip') : t('transaction.actions.refundDisabled')" placement="top">
                        <span><el-button size="small" type="primary" link :disabled="!canRefund(row)" @click="openRefundDialog(row)" v-hasPermi="'transaction:operation:refund'">{{ t('transaction.actions.refund') }}</el-button></span>
                    </el-tooltip>
                    <el-tooltip :content="canVoid(row) ? t('transaction.actions.voidTip') : t('transaction.actions.voidDisabled')" placement="top">
                        <span><el-button size="small" type="primary" link :disabled="!canVoid(row)" @click="openVoidDialog(row)" v-hasPermi="'transaction:operation:void'">{{ t('transaction.actions.void') }}</el-button></span>
                    </el-tooltip>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <TransactionDetailDrawer
            v-model:visible="detailVisible"
            :title="t('transaction.detail.title')"
            :detail="detail"
            :focus-transaction-id="selectedDetailTransactionId"
            :display-time-zone="query.queryTimeZone"
            :loading="detailLoading"
        />
        <TransactionMerchantDrawer v-model:visible="merchantVisible" :merchant-id="selectedMerchantId" />

        <el-dialog v-model="refundVisible" :title="t('transaction.actions.refundTitle')" width="640px" append-to-body class="transaction-action-dialog">
            <div v-if="selectedOperation" class="transaction-action-summary">
                <div>
                    <span>{{ t('transaction.fields.transactionId') }}</span>
                    <strong>{{ selectedOperation.transactionId }}</strong>
                </div>
                <div>
                    <span>{{ t('transaction.fields.amount') }}</span>
                    <strong>{{ moneyText(selectedOperation.transactionAmount, selectedOperation.transactionCurrency, selectedOperation.currencyExponent) }}</strong>
                </div>
                <div>
                    <span>{{ t('transaction.fields.availableRefundAmount') }}</span>
                    <strong>{{ moneyText(selectedOperation.availableRefundAmount, selectedOperation.transactionCurrency, selectedOperation.currencyExponent) }}</strong>
                </div>
            </div>
            <div v-if="selectedOperation" class="transaction-action-balance">
                <div>
                    <span>{{ t('transaction.actions.remainingRefundable') }}</span>
                    <strong>{{ moneyText(selectedOperation.availableRefundAmount, selectedOperation.transactionCurrency, selectedOperation.currencyExponent) }}</strong>
                </div>
                <el-button size="small" type="primary" plain @click="fillRemainingRefundAmount">
                    {{ t('transaction.actions.fullRemainingRefund') }}
                </el-button>
            </div>
            <el-form :model="refundForm" label-width="112px" class="transaction-action-form">
                <el-form-item :label="t('transaction.actions.refundAmount')" required>
                    <el-input v-model.trim="refundForm.amount" :placeholder="t('transaction.actions.amountPlaceholder')" clearable @blur="normalizeRefundAmount">
                        <template #append>{{ refundForm.currency || selectedOperation?.transactionCurrency || '-' }}</template>
                    </el-input>
                    <div v-if="refundAmountError" class="transaction-action-error">{{ refundAmountError }}</div>
                </el-form-item>
                <el-form-item :label="t('transaction.actions.reason')">
                    <el-input v-model.trim="refundForm.reason" type="textarea" :rows="3" maxlength="256" show-word-limit :placeholder="t('transaction.actions.reasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" :disabled="Boolean(refundAmountError)" @click="submitRefund">{{ t('transaction.actions.refund') }}</el-button>
                    <el-button @click="refundVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="voidVisible" :title="t('transaction.actions.voidTitle')" width="600px" append-to-body class="transaction-action-dialog">
            <div v-if="selectedOperation" class="transaction-action-summary transaction-action-summary--warning">
                <div>
                    <span>{{ t('transaction.fields.transactionId') }}</span>
                    <strong>{{ selectedOperation.transactionId }}</strong>
                </div>
                <div>
                    <span>{{ t('transaction.fields.transactionStatus') }}</span>
                    <strong>{{ optionText(statusOptions, selectedOperation.transactionStatus) }}</strong>
                </div>
                <div>
                    <span>{{ t('transaction.fields.amount') }}</span>
                    <strong>{{ moneyText(selectedOperation.transactionAmount, selectedOperation.transactionCurrency, selectedOperation.currencyExponent) }}</strong>
                </div>
            </div>
            <div v-if="selectedOperation" class="transaction-action-balance is-warning">
                <div>
                    <span>{{ t('transaction.actions.voidAmount') }}</span>
                    <strong>{{ moneyText(selectedOperation.availableCaptureAmount || selectedOperation.transactionAmount, selectedOperation.transactionCurrency, selectedOperation.currencyExponent) }}</strong>
                </div>
                <el-tag type="warning" effect="plain">{{ t('transaction.actions.fullVoidOnly') }}</el-tag>
            </div>
            <p class="transaction-action-warning">{{ t('transaction.actions.voidWarning') }}</p>
            <el-form :model="voidForm" label-width="112px" class="transaction-action-form">
                <el-form-item :label="t('transaction.actions.reason')">
                    <el-input v-model.trim="voidForm.reason" type="textarea" :rows="3" maxlength="256" show-word-limit :placeholder="t('transaction.actions.reasonPlaceholder')" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="actionSubmitting" @click="submitVoid">{{ t('transaction.actions.void') }}</el-button>
                    <el-button @click="voidVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    getTransactionOperationDetail,
    refundTransactionOperation,
    searchTransactionOperationsWithSummary,
    voidTransactionOperation,
    type TransactionAmountSummary,
    type TransactionDetail,
    type TransactionOperation,
    type TransactionOperationSummary,
    type TransactionPaymentMethodSummary,
} from '@/api/transaction';
import type { ChannelOption } from '@/api/channel';
import { loadChannelOptions, loadDictOptions, type SelectOption } from '@/views/channel/shared';
import CopyableText from '../components/CopyableText.vue';
import MerchantRemoteSelect from '../components/MerchantRemoteSelect.vue';
import TransactionDetailDrawer from '../components/TransactionDetailDrawer.vue';
import TransactionMerchantDrawer from '../components/TransactionMerchantDrawer.vue';
import TransactionResultBar from '../components/TransactionResultBar.vue';
import TransactionSearchPanel from '../components/TransactionSearchPanel.vue';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    accessTypeText,
    cardDisplayText,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    fallbackTransactionStatusOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    moneyText,
    openTransactionDetail,
    optionText,
    rateText,
    responseTooltip,
    splitDateRange,
    statusOptionTagType,
    statusTagType,
    tagText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
} from '../shared';

const { t, locale } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const refundVisible = ref(false);
const voidVisible = ref(false);
const merchantVisible = ref(false);
const actionSubmitting = ref(false);
const rows = ref<TransactionOperation[]>([]);
const operationSummary = ref<TransactionOperationSummary | null>(null);
const detail = ref<TransactionDetail | null>(null);
const selectedOperation = ref<TransactionOperation | null>(null);
const selectedDetailTransactionId = ref('');
const selectedMerchantId = ref('');
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const dateRange = ref<string[]>(defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE));
const query = reactive({
    merchantId: '',
    merchantOrderNo: '',
    transactionId: '',
    transactionType: '',
    transactionStatus: '',
    channelCode: '',
    paymentMethod: '',
    paymentBrand: '',
    cardBin: '',
    channelOrderNo: '',
    merchantResponseCode: '',
    channelResponseCode: '',
    authCode: '',
    acquirerReferenceNo: '',
    channelMatchStatus: '',
    reconciliationStatus: '',
    settlementStatus: '',
    queryTimeZone: DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
});
const typeOptions = ref<TransactionDictOption[]>([]);
const statusOptions = ref<TransactionDictOption[]>([]);
const channelOptions = ref<ChannelOption[]>([]);
const paymentMethodOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const channelMatchStatusOptions = ref<TransactionDictOption[]>([]);
const reconciliationStatusOptions = ref<TransactionDictOption[]>([]);
const settlementStatusOptions = ref<TransactionDictOption[]>([]);
const merchantNotificationStatusOptions = ref<TransactionDictOption[]>([]);
const timezoneOptions = ref<SelectOption[]>([]);
const refundForm = reactive({
    amount: '',
    currency: '',
    reason: '',
});
const voidForm = reactive({
    reason: '',
});

const emptySummary = (): TransactionOperationSummary => ({
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    amountSummaries: [],
    successAmountSummaries: [],
    failedAmountSummaries: [],
    paymentMethodSummaries: [],
});

const summary = computed(() => operationSummary.value || emptySummary());

const successRateText = computed(() => {
    if (!summary.value.totalCount) {
        return '0.00%';
    }
    return `${((summary.value.successCount / summary.value.totalCount) * 100).toFixed(2)}%`;
});

const summaryItems = computed(() => [
    {
        key: 'total',
        label: t('transaction.summary.total'),
        value: total.value.toLocaleString(),
        description: t('transaction.summary.matched', { count: total.value }),
        details: amountSummaryDetails(summary.value.amountSummaries),
    },
    {
        key: 'success',
        label: t('transaction.summary.success'),
        value: summary.value.successCount.toLocaleString(),
        description: t('transaction.summary.successRate', { rate: successRateText.value }),
        tone: 'success' as const,
        details: amountSummaryDetails(summary.value.successAmountSummaries),
    },
    {
        key: 'failed',
        label: t('transaction.summary.failed'),
        value: summary.value.failedCount.toLocaleString(),
        description: t('transaction.summary.matchedFailed'),
        tone: 'danger' as const,
        details: amountSummaryDetails(summary.value.failedAmountSummaries),
    },
    {
        key: 'paymentMethod',
        label: t('transaction.summary.paymentMethod'),
        value: '',
        description: t('transaction.summary.matchedPaymentMethod'),
        tone: 'balance' as const,
        details: paymentMethodSummaryDetails(),
    },
]);

const refundAmountError = computed(() => validateRefundAmount());

onMounted(async () => {
    await loadDictionaries();
    await loadData();
});

async function loadDictionaries() {
    typeOptions.value = fallbackTransactionTypeOptions(t);
    statusOptions.value = fallbackTransactionStatusOptions(t);
    channelMatchStatusOptions.value = fallbackStatusOptions('channelMatch');
    reconciliationStatusOptions.value = fallbackStatusOptions('reconciliation');
    settlementStatusOptions.value = fallbackStatusOptions('settlement');
    merchantNotificationStatusOptions.value = fallbackStatusOptions('merchantNotification');
    try {
        const [types, statuses, channels, paymentMethods, cardBrands, channelMatches, reconciliations, settlements, merchantNotificationStatuses, timezones] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
            loadChannelOptions(),
            loadDictOptions('acquiring_payment_method', String(locale.value || 'zh-CN')),
            loadDictOptions('card_brand', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('reconciliation_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('merchant_notification_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        typeOptions.value = types.length ? types : typeOptions.value;
        statusOptions.value = statuses.length ? statuses : statusOptions.value;
        channelOptions.value = channels;
        paymentMethodOptions.value = paymentMethods;
        cardBrandOptions.value = cardBrands;
        channelMatchStatusOptions.value = channelMatches.length ? channelMatches : channelMatchStatusOptions.value;
        reconciliationStatusOptions.value = reconciliations.length ? reconciliations : reconciliationStatusOptions.value;
        settlementStatusOptions.value = settlements.length ? settlements : settlementStatusOptions.value;
        merchantNotificationStatusOptions.value = merchantNotificationStatuses.length ? merchantNotificationStatuses : merchantNotificationStatusOptions.value;
        timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction dictionaries, fallback options are used.', error);
        timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    }
}

async function loadData() {
    loading.value = true;
    try {
        const range = splitDateRange(dateRange.value);
        const result = await searchTransactionOperationsWithSummary({
            pageNo: page.value,
            pageSize: pageSize.value,
            merchantId: query.merchantId || undefined,
            merchantOrderNo: query.merchantOrderNo || undefined,
            transactionId: query.transactionId || undefined,
            transactionType: query.transactionType || undefined,
            transactionStatus: query.transactionStatus || undefined,
            channelCode: query.channelCode || undefined,
            paymentMethod: query.paymentMethod || undefined,
            paymentBrand: query.paymentBrand || undefined,
            cardBin: query.cardBin || undefined,
            channelOrderNo: query.channelOrderNo || undefined,
            merchantResponseCode: query.merchantResponseCode || undefined,
            channelResponseCode: query.channelResponseCode || undefined,
            authCode: query.authCode || undefined,
            acquirerReferenceNo: query.acquirerReferenceNo || undefined,
            channelMatchStatus: query.channelMatchStatus || undefined,
            reconciliationStatus: query.reconciliationStatus || undefined,
            settlementStatus: query.settlementStatus || undefined,
            queryTimeZone: query.queryTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
            ...range,
        });
        rows.value = result.page.records;
        total.value = result.page.total;
        operationSummary.value = result.summary || emptySummary();
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function handleReset() {
    query.merchantId = '';
    query.merchantOrderNo = '';
    query.transactionId = '';
    query.transactionType = '';
    query.transactionStatus = '';
    query.channelCode = '';
    query.paymentMethod = '';
    query.paymentBrand = '';
    query.cardBin = '';
    query.channelOrderNo = '';
    query.merchantResponseCode = '';
    query.channelResponseCode = '';
    query.authCode = '';
    query.acquirerReferenceNo = '';
    query.channelMatchStatus = '';
    query.reconciliationStatus = '';
    query.settlementStatus = '';
    query.queryTimeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
    dateRange.value = defaultTransactionTodayRange(DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    handleSearch();
}

function openDetail(transactionId: string) {
    selectedDetailTransactionId.value = transactionId;
    openTransactionDetail(transactionId, detailLoading, detailVisible, detail, getTransactionOperationDetail, t('common.loadFailed'));
}

function openMerchant(merchantId: string) {
    selectedMerchantId.value = merchantId;
    merchantVisible.value = true;
}

function paymentLogos(row: TransactionOperation): PaymentLogoKey[] {
    return transactionPaymentLogoKeys(row.paymentMethod, row.paymentBrand);
}

function fallbackStatusOptions(scope: 'channelMatch' | 'reconciliation' | 'settlement' | 'merchantNotification'): TransactionDictOption[] {
    const values = scope === 'channelMatch'
        ? ['NOT_REQUIRED', 'PENDING', 'MATCHED', 'MISMATCHED', 'FAILED']
        : scope === 'reconciliation'
            ? ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED']
            : scope === 'settlement'
                ? ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED']
                : ['INIT', 'PROCESSING', 'SUCCESS', 'FAILED', 'CLOSED'];
    return values.map((value) => ({ label: t(`transaction.statusOption.${value}`, value), value }));
}

function canRefund(row: TransactionOperation) {
    if (row.transactionStatus !== 'SUCCESS') {
        return false;
    }
    const availableRefundAmount = Number(row.availableRefundAmount);
    if (Number.isFinite(availableRefundAmount)) {
        return availableRefundAmount > 0;
    }
    return ['PAYMENT', 'CAPTURE'].includes(row.transactionType);
}

function amountSummaryDetails(amountSummaries: TransactionAmountSummary[]) {
    if (!amountSummaries.length) {
        return [];
    }
    return amountSummaries.slice(0, 4).map((item) => ({
        key: item.currency || '-',
        value: amountSummaryText(item),
        description: '',
    }));
}

function paymentMethodSummaryDetails() {
    const details = summary.value.paymentMethodSummaries.slice(0, 4).map((item) => ({
        key: paymentSummaryKey(item),
        label: paymentSummaryLabel(item),
        value: `${t('transaction.summary.countUnit', { count: item.count })}  ${amountSummaryInlineText(item.amountSummaries)}`,
        description: '',
        logoKeys: transactionPaymentLogoKeys(item.paymentMethod, item.paymentBrand),
    }));
    if (!details.length) {
        return [];
    }
    return details;
}

function amountSummaryInlineText(amountSummaries: TransactionAmountSummary[]) {
    const text = amountSummaries
        .slice(0, 1)
        .map((item) => amountSummaryText(item))
        .join('    ');
    return text || '-';
}

function amountSummaryText(item: TransactionAmountSummary) {
    return moneyText(item.amount ?? 0, item.currency || '-', item.currencyExponent);
}

function paymentSummaryKey(item: TransactionPaymentMethodSummary) {
    return item.paymentMethod === 'BANK_CARD'
        ? `${item.paymentMethod || '-'}:${item.paymentBrand || '-'}`
        : item.paymentMethod || '-';
}

function paymentSummaryLabel(item: TransactionPaymentMethodSummary) {
    if (item.paymentMethod === 'BANK_CARD') {
        return tagText(cardBrandOptions.value, item.paymentBrand);
    }
    return tagText(paymentMethodOptions.value, item.paymentMethod);
}

function canVoid(row: TransactionOperation) {
    if (row.transactionStatus !== 'SUCCESS' || !['AUTHORIZATION', 'PRE_AUTHORIZATION'].includes(row.transactionType)) {
        return false;
    }
    const capturedAmount = Number(row.capturedAmount);
    const refundedAmount = Number(row.refundedAmount);
    return (!Number.isFinite(capturedAmount) || capturedAmount === 0)
        && (!Number.isFinite(refundedAmount) || refundedAmount === 0);
}

function openRefundDialog(row: TransactionOperation) {
    selectedOperation.value = row;
    const defaultAmount = row.availableRefundAmount ?? row.transactionAmount;
    refundForm.amount = defaultAmount === undefined || defaultAmount === null ? '' : String(defaultAmount);
    refundForm.currency = row.transactionCurrency || '';
    refundForm.reason = '';
    refundVisible.value = true;
}

function fillRemainingRefundAmount() {
    if (!selectedOperation.value) {
        return;
    }
    const amount = selectedOperation.value.availableRefundAmount ?? selectedOperation.value.transactionAmount;
    refundForm.amount = amount === undefined || amount === null ? '' : String(amount);
}

function normalizeRefundAmount() {
    const amount = Number(refundForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return;
    }
    refundForm.amount = String(amount);
}

function validateRefundAmount() {
    if (!refundVisible.value || !selectedOperation.value || !refundForm.amount) {
        return '';
    }
    const refundAmount = Number(refundForm.amount);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
        return t('transaction.actions.amountRequired');
    }
    const availableRefundAmount = Number(selectedOperation.value.availableRefundAmount);
    if (Number.isFinite(availableRefundAmount) && refundAmount > availableRefundAmount) {
        return t('transaction.actions.amountExceedsAvailable');
    }
    return '';
}

function openVoidDialog(row: TransactionOperation) {
    selectedOperation.value = row;
    voidForm.reason = '';
    voidVisible.value = true;
}

async function submitRefund() {
    if (!selectedOperation.value) {
        return;
    }
    const refundAmount = Number(refundForm.amount);
    const errorMessage = validateRefundAmount();
    if (errorMessage || !refundForm.amount || !Number.isFinite(refundAmount) || refundAmount <= 0) {
        ElMessage.error(errorMessage || t('transaction.actions.amountRequired'));
        return;
    }
    actionSubmitting.value = true;
    try {
        const result = await refundTransactionOperation(selectedOperation.value.transactionId, {
            amount: refundForm.amount,
            currency: refundForm.currency || selectedOperation.value.transactionCurrency,
            reason: refundForm.reason || undefined,
        });
        ElMessage.success(t('transaction.actions.refundSuccess', { transactionId: result.transactionId }));
        refundVisible.value = false;
        await refreshAfterAction(selectedOperation.value.transactionId);
    } finally {
        actionSubmitting.value = false;
    }
}

async function submitVoid() {
    if (!selectedOperation.value) {
        return;
    }
    actionSubmitting.value = true;
    try {
        const result = await voidTransactionOperation(selectedOperation.value.transactionId, {
            reason: voidForm.reason || undefined,
        });
        ElMessage.success(t('transaction.actions.voidSuccess', { transactionId: result.transactionId }));
        voidVisible.value = false;
        await refreshAfterAction(selectedOperation.value.transactionId);
    } finally {
        actionSubmitting.value = false;
    }
}

async function refreshAfterAction(transactionId: string) {
    await loadData();
    if (detailVisible.value) {
        openDetail(transactionId);
    }
}

</script>

<style scoped>
.transaction-page__link {
    border: 0;
    padding: 0;
    background: transparent;
    color: var(--el-color-primary);
    font-weight: 500;
    cursor: pointer;
}

.transaction-page__merchant-cell {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    justify-content: center;
    gap: 4px;
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

.transaction-page__table :deep(.cell) {
    line-height: 20px;
}

.transaction-page__table :deep(.el-tag) {
    min-width: 54px;
    justify-content: center;
    border-radius: 4px;
}

.transaction-page__table :deep(.payment-logo-group) {
    justify-content: center;
}

.transaction-page__table :deep(.base-date-time),
.transaction-page__table :deep(.copyable-text),
.transaction-page__table :deep(.el-button) {
    font-size: 12px;
}

.transaction-page__money-cell {
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    width: 100%;
    color: var(--el-text-color-primary);
    font-family: Arial, "Helvetica Neue", Helvetica, sans-serif;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

.transaction-page__money-cell :deep(.currency),
.transaction-page__money-currency {
    color: var(--el-text-color-secondary);
    font-size: 11px;
}

.transaction-action-summary {
    display: grid;
    gap: 10px;
    padding: 14px 16px;
    margin-bottom: 18px;
    background: #f6f8fb;
    border: 1px solid #e5eaf3;
    border-radius: 8px;
}

.transaction-action-balance {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border: 1px solid rgba(64, 158, 255, 0.22);
    border-radius: 8px;
    padding: 12px 14px;
    margin: -4px 0 18px;
    background: rgba(64, 158, 255, 0.06);
}

.transaction-action-balance.is-warning {
    border-color: rgba(230, 162, 60, 0.28);
    background: rgba(230, 162, 60, 0.08);
}

.transaction-action-balance span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-action-balance strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 18px;
    line-height: 26px;
}

.transaction-action-error {
    width: 100%;
    margin-top: 6px;
    color: var(--el-color-danger);
    font-size: 12px;
    line-height: 18px;
}

.transaction-action-summary > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-size: 13px;
}

.transaction-action-summary span {
    color: var(--el-text-color-secondary);
}

.transaction-action-summary strong {
    min-width: 0;
    color: var(--el-text-color-primary);
    overflow-wrap: anywhere;
}

.transaction-action-summary--warning {
    background: #fff8ed;
    border-color: #f3d19e;
}

.transaction-action-warning {
    margin: 0 0 16px;
    color: var(--el-text-color-regular);
    line-height: 1.7;
}

.transaction-action-form {
    padding-right: 8px;
}

@media (max-width: 640px) {
    .transaction-action-balance {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>
