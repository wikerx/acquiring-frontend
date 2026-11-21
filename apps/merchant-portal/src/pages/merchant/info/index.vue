<template>
    <div class="page system-page merchant-profile-page" :aria-busy="loading">
        <header class="profile-header">
            <div class="profile-identity">
                <span class="profile-identity__mark"><el-icon><OfficeBuilding /></el-icon></span>
                <div class="profile-identity__copy">
                    <h2>{{ profile?.merchantShortName || profile?.merchantName || t('merchantInfo.title') }}</h2>
                    <p>{{ profile?.merchantId || '-' }} · {{ countryLabel(profile?.countryCode) }}</p>
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
                    <el-button circle :icon="Refresh" :loading="loading" :aria-label="t('common.refresh')" :disabled="workspaceBusy" @click="refreshPage" />
                </el-tooltip>
            </div>
        </header>

        <el-skeleton v-if="loading && !profile" :rows="10" animated />
        <el-empty v-else-if="!profile || !workspace" :description="t('merchantInfo.loadFailed')">
            <el-button @click="loadAll">{{ t('merchantInfo.retry') }}</el-button>
        </el-empty>

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
                        <el-popover v-if="workspace.completenessIssues.length" v-model:visible="issuesOpen" trigger="click" :width="300">
                            <template #reference>
                                <el-button link type="primary">{{ t('merchantInfo.viewIssues') }}</el-button>
                            </template>
                            <ul class="profile-issues">
                                <li v-for="issue in workspace.completenessIssues" :key="issue">
                                    <button type="button" :disabled="!profileIssueTarget(issue)" @click="locateIssue(issue)">{{ issueText(issue) }}</button>
                                </li>
                            </ul>
                            <p v-if="riskDirty" class="profile-issues-note">{{ t('merchantInfo.issuesSavedBasis') }}</p>
                        </el-popover>
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
                        :icon="Close" :disabled="workspaceBusy"
                        :loading="withdrawing"
                        @click="withdrawRequest"
                    >{{ t('merchantInfo.withdraw') }}</el-button>
                    <el-button
                        v-if="canSaveRisk"
                        :icon="DocumentChecked"
                        :loading="savingDraft"
                        :disabled="!canSaveDraft"
                        @click="saveDraft"
                    >{{ t('merchantInfo.saveDraft') }}</el-button>
                    <el-button
                        v-if="canSubmit"
                        type="primary"
                        :icon="Promotion"
                        :disabled="workspaceBusy"
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

            <el-alert
                v-if="riskConflict"
                class="profile-alert"
                type="warning"
                :closable="false"
                :title="t('merchantInfo.editConflict')"
                show-icon
            />
            <el-alert v-if="workspaceStale" :closable="false" type="warning" class="profile-alert">
                <el-button link type="primary" :disabled="workspaceBusy || loading" @click="refreshWorkspace">
                    {{ t('merchantInfo.workspaceRefreshFailed') }} · {{ t('merchantInfo.retry') }}
                </el-button>
            </el-alert>
            <div v-if="countryState === 'error' || currencyState === 'error'" class="profile-dictionary-errors">
                <el-button v-if="countryState === 'error'" link type="danger" @click="loadCountries">{{ t('merchantInfo.retryCountries') }}</el-button>
                <el-button v-if="currencyState === 'error'" link type="danger" @click="loadCurrencies">{{ t('merchantInfo.retryCurrencies') }}</el-button>
            </div>
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
                                <dl class="form-grid form-grid--three profile-facts">
                                    <div><dt>{{ t('merchantInfo.merchantId') }}</dt><dd>{{ profile.merchantId }}</dd></div>
                                    <div><dt>{{ t('merchantInfo.legalName') }}</dt><dd>{{ currentProfile.merchantName || '-' }}</dd></div>
                                    <div><dt>MCC</dt><dd>{{ profile.merchantCategoryCode || '-' }}</dd></div>
                                    <div><dt>{{ t('merchantInfo.country') }}</dt><dd>{{ countryLabel(profile.countryCode) }}</dd></div>
                                    <div><dt>{{ t('merchantInfo.settlementCurrency') }}</dt><dd><CurrencyDisplay :currency="profile.settlementCurrency" :locale="String(locale)" size="xs" /></dd></div>
                                    <div><dt>{{ t('merchantInfo.riskLevel') }}</dt><dd>{{ riskLevelText(profile.riskLevel) }}</dd></div>
                                </dl>
                            </section>

                            <el-form ref="quickFormRef" :model="quickForm" :rules="quickRules" label-position="right" :disabled="!canEdit || savingQuick || loading" class="profile-section">
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
                                    <el-form-item :label="t('merchantInfo.contactName')" prop="contactName"><el-input v-model="quickForm.contactName" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactPosition')"><el-input v-model="quickForm.contactTitle" maxlength="64" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactPhone')" prop="contactPhone"><el-input v-model="quickForm.contactPhone" maxlength="32" placeholder="+14085550100" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.contactEmail')" prop="contactEmail"><el-input v-model="quickForm.contactEmail" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.alternateEmail')" prop="alternateEmail"><el-input v-model="quickForm.alternateEmail" maxlength="128" /></el-form-item>
                                </div>
                                <div class="contact-band">
                                    <div class="form-grid form-grid--three">
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
                        <el-form ref="riskFormRef" :model="riskForm" :rules="riskRules" label-position="right" :disabled="!canSaveRisk || workspaceBusy || loading" class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.legalSection') }}</h3><span>{{ t('merchantInfo.reviewRequired') }}</span></div><el-icon><OfficeBuilding /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item id="profile-field-merchantName" tabindex="-1" :label="t('merchantInfo.legalName')" prop="merchantName"><el-input v-model="riskForm.merchantName" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.billingDescriptor')"><el-input v-model="riskForm.billingDescriptor" maxlength="64" /></el-form-item>
                                    <el-form-item id="profile-field-merchantType" tabindex="-1" :label="t('merchantInfo.merchantType')" prop="merchantType"><el-select v-model="riskForm.merchantType"><el-option v-for="item in merchantTypeOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select></el-form-item>
                                    <el-form-item id="profile-field-registrationNumber" tabindex="-1" :label="t('merchantInfo.registrationNumber')"><el-input v-model="riskForm.registrationNumber" maxlength="128" /></el-form-item>
                                    <el-form-item id="profile-field-legalEntityType" tabindex="-1" :label="t('merchantInfo.legalEntityType')"><ProfileOptionSelect v-model="riskForm.legalEntityType" :options="classificationOptions.legalEntityType" clearable /></el-form-item>
                                    <el-form-item id="profile-field-incorporationDate" tabindex="-1" :label="t('merchantInfo.incorporationDate')"><el-date-picker v-model="riskForm.incorporationDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
                                    <el-form-item id="profile-field-countryCode" tabindex="-1" :label="t('merchantInfo.country')" prop="countryCode"><ProfileOptionSelect :model-value="riskForm.countryCode" @update:model-value="onCountryChange" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" /></el-form-item>
                                    <el-form-item id="profile-field-incorporationCountry" tabindex="-1" :label="t('merchantInfo.incorporationCountry')"><ProfileOptionSelect v-model="riskForm.incorporationCountry" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" clearable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.taxId')"><el-input v-model="riskForm.taxId" maxlength="128" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.companySize')"><ProfileOptionSelect v-model="riskForm.companySize" :options="classificationOptions.companySize" clearable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.employeeCount')"><el-input-number v-model="riskForm.employeeCount" :min="0" :max="1000000" controls-position="right" /></el-form-item>
                                    <el-form-item id="profile-field-merchantDescription" tabindex="-1" class="form-grid__wide" :label="t('merchantInfo.merchantDescription')"><el-input v-model="riskForm.merchantDescription" type="textarea" :rows="3" maxlength="1000" show-word-limit /></el-form-item>
                                </div>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.registeredAddress') }}</h3></div><el-icon><Location /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.registeredState')"><el-input v-model="riskForm.registeredState" /></el-form-item>
                                    <el-form-item id="profile-field-registeredCity" tabindex="-1" :label="t('merchantInfo.registeredCity')"><el-input v-model="riskForm.registeredCity" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.postalCode')"><el-input v-model="riskForm.registeredPostcode" /></el-form-item>
                                    <el-form-item id="profile-field-registeredAddress" tabindex="-1" class="form-grid__wide" :label="t('merchantInfo.registeredAddressLine')"><el-input v-model="riskForm.registeredAddress" maxlength="512" /></el-form-item>
                                </div>
                                <el-form-item class="switch-row" :label="t('merchantInfo.sameOperatingAddress')">
                                    <el-switch v-model="riskForm.operatingSameAsRegistered" :aria-label="t('merchantInfo.sameOperatingAddress')" @change="onSameAddressChange" />
                                </el-form-item>
                                <div v-if="riskForm.operatingSameAsRegistered" id="profile-operating-summary" tabindex="-1" class="profile-field">
                                    <span class="profile-field__label">{{ t('merchantInfo.operatingCountry') }}</span>
                                    <div class="profile-field__value">
                                        <span>{{ countryLabel(riskForm.operatingCountry) }}</span>
                                        <el-button v-if="canSaveRisk && riskForm.countryCode && riskForm.operatingCountry !== riskForm.countryCode"
                                            link type="primary" :disabled="workspaceBusy || loading" @click="syncOperatingCountry">
                                            {{ t('merchantInfo.syncOperatingCountry') }}
                                        </el-button>
                                    </div>
                                </div>
                                <div v-if="!riskForm.operatingSameAsRegistered" class="form-grid form-grid--three">
                                    <el-form-item id="profile-field-operatingCountry" tabindex="-1" :label="t('merchantInfo.operatingCountry')"><ProfileOptionSelect v-model="riskForm.operatingCountry" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" clearable /></el-form-item>
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
                        <el-form :model="riskForm" label-position="right" :disabled="!canSaveRisk || workspaceBusy || loading" class="tab-content">
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.businessProfile') }}</h3><span>{{ t('merchantInfo.reviewRequired') }}</span></div><el-icon><Shop /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.businessType')"><ProfileOptionSelect v-model="riskForm.businessType" :options="classificationOptions.businessType" clearable /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.industryCategory')">
                                        <ProfileOptionSelect v-model="riskForm.industryCategory" :options="classificationOptions.industry" clearable />
                                        <span class="profile-inline-hint">{{ t('merchantInfo.industryHint') }}</span>
                                    </el-form-item>
                                    <el-form-item id="profile-field-businessModel" tabindex="-1" :label="t('merchantInfo.businessModel')"><ProfileOptionSelect v-model="riskForm.businessModel" :options="classificationOptions.businessModel" allow-create /></el-form-item>
                                    <el-form-item id="profile-field-salesChannels" tabindex="-1" :label="t('merchantInfo.salesChannels')"><ProfileOptionSelect v-model="riskForm.salesChannels" :options="classificationOptions.salesChannel" allow-create clearable /></el-form-item>
                                    <el-form-item id="profile-field-targetMarkets" tabindex="-1" :label="t('merchantInfo.targetMarkets')"><ProfileOptionSelect v-model="riskForm.targetMarkets" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" clearable /></el-form-item>
                                    <el-form-item id="profile-field-customerType" tabindex="-1" :label="t('merchantInfo.customerType')"><ProfileOptionSelect v-model="riskForm.customerType" :options="classificationOptions.customerType" clearable /></el-form-item>
                                    <el-form-item id="profile-field-productsServices" tabindex="-1" class="form-grid__wide" :label="t('merchantInfo.productsServices')"><el-input v-model="riskForm.productsServices" type="textarea" :rows="3" maxlength="1000" /></el-form-item>
                                </div>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.transactionProfile') }}</h3></div><el-icon><TrendCharts /></el-icon></div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item id="profile-field-transactionCurrencies" tabindex="-1" :label="t('merchantInfo.transactionCurrencies')"><ProfileOptionSelect v-model="riskForm.transactionCurrencies" :options="currencyOptions" :loading="currencyState === 'loading'" :unavailable="currencyState !== 'ready'" clearable /></el-form-item>
                                    <el-form-item id="profile-field-expectedMonthlyVolume" tabindex="-1" :label="t('merchantInfo.monthlyVolume')"><el-input-number v-model="riskForm.expectedMonthlyVolume" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item id="profile-field-expectedVolumeCurrency" tabindex="-1" :label="t('merchantInfo.volumeCurrency')">
                                        <ProfileOptionSelect v-model="riskForm.expectedVolumeCurrency" :options="currencyOptions" :loading="currencyState === 'loading'" :unavailable="currencyState !== 'ready'" clearable />
                                        <span class="profile-inline-hint">{{ t('merchantInfo.volumeCurrencyHint') }}</span>
                                    </el-form-item>
                                    <el-form-item id="profile-field-averageTicket" tabindex="-1" :label="t('merchantInfo.averageTicket')"><el-input-number v-model="riskForm.averageTicket" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.maxTicket')"><el-input-number v-model="riskForm.maxTicket" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.monthlyCount')"><el-input-number v-model="riskForm.expectedMonthlyCount" :min="0" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.refundRate')"><el-input-number v-model="riskForm.expectedRefundRate" :min="0" :max="100" :precision="2" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.chargebackRate')"><el-input-number v-model="riskForm.expectedChargebackRate" :min="0" :max="100" :precision="2" controls-position="right" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.fulfillmentDays')"><el-input-number v-model="riskForm.fulfillmentDays" :min="0" controls-position="right" /></el-form-item>
                                </div>
                                <div class="form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.recurringPayments')"><el-switch v-model="riskForm.recurringPaymentFlag" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.presale')"><el-switch v-model="riskForm.presaleFlag" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.digitalGoods')"><el-switch v-model="riskForm.digitalGoodsFlag" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.restrictedBusiness')"><el-switch v-model="riskForm.restrictedBusinessFlag" /></el-form-item>
                                </div>
                            </section>
                            <section class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.websiteProfile') }}</h3></div><el-icon><Link /></el-icon></div>
                                <el-form-item id="profile-field-websiteLiveFlag" tabindex="-1" class="switch-row" :label="t('merchantInfo.websiteLive')">
                                    <el-switch v-model="riskForm.websiteLiveFlag" />
                                </el-form-item>
                                <div class="form-grid form-grid--three">
                                    <el-form-item id="profile-field-websiteUrl" tabindex="-1" :label="t('merchantInfo.websiteUrl')"><el-input v-model="riskForm.websiteUrl" /></el-form-item>
                                    <el-form-item id="profile-field-otherSalesUrl" tabindex="-1" :label="t('merchantInfo.otherSalesUrl')"><el-input v-model="riskForm.otherSalesUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.appStoreUrl')"><el-input v-model="riskForm.appStoreUrl" /></el-form-item>
                                    <el-form-item :label="t('merchantInfo.googlePlayUrl')"><el-input v-model="riskForm.googlePlayUrl" /></el-form-item>
                                    <el-form-item id="profile-field-privacyPolicyUrl" tabindex="-1" :label="t('merchantInfo.privacyPolicyUrl')"><el-input v-model="riskForm.privacyPolicyUrl" /></el-form-item>
                                    <el-form-item id="profile-field-refundPolicyUrl" tabindex="-1" :label="t('merchantInfo.refundPolicyUrl')"><el-input v-model="riskForm.refundPolicyUrl" /></el-form-item>
                                    <el-form-item id="profile-field-termsUrl" tabindex="-1" :label="t('merchantInfo.termsUrl')"><el-input v-model="riskForm.termsUrl" /></el-form-item>
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
                            <section id="profile-people" tabindex="-1" class="profile-section">
                                <div class="section-head">
                                    <div><h3>{{ t('merchantInfo.relatedPersons') }}</h3><span>{{ t('merchantInfo.personHint') }}</span></div>
                                    <el-button v-if="canSaveRisk" type="primary" plain :disabled="workspaceBusy || loading" :icon="Plus" @click="addPerson">{{ t('merchantInfo.addPerson') }}</el-button>
                                </div>
                                <el-empty v-if="!riskForm.relatedPersons.length" :description="t('merchantInfo.noPersons')" />
                                <el-form v-else :model="riskForm" label-position="right" :disabled="!canSaveRisk || workspaceBusy || loading" class="person-list">
                                    <article v-for="(person, index) in riskForm.relatedPersons" :key="personKey(person)" class="person-card">
                                        <div class="person-card__head"><strong>{{ person.fullName || `${t('merchantInfo.person')} ${index + 1}` }}</strong><el-button v-if="canSaveRisk" :disabled="workspaceBusy || loading" circle text type="danger" :icon="Delete" :aria-label="t('common.delete')" @click="removePerson(index)" /></div>
                                        <div class="form-grid form-grid--three">
                                            <el-form-item :label="t('merchantInfo.fullName')"><el-input v-model="person.fullName" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personRoles')"><el-select v-model="person.personRoles" multiple><el-option v-for="item in personRoleOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select></el-form-item>
                                            <el-form-item :label="t('merchantInfo.ownership')"><el-input-number v-model="person.ownershipPercentage" :min="0" :max="100" :precision="2" controls-position="right" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.nationality')"><ProfileOptionSelect v-model="person.nationality" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" clearable /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.dateOfBirth')"><el-date-picker v-model="person.dateOfBirth" type="date" value-format="YYYY-MM-DD" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.residenceCountry')"><ProfileOptionSelect v-model="person.residenceCountry" :options="countryOptions" :loading="countryState === 'loading'" :unavailable="countryState !== 'ready'" clearable /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idType')"><ProfileOptionSelect v-model="person.idType" :options="classificationOptions.idType" clearable /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idNumber')"><el-input v-model="person.idNumber" :placeholder="person.idNumberMasked || t('merchantInfo.idNumberPlaceholder')" show-password /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.idExpiryDate')"><el-date-picker v-model="person.idExpiryDate" type="date" value-format="YYYY-MM-DD" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personEmail')"><el-input v-model="person.email" /></el-form-item>
                                            <el-form-item :label="t('merchantInfo.personPhone')"><el-input v-model="person.phone" placeholder="+14085550100" /></el-form-item>
                                            <el-form-item class="form-grid__wide" :label="t('merchantInfo.residentialAddress')"><el-input v-model="person.residentialAddress" /></el-form-item>
                                        </div>
                                        <div class="person-flags"><el-checkbox v-model="person.controllerFlag">{{ t('merchantInfo.controller') }}</el-checkbox><el-checkbox v-model="person.pepFlag">{{ t('merchantInfo.pep') }}</el-checkbox></div>
                                    </article>
                                </el-form>
                            </section>
                        </div>
                    </el-tab-pane>

                    <el-tab-pane name="documents">
                        <template #label><span class="tab-label"><el-icon><Files /></el-icon>{{ t('merchantInfo.tabs.documents') }}</span></template>
                        <div class="tab-content">
                            <section id="profile-documents" tabindex="-1" class="profile-section">
                                <div class="section-head"><div><h3>{{ t('merchantInfo.documents') }}</h3><span>{{ t('merchantInfo.documentHint') }}</span></div><el-icon><Files /></el-icon></div>
                                <div v-if="canSaveRisk" class="document-upload-bar form-grid form-grid--three">
                                    <el-form-item :label="t('merchantInfo.documentType')">
                                        <el-select v-model="selectedDocumentType" :disabled="workspaceBusy || loading" :placeholder="t('merchantInfo.documentType')"><el-option v-for="item in documentTypeOptions" :key="item.value" :label="t(item.label)" :value="item.value" /></el-select>
                                    </el-form-item>
                                    <el-upload :disabled="workspaceBusy || loading" :auto-upload="false" :show-file-list="false" accept=".pdf,.png,.jpg,.jpeg" :on-change="handleFileSelected">
                                        <el-button :icon="Upload" :loading="uploading">{{ t('merchantInfo.selectUpload') }}</el-button>
                                    </el-upload>
                                </div>
                                <el-table v-if="workspace.documents.length" :data="workspace.documents" row-key="id" size="small">
                                    <el-table-column prop="documentType" :label="t('merchantInfo.documentType')" min-width="160"><template #default="{ row }">{{ documentTypeText(row.documentType) }}</template></el-table-column>
                                    <el-table-column prop="originalFilename" :label="t('merchantInfo.fileName')" min-width="220" show-overflow-tooltip />
                                    <el-table-column :label="t('merchantInfo.fileSize')" width="110"><template #default="{ row }">{{ formatBytes(row.fileSize) }}</template></el-table-column>
                                    <el-table-column :label="t('merchantInfo.documentStatus')" width="130"><template #default="{ row }"><el-tag size="small" :type="row.documentStatus === 'ACTIVE' || row.documentStatus === 'UPLOADED' ? 'success' : 'warning'">{{ documentStatusText(row.documentStatus) }}</el-tag></template></el-table-column>
                                    <el-table-column :label="t('common.operation')" width="130" align="center">
                                        <template #default="{ row }"><div class="table-actions"><el-tooltip :content="t('common.download')"><el-button circle text :aria-label="t('common.download')" :icon="Download" @click="downloadDocument(row)" /></el-tooltip><el-tooltip v-if="canDeleteDocument(row)" :content="t('common.delete')"><el-button circle text type="danger" :disabled="workspaceBusy || loading" :aria-label="t('common.delete')" :icon="Delete" @click="deleteDocument(row)" /></el-tooltip></div></template>
                                    </el-table-column>
                                </el-table>
                                <el-empty v-else :description="t('merchantInfo.noDocuments')" />
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
                                    <el-timeline-item v-for="item in workspace.requestHistory" :key="item.requestNo" placement="top" :type="timelineType(item.status)">
                                        <div class="history-item">
                                            <BaseDateTime class="history-time" :value="item.gmtModified || item.gmtCreate" />
                                            <div><strong>{{ item.requestNo }}</strong><el-tag size="small" :type="requestStatusType(item.status)" effect="plain">{{ requestStatusText(item.status) }}</el-tag></div><p>{{ changedFieldSummary(item.changedFields) }}</p><span v-if="item.reviewComment">{{ item.reviewComment }}</span></div>
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
import { MerchantMessageBox } from '@/utils/feedback';
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
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
import { CurrencyDisplay, merchantProfileOptions, type CurrencyPresentation } from '@acquiring/shared';
import { systemApi } from '@/api/systemApi';
import ProfileOptionSelect from './ProfileOptionSelect.vue';
import { profileIssueTarget } from './profileIssueTargets';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import {
    merchantInfoApi,
    type MerchantCountryOption,
    type MerchantProfile,
    type MerchantProfileDocument,
    type MerchantProfileSnapshot,
    type MerchantProfileUpdatePayload,
    type MerchantProfileWorkspace,
    type MerchantRelatedPerson,
} from '@/api/merchantInfoApi';
import { setLocale } from '@/i18n';
import { hasPermission } from '@/utils/permission';

