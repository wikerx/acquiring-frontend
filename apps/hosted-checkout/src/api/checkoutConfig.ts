import axios from 'axios';

export interface CheckoutCountryConfig {
  /** 展示配置保留现有 alpha-2 代码。 */
  countryCode: string;
  /** 付款契约要求 alpha-3，不能直接提交展示用的两位代码。 */
  countryCodeAlpha3: string;
  countryName: string;
  countryNameLocal: string;
  flagIconUrl: string;
  defaultLanguage: 'en-US' | 'zh-CN';
  supportedLanguages: Array<'en-US' | 'zh-CN'>;
  sortNo: number;
}

export async function listCheckoutCountries(): Promise<CheckoutCountryConfig[]> {
  const response = await axios.get<{ code: string; data: CheckoutCountryConfig[] }>(
    '/checkout/config/countries',
  );
  if (
    response.data.code !== 'SUCCESS' ||
    !Array.isArray(response.data.data) ||
    response.data.data.some((country) => !/^[A-Z]{3}$/.test(country.countryCodeAlpha3))
  ) {
    throw new Error('checkout country configuration unavailable');
  }
  return response.data.data;
}
