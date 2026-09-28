<template>
    <section class="transaction-flow">
        <header class="transaction-flow__toolbar">
            <div class="transaction-flow__heading">
                <h3>{{ t('transaction.detail.flow.title') }}</h3>
                <span :title="selectedTransactionId === 'ALL' ? undefined : selectedTransactionId">{{ selectedOperationLabel }}</span>
                <span v-if="visibleCount" class="transaction-flow__count">{{ recordCount(visibleCount) }}</span>
            </div>
            <div class="transaction-flow__actions">
                <el-select v-model="selectedTransactionId" size="small" class="transaction-flow__operation-select" :aria-label="t('transaction.detail.flow.operation')" :title="selectedTransactionId === 'ALL' ? undefined : selectedTransactionId">
                    <el-option value="ALL" :label="t('transaction.detail.flow.allOperations')" />
                    <el-option
                        v-for="option in operationOptions"
                        :key="option.value"
                        :value="option.value"
                        :label="option.label"
                    />
                </el-select>
                <el-radio-group v-model="viewMode" size="small" :aria-label="t('transaction.detail.flow.viewMode')">
                    <el-radio-button value="key">{{ t('transaction.detail.flow.keyEvents') }}</el-radio-button>
                    <el-radio-button value="all">{{ t('transaction.detail.flow.allRecords') }}</el-radio-button>
                </el-radio-group>
                <el-button size="small" @click="toggleAllPhases">{{ t(allPhasesCollapsed ? 'transaction.detail.flow.expandAll' : 'transaction.detail.flow.collapseAll') }}</el-button>
            </div>
        </header>

        <template v-if="operationGroups.length">
            <div v-if="operationGroups.length === 1 && stageOverview.length > 1" class="transaction-flow__stages" :aria-label="t('transaction.detail.flow.stages')">
                <div v-for="stage in stageOverview" :key="stage.key" class="transaction-flow__stage" :class="[`is-${stage.tone}`, { 'is-linked': stage.linked }]">
                    <span class="transaction-flow__stage-node" aria-hidden="true">
                        <svg v-if="stage.tone === 'success'" class="transaction-flow__stage-check" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                            <path d="M11.7 20.2c1.5-.8 3.6-1.4 4.6-.8 1.3.8 1.9 2.3 2.3 3.9 2.8-5.7 6.2-10.2 9.5-11.4 1.3-.5 2.8-.3 4.2.1-5.3 4.3-9.6 11-13.9 17.4-.8-4.4-3.2-7-6.9-9.2Z" fill="currentColor" />
                        </svg>
                        <el-icon v-else-if="stage.tone === 'danger'"><CloseBold /></el-icon>
                    </span>
                    <strong>{{ stageLabel(stage.stage) }}</strong>
                    <time>{{ displayRecordTime(stage.time) }}</time>
                </div>
            </div>

            <div v-for="group in operationGroups" :key="group.key" class="transaction-flow__operation">
                <div v-if="selectedTransactionId === 'ALL' && operationGroups.length > 1" class="transaction-flow__operation-heading">
                    <strong>{{ group.label }}</strong>
                    <span>{{ recordCount(group.count) }}</span>
                </div>
                <section v-for="phase in group.phases" :key="phase.key" class="transaction-flow__phase" :class="`is-${phase.tone}`">
                    <time class="transaction-flow__phase-time">{{ displayRecordTime(phase.time) }}</time>
                    <div class="transaction-flow__rail"><span></span></div>
                    <div class="transaction-flow__phase-body">
                        <button
                            type="button"
                            class="transaction-flow__phase-heading"
                            :aria-expanded="!isPhaseCollapsed(phase.key)"
                            @click="togglePhase(phase.key)"
                        >
                            <strong>{{ stageLabel(phase.stage) }}</strong>
                            <span>{{ recordCount(phase.entries.length) }}</span>
                            <el-tag v-if="phase.tone === 'danger'" size="small" type="danger" effect="plain">{{ t('transaction.detail.flow.hasFailure') }}</el-tag>
                            <el-icon class="transaction-flow__chevron" :class="{ 'is-collapsed': isPhaseCollapsed(phase.key) }"><ArrowDown /></el-icon>
                        </button>
                        <div v-if="!isPhaseCollapsed(phase.key)" class="transaction-flow__events">
                            <div v-for="entry in phase.entries" :key="entry.key" class="transaction-flow__event" :class="`is-${entry.tone}`">
                                <button
                                    type="button"
                                    class="transaction-flow__event-row"
                                    :aria-expanded="isEventExpanded(entry.key)"
                                    :title="t(isEventExpanded(entry.key) ? 'transaction.detail.flow.hideDetails' : 'transaction.detail.flow.showDetails')"
                                    @click="toggleEvent(entry.key)"
                                >
                                    <time>{{ displayRecordTime(entry.time) }}</time>
                                    <span class="transaction-flow__event-name"><i aria-hidden="true"></i><strong>{{ timelineTitle(entry.row) }}</strong></span>
                                    <span class="transaction-flow__event-content">{{ timelineContent(entry.row) }}</span>
                                    <el-tag size="small" :type="entry.tone" effect="light">{{ timelineStatusText(entry.row) }}</el-tag>
                                    <el-icon class="transaction-flow__chevron" :class="{ 'is-collapsed': !isEventExpanded(entry.key) }"><ArrowDown /></el-icon>
                                </button>
                                <dl v-if="isEventExpanded(entry.key)" class="transaction-flow__event-details">
                                    <div v-if="entry.row.eventType || entry.row.changeType"><dt>{{ t('transaction.detail.flow.eventType') }}</dt><dd>{{ entry.row.eventType || entry.row.changeType }}</dd></div>
                                    <div v-if="entry.row.eventStage"><dt>{{ t('transaction.detail.flow.eventStage') }}</dt><dd>{{ entry.row.eventStage }}</dd></div>
                                    <div v-if="entry.row.operationId"><dt>{{ t('transaction.detail.flow.operationId') }}</dt><dd>{{ entry.row.operationId }}</dd></div>
                                    <div v-if="entry.transactionId"><dt>{{ t('transaction.fields.transactionId') }}</dt><dd>{{ entry.transactionId }}</dd></div>
                                    <div v-if="entry.row.errorCode"><dt>{{ t('transaction.detail.flow.errorCode') }}</dt><dd>{{ entry.row.errorCode }}</dd></div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </template>
        <el-empty v-else :description="t('transaction.detail.empty')" />
    </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown, CloseBold } from '@element-plus/icons-vue';
