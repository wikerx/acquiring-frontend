import type { PaymentLogoKey } from '@acquiring/shared';
import type { RiskFunctionDefinition, RiskOptions, RiskOption } from '@/api/risk';

export type RiskListProfileKind =
    | 'merchant'
    | 'card'
    | 'cardFingerprint'
    | 'cardBin'
    | 'ip'
    | 'country'
    | 'email'
    | 'emailDomain'
    | 'emailUsername'
    | 'phone'
    | 'name'
    | 'address'
    | 'zip'
    | 'device'
    | 'customer'
    | 'sourceUrl'
    | 'region';

export type RiskRuleProfileKind =
    | 'sourceUrl'
    | 'merchantLimit'
    | 'frequency'
    | 'country'
    | 'issuerCountry'
    | 'cardBin'
    | 'threeDs';

export interface RiskListProfile {
    kind: RiskListProfileKind;
    valueLabelKey: string;
    valuePlaceholderKey: string;
    showValue: boolean;
    showRange: boolean;
    showCountry: boolean;
    showCardBrand: boolean;
    showHash: boolean;
    showRegion: boolean;
    rangeKind?: 'cardBin' | 'ip';
    valueInputType: 'plain' | 'range' | 'country' | 'region';
    allowIpRange: boolean;
    sensitive: boolean;
}

export interface RiskRuleProfile {
    kind: RiskRuleProfileKind;
    matchLabelKey: string;
    matchPlaceholderKey: string;
    showMatchMode: boolean;
    showMatchValue: boolean;
    showLimitType: boolean;
    showAmount: boolean;
    showCurrency: boolean;
    showFrequency: boolean;
    showElements: boolean;
    showCountry: boolean;
    showCardBrand: boolean;
    showThreeDs: boolean;
}

export interface RiskLayerMeta {
    labelKey: string;
    shortKey: string;
    tone: 'danger' | 'warningStrong' | 'warning' | 'successStrong' | 'success' | 'muted' | 'rule';
}

export type RiskOptionKind = 'merchantScope' | 'riskLevel' | 'decisionAction' | 'status' | 'sourceType' | 'validityType' | 'limitType';
type RiskTranslate = (key: string) => string;

export const RISK_FUNCTION_I18N_KEYS: Record<string, string> = {
    'AML:card': 'risk.function.aml.card',
    'AML:cardBin': 'risk.function.aml.cardBin',
    'AML:ip': 'risk.function.aml.ip',
    'AML:country': 'risk.function.aml.country',
    'AML:email': 'risk.function.aml.email',
    'AML:phone': 'risk.function.aml.phone',
    'AML:cardholderName': 'risk.function.aml.cardholderName',
    'AML:legalPerson': 'risk.function.aml.legalPerson',
    'AML:enterprise': 'risk.function.aml.enterprise',
    'AML:merchantBillingAddress': 'risk.function.aml.merchantBillingAddress',
    'AML:sourceUrl': 'risk.function.aml.sourceUrl',
    'BLACK:cardNo': 'risk.function.black.cardNo',
    'BLACK:cardFingerprint': 'risk.function.black.cardFingerprint',
    'BLACK:cardBin': 'risk.function.black.cardBin',
    'BLACK:cardholderName': 'risk.function.black.cardholderName',
    'BLACK:phone': 'risk.function.black.phone',
    'BLACK:ip': 'risk.function.black.ip',
    'BLACK:region': 'risk.function.black.region',
    'BLACK:email': 'risk.function.black.email',
    'BLACK:emailUsername': 'risk.function.black.emailUsername',
    'BLACK:emailDomain': 'risk.function.black.emailDomain',
    'BLACK:billingAddress': 'risk.function.black.billingAddress',
    'BLACK:billingZip': 'risk.function.black.billingZip',
    'BLACK:billingCountry': 'risk.function.black.billingCountry',
    'BLACK:shippingAddress': 'risk.function.black.shippingAddress',
    'BLACK:shippingZip': 'risk.function.black.shippingZip',
    'BLACK:shippingCountry': 'risk.function.black.shippingCountry',
    'BLACK:issuerCountry': 'risk.function.black.issuerCountry',
    'BLACK:deviceFingerprint': 'risk.function.black.deviceFingerprint',
    'WHITE:merchant': 'risk.function.white.merchant',
    'WHITE:cardNo': 'risk.function.white.cardNo',
    'WHITE:cardFingerprint': 'risk.function.white.cardFingerprint',
    'WHITE:cardBin': 'risk.function.white.cardBin',
    'WHITE:ip': 'risk.function.white.ip',
    'WHITE:tradeCountry': 'risk.function.white.tradeCountry',
    'WHITE:issuerCountry': 'risk.function.white.issuerCountry',
    'WHITE:email': 'risk.function.white.email',
    'WHITE:emailDomain': 'risk.function.white.emailDomain',
    'WHITE:phone': 'risk.function.white.phone',
    'WHITE:customerId': 'risk.function.white.customerId',
    'WHITE:deviceFingerprint': 'risk.function.white.deviceFingerprint',
    'RULE:sourceUrl': 'risk.function.rule.sourceUrl',
    'RULE:merchantLimit': 'risk.function.rule.merchantLimit',
    'RULE:frequency': 'risk.function.rule.frequency',
    'RULE:threeDs': 'risk.function.rule.threeDs',
};

