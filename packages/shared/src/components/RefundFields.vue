<template>
    <div v-loading="loading" class="refund-fields">
        <dl v-if="context" class="refund-fields__balances">
            <div v-for="item in balances" :key="item.key">
                <dt>{{ t(`refundForm.${item.key}`) }}</dt>
                <dd>{{ money(item.amount) }}</dd>
            </div>
        </dl>
        <el-alert v-if="!loading && !context" type="error" :closable="false" show-icon :title="t('refundForm.contextFailed')" />
        <el-form ref="formRef" :model="model" :rules="rules" :validate-on-rule-change="false" :disabled="formDisabled" label-position="top" class="refund-fields__form">
            <el-form-item :label="t('refundForm.mode')" class="refund-fields__wide">
                <el-radio-group v-model="mode">
                    <el-radio value="PARTIAL">{{ t('refundForm.partial') }}</el-radio>
                    <el-radio value="FULL">{{ t('refundForm.full') }}</el-radio>
                </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('refundForm.amount')" prop="amount">
                <div class="refund-fields__amount">
                    <el-input v-model="amount" :disabled="formDisabled || mode === 'FULL'" inputmode="decimal" autocomplete="off" :placeholder="t('refundForm.amountPlaceholder')" />
                    <span>{{ context?.currency || model.currency }}</span>
                </div>
            </el-form-item>
            <el-form-item :label="t('refundForm.reason')" prop="reason">
                <el-select v-model="reason" :placeholder="t('refundForm.selectReason')" filterable @change="formRef?.clearValidate('description')">
                    <el-option v-for="code in REFUND_REASON_CODES" :key="code" :value="code" :label="t(`refundForm.reasons.${code}`)" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('refundForm.description')" prop="description" class="refund-fields__wide">
                <el-input v-model="description" type="textarea" :rows="3" maxlength="200" show-word-limit :placeholder="t(reason === 'OTHER' ? 'refundForm.descriptionRequired' : 'refundForm.descriptionPlaceholder')" />
            </el-form-item>
        </el-form>
        <p v-if="isPositiveDecimalAmount(amount)" class="refund-fields__preview">{{ t('refundForm.currentRefund', { amount: money(amount!) }) }}</p>
        <el-alert v-if="context" type="warning" show-icon :closable="false" :title="t(hasAvailableAmount ? 'refundForm.limit' : 'refundForm.noAvailable')" />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { compareDecimalAmounts, formatDecimalAmount, isPositiveDecimalAmount, normalizeDecimalAmount } from '../amount';
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
    return `${props.context?.currency || props.model.currency} ${formatDecimalAmount(value, props.locale, digits.value, digits.value)}`;
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
.refund-fields__balances { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 0 0 18px; padding: 12px; background: var(--el-fill-color-light); border-radius: 6px; }
.refund-fields__balances dt { color: var(--el-text-color-secondary); font-size: 12px; margin-bottom: 6px; }
.refund-fields__balances dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
.refund-fields__form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 14px; }
.refund-fields__wide { grid-column: 1 / -1; }
.refund-fields__form :deep(.el-radio-group) { display: flex; flex-wrap: wrap; }
.refund-fields__form :deep(.el-radio) { height: auto; min-height: 32px; white-space: normal; }
.refund-fields__form :deep(.el-radio__label) { white-space: normal; }
.refund-fields__form :deep(.el-form-item__label) { height: auto; }
.refund-fields__amount { display: flex; width: 100%; align-items: center; gap: 8px; }
.refund-fields__amount :deep(.el-input) { flex: 1; width: 0; }
.refund-fields__preview { margin: 0 0 12px; font-weight: 600; }
@media (max-width: 560px) { .refund-fields__form { grid-template-columns: 1fr; } .refund-fields__balances { grid-template-columns: 1fr; gap: 10px; } }
</style>
