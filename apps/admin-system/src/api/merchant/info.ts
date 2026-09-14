import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

export interface MerchantInfo {
    id: string;
    merchantId: string;
    applicationNo?: string;
    onboardingSource?: string;
    onboardingStatus?: string;
    reviewStatus?: string;
    activationStatus?: string;
    merchantName: string;
    billingDescriptor?: string;
    merchantShortName?: string;
    merchantType?: string;
    merchantStatus: number;
    defaultLocale: 'zh-CN' | 'en-US';
    merchantCategoryCode: string;
    countryCode: string;
    operatingCountry?: string;
    businessType?: string;
    industryCategory?: string;
    merchantDescription?: string;
    registrationNumber?: string;
    legalEntityType?: string;
    incorporationDate?: string;
    incorporationCountry?: string;
    registeredState?: string;
    registeredCity?: string;
    registeredPostcode?: string;
    registeredAddress?: string;
    operatingSameAsRegistered?: boolean;
    taxId?: string;
    companySize?: string;
    employeeCount?: number;
    regionCode?: string;
    city?: string;
    addressLine?: string;
    postalCode?: string;
    contactName?: string;
    contactTitle?: string;
    phoneCountryCode?: string;
    contactEmail?: string;
    contactPhone?: string;
    alternateEmail?: string;
    financeContactName?: string;
    financeContactEmail?: string;
    technicalContactName?: string;
    technicalContactEmail?: string;
    businessModel?: string;
    salesChannels?: string[];
    productsServices?: string;
    targetMarkets?: string[];
    customerType?: string;
    transactionCurrencies?: string[];
    expectedMonthlyVolume?: number;
    expectedVolumeCurrency?: string;
    averageTicket?: number;
    maxTicket?: number;
    expectedMonthlyCount?: number;
    expectedRefundRate?: number;
    expectedChargebackRate?: number;
    recurringPaymentFlag?: boolean;
    presaleFlag?: boolean;
    fulfillmentDays?: number;
    digitalGoodsFlag?: boolean;
    restrictedBusinessFlag?: boolean;
    expectedGoLiveDate?: string;
    websiteUrl?: string;
    appStoreUrl?: string;
    googlePlayUrl?: string;
    otherSalesUrl?: string;
    websiteLanguages?: string[];
    websiteLiveFlag?: boolean;
    privacyPolicyUrl?: string;
    refundPolicyUrl?: string;
    termsUrl?: string;
    shippingPolicyUrl?: string;
    relatedPersons?: MerchantRelatedPerson[];
    documents?: MerchantDocument[];
    reviewRecords?: MerchantReviewRecord[];
    reviewSubmittable?: boolean;
    activationReady?: boolean;
    /** Stable readiness issue codes returned by the backend for locale-specific rendering. */
    readinessIssues?: string[];
    settlementCurrency: string;
    timezone: string;
    riskLevel: number;
    gmtCreate?: string;
    gmtModified?: string;
    jwtKey?: MerchantKeySummary;
    platformPayloadKey?: MerchantKeySummary;
    responseKey?: MerchantKeySummary;
    loginInitialized?: boolean;
    fundAccountNo?: string;
    fundAccountStatus?: string;
    currentFeeVersionNo?: number;
}

/** 商户法人、董事、UBO 与授权人资料；证件号仅在新增或换证时传明文。 */
export interface MerchantRelatedPerson {
    id?: string;
    fullName: string;
    personRoles: string[];
    nationality?: string;
    dateOfBirth?: string;
    residenceCountry?: string;
    residentialAddress?: string;
    idType?: string;
    idNumber?: string;
    idNumberMasked?: string;
    idExpiryDate?: string;
    ownershipPercentage?: number;
    controllerFlag?: boolean;
    pepFlag?: boolean;
    email?: string;
    phone?: string;
}

/** 商户合规资料元数据；对象存储位置不会暴露给前端。 */
export interface MerchantDocument {
    id: string;
    documentType: string;
    originalFilename: string;
    contentType: string;
    fileSize: number;
    sha256?: string;
    documentStatus?: string;
    gmtCreate?: string;
}

