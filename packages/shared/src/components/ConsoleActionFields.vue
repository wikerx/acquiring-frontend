<template>
    <el-form ref="formRef" :model="model" :rules="rules" :disabled="submitting" label-position="top" class="console-action-fields">
        <el-form-item v-if="scope === 'capture'" :label="t('transactionAction.mode')" class="console-action-fields__wide">
            <el-radio-group :model-value="model.mode" @update:model-value="setMode(String($event))">
                <el-radio value="PARTIAL">{{ t('transactionAction.partial') }}</el-radio>
                <el-radio value="FULL">{{ t('transactionAction.full') }}</el-radio>
            </el-radio-group>
        </el-form-item>
        <el-form-item v-if="scope === 'capture'" :label="t('transactionAction.amount')" prop="amount">
            <el-input :model-value="model.amount" inputmode="decimal" :disabled="model.mode === 'FULL'" @update:model-value="update({ amount: $event })">
                <template #append>{{ currency }}</template>
            </el-input>
        </el-form-item>
        <el-form-item :label="t('transactionAction.reason')" prop="reason" :class="{ 'console-action-fields__wide': scope === 'void' }">
            <el-select :model-value="model.reason" :placeholder="t('transactionAction.reasonRequired')" filterable @update:model-value="update({ reason: $event })">
                <el-option v-for="code in reasons" :key="code" :value="code" :label="t(`transactionAction.reasons.${code}`)" />
            </el-select>
        </el-form-item>
        <el-form-item :label="t('transactionAction.description')" prop="description" class="console-action-fields__wide">
            <el-input :model-value="model.description" type="textarea" :rows="3" maxlength="200" show-word-limit
                :placeholder="t(model.reason === 'OTHER' ? 'transactionAction.otherRequired' : 'transactionAction.optionalDescription')"
                @update:model-value="update({ description: $event })" />
        </el-form-item>
    </el-form>
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { compareDecimalAmounts, isPositiveDecimalAmount, normalizeDecimalAmount } from '../amount';
import { CAPTURE_REASON_CODES, VOID_REASON_CODES, type ConsoleActionDraft } from '../transactionAction';

const props = defineProps<{ model: ConsoleActionDraft; scope: 'capture' | 'void'; maximum?: string | number | null; currency?: string; exponent?: number; submitting: boolean; t: (key: string) => string }>();
const emit = defineEmits<{ 'update:model': [value: ConsoleActionDraft] }>();
const formRef = ref<FormInstance>();
const reasons = computed(() => props.scope === 'capture' ? CAPTURE_REASON_CODES : VOID_REASON_CODES);
const rules = computed<FormRules>(() => ({
    reason: [{ required: true, validator: (_r, value, done) => done(reasons.value.some(code => code === value) ? undefined : new Error(props.t('transactionAction.reasonRequired'))) }],
    description: [{ required: props.model.reason === 'OTHER', validator: (_r, value, done) => {
        const notes = String(value || '').trim();
        done(notes.length > 200 ? new Error(props.t('transactionAction.descriptionTooLong'))
            : props.model.reason === 'OTHER' && !notes ? new Error(props.t('transactionAction.otherRequired')) : undefined);
    } }],
    amount: [{ required: true, validator: (_r, value, done) => {
        const normalized = normalizeDecimalAmount(value);
        done(normalized === null || !isPositiveDecimalAmount(normalized) || (String(value).trim().split('.')[1]?.length ?? 0) > (props.exponent ?? 2)
            ? new Error(props.t('transactionAction.amountRequired'))
            : compareDecimalAmounts(normalized, props.maximum ?? '0') > 0 ? new Error(props.t('transactionAction.amountExceeded')) : undefined);
    } }],
}));
function update(value: Partial<ConsoleActionDraft>) {
    emit('update:model', { ...props.model, ...value });
    void nextTick(() => formRef.value?.clearValidate(Object.keys(value)));
}
function setMode(mode: string) { update({ mode, amount: mode === 'FULL' ? normalizeDecimalAmount(props.maximum ?? '0') : props.model.amount }); }
defineExpose({ validate: async () => { try { return await formRef.value?.validate() ?? false; } catch { return false; } } });
</script>
<style scoped>
.console-action-fields { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0 16px; }
.console-action-fields__wide { grid-column: 1 / -1; }
.console-action-fields :deep(.el-select) { width: 100%; }
@media (max-width: 560px) { .console-action-fields { grid-template-columns: minmax(0, 1fr); } }
</style>
