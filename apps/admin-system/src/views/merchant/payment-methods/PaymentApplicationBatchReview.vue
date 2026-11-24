<template>
  <div class="batch-review-entry">
    <el-button :disabled="!candidates.length && !canRecover" @click="resumeOrOpen">{{
      t('paymentMethod.batch.open')
    }}</el-button>
  </div>
  <el-dialog
    v-model="visible"
    :title="t('paymentMethod.batch.open')"
    width="min(980px, 96vw)"
    append-to-body
    :close-on-click-modal="false"
    :close-on-press-escape="!busy"
    :show-close="!busy"
  >
    <el-alert :title="t('paymentMethod.batch.hint')" type="info" :closable="false" show-icon />
    <el-alert
      v-if="hasUnknown"
      :title="t('paymentMethod.batch.uncertain')"
      type="warning"
      :closable="false"
      show-icon
    />
    <el-form label-position="top" @submit.prevent="submit">
      <el-form-item :label="t('paymentMethod.batch.decision')"
        ><el-radio-group v-model="decision" :disabled="busy || frozen"
          ><el-radio-button value="APPROVE">{{ t('paymentMethod.approve') }}</el-radio-button
          ><el-radio-button value="RETURN">{{ t('paymentMethod.return') }}</el-radio-button
          ><el-radio-button value="REJECT">{{
            t('paymentMethod.reject')
          }}</el-radio-button></el-radio-group
        ></el-form-item
      >
      <el-form-item :label="t('paymentMethod.reason')" :required="decision !== 'APPROVE'"
        ><el-input
          v-model="reason"
          type="textarea"
          :rows="3"
          maxlength="1000"
          show-word-limit
          :disabled="busy || frozen"
      /></el-form-item>
    </el-form>
    <p>{{ t('paymentMethod.batch.selected', { count: selectedIds.length }) }}</p>
    <el-table :data="displayItems" border size="small" row-key="id">
      <el-table-column width="48" fixed="left" align="center"
        ><template #header
          ><el-checkbox
            :model-value="snapshot.length > 0 && selectedIds.length === snapshot.length"
            :indeterminate="selectedIds.length > 0 && selectedIds.length < snapshot.length"
            :disabled="busy || frozen"
            :aria-label="t('paymentMethod.selectPage')"
            @change="
              selectedIds = $event === true ? snapshot.map((item) => item.id) : []
            " /></template
        ><template #default="{ row }"
          ><el-checkbox
            :model-value="selectedIds.includes(row.id)"
            :disabled="busy || frozen"
            :aria-label="row.method.name"
            @change="toggle(row.id, $event === true)" /></template
      ></el-table-column>
      <el-table-column :label="t('paymentMethod.method')" min-width="180">
        <template #default="{ row }">
          <slot name="payment-method" :method="row.method" />
        </template>
      </el-table-column>
      <el-table-column
        prop="version"
        :label="t('paymentMethod.applicationVersion')"
        width="100"
        align="center"
      />
      <el-table-column :label="t('paymentMethod.batch.outcome')" min-width="145" align="center"
        ><template #default="{ row }"
          ><el-tag
            v-if="outcomeFor(row.id)"
            :type="
              outcomeFor(row.id) === 'SUCCEEDED'
                ? 'success'
                : outcomeFor(row.id) === 'FAILED'
                  ? 'danger'
                  : 'warning'
            "
            effect="plain"
            >{{ t(`paymentMethod.batch.${outcomeFor(row.id)}`) }}</el-tag
          ><span v-else>-</span></template
        ></el-table-column
      >
      <el-table-column :label="t('paymentMethod.batch.message')" min-width="230"
        ><template #default="{ row }">{{
          results.find((item) => item.itemId === row.id)?.message || '-'
        }}</template></el-table-column
      >
    </el-table>
    <template #footer
      ><div class="dialog-footer">
        <el-button
          v-if="!frozen || canRecover"
          type="primary"
          :loading="busy"
          :disabled="!selectedIds.length"
          @click="submit"
          >{{ t(frozen ? 'paymentMethod.batch.retry' : 'paymentMethod.batch.submit') }}</el-button
        ><el-button v-if="frozen && !hasUnknown" :disabled="busy" @click="open">{{
          t('paymentMethod.batch.another')
        }}</el-button
        ><el-button :disabled="busy" @click="visible = false">{{
          t('paymentMethod.close')
        }}</el-button>
      </div></template
    >
  </el-dialog>
