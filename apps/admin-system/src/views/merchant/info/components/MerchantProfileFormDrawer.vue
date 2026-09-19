<!-- 商户开户资料编辑器：按 R1/R2/R3 阶段组织字段，草稿保存与审核提交保持独立。 -->
<template>
  <el-drawer
    v-model="drawerVisible"
    :title="mode === 'add' ? t('merchant.info.addTitle') : t('merchant.info.editTitle')"
    size="min(1480px, 96vw)"
    append-to-body
    destroy-on-close
    class="merchant-profile-form"
  >
    <div class="merchant-profile-form__body">
      <section class="merchant-profile-form__context">
        <span class="merchant-profile-form__mark"><Shop /></span>
        <div class="merchant-profile-form__context-copy">
          <span>{{ t('merchant.info.onboardingWorkspace') }}</span>
          <div class="merchant-profile-form__heading">
            <strong>{{ merchant?.merchantName || t('merchant.info.addTitle') }}</strong>
            <el-tag size="small" effect="plain">{{ t(steps[activeStep]) }}</el-tag>
          </div>
          <p>{{ merchant?.merchantId || t('merchant.info.r1Hint') }}</p>
          <div class="merchant-profile-form__metadata">
            <span v-if="form.countryCode">{{ form.countryCode }}</span>
            <span v-if="form.merchantCategoryCode">MCC {{ form.merchantCategoryCode }}</span>
            <span v-if="form.settlementCurrency">{{ form.settlementCurrency }}</span>
          </div>
        </div>
        <div class="merchant-profile-form__application">
          <div>
            <span>{{ t('merchant.info.applicationNo') }}</span>
            <strong>{{
              merchant?.applicationNo || t('merchant.info.autoGenerateApplicationNo')
            }}</strong>
          </div>
          <div>
            <span>{{ t('merchant.info.currentProgress') }}</span>
            <strong>{{ activeStep + 1 }} / {{ steps.length }}</strong>
          </div>
        </div>
      </section>

      <div class="merchant-profile-form__workflow">
        <el-steps
          :active="activeStep"
          align-center
          finish-status="success"
          class="merchant-profile-form__steps"
        >
          <el-step v-for="(step, index) in steps" :key="step">
            <template #title
              ><span class="merchant-profile-form__step-title">{{ t(step) }}</span></template
            >
            <template #description
              ><span class="merchant-profile-form__step-description">{{
                t(stepDescriptions[index])
              }}</span></template
            >
          </el-step>
        </el-steps>
      </div>
      <div class="merchant-profile-form__mobile-progress">
        <div>
          <span>
            <strong>{{ t(steps[activeStep]) }}</strong>
            <small>{{ t(stepDescriptions[activeStep]) }}</small>
          </span>
          <span>{{ activeStep + 1 }} / {{ steps.length }}</span>
        </div>
        <el-progress :percentage="((activeStep + 1) / steps.length) * 100" :show-text="false" />
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="132px" size="small">
        <section v-show="activeStep === 0" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><OfficeBuilding /></span>
              <div>
                <h3>{{ t('merchant.info.stepBasic') }}</h3>
                <span>{{ t('merchant.info.r1Hint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">01</span>
          </header>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.merchantId')">
              <el-input
                :model-value="merchant?.merchantId || t('merchant.info.autoGenerateMerchantId')"
                disabled
              />
            </el-form-item>
            <el-form-item :label="t('merchant.info.applicationNo')">
              <el-input
                :model-value="
                  merchant?.applicationNo || t('merchant.info.autoGenerateApplicationNo')
                "
                disabled
              />
            </el-form-item>
            <el-form-item :label="t('merchant.info.merchantName')" prop="merchantName">
              <el-input v-model.trim="form.merchantName" maxlength="128" />
            </el-form-item>
            <el-form-item :label="t('merchant.info.shortName')" prop="merchantShortName">
              <el-input v-model.trim="form.merchantShortName" maxlength="64" />
            </el-form-item>
            <el-form-item :label="t('merchant.info.merchantType')" prop="merchantType">
              <el-select v-model="form.merchantType" style="width: 100%">
                <el-option
                  v-for="item in merchantTypeOptions"
                  :key="item"
                  :label="optionText('merchantType', item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.countryCode')" prop="countryCode">
              <el-select v-model="form.countryCode" filterable clearable style="width: 100%">
                <el-option
                  v-for="item in formOptions.countries"
                  :key="item.value"
                  :label="codeNameLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.businessType')" prop="businessType">
              <el-select v-model="form.businessType" style="width: 100%">
                <el-option
                  v-for="item in businessTypeOptions"
                  :key="item"
                  :label="optionText('businessType', item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.industryCategory')" prop="industryCategory">
              <el-select v-model="form.industryCategory" filterable style="width: 100%">
                <el-option
                  v-for="item in industryOptions"
                  :key="item"
                  :label="optionText('industry', item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.billingDescriptor')" prop="billingDescriptor">
              <el-input v-model.trim="form.billingDescriptor" maxlength="64" />
            </el-form-item>
            <el-form-item label="MCC">
              <el-cascader
                v-model="selectedMccPath"
                :options="localizedMccOptions"
                :props="{ emitPath: true }"
                :show-all-levels="false"
                :placeholder="t('merchant.info.mccReviewHint')"
                filterable
                clearable
                style="width: 100%"
                @change="handleMccChange"
              />
            </el-form-item>
            <el-form-item :label="t('merchant.info.defaultLocale')" prop="defaultLocale">
              <el-select v-model="form.defaultLocale" style="width: 100%">
                <el-option :label="t('merchant.info.localeChinese')" value="zh-CN" />
                <el-option :label="t('merchant.info.localeEnglish')" value="en-US" />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.timezone')" prop="timezone">
              <el-select v-model="form.timezone" filterable clearable style="width: 100%">
                <el-option
                  v-for="item in timezoneOptions"
                  :key="item.dictValue"
                  :label="item.dictLabel"
                  :value="item.dictValue"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.riskLevel')">
              <el-select v-model="form.riskLevel" clearable style="width: 100%">
                <el-option :label="t('merchant.info.riskLow')" :value="1" />
                <el-option :label="t('merchant.info.riskNormal')" :value="2" />
                <el-option :label="t('merchant.info.riskHigh')" :value="3" />
              </el-select>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.merchantDescription')"
              prop="merchantDescription"
              class="form-grid__full"
            >
              <el-input
                v-model.trim="form.merchantDescription"
                type="textarea"
                :rows="3"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
          </div>
        </section>

        <section v-show="activeStep === 1" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><Document /></span>
              <div>
                <h3>{{ t('merchant.info.stepKyb') }}</h3>
                <span>{{ t('merchant.info.r2Hint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">02</span>
          </header>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.registrationNumber')" prop="registrationNumber"
              ><el-input v-model.trim="form.registrationNumber"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.legalEntityType')" prop="legalEntityType">
              <el-select v-model="form.legalEntityType" clearable style="width: 100%">
                <el-option
                  v-for="item in legalEntityOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.incorporationDate')" prop="incorporationDate">
              <el-date-picker
                v-model="form.incorporationDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.incorporationCountry')"
              prop="incorporationCountry"
            >
              <el-select
                v-model="form.incorporationCountry"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in formOptions.countries"
                  :key="item.value"
                  :label="codeNameLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.registeredState')"
              ><el-input v-model.trim="form.registeredState"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.registeredCity')" prop="registeredCity"
              ><el-input v-model.trim="form.registeredCity"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.registeredPostcode')"
              ><el-input v-model.trim="form.registeredPostcode"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.taxId')"
              ><el-input v-model.trim="form.taxId" show-password
            /></el-form-item>
            <el-form-item
              :label="t('merchant.info.registeredAddress')"
              prop="registeredAddress"
              class="form-grid__full"
            >
              <el-input v-model.trim="form.registeredAddress" type="textarea" :rows="2" />
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.operatingSameAsRegistered')"
              class="form-grid__full"
            >
              <el-radio-group v-model="form.operatingSameAsRegistered">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <template v-if="form.operatingSameAsRegistered !== true">
              <el-form-item :label="t('merchant.info.operatingCountry')" prop="operatingCountry">
                <el-select v-model="form.operatingCountry" filterable clearable style="width: 100%">
                  <el-option
                    v-for="item in formOptions.countries"
                    :key="item.value"
                    :label="codeNameLabel(item)"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('merchant.info.regionCode')"
                ><el-input v-model.trim="form.regionCode"
              /></el-form-item>
              <el-form-item :label="t('merchant.info.city')"
                ><el-input v-model.trim="form.city"
              /></el-form-item>
              <el-form-item :label="t('merchant.info.postalCode')"
                ><el-input v-model.trim="form.postalCode"
              /></el-form-item>
              <el-form-item :label="t('merchant.info.address')" class="form-grid__full">
                <el-input v-model.trim="form.addressLine" type="textarea" :rows="2" />
              </el-form-item>
            </template>
            <el-form-item :label="t('merchant.info.companySize')">
              <el-select v-model="form.companySize" clearable style="width: 100%">
                <el-option
                  v-for="item in companySizeOptions"
                  :key="item"
                  :label="optionText('companySize', item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.employeeCount')">
              <el-input-number
                v-model="form.employeeCount"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </section>

        <section v-show="activeStep === 2" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><User /></span>
              <div>
                <h3>{{ t('merchant.info.stepContacts') }}</h3>
                <span>{{ t('merchant.info.relatedPersonHint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">03</span>
          </header>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.contactName')" prop="contactName"
              ><el-input v-model.trim="form.contactName"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.contactTitle')"
              ><el-input v-model.trim="form.contactTitle"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.contactPhone')" prop="contactPhone"
              ><el-input
                v-model.trim="form.contactPhone"
                placeholder="+14085550100"
                @blur="normalizeContactPhone"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.contactEmail')" prop="contactEmail"
              ><el-input v-model.trim="form.contactEmail"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.alternateEmail')"
              ><el-input v-model.trim="form.alternateEmail"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.financeContactName')"
              ><el-input v-model.trim="form.financeContactName"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.financeContactEmail')"
              ><el-input v-model.trim="form.financeContactEmail"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.technicalContactName')"
              ><el-input v-model.trim="form.technicalContactName"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.technicalContactEmail')"
              ><el-input v-model.trim="form.technicalContactEmail"
            /></el-form-item>
          </div>

          <div class="related-persons">
            <div class="related-persons__toolbar">
              <strong>{{ t('merchant.info.relatedPersons') }}</strong>
              <el-button type="primary" plain :icon="Plus" @click="addRelatedPerson">{{
                t('merchant.info.addRelatedPerson')
              }}</el-button>
            </div>
            <el-empty
              v-if="!form.relatedPersons?.length"
              :description="t('merchant.info.noRelatedPersons')"
            />
            <article
              v-for="(person, index) in form.relatedPersons"
              :key="person.id || index"
              class="related-person"
            >
              <div class="related-person__header">
                <strong>{{ t('merchant.info.relatedPersonNo', { index: index + 1 }) }}</strong>
                <el-button type="danger" link :icon="Delete" @click="removeRelatedPerson(index)">{{
                  t('common.delete')
                }}</el-button>
              </div>
              <div class="form-grid">
                <el-form-item
                  :label="t('merchant.info.fullName')"
                  :prop="`relatedPersons.${index}.fullName`"
                  :rules="[requiredFieldRule('merchant.info.fullName')]"
                  ><el-input v-model.trim="person.fullName"
                /></el-form-item>
                <el-form-item
                  :label="t('merchant.info.personRoles')"
                  :prop="`relatedPersons.${index}.personRoles`"
                  :rules="[requiredArrayRule('merchant.info.personRoles')]"
                >
                  <el-select
                    v-model="person.personRoles"
                    multiple
                    collapse-tags
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in personRoleOptions"
                      :key="item"
                      :label="optionText('personRole', item)"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item :label="t('merchant.info.nationality')"
                  ><country-select
                    v-model="person.nationality"
                    :options="formOptions.countries"
                    :labeler="codeNameLabel"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.residenceCountry')"
                  ><country-select
                    v-model="person.residenceCountry"
                    :options="formOptions.countries"
                    :labeler="codeNameLabel"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.dateOfBirth')"
                  ><el-date-picker
                    v-model="person.dateOfBirth"
                    type="date"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.idType')">
                  <el-select v-model="person.idType" clearable style="width: 100%">
                    <el-option
                      v-for="item in idTypeOptions"
                      :key="item"
                      :label="optionText('idType', item)"
                      :value="item"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item
                  :label="t('merchant.info.idNumber')"
                  :prop="`relatedPersons.${index}.idNumber`"
                  :rules="relatedPersonIdRules(person)"
                >
                  <el-input
                    v-model.trim="person.idNumber"
                    show-password
                    :placeholder="person.idNumberMasked || t('merchant.info.idNumberPlaceholder')"
                  />
                </el-form-item>
                <el-form-item :label="t('merchant.info.idExpiryDate')"
                  ><el-date-picker
                    v-model="person.idExpiryDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.ownershipPercentage')">
                  <el-input-number
                    v-model="person.ownershipPercentage"
                    :min="0"
                    :max="100"
                    :precision="2"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                <el-form-item :label="t('merchant.info.controllerFlag')"
                  ><el-switch v-model="person.controllerFlag"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.pepFlag')"
                  ><el-switch v-model="person.pepFlag"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.personEmail')"
                  ><el-input v-model.trim="person.email"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.personPhone')"
                  ><el-input v-model.trim="person.phone"
                /></el-form-item>
                <el-form-item :label="t('merchant.info.residentialAddress')" class="form-grid__full"
                  ><el-input v-model.trim="person.residentialAddress" type="textarea" :rows="2"
                /></el-form-item>
              </div>
            </article>
          </div>
        </section>

        <section v-show="activeStep === 3" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><TrendCharts /></span>
              <div>
                <h3>{{ t('merchant.info.stepBusiness') }}</h3>
                <span>{{ t('merchant.info.r2Hint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">04</span>
          </header>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.businessModel')" prop="businessModel">
              <el-select v-model="form.businessModel" clearable style="width: 100%">
                <el-option
                  v-for="item in businessModelOptions"
                  :key="item"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.customerType')" prop="customerType">
              <el-select v-model="form.customerType" clearable style="width: 100%">
                <el-option
                  v-for="item in customerTypeOptions"
                  :key="item"
                  :label="optionText('customerType', item)"
                  :value="item"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.salesChannels')"
              prop="salesChannels"
              class="form-grid__full"
            >
              <el-checkbox-group v-model="form.salesChannels">
                <el-checkbox v-for="item in salesChannelOptions" :key="item" :value="item">{{
                  optionText('salesChannel', item)
                }}</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.productsServices')"
              prop="productsServices"
              class="form-grid__full"
            >
              <el-input
                v-model.trim="form.productsServices"
                type="textarea"
                :rows="3"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>
            <el-form-item :label="t('merchant.info.targetMarkets')" prop="targetMarkets">
              <el-select
                v-model="form.targetMarkets"
                multiple
                filterable
                collapse-tags
                style="width: 100%"
              >
                <el-option
                  v-for="item in formOptions.countries"
                  :key="item.value"
                  :label="codeNameLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.transactionCurrencies')"
              prop="transactionCurrencies"
            >
              <el-select
                v-model="form.transactionCurrencies"
                multiple
                filterable
                collapse-tags
                style="width: 100%"
              >
                <el-option
                  v-for="item in formOptions.currencies"
                  :key="item.value"
                  :label="codeNameLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.expectedMonthlyVolume')"
              prop="expectedMonthlyVolume"
              ><amount-input
                v-model="form.expectedMonthlyVolume"
                :currency="form.expectedVolumeCurrency"
            /></el-form-item>
            <el-form-item
              :label="t('merchant.info.expectedVolumeCurrency')"
              prop="expectedVolumeCurrency"
            >
              <el-select
                v-model="form.expectedVolumeCurrency"
                filterable
                clearable
                style="width: 100%"
              >
                <el-option
                  v-for="item in formOptions.currencies"
                  :key="item.value"
                  :label="codeNameLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('merchant.info.averageTicket')" prop="averageTicket"
              ><amount-input v-model="form.averageTicket" :currency="form.expectedVolumeCurrency"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.maxTicket')"
              ><amount-input v-model="form.maxTicket" :currency="form.expectedVolumeCurrency"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.expectedMonthlyCount')"
              ><el-input-number
                v-model="form.expectedMonthlyCount"
                :min="0"
                controls-position="right"
                style="width: 100%"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.fulfillmentDays')"
              ><el-input-number
                v-model="form.fulfillmentDays"
                :min="0"
                controls-position="right"
                style="width: 100%"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.expectedRefundRate')"
              ><percent-input v-model="form.expectedRefundRate"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.expectedChargebackRate')"
              ><percent-input v-model="form.expectedChargebackRate"
            /></el-form-item>
            <el-form-item
              :label="t('merchant.info.recurringPaymentFlag')"
              prop="recurringPaymentFlag"
            >
              <el-radio-group v-model="form.recurringPaymentFlag">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('merchant.info.presaleFlag')" prop="presaleFlag">
              <el-radio-group v-model="form.presaleFlag">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('merchant.info.digitalGoodsFlag')" prop="digitalGoodsFlag">
              <el-radio-group v-model="form.digitalGoodsFlag">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item
              :label="t('merchant.info.restrictedBusinessFlag')"
              prop="restrictedBusinessFlag"
            >
              <el-radio-group v-model="form.restrictedBusinessFlag">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('merchant.info.expectedGoLiveDate')"
              ><el-date-picker
                v-model="form.expectedGoLiveDate"
                type="date"
                value-format="YYYY-MM-DD"
                style="width: 100%"
            /></el-form-item>
          </div>

          <el-divider content-position="left">{{ t('merchant.info.websiteAndSales') }}</el-divider>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.websiteLiveFlag')" prop="websiteLiveFlag">
              <el-radio-group v-model="form.websiteLiveFlag">
                <el-radio :value="true">{{ t('common.yes') }}</el-radio>
                <el-radio :value="false">{{ t('common.no') }}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item :label="t('merchant.info.websiteLanguages')">
              <el-select
                v-model="form.websiteLanguages"
                multiple
                allow-create
                filterable
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item
              v-if="form.websiteLiveFlag === true"
              :label="t('merchant.info.websiteUrl')"
              prop="websiteUrl"
              ><el-input v-model.trim="form.websiteUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item
              v-if="form.websiteLiveFlag === false"
              :label="t('merchant.info.otherSalesUrl')"
              prop="otherSalesUrl"
              ><el-input v-model.trim="form.otherSalesUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.appStoreUrl')"
              ><el-input v-model.trim="form.appStoreUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.googlePlayUrl')"
              ><el-input v-model.trim="form.googlePlayUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item
              v-if="form.websiteLiveFlag === true"
              :label="t('merchant.info.privacyPolicyUrl')"
              prop="privacyPolicyUrl"
              ><el-input v-model.trim="form.privacyPolicyUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item
              v-if="form.websiteLiveFlag === true"
              :label="t('merchant.info.refundPolicyUrl')"
              prop="refundPolicyUrl"
              ><el-input v-model.trim="form.refundPolicyUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item
              v-if="form.websiteLiveFlag === true"
              :label="t('merchant.info.termsUrl')"
              prop="termsUrl"
              ><el-input v-model.trim="form.termsUrl" placeholder="https://"
            /></el-form-item>
            <el-form-item :label="t('merchant.info.shippingPolicyUrl')"
              ><el-input v-model.trim="form.shippingPolicyUrl" placeholder="https://"
            /></el-form-item>
          </div>
        </section>

        <section v-show="activeStep === 4" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><Wallet /></span>
              <div>
                <h3>{{ t('merchant.info.stepSettlement') }}</h3>
                <span>{{ t('merchant.info.settlementPreferenceHint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">05</span>
          </header>
          <div class="form-grid">
            <el-form-item :label="t('merchant.info.settlementCurrency')">
              <el-select v-model="form.settlementCurrency" filterable clearable style="width: 100%">
                <el-option
                  v-for="item in formOptions.currencies"
                  :key="item.value"
                  :label="currencyOptionLabel(item)"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </div>
          <el-alert
            type="info"
            :closable="false"
            :title="t('merchant.info.settlementAccountReuseHint')"
          />
        </section>

        <section v-show="activeStep === 5" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><Files /></span>
              <div>
                <h3>{{ t('merchant.info.stepDocuments') }}</h3>
                <span>{{ t('merchant.info.documentUploadHint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">06</span>
          </header>
          <el-alert
            v-if="!merchant?.merchantId"
            type="warning"
            :closable="false"
            :title="t('merchant.info.saveBeforeUpload')"
            class="section-alert"
          />
          <div class="document-toolbar">
            <el-select
              v-model="selectedDocumentType"
              :disabled="!merchant?.merchantId"
              style="width: 260px"
            >
              <el-option
                v-for="item in documentTypeOptions"
                :key="item"
                :label="optionText('documentType', item)"
                :value="item"
              />
            </el-select>
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept=".pdf,.jpg,.jpeg,.png"
              :disabled="!merchant?.merchantId || documentBusyId === 'upload'"
              :on-change="handleDocumentSelected"
            >
              <el-button
                type="primary"
                :icon="Upload"
                :loading="documentBusyId === 'upload'"
                :disabled="!merchant?.merchantId"
              >
                {{ t('merchant.info.uploadDocument') }}
              </el-button>
            </el-upload>
          </div>
          <el-table :data="merchant?.documents || []" row-key="id" size="small" border>
            <el-table-column :label="t('merchant.info.documentType')" min-width="170">
              <template #default="{ row }">{{
                optionText('documentType', row.documentType)
              }}</template>
            </el-table-column>
            <el-table-column
              prop="originalFilename"
              :label="t('merchant.info.filename')"
              min-width="220"
              show-overflow-tooltip
            />
            <el-table-column :label="t('merchant.info.fileSize')" width="110" align="center">
              <template #default="{ row }">{{ formatFileSize(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column :label="t('common.createTime')" min-width="170" align="center">
              <template #default="{ row }"><BaseDateTime :value="row.gmtCreate" /></template>
            </el-table-column>
            <el-table-column :label="t('common.operation')" width="150" align="center">
              <template #default="{ row }">
                <el-button
                  type="primary"
                  link
                  :icon="Download"
                  @click="emit('download-document', row)"
                  >{{ t('common.download') }}</el-button
                >
                <el-button
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
        </section>

        <section v-show="activeStep === 6" class="form-section">
          <header class="form-section__header">
            <div class="form-section__title">
              <span class="form-section__icon"><DocumentChecked /></span>
              <div>
                <h3>{{ t('merchant.info.stepPreview') }}</h3>
                <span>{{ t('merchant.info.previewHint') }}</span>
              </div>
            </div>
            <span class="form-section__step-index">07</span>
          </header>
          <div class="preview-grid">
            <div>
              <span>{{ t('merchant.info.merchantName') }}</span
              ><strong>{{ form.merchantName || '-' }}</strong>
            </div>
            <div>
              <span>{{ t('merchant.info.countryCode') }}</span
              ><strong>{{ form.countryCode || '-' }}</strong>
            </div>
            <div>
              <span>{{ t('merchant.info.businessType') }}</span
              ><strong>{{
                form.businessType ? optionText('businessType', form.businessType) : '-'
              }}</strong>
            </div>
            <div>
              <span>{{ t('merchant.info.contactEmail') }}</span
              ><strong>{{ form.contactEmail || '-' }}</strong>
            </div>
            <div>
              <span>{{ t('merchant.info.relatedPersons') }}</span
              ><strong>{{ form.relatedPersons?.length || 0 }}</strong>
            </div>
            <div>
              <span>{{ t('merchant.info.complianceDocuments') }}</span
              ><strong>{{ merchant?.documents?.length || 0 }}</strong>
            </div>
          </div>
          <el-alert
            :type="reviewStatusAlert.type"
            :closable="false"
            :title="t(reviewStatusAlert.titleKey)"
            class="section-alert"
          />
          <div v-if="visibleReadinessIssues.length" class="readiness-issues">
            <strong>{{ t(readinessIssuesTitleKey) }}</strong>
            <el-tag
              v-for="item in visibleReadinessIssues"
              :key="item"
              type="warning"
              effect="plain"
              >{{ readinessIssueText(item, t) }}</el-tag
            >
          </div>
        </section>
      </el-form>
    </div>

    <template #footer>
      <div class="merchant-profile-form__footer">
        <el-button @click="drawerVisible = false">{{ t('common.cancel') }}</el-button>
        <div>
          <el-button v-if="activeStep > 0" :icon="ArrowLeft" @click="activeStep -= 1">{{
            t('common.previous')
          }}</el-button>
          <el-button
            v-if="activeStep < steps.length - 1"
            type="primary"
            :icon="ArrowRight"
            @click="goNext"
            >{{ t('common.next') }}</el-button
          >
          <el-button :loading="saving" :icon="DocumentChecked" @click="saveDraft">{{
            t(saveActionTextKey)
          }}</el-button>
          <el-button
            v-if="activeStep === steps.length - 1 && reviewSubmissionAllowed"
            type="primary"
            :loading="saving"
            :disabled="!merchant?.merchantId"
            @click="saveAndSubmit"
          >
            {{ t('merchant.info.submitReview') }}
          </el-button>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, nextTick, reactive, ref, watch } from 'vue';
  import type { PropType } from 'vue';
  import {
    ElInputNumber,
    ElMessage,
    ElOption,
    ElSelect,
    type FormInstance,
    type FormRules,
    type UploadFile,
  } from 'element-plus';
  import {
    ArrowLeft,
    ArrowRight,
    Delete,
    Document,
    DocumentChecked,
    Download,
    Files,
    OfficeBuilding,
    Plus,
    Shop,
    TrendCharts,
    Upload,
    User,
    Wallet,
  } from '@element-plus/icons-vue';
  import { useI18n } from 'vue-i18n';
  import BaseDateTime from '@/components/BaseDateTime/index.vue';
  import type { SysDictData } from '@/api/system/dict';
  import type {
    MerchantDocument,
    MerchantFormOptions,
    MerchantInfo,
    MerchantOptionItem,
    MerchantOptionNode,
    MerchantRelatedPerson,
    MerchantSaveRequest,
  } from '@/api/merchant/info';
  import {
    isCompleteInternationalPhone,
    normalizeInternationalPhone,
  } from '../international-phone';
  import { readinessIssueText } from '../readiness-issue';

  const props = defineProps<{
    visible: boolean;
    mode: 'add' | 'edit';
    merchant?: MerchantInfo;
    formOptions: MerchantFormOptions;
    timezoneOptions: SysDictData[];
    saving?: boolean;
    documentBusyId?: string;
  }>();

  const emit = defineEmits<{
    'update:visible': [value: boolean];
    save: [payload: { request: MerchantSaveRequest; submitAfterSave: boolean }];
    'upload-document': [payload: { documentType: string; file: File }];
    'download-document': [document: MerchantDocument];
    'delete-document': [document: MerchantDocument];
  }>();

  const { locale, t } = useI18n();
  const formRef = ref<FormInstance>();
  const activeStep = ref(0);
  const selectedMccPath = ref<string[]>([]);
  const selectedDocumentType = ref('BUSINESS_LICENSE');
  const steps = [
    'merchant.info.stepBasic',
    'merchant.info.stepKyb',
    'merchant.info.stepContacts',
    'merchant.info.stepBusiness',
    'merchant.info.stepSettlement',
    'merchant.info.stepDocuments',
    'merchant.info.stepPreview',
  ];
  const stepDescriptions = [
    'merchant.info.stepBasicDescription',
    'merchant.info.stepKybDescription',
    'merchant.info.stepContactsDescription',
    'merchant.info.stepBusinessDescription',
    'merchant.info.stepSettlementDescription',
    'merchant.info.stepDocumentsDescription',
    'merchant.info.stepPreviewDescription',
  ];
  const merchantTypeOptions = ['COMPANY', 'SOLE_TRADER'];
  const businessTypeOptions = [
    'ECOMMERCE',
    'DIGITAL_CONTENT',
    'PROFESSIONAL_SERVICES',
    'RETAIL',
    'TRAVEL',
    'OTHER',
  ];
  const industryOptions = [
    'GENERAL_RETAIL',
    'DIGITAL_GOODS',
    'SOFTWARE_SERVICES',
    'TRAVEL_HOSPITALITY',
    'PROFESSIONAL_SERVICES',
    'OTHER',
  ];
  const legalEntityOptions = [
    'LTD',
    'LLC',
    'CORPORATION',
    'PARTNERSHIP',
    'SOLE_PROPRIETORSHIP',
    'OTHER',
  ];
  const companySizeOptions = ['1_10', '11_50', '51_200', '201_500', '501_PLUS'];
  const personRoleOptions = [
    'LEGAL_REPRESENTATIVE',
    'DIRECTOR',
    'UBO',
    'AUTHORIZED_SIGNER',
    'PRIMARY_CONTACT',
  ];
  const idTypeOptions = ['PASSPORT', 'NATIONAL_ID', 'DRIVER_LICENSE', 'OTHER'];
  const businessModelOptions = ['B2C', 'B2B', 'B2B2C'];
  const customerTypeOptions = ['CONSUMER', 'BUSINESS', 'BOTH'];
  const salesChannelOptions = ['WEBSITE', 'APP', 'MARKETPLACE', 'OFFLINE', 'OTHER'];
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
  const draftValidationFields = [
    'merchantName',
    'merchantShortName',
    'merchantType',
    'countryCode',
    'businessType',
    'industryCategory',
    'billingDescriptor',
    'defaultLocale',
    'timezone',
  ];
  const submissionReviewStatuses = new Set(['NOT_SUBMITTED', 'SUPPLEMENT']);
  const businessRegistrationDocumentTypes = new Set(['BUSINESS_LICENSE', 'INCORPORATION']);
  const relatedPersonIdDocumentTypes = new Set([
    'DIRECTOR_ID',
    'UBO_ID',
    'LEGAL_REPRESENTATIVE_ID',
    'AUTHORIZED_SIGNER_ID',
  ]);
  const submissionFieldSteps: Record<string, number> = {
    merchantDescription: 0,
    registrationNumber: 1,
    legalEntityType: 1,
    incorporationDate: 1,
    incorporationCountry: 1,
    registeredCity: 1,
    registeredAddress: 1,
    operatingCountry: 1,
    contactName: 2,
    contactEmail: 2,
    contactPhone: 2,
    businessModel: 3,
    customerType: 3,
    salesChannels: 3,
    productsServices: 3,
    targetMarkets: 3,
    transactionCurrencies: 3,
    expectedMonthlyVolume: 3,
    expectedVolumeCurrency: 3,
    averageTicket: 3,
    recurringPaymentFlag: 3,
    presaleFlag: 3,
    digitalGoodsFlag: 3,
    restrictedBusinessFlag: 3,
    websiteLiveFlag: 3,
    websiteUrl: 3,
    otherSalesUrl: 3,
    privacyPolicyUrl: 3,
    refundPolicyUrl: 3,
    termsUrl: 3,
  };

  const drawerVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
  });

  const form = reactive<MerchantSaveRequest>(createEmptyForm());
  const localizedMccOptions = computed(() => props.formOptions.mccOptions.map(localizeMccNode));
  const currentReviewStatus = computed(() => props.merchant?.reviewStatus || 'NOT_SUBMITTED');
  const isActiveMerchant = computed(
    () =>
      props.merchant?.activationStatus === 'ACTIVE' ||
      props.merchant?.onboardingStatus === 'ACTIVE',
  );
  const reviewSubmissionAllowed = computed(() =>
    submissionReviewStatuses.has(currentReviewStatus.value),
  );
  const saveActionTextKey = computed(() =>
    props.mode === 'edit' && !reviewSubmissionAllowed.value
      ? 'merchant.info.saveChanges'
      : 'merchant.info.saveDraft',
  );
  const visibleReadinessIssues = computed(() =>
    isActiveMerchant.value ? [] : props.merchant?.readinessIssues || [],
  );
  const readinessIssuesTitleKey = computed(() =>
    currentReviewStatus.value === 'PASSED'
      ? 'merchant.info.activationIssuesTitle'
      : 'merchant.info.submissionIssuesTitle',
  );
  const reviewStatusAlert = computed(() => {
    if (!props.merchant?.merchantId) {
      return { type: 'info' as const, titleKey: 'merchant.info.saveBeforeSubmit' };
    }
    if (isActiveMerchant.value) {
      return { type: 'success' as const, titleKey: 'merchant.info.activeMerchantNotice' };
    }
    if (currentReviewStatus.value === 'PASSED') {
      return { type: 'success' as const, titleKey: 'merchant.info.reviewPassedNotice' };
    }
    if (currentReviewStatus.value === 'PENDING') {
      return { type: 'info' as const, titleKey: 'merchant.info.reviewPendingNotice' };
    }
    if (currentReviewStatus.value === 'REJECTED') {
      return { type: 'warning' as const, titleKey: 'merchant.info.reviewRejectedNotice' };
    }
    if (props.merchant?.reviewSubmittable) {
      return { type: 'success' as const, titleKey: 'merchant.info.readyToSubmit' };
    }
    return { type: 'warning' as const, titleKey: 'merchant.info.notReadyToSubmit' };
  });
  const rules = computed<FormRules>(() => ({
    merchantName: [
      requiredRule('merchant.info.requiredMerchantName'),
      printableEnglishRule('merchant.info.invalidMerchantName'),
    ],
    merchantShortName: [requiredRule('merchant.info.requiredShortName')],
    merchantType: [requiredRule('merchant.info.requiredMerchantType', 'change')],
    countryCode: [requiredRule('merchant.info.requiredCountryCode', 'change')],
    businessType: [requiredRule('merchant.info.requiredBusinessType', 'change')],
    industryCategory: [requiredRule('merchant.info.requiredIndustryCategory', 'change')],
    billingDescriptor: [printableEnglishRule('merchant.info.invalidBillingDescriptor')],
    defaultLocale: [requiredRule('merchant.info.requiredDefaultLocale', 'change')],
    timezone: [requiredRule('merchant.info.requiredTimezone', 'change')],
    merchantDescription: [requiredFieldRule('merchant.info.merchantDescription')],
    registrationNumber: [requiredFieldRule('merchant.info.registrationNumber')],
    legalEntityType: [requiredFieldRule('merchant.info.legalEntityType', 'change')],
    incorporationDate: [requiredFieldRule('merchant.info.incorporationDate', 'change')],
    incorporationCountry: [requiredFieldRule('merchant.info.incorporationCountry', 'change')],
    registeredCity: [requiredFieldRule('merchant.info.registeredCity')],
    registeredAddress: [requiredFieldRule('merchant.info.registeredAddress')],
    operatingCountry: [requiredFieldRule('merchant.info.operatingCountry', 'change')],
    contactName: [requiredRule('merchant.info.requiredContactName')],
    contactPhone: [requiredFieldRule('merchant.info.contactPhone'), internationalPhoneRule()],
    contactEmail: [
      requiredRule('merchant.info.requiredContactEmail'),
      { type: 'email', message: () => t('merchant.info.invalidContactEmail'), trigger: 'blur' },
    ],
    businessModel: [requiredFieldRule('merchant.info.businessModel', 'change')],
    customerType: [requiredFieldRule('merchant.info.customerType', 'change')],
    salesChannels: [requiredArrayRule('merchant.info.salesChannels')],
    productsServices: [requiredFieldRule('merchant.info.productsServices')],
    targetMarkets: [requiredArrayRule('merchant.info.targetMarkets')],
    transactionCurrencies: [requiredArrayRule('merchant.info.transactionCurrencies')],
    expectedMonthlyVolume: [requiredNumberRule('merchant.info.expectedMonthlyVolume')],
    expectedVolumeCurrency: [requiredFieldRule('merchant.info.expectedVolumeCurrency', 'change')],
    averageTicket: [requiredNumberRule('merchant.info.averageTicket')],
    recurringPaymentFlag: [requiredBooleanRule('merchant.info.recurringPaymentFlag')],
    presaleFlag: [requiredBooleanRule('merchant.info.presaleFlag')],
    digitalGoodsFlag: [requiredBooleanRule('merchant.info.digitalGoodsFlag')],
    restrictedBusinessFlag: [requiredBooleanRule('merchant.info.restrictedBusinessFlag')],
    websiteLiveFlag: [requiredBooleanRule('merchant.info.websiteLiveFlag')],
    websiteUrl:
      form.websiteLiveFlag === true ? [requiredFieldRule('merchant.info.websiteUrl')] : [],
    otherSalesUrl:
      form.websiteLiveFlag === false ? [requiredFieldRule('merchant.info.otherSalesUrl')] : [],
    privacyPolicyUrl:
      form.websiteLiveFlag === true ? [requiredFieldRule('merchant.info.privacyPolicyUrl')] : [],
    refundPolicyUrl:
      form.websiteLiveFlag === true ? [requiredFieldRule('merchant.info.refundPolicyUrl')] : [],
    termsUrl: form.websiteLiveFlag === true ? [requiredFieldRule('merchant.info.termsUrl')] : [],
  }));

  watch(
    () => props.visible,
    (visible) => {
      if (!visible) return;
      activeStep.value = 0;
      Object.assign(form, createEmptyForm(), editableValues(props.merchant));
      selectedMccPath.value = resolveMccPath(form.merchantCategoryCode);
      nextTick(() => formRef.value?.clearValidate());
    },
    { immediate: true },
  );

  watch(
    () => props.merchant,
    (merchant) => {
      if (!props.visible || !merchant) return;
      Object.assign(form, createEmptyForm(), editableValues(merchant));
      selectedMccPath.value = resolveMccPath(form.merchantCategoryCode);
    },
    { deep: true },
  );

  watch(
    () => [
      form.countryCode,
      form.registeredState,
      form.registeredCity,
      form.registeredPostcode,
      form.registeredAddress,
      form.operatingSameAsRegistered,
    ],
    () => syncOperatingAddress(),
  );

  function createEmptyForm(): MerchantSaveRequest {
    return {
      merchantId: '',
      merchantName: '',
      billingDescriptor: '',
      merchantShortName: '',
      merchantType: 'COMPANY',
      merchantStatus: 2,
      defaultLocale: 'zh-CN',
      merchantCategoryCode: '',
      countryCode: '',
      operatingCountry: '',
      businessType: '',
      industryCategory: '',
      merchantDescription: '',
      registrationNumber: '',
      legalEntityType: '',
      incorporationDate: '',
      incorporationCountry: '',
      registeredState: '',
      registeredCity: '',
      registeredPostcode: '',
      registeredAddress: '',
      operatingSameAsRegistered: undefined,
      taxId: '',
      companySize: '',
      employeeCount: undefined,
      regionCode: '',
      city: '',
      addressLine: '',
      postalCode: '',
      contactName: '',
      contactTitle: '',
      phoneCountryCode: '',
      contactEmail: '',
      contactPhone: '',
      alternateEmail: '',
      financeContactName: '',
      financeContactEmail: '',
      technicalContactName: '',
      technicalContactEmail: '',
      businessModel: '',
      salesChannels: [],
      productsServices: '',
      targetMarkets: [],
      customerType: '',
      transactionCurrencies: [],
      expectedMonthlyVolume: undefined,
      expectedVolumeCurrency: 'USD',
      averageTicket: undefined,
      maxTicket: undefined,
      expectedMonthlyCount: undefined,
      expectedRefundRate: undefined,
      expectedChargebackRate: undefined,
      recurringPaymentFlag: undefined,
      presaleFlag: undefined,
      fulfillmentDays: undefined,
      digitalGoodsFlag: undefined,
      restrictedBusinessFlag: undefined,
      expectedGoLiveDate: '',
      websiteUrl: '',
      appStoreUrl: '',
      googlePlayUrl: '',
      otherSalesUrl: '',
      websiteLanguages: [],
      websiteLiveFlag: undefined,
      privacyPolicyUrl: '',
      refundPolicyUrl: '',
      termsUrl: '',
      shippingPolicyUrl: '',
      relatedPersons: [],
      settlementCurrency: 'USD',
      timezone: 'Asia/Shanghai',
      riskLevel: 2,
    };
  }

  /** 仅复制后端允许编辑的字段，避免把审核状态、资料元数据等只读值回传。 */
  function editableValues(
    source?: Partial<MerchantInfo> | Partial<MerchantSaveRequest>,
  ): MerchantSaveRequest {
    const target = createEmptyForm();
    if (!source) return target;
    const sourceValues = source as Partial<Record<keyof MerchantSaveRequest, unknown>>;
    for (const key of Object.keys(target) as Array<keyof MerchantSaveRequest>) {
      const value = sourceValues[key];
      if (value !== undefined) {
        (target as Record<string, unknown>)[key] = Array.isArray(value)
          ? value.map((item) => (typeof item === 'object' && item !== null ? { ...item } : item))
          : value;
      }
    }
    target.contactPhone = normalizeInternationalPhone(source.phoneCountryCode, source.contactPhone);
    target.phoneCountryCode = '';
    return target;
  }

  function requiredRule(messageKey: string, trigger = 'blur') {
    return { required: true, message: () => t(messageKey), trigger };
  }

  /** 构造通用必填规则，字段名称通过国际化键生成。 */
  function requiredFieldRule(fieldKey: string, trigger = 'blur') {
    return {
      required: true,
      message: () => t('merchant.info.requiredField', { field: t(fieldKey) }),
      trigger,
    };
  }

  /** 构造至少选择一项的数组字段规则。 */
  function requiredArrayRule(fieldKey: string) {
    return {
      type: 'array',
      required: true,
      min: 1,
      message: () => t('merchant.info.requiredSelection', { field: t(fieldKey) }),
      trigger: 'change',
    };
  }

  /** 构造数值必填规则，允许业务上合法的零值。 */
  function requiredNumberRule(fieldKey: string) {
    return {
      type: 'number',
      required: true,
      message: () => t('merchant.info.requiredField', { field: t(fieldKey) }),
      trigger: 'change',
    };
  }

  /** 构造布尔选择规则，避免未选择时被界面默认展示为“否”。 */
  function requiredBooleanRule(fieldKey: string) {
    return {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (typeof value === 'boolean') {
          callback();
          return;
        }
        callback(new Error(t('merchant.info.requiredSelection', { field: t(fieldKey) })));
      },
      trigger: 'change',
    };
  }

  /** 校验联系电话已包含国家区号，并符合国际号码长度范围。 */
  function internationalPhoneRule() {
    return {
      validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
        if (!value || isCompleteInternationalPhone(String(value))) {
          callback();
          return;
        }
        callback(new Error(t('merchant.info.invalidContactPhone')));
      },
      trigger: 'blur',
    };
  }

  /** 在输入框失焦时统一移除国际电话号码中的展示分隔符。 */
  function normalizeContactPhone() {
    form.contactPhone = normalizeInternationalPhone(undefined, form.contactPhone);
  }

  /** 已保存的脱敏证件号可复用；新增人员或换证时才要求输入明文。 */
  function relatedPersonIdRules(person: MerchantRelatedPerson) {
    return person.idNumberMasked ? [] : [requiredFieldRule('merchant.info.idNumber')];
  }

  function printableEnglishRule(messageKey: string) {
    return { pattern: /^[\x20-\x7E]*$/, message: () => t(messageKey), trigger: 'blur' };
  }

  async function goNext() {
    if (activeStep.value === 0) {
      const valid = await formRef.value
        ?.validateField(draftValidationFields)
        .then(() => true)
        .catch(() => false);
      if (!valid) return;
    }
    if (activeStep.value === 2) {
      const valid = await formRef.value
        ?.validateField(['contactName', 'contactEmail', 'contactPhone'])
        .then(() => true)
        .catch(() => false);
      if (!valid) return;
    }
    activeStep.value = Math.min(activeStep.value + 1, steps.length - 1);
  }

  async function saveDraft() {
    const valid = await formRef.value
      ?.validateField(draftValidationFields)
      .then(() => true)
      .catch(() => false);
    if (!valid) return;
    fillBillingDescriptor();
    emit('save', { request: editableValues(form), submitAfterSave: false });
  }

  async function saveAndSubmit() {
    if (!reviewSubmissionAllowed.value) {
      ElMessage.warning(t(reviewStatusAlert.value.titleKey));
      return;
    }
    if (!props.merchant?.merchantId) {
      ElMessage.warning(t('merchant.info.saveBeforeSubmit'));
      return;
    }
    if (!(await validateSubmissionFields())) return;
    const readinessIssues = collectClientReadinessIssues();
    if (readinessIssues.length) {
      activeStep.value = readinessIssues[0].step;
      ElMessage.warning(
        t('merchant.info.completeReadinessItem', {
          item: readinessIssueText(readinessIssues[0].code, t),
        }),
      );
      return;
    }
    fillBillingDescriptor();
    emit('save', { request: editableValues(form), submitAfterSave: true });
  }

  /** 校验全部提交字段，并切换到最靠前的错误步骤。 */
  async function validateSubmissionFields() {
    if (!formRef.value) return false;
    try {
      await formRef.value.validate();
      return true;
    } catch (invalidFields) {
      const fields =
        invalidFields && typeof invalidFields === 'object' ? Object.keys(invalidFields) : [];
      activeStep.value = fields.reduce(
        (step, field) => Math.min(step, submissionFieldStep(field)),
        steps.length - 1,
      );
      ElMessage.warning(t('merchant.info.completeRequiredFields'));
      return false;
    }
  }

  /** 将动态表单字段映射到可见步骤，避免错误停留在隐藏页签。 */
  function submissionFieldStep(field: string) {
    if (field.startsWith('relatedPersons.')) return 2;
    return submissionFieldSteps[field] ?? 0;
  }

  /**
   * 补充无法由单字段规则表达的人员角色和资料文件门禁。
   * 后端返回的 readinessIssues 仍是保存后提交审核的最终依据。
   */
  function collectClientReadinessIssues(): Array<{ code: string; step: number }> {
    const issues: Array<{ code: string; step: number }> = [];
    const persons = form.relatedPersons || [];
    if (!persons.length) {
      issues.push({ code: 'RELATED_PERSONS', step: 2 });
    } else {
      const hasRole = (role: string) =>
        persons.some((person) => (person.personRoles || []).includes(role));
      if (!hasRole('LEGAL_REPRESENTATIVE')) {
        issues.push({ code: 'LEGAL_REPRESENTATIVE', step: 2 });
      }
      if (form.merchantType !== 'SOLE_TRADER' && !hasRole('UBO')) {
        issues.push({ code: 'UBO', step: 2 });
      }
      if (persons.some((person) => !person.idNumber?.trim() && !person.idNumberMasked?.trim())) {
        issues.push({ code: 'RELATED_PERSON_ID_NUMBER', step: 2 });
      }
    }

    const documentTypes = new Set(
      (props.merchant?.documents || [])
        .map((document) => document.documentType?.toUpperCase())
        .filter((type): type is string => Boolean(type)),
    );
    if (![...documentTypes].some((type) => businessRegistrationDocumentTypes.has(type))) {
      issues.push({ code: 'BUSINESS_REGISTRATION_DOCUMENT', step: 5 });
    }
    if (![...documentTypes].some((type) => relatedPersonIdDocumentTypes.has(type))) {
      issues.push({ code: 'RELATED_PERSON_ID_DOCUMENT', step: 5 });
    }
    return issues;
  }

  function fillBillingDescriptor() {
    if (!form.billingDescriptor) {
      form.billingDescriptor = form.merchantName;
    }
  }

  function addRelatedPerson() {
    form.relatedPersons = [...(form.relatedPersons || []), createEmptyPerson()];
  }

  function removeRelatedPerson(index: number) {
    form.relatedPersons = (form.relatedPersons || []).filter((_, itemIndex) => itemIndex !== index);
  }

  function createEmptyPerson(): MerchantRelatedPerson {
    return {
      fullName: '',
      personRoles: [],
      nationality: '',
      residenceCountry: '',
      idType: 'PASSPORT',
    };
  }

  function syncOperatingAddress() {
    if (form.operatingSameAsRegistered !== true) return;
    form.operatingCountry = form.countryCode;
    form.regionCode = form.registeredState;
    form.city = form.registeredCity;
    form.postalCode = form.registeredPostcode;
    form.addressLine = form.registeredAddress;
  }

  function handleMccChange(value: unknown) {
    form.merchantCategoryCode =
      Array.isArray(value) && value.length ? String(value[value.length - 1] || '') : '';
  }

  function resolveMccPath(mccCode?: string) {
    if (!mccCode) return [];
    for (const level1 of props.formOptions.mccOptions) {
      for (const level2 of level1.children || []) {
        const leaf = (level2.children || []).find((item) => item.value === mccCode);
        if (leaf) return [level1.value, level2.value, leaf.value];
      }
    }
    return [];
  }

  function localizeMccNode(node: MerchantOptionNode): MerchantOptionNode {
    const children = (node.children || []).map(localizeMccNode);
    return {
      ...node,
      label: children.length ? optionName(node) || node.label : codeNameLabel(node),
      children,
    };
  }

  function codeNameLabel(item: MerchantOptionItem | MerchantOptionNode) {
    const name = optionName(item);
    return name ? `${item.value} (${name})` : item.label || item.value;
  }

  function currencyOptionLabel(item: MerchantOptionItem) {
    return `${codeNameLabel(item)} · ${t('base.currency.minorUnit')}: ${item.fractionDigits ?? '-'}`;
  }

  function optionName(item: Pick<MerchantOptionItem, 'nameCn' | 'nameEn'>) {
    const english = String(locale.value).toLowerCase().startsWith('en');
    return (english ? item.nameEn : item.nameCn) || item.nameCn || item.nameEn || '';
  }

  function optionText(group: string, value?: string) {
    if (!value) return '-';
    const key = `merchant.info.options.${group}.${value}`;
    const translated = t(key);
    return translated === key ? value : translated;
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

  const CountrySelect = defineComponent({
    props: {
      modelValue: { type: String, default: '' },
      options: { type: Array as PropType<MerchantOptionItem[]>, required: true },
      labeler: { type: Function as PropType<(item: MerchantOptionItem) => string>, required: true },
    },
    emits: ['update:modelValue'],
    setup(componentProps, { emit: componentEmit }) {
      return () =>
        h(
          ElSelect,
          {
            modelValue: componentProps.modelValue,
            filterable: true,
            clearable: true,
            style: 'width:100%',
            'onUpdate:modelValue': (value) => componentEmit('update:modelValue', value),
          },
          () =>
            componentProps.options.map((item) =>
              h(ElOption, {
                key: item.value,
                label: componentProps.labeler(item),
                value: item.value,
              }),
            ),
        );
    },
  });

  const AmountInput = defineComponent({
    props: { modelValue: Number, currency: String },
    emits: ['update:modelValue'],
    setup(componentProps, { emit: componentEmit }) {
      return () =>
        h('div', { class: 'amount-input' }, [
          h(ElInputNumber, {
            modelValue: componentProps.modelValue,
            min: 0,
            precision: 2,
            controlsPosition: 'right',
            style: 'width:100%;min-width:0',
            'onUpdate:modelValue': (value) => componentEmit('update:modelValue', value),
          }),
          h('span', { class: 'amount-input__currency' }, componentProps.currency || '-'),
        ]);
    },
  });

  const PercentInput = defineComponent({
    props: { modelValue: Number },
    emits: ['update:modelValue'],
    setup(componentProps, { emit: componentEmit }) {
      return () =>
        h(ElInputNumber, {
          modelValue: componentProps.modelValue,
          min: 0,
          max: 100,
          precision: 2,
          controlsPosition: 'right',
          style: 'width:100%',
          'onUpdate:modelValue': (value) => componentEmit('update:modelValue', value),
        });
    },
  });
</script>

<style scoped>
  :global(.merchant-profile-form.el-drawer) {
    background: #f3f6fb;
  }

  :global(.merchant-profile-form.el-drawer .el-drawer__header) {
    min-height: 62px;
    margin-bottom: 0;
    padding: 18px 24px;
    border-bottom: 1px solid #dfe6f1;
    background: #fff;
  }

  :global(.merchant-profile-form.el-drawer .el-drawer__title) {
    color: #0f2552;
    font-size: 18px;
    font-weight: 700;
  }

  :global(.merchant-profile-form.el-drawer .el-drawer__body) {
    overflow: hidden;
    padding: 0;
  }

  :global(.merchant-profile-form.el-drawer .el-drawer__footer) {
    padding: 11px 24px;
    border-top: 1px solid #dfe6f1;
    background: #fff;
    box-shadow: 0 -8px 22px rgb(15 37 82 / 6%);
  }

  .merchant-profile-form__body {
    height: 100%;
    overflow: auto;
    padding: 16px 20px 26px;
    background: #f3f6fb;
  }

  .merchant-profile-form__context {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) minmax(280px, auto);
    gap: 16px;
    align-items: center;
    margin-bottom: 12px;
    padding: 15px 18px;
    border: 1px solid #cfddf0;
    border-radius: 6px;
    background: #fff;
    box-shadow: 0 3px 12px rgb(30 64 175 / 5%);
  }

  .merchant-profile-form__mark,
  .form-section__icon {
    display: grid;
    place-items: center;
    color: #1769e0;
    background: #eaf2ff;
  }

  .merchant-profile-form__mark {
    width: 58px;
    height: 58px;
    border-radius: 6px;
    border: 1px solid #d7e5ff;
  }

  .merchant-profile-form__mark svg {
    width: 29px;
  }

  .merchant-profile-form__context-copy {
    min-width: 0;
  }

  .merchant-profile-form__context-copy > span,
  .merchant-profile-form__application span {
    display: block;
    color: #75839a;
    font-size: 12px;
  }

  .merchant-profile-form__heading {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
    margin-top: 3px;
  }

  .merchant-profile-form__heading strong {
    min-width: 0;
    overflow: hidden;
    color: #0f2552;
    font-size: 18px;
    line-height: 1.4;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .merchant-profile-form__heading :deep(.el-tag) {
    flex: 0 0 auto;
    border-radius: 3px;
    font-weight: 600;
  }

  .merchant-profile-form__context-copy p {
    margin: 2px 0 0;
    overflow: hidden;
    color: #52627a;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .merchant-profile-form__metadata {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .merchant-profile-form__metadata span {
    padding: 2px 7px;
    border: 1px solid #dce6f5;
    border-radius: 3px;
    color: #3e506e;
    background: #f8fafd;
    font-size: 11px;
    font-weight: 600;
  }

  .merchant-profile-form__application {
    display: grid;
    grid-template-columns: minmax(160px, 1fr) 92px;
    min-width: 280px;
    gap: 18px;
    padding-left: 18px;
    border-left: 1px solid #dfe6f1;
  }

  .merchant-profile-form__application strong {
    display: block;
    margin-top: 4px;
    overflow: hidden;
    color: #263a5c;
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .merchant-profile-form__workflow {
    margin-bottom: 14px;
    padding: 15px 18px 12px;
    overflow: hidden;
    border: 1px solid #cfddf0;
    border-radius: 6px;
    background: #fff;
  }

  .merchant-profile-form__steps {
    min-width: 980px;
  }

  .merchant-profile-form__steps :deep(.el-step__icon) {
    width: 30px;
    height: 30px;
    border-width: 1px;
    border-color: #d5dfec;
    background: #f5f8fc;
    font-size: 12px;
  }

  .merchant-profile-form__steps :deep(.el-step__head.is-process .el-step__icon) {
    color: #fff;
    border-color: #1769e0;
    background: #1769e0;
    box-shadow: 0 0 0 4px #e7f0ff;
  }

  .merchant-profile-form__steps :deep(.el-step__head.is-finish .el-step__icon) {
    color: #fff;
    border-color: #0f9f77;
    background: #0f9f77;
  }

  .merchant-profile-form__steps :deep(.el-step__line) {
    top: 14px;
    height: 1px;
    background: #d8e1ee;
  }

  .merchant-profile-form__steps :deep(.el-step__title) {
    margin-top: 3px;
    line-height: 1.3;
  }

  .merchant-profile-form__step-title {
    color: #4e5f79;
    font-size: 12px;
    font-weight: 600;
  }

  .merchant-profile-form__steps
    :deep(.el-step__title.is-process)
    .merchant-profile-form__step-title {
    color: #1769e0;
    font-weight: 700;
  }

  .merchant-profile-form__step-description {
    display: -webkit-box;
    min-height: 27px;
    max-width: 150px;
    margin: 2px auto 0;
    overflow: hidden;
    color: #8a97aa;
    font-size: 10px;
    line-height: 1.35;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .merchant-profile-form__mobile-progress {
    display: none;
  }

  .form-section {
    min-height: max(330px, calc(100vh - 390px));
    padding: 15px 18px 7px;
    border: 1px solid #cfddf0;
    border-radius: 6px;
    background: #fff;
  }

  .form-section__header,
  .related-persons__toolbar,
  .related-person__header,
  .merchant-profile-form__footer,
  .document-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .form-section__header {
    margin-bottom: 14px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e3e9f2;
  }

  .form-section__title {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 10px;
  }

  .form-section__icon {
    width: 28px;
    height: 28px;
    flex: 0 0 28px;
    border: 1px solid #2563eb;
    border-radius: 4px;
    color: #fff;
    background: #2563eb;
  }

  .form-section__icon svg {
    width: 17px;
  }

  .form-section__header h3 {
    margin: 0;
    color: #142a52;
    font-size: 15px;
    font-weight: 700;
  }

  .form-section__header span {
    display: block;
    margin-top: 2px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .form-section__step-index {
    color: #c1ccdc !important;
    font-size: 18px !important;
    font-weight: 700;
    line-height: 1;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(240px, 1fr));
    column-gap: 16px;
  }

  .form-grid__full {
    grid-column: 1 / -1;
  }

  .form-section :deep(.el-form-item) {
    margin-bottom: 15px;
  }

  .form-section :deep(.el-form-item__label) {
    height: 32px;
    padding-right: 10px;
    color: #53627a;
    font-size: 12px;
    font-weight: 600;
    line-height: 32px;
  }

  .form-section :deep(.el-input__wrapper),
  .form-section :deep(.el-select__wrapper),
  .form-section :deep(.el-cascader .el-input__wrapper),
  .form-section :deep(.el-date-editor.el-input__wrapper),
  .form-section :deep(.el-input-number .el-input__wrapper) {
    min-height: 32px;
    border-radius: 4px;
    box-shadow: 0 0 0 1px #d7e0ed inset;
  }

  .form-section :deep(.el-input__wrapper:hover),
  .form-section :deep(.el-select__wrapper:hover) {
    box-shadow: 0 0 0 1px #9ebcf0 inset;
  }

  .form-section :deep(.el-textarea__inner) {
    border-radius: 4px;
    box-shadow: 0 0 0 1px #d7e0ed inset;
  }

  .related-persons {
    margin-top: 2px;
    padding-top: 16px;
    border-top: 1px solid #e8edf5;
  }

  .related-persons__toolbar {
    margin-bottom: 12px;
  }

  .related-person {
    margin-bottom: 14px;
    padding: 14px 16px 0;
    border: 1px solid #d8e2ef;
    border-radius: 5px;
    background: #f9fbfe;
  }

  .related-person__header {
    margin-bottom: 10px;
  }

  .document-toolbar {
    justify-content: flex-start;
    margin-bottom: 14px;
    padding: 11px 12px;
    border: 1px solid #dce5f1;
    border-radius: 5px;
    background: #f8fafd;
  }

  .section-alert {
    margin-bottom: 14px;
  }

  .preview-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .preview-grid > div {
    min-width: 0;
    padding: 13px 14px;
    border: 1px solid #d9e3f0;
    border-radius: 4px;
    border-left: 3px solid #3b82f6;
    background: #f9fbfe;
  }

  .preview-grid span,
  .preview-grid strong {
    display: block;
  }

  .preview-grid span {
    margin-bottom: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }

  .preview-grid strong {
    overflow: hidden;
    color: var(--el-text-color-primary);
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .readiness-issues {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .readiness-issues > strong {
    flex-basis: 100%;
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 600;
  }

  .amount-input {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 56px;
    width: 100%;
  }

  .amount-input__currency {
    display: grid;
    place-items: center;
    border: 1px solid var(--el-border-color);
    border-left: 0;
    border-radius: 0 4px 4px 0;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color-light);
    font-size: 12px;
  }

  .amount-input :deep(.el-input__wrapper) {
    border-radius: 4px 0 0 4px;
  }

  .merchant-profile-form__footer > div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .merchant-profile-form__footer :deep(.el-button) {
    margin-left: 0;
    min-width: 96px;
    border-radius: 4px;
  }

  .merchant-profile-form__footer :deep(.el-button--primary) {
    box-shadow: 0 3px 8px rgb(37 99 235 / 16%);
  }

  @media (max-width: 1180px) {
    .form-grid {
      grid-template-columns: repeat(2, minmax(240px, 1fr));
    }
  }

  @media (max-width: 760px) {
    :global(.merchant-profile-form.el-drawer) {
      width: 100vw !important;
    }

    :global(.merchant-profile-form.el-drawer .el-drawer__header) {
      margin-bottom: 0;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :global(.merchant-profile-form.el-drawer .el-drawer__footer) {
      padding: 10px 12px 12px;
    }

    .merchant-profile-form__body {
      padding: 14px 12px 20px;
    }

    .merchant-profile-form__context {
      grid-template-columns: auto minmax(0, 1fr);
      padding: 13px;
    }

    .merchant-profile-form__application {
      grid-column: 1 / -1;
      grid-template-columns: minmax(0, 1fr) 74px;
      min-width: 0;
      padding-top: 10px;
      padding-left: 0;
      border-top: 1px solid #e4e9f2;
      border-left: 0;
    }

    .merchant-profile-form__heading strong,
    .merchant-profile-form__context-copy p {
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .merchant-profile-form__workflow {
      display: none;
    }

    .merchant-profile-form__steps {
      display: none;
    }

    .merchant-profile-form__mobile-progress {
      display: grid;
      gap: 8px;
      margin-bottom: 14px;
      padding: 11px 12px;
      border: 1px solid #d7e2f0;
      border-radius: 6px;
      background: #fff;
    }

    .merchant-profile-form__mobile-progress > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .merchant-profile-form__mobile-progress > div > span:first-child {
      min-width: 0;
    }

    .merchant-profile-form__mobile-progress strong,
    .merchant-profile-form__mobile-progress small {
      display: block;
    }

    .merchant-profile-form__mobile-progress strong {
      color: var(--el-text-color-primary);
      font-size: 14px;
    }

    .merchant-profile-form__mobile-progress small {
      margin-top: 2px;
      overflow: hidden;
      color: #8290a5;
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .merchant-profile-form__mobile-progress > div > span:last-child {
      flex: 0 0 auto;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .form-section {
      min-height: 0;
      padding: 13px 12px 3px;
    }

    .form-grid,
    .preview-grid {
      grid-template-columns: 1fr;
    }

    .form-grid__full {
      grid-column: auto;
    }

    .form-section__header,
    .document-toolbar,
    .merchant-profile-form__footer {
      align-items: stretch;
      flex-direction: column;
    }

    .form-section__header {
      align-items: center;
      flex-direction: row;
    }

    .document-toolbar > *,
    .document-toolbar :deep(.el-upload),
    .document-toolbar :deep(.el-button) {
      width: 100% !important;
    }

    .merchant-profile-form__footer > div {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .merchant-profile-form__footer :deep(.el-button) {
      width: 100%;
    }

    .merchant-profile-form__footer > div > :last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }
  }
</style>
