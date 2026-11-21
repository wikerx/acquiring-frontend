<template>
    <section class="transaction-action-source" :aria-label="t('refundForm.sourceInfo')">
        <header class="transaction-action-source__header">
            <div class="transaction-action-source__heading">
                <TransactionTypeDisplay :value="type" :label="typeLabel" align="start" size="md" />
                <p v-if="hint">{{ hint }}</p>
            </div>
            <TransactionStatusDisplay :value="status" :label="statusLabel" align="start" size="md" />
        </header>
        <div class="transaction-action-source__body">
            <div class="transaction-action-source__amount">
                <span>{{ amountLabel }}</span>
                <CurrencyAmountDisplay :amount="amount" :currency="currency" :exponent="exponent" :locale="locale" size="lg" emphasized />
            </div>
            <dl class="transaction-action-source__references">
                <dt>{{ t('refundForm.merchantOrderNo') }}</dt>
                <dd><slot name="merchant-order" /></dd>
                <dt>{{ t('refundForm.transactionId') }}</dt>
                <dd><slot name="transaction-id" /></dd>
                <dt>{{ t('refundForm.transactionTime') }}</dt>
                <dd><slot name="transaction-time" /></dd>
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
    hint?: string;
    amountLabel: string;
    amount?: string | number | null;
    currency?: string | null;
    exponent?: number | null;
    locale: string;
    t: (key: string) => string;
}>();
</script>

<style scoped>
.transaction-action-source { min-width: 0; overflow: hidden; border: 1px solid var(--el-border-color-light); border-radius: 14px; background: var(--el-bg-color); }
.transaction-action-source__header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 17px 20px; background: var(--el-color-primary-light-9); border-bottom: 1px solid var(--el-color-primary-light-8); }
.transaction-action-source__heading p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; }
.transaction-action-source__header :deep(.transaction-type-display) { color: var(--el-text-color-primary); font-size: 16px; font-weight: 700; }
.transaction-action-source__header :deep(.transaction-status-display) { padding: 5px 10px; border-radius: 20px; background: var(--el-bg-color); }
.transaction-action-source__body { display: grid; grid-template-columns: minmax(170px, .8fr) minmax(0, 1.8fr); gap: 22px; padding: 20px; }
.transaction-action-source__amount { display: flex; flex-direction: column; justify-content: center; align-items: flex-start; gap: 13px; min-width: 0; padding: 16px; border-radius: 10px; background: var(--el-fill-color-light); }
.transaction-action-source__amount > span { font-size: 12px; color: var(--el-text-color-secondary); }
.transaction-action-source__amount :deep(.currency-amount-display) { align-items: flex-start; flex-direction: column; gap: 9px; color: var(--el-text-color-primary); white-space: normal; }
.transaction-action-source__amount :deep(.currency-amount-display__amount) { font-size: 32px; letter-spacing: -.8px; overflow-wrap: anywhere; }
.transaction-action-source__references { display: grid; grid-template-columns: fit-content(45%) minmax(0, 1fr); align-content: center; min-width: 0; margin: 0; }
.transaction-action-source__references > :is(dt, dd) { display: flex; align-items: center; min-width: 0; margin: 0; padding: 12px 0; border-bottom: 1px solid var(--el-border-color-extra-light); line-height: 1.5; overflow-wrap: anywhere; }
.transaction-action-source__references > :nth-last-child(-n+2) { border-bottom: 0; }
.transaction-action-source__references dt { padding-inline-end: 16px; color: var(--el-text-color-secondary); font-size: 12px; }
.transaction-action-source__references dd { color: var(--el-text-color-primary); font-size: 13px; font-variant-numeric: tabular-nums; }
.transaction-action-source__references dd > :deep(*) { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 580px) {
    .transaction-action-source__header { padding: 14px; }
    .transaction-action-source__body { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 14px; }
    .transaction-action-source__amount { padding: 14px; gap: 8px; }
    .transaction-action-source__amount :deep(.currency-amount-display) { flex-direction: row; align-items: center; flex-wrap: wrap; gap: 12px; }
    .transaction-action-source__amount :deep(.currency-amount-display__amount) { font-size: 28px; }
    .transaction-action-source__references dt { padding-inline-end: 12px; }
}
</style>

