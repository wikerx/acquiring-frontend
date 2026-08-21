import type { FeeRule, FeeRuleInput, FeeVersion, FeeVersionInput } from '@/api/fee';
import { BusinessResultError, resolveFriendlyRequestMessage } from '@acquiring/shared';
import { i18n } from '@/i18n';

export type TagType = 'success' | 'warning' | 'info' | 'primary' | 'danger';

const DEFAULT_RISK_TRANSACTION_TYPES = ['AUTHORIZATION', 'PRE_AUTHORIZATION', 'PAYMENT'];
const SETTLEMENT_FX_FEE_NAME = '结算货币兑换费';
const EXCLUSIVE_MODE_CATEGORIES = new Set<FeeRuleInput['feeCategory']>([
    'TRANSACTION_FEE',
    'REFUND_FEE',
    'DISPUTE_FEE',
]);

function t(key: string, params?: Record<string, unknown>) {
    return params ? i18n.global.t(key, params) : i18n.global.t(key);
}

/** Preserve the backend fee error code and message so validation failures remain actionable. */
export function feeRequestErrorMessage(error: unknown, fallback: string) {
    if (!error || typeof error !== 'object') return fallback;
    const responseCode = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
    const resultCode = error instanceof BusinessResultError ? error.resultCode : responseCode;
    const message = resolveFriendlyRequestMessage(error, String(i18n.global.locale.value || 'zh-CN'));
    return resultCode && resultCode !== 'T200' && !message.includes(resultCode)
        ? `${resultCode}: ${message}`
        : message;
}

export function createEmptyRule(): FeeRuleInput {
    return {
        feeCategory: 'TRANSACTION_FEE',
        ruleName: '',
        transactionType: '',
        paymentType: '',
        paymentMethod: 'ALL',
        transactionTypes: [],
        paymentTypes: [],
        paymentMethods: ['ALL'],
        riskServiceType: 'NONE',
        chargeTrigger: 'NOT_APPLICABLE',
        feeMode: 'STANDARD',
        percentageRate: '',
        fixedAmountUsd: '',
        minimumAmountUsd: null,
        maximumAmountUsd: null,
        tierMetric: null,
        tierPeriod: null,
        sortNo: 0,
        remark: '',
        tiers: [],
    };
}

export function createRiskRule(riskServiceType: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS' = 'INTERNAL'): FeeRuleInput {
    const rule = createEmptyRule();
    rule.feeCategory = 'RISK_FEE';
    rule.riskServiceType = riskServiceType;
    rule.chargeTrigger = 'NO_CHARGE';
    rule.percentageRate = '';
    rule.minimumAmountUsd = null;
    rule.maximumAmountUsd = null;
    return rule;
}

/** Create the three risk-service defaults shown only when starting a new fee configuration. */
export function createDefaultRiskRules(): FeeRuleInput[] {
    return [
        createDefaultRiskRule('INTERNAL', t('feeAccount.defaultRiskRule.internal'), 'SUCCESS_OR_FAILURE'),
        createDefaultRiskRule('EXTERNAL', t('feeAccount.defaultRiskRule.external'), 'ON_CALL'),
        createDefaultRiskRule('THREE_DS', t('feeAccount.defaultRiskRule.threeDs'), 'ON_CALL'),
    ];
}

function createDefaultRiskRule(
    riskServiceType: 'INTERNAL' | 'EXTERNAL' | 'THREE_DS',
    ruleName: string,
    chargeTrigger: 'SUCCESS_OR_FAILURE' | 'ON_CALL',
) {
    const rule = createRiskRule(riskServiceType);
    rule.ruleName = ruleName;
    rule.transactionType = DEFAULT_RISK_TRANSACTION_TYPES[0];
    rule.transactionTypes = [...DEFAULT_RISK_TRANSACTION_TYPES];
    rule.paymentType = 'BANK_CARD';
    rule.paymentTypes = ['BANK_CARD'];
    rule.paymentMethod = 'ALL';
    rule.paymentMethods = ['ALL'];
    rule.chargeTrigger = chargeTrigger;
    return rule;
}

/** Create the only settlement currency conversion fee allowed in one fee version. */
export function createSettlementFxRule(): FeeRuleInput {
    const rule = createEmptyRule();
    rule.feeCategory = 'SETTLEMENT_FX_FEE';
    rule.ruleName = SETTLEMENT_FX_FEE_NAME;
    rule.transactionType = 'ALL';
    rule.transactionTypes = ['ALL'];
    rule.paymentType = 'ALL';
    rule.paymentTypes = ['ALL'];
    rule.paymentMethod = 'ALL';
    rule.paymentMethods = ['ALL'];
    return rule;
}

