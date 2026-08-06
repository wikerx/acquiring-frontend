import type { CommonResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface MerchantAccessConfigBaseItem {
    id: string;
    merchantId: string;
    status: number;
    approvalStatus: number;
    approvalRemark?: string;
    submitSource: string;
    reviewBy?: string;
    reviewTime?: string;
    remark?: string;
}

export interface MerchantSourceUrlItem extends MerchantAccessConfigBaseItem {
    sourceUrl: string;
    sourceHost?: string;
    createTime?: string;
    updateTime?: string;
}

export interface MerchantIpWhitelistItem extends MerchantAccessConfigBaseItem {
    ipType?: string;
    ipValue: string;
    gmtCreate?: string;
    gmtModified?: string;
}

export const accessConfigApi = {
    async listSourceUrls() {
        const result = await http.get<CommonResult<MerchantSourceUrlItem[]>>('/merchant/access-config/source-urls');
        return unwrapResult(result.data);
    },
    async submitSourceUrls(sourceUrls: string[], remark?: string) {
        const result = await http.post<CommonResult<MerchantSourceUrlItem[]>>('/merchant/access-config/source-urls', { sourceUrls, remark });
        return unwrapResult(result.data);
    },
    async listIpWhitelists() {
        const result = await http.get<CommonResult<MerchantIpWhitelistItem[]>>('/merchant/access-config/ip-whitelists');
        return unwrapResult(result.data);
    },
    async submitIpWhitelists(ipValues: string[], remark?: string) {
        const result = await http.post<CommonResult<MerchantIpWhitelistItem[]>>('/merchant/access-config/ip-whitelists', { ipValues, remark });
        return unwrapResult(result.data);
    },
};
