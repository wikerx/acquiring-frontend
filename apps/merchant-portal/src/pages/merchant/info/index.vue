<template>
    <div class="page system-page merchant-profile-page">
        <header class="profile-header">
            <div class="profile-identity">
                <span class="profile-identity__mark"><el-icon><OfficeBuilding /></el-icon></span>
                <div class="profile-identity__copy">
                    <h2>{{ profile?.merchantShortName || profile?.merchantName || t('merchantInfo.title') }}</h2>
                    <p>{{ profile?.merchantId || '-' }} · {{ profile?.countryCode || '-' }}</p>
                </div>
                <el-tag v-if="profile" :type="merchantStatusType(profile.merchantStatus)" effect="plain">
                    {{ merchantStatusText(profile.merchantStatus) }}
                </el-tag>
            </div>
            <div class="profile-header__actions">
                <el-tag v-if="activeRequest" :type="requestStatusType(activeRequest.status)" effect="plain">
                    {{ requestStatusText(activeRequest.status) }}
                </el-tag>
                <el-tooltip :content="t('common.refresh')" placement="bottom">
                    <el-button circle :icon="Refresh" :loading="loading" :aria-label="t('common.refresh')" @click="loadAll" />
                </el-tooltip>
            </div>
        </header>

        <el-skeleton v-if="loading && !profile" :rows="10" animated />
        <el-empty v-else-if="!profile || !workspace" :description="t('merchantInfo.empty')" />

        <template v-else>
            <section class="profile-rail">
                <div class="profile-rail__progress">
                    <el-progress
                        type="dashboard"
                        :percentage="workspace.completenessPercent || 0"
                        :width="76"
                        :stroke-width="7"
                        color="#0d9488"
                    />
                    <div>
                        <strong>{{ t('merchantInfo.completeness') }}</strong>
                        <span>{{ completenessText }}</span>
                    </div>
                </div>
                <div class="profile-rail__facts">
                    <div><span>{{ t('merchantInfo.applicationStatus') }}</span><strong>{{ activeRequest ? requestStatusText(activeRequest.status) : t('merchantInfo.noActiveRequest') }}</strong></div>
                    <div><span>{{ t('merchantInfo.lastUpdated') }}</span><strong><BaseDateTime :value="activeRequest?.gmtModified || profile.gmtModified" /></strong></div>
                    <div><span>{{ t('merchantInfo.changedFieldCount') }}</span><strong>{{ activeRequest?.changedFields.length || 0 }}</strong></div>
                </div>
                <div class="profile-rail__actions" v-if="canEdit">
                    <el-button
                        v-if="canWithdraw"
                        :icon="Close"
                        :loading="withdrawing"
                        @click="withdrawRequest"
                    >{{ t('merchantInfo.withdraw') }}</el-button>
                    <el-button
                        v-if="canSaveRisk"
                        :icon="DocumentChecked"
                        :loading="savingDraft"
                        :disabled="!riskDirty"
                        @click="saveDraft"
                    >{{ t('merchantInfo.saveDraft') }}</el-button>
                    <el-button
                        v-if="canSubmit"
                        type="primary"
            :icon="Promotion"
                        :loading="submitting"
                        @click="submitRequest"
                    >{{ t('merchantInfo.submitReview') }}</el-button>
                </div>
            </section>

            <el-alert
                v-if="activeRequest?.status === 'SUPPLEMENT_REQUIRED'"
                class="profile-alert"
                type="warning"
                :closable="false"
                show-icon
                :title="t('merchantInfo.supplementNotice')"
                :description="activeRequest.reviewComment || t('merchantInfo.supplementFallback')"
            />
            <el-alert
                v-else-if="activeRequest?.status === 'PENDING_REVIEW'"
                class="profile-alert"
                type="info"
                :closable="false"
                show-icon
                :title="t('merchantInfo.pendingNotice')"
            />

            <section class="profile-workspace">
                <el-tabs v-model="activeTab" class="profile-tabs">
                    <el-tab-pane name="overview">
                        <template #label><span class="tab-label"><el-icon><Tickets /></el-icon>{{ t('merchantInfo.tabs.overview') }}</span></template>
                        <div class="tab-content">
                            <section class="profile-section profile-section--accent">
                                <div class="section-head">
                                    <div><h3>{{ t('merchantInfo.platformTitle') }}</h3><span>{{ t('merchantInfo.readOnly') }}</span></div>
                                    <el-icon><Lock /></el-icon>
                                </div>
                                <el-descriptions :column="descriptionColumns" border size="small">
                                    <el-descriptions-item :label="t('merchantInfo.merchantId')">{{ profile.merchantId }}</el-descriptions-item>
                                    <el-descriptions-item :label="t('merchantInfo.legalName')">{{ currentProfile.merchantName || '-' }}</el-descriptions-item>
                                    <el-descriptions-item label="MCC">{{ profile.merchantCategoryCode || '-' }}</el-descriptions-item>
                                    <el-descriptions-item :label="t('merchantInfo.country')">{{ profile.countryCode || '-' }}</el-descriptions-item>
                                    <el-descriptions-item :label="t('merchantInfo.settlementCurrency')">{{ profile.settlementCurrency || '-' }}</el-descriptions-item>
                                    <el-descriptions-item :label="t('merchantInfo.riskLevel')">{{ riskLevelText(profile.riskLevel) }}</el-descriptions-item>
                                </el-descriptions>
                            </section>

                            <el-form ref="quickFormRef" :model="quickForm" :rules="quickRules" label-position="top" class="profile-section">
                                <div class="section-head">
                                    <div><h3>{{ t('merchantInfo.quickTitle') }}</h3><span>{{ t('merchantInfo.quickHint') }}</span></div>
                                    <el-icon><EditPen /></el-icon>
                                </div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.shortName')" prop="merchantShortName"><el-input v-model="quickForm.merchantShortName" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.defaultLocale')" prop="defaultLocale">
                                        <el-select v-model="quickForm.defaultLocale"><el-option :label="t('merchantInfo.options.simplifiedChinese')" value="zh-CN" /><el-option :label="t('merchantInfo.options.english')" value="en-US" /></el-select>
                                    </el-form-item>
                                    <el-form-item :label="t('merchantInfo.timezone')" prop="timezone"><el-select v-model="quickForm.timezone" filterable allow-create><el-option v-for="item in timezoneOptions" :key="item" :label="item" :value="item" /></el-select></el-form-item>
                                </div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.contactName')" prop="contactName"><el-input v-model="quickForm.contactName" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactPosition')"><el-input v-model="quickForm.contactTitle" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactPhone')" prop="contactPhone"><el-input v-model="quickForm.contactPhone" maxlength="32" placeholder="+14085550100" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactEmail')" prop="contactEmail"><el-input v-model="quickForm.contactEmail" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.alternateEmail')" prop="alternateEmail"><el-input v-model="quickForm.alternateEmail" maxlength="128" /></el-form-item>
                                </div>
                                <div class="contact-band">
                                    <div class="form-grid form-grid--two">
                                        <el-form-item :label="t('merchantInfo.financeContactName')"><el-input v-model="quickForm.financeContactName" maxlength="128" /></el-form-item>
                                        <el-form-item :label="t('merchantInfo.financeContactEmail')" prop="financeContactEmail"><el-input v-model="quickForm.financeContactEmail" maxlength="128" /></el-form-item>
                                        <el-form-item :label="t('merchantInfo.technicalContactName')"><el-input v-model="quickForm.technicalContactName" maxlength="128" /></el-form-item>
                                        <el-form-item :label="t('merchantInfo.technicalContactEmail')" prop="technicalContactEmail"><el-input v-model="quickForm.technicalContactEmail" maxlength="128" /></el-form-item>
                                    </div>
                                </div>
                                <div class="section-actions" v-if="canEdit">
                                    <el-button :icon="RefreshLeft" :disabled="savingQuick || !quickDirty" @click="resetQuickForm">{{ t('common.reset') }}</el-button>
                                    <el-button type="primary" :icon="Check" :loading="savingQuick" :disabled="!quickDirty" @click="saveQuickProfile">{{ t('common.save') }}</el-button>
                                </div>
                            </el-form>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane name="corporate">
                        <template #label><span class="tab-label"><el-icon><OfficeBuilding /></el-icon>{{ t('merchantInfo.tabs.corporate') }}</span></template>
                        <el-form ref="riskFormRef" :model="riskForm" :rules="riskRules" label-position="top" :disabled="!canSaveRisk" class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.legalSection') }}</h3><span>{{ t('merchantInfo.reviewRequired') }}</span></div><el-icon><OfficeBuilding /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.legalName')" prop="merchantName"><el-input v-model="riskForm.merchantName" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.billingDescriptor')"><el-input v-model="riskForm.billingDescriptor" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.merchantType')" prop="merchantType"><el-select v-model="riskForm.merchantType"><el-option v-for="item in merchantTypeOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select></el-form-item>
                                    <el-form-item :label="t('merchantInfo.registrationNumber')"><el-input v-model="riskForm.registrationNumber" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.legalEntityType')"><el-input v-model="riskForm.legalEntityType" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.incorporationDate')"><el-date-picker v-model="riskForm.incorporationDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.country')" prop="countryCode"><el-input v-model="riskForm.countryCode" maxlength="3" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.incorporationCountry')"><el-input v-model="riskForm.incorporationCountry" maxlength="3" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.taxId')"><el-input v-model="riskForm.taxId" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.companySize')"><el-input v-model="riskForm.companySize" maxlength="32" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.employeeCount')"><el-input-number v-model="riskForm.employeeCount" :min="0" :max="1000000" controls-position="right" /></el-form-item>
                                </div>
                                <el-form-item :label="t('merchantInfo.merchantDescription')"><el-input v-model="riskForm.merchantDescription" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.registeredAddress') }}</h3></div><el-icon><Location /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.registeredState')"><el-input v-model="riskForm.registeredState" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.registeredCity')"><el-input v-model="riskForm.registeredCity" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.postalCode')"><el-input v-model="riskForm.registeredPostcode" /></el-form-item>
                                    <el-form-item class="form-grid__wide" :label="t('merchantInfo.registeredAddressLine')"><el-input v-model="riskForm.registeredAddress" maxlength="512" /></el-form-item>
                                </div>
                                <div class="switch-row"><span>{{ t('merchantInfo.sameOperatingAddress') }}</span><el-switch v-model="riskForm.operatingSameAsRegistered" /></div>
                                <div v-if="!riskForm.operatingSameAsRegistered" class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.operatingCountry')"><el-input v-model="riskForm.operatingCountry" maxlength="3" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.region')"><el-input v-model="riskForm.regionCode" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.city')"><el-input v-model="riskForm.city" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.postalCode')"><el-input v-model="riskForm.postalCode" /></el-form-item>
                                    <el-form-item class="form-grid__wide" :label="t('merchantInfo.address')"><el-input v-model="riskForm.addressLine" maxlength="255" /></el-form-item>
                                </div>
                            </section>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane name="business">
                        <template #label><span class="tab-label"><el-icon><Shop /></el-icon>{{ t('merchantInfo.tabs.business') }}</span></template>
                        <el-form :model="riskForm" label-position="top" :disabled="!canSaveRisk" class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.businessProfile') }}</h3><span>{{ t('merchantInfo.reviewRequired') }}</span></div><el-icon><Shop /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.businessType')"><el-input v-model="riskForm.businessType" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.industryCategory')"><el-input v-model="riskForm.industryCategory" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.businessModel')"><el-select v-model="riskForm.businessModel" allow-create filterable><el-option label="B2C" value="B2C" /><el-option label="B2B" value="B2B" /><el-option label="B2B2C" value="B2B2C" /></el-select></el-form-item>
                                    <el-form-item :label="t('merchantInfo.salesChannels')"><el-select v-model="riskForm.salesChannels" multiple allow-create filterable><el-option v-for="item in salesChannelOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select></el-form-item>
                                    <el-form-item :label="t('merchantInfo.targetMarkets')"><el-select v-model="riskForm.targetMarkets" multiple allow-create filterable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.customerType')"><el-input v-model="riskForm.customerType" maxlength="64" /></el-form-item>
                                    <el-form-item class="form-grid__wide" :label="t('merchantInfo.productsServices')"><el-input v-model="riskForm.productsServices" type="textarea" :rows="3" maxlength="1000" /></el-form-item>
                                </div>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.transactionProfile') }}</h3></div><el-icon><TrendCharts /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.transactionCurrencies')"><el-select v-model="riskForm.transactionCurrencies" multiple allow-create filterable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.monthlyVolume')"><el-input-number v-model="riskForm.expectedMonthlyVolume" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.volumeCurrency')"><el-input v-model="riskForm.expectedVolumeCurrency" maxlength="3" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.averageTicket')"><el-input-number v-model="riskForm.averageTicket" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.maxTicket')"><el-input-number v-model="riskForm.maxTicket" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.monthlyCount')"><el-input-number v-model="riskForm.expectedMonthlyCount" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.refundRate')"><el-input-number v-model="riskForm.expectedRefundRate" :min="0" :max="100" :precision="2" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.chargebackRate')"><el-input-number v-model="riskForm.expectedChargebackRate" :min="0" :max="100" :precision="2" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.fulfillmentDays')"><el-input-number v-model="riskForm.fulfillmentDays" :min="0" controls-position="right" /></el-form-item>
                                </div>
                                <div class="toggle-grid">
                                    <label><span>{{ t('merchantInfo.recurringPayments') }}</span><el-switch v-model="riskForm.recurringPaymentFlag" /></label>
                                    <label><span>{{ t('merchantInfo.presale') }}</span><el-switch v-model="riskForm.presaleFlag" /></label>
                                    <label><span>{{ t('merchantInfo.digitalGoods') }}</span><el-switch v-model="riskForm.digitalGoodsFlag" /></label>
                                    <label><span>{{ t('merchantInfo.restrictedBusiness') }}</span><el-switch v-model="riskForm.restrictedBusinessFlag" /></label>
                                </div>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.websiteProfile') }}</h3></div><el-icon><Link /></el-icon></div>
                                <div class="switch-row"><span>{{ t('merchantInfo.websiteLive') }}</span><el-switch v-model="riskForm.websiteLiveFlag" /></div>
                                <div class="form-grid form-grid--two">
                                    <el-form-item :label="t('merchantInfo.websiteUrl')"><el-input v-model="riskForm.websiteUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.otherSalesUrl')"><el-input v-model="riskForm.otherSalesUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.appStoreUrl')"><el-input v-model="riskForm.appStoreUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.googlePlayUrl')"><el-input v-model="riskForm.googlePlayUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.privacyPolicyUrl')"><el-input v-model="riskForm.privacyPolicyUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.refundPolicyUrl')"><el-input v-model="riskForm.refundPolicyUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.termsUrl')"><el-input v-model="riskForm.termsUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.shippingPolicyUrl')"><el-input v-model="riskForm.shippingPolicyUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.websiteLanguages')"><el-select v-model="riskForm.websiteLanguages" multiple allow-create filterable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.goLiveDate')"><el-date-picker v-model="riskForm.expectedGoLiveDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
                                </div>
                            </section>
                        </el-form>
                    </el-tab-pane>

                    <el-tab-pane name="people">
                        <template #label><span class="tab-label"><el-icon><User /></el-icon>{{ t('merchantInfo.tabs.people') }}</span></template>
                        <div class="tab-content">
                            <section class="profile-section">
                                <div class="section-head">
                                    <div><h3>{{ t('merchantInfo.relatedPersons') }}</h3><span>{{ t('merchantInfo.personHint') }}</span></div>
                                    <el-button v-if="canSaveRisk" type="primary" plain :icon="Plus" @click="addPerson">{{ t('merchantInfo.addPerson') }}</el-button>
                                </div>
                                <el-empty v-if="!riskForm.relatedPersons.length" :description="t('merchantInfo.noPersons')" />
                                <div v-else class="person-list">
                                    <article v-for="(person, index) in riskForm.relatedPersons" :key="person.id || index" class="person-card">
                                        <div class="person-card__head"><strong>{{ person.fullName || `${t('merchantInfo.person')} ${index + 1}` }}</strong><el-button v-if="canSaveRisk" circle text type="danger" :icon="Delete" :aria-label="t('common.delete')" @click="removePerson(index)" /></div>
                                        <div class="form-grid form-grid--three">
                                            <el-form-item :label="t('merchantInfo.fullName')"><el-input v-model="person.fullName" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personRoles')"><el-select v-model="person.personRoles" multiple :disabled="!canSaveRisk"><el-option v-for="item in personRoleOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select></el-form-item>
                                            <el-form-item :label="t('merchantInfo.ownership')"><el-input-number v-model="person.ownershipPercentage" :min="0" :max="100" :precision="2" :disabled="!canSaveRisk" controls-position="right" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.nationality')"><el-input v-model="person.nationality" maxlength="3" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.dateOfBirth')"><el-date-picker v-model="person.dateOfBirth" type="date" value-format="YYYY-MM-DD" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.residenceCountry')"><el-input v-model="person.residenceCountry" maxlength="3" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idType')"><el-select v-model="person.idType" :disabled="!canSaveRisk"><el-option label="Passport" value="PASSPORT" /><el-option label="National ID" value="NATIONAL_ID" /><el-option label="Driver License" value="DRIVER_LICENSE" /></el-select></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idNumber')"><el-input v-model="person.idNumber" :disabled="!canSaveRisk" :placeholder="person.idNumberMasked || t('merchantInfo.idNumberPlaceholder')" show-password /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idExpiryDate')"><el-date-picker v-model="person.idExpiryDate" type="date" value-format="YYYY-MM-DD" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personEmail')"><el-input v-model="person.email" :disabled="!canSaveRisk" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personPhone')"><el-input v-model="person.phone" :disabled="!canSaveRisk" placeholder="+14085550100" /></el-form-item>
                                            <el-form-item class="form-grid__wide" :label="t('merchantInfo.residentialAddress')"><el-input v-model="person.residentialAddress" :disabled="!canSaveRisk" /></el-form-item>
                                        </div>
                                        <div class="person-flags"><el-checkbox v-model="person.controllerFlag" :disabled="!canSaveRisk">{{ t('merchantInfo.controller') }}</el-checkbox><el-checkbox v-model="person.pepFlag" :disabled="!canSaveRisk">{{ t('merchantInfo.pep') }}</el-checkbox></div>
                                    </article>
                                </div>
                            </section>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane name="documents">
                        <template #label><span class="tab-label"><el-icon><Files /></el-icon>{{ t('merchantInfo.tabs.documents') }}</span></template>
                        <div class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.documents') }}</h3><span>{{ t('merchantInfo.documentHint') }}</span></div><el-icon><Files /></el-icon></div>
                                <div v-if="canSaveRisk" class="document-upload-bar">
                                    <el-select v-model="selectedDocumentType" :placeholder="t('merchantInfo.documentType')"><el-option v-for="item in documentTypeOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select>
                                    <el-upload :auto-upload="false" :show-file-list="false" accept=".pdf,.png,.jpg,.jpeg" :on-change="handleFileSelected">
                                        <el-button :icon="Upload" :loading="uploading">{{ t('merchantInfo.selectUpload') }}</el-button>
                                    </el-upload>
                                </div>
                                <el-table :data="workspace.documents" row-key="id" size="small" empty-text="-">
                                    <el-table-column prop="documentType" :label="t('merchantInfo.documentType')" min-width="160"><template #default="{ row }">{{ documentTypeText(row.documentType) }}</template></el-table-column>
                                    <el-table-column prop="originalFilename" :label="t('merchantInfo.fileName')" min-width="220" show-overflow-tooltip />
                                    <el-table-column :label="t('merchantInfo.fileSize')" width="110"><template #default="{ row }">{{ formatBytes(row.fileSize) }}</template></el-table-column>
                                    <el-table-column :label="t('merchantInfo.documentStatus')" width="130"><template #default="{ row }"><el-tag size="small" :type="row.documentStatus === 'ACTIVE' || row.documentStatus === 'UPLOADED' ? 'success' : 'warning'">{{ documentStatusText(row.documentStatus) }}</el-tag></template></el-table-column>
                                    <el-table-column :label="t('common.operation')" width="130" align="center">
                                        <template #default="{ row }"><div class="table-actions"><el-tooltip :content="t('common.download')"><el-button circle text :icon="Download" @click="downloadDocument(row)" /></el-tooltip><el-tooltip v-if="canDeleteDocument(row)" :content="t('common.delete')"><el-button circle text type="danger" :icon="Delete" @click="deleteDocument(row)" /></el-tooltip></div></template>
                                    </el-table-column>
                                </el-table>
                            </section>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane name="history">
                        <template #label><span class="tab-label"><el-icon><Clock /></el-icon>{{ t('merchantInfo.tabs.history') }}</span></template>
                        <div class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.changeHistory') }}</h3><span>{{ t('merchantInfo.historyHint') }}</span></div><el-icon><Clock /></el-icon></div>
                                <el-empty v-if="!workspace.requestHistory.length" :description="t('merchantInfo.noHistory')" />
                                <el-timeline v-else>
                                    <el-timeline-item v-for="item in workspace.requestHistory" :key="item.requestNo" :timestamp="item.gmtModified || item.gmtCreate" placement="top" :type="timelineType(item.status)">
                                        <div class="history-item"><div><strong>{{ item.requestNo }}</strong><el-tag size="small" :type="requestStatusType(item.status)" effect="plain">{{ requestStatusText(item.status) }}</el-tag></div><p>{{ changedFieldSummary(item.changedFields) }}</p><span v-if="item.reviewComment">{{ item.reviewComment }}</span></div>
                                    </el-timeline-item>
                                </el-timeline>
                            </section>
                        </div>
                    </el-tab-pane>
                </el-tabs>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus';
