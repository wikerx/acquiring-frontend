<template>
  <span
    class="payment-link-status"
    :class="`payment-link-status--${known ? value?.toLowerCase() : 'unknown'}`"
  >
    <component :is="icon" v-if="known" aria-hidden="true" class="payment-link-status__symbol" />
    {{ known ? t(`paymentLink.status.${value}`) : value || '-' }}
  </span>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { CircleCheckFilled, Clock, Link, RemoveFilled } from '@element-plus/icons-vue';
  const props = defineProps<{ value?: string | null }>();
  const { t } = useI18n();
  const icons = {
    ACTIVE: Link,
    COMPLETED: CircleCheckFilled,
    DISABLED: RemoveFilled,
    EXPIRED: Clock,
  };
  const known = computed(() => Boolean(props.value && Object.hasOwn(icons, props.value)));
  const icon = computed(() => icons[props.value as keyof typeof icons]);
</script>
<style scoped>
  .payment-link-status {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 24px;
    padding: 0 8px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
  }
  .payment-link-status__symbol {
    width: 16px;
    height: 16px;
    flex: 0 0 16px;
  }
  .payment-link-status--active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  .payment-link-status--completed {
    color: var(--el-color-success);
    background: var(--el-color-success-light-9);
  }
  .payment-link-status--expired {
    color: var(--el-color-warning);
    background: var(--el-color-warning-light-9);
  }
</style>
