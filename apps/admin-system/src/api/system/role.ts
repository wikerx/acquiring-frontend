import type { CommonResult, PageQuery, PageResult } from '@acquiring/shared';
import { unwrapResult } from '@acquiring/shared';
import request from '@/utils/request';
import type { SysMenu } from './menu';

export interface SysRole {
    roleId: number;
    roleCode: string;
    roleName: string;
    roleType?: string;
    dataScope?: string;
    description?: string;
    status?: number;
    sortNo?: number;
    menuCount?: number;
    permissionCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface SysRoleQuery extends PageQuery {
    roleCode?: string;
    roleName?: string;
    status?: number;
}

export interface SysRoleCreateRequest {
    roleCode: string;
    roleName: string;
    dataScope?: string;
    description?: string;
    sortNo?: number;
}

export interface SysRoleUpdateRequest {
    roleId: number;
    roleName?: string;
    dataScope?: string;
    description?: string;
    status?: number;
    sortNo?: number;
}

export interface SysRoleStatusRequest {
    roleId: number;
    status: number;
}

export interface SysRoleDeleteRequest {
    roleId: number;
}

export interface SysPermission {
    permissionId: number;
    permissionCode: string;
    permissionName: string;
    resourceType?: string;
    resourcePath?: string;
    httpMethod?: string;
    description?: string;
    status?: number;
}

export interface SysRoleMenuAuth {
    roleId: number;
    menus: SysMenu[];
    checkedMenuIds: number[];
}

export interface SysRolePermissionAuth {
    roleId: number;
    permissions: SysPermission[];
    checkedPermissionIds: number[];
}

export interface SysRoleMenuGrantRequest {
    roleId: number;
    menuIds: number[];
}

export interface SysRolePermissionGrantRequest {
    roleId: number;
    permissionIds: number[];
}

export async function searchRoles(requestBody: SysRoleQuery) {
    const result = await request.post<CommonResult<PageResult<SysRole>>>(
        '/admin/system/roles/search',
        requestBody,
    ) as unknown as CommonResult<PageResult<SysRole>>;
    return unwrapResult(result);
}

export async function createRole(requestBody: SysRoleCreateRequest) {
    const result = await request.post<CommonResult<SysRole>>(
        '/admin/system/roles/create',
        requestBody,
    ) as unknown as CommonResult<SysRole>;
    return unwrapResult(result);
}

export async function updateRole(requestBody: SysRoleUpdateRequest) {
    const result = await request.post<CommonResult<SysRole>>(
        '/admin/system/roles/update',
        requestBody,
    ) as unknown as CommonResult<SysRole>;
    return unwrapResult(result);
}

export async function updateRoleStatus(requestBody: SysRoleStatusRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/roles/status',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function deleteRole(requestBody: SysRoleDeleteRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/roles/delete',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function getRoleMenus(requestBody: { roleId: number }) {
    const result = await request.post<CommonResult<SysRoleMenuAuth>>(
        '/admin/system/roles/menus',
        requestBody,
    ) as unknown as CommonResult<SysRoleMenuAuth>;
    return unwrapResult(result);
}

export async function grantRoleMenus(requestBody: SysRoleMenuGrantRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/roles/menus/grant',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}

export async function getRolePermissions(requestBody: { roleId: number }) {
    const result = await request.post<CommonResult<SysRolePermissionAuth>>(
        '/admin/system/roles/permissions',
        requestBody,
    ) as unknown as CommonResult<SysRolePermissionAuth>;
    return unwrapResult(result);
}

export async function grantRolePermissions(requestBody: SysRolePermissionGrantRequest) {
    const result = await request.post<CommonResult<void>>(
        '/admin/system/roles/permissions/grant',
        requestBody,
    ) as unknown as CommonResult<void>;
    return unwrapResult(result);
}
