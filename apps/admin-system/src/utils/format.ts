import { formatDecimalAmount, normalizeDecimalAmount, roundDecimalAmount } from '@acquiring/shared';

const CURRENCY_NUMBER_PARTS = new Set<Intl.NumberFormatPartTypes>([
    'integer', 'group', 'decimal', 'fraction',
]);

/**
 * 返回币种标准小数位；未知币种回退为 2 位，供金额展示使用。
 */
export function currencyFractionDigits(currency = 'USD', locale = 'zh-CN') {
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: String(currency || 'USD').toUpperCase(),
        }).resolvedOptions().maximumFractionDigits;
    } catch {
        return 2;
    }
}

/**
 * 使用十进制字符串完成货币格式化，仅借助 Intl 获取符号和排版，不让金额经过浮点数。
 */
export function formatAmount(
    value: number | string | null | undefined,
    currency = 'USD',
    locale = 'zh-CN',
    fractionDigits = currencyFractionDigits(currency, locale),
) {
    const normalized = normalizeDecimalAmount(value ?? '0');
    if (normalized === null) return '-';
    const normalizedCurrency = String(currency || 'USD').toUpperCase();
    const rounded = roundDecimalAmount(normalized, fractionDigits);
    const negative = rounded.startsWith('-');
    const unsignedAmount = negative ? rounded.slice(1) : rounded;
    const exactAmount = formatDecimalAmount(
        unsignedAmount,
        locale,
        fractionDigits,
        fractionDigits,
    );
    try {
        const formatter = new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: normalizedCurrency,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        });
        let amountWritten = false;
        return formatter.formatToParts(negative ? -1 : 1).map((part) => {
            if (!CURRENCY_NUMBER_PARTS.has(part.type)) return part.value;
            if (part.type === 'integer' && !amountWritten) {
                amountWritten = true;
                return exactAmount;
            }
            return '';
        }).join('');
    } catch {
        return `${normalizedCurrency} ${negative ? '-' : ''}${exactAmount}`;
    }
}

export function formatDateTime(value: string | number | Date | null | undefined) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateTimeInTimeZone(value: string | number | Date | null | undefined, timeZone?: string) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    if (!timeZone) return formatDateTime(value);
    const fixedOffsetMinutes = parseFixedOffsetMinutes(timeZone);
    if (fixedOffsetMinutes !== null) {
        return formatInstantInFixedOffset(d, fixedOffsetMinutes);
    }
    try {
        const parts = new Intl.DateTimeFormat('zh-CN', {
            timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }).formatToParts(d);
        const valueOf = (type: string) => parts.find((item) => item.type === type)?.value || '00';
        return `${valueOf('year')}-${valueOf('month')}-${valueOf('day')} ${valueOf('hour')}:${valueOf('minute')}:${valueOf('second')}`;
    } catch {
        return formatDateTime(value);
    }
}

export function formatDateTimeFromSourceTimeZone(
    value: string | number | Date | null | undefined,
    sourceTimeZone?: string,
    displayTimeZone?: string,
) {
    if (!sourceTimeZone && !displayTimeZone) {
        return formatDateTime(value);
    }
    const targetTimeZone = displayTimeZone || sourceTimeZone;
    const instantValue = sourceTimeZone ? toSourceTimeZoneInstant(value, sourceTimeZone) : value;
    return formatDateTimeInTimeZone(instantValue, targetTimeZone);
}

export function toSourceTimeZoneInstant(value: string | number | Date | null | undefined, sourceTimeZone: string) {
    if (!value || value instanceof Date || typeof value === 'number') {
        return value;
    }
    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) {
        return normalized;
    }
    const sourceAsUtc = new Date(`${normalized}Z`);
    if (Number.isNaN(sourceAsUtc.getTime())) {
        return value;
    }
    const fixedOffsetMinutes = parseFixedOffsetMinutes(sourceTimeZone);
    if (fixedOffsetMinutes !== null) {
        return new Date(sourceAsUtc.getTime() - fixedOffsetMinutes * 60 * 1000);
    }
    const formattedAsSource = formatDateTimeInTimeZone(sourceAsUtc, sourceTimeZone).replace(' ', 'T');
    const sourceOffsetMillis = new Date(`${formattedAsSource}Z`).getTime() - sourceAsUtc.getTime();
    return new Date(sourceAsUtc.getTime() - sourceOffsetMillis);
}

function parseFixedOffsetMinutes(timeZone?: string): number | null {
    const normalized = String(timeZone || '').trim().toUpperCase();
    if (normalized === 'UTC' || normalized === 'GMT') {
        return 0;
    }
    const match = /^(?:UTC|GMT)([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(normalized);
    if (!match) {
        return null;
    }
    const hours = Number(match[2]);
    const minutes = Number(match[3] || '0');
    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 18 || minutes > 59) {
        return null;
    }
    const offset = hours * 60 + minutes;
    return match[1] === '-' ? -offset : offset;
}

function formatInstantInFixedOffset(value: Date, offsetMinutes: number) {
    const shifted = new Date(value.getTime() + offsetMinutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(shifted.getUTCDate())} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`;
}
