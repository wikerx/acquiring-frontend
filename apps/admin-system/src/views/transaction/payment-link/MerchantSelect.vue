<template>
  <el-select
    :model-value="modelValue"
    filterable
    remote
    clearable
    :loading="loading"
    :remote-method="load"
    :placeholder="t('common.pleaseSelect')"
    @update:model-value="updateValue"
    @change="changeValue"
    ><el-option
      v-for="item in options"
      :key="item.merchantId"
      :value="item.merchantId"
      :label="`${item.merchantId} · ${item.merchantName}`"
  /></el-select>
</template>
<script lang="ts">
  const pendingMerchants = new Map<
    string,
    Promise<Array<{ merchantId: string; merchantName: string }>>
  >();
</script>
<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import { unwrapResult, userFacingErrorMessage, type CommonResult } from '@acquiring/shared';
  import { http } from '@/api/http';
  import { useUserStore } from '@/store/modules/user';
  const props = defineProps<{ modelValue?: string }>();
  const emit = defineEmits<{ 'update:modelValue': [value: string]; change: [value: string] }>();
  function updateValue(value: unknown) {
    emit('update:modelValue', typeof value === 'string' ? value : '');
  }
  function changeValue(value: unknown) {
    emit('change', typeof value === 'string' ? value : '');
  }
  const { t, locale } = useI18n();
  const user = useUserStore();
  interface Choice {
    merchantId: string;
    merchantName: string;
  }
  const options = ref<Choice[]>([]);
  const loading = ref(false);
  let generation = 0;
  async function load(keyword = '') {
    const seq = ++generation;
    loading.value = true;
    try {
      const key = JSON.stringify([user.account?.userId, locale.value, keyword]);
      let request = pendingMerchants.get(key);
      if (!request) {
        request = http
          .post<CommonResult<Choice[]>>('/admin/transactions/payment-links/merchants/search', {
            keyword,
          })
          .then((response) => unwrapResult(response.data))
          .finally(() => pendingMerchants.delete(key));
        pendingMerchants.set(key, request);
      }
      const result = await request;
      if (seq !== generation) return;
      const current = options.value.filter((item) => item.merchantId === props.modelValue);
      options.value = [...current, ...result].filter(
        (item, index, list) =>
          list.findIndex((other) => other.merchantId === item.merchantId) === index,
      );
    } catch (error) {
      ElMessage.error(userFacingErrorMessage(error, t('paymentLink.error')));
    } finally {
      if (seq === generation) loading.value = false;
    }
  }
  onMounted(() => load(props.modelValue));
</script>