<style>
/* 两端交易操作弹窗使用统一的边距、字段与按钮。 */
.el-overlay-dialog .el-dialog.transaction-action-dialog { display: flex; flex-direction: column; max-height: calc(100dvh - 40px); margin: 20px auto !important; padding: 0; border-radius: 16px; overflow: hidden; background: var(--el-bg-color-overlay); }
.el-overlay-dialog .el-dialog.transaction-action-dialog .el-dialog__header { flex: none; padding: 22px 26px 18px; margin: 0; border-bottom: 1px solid var(--el-border-color-extra-light); }
.el-overlay-dialog .el-dialog.transaction-action-dialog .el-dialog__title { color: var(--el-text-color-primary); font-size: 20px; font-weight: 700; line-height: 1.4; }
.transaction-action-dialog .el-dialog__headerbtn { top: 15px; right: 15px; }
.el-dialog.transaction-action-dialog .el-dialog__body { min-height: 0; padding: 20px 26px 4px !important; overflow: auto; overscroll-behavior: contain; }
.transaction-action-dialog .el-dialog__footer { flex: none; padding: 16px 26px 20px; border-top: 1px solid var(--el-border-color-extra-light); background: var(--el-bg-color-overlay); }
.transaction-action-dialog .dialog-footer { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 12px; margin: 0; }
.el-dialog.transaction-action-dialog .dialog-footer .el-button:not(.is-link):not(.is-text):not(.is-circle) { height: 32px; min-width: 88px; margin: 0; padding: 0 16px; border-radius: 6px; font-size: 14px; font-weight: 600; }
.transaction-action-dialog .transaction-action-intro { margin-bottom: 20px; padding: 10px 13px; border-radius: 8px; background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.transaction-action-dialog .transaction-action-intro .el-alert__title { color: var(--el-text-color-regular); font-size: 12px; line-height: 1.6; }
.transaction-action-dialog .transaction-action-section { display: grid; gap: 12px; margin: 0 0 22px; }
.transaction-action-dialog .transaction-action-section > h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--el-text-color-primary); font-size: 14px; font-weight: 700; }
.transaction-action-dialog .transaction-action-section > h3::before { content: ''; width: 3px; height: 14px; border-radius: 2px; background: var(--el-color-primary); }
.transaction-action-dialog .transaction-action-source-copy { display: inline-flex; align-items: center; gap: 8px; width: 100%; min-width: 0; padding: 0; border: 0; background: none; color: var(--el-text-color-primary); font: inherit; line-height: 1.5; text-align: start; cursor: pointer; }
.transaction-action-dialog .transaction-action-source-copy > span { min-width: 0; overflow-wrap: anywhere; }
.transaction-action-dialog .transaction-action-source-copy .el-icon { flex: none; margin-left: auto; color: var(--el-text-color-secondary); }
.transaction-action-dialog .transaction-action-source-copy:hover, .transaction-action-dialog .transaction-action-source-copy:hover .el-icon { color: var(--el-color-primary); }
.transaction-action-dialog .transaction-action-source-copy:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: 3px; border-radius: 3px; }
.transaction-action-dialog .transaction-action-amount-card { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px 18px; padding: 14px 16px; border: 1px solid var(--el-border-color-extra-light); border-radius: 10px; background: var(--el-fill-color-light); }
.transaction-action-dialog .transaction-action-amount-card--warning { border-color: var(--el-color-warning-light-7); background: var(--el-color-warning-light-9); }
.transaction-action-dialog .transaction-action-amount-card__label { display: grid; gap: 4px; align-content: center; color: var(--el-text-color-regular); font-size: 13px; font-weight: 600; }
.transaction-action-dialog .transaction-action-amount-card__label small { color: var(--el-text-color-secondary); font-size: 12px; font-weight: 400; }
.transaction-action-dialog .transaction-action-bottom-alert { padding: 10px 12px; border-radius: 8px; }
.transaction-action-dialog .transaction-action-bottom-alert .el-alert__title { font-size: 12px; line-height: 1.6; }
.transaction-action-dialog .transaction-action-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0 20px; }
.transaction-action-dialog .transaction-action-fields__wide { grid-column: 1 / -1; }
.transaction-action-dialog .transaction-action-fields .el-form-item { min-width: 0; margin-bottom: 20px; }
.transaction-action-dialog .transaction-action-fields .el-form-item__label { height: auto; color: var(--el-text-color-primary); font-size: 13px; font-weight: 600; line-height: 1.6; }
.transaction-action-dialog .transaction-action-fields .el-select { width: 100%; }
.transaction-action-dialog .transaction-action-fields :is(.el-input__wrapper, .el-select__wrapper) { min-height: 38px; border-radius: 7px; }
.transaction-action-dialog .transaction-action-fields .el-textarea__inner { min-height: 84px; padding: 10px 12px 24px; border-radius: 7px; line-height: 1.6; }
.transaction-action-dialog .transaction-action-fields__modes { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; width: 100%; }
.transaction-action-dialog .transaction-action-fields__modes .el-radio { min-width: 0; height: auto; min-height: 42px; margin: 0; padding: 10px 12px; border-radius: 8px; white-space: normal; }
.transaction-action-dialog .transaction-action-fields__modes .el-radio.is-checked { background: var(--el-color-primary-light-9); }
.transaction-action-dialog .transaction-action-fields__modes .el-radio__label { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.transaction-action-dialog .transaction-action-fields__amount { display: flex; align-items: center; gap: 8px; width: 100%; }
.transaction-action-dialog .transaction-action-fields__amount .el-input { flex: 1; width: 0; }
.transaction-action-dialog .transaction-action-fields__amount > span { color: var(--el-text-color-secondary); font-size: 12px; font-weight: 600; }
@media (max-width: 580px) {
    .el-overlay-dialog .el-dialog.transaction-action-dialog { max-height: calc(100dvh - 24px); margin: 12px auto !important; border-radius: 12px; }
    .el-overlay-dialog .el-dialog.transaction-action-dialog .el-dialog__header { padding: 18px 18px 14px; }
    .el-overlay-dialog .el-dialog.transaction-action-dialog .el-dialog__title { font-size: 18px; }
    .el-dialog.transaction-action-dialog .el-dialog__body { padding: 16px 18px 0 !important; }
    .transaction-action-dialog .el-dialog__footer { padding: 14px 18px 16px; }
    .transaction-action-dialog .transaction-action-fields { grid-template-columns: minmax(0, 1fr); }
}
</style>
