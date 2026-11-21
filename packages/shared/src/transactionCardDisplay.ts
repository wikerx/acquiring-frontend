/** 交易列表只展示前六后四；真实 BIN 只用于缺失卡号掩码时的受控回退。 */
export function formatTransactionCardDisplay(cardNumberMasked?: string | null, cardBin?: string | null): string {
    const masked = String(cardNumberMasked ?? '').replace(/[\s-]+/g, '');
    const bin = String(cardBin ?? '').trim();
    const prefix = /^\d{6,8}$/.test(bin) ? bin.slice(0, 6) : '';
    const completeMask = masked.match(/^(\d{6,8})[*xX•]+(\d{4})$/);
    if (completeMask) {
        return `${completeMask[1].slice(0, 6)}****${completeMask[2]}`;
    }
    // 即使上游错误地返回未脱敏值，也不能把原文直接展示到页面。
    if (/^\d{10,19}$/.test(masked)) {
        return `${masked.slice(0, 6)}****${masked.slice(-4)}`;
    }
    const tail = masked.match(/^[*xX•]+(\d{4})$/);
    if (tail) {
        return `${prefix}****${tail[1]}`;
    }
    const maskedPrefix = masked.match(/^(\d{6,8})[*xX•]+$/);
    if (maskedPrefix) {
        return `${maskedPrefix[1].slice(0, 6)}****`;
    }
    // 只有 BIN 时不知道卡号尾四位，不能用 BIN 的末四位编造。
    return prefix ? `${prefix}****` : '-';
}
