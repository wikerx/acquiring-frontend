import type { MonitorTimeRangeValue, MonitorUnit } from './monitorTypes';

/** 系统监控图表轴、提示框和后端时间的统一格式化工具。 */
const BACKEND_LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/;
const ASIA_SHANGHAI_OFFSET = '+08:00';

/** 将接口可空数值安全转换为有限 number。 */
export function monitorNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

/** 按单位生成紧凑坐标轴文本。 */
export function formatMonitorAxisValue(value: number, unit: MonitorUnit, locale?: string): string {
    if (!Number.isFinite(value)) return '-';
    if (unit === 'percent') return `${Number(value.toFixed(1))}%`;
    if (unit === 'milliseconds') return value >= 1000 ? `${Number((value / 1000).toFixed(1))}s` : `${Math.round(value)}ms`;
    if (unit === 'bytes') return formatBytes(value, 1);
    if (unit === 'rate') return `${formatCompact(value, locale)}/s`;
    return formatCompact(value, locale);
}

/** 按单位生成保留业务精度的提示框数值。 */
export function formatMonitorTooltipValue(value: number | null, unit: MonitorUnit, locale?: string): string {
    if (value === null || !Number.isFinite(value)) return '-';
    if (unit === 'percent') return `${value.toFixed(2)}%`;
    if (unit === 'milliseconds') return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
    if (unit === 'bytes') return formatBytes(value, 2);
    const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
    return unit === 'rate' ? `${formatted}/s` : formatted;
}

/** 根据时间范围跨度生成小时分钟或月日坐标标签。 */
export function formatMonitorTimeLabel(value: string, range?: MonitorTimeRangeValue, locale?: string): string {
    const date = parseMonitorDateTime(value);
    if (!date) return value;
    const dayRange = range?.preset === '7d' || range?.preset === 'custom';
    return new Intl.DateTimeFormat(locale, dayRange
        ? { month: '2-digit', day: '2-digit', timeZone: range?.timezone }
        : { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: range?.timezone })
        .format(date);
}

/** 生成包含日期和秒的图表提示框时间。 */
export function formatMonitorTooltipTime(value: string, range?: MonitorTimeRangeValue, locale?: string): string {
    const date = parseMonitorDateTime(value);
    if (!date) return value;
    return new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: range?.timezone,
    }).format(date);
}

/** 将后端无时区 LocalDateTime 按 Asia/Shanghai 解释，兼容带时区的标准时间文本。 */
export function parseMonitorDateTime(value: string): Date | null {
    const text = String(value || '').trim();
    if (!text) return null;
    const local = BACKEND_LOCAL_DATE_TIME.exec(text);
    if (local) {
        const milliseconds = (local[7] || '').padEnd(3, '0').slice(0, 3);
        const normalized = `${local[1]}-${local[2]}-${local[3]}T${local[4]}:${local[5]}:${local[6]}.${milliseconds}${ASIA_SHANGHAI_OFFSET}`;
        const date = new Date(normalized);
        return Number.isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** 转义进入 ECharts HTML tooltip 的动态文本，阻止监控内容注入标签。 */
export function escapeMonitorHtml(value: unknown): string {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function formatCompact(value: number, locale?: string): string {
    return new Intl.NumberFormat(locale, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(value);
}

function formatBytes(value: number, maximumFractionDigits: number): string {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
    let current = Math.max(0, value);
    let index = 0;
    while (current >= 1024 && index < units.length - 1) {
        current /= 1024;
        index += 1;
    }
    return `${current.toFixed(index === 0 ? 0 : maximumFractionDigits)} ${units[index]}`;
}
