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
                        <el-descriptions-item :label="t('transaction.fields.channelMatchStatus')">
                            <el-tag size="small" effect="plain">{{ optionText(channelMatchStatusOptions, capabilityRecord?.channelMatchStatus) }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.threeDs')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--three-ds" :class="{ 'is-enabled': capabilityRecord?.threeDsEnabled === 1 }">{{ t(capabilityRecord?.threeDsEnabled === 1 ? 'common.yes' : 'common.no') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.dcc')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--dcc" :class="{ 'is-enabled': capabilityRecord?.dccEnabled === 1 }">{{ t(capabilityRecord?.dccEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.edc')">
                            <el-tag size="small" effect="plain" class="transaction-capability-tag transaction-capability-tag--edc" :class="{ 'is-enabled': capabilityRecord?.edcEnabled === 1 }">{{ t(capabilityRecord?.edcEnabled === 1 ? 'transaction.capability.enabled' : 'transaction.capability.disabled') }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.authorizedAmount')">{{ moneyText(detail.order?.authorizedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.capturedAmount')">{{ moneyText(detail.order?.capturedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.refundedAmount')">{{ moneyText(detail.order?.refundedAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('transaction.fields.availableRefundAmount')">{{ moneyText(detail.order?.availableRefundAmount, detail.order?.transactionCurrency, detail.order?.currencyExponent) }}</el-descriptions-item>
                    </el-descriptions>
                </el-tab-pane>

                <el-tab-pane v-if="partyInfoSections.length" :label="t('transaction.detail.partyInfo')" name="partyInfo">
                    <div class="transaction-detail__party-sections">
                        <section v-for="section in partyInfoSections" :key="section.key" class="transaction-detail__party-section">
                            <h3>{{ section.title }}</h3>
                            <dl class="transaction-detail__party-grid">
                                <div
                                    v-for="field in section.fields"
                                    :key="field.key"
                                    class="transaction-detail__party-field"
                                    :class="{ 'is-wide': field.wide }"
                                >
                                    <dt>{{ field.label }}</dt>
                                    <dd><CopyableText :value="field.value" :label="field.label" wrap /></dd>
                                </div>
                            </dl>
                        </section>
                    </div>
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
                    <el-timeline v-if="amountChangeRows.length" class="transaction-detail__amount-timeline">
                        <el-timeline-item
                            v-for="item in amountChangeRows"
                            :key="String(item.amountChangeId || item.id || item.changeTime)"
                            type="primary"
                        >
                            <article class="transaction-detail__amount-event">
                                <header class="transaction-detail__amount-event-head">
                                    <div>
                                        <time>{{ displayRecordTime(item.changeTime || item.createTime) }}</time>
                                        <h3>{{ optionText(typeOptions, String(item.changeType || '')) }}</h3>
                                    </div>
                                    <div class="transaction-detail__amount-event-value">
                                        <span>{{ t('transaction.detail.amountChange.actionAmount') }}</span>
                                        <strong>{{ amountMoneyText(item, 'changeAmount') }}</strong>
                                    </div>
                                </header>
                                <div class="transaction-detail__amount-metrics" :class="{ 'is-pair': amountMetrics(item).length === 2 }">
                                    <div v-for="metric in amountMetrics(item)" :key="metric.after" class="transaction-detail__amount-metric">
                                        <span class="transaction-detail__amount-metric-label">{{ t(metric.label) }}</span>
                                        <div class="transaction-detail__amount-metric-values">
                                            <template v-if="amountHasChanged(item, metric.before, metric.after)">
                                                <span>{{ amountMoneyText(item, metric.before) }}</span>
                                                <span aria-hidden="true">→</span>
                                            </template>
                                            <strong>{{ amountMoneyText(item, metric.after) }}</strong>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="amountEventNote(item)" class="transaction-detail__amount-event-note">{{ amountEventNote(item) }}</p>
                            </article>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-if="!amountChangeRows.length" :description="t('transaction.detail.empty')" />
                </el-tab-pane>

                <el-tab-pane v-if="canViewFinance" :label="t('transaction.detail.finance.title')" name="finance" lazy>
                    <TransactionFinanceDetail
                        :active="activeTab === 'finance'"
                        :detail="detail"
                        :focus-transaction-id="focusTransactionId"
                        :display-time-zone="displayTimeZone"
                    />
                </el-tab-pane>

                <el-tab-pane :label="t('transaction.detail.timeline')" name="timeline">
                    <TransactionFlowTimeline
                        :detail="detail"
                        :focus-transaction-id="focusTransactionId"
                        :display-time-zone="displayTimeZone"
                        :type-options="typeOptions"
                        :status-options="statusOptions"
                    />
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
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { CircleCheckFilled, CircleCloseFilled, Loading, VideoPause } from '@element-plus/icons-vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import type { TransactionContactInfo, TransactionDetail, TransactionOperation, TransactionOrder, TransactionPayerInfo } from '@/api/transaction';
import { formatDateTimeFromSourceTimeZone } from '@/utils/format';
import { DEFAULT_TRANSACTION_QUERY_TIME_ZONE, cardDisplayText, fallbackTransactionStatusOptions, fallbackTransactionTypeOptions, loadTransactionDictOptions, moneyText, optionText, rateText, statusTagType, transactionPaymentLogoKeys, type TransactionDictOption } from '../shared';
import CopyableText from './CopyableText.vue';
import RecordList from './TransactionRecordList.vue';
import TransactionFinanceDetail from './TransactionFinanceDetail.vue';
import TransactionFlowTimeline from './TransactionFlowTimeline.vue';

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
const userStore = useUserStore();
const activeTab = ref('base');
const typeOptions = ref<TransactionDictOption[]>([]);
const statusOptions = ref<TransactionDictOption[]>([]);
const channelMatchStatusOptions = ref<TransactionDictOption[]>([]);
const canViewFinance = computed(() => [
    'clearing:record:detail',
    'reconciliation:record:detail',
    'settlement:result-item:transaction-detail',
    'settlement:reserve-item:transaction-detail',
].some((permission) => userStore.hasPermission(permission)));

const displayTimeZone = computed(() => props.displayTimeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);

const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
});

const amountChangeRows = computed(() => (props.detail?.amountChanges || []) as Record<string, unknown>[]);

const channelRecordRows = computed(() => mergeChannelRecords(
    (props.detail?.channelRequests || []) as Record<string, unknown>[],
    (props.detail?.channelInteractionLogs || []) as Record<string, unknown>[],
));

interface PartyInfoField {
    key: string;
    label: string;
    value: string;
    wide?: boolean;
}

interface PartyInfoSection {
    key: string;
    title: string;
    fields: PartyInfoField[];
}

const partyInfoSections = computed<PartyInfoSection[]>(() => {
    const sections: PartyInfoSection[] = [];
    if (props.detail?.billingCardHolderInfo) {
        appendPartyInfoSection(
            sections,
            'billingCardHolderInfo',
            t('transaction.detail.billingCardHolderInfo'),
            contactInfoFields(props.detail.billingCardHolderInfo),
        );
    }
    if (props.detail?.payerInfo) {
        appendPartyInfoSection(
            sections,
            'payerInfo',
            t('transaction.detail.payerInfo'),
            payerInfoFields(props.detail.payerInfo),
        );
    }
    if (props.detail?.shippingInfo) {
        appendPartyInfoSection(
            sections,
            'shippingInfo',
            t('transaction.detail.shippingInfo'),
            contactInfoFields(props.detail.shippingInfo),
        );
    }
    return sections;
});

function appendPartyInfoSection(sections: PartyInfoSection[], key: string, title: string, fields: PartyInfoField[]) {
    const populatedFields = fields.filter((field) => field.value);
    if (populatedFields.length) {
        sections.push({ key, title, fields: populatedFields });
    }
}

function contactInfoFields(info: TransactionContactInfo): PartyInfoField[] {
    return [
        partyInfoField('firstName', info.firstName),
        partyInfoField('lastName', info.lastName),
        partyInfoField('phone', info.phone),
        partyInfoField('email', info.email),
        partyInfoField('country', info.country),
        partyInfoField('state', info.state),
        partyInfoField('city', info.city),
        partyInfoField('postal', info.postal),
        partyInfoField('street', info.street),
    ];
}

function payerInfoFields(info: TransactionPayerInfo): PartyInfoField[] {
    return [
        partyInfoField('payerId', info.payerId),
        ...contactInfoFields(info),
        partyInfoField('ipAddress', info.ipAddress),
        partyInfoField('sessionId', info.sessionId),
        partyInfoField('browserInfo', info.browserInfo, true),
        partyInfoField('userAgent', info.userAgent, true),
    ];
}

function partyInfoField(key: string, value: unknown, wide = false): PartyInfoField {
    return {
        key,
        label: t(`transaction.detail.partyFields.${key}`),
        value: partyInfoValue(value),
        wide,
    };
}

function partyInfoValue(value: unknown): string {
    if (value === undefined || value === null || value === '') {
        return '';
    }
    if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
    }
    return String(value);
}

