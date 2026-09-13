import type { VexraSystemKey } from './brand';
import { formatDecimalAmount } from './amount';

/** Keep voucher rates at a professional minimum scale without losing source precision. */
export function formatSettlementVoucherRate(
    value?: string | number | null,
    locale = 'zh-CN',
): string {
    if (value === undefined || value === null || value === '') return '-';
    return formatDecimalAmount(value, locale, 8, 16);
}

/** Format voucher money without mixing the currency code into the numeric value. */
export function formatSettlementVoucherAmount(
    value?: string | number | null,
    locale = 'zh-CN',
    exponent?: number | null,
): string {
    if (value === undefined || value === null || value === '') return '-';
    const digits = typeof exponent === 'number'
        ? Math.min(Math.max(exponent, 0), 8)
        : 2;
    return formatDecimalAmount(value, locale, digits, 8);
}

export type SettlementVoucherStatusTone = 'success' | 'warning' | 'danger' | 'info';
export type SettlementVoucherAlignment = 'left' | 'center' | 'right';

export interface SettlementVoucherField {
    label: string;
    value: SettlementVoucherCell;
}

export interface SettlementVoucherFieldGroup {
    title: string;
    fields: SettlementVoucherField[];
}

export interface SettlementVoucherColumn {
    key: string;
    label: string;
    align?: SettlementVoucherAlignment;
    width?: number;
    kind?: 'text' | 'payment' | 'currency' | 'money' | 'direction';
}

export interface SettlementVoucherPaymentCell {
    cellType: 'payment';
    paymentType?: string;
    paymentMethod?: string;
    paymentTypeLabel?: string;
    paymentMethodLabel?: string;
}

export interface SettlementVoucherCurrencyCell {
    cellType: 'currency';
    currency?: string;
    showName?: boolean;
}

export interface SettlementVoucherMoneyCell {
    cellType: 'money';
    currency?: string;
    amount: string;
}

export interface SettlementVoucherDirectionCell {
    cellType: 'direction';
    direction?: string;
    label?: string;
}

export type SettlementVoucherCell =
    | string
    | SettlementVoucherPaymentCell
    | SettlementVoucherCurrencyCell
    | SettlementVoucherMoneyCell
    | SettlementVoucherDirectionCell;
export type SettlementVoucherRow = Record<string, SettlementVoucherCell>;

export interface SettlementVoucherTable {
    title: string;
    columns: SettlementVoucherColumn[];
    rows: SettlementVoucherRow[];
    emptyText: string;
}

export interface SettlementVoucherDocument {
    system: Extract<VexraSystemKey, 'admin' | 'merchant'>;
    locale: 'zh-CN' | 'en-US';
    title: string;
    subtitle: string;
    referenceLabel: string;
    referenceNo: string;
    statusLabel: string;
    statusTone: SettlementVoucherStatusTone;
    netAmountLabel: string;
    netCurrency: string;
    netAmount: string;
    fieldGroups: SettlementVoucherFieldGroup[];
    auditFields?: SettlementVoucherField[];
    auditTitle?: string;
    rates: SettlementVoucherTable;
    summaries: SettlementVoucherTable;
    noticeTitle: string;
    notice: string;
    generatedAtLabel: string;
    generatedAt: string;
    footer: string;
    fileName: string;
}
