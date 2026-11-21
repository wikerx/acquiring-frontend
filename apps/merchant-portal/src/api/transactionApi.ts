import type {
  CommonResult,
  RefundContext,
  PageResult,
  TransactionAnalyticsFailure,
  TransactionAnalyticsOverview,
  TransactionAnalyticsQuery,
} from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from './http';

export interface TransactionPageQuery {
  pageNo?: number;
  pageSize?: number;
  merchantOrderNo?: string;
  transactionId?: string;
  sourceTransactionId?: string;
  transactionType?: string;
  transactionStatus?: string;
  paymentMethod?: string;
  paymentBrand?: string;
  merchantResponseCode?: string;
  settlementStatus?: string;
  beginTime?: string;
  endTime?: string;
  queryTimeZone?: string;
}

export interface TransactionOrder {
  operationId?: string;
  rootTransactionId?: string;
  latestTransactionId?: string;
  merchantId?: string;
  merchantOrderNo?: string;
  merchantOrderId?: string;
  paymentMethod?: string;
  paymentBrand?: string;
  cardBin?: string;
  cardNumberMasked?: string;
  authCode?: string;
  transactionType?: string;
  transactionStatus?: string;
  lifecycleStatus?: string;
  lifecycleStatusMessage?: string;
  processStage?: string;
  labelCurrency?: string;
  labelAmount?: number | string;
  currentAmount?: number | string;
  currentCurrency?: string;
  currencyExponent?: number;
  threeDsEnabled?: number;
  merchantResponseCode?: string;
  merchantResponseMessage?: string;
  authorizedAmount?: number | string;
  capturedAmount?: number | string;
  refundedAmount?: number | string;
  availableCaptureAmount?: number | string;
  availableRefundAmount?: number | string;
  settlementStatus?: string;
  accountingStatus?: string;
  transactionDateTime: string;
  rootTransactionDateTime: string;
  transactionTimeZone?: string;
}

export interface TransactionOperation {
  availableActions?: string[];
  refundContext?: import("@acquiring/shared").RefundContext;
  operationId?: string;
  transactionId?: string;
  sourceTransactionId?: string;
  merchantId?: string;
  merchantOrderNo?: string;
  merchantOrderId?: string;
  operationSequence?: number;
  transactionType?: string;
  transactionStatus?: string;
  processStage?: string;
  labelCurrency?: string;
  labelAmount?: number | string;
  currencyExponent?: number;
  threeDsEnabled?: number;
  merchantResponseCode?: string;
  merchantResponseMessage?: string;
  merchantNotificationStatus?: string;
  authorizedAmount?: number | string;
  capturedAmount?: number | string;
  refundedAmount?: number | string;
  availableCaptureAmount?: number | string;
  availableRefundAmount?: number | string;
  paymentMethod?: string;
  paymentBrand?: string;
  cardBin?: string;
  cardNumberMasked?: string;
  accessType?: string;
  authCode?: string;
  settlementStatus?: string;
  accountingStatus?: string;
  transactionDateTime: string;
  rootTransactionDateTime: string;
  operationTime?: string;
}

export interface TransactionAmountSummary {
  currency?: string;
  amount?: number | string;
  currencyExponent?: number;
}

export interface TransactionPaymentMethodSummary {
  paymentMethod?: string;
  paymentBrand?: string;
  count: number;
  amountSummaries?: TransactionAmountSummary[];
}

export interface TransactionOperationSummary {
  totalCount: number;
  successCount: number;
  failedCount: number;
  amountSummaries?: TransactionAmountSummary[];
  successAmountSummaries?: TransactionAmountSummary[];
  failedAmountSummaries?: TransactionAmountSummary[];
  paymentMethodSummaries?: TransactionPaymentMethodSummary[];
}

export interface TransactionOperationSearchResponse {
  page: PageResult<TransactionOperation>;
  summary?: TransactionOperationSummary;
}

export interface TransactionDetail {
  order?: TransactionOrder;
  operations?: TransactionOperation[];
  statusHistory?: Record<string, unknown>[];
  flowEvents?: Record<string, unknown>[];
  amountChanges?: Record<string, unknown>[];
  merchantNotifications?: Record<string, unknown>[];
  merchantNotificationLogs?: Record<string, unknown>[];
  merchantApiInteractionLogs?: Record<string, unknown>[];
}

