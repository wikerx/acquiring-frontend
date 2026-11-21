<template>
    <div v-loading="loading" class="refund-fields">
        <dl v-if="context" class="refund-fields__balances">
            <div v-for="item in balances" :key="item.key" :class="{ 'is-available': item.key === 'available' }">
                <dt><el-icon aria-hidden="true"><CircleCheck v-if="item.key === 'refunded'" /><Clock v-else-if="item.key === 'pending'" /><Wallet v-else /></el-icon>{{ t(`refundForm.${item.key}`) }}</dt>
                <dd><span>{{ context.currency }}</span><strong>{{ formatMoneyAmount(item.amount, locale, digits) }}</strong></dd>
            </div>
        </dl>
        <div v-else-if="loading" class="refund-fields__loading" aria-busy="true"><span /><span /><span /></div>
        <el-alert v-if="!loading && !context" type="error" :closable="false" show-icon :title="t('refundForm.contextFailed')" />
        <el-form ref="formRef" :model="model" :rules="rules" :validate-on-rule-change="false" :disabled="formDisabled" label-position="top" class="transaction-action-fields">
            <el-form-item :label="t('refundForm.mode')" class="transaction-action-fields__wide">
                <el-radio-group v-model="mode" class="transaction-action-fields__modes">
                    <el-radio value="PARTIAL" border>{{ t('refundForm.partial') }}</el-radio>
                    <el-radio value="FULL" border>{{ t('refundForm.full') }}</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('refundForm.amount')" prop="amount">
                <div class="transaction-action-fields__amount">
                    <el-input v-model="amount" :disabled="formDisabled || mode === 'FULL'" inputmode="decimal" autocomplete="off" :placeholder="t('refundForm.amountPlaceholder')" />
                    <span>{{ context?.currency || model.currency }}</span>
                </div>
            </el-form-item>
            <el-form-item :label="t('refundForm.reason')" prop="reason">
                <el-select v-model="reason" :placeholder="t('refundForm.selectReason')" filterable @change="formRef?.clearValidate('description')">
                    <el-option v-for="code in REFUND_REASON_CODES" :key="code" :value="code" :label="t(`refundForm.reasons.${code}`)" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('refundForm.description')" prop="description" class="transaction-action-fields__wide">
                <el-input v-model="description" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="t(reason === 'OTHER' ? 'refundForm.descriptionRequired' : 'refundForm.descriptionPlaceholder')" />
            </el-form-item>
        </el-form>
        <p v-if="isPositiveDecimalAmount(amount)" class="refund-fields__preview">{{ t('refundForm.currentRefund', { amount: money(amount!) }) }}</p>
        <el-alert v-if="context" class="refund-fields__limit" type="warning" show-icon :closable="false" :title="t(hasAvailableAmount ? 'refundForm.limit' : 'refundForm.noAvailable')" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { CircleCheck, Clock, Wallet } from '@element-plus/icons-vue';
import { compareDecimalAmounts, formatMoneyAmount, isPositiveDecimalAmount, normalizeDecimalAmount } from '../amount';
import { REFUND_REASON_CODES, type RefundContext, type RefundDraft } from '../refund';

