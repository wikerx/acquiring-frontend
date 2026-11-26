<template>
    <div v-if="user.hasPermission(permissions.list)" class="app-container">
        <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="mb8">
            <el-button text type="primary" @click="applySearch">{{ t('alertConfig.retry') }}</el-button>
        </el-alert>
        <el-tabs v-model="activeTab">
            <el-tab-pane :label="t('alertConfig.platforms')" name="platform" />
            <el-tab-pane :label="t('alertConfig.accounts')" name="account" />
        </el-tabs>

        <el-form v-show="showSearch" class="search-form" :inline="true" size="small" @submit.prevent="applySearch">
            <el-form-item :label="t('alertConfig.platform')">
                <AlertPlatformSelect v-model="query.platformCode" :platforms="platforms" clearable />
            </el-form-item>
            <el-form-item :label="t('alertConfig.product')">
                <el-select v-model="query.product" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="product in products" :key="product" :label="productLabel(product)" :value="product">
                        <AlertProductDisplay :product="product" />
                    </el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-if="activeTab === 'platform'" :label="t('alertConfig.platformType')">
                <el-select v-model="query.type" :placeholder="t('common.pleaseSelect')" clearable>
                    <el-option v-for="type in platformTypes" :key="type" :label="platformTypeLabel(type)" :value="type" />
                </el-select>
            </el-form-item>
            <el-form-item v-else :label="t('alertConfig.accountIdentifier')">
                <el-input v-model.trim="query.accountIdentifier" :placeholder="t('common.pleaseInput')" clearable />
            </el-form-item>
            <el-form-item>
                <el-button type="primary" size="small" :icon="Search" native-type="submit">{{ t('common.search') }}</el-button>
                <el-button size="small" :icon="Refresh" @click="resetSearch">{{ t('common.reset') }}</el-button>
            </el-form-item>
        </el-form>

        <el-row class="mb8" :gutter="10">
            <el-col v-if="activeTab === 'platform' && user.hasPermission(permissions.add)" :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="openPlatform()">{{ t('alertConfig.addPlatform') }}</el-button>
            </el-col>
            <el-col v-if="activeTab === 'account' && user.hasPermission(permissions.account)" :span="1.5">
                <el-button type="primary" plain :icon="Plus" size="small" @click="openAccount()">{{ t('alertConfig.addAccount') }}</el-button>
            </el-col>
            <el-col class="right-toolbar">
                <RightToolbar @toggle-search="showSearch = !showSearch" @refresh="applySearch" />
            </el-col>
        </el-row>

        <section v-if="activeTab === 'platform'">
            <StandardTable v-loading="platformsLoading" table-key="channel-alert-platform" :data="filteredPlatforms" row-key="code" size="small"
                :non-stretch-columns="['evidence']" :empty-text="t('alertConfig.noRecords')">
                <el-table-column prop="logo" :label="t('alertConfig.logoColumn')" width="64" align="center" fixed="left">
                    <template #default="{ row }">
                        <PrivateImage v-if="row.logoVersion" class="platform-list-logo" :version="row.logoVersion" :load="() => loadPlatformLogo(row)"
                            :alt="t('alertConfig.platformLogo')" preview />
                        <span v-else>—</span>
                    </template>
                </el-table-column>
                <el-table-column prop="name" :label="t('alertConfig.platformName')" min-width="130" align="center">
                    <template #default="{ row }"><span class="platform-identifier">{{ row.name }}</span></template>
                </el-table-column>
                <el-table-column prop="code" :label="t('alertConfig.platformCode')" min-width="124" align="center" class-name="platform-code-cell">
                    <template #default="{ row }"><span class="platform-identifier">{{ row.code }}</span></template>
                </el-table-column>
                <el-table-column prop="type" :label="t('alertConfig.platformType')" min-width="104" align="center">
                    <template #default="{ row }">{{ platformTypeLabel(row.type) }}</template>
                </el-table-column>
                <el-table-column prop="products" :label="t('alertConfig.supportedProducts')" width="220" min-width="220" align="center" class-name="platform-products-cell">
                    <template #default="{ row }">
                        <div class="tag-list">
                            <AlertProductDisplay v-for="item in row.products" :key="item.product" :product="item.product" compact />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="cardBrands" :label="t('alertConfig.supportedCardBrands')" width="165" min-width="165" align="center">
                    <template #default="{ row }">
                        <ChannelPaymentScopeDisplay :entries="platformCardBrands(row)" :preview-limit="3"
                            :label="t('alertConfig.supportedCardBrands')" :empty-text="row.products.length ? '' : '—'" />
                        <div v-for="label in pendingCoverageLabels(row)" :key="label" class="configuration-hint coverage-note">{{ label }}</div>
                    </template>
                </el-table-column>
                <el-table-column prop="enabled" :label="t('common.status')" width="60" align="center">
                    <template #default="{ row }">
                        <el-switch v-if="user.hasPermission(permissions.edit)" :model-value="row.enabled" size="small" :disabled="statusConfirming"
                            :aria-label="t('alertConfig.platformStatus', { name: row.name })"
                            :title="statusLabel(row.enabled ? 'ENABLED' : 'DISABLED')" @change="togglePlatformStatus(row)" />
                        <el-tag v-else :type="row.enabled ? 'success' : 'info'" size="small">{{ statusLabel(row.enabled ? 'ENABLED' : 'DISABLED') }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="evidence" :label="t('alertConfig.evidenceColumn')" width="72" min-width="72" align="center" show-overflow-tooltip>
                    <template #default="{ row }">{{ row.evidence || '—' }}</template>
                </el-table-column>
                <el-table-column prop="operations" :label="t('common.operation')" width="196" align="center" fixed="right">
                    <template #default="{ row }">
                        <el-button link type="primary" size="small" @click="showAccounts(row)">{{ t('alertConfig.openAccounts') }}</el-button>
                        <template v-if="user.hasPermission(permissions.edit)">
                            <el-button link type="primary" size="small" :icon="Edit" @click="openPlatform(row)">{{ t('common.edit') }}</el-button>
                            <el-button link type="primary" size="small" :disabled="statusConfirming" @click="togglePlatformStatus(row)">
                                {{ t(row.enabled ? 'common.disable' : 'common.enable') }}
                            </el-button>
                        </template>
                    </template>
                </el-table-column>
            </StandardTable>
            <AlertPlatformGuide />
        </section>

        <StandardTable v-else v-loading="accountsLoading" table-key="channel-alert-platform-account" :data="filteredAccounts" row-key="id" size="small" :empty-text="t('alertConfig.noRecords')">
            <el-table-column prop="platformCode" :label="t('alertConfig.platform')" width="150" align="center" fixed="left">
                <template #default="{ row }"><AlertPlatformIdentity :platform="findPlatform(row.platformCode)" :fallback="row.platformCode" /></template>
            </el-table-column>
            <el-table-column prop="merchantNumber" :label="t('alertConfig.accountIdentifier')" width="145" min-width="135" align="center" show-overflow-tooltip />
            <el-table-column prop="product" :label="t('alertConfig.accountProducts')" min-width="260" align="center">
                <template #default="{ row }">
                    <div class="tag-list">
                        <span v-for="item in accountProductAvailability(row)" :key="item.product" class="account-product-state" role="group"
                            :aria-label="t('alertConfig.productStatus', { product: productLabel(item.product), status: item.label })">
                            <AlertProductDisplay :product="item.product" compact />
                            <el-tag :type="item.type" effect="plain" size="small">{{ item.label }}</el-tag>
                        </span>
                    </div>
                    <div v-if="accountAvailabilityNote(row)" class="configuration-hint coverage-note">{{ accountAvailabilityNote(row) }}</div>
                </template>
            </el-table-column>
            <el-table-column prop="transport" :label="t('alertConfig.transport')" min-width="106" align="center">
                <template #default="{ row }">{{ deliverySummary(row) }}</template>
            </el-table-column>
            <el-table-column v-if="user.hasPermission(permissions.credential)" prop="credential" :label="t('alertConfig.credentials')" min-width="145" align="center">
                <template #default="{ row }">
                    <span v-if="row.platformCode === SHIELD_PLATFORM">{{ shieldCredentialSummary(row) }}</span>
                    <span v-else-if="row.providerConfig?.registered.length">
                        {{ t('alertConfig.credentialCount', { count: row.providerConfig.registered.length }) }}
                    </span>
                    <span v-else>—</span>
                </template>
            </el-table-column>
            <el-table-column prop="status" :label="t('alertConfig.accountStateColumn')" width="94" align="center">
                <template #default="{ row }">
                    <template v-if="user.hasPermission(permissions.account)">
                        <el-switch :model-value="row.status === 'ENABLED'" size="small" :disabled="statusConfirming"
                            :aria-label="t('alertConfig.accountStatus', { name: row.merchantNumber })" :title="statusLabel(row.status)"
                            @change="toggleAccountStatus(row)" />
                        <div v-if="row.status === 'DRAFT'" class="configuration-hint">{{ statusLabel(row.status) }}</div>
                    </template>
                    <el-tag v-else :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
                </template>
            </el-table-column>
            <el-table-column prop="operations" :label="t('common.operation')" width="156" align="center" fixed="right">
                <template #default="{ row }">
                    <template v-if="user.hasPermission(permissions.account)">
                        <el-button link type="primary" size="small" :icon="Edit" @click="openAccount(row)">{{ t('alertConfig.maintain') }}</el-button>
                        <el-button link type="primary" size="small" :disabled="statusConfirming" @click="toggleAccountStatus(row)">
                            {{ t(row.status === 'ENABLED' ? 'common.disable' : 'common.enable') }}
                        </el-button>
                    </template>
                    <span v-else>—</span>
                </template>
            </el-table-column>
        </StandardTable>

        <div v-if="activeTab === 'account' && accountTotal" class="pagination-container">
            <el-pagination v-model:current-page="accountPage" :page-size="20" :total="accountTotal"
                layout="total, prev, pager, next" background @current-change="loadAccounts" />
        </div>

        <el-drawer v-model="platformVisible" :title="t(platformEditing ? 'alertConfig.editPlatform' : 'alertConfig.addPlatform')" size="min(760px, 96vw)" append-to-body destroy-on-close class="app-form-drawer"
            :close-on-click-modal="!platformSaving" :close-on-press-escape="!platformSaving" :show-close="!platformSaving">
            <el-form ref="platformFormRef" label-position="top" :model="platformForm" :disabled="platformSaving" @submit.prevent="submitPlatform">
                <div class="form-grid">
                    <el-form-item :label="t('alertConfig.platformCode')" prop="code" :error="platformErrors.code" required>
                        <el-input v-model.trim="platformForm.code" :validate-event="false" :disabled="platformEditing" maxlength="32" @input="delete platformErrors.code" />
                    </el-form-item>
                    <el-form-item :label="t('alertConfig.platformName')" prop="name" :error="platformErrors.name" required>
                        <el-input v-model.trim="platformForm.name" :validate-event="false" maxlength="80" @input="delete platformErrors.name" />
                    </el-form-item>
                    <el-form-item :label="t('alertConfig.platformType')" prop="type" :error="platformErrors.type" required>
                        <el-select v-model="platformForm.type" :validate-event="false" :placeholder="t('common.pleaseSelect')" @change="delete platformErrors.type">
                            <el-option v-for="type in platformTypes" :key="type" :label="platformTypeLabel(type)" :value="type" />
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('common.status')">
                        <el-select v-model="platformForm.enabled">
                            <el-option :value="true" :label="t('alertConfig.status.ENABLED')" />
                            <el-option :value="false" :label="t('alertConfig.status.DISABLED')" />
                        </el-select>
                    </el-form-item>
                </div>
                <el-form-item :label="t('alertConfig.supportedProducts')" prop="products" :error="platformErrors.products" required>
                    <el-select v-model="selectedPlatformProducts" :validate-event="false" multiple filterable :reserve-keyword="false" :placeholder="t('common.pleaseSelect')">
                        <el-option v-for="product in products" :key="product" :label="productLabel(product)" :value="product">
                            <AlertProductDisplay :product="product" />
                        </el-option>
                    </el-select>
                </el-form-item>
                <div v-if="platformForm.products.length" class="product-brand-fields">
                    <el-form-item v-for="item in platformForm.products" :key="item.product" :prop="cardBrandField(item.product)"
                        :label="t('alertConfig.productCardBrands', { product: productLabel(item.product) })" :error="platformErrors[cardBrandField(item.product)]"
                        class="product-brand-field">
                        <el-select v-model="item.cardBrands" :validate-event="false" multiple filterable :reserve-keyword="false" :loading="cardBrandsLoading"
                            :placeholder="t('alertConfig.coveragePending')" @change="updateCardBrandCoverage(item)">
                            <template #label="{ value }">
                                <span class="brand-option">
                                    <PaymentLogoGroup :keys="cardBrandPresentation(String(value)).logoKeys" aria-hidden="true" fallback="text" size="sm" :wrap="false" />
                                    <span>{{ cardBrandPresentation(String(value)).label }}</span>
                                </span>
                            </template>
                            <el-option v-for="brand in formBrandOptions(item)" :key="brand.value" :label="brand.label" :value="brand.value">
                                <span class="brand-option">
                                    <PaymentLogoGroup :keys="brand.logoKeys" aria-hidden="true" fallback="text" size="sm" :wrap="false" />
                                    <span>{{ brand.label }}</span>
                                </span>
                            </el-option>
                        </el-select>
                        <div v-if="cardBrandsFailed" class="dictionary-error">
                            <span>{{ t('alertConfig.cardBrandsUnavailable') }}</span>
                            <el-button link type="primary" :loading="cardBrandsLoading" @click="loadCardBrands">{{ t('alertConfig.retry') }}</el-button>
                        </div>
                    </el-form-item>
                </div>
                <el-form-item :label="t('alertConfig.evidence')">
                    <el-input v-model.trim="platformForm.evidence" maxlength="250" :placeholder="t('alertConfig.evidencePlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('alertConfig.platformLogo')" prop="logo">
                    <ImagePicker v-model="platformLogoFile" v-model:removed="platformLogoRemoved" :version="platformForm.logoVersion"
                        :load="() => loadPlatformLogo(platformForm)" :processing="platformSaving" :error-message="platformErrors.logo"
                        @update:model-value="delete platformErrors.logo" @update:removed="delete platformErrors.logo" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <el-button type="primary" :loading="platformSaving" @click="submitPlatform">{{ t('common.save') }}</el-button>
                    <el-button :disabled="platformSaving" @click="platformVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-drawer>

        <el-drawer v-model="accountVisible" :title="t(accountEditing ? 'alertConfig.editAccount' : 'alertConfig.addAccount')" size="min(840px, 96vw)" append-to-body destroy-on-close class="app-form-drawer" @close="clearCredentialInputs"
            :close-on-click-modal="!accountSubmitting" :close-on-press-escape="!accountSubmitting" :show-close="!accountSubmitting">
            <el-form ref="accountFormRef" v-loading="accountSubmitting" label-position="top" :model="accountForm" :disabled="accountSubmitting" @submit.prevent="submitAccount">
                <el-alert v-if="accountSaveError" :title="accountSaveError" type="error" :closable="false" class="mb8" />
                <div v-if="accountEditing" class="account-context">
                    <el-descriptions :column="1" size="small" border>
                        <el-descriptions-item :label="t('alertConfig.platform')"><AlertPlatformIdentity :platform="selectedPlatform" :fallback="accountForm.platformCode" compact /></el-descriptions-item>
                    </el-descriptions>
                </div>
                <el-form-item v-else :label="t('alertConfig.platform')" prop="platformCode" :error="accountErrors.platformCode" required>
                    <AlertPlatformSelect v-model="accountForm.platformCode" :validate-event="false" :platforms="activePlatforms" @update:model-value="changePlatform" />
                </el-form-item>

                <ProviderAccountForm v-if="managedProvider && selectedPlatform" ref="providerAccountRef" :key="managedProvider"
                    :code="managedProvider" :platform="selectedPlatform" :initial-identifier="accountForm.merchantNumber"
                    :initial-products="accountForm.products" :existing="savedAccount?.providerConfig"
                    :can-maintain-credentials="user.hasPermission(permissions.credential)" @save="submitProviderAccount" />
                <template v-else-if="accountForm.platformCode">
                    <section v-if="isShield" aria-labelledby="shield-account-heading" class="configuration-section">
                        <h3 id="shield-account-heading">{{ t('alertConfig.shieldCredentials') }}</h3>
                        <el-form-item :label="t('alertConfig.merchantNumber')" prop="merchantId" :error="accountErrors.merchantId" required>
                            <el-input v-model.trim="accountForm.merchantNumber" :validate-event="false" maxlength="80" autocomplete="off" :disabled="Boolean(savedAccount?.credentials.version)" @input="delete accountErrors.merchantId" />
                        </el-form-item>
                        <template v-if="user.hasPermission(permissions.credential)">
                            <el-form-item :label="t('alertConfig.publicKey')" prop="publicKey" :error="accountErrors.publicKey" :required="!savedAccount?.credentials.publicKeyRegistered">
                                <el-input v-model="publicKeyInput" :validate-event="false" type="textarea" :rows="3" maxlength="16384" autocomplete="off" spellcheck="false"
                                    :placeholder="credentialPlaceholder(savedAccount?.credentials.publicKeyRegistered)" @input="delete accountErrors.publicKey" />
                            </el-form-item>
                            <el-form-item :label="t('alertConfig.privateKey')" prop="privateKey" :error="accountErrors.privateKey" :required="!savedAccount?.credentials.privateKeyRegistered">
                                <el-input v-model="privateKeyInput" :validate-event="false" type="textarea" class="masked-key-input" :rows="3" maxlength="16384" autocomplete="off" spellcheck="false"
                                    :placeholder="credentialPlaceholder(savedAccount?.credentials.privateKeyRegistered)" @input="delete accountErrors.privateKey" />
                            </el-form-item>
                            <p class="configuration-hint">{{ t('alertConfig.credentialWriteNotice') }}</p>
                        </template>
                        <el-form-item v-else prop="credentials" :error="accountErrors.credentials">
                            <el-alert :title="t('alertConfig.noCredentialPermission')" type="info" :closable="false" />
                        </el-form-item>
                    </section>

                    <el-form-item v-else :label="t('alertConfig.accountIdentifier')" prop="merchantId" :error="accountErrors.merchantId" required>
                        <el-input v-model.trim="accountForm.merchantNumber" :validate-event="false" maxlength="80" @input="delete accountErrors.merchantId" />
                    </el-form-item>

                    <section class="configuration-section">
                        <el-form-item :label="t('alertConfig.accountProducts')" prop="products" :error="accountErrors.products" required>
                            <el-select v-model="selectedAccountProducts" :validate-event="false" multiple filterable :reserve-keyword="false" :placeholder="t('common.pleaseSelect')">
                                <el-option v-for="item in selectedPlatform?.products || []" :key="item.product" :label="productLabel(item.product)" :value="item.product"
                                    :disabled="savedAccount?.products.some(({ product }) => product === item.product)">
                                    <AlertProductDisplay :product="item.product" />
                                </el-option>
                            </el-select>
                        </el-form-item>
                        <div v-for="item in accountForm.products" :key="item.product" class="account-product">
                            <div class="account-product__summary">
                                <div class="account-product__identity">
                                    <AlertProductDisplay :product="item.product" />
                                    <el-tag :type="statusType(item.status)" size="small">{{ statusLabel(item.status) }}</el-tag>
                                </div>
                                <el-button link type="primary" size="small"
                                    :aria-label="t('alertConfig.toggleAccountProduct', { action: productAction(item), product: productLabel(item.product) })"
                                    @click="toggleProductStatus(item)">
                                    {{ productAction(item) }}
                                </el-button>
                            </div>
                            <el-collapse>
                                <el-collapse-item :name="item.product" :title="t('alertConfig.productDetails', { product: productLabel(item.product) })">
                                    <div class="form-grid">
                                        <el-form-item :label="t('alertConfig.transport')">
                                            <el-select v-model="item.delivery.transport">
                                                <el-option v-for="transport in transports" :key="transport" :label="t('alertConfig.transportLabel.' + transport)" :value="transport" />
                                            </el-select>
                                        </el-form-item>
                                        <template v-if="!isShield">
                                            <template v-if="item.delivery.transport === 'HTTPS'">
                                                <el-form-item :label="t('alertConfig.sourceAuthentication')">
                                                    <el-input v-model.trim="item.delivery.sourceAuthentication" maxlength="80" />
                                                </el-form-item>
                                                <el-form-item :label="t('alertConfig.outcomeUrl')">
                                                    <el-input v-model.trim="item.delivery.outcomeUrl" maxlength="250" />
                                                </el-form-item>
                                            </template>
                                            <template v-else>
                                                <el-form-item :label="t('alertConfig.host')">
                                                    <el-input v-model.trim="item.delivery.host" maxlength="120" />
                                                </el-form-item>
                                                <el-form-item :label="t('alertConfig.directory')">
                                                    <el-input v-model.trim="item.delivery.directory" maxlength="120" />
                                                </el-form-item>
                                                <el-form-item :label="t('alertConfig.schedule')">
                                                    <el-input v-model.trim="item.delivery.schedule" maxlength="120" />
                                                </el-form-item>
                                            </template>
                                        </template>
                                    </div>
                                </el-collapse-item>
                            </el-collapse>
                        </div>
                    </section>
                </template>
            </el-form>
            <template #footer>
                <div class="dialog-footer">
                    <template v-if="managedProvider">
                        <el-button type="primary" :loading="accountSubmitting" @click="validateProviderAccount('ENABLED')">
                            {{ t(savedAccount?.status === 'ENABLED' && savedAccount.providerConfig?.activationValidated
                                ? 'alertConfig.providerAccount.validateSave' : 'alertConfig.providerAccount.activate') }}
                        </el-button>
                        <el-button v-if="savedAccount?.status !== 'ENABLED'" :disabled="accountSubmitting" @click="validateProviderAccount(providerSaveStatus)">
                            {{ t(providerSaveStatus === 'DRAFT' ? 'alertConfig.providerAccount.saveDraft' : 'common.save') }}
                        </el-button>
                    </template>
                    <el-button v-else type="primary" :loading="accountSubmitting" @click="submitAccount">{{ t('common.save') }}</el-button>
                    <el-button :disabled="accountSubmitting" @click="accountVisible = false">{{ t('common.cancel') }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
    <el-empty v-else :description="t('alertConfig.noViewPermission')" />
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { getPaymentLogo, ImagePicker, PaymentLogoGroup, PrivateImage, userFacingErrorMessage } from '@acquiring/shared';
import { Edit, Plus, Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus';
import { useI18n } from 'vue-i18n';
import {
    createAlertAccount, getAlertAccount, getAlertPlatform, listAlertAccounts, listAlertCardBrandOptions,
    listAlertPlatforms, loadAlertPlatformLogo, replaceAlertCredentials, saveAlertPlatform, saveProviderAccount,
    updateAlertAccount, updateAlertAccountProduct, platformTypes, products, transports, SHIELD_PLATFORM,
    type AccountProductInput, type AlertAccount, type AlertPlatform, type AlertPlatformProduct,
    type AlertPlatformType, type AlertProduct, type AlertStatus, type PlatformInput, type ProviderAccountInput,
} from '@/api/channel/disputeAlert';
import RightToolbar from '@/components/RightToolbar/index.vue';
import StandardTable from '@/components/StandardTable/StandardTable.vue';
import { useUserStore } from '@/store/modules/user';
import ChannelPaymentScopeDisplay from '../components/ChannelPaymentScopeDisplay.vue';
import { cardLogoKeys, loadDictOptions, type SelectOption } from '../shared';
import AlertPlatformGuide from './AlertPlatformGuide.vue';
import AlertPlatformIdentity from './AlertPlatformIdentity.vue';
import AlertPlatformSelect from './AlertPlatformSelect.vue';
import ProviderAccountForm from './ProviderAccountForm.vue';
import { isProviderAccountCode } from './provider-account-fields';
import AlertProductDisplay from '../dispute-alert/AlertProductDisplay.vue';
import { alertPlatformPermissions as permissions } from '../dispute-alert/menu';
const { t, locale } = useI18n();
const user = useUserStore();
const platforms = ref<AlertPlatform[]>([]);
const accounts = ref<AlertAccount[]>([]);
const platformsLoading = ref(false);
const accountsLoading = ref(false);
const loadError = ref('');
const accountPage = ref(1);
const accountTotal = ref(0);
let platformsRequest = 0;
let accountsRequest = 0;
let editorRequest = 0;

const activeTab = ref('platform');
const showSearch = ref(true);
const statusConfirming = ref(false);
const emptyQuery = () => ({ platformCode: '', accountIdentifier: '', product: '' as AlertProduct | '', type: '' as AlertPlatformType | '' });
const query = ref(emptyQuery());
const appliedQuery = ref(emptyQuery());
const platformVisible = ref(false);
const platformEditing = ref(false);
const platformFormRef = ref<FormInstance>();
type PlatformField = 'code' | 'name' | 'type' | 'products' | 'logo' | `cardBrands.${AlertProduct}`;
const platformErrors = ref<Partial<Record<PlatformField, string>>>({});
const cardBrandOptions = ref<SelectOption[]>([]);
const cardBrandsLoading = ref(false);
const cardBrandsFailed = ref(false);
const pendingBrandDefaults = new Set<AlertProduct>();
let cardBrandRequest = 0;
const platformLogoFile = ref<File | null>(null);
const platformLogoRemoved = ref(false);
const platformSaving = ref(false);
type PlatformForm = Omit<PlatformInput, 'type'> & { type: AlertPlatformType | ''; id?: number; logoVersion?: string | null };
const newPlatform = (): PlatformForm => ({ code: '', name: '', type: '', products: [], evidence: '', enabled: true });
const platformForm = ref(newPlatform());
const accountVisible = ref(false);
const accountEditing = ref(false);
const accountFormRef = ref<FormInstance>();
type AccountField = 'platformCode' | 'merchantId' | 'products' | 'publicKey' | 'privateKey' | 'credentials';
const accountErrors = ref<Partial<Record<AccountField, string>>>({});
const savedAccount = ref<AlertAccount>();
const accountSubmitting = ref(false);
const accountSaveError = ref('');
let credentialRefreshVersion: number | undefined;
const newAccount = () => ({
    platformCode: '', merchantNumber: '', products: [] as AccountProductInput[],
});
const accountForm = ref(newAccount());
const publicKeyInput = ref('');
const privateKeyInput = ref('');

const activePlatforms = computed(() => platforms.value.filter((item) => item.enabled));
const selectedPlatform = computed(() => findPlatform(accountForm.value.platformCode));
const isShield = computed(() => accountForm.value.platformCode === SHIELD_PLATFORM);
const managedProvider = computed(() => {
    const code = accountForm.value.platformCode;
    return isProviderAccountCode(code) ? code : undefined;
});
const providerAccountRef = ref<InstanceType<typeof ProviderAccountForm>>();
const providerSaveStatus = computed(() => savedAccount.value?.status ?? 'DRAFT');
const selectedPlatformProducts = computed({
    get: () => platformForm.value.products.map((item) => item.product),
    set: (selection: AlertProduct[]) => {
        const previous = platformForm.value.products;
        const saved = platformEditing.value ? findPlatform(platformForm.value.code) : undefined;
        delete platformErrors.value.products;
        for (const item of previous) {
            if (!selection.includes(item.product)) clearCardBrandError(item.product);
        }
        platformForm.value.products = selection.map((product) => {
            const existing = previous.find((item) => item.product === product) || saved?.products.find((item) => item.product === product);
            if (existing) return { ...existing, cardBrands: [...existing.cardBrands] };
            const restriction = restrictedCardBrand(product);
            if (restriction && !cardBrandOptions.value.some((item) => item.value === restriction)) {
                pendingBrandDefaults.add(product);
                return { product, enabled: true, coverage: 'PENDING', cardBrands: [] };
            }
            return { product, enabled: true, coverage: restriction ? 'CONFIRMED' : 'PENDING', cardBrands: restriction ? [restriction] : [] };
        });
    },
});
const selectedAccountProducts = computed({
    get: () => accountForm.value.products.map((item) => item.product),
    set: (selection: AlertProduct[]) => {
        const previous = accountForm.value.products;
        delete accountErrors.value.products;
        const saved = savedAccount.value?.products || [];
        const retained = new Set([...selection, ...saved.map((item) => item.product)]);
        accountForm.value.products = [...retained].map((product) => {
            const existing = previous.find((item) => item.product === product) || saved.find((item) => item.product === product);
            return existing ?? { product, status: 'DRAFT', delivery: { transport: 'HTTPS' } };
        });
    },
});
const filteredPlatforms = computed(() => platforms.value.filter((item) =>
    (!appliedQuery.value.platformCode || item.code === appliedQuery.value.platformCode)
    && (!appliedQuery.value.type || item.type === appliedQuery.value.type)
    && (!appliedQuery.value.product || item.products.some((entry) => entry.product === appliedQuery.value.product))));
const filteredAccounts = accounts;

watch(() => user.account?.accountId, () => {
    editorRequest++;
    accountVisible.value = false;
    platformVisible.value = false;
    platforms.value = [];
    accounts.value = [];
    accountTotal.value = 0;
    accountPage.value = 1;
    platformLogoFile.value = null;
    platformLogoRemoved.value = false;
    clearCredentialInputs();
});

watch([locale, () => user.account?.accountId, () => user.hasPermission(permissions.list)], () => {
    void loadCardBrands();
}, { immediate: true });

watch([activeTab, () => user.account?.accountId, () => user.hasPermission(permissions.list)], () => {
    if (user.hasPermission(permissions.list)) void reload();
}, { immediate: true });

async function loadPlatforms() {
    const request = ++platformsRequest;
    const actor = user.account?.accountId;
    platformsLoading.value = true;
    try {
        const rows = await listAlertPlatforms();
        if (request === platformsRequest && actor === user.account?.accountId) platforms.value = rows;
    } catch (error) {
        if (request === platformsRequest && actor === user.account?.accountId) {
            loadError.value = userFacingErrorMessage(error, t('common.loadFailed'));
        }
    } finally {
        if (request === platformsRequest) platformsLoading.value = false;
    }
}

async function loadAccounts() {
    const request = ++accountsRequest;
    const actor = user.account?.accountId;
    const filter = appliedQuery.value;
    const platformId = filter.platformCode ? findPlatform(filter.platformCode)?.id : undefined;
    if (filter.platformCode && !platformId) {
        accounts.value = [];
        accountTotal.value = 0;
        accountsLoading.value = false;
        return;
    }
    accountsLoading.value = true;
    try {
        const page = await listAlertAccounts({ pageNo: accountPage.value, pageSize: 20, platformId,
            keyword: filter.accountIdentifier || undefined, product: filter.product || undefined });
        if (request === accountsRequest && actor === user.account?.accountId) {
            accounts.value = page.records;
            accountTotal.value = page.total;
        }
    } catch (error) {
        if (request === accountsRequest && actor === user.account?.accountId) {
            loadError.value = userFacingErrorMessage(error, t('common.loadFailed'));
        }
    } finally {
        if (request === accountsRequest) accountsLoading.value = false;
    }
}

async function reload() {
    if (!user.hasPermission(permissions.list)) return;
    loadError.value = '';
    await loadPlatforms();
    if (activeTab.value === 'account' && user.hasPermission(permissions.list)) await loadAccounts();
}

async function loadCardBrands() {
    const request = ++cardBrandRequest;
    cardBrandOptions.value = [];
    cardBrandsFailed.value = false;
    if (!user.account || !user.hasPermission(permissions.list)) {
        cardBrandsLoading.value = false;
        return;
    }
    const language = String(locale.value);
    cardBrandsLoading.value = true;
    try {
        // 已具备字典权限的会话继续可用原查询。其余预警角色只读取卡品牌选项。
        const rows = user.hasPermission('system:dictData:list')
            ? await loadDictOptions('card_brand', language)
            : await listAlertCardBrandOptions(language);
        if (request !== cardBrandRequest) return;
        cardBrandOptions.value = rows.filter((item) => !['ALL', 'NONE', 'UNKNOWN'].includes(item.value));
        for (const item of platformForm.value.products) {
            const restriction = restrictedCardBrand(item.product);
            if (pendingBrandDefaults.has(item.product) && !item.cardBrands.length && restriction
                && cardBrandOptions.value.some((brand) => brand.value === restriction)) {
                item.cardBrands = [restriction];
                item.coverage = 'CONFIRMED';
                pendingBrandDefaults.delete(item.product);
            }
        }
    } catch {
        if (request === cardBrandRequest) cardBrandsFailed.value = true;
    } finally {
        if (request === cardBrandRequest) cardBrandsLoading.value = false;
    }
}

function restrictedCardBrand(product: AlertProduct) {
    if (product === 'RDR') return 'VISA';
    if (product === 'AMEX_INQUIRY') return 'AMEX';
    return undefined;
}

function cardBrandPresentation(value: string) {
    const option = cardBrandOptions.value.find((item) => item.value === value);
    const logoKeys = cardLogoKeys(value, option);
    return { value, label: option?.label || (logoKeys[0] ? getPaymentLogo(logoKeys[0]).label : value), logoKeys };
}

function formBrandOptions(product: AlertPlatformProduct) {
    const restriction = restrictedCardBrand(product.product);
    const eligible = cardBrandOptions.value.filter((item) => !restriction || item.value === restriction);
    const entries = new Set([...eligible.map((item) => item.value), ...product.cardBrands]);
    return [...entries].map(cardBrandPresentation);
}

function cardBrandField(product: AlertProduct): PlatformField {
    return `cardBrands.${product}`;
}

function updateCardBrandCoverage(product: AlertPlatformProduct) {
    product.coverage = product.cardBrands.length ? 'CONFIRMED' : 'PENDING';
    clearCardBrandError(product.product);
}

function clearCardBrandError(product: AlertProduct) {
    delete platformErrors.value[cardBrandField(product)];
    pendingBrandDefaults.delete(product);
}

function applySearch() {
    appliedQuery.value = { ...query.value };
    accountPage.value = 1;
    void reload();
}

function resetSearch() {
    query.value = emptyQuery();
    applySearch();
}

function findPlatform(code: string) {
    return platforms.value.find((item) => item.code === code);
}

function productLabel(product: AlertProduct) {
    return t('alertConfig.productLabel.' + product);
}

function platformTypeLabel(type: AlertPlatformType) {
    return t('alertConfig.platformTypeLabel.' + type);
}

function platformCardBrands(platform: AlertPlatform) {
    return [...new Set(platform.products.flatMap((item) => item.cardBrands))].map(cardBrandPresentation);
}

function pendingCoverageLabels(platform: AlertPlatform) {
    return platform.products.filter((item) => item.coverage === 'PENDING')
        .map((item) => t('alertConfig.productCoveragePending', { product: productLabel(item.product) }));
}

function accountProductAvailability(account: AlertAccount) {
    return account.products.map(({ product, status, available }) => {
        if (status !== 'ENABLED') return { product, label: statusLabel(status), type: statusType(status) };
        return {
            product,
            label: t(available ? 'alertConfig.productAvailable' : 'alertConfig.productUnavailable'),
            type: available ? 'success' as const : 'warning' as const,
        };
    });
}

function accountAvailabilityNote(account: AlertAccount) {
    const platform = findPlatform(account.platformCode);
    if (!platform) return t('alertConfig.accountPlatformUnavailable');
    if (!platform.enabled) return t('alertConfig.accountSourcePlatformDisabled');
    if (!account.products.some((item) => item.status === 'ENABLED')) return t('alertConfig.noEnabledAccountProducts');
    if (account.status !== 'ENABLED') return t('alertConfig.accountSourceNotEnabled');
    if (isProviderAccountCode(account.platformCode) && !account.providerConfig?.activationValidated) {
        return t('alertConfig.providerAccount.activationRequired');
    }
    return '';
}

function statusLabel(status: AlertStatus) {
    return t('alertConfig.status.' + status);
}

function statusType(status: AlertStatus) {
    return status === 'ENABLED' ? 'success' : status === 'DRAFT' ? 'warning' : 'info';
}

function deliverySummary(account: AlertAccount) {
    if (account.providerConfig) {
        const { usage, deliveryMethod } = account.providerConfig.values;
        const methods = Array.isArray(usage) ? usage : typeof deliveryMethod === 'string' ? [deliveryMethod] : [];
        return methods.map((method) => t('alertConfig.providerAccount.' + method)).join(' / ') || '—';
    }
    const deliveryMethods = new Set(account.products.map((item) => item.delivery.transport));
    return [...deliveryMethods].map((transport) => t('alertConfig.transportLabel.' + transport)).join(' / ') || '—';
}

function credentialPlaceholder(registered?: boolean) {
    return t(registered ? 'alertConfig.keepCredential' : 'common.pleaseInput');
}

function showAccounts(item: AlertPlatform) {
    query.value = { ...emptyQuery(), platformCode: item.code };
    appliedQuery.value = { ...query.value };
    accountPage.value = 1;
    activeTab.value = 'account';
}

function shieldCredentialSummary(account: AlertAccount) {
    const keys = account.credentials;
    return t(keys.publicKeyRegistered && keys.privateKeyRegistered ? 'alertConfig.keysRegistered' : 'alertConfig.keysIncomplete');
}

async function openPlatform(row?: AlertPlatform) {
    if (!user.hasPermission(row ? permissions.edit : permissions.add) || platformSaving.value) return;
    const request = ++editorRequest;
    try {
        const item = row ? await getAlertPlatform(row.id) : undefined;
        if (request !== editorRequest) return;
        platformEditing.value = Boolean(item);
        platformForm.value = item ?? newPlatform();
        platformLogoFile.value = null;
        platformLogoRemoved.value = false;
        platformErrors.value = {};
        pendingBrandDefaults.clear();
        platformVisible.value = true;
        if (cardBrandsFailed.value) void loadCardBrands();
    } catch (error) {
        if (request === editorRequest) ElMessage.error(userFacingErrorMessage(error, t('common.loadFailed')));
    }
}

function loadPlatformLogo(platform: Pick<AlertPlatform, 'id'> | PlatformForm): Promise<Blob> {
    if (!platform.id) return Promise.reject(new Error('Platform logo is unavailable'));
    return loadAlertPlatformLogo(platform.id);
}

function platformInput(form: PlatformInput): PlatformInput {
    const { code, name, type, enabled, evidence, version } = form;
    const products = form.products.map(({ product, enabled, coverage, cardBrands }) => ({ product, enabled, coverage, cardBrands }));
    return { code, name, type, enabled, evidence, version, products };
}

async function submitPlatform() {
    if (platformSaving.value || !user.hasPermission(platformEditing.value ? permissions.edit : permissions.add)) return;
    const { id, type, name } = platformForm.value;
    const code = platformForm.value.code.toUpperCase();
    const errors: typeof platformErrors.value = {};
    if (!/^[A-Z][A-Z0-9_-]{1,31}$/.test(code)) errors.code = t('alertConfig.invalidPlatformCode');
    else if (!id && findPlatform(code)) errors.code = t('alertConfig.duplicatePlatform');
    if (!name.trim()) errors.name = t('alertConfig.platformNameRequired');
    if (!type) errors.type = t('alertConfig.platformTypeRequired');
    if (!selectedPlatformProducts.value.length) errors.products = t('alertConfig.platformProductRequired');
    if (!cardBrandsLoading.value && !cardBrandsFailed.value) {
        for (const product of platformForm.value.products) {
            if (product.cardBrands.some((value) => !cardBrandOptions.value.some((brand) => brand.value === value))) {
                errors[cardBrandField(product.product)] = t('alertConfig.cardBrandUnavailable');
            }
        }
    }
    platformErrors.value = errors;
    const firstError = Object.keys(errors)[0];
    if (firstError) {
        await nextTick();
        platformFormRef.value?.scrollToField(firstError);
        return;
    }
    if (!type) return;
    const actor = user.account?.accountId;
    platformSaving.value = true;
    try {
        await saveAlertPlatform(id, platformInput({ ...platformForm.value, code, type }), platformLogoFile.value, platformLogoRemoved.value);
        if (actor !== user.account?.accountId) return;
        platformLogoFile.value = null;
        platformVisible.value = false;
        ElMessage.success(t('common.saveSuccess'));
        await reload();
    } catch (error) {
        if (actor === user.account?.accountId) ElMessage.error(userFacingErrorMessage(error, t('common.saveFailed')));
    } finally {
        platformSaving.value = false;
    }
}

async function openAccount(row?: AlertAccount) {
    if (!user.hasPermission(permissions.account) || accountSubmitting.value) return;
    const request = ++editorRequest;
    try {
        const item = row ? await getAlertAccount(row.id) : undefined;
        if (request !== editorRequest) return;
        accountEditing.value = Boolean(item);
        savedAccount.value = item;
        accountForm.value = item ? {
            platformCode: item.platformCode, merchantNumber: item.merchantNumber,
            products: item.products.map(({ product, status, delivery }) => ({ product, status, delivery: { ...delivery } })),
        } : newAccount();
        credentialRefreshVersion = undefined;
        clearCredentialInputs();
        accountErrors.value = {};
        accountSaveError.value = '';
        accountVisible.value = true;
    } catch (error) {
        if (request === editorRequest) ElMessage.error(userFacingErrorMessage(error, t('common.loadFailed')));
    }
}

function clearCredentialInputs() {
    providerAccountRef.value?.clearCredentials();
    publicKeyInput.value = '';
    privateKeyInput.value = '';
}

function changePlatform() {
    accountForm.value.products = [];
    accountErrors.value = {};
    clearCredentialInputs();
}

function productAction(item: AccountProductInput) {
    return t(item.status === 'ENABLED' ? 'common.disable' : 'common.enable');
}

function toggleProductStatus(item: AccountProductInput) {
    if (!user.hasPermission(permissions.account)) return;
    item.status = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
}

function sameDelivery(left: AccountProductInput['delivery'], right: AccountProductInput['delivery']) {
    if (left.transport !== right.transport) return false;
    const fields = left.transport === 'HTTPS' ? ['sourceAuthentication', 'outcomeUrl'] as const : ['host', 'directory', 'schedule'] as const;
    return fields.every((field) => (left[field]?.trim() || '') === (right[field]?.trim() || ''));
}

async function validateProviderAccount(status: AlertStatus) {
    if (accountSubmitting.value) return;
    accountSaveError.value = '';
    const field = providerAccountRef.value?.submit(status);
    if (field) {
        await nextTick();
        accountFormRef.value?.scrollToField(field);
    }
}

async function submitProviderAccount(input: ProviderAccountInput) {
    const platform = selectedPlatform.value;
    if (!managedProvider.value || !platform || accountSubmitting.value || !user.hasPermission(permissions.account)) return;
    const actor = user.account?.accountId;
    const existing = savedAccount.value;
    accountSubmitting.value = true;
    try {
        await saveProviderAccount(input, platform.id, existing);
        if (actor !== user.account?.accountId || !accountVisible.value) return;
        clearCredentialInputs();
        accountVisible.value = false;
        ElMessage.success(t('common.saveSuccess'));
        await reload();
    } catch (error) {
        if (actor === user.account?.accountId && accountVisible.value) {
            accountSaveError.value = userFacingErrorMessage(error, t('common.saveFailed'));
        }
    } finally {
        accountSubmitting.value = false;
    }
}

async function submitAccount() {
    if (managedProvider.value) return validateProviderAccount(providerSaveStatus.value);
    if (!user.hasPermission(permissions.account) || accountSubmitting.value) return;
    const { merchantNumber, products: productForms } = accountForm.value;
    const platform = selectedPlatform.value;
    const errors: typeof accountErrors.value = {};
    const existing = savedAccount.value;
    const shield = isShield.value;
    const hasKeys = credentialRefreshVersion !== undefined
        || Boolean(existing?.credentials.publicKeyRegistered && existing.credentials.privateKeyRegistered);
    const canWriteKeys = shield && user.hasPermission(permissions.credential);
    const publicKey = canWriteKeys ? publicKeyInput.value.trim() : '';
    const privateKey = canWriteKeys ? privateKeyInput.value.trim() : '';
    const registerKeys = Boolean(publicKey || privateKey);
    if (!platform || (!existing && !platform.enabled)) errors.platformCode = t('alertConfig.accountPlatformRequired');
    if (!merchantNumber.trim()) errors.merchantId = t(shield ? 'alertConfig.merchantNumberRequired' : 'alertConfig.accountIdentifierRequired');
    if (!productForms.length || productForms.some((item) => !platform?.products.some(({ product }) => product === item.product))) {
        errors.products = t('alertConfig.accountProductRequired');
    }
    if (shield && !hasKeys && (registerKeys || productForms.some((item) => item.status === 'ENABLED'))) {
        if (!canWriteKeys) errors.credentials = t('alertConfig.shieldKeysRequired');
        else {
            if (!publicKey) errors.publicKey = t('alertConfig.publicKeyRequired');
            if (!privateKey) errors.privateKey = t('alertConfig.privateKeyRequired');
        }
    }
    accountErrors.value = errors;
    const firstError = Object.keys(errors)[0];
    if (firstError || !platform) {
        await nextTick();
        if (firstError) accountFormRef.value?.scrollToField(firstError);
        return;
    }
    const actor = user.account?.accountId;
    const stillEditing = () => user.account?.accountId === actor && accountVisible.value;
    accountSaveError.value = '';
    accountSubmitting.value = true;
    try {
        let account = existing;
        if (!account) {
            const newProducts = productForms.map((item) => ({
                ...item, status: shield && item.status === 'ENABLED' ? 'DRAFT' as const : item.status,
            }));
            account = await createAlertAccount({ merchantNumber, platformId: platform.id,
                status: shield ? 'DRAFT' : 'ENABLED', products: newProducts });
            if (!stillEditing()) return;
            savedAccount.value = account;
            accountEditing.value = true;
        }
        if (account.merchantNumber !== merchantNumber) {
            account = await updateAlertAccount(account.id, { merchantNumber, status: account.status, version: account.version });
            if (!stillEditing()) return;
            savedAccount.value = account;
        }
        if (registerKeys && credentialRefreshVersion === undefined) {
            await replaceAlertCredentials(account.id, { version: account.version, publicKey: publicKey || undefined, privateKey: privateKey || undefined });
            if (!stillEditing()) return;
            credentialRefreshVersion = account.version + 1;
            clearCredentialInputs();
        }
        if (credentialRefreshVersion !== undefined) {
            const refreshed = await getAlertAccount(account.id);
            if (!stillEditing()) return;
            if (refreshed.version !== credentialRefreshVersion) {
                accountSaveError.value = t('alertConfig.reloadConflict');
                return;
            }
            account = refreshed;
            savedAccount.value = account;
            credentialRefreshVersion = undefined;
        }
        for (const item of productForms) {
            const current = account.products.find(({ product }) => product === item.product);
            if (current && current.status === item.status && sameDelivery(current.delivery, item.delivery)) continue;
            account = await updateAlertAccountProduct(account.id, { ...item, version: account.version });
            if (!stillEditing()) return;
            savedAccount.value = account;
        }
        if (shield && account.status === 'DRAFT' && account.credentials.publicKeyRegistered && account.credentials.privateKeyRegistered) {
            account = await updateAlertAccount(account.id, { merchantNumber, status: 'ENABLED', version: account.version });
            if (!stillEditing()) return;
            savedAccount.value = account;
        }
        clearCredentialInputs();
        accountVisible.value = false;
        ElMessage.success(t('common.saveSuccess'));
        await reload();
    } catch (error) {
        if (stillEditing()) {
            accountSaveError.value = userFacingErrorMessage(error, t('common.saveFailed'));
            if (savedAccount.value?.version !== existing?.version) await reload();
        }
    } finally {
        accountSubmitting.value = false;
    }
}

async function confirmStatusChange(permission: string, name: string, enabled: boolean, apply: () => Promise<unknown>, disableImpact: string) {
    if (statusConfirming.value || !user.hasPermission(permission)) return;
    const actor = user.account?.accountId;
    const action = t(enabled ? 'common.enable' : 'common.disable');
    const prompt = t('common.statusToggleConfirm', { action, name });
    statusConfirming.value = true;
    try {
        const confirmed = await ElMessageBox.confirm(enabled ? prompt : prompt + ' ' + disableImpact,
            t('common.operationConfirm'), { type: enabled ? 'success' : 'warning', confirmButtonText: action, cancelButtonText: t('common.cancel') })
            .then(() => true, () => false);
        if (!confirmed || user.account?.accountId !== actor || !user.hasPermission(permission)) return;
        await apply();
        if (user.account?.accountId !== actor) return;
        ElMessage.success(t('common.saveSuccess'));
        await reload();
    } catch (error) {
        if (user.account?.accountId === actor) ElMessage.error(userFacingErrorMessage(error, t('common.saveFailed')));
    } finally {
        statusConfirming.value = false;
    }
}

function togglePlatformStatus(item: AlertPlatform) {
    const enabled = !item.enabled;
    return confirmStatusChange(permissions.edit, item.name, enabled,
        () => saveAlertPlatform(item.id, platformInput({ ...item, enabled })), t('alertConfig.platformDisableImpact'));
}

function toggleAccountStatus(item: AlertAccount) {
    const status = item.status === 'ENABLED' ? 'DISABLED' : 'ENABLED';
    if (status === 'ENABLED' && !findPlatform(item.platformCode)?.enabled) {
        ElMessage.warning(t('alertConfig.accountPlatformDisabled'));
        return;
    }
    if (status === 'ENABLED' && item.platformCode === SHIELD_PLATFORM && !item.credentials.version) {
        ElMessage.warning(t('alertConfig.shieldKeysRequired'));
        return;
    }
    if (status === 'ENABLED' && isProviderAccountCode(item.platformCode) && !item.providerConfig?.activationValidated) {
        return openAccount(item);
    }
    return confirmStatusChange(permissions.account, item.merchantNumber, status === 'ENABLED',
        () => updateAlertAccount(item.id, { merchantNumber: item.merchantNumber, status, version: item.version }),
        t('alertConfig.accountDisableImpact'));
}
</script>

<style scoped>
.app-container :deep(.platform-code-cell .cell),
.app-container :deep(.platform-products-cell .cell) {
    padding-inline: 6px;
}
.platform-identifier {
    display: block;
    white-space: normal;
    overflow-wrap: anywhere;
}
.configuration-hint.coverage-note {
    margin-top: 2px;
    color: var(--el-color-warning-dark-2);
    overflow-wrap: anywhere;
}
.platform-list-logo {
    width: 48px;
    max-width: 100%;
    height: 26px;
}
.account-product-state,
.brand-option {
    display: inline-flex;
    min-width: 0;
    max-width: 100%;
    align-items: center;
    gap: 5px;
}
.brand-option > span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.product-brand-fields {
    margin-bottom: 16px;
    padding: 12px 12px 0;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
}
.product-brand-field :deep(.el-select) {
    width: 100%;
}
.dictionary-error {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    color: var(--el-color-danger);
    font-size: 12px;
}
.tag-list {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 4px;
}
.account-context, .configuration-section {
    margin-bottom: 16px;
}
.configuration-section h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 12px;
}
.configuration-hint {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}
.account-product {
    margin-bottom: 10px;
    padding: 0 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--el-border-radius-base);
}
.account-product__summary,
.account-product__identity {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}
.account-product__summary {
    justify-content: space-between;
    padding: 8px 0;
}
.masked-key-input :deep(textarea) {
    -webkit-text-security: disc;
}
</style>
