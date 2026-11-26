<template>
    <span class="alert-product" :class="{ 'alert-product--compact': compact }" :title="compact ? productLabel : undefined">
        <img class="alert-product__logo" :src="logos[product]" alt="" width="56" height="28" decoding="async" />
        <span v-if="compact" :class="{ 'alert-product__accessible-label': !compactLabel }">
            {{ compactLabel || productLabel }}
        </span>
        <span v-else>{{ productLabel }}</span>
    </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import amexInquiry from './assets/amex-inquiry.png';
import ethoca from './assets/ethoca.png';
import verifi from './assets/verifi.png';
import type { AlertProduct } from '@/api/channel/disputeAlert';

const props = defineProps<{ product: AlertProduct; compact?: boolean }>();
const { t } = useI18n();
const productLabel = computed(() => t('alertConfig.productLabel.' + props.product));
const compactLabel = computed(() => (props.product === 'RDR' || props.product === 'CDRN') ? productLabel.value : '');
const logos: Record<AlertProduct, string> = { ETHOCA: ethoca, RDR: verifi, CDRN: verifi, AMEX_INQUIRY: amexInquiry };
</script>

<style scoped>
.alert-product {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    vertical-align: middle;
    white-space: nowrap;
}
.alert-product__logo {
    flex: none;
    object-fit: contain;
}
.alert-product--compact {
    box-sizing: border-box;
    justify-content: center;
    min-width: 46px;
    min-height: 27px;
    gap: 4px;
    padding: 1px 4px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
    background: var(--el-bg-color);
    color: var(--el-text-color-regular);
    font-size: 11px;
    line-height: 1;
}
.alert-product--compact .alert-product__logo {
    width: 36px;
    height: 22px;
}
.alert-product__accessible-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip-path: inset(50%);
}
</style>
