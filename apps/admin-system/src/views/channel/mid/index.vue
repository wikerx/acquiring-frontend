<template>
    <div class="app-container channel-page">
        <el-form v-show="showSearch" :model="query" :inline="true" size="small" class="search-form" label-width="92px">
            <el-form-item :label="t('channel.common.channel')">
                <el-select v-model="query.channelId" :placeholder="t('channel.common.pleaseSelect')" clearable filterable>
                    <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.mid.channelMid')">
                <el-select v-model="query.channelMid" :placeholder="t('channel.mid.channelMidPlaceholder')" clearable filterable>
                    <el-option v-for="item in midQueryOptions" :key="item.id" :label="midQueryOptionLabel(item)" :value="item.channelMid" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.businessType')">
                <el-select v-model="query.businessType" :placeholder="t('channel.common.pleaseSelect')" clearable>
                    <el-option v-for="item in businessOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
            </el-form-item>
            <el-form-item :label="t('channel.common.status')">
                <el-select v-model="query.midStatus" :placeholder="t('channel.common.pleaseSelect')" clearable>
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
            <el-col :span="1.5"><el-button type="primary" plain :icon="Plus" size="small" @click="openForm('create')" v-hasPermi="'channel:mid:add'">{{ t('channel.common.add') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="success" plain :icon="Edit" size="small" :disabled="selectedRows.length !== 1" @click="openForm('edit', selectedRows[0])" v-hasPermi="'channel:mid:edit'">{{ t('channel.common.edit') }}</el-button></el-col>
            <el-col :span="1.5"><el-button type="danger" plain :icon="Delete" size="small" :disabled="!selectedRows.length" @click="handleDelete(selectedRows)" v-hasPermi="'channel:mid:remove'">{{ t('channel.common.delete') }}</el-button></el-col>
            <el-col class="right-toolbar"><RightToolbar @toggle-search="showSearch = !showSearch" @refresh="handleSearch" /></el-col>
        </el-row>

        <StandardTable table-key="channel-mid" v-loading="loading" :data="rows" row-key="id" size="small" @selection-change="selectedRows = $event">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column :label="t('channel.common.channel')" min-width="180" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ channelDisplayText(row) }}</template>
            </el-table-column>
            <el-table-column prop="channelMid" :label="t('channel.mid.channelMid')" min-width="160" align="center" :show-overflow-tooltip="true" />
            <el-table-column :label="t('channel.common.businessType')" width="110" align="center">
                <template #default="{ row }">{{ optionLabel(businessOptions, row.businessType) }}</template>
            </el-table-column>
            <el-table-column :label="t('channel.mid.paymentMethodScope')" min-width="170" align="center">
                <template #default="{ row }">
                    <div class="payment-scope-cell">
                        <PaymentLogoGroup v-if="paymentScopeLogo(row).length" :keys="paymentScopeLogo(row)" fallback="text" size="sm" align="center" />
                    </div>
                </template>
            </el-table-column>
            <el-table-column :label="t('channel.mid.currencyScope')" min-width="150" align="center" :show-overflow-tooltip="true">
                <template #default="{ row }">{{ currencyScopeText(row.currencyScope) }}</template>
            </el-table-column>
            <el-table-column prop="defaultSettlementCurrency" :label="t('channel.mid.defaultSettlementCurrency')" width="140" align="center" />
            <el-table-column prop="settlementCycle" :label="t('channel.mid.settlementCycle')" width="100" align="center" />
            <el-table-column prop="mcc" label="MCC" width="90" align="center" />
            <el-table-column :label="t('channel.common.status')" width="90" align="center">
                <template #default="{ row }"><el-switch :model-value="row.midStatus" :active-value="1" :inactive-value="0" @change="toggleStatus(row)" v-hasPermi="'channel:mid:status'" /></template>
            </el-table-column>
            <el-table-column :label="t('channel.common.updateTime')" min-width="170" align="center"><template #default="{ row }"><BaseDateTime :value="row.updateTime" /></template></el-table-column>
            <el-table-column :label="t('channel.common.operation')" width="220" align="center" fixed="right">
                <template #default="{ row }">
                    <el-button size="small" type="primary" link :icon="View" @click="openDetail(row)" v-hasPermi="'channel:mid:detail'">{{ t('channel.common.detail') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Edit" @click="openForm('edit', row)" v-hasPermi="'channel:mid:edit'">{{ t('channel.common.edit') }}</el-button>
                    <el-button size="small" type="primary" link :icon="Delete" @click="handleDelete(row)" v-hasPermi="'channel:mid:remove'">{{ t('channel.common.delete') }}</el-button>
                </template>
            </el-table-column>
        </StandardTable>

        <div class="pagination-container" v-show="total > 0">
            <el-pagination v-model:current-page="page" v-model:page-size="pageSize" :total="total" :page-sizes="[10, 20, 50, 100]" layout="total, sizes, prev, pager, next, jumper" background @size-change="loadData" @current-change="loadData" />
        </div>

        <CommonDetailDrawer v-model:visible="detailVisible" :title="t('channel.mid.detailTitle')" size="lg">
            <div v-if="detailRow" class="mid-detail">
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.channel') }}</span><div class="mid-detail__value">{{ channelDisplayText(detailRow) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.channelMid') }}</span><div class="mid-detail__value">{{ detailRow.channelMid }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.terminalId') }}</span><div class="mid-detail__value">{{ detailRow.terminalId || '-' }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.businessType') }}</span><div class="mid-detail__value">{{ optionLabel(businessOptions, detailRow.businessType) }}</div></div>
                <div class="mid-detail__item">
                    <span class="mid-detail__label">{{ t('channel.mid.paymentMethodScope') }}</span>
                    <div class="mid-detail__value">
                        <div class="payment-scope-cell payment-scope-cell--detail">
                            <PaymentLogoGroup v-if="paymentScopeLogo(detailRow).length" :keys="paymentScopeLogo(detailRow)" fallback="text" size="sm" />
                        </div>
                    </div>
                </div>
                <div class="mid-detail__item">
                    <span class="mid-detail__label">{{ t('channel.mid.transactionTypeScope') }}</span>
                    <div class="mid-detail__value">
                        <div v-if="transactionScopeItems(detailRow.transactionTypeScope).length" class="tag-list tag-list-left">
                            <el-tag v-for="item in transactionScopeItems(detailRow.transactionTypeScope)" :key="item.value" size="small" effect="plain">{{ item.label }}</el-tag>
                        </div>
                        <span v-else>-</span>
                    </div>
                </div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.currencyScope') }}</span><div class="mid-detail__value">{{ currencyScopeText(detailRow.currencyScope) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.allowedCountryScope') }}</span><div class="mid-detail__value">{{ countryScopeText(detailRow.allowedCountryScope) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.defaultSettlementCurrency') }}</span><div class="mid-detail__value">{{ currencyLabel(detailRow.defaultSettlementCurrency) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.settlementCycle') }}</span><div class="mid-detail__value">{{ detailRow.settlementCycle }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.settlementCutoffTime') }}</span><div class="mid-detail__value">{{ detailRow.settlementCutoffTime || '-' }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.settlementTimeZone') }}</span><div class="mid-detail__value">{{ optionLabel(timezoneOptions, detailRow.settlementTimeZone) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">MCC</span><div class="mid-detail__value">{{ mccLabel(detailRow.mcc) }}</div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.statementDescriptor') }}</span><div class="mid-detail__value">{{ detailRow.statementDescriptor || '-' }}</div></div>
                <div class="mid-detail__item mid-detail__item--block">
                    <span class="mid-detail__label">{{ t('channel.mid.metadataValueJson') }}</span>
                    <div class="mid-detail__value">
                        <div v-if="metadataRowsForDetail(detailRow).length" class="metadata-detail">
                            <div v-for="item in metadataRowsForDetail(detailRow)" :key="item.key" class="metadata-detail__row">
                                <span class="metadata-detail__key">{{ item.label }}</span>
                                <span class="metadata-detail__value">{{ item.value }}</span>
                            </div>
                        </div>
                        <span v-else>-</span>
                    </div>
                </div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.status') }}</span><div class="mid-detail__value"><el-tag size="small" :type="statusType(detailRow.midStatus)">{{ statusText(detailRow.midStatus, t('channel.common.enabled'), t('channel.common.disabled')) }}</el-tag></div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.mid.effectiveTime') }}</span><div class="mid-detail__value"><BaseDateTime :value="detailRow.effectiveTime" /></div></div>
                <div class="mid-detail__item">
                    <span class="mid-detail__label">{{ t('channel.mid.expireTime') }}</span>
                    <div class="mid-detail__value">
                        <BaseDateTime v-if="detailRow.expireTime" :value="detailRow.expireTime" />
                        <el-tag v-else size="small" type="success" effect="plain">{{ t('channel.mid.neverExpire') }}</el-tag>
                    </div>
                </div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.createTime') }}</span><div class="mid-detail__value"><BaseDateTime :value="detailRow.createTime" /></div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.updateTime') }}</span><div class="mid-detail__value"><BaseDateTime :value="detailRow.updateTime" /></div></div>
                <div class="mid-detail__item"><span class="mid-detail__label">{{ t('channel.common.remark') }}</span><div class="mid-detail__value">{{ detailRow.remark || '-' }}</div></div>
            </div>
        </CommonDetailDrawer>

        <el-drawer :title="formMode === 'create' ? t('channel.mid.addTitle') : t('channel.mid.editTitle')" v-model="formVisible" size="min(1180px, 96vw)" append-to-body destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="150px" size="small" class="mid-form">
                <div class="form-section">
                    <div class="form-section__title">{{ t('channel.mid.basicSection') }}</div>
                    <div class="form-grid">
                        <el-form-item :label="t('channel.common.channel')" prop="channelId">
                            <el-select v-model="form.channelId" :placeholder="t('channel.common.pleaseSelect')" filterable style="width:100%" :disabled="formMode === 'edit'" @change="handleChannelChange">
                                <el-option v-for="item in channelOptions" :key="item.id" :label="channelOptionLabel(item)" :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.common.businessType')" prop="businessType">
                            <el-select v-model="form.businessType" style="width:100%" @change="handleBusinessTypeChange">
                                <el-option v-for="item in availableBusinessOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.channelMid')" prop="channelMid">
                            <el-input v-model.trim="form.channelMid" :placeholder="t('channel.mid.channelMidPlaceholder')" maxlength="128" show-word-limit />
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.terminalId')"><el-input v-model.trim="form.terminalId" maxlength="128" /></el-form-item>
                        <el-form-item label="MCC">
                            <el-select v-model="form.mcc" :placeholder="t('channel.mid.mccPlaceholder')" clearable filterable style="width:100%">
                                <el-option v-for="item in mccOptions" :key="item.code" :label="mccOptionLabel(item)" :value="item.code" />
                            </el-select>
                        </el-form-item>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section__title">{{ t('channel.mid.capabilitySection') }}</div>
                    <div class="form-grid">
                        <el-form-item :label="t('channel.mid.paymentMethodScope')" prop="paymentScopes">
                            <el-tree-select
                                v-model="form.paymentScopes"
                                :data="paymentScopeTree"
                                multiple
                                check-strictly
                                collapse-tags
                                collapse-tags-tooltip
                                filterable
                                node-key="value"
                                :render-after-expand="false"
                                :placeholder="t('channel.mid.paymentMethodPlaceholder')"
                                style="width:100%"
                                @change="handlePaymentScopeChange"
                            />
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.currencyScope')" prop="currencyCodes">
                            <el-select v-model="form.currencyCodes" multiple filterable collapse-tags collapse-tags-tooltip :placeholder="t('channel.mid.currencySelectPlaceholder')" style="width:100%">
                                <el-option v-for="item in currencyOptions" :key="item.alpha3Code" :label="currencyOptionLabel(item)" :value="item.alpha3Code" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.allowedCountryScope')" prop="countryCodes" class="country-form-item">
                            <el-checkbox v-model="form.countryAll" @change="handleCountryAllChange">{{ t('channel.mid.selectAllCountries') }}</el-checkbox>
                            <el-select v-model="form.countryCodes" multiple filterable collapse-tags collapse-tags-tooltip :placeholder="t('channel.mid.countrySelectPlaceholder')" style="width:100%" :disabled="form.countryAll">
                                <el-option v-for="item in countryOptions" :key="item.alpha3Code" :label="countryOptionLabel(item)" :value="item.alpha3Code" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.defaultSettlementCurrency')" prop="defaultSettlementCurrency">
                            <el-select v-model="form.defaultSettlementCurrency" filterable :placeholder="t('channel.mid.defaultSettlementCurrencyPlaceholder')" style="width:100%">
                                <el-option v-for="item in currencyOptions" :key="item.alpha3Code" :label="currencyOptionLabel(item)" :value="item.alpha3Code" />
                            </el-select>
                        </el-form-item>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section__title">{{ t('channel.mid.settlementSection') }}</div>
                    <div class="form-grid">
                        <el-form-item :label="t('channel.mid.settlementCycle')" prop="settlementDays">
                            <el-input-number v-model="form.settlementDays" :min="0" :max="999" :step="1" controls-position="right" style="width:100%" />
                            <div class="inline-hint">{{ t('channel.mid.settlementCyclePreview', { days: form.settlementDays }) }}</div>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.settlementTimeZone')" prop="settlementTimeZone">
                            <el-select v-model="form.settlementTimeZone" filterable :placeholder="t('channel.mid.settlementTimeZonePlaceholder')" style="width:100%">
                                <el-option v-for="item in timezoneOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('channel.mid.settlementCutoffTime')"><el-time-picker v-model="form.settlementCutoffTime" value-format="HH:mm:ss" format="HH:mm:ss" style="width:100%" /></el-form-item>
                        <el-form-item :label="t('channel.mid.statementDescriptor')"><el-input v-model.trim="form.statementDescriptor" maxlength="128" /></el-form-item>
                        <el-form-item :label="t('channel.mid.effectiveTime')"><el-date-picker v-model="form.effectiveTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                        <el-form-item :label="t('channel.mid.expireTime')"><el-date-picker v-model="form.expireTime" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" format="YYYY-MM-DD HH:mm:ss" style="width:100%" /></el-form-item>
                    </div>
                </div>

                <div class="form-section">
                    <div class="form-section__title">{{ t('channel.mid.metadataValueJson') }}</div>
                    <div v-if="metadataSchemas.length" class="metadata-grid">
                        <el-form-item v-for="schema in metadataSchemas" :key="schema.fieldKey" :label="schema.fieldLabel || schema.fieldKey" :required="schema.requiredFlag === 1">
                            <template #label>
                                <span>{{ schema.fieldLabel || schema.fieldKey }}</span>
                                <el-tag v-if="schema.sensitiveFlag === 1" size="small" type="warning" effect="plain" class="metadata-tag">{{ t('channel.mid.metadataSensitive') }}</el-tag>
                            </template>
                            <el-input
                                v-if="isLongMetadata(schema.fieldType)"
                                v-model="form.metadataValues[schema.fieldKey]"
                                type="textarea"
                                :rows="metadataInputRows(schema.fieldType)"
                                :placeholder="metadataPlaceholder(schema)"
                                resize="vertical"
                            />
                            <el-input
                                v-else
                                v-model="form.metadataValues[schema.fieldKey]"
                                :type="schema.sensitiveFlag === 1 || schema.fieldType === 'PASSWORD' ? 'password' : 'text'"
                                :show-password="schema.sensitiveFlag === 1 || schema.fieldType === 'PASSWORD'"
                                :placeholder="metadataPlaceholder(schema)"
                            />
                        </el-form-item>
                    </div>
                    <el-empty v-else :description="t('channel.mid.noMetadataSchema')" :image-size="80" />
                </div>

                <el-form-item :label="t('channel.common.status')" prop="midStatus"><el-select v-model="form.midStatus" style="width:100%"><el-option :label="t('channel.common.enabled')" :value="1" /><el-option :label="t('channel.common.disabled')" :value="0" /></el-select></el-form-item>
                <el-form-item :label="t('channel.common.remark')"><el-input v-model="form.remark" type="textarea" maxlength="500" /></el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" @click="submitForm">{{ t('channel.common.confirm') }}</el-button>
                    <el-button @click="formVisible = false">{{ t('channel.common.cancel') }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus';
import { Delete, Edit, Plus, Refresh, Search, View } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { PaymentLogoGroup, type PaymentLogoKey } from '@acquiring/shared';
import BaseDateTime from '@/components/BaseDateTime/index.vue';
import CommonDetailDrawer from '@/components/CommonDetailDrawer.vue';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { searchCountries, type IsoCountry } from '@/api/base/country';
import { getMccOptions, type MccOption } from '@/api/base/mcc';
import {
    createChannelMid,
    deleteChannelMid,
    getChannel,
    getChannelMid,
    searchChannelCapabilities,
    searchChannelMids,
    updateChannelMid,
    updateChannelMidStatus,
    type ChannelCapability,
    type ChannelMetadataSchema,
    type ChannelMidConfig,
    type ChannelOption,
} from '@/api/channel';
import {
    channelDisplayText,
    channelOptionLabel,
    cardLogoKeys,
    currencyOptionLabel,
    loadChannelOptions,
    loadCurrencyOptions,
    loadDictOptions,
    optionLabel,
    paymentLogoKeys,
    showChannelError,
    statusText,
    statusType,
    type SelectOption,
} from '../shared';
import type { IsoCurrency } from '@/api/base/currency';

interface PaymentScopeNode {
    label: string;
    value: string;
    disabled?: boolean;
    children?: PaymentScopeNode[];
}

interface MidFormState {
    id: number;
    channelId?: number;
    channelMid: string;
    terminalId: string;
    businessType: string;
    paymentScopes: string[];
    currencyCodes: string[];
    countryAll: boolean;
    countryCodes: string[];
    defaultSettlementCurrency: string;
    settlementDays: number;
    settlementCutoffTime: string;
    settlementTimeZone: string;
    mcc: string;
    statementDescriptor: string;
    metadataValues: Record<string, string>;
    midStatus: number;
    effectiveTime: string;
    expireTime: string;
    remark: string;
}

const { locale, t } = useI18n();
const showSearch = ref(true);
const loading = ref(false);
const rows = ref<ChannelMidConfig[]>([]);
const selectedRows = ref<ChannelMidConfig[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);
const detailVisible = ref(false);
const detailRow = ref<ChannelMidConfig | null>(null);
const formVisible = ref(false);
const formMode = ref<'create' | 'edit'>('create');
const formRef = ref<FormInstance>();
const channelOptions = ref<ChannelOption[]>([]);
const businessOptions = ref<SelectOption[]>([]);
const acquiringPaymentOptions = ref<SelectOption[]>([]);
const payoutPaymentOptions = ref<SelectOption[]>([]);
const cardBrandOptions = ref<SelectOption[]>([]);
const transactionTypeOptions = ref<SelectOption[]>([]);
const timezoneOptions = ref<SelectOption[]>([]);
const currencyOptions = ref<IsoCurrency[]>([]);
const countryOptions = ref<IsoCountry[]>([]);
const mccOptions = ref<MccOption[]>([]);
const capabilityOptions = ref<ChannelCapability[]>([]);
const metadataSchemas = ref<ChannelMetadataSchema[]>([]);
const midQueryOptions = ref<ChannelMidConfig[]>([]);

const query = reactive({
    channelId: undefined as number | undefined,
    channelMid: '',
    businessType: '',
    midStatus: undefined as number | undefined,
});

const emptyForm = (): MidFormState => ({
    id: 0,
    channelId: undefined,
    channelMid: '',
    terminalId: '',
    businessType: 'ACQUIRING',
    paymentScopes: [],
    currencyCodes: [],
    countryAll: true,
    countryCodes: [],
    defaultSettlementCurrency: 'USD',
    settlementDays: 1,
    settlementCutoffTime: '00:00:00',
    settlementTimeZone: 'Asia/Shanghai',
    mcc: '',
    statementDescriptor: '',
    metadataValues: {},
    midStatus: 1,
    effectiveTime: currentLocalDateTime(),
    expireTime: '',
    remark: '',
});
const form = reactive<MidFormState>(emptyForm());

const availableBusinessOptions = computed(() => {
    const channel = channelOptions.value.find((item) => item.id === form.channelId);
    if (!channel) {
        return businessOptions.value;
    }
    return businessOptions.value.filter((item) => {
        if (item.value === 'ACQUIRING') {
            return channel.supportAcquiring === 1;
        }
        if (item.value === 'PAYOUT') {
            return channel.supportPayout === 1;
        }
        return true;
    });
});

const paymentMethodOptions = computed(() => form.businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value);

const paymentScopeTree = computed<PaymentScopeNode[]>(() => capabilityOptions.value.map((item) => {
    const paymentLabel = optionLabel(paymentMethodOptions.value, item.paymentMethod);
    if (item.paymentMethod !== 'BANK_CARD') {
        return {
            label: paymentLabel,
            value: paymentMethodScopeValue(item.paymentMethod),
        };
    }
    return {
        label: paymentLabel,
        value: paymentMethodScopeValue(item.paymentMethod),
        disabled: true,
        children: (item.cardBrands || []).map((brand) => ({
            label: optionLabel(cardBrandOptions.value, brand),
            value: cardBrandScopeValue(brand),
        })),
    };
}));

const rules = computed<FormRules>(() => ({
    channelId: [{ required: true, message: t('channel.mid.requiredChannel'), trigger: 'change' }],
    channelMid: [{ required: true, message: t('channel.mid.requiredChannelMid'), trigger: 'blur' }],
    businessType: [{ required: true, message: t('channel.capability.requiredBusinessType'), trigger: 'change' }],
    paymentScopes: [{ type: 'array', required: true, min: 1, message: t('channel.mid.requiredPaymentMethodScope'), trigger: 'change' }],
    currencyCodes: [{ type: 'array', required: true, min: 1, message: t('channel.mid.requiredCurrencyScope'), trigger: 'change' }],
    countryCodes: [{ validator: validateCountryScope, trigger: 'change' }],
    defaultSettlementCurrency: [{ required: true, message: t('channel.mid.requiredDefaultSettlementCurrency'), trigger: 'change' }],
    settlementDays: [{ required: true, message: t('channel.mid.requiredSettlementCycle'), trigger: 'change' }],
    settlementTimeZone: [{ required: true, message: t('channel.mid.requiredSettlementTimeZone'), trigger: 'change' }],
    midStatus: [{ required: true, message: t('channel.info.requiredStatus'), trigger: 'change' }],
}));

onMounted(async () => {
    await Promise.all([loadOptions(), loadData()]);
});

watch(locale, () => {
    loadOptions();
});

async function loadOptions() {
    const [channels, business, acquiringMethods, payoutMethods, cardBrands, transactionTypes, timezones, currencies, countries, mcc, mids] = await Promise.all([
        loadChannelOptions(),
        loadDictOptions('channel_business_type', String(locale.value)),
        loadDictOptions('acquiring_payment_method', String(locale.value)),
        loadDictOptions('payout_payment_method', String(locale.value)),
        loadDictOptions('card_brand', String(locale.value)),
        loadDictOptions('transaction_type', String(locale.value)),
        loadDictOptions('sys_timezone', String(locale.value)),
        loadCurrencyOptions(),
        loadCountryOptions(),
        getMccOptions(),
        searchChannelMids({ pageNo: 1, pageSize: 500 }),
    ]);
    channelOptions.value = channels;
    businessOptions.value = business;
    acquiringPaymentOptions.value = acquiringMethods;
    payoutPaymentOptions.value = payoutMethods;
    cardBrandOptions.value = cardBrands;
    transactionTypeOptions.value = transactionTypes;
    timezoneOptions.value = timezones;
    currencyOptions.value = currencies;
    countryOptions.value = countries;
    mccOptions.value = mcc.mccCodes;
    midQueryOptions.value = mids.records;
}

async function loadCountryOptions() {
    const result = await searchCountries({ pageNo: 1, pageSize: 1000, status: 1 });
    return result.records.map((item) => ({ ...item, alpha3Code: normalizeCode(item.alpha3Code), alpha2Code: normalizeCode(item.alpha2Code) }));
}

async function loadData() {
    loading.value = true;
    try {
        const result = await searchChannelMids({ pageNo: page.value, pageSize: pageSize.value, ...query });
        rows.value = result.records;
        total.value = result.total;
    } finally {
        loading.value = false;
    }
}

function handleSearch() {
    page.value = 1;
    loadData();
}

function resetQuery() {
    query.channelId = undefined;
    query.channelMid = '';
    query.businessType = '';
    query.midStatus = undefined;
    handleSearch();
}

async function openDetail(row: ChannelMidConfig) {
    detailRow.value = await getChannelMid(row.id);
    await loadDisplayOptions(detailRow.value);
    detailVisible.value = true;
}

async function openForm(mode: 'create' | 'edit', row?: ChannelMidConfig) {
    formMode.value = mode;
    Object.assign(form, emptyForm());
    if (row) {
        await applyRowToForm(await getChannelMid(row.id));
    }
    formVisible.value = true;
    await nextTick();
    formRef.value?.clearValidate();
    if (!row && form.channelId) {
        await handleChannelChange();
    }
}

async function applyRowToForm(row: ChannelMidConfig) {
    form.id = row.id;
    form.channelId = row.channelId;
    form.channelMid = row.channelMid || '';
    form.terminalId = row.terminalId || '';
    form.businessType = row.businessType || 'ACQUIRING';
    form.paymentScopes = [];
    form.currencyCodes = splitScope(row.currencyScope);
    form.countryAll = row.allowedCountryScope === 'ALL';
    form.countryCodes = form.countryAll ? [] : splitScope(row.allowedCountryScope);
    form.defaultSettlementCurrency = row.defaultSettlementCurrency || 'USD';
    form.settlementDays = parseSettlementDays(row.settlementCycle);
    form.settlementCutoffTime = row.settlementCutoffTime || '00:00:00';
    form.settlementTimeZone = row.settlementTimeZone || 'Asia/Shanghai';
    form.mcc = row.mcc || '';
    form.statementDescriptor = row.statementDescriptor || '';
    form.metadataValues = parseMetadataValues(row.metadataValueJson);
    form.midStatus = row.midStatus;
    form.effectiveTime = row.effectiveTime || currentLocalDateTime();
    form.expireTime = row.expireTime || '';
    form.remark = row.remark || '';
    await loadChannelDependentOptions(false);
    form.paymentScopes = paymentScopesFromRow(row);
    syncPaymentScopesWithCapabilities();
}

async function handleChannelChange() {
    const channel = channelOptions.value.find((item) => item.id === form.channelId);
    if (!channel) {
        capabilityOptions.value = [];
        metadataSchemas.value = [];
        return;
    }
    if (form.businessType === 'ACQUIRING' && channel.supportAcquiring !== 1 && channel.supportPayout === 1) {
        form.businessType = 'PAYOUT';
    }
    if (form.businessType === 'PAYOUT' && channel.supportPayout !== 1 && channel.supportAcquiring === 1) {
        form.businessType = 'ACQUIRING';
    }
    await loadChannelDependentOptions(true);
}

async function handleBusinessTypeChange() {
    await loadChannelDependentOptions(true);
}

async function loadDisplayOptions(row: ChannelMidConfig) {
    const [channel, capabilities] = await Promise.all([
        getChannel(row.channelId),
        searchChannelCapabilities({
            pageNo: 1,
            pageSize: 500,
            channelId: row.channelId,
            businessType: row.businessType,
            capabilityStatus: 1,
        }),
    ]);
    metadataSchemas.value = (channel.metadataSchemas || [])
        .filter((item) => item.fieldStatus === 1)
        .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));
    capabilityOptions.value = capabilities.records;
}

