import { unwrapResult, type CommonResult, type PageQuery, type PageResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { loadPrivateImageBlob } from '@/utils/download';

const resource = '/admin/risk/dispute-alert';

export const products = ['ETHOCA', 'RDR', 'CDRN', 'AMEX_INQUIRY'] as const;
export const midProducts = ['ETHOCA', 'RDR'] as const;
export const statuses = ['DRAFT', 'ENABLED', 'DISABLED'] as const;
export const enrollments = ['PENDING', 'CONFIRMED', 'REVOKED'] as const;
export const transports = ['HTTPS', 'SFTP_PULL', 'SFTP_DROP'] as const;
export const platformTypes = ['AGGREGATOR', 'ACQUIRER_PSP', 'NETWORK_DIRECT'] as const;
export const SHIELD_PLATFORM = 'VERXA_SHIELD';

export type AlertProduct = (typeof products)[number];
export type MidProduct = (typeof midProducts)[number];
export type AlertStatus = (typeof statuses)[number];
export type Enrollment = (typeof enrollments)[number];
export type AlertTransport = (typeof transports)[number];
export type AlertPlatformType = (typeof platformTypes)[number];
export type Coverage = 'PENDING' | 'CONFIRMED';

export interface AlertPlatformProduct {
    product: AlertProduct;
    coverage: Coverage;
    cardBrands: string[];
    enabled: boolean;
}

export interface PlatformInput {
    code: string;
    name: string;
    type: AlertPlatformType;
    evidence?: string | null;
    enabled: boolean;
    products: AlertPlatformProduct[];
    version?: number;
}

export interface AlertPlatform extends PlatformInput {
    id: number;
    version: number;
    logoVersion?: string | null;
}

export interface Delivery {
    transport: AlertTransport;
    host?: string | null;
    directory?: string | null;
    schedule?: string | null;
    sourceAuthentication?: string | null;
    outcomeUrl?: string | null;
}

export interface AccountProductInput {
    product: AlertProduct;
    status: AlertStatus;
    delivery: Delivery;
}

export interface AlertAccountProduct extends AccountProductInput {
    id: number;
    available: boolean;
}

export interface AccountInput {
    merchantNumber: string;
    status: AlertStatus;
}

interface CredentialSummary {
    publicKeyRegistered: boolean;
    privateKeyRegistered: boolean;
    version?: number | null;
}

export interface ProviderAccountConfig {
    values: Record<string, string | string[]>;
    registered: string[];
    activationValidated: boolean;
}

export interface ProviderAccountInput extends AccountInput {
    products: Pick<AccountProductInput, 'product' | 'status'>[];
    settings: ProviderAccountConfig['values'];
    credentials?: Record<string, string>;
}

export interface AlertAccount extends AccountInput {
    id: number;
    platformId: number;
    platformCode: string;
    platformName: string;
    version: number;
    credentials: CredentialSummary;
    products: AlertAccountProduct[];
    providerConfig?: ProviderAccountConfig | null;
}

export interface AlertMid {
    id: number;
    channelCode: string;
    channelMid: string;
    midName: string;
}

export interface SourceOption {
    accountProductId: number;
    accountId: number;
    platformId: number;
    platformName: string;
    merchantNumber: string;
    product: MidProduct;
}

export interface IdentityInput {
    type: 'ACQUIRER_MID' | 'BIN_CAID';
    acquirer: string;
    acquirerMid?: string;
    acquirerBin?: string;
    caid?: string;
    enabled: boolean;
}

export interface DescriptorInput {
    value: string;
    enabled: boolean;
}

export interface BindingInput {
    midConfigId: number;
    accountProductId: number;
    externalMerchantId: string;
    upstreamMerchantId: string;
    enrollment: Enrollment;
    enrollmentEvidence: string;
    identifiers: IdentityInput[];
    descriptors: DescriptorInput[];
    version?: number;
}

export interface BindingSummary {
    id: number;
    mid: AlertMid;
    source: SourceOption;
    externalMerchantId: string;
    upstreamMerchantId?: string | null;
    enrollment: Enrollment;
    enrollmentEvidence?: string | null;
    status: AlertStatus;
    sourceAvailable: boolean;
    effective: boolean;
    identifierCount: number;
    descriptorCount: number;
    version: number;
}

export interface BindingDetail {
    binding: BindingSummary;
    identifiers: IdentityInput[];
    descriptors: DescriptorInput[];
    overlappingMids: AlertMid[];
}

export interface AlertCardBrandOption {
    value: string;
    label: string;
    extraJson?: string;
}

/** Get enabled card brands using the alert-platform viewing permission. */
export async function listAlertCardBrandOptions(locale: string): Promise<AlertCardBrandOption[]> {
    const { data } = await http.get<CommonResult<AlertCardBrandOption[]>>(
        `${resource}/platforms/card-brand-options`, { params: { locale } },
    );
    return unwrapResult(data);
}

export async function listAlertPlatforms(): Promise<AlertPlatform[]> {
    const platforms: AlertPlatform[] = [];
    const pageSize = 100;
    for (let pageNo = 1; ; pageNo++) {
        const { data } = await http.get<CommonResult<PageResult<AlertPlatform>>>(`${resource}/platforms`, { params: { pageNo, pageSize } });
        const page = unwrapResult(data);
        platforms.push(...page.records);
        if (page.records.length < pageSize || platforms.length >= page.total) return platforms;
    }
}

export async function getAlertPlatform(id: number) {
    return unwrapResult((await http.get<CommonResult<AlertPlatform>>(`${resource}/platforms/${id}`)).data);
}

export function loadAlertPlatformLogo(id: number): Promise<Blob> {
    return loadPrivateImageBlob(`${resource}/platforms/${id}/logo`);
}

export async function saveAlertPlatform(id: number | undefined, input: PlatformInput, logo?: File | null, removeLogo = false) {
    const path = id ? `${resource}/platforms/${id}` : `${resource}/platforms`;
    if (logo || removeLogo) {
        const parts = new FormData();
        parts.append('metadata', new Blob([JSON.stringify(input)], { type: 'application/json' }));
        if (logo) parts.append('file', logo);
        if (id) parts.append('removeLogo', String(removeLogo));
        const response = id ? await http.put<CommonResult<AlertPlatform>>(`${path}/with-logo`, parts)
            : await http.post<CommonResult<AlertPlatform>>(`${path}/with-logo`, parts);
        return unwrapResult(response.data);
    }
    const response = id ? await http.put<CommonResult<AlertPlatform>>(path, input)
        : await http.post<CommonResult<AlertPlatform>>(path, input);
    return unwrapResult(response.data);
}

export async function listAlertAccounts(params: PageQuery & { platformId?: number; product?: AlertProduct; keyword?: string }) {
    return unwrapResult((await http.get<CommonResult<PageResult<AlertAccount>>>(`${resource}/accounts`, { params })).data);
}

export async function getAlertAccount(id: number) {
    return unwrapResult((await http.get<CommonResult<AlertAccount>>(`${resource}/accounts/${id}`)).data);
}

export async function createAlertAccount(input: AccountInput & { platformId: number; products: AccountProductInput[] }) {
    return unwrapResult((await http.post<CommonResult<AlertAccount>>(`${resource}/accounts`, input)).data);
}

export async function saveProviderAccount(input: ProviderAccountInput, platformId: number, existing?: Pick<AlertAccount, 'id' | 'version'>) {
    const path = `${resource}/accounts`;
    const response = existing
        ? await http.put<CommonResult<AlertAccount>>(`${path}/${existing.id}/provider`, { ...input, version: existing.version })
        : await http.post<CommonResult<AlertAccount>>(`${path}/provider`, { ...input, platformId });
    return unwrapResult(response.data);
}

export async function updateAlertAccount(id: number, input: AccountInput & { version: number }) {
    return unwrapResult((await http.put<CommonResult<AlertAccount>>(`${resource}/accounts/${id}`, input)).data);
}

export async function updateAlertAccountProduct(id: number, input: AccountProductInput & { version: number }) {
    const { product, ...body } = input;
    return unwrapResult((await http.put<CommonResult<AlertAccount>>(`${resource}/accounts/${id}/products/${product}`, body)).data);
}

export async function replaceAlertCredentials(id: number, input: { version: number; publicKey?: string; privateKey?: string }) {
    return unwrapResult((await http.put<CommonResult<CredentialSummary>>(`${resource}/accounts/${id}/credentials`, input)).data);
}

export async function listAlertMidChannels() {
    return unwrapResult((await http.get<CommonResult<string[]>>(`${resource}/mids/channels`)).data);
}

export async function listAlertMids(channelCode?: string, keyword?: string) {
    return unwrapResult((await http.get<CommonResult<AlertMid[]>>(`${resource}/mids`, { params: { channelCode, keyword } })).data);
}

export async function listAlertSources(midConfigId: number, product: MidProduct, keyword?: string) {
    return unwrapResult((await http.get<CommonResult<SourceOption[]>>(`${resource}/source-options`, { params: { midConfigId, product, keyword } })).data);
}

export async function listAlertBindings(params: PageQuery & { product?: MidProduct; status?: AlertStatus; keyword?: string }) {
    return unwrapResult((await http.get<CommonResult<PageResult<BindingSummary>>>(`${resource}/mid-bindings`, { params })).data);
}

export async function getAlertBinding(id: number) {
    return unwrapResult((await http.get<CommonResult<BindingDetail>>(`${resource}/mid-bindings/${id}`)).data);
}

export async function saveAlertBinding(id: number | undefined, input: BindingInput) {
    const response = id ? await http.put<CommonResult<BindingDetail>>(`${resource}/mid-bindings/${id}`, input)
        : await http.post<CommonResult<BindingDetail>>(`${resource}/mid-bindings`, input);
    return unwrapResult(response.data);
}

export async function updateAlertBindingStatus(id: number, version: number, status: 'ENABLED' | 'DISABLED') {
    return unwrapResult((await http.put<CommonResult<BindingDetail>>(`${resource}/mid-bindings/${id}/status`, { version, status })).data);
}