export function createEmptyVersion(): FeeVersionInput {
    return {
        reserveRate: '10',
        reserveDelayUnit: 'D',
        reserveDelayDays: 180,
        settlementCurrency: null,
        initialDelayUnit: 'T',
        initialDelayDays: 15,
        regularDelayUnit: 'T',
        regularDelayDays: 7,
        settlementFrequency: 'DAILY',
        frequencyDay: null,
        changeReason: '',
        rules: [createEmptyRule(), ...createDefaultRiskRules()],
    };
}

export function versionToInput(version?: FeeVersion | null): FeeVersionInput {
    if (!version) return createEmptyVersion();
    return {
        reserveRate: version.reserveRate,
        reserveDelayUnit: version.reserveDelayUnit || 'D',
        reserveDelayDays: version.reserveDelayDays,
        settlementCurrency: version.settlementCurrency || null,
        initialDelayUnit: version.initialDelayUnit,
        initialDelayDays: version.initialDelayDays,
        regularDelayUnit: version.initialDelayUnit,
        regularDelayDays: version.regularDelayDays,
        settlementFrequency: version.settlementFrequency as FeeVersionInput['settlementFrequency'],
        frequencyDay: version.frequencyDay,
        changeReason: '',
        rules: version.rules.map(ruleToInput),
    };
}

/**
 * 生成后端提交副本：页面保留空白输入，必填金额空值按零提交，可选上下限按空值提交。
 */
export function normalizeFeeVersionForSubmit(value: FeeVersionInput): FeeVersionInput {
    return {
        ...value,
        rules: value.rules.map((rule) => {
            const normalizedRule: FeeRuleInput = {
                ...rule,
                percentageRate: zeroWhenBlank(rule.percentageRate),
                fixedAmountUsd: zeroWhenBlank(rule.fixedAmountUsd),
                minimumAmountUsd: nullWhenBlank(rule.minimumAmountUsd),
                maximumAmountUsd: nullWhenBlank(rule.maximumAmountUsd),
                tiers: rule.tiers.map((tier) => ({
                    ...tier,
                    percentageRate: zeroWhenBlank(tier.percentageRate),
                    fixedAmountUsd: zeroWhenBlank(tier.fixedAmountUsd),
                    minimumAmountUsd: nullWhenBlank(tier.minimumAmountUsd),
                    maximumAmountUsd: nullWhenBlank(tier.maximumAmountUsd),
                })),
            };
            if (rule.feeCategory !== 'SETTLEMENT_FX_FEE') return normalizedRule;
            return {
                ...normalizedRule,
                ruleName: SETTLEMENT_FX_FEE_NAME,
                transactionType: 'ALL',
                transactionTypes: ['ALL'],
                paymentType: 'ALL',
                paymentTypes: ['ALL'],
                paymentMethod: 'ALL',
                paymentMethods: ['ALL'],
                feeMode: 'STANDARD',
                tierMetric: null,
                tierPeriod: null,
                tiers: [],
            };
        }),
    };
}

function zeroWhenBlank(value: string | number) {
    return String(value ?? '').trim() === '' ? '0' : value;
}

function nullWhenBlank(value?: string | number | null) {
    return value === null || value === undefined || String(value).trim() === '' ? null : value;
}

function ruleToInput(rule: FeeRule): FeeRuleInput {
    if (rule.feeCategory === 'SETTLEMENT_FX_FEE') {
        return {
            ...createSettlementFxRule(),
            percentageRate: rule.percentageRate,
            fixedAmountUsd: rule.fixedAmountUsd,
            minimumAmountUsd: rule.minimumAmountUsd,
            maximumAmountUsd: rule.maximumAmountUsd,
            sortNo: rule.sortNo,
            remark: rule.remark,
        };
    }
    return {
        feeCategory: rule.feeCategory,
        ruleName: rule.ruleName,
        transactionType: rule.transactionType,
        paymentType: rule.paymentType,
        paymentMethod: rule.paymentMethod,
        transactionTypes: responseValues(rule.transactionTypes, rule.transactionType),
        paymentTypes: responseValues(rule.paymentTypes, rule.paymentType),
        paymentMethods: responseValues(rule.paymentMethods, rule.paymentMethod || 'ALL'),
        riskServiceType: rule.riskServiceType || (rule.feeCategory === 'RISK_FEE' ? null : 'NONE'),
        chargeTrigger: rule.chargeTrigger || (rule.feeCategory === 'RISK_FEE' ? null : 'NOT_APPLICABLE'),
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

function responseValues(batchValues: string[] | undefined, compatibleValue?: string) {
    const values = batchValues?.length ? batchValues : compatibleValue ? [compatibleValue] : [];
    return [...new Set(values.map((item) => item.trim().toUpperCase()).filter(Boolean))];
}

type DecimalParts = {
    sign: -1 | 0 | 1;
    integer: string;
    fraction: string;
};

/** Compare decimal input as text so fee and boundary validation never loses precision. */
export function compareDecimal(left: string | number, right: string | number) {
    const leftParts = decimalParts(left);
    const rightParts = decimalParts(right);
    if (!leftParts || !rightParts) return null;
    if (leftParts.sign !== rightParts.sign) return leftParts.sign < rightParts.sign ? -1 : 1;
    if (leftParts.sign === 0) return 0;

    const absoluteResult = compareAbsoluteDecimal(leftParts, rightParts);
    return leftParts.sign === -1 ? -absoluteResult : absoluteResult;
}

function decimalParts(value: string | number): DecimalParts | null {
    const matched = String(value).trim().match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))$/);
    if (!matched) return null;

    const integer = (matched[2] || '0').replace(/^0+(?=\d)/, '');
    const fraction = (matched[3] ?? matched[4] ?? '').replace(/0+$/, '');
    const isZero = integer === '0' && !fraction;
    return {
        sign: isZero ? 0 : matched[1] === '-' ? -1 : 1,
        integer,
        fraction,
    };
}