const RISK_OPTION_I18N_KEYS: Record<RiskOptionKind, Record<string, string>> = {
    merchantScope: {
        GLOBAL: 'risk.option.merchantScope.GLOBAL',
        MERCHANT: 'risk.option.merchantScope.MERCHANT',
    },
    riskLevel: {
        LOW: 'risk.option.riskLevel.LOW',
        MEDIUM: 'risk.option.riskLevel.MEDIUM',
        HIGH: 'risk.option.riskLevel.HIGH',
        CRITICAL: 'risk.option.riskLevel.CRITICAL',
    },
    decisionAction: {
        PASS: 'risk.option.decisionAction.PASS',
        REJECT: 'risk.option.decisionAction.REJECT',
        REVIEW: 'risk.option.decisionAction.REVIEW',
    },
    status: {
        0: 'risk.option.status.DISABLED',
        1: 'risk.option.status.ENABLED',
        DISABLED: 'risk.option.status.DISABLED',
        ENABLED: 'risk.option.status.ENABLED',
    },
    sourceType: {
        MANUAL: 'risk.option.sourceType.MANUAL',
        IMPORT: 'risk.option.sourceType.IMPORT',
        SYSTEM: 'risk.option.sourceType.SYSTEM',
    },
    validityType: {
        SUPER_LONG: 'risk.option.validityType.SUPER_LONG',
        LONG: 'risk.option.validityType.LONG',
        LIMITED: 'risk.option.validityType.LIMITED',
    },
    limitType: {
        SINGLE_MIN: 'risk.option.limitType.SINGLE_MIN',
        SINGLE_MAX: 'risk.option.limitType.SINGLE_MAX',
        DAILY: 'risk.option.limitType.DAILY',
        WEEKLY: 'risk.option.limitType.WEEKLY',
        MONTHLY: 'risk.option.limitType.MONTHLY',
    },
};

export function riskFunctionName(t: RiskTranslate, definition: Pick<RiskFunctionDefinition, 'moduleType' | 'functionCode' | 'functionName'>) {
    const key = RISK_FUNCTION_I18N_KEYS[`${definition.moduleType}:${definition.functionCode}`];
    return key ? t(key) : definition.functionName;
}

