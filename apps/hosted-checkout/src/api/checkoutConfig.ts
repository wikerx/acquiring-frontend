import axios from 'axios';
import type { CommonResult } from '@acquiring/shared';

export interface CheckoutCountryConfig {
    countryCode: string;
    countryName: string;
    countryNameLocal: string;
    flagIconUrl: string;
    defaultLanguage: 'en-US' | 'zh-CN';
    supportedLanguages: Array<'en-US' | 'zh-CN'>;
    sortNo: number;
}

export async function listCheckoutCountries(): Promise<CheckoutCountryConfig[]> {
    const result = await axios.get<CommonResult<CheckoutCountryConfig[]>>('/checkout/config/countries');
    if (result.data.code !== 'T200' && result.data.code !== 'SUCCESS') {
        throw new Error(result.data.message || 'Request failed');
    }
    return result.data.data || [];
}
