import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';

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

export async function searchUsers(requestBody: SysUserAccountQuery) {
    const result = await request.post<CommonResult<PageResult<SysUserAccount>>>(
        '/admin/system/users/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysUserAccount>>;
    return unwrapResult(result);
}

export async function createUser(requestBody: SysUserAccountCreateRequest) {
    const result = await request.post<CommonResult<SysUserAccount>>(
        '/admin/system/users/create',
        requestBody,
    ) as unknown as CommonResult<SysUserAccount>;
    return unwrapResult(result);
}

export async function updateUser(requestBody: SysUserAccountUpdateRequest) {
    const result = await request.post<CommonResult<SysUserAccount>>(
        '/admin/system/users/update',
        requestBody,
    ) as unknown as CommonResult<SysUserAccount>;
    return unwrapResult(result);
}

export async function updateUserStatus(requestBody: SysUserAccountStatusRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/users/status',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function resetUserPassword(requestBody: SysUserAccountResetPasswordRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/users/reset-password',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}