const { locale, t } = useI18n();
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
const deletingDocument = ref(false);
const refreshingWorkspace = ref(false);
const workspaceStale = ref(false);
const riskConflict = ref(false);
const issuesOpen = ref(false);
const workspaceBusy = computed(() => savingDraft.value || submitting.value || withdrawing.value || uploading.value || deletingDocument.value || refreshingWorkspace.value);
const countryState = ref<'loading' | 'ready' | 'error'>('loading');
const currencyState = ref<'loading' | 'ready' | 'error'>('loading');
const countries = ref<MerchantCountryOption[]>([]);
const currencies = ref<CurrencyPresentation[]>([]);
const personKeys = new WeakMap<MerchantRelatedPerson, number>();
let personKeySequence = 0;
const quickBaseline = ref('');
const riskBaseline = ref<MerchantProfileSnapshot>(emptySnapshot());
const selectedDocumentType = ref('BUSINESS_LICENSE');
const canEdit = hasPermission('merchant:info:edit');

const timezoneOptions = ['Asia/Shanghai', 'Asia/Hong_Kong', 'Asia/Singapore', 'Asia/Tokyo', 'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'UTC'];
const merchantTypeOptions = [{ value: 'COMPANY', label: 'merchantInfo.options.company' }, { value: 'SOLE_TRADER', label: 'merchantInfo.options.soleTrader' }, { value: 'NON_PROFIT', label: 'merchantInfo.options.nonProfit' }];
const personRoleOptions = [{ value: 'LEGAL_REPRESENTATIVE', label: 'merchantInfo.options.legalRepresentative' }, { value: 'DIRECTOR', label: 'merchantInfo.options.director' }, { value: 'UBO', label: 'merchantInfo.options.ubo' }, { value: 'AUTHORIZED_PERSON', label: 'merchantInfo.options.authorizedPerson' }];
const documentTypeOptions = [{ value: 'BUSINESS_LICENSE', label: 'merchantInfo.options.businessLicense' }, { value: 'INCORPORATION', label: 'merchantInfo.options.incorporation' }, { value: 'LEGAL_REP_ID', label: 'merchantInfo.options.legalRepId' }, { value: 'DIRECTOR_ID', label: 'merchantInfo.options.directorId' }, { value: 'UBO_ID', label: 'merchantInfo.options.uboId' }, { value: 'BANK_STATEMENT', label: 'merchantInfo.options.bankStatement' }];

const quickForm = reactive<MerchantProfileUpdatePayload>({ merchantShortName: '', contactName: '', contactTitle: '', contactEmail: '', contactPhone: '', alternateEmail: '', financeContactName: '', financeContactEmail: '', technicalContactName: '', technicalContactEmail: '', defaultLocale: 'zh-CN', timezone: '' });
const riskForm = ref<MerchantProfileSnapshot>(emptySnapshot());

const activeRequest = computed(() => workspace.value?.activeRequest);
const currentProfile = computed(() => workspace.value?.currentProfile || riskForm.value);
const canSaveRisk = computed(() => canEdit && (!activeRequest.value || ['DRAFT', 'SUPPLEMENT_REQUIRED'].includes(activeRequest.value.status)));
const canSubmit = computed(() => canSaveRisk.value && !!activeRequest.value && !riskDirty.value && !riskConflict.value && !workspaceStale.value);
const canWithdraw = computed(() => canEdit && !!activeRequest.value && ['DRAFT', 'PENDING_REVIEW', 'SUPPLEMENT_REQUIRED'].includes(activeRequest.value.status));
const quickDirty = computed(() => JSON.stringify(normalizedQuickForm()) !== quickBaseline.value);
const riskDirty = computed(() => !sameSnapshot(riskForm.value, riskBaseline.value));
const canSaveDraft = computed(() => canSaveRisk.value && riskDirty.value && !workspaceBusy.value
    && !loading.value && !workspaceStale.value && !riskConflict.value);
const completenessText = computed(() => workspace.value?.completenessIssues.length ? t('merchantInfo.completenessIssues', { count: workspace.value.completenessIssues.length }) : t('merchantInfo.completenessReady'));

const english = computed(() => locale.value.toLowerCase().startsWith('en'));
const countryOptions = computed(() => countries.value.map((item) => {
    const name = english.value
        ? item.shortEnglishName || item.englishName || item.chineseName
        : item.chineseName || item.shortEnglishName || item.englishName;
    const flag = item.flagEmoji || countryFlag(item.alpha2Code);
    return {
        value: item.alpha3Code,
        label: [flag, item.alpha3Code + (name ? ` — ${name}` : '')].filter(Boolean).join(' '),
        search: [item.alpha2Code, item.chineseName, item.englishName, item.shortEnglishName].filter(Boolean).join(' '),
    };
}));
const currencyOptions = computed(() => currencies.value.map((item) => {
    const name = english.value ? item.englishName || item.chineseName : item.chineseName || item.englishName;
    return {
        value: item.alphabeticCode,
        label: name ? `${item.alphabeticCode} — ${name}` : item.alphabeticCode,
        search: [item.chineseName, item.englishName].filter(Boolean).join(' '),
    };
}));
const classificationOptions = computed(() => ({
    businessType: namedOptions('businessType'),
    industry: namedOptions('industry'),
    legalEntityType: namedOptions('legalEntityType'),
    companySize: namedOptions('companySize'),
    businessModel: namedOptions('businessModel'),
    customerType: namedOptions('customerType'),
    salesChannel: namedOptions('salesChannel'),
    idType: namedOptions('idType'),
}));

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
    countryCode: [{ required: true, message: t('merchantInfo.requiredField'), trigger: 'change' }],
}));

