import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export interface MerchantInfo {
    id: number;
    merchantId: string;
    merchantName: string;
    merchantShortName?: string;
    merchantStatus: number;
    merchantCategoryCode: string;
    countryCode: string;
    regionCode?: string;
    city?: string;
    addressLine?: string;
    contactEmail?: string;
    contactPhone?: string;
    settlementCurrency: string;
    timezone: string;
    riskLevel: number;
    gmtCreate?: string;
    gmtModified?: string;
    jwtKey?: MerchantKeySummary;
    platformPayloadKey?: MerchantKeySummary;
    responseKey?: MerchantKeySummary;
}

export interface MerchantKeySummary {
    id?: number;
    keyVersion?: string;
    algorithm?: string;
    keySize?: number;
    expiresSeconds?: number;
    enabled?: number;
    fingerprint?: string;
    effectiveTime?: string;
    expireTime?: string;
    gmtModified?: string;
}

export interface MerchantSecurityMaterial {
    merchantId: string;
    merchantName: string;
    merchantKey?: string;
    merchantKeyMasked?: string;
    jwtAlgorithm?: string;
    jwtExpiresSeconds?: number;
    platformPublicKeyX509Base64?: string;
    merchantResponsePublicKeyX509Base64?: string;
    merchantResponsePrivateKeyPkcs8Base64?: string;
    oneTimeSecret?: boolean;
}

export interface OpenApiKeyMaterialSummary {
    merchantId: string;
    merchantName: string;
    openApiBaseUrl?: string;
    sdkVersion?: string;
    cryptoMode?: string;
    jwtKeyStatus?: string;
    jwtAlgorithm?: string;
    jwtKeyVersion?: string;
    jwtKeyFingerprint?: string;
    jwtUpdatedTime?: string;
    platformPayloadKeyStatus?: string;
    platformPayloadAlgorithm?: string;
    platformPayloadKeySize?: number;
    platformPayloadPublicKeyFingerprint?: string;
    platformPayloadUpdatedTime?: string;
    merchantResponseKeyStatus?: string;
    merchantResponseAlgorithm?: string;
    merchantResponseKeySize?: number;
    merchantResponsePublicKeyFingerprint?: string;
    merchantResponseUpdatedTime?: string;
    merchantResponsePrivateKeyAvailable?: boolean;
    canCopyPrivateKey?: boolean;
    canDownloadPrivateKey?: boolean;
    canRotateJwtKey?: boolean;
    canRotatePlatformPayloadKey?: boolean;
    canRotateMerchantResponseKey?: boolean;
}

export interface MerchantKeyMaterial {
    keyType: string;
    keyName: string;
    owner?: string;
    usage?: string;
    keyVersion?: string;
    algorithm?: string;
    keySize?: number;
    expiresSeconds?: number;
    enabled?: number;
    fingerprint?: string;
    merchantKey?: string;
    publicKeyX509Base64?: string;
    privateKeyPkcs8Base64?: string;
    stored?: boolean;
    effectiveTime?: string;
    expireTime?: string;
    gmtModified?: string;
}

export interface MerchantKeyBundle {
    merchantId: string;
    merchantName: string;
    keys: MerchantKeyMaterial[];
}

export type OpenApiKeyType = 'JWT_KEY' | 'PLATFORM_PUBLIC_KEY' | 'PLATFORM_PRIVATE_KEY' | 'MERCHANT_RESPONSE_PUBLIC_KEY' | 'MERCHANT_RESPONSE_PRIVATE_KEY' | 'MERCHANT_CONFIG' | 'MERCHANT_CONFIG_TEXT' | 'SDK_KIT';
export type OpenApiKeyExportFormat = 'TEXT' | 'TXT' | 'PEM' | 'PROPERTIES' | 'ZIP';

export interface OpenApiKeyCopyResponse {
    content: string;
    expireSeconds: number;
}

export interface OpenApiKeyOperationLog {
    id: number;
    traceId?: string;
    requestId?: string;
    merchantId?: string;
    moduleName?: string;
    operationName?: string;
    businessType?: number;
    requestMethod?: string;
    operatorId?: string;
    operatorName?: string;
    operUrl?: string;
    operIp?: string;
    costTime?: number;
    status?: number;
    errorCode?: string;
    errorMsg?: string;
    operatedAt?: string;
}

