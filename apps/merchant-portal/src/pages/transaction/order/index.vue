<template>
    <div class="page system-page merchant-redesigned-page merchant-transaction-page">
        <section class="merchant-list-card merchant-search-card transaction-filter-card">
            <el-form v-show="showSearch" :model="query" inline size="small" class="search-form transaction-search-form">
                <div class="transaction-search-form__fields">
                    <el-form-item :label="t('transaction.order.merchantOrderNo')">
                        <el-input v-model.trim="query.merchantOrderNo" :placeholder="t('transaction.order.merchantOrderNoPlaceholder')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.transactionId')">
                        <el-input v-model.trim="query.transactionId" :placeholder="t('transaction.order.transactionIdPlaceholder')" clearable @keyup.enter="applyQuery" />
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.transactionType')">
                        <el-select v-model="query.transactionType" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in transactionTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.status')">
                        <el-select v-model="query.transactionStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in transactionStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.paymentMethod')">
                        <el-select v-model="query.paymentMethod" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in paymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.paymentBrand')">
                        <el-select
                            v-model="query.paymentBrand"
                            class="transaction-brand-select"
                            :placeholder="t('transaction.order.paymentBrandPlaceholder')"
                            clearable
                            filterable
                        >
                            <template #prefix>
                                <PaymentLogoGroup
                                    v-if="selectedPaymentBrandLogoKeys.length"
                                    :keys="selectedPaymentBrandLogoKeys"
                                    size="sm"
                                    fallback="text"
                                    class="transaction-brand-select__prefix"
                                />
                            </template>
                            <el-option v-for="item in cardBrandOptions" :key="item.value" :label="item.label" :value="item.value">
                                <div class="transaction-brand-option">
                                    <PaymentLogoGroup
                                        v-if="cardBrandOptionLogoKeys(item).length"
                                        :keys="cardBrandOptionLogoKeys(item)"
                                        size="sm"
                                        fallback="text"
                                        class="transaction-brand-option__logo"
                                    />
                                    <span>{{ item.label }}</span>
                                    <small>{{ item.value }}</small>
                                </div>
                            </el-option>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.channelMatchStatus')">
                        <el-select v-model="query.channelMatchStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in channelMatchStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.reconciliationStatus')">
                        <el-select v-model="query.reconciliationStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in reconciliationStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.settlementStatus')">
                        <el-select v-model="query.settlementStatus" :placeholder="t('common.pleaseSelect')" clearable filterable>
                            <el-option v-for="item in settlementStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('transaction.order.timeRange')" class="transaction-time-form-item">
                        <TransactionTimeRangeFilter
                            v-model="dateRange"
                            v-model:time-zone="query.queryTimeZone"
                            v-model:preset="quickPreset"
                            :timezone-options="timezoneOptions"
                            default-preset="today"
                        />
                    </el-form-item>
                    <el-form-item class="merchant-search-actions transaction-search-actions">
                        <el-button type="primary" :icon="Search" @click="applyQuery">{{ t('common.search') }}</el-button>
                        <el-button :icon="RefreshLeft" @click="resetQuery">{{ t('common.reset') }}</el-button>
                    </el-form-item>
                </div>
            </el-form>
        </section>

        <section class="transaction-result-strip">
            <div class="transaction-result-strip__summary">
                <article v-for="item in resultRows" :key="item.key" :class="['transaction-result-row', `transaction-result-row--${item.tone}`]">
                    <div class="transaction-result-row__label">
                        <span>{{ item.label }}</span>
                    </div>
                    <div class="transaction-result-row__content">
                        <span v-if="item.countText" class="transaction-result-pill transaction-result-pill--count">{{ item.countText }}</span>
                        <span v-if="item.rateText" :class="['transaction-result-pill', 'transaction-result-pill--rate', `is-${item.rateTone}`]">{{ item.rateText }}</span>
                        <span v-for="amountItem in item.amounts" :key="amountItem.key" class="transaction-money-pill">
                            <span class="transaction-money-pill__currency">{{ amountItem.currency }}</span>
                            <b>{{ amountItem.amount }}</b>
                        </span>
                    </div>
                </article>
                <article class="transaction-result-row transaction-result-row--method">
                    <div class="transaction-result-row__label">
                        <span>{{ t('transaction.order.paymentMethodSummary') }}</span>
                    </div>
                    <div class="transaction-result-row__content">
                        <template v-if="paymentSummaryItems.length">
                            <span v-for="item in paymentSummaryItems" :key="item.key" class="transaction-method-pill" :title="item.title">
                                <PaymentLogoGroup v-if="item.logoKeys.length" :keys="item.logoKeys" size="sm" align="start" fallback="text" class="transaction-method-pill__logos" />
                                <span v-else class="transaction-method-pill__text">{{ item.label }}</span>
                                <span class="transaction-method-pill__count">{{ item.countText }}</span>
                                <span v-if="item.primaryAmount" class="transaction-money-pill transaction-money-pill--method">
                                    <span class="transaction-money-pill__currency">{{ item.primaryAmount.currency }}</span>
                                    <b>{{ item.primaryAmount.amount }}</b>
                                </span>
                            </span>
                        </template>
                        <span v-else class="transaction-result-muted">{{ t('transaction.order.noPaymentSummary') }}</span>
                    </div>
                </article>
            </div>
        </section>

        <section class="merchant-list-card merchant-table-card transaction-table-card">
            <div class="merchant-table-head transaction-table-head">
                <div class="merchant-table-head__actions">
                    <el-button v-if="canExport" type="warning" plain size="small" :icon="Download" :loading="exporting" @click="handleExport">
                        {{ t('transaction.order.export') }}
                    </el-button>
                </div>
                <RightToolbar class="transaction-table-toolbar" @toggle-search="showSearch = !showSearch" @refresh="loadData" />
            </div>
            <StandardTable table-key="merchant-transaction-order" v-loading="loading" :data="rows" row-key="transactionId" size="small">
                <el-table-column :label="t('transaction.order.merchantOrderNo')" prop="merchantOrderNo" min-width="190" fixed="left" show-overflow-tooltip>
                    <template #default="{ row }">
                        <button class="transaction-copy-link" type="button" :disabled="!row.merchantOrderNo" @click="copyOrderNo(row.merchantOrderNo)">
                            {{ row.merchantOrderNo || '-' }}
                        </button>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.systemOrderNo')" min-width="210" show-overflow-tooltip>
                    <template #default="{ row }">
                        <button class="transaction-copy-link" type="button" :disabled="systemOrderNo(row) === '-'" @click="copyOrderNo(systemOrderNo(row))">
                            {{ systemOrderNo(row) }}
                        </button>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.labelAmount')" min-width="132" align="right">
                    <template #default="{ row }">
                        <span class="transaction-money-text transaction-money-text--label">{{ money(row.labelAmount, row.labelCurrency, row.currencyExponent) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.transactionAmount')" min-width="138" align="right">
                    <template #default="{ row }">
                        <span class="transaction-money-text">{{ money(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.transactionRate')" min-width="126" align="right">
                    <template #default="{ row }">
                        <span class="transaction-rate-text">{{ rateText(row.transactionRate) }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.transactionType')" min-width="130" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" effect="plain">{{ tagText(transactionTypeOptions, row.transactionType) }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.status')" min-width="132" align="center">
                    <template #default="{ row }">
                        <el-tooltip :content="lifecycleText(row)" placement="top">
                            <el-tag size="small" :type="statusTag(row.transactionStatus, transactionStatusOptions)" effect="light">
                                {{ tagText(transactionStatusOptions, row.transactionStatus) }}
                            </el-tag>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.payment')" min-width="132" align="center">
                    <template #default="{ row }">
                        <div class="transaction-payment-logo-cell">
                            <PaymentLogoGroup v-if="assetPaymentLogos(row).length" :keys="assetPaymentLogos(row)" size="sm" align="center" fallback="hide" class="transaction-payment-cell__logos" />
                            <span v-else>-</span>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.cardBin')" prop="cardBin" min-width="108" align="center">
                    <template #default="{ row }">
                        <span class="transaction-card-bin">{{ row.cardBin || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.authCode')" prop="authCode" min-width="108" align="center">
                    <template #default="{ row }">
                        <span class="transaction-auth-code">{{ row.authCode || '-' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.channelMatchStatus')" min-width="130" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" :type="statusTag(row.channelMatchStatus, channelMatchStatusOptions)" effect="plain">
                            {{ tagText(channelMatchStatusOptions, row.channelMatchStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.settlementStatus')" min-width="126" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" :type="statusTag(row.settlementStatus, settlementStatusOptions)" effect="plain">
                            {{ tagText(settlementStatusOptions, row.settlementStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.reconciliationStatus')" min-width="126" align="center">
                    <template #default="{ row }">
                        <el-tag size="small" :type="statusTag(row.reconciliationStatus, reconciliationStatusOptions)" effect="plain">
                            {{ tagText(reconciliationStatusOptions, row.reconciliationStatus) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.response')" min-width="128" align="center">
                    <template #default="{ row }">
                        <el-tooltip :content="responseTooltip(row.merchantResponseCode, row.merchantResponseMessage)" placement="top">
                            <el-tag size="small" effect="plain">{{ row.merchantResponseCode || '-' }}</el-tag>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column :label="t('transaction.order.transactionTime')" min-width="178" align="center">
                    <template #default="{ row }">
                        <BaseDateTime :value="row.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" />
                    </template>
                </el-table-column>
                <el-table-column :label="t('common.operation')" width="150" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button v-if="canDetail" link type="primary" size="small" @click="openDetail(row)">{{ t('common.detail') }}</el-button>
                        <el-button v-if="canRefund && canRefundRow(row)" link type="primary" size="small" @click="openRefund(row)">{{ t('transaction.order.refund') }}</el-button>
                    </template>
                </el-table-column>
            </StandardTable>
            <div class="pagination-container" v-show="total > 0">
                <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
            </div>
        </section>

        <el-drawer v-model="detailVisible" :title="t('transaction.order.detailTitle')" size="min(720px, 92vw)" class="transaction-detail-drawer" destroy-on-close>
            <el-skeleton v-if="detailLoading" :rows="8" animated />
            <template v-else-if="detail">
                <div class="transaction-detail-shell">
                    <section class="transaction-detail-summary">
                        <div class="transaction-detail-summary__main">
                            <span>{{ t('transaction.order.status') }}</span>
                            <strong>{{ tagText(transactionStatusOptions, detail.order?.transactionStatus) }}</strong>
                            <small>{{ detail.order?.latestTransactionId || '-' }}</small>
                        </div>
                        <div class="transaction-detail-summary__amount">
                            <span>{{ t('transaction.order.amount') }}</span>
                            <strong>{{ money(detail.order?.currentAmount ?? detail.order?.transactionAmount, defaultCurrency(detail.order), detail.order?.currencyExponent) }}</strong>
                        </div>
                    </section>

                    <dl class="transaction-detail-grid">
                        <div>
                            <dt>{{ t('transaction.order.merchantOrderNo') }}</dt>
                            <dd>{{ detail.order?.merchantOrderNo || '-' }}</dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.systemOrderNo') }}</dt>
                            <dd>{{ systemOrderNo(detail.order) }}</dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.transactionType') }}</dt>
                            <dd>{{ tagText(transactionTypeOptions, detail.order?.transactionType) }}</dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.payment') }}</dt>
                            <dd>
                                <span class="transaction-detail-payment">
                                    <PaymentLogoGroup v-if="assetPaymentLogos(detail.order).length" :keys="assetPaymentLogos(detail.order)" size="sm" align="start" fallback="hide" />
                                    <span v-else>-</span>
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.cardBin') }}</dt>
                            <dd>{{ detail.order?.cardBin || '-' }}</dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.authCode') }}</dt>
                            <dd>{{ detail.order?.authCode || '-' }}</dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.transactionTime') }}</dt>
                            <dd><BaseDateTime :value="detail.order?.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="query.queryTimeZone" /></dd>
                        </div>
                        <div>
                            <dt>{{ t('transaction.order.response') }}</dt>
                            <dd>{{ responseTooltip(detail.order?.merchantResponseCode, detail.order?.merchantResponseMessage) }}</dd>
                        </div>
                    </dl>

                    <section class="transaction-timeline-panel">
                        <h3 class="transaction-drawer-title">{{ t('transaction.order.operationTimeline') }}</h3>
                        <el-empty v-if="!(detail.operations || []).length" :description="t('transaction.order.noTimeline')" />
                        <el-timeline v-else>
                            <el-timeline-item v-for="item in detail.operations || []" :key="item.transactionId" :timestamp="operationTimestamp(item)">
                                <div class="transaction-timeline-item">
                                    <strong>{{ tagText(transactionTypeOptions, item.transactionType) }} / {{ tagText(transactionStatusOptions, item.transactionStatus) }}</strong>
                                    <span>{{ item.transactionId }}</span>
                                    <small>{{ money(item.transactionAmount, item.transactionCurrency, item.currencyExponent) }} · {{ responseTooltip(item.merchantResponseCode, item.merchantResponseMessage) }}</small>
                                </div>
                            </el-timeline-item>
                        </el-timeline>
                    </section>
                </div>
            </template>
        </el-drawer>

        <el-dialog v-model="refundVisible" :title="t('transaction.order.refundTitle')" width="min(620px, 92vw)" class="transaction-refund-dialog" destroy-on-close>
            <section class="transaction-refund-summary">
                <div>
                            <span>{{ t('transaction.order.transactionId') }}</span>
                    <strong>{{ activeRefundRow?.transactionId || '-' }}</strong>
                </div>
                <div>
                    <span>{{ t('transaction.order.availableRefund') }}</span>
                    <strong>{{ money(activeRefundRow?.availableRefundAmount, defaultCurrency(activeRefundRow), activeRefundRow?.currencyExponent) }}</strong>
                </div>
            </section>
            <el-alert class="transaction-refund-alert" type="warning" show-icon :closable="false" :title="t('transaction.order.refundTip')" />
            <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-position="top" class="transaction-refund-form">
                <el-form-item :label="t('transaction.order.refundAmount')" prop="amount">
                    <el-input-number v-model="refundForm.amount" :min="0.01" :max="refundMaxAmount" :precision="2" controls-position="right" />
                </el-form-item>
                <el-form-item :label="t('transaction.order.currency')" prop="currency">
                    <el-input v-model.trim="refundForm.currency" maxlength="3" />
                </el-form-item>
                <el-form-item :label="t('transaction.order.refundReason')" prop="reason" class="transaction-refund-form__reason">
                    <el-input v-model.trim="refundForm.reason" type="textarea" maxlength="300" show-word-limit :autosize="{ minRows: 3, maxRows: 4 }" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" size="small" :loading="refundSaving" @click="submitRefund">{{ t('common.confirm') }}</el-button>
                    <el-button size="small" @click="refundVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
import { Download, RefreshLeft, Search } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { getPaymentLogos, PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { transactionApi, type TransactionAmountSummary, type TransactionDetail, type TransactionOperation, type TransactionOrder, type TransactionPageQuery, type TransactionPaymentMethodSummary } from '@/api/transactionApi';
import { useAuthStore } from '@/stores/authStore';
import { hasPermission } from '@/utils/permission';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    cardBrandLogoKeys,
    defaultTransactionTodayRange,
    ensureTransactionTimezoneOptions,
    fallbackCardBrandOptions,
    fallbackPaymentMethodOptions,
    fallbackStatusOptions,
    fallbackTransactionStatusOptions,
    fallbackTransactionTypeOptions,
    loadTransactionDictOptions,
    moneyText,
    rateText,
    responseTooltip,
    splitDateRange,
    statusTagType,
    tagText,
    transactionPaymentLogoKeys,
    type TransactionDictOption,
} from '../shared';

type MerchantTransactionOrderQuery = Omit<TransactionPageQuery, 'pageNo' | 'pageSize' | 'queryTimeZone'> & {
    queryTimeZone: string;
};

const { t, locale } = useI18n();
const auth = useAuthStore();
const loading = ref(false);
const exporting = ref(false);
const detailLoading = ref(false);
const detailVisible = ref(false);
const refundVisible = ref(false);
const refundSaving = ref(false);
const showSearch = ref(true);
const rows = ref<TransactionOperation[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detail = ref<TransactionDetail>();
const summary = ref<Awaited<ReturnType<typeof transactionApi.searchOperations>>['summary']>();
const activeRefundRow = ref<TransactionOperation | null>(null);
const refundFormRef = ref<FormInstance>();
const refundForm = reactive({ amount: 0, currency: '', reason: '' });
const initialQueryTimeZone = merchantDefaultTimeZone();
const query = reactive<MerchantTransactionOrderQuery>({ queryTimeZone: initialQueryTimeZone });
const dateRange = ref<string[]>(defaultTransactionTodayRange(initialQueryTimeZone));
const quickPreset = ref('today');
const transactionTypeOptions = ref<TransactionDictOption[]>(fallbackTransactionTypeOptions(t));
const transactionStatusOptions = ref<TransactionDictOption[]>(fallbackTransactionStatusOptions(t));
const paymentMethodOptions = ref<TransactionDictOption[]>(fallbackPaymentMethodOptions(t));
const cardBrandOptions = ref<TransactionDictOption[]>(fallbackCardBrandOptions());
const channelMatchStatusOptions = ref<TransactionDictOption[]>(fallbackStatusOptions(t, 'channelMatch'));
const reconciliationStatusOptions = ref<TransactionDictOption[]>(fallbackStatusOptions(t, 'reconciliation'));
const settlementStatusOptions = ref<TransactionDictOption[]>(fallbackStatusOptions(t, 'settlement'));
const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
const canDetail = hasPermission('merchant:transaction:order:detail');
const canExport = hasPermission('merchant:transaction:order:export');
const canRefund = hasPermission('merchant:transaction:order:refund');

const refundRules = computed<FormRules>(() => ({
    amount: [{ required: true, message: t('transaction.order.refundAmountRequired'), trigger: 'blur' }],
    currency: [{ required: true, message: t('transaction.order.currencyRequired'), trigger: 'blur' }],
    reason: [{ required: true, message: t('transaction.order.refundReasonRequired'), trigger: 'blur' }],
}));
const resultRows = computed(() => {
    const totalCount = Number(summary.value?.totalCount || total.value || 0);
    const successCount = Number(summary.value?.successCount || 0);
    const failedCount = Number(summary.value?.failedCount || 0);
    return [
        {
            key: 'total',
            label: t('transaction.order.queryResult'),
            tone: 'total',
            countText: countText(totalCount),
            amounts: amountPills(summary.value?.amountSummaries || []),
        },
        {
            key: 'success',
            label: t('transaction.order.successTransactions'),
            tone: 'success',
            countText: countText(successCount),
            rateText: ratioText(successCount, totalCount),
            rateTone: rateTone(successCount, totalCount),
            amounts: amountPills(summary.value?.successAmountSummaries || []),
        },
        {
            key: 'failed',
            label: t('transaction.order.failedTransactions'),
            tone: 'danger',
            countText: countText(failedCount),
            rateText: ratioText(failedCount, totalCount),
            rateTone: rateTone(failedCount, totalCount, true),
            amounts: amountPills(summary.value?.failedAmountSummaries || []),
        },
    ];
});
const paymentSummaryItems = computed(() => (summary.value?.paymentMethodSummaries || []).slice(0, 3).map((item: TransactionPaymentMethodSummary) => {
    const label = paymentSummaryLabel(item);
    return {
        key: `${item.paymentMethod || '-'}-${item.paymentBrand || '-'}`,
        label,
        logoKeys: paymentLogos(item),
        countText: countText(item.count || 0),
        title: `${label} ${countText(item.count || 0)}`,
        primaryAmount: amountPills(item.amountSummaries || [])[0],
    };
}));
const refundMaxAmount = computed(() => Math.max(Number(activeRefundRow.value?.availableRefundAmount || 0), 0.01));
const selectedPaymentBrandLogoKeys = computed(() => cardBrandOptionLogoKeys(cardBrandOptions.value.find((item) => item.value === query.paymentBrand)));

onMounted(async () => {
    await loadDictionaries();
    await loadData();
});

async function loadDictionaries() {
    transactionTypeOptions.value = fallbackTransactionTypeOptions(t);
    transactionStatusOptions.value = fallbackTransactionStatusOptions(t);
    paymentMethodOptions.value = fallbackPaymentMethodOptions(t);
    cardBrandOptions.value = fallbackCardBrandOptions();
    channelMatchStatusOptions.value = fallbackStatusOptions(t, 'channelMatch');
    reconciliationStatusOptions.value = fallbackStatusOptions(t, 'reconciliation');
    settlementStatusOptions.value = fallbackStatusOptions(t, 'settlement');
    timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    try {
        const [types, statuses, methods, brands, channelMatches, reconciliations, settlements, timezones] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('payment_method', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('card_brand', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('reconciliation_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('settlement_status', String(locale.value || 'zh-CN')).catch(() => []),
            loadTransactionDictOptions('sys_timezone', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        transactionTypeOptions.value = types.length ? types : transactionTypeOptions.value;
        transactionStatusOptions.value = statuses.length ? statuses : transactionStatusOptions.value;
        paymentMethodOptions.value = methods.length ? methods : paymentMethodOptions.value;
        cardBrandOptions.value = brands.length ? brands : cardBrandOptions.value;
        channelMatchStatusOptions.value = channelMatches.length ? channelMatches : channelMatchStatusOptions.value;
        reconciliationStatusOptions.value = reconciliations.length ? reconciliations : reconciliationStatusOptions.value;
        settlementStatusOptions.value = settlements.length ? settlements : settlementStatusOptions.value;
        timezoneOptions.value = ensureTransactionTimezoneOptions(timezones);
    } catch (error) {
        console.warn('[merchant-portal] Failed to load transaction dictionaries, fallback options are used.', error);
    }
}

async function loadData() {
    loading.value = true;
    try {
        const payload = buildQueryPayload();
        const operationSearch = await transactionApi.searchOperations(payload);
        rows.value = operationSearch.page?.records || [];
        total.value = operationSearch.page?.total || 0;
        summary.value = operationSearch.summary;
    } catch (error: any) {
        rows.value = [];
        total.value = 0;
        summary.value = undefined;
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.order.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function applyQuery() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    Object.keys(query).forEach((key) => delete (query as Record<string, unknown>)[key]);
    const defaultTimeZone = merchantDefaultTimeZone();
    query.queryTimeZone = defaultTimeZone;
    quickPreset.value = 'today';
    dateRange.value = defaultTransactionTodayRange(defaultTimeZone);
    applyQuery();
}

async function handleExport() {
    exporting.value = true;
    try {
        await transactionApi.exportOrders(buildQueryPayload());
        ElMessage.success(t('transaction.order.exportStarted'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.order.exportFailed'));
    } finally {
        exporting.value = false;
    }
}

async function openDetail(row: TransactionOperation) {
    const transactionId = row.transactionId;
    if (!transactionId) return;
    detailVisible.value = true;
    detailLoading.value = true;
    try {
        detail.value = await transactionApi.detail(transactionId);
    } catch (error: any) {
        detail.value = undefined;
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.order.detailFailed'));
    } finally {
        detailLoading.value = false;
    }
}

function openRefund(row: TransactionOperation) {
    activeRefundRow.value = row;
    refundForm.amount = Number(row.availableRefundAmount || 0);
    refundForm.currency = defaultCurrency(row);
    refundForm.reason = '';
    refundVisible.value = true;
}

async function submitRefund() {
    if (!activeRefundRow.value) return;
    await refundFormRef.value?.validate();
    const transactionId = activeRefundRow.value.transactionId;
    if (!transactionId) return;
    refundSaving.value = true;
    try {
        await transactionApi.refund(transactionId, { ...refundForm });
        ElMessage.success(t('transaction.order.refundSuccess'));
        refundVisible.value = false;
        await loadData();
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('transaction.order.refundFailed'));
    } finally {
        refundSaving.value = false;
    }
}

function buildQueryPayload() {
    const payload: TransactionPageQuery = {
        ...query,
        pageNo: page.value,
        pageSize: pageSize.value,
        queryTimeZone: query.queryTimeZone || merchantDefaultTimeZone(),
        ...splitDateRange(dateRange.value),
    };
    return payload;
}

function merchantDefaultTimeZone() {
    return auth.session?.account?.timezone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE;
}

function defaultCurrency(row?: TransactionOrder | TransactionOperation | null) {
    return row?.transactionCurrency || row?.labelCurrency || '';
}

function money(value?: number | string | null, currency?: string, currencyExponent?: number | null) {
    return moneyText(value, currency, currencyExponent);
}

function statusTag(status?: string, options: TransactionDictOption[] = []) {
    return statusTagType(status, options);
}

function lifecycleText(row?: TransactionOperation | null) {
    const value = row?.transactionStatus;
    return tagText(transactionStatusOptions.value, value);
}

function canRefundRow(row: TransactionOperation) {
    return row.transactionStatus === 'SUCCESS'
        && ['PAYMENT', 'CAPTURE'].includes(row.transactionType || '')
        && Number(row.availableRefundAmount || 0) > 0;
}

function operationTimestamp(item: TransactionOperation) {
    return formatDateTimeFromSourceTimeZone(item.operationTime || item.transactionDateTime, 'Asia/Shanghai', query.queryTimeZone);
}

function countText(count: number | string) {
    return t('transaction.order.countUnit', { count: Number(count || 0).toLocaleString() });
}

function ratioText(count: number, totalCount: number) {
    const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
    return `${t('transaction.order.ratio')} ${ratio.toFixed(2)}%`;
}

function rateTone(count: number, totalCount: number, reverse = false) {
    const ratio = totalCount > 0 ? (count / totalCount) * 100 : 0;
    if (reverse) {
        if (ratio >= 30) return 'danger';
        if (ratio >= 10) return 'warning';
        return 'success';
    }
    if (ratio >= 80) return 'success';
    if (ratio >= 60) return 'primary';
    if (ratio >= 40) return 'warning';
    return 'danger';
}

function amountPills(amountSummaries: TransactionAmountSummary[]) {
    return amountSummaries.slice(0, 4).map((item) => ({
        key: item.currency || '-',
        currency: item.currency || '-',
        amount: amountOnlyText(item.amount ?? 0, item.currencyExponent),
    }));
}

function amountOnlyText(amount?: number | string | null, currencyExponent?: number | null) {
    const text = moneyText(amount ?? 0, undefined, currencyExponent);
    return text || '0.00';
}

function paymentSummaryLabel(item: TransactionPaymentMethodSummary) {
    const method = tagText(paymentMethodOptions.value, item.paymentMethod);
    const brand = tagText(cardBrandOptions.value, item.paymentBrand);
    return brand && brand !== '-' ? brand : method;
}

function systemOrderNo(row?: TransactionOrder | TransactionOperation | null) {
    if (!row) {
        return '-';
    }
    if (isTransactionOperation(row)) {
        return row.transactionId || '-';
    }
    return row.latestTransactionId || row.rootTransactionId || '-';
}

function isTransactionOperation(row: TransactionOrder | TransactionOperation): row is TransactionOperation {
    return Object.prototype.hasOwnProperty.call(row, 'transactionId');
}

async function copyOrderNo(value?: string) {
    if (!value || value === '-') {
        return;
    }
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(value);
        } else {
            legacyCopyText(value);
        }
        ElMessage.success(t('common.copySuccess'));
    } catch {
        ElMessage.error(t('common.copyFailed'));
    }
}

function legacyCopyText(value: string) {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'readonly');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

function cardBrandOptionLogoKeys(option?: TransactionDictOption) {
    return cardBrandLogoKeys(option?.value, option);
}

function paymentLogos(row?: Pick<TransactionOrder | TransactionOperation | TransactionPaymentMethodSummary, 'paymentMethod' | 'paymentBrand'> | null): PaymentLogoKey[] {
    const paymentOption = paymentMethodOptions.value.find((item) => item.value === row?.paymentMethod);
    const brandOption = cardBrandOptions.value.find((item) => item.value === row?.paymentBrand);
    return transactionPaymentLogoKeys(row?.paymentMethod, row?.paymentBrand, paymentOption, brandOption);
}

function assetPaymentLogos(row?: Pick<TransactionOrder | TransactionOperation | TransactionPaymentMethodSummary, 'paymentMethod' | 'paymentBrand'> | null): PaymentLogoKey[] {
    return paymentLogos(row).filter((key) => Boolean(getPaymentLogos([key])[0]?.asset));
}
</script>

<style scoped>
.merchant-transaction-page {
    --transaction-accent: #1d75d8;
    --transaction-accent-soft: #eaf3ff;
    --transaction-green: #0d9488;
    --transaction-red: #ef4444;
    --transaction-amber: #f59e0b;
    --transaction-control-height: 32px;
    --transaction-border: #dfe7f1;
    --transaction-soft-line: #edf2f7;
    --transaction-table-text: #344054;
    gap: 10px;
}

.transaction-timeline-item span,
.transaction-timeline-item small {
    color: #667085;
    font-size: 12px;
}

.transaction-result-strip {
    padding: 0;
    overflow: hidden;
}

.transaction-result-strip__summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid var(--transaction-border);
    border-radius: 6px;
    background: #ffffff;
    box-shadow: var(--merchant-card-shadow-soft);
    overflow: hidden;
}

.transaction-result-row,
.transaction-timeline-item {
    display: grid;
    min-width: 0;
}

.transaction-result-row {
    grid-template-columns: minmax(128px, 0.25fr) minmax(0, 1fr);
    min-height: 34px;
    border-right: 1px solid var(--transaction-soft-line);
    border-bottom: 1px solid var(--transaction-soft-line);
}

.transaction-result-row:nth-child(2n) {
    border-right: 0;
}

.transaction-result-row:nth-last-child(-n + 2) {
    border-bottom: 0;
}

.transaction-result-row__label {
    display: flex;
    align-items: center;
    min-width: 0;
    border-right: 1px solid #e8eef7;
    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.transaction-result-row__label span {
    display: block;
    width: 100%;
    min-width: 0;
    border-left: 3px solid #2563eb;
    padding: 6px 9px 6px 10px;
    overflow: hidden;
    color: #334155;
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-result-row--success .transaction-result-row__label {
    background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
}

.transaction-result-row--success .transaction-result-row__label span {
    border-left-color: #22c55e;
}

.transaction-result-row--danger .transaction-result-row__label {
    background: linear-gradient(180deg, #fff7ed 0%, #fff1f2 100%);
}

.transaction-result-row--danger .transaction-result-row__label span {
    border-left-color: #f97316;
}

.transaction-result-row--method .transaction-result-row__label {
    background: linear-gradient(180deg, #f0f9ff 0%, #eff6ff 100%);
}

.transaction-result-row--method .transaction-result-row__label span {
    border-left-color: #0ea5e9;
}

.transaction-result-row__content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px 6px;
    min-width: 0;
    padding: 5px 10px;
}

.transaction-result-pill,
.transaction-money-pill,
.transaction-method-pill {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    height: 22px;
    border-radius: 4px;
    white-space: nowrap;
}

.transaction-result-pill {
    border: 1px solid rgba(37, 99, 235, 0.22);
    padding: 0 7px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 12px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.transaction-result-row--success .transaction-result-pill--count {
    border-color: rgba(22, 163, 74, 0.24);
    background: #f0fdf4;
    color: #16a34a;
}

.transaction-result-row--danger .transaction-result-pill--count {
    border-color: rgba(249, 115, 22, 0.28);
    background: #fff7ed;
    color: #ef4444;
}

.transaction-result-pill--rate {
    border-color: rgba(100, 116, 139, 0.2);
    background: rgba(255, 255, 255, 0.72);
    color: #475569;
    font-size: 11px;
}

.transaction-result-pill--rate.is-success {
    border-color: rgba(22, 163, 74, 0.22);
    background: rgba(240, 253, 244, 0.82);
    color: #15803d;
}

.transaction-result-pill--rate.is-danger {
    border-color: rgba(239, 68, 68, 0.22);
    background: rgba(254, 242, 242, 0.82);
    color: #dc2626;
}

.transaction-result-pill--rate.is-warning {
    border-color: rgba(245, 158, 11, 0.28);
    background: rgba(255, 251, 235, 0.86);
    color: #b45309;
}

.transaction-result-pill--rate.is-primary {
    border-color: rgba(37, 99, 235, 0.24);
    background: rgba(239, 246, 255, 0.84);
    color: #2563eb;
}

.transaction-money-pill {
    overflow: hidden;
    border: 1px solid #dbeafe;
    background: #f8fbff;
}

.transaction-money-pill__currency {
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    border-right: 1px solid #dbeafe;
    padding: 0 5px;
    background: #eff6ff;
    color: #2563eb;
    font-size: 10px;
    font-weight: 600;
}

.transaction-money-pill b {
    padding: 0 6px;
    color: #1f2937;
    font-size: 11px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.transaction-method-pill {
    gap: 5px;
    height: 24px;
    border: 1px solid #edf2f7;
    padding: 0 5px;
    background: #ffffff;
}

.transaction-method-pill__logos {
    min-width: 28px;
    max-width: 44px;
}

.transaction-method-pill__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 14px;
}

.transaction-method-pill__text,
.transaction-method-pill__count,
.transaction-result-muted {
    color: #64748b;
    font-size: 11px;
}

.transaction-method-pill__text {
    color: #334155;
    font-weight: 600;
}

.transaction-method-pill__count {
    color: #1f2937;
}

.transaction-money-pill--method {
    height: 20px;
}

.transaction-filter-card {
    padding: 12px 16px;
}

.transaction-search-form {
    display: grid;
    width: 100%;
}

.transaction-search-form__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: end;
    gap: 10px 18px;
    width: 100%;
}

.transaction-search-form__fields :deep(.el-form-item),
.transaction-time-form-item {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    flex: 0 1 320px;
    align-items: center;
    gap: 8px;
    margin: 0;
    min-width: 0;
}

.transaction-time-form-item {
    flex: 1 1 688px;
}

.transaction-search-form :deep(.el-form-item__label) {
    justify-content: flex-end;
    width: 92px;
    padding-right: 0;
}

.transaction-search-form :deep(.el-form-item__content) {
    width: 100%;
    min-width: 0;
    margin-left: 0 !important;
}

.transaction-search-form :deep(.el-input),
.transaction-search-form :deep(.el-select) {
    width: var(--merchant-search-control-width);
    max-width: 100%;
}

.transaction-time-form-item :deep(.transaction-time-range-filter__timezone),
.transaction-time-form-item :deep(.transaction-time-range-filter__picker),
.transaction-time-form-item :deep(.el-date-editor) {
    width: 100%;
}

.transaction-brand-select__prefix :deep(.payment-logo-group),
.transaction-brand-option__logo :deep(.payment-logo-group),
.transaction-payment-cell__logos :deep(.payment-logo-group),
.transaction-detail-payment :deep(.payment-logo-group) {
    gap: 4px;
}

.transaction-brand-select__prefix :deep(.payment-logo-mark),
.transaction-brand-option__logo :deep(.payment-logo-mark),
.transaction-payment-cell__logos :deep(.payment-logo-mark) {
    --payment-logo-height: 16px;
}

.transaction-brand-option {
    display: grid;
    grid-template-columns: 66px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 100%;
    min-width: 0;
}

.transaction-brand-option span {
    min-width: 0;
    overflow: hidden;
    color: #1f2937;
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-brand-option small {
    color: #94a3b8;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 11px;
}

.transaction-time-form-item :deep(.el-form-item__content) {
    width: 100%;
}

.transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
    display: block;
    flex: 1 1 160px;
    align-self: end;
    margin-left: auto;
    min-width: 160px;
    width: auto;
}

.transaction-search-actions :deep(.el-form-item__content) {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    justify-content: flex-end;
    align-items: center;
    width: 100%;
    margin-left: 0 !important;
}

.transaction-table-card {
    overflow: hidden;
}

.transaction-table-head {
    display: flex;
}

.transaction-table-toolbar {
    flex: 0 0 auto;
}

.transaction-table-card :deep(.el-table td.el-table__cell) {
    color: var(--transaction-table-text);
    font-size: 12px;
    font-weight: 400;
}

.transaction-timeline-item strong {
    color: var(--merchant-ink);
    font-weight: 500;
}

.transaction-money-text,
.transaction-rate-text,
.transaction-card-bin,
.transaction-auth-code {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
    white-space: nowrap;
}

.transaction-copy-link {
    display: inline-block;
    max-width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    color: #2563eb;
    cursor: pointer;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    font-weight: 400;
    line-height: 18px;
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-copy-link:hover {
    color: #1d4ed8;
    text-decoration: underline;
}

.transaction-copy-link:disabled {
    color: #94a3b8;
    cursor: default;
    text-decoration: none;
}

.transaction-money-text {
    color: #0f766e;
    font-weight: 400;
}

.transaction-money-text--label {
    color: #475569;
}

.transaction-rate-text,
.transaction-card-bin,
.transaction-auth-code {
    color: #334155;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    font-weight: 400;
}

.transaction-payment-logo-cell {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 22px;
    min-width: 54px;
}

.transaction-payment-cell__logos {
    min-height: 18px;
}

.transaction-drawer-title {
    margin: 0 0 12px;
    color: var(--merchant-ink);
    font-size: 15px;
    font-weight: 800;
}

.transaction-detail-drawer :deep(.el-drawer__header) {
    padding: 18px 22px 12px;
    margin-bottom: 0;
    border-bottom: 1px solid #edf2f7;
}

.transaction-detail-drawer :deep(.el-drawer__body) {
    padding: 18px 22px 24px;
}

.transaction-detail-shell {
    display: grid;
    gap: 14px;
}

.transaction-detail-summary {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 12px;
}

.transaction-detail-summary__main,
.transaction-detail-summary__amount {
    display: grid;
    gap: 5px;
    padding: 14px 16px;
    border: 1px solid #dde7f0;
    border-radius: 8px;
    background: #f8fbff;
}

.transaction-detail-summary span,
.transaction-detail-grid dt,
.transaction-refund-summary span {
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
}

.transaction-detail-summary strong {
    color: var(--merchant-ink);
    font-size: 20px;
}

.transaction-detail-summary small {
    color: #64748b;
    font-size: 12px;
}

.transaction-detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1px;
    padding: 1px;
    margin: 0;
    border: 1px solid #e5edf5;
    border-radius: 8px;
    background: #e5edf5;
    overflow: hidden;
}

.transaction-detail-grid div {
    display: grid;
    gap: 6px;
    min-width: 0;
    padding: 12px 14px;
    background: #ffffff;
}

.transaction-detail-grid dd {
    min-width: 0;
    margin: 0;
    color: #1f2937;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.45;
    overflow-wrap: anywhere;
}

.transaction-detail-payment {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.transaction-timeline-panel {
    padding: 14px 16px 4px;
    border: 1px solid #e5edf5;
    border-radius: 8px;
    background: #ffffff;
}

.transaction-timeline-panel :deep(.el-timeline) {
    padding-left: 4px;
}

.transaction-timeline-panel :deep(.el-timeline-item__timestamp) {
    color: #94a3b8;
    font-size: 12px;
}

.transaction-refund-dialog :deep(.el-dialog) {
    border-radius: 8px;
}

.transaction-refund-dialog :deep(.el-dialog__header) {
    padding: 20px 24px 12px;
    margin-right: 0;
    border-bottom: 1px solid #edf2f7;
}

.transaction-refund-dialog :deep(.el-dialog__title) {
    color: var(--merchant-ink);
    font-size: 18px;
    font-weight: 800;
}

.transaction-refund-dialog :deep(.el-dialog__body) {
    padding: 18px 24px 8px;
}

.transaction-refund-summary {
    display: grid;
    grid-template-columns: 1.35fr 0.8fr;
    gap: 12px;
    margin-bottom: 12px;
}

.transaction-refund-summary div {
    display: grid;
    gap: 5px;
    min-width: 0;
    padding: 12px 14px;
    border: 1px solid #dde7f0;
    border-radius: 8px;
    background: #f8fafc;
}

.transaction-refund-summary strong {
    color: #1f2937;
    font-size: 15px;
    overflow-wrap: anywhere;
}

.transaction-refund-alert {
    margin-bottom: 14px;
    border-radius: 8px;
}

.transaction-refund-alert :deep(.el-alert__title) {
    font-size: 13px;
    line-height: 1.5;
}

.transaction-refund-form {
    display: grid;
    grid-template-columns: 1fr 0.55fr;
    gap: 12px 14px;
}

.transaction-refund-form :deep(.el-form-item) {
    margin-bottom: 0;
}

.transaction-refund-form :deep(.el-form-item__label) {
    padding-bottom: 5px;
    color: #344054;
    font-size: 12px;
    font-weight: 700;
    line-height: 16px;
}

.transaction-refund-form :deep(.el-input-number),
.transaction-refund-form :deep(.el-input),
.transaction-refund-form :deep(.el-textarea) {
    width: 100%;
}

.transaction-refund-form :deep(.el-input__wrapper),
.transaction-refund-form :deep(.el-textarea__inner) {
    border-radius: 6px;
}

.transaction-refund-form__reason {
    grid-column: 1 / -1;
}

@media (min-width: 1680px) {
    .transaction-search-form__fields {
        gap: 10px 18px;
    }
}

@media (max-width: 1180px) {
    .transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
        flex-basis: 100%;
    }

    .transaction-time-form-item {
        flex-basis: 100%;
        min-width: 0;
    }
}

@media (max-width: 760px) {
    .merchant-transaction-page {
        gap: 12px;
    }

    .transaction-detail-summary,
    .transaction-detail-grid,
    .transaction-refund-summary,
    .transaction-refund-form {
        grid-template-columns: 1fr;
    }

    .transaction-search-form {
        padding-bottom: 0;
    }

    .transaction-result-strip__summary,
    .transaction-result-row {
        grid-template-columns: 1fr;
    }

    .transaction-result-row,
    .transaction-result-row:nth-child(2n) {
        border-right: 0;
    }

    .transaction-result-row:nth-last-child(-n + 2) {
        border-bottom: 1px solid var(--transaction-soft-line);
    }

    .transaction-result-row:last-child {
        border-bottom: 0;
    }

    .transaction-result-row__label {
        border-right: 0;
    }

    .transaction-search-form__fields :deep(.el-form-item),
    .transaction-time-form-item {
        display: grid;
        grid-template-columns: 1fr;
        flex-basis: 100%;
        gap: 6px;
        width: 100%;
    }

    .transaction-search-form :deep(.el-form-item__label) {
        justify-content: flex-start;
        width: 100%;
        min-height: auto;
        padding: 0;
        line-height: 18px;
        text-align: left;
    }

    .transaction-search-form :deep(.el-form-item__content) {
        width: 100%;
        margin-left: 0 !important;
    }

    .transaction-search-actions :deep(.el-form-item__content) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        justify-content: stretch;
    }

    .transaction-search-form__fields :deep(.el-form-item.transaction-search-actions) {
        flex-basis: 100%;
        min-width: 0;
    }

    .transaction-search-actions :deep(.el-button) {
        width: 100%;
    }

    .pagination-container {
        justify-content: flex-start;
        overflow-x: auto;
    }
}
</style>