async function loadAll() {
    if (loading.value || workspaceBusy.value || savingQuick.value) return;
    loading.value = true;
    try {
        const [latestProfile, latestWorkspace] = await Promise.all([merchantInfoApi.getProfile(), merchantInfoApi.getWorkspace()]);
        profile.value = latestProfile;
        workspace.value = latestWorkspace;
        applyQuickProfile(latestProfile);
        applyRiskProfile(savedRiskProfile(latestWorkspace));
        workspaceStale.value = false;
        riskConflict.value = false;
    } catch (error: any) {
        if (workspace.value) workspaceStale.value = true;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.loadFailed'));
    } finally {
        loading.value = false;
    }
}

async function refreshPage() {
    if (loading.value || workspaceBusy.value || savingQuick.value) return;
    if (quickDirty.value || riskDirty.value) {
        try {
            await ElMessageBox.confirm(t('merchantInfo.refreshDiscard'), t('common.refresh'), { type: 'warning' });
        } catch {
            return;
        }
    }
    await loadAll();
}

async function loadCountries() {
    countryState.value = 'loading';
    try {
        countries.value = await merchantInfoApi.getCountryOptions();
        countryState.value = 'ready';
    } catch {
        countryState.value = 'error';
    }
}

async function loadCurrencies() {
    currencyState.value = 'loading';
    try {
        currencies.value = await systemApi.loadCurrencyPresentations();
        currencyState.value = 'ready';
    } catch {
        currencyState.value = 'error';
    }
}

