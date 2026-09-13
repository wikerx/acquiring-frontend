import { shallowRef } from 'vue';

export interface CurrencyPresentation {
    alphabeticCode: string;
    chineseName?: string | null;
    englishName?: string | null;
    currencySymbol?: string | null;
    iconKey?: string | null;
}

export interface ResolvedCurrencyPresentation extends CurrencyPresentation {
    alphabeticCode: string;
    displayName: string;
    iconKey: string;
    iconType: 'flag' | 'currency';
    iconText: string;
}

const presentationMap = shallowRef(new Map<string, CurrencyPresentation>());

const DEFAULT_ICON_KEYS: Record<string, string> = {
    AED: 'flag:AE', AUD: 'flag:AU', BRL: 'flag:BR', CAD: 'flag:CA', CHF: 'flag:CH',
    CNY: 'flag:CN', EUR: 'flag:EU', GBP: 'flag:GB', HKD: 'flag:HK', IDR: 'flag:ID',
    INR: 'flag:IN', JPY: 'flag:JP', KRW: 'flag:KR', MXN: 'flag:MX', MYR: 'flag:MY',
    NZD: 'flag:NZ', PHP: 'flag:PH', RUB: 'flag:RU', SAR: 'flag:SA', SGD: 'flag:SG',
    THB: 'flag:TH', TRY: 'flag:TR', TWD: 'flag:TW', USD: 'flag:US', VND: 'flag:VN',
    XAF: 'currency:XAF', XAG: 'currency:XAG', XAU: 'currency:XAU', XCD: 'currency:XCD',
    XOF: 'currency:XOF', XPD: 'currency:XPD', XPT: 'currency:XPT', XXX: 'currency:XXX',
    ZAR: 'flag:ZA',
};

const ASSET_SYMBOLS: Record<string, string> = {
    XAG: 'Ag',
    XAU: 'Au',
    XPD: 'Pd',
    XPT: 'Pt',
    XXX: '¤',
};

export function setCurrencyPresentations(items?: CurrencyPresentation[] | null) {
    const next = new Map<string, CurrencyPresentation>();
    (items || []).forEach((item) => {
        const code = normalizeCurrencyCode(item.alphabeticCode);
        if (!code) return;
        next.set(code, { ...item, alphabeticCode: code, iconKey: normalizeIconKey(item.iconKey, code) });
    });
    presentationMap.value = next;
}

export function resolveCurrencyPresentation(
    currency?: string | null,
    locale = 'zh-CN',
    overrides?: Partial<CurrencyPresentation>,
): ResolvedCurrencyPresentation {
    const code = normalizeCurrencyCode(currency) || '---';
    const configured = {
        ...presentationMap.value.get(code),
        ...definedPresentationValues(overrides),
    };
    const iconKey = normalizeIconKey(configured.iconKey, code)
        || DEFAULT_ICON_KEYS[code]
        || `currency:${code}`;
    const [iconType, iconValue] = iconKey.split(':', 2) as ['flag' | 'currency', string];
    return {
        alphabeticCode: code,
        chineseName: configured.chineseName,
        englishName: configured.englishName,
        currencySymbol: configured.currencySymbol,
        iconKey,
        iconType,
        iconText: iconType === 'flag'
            ? countryCodeToFlag(iconValue)
            : ASSET_SYMBOLS[code] || configured.currencySymbol || compactCurrencyCode(code),
        displayName: locale.toLowerCase().startsWith('zh')
            ? configured.chineseName || configured.englishName || code
            : configured.englishName || configured.chineseName || code,
    };
}

function definedPresentationValues(overrides?: Partial<CurrencyPresentation>) {
    if (!overrides) return {};
    return Object.fromEntries(Object.entries(overrides).filter(([, value]) => (
        value !== undefined && value !== null && value !== ''
    ))) as Partial<CurrencyPresentation>;
}

export function suggestedCurrencyIconKey(currency?: string | null) {
    const code = normalizeCurrencyCode(currency);
    return DEFAULT_ICON_KEYS[code] || (code ? `currency:${code}` : '');
}

export function normalizeCurrencyCode(value?: string | null) {
    return String(value || '').trim().toUpperCase();
}

export function normalizeIconKey(value?: string | null, currency?: string | null) {
    const normalized = String(value || '').trim();
    const flagMatch = /^flag:([a-z]{2})$/i.exec(normalized);
    if (flagMatch) return `flag:${flagMatch[1].toUpperCase()}`;
    const currencyMatch = /^currency:([a-z0-9]{3,12})$/i.exec(normalized);
    if (!currencyMatch) return '';
    const iconCurrency = currencyMatch[1].toUpperCase();
    const expectedCurrency = normalizeCurrencyCode(currency);
    return expectedCurrency && expectedCurrency !== iconCurrency ? '' : `currency:${iconCurrency}`;
}

function countryCodeToFlag(countryCode: string) {
    const code = countryCode.toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return '¤';
    return String.fromCodePoint(...Array.from(code).map((character) => 127397 + character.charCodeAt(0)));
}

function compactCurrencyCode(code: string) {
    return code.length <= 3 ? code : code.slice(0, 3);
}
