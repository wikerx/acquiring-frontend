import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

export const CAPTURE_REASON_CODES = ['GOODS_SHIPPED', 'SERVICE_COMPLETED', 'MERCHANT_CONFIRMED',
    'PARTIAL_FULFILLMENT', 'ORDER_COMPLETED', 'ACTUAL_AMOUNT_CONFIRMED', 'CUSTOMER_CONFIRMED_SETTLEMENT', 'OTHER'] as const;
export const VOID_REASON_CODES = ['CUSTOMER_CANCELLED', 'AUTHORIZATION_EXPIRED', 'MERCHANT_CONFIRMED',
    'ORDER_CLOSED', 'PRODUCT_UNAVAILABLE', 'DUPLICATE_AUTHORIZATION', 'INCORRECT_AMOUNT', 'PAYMENT_METHOD_CHANGED', 'RISK_REVIEW', 'OTHER'] as const;

export interface ConsoleActionDraft { amount?: string | null; mode?: string; reason: string; description: string }

/** 只解释既有字段，不制造新的资金状态或用审批通过推断已退款。 */
export function refundProgressKey(row: { transactionStatus?: string; status?: string; approvalStatus?: string; processStage?: string; pendingReasonCode?: string }) {
    if (row.approvalStatus === 'REJECTED') return 'rejected';
    if (row.approvalStatus === 'EXPIRED') return 'expired';
    const status = row.transactionStatus || row.status;
    if (status === 'SUCCESS') return 'success';
    if (status === 'FAILED') return 'failed';
    if (row.approvalStatus === 'PENDING' || row.processStage === 'WAITING_APPROVAL') return 'approval';
    if (row.processStage === 'WAITING_EXECUTION') return 'execution';
    if (row.pendingReasonCode === 'CHANNEL_RESULT_UNKNOWN') return 'unknown';
    if (row.pendingReasonCode === 'WAITING_CHANNEL_CALLBACK' || row.processStage === 'CHANNEL_PROCESSING') return 'channel';
    return 'unknown';
}

/** 打开的操作菜单或筛选下拉尚在交互中，刷新行数据会销毁弹层并打断选择。 */
function hasOpenTransactionInteraction() {
    return Array.from(document.querySelectorAll<HTMLElement>(
        '[aria-haspopup="menu"][aria-expanded="true"], [role="combobox"][aria-expanded="true"]',
    )).some(element => element.getClientRects().length > 0);
}

/** 复用查询接口刷新勾兑结果；仅在页面激活、可见且没有弹窗、菜单或下拉交互时读取，不发资金请求。 */
export function useTransactionRefresh(refresh: () => Promise<unknown>, shouldRefresh: () => boolean) {
    let timer: ReturnType<typeof setInterval> | undefined;
    let running = false;
    function stop() { clearInterval(timer); timer = undefined; }
    function start() {
        stop();
        timer = setInterval(async () => {
            if (running || document.hidden || !shouldRefresh() || hasOpenTransactionInteraction()) return;
            running = true;
            try { await refresh(); } catch { /* 页面已有查询错误反馈；下一周期重读。 */ }
            finally { running = false; }
        }, 15000);
    }
    onMounted(start);
    onActivated(start);
    onDeactivated(stop);
    onUnmounted(stop);
}