function savedRiskProfile(value: MerchantProfileWorkspace) {
    return value.activeRequest?.proposedProfile || value.currentProfile;
}

async function refreshWorkspace() {
    if (refreshingWorkspace.value) return;
    refreshingWorkspace.value = true;
    try {
        const latest = await merchantInfoApi.getWorkspace();
        const previous = workspace.value?.activeRequest;
        const current = latest.activeRequest;
        const saved = prepareRiskProfile(savedRiskProfile(latest));
        if (riskDirty.value) {
            riskConflict.value ||= previous?.requestNo !== current?.requestNo
                || previous?.status !== current?.status
                || !sameSnapshot(saved, riskBaseline.value);
        } else {
            applyRiskProfile(saved);
        }
        workspace.value = latest;
        workspaceStale.value = false;
    } catch {
        workspaceStale.value = true;
        ElMessage.warning(t('merchantInfo.workspaceRefreshFailed'));
    } finally {
        refreshingWorkspace.value = false;
    }
}

function countryFlag(alpha2?: string | null) {
    if (!alpha2 || !/^[A-Z]{2}$/i.test(alpha2)) return '';
    return String.fromCodePoint(...Array.from(alpha2.toUpperCase(), (letter) => 127397 + letter.charCodeAt(0)));
}

function countryLabel(value?: string | null) {
    const code = value?.trim().toUpperCase();
    return countryOptions.value.find((option) => option.value === code)?.label || value || '-';
}

