import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

/** Current merchant profile returned by the authenticated merchant API. */
export interface MerchantProfile {
    merchantId: string;
    merchantName: string;
    billingDescriptor: string;
    merchantShortName: string;
    merchantStatus: number;
    merchantCategoryCode: string;
    countryCode: string;
    regionCode?: string | null;
    city?: string | null;
    addressLine?: string | null;
    postalCode?: string | null;
    contactName?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    settlementCurrency: string;
    timezone: string;
    riskLevel: number;
    gmtCreate?: string | null;
    gmtModified?: string | null;
}

/** Fields that the authenticated merchant is allowed to maintain. */
export interface MerchantProfileUpdatePayload {
    billingDescriptor: string;
    merchantShortName: string;
    regionCode?: string | null;
    city?: string | null;
    addressLine?: string | null;
    postalCode?: string | null;
    contactName?: string | null;
    contactEmail: string;
    contactPhone?: string | null;
    timezone: string;
}

export const merchantInfoApi = {
    async getProfile() {
        const result = await http.get<CommonResult<MerchantProfile>>('/merchant/info');
        return unwrapResult(result.data);
    },
    async updateProfile(payload: MerchantProfileUpdatePayload) {
        const result = await http.put<CommonResult<MerchantProfile>>('/merchant/info', payload);
        return unwrapResult(result.data);
    },
};
