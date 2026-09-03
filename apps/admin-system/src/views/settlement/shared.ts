/** 结算页面纯展示辅助：格式化后端冻结事实和枚举，不承担金额、币种、汇率或状态机计算。 */
import type { TagProps } from 'element-plus';

const SETTLEMENT_FORMULA_I18N_KEYS: Record<string, string> = {
    'principal converted once with the immutable batch rate':
        'transaction.settlement.formulaDescription.principalImmutableRate',
    'clearing fee component converted for audit; excluded from financial summary':
        'transaction.settlement.formulaDescription.feeComponentAuditOnly',
    'fee group = percentage(label currency) + fixed(USD), then apply USD min/max with batch rates':
        'transaction.settlement.formulaDescription.pendingFeeGroup',
    'fee group final preserves clearing-final components and converts their signed net with batch rates':
        'transaction.settlement.formulaDescription.finalizedFeeGroup',
    'reserve clearing fact converted only at settlement with the immutable batch rate':
        'transaction.settlement.formulaDescription.reserveImmutableRate',
    'signed sum of FINANCIAL_COMPONENT target amounts in the locked batch currency':
        'transaction.settlement.formulaDescription.netSignedSum',
    'exact opposite of original immutable NET_SETTLEMENT result; no new FX rate':
        'transaction.settlement.formulaDescription.reversalOpposite',
};

export function decimalText(value?: number | string | null) {
    if (value === undefined || value === null || value === '') return '-';
    const text = String(value);
    const match = /^([+-]?)(\d+)(\.\d+)?$/.exec(text);
    return match ? `${match[1]}${match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${match[3] || ''}` : text;
}

export function moneyText(value?: number | string | null, currency?: string) {
    return value === undefined || value === null || value === ''
        ? '-' : `${currency || ''} ${decimalText(value)}`.trim();
}

/** 按 ISO exponent 格式化数据库权威金额；若存在超出 exponent 的非零尾数则保留原精度。 */
export function moneyTextByExponent(
    value?: number | string | null,
    currency?: string,
    exponent?: number | null,
) {
    if (value === undefined || value === null || value === '') return '-';
    const text = String(value);
    const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
    if (!match || exponent === undefined || exponent === null || exponent < 0 || exponent > 8) {
        return moneyText(value, currency);
    }
    const fraction = match[3] || '';
    const extra = fraction.slice(exponent);
    if (/[1-9]/.test(extra)) return moneyText(value, currency);
    const integer = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const normalizedFraction = fraction.slice(0, exponent).padEnd(exponent, '0');
    const amount = `${match[1]}${integer}${exponent ? `.${normalizedFraction}` : ''}`;
    return `${currency || ''} ${amount}`.trim();
}

export function defaultDateRange(days = 29): [string, string] {
    const end = new Date();
    const begin = new Date(end);
    begin.setDate(begin.getDate() - days);
    return [dateText(begin), dateText(end)];
}

export function defaultDateTimeRange(days = 29): [string, string] {
    const end = new Date();
    const begin = new Date(end);
    begin.setDate(begin.getDate() - days);
    begin.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 0);
    return [dateTimeText(begin), dateTimeText(end)];
}

export function requestKey(prefix: string) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
}

/** 将结算域固定审计公式转成运营可读文案；未知公式保留原文，避免丢失审计证据。 */
export function settlementFormulaText(
    value: string | null | undefined,
    translate: (key: string) => string,
) {
    if (!value) return '-';
    const key = SETTLEMENT_FORMULA_I18N_KEYS[value];
    return key ? translate(key) : value;
}

/** 从 SO/SB 等系统业务单号的 yyyyMMdd 段还原业务日期，供关联跳转同步日期筛选。 */
export function businessDateFromBusinessNo(value?: string | null) {
    const match = /^[A-Z]{2}(\d{4})(\d{2})(\d{2})-/.exec(value || '');
    if (!match) return undefined;
    const date = `${match[1]}-${match[2]}-${match[3]}`;
    const parsed = new Date(`${date}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date ? date : undefined;
}

export function statusTagType(value?: string): TagProps['type'] {
    if (['POSTED', 'APPROVED', 'CONSUMED'].includes(value || '')) return 'success';
    if (['REJECTED', 'FAILED_RETRYABLE', 'MANUAL_REVIEW'].includes(value || '')) return 'danger';
    if (['CANCELLED', 'EXPIRED', 'REVERSED', 'SUPERSEDED'].includes(value || '')) return 'info';
    if (['PENDING_APPROVAL', 'READY', 'REVIEW_LOCKED'].includes(value || '')) return 'warning';
    return 'primary';
}

function dateText(value: Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function dateTimeText(value: Date) {
    const hours = String(value.getHours()).padStart(2, '0');
    const minutes = String(value.getMinutes()).padStart(2, '0');
    const seconds = String(value.getSeconds()).padStart(2, '0');
    return `${dateText(value)}T${hours}:${minutes}:${seconds}`;
}
