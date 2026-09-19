<!-- 商户完整资料详情：集中展示开户资料、审核轨迹、就绪问题和受控业务操作。 -->
<template>
  <CommonDetailDrawer
    v-model:visible="drawerVisible"
    :title="t('merchant.info.detailTitle')"
    size="full"
  >
    <div v-if="merchant" class="merchant-profile-detail">
      <section class="profile-header">
        <div class="profile-header__identity">
          <div class="profile-header__mark"><Shop /></div>
          <div class="profile-header__copy">
            <div class="profile-header__number">
              {{ t('merchant.info.merchantId') }} {{ merchant.merchantId }}
            </div>
            <div class="profile-header__title-row">
              <h3>{{ merchant.merchantName }}</h3>
              <el-tag :type="onboardingType(merchant.onboardingStatus)">{{
                lifecycleText('onboarding', merchant.onboardingStatus)
              }}</el-tag>
            </div>
            <div class="profile-header__metadata">
              <span>{{ merchant.countryCode || '-' }}</span>
              <span>MCC {{ merchant.merchantCategoryCode || '-' }}</span>
              <span>{{ merchant.settlementCurrency || '-' }}</span>
              <span>{{ merchant.timezone || '-' }}</span>
            </div>
            <div class="profile-header__state">
              <el-tag :type="reviewType(merchant.reviewStatus)" effect="plain">{{
                lifecycleText('review', merchant.reviewStatus)
              }}</el-tag>
              <el-tag :type="activationType(merchant.activationStatus)" effect="plain">{{
                lifecycleText('activation', merchant.activationStatus)
              }}</el-tag>
              <span
                >{{ t('merchant.info.applicationNo') }} {{ merchant.applicationNo || '-' }}</span
              >
            </div>
          </div>
        </div>
        <div class="profile-header__audit">
          <div>
            <span>{{ t('common.createTime') }}</span>
            <strong><BaseDateTime :value="merchant.gmtCreate" /></strong>
          </div>
          <div>
            <span>{{ t('common.updateTime') }}</span>
            <strong><BaseDateTime :value="merchant.gmtModified" /></strong>
          </div>
        </div>
        <div class="profile-header__actions">
          <el-button v-if="canEdit" type="primary" :icon="Edit" @click="emit('edit')">{{
            t('common.edit')
          }}</el-button>
          <el-button v-if="canViewFee" :icon="Money" @click="emit('configure-fee')">{{
            t('merchant.info.viewMerchantFee')
          }}</el-button>
          <el-button v-if="canBindChannel" :icon="Connection" @click="emit('bind-channel')">{{
            t('merchant.info.bindChannel')
          }}</el-button>
          <el-button v-if="canViewFund" :icon="Wallet" @click="emit('fund-account')">{{
            t('merchant.info.viewFundAccount')
          }}</el-button>
        </div>
      </section>

      <el-alert
        v-if="merchant.readinessIssues?.length"
        type="warning"
        :closable="false"
        :title="
          merchant.reviewStatus === 'PASSED'
            ? t('merchant.info.activationIssuesTitle')
            : t('merchant.info.submissionIssuesTitle')
        "
      >
        <div class="readiness-list">
          <el-tag
            v-for="item in merchant.readinessIssues"
            :key="item"
            type="warning"
            effect="plain"
            >{{ readinessIssueText(item, t) }}</el-tag
          >
        </div>
      </el-alert>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane :label="t('merchant.info.stepBasic')" name="basic">
          <div class="detail-grid">
            <DetailSection :title="t('merchant.info.basicInfo')" :icon="Grid">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="t('merchant.info.shortName')">{{
                  value(merchant.merchantShortName)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.billingDescriptor')">{{
                  value(merchant.billingDescriptor)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.merchantType')">{{
                  optionText('merchantType', merchant.merchantType)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.businessType')">{{
                  optionText('businessType', merchant.businessType)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.industryCategory')">{{
                  optionText('industry', merchant.industryCategory)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.defaultLocale')">{{
                  value(merchant.defaultLocale)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.riskLevel')"
                  ><el-tag :type="riskType(merchant.riskLevel)">{{
                    riskText(merchant.riskLevel)
                  }}</el-tag></el-descriptions-item
                >
                <el-descriptions-item :label="t('common.status')"
                  ><el-tag :type="statusType(merchant.merchantStatus)">{{
                    statusText(merchant.merchantStatus)
                  }}</el-tag></el-descriptions-item
                >
                <el-descriptions-item :label="t('merchant.info.merchantDescription')" :span="2">{{
                  value(merchant.merchantDescription)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
            <DetailSection :title="t('merchant.info.auditInfo')" :icon="Clock">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="t('merchant.info.onboardingSource')">{{
                  value(merchant.onboardingSource)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.createTime')"
                  ><BaseDateTime :value="merchant.gmtCreate"
                /></el-descriptions-item>
                <el-descriptions-item :label="t('common.updateTime')"
                  ><BaseDateTime :value="merchant.gmtModified"
                /></el-descriptions-item>
              </el-descriptions>
            </DetailSection>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('merchant.info.stepKyb')" name="kyb">
          <div class="detail-grid">
            <DetailSection :title="t('merchant.info.corporateRegistration')" :icon="OfficeBuilding">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="t('merchant.info.registrationNumber')">{{
                  value(merchant.registrationNumber)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.legalEntityType')">{{
                  value(merchant.legalEntityType)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.incorporationDate')">{{
                  value(merchant.incorporationDate)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.incorporationCountry')">{{
                  value(merchant.incorporationCountry)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.taxId')">{{
                  maskSensitive(merchant.taxId)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.companySize')">{{
                  optionText('companySize', merchant.companySize)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.employeeCount')">{{
                  value(merchant.employeeCount)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
            <DetailSection :title="t('merchant.info.addressInfo')" :icon="Location">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="t('merchant.info.registeredState')">{{
                  value(merchant.registeredState)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.registeredCity')">{{
                  value(merchant.registeredCity)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.registeredPostcode')">{{
                  value(merchant.registeredPostcode)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.operatingCountry')">{{
                  value(merchant.operatingCountry)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.registeredAddress')" :span="2">{{
                  value(merchant.registeredAddress)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.address')" :span="2">{{
                  value(merchant.addressLine)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('merchant.info.stepBusiness')" name="business">
          <div class="detail-grid">
            <DetailSection :title="t('merchant.info.transactionProfile')" :icon="TrendCharts">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="t('merchant.info.businessModel')">{{
                  value(merchant.businessModel)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.customerType')">{{
                  optionText('customerType', merchant.customerType)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.salesChannels')">{{
                  listValue(merchant.salesChannels, 'salesChannel')
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.targetMarkets')">{{
                  listValue(merchant.targetMarkets)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.transactionCurrencies')">{{
                  listValue(merchant.transactionCurrencies)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.expectedMonthlyVolume')">{{
                  amountValue(merchant.expectedMonthlyVolume, merchant.expectedVolumeCurrency)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.averageTicket')">{{
                  amountValue(merchant.averageTicket, merchant.expectedVolumeCurrency)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.maxTicket')">{{
                  amountValue(merchant.maxTicket, merchant.expectedVolumeCurrency)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.expectedMonthlyCount')">{{
                  value(merchant.expectedMonthlyCount)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.fulfillmentDays')">{{
                  dayValue(merchant.fulfillmentDays)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.expectedRefundRate')">{{
                  percentValue(merchant.expectedRefundRate)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.expectedChargebackRate')">{{
                  percentValue(merchant.expectedChargebackRate)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.productsServices')" :span="2">{{
                  value(merchant.productsServices)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
            <DetailSection :title="t('merchant.info.websiteAndSales')" :icon="Link">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="t('merchant.info.websiteLiveFlag')">{{
                  booleanValue(merchant.websiteLiveFlag)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.websiteUrl')">{{
                  value(merchant.websiteUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.appStoreUrl')">{{
                  value(merchant.appStoreUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.googlePlayUrl')">{{
                  value(merchant.googlePlayUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.otherSalesUrl')">{{
                  value(merchant.otherSalesUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.privacyPolicyUrl')">{{
                  value(merchant.privacyPolicyUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.refundPolicyUrl')">{{
                  value(merchant.refundPolicyUrl)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.termsUrl')">{{
                  value(merchant.termsUrl)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
          </div>
        </el-tab-pane>

        <el-tab-pane :label="t('merchant.info.stepContacts')" name="contacts">
          <DetailSection :title="t('merchant.info.contactInfo')" :icon="User">
            <el-descriptions :column="3" border size="small">
              <el-descriptions-item :label="t('merchant.info.contactName')">{{
                value(merchant.contactName)
              }}</el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.contactTitle')">{{
                value(merchant.contactTitle)
              }}</el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.contactPhone')">{{
                normalizeInternationalPhone(merchant.phoneCountryCode, merchant.contactPhone) || '-'
              }}</el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.contactEmail')">{{
                value(merchant.contactEmail)
              }}</el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.financeContactEmail')">{{
                value(merchant.financeContactEmail)
              }}</el-descriptions-item>
              <el-descriptions-item :label="t('merchant.info.technicalContactEmail')">{{
                value(merchant.technicalContactEmail)
              }}</el-descriptions-item>
            </el-descriptions>
          </DetailSection>
          <el-table :data="merchant.relatedPersons || []" row-key="id" size="small" border>
            <el-table-column prop="fullName" :label="t('merchant.info.fullName')" min-width="150" />
            <el-table-column :label="t('merchant.info.personRoles')" min-width="210"
              ><template #default="{ row }">{{
                listValue(row.personRoles, 'personRole')
              }}</template></el-table-column
            >
            <el-table-column
              prop="nationality"
              :label="t('merchant.info.nationality')"
              width="100"
              align="center"
            />
            <el-table-column
              prop="idNumberMasked"
              :label="t('merchant.info.idNumber')"
              min-width="150"
              align="center"
            />
            <el-table-column
              :label="t('merchant.info.ownershipPercentage')"
              width="120"
              align="center"
              ><template #default="{ row }">{{
                percentValue(row.ownershipPercentage)
              }}</template></el-table-column
            >
            <el-table-column :label="t('merchant.info.pepFlag')" width="90" align="center"
              ><template #default="{ row }">{{
                booleanValue(row.pepFlag)
              }}</template></el-table-column
            >
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="t('merchant.info.stepSettlement')" name="settlement">
          <div class="detail-grid">
            <DetailSection :title="t('merchant.info.settlementAndAccount')" :icon="Wallet">
              <el-descriptions :column="2" border size="small">
                <el-descriptions-item :label="t('merchant.info.settlementCurrency')">{{
                  value(merchant.settlementCurrency)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.fundAccountStatus')">{{
                  value(merchant.fundAccountStatus)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.fundAccountNo')">{{
                  value(merchant.fundAccountNo)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.currentFeeVersion')">{{
                  merchant.currentFeeVersionNo
                    ? `v${merchant.currentFeeVersionNo}`
                    : t('merchant.info.notConfigured')
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
            <DetailSection :title="t('merchant.info.operationalFoundation')" :icon="Connection">
              <el-descriptions :column="1" border size="small">
                <el-descriptions-item :label="t('merchant.info.loginInitialization')">{{
                  booleanValue(merchant.loginInitialized)
                }}</el-descriptions-item>
                <el-descriptions-item :label="t('merchant.info.activationStatus')">{{
                  lifecycleText('activation', merchant.activationStatus)
                }}</el-descriptions-item>
              </el-descriptions>
            </DetailSection>
          </div>
        </el-tab-pane>

        <el-tab-pane
          :label="`${t('merchant.info.stepDocuments')} (${merchant.documents?.length || 0})`"
          name="documents"
        >
          <div class="document-toolbar">
            <el-select v-model="selectedDocumentType" style="width: 260px" :disabled="!canEdit">
              <el-option
                v-for="item in documentTypeOptions"
                :key="item"
                :label="optionText('documentType', item)"
                :value="item"
              />
            </el-select>
            <el-upload
              v-if="canEdit"
              :auto-upload="false"
              :show-file-list="false"
              accept=".pdf,.jpg,.jpeg,.png"
              :on-change="handleDocumentSelected"
            >
              <el-button type="primary" :icon="Upload" :loading="documentBusyId === 'upload'">{{
                t('merchant.info.uploadDocument')
              }}</el-button>
            </el-upload>
          </div>
          <el-table :data="merchant.documents || []" row-key="id" size="small" border>
            <el-table-column :label="t('merchant.info.documentType')" min-width="180"
              ><template #default="{ row }">{{
                optionText('documentType', row.documentType)
              }}</template></el-table-column
            >
            <el-table-column
              prop="originalFilename"
              :label="t('merchant.info.filename')"
              min-width="240"
              show-overflow-tooltip
            />
            <el-table-column :label="t('merchant.info.fileSize')" width="110" align="center"
              ><template #default="{ row }">{{
                formatFileSize(row.fileSize)
              }}</template></el-table-column
            >
            <el-table-column :label="t('common.createTime')" min-width="170" align="center"
              ><template #default="{ row }"><BaseDateTime :value="row.gmtCreate" /></template
            ></el-table-column>
            <el-table-column :label="t('common.operation')" width="160" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  :icon="Download"
                  @click="emit('download-document', row)"
                  >{{ t('common.download') }}</el-button
                >
                <el-button
                  v-if="canEdit"
                  type="danger"
                  link
                  :icon="Delete"
                  :loading="documentBusyId === row.id"
                  @click="emit('delete-document', row)"
                  >{{ t('common.delete') }}</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane :label="t('merchant.info.reviewHistory')" name="review">
          <el-timeline v-if="merchant.reviewRecords?.length">
            <el-timeline-item
              v-for="record in merchant.reviewRecords"
              :key="record.id"
              :timestamp="record.gmtCreate"
              placement="top"
              :type="reviewRecordType(record.reviewAction)"
            >
              <div class="review-record">
                <strong>{{ lifecycleText('action', record.reviewAction) }}</strong>
                <span>{{ record.operatorName || 'system' }}</span>
                <p v-if="record.reviewComment">{{ record.reviewComment }}</p>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else :description="t('merchant.info.noReviewHistory')" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <div class="detail-footer">
        <el-button @click="drawerVisible = false">{{ t('common.close') }}</el-button>
        <div v-if="merchant" class="detail-footer__actions">
          <el-button
            v-if="canEdit && canSubmitReview"
            type="primary"
            :loading="actionLoading"
            @click="emit('submit-review')"
            >{{ t('merchant.info.submitReview') }}</el-button
          >
          <div
            v-if="canEdit && merchant.reviewStatus === 'PENDING'"
            class="detail-footer__review-actions"
          >
            <el-button type="primary" :icon="CircleCheck" @click="openReview('PASS')">{{
              t('merchant.info.reviewPass')
            }}</el-button>
            <el-button type="warning" plain :icon="DocumentAdd" @click="openReview('SUPPLEMENT')">{{
              t('merchant.info.reviewSupplement')
            }}</el-button>
            <el-button type="danger" plain :icon="CircleClose" @click="openReview('REJECT')">{{
              t('merchant.info.reviewReject')
            }}</el-button>
          </div>
          <el-button
            v-if="canShowActivation && merchant.activationReady"
            type="primary"
            :icon="VideoPlay"
            :loading="actionLoading"
            @click="emit('activate')"
            >{{ t('merchant.info.activateMerchant') }}</el-button
          >
          <el-tooltip
            v-else-if="canShowActivation"
            :content="t('merchant.info.activationBlocked')"
            placement="top"
          >
            <span class="detail-footer__activation-disabled">
              <el-button type="primary" :icon="VideoPlay" disabled>{{
                t('merchant.info.activateMerchant')
              }}</el-button>
            </span>
          </el-tooltip>
        </div>
      </div>
    </template>
  </CommonDetailDrawer>

  <el-dialog
    v-model="reviewVisible"
    :title="reviewDialogTitle"
    width="560px"
    append-to-body
    destroy-on-close
  >
    <el-form label-position="top" size="small">
      <el-form-item :label="t('merchant.info.reviewComment')" :required="reviewDecision !== 'PASS'">
        <el-input
          v-model.trim="reviewComment"
          type="textarea"
          :rows="5"
          maxlength="1000"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="reviewVisible = false">{{ t('common.cancel') }}</el-button>
      <el-button
        :type="
          reviewDecision === 'PASS' ? 'success' : reviewDecision === 'REJECT' ? 'danger' : 'warning'
        "
        :loading="actionLoading"
        @click="submitReviewDecision"
      >
        {{ reviewDialogTitle }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, ref, type Component, type PropType } from 'vue';
  import { ElMessage, type UploadFile } from 'element-plus';
  import {
    CircleCheck,
    CircleClose,
    Clock,
    Connection,
    Delete,
    DocumentAdd,
    Download,
    Edit,
    Grid,
    Link,
    Location,
    Money,
    OfficeBuilding,
    Shop,
    TrendCharts,
    Upload,
    User,
    VideoPlay,
    Wallet,
  } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
  import type { MerchantDocument, MerchantInfo, MerchantReviewRequest } from '@/api/merchant/info';
  import { normalizeInternationalPhone } from '../international-phone';
  import { readinessIssueText } from '../readiness-issue';

  const props = defineProps<{
    visible: boolean;
    merchant?: MerchantInfo;
    canEdit?: boolean;
    canActivate?: boolean;
    canViewFee?: boolean;
    canBindChannel?: boolean;
    canViewFund?: boolean;
    actionLoading?: boolean;
    documentBusyId?: string;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    edit: [];
    'configure-fee': [];
    'bind-channel': [];
    'fund-account': [];
    'submit-review': [];
    review: [request: MerchantReviewRequest];
    activate: [];
    'upload-document': [payload: { documentType: string; file: File }];
    'download-document': [document: MerchantDocument];
    'delete-document': [document: MerchantDocument];
  }>();

  const { t } = useI18n();
  const activeTab = ref('basic');
  const reviewVisible = ref(false);
  const reviewDecision = ref<MerchantReviewRequest['decision']>('PASS');
  const reviewComment = ref('');
  const selectedDocumentType = ref('BUSINESS_LICENSE');
  const documentTypeOptions = [
    'BUSINESS_LICENSE',
    'INCORPORATION',
    'COMPANY_EXTRACT',
    'LEGAL_REPRESENTATIVE_ID',
    'DIRECTOR_ID',
    'UBO_ID',
    'AUTHORIZED_SIGNER_ID',
    'ADDRESS_PROOF',
    'BANK_PROOF',
    'WEBSITE_SCREENSHOT',
    'BUSINESS_LICENSE_ADDITIONAL',
    'SHAREHOLDER_STRUCTURE',
    'FINANCIAL_STATEMENT',
    'PCI_DOCUMENT',
  ];

  const drawerVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
  });

  const canSubmitReview = computed(
    () =>
      props.merchant?.reviewSubmittable === true &&
      ['NOT_SUBMITTED', 'SUPPLEMENT'].includes(props.merchant.reviewStatus || ''),
  );
  const canShowActivation = computed(
    () =>
      props.canActivate === true &&
      props.merchant?.reviewStatus === 'PASSED' &&
      props.merchant?.activationStatus !== 'ACTIVE' &&
      props.merchant?.onboardingStatus !== 'ACTIVE',
  );
  const reviewDialogTitle = computed(() =>
    t(`merchant.info.reviewDecision.${reviewDecision.value}`),
  );

  function openReview(decision: MerchantReviewRequest['decision']) {
    reviewDecision.value = decision;
    reviewComment.value = '';
    reviewVisible.value = true;
  }

  function submitReviewDecision() {
    if (reviewDecision.value !== 'PASS' && !reviewComment.value) {
      ElMessage.error(t('merchant.info.reviewCommentRequired'));
      return;
    }
    emit('review', { decision: reviewDecision.value, comment: reviewComment.value || undefined });
    reviewVisible.value = false;
  }

  function value(input: unknown) {
    return input === undefined || input === null || input === '' ? '-' : String(input);
  }

  function booleanValue(input?: boolean) {
    if (input === undefined || input === null) return '-';
    return input ? t('common.yes') : t('common.no');
  }

  function listValue(items?: string[], group?: string) {
    if (!items?.length) return '-';
    return items.map((item) => (group ? optionText(group, item) : item)).join(', ');
  }

  function amountValue(amount?: number, currency?: string) {
    return amount === undefined || amount === null ? '-' : `${currency || ''} ${amount}`.trim();
  }

  function percentValue(input?: number) {
    return input === undefined || input === null ? '-' : `${input}%`;
  }

  function dayValue(input?: number) {
    return input === undefined || input === null
      ? '-'
      : t('merchant.info.dayCount', { count: input });
  }

  function maskSensitive(input?: string) {
    if (!input) return '-';
    if (input.length <= 4) return '****';
    return `${input.slice(0, 2)}****${input.slice(-2)}`;
  }

  function optionText(group: string, option?: string) {
    if (!option) return '-';
    const key = `merchant.info.options.${group}.${option}`;
    const translated = t(key);
    return translated === key ? option : translated;
  }

  function lifecycleText(group: string, status?: string) {
    if (!status) return '-';
    const key = `merchant.info.lifecycle.${group}.${status}`;
    const translated = t(key);
    return translated === key ? status : translated;
  }

  function onboardingType(status?: string) {
    if (status === 'ACTIVE') return 'success';
    if (status === 'REJECTED') return 'danger';
    if (status === 'PENDING_REVIEW' || status === 'SUPPLEMENT_REQUIRED') return 'warning';
    return 'primary';
  }

  function reviewType(status?: string) {
    if (status === 'PASSED') return 'success';
    if (status === 'REJECTED') return 'danger';
    if (status === 'PENDING' || status === 'SUPPLEMENT') return 'warning';
    return 'info';
  }

  function activationType(status?: string) {
    if (status === 'ACTIVE') return 'success';
    if (status === 'READY') return 'primary';
    return 'info';
  }

  function reviewRecordType(action?: string) {
    if (action === 'PASS' || action === 'ACTIVATE') return 'success';
    if (action === 'REJECT') return 'danger';
    if (action === 'SUPPLEMENT') return 'warning';
    return 'primary';
  }

  function statusText(status?: number) {
    return status === 1
      ? t('merchant.info.statusNormal')
      : status === 2
        ? t('merchant.info.statusFrozen')
        : t('merchant.info.statusClosed');
  }

  function statusType(status?: number) {
    return status === 1 ? 'success' : status === 2 ? 'warning' : 'info';
  }

  function riskText(level?: number) {
    return level === 1
      ? t('merchant.info.riskLow')
      : level === 3
        ? t('merchant.info.riskHigh')
        : t('merchant.info.riskNormal');
  }

  function riskType(level?: number) {
    return level === 1 ? 'success' : level === 3 ? 'danger' : 'warning';
  }

  function handleDocumentSelected(uploadFile: UploadFile) {
    const file = uploadFile.raw;
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      ElMessage.error(t('merchant.info.documentTooLarge'));
      return;
    }
    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      ElMessage.error(t('merchant.info.documentTypeInvalid'));
      return;
    }
    emit('upload-document', { documentType: selectedDocumentType.value, file });
  }

  function formatFileSize(size?: number) {
    if (!size) return '0 B';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  const DetailSection = defineComponent({
    props: {
      title: { type: String, required: true },
      icon: { type: Object as PropType<Component>, required: true },
      wide: { type: Boolean, default: false },
    },
    setup(componentProps, { slots }) {
      return () =>
        h(
          'section',
          { class: ['detail-section', { 'detail-section--wide': componentProps.wide }] },
          [
            h('header', { class: 'detail-section__header' }, [
              h('span', { class: 'detail-section__icon' }, [h(componentProps.icon)]),
              h('h4', componentProps.title),
            ]),
            slots.default?.(),
          ],
        );
    },
  });
</script>

<style scoped>
  .merchant-profile-detail {
    display: grid;
    min-width: 0;
    gap: 12px;
  }

  .profile-header {
    display: grid;
    grid-template-columns: minmax(420px, 1.4fr) minmax(260px, 0.6fr);
    gap: 16px 24px;
    padding: 17px 18px;
    border: 1px solid #cfddf0;
    border-radius: 6px;
    background: #f7faff;
    box-shadow: 0 3px 12px rgb(30 64 175 / 5%);
  }

  .profile-header__identity {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 16px;
  }

  .profile-header__copy {
    min-width: 0;
  }

  .profile-header__mark {
    display: grid;
    width: 64px;
    height: 64px;
    flex: 0 0 64px;
    place-items: center;
    border-radius: 6px;
    border: 1px solid #d6e4fb;
    color: #1769e0;
    background: #e7f0ff;
  }

  .profile-header__mark svg {
    width: 31px;
  }

  .profile-header__number {
    color: #65758d;
    font-size: 12px;
    font-weight: 600;
  }

  .profile-header__title-row {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
    margin: 4px 0 8px;
  }

  .profile-header h3 {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    color: #0f2552;
    font-size: 20px;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-header__title-row :deep(.el-tag),
  .profile-header__state :deep(.el-tag) {
    flex: 0 0 auto;
    border-radius: 3px;
    font-weight: 600;
  }

  .profile-header__metadata,
  .profile-header__state,
  .profile-header__actions,
  .readiness-list,
  .document-toolbar,
  .detail-footer,
  .detail-footer__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .profile-header__metadata span {
    padding: 2px 7px;
    border: 1px solid #dce6f5;
    border-radius: 3px;
    color: #3e506e;
    background: #fff;
    font-size: 11px;
    font-weight: 600;
  }

  .profile-header__state {
    margin-top: 8px;
  }

  .profile-header__state > span:last-child {
    color: #738199;
    font-size: 11px;
  }

  .profile-header__audit {
    display: grid;
    align-content: center;
    gap: 10px;
    padding-left: 20px;
    border-left: 1px solid #d9e3f0;
  }

  .profile-header__audit > div {
    display: grid;
    grid-template-columns: 74px minmax(0, 1fr);
    gap: 8px;
    align-items: center;
  }

  .profile-header__audit span {
    color: #7a879a;
    font-size: 12px;
  }

  .profile-header__audit strong {
    min-width: 0;
    color: #32425f;
    font-size: 12px;
    font-weight: 500;
  }

  .profile-header__actions {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    padding-top: 12px;
    border-top: 1px solid #d9e3f0;
  }

  .profile-header__actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
    min-width: 0;
    border-radius: 4px;
  }

  .profile-tabs {
    width: 100%;
    min-width: 0;
    padding: 0;
  }

  .profile-tabs :deep(.el-tabs__header) {
    margin: 0 0 12px;
    padding: 0 10px;
    border: 1px solid #d7e1ee;
    border-radius: 5px;
    background: #fff;
  }

  .profile-tabs :deep(.el-tabs__item) {
    height: 44px;
    padding: 0 17px;
    color: #53627a;
    font-size: 12px;
    font-weight: 600;
  }

  .profile-tabs :deep(.el-tabs__item.is-active) {
    color: #1769e0;
    font-weight: 700;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .merchant-profile-detail :deep(.detail-section) {
    min-width: 0;
    overflow: hidden;
    border: 1px solid #d7e1ee;
    border-radius: 6px;
    background: #fff;
  }

  .merchant-profile-detail :deep(.detail-section__header) {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 42px;
    padding: 0 11px;
    border-bottom: 1px solid #e2e8f1;
    background: #fbfcfe;
  }

  .merchant-profile-detail :deep(.detail-section__icon) {
    display: grid;
    width: 25px;
    height: 25px;
    flex: 0 0 25px;
    place-items: center;
    border-radius: 4px;
    border: 1px solid #d9e6fb;
    color: #1769e0;
    background: #eaf2ff;
  }

  .merchant-profile-detail :deep(.detail-section__icon svg) {
    width: 15px;
    height: 15px;
  }

  .merchant-profile-detail :deep(.detail-section h4) {
    margin: 0;
    color: #172d53;
    font-size: 14px;
    font-weight: 700;
  }

  .merchant-profile-detail :deep(.detail-section .el-descriptions__body) {
    padding: 8px 10px 10px;
  }

  .merchant-profile-detail :deep(.detail-section .el-descriptions__table) {
    border-collapse: collapse;
  }

  .merchant-profile-detail :deep(.detail-section .el-descriptions__label) {
    width: 118px;
    color: #738097;
    background: transparent;
    font-weight: 500;
  }

  .merchant-profile-detail :deep(.detail-section .el-descriptions__content) {
    color: #253754;
    font-weight: 500;
  }

  .merchant-profile-detail :deep(.detail-section .el-descriptions__cell) {
    padding: 6px 7px !important;
    border: 0 !important;
    border-bottom: 1px solid #eef2f7 !important;
    font-size: 12px;
  }

  .merchant-profile-detail
    :deep(.detail-section .el-descriptions__table tr:last-child .el-descriptions__cell) {
    border-bottom: 0 !important;
  }

  .document-toolbar {
    justify-content: flex-start;
    margin-bottom: 12px;
    padding: 11px 12px;
    border: 1px solid #d7e1ee;
    border-radius: 5px;
    background: #fff;
  }

  .readiness-list {
    padding-top: 8px;
  }

  .review-record {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 12px;
    padding: 10px 12px;
    border: 1px solid #dfe6f1;
    border-radius: 5px;
    background: #fff;
  }

  .review-record span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .review-record p {
    grid-column: 1 / -1;
    margin: 4px 0 0;
    color: var(--el-text-color-regular);
  }

  .detail-footer {
    justify-content: space-between;
  }

  .detail-footer__actions {
    justify-content: flex-end;
    gap: 10px;
  }

  .detail-footer__review-actions {
    display: grid;
    grid-template-columns: repeat(3, minmax(128px, 1fr));
    gap: 10px;
  }

  .detail-footer__review-actions :deep(.el-button) {
    width: 100%;
    margin-left: 0;
  }

  .detail-footer__activation-disabled {
    display: inline-flex;
  }

  .detail-footer__actions :deep(.el-button) {
    margin-left: 0;
    min-width: 104px;
    border-radius: 4px;
  }

  @media (max-width: 1100px) {
    .profile-header__actions {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 820px) {
    .profile-header,
    .detail-grid {
      grid-template-columns: 1fr;
    }

    .profile-header {
      gap: 14px;
      padding: 13px;
    }

    .profile-header__audit {
      padding-top: 12px;
      padding-left: 0;
      border-top: 1px solid #dce5f2;
      border-left: 0;
    }

    .profile-header h3 {
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .profile-header__title-row {
      align-items: flex-start;
      flex-direction: column;
      gap: 6px;
    }

    .profile-header__metadata {
      align-items: flex-start;
    }

    .profile-header__actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .profile-header__actions :deep(.el-button) {
      width: 100%;
    }

    .profile-tabs :deep(.el-descriptions__table),
    .profile-tabs :deep(.el-descriptions__body tbody) {
      display: block;
      width: 100%;
    }

    .profile-tabs :deep(.el-descriptions__table tr) {
      display: grid;
      grid-template-columns: minmax(96px, 36%) minmax(0, 1fr);
    }

    .profile-tabs :deep(.el-descriptions__cell) {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    .detail-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .detail-footer__actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    }

    .detail-footer__review-actions {
      grid-column: 1 / -1;
      grid-template-columns: 1fr;
    }

    .detail-footer__actions :deep(.el-button),
    .detail-footer__actions > span,
    .detail-footer__actions > span :deep(.el-button),
    .detail-footer__review-actions :deep(.el-button) {
      width: 100%;
    }

    .profile-tabs :deep(.el-tabs__nav-wrap) {
      overflow-x: auto;
    }

    .profile-tabs :deep(.el-tabs__header) {
      padding: 0 6px;
    }

    .document-toolbar {
      align-items: stretch;
      flex-direction: column;
    }

    .document-toolbar > *,
    .document-toolbar :deep(.el-upload),
    .document-toolbar :deep(.el-button) {
      width: 100% !important;
    }
  }
</style>
