import type { AxiosInstance } from 'axios';
import type { CommonResult, PageResult } from './index';
import { unwrapResult } from './index';

export type PaymentLinkStatus = 'ACTIVE' | 'DISABLED' | 'EXPIRED' | 'COMPLETED';
export interface PaymentLinkQuery {
  merchantId?: string;
  linkId?: string;
  merchantOrderNo?: string;
  status?: PaymentLinkStatus | '';
  currency?: string;
  channelCode?: string;
  createTimeFrom?: string;
  createTimeTo?: string;
  pageNo?: number;
  pageSize?: number;
}
export interface PaymentLinkFilterOptions {
  currencies: string[];
  channels?: Array<{ channelCode: string; channelName: string }>;
}
export interface PaymentLinkCreate {
  requestId: string;
  linkName: string;
  merchantOrderNo?: string;
  description?: string;
  currency: string;
  amount: string;
  expireMinutes?: number;
  expireTime?: string;
  locale: string;
  cardBrands?: string[];
  paymentMethodKeys?: string[];
  notifyUrl?: string;
  redirectUrl?: string;
}
export interface PaymentLinkView {
  linkId: string;
  merchantId: string;
  merchantOrderNo: string;
  linkName: string;
  description?: string;
  merchantDisplayName: string;
  currency: string;
  amount: string;
  currencyExponent: number;
  locale: string;
  cardBrands?: string[];
  paymentMethodKeys?: string[] | null;
  status: PaymentLinkStatus;
  paymentStatus: string;
  paymentAvailable?: boolean;
  attemptCount: number;
  transactionId?: string;
  transactionDateTime?: string;
  expireTime: string;
  createTime: string;
  paidTime?: string;
  createdAppCode: string;
  createdBy: string;
  createdByName?: string;
  disableReason?: string;
  version: number;
  notifyUrl?: string;
  redirectUrl?: string;
}
export interface PaymentLinkOptions {
  defaultCurrency?: string;
  currencyExponents: Record<string, number>;
  merchantId: string;
  merchantDisplayName: string;
  currencies: string[];
  cardBrands: string[];
  paymentMethodsByCurrency?: Record<string, string[]>;
  paymentMethodKeysByCurrency?: Record<string, string[]> | null;
  cardBrandsByCurrency: Record<string, string[]>;
  locales: string[];
  minExpireMinutes: number;
  maxExpireMinutes: number;
}
export interface PaymentLinkSummary {
  total: number;
  active: number;
  completed: number;
  processing: number;
  failedAttempts: number;
  successfulAmounts: Record<string, string>;
}
export interface PaymentLinkCollection {
  collectionId: string;
  linkId: string;
  merchantOrderNo: string;
  checkoutSessionId?: string;
  paymentStatus: string;
  submissionDeadline: string;
  createTime: string;
}
export interface PaymentLinkAttempt {
  checkoutAttemptId: string;
  attemptNo: number;
  transactionId?: string;
  transactionDateTime?: string;
  status: string;
  paymentMethod: string;
  cardBrand?: string;
  currency: string;
  amount: string;
  currencyExponent: number;
  createTime: string;
}
export interface PaymentLinkDelivery {
  requestId: string;
  recipientMasked: string;
  locale: string;
  sendStatus: number | null;
  emailRecordId?: number;
  createdAppCode: string;
  createdBy: string;
  createdByName?: string;
  createTime: string;
}
export interface PaymentLinkEvent {
  eventId: string;
  eventType: string;
  actorAppCode: string;
  actorId?: string;
  actorName?: string;
  reason?: string;
  createTime: string;
}
export interface PaymentLinkApi {
  filterOptions(): Promise<PaymentLinkFilterOptions>;
  search(query: PaymentLinkQuery): Promise<PageResult<PaymentLinkView>>;
  summary(query: PaymentLinkQuery): Promise<PaymentLinkSummary>;
  options(merchantId?: string): Promise<PaymentLinkOptions>;
  create(input: PaymentLinkCreate, merchantId?: string): Promise<PaymentLinkView>;
  detail(linkId: string): Promise<PaymentLinkView>;
  share(linkId: string): Promise<{ url: string }>;
  disable(
    linkId: string,
    input: { requestId: string; version: number; reason: string },
  ): Promise<PaymentLinkView>;
  sendEmail(
    linkId: string,
    input: { requestId: string; email: string; locale: string },
  ): Promise<PaymentLinkDelivery>;
  collections(linkId: string, query: PaymentLinkQuery): Promise<PageResult<PaymentLinkCollection>>;
  attempts(linkId: string, query: PaymentLinkQuery): Promise<PageResult<PaymentLinkAttempt>>;
  deliveries(linkId: string, query: PaymentLinkQuery): Promise<PageResult<PaymentLinkDelivery>>;
  events(linkId: string, query: PaymentLinkQuery): Promise<PageResult<PaymentLinkEvent>>;
  export(query: PaymentLinkQuery, requestId: string, timezone?: string): Promise<unknown>;
}

