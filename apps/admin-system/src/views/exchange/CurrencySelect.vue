<template>
    <el-select
        :model-value="modelValue"
        class="exchange-currency-select"
        :placeholder="placeholder || $t('exchange.placeholders.currency')"
        :disabled="disabled"
        :loading="loading"
        clearable
        filterable
        remote
        reserve-keyword
        :remote-method="handleRemoteSearch"
        :style="{ width: selectWidth }"
        @focus="loadDefaultOptions"
        @update:model-value="handleChange"
    >
        <el-option v-for="item in displayOptions" :key="item.alpha3Code" :label="currencyLabel(item)" :value="item.alpha3Code" />
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { searchCurrencies, type IsoCurrency } from '@/api/base/currency';

const props = defineProps<{
    modelValue?: string;
    placeholder?: string;
    disabled?: boolean;
    width?: string | number;
    allowAll?: boolean;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
    change: [value: string];
}>();

const loading = ref(false);
const options = ref<IsoCurrency[]>([]);
const { t } = useI18n();
let requestSeq = 0;

const selectWidth = computed(() => (typeof props.width === 'number' ? `${props.width}px` : props.width || '180px'));

const displayOptions = computed(() => {
    const current = normalizeCode(props.modelValue);
    const allOption = props.allowAll ? [buildAllOption()] : [];
    const mergedOptions = [...allOption, ...options.value];
    if (!current || mergedOptions.some((item) => item.alpha3Code === current)) {
        return mergedOptions;
    }
    return [{ id: 0, alpha3Code: current, englishName: current, chineseName: '' }, ...mergedOptions];
});

onMounted(loadDefaultOptions);

function handleChange(value?: string) {
    const nextValue = normalizeCode(value);
    emit('update:modelValue', nextValue);
    emit('change', nextValue);
}

function handleRemoteSearch(keyword: string) {
    loadOptions(keyword);
}

function loadDefaultOptions() {
    if (options.value.length === 0) {
        loadOptions();
    }
}

async function loadOptions(keyword = '') {
    const seq = ++requestSeq;
    loading.value = true;
    try {
        const result = await searchCurrencies({
            pageNo: 1,
            pageSize: 100,
            keyword: keyword.trim() || undefined,
            status: 1,
        });
        if (seq === requestSeq) {
            options.value = result.records.map((item) => ({ ...item, alpha3Code: normalizeCode(item.alpha3Code) }));
        }
    } finally {
        if (seq === requestSeq) {
            loading.value = false;
        }
    }
}

function currencyLabel(item: IsoCurrency) {
    if (item.alpha3Code === 'ALL') {
        return t('exchange.placeholders.allCurrenciesOption');
    }
    return [item.alpha3Code, item.chineseName, item.englishName].filter(Boolean).join(' - ');
}

function normalizeCode(value?: string) {
    return (value || '').trim().toUpperCase();
}

function buildAllOption(): IsoCurrency {
    return { id: 0, alpha3Code: 'ALL', englishName: 'ALL', chineseName: '' };
}
</script>
