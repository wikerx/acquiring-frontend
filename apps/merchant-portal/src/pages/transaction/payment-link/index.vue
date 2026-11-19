<template>
  <PaymentLinkWorkspace
    :api="api"
    scope="merchant"
    :can="can"
    :table-component="StandardTable"
    :toolbar-component="RightToolbar"
    :date-time-component="BaseDateTime"
    :search-panel-component="SearchPanel"
    :time-range-component="TransactionTimeRangeFilter"
    :timezone-options="timezoneOptions"
    :normalize-time-range="normalizeTimeRange"
    :format-instant="formatDateTimeInTimeZone"
    :resolve-query-range="resolveTransactionQueryRange"
    :make-qr="makeQr"
    :notify="notify"
    @open-transaction="openTransaction"
    @download-center="router.push('/operations/export-tasks')"
  />
</template>
<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import QRCode from 'qrcode';
  import {
    createPaymentLinkApi,
    PaymentLinkWorkspace,
    type PaymentLinkAttempt,
  } from '@acquiring/shared';
  import { http } from '@/api/http';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import TransactionTimeRangeFilter from '../components/TransactionTimeRangeFilter.vue';
  import {
    ensureTransactionTimezoneOptions,
    loadTransactionDictOptions,
    resolveTransactionQueryRange,
  } from '../shared';
  import { formatDateTimeFromSourceTimeZone, formatDateTimeInTimeZone } from '@/utils/format';
  import SearchPanel from './SearchPanel.vue';
  import { useAuthStore } from '@/stores/authStore';

  const store = useAuthStore();
  const router = useRouter();
  const { locale } = useI18n();
  const api = createPaymentLinkApi(http, 'merchant', () =>
    JSON.stringify([store.session?.account.userId, locale.value]),
  );
  const timezoneOptions = ref(ensureTransactionTimezoneOptions([]));
  onMounted(async () => {
    try {
      timezoneOptions.value = ensureTransactionTimezoneOptions(
        await loadTransactionDictOptions('sys_timezone', locale.value),
      );
    } catch {
      timezoneOptions.value = ensureTransactionTimezoneOptions([]);
    }
  });
  // 后端创建时间契约固定为上海时间，显示时区通过既有时间工具转换，不改接口含义。
  function normalizeTimeRange(range: string[], timeZone: string) {
    return range.map((value) =>
      formatDateTimeFromSourceTimeZone(value, timeZone, 'Asia/Shanghai').replace(' ', 'T'),
    );
  }
  function can(action: string) {
    return store.hasPermission(
      action === 'transaction'
        ? 'merchant:transaction:order:detail'
        : 'merchant:transaction:payment-link:' + action,
    );
  }
  function notify(message: string, type: 'success' | 'error' | 'warning' = 'success') {
    ElMessage({ message, type });
  }
  function makeQr(url: string) {
    return QRCode.toDataURL(url, { width: 440, margin: 2, errorCorrectionLevel: 'M' });
  }
  function openTransaction(attempt: PaymentLinkAttempt) {
    if (!can('transaction') || !attempt.transactionId) return;
    void router.push({
      path: '/transaction/order',
      query: {
        transactionId: attempt.transactionId,
        transactionDateTime: attempt.transactionDateTime,
        transactionTimeZone: 'Asia/Shanghai',
      },
    });
  }
</script>
