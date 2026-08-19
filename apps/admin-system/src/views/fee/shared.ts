import type { FeeRule, FeeRuleInput, FeeVersion, FeeVersionInput } from '@/api/fee';
import { i18n } from '@/i18n';

export type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger';

function t(key: string, params?: Record<string, unknown>) {
    return params ? i18n.global.t(key, params) : i18n.global.t(key);
}

export function createEmptyRule(): FeeRuleInput {
    return {
        feeCategory: 'TRANSACTION_FEE',
        ruleName: '',
        transactionType: '',
        paymentType: '',
        paymentMethod: 'ALL',
        feeMode: 'STANDARD',
        percentageRate: '0',
        fixedAmountUsd: '0',
        minimumAmountUsd: null,
        maximumAmountUsd: null,
        tierMetric: null,
        tierPeriod: null,
        sortNo: 0,
        remark: '',
        tiers: [],
    };
}

export function createEmptyVersion(): FeeVersionInput {
    return {
        reserveRate: '10',
        reserveDelayDays: 180,
        initialDelayUnit: 'T',
        initialDelayDays: 15,
        regularDelayUnit: 'T',
        regularDelayDays: 7,
        settlementFrequency: 'DAILY',
        frequencyDay: null,
        changeReason: '',
        rules: [createEmptyRule()],
    };
}

export function versionToInput(version?: FeeVersion | null): FeeVersionInput {
    if (!version) return createEmptyVersion();
    return {
        reserveRate: version.reserveRate,
        reserveDelayDays: version.reserveDelayDays,
        initialDelayUnit: version.initialDelayUnit,
        initialDelayDays: version.initialDelayDays,
        regularDelayUnit: version.regularDelayUnit,
        regularDelayDays: version.regularDelayDays,
        settlementFrequency: version.settlementFrequency as FeeVersionInput['settlementFrequency'],
        frequencyDay: version.frequencyDay,
        changeReason: '',
        rules: version.rules.map(ruleToInput),
    };
}

function ruleToInput(rule: FeeRule): FeeRuleInput {
    return {
        feeCategory: rule.feeCategory,
        ruleName: rule.ruleName,
        transactionType: rule.transactionType,
        paymentType: rule.paymentType,
        paymentMethod: rule.paymentMethod,
        feeMode: rule.feeMode,
        percentageRate: rule.percentageRate,
        fixedAmountUsd: rule.fixedAmountUsd,
        minimumAmountUsd: rule.minimumAmountUsd,
        maximumAmountUsd: rule.maximumAmountUsd,
        tierMetric: rule.tierMetric,
        tierPeriod: rule.tierPeriod,
        sortNo: rule.sortNo,
        remark: rule.remark,
        tiers: (rule.tiers || []).map((tier) => ({
            lowerBound: tier.lowerBound,
            upperBound: tier.upperBound,
            percentageRate: tier.percentageRate,
            fixedAmountUsd: tier.fixedAmountUsd,
            minimumAmountUsd: tier.minimumAmountUsd,
            maximumAmountUsd: tier.maximumAmountUsd,
            sortNo: tier.sortNo,
        })),
    };
}

export function validateFeeVersion(value: FeeVersionInput) {
    if (!value.changeReason.trim()) return t('feeAccount.changeReasonRequired');
    if (Number(value.reserveRate) < 0 || Number(value.reserveRate) > 100 || value.reserveDelayDays < 1) {
        return t('feeAccount.validation.invalidReserve');
    }
    if (!value.rules.length) return t('feeAccount.validation.atLeastOneRule');
    for (const [index, rule] of value.rules.entries()) {
        if (!rule.ruleName.trim() || !rule.transactionType.trim() || !rule.paymentType.trim()) {
            return t('feeAccount.validation.incompleteRule', { index: index + 1 });
        }
        if (Number(rule.percentageRate) < 0 || Number(rule.fixedAmountUsd) < 0) {
            return t('feeAccount.validation.negativeFee', { index: index + 1 });
        }
        if (rule.minimumAmountUsd !== null && rule.maximumAmountUsd !== null
            && rule.minimumAmountUsd !== undefined && rule.maximumAmountUsd !== undefined
            && Number(rule.minimumAmountUsd) > Number(rule.maximumAmountUsd)) {
            return t('feeAccount.validation.invalidLimit', { index: index + 1 });
        }
        if (rule.feeMode === 'TIER' && !rule.tiers.length) {
            return t('feeAccount.validation.tierRequired', { index: index + 1 });
        }
    }
    return '';
}

export function versionStatusType(status?: string): TagType {
    if (status === 'ACTIVE') return 'success';
    if (status === 'PENDING_REVIEW') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'info';
}

export function planStatusType(status?: string): TagType {
    if (status === 'ENABLED') return 'success';
    if (status === 'ARCHIVED') return 'info';
    if (status === 'UNCONFIGURED') return 'warning';
    return 'danger';
}

export function statusText(status?: string) {
    return status ? t(`feeAccount.status.${status}`) : '-';
}

export function originText(origin?: string | null) {
    return origin ? t(`feeAccount.origin.${origin}`) : '-';
}

export function settlementCycle(unit?: string, days?: number) {
    return unit && days ? `${unit}+${days}` : '-';
}

export function frequencyText(frequency?: string, day?: number | null) {
    if (frequency === 'DAILY') return t('feeAccount.daily');
    if (frequency === 'WEEKLY') return t('feeAccount.frequencyWeekly', { day: day || '-' });
    if (frequency === 'BIWEEKLY') return t('feeAccount.frequencyBiweekly', { day: day || '-' });
    if (frequency === 'MONTHLY') return t('feeAccount.frequencyMonthly', { day: day || '-' });
    return frequency || '-';
}

export function feeFormula(rule: Pick<FeeRuleInput, 'feeMode' | 'percentageRate' | 'fixedAmountUsd' | 'minimumAmountUsd' | 'maximumAmountUsd' | 'tierMetric'>) {
    if (rule.feeMode === 'TIER') {
        return rule.tierMetric === 'COUNT' ? t('feeAccount.tierCountFormula') : t('feeAccount.tierAmountFormula');
    }
    const parts = [t('feeAccount.labelAmountFormula', { rate: rule.percentageRate || 0 }), `USD ${rule.fixedAmountUsd || 0}`];
    if (rule.minimumAmountUsd !== null && rule.minimumAmountUsd !== undefined && rule.minimumAmountUsd !== '') {
        parts.push(t('feeAccount.minimumFormula', { amount: rule.minimumAmountUsd }));
    }
    if (rule.maximumAmountUsd !== null && rule.maximumAmountUsd !== undefined && rule.maximumAmountUsd !== '') {
        parts.push(t('feeAccount.maximumFormula', { amount: rule.maximumAmountUsd }));
    }
    return parts.join(' + ');
}
