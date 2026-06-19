import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

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
