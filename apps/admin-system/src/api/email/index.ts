import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';

export interface EmailAccount {
    id: number;
    accountCode: string;
    accountName: string;
    appCode: string;
    scopeType: string;
    merchantId?: string;
    merchantNo?: string;
    merchantName?: string;
    sceneCode?: string;
    providerType?: string;
    fromName: string;
    fromEmail: string;
    replyToEmail?: string;
    smtpHost: string;
    smtpPort: number;
    encryptionType: string;
    smtpAuthRequired: number;
    smtpUsername: string;
    smtpPassword?: string;
    passwordConfigured?: number;
    passwordUpdatedTime?: string;
    connectTimeoutMs?: number;
    readTimeoutMs?: number;
    defaultFlag?: number;
    status?: number;
    verifyStatus?: number;
    lastTestTime?: string;
    lastErrorMessage?: string;
    minuteLimit?: number;
    dailyLimit?: number;
    remark?: string;
    sortOrder?: number;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface EmailAccountQuery extends PageQuery {
    accountName?: string;
    appCode?: string;
    scopeType?: string;
    merchantId?: string;
    merchantName?: string;
    fromEmail?: string;
    sceneCode?: string;
    status?: number;
    verifyStatus?: number;
}

export interface EmailAccountTestRequest {
    toEmail: string;
    subject?: string;
    content?: string;
}

export interface EmailTemplate {
    id: number;
    templateCode: string;
    templateName: string;
    appCode: string;
    sceneCode: string;
    locale?: string;
    subjectTemplate: string;
    contentType?: string;
    contentTemplate: string;
    variableSchema?: string;
    sensitiveVariableNames?: string;
    status?: number;
    systemBuiltin?: number;
    versionNo?: number;
    remark?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface EmailTemplateQuery extends PageQuery {
    templateName?: string;
    templateCode?: string;
    appCode?: string;
    sceneCode?: string;
    locale?: string;
    status?: number;
    systemBuiltin?: number;
}

export interface EmailTemplatePreviewRequest {
    subjectTemplate: string;
    contentTemplate: string;
    sensitiveVariableNames?: string;
    variables: Record<string, unknown>;
}

export interface EmailTemplatePreviewResponse {
    subject: string;
    content: string;
    maskedContent: string;
    missingVariables: string[];
}

export interface EmailRecord {
    id: number;
    emailNo: string;
    appCode: string;
    merchantId?: string;
    merchantNo?: string;
    merchantName?: string;
    sceneCode?: string;
    templateCode?: string;
    templateName?: string;
    locale?: string;
    accountId?: number;
    accountCode?: string;
    providerType?: string;
    fromName?: string;
    fromEmail?: string;
    replyToEmail?: string;
    toEmails?: string;
    ccEmails?: string;
    bccEmails?: string;
    subject?: string;
    contentSnapshot?: string;
    variablesSnapshot?: string;
    bizType?: string;
    bizNo?: string;
    sendStatus?: number;
    retryCount?: number;
    maxRetryCount?: number;
    nextRetryTime?: string;
    sendStartTime?: string;
    sendEndTime?: string;
    sendSuccessTime?: string;
    costMs?: number;
    errorCode?: string;
    errorMessage?: string;
    operatorId?: number;
    operatorName?: string;
    createBy?: string;
    createTime?: string;
    updateBy?: string;
    updateTime?: string;
}

export interface EmailRecordQuery extends PageQuery {
    emailNo?: string;
    appCode?: string;
    merchantId?: string;
    merchantName?: string;
    sceneCode?: string;
    templateCode?: string;
    toEmail?: string;
    sendStatus?: number;
    bizNo?: string;
}

export interface EmailSendResult {
    recordId: number;
    emailNo: string;
    sendStatus: number;
    errorCode?: string;
    errorMessage?: string;
}

export async function searchEmailAccounts(data: EmailAccountQuery) {
    const result = await http.post<CommonResult<PageResult<EmailAccount>>>('/admin/email/accounts/search', data);
    return unwrapResult(result.data);
}

export async function getEmailAccount(id: number) {
    const result = await http.get<CommonResult<EmailAccount>>(`/admin/email/accounts/${id}`);
    return unwrapResult(result.data);
}

export async function createEmailAccount(data: Partial<EmailAccount>) {
    const result = await http.post<CommonResult<EmailAccount>>('/admin/email/accounts', data);
    return unwrapResult(result.data);
}

export async function updateEmailAccount(id: number, data: Partial<EmailAccount>) {
    const result = await http.put<CommonResult<EmailAccount>>(`/admin/email/accounts/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateEmailAccountStatus(id: number, status: number) {
    const result = await http.put<CommonResult<EmailAccount>>(`/admin/email/accounts/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function setDefaultEmailAccount(id: number) {
    const result = await http.put<CommonResult<EmailAccount>>(`/admin/email/accounts/${id}/default`);
    return unwrapResult(result.data);
}

export async function testEmailAccount(id: number, data: EmailAccountTestRequest) {
    const result = await http.post<CommonResult<EmailSendResult>>(`/admin/email/accounts/${id}/test`, data);
    return unwrapResult(result.data);
}

export async function deleteEmailAccount(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/email/accounts/${id}`);
    return unwrapResult(result.data);
}

export async function searchEmailTemplates(data: EmailTemplateQuery) {
    const result = await http.post<CommonResult<PageResult<EmailTemplate>>>('/admin/email/templates/search', data);
    return unwrapResult(result.data);
}

export async function getEmailTemplate(id: number) {
    const result = await http.get<CommonResult<EmailTemplate>>(`/admin/email/templates/${id}`);
    return unwrapResult(result.data);
}

export async function createEmailTemplate(data: Partial<EmailTemplate>) {
    const result = await http.post<CommonResult<EmailTemplate>>('/admin/email/templates', data);
    return unwrapResult(result.data);
}

export async function updateEmailTemplate(id: number, data: Partial<EmailTemplate>) {
    const result = await http.put<CommonResult<EmailTemplate>>(`/admin/email/templates/${id}`, data);
    return unwrapResult(result.data);
}

export async function updateEmailTemplateStatus(id: number, status: number) {
    const result = await http.put<CommonResult<EmailTemplate>>(`/admin/email/templates/${id}/status`, { status });
    return unwrapResult(result.data);
}

export async function copyEmailTemplate(id: number) {
    const result = await http.post<CommonResult<EmailTemplate>>(`/admin/email/templates/${id}/copy`);
    return unwrapResult(result.data);
}

export async function previewEmailTemplate(data: EmailTemplatePreviewRequest) {
    const result = await http.post<CommonResult<EmailTemplatePreviewResponse>>('/admin/email/templates/preview', data);
    return unwrapResult(result.data);
}

export async function deleteEmailTemplate(id: number) {
    const result = await http.delete<CommonResult<void>>(`/admin/email/templates/${id}`);
    return unwrapResult(result.data);
}

export async function searchEmailRecords(data: EmailRecordQuery) {
    const result = await http.post<CommonResult<PageResult<EmailRecord>>>('/admin/email/records/search', data);
    return unwrapResult(result.data);
}

export async function getEmailRecord(id: number) {
    const result = await http.get<CommonResult<EmailRecord>>(`/admin/email/records/${id}`);
    return unwrapResult(result.data);
}

export async function resendEmailRecord(id: number) {
    const result = await http.post<CommonResult<EmailSendResult>>(`/admin/email/records/${id}/resend`);
    return unwrapResult(result.data);
}
