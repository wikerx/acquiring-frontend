import { systemApi, type DictDataItem } from '@/api/systemApi';
import type { PaymentLogoKey } from '@acquiring/shared';
import { formatDateTimeInTimeZone } from '@/utils/format';

export const DEFAULT_TRANSACTION_QUERY_TIME_ZONE = 'Asia/Shanghai';

export interface SelectOption {
    label: string;
    value: string;
}

export interface TransactionDictOption extends SelectOption {
    listClass?: string;
    extraJson?: string;
}

const DEFAULT_TIMEZONE_OPTIONS: SelectOption[] = [
    { label: 'UTC+8 Asia/Shanghai', value: DEFAULT_TRANSACTION_QUERY_TIME_ZONE },
    { label: 'UTC', value: 'UTC' },
];

const PAYMENT_LOGO_MAP: Record<string, PaymentLogoKey[]> = {
    BANK_CARD: ['bankCard'],
    PAYPAL: ['paypal'],
    APPLE_PAY: ['applePay'],
    GOOGLE_PAY: ['googlePay'],
    ALIPAY_PLUS: ['alipayPlus'],
    CASH_APP_PAY: ['cashAppPay'],
    ACH_DEBIT: ['achDebit'],
    BANK_TRANSFER: ['bankTransfer'],
    PIX: ['pix'],
    SPEI: ['spei'],
};

const CARD_LOGO_MAP: Record<string, PaymentLogoKey[]> = {
    VISA: ['visa'],
    MASTERCARD: ['mastercard'],
    JCB: ['jcb'],
    MAESTRO: ['maestro'],
    AMEX: ['americanExpress'],
    AMERICAN_EXPRESS: ['americanExpress'],
    DINERS_CLUB: ['dinersClub'],
    DISCOVER: ['discover'],
    UNIONPAY: ['unionPay'],
};

export async function loadTransactionDictOptions(dictType: string, locale: string): Promise<TransactionDictOption[]> {
    const result = await systemApi.searchDictData({
        pageNo: 1,
        pageSize: dictType === 'sys_timezone' ? 500 : 200,
        dictType,
        locale,
        status: 1,
    });
    return (result.records || []).map(toDictOption);
}

export function ensureTransactionTimezoneOptions(options: SelectOption[]) {
    const merged = [...DEFAULT_TIMEZONE_OPTIONS, ...(options || [])];
    const seen = new Set<string>();
    return merged.filter((item) => {
        if (!item.value || seen.has(item.value)) {
            return false;
        }
        seen.add(item.value);
        return true;
    });
}

export function fallbackTransactionTypeOptions(t: (key: string, fallback?: string) => string): TransactionDictOption[] {
    return [
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
    ].map((value) => ({ label: t(`transaction.type.${value}`, value), value }));
}

export function fallbackTransactionStatusOptions(t: (key: string, fallback?: string) => string): TransactionDictOption[] {
    return [
        { value: 'SUCCESS', listClass: 'success' },
        { value: 'FAILED', listClass: 'danger' },
        { value: 'PENDING', listClass: 'warning' },
        { value: 'PROCESSING', listClass: 'primary' },
    ].map((item) => ({ ...item, label: t(`transaction.status.${item.value}`, item.value) }));
}

export function fallbackPaymentMethodOptions(t: (key: string, fallback?: string) => string): TransactionDictOption[] {
    return ['BANK_CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'ALIPAY_PLUS'].map((value) => ({
        label: t(`transaction.paymentMethod.${value}`, value),
        value,
    }));
}

export function fallbackCardBrandOptions(): TransactionDictOption[] {
    return [
        { label: 'Visa', value: 'VISA' },
        { label: 'Mastercard', value: 'MASTERCARD' },
        { label: 'JCB', value: 'JCB' },
        { label: 'Maestro', value: 'MAESTRO' },
        { label: 'American Express', value: 'AMEX' },
        { label: 'Diners Club', value: 'DINERS_CLUB' },
        { label: 'Discover', value: 'DISCOVER' },
        { label: 'UnionPay', value: 'UNIONPAY' },
    ];
}

export function fallbackStatusOptions(t: (key: string, fallback?: string) => string, scope: string): TransactionDictOption[] {
    const values = scope === 'settlement'
        ? ['NOT_SETTLED', 'SETTLING', 'SETTLED', 'FAILED']
        : scope === 'reconciliation'
            ? ['NOT_RECONCILED', 'RECONCILED', 'MISMATCHED']
            : ['NOT_REQUIRED', 'PENDING', 'MATCHED', 'MISMATCHED', 'FAILED'];
    return values.map((value) => ({ label: t(`transaction.genericStatus.${value}`, value), value }));
}

