<template>
  <header class="checkout-topbar">
    <div class="checkout-topbar__brand">
      <img class="checkout-topbar__logo" :src="brand.logos.horizontal" :alt="brand.name" />
      <span>{{ brand.subtitleEn }}</span>
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
  import { getSystemBrand } from '@acquiring/shared';
  const props = defineProps<{ locale: string; status?: string }>();
  const emit = defineEmits<{ change: [locale: 'en-US' | 'zh-CN'] }>();
  const { t } = useI18n();
  const brand = getSystemBrand('checkout');
  const flags = {
    'en-US': new URL('../assets/flags/us.svg', import.meta.url).href,
    'zh-CN': new URL('../assets/flags/cn.svg', import.meta.url).href,
  };
  const flag = computed(() => flags[props.locale === 'zh-CN' ? 'zh-CN' : 'en-US']);
  function change(event: Event) {
    emit('change', (event.target as HTMLSelectElement).value === 'zh-CN' ? 'zh-CN' : 'en-US');
  }
</script>
