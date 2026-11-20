import type { MerchantPaymentCapabilityCheck } from '@/api/accessConfigApi';

const metricKeys = [
  'authorizedCount',
  'legacyCoverageCount',
  'configurationReadyCount',
  'pendingConfigurationCount',
  'restrictedCount',
  'executionReadyCount',
] as const;
/** 只有服务端完成评估才展示新计数；未知值保持未知，不用旧配置数量补齐。 */
export function paymentCapabilityMetrics(check?: MerchantPaymentCapabilityCheck) {
  if (check?.assessmentStatus !== 'EVALUATED') return [];
  return metricKeys.map((key) => ({
    key,
    value:
      typeof check[key] === 'number' && Number.isSafeInteger(check[key]) && check[key]! >= 0
        ? check[key]!
        : null,
  }));
}
