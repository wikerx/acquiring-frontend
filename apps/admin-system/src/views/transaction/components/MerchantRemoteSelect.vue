<template>
    <el-select
        :model-value="modelValue"
        :placeholder="placeholder || t('common.pleaseSelect')"
        clearable
        filterable
        remote
        remote-show-suffix
        :multiple="multiple"
        :collapse-tags="multiple"
        :collapse-tags-tooltip="multiple"
        :max-collapse-tags="2"
        reserve-keyword
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

const props = withDefaults(defineProps<{
    modelValue?: string | string[];
    placeholder?: string;
    multiple?: boolean;
}>(), {
    modelValue: '',
    placeholder: '',
    multiple: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | string[]];
    change: [value: string | string[]];
}>();

const { t } = useI18n();
const loading = ref(false);
const options = ref<MerchantInfo[]>([]);

onMounted(() => loadOptions(''));

async function loadOptions(keyword: string) {
    loading.value = true;
    try {
        const selectedIds = new Set(Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue].filter(Boolean));
        const selectedOptions = options.value.filter((item) => selectedIds.has(item.merchantId));
        const loadedOptions = await searchMerchantOptions(keyword);
        options.value = [...selectedOptions, ...loadedOptions]
            .filter((item, index, items) => items.findIndex((candidate) => candidate.merchantId === item.merchantId) === index);
    } finally {
        loading.value = false;
    }
}

function handleChange(value: string | string[]) {
    const nextValue = props.multiple ? (Array.isArray(value) ? value : []) : (Array.isArray(value) ? '' : value || '');
    emit('update:modelValue', nextValue);
    emit('change', nextValue);
}

function handleClear() {
    const emptyValue = props.multiple ? [] : '';
    emit('update:modelValue', emptyValue);
    emit('change', emptyValue);
    loadOptions('');
}
</script>
