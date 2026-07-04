export interface SelectOption {
    label: string;
    value: string;
}

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

export function sourceTypeOptions(t: TranslateFn): SelectOption[] {
    return ['WEB', 'API', 'MANUAL', 'IMPORT'].map((value) => ({ value, label: t(`exchange.enums.sourceType.${value}`) }));
}

export function fetchStatusOptions(t: TranslateFn): SelectOption[] {
    return ['SUCCESS', 'FAILED', 'PARTIAL_SUCCESS'].map((value) => ({ value, label: t(`exchange.enums.fetchStatus.${value}`) }));
}

export function rawRateStatusOptions(t: TranslateFn): SelectOption[] {
    return ['ENABLED', 'VOIDED'].map((value) => ({ value, label: t(`exchange.enums.rawRateStatus.${value}`) }));
}

export function businessRateStatusOptions(t: TranslateFn): SelectOption[] {
    return ['ENABLED', 'DISABLED', 'EXPIRED'].map((value) => ({ value, label: t(`exchange.enums.businessRateStatus.${value}`) }));
}

export function createMethodOptions(t: TranslateFn): SelectOption[] {
    return ['AUTO', 'MANUAL', 'IMPORT'].map((value) => ({ value, label: t(`exchange.enums.createMethod.${value}`) }));
}

export function generateMethodOptions(t: TranslateFn): SelectOption[] {
    return ['AUTO', 'MANUAL'].map((value) => ({ value, label: t(`exchange.enums.generateMethod.${value}`) }));
}

export function rateTypeOptions(t: TranslateFn): SelectOption[] {
    return ['TRANSACTION_RATE', 'SETTLEMENT_RATE', 'QUERY_RATE', 'CLEARING_RATE'].map((value) => ({ value, label: t(`exchange.enums.rateType.${value}`) }));
}

export function rateFieldOptions(t: TranslateFn): SelectOption[] {
    return ['SPOT_BUY_RATE', 'CASH_BUY_RATE', 'SPOT_SELL_RATE', 'CASH_SELL_RATE', 'MIDDLE_RATE'].map((value) => ({ value, label: t(`exchange.enums.rateField.${value}`) }));
}

export function adjustDirectionOptions(t: TranslateFn): SelectOption[] {
    return ['UP', 'DOWN', 'NONE'].map((value) => ({ value, label: t(`exchange.enums.adjustDirection.${value}`) }));
}

export function adjustMethodOptions(t: TranslateFn): SelectOption[] {
    return ['BP', 'PERCENT'].map((value) => ({ value, label: t(`exchange.enums.adjustMethod.${value}`) }));
}

export function roundingModeOptions(t: TranslateFn): SelectOption[] {
    return ['ROUND_HALF_UP', 'ROUND_DOWN', 'ROUND_UP'].map((value) => ({ value, label: t(`exchange.enums.roundingMode.${value}`) }));
}

export function usageSceneOptions(t: TranslateFn): SelectOption[] {
    return ['TRANSACTION', 'SETTLEMENT', 'QUERY', 'CLEARING'].map((value) => ({ value, label: t(`exchange.enums.usageScene.${value}`) }));
}

export function optionLabel(options: SelectOption[], value?: string) {
    if (!value) {
        return '-';
    }
    return options.find((item) => item.value === value)?.label || value;
}

export function statusType(value?: number | string) {
    return value === 1 || value === 'ENABLED' || value === 'SUCCESS' ? 'success' : value === 'VOIDED' || value === 'FAILED' ? 'danger' : 'info';
}

export function statusText(t: TranslateFn, value?: number) {
    return value === 1 ? t('common.enable') : t('common.disable');
}

export function yesNoText(t: TranslateFn, value?: number) {
    return value === 1 ? t('common.yes') : t('common.no');
}

export function secondsText(t: TranslateFn, value?: number) {
    return t('exchange.fields.secondsValue', { value: value ?? '-' });
}

export function formatRate(value?: string | number | null) {
    if (value === undefined || value === null || value === '') {
        return '-';
    }
    return String(value);
}

export function formatCurrency(t: TranslateFn, value?: string | null) {
    if (!value) {
        return '-';
    }
    return value === 'ALL' ? t('exchange.placeholders.allCurrenciesShort') : value;
}

export function formatCurrencyPair(t: TranslateFn, baseCurrency?: string | null, quoteCurrency?: string | null) {
    return `${formatCurrency(t, baseCurrency)}/${formatCurrency(t, quoteCurrency)}`;
}

export function normalizeCurrency(value?: string) {
    return (value || '').trim().toUpperCase();
}
