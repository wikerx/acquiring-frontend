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
