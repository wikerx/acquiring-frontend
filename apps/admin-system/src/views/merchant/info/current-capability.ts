import type { MerchantCurrentBusinessCapability, MerchantPaymentCapability } from '@/api/merchant/info';

const capabilityIssueKeys = ['routeConflicts', 'feeGaps', 'feeAmbiguities'] as const;
const initiatingTransactionTypes = new Set(['PAYMENT', 'AUTHORIZATION', 'PRE_AUTHORIZATION']);
type CapabilityIssueKey = typeof capabilityIssueKeys[number];

interface CapabilityIssue {
  key: CapabilityIssueKey;
  transactionType: string;
  currencies: Set<string>;
}

interface PaymentMethodSummary {
  key: string;
  paymentType: string;
  paymentMethod: string;
  hasInitiatingCombination: boolean;
  hasUsableInitiatingCombination: boolean;
  hasUsableCombination: boolean;
  issues: Map<string, CapabilityIssue>;
}

function capabilityKey(capability: MerchantPaymentCapability) {
  return JSON.stringify([
    capability.transactionType, capability.paymentType, capability.paymentMethod, capability.currency,
  ]);
}

/** 汇总到支付方式，路由、费率异常仍按后端返回的原始组合匹配。 */
export function summarizeCurrentCapabilities(data?: MerchantCurrentBusinessCapability | null) {
  const methods = new Map<string, PaymentMethodSummary>();
  const actions = new Set<string>();
  const issueKeys = capabilityIssueKeys.map((issue) => ({
    issue,
    rows: new Set((data?.[issue] ?? []).map(capabilityKey)),
  }));

  for (const row of data?.capabilities ?? []) {
    if (row.transactionType) actions.add(row.transactionType);
    const paymentType = row.paymentType?.trim().toUpperCase();
    const method = row.paymentMethod?.trim().toUpperCase();
    if (!paymentType) continue;
    const paymentMethod = !method || method === 'ALL' ? paymentType : method;

    const key = `${paymentType}:${paymentMethod}`;
    const entry = methods.get(key) ?? {
      key,
      paymentType,
      paymentMethod,
      hasInitiatingCombination: false,
      hasUsableInitiatingCombination: false,
      hasUsableCombination: false,
      issues: new Map<string, CapabilityIssue>(),
    };
    const rowKey = capabilityKey(row);
    const matchingIssues = issueKeys.filter(({ rows }) => rows.has(rowKey));
    const canInitiate = initiatingTransactionTypes.has(row.transactionType);
    const usable = matchingIssues.length === 0;
    entry.hasInitiatingCombination ||= canInitiate;
    entry.hasUsableInitiatingCombination ||= canInitiate && usable;
    entry.hasUsableCombination ||= usable;

    for (const { issue } of matchingIssues) {
      const issueKey = `${issue}:${row.transactionType}`;
      const detail = entry.issues.get(issueKey) ?? {
        key: issue, transactionType: row.transactionType, currencies: new Set<string>(),
      };
      if (row.currency) detail.currencies.add(row.currency);
      entry.issues.set(issueKey, detail);
    }
    methods.set(key, entry);
  }

  return {
    methods: [...methods.values()].sort((left, right) =>
      left.paymentType.localeCompare(right.paymentType) || left.paymentMethod.localeCompare(right.paymentMethod))
      .map(({ key, paymentType, paymentMethod, hasInitiatingCombination, hasUsableInitiatingCombination, hasUsableCombination, issues }) => {
        // 已配置发起动作时，仅可退款等后续动作不会把整个方式显示为可用。
        const configured = hasInitiatingCombination ? hasUsableInitiatingCombination : hasUsableCombination;
        return {
          key,
          paymentType,
          paymentMethod,
          configured,
          followUpOnly: configured && !hasInitiatingCombination,
          issues: [...issues.values()].map((issue) => ({ ...issue, currencies: [...issue.currencies].sort() })),
        };
      }),
    actions: [...actions],
  };
}

/** 将旧响应、空值和查询异常明确区分，只有完整的结果能够展示计数。 */
export function currentCapabilityState(
  capability: MerchantCurrentBusinessCapability | null | undefined,
  loading = false,
  failed = false,
) {
  if (loading) return 'LOADING';
  if (failed || capability?.evaluationStatus === 'UNAVAILABLE') return 'UNAVAILABLE';
  if (capability?.evaluationStatus !== 'EVALUATED') return 'NOT_EVALUATED';
  const active = capability.activeBindingCount;
  const unavailable = capability.unavailableBindingCount;
  if (typeof active !== 'number' || !Number.isInteger(active) || active < 0
    || typeof unavailable !== 'number' || !Number.isInteger(unavailable)
    || unavailable < 0 || unavailable > active) {
    return 'UNAVAILABLE';
  }
  return 'EVALUATED';
}
