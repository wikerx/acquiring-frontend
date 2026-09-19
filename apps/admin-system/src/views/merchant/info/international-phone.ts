/**
 * 将历史拆分存储的国家区号与联系电话合并为统一国际号码。
 * 已包含“+”前缀的完整号码优先，避免重复拼接国家区号。
 */
export function normalizeInternationalPhone(
  phoneCountryCode?: string,
  contactPhone?: string,
): string {
  const phone = contactPhone?.trim() || '';
  if (!phone) return '';

  const countryCode = phoneCountryCode?.trim() || '';
  const combined = phone.startsWith('+') || !countryCode ? phone : `${countryCode}${phone}`;
  return combined.replace(/[\s()-]/g, '');
}

/** 按 E.164 长度范围校验完整国际电话号码。 */
export function isCompleteInternationalPhone(value?: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(normalizeInternationalPhone(undefined, value));
}
