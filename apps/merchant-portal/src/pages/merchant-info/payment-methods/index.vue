<template>
  <div class="page system-page payment-method-page merchant-redesigned-page">
    <el-alert :title="t('paymentMethod.intro')" type="info" :closable="false" show-icon />
    <section class="method-panel">
      <header class="method-header">
        <h2>{{ t('paymentMethod.title') }}</h2>
        <el-button v-if="canViewFee" @click="openFee">{{ t('paymentMethod.viewFee') }}</el-button>
      </header>
      <el-form v-if="isAdmin" inline @submit.prevent="searchMerchant">
        <el-form-item :label="t('paymentMethod.merchantId')">
          <el-input
            v-model="merchantInput"
            :placeholder="t('paymentMethod.merchantHint')"
            clearable
            maxlength="32"
            @keyup.enter="searchMerchant"
          />
        </el-form-item>
        <el-form-item
          ><el-button type="primary" :disabled="busy" @click="searchMerchant">{{
            t('paymentMethod.search')
          }}</el-button></el-form-item
        >
      </el-form>
      <el-empty v-if="!canView" :description="t('paymentMethod.noPermission')" />
      <el-tabs v-else v-model="tab" @tab-change="loadActive">
        <el-tab-pane :label="t('paymentMethod.methods')" name="methods">
          <el-empty
            v-if="isAdmin && !merchantId"
            :description="t('paymentMethod.chooseMerchant')"
          />
          <template v-else>
            <div class="table-toolbar">
              <div class="toolbar-actions">
                <el-button
                  v-if="can('apply')"
                  type="primary"
                  :disabled="!selectedKeys.length || loading || busy"
                  @click="openApply"
                  >{{
                    t(isAdmin ? 'paymentMethod.applyForMerchant' : 'paymentMethod.apply')
                  }}</el-button
                >
                <span v-if="can('apply')" class="muted">{{
                  t('paymentMethod.selected', { count: selectedKeys.length })
                }}</span>
              </div>
              <RightToolbar :show-search="false" @refresh="loadMethods" />
            </div>
            <el-alert
              v-if="methodLoadError"
              :title="t('paymentMethod.loadFailed')"
              type="error"
              :closable="false"
              show-icon
            />
            <StandardTable
              v-loading="loading"
              table-key="merchant-payment-method-methods"
              :data="methods"
              row-key="itemKey"
              size="small"
            >
              <el-table-column v-if="can('apply')" width="48" fixed="left" align="center">
                <template #header
                  ><el-checkbox
                    :model-value="allSelected"
                    :indeterminate="someSelected"
                    :aria-label="t('paymentMethod.selectPage')"
                    @change="togglePage"
                /></template>
                <template #default="{ row }"
                  ><el-checkbox
                    :model-value="selectedKeys.includes(row.itemKey)"
                    :disabled="!eligible(row) || busy"
                    :aria-label="row.name"
                    @change="toggleMethod(row.itemKey, $event === true)"
                /></template>
              </el-table-column>
              <el-table-column
                prop="name"
                :label="t('paymentMethod.method')"
                min-width="210"
                fixed="left"
                align="center"
              >
                <template #default="{ row }"
                  ><div class="method-identity">
                    <PaymentMethodDisplay
                      :payment-types="logoTypes(row)"
                      :payment-methods="logoMethods(row)"
                      :show-payment-type-label="false"
                      align="center"
                    /><strong>{{ row.name }}</strong
                    ><small class="muted">{{ row.itemKey }}</small>
                  </div></template
                >
              </el-table-column>
              <el-table-column
                prop="authorizationStatus"
                :label="t('paymentMethod.authorization')"
                min-width="130"
                align="center"
                ><template #default="{ row }"
                  ><el-tag :type="statusTone(row.authorizationStatus)" effect="plain">{{
                    statusText(row.authorizationStatus)
                  }}</el-tag></template
                ></el-table-column
              >
              <el-table-column
                prop="applicationStatus"
                :label="t('paymentMethod.applicationStatus')"
                min-width="130"
                align="center"
                ><template #default="{ row }">{{
                  statusText(row.applicationStatus, '-')
                }}</template></el-table-column
              >
              <el-table-column
                prop="effectiveTime"
                :label="t('paymentMethod.effectiveTime')"
                min-width="170"
                align="center"
                ><template #default="{ row }"><BaseDateTime :value="row.effectiveTime" /></template
              ></el-table-column>
              <el-table-column
                prop="expireTime"
                :label="t('paymentMethod.expireTime')"
                min-width="170"
                align="center"
                ><template #default="{ row }"
                  ><BaseDateTime v-if="row.expireTime" :value="row.expireTime" /><span v-else>{{
                    row.authorizationVersion ? t('paymentMethod.longTerm') : '-'
                  }}</span></template
                ></el-table-column
              >
              <el-table-column
                prop="businessReadiness"
                :label="t('paymentMethod.configuration')"
                min-width="190"
                align="center"
              >
                <template #default="{ row }">
                  <div class="configuration-facts">
                    <el-tag :type="statusTone(row.businessReadiness)" effect="plain">{{
                      row.businessReadiness
                        ? statusText(row.businessReadiness)
                        : t('paymentMethod.unassessed')
                    }}</el-tag>
                    <span v-for="code in row.reasonCodes || []" :key="code" class="muted">{{
                      publicReason(code)
                    }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column
                prop="feeReference"
                :label="t('paymentMethod.feeVersion')"
                min-width="130"
                align="center"
              >
                <template #default="{ row }">
                  <el-button
                    v-if="row.feeReference && canViewFee"
                    link
                    type="primary"
                    @click="openFee"
                    >v{{ row.feeReference.versionNo }}</el-button
                  >
                  <span v-else-if="row.feeReference">v{{ row.feeReference.versionNo }}</span>
                  <span v-else>{{ t('paymentMethod.unassessed') }}</span>
                </template>
              </el-table-column>
              <el-table-column
                :label="t('paymentMethod.action')"
                min-width="230"
                fixed="right"
                align="center"
              >
                <template #default="{ row }"
                  ><div class="row-actions">
                    <el-button
                      v-if="canReadHistory"
                      link
                      type="primary"
                      @click="openHistory(row)"
                      >{{ t('paymentMethod.history') }}</el-button
                    >
                    <el-button
                      v-if="
                        !isAdmin &&
                        row.applicationItemId &&
                        can('resubmit') &&
                        row.applicationStatus === 'RETURNED'
                      "
                      link
                      type="primary"
                      @click="openItemCommand('resubmit', row)"
                      >{{ t('paymentMethod.resubmit') }}</el-button
                    >
                    <el-button
                      v-if="
                        !isAdmin &&
                        row.applicationItemId &&
                        can('withdraw') &&
                        ['PENDING_REVIEW', 'RETURNED'].includes(row.applicationStatus)
                      "
                      link
                      type="warning"
                      @click="openItemCommand('withdraw', row)"
                      >{{ t('paymentMethod.withdraw') }}</el-button
                    >
                    <el-button
                      v-if="
                        isAdmin &&
                        can('suspend') &&
                        ['ACTIVE', 'EXPIRED', 'NOT_YET_EFFECTIVE', 'LEGACY_OBSERVED'].includes(
                          row.authorizationStatus,
                        )
                      "
                      link
                      type="warning"
                      @click="openLifecycle('suspend', row)"
                      >{{ t('paymentMethod.suspend') }}</el-button
                    >
                    <el-button
                      v-if="isAdmin && can('restore') && row.authorizationStatus === 'SUSPENDED'"
                      link
                      type="primary"
                      @click="openLifecycle('restore', row)"
                      >{{ t('paymentMethod.restore') }}</el-button
                    >
                    <el-button
                      v-if="isAdmin && can('validity') && editableAuthorization(row)"
                      link
                      type="primary"
                      @click="openLifecycle('validity', row)"
                      >{{ t('paymentMethod.validity') }}</el-button
                    >
                    <el-button
                      v-if="
                        isAdmin &&
                        can('terminate') &&
                        (editableAuthorization(row) ||
                          row.authorizationStatus === 'LEGACY_OBSERVED')
                      "
                      link
                      type="danger"
                      @click="openLifecycle('terminate', row)"
                      >{{ t('paymentMethod.terminate') }}</el-button
                    >
                  </div></template
                >
              </el-table-column>
            </StandardTable>
            <div class="pagination-container">
              <el-pagination
                v-model:current-page="methodPage"
                v-model:page-size="methodPageSize"
                :total="methodTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @current-change="loadMethods"
                @size-change="methodSizeChanged"
              />
            </div>
          </template>
        </el-tab-pane>
        <el-tab-pane
          v-if="canViewApplications"
          :label="t('paymentMethod.applications')"
          name="applications"
        >
          <div class="table-toolbar">
            <el-select
              v-model="applicationStatus"
              clearable
              :placeholder="t('paymentMethod.applicationStatus')"
              style="width: 180px"
              @change="applicationFilterChanged"
              ><el-option
                v-for="status in applicationStatuses"
                :key="status"
                :label="statusText(status)"
                :value="status" /></el-select
            ><RightToolbar :show-search="false" @refresh="loadApplications" />
          </div>
          <el-alert
            v-if="applicationLoadError"
            :title="t('paymentMethod.loadFailed')"
            type="error"
            :closable="false"
            show-icon
          />
          <StandardTable
            v-loading="applicationLoading"
            table-key="merchant-payment-method-applications"
            :data="applications"
            row-key="applicationNo"
            size="small"
          >
            <el-table-column
              prop="applicationNo"
              :label="t('paymentMethod.applicationNo')"
              min-width="210"
              align="center"
              fixed="left"
              ><template #default="{ row }"
                ><el-button link type="primary" @click="openApplication(row.applicationNo)">{{
                  row.applicationNo
                }}</el-button></template
              ></el-table-column
            >
            <el-table-column
              v-if="isAdmin"
              prop="merchantId"
              :label="t('paymentMethod.merchantId')"
              min-width="140"
              align="center"
            />
            <el-table-column :label="t('paymentMethod.itemCount')" width="130" align="center"
              ><template #default="{ row }">{{ row.items.length }}</template></el-table-column
            >
            <el-table-column :label="t('paymentMethod.progress')" min-width="240" align="center"
              ><template #default="{ row }"
                ><div class="result-tags">
                  <el-tag
                    v-for="[status, count] in applicationProgress(row)"
                    :key="status"
                    :type="statusTone(status)"
                    effect="plain"
                    >{{ statusText(status) }} {{ count }}</el-tag
                  >
                </div></template
              ></el-table-column
            >
            <el-table-column
              :label="t('paymentMethod.action')"
              width="100"
              align="center"
              fixed="right"
              ><template #default="{ row }"
                ><el-button link type="primary" @click="openApplication(row.applicationNo)">{{
                  t('paymentMethod.detail')
                }}</el-button></template
              ></el-table-column
            >
          </StandardTable>
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="applicationPage"
              v-model:page-size="applicationPageSize"
              :total="applicationTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @current-change="loadApplications"
              @size-change="applicationSizeChanged"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </section>
    <el-drawer
      v-model="applicationVisible"
      :title="t('paymentMethod.detail')"
      size="min(1080px, 96vw)"
      append-to-body
      @closed="closeApplication"
    >
      <div v-loading="detailLoading">
        <template v-if="applicationDetail"
          ><el-descriptions :column="1" border
            ><el-descriptions-item :label="t('paymentMethod.applicationNo')">{{
              applicationDetail.applicationNo
            }}</el-descriptions-item
            ><el-descriptions-item v-if="isAdmin" :label="t('paymentMethod.merchantId')">{{
              applicationDetail.merchantId
            }}</el-descriptions-item></el-descriptions
          >
          <el-alert
            :title="t(isAdmin ? 'paymentMethod.reviewHint' : 'paymentMethod.withdrawHint')"
            type="info"
            :closable="false"
            show-icon
          />
          <el-table :data="applicationDetail.items" border size="small" row-key="id">
            <el-table-column type="expand" width="48">
              <template #default="{ row }">
                <div class="round-history">
                  <h4>{{ t('paymentMethod.roundHistory') }}</h4>
                  <el-table :data="row.history || []" size="small" border>
                    <el-table-column
                      prop="roundNo"
                      :label="t('paymentMethod.round')"
                      width="80"
                      align="center"
                    />
                    <el-table-column
                      prop="action"
                      :label="t('paymentMethod.action')"
                      min-width="120"
                      ><template #default="{ row: history }">{{
                        dictionaryText('actionName', history.action)
                      }}</template></el-table-column
                    >
                    <el-table-column
                      prop="toStatus"
                      :label="t('paymentMethod.after')"
                      min-width="120"
                      ><template #default="{ row: history }">{{
                        statusText(history.toStatus, '-')
                      }}</template></el-table-column
                    >
                    <el-table-column
                      prop="reason"
                      :label="t('paymentMethod.reason')"
                      min-width="220"
                    />
                    <el-table-column
                      prop="occurredAt"
                      :label="t('paymentMethod.occurredAt')"
                      min-width="170"
                      ><template #default="{ row: history }"
                        ><BaseDateTime :value="history.occurredAt" /></template
                    ></el-table-column>
                  </el-table>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              prop="itemKey"
              :label="t('paymentMethod.itemKey')"
              min-width="180"
              align="center"
            />
            <el-table-column
              prop="status"
              :label="t('paymentMethod.applicationStatus')"
              min-width="130"
              align="center"
              ><template #default="{ row }"
                ><el-tag :type="statusTone(row.status)" effect="plain">{{
                  statusText(row.status)
                }}</el-tag></template
              ></el-table-column
            >
            <el-table-column
              prop="roundNo"
              :label="t('paymentMethod.round')"
              width="70"
              align="center"
            />
            <el-table-column
              prop="source"
              :label="t('paymentMethod.source')"
              min-width="120"
              align="center"
              ><template #default="{ row }">{{
                dictionaryText('sourceName', row.source)
              }}</template></el-table-column
            >
            <el-table-column
              prop="reason"
              :label="t('paymentMethod.reason')"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="reviewReason"
              :label="t('paymentMethod.reviewReason')"
              min-width="200"
              show-overflow-tooltip
            />
            <el-table-column
              prop="submittedAt"
              :label="t('paymentMethod.submittedAt')"
              min-width="170"
              align="center"
              ><template #default="{ row }"><BaseDateTime :value="row.submittedAt" /></template
            ></el-table-column>
            <el-table-column
              :label="t('paymentMethod.action')"
              min-width="220"
              fixed="right"
              align="center"
              ><template #default="{ row }"
                ><div class="row-actions">
                  <template v-if="isAdmin && can('review') && row.status === 'PENDING_REVIEW'"
                    ><el-button link type="primary" @click="openReview('approve', row)">{{
                      t('paymentMethod.approve')
                    }}</el-button
                    ><el-button link type="warning" @click="openReview('return', row)">{{
                      t('paymentMethod.return')
                    }}</el-button
                    ><el-button link type="danger" @click="openReview('reject', row)">{{
                      t('paymentMethod.reject')
                    }}</el-button></template
                  >
                  <el-button
                    v-if="!isAdmin && can('resubmit') && row.status === 'RETURNED'"
                    link
                    type="primary"
                    @click="openReview('resubmit', row)"
                    >{{ t('paymentMethod.resubmit') }}</el-button
                  >
                  <el-button
                    v-if="
                      !isAdmin &&
                      can('withdraw') &&
                      ['PENDING_REVIEW', 'RETURNED'].includes(row.status)
                    "
                    link
                    type="warning"
                    @click="openReview('withdraw', row)"
                    >{{ t('paymentMethod.withdraw') }}</el-button
                  >
                </div></template
              ></el-table-column
            >
          </el-table> </template
        ><el-empty v-else-if="!detailLoading" :description="t('paymentMethod.loadFailed')" />
      </div>
    </el-drawer>
    <el-dialog
      v-model="commandVisible"
      :title="commandTitle"
      width="min(620px, 94vw)"
      append-to-body
      :close-on-click-modal="false"
      :close-on-press-escape="!busy"
      :show-close="!busy"
      @closed="clearCommand"
    >
      <el-alert
        v-if="command === 'apply'"
        :title="t('paymentMethod.batchHint')"
        type="info"
        :closable="false"
        show-icon
      />
      <el-alert
        v-else-if="isLifecycleCommand"
        :title="t('paymentMethod.lifecycleHint')"
        type="warning"
        :closable="false"
        show-icon
      />
      <div class="selected-methods">
        <el-tag v-for="key in commandKeys" :key="key" effect="plain">{{ key }}</el-tag>
      </div>
      <el-form label-position="top" @submit.prevent="submitCommand">
        <template v-if="command === 'validity'">
          <el-alert
            v-if="command === 'validity'"
            :title="t('paymentMethod.validityHint')"
            type="info"
            :closable="false"
          />
          <el-form-item :label="t('paymentMethod.effectiveTime')" :required="command === 'validity'"
            ><el-date-picker
              v-model="effectiveTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              :disabled="busy"
          /></el-form-item>
          <el-form-item :label="t('paymentMethod.expireTime')"
            ><el-date-picker
              v-model="expireTime"
              type="datetime"
              value-format="YYYY-MM-DD HH:mm:ss"
              :placeholder="t('paymentMethod.longTerm')"
              :disabled="busy"
          /></el-form-item>
        </template>
        <el-form-item :label="t('paymentMethod.reason')" :required="reasonRequired"
          ><el-input
            v-model="reason"
            type="textarea"
            :rows="4"
            maxlength="1000"
            show-word-limit
            :placeholder="t('paymentMethod.reasonPlaceholder')"
            :disabled="busy"
        /></el-form-item>
      </el-form>
      <template #footer
        ><div class="dialog-footer">
          <el-button type="primary" :loading="busy" @click="submitCommand">{{
            t('paymentMethod.confirm')
          }}</el-button
          ><el-button :disabled="busy" @click="commandVisible = false">{{
            t('paymentMethod.cancel')
          }}</el-button>
        </div></template
      >
    </el-dialog>
    <el-dialog
      v-model="historyVisible"
      :title="`${t('paymentMethod.history')} · ${historyItem?.name || ''}`"
      width="min(980px, 96vw)"
      append-to-body
      @closed="historyRequest++"
    >
      <el-table v-loading="historyLoading" :data="historyRows" border size="small" row-key="id"
        ><el-table-column prop="action" :label="t('paymentMethod.action')" min-width="120"
          ><template #default="{ row }">{{
            dictionaryText('actionName', row.action)
          }}</template></el-table-column
        ><el-table-column prop="fromStatus" :label="t('paymentMethod.before')" min-width="120"
          ><template #default="{ row }">{{
            statusText(row.fromStatus, '-')
          }}</template></el-table-column
        ><el-table-column prop="toStatus" :label="t('paymentMethod.after')" min-width="120"
          ><template #default="{ row }">{{
            statusText(row.toStatus, '-')
          }}</template></el-table-column
        ><el-table-column
          prop="reason"
          :label="t('paymentMethod.reason')"
          min-width="200" /><el-table-column
          prop="occurredAt"
          :label="t('paymentMethod.occurredAt')"
          min-width="170"
          ><template #default="{ row }"
            ><BaseDateTime :value="row.occurredAt" /></template></el-table-column
      ></el-table>
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="historyPage"
          :page-size="20"
          :total="historyTotal"
          layout="total, prev, pager, next"
          @current-change="loadHistory"
        />
      </div>
      <template #footer
        ><div class="dialog-footer">
          <el-button @click="historyVisible = false">{{ t('paymentMethod.close') }}</el-button>
        </div></template
      >
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { ElMessage } from 'element-plus';
  import { PaymentMethodDisplay, userFacingErrorMessage } from '@acquiring/shared';
  import {
    paymentMethodApi,
    type PaymentMethodRow,
    type PaymentApplication,
    type PaymentApplicationItem,
    type PaymentMethodHistory,
    type PaymentMethodCommand,
  } from '@/api/paymentMethodApi';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import RightToolbar from '@/components/RightToolbar/index.vue';
  import StandardTable from '@/components/StandardTable/StandardTable.vue';
  import { useAuthStore } from '@/stores/authStore';

  const isAdmin = false;
  const auth = useAuthStore();
  const route = useRoute();
  const router = useRouter();
  const { t, te } = useI18n();
  const can = (action: string) => auth.hasPermission(`merchant:payment-method:${action}`);
  const canView = computed(() => can('view'));
  const canViewApplications = computed(() => can(isAdmin ? 'view' : 'application:view'));
  const canReadHistory = computed(() => isAdmin && can('history'));
  const canViewFee = computed(
    () =>
      auth.hasPermission(isAdmin ? 'fee:merchant:list' : 'merchant:fee:view') &&
      (!isAdmin || Boolean(merchantId.value)),
  );
  const merchantInput = ref(
    typeof route.query.merchantId === 'string' ? route.query.merchantId : '',
  );
  const merchantId = ref(merchantInput.value.trim());
  const tab = ref('methods');
  const methods = ref<PaymentMethodRow[]>([]);
  const loading = ref(false);
  const methodLoadError = ref(false);
  const methodPage = ref(1);
  const methodPageSize = ref(20);
  const methodTotal = ref(0);
  const selectedKeys = ref<string[]>([]);
  const applications = ref<PaymentApplication[]>([]);
  const applicationLoading = ref(false);
  const applicationLoadError = ref(false);
  const applicationPage = ref(1);
  const applicationPageSize = ref(20);
  const applicationTotal = ref(0);
  const applicationStatus = ref('');
  const applicationStatuses = ['PENDING_REVIEW', 'RETURNED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
  const applicationVisible = ref(false);
  const applicationDetail = ref<PaymentApplication | null>(null);
  const detailLoading = ref(false);
  const historyVisible = ref(false);
  const historyItem = ref<PaymentMethodRow | null>(null);
  const historyRows = ref<PaymentMethodHistory[]>([]);
  const historyPage = ref(1);
  const historyTotal = ref(0);
  const historyLoading = ref(false);
  const commandVisible = ref(false);
  const command = ref('');
  const commandKeys = ref<string[]>([]);
  const commandItemId = ref('');
  const commandMerchant = ref('');
  const expectedVersion = ref('');
  const reason = ref('');
  const effectiveTime = ref<string | null>(null);
  const expireTime = ref<string | null>(null);
  const busy = ref(false);
  let pageContext = 0;
  let methodRequest = 0;
  let applicationRequest = 0;
  let detailRequest = 0;
  let historyRequest = 0;
  let commandRequestId = '';
  let commandFingerprint = '';
  const isLifecycleCommand = computed(() =>
    ['suspend', 'restore', 'terminate', 'validity'].includes(command.value),
  );
  const commandTitle = computed(() => t(`paymentMethod.${command.value || 'action'}`));
  const reasonRequired = computed(
    () => !['approve'].includes(command.value) && (command.value !== 'apply' || isAdmin),
  );
  const selectableRows = computed(() => methods.value.filter(eligible));
  const allSelected = computed(
    () =>
      selectableRows.value.length > 0 &&
      selectableRows.value.every((row) => selectedKeys.value.includes(row.itemKey)),
  );
  const someSelected = computed(
    () =>
      !allSelected.value &&
      selectableRows.value.some((row) => selectedKeys.value.includes(row.itemKey)),
  );

  function dictionaryText(group: string, value?: string | null) {
    const key = `paymentMethod.${group}.${value}`;
    return value ? (te(key) ? t(key) : value) : '-';
  }
  function publicReason(code: string) {
    const key = `paymentMethod.reasonCodes.${code}`;
    return te(key) ? t(key) : t('paymentMethod.unassessed');
  }
  function statusText(value?: string | null, empty = t('paymentMethod.noGrant')) {
    return value ? dictionaryText('status', value) : empty;
  }
  function statusTone(value?: string | null): 'success' | 'warning' | 'danger' | 'info' {
    return ['ACTIVE', 'APPROVED', 'READY'].includes(value || '')
      ? 'success'
      : ['PENDING_REVIEW', 'RETURNED', 'SUSPENDED'].includes(value || '')
        ? 'warning'
        : ['TERMINATED', 'REJECTED', 'BLOCKED'].includes(value || '')
          ? 'danger'
          : 'info';
  }
  function eligible(row: PaymentMethodRow) {
    return row.requestable === true && row.catalogEnabled !== false;
  }
  function editableAuthorization(row: PaymentMethodRow) {
    return (
      ['ACTIVE', 'SUSPENDED', 'EXPIRED', 'NOT_YET_EFFECTIVE'].includes(
        row.authorizationStatus || '',
      ) && Boolean(row.authorizationVersion)
    );
  }
  function logoTypes(row: PaymentMethodRow) {
    return [
      {
        value: row.itemKey.startsWith('CARD_BRAND:')
          ? 'BANK_CARD'
          : row.itemKey.replace(/^METHOD:/, ''),
        label: row.name,
      },
    ];
  }
  function logoMethods(row: PaymentMethodRow) {
    return [{ value: row.itemKey.split(':')[1] || row.itemKey, label: row.name }];
  }
  function toggleMethod(key: string, checked: boolean) {
    selectedKeys.value = checked
      ? [...new Set([...selectedKeys.value, key])]
      : selectedKeys.value.filter((item) => item !== key);
  }
  function togglePage(value: unknown) {
    selectableRows.value.forEach((row) => toggleMethod(row.itemKey, value === true));
  }
  function applicationProgress(application: PaymentApplication) {
    const counts = new Map<string, number>();
    application.items.forEach((item) =>
      counts.set(item.status, (counts.get(item.status) || 0) + 1),
    );
    return [...counts.entries()];
  }
  function fail(error: unknown, key = 'paymentMethod.loadFailed') {
    ElMessage.error(userFacingErrorMessage(error, t(key)));
  }
  async function loadMethods() {
    if (!canView.value || (isAdmin && !merchantId.value)) return;
    const request = ++methodRequest;
    loading.value = true;
    methodLoadError.value = false;
    try {
      const result = await paymentMethodApi.methods(merchantId.value, {
        pageNo: methodPage.value,
        pageSize: methodPageSize.value,
      });
      if (request !== methodRequest) return;
      methods.value = result.records;
      methodTotal.value = result.total;
      selectedKeys.value = selectedKeys.value.filter(
        (key) => !result.records.some((row) => row.itemKey === key && !eligible(row)),
      );
    } catch (error) {
      if (request !== methodRequest) return;
      methods.value = [];
      methodTotal.value = 0;
      methodLoadError.value = true;
      fail(error);
    } finally {
      if (request === methodRequest) loading.value = false;
    }
  }
  async function loadApplications() {
    if (!canViewApplications.value) return;
    const request = ++applicationRequest;
    applicationLoading.value = true;
    applicationLoadError.value = false;
    try {
      const result = await paymentMethodApi.applications({
        pageNo: applicationPage.value,
        pageSize: applicationPageSize.value,
        merchantId: isAdmin ? merchantId.value : undefined,
        status: applicationStatus.value || undefined,
      });
      if (request !== applicationRequest) return;
      applications.value = result.records;
      applicationTotal.value = result.total;
    } catch (error) {
      if (request !== applicationRequest) return;
      applications.value = [];
      applicationTotal.value = 0;
      applicationLoadError.value = true;
      fail(error);
    } finally {
      if (request === applicationRequest) applicationLoading.value = false;
    }
  }
  function loadActive() {
    return tab.value === 'methods' ? loadMethods() : loadApplications();
  }
  function searchMerchant() {
    if (busy.value) return;
    methodRequest++;
    applicationRequest++;
    detailRequest++;
    historyRequest++;
    merchantId.value = merchantInput.value.trim();
    methods.value = [];
    applications.value = [];
    selectedKeys.value = [];
    methodTotal.value = 0;
    applicationTotal.value = 0;
    methodPage.value = 1;
    applicationPage.value = 1;
    loading.value = false;
    applicationLoading.value = false;
    applicationVisible.value = false;
    historyVisible.value = false;
    void loadActive();
  }
  function methodSizeChanged() {
    methodPage.value = 1;
    void loadMethods();
  }
  function applicationSizeChanged() {
    applicationPage.value = 1;
    void loadApplications();
  }
  function applicationFilterChanged() {
    applicationPage.value = 1;
    void loadApplications();
  }
  async function openApplication(applicationNo: string) {
    applicationVisible.value = true;
    applicationDetail.value = null;
    detailLoading.value = true;
    const request = ++detailRequest;
    try {
      const result = await paymentMethodApi.application(applicationNo);
      if (request === detailRequest && applicationVisible.value) applicationDetail.value = result;
    } catch (error) {
      if (request === detailRequest) fail(error);
    } finally {
      if (request === detailRequest) detailLoading.value = false;
    }
  }
  function closeApplication() {
    detailRequest++;
    applicationDetail.value = null;
  }
  function openApply() {
    if (busy.value) return;
    if (!selectedKeys.value.length || !can('apply')) return;
    beginCommand('apply', selectedKeys.value, '', '', merchantId.value);
  }
  function openReview(action: string, item: PaymentApplicationItem) {
    if (busy.value) return;
    if (!can(isAdmin ? 'review' : action)) return;
    beginCommand(
      action,
      [item.itemKey],
      item.id,
      item.version,
      applicationDetail.value?.merchantId || merchantId.value,
    );
  }
  function openItemCommand(action: string, row: PaymentMethodRow) {
    if (busy.value) return;
    if (!row.applicationItemId || !row.applicationVersion || !can(action)) return;
    beginCommand(
      action,
      [row.itemKey],
      row.applicationItemId,
      row.applicationVersion,
      merchantId.value,
    );
  }
  function openLifecycle(action: string, row: PaymentMethodRow) {
    if (busy.value) return;
    if (!row.authorizationVersion || !can(action)) return;
    beginCommand(action, [row.itemKey], '', row.authorizationVersion, merchantId.value);
    effectiveTime.value = row.effectiveTime || null;
    expireTime.value = row.expireTime || null;
  }
  function beginCommand(
    action: string,
    keys: string[],
    itemId: string,
    version: string,
    merchant: string,
  ) {
    command.value = action;
    commandKeys.value = [...keys];
    commandItemId.value = itemId;
    expectedVersion.value = version;
    commandMerchant.value = merchant;
    reason.value = '';
    effectiveTime.value = null;
    expireTime.value = null;
    commandRequestId = '';
    commandFingerprint = '';
    commandVisible.value = true;
  }
  function clearCommand() {
    if (!busy.value) {
      command.value = '';
      commandKeys.value = [];
      commandRequestId = '';
      commandFingerprint = '';
    }
  }
  async function submitCommand() {
    if (busy.value) return;
    const action = command.value;
    if (reasonRequired.value && !reason.value.trim()) {
      ElMessage.warning(t('paymentMethod.reasonRequired'));
      return;
    }
    if (
      (action === 'validity' && !effectiveTime.value) ||
      (expireTime.value && effectiveTime.value && expireTime.value <= effectiveTime.value)
    ) {
      ElMessage.warning(t('paymentMethod.invalidTime'));
      return;
    }
    const payload = {
      expectedVersion: expectedVersion.value,
      reason: reason.value.trim() || undefined,
      ...(action === 'validity'
        ? {
            effectiveTime: effectiveTime.value?.replace(' ', 'T') || undefined,
            expireTime: expireTime.value?.replace(' ', 'T') || null,
          }
        : {}),
    };
    const fingerprint = JSON.stringify([
      action,
      commandMerchant.value,
      commandKeys.value,
      commandItemId.value,
      payload,
    ]);
    if (commandFingerprint !== fingerprint) {
      commandFingerprint = fingerprint;
      commandRequestId = crypto.randomUUID();
    }
    const body: PaymentMethodCommand = { ...payload, requestId: commandRequestId };
    const context = pageContext;
    busy.value = true;
    try {
      if (action === 'apply')
        await paymentMethodApi.apply(commandMerchant.value, {
          requestId: body.requestId,
          items: commandKeys.value,
          reason: body.reason,
        });
      else if (['approve', 'return', 'reject'].includes(action))
        await paymentMethodApi.decide(commandItemId.value, {
          ...body,
          decision: action === 'approve' ? 'APPROVE' : action === 'return' ? 'RETURN' : 'REJECT',
        });
      else if (action === 'resubmit') await paymentMethodApi.resubmit(commandItemId.value, body);
      else if (action === 'withdraw') await paymentMethodApi.withdraw(commandItemId.value, body);
      else if (
        action === 'suspend' ||
        action === 'restore' ||
        action === 'terminate' ||
        action === 'validity'
      )
        await paymentMethodApi.lifecycle(commandMerchant.value, commandKeys.value[0], action, body);
      else return;
      if (context !== pageContext) return;
      ElMessage.success(t('paymentMethod.success'));
      commandVisible.value = false;
      selectedKeys.value = [];
      const applicationNo = applicationDetail.value?.applicationNo;
      await Promise.all([
        loadMethods(),
        canViewApplications.value ? loadApplications() : Promise.resolve(),
        applicationNo && applicationVisible.value
          ? openApplication(applicationNo)
          : Promise.resolve(),
      ]);
    } catch (error) {
      if (context === pageContext) fail(error, 'paymentMethod.failed');
    } finally {
      busy.value = false;
    }
  }
  async function openHistory(row: PaymentMethodRow) {
    historyItem.value = row;
    historyVisible.value = true;
    historyRows.value = [];
    historyPage.value = 1;
    historyTotal.value = 0;
    await loadHistory();
  }
  async function loadHistory() {
    if (!historyItem.value || !canReadHistory.value) return;
    const request = ++historyRequest;
    historyLoading.value = true;
    try {
      const result = await paymentMethodApi.history(
        merchantId.value,
        historyItem.value.itemKey,
        historyPage.value,
        20,
      );
      if (request !== historyRequest || !historyVisible.value) return;
      historyRows.value = result.records;
      historyTotal.value = result.total;
    } catch (error) {
      if (request === historyRequest) {
        historyRows.value = [];
        historyTotal.value = 0;
        fail(error);
      }
    } finally {
      if (request === historyRequest) historyLoading.value = false;
    }
  }
  function openFee() {
    if (!canViewFee.value) return;
    void router.push(
      isAdmin
        ? { path: '/fee/merchant', query: { merchantId: merchantId.value } }
        : { path: '/finance/fee' },
    );
  }
  watch(
    () => route.query.merchantId,
    (value) => {
      if (!isAdmin || busy.value) return;
      merchantInput.value = typeof value === 'string' ? value : '';
      searchMerchant();
    },
  );
  watch(
    () => route.query.applicationNo,
    (value) => {
      if (!isAdmin || !canViewApplications.value || typeof value !== 'string') return;
      tab.value = 'applications';
      void loadApplications();
      void openApplication(value);
    },
  );
  watch(
    () => [auth.session?.account.userId, canView.value, canViewApplications.value],
    () => {
      pageContext++;
      methodRequest++;
      applicationRequest++;
      detailRequest++;
      historyRequest++;
      methods.value = [];
      applications.value = [];
      selectedKeys.value = [];
      applicationDetail.value = null;
      historyRows.value = [];
      methodTotal.value = 0;
      applicationTotal.value = 0;
      loading.value = false;
      applicationLoading.value = false;
      applicationVisible.value = false;
      historyVisible.value = false;
      commandVisible.value = false;
      void loadActive();
    },
  );
  onMounted(() => {
    const applicationNo = route.query.applicationNo;
    if (isAdmin && typeof applicationNo === 'string' && canViewApplications.value) {
      tab.value = 'applications';
      void openApplication(applicationNo);
    }
    void loadActive();
  });
  onBeforeUnmount(() => {
    pageContext++;
    methodRequest++;
    applicationRequest++;
    detailRequest++;
    historyRequest++;
  });
</script>

<style scoped>
  .payment-method-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .method-panel {
    padding: 20px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: var(--el-bg-color);
  }
  .method-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }
  .method-header h2 {
    font-size: 18px;
    margin: 0;
    color: var(--el-text-color-primary);
  }
  .table-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 12px 0;
  }
  .toolbar-actions,
  .row-actions,
  .result-tags,
  .selected-methods {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  .row-actions,
  .result-tags {
    justify-content: center;
  }
  .row-actions :deep(.el-button + .el-button) {
    margin-left: 0;
  }
  .method-identity {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
    padding: 6px 0;
  }
  .configuration-facts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 6px 0;
  }
  .method-identity strong {
    font-weight: 500;
  }
  .muted {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
  .round-history {
    padding: 16px;
  }
  .selected-methods {
    margin: 16px 0;
  }
  .pagination-container {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
    overflow-x: auto;
  }
  .el-alert {
    margin-bottom: 12px;
  }
  @media (max-width: 640px) {
    .method-panel {
      padding: 12px;
    }
    .method-header,
    .table-toolbar {
      flex-wrap: wrap;
    }
  }
</style>
