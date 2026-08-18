<template>
    <div class="record-list">
        <div v-if="rows.length" class="record-list__stack">
            <article v-for="(row, index) in rows" :key="recordKey(row, index)" class="record-card" :class="`is-${statusTone(row)}`">
                <header class="record-card__header">
                    <div class="record-card__identity">
                        <span class="record-card__type">{{ recordTypeText(row) }}</span>
                        <CopyableText :value="recordIdentity(row, index)" :label="recordTypeText(row)" wrap />
                        <el-tag v-if="transactionTypeText(row)" size="small" effect="plain" class="record-card__transaction-type">
                            {{ transactionTypeText(row) }}
                        </el-tag>
                    </div>
                    <div class="record-card__status">
                        <el-tag v-if="statusText(row)" size="small" :type="statusTagType(row)" effect="light">{{ statusText(row) }}</el-tag>
                        <span v-if="durationText(row)" class="record-card__duration">{{ durationText(row) }}</span>
                    </div>
                </header>

                <div class="record-card__timeline">
                    <span>{{ requestTimeText(row) }}</span>
                    <i />
                    <span>{{ responseTimeText(row) }}</span>
                </div>

                <div class="record-list__meta">
                    <div v-for="item in metaItems(row)" :key="item.label">
                        <span>{{ metaLabel(item.label) }}</span>
                        <CopyableText v-if="item.copyable" :value="item.value" :label="item.label" wrap />
                        <strong v-else>{{ item.value }}</strong>
                    </div>
                </div>

                <div v-if="rawBlocks(row).length" class="record-list__raw-grid">
                    <section v-for="block in rawBlocks(row)" :key="block.title" class="record-list__raw-block">
                        <div class="record-list__json-title">
                            <span>{{ block.title }}</span>
                            <CopyableText :value="block.value" :label="block.title" icon-only />
                        </div>
                        <pre>{{ block.value }}</pre>
                    </section>
                </div>

                <el-alert
                    v-else
                    class="record-list__empty-raw"
                    :title="$t('transaction.detail.noRawPayload')"
                    type="info"
                    :closable="false"
                    show-icon
                />

                <section v-if="showInternalSnapshot" class="record-list__raw-block">
                    <div class="record-list__json-title">
                        <span>{{ $t('transaction.detail.internalRecordSnapshot') }}</span>
                        <CopyableText :value="prettyJson(row)" :label="$t('transaction.detail.internalRecordSnapshot')" icon-only />
                    </div>
                    <pre>{{ prettyJson(row) }}</pre>
                </section>
            </article>
        </div>
        <el-empty v-else :description="$t('transaction.detail.empty')" />
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE } from '../shared';
import CopyableText from './CopyableText.vue';

const props = defineProps<{
    rows: Record<string, unknown>[];
    variant?: 'channel' | 'callback' | 'merchantApi';
    displayTimeZone?: string;
    showInternalSnapshot?: boolean;
}>();

const { t } = useI18n();

function recordKey(row: Record<string, unknown>, index: number) {
    return `${String(row.channelRecordId || row.id || row.requestId || row.callbackId || row.notifyId || row.interactionLogId || index)}-${index}`;
}

function statusText(row: Record<string, unknown>) {
    const failureText = failureStatusText(row);
    if (failureText) {
        return failureText;
    }
    if (row.platformResultCode !== undefined && row.platformResultCode !== null && row.platformResultCode !== '') {
        return String(row.platformResultCode);
    }
    const success = row.success;
    if (success !== undefined && success !== null) {
        return Number(success) === 1 ? t('transaction.detail.success') : t('transaction.detail.failed');
    }
    return statusDisplayText(
        row.channelTradeStatus,
        row.rawChannelStatus,
        rawResponseValue(row, 'channelTradeStatus'),
        rawResponseValue(row, 'rawChannelStatus'),
        rawResponseValue(row, 'result'),
        rawResponseValue(row, 'errorCause'),
        row.gatewayResult,
        row.transactionStatus,
        row.callbackStatus,
        row.processResult,
        row.responseResult,
        row.notifyStatus,
        row.requestResult,
        row.requestStatus,
    );
}

