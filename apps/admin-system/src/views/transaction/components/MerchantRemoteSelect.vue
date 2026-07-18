<template>
    <el-select
        :model-value="modelValue"
        :placeholder="placeholder || t('common.pleaseSelect')"
        clearable
        filterable
        remote
        remote-show-suffix
        :loading="loading"
        :remote-method="loadOptions"
        @change="handleChange"
        @clear="handleClear"
    >
        <el-option v-for="item in options" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
    </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { MerchantInfo } from '@/api/merchant/info';
import { merchantOptionLabel, searchMerchantOptions } from '../shared';

defineProps<{
    modelValue?: string;
    placeholder?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
}>();

const { t } = useI18n();
const loading = ref(false);
const options = ref<MerchantInfo[]>([]);

onMounted(() => loadOptions(''));

async function loadOptions(keyword: string) {
    loading.value = true;
    try {
        options.value = await searchMerchantOptions(keyword);
    } finally {
        loading.value = false;
    }
}

function handleChange(value: string) {
    emit('update:modelValue', value || '');
    emit('change', value || '');
}

function handleClear() {
    emit('update:modelValue', '');
    emit('change', '');
    loadOptions('');
}
</script>
