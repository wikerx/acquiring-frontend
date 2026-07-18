<template>
  <div class="app-container risk-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="76px">
      <el-form-item v-if="showMerchantDimension" :label="$t('risk.common.scope')">
        <el-select v-model="query.merchantScope" :placeholder="t('risk.common.placeholderSelect')" clearable class="query-select">
          <el-option v-for="item in merchantScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="showMerchantDimension" :label="$t('risk.common.merchantId')">
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
      <el-form-item :label="profileValueLabel" v-if="profile.showValue || profile.showRange">
        <el-select
          v-if="isMerchantProfile"
          v-model="query.matchValue"
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
        <el-input v-else v-model.trim="query.matchValue" :placeholder="profileValuePlaceholder" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('risk.common.country')" v-if="profile.showCountry">
        <el-select v-model="query.countryAlpha2" :placeholder="t('risk.common.placeholderSelect')" filterable clearable class="query-select">
          <el-option v-for="item in options.countryOptions" :key="item.value" :label="countryOptionText(item)" :value="item.value">
            <span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('common.status')">
        <el-select v-model="query.status" :placeholder="t('risk.common.placeholderSelect')" clearable class="query-select">
          <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="`${current.permissionPrefix}:add`">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="selectedRows.length === 0" @click="handleBatchDelete" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('risk.common.batchDelete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Download" size="small" @click="handleTemplate" v-hasPermi="`${current.permissionPrefix}:template`">{{ $t('risk.common.template') }}</el-button></el-col>
      <el-col :span="1.5">
        <el-upload :show-file-list="false" accept=".xlsx,.xls,.csv" :auto-upload="false" :on-change="handleImport" v-hasPermi="`${current.permissionPrefix}:import`">
          <el-button type="info" plain :icon="Upload" size="small">{{ $t('common.import') }}</el-button>
        </el-upload>
      </el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="`${current.permissionPrefix}:export`">{{ $t('common.export') }}</el-button></el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData">
          <TableColumnSettings
            v-if="isCardBlacklistPilot"
            :columns="pilotColumns"
            :fixed-columns="pilotFixedColumns"
            @visible-change="handlePilotColumnVisibleChange"
            @move-column="movePilotColumn"
            @reset-columns="resetPilotColumns"
          />
        </RightToolbar>
      </el-col>
    </el-row>

    <StandardTable table-key="risk-list"
      v-if="isCardBlacklistPilot"
      v-loading="loading"
      :data="rows"
      row-key="id"
      size="small"
      class="standard-table risk-card-blacklist-table"
      @selection-change="selectedRows = $event"
      @header-dragend="handlePilotHeaderDragend"
    >
      <el-table-column type="selection" width="50" align="center" fixed="left" />
      <template v-for="column in visiblePilotColumns" :key="column.key">
        <el-table-column v-if="column.key === 'merchantScope'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ scopeText(row.merchantScope) }}</template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'merchantId'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.merchantId || '-' }}</template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'merchantName'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center" show-overflow-tooltip />
        <el-table-column v-else-if="column.key === 'cardNo'" prop="cardNo" :label="column.label" :width="column.width ?? column.defaultWidth" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ displayValue(row) }}</template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'cardBrand'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }">
            <span class="card-brand-cell">
              <PaymentLogoMark v-if="cardBrandLogo(row.cardBrand)" :logo-key="cardBrandLogo(row.cardBrand)" size="sm" compact fallback="text" />
              <span v-else>{{ cardBrandDisplay(row.cardBrand) || '-' }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'riskLevel'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(row.riskLevel)">{{ riskLevelText(row.riskLevel) }}</el-tag></template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'decisionAction'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(row.decisionAction)">{{ decisionActionText(row.decisionAction) }}</el-tag></template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'validity'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }">{{ validityText(row) }}</template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'sourceType'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }">{{ sourceText(row.sourceType) }}</template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'status'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" :disabled="isStatusUpdating(row.id)" @change="(status: number) => handleStatus(row, status)" v-hasPermi="`${current.permissionPrefix}:status`" /></template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'createTime'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
        </el-table-column>
        <el-table-column v-else-if="column.key === 'expireTime'" :prop="column.key" :label="column.label" :width="column.width ?? column.defaultWidth" align="center">
          <template #default="{ row }">
            <el-tag v-if="isNeverExpire(row)" class="never-expire-tag" type="success" effect="light" size="small">
              {{ t('risk.common.neverExpire') }}
            </el-tag>
            <BaseDateTime v-else :value="row.expireTime" />
          </template>
        </el-table-column>
      </template>
      <el-table-column :label="$t('common.operation')" width="210" align="center" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="`${current.permissionPrefix}:detail`">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <StandardTable table-key="risk-list-2" v-else v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column v-if="showMerchantDimension" prop="merchantScope" :label="$t('risk.common.scope')" width="118" align="center">
        <template #default="{ row }">{{ scopeText(row.merchantScope) }}</template>
      </el-table-column>
      <el-table-column v-if="showMerchantDimension" prop="merchantId" :label="$t('risk.common.merchantId')" min-width="150" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ row.merchantId || '-' }}</template>
      </el-table-column>
      <el-table-column v-if="showMerchantDimension" prop="merchantName" :label="t('risk.common.merchantName')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="!profile.showRegion && !isCountryProfile && profile.rangeKind !== 'cardBin' && profile.rangeKind !== 'ip'" prop="matchValueMasked" :label="profileValueLabel" min-width="190" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ displayValue(row) }}</template>
      </el-table-column>
      <el-table-column v-if="isAmlSourceUrl" prop="sourceHost" :label="$t('risk.profile.rule.sourceHostLabel')" min-width="150" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.rangeKind === 'cardBin'" prop="matchValueStart" :label="$t('risk.common.startBin')" min-width="140" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.rangeKind === 'cardBin'" prop="matchValueEnd" :label="$t('risk.common.endBin')" min-width="140" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.rangeKind === 'ip' && !isSingleIpProfile" prop="matchValueStart" :label="$t('risk.common.startIp')" min-width="160" align="center" show-overflow-tooltip />
      <el-table-column v-if="profile.rangeKind === 'ip' && !isSingleIpProfile" prop="matchValueEnd" :label="$t('risk.common.endIp')" min-width="160" align="center" show-overflow-tooltip />
      <el-table-column v-if="isSingleIpProfile" prop="matchValueStart" :label="$t('risk.common.ipAddress')" min-width="180" align="center" show-overflow-tooltip />
      <template v-if="profile.showRegion">
        <el-table-column prop="regionMatchLevel" :label="$t('risk.common.regionLevel')" width="118" align="center">
          <template #default="{ row }">{{ regionLevelText(row.regionMatchLevel) }}</template>
        </el-table-column>
        <el-table-column prop="countryAlpha2" :label="$t('risk.common.country')" min-width="160" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ countryDisplay(row.countryAlpha2, row.countryAlpha3) }}</template>
        </el-table-column>
        <el-table-column prop="stateProvinceName" :label="$t('risk.common.state')" min-width="140" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.stateProvinceName || '-' }}</template>
        </el-table-column>
        <el-table-column prop="cityName" :label="$t('risk.common.city')" min-width="140" align="center" show-overflow-tooltip>
          <template #default="{ row }">{{ row.cityName || '-' }}</template>
        </el-table-column>
      </template>
      <el-table-column v-if="profile.showCardBrand" prop="cardBrand" :label="$t('risk.common.cardBrand')" width="124" align="center">
        <template #default="{ row }">
          <span class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(row.cardBrand)" :logo-key="cardBrandLogo(row.cardBrand)" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(row.cardBrand) || '-' }}</span>
          </span>
        </template>
      </el-table-column>
      <el-table-column v-if="profile.showCountry && !profile.showRegion" prop="countryAlpha3" :label="$t('risk.common.country')" min-width="170" align="center" show-overflow-tooltip>
        <template #default="{ row }">{{ countryDisplay(row.countryAlpha2, row.countryAlpha3) }}</template>
      </el-table-column>
      <el-table-column prop="riskLevel" :label="$t('risk.common.riskLevel')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskLevelTagType(row.riskLevel)">{{ riskLevelText(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="decisionAction" :label="$t('risk.common.decisionAction')" width="110" align="center">
        <template #default="{ row }"><el-tag size="small" :type="decisionActionTagType(row.decisionAction)">{{ decisionActionText(row.decisionAction) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="t('risk.common.validity')" width="128" align="center">
        <template #default="{ row }">{{ validityText(row) }}</template>
      </el-table-column>
      <el-table-column prop="sourceType" :label="t('risk.common.sourceType')" width="100" align="center">
        <template #default="{ row }">{{ sourceText(row.sourceType) }}</template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="92" align="center">
        <template #default="{ row }"><el-switch :model-value="row.status" :active-value="1" :inactive-value="0" :disabled="isStatusUpdating(row.id)" @change="(status: number) => handleStatus(row, status)" v-hasPermi="`${current.permissionPrefix}:status`" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.createTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.createTime" /></template></el-table-column>
      <el-table-column :label="t('risk.common.expireTime')" width="170" align="center">
        <template #default="{ row }">
          <el-tag v-if="isNeverExpire(row)" class="never-expire-tag" type="success" effect="light" size="small">
            {{ t('risk.common.neverExpire') }}
          </el-tag>
          <BaseDateTime v-else :value="row.expireTime" />
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" width="210" align="center" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="`${current.permissionPrefix}:detail`">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="`${current.permissionPrefix}:edit`">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="`${current.permissionPrefix}:remove`">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </StandardTable>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formTitle" v-model="formOpen" width="780px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="118px" size="small">
        <el-row v-if="showMerchantDimension" :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('risk.common.scope')" prop="merchantScope">
              <el-select v-model="form.merchantScope" style="width:100%" @change="handleFormScopeChange">
                <el-option v-for="item in merchantScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('risk.common.merchantId')" prop="merchantId">
              <el-select
                v-model="form.merchantId"
                filterable
                remote
                clearable
                reserve-keyword
                remote-show-suffix
                :disabled="form.merchantScope === 'GLOBAL'"
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
        <template v-if="profile.showRegion">
          <el-row :gutter="16">
            <el-col :span="12"><el-form-item :label="$t('risk.common.regionLevel')" prop="regionMatchLevel"><el-select v-model="form.regionMatchLevel" style="width:100%" @change="handleRegionLevelChange"><el-option :label="t('risk.common.country')" value="COUNTRY" /><el-option :label="t('risk.common.state')" value="STATE" /><el-option :label="t('risk.common.city')" value="CITY" /></el-select></el-form-item></el-col>
            <el-col :span="12">
              <el-form-item v-if="showRegionCountryMultiSelect" :label="$t('risk.common.country')" prop="countryAlpha2List">
                <el-popover v-model:visible="regionCountryPickerOpen" placement="bottom-start" trigger="click" width="520" popper-class="region-country-picker-popper">
                  <template #reference>
                    <el-input
                      :model-value="regionCountrySelectorText"
                      readonly
                      clearable
                      :placeholder="t('risk.common.placeholderSelect')"
                      @clear="clearRegionCountrySelection"
                    />
                  </template>
                  <div class="region-country-picker">
                    <div class="continent-panel">
                      <div
                        v-for="group in regionCountryGroups"
                        :key="group.code"
                        :class="['continent-item', { 'is-active': activeContinentCode === group.code }]"
                        @click="activeContinentCode = group.code"
                      >
                        <el-checkbox :model-value="isContinentSelected(group)" :indeterminate="isContinentIndeterminate(group)" @change="(checked: boolean) => toggleContinent(group, checked)" @click.stop />
                        <span class="continent-name">{{ group.name }}</span>
                        <span class="continent-count">{{ group.countries.length }}</span>
                      </div>
                    </div>
                    <div class="country-panel">
                      <div class="country-panel-head">
                        <el-checkbox :model-value="isContinentSelected(activeContinent)" :indeterminate="isContinentIndeterminate(activeContinent)" @change="(checked: boolean) => toggleContinent(activeContinent, checked)">
                          {{ activeContinent?.name || t('risk.common.country') }}
                        </el-checkbox>
                        <el-button v-if="regionSelectedCountries.length" type="primary" link size="small" @click="clearRegionCountrySelection">{{ t('risk.common.clearSelected') }}</el-button>
                      </div>
                      <div class="country-list">
                        <el-checkbox
                          v-for="item in activeContinentCountries"
                          :key="item.value"
                          :model-value="regionSelectedCountries.includes(String(item.value))"
                          @change="(checked: boolean) => toggleRegionCountry(String(item.value), checked)"
                        >
                          <span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span>
                        </el-checkbox>
                      </div>
                    </div>
                  </div>
                </el-popover>
                <div v-if="selectedRegionCountryLabels.length" class="selected-country-tags">
                  <el-tag v-for="item in visibleSelectedRegionCountryLabels" :key="item" size="small" effect="light">{{ item }}</el-tag>
                  <el-tag v-if="hiddenSelectedRegionCountryCount > 0" size="small" type="info" effect="plain">{{ t('risk.common.moreSelectedCountryCount', { count: hiddenSelectedRegionCountryCount }) }}</el-tag>
                </div>
              </el-form-item>
              <el-form-item v-else :label="$t('risk.common.country')" prop="countryAlpha2">
                <el-select v-model="form.countryAlpha2" filterable clearable style="width:100%" @change="handleCountryChange"><el-option v-for="item in options.countryOptions" :key="item.value" :label="countryOptionText(item)" :value="item.value"><span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span></el-option></el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="showStateField" :gutter="16">
            <el-col :span="12"><el-form-item :label="$t('risk.common.state')" prop="stateProvinceName"><el-input v-model.trim="form.stateProvinceName" /></el-form-item></el-col>
            <el-col v-if="showCityField" :span="12"><el-form-item :label="$t('risk.common.city')" prop="cityName"><el-input v-model.trim="form.cityName" /></el-form-item></el-col>
          </el-row>
        </template>

        <template v-else>
          <el-form-item v-if="profile.valueInputType === 'country' && showCountryListMultiSelect" :label="profileValueLabel" prop="countryAlpha2List">
            <el-popover v-model:visible="countryListPickerOpen" placement="bottom-start" trigger="click" width="520" popper-class="region-country-picker-popper">
              <template #reference>
                <el-input
                  :model-value="countryListSelectorText"
                  readonly
                  clearable
                  :placeholder="t('risk.common.placeholderSelect')"
                  @clear="clearCountryListSelection"
                />
              </template>
              <div class="region-country-picker">
                <div class="continent-panel">
                  <div
                    v-for="group in countryListGroups"
                    :key="group.code"
                    :class="['continent-item', { 'is-active': activeCountryListContinentCode === group.code }]"
                    @click="activeCountryListContinentCode = group.code"
                  >
                    <el-checkbox :model-value="isCountryListContinentSelected(group)" :indeterminate="isCountryListContinentIndeterminate(group)" @change="(checked: boolean) => toggleCountryListContinent(group, checked)" @click.stop />
                    <span class="continent-name">{{ group.name }}</span>
                    <span class="continent-count">{{ group.countries.length }}</span>
                  </div>
                </div>
                <div class="country-panel">
                  <div class="country-panel-head">
                    <el-checkbox :model-value="isCountryListContinentSelected(activeCountryListContinent)" :indeterminate="isCountryListContinentIndeterminate(activeCountryListContinent)" @change="(checked: boolean) => toggleCountryListContinent(activeCountryListContinent, checked)">
                      {{ activeCountryListContinent?.name || t('risk.common.country') }}
                    </el-checkbox>
                    <el-button v-if="countryListSelectedCountries.length" type="primary" link size="small" @click="clearCountryListSelection">{{ t('risk.common.clearSelected') }}</el-button>
                  </div>
                  <div class="country-list">
                    <el-checkbox
                      v-for="item in activeCountryListContinentCountries"
                      :key="item.value"
                      :model-value="countryListSelectedCountries.includes(String(item.value))"
                      @change="(checked: boolean) => toggleCountryListCountry(String(item.value), checked)"
                    >
                      <span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span>
                    </el-checkbox>
                  </div>
                </div>
              </div>
            </el-popover>
            <div v-if="selectedCountryListLabels.length" class="selected-country-tags">
              <el-tag v-for="item in visibleSelectedCountryListLabels" :key="item" size="small" effect="light">{{ item }}</el-tag>
              <el-tag v-if="hiddenSelectedCountryListCount > 0" size="small" type="info" effect="plain">{{ t('risk.common.moreSelectedCountryCount', { count: hiddenSelectedCountryListCount }) }}</el-tag>
            </div>
          </el-form-item>

          <el-form-item v-else-if="profile.valueInputType === 'country'" :label="profileValueLabel" prop="countryAlpha2">
            <el-select v-model="form.countryAlpha2" filterable clearable style="width:100%" @change="handleCountryChange">
              <template #prefix>
                <span v-if="selectedFormCountryFlag" class="country-select-prefix">{{ selectedFormCountryFlag }}</span>
              </template>
              <el-option v-for="item in options.countryOptions" :key="item.value" :label="countryOptionText(item)" :value="item.value">
                <span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span>
              </el-option>
            </el-select>
          </el-form-item>

          <template v-else-if="profile.valueInputType === 'range'">
            <el-form-item v-if="isSingleIpProfile" :label="$t('risk.common.ipAddress')" prop="matchValueStart">
              <el-input v-model.trim="form.matchValueStart" :placeholder="rangeStartPlaceholder" @input="handleRangeStartInput" />
            </el-form-item>
            <el-row v-if="!isSingleIpProfile" :gutter="16" class="card-bin-range-row">
              <el-col :span="12">
                <el-form-item :label="rangeStartLabel" prop="matchValueStart">
                  <el-input v-model.trim="form.matchValueStart" class="bin-range-input" :placeholder="rangeStartPlaceholder" @input="handleRangeStartInput" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="rangeEndLabel" prop="matchValueEnd">
                  <el-input
                    v-model.trim="form.matchValueEnd"
                    class="bin-range-input"
                    :disabled="profile.rangeKind === 'ip' && !profile.allowIpRange"
                    :placeholder="rangeEndPlaceholder"
                    @input="handleRangeEndInput"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </template>

          <el-form-item v-else-if="isMerchantProfile" :label="profileValueLabel" prop="matchValuePlain">
            <el-select
              v-model="form.matchValuePlain"
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
              style="width:100%"
              @visible-change="handleTargetMerchantVisibleChange"
            >
              <el-option v-for="item in merchantOptions" :key="item.merchantId" :label="merchantOptionLabel(item)" :value="item.merchantId" />
            </el-select>
          </el-form-item>

          <el-form-item v-else :label="profileValueLabel" prop="matchValuePlain">
            <div :class="['card-value-control', { 'is-card': isCardProfile, 'is-email-domain': isEmailDomainProfile }]">
              <el-input
                v-model.trim="form.matchValuePlain"
                class="card-value-input"
                :placeholder="profileValuePlaceholder"
                :maxlength="plainInputMaxLength"
                show-word-limit
                @input="handlePlainValueInput"
              >
                <template v-if="isEmailDomainProfile" #prepend>@</template>
              </el-input>
              <div v-if="isCardProfile" class="card-brand-preview is-inline" :class="{ 'is-pending': !form.cardBrand }">
                <PaymentLogoMark v-if="formCardBrandLogo" :logo-key="formCardBrandLogo" size="sm" compact fallback="text" />
                <span v-else>{{ formCardBrandText }}</span>
              </div>
            </div>
          </el-form-item>

          <el-row :gutter="16">
            <el-col v-if="profile.showCountry && profile.valueInputType !== 'country'" :span="12"><el-form-item :label="$t('risk.common.country')"><el-select v-model="form.countryAlpha2" filterable clearable style="width:100%" @change="handleCountryChange"><el-option v-for="item in options.countryOptions" :key="item.value" :label="countryOptionText(item)" :value="item.value"><span class="country-option"><span>{{ countryOptionFlag(item) }}</span><span>{{ countryOptionText(item) }}</span></span></el-option></el-select></el-form-item></el-col>
          </el-row>
        </template>

        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('risk.common.riskLevel')"><el-select v-model="form.riskLevel" style="width:100%"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('risk.common.decisionAction')"><el-select v-model="form.decisionAction" style="width:100%"><el-option v-for="item in decisionActionOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="t('risk.common.validity')" prop="validityType">
              <el-radio-group v-model="form.validityType">
                <el-radio-button value="SUPER_LONG">{{ t('risk.common.superLong') }}</el-radio-button>
                <el-radio-button value="LONG">{{ t('risk.common.longTerm') }}</el-radio-button>
                <el-radio-button value="LIMITED">{{ t('risk.common.limited') }}</el-radio-button>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="form.validityType !== 'SUPER_LONG'">
            <el-form-item :label="t('risk.common.validityDays')" prop="validityDays">
              <div class="validity-days-input">
                <el-input-number v-model="form.validityDays" :min="form.validityType === 'LONG' ? 120 : 1" :step="1" />
                <span class="unit-text">{{ t('risk.common.daysUnit') }}</span>
              </div>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('common.status')"><el-select v-model="form.status" style="width:100%"><el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('common.remark')"><el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="500" show-word-limit /></el-form-item>
      </el-form>
      <template #footer><div class="dialog-footer"><el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button><el-button @click="formOpen = false">{{ $t('common.cancel') }}</el-button></div></template>
    </el-dialog>

    <CommonDetailDrawer v-model:visible="detailOpen" :title="$t('common.detail')" size="md">
      <el-descriptions v-if="detailRow" :column="1" border size="small">
        <el-descriptions-item v-for="item in detailItems" :key="item.label" :label="item.label">
          <BaseDateTime v-if="item.time" :value="String(item.value || '')" />
          <span v-else-if="item.cardBrand" class="card-brand-cell">
            <PaymentLogoMark v-if="cardBrandLogo(String(item.value || ''))" :logo-key="cardBrandLogo(String(item.value || ''))" size="sm" compact fallback="text" />
            <span v-else>{{ cardBrandDisplay(String(item.value || '')) || '-' }}</span>
          </span>
          <el-tag v-else-if="item.riskLevel" size="small" :type="riskLevelTagType(String(item.value || ''))">{{ riskLevelText(item.value) }}</el-tag>
          <el-tag v-else-if="item.decisionAction" size="small" :type="decisionActionTagType(String(item.value || ''))">{{ decisionActionText(item.value) }}</el-tag>
          <el-tag v-else-if="item.neverExpire" class="never-expire-tag" type="success" effect="light" size="small">{{ item.value }}</el-tag>
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
import { Delete, Download, Edit, Plus, Refresh, Search, Upload, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import type { UploadFile } from 'element-plus';
import { PaymentLogoMark } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import TableColumnSettings from '@/components/StandardTable/TableColumnSettings.vue';
import { useTableColumnPreference } from '@/components/StandardTable/useTableColumnPreference';
import type { StandardTableColumn } from '@/components/StandardTable/types';
import { searchMerchants, type MerchantInfo } from '@/api/merchant/info';
import {
  batchRemoveRiskRecords,
  createRiskList,
  createRiskRegion,
  downloadRiskTemplate,
  exportRiskConfig,
  getRiskListEditDetail,
  getRiskOptions,
  importRiskConfig,
  pageRiskList,
  removeRiskRecord,
  updateRiskList,
  updateRiskRegion,
  updateRiskStatus,
  type RiskListQuery,
  type RiskOption,
  type RiskOptions,
  type RiskRecord,
} from '@/api/risk';
import { useUserStore } from '@/store/modules/user';
import { cardBrandLabel, cardBrandLogoKeyByValue, detectCardBrand, emptyRiskOptions, localizeRiskOptions, resolveRiskFunction, resolveRiskListProfile, riskFunctionName, riskOptionLabel } from '@/views/risk/shared';

const route = useRoute();
const { t } = useI18n();
const user = useUserStore();
const current = computed(() => resolveRiskFunction(route.path));
const profile = computed(() => resolveRiskListProfile(current.value));
const currentFunctionName = computed(() => riskFunctionName(t, current.value));
const profileValueLabel = computed(() => t(profile.value.valueLabelKey));
const profileValuePlaceholder = computed(() => t(profile.value.valuePlaceholderKey));

/**
 * AML、黑名单和白名单共享名单配置页；页面只做管理端录入、脱敏展示和基础校验，
 * 敏感值哈希、IP/BIN 归一化等交易可检索字段由后端统一落库。
 */
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
const formRef = ref<FormInstance>();
const formMode = ref<'add' | 'edit'>('add');
const editingId = ref<number>();
const statusUpdatingIds = ref<Set<number>>(new Set());
const merchantLoading = ref(false);
const merchantOptions = ref<MerchantInfo[]>([]);
const regionCountryPickerOpen = ref(false);
const countryListPickerOpen = ref(false);
const activeContinentCode = ref('');
const activeCountryListContinentCode = ref('');
const regionSelectedCountries = ref<string[]>([]);
const countryListSelectedCountries = ref<string[]>([]);
const query = reactive<RiskListQuery & { merchantScope?: string }>({});
const form = reactive<RiskRecord>({} as RiskRecord);
const merchantScopeOptions = computed(() => localizeRiskOptions(options.value.merchantScopeOptions, t, 'merchantScope'));
const statusOptions = computed(() => localizeRiskOptions(options.value.statusOptions, t, 'status'));
const riskLevelOptions = computed(() => localizeRiskOptions(options.value.riskLevelOptions, t, 'riskLevel'));
const decisionActionOptions = computed(() => localizeRiskOptions(options.value.decisionActionOptions, t, 'decisionAction'));
const sourceTypeOptions = computed(() => localizeRiskOptions(options.value.sourceTypeOptions, t, 'sourceType'));
const emailUsernameRegex = /^(?!\.)(?!.*\.\.)(?!.*\.$)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}$/i;
const emailDomainRegex = /^(?=.{1,253}$)(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}$/i;
const postalCodeRegex = /^(?=.{2,20}$)[A-Z0-9]+(?:[ -][A-Z0-9]+)*$/i;
const isCardBlacklistPilot = computed(() => current.value.moduleType === 'BLACK' && current.value.functionCode === 'cardNo');
const pilotTableKey = computed(() => 'risk-card-blacklist-main');
const pilotUserKey = computed(() => user.userInfo?.userId || user.userInfo?.username);
const pilotDefaultColumns = computed<StandardTableColumn[]>(() => [
  { key: 'merchantScope', label: t('risk.common.scope'), defaultWidth: 118, minWidth: 110 },
  { key: 'merchantId', label: t('risk.common.merchantId'), defaultWidth: 150, minWidth: 130 },
  { key: 'merchantName', label: t('risk.common.merchantName'), defaultWidth: 180, minWidth: 150 },
  { key: 'cardNo', label: t('risk.common.cardNo'), defaultWidth: 190, minWidth: 160 },
  { key: 'cardBrand', label: t('risk.common.cardBrand'), defaultWidth: 124, minWidth: 110 },
  { key: 'riskLevel', label: t('risk.common.riskLevel'), defaultWidth: 110, minWidth: 100 },
  { key: 'decisionAction', label: t('risk.common.decisionAction'), defaultWidth: 112, minWidth: 104 },
  { key: 'validity', label: t('risk.common.validity'), defaultWidth: 128, minWidth: 116 },
  { key: 'sourceType', label: t('risk.common.sourceType'), defaultWidth: 110, minWidth: 100 },
  { key: 'status', label: t('common.status'), defaultWidth: 92, minWidth: 86 },
  { key: 'createTime', label: t('common.createTime'), defaultWidth: 170, minWidth: 160 },
  { key: 'expireTime', label: t('risk.common.expireTime'), defaultWidth: 170, minWidth: 160 },
]);
const pilotFixedColumns = computed(() => [
  { key: 'selection', label: t('table.selectionColumn') },
  { key: 'operation', label: t('common.operation') },
]);
const {
  columns: pilotColumns,
  visibleColumns: visiblePilotColumns,
  setColumnVisible: setPilotColumnVisible,
  moveColumn: movePilotColumn,
  resetColumns: resetPilotColumns,
  handleHeaderDragend: handlePilotHeaderDragend,
} = useTableColumnPreference(pilotTableKey, pilotDefaultColumns, pilotUserKey);

const rules = computed<FormRules>(() => ({
  merchantScope: [{ required: true, message: t('risk.validation.scopeRequired'), trigger: 'change' }],
  merchantId: [{ validator: validateMerchant, trigger: 'change' }],
  matchValuePlain: [{ validator: validatePlainValue, trigger: ['blur', 'change'] }],
  matchValueStart: [{ validator: validateRangeStart, trigger: ['blur', 'change'] }],
  matchValueEnd: [{ validator: validateRangeEnd, trigger: ['blur', 'change'] }],
  countryAlpha2: [{ required: (profile.value.valueInputType === 'country' && !showCountryListMultiSelect.value) || (profile.value.showRegion && !showRegionCountryMultiSelect.value), message: t('risk.validation.countryRequired'), trigger: 'change' }],
  countryAlpha2List: [{ validator: validateCountryListSelection, trigger: 'change' }],
  regionMatchLevel: [{ required: profile.value.showRegion, message: t('risk.validation.regionLevelRequired'), trigger: 'change' }],
  stateProvinceName: [{ validator: validateRegionState, trigger: ['blur', 'change'] }],
  cityName: [{ validator: validateRegionCity, trigger: ['blur', 'change'] }],
  validityType: [{ required: true, message: t('risk.validation.validityTypeRequired'), trigger: 'change' }],
  validityDays: [{ validator: validateValidityDays, trigger: 'blur' }],
}));

const formTitle = computed(() => `${formMode.value === 'add' ? t('common.add') : t('common.edit')} - ${currentFunctionName.value}`);
const rangeStartLabel = computed(() => profile.value.rangeKind === 'cardBin' ? t('risk.common.startBin') : t('risk.common.startIp'));
const rangeEndLabel = computed(() => profile.value.rangeKind === 'cardBin' ? t('risk.common.endBin') : t('risk.common.endIp'));
const rangeStartPlaceholder = computed(() => profile.value.rangeKind === 'cardBin' ? t('risk.common.placeholderBinStart') : t('risk.common.placeholderIpStart'));
const rangeEndPlaceholder = computed(() => {
  if (profile.value.rangeKind === 'cardBin') return t('risk.common.placeholderBinEnd');
  return profile.value.allowIpRange ? t('risk.common.placeholderIpEnd') : t('risk.common.placeholderIpSingle');
});
const isCardProfile = computed(() => profile.value.kind === 'card');
const isMerchantProfile = computed(() => profile.value.kind === 'merchant');
const isAmlModule = computed(() => current.value.moduleType === 'AML');
const isAmlSourceUrl = computed(() => isAmlModule.value && current.value.functionCode === 'sourceUrl');
const showMerchantDimension = computed(() => !isMerchantProfile.value && !isAmlModule.value);
const isEmailDomainProfile = computed(() => profile.value.kind === 'emailDomain');
const isCountryProfile = computed(() => profile.value.valueInputType === 'country');
const isSingleIpProfile = computed(() => profile.value.rangeKind === 'ip' && !profile.value.allowIpRange);
const showCountryListMultiSelect = computed(() => isCountryProfile.value && formMode.value === 'add');
const showRegionCountryMultiSelect = computed(() => profile.value.showRegion && formMode.value === 'add' && form.regionMatchLevel === 'COUNTRY');
const showStateField = computed(() => profile.value.showRegion && ['STATE', 'CITY'].includes(String(form.regionMatchLevel || '')));
const showCityField = computed(() => profile.value.showRegion && form.regionMatchLevel === 'CITY');
const plainInputMaxLength = computed(() => isCardProfile.value ? 19 : 255);
const formCardBrandText = computed(() => {
  if (!form.cardBrand) {
    return t('risk.common.cardBrandAutoPending');
  }
  return cardBrandDisplay(form.cardBrand);
});
const formCardBrandLogo = computed(() => cardBrandLogo(form.cardBrand));
const regionCountryGroups = computed(() => buildCountryGroups(options.value.countryOptions));
const activeContinent = computed(() => regionCountryGroups.value.find((group) => group.code === activeContinentCode.value) || regionCountryGroups.value[0]);
const activeContinentCountries = computed(() => activeContinent.value?.countries || []);
const countryListGroups = computed(() => buildCountryGroups(options.value.countryOptions));
const activeCountryListContinent = computed(() => countryListGroups.value.find((group) => group.code === activeCountryListContinentCode.value) || countryListGroups.value[0]);
const activeCountryListContinentCountries = computed(() => activeCountryListContinent.value?.countries || []);
const selectedRegionCountryLabels = computed(() => regionSelectedCountries.value.map((code) => countryDisplay(code)).filter((text) => text && text !== '-'));
const visibleSelectedRegionCountryLabels = computed(() => selectedRegionCountryLabels.value.slice(0, 3));
const hiddenSelectedRegionCountryCount = computed(() => Math.max(selectedRegionCountryLabels.value.length - visibleSelectedRegionCountryLabels.value.length, 0));
const regionCountrySelectorText = computed(() => selectedRegionCountryLabels.value.length ? t('risk.common.selectedCountryCount', { count: selectedRegionCountryLabels.value.length }) : '');
const selectedCountryListLabels = computed(() => countryListSelectedCountries.value.map((code) => countryDisplay(code)).filter((text) => text && text !== '-'));
const visibleSelectedCountryListLabels = computed(() => selectedCountryListLabels.value.slice(0, 3));
const hiddenSelectedCountryListCount = computed(() => Math.max(selectedCountryListLabels.value.length - visibleSelectedCountryListLabels.value.length, 0));
const countryListSelectorText = computed(() => selectedCountryListLabels.value.length ? t('risk.common.selectedCountryCount', { count: selectedCountryListLabels.value.length }) : '');
const selectedFormCountryOption = computed(() => options.value.countryOptions.find((item) => item.value === form.countryAlpha2));
const selectedFormCountryFlag = computed(() => selectedFormCountryOption.value ? countryOptionFlag(selectedFormCountryOption.value) : '');
const detailItems = computed(() => {
  const row = (detailRow.value || {}) as Partial<RiskRecord>;
  return [
    ...(showMerchantDimension.value ? [
      { label: t('risk.common.scope'), value: scopeText(row.merchantScope) },
      { label: t('risk.common.merchantId'), value: row.merchantId },
      { label: t('risk.common.merchantName'), value: row.merchantName },
    ] : []),
    ...(profile.value.rangeKind === 'cardBin'
      ? [
          { label: t('risk.common.startBin'), value: row.matchValueStart },
          { label: t('risk.common.endBin'), value: row.matchValueEnd },
        ]
      : profile.value.rangeKind === 'ip' && isSingleIpProfile.value
        ? [{ label: t('risk.common.ipAddress'), value: row.matchValueStart }]
      : profile.value.rangeKind === 'ip'
        ? [
            { label: t('risk.common.startIp'), value: row.matchValueStart },
            { label: t('risk.common.endIp'), value: row.matchValueEnd },
          ]
      : profile.value.showRegion
        ? [
            { label: t('risk.common.regionLevel'), value: regionLevelText(row.regionMatchLevel) },
            { label: t('risk.common.country'), value: countryDisplay(row.countryAlpha2, row.countryAlpha3) },
            { label: t('risk.common.state'), value: row.stateProvinceName },
            { label: t('risk.common.city'), value: row.cityName },
          ]
        : isCountryProfile.value
          ? [{ label: profileValueLabel.value, value: countryDisplay(row.countryAlpha2, row.countryAlpha3) }]
          : [{ label: profileValueLabel.value, value: displayValue(row as RiskRecord) }]),
    ...(isAmlSourceUrl.value ? [{ label: t('risk.profile.rule.sourceHostLabel'), value: row.sourceHost }] : []),
    ...(profile.value.showCardBrand ? [{ label: t('risk.common.cardBrand'), value: row.cardBrand, cardBrand: true }] : []),
    { label: t('risk.common.riskLevel'), value: row.riskLevel, riskLevel: true },
    { label: t('risk.common.decisionAction'), value: row.decisionAction, decisionAction: true },
    { label: t('risk.common.validity'), value: validityText(row as RiskRecord) },
    { label: t('risk.common.sourceType'), value: sourceText(row.sourceType) },
    { label: t('risk.common.expireTime'), value: expireTimeText(row as RiskRecord), time: !isNeverExpire(row as RiskRecord), neverExpire: isNeverExpire(row as RiskRecord) },
    { label: t('common.remark'), value: row.remark },
    { label: t('common.createTime'), value: row.createTime, time: true },
    { label: t('common.updateTime'), value: row.updateTime, time: true },
  ];
});

onMounted(async () => {
  options.value = await getRiskOptions();
  activeContinentCode.value = regionCountryGroups.value[0]?.code || '';
  activeCountryListContinentCode.value = countryListGroups.value[0]?.code || '';
  await loadData();
});

watch(regionCountryGroups, (groups) => {
  if (!groups.some((group) => group.code === activeContinentCode.value)) {
    activeContinentCode.value = groups[0]?.code || '';
  }
});

watch(countryListGroups, (groups) => {
  if (!groups.some((group) => group.code === activeCountryListContinentCode.value)) {
    activeCountryListContinentCode.value = groups[0]?.code || '';
  }
});

watch(() => route.path, () => {
  handleReset();
});

watch(() => form.matchValueStart, (value) => {
  if (profile.value.rangeKind === 'ip' && !profile.value.allowIpRange) {
    form.matchValueEnd = value;
  }
});

watch(() => form.matchValuePlain, () => {
  if (isCardProfile.value) {
    form.cardBrand = detectCardBrand(form.matchValuePlain, options.value.cardBrandOptions);
  }
});

async function loadData() {
  loading.value = true;
  try {
    const result = await pageRiskList(current.value.moduleType, current.value.functionCode, {
      ...sanitizeAmlQuery(query),
      pageNo: page.value,
      pageSize: pageSize.value,
    });
    rows.value = result.records;
    total.value = result.total;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  loadData();
}

function handleReset() {
  Object.assign(query, { merchantScope: undefined, merchantId: undefined, matchValue: undefined, countryAlpha2: undefined, status: undefined });
  handleSearch();
}

function resetForm(row?: RiskRecord) {
  Object.keys(form).forEach((key) => delete (form as any)[key]);
  Object.assign(form, {
    status: 1,
    merchantScope: 'GLOBAL',
    riskLevel: current.value.moduleType === 'AML' ? 'CRITICAL' : current.value.moduleType === 'BLACK' ? 'HIGH' : 'LOW',
    decisionAction: current.value.moduleType === 'WHITE' ? 'PASS' : 'REJECT',
    validityType: 'SUPER_LONG',
    sourceType: 'MANUAL',
    regionMatchLevel: 'COUNTRY',
    ...row,
  });
  if (isMerchantProfile.value) {
    form.merchantScope = 'MERCHANT';
    form.merchantId = String(form.matchValuePlain || form.matchValueMasked || form.merchantId || '');
  }
  if (isAmlModule.value) {
    form.merchantScope = 'GLOBAL';
    form.merchantId = undefined;
    form.merchantName = undefined;
  }
  regionSelectedCountries.value = formMode.value === 'add' && !row?.countryAlpha2 ? [] : row?.countryAlpha2 ? [row.countryAlpha2] : [];
  countryListSelectedCountries.value = formMode.value === 'add' && !row?.countryAlpha2 ? [] : row?.countryAlpha2 ? [row.countryAlpha2] : [];
  syncCountryListSelection();
  normalizeRegionFormFields();
  if (profile.value.rangeKind === 'ip' && !profile.value.allowIpRange && !form.matchValueEnd) {
    form.matchValueEnd = form.matchValueStart;
  }
  if (isCardProfile.value) {
    form.cardBrand = detectCardBrand(form.matchValuePlain, options.value.cardBrandOptions) || form.cardBrand;
  }
  if (isMerchantProfile.value) {
    syncCurrentTargetMerchantOption();
  }
  if (profile.value.rangeKind === 'cardBin') {
    form.cardBrand = detectCardBrand(form.matchValueStart, options.value.cardBrandOptions) || form.cardBrand;
  }
  if (profile.value.showRegion && form.countryAlpha2) {
    handleCountryChange(form.countryAlpha2);
  }
  if (isCountryProfile.value && form.countryAlpha2) {
    handleCountryChange(form.countryAlpha2);
  }
  syncCurrentMerchantOption();
}

async function openForm(mode: 'add' | 'edit', row?: RiskRecord) {
  formMode.value = mode;
  editingId.value = row?.id;
  if (mode === 'edit' && row?.id && !profile.value.showRegion) {
    const detail = await getRiskListEditDetail(current.value.moduleType, current.value.functionCode, row.id);
    resetForm(detail);
  } else {
    resetForm(row);
  }
  formOpen.value = true;
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  try {
    if (profile.value.showRegion) {
      const payload = buildRegionPayload();
      editingId.value ? await updateRiskRegion(editingId.value, payload) : await createRiskRegion(payload);
    } else {
      const payload = buildListPayload();
      editingId.value
        ? await updateRiskList(current.value.moduleType, current.value.functionCode, editingId.value, payload)
        : await createRiskList(current.value.moduleType, current.value.functionCode, payload);
    }
    ElMessage.success(t('common.saveSuccess'));
    formOpen.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

function buildRegionPayload() {
  const payload = { ...form };
  if (isAmlModule.value) {
    payload.merchantScope = 'GLOBAL';
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (!isMerchantProfile.value && payload.merchantScope === 'GLOBAL') {
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (showRegionCountryMultiSelect.value) {
    payload.countryAlpha2List = [...regionSelectedCountries.value];
    payload.countryAlpha2 = payload.countryAlpha2List[0];
  }
  payload.sourceType = 'MANUAL';
  return payload;
}

function buildListPayload() {
  const payload = { ...form };
  if (isMerchantProfile.value) {
    payload.merchantScope = 'MERCHANT';
    payload.merchantId = payload.matchValuePlain;
    payload.merchantName = undefined;
  }
  if (isAmlModule.value) {
    payload.merchantScope = 'GLOBAL';
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (payload.merchantScope === 'GLOBAL') {
    payload.merchantId = undefined;
    payload.merchantName = undefined;
  }
  if (profile.value.valueInputType === 'country') {
    if (showCountryListMultiSelect.value) {
      payload.countryAlpha2List = [...countryListSelectedCountries.value];
      payload.countryAlpha2 = payload.countryAlpha2List[0];
    }
    payload.matchValuePlain = payload.countryAlpha2;
  }
  if (profile.value.rangeKind === 'ip' && !profile.value.allowIpRange) {
    payload.matchValueEnd = payload.matchValueStart;
  }
  if (isCardProfile.value) {
    payload.cardBrand = detectCardBrand(payload.matchValuePlain, options.value.cardBrandOptions);
  }
  if (profile.value.rangeKind === 'cardBin') {
    payload.cardBrand = detectCardBrand(payload.matchValueStart, options.value.cardBrandOptions);
  }
  payload.sourceType = 'MANUAL';
  delete payload.matchValueHash;
  delete payload.matchValueMasked;
  return payload;
}

function openDetail(row: RiskRecord) {
  detailRow.value = row;
  detailOpen.value = true;
}

async function handleDelete(row?: RiskRecord) {
  if (!row?.id) return;
  await ElMessageBox.confirm(t('risk.common.deleteConfirm', { name: deleteTargetName(row) }), t('common.operationConfirm'), { type: 'warning' });
  await removeRiskRecord(current.value.moduleType, current.value.functionCode, row.id);
  ElMessage.success(t('common.deleteSuccess'));
  await loadData();
}

async function handleBatchDelete() {
  const ids = selectedRows.value.map((item) => item.id).filter(Boolean);
  if (ids.length === 0) return;
  await ElMessageBox.confirm(t('risk.common.batchDeleteConfirm', { count: ids.length, name: currentFunctionName.value }), t('common.operationConfirm'), { type: 'warning' });
  await batchRemoveRiskRecords(current.value.moduleType, current.value.functionCode, ids);
  ElMessage.success(t('common.deleteSuccess'));
  selectedRows.value = [];
  await loadData();
}

function deleteTargetName(row: RiskRecord) {
  const value = displayValue(row);
  return value && value !== '-' ? value : row.ruleName || currentFunctionName.value;
}

async function handleStatus(row: RiskRecord, status: number) {
  const action = status === 1 ? t('common.enable') : t('common.disable');
  const name = statusTargetName(row);
  try {
    await ElMessageBox.confirm(t('risk.common.statusToggleTargetConfirm', { action, name, targetType: statusTargetType() }), t('common.operationConfirm'), { type: 'warning' });
  } catch {
    return;
  }
  setStatusUpdating(row.id, true);
  try {
    await updateRiskStatus(current.value.moduleType, current.value.functionCode, row.id, status);
    row.status = status;
    ElMessage.success(t('risk.common.statusToggleSuccess', { action }));
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.statusToggleFailed', { action }));
  } finally {
    setStatusUpdating(row.id, false);
  }
}

function statusTargetName(row: RiskRecord) {
  const value = displayValue(row);
  return value && value !== '-' ? value : row.ruleName || currentFunctionName.value;
}

function statusTargetType() {
  if (current.value.moduleType === 'AML') return t('risk.common.amlList');
  if (current.value.moduleType === 'WHITE') return t('risk.common.whitelist');
  return t('risk.common.blacklist');
}

function isStatusUpdating(id?: number) {
  return id ? statusUpdatingIds.value.has(id) : false;
}

function setStatusUpdating(id: number | undefined, loading: boolean) {
  if (!id) return;
  const next = new Set(statusUpdatingIds.value);
  loading ? next.add(id) : next.delete(id);
  statusUpdatingIds.value = next;
}

async function handleExport() {
  try {
    await exportRiskConfig(current.value.moduleType, current.value.functionCode, sanitizeAmlQuery(query));
    ElMessage.success(t('risk.common.exportStarted'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.exportFailed'));
  }
}

async function handleTemplate() {
  try {
    await downloadRiskTemplate(current.value.moduleType, current.value.functionCode);
    ElMessage.success(t('risk.common.templateStarted'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.templateFailed'));
  }
}

async function handleImport(uploadFile: UploadFile) {
  if (!uploadFile.raw) return;
  try {
    const result = await importRiskConfig(current.value.moduleType, current.value.functionCode, uploadFile.raw);
    ElMessage.success(t('risk.common.importSuccess', { count: result.successCount }));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('risk.common.importFailed'));
  }
}

function handleCountryChange(value: string) {
  const matched = options.value.countryOptions.find((item) => item.value === value);
  form.countryAlpha3 = matched?.extra;
  form.countryNumeric = matched?.numericCode;
}

function handleRegionLevelChange() {
  if (form.regionMatchLevel !== 'COUNTRY') {
    const firstCountry = form.countryAlpha2 || regionSelectedCountries.value[0];
    regionSelectedCountries.value = firstCountry ? [firstCountry] : [];
    form.countryAlpha2 = firstCountry;
    form.countryAlpha2List = undefined;
  } else if (formMode.value === 'add') {
    regionSelectedCountries.value = form.countryAlpha2 ? [form.countryAlpha2] : regionSelectedCountries.value;
    syncRegionCountrySelection();
  }
  normalizeRegionFormFields();
  formRef.value?.validateField('countryAlpha2').catch(() => undefined);
  formRef.value?.validateField('countryAlpha2List').catch(() => undefined);
  formRef.value?.validateField('stateProvinceName').catch(() => undefined);
  formRef.value?.validateField('cityName').catch(() => undefined);
}

function normalizeRegionFormFields() {
  if (!profile.value.showRegion) return;
  if (form.regionMatchLevel === 'COUNTRY') {
    form.stateProvinceCode = undefined;
    form.stateProvinceName = undefined;
    form.cityCode = undefined;
    form.cityName = undefined;
  } else if (form.regionMatchLevel === 'STATE') {
    form.cityCode = undefined;
    form.cityName = undefined;
  }
}

function validateRegionCountryList(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (showRegionCountryMultiSelect.value && regionSelectedCountries.value.length === 0) {
    callback(new Error(t('risk.validation.countryRequired')));
    return;
  }
  callback();
}

function validateCountryListSelection(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (showCountryListMultiSelect.value && countryListSelectedCountries.value.length === 0) {
    callback(new Error(t('risk.validation.countryRequired')));
    return;
  }
  validateRegionCountryList(_rule, _value, callback);
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

function handleTargetMerchantVisibleChange(visible: boolean) {
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
    merchantOptions.value = [{ id: '0', merchantId: form.merchantId, merchantName: form.merchantName || '', merchantStatus: 1, merchantCategoryCode: '', countryCode: '', settlementCurrency: '', timezone: '', riskLevel: 1 }, ...merchantOptions.value];
  }
}

function syncCurrentTargetMerchantOption() {
  if (!form.matchValuePlain) {
    return;
  }
  const merchantId = String(form.matchValuePlain);
  const exists = merchantOptions.value.some((item) => item.merchantId === merchantId);
  if (!exists) {
    merchantOptions.value = [{ id: '0', merchantId, merchantName: '', merchantStatus: 1, merchantCategoryCode: '', countryCode: '', settlementCurrency: '', timezone: '', riskLevel: 1 }, ...merchantOptions.value];
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

function validateMerchant(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (isAmlModule.value) {
    callback();
    return;
  }
  if (form.merchantScope === 'MERCHANT' && !form.merchantId) {
    callback(new Error(t('risk.validation.merchantRequired')));
    return;
  }
  callback();
}

function sanitizeAmlQuery<T extends Record<string, any>>(data: T): T {
  if (!isAmlModule.value) {
    return data;
  }
  const next = { ...data };
  delete next.merchantScope;
  delete next.merchantId;
  return next as T;
}

function validateRegionState(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (showStateField.value && !String(form.stateProvinceName || '').trim()) {
    callback(new Error(t('risk.validation.stateRequired')));
    return;
  }
  callback();
}

function validateRegionCity(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (showCityField.value && !String(form.cityName || '').trim()) {
    callback(new Error(t('risk.validation.cityRequired')));
    return;
  }
  callback();
}

function validatePlainValue(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.valueInputType !== 'plain') {
    callback();
    return;
  }
  const value = String(form.matchValuePlain || '').trim();
  if (!value) {
    callback(new Error(t('risk.validation.matchValueRequired', { label: profileValueLabel.value })));
    return;
  }
  if (isCardProfile.value && !/^\d{12,19}$/.test(value)) {
    callback(new Error(t('risk.validation.cardNoFormat')));
    return;
  }
  if (profile.value.kind === 'email') {
    const emailError = validateEmailInput(value);
    if (emailError) {
      callback(new Error(emailError));
      return;
    }
  }
  if (profile.value.kind === 'emailUsername' && !emailUsernameRegex.test(value)) {
    callback(new Error(t('risk.validation.emailUsernameFormat')));
    return;
  }
  if (profile.value.kind === 'emailDomain' && !emailDomainRegex.test(normalizeEmailDomainInput(value))) {
    callback(new Error(t('risk.validation.emailDomainFormat')));
    return;
  }
  if (profile.value.kind === 'zip' && !postalCodeRegex.test(value)) {
    callback(new Error(t('risk.validation.postalCodeFormat')));
    return;
  }
  callback();
}

function validateEmailInput(value: string) {
  if (current.value.moduleType === 'AML' && !value.includes('@')) {
    return emailDomainRegex.test(normalizeEmailDomainInput(value)) ? '' : t('risk.validation.emailOrDomainFormat');
  }
  const atIndex = value.indexOf('@');
  if (atIndex <= 0 || atIndex !== value.lastIndexOf('@') || atIndex === value.length - 1) {
    return t('risk.validation.emailFormat');
  }
  const username = value.slice(0, atIndex);
  const domain = normalizeEmailDomainInput(value.slice(atIndex + 1));
  return emailUsernameRegex.test(username) && emailDomainRegex.test(domain) ? '' : t('risk.validation.emailFormat');
}

function normalizeEmailDomainInput(value: string) {
  return value.trim().replace(/^@+/, '');
}

function normalizePostalCodeInput(value: string) {
  return value.toUpperCase().replace(/\s+/g, ' ').trim();
}

function validateRangeStart(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.valueInputType !== 'range') {
    callback();
    return;
  }
  const start = String(form.matchValueStart || '').trim();
  if (!start) {
    callback(new Error(t('risk.validation.startValueRequired', { label: rangeStartLabel.value })));
    return;
  }
  if (profile.value.rangeKind === 'cardBin' && !isValidCardBinInput(start)) {
    callback(new Error(t('risk.validation.cardBinRangeFormat')));
    return;
  }
  if (profile.value.rangeKind === 'ip') {
    const startIp = parseIpAddress(start);
    if (!startIp) {
      callback(new Error(t('risk.validation.ipFormat')));
      return;
    }
    const end = String(form.matchValueEnd || '').trim();
    if (end) {
      const endIp = parseIpAddress(end);
      const rangeError = validateIpRangePair(startIp, endIp);
      if (rangeError) {
        callback(new Error(rangeError));
        return;
      }
    }
  }
  callback();
}

function validateRangeEnd(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (profile.value.valueInputType !== 'range') {
    callback();
    return;
  }
  const end = String(form.matchValueEnd || '').trim();
  if ((profile.value.rangeKind === 'cardBin' || profile.value.allowIpRange) && !end) {
    callback(new Error(t('risk.validation.endValueRequired', { label: rangeEndLabel.value })));
    return;
  }
  if (profile.value.rangeKind === 'cardBin') {
    if (!isValidCardBinInput(end)) {
      callback(new Error(t('risk.validation.cardBinRangeFormat')));
      return;
    }
    const start = String(form.matchValueStart || '').trim();
    if (isValidCardBinInput(start) && start.slice(0, 6) !== end.slice(0, 6)) {
      callback(new Error(t('risk.validation.cardBinPrefixSame')));
      return;
    }
    if (isValidCardBinInput(start) && normalizeCardBinStart(start) > normalizeCardBinEnd(end)) {
      callback(new Error(t('risk.validation.cardBinRangeOrder')));
      return;
    }
  }
  if (profile.value.rangeKind === 'ip') {
    const endIp = parseIpAddress(end);
    if (!endIp) {
      callback(new Error(t('risk.validation.ipFormat')));
      return;
    }
    const start = String(form.matchValueStart || '').trim();
    if (start) {
      const startIp = parseIpAddress(start);
      const rangeError = validateIpRangePair(startIp, endIp);
      if (rangeError) {
        callback(new Error(rangeError));
        return;
      }
    }
  }
  callback();
}

function isValidCardBinInput(value: string) {
  return /^\d{6,11}$/.test(value);
}

function normalizeCardBinStart(value: string) {
  return value.padEnd(11, '0');
}

function normalizeCardBinEnd(value: string) {
  return value.padEnd(11, '9');
}

type ParsedIpAddress = { version: 'IPV4' | 'IPV6'; number: bigint; segments: number[] };

function parseIpAddress(value: string): ParsedIpAddress | undefined {
  return value.includes(':') ? parseIpv6Address(value) : parseIpv4Address(value);
}

function parseIpv4Address(value: string): ParsedIpAddress | undefined {
  const parts = value.split('.');
  if (parts.length !== 4) return undefined;
  const segments = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  if (segments.some((segment) => !Number.isInteger(segment) || segment < 0 || segment > 255)) return undefined;
  const number = segments.reduce((acc, segment) => (acc << 8n) + BigInt(segment), 0n);
  return { version: 'IPV4', number, segments };
}

function parseIpv6Address(value: string): ParsedIpAddress | undefined {
  if (!/^[0-9a-fA-F:]+$/.test(value)) return undefined;
  const doubleColonCount = (value.match(/::/g) || []).length;
  if (doubleColonCount > 1) return undefined;
  const [leftText, rightText = ''] = value.split('::');
  const left = leftText ? leftText.split(':') : [];
  const right = rightText ? rightText.split(':') : [];
  if ([...left, ...right].some((part) => !/^[0-9a-fA-F]{1,4}$/.test(part))) return undefined;
  const missing = 8 - left.length - right.length;
  if (doubleColonCount === 0 && missing !== 0) return undefined;
  if (doubleColonCount === 1 && missing < 1) return undefined;
  const segments = [...left.map((part) => parseInt(part, 16)), ...Array(Math.max(missing, 0)).fill(0), ...right.map((part) => parseInt(part, 16))];
  if (segments.length !== 8) return undefined;
  const number = segments.reduce((acc, segment) => (acc << 16n) + BigInt(segment), 0n);
  return { version: 'IPV6', number, segments };
}

function validateIpRangePair(startIp?: ParsedIpAddress, endIp?: ParsedIpAddress) {
  if (!startIp || !endIp) return t('risk.validation.ipFormat');
  if (startIp.version !== endIp.version) return t('risk.validation.ipVersionSame');
  if (startIp.number > endIp.number) return t('risk.validation.ipRangeOrder');
  const differingSegments = startIp.segments.filter((segment, index) => segment !== endIp.segments[index]).length;
  if (current.value.moduleType === 'BLACK' && differingSegments > 1) return t('risk.validation.ipRangeSingleSegment');
  return '';
}

function validateValidityDays(_rule: unknown, _value: unknown, callback: (error?: Error) => void) {
  if (form.validityType === 'SUPER_LONG') {
    callback();
    return;
  }
  if (!form.validityDays || form.validityDays <= 0) {
    callback(new Error(t('risk.validation.validityDaysRequired')));
    return;
  }
  if (form.validityType === 'LONG' && form.validityDays < 120) {
    callback(new Error(t('risk.common.longValidityMin')));
    return;
  }
  callback();
}

function handlePlainValueInput(value: string) {
  if (isEmailDomainProfile.value) {
    const normalized = normalizeEmailDomainInput(value);
    if (normalized !== value) {
      form.matchValuePlain = normalized;
    }
    formRef.value?.validateField('matchValuePlain').catch(() => undefined);
    return;
  }
  if (!isCardProfile.value) {
    if (profile.value.kind === 'zip') {
      const normalized = normalizePostalCodeInput(value);
      if (normalized !== value) {
        form.matchValuePlain = normalized;
      }
      formRef.value?.validateField('matchValuePlain').catch(() => undefined);
    }
    return;
  }
  form.cardBrand = detectCardBrand(value, options.value.cardBrandOptions);
  formRef.value?.validateField('matchValuePlain').catch(() => undefined);
}

function handleRangeStartInput(value: string) {
  if (profile.value.rangeKind !== 'cardBin') {
    return;
  }
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits !== value) {
    form.matchValueStart = digits;
  }
  form.cardBrand = detectCardBrand(digits, options.value.cardBrandOptions);
  formRef.value?.validateField('matchValueStart').catch(() => undefined);
  formRef.value?.validateField('matchValueEnd').catch(() => undefined);
}

function handleRangeEndInput(value: string) {
  if (profile.value.rangeKind !== 'cardBin') {
    return;
  }
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits !== value) {
    form.matchValueEnd = digits;
  }
  formRef.value?.validateField('matchValueEnd').catch(() => undefined);
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

function riskLevelText(value?: string | number) {
  return optionLabel(riskLevelOptions.value, value);
}

function decisionActionText(value?: string | number) {
  return optionLabel(decisionActionOptions.value, value);
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

function regionLevelText(value?: string) {
  if (value === 'CITY') return t('risk.common.city');
  if (value === 'STATE') return t('risk.common.state');
  return t('risk.common.country');
}

type CountryGroup = {
  code: string;
  name: string;
  countries: RiskOption[];
};

function buildCountryGroups(items: RiskOption[]) {
  const map = new Map<string, CountryGroup>();
  items.forEach((item) => {
    const code = item.continentCode || 'OTHER';
    const name = item.continentName || continentNameByCode(code);
    if (!map.has(code)) {
      map.set(code, { code, name, countries: [] });
    }
    map.get(code)?.countries.push(item);
  });
  return Array.from(map.values());
}

function continentNameByCode(code: string) {
  return t(`risk.common.continent.${code}`);
}

function isContinentSelected(group?: CountryGroup) {
  if (!group?.countries.length) return false;
  return group.countries.every((item) => regionSelectedCountries.value.includes(String(item.value)));
}

function isContinentIndeterminate(group?: CountryGroup) {
  if (!group?.countries.length) return false;
  const selectedCount = group.countries.filter((item) => regionSelectedCountries.value.includes(String(item.value))).length;
  return selectedCount > 0 && selectedCount < group.countries.length;
}

function toggleContinent(group: CountryGroup | undefined, checked: boolean) {
  if (!group) return;
  const selected = new Set(regionSelectedCountries.value);
  group.countries.forEach((item) => {
    const code = String(item.value);
    checked ? selected.add(code) : selected.delete(code);
  });
  regionSelectedCountries.value = Array.from(selected);
  syncRegionCountrySelection();
}

function toggleRegionCountry(value: string, checked: boolean) {
  const selected = new Set(regionSelectedCountries.value);
  checked ? selected.add(value) : selected.delete(value);
  regionSelectedCountries.value = Array.from(selected);
  syncRegionCountrySelection();
}

function clearRegionCountrySelection() {
  regionSelectedCountries.value = [];
  syncRegionCountrySelection();
}

function syncRegionCountrySelection() {
  form.countryAlpha2List = [...regionSelectedCountries.value];
  form.countryAlpha2 = regionSelectedCountries.value[0];
  if (form.countryAlpha2) {
    handleCountryChange(form.countryAlpha2);
  } else {
    form.countryAlpha3 = undefined;
    form.countryNumeric = undefined;
  }
  formRef.value?.validateField('countryAlpha2List').catch(() => undefined);
}

function isCountryListContinentSelected(group?: CountryGroup) {
  if (!group?.countries.length) return false;
  return group.countries.every((item) => countryListSelectedCountries.value.includes(String(item.value)));
}

function isCountryListContinentIndeterminate(group?: CountryGroup) {
  if (!group?.countries.length) return false;
  const selectedCount = group.countries.filter((item) => countryListSelectedCountries.value.includes(String(item.value))).length;
  return selectedCount > 0 && selectedCount < group.countries.length;
}

function toggleCountryListContinent(group: CountryGroup | undefined, checked: boolean) {
  if (!group) return;
  const selected = new Set(countryListSelectedCountries.value);
  group.countries.forEach((item) => {
    const code = String(item.value);
    checked ? selected.add(code) : selected.delete(code);
  });
  countryListSelectedCountries.value = Array.from(selected);
  syncCountryListSelection();
}

function toggleCountryListCountry(value: string, checked: boolean) {
  const selected = new Set(countryListSelectedCountries.value);
  checked ? selected.add(value) : selected.delete(value);
  countryListSelectedCountries.value = Array.from(selected);
  syncCountryListSelection();
}

function clearCountryListSelection() {
  countryListSelectedCountries.value = [];
  syncCountryListSelection();
}

function syncCountryListSelection() {
  if (!isCountryProfile.value || !showCountryListMultiSelect.value) {
    return;
  }
  form.countryAlpha2List = [...countryListSelectedCountries.value];
  form.countryAlpha2 = countryListSelectedCountries.value[0];
  if (form.countryAlpha2) {
    handleCountryChange(form.countryAlpha2);
  } else {
    form.countryAlpha3 = undefined;
    form.countryNumeric = undefined;
  }
  formRef.value?.validateField('countryAlpha2List').catch(() => undefined);
}

function countryFlag(alpha2?: string | number) {
  const text = String(alpha2 || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(text)) return '';
  return Array.from(text).map((char) => String.fromCodePoint(127397 + char.charCodeAt(0))).join('');
}

function countryOptionFlag(item: { flagEmoji?: string; value?: string | number }) {
  return item.flagEmoji || countryFlag(item.value);
}

function countryOptionText(item: { label?: string; value?: string | number; extra?: string }) {
  const suffix = item.extra ? `（${item.extra}）` : '';
  return `${item.label || item.value || '-'}${suffix}`;
}

function countryDisplay(alpha2?: string, alpha3?: string) {
  const matched = options.value.countryOptions.find((item) => item.value === alpha2);
  if (matched) return `${countryOptionFlag(matched)} ${countryOptionText(matched)}`.trim();
  return alpha3 ? `${countryFlag(alpha2)} ${alpha3}`.trim() : alpha2 || '-';
}

function displayValue(row: RiskRecord) {
  if (profile.value.valueInputType === 'range' && row.matchValueStart) {
    return row.matchValueStart === row.matchValueEnd || !row.matchValueEnd ? row.matchValueStart : `${row.matchValueStart} - ${row.matchValueEnd}`;
  }
  return row.matchValueMasked || row.sourceUrl || row.countryAlpha2 || '-';
}

function validityText(row: RiskRecord) {
  if (row.validityType === 'LONG') return `${t('risk.common.longTerm')} ${row.validityDays || ''}${t('risk.common.daysUnit')}`;
  if (row.validityType === 'LIMITED') return `${t('risk.common.limited')} ${row.validityDays || ''}${t('risk.common.daysUnit')}`;
  return t('risk.common.superLong');
}

function isNeverExpire(row: Partial<RiskRecord>) {
  return row.validityType === 'SUPER_LONG';
}

function expireTimeText(row: RiskRecord) {
  return isNeverExpire(row) ? t('risk.common.neverExpire') : row.expireTime;
}

function sourceText(value?: string) {
  return sourceTypeOptions.value.find((item) => item.value === value)?.label || riskOptionLabel(t, 'sourceType', value);
}

function scopeText(value?: string) {
  return merchantScopeOptions.value.find((item) => item.value === value)?.label || riskOptionLabel(t, 'merchantScope', value);
}

function handlePilotColumnVisibleChange(key: string, visible: boolean) {
  const applied = setPilotColumnVisible(key, visible);
  if (!applied) {
    ElMessage.warning(t('table.atLeastOneColumn'));
  }
}
</script>

<style scoped>
.risk-page :deep(.el-form-item) {
  margin-bottom: 10px;
}

.query-select {
  width: 168px;
}

.country-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.country-select-prefix {
  display: inline-flex;
  align-items: center;
  height: 100%;
  font-size: 15px;
  line-height: 1;
}

.region-country-picker {
  display: grid;
  grid-template-columns: 176px 1fr;
  height: 292px;
  overflow: hidden;
}

.continent-panel {
  padding: 6px;
  background: #f8fafc;
  border-right: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;
}

.continent-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 0 10px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-regular);
}

.continent-item.is-active {
  background: #eaf3ff;
  color: var(--el-color-primary);
}

.continent-name {
  flex: 1;
  min-width: 0;
}

.continent-count {
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: #eef2f7;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 18px;
  text-align: center;
}

.country-panel {
  min-width: 0;
  padding: 8px 10px 8px 12px;
}

.country-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.country-list {
  display: grid;
  gap: 2px;
  max-height: 234px;
  overflow-y: auto;
  padding-top: 8px;
}

.country-list :deep(.el-checkbox) {
  min-height: 32px;
  margin-right: 0;
}

.country-list :deep(.el-checkbox__label) {
  min-width: 0;
  overflow: hidden;
}

.selected-country-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 54px;
  overflow: hidden;
  margin-top: 6px;
}

.selected-country-tags :deep(.el-tag) {
  max-width: 132px;
}

.selected-country-tags :deep(.el-tag__content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.validity-days-input {
  display: flex;
  align-items: center;
  width: 100%;
}

.validity-days-input :deep(.el-input-number) {
  flex: 1;
  width: auto;
}

.unit-text {
  margin-left: 8px;
  color: var(--el-text-color-regular);
}

.never-expire-tag {
  min-width: 72px;
  justify-content: center;
  border-color: rgba(34, 197, 94, 0.24);
  background: rgba(34, 197, 94, 0.08);
  color: #15803d;
  font-weight: 500;
}

.card-value-control {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  gap: 6px;
}

.card-value-control.is-card .card-value-input {
  width: 100%;
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
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.card-brand-preview.is-inline {
  justify-content: flex-start;
  width: 100%;
  min-height: 20px;
  padding: 0;
  border: 0;
  background: transparent;
}

.card-bin-range-row .bin-range-input {
  width: 100%;
}

.card-brand-preview :deep(.payment-logo-mark) {
  height: 20px;
  padding: 0;
  background: transparent;
}

.card-brand-preview :deep(.payment-logo-mark__asset) {
  display: block;
  height: 20px;
  mix-blend-mode: normal;
}

.card-brand-preview.is-pending {
  color: var(--el-text-color-placeholder);
}
</style>