function statusTone(row: Record<string, unknown>) {
    const text = statusText(row).toUpperCase();
    if (Number(row.success) === 0 || hasFailureSignal(row) || isFailureText(text)) {
        return 'danger';
    }
    if (/PENDING|INIT|PROCESSING|RETRYING/.test(text)) {
        return 'warning';
    }
    if (Number(row.success) === 1 || /SUCCESS|APPROVED|RECEIVED|PROCESSED|ACCEPTED|VALID/.test(text)) {
        return 'success';
    }
    return 'primary';
}

function statusTagType(row: Record<string, unknown>) {
    const tone = statusTone(row);
    if (tone === 'danger') {
        return 'danger';
    }
    if (tone === 'warning') {
        return 'warning';
    }
    if (tone === 'success') {
        return 'success';
    }
    return 'primary';
}

function prettyJson(row: Record<string, unknown>) {
    return JSON.stringify(row, null, 2);
}

function rawBlocks(row: Record<string, unknown>) {
    return rawBlockCandidates(row)
        .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
        .map((item) => ({ title: item.title, value: formatRawValue(item.value) }));
}

function rawBlockCandidates(row: Record<string, unknown>) {
    const type = recordType(row);
    if (type === 'merchantApi') {
        return [
            { title: t('transaction.detail.merchantRequestCipherRaw'), value: requestCipherPayload(row) },
            { title: t('transaction.detail.merchantResponseCipherRaw'), value: responseCipherPayload(row) },
            { title: t('transaction.detail.merchantRequestRaw'), value: row.requestPlainJsonMasked },
            { title: t('transaction.detail.merchantResponseRaw'), value: row.responsePlainJsonMasked },
        ];
    }
    if (type === 'channelInteraction') {
        return [
            { title: t('transaction.detail.channelRequestHeaderRaw'), value: row.requestHeaderJsonMasked },
            { title: t('transaction.detail.channelRequestRaw'), value: row.requestBodyJsonMasked },
            { title: t('transaction.detail.channelResponseHeaderRaw'), value: row.responseHeaderJsonMasked },
            { title: t('transaction.detail.channelResponseRaw'), value: row.responseBodyJsonMasked },
            { title: t('transaction.detail.exceptionMessage'), value: exceptionSummary(row) },
        ];
    }
    if (type === 'channelCallbackLog') {
        return [
            { title: t('transaction.detail.channelCallbackHeaderRaw'), value: row.requestHeaderJsonMasked },
            { title: t('transaction.detail.channelCallbackBodyRaw'), value: row.requestBodyJsonMasked },
            { title: t('transaction.detail.platformResponseRaw'), value: row.platformResponseBody },
        ];
    }
    if (type === 'merchantNotificationLog') {
        return [
            { title: t('transaction.detail.merchantNotifyRequestHeaderRaw'), value: row.requestHeaderJsonMasked },
            { title: t('transaction.detail.merchantNotifyRequestRaw'), value: row.requestBodyJsonMasked },
            { title: t('transaction.detail.merchantNotifyResponseRaw'), value: row.responseBodyJsonMasked },
        ];
    }
    if (type === 'merchantNotification') {
        return [
            { title: t('transaction.detail.merchantNotifyTargetUrl'), value: row.targetUrlMasked },
            { title: t('transaction.detail.merchantNotifyPayload'), value: row.payloadJsonMasked },
        ];
    }
    return [];
}