const focusedOperation = computed(() => {
    const operations = props.detail?.operations || [];
    if (props.focusTransactionId) {
        return operations.find((item) => item.transactionId === props.focusTransactionId);
    }
    return undefined;
});

const capabilityRecord = computed(() => focusedOperation.value || props.detail?.order);

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
watch(locale, loadDictionaries);

async function loadDictionaries() {
    typeOptions.value = fallbackTransactionTypeOptions(t);
    statusOptions.value = fallbackTransactionStatusOptions(t);
    channelMatchStatusOptions.value = fallbackChannelMatchStatusOptions();
    try {
        const [types, statuses, channelMatches] = await Promise.all([
            loadTransactionDictOptions('transaction_type', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('transaction_status', String(locale.value || 'zh-CN')),
            loadTransactionDictOptions('channel_match_status', String(locale.value || 'zh-CN')).catch(() => []),
        ]);
        typeOptions.value = types.length ? types : typeOptions.value;
        statusOptions.value = statuses.length ? statuses : statusOptions.value;
        channelMatchStatusOptions.value = channelMatches.length ? channelMatches : channelMatchStatusOptions.value;
    } catch (error) {
        console.warn('[admin-system] Failed to load transaction dictionaries, fallback options are used.', error);
    }
}

function fallbackChannelMatchStatusOptions(): TransactionDictOption[] {
    return ['NOT_REQUIRED', 'PENDING', 'MATCHED', 'MISMATCHED', 'FAILED']
        .map((value) => ({ label: t(`transaction.statusOption.${value}`, value), value }));
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

function amountMoneyText(row: Record<string, unknown>, key: string) {
    const currency = String(row.amountCurrency || props.detail?.order?.transactionCurrency || '');
    const exponent = props.detail?.order?.currencyExponent;
    return moneyText(amountValue(row[key]), currency, exponent);
}

function amountHasChanged(row: Record<string, unknown>, beforeKey: string, afterKey: string) {
    return String(row[beforeKey] ?? '') !== String(row[afterKey] ?? '');
}

function amountMetrics(row: Record<string, unknown>) {
    const metric = (label: string, field: string) => ({ label: `transaction.fields.${label}`, before: `${field}Before`, after: `${field}After` });
    switch (String(row.changeType || '')) {
        case 'PAYMENT':
            return [metric('authorizedAmount', 'authorized'), metric('capturedAmount', 'captured'), metric('availableRefundAmount', 'availableRefund')];
        case 'AUTHORIZATION':
        case 'PRE_AUTHORIZATION':
        case 'INCREMENTAL_AUTHORIZATION':
        case 'VOID':
            return [metric('authorizedAmount', 'authorized'), metric('availableCaptureAmount', 'availableCapture')];
        case 'CAPTURE':
        case 'PRE_AUTH_COMPLETION':
            return [metric('capturedAmount', 'captured'), metric('availableCaptureAmount', 'availableCapture'), metric('availableRefundAmount', 'availableRefund')];
        case 'REFUND':
            return [metric('capturedAmount', 'captured'), metric('refundedAmount', 'refunded'), metric('availableRefundAmount', 'availableRefund')];
        default:
            return [metric('authorizedAmount', 'authorized'), metric('capturedAmount', 'captured'), metric('refundedAmount', 'refunded')];
    }
}

function amountEventNote(row: Record<string, unknown>) {
    if (row.changeType === 'PAYMENT') return t('transaction.detail.amountChange.paymentCombined');
    if (row.changeType === 'REFUND') return t('transaction.detail.amountChange.refundBalance');
    return '';
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
        requestStartTime: firstPresent(merged.requestStartTime, requestLog?.requestStartTime, requestLog?.requestTime, requestLog?.interactionTime),
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

</script>

<style scoped>
.transaction-capability-tag {
    --capability-color: #64748b;
    --capability-border: #cbd5e1;
    --capability-background: #f8fafc;
    gap: 6px;
    min-width: 66px;
    height: 24px;
    border-color: var(--capability-border) !important;
    border-radius: 3px;
    background: var(--capability-background) !important;
    color: var(--capability-color) !important;
    font-weight: 700;
    letter-spacing: 0;
}

.transaction-capability-tag::before {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: currentColor;
    content: '';
    opacity: 0.55;
}

.transaction-capability-tag--three-ds { --capability-color: #397a73; --capability-border: #b4d7d1; --capability-background: #f3faf8; }
.transaction-capability-tag--dcc { --capability-color: #5270a6; --capability-border: #c5d3ea; --capability-background: #f5f8fd; }
.transaction-capability-tag--edc { --capability-color: #92703b; --capability-border: #dfcfac; --capability-background: #fcfaf4; }
.transaction-capability-tag--three-ds.is-enabled { --capability-color: #0f766e; --capability-border: #5eead4; --capability-background: #ecfdf5; }
.transaction-capability-tag--dcc.is-enabled { --capability-color: #1d4ed8; --capability-border: #93c5fd; --capability-background: #eff6ff; }
.transaction-capability-tag--edc.is-enabled { --capability-color: #b45309; --capability-border: #fcd34d; --capability-background: #fffbeb; }

.transaction-capability-tag.is-enabled::before {
    opacity: 1;
    box-shadow: 0 0 0 2px color-mix(in srgb, currentColor 18%, transparent);
}

.transaction-detail {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.transaction-detail__hero {
    display: grid;
    align-items: center;
    grid-template-columns: repeat(3, minmax(0, 1fr));
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

.transaction-detail__party-sections {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
    gap: 14px;
}

.transaction-detail__party-section {
    overflow: hidden;
    min-width: 0;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-bg-color);
}

.transaction-detail__party-section h3 {
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 10px 14px;
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
}

.transaction-detail__party-grid {
    margin: 0;
}

.transaction-detail__party-field {
    display: grid;
    grid-template-columns: 104px minmax(0, 1fr);
    align-items: center;
    gap: 10px;
    min-width: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding: 8px 12px;
    transition: background-color 0.16s ease;
}

.transaction-detail__party-field:last-child {
    border-bottom: 0;
}

.transaction-detail__party-field.is-wide {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 3px;
}

.transaction-detail__party-field:hover {
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__party-field dt,
.transaction-detail__party-field dd {
    min-width: 0;
    margin: 0;
    line-height: 22px;
}

.transaction-detail__party-field dt {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__party-field dd {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 500;
    line-height: 20px;
}

.transaction-detail__party-field :deep(.copyable-text) {
    width: 100%;
    justify-content: flex-start;
    color: var(--el-text-color-primary);
    text-align: left;
}

.transaction-detail__party-field :deep(.copyable-text .el-icon) {
    opacity: 0;
    color: var(--el-text-color-secondary);
    transition: color 0.16s ease, opacity 0.16s ease;
}

.transaction-detail__party-field:hover :deep(.copyable-text .el-icon),
.transaction-detail__party-field:focus-within :deep(.copyable-text .el-icon) {
    opacity: 1;
}

.transaction-detail__party-field :deep(.copyable-text:hover .el-icon),
.transaction-detail__party-field :deep(.copyable-text:focus-visible .el-icon) {
    color: var(--el-color-primary);
}

.transaction-detail__party-field.is-wide :deep(.copyable-text.is-wrap span) {
    white-space: pre-wrap;
    word-break: break-word;
}

.transaction-detail__timezone {
    margin-left: 8px;
    color: var(--el-text-color-secondary);
}

.transaction-detail__amount-timeline {
    padding: 16px 4px 0 8px;
}

.transaction-detail__amount-timeline :deep(.el-timeline-item__wrapper) {
    padding-left: 20px;
}

.transaction-detail__amount-event {
    padding: 0 0 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.transaction-detail__amount-event-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 14px;
}

.transaction-detail__amount-event-head time,
.transaction-detail__amount-event-value > span,
.transaction-detail__amount-metric-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

.transaction-detail__amount-event-head h3 {
    margin: 3px 0 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
}

.transaction-detail__amount-event-value {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    flex-shrink: 0;
}

.transaction-detail__amount-event-value strong {
    color: var(--el-text-color-primary);
    font-size: 17px;
    line-height: 24px;
    font-variant-numeric: tabular-nums;
}

.transaction-detail__amount-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-top: 1px solid var(--el-border-color-lighter);
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
}

.transaction-detail__amount-metrics.is-pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
}

.transaction-detail__amount-metric {
    min-width: 0;
    padding: 10px 14px;
}

.transaction-detail__amount-metric + .transaction-detail__amount-metric {
    border-left: 1px solid var(--el-border-color-lighter);
}

.transaction-detail__amount-metric-values {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 20px;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
}

.transaction-detail__amount-metric-values strong {
    color: var(--el-text-color-primary);
    font-weight: 700;
}

.transaction-detail__amount-event-note {
    margin: 9px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
}

@media (max-width: 980px) {
    .transaction-detail__hero {
        align-items: flex-start;
        grid-template-columns: 1fr;
    }

    .transaction-detail__hero-meta {
        justify-content: flex-start;
    }

    .transaction-detail__identity-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-detail__amount-metrics {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .transaction-detail__amount-metric:nth-child(3) {
        border-left: 0;
        border-top: 1px solid var(--el-border-color-lighter);
    }

    .transaction-detail__party-sections {
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

    .transaction-detail__amount-metrics,
    .transaction-detail__amount-metrics.is-pair {
        grid-template-columns: 1fr;
    }

    .transaction-detail__amount-metric + .transaction-detail__amount-metric,
    .transaction-detail__amount-metric:nth-child(3) {
        border-left: 0;
        border-top: 1px solid var(--el-border-color-lighter);
    }

    .transaction-detail__amount-event-head {
        flex-wrap: wrap;
        gap: 8px;
    }

    .transaction-detail__amount-event-value {
        align-items: flex-start;
    }

    .transaction-detail__party-grid {
        display: block;
    }

    .transaction-detail__party-sections {
        grid-template-columns: 1fr;
    }

    .transaction-detail__party-field {
        grid-template-columns: 96px minmax(0, 1fr);
    }

    .transaction-detail__party-field.is-wide {
        grid-template-columns: 1fr;
    }
}

@media (hover: none) {
    .transaction-detail__party-field :deep(.copyable-text .el-icon) {
        opacity: 0.65;
    }
}
</style>
