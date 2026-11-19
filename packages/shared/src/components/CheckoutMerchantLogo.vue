<template>
  <span class="checkout-merchant-logo" :class="{ 'has-logo': showLogo }" aria-hidden="true">
    <img
      v-if="showLogo"
      :src="source"
      alt=""
      referrerpolicy="no-referrer"
      @error="failedSource = source"
    />
    <!-- 与管理端商户详情的 Shop 图标保持一致；缺少或加载失败时使用通用店铺标识。 -->
    <svg v-else viewBox="0 0 1024 1024" fill="currentColor">
      <path
        d="M704 704h64v192H256V704h64v64h384zm188.544-152.192C894.528 559.616 896 567.616 896 576a96 96 0 1 1-192 0 96 96 0 1 1-192 0 96 96 0 1 1-192 0 96 96 0 1 1-192 0c0-8.384 1.408-16.384 3.392-24.192L192 128h640z"
      />
    </svg>
  </span>
</template>
<script setup lang="ts">
  import { computed, ref } from 'vue';
  const props = defineProps<{ src?: string }>();
  const failedSource = ref('');
  const source = computed(() => props.src?.trim() || '');
  const showLogo = computed(() => Boolean(source.value) && source.value !== failedSource.value);
</script>
<style scoped>
  .checkout-merchant-logo {
    display: grid;
    place-items: center;
    flex: 0 0 var(--merchant-logo-size, 42px);
    width: var(--merchant-logo-size, 42px);
    height: var(--merchant-logo-size, 42px);
    box-sizing: border-box;
    overflow: hidden;
    border: 1px solid #d6e4fb;
    border-radius: 10px;
    background: #e7f0ff;
    color: #1769e0;
  }
  .checkout-merchant-logo.has-logo {
    background: #fff;
  }
  .checkout-merchant-logo svg {
    width: 52%;
    height: 52%;
  }
  .checkout-merchant-logo img {
    display: block;
    width: 100%;
    height: 100%;
    padding: 5px;
    box-sizing: border-box;
    object-fit: contain;
  }
</style>