export const riskFunctions: RiskFunctionDefinition[] = [
    riskFunction('AML', 'card', '/risk/aml/card', 'risk:aml:card'),
    riskFunction('AML', 'cardBin', '/risk/aml/card-bin', 'risk:aml:cardBin'),
    riskFunction('AML', 'ip', '/risk/aml/ip', 'risk:aml:ip'),
    riskFunction('AML', 'country', '/risk/aml/country', 'risk:aml:country'),
    riskFunction('AML', 'email', '/risk/aml/email', 'risk:aml:email'),
    riskFunction('AML', 'phone', '/risk/aml/phone', 'risk:aml:phone'),
    riskFunction('AML', 'cardholderName', '/risk/aml/cardholder-name', 'risk:aml:cardholderName'),
    riskFunction('AML', 'legalPerson', '/risk/aml/legal-person', 'risk:aml:legalPerson'),
    riskFunction('AML', 'enterprise', '/risk/aml/enterprise', 'risk:aml:enterprise'),
    riskFunction('AML', 'merchantBillingAddress', '/risk/aml/merchant-billing-address', 'risk:aml:merchantBillingAddress'),
    riskFunction('AML', 'sourceUrl', '/risk/aml/source-url', 'risk:aml:sourceUrl'),
    riskFunction('BLACK', 'cardNo', '/risk/blacklist/card-no', 'risk:blacklist:cardNo'),
    riskFunction('BLACK', 'cardFingerprint', '/risk/blacklist/card-fingerprint', 'risk:blacklist:cardFingerprint'),
    riskFunction('BLACK', 'cardBin', '/risk/blacklist/card-bin', 'risk:blacklist:cardBin'),
    riskFunction('BLACK', 'cardholderName', '/risk/blacklist/cardholder-name', 'risk:blacklist:cardholderName'),
    riskFunction('BLACK', 'phone', '/risk/blacklist/phone', 'risk:blacklist:phone'),
    riskFunction('BLACK', 'ip', '/risk/blacklist/ip', 'risk:blacklist:ip'),
    riskFunction('BLACK', 'region', '/risk/blacklist/region', 'risk:blacklist:region', true),
    riskFunction('BLACK', 'email', '/risk/blacklist/email', 'risk:blacklist:email'),
    riskFunction('BLACK', 'emailUsername', '/risk/blacklist/email-username', 'risk:blacklist:emailUsername'),
    riskFunction('BLACK', 'emailDomain', '/risk/blacklist/email-domain', 'risk:blacklist:emailDomain'),
    riskFunction('BLACK', 'billingAddress', '/risk/blacklist/billing-address', 'risk:blacklist:billingAddress'),
    riskFunction('BLACK', 'billingZip', '/risk/blacklist/billing-zip', 'risk:blacklist:billingZip'),
    riskFunction('BLACK', 'billingCountry', '/risk/blacklist/billing-country', 'risk:blacklist:billingCountry'),
    riskFunction('BLACK', 'shippingAddress', '/risk/blacklist/shipping-address', 'risk:blacklist:shippingAddress'),
    riskFunction('BLACK', 'shippingZip', '/risk/blacklist/shipping-zip', 'risk:blacklist:shippingZip'),
    riskFunction('BLACK', 'shippingCountry', '/risk/blacklist/shipping-country', 'risk:blacklist:shippingCountry'),
    riskFunction('BLACK', 'issuerCountry', '/risk/blacklist/issuer-country', 'risk:blacklist:issuerCountry'),
    riskFunction('BLACK', 'deviceFingerprint', '/risk/blacklist/device-fingerprint', 'risk:blacklist:deviceFingerprint'),
    riskFunction('WHITE', 'merchant', '/risk/whitelist/merchant', 'risk:whitelist:merchant'),
    riskFunction('WHITE', 'cardNo', '/risk/whitelist/card-no', 'risk:whitelist:cardNo'),
    riskFunction('WHITE', 'cardFingerprint', '/risk/whitelist/card-fingerprint', 'risk:whitelist:cardFingerprint'),
    riskFunction('WHITE', 'cardBin', '/risk/whitelist/card-bin', 'risk:whitelist:cardBin'),
    riskFunction('WHITE', 'ip', '/risk/whitelist/ip', 'risk:whitelist:ip'),
    riskFunction('WHITE', 'tradeCountry', '/risk/whitelist/trade-country', 'risk:whitelist:tradeCountry'),
    riskFunction('WHITE', 'issuerCountry', '/risk/whitelist/issuer-country', 'risk:whitelist:issuerCountry'),
    riskFunction('WHITE', 'email', '/risk/whitelist/email', 'risk:whitelist:email'),
    riskFunction('WHITE', 'emailDomain', '/risk/whitelist/email-domain', 'risk:whitelist:emailDomain'),
    riskFunction('WHITE', 'phone', '/risk/whitelist/phone', 'risk:whitelist:phone'),
    riskFunction('WHITE', 'customerId', '/risk/whitelist/customer-id', 'risk:whitelist:customerId'),
    riskFunction('WHITE', 'deviceFingerprint', '/risk/whitelist/device-fingerprint', 'risk:whitelist:deviceFingerprint'),
    riskFunction('RULE', 'sourceUrl', '/risk/rule/source-url', 'risk:rule:sourceUrl', false, true),
    riskFunction('RULE', 'merchantLimit', '/risk/rule/merchant-limit', 'risk:rule:merchantLimit', false, true),
    riskFunction('RULE', 'frequency', '/risk/rule/frequency', 'risk:rule:frequency', false, true),
    riskFunction('RULE', 'threeDs', '/risk/rule/3ds', 'risk:rule:threeDs', false, true),
];

