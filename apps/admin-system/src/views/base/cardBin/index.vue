<template>
  <div class="app-container card-bin-page">
    <el-form ref="queryFormRef" v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="88px">
      <el-form-item :label="$t('base.cardBin.cardBin')" prop="cardBin">
        <el-input v-model.trim="query.cardBin" :placeholder="$t('base.cardBin.binPlaceholder')" clearable maxlength="11" @input="filterBinInput('query')" @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('base.cardBin.cardBrand')" prop="cardBrand">
        <el-select v-model="query.cardBrand" :placeholder="$t('common.pleaseSelect')" filterable clearable>
          <template #prefix>
            <span v-if="cardBrandLogoKeyByValue(query.cardBrand)" class="card-brand-prefix">
              <PaymentLogoMark :logo-key="cardBrandLogoKeyByValue(query.cardBrand)" size="sm" compact fallback="text" />
            </span>
          </template>
          <el-option v-for="item in options.cardBrandOptions" :key="item.value" :label="item.label" :value="item.value">
            <div class="option-with-mark card-brand-option">
              <PaymentLogoMark v-if="cardBrandLogoKey(item)" :logo-key="cardBrandLogoKey(item)" size="sm" compact fallback="text" />
              <span v-else class="option-alpha2">{{ item.value.slice(0, 2) }}</span>
              <span class="option-label">{{ item.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('base.cardBin.cardType')" prop="cardType">
        <el-select v-model="query.cardType" :placeholder="$t('common.pleaseSelect')" filterable clearable>
          <el-option v-for="item in options.cardTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('base.cardBin.issuerCountry')" prop="issuerCountryAlpha2">
        <el-select v-model="query.issuerCountryAlpha2" :placeholder="$t('common.pleaseSelect')" filterable clearable>
          <template #prefix>
            <span v-if="countryFlagByValue(query.issuerCountryAlpha2)" class="option-flag">{{ countryFlagByValue(query.issuerCountryAlpha2) }}</span>
          </template>
          <el-option v-for="item in options.countryOptions" :key="item.value" :label="item.label" :value="item.value">
            <div class="option-with-mark">
              <span v-if="item.flagEmoji" class="option-flag">{{ item.flagEmoji }}</span>
              <span v-else class="option-alpha2">{{ item.alpha2 || item.value }}</span>
              <span class="option-label">{{ item.label }}</span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('base.cardBin.issuerBank')" prop="issuerBank">
        <el-input v-model.trim="query.issuerBank" :placeholder="$t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
      </el-form-item>
      <el-form-item :label="$t('common.status')" prop="status">
        <el-select v-model="query.status" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option v-for="item in options.statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('base.cardBin.dataSource')" prop="dataSource">
        <el-select v-model="query.dataSource" :placeholder="$t('common.pleaseSelect')" clearable>
          <el-option v-for="item in options.dataSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ $t('common.search') }}</el-button>
        <el-button :icon="Refresh" size="small" @click="handleReset">{{ $t('common.reset') }}</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="handleAdd" v-hasPermi="'base:cardBin:add'">{{ $t('common.add') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="handleEdit(selectedRows[0])" v-hasPermi="'base:cardBin:edit'">{{ $t('common.edit') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'base:cardBin:remove'">{{ $t('common.delete') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="warning" plain :icon="Aim" size="small" @click="openMatchDialog" v-hasPermi="'base:cardBin:match'">{{ $t('base.cardBin.matchTest') }}</el-button></el-col>
      <el-col :span="1.5"><el-button type="info" plain :icon="Download" size="small" @click="handleExport" v-hasPermi="'base:cardBin:export'">{{ $t('common.export') }}</el-button></el-col>
      <el-col :span="1.5"><el-button plain :icon="Upload" size="small" @click="handleInitLegacy" v-hasPermi="'base:cardBin:init'">{{ $t('base.cardBin.initLegacy') }}</el-button></el-col>
      <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="loadData" /></el-col>
    </el-row>

    <el-table v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column prop="cardBinStart" :label="$t('base.cardBin.cardBinStart')" width="132" align="center" />
      <el-table-column prop="cardBinEnd" :label="$t('base.cardBin.cardBinEnd')" width="132" align="center" />
      <el-table-column prop="binLength" :label="$t('base.cardBin.binLength')" width="82" align="center">
        <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.binLength }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('base.cardBin.cardBrand')" min-width="128" align="center" :show-overflow-tooltip="true">
        <template #default="{ row }"><span>{{ row.cardBrandName || row.cardBrand }}</span></template>
      </el-table-column>
      <el-table-column prop="cardSubBrand" :label="$t('base.cardBin.cardSubBrand')" min-width="150" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('base.cardBin.cardType')" width="112" align="center">
        <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.cardTypeName || row.cardType }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="issuerCountryName" :label="$t('base.cardBin.issuerCountry')" min-width="150" align="center" :show-overflow-tooltip="true" />
      <el-table-column prop="issuerCountryAlpha2" :label="$t('base.cardBin.alpha2')" width="94" align="center" />
      <el-table-column prop="issuerCountryAlpha3" :label="$t('base.cardBin.alpha3')" width="94" align="center" />
      <el-table-column prop="issuerCountryNumeric" :label="$t('base.cardBin.numeric')" width="104" align="center" />
      <el-table-column prop="issuerBank" :label="$t('base.cardBin.issuerBank')" min-width="180" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('base.cardBin.dataSource')" width="118" align="center">
        <template #default="{ row }"><el-tag size="small" effect="plain">{{ row.dataSourceName || row.dataSource }}</el-tag></template>
      </el-table-column>
      <el-table-column :label="$t('common.status')" width="92" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(status: number) => handleStatus(row, status)" v-hasPermi="'base:cardBin:status'">
            <el-button link type="primary" class="status-button">
              <el-tag size="small" :type="statusTagType(row.status)">{{ row.statusName || statusLabel(row.status) }}</el-tag>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="item in options.statusOptions" :key="item.value" :command="Number(item.value)">{{ item.label }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
      <el-table-column :label="$t('base.cardBin.createTime')" min-width="170" align="center">
        <template #default="{ row }"><BaseDateTime :value="row.createTime" /></template>
      </el-table-column>
      <el-table-column :label="$t('base.cardBin.updateTime')" min-width="170" align="center">
        <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
      </el-table-column>
      <el-table-column prop="updateBy" :label="$t('base.cardBin.operator')" width="116" align="center" :show-overflow-tooltip="true" />
      <el-table-column :label="$t('common.operation')" align="center" width="260" class-name="small-padding fixed-width" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link :icon="View" @click="handleDetail(row)" v-hasPermi="'base:cardBin:query'">{{ $t('common.detail') }}</el-button>
          <el-button size="small" type="primary" link :icon="Edit" @click="handleEdit(row)" v-hasPermi="'base:cardBin:edit'">{{ $t('common.edit') }}</el-button>
          <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'base:cardBin:remove'">{{ $t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-show="total > 0">
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
    </div>

    <el-dialog :title="formTitle" v-model="formOpen" width="760px" append-to-body destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="112px" class="card-bin-form">
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.cardBinStart')" prop="cardBinStart"><el-input v-model.trim="form.cardBinStart" maxlength="11" :placeholder="$t('base.cardBin.binPlaceholder')" @input="filterBinInput('formStart')" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.cardBinEnd')" prop="cardBinEnd"><el-input v-model.trim="form.cardBinEnd" maxlength="11" :placeholder="$t('base.cardBin.binEndPlaceholder')" @input="filterBinInput('formEnd')" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('base.cardBin.cardBrand')" prop="cardBrand">
              <el-select v-model="form.cardBrand" filterable style="width:100%">
                <template #prefix>
                  <span v-if="cardBrandLogoKeyByValue(form.cardBrand)" class="card-brand-prefix">
                    <PaymentLogoMark :logo-key="cardBrandLogoKeyByValue(form.cardBrand)" size="sm" compact fallback="text" />
                  </span>
                </template>
                <el-option v-for="item in options.cardBrandOptions" :key="item.value" :label="item.label" :value="item.value">
                  <div class="option-with-mark card-brand-option">
                    <PaymentLogoMark v-if="cardBrandLogoKey(item)" :logo-key="cardBrandLogoKey(item)" size="sm" compact fallback="text" />
                    <span v-else class="option-alpha2">{{ item.value.slice(0, 2) }}</span>
                    <span class="option-label">{{ item.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.cardType')" prop="cardType"><el-select v-model="form.cardType" filterable style="width:100%"><el-option v-for="item in options.cardTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.cardSubBrand')"><el-input v-model.trim="form.cardSubBrand" maxlength="128" :placeholder="$t('common.pleaseInput')" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.cardLevel')"><el-input v-model.trim="form.cardLevel" maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('base.cardBin.issuerCountry')">
          <el-select v-model="form.issuerCountryAlpha2" :placeholder="$t('common.pleaseSelect')" filterable clearable style="width:100%" @change="handleCountryChange">
            <template #prefix>
              <span v-if="countryFlagByValue(form.issuerCountryAlpha2)" class="option-flag">{{ countryFlagByValue(form.issuerCountryAlpha2) }}</span>
            </template>
            <el-option v-for="item in options.countryOptions" :key="item.value" :label="item.label" :value="item.value">
              <div class="option-with-mark">
                <span v-if="item.flagEmoji" class="option-flag">{{ item.flagEmoji }}</span>
                <span v-else class="option-alpha2">{{ item.alpha2 || item.value }}</span>
                <span class="option-label">{{ item.label }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item :label="$t('base.cardBin.alpha2')"><el-input v-model="form.issuerCountryAlpha2" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.cardBin.alpha3')"><el-input v-model="form.issuerCountryAlpha3" disabled /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.cardBin.numeric')"><el-input v-model="form.issuerCountryNumeric" disabled /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('base.cardBin.issuerBank')"><el-input v-model.trim="form.issuerBank" maxlength="256" :placeholder="$t('common.pleaseInput')" /></el-form-item>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.issuerWebUrl')"><el-input v-model.trim="form.issuerWebUrl" maxlength="512" placeholder="https://example.com" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.issuerTelephone')"><el-input v-model.trim="form.issuerTelephone" maxlength="64" :placeholder="$t('common.pleaseInput')" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8"><el-form-item :label="$t('base.cardBin.dataSource')" prop="dataSource"><el-select v-model="form.dataSource" style="width:100%"><el-option v-for="item in options.dataSourceOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('base.cardBin.sourcePriority')"><el-input-number v-model="form.sourcePriority" :min="1" :max="99" controls-position="right" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item :label="$t('common.status')" prop="status"><el-select v-model="form.status" style="width:100%"><el-option v-for="item in options.statusOptions" :key="item.value" :label="item.label" :value="Number(item.value)" /></el-select></el-form-item></el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.effectiveTime')"><el-date-picker v-model="form.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" :placeholder="$t('common.pleaseSelect')" style="width:100%" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item :label="$t('base.cardBin.expireTime')"><el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" :placeholder="$t('common.pleaseSelect')" style="width:100%" /></el-form-item></el-col>
        </el-row>
        <el-form-item :label="$t('common.remark')"><el-input v-model.trim="form.remark" type="textarea" :rows="3" maxlength="512" show-word-limit /></el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">{{ $t('common.confirm') }}</el-button>
          <el-button @click="formOpen = false">{{ $t('common.cancel') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="$t('base.cardBin.detailTitle')" v-model="detailOpen" width="760px" append-to-body>
      <el-descriptions v-if="detailRow" :column="1" border class="one-column-detail">
        <el-descriptions-item :label="$t('base.cardBin.cardBinStart')">{{ detailRow.cardBinStart }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.cardBinEnd')">{{ detailRow.cardBinEnd }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.binLength')">{{ detailRow.binLength }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.cardBrand')">{{ detailRow.cardBrandName || detailRow.cardBrand }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.cardSubBrand')">{{ detailRow.cardSubBrand || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.cardType')">{{ detailRow.cardTypeName || detailRow.cardType }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.cardLevel')">{{ detailRow.cardLevel || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.issuerCountry')">{{ detailRow.issuerCountryName || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.alpha2')">{{ detailRow.issuerCountryAlpha2 || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.alpha3')">{{ detailRow.issuerCountryAlpha3 || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.numeric')">{{ detailRow.issuerCountryNumeric || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.issuerBank')">{{ detailRow.issuerBank || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.issuerWebUrl')">{{ detailRow.issuerWebUrl || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.issuerTelephone')">{{ detailRow.issuerTelephone || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.dataSource')">{{ detailRow.dataSourceName || detailRow.dataSource }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.sourceBatchNo')">{{ detailRow.sourceBatchNo || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.sourcePriority')">{{ detailRow.sourcePriority ?? '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ detailRow.statusName || statusLabel(detailRow.status) }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.effectiveTime')"><BaseDateTime :value="detailRow.effectiveTime" /></el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.expireTime')"><BaseDateTime :value="detailRow.expireTime" /></el-descriptions-item>
        <el-descriptions-item :label="$t('common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.createBy')">{{ detailRow.createBy || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.updateBy')">{{ detailRow.updateBy || '-' }}</el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
        <el-descriptions-item :label="$t('base.cardBin.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
      </el-descriptions>
      <template #footer><div class="dialog-footer centered"><el-button @click="detailOpen = false">{{ $t('common.close') }}</el-button></div></template>
    </el-dialog>

    <el-dialog :title="$t('base.cardBin.matchTest')" v-model="matchOpen" width="820px" append-to-body>
      <el-form :model="matchForm" inline size="small" class="match-form">
        <el-form-item :label="$t('base.cardBin.cardBin')">
          <el-input v-model.trim="matchForm.cardBin" maxlength="11" :placeholder="$t('base.cardBin.binPlaceholder')" clearable @input="filterBinInput('match')" @keyup.enter="handleMatch" />
        </el-form-item>
        <el-form-item><el-button type="primary" :icon="Aim" @click="handleMatch">{{ $t('base.cardBin.matchTest') }}</el-button></el-form-item>
      </el-form>
      <div v-if="matchResult" class="match-summary">
        <el-alert :type="matchResult.matched ? 'success' : 'warning'" :closable="false" show-icon>
          <template #title>{{ matchResult.matched ? $t('base.cardBin.matched') : $t('base.cardBin.notMatched') }} · {{ $t('base.cardBin.matchCount') }} {{ matchResult.matchCount }}</template>
        </el-alert>
        <el-descriptions v-if="matchResult.bestMatch" :title="$t('base.cardBin.bestMatch')" :column="1" border class="one-column-detail">
          <el-descriptions-item :label="$t('base.cardBin.cardBinStart')">{{ matchResult.bestMatch.cardBinStart }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.cardBin.cardBrand')">{{ matchResult.bestMatch.cardBrandName || matchResult.bestMatch.cardBrand }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.cardBin.cardType')">{{ matchResult.bestMatch.cardTypeName || matchResult.bestMatch.cardType }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.cardBin.issuerCountry')">{{ matchResult.bestMatch.issuerCountryName || '-' }}</el-descriptions-item>
          <el-descriptions-item :label="$t('base.cardBin.issuerBank')">{{ matchResult.bestMatch.issuerBank || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-table v-if="matchResult.matches.length" :data="matchResult.matches" size="small" class="match-table">
          <el-table-column prop="cardBinStart" :label="$t('base.cardBin.cardBinStart')" width="128" align="center" />
          <el-table-column prop="cardBinEnd" :label="$t('base.cardBin.cardBinEnd')" width="128" align="center" />
          <el-table-column prop="binLength" :label="$t('base.cardBin.binLength')" width="90" align="center" />
          <el-table-column :label="$t('base.cardBin.cardBrand')" min-width="120" align="center"><template #default="{ row }">{{ row.cardBrandName || row.cardBrand }}</template></el-table-column>
          <el-table-column :label="$t('base.cardBin.cardType')" width="110" align="center"><template #default="{ row }">{{ row.cardTypeName || row.cardType }}</template></el-table-column>
          <el-table-column prop="issuerCountryName" :label="$t('base.cardBin.issuerCountry')" min-width="150" align="center" />
          <el-table-column prop="issuerBank" :label="$t('base.cardBin.issuerBank')" min-width="180" align="center" :show-overflow-tooltip="true" />
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Aim, Delete, Download, Edit, Plus, Refresh, Search, Upload, View } from '@element-plus/icons-vue';
import { PaymentLogoMark, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
  addCardBin,
  deleteCardBin,
  exportCardBins,
  getCardBin,
  getCardBinOptions,
  initCardBinFromLegacyDb,
  matchCardBin,
  pageCardBins,
  updateCardBin,
  updateCardBinStatus,
  type CardBinOption,
  type CardBinMatchResponse,
  type CardBinOptions,
  type CardBinQuery,
  type CardBinRecord,
  type CardBinSaveRequest,
} from '@/api/base/cardBin';

const { t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<CardBinRecord[]>([]);
const selectedRows = ref<CardBinRecord[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const queryFormRef = ref<FormInstance>();
const query = reactive<CardBinQuery>({});
const emptyOptions = (): CardBinOptions => ({ cardBrandOptions: [], cardTypeOptions: [], statusOptions: [], dataSourceOptions: [], countryOptions: [] });
const options = reactive<CardBinOptions>(emptyOptions());

const formOpen = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const formTitle = computed(() => formMode.value === 'create' ? t('base.cardBin.addTitle') : t('base.cardBin.editTitle'));
const emptyForm = (): CardBinSaveRequest => ({
  cardBinStart: '',
  cardBinEnd: '',
  cardBrand: '',
  cardType: '',
  dataSource: 'MANUAL',
  sourcePriority: 50,
  status: 1,
});
const form = reactive<CardBinSaveRequest>(emptyForm());
const rules: FormRules = {
  cardBinStart: [{ required: true, message: t('base.cardBin.requiredBin'), trigger: 'blur' }, { pattern: /^[0-9]{6,11}$/, message: t('base.cardBin.binRule'), trigger: 'blur' }],
  cardBinEnd: [{ pattern: /^$|^[0-9]{6,11}$/, message: t('base.cardBin.binRule'), trigger: 'blur' }],
  cardBrand: [{ required: true, message: t('base.cardBin.requiredCardBrand'), trigger: 'change' }],
  cardType: [{ required: true, message: t('base.cardBin.requiredCardType'), trigger: 'change' }],
  dataSource: [{ required: true, message: t('base.cardBin.requiredDataSource'), trigger: 'change' }],
  status: [{ required: true, message: t('base.cardBin.requiredStatus'), trigger: 'change' }],
};

const CARD_BRAND_LOGO_MAP: Record<string, PaymentLogoKey> = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  JCB: 'jcb',
  MAESTRO: 'maestro',
  AMEX: 'americanExpress',
  AMERICAN_EXPRESS: 'americanExpress',
  DINERS_CLUB: 'dinersClub',
  DISCOVER: 'discover',
  UNIONPAY: 'unionPay',
};

const detailOpen = ref(false);
const detailRow = ref<CardBinRecord | null>(null);
const matchOpen = ref(false);
const matchForm = reactive({ cardBin: '' });
const matchResult = ref<CardBinMatchResponse | null>(null);

onMounted(async () => {
  await loadOptions();
  await loadData();
});

async function loadOptions() {
  try {
    Object.assign(options, await getCardBinOptions());
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  }
}

async function loadData() {
  loading.value = true;
  try {
    const result = await pageCardBins({ ...query, pageNo: page.value, pageSize: pageSize.value });
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
  Object.assign(query, {});
  query.cardBin = '';
  query.cardBrand = undefined;
  query.cardType = undefined;
  query.issuerCountryAlpha2 = undefined;
  query.issuerBank = '';
  query.status = undefined;
  query.dataSource = undefined;
  handleSearch();
}

function handleAdd() {
  formMode.value = 'create';
  Object.assign(form, emptyForm());
  formOpen.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

function handleEdit(row: CardBinRecord) {
  formMode.value = 'edit';
  Object.assign(form, emptyForm(), row);
  formOpen.value = true;
  nextTick(() => formRef.value?.clearValidate());
}

async function handleDetail(row: CardBinRecord) {
  try {
    detailRow.value = await getCardBin(row.id);
    detailOpen.value = true;
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  }
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  if (form.cardBinEnd && form.cardBinStart.length !== form.cardBinEnd.length) {
    ElMessage.error(t('base.cardBin.binLengthMismatch'));
    return;
  }
  try {
    if (formMode.value === 'create') {
      await addCardBin(form);
    } else if (form.id) {
      await updateCardBin(form.id, form);
    }
    ElMessage.success(t('common.saveSuccess'));
    formOpen.value = false;
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function handleDelete(target: CardBinRecord | CardBinRecord[]) {
  const targets = Array.isArray(target) ? target : [target];
  if (!targets.length) return;
  try {
    await ElMessageBox.confirm(t('base.cardBin.deleteConfirm', { name: targets.map((item) => item.cardBinStart).join('、') }), t('common.delete'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    await Promise.all(targets.map((item) => deleteCardBin(item.id)));
    ElMessage.success(t('common.deleteSuccess'));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.deleteFailed'));
  }
}

async function handleStatus(row: CardBinRecord, status: number) {
  if (row.status === status) return;
  try {
    await updateCardBinStatus(row.id, status);
    ElMessage.success(t('common.success'));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.saveFailed'));
  }
}

async function handleExport() {
  try {
    await exportCardBins({ ...query });
    ElMessage.success(t('common.success'));
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  }
}

async function handleInitLegacy() {
  try {
    await ElMessageBox.confirm(t('base.cardBin.initConfirm'), t('base.cardBin.initLegacy'), { type: 'warning' });
  } catch {
    return;
  }
  try {
    const result = await initCardBinFromLegacyDb();
    ElMessage.success(t('base.cardBin.initResult', { success: result.successCount, duplicate: result.duplicateCount, failed: result.failedCount }));
    await loadData();
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.operationFailed'));
  }
}

function openMatchDialog() {
  matchForm.cardBin = '';
  matchResult.value = null;
  matchOpen.value = true;
}

async function handleMatch() {
  if (!/^[0-9]{6,11}$/.test(matchForm.cardBin)) {
    ElMessage.error(t('base.cardBin.binRule'));
    return;
  }
  try {
    matchResult.value = await matchCardBin(matchForm.cardBin);
  } catch (error: any) {
    ElMessage.error(error?.message || t('common.loadFailed'));
  }
}

function handleCountryChange(value: string) {
  const country = options.countryOptions.find((item) => item.value === value);
  form.issuerCountryName = country?.countryName || '';
  form.issuerCountryAlpha2 = country?.alpha2 || value || '';
  form.issuerCountryAlpha3 = country?.alpha3 || '';
  form.issuerCountryNumeric = country?.numeric || '';
}

function filterBinInput(scope: 'query' | 'formStart' | 'formEnd' | 'match') {
  if (scope === 'query') query.cardBin = onlyBin(query.cardBin || '');
  if (scope === 'formStart') form.cardBinStart = onlyBin(form.cardBinStart || '');
  if (scope === 'formEnd') form.cardBinEnd = onlyBin(form.cardBinEnd || '');
  if (scope === 'match') matchForm.cardBin = onlyBin(matchForm.cardBin || '');
}

function onlyBin(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

function statusLabel(status?: number) {
  return options.statusOptions.find((item) => Number(item.value) === status)?.label || String(status ?? '-');
}

function statusTagType(status?: number) {
  if (status === 1) return 'success';
  if (status === 2) return 'warning';
  if (status === 3) return 'danger';
  return 'info';
}

function cardBrandLogoKey(option?: CardBinOption): PaymentLogoKey | undefined {
  const parsed = parseLogoKey(option?.extraJson);
  return parsed || CARD_BRAND_LOGO_MAP[(option?.value || '').toUpperCase()];
}

function cardBrandLogoKeyByValue(value?: string): PaymentLogoKey | undefined {
  return cardBrandLogoKey(options.cardBrandOptions.find((item) => item.value === value));
}

function parseLogoKey(extraJson?: string): PaymentLogoKey | undefined {
  if (!extraJson) return undefined;
  try {
    const payload = JSON.parse(extraJson) as { logoKey?: PaymentLogoKey; logoKeys?: PaymentLogoKey[] };
    if (payload.logoKey) return payload.logoKey;
    return Array.isArray(payload.logoKeys) ? payload.logoKeys[0] : undefined;
  } catch {
    return undefined;
  }
}

function countryFlagByValue(value?: string): string {
  return options.countryOptions.find((item) => item.value === value)?.flagEmoji || '';
}
</script>

<style scoped>
.card-bin-page :deep(.el-select) {
  width: 168px;
}

.card-bin-form {
  padding: 0 16px;
}

.status-button {
  height: 24px;
  padding: 0;
}

.one-column-detail :deep(.el-descriptions__label) {
  width: 150px;
}

.centered {
  justify-content: center;
}

.match-form {
  margin-bottom: 12px;
}

.match-summary {
  display: grid;
  gap: 14px;
}

.match-table {
  margin-top: 4px;
}

.option-with-mark {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
}

.option-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-brand-option {
  gap: 10px;
}

.card-brand-option :deep(.payment-logo-mark) {
  width: 72px;
  height: 18px;
  max-width: 72px;
  flex: 0 0 72px;
  justify-content: flex-start;
}

.card-brand-option :deep(.payment-logo-mark__asset) {
  max-width: 72px;
  max-height: 18px;
  object-fit: contain;
}

.card-brand-option :deep(.payment-logo-mark__text) {
  max-width: 72px;
  overflow: hidden;
  font-size: 11px;
  text-overflow: ellipsis;
}

.card-brand-prefix {
  display: inline-flex;
  align-items: center;
  width: 38px;
  height: 18px;
  overflow: hidden;
}

.card-brand-prefix :deep(.payment-logo-mark) {
  width: 38px;
  height: 14px;
  max-width: 38px;
  justify-content: flex-start;
}

.card-brand-prefix :deep(.payment-logo-mark__asset) {
  max-width: 38px;
  max-height: 14px;
  object-fit: contain;
}

.option-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  font-size: 17px;
  line-height: 1;
}

.option-alpha2 {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 18px;
  border: 1px solid #d8dee8;
  border-radius: 3px;
  color: #475569;
  background: #fff;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
}
</style>