// 两端共享字段、校验和额度展示；翻译函数由宿主传入，兼容两端不同的 vue-i18n 版本。
const props = defineProps<{
    model: RefundDraft;
    context: RefundContext | null;
    loading: boolean;
    submitting: boolean;
    locale: string;
    t: (key: string, params?: Record<string, string | number>) => string;
}>();
const emit = defineEmits<{
    'update:model': [value: RefundDraft];
}>();
const formRef = ref<FormInstance>();
const digits = computed(() => props.context?.currencyExponent ?? 2);
const maximum = computed(() => normalizeDecimalAmount(props.context?.availableRefundAmount ?? '0') ?? '0');
const hasAvailableAmount = computed(() => isPositiveDecimalAmount(maximum.value));
const formDisabled = computed(() => props.loading || props.submitting || !props.context || !hasAvailableAmount.value);
const amount = computed<string | null | undefined>({
    get: () => props.model.amount,
    set: (value) => updateModel({ amount: value }),
});
const mode = computed<string>({
    get: () => props.model.mode,
    set: (value) => {
        updateModel({ mode: value, amount: value === 'FULL' ? maximum.value : null });
        formRef.value?.clearValidate('amount');
    },
});
const reason = computed<string>({
    get: () => props.model.reason,
    set: (value) => updateModel({ reason: value }),
});
const description = computed<string>({
    get: () => props.model.description,
    set: (value) => updateModel({ description: value }),
});
const balances = computed(() => [
    { key: 'refunded', amount: props.context?.refundedAmount ?? 0 },
    { key: 'pending', amount: props.context?.pendingRefundAmount ?? 0 },
    { key: 'available', amount: props.context?.availableRefundAmount ?? 0 },
]);
const rules = computed<FormRules>(() => ({
    amount: [{ required: true, validator: (_rule, value, callback) => {
        const normalized = normalizeDecimalAmount(value);
        if (normalized === null || !isPositiveDecimalAmount(normalized)) {
            callback(new Error(props.t('refundForm.amountRequired')));
        } else if ((String(value).trim().split('.')[1]?.length ?? 0) > digits.value) {
            callback(new Error(props.t('refundForm.amountPrecision', { digits: digits.value })));
        } else if (compareDecimalAmounts(normalized, maximum.value) > 0) {
            callback(new Error(props.t('refundForm.amountExceedsAvailable')));
        } else {
            callback();
        }
    }, trigger: 'blur' }],
    reason: [{ required: true, message: props.t('refundForm.reasonRequired'), trigger: 'change' }],
    description: [
        { required: props.model.reason === 'OTHER', validator: (_rule, value, callback) => {
            callback(props.model.reason === 'OTHER' && !String(value || '').trim()
                ? new Error(props.t('refundForm.descriptionRequired')) : undefined);
        }, trigger: 'blur' },
        { max: 200, message: props.t('refundForm.descriptionTooLong'), trigger: 'blur' },
    ],
}));

function money(value: string | number) {
    return `${props.context?.currency || props.model.currency} ${formatMoneyAmount(value, props.locale, digits.value)}`;
}

function updateModel(patch: Partial<RefundDraft>) {
    emit('update:model', { ...props.model, ...patch });
}

watch(() => props.locale, () => formRef.value?.clearValidate());

async function validate() {
    if (props.loading || !props.context || !hasAvailableAmount.value) return false;
    return (await formRef.value?.validate().catch(() => false)) === true;
}
defineExpose({ validate });
</script>

<style scoped>
.refund-fields__balances { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0; margin: 0 0 22px; padding: 15px 0; background: var(--el-fill-color-light); border: 1px solid var(--el-border-color-extra-light); border-radius: 10px; }
.refund-fields__balances > div { min-width: 0; padding: 0 18px; border-right: 1px solid var(--el-border-color-light); }
.refund-fields__balances > div:last-child { border-right: 0; }
.refund-fields__balances dt { display: flex; align-items: center; gap: 6px; color: var(--el-text-color-secondary); font-size: 12px; line-height: 1.5; margin-bottom: 8px; }
.refund-fields__balances dt .el-icon { flex: none; font-size: 15px; }
.refund-fields__balances dd { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px; min-width: 0; margin: 0; color: var(--el-text-color-primary); font-variant-numeric: tabular-nums; line-height: 1.3; overflow-wrap: anywhere; }
.refund-fields__balances dd span { font-size: 12px; font-weight: 600; }
.refund-fields__balances dd strong { min-width: 0; font-size: 20px; font-weight: 700; overflow-wrap: anywhere; }
.refund-fields__balances .is-available dd { color: var(--el-color-primary); }
.refund-fields__loading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; height: 92px; margin-bottom: 22px; }
.refund-fields__loading span { background: var(--el-fill-color-light); border-radius: 10px; }
.refund-fields__preview { margin: -2px 0 14px; color: var(--el-color-primary); font-size: 13px; font-weight: 600; }
.refund-fields__limit { padding: 10px 12px; border-radius: 8px; }
.refund-fields__limit :deep(.el-alert__title) { font-size: 12px; line-height: 1.6; }
@media (max-width: 580px) {
    .refund-fields__balances { grid-template-columns: minmax(0, 1fr); padding: 4px 14px; }
    .refund-fields__balances > div { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 12px 0; border-right: 0; border-bottom: 1px solid var(--el-border-color-extra-light); }
    .refund-fields__balances > div:last-child { border-bottom: 0; }
    .refund-fields__balances dt { margin: 0; }
    .refund-fields__balances dd strong { font-size: 18px; }
}
</style>