function namedOptions(group: keyof typeof merchantProfileOptions) {
    return merchantProfileOptions[group].map((value) => ({
        value,
        label: group === 'businessModel' ? value : t(`merchantInfo.classifications.${group}.${value}`),
    }));
}

function issueText(issue: string) {
    const target = profileIssueTarget(issue);
    if (target?.field) {
        const issueLabels: Record<string, string> = {
            merchantName: 'legalName',
            countryCode: 'country',
            registeredAddress: 'registeredAddressLine',
            expectedMonthlyVolume: 'monthlyVolume',
            expectedVolumeCurrency: 'volumeCurrency',
            websiteLiveFlag: 'websiteLive',
        };
        return t(`merchantInfo.${issueLabels[target.field] ?? target.field}`);
    }
    return t(target ? `merchantInfo.profileIssues.${issue}` : 'merchantInfo.unknownIssue');
}

async function locateIssue(issue: string) {
    const target = profileIssueTarget(issue);
    if (!target) return;
    issuesOpen.value = false;
    activeTab.value = target.tab;
    await nextTick();
    const id = target.field === 'operatingCountry' && riskForm.value.operatingSameAsRegistered
        ? 'profile-operating-summary'
        : target.field ? `profile-field-${target.field}` : `profile-${target.tab}`;
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ block: 'center' });
    element.focus({ preventScroll: true });
}

