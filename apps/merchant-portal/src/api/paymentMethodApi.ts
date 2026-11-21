import { unwrapResult, type CommonResult, type PageResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface PaymentMethodRow {
  itemKey: string;
  name: string;
  catalogEnabled: boolean;
  requestable: boolean;
  authorizationStatus?: string | null;
  authorizationVersion?: string | null;
  effectiveTime?: string | null;
  expireTime?: string | null;
  applicationStatus?: string | null;
  applicationItemId?: string | null;
  applicationVersion?: string | null;
  businessReadiness?: 'READY' | 'CONDITIONAL' | 'BLOCKED' | 'UNKNOWN';
  reasonCodes?: string[];
  feeReference?: { versionId: string; versionNo: string; effectiveTime: string } | null;
}
export interface PaymentApplicationItem {
  id: string;
  itemKey: string;
  status: string;
  roundNo: number;
  version: string;
  source: string;
  operation: string;
  reason?: string | null;
  submittedAt?: string | null;
  reviewReason?: string | null;
  history?: PaymentMethodHistory[];
}
export interface PaymentApplication {
  applicationNo: string;
  merchantId: string;
  items: PaymentApplicationItem[];
}
export interface PaymentMethodHistory {
  id: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  reason?: string | null;
  roundNo?: number | null;
  occurredAt: string;
}
export interface PaymentMethodQuery {
  pageNo: number;
  pageSize: number;
  merchantId?: string;
  status?: string;
  itemKey?: string;
}
export interface PaymentMethodCommand {
  requestId: string;
  expectedVersion: string;
  reason?: string;
  effectiveTime?: string;
  expireTime?: string | null;
}
const admin = false;
const root = admin ? '/admin' : '/merchant';
function methodRoot(merchantId: string) {
  return admin
    ? `/admin/merchants/${encodeURIComponent(merchantId)}/payment-methods`
    : '/merchant/payment-methods';
}
async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await http.post<CommonResult<T>>(url, body);
  return unwrapResult(response.data);
}
async function get<T>(url: string, params?: unknown): Promise<T> {
  const response = await http.get<CommonResult<T>>(url, { params });
  return unwrapResult(response.data);
}
export const paymentMethodApi = {
  methods(merchantId: string, query: PaymentMethodQuery) {
    return post<PageResult<PaymentMethodRow>>(`${methodRoot(merchantId)}/search`, {
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      itemKey: query.itemKey,
    });
  },
  apply(merchantId: string, body: { requestId: string; items: string[]; reason?: string }) {
    return post<{ applicationNo: string; itemCount: number }>(
      admin
        ? `/admin/merchants/${encodeURIComponent(merchantId)}/payment-method-applications`
        : '/merchant/payment-method-applications',
      body,
    );
  },
  applications(query: PaymentMethodQuery) {
    const body = {
      pageNo: query.pageNo,
      pageSize: query.pageSize,
      status: query.status,
      itemKey: query.itemKey,
      ...(admin && query.merchantId ? { merchantId: query.merchantId } : {}),
    };
    return post<PageResult<PaymentApplication>>(
      admin
        ? '/admin/merchant-payment-applications/search'
        : '/merchant/payment-method-applications/search',
      body,
    );
  },
  application(applicationNo: string) {
    return get<PaymentApplication>(
      admin
        ? `/admin/merchant-payment-applications/${encodeURIComponent(applicationNo)}`
        : `/merchant/payment-method-applications/${encodeURIComponent(applicationNo)}`,
    );
  },
  resubmit(itemId: string, body: PaymentMethodCommand) {
    if (admin) throw new Error('Merchant-only payment-method command');
    return post<unknown>(
      `${root}/payment-method-application-items/${encodeURIComponent(itemId)}/resubmit`,
      body,
    );
  },
  withdraw(itemId: string, body: PaymentMethodCommand) {
    if (admin) throw new Error('Merchant-only payment-method command');
    return post<unknown>(
      `${root}/payment-method-application-items/${encodeURIComponent(itemId)}/withdraw`,
      body,
    );
  },
  decide(
    itemId: string,
    body: PaymentMethodCommand & { decision: 'APPROVE' | 'RETURN' | 'REJECT' },
  ) {
    if (!admin) throw new Error('Admin-only payment-method command');
    return post<unknown>(
      `/admin/merchant-payment-application-items/${encodeURIComponent(itemId)}/decisions`,
      body,
    );
  },
  lifecycle(
    merchantId: string,
    itemKey: string,
    action: 'suspend' | 'restore' | 'terminate' | 'validity',
    body: PaymentMethodCommand,
  ) {
    if (!admin) throw new Error('Admin-only payment-method command');
    return post<unknown>(
      `${methodRoot(merchantId)}/${encodeURIComponent(itemKey)}/${action}`,
      body,
    );
  },
  history(merchantId: string, itemKey: string, pageNo: number, pageSize: number) {
    if (!admin) throw new Error('Admin-only payment-method history');
    return get<PageResult<PaymentMethodHistory>>(
      `${methodRoot(merchantId)}/${encodeURIComponent(itemKey)}/history`,
      { pageNo, pageSize },
    );
  },
};
