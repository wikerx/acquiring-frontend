export const feeMessages = {
    zh: {
        title: '费用清分', showRaw: '查看原始清分记录', hideRaw: '收起原始清分记录', charge: '平台费用净额', postedCharge: '最终结算费用', settled: '已入账', settledDetails: '已结算 · 查看明细',
        syncing: '已入账，状态同步中', reversed: '原结算已冲正', noFees: '本动作无费用', awaiting: '待清分',
        incomplete: '费用组成超出本页查询范围，请查看下方原始明细。', pending: '待换汇确认',
        pendingLimit: '待换汇及限额确认', parts: '计费明细', original: '查看原交易动作', back: '返回当前交易动作',
        export: '下载精确费用明细', digits: '显示精度', originalDigits: '按金额精度', twoDigits: '两位小数',
        fourDigits: '四位小数', separateCurrencies: '按币种查看明细', partial: '费用待结算确认', knownPartial: '已确定小计 · 其余费用待结算', clearingStage: '清分组成', settlementStage: '结算换汇',
        unrounded: '结算舍入前', final: '最终结算费用', adjustment: '封顶抵减',
        TRANSACTION_FEE: '交易手续费', REFUND_FEE: '退款手续费', RISK_FEE: '风控手续费',
        INTERNAL: '内风控手续费', EXTERNAL: '外部风控手续费', THREE_DS: '3DS 手续费',
        DISPUTE_FEE: '拒付手续费', SETTLEMENT_PROCESSING_FEE: '结算处理费', SETTLEMENT_FX_FEE: '结算货币兑换费',
        FEE_REVERSAL: '手续费冲回', PERCENTAGE: '比例费', FIXED: '固定费',
        MINIMUM: '最低费补差', MAXIMUM: '封顶抵减', LIMIT_ADJUSTMENT: '限额调整',
        PAYMENT: '支付', AUTHORIZATION: '授权', PRE_AUTHORIZATION: '预授权', PRE_AUTH_COMPLETION: '预授权完成',
        CAPTURE: '请款', REFUND: '退款', VOID: '撤销', CHARGEBACK: '拒付', REPRESENTMENT: '拒付申诉',
    },
    en: {
        title: 'Clearing Fees', showRaw: 'Show raw clearing records', hideRaw: 'Hide raw clearing records', charge: 'Net platform fees', postedCharge: 'Final settlement fees', settled: 'Posted', settledDetails: 'Settled · View details',
        syncing: 'Posted, transaction status syncing', reversed: 'Original settlement reversed', noFees: 'No fees for this action',
        awaiting: 'Awaiting clearing', incomplete: 'The fee breakdown exceeds the detail limit. Use the raw lines below.',
        pending: 'Pending FX confirmation', pendingLimit: 'Pending FX and fee limits', parts: 'Fee breakdown',
        original: 'View source action', back: 'Back to current action', export: 'Download exact fee details',
        digits: 'Display precision', originalDigits: 'Amount precision', twoDigits: '2 decimal places',
        fourDigits: '4 decimal places', separateCurrencies: 'View amounts by currency', partial: 'Fees pending settlement', knownPartial: 'Known subtotal · other fees pending', clearingStage: 'Clearing components', settlementStage: 'Settlement conversion',
        unrounded: 'Before settlement rounding', final: 'Final settlement fee', adjustment: 'Maximum fee reduction',
        TRANSACTION_FEE: 'Transaction fee', REFUND_FEE: 'Refund fee', RISK_FEE: 'Risk fee',
        INTERNAL: 'Internal risk fee', EXTERNAL: 'External risk fee', THREE_DS: '3DS fee',
        DISPUTE_FEE: 'Chargeback fee', SETTLEMENT_PROCESSING_FEE: 'Settlement processing fee',
        SETTLEMENT_FX_FEE: 'Settlement FX fee', FEE_REVERSAL: 'Fee reversal', PERCENTAGE: 'Percentage fee',
        FIXED: 'Fixed fee', MINIMUM: 'Minimum fee top-up', MAXIMUM: 'Maximum fee reduction', LIMIT_ADJUSTMENT: 'Fee limit adjustment',
        PAYMENT: 'Payment', AUTHORIZATION: 'Authorization', PRE_AUTHORIZATION: 'Pre-authorization',
        PRE_AUTH_COMPLETION: 'Pre-authorization completion', CAPTURE: 'Capture', REFUND: 'Refund', VOID: 'Void', CHARGEBACK: 'Chargeback', REPRESENTMENT: 'Representment',
    },
};

export function transactionFeeText(locale: string, key: string) {
    const messages: Readonly<Record<string, string>> = /^en/i.test(locale) ? feeMessages.en : feeMessages.zh;
    return messages[key] || key;
}

export function clearingFeeStateText(locale: string, clearingStatus?: string, evaluation?: string, settlementStatus?: string) {
    if (evaluation && (settlementStatus === 'SETTLED' || settlementStatus === 'POSTED')) {
        return transactionFeeText(locale, 'settledDetails');
    }
    if (evaluation === 'PENDING_SETTLEMENT_RATE') return transactionFeeText(locale, 'pending');
    if (evaluation === 'FINAL_AT_CLEARING') return transactionFeeText(locale, 'separateCurrencies');
    return transactionFeeText(locale, ['CLEARED', 'NOT_REQUIRED'].includes(clearingStatus || '') ? 'noFees' : 'awaiting');
}