function compareAbsoluteDecimal(left: DecimalParts, right: DecimalParts) {
    if (left.integer.length !== right.integer.length) {
        return left.integer.length < right.integer.length ? -1 : 1;
    }
    if (left.integer !== right.integer) return left.integer < right.integer ? -1 : 1;

    const fractionLength = Math.max(left.fraction.length, right.fraction.length);
    const leftFraction = left.fraction.padEnd(fractionLength, '0');
    const rightFraction = right.fraction.padEnd(fractionLength, '0');
    if (leftFraction === rightFraction) return 0;
    return leftFraction < rightFraction ? -1 : 1;
}

function hasValue(value?: string | number | null): value is string | number {
    return value !== null && value !== undefined && String(value).trim() !== '';
}

export function validateFeeVersion(value: FeeVersionInput, options: { changeReasonRequired?: boolean } = {}) {
    if (options.changeReasonRequired !== false && !value.changeReason.trim()) {
        return t('feeAccount.changeReasonRequired');
    }
    const reserveRateVsZero = compareDecimal(value.reserveRate, '0');
    const reserveRateVsHundred = compareDecimal(value.reserveRate, '100');
    if (!['T', 'D'].includes(value.reserveDelayUnit)
        || reserveRateVsZero === null || reserveRateVsZero < 0
        || reserveRateVsHundred === null || reserveRateVsHundred > 0 || value.reserveDelayDays < 1) {
        return t('feeAccount.validation.invalidReserve');
    }
    if (!['T', 'D'].includes(value.initialDelayUnit)
        || value.initialDelayDays < 1 || value.regularDelayDays < 1) {
        return t('feeAccount.validation.invalidSettlementCycle');
    }
    value.regularDelayUnit = value.initialDelayUnit;
    if (value.settlementCurrency !== null && value.settlementCurrency !== undefined
        && !/^[A-Z]{3}$/.test(value.settlementCurrency.trim().toUpperCase())) {
        return t('feeAccount.settlementCurrencyRequired');
    }
    if (!value.rules.length) return t('feeAccount.validation.atLeastOneRule');
    if (value.rules.filter((rule) => rule.feeCategory === 'SETTLEMENT_FX_FEE').length > 1) {
        return t('feeAccount.validation.singleSettlementFxFee');
    }
    const categoryModes = new Map<FeeRuleInput['feeCategory'], FeeRuleInput['feeMode']>();
    for (const rule of value.rules) {
        if (!EXCLUSIVE_MODE_CATEGORIES.has(rule.feeCategory)) continue;
        const configuredMode = categoryModes.get(rule.feeCategory);
        if (configuredMode && configuredMode !== rule.feeMode) {
            return t('feeAccount.validation.mixedFeeModes');
        }
        categoryModes.set(rule.feeCategory, rule.feeMode);
    }
    const dimensions = new Set<string>();
    let expandedRuleCount = 0;
    for (const [index, rule] of value.rules.entries()) {
        if (rule.feeCategory === 'SETTLEMENT_FX_FEE') {
            if (rule.feeMode !== 'STANDARD') return t('feeAccount.validation.standardSettlementFxFee');
        } else {
            const transactionTypes = selectedValues(rule.transactionTypes, rule.transactionType);
            const paymentTypes = selectedValues(rule.paymentTypes, rule.paymentType);
            const paymentMethods = selectedValues(rule.paymentMethods, rule.paymentMethod || 'ALL');
            if (!transactionTypes.length || !paymentTypes.length
                || paymentTypes.includes('BANK_CARD') && !paymentMethods.length) {
                return t('feeAccount.validation.incompleteRule', { index: index + 1 });
            }
            if (paymentTypes.includes('BANK_CARD')
                && paymentMethods.includes('ALL') && paymentMethods.length > 1) {
                return t('feeAccount.validation.paymentMethodConflict', { index: index + 1 });
            }
            for (const transactionType of transactionTypes) {
                for (const paymentType of paymentTypes) {
                    const methods = paymentType === 'BANK_CARD' ? paymentMethods : ['ALL'];
                    for (const paymentMethod of methods) {
                        const riskType = rule.feeCategory === 'RISK_FEE' ? rule.riskServiceType || '' : 'NONE';
                        const dimension = `${rule.feeCategory}|${riskType}|${transactionType}|${paymentType}|${paymentMethod}`;
                        if (dimensions.has(dimension)) return t('feeAccount.validation.duplicateDimension', { index: index + 1 });
                        dimensions.add(dimension);
                        expandedRuleCount += 1;
                        if (expandedRuleCount > 200) return t('feeAccount.validation.expansionLimit');
                    }
                }
            }
        }
        if (rule.feeCategory === 'RISK_FEE') {
            const allowedTriggers = rule.riskServiceType === 'INTERNAL'
                ? ['NO_CHARGE', 'SUCCESS', 'SUCCESS_OR_FAILURE']
                : ['NO_CHARGE', 'ON_CALL'];
            if (!rule.riskServiceType || rule.riskServiceType === 'NONE'
                || !rule.chargeTrigger || !allowedTriggers.includes(rule.chargeTrigger)) {
                return t('feeAccount.validation.invalidRiskRule', { index: index + 1 });
            }
            const fixedFeeVsZero = compareDecimal(rule.fixedAmountUsd, '0');
            if (rule.chargeTrigger !== 'NO_CHARGE'
                && (fixedFeeVsZero === null || fixedFeeVsZero <= 0)) {
                return t('feeAccount.validation.invalidRiskFixedFee', { index: index + 1 });
            }
        }
        const percentageVsZero = compareDecimal(zeroWhenBlank(rule.percentageRate), '0');
        const fixedFeeVsZero = compareDecimal(zeroWhenBlank(rule.fixedAmountUsd), '0');
        if (percentageVsZero === null || fixedFeeVsZero === null
            || percentageVsZero < 0 || fixedFeeVsZero < 0) {
            return t('feeAccount.validation.negativeFee', { index: index + 1 });
        }
        if (hasValue(rule.minimumAmountUsd) && hasValue(rule.maximumAmountUsd)
            && (compareDecimal(rule.minimumAmountUsd, rule.maximumAmountUsd) ?? 1) > 0) {
            return t('feeAccount.validation.invalidLimit', { index: index + 1 });
        }
        if (rule.feeMode === 'TIER' && !rule.tiers.length) {
            return t('feeAccount.validation.tierRequired', { index: index + 1 });
        }
        if (rule.feeMode === 'TIER') {
            for (const [tierIndex, tier] of rule.tiers.entries()) {
                const messageParams = { ruleIndex: index + 1, tierIndex: tierIndex + 1 };
                if (!hasValue(tier.lowerBound)) {
                    return t('feeAccount.validation.tierLowerRequired', messageParams);
                }
                if (tierIndex === 0 && compareDecimal(tier.lowerBound, '0') !== 0) {
                    return t('feeAccount.validation.tierStartZero', messageParams);
                }

                const isLastTier = tierIndex === rule.tiers.length - 1;
                if (!isLastTier && !hasValue(tier.upperBound)) {
                    return t('feeAccount.validation.tierUpperRequired', messageParams);
                }
                if (isLastTier && hasValue(tier.upperBound)) {
                    return t('feeAccount.validation.tierLastUpperEmpty', messageParams);
                }
                if (hasValue(tier.upperBound)
                    && (compareDecimal(tier.upperBound, tier.lowerBound) ?? -1) <= 0) {
                    return t('feeAccount.validation.tierInvalidRange', messageParams);
                }

                const nextTier = rule.tiers[tierIndex + 1];
                if (nextTier && hasValue(tier.upperBound) && hasValue(nextTier.lowerBound)
                    && compareDecimal(tier.upperBound, nextTier.lowerBound) !== 0) {
                    return t('feeAccount.validation.tierNotContinuous', messageParams);
                }
                if (hasValue(tier.minimumAmountUsd) && hasValue(tier.maximumAmountUsd)
                    && (compareDecimal(tier.minimumAmountUsd, tier.maximumAmountUsd) ?? 1) > 0) {
                    return t('feeAccount.validation.tierInvalidLimit', messageParams);
                }
            }
        }
    }
    return '';
}

function selectedValues(batchValues: string[] | undefined, compatibleValue?: string) {
    const values = batchValues !== undefined ? batchValues : compatibleValue ? [compatibleValue] : [];
    return [...new Set(values.map((item) => item.trim().toUpperCase()).filter(Boolean))];
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