export interface TransactionActionRequest {
  merchantOrderId?: string;
  amount?: number | string;
  currency?: string;
  reason?: string;
  reasonCode?: string;
  refundDescription?: string;
  operationDescription?: string;
  transactionDateTime: string;
  rootTransactionDateTime: string;
}

export interface TransactionActionResponse {
  transactionId?: string;
  sourceTransactionId?: string;
  merchantOrderNo?: string;
  merchantOrderId?: string;
  transactionType?: string;
  status?: string;
  merchantResponseCode?: string;
  merchantResponseMessage?: string;
  processStage?: string;
  failReasonCode?: string;
  pendingReasonCode?: string;
  amount?: number;
  currency?: string;
}

export interface MerchantRefundQuery {
  pageNo?: number;
  pageSize?: number;
  refundTransactionId?: string;
  sourceTransactionId?: string;
  merchantOrderNo?: string;
  merchantOperationNo?: string;
  transactionType?: string;
  refundScope?: string;
  approvalStatus?: string;
  transactionStatus?: string;
  requestSource?: string;
  labelCurrency?: string;
  minimumTransactionAmount?: number | string;
  maximumTransactionAmount?: number | string;
  beginTime?: string;
  endTime?: string;
  completeBeginTime?: string;
  completeEndTime?: string;
  queryTimeZone?: string;
}

export interface MerchantRefundRecord {
  refundTransactionId: string;
  sourceTransactionId?: string;
  merchantOrderNo?: string;
  merchantOperationNo?: string;
  transactionType?: string;
  refundScope?: string;
  requestSource?: string;
  requestReason?: string;
  transactionStatus?: string;
  processStage?: string;
    pendingReasonCode?: string;
  labelCurrency?: string;
  labelAmount?: number | string;
  currencyExponent?: number;
  paymentMethod?: string;
  paymentBrand?: string;
  merchantNotificationStatus?: string;
  transactionDateTime: string;
  completeTime?: string;
  approvalId?: string;
  approvalStatus?: string;
  approvalTime?: string;
  approvalReason?: string;
  approvalExpireTime?: string;
  approvalVersion?: number;
  merchantVisibleMessage?: string;
}

export interface MerchantRefundSummary {
  totalCount: number;
  pendingApprovalCount: number;
  processingCount: number;
  successCount: number;
  failedOrRejectedCount: number;
  currencyAmounts?: Array<{
    currency?: string;
    currencyExponent?: number;
    totalAmount?: number | string;
    pendingApprovalAmount?: number | string;
    successfulAmount?: number | string;
    pendingAmount?: number | string;
  }>;
}

export interface MerchantRefundSearchResponse {
  page: PageResult<MerchantRefundRecord>;
  summary: MerchantRefundSummary;
}

export interface MerchantRefundDetail {
  refund: MerchantRefundRecord;
}

export interface MerchantNotificationQuery {
  pageNo?: number;
  pageSize?: number;
  transactionId?: string;
  merchantOrderNo?: string;
  notifyType?: string;
  notifyStatus?: string;
  beginTime?: string;
  endTime?: string;
  queryTimeZone?: string;
}

export interface MerchantNotificationRecord {
  notifyId: string;
  transactionId?: string;
  operationId?: string;
  merchantOrderNo?: string;
  notifyType?: string;
  eventType?: string;
  notifyStatus?: string;
  lastAttemptNo?: number;
  maxRetryCount?: number;
  nextRetryTime?: string;
  successTime?: string;
  failureCode?: string;
  transactionDateTime: string;
  createTime?: string;
  updateTime?: string;
}

export interface MerchantNotificationDetail extends MerchantNotificationRecord {
  targetUrlMasked?: string;
  payloadJsonMasked?: string;
  signType?: string;
}

export interface MerchantNotificationDeliveryLog {
  notifyLogId?: string;
  notifyId?: string;
  deliveryMode?: string;
  attemptNo?: number;
  httpStatus?: number;
  requestHeaderJsonMasked?: string;
  requestBodyJsonMasked?: string;
  responseBodyJsonMasked?: string;
  success?: boolean;
  failureCode?: string;
  notifyTime?: string;
  responseTime?: string;
  durationMillis?: number;
  httpMethod?: string;
}

export interface MerchantNotificationDetailResponse {
  notification: MerchantNotificationDetail;
  /** @deprecated 投递记录改由独立分页接口返回。 */
  deliveryLogs?: MerchantNotificationDeliveryLog[];
}

export interface MerchantNotificationRetryRequest {
  notifyId: string;
  transactionDateTime: string;
  requestId: string;
}

