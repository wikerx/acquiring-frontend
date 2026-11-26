export const disputeEventFeeCategories = ['RDR_FEE', 'ETHOCA_ALERT_FEE'] as const;

export type DisputeEventFeeCategory = typeof disputeEventFeeCategories[number];

export function isDisputeEventFee(category: string): category is DisputeEventFeeCategory {
    return category === 'RDR_FEE' || category === 'ETHOCA_ALERT_FEE';
}

export function feeCategoryMatchesTab(category: string, tab: string) {
    return category === tab || tab === 'DISPUTE_FEE' && isDisputeEventFee(category);
}
