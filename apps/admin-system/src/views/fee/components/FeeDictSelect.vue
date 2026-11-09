<template>
    <el-select
        :model-value="modelValue"
        :placeholder="placeholder || $t('common.pleaseSelect')"
        :loading="loading"
        :disabled="disabled"
        :multiple="multiple"
        :collapse-tags="multiple"
        :collapse-tags-tooltip="multiple"
        :max-collapse-tags="2"
        clearable
        filterable
        @update:model-value="handleChange"
    >
        <template v-if="!multiple && isPaymentDimension && selectedLogoKeys.length" #prefix>
            <PaymentLogoGroup :keys="selectedLogoKeys" size="sm" :wrap="false" />
        </template>
        <template v-if="isTransactionTypeDimension" #label="{ value, label }">
            <TransactionTypeDisplay :value="String(value)" :label="String(label)" align="start" />
        </template>
        <el-option v-if="showAllOption" :label="allLabel || $t('feeAccount.allPaymentMethods')" value="ALL" />
        <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
            <div v-if="isPaymentDimension" class="fee-dict-option">
                <PaymentLogoGroup v-if="logoKeys(item).length" :keys="logoKeys(item)" size="sm" :wrap="false" />
                <span>{{ item.label }}</span>
            </div>
            <TransactionTypeDisplay
                v-else-if="isTransactionTypeDimension"
                :value="item.value"
                :label="item.label"
                align="start"
            />
            <span v-else>{{ item.label }}</span>
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
    getPaymentLogo,
    PaymentLogoGroup,
    TransactionTypeDisplay,
    type PaymentLogoKey,
} from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import {
    cardLogoKeys,
    loadDictOptions,
    paymentLogoKeys,
    type SelectOption,
} from '@/views/channel/shared';

const props = withDefaults(defineProps<{
    modelValue?: string | string[];
    dictType: string;
    placeholder?: string;
    allowAll?: boolean;
    compatibleAll?: boolean;
    allLabel?: string;
    disabled?: boolean;
    multiple?: boolean;
}>(), {
    modelValue: '',
    placeholder: '',
    allowAll: false,
    compatibleAll: false,
    allLabel: '',
    disabled: false,
    multiple: false,
});

const emit = defineEmits<{
    'update:modelValue': [value: string | string[]];
    change: [value: string | string[]];
}>();

const { locale } = useI18n();
const loading = ref(false);
const options = ref<SelectOption[]>([]);
const selectedValues = computed(() => Array.isArray(props.modelValue)
    ? props.modelValue
    : props.modelValue ? [props.modelValue] : []);
const showAllOption = computed(() => props.allowAll
    || props.compatibleAll && selectedValues.value.includes('ALL'));
const isPaymentDimension = computed(() => [
    'acquiring_payment_method',
    'payout_payment_method',
    'card_brand',
].includes(props.dictType));
const isTransactionTypeDimension = computed(() => [
    'transaction_type',
    'payout_transaction_type',
].includes(props.dictType));
const selectedLogoKeys = computed(() => {
    if (Array.isArray(props.modelValue) || !props.modelValue) {
        return [];
    }
    const option = options.value.find((item) => item.value === props.modelValue);
    return logoKeys(option || { value: props.modelValue, label: props.modelValue });
});

onMounted(loadOptions);
watch(() => [props.dictType, locale.value], loadOptions);

async function loadOptions() {
    loading.value = true;
    try {
        const loaded = await loadDictOptions(props.dictType, String(locale.value || 'zh-CN'));
        options.value = loaded.filter((item) => item.value !== 'ALL');
    } finally {
        loading.value = false;
    }
}

function handleChange(value?: string | string[]) {
    const nextValue = value || (props.multiple ? [] : '');
    emit('update:modelValue', nextValue);
    emit('change', nextValue);
}

function logoKeys(option: SelectOption): PaymentLogoKey[] {
    const keys = props.dictType === 'card_brand'
        ? cardLogoKeys(option.value, option)
        : paymentLogoKeys(option.value, option);
    return keys.filter((key) => Boolean(getPaymentLogo(key).asset));
}
</script>

<style scoped>
.fee-dict-option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 8px;
}

.fee-dict-option > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