function normalizeTransactionDateTimeParam(value: string) {
  return value.trim().replace(' ', 'T');
}

function normalizeTransactionShardTime(value: string) {
  const normalized = value.trim().replace('T', ' ');
  const match = /^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?$/.exec(normalized);
  if (!match) return value;
  return `${match[1]}.${(match[2] || '').padEnd(3, '0').slice(0, 3)}`;
}

export const transactionApi = {
  async analyticsOverview(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsOverview>>(
      '/merchant/transactions/analytics/overview',
      data,
    );
    return unwrapResult(result.data);
  },
  async analyticsFailures(data: TransactionAnalyticsQuery) {
    const result = await http.post<CommonResult<TransactionAnalyticsFailure>>(
      '/merchant/transactions/analytics/failures',
      data,
    );
    return unwrapResult(result.data);
  },
  async pageOrders(data: TransactionPageQuery) {
    const result = await http.post<CommonResult<PageResult<TransactionOrder>>>(
      '/merchant/transactions/orders/search',
      data,
    );
    return unwrapResult(result.data);
  },
  async searchOperations(data: TransactionPageQuery) {
    const result = await http.post<CommonResult<TransactionOperationSearchResponse>>(
      '/merchant/transactions/orders/operations/search',
      data,
    );
    return unwrapResult(result.data);
  },
  async detail(
    transactionId: string,
    transactionDateTime: string,
    rootTransactionDateTime: string,
  ) {
    const result = await http.get<CommonResult<TransactionDetail>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}`,
      {
        params: { transactionDateTime, rootTransactionDateTime },
      },
    );
    return unwrapResult(result.data);
  },
  async refundContext(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<RefundContext>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}/refund-context`,
      data,
    );
    return unwrapResult(result.data);
  },
  async refund(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}/refund`,
      data,
    );
    return unwrapResult(result.data);
  },
  async capture(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}/capture`,
      data,
    );
    return unwrapResult(result.data);
  },
  async preAuthCompletion(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}/pre-auth-completion`,
      data,
    );
    return unwrapResult(result.data);
  },
  async voidPayment(transactionId: string, data: TransactionActionRequest) {
    const result = await http.post<CommonResult<TransactionActionResponse>>(
      `/merchant/transactions/orders/${encodeURIComponent(transactionId)}/void`,
      data,
    );
    return unwrapResult(result.data);
  },
  async searchRefunds(data: MerchantRefundQuery) {
    const result = await http.post<CommonResult<MerchantRefundSearchResponse>>(
      '/merchant/transactions/refunds/search',
      data,
    );
    return unwrapResult(result.data);
  },
  async refundDetail(transactionId: string, transactionDateTime: string) {
    const result = await http.get<CommonResult<MerchantRefundDetail>>(
      `/merchant/transactions/refunds/${encodeURIComponent(transactionId)}`,
      { params: { transactionDateTime: normalizeTransactionDateTimeParam(transactionDateTime) } },
    );
    return unwrapResult(result.data);
  },
  async searchNotifications(data: MerchantNotificationQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantNotificationRecord>>>(
      '/merchant/transactions/notifications/search',
      data,
    );
    return unwrapResult(result.data);
  },
  async notificationDetail(notifyId: string, transactionDateTime: string) {
    const result = await http.get<CommonResult<MerchantNotificationDetailResponse>>(
      `/merchant/transactions/notifications/${encodeURIComponent(notifyId)}`,
      { params: { transactionDateTime: normalizeTransactionShardTime(transactionDateTime) } },
    );
    return unwrapResult(result.data);
  },
  async notificationDeliveryLogs(
    notifyId: string,
    transactionDateTime: string,
    pageNo = 1,
    pageSize = 10,
  ) {
    const result = await http.get<CommonResult<PageResult<MerchantNotificationDeliveryLog>>>(
      `/merchant/transactions/notifications/${encodeURIComponent(notifyId)}/delivery-logs`,
      {
        params: {
          transactionDateTime: normalizeTransactionShardTime(transactionDateTime),
          pageNo,
          pageSize,
        },
      },
    );
    return unwrapResult(result.data);
  },
  async retryNotification(data: MerchantNotificationRetryRequest) {
    const result = await http.post<CommonResult<string>>(
      '/merchant/transactions/notifications/retry',
      {
        ...data,
        transactionDateTime: normalizeTransactionShardTime(data.transactionDateTime),
      },
    );
    return unwrapResult(result.data);
  },
};
