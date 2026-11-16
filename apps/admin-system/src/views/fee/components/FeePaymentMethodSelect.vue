<template>
    <el-select
        :model-value="selectedValues"
        :placeholder="placeholder || $t('feeAccount.multipleSelectPlaceholder')"
        :loading="loading"
        multiple
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="2"
        clearable
        filterable
        @update:model-value="handleChange"
    >
        <template #label="{ value, label }">
            <div class="fee-payment-option fee-payment-option--selected">
                <PaymentLogoGroup :keys="logoKeys(String(value))" fallback="text" size="sm" :wrap="false" />
                <span>{{ label }}</span>
            </div>
        </template>
        <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
        >
            <div class="fee-payment-option">
                <PaymentLogoGroup :keys="item.logoKeys" fallback="text" size="sm" :wrap="false" />
                <span>{{ item.label }}</span>
            </div>
        </el-option>
    </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import {
    cardLogoKeys,
    loadDictOptions,
    paymentLogoKeys,
    type SelectOption,
} from '@/views/channel/shared';

interface UnifiedPaymentOption {
    value: string;
    label: string;
    logoKeys: PaymentLogoKey[];
}

const PAYMENT_PREFIX = 'PAYMENT:';
const CARD_PREFIX = 'CARD:';

const props = withDefaults(defineProps<{
    paymentTypes?: string[];
    paymentMethods?: string[];
    placeholder?: string;
}>(), {
    paymentTypes: () => [],
    paymentMethods: () => [],
    placeholder: '',
});

const emit = defineEmits<{
    'update:paymentTypes': [value: string[]];
    'update:paymentMethods': [value: string[]];
}>();

const { locale } = useI18n();
const loading = ref(false);
const paymentTypeOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);

const options = computed<UnifiedPaymentOption[]>(() => {
    const cardBrands = cardBrandOptions.value.map((item) => ({
        value: `${CARD_PREFIX}${item.value}`,
        label: item.label,
        logoKeys: cardLogoKeys(item.value, item),
    }));
    const alternativePayments = paymentTypeOptions.value
        .filter((item) => item.value !== 'ALL' && item.value !== 'BANK_CARD')
        .map((item) => ({
            value: `${PAYMENT_PREFIX}${item.value}`,
            label: item.label,
            logoKeys: paymentLogoKeys(item.value, item),
        }));
    return [...cardBrands, ...alternativePayments];
});

const selectedValues = computed(() => {
    const selected: string[] = [];
    const paymentTypes = normalizedValues(props.paymentTypes);
    const paymentMethods = normalizedValues(props.paymentMethods);
    if (paymentTypes.includes('BANK_CARD')) {
        if (!paymentMethods.length || paymentMethods.includes('ALL')) {
            selected.push(...cardBrandOptions.value.map((item) => `${CARD_PREFIX}${item.value}`));
        } else {
            selected.push(...paymentMethods.map((item) => `${CARD_PREFIX}${item}`));
        }
    }
    selected.push(...paymentTypes
        .filter((item) => item !== 'ALL' && item !== 'BANK_CARD')
        .map((item) => `${PAYMENT_PREFIX}${item}`));
    return selected;
});

onMounted(loadOptions);
watch(() => locale.value, loadOptions);

async function loadOptions() {
    loading.value = true;
    try {
        const language = String(locale.value || 'zh-CN');
        const [payments, cards] = await Promise.allSettled([
            loadDictOptions('acquiring_payment_method', language),
            loadDictOptions('card_brand', language),
        ]);
        paymentTypeOptions.value = payments.status === 'fulfilled' ? payments.value : [];
        cardBrandOptions.value = cards.status === 'fulfilled' ? cards.value : [];
    } finally {
        loading.value = false;
    }
}

function handleChange(sourceValues?: string[]) {
    const values = [...new Set(sourceValues || [])];
    const paymentTypes = new Set<string>();
    const paymentMethods: string[] = [];
    for (const value of values) {
        if (value.startsWith(CARD_PREFIX)) {
            paymentTypes.add('BANK_CARD');
            paymentMethods.push(value.slice(CARD_PREFIX.length));
            continue;
        }
        if (value.startsWith(PAYMENT_PREFIX)) {
            paymentTypes.add(value.slice(PAYMENT_PREFIX.length));
        }
    }
    emit('update:paymentTypes', [...paymentTypes]);
    emit('update:paymentMethods', paymentTypes.has('BANK_CARD') && paymentMethods.length
        ? [...new Set(paymentMethods)]
        : ['ALL']);
}

function normalizedValues(values: string[]) {
    return [...new Set(values.map((item) => item.trim().toUpperCase()).filter(Boolean))];
}

function logoKeys(value: string) {
    return options.value.find((item) => item.value === value)?.logoKeys || [];
}
</script>

<style scoped>
.fee-payment-option {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 9px;
}

.fee-payment-option--selected {
    gap: 6px;
}

.fee-payment-option > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.fee-payment-option :deep(.payment-logo-group) {
    flex: 0 0 auto;
}
</style>