import type { TransactionDetail, TransactionOperation } from '@/api/transaction';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import {
    DEFAULT_TRANSACTION_QUERY_TIME_ZONE,
    moneyText,
    optionText,
    type TransactionDictOption,
} from '../shared';

type TimelineRow = Record<string, unknown>;
type TimelineSource = 'flow' | 'risk' | 'status' | 'amount';
type TimelineTone = 'success' | 'warning' | 'danger' | 'primary';
type TimelineStage = 'API' | 'RISK' | 'ROUTE' | 'CHANNEL' | 'STATUS' | 'AMOUNT' | 'OTHER';

interface TimelineEntry {
    key: string;
    row: TimelineRow;
    source: TimelineSource;
    transactionId: string;
    stage: TimelineStage;
    tone: TimelineTone;
    time: unknown;
}

interface TimelinePhase {
    key: string;
    stage: TimelineStage;
    entries: TimelineEntry[];
    time: unknown;
    tone: TimelineTone;
}

interface TimelineOperationGroup {
    key: string;
    label: string;
    count: number;
    phases: TimelinePhase[];
}

const props = defineProps<{
    detail: TransactionDetail;
    focusTransactionId?: string;
    displayTimeZone: string;
    typeOptions: TransactionDictOption[];
    statusOptions: TransactionDictOption[];
}>();

const { t, te, locale } = useI18n();
const selectedTransactionId = ref('ALL');
const viewMode = ref<'key' | 'all'>('key');
const collapsedPhaseKeys = ref<string[]>([]);
const expandedEventKeys = ref<string[]>([]);

const operationMap = computed(() => new Map(props.detail.operations.map((operation) => [operation.transactionId, operation])));

