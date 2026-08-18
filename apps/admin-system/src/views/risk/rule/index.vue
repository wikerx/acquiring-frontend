<template>
  <div class="app-container risk-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="76px">
      <el-form-item v-if="!isSourceUrlRule" :label="$t('risk.common.scope')">
        <el-select v-model="query.merchantScope" :placeholder="t('risk.common.placeholderSelect')" clearable class="query-select">
          <el-option v-for="item in merchantScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="!isSourceUrlRule" :label="$t('risk.common.ruleName')"><el-input v-model.trim="query.ruleName" clearable @keyup.enter="handleSearch" /></el-form-item>
      <el-form-item :label="$t('risk.common.merchantId')">
        <el-select
          v-model="query.merchantId"
          filterable
          remote
          clearable
          reserve-keyword
          remote-show-suffix
          :remote-method="searchMerchantOptions"
          :loading="merchantLoading"
          :placeholder="t('risk.common.placeholderMerchant')"
          :no-data-text="t('risk.common.noMerchantData')"
          :loading-text="t('risk.common.loadingMerchant')"
          class="query-merchant-select"
          @visible-change="handleQueryMerchantVisibleChange"
        >
          <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="profile.showMatchValue || profile.showCountry" :label="queryMatchLabel">
        <el-input v-if="!profile.showCountry" v-model.trim="sourceUrlQueryValue" :placeholder="profileMatchPlaceholder" clearable @keyup.enter="handleSearch" />
        <el-select v-else v-model="query.matchValue" filterable clearable :placeholder="$t('common.pleaseSelect')">
          <el-option v-for="item in countryOptionsForRule" :key="item.value" :label="item.label" :value="item.value">
            <span class="country-option"><span>{{ item.flagEmoji || '' }}</span><span>{{ item.label }}</span></span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="profile.showLimitType" :label="$t('risk.rule.limitType')">
        <el-select v-model="query.limitType" :placeholder="t('risk.common.placeholderSelect')" filterable clearable class="query-select">
          <el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <template v-if="isThreeDsRule">
        <el-form-item :label="$t('risk.rule.channelCode')">
          <el-select v-model="query.channelCode" :placeholder="t('risk.common.placeholderSelect')" filterable clearable class="query-select" @change="handleThreeDsQueryChannelChange">
            <el-option v-for="item in threeDsChannelOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('risk.rule.paymentMethod')">
          <el-select v-model="query.paymentMethod" :placeholder="t('risk.common.placeholderSelect')" filterable clearable class="query-select" @change="handleThreeDsQueryPaymentMethodChange">
            <el-option v-for="item in threeDsQueryPaymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="showThreeDsQueryCardBrandField" :label="$t('risk.common.cardBrand')">
          <el-select v-model="query.cardBrand" :placeholder="t('risk.common.placeholderSelect')" filterable clearable class="query-select">
            <el-option v-for="item in threeDsQueryCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('risk.rule.triggerAction')">
          <el-select v-model="query.triggerAction" :placeholder="t('risk.common.placeholderSelect')" clearable class="query-select">
            <el-option v-for="item in threeDsTriggerActionOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
      </template>
      <el-form-item v-if="profile.showCurrency && !isMerchantLimitRule && !isThreeDsRule" :label="$t('risk.common.currency')"><el-select v-model="query.currency" filterable clearable><el-option v-for="item in options.currencyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
      <el-form-item :label="isSourceUrlRule ? $t('risk.approval.transactionStatus') : $t('common.status')"><el-select v-model="query.status" clearable><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item>
      <el-form-item v-if="isSourceUrlRule" :label="$t('risk.approval.approvalStatus')">
        <el-select v-model="query.approvalStatus" clearable :placeholder="$t('common.pleaseSelect')">
          <el-option :label="$t('risk.approval.pending')" :value="0" />
          <el-option :label="$t('risk.approval.approved')" :value="1" />
          <el-option :label="$t('risk.approval.rejected')" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="isSourceUrlRule" :label="$t('risk.approval.submitSource')">
        <el-select v-model="query.submitSource" clearable :placeholder="$t('common.pleaseSelect')">
          <el-option :label="$t('risk.approval.sourceAdmin')" value="ADMIN" />
          <el-option :label="$t('risk.approval.sourceMerchant')" value="MERCHANT" />
        </el-select>
      </el-form-item>
      <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button></el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="`${current.permissionPrefix}:add`">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="selectedRows.length === 0" @click="handleBatchDelete" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('risk.common.batchDelete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Download" size="small" @click="handleTemplate" v-hasPermi="`${current.permissionPrefix}:template`">{{ $t('risk.common.template') }}</el-button></el-col>
      <el-col :span="1.5"><el-upload :show-file-list="false" accept=".xlsx,.xls,.csv" :auto-upload="false" :on-change="handleImport" v-hasPermi="`${current.permissionPrefix}:import`"><el-button type="info" plain :icon="Upload" size="small">{{ $t('common.import') }}</el-button></el-upload></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="`${current.permissionPrefix}:export`">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
    </el-row>

    <StandardTable table-key="risk-rule" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column v-if="!isSourceUrlRule" prop="ruleName" :label="$t('risk.common.ruleName')" min-width="180" align="center" show-overflow-tooltip />
      <el-table-column v-if="!isSourceUrlRule" prop="merchantScope" :label="$t('risk.common.scope')" width="110" align="center">
        <template #default="{ row }">{{ scopeText(row.merchantScope) }}</template>
      </el-table-column>
      <el-table-column prop="merchantId" :label="$t('risk.common.merchantId')" width="130" align="center" show-overflow-tooltip />
      <el-table-column v-if="isThreeDsRule" prop="merchantName" :label="$t('risk.common.merchantName')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.showMatchMode" prop="matchMode" :label="$t('risk.rule.matchMode')" width="120" align="center">
        <template #default="{ row }">{{ matchModeText(row.matchMode) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" prop="ruleType" :label="$t('risk.rule.ruleType')" width="132" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ threeDsRuleTypeText(row.ruleType) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" prop="channelCode" :label="$t('risk.rule.channelCode')" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ threeDsChannelText(row.channelCode) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" :label="$t('risk.rule.paymentMethodCardBrand')" min-width="170" align="center">
        <template #default="{ row }">
          <span class="payment-card-brand-cell">
            <PaymentLogoGroup v-if="threeDsPaymentCardBrandLogos(row).length" :keys="threeDsPaymentCardBrandLogos(row)" fallback="text" size="sm" align="center" />
            <span v-else>{{ threeDsPaymentCardBrandText(row) }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" :label="$t('risk.rule.amountCondition')" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ threeDsAmountConditionText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" prop="riskCondition" :label="$t('risk.rule.riskCondition')" width="140" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ threeDsRiskConditionText(row.riskCondition) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" prop="triggerAction" :label="$t('risk.rule.triggerAction')" width="130" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ threeDsTriggerActionText(row.triggerAction) }}</template>
      </el-table-column>
      <el-table-column v-if="isThreeDsRule" prop="priority" :label="$t('risk.rule.priority')" width="90" align="center" />
      <el-table-column v-if="isSourceUrlRule" prop="sourceUrl" :label="profileMatchLabel" min-width="190" align="center" show-overflow-tooltip />
      <el-table-column v-if="isSourceUrlRule" prop="sourceHost" :label="$t('risk.profile.rule.sourceHostLabel')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="isSourceUrlRule" :label="$t('risk.approval.approvalStatus')" width="116" align="center">
        <template #default="{ row }"><el-tag size="small" :type="approvalTagType(row.approvalStatus)" effect="plain">{{ approvalStatusText(row.approvalStatus) }}</el-tag></template>
      </el-table-column>
      <el-table-column v-if="isSourceUrlRule" :label="$t('risk.approval.submitSource')" width="108" align="center">
        <template #default="{ row }">{{ submitSourceText(row.submitSource) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showMatchValue && !isSourceUrlRule" prop="matchValue" :label="profileMatchLabel" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.showCardBrand" prop="cardBrand" :label="$t('risk.common.cardBrand')" width="124" align="center">
        <template #default="{ row }">
          <span class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(row.cardBrand)" :logo-key="cardBrandLogo(row.cardBrand)" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(row.cardBrand) || '-' }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="profile.showCountry" prop="matchValue" :label="profileMatchLabel" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ countryText(row.matchValue) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showLimitType" prop="limitType" :label="$t('risk.rule.limitType')" width="130" align="center">
        <template #default="{ row }">{{ limitTypeText(row.limitType) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showAmount" :label="$t('risk.rule.limitAmount')" width="140" align="center">
        <template #default="{ row }">{{ limitAmountText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showCurrency && !isMerchantLimitRule" prop="currency" :label="$t('risk.common.currency')" width="100" align="center" />
      <el-table-column v-if="profile.showFrequency" :label="$t('risk.rule.statDimension')" width="130" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ frequencyDimensionText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showFrequency" :label="$t('risk.rule.elementSet')" min-width="240" align="center">
        <template #default="{ row }">
          <div class="frequency-element-tags">
            <el-tag v-for="item in frequencyElementTexts(row)" :key="item" type="primary" effect="dark" size="small">{{ item }}</el-tag>
            <span v-if="!frequencyElementTexts(row).length">-</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column v-if="profile.showFrequency" :label="$t('risk.rule.windowValue')" width="120" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ frequencyWindowText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showFrequency" :label="$t('risk.rule.maxTransactionCount')" width="130" align="center">
        <template #default="{ row }">{{ frequencyAllowedCountText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="profile.showFrequency" :label="$t('risk.rule.maxSuccessCount')" width="130" align="center">
        <template #default="{ row }">{{ frequencySuccessCountText(row) }}</template>
      </el-table-column>
      <el-table-column v-if="!isThreeDsRule" prop="riskLevel" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(row.riskLevel)">{{ riskLevelText(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column v-if="!isThreeDsRule" prop="decisionAction" :label="$t('risk.common.decisionAction')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(row.decisionAction)">{{ decisionActionText(row.decisionAction) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="isSourceUrlRule ? $t('risk.approval.transactionStatus') : $t('common.status')" width="112" align="center"><template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" :disabled="isStatusUpdating(row.id) || (isSourceUrlRule && row.approvalStatus !== 1)" @change="(status: number) => handleStatus(row, status)" v-hasPermi="`${current.permissionPrefix}:status`" /></template></el-table-column>
      <el-table-column :label="$t('common.updateTime')" width="180" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
      <el-table-column :label="$t('common.operation')" :width="isSourceUrlRule ? 380 : 320" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="`${current.permissionPrefix}:detail`">{{ $t('common.detail') }}</el-button>
          <el-button v-if="isSourceUrlRule && row.approvalStatus === 0" size="small" type="primary" link :icon="CircleCheck" @click="openApproval(row)" v-hasPermi="`${current.permissionPrefix}:status`">{{ $t('risk.approval.approve') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button>
          <el-button v-if="isMerchantLimitRule" size="small" type="primary" link :icon="Edit" @click="openMerchantLimitDimensionEdit(row)" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('risk.rule.dimensionEdit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formTitle" v-model="formOpen" width="820px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="122px">
        <div class="rule-section">
          <div class="rule-section-title">{{ t('risk.rule.sectionBase') }}</div>
          <div class="rule-section-desc">{{ currentRuleGuidance }}</div>
        </div>
        <el-row :gutter="16">
          <el-col v-if="!isSourceUrlRule" :span="12"><el-form-item :label="$t('risk.common.scope')" prop="merchantScope"><el-select v-model="form.merchantScope" style="width:100%" @change="handleFormScopeChange"><el-option v-for="item in merchantScopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12">
            <el-form-item :label="$t('risk.common.merchantId')" prop="merchantId">
              <el-select
                v-model="form.merchantId"
                filterable
                remote
                clearable
                reserve-keyword
                remote-show-suffix
                :disabled="!isSourceUrlRule && form.merchantScope === 'GLOBAL'"
                :remote-method="searchMerchantOptions"
                :loading="merchantLoading"
                :placeholder="t('risk.common.placeholderMerchant')"
                :no-data-text="t('risk.common.noMerchantData')"
                :loading-text="t('risk.common.loadingMerchant')"
                style="width:100%"
                @change="handleMerchantChange"
                @visible-change="handleMerchantVisibleChange"
              >
                <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item v-if="!isSourceUrlRule" :label="$t('risk.common.ruleName')" prop="ruleName"><el-input v-model.trim="form.ruleName" maxlength="128" :placeholder="t('risk.rule.placeholder.ruleName')" /></el-form-item>
        <template v-if="isThreeDsRule">
          <div class="rule-section">
            <div class="rule-section-title">{{ t('risk.rule.threeDsPolicy') }}</div>
            <div class="rule-section-desc">{{ ruleConditionGuidance }}</div>
          </div>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item :label="$t('risk.rule.ruleType')" prop="ruleType"><el-select v-model="form.ruleType" style="width:100%"><el-option v-for="item in threeDsRuleTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="12"><el-form-item :label="$t('risk.rule.channelCode')" prop="channelCode"><el-select v-model="form.channelCode" filterable style="width:100%" @change="handleThreeDsFormChannelChange"><el-option v-for="item in threeDsChannelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item :label="$t('risk.rule.paymentMethod')" prop="paymentMethod"><el-select v-model="form.paymentMethod" filterable style="width:100%" @change="handleThreeDsFormPaymentMethodChange"><el-option v-for="item in threeDsFormPaymentMethodOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col v-if="showThreeDsFormCardBrandField && formMode === 'add'" :span="12"><el-form-item :label="$t('risk.common.cardBrand')" prop="cardBrands"><el-select v-model="form.cardBrands" multiple collapse-tags collapse-tags-tooltip filterable style="width:100%" @change="normalizeThreeDsFormCardBrand"><el-option v-for="item in threeDsFormCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col v-if="showThreeDsFormCardBrandField && formMode === 'edit'" :span="12"><el-form-item :label="$t('risk.common.cardBrand')" prop="cardBrand"><el-select v-model="form.cardBrand" filterable style="width:100%" @change="normalizeThreeDsFormCardBrand"><el-option v-for="item in threeDsFormCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8"><el-form-item :label="$t('risk.rule.amountMatchType')" prop="amountMatchType"><el-select v-model="form.amountMatchType" style="width:100%" @change="handleThreeDsAmountMatchTypeChange"><el-option v-for="item in threeDsAmountMatchTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="16">
              <el-form-item :label="$t('risk.rule.amountCondition')" prop="amountMin">
                <div v-if="form.amountMatchType === 'ALL'" class="three-ds-amount-condition is-static">金额大于等于 0 {{ FIXED_THREE_DS_CURRENCY }}</div>
                <div v-else-if="form.amountMatchType === 'GE'" class="three-ds-amount-condition">
                  <span>金额大于等于</span>
                  <div class="amount-currency-input"><el-input-number v-model="form.amountMin" :min="0.01" :precision="2" controls-position="right" placeholder="请输入" /><span>{{ FIXED_THREE_DS_CURRENCY }}</span></div>
                </div>
                <div v-else-if="form.amountMatchType === 'LE'" class="three-ds-amount-condition">
                  <span>金额小于等于</span>
                  <div class="amount-currency-input"><el-input-number v-model="form.amountMax" :min="0.01" :precision="2" controls-position="right" placeholder="请输入" /><span>{{ FIXED_THREE_DS_CURRENCY }}</span></div>
                </div>
                <div v-else class="three-ds-amount-condition is-range">
                  <div class="amount-currency-input"><el-input-number v-model="form.amountMin" :min="0.01" :precision="2" controls-position="right" placeholder="请输入" /><span>{{ FIXED_THREE_DS_CURRENCY }}</span></div>
                  <span>至</span>
                  <div class="amount-currency-input"><el-input-number v-model="form.amountMax" :min="0.01" :precision="2" controls-position="right" placeholder="请输入" /><span>{{ FIXED_THREE_DS_CURRENCY }}</span></div>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8"><el-form-item :label="$t('risk.rule.riskCondition')" prop="riskCondition"><el-select v-model="form.riskCondition" style="width:100%"><el-option v-for="item in threeDsRiskConditionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('risk.rule.triggerAction')" prop="triggerAction"><el-select v-model="form.triggerAction" style="width:100%"><el-option v-for="item in threeDsTriggerActionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('risk.rule.priority')" prop="priority"><el-input-number v-model="form.priority" :min="1" :step="1" :precision="0" controls-position="right" style="width:100%" /></el-form-item></el-col>
          </el-row>
        </template>
        <div v-if="showRuleConditionSection" class="rule-section">
          <div class="rule-section-title">{{ t('risk.rule.sectionCondition') }}</div>
          <div class="rule-section-desc">{{ ruleConditionGuidance }}</div>
        </div>
        <el-row :gutter="16">
          <el-col v-if="profile.showMatchMode" :span="12"><el-form-item :label="$t('risk.rule.matchMode')" prop="matchMode"><el-select v-model="form.matchMode" clearable style="width:100%"><el-option v-for="item in currentMatchModeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showMatchValue" :span="isSourceUrlRule ? 24 : profile.showCardBrand ? 16 : 12">
            <el-form-item :label="profileMatchLabel" :prop="isSourceUrlRule ? 'sourceUrl' : 'matchValue'">
              <el-input v-model.trim="sourceUrlFormValue" :type="isSourceUrlRule && formMode === 'add' ? 'textarea' : 'text'" :rows="3" :placeholder="profileMatchPlaceholder" @input="handleMatchValueInput" />
            </el-form-item>
          </el-col>
          <el-col v-if="profile.showCardBrand" :span="8">
            <el-form-item :label="$t('risk.common.cardBrand')">
              <span class="card-brand-preview is-rule" :class="{ 'is-pending': !form.cardBrand }">
                <PaymentLogoMark v-if="formCardBrandLogo" :logo-key="formCardBrandLogo" size="sm" compact fallback="text" />
                <span v-else>{{ formCardBrandText }}</span>
              </span>
            </el-form-item>
          </el-col>
        </el-row>
        <template v-if="isMerchantLimitRule">
          <el-form-item :label="$t('risk.rule.limitType')" prop="limitType">
            <el-select v-if="isMerchantLimitMultiEdit" v-model="merchantLimitForm.limitTypes" multiple filterable clearable collapse-tags collapse-tags-tooltip :max-collapse-tags="2" style="width:100%" @change="syncMerchantLimitAmounts">
              <el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
            <el-select v-else v-model="form.limitType" filterable clearable style="width:100%" @change="handleLimitTypeChange">
              <el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>
          </el-form-item>
          <div v-if="merchantLimitAmountTypes.length" class="limit-amount-panel">
            <div v-for="limitType in merchantLimitAmountTypes" :key="limitType" class="limit-amount-row">
              <span class="limit-type-label">{{ limitTypeText(limitType) }}：</span>
              <el-input-number v-model="merchantLimitForm.amounts[limitType]" :min="0.01" :precision="2" :placeholder="$t('risk.rule.limitAmount')" />
              <el-tag size="small" effect="plain">{{ merchantLimitCurrencyText(form) }}</el-tag>
            </div>
          </div>
        </template>
        <el-row v-else :gutter="16">
          <el-col v-if="profile.showLimitType" :span="8"><el-form-item :label="$t('risk.rule.limitType')" prop="limitType"><el-select v-model="form.limitType" filterable clearable style="width:100%" @change="handleLimitTypeChange"><el-option v-for="item in limitTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="showAmountMinInput" :span="8"><el-form-item :label="$t('risk.rule.amountMin')" prop="amountMin"><el-input-number v-model="form.amountMin" :min="0.000001" :precision="6" controls-position="right" style="width:100%" /></el-form-item></el-col>
          <el-col v-if="showAmountMaxInput" :span="8"><el-form-item :label="$t('risk.rule.amountMax')" prop="amountMax"><el-input-number v-model="form.amountMax" :min="0.000001" :precision="6" controls-position="right" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col v-if="profile.showCurrency && !isMerchantLimitRule && !isThreeDsRule" :span="8"><el-form-item :label="$t('risk.common.currency')" prop="currency"><el-select v-model="form.currency" filterable clearable style="width:100%"><el-option v-for="item in options.currencyOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col v-if="profile.showCountry" :span="8"><el-form-item :label="profileMatchLabel" prop="matchValue"><el-select v-model="form.matchValue" filterable clearable style="width:100%"><el-option v-for="item in countryOptionsForRule" :key="item.value" :label="item.label" :value="item.value"><span class="country-option"><span>{{ item.flagEmoji || '' }}</span><span>{{ item.label }}</span></span></el-option></el-select></el-form-item></el-col>
        </el-row>
        <div v-if="profile.showFrequency" class="frequency-config-panel">
          <div class="rule-section">
            <div class="rule-section-title">{{ t('risk.rule.elementConfig') }}</div>
            <div class="rule-section-desc">{{ t('risk.rule.frequencyConfigDesc') }}</div>
          </div>
          <el-form-item :label="$t('risk.rule.elementConfig')" prop="frequencyElements">
            <el-checkbox-group v-model="frequencyForm.elements" class="frequency-elements">
              <el-checkbox-button v-for="item in frequencyElementOptions" :key="item.value" :value="item.value">{{ item.label }}</el-checkbox-button>
            </el-checkbox-group>
          </el-form-item>
          <el-row :gutter="16">
            <el-col :span="8"><el-form-item :label="$t('risk.rule.statDimension')" prop="frequencyStatisticDimension"><el-select v-model="frequencyForm.statDimension" style="width:100%"><el-option v-for="item in frequencyDimensionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('risk.rule.windowValue')" prop="frequencyWindowValue"><el-input-number v-model="frequencyForm.windowValue" :min="1" controls-position="right" style="width:100%" /></el-form-item></el-col>
            <el-col :span="8"><el-form-item :label="$t('risk.rule.windowUnitLabel')" prop="frequencyWindowUnit"><el-select v-model="frequencyForm.windowUnit" style="width:100%"><el-option v-for="item in frequencyWindowUnitOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item :label="$t('risk.rule.allowedCount')" prop="frequencyAllowedCount"><el-input-number v-model="frequencyForm.allowedCount" :min="1" controls-position="right" style="width:100%" @change="handleFrequencyAllowedCountChange" /></el-form-item></el-col>
            <el-col :span="12"><el-form-item :label="$t('risk.rule.successCount')" prop="frequencySuccessCount"><el-input-number v-model="frequencyForm.successCount" :min="0" :max="frequencyForm.allowedCount || 1" controls-position="right" style="width:100%" /></el-form-item></el-col>
          </el-row>
        </div>
        <el-form-item v-else-if="profile.showElements" :label="$t('risk.rule.elementsJson')" prop="elementsJson"><el-input v-model.trim="form.elementsJson" type="textarea" :rows="3" placeholder='{"elements":["cardFingerprint","ip"]}' /></el-form-item>
        <el-row v-if="!isThreeDsRule" :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('risk.common.riskLevel')"><el-select v-model="form.riskLevel" style="width:100%"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('risk.common.decisionAction')"><el-select v-model="form.decisionAction" style="width:100%"><el-option v-for="item in decisionActionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item :label="isSourceUrlRule ? $t('risk.approval.transactionStatus') : $t('common.status')"><el-select v-model="form.status" style="width:100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item>
        <el-form-item :label="$t('common.remark')"><el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button><el-button @click="formOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <el-dialog v-model="approvalOpen" :title="$t('risk.approval.sourceUrlTitle')" width="520px" append-to-body destroy-on-close>
      <el-form :model="approvalForm" label-width="112px" size="small">
        <el-form-item :label="$t('risk.profile.rule.sourceUrlLabel')">
          <code class="approval-target">{{ approvalRow?.sourceUrl || '-' }}</code>
        </el-form-item>
        <el-form-item :label="$t('risk.approval.result')">
          <el-radio-group v-model="approvalForm.approvalStatus" @change="handleApprovalResultChange">
            <el-radio-button :value="1">{{ $t('risk.approval.approved') }}</el-radio-button>
            <el-radio-button :value="2">{{ $t('risk.approval.rejected') }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="approvalForm.approvalStatus === 1" :label="$t('risk.approval.transactionStatus')">
          <el-switch v-model="approvalForm.status" :active-value="1" :inactive-value="0" :active-text="$t('risk.approval.transactionAllowed')" :inactive-text="$t('risk.approval.transactionProhibited')" />
        </el-form-item>
        <el-form-item :label="$t('risk.approval.remark')" :required="approvalForm.approvalStatus === 2">
          <el-input v-model.trim="approvalForm.approvalRemark" type="textarea" :rows="4" maxlength="500" show-word-limit :placeholder="$t('risk.approval.remarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" :loading="approvalSaving" @click="submitApproval">{{ $t('common.confirm') }}</el-button><el-button @click="approvalOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <CommonDetailDrawer v-model:visible="detailOpen" :title="$t('common.detail')" size="lg">
      <el-descriptions v-if="detailRow" :column="1" border size="small">
        <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
          <span v-if="item.cardBrand" class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(String(item.value || ''))" :logo-key="cardBrandLogo(String(item.value || ''))" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(String(item.value || '')) || '-' }}</span>
          </span>
          <el-tag v-else-if="item.riskLevel" size="small" :type="riskLevelTagType(String(item.value || ''))">{{ riskLevelText(item.value) }}</el-tag>
          <el-tag v-else-if="item.decisionAction" size="small" :type="decisionActionTagType(String(item.value || ''))">{{ decisionActionText(item.value) }}</el-tag>
          <el-tag v-else-if="item.status" size="small" :type="item.value === 1 ? 'success' : 'info'">{{ statusText(item.value) }}</el-tag>
          <BaseDateTime v-else-if="item.time" :value="String(item.value || '')" />
          <div v-else-if="item.frequencyPolicy && detailRow" class="frequency-detail-grid">
            <div class="frequency-detail-cell">
              <span class="frequency-detail-label">{{ $t('risk.rule.statDimension') }}</span>
              <strong>{{ frequencyDimensionText(detailRow) }}</strong>
            </div>
            <div class="frequency-detail-cell is-elements">
              <span class="frequency-detail-label">{{ $t('risk.rule.elementSet') }}</span>
              <div class="frequency-element-tags is-detail">
                <el-tag v-for="element in frequencyElementTexts(detailRow)" :key="element" type="primary" effect="dark" size="small">{{ element }}</el-tag>
                <span v-if="!frequencyElementTexts(detailRow).length">-</span>
              </div>
            </div>
            <div class="frequency-detail-cell">
              <span class="frequency-detail-label">{{ $t('risk.rule.windowValue') }}</span>
              <strong>{{ frequencyWindowText(detailRow) }}</strong>
            </div>
            <div class="frequency-detail-cell">
              <span class="frequency-detail-label">{{ $t('risk.rule.maxTransactionCount') }}</span>
              <strong>{{ frequencyAllowedCountText(detailRow) }}</strong>
            </div>
            <div class="frequency-detail-cell">
              <span class="frequency-detail-label">{{ $t('risk.rule.maxSuccessCount') }}</span>
              <strong>{{ frequencySuccessCountText(detailRow) }}</strong>
            </div>
          </div>
          <span v-else-if="item.paymentCardBrand && detailRow" class="payment-card-brand-cell">
            <PaymentLogoGroup v-if="threeDsPaymentCardBrandLogos(detailRow).length" :keys="threeDsPaymentCardBrandLogos(detailRow)" fallback="text" size="sm" />
            <span v-else>{{ item.value || '-' }}</span>
          </span>
          <el-tag v-else-if="item.threeDsRiskCondition" size="small" :type="threeDsRiskConditionTagType(String(item.value || ''))">{{ threeDsRiskConditionText(item.value) }}</el-tag>
          <el-tag v-else-if="item.threeDsTriggerAction" size="small" :type="threeDsTriggerActionTagType(String(item.value || ''))">{{ threeDsTriggerActionText(item.value) }}</el-tag>
          <span v-else>{{ item.value || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </CommonDetailDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { CircleCheck, Delete, Download, Edit, Plus, Refresh, Search, Upload, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { UploadFile } from 'element-plus';
import { PaymentLogoGroup, PaymentLogoMark, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { listChannelOptions, searchChannelCapabilities, type ChannelCapability, type ChannelOption } from '@/api/channel';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import { approveRiskSourceUrl, batchRemoveRiskRecords, createRiskRule, createRiskSourceUrls, downloadRiskTemplate, exportRiskConfig, getRiskOptions, importRiskConfig, pageRiskRules, removeRiskRecord, updateRiskRule, updateRiskStatus, type RiskOptions, type RiskRecord, type RiskRuleQuery } from '@/api/risk';
import { cardBrandLabel, cardBrandLogoKeyByValue, detectCardBrand, emptyRiskOptions, localizeRiskOptions, resolveRiskFunction, resolveRiskRuleProfile, riskFunctionName, riskOptionLabel } from '@/views/risk/shared';
import { cardLogoKeys, loadDictOptions, paymentLogoKeys, type SelectOption } from '@/views/channel/shared';

const route = useRoute();
const { locale, t } = useI18n();

/**
 * 内风控规则配置页负责把不同规则类型映射成同一套列表、弹窗和导入导出交互；
 * 规则语义只在管理端做配置约束，实时交易决策由后续风控服务统一解释。
 */
const current = computed(() => resolveRiskFunction(route.path, true));
const profile = computed(() => resolveRiskRuleProfile(current.value));
const isSourceUrlRule = computed(() => current.value.functionCode === 'sourceUrl');
const isMerchantLimitRule = computed(() => current.value.functionCode === 'merchantLimit');
const isThreeDsRule = computed(() => current.value.functionCode === 'threeDs');
const currentFunctionName = computed(() => riskFunctionName(t, current.value));
const profileMatchLabel = computed(() => t(profile.value.matchLabelKey));
const queryMatchLabel = computed(() => isSourceUrlRule.value ? t('risk.profile.label.sourceUrl') : profileMatchLabel.value);
const profileMatchPlaceholder = computed(() => t(profile.value.matchPlaceholderKey));
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<RiskRecord[]>([]);
const selectedRows = ref<RiskRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const options = ref<RiskOptions>(emptyRiskOptions());
const formOpen = ref(false);
const detailOpen = ref(false);
const detailRow = ref<RiskRecord | null>(null);
const approvalOpen = ref(false);
const approvalSaving = ref(false);
const approvalRow = ref<RiskRecord>();
const approvalForm = reactive({ approvalStatus: 1 as 1 | 2, approvalRemark: '', status: 1 });
const formRef = ref<FormInstance>();
const formMode = ref<'add' | 'edit' | 'dimensionEdit'>('add');
const editingId = ref<number>();
const statusUpdatingIds = ref<Set<number>>(new Set());
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const channelOptions = ref<ChannelOption[]>([]);
const channelCapabilities = ref<ChannelCapability[]>([]);
const acquiringPaymentMethodOptions = ref<SelectOption[]>([]);
const query = reactive<RiskRuleQuery>({});
const form = reactive<RiskRecord>({ status: 1, merchantScope: 'GLOBAL', riskLevel: 'MEDIUM', decisionAction: 'REVIEW', elementsJson: '{}' } as RiskRecord);
type DetailItem = {
  label: string;
  value?: string | number;
  cardBrand?: boolean;
  paymentCardBrand?: boolean;
  threeDsRiskCondition?: boolean;
  threeDsTriggerAction?: boolean;
  riskLevel?: boolean;
  decisionAction?: boolean;
  status?: boolean;
  time?: boolean;
  frequencyPolicy?: boolean;
};
type MerchantLimitDimensionSnapshot = Partial<Record<string, RiskRecord>>;
const frequencyForm = reactive({
  elements: [] as string[],
  statDimension: 'ANY_ELEMENT',
  windowValue: 1,
  windowUnit: 'HOUR',
  allowedCount: 1,
  successCount: 0,
});
const merchantLimitForm = reactive({
  limitTypes: [] as string[],
  amounts: {} as Record<string, number | undefined>,
});
const merchantLimitDimensionRows = ref<MerchantLimitDimensionSnapshot>({});
const MERCHANT_LIMIT_CURRENCY = 'USD';
const merchantLimitRelationTypes = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;
const ALL_DIMENSION = 'ALL';
const BANK_CARD_PAYMENT_METHOD = 'BANK_CARD';
const FIXED_THREE_DS_CURRENCY = 'USD';
const threeDsRuleTypeOptions = computed(() => [
  { label: t('risk.rule.threeDsRuleType.RISK_STRATEGY'), value: 'RISK_STRATEGY' },
  { label: t('risk.rule.threeDsRuleType.EXEMPTION_STRATEGY'), value: 'EXEMPTION_STRATEGY' },
  { label: t('risk.rule.threeDsRuleType.CHANNEL_POLICY'), value: 'CHANNEL_POLICY' },
]);
const threeDsChannelOptions = computed(() => [
  { label: t('risk.rule.allDimension'), value: ALL_DIMENSION },
  ...channelOptions.value.map((item) => ({ label: `${item.channelCode} (${item.channelName})`, value: item.channelCode })),
]);
const allThreeDsPaymentMethodOptions = computed(() => {
  const optionsFromDict = uniqueOptions(acquiringPaymentMethodOptions.value);
  return optionsFromDict.length ? optionsFromDict : [{ label: t('risk.rule.paymentMethodOption.BANK_CARD'), value: BANK_CARD_PAYMENT_METHOD }];
});
const allThreeDsCardBrandOptions = computed(() => uniqueOptions(options.value.cardBrandOptions.map((item) => ({ label: item.label, value: item.value }))));
const threeDsFormPaymentMethodOptions = computed(() => withAllDimension(threeDsPaymentOptionsForChannel(form.channelCode)));
const threeDsQueryPaymentMethodOptions = computed(() => withAllDimension(threeDsPaymentOptionsForChannel(query.channelCode)));
const threeDsFormCardBrandOptions = computed(() => withAllDimension(threeDsCardBrandOptionsForChannel(form.channelCode)));
const threeDsQueryCardBrandOptions = computed(() => withAllDimension(threeDsCardBrandOptionsForChannel(query.channelCode)));
const threeDsPaymentMethodTextOptions = computed(() => withAllDimension(allThreeDsPaymentMethodOptions.value));
const threeDsCardBrandTextOptions = computed(() => [
  { label: t('risk.rule.allDimension'), value: ALL_DIMENSION },
  ...allThreeDsCardBrandOptions.value,
]);
const showThreeDsFormCardBrandField = computed(() => form.paymentMethod === BANK_CARD_PAYMENT_METHOD);
const showThreeDsQueryCardBrandField = computed(() => query.paymentMethod === BANK_CARD_PAYMENT_METHOD);
const threeDsAmountMatchTypeOptions = computed(() => [
  { label: t('risk.rule.threeDsAmountMatchType.ALL'), value: 'ALL' },
  { label: t('risk.rule.threeDsAmountMatchType.GE'), value: 'GE' },
  { label: t('risk.rule.threeDsAmountMatchType.LE'), value: 'LE' },
  { label: t('risk.rule.threeDsAmountMatchType.BETWEEN'), value: 'BETWEEN' },
]);
const threeDsRiskConditionOptions = computed(() => [
  { label: t('risk.rule.threeDsRiskCondition.ANY'), value: 'ANY' },
  { label: t('risk.rule.threeDsRiskCondition.LOW_AND_ABOVE'), value: 'LOW_AND_ABOVE' },
  { label: t('risk.rule.threeDsRiskCondition.MEDIUM_AND_ABOVE'), value: 'MEDIUM_AND_ABOVE' },
  { label: t('risk.rule.threeDsRiskCondition.HIGH_AND_ABOVE'), value: 'HIGH_AND_ABOVE' },
  { label: t('risk.rule.threeDsRiskCondition.CRITICAL_ONLY'), value: 'CRITICAL_ONLY' },
]);
const threeDsTriggerActionOptions = computed(() => [
  { label: t('risk.rule.threeDsTriggerAction.FORCE_3DS'), value: 'FORCE_3DS' },
  { label: t('risk.rule.threeDsTriggerAction.SKIP_3DS'), value: 'SKIP_3DS' },
  { label: t('risk.rule.threeDsTriggerAction.FOLLOW_DEFAULT'), value: 'FOLLOW_DEFAULT' },
]);
const frequencyElementOptions = computed(() => [
  { label: t('risk.rule.element.cardNo'), value: 'cardNo' },
  { label: t('risk.rule.element.cardFingerprint'), value: 'cardFingerprint' },
  { label: t('risk.rule.element.ip'), value: 'ip' },
  { label: t('risk.rule.element.email'), value: 'email' },
  { label: t('risk.rule.element.phone'), value: 'phone' },
  { label: t('risk.rule.element.customerId'), value: 'customerId' },
  { label: t('risk.rule.element.deviceFingerprint'), value: 'deviceFingerprint' },
]);
const frequencyDimensionOptions = computed(() => [
  { label: t('risk.rule.dimension.anyElement'), value: 'ANY_ELEMENT' },
  { label: t('risk.rule.dimension.elementCombination'), value: 'ELEMENT_COMBINATION' },
]);
const frequencyWindowUnitOptions = computed(() => [
  { label: t('risk.rule.windowUnit.minute'), value: 'MINUTE' },
  { label: t('risk.rule.windowUnit.hour'), value: 'HOUR' },
  { label: t('risk.rule.windowUnit.day'), value: 'DAY' },
]);
const matchModeOptions = computed(() => [
  { label: t('risk.rule.matchModeOption.EXACT'), value: 'EXACT' },
  { label: t('risk.rule.matchModeOption.DOMAIN'), value: 'DOMAIN' },
  { label: t('risk.rule.matchModeOption.CONTAINS'), value: 'CONTAINS' },
  { label: t('risk.rule.matchModeOption.REGEX'), value: 'REGEX' },
]);
const currentMatchModeOptions = computed(() => {
  if (current.value.functionCode === 'sourceUrl') {
    return matchModeOptions.value.filter((item) => ['DOMAIN', 'EXACT', 'CONTAINS'].includes(item.value));
  }
  return matchModeOptions.value;
});
const countryOptionsForRule = computed(() => options.value.countryOptions.map((item) => ({
  ...item,
  label: item.extra ? `${item.label}（${item.extra}）` : item.label,
  value: item.extra || item.value,
})));
const merchantScopeOptions = computed(() => localizeRiskOptions(options.value.merchantScopeOptions, t, 'merchantScope'));
const statusOptions = computed(() => localizeRiskOptions(options.value.statusOptions, t, 'status'));
const riskLevelOptions = computed(() => localizeRiskOptions(options.value.riskLevelOptions, t, 'riskLevel'));
const decisionActionOptions = computed(() => localizeRiskOptions(options.value.decisionActionOptions, t, 'decisionAction'));
const limitTypeOptions = computed(() => localizeRiskOptions(options.value.limitTypeOptions, t, 'limitType'));
const sourceUrlQueryValue = computed({
  get: () => isSourceUrlRule.value ? query.sourceUrl : query.matchValue,
  set: (value?: string) => {
    if (isSourceUrlRule.value) {
      query.sourceUrl = value;
      return;
    }
    query.matchValue = value;
  },
});
const sourceUrlFormValue = computed({
  get: () => isSourceUrlRule.value ? form.sourceUrl : form.matchValue,
  set: (value?: string) => {
    if (isSourceUrlRule.value) {
      form.sourceUrl = value;
      return;
    }
    form.matchValue = value;
  },
});
const rules = computed<FormRules>(() => ({
  merchantScope: [{ validator: validateMerchantScope, trigger: 'change' }],
  merchantId: [{ validator: validateMerchant, trigger: 'change' }],
  ruleName: [{ validator: validateRuleName, trigger: 'blur' }],
  matchMode: [{ validator: validateMatchMode, trigger: 'change' }],
  matchValue: [{ validator: validateRuleMatchValue, trigger: ['blur', 'change'] }],
  sourceUrl: [{ validator: validateRuleMatchValue, trigger: ['blur', 'change'] }],
  limitType: [{ validator: validateLimitType, trigger: 'change' }],
  currency: [{ validator: validateCurrency, trigger: 'change' }],
  amountMin: [{ validator: validateAmountRange, trigger: 'change' }],
  amountMax: [{ validator: validateAmountRange, trigger: 'change' }],
  timeWindowSeconds: [{ validator: validatePositiveFrequency, trigger: 'change' }],
  thresholdCount: [{ validator: validatePositiveFrequency, trigger: 'change' }],
  elementsJson: [{ validator: validateElementsJson, trigger: 'blur' }],
  frequencyStatisticDimension: [{ validator: validateFrequencyDimension, trigger: 'change' }],
  frequencyWindowValue: [{ validator: validateFrequencyWindowValue, trigger: 'change' }],
  frequencyWindowUnit: [{ validator: validateFrequencyWindowUnit, trigger: 'change' }],
  frequencyAllowedCount: [{ validator: validateFrequencyAllowedCount, trigger: 'change' }],
  frequencySuccessCount: [{ validator: validateFrequencySuccessCount, trigger: 'change' }],
  frequencyElements: [{ validator: validateFrequencyElements, trigger: 'change' }],
  ruleType: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  channelCode: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  paymentMethod: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  cardBrand: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  cardBrands: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  amountMatchType: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  riskCondition: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  triggerAction: [{ validator: validateThreeDsRequired, trigger: 'change' }],
  priority: [{ validator: validateThreeDsPriority, trigger: 'change' }],
}));
const formTitle = computed(() => {
  const action = formMode.value === 'dimensionEdit' ? t('risk.rule.dimensionEdit') : formMode.value === 'add' ? t('common.add') : t('common.edit');
  return `${action} - ${currentFunctionName.value}`;
});
const formCardBrandLogo = computed(() => cardBrandLogo(form.cardBrand));
const formCardBrandText = computed(() => form.cardBrand ? cardBrandDisplay(form.cardBrand) : t('risk.common.cardBrandAutoPending'));
const showRuleConditionSection = computed(() => !isThreeDsRule.value && (profile.value.showMatchValue || profile.value.showCountry || profile.value.showLimitType || profile.value.showFrequency));
const showAmountMinInput = computed(() => profile.value.showAmount && !isMerchantLimitRule.value && String(form.limitType || '') === 'SINGLE_MIN');
const showAmountMaxInput = computed(() => profile.value.showAmount && !isMerchantLimitRule.value && !!form.limitType && String(form.limitType) !== 'SINGLE_MIN');
const showThreeDsAmountMinInput = computed(() => ['GE', 'BETWEEN'].includes(String(form.amountMatchType || '')));
const showThreeDsAmountMaxInput = computed(() => ['LE', 'BETWEEN'].includes(String(form.amountMatchType || '')));
const isMerchantLimitMultiEdit = computed(() => formMode.value === 'add' || formMode.value === 'dimensionEdit');
const merchantLimitAmountTypes = computed(() => isMerchantLimitMultiEdit.value ? merchantLimitForm.limitTypes : form.limitType ? [String(form.limitType)] : []);
const currentRuleGuidance = computed(() => t(`risk.rule.guidance.${current.value.functionCode}`));
const ruleConditionGuidance = computed(() => t(`risk.rule.conditionGuidance.${current.value.functionCode}`));
const detailItems = computed<DetailItem[]>(() => {
  const row = (detailRow.value || {}) as Partial<RiskRecord>;
  if (isMerchantLimitRule.value) {
    return [
      { label: t('risk.common.ruleName'), value: row.ruleName },
      { label: t('risk.common.scope'), value: scopeText(row.merchantScope) },
      { label: t('risk.common.merchantId'), value: row.merchantId },
      { label: t('risk.rule.limitType'), value: merchantLimitDetailLimitText(row) },
      { label: t('risk.common.riskLevel'), value: row.riskLevel, riskLevel: true },
      { label: t('risk.common.decisionAction'), value: row.decisionAction, decisionAction: true },
      { label: t('common.status'), value: row.status, status: true },
      { label: t('common.remark'), value: row.remark },
      { label: t('common.createTime'), value: row.createTime, time: true },
      { label: t('common.updateTime'), value: row.updateTime, time: true },
    ];
  }
  if (current.value.functionCode === 'frequency') {
    return [
      { label: t('risk.common.ruleName'), value: row.ruleName },
      { label: t('risk.common.scope'), value: scopeText(row.merchantScope) },
      { label: t('risk.common.merchantId'), value: row.merchantId },
      { label: t('risk.rule.frequencyPolicy'), value: frequencySummary(row), frequencyPolicy: true },
      { label: t('risk.common.riskLevel'), value: row.riskLevel, riskLevel: true },
      { label: t('risk.common.decisionAction'), value: row.decisionAction, decisionAction: true },
      { label: t('common.status'), value: row.status, status: true },
      { label: t('common.remark'), value: row.remark },
      { label: t('common.createTime'), value: row.createTime, time: true },
      { label: t('common.updateTime'), value: row.updateTime, time: true },
    ];
  }
  if (isThreeDsRule.value) {
    return [
      { label: t('risk.common.ruleName'), value: row.ruleName },
      { label: t('risk.common.scope'), value: scopeText(row.merchantScope) },
      { label: t('risk.common.merchantId'), value: row.merchantId },
      { label: t('risk.common.merchantName'), value: row.merchantName },
      { label: t('risk.rule.ruleType'), value: threeDsRuleTypeText(row.ruleType) },
      { label: t('risk.rule.channelCode'), value: threeDsChannelText(row.channelCode) },
      { label: t('risk.rule.paymentMethodCardBrand'), value: threeDsPaymentCardBrandText(row), paymentCardBrand: true },
      { label: t('risk.rule.amountCondition'), value: threeDsAmountConditionText(row) },
      { label: t('risk.rule.riskCondition'), value: row.riskCondition, threeDsRiskCondition: true },
      { label: t('risk.rule.triggerAction'), value: row.triggerAction, threeDsTriggerAction: true },
      { label: t('risk.rule.priority'), value: row.priority },
      { label: t('common.status'), value: row.status, status: true },
      { label: t('common.remark'), value: row.remark },
      { label: t('common.createTime'), value: row.createTime, time: true },
      { label: t('common.updateTime'), value: row.updateTime, time: true },
    ];
  }
  return [
    ...(isSourceUrlRule.value ? [{ label: t('risk.common.merchantId'), value: row.merchantId }] : []),
    ...(!isSourceUrlRule.value ? [{ label: t('risk.common.ruleName'), value: row.ruleName }] : []),
    ...(profile.value.showMatchMode ? [{ label: t('risk.rule.matchMode'), value: matchModeText(row.matchMode) }] : []),
    ...(profile.value.showCountry ? [{ label: profileMatchLabel.value, value: countryText(row.matchValue) }] : []),
    ...(isSourceUrlRule.value ? [{ label: profileMatchLabel.value, value: row.sourceUrl }, { label: t('risk.profile.rule.sourceHostLabel'), value: row.sourceHost }] : []),
    ...(isSourceUrlRule.value ? [
      { label: t('risk.approval.approvalStatus'), value: approvalStatusText(row.approvalStatus) },
      { label: t('risk.approval.submitSource'), value: submitSourceText(row.submitSource) },
      { label: t('risk.approval.remark'), value: row.approvalRemark },
      { label: t('risk.approval.reviewBy'), value: row.reviewBy },
      { label: t('risk.approval.reviewTime'), value: row.reviewTime, time: true },
    ] : []),
    ...(profile.value.showMatchValue && !isSourceUrlRule.value ? [{ label: profileMatchLabel.value, value: row.matchValue }] : []),
    ...(profile.value.showCardBrand ? [{ label: t('risk.common.cardBrand'), value: row.cardBrand, cardBrand: true }] : []),
    ...(profile.value.showLimitType ? [{ label: t('risk.rule.limitType'), value: limitTypeText(row.limitType) }] : []),
    ...(profile.value.showAmount ? [{ label: t('risk.rule.limitAmount'), value: limitAmountText(row) }] : []),
    ...(profile.value.showCurrency ? [{ label: t('risk.common.currency'), value: row.currency }] : []),
    ...(profile.value.showFrequency ? [{ label: t('risk.rule.frequencyPolicy'), value: frequencySummary(row) }] : []),
    ...(!isSourceUrlRule.value ? [{ label: t('risk.common.scope'), value: scopeText(row.merchantScope) }] : []),
    ...(!isSourceUrlRule.value ? [{ label: t('risk.common.merchantId'), value: row.merchantId }] : []),
    { label: t('risk.common.riskLevel'), value: row.riskLevel, riskLevel: true },
    { label: t('risk.common.decisionAction'), value: row.decisionAction, decisionAction: true },
    { label: t('common.status'), value: row.status, status: true },
    { label: t('common.remark'), value: row.remark },
    { label: t('common.createTime'), value: row.createTime, time: true },
    { label: t('common.updateTime'), value: row.updateTime, time: true },
  ];
});

onMounted(async () => {
  const [riskOptions, channels, capabilities, paymentMethods] = await Promise.all([
    getRiskOptions(),
    listChannelOptions(),
    searchChannelCapabilities({ pageNo: 1, pageSize: 500, businessType: 'ACQUIRING', capabilityStatus: 1 }),
    loadDictOptions('acquiring_payment_method', String(locale.value)).catch(() => []),
  ]);
  options.value = riskOptions;
  channelOptions.value = channels;
  channelCapabilities.value = capabilities.records || [];
  acquiringPaymentMethodOptions.value = paymentMethods;
  await loadData();
});
watch(() => route.path, () => handleReset());

async function loadData() {
  loading.value = true;
  try {
    const result = await pageRiskRules(current.value.functionCode, { ...ruleQueryPayload(), pageNo: page.value, pageSize: pageSize.value });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}
function handleSearch() { page.value = 1; loadData(); }
function handleReset() { Object.assign(query, { merchantScope: undefined, merchantId: undefined, ruleName: undefined, matchValue: undefined, sourceUrl: undefined, sourceHost: undefined, limitType: undefined, ruleType: undefined, channelCode: undefined, paymentMethod: undefined, cardBrand: undefined, currency: undefined, triggerAction: undefined, status: undefined, approvalStatus: undefined, submitSource: undefined }); handleSearch(); }
function ruleQueryPayload() {
  const payload = { ...query };
  if (isMerchantLimitRule.value) {
    payload.currency = undefined;
  }
  if (!isThreeDsRule.value) {
    payload.ruleType = undefined;
    payload.channelCode = undefined;
    payload.paymentMethod = undefined;
    payload.cardBrand = undefined;
    payload.triggerAction = undefined;
  }
  if (isThreeDsRule.value && !showThreeDsQueryCardBrandField.value) {
    payload.cardBrand = undefined;
    payload.currency = undefined;
  }
  return payload;
}
function resetForm(row?: RiskRecord) {
  Object.keys(form).forEach((key) => delete (form as any)[key]);
  Object.assign(form, { status: 1, merchantScope: isSourceUrlRule.value ? 'MERCHANT' : 'GLOBAL', riskLevel: defaultRuleRiskLevel(), decisionAction: defaultRuleDecisionAction(), elementsJson: '{}', ...row });
  if (isSourceUrlRule.value) {
    form.merchantScope = 'MERCHANT';
    form.matchMode = undefined;
    form.matchValue = undefined;
  }
  if (isThreeDsRule.value) {
    resetThreeDsForm(row);
  }
  if (profile.value.showCardBrand) {
    form.cardBrand = detectCardBrand(form.matchValue, options.value.cardBrandOptions) || form.cardBrand;
  }
  resetFrequencyForm(row);
  resetMerchantLimitForm(row);
  resetDefaultRuleControls();
  syncCurrentMerchantOption();
}
function openForm(mode: 'add' | 'edit', row?: RiskRecord) { formMode.value = mode; editingId.value = row?.id; merchantLimitDimensionRows.value = {}; resetForm(row); formOpen.value = true; }
async function openMerchantLimitDimensionEdit(row: RiskRecord) {
  if (!isMerchantLimitRule.value) {
    return;
  }
  loading.value = true;
  try {
    const dimensionRows = await loadMerchantLimitDimensionRows(row);
    const seedRow = dimensionRows[0] || row;
    formMode.value = 'dimensionEdit';
    editingId.value = undefined;
    resetForm(seedRow);
    merchantLimitDimensionRows.value = Object.fromEntries(dimensionRows.filter((item) => item.limitType).map((item) => [String(item.limitType), item]));
    merchantLimitForm.limitTypes = dimensionRows.map((item) => String(item.limitType || '')).filter(Boolean);
    merchantLimitForm.amounts = Object.fromEntries(dimensionRows.filter((item) => item.limitType).map((item) => [String(item.limitType), merchantLimitAmount(item)]));
    syncMerchantLimitAmounts();
    formOpen.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    validateFrequencyFormBeforeSubmit();
    validateMerchantLimitFormBeforeSubmit();
    validateThreeDsFormBeforeSubmit();
    const payload = buildRulePayload();
    if (isSourceUrlRule.value && !editingId.value) {
      await createRiskSourceUrls(payload);
    } else if (isMerchantLimitRule.value && formMode.value === 'dimensionEdit') {
      await saveMerchantLimitDimensionRules(payload);
    } else if (isMerchantLimitRule.value && !editingId.value) {
      await createMerchantLimitRules(payload);
    } else {
      editingId.value ? await updateRiskRule(current.value.functionCode, editingId.value, payload) : await createRiskRule(current.value.functionCode, payload);
    }
    ElMessage.success(t('common.saveSuccess'));
    formOpen.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}
function openDetail(row: RiskRecord) { detailRow.value = row; detailOpen.value = true; }
async function handleDelete(row?: RiskRecord) { if (!row?.id) return; await ElMessageBox.confirm(t('risk.common.deleteConfirm', { name: recordDisplayName(row) }), t('common.operationConfirm'), { type: 'warning' }); await removeRiskRecord('RULE', current.value.functionCode, row.id); ElMessage.success(t('common.deleteSuccess')); await loadData(); }
async function handleBatchDelete() {
  const ids = selectedRows.value.map((item) => item.id).filter(Boolean);
  if (ids.length === 0) return;
  await ElMessageBox.confirm(t('risk.common.batchDeleteConfirm', { count: ids.length, name: currentFunctionName.value }), t('common.operationConfirm'), { type: 'warning' });
  await batchRemoveRiskRecords('RULE', current.value.functionCode, ids);
  ElMessage.success(t('common.deleteSuccess'));
  selectedRows.value = [];
  await loadData();
}
async function handleStatus(row: RiskRecord, status: number) {
  if (isSourceUrlRule.value && row.approvalStatus !== 1) {
    ElMessage.warning(t('risk.approval.statusRequiresApproval'));
    return;
  }
  const action = status === 1 ? t('common.enable') : t('common.disable');
  const name = recordDisplayName(row);
  try {
    await ElMessageBox.confirm(t('risk.common.statusToggleTargetConfirm', { action, name, targetType: t('risk.common.riskRule') }), t('common.operationConfirm'), { type: 'warning' });
  } catch {
    return;
  }
  setStatusUpdating(row.id, true);
  try {
    await updateRiskStatus('RULE', current.value.functionCode, row.id, status);
    row.status = status;
    ElMessage.success(t('risk.common.statusToggleSuccess', { action }));
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.statusToggleFailed', { action }));
  } finally {
    setStatusUpdating(row.id, false);
  }
}

function openApproval(row: RiskRecord) {
  approvalRow.value = row;
  Object.assign(approvalForm, { approvalStatus: 1, approvalRemark: '', status: 1 });
  approvalOpen.value = true;
}

function handleApprovalResultChange(value: string | number | boolean | undefined) {
  approvalForm.status = Number(value) === 1 ? 1 : 0;
}

async function submitApproval() {
  if (!approvalRow.value?.id) return;
  if (approvalForm.approvalStatus === 2 && !approvalForm.approvalRemark) {
    ElMessage.warning(t('risk.approval.rejectionReasonRequired'));
    return;
  }
  approvalSaving.value = true;
  try {
    await approveRiskSourceUrl(approvalRow.value.id, {
      approvalStatus: approvalForm.approvalStatus,
      approvalRemark: approvalForm.approvalRemark || undefined,
      status: approvalForm.approvalStatus === 1 ? approvalForm.status : 0,
    });
    ElMessage.success(t('risk.approval.success'));
    approvalOpen.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  } finally {
    approvalSaving.value = false;
  }
}

function approvalStatusText(status?: number) {
  if (status === 0) return t('risk.approval.pending');
  if (status === 1) return t('risk.approval.approved');
  if (status === 2) return t('risk.approval.rejected');
  return '-';
}

function approvalTagType(status?: number): 'warning' | 'success' | 'danger' | 'info' {
  if (status === 0) return 'warning';
  if (status === 1) return 'success';
  if (status === 2) return 'danger';
  return 'info';
}

function submitSourceText(source?: string) {
  if (source === 'ADMIN') return t('risk.approval.sourceAdmin');
  if (source === 'MERCHANT') return t('risk.approval.sourceMerchant');
  return source || '-';
}
function isStatusUpdating(id?: number) { return id ? statusUpdatingIds.value.has(id) : false; }
function setStatusUpdating(id: number | undefined, loading: boolean) {
  if (!id) return;
  const next = new Set(statusUpdatingIds.value);
  loading ? next.add(id) : next.delete(id);
  statusUpdatingIds.value = next;
}
async function handleExport() {
  try {
    await exportRiskConfig('RULE', current.value.functionCode, ruleQueryPayload());
    ElMessage.success(t('risk.common.exportStarted'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.exportFailed'));
  }
}
async function handleTemplate() {
  try {
    await downloadRiskTemplate('RULE', current.value.functionCode);
    ElMessage.success(t('risk.common.templateStarted'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.templateFailed'));
  }
}
async function handleImport(uploadFile: UploadFile) {
  if (!uploadFile.raw) return;
  try {
    const result = await importRiskConfig('RULE', current.value.functionCode, uploadFile.raw);
    ElMessage.success(t('risk.common.importSuccess', { count: result.successCount }));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.importFailed'));
  }
}

function buildRulePayload() {
  const payload = { ...form };
  if (isSourceUrlRule.value) {
    return buildSourceUrlPayload(payload);
  }
  if (payload.merchantScope === 'GLOBAL') {
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (isThreeDsRule.value) {
    return buildThreeDsPayload(payload);
  }
  if (profile.value.showCardBrand) {
    payload.cardBrand = detectCardBrand(payload.matchValue, options.value.cardBrandOptions);
  }
  if (current.value.functionCode === 'merchantLimit') {
    payload.currency = MERCHANT_LIMIT_CURRENCY;
    if (!editingId.value) {
      return payload;
    }
    const amount = merchantLimitAmountValue(merchantLimitForm.amounts[String(payload.limitType || '')]);
    if (payload.limitType === 'SINGLE_MIN') {
      payload.amountMin = amount;
      payload.amountMax = undefined;
    } else {
      payload.amountMax = amount;
      payload.amountMin = undefined;
    }
  }
  if (profile.value.showCountry) {
    payload.matchValue = countryAlpha3Value(payload.matchValue);
  }
  if (profile.value.showFrequency) {
    payload.timeWindowSeconds = frequencyWindowSeconds();
    payload.thresholdCount = frequencyForm.allowedCount;
    payload.elementsJson = JSON.stringify({
      elements: frequencyForm.elements,
      statisticDimension: frequencyForm.statDimension,
      windowUnit: frequencyForm.windowUnit,
      windowValue: frequencyForm.windowValue,
      allowedCount: frequencyForm.allowedCount,
      successCount: frequencyForm.successCount,
    });
  }
  return payload;
}

async function createMerchantLimitRules(payload: Partial<RiskRecord>) {
  for (const limitType of merchantLimitForm.limitTypes) {
    const amount = merchantLimitAmountValue(merchantLimitForm.amounts[limitType]);
    await createRiskRule(current.value.functionCode, {
      ...payload,
      limitType,
      amountMin: limitType === 'SINGLE_MIN' ? amount : undefined,
      amountMax: limitType === 'SINGLE_MIN' ? undefined : amount,
      currency: MERCHANT_LIMIT_CURRENCY,
    });
  }
}

async function saveMerchantLimitDimensionRules(payload: Partial<RiskRecord>) {
  for (const limitType of merchantLimitForm.limitTypes) {
    const amount = merchantLimitAmountValue(merchantLimitForm.amounts[limitType]);
    const row = merchantLimitDimensionRows.value[limitType];
    const request = {
      ...payload,
      limitType,
      amountMin: limitType === 'SINGLE_MIN' ? amount : undefined,
      amountMax: limitType === 'SINGLE_MIN' ? undefined : amount,
      currency: MERCHANT_LIMIT_CURRENCY,
    };
    if (row?.id) {
      await updateRiskRule(current.value.functionCode, row.id, request);
    } else {
      await createRiskRule(current.value.functionCode, request);
    }
  }
}

async function loadMerchantLimitDimensionRows(row: RiskRecord) {
  const result = await pageRiskRules(current.value.functionCode, {
    merchantScope: row.merchantScope,
    merchantId: row.merchantScope === 'MERCHANT' ? row.merchantId : undefined,
    ruleName: row.ruleName,
    matchValue: row.matchValue,
    pageNo: 1,
    pageSize: 5000,
  });
  return result.records.filter((item) => isSameMerchantLimitDimension(item, row));
}

function isSameMerchantLimitDimension(left: Partial<RiskRecord>, right: Partial<RiskRecord>) {
  return String(left.merchantScope || '') === String(right.merchantScope || '')
    && String(left.merchantId || '') === String(right.merchantId || '')
    && String(left.ruleName || '') === String(right.ruleName || '')
    && String(left.matchValue || '') === String(right.matchValue || '');
}

function buildSourceUrlPayload(payload: Partial<RiskRecord>) {
  const sourceUrls = splitSourceUrls(payload.sourceUrl);
  const firstSourceUrl = sourceUrls[0];
  return {
    merchantId: payload.merchantId,
    sourceUrl: firstSourceUrl,
    sourceUrls: editingId.value ? undefined : sourceUrls,
    riskLevel: payload.riskLevel,
    decisionAction: payload.decisionAction,
    effectiveTime: payload.effectiveTime,
    expireTime: payload.expireTime,
    status: payload.status,
    remark: payload.remark,
  };
}

function buildThreeDsPayload(payload: Partial<RiskRecord>) {
  const cardBrands = threeDsSelectedCardBrands();
  const next = {
    ...payload,
    matchMode: undefined,
    matchValue: undefined,
    limitType: undefined,
    timeWindowSeconds: undefined,
    thresholdCount: undefined,
    elementsJson: undefined,
    riskLevel: undefined,
    decisionAction: undefined,
    cardBrands,
    cardBrand: cardBrands[0],
  };
  if (next.merchantScope === 'GLOBAL') {
    next.merchantId = undefined;
    next.merchantName = undefined;
  }
  next.currency = FIXED_THREE_DS_CURRENCY;
  if (next.paymentMethod !== BANK_CARD_PAYMENT_METHOD) {
    next.cardBrand = ALL_DIMENSION;
    next.cardBrands = [ALL_DIMENSION];
  }
  if (next.amountMatchType === 'ALL') {
    next.amountMin = undefined;
    next.amountMax = undefined;
  }
  if (next.amountMatchType === 'GE') {
    next.amountMax = undefined;
  }
  if (next.amountMatchType === 'LE') {
    next.amountMin = undefined;
  }
  return next;
}

function resetFrequencyForm(row?: RiskRecord) {
  const parsed = parseFrequencyJson(row?.elementsJson);
  const seconds = Number(row?.timeWindowSeconds || 3600);
  const fallbackWindow = secondsToFrequencyWindow(seconds);
  frequencyForm.elements = Array.isArray(parsed.elements) ? parsed.elements : [];
  frequencyForm.statDimension = String(parsed.statisticDimension || 'ANY_ELEMENT');
  frequencyForm.windowUnit = String(parsed.windowUnit || fallbackWindow.unit);
  frequencyForm.windowValue = Number(parsed.windowValue || fallbackWindow.value || 1);
  frequencyForm.allowedCount = Number(parsed.allowedCount || row?.thresholdCount || 1);
  frequencyForm.successCount = Number(parsed.successCount || 0);
}

function resetMerchantLimitForm(row?: RiskRecord) {
  merchantLimitForm.limitTypes = row?.limitType ? [String(row.limitType)] : [];
  merchantLimitForm.amounts = row?.limitType ? { [String(row.limitType)]: merchantLimitAmount(row) } : {};
  if (isMerchantLimitRule.value) {
    form.currency = merchantLimitCurrencyText(row);
  }
}

function resetThreeDsForm(row?: Partial<RiskRecord>) {
  form.ruleType = row?.ruleType || 'RISK_STRATEGY';
  form.channelCode = row?.channelCode || ALL_DIMENSION;
  form.paymentMethod = row?.paymentMethod || (formMode.value === 'add' ? BANK_CARD_PAYMENT_METHOD : ALL_DIMENSION);
  form.cardBrand = row?.cardBrand || ALL_DIMENSION;
  form.cardBrands = row?.cardBrand ? [row.cardBrand] : [ALL_DIMENSION];
  form.amountMatchType = row?.amountMatchType || 'ALL';
  form.currency = FIXED_THREE_DS_CURRENCY;
  form.riskCondition = row?.riskCondition || 'ANY';
  form.triggerAction = row?.triggerAction || 'FORCE_3DS';
  form.priority = row?.priority || 100;
  if (form.amountMatchType === 'ALL') {
    form.amountMin = undefined;
    form.amountMax = undefined;
  }
  normalizeThreeDsFormPaymentMethod();
}

function resetDefaultRuleControls() {
  if (isThreeDsRule.value) {
    resetThreeDsForm(form);
  }
}

function parseFrequencyJson(value?: string) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function secondsToFrequencyWindow(seconds: number) {
  if (seconds > 0 && seconds % 86400 === 0) return { unit: 'DAY', value: seconds / 86400 };
  if (seconds > 0 && seconds % 3600 === 0) return { unit: 'HOUR', value: seconds / 3600 };
  if (seconds > 0 && seconds % 60 === 0) return { unit: 'MINUTE', value: seconds / 60 };
  return { unit: 'MINUTE', value: Math.max(Math.ceil(seconds / 60), 1) };
}

function frequencyWindowSeconds() {
  const multiplier = frequencyForm.windowUnit === 'DAY' ? 86400 : frequencyForm.windowUnit === 'HOUR' ? 3600 : 60;
  return Number(frequencyForm.windowValue || 1) * multiplier;
}

function handleFormScopeChange(value: string) {
  if (value === 'GLOBAL') {
    form.merchantId = undefined;
    form.merchantName = undefined;
  } else {
    loadMerchantOptions();
  }
  syncCurrentMerchantOption();
}

async function searchMerchantOptions(keyword: string) {
  const text = keyword.trim();
  await loadMerchantOptions(text);
}

async function loadMerchantOptions(keyword = '') {
  merchantLoading.value = true;
  try {
    const result = await searchMerchants({ pageNo: 1, pageSize: 20, keyword: keyword || undefined });
    merchantOptions.value = mergeMerchantOptions(result.records || []);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    merchantLoading.value = false;
  }
}

function handleMerchantVisibleChange(visible: boolean) {
  if (visible && form.merchantScope === 'MERCHANT' && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}

function handleQueryMerchantVisibleChange(visible: boolean) {
  if (visible && merchantOptions.value.length === 0) {
    loadMerchantOptions();
  }
}

function handleMerchantChange(merchantId?: string) {
  const selected = merchantOptions.value.find((item) => item.merchantId === merchantId);
  form.merchantName = selected?.merchantName;
}

function syncCurrentMerchantOption() {
  if (!form.merchantId) {
    return;
  }
  const exists = merchantOptions.value.some((item) => item.merchantId === form.merchantId);
  if (!exists) {
    merchantOptions.value = [{ id: '0', merchantId: form.merchantId, merchantName: form.merchantName || '', merchantStatus: 1, defaultLocale: 'zh-CN', merchantCategoryCode: '', countryCode: '', settlementCurrency: '', timezone: '', riskLevel: 1 }, ...merchantOptions.value];
  }
}

function mergeMerchantOptions(items: MerchantInfo[]) {
  const map = new Map<string, MerchantInfo>();
  merchantOptions.value.forEach((item) => map.set(item.merchantId, item));
  items.forEach((item) => map.set(item.merchantId, item));
  return Array.from(map.values()).slice(0, 30);
}

function merchantOptionLabel(item: MerchantInfo) {
  return item.merchantName ? `${item.merchantId}（${item.merchantName}）` : item.merchantId;
}

function validateMerchantScope(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (!isSourceUrlRule.value && !form.merchantScope) {
    callback(new Error(t('risk.validation.scopeRequired')));
    return;
  }
  callback();
}

function validateMerchant(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if ((isSourceUrlRule.value || form.merchantScope === 'MERCHANT') && !form.merchantId) {
    callback(new Error(t('risk.validation.merchantRequired')));
    return;
  }
  callback();
}

function validateRuleName(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (!isSourceUrlRule.value && !form.ruleName) {
    callback(new Error(t('risk.validation.ruleNameRequired')));
    return;
  }
  callback();
}

function validateAmountRange(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (isThreeDsRule.value) {
    const amountType = String(form.amountMatchType || 'ALL');
    if (amountType === 'ALL') {
      callback();
      return;
    }
    if (['GE', 'BETWEEN'].includes(amountType) && form.amountMin == null) {
      callback(new Error(t('risk.validation.amountMinRequired')));
      return;
    }
    if (['LE', 'BETWEEN'].includes(amountType) && form.amountMax == null) {
      callback(new Error(t('risk.validation.amountMaxRequired')));
      return;
    }
    if (form.amountMin != null && Number(form.amountMin) <= 0) {
      callback(new Error(t('risk.validation.amountPositive')));
      return;
    }
    if (form.amountMax != null && Number(form.amountMax) <= 0) {
      callback(new Error(t('risk.validation.amountPositive')));
      return;
    }
    if (!hasValidAmountScale(form.amountMin, 2) || !hasValidAmountScale(form.amountMax, 2)) {
      callback(new Error(t('risk.validation.amountScale2')));
      return;
    }
    if (amountType === 'BETWEEN' && form.amountMin != null && form.amountMax != null && Number(form.amountMin) > Number(form.amountMax)) {
      callback(new Error(t('risk.validation.amountRangeInvalid')));
      return;
    }
    callback();
    return;
  }
  if (!profile.value.showAmount) {
    callback();
    return;
  }
  if (String(form.limitType || '') === 'SINGLE_MIN' && form.amountMin == null) {
    callback(new Error(t('risk.validation.amountMinRequired')));
    return;
  }
  if (String(form.limitType || '') === 'SINGLE_MIN' && Number(form.amountMin) <= 0) {
    callback(new Error(t('risk.validation.amountPositive')));
    return;
  }
  if (form.limitType && String(form.limitType) !== 'SINGLE_MIN' && form.amountMax == null) {
    callback(new Error(t('risk.validation.amountMaxRequired')));
    return;
  }
  if (form.limitType && String(form.limitType) !== 'SINGLE_MIN' && Number(form.amountMax) <= 0) {
    callback(new Error(t('risk.validation.amountPositive')));
    return;
  }
  if (form.amountMin != null && form.amountMax != null && Number(form.amountMin) > Number(form.amountMax)) {
    callback(new Error(t('risk.validation.amountRangeInvalid')));
    return;
  }
  callback();
}

function validateRuleMatchValue(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showMatchValue && !profile.value.showCountry) {
    callback();
    return;
  }
  const text = String(isSourceUrlRule.value ? form.sourceUrl : value || '').trim();
  if (!text) {
    callback(new Error(t('risk.validation.matchValueRequired', { label: profileMatchLabel.value })));
    return;
  }
  if (isSourceUrlRule.value) {
    const error = validateSourceUrlInput(text);
    if (error) {
      callback(new Error(error));
      return;
    }
  }
  callback();
}

function validateMatchMode(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showMatchMode && !form.matchMode) {
    callback(new Error(t('risk.validation.matchModeRequired')));
    return;
  }
  if (profile.value.showMatchMode && !currentMatchModeOptions.value.some((item) => item.value === form.matchMode)) {
    callback(new Error(t('risk.validation.matchModeInvalid')));
    return;
  }
  callback();
}

function validateSourceUrlInput(value: string) {
  const urls = splitSourceUrls(value);
  if (!urls.length) {
    return t('risk.validation.matchValueRequired', { label: profileMatchLabel.value });
  }
  if (editingId.value && urls.length > 1) {
    return t('risk.validation.sourceUrlSingleEdit');
  }
  const seenHosts = new Set<string>();
  for (const sourceUrl of urls) {
    const parsed = parseHttpSourceUrl(sourceUrl);
    if (!parsed) {
      return t('risk.validation.sourceUrlProtocol');
    }
    if (seenHosts.has(parsed.hostname)) {
      return t('risk.validation.sourceUrlDuplicate');
    }
    seenHosts.add(parsed.hostname);
  }
  return '';
}

function splitSourceUrls(value?: string) {
  return String(value || '')
    .split(/[\n,，;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseHttpSourceUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function handleLimitTypeChange(value?: string) {
  if (isMerchantLimitRule.value) {
    merchantLimitForm.limitTypes = value ? [value] : [];
    syncMerchantLimitAmounts();
    return;
  }
  if (value === 'SINGLE_MIN') {
    form.amountMax = undefined;
    return;
  }
  form.amountMin = undefined;
}

function handleThreeDsAmountMatchTypeChange(value?: string) {
  if (value === 'ALL') {
    form.amountMin = undefined;
    form.amountMax = undefined;
    form.currency = FIXED_THREE_DS_CURRENCY;
    return;
  }
  if (value === 'GE') {
    form.amountMax = undefined;
  }
  if (value === 'LE') {
    form.amountMin = undefined;
  }
  form.currency = FIXED_THREE_DS_CURRENCY;
}

function handleThreeDsQueryChannelChange() {
  normalizeThreeDsQueryPaymentMethod();
}

function handleThreeDsQueryPaymentMethodChange() {
  normalizeThreeDsQueryCardBrand();
}

function handleThreeDsFormChannelChange() {
  normalizeThreeDsFormPaymentMethod();
}

function handleThreeDsFormPaymentMethodChange() {
  normalizeThreeDsFormCardBrand();
}

function normalizeThreeDsQueryPaymentMethod() {
  query.paymentMethod = normalizeOptionValue(query.paymentMethod, threeDsQueryPaymentMethodOptions.value);
  normalizeThreeDsQueryCardBrand();
}

function normalizeThreeDsQueryCardBrand() {
  if (!showThreeDsQueryCardBrandField.value) {
    query.cardBrand = undefined;
    return;
  }
  query.cardBrand = normalizeOptionValue(query.cardBrand, threeDsQueryCardBrandOptions.value);
}

function normalizeThreeDsFormPaymentMethod() {
  form.paymentMethod = normalizeOptionValue(form.paymentMethod, threeDsFormPaymentMethodOptions.value, ALL_DIMENSION);
  normalizeThreeDsFormCardBrand();
}

function normalizeThreeDsFormCardBrand() {
  if (form.paymentMethod !== BANK_CARD_PAYMENT_METHOD) {
    form.cardBrand = ALL_DIMENSION;
    form.cardBrands = [ALL_DIMENSION];
    return;
  }
  if (formMode.value === 'edit') {
    form.cardBrand = normalizeOptionValue(form.cardBrand, threeDsFormCardBrandOptions.value, ALL_DIMENSION);
    form.cardBrands = form.cardBrand ? [form.cardBrand] : [ALL_DIMENSION];
    return;
  }
  const selected = Array.isArray(form.cardBrands) ? form.cardBrands : form.cardBrand ? [form.cardBrand] : [];
  const normalized = selected
    .map((item) => normalizeOptionValue(item, threeDsFormCardBrandOptions.value))
    .filter((item): item is string => Boolean(item));
  const concreteBrands = normalized.filter((item) => item !== ALL_DIMENSION);
  const next = concreteBrands.length ? Array.from(new Set(concreteBrands)) : [ALL_DIMENSION];
  form.cardBrands = next;
  form.cardBrand = next[0];
}

function syncMerchantLimitAmounts() {
  const next: Record<string, number | undefined> = {};
  for (const limitType of merchantLimitAmountTypes.value) {
    next[limitType] = merchantLimitForm.amounts[limitType] ?? defaultMerchantLimitAmount(limitType);
  }
  merchantLimitForm.amounts = next;
}

function defaultMerchantLimitAmount(limitType: string) {
  if (limitType === 'SINGLE_MIN') {
    return 1;
  }
  if (limitType === 'SINGLE_MAX') {
    return 100;
  }
  return undefined;
}

function merchantLimitAmount(row?: Partial<RiskRecord>) {
  if (!row?.limitType) {
    return undefined;
  }
  return String(row.limitType) === 'SINGLE_MIN' ? row.amountMin : row.amountMax;
}

function merchantLimitAmountValue(amount: number | string | undefined | null) {
  if (amount == null || amount === '') {
    return undefined;
  }
  return Number(Number(amount).toFixed(2));
}

function merchantLimitAmountDisplay(amount: number | string | undefined | null) {
  const value = merchantLimitAmountValue(amount);
  return value == null ? undefined : new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function hasValidMerchantLimitAmountScale(amount: number | string | undefined | null) {
  return hasValidAmountScale(amount, 2);
}

function hasValidAmountScale(amount: number | string | undefined | null, scale: number) {
  if (amount == null || amount === '') {
    return true;
  }
  const decimalPart = String(amount).split('.')[1];
  return !decimalPart || decimalPart.length <= scale;
}

function handleFrequencyAllowedCountChange(value?: number) {
  if (Number(frequencyForm.successCount || 0) > Number(value || 0)) {
    frequencyForm.successCount = Number(value || 0);
  }
}

function validateLimitType(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (isMerchantLimitRule.value && isMerchantLimitMultiEdit.value && merchantLimitForm.limitTypes.length === 0) {
    callback(new Error(t('risk.validation.limitTypeRequired')));
    return;
  }
  if (profile.value.showLimitType && !isMerchantLimitRule.value && !form.limitType) {
    callback(new Error(t('risk.validation.limitTypeRequired')));
    return;
  }
  if (isMerchantLimitRule.value && formMode.value !== 'add' && !form.limitType) {
    callback(new Error(t('risk.validation.limitTypeRequired')));
    return;
  }
  callback();
}

function validateCurrency(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (isThreeDsRule.value) {
    form.currency = FIXED_THREE_DS_CURRENCY;
    callback();
    return;
  }
  if (profile.value.showCurrency && !form.currency) {
    callback(new Error(t('risk.validation.currencyRequired')));
    return;
  }
  callback();
}

function validateThreeDsRequired(rule: { field?: string }, _value: unknown, callback: (error?: Error) => void) {
  if (!isThreeDsRule.value) {
    callback();
    return;
  }
  const field = rule.field as keyof RiskRecord;
  if (field === 'cardBrands' && form.paymentMethod !== BANK_CARD_PAYMENT_METHOD) {
    callback();
    return;
  }
  if (field === 'cardBrands' && formMode.value === 'add' && !threeDsSelectedCardBrands().length) {
    callback(new Error(t('risk.validation.threeDsFieldRequired')));
    return;
  }
  if (field === 'cardBrand' && formMode.value === 'edit' && !form.cardBrand) {
    callback(new Error(t('risk.validation.threeDsFieldRequired')));
    return;
  }
  if (field !== 'cardBrands' && !(form as Partial<Record<keyof RiskRecord, unknown>>)[field]) {
    callback(new Error(t('risk.validation.threeDsFieldRequired')));
    return;
  }
  callback();
}

function validateThreeDsPriority(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (!isThreeDsRule.value) {
    callback();
    return;
  }
  if (!form.priority || Number(form.priority) <= 0) {
    callback(new Error(t('risk.validation.priorityPositive')));
    return;
  }
  callback();
}

function validatePositiveFrequency(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showFrequency || value == null) {
    callback();
    return;
  }
  if (Number(value) <= 0) {
    callback(new Error(t('risk.validation.frequencyPositive')));
    return;
  }
  callback();
}

function validateFrequencyDimension(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency && !frequencyForm.statDimension) {
    callback(new Error(t('risk.validation.frequencyDimensionRequired')));
    return;
  }
  callback();
}

function validateFrequencyWindowValue(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency && (!frequencyForm.windowValue || Number(frequencyForm.windowValue) <= 0)) {
    callback(new Error(t('risk.validation.frequencyWindowRequired')));
    return;
  }
  callback();
}

function validateFrequencyWindowUnit(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency && !frequencyForm.windowUnit) {
    callback(new Error(t('risk.validation.frequencyWindowUnitRequired')));
    return;
  }
  callback();
}

function validateFrequencyAllowedCount(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency && (!frequencyForm.allowedCount || Number(frequencyForm.allowedCount) <= 0)) {
    callback(new Error(t('risk.validation.frequencyPositive')));
    return;
  }
  callback();
}

function validateFrequencySuccessCount(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (!profile.value.showFrequency) {
    callback();
    return;
  }
  if (Number(frequencyForm.successCount || 0) < 0) {
    callback(new Error(t('risk.validation.frequencySuccessCountInvalid')));
    return;
  }
  if (Number(frequencyForm.successCount || 0) > Number(frequencyForm.allowedCount || 0)) {
    callback(new Error(t('risk.validation.frequencySuccessCountTooLarge')));
    return;
  }
  callback();
}

function validateFrequencyElements(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency && !frequencyForm.elements.length) {
    callback(new Error(t('risk.validation.frequencyElementRequired')));
    return;
  }
  callback();
}

function validateFrequencyFormBeforeSubmit() {
  if (!profile.value.showFrequency) {
    return;
  }
  if (!frequencyForm.windowValue || Number(frequencyForm.windowValue) <= 0) {
    throw new Error(t('risk.validation.frequencyWindowRequired'));
  }
  if (!frequencyForm.windowUnit) {
    throw new Error(t('risk.validation.frequencyWindowUnitRequired'));
  }
  if (!frequencyForm.statDimension) {
    throw new Error(t('risk.validation.frequencyDimensionRequired'));
  }
  if (!frequencyForm.elements.length) {
    throw new Error(t('risk.validation.frequencyElementRequired'));
  }
  if (!frequencyForm.allowedCount || Number(frequencyForm.allowedCount) <= 0) {
    throw new Error(t('risk.validation.frequencyPositive'));
  }
  if (Number(frequencyForm.successCount || 0) < 0) {
    throw new Error(t('risk.validation.frequencySuccessCountInvalid'));
  }
  if (Number(frequencyForm.successCount || 0) > Number(frequencyForm.allowedCount || 0)) {
    throw new Error(t('risk.validation.frequencySuccessCountTooLarge'));
  }
}

function validateMerchantLimitFormBeforeSubmit() {
  if (!isMerchantLimitRule.value) {
    return;
  }
  if (!merchantLimitAmountTypes.value.length) {
    throw new Error(t('risk.validation.limitTypeRequired'));
  }
  for (const limitType of merchantLimitAmountTypes.value) {
    const amount = merchantLimitForm.amounts[limitType];
    if (amount == null) {
      throw new Error(`${limitTypeText(limitType)}：${t('risk.validation.limitAmountRequired')}`);
    }
    if (Number(amount) <= 0) {
      throw new Error(`${limitTypeText(limitType)}：${t('risk.validation.amountPositive')}`);
    }
    if (!hasValidMerchantLimitAmountScale(amount)) {
      throw new Error(`${limitTypeText(limitType)}：${t('risk.validation.amountScale2')}`);
    }
  }
  validateMerchantLimitAmountRelations();
}

function validateMerchantLimitAmountRelations() {
  const amounts = merchantLimitRelationTypes.reduce<Record<string, number | undefined>>((result, limitType) => {
    result[limitType] = merchantLimitAmountValue(merchantLimitForm.amounts[limitType]);
    return result;
  }, {});
  if (amounts.DAILY != null && amounts.WEEKLY != null && amounts.WEEKLY > amounts.DAILY * 7) {
    throw new Error(t('risk.validation.weeklyLimitTooLarge'));
  }
  if (amounts.WEEKLY != null && amounts.MONTHLY != null && amounts.MONTHLY > amounts.WEEKLY * 4) {
    throw new Error(t('risk.validation.monthlyLimitTooLarge'));
  }
}

function validateThreeDsFormBeforeSubmit() {
  if (!isThreeDsRule.value) {
    return;
  }
  const requiredFields: Array<keyof RiskRecord> = ['ruleType', 'channelCode', 'paymentMethod', 'amountMatchType', 'riskCondition', 'triggerAction'];
  if (requiredFields.some((field) => !form[field])) {
    throw new Error(t('risk.validation.threeDsFieldRequired'));
  }
  if (form.paymentMethod === BANK_CARD_PAYMENT_METHOD && !threeDsSelectedCardBrands().length) {
    throw new Error(t('risk.validation.threeDsFieldRequired'));
  }
  if (!form.priority || Number(form.priority) <= 0) {
    throw new Error(t('risk.validation.priorityPositive'));
  }
  const amountType = String(form.amountMatchType || 'ALL');
  form.currency = FIXED_THREE_DS_CURRENCY;
  if (['GE', 'BETWEEN'].includes(amountType) && form.amountMin == null) {
    throw new Error(t('risk.validation.amountMinRequired'));
  }
  if (['LE', 'BETWEEN'].includes(amountType) && form.amountMax == null) {
    throw new Error(t('risk.validation.amountMaxRequired'));
  }
  if (form.amountMin != null && Number(form.amountMin) <= 0) {
    throw new Error(t('risk.validation.amountPositive'));
  }
  if (form.amountMax != null && Number(form.amountMax) <= 0) {
    throw new Error(t('risk.validation.amountPositive'));
  }
  if (!hasValidAmountScale(form.amountMin, 2) || !hasValidAmountScale(form.amountMax, 2)) {
    throw new Error(t('risk.validation.amountScale2'));
  }
  if (amountType === 'BETWEEN' && form.amountMin != null && form.amountMax != null && Number(form.amountMin) > Number(form.amountMax)) {
    throw new Error(t('risk.validation.amountRangeInvalid'));
  }
}

function validateElementsJson(_rule: unknown, value: unknown, callback: (error?: Error) => void) {
  if (profile.value.showFrequency) {
    if (!frequencyForm.elements.length) {
      callback(new Error(t('risk.validation.frequencyElementRequired')));
      return;
    }
    callback();
    return;
  }
  if (!profile.value.showElements || !value) {
    callback();
    return;
  }
  try {
    const parsed = JSON.parse(String(value));
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      callback(new Error(t('risk.validation.elementsJsonObject')));
      return;
    }
  } catch {
    callback(new Error(t('risk.validation.elementsJsonObject')));
    return;
  }
  callback();
}

function handleMatchValueInput(value: string) {
  if (isSourceUrlRule.value) {
    form.sourceUrl = value;
    return;
  }
  if (!profile.value.showCardBrand) {
    return;
  }
  const normalized = value.replace(/[^\d,-]/g, '').slice(0, 23);
  if (normalized !== value) {
    form.matchValue = normalized;
  }
  form.cardBrand = detectCardBrand(normalized, options.value.cardBrandOptions);
}

function countryAlpha3Value(value?: string) {
  const text = String(value || '').trim().toUpperCase();
  const matched = options.value.countryOptions.find((item) => item.extra === text || item.value === text);
  return matched?.extra || text;
}

function cardBrandLogo(value?: string) {
  return cardBrandLogoKeyByValue(options.value.cardBrandOptions, value);
}

function cardBrandDisplay(value?: string) {
  return cardBrandLabel(options.value.cardBrandOptions, value);
}

function optionLabel(optionList: Array<{ label: string; value: string | number }>, value?: string | number) {
  return optionList.find((item) => String(item.value) === String(value))?.label || value || '-';
}

function withAllDimension(optionList: SelectOption[]) {
  return [{ label: t('risk.rule.allDimension'), value: ALL_DIMENSION }, ...uniqueOptions(optionList)];
}

function uniqueOptions(optionList: SelectOption[]) {
  const seen = new Set<string>();
  const result: SelectOption[] = [];
  for (const item of optionList) {
    const value = String(item.value || '').trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push({ ...item, value });
  }
  return result;
}

function normalizeOptionValue(value: string | number | undefined, optionList: Array<{ value: string | number }>, fallback?: string) {
  if (!value) {
    return fallback;
  }
  const text = String(value);
  return optionList.some((item) => String(item.value) === text) ? text : fallback;
}

function threeDsCapabilitiesForChannel(channelCode?: string) {
  const selectedChannelCode = String(channelCode || ALL_DIMENSION);
  return channelCapabilities.value.filter((item) => {
    if (item.businessType !== 'ACQUIRING' || item.capabilityStatus !== 1 || item.support3ds !== 1) {
      return false;
    }
    return selectedChannelCode === ALL_DIMENSION || item.channelCode === selectedChannelCode;
  });
}

function threeDsPaymentOptionsForChannel(channelCode?: string) {
  if (!channelCode || channelCode === ALL_DIMENSION) {
    return allThreeDsPaymentMethodOptions.value;
  }
  const paymentMethods = new Set(threeDsCapabilitiesForChannel(channelCode).map((item) => item.paymentMethod).filter(Boolean));
  const matchedOptions = allThreeDsPaymentMethodOptions.value.filter((item) => paymentMethods.has(item.value));
  return matchedOptions.length ? matchedOptions : allThreeDsPaymentMethodOptions.value;
}

function threeDsCardBrandOptionsForChannel(channelCode?: string) {
  if (!channelCode || channelCode === ALL_DIMENSION) {
    return allThreeDsCardBrandOptions.value;
  }
  const cardBrands = new Set<string>();
  threeDsCapabilitiesForChannel(channelCode)
    .filter((item) => item.paymentMethod === BANK_CARD_PAYMENT_METHOD)
    .forEach((item) => item.cardBrands?.forEach((cardBrand) => cardBrands.add(cardBrand)));
  return allThreeDsCardBrandOptions.value.filter((item) => cardBrands.has(item.value));
}

function threeDsRuleTypeText(value?: string | number) {
  return optionLabel(threeDsRuleTypeOptions.value, value);
}

function threeDsChannelText(value?: string | number) {
  if (value === ALL_DIMENSION) {
    return t('risk.rule.allDimension');
  }
  return optionLabel(threeDsChannelOptions.value, value);
}

function threeDsPaymentMethodText(value?: string | number) {
  return optionLabel(threeDsPaymentMethodTextOptions.value, value);
}

function threeDsCardBrandText(value?: string | number) {
  return optionLabel(threeDsCardBrandTextOptions.value, value);
}

function threeDsPaymentCardBrandLogos(row: Pick<RiskRecord, 'paymentMethod' | 'cardBrand'>): PaymentLogoKey[] {
  if (row.paymentMethod === BANK_CARD_PAYMENT_METHOD) {
    if (!row.cardBrand || row.cardBrand === ALL_DIMENSION) {
      return [];
    }
    return cardLogoKeys(row.cardBrand, allThreeDsCardBrandOptions.value.find((item) => item.value === row.cardBrand));
  }
  if (!row.paymentMethod || row.paymentMethod === ALL_DIMENSION) {
    return [];
  }
  return paymentLogoKeys(row.paymentMethod, allThreeDsPaymentMethodOptions.value.find((item) => item.value === row.paymentMethod));
}

function threeDsPaymentCardBrandText(row: Pick<RiskRecord, 'paymentMethod' | 'cardBrand'>) {
  const paymentText = threeDsPaymentMethodText(row.paymentMethod);
  if (row.paymentMethod !== BANK_CARD_PAYMENT_METHOD) {
    return paymentText;
  }
  return `${paymentText} / ${threeDsCardBrandText(row.cardBrand)}`;
}

function threeDsSelectedCardBrands() {
  if (form.paymentMethod !== BANK_CARD_PAYMENT_METHOD) {
    return [ALL_DIMENSION];
  }
  const selected = Array.isArray(form.cardBrands) ? form.cardBrands : form.cardBrand ? [form.cardBrand] : [];
  const normalized = selected.map((item) => String(item || '').trim()).filter(Boolean);
  const concreteBrands = normalized.filter((item) => item !== ALL_DIMENSION);
  if (!normalized.length || !concreteBrands.length) {
    return [ALL_DIMENSION];
  }
  return Array.from(new Set(concreteBrands));
}

function threeDsAmountMatchTypeText(value?: string | number) {
  return optionLabel(threeDsAmountMatchTypeOptions.value, value);
}

function threeDsRiskConditionText(value?: string | number) {
  return optionLabel(threeDsRiskConditionOptions.value, value);
}

function threeDsTriggerActionText(value?: string | number) {
  return optionLabel(threeDsTriggerActionOptions.value, value);
}

function threeDsAmountConditionText(row: Partial<RiskRecord>) {
  const amountType = String(row.amountMatchType || 'ALL');
  if (amountType === 'ALL') {
    return threeDsAmountMatchTypeText(amountType);
  }
  const currency = row.currency || '-';
  if (amountType === 'GE') {
    return `>= ${amountDisplay(row.amountMin)} ${currency}`;
  }
  if (amountType === 'LE') {
    return `<= ${amountDisplay(row.amountMax)} ${currency}`;
  }
  if (amountType === 'BETWEEN') {
    return `${amountDisplay(row.amountMin)} - ${amountDisplay(row.amountMax)} ${currency}`;
  }
  return threeDsAmountMatchTypeText(amountType);
}

function amountDisplay(amount: number | string | undefined | null) {
  if (amount == null || amount === '') {
    return '-';
  }
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    useGrouping: false,
  }).format(Number(amount));
}

function scopeText(value?: string) {
  return merchantScopeOptions.value.find((item) => item.value === value)?.label || riskOptionLabel(t, 'merchantScope', value);
}

function riskLevelText(value?: string | number) {
  return optionLabel(riskLevelOptions.value, value);
}

function decisionActionText(value?: string | number) {
  return optionLabel(decisionActionOptions.value, value);
}

function limitTypeText(value?: string | number) {
  return optionLabel(limitTypeOptions.value, value);
}

function limitAmountText(row: Partial<RiskRecord>) {
  const amount = String(row.limitType || '') === 'SINGLE_MIN' ? row.amountMin : row.amountMax;
  return amount == null ? '-' : `${merchantLimitAmountDisplay(amount)} ${merchantLimitCurrencyText(row)}`;
}

function merchantLimitCurrencyText(row?: Partial<RiskRecord>) {
  return row?.currency || MERCHANT_LIMIT_CURRENCY;
}

function merchantLimitDetailLimitText(row: Partial<RiskRecord>) {
  const amountText = limitAmountText(row);
  if (amountText === '-') {
    return limitTypeText(row.limitType);
  }
  return `${limitTypeText(row.limitType)}：${amountText}`;
}

function matchModeText(value?: string | number) {
  return optionLabel(matchModeOptions.value, value);
}

function countryText(value?: string | number) {
  const text = String(value || '');
  const matched = options.value.countryOptions.find((item) => item.extra === text || item.value === text);
  return matched ? `${matched.label}（${matched.extra || matched.value}）` : text || '-';
}

function defaultRuleRiskLevel() {
  if (current.value.functionCode === 'merchantLimit' || current.value.functionCode === 'frequency') return 'HIGH';
  return 'MEDIUM';
}

function defaultRuleDecisionAction() {
  if (['sourceUrl', 'merchantLimit', 'frequency'].includes(current.value.functionCode)) return 'REJECT';
  return 'REVIEW';
}

function riskLevelTagType(value?: string) {
  if (value === 'CRITICAL') return 'danger';
  if (value === 'HIGH') return 'warning';
  if (value === 'MEDIUM') return 'primary';
  return 'success';
}

function decisionActionTagType(value?: string) {
  if (value === 'REJECT') return 'danger';
  if (value === 'REVIEW') return 'warning';
  return 'success';
}

function threeDsRiskConditionTagType(value?: string) {
  if (value === 'CRITICAL_ONLY' || value === 'HIGH_AND_ABOVE') return 'danger';
  if (value === 'MEDIUM_AND_ABOVE') return 'warning';
  if (value === 'LOW_AND_ABOVE') return 'primary';
  return 'info';
}

function threeDsTriggerActionTagType(value?: string) {
  if (value === 'FORCE_3DS') return 'danger';
  if (value === 'SKIP_3DS') return 'success';
  return 'info';
}

function statusText(value?: string | number) {
  return optionLabel(statusOptions.value, value);
}

function recordDisplayName(row: RiskRecord) {
  return row.sourceUrl || row.ruleName || currentFunctionName.value;
}

function frequencySummary(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
  const elementText = elements.length ? elements.map((item: string) => frequencyElementLabel(item)).join('+') : '-';
  const dimension = frequencyDimensionText(row);
  const window = frequencyWindowText(row);
  const allowed = frequencyAllowedCountText(row);
  const success = frequencySuccessCountText(row);
  return `${elementText} / ${dimension} / ${window} / ${t('risk.rule.allowedCountShort')}${allowed} / ${t('risk.rule.successCountShort')}${success}`;
}

function frequencyElementTexts(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  return Array.isArray(parsed.elements) ? parsed.elements.map((item: string) => frequencyElementLabel(item)) : [];
}

function frequencyDimensionText(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  return parsed.statisticDimension === 'ELEMENT_COMBINATION' ? t('risk.rule.dimension.elementCombination') : t('risk.rule.dimension.anyElement');
}

function frequencyWindowText(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  const fallback = secondsToFrequencyWindow(Number(row.timeWindowSeconds || 0));
  const windowValue = parsed.windowValue || fallback.value;
  const windowUnit = frequencyWindowUnitLabel(parsed.windowUnit || fallback.unit);
  return `${windowValue}${windowUnit}`;
}

function frequencyAllowedCountText(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  return parsed.allowedCount || row.thresholdCount || '-';
}

function frequencySuccessCountText(row: Partial<RiskRecord>) {
  const parsed = parseFrequencyJson(row.elementsJson);
  const successCount = parsed.successCount;
  if (successCount === null || successCount === undefined || successCount === '') {
    return 0;
  }
  return successCount;
}

function frequencyElementLabel(value: string) {
  return frequencyElementOptions.value.find((item) => item.value === value)?.label || value;
}

function frequencyWindowUnitLabel(value: string) {
  return frequencyWindowUnitOptions.value.find((item) => item.value === value)?.label || value;
}
</script>

<style scoped>
.approval-target {
  display: block;
  overflow-wrap: anywhere;
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.card-brand-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  min-height: 24px;
}

.card-brand-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.card-brand-preview.is-pending {
  color: var(--el-text-color-placeholder);
}

.rule-section {
  margin: 4px 0 14px;
  padding: 10px 12px;
  border-left: 3px solid var(--el-color-primary);
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
}

.rule-section-title {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.rule-section-desc {
  margin-top: 3px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
}

.frequency-config-panel {
  margin: 2px 0 8px;
}

.limit-amount-panel {
  margin: 0 0 18px 122px;
  display: grid;
  gap: 10px;
}

.limit-amount-row {
  display: inline-grid;
  grid-template-columns: 150px minmax(220px, 320px) 56px;
  gap: 10px;
  align-items: center;
  width: min(100%, 540px);
  max-width: 100%;
}

.limit-type-label {
  justify-self: end;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}

.limit-amount-row :deep(.el-input-number) {
  width: 100%;
}

.three-ds-amount-condition {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 32px;
}

.three-ds-amount-condition > span {
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.three-ds-amount-condition.is-static {
  padding: 0 12px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
  color: var(--el-color-primary);
  font-size: 14px;
  font-weight: 500;
}

.three-ds-amount-condition.is-range .amount-currency-input {
  flex: 1;
  min-width: 0;
}

.amount-currency-input {
  display: flex;
  width: min(280px, 100%);
}

.amount-currency-input :deep(.el-input-number) {
  flex: 1;
  min-width: 0;
  width: 100%;
}

.amount-currency-input :deep(.el-input__wrapper) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.amount-currency-input > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  border: 1px solid var(--el-border-color);
  border-left: 0;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 30px;
}

.payment-card-brand-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.frequency-elements {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.frequency-element-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.frequency-element-tags :deep(.el-tag) {
  max-width: 160px;
}

.frequency-element-tags :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.frequency-element-tags.is-detail {
  justify-content: flex-start;
}

.frequency-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
}

.frequency-detail-cell {
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  background: var(--el-fill-color-lighter);
}

.frequency-detail-cell.is-elements {
  grid-column: 1 / -1;
}

.frequency-detail-label {
  display: block;
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 16px;
}

.frequency-detail-cell strong {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  word-break: break-word;
}

.country-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
