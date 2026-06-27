import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';

export type MccNodeType = 'LEVEL1' | 'LEVEL2' | 'MCC_CODE';
export type MccApplyScope = 'ALL' | 'SPECIFIC';

export interface MccTreeNode {
    nodeKey: string;
    nodeType: MccNodeType;
    id: number;
    parentNodeKey?: string;
    level: number;
    code?: string;
    nameCn?: string;
    nameEn?: string;
    label?: string;
    mccCode?: string;
    mccNameCn?: string;
    mccNameEn?: string;
    riskLevel?: string;
    mccType?: string;
    deliveryApplicability?: string;
    source?: string;
    versionNo?: string;
    effectiveTime?: string;
    expireTime?: string;
    remark?: string;
    status?: number;
    sortNo?: number;
    createTime?: string;
    updateTime?: string;
    children?: MccTreeNode[];
}

export interface MccTreeQuery {
    keyword?: string;
    mccCode?: string;
    nameCn?: string;
    nameEn?: string;
    nodeType?: string;
    riskLevel?: string;
    status?: number;
}

export interface MccCategorySaveRequest {
    id?: number;
    nodeType: Exclude<MccNodeType, 'MCC_CODE'>;
    parentId?: number;
    categoryCode: string;
    nameCn: string;
    nameEn: string;
    sortNo?: number;
    status?: number;
    remark?: string;
}

export interface MccCodeSaveRequest {
    id?: number;
    mccCode: string;
    nameCn: string;
    nameEn: string;
    level1Id: number;
    level2Id: number;
    mccType: string;
    riskLevel: string;
    deliveryApplicability?: string;
    source?: string;
    versionNo?: string;
    effectiveTime?: string;
    expireTime?: string;
    sortNo?: number;
    status?: number;
    remark?: string;
}

export interface MccCodeDetail extends MccCodeSaveRequest {
    id: number;
    level1Name?: string;
    level2Name?: string;
    createTime?: string;
    updateTime?: string;
}

export interface MccRiskPolicyQuery extends PageQuery {
    mccCode?: string;
    mccName?: string;
    cardScheme?: string;
    channelScope?: MccApplyScope;
    channelCode?: string;
    countryScope?: MccApplyScope;
    countryCode?: string;
    riskLevel?: string;
    allowOnboarding?: number;
    allowAcquiring?: number;
    requireEnhancedReview?: number;
    status?: number;
}

export interface MccRiskPolicySaveRequest {
    id?: number;
    mccCode: string;
    cardSchemes: string[];
    selectAllCardSchemes?: boolean;
    channelScope: MccApplyScope;
    channelCode?: string;
    countryScope: MccApplyScope;
    countryCode?: string;
    riskLevel: string;
    allowOnboarding?: number;
    allowAcquiring?: number;
    requireEnhancedReview?: number;
    status?: number;
    remark?: string;
}

export interface MccRiskPolicy {
    id: number;
    mccCode: string;
    mccNameCn?: string;
    mccNameEn?: string;
    cardScheme: string;
    cardSchemeName?: string;
    channelScope: MccApplyScope;
    channelCode?: string;
    countryScope: MccApplyScope;
    countryCode?: string;
    countryNameCn?: string;
    countryNameEn?: string;
    riskLevel: string;
    allowOnboarding?: number;
    allowAcquiring?: number;
    requireEnhancedReview?: number;
    status?: number;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface MccOverview {
    level1Count: number;
    level2Count: number;
    mccCodeCount: number;
    enabledMccCodeCount: number;
    riskPolicyCount: number;
    highRiskPolicyCount: number;
}

export interface MccOption {
    id: number;
    code: string;
    label: string;
    nameCn?: string;
    nameEn?: string;
    nodeType?: string;
    parentId?: number;
}

export interface MccOptions {
    level1: MccOption[];
    level2: MccOption[];
    mccCodes: MccOption[];
    cardSchemes: MccOption[];
    countries: MccOption[];
}

export async function getMccTree(requestBody: MccTreeQuery = {}) {
    const result = await http.post<CommonResult<MccTreeNode[]>>('/admin/base/mcc/tree', requestBody);
    return unwrapResult(result.data);
}

export async function addMccCategory(requestBody: MccCategorySaveRequest) {
    const result = await http.post<CommonResult<MccTreeNode>>('/admin/base/mcc/category/add', requestBody);
    return unwrapResult(result.data);
}

export async function editMccCategory(requestBody: MccCategorySaveRequest) {
    const result = await http.post<CommonResult<MccTreeNode>>('/admin/base/mcc/category/edit', requestBody);
    return unwrapResult(result.data);
}

export async function updateMccCategoryStatus(id: number, nodeType: MccNodeType, status: number) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/category/status', { id, nodeType, status });
    return unwrapResult(result.data);
}

export async function deleteMccCategory(id: number, nodeType: MccNodeType) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/category/delete', { id, nodeType });
    return unwrapResult(result.data);
}

export async function addMccCode(requestBody: MccCodeSaveRequest) {
    const result = await http.post<CommonResult<MccCodeDetail>>('/admin/base/mcc/code/add', requestBody);
    return unwrapResult(result.data);
}

export async function editMccCode(requestBody: MccCodeSaveRequest) {
    const result = await http.post<CommonResult<MccCodeDetail>>('/admin/base/mcc/code/edit', requestBody);
    return unwrapResult(result.data);
}

export async function getMccCodeDetail(id: number) {
    const result = await http.post<CommonResult<MccCodeDetail>>('/admin/base/mcc/code/detail', { id });
    return unwrapResult(result.data);
}

export async function updateMccCodeStatus(id: number, status: number) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/code/status', { id, status });
    return unwrapResult(result.data);
}

export async function deleteMccCode(id: number) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/code/delete', { id });
    return unwrapResult(result.data);
}

export async function exportMccCodes(requestBody: MccTreeQuery = {}) {
    await downloadExcel('/admin/base/mcc/code/export', {
        method: 'post',
        data: requestBody,
        fileName: 'mcc-codes.xlsx',
    });
}

export async function pageMccPolicies(requestBody: MccRiskPolicyQuery = {}) {
    const result = await http.post<CommonResult<PageResult<MccRiskPolicy>>>('/admin/base/mcc/policy/page', requestBody);
    return unwrapResult(result.data);
}

export async function addMccPolicies(requestBody: MccRiskPolicySaveRequest) {
    const result = await http.post<CommonResult<MccRiskPolicy[]>>('/admin/base/mcc/policy/add', requestBody);
    return unwrapResult(result.data);
}

export async function editMccPolicy(requestBody: MccRiskPolicySaveRequest) {
    const result = await http.post<CommonResult<MccRiskPolicy>>('/admin/base/mcc/policy/edit', requestBody);
    return unwrapResult(result.data);
}

export async function updateMccPolicyStatus(id: number, status: number) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/policy/status', { id, status });
    return unwrapResult(result.data);
}

export async function deleteMccPolicy(id: number) {
    const result = await http.post<CommonResult<void>>('/admin/base/mcc/policy/delete', { id });
    return unwrapResult(result.data);
}

export async function getMccOverview() {
    const result = await http.post<CommonResult<MccOverview>>('/admin/base/mcc/overview');
    return unwrapResult(result.data);
}

export async function getMccOptions() {
    const result = await http.post<CommonResult<MccOptions>>('/admin/base/mcc/options');
    return unwrapResult(result.data);
}