export const transactionActionMessagesZh = {
    requestFailed: '本次操作失败，请查看交易详情中的结果和原因。', mode: '金额选择', partial: '指定金额', full: '全部剩余可用金额', amount: '本次金额', reason: '操作原因',
    description: '操作说明', reasonRequired: '请选择操作原因', otherRequired: '选择“其他”必须填写说明',
    optionalDescription: '请填写补充说明（选填，最多200字）', descriptionTooLong: '操作说明最多200字',
    amountRequired: '请输入大于零且符合币种精度的金额', amountExceeded: '金额不能超过当前剩余可用额度',
    captureHint: '支持部分请款，可继续请款剩余额度；退款不恢复可请款额度。',
    completionHint: '只允许一次预授权完成成功，可指定不超过累计成功预授权的金额；余款由发卡行自动释放。',
    stages: { approval: '待审批：额度已预占，尚未执行退款。', execution: '待执行：审批已通过，额度继续预占。',
        channel: '渠道处理中：已取得渠道处理中的响应，额度继续预占。',
        unknown: '结果待确认：尚未取得明确结果，额度继续预占；系统将自动勾兑，请勿重复提交同笔请求。',
        success: '退款成功', failed: '退款失败，已释放本笔退款预占额度。', rejected: '审批已拒绝，未执行退款，已释放预占额度。',
        expired: '审批已过期，未执行退款，已释放预占额度。' },
    reasons: { GOODS_SHIPPED: '商品已发货', SERVICE_COMPLETED: '商品或服务已完成', MERCHANT_CONFIRMED: '商户确认',
        PARTIAL_FULFILLMENT: '部分商品或服务已履约', ORDER_COMPLETED: '订单已完成', ACTUAL_AMOUNT_CONFIRMED: '实际消费金额已确认',
        CUSTOMER_CONFIRMED_SETTLEMENT: '客户确认本次结算', CUSTOMER_CANCELLED: '客户取消订单', AUTHORIZATION_EXPIRED: '授权即将过期',
        ORDER_CLOSED: '订单关闭或不再继续', PRODUCT_UNAVAILABLE: '商品缺货或服务无法提供', DUPLICATE_AUTHORIZATION: '重复授权',
        INCORRECT_AMOUNT: '交易金额有误，需重新授权', PAYMENT_METHOD_CHANGED: '客户更换支付方式', RISK_REVIEW: '风险或异常订单处理', OTHER: '其他' },
};
export const transactionActionMessagesEn = {
    requestFailed: 'The operation failed. Check transaction details for the result and reason.', mode: 'Amount selection', partial: 'Specified amount', full: 'All remaining available amount', amount: 'Amount', reason: 'Operation reason',
    description: 'Additional details', reasonRequired: 'Select an operation reason', otherRequired: 'Details are required for Other',
    optionalDescription: 'Additional details (optional, up to 200 characters)', descriptionTooLong: 'Details must not exceed 200 characters',
    amountRequired: 'Enter a positive amount with the correct currency precision', amountExceeded: 'Amount exceeds the remaining available balance',
    captureHint: 'Partial captures are supported until the available amount is exhausted. Refunds do not restore capture capacity.',
    completionHint: 'Only one successful completion is allowed, up to the accumulated successful authorization amount. The issuer releases any remainder.',
    stages: { approval: 'Awaiting approval: the amount is reserved; the refund has not been executed.',
        execution: 'Awaiting execution: approved; the amount remains reserved.', channel: 'Channel processing: confirmed by a channel response; the amount remains reserved.',
        unknown: 'Awaiting confirmation: no definitive result yet; the amount remains reserved. Automatic matching will update the result. Do not resubmit this request.',
        success: 'Refund successful', failed: 'Refund failed; this reservation has been released.', rejected: 'Approval rejected; no refund executed; reservation released.',
        expired: 'Approval expired before execution; reservation released.' },
    reasons: { GOODS_SHIPPED: 'Goods shipped', SERVICE_COMPLETED: 'Goods or services completed', MERCHANT_CONFIRMED: 'Merchant confirmed',
        PARTIAL_FULFILLMENT: 'Partial fulfillment', ORDER_COMPLETED: 'Order completed', ACTUAL_AMOUNT_CONFIRMED: 'Actual spending confirmed',
        CUSTOMER_CONFIRMED_SETTLEMENT: 'Customer confirmed settlement', CUSTOMER_CANCELLED: 'Customer cancelled order', AUTHORIZATION_EXPIRED: 'Authorization expiring',
        ORDER_CLOSED: 'Order closed', PRODUCT_UNAVAILABLE: 'Product or service unavailable', DUPLICATE_AUTHORIZATION: 'Duplicate authorization',
        INCORRECT_AMOUNT: 'Incorrect amount; reauthorization required', PAYMENT_METHOD_CHANGED: 'Customer changed payment method', RISK_REVIEW: 'Risk or exceptional order handling', OTHER: 'Other' },
};
