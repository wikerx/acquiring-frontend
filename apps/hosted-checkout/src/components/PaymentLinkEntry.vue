<template>
  <main class="checkout-shell">
    <CheckoutTopbar product="link" :locale="locale" :status="statusLabel" @change="changeLanguage" />
    <section
      v-if="link"
      class="checkout-layout"
      :aria-busy="loading || starting"
      aria-live="polite"
    >
      <CheckoutOrderSummary
        :merchant-name="link.merchantDisplayName"
        :formatted-amount="formattedAmount"
        :items="items"
        :labels="{
          merchant: t('checkout.merchantStore'),
          summary: t('checkout.orderSummary'),
          secure: t('checkout.secure'),
          total: t('checkout.total'),
        }"
      />
      <section class="checkout-form-panel">
        <article class="checkout-section-card link-payment-card">
          <div class="checkout-section-card__header">
            <div>
              <p>{{ t('paymentLinkEntry.title') }}</p>
              <h2>{{ t('paymentLinkEntry.confirmTitle') }}</h2>
            </div>
          </div>
          <div class="link-amount">
            <span>{{ t('checkout.total') }}</span
            ><strong>{{ formattedAmount }}</strong>
          </div>
          <p class="link-state" :class="{ 'link-state--success': link.status === 'COMPLETED' }">
            {{
              link.processing
                ? t('paymentLinkEntry.processing')
                : link.status === 'ACTIVE' && !link.payable
                  ? t('paymentLinkEntry.unavailable')
                  : t(`paymentLinkEntry.status.${link.status}`)
            }}
          </p>
          <div
            v-if="link.lastFailedTime && !link.processing && link.status !== 'COMPLETED'"
            class="link-last-failure"
          >
            <strong>{{ t('paymentLinkEntry.lastFailed') }}</strong>
            <p>{{ formatDateTime(link.lastFailedTime) }} (UTC+08:00)</p>
            <p>{{ t('paymentLinkEntry.failedNotice') }}</p>
          </div>
          <div class="link-expiry">
            <span>{{ t('paymentLinkEntry.expiry') }}</span
            ><time>{{ expiry }}</time>
          </div>
          <p v-if="error" role="alert" class="link-error">{{ error }}</p>
          <button
            v-if="(link.payable || link.checkoutAvailable) && !link.processing"
            class="checkout-submit"
            :disabled="starting || loading"
            @click="start"
          >
            {{ t(starting ? 'paymentLinkEntry.starting' : link.payable ? 'paymentLinkEntry.pay' : 'checkout.chooseMethod') }}
          </button>
          <button
            v-if="link.processing"
            class="checkout-submit"
            :disabled="starting || loading"
            @click="resolve()"
          >
            {{ t('paymentLinkEntry.refresh') }}
          </button>
          <button
            v-if="error"
            class="link-secondary"
            :disabled="loading || starting"
            @click="resolve()"
          >
            {{ t('paymentLinkEntry.retry') }}
          </button>
        </article>
      </section>
    </section>
    <section v-else class="checkout-status-shell" aria-live="polite" :aria-busy="loading">
      <article class="checkout-status-card">
        <h1>{{ t('paymentLinkEntry.title') }}</h1>
        <p v-if="loading">{{ t('paymentLinkEntry.loading') }}</p>
        <p v-if="error" role="alert" class="link-error">{{ error }}</p>
        <button v-if="error" class="link-secondary" :disabled="loading" @click="resolve()">
          {{ t('paymentLinkEntry.retry') }}
        </button>
      </article>
    </section>
    <CheckoutTrustFooter />
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import axios, { type AxiosError } from 'axios';
  import {
    createDuplicateSubmissionGuard,
    CheckoutOrderSummary,
    formatMoneyAmount,
    type CommonResult,
    formatDateTime,
  } from '@acquiring/shared';
  import { setLocale } from '../i18n';
  import { paymentLinkStatusDelay, usePaymentLinkError } from '../utils/paymentLinkState';
  import CheckoutTopbar from './CheckoutTopbar.vue';
  import CheckoutTrustFooter from './CheckoutTrustFooter.vue';
  interface PublicLink {
    linkName: string;
    description?: string;
    merchantDisplayName: string;
    currency: string;
    amount: string;
    currencyExponent: number;
    locale: string;
    status: 'ACTIVE' | 'COMPLETED' | 'DISABLED' | 'EXPIRED';
    payable: boolean;
    checkoutAvailable?: boolean;
    processing: boolean;
    lastFailedTime?: string;
    expireTime: string;
    serverTime: string;
  }
  const { t, locale } = useI18n();
  const token =
    window.location.pathname.match(
      /^\/l\/((?:L[0-9]{22}|[0-9]{22}|[a-f0-9]{32})\.[a-f0-9]{64})\/?$/,
    )?.[1] || '';
  const http = axios.create({ timeout: 20000, headers: { 'Content-Type': 'application/json' } });
  const submissionGuard = createDuplicateSubmissionGuard(() => locale.value);
  http.interceptors.request.use((config) => {
    submissionGuard.acquire(config);
    return config;
  });
  http.interceptors.response.use(
    (response) => {
      submissionGuard.release(response.config);
      return response;
    },
    (error: AxiosError) => {
      submissionGuard.release(error.config);
      return Promise.reject(error);
    },
  );
  const link = ref<PublicLink>();
  const loading = ref(false);
  const starting = ref(false);
  const { key: errorKey, message: error } = usePaymentLinkError(t);
  const requestId = crypto.randomUUID();
  let manualLanguage = false;
  let destroyed = false;
  let checking = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const statusLabel = computed(() =>
    !link.value
      ? undefined
      : link.value.processing
        ? t('topbar.processing')
        : link.value.status === 'ACTIVE' && !link.value.payable
          ? t('paymentLinkEntry.unavailableLabel')
          : t(`paymentLinkEntry.statusLabels.${link.value.status}`),
  );
  const expiry = computed(() => `${formatDateTime(link.value?.expireTime)} (UTC+08:00)`);
  const formattedAmount = computed(() =>
    link.value
      ? `${link.value.currency} ${formatMoneyAmount(link.value.amount, String(locale.value), link.value.currencyExponent)}`
      : '—',
  );
  const items = computed(() =>
    link.value && (link.value.linkName || link.value.description)
      ? [{ name: link.value.linkName || t('checkout.orderSummary'), meta: link.value.description }]
      : [],
  );
  function changeLanguage(value: string) {
    manualLanguage = true;
    setLocale(value === 'zh-CN' ? 'zh-CN' : 'en-US');
  }
  function clearTimer() {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  }
  function scheduleStatusCheck() {
    clearTimer();
    const value = link.value;
    if (destroyed || document.hidden || !value || failures >= 8) return;
    const delay = paymentLinkStatusDelay(value, failures);
    if (delay === null) return;
    timer = setTimeout(() => {
      void resolve(true);
    }, delay);
  }
  async function resolve(silent = false) {
    if (checking || starting.value) return;
    checking = true;
    clearTimer();
    if (!silent) loading.value = true;
    errorKey.value = '';
    try {
      if (!token) throw new Error('Invalid link');
      const response = await http.post<CommonResult<PublicLink>>(
        '/checkout/api/v1/payment-links/resolve',
        { opaqueToken: token },
      );
      if (response.data.code !== 'A0000' && response.data.code !== 'T200')
        throw new Error('Unavailable');
      if (destroyed) return;
      link.value = response.data.data;
      failures = 0;
      if (!manualLanguage) {
        const lang = link.value.locale === 'AUTO' ? navigator.language : link.value.locale;
        setLocale(lang?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US');
      }
    } catch {
      failures += 1;
      if (!destroyed)
        errorKey.value = token ? 'paymentLinkEntry.error' : 'paymentLinkEntry.notFound';
    } finally {
      checking = false;
      if (!destroyed) {
        loading.value = false;
        scheduleStatusCheck();
      }
    }
  }
  function visibilityChanged() {
    if (document.hidden) clearTimer();
    else if (link.value?.processing || link.value?.status === 'ACTIVE') void resolve(true);
  }
  async function start() {
    if (starting.value || !link.value || (!link.value.payable && !link.value.checkoutAvailable) || link.value.processing) return;
    starting.value = true;
    errorKey.value = '';
    let navigating = false;
    try {
      const response = await http.post<CommonResult<{ checkoutUrl: string }>>(
        '/checkout/api/v1/payment-links/start',
        { opaqueToken: token, requestId },
      );
      if (response.data.code !== 'A0000' && response.data.code !== 'T200')
        throw new Error('Unavailable');
      const next = new URL(response.data.data.checkoutUrl, window.location.origin);
      if (
        next.origin !== window.location.origin ||
        !/^\/checkout\/[A-Za-z0-9_-]{20,200}\/[A-Za-z0-9_-]{6,100}\/?$/.test(next.pathname) ||
        next.username ||
        next.password ||
        next.search ||
        next.hash
      )
        throw new Error('Invalid checkout origin');
      // The Checkout context exists before replacing the bearer link in browser history.
      clearTimer();
      navigating = true;
      window.location.replace(next.toString());
    } catch {
      navigating = false;
      errorKey.value = 'paymentLinkEntry.startError';
      scheduleStatusCheck();
    } finally {
      if (!navigating) starting.value = false;
    }
  }
  onMounted(() => {
    document.addEventListener('visibilitychange', visibilityChanged);
    void resolve();
  });
  onBeforeUnmount(() => {
    destroyed = true;
    clearTimer();
    document.removeEventListener('visibilitychange', visibilityChanged);
    link.value = undefined;
  });
</script>
<style scoped>
  .link-payment-card {
    display: grid;
    gap: 24px;
  }
  .link-payment-card .checkout-section-card__header {
    margin-bottom: 0;
  }
  .link-amount {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid #e5eaf6;
  }
  .link-amount > span,
  .link-expiry > span {
    color: #64748b;
    font-size: 13px;
  }
  .link-amount strong {
    font-size: 30px;
    color: #0b1026;
  }
  .link-state {
    margin: 0;
    padding: 18px;
    border-radius: 14px;
    background: #f6f8ff;
    color: #475569;
    font-size: 14px;
    line-height: 1.8;
  }
  .link-state--success {
    color: #15803d;
    background: #f0fdf4;
  }
  .link-expiry {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px 16px;
    font-size: 13px;
    color: #475569;
  }
  .link-last-failure {
    border-left: 3px solid #f59e0b;
    padding: 4px 16px;
    color: #92400e;
    font-size: 13px;
    line-height: 1.6;
  }
  .link-last-failure p {
    margin: 8px 0 0;
  }
  .link-error {
    color: #b91c1c;
    line-height: 1.6;
    font-size: 14px;
  }
  .link-secondary {
    background: #fff;
    border: 1px solid #d7dff1;
    color: #334155;
    border-radius: 12px;
    padding: 12px 18px;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    cursor: wait;
    opacity: 0.6;
  }
</style>
