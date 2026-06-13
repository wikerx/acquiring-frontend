import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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

export interface MerchantQuery extends PageQuery {
    merchantStatus?: number;
    keyword?: string;
    countryCode?: string;
    settlementCurrency?: string;
}

export type MerchantSaveRequest = Omit<MerchantInfo, 'id' | 'gmtCreate' | 'gmtModified' | 'jwtKey' | 'platformPayloadKey' | 'responseKey'>;

export async function searchMerchants(requestBody: MerchantQuery) {
    const result = await request.post<CommonResult<PageResult<MerchantInfo>>>('/admin/merchants/search', requestBody) as unknown as CommonResult<PageResult<MerchantInfo>>;
    return unwrapResult(result);
}

export async function getMerchant(id: number) {
    const result = await request.get<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`) as unknown as CommonResult<MerchantInfo>;
    return unwrapResult(result);
}

export async function createMerchant(requestBody: MerchantSaveRequest) {
    const result = await request.post<CommonResult<MerchantInfo>>('/admin/merchants', requestBody) as unknown as CommonResult<MerchantInfo>;
    return unwrapResult(result);
}

export async function updateMerchant(id: number, requestBody: MerchantSaveRequest) {
    const result = await request.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`, requestBody) as unknown as CommonResult<MerchantInfo>;
    return unwrapResult(result);
}

export async function changeMerchantStatus(id: number, merchantStatus: number) {
    const result = await request.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/status`, { merchantStatus }) as unknown as CommonResult<MerchantInfo>;
    return unwrapResult(result);
}

export async function provisionSecurityMaterial(merchantId: string) {
    const result = await request.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/security-material/provision`) as unknown as CommonResult<MerchantSecurityMaterial>;
    return unwrapResult(result);
}

export async function getMerchantKeys(merchantId: string) {
    const result = await request.get<CommonResult<MerchantKeyBundle>>(`/admin/merchants/${encodeURIComponent(merchantId)}/keys`) as unknown as CommonResult<MerchantKeyBundle>;
    return unwrapResult(result);
}

export async function rotateJwtKey(merchantId: string) {
    const result = await request.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/jwt-key/rotate`) as unknown as CommonResult<MerchantSecurityMaterial>;
    return unwrapResult(result);
}

export async function rotatePlatformPayloadKey(merchantId: string) {
    const result = await request.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/platform-payload-key/rotate`) as unknown as CommonResult<MerchantSecurityMaterial>;
    return unwrapResult(result);
}

export async function rotateMerchantResponseKey(merchantId: string) {
    const result = await request.post<CommonResult<MerchantSecurityMaterial>>(`/admin/merchants/${encodeURIComponent(merchantId)}/response-key/rotate`) as unknown as CommonResult<MerchantSecurityMaterial>;
    return unwrapResult(result);
}

export async function updateMerchantResponseKey(merchantId: string, publicKeyX509Base64: string, privateKeyPkcs8Base64?: string) {
    const result = await request.put<CommonResult<MerchantInfo>>(`/admin/merchants/${encodeURIComponent(merchantId)}/response-key`, { publicKeyX509Base64, privateKeyPkcs8Base64, enabled: 1 }) as unknown as CommonResult<MerchantInfo>;
    return unwrapResult(result);
}
