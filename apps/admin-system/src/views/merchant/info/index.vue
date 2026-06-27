<template>
  <div class="app-container merchant-info-page">
    <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="82px">
      <el-form-item :label="$t('merchant.info.keyword')">
        <el-input v-model="query.keyword" :placeholder="$t('merchant.info.keywordPlaceholder')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('common.status')">
        <el-select v-model="query.merchantStatus" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option :label="$t('merchant.info.statusNormal')" :value="1" />
          <el-option :label="$t('merchant.info.statusFrozen')" :value="2" />
          <el-option :label="$t('merchant.info.statusClosed')" :value="3" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('merchant.info.countryCode')">
        <el-input v-model="query.countryCode" placeholder="USA" clearable maxlength="3" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="resetQuery">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain :icon="Plus" size="small" @click="openForm('add')" v-hasPermi="'merchant:info:add'">{{ $t('common.add') }}</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'merchant:info:edit'">{{ $t('common.edit') }}</el-button>
      </el-col>
      <el-col class="right-toolbar">
        <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" />
      </el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="merchantId" :label="$t('merchant.info.merchantId')" min-width="140" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="merchantName" :label="$t('merchant.info.merchantName')" min-width="190" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="merchantCategoryCode" label="MCC" width="90" align="center" />
      <el-table-column prop="countryCode" :label="$t('merchant.info.countryCode')" width="100" align="center" />
      <el-table-column prop="settlementCurrency" :label="$t('merchant.info.settlementCurrency')" width="110" align="center" />
      <el-table-column :label="$t('merchant.info.riskLevel')" width="100" align="center">
        <template #default="{ row }"><el-tag size="small" :type="riskType(row.riskLevel)">{{ riskText(row.riskLevel) }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="110" align="center">
        <template #default="{ row }">
          <el-tag size="small" :type="statusType(row.merchantStatus)">{{ statusText(row.merchantStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('merchant.info.keyStatus')" min-width="210" align="center">
        <template #default="{ row }">
          <div class="key-status-line">
            <span>JWT</span>
            <el-tag size="small" :type="row.jwtKey ? 'success' : 'info'">{{ keyStateText(row.jwtKey) }}</el-tag>
            <em>{{ shortFingerprint(row.jwtKey?.fingerprint) }}</em>
          </div>
          <div class="key-status-line">
            <span>RSA</span>
            <el-tag size="small" :type="row.platformPayloadKey ? 'success' : 'info'">{{ keyStateText(row.platformPayloadKey) }}</el-tag>
            <em>{{ shortFingerprint(row.platformPayloadKey?.fingerprint) }}</em>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.createTime')" min-width="170" align="center" :show-overflow-tooltip="true">
        <template #default="{ row }"><BaseDateTime :value="row.gmtCreate" /></template>
      </el-table-column>
      <el-table-column :label="$t('common.operation')" align="center" width="300" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'merchant:info:query'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'merchant:info:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Key" @click="openKeys(row)" v-hasPermi="'merchant:key:manage'">{{ $t('merchant.info.keyManage') }}</el-button>
          <el-button size="small" type="primary" link :icon="Key" @click="openMaterial(row)" v-hasPermi="'merchant:material:view'">{{ $t('merchant.info.material') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formMode === 'add' ? $t('merchant.info.addTitle') : $t('merchant.info.editTitle')" v-model="formVisible" width="640px" append-to-body destroy-on-close>
      <el-form :model="form" label-width="112px" size="small">
        <el-form-item :label="$t('merchant.info.merchantId')"><el-input v-model="form.merchantId" :disabled="formMode === 'edit'" maxlength="32" /></el-form-item>
        <el-form-item :label="$t('merchant.info.merchantName')"><el-input v-model="form.merchantName" maxlength="128" /></el-form-item>
        <el-form-item :label="$t('merchant.info.shortName')"><el-input v-model="form.merchantShortName" maxlength="64" /></el-form-item>
        <el-form-item label="MCC">
          <el-cascader
            v-model="selectedMccPath"
            :options="localizedMccOptions"
            :props="mccCascaderProps"
            :show-all-levels="false"
            :placeholder="$t('common.pleaseSelect')"
            :loading="formOptionsLoading"
            filterable
            clearable
            style="width:100%"
            @change="handleMccChange"
          />
        </el-form-item>
        <el-form-item :label="$t('merchant.info.countryCode')">
          <el-select v-model="form.countryCode" filterable clearable :loading="formOptionsLoading" :placeholder="$t('common.pleaseSelect')" style="width:100%">
            <el-option v-for="item in formOptions.countries" :key="item.value" :label="countryOptionLabel(item)" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('merchant.info.settlementCurrency')">
          <el-select v-model="form.settlementCurrency" filterable clearable :loading="formOptionsLoading" :placeholder="$t('common.pleaseSelect')" style="width:100%">
            <el-option v-for="item in formOptions.currencies" :key="item.value" :label="currencyOptionLabel(item)" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('merchant.info.timezone')">
          <el-select v-model="form.timezone" filterable clearable style="width:100%" :placeholder="$t('common.pleaseSelect')">
            <el-option v-for="item in timezoneOptions" :key="item.dictValue" :label="item.dictLabel" :value="item.dictValue" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('common.status')"><el-select v-model="form.merchantStatus" style="width:100%"><el-option :label="$t('merchant.info.statusNormal')" :value="1" /><el-option :label="$t('merchant.info.statusFrozen')" :value="2" /><el-option :label="$t('merchant.info.statusClosed')" :value="3" /></el-select></el-form-item>
        <el-form-item :label="$t('merchant.info.riskLevel')"><el-select v-model="form.riskLevel" style="width:100%"><el-option :label="$t('merchant.info.riskLow')" :value="1" /><el-option :label="$t('merchant.info.riskNormal')" :value="2" /><el-option :label="$t('merchant.info.riskHigh')" :value="3" /></el-select></el-form-item>
        <el-form-item :label="$t('merchant.info.regionCode')"><el-input v-model="form.regionCode" /></el-form-item>
        <el-form-item :label="$t('merchant.info.contactEmail')"><el-input v-model="form.contactEmail" /></el-form-item>
        <el-form-item :label="$t('merchant.info.contactPhone')"><el-input v-model="form.contactPhone" /></el-form-item>
        <el-form-item :label="$t('merchant.info.city')"><el-input v-model="form.city" /></el-form-item>
        <el-form-item :label="$t('merchant.info.address')"><el-input v-model="form.addressLine" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="materialVisible" :title="$t('merchant.info.materialTitle')" size="760px" append-to-body>
      <template v-if="currentMerchant">
        <el-alert class="mb16" type="warning" :closable="false" :title="$t('merchant.info.secretWarning')" />
        <el-descriptions :column="1" border size="small" class="mb16">
          <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ currentMerchant.merchantId }}</el-descriptions-item>
          <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ currentMerchant.merchantName }}</el-descriptions-item>
          <el-descriptions-item label="JWT">{{ keySummaryText(currentMerchant.jwtKey) }}</el-descriptions-item>
          <el-descriptions-item label="Platform RSA">{{ keySummaryText(currentMerchant.platformPayloadKey) }}</el-descriptions-item>
          <el-descriptions-item label="Response RSA">{{ keySummaryText(currentMerchant.responseKey) }}</el-descriptions-item>
        </el-descriptions>
        <div class="material-actions">
          <el-button v-if="canDownloadPrivateMaterial" type="primary" :icon="Key" @click="downloadMaterial('SDK_KIT', 'ZIP')">{{ $t('merchant.info.downloadKit') }}</el-button>
          <el-button v-if="canDownloadPrivateMaterial" :icon="Key" @click="downloadMaterial('MERCHANT_CONFIG', 'PROPERTIES')">{{ $t('merchant.info.downloadConfig') }}</el-button>
          <el-button v-if="canCopyPrivateMaterial" :icon="Key" @click="copyMaterial('MERCHANT_CONFIG')">{{ $t('merchant.info.copyConfig') }}</el-button>
          <el-button v-if="canDownloadPrivateMaterial" :icon="Key" @click="downloadMaterial('MERCHANT_CONFIG_TEXT', 'PROPERTIES')">{{ $t('merchant.info.downloadTextConfig') }}</el-button>
          <el-button v-if="canCopyPrivateMaterial" :icon="Key" @click="copyMaterial('MERCHANT_CONFIG_TEXT')">{{ $t('merchant.info.copyTextConfig') }}</el-button>
          <el-button type="primary" :icon="Key" @click="provisionMaterial" v-hasPermi="'merchant:material:view'">{{ $t('merchant.info.provision') }}</el-button>
          <el-button :icon="Refresh" @click="rotateJwt" v-hasPermi="'merchant:key:rotate'">{{ $t('merchant.info.rotateJwt') }}</el-button>
          <el-button :icon="Refresh" @click="rotatePlatform" v-hasPermi="'merchant:platform-payload-key:rotate'">{{ $t('merchant.info.rotatePlatform') }}</el-button>
          <el-button :icon="Refresh" @click="rotateResponse" v-hasPermi="'merchant:response-key:update'">{{ $t('merchant.info.rotateResponse') }}</el-button>
        </div>
        <el-divider />
        <div class="secret-preview-list" v-hasPermi="'merchant:material:view'">
          <div class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantKey</strong>
                <p>{{ $t('merchant.info.merchantKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button v-if="canCopyMaterial" size="small" :loading="isMaterialActionLoading('view', 'JWT_KEY')" @click="viewMaterial('JWT_KEY')">{{ $t('merchant.info.viewSecret') }}</el-button>
                <el-button v-if="canCopyMaterial" size="small" :loading="isMaterialActionLoading('copy', 'JWT_KEY')" @click="copyMaterial('JWT_KEY')">{{ $t('merchant.info.copy') }}</el-button>
                <el-button v-if="canDownloadMaterial" size="small" :loading="isMaterialActionLoading('download', 'JWT_KEY')" @click="downloadMaterial('JWT_KEY', 'TXT')">{{ $t('merchant.info.download') }}</el-button>
              </div>
            </div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item :label="$t('merchant.info.algorithm')">{{ materialSummary?.jwtAlgorithm || currentMerchant.jwtKey?.algorithm || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.keyVersion')">{{ materialSummary?.jwtKeyVersion || currentMerchant.jwtKey?.keyVersion || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.fingerprint')">{{ materialSummary?.jwtKeyFingerprint || currentMerchant.jwtKey?.fingerprint || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>platformPublicKeyX509Base64</strong>
                <p>{{ $t('merchant.info.platformPublicKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" :loading="isMaterialActionLoading('view', 'PLATFORM_PUBLIC_KEY')" @click="viewMaterial('PLATFORM_PUBLIC_KEY')">{{ $t('merchant.info.viewSecret') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('copy', 'PLATFORM_PUBLIC_KEY')" @click="copyMaterial('PLATFORM_PUBLIC_KEY')">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'PLATFORM_PUBLIC_KEY')" @click="downloadMaterial('PLATFORM_PUBLIC_KEY', 'PEM')">PEM</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'PLATFORM_PUBLIC_KEY')" @click="downloadMaterial('PLATFORM_PUBLIC_KEY', 'TXT')">TXT</el-button>
              </div>
            </div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item :label="$t('merchant.info.algorithm')">{{ materialSummary?.platformPayloadAlgorithm || currentMerchant.platformPayloadKey?.algorithm || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.keySize')">{{ materialSummary?.platformPayloadKeySize || currentMerchant.platformPayloadKey?.keySize || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.fingerprint')">{{ materialSummary?.platformPayloadPublicKeyFingerprint || currentMerchant.platformPayloadKey?.fingerprint || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-if="canDownloadPrivateMaterial" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>platformPrivateKeyPkcs8Base64</strong>
                <p>{{ $t('merchant.info.platformPrivateKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" :loading="isMaterialActionLoading('view', 'PLATFORM_PRIVATE_KEY')" @click="viewMaterial('PLATFORM_PRIVATE_KEY')">{{ $t('merchant.info.viewSecret') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('copy', 'PLATFORM_PRIVATE_KEY')" @click="copyMaterial('PLATFORM_PRIVATE_KEY')">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'PLATFORM_PRIVATE_KEY')" @click="downloadMaterial('PLATFORM_PRIVATE_KEY', 'PEM')">PEM</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'PLATFORM_PRIVATE_KEY')" @click="downloadMaterial('PLATFORM_PRIVATE_KEY', 'TXT')">TXT</el-button>
              </div>
            </div>
            <el-alert type="warning" :closable="false" :title="$t('merchant.info.privateMaterialWarning')" />
          </div>
          <div class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantResponsePublicKeyX509Base64</strong>
                <p>{{ $t('merchant.info.responsePublicKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" :loading="isMaterialActionLoading('view', 'MERCHANT_RESPONSE_PUBLIC_KEY')" @click="viewMaterial('MERCHANT_RESPONSE_PUBLIC_KEY')">{{ $t('merchant.info.viewSecret') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('copy', 'MERCHANT_RESPONSE_PUBLIC_KEY')" @click="copyMaterial('MERCHANT_RESPONSE_PUBLIC_KEY')">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'MERCHANT_RESPONSE_PUBLIC_KEY')" @click="downloadMaterial('MERCHANT_RESPONSE_PUBLIC_KEY', 'PEM')">PEM</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'MERCHANT_RESPONSE_PUBLIC_KEY')" @click="downloadMaterial('MERCHANT_RESPONSE_PUBLIC_KEY', 'TXT')">TXT</el-button>
              </div>
            </div>
            <el-descriptions :column="1" border size="small">
              <el-descriptions-item :label="$t('merchant.info.algorithm')">{{ materialSummary?.merchantResponseAlgorithm || currentMerchant.responseKey?.algorithm || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.keySize')">{{ materialSummary?.merchantResponseKeySize || currentMerchant.responseKey?.keySize || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.fingerprint')">{{ materialSummary?.merchantResponsePublicKeyFingerprint || currentMerchant.responseKey?.fingerprint || '-' }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div v-if="canDownloadPrivateMaterial && responsePrivateKeyAvailable" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantResponsePrivateKeyPkcs8Base64</strong>
                <p>{{ $t('merchant.info.responsePrivateKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" :loading="isMaterialActionLoading('view', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="viewMaterial('MERCHANT_RESPONSE_PRIVATE_KEY')">{{ $t('merchant.info.viewSecret') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('copy', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="copyMaterial('MERCHANT_RESPONSE_PRIVATE_KEY')">{{ $t('merchant.info.copy') }}</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="downloadMaterial('MERCHANT_RESPONSE_PRIVATE_KEY', 'PEM')">PEM</el-button>
                <el-button size="small" :loading="isMaterialActionLoading('download', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="downloadMaterial('MERCHANT_RESPONSE_PRIVATE_KEY', 'TXT')">TXT</el-button>
              </div>
            </div>
            <el-alert type="warning" :closable="false" :title="$t('merchant.info.privateMaterialWarning')" />
          </div>
          <div v-else-if="canDownloadPrivateMaterial" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>merchantResponsePrivateKeyPkcs8Base64</strong>
                <p>{{ $t('merchant.info.responsePrivateKeyHelp') }}</p>
              </div>
              <div class="secret-preview__actions">
                <el-button size="small" type="warning" @click="rotateResponse">{{ $t('merchant.info.rotateResponse') }}</el-button>
              </div>
            </div>
            <el-alert type="warning" :closable="false" :title="$t('merchant.info.responsePrivateMissing')" />
          </div>
        </div>
        <el-divider />
        <div class="material-log-section" v-hasPermi="'merchant:material:logs'">
          <div class="section-title">
            <span>{{ $t('merchant.info.materialLogs') }}</span>
            <el-button size="small" :icon="Refresh" :loading="materialLogsLoading" @click="loadMaterialLogs">{{ $t('common.refresh') }}</el-button>
          </div>
          <el-table v-loading="materialLogsLoading" :data="materialLogs" row-key="id" size="small">
            <el-table-column prop="operationName" :label="$t('merchant.info.logOperation')" min-width="170" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('merchant.info.logBusinessType')" width="110" align="center">
              <template #default="{ row }">{{ businessTypeText(row.businessType) }}</template>
            </el-table-column>
            <el-table-column prop="operatorName" :label="$t('merchant.info.logOperator')" min-width="120" align="center" :show-overflow-tooltip="true" />
            <el-table-column prop="requestMethod" :label="$t('merchant.info.logMethod')" width="90" align="center" />
            <el-table-column prop="operIp" :label="$t('merchant.info.logIp')" min-width="130" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="$t('merchant.info.logCostTime')" width="100" align="center">
              <template #default="{ row }">{{ typeof row.costTime === 'number' ? `${row.costTime} ms` : '-' }}</template>
            </el-table-column>
            <el-table-column :label="$t('common.status')" width="90" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? $t('status.success') : $t('status.failed') }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('merchant.info.logOperTime')" min-width="170" align="center">
              <template #default="{ row }"><BaseDateTime :value="row.operatedAt" /></template>
            </el-table-column>
            <el-table-column prop="errorMsg" :label="$t('merchant.info.logError')" min-width="180" :show-overflow-tooltip="true" />
          </el-table>
          <div class="pagination-container compact" v-show="materialLogTotal > 0">
            <el-pagination
              v-model:current-page="materialLogPage"
              v-model:page-size="materialLogPageSize"
              :total="materialLogTotal"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              small
              background
              @size-change="loadMaterialLogs"
              @current-change="loadMaterialLogs"
            />
          </div>
        </div>
      </template>
    </el-drawer>

    <el-drawer v-model="keysVisible" :title="$t('merchant.info.keyManageTitle')" size="860px" append-to-body>
      <template v-if="keyBundle">
        <el-alert class="mb16" type="info" :closable="false" :title="$t('merchant.info.keyManageWarning')" />
        <el-descriptions :column="1" border size="small" class="mb16">
          <el-descriptions-item :label="$t('merchant.info.merchantId')">{{ keyBundle.merchantId }}</el-descriptions-item>
          <el-descriptions-item :label="$t('merchant.info.merchantName')">{{ keyBundle.merchantName }}</el-descriptions-item>
        </el-descriptions>
        <div class="secret-preview-list">
          <div v-for="item in keyBundle.keys" :key="`${item.keyType}-${item.keyVersion || item.fingerprint}`" class="secret-preview">
            <div class="secret-preview__header">
              <div>
                <strong>{{ keyTitle(item) }}</strong>
                <p>{{ item.usage }}</p>
              </div>
              <el-tag size="small" :type="item.enabled === 1 ? 'success' : 'info'">{{ item.enabled === 1 ? $t('merchant.info.configured') : $t('merchant.info.disabled') }}</el-tag>
            </div>
            <el-descriptions :column="1" border size="small" class="mb12">
              <el-descriptions-item :label="$t('merchant.info.owner')">{{ item.owner || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.algorithm')">{{ item.algorithm || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.keySize')">{{ item.keySize || '-' }}</el-descriptions-item>
              <el-descriptions-item :label="$t('merchant.info.fingerprint')">{{ item.fingerprint || '-' }}</el-descriptions-item>
              <el-descriptions-item v-if="item.keyVersion" :label="$t('merchant.info.keyVersion')">{{ item.keyVersion }}</el-descriptions-item>
              <el-descriptions-item v-if="item.gmtModified" :label="$t('common.updateTime')"><BaseDateTime :value="item.gmtModified" /></el-descriptions-item>
            </el-descriptions>
            <div v-if="materialKeyType(item)" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>merchantKey</strong><p>{{ $t('merchant.info.merchantKeyHelp') }}</p></div>
                <div class="secret-preview__actions">
                  <el-button v-if="canCopyMaterial" size="small" :loading="isMaterialActionLoading('view', materialKeyType(item))" @click="viewMaterial(materialKeyType(item)!)">{{ $t('merchant.info.viewSecret') }}</el-button>
                  <el-button v-if="canCopyMaterial" size="small" :loading="isMaterialActionLoading('copy', materialKeyType(item))" @click="copyMaterial(materialKeyType(item)!)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button v-if="canDownloadMaterial" size="small" :loading="isMaterialActionLoading('download', materialKeyType(item))" @click="downloadMaterial(materialKeyType(item)!, 'TXT')">TXT</el-button>
                </div>
              </div>
              <el-alert type="warning" :closable="false" :title="$t('merchant.info.sharedSecretWarning')" />
            </div>
            <div v-if="privateMaterialKeyType(item) && canExportPrivateMaterial(item)" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>{{ privateKeyTitle(item) }}</strong><p>{{ privateKeyHelp(item) }}</p></div>
                <div class="secret-preview__actions">
                  <el-button v-if="canCopyPrivateMaterial" size="small" :loading="isMaterialActionLoading('view', privateMaterialKeyType(item))" @click="viewMaterial(privateMaterialKeyType(item)!)">{{ $t('merchant.info.viewSecret') }}</el-button>
                  <el-button v-if="canCopyPrivateMaterial" size="small" :loading="isMaterialActionLoading('copy', privateMaterialKeyType(item))" @click="copyMaterial(privateMaterialKeyType(item)!)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button v-if="canDownloadPrivateMaterial" size="small" :loading="isMaterialActionLoading('download', privateMaterialKeyType(item))" @click="downloadMaterial(privateMaterialKeyType(item)!, 'PEM')">PEM</el-button>
                  <el-button v-if="canDownloadPrivateMaterial" size="small" :loading="isMaterialActionLoading('download', privateMaterialKeyType(item))" @click="downloadMaterial(privateMaterialKeyType(item)!, 'TXT')">TXT</el-button>
                </div>
              </div>
              <el-alert type="warning" :closable="false" :title="$t('merchant.info.privateMaterialWarning')" />
            </div>
            <div v-if="publicMaterialKeyType(item)" class="key-value-block">
              <div class="secret-preview__header compact">
                <div><strong>{{ publicKeyTitle(item) }}</strong><p>{{ publicKeyHelp(item) }}</p></div>
                <div class="secret-preview__actions">
                  <el-button size="small" :loading="isMaterialActionLoading('view', publicMaterialKeyType(item))" @click="viewMaterial(publicMaterialKeyType(item)!)">{{ $t('merchant.info.viewSecret') }}</el-button>
                  <el-button size="small" :loading="isMaterialActionLoading('copy', publicMaterialKeyType(item))" @click="copyMaterial(publicMaterialKeyType(item)!)">{{ $t('merchant.info.copy') }}</el-button>
                  <el-button size="small" :loading="isMaterialActionLoading('download', publicMaterialKeyType(item))" @click="downloadMaterial(publicMaterialKeyType(item)!, 'PEM')">PEM</el-button>
                  <el-button size="small" :loading="isMaterialActionLoading('download', publicMaterialKeyType(item))" @click="downloadMaterial(publicMaterialKeyType(item)!, 'TXT')">TXT</el-button>
                </div>
              </div>
            </div>
            <el-alert v-else-if="item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA'" type="warning" :closable="false" :title="$t('merchant.info.responsePrivateMissing')" />
          </div>
        </div>
        <template v-if="keyBundle.keys.length === 0">
          <el-empty :description="$t('merchant.info.noKeys')" />
        </template>
        <div class="drawer-footer">
          <el-button type="primary" @click="openResponseKeyUpdate" v-hasPermi="'merchant:response-key:update'">{{ $t('merchant.info.updateResponseKey') }}</el-button>
        </div>
      </template>
    </el-drawer>

    <el-dialog v-model="responseKeyVisible" :title="$t('merchant.info.updateResponseKey')" width="680px" append-to-body destroy-on-close>
      <el-form label-position="top" size="small">
        <el-form-item label="merchantResponsePublicKeyX509Base64">
          <el-input v-model="responseKeyForm.publicKeyX509Base64" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="merchantResponsePrivateKeyPkcs8Base64">
          <el-input v-model="responseKeyForm.privateKeyPkcs8Base64" type="textarea" :rows="8" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="responseKeyVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="submitResponseKey">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewedMaterialVisible" :title="viewedMaterial.name" width="760px" append-to-body destroy-on-close>
      <el-alert class="mb16" type="warning" :closable="false" :title="$t('merchant.info.viewedMaterialHint')" />
      <el-input :model-value="viewedMaterial.content" type="textarea" :autosize="{ minRows: 8, maxRows: 18 }" readonly />
      <template #footer>
        <el-button @click="viewedMaterialVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="copyViewedMaterial">{{ $t('merchant.info.copy') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Edit, Key, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
  createMerchant,
  copyOpenApiKeyMaterial,
  downloadOpenApiKeyMaterial,
  getMerchantFormOptions,
  getMerchantKeys,
  getOpenApiKeyMaterialSummary,
  getOpenApiKeyMaterialLogs,
  provisionSecurityMaterial,
  rotateJwtKey,
  rotateMerchantResponseKey,
  rotatePlatformPayloadKey,
  searchMerchants,
  updateMerchant,
  updateMerchantResponseKey,
  type MerchantKeyBundle,
  type MerchantKeyMaterial,
  type MerchantInfo,
  type MerchantFormOptions,
  type MerchantOptionItem,
  type MerchantOptionNode,
  type MerchantSaveRequest,
  type MerchantSecurityMaterial,
  type MerchantKeySummary,
  type OpenApiKeyMaterialSummary,
  type OpenApiKeyOperationLog,
  type OpenApiKeyExportFormat,
  type OpenApiKeyType,
  viewOpenApiKeyMaterial,
} from '@/api/merchant/info';
import { searchDictData, type SysDictData } from '@/api/system/dict';
import { useUserStore } from '@/store/modules/user';

const { t, locale } = useI18n();
const userStore = useUserStore();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<MerchantInfo[]>([]);
const selectedRows = ref<MerchantInfo[]>([]);
const timezoneOptions = ref<SysDictData[]>([]);
const formOptions = reactive<MerchantFormOptions>({ mccOptions: [], countries: [], currencies: [] });
const formOptionsLoading = ref(false);
const selectedMccPath = ref<string[]>([]);
const mccCascaderProps = { emitPath: true };
const page = ref(1);
const pageSize = ref(10);
const total = ref(0);
const query = reactive<{ keyword: string; merchantStatus?: number; countryCode: string }>({ keyword: '', merchantStatus: undefined, countryCode: '' });

const emptyForm = (): MerchantSaveRequest => ({
  merchantId: '',
  merchantName: '',
  merchantShortName: '',
  merchantStatus: 1,
  merchantCategoryCode: '',
  countryCode: '',
  regionCode: '',
  city: '',
  addressLine: '',
  contactEmail: '',
  contactPhone: '',
  settlementCurrency: 'USD',
  timezone: 'Asia/Shanghai',
  riskLevel: 2,
});
const form = reactive<MerchantSaveRequest>(emptyForm());
const formVisible = ref(false);
const formMode = ref<'add' | 'edit'>('add');
const editingId = ref<number>();
const materialVisible = ref(false);
const currentMerchant = ref<MerchantInfo>();
const material = ref<MerchantSecurityMaterial>();
const materialSummary = ref<OpenApiKeyMaterialSummary>();
const viewedMaterial = reactive({ name: '', content: '' });
const viewedMaterialVisible = ref(false);
const materialActionLoading = reactive<Record<string, boolean>>({});
const materialLogs = ref<OpenApiKeyOperationLog[]>([]);
const materialLogsLoading = ref(false);
const materialLogPage = ref(1);
const materialLogPageSize = ref(10);
const materialLogTotal = ref(0);
const keysVisible = ref(false);
const keyBundle = ref<MerchantKeyBundle>();
const responseKeyVisible = ref(false);
const responseKeyForm = reactive({ publicKeyX509Base64: '', privateKeyPkcs8Base64: '' });
const canCopyMaterial = userStore.hasPermission('merchant:material:copy');
const canDownloadMaterial = userStore.hasPermission('merchant:material:download');
const canDownloadPrivateMaterial = userStore.hasPermission('merchant:material:download') && userStore.hasPermission('merchant:material:private');
const canCopyPrivateMaterial = userStore.hasPermission('merchant:material:copy') && userStore.hasPermission('merchant:material:private');
const canViewMaterialLogs = userStore.hasPermission('merchant:material:logs');
const responsePrivateKeyAvailable = computed(() => materialSummary.value?.merchantResponsePrivateKeyAvailable === true);
const localizedMccOptions = computed(() => formOptions.mccOptions.map(localizeMccNode));

onMounted(() => {
  loadData();
  loadTimezones();
  loadFormOptions();
});

async function loadData() {
  loading.value = true;
  try {
    const result = await searchMerchants({ pageNo: page.value, pageSize: pageSize.value, keyword: query.keyword || undefined, merchantStatus: query.merchantStatus, countryCode: query.countryCode || undefined });
    rows.value = result.records;
    total.value = result.total;
  } catch {
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

function handleSearch() { page.value = 1; loadData(); }
function resetQuery() { query.keyword = ''; query.merchantStatus = undefined; query.countryCode = ''; handleSearch(); }
async function openForm(mode: 'add' | 'edit', row?: MerchantInfo) {
  await loadFormOptions();
  formMode.value = mode;
  editingId.value = row?.id;
  Object.assign(form, emptyForm(), row || {});
  selectedMccPath.value = resolveMccPath(form.merchantCategoryCode);
  formVisible.value = true;
}
function openDetail(row: MerchantInfo) { openMaterial(row); }
function openMaterial(row: MerchantInfo) {
  currentMerchant.value = row;
  material.value = undefined;
  materialSummary.value = undefined;
  viewedMaterial.name = '';
  viewedMaterial.content = '';
  viewedMaterialVisible.value = false;
  materialLogs.value = [];
  materialLogTotal.value = 0;
  materialLogPage.value = 1;
  materialVisible.value = true;
  loadMaterialSummary();
  if (canViewMaterialLogs) {
    loadMaterialLogs();
  }
}

async function loadMaterialSummary() {
  if (!currentMerchant.value) return;
  try {
    materialSummary.value = await getOpenApiKeyMaterialSummary(currentMerchant.value.merchantId);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  }
}

async function loadTimezones() {
  try {
    const result = await searchDictData({ pageNo: 1, pageSize: 1000, dictType: 'sys_timezone', locale: String(locale.value), status: 1 });
    timezoneOptions.value = result.records;
  } catch {
    timezoneOptions.value = [];
  }
}

async function loadFormOptions() {
  if (formOptions.mccOptions.length > 0 && formOptions.countries.length > 0 && formOptions.currencies.length > 0) return;
  formOptionsLoading.value = true;
  try {
    const result = await getMerchantFormOptions();
    formOptions.mccOptions = result.mccOptions || [];
    formOptions.countries = result.countries || [];
    formOptions.currencies = result.currencies || [];
    selectedMccPath.value = resolveMccPath(form.merchantCategoryCode);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    formOptionsLoading.value = false;
  }
}

function handleMccChange(value: unknown) {
  if (Array.isArray(value) && value.length > 0) {
    form.merchantCategoryCode = String(value[value.length - 1] || '');
    return;
  }
  form.merchantCategoryCode = '';
}

function resolveMccPath(mccCode?: string) {
  if (!mccCode) return [];
  for (const level1 of formOptions.mccOptions) {
    for (const level2 of level1.children || []) {
      const leaf = (level2.children || []).find(item => item.value === mccCode);
      if (leaf) {
        return [level1.value, level2.value, leaf.value];
      }
    }
  }
  return [];
}

function localizeMccNode(node: MerchantOptionNode): MerchantOptionNode {
  const children = (node.children || []).map(localizeMccNode);
  return {
    ...node,
    label: children.length > 0 ? optionName(node) || node.label : codeNameLabel(node.value, node),
    children,
  };
}

function countryOptionLabel(item: MerchantOptionItem) {
  return codeNameLabel(item.value, item);
}

function currencyOptionLabel(item: MerchantOptionItem) {
  const separator = isEnglishLocale() ? ', ' : '，';
  const colon = isEnglishLocale() ? ': ' : '：';
  return [
    codeNameLabel(item.value, item),
    `${t('base.currency.minorUnit')}${colon}${item.fractionDigits ?? '-'}`,
    `${t('base.currency.minAmount')}${colon}${formatMinimumAmount(item.minimumAmount)}`,
  ].join(separator);
}

function codeNameLabel(code: string, item: Pick<MerchantOptionItem, 'label' | 'nameCn' | 'nameEn'>) {
  const name = optionName(item);
  return name ? `${code}（${name}）` : item.label || code;
}

function optionName(item: Pick<MerchantOptionItem, 'nameCn' | 'nameEn'>) {
  const preferred = isEnglishLocale() ? item.nameEn : item.nameCn;
  return preferred || item.nameCn || item.nameEn || '';
}

function isEnglishLocale() {
  return String(locale.value).toLowerCase().startsWith('en');
}

function formatMinimumAmount(value?: number | string) {
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}

async function submitForm() {
  try {
    if (formMode.value === 'add') await createMerchant(form);
    else if (editingId.value) await updateMerchant(editingId.value, form);
    ElMessage.success(t('common.saveSuccess'));
    formVisible.value = false;
    loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function provisionMaterial() {
  if (!currentMerchant.value) return;
  try {
    await confirmSecretAction(t('merchant.info.provision'));
    material.value = await provisionSecurityMaterial(currentMerchant.value.merchantId);
    ElMessage.success(t('common.success'));
    loadData();
    loadMaterialSummary();
    loadMaterialLogs();
  } catch { /* cancelled or failed */ }
}
async function rotateJwt() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotateJwt')); material.value = await rotateJwtKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); loadMaterialSummary(); loadMaterialLogs(); } catch { /* ignore */ }
}
async function rotatePlatform() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotatePlatform')); material.value = await rotatePlatformPayloadKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); loadMaterialSummary(); loadMaterialLogs(); } catch { /* ignore */ }
}
async function rotateResponse() {
  if (!currentMerchant.value) return;
  try { await confirmSecretAction(t('merchant.info.rotateResponse')); material.value = await rotateMerchantResponseKey(currentMerchant.value.merchantId); ElMessage.success(t('common.success')); loadData(); loadMaterialSummary(); loadMaterialLogs(); } catch { /* ignore */ }
}

async function loadMaterialLogs() {
  if (!currentMerchant.value || !canViewMaterialLogs) return;
  materialLogsLoading.value = true;
  try {
    const result = await getOpenApiKeyMaterialLogs(currentMerchant.value.merchantId, materialLogPage.value, materialLogPageSize.value);
    materialLogs.value = result.records;
    materialLogTotal.value = result.total;
  } catch (error: any) {
    materialLogs.value = [];
    materialLogTotal.value = 0;
    ElMessage.error(error?.message || t('common.loadFailed'));
  } finally {
    materialLogsLoading.value = false;
  }
}

async function openKeys(row: MerchantInfo) {
  currentMerchant.value = row;
  keysVisible.value = true;
  keyBundle.value = undefined;
  try {
    keyBundle.value = await getMerchantKeys(row.merchantId);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

function openResponseKeyUpdate() {
  const responseKey = keyBundle.value?.keys.find(item => item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA');
  responseKeyForm.publicKeyX509Base64 = responseKey?.publicKeyX509Base64 || '';
  responseKeyForm.privateKeyPkcs8Base64 = responseKey?.privateKeyPkcs8Base64 || '';
  responseKeyVisible.value = true;
}

async function submitResponseKey() {
  if (!keyBundle.value) return;
  try {
    await updateMerchantResponseKey(keyBundle.value.merchantId, responseKeyForm.publicKeyX509Base64, responseKeyForm.privateKeyPkcs8Base64);
    ElMessage.success(t('common.saveSuccess'));
    responseKeyVisible.value = false;
    keyBundle.value = await getMerchantKeys(keyBundle.value.merchantId);
    loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function confirmSecretAction(action: string) {
  await ElMessageBox.confirm(t('merchant.info.secretConfirm', { action }), t('common.operationConfirm'), { type: 'warning' });
}

async function copyMaterial(keyType: OpenApiKeyType) {
  if (!currentMerchant.value) return;
  const loadingKey = materialActionKey('copy', keyType);
  materialActionLoading[loadingKey] = true;
  try {
    if (isSensitiveExportType(keyType)) {
      await confirmSecretAction(t('merchant.info.copy'));
    }
    const result = await copyOpenApiKeyMaterial(currentMerchant.value.merchantId, keyType, keyType === 'MERCHANT_CONFIG' ? 'PROPERTIES' : 'TEXT');
    await navigator.clipboard.writeText(result.content);
    ElMessage.success(t('merchant.info.copySuccess', { name: keyType }));
    loadMaterialLogs();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  } finally {
    materialActionLoading[loadingKey] = false;
  }
}

async function viewMaterial(keyType: OpenApiKeyType) {
  if (!currentMerchant.value) return;
  const loadingKey = materialActionKey('view', keyType);
  materialActionLoading[loadingKey] = true;
  try {
    if (isSensitiveExportType(keyType)) {
      await confirmSecretAction(t('merchant.info.viewSecret'));
    }
    const result = await viewOpenApiKeyMaterial(currentMerchant.value.merchantId, keyType, keyType === 'MERCHANT_CONFIG' ? 'PROPERTIES' : 'TEXT');
    viewedMaterial.name = materialDisplayName(keyType);
    viewedMaterial.content = result.content;
    viewedMaterialVisible.value = true;
    loadMaterialLogs();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  } finally {
    materialActionLoading[loadingKey] = false;
  }
}

async function copyViewedMaterial() {
  if (!viewedMaterial.content) return;
  await navigator.clipboard.writeText(viewedMaterial.content);
  ElMessage.success(t('merchant.info.copySuccess', { name: viewedMaterial.name }));
}

async function downloadMaterial(keyType: OpenApiKeyType, format?: OpenApiKeyExportFormat) {
  if (!currentMerchant.value) return;
  const loadingKey = materialActionKey('download', keyType);
  materialActionLoading[loadingKey] = true;
  try {
    if (isSensitiveExportType(keyType)) {
      await confirmSecretAction(t('merchant.info.download'));
    }
    await downloadOpenApiKeyMaterial(currentMerchant.value.merchantId, keyType, format);
    loadMaterialLogs();
  } catch (error: any) {
    if (error?.message) ElMessage.error(error.message);
  } finally {
    materialActionLoading[loadingKey] = false;
  }
}

function materialActionKey(action: 'view' | 'copy' | 'download', keyType: OpenApiKeyType) {
  return `${action}:${keyType}`;
}

function isMaterialActionLoading(action: 'view' | 'copy' | 'download', keyType?: OpenApiKeyType) {
  return keyType ? materialActionLoading[materialActionKey(action, keyType)] === true : false;
}

function statusText(status: number) {
  return status === 1 ? t('merchant.info.statusNormal') : status === 2 ? t('merchant.info.statusFrozen') : t('merchant.info.statusClosed');
}
function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 ? 'warning' : 'danger';
}
function riskText(level: number) {
  return level === 1 ? t('merchant.info.riskLow') : level === 3 ? t('merchant.info.riskHigh') : t('merchant.info.riskNormal');
}
function riskType(level: number) {
  return level === 1 ? 'success' : level === 3 ? 'danger' : 'warning';
}

function keyStateText(key?: MerchantKeySummary) {
  return key ? t('merchant.info.configured') : t('merchant.info.notConfigured');
}

function shortFingerprint(value?: string) {
  if (!value) return '-';
  return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-6)}` : value;
}

function keySummaryText(key?: MerchantKeySummary) {
  if (!key) return t('merchant.info.notConfigured');
  return `${key.algorithm || '-'} / ${key.keySize || '-'} / ${key.fingerprint || '-'}`;
}

function keyTitle(item: MerchantKeyMaterial) {
  if (item.keyType === 'MERCHANT_JWT') return 'merchantKey';
  if (item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA') return 'platformPayloadKey';
  if (item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA') return 'merchantResponseKey';
  return item.keyName || item.keyType;
}

function publicKeyTitle(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? 'platformPublicKeyX509Base64' : 'merchantResponsePublicKeyX509Base64';
}

function privateKeyTitle(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? 'platformPrivateKeyPkcs8Base64' : 'merchantResponsePrivateKeyPkcs8Base64';
}

function publicKeyHelp(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? t('merchant.info.platformPublicKeyHelp') : t('merchant.info.responsePublicKeyHelp');
}

function privateKeyHelp(item: MerchantKeyMaterial) {
  return item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA' ? t('merchant.info.platformPrivateKeyHelp') : t('merchant.info.responsePrivateKeyHelp');
}

function materialKeyType(item: MerchantKeyMaterial): OpenApiKeyType | undefined {
  if (item.keyType === 'MERCHANT_JWT') return 'JWT_KEY';
  return undefined;
}

function privateMaterialKeyType(item: MerchantKeyMaterial): OpenApiKeyType | undefined {
  if (item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA') return 'PLATFORM_PRIVATE_KEY';
  if (item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA') return 'MERCHANT_RESPONSE_PRIVATE_KEY';
  return undefined;
}

function publicMaterialKeyType(item: MerchantKeyMaterial): OpenApiKeyType | undefined {
  if (item.keyType === 'PLATFORM_REQUEST_PAYLOAD_RSA') return 'PLATFORM_PUBLIC_KEY';
  if (item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA') return 'MERCHANT_RESPONSE_PUBLIC_KEY';
  return undefined;
}

function canExportPrivateMaterial(item: MerchantKeyMaterial) {
  if (!privateMaterialKeyType(item)) return false;
  if (item.keyType === 'MERCHANT_RESPONSE_PAYLOAD_RSA' && item.stored !== true) return false;
  return canCopyPrivateMaterial || canDownloadPrivateMaterial;
}

function isSensitiveExportType(keyType: OpenApiKeyType) {
  return keyType === 'JWT_KEY'
    || keyType === 'MERCHANT_RESPONSE_PRIVATE_KEY'
    || keyType === 'PLATFORM_PRIVATE_KEY'
    || keyType === 'MERCHANT_CONFIG'
    || keyType === 'MERCHANT_CONFIG_TEXT'
    || keyType === 'SDK_KIT';
}

function materialDisplayName(keyType: OpenApiKeyType) {
  if (keyType === 'JWT_KEY') return 'merchantKey';
  if (keyType === 'PLATFORM_PUBLIC_KEY') return 'platformPublicKeyX509Base64';
  if (keyType === 'PLATFORM_PRIVATE_KEY') return 'platformPrivateKeyPkcs8Base64';
  if (keyType === 'MERCHANT_RESPONSE_PUBLIC_KEY') return 'merchantResponsePublicKeyX509Base64';
  if (keyType === 'MERCHANT_RESPONSE_PRIVATE_KEY') return 'merchantResponsePrivateKeyPkcs8Base64';
  if (keyType === 'MERCHANT_CONFIG') return 'merchant-config.properties';
  if (keyType === 'MERCHANT_CONFIG_TEXT') return 'merchant-config-text.properties';
  return 'SDK_KIT';
}

function businessTypeText(type?: number) {
  if (type === 1) return t('dashboard.operationCreate');
  if (type === 2) return t('dashboard.operationUpdate');
  if (type === 3) return t('dashboard.operationDelete');
  if (type === 4) return t('dashboard.operationQuery');
  if (type === 5) return t('dashboard.operationExport');
  if (type === 6) return t('dashboard.operationAudit');
  if (type === 7) return t('dashboard.operationFreeze');
  if (type === 8) return t('dashboard.operationUnfreeze');
  return t('dashboard.operationUnknown');
}
</script>

<style scoped>
.merchant-info-page .key-status-line {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  line-height: 22px;
  white-space: nowrap;
}

.merchant-info-page .key-status-line span {
  width: 32px;
  color: #606266;
}

.merchant-info-page .key-status-line em {
  max-width: 92px;
  overflow: hidden;
  color: #909399;
  font-style: normal;
  text-overflow: ellipsis;
}

.material-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.material-actions :deep(.el-button) {
  width: 100%;
  min-width: 0;
  margin-left: 0;
}

@media (max-width: 720px) {
  .material-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.mb16 {
  margin-bottom: 16px;
}

.mb12 {
  margin-bottom: 12px;
}

.secret-preview-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.secret-preview {
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 12px;
  background: #fff;
}

.secret-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.secret-preview__header strong {
  display: block;
  color: #303133;
  font-size: 13px;
  line-height: 20px;
}

.secret-preview__header p {
  margin: 2px 0 0;
  color: #909399;
  font-size: 12px;
  line-height: 18px;
}

.secret-preview__actions {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
}

.secret-preview__header.compact {
  margin-top: 8px;
}

.key-value-block + .key-value-block {
  margin-top: 12px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.material-log-section {
  margin-top: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.section-title span {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.pagination-container.compact {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