/** 商户开户审核轨迹。 */
export interface MerchantReviewRecord {
    id: string;
    reviewAction: string;
    fromStatus?: string;
    toStatus?: string;
    reviewComment?: string;
    operatorName?: string;
    gmtCreate?: string;
}

export interface MerchantReviewRequest {
    decision: 'PASS' | 'SUPPLEMENT' | 'REJECT';
    comment?: string;
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

export type MerchantSaveRequest = Omit<MerchantInfo,
    | 'id'
    | 'merchantId'
    | 'applicationNo'
    | 'onboardingSource'
    | 'onboardingStatus'
    | 'reviewStatus'
    | 'activationStatus'
    | 'documents'
    | 'reviewRecords'
    | 'reviewSubmittable'
    | 'activationReady'
    | 'readinessIssues'
    | 'gmtCreate'
    | 'gmtModified'
    | 'jwtKey'
    | 'platformPayloadKey'
    | 'responseKey'
    | 'loginInitialized'
    | 'fundAccountNo'
    | 'fundAccountStatus'
    | 'currentFeeVersionNo'> & {
    merchantId?: string;
};

export interface MerchantOptionNode {
    value: string;
    label: string;
    nameCn?: string;
    nameEn?: string;
    children?: MerchantOptionNode[];
}

export interface MerchantOptionItem {
    value: string;
    label: string;
    nameCn?: string;
    nameEn?: string;
    fractionDigits?: number;
    minimumAmount?: number | string;
}

export interface MerchantFormOptions {
    mccOptions: MerchantOptionNode[];
    countries: MerchantOptionItem[];
    currencies: MerchantOptionItem[];
}

export async function getMerchantFormOptions() {
    const result = await http.get<CommonResult<MerchantFormOptions>>('/admin/merchants/form-options');
    return unwrapResult(result.data);
}

export async function searchMerchants(requestBody: MerchantQuery) {
    const result = await http.post<CommonResult<PageResult<MerchantInfo>>>('/admin/merchants/search', requestBody);
    return unwrapResult(result.data);
}

export async function getMerchant(id: string) {
    const result = await http.get<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`);
    return unwrapResult(result.data);
}

export async function createMerchant(requestBody: MerchantSaveRequest) {
    const result = await http.post<CommonResult<MerchantInfo>>('/admin/merchants', requestBody);
    return unwrapResult(result.data);
}

export async function updateMerchant(id: string, requestBody: MerchantSaveRequest) {
    const result = await http.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}`, requestBody);
    return unwrapResult(result.data);
}

export async function changeMerchantStatus(id: string, merchantStatus: number) {
    const result = await http.put<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/status`, { merchantStatus });
    return unwrapResult(result.data);
}

export async function submitMerchantReview(id: string) {
    const result = await http.post<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/submit-review`);
    return unwrapResult(result.data);
}

export async function reviewMerchant(id: string, requestBody: MerchantReviewRequest) {
    const result = await http.post<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/review`, requestBody);
    return unwrapResult(result.data);
}

export async function activateMerchant(id: string) {
    const result = await http.post<CommonResult<MerchantInfo>>(`/admin/merchants/${id}/activate`);
    return unwrapResult(result.data);
}

export async function uploadMerchantDocument(merchantId: string, documentType: string, file: File) {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const result = await http.post<CommonResult<MerchantDocument>>(
        `/admin/merchants/${encodeURIComponent(merchantId)}/documents`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return unwrapResult(result.data);
}

export async function downloadMerchantDocument(merchantId: string, document: MerchantDocument) {
    await downloadBlob(
        `/admin/merchants/${encodeURIComponent(merchantId)}/documents/${document.id}/download`,
        { fileName: document.originalFilename || `${document.documentType}.bin` },
    );
}

export async function deleteMerchantDocument(merchantId: string, documentId: string) {
    const result = await http.delete<CommonResult<void>>(
        `/admin/merchants/${encodeURIComponent(merchantId)}/documents/${documentId}`,
    );
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
