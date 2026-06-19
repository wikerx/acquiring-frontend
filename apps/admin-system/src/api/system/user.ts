import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import { http } from '@/api/http';
import { downloadExcel } from '@/utils/download';
import type { SysRole } from './role';

export interface SysUserAccount {
    accountId: number;
    userId: number;
    loginAccount: string;
    realName?: string;
    mobile?: string;
    email?: string;
    userType?: string;
    status?: number;
    locked?: number;
    lastLoginAt?: string;
    lastLoginIp?: string;
    createdAt?: string;
}

export interface SysUserAccountQuery extends PageQuery {
    loginAccount?: string;
    mobile?: string;
    email?: string;
    status?: number;
}

export interface SysUserAccountCreateRequest {
    loginAccount: string;
    password: string;
    realName: string;
    mobile?: string;
    email?: string;
}

export interface SysUserAccountUpdateRequest {
    accountId: number;
    realName?: string;
    mobile?: string;
    email?: string;
    status?: number;
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
        fileName: '用户列表.xlsx',
    });
}
