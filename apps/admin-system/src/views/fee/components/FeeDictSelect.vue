<template>
    <el-select
        :model-value="modelValue"
        :placeholder="placeholder || $t('common.pleaseSelect')"
        :loading="loading"
        :disabled="disabled"
        clearable
        filterable
        @update:model-value="handleChange"
    >
        <el-option v-if="allowAll" :label="$t('feeAccount.allPaymentMethods')" value="ALL" />
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { loadDictOptions, type SelectOption } from '@/views/channel/shared';

const props = withDefaults(defineProps<{
    modelValue?: string;
    dictType: string;
    placeholder?: string;
    allowAll?: boolean;
    disabled?: boolean;
}>(), {
    modelValue: '',
    placeholder: '',
    allowAll: false,
    disabled: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
}>();

const { locale } = useI18n();
const loading = ref(false);
const options = ref<SelectOption[]>([]);

onMounted(loadOptions);
watch(() => [props.dictType, locale.value], loadOptions);

async function loadOptions() {
    loading.value = true;
    try {
        const loaded = await loadDictOptions(props.dictType, String(locale.value || 'zh-CN'));
        options.value = loaded.filter((item) => !props.allowAll || item.value !== 'ALL');
    } finally {
        loading.value = false;
    }
}

function handleChange(value?: string) {
    const nextValue = value || '';
    emit('update:modelValue', nextValue);
    emit('change', nextValue);
}
</script>
