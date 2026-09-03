<template>
    <div
        v-if="displayGroups.length"
        class="payment-method-display"
        :class="`payment-method-display--${align}`"
        :title="tooltipText"
        :aria-label="tooltipText"
    >
        <div v-for="group in displayGroups" :key="group.key" class="payment-method-display__group">
            <span v-if="group.label" class="payment-method-display__label">{{ group.label }}</span>
            <PaymentLogoGroup
                v-if="group.logoKeys.length"
                :keys="group.logoKeys"
                size="sm"
                align="center"
                wrap
            />
            <span
                v-for="label in group.fallbackLabels"
                :key="label"
                class="payment-method-display__fallback"
            >
                {{ label }}
            </span>
        </div>
    </div>
    <span v-else class="payment-method-display__empty">-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
    DEFAULT_CARD_BRAND_LOGOS,
    getPaymentLogo,
    resolvePaymentLogoKeys,
    type PaymentLogoKey,
} from '../paymentBrand';
import PaymentLogoGroup from './PaymentLogoGroup.vue';

interface PaymentDimensionItem {
    value: string;
    label: string;
}

interface PaymentMethodGroup {
    key: string;
    label: string;
    title: string;
    logoKeys: PaymentLogoKey[];
    fallbackLabels: string[];
}

const props = withDefaults(defineProps<{
    paymentTypes?: PaymentDimensionItem[];
    paymentMethods?: PaymentDimensionItem[];
    allCardBrandsLabel?: string;
    showPaymentTypeLabel?: boolean;
    align?: 'start' | 'center' | 'end';
}>(), {
    paymentTypes: () => [],
    paymentMethods: () => [],
    allCardBrandsLabel: '',
    showPaymentTypeLabel: false,
    align: 'center',
});

const normalizedPaymentTypes = computed(() => uniqueItems(props.paymentTypes));
const normalizedPaymentMethods = computed(() => uniqueItems(props.paymentMethods));

const displayGroups = computed<PaymentMethodGroup[]>(() => normalizedPaymentTypes.value.map((paymentType) => {
    if (paymentType.value === 'BANK_CARD') {
        return bankCardGroup(paymentType, normalizedPaymentMethods.value);
    }

    const logoKeys = assetLogoKeys(resolvePaymentLogoKeys(paymentType.value));
    return {
        key: paymentType.value,
        label: props.showPaymentTypeLabel || !logoKeys.length ? paymentType.label : '',
        title: paymentType.label,
        logoKeys,
        fallbackLabels: [],
    };
}));

const tooltipText = computed(() => displayGroups.value.map((group) => group.title).join(' / '));

function bankCardGroup(paymentType: PaymentDimensionItem, paymentMethods: PaymentDimensionItem[]): PaymentMethodGroup {
    const hasAllBrands = !paymentMethods.length || paymentMethods.some((item) => item.value === 'ALL');
    if (hasAllBrands) {
        const allMethodLabel = paymentMethods.find((item) => item.value === 'ALL')?.label;
        const title = props.allCardBrandsLabel
            || [paymentType.label, allMethodLabel].filter(Boolean).join(' · ');
        return {
            key: `${paymentType.value}:ALL`,
            label: props.showPaymentTypeLabel ? paymentType.label : '',
            title,
            logoKeys: assetLogoKeys(DEFAULT_CARD_BRAND_LOGOS),
            fallbackLabels: [],
        };
    }

    const logoKeys = assetLogoKeys(paymentMethods.flatMap((item) => resolvePaymentLogoKeys('', item.value)));
    const fallbackLabels = paymentMethods
        .filter((item) => !assetLogoKeys(resolvePaymentLogoKeys('', item.value)).length)
        .map((item) => item.label);
    return {
        key: `${paymentType.value}:${paymentMethods.map((item) => item.value).join(',')}`,
        label: props.showPaymentTypeLabel ? paymentType.label : '',
        title: `${paymentType.label} · ${paymentMethods.map((item) => item.label).join(' / ')}`,
        logoKeys,
        fallbackLabels,
    };
}

function uniqueItems(items: PaymentDimensionItem[]) {
    return items.filter((item, index) => item.value && item.value !== '-'
        && items.findIndex((candidate) => candidate.value === item.value) === index);
}

function assetLogoKeys(keys: PaymentLogoKey[]) {
    return keys.filter((key, index) => Boolean(getPaymentLogo(key).asset) && keys.indexOf(key) === index);
}

</script>

<style scoped>
.payment-method-display {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    min-height: 24px;
    max-width: 100%;
    color: #344054;
}

.payment-method-display--start { justify-content: flex-start; }
.payment-method-display--center { justify-content: center; }
.payment-method-display--end { justify-content: flex-end; }

.payment-method-display__group {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
    max-width: 100%;
}

.payment-method-display__group + .payment-method-display__group {
    padding-left: 10px;
    border-left: 1px solid #e1e7ef;
}

.payment-method-display__label,
.payment-method-display__fallback {
    overflow: hidden;
    max-width: 128px;
    font-size: 12px;
    font-weight: 600;
    line-height: 20px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.payment-method-display__fallback {
    color: #667085;
    font-weight: 500;
}

.payment-method-display__group :deep(.payment-logo-group) { max-width: 100%; }

.payment-method-display__empty { color: #98a2b3; }
</style>
