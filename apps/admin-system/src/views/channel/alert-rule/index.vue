<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.alert.ruleName')">
                <el-input v-model.trim="query.ruleName" :placeholder="t('common.pleaseInput')" clearable @keyup.enter="handleSearch" />
            </el-form-item>
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.businessType')">
                <el-select v-model="query.businessType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in businessOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.ruleType')">
                <el-select v-model="query.ruleType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.alert.alertLevel')">
                <el-select v-model="query.alertLevel" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in alertLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.ruleStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option :label="t('channel.common.enabled')" :value="1" />
                    <el-option :label="t('channel.common.disabled')" :value="0" />
                </el-select>
            </el-form-item>
            <el-form-item>
                <el-button type="primary" :icon="Search" size="small" @click="handleSearch">{{ t('channel.common.search') }}</el-button>
                <el-button :icon="Refresh" size="small" @click="resetQuery">{{ t('channel.common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:alert-rule:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:alert-rule:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:alert-rule:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="channel-alert-rule" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="ruleName" :label="t('channel.alert.ruleName')" min-width="180" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true"><template #default="{ row }">{{ channelDisplayText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center"><template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template></el-table-column>
            <el-table-column :label="t('channel.capability.paymentScope')" width="150" align="center">
                <template #default="{ row }">
                    <div class="scope-cell">
                        <PaymentLogoGroup v-if="paymentScopeLogo(row).length" :keys="paymentScopeLogo(row)" size="sm" align="center" />
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.alert.ruleType')" min-width="150" align="center"><template #default="{ row }">{{ optionLabel(ruleTypeOptions, row.ruleType) }}</template></el-table-column>
            <el-table-column :label="t('channel.alert.threshold')" min-width="150" align="center"><template #default="{ row }">{{ thresholdText(row) }}</template></el-table-column>
            <el-table-column :label="t('channel.alert.alertLevel')" width="120" align="center"><template #default="{ row }"><el-tag size="small" :type="alertLevelType(row.alertLevel)">{{ optionLabel(alertLevelOptions, row.alertLevel) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.ruleStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:alert-rule:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.alert.notifyType')" width="90" align="center"><template #default="{ row }"><el-tag size="small" effect="plain">{{ notifyTypeText(row.notifyType) }}</el-tag></template></el-table-column>
            <el-table-column :label="t('channel.common.operationTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime || row.createTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:alert-rule:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:alert-rule:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:alert-rule:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('channel.alert.ruleDetailTitle')" size="lg">
            <el-descriptions v-if="detailRow" :column="1" border size="small">
                <el-descriptions-item :label="t('channel.alert.ruleCode')">{{ detailRow.ruleCode }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.ruleName')">{{ detailRow.ruleName }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.channel')">{{ channelDisplayText(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.businessType')">{{ optionLabel(businessOptions, detailRow.businessType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.capability.paymentScope')">{{ scopeText(detailRow.paymentMethod, detailRow.cardBrand) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.ruleType')">{{ optionLabel(ruleTypeOptions, detailRow.ruleType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.windowMinutes')">{{ detailRow.windowMinutes }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.threshold')">{{ thresholdText(detailRow) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.minimumSampleCount')">{{ detailRow.minimumSampleCount ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.alertLevel')"><el-tag size="small" :type="alertLevelType(detailRow.alertLevel)">{{ optionLabel(alertLevelOptions, detailRow.alertLevel) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.ruleDescription')">{{ detailRow.ruleDescription || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.autoAction')">
                    <el-tag size="small" effect="plain" :type="statusType(detailRow.autoDegrade)">{{ t('channel.alert.autoDegrade') }}: {{ yesNoText(detailRow.autoDegrade, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                    <el-tag size="small" effect="plain" :type="statusType(detailRow.autoCircuitBreak)" class="ml6">{{ t('channel.alert.autoCircuitBreak') }}: {{ yesNoText(detailRow.autoCircuitBreak, t('channel.common.yes'), t('channel.common.no')) }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.status')"><el-tag size="small" :type="statusType(detailRow.ruleStatus)">{{ statusText(detailRow.ruleStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.notifyType')">{{ notifyTypeText(detailRow.notifyType) }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.emailRecipients')">{{ detailRow.emailRecipients || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.emailCc')">{{ detailRow.emailCc || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.emailTemplateCode')">{{ detailRow.emailTemplateCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.alert.emailSceneCode')">{{ detailRow.emailSceneCode || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.operator')">{{ detailRow.updateBy || detailRow.createBy || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.createTime')"><BaseDateTime :value="detailRow.createTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.updateTime')"><BaseDateTime :value="detailRow.updateTime" /></el-descriptions-item>
                <el-descriptions-item :label="t('channel.common.remark')">{{ detailRow.remark || '-' }}</el-descriptions-item>
            </el-descriptions>
        </CommonDetailDrawer>

        <el-dialog :title="formMode === 'create' ? t('channel.alert.ruleAddTitle') : t('channel.alert.ruleEditTitle')" v-model="formVisible" width="1080px" append-to-body destroy-on-close class="alert-rule-dialog">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="132px" size="small" class="alert-rule-form">
                <div class="form-section form-section--basic">
                    <div class="form-section__title">{{ t('channel.alert.basicSection') }}</div>
                    <div class="form-grid">
                        <el-form-item :label="t('channel.alert.ruleName')" prop="ruleName" class="form-grid__full">
                            <el-input v-model.trim="form.ruleName" maxlength="128" :placeholder="t('channel.alert.requiredRuleName')" />
                        </el-form-item>
                        <el-form-item :label="t('channel.common.channel')" prop="channelId">
                            <el-select v-model="form.channelId" filterable style="width:100%" :disabled="formMode === 'edit'" @change="handleChannelChange">
                                <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.common.businessType')" prop="businessType">
                            <el-select v-model="form.businessType" style="width:100%" :disabled="formMode === 'edit' || !form.channelId" @change="handleBusinessTypeChange">
                                <el-option v-for="item in formBusinessOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.common.paymentMethod')" prop="paymentMethod">
                            <el-select v-model="form.paymentMethod" filterable style="width:100%" :disabled="formMode === 'edit' || !form.businessType" @change="handlePaymentChange">
                                <el-option :label="t('channel.common.all')" value="ALL" />
                                <el-option v-for="item in formPaymentOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item v-if="isBankCardPayment" :label="t('channel.common.cardBrand')" prop="cardBrands">
                            <el-select v-model="form.cardBrands" multiple filterable collapse-tags collapse-tags-tooltip style="width:100%" @change="handleCardBrandsChange">
                                <el-option :label="t('channel.common.all')" value="ALL" />
                                <el-option v-for="item in formCardBrandOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.ruleType')" prop="ruleTypes">
                            <el-select v-model="form.ruleTypes" multiple collapse-tags collapse-tags-tooltip style="width:100%" @change="handleRuleTypesChange">
                                <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.common.status')" prop="ruleStatus">
                            <el-radio-group v-model="form.ruleStatus">
                                <el-radio :label="1">{{ t('channel.common.enabled') }}</el-radio>
                                <el-radio :label="0">{{ t('channel.common.disabled') }}</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </div>
                </div>

                <div class="form-section form-section--rules">
                    <div class="form-section__title">{{ t('channel.alert.ruleConfigSection') }}</div>
                    <div v-if="selectedRules.length" class="rule-type-switch">
                        <button
                            v-for="rule in selectedRules"
                            :key="rule.ruleType"
                            type="button"
                            class="rule-type-tab"
                            :class="{ 'is-active': activeRuleType === rule.ruleType }"
                            @click="activeRuleType = rule.ruleType"
                        >
                            {{ ruleTypeTabLabel(rule.ruleType) }}
                        </button>
                    </div>
                    <div v-for="rule in selectedRules" :key="rule.ruleType" v-show="activeRuleType === rule.ruleType" class="rule-panel">
                        <div class="rule-panel__grid">
                            <el-form-item :label="t('channel.alert.windowValue')" :prop="`rules.${rule.ruleType}.windowValue`" :rules="[{ required: true, message: t('channel.alert.requiredWindowMinutes'), trigger: 'blur' }]">
                                <el-input-number v-model="rule.windowValue" :min="1" :precision="0" controls-position="right" style="width:100%" />
                            </el-form-item>
                            <el-form-item :label="t('channel.alert.windowUnit')" :prop="`rules.${rule.ruleType}.windowUnit`">
                                <el-select v-model="rule.windowUnit" style="width:100%">
                                    <el-option v-for="item in windowUnitOptions" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </el-form-item>
                            <el-form-item
                                v-if="thresholdModeFor(rule.ruleType) === 'COUNT'"
                                :label="t('channel.alert.thresholdCount')"
                                :prop="`rules.${rule.ruleType}.thresholdCount`"
                                :rules="[{ required: true, message: t('channel.alert.requiredThresholdCount'), trigger: 'blur' }]"
                            >
                                <el-input-number v-model="rule.thresholdCount" :min="1" :precision="0" controls-position="right" style="width:100%" />
                            </el-form-item>
                            <el-form-item
                                v-if="thresholdModeFor(rule.ruleType) === 'RATE'"
                                :label="t('channel.alert.thresholdRate')"
                                :prop="`rules.${rule.ruleType}.thresholdRate`"
                                :rules="[{ required: true, message: t('channel.alert.requiredThresholdRate'), trigger: 'blur' }]"
                            >
                                <el-input-number v-model="rule.thresholdRate" :min="0.01" :max="100" :precision="2" controls-position="right" style="width:100%" />
                            </el-form-item>
                            <el-form-item
                                v-if="thresholdModeFor(rule.ruleType) === 'RATE'"
                                :label="t('channel.alert.minimumSampleCount')"
                                :prop="`rules.${rule.ruleType}.minimumSampleCount`"
                                :rules="[{ required: true, message: t('channel.alert.requiredMinimumSampleCount'), trigger: 'blur' }]"
                            >
                                <el-input-number v-model="rule.minimumSampleCount" :min="1" :precision="0" controls-position="right" style="width:100%" />
                            </el-form-item>
                            <el-form-item
                                v-if="thresholdModeFor(rule.ruleType) === 'MILLIS'"
                                :label="t('channel.alert.thresholdMillis')"
                                :prop="`rules.${rule.ruleType}.thresholdMillis`"
                                :rules="[{ required: true, message: t('channel.alert.requiredThresholdMillis'), trigger: 'blur' }]"
                            >
                                <el-input-number v-model="rule.thresholdMillis" :min="1" :precision="0" controls-position="right" style="width:100%" />
                            </el-form-item>
                            <el-form-item :label="t('channel.alert.alertLevel')" :prop="`rules.${rule.ruleType}.alertLevel`">
                                <el-select v-model="rule.alertLevel" style="width:100%">
                                    <el-option v-for="item in alertLevelOptions" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </div>
                        <el-form-item :label="t('channel.alert.autoAction')">
                            <el-switch v-model="rule.autoDegrade" :active-value="1" :inactive-value="0" :active-text="t('channel.alert.autoDegrade')" />
                            <el-switch v-model="rule.autoCircuitBreak" :active-value="1" :inactive-value="0" :active-text="t('channel.alert.autoCircuitBreak')" class="ml12" />
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.ruleDescription')">
                            <el-input v-model="rule.ruleDescription" type="textarea" maxlength="1000" show-word-limit />
                        </el-form-item>
                    </div>
                </div>

                <div class="form-section form-section--notify">
                    <div class="form-section__title">{{ t('channel.alert.notifyConfigSection') }}</div>
                    <div class="notify-grid">
                        <el-form-item :label="t('channel.alert.notifyType')" prop="notifyType">
                            <el-select v-model="form.notifyType" style="width:100%">
                                <el-option :label="t('channel.alert.email')" value="EMAIL" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.emailRecipients')" prop="recipientEmails">
                            <el-select v-model="form.recipientEmails" multiple filterable remote reserve-keyword collapse-tags collapse-tags-tooltip style="width:100%" :remote-method="searchEmailOptions">
                                <el-option v-for="item in userEmailOptions" :key="item.email" :label="userEmailLabel(item)" :value="item.email" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.emailCc')" prop="ccEmails">
                            <el-select v-model="form.ccEmails" multiple filterable remote reserve-keyword collapse-tags collapse-tags-tooltip style="width:100%" :remote-method="searchEmailOptions">
                                <el-option v-for="item in userEmailOptions" :key="item.email" :label="userEmailLabel(item)" :value="item.email" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.emailTemplateCode')" prop="emailTemplateCode">
                            <el-select v-model="form.emailTemplateCode" filterable remote reserve-keyword clearable style="width:100%" :remote-method="searchEmailOptions" @change="handleTemplateChange">
                                <el-option v-for="item in emailTemplateOptions" :key="`${item.templateCode}:${item.locale || ''}`" :label="templateOptionLabel(item)" :value="item.templateCode" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.alert.emailSceneCode')" prop="emailSceneCode">
                            <el-select v-model="form.emailSceneCode" filterable remote reserve-keyword clearable style="width:100%" :remote-method="searchEmailOptions">
                                <el-option v-for="item in emailSceneOptions" :key="item" :label="item" :value="item" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.common.remark')" class="notify-grid__remark">
                            <el-input v-model="form.remark" type="textarea" maxlength="500" show-word-limit />
                        </el-form-item>
                    </div>
                </div>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('channel.common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button>
                </div>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import { useI18n } from 'vue-i18n';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import {
    createChannelAlertRules,
    deleteChannelAlertRule,
    getChannelAlertRule,
    getChannelAlertRuleDimension,
    getChannelAlertRuleOptions,
    searchChannelAlertRules,
    updateChannelAlertRuleDimension,
    updateChannelAlertRuleStatus,
    type ChannelAlertEmailTemplateOption,
    type ChannelAlertRule,
    type ChannelAlertRuleBatchSaveRequest,
    type ChannelAlertRuleDimension,
    type ChannelAlertRuleItem,
    type ChannelAlertUserEmailOption,
} from '@/api/channel-alert';
import {
    cardLogoKeys,
    channelDisplayText,
    channelOptionLabel,
    loadChannelOptions,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    showChannelError,
    statusText,
    statusType,
    yesNoText,
    type SelectOption,
} from '../shared';
import type { ChannelOption } from '@/api/channel';

type WindowUnit = 'MINUTE' | 'HOUR' | 'DAY' | 'WEEK' | 'MONTH';
type ThresholdMode = 'COUNT' | 'RATE' | 'MILLIS' | '';

interface RuleFormItem {
    id?: number;
    ruleType: string;
    windowValue: number;
    windowUnit: WindowUnit;
    thresholdCount?: number;
    thresholdRate?: number;
    thresholdMillis?: number;
    minimumSampleCount?: number;
    alertLevel: string;
    ruleDescription?: string;
    autoDegrade: number;
    autoCircuitBreak: number;
}

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelAlertRule[]>([]);
const selectedRows = ref<ChannelAlertRule[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelAlertRule | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const editRuleId = ref<number>();
const activeRuleType = ref('');
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const ruleTypeOptions = ref<SelectOption[]>([]);
const alertLevelOptions = ref<SelectOption[]>([]);
const optionPaymentMethods = ref<{ businessType: string; paymentMethod: string; cardBrands: string[] }[]>([]);
const optionCardBrands = ref<string[]>([]);
const rowCapabilityOptions = ref<Record<string, { businessType: string; paymentMethod: string; cardBrands: string[] }[]>>({});
const userEmailOptions = ref<ChannelAlertUserEmailOption[]>([]);
const emailTemplateOptions = ref<ChannelAlertEmailTemplateOption[]>([]);
const emailSceneOptions = ref<string[]>([]);

const query = reactive({
    ruleName: '',
    channelId: undefined as number | undefined,
    businessType: '',
    ruleType: '',
    alertLevel: '',
    ruleStatus: undefined as number | undefined,
});

const form = reactive({
    ruleName: '',
    channelId: undefined as number | undefined,
    businessType: '',
    paymentMethod: '',
    cardBrands: [] as string[],
    ruleTypes: [] as string[],
    rules: {} as Record<string, RuleFormItem>,
    notifyType: 'EMAIL',
    recipientEmails: [] as string[],
    ccEmails: [] as string[],
    emailTemplateCode: '',
    emailSceneCode: 'CHANNEL_ALERT',
    ruleStatus: 1,
    remark: '',
});

const windowUnitOptions = computed(() => [
    { label: t('channel.alert.windowUnitMinute'), value: 'MINUTE' },
    { label: t('channel.alert.windowUnitHour'), value: 'HOUR' },
    { label: t('channel.alert.windowUnitDay'), value: 'DAY' },
    { label: t('channel.alert.windowUnitWeek'), value: 'WEEK' },
    { label: t('channel.alert.windowUnitMonth'), value: 'MONTH' },
]);

const rules: FormRules = {
    ruleName: [{ required: true, message: t('channel.alert.requiredRuleName'), trigger: 'blur' }],
    channelId: [{ required: true, message: t('channel.limit.requiredChannel'), trigger: 'change' }],
    businessType: [{ required: true, message: t('channel.limit.requiredBusinessType'), trigger: 'change' }],
    paymentMethod: [{ required: true, message: t('channel.limit.requiredPaymentMethod'), trigger: 'change' }],
    cardBrands: [{ required: true, type: 'array', min: 1, message: t('channel.limit.requiredCardBrand'), trigger: 'change' }],
    ruleTypes: [{ required: true, type: 'array', min: 1, message: t('channel.alert.requiredRuleType'), trigger: 'change' }],
    ruleStatus: [{ required: true, message: t('channel.limit.requiredStatus'), trigger: 'change' }],
    notifyType: [{ required: true, message: t('channel.alert.requiredNotifyType'), trigger: 'change' }],
    recipientEmails: [{ required: true, type: 'array', min: 1, message: t('channel.alert.requiredEmailRecipients'), trigger: 'change' }],
};

const selectedChannel = computed(() => channelOptions.value.find((item) => item.id === form.channelId));
const formBusinessOptions = computed(() => {
    const supported = optionPaymentMethods.value.map((item) => item.businessType);
    return businessOptions.value.filter((item) => supported.includes(item.value) || isBusinessSupportedByChannel(item.value, selectedChannel.value));
});
const formPaymentOptions = computed(() => {
    const values = optionPaymentMethods.value
        .filter((item) => item.businessType === form.businessType)
        .map((item) => item.paymentMethod);
    const source = form.businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value;
    return source.filter((item) => values.includes(item.value));
});
const formCardBrandOptions = computed(() => cardBrandOptions.value.filter((item) => optionCardBrands.value.includes(item.value)));
const isBankCardPayment = computed(() => form.paymentMethod === 'BANK_CARD');
const selectedRules = computed(() => form.ruleTypes.map((ruleType) => form.rules[ruleType]).filter(Boolean));

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => loadOptions());

watch(() => form.channelId, async (value) => {
    if (value) {
        await loadRuleOptions();
    }
});

async function loadOptions() {
    const lang = String(locale.value || 'zh-CN');
    const [channels, business, acquiringPayments, payoutPayments, cardBrands, ruleTypes, alertLevels] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_business_type', lang),
        loadDictOptions('acquiring_payment_method', lang),
        loadDictOptions('payout_payment_method', lang),
        loadDictOptions('card_brand', lang),
        loadDictOptions('channel_alert_rule_type', lang),
        loadDictOptions('channel_alert_level', lang),
    ]);
    channelOptions.value = channels;
    businessOptions.value = business;
    acquiringPaymentOptions.value = acquiringPayments;
    payoutPaymentOptions.value = payoutPayments;
    cardBrandOptions.value = cardBrands;
    ruleTypeOptions.value = ruleTypes;
    alertLevelOptions.value = alertLevels;
}

async function loadRuleOptions(keyword = '') {
    const result = await getChannelAlertRuleOptions({ channelId: form.channelId, businessType: form.businessType || undefined, keyword: keyword || undefined });
    optionPaymentMethods.value = result.paymentMethods || [];
    optionCardBrands.value = result.cardBrands || [];
    userEmailOptions.value = mergeUserEmailOptions(userEmailOptions.value, result.userEmails || []);
    emailTemplateOptions.value = mergeTemplateOptions(emailTemplateOptions.value, result.emailTemplates || []);
    emailSceneOptions.value = Array.from(new Set([...(result.emailSceneCodes || []), 'CHANNEL_ALERT']));
    syncFormDimensionOptions();
}

async function searchEmailOptions(keyword: string) {
    await loadRuleOptions(keyword);
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelAlertRules({
            pageNo: page.value,
            pageSize: pageSize.value,
            ruleName: query.ruleName || undefined,
            channelId: query.channelId,
            businessType: query.businessType || undefined,
            ruleType: query.ruleType || undefined,
            alertLevel: query.alertLevel || undefined,
            ruleStatus: query.ruleStatus,
        });
        rows.value = result.records;
        total.value = result.total;
        selectedRows.value = [];
        await preloadRowCapabilities(result.records);
    } catch (error) {
        await showChannelError(error, t('common.loadFailed'), t('common.loadFailed'));
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    Object.assign(query, { ruleName: '', channelId: undefined, businessType: '', ruleType: '', alertLevel: '', ruleStatus: undefined });
    handleSearch();
}

async function openDetail(row: ChannelAlertRule) {
    detailRow.value = await getChannelAlertRule(row.id);
    detailVisible.value = true;
}

async function openForm(mode: 'create' | 'edit', row?: ChannelAlertRule) {
    formMode.value = mode;
    resetForm();
    if (mode === 'edit' && row) {
        editRuleId.value = row.id;
        const dimension = await getChannelAlertRuleDimension(row.id);
        applyDimensionToForm(dimension);
    } else {
        form.channelId = channelOptions.value[0]?.id;
        syncBusinessTypeWithChannel();
        await loadRuleOptions();
        form.paymentMethod = 'ALL';
        handlePaymentChange();
        form.ruleTypes = [ruleTypeOptions.value[0]?.value || 'CONTINUOUS_FAILURE'].filter(Boolean);
        handleRuleTypesChange();
    }
    formVisible.value = true;
    nextTick(() => formRef.value?.clearValidate());
}

function resetForm() {
    editRuleId.value = undefined;
    Object.assign(form, {
        ruleName: '',
        channelId: undefined,
        businessType: '',
        paymentMethod: '',
        cardBrands: [],
        ruleTypes: [],
        rules: {},
        notifyType: 'EMAIL',
        recipientEmails: [],
        ccEmails: [],
        emailTemplateCode: '',
        emailSceneCode: 'CHANNEL_ALERT',
        ruleStatus: 1,
        remark: '',
    });
    activeRuleType.value = '';
    optionPaymentMethods.value = [];
    optionCardBrands.value = [];
}

async function handleChannelChange() {
    syncBusinessTypeWithChannel();
    await loadRuleOptions();
    form.paymentMethod = 'ALL';
    handlePaymentChange();
}

async function handleBusinessTypeChange() {
    await loadRuleOptions();
    form.paymentMethod = 'ALL';
    handlePaymentChange();
}

function handlePaymentChange() {
    if (!isBankCardPayment.value) {
        form.cardBrands = ['ALL'];
        return;
    }
    if (!form.cardBrands.length) {
        form.cardBrands = ['ALL'];
    }
}

function handleCardBrandsChange(values: string[]) {
    const selected = Array.isArray(values) ? values : [];
    if (!selected.length) {
        form.cardBrands = ['ALL'];
        return;
    }
    const lastSelected = selected[selected.length - 1];
    if (lastSelected === 'ALL') {
        form.cardBrands = ['ALL'];
        return;
    }
    form.cardBrands = selected.filter((item) => item !== 'ALL');
}

function handleRuleTypesChange() {
    const nextRules: Record<string, RuleFormItem> = {};
    for (const ruleType of form.ruleTypes) {
        nextRules[ruleType] = form.rules[ruleType] || defaultRuleItem(ruleType);
    }
    form.rules = nextRules;
    activeRuleType.value = form.ruleTypes[0] || '';
}

async function submitForm() {
    handlePaymentChange();
    handleRuleTypesChange();
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid || !validateRuleItems()) {
        return;
    }
    try {
        const payload = buildBatchPayload();
        if (formMode.value === 'create') {
            await createChannelAlertRules(payload);
        } else if (editRuleId.value) {
            await updateChannelAlertRuleDimension(editRuleId.value, {
                ...payload,
                retainedRuleIds: selectedRules.value.map((item) => item.id).filter((id): id is number => Boolean(id)),
            });
        }
    } catch (error) {
        await showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

function buildBatchPayload(): ChannelAlertRuleBatchSaveRequest {
    return {
        ruleName: form.ruleName,
        channelId: form.channelId,
        businessType: form.businessType,
        paymentMethod: form.paymentMethod,
        cardBrands: isBankCardPayment.value ? form.cardBrands : ['ALL'],
        rules: selectedRules.value.map(toRulePayload),
        notifyType: form.notifyType,
        emailRecipients: form.recipientEmails.join(','),
        emailCc: form.ccEmails.join(','),
        emailTemplateCode: form.emailTemplateCode,
        emailSceneCode: form.emailSceneCode || 'CHANNEL_ALERT',
        ruleStatus: form.ruleStatus,
        remark: form.remark,
    };
}

function toRulePayload(rule: RuleFormItem): ChannelAlertRuleItem {
    const mode = thresholdModeFor(rule.ruleType);
    return {
        id: rule.id,
        ruleType: rule.ruleType,
        windowMinutes: toWindowMinutes(rule.windowValue, rule.windowUnit),
        thresholdCount: mode === 'COUNT' ? rule.thresholdCount : undefined,
        thresholdRate: mode === 'RATE' ? rule.thresholdRate : undefined,
        thresholdMillis: mode === 'MILLIS' ? rule.thresholdMillis : undefined,
        minimumSampleCount: mode === 'RATE' ? rule.minimumSampleCount : undefined,
        alertLevel: rule.alertLevel,
        ruleDescription: rule.ruleDescription,
        autoDegrade: rule.autoDegrade,
        autoCircuitBreak: rule.autoCircuitBreak,
    };
}

function validateRuleItems() {
    for (const rule of selectedRules.value) {
        if (!rule.windowValue || !rule.alertLevel) {
            ElMessage.warning(t('channel.alert.requiredRuleFields'));
            activeRuleType.value = rule.ruleType;
            return false;
        }
        const mode = thresholdModeFor(rule.ruleType);
        if ((mode === 'COUNT' && !rule.thresholdCount)
            || (mode === 'RATE' && (!rule.thresholdRate || !rule.minimumSampleCount))
            || (mode === 'MILLIS' && !rule.thresholdMillis)) {
            ElMessage.warning(t('channel.alert.requiredRuleFields'));
            activeRuleType.value = rule.ruleType;
            return false;
        }
    }
    return true;
}

async function toggleStatus(row: ChannelAlertRule) {
    const nextStatus = row.ruleStatus === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: row.ruleName }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateChannelAlertRuleStatus(row.id, nextStatus);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(target?: ChannelAlertRule | ChannelAlertRule[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.alert.ruleDeleteConfirm', { name: targets.map((item) => item.ruleName).join(', ') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannelAlertRule(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function applyDimensionToForm(dimension: ChannelAlertRuleDimension) {
    form.ruleName = dimension.ruleName || dimension.rules[0]?.ruleName || '';
    form.channelId = dimension.channelId;
    form.businessType = dimension.businessType;
    form.paymentMethod = dimension.paymentMethod;
    form.cardBrands = splitScopeValues(dimension.cardBrands).length ? splitScopeValues(dimension.cardBrands) : ['ALL'];
    form.notifyType = dimension.notifyType || 'EMAIL';
    form.recipientEmails = splitEmails(dimension.emailRecipients);
    form.ccEmails = splitEmails(dimension.emailCc);
    form.emailTemplateCode = dimension.emailTemplateCode || '';
    form.emailSceneCode = dimension.emailSceneCode || 'CHANNEL_ALERT';
    form.ruleStatus = dimension.ruleStatus ?? 1;
    form.remark = dimension.remark || '';
    const byRuleType = new Map<string, ChannelAlertRule>();
    dimension.rules.forEach((rule) => {
        if (!byRuleType.has(rule.ruleType)) {
            byRuleType.set(rule.ruleType, rule);
        }
    });
    form.ruleTypes = Array.from(byRuleType.keys());
    form.rules = Object.fromEntries(Array.from(byRuleType.entries()).map(([ruleType, rule]) => [ruleType, toRuleFormItem(rule)]));
    activeRuleType.value = form.ruleTypes[0] || '';
    userEmailOptions.value = mergeUserEmailOptions(userEmailOptions.value, splitEmails(dimension.emailRecipients).concat(splitEmails(dimension.emailCc)).map((email) => ({ accountId: 0, loginAccount: email, email })));
    if (dimension.emailTemplateCode) {
        emailTemplateOptions.value = mergeTemplateOptions(emailTemplateOptions.value, [{ templateCode: dimension.emailTemplateCode, sceneCode: dimension.emailSceneCode || 'CHANNEL_ALERT' }]);
    }
    emailSceneOptions.value = Array.from(new Set([...emailSceneOptions.value, dimension.emailSceneCode || 'CHANNEL_ALERT']));
    loadRuleOptions();
}

function defaultRuleItem(ruleType: string): RuleFormItem {
    const mode = thresholdModeFor(ruleType);
    return {
        ruleType,
        windowValue: 5,
        windowUnit: 'MINUTE',
        thresholdCount: mode === 'COUNT' ? 3 : undefined,
        thresholdRate: mode === 'RATE' ? 80 : undefined,
        thresholdMillis: mode === 'MILLIS' ? 3000 : undefined,
        minimumSampleCount: mode === 'RATE' ? 20 : undefined,
        alertLevel: 'L1_WARNING',
        ruleDescription: '',
        autoDegrade: 0,
        autoCircuitBreak: 0,
    };
}

function toRuleFormItem(rule: ChannelAlertRule): RuleFormItem {
    const window = fromWindowMinutes(rule.windowMinutes);
    return {
        id: rule.id,
        ruleType: rule.ruleType,
        windowValue: window.value,
        windowUnit: window.unit,
        thresholdCount: rule.thresholdCount,
        thresholdRate: rule.thresholdRate,
        thresholdMillis: rule.thresholdMillis,
        minimumSampleCount: rule.minimumSampleCount,
        alertLevel: rule.alertLevel,
        ruleDescription: rule.ruleDescription || '',
        autoDegrade: rule.autoDegrade,
        autoCircuitBreak: rule.autoCircuitBreak,
    };
}

function syncFormDimensionOptions() {
    syncBusinessTypeWithChannel();
    if (form.businessType && form.paymentMethod !== 'ALL' && !formPaymentOptions.value.some((item) => item.value === form.paymentMethod)) {
        form.paymentMethod = 'ALL';
    }
    if (isBankCardPayment.value) {
        const available = new Set(['ALL', ...formCardBrandOptions.value.map((item) => item.value)]);
        form.cardBrands = form.cardBrands.filter((item) => available.has(item));
        if (!form.cardBrands.length) {
            form.cardBrands = ['ALL'];
        }
        handleCardBrandsChange(form.cardBrands);
    } else {
        form.cardBrands = ['ALL'];
    }
}

function isBusinessSupportedByChannel(businessType: string, channel?: ChannelOption) {
    if (!channel) {
        return true;
    }
    if (businessType === 'ACQUIRING') {
        return channel.supportAcquiring === 1;
    }
    if (businessType === 'PAYOUT') {
        return channel.supportPayout === 1;
    }
    return false;
}

function syncBusinessTypeWithChannel() {
    const options = businessOptions.value.filter((item) => isBusinessSupportedByChannel(item.value, selectedChannel.value));
    if (!options.some((item) => item.value === form.businessType)) {
        form.businessType = options[0]?.value || '';
    }
}

function thresholdModeFor(ruleType?: string): ThresholdMode {
    if (ruleType === 'CONTINUOUS_FAILURE') {
        return 'COUNT';
    }
    if (ruleType === 'SUCCESS_RATE_LOW' || ruleType === 'TECH_ERROR_RATE_HIGH') {
        return 'RATE';
    }
    if (ruleType === 'LATENCY_HIGH') {
        return 'MILLIS';
    }
    return '';
}

function ruleTypeTabLabel(ruleType?: string) {
    if (ruleType === 'CONTINUOUS_FAILURE') {
        return t('channel.alert.continuousFailureShort');
    }
    if (ruleType === 'SUCCESS_RATE_LOW') {
        return t('channel.alert.successRateLowShort');
    }
    if (ruleType === 'TECH_ERROR_RATE_HIGH') {
        return t('channel.alert.techErrorRateHighShort');
    }
    if (ruleType === 'LATENCY_HIGH') {
        return t('channel.alert.latencyHighShort');
    }
    return optionLabel(ruleTypeOptions.value, ruleType);
}

function toWindowMinutes(value: number, unit: WindowUnit) {
    const multiplier = { MINUTE: 1, HOUR: 60, DAY: 1440, WEEK: 10080, MONTH: 43200 }[unit];
    return Math.max(1, Math.round(value * multiplier));
}

function fromWindowMinutes(minutes?: number): { value: number; unit: WindowUnit } {
    const value = minutes || 5;
    if (value % 43200 === 0) {
        return { value: value / 43200, unit: 'MONTH' };
    }
    if (value % 10080 === 0) {
        return { value: value / 10080, unit: 'WEEK' };
    }
    if (value % 1440 === 0) {
        return { value: value / 1440, unit: 'DAY' };
    }
    if (value % 60 === 0) {
        return { value: value / 60, unit: 'HOUR' };
    }
    return { value, unit: 'MINUTE' };
}

function scopeText(paymentMethod?: string, cardBrand?: string) {
    const payment = !paymentMethod || paymentMethod === 'ALL' ? t('channel.common.all') : optionLabel([...acquiringPaymentOptions.value, ...payoutPaymentOptions.value], paymentMethod);
    const cardValues = splitScopeText(cardBrand);
    const card = !cardValues.length || cardValues.includes('ALL') ? '' : ` / ${cardValues.map((item) => optionLabel(cardBrandOptions.value, item)).join(', ')}`;
    return `${payment}${card}`;
}

function thresholdText(row: Pick<ChannelAlertRule, 'ruleType' | 'thresholdCount' | 'thresholdRate' | 'thresholdMillis'>) {
    if (row.ruleType === 'CONTINUOUS_FAILURE') {
        return `${row.thresholdCount ?? '-'} ${t('channel.alert.countUnit')}`;
    }
    if (row.ruleType === 'SUCCESS_RATE_LOW' || row.ruleType === 'TECH_ERROR_RATE_HIGH') {
        return `${row.thresholdRate ?? '-'}%`;
    }
    if (row.ruleType === 'LATENCY_HIGH') {
        return `${row.thresholdMillis ?? '-'} ms`;
    }
    return '-';
}

function notifyTypeText(value?: string) {
    return value === 'EMAIL' ? t('channel.alert.email') : (value || '-');
}

function alertLevelType(value?: string) {
    if (value === 'L1_WARNING') {
        return 'warning';
    }
    if (value === 'L2_DEGRADED' || value === 'L3_CIRCUIT_BREAK') {
        return 'danger';
    }
    return 'info';
}

function paymentScopeLogo(row: Pick<ChannelAlertRule, 'channelId' | 'businessType' | 'paymentMethod' | 'cardBrand'>): PaymentLogoKey[] {
    if (!row.paymentMethod || row.paymentMethod === 'ALL') {
        return capabilityOptionsForRow(row)
            .filter((item) => item.businessType === row.businessType)
            .flatMap((item) => paymentLogoKeys(item.paymentMethod, paymentOptionsFor(row.businessType).find((option) => option.value === item.paymentMethod)));
    }
    if (row.paymentMethod === 'BANK_CARD') {
        const brands = splitScopeText(row.cardBrand);
        const supportedBrands = supportedCardBrands(row);
        const values = !brands.length || brands.includes('ALL') ? supportedBrands : brands;
        return values.flatMap((value) => cardLogoKeys(value, cardBrandOptions.value.find((item) => item.value === value)));
    }
    return paymentLogoKeys(row.paymentMethod, paymentOptionsFor(row.businessType).find((item) => item.value === row.paymentMethod));
}

function supportedCardBrands(row: Pick<ChannelAlertRule, 'channelId' | 'businessType'>) {
    const matched = capabilityOptionsForRow(row)
        .filter((item) => item.businessType === row.businessType && item.paymentMethod === 'BANK_CARD')
        .flatMap((item) => item.cardBrands || []);
    return matched.length ? Array.from(new Set(matched)) : cardBrandOptions.value.map((item) => String(item.value));
}

function capabilityOptionsForRow(row: Pick<ChannelAlertRule, 'channelId' | 'businessType'>) {
    return rowCapabilityOptions.value[capabilityCacheKey(row.channelId, row.businessType)] || [];
}

function capabilityCacheKey(channelId?: number, businessType?: string) {
    return `${channelId || 0}:${businessType || ''}`;
}

async function preloadRowCapabilities(records: ChannelAlertRule[]) {
    const pairs = Array.from(new Set(records
        .filter((item) => item.channelId && item.businessType)
        .map((item) => capabilityCacheKey(item.channelId, item.businessType))));
    const missingPairs = pairs.filter((key) => !rowCapabilityOptions.value[key]);
    if (!missingPairs.length) {
        return;
    }
    const loaded = await Promise.all(missingPairs.map(async (key) => {
        const [channelId, businessType] = key.split(':');
        const result = await getChannelAlertRuleOptions({ channelId: Number(channelId), businessType });
        return [key, result.paymentMethods || []] as const;
    }));
    rowCapabilityOptions.value = {
        ...rowCapabilityOptions.value,
        ...Object.fromEntries(loaded),
    };
}

function paymentOptionsFor(businessType?: string) {
    return businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value;
}

function splitEmails(value?: string) {
    return (value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function splitScopeText(value?: string) {
    return (value || '').split(',').map((item) => item.trim().toUpperCase()).filter(Boolean);
}

function splitScopeValues(values?: string[]) {
    return (values || []).flatMap((value) => splitScopeText(value)).filter(Boolean);
}

function userEmailLabel(item: ChannelAlertUserEmailOption) {
    const name = item.realName || item.loginAccount;
    return name && name !== item.email ? `${name} (${item.email})` : item.email;
}

function templateOptionLabel(item: ChannelAlertEmailTemplateOption) {
    return item.templateName ? `${item.templateCode} (${item.templateName})` : item.templateCode;
}

function handleTemplateChange(value?: string) {
    const template = emailTemplateOptions.value.find((item) => item.templateCode === value);
    if (template?.sceneCode) {
        form.emailSceneCode = template.sceneCode;
    }
}

function mergeUserEmailOptions(current: ChannelAlertUserEmailOption[], incoming: ChannelAlertUserEmailOption[]) {
    const map = new Map<string, ChannelAlertUserEmailOption>();
    [...current, ...incoming].forEach((item) => {
        if (item.email) {
            map.set(item.email, item);
        }
    });
    return Array.from(map.values());
}

function mergeTemplateOptions(current: ChannelAlertEmailTemplateOption[], incoming: ChannelAlertEmailTemplateOption[]) {
    const map = new Map<string, ChannelAlertEmailTemplateOption>();
    [...current, ...incoming].forEach((item) => {
        if (item.templateCode) {
            map.set(`${item.templateCode}:${item.locale || ''}`, item);
        }
    });
    return Array.from(map.values());
}
</script>

<style scoped>
.ml6 {
    margin-left: 6px;
}

.ml12 {
    margin-left: 12px;
}

.scope-cell {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 6px;
    min-height: 34px;
    justify-content: center;
}

.alert-rule-form {
    max-width: 1040px;
}

.form-section {
    padding: 14px 0 4px;
    border-top: 1px solid var(--el-border-color-lighter);
}

.form-section:first-child {
    padding-top: 0;
    border-top: 0;
}

.form-section__title {
    margin-bottom: 12px;
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

.form-grid {
    display: grid;
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
}

.form-grid :deep(.el-form-item),
.rule-panel__grid :deep(.el-form-item),
.notify-grid :deep(.el-form-item) {
    align-self: start;
}

.form-grid__full {
    grid-column: 1 / -1;
}

.rule-type-switch {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    padding: 4px 6px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    border-radius: 6px 6px 0 0;
    background: linear-gradient(180deg, #f7fbff 0%, #f9fbff 54%, #fff 100%);
    margin-bottom: 14px;
}

.rule-type-tab {
    position: relative;
    height: 42px;
    border: 0;
    background: transparent;
    color: var(--el-text-color-regular);
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
}

.rule-type-tab::after {
    position: absolute;
    right: 28px;
    bottom: -1px;
    left: 28px;
    height: 2px;
    background: transparent;
    content: "";
}

.rule-type-tab.is-active {
    color: var(--el-color-primary);
}

.rule-type-tab.is-active::after {
    background: var(--el-color-primary);
}

.rule-panel {
    padding: 0 0 4px;
}

.rule-panel__grid {
    display: grid;
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
}

.rule-panel :deep(.el-textarea__inner),
.notify-grid :deep(.el-textarea__inner) {
    min-height: 72px;
}

.notify-grid {
    display: grid;
    align-items: start;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 18px;
}

.notify-grid__remark {
    grid-column: 1 / -1;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

@media (max-width: 820px) {
    .form-grid,
    .rule-panel__grid,
    .notify-grid {
        grid-template-columns: 1fr;
    }

    .rule-type-switch {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .rule-panel {
        padding-right: 12px;
        padding-left: 12px;
    }
}
</style>
