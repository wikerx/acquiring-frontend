/** 所有传入支付方式都参与展示；银行卡只展示接口明确返回的品牌，不补造固定卡列表。 */
export function checkoutPaymentLogoKeys<T extends string>(
  methods: Array<{ paymentMethod: string; brands?: string[] }>,
  resolve: (method?: string, brand?: string) => T[],
): T[] {
  return [
    ...new Set(
      methods.flatMap(({ paymentMethod, brands }) =>
        paymentMethod.toUpperCase() === 'BANK_CARD'
          ? (brands || []).flatMap((brand) => resolve('', brand))
          : resolve(paymentMethod),
      ),
    ),
  ];
}

/** 轮转展示商户完整能力；兼容旧接口时才回退会话范围，不改变会话付款授权。 */
export function checkoutMerchantLogoKeys<T extends string>(
  merchant: { supportedPaymentMethods?: string[]; supportedCardBrands?: string[] } | undefined,
  sessionMethods: Array<{ paymentMethod: string; brands?: string[] }>,
  resolve: (method?: string, brand?: string) => T[],
): T[] {
  return checkoutPaymentLogoKeys(
    merchant?.supportedPaymentMethods?.length
      ? merchant.supportedPaymentMethods.map((paymentMethod) => ({
          paymentMethod,
          brands: merchant.supportedCardBrands,
        }))
      : sessionMethods,
    resolve,
  );
}

/** 结果页只依据本次结果显示品牌；品牌缺失时使用通用方式图案，不用 Visa 兜底。 */
export function checkoutResultLogoKeys<T extends string>(
  method: string | undefined,
  brand: string | undefined,
  resolve: (method?: string, brand?: string) => T[],
  bankCardFallback: T[] = [],
): T[] {
  if (method?.toUpperCase() === 'BANK_CARD') {
    const brandLogos = brand ? resolve('', brand) : [];
    return brandLogos.length ? brandLogos : bankCardFallback;
  }
  return method ? resolve(method, brand) : [];
}

/** 系统订单和付款尝试分别命名；缺少已落库订单时，回执只引用真实的尝试身份。 */
export function checkoutReceiptIdentity(
  systemOrderNo: string | undefined,
  attemptId: string | undefined,
) {
  return systemOrderNo
    ? { kind: 'systemOrder' as const, value: systemOrderNo }
    : { kind: 'attempt' as const, value: attemptId || '—' };
}

/** 默认美国；同时接受字典的两位代码和付款契约的三位代码，不依赖字典排序。 */
export function checkoutCountryCode(
  countries: Array<{ countryCode: string; countryCodeAlpha3: string }>,
  supplied?: string,
): string {
  const code = supplied?.trim().toUpperCase();
  return (
    countries.find((country) => country.countryCode === code || country.countryCodeAlpha3 === code)
      ?.countryCodeAlpha3 ||
    countries.find((country) => country.countryCodeAlpha3 === 'USA')?.countryCodeAlpha3 ||
    ''
  );
}
