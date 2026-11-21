<template>
    <section class="refund-source-summary" :aria-label="t('refundForm.sourceInfo')">
        <header class="refund-source-summary__header">
            <div class="refund-source-summary__heading">
                <TransactionTypeDisplay :value="type" :label="typeLabel" align="start" size="md" />
                <p>{{ t('refundForm.sourceHint') }}</p>
            </div>
            <TransactionStatusDisplay :value="status" :label="statusLabel" align="start" size="md" />
        </header>
        <div class="refund-source-summary__body">
            <div class="refund-source-summary__amount">
                <span>{{ t('refundForm.sourceAmount') }}</span>
                <CurrencyAmountDisplay :amount="amount" :currency="currency" :exponent="exponent" :locale="locale" size="lg" emphasized />
            </div>
            <dl class="refund-source-summary__references">
                <div><dt>{{ t('refundForm.merchantOrderNo') }}</dt><dd><slot name="merchant-order" /></dd></div>
                <div><dt>{{ t('refundForm.transactionId') }}</dt><dd><slot name="transaction-id" /></dd></div>
                <div><dt>{{ t('refundForm.transactionTime') }}</dt><dd><slot name="transaction-time" /></dd></div>
            </dl>
        </div>
    </section>
</template>

<script setup lang="ts">
import CurrencyAmountDisplay from './CurrencyAmountDisplay.vue';
import TransactionStatusDisplay from './TransactionStatusDisplay.vue';
import TransactionTypeDisplay from './TransactionTypeDisplay.vue';

defineProps<{
    type?: string | null;
    typeLabel?: string;
    status?: string | null;
    statusLabel?: string;
    amount?: string | number | null;
    currency?: string | null;
    exponent?: number | null;
    locale: string;
    t: (key: string) => string;
}>();
</script>

<style scoped>
.refund-source-summary { min-width: 0; overflow: hidden; border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-bg-color); }
.refund-source-summary__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 17px 20px; background: var(--el-color-primary-light-9); border-bottom: 1px solid var(--el-color-primary-light-8); }
.refund-source-summary__heading p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.refund-source-summary__header :deep(.transaction-type-display) { color: var(--el-text-color-primary); font-size: 16px; font-weight: 700; }
.refund-source-summary__header :deep(.transaction-status-display) { padding: 5px 10px; border-radius: 20px; background: var(--el-bg-color); }
.refund-source-summary__body { display: grid; grid-template-columns: minmax(170px, .8fr) minmax(0, 1.8fr); gap: 22px; padding: 20px; }
.refund-source-summary__amount { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 13px; min-width: 0; padding: 16px; border-radius: 10px; background: var(--el-fill-color-light); }
.refund-source-summary__amount > span { font-size: 12px; color: var(--el-text-color-secondary); }
.refund-source-summary__amount :deep(.currency-amount-display) { align-items: flex-start; flex-direction: column; gap: 9px; color: var(--el-text-color-primary); white-space: normal; }
.refund-source-summary__amount :deep(.currency-amount-display__amount) { font-size: 32px; letter-spacing: -.8px; overflow-wrap: anywhere; }
.refund-source-summary__references { display: grid; align-content: center; gap: 0; min-width: 0; margin: 0; }
.refund-source-summary__references > div { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 16px; min-width: 0; padding: 12px 0; border-bottom: 1px solid var(--el-border-color-extra-light); }
.refund-source-summary__references > div:last-child { border-bottom: 0; }
.refund-source-summary__references dt { color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.refund-source-summary__references dd { min-width: 0; margin: 0; color: var(--el-text-color-primary); font-size: 13px; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
@media (max-width: 580px) {
    .refund-source-summary__header { padding: 14px; }
    .refund-source-summary__body { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 14px; }
    .refund-source-summary__amount { padding: 14px; gap: 8px; }
    .refund-source-summary__amount :deep(.currency-amount-display) { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 12px; }
    .refund-source-summary__amount :deep(.currency-amount-display__amount) { font-size: 28px; }
    .refund-source-summary__references > div { gap: 12px; }
}
</style>

<style>
/* 只作用于两端退款弹窗，不改变请款、撤销及其他业务弹窗。 */
.el-overlay-dialog .el-dialog.refund-action-dialog { display: flex; flex-direction: column; max-height: calc(100dvh - 40px); margin: 20px auto !important; padding: 0; border-radius: 16px; overflow: hidden; background: var(--el-bg-color-overlay); }
.el-overlay-dialog .el-dialog.refund-action-dialog .el-dialog__header { flex: none; padding: 22px 26px 18px; margin: 0; border-bottom: 1px solid var(--el-border-color-extra-light); }
.el-overlay-dialog .el-dialog.refund-action-dialog .el-dialog__title { color: var(--el-text-color-primary); font-size: 20px; font-weight: 700; line-height: 1.4; }
.refund-action-dialog .el-dialog__headerbtn { top: 15px; right: 15px; }
.el-dialog.refund-action-dialog .el-dialog__body { min-height: 0; padding: 20px 26px 4px !important; overflow: auto; overscroll-behavior: contain; }
.refund-action-dialog .el-dialog__footer { flex: none; padding: 16px 26px 20px; border-top: 1px solid var(--el-border-color-extra-light); background: var(--el-bg-color-overlay); }
.refund-action-dialog .dialog-footer { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; margin: 0; }
.el-dialog.refund-action-dialog .dialog-footer .el-button:not(.is-link):not(.is-text):not(.is-circle) { height: 32px; min-width: 88px; margin: 0; padding: 0 16px; border-radius: 6px; font-size: 14px; font-weight: 600; }
.refund-action-dialog .refund-dialog-intro { margin-bottom: 20px; padding: 10px 13px; border-radius: 8px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.refund-action-dialog .refund-dialog-intro .el-alert__title { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.refund-action-dialog .refund-dialog-section { display: grid; gap: 12px; margin: 0 0 22px; }
.refund-action-dialog .refund-dialog-section > h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; }
.refund-action-dialog .refund-dialog-section > h3::before { content: ''; width: 3px; height: 14px; border-radius: 2px; background: var(--el-color-primary); }
.refund-action-dialog .refund-source-copy { display: inline-flex; align-items: center; gap: 8px; width: 100%; min-width: 0; padding: 0; border: 0; background: none; color: var(--el-text-color-primary); font: inherit; line-height: 1.5; text-align: start; cursor: pointer; }
.refund-action-dialog .refund-source-copy > span { min-width: 0; overflow-wrap: anywhere; }
.refund-action-dialog .refund-source-copy .el-icon { flex: none; margin-left: auto; color: var(--el-text-color-secondary); }
.refund-action-dialog .refund-source-copy:hover, .refund-action-dialog .refund-source-copy:hover .el-icon { color: var(--el-color-primary); }
.refund-action-dialog .refund-source-copy:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; border-radius: 3px; }
@media (max-width: 580px) {
    .el-overlay-dialog .el-dialog.refund-action-dialog { max-height: calc(100dvh - 24px); margin: 12px auto !important; border-radius: 12px; }
    .el-overlay-dialog .el-dialog.refund-action-dialog .el-dialog__header { padding: 18px 18px 14px; }
    .el-overlay-dialog .el-dialog.refund-action-dialog .el-dialog__title { font-size: 18px; }
    .el-dialog.refund-action-dialog .el-dialog__body { padding: 16px 18px 0 !important; }
    .refund-action-dialog .el-dialog__footer { padding: 14px 18px 16px; }
}
</style>
