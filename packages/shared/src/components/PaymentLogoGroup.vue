<template>
    <div
        class="payment-logo-group"
        :class="[`payment-logo-group--${align}`, `payment-logo-group--${variant}`, { 'is-wrap': wrap }]"
    >
        <PaymentLogoMark
            v-for="logo in logos"
            :key="logo.key"
            :logo="logo"
            :size="size"
            :variant="variant"
            :fallback="fallback"
            compact
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
    getPaymentLogos,
    type PaymentLogoConfig,
    type PaymentLogoKey,
} from '../paymentBrand';
import PaymentLogoMark from './PaymentLogoMark.vue';

const props = withDefaults(
    defineProps<{
        keys?: PaymentLogoKey[];
        items?: PaymentLogoConfig[];
        size?: 'sm' | 'md' | 'lg';
        variant?: 'default' | 'footer';
        align?: 'start' | 'center' | 'end';
        wrap?: boolean;
        fallback?: 'hide' | 'text';
    }>(),
    {
        size: 'md',
        variant: 'default',
        align: 'start',
        wrap: true,
        fallback: 'hide',
    },
);

const logos = computed(() => {
    const items = props.items ?? getPaymentLogos(props.keys ?? []);

    if (props.fallback === 'text') {
        return items;
    }

    return items.filter((logo) => Boolean(logo.asset));
});
</script>

<style scoped>
.payment-logo-group {
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1;
}

.payment-logo-group--footer {
    gap: 14px;
    justify-content: center;
}

.payment-logo-group.is-wrap {
    flex-wrap: wrap;
}

.payment-logo-group--start {
    justify-content: flex-start;
}

.payment-logo-group--center {
    justify-content: center;
}

.payment-logo-group--end {
    justify-content: flex-end;
}
</style>
