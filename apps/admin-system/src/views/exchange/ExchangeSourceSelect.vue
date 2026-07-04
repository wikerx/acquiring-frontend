<template>
    <el-select
        :model-value="modelValue"
        class="exchange-source-select"
        :placeholder="placeholder || $t('exchange.placeholders.source')"
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
        <el-option v-for="item in displayOptions" :key="item.sourceCode" :label="sourceLabel(item)" :value="item.sourceCode" />
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { searchExchangeSources, type ExchangeRateSource } from '@/api/exchange';

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

const { t } = useI18n();
const loading = ref(false);
const options = ref<ExchangeRateSource[]>([]);
let requestSeq = 0;

const selectWidth = computed(() => (typeof props.width === 'number' ? `${props.width}px` : props.width || '180px'));

const displayOptions = computed(() => {
    const current = normalizeCode(props.modelValue);
    const allOption = props.allowAll ? [buildAllOption()] : [];
    const mergedOptions = [...allOption, ...options.value];
    if (!current || mergedOptions.some((item) => item.sourceCode === current)) {
        return mergedOptions;
    }
    return [{ id: 0, sourceCode: current, sourceName: current, sourceType: '', defaultSource: 0, priority: 0, timeoutSeconds: 0, sourceStatus: 1 }, ...mergedOptions];
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
        const result = await searchExchangeSources({
            pageNo: 1,
            pageSize: 100,
            keyword: keyword.trim() || undefined,
            sourceStatus: 1,
        });
        if (seq === requestSeq) {
            options.value = result.records.map((item) => ({ ...item, sourceCode: normalizeCode(item.sourceCode) }));
        }
    } finally {
        if (seq === requestSeq) {
            loading.value = false;
        }
    }
}

function sourceLabel(item: ExchangeRateSource) {
    if (item.sourceCode === 'ALL') {
        return t('exchange.placeholders.allSourcesOption');
    }
    return t('exchange.placeholders.sourceOptionLabel', { name: item.sourceName || item.sourceCode, code: item.sourceCode });
}

function normalizeCode(value?: string) {
    return (value || '').trim().toUpperCase();
}

function buildAllOption(): ExchangeRateSource {
    return { id: 0, sourceCode: 'ALL', sourceName: 'ALL', sourceType: '', defaultSource: 0, priority: 0, timeoutSeconds: 0, sourceStatus: 1 };
}
</script>