async function loadChannelDependentOptions(resetPaymentMethods: boolean) {
    if (!form.channelId) {
        capabilityOptions.value = [];
        metadataSchemas.value = [];
        return;
    }
    const [channel, capabilities] = await Promise.all([
        getChannel(form.channelId),
        searchChannelCapabilities({
            pageNo: 1,
            pageSize: 500,
            channelId: form.channelId,
            businessType: form.businessType,
            capabilityStatus: 1,
        }),
    ]);
    metadataSchemas.value = (channel.metadataSchemas || [])
        .filter((item) => item.fieldStatus === 1)
        .sort((left, right) => (left.sortOrder || 0) - (right.sortOrder || 0));
    capabilityOptions.value = capabilities.records;
    if (resetPaymentMethods) {
        form.paymentScopes = defaultPaymentScopes();
        applyCapabilityCurrencyDefaults();
        applyMetadataDefaults();
    } else {
        syncPaymentScopesWithCapabilities();
    }
}

function syncPaymentScopesWithCapabilities() {
    const enabled = new Set(paymentScopeTree.value.flatMap((item) => [item.value, ...(item.children || []).map((child) => child.value)]));
    form.paymentScopes = form.paymentScopes.filter((item) => enabled.has(item));
}

function applyCapabilityCurrencyDefaults() {
    const codes = capabilityOptions.value.flatMap((item) => item.currencyCodes || []).map(normalizeCode);
    form.currencyCodes = Array.from(new Set(codes.length ? codes : form.currencyCodes));
    if (!form.defaultSettlementCurrency && form.currencyCodes.length) {
        form.defaultSettlementCurrency = form.currencyCodes[0];
    }
}