function metaItems(row: Record<string, unknown>) {
    return [
        { label: 'apiLogId', value: row.apiLogId },
        { label: 'channelRecordId', value: row.channelRecordId },
        { label: 'requestId', value: row.requestId },
        { label: 'requestSummaryId', value: row.requestSummaryId },
        { label: 'interactionLogId', value: row.interactionLogId },
        { label: 'callbackId', value: row.callbackId },
        { label: 'callbackLogId', value: row.callbackLogId },
        { label: 'notifyId', value: row.notifyId },
        { label: 'notifyLogId', value: row.notifyLogId },
        { label: 'eventId', value: callbackHeaderValue(row, 'X-Callback-Event-Id') },
        { label: 'attemptNo', value: row.attemptNo || callbackHeaderValue(row, 'X-Callback-Times') },
        { label: 'transactionId', value: row.transactionId },
        { label: 'operationId', value: row.operationId },
        { label: 'transactionType', value: transactionTypeText(row) },
        { label: 'merchantId', value: row.merchantId },
        { label: 'merchantOrderNo', value: row.merchantOrderNo },
        { label: 'merchantOrderId', value: row.merchantOrderId },
        { label: 'channelCode', value: row.channelCode },
        { label: 'channelOrderNo', value: row.channelOrderNo },
        { label: 'channelTransactionId', value: row.channelTransactionId },
        { label: 'apiOperation', value: row.apiOperation },
        { label: 'requestScene', value: row.requestScene },
        { label: 'requestAmount', value: requestAmountText(row) },
        { label: 'gatewayResult', value: row.gatewayResult },
        { label: 'gatewayCode', value: row.gatewayCode },
        { label: 'channelTradeStatus', value: row.channelTradeStatus },
        { label: 'rawChannelStatus', value: row.rawChannelStatus || row.channelStatus },
        { label: 'channelResponseCode', value: row.channelResponseCode },
        { label: 'channelResponseMessage', value: row.channelResponseMessage },
        { label: 'acquirerCode', value: row.acquirerCode },
        { label: 'acquirerMessage', value: row.acquirerMessage },
        { label: 'platformResultCode', value: row.platformResultCode },
        { label: 'platformFailReason', value: row.platformFailReason },
        { label: 'httpMethod', value: row.httpMethod },
        { label: 'httpStatus', value: row.httpStatus },
        { label: 'merchantResponseCode', value: row.merchantResponseCode },
        { label: 'merchantResponseMessage', value: row.merchantResponseMessage },
        ...(recordType(row) === 'merchantNotificationLog'
            ? [{ label: 'acknowledgement', value: callbackAcknowledgement(row) }]
            : []),
        { label: 'errorMessage', value: row.errorMessage },
        { label: 'status', value: statusText(row) },
        { label: 'requestTime', value: requestTimeText(row) },
        { label: 'responseTime', value: responseTimeText(row) },
    ]
        .filter((item) => item.value !== undefined && item.value !== null && item.value !== '')
        .map((item) => ({ label: item.label, value: String(item.value), copyable: isCopyableMeta(item.label) }));
}

function requestTimeText(row: Record<string, unknown>) {
    return String(formatDisplayTime(row.requestStartTime || row.requestTime || row.interactionTime || row.callbackReceivedTime || row.notifyTime || row.createTime) || '-');
}

function responseTimeText(row: Record<string, unknown>) {
    return String(formatDisplayTime(row.responseTime || row.callbackProcessedTime || row.successTime || row.updateTime) || '-');
}

function durationText(row: Record<string, unknown>) {
    if (row.durationMillis === undefined || row.durationMillis === null || row.durationMillis === '') {
        return '';
    }
    return `${row.durationMillis} ms`;
}

function requestAmountText(row: Record<string, unknown>) {
    if (row.requestAmount === undefined || row.requestAmount === null || row.requestAmount === '') {
        return '';
    }
    return [row.requestAmount, row.requestCurrency].filter(Boolean).join(' ');
}

function statusDisplayText(...values: unknown[]) {
    const failed = values.find((value) => /FAILED|ERROR|EXCEPTION|DECLINED|INVALID|REJECTED|TIMEOUT/.test(String(value || '').toUpperCase()));
    if (failed) {
        return String(failed);
    }
    const processing = values.find((value) => /PENDING|INIT|PROCESSING|RETRYING/.test(String(value || '').toUpperCase()));
    if (processing) {
        return String(processing);
    }
    const success = values.find((value) => /SUCCESS|APPROVED|RECEIVED|PROCESSED|ACCEPTED|VALID/.test(String(value || '').toUpperCase()));
    return success ? String(success) : String(values.find((value) => value !== undefined && value !== null && value !== '') || '');
}

function hasFailureSignal(row: Record<string, unknown>) {
    return [
        row.platformResultCode,
        row.channelTradeStatus,
        row.rawChannelStatus,
        row.channelStatus,
        row.gatewayResult,
        row.channelResponseCode,
        row.channelResponseMessage,
        row.exceptionType,
        row.platformFailReason,
        rawResponseValue(row, 'channelTradeStatus'),
        rawResponseValue(row, 'rawChannelStatus'),
        rawResponseValue(row, 'result'),
        rawResponseValue(row, 'errorCause'),
        rawResponseValue(row, 'errorExplanation'),
    ].some((value) => isFailureText(value) || /CHANNEL_REQUEST_FAILED/.test(String(value || '').toUpperCase()));
}