function syncOperatingCountry() {
    riskForm.value.operatingCountry = riskForm.value.countryCode;
}

function onSameAddressChange(value: string | number | boolean) {
    if (value === true && riskForm.value.countryCode) syncOperatingCountry();
}

function onCountryChange(value: string) {
    const { countryCode, operatingSameAsRegistered } = riskForm.value;
    if (countryCode === value) return;
    riskForm.value.countryCode = value;
    if (operatingSameAsRegistered) syncOperatingCountry();
}

function personKey(person: MerchantRelatedPerson) {
    if (person.id) return `saved-${person.id}`;
    if (!personKeys.has(person)) personKeys.set(person, ++personKeySequence);
    return `new-${personKeys.get(person)}`;
}

function capacityIssue(value: MerchantProfileSnapshot) {
    const fields = [['targetMarkets', 512], ['transactionCurrencies', 256]] as const;
    for (const [field, limit] of fields) {
        if (JSON.stringify(value[field]) !== JSON.stringify(riskBaseline.value[field])
            && Array.from(value[field].join(',')).length > limit) {
            return { field, limit };
        }
    }
    return undefined;
}

async function saveQuickProfile() {
    if (!canEdit || savingQuick.value || loading.value) return;
    if (!quickDirty.value) return;
    savingQuick.value = true;
    try {
        const valid = await quickFormRef.value?.validate().catch(() => false);
        if (!valid) return;
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
    if (!canSaveDraft.value) return;
    savingDraft.value = true;
    try {
        const valid = await riskFormRef.value?.validate().catch(() => false);
        if (!valid) return;
        const value = normalizedRiskForm();
        const issue = capacityIssue(value);
        if (issue) {
            ElMessage.warning(t('merchantInfo.listTooLong', { field: t(`merchantInfo.${issue.field}`), limit: issue.limit }));
            await locateIssue(issue.field === 'targetMarkets' ? 'TARGET_MARKETS' : 'TRANSACTION_CURRENCIES');
            return;
        }
        const saved = await merchantInfoApi.saveDraft(value);
        applyRiskProfile(saved.proposedProfile || value);
        if (workspace.value) workspace.value.activeRequest = saved;
        await refreshWorkspace();
        ElMessage.success(t('merchantInfo.draftSaved'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.draftSaveFailed'));
    } finally {
        savingDraft.value = false;
    }
}

async function submitRequest() {
    if (!canSubmit.value || workspaceBusy.value || loading.value || !activeRequest.value) return;
    if (workspace.value?.completenessIssues.length) {
        issuesOpen.value = true;
        ElMessage.warning(t('merchantInfo.incompleteWarning', { count: workspace.value.completenessIssues.length }));
        return;
    }
    submitting.value = true;
    try {
        const { value } = await MerchantMessageBox.prompt(t('merchantInfo.submitPrompt'), t('merchantInfo.submitReview'), { inputType: 'textarea', inputPlaceholder: t('merchantInfo.submitCommentPlaceholder'), confirmButtonText: t('merchantInfo.submitReview'), cancelButtonText: t('common.cancel') });
        const submitted = await merchantInfoApi.submitChangeRequest(activeRequest.value.requestNo, value?.trim() || undefined);
        if (workspace.value) workspace.value.activeRequest = submitted;
        await refreshWorkspace();
        ElMessage.success(t('merchantInfo.submitSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.submitFailed'));
    } finally {
        submitting.value = false;
    }
}

async function withdrawRequest() {
    if (!canWithdraw.value || workspaceBusy.value || loading.value || !activeRequest.value) return;
    withdrawing.value = true;
    try {
        await MerchantMessageBox.confirm(t('merchantInfo.withdrawConfirm'), t('merchantInfo.withdraw'), { type: 'warning' });
        await merchantInfoApi.withdrawChangeRequest(activeRequest.value.requestNo);
        await refreshWorkspace();
        ElMessage.success(t('merchantInfo.withdrawSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.withdrawFailed'));
    } finally {
        withdrawing.value = false;
    }
}

async function handleFileSelected(uploadFile: UploadFile) {
    if (!uploadFile.raw || !canSaveRisk.value || workspaceBusy.value || loading.value) return;
    if (!activeRequest.value) {
        ElMessage.warning(t('merchantInfo.saveBeforeUpload'));
        return;
    }
    uploading.value = true;
    try {
        const document = await merchantInfoApi.uploadDocument(activeRequest.value.requestNo, selectedDocumentType.value, uploadFile.raw);
        if (workspace.value) workspace.value.documents = [document, ...workspace.value.documents];
        await refreshWorkspace();
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
    if (!canDeleteDocument(document) || workspaceBusy.value || loading.value || !activeRequest.value) return;
    try {
        await MerchantMessageBox.confirm(t('merchantInfo.deleteDocumentConfirm'), t('common.delete'), { type: 'warning' });
        if (!activeRequest.value || workspaceBusy.value || !canDeleteDocument(document)) return;
        deletingDocument.value = true;
        await merchantInfoApi.deleteDocument(activeRequest.value.requestNo, document.id);
        if (workspace.value) workspace.value.documents = workspace.value.documents.filter((item) => item.id !== document.id);
        await refreshWorkspace();
        ElMessage.success(t('merchantInfo.deleteDocumentSuccess'));
    } catch (error: any) {
        if (error === 'cancel' || error === 'close') return;
        ElMessage.error(error?.friendlyMessage || error?.message || t('merchantInfo.deleteDocumentFailed'));
    } finally {
        deletingDocument.value = false;
    }
}

function applyQuickProfile(value: MerchantProfile) {
    Object.assign(quickForm, { merchantShortName: value.merchantShortName || '', contactName: value.contactName || '', contactTitle: value.contactTitle || '', contactEmail: value.contactEmail || '', contactPhone: value.contactPhone || '', alternateEmail: value.alternateEmail || '', financeContactName: value.financeContactName || '', financeContactEmail: value.financeContactEmail || '', technicalContactName: value.technicalContactName || '', technicalContactEmail: value.technicalContactEmail || '', defaultLocale: value.defaultLocale || 'zh-CN', timezone: value.timezone || '' });
    quickBaseline.value = JSON.stringify(normalizedQuickForm());
    quickFormRef.value?.clearValidate();
}

function prepareRiskProfile(value: MerchantProfileSnapshot) {
    const snapshot = { ...emptySnapshot(), ...JSON.parse(JSON.stringify(value)) } as MerchantProfileSnapshot;
    delete snapshot.capturedAt;
    snapshot.relatedPersons ||= [];
    snapshot.salesChannels ||= [];
    snapshot.targetMarkets ||= [];
    snapshot.transactionCurrencies ||= [];
    snapshot.websiteLanguages ||= [];
    return snapshot;
}

function applyRiskProfile(value: MerchantProfileSnapshot) {
    riskForm.value = prepareRiskProfile(value);
    riskBaseline.value = prepareRiskProfile(value);
    riskFormRef.value?.clearValidate();
}

function sameSnapshot(first: MerchantProfileSnapshot, second: MerchantProfileSnapshot) {
    const fields = new Set([...Object.keys(first), ...Object.keys(second)]) as Set<keyof MerchantProfileSnapshot>;
    return Array.from(fields).every((field) => JSON.stringify(first[field]) === JSON.stringify(second[field]));
}

function resetQuickForm() { if (profile.value) applyQuickProfile(profile.value); }
function addPerson() { riskForm.value.relatedPersons.push({ fullName: '', personRoles: [], controllerFlag: false, pepFlag: false }); }
function removePerson(index: number) { riskForm.value.relatedPersons.splice(index, 1); }
function canDeleteDocument(document: MerchantProfileDocument) { return canSaveRisk.value && !!activeRequest.value && document.requestNo === activeRequest.value.requestNo && document.documentStatus === 'PENDING_REVIEW'; }

function normalizedQuickForm(): MerchantProfileUpdatePayload {
    return { merchantShortName: quickForm.merchantShortName.trim(), contactName: trimToNull(quickForm.contactName), contactTitle: trimToNull(quickForm.contactTitle), contactEmail: quickForm.contactEmail.trim().toLowerCase(), contactPhone: trimToNull(quickForm.contactPhone), alternateEmail: lowerToNull(quickForm.alternateEmail), financeContactName: trimToNull(quickForm.financeContactName), financeContactEmail: lowerToNull(quickForm.financeContactEmail), technicalContactName: trimToNull(quickForm.technicalContactName), technicalContactEmail: lowerToNull(quickForm.technicalContactEmail), defaultLocale: quickForm.defaultLocale, timezone: quickForm.timezone.trim() };
}

function normalizedRiskForm(): MerchantProfileSnapshot {
    const value = prepareRiskProfile(riskForm.value);
    const previousPeople = new Map(riskBaseline.value.relatedPersons.filter((person) => person.id)
        .map((person) => [person.id, person]));
    value.relatedPersons = value.relatedPersons.map((person, index) => {
        const previous = person.id ? previousPeople.get(person.id) : riskBaseline.value.relatedPersons[index];
        return {
            ...person,
            fullName: person.fullName === previous?.fullName ? person.fullName : person.fullName?.trim(),
            email: person.email === previous?.email ? person.email : person.email?.trim().toLowerCase(),
            phone: person.phone === previous?.phone ? person.phone : person.phone?.trim(),
            idNumber: person.idNumber?.trim() || undefined,
        };
    });
    return value;
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
onMounted(() => {
    void loadAll();
    void loadCountries();
    void loadCurrencies();
});
</script>

<style scoped>
.merchant-profile-page { min-width: 0; container-type: inline-size; }
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
.profile-workspace {
    /* Layout values from the Admin merchant drawer's Basic Information form. */
    --profile-label-width: 132px;
    --profile-label-gap: 10px;
    --profile-control-height: 32px;
    --profile-column-gap: 16px;
    --profile-row-gap: 15px;
    --profile-section-padding: 18px;
    min-width: 0; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; box-shadow: var(--merchant-card-shadow-soft); }
.profile-tabs :deep(.el-tabs__header) { margin: 0; padding: 0 18px; border-bottom: 1px solid var(--merchant-border); }
.profile-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }
.profile-tabs :deep(.el-tabs__item) { height: 48px; padding: 0 16px; }
.tab-label { gap: 7px; }
.tab-content { min-width: 0; padding: 18px; background: #f8fafc; }
.profile-section { min-width: 0; margin-bottom: 16px; padding: 15px var(--profile-section-padding) 7px; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; }
.profile-section:last-child { margin-bottom: 0; }
.profile-section--accent { border-top: 3px solid var(--merchant-teal); }
.section-head { min-height: 30px; margin-bottom: 16px; justify-content: space-between; gap: 12px; color: #0f766e; }
.section-head h3 { margin: 0; color: var(--merchant-ink); font-size: 15px; line-height: 1.4; letter-spacing: 0; }
.section-head span { display: block; margin-top: 2px; color: var(--merchant-muted); font-size: 12px; }
.form-grid {
    display: grid;
    align-items: start;
    column-gap: var(--profile-column-gap);
}
.form-grid--three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.profile-facts { margin: 0; row-gap: var(--profile-row-gap); }
.profile-facts > div,
.profile-field,
.profile-section :deep(.el-form-item) {
    display: grid;
    grid-template-columns: var(--profile-label-width) minmax(0, 1fr);
    align-items: start;
    min-width: 0;
}
.profile-facts dt,
.profile-field__label,
.profile-section :deep(.el-form-item__label) {
    display: block;
    box-sizing: border-box;
    width: auto;
    height: auto;
    min-height: var(--profile-control-height);
    padding: 0 var(--profile-label-gap) 0 0;
    align-content: center;
    color: #53627a;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    text-align: right;
    text-wrap: balance;
    overflow-wrap: anywhere;
}
.profile-section :deep(.el-form-item) { margin: 0 0 var(--profile-row-gap); }
.profile-section :deep(.el-form-item__content) {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    min-width: 0;
    min-height: var(--profile-control-height);
    line-height: var(--profile-control-height);
}
.profile-section :deep(.el-form-item__error) {
    position: static;
    line-height: 1.25;
    overflow-wrap: anywhere;
}
.profile-section :deep(.el-input),
.profile-section :deep(.el-select),
.profile-section :deep(.el-date-editor),
.profile-section :deep(.el-input-number),
.profile-section :deep(.el-textarea) {
    width: 100%;
    min-width: 0;
}
.profile-section :deep(.el-input__wrapper),
.profile-section :deep(.el-select__wrapper) { min-height: var(--profile-control-height); }
.profile-section :deep(.el-switch) { align-self: flex-start; }
.profile-section :deep(.el-select__selected-item),
.profile-section :deep(.el-select__selection) { min-width: 0; }
.profile-section :deep(.el-select__selected-item .el-tag) { max-width: 100%; }
.profile-field,
.profile-facts dd { margin: 0; }
.profile-field { margin-bottom: var(--profile-row-gap); }
.profile-field__value,
.profile-facts dd {
    display: flex;
    min-height: var(--profile-control-height);
    align-items: center;
    flex-wrap: wrap;
    gap: 0 8px;
    color: var(--merchant-ink);
    overflow-wrap: anywhere;
}
.profile-field__value .el-button { max-width: 100%; white-space: normal; }
@container (max-width: 900px) {
    .form-grid--three { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@container (max-width: 600px) {
    .form-grid--three { grid-template-columns: minmax(0, 1fr); }
}
@container (max-width: 480px) {
    .profile-facts > div,
    .profile-field,
    .profile-section :deep(.el-form-item) { grid-template-columns: minmax(0, 1fr); }
    .profile-facts dt,
    .profile-field__label,
    .profile-section :deep(.el-form-item__label) {
        min-height: 0;
        padding: 0 0 6px;
        text-align: left;
    }
    .profile-facts dd { min-height: 0; }
}
.profile-issues { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; max-height: 45vh; overflow: auto; }
.profile-issues button { width: 100%; padding: 6px 8px; text-align: left; border: 0; background: transparent; color: var(--el-color-primary); cursor: pointer; }
.profile-issues button:disabled { color: var(--el-text-color-regular); cursor: default; }
.profile-issues button:not(:disabled):hover, .profile-issues button:focus-visible { background: var(--el-color-primary-light-9); }
.profile-issues-note, .profile-inline-hint, .history-time { color: var(--merchant-muted); font-size: 12px; }
.profile-inline-hint { line-height: 1.5; margin-top: 4px; }
.profile-dictionary-errors { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.history-item .history-time { display: block; margin-bottom: 8px; }
.profile-workspace [id^="profile-"]:focus { outline: 2px solid var(--el-color-primary-light-5); outline-offset: 3px; border-radius: 4px; }
.profile-section :deep(.el-input-number .el-input__inner) { text-align: left; }

.form-grid__wide { grid-column: 1 / -1; }
.contact-band { margin: 2px -12px 0; padding: 12px 11px 0; border: 1px solid #e4edf5; border-radius: 6px; background: #f8fafc; }
.section-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; padding-top: 14px; border-top: 1px solid var(--merchant-border); }
.person-list { display: grid; gap: 12px; }
.person-card { padding: 16px; border: 1px solid #dce7f2; border-left: 3px solid #1677ff; border-radius: 6px; background: #fff; }
.person-card__head { min-height: 32px; margin-bottom: 10px; justify-content: space-between; }
.person-card__head strong { color: var(--merchant-ink); font-size: 14px; }
.person-flags { display: flex; flex-wrap: wrap; gap: 4px 22px; padding-inline-start: var(--profile-label-width); }
@container (max-width: 480px) { .person-flags { padding-inline-start: 0; } }
.person-flags :deep(.el-checkbox) { max-width: 100%; height: auto; margin-right: 0; }
.person-flags :deep(.el-checkbox__label) { white-space: normal; }
.document-upload-bar { margin: 0 -12px 14px; padding: 12px 11px; border: 1px solid #cfe3e8; border-radius: 6px; background: #f0fdfa; }
.document-upload-bar > :deep(.el-form-item) { margin-bottom: 0; }
@container (max-width: 600px) { .document-upload-bar { row-gap: var(--profile-row-gap); } }
.table-actions { justify-content: center; gap: 4px; }
.history-item { padding: 12px 14px; border: 1px solid var(--merchant-border); border-radius: 6px; background: #fff; }
.history-item > div { display: flex; align-items: center; gap: 10px; }
.history-item p { margin: 8px 0 0; color: #475569; font-size: 13px; }
.history-item > span { display: block; margin-top: 7px; color: var(--merchant-muted); font-size: 12px; }
@media (max-width: 1180px) { .profile-rail { grid-template-columns: minmax(200px, .8fr) minmax(320px, 1.4fr); } .profile-rail__actions { grid-column: 1 / -1; padding-top: 10px; border-top: 1px solid var(--merchant-border); } }
@media (max-width: 900px) { .profile-rail { grid-template-columns: 1fr; } .profile-rail__facts { border-left: 0; border-top: 1px solid var(--merchant-border); padding-top: 12px; } .profile-rail__actions { grid-column: auto; } .profile-tabs :deep(.el-tabs__header) { overflow-x: auto; } }
@media (max-width: 640px) { .profile-header { align-items: flex-start; } .profile-identity { flex-wrap: wrap; } .profile-header__actions { flex-direction: column-reverse; align-items: flex-end; } .profile-rail__facts { grid-template-columns: minmax(0, 1fr); } .profile-rail__facts > div { padding: 8px 0; border-right: 0; border-bottom: 1px solid var(--merchant-border); } .profile-rail__actions, .section-actions { align-items: stretch; flex-direction: column; } .tab-content { padding: 10px; } .profile-section { padding: 14px; } }
</style>
