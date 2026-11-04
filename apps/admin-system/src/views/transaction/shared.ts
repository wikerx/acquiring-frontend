import type { Ref } from 'vue';
import { ElMessage } from 'element-plus';
import { formatDecimalAmount, roundDecimalAmount, type PaymentLogoKey } from '@acquiring/shared';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import type { TransactionDetail } from '@/api/transaction';
import { searchDictData, type SysDictData } from '@/api/system/dict';
import { formatDateTimeInTimeZone } from '@/utils/format';
import { cardLogoKeys, paymentLogoKeys, type SelectOption } from '@/views/channel/shared';

export const DEFAULT_TRANSACTION_QUERY_TIME_ZONE = 'Asia/Shanghai';

const DEFAULT_TRANSACTION_TIMEZONE_OPTIONS: SelectOption[] = [
    { label: 'UTC+8 Asia/Shanghai', value: DEFAULT_TRANSACTION_QUERY_TIME_ZONE },
    { label: 'UTC', value: 'UTC' },
];

export interface TransactionDictOption {
    label: string;
    value: string;
    listClass?: string;
}

type TransactionOptionTranslator = (key: string, fallback?: string) => string;
type TransactionStatusScope = 'channelMatch' | 'reconciliation' | 'settlement' | 'merchantNotification';

const TRANSACTION_TYPE_VALUES = [
    'PAYMENT',
    'AUTHORIZATION',
    'PRE_AUTHORIZATION',
    'PRE_AUTH_COMPLETION',
    'INCREMENTAL_AUTHORIZATION',
    'CAPTURE',
    'REFUND',
    'VOID',
    'QUERY',
    'REVERSAL',
    'CHARGEBACK',
    'REPRESENTMENT',
    'RETRIEVAL_REQUEST',
];

const TRANSACTION_STATUS_OPTIONS = [
    { value: 'SUCCESS', listClass: 'success' },
    { value: 'FAILED', listClass: 'danger' },
    { value: 'PENDING', listClass: 'warning' },
    { value: 'PROCESSING', listClass: 'primary' },
    { value: 'AUTHORIZED', listClass: 'success' },
    { value: 'CANCELLED', listClass: 'info' },
    { value: 'DECLINED', listClass: 'danger' },
    { value: 'UNKNOWN', listClass: 'info' },
];

const PAYMENT_METHOD_VALUES = [
    'BANK_CARD',
    'PAYPAL',
    'APPLE_PAY',
    'GOOGLE_PAY',
    'ALIPAY_PLUS',
    'CASH_APP_PAY',
    'ACH_DEBIT',
    'BANK_TRANSFER',
    'PIX',
    'SPEI',
];

const CARD_BRAND_OPTIONS: TransactionDictOption[] = [
    { label: 'Visa', value: 'VISA' },
    { label: 'Mastercard', value: 'MASTERCARD' },
    { label: 'American Express', value: 'AMEX' },
    { label: 'American Express', value: 'AMERICAN_EXPRESS' },
    { label: 'JCB', value: 'JCB' },
    { label: 'UnionPay', value: 'UNIONPAY' },
    { label: 'Discover', value: 'DISCOVER' },
    { label: 'Diners Club', value: 'DINERS_CLUB' },
    { label: 'Maestro', value: 'MAESTRO' },
];

