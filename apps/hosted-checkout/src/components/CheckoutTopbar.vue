<template>
  <header class="checkout-topbar" :class="{ 'checkout-topbar--link': isLink, 'checkout-topbar--secure': showSecureCheckout }">
    <div class="checkout-topbar__brand">
      <img class="checkout-topbar__logo" :src="brandLogo" :alt="brandName" />
      <span class="checkout-topbar__subtitle" lang="en">{{ isLink ? 'Hosted Payment Link' : 'Hosted Checkout' }}</span>
    </div>
    <div v-if="showSecureCheckout" class="checkout-topbar__security">
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-3.7 8-10V6l-8-4-8 4v6c0 6.3 8 10 8 10Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span lang="en">Secure Checkout</span>
    </div>
    <div class="checkout-topbar__meta">
      <span v-if="status" class="checkout-topbar__status">{{ status }}</span>
      <label class="checkout-topbar__locale">
        <span class="checkout-topbar__locale-control">
          <img class="checkout-topbar__locale-flag" :src="flag" alt="" />
          <select :value="locale" :aria-label="t('topbar.language')" @change="change">
            <option value="en-US">{{ t('topbar.english') }}</option>
            <option value="zh-CN">{{ t('topbar.chinese') }}</option>
          </select>
        </span>
      </label>
    </div>
  </header>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getSystemBrand, VEXRA_PRODUCT_BRANDS } from '@acquiring/shared';
  const props = defineProps<{ locale: string; status?: string; product?: 'checkout' | 'link' }>();
  const emit = defineEmits<{ change: [locale: 'en-US' | 'zh-CN'] }>();
  const { t } = useI18n();
  const checkoutBrand = getSystemBrand('checkout');
  const linkBrand = VEXRA_PRODUCT_BRANDS.link;
  const isLink = computed(() => props.product === 'link');
  const showSecureCheckout = window.location.protocol === 'https:' && window.isSecureContext;
  const brandName = computed(() => isLink.value ? linkBrand.name : checkoutBrand.name);
  const brandLogo = computed(() => isLink.value ? linkBrand.horizontal : checkoutBrand.logos.horizontal);
  const flags = {
    'en-US': new URL('../assets/flags/us.svg', import.meta.url).href,
    'zh-CN': new URL('../assets/flags/cn.svg', import.meta.url).href,
  };
  const flag = computed(() => flags[props.locale === 'zh-CN' ? 'zh-CN' : 'en-US']);
  function change(event: Event) {
    emit('change', (event.target as HTMLSelectElement).value === 'zh-CN' ? 'zh-CN' : 'en-US');
  }
</script>