export function tagText(options: TransactionDictOption[], value?: string) {
    if (!value) return '-';
    return options.find((item) => item.value === value)?.label || value;
}

export function statusTagType(value?: string, options: TransactionDictOption[] = []) {
    const dictClass = options.find((item) => item.value === value)?.listClass;
    if (dictClass && ['success', 'warning', 'info', 'primary', 'danger'].includes(dictClass)) {
        return dictClass;
    }
    if (['SUCCESS', 'MATCHED', 'RECONCILED', 'SETTLED', 'NOT_REQUIRED'].includes(value || '')) return 'success';
    if (['FAILED', 'MISMATCHED'].includes(value || '')) return 'danger';
    if (['PENDING', 'NOT_RECONCILED', 'NOT_SETTLED', 'SETTLING'].includes(value || '')) return 'warning';
    if (value === 'PROCESSING') return 'primary';
    return 'info';
}

export function parseLogoKeys(option?: TransactionDictOption): PaymentLogoKey[] {
    if (!option?.extraJson) {
        return [];
    }
    try {
        const payload = JSON.parse(option.extraJson) as { logoKeys?: PaymentLogoKey[]; logoKey?: PaymentLogoKey };
        if (Array.isArray(payload.logoKeys)) {
            return payload.logoKeys;
        }
        return payload.logoKey ? [payload.logoKey] : [];
    } catch {
        return [];
    }
}

export function cardBrandLogoKeys(value?: string, option?: TransactionDictOption): PaymentLogoKey[] {
    const parsed = parseLogoKeys(option);
    if (parsed.length) {
        return parsed;
    }
    return CARD_LOGO_MAP[(value || '').toUpperCase()] || [];
}

export function paymentMethodLogoKeys(value?: string, option?: TransactionDictOption): PaymentLogoKey[] {
    const parsed = parseLogoKeys(option);
    if (parsed.length) {
        return parsed;
    }
    return PAYMENT_LOGO_MAP[(value || '').toUpperCase()] || [];
}

export function transactionPaymentLogoKeys(
    paymentMethod?: string,
    paymentBrand?: string,
    paymentMethodOption?: TransactionDictOption,
    cardBrandOption?: TransactionDictOption,
): PaymentLogoKey[] {
    const methodLogos = paymentMethodLogoKeys(paymentMethod, paymentMethodOption);
    const brandLogos = cardBrandLogoKeys(paymentBrand, cardBrandOption);
    const logos = brandLogos.length ? brandLogos : methodLogos;
    return logos.filter((key, index, keys) => keys.indexOf(key) === index);
}

export function moneyText(amount?: number | string | null, currency?: string, currencyExponent?: number | null) {
    if (amount === undefined || amount === null || amount === '') return '-';
    const value = Number(amount);
    if (!Number.isFinite(value)) return `${currency || ''} ${amount}`.trim();
    const digits = typeof currencyExponent === 'number' && currencyExponent >= 0
        ? Math.min(currencyExponent, 8)
        : Math.min(resolveDecimalLength(String(amount)), 2);
    return `${currency || ''} ${value.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })}`.trim();
}

export function rateText(rate?: number | string | null) {
    if (rate === undefined || rate === null || rate === '') return '1.00000000';
    const value = Number(rate);
    return Number.isFinite(value) ? value.toFixed(8) : String(rate);
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

export function defaultTransactionMonthRange(timeZone = DEFAULT_TRANSACTION_QUERY_TIME_ZONE) {
    const zonedNow = resolveZonedNow(timeZone);
    return [`${zonedNow.date.slice(0, 8)}01T00:00:00`, `${zonedNow.date}T${zonedNow.time}`];
}

export function responseTooltip(code?: string, message?: string) {
    if (!code && !message) return '-';
    return [code, message].filter(Boolean).join(' / ');
}

function toDictOption(item: DictDataItem): TransactionDictOption {
    return {
        label: item.dictLabel,
        value: item.dictValue,
        listClass: item.listClass,
        extraJson: item.extraJson,
    };
}

function resolveDecimalLength(value: string) {
    const decimal = value.split('.')[1];
    return decimal ? decimal.replace(/0+$/, '').length : 0;
}

function resolveZonedNow(timeZone: string) {
    const text = formatDateTimeInTimeZone(new Date(), timeZone || DEFAULT_TRANSACTION_QUERY_TIME_ZONE);
    const [date, time] = text.split(' ');
    return { date, time };
}
