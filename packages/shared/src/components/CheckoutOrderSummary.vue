<template>
  <aside class="checkout-receipt">
    <div class="checkout-receipt__merchant">
      <CheckoutMerchantLogo :src="merchantLogo" class="checkout-receipt__merchant-logo" />
      <div>
        <p class="checkout-receipt__eyebrow">{{ labels.merchant }}</p>
        <h1>{{ merchantName || '—' }}</h1>
        <span v-if="orderReference" class="checkout-receipt__reference">{{ orderReference }}</span>
      </div>
    </div>
    <article class="checkout-receipt__summary">
      <div class="checkout-receipt__header">
        <div>
          <p class="checkout-receipt__eyebrow">{{ labels.summary }}</p>
        </div>
        <span class="checkout-receipt__secure">{{ labels.secure }}</span>
      </div>
      <div v-if="items.length" class="checkout-receipt__items">
        <article v-for="(item, index) in items" :key="index" class="checkout-receipt__item">
          <div class="checkout-receipt__thumb" aria-hidden="true">
            {{ item.initial || item.name.slice(0, 1) }}
          </div>
          <div>
            <strong>{{ item.name }}</strong>
            <p v-if="item.meta">{{ item.meta }}</p>
          </div>
          <span v-if="item.amount">{{ item.amount }}</span>
        </article>
      </div>
      <div class="checkout-receipt__total">
        <span>{{ labels.total }}</span
        ><strong>{{ formattedAmount }}</strong>
      </div>
    </article>
  </aside>
</template>
<script setup lang="ts">
  import CheckoutMerchantLogo from './CheckoutMerchantLogo.vue';
  withDefaults(
    defineProps<{
      merchantName?: string;
      merchantLogo?: string;
      orderReference?: string;
      formattedAmount: string;
      items?: Array<{ name: string; initial?: string; meta?: string; amount?: string }>;
      labels: { merchant: string; summary: string; secure: string; total: string };
    }>(),
    { items: () => [] },
  );
</script>
<style scoped>
  .checkout-receipt {
    display: grid;
    align-content: start;
    gap: 16px;
    min-width: 0;
    container-type: inline-size;
    color: #172026;
  }
  .checkout-receipt__merchant,
  .checkout-receipt__summary {
    border: 1px solid var(--el-border-color-light, #e5eaf6);
    background: var(--el-bg-color, rgb(255 255 255 / 92%));
    border-radius: 20px;
    box-shadow: 0 12px 32px rgb(15 23 42 / 5%);
    min-width: 0;
  }
  .checkout-receipt__merchant {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
  }
  .checkout-receipt__merchant-logo {
    --merchant-logo-size: 44px;
  }
  .checkout-receipt__merchant > div {
    min-width: 0;
  }
  .checkout-receipt__eyebrow {
    margin: 0;
    color: var(--el-text-color-secondary, #64748b);
    font-size: 12px;
    font-weight: 700;
    line-height: 1.6;
  }
  .checkout-receipt__merchant .checkout-receipt__eyebrow {
    color: #7c3aed;
    margin-bottom: 4px;
  }
  .checkout-receipt h1 {
    margin: 0;
    color: var(--el-text-color-primary, #0b1026);
    font-size: 18px;
    line-height: 1.45;
    font-weight: 600;
    overflow-wrap: anywhere;
  }
  .checkout-receipt__reference {
    display: block;
    margin-top: 8px;
    color: var(--el-text-color-secondary, #64748b);
    font-size: 12px;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }
  .checkout-receipt__summary {
    padding: 20px;
  }
  .checkout-receipt__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .checkout-receipt__header > div {
    min-width: 0;
  }
  .checkout-receipt__secure {
    padding: 5px 9px;
    border-radius: 999px;
    background: rgb(124 58 237 / 12%);
    color: #7c3aed;
    font-size: 12px;
    font-weight: 700;
    flex: 0 0 auto;
  }
  .checkout-receipt__items {
    margin-top: 12px;
    display: grid;
    gap: 12px;
  }
  .checkout-receipt__item {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto;
    gap: 8px 12px;
    align-items: center;
    padding: 8px 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  .checkout-receipt__item > span {
    grid-column: 3;
    grid-row: 1;
    text-align: right;
    color: var(--el-text-color-primary, #0f172a);
    font-size: 13px;
    font-weight: 700;
  }
  .checkout-receipt__item strong {
    color: var(--el-text-color-primary, #0f172a);
    font-size: 14px;
  }
  .checkout-receipt__item p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary, #64748b);
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  .checkout-receipt__thumb {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #ede9fe, #dbeafe);
    color: #4338ca;
    font-size: 20px;
    font-weight: 800;
  }
  .checkout-receipt__total {
    margin-top: 16px;
    padding-top: 18px;
    border-top: 1px solid var(--el-border-color-light, #e5eaf6);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .checkout-receipt__total span {
    color: var(--el-text-color-secondary, #64748b);
    font-size: 14px;
  }
  .checkout-receipt__total strong {
    color: var(--el-text-color-primary, #0b1026);
    font-size: 20px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
  @container (max-width: 380px) {
    .checkout-receipt__item {
      grid-template-columns: 40px minmax(0, 1fr);
    }
    .checkout-receipt__item > span {
      grid-column: 2;
      grid-row: auto;
      text-align: left;
    }
    .checkout-receipt__merchant {
      padding: 18px;
      gap: 12px;
    }
    .checkout-receipt__merchant-logo {
      --merchant-logo-size: 40px;
    }
    .checkout-receipt h1 {
      font-size: 17px;
    }
    .checkout-receipt__summary {
      padding: 18px;
    }
  }
</style>
