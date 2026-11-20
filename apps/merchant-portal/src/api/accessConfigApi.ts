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
    createTime?: string;
    updateTime?: string;
}

export interface MerchantIpWhitelistItem extends MerchantAccessConfigBaseItem {
    ipType?: string;
    ipValue: string;
    gmtCreate?: string;
    gmtModified?: string;
}

export type MerchantAccessCheckStatus = 'READY' | 'PENDING_REVIEW' | 'ACTION_REQUIRED' | 'NOT_REQUIRED';

export interface MerchantCredentialCheck {
    status: MerchantAccessCheckStatus;
    jwtKeyStatus?: string;
    platformPayloadKeyStatus?: string;
    merchantResponseKeyStatus?: string;
    merchantResponsePrivateKeyAvailable: boolean;
    lastUpdatedTime?: string;
}

export interface MerchantAccessRuleCheck {
    status: MerchantAccessCheckStatus;
    required: boolean;
    enabled: boolean;
    totalCount: number;
    activeCount: number;
    pendingCount: number;
    rejectedCount: number;
    disabledCount: number;
    lastUpdatedTime?: string;
}

export interface MerchantProfileCheck {
    status: MerchantAccessCheckStatus;
    onboardingStatus?: string;
    reviewStatus?: string;
    activationStatus?: string;
    lastUpdatedTime?: string;
}

export interface MerchantSettlementCheck {
    status: MerchantAccessCheckStatus;
    settlementCurrency?: string;
    businessTimeZone?: string;
    dailyCutoffTime?: string;
    processingMode?: string;
    initialDelayUnit?: string;
    initialDelayDays?: number;
    regularDelayDays?: number;
    settlementFrequency?: string;
    frequencyDay?: number;
    lastUpdatedTime?: string;
}

export interface MerchantPaymentCapability {
    paymentType: string;
    paymentMethod: string;
    currency: string;
}

export interface MerchantPaymentCapabilityCheck {
    assessmentStatus?: 'EVALUATED' | 'HISTORY_PENDING' | 'UNAVAILABLE';
    authorizedCount?: number | null;
    legacyCoverageCount?: number | null;
    configurationReadyCount?: number | null;
    pendingConfigurationCount?: number | null;
    restrictedCount?: number | null;
    executionReadyCount?: number | null;
    assessedAt?: string | null;
    status: MerchantAccessCheckStatus;
    activeBindingCount: number;
    capabilities: MerchantPaymentCapability[];
    lastUpdatedTime?: string;
}

export interface MerchantPlatformConfigurationCheck {
    status: MerchantAccessCheckStatus;
    activeVersionNo?: number;
    riskLevel?: number;
    lastUpdatedTime?: string;
}

export interface MerchantAccessOverview {
    overallStatus: Exclude<MerchantAccessCheckStatus, 'NOT_REQUIRED'>;
    completedRequiredChecks: number;
    requiredCheckCount: number;
    openApiBaseUrl?: string;
    sdkVersion?: string;
    cryptoMode?: string;
    merchantProfile: MerchantProfileCheck;
    settlement: MerchantSettlementCheck;
    paymentCapability: MerchantPaymentCapabilityCheck;
    fee: MerchantPlatformConfigurationCheck;
    risk: MerchantPlatformConfigurationCheck;
    technicalStatus: Exclude<MerchantAccessCheckStatus, 'NOT_REQUIRED'>;
    credentials: MerchantCredentialCheck;
    ipWhitelist: MerchantAccessRuleCheck;
    sourceUrl: MerchantAccessRuleCheck;
}

export const accessConfigApi = {
    async overview() {
        const result = await http.get<CommonResult<MerchantAccessOverview>>('/merchant/access-config/overview');
        return unwrapResult(result.data);
    },
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