/** 只合并同一登录主体和语言的在途读取，成功/失败后立即释放，不缓存业务事实。 */
export function createPaymentLinkApi(
  http: AxiosInstance,
  scope: 'admin' | 'merchant',
  context: () => string,
): PaymentLinkApi {
  const base = `/${scope}/transactions/payment-links`;
  const reads = new Map<string, Promise<unknown>>();
  const post = async <T>(path: string, body: unknown, merchantId?: string): Promise<T> =>
    unwrapResult(
      (
        await http.post<CommonResult<T>>(base + path, body, {
          params: merchantId ? { merchantId } : undefined,
        })
      ).data,
    );
  function read<T>(path: string, body: unknown, merchantId?: string): Promise<T> {
    const key = JSON.stringify([context(), path, body, merchantId]);
    const existing = reads.get(key);
    if (existing) return existing as Promise<T>;
    const request = post<T>(path, body, merchantId).finally(() => reads.delete(key));
    reads.set(key, request);
    return request;
  }
  return {
    filterOptions: () => read('/filter-options', {}),
    search: (query) => read('/search', query),
    summary: (query) => read('/summary', query),
    options: (merchantId) => read('/options', {}, merchantId),
    create: (input, merchantId) => post('', input, scope === 'admin' ? merchantId : undefined),
    detail: async (id) =>
      unwrapResult(
        (await http.get<CommonResult<PaymentLinkView>>(`${base}/${encodeURIComponent(id)}`)).data,
      ),
    share: (id) => post(`/${encodeURIComponent(id)}/share`, {}),
    disable: (id, input) => post(`/${encodeURIComponent(id)}/disable`, input),
    sendEmail: (id, input) => post(`/${encodeURIComponent(id)}/send-email`, input),
    collections: (id, query) => read(`/${encodeURIComponent(id)}/collections/search`, query),
    attempts: (id, query) => read(`/${encodeURIComponent(id)}/transactions/search`, query),
    deliveries: (id, query) => read(`/${encodeURIComponent(id)}/deliveries/search`, query),
    events: (id, query) => read(`/${encodeURIComponent(id)}/events/search`, query),
    export: (query, requestId, timezone) => post('/export', { query, requestId, timezone }),
  };
}

export function newPaymentLinkRequestId(): string {
  return globalThis.crypto.randomUUID();
}

/** 旧版选项可省略新版范围或返回 null；新版显式返回的空对象和空列表仍为有效范围。 */
export function paymentLinkUsesMethodKeys(options?: PaymentLinkOptions): boolean {
  const methodKeysByCurrency = options?.paymentMethodKeysByCurrency;
  return methodKeysByCurrency !== undefined && methodKeysByCurrency !== null;
}

export function paymentLinkCurrentMethodKeys(
  options: PaymentLinkOptions | undefined,
  currency: string,
): string[] {
  const keys = options?.paymentMethodKeysByCurrency?.[currency] || [];
  return [
    ...new Set(
      keys.filter((key) => {
        if (!/^(CARD_BRAND|METHOD):[A-Z][A-Z0-9_]*$/.test(key)) return false;
        const [kind, value] = key.split(':');
        return (
          !['ALL', 'NONE', 'UNKNOWN'].includes(value) &&
          !(kind === 'METHOD' && value === 'BANK_CARD')
        );
      }),
    ),
  ];
}

/** 旧链接的空值沿用已保存的银行卡范围，新链接的显式空集合保持为空。 */
export function paymentLinkViewMethodKeys(link: Pick<PaymentLinkView, 'paymentMethodKeys' | 'cardBrands'>): string[] {
  return link.paymentMethodKeys ?? (link.cardBrands ?? []).map((brand) => `CARD_BRAND:${brand}`);
}

/** 创建协议只发送一种范围表达，保留请求键与金额/截止时间原始事实。 */
export function paymentLinkCreateWithScope(
  input: PaymentLinkCreate,
  useMethodKeys: boolean,
): PaymentLinkCreate {
  const { cardBrands, paymentMethodKeys, ...common } = input;
  return useMethodKeys
    ? { ...common, paymentMethodKeys: [...(paymentMethodKeys || [])] }
    : { ...common, cardBrands: [...(cardBrands || [])] };
}
