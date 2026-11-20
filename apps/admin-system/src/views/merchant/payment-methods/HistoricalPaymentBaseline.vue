<template>
  <div class="baseline-workspace">
    <el-alert :title="t('paymentMethod.baseline.hint')" type="info" :closable="false" show-icon />
    <el-empty v-if="!merchantId" :description="t('paymentMethod.chooseMerchant')" />
    <template v-else>
      <div class="baseline-toolbar">
        <el-form v-if="can('history')" inline @submit.prevent="loadBatch">
          <el-form-item :label="t('paymentMethod.baseline.batchRef')"
            ><el-input
              v-model="batchInput"
              :placeholder="t('paymentMethod.baseline.batchHint')"
              maxlength="64"
              clearable
              :disabled="busy"
          /></el-form-item>
          <el-form-item
            ><el-button
              type="primary"
              :loading="loading"
              :disabled="busy || !batchInput.trim()"
              @click="loadBatch"
              >{{ t('paymentMethod.search') }}</el-button
            ></el-form-item
          >
        </el-form>
        <el-button v-if="can('baseline:submit')" :disabled="busy" @click="openRegistration">{{
          t('paymentMethod.baseline.register')
        }}</el-button>
      </div>
      <el-alert
        v-if="receipt"
        :title="
          t('paymentMethod.baseline.receipt', {
            batch: receipt.batchRef,
            count: receipt.itemCount,
            unresolved: receipt.unresolvedCount,
          })
        "
        type="success"
        :closable="false"
      />
      <template v-if="detail">
        <el-descriptions :column="2" border
          ><el-descriptions-item :label="t('paymentMethod.baseline.batchRef')">{{
            detail.batchRef
          }}</el-descriptions-item
          ><el-descriptions-item :label="t('paymentMethod.baseline.cutoffTime')"
            ><BaseDateTime
              :value="detail.cutoffTime"
              source-time-zone="Asia/Shanghai"
              display-time-zone="Asia/Shanghai" /></el-descriptions-item
        ></el-descriptions>
        <div class="baseline-toolbar">
          <el-button
            v-if="can('baseline:approve') && detail.status === 'PENDING_VERIFICATION'"
            type="primary"
            :disabled="!selectedKeys.length || busy"
            @click="openReview"
            >{{ t('paymentMethod.baseline.review') }}</el-button
          ><RightToolbar :show-search="false" @refresh="loadBatch" />
        </div>
        <StandardTable
          v-loading="loading"
          table-key="admin-payment-method-history-baseline"
          :data="detail.items"
          row-key="itemKey"
          size="small"
        >
          <el-table-column
            v-if="can('baseline:approve') && detail.status === 'PENDING_VERIFICATION'"
            width="48"
            fixed="left"
            align="center"
            ><template #default="{ row }"
              ><el-checkbox
                :model-value="selectedKeys.includes(row.itemKey)"
                :disabled="busy"
                :aria-label="row.itemKey"
                @change="toggleKey(row.itemKey, $event === true)" /></template
          ></el-table-column>
          <el-table-column
            prop="itemKey"
            :label="t('paymentMethod.itemKey')"
            min-width="180"
            align="center"
            fixed="left"
          />
          <el-table-column
            prop="evidenceType"
            :label="t('paymentMethod.baseline.evidenceType')"
            min-width="150"
            align="center"
            ><template #default="{ row }">{{
              evidenceTypeText(row.evidenceType)
            }}</template></el-table-column
          >
          <el-table-column
            prop="evidenceRef"
            :label="t('paymentMethod.baseline.evidenceRef')"
            min-width="220"
            show-overflow-tooltip
          />
          <el-table-column
            prop="evidenceTime"
            :label="t('paymentMethod.baseline.evidenceTime')"
            min-width="180"
            align="center"
            ><template #default="{ row }"
              ><BaseDateTime
                :value="row.evidenceTime"
                source-time-zone="Asia/Shanghai"
                display-time-zone="Asia/Shanghai" /></template
          ></el-table-column>
          <el-table-column
            :label="t('paymentMethod.applicationStatus')"
            min-width="120"
            align="center"
            ><template #default="{ row }"
              ><el-tag
                :type="detail.approvedItemKeys.includes(row.itemKey) ? 'success' : 'warning'"
                effect="plain"
                >{{
                  t(
                    detail.approvedItemKeys.includes(row.itemKey)
                      ? 'paymentMethod.baseline.approved'
                      : 'paymentMethod.baseline.pending',
                  )
                }}</el-tag
              ></template
            ></el-table-column
          >
        </StandardTable>
      </template>
      <el-empty v-else-if="!loading" :description="t('paymentMethod.baseline.noBatch')" />
    </template>
    <el-dialog
      v-model="dialogVisible"
      :title="
        t(mode === 'submit' ? 'paymentMethod.baseline.register' : 'paymentMethod.baseline.review')
      "
      width="min(1050px, 96vw)"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!busy"
      :show-close="!busy"
    >
      <el-alert
        :title="
          t(mode === 'submit' ? 'paymentMethod.baseline.hint' : 'paymentMethod.baseline.reviewHint')
        "
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-position="top" @submit.prevent="submit">
        <template v-if="mode === 'submit'">
          <el-form-item :label="t('paymentMethod.baseline.cutoffTime')" required
            ><el-date-picker
              v-model="cutoffTime"
              type="datetime"
              value-format="YYYY-MM-DDTHH:mm:ss"
              :disabled="busy"
          /></el-form-item>
          <el-table :data="evidenceRows" row-key="rowId" border size="small">
            <el-table-column :label="t('paymentMethod.itemKey')" min-width="190"
              ><template #default="{ row }"
                ><el-input
                  v-model="row.itemKey"
                  placeholder="CARD_BRAND:VISA"
                  maxlength="64"
                  :disabled="busy" /></template
            ></el-table-column>
            <el-table-column :label="t('paymentMethod.baseline.evidenceType')" min-width="180"
              ><template #default="{ row }"
                ><el-select v-model="row.evidenceType" :disabled="busy"
                  ><el-option
                    value="SUCCESSFUL_PAYMENT"
                    :label="t('paymentMethod.baseline.successfulPayment')" /><el-option
                    value="HISTORICAL_CONFIG"
                    :label="t('paymentMethod.baseline.historicalConfig')" /></el-select></template
            ></el-table-column>
            <el-table-column :label="t('paymentMethod.baseline.evidenceRef')" min-width="210"
              ><template #default="{ row }"
                ><el-input v-model="row.evidenceRef" maxlength="160" :disabled="busy" /></template
            ></el-table-column>
            <el-table-column :label="t('paymentMethod.baseline.evidenceTime')" min-width="220"
              ><template #default="{ row }"
                ><el-date-picker
                  v-model="row.evidenceTime"
                  type="datetime"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                  :disabled="busy" /></template
            ></el-table-column>
            <el-table-column :label="t('paymentMethod.action')" width="85" fixed="right"
              ><template #default="{ row }"
                ><el-button
                  link
                  type="danger"
                  :disabled="busy || evidenceRows.length < 2"
                  @click="evidenceRows = evidenceRows.filter((item) => item.rowId !== row.rowId)"
                  >{{ t('paymentMethod.baseline.removeItem') }}</el-button
                ></template
              ></el-table-column
            >
          </el-table>
          <div class="baseline-add">
            <el-button :disabled="busy || evidenceRows.length >= 100" @click="addEvidence">{{
              t('paymentMethod.baseline.addItem')
            }}</el-button>
          </div>
          <p class="baseline-hint">{{ t('paymentMethod.baseline.evidenceRefHint') }}</p>
        </template>
        <div v-else class="baseline-selected">
          <el-tag v-for="key in selectedKeys" :key="key">{{ key }}</el-tag>
        </div>
        <el-form-item :label="t('paymentMethod.reason')" required
          ><el-input
            v-model="reason"
            type="textarea"
            :rows="3"
            maxlength="1000"
            show-word-limit
            :disabled="busy"
        /></el-form-item>
      </el-form>
      <template #footer
        ><div class="dialog-footer">
          <el-button type="primary" :loading="busy" @click="submit">{{
            t('paymentMethod.confirm')
          }}</el-button
          ><el-button :disabled="busy" @click="dialogVisible = false">{{
            t('paymentMethod.cancel')
          }}</el-button>
        </div></template
      >
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
  import { onBeforeUnmount, ref, watch } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import { userFacingErrorMessage } from '@acquiring/shared';
  import { useUserStore } from '@/store/modules/user';
  import {
    paymentMethodApi,
    type PaymentBaselineDetail,
    type PaymentBaselineEvidence,
    type PaymentBaselineReceipt,
  } from '@/api/paymentMethodApi';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';

  const props = defineProps<{ merchantId: string }>();
  const emit = defineEmits<{ updated: [] }>();
  const { t } = useI18n();
  const auth = useUserStore();
  const can = (action: string) => auth.hasPermission(`merchant:payment-method:${action}`);
  const batchInput = ref('');
  const detail = ref<PaymentBaselineDetail | null>(null);
  const receipt = ref<PaymentBaselineReceipt | null>(null);
  const loading = ref(false);
  const busy = ref(false);
  const dialogVisible = ref(false);
  const mode = ref<'submit' | 'approve'>('submit');
  const cutoffTime = ref<string | null>(null);
  const reason = ref('');
  const selectedKeys = ref<string[]>([]);
  type EvidenceInput = {
    rowId: string;
    itemKey: string;
    evidenceType: PaymentBaselineEvidence['evidenceType'] | '';
    evidenceRef: string;
    evidenceTime: string | null;
  };
  const evidenceRows = ref<EvidenceInput[]>([]);
  let generation = 0;
  let requestId = '';
  let fingerprint = '';
  function evidenceTypeText(type: string) {
    return type === 'SUCCESSFUL_PAYMENT'
      ? t('paymentMethod.baseline.successfulPayment')
      : type === 'HISTORICAL_CONFIG'
        ? t('paymentMethod.baseline.historicalConfig')
        : t('paymentMethod.unknown');
  }
  function addEvidence() {
    evidenceRows.value.push({
      rowId: crypto.randomUUID(),
      itemKey: '',
      evidenceType: '',
      evidenceRef: '',
      evidenceTime: null,
    });
  }
  function toggleKey(key: string, checked: boolean) {
    selectedKeys.value = checked
      ? [...new Set([...selectedKeys.value, key])]
      : selectedKeys.value.filter((item) => item !== key);
  }
  function openRegistration() {
    if (busy.value || !props.merchantId || !can('baseline:submit')) return;
    mode.value = 'submit';
    evidenceRows.value = [];
    addEvidence();
    cutoffTime.value = null;
    reason.value = '';
    requestId = '';
    fingerprint = '';
    dialogVisible.value = true;
  }
  function openReview() {
    if (
      busy.value ||
      !selectedKeys.value.length ||
      !can('baseline:approve') ||
      detail.value?.status !== 'PENDING_VERIFICATION'
    )
      return;
    mode.value = 'approve';
    reason.value = '';
    requestId = '';
    fingerprint = '';
    dialogVisible.value = true;
  }
  async function loadBatch() {
    if (!props.merchantId || !batchInput.value.trim() || !can('history')) return;
    const current = ++generation;
    loading.value = true;
    detail.value = null;
    selectedKeys.value = [];
    try {
      const value = await paymentMethodApi.baseline(props.merchantId, batchInput.value.trim());
      if (current === generation) detail.value = value;
    } catch (error) {
      if (current === generation)
        ElMessage.error(userFacingErrorMessage(error, t('paymentMethod.loadFailed')));
    } finally {
      if (current === generation) loading.value = false;
    }
  }
  async function submit() {
    if (busy.value || !props.merchantId || !can(`baseline:${mode.value}`)) return;
    if (!reason.value.trim()) {
      ElMessage.warning(t('paymentMethod.reasonRequired'));
      return;
    }
    let items: PaymentBaselineEvidence[] = [];
    if (mode.value === 'submit') {
      const rows = evidenceRows.value;
      if (
        !cutoffTime.value ||
        !rows.length ||
        rows.length > 100 ||
        new Set(rows.map((row) => row.itemKey.trim())).size !== rows.length ||
        rows.some(
          (row) =>
            !/^(CARD_BRAND|METHOD):[A-Z][A-Z0-9_]*$/.test(row.itemKey.trim()) ||
            !row.evidenceType ||
            !/^[A-Za-z0-9_.:#/-]{1,160}$/.test(row.evidenceRef.trim()) ||
            !row.evidenceTime ||
            row.evidenceTime > cutoffTime.value!,
        )
      ) {
        ElMessage.warning(t('paymentMethod.baseline.invalid'));
        return;
      }
      items = rows.map((row) => ({
        itemKey: row.itemKey.trim(),
        evidenceType: row.evidenceType as PaymentBaselineEvidence['evidenceType'],
        evidenceRef: row.evidenceRef.trim(),
        evidenceTime: row.evidenceTime!,
      }));
    } else if (
      !selectedKeys.value.length ||
      !detail.value ||
      detail.value.status !== 'PENDING_VERIFICATION'
    ) {
      ElMessage.warning(t('paymentMethod.baseline.selectEvidence'));
      return;
    }
    const merchant = props.merchantId;
    const batch = detail.value?.batchRef;
    const common = { reason: reason.value.trim() };
    const payload =
      mode.value === 'submit'
        ? { ...common, cutoffTime: cutoffTime.value!, items }
        : { ...common, approvedItemKeys: [...selectedKeys.value] };
    const key = JSON.stringify([
      merchant,
      mode.value,
      mode.value === 'approve' ? batch : undefined,
      payload,
    ]);
    if (fingerprint !== key) {
      fingerprint = key;
      requestId = crypto.randomUUID();
    }
    const current = generation;
    busy.value = true;
    try {
      const value =
        mode.value === 'submit'
          ? await paymentMethodApi.submitBaseline(merchant, {
              requestId,
              reason: common.reason,
              cutoffTime: cutoffTime.value!,
              items,
            })
          : await paymentMethodApi.approveBaseline(merchant, batch!, {
              requestId,
              reason: common.reason,
              approvedItemKeys: [...selectedKeys.value],
            });
      if (current !== generation) return;
      receipt.value = value;
      batchInput.value = value.batchRef;
      dialogVisible.value = false;
      ElMessage.success(
        t('paymentMethod.baseline.receipt', {
          batch: value.batchRef,
          count: value.itemCount,
          unresolved: value.unresolvedCount,
        }),
      );
      emit('updated');
      if (can('history')) await loadBatch();
    } catch (error) {
      if (current === generation)
        ElMessage.error(userFacingErrorMessage(error, t('paymentMethod.failed')));
    } finally {
      busy.value = false;
    }
  }
  watch(
    () => [props.merchantId, auth.account?.userId],
    () => {
      generation++;
      detail.value = null;
      receipt.value = null;
      selectedKeys.value = [];
      batchInput.value = '';
      dialogVisible.value = false;
      loading.value = false;
    },
  );
  onBeforeUnmount(() => {
    generation++;
  });
</script>
<style scoped>
  .baseline-workspace {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .baseline-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .baseline-selected {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 16px 0;
  }
  .baseline-add {
    margin-top: 12px;
  }
  .baseline-hint {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
  .baseline-workspace :deep(.el-form-item) {
    margin-bottom: 12px;
  }
</style>
