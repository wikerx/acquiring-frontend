<template>
    <CommonDetailDrawer v-model:visible="drawerVisible" :title="title" size="full" :loading="loading">
        <div v-if="detail" class="transaction-detail">
            <section class="transaction-detail__hero" :class="`is-${summaryTone}`">
                <div class="transaction-detail__hero-main">
                    <span class="transaction-detail__status-dot">
                        <el-icon><component :is="summaryIcon" /></el-icon>
                    </span>
                    <div class="transaction-detail__amount">
                        <strong>{{ summaryAmountText }}</strong>
                        <span>{{ summaryCurrency }}</span>
                    </div>
                </div>
                <div class="transaction-detail__hero-channel">
                    <div class="transaction-detail__hero-channel-inner">
                        <span class="transaction-detail__channel-text">
                            <strong>{{ summaryChannelCode }}</strong>
                            <span v-if="summaryChannelFullName">（{{ summaryChannelFullName }}）</span>
                        </span>
                        <PaymentLogoGroup v-if="summaryPaymentLogos.length" :keys="summaryPaymentLogos" size="sm" align="center" />
                        <span v-else>{{ summaryPaymentText }}</span>
                    </div>
                </div>
                <div class="transaction-detail__hero-meta">
                    <strong>{{ summaryResultText }}</strong>
                </div>
            </section>

            <section class="transaction-detail__identity-grid">
                <div>
                    <span>{{ t('transaction.fields.transactionId') }}</span>
                    <CopyableText :value="summaryTransactionId" :label="t('transaction.fields.transactionId')" wrap />
                </div>
                <div>
                    <span>{{ t('transaction.fields.merchantId') }}</span>
                    <CopyableText :value="summaryMerchantId" :label="t('transaction.fields.merchantId')" wrap />
                </div>
                <div>
                    <span>{{ t('transaction.fields.merchantOrderNo') }}</span>
                    <CopyableText :value="summaryMerchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap />
                </div>
                <div>
                    <span>{{ t('transaction.fields.channelOrderNo') }}</span>
                    <CopyableText :value="summaryChannelOrderNo" :label="t('transaction.fields.channelOrderNo')" wrap />
                </div>
            </section>

            <el-tabs v-model="activeTab" class="transaction-detail__tabs">
                <el-tab-pane :label="t('transaction.detail.baseInfo')" name="base">
                    <el-descriptions :column="2" border size="small">
                        <el-descriptions-item :label="t('transaction.fields.merchantOrderNo')"><CopyableText :value="detail.order?.merchantOrderNo" :label="t('transaction.fields.merchantOrderNo')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.merchantOrderId')"><CopyableText :value="detail.order?.merchantOrderId" :label="t('transaction.fields.merchantOrderId')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionType')">
                            {{ optionText(typeOptions, detail.order?.transactionType) }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionStatus')">
                            <el-tag size="small" :type="statusTagType(detail.order?.transactionStatus, statusOptions)">{{ optionText(statusOptions, detail.order?.transactionStatus) }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.paymentMethodCardBrand')">
                            <PaymentLogoGroup v-if="paymentLogos(detail.order).length" :keys="paymentLogos(detail.order)" size="sm" align="start" class="transaction-detail__inline-logos" />
                            <span v-else>{{ paymentText(detail.order?.paymentMethod, detail.order?.paymentBrand) }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelCode')">{{ detail.order?.channelCode || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.channelOrderNo')"><CopyableText :value="detail.order?.channelOrderNo" :label="t('transaction.fields.channelOrderNo')" wrap /></el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionDateTime')">
                            <BaseDateTime :value="detail.order?.transactionDateTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" />
                            <span class="transaction-detail__timezone">{{ displayTimeZone }}</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.currentAmount')">{{ moneyText(detail.order?.currentAmount ?? detail.order?.transactionAmount, detail.order?.currentCurrency || detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.labelAmount')">{{ moneyText(detail.order?.labelAmount, detail.order?.labelCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionAmount')">{{ moneyText(detail.order?.transactionAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.transactionRate')">{{ rateText(detail.order?.transactionRate) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.authorizedAmount')">{{ moneyText(detail.order?.authorizedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.capturedAmount')">{{ moneyText(detail.order?.capturedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.refundedAmount')">{{ moneyText(detail.order?.refundedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.availableRefundAmount')">{{ moneyText(detail.order?.availableRefundAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.operations')" name="operations">
                    <StandardTable table-key="transaction-detail-operations" :data="detail.operations || []" row-key="transactionId" size="small">
                        <el-table-column :label="t('transaction.fields.transactionId')" min-width="230" align="center" :show-overflow-tooltip="true">
                            <template #default="{ row }"><CopyableText :value="row.transactionId" :label="t('transaction.fields.transactionId')" wrap /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionType')" width="150" align="center">
                            <template #default="{ row }">{{ optionText(typeOptions, row.transactionType) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionStatus')" width="120" align="center">
                            <template #default="{ row }"><el-tag size="small" :type="statusTagType(row.transactionStatus, statusOptions)">{{ optionText(statusOptions, row.transactionStatus) }}</el-tag></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.amount')" width="140" align="center">
                            <template #default="{ row }">{{ moneyText(row.transactionAmount, row.transactionCurrency, row.currencyExponent) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.transactionRate')" width="128" align="center">
                            <template #default="{ row }">{{ rateText(row.transactionRate) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.paymentMethodCardBrand')" width="140" align="center">
                            <template #default="{ row }">
                                <PaymentLogoGroup v-if="paymentLogos(row).length" :keys="paymentLogos(row)" size="sm" align="center" class="transaction-detail__logo-cell" />
                                <span v-else>-</span>
                            </template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.cardBin')" width="132" align="center">
                            <template #default="{ row }">{{ cardDisplayText(row.cardNumberMasked, row.cardBin) }}</template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.channelTransactionId')" min-width="210" align="center" :show-overflow-tooltip="true">
                            <template #default="{ row }"><CopyableText :value="row.channelTransactionId" :label="t('transaction.fields.channelTransactionId')" wrap /></template>
                        </el-table-column>
                        <el-table-column :label="t('transaction.fields.operationTime')" min-width="168" align="center">
                            <template #default="{ row }"><BaseDateTime :value="row.operationTime" source-time-zone="Asia/Shanghai" :display-time-zone="displayTimeZone" /></template>
                        </el-table-column>
                    </StandardTable>
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.amountChanges')" name="amountChanges">
                    <el-timeline v-if="amountChangeRows.length">
                        <el-timeline-item
                            v-for="item in amountChangeRows"
                            :key="String(item.amountChangeId || item.id || item.changeTime)"
                            :timestamp="displayRecordTime(item.changeTime || item.createTime)"
                            placement="top"
                        >
                            <div class="transaction-detail__timeline-title">{{ optionText(typeOptions, String(item.changeType || '')) }}</div>
                            <div class="transaction-detail__amount-grid">
                                <div>
                                    <span>{{ t('transaction.fields.amount') }}</span>
                                    <strong>{{ moneyText(amountValue(item.changeAmount), String(item.amountCurrency || detail.order?.transactionCurrency || ''), detail.order?.currencyExponent) }}</strong>
                                </div>
                                <div>
                                    <span>{{ t('transaction.fields.authorizedAmount') }}</span>
                                    <strong>{{ amountRangeText(item, 'authorizedBefore', 'authorizedAfter') }}</strong>
                                </div>
                                <div>
                                    <span>{{ t('transaction.fields.availableCaptureAmount') }}</span>
                                    <strong>{{ amountRangeText(item, 'availableCaptureBefore', 'availableCaptureAfter') }}</strong>
                                </div>
                                <div>
                                    <span>{{ t('transaction.fields.availableRefundAmount') }}</span>
                                    <strong>{{ amountRangeText(item, 'availableRefundBefore', 'availableRefundAfter') }}</strong>
                                </div>
                            </div>
                            <div class="transaction-detail__timeline-text">{{ item.changeReason || '-' }}</div>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-if="!amountChangeRows.length" :description="t('transaction.detail.empty')" />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.timeline')" name="timeline">
                    <el-timeline v-if="timelineRows.length" class="transaction-detail__timeline">
                        <el-timeline-item
                            v-for="item in timelineRows"
                            :key="String(item.riskEventId || item.flowEventId || item.statusHistoryId || item.amountChangeId || item.id || item.eventId || item.createTime)"
                            :timestamp="displayRecordTime(item.statusTime || item.eventTime || item.createTime)"
                            :type="timelineTone(item)"
                            placement="top"
                        >
                            <div class="transaction-detail__timeline-card" :class="`is-${timelineTone(item)}`">
                                <div class="transaction-detail__timeline-heading">
                                    <strong>{{ timelineTitle(item) }}</strong>
                                    <el-tag size="small" :type="timelineTone(item)" effect="plain">{{ timelineStatusText(item) }}</el-tag>
                                </div>
                                <div class="transaction-detail__timeline-text">{{ timelineContent(item) }}</div>
                            </div>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-if="!timelineRows.length" :description="t('transaction.detail.empty')" />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.channel')" name="channel">
                    <RecordList :rows="channelRecordRows" variant="channel" :display-time-zone="displayTimeZone" />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.callback')" name="callback">
                    <RecordList :rows="[...(detail.channelCallbacks || []), ...(detail.channelCallbackLogs || []), ...(detail.merchantNotifications || []), ...(detail.merchantNotificationLogs || [])]" variant="callback" :display-time-zone="displayTimeZone" />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.merchantApi')" name="merchantApi">
                    <RecordList :rows="detail.merchantApiInteractionLogs || []" variant="merchantApi" :display-time-zone="displayTimeZone" />
                </el-tab-pane>
            </el-tabs>
        </div>
        <el-empty v-else :description="t('transaction.detail.empty')" />
    </CommonDetailDrawer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { CircleCheckFilled, CircleCloseFilled, Loading, VideoPause } from '@element-plus/icons-vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import type { TransactionDetail, TransactionOperation, TransactionOrder } from '@/api/transaction';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, cardDisplayText, fallbackTransactionStatusOptions, fallbackTransactionTypeOptions, loadTransactionDictOptions, moneyText, optionText, rateText, statusTagType, transactionPaymentLogoKeys, type TransactionDictOption } from '../shared';
import CopyableText from './CopyableText.vue';
import RecordList from './TransactionRecordList.vue';

const props = defineProps<{
    visible: boolean;
    title: string;
    detail: TransactionDetail | null;
    focusTransactionId?: string;
    displayTimeZone?: string;
    loading?: boolean;
}>();

const emit = defineEmits<{
    'update:visible': [value: boolean];
}>();

const { t, locale } = useI18n();
const activeTab = ref('base');
const typeOptions = ref<TransactionDictOption[]>([]);
const statusOptions = ref<TransactionDictOption[]>([]);

const displayTimeZone = computed(() => props.displayTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const timelineRows = computed(() => {
    const flowEvents = (props.detail?.flowEvents || []) as Record<string, unknown>[];
    const statusHistory = (props.detail?.statusHistory || []) as Record<string, unknown>[];
    const merchantApiLogs = (props.detail?.merchantApiInteractionLogs || []) as Record<string, unknown>[];
    const merchantResponses = merchantResponseMap(merchantApiLogs);
    const resultEvents = flowEvents.map((row) => enrichTransactionResultEvent(row, merchantResponses));
    const representedInitialStatuses = new Set(
        resultEvents
            .filter(isTransactionResultEvent)
            .map(timelineResultKey)
            .filter(Boolean),
    );
    const visibleStatusHistory = statusHistory.filter(
        (row) => !isRepresentedInitialStatus(row, representedInitialStatuses),
    );
    return [
        ...resultEvents,
        ...((props.detail?.riskEvents || []) as Record<string, unknown>[]),
        ...visibleStatusHistory,
        ...((props.detail?.amountChanges || []) as Record<string, unknown>[]),
    ].sort(compareTimelineRows);
});

const amountChangeRows = computed(() => (props.detail?.amountChanges || []) as Record<string, unknown>[]);

const channelRecordRows = computed(() => mergeChannelRecords(
    (props.detail?.channelRequests || []) as Record<string, unknown>[],
    (props.detail?.channelInteractionLogs || []) as Record<string, unknown>[],
));

const focusedOperation = computed(() => {
    const operations = props.detail?.operations || [];
    if (props.focusTransactionId) {
        return operations.find((item) => item.transactionId === props.focusTransactionId);
    }
    return undefined;
});

const summaryRecord = computed(() => focusedOperation.value || props.detail?.order);

const summaryType = computed(() => focusedOperation.value?.transactionType || props.detail?.order?.transactionType || '');

const summaryStatus = computed(() => focusedOperation.value?.transactionStatus || props.detail?.order?.lifecycleStatus || props.detail?.order?.transactionStatus || '');

const summaryCurrency = computed(() => focusedOperation.value?.transactionCurrency
    || props.detail?.order?.currentCurrency
    || props.detail?.order?.transactionCurrency
    || '-');

const summaryAmountText = computed(() => {
    const amount = focusedOperation.value
        ? focusedOperation.value.transactionAmount
        : props.detail?.order?.currentAmount ?? props.detail?.order?.transactionAmount;
    return moneyText(amount, undefined, focusedOperation.value?.currencyExponent ?? props.detail?.order?.currencyExponent);
});

const summaryTypeText = computed(() => optionText(typeOptions.value, summaryType.value));

const summaryStatusText = computed(() => {
    if (!focusedOperation.value && props.detail?.order?.lifecycleStatus) {
        return t(`transaction.lifecycleStatus.${props.detail.order.lifecycleStatus}`, optionText(statusOptions.value, props.detail.order.transactionStatus));
    }
    return optionText(statusOptions.value, summaryStatus.value);
});

const summaryResultText = computed(() => {
    const type = summaryTypeText.value === '-' ? '' : summaryTypeText.value;
    const status = summaryStatusText.value === '-' ? '' : summaryStatusText.value;
    if (!type && !status) {
        return '-';
    }
    if (!type || !status) {
        return type || status;
    }
    return String(locale.value || '').startsWith('zh') ? `${type}${status}` : `${type} ${status}`;
});

const summaryTransactionId = computed(() => focusedOperation.value?.transactionId || props.detail?.order?.rootTransactionId || '-');

const summaryMerchantId = computed(() => focusedOperation.value?.merchantId || props.detail?.order?.merchantId || '-');

const summaryMerchantOrderNo = computed(() => focusedOperation.value?.merchantOrderNo || props.detail?.order?.merchantOrderNo || '-');

const summaryChannelOrderNo = computed(() => focusedOperation.value?.channelOrderNo || props.detail?.order?.channelOrderNo || '-');

const summaryChannelCode = computed(() => {
    const record = summaryRecord.value;
    const channelCode = String(record?.channelCode || '');
    const channelName = String(record?.channelName || '');
    return channelCode || channelName || '-';
});

const summaryChannelFullName = computed(() => {
    const record = summaryRecord.value;
    const channelCode = String(record?.channelCode || '');
    const channelName = String(record?.channelName || '');
    if (channelCode && channelName && channelCode !== channelName) {
        return channelName;
    }
    return '';
});

const summaryPaymentLogos = computed(() => paymentLogos(summaryRecord.value));

const summaryPaymentText = computed(() => paymentText(summaryRecord.value?.paymentMethod, summaryRecord.value?.paymentBrand));

const summaryTone = computed(() => {
    if (summaryStatus.value === 'SUCCESS' || ['CAPTURED', 'PARTIALLY_CAPTURED', 'PARTIALLY_REFUNDED'].includes(summaryStatus.value)) {
        return 'success';
    }
    if (summaryStatus.value === 'FAILED') {
        return 'failed';
    }
    if (summaryStatus.value === 'PENDING' || ['VOIDED', 'FULLY_REFUNDED'].includes(summaryStatus.value)) {
        return 'pending';
    }
    return 'processing';
});

const summaryIcon = computed(() => {
    if (summaryTone.value === 'success') {
        return CircleCheckFilled;
    }
    if (summaryTone.value === 'failed') {
        return CircleCloseFilled;
    }
    if (summaryTone.value === 'pending') {
        return VideoPause;
    }
    return Loading;
});

onMounted(loadDictionaries);

async function loadDictionaries() {
    typeOptions.value = fallbackTransactionTypeOptions(t);
    statusOptions.value = fallbackTransactionStatusOptions(t);
    try {
        const [types, statuses] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
        ]);
        typeOptions.value = types.length ? types : typeOptions.value;
        statusOptions.value = statuses.length ? statuses : statusOptions.value;
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction dictionaries, fallback options are used.', error);
    }
}

function paymentText(paymentMethod?: string, paymentBrand?: string) {
    if (!paymentMethod && !paymentBrand) {
        return '-';
    }
    return [paymentMethod, paymentBrand].filter(Boolean).join(' / ');
}

function paymentLogos(row?: Pick<TransactionOrder | TransactionOperation, 'paymentMethod' | 'paymentBrand'>): PaymentLogoKey[] {
    return transactionPaymentLogoKeys(row?.paymentMethod, row?.paymentBrand);
}

function amountValue(value: unknown) {
    return value as number | string | null | undefined;
}

function amountRangeText(row: Record<string, unknown>, beforeKey: string, afterKey: string) {
    const currency = String(row.amountCurrency || props.detail?.order?.transactionCurrency || '');
    const exponent = props.detail?.order?.currencyExponent;
    return `${moneyText(amountValue(row[beforeKey]), currency, exponent)} -> ${moneyText(amountValue(row[afterKey]), currency, exponent)}`;
}

function displayRecordTime(value: unknown) {
    return formatDateTimeFromSourceTimeZone(value as string | number | Date | null | undefined, DEFAULT_TRANSACTION_QUERY_TIME_ZONE, displayTimeZone.value);
}

function mergeChannelRecords(channelRequests: Record<string, unknown>[], channelInteractionLogs: Record<string, unknown>[]) {
    const rows: Record<string, unknown>[] = [];
    const usedInteractionKeys = new Set<string>();
    const interactionMap = new Map<string, Record<string, unknown>[]>();
    channelInteractionLogs.forEach((log, index) => {
        const key = channelRecordKey(log, `interaction-${index}`);
        const bucket = interactionMap.get(key) || [];
        bucket.push(log);
        interactionMap.set(key, bucket);
    });

    channelRequests.forEach((request, index) => {
        const key = channelRecordKey(request, `request-${index}`);
        const matchedLogs = interactionMap.get(key) || [];
        if (!matchedLogs.length) {
            rows.push({
                ...request,
                channelRecordId: request.requestId || key,
                channelRecordSource: 'request',
            });
            return;
        }
        matchedLogs.forEach((_log, logIndex) => {
            usedInteractionKeys.add(`${key}:${logIndex}`);
        });
        const mergedLog = mergeChannelInteractionGroup(matchedLogs);
        rows.push({
            ...request,
            ...mergedLog,
            channelRecordId: request.requestId || mergedLog.requestId || mergedLog.interactionLogId || key,
            requestSummaryId: request.requestId,
            requestScene: request.requestScene,
            requestStatus: request.requestStatus,
            requestAmount: request.requestAmount,
            requestCurrency: request.requestCurrency,
            gatewayResult: request.gatewayResult,
            gatewayCode: request.gatewayCode,
            acquirerCode: request.acquirerCode,
            acquirerMessage: request.acquirerMessage,
            platformResultCode: firstPresent(mergedLog.platformResultCode, request.platformResultCode),
            platformFailReason: firstPresent(mergedLog.platformFailReason, request.platformFailReason),
            requestStartTime: request.requestStartTime || mergedLog.requestStartTime || mergedLog.requestTime,
            responseTime: mergedLog.responseTime || request.responseTime,
            channelRecordSource: 'merged',
        });
    });

    interactionMap.forEach((logs, key) => {
        const unusedLogs = logs.filter((log, logIndex) => !usedInteractionKeys.has(`${key}:${logIndex}`));
        if (unusedLogs.length) {
            const mergedLog = mergeChannelInteractionGroup(unusedLogs);
            rows.push({
                ...mergedLog,
                channelRecordId: mergedLog.requestId || mergedLog.interactionLogId || key,
                channelRecordSource: 'interaction',
            });
        }
    });
    return rows;
}

function mergeChannelInteractionGroup(logs: Record<string, unknown>[]): Record<string, unknown> {
    const merged = logs.reduce<Record<string, unknown>>((result, log) => {
        Object.entries(log).forEach(([field, value]) => {
            if (isPresent(value) && !isPresent(result[field])) {
                result[field] = value;
            }
        });
        return result;
    }, {});
    const requestLog = logs.find((log) => log.interactionType === 'REQUEST' || isPresent(log.requestBodyJsonMasked)) || logs[0];
    const responseLog = logs.find((log) => log.interactionType === 'RESPONSE' || log.interactionType === 'EXCEPTION' || isPresent(log.responseBodyJsonMasked) || isPresent(log.exceptionType))
        || logs.find((log) => log !== requestLog)
        || requestLog;

    return {
        ...merged,
        interactionLogId: firstPresent(merged.interactionLogId, requestLog?.interactionLogId, responseLog?.interactionLogId),
        requestInteractionLogId: firstPresent(merged.requestInteractionLogId, requestLog?.interactionLogId),
        responseInteractionLogId: firstPresent(merged.responseInteractionLogId, responseLog?.interactionLogId),
        requestHeaderJsonMasked: firstPresent(requestLog?.requestHeaderJsonMasked, merged.requestHeaderJsonMasked),
        requestBodyJsonMasked: firstPresent(requestLog?.requestBodyJsonMasked, merged.requestBodyJsonMasked),
        responseHeaderJsonMasked: firstPresent(responseLog?.responseHeaderJsonMasked, merged.responseHeaderJsonMasked),
        responseBodyJsonMasked: firstPresent(responseLog?.responseBodyJsonMasked, merged.responseBodyJsonMasked),
        exceptionType: firstPresent(responseLog?.exceptionType, merged.exceptionType),
        exceptionMessage: firstPresent(responseLog?.exceptionMessage, merged.exceptionMessage),
        requestTime: firstPresent(merged.requestTime, requestLog?.requestTime, requestLog?.interactionTime),
        responseTime: firstPresent(merged.responseTime, responseLog?.responseTime, responseLog?.interactionTime),
    };
}

function channelRecordKey(row: Record<string, unknown>, fallback: string) {
    return String(row.requestId || row.requestSummaryId || row.interactionLogId || fallback);
}

function firstPresent(...values: unknown[]) {
    return values.find(isPresent);
}

function isPresent(value: unknown) {
    return value !== undefined && value !== null && value !== '';
}

interface MerchantResponseSummary {
    code: string;
    message: string;
}

function merchantResponseMap(rows: Record<string, unknown>[]) {
    const responses = new Map<string, MerchantResponseSummary>();
    rows.forEach((row) => {
        const transactionId = String(row.transactionId || '');
        const code = String(row.merchantResponseCode || '');
        const message = String(row.merchantResponseMessage || '');
        if (transactionId && (code || message)) {
            responses.set(transactionId, { code, message });
        }
    });
    return responses;
}

function enrichTransactionResultEvent(
    row: Record<string, unknown>,
    merchantResponses: Map<string, MerchantResponseSummary>,
) {
    if (!isTransactionResultEvent(row)) {
        return row;
    }
    const transactionId = String(row.transactionId || '');
    const response = merchantResponses.get(transactionId);
    if (!response) {
        return row;
    }
    const eventContent = [response.code, response.message].filter(Boolean).join('：');
    const failed = isFailureStatus(row.currentStatus || row.eventStatus);
    return {
        ...row,
        eventContent: eventContent || row.eventContent,
        errorCode: failed ? response.code : row.errorCode,
        errorMessage: failed ? response.message : row.errorMessage,
        merchantResponseCode: response.code,
        merchantResponseMessage: response.message,
    };
}

function isTransactionResultEvent(row: Record<string, unknown>) {
    return String(row.eventType || '').toUpperCase() === 'STATUS_RECORDED';
}

function timelineResultKey(row: Record<string, unknown>) {
    const transactionId = String(row.transactionId || '');
    const status = String(row.currentStatus || row.toStatus || row.eventStatus || '').toUpperCase();
    return transactionId && status ? `${transactionId}:${status}` : '';
}

function isRepresentedInitialStatus(row: Record<string, unknown>, representedStatuses: Set<string>) {
    const statusObject = String(row.statusObject || '').toUpperCase();
    const triggerType = String(row.triggerType || '').toUpperCase();
    const versionAfter = Number(row.versionAfter);
    const initialApiStatus = ['ORDER', 'OPERATION'].includes(statusObject)
        && !isPresent(row.fromStatus)
        && triggerType === 'API'
        && !isPresent(row.versionBefore)
        && versionAfter === 0;
    return initialApiStatus && representedStatuses.has(timelineResultKey(row));
}

function timelineTitle(row: Record<string, unknown>) {
    if (isTransactionResultEvent(row)) {
        const status = String(row.currentStatus || row.eventStatus || '').toUpperCase();
        return t(`transaction.timelineResult.${status}`, t('transaction.timelineResult.PROCESSING'));
    }
    if (row.eventName) {
        return String(row.eventName);
    }
    if (row.statusHistoryId || row.statusObject || row.toStatus) {
        const objectText = timelineStatusObjectText(row.statusObject);
        const eventText = t('transaction.timelineEvent.STATUS_CHANGED');
        return String(locale.value || '').startsWith('zh') ? `${objectText}${eventText}` : `${objectText} ${eventText}`;
    }
    const eventType = String(row.eventType || row.changeType || row.processStage || row.transactionStatus || '');
    return eventType ? t(`transaction.timelineEvent.${eventType}`, eventType) : '-';
}

function timelineStatusText(row: Record<string, unknown>) {
    const value = timelineStatus(row);
    return value ? t(`transaction.timelineStatus.${value}`, value) : '-';
}

function timelineContent(row: Record<string, unknown>) {
    if (row.statusHistoryId || row.statusObject || row.toStatus) {
        const objectText = timelineStatusObjectText(row.statusObject);
        const fromStatus = timelineBusinessStatusText(row.fromStatus);
        const toStatus = timelineBusinessStatusText(row.toStatus);
        const transition = fromStatus
            ? `${fromStatus} -> ${toStatus}`
            : toStatus;
        const reason = String(row.failReason || '');
        const content = `${objectText}：${transition || '-'}`;
        return reason ? `${content}；${reason}` : content;
    }
    return String(row.changeReason || row.eventContent || row.eventMessage || row.failReasonMessage || row.errorMessage || '-');
}

function timelineStatusObjectText(value: unknown) {
    const normalized = String(value || 'STATUS').toUpperCase();
    return t(`transaction.timelineStatusObject.${normalized}`, normalized);
}

function timelineBusinessStatusText(value: unknown) {
    const normalized = String(value || '').toUpperCase();
    if (!normalized) {
        return '';
    }
    return t(`transaction.status.${normalized}`, optionText(statusOptions.value, normalized));
}

function timelineStatus(row: Record<string, unknown>) {
    if (row.flowEventId || row.eventType || row.eventStage) {
        const eventType = String(row.eventType || '').toUpperCase();
        const status = String(row.eventStatus || '').toUpperCase();
        const content = String(row.eventContent || '');
        const errorText = String(row.errorCode || row.errorMessage || '');
        const businessStatus = String(row.currentStatus || row.targetStatus || '').toUpperCase();
        if (status === 'SUCCESS' && /SKIP|跳过|略过/i.test(content)) {
            return 'SKIPPED';
        }
        if (isFailureStatus(status)) {
            return status;
        }
        if (eventType === 'CHANNEL_CALLED' && isChannelFailureSignal(content, errorText, businessStatus)) {
            return 'FAILED';
        }
        if (isFailureStatus(errorText)) {
            return 'FAILED';
        }
        return String(row.eventStatus || row.currentStatus || '');
    }
    if (row.statusHistoryId || row.toStatus || row.statusObject) {
        const targetStatus = String(row.toStatus || row.transactionStatus || '').toUpperCase();
        const transitionResult = String(row.transitionResult || '').toUpperCase();
        if (isFailureStatus(targetStatus)) {
            return targetStatus;
        }
        if (['PENDING', 'PROCESSING', 'INIT'].includes(targetStatus)) {
            return targetStatus;
        }
        if (isFailureStatus(transitionResult)) {
            return transitionResult;
        }
        return transitionResult || targetStatus;
    }
    if (row.amountChangeId || row.changeType) {
        return String(row.changeStatus || 'SUCCESS');
    }
    return String(row.eventStatus || row.transitionResult || row.transactionStatus || row.currentStatus || row.targetStatus || '');
}

function timelineTone(row: Record<string, unknown>) {
    const status = timelineStatus(row);
    if (isFailureStatus(status)) {
        return 'danger';
    }
    if (status === 'PENDING' || status === 'PROCESSING' || status === 'INIT' || status === 'SKIPPED' || status === 'IGNORED') {
        return 'warning';
    }
    if (status === 'SUCCESS') {
        return 'success';
    }
    return 'primary';
}

function isFailureStatus(value: unknown) {
    return /FAILED|ERROR|EXCEPTION|DECLINED|INVALID|REJECT(?:ED)?|TIMEOUT/.test(String(value || '').toUpperCase());
}

function isChannelFailureSignal(content: string, errorText: string, businessStatus: string) {
    return isFailureStatus(businessStatus)
        || isFailureStatus(errorText)
        || /渠道交易状态：FAILED|渠道原始状态：ERROR|渠道原始状态：DECLINED|平台交易状态：FAILED|CHANNEL_REQUEST_FAILED/i.test(content);
}

function timelineTimeValue(row: Record<string, unknown>) {
    const value = row.eventTime || row.statusTime || row.changeTime || row.createTime;
    if (!value) {
        return Number.MAX_SAFE_INTEGER;
    }
    const millis = new Date(String(value)).getTime();
    return Number.isFinite(millis) ? millis : Number.MAX_SAFE_INTEGER;
}

function compareTimelineRows(left: Record<string, unknown>, right: Record<string, unknown>) {
    const leftTransactionId = String(left.transactionId || '');
    const rightTransactionId = String(right.transactionId || '');
    if (leftTransactionId && leftTransactionId === rightTransactionId) {
        const leftSequence = timelineSequence(left);
        const rightSequence = timelineSequence(right);
        const sequenceDifference = leftSequence - rightSequence;
        if (sequenceDifference !== 0) {
            return sequenceDifference;
        }
    }
    const timeDifference = timelineTimeValue(left) - timelineTimeValue(right);
    return timeDifference !== 0 ? timeDifference : timelineSequence(left) - timelineSequence(right);
}

function timelineSequence(row: Record<string, unknown>) {
    const configured = Number(row.timelineSequence);
    if (Number.isFinite(configured)) {
        return configured;
    }
    const sequenceByType: Record<string, number> = {
        API_ACCEPTED: 100,
        RISK_CHECKED: 300,
        ROUTE_SELECTED: 400,
        CHANNEL_CALLED: 500,
        STATUS_RECORDED: 600,
    };
    const eventSequence = sequenceByType[String(row.eventType || '')];
    if (eventSequence) {
        return eventSequence;
    }
    if (row.statusHistoryId || row.toStatus || row.statusObject) {
        return 610;
    }
    if (row.amountChangeId || row.changeType) {
        return 620;
    }
    return 9999;
}

</script>

<style scoped>
.transaction-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.transaction-detail__hero {
    display: grid;
    align-items: center;
    grid-template-columns: minmax(220px, 1fr) minmax(220px, 1fr) minmax(140px, auto);
    min-height: 76px;
    gap: 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 16px 18px;
    background: #f7f8fa;
}

.transaction-detail__hero.is-success {
    border-color: rgba(103, 194, 58, 0.22);
}

.transaction-detail__hero.is-failed {
    border-color: rgba(245, 108, 108, 0.24);
}

.transaction-detail__hero.is-pending,
.transaction-detail__hero.is-processing {
    border-color: rgba(37, 99, 235, 0.18);
}

.transaction-detail__hero-main,
.transaction-detail__hero-channel,
.transaction-detail__hero-meta {
    display: flex;
    align-items: center;
    min-width: 0;
}

.transaction-detail__hero-main {
    gap: 12px;
}

.transaction-detail__hero-channel {
    justify-content: center;
    width: 100%;
    min-height: 44px;
    text-align: center;
}

.transaction-detail__hero-channel-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    max-width: 100%;
    gap: 12px;
    min-width: min(320px, 100%);
    padding: 4px 0;
    color: var(--el-text-color-regular);
    text-align: center;
}

.transaction-detail__hero-channel-inner :deep(.payment-logo-group),
.transaction-detail__inline-logos,
.transaction-detail__logo-cell,
.transaction-detail__logo-cell :deep(.payment-logo-group) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
}

.transaction-detail__hero-channel-inner :deep(.payment-logo-mark),
.transaction-detail__inline-logos :deep(.payment-logo-mark),
.transaction-detail__logo-cell :deep(.payment-logo-mark) {
    align-self: center;
}

.transaction-detail__channel-text {
    display: inline-flex;
    align-items: baseline;
    min-width: 0;
    max-width: min(520px, 100%);
    overflow: hidden;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 22px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-detail__hero-channel strong {
    min-width: 0;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 700;
    line-height: 22px;
}

.transaction-detail__hero-channel-inner > span:not(.transaction-detail__channel-text) {
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.transaction-detail__inline-logos {
    display: inline-flex;
    width: 100%;
    justify-content: flex-start;
    vertical-align: middle;
}

.transaction-detail__logo-cell {
    display: inline-flex;
    width: 100%;
    justify-content: center;
}

.transaction-detail__hero-meta {
    justify-content: flex-end;
    gap: 14px;
}

.transaction-detail__hero-meta strong {
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
}

.transaction-detail__hero.is-success .transaction-detail__hero-meta strong {
    color: var(--el-color-success);
}

.transaction-detail__hero.is-failed .transaction-detail__hero-meta strong {
    color: var(--el-color-danger);
}

.transaction-detail__hero.is-pending .transaction-detail__hero-meta strong,
.transaction-detail__hero.is-processing .transaction-detail__hero-meta strong {
    color: var(--app-primary);
}

.transaction-detail__status-dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    color: #fff;
    font-size: 24px;
}

.transaction-detail__hero.is-success .transaction-detail__status-dot {
    color: var(--el-color-success);
}

.transaction-detail__hero.is-failed .transaction-detail__status-dot {
    color: var(--el-color-danger);
}

.transaction-detail__hero.is-pending .transaction-detail__status-dot,
.transaction-detail__hero.is-processing .transaction-detail__status-dot {
    color: var(--app-primary);
}

.transaction-detail__amount {
    display: flex;
    align-items: baseline;
    min-width: 0;
    gap: 10px;
}

.transaction-detail__amount strong {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 26px;
    font-weight: 700;
    line-height: 34px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.transaction-detail__amount span {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0;
}

.transaction-detail__identity-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.transaction-detail__identity-grid > div {
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 12px 14px;
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__identity-grid span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__identity-grid :deep(.copyable-text) {
    justify-content: flex-start;
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 22px;
    text-align: left;
}

.transaction-detail__tabs {
    min-width: 0;
}

.transaction-detail__timezone {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
}

.transaction-detail__timeline-text {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    line-height: 20px;
}

.transaction-detail__timeline-card {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 10px 12px;
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__timeline-card.is-success {
    border-color: rgba(103, 194, 58, 0.28);
    background: rgba(103, 194, 58, 0.06);
}

.transaction-detail__timeline-card.is-danger {
    border-color: rgba(245, 108, 108, 0.28);
    background: rgba(245, 108, 108, 0.06);
}

.transaction-detail__timeline-card.is-primary {
    border-color: rgba(64, 158, 255, 0.28);
    background: rgba(64, 158, 255, 0.06);
}

.transaction-detail__timeline-card.is-warning {
    border-color: rgba(230, 162, 60, 0.32);
    background: rgba(230, 162, 60, 0.08);
}

.transaction-detail__timeline-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.transaction-detail__timeline-heading strong {
    color: var(--el-text-color-primary);
    font-size: 14px;
    line-height: 22px;
}

.transaction-detail__amount-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin: 8px 0;
}

.transaction-detail__amount-grid > div {
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    padding: 8px 10px;
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__amount-grid span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__amount-grid strong {
    display: block;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

@media (max-width: 980px) {
    .transaction-detail__hero {
        align-items: flex-start;
        grid-template-columns: 1fr;
    }

    .transaction-detail__hero-channel,
    .transaction-detail__hero-meta {
        justify-content: flex-start;
    }

    .transaction-detail__hero-channel {
        text-align: left;
    }

    .transaction-detail__hero-channel-inner {
        justify-content: flex-start;
    }

    .transaction-detail__identity-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-detail__amount-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .transaction-detail__hero-meta {
        align-items: flex-start;
        flex-direction: column;
        gap: 8px;
    }

    .transaction-detail__amount strong {
        font-size: 22px;
        line-height: 30px;
    }

    .transaction-detail__identity-grid {
        grid-template-columns: 1fr;
    }

    .transaction-detail__amount-grid {
        grid-template-columns: 1fr;
    }
}
</style>