function failureStatusText(row: Record<string, unknown>) {
    if (!hasFailureSignal(row)) {
        return '';
    }
    return String(
        firstPresent(
            failureCandidate(row.platformResultCode),
            failureCandidate(row.channelTradeStatus),
            failureCandidate(row.rawChannelStatus),
            failureCandidate(row.channelStatus),
            failureCandidate(row.gatewayResult),
            failureCandidate(rawResponseValue(row, 'channelTradeStatus')),
            failureCandidate(rawResponseValue(row, 'rawChannelStatus')),
            failureCandidate(rawResponseValue(row, 'result')),
            row.channelResponseCode,
            row.exceptionType,
            'FAILED',
        ),
    );
}

function failureCandidate(value: unknown) {
    return isFailureText(value) ? value : undefined;
}

function isFailureText(value: unknown) {
    return /FAILED|ERROR|EXCEPTION|DECLINED|INVALID|REJECTED|TIMEOUT/.test(String(value || '').toUpperCase());
}

function firstPresent(...values: unknown[]) {
    return values.find((value) => value !== undefined && value !== null && value !== '');
}

function rawResponseValue(row: Record<string, unknown>, key: string) {
    const payload = parseRawResponse(row.responseBodyJsonMasked);
    if (!payload) {
        return undefined;
    }
    if (payload[key] !== undefined) {
        return payload[key];
    }
    const rawResponse = payload.rawResponse;
    if (rawResponse && typeof rawResponse === 'object' && !Array.isArray(rawResponse)) {
        return (rawResponse as Record<string, unknown>)[key];
    }
    return undefined;
}

function parseRawResponse(value: unknown): Record<string, unknown> | null {
    if (!value) {
        return null;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as Record<string, unknown>;
    }
    if (typeof value !== 'string') {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
        return null;
    }
    try {
        const parsed = JSON.parse(trimmed);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

function callbackHeaderValue(row: Record<string, unknown>, name: string) {
    const headers = parseRawResponse(row.requestHeaderJsonMasked);
    return headers ? headers[name] : undefined;
}

function callbackAcknowledgement(row: Record<string, unknown>) {
    const response = row.responseBodyJsonMasked;
    return typeof response === 'string' && response.trim() ? response.trim() : undefined;
}

function formatDisplayTime(value: unknown) {
    if (!value) {
        return value;
    }
    return formatDateTimeFromSourceTimeZone(value as string | number | Date, DEFAULT_TRANSACTION_QUERY_TIME_ZONE, props.displayTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
}

function isCopyableMeta(label: string) {
    return /(id|no)$/i.test(label);
}

function metaLabel(label: string) {
    return t(`transaction.detail.meta.${label}`);
}

function requestCipherPayload(row: Record<string, unknown>) {
    return cipherPayload(row.requestCipherMasked, row.requestCipherDigest);
}

function responseCipherPayload(row: Record<string, unknown>) {
    return cipherPayload(row.responseCipherMasked, row.responseCipherDigest);
}

function cipherPayload(masked: unknown, digest: unknown) {
    const payload: Record<string, unknown> = {};
    if (masked) {
        payload.cipher = masked;
    }
    if (digest) {
        payload.digest = digest;
    }
    return Object.keys(payload).length ? payload : '';
}

function exceptionSummary(row: Record<string, unknown>) {
    const parts = [
        row.exceptionType ? `type=${row.exceptionType}` : '',
        row.exceptionMessage ? `message=${row.exceptionMessage}` : '',
    ].filter(Boolean);
    return parts.length ? parts.join('\n') : '';
}

function recordIdentity(row: Record<string, unknown>, index: number) {
    return String(row.channelRecordId
        || row.apiLogId
        || row.interactionLogId
        || row.requestId
        || row.callbackLogId
        || row.callbackId
        || row.notifyLogId
        || row.notifyId
        || row.transactionId
        || `#${index + 1}`);
}

function recordType(row: Record<string, unknown>) {
    if (props.variant === 'merchantApi' || row.apiOperation || row.apiLogId) {
        return 'merchantApi';
    }
    if (row.channelRecordSource === 'merged' || row.interactionLogId || row.requestInteractionLogId || row.responseInteractionLogId || row.responseHeaderJsonMasked || row.exceptionType) {
        return 'channelInteraction';
    }
    if (row.callbackLogId || row.platformResponseBody) {
        return 'channelCallbackLog';
    }
    if (row.callbackId || row.channelEventType || row.parsedTransactionStatus) {
        return 'channelCallback';
    }
    if (row.notifyLogId || row.attemptNo || row.success !== undefined) {
        return 'merchantNotificationLog';
    }
    if (row.notifyId || row.targetUrlMasked || row.payloadJsonMasked) {
        return 'merchantNotification';
    }
    if (props.variant === 'callback') {
        return 'callback';
    }
    return 'channelRequest';
}

function recordTypeText(row: Record<string, unknown>) {
    const baseText = t(`transaction.detail.recordType.${recordType(row)}`);
    const typeText = transactionTypeText(row);
    if (!typeText) {
        return baseText;
    }
    return `${baseText} ${typeText}`;
}

function transactionTypeText(row: Record<string, unknown>) {
    const value = String(row.transactionType || row.parsedTransactionType || row.apiOperation || row.channelEventType || '');
    return value ? t(`transaction.type.${value}`, value) : '';
}

function formatRawValue(value: unknown) {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                return JSON.stringify(JSON.parse(trimmed), null, 2);
            } catch {
                return value;
            }
        }
        return value;
    }
    return JSON.stringify(value, null, 2);
}
</script>

