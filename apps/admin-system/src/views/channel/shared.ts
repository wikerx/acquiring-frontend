import type { PaymentLogoKey } from '@acquiring/shared';
import { searchDictData, type SysDictData } from '@/api/system/dict';
import { listChannelOptions, type ChannelOption } from '@/api/channel';

export interface SelectOption {
    label: string;
    value: string;
    extraJson?: string;
}

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
    DINERS_CLUB: ['dinersClub'],
    DISCOVER: ['discover'],
    UNIONPAY: ['unionPay'],
};

export async function loadDictOptions(dictType: string, locale: string): Promise<SelectOption[]> {
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
        extraJson: item.extraJson,
    }));
}

export async function loadChannelOptions(): Promise<ChannelOption[]> {
    return listChannelOptions();
}

export function optionLabel(options: SelectOption[], value?: string) {
    if (!value) {
        return '-';
    }
    return options.find((item) => item.value === value)?.label || value;
}

export function channelLabel(options: ChannelOption[], id?: number) {
    if (!id) {
        return '-';
    }
    const option = options.find((item) => item.id === id);
    return option ? `${option.channelName} (${option.channelCode})` : String(id);
}

export function statusType(value?: number) {
    return value === 1 ? 'success' : 'info';
}

export function statusText(value: number | undefined, enabledText: string, disabledText: string) {
    return value === 1 ? enabledText : disabledText;
}

export function yesNoText(value: number | undefined, yesText: string, noText: string) {
    return value === 1 ? yesText : noText;
}

export function parseLogoKeys(option?: SelectOption): PaymentLogoKey[] {
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

export function paymentLogoKeys(value?: string, option?: SelectOption): PaymentLogoKey[] {
    return parseLogoKeys(option).length ? parseLogoKeys(option) : PAYMENT_LOGO_MAP[value || ''] || [];
}

export function cardLogoKeys(value?: string, option?: SelectOption): PaymentLogoKey[] {
    return parseLogoKeys(option).length ? parseLogoKeys(option) : CARD_LOGO_MAP[value || ''] || [];
}

export function arrayText(values?: string[], options: SelectOption[] = []) {
    if (!values?.length) {
        return '-';
    }
    return values.map((value) => optionLabel(options, value)).join(', ');
}