function riskFunction(
    moduleType: string,
    functionCode: string,
    routePath: string,
    permissionPrefix: string,
    regionFunction = false,
    ruleFunction = false,
): RiskFunctionDefinition {
    return {
        moduleType,
        functionCode,
        functionName: `${moduleType}:${functionCode}`,
        routePath,
        permissionPrefix,
        regionFunction,
        ruleFunction,
    };
}

export function resolveRiskFunction(path: string, ruleOnly = false) {
    const normalized = path.replace(/\/$/, '');
    const matched = riskFunctions.find((item) => item.routePath === normalized);
    if (matched) {
        return matched;
    }
    return ruleOnly ? riskFunctions.find((item) => item.ruleFunction)! : riskFunctions.find((item) => !item.ruleFunction)!;
}

export function resolveRiskListProfile(definition: RiskFunctionDefinition): RiskListProfile {
    const code = definition.functionCode;
    if (definition.regionFunction) {
        return profile('region', 'risk.common.region', 'risk.profile.placeholder.region', false, false, true, false, false, true, 'region', false, false);
    }
    if (code === 'merchant') return profile('merchant', 'risk.common.merchantId', 'risk.common.placeholderMerchant', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'cardNo' || code === 'card') return profile('card', 'risk.common.cardNo', 'risk.profile.placeholder.cardNo', true, false, false, true, false, false, 'plain', false, true);
    if (code === 'cardFingerprint') return profile('cardFingerprint', 'risk.profile.label.cardFingerprint', 'risk.profile.placeholder.cardFingerprint', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'cardBin') return profile('cardBin', 'risk.profile.label.cardBinRange', 'risk.profile.placeholder.cardBin', true, true, false, true, false, false, 'range', false, false, 'cardBin');
    if (code === 'ip') return profile('ip', definition.moduleType === 'WHITE' ? 'risk.common.ipAddress' : 'risk.profile.label.ipRange', 'risk.profile.placeholder.ip', true, definition.moduleType !== 'WHITE', false, false, false, false, 'range', definition.moduleType !== 'WHITE', false, 'ip');
    if (code.includes('Country') || code === 'country') return profile('country', 'risk.common.country', 'risk.common.placeholderSelect', false, false, true, false, false, false, 'country', false, false);
    if (code === 'email') return profile('email', 'risk.profile.label.email', 'risk.profile.placeholder.email', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'emailDomain') return profile('emailDomain', 'risk.profile.label.emailDomain', 'risk.profile.placeholder.emailDomain', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'emailUsername') return profile('emailUsername', 'risk.profile.label.emailUsername', 'risk.profile.placeholder.emailUsername', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'phone') return profile('phone', 'risk.profile.label.phone', 'risk.profile.placeholder.phone', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'cardholderName') return profile('name', 'risk.profile.label.cardholderName', 'risk.profile.placeholder.cardholderName', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'legalPerson') return profile('name', 'risk.profile.label.legalPerson', 'risk.profile.placeholder.legalPerson', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'enterprise') return profile('name', 'risk.profile.label.enterprise', 'risk.profile.placeholder.enterprise', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'merchantBillingAddress') return profile('address', 'risk.profile.label.merchantBillingAddress', 'risk.profile.placeholder.merchantBillingAddress', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'billingAddress') return profile('address', 'risk.common.billingAddress', 'risk.profile.placeholder.billingAddress', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'billingZip') return profile('zip', 'risk.profile.label.billingZip', 'risk.profile.placeholder.billingZip', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'shippingAddress') return profile('address', 'risk.common.shippingAddress', 'risk.profile.placeholder.shippingAddress', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'shippingZip') return profile('zip', 'risk.profile.label.shippingZip', 'risk.profile.placeholder.shippingZip', true, false, false, false, false, false, 'plain', false, false);
    if (code.includes('Address')) return profile('address', 'risk.profile.label.address', 'risk.profile.placeholder.address', true, false, true, false, false, false, 'plain', false, true);
    if (code.includes('Zip')) return profile('zip', 'risk.profile.label.zip', 'risk.profile.placeholder.zip', true, false, true, false, false, false, 'plain', false, false);
    if (code === 'deviceFingerprint') return profile('device', 'risk.profile.label.deviceFingerprint', 'risk.profile.placeholder.deviceFingerprint', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'customerId') return profile('customer', 'risk.profile.label.customerId', 'risk.profile.placeholder.customerId', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'sourceUrl') return profile('sourceUrl', 'risk.profile.label.sourceUrl', 'risk.profile.placeholder.sourceUrl', true, false, false, false, false, false, 'plain', false, false);
    return profile('card', 'risk.common.matchValue', 'risk.profile.placeholder.matchValue', true, false, true, false, false, false, 'plain', false, false);
}