const timelineEntries = computed<TimelineEntry[]>(() => {
    const merchantResponses = merchantResponseMap(props.detail.merchantApiInteractionLogs || []);
    const flowEvents = props.detail.flowEvents.map((row) => enrichTransactionResultEvent(row, merchantResponses));
    const representedInitialStatuses = new Set(flowEvents.filter(isTransactionResultEvent).map(timelineResultKey).filter(Boolean));
    const statusHistory = props.detail.statusHistory.filter((row) => !isRepresentedInitialStatus(row, representedInitialStatuses));
    const sourceRows: { row: TimelineRow; source: TimelineSource }[] = [
        ...flowEvents.map((row) => ({ row, source: 'flow' as const })),
        ...props.detail.riskEvents.map((row) => ({ row, source: 'risk' as const })),
        ...statusHistory.map((row) => ({ row, source: 'status' as const })),
        ...props.detail.amountChanges.map((row) => ({ row, source: 'amount' as const })),
    ];
    return sourceRows.sort(compareTimelineRows).map(({ row, source }, index) => ({
        key: timelineEntryKey(row, source, index),
        row,
        source,
        transactionId: resolveTransactionId(row),
        stage: timelineStage(row, source),
        tone: timelineTone(row),
        time: timelineTime(row),
    }));
});

const operationOptions = computed(() => {
    const ids = [...new Set([
        ...props.detail.operations.map((operation) => operation.transactionId),
        ...timelineEntries.value.map((entry) => entry.transactionId),
    ])];
    return ids.map((value) => ({
        value: value || '__UNLINKED__',
        label: value ? operationLabel(operationMap.value.get(value), value) : t('transaction.detail.flow.unlinked'),
    }));
});

watch([() => props.detail, () => props.focusTransactionId], () => {
    const focus = props.focusTransactionId || '';
    selectedTransactionId.value = focus && operationOptions.value.some((option) => option.value === focus) ? focus : 'ALL';
    viewMode.value = 'key';
    collapsedPhaseKeys.value = [];
    expandedEventKeys.value = [];
}, { immediate: true });

const operationGroups = computed<TimelineOperationGroup[]>(() => {
    const ids = selectedTransactionId.value === 'ALL'
        ? operationOptions.value.map((option) => option.value)
        : [selectedTransactionId.value];
    return ids.flatMap((id) => {
        const transactionId = id === '__UNLINKED__' ? '' : id;
        const allEntries = timelineEntries.value.filter((entry) => entry.transactionId === transactionId);
        const keyEntries = allEntries.filter((entry) => entry.source === 'flow' || entry.source === 'risk' || entry.tone === 'danger');
        const entries = viewMode.value === 'key' && keyEntries.length ? keyEntries : allEntries;
        if (!entries.length) return [];
        const phases: TimelinePhase[] = [];
        entries.forEach((entry) => {
            const last = phases[phases.length - 1];
            if (last && last.stage === entry.stage) {
                last.entries.push(entry);
                if (entry.tone === 'danger') last.tone = 'danger';
            } else {
                phases.push({
                    key: `${id}:${entry.stage}:${phases.length}`,
                    stage: entry.stage,
                    entries: [entry],
                    time: entry.time,
                    tone: entry.tone === 'danger' ? 'danger' : 'primary',
                });
            }
        });
        return [{
            key: id,
            label: transactionId ? operationLabel(operationMap.value.get(transactionId), transactionId) : t('transaction.detail.flow.unlinked'),
            count: entries.length,
            phases,
        }];
    });
});

const stageOverview = computed(() => {
    const group = operationGroups.value[0];
    if (!group || operationGroups.value.length !== 1) return [];
    const transactionId = group.key === '__UNLINKED__' ? '' : group.key;
    const stages = new Map<TimelineStage, { key: string; stage: TimelineStage; time: unknown; tone: TimelineTone }>();
    timelineEntries.value.filter((entry) => entry.transactionId === transactionId).forEach((entry) => {
        const stage = stages.get(entry.stage);
        if (stage) {
            stage.tone = entry.tone;
        } else {
            stages.set(entry.stage, { key: entry.stage, stage: entry.stage, time: entry.time, tone: entry.tone });
        }
    });
    const ordered = [...stages.values()];
    return ordered.map((stage, index) => ({
        ...stage,
        linked: stage.tone === 'success' && ordered[index + 1]?.tone === 'success',
    }));
});

const visibleCount = computed(() => operationGroups.value.reduce((count, group) => count + group.count, 0));
const allPhasesCollapsed = computed(() => operationGroups.value.length > 0
    && operationGroups.value.every((group) => group.phases.every((phase) => collapsedPhaseKeys.value.includes(phase.key))));
