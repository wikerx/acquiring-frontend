<template>
  <div v-if="coverageVisible" class="fee-authorization-coverage">
    <template v-if="orderedCoverage.length">
      <div v-for="item in orderedCoverage.slice(0, 2)" :key="item.itemKey" class="coverage-item">
        <span>{{ item.name }}</span
        ><el-tag
          :type="item.authorizationStatus === 'ACTIVE' ? 'success' : 'info'"
          size="small"
          effect="plain"
          >{{ statusText(item.authorizationStatus) }}</el-tag
        >
      </div>
      <el-popover
        v-if="orderedCoverage.length > 2"
        trigger="click"
        width="420"
        placement="bottom"
        :title="t('paymentMethod.fee.coverage')"
        ><template #reference
          ><el-button link type="primary">{{
            t('paymentMethod.fee.more', { count: orderedCoverage.length })
          }}</el-button></template
        >
        <div class="coverage-popover">
          <div v-for="item in orderedCoverage" :key="item.itemKey" class="coverage-item">
            <span>{{ item.name }}</span
            ><el-tag
              :type="item.authorizationStatus === 'ACTIVE' ? 'success' : 'info'"
              size="small"
              effect="plain"
              >{{ statusText(item.authorizationStatus) }}</el-tag
            >
          </div>
        </div></el-popover
      >
    </template>
    <span v-else class="coverage-muted">{{ t('paymentMethod.fee.noCoverage') }}</span>
  </div>
  <span v-else class="coverage-muted">{{
    t(
      assessmentStatus === 'HISTORY_PENDING'
        ? 'paymentMethod.fee.historyPending'
        : 'paymentMethod.unassessed',
    )
  }}</span>
</template>
<script setup lang="ts">
  import { computed } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { FeePaymentMethodCoverage } from '@/api/financeApi';
  const props = defineProps<{
    assessmentStatus?: 'EVALUATED' | 'HISTORY_PENDING' | 'UNAVAILABLE';
    coverage?: FeePaymentMethodCoverage[] | null;
  }>();
  const { t, te } = useI18n();
  const coverageVisible = computed(
    () =>
      Array.isArray(props.coverage) &&
      (props.assessmentStatus === 'EVALUATED' || props.assessmentStatus === 'HISTORY_PENDING'),
  );
  const orderedCoverage = computed(() =>
    [...(props.coverage ?? [])].sort(
      (left, right) =>
        Number(right.authorizationStatus === 'ACTIVE') - Number(left.authorizationStatus === 'ACTIVE'),
    ),
  );
  function statusText(status: string) {
    const key = `paymentMethod.status.${status}`;
    return te(key) ? t(key) : t('paymentMethod.unassessed');
  }
</script>
<style scoped>
  .fee-authorization-coverage {
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 5px;
  }
  .coverage-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 4px 0;
  }
  .coverage-popover {
    max-height: 320px;
    overflow-y: auto;
  }
  .coverage-muted {
    color: var(--el-text-color-secondary);
  }
</style>
