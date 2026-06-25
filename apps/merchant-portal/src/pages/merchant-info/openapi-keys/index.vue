<template>
    <div class="page openapi-key-page">
        <el-alert
            class="mb16"
            type="warning"
            show-icon
            :closable="false"
            :title="t('openapiKeys.warning')"
        />

        <div class="toolbar">
            <el-button v-if="canDownloadPrivateMaterial" type="primary" :icon="Download" :disabled="!canExportIntegrationMaterial" :loading="isActionLoading('download', 'SDK_KIT')" @click="downloadMaterial('SDK_KIT', 'ZIP')">{{ t('openapiKeys.downloadKit') }}</el-button>
            <el-button v-if="canDownloadPrivateMaterial" :icon="Document" :disabled="!canExportIntegrationMaterial" :loading="isActionLoading('download', 'MERCHANT_CONFIG')" @click="downloadMaterial('MERCHANT_CONFIG', 'PROPERTIES')">{{ t('openapiKeys.downloadConfig') }}</el-button>
            <el-button v-if="canCopyMaterial && canDownloadPrivateMaterial" :icon="CopyDocument" :disabled="!canExportIntegrationMaterial" :loading="isActionLoading('copy', 'MERCHANT_CONFIG')" @click="copyMaterial('MERCHANT_CONFIG', 'PROPERTIES')">{{ t('openapiKeys.copyConfig') }}</el-button>
            <el-button v-if="canDownloadPrivateMaterial" :icon="Document" :disabled="!canExportIntegrationMaterial" :loading="isActionLoading('download', 'MERCHANT_CONFIG_TEXT')" @click="downloadMaterial('MERCHANT_CONFIG_TEXT', 'PROPERTIES')">{{ t('openapiKeys.downloadTextConfig') }}</el-button>
            <el-button v-if="canCopyMaterial && canDownloadPrivateMaterial" :icon="CopyDocument" :disabled="!canExportIntegrationMaterial" :loading="isActionLoading('copy', 'MERCHANT_CONFIG_TEXT')" @click="copyMaterial('MERCHANT_CONFIG_TEXT', 'PROPERTIES')">{{ t('openapiKeys.copyTextConfig') }}</el-button>
            <el-button :icon="Refresh" :loading="loading" @click="loadData">{{ t('openapiKeys.refresh') }}</el-button>
        </div>

        <el-skeleton v-if="loading" :rows="6" animated />
        <template v-else-if="material">
            <el-alert
                v-if="!responsePrivateKeyAvailable"
                class="mb16"
                type="warning"
                show-icon
                :closable="false"
                :title="t('openapiKeys.responsePrivateMissingTitle')"
                :description="t('openapiKeys.responsePrivateMissingDesc')"
            />
            <el-descriptions :column="3" border size="small" class="mb16">
                <el-descriptions-item :label="t('openapiKeys.merchantId')">{{ material.merchantId }}</el-descriptions-item>
                <el-descriptions-item :label="t('openapiKeys.merchantName')">{{ material.merchantName }}</el-descriptions-item>
                <el-descriptions-item :label="t('openapiKeys.sdkVersion')">{{ material.sdkVersion || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('openapiKeys.openapiBaseUrl')">{{ material.openApiBaseUrl || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('openapiKeys.cryptoMode')">{{ material.cryptoMode || '-' }}</el-descriptions-item>
            </el-descriptions>

            <div class="key-grid">
                <section class="key-panel">
                    <div class="key-panel__head">
                        <div>
                            <h3>{{ t('openapiKeys.jwtTitle') }}</h3>
                            <p>{{ t('openapiKeys.jwtHelp') }}</p>
                        </div>
                        <el-tag :type="statusType(material.jwtKeyStatus)">{{ statusText(material.jwtKeyStatus) }}</el-tag>
                    </div>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item :label="t('openapiKeys.algorithm')">{{ material.jwtAlgorithm || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.version')">{{ material.jwtKeyVersion || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.fingerprint')">{{ material.jwtKeyFingerprint || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.updateTime')">{{ formatTime(material.jwtUpdatedTime) }}</el-descriptions-item>
                    </el-descriptions>
                    <div class="key-panel__actions">
                        <el-button v-if="canCopyMaterial && canDownloadPrivateMaterial" size="small" :loading="isActionLoading('copy', 'JWT_KEY')" @click="copyMaterial('JWT_KEY')">{{ t('openapiKeys.copy') }}</el-button>
                        <el-button v-if="canDownloadPrivateMaterial" size="small" :loading="isActionLoading('download', 'JWT_KEY')" @click="downloadMaterial('JWT_KEY', 'TXT')">{{ t('openapiKeys.downloadTxt') }}</el-button>
                        <el-button v-if="canRotateJwt" size="small" type="warning" :loading="isActionLoading('rotate', 'JWT_KEY')" @click="rotateKey('JWT_KEY')">{{ t('openapiKeys.rotate') }}</el-button>
                    </div>
                </section>

                <section class="key-panel">
                    <div class="key-panel__head">
                        <div>
                            <h3>{{ t('openapiKeys.platformPublicTitle') }}</h3>
                            <p>{{ t('openapiKeys.platformPublicHelp') }}</p>
                        </div>
                        <el-tag :type="statusType(material.platformPayloadKeyStatus)">{{ statusText(material.platformPayloadKeyStatus) }}</el-tag>
                    </div>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item :label="t('openapiKeys.algorithm')">{{ material.platformPayloadAlgorithm || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.keySize')">{{ material.platformPayloadKeySize || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.publicFingerprint')">{{ material.platformPayloadPublicKeyFingerprint || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.updateTime')">{{ formatTime(material.platformPayloadUpdatedTime) }}</el-descriptions-item>
                    </el-descriptions>
                    <div class="key-panel__actions">
                        <el-button v-if="canCopyMaterial" size="small" :loading="isActionLoading('copy', 'PLATFORM_PUBLIC_KEY')" @click="copyMaterial('PLATFORM_PUBLIC_KEY')">{{ t('openapiKeys.copyBase64') }}</el-button>
                        <el-button v-if="canDownloadMaterial" size="small" :loading="isActionLoading('download', 'PLATFORM_PUBLIC_KEY')" @click="downloadMaterial('PLATFORM_PUBLIC_KEY', 'PEM')">{{ t('openapiKeys.downloadPem') }}</el-button>
                        <el-button v-if="canDownloadMaterial" size="small" :loading="isActionLoading('download', 'PLATFORM_PUBLIC_KEY')" @click="downloadMaterial('PLATFORM_PUBLIC_KEY', 'TXT')">{{ t('openapiKeys.downloadTxt') }}</el-button>
                    </div>
                </section>

                <section class="key-panel">
                    <div class="key-panel__head">
                        <div>
                            <h3>{{ t('openapiKeys.responsePrivateTitle') }}</h3>
                            <p>{{ t('openapiKeys.responsePrivateHelp') }}</p>
                        </div>
                        <el-tag :type="statusType(material.merchantResponseKeyStatus)">{{ statusText(material.merchantResponseKeyStatus) }}</el-tag>
                    </div>
                    <el-descriptions :column="1" border size="small">
                        <el-descriptions-item :label="t('openapiKeys.algorithm')">{{ material.merchantResponseAlgorithm || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.keySize')">{{ material.merchantResponseKeySize || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.publicFingerprint')">{{ material.merchantResponsePublicKeyFingerprint || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.privateKeyAvailable')">{{ material.merchantResponsePrivateKeyAvailable ? t('openapiKeys.yes') : t('openapiKeys.no') }}</el-descriptions-item>
                        <el-descriptions-item :label="t('openapiKeys.updateTime')">{{ formatTime(material.merchantResponseUpdatedTime) }}</el-descriptions-item>
                    </el-descriptions>
                    <div class="key-panel__actions">
                        <el-button v-if="canCopyMaterial && canDownloadPrivateMaterial && responsePrivateKeyAvailable" size="small" :loading="isActionLoading('copy', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="copyPrivateKey">{{ t('openapiKeys.copyBase64') }}</el-button>
                        <el-button v-if="canDownloadPrivateMaterial && responsePrivateKeyAvailable" size="small" :loading="isActionLoading('download', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="downloadPrivateKey('PEM')">{{ t('openapiKeys.downloadPem') }}</el-button>
                        <el-button v-if="canDownloadPrivateMaterial && responsePrivateKeyAvailable" size="small" :loading="isActionLoading('download', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="downloadPrivateKey('TXT')">{{ t('openapiKeys.downloadTxt') }}</el-button>
                        <el-button v-if="canRotateResponse" size="small" type="warning" :loading="isActionLoading('rotate', 'MERCHANT_RESPONSE_PRIVATE_KEY')" @click="rotateKey('MERCHANT_RESPONSE_PRIVATE_KEY')">{{ responsePrivateKeyAvailable ? t('openapiKeys.rotate') : t('openapiKeys.generatePrivateKey') }}</el-button>
                    </div>
                </section>
            </div>

            <section class="log-panel">
                <div class="log-panel__head">
                    <h3>{{ t('openapiKeys.logsTitle') }}</h3>
                    <el-button size="small" :icon="Refresh" @click="loadLogs">{{ t('openapiKeys.refresh') }}</el-button>
                </div>
                <el-table v-loading="logsLoading" :data="logs" size="small">
                    <el-table-column prop="operationName" :label="t('openapiKeys.operation')" min-width="160" />
                    <el-table-column :label="t('openapiKeys.status')" width="90" align="center">
                        <template #default="{ row }">
                            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? t('openapiKeys.success') : t('openapiKeys.failed') }}</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="requestMethod" :label="t('openapiKeys.method')" width="80" />
                    <el-table-column prop="operIp" label="IP" min-width="130" />
                    <el-table-column :label="t('openapiKeys.costTime')" width="90">
                        <template #default="{ row }">{{ row.costTime ?? '-' }} ms</template>
                    </el-table-column>
                    <el-table-column :label="t('openapiKeys.time')" min-width="160">
                        <template #default="{ row }">{{ formatTime(row.operatedAt) }}</template>
                    </el-table-column>
                    <el-table-column prop="errorMsg" :label="t('openapiKeys.error')" min-width="180" show-overflow-tooltip />
                </el-table>
                <div class="log-panel__pager">
                    <el-pagination
                        v-model:current-page="logPage"
                        v-model:page-size="logPageSize"
                        small
                        layout="total, prev, pager, next"
                        :total="logTotal"
                        @current-change="loadLogs"
                    />
                </div>
            </section>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { CopyDocument, Document, Download, Refresh } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import {
    openapiKeysApi,
    type OpenApiKeyExportFormat,
    type OpenApiKeyOperationLog,
    type OpenApiKeyType,
    type OpenApiMerchantKeyMaterial,
} from '@/api/openapiKeysApi';
import { hasPermission } from '@/utils/permission';

const { t } = useI18n();
const loading = ref(false);
const logsLoading = ref(false);
const material = ref<OpenApiMerchantKeyMaterial>();
const logs = ref<OpenApiKeyOperationLog[]>([]);
const logPage = ref(1);
const logPageSize = ref(10);
const logTotal = ref(0);
const canCopyMaterial = hasPermission('merchant:openapi:key:copy');
const canDownloadMaterial = hasPermission('merchant:openapi:key:download');
const canDownloadPrivateMaterial = hasPermission('merchant:openapi:key:download-private');
const canRotateJwt = hasPermission('merchant:openapi:key:rotate-jwt');
const canRotateResponse = hasPermission('merchant:openapi:key:rotate-response');
const actionLoading = reactive<Record<string, boolean>>({});
const responsePrivateKeyAvailable = computed(() => material.value?.merchantResponsePrivateKeyAvailable === true);
const canExportIntegrationMaterial = computed(() => responsePrivateKeyAvailable.value);

async function loadData() {
    loading.value = true;
    try {
        material.value = await openapiKeysApi.material();
        await loadLogs();
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('openapiKeys.loadFailed'));
    } finally {
        loading.value = false;
    }
}

async function loadLogs() {
    logsLoading.value = true;
    try {
        const result = await openapiKeysApi.logs(logPage.value, logPageSize.value);
        logs.value = result.records;
        logTotal.value = result.total;
    } catch {
        logs.value = [];
        logTotal.value = 0;
    } finally {
        logsLoading.value = false;
    }
}

async function copyMaterial(keyType: OpenApiKeyType, format: OpenApiKeyExportFormat = 'TEXT') {
    const loadingKey = actionKey('copy', keyType);
    actionLoading[loadingKey] = true;
    try {
        if (requiresResponsePrivateKey(keyType) && !responsePrivateKeyAvailable.value) {
            ElMessage.warning(t('openapiKeys.responsePrivateMissingAction'));
            return;
        }
        if (isSensitiveMaterial(keyType)) {
            await confirmPrivateKeyAction(t('openapiKeys.copyMaterialAction'));
        }
        const result = await openapiKeysApi.copy(keyType, format);
        await navigator.clipboard.writeText(result.content);
        ElMessage.success(t('openapiKeys.copySuccess'));
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('openapiKeys.copyFailed'));
    } finally {
        actionLoading[loadingKey] = false;
    }
}

async function downloadMaterial(keyType: OpenApiKeyType, format?: OpenApiKeyExportFormat) {
    const loadingKey = actionKey('download', keyType);
    actionLoading[loadingKey] = true;
    try {
        if (requiresResponsePrivateKey(keyType) && !responsePrivateKeyAvailable.value) {
            ElMessage.warning(t('openapiKeys.responsePrivateMissingAction'));
            return;
        }
        if (isSensitiveMaterial(keyType)) {
            await confirmPrivateKeyAction(t('openapiKeys.downloadMaterialAction'));
        }
        await openapiKeysApi.download(keyType, format);
    } catch (error: any) {
        ElMessage.error(error?.friendlyMessage || error?.message || t('openapiKeys.downloadFailed'));
    } finally {
        actionLoading[loadingKey] = false;
    }
}

async function copyPrivateKey() {
    await copyMaterial('MERCHANT_RESPONSE_PRIVATE_KEY');
}

async function downloadPrivateKey(format: OpenApiKeyExportFormat) {
    await downloadMaterial('MERCHANT_RESPONSE_PRIVATE_KEY', format);
}

async function rotateKey(keyType: OpenApiKeyType) {
    const loadingKey = actionKey('rotate', keyType);
    actionLoading[loadingKey] = true;
    try {
        await confirmPrivateKeyAction(t('openapiKeys.rotateMaterialAction'));
        material.value = await openapiKeysApi.rotate(keyType);
        ElMessage.success(t('openapiKeys.rotateSuccess'));
    } catch (error: any) {
        if (error?.message) {
            ElMessage.error(error.friendlyMessage || error.message);
        }
    } finally {
        actionLoading[loadingKey] = false;
    }
}

function requiresResponsePrivateKey(keyType: OpenApiKeyType) {
    return keyType === 'MERCHANT_RESPONSE_PRIVATE_KEY'
        || keyType === 'MERCHANT_CONFIG'
        || keyType === 'MERCHANT_CONFIG_TEXT'
        || keyType === 'SDK_KIT';
}

function actionKey(action: 'copy' | 'download' | 'rotate', keyType: OpenApiKeyType) {
    return `${action}:${keyType}`;
}

function isActionLoading(action: 'copy' | 'download' | 'rotate', keyType: OpenApiKeyType) {
    return actionLoading[actionKey(action, keyType)] === true;
}

function isSensitiveMaterial(keyType: OpenApiKeyType) {
    return keyType === 'JWT_KEY'
        || keyType === 'MERCHANT_RESPONSE_PRIVATE_KEY'
        || keyType === 'MERCHANT_CONFIG'
        || keyType === 'MERCHANT_CONFIG_TEXT'
        || keyType === 'SDK_KIT';
}

async function confirmPrivateKeyAction(action: string) {
    await ElMessageBox.confirm(
        t('openapiKeys.sensitiveConfirmMessage', { action }),
        t('openapiKeys.sensitiveConfirmTitle'),
        { type: 'warning' },
    );
}

function statusText(status?: string) {
    if (status === 'ENABLED') return t('openapiKeys.enabled');
    if (status === 'DISABLED') return t('openapiKeys.disabled');
    return t('openapiKeys.notConfigured');
}

function statusType(status?: string) {
    if (status === 'ENABLED') return 'success';
    if (status === 'DISABLED') return 'info';
    return 'warning';
}

function formatTime(value?: string) {
    if (!value) return '-';
    return value.replace('T', ' ').slice(0, 19);
}

onMounted(loadData);
</script>

<style scoped>
.openapi-key-page {
    min-width: 0;
}

.mb16 {
    margin-bottom: 16px;
}

.toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
}

.key-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}

.key-panel {
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 14px;
    background: #fff;
}

.key-panel__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.key-panel__head h3 {
    margin: 0;
    color: #1f2937;
    font-size: 15px;
    line-height: 22px;
}

.key-panel__head p {
    margin: 2px 0 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 18px;
}

.key-panel__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.log-panel {
    margin-top: 16px;
}

.log-panel__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
}

.log-panel__head h3 {
    margin: 0;
    color: #1f2937;
    font-size: 15px;
    line-height: 22px;
}

.log-panel__pager {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
}

@media (max-width: 1200px) {
    .key-grid {
        grid-template-columns: 1fr;
    }
}
</style>