export function resolveRiskRuleProfile(definition: RiskFunctionDefinition): RiskRuleProfile {
    const code = definition.functionCode;
    if (code === 'sourceUrl') return ruleProfile('sourceUrl', 'risk.profile.rule.sourceUrlLabel', 'risk.profile.rule.sourceUrlPlaceholder', false, true, false, false, false, false, false, false, false, false);
    if (code === 'merchantLimit') return ruleProfile('merchantLimit', 'risk.profile.rule.limitSceneLabel', 'risk.profile.rule.limitScenePlaceholder', false, false, true, true, true, false, false, false, false, false);
    if (code === 'frequency') return ruleProfile('frequency', 'risk.profile.rule.frequencyElementLabel', 'risk.profile.rule.frequencyElementPlaceholder', false, false, false, false, false, true, true, false, false, false);
    if (code === 'threeDs') return ruleProfile('threeDs', 'risk.profile.rule.threeDsLabel', 'risk.profile.rule.threeDsPlaceholder', false, false, false, false, false, false, false, false, false, true);
    return ruleProfile('sourceUrl', 'risk.common.matchValue', 'risk.profile.placeholder.matchValue', true, true, true, true, true, true, true, true, false, false);
}

function profile(
    kind: RiskListProfileKind,
    valueLabelKey: string,
    valuePlaceholderKey: string,
    showValue: boolean,
    showRange: boolean,
    showCountry: boolean,
    showCardBrand: boolean,
    showHash: boolean,
    showRegion: boolean,
    valueInputType: 'plain' | 'range' | 'country' | 'region',
    allowIpRange: boolean,
    sensitive: boolean,
    rangeKind?: 'cardBin' | 'ip',
): RiskListProfile {
    return { kind, valueLabelKey, valuePlaceholderKey, showValue, showRange, showCountry, showCardBrand, showHash, showRegion, valueInputType, allowIpRange, sensitive, rangeKind };
}

