<template>
  <main class="link-entry">
    <header>
      <VexraBrandLogo system="checkout" mode="full" /><label
        >{{ t('paymentLinkEntry.language')
        }}<select :value="locale" @change="changeLanguage">
          <option value="en-US">English</option>
          <option value="zh-CN">简体中文</option>
        </select></label
      >
    </header>
    <section class="link-card" :aria-busy="loading || starting" aria-live="polite">
      <div class="link-lock" aria-hidden="true">{{ link?.status === 'COMPLETED' ? '✓' : '↗' }}</div>
      <p class="link-eyebrow">{{ t('paymentLinkEntry.title') }}</p>
      <p v-if="loading">{{ t('paymentLinkEntry.loading') }}</p>
      <template v-else-if="link">
        <h1>{{ link.merchantDisplayName }}</h1>
        <h2 v-if="link.linkName">{{ link.linkName }}</h2>
        <CurrencyAmountDisplay
          :amount="link.amount"
          :exponent="link.currencyExponent"
          :currency="link.currency"
          size="lg"
          :locale="locale"
          emphasized
        />
        <p v-if="link.description" class="link-description">{{ link.description }}</p>
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
        <p class="link-expiry">{{ t('paymentLinkEntry.expiry') }} · {{ expiry }}</p>
        <button
          v-if="link.payable && !link.processing"
          class="link-primary"
          :disabled="starting"
          @click="start"
        >
          {{ t(starting ? 'paymentLinkEntry.starting' : 'paymentLinkEntry.pay') }}
        </button>
        <button v-if="link.processing" class="link-primary" :disabled="starting" @click="resolve()">
          {{ t('paymentLinkEntry.refresh') }}
        </button>
      </template>
      <p v-if="error" role="alert" class="link-error">{{ error }}</p>
      <button
        v-if="error"
        class="link-secondary"
        :disabled="loading || starting"
        @click="resolve()"
      >
        {{ t('paymentLinkEntry.retry') }}
      </button>
    </section>
    <p class="link-footer">{{ t('paymentLinkEntry.secure') }}</p>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import axios, { type AxiosError } from 'axios';
  import {
    createDuplicateSubmissionGuard,
    CurrencyAmountDisplay,
    VexraBrandLogo,
    type CommonResult,
    formatDateTime,
  } from '@acquiring/shared';
  import { setLocale } from '../i18n';
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
  const error = ref('');
  const requestId = crypto.randomUUID();
  let manualLanguage = false;
  let destroyed = false;
  let checking = false;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = computed(() => `${formatDateTime(link.value?.expireTime)} (UTC+08:00)`);
  function changeLanguage(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
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
    let delay: number;
    if (value.processing) delay = Math.min(30000, 5000 * (1 + failures));
    else if (value.status === 'ACTIVE' && value.payable) {
      const deadline = Date.parse(value.expireTime + '+08:00');
      const serverNow = Date.parse(value.serverTime + '+08:00');
      if (!Number.isFinite(deadline) || !Number.isFinite(serverNow)) return;
      delay = Math.max(500, deadline - serverNow + 200);
    } else return;
    timer = setTimeout(() => {
      void resolve(true);
    }, delay);
  }
  async function resolve(silent = false) {
    if (checking || starting.value) return;
    checking = true;
    clearTimer();
    if (!silent) loading.value = true;
    error.value = '';
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
        error.value = t(token ? 'paymentLinkEntry.error' : 'paymentLinkEntry.notFound');
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
    if (starting.value || !link.value?.payable || link.value.processing) return;
    starting.value = true;
    error.value = '';
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
      error.value = t('paymentLinkEntry.startError');
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
  .link-entry {
    max-width: 1060px;
    margin: 0 auto;
    padding: 30px 24px;
    min-height: 100dvh;
    box-sizing: border-box;
    color: #172026;
  }
  .link-entry header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .link-entry header :deep(svg),
  .link-entry header :deep(img) {
    max-width: 150px;
  }
  .link-entry label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #475569;
  }
  .link-entry select {
    border: 1px solid #d7dfed;
    border-radius: 8px;
    padding: 8px;
    background: #fff;
  }
  .link-card {
    max-width: 520px;
    margin: 60px auto 20px;
    padding: 38px;
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #dbe4f3;
    border-radius: 20px;
    box-shadow: 0 18px 70px #17316d0d;
    text-align: center;
    overflow-wrap: anywhere;
  }
  .link-lock {
    width: 52px;
    height: 52px;
    margin: 0 auto 20px;
    display: grid;
    place-items: center;
    background: #eff6ff;
    color: #2563eb;
    border-radius: 16px;
    font-size: 28px;
  }
  .link-eyebrow {
    font-size: 13px;
    color: #64748b;
  }
  h1 {
    font-size: 23px;
    line-height: 1.5;
    margin: 10px 0;
  }
  h2 {
    font-size: 16px;
    color: #475569;
    font-weight: 500;
    margin: 0 0 24px;
  }
  .link-description {
    white-space: pre-wrap;
    line-height: 1.8;
    color: #475569;
    text-align: start;
    margin-top: 26px;
  }
  .link-state {
    margin: 28px 0 16px;
    padding: 14px;
    color: #475569;
    background: #f5f8ff;
    border-radius: 8px;
    font-size: 14px;
    line-height: 1.7;
  }
  .link-state--success {
    color: #166534;
    background: #f0fdf4;
  }
  .link-last-failure {
    padding: 14px;
    border-radius: 8px;
    background: #fef2f2;
    color: #991b1b;
    font-size: 13px;
    line-height: 1.7;
  }
  .link-expiry {
    color: #64748b;
    font-size: 12px;
    line-height: 1.7;
  }
  .link-primary,
  .link-secondary {
    display: block;
    width: 100%;
    padding: 15px;
    border: 0;
    border-radius: 10px;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    margin-top: 24px;
  }
  .link-primary {
    background: #2563eb;
    color: #fff;
  }
  .link-secondary {
    background: #eff6ff;
    color: #1d4ed8;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 3px solid #93c5fd;
    outline-offset: 3px;
  }
  .link-error {
    color: #b91c1c;
    line-height: 1.7;
    font-size: 14px;
  }
  .link-footer {
    text-align: center;
    font-size: 12px;
    color: #64748b;
  }
  @media (max-width: 600px) {
    .link-entry {
      padding: 20px 16px;
    }
    .link-card {
      margin-top: 36px;
      padding: 28px 20px;
    }
    .link-entry label {
      flex-direction: column;
      align-items: flex-end;
      gap: 3px;
    }
  }
</style>
