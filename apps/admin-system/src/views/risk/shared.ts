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
    valueLabel: string;
    valuePlaceholder: string;
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
    matchLabel: string;
    matchPlaceholder: string;
    showMatchMode: boolean;
    showMatchValue: boolean;
    showLimitType: boolean;
    showAmount: boolean;
    showCurrency: boolean;
    showFrequency: boolean;
    showElements: boolean;
    showCountry: boolean;
    showCardBrand: boolean;
}

export interface RiskLayerMeta {
    labelKey: string;
    shortKey: string;
    tone: 'danger' | 'warningStrong' | 'warning' | 'successStrong' | 'success' | 'muted' | 'rule';
}

export type RiskOptionKind = 'merchantScope' | 'riskLevel' | 'decisionAction' | 'status' | 'sourceType' | 'validityType';
type RiskTranslate = (key: string) => string;

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
};

export const riskFunctions: RiskFunctionDefinition[] = [
    { moduleType: 'AML', functionCode: 'card', functionName: '卡号/卡指纹AML', routePath: '/risk/aml/card', permissionPrefix: 'risk:aml:card', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'cardBin', functionName: '卡BIN/区间AML', routePath: '/risk/aml/card-bin', permissionPrefix: 'risk:aml:cardBin', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'ip', functionName: 'IP地址/区间AML', routePath: '/risk/aml/ip', permissionPrefix: 'risk:aml:ip', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'country', functionName: '国家/地区AML', routePath: '/risk/aml/country', permissionPrefix: 'risk:aml:country', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'email', functionName: '邮箱/域名AML', routePath: '/risk/aml/email', permissionPrefix: 'risk:aml:email', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'phone', functionName: '手机号AML', routePath: '/risk/aml/phone', permissionPrefix: 'risk:aml:phone', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'cardholderName', functionName: '持卡人姓名AML', routePath: '/risk/aml/cardholder-name', permissionPrefix: 'risk:aml:cardholderName', regionFunction: false, ruleFunction: false },
    { moduleType: 'AML', functionCode: 'sourceUrl', functionName: '来源网址AML', routePath: '/risk/aml/source-url', permissionPrefix: 'risk:aml:sourceUrl', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'cardNo', functionName: '卡号黑名单', routePath: '/risk/blacklist/card-no', permissionPrefix: 'risk:blacklist:cardNo', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'cardFingerprint', functionName: '卡指纹黑名单', routePath: '/risk/blacklist/card-fingerprint', permissionPrefix: 'risk:blacklist:cardFingerprint', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'cardBin', functionName: '卡BIN/区间黑名单', routePath: '/risk/blacklist/card-bin', permissionPrefix: 'risk:blacklist:cardBin', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'cardholderName', functionName: '持卡人姓名黑名单', routePath: '/risk/blacklist/cardholder-name', permissionPrefix: 'risk:blacklist:cardholderName', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'phone', functionName: '电话号码黑名单', routePath: '/risk/blacklist/phone', permissionPrefix: 'risk:blacklist:phone', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'ip', functionName: 'IP地址/区间黑名单', routePath: '/risk/blacklist/ip', permissionPrefix: 'risk:blacklist:ip', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'region', functionName: '高风险区域黑名单', routePath: '/risk/blacklist/region', permissionPrefix: 'risk:blacklist:region', regionFunction: true, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'email', functionName: '邮箱地址黑名单', routePath: '/risk/blacklist/email', permissionPrefix: 'risk:blacklist:email', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'emailUsername', functionName: '邮箱用户名黑名单', routePath: '/risk/blacklist/email-username', permissionPrefix: 'risk:blacklist:emailUsername', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'emailDomain', functionName: '邮箱域名黑名单', routePath: '/risk/blacklist/email-domain', permissionPrefix: 'risk:blacklist:emailDomain', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'billingAddress', functionName: '账单地址黑名单', routePath: '/risk/blacklist/billing-address', permissionPrefix: 'risk:blacklist:billingAddress', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'billingZip', functionName: '账单邮编黑名单', routePath: '/risk/blacklist/billing-zip', permissionPrefix: 'risk:blacklist:billingZip', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'billingCountry', functionName: '账单国家/地区黑名单', routePath: '/risk/blacklist/billing-country', permissionPrefix: 'risk:blacklist:billingCountry', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'shippingAddress', functionName: '收货地址黑名单', routePath: '/risk/blacklist/shipping-address', permissionPrefix: 'risk:blacklist:shippingAddress', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'shippingZip', functionName: '收货邮编黑名单', routePath: '/risk/blacklist/shipping-zip', permissionPrefix: 'risk:blacklist:shippingZip', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'shippingCountry', functionName: '收货国家/地区黑名单', routePath: '/risk/blacklist/shipping-country', permissionPrefix: 'risk:blacklist:shippingCountry', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'issuerCountry', functionName: '发卡行国家/地区黑名单', routePath: '/risk/blacklist/issuer-country', permissionPrefix: 'risk:blacklist:issuerCountry', regionFunction: false, ruleFunction: false },
    { moduleType: 'BLACK', functionCode: 'deviceFingerprint', functionName: '设备指纹黑名单', routePath: '/risk/blacklist/device-fingerprint', permissionPrefix: 'risk:blacklist:deviceFingerprint', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'merchant', functionName: '商户白名单', routePath: '/risk/whitelist/merchant', permissionPrefix: 'risk:whitelist:merchant', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'cardNo', functionName: '卡号白名单', routePath: '/risk/whitelist/card-no', permissionPrefix: 'risk:whitelist:cardNo', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'cardFingerprint', functionName: '卡指纹白名单', routePath: '/risk/whitelist/card-fingerprint', permissionPrefix: 'risk:whitelist:cardFingerprint', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'cardBin', functionName: '卡BIN/区间白名单', routePath: '/risk/whitelist/card-bin', permissionPrefix: 'risk:whitelist:cardBin', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'ip', functionName: 'IP地址白名单', routePath: '/risk/whitelist/ip', permissionPrefix: 'risk:whitelist:ip', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'tradeCountry', functionName: '交易国家/地区白名单', routePath: '/risk/whitelist/trade-country', permissionPrefix: 'risk:whitelist:tradeCountry', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'issuerCountry', functionName: '发卡行国家/地区白名单', routePath: '/risk/whitelist/issuer-country', permissionPrefix: 'risk:whitelist:issuerCountry', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'email', functionName: '邮箱地址白名单', routePath: '/risk/whitelist/email', permissionPrefix: 'risk:whitelist:email', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'emailDomain', functionName: '邮箱域名白名单', routePath: '/risk/whitelist/email-domain', permissionPrefix: 'risk:whitelist:emailDomain', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'phone', functionName: '手机号白名单', routePath: '/risk/whitelist/phone', permissionPrefix: 'risk:whitelist:phone', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'customerId', functionName: 'Customer ID 白名单', routePath: '/risk/whitelist/customer-id', permissionPrefix: 'risk:whitelist:customerId', regionFunction: false, ruleFunction: false },
    { moduleType: 'WHITE', functionCode: 'deviceFingerprint', functionName: '设备指纹白名单', routePath: '/risk/whitelist/device-fingerprint', permissionPrefix: 'risk:whitelist:deviceFingerprint', regionFunction: false, ruleFunction: false },
    { moduleType: 'RULE', functionCode: 'sourceUrl', functionName: '商户来源网址限定', routePath: '/risk/rule/source-url', permissionPrefix: 'risk:rule:sourceUrl', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'merchantLimit', functionName: '商户交易限额管理', routePath: '/risk/rule/merchant-limit', permissionPrefix: 'risk:rule:merchantLimit', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'frequency', functionName: '交易频率限定', routePath: '/risk/rule/frequency', permissionPrefix: 'risk:rule:frequency', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'tradeCountry', functionName: '商户交易国家限定', routePath: '/risk/rule/trade-country', permissionPrefix: 'risk:rule:tradeCountry', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'issuerCountry', functionName: '发卡行国家限定', routePath: '/risk/rule/issuer-country', permissionPrefix: 'risk:rule:issuerCountry', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'cardBin', functionName: '卡BIN交易规则', routePath: '/risk/rule/card-bin', permissionPrefix: 'risk:rule:cardBin', regionFunction: false, ruleFunction: true },
    { moduleType: 'RULE', functionCode: 'threeDs', functionName: '3DS规则管理', routePath: '/risk/rule/3ds', permissionPrefix: 'risk:rule:threeDs', regionFunction: false, ruleFunction: true },
];

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
        return profile('region', '区域', '请选择国家、州/省、城市', false, false, true, false, false, true, 'region', false, false);
    }
    if (code === 'merchant') return profile('merchant', '商户号', '请选择商户', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'cardNo' || code === 'card') return profile('card', '卡号', '请输入完整卡号', true, false, false, true, false, false, 'plain', false, true);
    if (code === 'cardFingerprint') return profile('cardFingerprint', '卡指纹', '请输入卡指纹', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'cardBin') return profile('cardBin', '卡BIN/区间', '请输入 6-11 位 BIN', true, true, false, true, false, false, 'range', false, false, 'cardBin');
    if (code === 'ip') return profile('ip', definition.moduleType === 'WHITE' ? 'IP地址' : 'IP地址/区间', '请输入 IP 地址', true, definition.moduleType !== 'WHITE', definition.moduleType !== 'BLACK', false, false, false, 'range', definition.moduleType !== 'WHITE', false, 'ip');
    if (code.includes('Country') || code === 'country') return profile('country', '国家/地区', '请选择国家/地区', false, false, true, false, false, false, 'country', false, false);
    if (code === 'email') return profile('email', '邮箱地址', '请输入邮箱地址', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'emailDomain') return profile('emailDomain', '邮箱域名', '请输入邮箱域名', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'emailUsername') return profile('emailUsername', '邮箱用户名', '请输入邮箱用户名', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'phone') return profile('phone', '手机号', '请输入手机号', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'cardholderName') return profile('name', '持卡人姓名', '请输入持卡人姓名', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'billingAddress') return profile('address', '账单地址', '请输入账单地址', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'billingZip') return profile('zip', '账单邮编', '请输入账单邮编', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'shippingAddress') return profile('address', '收货地址', '请输入收货地址', true, false, false, false, false, false, 'plain', false, false);
    if (code === 'shippingZip') return profile('zip', '收货邮编', '请输入收货邮编', true, false, false, false, false, false, 'plain', false, false);
    if (code.includes('Address')) return profile('address', '地址', '请输入地址关键字', true, false, true, false, false, false, 'plain', false, true);
    if (code.includes('Zip')) return profile('zip', '邮编', '请输入邮编', true, false, true, false, false, false, 'plain', false, false);
    if (code === 'deviceFingerprint') return profile('device', '设备指纹', '请输入设备指纹', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'customerId') return profile('customer', 'Customer ID', '请输入 Customer ID', true, false, false, false, false, false, 'plain', false, true);
    if (code === 'sourceUrl') return profile('sourceUrl', '来源网址', '请输入来源网址或域名', true, false, false, false, false, false, 'plain', false, false);
    return profile('card', '匹配值', '请输入匹配值', true, false, true, false, false, false, 'plain', false, false);
}

