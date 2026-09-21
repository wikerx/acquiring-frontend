import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadBlob } from '@/utils/download';

/** Current merchant low-risk profile returned by the authenticated API. */
export interface MerchantProfile {
    merchantId: string;
    merchantName: string;
    billingDescriptor?: string | null;
    merchantShortName: string;
    merchantStatus: number;
    defaultLocale: 'zh-CN' | 'en-US';
    merchantCategoryCode: string;
    countryCode: string;
    regionCode?: string | null;
    city?: string | null;
    addressLine?: string | null;
    postalCode?: string | null;
    contactName?: string | null;
    contactTitle?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    alternateEmail?: string | null;
    financeContactName?: string | null;
    financeContactEmail?: string | null;
    technicalContactName?: string | null;
    technicalContactEmail?: string | null;
    settlementCurrency: string;
    timezone: string;
    riskLevel: number;
    gmtCreate?: string | null;
    gmtModified?: string | null;
}

/** Low-risk fields that take effect immediately without compliance review. */
export interface MerchantProfileUpdatePayload {
    merchantShortName: string;
    contactName?: string | null;
    contactTitle?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    alternateEmail?: string | null;
    financeContactName?: string | null;
    financeContactEmail?: string | null;
    technicalContactName?: string | null;
    technicalContactEmail?: string | null;
    defaultLocale: 'zh-CN' | 'en-US';
    timezone: string;
}

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

/** High-risk profile fields that only take effect after admin approval. */
export interface MerchantProfileSnapshot {
    merchantName: string;
    billingDescriptor?: string;
    merchantType: string;
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
    businessModel?: string;
    salesChannels: string[];
    productsServices?: string;
    targetMarkets: string[];
    customerType?: string;
    transactionCurrencies: string[];
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
    websiteLanguages: string[];
    websiteLiveFlag?: boolean;
    privacyPolicyUrl?: string;
    refundPolicyUrl?: string;
    termsUrl?: string;
    shippingPolicyUrl?: string;
    relatedPersons: MerchantRelatedPerson[];
    capturedAt?: string;
}

export interface MerchantProfileChangeRequest {
    requestNo: string;
    merchantId: string;
    status: 'DRAFT' | 'PENDING_REVIEW' | 'SUPPLEMENT_REQUIRED' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
    changedFields: string[];
    proposedProfile?: MerchantProfileSnapshot;
    submitComment?: string;
    reviewComment?: string;
    submittedAt?: string;
    reviewedAt?: string;
    gmtCreate?: string;
    gmtModified?: string;
}

export interface MerchantProfileDocument {
    id: string;
    requestNo?: string;
    documentType: string;
    originalFilename: string;
    contentType: string;
    fileSize: number;
    sha256?: string;
    documentStatus?: string;
    gmtCreate?: string;
}

export interface MerchantProfileWorkspace {
    currentProfile: MerchantProfileSnapshot;
    activeRequest?: MerchantProfileChangeRequest;
    requestHistory: MerchantProfileChangeRequest[];
    documents: MerchantProfileDocument[];
    completenessIssues: string[];
    completenessPercent: number;
}

export const merchantInfoApi = {
    async getProfile() {
        const result = await http.get<CommonResult<MerchantProfile>>('/merchant/info');
        return unwrapResult(result.data);
    },
    async getWorkspace() {
        const result = await http.get<CommonResult<MerchantProfileWorkspace>>('/merchant/info/workspace');
        return unwrapResult(result.data);
    },
    async updateProfile(payload: MerchantProfileUpdatePayload) {
        const result = await http.put<CommonResult<MerchantProfile>>('/merchant/info', payload);
        return unwrapResult(result.data);
    },
    async saveDraft(payload: MerchantProfileSnapshot) {
        const result = await http.post<CommonResult<MerchantProfileChangeRequest>>(
            '/merchant/info/change-requests/draft',
            payload,
        );
        return unwrapResult(result.data);
    },
    async submitChangeRequest(requestNo: string, comment?: string) {
        const result = await http.post<CommonResult<MerchantProfileChangeRequest>>(
            `/merchant/info/change-requests/${encodeURIComponent(requestNo)}/submit`,
            { comment },
        );
        return unwrapResult(result.data);
    },
    async withdrawChangeRequest(requestNo: string) {
        const result = await http.post<CommonResult<MerchantProfileChangeRequest>>(
            `/merchant/info/change-requests/${encodeURIComponent(requestNo)}/withdraw`,
        );
        return unwrapResult(result.data);
    },
    async uploadDocument(requestNo: string, documentType: string, file: File) {
        const formData = new FormData();
        formData.append('documentType', documentType);
        formData.append('file', file);
        const result = await http.post<CommonResult<MerchantProfileDocument>>(
            `/merchant/info/change-requests/${encodeURIComponent(requestNo)}/documents`,
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        return unwrapResult(result.data);
    },
    async downloadDocument(requestNo: string, document: MerchantProfileDocument) {
        await downloadBlob(
            `/merchant/info/change-requests/${encodeURIComponent(requestNo)}/documents/${document.id}/download`,
            { fileName: document.originalFilename || `${document.documentType}.bin` },
        );
    },
    async deleteDocument(requestNo: string, documentId: string) {
        const result = await http.delete<CommonResult<void>>(
            `/merchant/info/change-requests/${encodeURIComponent(requestNo)}/documents/${documentId}`,
        );
        return unwrapResult(result.data);
    },
};