function ruleProfile(
    kind: RiskRuleProfileKind,
    matchLabelKey: string,
    matchPlaceholderKey: string,
    showMatchMode: boolean,
    showMatchValue: boolean,
    showLimitType: boolean,
    showAmount: boolean,
    showCurrency: boolean,
    showFrequency: boolean,
    showElements: boolean,
    showCountry: boolean,
    showCardBrand: boolean,
    showThreeDs: boolean,
): RiskRuleProfile {
    return { kind, matchLabelKey, matchPlaceholderKey, showMatchMode, showMatchValue, showLimitType, showAmount, showCurrency, showFrequency, showElements, showCountry, showCardBrand, showThreeDs };
}

export function emptyRiskOptions(): RiskOptions {
    return {
        statusOptions: [],
        merchantScopeOptions: [],
        riskLevelOptions: [],
        decisionActionOptions: [],
        cardBrandOptions: [],
        countryOptions: [],
        currencyOptions: [],
        limitTypeOptions: [],
        validityTypeOptions: [],
        sourceTypeOptions: [],
    };
}

export function riskOptionLabel(t: RiskTranslate, kind: RiskOptionKind, value?: string | number, fallback?: string | number) {
    if (value === undefined || value === null || value === '') {
        return fallback === undefined || fallback === null || fallback === '' ? '-' : String(fallback);
    }
    const key = RISK_OPTION_I18N_KEYS[kind]?.[String(value)];
    return key ? t(key) : String(fallback || value);
}

export function localizeRiskOptions(options: RiskOption[], t: RiskTranslate, kind: RiskOptionKind): RiskOption[] {
    return options.map((item) => ({ ...item, label: riskOptionLabel(t, kind, item.value, item.label) }));
}

const CARD_BRAND_LOGO_MAP: Record<string, PaymentLogoKey> = {
    VISA: 'visa',
    MASTERCARD: 'mastercard',
    JCB: 'jcb',
    MAESTRO: 'maestro',
    AMEX: 'americanExpress',
    AMERICAN_EXPRESS: 'americanExpress',
    DINERS_CLUB: 'dinersClub',
    DISCOVER: 'discover',
    UNIONPAY: 'unionPay',
    UNION_PAY: 'unionPay',
};

const BLACK_LAYER_BY_FUNCTION: Record<string, RiskLayerMeta> = {
    cardNo: layer('risk.layer.blackA', 'risk.layer.blackAShort', 'warningStrong'),
    cardFingerprint: layer('risk.layer.blackA', 'risk.layer.blackAShort', 'warningStrong'),
    cardBin: layer('risk.layer.blackA', 'risk.layer.blackAShort', 'warningStrong'),
    cardholderName: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    phone: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    ip: layer('risk.layer.blackA', 'risk.layer.blackAShort', 'warningStrong'),
    region: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    email: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    emailUsername: layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted'),
    emailDomain: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    billingAddress: layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted'),
    billingZip: layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted'),
    billingCountry: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    shippingAddress: layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted'),
    shippingZip: layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted'),
    shippingCountry: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    issuerCountry: layer('risk.layer.blackB', 'risk.layer.blackBShort', 'warning'),
    deviceFingerprint: layer('risk.layer.blackA', 'risk.layer.blackAShort', 'warningStrong'),
};

const WHITE_LAYER_BY_FUNCTION: Record<string, RiskLayerMeta> = {
    merchant: layer('risk.layer.strongWhite', 'risk.layer.strongWhiteShort', 'successStrong'),
    cardNo: layer('risk.layer.strongWhite', 'risk.layer.strongWhiteShort', 'successStrong'),
    cardFingerprint: layer('risk.layer.strongWhite', 'risk.layer.strongWhiteShort', 'successStrong'),
    cardBin: layer('risk.layer.preferWhite', 'risk.layer.preferWhiteShort', 'success'),
    ip: layer('risk.layer.preferWhite', 'risk.layer.preferWhiteShort', 'success'),
    tradeCountry: layer('risk.layer.weakWhite', 'risk.layer.weakWhiteShort', 'muted'),
    issuerCountry: layer('risk.layer.weakWhite', 'risk.layer.weakWhiteShort', 'muted'),
    email: layer('risk.layer.preferWhite', 'risk.layer.preferWhiteShort', 'success'),
    emailDomain: layer('risk.layer.weakWhite', 'risk.layer.weakWhiteShort', 'muted'),
    phone: layer('risk.layer.preferWhite', 'risk.layer.preferWhiteShort', 'success'),
    customerId: layer('risk.layer.preferWhite', 'risk.layer.preferWhiteShort', 'success'),
    deviceFingerprint: layer('risk.layer.strongWhite', 'risk.layer.strongWhiteShort', 'successStrong'),
};

