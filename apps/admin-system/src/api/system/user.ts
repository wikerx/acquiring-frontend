import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';
import type { SysRole } from './role';

export interface SysUserAccount {
    accountId: number;
    userId: number;
    deptId?: number;
    deptName?: string;
    postIds?: number[];
    postNames?: string[];
    roleIds?: number[];
    roleNames?: string[];
    loginAccount: string;
    realName?: string;
    mobile?: string;
    email?: string;
    userType?: string;
    status?: number;
    locked?: number;
    lastLoginAt?: string;
    lastLoginIp?: string;
    mfaPolicy?: string;
    mfaStatus?: string;
    mfaBindTime?: string;
    mfaLastVerifyTime?: string;
    mfaExemptUntil?: string;
    mfaLockedUntil?: string;
    remark?: string;
    createdAt?: string;
}

export interface SysUserAccountQuery extends PageQuery {
    loginAccount?: string;
    mobile?: string;
    email?: string;
    deptId?: number;
    status?: number;
}

export interface SysUserAccountCreateRequest {
    loginAccount: string;
    password: string;
    realName: string;
    deptId?: number;
    postIds?: number[];
    mobile?: string;
    email?: string;
    status?: number;
    remark?: string;
}

export interface SysUserAccountUpdateRequest {
    accountId: number;
    realName?: string;
    deptId?: number;
    postIds?: number[];
    mobile?: string;
    email?: string;
    status?: number;
    remark?: string;
}

export interface SysUserAccountStatusRequest {
    accountId: number;
    status: number;
}

export interface SysUserAccountResetPasswordRequest {
    accountId: number;
    password: string;
}

export interface SysUserRoleAuth {
    accountId: number;
    roles: SysRole[];
    checkedRoleIds: number[];
}

export interface SysUserRoleGrantRequest {
    accountId: number;
    roleIds: number[];
}

export interface SysUserMfaActionRequest {
    accountId: number;
    reason: string;
}

export interface SysUserMfaExemptRequest extends SysUserMfaActionRequest {
    exemptUntil?: string;
}

export interface SysUserMfaStatusResponse {
    accountId: number;
    loginAccount: string;
    mfaPolicy: string;
    mfaStatus: string;
    bindTime?: string;
    lastVerifyTime?: string;
    lockedUntil?: string;
    exemptUntil?: string;
}

export interface SysUserMfaLogQuery extends PageQuery {
    accountId?: number;
    loginAccount?: string;
    actionType?: string;
    result?: string;
    queryTimeZone?: string;
    beginTime?: string;
    endTime?: string;
}

export interface SysUserMfaLog {
    id: number;
    accountId: number;
    loginAccount?: string;
    actionType?: string;
    result?: string;
    reason?: string;
    beforePolicy?: string;
    beforeStatus?: string;
    afterPolicy?: string;
    afterStatus?: string;
    operatorLoginAccount?: string;
    clientIp?: string;
    eventTime?: string;
}

export async function searchUsers(requestBody: SysUserAccountQuery) {
    const result = await http.post<CommonResult<PageResult<SysUserAccount>>>(
        '/admin/system/users/search',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function createUser(requestBody: SysUserAccountCreateRequest) {
    const result = await http.post<CommonResult<SysUserAccount>>(
        '/admin/system/users/create',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateUser(requestBody: SysUserAccountUpdateRequest) {
    const result = await http.post<CommonResult<SysUserAccount>>(
        '/admin/system/users/update',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function updateUserStatus(requestBody: SysUserAccountStatusRequest) {
    const result = await http.post<CommonResult<void>>(
        '/admin/system/users/status',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function resetUserPassword(requestBody: SysUserAccountResetPasswordRequest) {
    const result = await http.post<CommonResult<void>>(
        '/admin/system/users/reset-password',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function getUserRoles(requestBody: { accountId: number }) {
    const result = await http.post<CommonResult<SysUserRoleAuth>>(
        '/admin/system/users/roles',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function grantUserRoles(requestBody: SysUserRoleGrantRequest) {
    const result = await http.post<CommonResult<void>>(
        '/admin/system/users/roles/grant',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function deleteUsers(accountIds: number[]) {
    const result = await http.post<CommonResult<void>>(
        '/admin/system/users/delete',
        accountIds,
    );
    return unwrapResult(result.data);
}

export async function exportUsers(requestBody: SysUserAccountQuery) {
    await downloadExcel('/admin/system/users/export', {
        method: 'post',
        data: requestBody,
    });
}

export async function requireUserMfa(requestBody: SysUserMfaActionRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/require',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function resetUserMfa(requestBody: SysUserMfaActionRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/reset',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function exemptUserMfa(requestBody: SysUserMfaExemptRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/exempt',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function disableUserMfa(requestBody: SysUserMfaActionRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/disable',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function unlockUserMfa(requestBody: SysUserMfaActionRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/unlock',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function resendUserMfaBindMail(requestBody: SysUserMfaActionRequest) {
    const result = await http.post<CommonResult<SysUserMfaStatusResponse>>(
        '/admin/system/users/mfa/resend-bind-mail',
        requestBody,
    );
    return unwrapResult(result.data);
}

export async function searchUserMfaLogs(requestBody: SysUserMfaLogQuery) {
    const result = await http.post<CommonResult<PageResult<SysUserMfaLog>>>(
        '/admin/system/users/mfa/logs/search',
        requestBody,
    );
    return unwrapResult(result.data);
}