</template>
<script setup lang="ts">
  import { computed, onBeforeUnmount, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import { userFacingErrorMessage } from '@acquiring/shared';
  import { useUserStore } from '@/store/modules/user';
  import {
    paymentMethodApi,
    type PaymentApplication,
    type PaymentApplicationItem,
    type PaymentBatchDecisionItem,
    type PaymentBatchDecisionResult,
    type PaymentDecision,
  } from '@/api/paymentMethodApi';
  import { preparePaymentReviewBatch, paymentReviewResults } from './batchReviewState';
  type MethodIdentity = { itemKey: string; name: string };
  const props = defineProps<{
    application: PaymentApplication;
    resolveMethod: (itemKey: string) => MethodIdentity;
  }>();
  defineSlots<{ 'payment-method': (props: { method: MethodIdentity }) => unknown }>();
  const emit = defineEmits<{ updated: [] }>();
  const { t } = useI18n();
  const auth = useUserStore();
  const candidates = computed(() =>
    props.application.items.filter((item) => item.status === 'PENDING_REVIEW'),
  );
  const snapshot = ref<PaymentApplicationItem[]>([]);
  const displayItems = computed(() =>
    snapshot.value.map((item) => ({ ...item, method: props.resolveMethod(item.itemKey) })),
  );
  const visible = ref(false);
  const busy = ref(false);
  const frozen = ref(false);
  const decision = ref<PaymentDecision>('APPROVE');
  const reason = ref('');
  const selectedIds = ref<string[]>([]);
  const prepared = ref<PaymentBatchDecisionItem[]>([]);
  const results = ref<PaymentBatchDecisionResult[]>([]);
  const hasUnknown = computed(() => results.value.some((item) => item.outcome === 'UNKNOWN'));
  const canRecover = computed(() =>
    results.value.some((item) => item.outcome === 'UNKNOWN' || item.outcome === 'NOT_PROCESSED'),
  );
  let generation = 0;
  function resumeOrOpen() {
    if (frozen.value && canRecover.value) visible.value = true;
    else open();
  }
  function open() {
    if (busy.value || hasUnknown.value || !auth.hasPermission('merchant:payment-method:review'))
      return;
    snapshot.value = candidates.value.map((item) => ({ ...item }));
    selectedIds.value = [];
    results.value = [];
    prepared.value = [];
    frozen.value = false;
    decision.value = 'APPROVE';
    reason.value = '';
    visible.value = true;
  }
  function toggle(id: string, checked: boolean) {
    selectedIds.value = checked
      ? [...new Set([...selectedIds.value, id])]
      : selectedIds.value.filter((item) => item !== id);
  }
  function outcomeFor(id: string) {
    return results.value.find((item) => item.itemId === id)?.outcome;
  }
  async function submit() {
    if (busy.value || !auth.hasPermission('merchant:payment-method:review')) return;
    if (!frozen.value) {
      if (!selectedIds.value.length) {
        ElMessage.warning(t('paymentMethod.batch.select'));
        return;
      }
      if (decision.value !== 'APPROVE' && !reason.value.trim()) {
        ElMessage.warning(t('paymentMethod.reasonRequired'));
        return;
      }
      prepared.value = preparePaymentReviewBatch(
        snapshot.value.filter((item) => selectedIds.value.includes(item.id)),
        decision.value,
        reason.value,
        () => crypto.randomUUID(),
      );
      frozen.value = true;
    }
    if (!prepared.value.length) return;
    const current = generation;
    busy.value = true;
    try {
      const value = await paymentMethodApi.decideBatch(prepared.value);
      if (current !== generation) return;
      results.value = paymentReviewResults(prepared.value, value.results);
      if (results.value.every((item) => item.outcome === 'SUCCEEDED'))
        ElMessage.success(t('paymentMethod.success'));
      else ElMessage.warning(t('paymentMethod.batch.notAllSuccess'));
      emit('updated');
    } catch (error) {
      if (current !== generation) return;
      results.value = paymentReviewResults(prepared.value, []);
      ElMessage.error(userFacingErrorMessage(error, t('paymentMethod.batch.uncertain')));
    } finally {
      busy.value = false;
    }
  }
  watch(
    [() => props.application.applicationNo, () => auth.account?.userId],
    () => {
      generation++;
      visible.value = false;
      results.value = [];
      prepared.value = [];
      selectedIds.value = [];
    },
  );
  onBeforeUnmount(() => {
    generation++;
  });
</script>
<style scoped>
  .batch-review-entry {
    margin: 12px 0;
  }
  .el-alert {
    margin-bottom: 12px;
  }
</style>