export function riskLayerMeta(definition: Pick<RiskFunctionDefinition, 'moduleType' | 'functionCode'>): RiskLayerMeta {
    if (definition.moduleType === 'AML') {
        return layer('risk.layer.aml', 'risk.layer.amlShort', 'danger');
    }
    if (definition.moduleType === 'BLACK') {
        return BLACK_LAYER_BY_FUNCTION[definition.functionCode] || layer('risk.layer.blackC', 'risk.layer.blackCShort', 'muted');
    }
    if (definition.moduleType === 'WHITE') {
        return WHITE_LAYER_BY_FUNCTION[definition.functionCode] || layer('risk.layer.weakWhite', 'risk.layer.weakWhiteShort', 'muted');
    }
    return layer('risk.layer.rule', 'risk.layer.ruleShort', 'rule');
}

export function cardBrandLogoKey(value?: string, option?: RiskOption): PaymentLogoKey | undefined {
    const parsed = parseLogoKey((option as RiskOption & { extraJson?: string })?.extraJson);
    return parsed || CARD_BRAND_LOGO_MAP[(value || option?.value || '').toUpperCase()];
}

export function cardBrandLogoKeyByValue(options: RiskOption[], value?: string): PaymentLogoKey | undefined {
    return cardBrandLogoKey(value, options.find((item) => item.value === value));
}

export function cardBrandLabel(options: RiskOption[], value?: string) {
    if (!value) return '';
    return options.find((item) => item.value === value)?.label || value;
}

export function detectCardBrand(value?: string, options: RiskOption[] = []) {
    const cardNo = String(value || '');
    if (!cardNo) return undefined;
    if (/^4/.test(cardNo)) return availableCardBrand('VISA', options);
    if (/^(5[1-5]|2[2-7])/.test(cardNo)) return availableCardBrand('MASTERCARD', options);
    if (/^3[47]/.test(cardNo)) return availableCardBrand('AMEX', options);
    if (/^35/.test(cardNo)) return availableCardBrand('JCB', options);
    if (/^62/.test(cardNo)) return availableCardBrand('UNIONPAY', options);
    if (/^(6011|65|64[4-9])/.test(cardNo)) return availableCardBrand('DISCOVER', options);
    if (/^(30[0-5]|36|38|39)/.test(cardNo)) return availableCardBrand('DINERS_CLUB', options);
    if (/^(50|5[6-9]|6[0-9])/.test(cardNo)) return availableCardBrand('MAESTRO', options);
    return undefined;
}

export function statusText(status: number | undefined, t?: RiskTranslate) {
    return t ? riskOptionLabel(t, 'status', status) : status === 1 ? 'Enabled' : 'Disabled';
}

export function statusTag(status?: number) {
    return status === 1 ? 'success' : 'info';
}

function layer(labelKey: string, shortKey: string, tone: RiskLayerMeta['tone']): RiskLayerMeta {
    return { labelKey, shortKey, tone };
}

function availableCardBrand(value: string, options: RiskOption[]) {
    return options.some((item) => item.value === value) ? value : undefined;
}

function parseLogoKey(extraJson?: string): PaymentLogoKey | undefined {
    if (!extraJson) return undefined;
    try {
        const payload = JSON.parse(extraJson) as { logoKey?: PaymentLogoKey; logoKeys?: PaymentLogoKey[] };
        if (payload.logoKey) return payload.logoKey;
        return Array.isArray(payload.logoKeys) ? payload.logoKeys[0] : undefined;
    } catch {
        return undefined;
    }
}