export interface MerchantQuery extends PageQuery {
    merchantStatus?: number;
    keyword?: string;
    countryCode?: string;
    settlementCurrency?: string;
}

export type MerchantSaveRequest = Omit<MerchantInfo, 'id' | 'gmtCreate' | 'gmtModified' | 'jwtKey' | 'platformPayloadKey' | 'responseKey'>;

export async function searchMerchants(requestBody: MerchantQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantInfo>>>('/admin/merchants/search', requestBody);
    return unwrapResult(result.data);
}

export async function getMerchant(id: number) {
    const result = await http.get<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`);
    return unwrapResult(result.data);
}

export async function createMerchant(requestBody: MerchantSaveRequest) {
    const result = await http.post<CommonResult<MerchantInfo>>('/admin/merchants', requestBody);
    return unwrapResult(result.data);
}

export async function updateMerchant(id: number, requestBody: MerchantSaveRequest) {
    const result = await http.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`, requestBody);
    return unwrapResult(result.data);
}

export async function changeMerchantStatus(id: number, merchantStatus: number) {
    const result = await http.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/status`, { merchantStatus });
    return unwrapResult(result.data);
}

export async function provisionSecurityMaterial(merchantId: string) {
    const result = await http.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/security-material/provision`);
    return unwrapResult(result.data);
}

export async function getMerchantKeys(merchantId: string) {
    const result = await http.get<CommonResult<MerchantKeyBundle>>(`/admin/merchants/${encodeURIComponent(merchantId)}/keys`);
    return unwrapResult(result.data);
}

export async function getOpenApiKeyMaterialSummary(merchantId: string) {
    const result = await http.get<CommonResult<OpenApiKeyMaterialSummary>>(`/admin/openapi/merchant-keys/${encodeURIComponent(merchantId)}`);
    return unwrapResult(result.data);
}

export async function rotateJwtKey(merchantId: string) {
    const result = await http.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/jwt-key/rotate`);
    return unwrapResult(result.data);
}

export async function rotatePlatformPayloadKey(merchantId: string) {
    const result = await http.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/platform-payload-key/rotate`);
    return unwrapResult(result.data);
}

export async function rotateMerchantResponseKey(merchantId: string) {
    const result = await http.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/response-key/rotate`);
    return unwrapResult(result.data);
}

export async function updateMerchantResponseKey(merchantId: string, publicKeyX509Base64: string, privateKeyPkcs8Base64?: string) {
    const result = await http.put<CommonResult<MerchantInfo>>(`/admin/merchants/${encodeURIComponent(merchantId)}/response-key`, { publicKeyX509Base64, privateKeyPkcs8Base64, enabled: 1 });
    return unwrapResult(result.data);
}

export async function copyOpenApiKeyMaterial(merchantId: string, keyType: OpenApiKeyType, exportFormat: OpenApiKeyExportFormat = 'TEXT') {
    const result = await http.post<CommonResult<OpenApiKeyCopyResponse>>(`/admin/openapi/merchant-keys/${encodeURIComponent(merchantId)}/copy`, { keyType, exportFormat });
    return unwrapResult(result.data);
}

export async function viewOpenApiKeyMaterial(merchantId: string, keyType: OpenApiKeyType, exportFormat: OpenApiKeyExportFormat = 'TEXT') {
    const result = await http.post<CommonResult<OpenApiKeyCopyResponse>>(`/admin/openapi/merchant-keys/${encodeURIComponent(merchantId)}/view`, { keyType, exportFormat });
    return unwrapResult(result.data);
}

export async function downloadOpenApiKeyMaterial(merchantId: string, keyType: OpenApiKeyType, format?: OpenApiKeyExportFormat) {
    await downloadBlob(`/admin/openapi/merchant-keys/${encodeURIComponent(merchantId)}/download`, {
        params: { keyType, format },
        fileName: `${merchantId}-openapi-material`,
    });
}

export async function getOpenApiKeyMaterialLogs(merchantId: string, pageNo = 1, pageSize = 10) {
    const result = await http.post<CommonResult<PageResult<OpenApiKeyOperationLog>>>(
        `/admin/openapi/merchant-keys/${encodeURIComponent(merchantId)}/logs`,
        { pageNo, pageSize },
    );
    return unwrapResult(result.data);
}