import {
    Check,
    Clock,
    Close,
    Delete,
    DocumentChecked,
    Download,
    EditPen,
    Files,
    Link,
    Location,
    Lock,
    OfficeBuilding,
    Plus,
    Refresh,
    RefreshLeft,
    Promotion,
    Shop,
    Tickets,
    TrendCharts,
    Upload,
    User,
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import {
    merchantInfoApi,
    type MerchantProfile,
    type MerchantProfileChangeRequest,
    type MerchantProfileDocument,
    type MerchantProfileSnapshot,
    type MerchantProfileUpdatePayload,
    type MerchantProfileWorkspace,
    type MerchantRelatedPerson,
} from '@/api/merchantInfoApi';
import { setLocale } from '@/i18n';
import { hasPermission } from '@/utils/permission';

const { t } = useI18n();
const profile = ref<MerchantProfile>();
const workspace = ref<MerchantProfileWorkspace>();
const quickFormRef = ref<FormInstance>();
const riskFormRef = ref<FormInstance>();
const activeTab = ref('overview');
const loading = ref(false);
const savingQuick = ref(false);
const savingDraft = ref(false);
const submitting = ref(false);
const withdrawing = ref(false);
const uploading = ref(false);
const descriptionColumns = ref(3);
const quickBaseline = ref('');
const riskBaseline = ref('');
const selectedDocumentType = ref('BUSINESS_LICENSE');
const canEdit = hasPermission('merchant:info:edit');

const timezoneOptions = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC'];
const merchantTypeOptions = [{ value: 'COMPANY', label: 'merchantInfo.options.company' }, { value: 'SOLE_TRADER', label: 'merchantInfo.options.soleTrader' }, { value: 'NON_PROFIT', label: 'merchantInfo.options.nonProfit' }];
const salesChannelOptions = [{ value: 'WEBSITE', label: 'merchantInfo.options.website' }, { value: 'APP', label: 'merchantInfo.options.app' }, { value: 'MARKETPLACE', label: 'merchantInfo.options.marketplace' }, { value: 'OFFLINE', label: 'merchantInfo.options.offline' }];
const personRoleOptions = [{ value: 'LEGAL_REPRESENTATIVE', label: 'merchantInfo.options.legalRepresentative' }, { value: 'DIRECTOR', label: 'merchantInfo.options.director' }, { value: 'UBO', label: 'merchantInfo.options.ubo' }, { value: 'AUTHORIZED_PERSON', label: 'merchantInfo.options.authorizedPerson' }];
const documentTypeOptions = [{ value: 'BUSINESS_LICENSE', label: 'merchantInfo.options.businessLicense' }, { value: 'INCORPORATION', label: 'merchantInfo.options.incorporation' }, { value: 'LEGAL_REP_ID', label: 'merchantInfo.options.legalRepId' }, { value: 'DIRECTOR_ID', label: 'merchantInfo.options.directorId' }, { value: 'UBO_ID', label: 'merchantInfo.options.uboId' }, { value: 'BANK_STATEMENT', label: 'merchantInfo.options.bankStatement' }];

const quickForm = reactive<MerchantProfileUpdatePayload>({ merchantShortName: '', contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', alternateEmail: '', financeContactName: '', financeContactEmail: '', technicalContactName: '', technicalContactEmail: '', defaultLocale: 'zh-CN', timezone: '' });
const riskForm = reactive<MerchantProfileSnapshot>(emptySnapshot());

const activeRequest = computed(() => workspace.value?.activeRequest);
const currentProfile = computed(() => workspace.value?.currentProfile || riskForm);
const canSaveRisk = computed(() => canEdit && (!activeRequest.value || ['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(activeRequest.value.status)));
const canSubmit = computed(() => canSaveRisk.value && !!activeRequest.value && !riskDirty.value);
const canWithdraw = computed(() => canEdit && !!activeRequest.value && ['DRAFT', 'PENDING_REVIEW', 'SUPPLEMENT_REQUIRED'].includes(activeRequest.value.status));
const quickDirty = computed(() => JSON.stringify(normalizedQuickForm()) !== quickBaseline.value);
const riskDirty = computed(() => JSON.stringify(normalizedRiskForm()) !== riskBaseline.value);
const completenessText = computed(() => workspace.value?.completenessIssues.length ? t('merchantInfo.completenessIssues', { count: workspace.value.completenessIssues.length }) : t('merchantInfo.completenessReady'));

const quickRules = computed<FormRules<MerchantProfileUpdatePayload>>(() => ({
    merchantShortName: [{ required: true, message: t('merchantInfo.shortNameRequired'), trigger: 'blur' }],
    contactEmail: [{ required: true, message: t('merchantInfo.emailRequired'), trigger: 'blur' }, { type: 'email', message: t('merchantInfo.emailInvalid'), trigger: 'blur' }],
    alternateEmail: [{ type: 'email', message: t('merchantInfo.emailInvalid'), trigger: 'blur' }],
    financeContactEmail: [{ type: 'email', message: t('merchantInfo.emailInvalid'), trigger: 'blur' }],
    technicalContactEmail: [{ type: 'email', message: t('merchantInfo.emailInvalid'), trigger: 'blur' }],
    contactPhone: [{ validator: validatePhone, trigger: 'blur' }],
    timezone: [{ required: true, message: t('merchantInfo.timezoneRequired'), trigger: 'change' }, { validator: validateTimezone, trigger: 'change' }],
}));
const riskRules = computed<FormRules<MerchantProfileSnapshot>>(() => ({
    merchantName: [{ required: true, message: t('merchantInfo.requiredField'), trigger: 'blur' }],
    merchantType: [{ required: true, message: t('merchantInfo.requiredField'), trigger: 'change' }],
    countryCode: [{ required: true, message: t('merchantInfo.requiredField'), trigger: 'blur' }],
}));

async function loadAll() {
    loading.value = true;
    try {
        const [latestProfile, latestWorkspace] = await Promise.all([merchantInfoApi.getProfile(), merchantInfoApi.getWorkspace()]);
        profile.value = latestProfile;
        workspace.value = latestWorkspace;
        applyQuickProfile(latestProfile);
        applyRiskProfile(latestWorkspace.activeRequest?.proposedProfile || latestWorkspace.currentProfile);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.loadFailed'));
    } finally {
        loading.value = false;
    }
}

async function saveQuickProfile() {
    const valid = await quickFormRef.value?.validate().catch(() => false);
    if (!valid || !quickDirty.value) return;
    savingQuick.value = true;
    try {
        const latest = await merchantInfoApi.updateProfile(normalizedQuickForm());
        profile.value = latest;
        applyQuickProfile(latest);
        setLocale(latest.defaultLocale);
        ElMessage.success(t('merchantInfo.saveSuccess'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.saveFailed'));
    } finally {
        savingQuick.value = false;
    }
}

async function saveDraft() {
    const valid = await riskFormRef.value?.validate().catch(() => false);
    if (!valid || !riskDirty.value) return;
    savingDraft.value = true;
    try {
        await merchantInfoApi.saveDraft(normalizedRiskForm());
        await loadAll();
        ElMessage.success(t('merchantInfo.draftSaved'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.draftSaveFailed'));
    } finally {
        savingDraft.value = false;
    }
}

async function submitRequest() {
    if (!activeRequest.value) return;
    if (workspace.value?.completenessIssues.length) {
        ElMessage.warning(t('merchantInfo.incompleteWarning', { count: workspace.value.completenessIssues.length }));
        return;
    }
    try {
        const { value } = await ElMessageBox.prompt(t('merchantInfo.submitPrompt'), t('merchantInfo.submitReview'), { inputType: 'textarea', inputPlaceholder: t('merchantInfo.submitCommentPlaceholder'), confirmButtonText: t('merchantInfo.submitReview'), cancelButtonText: t('common.cancel') });
        submitting.value = true;
        await merchantInfoApi.submitChangeRequest(activeRequest.value.requestNo, value?.trim() || undefined);
        await loadAll();
        ElMessage.success(t('merchantInfo.submitSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.submitFailed'));
    } finally {
        submitting.value = false;
    }
}

async function withdrawRequest() {
    if (!activeRequest.value) return;
    try {
        await ElMessageBox.confirm(t('merchantInfo.withdrawConfirm'), t('merchantInfo.withdraw'), { type: 'warning' });
        withdrawing.value = true;
        await merchantInfoApi.withdrawChangeRequest(activeRequest.value.requestNo);
        await loadAll();
        ElMessage.success(t('merchantInfo.withdrawSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.withdrawFailed'));
    } finally {
        withdrawing.value = false;
    }
}

async function handleFileSelected(uploadFile: UploadFile) {
    if (!uploadFile.raw || uploading.value) return;
    if (!activeRequest.value) {
        ElMessage.warning(t('merchantInfo.saveBeforeUpload'));
        return;
    }
    uploading.value = true;
    try {
        await merchantInfoApi.uploadDocument(activeRequest.value.requestNo, selectedDocumentType.value, uploadFile.raw);
        await loadAll();
        ElMessage.success(t('merchantInfo.uploadSuccess'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.uploadFailed'));
    } finally {
        uploading.value = false;
    }
}

async function downloadDocument(document: MerchantProfileDocument) {
    try {
        await merchantInfoApi.downloadDocument(document.requestNo || activeRequest.value?.requestNo || 'current', document);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.downloadFailed'));
    }
}

async function deleteDocument(document: MerchantProfileDocument) {
    if (!activeRequest.value) return;
    try {
        await ElMessageBox.confirm(t('merchantInfo.deleteDocumentConfirm'), t('common.delete'), { type: 'warning' });
        await merchantInfoApi.deleteDocument(activeRequest.value.requestNo, document.id);
        await loadAll();
        ElMessage.success(t('merchantInfo.deleteDocumentSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.deleteDocumentFailed'));
    }
}

function applyQuickProfile(value: MerchantProfile) {
    Object.assign(quickForm, { merchantShortName: value.merchantShortName || '', contactName: value.contactName || '', contactTitle: value.contactTitle || '', contactEmail: value.contactEmail || '', contactPhone: value.contactPhone || '', alternateEmail: value.alternateEmail || '', financeContactName: value.financeContactName || '', financeContactEmail: value.financeContactEmail || '', technicalContactName: value.technicalContactName || '', technicalContactEmail: value.technicalContactEmail || '', defaultLocale: value.defaultLocale || 'zh-CN', timezone: value.timezone || '' });
    quickBaseline.value = JSON.stringify(normalizedQuickForm());
    quickFormRef.value?.clearValidate();
}

function applyRiskProfile(value: MerchantProfileSnapshot) {
    Object.assign(riskForm, emptySnapshot(), JSON.parse(JSON.stringify(value || emptySnapshot())));
    riskForm.relatedPersons ||= [];
    riskForm.salesChannels ||= [];
    riskForm.targetMarkets ||= [];
    riskForm.transactionCurrencies ||= [];
    riskForm.websiteLanguages ||= [];
    riskBaseline.value = JSON.stringify(normalizedRiskForm());
    riskFormRef.value?.clearValidate();
}

function resetQuickForm() { if (profile.value) applyQuickProfile(profile.value); }
function addPerson() { riskForm.relatedPersons.push({ fullName: '', personRoles: [], controllerFlag: false, pepFlag: false }); }
function removePerson(index: number) { riskForm.relatedPersons.splice(index, 1); }
function canDeleteDocument(document: MerchantProfileDocument) { return canSaveRisk.value && !!activeRequest.value && document.requestNo === activeRequest.value.requestNo && document.documentStatus === 'PENDING_REVIEW'; }

function normalizedQuickForm(): MerchantProfileUpdatePayload {
    return { merchantShortName: quickForm.merchantShortName.trim(), contactName: trimToNull(quickForm.contactName), contactTitle: trimToNull(quickForm.contactTitle), contactEmail: quickForm.contactEmail.trim().toLowerCase(), contactPhone: trimToNull(quickForm.contactPhone), alternateEmail: lowerToNull(quickForm.alternateEmail), financeContactName: trimToNull(quickForm.financeContactName), financeContactEmail: lowerToNull(quickForm.financeContactEmail), technicalContactName: trimToNull(quickForm.technicalContactName), technicalContactEmail: lowerToNull(quickForm.technicalContactEmail), defaultLocale: quickForm.defaultLocale, timezone: quickForm.timezone.trim() };
}

function normalizedRiskForm(): MerchantProfileSnapshot {
    const value = JSON.parse(JSON.stringify(riskForm)) as MerchantProfileSnapshot;
    delete value.capturedAt;
    value.countryCode = value.countryCode?.trim().toUpperCase();
    value.operatingCountry = value.operatingCountry?.trim().toUpperCase();
    value.incorporationCountry = value.incorporationCountry?.trim().toUpperCase();
    value.expectedVolumeCurrency = value.expectedVolumeCurrency?.trim().toUpperCase();
    value.transactionCurrencies = (value.transactionCurrencies || []).map(item => item.trim().toUpperCase()).filter(Boolean);
    value.targetMarkets = (value.targetMarkets || []).map(item => item.trim().toUpperCase()).filter(Boolean);
    value.relatedPersons = (value.relatedPersons || []).map(normalizePerson);
    return value;
}

function normalizePerson(person: MerchantRelatedPerson): MerchantRelatedPerson {
    return { ...person, fullName: person.fullName?.trim(), personRoles: person.personRoles || [], nationality: person.nationality?.trim().toUpperCase(), residenceCountry: person.residenceCountry?.trim().toUpperCase(), email: person.email?.trim().toLowerCase(), phone: person.phone?.trim(), idNumber: person.idNumber?.trim() || undefined };
}

function emptySnapshot(): MerchantProfileSnapshot { return { merchantName: '', merchantType: 'COMPANY', countryCode: '', salesChannels: [], targetMarkets: [], transactionCurrencies: [], websiteLanguages: [], relatedPersons: [] }; }
function trimToNull(value?: string | null) { return value?.trim() || null; }
function lowerToNull(value?: string | null) { return value?.trim().toLowerCase() || null; }
function validatePhone(_rule: unknown, value: string, callback: (error?: Error) => void) { callback(!value || /^\+[1-9]\d{6,14}$/.test(value) ? undefined : new Error(t('merchantInfo.phoneInvalid'))); }
function validateTimezone(_rule: unknown, value: string, callback: (error?: Error) => void) { try { new Intl.DateTimeFormat('en-US', { timeZone: value }).format(); callback(); } catch { callback(new Error(t('merchantInfo.timezoneInvalid'))); } }
function merchantStatusText(status?: number) { return status === 1 ? t('merchantInfo.statusActive') : status === 2 ? t('merchantInfo.statusFrozen') : status === 3 ? t('merchantInfo.statusClosed') : t('merchantInfo.statusUnknown'); }
function merchantStatusType(status?: number) { return status === 1 ? 'success' : status === 2 ? 'warning' : 'info'; }
function riskLevelText(level?: number) { return level === 1 ? t('merchantInfo.riskLow') : level === 2 ? t('merchantInfo.riskNormal') : level === 3 ? t('merchantInfo.riskHigh') : '-'; }
function requestStatusText(status?: string) { return t(`merchantInfo.requestStatus.${status || 'NONE'}`); }
function requestStatusType(status?: string) { if (status === 'APPROVED') return 'success'; if (status === 'PENDING_REVIEW') return 'primary'; if (status === 'SUPPLEMENT_REQUIRED') return 'warning'; if (status === 'REJECTED') return 'danger'; return 'info'; }
function timelineType(status?: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'SUPPLEMENT_REQUIRED') return 'warning'; return 'primary'; }
function documentTypeText(type?: string) { const item = documentTypeOptions.find(option => option.value === type); return item ? t(item.label) : type || '-'; }
function documentStatusText(status?: string) { return t(`merchantInfo.documentStatusValue.${status || 'UNKNOWN'}`); }
function changedFieldSummary(fields: string[]) { if (!fields?.length) return t('merchantInfo.noChangedFields'); return fields.slice(0, 6).map(fieldLabel).join(' · ') + (fields.length > 6 ? ` +${fields.length - 6}` : ''); }
function fieldLabel(field: string) { const key = `merchantInfo.fields.${field}`; const translated = t(key); return translated === key ? field : translated; }
function formatBytes(size?: number) { if (!size) return '0 B'; if (size < 1024) return `${size} B`; if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`; return `${(size / 1024 / 1024).toFixed(1)} MB`; }
function syncColumns() { descriptionColumns.value = window.innerWidth <= 640 ? 1 : window.innerWidth <= 980 ? 2 : 3; }

onMounted(() => { syncColumns(); window.addEventListener('resize', syncColumns); void loadAll(); });
onBeforeUnmount(() => window.removeEventListener('resize', syncColumns));
</script>

<style scoped>
.merchant-profile-page { min-width: 0; }
.profile-header { min-height: 76px; margin-bottom: 14px; padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; box-shadow: var(--merchant-card-shadow-soft); }
.profile-identity, .profile-header__actions, .profile-rail__actions, .tab-label, .section-head, .person-card__head, .table-actions { display: flex; align-items: center; }
.profile-identity { min-width: 0; gap: 12px; }
.profile-identity__mark { width: 42px; height: 42px; flex: 0 0 42px; display: grid; place-items: center; border-radius: 6px; color: #075985; background: #e0f2fe; font-size: 21px; }
.profile-identity__copy { min-width: 0; }
.profile-identity__copy h2 { margin: 0; overflow: hidden; color: var(--merchant-ink); font-size: 19px; line-height: 1.35; letter-spacing: 0; text-overflow: ellipsis; white-space: nowrap; }
.profile-identity__copy p { margin: 3px 0 0; color: var(--merchant-muted); font-size: 12px; }
.profile-header__actions { gap: 10px; }
.profile-rail { margin-bottom: 14px; padding: 12px 16px; display: grid; grid-template-columns: minmax(210px, .75fr) minmax(360px, 1.5fr) auto; align-items: center; gap: 20px; border: 1px solid #cfe3e8; border-left: 3px solid var(--merchant-teal); border-radius: 6px; background: #fff; }
.profile-rail__progress { display: flex; align-items: center; gap: 12px; }
.profile-rail__progress strong, .profile-rail__progress span { display: block; }
.profile-rail__progress strong { color: var(--merchant-ink); font-size: 14px; }
.profile-rail__progress span { margin-top: 3px; color: var(--merchant-muted); font-size: 12px; }
.profile-rail__facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); border-left: 1px solid var(--merchant-border); }
.profile-rail__facts > div { min-width: 0; padding: 2px 16px; border-right: 1px solid var(--merchant-border); }
.profile-rail__facts span, .profile-rail__facts strong { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.profile-rail__facts span { color: var(--merchant-muted); font-size: 11px; }
.profile-rail__facts strong { margin-top: 6px; color: #334155; font-size: 13px; }
.profile-rail__actions { justify-content: flex-end; gap: 8px; flex-wrap: wrap; }
.profile-alert { margin-bottom: 14px; }
.profile-workspace { min-width: 0; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; box-shadow: var(--merchant-card-shadow-soft); }
.profile-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 18px; border-bottom: 1px solid var(--merchant-border); }
.profile-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.profile-tabs :deep(.el-tabs__item) { height: 48px; padding: 0 16px; }
.tab-label { gap: 7px; }
.tab-content { min-width: 0; padding: 18px; background: #f8fafc; }
.profile-section { min-width: 0; margin-bottom: 16px; padding: 18px; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; }
.profile-section:last-child { margin-bottom: 0; }
.profile-section--accent { border-top: 3px solid var(--merchant-teal); }
.section-head { min-height: 30px; margin-bottom: 16px; justify-content: space-between; gap: 12px; color: #0f766e; }
.section-head h3 { margin: 0; color: var(--merchant-ink); font-size: 15px; line-height: 1.4; letter-spacing: 0; }
.section-head span { display: block; margin-top: 2px; color: var(--merchant-muted); font-size: 12px; }
.form-grid { display: grid; gap: 0 18px; }
.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.form-grid--two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.form-grid__wide { grid-column: 1 / -1; }
.profile-section :deep(.el-select), .profile-section :deep(.el-date-editor), .profile-section :deep(.el-input-number) { width: 100%; }
.contact-band { margin-top: 2px; padding: 14px 14px 0; border: 1px solid #e4edf5; border-radius: 6px; background: #f8fafc; }
.section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; padding-top: 14px; border-top: 1px solid var(--merchant-border); }
.switch-row { min-height: 42px; margin-bottom: 16px; padding: 8px 12px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 1px solid #e4edf5; border-radius: 6px; background: #f8fafc; color: #334155; font-size: 13px; }
.toggle-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.toggle-grid label { min-height: 48px; padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #e4edf5; border-radius: 6px; color: #334155; background: #f8fafc; font-size: 13px; }
.person-list { display: grid; gap: 12px; }
.person-card { padding: 16px; border: 1px solid #dce7f2; border-left: 3px solid #1677ff; border-radius: 6px; background: #fff; }
.person-card__head { min-height: 32px; margin-bottom: 10px; justify-content: space-between; }
.person-card__head strong { color: var(--merchant-ink); font-size: 14px; }
.person-flags { display: flex; gap: 22px; }
.document-upload-bar { margin-bottom: 14px; padding: 12px; display: flex; align-items: center; gap: 10px; border: 1px solid #cfe3e8; border-radius: 6px; background: #f0fdfa; }
.document-upload-bar > .el-select { max-width: 260px; }
.table-actions { justify-content: center; gap: 4px; }
.history-item { padding: 12px 14px; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; }
.history-item > div { display: flex; align-items: center; gap: 10px; }
.history-item p { margin: 8px 0 0; color: #475569; font-size: 13px; }
.history-item > span { display: block; margin-top: 7px; color: var(--merchant-muted); font-size: 12px; }
@media (max-width: 1180px) { .profile-rail { grid-template-columns: minmax(200px, .8fr) minmax(320px, 1.4fr); } .profile-rail__actions { grid-column: 1 / -1; padding-top: 10px; border-top: 1px solid var(--merchant-border); } .toggle-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) { .profile-rail { grid-template-columns: 1fr; } .profile-rail__facts { border-left: 0; border-top: 1px solid var(--merchant-border); padding-top: 12px; } .profile-rail__actions { grid-column: auto; } .form-grid--three { grid-template-columns: repeat(2, minmax(0, 1fr)); } .profile-tabs :deep(.el-tabs__header) { overflow-x: auto; } }
@media (max-width: 640px) { .profile-header { align-items: flex-start; } .profile-identity { flex-wrap: wrap; } .profile-header__actions { flex-direction: column-reverse; align-items: flex-end; } .profile-rail__facts, .form-grid--three, .form-grid--two, .toggle-grid { grid-template-columns: minmax(0, 1fr); } .profile-rail__facts > div { padding: 8px 0; border-right: 0; border-bottom: 1px solid var(--merchant-border); } .profile-rail__actions, .section-actions, .document-upload-bar { align-items: stretch; flex-direction: column; } .tab-content { padding: 10px; } .profile-section { padding: 14px; } .document-upload-bar > .el-select { max-width: none; } }
</style>