const STATUS_VALUES_BY_SCOPE: Record<TransactionStatusScope, string[]> = {
    channelMatch: ['NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'MATCHED', 'MISMATCHED', 'FAILED'],
    reconciliation: ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED'],
    settlement: ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED'],
    merchantNotification: ['INIT', 'PROCESSING', 'SUCCESS', 'FAILED', 'CLOSED'],
};

const CHANNEL_MATCH_STATUS_LABELS: Record<string, Record<string, string>> = {
    'zh-CN': {
        PENDING: '未勾兑',
        MATCHED: '成功',
        FAILED: '失败',
    },
};

export function moneyText(amount?: number | string | null, currency?: string, currencyExponent?: number | null) {
    if (amount === undefined || amount === null) {
        return '-';
    }
    const digits = typeof currencyExponent === 'number' && currencyExponent >= 0
        ? Math.min(currencyExponent, 8)
        : Math.max(2, Math.min(resolveDecimalLength(String(amount)), 8));
    const rounded = roundDecimalAmount(amount, digits);
    return `${currency || ''} ${formatDecimalAmount(rounded, undefined, digits, digits)}`.trim();
}

export function rateText(rate?: number | string | null) {
    if (rate === undefined || rate === null || rate === '') {
        return '1.00000000';
    }
    return roundDecimalAmount(rate, 8);
}

export function tagText(options: TransactionDictOption[], value?: string) {
    if (!value) {
        return '-';
    }
    return options.find((item) => item.value === value)?.label || value;
}

export function statusTagType(value?: string, options: TransactionDictOption[] = []) {
    const dictClass = options.find((item) => item.value === value)?.listClass;
    if (dictClass && ['success', 'warning', 'info', 'primary', 'danger'].includes(dictClass)) {
        return dictClass;
    }
    if (value === 'SUCCESS') {
        return 'success';
    }
    if (value === 'FAILED') {
        return 'danger';
    }
    if (value === 'PROCESSING' || value === 'PENDING') {
        return 'warning';
    }
    return 'info';
}

export function splitDateRange(range: string[]) {
    return {
        beginTime: range?.[0] || undefined,
        endTime: range?.[1] || undefined,
    };
}

export function defaultTransactionTodayRange(timeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
    const zonedNow = resolveZonedNow(timeZone);
    return [`${zonedNow.date}T00:00:00`, `${zonedNow.date}T${zonedNow.time}`];
}

/** 返回指定系统时区当天的完整闭区间，适用于按自然日查询的业务时间条件。 */
export function defaultTodayFullDayRange(timeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
    const zonedNow = resolveZonedNow(timeZone);
    return [`${zonedNow.date}T00:00:00`, `${zonedNow.date}T23:59:59`];
}

/**
 * 快捷时间范围的结束时刻必须随每次查询滚动到当前时间；自定义范围由调用方原样保留。
 */
export function resolveTransactionQueryRange(range: string[], preset: string, timeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
    return preset ? resolveTransactionPresetRange(preset, timeZone) : range;
}

export function resolveTransactionPresetRange(preset: string, timeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
    const zonedNow = resolveZonedNow(timeZone);
    const end = `${zonedNow.date}T${zonedNow.time}`;
    if (preset === 'week') {
        return [`${startOfWeek(zonedNow.date)}T00:00:00`, end];
    }
    if (preset === 'month') {
        return [`${zonedNow.date.slice(0, 8)}01T00:00:00`, end];
    }
    return [`${zonedNow.date}T00:00:00`, end];
}

export function merchantOptionLabel(item: MerchantInfo) {
    return item.merchantName ? `${item.merchantId} / ${item.merchantName}` : item.merchantId;
}

export async function searchMerchantOptions(keyword = '') {
    const result = await searchMerchants({
        pageNo: 1,
        pageSize: 50,
        keyword: keyword || undefined,
    });
    return result.records || [];
}

export async function loadTransactionDictOptions(dictType: string, locale: string): Promise<TransactionDictOption[]> {
    const result = await searchDictData({
        pageNo: 1,
        pageSize: 500,
        dictType,
        locale,
        status: 1,
    });
    return result.records.map((item: SysDictData) => ({
        label: item.dictLabel,
        value: item.dictValue,
        listClass: item.listClass,
    })).map((option) => normalizeTransactionDictOption(dictType, locale, option));
}

/**
 * 远端字典决定展示顺序和配置文案，本地国际化补齐缺失项，避免字典缺失时泄漏内部枚举值。
 */
export function mergeTransactionDictOptions<T extends TransactionDictOption>(
    remoteOptions: T[],
    fallbackOptions: T[],
): T[] {
    const fallbackByValue = new Map(fallbackOptions.map((item) => [item.value, item]));
    const seen = new Set<string>();
    const merged: T[] = [];
    remoteOptions.forEach((item) => {
        if (!item.value || seen.has(item.value)) {
            return;
        }
        const fallback = fallbackByValue.get(item.value);
        const option = { ...fallback, ...item } as T;
        if (!item.label?.trim() && fallback) {
            option.label = fallback.label;
        }
        seen.add(item.value);
        merged.push(option);
    });
    fallbackOptions.forEach((item) => {
        if (!seen.has(item.value)) {
            seen.add(item.value);
            merged.push(item);
        }
    });
    return merged;
}

export function fallbackTransactionTypeOptions(t: TransactionOptionTranslator): TransactionDictOption[] {
    return TRANSACTION_TYPE_VALUES.map((value) => ({
        label: t(`transaction.type.${value}`, value),
        value,
    }));
}

export function fallbackTransactionStatusOptions(t: TransactionOptionTranslator): TransactionDictOption[] {
    return TRANSACTION_STATUS_OPTIONS.map((item) => ({
        ...item,
        label: t(`transaction.status.${item.value}`, item.value),
    }));
}

export function fallbackPaymentMethodOptions(t: TransactionOptionTranslator): TransactionDictOption[] {
    return PAYMENT_METHOD_VALUES.map((value) => ({
        label: t(`transaction.paymentMethod.${value}`, value),
        value,
    }));
}

export function fallbackCardBrandOptions(): TransactionDictOption[] {
    return CARD_BRAND_OPTIONS.map((item) => ({ ...item }));
}

export function fallbackTransactionStatusScopeOptions(
    t: TransactionOptionTranslator,
    scope: TransactionStatusScope,
): TransactionDictOption[] {
    return STATUS_VALUES_BY_SCOPE[scope].map((value) => ({
        label: t(`transaction.statusOption.${value}`, value),
        value,
    }));
}

function normalizeTransactionDictOption(dictType: string, locale: string, option: TransactionDictOption): TransactionDictOption {
    if (dictType !== 'channel_match_status') {
        return option;
    }
    const labels = CHANNEL_MATCH_STATUS_LABELS[locale] || CHANNEL_MATCH_STATUS_LABELS[locale.split('-')[0]];
    const label = labels?.[option.value];
    return label ? { ...option, label } : option;
}

export function optionText(options: TransactionDictOption[], value?: string) {
    if (!value) {
        return '-';
    }
    return options.find((item) => item.value === value)?.label || value;
}

export function transactionPaymentLogoKeys(paymentMethod?: string, paymentBrand?: string): PaymentLogoKey[] {
    if (paymentMethod === 'BANK_CARD') {
        return cardLogoKeys(paymentBrand);
    }
    return paymentLogoKeys(paymentMethod);
}

export function ensureTransactionTimezoneOptions(options: SelectOption[]) {
    const merged = [...DEFAULT_TRANSACTION_TIMEZONE_OPTIONS, ...(options || [])];
    const seen = new Set<string>();
    return merged.filter((item) => {
        if (!item.value || seen.has(item.value)) {
            return false;
        }
        seen.add(item.value);
        return true;
    });
}

export function responseTooltip(code?: string, message?: string) {
    if (!code && !message) {
        return '-';
    }
    if (code && message) {
        return `${code}:${message}`;
    }
    return code || message || '-';
}

export function accessTypeText(t: (key: string, fallback?: string) => string, value?: string) {
    if (!value) {
        return '-';
    }
    return t(`transaction.accessType.${value}`, value);
}

export function cardDisplayText(cardNumberMasked?: string, cardBin?: string) {
    if (cardNumberMasked) {
        return normalizeMaskedCard(cardNumberMasked);
    }
    if (!cardBin) {
        return '-';
    }
    if (cardBin.length >= 10) {
        return `${cardBin.slice(0, 6)}****${cardBin.slice(-4)}`;
    }
    return cardBin.length >= 6 ? `${cardBin.slice(0, 6)}****` : cardBin;
}

export function statusOptionTagType(value?: string) {
    if (['MATCHED', 'RECONCILED', 'SETTLED', 'NOT_REQUIRED', 'SUCCESS'].includes(value || '')) {
        return 'success';
    }
    if (['PENDING', 'INIT', 'SETTLING', 'NOT_RECONCILED', 'NOT_SETTLED'].includes(value || '')) {
        return 'warning';
    }
    if (value === 'PROCESSING') {
        return 'primary';
    }
    if (['MISMATCHED', 'FAILED'].includes(value || '')) {
        return 'danger';
    }
    return 'info';
}

export async function openTransactionDetail(
    transactionId: string,
    transactionDateTime: string,
    rootTransactionDateTime: string,
    loading: Ref<boolean>,
    detailVisible: Ref<boolean>,
    detail: Ref<TransactionDetail | null>,
    loader: (
        transactionId: string,
        transactionDateTime: string,
        rootTransactionDateTime: string,
    ) => Promise<TransactionDetail>,
    failMessage: string,
) {
    if (!transactionId || !transactionDateTime || !rootTransactionDateTime) {
        return;
    }
    loading.value = true;
    detailVisible.value = true;
    detail.value = null;
    try {
        detail.value = await loader(transactionId, transactionDateTime, rootTransactionDateTime);
    } catch (error) {
        console.error('[admin-system] transaction dictionary request failed', error instanceof Error ? error.name : 'UnknownError');
        ElMessage.error(failMessage);
    } finally {
        loading.value = false;
    }
}

function resolveDecimalLength(value: string) {
    const decimal = value.split('.')[1];
    return decimal ? decimal.replace(/0+$/, '').length : 0;
}

function normalizeMaskedCard(value: string) {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 10) {
        return `${digits.slice(0, 6)}****${digits.slice(-4)}`;
    }
    return value.replace(/\*{5,}/g, '****');
}

function resolveZonedNow(timeZone: string) {
    const text = formatDateTimeInTimeZone(new Date(), timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    const [date, time] = text.split(' ');
    return { date, time };
}

function startOfWeek(dateText: string) {
    const [year, month, day] = dateText.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(value: number) {
    return String(value).padStart(2, '0');
}
