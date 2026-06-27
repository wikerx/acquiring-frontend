<template>
    <div class="app-container mcc-page">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
            <el-tab-pane :label="$t('base.mcc.tab.tree')" name="tree">
                <el-form :model="treeQuery" :inline="true" size="small" v-show="showTreeSearch" class="search-form" label-width="92px">
                    <el-form-item :label="$t('common.keyword')"><el-input v-model="treeQuery.keyword" :placeholder="$t('base.mcc.keywordPlaceholder')" clearable @keyup.enter="loadTree" /></el-form-item>
                    <el-form-item :label="$t('base.mcc.code.mccCode')"><el-input v-model="treeQuery.mccCode" maxlength="4" clearable @keyup.enter="loadTree" /></el-form-item>
                    <el-form-item :label="$t('base.mcc.tree.nodeType')">
                        <el-select v-model="treeQuery.nodeType" clearable :placeholder="$t('common.pleaseSelect')" style="width: 150px">
                            <el-option v-for="item in nodeTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('base.mcc.riskLevel')">
                        <el-select v-model="treeQuery.riskLevel" clearable :placeholder="$t('common.pleaseSelect')" style="width: 150px">
                            <el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('common.status')">
                        <el-select v-model="treeQuery.status" clearable :placeholder="$t('common.pleaseSelect')" style="width: 120px">
                            <el-option :label="$t('common.enable')" :value="1" />
                            <el-option :label="$t('common.disable')" :value="0" />
                        </el-select>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" :icon="Search" size="small" @click="loadTree">{{ $t('common.search') }}</el-button>
                        <el-button :icon="Refresh" size="small" @click="resetTreeQuery">{{ $t('common.reset') }}</el-button>
                    </el-form-item>
                </el-form>

                <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openCategoryDrawer('LEVEL1')" v-hasPermi="'base:mcc:category:add'">{{ $t('base.mcc.tree.addLevel1') }}</el-button></el-col>
                    <el-col :span="1.5"><el-button type="info" plain :icon="Sort" size="small" @click="setExpandAll(true)" v-hasPermi="'base:mcc:tree:expand'">{{ $t('base.mcc.tree.expandAll') }}</el-button></el-col>
                    <el-col :span="1.5"><el-button type="info" plain :icon="Sort" size="small" @click="setExpandAll(false)" v-hasPermi="'base:mcc:tree:expand'">{{ $t('base.mcc.tree.collapseAll') }}</el-button></el-col>
                    <el-col :span="1.5"><el-button type="warning" plain :icon="Download" size="small" @click="handleExportCodes" v-hasPermi="'base:mcc:tree:export'">{{ $t('base.mcc.tree.exportCodes') }}</el-button></el-col>
                    <el-col class="right-toolbar"><RightToolbar @toggle-search="showTreeSearch = !showTreeSearch" @refresh="loadTree" /></el-col>
                </el-row>

                <el-table
                    v-if="refreshTreeTable"
                    v-loading="treeLoading"
                    :data="treeRows"
                    row-key="nodeKey"
                    :default-expand-all="expandAll"
                    :tree-props="{ children: 'children' }"
                    :row-class-name="treeRowClassName"
                    size="small"
                >
                    <el-table-column prop="label" :label="$t('base.mcc.name')" min-width="250" show-overflow-tooltip />
                    <el-table-column prop="code" :label="$t('base.mcc.codeLabel')" width="120" align="center" />
                    <el-table-column :label="$t('base.mcc.code.nameCn')" min-width="160" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.nodeType === 'MCC_CODE' ? row.mccNameCn || row.nameCn || '-' : '-' }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('base.mcc.code.nameEn')" min-width="190" show-overflow-tooltip>
                        <template #default="{ row }">{{ row.nodeType === 'MCC_CODE' ? row.mccNameEn || row.nameEn || '-' : '-' }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('base.mcc.tree.nodeType')" width="120" align="center">
                        <template #default="{ row }"><el-tag size="small" :type="nodeTypeTag(row.nodeType)">{{ nodeTypeText(row.nodeType) }}</el-tag></template>
                    </el-table-column>
                    <el-table-column :label="$t('base.mcc.riskLevel')" width="120" align="center">
                        <template #default="{ row }"><el-tag v-if="row.riskLevel" size="small" :type="riskTag(row.riskLevel)">{{ riskText(row.riskLevel) }}</el-tag><span v-else>-</span></template>
                    </el-table-column>
                    <el-table-column :label="$t('base.mcc.mccType')" width="130" align="center">
                        <template #default="{ row }">{{ row.mccType ? mccTypeText(row.mccType) : '-' }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('base.mcc.deliveryApplicability')" width="150" align="center">
                        <template #default="{ row }">{{ row.deliveryApplicability ? deliveryText(row.deliveryApplicability) : '-' }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('common.status')" width="90" align="center">
                        <template #default="{ row }"><el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template>
                    </el-table-column>
                    <el-table-column prop="sortNo" :label="$t('common.sort')" width="80" align="center" />
                    <el-table-column :label="$t('common.updateTime')" width="170" align="center">
                        <template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template>
                    </el-table-column>
                    <el-table-column :label="$t('common.operation')" align="center" width="300" fixed="right">
                        <template #default="{ row }">
                            <el-button v-if="row.nodeType === 'LEVEL1'" size="small" type="primary" link :icon="Plus" @click="openCategoryDrawer('LEVEL2', row)" v-hasPermi="'base:mcc:category:add'">{{ $t('base.mcc.tree.addLevel2') }}</el-button>
                            <el-button v-if="row.nodeType === 'LEVEL2'" size="small" type="primary" link :icon="Plus" @click="openCodeDrawer(row)" v-hasPermi="'base:mcc:code:add'">{{ $t('base.mcc.tree.addCode') }}</el-button>
                            <el-button v-if="row.nodeType === 'MCC_CODE'" size="small" type="primary" link :icon="View" @click="openCodeDetail(row)" v-hasPermi="'base:mcc:code:view'">{{ $t('common.detail') }}</el-button>
                            <el-button v-if="row.nodeType !== 'MCC_CODE'" size="small" type="primary" link :icon="Edit" @click="openCategoryDrawer(row.nodeType, row)" v-hasPermi="'base:mcc:category:edit'">{{ $t('common.edit') }}</el-button>
                            <el-button v-else size="small" type="primary" link :icon="Edit" @click="openCodeDrawer(row)" v-hasPermi="'base:mcc:code:edit'">{{ $t('common.edit') }}</el-button>
                            <el-button size="small" type="primary" link :icon="SwitchButton" @click="toggleTreeStatus(row)" v-hasPermi="row.nodeType === 'MCC_CODE' ? 'base:mcc:code:status' : 'base:mcc:category:status'">{{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-button>
                            <el-button size="small" type="primary" link :icon="Delete" @click="deleteTreeNode(row)" v-hasPermi="row.nodeType === 'MCC_CODE' ? 'base:mcc:code:delete' : 'base:mcc:category:delete'">{{ $t('common.delete') }}</el-button>
                        </template>
                    </el-table-column>
                </el-table>
            </el-tab-pane>

            <el-tab-pane :label="$t('base.mcc.tab.policy')" name="policy">
                <el-form :model="policyQuery" :inline="true" size="small" v-show="showPolicySearch" class="search-form" label-width="108px">
                    <el-form-item :label="$t('base.mcc.code.mccCode')"><el-input v-model="policyQuery.mccCode" maxlength="4" clearable @keyup.enter="loadPolicies" /></el-form-item>
                    <el-form-item :label="$t('base.mcc.policy.cardScheme')"><el-select v-model="policyQuery.cardScheme" clearable filterable style="width: 180px"><el-option v-for="item in cardSchemeOptions" :key="item.code" :label="item.label" :value="item.code" /></el-select></el-form-item>
                    <el-form-item :label="$t('base.mcc.policy.channelScope')"><el-select v-model="policyQuery.channelScope" clearable style="width: 160px"><el-option v-for="item in scopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="$t('base.mcc.policy.countryScope')"><el-select v-model="policyQuery.countryScope" clearable style="width: 160px"><el-option v-for="item in countryScopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="$t('base.mcc.riskLevel')"><el-select v-model="policyQuery.riskLevel" clearable style="width: 150px"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                    <el-form-item :label="$t('common.status')"><el-select v-model="policyQuery.status" clearable style="width: 120px"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                    <el-form-item><el-button type="primary" :icon="Search" size="small" @click="handlePolicySearch">{{ $t('common.search') }}</el-button><el-button :icon="Refresh" size="small" @click="resetPolicyQuery">{{ $t('common.reset') }}</el-button></el-form-item>
                </el-form>

                <el-row :gutter="10" class="mb8">
                    <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openPolicyDrawer()" v-hasPermi="'base:mcc:policy:add'">{{ $t('base.mcc.policy.addPolicy') }}</el-button></el-col>
                    <el-col class="right-toolbar"><RightToolbar @toggle-search="showPolicySearch = !showPolicySearch" @refresh="loadPolicies" /></el-col>
                </el-row>

                <el-table v-loading="policyLoading" :data="policyRows" row-key="id" size="small">
                    <el-table-column prop="mccCode" :label="$t('base.mcc.code.mccCode')" width="100" align="center" />
                    <el-table-column prop="mccNameCn" :label="$t('base.mcc.code.nameCn')" min-width="160" show-overflow-tooltip />
                    <el-table-column :label="$t('base.mcc.policy.cardScheme')" min-width="150" show-overflow-tooltip><template #default="{ row }">{{ row.cardSchemeName || row.cardScheme }}</template></el-table-column>
                    <el-table-column :label="$t('base.mcc.policy.channelScope')" width="130" align="center"><template #default="{ row }">{{ scopeText(row.channelScope) }}</template></el-table-column>
                    <el-table-column prop="channelCode" :label="$t('base.mcc.policy.channelCode')" width="130" align="center" />
                    <el-table-column :label="$t('base.mcc.policy.countryScope')" width="150" align="center"><template #default="{ row }">{{ countryScopeText(row.countryScope) }}</template></el-table-column>
                    <el-table-column prop="countryCode" :label="$t('base.mcc.policy.countryCode')" width="130" align="center" />
                    <el-table-column :label="$t('base.mcc.riskLevel')" width="120" align="center"><template #default="{ row }"><el-tag size="small" :type="riskTag(row.riskLevel)">{{ riskText(row.riskLevel) }}</el-tag></template></el-table-column>
                    <el-table-column :label="$t('base.mcc.policy.allowOnboarding')" width="110" align="center"><template #default="{ row }">{{ yesNo(row.allowOnboarding) }}</template></el-table-column>
                    <el-table-column :label="$t('base.mcc.policy.allowAcquiring')" width="110" align="center"><template #default="{ row }">{{ yesNo(row.allowAcquiring) }}</template></el-table-column>
                    <el-table-column :label="$t('base.mcc.policy.requireEnhancedReview')" width="120" align="center"><template #default="{ row }">{{ yesNo(row.requireEnhancedReview) }}</template></el-table-column>
                    <el-table-column :label="$t('common.status')" width="90" align="center"><template #default="{ row }"><el-tag size="small" :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag></template></el-table-column>
                    <el-table-column :label="$t('common.updateTime')" width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
                    <el-table-column :label="$t('common.operation')" align="center" width="180" fixed="right">
                        <template #default="{ row }">
                            <el-button size="small" type="primary" link :icon="Edit" @click="openPolicyDrawer(row)" v-hasPermi="'base:mcc:policy:edit'">{{ $t('common.edit') }}</el-button>
                            <el-button size="small" type="primary" link :icon="SwitchButton" @click="togglePolicyStatus(row)" v-hasPermi="'base:mcc:policy:status'">{{ row.status === 1 ? $t('common.disable') : $t('common.enable') }}</el-button>
                            <el-button size="small" type="primary" link :icon="Delete" @click="deletePolicyRow(row)" v-hasPermi="'base:mcc:policy:delete'">{{ $t('common.delete') }}</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <div class="pagination-container" v-show="policyTotal > 0"><el-pagination v-model:current-page="policyPage" v-model:page-size="policyPageSize" :total="policyTotal" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadPolicies" @current-change="loadPolicies" /></div>
            </el-tab-pane>

            <el-tab-pane :label="$t('base.mcc.tab.overview')" name="overview">
                <div class="mcc-overview" v-loading="overviewLoading">
                    <div v-for="item in overviewCards" :key="item.key" class="overview-card">
                        <div class="overview-value">{{ item.value }}</div>
                        <div class="overview-label">{{ item.label }}</div>
                    </div>
                </div>
            </el-tab-pane>
        </el-tabs>

        <el-drawer v-model="categoryDrawerVisible" :title="categoryDrawerTitle" size="640px" destroy-on-close>
            <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="120px">
                <el-form-item :label="$t('base.mcc.tree.nodeType')" prop="nodeType"><el-input :model-value="nodeTypeText(categoryForm.nodeType)" disabled /></el-form-item>
                <el-form-item v-if="categoryForm.nodeType !== 'LEVEL1'" :label="$t('base.mcc.parentCategory')" prop="parentId"><el-input :model-value="parentCategoryLabel" disabled /></el-form-item>
                <el-form-item :label="$t('base.mcc.categoryCode')" prop="categoryCode"><el-input v-model="categoryForm.categoryCode" maxlength="32" /></el-form-item>
                <el-form-item :label="$t('base.mcc.code.nameCn')" prop="nameCn"><el-input v-model="categoryForm.nameCn" maxlength="128" /></el-form-item>
                <el-form-item :label="$t('base.mcc.code.nameEn')" prop="nameEn"><el-input v-model="categoryForm.nameEn" maxlength="128" /></el-form-item>
                <el-form-item :label="$t('common.sort')"><el-input-number v-model="categoryForm.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item :label="$t('common.status')"><el-select v-model="categoryForm.status" style="width: 100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="categoryForm.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <template #footer><el-button type="primary" @click="submitCategory">{{ $t('common.confirm') }}</el-button><el-button @click="categoryDrawerVisible = false">{{ $t('common.cancel') }}</el-button></template>
        </el-drawer>

        <el-drawer v-model="codeDrawerVisible" :title="codeDrawerTitle" size="720px" destroy-on-close>
            <el-form ref="codeFormRef" :model="codeForm" :rules="codeRules" label-width="130px">
                <el-form-item :label="$t('base.mcc.code.mccCode')" prop="mccCode"><el-input v-model="codeForm.mccCode" maxlength="4" :disabled="codeMode === 'edit'" /></el-form-item>
                <el-form-item :label="$t('base.mcc.code.nameCn')" prop="nameCn"><el-input v-model="codeForm.nameCn" maxlength="160" /></el-form-item>
                <el-form-item :label="$t('base.mcc.code.nameEn')" prop="nameEn"><el-input v-model="codeForm.nameEn" maxlength="200" /></el-form-item>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.level1')" prop="level1Id"><el-select v-model="selectedLevel1Id" style="width: 100%" @change="handleLevel1Change"><el-option v-for="item in options.level1" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.level2')" prop="level2Id"><el-select v-model="selectedLevel2Id" style="width: 100%" @change="handleLevel2Change"><el-option v-for="item in codeLevel2Options" :key="item.id" :label="item.label" :value="item.id" /></el-select></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.mccType')" prop="mccType"><el-select v-model="codeForm.mccType" style="width: 100%"><el-option v-for="item in mccTypeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.riskLevel')" prop="riskLevel"><el-select v-model="codeForm.riskLevel" style="width: 100%"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('base.mcc.deliveryApplicability')"><el-select v-model="codeForm.deliveryApplicability" style="width: 100%"><el-option v-for="item in deliveryOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.source')"><el-input v-model="codeForm.source" maxlength="64" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.versionNo')"><el-input v-model="codeForm.versionNo" maxlength="32" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.effectiveTime')"><el-date-picker v-model="codeForm.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" /></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.expireTime')"><el-date-picker v-model="codeForm.expireTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" style="width: 100%" /></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('common.sort')"><el-input-number v-model="codeForm.sortNo" :min="0" :max="9999" controls-position="right" /></el-form-item>
                <el-form-item :label="$t('common.status')"><el-select v-model="codeForm.status" style="width: 100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="codeForm.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <template #footer><el-button type="primary" @click="submitCode">{{ $t('common.confirm') }}</el-button><el-button @click="codeDrawerVisible = false">{{ $t('common.cancel') }}</el-button></template>
        </el-drawer>

        <el-drawer v-model="policyDrawerVisible" :title="policyDrawerTitle" size="680px" destroy-on-close>
            <el-form ref="policyFormRef" :model="policyForm" :rules="policyRules" label-width="150px">
                <el-form-item :label="$t('base.mcc.code.mccCode')" prop="mccCode"><el-select v-model="policyForm.mccCode" filterable style="width: 100%"><el-option v-for="item in options.mccCodes" :key="item.code" :label="item.label" :value="item.code" /></el-select></el-form-item>
                <el-form-item :label="$t('base.mcc.policy.allCardSchemes')"><el-checkbox v-model="policyForm.selectAllCardSchemes" :disabled="policyMode === 'edit'" @change="syncAllCardSchemes">{{ $t('base.mcc.policy.allCardSchemes') }}</el-checkbox></el-form-item>
                <el-form-item :label="$t('base.mcc.policy.cardScheme')" prop="cardSchemes"><el-select v-model="policyForm.cardSchemes" multiple filterable style="width: 100%" :disabled="policyForm.selectAllCardSchemes"><el-option v-for="item in cardSchemeOptions" :key="item.code" :label="item.label" :value="item.code" /></el-select></el-form-item>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.policy.channelScope')" prop="channelScope"><el-select v-model="policyForm.channelScope" style="width: 100%" @change="handleChannelScopeChange"><el-option v-for="item in scopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.policy.channelCode')" prop="channelCode"><el-input v-model="policyForm.channelCode" :disabled="policyForm.channelScope === 'ALL'" maxlength="64" /></el-form-item></el-col>
                </el-row>
                <el-row :gutter="12">
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.policy.countryScope')" prop="countryScope"><el-select v-model="policyForm.countryScope" style="width: 100%" @change="handleCountryScopeChange"><el-option v-for="item in countryScopeOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item></el-col>
                    <el-col :span="12"><el-form-item :label="$t('base.mcc.policy.countryCode')" prop="countryCode"><el-select v-model="policyForm.countryCode" :disabled="policyForm.countryScope === 'ALL'" filterable clearable style="width: 100%"><el-option v-for="item in options.countries" :key="item.code" :label="item.label" :value="item.code" /></el-select></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('base.mcc.riskLevel')" prop="riskLevel"><el-select v-model="policyForm.riskLevel" style="width: 100%"><el-option v-for="item in riskLevelOptions" :key="item.value" :label="item.label" :value="item.value" /></el-select></el-form-item>
                <el-row :gutter="12">
                    <el-col :span="8"><el-form-item :label="$t('base.mcc.policy.allowOnboarding')"><el-switch v-model="policyForm.allowOnboarding" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
                    <el-col :span="8"><el-form-item :label="$t('base.mcc.policy.allowAcquiring')"><el-switch v-model="policyForm.allowAcquiring" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
                    <el-col :span="8"><el-form-item :label="$t('base.mcc.policy.requireEnhancedReview')"><el-switch v-model="policyForm.requireEnhancedReview" :active-value="1" :inactive-value="0" /></el-form-item></el-col>
                </el-row>
                <el-form-item :label="$t('common.status')"><el-select v-model="policyForm.status" style="width: 100%"><el-option :label="$t('common.enable')" :value="1" /><el-option :label="$t('common.disable')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="$t('common.remark')"><el-input v-model="policyForm.remark" type="textarea" maxlength="500" show-word-limit /></el-form-item>
            </el-form>
            <template #footer><el-button type="primary" @click="submitPolicy">{{ $t('common.confirm') }}</el-button><el-button @click="policyDrawerVisible = false">{{ $t('common.cancel') }}</el-button></template>
        </el-drawer>

        <el-dialog v-model="codeDetailVisible" :title="$t('base.mcc.code.detailTitle')" width="760px" append-to-body destroy-on-close>
            <el-descriptions :column="1" border size="small" class="mcc-detail-descriptions">
                <el-descriptions-item :label="$t('base.mcc.level1')">{{ activeCodeDetail?.level1Name || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.level2')">{{ activeCodeDetail?.level2Name || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.code.nameCn')">{{ activeCodeDetail?.nameCn || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.code.nameEn')">{{ activeCodeDetail?.nameEn || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.code.mccCode')">{{ activeCodeDetail?.mccCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.mccType')">{{ activeCodeDetail?.mccType ? mccTypeText(activeCodeDetail.mccType) : '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.riskLevel')">{{ activeCodeDetail?.riskLevel ? riskText(activeCodeDetail.riskLevel) : '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.deliveryApplicability')">{{ activeCodeDetail?.deliveryApplicability ? deliveryText(activeCodeDetail.deliveryApplicability) : '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.status')">
                    <el-tag size="small" :type="activeCodeDetail?.status === 1 ? 'success' : 'info'">{{ activeCodeDetail?.status === 1 ? $t('common.enable') : $t('common.disable') }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.sort')">{{ activeCodeDetail?.sortNo ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.effectiveTime')"><BaseDateTime :value="activeCodeDetail?.effectiveTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.expireTime')"><BaseDateTime :value="activeCodeDetail?.expireTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.source')">{{ activeCodeDetail?.source || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('base.mcc.versionNo')">{{ activeCodeDetail?.versionNo || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.remark')">{{ activeCodeDetail?.remark || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="$t('common.createTime')"><BaseDateTime :value="activeCodeDetail?.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="$t('common.updateTime')"><BaseDateTime :value="activeCodeDetail?.updateTime" /></el-descriptions-item>
            </el-descriptions>
            <template #footer>
                <div class="mcc-detail-footer">
                    <el-button @click="codeDetailVisible = false">{{ $t('common.close') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Download, Edit, Plus, Refresh, Search, Sort, SwitchButton, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import {
    addMccCategory,
    addMccCode,
    addMccPolicies,
    deleteMccCategory,
    deleteMccCode,
    deleteMccPolicy,
    editMccCategory,
    editMccCode,
    editMccPolicy,
    exportMccCodes,
    getMccCodeDetail,
    getMccOptions,
    getMccOverview,
    getMccTree,
    pageMccPolicies,
    updateMccCategoryStatus,
    updateMccCodeStatus,
    updateMccPolicyStatus,
    type MccCodeDetail,
    type MccCodeSaveRequest,
    type MccNodeType,
    type MccOption,
    type MccOptions,
    type MccRiskPolicy,
    type MccRiskPolicyQuery,
    type MccRiskPolicySaveRequest,
    type MccTreeNode,
    type MccTreeQuery,
} from '@/api/base/mcc';

const { t } = useI18n();

const activeTab = ref('tree');
const showTreeSearch = ref(true);
const showPolicySearch = ref(true);
const treeLoading = ref(false);
const policyLoading = ref(false);
const overviewLoading = ref(false);
const treeRows = ref<MccTreeNode[]>([]);
const policyRows = ref<MccRiskPolicy[]>([]);
const policyTotal = ref(0);
const policyPage = ref(1);
const policyPageSize = ref(10);
const overview = ref({ level1Count: 0, level2Count: 0, mccCodeCount: 0, enabledMccCodeCount: 0, riskPolicyCount: 0, highRiskPolicyCount: 0 });
const expandAll = ref(true);
const refreshTreeTable = ref(true);
const treeQuery = reactive<MccTreeQuery>({});
const policyQuery = reactive<MccRiskPolicyQuery>({});
const options = reactive<MccOptions>({ level1: [], level2: [], mccCodes: [], cardSchemes: [], countries: [] });

const categoryDrawerVisible = ref(false);
const categoryMode = ref<'create' | 'edit'>('create');
const categoryFormRef = ref<FormInstance>();
const parentCategoryLabel = ref('');
const categoryForm = reactive({ id: undefined as number | undefined, nodeType: 'LEVEL1' as Exclude<MccNodeType, 'MCC_CODE'>, parentId: undefined as number | undefined, categoryCode: '', nameCn: '', nameEn: '', sortNo: 100, status: 1, remark: '' });

const codeDrawerVisible = ref(false);
const codeMode = ref<'create' | 'edit'>('create');
const codeFormRef = ref<FormInstance>();
const selectedLevel1Id = ref<number>();
const selectedLevel2Id = ref<number>();
const codeForm = reactive<MccCodeSaveRequest>({ mccCode: '', nameCn: '', nameEn: '', level1Id: 0, level2Id: 0, mccType: 'COMMON', riskLevel: 'LOW', deliveryApplicability: 'UNKNOWN', source: 'SYSTEM', versionNo: '', effectiveTime: '', expireTime: '', sortNo: 100, status: 1, remark: '' });
const codeDetailVisible = ref(false);
const activeCodeDetail = ref<MccCodeDetail>();

const policyDrawerVisible = ref(false);
const policyMode = ref<'create' | 'edit'>('create');
const policyFormRef = ref<FormInstance>();
const policyForm = reactive<MccRiskPolicySaveRequest>({ mccCode: '', cardSchemes: [], selectAllCardSchemes: false, channelScope: 'ALL', channelCode: '', countryScope: 'ALL', countryCode: '', riskLevel: 'LOW', allowOnboarding: 1, allowAcquiring: 1, requireEnhancedReview: 0, status: 1, remark: '' });

const nodeTypeOptions = computed(() => [
    { label: t('base.mcc.nodeType.LEVEL1'), value: 'LEVEL1' },
    { label: t('base.mcc.nodeType.LEVEL2'), value: 'LEVEL2' },
    { label: t('base.mcc.nodeType.MCC_CODE'), value: 'MCC_CODE' },
]);
const riskLevelOptions = computed(() => ['LOW', 'MEDIUM', 'HIGH', 'PROHIBITED'].map((value) => ({ value, label: t(`base.mcc.risk.${value}`) })));
const mccTypeOptions = computed(() => ['COMMON', 'SPECIAL', 'RESTRICTED', 'PROHIBITED'].map((value) => ({ value, label: t(`base.mcc.type.${value}`) })));
const deliveryOptions = computed(() => ['PHYSICAL', 'NON_PHYSICAL', 'BOTH', 'UNKNOWN'].map((value) => ({ value, label: t(`base.mcc.delivery.${value}`) })));
const scopeOptions = computed(() => [{ value: 'ALL', label: t('base.mcc.policy.allChannels') }, { value: 'SPECIFIC', label: t('base.mcc.policy.specificChannel') }]);
const countryScopeOptions = computed(() => [{ value: 'ALL', label: t('base.mcc.policy.allCountries') }, { value: 'SPECIFIC', label: t('base.mcc.policy.specificCountry') }]);
const cardSchemeOptions = computed(() => options.cardSchemes.filter((item) => item.code !== 'ALL'));
const codeLevel2Options = computed(() => options.level2.filter((item) => item.parentId === selectedLevel1Id.value));
const categoryDrawerTitle = computed(() => categoryMode.value === 'create' ? t('base.mcc.categoryAddTitle') : t('base.mcc.categoryEditTitle'));
const codeDrawerTitle = computed(() => codeMode.value === 'create' ? t('base.mcc.code.addTitle') : t('base.mcc.code.editTitle'));
const policyDrawerTitle = computed(() => policyMode.value === 'create' ? t('base.mcc.policy.addPolicy') : t('base.mcc.policy.editPolicy'));
const overviewCards = computed(() => [
    { key: 'level1', label: t('base.mcc.overview.level1Count'), value: overview.value.level1Count },
    { key: 'level2', label: t('base.mcc.overview.level2Count'), value: overview.value.level2Count },
    { key: 'codes', label: t('base.mcc.overview.mccCodeCount'), value: overview.value.mccCodeCount },
    { key: 'enabled', label: t('base.mcc.overview.enabledMccCodeCount'), value: overview.value.enabledMccCodeCount },
    { key: 'policies', label: t('base.mcc.overview.riskPolicyCount'), value: overview.value.riskPolicyCount },
    { key: 'high', label: t('base.mcc.overview.highRiskPolicyCount'), value: overview.value.highRiskPolicyCount },
]);

const categoryRules = computed<FormRules>(() => ({
    categoryCode: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    nameCn: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    nameEn: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
}));
const codeRules = computed<FormRules>(() => ({
    mccCode: [{ required: true, message: t('base.mcc.validation.mccCode'), trigger: 'blur' }, { pattern: /^[0-9]{4}$/, message: t('base.mcc.validation.mccCode'), trigger: 'blur' }],
    nameCn: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    nameEn: [{ required: true, message: t('common.pleaseInput'), trigger: 'blur' }],
    level1Id: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    level2Id: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    mccType: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    riskLevel: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
}));
const policyRules = computed<FormRules>(() => ({
    mccCode: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    cardSchemes: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    channelScope: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    countryScope: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
    riskLevel: [{ required: true, message: t('common.pleaseSelect'), trigger: 'change' }],
}));

onMounted(async () => {
    await loadOptions();
    await Promise.all([loadTree(), loadPolicies(), loadOverview()]);
});

async function loadOptions() {
    try {
        Object.assign(options, await getMccOptions());
    } catch {
        ElMessage.error(t('common.loadFailed'));
    }
}

async function loadTree() {
    treeLoading.value = true;
    try {
        treeRows.value = await getMccTree(cleanQuery(treeQuery));
    } catch {
        ElMessage.error(t('common.loadFailed'));
    } finally {
        treeLoading.value = false;
    }
}

async function loadPolicies() {
    policyLoading.value = true;
    try {
        const result = await pageMccPolicies({ ...cleanQuery(policyQuery), pageNo: policyPage.value, pageSize: policyPageSize.value });
        policyRows.value = result.records;
        policyTotal.value = result.total;
    } catch {
        ElMessage.error(t('common.loadFailed'));
    } finally {
        policyLoading.value = false;
    }
}

async function loadOverview() {
    overviewLoading.value = true;
    try {
        overview.value = await getMccOverview();
    } catch {
        ElMessage.error(t('common.loadFailed'));
    } finally {
        overviewLoading.value = false;
    }
}

function handleTabChange(name: string | number) {
    if (name === 'overview') loadOverview();
}

function resetTreeQuery() {
    Object.keys(treeQuery).forEach((key) => delete treeQuery[key as keyof MccTreeQuery]);
    loadTree();
}

function handlePolicySearch() {
    policyPage.value = 1;
    loadPolicies();
}

function resetPolicyQuery() {
    Object.keys(policyQuery).forEach((key) => delete policyQuery[key as keyof MccRiskPolicyQuery]);
    handlePolicySearch();
}

function setExpandAll(value: boolean) {
    refreshTreeTable.value = false;
    expandAll.value = value;
    nextTick(() => {
        refreshTreeTable.value = true;
    });
}

function openCategoryDrawer(nodeType: Exclude<MccNodeType, 'MCC_CODE'>, row?: MccTreeNode) {
    categoryMode.value = row && row.nodeType === nodeType ? 'edit' : 'create';
    Object.assign(categoryForm, { id: undefined, nodeType, parentId: undefined, categoryCode: '', nameCn: '', nameEn: '', sortNo: 100, status: 1, remark: '' });
    parentCategoryLabel.value = '';
    if (categoryMode.value === 'edit' && row) {
        Object.assign(categoryForm, { id: row.id, nodeType: row.nodeType, categoryCode: row.code || '', nameCn: row.nameCn || '', nameEn: row.nameEn || '', sortNo: row.sortNo || 100, status: row.status ?? 1 });
    } else if (row) {
        categoryForm.parentId = row.id;
        parentCategoryLabel.value = row.label || row.nameCn || row.code || '';
    }
    categoryDrawerVisible.value = true;
    nextTick(() => categoryFormRef.value?.clearValidate());
}

async function submitCategory() {
    const valid = await categoryFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    try {
        if (categoryMode.value === 'create') await addMccCategory(categoryForm);
        else await editMccCategory(categoryForm);
        ElMessage.success(t('common.saveSuccess'));
        categoryDrawerVisible.value = false;
        await Promise.all([loadOptions(), loadTree(), loadOverview()]);
    } catch (error: any) {
        ElMessage.error(error?.message || t('common.saveFailed'));
    }
}

async function openCodeDrawer(row: MccTreeNode) {
    codeMode.value = row.nodeType === 'MCC_CODE' ? 'edit' : 'create';
    Object.assign(codeForm, { id: undefined, mccCode: '', nameCn: '', nameEn: '', level1Id: 0, level2Id: 0, mccType: 'COMMON', riskLevel: 'LOW', deliveryApplicability: 'UNKNOWN', source: 'SYSTEM', versionNo: '', effectiveTime: '', expireTime: '', sortNo: 100, status: 1, remark: '' });
    selectedLevel1Id.value = undefined;
    selectedLevel2Id.value = undefined;
    if (row.nodeType === 'LEVEL2') {
        selectedLevel2Id.value = row.id;
        codeForm.level2Id = row.id;
        const level2 = options.level2.find((item) => item.id === row.id);
        selectedLevel1Id.value = level2?.parentId;
        codeForm.level1Id = selectedLevel1Id.value || 0;
    } else {
        const detail = await getMccCodeDetail(row.id);
        Object.assign(codeForm, detail);
        selectedLevel1Id.value = detail.level1Id;
        selectedLevel2Id.value = detail.level2Id;
    }
    codeDrawerVisible.value = true;
    nextTick(() => codeFormRef.value?.clearValidate());
}

async function submitCode() {
    const valid = await codeFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    if (codeForm.effectiveTime && codeForm.expireTime && codeForm.effectiveTime > codeForm.expireTime) {
        ElMessage.error(t('base.mcc.validation.timeRange'));
        return;
    }
    try {
        if (codeMode.value === 'create') await addMccCode(codeForm);
        else await editMccCode(codeForm);
        ElMessage.success(t('common.saveSuccess'));
        codeDrawerVisible.value = false;
        await Promise.all([loadOptions(), loadTree(), loadOverview()]);
    } catch (error: any) {
        ElMessage.error(error?.message || t('common.saveFailed'));
    }
}

async function openCodeDetail(row: MccTreeNode) {
    try {
        activeCodeDetail.value = await getMccCodeDetail(row.id);
        codeDetailVisible.value = true;
    } catch {
        ElMessage.error(t('common.loadFailed'));
    }
}

function openPolicyDrawer(row?: MccRiskPolicy) {
    policyMode.value = row ? 'edit' : 'create';
    Object.assign(policyForm, { id: undefined, mccCode: '', cardSchemes: [], selectAllCardSchemes: false, channelScope: 'ALL', channelCode: '', countryScope: 'ALL', countryCode: '', riskLevel: 'LOW', allowOnboarding: 1, allowAcquiring: 1, requireEnhancedReview: 0, status: 1, remark: '' });
    if (row) {
        Object.assign(policyForm, { id: row.id, mccCode: row.mccCode, cardSchemes: [row.cardScheme], selectAllCardSchemes: false, channelScope: row.channelScope, channelCode: row.channelCode || '', countryScope: row.countryScope, countryCode: row.countryCode || '', riskLevel: row.riskLevel, allowOnboarding: row.allowOnboarding ?? 1, allowAcquiring: row.allowAcquiring ?? 1, requireEnhancedReview: row.requireEnhancedReview ?? 0, status: row.status ?? 1, remark: row.remark || '' });
    }
    policyDrawerVisible.value = true;
    nextTick(() => policyFormRef.value?.clearValidate());
}

async function submitPolicy() {
    syncPolicyScopeFields();
    if (!policyForm.selectAllCardSchemes && policyForm.cardSchemes.length === 0) {
        ElMessage.error(t('base.mcc.validation.cardScheme'));
        return;
    }
    const valid = await policyFormRef.value?.validate().catch(() => false);
    if (!valid) return;
    try {
        if (policyMode.value === 'create') await addMccPolicies({ ...policyForm, cardSchemes: realCardSchemes(policyForm.cardSchemes) });
        else await editMccPolicy({ ...policyForm, cardSchemes: realCardSchemes(policyForm.cardSchemes), selectAllCardSchemes: false });
        ElMessage.success(t('common.saveSuccess'));
        policyDrawerVisible.value = false;
        await Promise.all([loadPolicies(), loadOverview()]);
    } catch (error: any) {
        ElMessage.error(error?.message || t('common.saveFailed'));
    }
}

async function toggleTreeStatus(row: MccTreeNode) {
    const nextStatus = row.status === 1 ? 0 : 1;
    try {
        await ElMessageBox.confirm(t('base.mcc.confirmStatus', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: row.label || row.code }), t('common.confirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
        if (row.nodeType === 'MCC_CODE') await updateMccCodeStatus(row.id, nextStatus);
        else await updateMccCategoryStatus(row.id, row.nodeType, nextStatus);
        ElMessage.success(t('common.success'));
        loadTree();
    } catch (error: any) {
        if (error?.message) ElMessage.error(error.message);
    }
}

async function deleteTreeNode(row: MccTreeNode) {
    try {
        await ElMessageBox.confirm(t('base.mcc.confirmDelete', { name: row.label || row.code }), t('common.delete'), { type: 'warning' });
        if (row.nodeType === 'MCC_CODE') await deleteMccCode(row.id);
        else await deleteMccCategory(row.id, row.nodeType);
        ElMessage.success(t('common.deleteSuccess'));
        await Promise.all([loadTree(), loadOverview()]);
    } catch (error: any) {
        if (error?.message) ElMessage.error(error.message);
    }
}

async function togglePolicyStatus(row: MccRiskPolicy) {
    const nextStatus = row.status === 1 ? 0 : 1;
    try {
        await ElMessageBox.confirm(t('base.mcc.confirmStatus', { action: nextStatus === 1 ? t('common.enable') : t('common.disable'), name: row.mccCode }), t('common.confirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
        await updateMccPolicyStatus(row.id, nextStatus);
        ElMessage.success(t('common.success'));
        loadPolicies();
    } catch (error: any) {
        if (error?.message) ElMessage.error(error.message);
    }
}

async function deletePolicyRow(row: MccRiskPolicy) {
    try {
        await ElMessageBox.confirm(t('base.mcc.confirmDelete', { name: `${row.mccCode} / ${row.cardScheme}` }), t('common.delete'), { type: 'warning' });
        await deleteMccPolicy(row.id);
        ElMessage.success(t('common.deleteSuccess'));
        await Promise.all([loadPolicies(), loadOverview()]);
    } catch (error: any) {
        if (error?.message) ElMessage.error(error.message);
    }
}

async function handleExportCodes() {
    try {
        await exportMccCodes(cleanQuery(treeQuery));
        ElMessage.success(t('common.export'));
    } catch {
        ElMessage.error(t('common.loadFailed'));
    }
}

function handleLevel1Change() {
    selectedLevel2Id.value = undefined;
    codeForm.level1Id = selectedLevel1Id.value || 0;
    codeForm.level2Id = 0;
}

function handleLevel2Change() {
    codeForm.level1Id = selectedLevel1Id.value || 0;
    codeForm.level2Id = selectedLevel2Id.value || 0;
}

function handleChannelScopeChange() {
    if (policyForm.channelScope === 'ALL') policyForm.channelCode = '';
}

function handleCountryScopeChange() {
    if (policyForm.countryScope === 'ALL') policyForm.countryCode = '';
}

function syncAllCardSchemes() {
    policyForm.cardSchemes = policyForm.selectAllCardSchemes ? cardSchemeOptions.value.map((item) => item.code) : [];
}

function syncPolicyScopeFields() {
    if (policyForm.channelScope === 'ALL') policyForm.channelCode = '';
    if (policyForm.countryScope === 'ALL') policyForm.countryCode = '';
}

function cleanQuery<T extends Record<string, any>>(source: T): T {
    return Object.fromEntries(Object.entries(source).filter(([, value]) => value !== '' && value !== undefined && value !== null)) as T;
}

function realCardSchemes(values: string[]) {
    return values.filter((item) => item && item !== 'ALL');
}

function treeRowClassName({ row }: { row: MccTreeNode }) {
    return row.status === 0 ? 'mcc-row-disabled' : '';
}

function nodeTypeText(type: string) {
    return t(`base.mcc.nodeType.${type}`);
}

function nodeTypeTag(type: string) {
    return type === 'MCC_CODE' ? 'success' : 'primary';
}

function riskText(value: string) {
    return t(`base.mcc.risk.${value}`);
}

function riskTag(value: string) {
    return value === 'LOW' ? 'success' : value === 'MEDIUM' ? 'warning' : 'danger';
}

function mccTypeText(value: string) {
    return t(`base.mcc.type.${value}`);
}

function deliveryText(value: string) {
    return t(`base.mcc.delivery.${value}`);
}

function scopeText(value: string) {
    return value === 'SPECIFIC' ? t('base.mcc.policy.specificChannel') : t('base.mcc.policy.allChannels');
}

function countryScopeText(value: string) {
    return value === 'SPECIFIC' ? t('base.mcc.policy.specificCountry') : t('base.mcc.policy.allCountries');
}

function yesNo(value?: number) {
    return value === 1 ? t('common.yes') : t('common.no');
}
</script>

<style scoped>
.mcc-page :deep(.mcc-row-disabled) {
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-lighter);
}

.mcc-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
}

.overview-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 6px;
    padding: 18px 20px;
    background: var(--el-bg-color);
}

.overview-value {
    font-size: 28px;
    line-height: 36px;
    font-weight: 650;
    color: var(--el-color-primary);
}

.overview-label {
    margin-top: 6px;
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.mcc-detail-footer {
    display: flex;
    justify-content: center;
}
</style>
