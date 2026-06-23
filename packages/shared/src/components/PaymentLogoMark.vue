<template>
    <span
        v-if="shouldRender"
        class="payment-logo-mark"
        :class="[
            `payment-logo-mark--${logo.kind}`,
            `payment-logo-mark--${size}`,
            `payment-logo-mark--${variant}`,
            `payment-logo-mark--${fallbackMode}`,
            { 'is-compact': compact, 'has-asset': Boolean(logo.asset) },
        ]"
        :title="logo.label"
        :aria-label="logo.label"
    >
        <img v-if="logo.asset" class="payment-logo-mark__asset" :src="logo.asset" :alt="logo.label" />
        <span v-else class="payment-logo-mark__text">{{ logo.textFallback }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
    getPaymentLogo,
    type PaymentLogoConfig,
    type PaymentLogoKey,
} from '../paymentBrand';

const props = withDefaults(
    defineProps<{
        logoKey?: PaymentLogoKey;
        logo?: PaymentLogoConfig;
        size?: 'sm' | 'md' | 'lg';
        variant?: 'default' | 'footer';
        compact?: boolean;
        fallback?: 'hide' | 'text';
    }>(),
    {
        size: 'md',
        variant: 'default',
        compact: false,
        fallback: 'hide',
    },
);

const logo = computed(() => props.logo ?? getPaymentLogo(props.logoKey ?? 'bankCard'));
const fallbackMode = computed(() => (logo.value.asset ? 'asset' : props.fallback));
const shouldRender = computed(() => Boolean(logo.value.asset) || props.fallback === 'text');
</script>

<style scoped>
.payment-logo-mark {
    --payment-logo-height: 24px;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--payment-logo-height);
    max-width: 92px;
    white-space: nowrap;
    line-height: 1;
}

.payment-logo-mark--sm {
    --payment-logo-height: 22px;
    max-width: 82px;
}

.payment-logo-mark--lg {
    --payment-logo-height: 24px;
    max-width: 96px;
}

.payment-logo-mark--footer {
    --payment-logo-height: 30px;
    max-width: 138px;
}

.payment-logo-mark--footer.payment-logo-mark--wallet {
    --payment-logo-height: 30px;
}

.payment-logo-mark--footer.payment-logo-mark--security {
    --payment-logo-height: 32px;
    max-width: 128px;
}

.payment-logo-mark.is-compact {
    min-width: 0;
}

.payment-logo-mark__asset {
    display: block;
    width: auto;
    max-width: 100%;
    height: 100%;
    object-fit: contain;
}

.payment-logo-mark__text {
    color: #1e293b;
    font-size: 12px;
    font-weight: 750;
}

.payment-logo-mark--footer.payment-logo-mark--text {
    width: auto;
    max-width: none;
    height: 28px;
    padding: 0 10px;
    border-radius: 9px;
    border: 1px solid #dbe4f0;
    background: #fff;
}

.payment-logo-mark--footer.payment-logo-mark--text .payment-logo-mark__text {
    font-size: 12px;
    letter-spacing: -0.01em;
}

</style>
