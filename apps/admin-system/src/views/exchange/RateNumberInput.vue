<template>
    <el-input
        :model-value="modelValue"
        class="exchange-rate-input"
        :placeholder="placeholder"
        :disabled="disabled"
        :maxlength="maxlength"
        :style="{ width: inputWidth }"
        inputmode="decimal"
        @update:model-value="handleInput"
        @blur="handleBlur"
    >
        <template v-if="appendText" #append>{{ appendText }}</template>
    </el-input>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    maxlength?: number;
    width?: string | number;
    appendText?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
}>();

const inputWidth = computed(() => (typeof props.width === 'number' ? `${props.width}px` : props.width || '100%'));

function handleInput(value: string | number) {
    emit('update:modelValue', normalizeRateInput(String(value ?? '')));
}

function handleBlur() {
    const value = finalizeRateInput(props.modelValue || '');
    emit('update:modelValue', value);
    emit('change', value);
}

// Keep FX values as decimal strings; converting to Number would lose precision before the backend BigDecimal parse.
function normalizeRateInput(value: string) {
    const sanitized = value.replace(/[^\d.]/g, '');
    const [integerPart, ...decimalParts] = sanitized.split('.');
    const decimalPart = decimalParts.join('');
    if (sanitized.startsWith('.')) {
        return decimalPart ? `0.${decimalPart}` : '';
    }
    return decimalParts.length > 0 ? `${integerPart || '0'}.${decimalPart}` : integerPart;
}

function finalizeRateInput(value: string) {
    return normalizeRateInput(value).replace(/\.$/, '');
}
</script>
