import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface ChannelAlertRule {
    id: number;
    ruleCode: string;
    ruleGroupCode?: string;
    ruleName: string;
    channelId: number;
    channelCode: string;
    channelName?: string;
    businessType: string;
    paymentMethod: string;
    cardBrand: string;
    ruleType: string;
    windowMinutes: number;
    thresholdCount?: number;
    thresholdRate?: number;
    thresholdMillis?: number;
    minimumSampleCount?: number;
    alertLevel: string;
    ruleDescription?: string;
    autoDegrade: number;
    autoCircuitBreak: number;
    ruleStatus: number;
    notifyType: string;
    emailRecipients: string;
    emailCc?: string;
    emailTemplateCode?: string;
    emailSceneCode?: string;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface ChannelAlertRuleQuery extends PageQuery {
    channelId?: number;
    channelCode?: string;
    businessType?: string;
    paymentMethod?: string;
    cardBrand?: string;
    ruleType?: string;
    alertLevel?: string;
    ruleStatus?: number;
    ruleName?: string;
}

export type ChannelAlertRuleSaveRequest = Partial<ChannelAlertRule>;

export interface ChannelAlertRuleItem {
    id?: number;
    ruleType: string;
    windowMinutes: number;
    thresholdCount?: number;
    thresholdRate?: number;
    thresholdMillis?: number;
    minimumSampleCount?: number;
    alertLevel: string;
    ruleDescription?: string;
    autoDegrade?: number;
    autoCircuitBreak?: number;
}

export interface ChannelAlertRuleBatchSaveRequest {
    ruleName: string;
    channelId?: number;
    businessType: string;
    paymentMethod: string;
    cardBrands: string[];
    rules: ChannelAlertRuleItem[];
    notifyType: string;
    emailRecipients: string;
    emailCc?: string;
    emailTemplateCode?: string;
    emailSceneCode?: string;
    ruleStatus?: number;
    remark?: string;
}

export interface ChannelAlertRuleDimensionSaveRequest extends ChannelAlertRuleBatchSaveRequest {
    retainedRuleIds?: number[];
}

export interface ChannelAlertRuleDimension {
    ruleName: string;
    channelId: number;
    channelCode: string;
    channelName?: string;
    businessType: string;
    paymentMethod: string;
    cardBrands: string[];
    rules: ChannelAlertRule[];
    notifyType: string;
    emailRecipients: string;
    emailCc?: string;
    emailTemplateCode?: string;
    emailSceneCode?: string;
    ruleStatus?: number;
    remark?: string;
}

export interface ChannelAlertPaymentMethodOption {
    businessType: string;
    paymentMethod: string;
    cardBrands: string[];
}

export interface ChannelAlertUserEmailOption {
    accountId: number;
    loginAccount: string;
    realName?: string;
    email: string;
}

export interface ChannelAlertEmailTemplateOption {
    id?: number;
    templateCode: string;
    templateName?: string;
    sceneCode: string;
    locale?: string;
}

export interface ChannelAlertRuleOptions {
    businessTypes: string[];
    paymentMethods: ChannelAlertPaymentMethodOption[];
    cardBrands: string[];
    userEmails: ChannelAlertUserEmailOption[];
    emailTemplates: ChannelAlertEmailTemplateOption[];
    emailSceneCodes: string[];
}

export interface ChannelAlertEvent {
    id: number;
    eventCode: string;
    ruleId: number;
    ruleCode: string;
    ruleName: string;
    channelId: number;
    channelCode: string;
    channelName?: string;
    businessType: string;
    paymentMethod: string;
    cardBrand: string;
    ruleType: string;
    alertLevel: string;
    windowMinutes: number;
    windowStartTime?: string;
    windowEndTime?: string;
    sampleCount?: number;
    failureCount?: number;
    successCount?: number;
    successRate?: number;
    errorRate?: number;
    maxContinuousFailureCount?: number;
    averageLatencyMillis?: number;
    triggerValueCount?: number;
    triggerValueRate?: number;
    triggerValueMillis?: number;
    thresholdSnapshot?: string;
    eventStatus: string;
    notifyStatus: string;
    triggerTime?: string;
    acknowledgedTime?: string;
    acknowledgedBy?: string;
    remark?: string;
    createTime?: string;
    updateTime?: string;
}

export interface ChannelAlertEventQuery extends PageQuery {
    eventCode?: string;
    ruleId?: number;
    ruleCode?: string;
    ruleName?: string;
    channelId?: number;
    channelCode?: string;
    businessType?: string;
    paymentMethod?: string;
    cardBrand?: string;
    ruleType?: string;
    alertLevel?: string;
    eventStatus?: string;
    triggerStartTime?: string;
    triggerEndTime?: string;
}

export interface ChannelAlertNotifyLog {
    id: number;
    eventId: number;
    eventCode: string;
    ruleId: number;
    ruleCode: string;
    notifyType: string;
    notifyStatus: string;
    emailRecipients?: string;
    emailCc?: string;
    emailTemplateCode?: string;
    emailSceneCode?: string;
    sendStartTime?: string;
    sendEndTime?: string;
    failReason?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface ChannelAlertNotifyLogQuery extends PageQuery {
    eventId?: number;
    eventCode?: string;
    ruleId?: number;
    ruleCode?: string;
    notifyType?: string;
    notifyStatus?: string;
    createStartTime?: string;
    createEndTime?: string;
}

export async function searchChannelAlertRules(data: ChannelAlertRuleQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelAlertRule>>>('/admin/channel/alert-rules/search', data);
    return unwrapResult(result.data);
}

export async function getChannelAlertRule(id: number) {
    const result = await http.get<CommonResult<ChannelAlertRule>>(`/admin/channel/alert-rules/${id}`);
    return unwrapResult(result.data);
}

export async function getChannelAlertRuleOptions(params: { channelId?: number; businessType?: string; keyword?: string }) {
    const result = await http.get<CommonResult<ChannelAlertRuleOptions>>('/admin/channel/alert-rules/options', { params });
    return unwrapResult(result.data);
}

export async function getChannelAlertRuleDimension(id: number) {
    const result = await http.get<CommonResult<ChannelAlertRuleDimension>>(`/admin/channel/alert-rules/${id}/dimension`);
    return unwrapResult(result.data);
}

export async function createChannelAlertRule(data: ChannelAlertRuleSaveRequest) {
    const result = await http.post<CommonResult<ChannelAlertRule>>('/admin/channel/alert-rules', data);
    return unwrapResult(result.data);
}

export async function createChannelAlertRules(data: ChannelAlertRuleBatchSaveRequest) {
    const result = await http.post<CommonResult<ChannelAlertRule[]>>('/admin/channel/alert-rules/batch', data);
    return unwrapResult(result.data);
}

export async function updateChannelAlertRule(id: number, data: ChannelAlertRuleSaveRequest) {
    const result = await http.put<CommonResult<ChannelAlertRule>>(`/admin/channel/alert-rules/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateChannelAlertRuleDimension(id: number, data: ChannelAlertRuleDimensionSaveRequest) {
    const result = await http.put<CommonResult<ChannelAlertRuleDimension>>(`/admin/channel/alert-rules/${id}/dimension`, data);
    return unwrapResult(result.data);
}

export async function updateChannelAlertRuleStatus(id: number, status: number) {
    const result = await http.put<CommonResult<ChannelAlertRule>>(`/admin/channel/alert-rules/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function deleteChannelAlertRule(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/alert-rules/${id}`);
    return unwrapResult(result.data);
}

export async function searchChannelAlertEvents(data: ChannelAlertEventQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelAlertEvent>>>('/admin/channel/alert-events/search', data);
    return unwrapResult(result.data);
}

export async function getChannelAlertEvent(id: number) {
    const result = await http.get<CommonResult<ChannelAlertEvent>>(`/admin/channel/alert-events/${id}`);
    return unwrapResult(result.data);
}

export async function acknowledgeChannelAlertEvent(id: number, remark?: string) {
    const result = await http.put<CommonResult<ChannelAlertEvent>>(`/admin/channel/alert-events/${id}/acknowledge`, { remark });
    return unwrapResult(result.data);
}

export async function deleteChannelAlertEvent(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/channel/alert-events/${id}`);
    return unwrapResult(result.data);
}

export async function searchChannelAlertNotifyLogs(data: ChannelAlertNotifyLogQuery) {
    const result = await http.post<CommonResult<PageResult<ChannelAlertNotifyLog>>>('/admin/channel/alert-notify-logs/search', data);
    return unwrapResult(result.data);
}