function applyMetadataDefaults() {
    const nextValues = { ...form.metadataValues };
    metadataSchemas.value.forEach((schema) => {
        if (!nextValues[schema.fieldKey] && schema.defaultValue && schema.sensitiveFlag !== 1) {
            nextValues[schema.fieldKey] = schema.defaultValue;
        }
        if (!(schema.fieldKey in nextValues)) {
            nextValues[schema.fieldKey] = '';
        }
    });
    form.metadataValues = nextValues;
}

function handleCountryAllChange(value: string | number | boolean) {
    if (Boolean(value)) {
        form.countryCodes = [];
    }
}

function handlePaymentScopeChange() {
    form.paymentScopes = normalizePaymentScopes(form.paymentScopes);
}

async function submitForm() {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) {
        return;
    }
    if (!validateTimeRange() || !validateMetadataBySchema()) {
        return;
    }
    const payload = buildPayload();
    try {
        if (formMode.value === 'create') {
            await createChannelMid(payload);
        } else {
            await updateChannelMid(form.id, payload);
        }
    } catch (error) {
        await showChannelError(error, t('common.saveFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.saveSuccess'));
    formVisible.value = false;
    loadData();
}

function buildPayload(): Partial<ChannelMidConfig> {
    return {
        id: form.id,
        channelId: form.channelId,
        channelMid: form.channelMid,
        terminalId: blankToUndefined(form.terminalId),
        businessType: form.businessType,
        paymentMethodScope: joinScope(selectedPaymentMethods()),
        cardBrandScope: joinScope(selectedCardBrands()),
        transactionTypeScope: deriveTransactionTypeScope(),
        currencyScope: joinScope(form.currencyCodes),
        allowedCountryScope: form.countryAll ? 'ALL' : joinScope(form.countryCodes),
        defaultSettlementCurrency: normalizeCode(form.defaultSettlementCurrency),
        settlementCycle: `T+${form.settlementDays || 0}`,
        settlementCutoffTime: blankToUndefined(form.settlementCutoffTime),
        settlementTimeZone: form.settlementTimeZone,
        mcc: blankToUndefined(form.mcc),
        statementDescriptor: blankToUndefined(form.statementDescriptor),
        metadataValueJson: buildMetadataJson(),
        midStatus: form.midStatus,
        effectiveTime: blankToUndefined(form.effectiveTime),
        expireTime: blankToUndefined(form.expireTime),
        remark: blankToUndefined(form.remark),
    };
}