<style scoped>
.record-list {
    min-width: 0;
}

.record-list__stack {
    display: grid;
    gap: 14px;
}

.record-card {
    position: relative;
    min-width: 0;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    border-left: 4px solid var(--el-color-primary);
    border-radius: 8px;
    padding: 14px;
    background: var(--el-bg-color);
    box-shadow: 0 8px 24px rgb(15 23 42 / 5%);
}

.record-card.is-success {
    border-left-color: var(--el-color-success);
}

.record-card.is-danger {
    border-left-color: var(--el-color-danger);
}

.record-card.is-warning {
    border-left-color: var(--el-color-warning);
}

.record-card__header {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
}

.record-card__identity {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 10px;
}

.record-card__type {
    flex: 0 0 auto;
    border-radius: 999px;
    padding: 3px 9px;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 700;
    line-height: 18px;
}

.record-card__identity :deep(.copyable-text) {
    min-width: 0;
    font-weight: 700;
}

.record-card__transaction-type {
    flex: 0 0 auto;
    border-radius: 999px;
    font-weight: 700;
}

.record-card__status {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 8px;
}

.record-card__duration {
    border-radius: 999px;
    padding: 2px 8px;
    background: #eef2f7;
    color: #475569;
    font-size: 12px;
    line-height: 18px;
}

.record-card__timeline {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.record-card__timeline span {
    overflow-wrap: anywhere;
}

.record-card__timeline i {
    height: 1px;
    min-width: 40px;
    flex: 1;
    background: linear-gradient(90deg, var(--el-border-color), transparent);
}

.record-list__meta {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 14px;
}

.record-list__meta > div {
    min-width: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 8px 10px;
    background: linear-gradient(180deg, var(--el-fill-color-extra-light), transparent);
}

.record-list__meta span {
    display: block;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.record-list__meta strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
    overflow-wrap: anywhere;
    word-break: break-all;
}

.record-list__meta :deep(.copyable-text) {
    width: 100%;
}

.record-list__json-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    border: 1px solid #1e293b;
    border-bottom: 0;
    border-radius: 8px 8px 0 0;
    padding: 8px 10px;
    background: #111827;
    color: #dbeafe;
    font-size: 12px;
    font-weight: 700;
}

.record-list__raw-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
}

.record-list__empty-raw {
    margin-bottom: 12px;
}

.record-list__raw-block {
    min-width: 0;
}

pre {
    overflow: auto;
    max-height: 420px;
    margin: 0;
    border: 1px solid #1e293b;
    border-radius: 0 0 8px 8px;
    padding: 12px 14px;
    background: #0b1120;
    color: #e2e8f0;
    font-size: 12px;
    line-height: 1.55;
    tab-size: 2;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

@media (max-width: 900px) {
    .record-card__header,
    .record-card__identity,
    .record-card__timeline {
        align-items: flex-start;
    }

    .record-card__header,
    .record-card__timeline {
        flex-direction: column;
    }

    .record-card__timeline i {
        display: none;
    }

    .record-list__meta,
    .record-list__raw-grid {
        grid-template-columns: 1fr;
    }
}
</style>
