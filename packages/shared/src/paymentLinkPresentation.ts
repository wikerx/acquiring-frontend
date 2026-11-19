/** 支付链接新建金额的产品限制；只校验字符串，不用浮点运算或自动舍入改变用户金额。 */
export function isPaymentLinkAmountValid(value: string, currencyExponent = 2): boolean {
  const precision = Math.min(2, Math.max(0, currencyExponent));
  const pattern =
    precision === 0
      ? /^[1-9][0-9]{0,5}$/
      : new RegExp(`^[1-9][0-9]{0,5}(\\.[0-9]{1,${precision}})?$`);
  return pattern.test(value);
}

/** 默认币种只来自商户配置；缺失时由用户明确选择，不取字母排序的第一项。 */
export function paymentLinkDefaultCurrency(
  currencies: string[],
  settlementCurrency?: string,
): string {
  return settlementCurrency && currencies.includes(settlementCurrency) ? settlementCurrency : '';
}

/** 操作来源是应用/系统身份，不是创建人；未知来源不伪造名称。 */
export function paymentLinkActorSource(
  appCode: string | undefined,
  translate: (key: string) => string,
): string {
  return ['ADMIN', 'MERCHANT', 'PAYER', 'PAYMENT', 'SYSTEM'].includes(appCode || '')
    ? translate(`paymentLink.actorSources.${appCode}`)
    : translate('paymentLink.unknownSource');
}

/** 姓名来自后端受权限保护的投影；付款人始终使用匿名身份。 */
export function paymentLinkOperatorName(
  appCode: string | undefined,
  actorId: string | undefined,
  actorName: string | undefined,
  translate: (key: string, values?: Record<string, string>) => string,
): string {
  if (appCode === 'PAYER') return translate('paymentLink.linkHolder');
  if (appCode === 'PAYMENT' || appCode === 'SYSTEM') return translate('paymentLink.systemOperator');
  if (actorName?.trim()) return actorName;
  return actorId ? translate('paymentLink.accountIdentity', { id: actorId }) : '—';
}