async function toggleStatus(row: ChannelMidConfig) {
    const nextStatus = row.midStatus === 1 ? 0 : 1;
    const action = nextStatus === 1 ? t('common.enable') : t('common.disable');
    try {
        await ElMessageBox.confirm(t('common.statusToggleConfirm', { action, name: midTargetName(row) }), t('common.operationConfirm'), { type: nextStatus === 1 ? 'success' : 'warning' });
    } catch {
        return;
    }
    try {
        await updateChannelMidStatus(row.id, nextStatus);
    } catch (error) {
        await showChannelError(error, t('common.operationFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.operationSuccess'));
    loadData();
}

async function handleDelete(target?: ChannelMidConfig | ChannelMidConfig[]) {
    const targets = Array.isArray(target) ? target : (target ? [target] : []);
    if (!targets.length) {
        return;
    }
    try {
        await ElMessageBox.confirm(t('channel.mid.deleteConfirm', { name: targets.map((item) => item.channelMid).join('、') }), t('channel.common.delete'), { type: 'warning' });
    } catch {
        return;
    }
    try {
        await Promise.all(targets.map((item) => deleteChannelMid(item.id)));
    } catch (error) {
        await showChannelError(error, t('common.deleteFailed'), t('common.saveFailed'));
        return;
    }
    ElMessage.success(t('channel.common.deleteSuccess'));
    loadData();
}

function validateCountryScope(_rule: unknown, _value: string[], callback: (error?: Error) => void) {
    if (!form.countryAll && !form.countryCodes.length) {
        callback(new Error(t('channel.mid.requiredAllowedCountryScope')));
        return;
    }
    callback();
}

function validateTimeRange() {
    if (form.effectiveTime && form.expireTime && form.effectiveTime > form.expireTime) {
        ElMessage.error(t('channel.mid.invalidTimeRange'));
        return false;
    }
    return true;
}

function validateMetadataBySchema() {
    for (const schema of metadataSchemas.value) {
        const value = form.metadataValues[schema.fieldKey];
        if (schema.requiredFlag === 1 && !String(value || '').trim()) {
            ElMessage.error(t('channel.mid.requiredMetadataField', { field: schema.fieldLabel || schema.fieldKey }));
            return false;
        }
        if (schema.validationRegex && String(value || '').trim()) {
            try {
                if (!new RegExp(schema.validationRegex).test(String(value))) {
                    ElMessage.error(t('channel.mid.invalidMetadataField', { field: schema.fieldLabel || schema.fieldKey }));
                    return false;
                }
            } catch {
                return true;
            }
        }
    }
    return true;
}

function parseMetadataValues(value?: string) {
    if (!value) {
        return {};
    }
    try {
        return JSON.parse(value) as Record<string, string>;
    } catch {
        return {};
    }
}

function buildMetadataJson() {
    const values: Record<string, string> = {};
    metadataSchemas.value.forEach((schema) => {
        const value = String(form.metadataValues[schema.fieldKey] || '').trim();
        if (value || schema.requiredFlag === 1) {
            values[schema.fieldKey] = value;
        }
    });
    return Object.keys(values).length ? JSON.stringify(values) : undefined;
}

function splitScope(value?: string) {
    const text = String(value || '').trim();
    if (!text || text.toUpperCase() === 'ALL') {
        return [];
    }
    return text.split(',').map((item) => normalizeCode(item)).filter(Boolean);
}

function joinScope(values: string[]) {
    return values.map(normalizeCode).filter(Boolean).join(',');
}

function deriveTransactionTypeScope() {
    const selected = new Set(selectedPaymentMethods());
    const transactionTypes = capabilityOptions.value
        .filter((item) => selected.has(item.paymentMethod))
        .flatMap(capabilityTransactionTypes)
        .map(normalizeCode)
        .filter(Boolean);
    return Array.from(new Set(transactionTypes)).join(',') || 'NONE';
}

function defaultPaymentScopes() {
    return normalizePaymentScopes(capabilityOptions.value.flatMap((item) => item.paymentMethod === 'BANK_CARD'
        ? (item.cardBrands || []).map(cardBrandScopeValue)
        : [paymentMethodScopeValue(item.paymentMethod)]));
}

function paymentScopesFromRow(row: ChannelMidConfig) {
    const paymentMethods = splitScope(row.paymentMethodScope);
    const cardBrands = splitScope(row.cardBrandScope);
    const values = paymentMethods.flatMap((method) => {
        if (method === 'BANK_CARD') {
            return cardBrands.length && !cardBrands.includes('ALL') && !cardBrands.includes('NONE')
                ? cardBrands.map(cardBrandScopeValue)
                : supportedCardBrands().map(cardBrandScopeValue);
        }
        return [paymentMethodScopeValue(method)];
    });
    return normalizePaymentScopes(values);
}

function normalizePaymentScopes(values: string[]) {
    const selected = new Set(values);
    const normalized: string[] = [];
    paymentScopeTree.value.forEach((node) => {
        const children = node.children || [];
        if (children.length) {
            children.forEach((child) => {
                if (selected.has(child.value)) {
                    normalized.push(child.value);
                }
            });
        } else if (selected.has(node.value)) {
            normalized.push(node.value);
        }
    });
    return Array.from(new Set(normalized));
}

function selectedPaymentMethods() {
    const methods = new Set<string>();
    form.paymentScopes.forEach((value) => {
        const parsed = parsePaymentScopeValue(value);
        if (parsed.type === 'CARD_BRAND') {
            methods.add('BANK_CARD');
        }
        if (parsed.type === 'PAYMENT_METHOD') {
            methods.add(parsed.value);
        }
    });
    return Array.from(methods);
}

function selectedCardBrands() {
    const brands = form.paymentScopes
        .map(parsePaymentScopeValue)
        .filter((item) => item.type === 'CARD_BRAND')
        .map((item) => item.value);
    return brands.length ? Array.from(new Set(brands)) : ['NONE'];
}

function supportedCardBrands() {
    return capabilityOptions.value.find((item) => item.paymentMethod === 'BANK_CARD')?.cardBrands || [];
}

function paymentMethodScopeValue(value: string) {
    return `PM:${value}`;
}

function cardBrandScopeValue(value: string) {
    return `CARD:${value}`;
}

function parsePaymentScopeValue(value: string) {
    if (value.startsWith('CARD:')) {
        return { type: 'CARD_BRAND', value: value.slice(5) };
    }
    if (value.startsWith('PM:')) {
        return { type: 'PAYMENT_METHOD', value: value.slice(3) };
    }
    return { type: 'PAYMENT_METHOD', value };
}

function capabilityTransactionTypes(item: ChannelCapability) {
    if (Array.isArray(item.transactionTypes) && item.transactionTypes.length) {
        return item.transactionTypes;
    }
    return splitScope(item.transactionType);
}

function parseSettlementDays(value?: string) {
    const text = String(value || 'T+1').toUpperCase().replace(/\s/g, '');
    const match = text.match(/^T\+?(\d+)$/);
    return match ? Number(match[1]) : 1;
}

function paymentScopeText(row: Pick<ChannelMidConfig, 'businessType' | 'paymentMethodScope' | 'cardBrandScope'>) {
    const paymentMethods = splitScope(row.paymentMethodScope);
    if (!paymentMethods.length) {
        return '-';
    }
    return paymentMethods.map((method) => {
        if (method !== 'BANK_CARD') {
            return optionLabel(paymentOptionsFor(row.businessType), method);
        }
        const brands = splitScope(row.cardBrandScope).filter((brand) => brand !== 'NONE');
        const brandText = brands.length
            ? brands.map((brand) => optionLabel(cardBrandOptions.value, brand)).join(', ')
            : t('channel.mid.allScope');
        return `${optionLabel(paymentOptionsFor(row.businessType), method)} / ${brandText}`;
    }).join('；');
}

function transactionScopeItems(scope?: string) {
    return splitScope(scope).map((value) => ({
        value,
        label: optionLabel(transactionTypeOptions.value, value),
    }));
}

function midQueryOptionLabel(item: ChannelMidConfig) {
    return `${item.channelMid} / ${item.channelCode}`;
}

function paymentScopeLogo(row: Pick<ChannelMidConfig, 'businessType' | 'paymentMethodScope' | 'cardBrandScope'>): PaymentLogoKey[] {
    return splitScope(row.paymentMethodScope).flatMap((method) => {
        if (method === 'BANK_CARD') {
            const brands = splitScope(row.cardBrandScope).filter((brand) => brand !== 'NONE');
            return brands.length
                ? brands.flatMap((brand) => cardLogoKeys(brand, cardBrandOptions.value.find((item) => item.value === brand)))
                : supportedCardBrands().flatMap((brand) => cardLogoKeys(brand, cardBrandOptions.value.find((item) => item.value === brand)));
        }
        return paymentLogoKeys(method, paymentOptionsFor(row.businessType).find((item) => item.value === method));
    });
}

function paymentOptionsFor(businessType?: string) {
    return businessType === 'PAYOUT' ? payoutPaymentOptions.value : acquiringPaymentOptions.value;
}

function currencyScopeText(value?: string) {
    if (value === 'ALL') {
        return t('channel.mid.allScope');
    }
    return splitScope(value).map(currencyLabel).join(', ') || '-';
}

function countryScopeText(value?: string) {
    if (value === 'ALL') {
        return t('channel.mid.allCountries');
    }
    return splitScope(value).map(countryLabel).join(', ') || '-';
}

function currencyLabel(value?: string) {
    if (!value) {
        return '-';
    }
    const option = currencyOptions.value.find((item) => item.alpha3Code === value);
    return option ? currencyOptionLabel(option) : value;
}

function countryLabel(value?: string) {
    if (!value) {
        return '-';
    }
    const option = countryOptions.value.find((item) => item.alpha3Code === value);
    return option ? countryOptionLabel(option) : value;
}

function countryOptionLabel(option: IsoCountry) {
    const name = option.chineseName || option.englishName;
    return name ? `${option.alpha3Code} (${name})` : option.alpha3Code;
}

function mccOptionLabel(option: MccOption) {
    return option.label || `${option.code} ${option.nameCn || option.nameEn || ''}`.trim();
}

function mccLabel(value?: string) {
    if (!value) {
        return '-';
    }
    const option = mccOptions.value.find((item) => item.code === value);
    return option ? mccOptionLabel(option) : value;
}

function metadataRowsForDetail(row: ChannelMidConfig) {
    const values = parseMetadataValues(row.metadataValueJson);
    const schemaKeys = new Set(metadataSchemas.value.map((item) => item.fieldKey));
    const schemaRows = metadataSchemas.value
        .filter((schema) => values[schema.fieldKey] !== undefined && values[schema.fieldKey] !== null && String(values[schema.fieldKey]).trim())
        .map((schema) => ({
            key: schema.fieldKey,
            label: schema.fieldLabel || schema.fieldKey,
            value: String(values[schema.fieldKey]),
        }));
    const extraRows = Object.entries(values)
        .filter(([key, value]) => !schemaKeys.has(key) && value !== undefined && value !== null && String(value).trim())
        .map(([key, value]) => ({
            key,
            label: key,
            value: String(value),
        }));
    return [...schemaRows, ...extraRows];
}

function metadataPlaceholder(schema: ChannelMetadataSchema) {
    if (formMode.value === 'edit' && schema.sensitiveFlag === 1) {
        return t('channel.mid.metadataKeepPlaceholder');
    }
    return schema.placeholder || '';
}

function isLongMetadata(fieldType?: string) {
    return ['JSON', 'TEXTAREA', 'PRIVATE_KEY', 'PUBLIC_KEY', 'CERTIFICATE'].includes(String(fieldType || '').toUpperCase());
}

function metadataInputRows(fieldType?: string) {
    return ['PRIVATE_KEY', 'PUBLIC_KEY', 'CERTIFICATE'].includes(String(fieldType || '').toUpperCase()) ? 6 : 4;
}

function blankToUndefined(value?: string) {
    const trimmed = String(value || '').trim();
    return trimmed || undefined;
}

function normalizeCode(value?: string) {
    return String(value || '').trim().toUpperCase();
}

function currentLocalDateTime() {
    const date = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function midTargetName(row: ChannelMidConfig) {
    return row.channelMid;
}
</script>

<style scoped>
.mid-form {
    max-width: 1080px;
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

.form-grid :deep(.el-form-item) {
    align-self: start;
}

.form-item--full {
    width: 100%;
}

.form-item--full :deep(.el-form-item__content) {
    width: 100%;
}

.metadata-grid {
    display: grid;
    grid-template-columns: 1fr;
}

.country-form-item :deep(.el-form-item__content) {
    align-items: flex-start;
    gap: 6px;
}

.inline-hint {
    width: 100%;
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.3;
}

.payment-scope-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    line-height: 1.35;
}

.payment-scope-cell--detail {
    align-items: flex-start;
}

.tag-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
}

.tag-list-left {
    justify-content: flex-start;
}

.mid-detail {
    display: grid;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
}

.mid-detail__item {
    display: grid;
    grid-template-columns: 150px minmax(0, 1fr);
    min-height: 44px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.mid-detail__item:last-child {
    border-bottom: 0;
}

.mid-detail__label {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-regular);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    word-break: keep-all;
}

.mid-detail__value {
    min-width: 0;
    padding: 10px 12px;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.6;
    overflow-wrap: anywhere;
}

.mid-detail__item--block .mid-detail__value {
    padding: 8px;
}

.metadata-detail {
    display: grid;
    gap: 8px;
}

.metadata-detail__row {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
}

.metadata-detail__key {
    padding: 8px 10px;
    background: var(--el-fill-color-lighter);
    color: var(--el-text-color-regular);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.metadata-detail__value {
    min-width: 0;
    padding: 8px 10px;
    color: var(--el-text-color-primary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 12px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
}

.metadata-tag {
    margin-left: 6px;
}

@media (max-width: 760px) {
    .form-grid,
    .metadata-grid {
        grid-template-columns: 1fr;
    }

    .mid-detail__item {
        grid-template-columns: 112px minmax(0, 1fr);
    }

    .metadata-detail__row {
        grid-template-columns: 1fr;
    }
}
</style>
