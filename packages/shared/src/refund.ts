export const REFUND_REASON_CODES = [
    'CUSTOMER_CANCELLED', 'DUPLICATE_PAYMENT', 'PRODUCT_UNAVAILABLE',
    'QUALITY_ISSUE', 'NOT_AS_DESCRIBED', 'PARTIAL_RETURN', 'PARTIAL_CANCELLATION',
    'UNUSED_SERVICE', 'PRICE_ADJUSTMENT', 'AGREED_COMPENSATION', 'OTHER',
] as const;

export interface RefundContext {
    currency: string;
    currencyExponent: number;
    refundedAmount: string | number;
    pendingRefundAmount: string | number;
    availableRefundAmount: string | number;
}

export interface RefundDraft {
    amount: number | null | undefined;
    currency: string;
    mode: string;
    reason: string;
    description: string;
}

export const refundMessagesZh = {
    reason: '退款原因', description: '补充退款说明',
    reasonRequired: '请选择退款原因',
    descriptionRequired: '选择其他时，请填写具体退款原因',
    descriptionPlaceholder: '可填写退货商品、未使用服务或退款金额的计算依据（选填）',
    descriptionTooLong: '补充退款说明不能超过 200 个字符',
    selectReason: '请选择退款原因',
    mode: '退款方式', partial: '部分退款', full: '退还全部可退金额',
    amount: '退款金额', amountPlaceholder: '请输入退款金额',
    amountRequired: '请输入大于 0 的退款金额',
    amountExceedsAvailable: '退款金额不能大于剩余可退金额',
    amountPrecision: '该币种最多支持 {digits} 位小数',
    refunded: '已退款', pending: '退款处理中', available: '剩余可退',
    currentRefund: '本次退款：{amount}',
    tip: '请核对退款金额和原因后提交。退款进度可在退款管理中查看。',
    limit: '剩余可退金额已扣除处理中退款；提交时将再次校验最新额度。',
    noAvailable: '当前没有剩余可退金额，请查看退款管理中的处理进度。',
    contextFailed: '退款额度加载失败，请关闭弹窗后重试。',
    submitted: '退款申请已提交，请在退款管理中查看处理结果。',
    reasons: {
        CUSTOMER_CANCELLED: '客户取消订单', DUPLICATE_PAYMENT: '重复支付',
        PRODUCT_UNAVAILABLE: '商品缺货或服务无法提供', QUALITY_ISSUE: '商品质量或服务质量问题',
        NOT_AS_DESCRIBED: '商品或服务与描述不符', PARTIAL_RETURN: '部分商品退货',
        PARTIAL_CANCELLATION: '部分商品取消或缺货', UNUSED_SERVICE: '部分服务未使用或提前终止',
        PRICE_ADJUSTMENT: '优惠补退或价格差额退还', AGREED_COMPENSATION: '协商补偿退款', OTHER: '其他',
    },
};

export const refundMessagesEn = {
    reason: 'Refund reason', description: 'Additional refund details',
    reasonRequired: 'Select a refund reason',
    descriptionRequired: 'Provide refund details when selecting Other',
    descriptionPlaceholder: 'Describe returned items, unused services or how the refund amount was calculated (optional)',
    descriptionTooLong: 'Additional refund details must not exceed 200 characters',
    selectReason: 'Select a refund reason',
    mode: 'Refund method', partial: 'Partial refund', full: 'Refund remaining balance',
    amount: 'Refund amount', amountPlaceholder: 'Enter the refund amount',
    amountRequired: 'Enter a refund amount greater than 0',
    amountExceedsAvailable: 'The refund amount exceeds the remaining refundable balance',
    amountPrecision: 'This currency supports up to {digits} decimal places',
    refunded: 'Refunded', pending: 'Refunds in progress', available: 'Available to refund',
    currentRefund: 'Refund amount: {amount}',
    tip: 'Check the refund amount and reason before submitting. Track progress in Refund Management.',
    limit: 'The available balance excludes refunds in progress. It will be checked again when you submit.',
    noAvailable: 'No refundable balance is available. Check progress in Refund Management.',
    contextFailed: 'Unable to load the refund balance. Close the dialog and try again.',
    submitted: 'Refund request submitted. Check Refund Management for the result.',
    reasons: {
        CUSTOMER_CANCELLED: 'Customer cancelled order', DUPLICATE_PAYMENT: 'Duplicate payment',
        PRODUCT_UNAVAILABLE: 'Product or service unavailable', QUALITY_ISSUE: 'Product or service quality issue',
        NOT_AS_DESCRIBED: 'Product or service not as described', PARTIAL_RETURN: 'Partial return of goods',
        PARTIAL_CANCELLATION: 'Partial cancellation or stock shortage', UNUSED_SERVICE: 'Unused service or early termination',
        PRICE_ADJUSTMENT: 'Discount or price adjustment', AGREED_COMPENSATION: 'Agreed compensation', OTHER: 'Other',
    },
} satisfies typeof refundMessagesZh;
