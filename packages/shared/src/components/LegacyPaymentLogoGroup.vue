<template>
    <PaymentLogoGroup
        :items="logos"
        :size="size"
        :variant="variant"
        :align="align"
        :wrap="wrap"
        :fallback="fallback"
        appearance="legacy"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getLegacyPaymentLogos } from '../legacyPaymentBrand';
import type { PaymentLogoKey } from '../paymentBrand';
import PaymentLogoGroup from './PaymentLogoGroup.vue';

const props = withDefaults(
    defineProps<{
        keys?: PaymentLogoKey[];
        size?: 'sm' | 'md' | 'lg';
        variant?: 'default' | 'footer';
        align?: 'start' | 'center' | 'end';
        wrap?: boolean;
        fallback?: 'hide' | 'text';
    }>(),
    {
        keys: () => [],
        size: 'md',
        variant: 'default',
        align: 'start',
        wrap: true,
        fallback: 'hide',
    },
);

const logos = computed(() => getLegacyPaymentLogos(props.keys));
</script>