const selectedOperationLabel = computed(() => selectedTransactionId.value === 'ALL'
    ? t('transaction.detail.flow.allOperations')
    : operationOptions.value.find((option) => option.value === selectedTransactionId.value)?.label || '');

function operationLabel(operation: TransactionOperation | undefined, transactionId: string) {
    if (!operation) return `${t('transaction.fields.transactionId')} · ${transactionId}`;
    const type = optionText(props.typeOptions, operation.transactionType);
    const amount = operation.transactionAmount != null
        ? moneyText(operation.transactionAmount, operation.transactionCurrency, operation.currencyExponent)
        : '';
    return [type, amount, t('transaction.detail.flow.transactionIdSuffix', { suffix: transactionId.slice(-8) })].filter(Boolean).join(' · ');
}

function stageLabel(stage: TimelineStage) {
    return t(`transaction.detail.flow.stage.${stage}`);
}

function recordCount(count: number) {
    return t(count === 1 ? 'transaction.detail.flow.eventCountOne' : 'transaction.detail.flow.eventCount', { count });
}

function isPhaseCollapsed(key: string) {
    return collapsedPhaseKeys.value.includes(key);
}

function togglePhase(key: string) {
    collapsedPhaseKeys.value = isPhaseCollapsed(key)
        ? collapsedPhaseKeys.value.filter((item) => item !== key)
        : [...collapsedPhaseKeys.value, key];
}

function toggleAllPhases() {
    collapsedPhaseKeys.value = allPhasesCollapsed.value
        ? []
        : operationGroups.value.flatMap((group) => group.phases.map((phase) => phase.key));
}

function isEventExpanded(key: string) {
    return expandedEventKeys.value.includes(key);
}

function toggleEvent(key: string) {
    expandedEventKeys.value = isEventExpanded(key)
        ? expandedEventKeys.value.filter((item) => item !== key)
        : [...expandedEventKeys.value, key];
}

function timelineEntryKey(row: TimelineRow, source: TimelineSource, index: number) {
    return `${source}:${String(row.riskEventId || row.flowEventId || row.statusHistoryId || row.amountChangeId || row.id || row.eventId || index)}`;
}

function resolveTransactionId(row: TimelineRow) {
    if (row.transactionId) return String(row.transactionId);
    const operationId = String(row.operationId || '');
    return props.detail.operations.find((operation) => operation.operationId === operationId)?.transactionId || '';
}

function timelineStage(row: TimelineRow, source: TimelineSource): TimelineStage {
    const explicit = String(row.eventStage || '').toUpperCase();
    if (['API', 'RISK', 'ROUTE', 'CHANNEL', 'STATUS', 'AMOUNT'].includes(explicit)) return explicit as TimelineStage;
    if (source === 'risk') return 'RISK';
    if (source === 'status') return 'STATUS';
    if (source === 'amount') return 'AMOUNT';
    const eventStageByType: Record<string, TimelineStage> = {
        API_ACCEPTED: 'API', RISK_CHECKED: 'RISK', ROUTE_SELECTED: 'ROUTE', CHANNEL_CALLED: 'CHANNEL', STATUS_RECORDED: 'STATUS',
    };
    return eventStageByType[String(row.eventType || '').toUpperCase()] || 'OTHER';
}

interface MerchantResponseSummary {
    code: string;
    message: string;
}

function merchantResponseMap(rows: TimelineRow[]) {
    const responses = new Map<string, MerchantResponseSummary>();
    rows.forEach((row) => {
        const transactionId = String(row.transactionId || '');
        const code = String(row.merchantResponseCode || '');
        const message = String(row.merchantResponseMessage || '');
        if (transactionId && (code || message)) responses.set(transactionId, { code, message });
    });
    return responses;
}

function enrichTransactionResultEvent(row: TimelineRow, merchantResponses: Map<string, MerchantResponseSummary>) {
    if (!isTransactionResultEvent(row)) return row;
    const response = merchantResponses.get(String(row.transactionId || ''));
    if (!response) return row;
    const eventContent = [response.code, response.message].filter(Boolean).join('：');
    const failed = isFailureStatus(row.currentStatus || row.eventStatus);
    return {
        ...row,
        eventContent: eventContent || row.eventContent,
        errorCode: failed ? response.code : row.errorCode,
        errorMessage: failed ? response.message : row.errorMessage,
    };
}

