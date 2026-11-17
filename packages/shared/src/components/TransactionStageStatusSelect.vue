<template>
    <el-select
        class="transaction-stage-status-select"
        :model-value="modelValue"
        :placeholder="placeholder"
        :filterable="filterable"
        :clearable="clearable"
        @update:model-value="updateValue"
    >
        <template #label="{ value, label }">
            <TransactionStageStatusDisplay :domain="domain" :value="String(value)" :label="String(label)" />
        </template>
        <el-option v-for="option in options" :key="option.value" :label="option.label" :value="option.value">
            <TransactionStageStatusDisplay :domain="domain" :value="option.value" :label="option.label" />
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import type { TransactionStage } from '../transactionStagePresentation';
import TransactionStageStatusDisplay from './TransactionStageStatusDisplay.vue';

withDefaults(defineProps<{
    modelValue?: string;
    domain: TransactionStage;
    options: Array<{ label: string; value: string }>;
    placeholder?: string;
    filterable?: boolean;
    clearable?: boolean;
}>(), { modelValue: '', placeholder: '', filterable: true, clearable: true });
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

function updateValue(value: unknown) {
    // 下拉只改变展示，原始状态码直接交还业务查询，清空后返回空字符串。
    emit('update:modelValue', value == null ? '' : String(value));
}
</script>

<style scoped>
.transaction-stage-status-select { width: 100%; }
.transaction-stage-status-select :deep(.el-select__selected-item) { display: flex; align-items: center; }
</style>
