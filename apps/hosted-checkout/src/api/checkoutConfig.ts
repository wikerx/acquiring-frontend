export interface CheckoutCountryConfig {
    countryCode: string;
    countryName: string;
    countryNameLocal: string;
    flagIconUrl: string;
    defaultLanguage: 'en-US' | 'zh-CN';
    supportedLanguages: Array<'en-US' | 'zh-CN'>;
    sortNo: number;
}

const CHECKOUT_COUNTRIES: CheckoutCountryConfig[] = [
    {
        countryCode: 'USA',
        countryName: 'United States',
        countryNameLocal: 'United States',
        flagIconUrl: new URL('../assets/flags/us.svg', import.meta.url).href,
        defaultLanguage: 'en-US',
        supportedLanguages: ['en-US'],
        sortNo: 1,
    },
    {
        countryCode: 'CHN',
        countryName: 'China',
        countryNameLocal: '中国',
        flagIconUrl: new URL('../assets/flags/cn.svg', import.meta.url).href,
        defaultLanguage: 'zh-CN',
        supportedLanguages: ['zh-CN', 'en-US'],
        sortNo: 2,
    },
];

export async function listCheckoutCountries(): Promise<CheckoutCountryConfig[]> {
    return CHECKOUT_COUNTRIES.map((country) => ({
        ...country,
        supportedLanguages: [...country.supportedLanguages],
    }));
}