export function resolveRiskRuleProfile(definition: RiskFunctionDefinition): RiskRuleProfile {
    const code = definition.functionCode;
    if (code === 'sourceUrl') return ruleProfile('sourceUrl', '来源网址', '请输入来源网址或域名', true, true, false, false, false, false, false, false, false);
    if (code === 'merchantLimit') return ruleProfile('merchantLimit', '限额对象', '可填写商户、卡品牌或场景', false, false, true, true, true, false, false, false, false);
    if (code === 'frequency') return ruleProfile('frequency', '频率元素', '请输入卡号、IP、邮箱等元素', false, true, false, false, false, true, true, false, false);
    if (code === 'tradeCountry') return ruleProfile('country', '交易国家/地区', '请选择交易国家/地区', false, false, false, false, false, false, false, true, false);
    if (code === 'issuerCountry') return ruleProfile('issuerCountry', '发卡行国家/地区', '请选择发卡行国家/地区', false, false, false, false, false, false, false, true, false);
    if (code === 'cardBin') return ruleProfile('cardBin', '卡BIN/区间', '请输入 BIN 或 BIN 区间', false, true, false, false, false, false, false, false, true);
    if (code === 'threeDs') return ruleProfile('threeDs', '3DS触发条件', '请输入 3DS 条件', true, true, true, true, true, false, true, false, true);
    return ruleProfile('sourceUrl', '规则匹配值', '请输入匹配值', true, true, true, true, true, true, true, true, false);
}

function profile(
    kind: RiskListProfileKind,
    valueLabel: string,
    valuePlaceholder: string,
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
    return { kind, valueLabel, valuePlaceholder, showValue, showRange, showCountry, showCardBrand, showHash, showRegion, valueInputType, allowIpRange, sensitive, rangeKind };
}

function ruleProfile(
    kind: RiskRuleProfileKind,
    matchLabel: string,
    matchPlaceholder: string,
    showMatchMode: boolean,
    showMatchValue: boolean,
    showLimitType: boolean,
    showAmount: boolean,
    showCurrency: boolean,
    showFrequency: boolean,
    showElements: boolean,
    showCountry: boolean,
    showCardBrand: boolean,
): RiskRuleProfile {
    return { kind, matchLabel, matchPlaceholder, showMatchMode, showMatchValue, showLimitType, showAmount, showCurrency, showFrequency, showElements, showCountry, showCardBrand };
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
    return t ? riskOptionLabel(t, 'status', status) : status === 1 ? '启用' : '停用';
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
