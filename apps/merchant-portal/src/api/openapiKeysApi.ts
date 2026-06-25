import type { CommonResult, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export type OpenApiKeyType = 'JWT_KEY' | 'PLATFORM_PUBLIC_KEY' | 'MERCHANT_RESPONSE_PRIVATE_KEY' | 'MERCHANT_RESPONSE_KEY' | 'MERCHANT_CONFIG' | 'MERCHANT_CONFIG_TEXT' | 'SDK_KIT';
export type OpenApiKeyExportFormat = 'TEXT' | 'TXT' | 'PEM' | 'PROPERTIES' | 'ZIP';

export interface OpenApiMerchantKeyMaterial {
    merchantId: string;
    merchantName: string;
    openApiBaseUrl: string;
    sdkVersion: string;
    cryptoMode: string;
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

export interface OpenApiKeyCopyResponse {
    content: string;
    expireSeconds: number;
}

export interface OpenApiKeyOperationLog {
    id: number;
    traceId?: string;
    merchantId: string;
    moduleName: string;
    operationName: string;
    businessType?: number;
    requestMethod?: string;
    operatorName?: string;
    operUrl?: string;
    operIp?: string;
    costTime?: number;
    status?: number;
    errorCode?: string;
    errorMsg?: string;
    operatedAt?: string;
}

export const openapiKeysApi = {
    async material() {
        const result = await http.get<CommonResult<OpenApiMerchantKeyMaterial>>('/merchant/openapi/keys');
        return unwrapResult(result.data);
    },
    async copy(keyType: OpenApiKeyType, exportFormat: OpenApiKeyExportFormat = 'TEXT') {
        const result = await http.post<CommonResult<OpenApiKeyCopyResponse>>('/merchant/openapi/keys/copy', { keyType, exportFormat });
        return unwrapResult(result.data);
    },
    async download(keyType: OpenApiKeyType, format?: OpenApiKeyExportFormat) {
        await downloadBlob('/merchant/openapi/keys/download', {
            params: { keyType, format },
            fileName: 'merchant-openapi-material',
        });
    },
    async rotate(keyType: OpenApiKeyType) {
        const result = await http.post<CommonResult<OpenApiMerchantKeyMaterial>>('/merchant/openapi/keys/rotate', { keyType });
        return unwrapResult(result.data);
    },
    async logs(pageNo = 1, pageSize = 10) {
        const result = await http.get<CommonResult<PageResult<OpenApiKeyOperationLog>>>('/merchant/openapi/keys/logs', {
            params: { pageNo, pageSize },
        });
        return unwrapResult(result.data);
    },
};
