<template>
    <footer class="checkout-trust-footer" :aria-label="t('footer.assuranceLabel')">
        <div class="trust-badge-row">
            <img class="trust-logo-strip" :src="trustLogos" :alt="t('footer.trustLogosAlt')" />
        </div>

        <div class="trust-footer-bottom">
            <span class="secure-text">{{ t('footer.securePayment') }}</span>
            <span class="divider" aria-hidden="true"></span>
            <span class="powered-text">
                {{ t('footer.poweredBy') }}
                <strong class="brand-name">{{ checkoutBrand.name }}</strong>
                <span v-if="poweredBySuffix"> {{ poweredBySuffix }}</span>
            </span>
        </div>
    </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getSystemBrand } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import trustLogos from '../assets/trust/trust-logos.png';

const checkoutBrand = getSystemBrand('checkout');
const { t } = useI18n();

const poweredBySuffix = computed(() => t('footer.poweredBySuffix'));
</script>