function isTransactionResultEvent(row: TimelineRow) {
    return String(row.eventType || '').toUpperCase() === 'STATUS_RECORDED';
}

function timelineResultKey(row: TimelineRow) {
    const transactionId = String(row.transactionId || '');
    const status = String(row.currentStatus || row.toStatus || row.eventStatus || '').toUpperCase();
    return transactionId && status ? `${transactionId}:${status}` : '';
}

function isRepresentedInitialStatus(row: TimelineRow, representedStatuses: Set<string>) {
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

function timelineTitle(row: TimelineRow) {
    if (isTransactionResultEvent(row)) {
        const status = String(row.currentStatus || row.eventStatus || '').toUpperCase();
        return t(`transaction.timelineResult.${status}`, t('transaction.timelineResult.PROCESSING'));
    }
    const eventType = String(row.eventType || row.changeType || row.processStage || row.transactionStatus || '');
    if (!String(locale.value || '').startsWith('zh') && eventType && te(`transaction.timelineEvent.${eventType}`)) {
        return t(`transaction.timelineEvent.${eventType}`);
    }
    if (row.eventName) return String(row.eventName);
    if (row.statusHistoryId || row.statusObject || row.toStatus) {
        const objectText = timelineStatusObjectText(row.statusObject);
        const eventText = t('transaction.timelineEvent.STATUS_CHANGED');
        return String(locale.value || '').startsWith('zh') ? `${objectText}${eventText}` : `${objectText} ${eventText}`;
    }
    return eventType ? t(`transaction.timelineEvent.${eventType}`, t(`transaction.type.${eventType}`, eventType)) : '-';
}

function timelineStatusText(row: TimelineRow) {
    const status = timelineStatus(row);
    return status ? t(`transaction.timelineStatus.${status}`, status) : '-';
}

function timelineContent(row: TimelineRow) {
    if (row.amountChangeId || row.changeType) {
        const reason = String(row.changeReason || '');
        if (reason) return reason;
        if (isPresent(row.changeAmount)) {
            const amount = moneyText(row.changeAmount as number | string, String(row.amountCurrency || props.detail.order?.transactionCurrency || ''), props.detail.order?.currencyExponent);
            return `${t('transaction.detail.amountChange.actionAmount')}: ${amount}`;
        }
    }
    if (row.statusHistoryId || row.statusObject || row.toStatus) {
        const objectText = timelineStatusObjectText(row.statusObject);
        const fromStatus = timelineBusinessStatusText(row.fromStatus);
        const toStatus = timelineBusinessStatusText(row.toStatus);
        const transition = fromStatus ? `${fromStatus} -> ${toStatus}` : toStatus;
        const reason = String(row.failReason || '');
        const isChinese = String(locale.value || '').startsWith('zh');
        const content = `${objectText}${isChinese ? '：' : ': '}${transition || '-'}`;
        return reason ? `${content}${isChinese ? '；' : '; '}${reason}` : content;
    }
    return String(row.changeReason || row.eventContent || row.eventMessage || row.failReasonMessage || row.errorMessage || '-');
}

function timelineStatusObjectText(value: unknown) {
    const normalized = String(value || 'STATUS').toUpperCase();
    return t(`transaction.timelineStatusObject.${normalized}`, normalized);
}

function timelineBusinessStatusText(value: unknown) {
    const normalized = String(value || '').toUpperCase();
    return normalized ? t(`transaction.status.${normalized}`, optionText(props.statusOptions, normalized)) : '';
}

function timelineStatus(row: TimelineRow) {
    if (row.flowEventId || row.eventType || row.eventStage) {
        const eventType = String(row.eventType || '').toUpperCase();
        const status = String(row.eventStatus || '').toUpperCase();
        const content = String(row.eventContent || '');
        const errorText = String(row.errorCode || row.errorMessage || '');
        const businessStatus = String(row.currentStatus || row.targetStatus || '').toUpperCase();
        if (status === 'SUCCESS' && /SKIP|跳过|略过/i.test(content)) return 'SKIPPED';
        if (isFailureStatus(status)) return status;
        if (eventType === 'CHANNEL_CALLED' && isChannelFailureSignal(content, errorText, businessStatus)) return 'FAILED';
        if (isFailureStatus(errorText)) return 'FAILED';
        return String(row.eventStatus || row.currentStatus || '');
    }
    if (row.statusHistoryId || row.toStatus || row.statusObject) {
        const targetStatus = String(row.toStatus || row.transactionStatus || '').toUpperCase();
        const transitionResult = String(row.transitionResult || '').toUpperCase();
        if (isFailureStatus(targetStatus)) return targetStatus;
        if (['PENDING', 'PROCESSING', 'INIT'].includes(targetStatus)) return targetStatus;
        if (isFailureStatus(transitionResult)) return transitionResult;
        return transitionResult || targetStatus;
    }
    if (row.amountChangeId || row.changeType) return String(row.changeStatus || 'SUCCESS');
    return String(row.eventStatus || row.transitionResult || row.transactionStatus || row.currentStatus || row.targetStatus || '');
}

function timelineTone(row: TimelineRow): TimelineTone {
    const status = timelineStatus(row);
    if (isFailureStatus(status)) return 'danger';
    if (['PENDING', 'PROCESSING', 'INIT', 'SKIPPED', 'IGNORED'].includes(status)) return 'warning';
    return status === 'SUCCESS' ? 'success' : 'primary';
}

function isFailureStatus(value: unknown) {
    return /FAILED|ERROR|EXCEPTION|DECLINED|INVALID|REJECT(?:ED)?|TIMEOUT/.test(String(value || '').toUpperCase());
}

function isChannelFailureSignal(content: string, errorText: string, businessStatus: string) {
    return isFailureStatus(businessStatus)
        || isFailureStatus(errorText)
        || /渠道交易状态：FAILED|渠道原始状态：ERROR|渠道原始状态：DECLINED|平台交易状态：FAILED|CHANNEL_REQUEST_FAILED/i.test(content);
}

function timelineTime(row: TimelineRow) {
    return row.eventTime || row.statusTime || row.changeTime || row.createTime;
}

function timelineTimeValue(row: TimelineRow) {
    const value = timelineTime(row);
    if (!value) return Number.MAX_SAFE_INTEGER;
    const millis = new Date(String(value)).getTime();
    return Number.isFinite(millis) ? millis : Number.MAX_SAFE_INTEGER;
}

function compareTimelineRows(left: { row: TimelineRow; source: TimelineSource }, right: { row: TimelineRow; source: TimelineSource }) {
    const leftTime = timelineTimeValue(left.row);
    const rightTime = timelineTimeValue(right.row);
    // Timestamps are displayed to the second; use process order for events within that displayed second.
    const secondDifference = Math.floor(leftTime / 1000) - Math.floor(rightTime / 1000);
    if (secondDifference !== 0) return secondDifference;
    return timelineSequence(left.row, left.source) - timelineSequence(right.row, right.source) || leftTime - rightTime;
}

function timelineSequence(row: TimelineRow, source: TimelineSource) {
    const configured = isPresent(row.timelineSequence) ? Number(row.timelineSequence) : NaN;
    if (Number.isFinite(configured)) return configured;
    const sequenceByType: Record<string, number> = {
        API_ACCEPTED: 100, RISK_CHECKED: 300, ROUTE_SELECTED: 400, CHANNEL_CALLED: 500, STATUS_RECORDED: 600,
    };
    const eventSequence = sequenceByType[String(row.eventType || '')];
    if (eventSequence) return eventSequence;
    if (source === 'risk') return 200;
    if (row.statusHistoryId || row.toStatus || row.statusObject) return 610;
    if (row.amountChangeId || row.changeType) return 620;
    return 9999;
}

function displayRecordTime(value: unknown) {
    return formatDateTimeFromSourceTimeZone(value as string | number | Date | null | undefined, DEFAULT_TRANSACTION_QUERY_TIME_ZONE, props.displayTimeZone);
}

function isPresent(value: unknown) {
    return value !== undefined && value !== null && value !== '';
}
</script>

<style scoped>
.transaction-flow { color: var(--el-text-color-primary); }
.transaction-flow__toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; padding: 16px 0 18px; }
.transaction-flow__heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 8px 12px; min-width: 0; }
.transaction-flow__heading h3 { margin: 0; font-size: 17px; line-height: 26px; }
.transaction-flow__heading > span { color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; overflow-wrap: anywhere; }
.transaction-flow__count { font-variant-numeric: tabular-nums; }
.transaction-flow__actions { display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px; }
.transaction-flow__operation-select { flex: 0 0 420px; width: 420px; }
.transaction-flow__stages { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(160px, 1fr); overflow-x: auto; border: 1px solid #dfe9f8; border-radius: 6px; padding: 19px 12px 16px; background: #f8fbff; }
.transaction-flow__stage { position: relative; display: grid; justify-items: center; gap: 3px; min-width: 0; text-align: center; }
.transaction-flow__stage:not(:last-child)::after { position: absolute; top: 19px; left: calc(50% + 26px); width: calc(100% - 52px); height: 3px; background: #d6e2f2; content: ''; }
.transaction-flow__stage.is-linked::after { background: #93c5fd; }
.transaction-flow__stage-node { position: relative; z-index: 1; display: grid; place-items: center; box-sizing: border-box; width: 40px; height: 40px; border: 2px solid #b8c9d9; border-radius: 50%; background: #fff; color: #fff; }
.transaction-flow__stage.is-primary .transaction-flow__stage-node::after,
.transaction-flow__stage.is-warning .transaction-flow__stage-node::after { width: 8px; height: 8px; border-radius: 50%; background: #7898b4; content: ''; }
.transaction-flow__stage.is-success .transaction-flow__stage-node { border-color: #2563eb; background: #2563eb; }
.transaction-flow__stage-check { position: absolute; top: 50%; left: calc(50% - 2px); width: 40px; height: 40px; transform: translate(-50%, -50%); }
.transaction-flow__stage.is-warning .transaction-flow__stage-node { border-color: #e4bd76; background: #fffaf0; }
.transaction-flow__stage.is-warning .transaction-flow__stage-node::after { background: #c78a2b; }
.transaction-flow__stage.is-danger .transaction-flow__stage-node { border-color: #d74f50; background: #d74f50; }
.transaction-flow__stage.is-danger .transaction-flow__stage-node .el-icon { font-size: 18px; }
.transaction-flow__stage strong { margin-top: 4px; font-size: 13px; line-height: 19px; }
.transaction-flow__stage time { color: var(--el-text-color-secondary); font-size: 11px; line-height: 17px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.transaction-flow__operation { padding-top: 20px; }
.transaction-flow__operation-heading { display: flex; align-items: baseline; flex-wrap: wrap; gap: 10px; margin-bottom: 7px; padding-bottom: 9px; border-bottom: 1px solid var(--el-border-color-lighter); }
.transaction-flow__operation-heading strong { font-size: 14px; }
.transaction-flow__operation-heading span { color: var(--el-text-color-secondary); font-size: 12px; }
.transaction-flow__phase { display: grid; grid-template-columns: 155px 22px minmax(0, 1fr); gap: 12px; padding: 7px 0 3px; }
.transaction-flow__phase-time { padding-top: 9px; color: var(--el-text-color-secondary); font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.transaction-flow__rail { position: relative; display: flex; justify-content: center; padding-top: 10px; }
.transaction-flow__phase:not(:last-child) .transaction-flow__rail::after { position: absolute; top: 23px; bottom: -12px; width: 1px; background: #d5dfec; content: ''; }
.transaction-flow__rail span { position: relative; z-index: 1; width: 12px; height: 12px; border: 3px solid var(--el-color-primary); border-radius: 50%; background: #fff; }
.transaction-flow__phase.is-danger .transaction-flow__rail span { border-color: var(--el-color-danger); }
.transaction-flow__phase-body { min-width: 0; border-bottom: 1px solid var(--el-border-color-lighter); }
.transaction-flow__phase-heading { display: flex; align-items: center; width: 100%; min-height: 38px; gap: 10px; padding: 0 1px 10px; border: 0; background: transparent; color: var(--el-text-color-primary); text-align: left; cursor: pointer; }
.transaction-flow__phase-heading strong { font-size: 14px; line-height: 20px; }
.transaction-flow__phase-heading > span { color: var(--el-text-color-secondary); font-size: 12px; }
.transaction-flow__phase-heading .el-tag { margin-left: auto; }
.transaction-flow__chevron { margin-left: auto; color: var(--el-text-color-secondary); transition: transform .16s ease; }
.transaction-flow__phase-heading .el-tag + .transaction-flow__chevron { margin-left: 2px; }
.transaction-flow__chevron.is-collapsed { transform: rotate(-90deg); }
.transaction-flow__events { margin: 0 0 12px; border: 1px solid var(--el-border-color-lighter); border-radius: 5px; overflow: hidden; }
.transaction-flow__event + .transaction-flow__event { border-top: 1px solid var(--el-border-color-lighter); }
.transaction-flow__event-row { display: grid; grid-template-columns: 155px minmax(130px, 190px) minmax(160px, 1fr) auto 18px; align-items: center; width: 100%; min-height: 54px; gap: 12px; padding: 9px 12px; border: 0; background: #fff; color: var(--el-text-color-primary); text-align: left; cursor: pointer; }
.transaction-flow__event-row:hover { background: #f8fbff; }
.transaction-flow__event-row > time { color: var(--el-text-color-secondary); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.transaction-flow__event-name { display: flex; align-items: center; min-width: 0; gap: 9px; font-size: 13px; line-height: 19px; }
.transaction-flow__event-name i { flex: 0 0 7px; height: 7px; border-radius: 50%; background: #248556; }
.transaction-flow__event.is-warning .transaction-flow__event-name i { background: #c27921; }
.transaction-flow__event.is-danger .transaction-flow__event-name i { background: var(--el-color-danger); }
.transaction-flow__event.is-primary .transaction-flow__event-name i { background: var(--el-color-primary); }
.transaction-flow__event-name strong, .transaction-flow__event-content { min-width: 0; overflow-wrap: anywhere; }
.transaction-flow__event-name strong { font-weight: 600; }
.transaction-flow__event-content { color: var(--el-text-color-secondary); font-size: 12px; line-height: 18px; }
.transaction-flow__event-row .el-tag { justify-self: end; white-space: nowrap; }
.transaction-flow__event-details { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px 18px; margin: 0; padding: 12px 15px 14px 167px; border-top: 1px solid var(--el-border-color-lighter); background: #f9fbfe; }
.transaction-flow__event-details > div { display: grid; grid-template-columns: 82px minmax(0, 1fr); gap: 7px; min-width: 0; font-size: 12px; line-height: 18px; }
.transaction-flow__event-details dt { color: var(--el-text-color-secondary); }
.transaction-flow__event-details dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 980px) {
    .transaction-flow__toolbar { align-items: flex-start; }
    .transaction-flow__actions { justify-content: flex-start; }
    .transaction-flow__phase { grid-template-columns: 18px minmax(0, 1fr); gap: 9px; }
    .transaction-flow__phase-time { display: none; }
    .transaction-flow__event-row { grid-template-columns: 128px minmax(130px, 170px) minmax(140px, 1fr) auto 16px; gap: 8px; }
    .transaction-flow__event-details { padding-left: 15px; }
}
@media (max-width: 640px) {
    .transaction-flow__actions { width: 100%; }
    .transaction-flow__operation-select { flex-basis: 100%; width: 100%; }
    .transaction-flow__stages { grid-auto-flow: row; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
    .transaction-flow__stage { grid-template-columns: 34px minmax(0, 1fr); justify-items: start; gap: 2px 7px; text-align: left; }
    .transaction-flow__stage:not(:last-child)::after { display: none; }
    .transaction-flow__stage-node { grid-row: span 2; width: 34px; height: 34px; }
    .transaction-flow__stage-check { width: 34px; height: 34px; }
    .transaction-flow__stage strong { margin-top: 0; }
    .transaction-flow__stage time { white-space: normal; overflow-wrap: anywhere; }
    .transaction-flow__event-row { grid-template-columns: minmax(0, 1fr) auto 16px; gap: 5px 8px; padding: 10px; }
    .transaction-flow__event-row > time { grid-column: 1; grid-row: 1; }
    .transaction-flow__event-name { grid-column: 1; grid-row: 2; }
    .transaction-flow__event-content { grid-column: 1 / -1; grid-row: 3; padding-left: 16px; }
    .transaction-flow__event-row .el-tag { grid-column: 2; grid-row: 1 / 3; }
    .transaction-flow__event-row .transaction-flow__chevron { grid-column: 3; grid-row: 1 / 3; }
    .transaction-flow__event-details { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) {
    .transaction-flow__chevron { transition: none; }
}
</style>
