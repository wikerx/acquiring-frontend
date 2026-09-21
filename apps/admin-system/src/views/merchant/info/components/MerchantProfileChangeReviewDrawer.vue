<!-- 商户资料变更审核工作台：集中处理申请筛选、字段差异、关联资料和审核决定。 -->
<template>
  <CommonDetailDrawer
    v-model:visible="drawerVisible"
    :title="t('merchant.info.profileChangeReview')"
    size="full"
    :close-on-click-modal="false"
  >
    <div class="review-workbench">
      <aside class="request-rail">
        <div class="request-rail__filters">
          <el-input
            v-model="query.merchantId"
            :placeholder="t('merchant.info.changeMerchantIdPlaceholder')"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-model="query.status"
            :placeholder="t('merchant.info.changeStatus')"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="statusText(status)"
              :value="status"
            />
          </el-select>
        </div>

        <div class="request-rail__heading">
          <span>{{ t('merchant.info.changeRequestQueue') }}</span>
          <el-button
            :icon="Refresh"
            circle
            text
            :title="t('common.refresh')"
            @click="loadRequests"
          />
        </div>

        <div v-loading="listLoading" class="request-list">
          <button
            v-for="item in requests"
            :key="item.requestNo"
            type="button"
            class="request-item"
            :class="{ 'is-active': item.requestNo === selectedRequestNo }"
            @click="selectRequest(item.requestNo)"
          >
            <span class="request-item__topline">
              <strong>{{ item.merchantName || item.merchantId }}</strong>
              <el-tag size="small" :type="statusType(item.status)" effect="plain">
                {{ statusText(item.status) }}
              </el-tag>
            </span>
            <span class="request-item__merchant">{{ item.merchantId }}</span>
            <span class="request-item__meta">
              <span>{{ item.changedFields.length }} {{ t('merchant.info.changedFieldUnit') }}</span>
              <BaseDateTime :value="item.submittedAt || item.gmtCreate" />
            </span>
          </button>
          <el-empty
            v-if="!listLoading && requests.length === 0"
            :description="t('merchant.info.noChangeRequests')"
            :image-size="72"
          />
        </div>

        <el-pagination
          v-if="total > pageSize"
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          small
          @current-change="loadRequests"
        />
      </aside>

      <main v-loading="detailLoading" class="review-canvas">
        <el-empty
          v-if="!detailLoading && !detail"
          :description="t('merchant.info.selectChangeRequest')"
        />
        <template v-else-if="detail">
          <header class="change-header">
            <div>
              <span class="change-header__eyebrow">{{ detail.requestNo }}</span>
              <h3>{{ detail.merchantName || detail.merchantId }}</h3>
              <p>{{ detail.merchantId }}</p>
            </div>
            <div class="change-header__summary">
              <el-tag :type="statusType(detail.status)" effect="dark">
                {{ statusText(detail.status) }}
              </el-tag>
              <span>
                {{ t('merchant.info.submittedAt') }}
                <strong><BaseDateTime :value="detail.submittedAt" /></strong>
              </span>
              <span>
                {{ t('merchant.info.changedFields') }}
                <strong>{{ detail.changedFields.length }}</strong>
              </span>
            </div>
          </header>

          <el-alert
            v-if="detail.submitComment"
            class="submit-comment"
            type="info"
            :closable="false"
            :title="t('merchant.info.submitComment')"
          >
            {{ detail.submitComment }}
          </el-alert>

          <section class="review-section">
            <div class="review-section__title">
              <div>
                <h4>{{ t('merchant.info.fieldComparison') }}</h4>
                <p>{{ t('merchant.info.fieldComparisonHint') }}</p>
              </div>
              <el-tag type="warning" effect="plain">
                {{ detail.changedFields.length }} {{ t('merchant.info.changedFieldUnit') }}
              </el-tag>
            </div>

            <div class="diff-table">
              <div class="diff-row diff-row--header">
                <span>{{ t('merchant.info.fieldName') }}</span>
                <span>{{ t('merchant.info.currentValue') }}</span>
                <span>{{ t('merchant.info.proposedValue') }}</span>
              </div>
              <template v-for="group in changedGroups" :key="group.key">
                <div class="diff-group">{{ t(group.labelKey) }}</div>
                <div v-for="field in group.fields" :key="field.key" class="diff-row">
                  <span class="diff-row__label">{{ t(field.labelKey) }}</span>
                  <span class="diff-row__value is-current">
                    {{ displayValue(detail.currentProfile?.[field.key]) }}
                  </span>
                  <span class="diff-row__value is-proposed">
                    {{ displayValue(detail.proposedProfile?.[field.key]) }}
                  </span>
                </div>
              </template>
              <div v-if="scalarChangedFieldCount === 0" class="diff-table__empty">
                {{ t('merchant.info.noScalarChanges') }}
              </div>
            </div>
          </section>

          <section v-if="relatedPersonsChanged" class="review-section">
            <div class="review-section__title">
              <div>
                <h4>{{ t('merchant.info.relatedPersonComparison') }}</h4>
                <p>{{ t('merchant.info.relatedPersonComparisonHint') }}</p>
              </div>
            </div>
            <div class="person-comparison">
              <div class="person-column">
                <h5>{{ t('merchant.info.currentValue') }}</h5>
                <RelatedPersonList :persons="detail.currentProfile?.relatedPersons || []" />
              </div>
              <div class="person-column is-proposed">
                <h5>{{ t('merchant.info.proposedValue') }}</h5>
                <RelatedPersonList :persons="detail.proposedProfile?.relatedPersons || []" />
              </div>
            </div>
          </section>

          <section class="review-section">
            <div class="review-section__title">
              <div>
                <h4>{{ t('merchant.info.changeDocuments') }}</h4>
                <p>{{ t('merchant.info.changeDocumentsHint') }}</p>
              </div>
              <span class="document-count">{{ detail.documents.length }}</span>
            </div>
            <el-table :data="detail.documents" size="small" row-key="id" empty-text="-">
              <el-table-column
                prop="documentType"
                :label="t('merchant.info.documentType')"
                min-width="150"
              />
              <el-table-column
                prop="originalFilename"
                :label="t('merchant.info.filename')"
                min-width="220"
                show-overflow-tooltip
              />
              <el-table-column :label="t('merchant.info.fileSize')" width="110" align="right">
                <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
              </el-table-column>
              <el-table-column :label="t('common.createTime')" width="180">
                <template #default="{ row }"><BaseDateTime :value="row.gmtCreate" /></template>
              </el-table-column>
              <el-table-column :label="t('common.operation')" width="100" align="center">
                <template #default="{ row }">
                  <el-button
                    type="primary"
                    link
                    :icon="Download"
                    :loading="downloadingId === row.id"
                    @click="downloadDocument(row)"
                  >
                    {{ t('common.download') }}
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <section
            v-if="detail.reviewedAt || detail.reviewComment"
            class="review-section review-record"
          >
            <div class="review-section__title">
              <div>
                <h4>{{ t('merchant.info.changeReviewRecord') }}</h4>
              </div>
            </div>
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item :label="t('merchant.info.reviewedBy')">
                {{ detail.reviewedBy || '-' }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.reviewedAt')">
                <BaseDateTime :value="detail.reviewedAt" />
              </el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.changeStatus')">
                {{ statusText(detail.status) }}
              </el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.reviewComment')" :span="3">
                {{ detail.reviewComment || '-' }}
              </el-descriptions-item>
            </el-descriptions>
          </section>
        </template>
      </main>
    </div>

    <template #footer>
      <div class="review-footer">
        <div v-if="canReviewSelected" class="review-footer__comment">
          <el-input
            v-model="reviewComment"
            :placeholder="t('merchant.info.changeReviewCommentPlaceholder')"
            maxlength="500"
            show-word-limit
            clearable
          />
        </div>
        <div class="review-footer__actions">
          <el-button @click="drawerVisible = false">{{ t('common.close') }}</el-button>
          <template v-if="canReviewSelected">
            <el-button
              type="danger"
              plain
              :icon="CircleClose"
              :loading="reviewing"
              @click="submitReview('REJECT')"
            >
              {{ t('merchant.info.reviewReject') }}
            </el-button>
            <el-button
              type="warning"
              plain
              :icon="DocumentAdd"
              :loading="reviewing"
              @click="submitReview('SUPPLEMENT')"
            >
              {{ t('merchant.info.reviewSupplement') }}
            </el-button>
            <el-button
              type="primary"
              :icon="CircleCheck"
              :loading="reviewing"
              @click="submitReview('PASS')"
            >
              {{ t('merchant.info.reviewPass') }}
            </el-button>
          </template>
        </div>
      </div>
    </template>
  </CommonDetailDrawer>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, reactive, ref, watch, type PropType } from 'vue';
  import { ElMessage, ElMessageBox } from 'element-plus';
  import {
    CircleCheck,
    CircleClose,
    DocumentAdd,
    Download,
    Refresh,
    Search,
  } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
  import {
    downloadMerchantDocument,
    getMerchantProfileChange,
    reviewMerchantProfileChange,
    searchMerchantProfileChanges,
    type MerchantDocument,
    type MerchantProfileChangeRequest,
    type MerchantProfileChangeSnapshot,
    type MerchantProfileChangeStatus,
    type MerchantRelatedPerson,
  } from '@/api/merchant/info';

  type ReviewDecision = 'PASS' | 'SUPPLEMENT' | 'REJECT';
  type SnapshotField = Exclude<
    keyof MerchantProfileChangeSnapshot,
    'relatedPersons' | 'capturedAt'
  >;

  interface FieldDefinition {
    key: SnapshotField;
    labelKey: string;
  }

  interface FieldGroup {
    key: string;
    labelKey: string;
    fields: FieldDefinition[];
  }

  const props = defineProps<{
    visible: boolean;
    canReview: boolean;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    reviewed: [request: MerchantProfileChangeRequest];
  }>();

  const { t } = useI18n();
  const requests = ref<MerchantProfileChangeRequest[]>([]);
  const detail = ref<MerchantProfileChangeRequest>();
  const selectedRequestNo = ref('');
  const listLoading = ref(false);
  const detailLoading = ref(false);
  const reviewing = ref(false);
  const downloadingId = ref('');
  const reviewComment = ref('');
  const page = ref(1);
  const pageSize = 20;
  const total = ref(0);
  const query = reactive<{ merchantId: string; status?: MerchantProfileChangeStatus }>({
    merchantId: '',
    status: 'PENDING_REVIEW',
  });

  const statusOptions: MerchantProfileChangeStatus[] = [
    'PENDING_REVIEW',
    'SUPPLEMENT_REQUIRED',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN',
    'DRAFT',
  ];

  const fieldGroups: FieldGroup[] = [
    {
      key: 'identity',
      labelKey: 'merchant.info.changeGroupIdentity',
      fields: [
        field('merchantName'),
        field('billingDescriptor'),
        field('merchantType'),
        field('countryCode'),
        field('operatingCountry'),
        field('businessType'),
        field('industryCategory'),
        field('merchantDescription'),
      ],
    },
    {
      key: 'kyb',
      labelKey: 'merchant.info.changeGroupKyb',
      fields: [
        field('registrationNumber'),
        field('legalEntityType'),
        field('incorporationDate'),
        field('incorporationCountry'),
        field('taxId'),
        field('companySize'),
        field('employeeCount'),
      ],
    },
    {
      key: 'address',
      labelKey: 'merchant.info.changeGroupAddress',
      fields: [
        field('registeredState'),
        field('registeredCity'),
        field('registeredPostcode'),
        field('registeredAddress'),
        field('operatingSameAsRegistered'),
        field('regionCode'),
        field('city'),
        field('addressLine', 'merchant.info.address'),
        field('postalCode'),
      ],
    },
    {
      key: 'business',
      labelKey: 'merchant.info.changeGroupBusiness',
      fields: [
        field('businessModel'),
        field('salesChannels'),
        field('productsServices'),
        field('targetMarkets'),
        field('customerType'),
        field('transactionCurrencies'),
        field('expectedMonthlyVolume'),
        field('expectedVolumeCurrency'),
        field('averageTicket'),
        field('maxTicket'),
        field('expectedMonthlyCount'),
        field('expectedRefundRate'),
        field('expectedChargebackRate'),
        field('recurringPaymentFlag'),
        field('presaleFlag'),
        field('fulfillmentDays'),
        field('digitalGoodsFlag'),
        field('restrictedBusinessFlag'),
        field('expectedGoLiveDate'),
      ],
    },
    {
      key: 'website',
      labelKey: 'merchant.info.changeGroupWebsite',
      fields: [
        field('websiteUrl'),
        field('appStoreUrl'),
        field('googlePlayUrl'),
        field('otherSalesUrl'),
        field('websiteLanguages'),
        field('websiteLiveFlag'),
        field('privacyPolicyUrl'),
        field('refundPolicyUrl'),
        field('termsUrl'),
        field('shippingPolicyUrl'),
      ],
    },
  ];

  const drawerVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value),
  });
  const changedFieldSet = computed(() => new Set(detail.value?.changedFields || []));
  const changedGroups = computed(() =>
    fieldGroups
      .map((group) => ({
        ...group,
        fields: group.fields.filter((item) => changedFieldSet.value.has(item.key)),
      }))
      .filter((group) => group.fields.length > 0),
  );
  const scalarChangedFieldCount = computed(() =>
    changedGroups.value.reduce((totalCount, group) => totalCount + group.fields.length, 0),
  );
  const relatedPersonsChanged = computed(() => changedFieldSet.value.has('relatedPersons'));
  const canReviewSelected = computed(
    () => props.canReview && detail.value?.status === 'PENDING_REVIEW',
  );

  watch(
    () => props.visible,
    (visible) => {
      if (visible) void loadRequests();
    },
  );

  function field(key: SnapshotField, labelKey = `merchant.info.${key}`): FieldDefinition {
    return { key, labelKey };
  }

  async function loadRequests() {
    listLoading.value = true;
    try {
      const result = await searchMerchantProfileChanges({
        pageNo: page.value,
        pageSize,
        merchantId: query.merchantId.trim() || undefined,
        status: query.status,
      });
      requests.value = result.records;
      total.value = result.total;
      const selectedStillVisible = requests.value.some(
        (item) => item.requestNo === selectedRequestNo.value,
      );
      if (!selectedStillVisible) {
        const first = requests.value[0];
        selectedRequestNo.value = first?.requestNo || '';
        detail.value = undefined;
        if (first) await selectRequest(first.requestNo);
      }
    } catch (error: any) {
      requests.value = [];
      total.value = 0;
      ElMessage.error(error?.message || t('common.loadFailed'));
    } finally {
      listLoading.value = false;
    }
  }

  function handleSearch() {
    page.value = 1;
    void loadRequests();
  }

  async function selectRequest(requestNo: string) {
    selectedRequestNo.value = requestNo;
    detailLoading.value = true;
    reviewComment.value = '';
    try {
      detail.value = await getMerchantProfileChange(requestNo);
    } catch (error: any) {
      detail.value = undefined;
      ElMessage.error(error?.message || t('common.loadFailed'));
    } finally {
      detailLoading.value = false;
    }
  }

  async function submitReview(decision: ReviewDecision) {
    if (!detail.value || reviewing.value) return;
    const comment = reviewComment.value.trim();
    if (decision !== 'PASS' && !comment) {
      ElMessage.warning(t('merchant.info.reviewCommentRequired'));
      return;
    }
    try {
      await ElMessageBox.confirm(
        t('merchant.info.changeReviewConfirm', { action: decisionText(decision) }),
        t('common.operationConfirm'),
        { type: decision === 'PASS' ? 'success' : 'warning' },
      );
      reviewing.value = true;
      const result = await reviewMerchantProfileChange(detail.value.requestNo, {
        decision,
        comment: comment || undefined,
      });
      detail.value = result;
      reviewComment.value = '';
      ElMessage.success(t('merchant.info.changeReviewSuccess'));
      emit('reviewed', result);
      await loadRequests();
    } catch (error: any) {
      if (error !== 'cancel' && error !== 'close') {
        ElMessage.error(error?.message || t('common.operationFailed'));
      }
    } finally {
      reviewing.value = false;
    }
  }

  async function downloadDocument(document: MerchantDocument) {
    if (!detail.value?.merchantId) return;
    downloadingId.value = document.id;
    try {
      await downloadMerchantDocument(detail.value.merchantId, document);
    } catch (error: any) {
      ElMessage.error(error?.message || t('merchant.info.documentDownloadFailed'));
    } finally {
      downloadingId.value = '';
    }
  }

  function statusText(status: MerchantProfileChangeStatus) {
    return t(`merchant.info.changeStatusValue.${status}`);
  }

  function statusType(
    status: MerchantProfileChangeStatus,
  ): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING_REVIEW' || status === 'SUPPLEMENT_REQUIRED') return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'info';
  }

  function decisionText(decision: ReviewDecision) {
    if (decision === 'PASS') return t('merchant.info.reviewPass');
    if (decision === 'SUPPLEMENT') return t('merchant.info.reviewSupplement');
    return t('merchant.info.reviewReject');
  }

  function displayValue(value: unknown) {
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return t(value ? 'common.yes' : 'common.no');
    if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
    return String(value);
  }

  function formatFileSize(size?: number) {
    if (!size || size <= 0) return '-';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KiB`;
    return `${(size / 1024 / 1024).toFixed(1)} MiB`;
  }

  const RelatedPersonList = defineComponent({
    name: 'RelatedPersonList',
    props: {
      persons: {
        type: Array as PropType<MerchantRelatedPerson[]>,
        required: true,
      },
    },
    setup(componentProps) {
      return () =>
        componentProps.persons.length
          ? h(
              'div',
              { class: 'person-list' },
              componentProps.persons.map((person, index) =>
                h(
                  'div',
                  { class: 'person-record', key: person.id || `${person.fullName}-${index}` },
                  [
                    h('div', { class: 'person-record__heading' }, [
                      h('strong', person.fullName || '-'),
                      h('span', person.personRoles?.join(', ') || '-'),
                    ]),
                    h('dl', [
                      personDetail(t('merchant.info.nationality'), person.nationality),
                      personDetail(t('merchant.info.dateOfBirth'), person.dateOfBirth),
                      personDetail(t('merchant.info.residenceCountry'), person.residenceCountry),
                      personDetail(t('merchant.info.idType'), person.idType),
                      personDetail(t('merchant.info.idNumber'), person.idNumberMasked),
                      personDetail(
                        t('merchant.info.ownershipPercentage'),
                        person.ownershipPercentage == null
                          ? undefined
                          : `${person.ownershipPercentage}%`,
                      ),
                    ]),
                  ],
                ),
              ),
            )
          : h('div', { class: 'person-list__empty' }, t('merchant.info.noRelatedPersons'));
    },
  });

  function personDetail(label: string, value?: string) {
    return h('div', [h('dt', label), h('dd', value || '-')]);
  }
</script>

<style scoped>
  .review-workbench {
    display: grid;
    grid-template-columns: 320px minmax(0, 1fr);
    min-height: calc(100vh - 190px);
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .request-rail {
    display: flex;
    min-width: 0;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
  }

  .request-rail__filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 128px;
    gap: 8px;
    padding: 14px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .request-rail__heading {
    display: flex;
    min-height: 44px;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 600;
  }

  .request-list {
    min-height: 260px;
    flex: 1;
    overflow: auto;
  }

  .request-item {
    display: flex;
    width: 100%;
    min-height: 104px;
    flex-direction: column;
    gap: 7px;
    padding: 14px 16px;
    border: 0;
    border-top: 1px solid var(--el-border-color-lighter);
    border-left: 3px solid transparent;
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }

  .request-item:hover,
  .request-item:focus-visible {
    background: var(--el-color-primary-light-9);
    outline: none;
  }

  .request-item.is-active {
    border-left-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  .request-item__topline,
  .request-item__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .request-item__topline strong {
    min-width: 0;
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .request-item__merchant {
    color: var(--el-text-color-regular);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .request-item__meta {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .request-rail :deep(.el-pagination) {
    justify-content: center;
    padding: 12px 8px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .review-canvas {
    min-width: 0;
    padding: 24px 28px 36px;
    background: var(--el-bg-color);
  }

  .change-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .change-header__eyebrow {
    color: var(--el-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    font-weight: 600;
  }

  .change-header h3 {
    margin: 6px 0 4px;
    color: var(--el-text-color-primary);
    font-size: 22px;
    line-height: 30px;
  }

  .change-header p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
  }

  .change-header__summary {
    display: flex;
    align-items: center;
    gap: 18px;
  }

  .change-header__summary > span:not(.el-tag) {
    display: flex;
    flex-direction: column;
    gap: 3px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .change-header__summary strong {
    color: var(--el-text-color-primary);
    font-size: 13px;
    font-weight: 600;
  }

  .submit-comment {
    margin-top: 18px;
  }

  .review-section {
    margin-top: 26px;
  }

  .review-section__title {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .review-section__title h4 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 15px;
    line-height: 22px;
  }

  .review-section__title p {
    margin: 3px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 18px;
  }

  .diff-table {
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
  }

  .diff-row {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr);
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .diff-row:first-child {
    border-top: 0;
  }

  .diff-row > span {
    min-width: 0;
    padding: 11px 14px;
    overflow-wrap: anywhere;
  }

  .diff-row > span + span {
    border-left: 1px solid var(--el-border-color-lighter);
  }

  .diff-row--header {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
  }

  .diff-group {
    padding: 7px 14px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  .diff-row__label {
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 500;
  }

  .diff-row__value {
    color: var(--el-text-color-regular);
    font-size: 13px;
    line-height: 20px;
  }

  .diff-row__value.is-current {
    background: var(--el-fill-color-extra-light);
    color: var(--el-text-color-secondary);
  }

  .diff-row__value.is-proposed {
    background: var(--el-color-warning-light-9);
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  .diff-table__empty,
  .person-list__empty {
    padding: 30px;
    color: var(--el-text-color-secondary);
    text-align: center;
  }

  .person-comparison {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border: 1px solid var(--el-border-color-lighter);
  }

  .person-column {
    min-width: 0;
    padding: 14px;
    background: var(--el-fill-color-extra-light);
  }

  .person-column + .person-column {
    border-left: 1px solid var(--el-border-color-lighter);
  }

  .person-column.is-proposed {
    background: var(--el-color-warning-light-9);
  }

  .person-column h5 {
    margin: 0 0 10px;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  .person-column :deep(.person-list) {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .person-column :deep(.person-record) {
    padding: 12px;
    border: 1px solid var(--el-border-color-lighter);
    background: var(--el-bg-color);
  }

  .person-column :deep(.person-record__heading) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  .person-column :deep(.person-record__heading span) {
    color: var(--el-color-primary);
    font-size: 12px;
  }

  .person-column :deep(dl) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px 16px;
    margin: 0;
  }

  .person-column :deep(dl > div) {
    min-width: 0;
  }

  .person-column :deep(dt) {
    color: var(--el-text-color-secondary);
    font-size: 11px;
  }

  .person-column :deep(dd) {
    margin: 2px 0 0;
    overflow-wrap: anywhere;
    color: var(--el-text-color-regular);
    font-size: 12px;
  }

  .document-count {
    display: inline-flex;
    width: 26px;
    height: 26px;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--el-fill-color-light);
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
  }

  .review-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .review-footer__comment {
    min-width: 280px;
    max-width: 620px;
    flex: 1;
  }

  .review-footer__actions {
    display: flex;
    flex-shrink: 0;
    gap: 8px;
  }

  .review-footer__actions :deep(.el-button) {
    margin-left: 0;
  }

  @media (max-width: 980px) {
    .review-workbench {
      grid-template-columns: 260px minmax(0, 1fr);
    }

    .request-rail__filters {
      grid-template-columns: 1fr;
    }

    .change-header,
    .change-header__summary {
      flex-direction: column;
      align-items: flex-start;
    }

    .change-header__summary {
      gap: 8px;
    }

    .diff-row {
      grid-template-columns: 140px minmax(0, 1fr) minmax(0, 1fr);
    }
  }

  @media (max-width: 720px) {
    .review-workbench {
      display: block;
      border: 0;
    }

    .request-rail {
      max-height: 340px;
      border-right: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .review-canvas {
      padding: 20px 0 28px;
    }

    .diff-row {
      grid-template-columns: 108px minmax(0, 1fr) minmax(0, 1fr);
    }

    .diff-row > span {
      padding: 9px 8px;
      font-size: 12px;
    }

    .person-comparison {
      grid-template-columns: 1fr;
    }

    .person-column + .person-column {
      border-top: 1px solid var(--el-border-color-lighter);
      border-left: 0;
    }

    .review-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .review-footer__comment {
      width: 100%;
      min-width: 0;
      max-width: none;
    }

    .review-footer__actions {
      justify-content: flex-end;
      flex-wrap: wrap;
    }
  }
</style>
